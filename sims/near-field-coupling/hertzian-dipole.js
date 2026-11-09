/* SPDX-License-Identifier: AGPL-3.0-or-later
   Hertzian (short) dipole: the exact near-to-far E and H of an oscillating point dipole and the stream function
   whose contours are its E field lines, with a marching-squares contour tracer (SPEC.md §2–§4).
   Catalogue §5.26, shared model 2: kept as a pure module so the coordinator can promote it to models/ unchanged
   (ant-near-field-coupling builds on it). First written for sims/dipole-field.
   Copied unchanged into sims/near-field-coupling from sims/dipole-field/hertzian-dipole.js @ f87e209 (COMMON.md §6:
   the model is not in models/ yet); this sim uses fieldsAt and phasors, by duality, for a small loop's H.

   Dipole moment p(t) = p0·cos(ωt) along +z. Distances as x = k·r (k = 2π/λ), time as the phase φ = ωt (radians).
   Fields in natural units: E in E_u = p0·k³/(4π·ε0), H in H_u = p0·ω·k²/(4π) = E_u/η0. So E/H in these units times
   η0 (≈ 376.73 Ω) is the wave impedance in ohms.
     E_θ = sin θ·[cos(φ − x)/x³ − sin(φ − x)/x² − cos(φ − x)/x]
     E_r = 2·cos θ·[cos(φ − x)/x³ − sin(φ − x)/x²]
     H_φ = sin θ·[−sin(φ − x)/x² − cos(φ − x)/x]
   (Griffiths, Introduction to Electrodynamics, 4th ed., §11.1.2 and problem 11.4; Balanis, Antenna Theory, 3rd ed.,
   eqs. 4-8a … 4-10c, with I0·l = j·ω·p0.) With c infinite (k → 0 at fixed ω, x kept as a ruler) only the
   instantaneous terms are left: E is the static dipole field of p(t), 1/x³, and H the Biot–Savart field of the
   current, 1/x², a quarter period ahead.
   Stream function Ψ = sin²θ·[cos(φ − x)/x − sin(φ − x)] (c infinite: sin²θ·cos φ / x), with
   E_r = ∂Ψ/∂θ / (x²·sin θ) and E_θ = −∂Ψ/∂x / (x·sin θ): E is tangent to Ψ's contours, so they are its field lines.
   Pure: no DOM, no randomness, no clock. Plain numbers and arrays in, plain JSON out. */
(function (root) {
  'use strict';

  var TAU = 2 * Math.PI;

  /** Instantaneous fields at x = k·r, polar angle theta (from +z), phase phi = ωt: { Er, Et, Hp } in E_u, E_u, H_u. */
  function fieldsAt(x, theta, phi, inf) {
    var s = Math.sin(theta), c = Math.cos(theta);
    if (inf) {
      var x3 = x * x * x;
      return { Er: 2 * c * Math.cos(phi) / x3, Et: s * Math.cos(phi) / x3, Hp: -s * Math.sin(phi) / (x * x) };
    }
    var a = phi - x, ca = Math.cos(a), sa = Math.sin(a);
    return {
      Er: 2 * c * (ca / (x * x * x) - sa / (x * x)),
      Et: s * (ca / (x * x * x) - sa / (x * x) - ca / x),
      Hp: s * (-sa / (x * x) - ca / x)
    };
  }

  /** Complex amplitudes (phasors) on the broadside line, θ = 90°, so that field(t) = Re(A·e^{jφ}):
      { Et: [re, im], Hp: [re, im] }. Finite c: E_θ = e^{−jx}·(1/x³ + j/x² − 1/x), H_φ = e^{−jx}·(j/x² − 1/x).
      Infinite c: E_θ = 1/x³, H_φ = j/x². */
  function phasors(x, inf) {
    if (inf) return { Et: [1 / (x * x * x), 0], Hp: [0, 1 / (x * x)] };
    var cr = Math.cos(x), ci = -Math.sin(x);            // e^{−jx}
    function mul(re, im) { return [cr * re - ci * im, cr * im + ci * re]; }
    return { Et: mul(1 / (x * x * x) - 1 / x, 1 / (x * x)), Hp: mul(-1 / x, 1 / (x * x)) };
  }

  /** Probe on the broadside line at x = k·r: amplitudes |E| and |H| (E_u, H_u), Z = |E|/|H| (in η0), lead = how far
      H leads E in degrees (90 in the reactive near field, 0 in the far field), and the outward power flow averaged
      over a period, S = ½·Re(E_θ·H_φ*) (in E_u·H_u). */
  function probe(x, inf) {
    var ph = phasors(x, inf), e = ph.Et, hh = ph.Hp;
    var E = Math.hypot(e[0], e[1]), H = Math.hypot(hh[0], hh[1]);
    var lead = (Math.atan2(hh[1], hh[0]) - Math.atan2(e[1], e[0])) * 180 / Math.PI;
    lead = ((lead % 360) + 540) % 360 - 180;               // into [−180, 180); for this dipole always 0 … 90
    return { x: x, E: E, H: H, Z: E / H, lead: lead, S: 0.5 * (e[0] * hh[0] + e[1] * hh[1]) };
  }

  /** Stream function Ψ at x = k·r, theta, phase phi. Its contours are the E field lines (see the header). */
  function stream(x, theta, phi, inf) {
    var s2 = Math.sin(theta); s2 *= s2;
    if (inf) return s2 * Math.cos(phi) / x;
    var a = phi - x;
    return s2 * (Math.cos(a) / x - Math.sin(a));
  }

  /** Ψ at a point (X, Z) in wavelengths (X across, Z along the dipole): x = 2π·√(X² + Z²), sin θ = |X|/r. */
  function streamXZ(X, Z, phi, inf) {
    var r = Math.hypot(X, Z);
    if (r === 0) return NaN;
    var s = Math.abs(X) / r;
    return stream(TAU * r, Math.asin(Math.min(1, s)), phi, inf);
  }

  /** The X points (saddles of Ψ) on the broadside line, where a loop pinches off: E_θ = 0 and Ψ has a minimum
      along x where Ψ > 0, or a maximum where Ψ < 0 (it always has the opposite extremum along θ). Searched over
      x0 … x1, ascending x. With c infinite there are none (Ψ = cos φ / x has no critical point). */
  function saddles(phi, inf, x0, x1) {
    if (inf) return [];
    x0 = x0 || 0.05; x1 = x1 || 4 * Math.PI;
    var out = [], n = Math.ceil((x1 - x0) / 0.002);
    function et(x) { return fieldsAt(x, Math.PI / 2, phi, false).Et; }
    var xa = x0, ea = et(xa);
    for (var i = 1; i <= n; i++) {
      var xb = x0 + (x1 - x0) * i / n, eb = et(xb);
      if (ea === 0 || ea * eb < 0) {
        var lo = xa, hi = xb, el = ea;
        for (var k = 0; k < 60 && ea !== 0; k++) {
          var mid = 0.5 * (lo + hi), em = et(mid);
          if (em === 0) { lo = hi = mid; break; }
          if (em * el < 0) hi = mid; else { lo = mid; el = em; }
        }
        var xs = ea === 0 ? xa : 0.5 * (lo + hi);
        // E_θ = −∂Ψ/∂x / x on the equator: E_θ going from − to + means ∂Ψ/∂x goes + to −, a maximum of Ψ along x
        var psi = stream(xs, Math.PI / 2, phi, false), isMax = ea < 0 || (ea === 0 && eb > 0);
        if ((isMax && psi < 0) || (!isMax && psi > 0)) out.push(xs);
      }
      xa = xb; ea = eb;
    }
    return out;
  }

  /** Ψ sampled on a grid in wavelengths: nodes X = x0 + i·d (i = 0 … nx), Z = z0 + j·d (j = 0 … nz). Nodes closer
      than rClip to the dipole are NaN (no lines are drawn there). */
  function grid(spec, phi, inf) {
    var nx = spec.nx, nz = spec.nz, d = spec.d, v = new Array((nx + 1) * (nz + 1));
    for (var j = 0; j <= nz; j++) {
      var Z = spec.z0 + j * d;
      for (var i = 0; i <= nx; i++) {
        var X = spec.x0 + i * d;
        v[j * (nx + 1) + i] = Math.hypot(X, Z) < (spec.rClip || 0) ? NaN : streamXZ(X, Z, phi, inf);
      }
    }
    return { x0: spec.x0, z0: spec.z0, d: d, nx: nx, nz: nz, v: v };
  }

  /** Contour levels: ±(n − ½)·step for n = 1 … count, ascending. Never 0, so no line runs along the axis. */
  function levels(step, count) {
    var out = [];
    for (var n = count; n >= 1; n--) out.push(-(n - 0.5) * step);
    for (n = 1; n <= count; n++) out.push((n - 0.5) * step);
    return out;
  }

  /** Marching squares on a grid for one level, chained into polylines [[X, Z], …] (a closed one ends where it
      began). Tie-breaks (SPEC.md §4): a node equal to the level counts as above it; in a cell whose diagonal corners
      are above and the other two below (a saddle cell), the centre value (the mean of the four) decides: centre
      above, the above corners connect through the cell; centre below, they are cut off. Cells with a NaN corner
      are skipped. */
  function contour(g, level) {
    var nx = g.nx, nz = g.nz, v = g.v, W = nx + 1;
    var pts = {}, adj = {};
    function edgePoint(key) {
      if (pts[key]) return pts[key];
      var node = key >> 1, i = node % W, j = (node - i) / W, va = v[node], vb, p;
      if ((key & 1) === 0) { vb = v[node + 1]; p = [g.x0 + (i + (level - va) / (vb - va)) * g.d, g.z0 + j * g.d]; }
      else { vb = v[node + W]; p = [g.x0 + i * g.d, g.z0 + (j + (level - va) / (vb - va)) * g.d]; }
      pts[key] = p;
      return p;
    }
    function link(a, b) { (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a); }
    for (var j = 0; j < nz; j++) {
      for (var i = 0; i < nx; i++) {
        var n0 = j * W + i, a = v[n0], b = v[n0 + 1], c = v[n0 + W + 1], d = v[n0 + W];
        if (a !== a || b !== b || c !== c || d !== d) continue;                  // NaN corner
        var A = a >= level, B = b >= level, Cc = c >= level, D = d >= level;
        if (A === B && B === Cc && Cc === D) continue;
        var eB = 2 * n0, eR = 2 * (n0 + 1) + 1, eT = 2 * (n0 + W), eL = 2 * n0 + 1;
        var crossed = [];
        if (A !== B) crossed.push(eB);
        if (B !== Cc) crossed.push(eR);
        if (D !== Cc) crossed.push(eT);
        if (A !== D) crossed.push(eL);
        if (crossed.length === 2) { link(crossed[0], crossed[1]); continue; }
        // saddle cell: A and Cc on one side, B and D on the other
        var centreAbove = (a + b + c + d) / 4 >= level;
        if (centreAbove === A) { link(eB, eR); link(eT, eL); }   // A, Cc joined: cut off corners B and D
        else { link(eB, eL); link(eR, eT); }                     // A, Cc cut off
      }
    }
    var seen = {}, lines = [];
    function walk(start) {
      var line = [edgePoint(start)], prev = -1, cur = start;
      seen[cur] = true;
      for (;;) {
        var nb = adj[cur], next = -1;
        for (var k = 0; k < nb.length; k++) if (nb[k] !== prev && !(seen[nb[k]] && nb[k] !== start)) { next = nb[k]; break; }
        if (next < 0) break;
        if (next === start) { if (line.length > 2) line.push(edgePoint(start)); break; }
        seen[next] = true; line.push(edgePoint(next)); prev = cur; cur = next;
      }
      return line;
    }
    var keys = Object.keys(adj).map(Number);
    keys.forEach(function (k) { if (!seen[k] && adj[k].length === 1) lines.push(walk(k)); });   // open lines first
    keys.forEach(function (k) { if (!seen[k]) lines.push(walk(k)); });                         // then the loops
    return lines;
  }

  /** Where the contours cross the broadside line (Z = 0, X from r0 to r1 wavelengths), with the direction of E
      there: { r, level, up } (E_θ > 0 points down on the broadside line, towards −z). Sorted by r. */
  function broadsideCrossings(lvls, phi, inf, r0, r1) {
    var out = [], step = 0.002, n = Math.ceil((r1 - r0) / step);
    function psi(r) { return stream(TAU * r, Math.PI / 2, phi, inf); }
    var ra = r0, pa = psi(ra);
    for (var i = 1; i <= n; i++) {
      var rb = r0 + (r1 - r0) * i / n, pb = psi(rb);
      lvls.forEach(function (L) {
        if ((pa >= L) !== (pb >= L)) {
          var lo = ra, hi = rb, plo = pa;
          for (var k = 0; k < 40; k++) { var m = 0.5 * (lo + hi), pm = psi(m); if ((pm >= L) === (plo >= L)) { lo = m; plo = pm; } else hi = m; }
          var r = 0.5 * (lo + hi);
          out.push({ r: r, level: L, up: fieldsAt(TAU * r, Math.PI / 2, phi, inf).Et < 0 });
        }
      });
      ra = rb; pa = pb;
    }
    return out.sort(function (p, q) { return p.r - q.r; });
  }

  var model = {
    fieldsAt: fieldsAt, phasors: phasors, probe: probe, stream: stream, streamXZ: streamXZ, saddles: saddles,
    grid: grid, levels: levels, contour: contour, broadsideCrossings: broadsideCrossings
  };
  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {})['hertzian-dipole'] = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
