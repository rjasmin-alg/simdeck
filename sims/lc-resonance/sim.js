/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the LC resonant circuit: a coil L and a capacitor C in one loop, no resistance (as in the original's
   figures, so the oscillation never dies down). Once the capacitor is charged, it discharges through the coil; the
   current builds a magnetic field, which then keeps the current going and charges the capacitor the other way, and so
   on. With the capacitor's voltage u = cos φ and the current i = sin φ (both relative to their peaks, φ = 2π t / T):
     energy in the capacitor's electric field  W_E = cos² φ   (of the total)
     energy in the coil's magnetic field        W_M = sin² φ   so W_E + W_M = 1 at every instant
     resonant frequency (Thomson's formula)    f0 = 1 / (2π √(L C)),  period T = 1 / f0
   The current counts positive when it leaves the capacitor's upper plate towards the coil (the original's first
   current arrow); u is positive when the upper plate is +.
   A stepper, after the original's nine pictures: step 0 is the circuit at rest (uncharged, the original's first
   picture), step 1 the charged capacitor at t = 0, and each further step one eighth of a period, so step 9 is t = T
   (one full period, the same state as step 1). The eighths make the values exact: the table below, not Math.cos.
   Adopted from 50ohm-contents-hr/contents/html/applet_schwingkreis.html and its figures 891–899 (the circuit with its
   fields) and 1027–1035 (the current over time), CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; changed
   for simdeck (NOTES.md says what and why).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var R = Math.SQRT1_2;
  // u = cos φ and i = sin φ at φ = k · 45°, k = 0 … 7; exact zeros and ±1, ±√½ in between
  var COS = [1, R, 0, -R, -1, -R, 0, R];
  var SIN = [0, R, 1, R, 0, -R, -1, -R];
  // their squares, the energy shares, exact: cos² 45° is 0.5000000000000001 in floats
  var COS2 = [1, 0.5, 0, 0.5, 1, 0.5, 0, 0.5];

  var EIGHTHS = 8;
  var STEPS = EIGHTHS + 1;                         // rest, then t = 0, T/8, …, T
  var L_OPTIONS = [1, 2.2, 4.7, 10, 22];           // µH
  var C_OPTIONS = [22, 47, 100, 220, 470];         // pF
  var E_LINES = 6;                                 // field arrows in the capacitor at full charge (drawing aid)
  var H_LINES = 3;                                 // field lines around the coil at full current (drawing aid)
  var POINTS = 12;                                 // samples per eighth for the plot

  var defaults = { l: 10, c: 100 };                // f0 = 5.03 MHz

  /** One of the options, or the default when the value is not one of them (also for '10' as a string: the kit and
      the URL hand over numbers for numeric options, anything else is not an option). */
  function pick(v, options, fallback) {
    return options.indexOf(v) >= 0 ? v : fallback;
  }

  /** f0 in Hz for L in µH and C in pF: Thomson's formula. */
  function f0(l, c) {
    return 1 / (2 * Math.PI * Math.sqrt(l * 1e-6 * c * 1e-12));
  }

  /** x to three significant digits, half away from zero, float noise cut first (999.6 → 1000); 0 stays 0, never −0. */
  function sig3(x) {
    if (x === 0 || !Number.isFinite(x)) return 0;
    var a = Math.abs(x), e = Math.floor(Math.log10(a)) - 2;
    var m = Math.round(a / Math.pow(10, e) * 1e9) / 1e9;   // the mantissa with three digits before the point
    var r = Math.round(m);                                  // m > 0, so this is half away from zero
    return Math.sign(x) * (e >= 0 ? r * Math.pow(10, e) : r / Math.pow(10, -e)) + 0;
  }

  /** The state at step n. Step 0: at rest, nothing charged (`k` null). Step n ≥ 1: k = n − 1 eighths of a period.
      Tie-breaks: where the current is 0 it has no direction (`iDir` 0), where the voltage is 0 the plates have no
      sign (`uDir` 0); at the odd eighths the energy is split exactly in half; step 9 (t = T) is step 1 again, with
      `full` set. Unknown L or C fall back to the defaults. */
  function at(p, n) {
    var l = pick(p.l, L_OPTIONS, defaults.l), c = pick(p.c, C_OPTIONS, defaults.c);
    var f = f0(l, c), T = 1 / f;
    var base = { n: n, l: l, c: c, f0: f, T: T, f0Mhz: sig3(f / 1e6), Tns: sig3(T * 1e9), full: n === STEPS };
    if (n === 0) {
      return Object.assign(base, { k: null, u: 0, i: 0, uDir: 0, iDir: 0, wE: 0, wM: 0, eLines: 0, hLines: 0, tNs: null });
    }
    var k = n - 1, j = k % EIGHTHS, u = COS[j], i = SIN[j], wE = COS2[j];
    return Object.assign(base, {
      k: k,
      u: u,
      i: i,
      uDir: Math.sign(u),                          // the tables hold no −0, so 0 is +0
      iDir: Math.sign(i),
      wE: wE,
      wM: 1 - wE,
      eLines: Math.round(E_LINES * Math.abs(u)),   // 6, 4, 0
      hLines: Math.round(H_LINES * Math.abs(i)),   // 0, 2, 3
      tNs: sig3(k / EIGHTHS * T * 1e9)
    });
  }

  /** u and i over one period, `POINTS` samples per eighth, t in eighths (0 … 8). Exact at the eighths. */
  function trace() {
    var out = [];
    for (var s = 0; s <= EIGHTHS * POINTS; s++) {
      var t = s / POINTS;
      if (s % POINTS === 0) {
        var j = (s / POINTS) % EIGHTHS;
        out.push({ t: t, u: COS[j], i: SIN[j] });
      } else {
        var phi = 2 * Math.PI * t / EIGHTHS;
        out.push({ t: t, u: Math.cos(phi), i: Math.sin(phi) });
      }
    }
    return out;
  }

  /** Presets (keys 1–4, in this order): the start at rest; the instant of all energy in the coil (a quarter period);
      a larger capacitor (lower f0); a smaller coil (higher f0). The page adds labels. */
  var presets = [
    { id: 'start', params: { l: 10, c: 100 }, step: 0 },
    { id: 'magnetic', params: { l: 10, c: 100 }, step: 3 },
    { id: 'moreC', params: { l: 10, c: 470 }, step: 1 },
    { id: 'lessL', params: { l: 2.2, c: 100 }, step: 1 }
  ];

  var logic = {
    L_OPTIONS: L_OPTIONS, C_OPTIONS: C_OPTIONS, EIGHTHS: EIGHTHS, E_LINES: E_LINES, H_LINES: H_LINES, POINTS: POINTS,
    defaults: defaults,
    steps: STEPS,
    presets: presets,

    /** State at step 0: the circuit at rest. */
    initial: function (p) { return at(p, 0); },

    /** State after step n. Depends only on n and the params, so step back is exact. */
    step: function (s, n, p) { return at(p, n); },

    at: at,
    pick: pick,
    f0: f0,
    sig3: sig3,
    trace: trace
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
