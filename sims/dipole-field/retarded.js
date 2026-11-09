/* SPDX-License-Identifier: AGPL-3.0-or-later
   The retarded (Liénard–Wiechert) field of a point charge moving along a wire, copied unchanged
   from sims/accelerated-charge/sim.js @ 94f3096 (catalogue §5.26, model 1; COMMON.md §6: not yet in models/).
   dipole-field uses it only in its tests, as an independent check of the probe: a charge oscillating against a
   fixed opposite charge, at a small amplitude, is a Hertzian dipole (sim.test.js, "cross-check"). The page does
   not load it. Units as in accelerated-charge: metres, nanoseconds, E in E1 = k·q / (1 m)².
   Pure: no DOM, no randomness, no clock. */
(function (root) {
  'use strict';

  var C = 0.299792458;          // speed of light, m/ns
  var T0 = 4;                   // ns: when the push (start, stop, move) begins
  var COAST = 12;               // ns: how long the "move" preset coasts between its two pushes
  var T_OSC = 20;               // ns: period of the oscillation (so λ = c·T ≈ 6.0 m)
  var MOTIONS = ['start', 'stop', 'move', 'osc'];

  /** Parameters and their defaults. motion: start | stop | move | osc; c: finite | inf; beta = top speed / c;
      tau = how long each push lasts (ns); t = time now (ns). */
  var defaults = { motion: 'start', c: 'finite', beta: 0.3, tau: 2, t: 22 };

  function num(x, lo, hi, d) { x = Number(x); return isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d; }

  /** Params made safe: unknown motion → start, anything but 'inf' is finite c, numbers clamped to their ranges. */
  function norm(p) {
    p = p || {};
    return {
      motion: MOTIONS.indexOf(p.motion) >= 0 ? p.motion : 'start',
      c: p.c === 'inf' ? 'inf' : 'finite',
      beta: num(p.beta, 0.001, 0.6, defaults.beta),
      tau: num(p.tau, 0.5, 8, defaults.tau),
      t: num(p.t, -1e6, 1e6, defaults.t)
    };
  }

  /** The speed of light the model uses: C, or Infinity when the c switch is on "inf". */
  function speedOf(p) { return norm(p).c === 'inf' ? Infinity : C; }

  /** Position z, velocity v and acceleration a of the charge at time t (all along the wire).
      Pushes are constant accelerations on half-open intervals [start, end): at the instant a push starts its
      acceleration already applies, at the instant it ends it no longer does (tie-break, SPEC.md §1). */
  function motionAt(p, t) {
    p = norm(p);
    var v = p.beta * C, tau = p.tau, acc = v / tau, d;
    if (p.motion === 'osc') {
      var w = 2 * Math.PI / T_OSC, A = v / w;
      return { z: A * Math.sin(w * t), v: A * w * Math.cos(w * t), a: -A * w * w * Math.sin(w * t) };
    }
    if (p.motion === 'start') {
      if (t < T0) return { z: 0, v: 0, a: 0 };
      if (t < T0 + tau) { d = t - T0; return { z: 0.5 * acc * d * d, v: acc * d, a: acc }; }
      return { z: 0.5 * v * tau + v * (t - T0 - tau), v: v, a: 0 };
    }
    if (p.motion === 'stop') {
      var T1 = T0 + tau;
      if (t < T0) return { z: -0.5 * v * tau - v * (T0 - t), v: v, a: 0 };
      if (t < T1) { d = T1 - t; return { z: -0.5 * acc * d * d, v: acc * d, a: -acc }; }
      return { z: 0, v: 0, a: 0 };
    }
    // move: start at −D/2, push, coast COAST ns, push back to rest at +D/2
    var D = v * (tau + COAST), z0 = -D / 2, T2 = T0 + tau + COAST;
    if (t < T0) return { z: z0, v: 0, a: 0 };
    if (t < T0 + tau) { d = t - T0; return { z: z0 + 0.5 * acc * d * d, v: acc * d, a: acc }; }
    if (t < T2) return { z: z0 + 0.5 * v * tau + v * (t - T0 - tau), v: v, a: 0 };
    if (t < T2 + tau) { d = t - T2; return { z: z0 + 0.5 * v * tau + v * COAST + v * d - 0.5 * acc * d * d, v: v - acc * d, a: -acc }; }
    return { z: D / 2, v: 0, a: 0 };
  }

  /** Retarded time: the t_r ≤ t with c·(t − t_r) = |P − w(t_r)|. Unique because |v| < c (Griffiths §10.3.1).
      With c infinite it is t itself. Newton's method from t − |P − w(t)|/c; f is monotonic, so it converges. */
  function retardedTime(p, P, t, c) {
    if (c === undefined) c = speedOf(p);
    if (!isFinite(c)) return t;
    var m = motionAt(p, t);
    var tr = t - Math.hypot(P[0], P[1] - m.z) / c;
    for (var i = 0; i < 60; i++) {
      m = motionAt(p, tr);
      var dz = P[1] - m.z, R = Math.hypot(P[0], dz);
      var f = c * (t - tr) - R;                 // zero at the retarded time
      var df = -c + (R > 0 ? (dz / R) * m.v : 0); // d f / d t_r = −c + n·v < 0
      var next = tr - f / df;
      if (next > t) next = t;
      if (Math.abs(next - tr) < 1e-12) { tr = next; break; }
      tr = next;
    }
    return tr;
  }

  /** The electric field at P = [x, z] (m) and time t (ns), in E1, as { x, z, cB, tr }.
      Finite c: the exact Liénard–Wiechert field, Griffiths eq. 10.72,
        E = 𝓇/(𝓇·u)³ · [(c² − v²)·u + 𝓇 × (u × a)],  u = c·𝓇̂ − v,  𝓇 = P − w(t_r),
      and B = 𝓇̂ × E / c (eq. 10.73), returned as c·B along +y (x right, z up: +y points into the page).
      Infinite c: the Coulomb field of the charge where it is now, and c·B = 0 (B = v × E / c² → 0; H = ε0·v × E,
      the Biot–Savart field, stays finite, but the page reads c·B). */
  function fieldAt(p, P, t, c) {
    if (c === undefined) c = speedOf(p);
    if (!isFinite(c)) {
      var m0 = motionAt(p, t), dx = P[0], dz0 = P[1] - m0.z, R0 = Math.hypot(dx, dz0), R3 = R0 * R0 * R0;
      return { x: dx / R3, z: dz0 / R3, cB: 0, tr: t };
    }
    var tr = retardedTime(p, P, t, c), m = motionAt(p, tr);
    var rx = P[0], rz = P[1] - m.z, R = Math.hypot(rx, rz);
    var ux = c * rx / R, uz = c * rz / R - m.v;          // u = c·𝓇̂ − v (v and a are along z)
    var ru = rx * ux + rz * uz;                           // 𝓇·u
    var ra = rz * m.a;                                    // 𝓇·a
    var k = R / (ru * ru * ru), cv = c * c - m.v * m.v;
    // 𝓇 × (u × a) = u·(𝓇·a) − a·(𝓇·u)
    var ex = k * (cv * ux + ux * ra);
    var ez = k * (cv * uz + uz * ra - m.a * ru);
    var nx = rx / R, nz = rz / R;
    return { x: ex, z: ez, cB: nz * ex - nx * ez, tr: tr };
  }

  /** Radial and transverse parts of E at P, about the wire's centre (the origin): E_r along r̂ and E_θ along θ̂
      (θ from the wire, +z). θ̂ points away from the +z end of the wire: down on the broadside line. On the wire's
      axis (x = 0) the transverse direction is taken as the one towards +x (tie-break, SPEC.md §5). */
  function components(P, E) {
    var r = Math.hypot(P[0], P[1]);
    var s = P[0] < 0 ? -1 : 1;
    var sin = Math.abs(P[0]) / r, cos = P[1] / r;
    var rx = s * sin, rz = cos;                // r̂
    var tx = s * cos, tz = -sin;               // θ̂
    return { r: r, Er: E.x * rx + E.z * rz, Et: E.x * tx + E.z * tz };
  }

  var logic = {
    C: C, T0: T0, COAST: COAST, T_OSC: T_OSC, MOTIONS: MOTIONS, defaults: defaults, norm: norm, speedOf: speedOf,
    motionAt: motionAt, retardedTime: retardedTime, fieldAt: fieldAt, components: components
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimRetarded = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
