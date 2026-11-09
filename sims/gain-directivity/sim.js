/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for gain-directivity (SPEC.md): a pattern shaped by hand (beamwidths, a back lobe, side lobes), its directivity
   by integration over the sphere, gain with an efficiency, dBi and dBd, and the transmitter's side to EIRP and ERP.
   The half-wave dipole (the dBd reference) comes from current-pattern.js (copied from dipole-length, catalogue §5.26
   model 3); the dB chain is link-budget.js (model 5). Both pure and promotable.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var node = typeof module === 'object' && module.exports;
  var CP = node ? require('./current-pattern.js') : root.SimdeckModels['current-pattern'];
  var LB = node ? require('./link-budget.js') : root.SimdeckModels['link-budget'];

  var D2R = Math.PI / 180;
  var LN2 = Math.LN2;
  var GRID = 0.05;                       // degrees: the sampling step for integrals and read-backs
  var PTX = [1, 10, 100, 1000];          // W
  var SCALES = ['field', 'power', 'db'];
  var RANGES = {                         // [min, max, step, default]
    hbw: [20, 360, 5, 360],
    vbw: [10, 180, 5, 180],
    fb: [0, 40, 1, 20],
    sll: [-40, -10, 1, -20],
    eff: [5, 100, 5, 100],
    cable: [0, 10, 0.5, 0]
  };
  var LADDER = [2, 3, 5, 10, 20, 50, 100, 200];   // linear plot tops, power over isotropic

  var defaults = { hbw: 360, vbw: 180, fb: 20, sll: -20, eff: 100, cable: 0, ptx: 100, scale: 'field' };

  /** Params made safe (tie-break 1): ranges clamped and put on their grid; ptx and scale from their lists. */
  function norm(p) {
    p = p || {};
    var out = {};
    Object.keys(RANGES).forEach(function (k) {
      var r = RANGES[k], v = Number(p[k]);
      if (!isFinite(v) || p[k] === null || p[k] === '' || typeof p[k] === 'boolean') v = r[3];
      v = Math.min(r[1], Math.max(r[0], v));
      v = r[0] + Math.round((v - r[0]) / r[2]) * r[2];
      out[k] = Number(Math.min(r[1], v).toFixed(2));
    });
    var w = Number(p.ptx);
    out.ptx = PTX.indexOf(w) >= 0 && p.ptx !== null && p.ptx !== '' && typeof p.ptx !== 'boolean' ? w : defaults.ptx;
    out.scale = SCALES.indexOf(p.scale) >= 0 ? p.scale : defaults.scale;
    return out;
  }

  /** κ of a von Mises lobe exp(κ(cos φ − 1)) whose half-power width is bw degrees; 0 (a circle) at 360 and above. */
  function kappaOf(bw) { return bw >= 360 ? 0 : LN2 / (1 - Math.cos(bw / 2 * D2R)); }
  /** m of cos^m ε whose half-power width is bw degrees; 0 (no squeeze) at 180 and above. */
  function mOf(bw) { return bw >= 180 ? 0 : LN2 / -Math.log(Math.cos(bw / 2 * D2R)); }
  /** A lobe of width κ centred on 0, at angle phi (degrees). */
  function lobe(phi, k) { return k === 0 ? 1 : Math.exp(k * (Math.cos(phi * D2R) - 1)); }

  /** The shape's numbers from the params (SPEC.md §2). */
  function shape(p) {
    p = norm(p);
    return {
      kH: kappaOf(p.hbw), b: Math.pow(10, -p.fb / 10),
      kS: kappaOf(p.hbw / 2), phiS: Math.min(2 * p.hbw, 135), s: Math.pow(10, p.sll / 10),
      m: mOf(p.vbw)
    };
  }

  /** The horizontal factor A(φ), φ in degrees from the front: the largest of the main lobe, the back lobe and the two
      side lobes (tie-break 3: never above 1, and 1 at the front). */
  function horiz(sh, phi) {
    return Math.max(lobe(phi, sh.kH), sh.b * lobe(phi - 180, sh.kH),
      sh.s * lobe(phi - sh.phiS, sh.kS), sh.s * lobe(phi + sh.phiS, sh.kS));
  }

  /** The vertical factor E(ε) = cos^m ε, ε in degrees from the horizon; 1 everywhere when m = 0, 0 at the poles else. */
  function vert(sh, eps) {
    if (sh.m === 0) return 1;
    var c = Math.cos(eps * D2R);
    return c <= 1e-12 ? 0 : Math.pow(c, sh.m);
  }

  /** Simpson's rule of f over [a, b] (degrees) with n intervals (even); the result per radian. */
  function simpson(f, a, b, n) {
    if (n % 2) n += 1;
    var h = (b - a) / n, sum = 0;
    for (var i = 0; i <= n; i++) sum += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * f(a + i * h);
    return sum * h / 3 * D2R;
  }

  /** I_A = ∫ A(φ) dφ over the circle (A is even: twice 0 … 180°). */
  function integralA(sh) { return 2 * simpson(function (phi) { return horiz(sh, phi); }, 0, 180, 180 / GRID); }
  /** I_E = ∫ cos^m ε · cos ε dε over −90 … 90° (even: twice 0 … 90°). */
  function integralE(sh) { return 2 * simpson(function (e) { return vert(sh, e) * Math.cos(e * D2R); }, 0, 90, 90 / GRID); }

  /** Closed forms (SPEC.md §2), for the tests: one von Mises lobe 2π·I₀(κ)·e^{−κ} (series), and √π·Γ((m+2)/2)/Γ((m+3)/2). */
  function besselI0e(k) {
    var term = 1, sum = 1, q = k * k / 4;
    for (var j = 1; j < 400; j++) { term *= q / (j * j); sum += term; if (term < sum * 1e-17) break; }
    return sum * Math.exp(-k);
  }
  function lgamma(x) {               // Lanczos (g = 7, n = 9), enough for the checks
    var c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
      12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
    x -= 1;
    var a = c[0], t = x + 7.5;
    for (var i = 1; i < 9; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  function closedA(k) { return 2 * Math.PI * besselI0e(k); }
  function closedE(m) { return Math.sqrt(Math.PI) * Math.exp(lgamma((m + 2) / 2) - lgamma((m + 3) / 2)); }

  /** The angle in [lo, hi] (degrees) where f crosses half, by bisection; f(lo) ≥ ½ > f(hi). */
  function halfPoint(f, lo, hi) {
    for (var i = 0; i < 50; i++) { var mid = (lo + hi) / 2; if (f(mid) >= 0.5) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  /** Full half-power width of a pattern f (1 at 0, even) walked out over 0 … end degrees; null if it never falls to
      half (tie-break 4). */
  function beamwidth(f, end) {
    var prev = 0;
    for (var a = GRID; a <= end + 1e-9; a += GRID) {
      if (f(a) < 0.5) return 2 * halfPoint(f, prev, a);
      prev = a;
    }
    return null;
  }

  /** The strongest side lobe strictly between 0 and 180° (tie-break 5): { db, at } or null. */
  function sideLobe(sh) {
    var n = Math.round(180 / GRID), best = null, at = null;
    var a0 = horiz(sh, 0), a1 = horiz(sh, GRID);
    for (var i = 1; i < n; i++) {
      var a2 = horiz(sh, (i + 1) * GRID);
      if (a1 > a0 * (1 + 1e-12) && a1 >= a2 && (best === null || a1 > best)) { best = a1; at = i * GRID; }
      a0 = a1; a1 = a2;
    }
    return best === null ? null : { db: LB.db(best), at: Number(at.toFixed(2)) };
  }

  // The half-wave dipole, the dBd reference (current-pattern.js).
  var DIP = CP.directivity(0.5);
  var D_DIPOLE = DIP.d;                  // 1.6409
  var DBD = LB.db(D_DIPOLE);             // 2.1509 dB
  /** The half-wave dipole's (vertical) directive gain at elevation ε: 2·F(θ)²/∫F² sin θ dθ, θ = 90° − ε. */
  function dipoleAt(eps) {
    var f = CP.elementFactor(0.5, Math.cos((90 - eps) * D2R));
    return 2 * f * f / DIP.integral;
  }

  /** Directivity of a shape: 4π / (I_A·I_E) (U_max = 1 at the front). */
  function directivity(sh) { return 4 * Math.PI / (integralA(sh) * integralE(sh)); }

  /** The linear plot's top (power over isotropic) and the dB plot's top (dBi) for a largest value x. */
  function plotTop(x) {
    for (var i = 0; i < LADDER.length; i++) if (LADDER[i] >= x * 1.02) return LADDER[i];
    return LADDER[LADDER.length - 1];
  }
  function dbTop(x) { return 5 * Math.ceil((LB.db(x) + 0.5) / 5); }

  /** Everything the caption, the readout and the drawing need (SPEC.md §3–§6). */
  function initial(params) {
    var p = norm(Object.assign({}, defaults, params));
    var sh = shape(p);
    var iA = integralA(sh), iE = integralE(sh);
    var d = 4 * Math.PI / (iA * iE);
    var eff = p.eff / 100;
    var tx = LB.transmit(p.ptx, p.cable, d, eff, D_DIPOLE);
    var hbwRead = beamwidth(function (a) { return horiz(sh, a); }, 180);
    var vbwRead = beamwidth(function (e) { return vert(sh, e); }, 90);
    var back = horiz(sh, 180);
    var side = sideLobe(sh);
    var omni = p.hbw === 360;
    // iso / omni (all round); broad: a front, but no direction falls to half (tie-break 4); bidir: fb 0 with a real
    // main lobe; beam: the rest
    var kind = omni ? (p.vbw === 180 ? 'iso' : 'omni') : hbwRead === null ? 'broad' : p.fb === 0 ? 'bidir' : 'beam';
    var big = Math.max(d, D_DIPOLE);
    return {
      p: p, kind: kind, omni: omni,
      iA: iA, iE: iE, d: d, dbi: LB.db(d), dbd: LB.dbdOf(LB.db(d), D_DIPOLE),
      dDipole: D_DIPOLE, dbdOffset: DBD,
      eff: eff, g: tx.g, gDbi: tx.gDbi, gDbd: tx.gDbd, effDb: tx.effDb,
      hbwRead: hbwRead, vbwRead: vbwRead,
      fbRead: LB.db(horiz(sh, 0) / back),                 // 0 for an omni pattern
      fbLimited: !omni && back > sh.b * (1 + 1e-9),       // the main lobe's own back is above the set back lobe
      fbTail: !omni && back > sh.b * (1 + 1e-9) && p.fb - LB.db(1 / back) >= 3,   // … by 3 dB or more: worth saying
      side: side,
      tx: tx,
      lossy: eff < 1, belowIso: tx.g < 1 - 1e-9,          // the integral's rounding (D = 1 − 1e-15) is not a loss
      top: plotTop(big), topDb: dbTop(big)
    };
  }

  /** Presets (the page gives them names), each with what the lecturer should see (SPEC.md §5). */
  var presets = [
    { id: 'iso', params: { hbw: 360, vbw: 180, fb: 20, sll: -20, eff: 100, cable: 0, ptx: 100, scale: 'field' } },
    { id: 'collinear', params: { hbw: 360, vbw: 40, fb: 20, sll: -20, eff: 100, cable: 0, ptx: 100, scale: 'field' } },
    { id: 'beam', params: { hbw: 65, vbw: 100, fb: 15, sll: -15, eff: 100, cable: 1, ptx: 100, scale: 'db' } },
    { id: 'whip', params: { hbw: 360, vbw: 90, fb: 20, sll: -20, eff: 10, cable: 0, ptx: 100, scale: 'field' } },
    { id: 'dish', params: { hbw: 20, vbw: 20, fb: 30, sll: -25, eff: 100, cable: 2, ptx: 10, scale: 'db' } }
  ];

  var logic = {
    PTX: PTX, SCALES: SCALES, RANGES: RANGES, LADDER: LADDER, GRID: GRID, D_DIPOLE: D_DIPOLE, DBD: DBD,
    defaults: defaults, presets: presets, norm: norm, initial: initial,
    kappaOf: kappaOf, mOf: mOf, lobe: lobe, shape: shape, horiz: horiz, vert: vert, simpson: simpson,
    integralA: integralA, integralE: integralE, closedA: closedA, closedE: closedE, besselI0e: besselI0e,
    beamwidth: beamwidth, sideLobe: sideLobe, directivity: directivity, dipoleAt: dipoleAt, plotTop: plotTop, dbTop: dbTop,
    CP: CP, LB: LB
  };

  if (node) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
