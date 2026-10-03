/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fading: a receiver within the ground wave's range gets the sky wave too. Both have the same frequency
   and add up; their phase difference φ decides how strong the sum is:
     sin(ωt) + a · sin(ωt + φ) = A · sin(ωt + θ),  A = √((1 − a)² + 2a(1 + cos φ)),
   with the sky wave as the reference (100 %) and the ground wave a times as strong, as in the original applet.
   The ionosphere moves, so the sky wave's path and with it φ keep changing: the sum swings between |1 − a| and 1 + a.
   That swinging field strength is fading (QSB). The model lets φ drift at DRIFT degrees per second and draws the
   last WINDOW seconds of the strength. An explorer: no steps; the page draws initial(params).
   Adopted from 50ohm-contents-hr/contents/html/fading_applet.html (sliders for the amplitude 0 … 100 %, default
   80 %, and the phase 0 … 360°, default 180°; two Chart.js plots over −π … 4π: sky wave 100·sin x and ground wave
   amplitude·sin(x + φ) at ±200 %, and their sum), CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.;
   changed for simdeck (NOTES.md says what and why).
   Units: φ in whole degrees, the ground wave in whole percent of the sky wave (params, exact); time in periods of the
   signal for the waves, in seconds for the drift; amplitudes as fractions of the sky wave's amplitude.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var PERIODS = 2.5;                  // shown time, in periods of the signal (the original's −π … 4π)
  var DRIFT = 18;                     // degrees per second the phase drifts in the model: one fade every 20 s
  var WINDOW = 60;                    // seconds of field strength shown, ending now
  var EPS = 1e-9;

  function clampInt(x, lo, hi) {
    var n = Math.round(Number(x));
    if (!isFinite(n)) n = lo;
    return Math.min(hi, Math.max(lo, n));
  }

  function rad(deg) { return deg * Math.PI / 180; }

  /** Amplitude of the sum, as a fraction of the sky wave, for phase difference φ (deg) and ground wave a (fraction).
      Written as (1 − a)² + 2a(1 + cos φ), never negative and exactly 0 at a = 1, φ = 180° (cos π = −1 exactly). */
  function sumAmplitude(phiDeg, a) {
    return Math.sqrt((1 - a) * (1 - a) + 2 * a * (1 + Math.cos(rad(phiDeg))));
  }

  /** The range the sum swings through while φ goes round: 1 + a at its strongest, |1 − a| at its weakest, and the
      fade's depth between them in dB, rounded to 0.1 dB; null when the weakest is 0 (an infinitely deep fade, −∞ is
      not JSON). No ground wave: no fading, depth 0. */
  function fadeRange(a) {
    var max = 1 + a, min = Math.abs(1 - a);
    var depth = min < EPS ? null : Math.round(200 * Math.log10(max / min)) / 10;
    return { max: max, min: min, depth: depth };
  }

  /** Where the signal is in its fade as φ grows (the drift's direction). Tie-breaks, in this order: no ground wave
      (a = 0) is 'steady', whatever φ; φ a whole multiple of 360° is 'peak'; φ = 180° (+ 360° k) is 'trough' ('dropout'
      when a = 1, where the sum is 0); otherwise A falls while sin φ > 0 ('fading') and rises while sin φ < 0
      ('rising'), from d(A²)/dφ = −2a sin φ. φ is a whole number of degrees, so the ties are exact. */
  function trendOf(phiDeg, a) {
    if (a === 0) return 'steady';
    var m = ((phiDeg % 360) + 360) % 360;
    if (m === 0) return 'peak';
    if (m === 180) return a === 1 ? 'dropout' : 'trough';
    return m < 180 ? 'fading' : 'rising';
  }

  /** The sky wave, the ground wave and their sum at time t (periods), as fractions of the sky wave's amplitude.
      The ground wave is sin(2πt + φ), as the original. */
  function signals(t, phiDeg, a) {
    var w = 2 * Math.PI * t;
    var sky = Math.sin(w), ground = a * Math.sin(w + rad(phiDeg));
    return { sky: sky, ground: ground, s: sky + ground };
  }

  var defaults = { amp: 80, phase: 180 };

  /** Presets (keys 1–6, in this order). The page adds the labels. */
  var presets = [
    { id: 'original', params: { amp: 80, phase: 180 } },
    { id: 'inPhase', params: { amp: 100, phase: 0 } },
    { id: 'falling', params: { amp: 100, phase: 90 } },
    { id: 'dropout', params: { amp: 100, phase: 180 } },
    { id: 'weakGround', params: { amp: 30, phase: 180 } },
    { id: 'skyOnly', params: { amp: 0, phase: 180 } }
  ];

  /** The state the page draws: the parameters, the sum's amplitude, where it is in the fade, and the fade's range. */
  function initial(p) {
    var amp = clampInt(p.amp, 0, 100), phase = clampInt(p.phase, 0, 360), a = amp / 100;
    var r = fadeRange(a);
    return {
      amp: amp,
      phase: phase,
      a: a,
      A: sumAmplitude(phase, a),
      trend: trendOf(phase, a),
      max: r.max,
      min: r.min,
      depth: r.depth
    };
  }

  /** The three waves over the window as { t, sky, ground, s } points, `n` intervals (at least 48 per period). */
  function curve(st, n) {
    n = Math.max(n || 0, Math.ceil(PERIODS * 48));
    var out = [];
    for (var i = 0; i <= n; i++) {
      var t = (i / n) * PERIODS, v = signals(t, st.phase, st.a);
      out.push({ t: t, sky: v.sky, ground: v.ground, s: v.s });
    }
    return out;
  }

  /** The field strength over the last WINDOW seconds as { t, A } points (t from −WINDOW to 0, `n` intervals, at
      least 8 per fade), with φ drifting at DRIFT °/s to its value now: φ(t) = φ + DRIFT · t. */
  function history(st, n) {
    n = Math.max(n || 0, Math.ceil(WINDOW * DRIFT / 360 * 8));
    var out = [];
    for (var i = 0; i <= n; i++) {
      var t = -WINDOW + (i / n) * WINDOW;
      out.push({ t: t, A: sumAmplitude(st.phase + DRIFT * t, st.a) });
    }
    return out;
  }

  /** The phase after drifting for dt seconds from φ, wrapped into 0 … 359.999 (a float; the page rounds it). */
  function drift(phiDeg, dt) {
    return (((phiDeg + DRIFT * dt) % 360) + 360) % 360;
  }

  var logic = {
    PERIODS: PERIODS, DRIFT: DRIFT, WINDOW: WINDOW, EPS: EPS,
    defaults: defaults,
    presets: presets,
    initial: initial,
    sumAmplitude: sumAmplitude,
    fadeRange: fadeRange,
    trendOf: trendOf,
    signals: signals,
    curve: curve,
    history: history,
    drift: drift
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
