// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for accelerated-charge (SPEC.md). Run: node --test sims/accelerated-charge/
// Tie-breaks first, then one test per rule, then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const C = L.C;
const P = (over) => Object.assign({}, L.defaults, over);
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b} (±${tol})`);
const rel = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol * Math.abs(b), `${msg || ''} ${a} vs ${b} (±${tol * 100}%)`);

// ── tie-breaks (SPEC.md §1, §3, §5) ──

test('tie-break: a push is [begin, end): its acceleration applies at begin and not at end', () => {
  const p = P({ motion: 'start', beta: 0.3, tau: 2 });
  const a = 0.3 * C / 2;
  assert.equal(L.motionAt(p, L.T0).a, a, 'at begin');
  assert.equal(L.motionAt(p, L.T0 - 1e-9).a, 0, 'just before');
  assert.equal(L.motionAt(p, L.T0 + 2).a, 0, 'at end');
  const s = P({ motion: 'stop', beta: 0.3, tau: 2 });
  assert.equal(L.motionAt(s, L.T0).a, -a);
  assert.equal(L.motionAt(s, L.T0 + 2).a, 0);
  const m = P({ motion: 'move', beta: 0.3, tau: 2 });
  assert.equal(L.motionAt(m, L.T0).a, a, 'first push begins');
  assert.equal(L.motionAt(m, L.T0 + 2).a, 0, 'first push ends');
  assert.equal(L.motionAt(m, L.T0 + 2 + L.COAST).a, -a, 'second push begins');
  assert.equal(L.motionAt(m, L.T0 + 4 + L.COAST).a, 0, 'second push ends');
});

test('tie-break: a front exists from the instant of its event (radius 0), not before', () => {
  const p = P({ motion: 'start' });
  assert.deepEqual(L.fronts(p, L.T0 - 0.5), []);
  const f = L.fronts(p, L.T0);
  assert.equal(f.length, 1);
  assert.equal(f[0].outer, 0);
  assert.equal(f[0].inner, 0);
  assert.equal(f[0].done, false);
  assert.equal(L.fronts(p, L.T0 + 2)[0].done, true, 'done at end');
});

test('tie-break: the first of equal maxima wins; a constant field peaks at the window start', () => {
  const p = P({ motion: 'start', c: 'finite' });
  const k = L.peakEt(p, 4, 0, 3);             // before the push: E_θ is 0 throughout
  assert.equal(k.Et, 0);
  assert.equal(k.t, 0);
  // a static charge with c infinite: the transverse field is 0 at every sample
  const k2 = L.peakEt(P({ motion: 'start', c: 'inf' }), 8, 1, 3.9);
  assert.equal(k2.t, 1);
});

test('tie-break: on the wire axis the transverse direction is +x', () => {
  const c = L.components([0, 5], { x: 1, z: 0 });
  assert.equal(c.Et, 1);
  assert.equal(c.Er, 0);
  const d = L.components([0, -5], { x: 1, z: 0 });
  near(d.Et, -1, 1e-12, 'below the wire θ = 180°, θ̂ = −x');
});

test('normalising: unknown motion is start, anything but inf is finite c, numbers clamped', () => {
  const n = L.norm({ motion: 'spin', c: 'Infinity', beta: 5, tau: -1, t: 'x' });
  assert.equal(n.motion, 'start');
  assert.equal(n.c, 'finite');
  assert.equal(n.beta, 0.6);
  assert.equal(n.tau, 0.5);
  assert.equal(n.t, L.defaults.t);
  assert.equal(L.speedOf({ c: 'inf' }), Infinity);
  assert.equal(L.speedOf({ c: 'finite' }), C);
});

// ── §1 motion ──

test('motion: position and velocity are continuous at every boundary; move ends at +D/2; osc top speed β·c', () => {
  for (const motion of ['start', 'stop', 'move']) {
    const p = P({ motion, beta: 0.3, tau: 2 });
    const edges = L.pushes(p).flatMap((q) => [q.begin, q.end]);
    for (const e of edges) {
      const a = L.motionAt(p, e - 1e-7), b = L.motionAt(p, e);
      near(a.z, b.z, 1e-6, `${motion} z at ${e}`);
      near(a.v, b.v, 1e-6, `${motion} v at ${e}`);
    }
  }
  const m = P({ motion: 'move', beta: 0.3, tau: 2 });
  near(L.motionAt(m, 0).z, -L.moveDistance(m) / 2, 1e-12);
  near(L.motionAt(m, 44).z, L.moveDistance(m) / 2, 1e-12);
  near(L.moveDistance(m), 0.3 * C * 14, 1e-12);
  assert.equal(L.motionAt(P({ motion: 'stop' }), 30).z, 0, 'stop rests at 0');
  const o = P({ motion: 'osc', beta: 0.3 });
  near(L.motionAt(o, 0).v, 0.3 * C, 1e-12, 'osc top speed');
  near(L.oscAmplitude(o), 0.3 * C * 20 / (2 * Math.PI), 1e-12);
  near(L.motionAt(o, 5).z, L.oscAmplitude(o), 1e-12, 'quarter period');
});

// ── §2 retarded time and the field ──

test('retarded time: c·(t − t_r) = |P − w(t_r)| and t_r ≤ t; t itself with c infinite', () => {
  for (const motion of ['start', 'stop', 'move', 'osc']) {
    const p = P({ motion, beta: 0.4 });
    for (const pt of [[4, 0], [0.5, 3], [-7, -5], [0, 6]]) {
      for (const t of [0, 10, 22, 45]) {
        const tr = L.retardedTime(p, pt, t);
        assert.ok(tr <= t);
        const w = L.motionAt(p, tr).z;
        near(C * (t - tr), Math.hypot(pt[0], pt[1] - w), 1e-9, `${motion} ${pt} ${t}`);
      }
    }
  }
  assert.equal(L.retardedTime(P({ c: 'inf' }), [4, 0], 22), 22);
});

test('field: a charge at rest is Coulomb, 1/r², and c·B = 0', () => {
  const p = P({ motion: 'start' });
  for (const r of [4, 8]) {
    const q = L.probe(p, r, 1);
    near(q.Er, 1 / (r * r), 1e-12);
    near(q.Et, 0, 1e-12);
    near(q.cB, 0, 1e-12);
  }
});

test('field: uniform motion points from the present position (Griffiths eq. 10.75)', () => {
  const p = P({ motion: 'start', beta: 0.3, tau: 2 });
  const t = 40, w = L.motionAt(p, t).z, pt = [1, w + 0.5];
  const E = L.fieldAt(p, pt, t);
  const R = Math.hypot(1, 0.5), s2 = 1 / (R * R);
  const mag = (1 - 0.09) / Math.pow(1 - 0.09 * s2, 1.5) / (R * R);
  near(E.x, mag * 1 / R, 1e-9);
  near(E.z, mag * 0.5 / R, 1e-9);
});

test('field: Thomson\'s kink, E_θ / E_r = a·r·sin θ / c² at small speed (Purcell & Morin app. H)', () => {
  const p = P({ motion: 'start', beta: 0.01, tau: 2 });
  const a = 0.01 * C / 2, r = 50;
  const q = L.probe(p, r, L.T0 + 1 + r / C);       // the probe sees the middle of the push
  rel(q.Et / q.Er, a * r / (C * C), 0.01);
  rel(q.Et, a / (C * C * r), 0.01, 'Larmor field');
});

test('field: the transverse part goes with sin θ (none along the wire, half at 30°)', () => {
  const p = P({ motion: 'start', beta: 0.01, tau: 2 });
  const r = 60, t = L.T0 + 1 + r / C;
  const axis = L.components([0, r], L.fieldAt(p, [0, r], t));
  near(axis.Et, 0, 1e-12, 'on the axis');
  const side = L.probe(p, r, t).Et;
  const pt = [r * Math.sin(Math.PI / 6), r * Math.cos(Math.PI / 6)];
  const at30 = L.components(pt, L.fieldAt(p, pt, L.T0 + 1 + r / C)).Et;
  rel(at30 / side, 0.5, 0.02);
});

test('field: c infinite is the Coulomb field of where the charge is now, with c·B = 0', () => {
  const p = P({ motion: 'start', c: 'inf', beta: 0.3 });
  const t = 20, w = L.motionAt(p, t).z, E = L.fieldAt(p, [4, 0], t);
  const R = Math.hypot(4, w);
  near(E.x, 4 / (R * R * R), 1e-12);
  near(E.z, -w / (R * R * R), 1e-12);
  assert.equal(E.cB, 0);
});

// ── §3 the news travels at c ──

test('news at c: nothing changes at a probe before begin + r/c; the kink arrives (r2 − r1)/c later at P2', () => {
  const p = P({ motion: 'start', beta: 0.3, tau: 2 });
  for (const r of L.PROBES) {
    const before = L.probe(p, r, L.T0 + r / C - 0.05);
    near(before.Et, 0, 1e-12, `quiet before arrival at ${r}`);
    near(before.Er, 1 / (r * r), 1e-12);
    assert.ok(L.probe(p, r, L.T0 + 1 + r / C).Et > 0.05, `kink at ${r}`);
  }
  const k1 = L.peakEt(p, 4, 0, 45), k2 = L.peakEt(p, 8, 0, 45);
  near(k2.t - k1.t, 4 / C, L.SAMPLE + 1e-9, 'delay');
  near(k1.t, L.T0 + 2 + 4 / C, L.SAMPLE, 'peak at the end of the push');
});

test('fronts: radii c·(t − begin) and c·(t − end), centred where the charge was at begin', () => {
  const p = P({ motion: 'move', beta: 0.3, tau: 2 });
  const f = L.fronts(p, 34);
  assert.equal(f.length, 2);
  near(f[0].outer, C * 30, 1e-12);
  near(f[0].inner, C * 28, 1e-12);
  near(f[0].z, -L.moveDistance(p) / 2, 1e-12);
  near(f[1].outer, C * (34 - 18), 1e-12);
  near(f[1].z, L.motionAt(p, 18).z, 1e-12);
  assert.equal(f[1].what, 'stop');
  assert.deepEqual(L.fronts(P({ motion: 'move', c: 'inf' }), 34), [], 'none with c infinite');
  assert.deepEqual(L.fronts(P({ motion: 'osc' }), 34), [], 'none for the oscillation');
});

test('stage words: before, inside, between, after, none', () => {
  const p = P({ motion: 'move', beta: 0.3, tau: 2 });
  assert.equal(L.stage(p, 4, 10), 'before');
  assert.equal(L.stage(p, 4, L.T0 + 1 + 4 / C), 'inside');
  assert.equal(L.stage(p, 4, 25), 'between');
  assert.equal(L.stage(p, 4, 40), 'after');
  assert.equal(L.stage(P({ motion: 'osc' }), 4, 40), 'none');
  assert.equal(L.stage(P({ motion: 'start', c: 'inf' }), 4, 40), 'none');
});

// ── §5 the limits: far field 1/r, radial 1/r², c infinite 1/r³ ──

test('limits: radiated E_θ falls as 1/r, the radial part as 1/r² (oscillation, c finite)', () => {
  const p = P({ motion: 'osc', beta: 0.3 });
  const a = L.peakEt(p, 30, 0, 20).Et, b = L.peakEt(p, 60, 0, 20).Et;
  rel(b / a, 0.5, 0.01, 'E_θ 1/r');
  const k = 2 * Math.PI / (C * 20);
  rel(60 * b, L.oscAmplitude(p) * k * k, 0.01, 'far-field amplitude A·k²');
  const s = L.initial(P({ motion: 'osc', t: 30 }));
  rel(s.ratioEr, 0.25, 0.05, 'E_r 1/r²');
});

test('limits: with c infinite nothing radiates; the oscillating field falls as 1/r³ and c·B = 0', () => {
  const p = P({ motion: 'osc', c: 'inf', beta: 0.3 });
  const a = L.peakEt(p, 8, 0, 20).Et, b = L.peakEt(p, 30, 0, 20).Et;
  rel(b / a, Math.pow(8 / 30, 3), 0.02, 'E_θ 1/r³');
  for (let t = 0; t < 20; t += 1) assert.equal(L.probe(p, 30, t).cB, 0);
  const s = L.initial(P({ motion: 'osc', c: 'inf', t: 30 }));
  rel(s.ratioPeak, 0.125, 0.02);
});

test('limits: the oscillation matches the Hertzian dipole at small speed (Balanis 4-10)', () => {
  const p = P({ motion: 'osc', beta: 0.001 });
  const A = L.oscAmplitude(p), k = 2 * Math.PI / (C * 20);
  for (const r of [4, 8, 30]) {
    const kr = k * r;
    const hertz = A * k ** 3 * Math.sqrt((1 / kr - 1 / kr ** 3) ** 2 + 1 / kr ** 4);
    rel(L.peakEt(p, r, 0, 20).Et, hertz, 0.01, `r ${r}`);
  }
});

test('B: in the far field c·B equals E_θ and the energy flows outward; none with c infinite', () => {
  const p = P({ motion: 'osc', beta: 0.3 });
  let flux = 0;
  for (let t = 0; t < 20; t += 0.25) {
    const q = L.probe(p, 60, t);
    if (Math.abs(q.Et) > 1e-3) rel(q.cB / q.Et, 1, 0.01, `t ${t}`);
    flux += q.Et * q.cB;                         // radial Poynting flux ∝ E_θ·B_φ
  }
  assert.ok(flux > 0, 'outward on average');
  const s = P({ motion: 'start', beta: 0.3 });
  const q = L.probe(s, 8, L.T0 + 1 + 8 / C);
  assert.ok(q.cB > 0.5 * q.Et, 'the kink carries B');
});

// ── §4 field lines ──

test('field lines: with c infinite every line is a straight ray from the present position', () => {
  const p = P({ motion: 'start', c: 'inf', beta: 0.3 });
  const t = 30, w = L.motionAt(p, t).z, lines = L.fieldLines(p, t, [-4, -6, 10, 6]);
  assert.equal(lines.length, L.LINES);
  lines.forEach((ln, i) => {
    const phi = 2 * Math.PI * i / L.LINES;
    for (const q of ln) near(Math.sin(phi) * (q[1] - w) - Math.cos(phi) * q[0], 0, 1e-6, `line ${i}`);
  });
});

test('field lines: after a kick, inside from where the charge is now, outside from where it was', () => {
  const p = P({ motion: 'start', beta: 0.3, tau: 2 });
  const t = 30, f = L.fronts(p, t)[0], lines = L.fieldLines(p, t, [-12, -12, 12, 12]);
  const w = L.motionAt(p, t).z, v = 0.3 * C;
  let outside = 0, inside = 0;
  for (const ln of lines) {
    for (let j = 1; j < ln.length - 1; j++) {
      const q = ln[j], r = Math.hypot(q[0], q[1]);
      const dx = ln[j + 1][0] - ln[j - 1][0], dz = ln[j + 1][1] - ln[j - 1][1], d = Math.hypot(dx, dz);
      if (r > f.outer + 0.5) {                       // radial from the origin
        near((q[0] * dz - q[1] * dx) / (r * d), 0, 0.02, 'outside');
        outside++;
      } else if (r < f.inner - 0.5 && Math.hypot(q[0], q[1] - w) > 0.3) {   // inside the inner front (centred at the origin)
        const rr = Math.hypot(q[0], q[1] - w);       // radial from the present position
        near((q[0] * dz - (q[1] - w) * dx) / (rr * d), 0, 0.02, 'inside');
        inside++;
      }
    }
  }
  assert.ok(outside > 100 && inside > 100, `${outside} ${inside}`);
  assert.ok(v > 0);
});

test('field lines: φ and −φ are mirror images', () => {
  const p = P({ motion: 'osc', beta: 0.3 });
  const a = L.traceLine(p, 13, Math.PI / 3, [-8, -6, 8, 6]), b = L.traceLine(p, 13, 2 * Math.PI - Math.PI / 3, [-8, -6, 8, 6]);
  assert.equal(a.length, b.length);
  a.forEach((q, i) => { near(q[0], -b[i][0], 1e-9); near(q[1], b[i][1], 1e-9); });
});

test('peak window: the last period for the oscillation, 0 … t for the pushes', () => {
  assert.deepEqual(L.peakWindow(P({ motion: 'osc', t: 30 })), [10, 30]);
  assert.deepEqual(L.peakWindow(P({ motion: 'move', t: 30 })), [0, 30]);
  assert.deepEqual(L.peakWindow(P({ motion: 'start', c: 'inf', t: 12 })), [0, 12]);
});

test('stop: before the push the charge coasts, z = −vτ/2 − v·(T0 − t), and far lines point from where it would be', () => {
  const p = P({ motion: 'stop', beta: 0.3, tau: 2 });
  const v = 0.3 * C;
  near(L.motionAt(p, 0).z, -v - v * L.T0, 1e-12);
  near(L.motionAt(p, -20).z, -v - v * (L.T0 + 20), 1e-12);
  // outside the outer front, the field points from the extrapolated position z = v·(t − T0 − τ/2)
  const t = 22, zx = v * (t - L.T0 - 1), pt = [8, 3];
  const E = L.fieldAt(p, pt, t);
  near(Math.atan2(E.z, E.x), Math.atan2(pt[1] - zx, pt[0]), 1e-9);
});

test('B: c·B is (𝓇̂ × E)_y from the retarded position; for uniform motion c·B = β·E_x (B = v × E / c²)', () => {
  const p = P({ motion: 'start', beta: 0.3, tau: 2 });
  const t = 40, w = L.motionAt(p, t).z, E = L.fieldAt(p, [1, w + 0.5], t);
  near(E.cB, 0.3 * E.x, 1e-9, 'uniform motion');
  const q = [3, 2], F = L.fieldAt(p, q, 19), wr = L.motionAt(p, F.tr).z;
  const R = Math.hypot(q[0], q[1] - wr), nx = q[0] / R, nz = (q[1] - wr) / R;
  near(F.cB, nz * F.x - nx * F.z, 1e-12, 'in the shell');
  near(L.probe(P({ motion: 'start', t: 45 }), 4, 45).cB, L.fieldAt(p, [4, 0], 45).cB, 1e-12);
});

test('arrivals: the news of each push reaches r at begin + r/c and ends at end + r/c', () => {
  const p = P({ motion: 'move', beta: 0.3, tau: 2 });
  const a = L.arrivals(p, 4);
  near(a[0].begin, L.T0 + 4 / C, 1e-12);
  near(a[0].end, L.T0 + 2 + 4 / C, 1e-12);
  near(a[1].begin, L.T0 + 2 + L.COAST + 4 / C, 1e-12);
  assert.equal(a.length, 2);
  assert.deepEqual(L.arrivals(P({ motion: 'osc' }), 4), []);
});

test('pushes: what each push is', () => {
  assert.deepEqual(L.pushes(P({ motion: 'start' })).map((q) => q.what), ['start']);
  assert.deepEqual(L.pushes(P({ motion: 'stop' })).map((q) => q.what), ['stop']);
  assert.deepEqual(L.pushes(P({ motion: 'move' })).map((q) => q.what), ['start', 'stop']);
  assert.deepEqual(L.pushes(P({ motion: 'osc' })), []);
});

test('ratio rule: no P2/P1 peak ratio while a probe is inside a shell or before it, nor for a push with c infinite', () => {
  const inside = L.initial(P({ motion: 'start', t: 31.5 }));
  assert.equal(inside.probes[1].stage, 'inside');
  assert.equal(inside.ratioPeak, null);
  assert.equal(L.initial(P({ motion: 'start', t: 22 })).ratioPeak, null);
  assert.ok(L.initial(P({ motion: 'start', t: 34 })).ratioPeak > 0.4);
  assert.equal(L.initial(P({ motion: 'start', c: 'inf', t: 40 })).ratioPeak, null);
  assert.ok(L.initial(P({ motion: 'osc', c: 'inf', t: 1 })).ratioPeak > 0.1);
});

test('peak: sampled every 0.25 ns and at t itself', () => {
  assert.equal(L.SAMPLE, 0.25);
  const p = P({ motion: 'start', beta: 0.3, tau: 2 });
  const k = L.peakEt(p, 4, 0, 19.3);          // E_θ still rising at 19.3 ns: the sample at t wins
  assert.equal(k.t, 19.3);
  const k2 = L.peakEt(p, 4, 0, 19.2);
  assert.equal(k2.t, 19.2);
});

test('series: every 0.25 ns over 0 … 45 ns, the probe values in order [P1, P2]', () => {
  const p = P({ motion: 'osc' }), sr = L.series(p);
  assert.equal(L.T_END, 45);
  assert.equal(L.TIME_STEP, 0.5);
  assert.equal(sr.length, 181);
  assert.equal(sr[180].t, 45);
  const q = sr[37], a = L.probe(p, 4, q.t), b = L.probe(p, 8, q.t);
  assert.deepEqual(q.Et, [a.Et, b.Et]);
  assert.deepEqual(q.Er, [a.Er, b.Er]);
});

test('field lines: 24, the first straight up; start 0.12 m out; 0.05 m RK4 steps; stop past the box or at 60 m', () => {
  assert.equal(L.LINES, 24);
  const p = P({ motion: 'osc', beta: 0.3 }), t = 13, w = L.motionAt(p, t).z, box = [-8, -6, 10, 6];
  const lines = L.fieldLines(p, t, box);
  assert.equal(lines.length, 24);
  near(lines[0][5][0], 0, 1e-9, 'the first line runs up the wire');
  const ln = L.traceLine(p, t, 1.2, box);
  assert.deepEqual(ln[0], [0, w]);
  near(Math.hypot(ln[1][0], ln[1][1] - w), 0.12, 1e-12, 'seed radius');
  for (let i = 2; i < ln.length; i++) near(Math.hypot(ln[i][0] - ln[i - 1][0], ln[i][1] - ln[i - 1][1]), 0.05, 2e-3, 'step');
  const last = ln[ln.length - 1], prev = ln[ln.length - 2];
  const out = (q, m) => q[0] < box[0] - m || q[0] > box[2] + m || q[1] < box[1] - m || q[1] > box[3] + m;
  assert.ok(out(last, 0.5) && !out(prev, 0.5), 'stops at the first point past the box plus 0.5 m');
  const free = L.traceLine(p, t, 1.2, null);
  assert.equal(free.length, 2 + Math.ceil(60 / 0.05 - 1e-9), 'no box: 60 m of line');
  // RK4: a ten times finer trace agrees to 1e-3 m after 8 m of line in the smooth field of the oscillation
  const fine = L.traceLine(p, t, 1.2, box, { ds: 0.005 });
  near(Math.hypot(ln[160][0] - fine[1 + 1590][0], ln[160][1] - fine[1 + 1590][1]), 0, 1e-3);
});

test('presets: the params SPEC.md §6 lists; the state carries the move distance and the amplitude', () => {
  const base = { c: 'finite', beta: 0.3, tau: 2 };
  assert.deepEqual(L.presets.map((x) => [x.id, x.params]), [
    ['start', Object.assign({ motion: 'start' }, base, { t: 22 })],
    ['stop', Object.assign({ motion: 'stop' }, base, { t: 22 })],
    ['move', Object.assign({ motion: 'move' }, base, { t: 34 })],
    ['osc', Object.assign({ motion: 'osc' }, base, { t: 30 })],
    ['oscInf', Object.assign({ motion: 'osc' }, base, { c: 'inf', t: 30 })],
    ['startInf', Object.assign({ motion: 'start' }, base, { c: 'inf', t: 22 })]
  ]);
  near(L.initial(P({ motion: 'move' })).distance, L.moveDistance(P({})), 1e-12);
  near(L.initial(P({ motion: 'osc' })).amplitude, L.oscAmplitude(P({})), 1e-12);
  assert.equal(L.norm({ tau: 9 }).tau, 8);
  assert.equal(L.norm({ tau: 7 }).tau, 7);
});

// ── §6 presets: what each shows ──

test('presets: each shows what SPEC.md §6 says', () => {
  const s = (id) => L.initial(L.presets.find((x) => x.id === id).params);
  const start = s('start');
  assert.deepEqual(start.probes.map((q) => q.stage), ['after', 'before']);
  near(start.fronts[0].outer, 5.4, 0.01);
  assert.equal(start.ratioPeak, null, 'no ratio until P2 has seen the push');
  const stop = s('stop');
  assert.deepEqual(stop.probes.map((q) => q.stage), ['after', 'before']);
  const move = s('move');
  assert.deepEqual(move.probes.map((q) => q.stage), ['after', 'between']);
  near(move.ratioPeak, 0.48, 0.03);
  const osc = s('osc');
  near(osc.ratioPeak, 0.5, 0.03);
  near(osc.ratioEr, 0.25, 0.02);
  near(s('oscInf').ratioPeak, 0.125, 0.005);
  assert.equal(s('oscInf').probes[1].cB, 0);
  const si = s('startInf');
  assert.equal(si.fronts.length, 0);
  assert.equal(si.ratioPeak, null);
  assert.deepEqual(si.probes.map((q) => q.stage), ['none', 'none']);
  assert.equal(L.presets.length, 6);
});

test('the whole push at t = 45: E_θ peak at 8 m is about half that at 4 m', () => {
  const st = L.initial(P({ motion: 'start', t: 45 }));
  near(st.ratioPeak, 0.47, 0.02);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const pr of [{ params: {} }].concat(L.presets)) {
    const s = L.initial(P(pr.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ motion: 'move', t: 30 });
  const copy = structuredClone(p);
  assert.deepEqual(L.initial(p), L.initial(p));
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has a name in both languages', () => {
  for (const pr of L.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in L.defaults, `${pr.id}: ${k}`);
    const key = 'preset_' + pr.id;
    assert.ok(strings.hr[key] && strings.en[key], key);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
});
