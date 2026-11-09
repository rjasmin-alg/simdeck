/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for autoscaling-lag: one service's demand and capacity over a run of ticks, capacity built from blocks that
   come online after their lead time, a reactive autoscaler, pre-provisioning, failure-domain outages and spot
   preemption (rules in SPEC.md). Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads
   this as a classic script (window.SimLogic); node tests require() it. An explorer: initial(params) = compute(params).
   Block mechanics follow dc-sim's src/dc_sim/skin/resources.py (ResourceManager); the 0.7 target is dc-sim's
   TARGET_UTILIZATION (src/dc_sim/org/team.py). simulate() and queueMetrics() are pure functions over plain data, no
   strings: promotable to models/. */
(function (root) {
  'use strict';

  // ── from sims/utilisation-latency/sim.js @ f2e6118 (queueMetrics, utilization, zone; no promoted model yet) ──
  /** ρ at or above this is fed to the formulas as this (they have a pole at ρ = 1); dc-sim _RHO_SATURATION_CLAMP. */
  var CLAMP = 0.999;
  var KNEE = 0.8;
  var LN100 = Math.log(100);
  function utilization(lambda, capacity) {
    if (capacity <= 0) return lambda > 0 ? Infinity : 0;
    return lambda / capacity;
  }
  function zone(rho) { return rho >= 1 ? 'saturated' : rho >= KNEE ? 'knee' : 'below'; }
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

  /** Rule 2: the autoscaler fires above this ρ (strict, rule 5) and orders up to TARGET (dc-sim TARGET_UTILIZATION). */
  var TRIGGER = 0.8;
  var TARGET = 0.7;
  /** Below this an order is a floating-point remainder, not an order (rule 2). */
  var EPS = 1e-9;
  /** The flows' SLO: p99 ≤ 1 s (both dc-sim yamls' p99_latency_target). */
  var SLO = 1;
  /** The spike scenario's spike: ticks 2–6 at 16, else 8. */
  var SPIKE = { from: 2, to: 6, low: 8, high: 16 };

  var defaults = {
    scenario: 'spike',  // spike | provisioning | spot
    lead: 4,            // ticks from an order to the block coming online: 1, 4, 9
    spike: true,        // spike scenario: demand 16 at ticks 2–6
    baseline: 10,       // spike scenario: capacity online from tick 0
    policy: 'reactive'  // none | reactive | pre
  };

  /**
   * The scenario as plain data: run length, demand per tick, blocks online from tick 0, orders the scenario places
   * itself (by 'plan', with their own lead), domain failures and preemptions.
   */
  function scenarioSpec(p) {
    if (p.scenario === 'provisioning') {
      // dc-sim scenarios/resource_provisioning.yaml: db capacity 5, rate 8, +10 reserved at lead 3, 8 ticks.
      return {
        n: 8, demand: rep(8, 8),
        blocks: [{ id: 'base', kind: 'baseline', amount: 5, domain: 'default' }],
        orders: [{ id: 'reserved', kind: 'reserved', amount: 10, at: 0, lead: 3 }],
        failures: [], preemptions: []
      };
    }
    if (p.scenario === 'spot') {
      // dc-sim scenarios/spot_and_failure_domains.yaml: rate 20, rack-a 10, rack-b 10, spot 8; 9 ticks.
      return {
        n: 9, demand: rep(20, 9),
        blocks: [
          { id: 'rack-a', kind: 'baseline', amount: 10, domain: 'rack-a' },
          { id: 'rack-b', kind: 'baseline', amount: 10, domain: 'rack-b' },
          { id: 'spot', kind: 'spot', amount: 8, domain: 'spot-pool' }
        ],
        orders: [],
        failures: [{ domain: 'rack-a', at: 2, duration: 3 }],
        preemptions: [{ id: 'spot', at: 6 }]
      };
    }
    var demand = [];
    for (var t = 0; t < 12; t++) demand.push(p.spike && t >= SPIKE.from && t <= SPIKE.to ? SPIKE.high : SPIKE.low);
    return {
      n: 12, demand: demand,
      blocks: [{ id: 'base', kind: 'baseline', amount: p.baseline, domain: 'default' }],
      orders: [], failures: [], preemptions: []
    };
  }
  function rep(v, n) { var a = []; for (var i = 0; i < n; i++) a.push(v); return a; }

  /** Rule 3: is the domain down at tick t? (down at f … f + d − 1, dc-sim is_domain_down: tick < until.) */
  function domainDown(failures, domain, t) {
    return failures.some(function (f) { return f.domain === domain && t >= f.at && t < f.at + f.duration; });
  }
  /** Rule 3: preempted at or after its tick, and never back by itself. */
  function preempted(preemptions, id, t) {
    return preemptions.some(function (x) { return x.id === id && t >= x.at; });
  }

  /**
   * Rules 1–7 over a scenario spec: every tick's capacity (by kind), demand, ρ, p99 and verdict, and every order.
   * lead: the autoscaler's and the plan's lead time; policy: none | reactive | pre.
   */
  function simulate(spec, lead, policy) {
    // Every block that will ever exist: { id, kind, amount, domain, online } (scenario blocks online from tick 0).
    var blocks = spec.blocks.map(function (b) { return { id: b.id, kind: b.kind, amount: b.amount, domain: b.domain, online: 0 }; });
    var orders = [];
    function addOrder(o) {
      orders.push({ id: o.id, by: o.by, at: o.at, online: o.online, amount: o.amount });
      blocks.push({ id: o.id, kind: 'reserved', amount: o.amount, domain: 'default', online: o.online });
    }
    spec.orders.forEach(function (o) { addOrder({ id: o.id, by: 'plan', at: o.at, online: o.at + o.lead, amount: o.amount }); });

    // Rule 6: pre-provision every planned demand rise, lead ticks ahead, ignoring disruptions.
    if (policy === 'pre') {
      for (var r = 1; r < spec.n; r++) {
        if (!(spec.demand[r] > spec.demand[r - 1])) continue;
        var planned = blocks.reduce(function (a, b) { return a + (b.online <= r ? b.amount : 0); }, 0);
        var want = spec.demand[r] / TARGET - planned;
        if (want > EPS) addOrder({ id: 'pre-' + r, by: 'pre', at: r - lead, online: r, amount: want });
      }
    }

    var ticks = [];
    for (var t = 0; t < spec.n; t++) {
      var parts = { baseline: 0, reserved: 0, spot: 0 }, active = [], down = [], capacity = 0;
      blocks.forEach(function (b) {
        if (b.online > t) return;                                     // rule 1: not yet online
        var why = preempted(spec.preemptions, b.id, t) ? 'reclaimed' : domainDown(spec.failures, b.domain, t) ? 'domain' : null;
        if (why) { down.push({ id: b.id, kind: b.kind, amount: b.amount, why: why }); return; }
        parts[b.kind] += b.amount;
        active.push({ id: b.id, kind: b.kind, amount: b.amount });
        capacity += b.amount;
      });
      var d = spec.demand[t];
      var m = queueMetrics(d, capacity, 1);                           // rule 4
      var tick = {
        t: t, demand: d, capacity: capacity, rho: m.rho, p99: m.p99, saturated: m.saturated,
        verdict: verdict(m), ordered: 0, online: 0, parts: parts, active: active, down: down
      };
      // Rule 2 (strict >, rule 5): after this tick's metrics, order up to ρ 0.7, minus what is on order.
      if (policy !== 'none' && m.rho > TRIGGER) {
        var onOrder = orders.reduce(function (a, o) { return a + (o.at <= t && o.online > t ? o.amount : 0); }, 0);
        var need = d / TARGET - capacity - onOrder;
        if (need > EPS) addOrder({ id: 'auto-' + t, by: 'auto', at: t, online: t + lead, amount: need });
      }
      ticks.push(tick);
    }
    orders.forEach(function (o) {
      if (o.at >= 0 && o.at < spec.n) ticks[o.at].ordered += o.amount;
      if (o.online >= 0 && o.online < spec.n) ticks[o.online].online += o.amount;
    });
    return {
      n: spec.n, slo: SLO, ticks: ticks, orders: orders,
      blocks: spec.blocks.map(function (b) { return { id: b.id, kind: b.kind, amount: b.amount, domain: b.domain }; })
    };
  }

  /** Rule 7: saturated, over the SLO, or within it (equal counts as met). */
  function verdict(m) { return m.saturated ? 'saturated' : m.p99 > SLO ? 'over' : 'ok'; }

  function compute(p) {
    var s = simulate(scenarioSpec(p), p.lead, p.policy);
    s.scenario = p.scenario;
    s.policy = p.policy;
    // the spike's ticks when there is one (captions talk about it only then)
    s.spike = p.scenario === 'spike' && p.spike ? { from: SPIKE.from, to: SPIKE.to } : null;
    return s;
  }

  /** Ticks (indices) whose verdict differs from the run before the last change; a new scenario marks nothing. */
  function changedTicks(s, prev) {
    if (!prev || prev.scenario !== s.scenario || prev.n !== s.n) return [];
    var out = [];
    s.ticks.forEach(function (k, i) { if (prev.ticks[i].verdict !== k.verdict) out.push(i); });
    return out;
  }

  /** Indices of the saturated ticks. */
  function saturatedTicks(s) {
    return s.ticks.filter(function (k) { return k.saturated; }).map(function (k) { return k.t; });
  }

  /**
   * The autoscaler order the caption tells about: in the spike scenario the reaction to the spike (the first order at
   * or after its first tick), else the first autoscaler order; null when the autoscaler ordered nothing.
   */
  function captionOrder(s) {
    var auto = s.orders.filter(function (o) { return o.by === 'auto'; });
    if (s.spike) {
      var r = auto.filter(function (o) { return o.at >= s.spike.from; });
      if (r.length) return r[0];
    }
    return auto[0] || null;
  }

  /** The one thing the caption should say (the page picks the words); first that applies (SPEC.md). */
  function captionKey(s) {
    var o = captionOrder(s);
    if (s.scenario === 'spot' && !o) return 'spot';
    if (s.scenario === 'provisioning' && !o) return 'provisioning';
    if (o) {
      if (o.online >= s.n) return 'beyondRun';
      if (s.spike && o.online > s.spike.to) return 'tooLate';
      return 'lag';
    }
    var sat = saturatedTicks(s).length > 0;
    if (s.orders.some(function (x) { return x.by === 'pre'; })) return sat ? 'preSat' : 'pre';
    if (sat) return 'noScaler';
    return s.policy === 'none' ? 'noScalerCalm' : 'calm';
  }

  var presets = [
    { id: 'dc-sim-provisioning', params: { scenario: 'provisioning', policy: 'none' } },
    { id: 'fast-scaler', params: { scenario: 'spike', spike: true, baseline: 10, lead: 1, policy: 'reactive' } },
    { id: 'slow-scaler', params: { scenario: 'spike', spike: true, baseline: 10, lead: 4, policy: 'reactive' } },
    { id: 'too-late', params: { scenario: 'spike', spike: true, baseline: 10, lead: 9, policy: 'reactive' } },
    { id: 'spot-and-domains', params: { scenario: 'spot', policy: 'none' } }
  ];

  var logic = {
    CLAMP: CLAMP, TRIGGER: TRIGGER, TARGET: TARGET, SLO: SLO, SPIKE: SPIKE,
    defaults: defaults,
    presets: presets,
    initial: compute,
    compute: compute,
    scenarioSpec: scenarioSpec,
    simulate: simulate,
    queueMetrics: queueMetrics,
    changedTicks: changedTicks,
    saturatedTicks: saturatedTicks,
    captionKey: captionKey,
    captionOrder: captionOrder,
    verdict: verdict
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
