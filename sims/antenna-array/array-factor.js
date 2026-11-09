/* SPDX-License-Identifier: AGPL-3.0-or-later
   A uniform line array of identical parallel half-wave dipoles side by side (catalogue §5.26, shared model 3: the
   pattern of a set of currents, the array part), first written for antenna-array (SPEC.md §2).
   Pure, DOM-free, no strings: registers as SimdeckModels['array-factor'] in a page and is module.exports under node, so
   the coordinator can move it to models/ next to current-pattern.js unchanged. It uses current-pattern.js for the
   element (its far-field factor and field sum) and adds what a set of parallel elements needs: the array factor, the
   mutual resistance of two side-by-side elements, and the directivity of the line from them.

   Units: lengths in wavelengths (k = 2π), phases in degrees. The array: n elements along x at spacing d, centred on the
   origin, each a vertical (z) centre-fed thin dipole of length len, all with the same crest current; element m
   (m = 0 … n−1, from −x to +x) lags element 0 by m·lag degrees: I_m = e^{−j·m·lag}.
   In a direction at angle γ from the line (cos γ = r̂·x̂) the fields add with ψ = k·d·cos γ − lag (radians), and
     AF(ψ) = |Σ_m e^{j·m·ψ}| = |sin(nψ/2) / sin(ψ/2)|   (Balanis eq. 6-10 with β = −lag *(check eq. number)*).
   For n = 2 that is 2·|cos(ψ/2)|, the catalogue's 2·cos((k·d·cos φ + δ)/2) with δ = −lag. */
(function (root) {
  'use strict';

  var node = typeof module === 'object' && module.exports;
  var CP = node ? require('./current-pattern.js') : root.SimdeckModels['current-pattern'];

  var TWO_PI = 2 * Math.PI;
  var D2R = Math.PI / 180;

  /** J₀(x), Bessel function of the first kind, order 0: (1/2π)∫₀^{2π} cos(x·sin τ) dτ by the trapezoidal rule, which is
      exact up to J_M(x)-sized aliasing for a periodic integrand; M ≥ |x| + 40 points makes that below 1e-15. */
  function besselJ0(x) {
    var ax = Math.abs(x), m = 2 * Math.ceil((ax + 40) / 2), sum = 0;
    for (var j = 0; j < m; j++) sum += Math.cos(ax * Math.sin(TWO_PI * j / m));
    return sum / m;
  }

  /** ψ for a direction at cos γ from the line (radians). */
  function psiOf(d, lag, cosG) { return TWO_PI * d * cosG - lag * D2R; }

  /** The array factor |Σ e^{jmψ}| of n elements at ψ, by the direct sum (exactly n at ψ = 0; no 0/0 at ψ = 2πm). */
  function arrayFactorAt(n, psi) {
    var re = 0, im = 0;
    for (var m = 0; m < n; m++) { re += Math.cos(m * psi); im += Math.sin(m * psi); }
    return Math.sqrt(re * re + im * im);
  }

  /** The array factor in a direction at cos γ from the line. */
  function arrayFactor(n, d, lag, cosG) { return arrayFactorAt(n, psiOf(d, lag, cosG)); }

  /** The elements as current-pattern.js wants them: centred on the origin along x, vertical, element m lagging m·lag. */
  function elements(n, d, lag, len) {
    len = len || 0.5;
    var out = [];
    for (var m = 0; m < n; m++) {
      out.push({ len: len, pos: [(m - (n - 1) / 2) * d, 0, 0], dir: [0, 0, 1], amp: 1, phase: -m * lag });
    }
    return out;
  }

  /** The mutual resistance of two parallel side-by-side elements of length len at spacing d, referred to the crest
      currents: R₁₂ = η/(2π)·∫₀^π F(θ)²·J₀(k·d·sin θ)·sin θ dθ (the φ-average of the cross term of their power; Simpson,
      n intervals). At d = 0 it is the self resistance, 73.08 Ω for λ/2. Checked against Balanis eq. 8-68 (the Ci form):
      −12.52 Ω at λ/2, 40.76 Ω at λ/4. */
  function mutualResistance(d, len, n) {
    len = len || 0.5; n = n || 2000;
    if (n % 2) n += 1;
    var h = Math.PI / n, sum = 0, kd = TWO_PI * d;
    for (var i = 0; i <= n; i++) {
      var th = i * h, st = Math.sin(th), f = CP.elementFactor(len, Math.cos(th));
      var w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
      sum += w * f * f * besselJ0(kd * st) * st;
    }
    return CP.ETA0 / TWO_PI * sum * h / 3;
  }

  /** The total radiated power of the array as a resistance referred to a unit crest current on each element (2P/I_m²):
      Σ_a Σ_b cos((a−b)·lag)·R(|a−b|·d) = n·R(0) + 2·Σ_{p≥1} (n−p)·cos(p·lag)·R(p·d). rOf(dist) gives R; defaults to
      mutualResistance for λ/2 elements. */
  function powerResistance(n, d, lag, rOf) {
    rOf = rOf || function (x) { return mutualResistance(x, 0.5); };
    var sum = n * rOf(0);
    for (var p = 1; p < n; p++) sum += 2 * (n - p) * Math.cos(p * lag * D2R) * rOf(p * d);
    return sum;
  }

  /** Directivity of the array of λ/2 elements whose strongest array factor in the horizontal plane is afMax:
      D = 4π·U_max / P = η·afMax² / (π·powerResistance) (the element's F is 1 on the horizon, its maximum, and the array
      factor is largest there too). One element: η/(π·73.08) = 1.641. */
  function directivity(afMax, rPower) { return CP.ETA0 * afMax * afMax / (Math.PI * rPower); }

  var api = {
    besselJ0: besselJ0, psiOf: psiOf, arrayFactorAt: arrayFactorAt, arrayFactor: arrayFactor, elements: elements,
    mutualResistance: mutualResistance, powerResistance: powerResistance, directivity: directivity, CP: CP
  };

  if (node) module.exports = api;
  else (root.SimdeckModels = root.SimdeckModels || {})['array-factor'] = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
