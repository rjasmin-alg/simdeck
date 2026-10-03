/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for I/Q signals: two carriers of the same frequency, 90° apart, weighted by I and Q and added.
     I row:  I · cos(ωt)
     Q row:  Q · cos(ωt + 90°)   (= −Q · sin ωt)
     sum:    I · cos(ωt) + Q · cos(ωt + 90°) = A · cos(ωt + φ),  A = √(I² + Q²),  φ = atan2(Q, I)
   I and Q are percent of the full carrier amplitude, −100 … 100. The window is ωt from −π to 4π (2.5 carrier periods),
   as in the original. The point (I, Q) is the signal's point in the I/Q plane (the constellation diagram).
   An explorer: no steps; the page draws initial(params) and the curves from curve().
   Adopted from 50ohm-contents-hr/contents/html/applet_iq.html (the two sliders −100 … 100 %, the window, the formula,
   A and φ rounded to whole numbers), CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; changed for simdeck
   (NOTES.md says what and why).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MIN = -100, MAX = 100, STEP = 5;      // I and Q in percent (the original: −100 … 100 in steps of 1)
  var X0 = -Math.PI, X1 = 4 * Math.PI;      // the window in ωt (the original's generateValues(−π, 4π))
  var POINTS = 600;                         // samples over the window: 240 per carrier period

  var defaults = { i: 60, q: 80 };          // A = 100 % exactly, φ ≈ 53°

  /** A value for I or Q in whole steps of 5 in [−100, 100]. Tie-breaks: not a number → `fallback`; between two steps
      → the nearer, a half step up (as the kit snaps a slider value to its grid); −0 becomes 0. */
  function clampLevel(v, fallback) {
    var x = Number(v);
    if (v === null || v === '' || typeof v === 'boolean' || !Number.isFinite(x)) return fallback;
    x = Math.max(MIN, Math.min(MAX, x));
    return Math.round(x / STEP) * STEP + 0;
  }

  /** An angle in degrees folded into (−180, 180]. */
  function fold(deg) {
    var r = ((deg % 360) + 360) % 360;
    return r > 180 ? r - 360 : r;
  }

  /** Amplitude and phase of the sum. Tie-breaks: with I = Q = 0 there is no signal and φ is undefined (null), not the
      0° that atan2(0, 0) gives; φ is in (−180°, 180°], so I < 0, Q = 0 is +180°, never −180°. */
  function polar(i, q) {
    var a = Math.sqrt(i * i + q * q);
    if (a === 0) return { a: 0, phi: null };
    return { a: a, phi: fold(Math.atan2(q, i) * 180 / Math.PI) };
  }

  /** φ as the page shows it: whole degrees, still in (−180°, 180°], so −179.6° shows as 180°, not −180°. (No point of
      the 5 % grid comes that close to −180°; the rule holds for any input.) Null stays null. */
  function roundPhi(phi) { return phi === null ? null : fold(Math.round(phi)); }

  function iWave(i, x) { return i * Math.cos(x); }
  function qWave(q, x) { return q * Math.cos(x + Math.PI / 2); }
  function sum(i, q, x) { return iWave(i, x) + qWave(q, x); }

  /** The three rows over the window at `points` + 1 evenly spaced values of ωt: I, Q and their sum. */
  function curve(i, q, points) {
    var n = points || POINTS, out = [];
    for (var k = 0; k <= n; k++) {
      var x = X0 + (X1 - X0) * k / n;
      out.push({ x: x, i: iWave(i, x), q: qWave(q, x), s: sum(i, q, x) });
    }
    return out;
  }

  /** Where cos(ωt + φ) has its maxima inside the window, ωt = −φ + k · 360°, in radians, ascending. With φ = 0 these
      are the I carrier's maxima, the reference marks the page draws: 0, 2π, 4π. */
  function peaks(phiDeg) {
    var p = -phiDeg * Math.PI / 180, out = [];
    for (var k = -2; k <= 3; k++) {
      var x = p + 2 * Math.PI * k;
      if (x >= X0 - 1e-9 && x <= X1 + 1e-9) out.push(x);
    }
    return out;
  }

  /** Presets (keys 1–7, in this order): the start; only I; only Q; I = Q; negative I (phase reversal); both at full
      scale, where A is larger than either; and nothing. The page adds labels. */
  var presets = [
    { id: 'start', params: { i: 60, q: 80 } },
    { id: 'ionly', params: { i: 100, q: 0 } },
    { id: 'qonly', params: { i: 0, q: 100 } },
    { id: 'equal', params: { i: 70, q: 70 } },
    { id: 'reverse', params: { i: -100, q: 0 } },
    { id: 'corner', params: { i: 100, q: 100 } },
    { id: 'none', params: { i: 0, q: 0 } }
  ];

  /** The state the page draws. A and φ are also given rounded to whole numbers, as the original shows them; a φ that
      rounds to −180° is +180°. `lead` is +1 when the sum runs ahead of the I carrier (0° < φ < 180°), −1 when it lags,
      0 when it is in phase or reversed (φ = 0° or 180°) or there is no signal. */
  function initial(p) {
    var i = clampLevel(p.i, defaults.i), q = clampLevel(p.q, defaults.q);
    var pl = polar(i, q);
    var none = pl.a === 0;
        return {
      i: i,
      q: q,
      none: none,
      a: pl.a,
      phi: pl.phi,
      aRound: Math.round(pl.a),
      phiRound: roundPhi(pl.phi),
      lead: none || pl.phi === 0 || pl.phi === 180 ? 0 : pl.phi > 0 ? 1 : -1,
      over: pl.a > 100,                       // the sum is larger than a full-scale carrier
      refs: peaks(0),
      peaks: none ? [] : peaks(pl.phi)
    };
  }

  var logic = {
    MIN: MIN, MAX: MAX, STEP: STEP, X0: X0, X1: X1, POINTS: POINTS,
    defaults: defaults,
    presets: presets,
    initial: initial,
    clampLevel: clampLevel,
    fold: fold,
    polar: polar,
    roundPhi: roundPhi,
    iWave: iWave,
    qWave: qWave,
    sum: sum,
    curve: curve,
    peaks: peaks
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
