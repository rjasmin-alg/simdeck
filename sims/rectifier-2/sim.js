/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for "rectifier-2": the bridge rectifier, a transformer and four diodes. The secondary gives Us, the top end
   against the bottom end:
     Us(θ) = A·sin θ        θ = ωt, the phase
   The four diodes form a bridge between the secondary's two ends (the ~ corners) and the outputs + and −. All cathodes
   point to +, all anodes to −:
     D1: top end → +        D2: − → bottom end        D3: bottom end → +        D4: − → top end
   With ideal diodes, in each half-period the pair whose path runs from the positive end through R back to the negative
   end conducts, and the other pair blocks:
     1st half-period (0 < θ < π):   top end +, D1 and D2 conduct, D3 and D4 block
     2nd half-period (π < θ < 2π):  bottom end +, D3 and D4 conduct, D1 and D2 block
   Either way the current flows through the load R in the same direction, from + to −, so
     Ua(θ) = |Us(θ)| = A·|sin θ|
   two humps per period, both above the zero line. Source: 50ohm-contents-hr/contents/sections/brueckengleichrichter.md
   and the original's figures 962, 963, 964 (A = 0.9, θ from 0 to 2.5π, the windows 0 … π and π … 2π shaded).
   A stepper: step 0 is the circuit with its two voltages (the original's "no action"), steps 1 and 2 the original's
   two half-periods, step 3 (added) both half-periods at once, each hump of Ua with the diodes that gave it.
   Adopted from 50ohm-contents-hr/contents/html/applet_gleichrichter_2.html, CC BY 4.0, 50ohm.de-Autorenteam,
   AJW-Referat des DARC e.V.; changed for simdeck (NOTES.md says what and why).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var A = 0.9;                 // amplitude of Us, as drawn in the figures (axes from −1 to 1)
  var T_MAX = 2.5 * Math.PI;   // the plots run from θ = 0 to 2.5π, as in the figures
  var EPS = 1e-9;              // |sin θ| within this is a zero crossing
  var STEPS = 3;
  var defaults = {};
  // the diode pair of each half-period, in the order the current meets them
  var PAIR = { 1: ['D1', 'D2'], 2: ['D3', 'D4'] };
  var DIODES = ['D1', 'D2', 'D3', 'D4'];

  function us(th) { return A * Math.sin(th); }
  function ua(th) { return Math.abs(us(th)); }

  /** Which half-period θ lies in: 1 for 0 < θ mod 2π < π, 2 for π < θ mod 2π < 2π. Tie-break: at a zero crossing
      (θ a multiple of π, within EPS of sin θ = 0) it is null, belonging to neither. */
  function halfAt(th) {
    var s = Math.sin(th);
    if (Math.abs(s) <= EPS) return null;
    return s > 0 ? 1 : 2;
  }

  /** The diodes that conduct at θ: D1 and D2 while the top end is positive, D3 and D4 while the bottom end is.
      Tie-break: at a zero crossing the two ends are at the same voltage and no diode conducts ([]), so Ua = 0. */
  function conducting(th) {
    var half = halfAt(th);
    return half == null ? [] : PAIR[half].slice();
  }

  /** The pair that conducts in a half-period (1 or 2); [] for anything else. */
  function pair(half) { return PAIR[half] ? PAIR[half].slice() : []; }

  /** The highlighted windows of θ at step n: [] at step 0, the 1st or 2nd half-period at steps 1 and 2, and at step 3
      every half-period of the plotted range, each with its diode pair. */
  function windows(n) {
    if (n === 1) return [{ from: 0, to: Math.PI, half: 1, diodes: pair(1) }];
    if (n === 2) return [{ from: Math.PI, to: 2 * Math.PI, half: 2, diodes: pair(2) }];
    if (n !== 3) return [];
    var out = [];
    for (var k = 0; k * Math.PI < T_MAX - EPS; k++) {
      var half = k % 2 === 0 ? 1 : 2;
      out.push({ from: k * Math.PI, to: Math.min((k + 1) * Math.PI, T_MAX), half: half, diodes: pair(half) });
    }
    return out;
  }

  /** The state at step n, for n outside 0 … STEPS the nearest end, a fraction the nearest step. */
  function at(p, n) {
    var k = Math.max(0, Math.min(STEPS, Math.round(Number(n)) || 0));
    // a phase inside the step's half-period (its middle), to read the diodes and polarities from the model
    var th = k === 1 ? Math.PI / 2 : k === 2 ? 3 * Math.PI / 2 : null;
    var on = th == null ? [] : conducting(th);
    var sign = function (v) { return v > 0 ? '+' : '-'; };
    // per diode: 'conducts', 'blocks', 'alternate' (step 3: each pair conducts in its half-period) or null (step 0)
    var diodes = {};
    DIODES.forEach(function (d) {
      diodes[d] = k === 0 ? null : k === 3 ? 'alternate' : on.indexOf(d) >= 0 ? 'conducts' : 'blocks';
    });
    return {
      n: k,
      half: k === 0 ? null : k === 3 ? 'both' : halfAt(th),
      diodes: diodes,
      // polarity of each secondary end during the step's half-period, against the other end
      top: th == null ? null : sign(us(th)),
      bottom: th == null ? null : sign(-us(th)),
      // the current paths drawn, by half-period: the conducting pair's loop, both at step 3
      paths: k === 0 ? [] : k === 3 ? [1, 2] : [halfAt(th)],
      // the current through R, from + to −, in every half-period
      load: k === 0 ? null : 'down',
      windows: windows(k),
      last: k === STEPS
    };
  }

  /** A sampled curve for the plots: [θ, v] for θ from 0 to T_MAX in `samples` steps. */
  function curve(fn, samples) {
    var out = [];
    for (var i = 0; i <= samples; i++) {
      var th = i * T_MAX / samples;
      out.push([th, fn(th)]);
    }
    return out;
  }

  /** Presets (keys 1–3): the original's two half-period buttons, then both together. */
  var presets = [
    { id: 'half1', params: {}, step: 1 },
    { id: 'half2', params: {}, step: 2 },
    { id: 'both', params: {}, step: 3 }
  ];

  var logic = {
    A: A, T_MAX: T_MAX, DIODES: DIODES,
    defaults: defaults,
    steps: STEPS,
    presets: presets,

    /** State at step 0: the circuit and its voltages, nothing highlighted. */
    initial: function (p) { return at(p, 0); },

    /** State after step n. Depends only on n, so step back is exact. */
    step: function (s, n, p) { return at(p, n); },

    at: at,
    us: us,
    ua: ua,
    halfAt: halfAt,
    conducting: conducting,
    pair: pair,
    windows: windows,
    curve: curve
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
