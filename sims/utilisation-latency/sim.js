/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for utilisation-latency: one M/G/1 server's mean and p99 time in system against its utilisation, and the
   three-tier call chain fed with the same arrival rate (rules in SPEC.md). Pure: no DOM, no Math.random, no Date, no
   timers. State is plain JSON. The page loads this as a classic script (window.SimLogic); node tests require() it.
   An explorer: the state is a pure function of the params, initial(params) = compute(params), no steps.
   The queueing part (queueMetrics, chainMetrics, zone) is ported from dc-sim's src/dc_sim/kernel/queueing.py and
   engine.py (end_to_end_metric, default_load_resolver) and kept promotable to models/: pure functions over plain
   data, no strings. */
(function (root) {
  'use strict';

  /** ρ at or above this is fed to the formulas as this (they have a pole at ρ = 1); dc-sim _RHO_SATURATION_CLAMP. */
  var CLAMP = 0.999;
  /** Zone edges (rule 7): the knee starts at 0.8, saturation at 1. */
  var KNEE = 0.8;
  var LN100 = Math.log(100);

  var defaults = {
    load: 50,       // offered load, % of capacity
    capacity: 10,   // C: service rate, requests per second (10 or 100)
    cv2: 1,         // squared coefficient of variation of the service time: 0, 1, 4, 9
    chain: false    // show the three-tier chain
  };

  /** dc-sim scenarios/three_tier_chain.yaml: entry api, flow SLO p99 ≤ 2 s. Listed in topological order. */
  var THREE_TIER = {
    entry: 'api',
    slo: 2,
    nodes: [
      { id: 'api', capacity: 100, cv2: 1, fanout: [['cache', 1], ['audit', 0.2]] },
      { id: 'cache', capacity: 20, cv2: 2, fanout: [['db', 1]] },
      { id: 'db', capacity: 15, cv2: 1, fanout: [] },
      { id: 'audit', capacity: 50, cv2: 1, fanout: [] }
    ]
  };

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

  /**
   * Rule 6: offered load along the fanout DAG (each node passes on min(offered, C) × weight), every node's metrics,
   * and the end-to-end p99 = p99(node) + Σ weight × end-to-end(callee) from the entry.
   */
  function chainMetrics(spec, rate) {
    var offered = {}, byId = {};
    spec.nodes.forEach(function (n) { offered[n.id] = 0; byId[n.id] = n; });
    offered[spec.entry] += rate;
    var out = spec.nodes.map(function (n) {
      var m = queueMetrics(offered[n.id], n.capacity, n.cv2);
      var processed = Math.min(offered[n.id], n.capacity);
      n.fanout.forEach(function (f) { offered[f[0]] += processed * f[1]; });
      m.id = n.id;
      return m;
    });
    var metric = {};
    out.forEach(function (m) { metric[m.id] = m; m.weight = 0; });
    var sat = false;
    function e2e(id, weight) {
      var m = metric[id];
      m.weight += weight;
      if (m.saturated) sat = true;
      return m.p99 + byId[id].fanout.reduce(function (a, f) { return a + f[1] * e2e(f[0], weight * f[1]); }, 0);
    }
    var total = e2e(spec.entry, 1);
    return { nodes: out, e2e: total, e2eSaturated: sat, slo: spec.slo, sloMet: sloMet(total, sat, spec.slo) };
  }

  /** The SLO holds when the end-to-end p99 is bounded and at most the target (equal counts as met). */
  function sloMet(e2e, saturated, slo) { return !saturated && e2e <= slo; }

  function compute(p) {
    var C = p.capacity;
    var lambda = p.load * C / 100;              // integers first, so 15 % of 100 is exactly 15
    var server = queueMetrics(lambda, C, p.cv2);
    server.id = 'server';
    return {
      lambda: lambda,
      service: 1 / C,
      server: server,
      chain: p.chain ? chainMetrics(THREE_TIER, lambda) : null
    };
  }

  /**
   * The one thing the caption should say (page picks the words); prev = params before the last change, or null.
   * `cv2`: cv² changed at the same capacity, alone or upwards with the load; the page compares both cv² at the
   * current load (the variability preset moves the load too and still shows the variability effect alone; going back
   * down to cv² 1 with another load is a new state, not a variability story). `load`: only the load changed, from a bounded state
   * (a saturated one has no numbers to start from).
   */
  function captionKey(s, p, prev) {
    if (s.server.saturated) return 'saturated';
    if (p.chain) return 'chain';
    if (!prev || prev.capacity !== p.capacity) return 'state';
    if (prev.cv2 !== p.cv2) return prev.load === p.load || p.cv2 > prev.cv2 ? 'cv2' : 'state';
    if (prev.load !== p.load && !compute(prev).server.saturated) return 'load';
    return 'state';
  }

  /** Gauges whose zone changed with the last change (rule 7): ids of the server and the chain nodes. */
  function crossed(s, prevState) {
    if (!prevState) return [];
    var out = [];
    if (prevState.server.zone !== s.server.zone) out.push('server');
    if (s.chain && prevState.chain) s.chain.nodes.forEach(function (n, i) {
      if (prevState.chain.nodes[i].zone !== n.zone) out.push(n.id);
    });
    return out;
  }

  var presets = [
    { id: 'half-load', params: { load: 50 } },
    { id: 'knee', params: { load: 90 } },
    { id: 'near-full', params: { load: 99 } },
    { id: 'variability', params: { load: 10, cv2: 9 } },
    { id: 'three-tier-chain', params: { load: 50, chain: true } }
  ];

  var logic = {
    CLAMP: CLAMP, KNEE: KNEE, THREE_TIER: THREE_TIER,
    defaults: defaults,
    presets: presets,
    initial: compute,
    compute: compute,
    utilization: utilization,
    queueMetrics: queueMetrics,
    chainMetrics: chainMetrics,
    sloMet: sloMet,
    zone: zone,
    captionKey: captionKey,
    crossed: crossed
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
