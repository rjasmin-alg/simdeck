/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-fixed-variable: an in-house platform (a fixed cost, capacity blocks filled to a target utilisation,
   a variable cost per user) against a service paid per user; at the chosen user count the monthly cost of each, the
   average and the next user's cost, the spare capacity, and the break-even volume; plus the curves the two charts draw.
   Explorer: the state is a pure function of the params (compute). Rules: SPEC.md. The sums are in stepcost.js
   (promotable to models/); this file adds the constants, params, presets and the page's derived numbers.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var M = typeof module === 'object' && module.exports
    ? require('./stepcost.js')
    : root.SimdeckModels.stepcost;

  var STEP = 500;      // € a month for one capacity block (SPEC.md, costs)
  var SIZE = 100;      // users one block takes at 100 %
  var PER_USER = 2;    // € a month variable cost per user
  var N_MAX = 1000;    // the charts' user scale
  var AVG_TOP = 50;    // € per user: the per-user chart's scale (the average is clipped above it)
  var SAMPLE = 5;      // users between samples of the average curve

  /** Params: key → [min, max, step]. */
  var RANGES = {
    users: [0, N_MAX, 10],
    util: [50, 100, 5],
    fixed: [0, 6000, 500],
    price: [4, 30, 1]
  };

  function params(users, util, fixed, price) { return { users: users, util: util, fixed: fixed, price: price }; }

  /** Presets, SPEC.md table; expected numbers there. Each carries every param, so a preset is a whole scenario. */
  var presets = [
    { id: 'few-users', params: params(100, 80, 3000, 12) },
    { id: 'step-edge', params: params(400, 80, 3000, 12) },
    { id: 'grown', params: params(1000, 80, 3000, 12) },
    { id: 'headroom', params: params(600, 50, 3000, 12) },
    { id: 'run-hot', params: params(800, 100, 3000, 12) }
  ];

  var defaults = Object.assign({}, presets[1].params);

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function num(v, dflt) {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return dflt;   // empty, boolean, object…
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }

  /** Params made safe (a URL may carry anything): clamped and snapped to the step. */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var out = {};
    Object.keys(RANGES).forEach(function (k) {
      var r = RANGES[k];
      out[k] = clamp(Math.round(num(q[k], defaults[k]) / r[2]) * r[2], r[0], r[1]);
    });
    return out;
  }

  /** Rule 2: the platform for the params. */
  function platform(p) {
    return { fixed: p.fixed, step: STEP, cap: SIZE * p.util / 100, perUser: PER_USER, size: SIZE };
  }

  /** The in-house monthly cost as a staircase over 0…N_MAX: [users, €] corners, a vertical jump at each new block. */
  function staircase(pl) {
    var pts = [[0, pl.fixed]];
    for (var j = 1; (j - 1) * pl.cap < N_MAX; j++) {
      var lo = (j - 1) * pl.cap, hi = Math.min(j * pl.cap, N_MAX);
      pts.push([lo, pl.fixed + pl.step * j + pl.perUser * lo]);
      pts.push([hi, pl.fixed + pl.step * j + pl.perUser * hi]);
    }
    return pts;
  }

  /** The average per user (€, unrounded, for drawing): sampled every SAMPLE users and at both sides of each step. */
  function averageCurve(pl) {
    var ns = [];
    for (var n = SAMPLE; n <= N_MAX; n += SAMPLE) ns.push(n);
    for (var e = pl.cap; e < N_MAX; e += pl.cap) ns.push(e, e + 1);
    ns = ns.filter(function (x, i, a) { return a.indexOf(x) === i; }).sort(function (a, b) { return a - b; });
    return ns.map(function (x) { return [x, M.cost(pl, x).total / x]; });
  }

  /** Block edges on the scale, its right end included: where the next user opens a block (the marginal cost's spikes). */
  function edges(pl) {
    var out = [];
    for (var e = 0; e <= N_MAX; e += pl.cap) out.push(e);
    return out;
  }

  /** Everything the page shows, from the params. */
  function compute(input) {
    var p = normalise(input);
    var pl = platform(p);
    var n = p.users;
    var c = M.cost(pl, n);
    var d = M.diff(pl, n, p.price);
    var top = 0;
    [[N_MAX, M.cost(pl, N_MAX).total], [N_MAX, p.price * N_MAX]].forEach(function (x) { top = Math.max(top, x[1]); });
    return {
      p: p,
      cap: pl.cap,
      inhouse: c,                                   // rule 4: blocks, fixed, steps, variable, total
      service: p.price * n,
      diff: d,
      outcome: n === 0 ? 'none' : M.outcome(d),     // rule 1c; none at 0 users (nothing to compare)
      avg: M.average(pl, n),                        // rule 5, cents; null at 0 users
      opens: M.opensBlock(pl, n),                   // rule 6
      marginal: M.marginal(pl, n),
      spare: M.spare(pl, n),                        // rule 7
      unitCents: 100 * pl.perUser + M.cents(pl.step, pl.cap),   // v + S ÷ cap, cents: a full block's cost per user
      textbook: M.textbook(pl, p.price),            // rule 8
      first: M.first(pl, p.price),
      forGood: M.forGood(pl, p.price),
      chart: {
        top: Math.max(20000, Math.ceil(top / 5000) * 5000),   // € a month: the cost chart's scale
        stairs: staircase(pl),
        avg: averageCurve(pl),
        edges: edges(pl)
      }
    };
  }

  /** Rule 9: the marks that changed between two states (only the outcome). */
  function flipped(prev, next) {
    if (!prev || !next) return [];
    return prev.outcome !== next.outcome ? ['outcome'] : [];
  }

  /** Caption: the main sentence and the notes that apply, in order (SPEC.md "Captions"). */
  function captionKey(s) {
    if (s.p.users === 0) return { key: s.p.fixed === 0 ? 'capNoneFree' : 'capNone', notes: [] };
    var notes = [s.opens ? 'nEdge' : 'nNext'];
    notes.push(s.forGood === null ? 'nNever' : s.first < s.forGood ? 'nZone' : 'nBe');
    var key = { inhouse: 'capInhouse', service: 'capService', even: 'capEven' }[s.outcome];
    return { key: key, notes: notes };
  }

  var logic = {
    STEP: STEP, SIZE: SIZE, PER_USER: PER_USER, N_MAX: N_MAX, AVG_TOP: AVG_TOP, RANGES: RANGES,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    platform: platform,
    flipped: flipped,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
