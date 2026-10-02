/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for radio-networks: a conventional network, a trunked (TETRA-style) network and a mesh, adopted from
   single-page-labs/radio-network-demos.html. Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it.

   conv / trunk: one step is one time slot (the original's 1 s tick). Calls arrive from a seeded schedule that
   depends only on seed and load, so both networks see the same demand at the same step. In each slot, in this order:
     1. every active call counts down; a call that reaches 0 ends and frees its channel;
     2. trunk: waiting calls get free channels, first come first served (arrival slot, then call id);
     3. new calls of this slot, in id order:
        conv: team i may only use its own channel i. No channel i (i > channels) or channel i busy: blocked (lost).
        trunk: the lowest free channel of the shared pool; none free: the call joins the queue.
   mesh: one step is one hop of a flood from the source. Links join two working nodes within radio range; a node
   that is down neither sends nor relays. Each hop reaches the neighbours of the last frontier not reached before
   (in id order); the first frontier node to reach a node is its parent, so the route found is a shortest path
   with ties broken by node id (the original's breadth-first search). The flood stops after ttl hops. */
(function (root) {
  'use strict';

  var SLOTS = 20;
  var TEAMS = ['ops', 'sec', 'med', 'log'];
  /** Radios of the conventional and trunked views: team (talkgroup) and position, in a 760 × 340 drawing. */
  var UNITS = [
    { id: 'R1', x: 60, y: 100, team: 'ops' },
    { id: 'R2', x: 90, y: 260, team: 'ops' },
    { id: 'R3', x: 290, y: 40, team: 'sec' },
    { id: 'R4', x: 430, y: 295, team: 'med' },
    { id: 'R5', x: 660, y: 80, team: 'log' },
    { id: 'R6', x: 690, y: 270, team: 'sec' }
  ];
  /** Mesh nodes, in the same 760 × 340 drawing. */
  var NODES = [
    { id: 'A', x: 90, y: 130 },
    { id: 'B', x: 220, y: 80 },
    { id: 'C', x: 220, y: 210 },
    { id: 'D', x: 360, y: 70 },
    { id: 'E', x: 360, y: 190 },
    { id: 'F', x: 510, y: 110 },
    { id: 'G', x: 510, y: 240 },
    { id: 'H', x: 650, y: 160 }
  ];
  var NODE_IDS = NODES.map(function (n) { return n.id; });
  var BY_ID = {};
  NODES.forEach(function (n) { BY_ID[n.id] = n; });

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

  /** Call requests per slot 1..SLOTS: at most one per slot, with probability load / 5, lasting 3–7 slots (mean 5),
      so the offered traffic is `load` erlang. Every slot draws the same three numbers whatever the load, so a higher
      load only adds calls: the calls of a lower load keep their slot, team and length. */
  function schedule(p) {
    var r = rng(p.seed * 7919 + 17);
    var out = [], k = 0;
    for (var slot = 1; slot <= SLOTS; slot++) {
      var a = r(), team = TEAMS[r.int(TEAMS.length)], dur = 3 + r.int(5);
      out.push(a < p.load / 5 ? [{ id: 'C' + (++k), team: team, dur: dur, at: slot }] : []);
    }
    return out;
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** Lowest channel 1..n not carrying an active call, or 0. */
  function freeChannel(active, n) {
    var used = {};
    active.forEach(function (c) { used[c.ch] = true; });
    for (var i = 1; i <= n; i++) if (!used[i]) return i;
    return 0;
  }

  // ── conventional and trunked ──

  function loadInitial(p) {
    return {
      net: p.net, slot: 0, active: [], queue: [], arrived: [], granted: [], blocked: [], ended: [],
      total: { offered: 0, served: 0, blocked: 0, waited: 0, waitSlots: 0, busySlots: 0 }
    };
  }

  /** One slot of the conventional or trunked network; `demand` is that slot's calls (schedule(p)[n - 1]). */
  function loadStep(prev, n, p, demand) {
    var s = clone(prev);
    s.slot = n;
    s.arrived = demand.map(function (c) { return c.id; });
    s.granted = [];
    s.blocked = [];
    s.ended = [];
    // 1. calls count down and end
    s.active.forEach(function (c) { c.left -= 1; });
    s.ended = s.active.filter(function (c) { return c.left <= 0; }).map(function (c) { return c.id; });
    s.active = s.active.filter(function (c) { return c.left > 0; });
    // 2. trunk: the queue first
    if (p.net === 'trunk') {
      s.queue.forEach(function (q) { q.waited = n - q.at; });
      while (s.queue.length && freeChannel(s.active, p.channels)) {
        var q = s.queue.shift();
        var ch = freeChannel(s.active, p.channels);
        s.active.push({ id: q.id, team: q.team, ch: ch, left: q.dur, dur: q.dur });
        s.granted.push(q.id);
        s.total.served += 1;
        s.total.waited += 1;
        s.total.waitSlots += n - q.at;
      }
    }
    // 3. this slot's calls
    demand.forEach(function (c) {
      s.total.offered += 1;
      if (p.net === 'conv') {
        var own = TEAMS.indexOf(c.team) + 1;
        var why = own > p.channels ? 'nochan' : s.active.some(function (a) { return a.ch === own; }) ? 'busy' : '';
        if (why) {
          s.blocked.push({ id: c.id, team: c.team, why: why, ch: own });
          s.total.blocked += 1;
        } else {
          s.active.push({ id: c.id, team: c.team, ch: own, left: c.dur, dur: c.dur });
          s.granted.push(c.id);
          s.total.served += 1;
        }
      } else {
        var free = freeChannel(s.active, p.channels);
        if (free) {
          s.active.push({ id: c.id, team: c.team, ch: free, left: c.dur, dur: c.dur });
          s.granted.push(c.id);
          s.total.served += 1;
        } else {
          s.queue.push({ id: c.id, team: c.team, dur: c.dur, at: n, waited: 0 });
        }
      }
    });
    s.active.sort(function (a, b) { return a.ch - b.ch; });
    s.total.busySlots += s.active.length;
    return s;
  }

  // ── mesh ──

  /** The node ids that are down: from the `down` string, never the source or the destination, in id order. */
  function downSet(p) {
    return NODE_IDS.filter(function (id) { return p.down.indexOf(id) >= 0 && id !== p.src && id !== p.dst; });
  }

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  /** Links between working nodes within range, each as [a, b] with a before b in id order. */
  function links(p) {
    var down = downSet(p), out = [];
    for (var i = 0; i < NODES.length; i++) {
      for (var j = i + 1; j < NODES.length; j++) {
        var a = NODES[i], b = NODES[j];
        if (down.indexOf(a.id) < 0 && down.indexOf(b.id) < 0 && dist(a, b) <= p.range) out.push([a.id, b.id]);
      }
    }
    return out;
  }

  /** Neighbours of every node, in id order. */
  function adjacency(p) {
    var adj = {};
    NODE_IDS.forEach(function (id) { adj[id] = []; });
    links(p).forEach(function (l) { adj[l[0]].push(l[1]); adj[l[1]].push(l[0]); });
    NODE_IDS.forEach(function (id) { adj[id].sort(); });
    return adj;
  }

  /** Hops from src to dst over the whole graph, ignoring ttl; -1 when no route exists. */
  function hopsTo(p) {
    var adj = adjacency(p), seen = {}, frontier = [p.src], d = 0;
    seen[p.src] = true;
    while (frontier.length) {
      if (frontier.indexOf(p.dst) >= 0) return d;
      var next = [];
      frontier.forEach(function (x) { adj[x].forEach(function (y) { if (!seen[y]) { seen[y] = true; next.push(y); } }); });
      frontier = next;
      d += 1;
    }
    return -1;
  }

  function routeTo(parent, id) {
    var path = [id];
    while (parent[id]) { id = parent[id]; path.unshift(id); }
    return path;
  }

  function meshInitial(p) {
    var hop = {}, parent = {};
    hop[p.src] = 0;
    parent[p.src] = null;
    return {
      net: 'mesh', hop: 0, frontier: [p.src], reached: hop, parent: parent,
      fresh: [p.src], route: p.src === p.dst ? [p.src] : null, found: p.src === p.dst ? 0 : -1,
      sent: 0, stalled: false, hopsTo: hopsTo(p)
    };
  }

  function meshStep(prev, n, p) {
    var s = clone(prev), adj = adjacency(p), next = [];
    s.hop = n;
    // every frontier node retransmits once
    s.sent += s.frontier.length;
    s.frontier.forEach(function (x) {
      adj[x].forEach(function (y) {
        if (y in s.reached) return;
        s.reached[y] = n;
        s.parent[y] = x;
        next.push(y);
      });
    });
    s.fresh = next.slice();
    s.stalled = next.length === 0;
    s.frontier = next;
    if (!s.route && next.indexOf(p.dst) >= 0) { s.route = routeTo(s.parent, p.dst); s.found = n; }
    return s;
  }

  // ── the controller's interface ──

  var logic = {
    SLOTS: SLOTS,
    TEAMS: TEAMS,
    UNITS: UNITS,
    NODES: NODES,
    NODE_IDS: NODE_IDS,
    BY_ID: BY_ID,
    defaults: { net: 'conv', mode: 'repeater', channels: 3, load: 3, seed: 1, range: 170, src: 'A', dst: 'H', ttl: 5, down: 'D' },
    /** conv and trunk: SLOTS time slots; mesh: one step per hop of the flood, ttl of them. */
    steps: function (p) { return p.net === 'mesh' ? p.ttl : SLOTS; },
    initial: function (p) { return p.net === 'mesh' ? meshInitial(p) : loadInitial(p); },
    step: function (s, n, p) { return p.net === 'mesh' ? meshStep(s, n, p) : loadStep(s, n, p, schedule(p)[n - 1] || []); },
    loadStep: loadStep,
    schedule: schedule,
    downSet: downSet,
    links: links,
    adjacency: adjacency,
    hopsTo: hopsTo,
    /** Every subset of the node ids as a sorted string, '' first: the values the hidden `down` param takes. */
    downValues: function () {
      var out = [];
      for (var m = 0; m < 1 << NODE_IDS.length; m++) {
        out.push(NODE_IDS.filter(function (id, i) { return m & (1 << i); }).join(''));
      }
      return out;
    },
    /** `down` with one node switched; the source and the destination cannot be switched off. */
    toggleDown: function (p, id) {
      if (id === p.src || id === p.dst || NODE_IDS.indexOf(id) < 0) return p.down;
      var has = p.down.indexOf(id) >= 0;
      return NODE_IDS.filter(function (x) { return x === id ? !has : p.down.indexOf(x) >= 0; }).join('');
    },
    /** The team's own channel in the conventional network (ops 1, sec 2, med 3, log 4). */
    ownChannel: function (team) { return TEAMS.indexOf(team) + 1; }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
