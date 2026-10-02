/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for Fourier synthesis: a periodic signal is the sum of sine waves at whole multiples of a 1 Hz fundamental,
   each with its own amplitude and phase. The same numbers give the signal over time (the sum) and its amplitude
   spectrum (one line per harmonic). An explorer: no steps; the page draws initial(params).
   Adopted from 50ohm-contents-hr/contents/html/fourier.html (up to 30 harmonics at 1 … 30 Hz over one 1 s period,
   amplitude 0 … 1 and phase per harmonic, the presets Minimum, Maximum and square, the three camera views of one
   3D scene), CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; changed for simdeck (NOTES.md says what
   and why). The scene's projection is here too, pure, so it is tested; the page only draws.
   Units: time in s (0 … 1, one period), frequency in Hz, amplitude as a fraction (0 … 1), phase in degrees.
   Component n: a_n · sin(2π n t − φ_n).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MAX = 30;                            // harmonics, as the original's slider
  var COUNT_MIN = 1;
  var PHASE_STEP = 5, PHASE_MAX = 355;     // degrees
  var AMP_STEP = 0.001;                    // fine enough for 1/n² up to n = 29
  var GRID = 600;                          // samples per period for the peak (the page draws with fewer)

  function clamp(x, lo, hi) { var v = Number(x); if (!Number.isFinite(v)) v = lo; return Math.min(hi, Math.max(lo, v)); }
  function snap(x, step) { return Math.round(x / step) * step; }

  function aKey(n) { return 'a' + n; }
  function pKey(n) { return 'p' + n; }

  /** Every harmonic at amplitude `amp(n)` and phase `phase(n)`; the rest of the params as given. */
  function shape(count, amp, phase) {
    var p = { count: count, sel: 1 };
    for (var n = 1; n <= MAX; n++) {
      p[aKey(n)] = snap(amp(n), AMP_STEP);
      p[pKey(n)] = phase(n);
    }
    return p;
  }
  var odd = function (n) { return n % 2 === 1; };

  // The waveforms. Square: odd harmonics at 1/n. Sawtooth: every harmonic at 1/n, the even ones inverted (180°).
  // Triangle: odd harmonics at 1/n², every second one inverted. Amplitudes relative to the fundamental (the
  // original's square has no 4/π factor, so neither does any of these).
  var waves = {
    sine: function (c) { return shape(c, function (n) { return n === 1 ? 1 : 0; }, function () { return 0; }); },
    square: function (c) { return shape(c, function (n) { return odd(n) ? 1 / n : 0; }, function () { return 0; }); },
    // the square's spectrum with every phase moved by 90°: the same lines, another signal
    squareShifted: function (c) { return shape(c, function (n) { return odd(n) ? 1 / n : 0; }, function (n) { return odd(n) ? 90 : 0; }); },
    sawtooth: function (c) { return shape(c, function (n) { return 1 / n; }, function (n) { return odd(n) ? 0 : 180; }); },
    triangle: function (c) { return shape(c, function (n) { return odd(n) ? 1 / (n * n) : 0; }, function (n) { return n % 4 === 3 ? 180 : 0; }); },
    all: function (c) { return shape(c, function () { return 1; }, function () { return 0; }); },
    none: function (c) { return shape(c, function () { return 0; }, function () { return 0; }); }
  };

  var defaults = waves.square(9);

  /** Presets (keys 1–8, in this order). The page adds the labels. */
  var presets = [
    { id: 'sine', params: waves.sine(9) },
    { id: 'square', params: waves.square(9) },
    { id: 'square-30', params: waves.square(30) },
    { id: 'square-phase', params: waves.squareShifted(9) },
    { id: 'sawtooth', params: waves.sawtooth(9) },
    { id: 'triangle', params: waves.triangle(9) },
    { id: 'all', params: waves.all(9) },
    { id: 'none', params: waves.none(9) }
  ];

  /** One component's value at time t: a · sin(2π n t − φ). */
  function component(h, t) { return h.a * Math.sin(2 * Math.PI * h.n * t - h.phase * Math.PI / 180); }

  /** The sum of the components at time t. */
  function sumAt(harmonics, t) {
    var y = 0;
    for (var i = 0; i < harmonics.length; i++) if (harmonics[i].a) y += component(harmonics[i], t);
    return y;
  }

  /** points + 1 evenly spaced samples of f over one period, as { t, y }. */
  function curve(f, points) {
    var out = [];
    for (var i = 0; i <= points; i++) { var t = i / points; out.push({ t: t, y: f(t) }); }
    return out;
  }

  /** The signal of the first `count` harmonics. Harmonics beyond count are not part of it, whatever their sliders
      say (they keep their values, so moving count back brings them back). */
  function initial(p) {
    var count = Math.round(clamp(p.count, COUNT_MIN, MAX));
    var sel = Math.round(clamp(p.sel, 1, count));
    var harmonics = [];
    for (var n = 1; n <= count; n++) {
      harmonics.push({
        n: n,
        a: snap(clamp(p[aKey(n)], 0, 1), AMP_STEP),
        phase: snap(clamp(p[pKey(n)], 0, PHASE_MAX), PHASE_STEP)
      });
    }
    var active = harmonics.filter(function (h) { return h.a > 0; }).map(function (h) { return h.n; });
    var peak = 0;
    for (var i = 0; i < GRID; i++) peak = Math.max(peak, Math.abs(sumAt(harmonics, i / GRID)));
    // What the spectrum looks like. Tie-break: one line is 'single' even when it is odd (a sine is not a square).
    var kind = active.length === 0 ? 'none'
      : active.length === 1 ? 'single'
      : active.every(odd) ? 'odd'
      : 'mixed';
    return {
      count: count,
      sel: sel,
      harmonics: harmonics,
      active: active,
      kind: kind,
      peak: peak,
      // The plot scale of the sum: 1 unless the sum goes beyond ±1.
      scale: Math.max(1, peak)
    };
  }

  // ── the 3D scene (as the original's: the harmonics side by side, the sum in front, the spectrum at the side) ──
  // x: time 0 … 1; y: up; z: frequency lanes, harmonic 1 at the front. The sum plane is at z = FRONT, the spectrum
  // plane at x = SIDE. Plane height: y 0.25 … 0.75.
  var FRONT = 1.1, SIDE = 1.1, Y0 = 0.25, Y1 = 0.75, MID = 0.5;
  var LANE = 0.15;        // y per unit of amplitude on a harmonic's own lane
  var SUM = 0.2;          // y per unit of the sum, divided by the scale
  var BAR = 0.4;          // y per unit of amplitude on the spectrum, from the plane's bottom
  var BAR0 = Y0 + 0.04;

  /** The lane of harmonic n of count: its z. Harmonic 1 at the front (as the original). */
  function laneZ(n, count) { return 1 - (n - 0.5) / count; }

  /** The three views (the original's camera presets: theta 90, 20, 160 and phi 48, in half degrees). */
  var VIEWS = { '3d': { yaw: 45, pitch: 24 }, time: { yaw: 10, pitch: 24 }, freq: { yaw: 80, pitch: 24 } };
  var PITCH_MIN = -25, PITCH_MAX = 60;
  var CENTRE = [0.55, MID, 0.55];
  var DIST = 3, FOV = 25;   // the original's distance and field of view

  /** A camera orbiting the scene centre: yaw from the front (z) towards the side (x), pitch up, in degrees. */
  function camera(yaw, pitch) {
    var pt = clamp(pitch, PITCH_MIN, PITCH_MAX);
    var a = yaw * Math.PI / 180, b = pt * Math.PI / 180;
    // unit vector from the centre to the eye
    var back = [Math.sin(a) * Math.cos(b), Math.sin(b), Math.cos(a) * Math.cos(b)];
    var right = [Math.cos(a), 0, -Math.sin(a)];
    var up = [-Math.sin(a) * Math.sin(b), Math.cos(b), -Math.cos(a) * Math.sin(b)];
    var eye = [CENTRE[0] + DIST * back[0], CENTRE[1] + DIST * back[1], CENTRE[2] + DIST * back[2]];
    return { yaw: yaw, pitch: pt, eye: eye, back: back, right: right, up: up, f: 1 / Math.tan(FOV * Math.PI / 360) };
  }

  /** A point seen by the camera: x right, y up (in the image plane, before fitting), depth away from the eye. */
  function project(cam, p) {
    var d = [p[0] - cam.eye[0], p[1] - cam.eye[1], p[2] - cam.eye[2]];
    var depth = -(d[0] * cam.back[0] + d[1] * cam.back[1] + d[2] * cam.back[2]);
    var x = d[0] * cam.right[0] + d[1] * cam.right[1] + d[2] * cam.right[2];
    var y = d[0] * cam.up[0] + d[1] * cam.up[1] + d[2] * cam.up[2];
    return { x: cam.f * x / depth, y: cam.f * y / depth, depth: depth };
  }

  /** How squarely a plane faces the camera: |cos| of the angle between its normal and the view (1 = face on). */
  function facing(cam, normal) {
    return Math.abs(normal[0] * cam.back[0] + normal[1] * cam.back[1] + normal[2] * cam.back[2]);
  }

  /** The corners of the scene's box, for fitting the drawing to the stage at any angle. */
  function box() {
    var out = [];
    [0, SIDE].forEach(function (x) { [Y0, Y1].forEach(function (y) { [0, FRONT].forEach(function (zz) { out.push([x, y, zz]); }); }); });
    return out;
  }

  var logic = {
    MAX: MAX, COUNT_MIN: COUNT_MIN, PHASE_STEP: PHASE_STEP, PHASE_MAX: PHASE_MAX, AMP_STEP: AMP_STEP,
    FRONT: FRONT, SIDE: SIDE, Y0: Y0, Y1: Y1, MID: MID, LANE: LANE, SUM: SUM, BAR: BAR, BAR0: BAR0,
    VIEWS: VIEWS, PITCH_MIN: PITCH_MIN, PITCH_MAX: PITCH_MAX,
    defaults: defaults,
    presets: presets,
    waves: waves,
    aKey: aKey,
    pKey: pKey,
    initial: initial,
    component: component,
    sumAt: sumAt,
    curve: curve,
    laneZ: laneZ,
    camera: camera,
    project: project,
    facing: facing,
    box: box
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
