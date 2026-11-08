/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for littles-law: L = λW for a shop, a server and a build farm (rules in SPEC.md). Pure: no DOM, no
   Math.random, no Date, no timers; randomness for the trace comes in as a seeded rng from the caller. State is plain
   JSON. The page loads this as a classic script (window.SimLogic); node tests require() it.
   An explorer: the state is a pure function of the params, initial(params) = compute(params), no steps.
   utilization, zone and queueMetrics (with CLAMP and KNEE) are copied from sims/utilisation-latency/sim.js @ f2e6118
   (dc-sim's M/G/1 formulas); models/ has no queueing model yet (NOTES.md, "Shared requests"). */
(function (root) {
  'use strict';

  // ── from sims/utilisation-latency/sim.js @ f2e6118 (unchanged) ──
  /** ρ at or above this is fed to the formulas as this (they have a pole at ρ = 1); dc-sim _RHO_SATURATION_CLAMP. */
  var CLAMP = 0.999;
  /** Zone edges: the knee starts at 0.8, saturation at 1. */
  var KNEE = 0.8;
  var LN100 = Math.log(100);
  /** ρ = λ / C (∞ for λ > 0 at C = 0). */
  function utilization(lambda, capacity) {
    if (capacity <= 0) return lambda > 0 ? Infinity : 0;
    return lambda / capacity;
  }
  /** Below the knee, in it, or saturated (ties go up: 0.8 is the knee, 1 is saturated). */
  function zone(rho) { return rho >= 1 ? 'saturated' : rho >= KNEE ? 'knee' : 'below'; }
  /** The full M/G/1 metric set for one node (dc-sim compute_queue_metrics, plus L, Lq and the zone). */
  function queueMetrics(lambda, capacity, cv2) {
    var rho = utilization(lambda, capacity);
    var r = Math.min(rho, CLAMP);
    var vf = (1 + cv2) / 2;
    var wq = (r / (1 - r)) * vf / capacity;
    var w = wq + 1 / capacity;
    var p99 = LN100 * vf / (capacity * (1 - r));
    return {
      lambda: lambda, capacity: capacity, cv2: cv2,
      rho: rho, wq: wq, w: w, p99: p99,
      L: lambda * w, Lq: lambda * wq,
      saturated: rho >= 1, zone: zone(rho)
    };
  }
  // ── end of the copy ──

  /**
   * Units and slider ranges per system (SPEC.md). div = W units in one λ unit (rule 2). `start` are the values the page
   * loads when the system is switched by hand: λ, W, L, places, capacity.
   */
  var SYSTEMS = {
    'shop': {
      div: 1,
      lambda: [1, 20], W: [1, 30], L: [1, 60], places: [1, 64], capacity: [1, 20],
      start: { lambda: 2, W: 5, L: 10, places: 30, capacity: 3 }
    },
    'server': {
      div: 1000,
      lambda: [1, 1000], W: [1, 500], L: [1, 200], places: [1, 64], capacity: [1, 1000],
      start: { lambda: 200, W: 50, L: 10, places: 16, capacity: 250 }
    },
    'build-farm': {
      div: 60,
      lambda: [1, 60], W: [1, 120], L: [1, 30], places: [1, 20], capacity: [1, 60],
      start: { lambda: 12, W: 25, L: 5, places: 8, capacity: 15 }
    }
  };
  var SYSTEM_IDS = ['shop', 'server', 'build-farm'];

  var defaults = {
    system: 'shop',
    solveFor: 'L',     // 'L' | 'W' | 'lambda'
    lambda: 2,
    W: 5,
    L: 10,
    places: 30,
    fromQueue: false,
    capacity: 3
  };

  /** Rule 3: a / b, or null when b is 0 (no value). */
  function ratio(a, b) { return b === 0 ? null : a / b; }

  function compute(p) {
    var sys = SYSTEMS[p.system] || SYSTEMS.shop;
    var div = sys.div;
    var out = {
      system: SYSTEMS[p.system] ? p.system : 'shop',
      div: div,
      fromQueue: !!p.fromQueue,
      solveFor: p.fromQueue ? 'L' : p.solveFor,
      lambda: null, W: null, L: null,
      lambdaPerW: null,     // rule 2: λ in the W unit's time
      defined: true,
      stable: true,
      rho: null,
      places: p.fromQueue ? null : p.places,
      capacity: p.fromQueue ? p.capacity : null,
      queue: null           // from the queue: W and L in the λ unit's time (rule 5)
    };

    if (p.fromQueue) {
      // Rule 5: W from dc-sim's M/G/1 formula at cv² = 1; rule 4: stable while ρ < 1.
      var m = queueMetrics(p.lambda, p.capacity, 1);
      out.lambda = p.lambda;
      out.rho = m.rho;
      out.stable = m.rho < 1;
      out.queue = { w: m.w, wq: m.wq, service: 1 / p.capacity };
      if (out.stable) {
        out.W = m.w * div;
        out.L = p.lambda * out.W / div;
      }
    } else {
      // Rules 1–3: the two set quantities give the third.
      if (out.solveFor === 'W') {
        out.lambda = p.lambda; out.L = p.L; out.W = ratio(p.L * div, p.lambda);
      } else if (out.solveFor === 'lambda') {
        out.W = p.W; out.L = p.L; out.lambda = ratio(p.L * div, p.W);
      } else {
        out.solveFor = 'L';
        out.lambda = p.lambda; out.W = p.W; out.L = p.lambda * p.W / div;
      }
      out.defined = out.lambda !== null && out.W !== null;
      // Rule 4: each item holds a place for its whole stay; stable while L < places (ties are not stable).
      out.rho = utilization(out.L, p.places);
      out.stable = out.defined && out.rho < 1;
    }
    out.lambdaPerW = out.lambda === null ? null : out.lambda / div;
    return out;
  }

  /**
   * The one thing the caption should say (the page picks the words); prev = params before the last change, or null.
   * First that applies (SPEC.md, "Captions").
   */
  function captionKey(s, p, prev) {
    if (s.fromQueue) return s.stable ? 'queue' : 'queueUnstable';
    if (!s.stable) return 'unstable';
    if (s.solveFor === 'L' && prev && !prev.fromQueue && prev.system === p.system && prev.solveFor === 'L') {
      var dW = prev.W !== p.W, dL = prev.lambda !== p.lambda;
      if (dW !== dL && compute(prev).stable) return dW ? 'changeW' : 'changeLambda';
    }
    return s.solveFor === 'W' ? 'solveW' : s.solveFor === 'lambda' ? 'solveLambda' : 'solveL';
  }

  // ── the trace: a seeded simulation of the number in the system over time (SPEC.md, "Trace") ──

  var SAMPLES = 200, MAX_ARRIVALS = 40000;

  function expo(rng, mean) { return -Math.log(1 - rng()) * mean; }
  function stay(rng, mean, dist) {
    if (dist === 'fixed') return mean;
    if (dist === 'uniform') return 2 * mean * rng();
    return expo(rng, mean);
  }
  /** The remaining stay of an item already inside in steady state (the length-biased stay times a uniform share). */
  function residual(rng, mean, dist) {
    if (dist === 'fixed') return mean * rng();
    if (dist === 'uniform') return 2 * mean * Math.sqrt(rng()) * rng();
    return expo(rng, mean);
  }
  /** Poisson(m) by inversion (m up to a few hundred; the product keeps it exact enough for a picture). */
  function poisson(rng, m) {
    var u = rng(), k = 0, pk = Math.exp(-m), cum = pk;
    if (pk === 0) return Math.round(m);   // underflow for very large m: the mean
    while (u > cum && k < 10 * m + 50) { k++; pk *= m / k; cum += pk; }
    return k;
  }

  /**
   * opts: { dist: 'exp' | 'fixed' | 'uniform', horizon (in W units) }. Returns samples [t, L(t), running mean], the
   * time-average L over [0, T], the maximum, the arrivals and whether the system grows (not stable). Time is in the W
   * unit; nothing here is a result of the page's numbers, only their picture.
   */
  function trace(p, rng, opts) {
    var o = opts || {};
    var s = compute(p);
    var dist = o.dist || 'exp';
    var div = s.div;
    var lam, mean, servers, T, start = [];
    if (s.fromQueue) {
      lam = p.lambda / div;                           // per W unit
      mean = div / p.capacity;                        // service time 1/C in W units
      servers = 1;
      T = o.horizon || 2000 * (s.stable ? s.W : mean);
      if (s.stable) {                                 // stationary start: geometric number inside
        var n0 = Math.floor(Math.log(1 - rng()) / Math.log(s.rho || 1e-9));
        for (var i = 0; i < n0; i++) start.push(0);
      }
    } else {
      if (!s.defined) return { T: 0, samples: [], mean: 0, max: 0, arrivals: 0, grows: false };
      lam = s.lambda / div;
      mean = s.W;
      servers = s.stable ? Infinity : p.places;
      T = o.horizon || (s.stable ? 100 : 40) * mean;
      if (s.stable) {                                 // stationary start: Poisson(λW) inside, remaining stays
        var k0 = poisson(rng, lam * mean);
        for (var j = 0; j < k0; j++) start.push(0);
      }
    }
    var arrivals = start.slice();
    var t = 0;
    while (true) {
      t += expo(rng, 1 / lam);
      if (t >= T) break;
      if (arrivals.length >= MAX_ARRIVALS) { T = t; break; }   // capped: the horizon ends at the next arrival
      arrivals.push(t);
    }
    // Departures: unlimited places → each leaves after its own stay; otherwise first come, first served on `servers`.
    var free = isFinite(servers) ? [] : null;
    if (free) for (var f = 0; f < servers; f++) free.push(0);
    var events = [];
    arrivals.forEach(function (a, idx) {
      var len = idx < start.length && !s.fromQueue ? residual(rng, mean, dist) : stay(rng, mean, dist);
      var begin = a;
      if (free) {
        var b = 0;
        for (var q = 1; q < free.length; q++) if (free[q] < free[b]) b = q;
        begin = Math.max(a, free[b]);
        free[b] = begin + len;
      }
      events.push([a, 1], [begin + len, -1]);
    });
    events.sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; });   // ties: a departure before an arrival
    var samples = [], n = 0, area = 0, last = 0, e = 0, max = 0;
    for (var k = 1; k <= SAMPLES; k++) {
      var ts = T * k / SAMPLES;
      while (e < events.length && events[e][0] <= ts) {
        area += n * (events[e][0] - last); last = events[e][0];
        n += events[e][1]; e++;
        if (n > max) max = n;
      }
      area += n * (ts - last); last = ts;
      samples.push([ts, n, area / ts]);
    }
    return { T: T, samples: samples, mean: area / T, max: Math.max(max, start.length), arrivals: arrivals.length - start.length, grows: !s.stable };
  }

  var presets = [
    { id: 'shop', params: { system: 'shop', solveFor: 'L', lambda: 2, W: 5, L: 10, places: 30, capacity: 3 } },
    { id: 'server', params: { system: 'server', solveFor: 'L', lambda: 200, W: 50, L: 10, places: 16, capacity: 250 } },
    { id: 'build-farm', params: { system: 'build-farm', solveFor: 'L', lambda: 12, W: 25, L: 5, places: 4, capacity: 15 } },
    { id: 'measure-w', params: { system: 'server', solveFor: 'W', lambda: 600, W: 50, L: 30, places: 64, capacity: 250 } },
    { id: 'from-queue', params: { system: 'server', solveFor: 'L', fromQueue: true, lambda: 9, W: 50, L: 10, places: 16, capacity: 10 } }
  ];

  /** From the queue, the λ slider reaches 20 % past C (at least C + 1), so both the tie ρ = 1 and growth show. */
  function queueTop(capacity) { return Math.max(capacity + 1, Math.floor(1.2 * capacity)); }

  /** C for "W from the queue" switched on at arrival rate λ: ρ about 0.8, within the system's C range. */
  function queueCapacity(lambda, system) {
    var r = (SYSTEMS[system] || SYSTEMS.shop).capacity;
    return Math.min(r[1], Math.max(r[0], Math.ceil(lambda / 0.8)));
  }

  var logic = {
    CLAMP: CLAMP, KNEE: KNEE, SYSTEMS: SYSTEMS, SYSTEM_IDS: SYSTEM_IDS,
    defaults: defaults,
    presets: presets,
    initial: compute,
    compute: compute,
    utilization: utilization,
    zone: zone,
    queueMetrics: queueMetrics,
    captionKey: captionKey,
    trace: trace,
    queueTop: queueTop,
    queueCapacity: queueCapacity
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
