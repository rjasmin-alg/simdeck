/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for antenna-array (SPEC.md): n identical vertical half-wave dipoles in a line, spacing d, each lagging the one
   before by lag degrees. Their fields add with a path difference and the feed phase: the array factor times the single
   dipole's pattern. Main beam, steering, grating lobes, side lobes, beamwidth, front-to-back and directivity.
   The element and the field sum are current-pattern.js (copied from dipole-length, catalogue §5.26 model 3); the array
   part is array-factor.js, pure and promotable next to it.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The one cache (mutual resistances by spacing) is
   a deterministic memo of a pure function. */
(function (root) {
  'use strict';

  var node = typeof module === 'object' && module.exports;
  var CP = node ? require('./current-pattern.js') : root.SimdeckModels['current-pattern'];
  var AF = node ? require('./array-factor.js') : root.SimdeckModels['array-factor'];

  var D2R = Math.PI / 180;
  var GRID = 0.05;                         // degrees: the azimuth grid for read-backs
  var TOL = 1e-9;                          // relative: equal, full-size, on the line
  var T_STEP = 5, KEY_STEP = 15;           // time: the play step and the → / ← step, degrees of ωt
  var RANGES = {                           // [min, max, step, default]
    n: [1, 8, 1, 2],
    d: [0.05, 2, 0.05, 0.5],
    lag: [-180, 180, 5, 0],
    t: [0, 355, 5, 0]
  };
  var defaults = { n: 2, d: 0.5, lag: 0, t: 0 };
  var LADDER = [1.5, 2, 2.5, 3, 3.5, 4.5];             // the horizontal plot's top: field over one dipole fed the same power

  /** Params made safe (tie-breaks 1 and 2): clamped and on their grid; a non-number gives the default; lag −180 is 180
      (the same feed); time wraps round the period. */
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
        v = r[0] + Math.round((v - r[0]) / r[2]) * r[2];
        v = Math.min(r[1], v);
      }
      out[k] = Number(v.toFixed(2));
      if (out[k] === 0) out[k] = 0;        // no −0
    });
    if (out.lag === -180) out.lag = 180;
    return out;
  }

  // ── mutual resistances by spacing, memoised (pure) ──
  var rMemo = {};
  function rOf(x) {
    var key = x.toFixed(4);
    if (!(key in rMemo)) rMemo[key] = AF.mutualResistance(x, 0.5);
    return rMemo[key];
  }
  var R11 = rOf(0);                         // 73.08 Ω
  var DIP = CP.directivity(0.5);
  var D_DIPOLE = DIP.d;                     // 1.6409, 2.15 dBi

  function db10(x) { return x > 0 ? 10 * Math.log10(x) : null; }

  /** The horizontal pattern's array factor at azimuth phi (degrees from the line's +x end). */
  function afAt(p, phi) { return AF.arrayFactor(p.n, p.d, p.lag, Math.cos(phi * D2R)); }

  /** The full-size lobes: directions in 0 … 180° where ψ = 2πm, cos φ = (360m + lag)/(360d). On the line (|cos φ| = 1
      within TOL) counts (tie-break 4). Sorted by m: [{ m, phi }]. */
  function fullLobes(p) {
    if (p.n === 1) return [];
    var out = [], span = 360 * p.d;
    var mLo = Math.ceil((-span - p.lag) / 360 - TOL), mHi = Math.floor((span - p.lag) / 360 + TOL);
    for (var m = mLo; m <= mHi; m++) {
      var c = (360 * m + p.lag) / span;
      if (Math.abs(c) > 1 + TOL) continue;
      c = Math.max(-1, Math.min(1, c));
      out.push({ m: m || 0, phi: CP.snap(Math.acos(c) / D2R) });   // no −0
    }
    return out;
  }

  /** The half-power points of the lobe at phi0 in the horizontal plane (the pattern is mirror-symmetric about the line,
      P(−φ) = P(φ)): walk out each way to the first sample below half of P(phi0), then bisect. Returns the angles from
      phi0 towards larger and smaller φ, [up, down]; null when one side never falls to half within 180° (tie-break 6). */
  function halfPower(p, phi0) {
    var top = Math.pow(afAt(p, phi0), 2);
    if (!(top > 0)) return null;
    function f(a) { return Math.pow(afAt(p, a), 2) / top; }
    function side(dir) {
      var prev = phi0;
      for (var s = GRID; s <= 180 + 1e-9; s += GRID) {
        var a = phi0 + dir * s;
        if (f(a) < 0.5 - 1e-12) {               // a strict margin: touching half exactly is not falling below
          var lo = prev, hi = a;
          for (var i = 0; i < 50; i++) { var mid = (lo + hi) / 2; if (f(mid) >= 0.5 - 1e-12) lo = mid; else hi = mid; }
          return Math.abs((lo + hi) / 2 - phi0);
        }
        prev = a;
      }
      return null;
    }
    var a = side(1), b = side(-1);
    return a === null || b === null ? null : [a, b];
  }
  /** The half-power beamwidth of the lobe at phi0: the sum of the two sides, or null. */
  function beamwidth(p, phi0) { var hp = halfPower(p, phi0); return hp === null ? null : hp[0] + hp[1]; }

  /** A grid sample i (0 … 180° in GRID steps) that is a local maximum, refined to its peak: an end of the line is a
      peak as it is (the pattern is mirrored there); inside, golden section within one step each way. { phi, af }. */
  function refine(p, i) {
    var n = Math.round(180 / GRID), v = afAt(p, i * GRID);
    if (i === 0 || i === n) return { phi: i * GRID, af: v };
    var lo = (i - 1) * GRID, hi = (i + 1) * GRID, g = (Math.sqrt(5) - 1) / 2;
    for (var k = 0; k < 60; k++) {
      var x1 = hi - g * (hi - lo), x2 = lo + g * (hi - lo);
      if (afAt(p, x1) >= afAt(p, x2)) hi = x2; else lo = x1;
    }
    var phi = (lo + hi) / 2, v2 = afAt(p, phi);
    return v2 >= v ? { phi: phi, af: v2 } : { phi: i * GRID, af: v };
  }

  /** The local maxima of the pattern in 0 … 180° on the grid, each refined (an end counts when it is not below its
      neighbour; inside, strictly above the left and not below the right). */
  function peaks(p) {
    var n = Math.round(180 / GRID), out = [], a = [];
    for (var i = 0; i <= n; i++) a.push(afAt(p, i * GRID));
    for (i = 0; i <= n; i++) {
      var ok = i === 0 ? a[0] >= a[1] : i === n ? a[n] >= a[n - 1] : a[i] > a[i - 1] * (1 + 1e-12) && a[i] >= a[i + 1];
      if (ok && a[i] > 0) out.push(refine(p, i));
    }
    return out;
  }

  /** The strongest direction (over-steered main lobe, tie-break 5): the largest refined peak; equal ones (relative
      1e-9) go to the smaller angle. AF(ψ) = AF(2π − ψ), so equal peaks at unrelated angles do occur. */
  function strongest(p) {
    var best = null;
    peaks(p).forEach(function (q) {
      if (best === null || q.af > best.af * (1 + TOL)) best = q;   // peaks come in rising φ: equal ones keep the smaller
    });
    return best;
  }

  /** The strongest side lobe (tie-break 7): a refined local maximum below the main lobe (relative 1e-7). Refined, the
      main lobe, every full-size lobe and an over-steered twin are as strong as the main lobe, so this one test leaves
      them out. { db (relative to the main lobe's level), at } or null. */
  function sideLobe(p, mainAf) {
    var best = null;
    peaks(p).forEach(function (q) {
      if (q.af >= mainAf * (1 - 1e-7)) return;
      if (best === null || q.af > best.af) best = q;
    });
    if (best === null || !(mainAf > 0)) return null;
    return { db: 20 * Math.log10(best.af / mainAf), at: Number(best.phi.toFixed(2)) };
  }

  /** The horizontal plot's top for a largest field ratio x (over one dipole): the smallest rung at least 3 % above it. */
  function plotTop(x) {
    for (var i = 0; i < LADDER.length; i++) if (LADDER[i] >= x * 1.03) return LADDER[i];
    return LADDER[LADDER.length - 1];
  }

  /** Everything the caption, the readout and the drawing need (SPEC.md §3–§5). */
  function initial(params) {
    var p = norm(Object.assign({}, defaults, params));
    if (p.n === 1) {
      return {
        p: p, kind: 'single', single: true, full: [], grating: 0, main: null, mainAf: 1, mainDb: 0,
        over: false, bw: null, hp: null, side: null, backDb: null, backNull: false,
        rPower: R11, d: D_DIPOLE, dbi: db10(D_DIPOLE), overDipole: 0, dDipole: D_DIPOLE,
        pathDiff: null, gratingAt: null, fieldRatio: 1, top: plotTop(1)
      };
    }
    var full = fullLobes(p);
    var mainLobe = full.filter(function (q) { return q.m === 0; })[0] || null;
    var over = mainLobe === null;                                   // lag beyond k·d: no direction makes ψ = 0
    var main, mainAf;
    if (!over) { main = mainLobe.phi; mainAf = p.n; }
    else { var s = strongest(p); main = CP.snap(s.phi); mainAf = s.af; }
    var hp = halfPower(p, main), bw = hp === null ? null : hp[0] + hp[1];
    var side = sideLobe(p, mainAf);
    var back = AF.arrayFactor(p.n, p.d, p.lag, -Math.cos(main * D2R));   // the opposite way (φ0 + 180°)
    var backRel = back / mainAf;
    var backNull = backRel < 1e-6;
    var rPower = AF.powerResistance(p.n, p.d, p.lag, rOf);
    var dir = AF.directivity(mainAf, rPower);
    var kind = over ? 'over' : Math.abs(main - 90) < 1e-6 ? 'broadside' : main < 1e-6 || main > 180 - 1e-6 ? 'endfire' : 'steered';
    var grating = full.length - (over ? 0 : 1);
    var gr = full.filter(function (q) { return q.m !== 0; }).map(function (q) { return q.phi; });
    return {
      p: p, kind: kind, single: false, full: full, grating: grating, gratingAt: gr.length ? gr : null,
      main: main, mainAf: mainAf, mainDb: 20 * Math.log10(mainAf / p.n), over: over,
      bw: bw, hp: hp, side: side,
      backDb: backNull ? null : 20 * Math.log10(backRel), backNull: backNull,
      rPower: rPower, d: dir, dbi: db10(dir), overDipole: db10(dir / D_DIPOLE), dDipole: D_DIPOLE,
      pathDiff: over ? null : p.d * Math.cos(main * D2R),           // λ: the path gained per element along the beam
      fieldRatio: Math.sqrt(dir / D_DIPOLE), top: plotTop(Math.sqrt(dir / D_DIPOLE))
    };
  }

  /** Presets (the page gives them names), each with what the lecturer should see (SPEC.md §6). */
  var presets = [
    { id: 'broadside', params: { n: 2, d: 0.5, lag: 0, t: 0 } },
    { id: 'endfire', params: { n: 2, d: 0.5, lag: 180, t: 0 } },
    { id: 'cardioid', params: { n: 2, d: 0.25, lag: 90, t: 0 } },
    { id: 'steer', params: { n: 4, d: 0.5, lag: 90, t: 0 } },
    { id: 'grating', params: { n: 4, d: 1.5, lag: 0, t: 0 } },
    { id: 'eight', params: { n: 8, d: 0.5, lag: 0, t: 0 } }
  ];

  var logic = {
    RANGES: RANGES, LADDER: LADDER, GRID: GRID, plotTop: plotTop, T_STEP: T_STEP, KEY_STEP: KEY_STEP, R11: R11, D_DIPOLE: D_DIPOLE,
    defaults: defaults, presets: presets, norm: norm, initial: initial,
    afAt: afAt, fullLobes: fullLobes, halfPower: halfPower, beamwidth: beamwidth, refine: refine, peaks: peaks, strongest: strongest, sideLobe: sideLobe, rOf: rOf,
    CP: CP, AF: AF
  };

  if (node) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
