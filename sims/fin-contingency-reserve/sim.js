/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-contingency-reserve: five lines of a project estimate, each a range (most likely value, how far it
   may fall, how far it may rise); many trials of the total; the budget at each confidence level, the reserve over the
   sum of the most likely values, and the chance that sum is enough.
   Explorer: the state is a pure function of the params (compute). Rules: SPEC.md. The draws and levels are in
   reserve.js (promotable to models/); this file adds the lines, params, presets and the page's derived numbers.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var M = typeof module === 'object' && module.exports
    ? require('./reserve.js')
    : root.SimdeckModels.reserve;

  var LINES = ['hw', 'staff', 'ext', 'mig', 'train'];   // hardware, own staff, contractors, data migration, training
  var CONF = [50, 70, 80, 90, 95];                       // confidence levels, %
  var TRIALS = [100, 1000, 10000];
  var BINS = 40;                                         // histogram bins
  var SEED_MAX = 999999;

  /** Params: key → [min, max, step]. Each line has its most likely value (€), its fall (D, %) and rise (U, %). */
  var RANGES = { seed: [1, SEED_MAX, 1] };
  LINES.forEach(function (id) {
    RANGES[id] = [0, 100000, 500];
    RANGES[id + 'D'] = [0, 50, 5];
    RANGES[id + 'U'] = [0, 200, 5];
  });

  /** A whole scenario: [most likely, down %, up %] for each line in LINES order, then the confidence and trials. */
  function scenario(rows, conf, trials) {
    var p = { line: 'hw', conf: conf, trials: trials, seed: 1 };
    LINES.forEach(function (id, i) { p[id] = rows[i][0]; p[id + 'D'] = rows[i][1]; p[id + 'U'] = rows[i][2]; });
    return p;
  }

  var PROJECT = [[20000, 5, 15], [15000, 10, 40], [12000, 10, 30], [8000, 15, 100], [5000, 15, 40]];

  /** Presets, SPEC.md table; expected numbers there. Each carries every param, so a preset is a whole scenario. */
  var presets = [
    { id: 'project', params: scenario(PROJECT, 80, 10000) },
    { id: 'symmetric', params: scenario(PROJECT.map(function (r) { return [r[0], 15, 15]; }), 50, 10000) },
    { id: 'one-wild', params: scenario([[20000, 5, 10], [15000, 5, 10], [12000, 5, 10], [8000, 10, 200], [5000, 5, 10]], 80, 10000) },
    { id: 'few-trials', params: scenario(PROJECT, 80, 100) },
    { id: 'spend-cap', params: scenario([[5000, 5, 10], [3000, 10, 40], [2000, 10, 40], [1500, 10, 100], [1000, 10, 50]], 95, 10000) }
  ];
  presets[2].params.line = 'mig';

  var defaults = Object.assign({}, presets[0].params);

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function num(v, dflt) {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return dflt;   // empty, boolean, object…
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }
  function oneOf(list, v, dflt) {
    var x = num(v, NaN);
    return list.indexOf(x) >= 0 ? x : dflt;
  }

  /** "Run again": the next seed, back to 1 after the last. */
  function nextSeed(seed) { return seed >= SEED_MAX ? 1 : seed + 1; }

  /** Params made safe (a URL may carry anything): ranges clamped and snapped to the step; a confidence, trial count
      or line outside its list takes the default. */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var out = {};
    Object.keys(RANGES).forEach(function (k) {
      var r = RANGES[k];
      out[k] = clamp(Math.round(num(q[k], defaults[k]) / r[2]) * r[2], r[0], r[1]);
    });
    out.line = LINES.indexOf(q.line) >= 0 ? q.line : defaults.line;
    out.conf = oneOf(CONF, q.conf, defaults.conf);
    out.trials = oneOf(TRIALS, q.trials, defaults.trials);
    return out;
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var lines = LINES.map(function (id) {
      var l = M.line(p[id], p[id + 'D'], p[id + 'U']);
      return { id: id, lo: l.lo, ml: l.ml, hi: l.hi, mean: Math.floor((2 * (l.lo + l.ml + l.hi) + 3) / 6) };
    });
    var base = 0, low = 0, high = 0;
    lines.forEach(function (l) { base += l.ml; low += l.lo; high += l.hi; });
    var sorted = M.trials(lines, p.trials, p.seed);
    var n = sorted.length;
    var levels = CONF.map(function (q) {
      var b = M.level(sorted, q);
      return { q: q, budget: b, reserve: b - base, pct: M.pct(b - base, base) };
    });
    var at = levels[CONF.indexOf(p.conf)];
    var enough = M.atOrBelow(sorted, base);
    var hist = M.histogram(sorted, base, at.budget, BINS);
    return {
      p: p,
      n: n,
      lines: lines,
      top: Math.max.apply(null, lines.map(function (l) { return l.hi; }).concat(1)),   // the lines' common scale (€)
      base: base,                                  // the sum of the most likely values
      mean: M.meanSum(lines),                      // the sum of the averages
      low: low,                                    // everything at its low
      high: high,                                  // everything at its high
      enough: enough,                              // trials at or below the base
      enoughTenths: M.tenths(enough, n),           // … in tenths of a per cent
      p50: levels[0].budget,
      levels: levels,
      at: at,                                      // the chosen level
      covered: at.reserve <= 0,                    // the base already gives the chosen confidence
      symmetric: lines.every(function (l) { return l.ml - l.lo === l.hi - l.ml; }),
      hist: hist
    };
  }

  /** Rule 10: the marks that changed between two states (whether the base covers the chosen level). */
  function flipped(prev, next) {
    if (!prev || !next) return [];
    return prev.covered !== next.covered ? ['outcome'] : [];
  }

  /** Caption: the main sentence and the notes that apply, in order (SPEC.md "Captions"). */
  function captionKey(s) {
    var notes = [];
    if (s.symmetric) notes.push('nSymmetric');
    else if (s.mean > s.base) notes.push('nSkew');
    if (s.n <= 100) notes.push('nFew');
    return { key: s.covered ? 'capCovered' : 'capReserve', notes: notes };
  }

  var logic = {
    LINES: LINES, CONF: CONF, TRIALS: TRIALS, BINS: BINS, RANGES: RANGES, SEED_MAX: SEED_MAX,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    nextSeed: nextSeed,
    flipped: flipped,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
