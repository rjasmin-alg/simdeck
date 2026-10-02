/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lora-mesh: how one message travels in four kinds of low-power radio network, adopted from
   single-page-labs/lora-mesh-usporedba-v3.html. Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it.

   The field is W × H units. End nodes 1..n sit where a seeded generator puts them (the first n of 42 positions, so
   more nodes only add nodes). Two nodes hear each other within `range` % of H. One step is one radio round:
     star (LoRaWAN):  gateways are extra nodes; end nodes never forward. Round 1: the source's uplink, heard by every
                      gateway in range. Round 2: the network server, over IP (no radio), picks the gateway nearest the
                      destination. Round 3: that gateway's downlink. No gateway in range of either end: no route.
                      Nearest is by distance, then by id.
     flood:           managed flooding. Each round every node of the frontier rebroadcasts once; every node in range
                      that has not heard the message yet hears it now. Only some of the new nodes rebroadcast in the
                      next round (the original's suppression: even position in the round's list, the destination, or
                      a seeded draw > 0.42). Stops when the destination has heard it, the frontier is empty, or after
                      HOP_LIMIT rounds.
     relay:           dedicated repeaters. A direct link is used when there is one; otherwise the shortest chain
                      source → repeaters → destination, through repeaters only (companions never relay).
     manet:           every node routes: the shortest path in the current graph.
   Paths are breadth-first with neighbours in id order, so ties go to the lower id. A transmission counts once per
   sender per round (a broadcast is one transmission, however many hear it). With a duty-cycle limit (dutyPct > 0;
   0 is off), a node may transmit at most dutyPct % of a 60 s window; the transmission that would exceed it is blocked and the run stops. */
(function (root) {
  'use strict';

  var W = 1000, H = 560, MARGIN = 55, MAX_NODES = 42, HOP_LIMIT = 8, WINDOW = 60;
  var MODES = ['star', 'flood', 'relay', 'manet'];

  var defaults = {
    mode: 'flood', nodes: 18, range: 30, seed: 28, src: 1, dst: 18,
    dutyPct: 1, airtime: 350, flip: 0
  };

  /** mulberry32, the same generator as Simdeck.rng. */
  function rng(seed) {
    var a = seed >>> 0;
    function r() {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    r.int = function (n) { return Math.floor(r() * n); };
    return r;
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function bit(mask, i) { return Math.floor(mask / Math.pow(2, i)) % 2 === 1; }

  /** Node ids 0..n-1 are end nodes (shown as 1..n); in the star, gateways follow as n..n+g-1. */
  function gatewayCount(n) { return Math.max(1, Math.min(3, Math.round(n / 12))); }
  /** The original's starting repeaters: about one in eight, at nodes 3, 9, 15, … (ids 2, 8, 14, …). */
  function defaultRepeater(i, n) {
    var wanted = Math.max(1, Math.round(n / 8));
    for (var k = 0; k < wanted; k++) if (Math.min(n - 1, 2 + k * 6) === i) return true;
    return false;
  }
  /** `flip` is a bit mask over end-node ids: bit i turns node i's repeater role the other way. */
  function isRepeater(p, i) { return defaultRepeater(i, p.nodes) !== bit(p.flip, i); }
  function toggleRepeater(p, i) {
    var w = Math.pow(2, i);
    return bit(p.flip, i) ? p.flip - w : p.flip + w;
  }

  function nodesOf(p) {
    var r = rng(p.seed * 7919 + 17), out = [];
    for (var i = 0; i < MAX_NODES; i++) {
      var x = MARGIN + r() * (W - 2 * MARGIN), y = MARGIN + r() * (H - 2 * MARGIN);
      if (i < p.nodes) out.push({ id: i, x: Math.round(x), y: Math.round(y), gw: false, rep: p.mode === 'relay' && isRepeater(p, i) });
    }
    if (p.mode === 'star') {
      var g = gatewayCount(p.nodes);
      for (var k = 0; k < g; k++) {
        out.push({ id: p.nodes + k, x: Math.round((k + 1) * W / (g + 1)), y: Math.round(H * 0.3 + (k % 2) * 85), gw: true, rep: false });
      }
    }
    return out;
  }

  function reach(p) { return H * p.range / 100; }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  /** Radio links [a, b] with a < b. In the star only gateway–end node pairs: end nodes do not talk to each other. */
  function links(p, nodes) {
    nodes = nodes || nodesOf(p);
    var rr = reach(p), out = [];
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        if (dist(nodes[i], nodes[j]) > rr) continue;
        if (p.mode === 'star' && nodes[i].gw === nodes[j].gw) continue;
        out.push([nodes[i].id, nodes[j].id]);
      }
    }
    return out;
  }

  function neighbours(lk, i) {
    var out = [];
    lk.forEach(function (l) { if (l[0] === i) out.push(l[1]); else if (l[1] === i) out.push(l[0]); });
    return out.sort(function (a, b) { return a - b; });
  }

  /** Breadth-first shortest path from s to d over nodes that pass `ok` (s itself always may start). */
  function bfs(lk, s, d, ok) {
    var prev = {}, q = [s];
    prev[s] = -1;
    while (q.length) {
      var u = q.shift();
      if (u === d) break;
      neighbours(lk, u).forEach(function (v) {
        if (!(v in prev) && (!ok || ok(v))) { prev[v] = u; q.push(v); }
      });
    }
    if (!(d in prev)) return null;
    var path = [];
    for (var x = d; x !== -1; x = prev[x]) path.push(x);
    return path.reverse();
  }

  function pathRounds(path) {
    if (!path) return [];
    var out = [];
    for (var i = 0; i + 1 < path.length; i++) out.push([{ kind: 'tx', from: path[i], to: [path[i + 1]], hop: i + 1 }]);
    return out;
  }

  /** The message's rounds before any duty-cycle limit: [[{ kind: 'tx' | 'ip', from, to: [ids], hop }]]. */
  function plan(p, nodes) {
    nodes = nodes || nodesOf(p);
    var lk = links(p, nodes), s = p.src - 1, d = p.dst - 1;
    if (s === d) return [];
    if (p.mode === 'star') {
      var near = function (end) {
        var e = nodes.filter(function (n) { return n.id === end; })[0];
        return nodes.filter(function (n) { return n.gw && dist(n, e) <= reach(p); })
          .sort(function (a, b) { return dist(a, e) - dist(b, e) || a.id - b.id; })
          .map(function (n) { return n.id; });
      };
      var gs = near(s), gd = near(d);
      if (!gs.length || !gd.length) return [];
      return [
        [{ kind: 'tx', from: s, to: gs, hop: 1 }],
        [{ kind: 'ip', from: gs[0], to: [gd[0]], hop: 1 }],
        [{ kind: 'tx', from: gd[0], to: [d], hop: 2 }]
      ];
    }
    if (p.mode === 'flood') {
      var r = rng(p.seed * 104729 + p.src * 31 + p.dst), seen = {}, frontier = [s], rounds = [], hop = 0;
      seen[s] = true;
      while (frontier.length && !seen[d] && hop < HOP_LIMIT) {
        hop++;
        var round = [], fresh = [];
        frontier.forEach(function (u) {
          var heard = neighbours(lk, u).filter(function (v) { return !seen[v]; });
          heard.forEach(function (v) { seen[v] = true; fresh.push(v); });
          round.push({ kind: 'tx', from: u, to: heard, hop: hop });
        });
        rounds.push(round);
        frontier = fresh.filter(function (v, i) { var draw = r(); return v === d || i % 2 === 0 || draw > 0.42; });
      }
      return rounds;
    }
    if (p.mode === 'relay') {
      if (neighbours(lk, s).indexOf(d) >= 0) return pathRounds([s, d]);
      var byId = {};
      nodes.forEach(function (n) { byId[n.id] = n; });
      var rep = function (i) { return byId[i].rep; };
      var starts = rep(s) ? [s] : neighbours(lk, s).filter(rep);
      var ends = rep(d) ? [d] : neighbours(lk, d).filter(rep);
      var best = null;
      starts.forEach(function (a) {
        ends.forEach(function (b) {
          var path = bfs(lk, a, b, function (v) { return rep(v) || v === s || v === d; });
          if (!path) return;
          if (path[0] !== s) path.unshift(s);
          if (path[path.length - 1] !== d) path.push(d);
          if (!best || path.length < best.length) best = path;
        });
      });
      return pathRounds(best);
    }
    return pathRounds(bfs(lk, s, d));
  }

  function initial(p) {
    return { round: 0, tx: 0, air: 0, perNode: {}, heard: [p.src - 1], hops: 0, active: [], blocked: null, status: 'ready' };
  }

  /** Round n of plan(p) (`nodes` replaces the seeded field, for tests). With the limit on, a sender whose airtime in the window would exceed duty % is blocked. */
  function step(prev, n, p, nodes) {
    var s = clone(prev), rounds = plan(p, nodes), air = p.airtime / 1000, legal = WINDOW * p.dutyPct / 100;
    s.round = n;
    s.active = [];
    if (s.status === 'duty' || s.status === 'delivered') return s;
    var round = rounds[n - 1];
    if (!round) { s.status = rounds.length ? s.status : 'noroute'; return finish(s, p, rounds); }
    for (var i = 0; i < round.length; i++) {
      var e = round[i];
      if (e.kind === 'tx') {
        var used = ((s.perNode[e.from] || 0) + 1) * air;
        if (p.dutyPct > 0 && used > legal + 1e-9) { s.blocked = e.from; s.status = 'duty'; return s; }
        s.perNode[e.from] = (s.perNode[e.from] || 0) + 1;
        s.tx += 1;
        s.air = Math.round((s.air + air) * 1000) / 1000;
        s.hops = Math.max(s.hops, e.hop);
      }
      e.to.forEach(function (v) { if (s.heard.indexOf(v) < 0) s.heard.push(v); });
      s.active.push(e);
    }
    s.status = 'running';
    return finish(s, p, rounds);
  }

  function finish(s, p, rounds) {
    var d = p.dst - 1;
    if (s.heard.indexOf(d) >= 0 && (p.mode !== 'star' || s.round >= 3)) s.status = 'delivered';
    else if (s.round >= rounds.length) s.status = rounds.length ? 'lost' : 'noroute';
    return s;
  }

  /** One step per round, until the message arrives, the run is blocked, or the rounds run out; at least one. */
  function steps(p, nodes) {
    var rounds = plan(p, nodes);
    if (!rounds.length) return 1;
    var s = initial(p);
    for (var n = 1; n <= rounds.length; n++) {
      s = step(s, n, p, nodes);
      if (s.status === 'duty' || s.status === 'delivered') return n;
    }
    return rounds.length;
  }

  /** Airtime of the busiest sender and its allowance in the window, in seconds, and the bar's percentage. */
  function load(s, p) {
    var air = p.airtime / 1000, legal = WINDOW * p.dutyPct / 100, most = 0;
    Object.keys(s.perNode).forEach(function (k) { most = Math.max(most, s.perNode[k]); });
    var busiest = most * air;
    var pct = p.dutyPct > 0 ? busiest / legal * 100 : s.tx * air / WINDOW * 100;
    return { busiest: Math.round(busiest * 1000) / 1000, legal: legal, pct: Math.round(pct * 10) / 10 };
  }

  var logic = {
    W: W, H: H, MAX_NODES: MAX_NODES, HOP_LIMIT: HOP_LIMIT, WINDOW: WINDOW, MODES: MODES,
    defaults: defaults, steps: steps, initial: initial, step: step,
    rng: rng, nodesOf: nodesOf, links: links, neighbours: neighbours, bfs: bfs, plan: plan, reach: reach,
    gatewayCount: gatewayCount, isRepeater: isRepeater, toggleRepeater: toggleRepeater, load: load
  };
  if (typeof module === 'object' && module.exports) module.exports = logic; else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
