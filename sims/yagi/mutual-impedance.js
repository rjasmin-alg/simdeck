/* SPDX-License-Identifier: AGPL-3.0-or-later
   Induced currents in a set of parallel thin dipoles side by side, by the induced-EMF method (catalogue §5.26, shared
   model 3: the pattern of a set of currents, the part that finds the currents when only some elements are fed). First
   written for yagi (SPEC.md §2).
   Pure, DOM-free, no strings: registers as SimdeckModels['mutual-impedance'] in a page and is module.exports under node,
   so the coordinator can move it to models/ next to current-pattern.js unchanged. Needs nothing else.

   Units: lengths in wavelengths (k = 2π), impedances in ohms, phases in degrees. Every element is a centre-fed thin
   wire of length len along the same axis, centred on the same line across it (side by side, no stagger), carrying
   the sinusoidal current I(z) = I_m·sin(k(len/2 − |z|)) (Balanis §4.5, §8.6). Impedances are referred to the crest
   currents I_m; the centre (feed) current is I_m·sin(π·len), so an impedance at the feed is Z / sin²(π·len).
   Complex numbers are [re, im]. */
(function (root) {
  'use strict';

  var ETA0 = 376.730313668;          // Ω, μ0·c (CODATA 2018), as current-pattern.js
  var TWO_PI = 2 * Math.PI;
  var EULER = 0.5772156649015329;   // Euler–Mascheroni constant
  var RADIUS = 0.0025;               // λ: the wire radius (diameter 0.005 λ), for the self reactance only

  // ── the sine and cosine integrals, by their power series (Abramowitz & Stegun 5.2.14 and 5.2.16) ──
  // The arguments here are at most 2·k·len ≤ 2π·1.2 < 8; the series stays exact to 1e-13 up to x = 12.
  /** Si(x) = ∫₀^x sin t / t dt. */
  function Si(x) {
    var sum = 0, term = x, n = 0;
    while (Math.abs(term) > 1e-18 * Math.max(1, Math.abs(sum)) || n < 2) {
      sum += term / (2 * n + 1);
      n += 1;
      term *= -x * x / ((2 * n) * (2 * n + 1));
      if (n > 200) break;
    }
    return sum;
  }
  /** Ci(x) = γ + ln x + ∫₀^x (cos t − 1)/t dt, x > 0. */
  function Ci(x) {
    var sum = 0, term = -x * x / 2, n = 1;
    while (Math.abs(term) > 1e-18 * Math.max(1, Math.abs(sum)) || n < 2) {
      sum += term / (2 * n);
      n += 1;
      term *= -x * x / ((2 * n - 1) * (2 * n));
      if (n > 200) break;
    }
    return EULER + Math.log(x) + sum;
  }

  /** The self impedance of a thin dipole of length len and radius a (λ), referred to its crest current
      (Balanis eq. 8-60a and 8-60b; R is the radiation resistance of eq. 4-70 *(check eq. numbers)*):
        R = η/(2π)·{γ + ln(kl) − Ci(kl) + ½·sin(kl)·[Si(2kl) − 2·Si(kl)] + ½·cos(kl)·[γ + ln(kl/2) + Ci(2kl) − 2·Ci(kl)]}
        X = η/(4π)·{2·Si(kl) + cos(kl)·[2·Si(kl) − Si(2kl)] − sin(kl)·[2·Ci(kl) − Ci(2kl) − Ci(2ka²/l)]}
      λ/2: 73.08 + j42.51 Ω, whatever the radius. */
  function selfImpedance(len, a) {
    a = a || RADIUS;
    var kl = TWO_PI * len, s = Math.sin(kl), c = Math.cos(kl);
    var ci1 = Ci(kl), ci2 = Ci(2 * kl), si1 = Si(kl), si2 = Si(2 * kl);
    var R = ETA0 / TWO_PI * (EULER + Math.log(kl) - ci1 + 0.5 * s * (si2 - 2 * si1) + 0.5 * c * (EULER + Math.log(kl / 2) + ci2 - 2 * ci1));
    var X = ETA0 / (4 * Math.PI) * (2 * si1 + c * (2 * si1 - si2) - s * (2 * ci1 - ci2 - Ci(TWO_PI * 2 * a * a / len)));
    return [R, X];
  }

  // ── Gauss–Legendre nodes and weights on [−1, 1], 10 points, by Newton's method on P₁₀ (deterministic) ──
  var GL = (function (n) {
    var xs = [], ws = [];
    for (var i = 1; i <= n; i++) {
      var x = Math.cos(Math.PI * (i - 0.25) / (n + 0.5)), dp = 0;
      for (var it = 0; it < 100; it++) {
        var p0 = 1, p1 = x;
        for (var m = 2; m <= n; m++) { var p2 = ((2 * m - 1) * x * p1 - (m - 1) * p0) / m; p0 = p1; p1 = p2; }
        dp = n * (x * p1 - p0) / (x * x - 1);
        var dx = p1 / dp;
        x -= dx;
        if (Math.abs(dx) < 1e-16) break;
      }
      xs.push(x); ws.push(2 / ((1 - x * x) * dp * dp));
    }
    return { x: xs, w: ws };
  })(10);

  /** ∫_a^b f, f returning [re, im], in panels no wider than h, 10-point Gauss–Legendre in each. */
  function integrate(f, a, b, h) {
    var re = 0, im = 0;
    if (!(b > a)) return [0, 0];
    if (!(h > 0)) throw new Error('integrate: the panel width must be positive (two elements at the same place?)');
    var np = Math.max(1, Math.ceil((b - a) / h - 1e-9)), w = (b - a) / np;
    for (var p = 0; p < np; p++) {
      var mid = a + (p + 0.5) * w;
      for (var i = 0; i < GL.x.length; i++) {
        var v = f(mid + 0.5 * w * GL.x[i]);
        re += GL.w[i] * v[0] * 0.5 * w; im += GL.w[i] * v[1] * 0.5 * w;
      }
    }
    return [re, im];
  }

  /** The mutual impedance of two parallel elements side by side at spacing d (> 0), lengths l1 and l2, referred to
      their crest currents (induced EMF; Balanis §8.6, eq. 8-54 to 8-57 *(check eq. numbers)*):
        Z₂₁ = −(1/(I₁·I₂))·∫ E_z1(d, z)·I₂(z) dz, with the exact near field of the sinusoidal current on element 1
        E_z1 = −jη·I₁/(4π)·[e^{−jkR₁}/R₁ + e^{−jkR₂}/R₂ − 2·cos(k·l1/2)·e^{−jkr}/r],
        R₁,₂ = √(d² + (z ∓ l1/2)²), r = √(d² + z²).
      So Z₂₁ = jη/(2π)·∫₀^{l2/2} sin(k(l2/2 − z))·[…] dz (the integrand is even in z). Reciprocal: Z₂₁ = Z₁₂. For two
      λ/2 elements it equals the closed form with Ci and Si (Balanis eq. 8-68): −12.52 − j29.91 Ω at λ/2. */
  function mutualImpedance(l1, l2, d) {
    var half1 = l1 / 2, half2 = l2 / 2, c1 = Math.cos(Math.PI * l1), d2 = d * d;
    function g(z) {
      var s = Math.sin(TWO_PI * (half2 - z));
      var R1 = Math.sqrt(d2 + (z - half1) * (z - half1)), R2 = Math.sqrt(d2 + (z + half1) * (z + half1)), r = Math.sqrt(d2 + z * z);
      var re = Math.cos(TWO_PI * R1) / R1 + Math.cos(TWO_PI * R2) / R2 - 2 * c1 * Math.cos(TWO_PI * r) / r;
      var im = -Math.sin(TWO_PI * R1) / R1 - Math.sin(TWO_PI * R2) / R2 + 2 * c1 * Math.sin(TWO_PI * r) / r;
      return [s * re, s * im];
    }
    var h = Math.min(0.025, d / 2), sum;
    if (half1 < half2) {                     // the near field peaks opposite element 1's ends: a panel edge there
      var a = integrate(g, 0, half1, h), b = integrate(g, half1, half2, h);
      sum = [a[0] + b[0], a[1] + b[1]];
    } else sum = integrate(g, 0, half2, h);
    var k = ETA0 / TWO_PI;                   // j·k·(re + j·im) = −k·im + j·k·re
    return [-k * sum[1], k * sum[0]];
  }

  /** The impedance matrix of elements [{ len, x }] (side by side along x): the self impedance on the diagonal,
      the mutual impedance off it. Elements at the same x are not allowed (they would be one wire). */
  function matrix(elements, a, zOf) {
    zOf = zOf || function (l1, l2, d) { return mutualImpedance(l1, l2, d); };
    var n = elements.length, Z = [];
    for (var i = 0; i < n; i++) {
      Z.push([]);
      for (var j = 0; j < n; j++) {
        Z[i].push(i === j ? selfImpedance(elements[i].len, a) : zOf(elements[i].len, elements[j].len, Math.abs(elements[i].x - elements[j].x)));
      }
    }
    return Z;
  }

  // ── complex arithmetic ──
  function cmul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
  function cdiv(a, b) { var q = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / q, (a[1] * b[0] - a[0] * b[1]) / q]; }
  function cabs(a) { return Math.hypot(a[0], a[1]); }

  /** Solves Z·I = V for complex Z (n × n) and V, Gaussian elimination with partial pivoting. Does not change its
      arguments. */
  function solve(Z, V) {
    var n = V.length, A = Z.map(function (row, i) { return row.map(function (c) { return [c[0], c[1]]; }).concat([[V[i][0], V[i][1]]]); });
    for (var col = 0; col < n; col++) {
      var piv = col;
      for (var r = col + 1; r < n; r++) if (cabs(A[r][col]) > cabs(A[piv][col])) piv = r;
      var tmp = A[col]; A[col] = A[piv]; A[piv] = tmp;
      for (r = col + 1; r < n; r++) {
        var f = cdiv(A[r][col], A[col][col]);
        for (var c = col; c <= n; c++) { var m = cmul(f, A[col][c]); A[r][c] = [A[r][c][0] - m[0], A[r][c][1] - m[1]]; }
      }
    }
    var I = new Array(n);
    for (r = n - 1; r >= 0; r--) {
      var s = [A[r][n][0], A[r][n][1]];
      for (c = r + 1; c < n; c++) { var q = cmul(A[r][c], I[c]); s = [s[0] - q[0], s[1] - q[1]]; }
      I[r] = cdiv(s, A[r][r]);
    }
    return I;
  }

  /** Only element `fed` is driven (by 1 V at its centre); every other one is a continuous wire (shorted at its centre):
      the crest currents, the centre currents, and the impedance at the feed, Z_in = (Σ_j Z_fj·I_j) / (I_f·sin²(π·len_f)).
      Returns { Z, crest: [[re, im]], centre: [[re, im]], zin: [R, X] }. */
  function induced(elements, fed, a, zOf) {
    var Z = matrix(elements, a, zOf), n = elements.length, V = [];
    for (var i = 0; i < n; i++) V.push(i === fed ? [1, 0] : [0, 0]);
    // V is at the centre; referred to the crest current the driving term is V·sin(π·len) (the same power V·I_centre)
    var sf = Math.sin(Math.PI * elements[fed].len);
    V[fed] = [sf, 0];
    var crest = solve(Z, V);
    var centre = crest.map(function (c, k) { var s = Math.sin(Math.PI * elements[k].len); return [c[0] * s, c[1] * s]; });
    var zin = cdiv([1, 0], centre[fed]);
    return { Z: Z, crest: crest, centre: centre, zin: zin };
  }

  /** The radiated power as a resistance referred to the given crest currents: Re(Iᴴ·Z·I) = Σ_ij Re(Z_ij)·Re(I_i*·I_j)
      (Z is symmetric, so the reactive part adds nothing real). 2P = this. */
  function powerResistance(Z, I) {
    var sum = 0;
    for (var i = 0; i < I.length; i++) {
      for (var j = 0; j < I.length; j++) sum += Z[i][j][0] * (I[i][0] * I[j][0] + I[i][1] * I[j][1]);
    }
    return sum;
  }

  var api = {
    ETA0: ETA0, RADIUS: RADIUS, Si: Si, Ci: Ci, selfImpedance: selfImpedance, mutualImpedance: mutualImpedance,
    matrix: matrix, solve: solve, induced: induced, powerResistance: powerResistance,
    cmul: cmul, cdiv: cdiv, cabs: cabs, integrate: integrate, GL: GL
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.SimdeckModels = root.SimdeckModels || {})['mutual-impedance'] = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
