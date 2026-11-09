/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for polarization-mismatch: different antennas at each end, the polarization loss factor (SPEC.md).
   The vector physics is polarization.js (copied from sims/polarization, catalogue §5.26 model 4, with additive
   functions). This file adds the page's situation: an antenna at each end (from a list, turned about the path), the
   path (direct, one bounce off a conductor, through the ionosphere with Faraday rotation), time, the readout and the
   presets. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   Frame: x along the path from Tx to Rx, y across, z up. The view is from behind the wave (from Tx towards Rx):
   right h = −y, up v = z. Angles in degrees, counterclockwise in the view (from right towards up). */
(function (root) {
  'use strict';

  var PZ = typeof module === 'object' && module.exports
    ? require('./polarization.js')
    : root.SimdeckModels['polarization'];

  var D2R = Math.PI / 180;
  var WAVES = 3;                            // wavelengths drawn along the path (not to scale)
  var T_STEP = 5, KEY_STEP = 15;            // degrees: the time slider's step, → / ← in time
  var ANG_STEP = 5;                         // degrees: rotation, phase and Ω sliders
  var BETA = 30;                            // degrees: the grazing angle of the bounce path (the drawing's; any works)
  var IONO = [0.3, 0.7];                    // the stretch of the path inside the ionosphere (fractions)
  var LIN_S3 = 1e-12;                       // |s3| below this: a line; above 1 − this: a circle (SPEC §1.4)
  var ZERO = 1e-12, ONE = 1e-9;             // PLF classes (SPEC §1.5)

  var TYPES = ['v', 'h', 's', 'r', 'l', 'loop'];
  var PATHS = ['direct', 'bounce', 'iono'];
  var BASE = { v: 90, h: 0, s: 45, loop: 0, r: 0, l: 0 };   // base tilt; for r, l the first dipole's
  var SENSE = { r: 1, l: -1 };

  var defaults = { tx: 'v', txRot: 0, amp: 100, ph: 90, rx: 'v', rxRot: 0, path: 'direct', om: 0, t: 0 };

  function snap(x) { return PZ.snap(x); }
  function cosd(x) { return snap(Math.cos(x * D2R)); }
  function sind(x) { return snap(Math.sin(x * D2R)); }
  function num(x, lo, hi, d) { if (x === null || x === '' || typeof x === 'boolean') return d; x = Number(x); return isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d; }
  function wrap(x, d) { if (x === null || x === '' || typeof x === 'boolean') return d; x = Number(x); if (!isFinite(x)) return d; x = ((x % 360) + 360) % 360; return x >= 360 ? 0 : x; }
  /** An angle of a line in [0, 180): 180 is 0 (SPEC §1.3). */
  function line180(x) { x = snap(x); var v = ((x % 180) + 180) % 180; return v >= 180 - 1e-9 ? 0 : snap(v); }
  function isCirc(type) { return type === 'r' || type === 'l'; }

  /** Params made safe (SPEC §1). */
  function norm(p) {
    p = p || {};
    return {
      tx: TYPES.indexOf(p.tx) >= 0 ? p.tx : defaults.tx,
      txRot: num(p.txRot, 0, 180, defaults.txRot),
      amp: num(p.amp, 0, 100, defaults.amp),
      ph: num(p.ph, 0, 180, defaults.ph),
      rx: TYPES.indexOf(p.rx) >= 0 ? p.rx : defaults.rx,
      rxRot: num(p.rxRot, 0, 180, defaults.rxRot),
      path: PATHS.indexOf(p.path) >= 0 ? p.path : defaults.path,
      om: wrap(p.om, defaults.om),
      t: wrap(p.t, defaults.t)
    };
  }

  // ── frames: each leg's view from behind the wave ──
  var H = [0, -1, 0];                                        // right in every view (across the plane of the path)
  /** The direction of travel and "up" (at right angles to it, in the vertical plane) on leg 1 (Tx side) or 2 (Rx side). */
  function leg(path, n) {
    if (path !== 'bounce') return { k: [1, 0, 0], v: [0, 0, 1] };
    var c = cosd(BETA), s = sind(BETA), d = n === 1 ? -1 : 1;  // leg 1 goes down to the surface, leg 2 back up
    return { k: [c, 0, d * s], v: [snap(-d * s), 0, c] };
  }
  /** A 2-D complex vector [e_h, e_v] of a view as a 3-D one, and back. */
  function to3(e, fr) { return [0, 1, 2].map(function (i) { return [snap(e[0][0] * H[i] + e[1][0] * fr.v[i]), snap(e[0][1] * H[i] + e[1][1] * fr.v[i])]; }); }
  function to2(e, fr) { return [PZ.projection(e, PZ.linear(H)), PZ.projection(e, PZ.linear(fr.v))]; }
  function c2(re, im) { return [snap(re), snap(im)]; }
  function unit2(e) {
    var n = Math.sqrt(e[0][0] * e[0][0] + e[0][1] * e[0][1] + e[1][0] * e[1][0] + e[1][1] * e[1][1]);
    return n < ZERO ? null : [c2(e[0][0] / n, e[0][1] / n), c2(e[1][0] / n, e[1][1] / n)];
  }

  /** A line at tilt τ in the view. */
  function lin(tau) { return [c2(cosd(tau), 0), c2(sind(tau), 0)]; }
  /** Crossed dipoles: dipole 1 at rho, dipole 2 at rho + 90 with amplitude a and phase sgn·ph; normalized (SPEC §3.1). */
  function crossed(rho, a, ph, sgn) {
    var u1 = [cosd(rho), sind(rho)], u2 = [cosd(rho + 90), sind(rho + 90)];
    var cr = a * cosd(sgn * ph), ci = a * sind(sgn * ph);
    return unit2([c2(u1[0] + cr * u2[0], ci * u2[0]), c2(u1[1] + cr * u2[1], ci * u2[1])]);
  }

  /** The wave Tx sends, in the view (unit 2-D complex vector). */
  function txVec(p) {
    p = norm(p);
    if (isCirc(p.tx)) return crossed(BASE[p.tx] + p.txRot, p.amp / 100, p.ph, SENSE[p.tx]);
    return lin(BASE[p.tx] + p.txRot);
  }
  /** The wave Rx takes in full, in the view of the arriving wave (an ideal circle for r and l). */
  function rxVec(p, rot) {
    p = norm(p);
    var r = rot === undefined ? p.rxRot : rot;
    if (isCirc(p.rx)) return crossed(BASE[p.rx] + r, 1, 90, SENSE[p.rx]);
    return lin(BASE[p.rx] + r);
  }

  /** What the path does to the wave, in 2-D view components (SPEC §3.6, §3.7). frac: how much of Ω (iono); bounce:
      mirrored in 3-D off the surface z = 0 and read in the leg-2 view. */
  function along(e, p, frac) {
    if (p.path === 'bounce') return to2(PZ.mirror(to3(e, leg('bounce', 1)), [0, 0, 1]), leg('bounce', 2));
    if (p.path === 'iono') {
      var f = frac === undefined ? 1 : frac;
      return to2(PZ.rotate(to3(e, leg('iono', 1)), [-1, 0, 0], p.om * f), leg('iono', 1));   // about −k: counterclockwise in the view
    }
    return e;
  }

  /** A polarization described (SPEC §1.4): kind 'lin' | 'circ' | 'ell', sense +1 / −1 / 0, tilt (null for a circle),
      axial ratio in dB (null for a line), the minor/major ratio q. The kind and q come from the Stokes s3 (exact 0 for
      real vectors), not from the ellipse's minor axis, which loses half its digits to rounding near a line. */
  function describe(e) {
    var fr = leg('direct', 1), e3 = to3(e, fr);
    var el = PZ.ellipse(e3, H, fr.v), s3 = Math.abs(PZ.stokes(e3, H, fr.v)[2]);
    var kind = s3 < LIN_S3 ? 'lin' : s3 > 1 - LIN_S3 ? 'circ' : 'ell';
    var q = kind === 'lin' ? 0 : kind === 'circ' ? 1 : s3 / (1 + Math.sqrt(1 - s3 * s3));   // tan ε, sin 2ε = |s3|
    return {
      // the sense from the sign of s3 (> 0: right-hand in this view), so kind and sense never disagree
      kind: kind, sense: kind === 'lin' ? 0 : PZ.stokes(e3, H, fr.v)[2] > 0 ? 1 : -1,
      tilt: kind === 'circ' ? null : line180(el.tilt),
      arDb: kind === 'lin' ? null : kind === 'circ' ? 0 : snap(20 * Math.log10(1 / q)),
      ratio: q
    };
  }

  /** V = ê_w·conj(ê_r) as a complex number; |V|² is the PLF (SPEC §2). */
  function voltage(w, r) { var fr = leg('direct', 1); return PZ.projection(to3(w, fr), PZ.conj(to3(r, fr))); }
  function plfOf(w, r) { var V = voltage(w, r); return snap(V[0] * V[0] + V[1] * V[1]); }
  function db(p) { return p > 0 ? 10 * Math.log10(p) : null; }

  /** The class of a link (SPEC §1.5). */
  function classify(plf, arr, rx) {
    if (plf < ZERO) return 'crossed';
    if (plf > 1 - ONE) return 'matched';
    if ((arr.kind === 'lin' && rx.kind === 'circ') || (arr.kind === 'circ' && rx.kind === 'lin')) return 'lincirc';
    return 'partial';
  }

  /** The link at these params. */
  function link(p) {
    p = norm(p);
    var eT = txVec(p), eA = along(eT, p), eR = rxVec(p);
    var V = voltage(eA, eR), plf = snap(V[0] * V[0] + V[1] * V[1]);
    if (plf > 1 - 1e-12) plf = 1;
    var tx = describe(eT), arr = describe(eA), rx = describe(eR);
    return {
      eTx: eT, eArr: eA, eRx: eR, txPol: tx, arrPol: arr, rxPol: rx,
      V: V, plf: plf, plfDb: db(plf), volt: snap(Math.sqrt(plf)),
      kind: classify(plf, arr, rx),
      flipped: tx.sense !== 0 && arr.sense === -tx.sense
    };
  }

  /** The real field at the fraction f of the path (0 Tx, 1 Rx), phase t: [h, v] in that point's leg view, and the leg
      (SPEC §3.8). */
  function fieldAt(p, f, t) {
    p = norm(p);
    var e = txVec(p), n = 1;
    if (p.path === 'bounce' && f >= 0.5) { e = along(e, p); n = 2; }
    else if (p.path === 'iono') e = along(e, p, Math.min(1, Math.max(0, (f - IONO[0]) / (IONO[1] - IONO[0]))));
    var phi = (t + 360 * WAVES * (1 - f)) * D2R, c = Math.cos(phi), s = Math.sin(phi);
    return { leg: n, h: snap(e[0][0] * c - e[0][1] * s), v: snap(e[1][0] * c - e[1][1] * s) };
  }
  /** The real field of a 2-D vector at phase t: [h, v]. */
  function instant2(e, t) { var c = cosd(t), s = sind(t); return [snap(e[0][0] * c - e[0][1] * s), snap(e[1][0] * c - e[1][1] * s)]; }
  /** The voltage now over the matched amplitude: Re(V·e^{jωt}). */
  function uNow(V, t) { return snap(V[0] * cosd(t) - V[1] * sind(t)); }

  /** The plot (SPEC §4): PLF against the Rx turn (0 … 180) or, on the ionospheric path, against Ω (0 … 360), with a
      comparison receiver there (right-hand circular, or vertical when the Rx is circular). */
  function sweep(p) {
    p = norm(p);
    var eT = txVec(p), out = { axis: p.path === 'iono' ? 'om' : 'rot', pts: [], alt: null, altRx: null };
    if (out.axis === 'rot') {
      var eA = along(eT, p);
      for (var r = 0; r <= 180; r += 2) { var q = plfOf(eA, rxVec(p, r)); out.pts.push({ x: r, plf: q, db: db(q) }); }
      return out;
    }
    out.altRx = isCirc(p.rx) ? 'v' : 'r';
    var eR = rxVec(p), eAlt = rxVec(Object.assign({}, p, { rx: out.altRx, rxRot: 0 }));
    out.alt = [];
    for (var o = 0; o <= 360; o += 3) {
      var w = along(eT, Object.assign({}, p, { om: o }), 1);
      var a = plfOf(w, eR), b = plfOf(w, eAlt);
      out.pts.push({ x: o, plf: a, db: db(a) });
      out.alt.push({ x: o, plf: b, db: db(b) });
    }
    return out;
  }

  /** State for the page: everything the caption and the readout need (JSON-safe). */
  function initial(params) {
    var p = norm(Object.assign({}, defaults, params));
    var l = link(p);
    Object.keys(p).forEach(function (k) { l[k] = p[k]; });
    l.uNow = uNow(l.V, p.t);
    l.eNow = instant2(l.eArr, p.t);
    l.eTxNow = instant2(l.eTx, p.t);
    return l;
  }

  /** Presets (the page gives them names): each with what the lecturer should see (SPEC.md §5). */
  var presets = [
    { id: 'vh', params: { tx: 'v', rx: 'h' } },
    { id: 'lincirc', params: { tx: 'v', rx: 'r' } },
    { id: 'rl', params: { tx: 'r', amp: 90, ph: 80, rx: 'l' } },
    { id: 'loop', params: { tx: 'v', rx: 'loop' } },
    { id: 'bounce', params: { tx: 'r', rx: 'r', path: 'bounce' } },
    { id: 'faraday', params: { tx: 'v', rx: 'v', path: 'iono', om: 60 } }
  ];

  var logic = {
    WAVES: WAVES, T_STEP: T_STEP, KEY_STEP: KEY_STEP, ANG_STEP: ANG_STEP, BETA: BETA, IONO: IONO, TYPES: TYPES,
    PATHS: PATHS, BASE: BASE, H: H,
    defaults: defaults, presets: presets, norm: norm, initial: initial, link: link, txVec: txVec, rxVec: rxVec,
    along: along, describe: describe, voltage: voltage, plfOf: plfOf, classify: classify, fieldAt: fieldAt,
    instant2: instant2, uNow: uNow, sweep: sweep, leg: leg, to3: to3, to2: to2, lin: lin, crossed: crossed,
    line180: line180, db: db, isCirc: isCirc, PZ: PZ
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
