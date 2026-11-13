/* SPDX-License-Identifier: AGPL-3.0-or-later
   The electrical load of a film set (catalogue §5.25): devices with their power and department, the current each
   draws at the mains voltage, a circuit's breaker that trips above its rated current, and a cable that heats with the
   square of the current it carries. Built first here, in its hub sim; set-phase-balance adds the three phases and
   set-lamp-heat reads the lamps. Pure plain data and functions, no strings and no page code, so the coordinator can
   promote it to models/set-load.js unchanged. Registers on globalThis.SimdeckModels['set-load'] (models/README.md);
   node tests require() it. Rules: SPEC.md rules 1–5. Every number here is illustrative except V and P = V × I. */
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

  var model = {
    V: V, DEVICES: DEVICES, CABLE: CABLE,
    amps: amps, trips: trips, limitW: limitW, circuitLoad: circuitLoad,
    cableTemp: cableTemp, cableOver: cableOver, cableMaxAmps: cableMaxAmps
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {})['set-load'] = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
