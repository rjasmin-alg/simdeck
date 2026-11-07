/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-bia: a business impact analysis for a small made-up firm. Five business processes each get a maximum
   tolerable downtime (MTD, hours). They depend on five applications, which depend on three infrastructure services
   (directory and sign-in → name resolution → network). A supporting system's required recovery time objective (RTO)
   is the shortest MTD among the processes that depend on it, less the time to notice and decide (the margin): only
   the processes that use it directly ('direct', the common shortcut) or every process above it in the graph
   ('chain'). What recovery achieves today is entered per system; the gap (achieved − required, when positive) is the
   work list, and sorting by required RTO gives the recovery order. A process is back when its slowest dependency is
   (systems restored in parallel), after the margin.
   Explorer: the state is a pure function of the params (compute). Rules: SPEC.md; words: strings.js.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The graph functions (adjacency, closure,
   depth, required, order, outcome) are pure over plain data, so cmp-restore-evidence can copy the required RTOs. */
(function (root) {
  'use strict';

  /** Rule 1: the processes, in the stage's order (also the tie-break order). key: the MTD param. */
  var PROCS = [
    { id: 'orders', key: 'mOrders' },
    { id: 'dispatch', key: 'mDispatch' },
    { id: 'invoice', key: 'mInvoice' },
    { id: 'payroll', key: 'mPayroll' },
    { id: 'support', key: 'mSupport' }
  ];
  /** Rule 1: the applications and the infrastructure, in the stage's order. key: the achieved-recovery param. */
  var APPS = [
    { id: 'shop', key: 'aShop' },
    { id: 'erp', key: 'aErp' },
    { id: 'wms', key: 'aWms' },
    { id: 'mail', key: 'aMail' },
    { id: 'pay', key: 'aPay' }
  ];
  var INFRA = [
    { id: 'idm', key: 'aIdm' },
    { id: 'dns', key: 'aDns' },
    { id: 'net', key: 'aNet' }
  ];
  /** Rule 2: fixed dependencies inside the infrastructure (dependent, dependency). */
  var FIXED = [['idm', 'dns'], ['dns', 'net']];
  /** Rule 5: the last tie-break of the recovery order: this list's order (infrastructure first). */
  var SYSTEMS = INFRA.slice().reverse().concat(APPS).map(function (x) { return x.id; });   // net, dns, idm, shop, …

  var MTD_STEPS = [4, 8, 12, 24, 48, 72, 120, 168, 336];          // hours the MTD steppers offer
  var ACH_STEPS = [1, 2, 4, 6, 8, 12, 24, 48, 72, 120, 168];      // hours the "today" steppers offer
  var MARGINS = [0, 1, 2, 3];                                     // hours to notice and decide
  var MODES = ['direct', 'chain'];
  var PA_MAX = Math.pow(2, PROCS.length * APPS.length) - 1;       // the edge masks' ranges
  var AI_MAX = Math.pow(2, APPS.length * INFRA.length) - 1;

  // ── edges as bit masks (URL-safe params) ──

  function pIndex(id) { for (var i = 0; i < PROCS.length; i++) if (PROCS[i].id === id) return i; return -1; }
  function aIndex(id) { for (var i = 0; i < APPS.length; i++) if (APPS[i].id === id) return i; return -1; }
  function iIndex(id) { for (var i = 0; i < INFRA.length; i++) if (INFRA[i].id === id) return i; return -1; }
  function bit(mask, i) { return Math.floor(mask / Math.pow(2, i)) % 2 === 1; }
  /** Rule 2: the bit of a process → application edge in `pa`, of an application → infrastructure edge in `ai`. */
  function paBit(proc, app) { return pIndex(proc) * APPS.length + aIndex(app); }
  function aiBit(app, infra) { return aIndex(app) * INFRA.length + iIndex(infra); }
  function hasEdge(p, from, to) {
    if (pIndex(from) >= 0 && aIndex(to) >= 0) return bit(p.pa, paBit(from, to));
    if (aIndex(from) >= 0 && iIndex(to) >= 0) return bit(p.ai, aiBit(from, to));
    return FIXED.some(function (e) { return e[0] === from && e[1] === to; });
  }
  /** The mask with one edge switched (the page's "draw" action). */
  function toggle(p, from, to) {
    if (pIndex(from) >= 0 && aIndex(to) >= 0) {
      var b = Math.pow(2, paBit(from, to));
      return { pa: bit(p.pa, paBit(from, to)) ? p.pa - b : p.pa + b };
    }
    if (aIndex(from) >= 0 && iIndex(to) >= 0) {
      var c = Math.pow(2, aiBit(from, to));
      return { ai: bit(p.ai, aiBit(from, to)) ? p.ai - c : p.ai + c };
    }
    return {};
  }
  function maskOf(pairs, bitOf) { return pairs.reduce(function (m, e) { return m + Math.pow(2, bitOf(e[0], e[1])); }, 0); }

  /** Rule 2: the firm's dependencies as drawn by default. */
  var PA_PAIRS = [
    ['orders', 'shop'],
    ['dispatch', 'erp'], ['dispatch', 'wms'],
    ['invoice', 'erp'], ['invoice', 'mail'],
    ['payroll', 'pay'],
    ['support', 'mail']
  ];
  var AI_PAIRS = [
    ['shop', 'dns'], ['shop', 'net'],
    ['erp', 'idm'], ['erp', 'dns'], ['erp', 'net'],
    ['wms', 'idm'], ['wms', 'net'],
    ['mail', 'idm'], ['mail', 'dns'], ['mail', 'net'],
    ['pay', 'idm'], ['pay', 'net']
  ];
  var PA0 = maskOf(PA_PAIRS, paBit), AI0 = maskOf(AI_PAIRS, aiBit);

  // ── params, presets ──

  function P(over) {
    return Object.assign({
      mode: 'direct', margin: 1, pa: PA0, ai: AI0,
      mOrders: 4, mDispatch: 24, mInvoice: 72, mPayroll: 168, mSupport: 24,
      aNet: 2, aDns: 8, aIdm: 48, aShop: 2, aErp: 12, aWms: 8, aMail: 8, aPay: 48
    }, over);
  }
  /** Rule 8: the presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'direct', params: P({}) },
    { id: 'chain', params: P({ mode: 'chain' }) },
    { id: 'hidden', params: P({ mode: 'chain', ai: AI0 + Math.pow(2, aiBit('shop', 'idm')) }) },
    { id: 'fixed', params: P({ mode: 'chain', aDns: 2, aIdm: 12 }) },
    { id: 'late', params: P({ mode: 'chain', aDns: 2, aIdm: 12, margin: 3 }) }
  ];
  var defaults = Object.assign({}, presets[0].params);

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function num(v, dflt) {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return dflt;
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }
  function oneOf(v, list, dflt) {
    for (var i = 0; i < list.length; i++) if (String(list[i]) === String(v)) return list[i];
    return dflt;
  }
  /** The nearest value of a list (a URL may carry any number); ties go to the smaller. */
  function nearest(list, v) {
    var best = list[0];
    list.forEach(function (x) { if (Math.abs(x - v) < Math.abs(best - v)) best = x; });
    return best;
  }

  /** Rule 8: params made safe. */
  function normalise(params) {
    var q = Object.assign({}, defaults, params);
    var out = {
      mode: oneOf(q.mode, MODES, defaults.mode),
      margin: oneOf(num(q.margin, defaults.margin), MARGINS, defaults.margin),
      pa: clamp(Math.round(num(q.pa, defaults.pa)), 0, PA_MAX),
      ai: clamp(Math.round(num(q.ai, defaults.ai)), 0, AI_MAX)
    };
    PROCS.forEach(function (x) { out[x.key] = nearest(MTD_STEPS, num(q[x.key], defaults[x.key])); });
    SYSTEMS.forEach(function (id) { var k = sysKey(id); out[k] = nearest(ACH_STEPS, num(q[k], defaults[k])); });
    return out;
  }

  /** Rule 8: a stepper over a list: the next value above (dir +1) or below (dir −1); at the end it stays. */
  function stepList(list, value, dir) {
    var i = list.indexOf(value);
    if (i < 0) i = list.indexOf(nearest(list, value));
    return list[clamp(i + (dir > 0 ? 1 : -1), 0, list.length - 1)];
  }

  function sysKey(id) {
    var all = APPS.concat(INFRA);
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i].key;
    return null;
  }
  function procKey(id) { return PROCS[pIndex(id)].key; }

  // ── the graph ──

  /** Rule 2: adjacency, node id → the ids it depends on directly, in stage order. */
  function adjacency(p) {
    var adj = {};
    PROCS.forEach(function (x) {
      adj[x.id] = APPS.filter(function (a) { return hasEdge(p, x.id, a.id); }).map(function (a) { return a.id; });
    });
    APPS.forEach(function (a) {
      adj[a.id] = INFRA.filter(function (i) { return hasEdge(p, a.id, i.id); }).map(function (i) { return i.id; });
    });
    INFRA.forEach(function (i) {
      adj[i.id] = FIXED.filter(function (e) { return e[0] === i.id; }).map(function (e) { return e[1]; });
    });
    return adj;
  }

  /** Rule 3: every system a node depends on, directly or through others (not the node itself), in SYSTEMS order. */
  function closure(adj, id) {
    var seen = {}, todo = adj[id].slice();
    while (todo.length) {
      var x = todo.pop();
      if (seen[x]) continue;
      seen[x] = true;
      todo = todo.concat(adj[x]);
    }
    return SYSTEMS.filter(function (s) { return seen[s]; });
  }

  /** Rule 5: the longest chain of dependencies below a system (0: it depends on nothing). */
  function depth(adj, id) {
    return adj[id].reduce(function (d, x) { return Math.max(d, 1 + depth(adj, x)); }, 0);
  }

  /** Rule 3: the processes the analysis counts as depending on a system: direct users only, or every process whose
      closure holds it. In process order. */
  function dependents(adj, mode, id) {
    return PROCS.filter(function (x) {
      return mode === 'direct' ? adj[x.id].indexOf(id) >= 0 : closure(adj, x.id).indexOf(id) >= 0;
    }).map(function (x) { return x.id; });
  }

  /** Rules 3–4: a system's required RTO: the shortest MTD among its dependents, less the margin (never below 0);
      `from` is that process (ties: the first in process order). null when no process counts. */
  function required(p, adj, id) {
    var best = null;
    dependents(adj, p.mode, id).forEach(function (pid) { if (best === null || p[procKey(pid)] < p[procKey(best)]) best = pid; });
    if (best === null) return { req: null, from: null };
    return { req: Math.max(0, p[procKey(best)] - p.margin), from: best };
  }

  /** Rule 5: the recovery order: required RTO ascending (none last), then depth ascending, then SYSTEMS order. */
  function order(sys) {
    return sys.slice().sort(function (a, b) {
      if (a.req !== b.req) {
        if (a.req === null) return 1;
        if (b.req === null) return -1;
        return a.req - b.req;
      }
      if (a.depth !== b.depth) return a.depth - b.depth;
      return SYSTEMS.indexOf(a.id) - SYSTEMS.indexOf(b.id);
    }).map(function (x) { return x.id; });
  }

  /** Rule 7: a process is back after the margin plus its slowest dependency (restored in parallel). `slow` is that
      system (ties: smaller depth, then SYSTEMS order); null when it depends on nothing. */
  function outcome(p, adj, sysById, pid) {
    var deps = closure(adj, pid), slow = null;
    deps.forEach(function (id) {
      var x = sysById[id];
      if (slow === null) { slow = x; return; }
      if (x.ach > slow.ach || (x.ach === slow.ach && x.depth < slow.depth)) slow = x;
    });
    var back = p.margin + (slow ? slow.ach : 0);
    var mtd = p[procKey(pid)];
    return { id: pid, mtd: mtd, deps: deps, back: back, within: back <= mtd, slow: slow ? slow.id : null };
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var adj = adjacency(p);
    var sys = SYSTEMS.map(function (id) {
      var r = required(p, adj, id), ach = p[sysKey(id)];
      return {
        id: id, layer: iIndex(id) >= 0 ? 'infra' : 'app', depth: depth(adj, id), deps: closure(adj, id),
        users: dependents(adj, 'chain', id), req: r.req, from: r.from, ach: ach,
        gap: r.req === null ? null : Math.max(0, ach - r.req)       // rule 6
      };
    });
    var byId = {};
    sys.forEach(function (x) { byId[x.id] = x; });
    var ord = order(sys);
    ord.forEach(function (id, i) { byId[id].pos = i + 1; });
    sys.forEach(function (x) {                                       // rule 5: placed before something it needs
      x.waits = x.deps.filter(function (d) { return byId[d].pos > x.pos; });
    });
    var procs = PROCS.map(function (x) { return outcome(p, adj, byId, x.id); });
    return { p: p, adj: adj, sys: sys, order: ord, procs: procs, m: measure(sys, procs, ord, byId) };
  }

  /** Rule 6: the totals. work: systems with a gap, in recovery order; worst: the largest gap (ties: earlier in the
      order); unrated: systems some process needs (through the graph) but the analysis gives no RTO. */
  function measure(sys, procs, ord, byId) {
    var work = ord.filter(function (id) { return byId[id].gap > 0; });
    var worst = null;
    work.forEach(function (id) { if (worst === null || byId[id].gap > byId[worst].gap) worst = id; });
    return {
      within: procs.filter(function (x) { return x.within; }).length,
      work: work,
      worst: worst,
      unrated: ord.filter(function (id) { return byId[id].req === null && byId[id].users.length > 0; }),
      broken: ord.filter(function (id) { return byId[id].waits.length > 0; })
    };
  }

  /** Rule 9: the caption: the main line, then at most two notes, the first that apply in this order.
      direct: a system the analysis leaves unrated but that a late process waits for (nUnrated; else the first
      unrated one, nUnratedAny); the order puts a system before one it needs (nWaits); a late process (nMiss).
      chain: a late process (nMiss); a gap that only the margin opens (nMargin); the first infrastructure system in the
      order, which no process uses directly, inherits its RTO (nInherit); every process back in time (nAllOk). */
  function captionKey(s) {
    var p = s.p, m = s.m, notes = [];
    var late = s.procs.filter(function (x) { return !x.within; })[0] || null;
    if (p.mode === 'direct') {
      if (m.unrated.length) notes.push(unratedLate(s) ? 'nUnrated' : 'nUnratedAny');
      if (m.broken.length) notes.push('nWaits');
      if (late) notes.push('nMiss');
    } else {
      if (late) notes.push('nMiss');
      if (marginGap(s)) notes.push('nMargin');
      if (inherited(s)) notes.push('nInherit');
      // in chain mode no late process ⇔ an empty work list; say it only when some system has an RTO at all
      if (!late && s.sys.some(function (x) { return x.req !== null; })) notes.push('nAllOk');
    }
    return { key: m.work.length ? 'capMain' : 'capEmpty', notes: notes.slice(0, 2) };
  }

  function byIdOf(s) { var o = {}; s.sys.forEach(function (x) { o[x.id] = x; }); return o; }
  /** nUnrated: the first late process whose slowest system the analysis left unrated, with that system. */
  function unratedLate(s) {
    var by = byIdOf(s);
    for (var i = 0; i < s.procs.length; i++) {
      var x = s.procs[i];
      if (!x.within && x.slow && by[x.slow].req === null) return { proc: x.id, sys: x.slow };
    }
    return null;
  }
  /** nMargin: the first system in the order with a gap that the margin alone opens (achieved ≤ the MTD it inherits). */
  function marginGap(s) {
    if (s.p.margin === 0) return null;
    var by = byIdOf(s);
    for (var i = 0; i < s.order.length; i++) {
      var x = by[s.order[i]];
      if (x.gap > 0 && x.ach <= x.req + s.p.margin) return x.id;
    }
    return null;
  }
  /** nInherit: the first infrastructure system in the order with a required RTO. */
  function inherited(s) {
    var by = byIdOf(s);
    for (var i = 0; i < s.order.length; i++) if (by[s.order[i]].layer === 'infra' && by[s.order[i]].req !== null) return s.order[i];
    return null;
  }

  var logic = {
    PROCS: PROCS, APPS: APPS, INFRA: INFRA, FIXED: FIXED, SYSTEMS: SYSTEMS,
    MTD_STEPS: MTD_STEPS, ACH_STEPS: ACH_STEPS, MARGINS: MARGINS, MODES: MODES, PA_MAX: PA_MAX, AI_MAX: AI_MAX,
    PA0: PA0, AI0: AI0,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    nearest: nearest,
    stepList: stepList,
    sysKey: sysKey,
    procKey: procKey,
    paBit: paBit,
    aiBit: aiBit,
    hasEdge: hasEdge,
    toggle: toggle,
    adjacency: adjacency,
    closure: closure,
    depth: depth,
    dependents: dependents,
    required: required,
    order: order,
    outcome: outcome,
    measure: measure,
    captionKey: captionKey,
    unratedLate: unratedLate,
    marginGap: marginGap,
    inherited: inherited
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
