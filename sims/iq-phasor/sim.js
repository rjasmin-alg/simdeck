/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the I/Q phasor: a phasor of length A starts at the angle φ (the symbol's state at t = 0) and turns
   counter-clockwise with the carrier. Its two projections are the two parts of the signal:
     horizontal: I(t) = A · cos(ωt + φ)   (a cosine; at t = 0, I = A · cos φ)
     vertical:   Q(t) = A · sin(ωt + φ)   (a sine, 90° behind the cosine; at t = 0, Q = A · sin φ)
   A is percent of full scale, 0 … 100; φ in degrees, −180 … 180. A stepper: step n turns the phasor to ωt = n · 30°,
   12 steps make one full turn, so step 12 is back at the start.
   Adopted from 50ohm-contents-hr/contents/html/applet_iq_zeiger.html (the phasor, the sine to the right and the
   cosine downwards, the slider ranges, I and Q from A and φ), CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC
   e.V.; changed for simdeck (NOTES.md says what and why).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var A_MIN = 0, A_MAX = 100, A_STEP = 5;          // the original: 0 … 1 in steps of 0.01
  var PHI_MIN = -180, PHI_MAX = 180, PHI_STEP = 15; // the original: −180 … 180 in steps of 1
  var TURN = 30;                                  // degrees of ωt per step
  var STEPS = 12;                                 // 12 · 30° = one full turn
  var POINTS = 360;                               // samples over one carrier period for the traces

  var defaults = { a: 80, phi: 30 };              // I ≈ 69 %, Q = 40 %: neither part is zero, nor are they equal

  /** A slider value in whole steps of `step` in [min, max]. Tie-breaks: not a number → `fallback`; between two
      steps → the nearer, a half step up (as the kit snaps a slider value to its grid); −0 becomes 0. */
  function snap(v, min, max, step, fallback) {
    var x = Number(v);
    if (v === null || v === '' || typeof v === 'boolean' || !Number.isFinite(x)) return fallback;
    x = Math.max(min, Math.min(max, x));
    return Math.round(x / step) * step + 0;
  }

  /** An angle in degrees folded into (−180, 180]. */
  function fold(deg) {
    var r = ((deg % 360) + 360) % 360;
    return r > 180 ? r - 360 : r;
  }

  /** cos and sin of an angle in degrees, exact on the axes (0 and ±1 at multiples of 90°, never 6e-17). */
  function cosd(deg) {
    var r = fold(deg);
    if (r === 0) return 1;
    if (r === 180) return -1;
    if (r === 90 || r === -90) return 0;
    return Math.cos(r * Math.PI / 180);
  }
  function sind(deg) { return cosd(deg - 90); }

  /** A projection as the page shows it: whole percent, half away from zero (so +2.5 and −2.5 show as 3 and −3, the
      same size), and never −0. Float noise is cut first (9 decimals), so 5 · cos 120° = −2.4999999999999996 counts as
      −2.5, like 5 · cos 60° = 2.5000000000000004 counts as 2.5. */
  function roundPct(v) {
    var x = Math.round(Math.abs(v) * 1e9) / 1e9;
    var r = Math.sign(v) * Math.round(x);
    return r + 0;
  }

  /** Which axis the phasor lies on at `angle` (folded), or null between the axes: 'i+' at 0°, 'q+' at 90°, 'i-' at
      180°, 'q-' at −90°. */
  function axisOf(angle) {
    return angle === 0 ? 'i+' : angle === 90 ? 'q+' : angle === 180 ? 'i-' : angle === -90 ? 'q-' : null;
  }

  /** The state after the phasor has turned by `wt` degrees. Tie-breaks: A = 0 is no signal (`none`): both projections
      are 0 and there is no axis; the angle is folded into (−180°, 180°], so φ = −180° is the same phasor as 180°. */
  function at(p, n) {
    var a = snap(p.a, A_MIN, A_MAX, A_STEP, defaults.a);
    var phi = snap(p.phi, PHI_MIN, PHI_MAX, PHI_STEP, defaults.phi);
    var wt = n * TURN;
    var angle = fold(phi + wt);
    var none = a === 0;
    var i = a * cosd(angle) + 0, q = a * sind(angle) + 0;
    return {
      n: n,
      a: a,
      phi: phi,
      wt: wt,
      angle: angle,
      none: none,
      i: i,
      q: q,
      i0: a * cosd(phi) + 0,                      // the symbol's I and Q, at t = 0
      q0: a * sind(phi) + 0,
      iRound: roundPct(i),
      qRound: roundPct(q),
      axis: none ? null : axisOf(angle),
      full: wt === 360                            // one full turn: back at the start
    };
  }

  /** One carrier period of both projections, starting at t = 0: `points` + 1 samples at θ = ωt from 0° to 360°.
      i is the cosine the page draws downwards, q the sine it draws to the right. */
  function trace(a, phi, points) {
    var k, n = points || POINTS, out = [];
    for (k = 0; k <= n; k++) {
      var th = 360 * k / n;
      out.push({ wt: th, i: a * cosd(phi + th), q: a * sind(phi + th) });
    }
    return out;
  }

  /** Presets (keys 1–6, in this order): the start; φ = 0° (all I); φ = 90° (all Q); φ = 180° (I negative);
      φ = −45° at full scale (I and Q the same size, Q negative); and no signal. The page adds labels. */
  var presets = [
    { id: 'start', params: { a: 80, phi: 30 } },
    { id: 'ionly', params: { a: 80, phi: 0 } },
    { id: 'qonly', params: { a: 80, phi: 90 } },
    { id: 'reverse', params: { a: 80, phi: 180 } },
    { id: 'minus45', params: { a: 100, phi: -45 } },
    { id: 'none', params: { a: 0, phi: 30 } }
  ];

  var logic = {
    A_MIN: A_MIN, A_MAX: A_MAX, A_STEP: A_STEP, PHI_MIN: PHI_MIN, PHI_MAX: PHI_MAX, PHI_STEP: PHI_STEP,
    TURN: TURN, POINTS: POINTS,
    defaults: defaults,
    steps: STEPS,
    presets: presets,

    /** State at step 0: the symbol's start state at t = 0. */
    initial: function (p) { return at(p, 0); },

    /** State after step n: the phasor turned by n · 30°. Depends only on n and the params, so step back is exact. */
    step: function (s, n, p) { return at(p, n); },

    at: at,
    snap: snap,
    fold: fold,
    cosd: cosd,
    sind: sind,
    roundPct: roundPct,
    axisOf: axisOf,
    trace: trace
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
