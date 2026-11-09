/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for yagi (SPEC.md): one driven half-wave-ish dipole, an optional reflector behind it and up to eight equal
   directors in front, all parallel, horizontal and side by side along a boom. Only the driven element is fed; the
   others carry currents induced by its field, found from the mutual impedances (induced EMF, mutual-impedance.js).
   Their sum gives the pattern, the gain, the front-to-back ratio and the feed impedance.
   The element factor is current-pattern.js (copied from antenna-array, catalogue §5.26 model 3); the induced currents
   are mutual-impedance.js, pure and promotable next to it.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The caches (mutual impedances by geometry, the
   gain by layout) are deterministic memos of pure functions.

   Geometry: the boom along x, forward (+x) towards the directors; every element along y, centred on the boom; z up.
   The horizontal plane (z = 0) is the E-plane, the vertical plane through the boom the H-plane. Azimuth φ from +x. */
(function (root) {
  'use strict';

  var node = typeof module === 'object' && module.exports;
  var CP = node ? require('./current-pattern.js') : root.SimdeckModels['current-pattern'];
  var MI = node ? require('./mutual-impedance.js') : root.SimdeckModels['mutual-impedance'];

  var D2R = Math.PI / 180;
  var TWO_PI = 2 * Math.PI;
  var GRID = 0.25;                         // degrees: the azimuth grid for the main beam
  var TOL = 1e-9;                          // relative: equal strongest directions
  var NULL_REL = 1e-6;                     // field relative to the main beam below which the back is a null
  var T_STEP = 5, KEY_STEP = 15;           // time: the play step and the → / ← step, degrees of ωt
  var MAX_DIRS = 8;
  var RANGES = {                           // [min, max, step, default]
    dirs: [0, MAX_DIRS, 1, 1],
    lr: [0.4, 0.6, 0.005, 0.5],
    sr: [0.05, 0.4, 0.01, 0.2],
    ld: [0.38, 0.55, 0.005, 0.445],
    sd: [0.05, 0.45, 0.01, 0.15],
    t: [0, 355, 5, 0]
  };
  var defaults = { refl: true, dirs: 1, lr: 0.5, sr: 0.2, ld: 0.445, sd: 0.15, t: 0 };
  var DRIVEN = 0.475;                      // λ: the driven element, just above resonance (0.4725 λ) for this wire
  var TOPS = [10, 15, 20];                 // the polar plots' outer ring in dBi; the centre is 30 dB below

  var D_DIPOLE = MI.ETA0 / (Math.PI * MI.selfImpedance(0.5)[0]);   // a half-wave dipole, η/(π·73.08) = 1.6409, 2.15 dBi; dBd is over this

  /** Params made safe (tie-breaks 1 and 2): clamped and on their grid; a non-number gives the default; time wraps
      round the period; refl is a boolean (true, 'true', '1', 1 are true; anything else false). */
  function norm(p) {
    p = p || {};
    var out = {};
    Object.keys(RANGES).forEach(function (k) {
      var r = RANGES[k], raw = p[k], v = Number(raw);
      if (!isFinite(v) || raw === null || raw === '' || typeof raw === 'boolean') v = r[3];
      if (k === 't') {
        v = Math.round(v / r[2]) * r[2];
        v = ((v % 360) + 360) % 360;
      } else {
        v = Math.min(r[1], Math.max(r[0], v));
        v = r[0] + Math.round((v - r[0]) / r[2] + 1e-9) * r[2];
        v = Math.min(r[1], v);
      }
      out[k] = Number(v.toFixed(3));
      if (out[k] === 0) out[k] = 0;        // no −0
    });
    var rf = p.refl;
    out.refl = rf === undefined ? defaults.refl : rf === true || rf === 'true' || rf === '1' || rf === 1;
    return out;
  }

  /** The elements in boom order: the reflector at −sr (when there is one), the driven element at 0, director k at
      k·sd. [{ role: 'R' | 'DE' | 'D', k, len, x }]; the driven element's index is `fed`. */
  function layout(p) {
    var els = [];
    if (p.refl) els.push({ role: 'R', k: 0, len: p.lr, x: -p.sr });
    els.push({ role: 'DE', k: 0, len: DRIVEN, x: 0 });
    for (var i = 1; i <= p.dirs; i++) els.push({ role: 'D', k: i, len: p.ld, x: Number((i * p.sd).toFixed(4)) });
    return { els: els, fed: p.refl ? 1 : 0 };
  }

  // ── mutual impedances by geometry, memoised (pure) ──
  var zMemo = {};
  function zOf(l1, l2, d) {
    var key = l1.toFixed(4) + '|' + l2.toFixed(4) + '|' + d.toFixed(4);
    if (!(key in zMemo)) zMemo[key] = MI.mutualImpedance(l1, l2, d);
    return zMemo[key];
  }

  /** The complex far field (common factors dropped) in the direction u = [ux, uy, uz] of elements along y at x with
      crest currents I: Σ I_i·F_i(u_y)·e^{jk·x_i·u_x}. */
  function fieldAt(els, I, u) {
    var re = 0, im = 0;
    for (var i = 0; i < els.length; i++) {
      var f = CP.elementFactor(els[i].len, u[1]), ph = TWO_PI * els[i].x * u[0];
      var c = Math.cos(ph), s = Math.sin(ph);
      re += f * (I[i][0] * c - I[i][1] * s);
      im += f * (I[i][0] * s + I[i][1] * c);
    }
    return [re, im];
  }
  function pow(els, I, u) { var e = fieldAt(els, I, u); return e[0] * e[0] + e[1] * e[1]; }
  /** A direction in the horizontal plane at azimuth phi, and in the vertical plane at azimuth az, elevation el. */
  function hDir(phi) { return [Math.cos(phi * D2R), Math.sin(phi * D2R), 0]; }
  function vDir(az, el) { return [Math.cos(el * D2R) * Math.cos(az * D2R), Math.cos(el * D2R) * Math.sin(az * D2R), Math.sin(el * D2R)]; }

  /** The main beam in the horizontal plane (tie-break 4): the largest |E|² on a GRID over 0 … 180° (the pattern is
      mirrored about the boom), refined by golden section within a step; equal ones (relative TOL) go to the smaller φ
      (forward first). 0° and 180° are taken as they are (the mirror makes them stationary). { phi, p2 }. */
  function mainBeam(els, I) {
    var n = Math.round(180 / GRID), best = null;
    for (var i = 0; i <= n; i++) {
      var v = pow(els, I, hDir(i * GRID));
      if (best === null || v > best.p2 * (1 + TOL)) best = { i: i, p2: v };
    }
    var phi = best.i * GRID, p2 = best.p2;
    if (best.i > 0 && best.i < n) {
      var lo = phi - GRID, hi = phi + GRID, g = (Math.sqrt(5) - 1) / 2;
      for (var k = 0; k < 60; k++) {
        var x1 = hi - g * (hi - lo), x2 = lo + g * (hi - lo);
        if (pow(els, I, hDir(x1)) >= pow(els, I, hDir(x2))) hi = x2; else lo = x1;
      }
      var r = (lo + hi) / 2, v2 = pow(els, I, hDir(r));
      if (v2 > p2) { phi = r; p2 = v2; }
    }
    return { phi: CP.snap(phi), p2: p2 };
  }

  /** The half-power angle from a beam on one side: walk out in steps of 0.25° to the first direction below half of top
      (a 1e-12 margin, so touching half is not falling below), then bisect. null when it never falls within 180°. */
  function halfSide(f, top) {
    var prev = 0, step = 0.25;
    for (var s = step; s <= 180 + 1e-9; s += step) {
      if (f(s) / top < 0.5 - 1e-12) {
        var lo = prev, hi = s;
        for (var i = 0; i < 50; i++) { var mid = (lo + hi) / 2; if (f(mid) / top >= 0.5 - 1e-12) lo = mid; else hi = mid; }
        return (lo + hi) / 2;
      }
      prev = s;
    }
    return null;
  }

  /** Half-power beamwidths of the beam at azimuth phi0 (tie-break 5): in the horizontal plane (E-plane), both ways in φ;
      in the vertical plane through the beam (H-plane, through the boom for a beam on the boom), up from the horizon
      and over (the pattern is the same below, so twice one side). null where it never falls to half. */
  function beamwidths(els, I, phi0, top) {
    var a = halfSide(function (s) { return pow(els, I, hDir(phi0 + s)); }, top);
    var b = halfSide(function (s) { return pow(els, I, hDir(phi0 - s)); }, top);
    var v = halfSide(function (s) { return pow(els, I, vDir(phi0, s)); }, top);
    return { e: a === null || b === null ? null : a + b, h: v === null ? null : 2 * v, eSides: a === null || b === null ? null : [a, b] };
  }

  /** Front-to-back from the back's power relative to the main lobe (tie-break 6): in dB, or a null (db null) when the
      back's field is below NULL_REL of the main lobe's. */
  function frontToBack(rel) {
    return rel < NULL_REL * NULL_REL ? { db: null, isNull: true } : { db: -10 * Math.log10(rel), isNull: false };
  }

  /** The core: currents, feed impedance, main beam and directivity of a layout (no read-backs). */
  function solveLayout(p) {
    var L = layout(p), r = MI.induced(L.els, L.fed, MI.RADIUS, zOf);
    // every current relative to the driven element's centre (feed) current, which becomes 1∠0
    var ref = r.centre[L.fed];
    r.crest = r.crest.map(function (c) { return MI.cdiv(c, ref); });
    r.centre = r.centre.map(function (c) { return MI.cdiv(c, ref); });
    var mb = mainBeam(L.els, r.crest);
    var rp = MI.powerResistance(r.Z, r.crest);
    var d = MI.ETA0 * mb.p2 / (Math.PI * rp);       // D = 4πU/P = η|E|²/(π·Re(IᴴZI)) (crest currents)
    return { L: L, r: r, mb: mb, rp: rp, d: d };
  }

  // ── the gain for a number of directors, the rest as set: memoised by layout (pure) ──
  var gMemo = {};
  function gainWith(p, dirs) {
    var q = Object.assign({}, p, { dirs: dirs, t: 0 });
    var key = [q.refl, q.dirs, q.lr, q.sr, q.ld, q.sd].join('|');
    if (!(key in gMemo)) gMemo[key] = 10 * Math.log10(solveLayout(q).d);
    return gMemo[key];
  }

  function wrap180(a) { a = ((a + 180) % 360 + 360) % 360 - 180; return a === -180 ? 180 : CP.snap(a); }

  /** The polar plots' outer ring (dBi) for a largest gain g: the smallest of TOPS at least 0.5 dB above it. */
  function plotTop(g) {
    for (var i = 0; i < TOPS.length; i++) if (TOPS[i] >= g + 0.5) return TOPS[i];
    return TOPS[TOPS.length - 1];
  }

  /** Everything the caption, the readout and the drawing need (SPEC.md §3–§5). */
  function initial(params) {
    var p = norm(Object.assign({}, defaults, params));
    var sol = solveLayout(p), L = sol.L, r = sol.r, fed = L.fed;
    var cur = r.centre.map(function (q) { return { amp: MI.cabs(q), phase: wrap180(Math.atan2(q[1], q[0]) / D2R) }; });
    // along two or more directors: each director's lag behind the one before, wrapped into (−180°, 180°]; their mean,
    // and whether every one is a lag (> 0): only then do the currents follow a wave running forwards (tie-break 7)
    var dirStep = null, dirSteady = false, first = fed + 1;
    if (p.dirs >= 2) {
      var sum = 0;
      dirSteady = true;
      for (var j = first; j < cur.length - 1; j++) {
        var lagj = -wrap180(cur[j + 1].phase - cur[j].phase);
        if (lagj === -180) lagj = 180;
        if (!(lagj > 0)) dirSteady = false;
        sum += lagj;
      }
      dirStep = sum / (cur.length - 1 - first);
    }
    // each element's own reactance at its centre, alone: + is longer than resonant (inductive), − shorter (capacitive)
    var selfX = L.els.map(function (e) { var z = MI.selfImpedance(e.len); return z[1] / Math.pow(Math.sin(Math.PI * e.len), 2); });
    var alone = MI.selfImpedance(DRIVEN), sl = Math.pow(Math.sin(Math.PI * DRIVEN), 2);
    var main = sol.mb.phi, top = sol.mb.p2;
    var kind = main < 1e-6 ? 'fwd' : main > 180 - 1e-6 ? 'back' : 'side';
    var single = L.els.length === 1;
    var fb = single ? { db: null, isNull: false } : frontToBack(pow(L.els, r.crest, hDir(main + 180)) / top);
    var bw = beamwidths(L.els, r.crest, main, top);
    var series = [];
    for (var n = 0; n <= MAX_DIRS; n++) series.push(gainWith(p, n));
    var dbi = 10 * Math.log10(sol.d);
    return {
      p: p, els: L.els, fed: fed, single: single, kind: kind,
      crest: r.crest, cur: cur, selfX: selfX, dirStep: dirStep, dirSteady: dirSteady,
      zin: r.zin, zAlone: [alone[0] / sl, alone[1] / sl],
      main: main, emax2: top, rPower: sol.rp,
      fbDb: fb.db, backNull: fb.isNull,
      bwE: bw.e, bwH: bw.h, bwSides: bw.eSides,
      d: sol.d, dbi: dbi, dbd: 10 * Math.log10(sol.d / D_DIPOLE),
      series: series, boom: L.els[L.els.length - 1].x - L.els[0].x,
      top: plotTop(Math.max(dbi, 10 * Math.log10(D_DIPOLE)))
    };
  }

  /** The gain (dBi) of state st in the direction u: D·|E(u)|²/|E_main|². −Infinity in a null. */
  function gainAt(st, u) {
    var v = pow(st.els, st.crest, u) / st.emax2;
    return v > 0 ? 10 * Math.log10(st.d * v) : -Infinity;
  }

  /** Presets (the page gives them names), each with what the lecturer should see (SPEC.md §6). */
  var presets = [
    { id: 'dipole', params: { refl: false, dirs: 0, lr: 0.5, sr: 0.2, ld: 0.445, sd: 0.15, t: 0 } },
    { id: 'reflector', params: { refl: true, dirs: 0, lr: 0.5, sr: 0.15, ld: 0.445, sd: 0.15, t: 0 } },
    { id: 'director', params: { refl: false, dirs: 1, lr: 0.5, sr: 0.2, ld: 0.45, sd: 0.1, t: 0 } },
    { id: 'three', params: { refl: true, dirs: 1, lr: 0.5, sr: 0.2, ld: 0.445, sd: 0.15, t: 0 } },
    { id: 'long', params: { refl: true, dirs: 6, lr: 0.5, sr: 0.2, ld: 0.43, sd: 0.3, t: 0 } },
    { id: 'toolong', params: { refl: false, dirs: 1, lr: 0.5, sr: 0.2, ld: 0.52, sd: 0.1, t: 0 } }
  ];

  var logic = {
    RANGES: RANGES, DRIVEN: DRIVEN, TOPS: TOPS, GRID: GRID, MAX_DIRS: MAX_DIRS, T_STEP: T_STEP, KEY_STEP: KEY_STEP, D_DIPOLE: D_DIPOLE,
    defaults: defaults, presets: presets, norm: norm, initial: initial, layout: layout,
    fieldAt: fieldAt, pow: pow, hDir: hDir, vDir: vDir, mainBeam: mainBeam, halfSide: halfSide, frontToBack: frontToBack, beamwidths: beamwidths,
    solveLayout: solveLayout, gainWith: gainWith, gainAt: gainAt, plotTop: plotTop, wrap180: wrap180, zOf: zOf,
    CP: CP, MI: MI
  };

  if (node) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
