/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for "from resonant circuit to antenna": a closed LC resonant circuit is opened up, step by step, until only a
   straight wire is left, fed in the middle: a dipole. The electric field, at first shut in between the capacitor's
   plates, reaches further and further out into the space around the circuit; that is what lets an antenna radiate.
   Six shapes, after the original's six figures 925–930 (coordinates from their .tex sources, in their units: the loop
   is 2 wide and 2 high, its top wire at y = 0, its bottom wire at y = −2, y up):
     0  closed circuit: coil of 5 turns, plates 0.3 apart, the field only between them          (925)
     1  plates pulled apart to 1.4, coil of 4 turns; the field still between the plates          (926)
     2  plates opened to a V (each 45° from the axis), coil of 3 turns; the field bulges out       (927)
     3  plates in one line (opened to 180°), coil of 2 turns; the field arcs far out             (928)
     4  coil unwound to a straight wire with small end plates; the field loops round the wire   (929)
     5  the wire on its own, split in the middle and fed there: a dipole                        (930)
   Each step makes the inductance L or the capacitance C smaller (fewer turns or a smaller loop for L, plates further
   apart or smaller for C) and neither larger, so the resonant frequency f0 = 1 / (2π √(L C)) rises at every step.
   The figures give no values for L and C, so the model says only which one shrinks (`lDown`, `cDown`), not by how much.
   The toggle `flip` shows the same instant half a period later: charges and field the other way round.
   A stepper: step n is shape n (steps 0 … 5). The original plays the six figures forward and back in a 1-second loop.
   Adopted from 50ohm-contents-hr/contents/html/applet_schwingkreis_antenne.html and its figures 925–930, CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; changed for simdeck (NOTES.md says what and why).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var S2 = Math.SQRT2;
  // The six shapes, in the figures' units. kind: 'parallel' plates (gap between them), 'fan' (plates on two rays from
  // `centre`, `angle` degrees above and below the horizontal, from radius r0 to r1), 'wire' (straight, with end plates
  // `hat` wide on each side), 'dipole' (straight, split by `feedGap` in the middle). `reach`: how far the field lines
  // reach out from the wire, in the same units (wire and dipole only).
  var SHAPES = [
    { fig: 925, kind: 'parallel', coilX: 0, turns: 5, gap: 0.3, lines: 7 },
    { fig: 926, kind: 'parallel', coilX: 0, turns: 4, gap: 1.4, lines: 7 },
    { fig: 927, kind: 'fan', coilX: 0.5, turns: 3, centre: [1, -1], angle: 45, r0: 0.85, r1: 0.85 + 0.8 * S2, lines: 7 },
    { fig: 928, kind: 'fan', coilX: 1, turns: 2, centre: [2, -1], angle: 90, r0: 0.6, r1: 1.4, lines: 7 },
    { fig: 929, kind: 'wire', coilX: 1, turns: 0, hat: 0.2, reach: [0.5, 0.75], lines: 4 },
    { fig: 930, kind: 'dipole', coilX: 1, turns: 0, feedGap: 0.2, reach: [0.6, 0.95], lines: 4 }
  ];
  var RIGHT_X = 2;          // the loop's right side, where the capacitor sits
  var PLATE_HALF = 0.4;     // half the plates' width (parallel) and the end plates' reach
  // Where the field is, per shape: shut in between the plates, bulging out of the gap, out in the space round the wire.
  var FIELD = ['inside', 'inside', 'bulge', 'bulge', 'space', 'space'];
  // What each step makes smaller, against the step before (step 0 has nothing before it). L: fewer turns or a smaller
  // loop (4 → 5 keeps the same straight wire, only split); C: plates further apart, opened wider, smaller or gone.
  var L_DOWN = [false, true, true, true, true, false];
  var C_DOWN = [false, true, true, true, true, true];

  var STEPS = SHAPES.length - 1;
  var defaults = { flip: false };

  /** The state at step n, for n outside 0 … STEPS the nearest end. `sign` is +1 when the upper plate (or upper end)
      is +, so the field points down, −1 half a period later (`flip`). Only `true` flips: anything else is no flip.
      Tie-breaks: step 0 changes nothing (`lDown`, `cDown` false, `f0Up` false); f0 rises when L or C gets smaller
      and neither larger, so `f0Up` is lDown || cDown. */
  function at(p, n) {
    var k = Math.max(0, Math.min(STEPS, Math.round(Number(n)) || 0));
    var sh = SHAPES[k], sign = p && p.flip === true ? -1 : 1;
    return {
      n: k,
      fig: sh.fig,
      kind: sh.kind,
      turns: sh.turns,
      coil: sh.turns > 0,
      loopWidth: RIGHT_X - sh.coilX,
      field: FIELD[k],
      lines: sh.lines,
      sign: sign,
      lDown: L_DOWN[k],
      cDown: C_DOWN[k],
      f0Up: L_DOWN[k] || C_DOWN[k],
      last: k === STEPS
    };
  }

  /** The drawing of shape n in the figures' units (y up): wires as polylines, the coil, the plates as segments, and
      the field lines as point lists ordered from the + side to the − side (the arrow goes at the end), for sign +1.
      The page flips the arrows for sign −1; the lines themselves are the same. */
  function geometry(n) {
    var k = Math.max(0, Math.min(STEPS, Math.round(Number(n)) || 0));
    var sh = SHAPES[k], x0 = sh.coilX, xr = RIGHT_X;
    var g = { kind: sh.kind, wires: [], coil: null, plates: [], field: [], plus: null, minus: null, feed: null, ends: null };
    var i, j;
    if (sh.turns > 0) g.coil = { x: x0, y1: -0.6, y2: -1.4, turns: sh.turns };
    if (sh.kind === 'parallel') {
      var yt = -1 + sh.gap / 2, yb = -1 - sh.gap / 2;
      g.wires.push([[x0, -0.6], [x0, 0], [xr, 0], [xr, yt]]);
      g.wires.push([[x0, -1.4], [x0, -2], [xr, -2], [xr, yb]]);
      g.plates.push([[xr - PLATE_HALF, yt], [xr + PLATE_HALF, yt]], [[xr - PLATE_HALF, yb], [xr + PLATE_HALF, yb]]);
      for (i = 0; i < sh.lines; i++) {
        var x = xr - PLATE_HALF + i * 2 * PLATE_HALF / (sh.lines - 1);
        g.field.push([[x, yt], [x, yb]]);
      }
      g.plus = [xr + PLATE_HALF, yt, 1];
      g.minus = [xr + PLATE_HALF, yb, -1];
    } else if (sh.kind === 'fan') {
      var c = sh.centre, a = sh.angle * Math.PI / 180;
      var ray = function (r, s) { return [c[0] + r * Math.cos(a), c[1] + s * r * Math.sin(a)]; };
      g.wires.push([[x0, -0.6], [x0, 0], [xr, 0]]);
      g.wires.push([[x0, -1.4], [x0, -2], [xr, -2]]);
      g.plates.push([ray(sh.r0, 1), ray(sh.r1, 1)], [ray(sh.r0, -1), ray(sh.r1, -1)]);
      for (i = 0; i < sh.lines; i++) {
        var r = sh.r0 + i * (sh.r1 - sh.r0) / (sh.lines - 1), arc = [];
        for (j = 0; j <= 24; j++) {
          var phi = a - j * 2 * a / 24;
          arc.push([c[0] + r * Math.cos(phi), c[1] + r * Math.sin(phi)]);
        }
        g.field.push(arc);
      }
      g.plus = ray(sh.r1, 1).concat(1);
      g.minus = ray(sh.r1, -1).concat(-1);
    } else {
      var xw = x0;
      if (sh.kind === 'wire') {
        g.wires.push([[xw, 0], [xw, -2]]);
        g.plates.push([[xw - sh.hat, 0], [xw + sh.hat, 0]], [[xw - sh.hat, -2], [xw + sh.hat, -2]]);
      } else {
        var h = sh.feedGap / 2;
        g.wires.push([[xw, -1 + h], [xw, 0]], [[xw, -1 - h], [xw, -2]]);
        g.feed = [[xw, -1 + h], [xw, -1 - h]];
        g.ends = [[xw, 0], [xw, -2]];
      }
      // each field line leaves the upper end upwards, swings out to `reach` beside the middle and comes back into the
      // lower end from below, on both sides: two cubic Bézier halves, sampled
      sh.reach.forEach(function (d, ri) {
        [-1, 1].forEach(function (side) {
          var top = [xw, 0], mid = [xw + side * d, -1], up = 0.5 + 0.5 * ri;
          var pts = bezier(top, [xw, up], [mid[0], 0.6 + 0.5 * ri], mid)
            .concat(bezier(mid, [mid[0], -2.6 - 0.5 * ri], [xw, -2 - up], [xw, -2]).slice(1));
          g.field.push(pts);
        });
      });
      g.plus = [xw, 0, 1];
      g.minus = [xw, -2, -1];
    }
    return g;
  }

  /** 17 points on the cubic Bézier curve p0, c1, c2, p3; the weights are exactly 1, 0, 0, 0 at t = 0 and 0, 0, 0, 1 at
      t = 1, so both ends are exact. */
  function bezier(p0, c1, c2, p3) {
    var out = [];
    for (var s = 0; s <= 16; s++) {
      var t = s / 16, u = 1 - t;
      var w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
      out.push([w[0] * p0[0] + w[1] * c1[0] + w[2] * c2[0] + w[3] * p3[0], w[0] * p0[1] + w[1] * c1[1] + w[2] * c2[1] + w[3] * p3[1]]);
    }
    return out;
  }

  /** The box every shape fits in, field lines included, in the figures' units: [xMin, yMin, xMax, yMax]. The page
      draws all shapes at the same scale in this box, so nothing jumps between steps. */
  function bounds() {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    for (var n = 0; n <= STEPS; n++) {
      var g = geometry(n), all = [].concat.apply([], g.wires.concat(g.plates, g.field));
      if (g.coil) all.push([g.coil.x - 0.25, g.coil.y1], [g.coil.x + 0.25, g.coil.y2]);
      all.forEach(function (p) {
        b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]);
        b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]);
      });
    }
    return b;
  }

  /** Presets (keys 1–4, in this order): the closed circuit; the plates opened to a V; the open circuit (plates in one
      line); the dipole. The page adds labels. */
  var presets = [
    { id: 'closed', params: { flip: false }, step: 0 },
    { id: 'opened', params: { flip: false }, step: 2 },
    { id: 'open', params: { flip: false }, step: 3 },
    { id: 'dipole', params: { flip: false }, step: 5 }
  ];

  var logic = {
    SHAPES: SHAPES, FIELD: FIELD,
    defaults: defaults,
    steps: STEPS,
    presets: presets,

    /** State at step 0: the closed resonant circuit. */
    initial: function (p) { return at(p, 0); },

    /** State after step n. Depends only on n and the params, so step back is exact. */
    step: function (s, n, p) { return at(p, n); },

    at: at,
    geometry: geometry,
    bezier: bezier,
    bounds: bounds
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
