/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-cloud-commitment: a year of usage, a commitment level and a term; the term's cost all on demand and
   with the commitment, each server level's utilisation against break-even, the best level, and both terms' saving.
   Explorer: the state is a pure function of the params (compute). Rules: SPEC.md. The sums are in commitment.js
   (promotable to models/); this file adds the prices, params, presets and the page's derived numbers.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var M = typeof module === 'object' && module.exports
    ? require('./commitment.js')
    : root.SimdeckModels.commitment;

  var P = 200;                                   // € per server-month on demand (SPEC.md, prices)
  var DISCOUNT = { 1: 30, 3: 50 };               // % off by term in years
  var TERMS = [1, 3];
  var N_MAX = 16;                                // servers: the usage and commitment scale
  var LATER_MAX = 150, LATER_STEP = 25;
  var MONTHS = 12;

  function committedPrice(term) { return P * (100 - DISCOUNT[term]) / 100; }   // rule 2

  var USAGE = {
    seasonal: [5, 5, 6, 7, 8, 8, 9, 8, 7, 6, 10, 13],
    steady: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8]
  };

  function paramsOf(usage, commit, term, later) {
    var p = { commit: commit, term: term, later: later };
    USAGE[usage].forEach(function (x, i) { p['u' + (i + 1)] = x; });
    return p;
  }

  var defaults = paramsOf('seasonal', 6, 1, 100);

  /** Presets, SPEC.md table; expected numbers there. Each carries every param, so a preset is a whole scenario. */
  var presets = [
    { id: 'steady', params: paramsOf('steady', 8, 1, 100) },
    { id: 'base-load', params: paramsOf('seasonal', 6, 1, 100) },
    { id: 'cover-peak', params: paramsOf('seasonal', 13, 1, 100) },
    { id: 'three-years', params: paramsOf('seasonal', 7, 3, 100) },
    { id: 'usage-falls', params: paramsOf('seasonal', 7, 3, 25) }
  ];

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function snap(x, step) { return Math.round(x / step) * step; }
  function num(v, dflt) {
    if (v === '' || v === null || v === undefined || typeof v === 'boolean') return dflt;
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }

  /** Params made safe (a URL may carry anything). */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var out = {
      commit: clamp(Math.round(num(q.commit, defaults.commit)), 0, N_MAX),
      term: Number(q.term) === 3 ? 3 : 1,
      later: clamp(snap(num(q.later, defaults.later), LATER_STEP), 0, LATER_MAX)
    };
    for (var m = 1; m <= MONTHS; m++) out['u' + m] = clamp(Math.round(num(q['u' + m], defaults['u' + m])), 0, N_MAX);
    return out;
  }

  function usageOf(p) { var u = []; for (var m = 1; m <= MONTHS; m++) u.push(p['u' + m]); return u; }

  /** One term's numbers for the usage, commitment and later share. */
  function termView(u, c, term, later) {
    var cp = committedPrice(term);
    var us = M.termUsage(u, term, later);
    var x = M.cost(us, c, cp, P);
    var b = M.best(us, N_MAX, cp, P);
    var levels = [];
    for (var k = 1; k <= N_MAX; k++) levels.push(M.level(us, k, cp, P));
    return {
      term: term, cp: cp, months: us.length, cost: x, pct: M.pct(x.save, x.all), outcome: M.outcome(x.save),
      best: b, bestWith: M.cost(us, b, cp, P).with, levels: levels
    };
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var u = usageOf(p), c = p.commit;
    var v = termView(u, c, p.term, p.later);
    var other = termView(u, c, p.term === 1 ? 3 : 1, p.later);
    var chips = {};
    chips[v.term] = { pct: v.pct, outcome: v.outcome };
    chips[other.term] = { pct: other.pct, outcome: other.outcome };
    return {
      p: p,
      P: P,
      cp: v.cp,
      breakEven: 100 - DISCOUNT[p.term],                          // rule 6, % of the time
      months: u.map(function (x) {                                // year 1, whole servers
        return { u: x, used: Math.min(x, c), unused: Math.max(0, c - x), od: Math.max(0, x - c) };
      }),
      later: p.term > 1 ? u.map(function (x) { return x * p.later / 100; }) : null,   // years 2 and 3, each
      cost: v.cost,
      pct: v.pct,
      outcome: v.outcome,
      best: v.best,
      sameAsBest: c !== v.best && v.cost.with === v.bestWith,    // rule 1a
      levels: v.levels.map(function (l) {
        return { k: l.k, share: l.use / v.months, margin: l.margin, verdict: l.verdict };   // share: % of the time
      }),
      chips: chips,                                               // rule 8
      anyUsage: v.cost.all > 0,
      nothing: c === 0
    };
  }

  /** Rule 9: the marks that changed between two states (only the outcome). */
  function flipped(prev, next) {
    if (!prev || !next) return [];
    return prev.outcome !== next.outcome ? ['outcome'] : [];
  }

  /** Caption: the main sentence and the notes that apply, in order (SPEC.md "Captions"). */
  function captionKey(s) {
    var notes = [];
    var c = s.p.commit;
    if (c === s.best) { if (c > 0) notes.push('nAtBest'); else if (s.anyUsage) notes.push('nNonePays'); }
    else notes.push(s.sameAsBest ? 'nSameAsBest' : s.best === 0 ? 'nNonePays' : 'nBest');
    if (s.p.term === 3 && s.p.later === 0) notes.push('nStop');
    else if (s.p.term === 3 && s.p.later < 100) notes.push('nShrink');
    else if (s.p.term === 3 && s.p.later > 100) notes.push('nGrow');
    var key = s.nothing ? 'capNone' : s.outcome === 'save' ? 'capSave' : s.outcome === 'loss' ? 'capLoss' : 'capEven';
    return { key: key, notes: notes };
  }

  var logic = {
    P: P, DISCOUNT: DISCOUNT, TERMS: TERMS, N_MAX: N_MAX, LATER_MAX: LATER_MAX, LATER_STEP: LATER_STEP, MONTHS: MONTHS,
    USAGE: USAGE,
    committedPrice: committedPrice,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    paramsOf: paramsOf,
    flipped: flipped,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
