/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for tail-latency: one backend's mean and p99 against its variability cv², and the share of user requests that
   meet a slow call when each fans out to N backends (rules in SPEC.md). Pure: no DOM, no Math.random, no Date, no
   timers. State is plain JSON. The page loads this as a classic script (window.SimLogic); node tests require() it.
   An explorer: the state is a pure function of the params, initial(params) = compute(params), no steps.
   utilization, zone and queueMetrics (with CLAMP and KNEE) are copied from sims/utilisation-latency/sim.js @ f2e6118
   (models/ has no queueing model yet; NOTES.md, Shared requests). sketch() is the page's illustration (SPEC.md,
   "Sketch"), pure and tested, not part of the state. */
(function (root) {
  'use strict';

  // ── from sims/utilisation-latency/sim.js @ f2e6118 (unchanged) ──
  /** ρ at or above this is fed to the formulas as this (they have a pole at ρ = 1); dc-sim _RHO_SATURATION_CLAMP. */
  var CLAMP = 0.999;
  /** Zone edges (rule 7): the knee starts at 0.8, saturation at 1. */
  var KNEE = 0.8;
  var LN100 = Math.log(100);

  /** Rule 1: ρ = λ / C (∞ for λ > 0 at C = 0). */
  function utilization(lambda, capacity) {
    if (capacity <= 0) return lambda > 0 ? Infinity : 0;
    return lambda / capacity;
  }

  /** Rule 7: below the knee, in it, or saturated (ties go up: 0.8 is the knee, 1 is saturated). */
  function zone(rho) { return rho >= 1 ? 'saturated' : rho >= KNEE ? 'knee' : 'below'; }

  /** Rules 1–5 for one node: the full M/G/1 metric set (dc-sim compute_queue_metrics, plus L, Lq and the zone). */
  function queueMetrics(lambda, capacity, cv2) {
    var rho = utilization(lambda, capacity);
    var r = Math.min(rho, CLAMP);                                  // rule 4: finite numbers past the pole
    var vf = (1 + cv2) / 2;                                        // P-K variance factor
    var wq = (r / (1 - r)) * vf / capacity;                        // rule 2
    var w = wq + 1 / capacity;
    var p99 = LN100 * vf / (capacity * (1 - r));                   // rule 3
    return {
      lambda: lambda, capacity: capacity, cv2: cv2,
      rho: rho, wq: wq, w: w, p99: p99,
      L: lambda * w, Lq: lambda * wq,                              // rule 5: Little's law
      saturated: rho >= 1, zone: zone(rho)
    };
  }
  // ── end of copy ──

  /** dc-sim scenarios/tail_decoupling.yaml: the db node, C 10 req/s. */
  var CAPACITY = 10;
  /** Share of calls above the chosen percentile (rule 2). */
  var Q = { p99: 0.01, p999: 0.001 };
  /** p99.9 / p99 under the model's exponential tail form (rule 1, derived). */
  var P999_FACTOR = Math.log(1000) / LN100;

  var defaults = {
    cv2: 1,         // squared coefficient of variation of the backend's service time, 0–16
    rho: 0.1,       // the backend's utilisation: 0.1, 0.5, 0.8
    fanout: 1,      // N, parallel calls per user request, 1–200
    slowP: 'p99'    // a slow call is above p99 ('p99') or p99.9 ('p999')
  };

  /** Rule 2: a user request waiting for N independent calls is slow when any call is: 1 − (1 − q)^N. */
  function pSlow(n, q) { return -Math.expm1(n * Math.log1p(-q)); }   // = 1 − (1 − q)^N, exact at N = 1

  /** Rule 1: the tail moved more than twice as far as the mean (strict; dc-sim's acceptance assertion). */
  function decoupled(ratioMean, ratioP99) { return ratioP99 > 2 * ratioMean; }

  function compute(p) {
    var C = CAPACITY;
    var lambda = p.rho * C;
    var m = queueMetrics(lambda, C, p.cv2);
    var ref = queueMetrics(lambda, C, 1);
    var q = Q[p.slowP];
    var ratioMean = m.w / ref.w, ratioP99 = m.p99 / ref.p99;
    var p999 = m.p99 * P999_FACTOR;
    return {
      capacity: C,
      service: 1 / C,
      lambda: lambda,
      rho: m.rho,
      cv2: p.cv2,
      wMean: m.w,
      p99: m.p99,
      p999: p999,
      ratioMean: ratioMean,
      ratioP99: ratioP99,
      decoupled: decoupled(ratioMean, ratioP99),
      fanout: p.fanout,
      slowP: p.slowP,
      q: q,
      threshold: p.slowP === 'p999' ? p999 : m.p99,
      pSlow: pSlow(p.fanout, q),
      slowCalls: p.fanout * q
    };
  }

  var LEFT = ['cv2', 'rho'], RIGHT = ['fanout', 'slowP'];

  /**
   * The one thing the caption should say (the page picks the words); prev = params before the last change, or null.
   * A change of only the left params (cv², ρ) tells the left story, only the right ones (N, slow line) the right
   * story; anything else (first load, a preset that moves both, no change) the right story when N > 1, else the left.
   */
  function captionKey(s, p, prev) {
    var changed = prev ? Object.keys(defaults).filter(function (k) { return prev[k] !== p[k]; }) : [];
    var only = function (side) { return changed.length > 0 && changed.every(function (k) { return side.indexOf(k) >= 0; }); };
    var right = only(RIGHT) || (!only(LEFT) && s.fanout > 1);
    if (right) return s.fanout > 1 ? 'fanout' : 'fanOne';
    if (s.cv2 > 1) return s.decoupled ? 'tail' : s.rho >= 0.5 ? 'cv2Load' : 'cv2Up';
    return s.cv2 === 1 ? 'cv2Ref' : 'cv2Down';
  }

  var GAUGES = ['wMean', 'p99', 'pSlow'];

  /** "Changed": the gauge(s) whose value moved most with the last change, as |ln(new/old)|; a tie marks all of them. */
  function moved(s, prevState) {
    if (!prevState) return [];
    var d = GAUGES.map(function (k) { return Math.abs(Math.log(s[k] / prevState[k])); });
    var max = Math.max.apply(null, d);
    if (!(max > 1e-12)) return [];
    return GAUGES.filter(function (k, i) { return d[i] >= max - 1e-9 * max; });
  }

  // ── the sketch: a gamma distribution with the model's mean and p99 (SPEC.md, "Sketch") ──

  /** ln Γ(x), Lanczos (g 7, n 9), x > 0. */
  var LANCZOS = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  function lnGamma(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
    x -= 1;
    var a = LANCZOS[0], t = x + 7.5;
    for (var i = 1; i < 9; i++) a += LANCZOS[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }

  /** Regularised lower incomplete gamma P(k, x): series below k + 1, continued fraction above. */
  function gammaP(k, x) {
    if (x <= 0) return 0;
    var lead = k * Math.log(x) - x - lnGamma(k), i;
    if (x < k + 1) {
      var sum = 1 / k, term = sum;
      for (i = 1; i < 1000; i++) { term *= x / (k + i); sum += term; if (term < sum * 1e-15) break; }
      return Math.min(1, sum * Math.exp(lead));
    }
    var b = x + 1 - k, c = 1e300, d = 1 / b, f = d;
    for (i = 1; i < 1000; i++) {
      var an = -i * (i - k);
      b += 2;
      d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d;
      var del = d * c;
      f *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return Math.max(0, 1 - Math.exp(lead) * f);
  }

  /** The p-quantile of a gamma with shape k and scale 1, by bisection on ln x (small shapes put low quantiles near 1e-50). */
  function gammaQuantile(k, p) {
    var hi = Math.max(1, k);
    while (gammaP(k, hi) < p) hi *= 2;
    var lo = Math.log(1e-300);
    hi = Math.log(hi);
    for (var i = 0; i < 200; i++) {
      var mid = (lo + hi) / 2;
      if (gammaP(k, Math.exp(mid)) < p) lo = mid; else hi = mid;
      if (hi - lo <= 1e-13) break;
    }
    return Math.exp((lo + hi) / 2);
  }

  /**
   * Shape k whose p99/mean is `ratio`, 1 < ratio ≤ 28.3. The ratio peaks at 28.34 near k = 0.0158 and falls from there
   * (below it, 99 % of the mass sits ever closer to 0), so the bracket starts just past the peak; the params reach 28.05
   * (ρ 0.1, cv² 0, the wait part alone).
   */
  function gammaShape(ratio) {
    var lo = Math.log(0.016), hi = Math.log(1e3);
    for (var i = 0; i < 60; i++) {
      var mid = (lo + hi) / 2, k = Math.exp(mid);
      if (gammaQuantile(k, 0.99) / k > ratio) lo = mid; else hi = mid;
    }
    return Math.exp((lo + hi) / 2);
  }

  /**
   * n request times (default 100), sorted: floor + the quantiles (i + ½)/n of a gamma whose mean is w − floor and whose
   * 0.99-quantile is p99 − floor. floor (default 0) is a time no request can beat: at cv² 0 every service takes 1/C.
   */
  function sketch(w, p99, n, floor) {
    n = n || 100;
    floor = floor || 0;
    var k = gammaShape((p99 - floor) / (w - floor)), scale = (w - floor) / k, times = [];
    for (var i = 0; i < n; i++) times.push(floor + scale * gammaQuantile(k, (i + 0.5) / n));
    return { shape: k, scale: scale, floor: floor, times: times };
  }

  /** The sketch for a state: floored at the service time 1/C when cv² is 0 (deterministic service). */
  function sketchOf(s) { return sketch(s.wMean, s.p99, 100, s.cv2 === 0 ? s.service : 0); }

  var presets = [
    { id: 'tail-decoupled', params: { cv2: 9 } },
    { id: 'fanout-10', params: { fanout: 10 } },
    { id: 'fanout-100', params: { fanout: 100 } },
    { id: 'p999', params: { fanout: 100, slowP: 'p999' } }
  ];

  var logic = {
    CLAMP: CLAMP, KNEE: KNEE, CAPACITY: CAPACITY, Q: Q, GAUGES: GAUGES,
    defaults: defaults,
    presets: presets,
    initial: compute,
    compute: compute,
    utilization: utilization,
    zone: zone,
    queueMetrics: queueMetrics,
    pSlow: pSlow,
    decoupled: decoupled,
    captionKey: captionKey,
    moved: moved,
    gammaP: gammaP,
    gammaQuantile: gammaQuantile,
    sketch: sketch,
    sketchOf: sketchOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
