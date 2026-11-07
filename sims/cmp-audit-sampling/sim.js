/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-audit-sampling: a control's occurrences over the audit period (250 change tickets by default), a true
   failure rate, an auditor's sample of n; many samples drawn, the share that found at least one exception, against
   the exact chance and the formula 1 − (1 − rate)ⁿ; what the last sample made the auditor conclude, against the truth.
   Explorer: the state is a pure function of the params (compute). Rules: SPEC.md. Sampling, chances and draws are in
   sampling.js (promotable to models/); this file adds the frequencies, params, presets and the page's numbers.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var M = typeof module === 'object' && module.exports
    ? require('./sampling.js')
    : root.SimdeckModels.sampling;

  /** Rule 6: how often the control runs → occurrences in a year and the usual sample [low, high] (common practice in
      tests of controls; illustrative, firms differ). */
  var FREQS = ['quarterly', 'monthly', 'weekly', 'daily', 'multi'];
  var POP = { quarterly: 4, monthly: 12, weekly: 52, daily: 250, multi: 1000 };
  var USUAL = { quarterly: [2, 2], monthly: [2, 5], weekly: [5, 15], daily: [20, 40], multi: [25, 60] };
  var N_MAX = 250;          // the largest sample the slider offers
  var DRAWS_MAX = 1000;
  var SEED_MAX = 999999;
  var RANGES = { rate: [0, 20], draws: [0, DRAWS_MAX], seed: [1, SEED_MAX] };
  var CONFIDENCE = 0.95;

  /** Presets, SPEC.md table; expected numbers there. Each carries every param. */
  function P(over) {
    return Object.assign({ freq: 'daily', rate: 2, n: 25, draws: 1, seed: 6 }, over);
  }
  var presets = [
    { id: 'one-sample', params: P({}) },
    { id: 'many', params: P({ draws: 1000 }) },
    { id: 'clean', params: P({ rate: 0, draws: 1000 }) },
    { id: 'bad-control', params: P({ rate: 10, draws: 1000 }) },
    { id: 'sure', params: P({ n: 112, draws: 1000 }) },
    { id: 'monthly', params: P({ freq: 'monthly', rate: 10, n: 2, draws: 1000 }) }
  ];
  var defaults = Object.assign({}, presets[0].params);

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function num(v, dflt) {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return dflt;   // empty, boolean, object…
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }
  /** Rule 6: the largest sample for a frequency: the whole population, at most N_MAX. */
  function nMax(freq) { return Math.min(POP[freq], N_MAX); }

  /** Rule 6: params made safe (a URL may carry anything): whole numbers, halves away from zero, clamped; an unknown
      frequency, takes the default. The sample is clamped to 1…nMax(freq). */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var out = {};
    out.freq = FREQS.indexOf(q.freq) >= 0 ? q.freq : defaults.freq;
    Object.keys(RANGES).forEach(function (k) {
      var x = num(q[k], defaults[k]);
      out[k] = clamp(Math.sign(x) * Math.round(Math.abs(x)), RANGES[k][0], RANGES[k][1]);
    });
    var n = num(q.n, defaults.n);
    out.n = clamp(Math.sign(n) * Math.round(Math.abs(n)), 1, nMax(out.freq));
    return out;
  }

  /** A share as whole percent, halves up. */
  function pct(x) { return Math.floor(x * 100 + 0.5 + 1e-9); }
  /** a ÷ b as whole percent, halves up, in integers (b > 0). */
  function ratio(a, b) { return Math.floor((200 * a + b) / (2 * b)); }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var N = POP[p.freq], n = p.n;
    var k = M.failuresOf(N, p.rate);
    var failed = M.population(N, k, p.seed);
    var ch = M.chance(N, k, n);
    var r = M.run(N, failed, n, p.draws, p.seed);
    var found = r.hist[1] + r.hist[2];
    var last = null;
    if (p.draws > 0) {
      var x = r.hits.length, verdict = M.conclude(x);
      last = { idx: r.last, hits: r.hits, x: x, verdict: verdict,
        outcome: verdict !== 'pass' ? 'caught' : k ? 'missed' : 'right' };
    }
    var usual = USUAL[p.freq];
    return {
      p: p,
      N: N,
      k: k,
      rate10: Math.floor((2000 * k + N) / (2 * N)),   // the true rate in tenths of a percent, halves up
      failed: failed,
      n: n,
      all: n >= N,                                     // every occurrence tested
      exact: { p0: ch.p0, p1: ch.p1, p2: ch.p2, found: 1 - ch.p0 },
      expPct: { found: pct(1 - ch.p0), p0: pct(ch.p0), p1: pct(ch.p1), p2: pct(ch.p2) },
      formula: pct(M.formula(k / N, n)),
      need: M.sizeFor(N, k, CONFIDENCE),
      bound: pct(M.upperBound(n, CONFIDENCE)),
      draws: p.draws,
      hist: r.hist,
      per: r.per,
      found: found,
      foundPct: p.draws ? ratio(found, p.draws) : null,
      histPct: r.hist.map(function (c) { return p.draws ? ratio(c, p.draws) : null; }),
      last: last,
      usual: usual,
      band: n < usual[0] ? 'below' : n > usual[1] ? 'above' : 'in'
    };
  }

  /** "New population": the next seed, back to 1 after the last. Draw buttons: draws + m, at most DRAWS_MAX. */
  function nextSeed(seed) { return seed >= SEED_MAX ? 1 : seed + 1; }
  function more(draws, m) { return Math.min(DRAWS_MAX, draws + m); }

  /** Rule 7: caption, the main sentence and the notes that apply, in order. */
  function captionKey(s) {
    var key;
    if (s.draws === 0) key = s.k ? 'capStart' : 'capStartClean';
    else if (s.draws === 1) {
      key = s.last.verdict === 'extend' ? (s.all ? 'capOneAll' : 'capOne') : s.last.verdict === 'finding' ? 'capFinding'
        : s.k ? 'capMiss' : 'capClean';
    } else key = s.k ? 'capMany' : 'capManyClean';
    var notes = [];
    if (key === 'capMany' && s.found < s.draws) notes.push('nOthers');   // the samples that said "no exceptions"
    if (s.all) notes.push('nAll');                                       // n = N is never below the usual range
    else if (s.band === 'below') notes.push('nBelow');
    return { key: key, notes: notes };
  }

  var logic = {
    FREQS: FREQS, POP: POP, USUAL: USUAL, N_MAX: N_MAX, DRAWS_MAX: DRAWS_MAX, SEED_MAX: SEED_MAX, RANGES: RANGES,
    CONFIDENCE: CONFIDENCE,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    nMax: nMax,
    nextSeed: nextSeed,
    more: more,
    pct: pct,
    ratio: ratio,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
