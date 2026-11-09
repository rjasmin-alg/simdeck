/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for accelerated-charge: why an accelerated charge radiates (field lines that kink).
   A point charge moves along a straight wire (the z axis). Its electric field at a point P and time t is the exact
   Liénard–Wiechert field of the charge at the retarded time t_r, when c·(t − t_r) = |P − w(t_r)| (SPEC.md §2); with c
   infinite it is the Coulomb field of where the charge is now. Field lines are traced along that field (§4), and two
   probes on the broadside line read its radial and transverse parts (§5).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Units: metres, nanoseconds, and fields in
   E1 = the charge's own field at 1 m (k·q / (1 m)², so the Coulomb field at r metres is 1/r²).
   The retarded field and the tracer (motionAt, retardedTime, fieldAt, components, traceLine) are pure functions over
   plain data, kept promotable to models/ (catalogue §5.26, model 1); ant-dipole-field reuses them for its probe. */
(function (root) {
  'use strict';

  var C = 0.299792458;          // speed of light, m/ns
  var T0 = 4;                   // ns: when the push (start, stop, move) begins
  var COAST = 12;               // ns: how long the "move" preset coasts between its two pushes
  var T_OSC = 20;               // ns: period of the oscillation (so λ = c·T ≈ 6.0 m)
  var T_END = 45;               // ns: the time slider runs 0 … T_END
  var TIME_STEP = 0.5;          // ns: the time slider's step and the arrow keys' step
  var PROBES = [4, 8];          // m: P1 and P2 on the broadside line (θ = 90°, the +x axis)
  var LINES = 24;               // field lines drawn, every 15°, the first straight up the wire
  var SAMPLE = 0.25;            // ns between samples of the probe series
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

  /** Distance the "move" preset covers: v·(τ + COAST). */
  function moveDistance(p) { p = norm(p); return p.beta * C * (p.tau + COAST); }
  /** Amplitude of the oscillation: the top speed A·ω equals β·c. */
  function oscAmplitude(p) { p = norm(p); return p.beta * C * T_OSC / (2 * Math.PI); }

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

  /** The pushes: each is { begin, end, what } in ns ('start' = from rest to v, 'stop' = from v to rest).
      An oscillating charge accelerates all the time and has none. */
  function pushes(p) {
    p = norm(p);
    if (p.motion === 'osc') return [];
    if (p.motion === 'move') return [{ begin: T0, end: T0 + p.tau, what: 'start' }, { begin: T0 + p.tau + COAST, end: T0 + 2 * p.tau + COAST, what: 'stop' }];
    return [{ begin: T0, end: T0 + p.tau, what: p.motion }];
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

  /** Probe readout at distance r on the broadside line (θ = 90°): radial, transverse and c·B. */
  function probe(p, r, t) {
    var P = [r, 0], E = fieldAt(p, P, t), cp = components(P, E);
    return { r: r, Er: cp.Er, Et: cp.Et, cB: E.cB };
  }

  /** The time window the readout's peak is taken over: one period before t for the oscillation (steady state),
      0 … t for the pushes (what the probes have seen so far). */
  function peakWindow(p) {
    p = norm(p);
    return p.motion === 'osc' ? [p.t - T_OSC, p.t] : [0, p.t];
  }

  /** Largest |E_θ| at a probe over [t0, t1], sampled every SAMPLE ns and at t1; the first of equal maxima wins
      (tie-break, SPEC.md §5). */
  function peakEt(p, r, t0, t1) {
    var best = { Et: 0, t: t0 };
    var n = Math.max(0, Math.floor((t1 - t0) / SAMPLE + 1e-9));
    for (var i = 0; i <= n + 1; i++) {
      var tt = i <= n ? t0 + i * SAMPLE : t1;
      if (tt > t1 + 1e-9) break;
      var e = Math.abs(probe(p, r, tt).Et);
      if (e > best.Et) best = { Et: e, t: tt };
    }
    return best;
  }

  /** Probe series over the whole slider, 0 … T_END, for the plots: [{ t, Er: [P1, P2], Et: [P1, P2] }]. */
  function series(p) {
    var out = [];
    for (var i = 0; i * SAMPLE <= T_END + 1e-9; i++) {
      var tt = i * SAMPLE, a = probe(p, PROBES[0], tt), b = probe(p, PROBES[1], tt);
      out.push({ t: tt, Er: [a.Er, b.Er], Et: [a.Et, b.Et] });
    }
    return out;
  }

  /** The news fronts at time t: for each push, a shell centred where the charge was when it began, from the
      front of its end (inner radius c·(t − end)) to the front of its beginning (outer radius c·(t − begin)).
      A front exists from the instant of its event on (radius 0 at that instant, tie-break SPEC.md §3); before the
      push begins there is no shell. With c infinite there are no fronts: the news is everywhere at once. */
  function fronts(p, t) {
    p = norm(p);
    if (p.c === 'inf') return [];
    return pushes(p).filter(function (q) { return t >= q.begin; }).map(function (q) {
      return { what: q.what, z: motionAt(p, q.begin).z, outer: C * (t - q.begin), inner: Math.max(0, C * (t - q.end)), done: t >= q.end };
    });
  }

  /** Where the first push stands at a probe at distance r: 'none' (no pushes or c infinite), 'before' (its news
      has not arrived), 'inside' (the probe is in a shell now), 'between' (between two shells), 'after'. The shells
      are taken as spheres about the wire's centre for this word only (the charge moves less than 2 m). */
  function stage(p, r, t) {
    var f = fronts(p, t);
    if (norm(p).c === 'inf' || pushes(p).length === 0) return 'none';
    var inside = false, passed = 0;
    for (var i = 0; i < f.length; i++) {
      if (r <= f[i].outer && r > f[i].inner) inside = true;
      if (f[i].done && r <= f[i].inner) passed++;
    }
    if (inside) return 'inside';
    if (passed === 0) return 'before';
    return passed < pushes(p).length ? 'between' : 'after';
  }

  /** When the news of each push reaches distance r (beginning and end of its shell), in ns. */
  function arrivals(p, r) {
    return pushes(p).map(function (q) { return { begin: q.begin + r / C, end: q.end + r / C }; });
  }

  /** One field line from the charge's position now, leaving at angle phi from +z (towards +x for 0 < phi < π).
      Traced along E/|E| with fourth-order Runge–Kutta steps of ds metres until it leaves box = [x0, z0, x1, z1]
      (plus a margin) or reaches maxLen. Returns the points [[x, z], …]. */
  function traceLine(p, t, phi, box, opts) {
    opts = opts || {};
    var ds = opts.ds || 0.05, maxLen = opts.maxLen || 60, eps = opts.eps || 0.12, margin = 0.5;
    var c = speedOf(p), w = motionAt(p, t).z;
    var pt = [eps * Math.sin(phi), w + eps * Math.cos(phi)];
    var pts = [[0, w], pt.slice()];
    function dir(q) {
      var E = fieldAt(p, q, t, c), m = Math.hypot(E.x, E.z);
      return m > 0 && isFinite(m) ? [E.x / m, E.z / m] : null;
    }
    for (var i = 0; i * ds < maxLen - 1e-9; i++) {        // integer steps: exactly maxLen / ds of them
      var k1 = dir(pt); if (!k1) break;
      var k2 = dir([pt[0] + 0.5 * ds * k1[0], pt[1] + 0.5 * ds * k1[1]]); if (!k2) break;
      var k3 = dir([pt[0] + 0.5 * ds * k2[0], pt[1] + 0.5 * ds * k2[1]]); if (!k3) break;
      var k4 = dir([pt[0] + ds * k3[0], pt[1] + ds * k3[1]]); if (!k4) break;
      pt = [pt[0] + ds * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6, pt[1] + ds * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6];
      pts.push(pt.slice());
      if (box && (pt[0] < box[0] - margin || pt[0] > box[2] + margin || pt[1] < box[1] - margin || pt[1] > box[3] + margin)) break;
    }
    return pts;
  }

  /** All LINES field lines, evenly spaced in angle at the charge (the first straight up the wire). */
  function fieldLines(p, t, box, opts) {
    var out = [];
    for (var i = 0; i < LINES; i++) out.push(traceLine(p, t, (2 * Math.PI * i) / LINES, box, opts));
    return out;
  }

  /** State for the page: everything the caption and the readout need (JSON-safe). The page draws the lines with
      fieldLines and the plots with series. */
  function initial(params) {
    var p = norm(Object.assign({}, defaults, params));
    var t = p.t, win = peakWindow(p);
    var probes = PROBES.map(function (r) {
      var q = probe(p, r, t), pk = peakEt(p, r, win[0], win[1]);
      q.peak = pk.Et; q.peakAt = pk.t; q.stage = stage(p, r, t);
      return q;
    });
    var m = motionAt(p, t);
    return {
      t: t, motion: p.motion, inf: p.c === 'inf', beta: p.beta, tau: p.tau,
      z: m.z, v: m.v, a: m.a,
      fronts: fronts(p, t),
      pushes: pushes(p),
      arrivals: PROBES.map(function (r) { return arrivals(p, r); }),
      probes: probes,
      ratioEr: probes[1].Er / probes[0].Er,
      // P2 / P1 of the peaks, once both probes have seen the whole first push; at once for the oscillation;
      // never for a push with c infinite (the charge moves away from both probes: no single power law to show)
      ratioPeak: probes[0].peak > 1e-9 && !(p.c === 'inf' && p.motion !== 'osc') &&
        probes.every(function (q) { return q.stage === 'none' || q.stage === 'between' || q.stage === 'after'; })
        ? probes[1].peak / probes[0].peak : null,
      distance: p.motion === 'move' ? moveDistance(p) : null,
      amplitude: p.motion === 'osc' ? oscAmplitude(p) : null,
      wavelength: C * T_OSC
    };
  }

  /** Presets (the page gives them names): each with what the lecturer should see (SPEC.md §6). */
  var presets = [
    { id: 'start', params: { motion: 'start', c: 'finite', beta: 0.3, tau: 2, t: 22 } },
    { id: 'stop', params: { motion: 'stop', c: 'finite', beta: 0.3, tau: 2, t: 22 } },
    { id: 'move', params: { motion: 'move', c: 'finite', beta: 0.3, tau: 2, t: 34 } },
    { id: 'osc', params: { motion: 'osc', c: 'finite', beta: 0.3, tau: 2, t: 30 } },
    { id: 'oscInf', params: { motion: 'osc', c: 'inf', beta: 0.3, tau: 2, t: 30 } },
    { id: 'startInf', params: { motion: 'start', c: 'inf', beta: 0.3, tau: 2, t: 22 } }
  ];

  var logic = {
    C: C, T0: T0, COAST: COAST, T_OSC: T_OSC, T_END: T_END, TIME_STEP: TIME_STEP, PROBES: PROBES, LINES: LINES,
    SAMPLE: SAMPLE, MOTIONS: MOTIONS,
    defaults: defaults, presets: presets, initial: initial, norm: norm, speedOf: speedOf,
    motionAt: motionAt, pushes: pushes, retardedTime: retardedTime, fieldAt: fieldAt, components: components,
    probe: probe, peakWindow: peakWindow, peakEt: peakEt, series: series, fronts: fronts, stage: stage,
    arrivals: arrivals, traceLine: traceLine, fieldLines: fieldLines, moveDistance: moveDistance, oscAmplitude: oscAmplitude
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
