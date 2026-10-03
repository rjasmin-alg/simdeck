/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for multipath interference: a receiver gets the direct signal and a reflected copy that arrives later, so
   shifted in phase by φ and weaker by a factor a. The receiver adds them (interference):
     sin(ωt) + a · sin(ωt − φ) = A · sin(ωt − θ),  A = √((1 − a)² + 2a(1 + cos φ)).
   A > 1: the sum is stronger (constructive), A < 1: weaker (destructive), A = 0: cancelled. An explorer: no steps;
   the page draws initial(params).
   Adopted from 50ohm-contents-hr/contents/html/applet_interferenz.html (the phase slider 0 … 360°, the two plots of
   2.5 periods: signal and shifted copy at ±100 %, their sum at ±200 %), CC BY 4.0, 50ohm.de-Autorenteam,
   AJW-Referat des DARC e.V.; changed for simdeck (NOTES.md says what and why).
   Units: φ in whole degrees, a in whole percent of the direct signal (params, exact); time in periods; amplitudes as
   fractions of the direct signal's amplitude.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var PERIODS = 2.5;                  // shown time, in periods of the signal (the original's −π … 4π)
  var EPS = 1e-9;                     // amplitudes this close count as equal (cos 120° is not exactly −0.5)

  function clampInt(x, lo, hi) {
    var n = Math.round(Number(x));
    if (!isFinite(n)) n = lo;
    return Math.min(hi, Math.max(lo, n));
  }

  function rad(deg) { return deg * Math.PI / 180; }

  /** Amplitude of the sum, as a fraction of the direct signal, for phase difference φ (deg) and reflected
      amplitude a (fraction). Written as (1 − a)² + 2a(1 + cos φ), which is never negative and is exactly 0 at
      a = 1, φ = 180° (cos π = −1 exactly). */
  function sumAmplitude(phiDeg, a) {
    return Math.sqrt((1 - a) * (1 - a) + 2 * a * (1 + Math.cos(rad(phiDeg))));
  }

  /** What the interference does to the received signal, for sum amplitude A and reflected amplitude a.
      Tie-breaks, in this order: no reflection (a = 0) is 'none', whatever φ; A within EPS of 0 is 'cancelled'
      (only a = 1, φ = 180°); A within EPS of 1 is 'same' (a = −2 cos φ, e.g. a = 1 at 120° and 240°), not stronger
      or weaker. */
  function effectOf(A, a) {
    if (a === 0) return 'none';
    if (A < EPS) return 'cancelled';
    if (Math.abs(A - 1) < EPS) return 'same';
    return A > 1 ? 'stronger' : 'weaker';
  }

  /** The sum's level against the direct signal alone, in dB (20 log10 A), rounded to 0.1 dB; null when cancelled
      (−∞ is not JSON). */
  function levelDb(A) {
    if (A < EPS) return null;
    var db = Math.round(200 * Math.log10(A)) / 10;
    return db === 0 ? 0 : db;           // no −0
  }

  /** The direct signal, the reflected copy and their sum at time t (periods), as fractions of the direct amplitude.
      The copy is delayed: sin(2πt − φ), so its crests come φ/360 of a period later. */
  function signals(t, phiDeg, a) {
    var w = 2 * Math.PI * t;
    var d = Math.sin(w), r = a * Math.sin(w - rad(phiDeg));
    return { d: d, r: r, s: d + r };
  }

  var defaults = { phase: 90, amp: 100 };

  /** Presets (keys 1–7, in this order). The page adds the labels. */
  var presets = [
    { id: 'inPhase', params: { phase: 0, amp: 100 } },
    { id: 'quarter', params: { phase: 90, amp: 100 } },
    { id: 'third', params: { phase: 120, amp: 100 } },
    { id: 'opposite', params: { phase: 180, amp: 100 } },
    { id: 'oppositeWeak', params: { phase: 180, amp: 50 } },
    { id: 'quarterWeak', params: { phase: 90, amp: 50 } },
    { id: 'full', params: { phase: 360, amp: 100 } }
  ];

  /** The state the page draws: the parameters, the sum's amplitude, its phase lag, the effect and the level. */
  function initial(p) {
    var phase = clampInt(p.phase, 0, 360), amp = clampInt(p.amp, 0, 100), a = amp / 100;
    var A = sumAmplitude(phase, a);
    var effect = effectOf(A, a);
    return {
      phase: phase,
      amp: amp,
      a: a,
      A: A,
      effect: effect,
      db: levelDb(A),
      pathFraction: (phase % 360) / 360,       // path difference in wavelengths, whole wavelengths left out
      lag: phase / 360                         // the copy's delay in periods, as drawn (360° is one whole period)
    };
  }

  /** The three curves over the window as { t, d, r, s } points, `n` intervals (at least 48 per period). */
  function curve(st, n) {
    n = Math.max(n || 0, Math.ceil(PERIODS * 48));
    var out = [];
    for (var i = 0; i <= n; i++) {
      var t = (i / n) * PERIODS, v = signals(t, st.phase, st.a);
      out.push({ t: t, d: v.d, r: v.r, s: v.s });
    }
    return out;
  }

  var logic = {
    PERIODS: PERIODS, EPS: EPS,
    defaults: defaults,
    presets: presets,
    initial: initial,
    sumAmplitude: sumAmplitude,
    effectOf: effectOf,
    levelDb: levelDb,
    signals: signals,
    curve: curve
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
