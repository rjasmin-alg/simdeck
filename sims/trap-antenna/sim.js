/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for "trap antenna": a dipole with one trap in each half, a parallel resonant circuit (coil and capacitor) tuned
   to f_res = 7.05 MHz. How the trap acts depends on how the operating frequency f compares with f_res:
     f < f_res   the coil's branch wins: the trap is inductive, like a loading coil; the whole wire is active and the
                 trap lengthens it electrically (3.5 MHz)
     f = f_res   the parallel circuit is high-impedance and blocks: only the inner part between the traps is active,
                 2 × 10.07 m = 20.14 m (7.05 MHz)
     f > f_res   the capacitor's branch wins: the trap is capacitive; the whole wire is active and the trap shortens it
                 electrically (14 MHz)
   Dimensions from the original's figures 235, 1135 and 1136 (50ohm-contents-hr/contents/drawings/): 10.07 m from the
   feed point to each trap, 6.71 m from each trap to the end.
   The trap's reactance, normalised to its characteristic impedance Z0 = √(L/C), depends only on x = f / f_res:
     X / Z0 = x / (1 − x²)       (a parallel LC: Z = jωL / (1 − ω²LC), and ωL / Z0 = ω√(LC) = x)
   positive (inductive) below resonance, negative (capacitive) above it, unbounded at x = 1. The figures give no L or C,
   so the page shows only this normalised curve and its sign, no ohms.
   A stepper: step 0 is the antenna without excitation, steps 1 … 3 the original's three frequencies in its order.
   Adopted from 50ohm-contents-hr/contents/html/applet_traps.html, CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des
   DARC e.V.; changed for simdeck (NOTES.md says what and why).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var F_RES = 7.05;          // MHz, the traps' resonant frequency (figure 235)
  var INNER = 10.07;         // m, feed point to trap, each half
  var OUTER = 6.71;          // m, trap to end, each half
  var C_LIGHT = 299.792458;  // speed of light in m·MHz (λ in m = C_LIGHT / f in MHz)
  // The original's states, in its button order: no excitation, then 3.5, 7.05 and 14 MHz.
  var FREQS = [null, 3.5, 7.05, 14];
  var EPS = 1e-9;            // |f − f_res| within this counts as resonance

  var STEPS = FREQS.length - 1;
  var defaults = {};

  /** How a trap tuned to fres acts at f (both in MHz): 'none' without excitation (f null), 'inductive' below fres,
      'blocks' at fres, 'capacitive' above. Tie-break: |f − fres| ≤ EPS is resonance, so rounding never turns 7.05 into
      a slightly inductive or capacitive trap. */
  function trapAt(f, fres) {
    if (f == null) return 'none';
    if (Math.abs(f - fres) <= EPS) return 'blocks';
    return f < fres ? 'inductive' : 'capacitive';
  }

  /** The trap's reactance over Z0 at x = f / f_res: x / (1 − x²). At x = 1 (within EPS) it has no finite value: null. */
  function reactance(x) {
    if (Math.abs(1 - x) <= EPS) return null;
    return x / (1 - x * x);
  }

  /** The state at step n, for n outside 0 … STEPS the nearest end, a fraction the nearest step. */
  function at(p, n) {
    var k = Math.max(0, Math.min(STEPS, Math.round(Number(n)) || 0));
    var f = FREQS[k], trap = trapAt(f, F_RES);
    var active = trap === 'none' ? 'none' : trap === 'blocks' ? 'inner' : 'whole';
    var x = f == null ? null : f / F_RES;
    return {
      n: k,
      f: f,
      fres: F_RES,
      trap: trap,
      active: active,
      // the wire that carries current, both halves together, in m (physical length; the trap changes the electrical one)
      length: active === 'none' ? 0 : round2(2 * (active === 'inner' ? INNER : INNER + OUTER)),
      // what the trap does to the radiator: lengthens it, ends it, shortens it
      effect: { none: 'none', inductive: 'longer', blocks: 'ends', capacitive: 'shorter' }[trap],
      x: x == null ? null : round4(x),
      reactance: x == null ? null : roundOrNull(reactance(x)),
      // half a wavelength in free space at f, in m, for comparison with the active length
      halfWave: f == null ? null : round2(C_LIGHT / f / 2),
      last: k === STEPS
    };
  }

  function round2(v) { return Math.round(v * 100) / 100; }
  function round4(v) { return Math.round(v * 10000) / 10000; }
  function roundOrNull(v) { return v == null ? null : round4(v); }

  /** The reactance curve for the chart: x from 0 to xMax in `samples` steps, clipped to |X / Z0| ≤ yMax, as two
      branches (below and above resonance) of [x, y] points. The point at x = 1 itself is left out (no finite value). */
  function curve(xMax, yMax, samples) {
    var below = [], above = [];
    for (var i = 0; i <= samples; i++) {
      var x = i * xMax / samples, y = reactance(x);
      if (y == null || Math.abs(y) > yMax) continue;
      (x < 1 ? below : above).push([x, y]);
    }
    return { below: below, above: above };
  }

  /** Presets (keys 1–3): the three bands of the original's buttons. */
  var presets = [
    { id: 'f80', params: {}, step: 1 },
    { id: 'f40', params: {}, step: 2 },
    { id: 'f20', params: {}, step: 3 }
  ];

  var logic = {
    F_RES: F_RES, INNER: INNER, OUTER: OUTER, FREQS: FREQS,
    defaults: defaults,
    steps: STEPS,
    presets: presets,

    /** State at step 0: the antenna without excitation. */
    initial: function (p) { return at(p, 0); },

    /** State after step n. Depends only on n, so step back is exact. */
    step: function (s, n, p) { return at(p, n); },

    at: at,
    trapAt: trapAt,
    reactance: reactance,
    curve: curve
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
