/* SPDX-License-Identifier: AGPL-3.0-or-later
   An antenna above a flat ground (catalogue §5.26, shared model 3: the pattern of a set of currents, "an element plus its
   image"), first written for ground-image (SPEC.md §2).
   Pure, DOM-free, no strings: registers as SimdeckModels['ground'] in a page and is module.exports under node, so the
   coordinator can move it to models/ next to current-pattern.js and array-factor.js unchanged.

   The ground is a mirror. Over a perfect conductor the field above it is the antenna's plus that of its image, as deep
   below the ground as the antenna is above it: a horizontal current's image flows the other way, a vertical one's the
   same way (Balanis §4.7–4.8). Over a real ground the reflected wave is the image's field times the plane-wave
   (Fresnel) reflection coefficient relative to a perfect ground, taken separately for the part polarized across the
   plane of incidence (TE, "horizontal") and in it (TM, "vertical"): the reflection-coefficient model, far field only,
   no ground (surface) wave.

   Units: lengths in wavelengths (k = 2π). Directions above the ground by elevation Δ (0 on the horizon, π/2 straight
   up) and azimuth φ from the horizontal wire (x). Field factors as in current-pattern.js: the common factor
   jη·e^{−jkr}/(2πr) dropped, so U = η/(8π²)·|E|² for a unit crest current, and a power integral ∫|E|² dΩ is a resistance
   times 4π²/η. The antennas:
     'horizontal'  a half-wave dipole along x, its centre at height h;
     'vertical'    a half-wave dipole along z, its centre at height h (h ≥ 1/4: the lower end on or above the ground);
     'groundplane' a quarter-wave rod on the ground (0 … λ/4) over a ground plane of radials. */
(function (root) {
  'use strict';

  var node = typeof module === 'object' && module.exports;
  var CP = node ? require('./current-pattern.js') : root.SimdeckModels['current-pattern'];
  var AF = node ? require('./array-factor.js') : root.SimdeckModels['array-factor'];

  var TWO_PI = 2 * Math.PI;
  var EPS = 1e-12;

  // ── complex numbers as [re, im] ──
  function cmul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
  function cdiv(a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }
  function cabs2(a) { return a[0] * a[0] + a[1] * a[1]; }
  /** The principal square root (real part ≥ 0): in a lossy ground (Im ε < 0) it is the wave that decays downwards. */
  function csqrt(a) {
    var m = Math.sqrt(Math.sqrt(cabs2(a))), th = Math.atan2(a[1], a[0]) / 2;
    return [m * Math.cos(th), m * Math.sin(th)];
  }

  /** The relative complex permittivity of a ground: ε_r − j·60·σ·λ = ε_r − j·18000·σ/f (σ in S/m, f in MHz). */
  function permittivity(er, sigma, fMHz) { return [er, -18000 * sigma / fMHz]; }

  /** The Fresnel reflection coefficients of a plane wave meeting the ground at grazing angle delta (radians) (Balanis
      eq. 4-125, 4-128 *(check eq. numbers)*): gh across the plane of incidence (TE), gv in it (TM),
        Γh = (sin Δ − √(ε − cos²Δ)) / (sin Δ + √(ε − cos²Δ)),   Γv = (ε·sin Δ − √(ε − cos²Δ)) / (ε·sin Δ + √(ε − cos²Δ)).
      eps null is a perfect conductor: Γh = −1, Γv = +1, the signs of a horizontal and a vertical current's image.
      At grazing (Δ = 0) every real ground gives −1 for both. */
  function fresnel(eps, delta) {
    if (!eps) return { gh: [-1, 0], gv: [1, 0] };
    var sd = Math.sin(delta), c = Math.cos(delta);
    var root = csqrt([eps[0] - c * c, eps[1]]);
    var es = [eps[0] * sd, eps[1] * sd];
    return {
      gh: cdiv([sd - root[0], -root[1]], [sd + root[0], root[1]]),
      gv: cdiv([es[0] - root[0], es[1] - root[1]], [es[0] + root[0], es[1] + root[1]])
    };
  }

  /** The reflection relative to a perfect ground, the factor on the image's field: rh = −Γh (TE), rv = Γv (TM). Both are
      1 over a perfect ground; on a real one |r| < 1, and rv → −1 at grazing. */
  function reflect(eps, delta) {
    if (!eps) return { rh: [1, 0], rv: [1, 0] };
    var f = fresnel(eps, delta);
    return { rh: [-f.gh[0], -f.gh[1]], rv: f.gv };
  }

  /** The far-field factor of a quarter-wave rod on the ground (0 … λ/4, current sin(k(λ/4 − z))), on θ̂, at u = cos θ
      (θ from the zenith; u = sin Δ above the ground): A(u) = (e^{jπu/2} − j·u) / (2·sin θ), complex. Its image (the
      rod mirrored, current the same way) is A(−u) = conj A(u); together cos(πu/2)/sin θ, the half-wave dipole's F.
      Along the rod (sin θ = 0) exactly 0, its limit. */
  function rodFactor(u) {
    var s = Math.sqrt(Math.max(0, 1 - u * u));
    if (s < 1e-7) return [0, 0];
    var a = Math.PI * u / 2;
    return [Math.cos(a) / (2 * s), (Math.sin(a) - u) / (2 * s)];
  }

  /** The unit vectors of a direction above the ground: r̂, θ̂ (in the plane of incidence, towards the ground) and φ̂
      (horizontal, across it). */
  function frame(delta, phi) {
    var cd = Math.cos(delta), sd = Math.sin(delta), cp = Math.cos(phi), sp = Math.sin(phi);
    return { r: [cd * cp, cd * sp, sd], th: [sd * cp, sd * sp, -cd], ph: [-sp, cp, 0] };
  }
  function proj(e, v) {                       // a complex 3-vector from current-pattern.js field() on a real unit vector
    return [e[0][0] * v[0] + e[1][0] * v[1] + e[2][0] * v[2], e[0][1] * v[0] + e[1][1] * v[1] + e[2][1] * v[2]];
  }

  /** The antenna and its image over a perfect ground as current-pattern.js elements (not the ground plane's rod). */
  function elements(ant, h) {
    if (ant === 'horizontal') {
      return { direct: [{ len: 0.5, pos: [0, 0, h], dir: [1, 0, 0], amp: 1, phase: 0 }],
        image: [{ len: 0.5, pos: [0, 0, -h], dir: [1, 0, 0], amp: 1, phase: 180 }] };
    }
    return { direct: [{ len: 0.5, pos: [0, 0, h], dir: [0, 0, 1], amp: 1, phase: 0 }],
      image: [{ len: 0.5, pos: [0, 0, -h], dir: [0, 0, 1], amp: 1, phase: 0 }] };
  }

  /** The direct and the perfect image's field in a direction above the ground, each split into its TM (θ̂) and TE (φ̂)
      parts: { dv, dh, iv, ih } complex. */
  function parts(ant, h, delta, phi) {
    var f = frame(delta, phi);
    if (ant === 'groundplane') {
      var a = rodFactor(Math.sin(delta));
      return { dv: a, dh: [0, 0], iv: [a[0], -a[1]], ih: [0, 0] };
    }
    var els = elements(ant, h), ed = CP.field(els.direct, f.r), ei = CP.field(els.image, f.r);
    return { dv: proj(ed, f.th), dh: proj(ed, f.ph), iv: proj(ei, f.th), ih: proj(ei, f.ph) };
  }

  /** In a direction above the ground: |E|² of the direct wave plus the reflected one (e2), and the power density the
      ground takes from the matching downward wave (lost: (1 − |Γ|²) of each part; 0 over a perfect ground). */
  function at(ant, h, eps, delta, phi) {
    var q = parts(ant, h, delta, phi);
    if (!eps) {
      var v = [q.dv[0] + q.iv[0], q.dv[1] + q.iv[1]], w = [q.dh[0] + q.ih[0], q.dh[1] + q.ih[1]];
      return { e2: cabs2(v) + cabs2(w), lost: 0 };
    }
    var r = reflect(eps, delta), rv = cmul(r.rv, q.iv), rh = cmul(r.rh, q.ih);
    var tv = [q.dv[0] + rv[0], q.dv[1] + rv[1]], th = [q.dh[0] + rh[0], q.dh[1] + rh[1]];
    return {
      e2: cabs2(tv) + cabs2(th),
      lost: (1 - cabs2(r.rv)) * cabs2(q.iv) + (1 - cabs2(r.rh)) * cabs2(q.ih)
    };
  }

  /** ∫ over the upper hemisphere of e2 (sky) and of lost, dΩ: Simpson in Δ (nD even), and for the horizontal dipole a
      midpoint rule in φ over a quarter turn (its pattern is mirror-symmetric about both vertical planes); the vertical
      antennas are the same all round. */
  function hemisphere(ant, h, eps, nD, nPhi) {
    nD = nD || 480; nPhi = nPhi || 18;
    if (nD % 2) nD += 1;
    var step = Math.PI / 2 / nD, sky = 0, lost = 0;
    for (var i = 0; i <= nD; i++) {
      var d = i * step, cd = Math.cos(d), w = i === 0 || i === nD ? 1 : i % 2 ? 4 : 2, s1 = 0, s2 = 0;
      if (cd > EPS) {
        if (ant === 'horizontal') {
          for (var j = 0; j < nPhi; j++) {
            var x = at(ant, h, eps, d, (j + 0.5) * (Math.PI / 2) / nPhi);
            s1 += x.e2; s2 += x.lost;
          }
          s1 *= TWO_PI / nPhi; s2 *= TWO_PI / nPhi;           // a quarter turn × 4
        } else {
          var y = at(ant, h, eps, d, 0);
          s1 = TWO_PI * y.e2; s2 = TWO_PI * y.lost;
        }
      }
      sky += w * s1 * cd; lost += w * s2 * cd;
    }
    return { sky: sky * step / 3, lost: lost * step / 3 };
  }

  /** The resistance (Ω, referred to the crest current) of a power integral ∫|E|² dΩ: η/(4π²)·∫. */
  function ohms(integral) { return CP.ETA0 / (4 * Math.PI * Math.PI) * integral; }

  /** The mutual resistance of two collinear half-wave dipoles whose centres are d apart along their axis, referred to
      the crest currents: η/(2π)·∫₀^π F(θ)²·cos(k·d·cos θ)·sin θ dθ (the cross term of their power; Simpson, n
      intervals). d = 0 is the self resistance, 73.08 Ω; ends touching (d = λ/2) 26.40 Ω (Kraus's table *(check)*). */
  function collinearResistance(d, n) {
    n = n || 2000;
    if (n % 2) n += 1;
    var hh = Math.PI / n, sum = 0;
    for (var i = 0; i <= n; i++) {
      var th = i * hh, f = CP.elementFactor(0.5, Math.cos(th)), w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
      sum += w * f * f * Math.cos(TWO_PI * d * Math.cos(th)) * Math.sin(th);
    }
    return CP.ETA0 / TWO_PI * sum * hh / 3;
  }

  /** The feed resistance over a perfect ground by image theory (Ω): the antenna's own plus the mutual resistance with
      its image, 2h away: horizontal R₁₁ − R₁₂(2h) side by side (antiphase), vertical R₁₁ + R₁₂(2h) collinear (in
      phase), the ground plane half a dipole's, R₁₁/2 = 36.54 Ω. */
  function imageResistance(ant, h) {
    var r11 = AF.mutualResistance(0, 0.5);
    if (ant === 'groundplane') return r11 / 2;
    if (ant === 'horizontal') return r11 - AF.mutualResistance(2 * h, 0.5);
    return r11 + collinearResistance(2 * h);
  }

  /** The power balance (SPEC.md §2): sky, lost and the power fed in, as integrals ∫|E|² dΩ.
      The dipoles: what the feed delivers is what reaches the sky plus what the ground takes (the reflected wave also
      acts back on the feed, as the image does over a perfect ground; there the sum is image theory's resistance).
      The ground plane: its radials are a perfect mirror close to the rod, so the feed always sees R₁₁/2; farther out
      the waves reflect off the real ground, and what does not reach the sky is lost in it. */
  function power(ant, h, eps, nD, nPhi) {
    var hs = hemisphere(ant, h, eps, nD, nPhi);
    if (ant === 'groundplane') {
      var fed = Math.PI * CP.axialIntegral(0.5);            // ∫ over the upper half of the half-wave dipole's F²
      var lost = fed - hs.sky;                              // rounding residue over a perfect ground is 0
      return { sky: hs.sky, lost: lost > fed * 1e-9 ? lost : 0, fed: fed };
    }
    return { sky: hs.sky, lost: hs.lost, fed: hs.sky + hs.lost };
  }

  var api = {
    cmul: cmul, cdiv: cdiv, cabs2: cabs2, csqrt: csqrt,
    permittivity: permittivity, fresnel: fresnel, reflect: reflect, rodFactor: rodFactor, frame: frame,
    elements: elements, parts: parts, at: at, hemisphere: hemisphere, ohms: ohms,
    collinearResistance: collinearResistance, imageResistance: imageResistance, power: power, CP: CP, AF: AF
  };

  if (node) module.exports = api;
  else (root.SimdeckModels = root.SimdeckModels || {}).ground = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
