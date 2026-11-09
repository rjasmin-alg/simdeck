/* SPDX-License-Identifier: AGPL-3.0-or-later
   A short dipole tuned by a loading coil: its feed impedance, wire and coil loss, Q, the SWR around the tuned
   frequency and the band where it stays low, and Chu's limit (catalogue §5.26, shared model 3: the impedance side of a
   set of currents). First written for small-antenna (SPEC.md §3).
   Pure, DOM-free, no strings: registers as SimdeckModels['loaded-antenna'] in a page and is module.exports under node,
   so the coordinator can move it to models/ unchanged. Needs mutual-impedance.js (Si, Ci, the self impedance), copied
   unchanged from sims/yagi/mutual-impedance.js @ 917467e.

   Units: frequencies in Hz, resistances in Ω, the dipole's length and radius in wavelengths at the frequency in
   question unless a name ends in M (metres). Complex numbers are [re, im]. */
(function (root) {
  'use strict';

  var MI = typeof module === 'object' && module.exports
    ? require('./mutual-impedance.js')
    : root.SimdeckModels['mutual-impedance'];

  var C0 = 299792458;                 // m/s
  var MU0 = 4e-7 * Math.PI;           // H/m (the pre-2019 exact value; the 2019 one differs in the 10th digit)
  var SIGMA_CU = 5.8e7;               // S/m, copper (IACS)
  var GAMMA_ONE = 1e-12;              // |Γ| within this of 1: the SWR is null, ∞ (tie-break 6)

  /** The feed impedance of a thin centre-fed dipole, length len and radius a (both in λ): the self impedance referred
      to the crest current (Balanis 8-60a/b, mutual-impedance.js) over sin²(π·len), the feed current squared. */
  function dipoleImpedance(len, a) {
    var z = MI.selfImpedance(len, a), s2 = Math.pow(Math.sin(Math.PI * len), 2);
    return [z[0] / s2, z[1] / s2];
  }

  /** Surface resistance √(π·f·μ₀/σ) of a good conductor (the skin effect). */
  function surfaceResistance(f, sigma) { return Math.sqrt(Math.PI * f * MU0 / (sigma || SIGMA_CU)); }

  /** The wire's ohmic loss referred to the feed, for the sinusoidal current: R_s/(2π·a)·∫I² ds / I_feed²
      = R_s/(2π·a)·[len/2 − sin(2π·len)/(4π)] / sin²(π·len); len and a in λ, so R_s/(2π·a) is per wavelength. */
  function wireLoss(len, a, rs) {
    var integ = len / 2 - Math.sin(2 * Math.PI * len) / (4 * Math.PI);
    return rs / (2 * Math.PI * a) * integ / Math.pow(Math.sin(Math.PI * len), 2);
  }

  /** Chu's lower bound on the Q of any antenna inside a sphere of radius a: 1/(ka)³ + 1/(ka) (Chu 1948, McLean 1996). */
  function chuQ(ka) { return 1 / (ka * ka * ka) + 1 / ka; }

  /** The tuned antenna at f0: o = { len (λ at f0), radiusM, f0, coil (bool), qc (number, or 0/null for lossless) }.
      The coil cancels the reactance at f0 (never negative: tie-break 4); its loss X_L/qc and the wire's loss are held
      at their f0 values over frequency. Returns the f0 numbers and z(f), the impedance at the feed with the coil. */
  function system(o) {
    var f0 = o.f0, lam0 = C0 / f0;
    var z0 = dipoleImpedance(o.len, o.radiusM / lam0);
    var rWire = wireLoss(o.len, o.radiusM / lam0, surfaceResistance(f0, o.sigma));
    var xCoil = o.coil ? Math.max(0, -z0[1]) : 0;
    var rCoil = o.coil && o.qc ? xCoil / o.qc : 0;
    var rIn = z0[0] + rWire + rCoil;
    function z(f) {
      var r = f / f0, za = dipoleImpedance(o.len * r, o.radiusM * f / C0);
      return [za[0] + rWire + rCoil, za[1] + xCoil * r];
    }
    return {
      f0: f0, len: o.len, rRad: z0[0], xAnt: z0[1], rWire: rWire, xCoil: xCoil, rCoil: rCoil, rIn: rIn,
      lCoil: xCoil / (2 * Math.PI * f0), z: z
    };
  }

  /** |Γ|² and the SWR of impedance z after an ideal transformer that turns rIn into the line's impedance:
      Γ = (z/rIn − 1)/(z/rIn + 1). The SWR is null when |Γ| is within 1e-12 of 1 (tie-break 6). */
  function swr(z, rIn) {
    var a = z[0] / rIn, b = z[1] / rIn;
    var g2 = ((a - 1) * (a - 1) + b * b) / ((a + 1) * (a + 1) + b * b), g = Math.sqrt(g2);
    return { gamma2: g2, swr: 1 - g < GAMMA_ONE ? null : (1 + g) / (1 - g) };
  }

  /** Q of the tuned antenna from its impedance: f0·|Z′(f0)|/(2·R_in) (Yaghjian & Best 2005, Q_Z), central difference. */
  function qOf(sys) {
    var h = sys.f0 * 1e-6, a = sys.z(sys.f0 + h), b = sys.z(sys.f0 - h);
    var d = Math.hypot((a[0] - b[0]) / (2 * h), (a[1] - b[1]) / (2 * h));
    return sys.f0 * d / (2 * sys.rIn);
  }

  /** The two frequencies where the SWR is s around f0: the offset doubles from f0·1e-5 until the SWR exceeds s (the last
      offset tried is f0/2 itself), then bisection to f0·1e-9. An edge not found is null (tie-break 7). Returns { lo, hi, bw }. */
  function bandEdges(sys, s) {
    s = s || 2;
    function over(f) { var w = swr(sys.z(f), sys.rIn).swr; return w === null || w > s; }
    function edge(sign) {
      if (over(sys.f0)) return null;
      var near = 0, far = sys.f0 * 1e-5;
      while (!over(sys.f0 + sign * far)) {
        if (far >= sys.f0 / 2) return null;           // f0/2 itself was tested: no edge within it
        near = far; far = Math.min(far * 2, sys.f0 / 2);
      }
      while (far - near > sys.f0 * 1e-9) {
        var mid = (near + far) / 2;
        if (over(sys.f0 + sign * mid)) far = mid; else near = mid;
      }
      return sys.f0 + sign * (near + far) / 2;
    }
    var lo = edge(-1), hi = edge(1);
    return { lo: lo, hi: hi, bw: lo !== null && hi !== null ? hi - lo : null };
  }

  var api = {
    C0: C0, MU0: MU0, SIGMA_CU: SIGMA_CU, GAMMA_ONE: GAMMA_ONE,
    dipoleImpedance: dipoleImpedance, surfaceResistance: surfaceResistance, wireLoss: wireLoss, chuQ: chuQ,
    system: system, swr: swr, qOf: qOf, bandEdges: bandEdges, MI: MI
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.SimdeckModels = root.SimdeckModels || {})['loaded-antenna'] = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
