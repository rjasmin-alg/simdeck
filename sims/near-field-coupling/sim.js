/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for near-field-coupling: two small loops couple like a loose transformer close in (1/r³) and by radiation
   far out (1/r); the crossover sits at λ/2π (SPEC.md).
   The field is hertzian-dipole.js (catalogue §5.26 model 2, copied from sims/dipole-field @ f87e209), used by
   duality: a small loop is a magnetic dipole m = I·A, and its H has the form of the electric dipole's E
   (Balanis, Antenna Theory, §5.2). This file adds the situation (two loops of radius 5 mm, 1 A in the transmitting
   one), the receiver's place (beside, in the loop's plane, or on its axis), c finite or infinite, the coupled
   voltage, its slope, its phase, the power through a sphere, the zones and the presets.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   Units: SI (Hz, m, V, W); time as the phase ωt in degrees. */
(function (root) {
  'use strict';

  var HD = typeof module === 'object' && module.exports
    ? require('./hertzian-dipole.js')
    : root.SimdeckModels['hertzian-dipole'];

  var TAU = 2 * Math.PI;
  var C0 = 299792458;                       // m/s
  var ETA0 = 376.730313668;                 // Ω, μ0·c (CODATA 2018)
  var MU0 = ETA0 / C0;                      // H/m
  var RADIUS = 0.005;                       // m: both loops, radius 5 mm (a 1 cm loop)
  var AREA = Math.PI * RADIUS * RADIUS;     // m²
  var I0 = 1;                               // A: the peak current in the transmitting loop
  var T_STEP = 5;                           // degrees: the time slider's step
  var KEY_STEP = 15;                        // degrees: → / ← move time by this much

  // Frequencies and distances on log sliders: the ISO 3 R20 series (20 values a decade), so every preset lands on a
  // table value. The params f and r are indices into these tables (SPEC.md §1).
  var R20 = [1.00, 1.12, 1.25, 1.40, 1.60, 1.80, 2.00, 2.24, 2.50, 2.80, 3.15, 3.55, 4.00, 4.50, 5.00, 5.60, 6.30, 7.10, 8.00, 9.00];
  function series(base, from, to) {                       // base·R20 values from index `from` to `to` (inclusive)
    var out = [];
    for (var i = from; i <= to; i++) out.push(Number((base * R20[i % 20] * Math.pow(10, Math.floor(i / 20))).toPrecision(3)));
    return out;
  }
  var F_TABLE = series(1e5, 0, 73);         // Hz: 100 kHz … 450 MHz (74 values)
  var R_TABLE = series(0.01, 14, 100);      // m: 5 cm … 1 km (87 values)

  /** Params: f, r = indices into F_TABLE and R_TABLE; geom = 'side' (the receiving loop beside the transmitting one,
      in its plane) | 'axis' (on its axis); c = 'finite' | 'inf'; t = phase ωt in degrees (0 … 355). */
  var defaults = { f: 43, r: 26, geom: 'side', c: 'finite', t: 0 };

  function idx(x, n, d) {
    if (!(typeof x === 'number' || (typeof x === 'string' && x.trim() !== ''))) return d;   // null, '', true: the default
    x = Math.round(Number(x));
    return isFinite(x) ? Math.min(n - 1, Math.max(0, x)) : d;
  }

  /** Params made safe: f and r rounded and clamped to the tables; anything but 'axis' is beside; anything but 'inf'
      is finite c; t wraps into [0, 360) (tie-break: 360 is 0, −5 is 355). */
  function norm(p) {
    p = p || {};
    var t = Number(p.t);
    t = isFinite(t) ? ((t % 360) + 360) % 360 : defaults.t;     // the outer % 360 also folds 360 − ε (which rounds to 360) to 0
    return {
      f: idx(p.f, F_TABLE.length, defaults.f),
      r: idx(p.r, R_TABLE.length, defaults.r),
      geom: p.geom === 'axis' ? 'axis' : 'side',
      c: p.c === 'inf' ? 'inf' : 'finite',
      t: t
    };
  }

  /** H_z at the receiver over k³·m/(4π), as a phasor [re, im], at x = kr. Duality: the loop's H has the electric
      dipole's E form. Beside (θ = 90°): H_z = −H_θ = −e^{−jx}(1/x³ + j/x² − 1/x). On the axis (θ = 0): H_z = H_r =
      2·e^{−jx}(1/x³ + j/x²). c infinite: −1/x³ and 2/x³ (the static field of the loop's moment). */
  function coupling(x, geom, inf) {
    if (geom === 'axis') {
      var a = HD.fieldsAt(x, 0, 0, inf).Er, b = HD.fieldsAt(x, 0, Math.PI / 2, inf).Er;   // Re(A·e^{jφ}) at φ = 0, 90°
      return [a, -b];
    }
    var e = HD.phasors(x, inf).Et;
    return [-e[0], -e[1]];
  }

  /** The two asymptotes of |coupling|: the 1/x³ term (transformer) and the far term (1/x beside, 2/x² on the axis). */
  function asymptotes(x, geom) {
    return geom === 'axis' ? { near: 2 / (x * x * x), far: 2 / (x * x) } : { near: 1 / (x * x * x), far: 1 / x };
  }

  /** The local slope n of |V| ∝ 1/rⁿ at x = kr: n = −d ln|V| / d ln r. Beside: 3 − (2x⁴ − x²)/(1 − x² + x⁴), from 3 to 1,
      overshooting both ends (3.155 at kr = 0.518, 0.845 at kr = 1.932: the 1/r term opposes the 1/r³ term); on the axis:
      3 − x²/(1 + x²), 3 → 2; c infinite: 3 (SPEC.md §3). */
  function slope(x, geom, inf) {
    if (inf) return 3;
    var x2 = x * x;
    return geom === 'axis' ? 3 - x2 / (1 + x2) : 3 - (2 * x2 * x2 - x2) / (1 - x2 + x2 * x2);
  }

  /** Which zone r/λ is in. Boundaries belong to the outer zone (tie-break): 'near' below λ/2π, 'mid' from λ/2π to
      below λ, 'far' from λ. With c infinite everything is 'near'. */
  function zoneOf(rl, inf) {
    if (inf) return 'near';
    if (rl < 1 / TAU) return 'near';
    return rl < 1 ? 'mid' : 'far';
  }

  /** The phase of a complex number in degrees, in (−180, 180] (tie-break: −180 is 180). */
  function degOf(z) {
    var d = Math.atan2(z[1], z[0]) * 180 / Math.PI;
    if (d <= -180) d += 360;
    return d;
  }

  /** Everything at frequency f (Hz) and distance r (m) for one geometry. V = −jω·μ0·A·H_z (Faraday, the receiving
      loop's sense the same as the transmitting loop's current), so V's phase against I is arg(coupling) − 90°. */
  function at(f, r, geom, inf) {
    var lambda = C0 / f, k = TAU / lambda, x = k * r, w = TAU * f;
    var vu = w * MU0 * AREA * AREA * I0 * k * k * k / (4 * Math.PI);    // V: k³·m/(4π)·ω·μ0·A
    var g = coupling(x, geom, inf), mag = Math.hypot(g[0], g[1]);
    var ph = degOf([g[1], -g[0]]);                                       // arg(−j·g)
    return { V: vu * mag, phase: ph, n: slope(x, geom, inf), vu: vu, g: g };
  }

  /** Radiated power of the transmitting loop, η0·π/12·(ka)⁴·I0² (Balanis 5-27); 0 with c infinite. */
  function radiated(f, inf) {
    if (inf) return 0;
    var ka = TAU * f / C0 * RADIUS;
    return ETA0 * Math.PI / 12 * Math.pow(ka, 4) * I0 * I0;
  }

  /** Reactive power through a sphere of radius r round the transmitting loop: ½·|Im ∮ E×H*·dA| = ω·μ0·A²·I0²/(12π·r³)
      (= the radiated power over (kr)³; the same with c infinite: the stored energy does not depend on c). */
  function reactive(f, r) {
    return TAU * f * MU0 * AREA * AREA * I0 * I0 / (12 * Math.PI * r * r * r);
  }

  /** State for the page: the receiver's reading and what the caption and table need (JSON-safe). */
  function initial(params) {
    var p = norm(Object.assign({}, defaults, params));
    var inf = p.c === 'inf', f = F_TABLE[p.f], r = R_TABLE[p.r], lambda = C0 / f;
    var here = at(f, r, p.geom, inf), other = at(f, r, p.geom === 'axis' ? 'side' : 'axis', inf);
    var side = p.geom === 'side' ? here : other, axis = p.geom === 'side' ? other : here;
    return {
      f: f, r: r, geom: p.geom, inf: inf, t: p.t,
      lambda: lambda, cross: lambda / TAU, rl: r / lambda, kr: TAU * r / lambda,
      V: here.V, phase: here.phase, n: here.n,
      div: here.V / at(f, 2 * r, p.geom, inf).V,                         // how many times less at twice the distance
      other: other.V, axisOverSide: axis.V / side.V,
      zone: zoneOf(r / lambda, inf),
      Prad: radiated(f, inf), Q: reactive(f, r),
      i: Math.cos(p.t * Math.PI / 180),                                  // the transmitting loop's current, over I0
      v: Math.cos((p.t + here.phase) * Math.PI / 180)                    // the coupled voltage, over its amplitude
    };
  }

  /** |V| over the whole distance axis (R_TABLE's ends, log-spaced, n + 1 points) for both geometries, with the
      asymptotes of each, for the page's plot. */
  function profile(fi, inf, n) {
    n = n || 160;
    var f = F_TABLE[idx(fi, F_TABLE.length, defaults.f)], k = TAU * f / C0, r0 = R_TABLE[0], r1 = R_TABLE[R_TABLE.length - 1];
    var out = [];
    for (var i = 0; i <= n; i++) {
      var r = r0 * Math.pow(r1 / r0, i / n), s = at(f, r, 'side', inf), a = at(f, r, 'axis', inf);
      var as = asymptotes(k * r, 'side'), aa = asymptotes(k * r, 'axis');
      out.push({ r: r, side: s.V, axis: a.V,
        sideNear: s.vu * as.near, sideFar: s.vu * as.far, axisNear: a.vu * aa.near, axisFar: a.vu * aa.far });
    }
    return out;
  }

  /** The current and the coupled voltage over one period, each over its own amplitude, every 5°. */
  function period(phase) {
    var out = [];
    for (var d = 0; d <= 360; d += T_STEP) out.push({ t: d, i: Math.cos(d * Math.PI / 180), v: Math.cos((d + phase) * Math.PI / 180) });
    return out;
  }

  /** Where the beside and on-axis voltages are equal: x⁴ − 5x² − 3 = 0, x = √((5 + √37)/2) = 2.354 (0.375 λ). */
  var EQUAL_KR = Math.sqrt((5 + Math.sqrt(37)) / 2);

  /** Presets (the page gives them names): each with what the lecturer should see (SPEC.md §5). */
  var presets = [
    { id: 'card', params: { f: 43, r: 0, geom: 'side', c: 'finite', t: 0 } },
    { id: 'charger', params: { f: 3, r: 0, geom: 'side', c: 'finite', t: 0 } },
    { id: 'cross', params: { f: 43, r: 37, geom: 'side', c: 'finite', t: 0 } },
    { id: 'far', params: { f: 43, r: 86, geom: 'side', c: 'finite', t: 0 } },
    { id: 'axis', params: { f: 73, r: 6, geom: 'axis', c: 'finite', t: 0 } },
    { id: 'inf', params: { f: 43, r: 86, geom: 'side', c: 'inf', t: 0 } }
  ];

  var logic = {
    C0: C0, ETA0: ETA0, MU0: MU0, RADIUS: RADIUS, AREA: AREA, I0: I0, T_STEP: T_STEP, KEY_STEP: KEY_STEP,
    R20: R20, F_TABLE: F_TABLE, R_TABLE: R_TABLE, EQUAL_KR: EQUAL_KR,
    defaults: defaults, presets: presets, norm: norm, initial: initial, coupling: coupling, asymptotes: asymptotes,
    slope: slope, zoneOf: zoneOf, degOf: degOf, at: at, radiated: radiated, reactive: reactive, profile: profile,
    period: period, HD: HD
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
