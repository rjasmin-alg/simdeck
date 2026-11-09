// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for dipole-field (SPEC.md). Run: node --test sims/dipole-field/
// Tie-breaks first, then one test per rule, then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const HD = require('./hertzian-dipole.js');
const R = require('./retarded.js');
const strings = require('./strings.js');

const TAU = 2 * Math.PI;
const ETA0 = L.ETA0;
const P = (over) => Object.assign({}, L.defaults, over);
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b} (±${tol})`);
const rel = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol * Math.abs(b), `${msg || ''} ${a} vs ${b} (±${tol * 100}%)`);
const rad = (deg) => deg * Math.PI / 180;

// A one-cell grid: corners a (bottom left), b (bottom right), c (top right), d (top left), cell size 1.
const cell = (a, b, c, d) => ({ x0: 0, z0: 0, d: 1, nx: 1, nz: 1, v: [a, b, d, c] });
const ends = (line) => [line[0], line[line.length - 1]].map((q) => q.map((v) => Math.round(v * 1000) / 1000));

// ── tie-breaks (SPEC.md §1, §4, §5) ──

test('tie-break: time wraps into [0, 360): 360 is 0, −5 is 355, 725 is 5', () => {
  assert.equal(L.norm({ t: 360 }).t, 0);
  assert.equal(L.norm({ t: -5 }).t, 355);
  assert.equal(L.norm({ t: 725 }).t, 5);
  assert.equal(L.norm({ t: 'x' }).t, L.defaults.t);
  assert.deepEqual(L.initial(P({ t: 360 })), L.initial(P({ t: 0 })));
});

test('tie-break: a zone boundary belongs to the outer zone (λ/2π is mid, λ is far); c infinite is all near', () => {
  assert.equal(L.zoneOf(L.NEAR, false), 'mid');
  assert.equal(L.zoneOf(L.NEAR - 1e-9, false), 'near');
  assert.equal(L.zoneOf(1, false), 'far');
  assert.equal(L.zoneOf(1 - 1e-9, false), 'mid');
  assert.equal(L.zoneOf(1.9, true), 'near');
  near(L.NEAR, 0.159155, 1e-6, 'λ/2π');
});

test('tie-break: a grid node equal to the level counts as above it', () => {
  assert.deepEqual(HD.contour(cell(0.5, 1, 1, 1), 0.5), [], 'all at or above: no line');
  const lines = HD.contour(cell(0.4, 1, 1, 1), 0.5);
  assert.equal(lines.length, 1, 'one corner below: one line');
  assert.deepEqual(ends(lines[0]).sort(), [[0, 0.167], [0.167, 0]]);
});

test('tie-break: a saddle cell is decided by the mean of its corners (equal counts as above)', () => {
  // a and c above, b and d below; mean exactly the level: the above corners connect, b and d are cut off
  let lines = HD.contour(cell(1, 0, 1, 0), 0.5).map(ends).map((e) => e.sort());
  assert.equal(lines.length, 2);
  assert.deepEqual(lines.sort(), [[[0, 0.5], [0.5, 1]], [[0.5, 0], [1, 0.5]]], 'cuts around b (bottom right) and d (top left)');
  // mean below the level: a and c are cut off
  lines = HD.contour(cell(1, 0, 0.9, 0), 0.5).map(ends).map((e) => e.sort());
  assert.equal(lines.length, 2);
  assert.deepEqual(lines.sort(), [[[0, 0.5], [0.5, 0]], [[0.556, 1], [1, 0.556]]], 'cuts around a (bottom left) and c (top right)');
});

test('tie-break: cells with a NaN corner are skipped (the clipped disc round the dipole)', () => {
  assert.deepEqual(HD.contour(cell(NaN, 1, 0, 0), 0.5), []);
});

test('normalising: anything but inf is finite c; r clamped to 0.04 … 1.5 λ; zones off for false, "false", "0", 0', () => {
  const n = L.norm({ c: 'Infinity', r: 9 });
  assert.equal(n.c, 'finite');
  assert.equal(n.r, L.R_MAX);
  assert.equal(L.norm({ r: 0 }).r, L.R_MIN);
  assert.equal(L.norm({ r: 'x' }).r, L.defaults.r);
  for (const z of [false, 'false', '0', 0]) assert.equal(L.norm({ zones: z }).zones, false, String(z));
  for (const z of [true, 'true', '1', 1]) assert.equal(L.norm({ zones: z }).zones, true, String(z));
  assert.equal(L.norm({}).zones, true);
});

// ── §2 the field ──

test('stream function: E_r = ∂Ψ/∂θ / (x² sin θ) and E_θ = −∂Ψ/∂x / (x sin θ), c finite and infinite', () => {
  const h = 1e-6;
  for (const inf of [false, true]) {
    for (const [x, th, ph] of [[0.4, 0.5, 0.2], [1.4, 1.1, 0.8], [3.2, 0.6, 2.0], [9, 1.5, 5], [20, 2.7, 4]]) {
      const F = HD.fieldsAt(x, th, ph, inf);
      const dth = (HD.stream(x, th + h, ph, inf) - HD.stream(x, th - h, ph, inf)) / (2 * h);
      const dx = (HD.stream(x + h, th, ph, inf) - HD.stream(x - h, th, ph, inf)) / (2 * h);
      const scale = Math.abs(F.Er) + Math.abs(F.Et) + 1e-9;
      near(dth / (x * x * Math.sin(th)), F.Er, 1e-6 * scale, `E_r ${inf} ${x}`);
      near(-dx / (x * Math.sin(th)), F.Et, 1e-6 * scale, `E_θ ${inf} ${x}`);
    }
  }
});

test('field: the three terms of E_θ, the two of E_r and of H_φ (Griffiths §11.1.2, Balanis 4-8 … 4-10)', () => {
  const x = 1.3, th = 0.9, ph = 0.4, a = ph - x, s = Math.sin(th), c = Math.cos(th);
  const F = HD.fieldsAt(x, th, ph, false);
  near(F.Et, s * (Math.cos(a) / x ** 3 - Math.sin(a) / x ** 2 - Math.cos(a) / x), 1e-12);
  near(F.Er, 2 * c * (Math.cos(a) / x ** 3 - Math.sin(a) / x ** 2), 1e-12);
  near(F.Hp, s * (-Math.sin(a) / x ** 2 - Math.cos(a) / x), 1e-12);
  // along the dipole's axis (θ = 0) there is no E_θ and no H: the sin θ null
  const A = HD.fieldsAt(2, 0, 0.3, false);
  near(A.Et, 0, 1e-15); near(A.Hp, 0, 1e-15);
});

test('field: with c infinite E is the static dipole field of p(t) and H the current\'s, a quarter period ahead', () => {
  const x = 0.7, th = 1.0, ph = 0.6, F = HD.fieldsAt(x, th, ph, true);
  near(F.Et, Math.sin(th) * Math.cos(ph) / x ** 3, 1e-12);
  near(F.Er, 2 * Math.cos(th) * Math.cos(ph) / x ** 3, 1e-12);
  near(F.Hp, -Math.sin(th) * Math.sin(ph) / x ** 2, 1e-12);
});

test('phasors: Re(A·e^{jφ}) gives the instantaneous field, c finite and infinite', () => {
  for (const inf of [false, true]) {
    for (const x of [0.3, 1.3, 7]) {
      const A = HD.phasors(x, inf);
      for (const ph of [0, 1, 2.5, 4]) {
        const F = HD.fieldsAt(x, Math.PI / 2, ph, inf), re = (z) => z[0] * Math.cos(ph) - z[1] * Math.sin(ph);
        near(re(A.Et), F.Et, 1e-9 * (1 + Math.abs(F.Et)), `E ${inf} ${x} ${ph}`);
        near(re(A.Hp), F.Hp, 1e-9 * (1 + Math.abs(F.Hp)), `H ${inf} ${x} ${ph}`);
      }
    }
  }
});

test('cross-check: a charge oscillating against a fixed opposite charge (accelerated-charge\'s retarded field) is this dipole', () => {
  // accelerated-charge: z = A·sin(ωt), T = 20 ns, so p = q·A·cos(ωt − 90°); its field plus the fixed −q's Coulomb
  // field, over A·k³ (E1 units), is this model's E_θ at φ = ωt − 90°; its c·B over A·k³ is this model's H_φ.
  const p = { motion: 'osc', c: 'finite', beta: 0.001, tau: 2, t: 0 };
  const w = TAU / R.T_OSC, A = p.beta * R.C / w, k = w / R.C;
  for (const r of [0.6, 1.5, 6]) {
    for (const t of [3, 7.5, 12]) {
      const Pt = [r, 0], E = R.fieldAt(p, Pt, t), cp = R.components(Pt, { x: E.x - 1 / (r * r), z: E.z });
      const F = HD.fieldsAt(k * r, Math.PI / 2, w * t - Math.PI / 2, false), amp = HD.probe(k * r, false);
      near(cp.Et / (A * k ** 3), F.Et, 0.01 * amp.E, `E_θ r=${r} t=${t}`);
      near(E.cB / (A * k ** 3), F.Hp, 0.01 * amp.H, `H_φ r=${r} t=${t}`);
    }
  }
});

// ── §3 the probe ──

test('probe: at kr = 1 (r = λ/2π) E/H = η0/√2 = 266 Ω and H leads E by 45°', () => {
  const q = HD.probe(1, false);
  near(q.Z * ETA0, ETA0 / Math.SQRT2, 1e-9);
  near(q.lead, 45, 1e-9);
});

test('probe: the reactive near field, E/H ≫ 377 Ω and H about 90° ahead; at kr = 1/√2 E/H is exactly η0', () => {
  const q = L.probeAt(0.08, 0, false);
  near(q.Z, 603.1, 0.1); near(q.lead, 82.76, 0.01);
  near(HD.probe(Math.SQRT1_2, false).Z, 1, 1e-12);
  const deep = L.probeAt(0.04, 0, false);
  assert.ok(deep.Z > 1400 && deep.lead > 89, `${deep.Z} ${deep.lead}`);
});

test('probe: E/H dips to 256.6 Ω at kr = 1.169, then settles to 377 Ω from below; H\'s lead falls to 0', () => {
  let best = [Infinity, 0];
  for (let x = 0.5; x < 3; x += 1e-4) { const z = HD.probe(x, false).Z; if (z < best[0]) best = [z, x]; }
  near(best[0] * ETA0, 256.65, 0.01); near(best[1], 1.1688, 1e-3);
  near(L.probeAt(1, 0, false).Z, 367.4, 0.1);
  near(L.probeAt(2, 0, false).Z, 374.4, 0.1);
  near(L.probeAt(0.5, 0, false).lead, 1.85, 0.01);
  near(L.probeAt(1.5, 0, false).lead, 0.07, 0.01);
  rel(HD.probe(TAU * 20, false).Z, 1, 1e-4, 'at 20 λ');
});

test('lead: H is 0 … 90° ahead of E at every distance and the lead falls as r grows (c finite)', () => {
  let prev = 91;
  for (let x = 0.05; x < 40; x *= 1.1) {
    const q = HD.probe(x, false);
    assert.ok(q.lead >= 0 && q.lead <= 90 && q.lead < prev, `${x} ${q.lead}`);
    prev = q.lead;
  }
});

test('limits: near E falls as 1/r³ and H as 1/r²; far both fall as 1/r', () => {
  const a = HD.probe(TAU * 0.005, false), b = HD.probe(TAU * 0.01, false);
  near(b.E / a.E, 1 / 8, 0.002); near(b.H / a.H, 1 / 4, 0.002);
  const c = HD.probe(TAU * 10, false), d = HD.probe(TAU * 20, false);
  near(d.E / c.E, 0.5, 1e-3); near(d.H / c.H, 0.5, 1e-3);
});

test('limits: with c infinite nothing radiates; E 1/r³, H 1/r², E/H = η0/kr, H 90° ahead, no mean flow', () => {
  for (const r of [0.05, 0.5, 2]) {
    const q = L.probeAt(r, 30, true);
    near(q.Z, ETA0 / (TAU * r), 1e-9 * ETA0);
    assert.equal(q.lead, 90);
    assert.equal(q.S, 0);
    assert.equal(q.P, 0);
  }
  const a = HD.probe(1, true), b = HD.probe(2, true);
  near(b.E / a.E, 1 / 8, 1e-12); near(b.H / a.H, 1 / 4, 1e-12);
});

test('c infinite reaches the page: probe now, period, profile and crossings all use the instantaneous field', () => {
  const q = L.probeAt(0.3, 60, true), F = HD.fieldsAt(TAU * 0.3, Math.PI / 2, rad(60), true);
  near(q.e, F.Et * L.E_U, 1e-12); near(q.h, F.Hp * L.H_U, 1e-12);
  const pe = L.period(0.3, true);
  const peak = (k) => pe.reduce((b, s) => (s[k] > b[k] ? s : b)).t;
  near(Math.max(...pe.map((s) => s.e)), 1, 1e-9);
  assert.equal(peak('e'), 0, 'E follows the charge, cos ωt');
  assert.equal(peak('h'), 270, 'H peaks a quarter period earlier (−90° = 270°)');
  const pr = L.profile(true, 0.1, 0.2, 1);
  near(pr[1].E / pr[0].E, 1 / 8, 1e-12); near(pr[1].etaH / pr[0].etaH, 1 / 4, 1e-12);
  const cr = L.crossings(P({ t: 30, c: 'inf' }), 0.06, 1.5);
  assert.ok(cr.length > 3);
  for (const s of cr) {
    assert.equal(s.up, false, 'cos 30° > 0: E points down on the broadside line everywhere');
    near(HD.stream(TAU * s.r, Math.PI / 2, rad(30), true), s.level, 1e-6);
  }
});

test('power: the mean flow through every sphere is the same, η0·π/3·(I0·l/λ)², R_rad ≈ 80π²(l/λ)² (Balanis 4-16, 4-19)', () => {
  const Prad = ETA0 * Math.PI / 3 * (L.I0 * L.LEN / L.LAMBDA) ** 2;
  for (const r of [0.04, 0.159, 0.5, 2]) rel(L.probeAt(r, 0, false).P, Prad, 1e-9, `r=${r}`);
  near(Prad, 0.1578, 1e-4);
  rel(2 * Prad / L.I0 ** 2, 80 * Math.PI ** 2 * (L.LEN / L.LAMBDA) ** 2, 0.001, 'R_rad (80π² uses η0 = 120π)');
});

test('units: E and H in V/m and A/m for 1 A in λ/50 at 10 MHz; the far E matches η·k·I0·l/(4π·r) (Balanis 4-26a)', () => {
  near(L.LAMBDA, 29.979, 1e-3); near(L.LEN, 0.5996, 1e-4); near(L.PERIOD_NS, 100, 1e-9);
  near(L.E_U / L.H_U, ETA0, 1e-9);
  const far = L.probeAt(2, 0, false), book = ETA0 * (TAU / L.LAMBDA) * L.I0 * L.LEN / (4 * Math.PI * 2 * L.LAMBDA);
  rel(far.E, book, 0.007, 'within the 1/x² terms');
  const r = 40, x = TAU * r, z = HD.probe(x, false);
  rel(z.E * L.E_U, ETA0 * (TAU / L.LAMBDA) * L.I0 * L.LEN / (4 * Math.PI * r * L.LAMBDA), 1e-4, 'at 40 λ');
});

test('probe instant: E_θ and H_φ now, the probe\'s amplitudes and metres', () => {
  const q = L.probeAt(0.5, 40, false), F = HD.fieldsAt(TAU * 0.5, Math.PI / 2, rad(40), false);
  near(q.e, F.Et * L.E_U, 1e-12); near(q.h, F.Hp * L.H_U, 1e-12);
  near(q.metres, 0.5 * L.LAMBDA, 1e-9); near(q.kr, Math.PI, 1e-12);
  const A = HD.probe(Math.PI, false);
  near(q.E, A.E * L.E_U, 1e-12); near(q.H, A.H * L.H_U, 1e-12);
});

// ── §4 field lines and pinch-off ──

test('pinch-off: an X point is born at kr = √2 (0.225 λ) at ωt = 45.8°, moves in and reaches the dipole by 90°', () => {
  near(L.PINCH, Math.SQRT2 / TAU, 1e-12); near(L.PINCH_DEG, 45.76, 0.01);
  assert.deepEqual(L.pinchAt(45, false), [], 'not yet');
  const born = L.pinchAt(L.PINCH_DEG + 0.05, false);
  assert.equal(born.length, 1);
  near(born[0], L.PINCH, 0.01);
  near(L.pinchAt(60, false)[0], 0.1519, 1e-3);
  near(L.pinchAt(80, false)[0], 0.100, 1e-3);
  assert.ok(L.pinchAt(89, false)[0] < 0.05);
  assert.deepEqual(L.pinchAt(90, false), [], 'gone into the dipole');
  assert.deepEqual(L.pinchAt(120, false), []);
  near(L.pinchAt(240, false)[0], 0.1519, 1e-3, 'again half a period later');
});

test('pinch-off: with c infinite there is never an X point', () => {
  for (let t = 0; t < 360; t += 5) assert.deepEqual(L.pinchAt(t, true), [], `t=${t}`);
});

const box = { x0: -0.5, z0: -0.8, d: 0.01, nx: 250, nz: 160, rClip: 0.04 };

test('field lines: every contour point is on its level of Ψ', () => {
  for (const c of ['finite', 'inf']) {
    const set = L.fieldLines(P({ t: 50, c }), box);
    assert.equal(set.length, 2 * L.LEVEL_COUNT);
    let n = 0;
    for (const { level, lines } of set) for (const ln of lines) for (const q of ln) {
      n++;
      // linear interpolation along a cell edge: within a few percent of the local spread of Ψ
      const psi = HD.streamXZ(q[0], q[1], rad(50), c === 'inf');
      near(psi, level, 0.03 * Math.max(1, Math.abs(level)), `${c} ${q}`);
    }
    assert.ok(n > 500, `${n} points`);
  }
});

test('field lines: with c infinite they are the static dipole lines r = sin²θ·cos φ / (2π·Ψ), all ending at the dipole', () => {
  const set = L.fieldLines(P({ t: 30, c: 'inf' }), box);
  let closed = 0;
  for (const { level, lines } of set) for (const ln of lines) {
    const a = ln[0], b = ln[ln.length - 1];
    if (a[0] === b[0] && a[1] === b[1]) closed++;
    for (const q of ln.filter((_, i) => i % 7 === 0)) {
      const r = Math.hypot(q[0], q[1]), s = Math.abs(q[0]) / r;
      if (r < 0.1) continue;                 // close in, a 0.01 λ grid cell is too coarse for 3 %
      rel(r, s * s * Math.cos(rad(30)) / (TAU * level), 0.03, `level ${level}`);
    }
  }
  assert.equal(closed, 0, 'nothing pinches off: no closed loop');
});

test('field lines: with c finite closed loops are out in the picture; the same moment with c infinite has none', () => {
  const loops = (c) => L.fieldLines(P({ t: 60, c }), box).reduce((n, s) => n + s.lines.filter((ln) => {
    const a = ln[0], b = ln[ln.length - 1];
    return ln.length > 3 && a[0] === b[0] && a[1] === b[1];
  }).length, 0);
  assert.ok(loops('finite') >= 3, `finite ${loops('finite')}`);
  assert.equal(loops('inf'), 0);
});

test('field lines: mirror images across the dipole (Ψ depends on |X|) and across the broadside line', () => {
  for (const [X, Z] of [[0.3, 0.2], [1.1, -0.4]]) {
    const v = HD.streamXZ(X, Z, 1, false);
    near(HD.streamXZ(-X, Z, 1, false), v, 1e-12);
    near(HD.streamXZ(X, -Z, 1, false), v, 1e-12);
  }
  assert.ok(Number.isNaN(HD.streamXZ(0, 0, 1, false)), 'no value at the dipole itself');
});

test('grid: nodes inside rClip are NaN, the rest Ψ; levels are ±(n − ½)·step, never 0', () => {
  const g = HD.grid({ x0: -0.02, z0: -0.02, d: 0.02, nx: 2, nz: 2, rClip: 0.025 }, 0.3, false);
  assert.ok(Number.isNaN(g.v[4]), 'centre');
  assert.ok(Number.isNaN(g.v[1]), '0.02 from the centre');
  near(g.v[0], HD.streamXZ(-0.02, -0.02, 0.3, false), 1e-12, 'corner, 0.028 away');
  const lv = L.levelList();
  assert.equal(lv.length, 48);
  assert.deepEqual(lv.slice(22, 26), [-0.375, -0.125, 0.125, 0.375]);
  assert.equal(lv[0], -5.875);
});

test('crossings: on the broadside line, with E pointing up where E_θ < 0; loops alternate in sense every half λ', () => {
  const cr = L.crossings(P({ t: 0 }), 0.06, 2);
  assert.ok(cr.length > 20);
  for (const q of cr) {
    const F = HD.fieldsAt(TAU * q.r, Math.PI / 2, 0, false);
    assert.equal(q.up, F.Et < 0);
    near(HD.stream(TAU * q.r, Math.PI / 2, 0, false), q.level, 1e-6);
  }
  for (let i = 1; i < cr.length; i++) assert.ok(cr[i].r >= cr[i - 1].r, 'sorted');
  // far out, the sense of E on the broadside line flips every half wavelength
  const far = cr.filter((q) => q.r > 1 && q.r < 1.5);
  assert.ok(far.some((q) => q.up) && far.some((q) => !q.up));
});

test('dipole: the end charge is cos ωt and the current −sin ωt (it leads the charge by 90°)', () => {
  assert.deepEqual(L.dipoleAt(0), { q: 1, i: 0 });
  assert.deepEqual(L.dipoleAt(90), { q: 0, i: -1 });
  assert.deepEqual(L.dipoleAt(180), { q: -1, i: 0 });
  near(L.dipoleAt(45).q, Math.SQRT1_2, 1e-12);
});

test('plots: the profile is log-spaced 0.04 … 1.5 λ with η0·H; the period every 5°, each over its own amplitude', () => {
  const pr = L.profile(false);
  assert.equal(pr.length, 121);
  assert.equal(L.R_MAX, 1.5);
  near(pr[0].r, 0.04, 1e-12); near(pr[120].r, 1.5, 1e-12);
  near(pr[60].r, Math.sqrt(0.04 * 1.5), 1e-12);
  near(pr[120].etaH / pr[120].E, ETA0 / L.probeAt(1.5, 0, false).Z, 1e-9);
  const pe = L.period(0.3, false);
  assert.equal(pe.length, 73);
  assert.equal(pe[72].t, 360);
  near(Math.max(...pe.map((q) => Math.abs(q.e))), 1, 0.01);
  near(Math.max(...pe.map((q) => Math.abs(q.h))), 1, 0.01);
});

// ── §6 presets ──

test('presets: the params SPEC.md §6 lists', () => {
  assert.deepEqual(L.presets.map((p) => p.id), ['near', 'pinch', 'edge', 'far', 'inf']);
  assert.deepEqual(L.presets[1].params, { t: 60, c: 'finite', r: 0.25, zones: true });
});

test('presets: each shows what SPEC.md §6 says', () => {
  const st = (id) => L.initial(P(L.presets.find((p) => p.id === id).params));
  let s = st('near');
  assert.equal(s.zone, 'near'); near(s.probe.Z, 603.1, 0.1); near(s.probe.lead, 82.8, 0.05);
  assert.deepEqual(s.dipole, { q: 1, i: 0 });
  s = st('pinch');
  assert.equal(s.zone, 'mid'); assert.equal(s.pinch.length, 1); near(s.pinch[0], 0.152, 0.001);
  near(s.probe.Z, 276.9, 0.1); near(s.probe.lead, 14.47, 0.01);
  s = st('edge');
  assert.equal(s.zone, 'mid'); near(s.probe.Z, 265.7, 0.1); near(s.probe.lead, 44.5, 0.1); assert.deepEqual(s.pinch, []);
  s = st('far');
  assert.equal(s.zone, 'far'); near(s.probe.Z, 372.5, 0.1); near(s.probe.lead, 0.07, 0.01);
  s = st('inf');
  assert.equal(s.zone, 'near'); near(s.probe.Z, 40.0, 0.05); assert.equal(s.probe.lead, 90); assert.deepEqual(s.pinch, []);
  assert.equal(s.probe.P, 0);
});

test('state: time in ns, the constants the caption names', () => {
  const s = L.initial(P({ t: 90 }));
  near(s.ns, 25, 1e-9);
  near(s.lambda, 29.979, 1e-3);
  near(s.near, 1 / TAU, 1e-12); assert.equal(s.far, 1); near(s.pinchR, 0.2251, 1e-4);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const pr of [{ params: {} }].concat(L.presets)) {
    const s = L.initial(P(pr.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ t: 75, r: 0.3 });
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
