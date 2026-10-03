/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the ring modulator: four diodes in a ring between two centre-tapped transformers T1 and T2, both 1:1.
   U1 (the input) is on T1's primary, U2 (the oscillator) between the two centre taps, U3 (the output) on T2's
   secondary. As in the original, the diodes are ideal (no threshold voltage) and U2 is a square wave of ±1 V, so the
   ring switches hard between two states:
     case 1, U2 = +1 V: D1 and D3 conduct, D2 and D4 block; T1's upper end reaches T2's lower end, U3 = +U1
     case 2, U2 = −1 V: D2 and D4 conduct, D1 and D3 block; T1's upper end reaches T2's upper end, U3 = −U1
   so U3 = U1 · U2 / 1 V: the ring is a polarity switch, and switching is a multiplication.
   The ring: D1 from N (T1's upper end) to E, D2 from E to S (T1's lower end), D3 from S to W, D4 from W to N, each
   named from anode to cathode. W goes to T2's upper end (A1), E to its lower end (A2), T2's centre tap is 0 V.
   Node voltages for U2 = s · 1 V (s = ±1): N = s + U1/2, S = s − U1/2 (T1's secondary halves carry U1/2 each);
   A2 = s + s · U1/2, A1 = s − s · U1/2, and U3 = A2 − A1 = s · U1. The original's two formulas are s = +1 and s = −1.
   A stepper: time runs in half periods of U2 (U2 > 0 in the odd ones, starting at t = 0); step n is the n-th half
   period, 12 steps in all. U1 = Û1 · sin(π t / r), where r = f2 / f1, so one period of U1 lasts 2r half periods.
   Each step reads the voltages in the middle of its half period, t = n − ½. Step 0 is the original's "no action":
   the circuit with no switching state chosen.
   Adopted from 50ohm-contents-hr/contents/html/applet_ringmodulator.html and its figures 1122–1124 (the circuit,
   the two cases, the node voltages, the three waveforms), CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC
   e.V.; changed for simdeck (NOTES.md says what and why).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var U2 = 1;                                      // the oscillator's square wave, ±1 V (the original's value)
  var U1_MIN = 0, U1_MAX = 1, U1_STEP = 0.1;       // the input's peak Û1 in V; kept well below what would make
                                                   // the diodes leave their two states (|U1| / 2 < U2)
  var R_MIN = 2, R_MAX = 6, R_STEP = 1;            // f2 / f1: how many oscillator periods per period of U1
  var STEPS = 12;                                  // half periods of U2 shown
  var POINTS = 24;                                 // samples per half period for the traces

  var defaults = { u1: 0.6, r: 6 };                // one period of U1 in the 12 half periods, as in the figures

  /** A slider value in whole steps of `step` in [min, max]. Tie-breaks: not a number → `fallback`; between two
      steps → the nearer, a half step up (as the kit snaps a slider value to its grid), also where float noise puts the
      half step just below (0.35 / 0.1 is 3.4999999999999996); float noise cut from the result (0.1 · 3 is
      0.30000000000000004); −0 becomes 0. */
  function snap(v, min, max, step, fallback) {
    var x = Number(v);
    if (v === null || v === '' || typeof v === 'boolean' || !Number.isFinite(x)) return fallback;
    x = Math.max(min, Math.min(max, x));
    var k = Math.floor(x / step + 0.5 + 1e-9);
    return Math.round(k * step * 1e9) / 1e9 + 0;
  }

  /** A voltage as the page shows it: hundredths of a volt, half away from zero (so +0.125 and −0.125 show as 0.13
      and −0.13, the same size), float noise cut first, never −0. */
  function roundV(v) {
    var x = Math.round(Math.abs(v) * 1e9) / 1e9;
    return Math.sign(v) * Math.round(x * 100) / 100 + 0;
  }

  /** The sign of U2 at time t (in half periods): +1 in [2k, 2k + 1), −1 in [2k + 1, 2k + 2). A switching instant
      belongs to the half period it starts. */
  function u2Sign(t) {
    return Math.floor(t) % 2 === 0 ? 1 : -1;
  }

  /** U1 at time t: Û1 · sin(π t / r). Exact zero at whole periods' halves (t a multiple of r), never 1e-16. */
  function u1At(u1, r, t) {
    var q = t / r;
    if (q === Math.round(q)) return 0;
    return u1 * Math.sin(Math.PI * q) + 0;
  }

  /** The case for U2 = s · 1 V: which diodes conduct, the node voltages and U3. `u` is U1 at that instant. */
  function caseOf(s, u) {
    return {
      kase: s > 0 ? 1 : 2,
      on: s > 0 ? ['d1', 'd3'] : ['d2', 'd4'],      // conducting pair; the other two block
      // where T1's upper end (N) reaches T2: its lower end (A2) in case 1, its upper end (A1) in case 2
      nTo: s > 0 ? 'a2' : 'a1',
      v: {
        tap1: s * U2, tap2: 0,
        n: s * U2 + u / 2, s: s * U2 - u / 2,
        a2: s * U2 + s * u / 2 + 0, a1: s * U2 - s * u / 2 + 0
      },
      u3: s * u + 0
    };
  }

  /** The state at step n. Step 0 is the circuit at rest (`kase` 0, no instant); step n ≥ 1 is the n-th half period
      of U2, read in its middle. Tie-breaks: Û1 = 0 gives U3 = 0 in both cases, although the diodes still switch (the
      ring keeps U2 out of the output); U3 is never −0. */
  function at(p, n) {
    var u1 = snap(p.u1, U1_MIN, U1_MAX, U1_STEP, defaults.u1);
    var r = snap(p.r, R_MIN, R_MAX, R_STEP, defaults.r);
    var base = { n: n, u1: u1, r: r, periods: STEPS / (2 * r), last: n === STEPS };
    if (n === 0) return Object.assign(base, { kase: 0, t: null, u: null, u3: null, on: [], nTo: null, v: null });
    var t = n - 0.5, s = u2Sign(t), u = u1At(u1, r, t), c = caseOf(s, u);
    return Object.assign(base, {
      kase: c.kase,
      t: t,
      s: s,
      u: u,
      u3: c.u3,
      uRound: roundV(u),
      u3Round: roundV(c.u3),
      on: c.on,
      nTo: c.nTo,
      v: c.v
    });
  }

  /** The three waveforms over the 12 half periods: `POINTS` samples per half period, plus a sample on each side of
      every switching instant so the square edges stay vertical. */
  function trace(u1, r) {
    var out = [], k, j;
    for (k = 0; k < STEPS; k++) {
      for (j = 0; j <= POINTS; j++) {
        var t = k + j / POINTS, s = j === POINTS ? (k % 2 === 0 ? 1 : -1) : u2Sign(t), u = u1At(u1, r, t);
        out.push({ t: t, u2: s * U2, u1: u, u3: s * u + 0 });
      }
    }
    return out;
  }

  /** Presets (keys 1–4, in this order): the start; f2 = 2 · f1 (few switchings per period of U1); no input (only
      U2 is there, and nothing reaches the output); and Û1 = 1 V, as large as U2. The page adds labels. */
  var presets = [
    { id: 'start', params: { u1: 0.6, r: 6 } },
    { id: 'coarse', params: { u1: 0.6, r: 2 } },
    { id: 'none', params: { u1: 0, r: 6 } },
    { id: 'large', params: { u1: 1, r: 6 } }
  ];

  var logic = {
    U2: U2, U1_MIN: U1_MIN, U1_MAX: U1_MAX, U1_STEP: U1_STEP, R_MIN: R_MIN, R_MAX: R_MAX, R_STEP: R_STEP,
    POINTS: POINTS,
    defaults: defaults,
    steps: STEPS,
    presets: presets,

    /** State at step 0: the circuit at rest. */
    initial: function (p) { return at(p, 0); },

    /** State after step n: the n-th half period of U2. Depends only on n and the params, so step back is exact. */
    step: function (s, n, p) { return at(p, n); },

    at: at,
    snap: snap,
    roundV: roundV,
    u2Sign: u2Sign,
    u1At: u1At,
    caseOf: caseOf,
    trace: trace
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
