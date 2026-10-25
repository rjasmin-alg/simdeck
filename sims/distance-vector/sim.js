/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for distance-vector: RIP-style distance vector routing in synchronous rounds (RFC 2453 §3.4, §3.9.2).
   Every round each router sends its table (as it was at the start of the round) to its neighbours; each router then
   processes the vectors it received in the sender's name order. Hop count metric, 16 = unreachable, the current next
   hop is always believed, split horizon and poisoned reverse as a mode. A cut link or a network going down is a step
   of its own. Rules, tie-breaks and every expected number: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The round and event functions work on plain
   data (a scene, tables, links), so they can move to models/ unchanged. */
(function (root) {
  'use strict';

  var INF = 16;             // RIP's infinity: unreachable (RFC 2453 §3.4.1)
  var MAX_STEPS = 20;       // contract: a stepper has at most 20 steps
  var MAX_CODE = Math.pow(6, MAX_STEPS) - 1;   // events as a number: one base-6 digit per step (eventsOf)

  /** The three scenes: routers, links (cost 1) and the networks with the router they are attached to. */
  var SCENES = {
    line: { routers: ['A', 'B', 'C'], links: [['A', 'B'], ['B', 'C']], nets: { N: 'C' } },
    ring: { routers: ['A', 'B', 'C', 'D'], links: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['A', 'D']], nets: { N: 'C' } },
    triangle: { routers: ['A', 'B', 'C', 'D'], links: [['A', 'B'], ['A', 'C'], ['B', 'C'], ['C', 'D']], nets: { N: 'D' } }
  };

  function linkId(a, b) { return a < b ? a + '-' + b : b + '-' + a; }
  function byName(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  function sceneOf(p) { return SCENES[p.topo] || SCENES.line; }

  /** Neighbours of r over the links that are up, in name order. */
  function neighbours(links, r) {
    var out = [];
    links.forEach(function (l) {
      if (!l.up) return;
      if (l.a === r) out.push(l.b);
      else if (l.b === r) out.push(l.a);
    });
    return out.sort(byName);
  }

  /** Cold tables: each network's own router has it directly connected (metric 1, no next hop); the rest is empty. */
  function coldTables(scene) {
    var t = {};
    scene.routers.forEach(function (r) { t[r] = {}; });
    Object.keys(scene.nets).forEach(function (n) { t[scene.nets[n]][n] = { metric: 1, via: null }; });
    return t;
  }

  /**
   * The vectors of one round, from the tables at the start of the round (rule 1). One ad per entry per direction of
   * every up link; a router without entries sends nothing. Split horizon holds back a route towards the neighbour it
   * was learned from (sent: 'suppressed'); poisoned reverse sends it with metric 16 ('poison') (rule 8).
   */
  function adsOf(tables, links, mode) {
    var ads = [];
    Object.keys(tables).sort(byName).forEach(function (from) {
      neighbours(links, from).forEach(function (to) {
        Object.keys(tables[from]).sort(byName).forEach(function (dest) {
          var e = tables[from][dest];
          var sent = 'full', metric = e.metric;
          if (e.via === to && mode === 'split') sent = 'suppressed';
          else if (e.via === to && mode === 'poison') { sent = 'poison'; metric = INF; }
          ads.push({ from: from, to: to, dest: dest, metric: metric, sent: sent, used: false });
        });
      });
    });
    return ads;
  }

  /**
   * One offer of metric m (already + 1, capped at 16) from neighbour s for dest at router r, against r's table as it
   * stands. Returns the change, or null. Rules 4 (no route, or strictly lower), 5 (the current next hop is believed),
   * 6 (equal from another neighbour does not replace).
   */
  function offer(table, r, s, dest, m) {
    var cur = table[dest];
    var from = cur ? { metric: cur.metric, via: cur.via } : null;
    if (cur && cur.via === s) {
      if (m === cur.metric) return null;
      table[dest] = { metric: m, via: s };
      return { r: r, dest: dest, from: from, to: { metric: m, via: s }, by: s, why: 'nexthop' };
    }
    if ((!cur && m < INF) || (cur && m < cur.metric)) {
      table[dest] = { metric: m, via: s };
      return { r: r, dest: dest, from: from, to: { metric: m, via: s }, by: s, why: cur ? 'better' : 'new' };
    }
    return null;
  }

  /**
   * One synchronous round: vectors from the snapshot, then every router processes what it received in the sender's
   * name order (rule 6a). Returns { tables, ads, changes }; the input is not changed.
   */
  function round(tables, links, mode) {
    var ads = adsOf(tables, links, mode);
    var next = clone(tables), changes = [];
    Object.keys(next).sort(byName).forEach(function (r) {
      ads.forEach(function (ad) {   // ads are sorted by sender, so this is the sender's name order
        if (ad.to !== r || ad.sent === 'suppressed') return;
        var ch = offer(next[r], r, ad.from, ad.dest, Math.min(ad.metric + 1, INF));
        if (ch) { ad.used = true; changes.push(ch); }
      });
    });
    return { tables: next, ads: ads, changes: changes };
  }

  /** Tables after rounds from cold until a round changes nothing (the converged start). */
  function convergedTables(scene, mode) {
    var links = linksOf(scene), t = coldTables(scene);
    for (var i = 0; i < MAX_STEPS; i++) {
      var r = round(t, links, mode);
      if (!r.changes.length) break;
      t = r.tables;
    }
    return t;
  }

  function linksOf(scene) {
    return scene.links.map(function (l) { return { id: linkId(l[0], l[1]), a: l[0] < l[1] ? l[0] : l[1], b: l[0] < l[1] ? l[1] : l[0], up: true }; });
  }

  /** Routers with no path over up links to a router whose network dest is up (true reachability, not the tables). */
  function cutOffFrom(scene, links, nets, dest) {
    var reach = {};
    var net = nets[dest];
    if (net && net.up) {
      var queue = [net.at];
      reach[net.at] = true;
      while (queue.length) {
        var r = queue.shift();
        neighbours(links, r).forEach(function (n) { if (!reach[n]) { reach[n] = true; queue.push(n); } });
      }
    }
    return scene.routers.filter(function (r) { return !reach[r]; });
  }

  /**
   * The events of a run: { step: { kind: 'down', dest } | { kind: 'cut', link } }. p.events is a number so that the
   * kit can keep it in the URL: one base-6 digit per step, step 1 the lowest (0 nothing, 1 network N down, 2 + i cut
   * the scene's link i). The text form "1:down,3:cut:B-C" (presets, tests) is accepted too. Malformed, unknown or
   * out-of-range entries are ignored; in the text form two for one step keep the first.
   */
  function eventsOf(p) {
    if (typeof p.events === 'number') return decode(p.events, p);
    var scene = sceneOf(p), ids = linksOf(scene).map(function (l) { return l.id; });
    var out = {};
    String(p.events || '').split(',').forEach(function (x) {
      var f = x.trim().split(':');
      var n = Number(f[0]);
      if (f[0] === '' || Math.floor(n) !== n || n < 1 || n > MAX_STEPS || out[n]) return;
      if (f[1] === 'down' && f.length === 2) out[n] = { kind: 'down', dest: 'N' };
      else if (f[1] === 'cut' && f.length === 3 && ids.indexOf(f[2]) >= 0) out[n] = { kind: 'cut', link: f[2] };
    });
    return out;
  }

  function decode(code, p) {
    var ids = linksOf(sceneOf(p)).map(function (l) { return l.id; });
    var out = {};
    if (!(code >= 0) || Math.floor(code) !== code || code > MAX_CODE) return out;
    for (var n = 1, c = code; c > 0 && n <= MAX_STEPS; n++, c = Math.floor(c / 6)) {
      var d = c % 6;
      if (d === 1) out[n] = { kind: 'down', dest: 'N' };
      else if (d >= 2 && ids[d - 2]) out[n] = { kind: 'cut', link: ids[d - 2] };
    }
    return out;
  }

  /** The number for a set of events (as eventsOf returns them) in scene p.topo. */
  function encode(events, p) {
    var ids = linksOf(sceneOf(p)).map(function (l) { return l.id; });
    var code = 0;
    Object.keys(events).map(Number).sort(function (a, b) { return b - a; }).forEach(function (n) {
      var ev = events[n];
      var d = ev.kind === 'down' ? 1 : 2 + ids.indexOf(ev.link);
      code += d * Math.pow(6, n - 1);
    });
    return code;
  }

  /** The number for the text form in a scene: code('line', '1:down') (the page's presets). */
  function code(topo, text) { var p = { topo: topo, events: text }; return encode(eventsOf(p), p); }

  function lastEventStep(events) {
    var ks = Object.keys(events).map(Number);
    return ks.length ? Math.max.apply(null, ks) : 0;
  }

  /** Apply a topology change (rule 7). Returns { tables, links, nets, changes, noop }. */
  function applyEvent(s, ev) {
    var tables = clone(s.tables), links = clone(s.links), nets = clone(s.nets), changes = [];
    if (ev.kind === 'down') {
      var net = nets[ev.dest];
      if (!net.up) return { tables: tables, links: links, nets: nets, changes: [], noop: true };
      net.up = false;
      var e = tables[net.at][ev.dest];
      changes.push({ r: net.at, dest: ev.dest, from: { metric: e.metric, via: e.via }, to: { metric: INF, via: null }, by: null, why: 'down' });
      tables[net.at][ev.dest] = { metric: INF, via: null };
      return { tables: tables, links: links, nets: nets, changes: changes, noop: false };
    }
    var l = links.filter(function (x) { return x.id === ev.link; })[0];
    if (!l.up) return { tables: tables, links: links, nets: nets, changes: [], noop: true };
    l.up = false;
    [[l.a, l.b], [l.b, l.a]].forEach(function (pair) {
      var r = pair[0], other = pair[1];
      Object.keys(tables[r]).sort(byName).forEach(function (dest) {
        var en = tables[r][dest];
        if (en.via !== other || en.metric === INF) return;
        changes.push({ r: r, dest: dest, from: { metric: en.metric, via: en.via }, to: { metric: INF, via: other }, by: null, why: 'cut' });
        tables[r][dest] = { metric: INF, via: other };
      });
    });
    return { tables: tables, links: links, nets: nets, changes: changes, noop: false };
  }

  /** Mark finite routes written at routers that are cut off from the network: the false routes of count to infinity. */
  function markFalse(changes, cutOff) {
    changes.forEach(function (c) { c['false'] = c.to.metric < INF && cutOff.indexOf(c.r) >= 0; });
  }

  /** Bad news has arrived everywhere: no router cut off from N has a finite route to it, and at least one of them
      holds 16 (a router that was cut off before it ever learned N got no bad news). */
  function badNewsDone(tables, cutOff, dest) {
    var has16 = function (r) { return !!tables[r][dest] && tables[r][dest].metric === INF; };
    return cutOff.some(has16) && cutOff.every(function (r) { return !tables[r][dest] || has16(r); });
  }

  var logic = {
    INF: INF, MAX_STEPS: MAX_STEPS, MAX_CODE: MAX_CODE, SCENES: SCENES,

    defaults: { topo: 'line', start: 'cold', mode: 'plain', events: 0, cutLine: 'B-C', cutRing: 'B-C', cutTri: 'C-D' },

    /** Steps for these params: replay to the end of the run (SPEC.md "End of a run"), at most 20. */
    steps: function (p) {
      var key = JSON.stringify([p.topo, p.start, p.mode, p.events]);
      if (stepsCache[key] != null) return stepsCache[key];
      var s = logic.initial(p), n = 0;
      while (!s.end && n < MAX_STEPS) { n++; s = logic.step(s, n, p); }
      stepsCache[key] = n;
      return n;
    },

    initial: function (p) {
      var scene = sceneOf(p);
      var nets = {};
      Object.keys(scene.nets).forEach(function (n) { nets[n] = { at: scene.nets[n], up: true }; });
      return {
        round: 0, since: 0,
        tables: p.start === 'converged' ? convergedTables(scene, p.mode) : coldTables(scene),
        links: linksOf(scene), nets: nets,
        kind: 'start', ev: null, noop: false, ads: [], changes: [], quiet: false, cutOff: [], end: null
      };
    },

    step: function (s, n, p) {
      var scene = sceneOf(p), events = eventsOf(p);
      var ev = events[n];
      var out;
      if (ev) {
        var a = applyEvent(s, ev);
        out = { round: s.round, since: 0, tables: a.tables, links: a.links, nets: a.nets,
          kind: ev.kind, ev: ev, noop: a.noop, ads: [], changes: a.changes, quiet: false };
      } else {
        var r = round(s.tables, s.links, p.mode);
        out = { round: s.round + 1, since: s.since + 1, tables: r.tables, links: clone(s.links), nets: clone(s.nets),
          kind: 'round', ev: null, noop: false, ads: r.ads, changes: r.changes, quiet: r.changes.length === 0 };
      }
      out.cutOff = cutOffFrom(scene, out.links, out.nets, 'N');
      markFalse(out.changes, out.cutOff);
      out.end = null;
      if (n >= lastEventStep(events) && out.kind === 'round') {
        if (out.quiet) out.end = 'quiet';
        else if (badNewsDone(out.tables, out.cutOff, 'N') && !round(out.tables, out.links, p.mode).changes.length) out.end = 'unreachable';
      }
      if (!out.end && n >= MAX_STEPS) out.end = 'limit';
      return out;
    },

    sceneOf: sceneOf, linkId: linkId, neighbours: neighbours, coldTables: coldTables, adsOf: adsOf, offer: offer,
    round: round, convergedTables: convergedTables, linksOf: linksOf, cutOffFrom: cutOffFrom, eventsOf: eventsOf, encode: encode, code: code,
    applyEvent: applyEvent
  };
  var stepsCache = {};

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
