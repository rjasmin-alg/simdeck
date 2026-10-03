/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for "rectifier-1": the full-wave rectifier with two diodes and a centre-tapped transformer. The secondary's two
   halves give U1 (top end against the centre tap) and U2 (bottom end against the centre tap), equal and opposite:
     U1(θ) =  A·sin θ        U2(θ) = −A·sin θ        θ = ωt, the phase
   D1's anode is on the top end, D2's on the bottom end; both cathodes join at the + output, the centre tap is the −
   output. With ideal diodes the one whose anode is positive against the centre tap conducts and the other blocks:
     1st half-period (0 < θ < π):   U1 > 0, D1 conducts, D2 blocks
     2nd half-period (π < θ < 2π):  U2 > 0, D2 conducts, D1 blocks
   Either way the current flows through the load R in the same direction, from + to the centre tap, so
     Ua(θ) = max(U1, U2) = A·|sin θ|
   two humps per period, both above the zero line. Source: 50ohm-contents-hr/contents/sections/vollweggleichrichter.md
   and the original's figures 959, 960, 961 (A = 0.9, θ from 0 to 2.5π, the windows 0 … π and π … 2π shaded).
   A stepper: step 0 is the circuit with its three voltages (the original's "no action"), steps 1 and 2 the
   original's two half-periods, step 3 (added) both half-periods at once, each hump of Ua with the diode that gave it.
   Adopted from 50ohm-contents-hr/contents/html/applet_gleichrichter_1.html, CC BY 4.0, 50ohm.de-Autorenteam,
   AJW-Referat des DARC e.V.; changed for simdeck (NOTES.md says what and why).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var A = 0.9;                 // amplitude of U1 and U2, as drawn in the figures (axes from −1 to 1)
  var T_MAX = 2.5 * Math.PI;   // the plots run from θ = 0 to 2.5π, as in the figures
  var EPS = 1e-9;              // |sin θ| within this is a zero crossing
  var STEPS = 3;
  var defaults = {};

  function u1(th) { return A * Math.sin(th); }
  function u2(th) { return -A * Math.sin(th); }
  function ua(th) { return Math.max(u1(th), u2(th), 0); }

  /** Which half-period θ lies in: 1 for 0 < θ mod 2π < π, 2 for π < θ mod 2π < 2π. Tie-break: at a zero crossing
      (θ a multiple of π, within EPS of sin θ = 0) it is null, belonging to neither. */
  function halfAt(th) {
    var s = Math.sin(th);
    if (Math.abs(s) <= EPS) return null;
    return s > 0 ? 1 : 2;
  }

  /** The diode that conducts at θ: 'D1' while U1 > 0, 'D2' while U2 > 0. Tie-break: at a zero crossing neither
      anode is positive against the centre tap and no diode conducts (null), so the output is 0 there. */
  function conducting(th) {
    var half = halfAt(th);
    return half == null ? null : half === 1 ? 'D1' : 'D2';
  }

  /** The highlighted windows of θ at step n: [] at step 0, the 1st or 2nd half-period at steps 1 and 2, and at step 3
      every half-period of the plotted range, each with its diode. */
  function windows(n) {
    if (n === 1) return [{ from: 0, to: Math.PI, half: 1, diode: 'D1' }];
    if (n === 2) return [{ from: Math.PI, to: 2 * Math.PI, half: 2, diode: 'D2' }];
    if (n !== 3) return [];
    var out = [];
    for (var k = 0; k * Math.PI < T_MAX - EPS; k++) {
      var half = k % 2 === 0 ? 1 : 2;
      out.push({ from: k * Math.PI, to: Math.min((k + 1) * Math.PI, T_MAX), half: half, diode: half === 1 ? 'D1' : 'D2' });
    }
    return out;
  }

  /** The state at step n, for n outside 0 … STEPS the nearest end, a fraction the nearest step. */
  function at(p, n) {
    var k = Math.max(0, Math.min(STEPS, Math.round(Number(n)) || 0));
    // a phase inside the step's half-period (its middle), to read the diodes and polarities from the model
    var th = k === 1 ? Math.PI / 2 : k === 2 ? 3 * Math.PI / 2 : null;
    var on = th == null ? null : conducting(th);
    var sign = function (v) { return v > 0 ? '+' : '-'; };
    return {
      n: k,
      half: k === 0 ? null : k === 3 ? 'both' : halfAt(th),
      // per diode: 'conducts', 'blocks', 'alternate' (step 3: each conducts in its half-period) or null (step 0)
      d1: k === 0 ? null : k === 3 ? 'alternate' : on === 'D1' ? 'conducts' : 'blocks',
      d2: k === 0 ? null : k === 3 ? 'alternate' : on === 'D2' ? 'conducts' : 'blocks',
      // polarity of each secondary end against the centre tap during the step's half-period
      top: th == null ? null : sign(u1(th)),
      bottom: th == null ? null : sign(u2(th)),
      // the current paths drawn: the conducting diode's loop, both at step 3
      paths: k === 0 ? [] : k === 3 ? ['D1', 'D2'] : [on],
      // the current through R, from the + output to the centre tap, in every half-period
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
    A: A, T_MAX: T_MAX,
    defaults: defaults,
    steps: STEPS,
    presets: presets,

    /** State at step 0: the circuit and its voltages, nothing highlighted. */
    initial: function (p) { return at(p, 0); },

    /** State after step n. Depends only on n, so step back is exact. */
    step: function (s, n, p) { return at(p, n); },

    at: at,
    u1: u1,
    u2: u2,
    ua: ua,
    halfAt: halfAt,
    conducting: conducting,
    windows: windows,
    curve: curve
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
