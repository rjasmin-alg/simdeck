/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the spectrum of a square wave: the Fourier series of a symmetric square wave (amplitude 1, period 2π)
   is (4/π) · Σ sin(k·x) / k over the odd k only; summing it up to the N-th harmonic approximates the wave, and at
   each jump the sum overshoots by about 9 % of the jump however large N gets (the Gibbs phenomenon).
   An explorer: no steps; the page draws initial(params).
   Adopted from 50ohm-contents-hr/contents/html/applet_rectangle.html (the series, the odd N from 1 to 499, the
   window from −3π/2 to 3π/2 and the ideal square wave), CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.;
   changed for simdeck (NOTES.md says what and why).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var N_MIN = 1, N_MAX = 499, N_STEP = 2;           // the original's slider: odd N from 1 to 499
  var X_MIN = -1.5 * Math.PI, X_MAX = 1.5 * Math.PI; // the original's window: one and a half periods
  var GIBBS = 0.0894898722;                          // limit of the overshoot as a fraction of the jump: Si(π)/π − 1/2

  /** The harmonic number N the page shows: a whole odd number in [1, 499]. Tie-breaks (the original's
      clampHarmonics): not a number → 1; an even number goes down to the odd one below (4 → 3), never up. */
  function clampN(v) {
    var n = Math.trunc(Number(v));
    if (!Number.isFinite(n)) return N_MIN;
    n = Math.max(N_MIN, Math.min(N_MAX, n));
    return n % 2 === 0 ? n - 1 : n;
  }

  /** Amplitude of the k-th harmonic of the square wave: 4/(πk) for odd k, 0 for even k. */
  function amplitude(k) { return k % 2 === 1 ? 4 / (Math.PI * k) : 0; }

  /** The Fourier sum up to the n-th harmonic at x (radians): (4/π) · Σ_{k odd ≤ n} sin(kx) / k. */
  function partialSum(x, n) {
    var y = 0;
    for (var k = 1; k <= n; k += 2) y += Math.sin(k * x) / k;
    return (4 / Math.PI) * y;
  }

  /** The ideal square wave: +1 where sin x > 0, −1 where sin x < 0, and 0 on a jump (x = mπ), the midpoint every
      Fourier sum passes through. */
  function ideal(x) {
    var s = Math.sin(x);
    if (Math.abs(s) < 1e-12) return 0;
    return s > 0 ? 1 : -1;
  }

  /** The ideal wave over the window as corner points (vertical jumps at −π, 0 and π), as the original drew it. */
  function idealCorners() {
    return [
      { x: X_MIN, y: 1 }, { x: -Math.PI, y: 1 }, { x: -Math.PI, y: -1 }, { x: 0, y: -1 },
      { x: 0, y: 1 }, { x: Math.PI, y: 1 }, { x: Math.PI, y: -1 }, { x: X_MAX, y: -1 }
    ];
  }

  /** The first maximum after the jump at x = 0: the sum's derivative is (2/π) · sin((n+1)x) / sin x, which is
      first zero at x = π/(n+1). overshoot is how far the peak rises above 1, as a fraction of the jump (2). */
  function firstPeak(n) {
    var x = Math.PI / (n + 1), y = partialSum(x, n);
    return { x: x, y: y, overshoot: (y - 1) / 2 };
  }

  /** The approximation over the window at `points` + 1 evenly spaced x. */
  function curve(n, points) {
    var out = [];
    for (var i = 0; i <= points; i++) {
      var x = X_MIN + (i / points) * (X_MAX - X_MIN);
      out.push({ x: x, y: partialSum(x, n) });
    }
    return out;
  }

  /** Enough points to draw the sum: the original's max(1200, 40n), capped so a render stays quick; at n = 499 that
      is still about five points per ripple. */
  function pointsFor(n) { return Math.min(8000, Math.max(1200, 40 * n)); }

  var defaults = { n: 1 };

  /** Presets (keys 1–7, in this order), from the fundamental alone up to the slider's end. The page adds labels. */
  var presets = [
    { id: 'fundamental', params: { n: 1 } },
    { id: 'three', params: { n: 3 } },
    { id: 'five', params: { n: 5 } },
    { id: 'nine', params: { n: 9 } },
    { id: 'twenty-five', params: { n: 25 } },
    { id: 'ninety-nine', params: { n: 99 } },
    { id: 'max', params: { n: 499 } }
  ];

  /** The state the page draws: N, the harmonics in the sum (the spectrum) and the overshoot the caption names. */
  function initial(p) {
    var n = clampN(p.n);
    var harmonics = [];
    for (var k = 1; k <= n; k += 2) harmonics.push({ k: k, a: amplitude(k) });
    var peak = firstPeak(n);
    return {
      n: n,
      count: harmonics.length,
      harmonics: harmonics,
      last: amplitude(n),
      peak: { x: peak.x, y: peak.y },
      overshoot: peak.overshoot
    };
  }

  var logic = {
    N_MIN: N_MIN, N_MAX: N_MAX, N_STEP: N_STEP, X_MIN: X_MIN, X_MAX: X_MAX, GIBBS: GIBBS,
    defaults: defaults,
    presets: presets,
    initial: initial,
    clampN: clampN,
    amplitude: amplitude,
    partialSum: partialSum,
    ideal: ideal,
    idealCorners: idealCorners,
    firstPeak: firstPeak,
    curve: curve,
    pointsFor: pointsFor
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
