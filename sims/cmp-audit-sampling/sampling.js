/* SPDX-License-Identifier: AGPL-3.0-or-later
   The audit-sampling model: a population of a control's occurrences (N), k of them failed, an auditor's sample of n
   drawn without replacement, the exceptions it holds and what the auditor concludes; the exact chance of each
   outcome (hypergeometric), the textbook approximation 1 − (1 − rate)ⁿ, and many seeded draws. SPEC.md rules 1-7.
   Catalogue §5.24: it sits on the evidence trail of cmp-policy-to-record (the records of one control over the audit
   period are the population); pure functions over plain data, no words and no dependencies, ready to be promoted to
   models/sampling.js unchanged (models/README.md). In a page it registers on globalThis.SimdeckModels.sampling;
   under node it is module.exports. */
(function (root) {
  'use strict';

  /** mulberry32, the same generator as Simdeck.rng in kit/kit.js: a function returning [0, 1). */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Rule 2: the seed of stream `i` of a run (0 the population, d + 1 the d-th sample), so each sample has its own
      stream: a larger n extends every sample instead of reshuffling the run. */
  function streamSeed(seed, i) {
    return (Math.imul(seed >>> 0, 0x9e3779b1) + Math.imul(i + 1, 0x85ebca6b)) >>> 0;
  }

  /** Rule 1: failed occurrences from a whole-percent rate, halves up: round(pct × N ÷ 100). */
  function failuresOf(N, pct) { return Math.floor((2 * pct * N + 100) / 200); }

  /** Rule 2: the first n of a random order of 0…N−1 (partial Fisher–Yates over a sparse array, O(n)). The first m
      picks are the same for every n ≥ m, so a larger sample contains the smaller one. */
  function pick(N, n, r) {
    var swap = new Map(), out = [];
    var m = Math.min(n, N);
    for (var i = 0; i < m; i++) {
      var j = i + Math.floor(r() * (N - i));
      var vi = swap.has(i) ? swap.get(i) : i;
      var vj = swap.has(j) ? swap.get(j) : j;
      out.push(vj);
      swap.set(j, vi);
    }
    return out;
  }

  function asc(a, b) { return a - b; }

  /** Rule 2: which occurrences failed: the first k of stream 0, sorted. */
  function population(N, k, seed) { return pick(N, k, rng(streamSeed(seed, 0))).sort(asc); }

  /** Rule 2: the d-th sample (d from 0), sorted. */
  function sample(N, n, seed, d) { return pick(N, n, rng(streamSeed(seed, d + 1))).sort(asc); }

  /** Rule 4: the auditor's reading of a sample with x exceptions. */
  function conclude(x) { return x === 0 ? 'pass' : x === 1 ? 'extend' : 'finding'; }

  /** Rule 3: the exact chance of 0, 1 and 2 or more exceptions in a sample of n from N with k failed
      (hypergeometric). p2 is never below 0. */
  function chance(N, k, n) {
    n = Math.min(n, N);
    var p0 = 1, i;
    for (i = 0; i < n; i++) p0 *= (N - k - i) / (N - i);
    if (n > N - k) p0 = 0;
    var p1 = 0;
    if (k >= 1 && n >= 1 && n - 1 <= N - k) {
      p1 = n * k / N;
      for (i = 0; i < n - 1; i++) p1 *= (N - k - i) / (N - 1 - i);
    }
    return { p0: p0, p1: p1, p2: Math.max(0, 1 - p0 - p1) };
  }

  /** Rule 3: the textbook approximation (a large population): 1 − (1 − rate)ⁿ. */
  function formula(rate, n) { return 1 - Math.pow(1 - rate, n); }

  /** Rule 3: the smallest sample that finds at least one exception with chance ≥ target (exact), or null with k = 0. */
  function sizeFor(N, k, target) {
    if (k <= 0) return null;
    for (var n = 1; n <= N; n++) if (1 - chance(N, k, n).p0 >= target - 1e-12) return n;
    return N;
  }

  /** Rule 3: with no exception in n, the rate the auditor can rule out with confidence c (large population):
      1 − (1 − c)^(1/n). */
  function upperBound(n, c) { return 1 - Math.pow(1 - c, 1 / n); }

  /** Rules 4-5: many samples. Returns per (exceptions in each sample), hist [pass, extend, finding], and the last
      sample with its exceptions. */
  function run(N, failed, n, draws, seed) {
    var bad = new Set(failed), per = [], hist = [0, 0, 0], last = [], hits = [];
    for (var d = 0; d < draws; d++) {
      var s = sample(N, n, seed, d);
      var h = s.filter(function (i) { return bad.has(i); });
      per.push(h.length);
      hist[Math.min(h.length, 2)] += 1;
      if (d === draws - 1) { last = s; hits = h; }
    }
    return { per: per, hist: hist, last: last, hits: hits };
  }

  var model = {
    rng: rng, streamSeed: streamSeed, failuresOf: failuresOf, pick: pick, population: population, sample: sample,
    conclude: conclude, chance: chance, formula: formula, sizeFor: sizeFor, upperBound: upperBound, run: run
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {}).sampling = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
