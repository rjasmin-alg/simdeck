/* SPDX-License-Identifier: AGPL-3.0-or-later
   The pattern of a set of currents (catalogue §5.26, shared model 3), first written for dipole-length (SPEC.md §2).
   Copied unchanged from sims/antenna-array/current-pattern.js @ 1dae792, itself an unchanged copy of
   sims/dipole-length/current-pattern.js @ 3daf9c6 (COMMON.md §6): yagi uses its element factor for the pattern of the
   induced currents and, in the tests, the field sum over the sphere. Drop this copy when the coordinator promotes it
   to models/.
   Pure, DOM-free, no strings: registers as SimdeckModels['current-pattern'] in a page and is module.exports under node,
   so the coordinator can move it to models/ unchanged.

   Units: lengths in wavelengths (k = 2π), angles in degrees for phases. An element is a centre-fed thin wire
     { len, pos: [x, y, z], dir: [x, y, z] (unit), amp, phase }
   carrying the sinusoidal current I(s) = amp·e^{j·phase}·sin(k(len/2 − |s|)), −len/2 ≤ s ≤ len/2 (Balanis §4.5).
   amp is the crest of the standing wave (I_m), not the feed current; the feed current is amp·sin(π·len).
   Far field of one element at angle ψ from its axis: E_θ = jη·I_m·e^{−jkr}/(2πr)·F(ψ),
     F(ψ) = [cos(π·len·cos ψ) − cos(π·len)] / sin ψ   (Balanis eq. 4-58a).
   field() drops the common factor jη·e^{−jkr}/(2πr); the power intensity is then U = η/(8π²)·|E|² per unit I_m². */
(function (root) {
  'use strict';

  var ETA0 = 376.730313668;      // Ω, μ0·c (CODATA 2018)
  var TWO_PI = 2 * Math.PI;
  var EPS = 1e-12;

  /** Rounding residue and −0 become exact zeros (sin π = 1.2e-16 is 0). */
  function snap(x) { return Math.abs(x) < EPS ? 0 : x; }
  function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

  /** The current at s (λ) from the centre of an element of length len (λ), over its crest: sin(2π(len/2 − |s|)).
      0 outside the wire; exactly 0 at the ends. */
  function current(len, s) {
    var d = len / 2 - Math.abs(s);
    if (d < 0) return 0;
    return snap(Math.sin(TWO_PI * d));
  }

  /** The feed current over the crest, signed: sin(π·len). Exactly 0 at whole wavelengths (tie-break). */
  function feedCurrent(len) { return snap(Math.sin(Math.PI * len)); }

  /** The far-field factor F at angle ψ from the element's axis, given cos ψ. Along the axis (sin ψ = 0) it is exactly 0,
      its limit. */
  function elementFactor(len, cosPsi) {
    var c = Math.max(-1, Math.min(1, cosPsi));
    var s = Math.sqrt(Math.max(0, 1 - c * c));
    if (s < EPS) return 0;
    var a = Math.PI * len;
    return (Math.cos(a * c) - Math.cos(a)) / s;
  }

  /** The complex far-field vector of a set of elements in the direction r̂ (unit): Σ I·F(ψ)·(−t/|t|)·e^{jk·pos·r̂}, t the
      element's transverse part â − (â·r̂)r̂ (−t/|t| is θ̂ for an element along z). Returns [[re, im] × 3]. */
  function field(elements, rhat) {
    var out = [[0, 0], [0, 0], [0, 0]];
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i], a = el.dir, ca = dot3(a, rhat);
      var t = [a[0] - ca * rhat[0], a[1] - ca * rhat[1], a[2] - ca * rhat[2]];
      var tn = Math.sqrt(dot3(t, t));
      if (tn < EPS) continue;                                       // along this element's axis: no field from it
      var f = elementFactor(el.len, ca);
      var ph = (el.phase || 0) * Math.PI / 180 + TWO_PI * dot3(el.pos || [0, 0, 0], rhat);
      var amp = (el.amp === undefined ? 1 : el.amp) * f / tn;           // amp 0 is a silent element, not 1
      var re = amp * Math.cos(ph), im = amp * Math.sin(ph);
      for (var k = 0; k < 3; k++) { out[k][0] -= re * t[k]; out[k][1] -= im * t[k]; }
    }
    return out;
  }

  /** |E|² of a complex vector from field(). */
  function norm2(e) { return e[0][0] * e[0][0] + e[0][1] * e[0][1] + e[1][0] * e[1][0] + e[1][1] * e[1][1] + e[2][0] * e[2][0] + e[2][1] * e[2][1]; }

  /** ∫₀^π F(θ)² sin θ dθ for one element, Simpson's rule with n (even) intervals. λ/2: Cin(2π)/2 = 1.2188. */
  function axialIntegral(len, n) {
    n = n || 2000;
    if (n % 2) n += 1;
    var h = Math.PI / n, sum = 0;
    for (var i = 0; i <= n; i++) {
      var th = i * h, f = elementFactor(len, Math.cos(th));
      var w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
      sum += w * f * f * Math.sin(th);
    }
    return sum * h / 3;
  }

  /** ∫|E|² dΩ over the sphere for any set of elements: Simpson in θ (nTheta even), midpoint in φ. */
  function sphereIntegral(elements, nTheta, nPhi) {
    nTheta = nTheta || 360; nPhi = nPhi || 72;
    if (nTheta % 2) nTheta += 1;
    var h = Math.PI / nTheta, dphi = TWO_PI / nPhi, sum = 0;
    for (var i = 0; i <= nTheta; i++) {
      var th = i * h, st = Math.sin(th), ct = Math.cos(th);
      var w = i === 0 || i === nTheta ? 1 : i % 2 ? 4 : 2, ring = 0;
      if (st > 0) {
        for (var j = 0; j < nPhi; j++) {
          var ph = (j + 0.5) * dphi;
          ring += norm2(field(elements, [st * Math.cos(ph), st * Math.sin(ph), ct]));
        }
      }
      sum += w * ring * dphi * st;
    }
    return sum * h / 3;
  }

  /** Radiation resistance referred to the crest current I_m of one element: 2P/I_m² = η/(2π)·∫F² sin θ dθ
      (Balanis eq. 4-70a in closed form). */
  function resistanceAtCrest(len, n) { return ETA0 / TWO_PI * axialIntegral(len, n); }

  /** The same for any set of elements, referred to a unit crest current: η/(4π²)·∫|E|² dΩ. */
  function resistanceOf(elements, nTheta, nPhi) { return ETA0 / (4 * Math.PI * Math.PI) * sphereIntegral(elements, nTheta, nPhi); }

  /** One element's pattern in a plane through its axis: F at angles θ from the axis, 0 … 180° every step degrees. */
  function patternCut(len, step) {
    step = step || 1;
    var out = [];
    for (var i = 0; i * step <= 180 + 1e-9; i++) {
      var th = i * step;
      out.push({ theta: th, f: elementFactor(len, Math.cos(th * Math.PI / 180)) });
    }
    return out;
  }

  /** The index of the main lobe among samples f2 at angles thetas (degrees): the largest; equal ones (within a relative
      1e-9) go to the angle closer to broadside, 90° (tie-break). */
  function pickMain(thetas, f2) {
    var best = -1, bi = 0;
    for (var i = 0; i < f2.length; i++) {
      var closer = Math.abs(90 - thetas[i]) < Math.abs(90 - thetas[bi]);
      if (best < 0 || f2[i] > best * (1 + 1e-9) || (f2[i] >= best * (1 - 1e-9) && closer)) { best = f2[i]; bi = i; }
    }
    return bi;
  }

  /** Directivity of one element and its main lobe, from F on a grid of step degrees (default 0.05°):
      D = 2·F_max² / ∫F² sin θ dθ (Balanis eq. 4-75). The main lobe is reported as the angle from the wire in 0 … 90°;
      equal peaks (within a relative 1e-9) go to the one closer to broadside (tie-break). Also the half-power
      beamwidth of the main lobe and the strongest side lobe relative to the main one (dB, null when there is none). */
  function directivity(len, step, n) {
    step = step || 0.05;
    var cut = patternCut(len, step), f2 = cut.map(function (q) { return q.f * q.f; });
    var bi = pickMain(cut.map(function (q) { return q.theta; }), f2), best = f2[bi], i;
    var integ = axialIntegral(len, n);
    var d = best > 0 && integ > 0 ? 2 * best / integ : 0;
    // half-power beamwidth: walk out from the peak to the first samples below half on each side
    var lo = bi, hi = bi;
    while (lo > 0 && f2[lo] >= best / 2) lo--;
    while (hi < f2.length - 1 && f2[hi] >= best / 2) hi++;
    var hp = function (j, k) {                 // linear interpolation of the half-power crossing between samples j and k
      var a = f2[j], b = f2[k], target = best / 2;
      return a === b ? cut[j].theta : cut[j].theta + (cut[k].theta - cut[j].theta) * (target - a) / (b - a);
    };
    var bw = hp(hi - 1, hi) - hp(lo + 1, lo);
    // the strongest local maximum below the main lobe's level
    var side = 0;
    for (i = 1; i < f2.length - 1; i++) {
      if (f2[i] > f2[i - 1] && f2[i] >= f2[i + 1] && f2[i] < best * (1 - 1e-9) && f2[i] > side) side = f2[i];
    }
    var main = cut[bi].theta;
    if (bi > 0 && bi < f2.length - 1 && Math.abs(main - 90) > 1e-9) {   // off broadside: a parabola through three samples
      var den = f2[bi - 1] - 2 * f2[bi] + f2[bi + 1];
      if (den < 0) main += 0.5 * step * (f2[bi - 1] - f2[bi + 1]) / den;
    }
    return {
      d: d, fmax: Math.sqrt(best), integral: integ,
      main: snap(Math.min(main, 180 - main)), mainTheta: main,
      beamwidth: bw, sideDb: side > best * 1e-12 ? 10 * Math.log10(side / best) : null
    };
  }

  var api = {
    ETA0: ETA0, snap: snap, dot3: dot3, current: current, feedCurrent: feedCurrent, elementFactor: elementFactor,
    field: field, norm2: norm2, axialIntegral: axialIntegral, sphereIntegral: sphereIntegral,
    resistanceAtCrest: resistanceAtCrest, resistanceOf: resistanceOf, patternCut: patternCut, pickMain: pickMain, directivity: directivity
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.SimdeckModels = root.SimdeckModels || {})['current-pattern'] = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
