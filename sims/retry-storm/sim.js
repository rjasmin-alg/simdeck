/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for retry-storm: clients → api (retries on timeout) → db (the bottleneck), one tick per step, ported from
   dc-sim's metastable_collapse scenario (src/dc_sim/skin/retry.py: retry_multiplier, RetryAwareLoadResolver,
   shed_fraction). Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // ── from sims/utilisation-latency/sim.js @ f2e6118 (models/ has no queueing model yet; NOTES.md, Shared requests) ──

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

  // ── retry-storm ──

  var BASE = 9;          // clients' demand, req/s (metastable_collapse flow rate)
  var SPIKE = 14;        // demand during the one-tick spike
  var TIMEOUT = 1;       // the api's timeout, s
  var CV2 = 1;
  var API_CAPACITY = 1000;
  var AT = 5;            // tick of the interventions (dc-sim's intervene_at)
  var SHED_END = 6;      // last tick of the brief shed window
  var SHED = 0.8;        // share turned away by admission control (dc-sim's shed_fraction in test 4)
  var RAISED = 15;       // capacity after the raise at tick 5 (dc-sim's PREVENTIVE_CAPACITY)

  var defaults = {
    capacity: '15',      // '10' | '15' | '10-15' (10, raised to 15 at tick 5)
    retryFactor: 3,      // 0 | 0.5 | 3
    spikeAt: 2,          // -1 (none) | 2
    shed: 'off'          // 'off' | 'from5' (on for good) | '5-6' (ticks 5–6 only)
  };

  /** Rule 1 (dc-sim retry_multiplier): from last tick's db p99. Equal to the timeout is no breach. */
  function retryMultiplier(prevP99, timeout, retryFactor) {
    if (retryFactor <= 0 || prevP99 == null || prevP99 <= timeout) return { mult: 1, breach: 0 };
    var breach = Math.min(1, (prevP99 - timeout) / timeout);
    return { mult: 1 + retryFactor * breach, breach: breach };
  }

  /** Share of offered load turned away at tick k. */
  function shedAt(p, k) {
    if (p.shed === 'off' || k < AT) return 0;
    if (p.shed === '5-6' && k > SHED_END) return 0;
    return SHED;
  }

  function capacityAt(p, k) {
    if (p.capacity === '10-15') return k >= AT ? RAISED : 10;
    return Number(p.capacity);
  }

  function demandAt(p, k) { return k === p.spikeAt ? SPIKE : BASE; }

  /** Interventions that start at tick k (drawn as flags on the timeline). */
  function eventsAt(p, k) {
    var out = [];
    if (k === p.spikeAt) out.push('spike');
    if (k === AT && capacityAt(p, k) !== capacityAt(p, k - 1)) out.push('capacity');
    if (k === AT && p.shed !== 'off') out.push('shedOn');
    if (k === SHED_END + 1 && p.shed === '5-6') out.push('shedOff');
    return out;
  }

  /** Rules 2–4 for one tick. */
  function tick(k, prevP99, p) {
    var C = capacityAt(p, k), shed = shedAt(p, k), demand = demandAt(p, k);
    var r = retryMultiplier(prevP99, TIMEOUT, p.retryFactor);
    var processed = Math.min(demand, API_CAPACITY);
    var lambda = processed * r.mult * (1 - shed);
    var original = processed * (1 - shed);
    var m = queueMetrics(lambda, C, CV2);
    return {
      tick: k, demand: demand, breach: r.breach, mult: r.mult,
      lambda: lambda, original: original, retries: lambda - original, turnedAway: processed * r.mult * shed,
      shed: shed, capacity: C,
      rho: m.rho, p99: m.p99, saturated: m.saturated,
      events: eventsAt(p, k)
    };
  }

  function steps(p) {
    if (p.spikeAt >= 0) return 10;
    if (p.shed !== 'off' || p.capacity === '10-15') return 15;
    return 8;
  }

  function initial(p) {
    return {
      tick: -1, base: BASE, timeout: TIMEOUT, retryFactor: p.retryFactor,
      capacity: capacityAt(p, 0), shed: 0, prevP99: null, history: []
    };
  }

  function step(s, n, p) {
    var rec = tick(s.tick + 1, s.prevP99, p);
    return {
      tick: rec.tick, base: s.base, timeout: s.timeout, retryFactor: p.retryFactor,
      capacity: rec.capacity, shed: rec.shed, prevP99: rec.p99,
      history: s.history.concat([rec])
    };
  }

  /** A spike came first and the database was never saturated before it: the spike is what tipped it over. */
  function triggeredBySpike(earlier) {
    for (var i = 0; i < earlier.length; i++) {
      if (earlier[i].demand > BASE) return true;
      if (earlier[i].saturated) return false;
    }
    return false;
  }

  /** The caption's closing sentence for the last tick (SPEC.md, Story). */
  function story(s, p) {
    var h = s.history, r = h[h.length - 1];
    if (!r) return null;
    var earlier = h.slice(0, -1);
    if (r.saturated) {
      if (r.capacity > capacityAt(p, 0)) return 'capacityTooLate';
      if (r.demand === BASE && triggeredBySpike(earlier)) return 'stuck';
      return r.mult > 1 ? 'storm' : 'overload';
    }
    var calm = r.mult === 1 && r.p99 <= TIMEOUT;
    if (r.shed > 0) return calm ? 'shedHealthy' : 'shedding';
    if (calm && earlier.some(function (x) { return x.shed > 0; }) && earlier.some(function (x) { return x.mult > 1; })) {
      return 'recovered';
    }
    if (r.p99 > TIMEOUT) {
      if (!(p.retryFactor > 0)) return 'slowNoRetry';
      return r.mult > 1 ? 'overTimeout' : 'breach';
    }
    return 'healthy';
  }

  /** Largest λ + turned away over the whole run, for a y axis that does not rescale while stepping. */
  function peak(p) {
    var s = initial(p), m = 0;
    for (var n = 1; n <= steps(p); n++) {
      s = step(s, n, p);
      var r = s.history[s.history.length - 1];
      m = Math.max(m, r.lambda + r.turnedAway, r.capacity);
    }
    return m;
  }

  var presets = [
    { id: 'collapse', params: { capacity: '10', retryFactor: 3, spikeAt: -1, shed: 'off' } },
    { id: 'prevented', params: { capacity: '15', retryFactor: 3, spikeAt: -1, shed: 'off' } },
    { id: 'capacity-too-late', params: { capacity: '10-15', retryFactor: 3, spikeAt: -1, shed: 'off' } },
    { id: 'shed-dc-sim', params: { capacity: '10', retryFactor: 3, spikeAt: -1, shed: 'from5' } },
    { id: 'metastable', params: { capacity: '15', retryFactor: 3, spikeAt: 2, shed: 'off' } },
    { id: 'gentler-retries', params: { capacity: '15', retryFactor: 0.5, spikeAt: 2, shed: 'off' } },
    { id: 'shed-briefly', params: { capacity: '15', retryFactor: 3, spikeAt: 2, shed: '5-6' } }
  ];

  var logic = {
    BASE: BASE, SPIKE: SPIKE, TIMEOUT: TIMEOUT, AT: AT, SHED_END: SHED_END, SHED: SHED, RAISED: RAISED, CLAMP: CLAMP,
    defaults: defaults,
    presets: presets,
    steps: steps,
    initial: initial,
    step: step,
    retryMultiplier: retryMultiplier,
    shedAt: shedAt,
    capacityAt: capacityAt,
    demandAt: demandAt,
    eventsAt: eventsAt,
    tick: tick,
    story: story,
    peak: peak,
    utilization: utilization,
    queueMetrics: queueMetrics,
    zone: zone
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
