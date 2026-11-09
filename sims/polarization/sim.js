/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for polarization: the wave carries the antenna's direction (SPEC.md).
   The vector physics is polarization.js (pure, promotable: catalogue §5.26, model 4). This file adds the page's
   situation: two identical short dipoles A and B 1 km apart, A at the origin, B on an arc in the vertical plane x–z;
   the params (A's rotation, B's place on the arc, B's rotation about the line of sight, which one sends, time), the
   readout in degrees, per cent, dB, V/m and V, the wave along the path, A's pattern in that plane, the presets.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   Frame: x along the ground towards B when B is level with A (broadside), y across, z up. Angles in degrees. */
(function (root) {
  'use strict';

  var PZ = typeof module === 'object' && module.exports
    ? require('./polarization.js')
    : root.SimdeckModels['polarization'];

  var D2R = Math.PI / 180;
  var C0 = 299792458;                       // m/s
  var ETA0 = 376.730313668;                 // Ω, the wave impedance of free space, μ0·c (CODATA 2018)
  var FREQ = 10e6;                          // Hz
  var LAMBDA = C0 / FREQ;                   // m, 29.98 m
  var LEN = LAMBDA / 50;                    // m: both dipoles are short, λ/50 (0.60 m), uniform current (Hertzian)
  var I0 = 1;                               // A: the sending dipole's current (peak)
  var DIST = 1000;                          // m: A to B (kr = 210: the far field)
  var E_MAX = ETA0 * I0 * LEN / (2 * LAMBDA * DIST);   // V/m: |E_θ| broadside, η·I·l/(2λr) (Balanis 4-26a)
  var V_MAX = E_MAX * LEN;                  // V: open-circuit voltage of a matched receiving dipole, |l·E|
  var WAVES = 3;                            // wavelengths drawn along the path (the drawing is not to scale)
  var T_STEP = 5, KEY_STEP = 15;            // degrees: the time slider's step, → / ← in time
  var ANG_STEP = 5;                         // degrees: the angle sliders' step
  var U2 = [0, 1, 0];                       // "right" as B sees A: across the path, the same at every place on the arc

  /** Params: a = A's rotation from vertical towards y (0 … 180°); el = B's elevation seen from A (0° level with A,
      90° straight above); b = B's rotation about the line of sight (0° in the vertical plane of the path, 90° across);
      from = 'a' | 'b', the one that sends; t = phase ωt (0 … 355°). */
  var defaults = { a: 0, el: 0, b: 0, from: 'a', t: 0 };

  function snap(x) { return PZ.snap(x); }
  function cosd(x) { return snap(Math.cos(x * D2R)); }
  function sind(x) { return snap(Math.sin(x * D2R)); }
  function num(x, lo, hi, d) { x = Number(x); return isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d; }
  /** An angle of a line (not an arrow) in [0, 180): 180 is 0 (tie-break, SPEC.md §1). */
  function line180(x) { x = snap(x); var v = ((x % 180) + 180) % 180; return v >= 180 - 1e-9 ? 0 : snap(v); }

  /** Params made safe: a and b clamped to 0 … 180, el to 0 … 90; anything but 'b' sends from A; t wraps into [0, 360). */
  function norm(p) {
    p = p || {};
    var t = Number(p.t);
    t = isFinite(t) ? ((t % 360) + 360) % 360 : defaults.t;
    if (t >= 360) t = 0;
    return {
      a: num(p.a, 0, 180, defaults.a),
      el: num(p.el, 0, 90, defaults.el),
      b: num(p.b, 0, 180, defaults.b),
      from: p.from === 'b' ? 'b' : 'a',
      t: t
    };
  }

  /** The direction from A to B (unit), and "up" in B's view of A (u1: in the vertical plane of the path, at right
      angles to it, upwards at el = 0). "Right" (u2) is +y everywhere on the arc. */
  function rhat(el) { return [cosd(el), 0, sind(el)]; }
  function u1(el) { return [snap(-sind(el)), 0, cosd(el)]; }
  /** A's wire: vertical at a = 0, turned about x towards +y (across the path) as a grows. */
  function dirA(a) { return [0, sind(a), cosd(a)]; }
  /** B's wire: always across the line of sight, at angle b from u1 towards u2. */
  function dirB(b, el) { var u = u1(el); return [snap(cosd(b) * u[0]), snap(sind(b)), snap(cosd(b) * u[2])]; }

  /** The acute angle between two lines at angles x and y (degrees), 0 … 90; exactly 90 is 90 from either side (tie-break;
      180 − 90 is 90 too, so the branch only makes the rule visible). */
  function between(x, y) { var d = line180(x - y); return d <= 90 ? d : snap(180 - d); }

  /** dB of a power ratio; null for zero power (−∞ is not JSON). */
  function db(p) { return p > 0 ? 10 * Math.log10(p) : null; }

  /** The link at these params (SPEC.md §3). */
  function link(p) {
    p = norm(p);
    var A = dirA(p.a), r = rhat(p.el), U = u1(p.el), B = dirB(p.b, p.el);
    var w = PZ.dipoleWave(A, r);                       // A's field towards B: amp = sin θ, e in the plane of A and r
    var gain = w.amp;
    var cosT = Math.min(1, Math.abs(PZ.dot3(A, r)));
    var theta = snap(Math.acos(cosT) / D2R);           // angle between A's wire and the line of sight, 0 … 90
    var tau = gain > 0 ? line180(Math.atan2(PZ.dot3(A, U2), PZ.dot3(A, U)) / D2R) : null;
    var v = snap(PZ.dot3(A, B));                       // received voltage over the best case, signed (A·B: B ⊥ r)
    var mis = tau === null ? null : between(p.b, tau);
    var plf = mis === null ? null : PZ.plf(w.e, PZ.linear(B));
    var pw = snap(v * v);
    return {
      gain: gain, theta: theta, tau: tau, mis: mis, plf: plf, plfDb: plf === null ? null : db(plf),
      v: v, p: pw, pDb: db(pw), anti: v < 0, endOn: gain === 0, crossed: gain > 0 && mis === 90,
      // the wave on the path: from A it has A's pattern amplitude and polarization; from B (always broadside to the path)
      // full amplitude along B's wire. The angle is in B's view, from up (u1) towards right (u2).
      waveAmp: p.from === 'a' ? gain : 1,
      wavePol: p.from === 'a' ? tau : line180(p.b),
      E: (p.from === 'a' ? gain : 1) * E_MAX,          // V/m at the receiving dipole (amplitude)
      V: Math.abs(v) * V_MAX                           // V, open circuit (amplitude): the same either way (reciprocity)
    };
  }

  /** The received voltage at phase t over the best case's amplitude: v·cos ωt (the phase reference is the receiver). */
  function vNow(v, t) { return snap(v * cosd(t)); }

  /** The wave on the path at the fraction f of the way from the sender (0) to the receiver (1), phase t: the field
      there over its amplitude, cos(ωt + 2π·N·(1 − f)) with N wavelengths drawn. A crest moves towards f = 1 as t grows. */
  function waveAt(f, t) { return snap(Math.cos(t * D2R + 2 * Math.PI * WAVES * (1 - f))); }

  /** A's pattern in the vertical plane x–z (the plane B moves in): |E| over its maximum for directions at angle phi
      from +x towards +z, every step degrees round the circle. sin θ = √(1 − (cos a · sin phi)²). */
  function patternXZ(a, step) {
    step = step || 3;
    var A = dirA(a), out = [];
    for (var phi = 0; phi <= 360; phi += step) out.push({ phi: phi, amp: PZ.dipoleWave(A, rhat(phi)).amp });
    return out;
  }

  /** The received voltage and power (over the best case) as B turns from 0 to 180°, A and B's place fixed. */
  function sweepB(a, el, step) {
    step = step || 2;
    var A = dirA(a), out = [];
    for (var b = 0; b <= 180; b += step) { var v = snap(PZ.dot3(A, dirB(b, el))); out.push({ b: b, v: v, p: snap(v * v) }); }
    return out;
  }

  /** State for the page: everything the caption and the readout need (JSON-safe). */
  function initial(params) {
    var p = norm(Object.assign({}, defaults, params));
    var l = link(p);
    l.a = p.a; l.el = p.el; l.b = p.b; l.from = p.from; l.t = p.t;
    l.vNow = vNow(l.v, p.t);
    return l;
  }

  /** Presets (the page gives them names): each with what the lecturer should see (SPEC.md §5). */
  var presets = [
    { id: 'matched', params: { a: 0, el: 0, b: 0, from: 'a', t: 0 } },
    { id: 'slant', params: { a: 0, el: 0, b: 45, from: 'a', t: 0 } },
    { id: 'crossed', params: { a: 0, el: 0, b: 90, from: 'a', t: 0 } },
    { id: 'endon', params: { a: 0, el: 90, b: 0, from: 'a', t: 0 } },
    { id: 'up', params: { a: 90, el: 90, b: 90, from: 'a', t: 0 } },
    { id: 'recip', params: { a: 30, el: 40, b: 60, from: 'b', t: 0 } }
  ];

  var logic = {
    C0: C0, ETA0: ETA0, FREQ: FREQ, LAMBDA: LAMBDA, LEN: LEN, I0: I0, DIST: DIST, E_MAX: E_MAX, V_MAX: V_MAX,
    WAVES: WAVES, T_STEP: T_STEP, KEY_STEP: KEY_STEP, ANG_STEP: ANG_STEP, U2: U2,
    defaults: defaults, presets: presets, norm: norm, initial: initial, link: link, vNow: vNow, waveAt: waveAt,
    patternXZ: patternXZ, sweepB: sweepB, rhat: rhat, u1: u1, dirA: dirA, dirB: dirB, between: between,
    line180: line180, db: db, PZ: PZ
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
