/* SPDX-License-Identifier: AGPL-3.0-or-later
   A contingency reserve from a range estimate (rules: SPEC.md 1–9). Each line of the estimate is a triangular range
   (low, most likely, high); many trials draw every line once and add them up; the totals, sorted, give the budget
   for each confidence level (P50, P80 …), the chance that the sum of the most likely values is enough, and the
   reserve: the budget at the chosen level minus that sum.
   Deterministic: the draws come from mulberry32 with a seed (the same generator as Simdeck.rng); each trial's total
   is rounded once to whole euros, and every count, level and comparison uses those whole-euro totals.
   Pure: no DOM, no words, plain data in and out, so the coordinator can promote it to models/reserve.js unchanged.
   Registers on globalThis.SimdeckModels.reserve in a page; module.exports under node. */
(function (root) {
  'use strict';

  /** mulberry32, as Simdeck.rng in kit/kit.js: a function returning [0, 1). */
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

  /** Rule 2: a line's range from its most likely value (€) and how far it may fall and rise (% of it). */
  function line(ml, down, up) {
    return { lo: ml * (100 - down) / 100, ml: ml, hi: ml * (100 + up) / 100 };
  }

  /** Rule 3: the triangular draw for u in [0, 1) (inverse of the distribution function). A zero-width range gives
      its value; the left side takes u below the mode's share, the right side the rest. */
  function draw(l, u) {
    var w = l.hi - l.lo;
    if (w === 0) return l.ml;
    var fc = (l.ml - l.lo) / w;
    if (u < fc) return l.lo + Math.sqrt(u * w * (l.ml - l.lo));
    return l.hi - Math.sqrt((1 - u) * w * (l.hi - l.ml));
  }

  /** Rule 4: n trials; trial t draws line i with the (t × lines + i)-th number of the seeded stream; each total is
      rounded once to whole euros (halves up). Returns the totals sorted ascending. */
  function trials(lines, n, seed) {
    var r = rng(seed), out = new Array(n);
    for (var t = 0; t < n; t++) {
      var sum = 0;
      for (var i = 0; i < lines.length; i++) sum += draw(lines[i], r());
      out[t] = Math.floor(sum + 0.5);
    }
    return out.sort(function (a, b) { return a - b; });
  }

  /** Rule 5: the budget at confidence q % (nearest rank): the smallest trial total with at least q % of the trials
      at or below it, i.e. sorted[ceil(q × n / 100) − 1]. */
  function level(sorted, q) {
    var k = Math.ceil(q * sorted.length / 100);
    return sorted[Math.max(1, k) - 1];
  }

  /** Rule 6: how many trials come in at or below x (a total equal to x is enough). Binary search on the sorted totals. */
  function atOrBelow(sorted, x) {
    var lo = 0, hi = sorted.length;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (sorted[mid] <= x) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  /** Rule 1: the sum of the lines' averages ((low + likely + high) ÷ 3 each), rounded once to whole euros, halves up. */
  function meanSum(lines) {
    var s3 = 0;
    lines.forEach(function (l) { s3 += l.lo + l.ml + l.hi; });
    return Math.floor((2 * s3 + 3) / 6);
  }

  /** Rule 8: a whole percentage of a part over a whole, halves up; null when the whole is 0. */
  function pct(part, whole) {
    if (!whole) return null;
    var x = 100 * part / whole;
    return x < 0 ? 0 - Math.floor(-x + 0.5) || 0 : Math.floor(x + 0.5);   // no −0 (it is not JSON-safe)
  }

  /** Rule 6: a share in tenths of a per cent, halves up (part and whole ≥ 0); null when the whole is 0. */
  function tenths(part, whole) {
    if (!whole) return null;
    return Math.floor(1000 * part / whole + 0.5);
  }

  /** A "nice" axis step (1, 2, 2.5 or 5 × 10^k) at least span ÷ parts. */
  function niceStep(span, parts) {
    var raw = Math.max(span, 1) / parts;
    var p = Math.pow(10, Math.floor(Math.log10(raw)));
    var m = [1, 2, 2.5, 5, 10].find(function (x) { return x * p >= raw - 1e-9; });
    return m * p;
  }

  /** Rule 9: the chart's axis and bins. The axis runs from min(smallest total, base) to max(largest total, base),
      on nice steps; bins of equal width; a total on a bin's edge goes to the upper bin, the axis end to the last.
      Each bin counts its totals in three parts: at or below the base, above the base up to the budget, above the budget. */
  function histogram(sorted, base, budget, bins) {
    var n = sorted.length;
    var min = Math.min(sorted[0], base), max = Math.max(sorted[n - 1], base);
    var step = niceStep(max - min, 4);
    var lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    if (hi === lo) hi = lo + step;
    var out = [];
    for (var b = 0; b < bins; b++) out.push({ in: 0, res: 0, over: 0 });
    sorted.forEach(function (x) {
      var b = Math.min(bins - 1, Math.floor((x - lo) * bins / (hi - lo)));
      var part = x <= base ? 'in' : x <= budget ? 'res' : 'over';
      out[b][part]++;
    });
    var ticks = [];
    for (var v = lo; v <= hi + 1e-9; v += step) ticks.push(v);
    return { lo: lo, hi: hi, step: step, ticks: ticks, bins: out };
  }

  var reserve = {
    rng: rng, line: line, draw: draw, trials: trials, level: level, atOrBelow: atOrBelow, meanSum: meanSum, pct: pct, tenths: tenths,
    niceStep: niceStep, histogram: histogram
  };

  if (typeof module === 'object' && module.exports) module.exports = reserve;
  else (root.SimdeckModels = root.SimdeckModels || {}).reserve = reserve;
})(typeof globalThis !== 'undefined' ? globalThis : this);
