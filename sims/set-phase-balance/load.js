/* SPDX-License-Identifier: AGPL-3.0-or-later
   The electrical load of a film set (catalogue §5.25). From sims/set-circuit-load/load.js @ 982e7d9, copied unchanged
   (COMMON.md §6: the model is not in models/ yet), with the three phases added after it as new functions
   (phaseLoad, neutralW, neutralAmps, V_LL): every old function and result is the same, so the coordinator can promote
   this file to models/set-load.js as a superset. Devices with their power and department, the current each draws at
   the mains voltage, a circuit's breaker that trips above its rated current, a cable that heats with the square of the
   current, and a three-phase supply: each phase a circuit of its own, and the neutral carrying what the three phase
   currents do not cancel. Pure plain data and functions, no strings and no page code. Registers on
   globalThis.SimdeckModels['set-load'] (models/README.md); node tests require() it. Rules: set-circuit-load's SPEC.md
   rules 1–5 ("Rule n" below) and this sim's SPEC.md rules 1–5 ("Rule n (this sim)"). Every number here is illustrative except V, V_LL and P = V × I. */
(function (root) {
  'use strict';

  /** Rule 1: single-phase mains in Croatia and the EU, volts. */
  var V = 230;

  /** Devices. w = power in watts (illustrative); dept = the department it belongs to; lamp = the light source, for
   *  set-lamp-heat. Fixed devices are wired into the location's plan and are not offered to plug in. */
  var DEVICES = {
    l650: { w: 650, dept: 'electric', kind: 'lamp', lamp: 'tungsten' },
    l1000: { w: 1000, dept: 'electric', kind: 'lamp', lamp: 'tungsten' },
    l2000: { w: 2000, dept: 'electric', kind: 'lamp', lamp: 'tungsten' },
    kettle: { w: 2200, dept: 'makeup', kind: 'appliance' },
    mirror: { w: 800, dept: 'makeup', kind: 'appliance' },
    camera: { w: 800, dept: 'camera', kind: 'fixed' }
  };

  /** Rule 4: a cable's steady temperature rise per ampere squared, as a fraction num/den (K/A²), so comparisons are
   *  exact. Coiled on its drum the turns heat each other and shed heat only from the drum's outside: 12 times the rise. */
  var CABLE = {
    ambient: 25,                 // °C
    limit: 70,                   // °C, where the insulation starts to soften (illustrative)
    k: { unwound: [4, 25], coiled: [48, 25] }
  };

  /** Rule 1: I = P / V. */
  function amps(w, v) { return w / (v || V); }

  /** Rule 3: the breaker trips when the current is above its rating. Compared in watts (P > In × V), exact in integers.
   *  Tie-break: exactly at the rating does not trip. */
  function trips(w, ratingA, v) { return w > ratingA * (v || V); }

  /** The most a circuit carries before it trips, in watts. */
  function limitW(ratingA, v) { return ratingA * (v || V); }

  /** Rule 2: a circuit's demand is the sum of its devices' power; current = demand / V. */
  function circuitLoad(watts, ratingA, v) {
    var w = watts.reduce(function (s, x) { return s + x; }, 0);
    return { watts: w, amps: amps(w, v), limitW: limitW(ratingA, v), tripped: trips(w, ratingA, v) };
  }

  /** Rule 4: steady temperature of a cable carrying w watts: ambient + k·I². */
  function cableTemp(w, k, cable, v) {
    var c = cable || CABLE, i = amps(w, v);
    return c.ambient + k[0] * i * i / k[1];
  }

  /** Rule 4: over the insulation limit? k·(P/V)² > limit − ambient, compared in integers. Tie-break: at the limit is
   *  not over. */
  function cableOver(w, k, cable, v) {
    var c = cable || CABLE, vv = v || V;
    return k[0] * w * w > k[1] * vv * vv * (c.limit - c.ambient);
  }

  /** Rule 4: the most a cable carries before it passes the limit, in amperes: √((limit − ambient) / k). */
  function cableMaxAmps(k, cable) {
    var c = cable || CABLE;
    return Math.sqrt((c.limit - c.ambient) * k[1] / k[0]);
  }


  // ── three phases (added by set-phase-balance) ──

  /** Rule 1 (this sim): line-to-line voltage of the 230/400 V three-phase supply, volts (nominal; 230 × √3 = 398.4). Shown
   *  only as a fact; every lamp here is connected between a phase and the neutral, at V. */
  var V_LL = 400;

  /** Rule 4 (this sim): the neutral current of three resistive phase loads, given as the power it corresponds to (watts at V):
   *  the three currents are a third of a period apart, so their sum is |I1 + I2·a² + I3·a| with a = e^(j·120°), whose
   *  square is I1² + I2² + I3² − I1·I2 − I2·I3 − I3·I1. Equal loads cancel to exactly 0; one phase alone sends its
   *  whole current back. Computed from whole watts, so equal loads give exactly 0. */
  function neutralW(w1, w2, w3) {
    var sq = w1 * w1 + w2 * w2 + w3 * w3 - w1 * w2 - w2 * w3 - w3 * w1;
    return Math.sqrt(Math.max(0, sq));
  }

  /** Rule 4 (this sim): the neutral current in amperes. */
  function neutralAmps(w1, w2, w3, v) { return neutralW(w1, w2, w3) / (v || V); }

  /** Rules 2–5 (this sim): three phases, each a circuit with its own breaker (circuitLoad); a tripped phase carries nothing; the
   *  neutral carries the unbalance of the live phases only; the supply's total is the live phases' sum.
   *  wattsByPhase: three arrays of device powers. */
  function phaseLoad(wattsByPhase, ratingA, v) {
    var phases = wattsByPhase.map(function (ws) { return circuitLoad(ws, ratingA, v); });
    var live = phases.map(function (ph) { return ph.tripped ? 0 : ph.watts; });
    var nW = neutralW(live[0], live[1], live[2]);
    return {
      phases: phases,
      live: live,
      neutralW: nW,
      neutralAmps: nW / (v || V),
      demandW: phases.reduce(function (s, ph) { return s + ph.watts; }, 0),
      liveW: live[0] + live[1] + live[2],
      limitW: 3 * limitW(ratingA, v)
    };
  }

  var model = {
    V: V, DEVICES: DEVICES, CABLE: CABLE,
    amps: amps, trips: trips, limitW: limitW, circuitLoad: circuitLoad,
    cableTemp: cableTemp, cableOver: cableOver, cableMaxAmps: cableMaxAmps,
    V_LL: V_LL, neutralW: neutralW, neutralAmps: neutralAmps, phaseLoad: phaseLoad
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {})['set-load'] = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
