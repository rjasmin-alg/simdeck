/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for systemd dependencies and ordering: requirement edges (Wants=, Requires=) decide which units are in the
   boot transaction, ordering edges (After=, Before=) decide when they start, and a failed unit stops only the units
   that require it AND are ordered after it. An explorer: no steps; the page draws initial(params). Rules: SPEC.md.
   Units and edges are data (a graph), so a preset can bring its own units (win-services adds Windows services with
   a `depends` relation, requirement and ordering in one). compute(graph) is pure over that data and holds no strings:
   promotable to models/ unchanged. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Edge kinds. A requirement pulls `to` into the transaction; an ordering makes one wait for the other.
      `depends` is both a requirement and `after` (a Windows service dependency, for the win-services presets). */
  var PULLS = { wants: true, requires: true, depends: true };
  var STRONG = { requires: true, depends: true };
  var KINDS = ['wants', 'requires', 'after', 'before', 'depends'];

  function byId(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

  /** Ordering between a and b in either direction, among edges. */
  function ordered(edges, a, b) {
    return edges.some(function (e) {
      return (e.kind === 'after' || e.kind === 'before' || e.kind === 'depends') &&
        ((e.from === a && e.to === b) || (e.from === b && e.to === a));
    });
  }

  /** Every edge the boot sees: the unit files' own edges ('unit'), a Wants= link from the target named in
      WantedBy= for every enabled unit ('install', rule 1), and a target's automatic After= on each unit it pulls in,
      unless the two are ordered already ('target', rule 9). Order: unit edges, install edges, target edges. */
  function allEdges(g) {
    var out = (g.edges || []).map(function (e) { return { from: e.from, to: e.to, kind: e.kind, via: 'unit' }; });
    g.units.forEach(function (u) {
      if (u.enabled && u.wantedBy) out.push({ from: u.wantedBy, to: u.id, kind: 'wants', via: 'install' });
    });
    var types = {};
    g.units.forEach(function (u) { types[u.id] = u.type; });
    var auto = [];
    out.forEach(function (e) {
      if (!PULLS[e.kind] || types[e.from] !== 'target') return;
      if (ordered(out, e.from, e.to) || ordered(auto, e.from, e.to)) return;
      auto.push({ from: e.from, to: e.to, kind: 'after', via: 'target' });
    });
    return out.concat(auto);
  }

  /** Rule 1: everything reachable from the root through requirement edges. Ids in id order. */
  function transaction(rootId, edges) {
    var seen = {}, queue = [rootId];
    seen[rootId] = true;
    while (queue.length) {
      var u = queue.shift();
      edges.forEach(function (e) {
        if (e.from === u && PULLS[e.kind] && !seen[e.to]) { seen[e.to] = true; queue.push(e.to); }
      });
    }
    return Object.keys(seen).sort(byId);
  }

  /** Rules 4 and 5: for each unit in the transaction, the units it waits for (After= x, or x Before= it), both in
      the transaction. Ids in id order, no duplicates. */
  function waitsFor(txn, edges) {
    var inTxn = {}, w = {};
    txn.forEach(function (id) { inTxn[id] = true; w[id] = []; });
    edges.forEach(function (e) {
      var later = null, earlier = null;
      if (e.kind === 'after' || e.kind === 'depends') { later = e.from; earlier = e.to; }
      else if (e.kind === 'before') { later = e.to; earlier = e.from; }
      else return;
      if (!inTxn[later] || !inTxn[earlier] || later === earlier) return;
      if (w[later].indexOf(earlier) < 0) w[later].push(earlier);
    });
    txn.forEach(function (id) { w[id].sort(byId); });
    return w;
  }

  /** Rule 8: the units on an ordering cycle (empty when there is none). Ids in id order. */
  function cycleUnits(txn, w) {
    var reach = {};
    function from(id) {
      if (reach[id]) return reach[id];
      var seen = {}, stack = w[id].slice();
      while (stack.length) {
        var x = stack.pop();
        if (seen[x]) continue;
        seen[x] = true;
        stack.push.apply(stack, w[x]);
      }
      return (reach[id] = seen);
    }
    return txn.filter(function (id) { return from(id)[id]; });
  }

  /** The state for a graph { root, units: [{ id, type, enabled, wantedBy, fails }], edges: [{ from, to, kind }] }. */
  function compute(g) {
    var edges = allEdges(g);
    var txn = transaction(g.root, edges);
    var w = waitsFor(txn, edges);
    var loop = cycleUnits(txn, w);
    var slots = {}, result = {};
    var units = g.units.map(function (u) {
      return { id: u.id, type: u.type || 'service', enabled: !!u.enabled, fails: !!u.fails };
    });
    var fails = {};
    units.forEach(function (u) { fails[u.id] = u.fails; });
    var cycle = loop.length > 0;

    if (!cycle) {
      // rule 6: slot = 1 + the latest slot it waits for; rule 7: a failed unit has still finished in its slot
      var slotOf = function (id) {
        if (slots[id] == null) slots[id] = 1 + w[id].reduce(function (m, x) { return Math.max(m, slotOf(x)); }, 0);
        return slots[id];
      };
      txn.forEach(slotOf);
      // rules 2, 3 and 7, in slot order (a unit's waits are all in earlier slots)
      txn.slice().sort(function (a, b) { return slots[a] - slots[b] || byId(a, b); }).forEach(function (id) {
        var blocked = edges.some(function (e) {
          return e.from === id && STRONG[e.kind] && w[id].indexOf(e.to) >= 0 &&
            (result[e.to] === 'failed' || result[e.to] === 'dependency');
        });
        result[id] = blocked ? 'dependency' : fails[id] ? 'failed' : 'active';
      });
    }
    units.forEach(function (u) { if (txn.indexOf(u.id) < 0) result[u.id] = 'none'; });

    // rule 6's tie-break: lanes by slot, then by id; units outside the transaction last, by id
    var order = units.map(function (u) { return u.id; }).sort(function (a, b) {
      var sa = slots[a] == null ? Infinity : slots[a], sb = slots[b] == null ? Infinity : slots[b];
      return sa === sb ? byId(a, b) : sa < sb ? -1 : 1;
    });
    var nSlots = 0;
    Object.keys(slots).forEach(function (id) { nSlots = Math.max(nSlots, slots[id]); });

    return {
      units: units, edges: edges, txn: txn, slots: slots, result: result, cycle: cycle, loop: loop,
      order: order, nSlots: nSlots, waits: w
    };
  }

  // ── the lnx scene: four units, the student edits app.service ──

  var APP = 'app.service', DB = 'db.service', NET = 'network-online.target', MU = 'multi-user.target';

  /** The graph for the page's params (SPEC.md, Scene). multi-user.target is the default target. */
  function graph(p) {
    var edges = [];
    if (p.appToDb !== 'none') edges.push({ from: APP, to: DB, kind: p.appToDb });
    if (p.appAfterDb) edges.push({ from: APP, to: DB, kind: 'after' });
    if (p.appToNet !== 'none') edges.push({ from: APP, to: NET, kind: p.appToNet });
    if (p.appAfterNet) edges.push({ from: APP, to: NET, kind: 'after' });
    return {
      root: MU,
      units: [
        { id: MU, type: 'target' },
        { id: APP, type: 'service', enabled: true, wantedBy: MU },
        { id: DB, type: 'service', enabled: !!p.dbEnabled, wantedBy: MU, fails: !!p.dbFails },
        { id: NET, type: 'target' }
      ],
      edges: edges
    };
  }

  /** Units whose result or slot differs between two states (the "changed" outline). Ids in id order. */
  function changed(prev, s) {
    if (!prev) return [];
    return s.units.map(function (u) { return u.id; }).filter(function (id) {
      return prev.result[id] !== s.result[id] || prev.slots[id] !== s.slots[id];
    }).sort(byId);
  }

  var DB_KEYS = ['appToDb', 'appAfterDb', 'dbFails', 'dbEnabled'];
  var NET_KEYS = ['appToNet', 'appAfterNet'];
  var NET_PRESETS = { 'network-online': true };

  /** Which relation the caption speaks about: the one whose param changed last; a preset speaks for its own;
      with no history, db. */
  function nextFocus(focus, prevParams, params, preset, prevPreset) {
    if (preset && preset !== prevPreset) return NET_PRESETS[preset] ? 'net' : 'db';
    if (!prevParams) return focus || 'db';
    var diff = function (k) { return prevParams[k] !== params[k]; };
    if (NET_KEYS.some(diff)) return 'net';
    if (DB_KEYS.some(diff)) return 'db';
    return focus || 'db';
  }

  /** The caption for a state (SPEC.md, Captions): a key and the numbers it needs. Pure; the page fills the words. */
  function captionKey(s, p, focus) {
    if (s.cycle) return { key: 'cCycle' };
    var app = s.slots[APP];
    if (focus === 'net' && s.result[APP] !== 'dependency') {   // app never started: the db caption says why
      if (s.result[NET] === 'none') return { key: p.appAfterNet ? 'cNetAfterOnly' : 'cNetNone', app: app };
      return { key: p.appAfterNet ? 'cNetOrdered' : 'cNetNoOrder', net: s.slots[NET], app: app };
    }
    var db = s.slots[DB];
    if (s.result[DB] === 'none') return { key: p.appAfterDb ? 'cAfterOnly' : 'cDbOut', app: app };
    if (s.result[APP] === 'dependency') return { key: 'cDepFailed', db: db, app: app };
    var failed = s.result[DB] === 'failed';
    var pulls = p.appToDb !== 'none';
    if (failed && p.appToDb === 'requires' && !p.appAfterDb) return { key: db === app ? 'cReqNoAfter' : 'cReqNoAfterApart', db: db, app: app };
    if (failed && pulls) return { key: p.appAfterDb ? 'cWantsAfterFailed' : 'cWantsFailed', db: db, app: app };
    if (failed) return { key: p.appAfterDb ? 'cAfterFailed' : 'cUnrelatedFailed', db: db, app: app };
    if (p.appAfterDb) return { key: 'cOrdered', db: db, app: app };
    if (pulls) return { key: 'cNoOrder', rel: p.appToDb === 'wants' ? 'Wants=' : 'Requires=', db: db, app: app };
    return { key: 'cIndependent', db: db, app: app };
  }

  var logic = {
    /** Parameter defaults (SPEC.md, Params). */
    defaults: { appToDb: 'requires', appAfterDb: true, appToNet: 'wants', appAfterNet: true, dbFails: false, dbEnabled: false },

    /** The page's presets (SPEC.md, Presets): params over the defaults. */
    presets: [
      { id: 'network-online', params: { appToDb: 'none', appAfterDb: false, appToNet: 'wants', appAfterNet: true } },
      { id: 'requires-no-after', params: { appToDb: 'requires', appAfterDb: false, appToNet: 'none', appAfterNet: false, dbFails: true } },
      { id: 'requires-after', params: { appToDb: 'requires', appAfterDb: true, appToNet: 'none', appAfterNet: false, dbFails: true } },
      { id: 'wants-after', params: { appToDb: 'wants', appAfterDb: true, appToNet: 'none', appAfterNet: false, dbFails: true } },
      { id: 'after-only', params: { appToDb: 'none', appAfterDb: true, appToNet: 'none', appAfterNet: false, dbEnabled: false } }
    ],

    /** Explorer: the state is computed from the params. */
    initial: function (p) { return compute(graph(p)); },

    APP: APP, DB: DB, NET: NET, MU: MU, KINDS: KINDS,
    graph: graph, compute: compute, allEdges: allEdges, changed: changed, nextFocus: nextFocus, captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
