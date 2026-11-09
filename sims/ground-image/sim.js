/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ground-image (SPEC.md): an antenna above the ground behaves like itself plus its mirror image below. The
   direct and the reflected wave add or cancel by height: the elevation pattern, its lobes, the take-off angle, where one
   hop through the ionosphere lands, the gain and what a real ground loses.
   The antenna, its image and the ground are ground.js (pure, promotable); the half-wave element is current-pattern.js
   (from dipole-length) and the side-by-side mutual resistance array-factor.js (from antenna-array), both copied
   unchanged (COMMON.md §6). The hop is skip-distance's geometry (hopKm, copied below).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var node = typeof module === 'object' && module.exports;
  var G = node ? require('./ground.js') : root.SimdeckModels.ground;
  var CP = G.CP;

  var D2R = Math.PI / 180;
  var GRID = 0.05;                         // degrees: the elevation grid for read-backs
  var TOL = 1e-9;                          // relative: equal lobes
  var F_MHZ = 7;                           // the band the grounds' constants are taken at (and the metres shown)
  var LAMBDA_M = 299.792458 / F_MHZ;       // 42.83 m
  var T_STEP = 5, KEY_STEP = 15;           // time: the play step and the → / ← step, degrees of ωt
  var TOP = 2.5;                           // the pattern plot's outer ring: field over a free-space dipole, same power
  var ANTS = ['horizontal', 'vertical', 'groundplane'];
  var GROUNDS = {                          // ε_r, σ (S/m) *(check)*, SPEC.md §2
    perfect: null,
    average: { er: 13, sigma: 0.005 },
    poor: { er: 5, sigma: 0.001 }
  };
  var RANGES = {                           // [min, max, step, default]
    h: [0.05, 3, 0.05, 0.5],
    t: [0, 355, 5, 0]
  };
  var H_MIN_VERTICAL = 0.25;               // the vertical dipole's lower end on the ground
  var defaults = { ant: 'horizontal', h: 0.5, ground: 'perfect', t: 0 };

  /** Params made safe (tie-breaks 1 and 2): a choice not in its list gives the default; h clamped and on its grid, the
      vertical's at least 1/4; a non-number gives the default; time wraps round the period. */
  function norm(p) {
    p = p || {};
    var out = {
      ant: ANTS.indexOf(p.ant) >= 0 ? p.ant : defaults.ant,
      ground: Object.prototype.hasOwnProperty.call(GROUNDS, p.ground) ? p.ground : defaults.ground
    };
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
    if (out.ant === 'vertical' && out.h < H_MIN_VERTICAL) out.h = H_MIN_VERTICAL;
    return out;
  }

  /** The ground's complex permittivity at F_MHZ, or null for a perfect one. */
  function epsOf(ground) {
    var g = GROUNDS[ground];
    return g ? G.permittivity(g.er, g.sigma, F_MHZ) : null;
  }
  /** The antenna's height as the model uses it: the ground plane's rod stands on the ground. */
  function heightOf(p) { return p.ant === 'groundplane' ? 0 : p.h; }
  /** The plane the elevation pattern is drawn in: across the horizontal wire (φ = 90°); any plane for the verticals. */
  var CUT_PHI = Math.PI / 2;

  /** Gain (linear, over isotropic) at elevation e degrees in the drawn plane; e above 90° is the other side, mirrored. */
  function gainAt(ant, h, eps, fed, e) {
    var d = e > 90 ? 180 - e : e;
    return 4 * Math.PI * G.at(ant, h, eps, d * D2R, CUT_PHI).e2 / fed;
  }

  /** The hop of one ray through a reflecting region at height H km (skip-distance's geometry; from sims/skip-distance/
      sim.js @ 58ecd9b, halfAngle and hopKm): β = arccos(R·cos α/(R + H)) − α, the hop 2·R·β along the ground. 90° is
      exactly 0. */
  var R_EARTH = 6371, H_F2 = 300;
  function hopKm(alphaDeg, H) {
    H = H === undefined ? H_F2 : H;
    if (alphaDeg >= 90) return 0;
    var a = alphaDeg * D2R;
    return 2 * R_EARTH * Math.max(0, Math.acos(R_EARTH * Math.cos(a) / (R_EARTH + H)) - a);
  }

  /** A grid sample i that is a local maximum, refined to its peak: an end (0° or 90°) is taken as it is (the horizon is
      the pattern's edge; the zenith is a mirror line); inside, golden section within one step each way. { at, g }. */
  function refine(f, i, n) {
    var v = f(i * GRID);
    if (i === 0 || i === n) return { at: i * GRID, g: v };
    var lo = (i - 1) * GRID, hi = (i + 1) * GRID, gr = (Math.sqrt(5) - 1) / 2;
    for (var k = 0; k < 60; k++) {
      var x1 = hi - gr * (hi - lo), x2 = lo + gr * (hi - lo);
      if (f(x1) >= f(x2)) hi = x2; else lo = x1;
    }
    var at = (lo + hi) / 2, v2 = f(at);
    return v2 >= v ? { at: at, g: v2 } : { at: i * GRID, g: v };
  }

  /** The lobes between the horizon and the zenith (tie-break 4): local maxima of the gain on the grid, each refined, above
      zero. A flat top counts once, at its lower edge: the horizon when not below its neighbour; inside, strictly above
      the left and not below the right; the zenith when strictly above its neighbour. Sorted by rising elevation. */
  function lobes(f) {
    var n = Math.round(90 / GRID), a = [], out = [];
    for (var i = 0; i <= n; i++) a.push(f(i * GRID));
    var top = Math.max.apply(null, a);
    for (i = 0; i <= n; i++) {
      var ok = i === 0 ? a[0] >= a[1] : i === n ? a[n] > a[n - 1] : a[i] > a[i - 1] * (1 + 1e-12) && a[i] >= a[i + 1];
      if (ok && a[i] > top * 1e-12) out.push(refine(f, i, n));
    }
    return out;
  }

  /** The main lobe (tie-break 3): the strongest; equal ones (relative 1e-9) go to the lowest elevation, the take-off
      angle that reaches farthest. */
  function mainOf(ls) {
    var best = null;
    ls.forEach(function (q) { if (best === null || q.g > best.g * (1 + TOL)) best = q; });
    return best;
  }

  /** The half-power span of the lobe at e0 (tie-break 5): walk down and up to the first sample below half its gain (a
      1e-12 margin: touching half is not below), then bisect. It stops at the horizon (0°) and at the zenith (90°, the
      lobe goes on over the top, mirrored). [lo, hi] in degrees. */
  function halfPower(f, e0) {
    var top = f(e0);
    function below(e) { return f(e) / top < 0.5 - 1e-12; }
    function side(dir) {
      var prev = e0;
      for (var s = GRID; ; s += GRID) {
        var e = e0 + dir * s;
        if (e <= 0 || e >= 90) {
          var end = e <= 0 ? 0 : 90;
          if (!below(end)) return end;
          e = end;
        }
        if (below(e)) {
          var lo = prev, hi = e;
          for (var i = 0; i < 50; i++) { var mid = (lo + hi) / 2; if (below(mid)) hi = mid; else lo = mid; }
          return (lo + hi) / 2;
        }
        prev = e;
      }
    }
    return [side(-1), side(1)];
  }

  function db10(x) { return x > 0 ? 10 * Math.log10(x) : null; }

  /** The interference nulls above the horizon over a perfect ground (rule 3; the vertical's own null straight up is not
      one): horizontal sin Δ = m/(2h), m = 1 … ⌊2h⌋; vertical sin Δ = (2m + 1)/(4h) < 1; the ground plane none. */
  function nullsPerfect(ant, h) {
    if (ant === 'horizontal') return Math.floor(2 * h + 1e-9);
    if (ant === 'vertical') { var n = 0; while ((2 * n + 1) / (4 * h) < 1 - 1e-9) n++; return n; }
    return 0;
  }

  /** Everything the caption, the readout and the drawing need (SPEC.md §3–§5). */
  function initial(params) {
    var p = norm(Object.assign({}, defaults, params));
    var ant = p.ant, h = heightOf(p), eps = epsOf(p.ground);
    var pw = G.power(ant, h, eps);
    var f = function (e) { return gainAt(ant, h, eps, pw.fed, e); };
    var ls = lobes(f), main = mainOf(ls);
    var hp = halfPower(f, main.at);
    var zen = f(90), dDip = CP.directivity(0.5).d;
    // the same antenna over a perfect ground, for the comparison
    var perfect = null, pp = null;
    if (eps) {
      pp = G.power(ant, h, null);
      var fp = function (e) { return gainAt(ant, h, null, pp.fed, e); };
      var mp = mainOf(lobes(fp));
      perfect = { at: CP.snap(mp.at), dbi: db10(mp.g) };
    }
    var at = CP.snap(main.at);
    var kind = at >= 90 - 1e-6 ? 'up' : at <= 1e-6 ? 'horizon' : 'lobe';
    return {
      p: p, ant: ant, h: h, metres: h * LAMBDA_M, perfectGround: !eps,
      lobes: ls.map(function (q) { return { at: CP.snap(q.at), dbi: db10(q.g) }; }),
      count: ls.length, main: at, kind: kind, g: main.g, dbi: db10(main.g),
      fieldRatio: Math.sqrt(main.g / dDip),
      hp: [CP.snap(hp[0]), CP.snap(hp[1])],
      hop: hopKm(at), hopNear: hopKm(hp[1]), hopFar: hopKm(hp[0]),
      zenithDbi: zen > main.g * 1e-9 ? db10(zen) : null,
      pathDiff: 2 * h * Math.sin(at * D2R),          // λ: how much farther the reflected wave travels at the take-off angle
      lost: pw.lost / pw.fed, sky: pw.sky / pw.fed, fed: pw.fed, fedPerfect: eps ? pp.fed : pw.fed,
      nullsPerfect: nullsPerfect(ant, h),
      r: eps && ant !== 'groundplane' ? null : G.ohms(pw.fed),   // the feed resistance: perfect ground, or the radials
      perfect: perfect, belowPerfect: perfect ? perfect.dbi - db10(main.g) : 0
    };
  }

  /** Presets (the page gives them names), each with what the lecturer should see (SPEC.md §6). */
  var presets = [
    { id: 'nvis', params: { ant: 'horizontal', h: 0.15, ground: 'average', t: 0 } },
    { id: 'half', params: { ant: 'horizontal', h: 0.5, ground: 'perfect', t: 0 } },
    { id: 'high', params: { ant: 'horizontal', h: 2, ground: 'perfect', t: 0 } },
    { id: 'highPoor', params: { ant: 'horizontal', h: 2, ground: 'poor', t: 0 } },
    { id: 'gp', params: { ant: 'groundplane', h: 0.5, ground: 'perfect', t: 0 } },
    { id: 'gpPoor', params: { ant: 'groundplane', h: 0.5, ground: 'poor', t: 0 } }
  ];

  var logic = {
    RANGES: RANGES, GRID: GRID, ANTS: ANTS, GROUNDS: GROUNDS, F_MHZ: F_MHZ, LAMBDA_M: LAMBDA_M, TOP: TOP, H_F2: H_F2,
    H_MIN_VERTICAL: H_MIN_VERTICAL, T_STEP: T_STEP, KEY_STEP: KEY_STEP, CUT_PHI: CUT_PHI,
    defaults: defaults, presets: presets, norm: norm, initial: initial, epsOf: epsOf, heightOf: heightOf,
    gainAt: gainAt, hopKm: hopKm, nullsPerfect: nullsPerfect, refine: refine, lobes: lobes, mainOf: mainOf, halfPower: halfPower,
    G: G, CP: CP
  };

  if (node) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
