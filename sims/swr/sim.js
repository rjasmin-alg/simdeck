/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for swr: a transmitter, a feed line of 2.5 λ and a resistive load (or an open or shorted end). The mismatch
   between the load R and the line's characteristic impedance Z0 reflects part of the power (Γ, |Γ|²); forward and
   reflected waves add to a standing wave whose envelope has U_max / U_min = SWR, maxima λ/2 apart. Line loss makes
   the SWR meter at the transmitter read better than the load has.
   Rules and numbers: SPEC.md (sources: 50ohm.de swr, swr_2, swr_3). Pure: no DOM, no Math.random, no Date, no timers.
   State is plain JSON (an infinite SWR is null). An explorer: no steps; the state is derived from the params.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var LEN = 2.5;                 // line length in wavelengths
  var SAMPLES = 201;             // envelope samples: every λ/80, so every maximum and minimum is a sample
  var P_FWD = 100;               // W forward at the transmitter (swr_2's example)
  var R_MIN = 1, R_MAX = 10000;  // rule 6: model clamp
  var LOSS_MIN = 0, LOSS_MAX = 10;
  var SHOW_MAX = 99;             // rule 6: above this, "∞"
  var EPS = 1e-9;                // class boundaries (rule 7)
  var Z0_CHOICES = [50, 75];
  var ENDS = ['load', 'open', 'short'];

  /** Ten log-spaced values per decade (SPEC.md "Params"): 1 … 7.5, 10 … 75, 100 … 750, 1000 Ω. */
  var MANT = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5];
  var R_VALUES = [];
  [1, 10, 100].forEach(function (dec) { MANT.forEach(function (m) { R_VALUES.push(m * dec); }); });
  R_VALUES.push(1000);
  function rIndex(R) { return R_VALUES.indexOf(R); }

  var defaults = { r: rIndex(50), z0: 50, end: 'load', lossDb: 0, animate: true };

  var presets = [
    { id: 'matched', params: { r: rIndex(50), z0: 50, end: 'load', lossDb: 0 } },
    { id: 'book-100', params: { r: rIndex(100), z0: 50, end: 'load', lossDb: 0 } },
    { id: 'book-10', params: { r: rIndex(10), z0: 50, end: 'load', lossDb: 0 } },
    { id: 'swr-3', params: { r: rIndex(150), z0: 50, end: 'load', lossDb: 0 } },
    { id: 'folded-dipole', params: { r: rIndex(300), z0: 50, end: 'load', lossDb: 0 } },
    { id: 'lossy-open', params: { r: rIndex(50), z0: 50, end: 'open', lossDb: 5 } }
  ];

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  /** Rules 1 and 4: Γ for a resistive load R on Z0; open +1, short −1 (the end wins over R). */
  function gammaOf(end, R, Z0) {
    if (end === 'open') return 1;
    if (end === 'short') return -1;
    var r = clamp(R, R_MIN, R_MAX);
    return (r - Z0) / (r + Z0);
  }

  /** Rule 1, exact: the load's SWR as max/min of R and Z0; null (∞) for an open or shorted end. */
  function swrOfLoad(end, R, Z0) {
    if (end === 'open' || end === 'short') return null;
    var r = clamp(R, R_MIN, R_MAX);
    return Math.max(r, Z0) / Math.min(r, Z0);
  }

  /** Rule 2: SWR from forward and reflected power; null (∞) when P_R ≥ P_V; 1 when P_R = 0. */
  function swrFromPowers(pv, pr) {
    if (!(pv > 0)) return null;
    if (pr <= 0) return 1;
    if (pr >= pv) return null;
    var a = Math.sqrt(pv), b = Math.sqrt(pr);
    return (a + b) / (a - b);
  }

  /** Rule 6: what the page shows; null means "∞" (infinite or above 99). */
  function shown(swr) { return swr === null || swr > SHOW_MAX ? null : swr; }

  /** Rule 7: 0 = matched (1), 1 = ≤ 2, 2 = ≤ 3, 3 = worse (∞ included). Boundaries inclusive, with a tolerance. */
  function swrClass(swr) {
    if (swr === null) return 3;
    if (swr <= 1 + EPS) return 0;
    if (swr <= 2 + EPS) return 1;
    if (swr <= 3 + EPS) return 2;
    return 3;
  }

  /** Rule 3: |V(d)| = √(1 + Γ² + 2Γ·cos 4πd) at x = 0 … LEN from the transmitter (d = LEN − x). */
  function envelope(gamma) {
    var out = [];
    for (var i = 0; i < SAMPLES; i++) {
      var x = LEN * i / (SAMPLES - 1), d = LEN - x;
      var v2 = 1 + gamma * gamma + 2 * gamma * Math.cos(4 * Math.PI * d);
      out.push({ x: x, v: Math.sqrt(Math.max(0, v2)) });
    }
    return out;
  }

  /** Rule 3: positions x of the maxima and minima. Γ > 0: maxima at d = k/2; Γ < 0: at d = ¼ + k/2; Γ = 0: none. */
  function extremes(gamma) {
    var atLoad = [], quarter = [];
    for (var k = 0; k / 2 <= LEN + EPS; k++) atLoad.push(LEN - k / 2);
    for (var j = 0; 0.25 + j / 2 <= LEN + EPS; j++) quarter.push(LEN - 0.25 - j / 2);
    var asc = function (a) { return a.slice().sort(function (p, q) { return p - q; }); };
    if (gamma > 0) return { maxima: asc(atLoad), minima: asc(quarter) };
    if (gamma < 0) return { maxima: asc(quarter), minima: asc(atLoad) };
    return { maxima: [], minima: [] };
  }

  /** The instantaneous voltage at phase ωt: forward wave toward the load plus the reflected wave back (SPEC.md). */
  function instant(gamma, phase, n) {
    var m = n || SAMPLES, out = [];
    for (var i = 0; i < m; i++) {
      var x = LEN * i / (m - 1), d = LEN - x;
      out.push({ x: x, v: Math.cos(phase + 2 * Math.PI * d) + gamma * Math.cos(phase - 2 * Math.PI * d) });
    }
    return out;
  }

  /** Rule 5: the two SWR meters, at the transmitter and at the load. Powers in W. */
  function meters(gamma, swrLoad, lossDb) {
    var g2 = gamma * gamma, a = Math.pow(10, -lossDb / 10);
    var pvLoad = P_FWD * a, prLoad = g2 * pvLoad;
    var prTx = g2 * P_FWD * a * a;            // |Γ|²·10^(−2L/10)
    return {
      tx: { pv: P_FWD, pr: prTx, swr: swrFromPowers(P_FWD, prTx), reflPct: 100 * prTx / P_FWD },
      load: { pv: pvLoad, pr: prLoad, swr: swrLoad, reflPct: 100 * g2 }
    };
  }

  /** The params, cleaned: index rounded and clamped, unknown choices to their default. */
  function clean(p) {
    var r = Math.round(Number(p.r));
    return {
      r: clamp(isFinite(r) ? r : defaults.r, 0, R_VALUES.length - 1),
      z0: Z0_CHOICES.indexOf(Number(p.z0)) >= 0 ? Number(p.z0) : 50,
      end: ENDS.indexOf(p.end) >= 0 ? p.end : 'load',
      lossDb: clamp(Number(p.lossDb) || 0, LOSS_MIN, LOSS_MAX)
    };
  }

  /** The state for an explicit load (R in Ω, clamped to 1 Ω … 10 kΩ), used by derive and by the tests. */
  function stateFor(end, R, Z0, lossDb) {
    var load = end === 'load';
    var gamma = gammaOf(end, R, Z0);
    var swrLoad = swrOfLoad(end, R, Z0);
    var ex = extremes(gamma);
    var m = meters(gamma, swrLoad, lossDb);
    return {
      Z0: Z0, R: load ? clamp(R, R_MIN, R_MAX) : null, end: end,
      gamma: gamma, swrLoad: swrLoad, reflPct: 100 * gamma * gamma, lossDb: lossDb,
      umax: 1 + Math.abs(gamma), umin: 1 - Math.abs(gamma),
      maxAtLoad: gamma > 0, minAtLoad: gamma < 0, flat: gamma === 0,
      envelope: envelope(gamma), maxima: ex.maxima, minima: ex.minima,
      meter: m, prMeasured: m.tx.pr, swrMeter: m.tx.swr,
      classLoad: swrClass(m.load.swr), classTx: swrClass(m.tx.swr)
    };
  }

  /** The derived state for one set of params (SPEC.md "State"). */
  function derive(p) {
    var c = clean(p);
    return stateFor(c.end, R_VALUES[c.r], c.z0, c.lossDb);
  }

  var logic = {
    defaults: defaults,
    presets: presets,
    /** Explorer: no steps; the state is derived from the params. */
    initial: function (p) { return derive(p); },
    derive: derive, stateFor: stateFor, clean: clean,
    gammaOf: gammaOf, swrOfLoad: swrOfLoad, swrFromPowers: swrFromPowers, shown: shown, swrClass: swrClass,
    envelope: envelope, extremes: extremes, instant: instant, meters: meters, rIndex: rIndex,
    R_VALUES: R_VALUES, Z0_CHOICES: Z0_CHOICES, ENDS: ENDS, LEN: LEN, SAMPLES: SAMPLES, P_FWD: P_FWD,
    R_MIN: R_MIN, R_MAX: R_MAX, LOSS_MIN: LOSS_MIN, LOSS_MAX: LOSS_MAX, SHOW_MAX: SHOW_MAX
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
