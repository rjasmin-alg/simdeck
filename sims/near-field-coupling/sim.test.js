// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for near-field-coupling (SPEC.md). Run: node --test sims/near-field-coupling/
// Tie-breaks first, then one test per rule, then the copied model's own tests, then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const HD = require('./hertzian-dipole.js');
const strings = require('./strings.js');

const TAU = 2 * Math.PI;
const P = (over) => Object.assign({}, L.defaults, over);
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b} (±${tol})`);
const rel = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol * Math.abs(b), `${msg || ''} ${a} vs ${b} (±${tol * 100}%)`);
const kOf = (f) => TAU * f / L.C0;
const rAt = (f, x) => x / kOf(f);                  // the distance with kr = x at frequency f
const mag = (z) => Math.hypot(z[0], z[1]);

// ── tie-breaks (SPEC.md §1, §2, §5) ──

test('tie-break: f and r are rounded, then clamped to the tables; not a number is the default', () => {
  assert.equal(L.norm({ f: 43.4 }).f, 43);
  assert.equal(L.norm({ f: 43.5 }).f, 44);
  assert.equal(L.norm({ f: 99 }).f, 73);
  assert.equal(L.norm({ r: -3 }).r, 0);
  assert.equal(L.norm({ r: 200 }).r, 86);
  assert.equal(L.norm({ f: 'x', r: null }).f, L.defaults.f);
  assert.equal(L.norm({ f: 'x', r: null }).r, L.defaults.r);
  for (const v of ['', ' ', true, false, [], {}]) assert.equal(L.norm({ f: v }).f, L.defaults.f, JSON.stringify(v));
  assert.equal(L.norm({ f: '44' }).f, 44, 'a numeric string from the URL');
  assert.equal(L.norm({ r: 'x' }).r, L.defaults.r);
});

test('tie-break: time wraps into [0, 360): 360 is 0, −5 is 355, 725 is 5', () => {
  assert.equal(L.norm({ t: 360 }).t, 0);
  assert.equal(L.norm({ t: -5 }).t, 355);
  assert.equal(L.norm({ t: 725 }).t, 5);
  assert.equal(L.norm({ t: -725 }).t, 355);
  assert.equal(L.norm({ t: 'x' }).t, 0);
  assert.equal(L.norm({ t: -1e-15 }).t, 0, '−ε rounds to 360, which folds to 0');
  assert.deepEqual(L.initial(P({ t: 360 })), L.initial(P({ t: 0 })));
});

test('tie-break: a phase of −180° is reported as 180°; phases stay in (−180, 180]', () => {
  assert.equal(L.degOf([-1, 0]), 180);
  assert.equal(L.degOf([-1, -0]), 180);
  assert.ok(L.degOf([-1, -1e-12]) > -180, 'just above −180° stays');
  assert.equal(L.degOf([0, -1]), -90);
  for (let r = 0; r < 87; r += 3) {
    const ph = L.initial(P({ r })).phase;
    assert.ok(ph > -180 && ph <= 180, String(ph));
  }
});

test('tie-break: a zone boundary belongs to the outer zone (λ/2π is mid, λ is far); c infinite is all near', () => {
  assert.equal(L.zoneOf(1 / TAU, false), 'mid');
  assert.equal(L.zoneOf(1 / TAU - 1e-9, false), 'near');
  assert.equal(L.zoneOf(1, false), 'far');
  assert.equal(L.zoneOf(1 - 1e-9, false), 'mid');
  assert.equal(L.zoneOf(50, true), 'near');
});

test('normalising: anything but axis is beside, anything but inf is finite c', () => {
  assert.equal(L.norm({ geom: 'Axis' }).geom, 'side');
  assert.equal(L.norm({ geom: 'axis' }).geom, 'axis');
  assert.equal(L.norm({ c: 'Infinity' }).c, 'finite');
  assert.equal(L.norm({ c: 'inf' }).c, 'inf');
});

// ── §1 the tables ──

test('tables: R20 frequencies 100 kHz … 450 MHz and distances 5 cm … 1 km, the presets on exact values', () => {
  assert.equal(L.F_TABLE.length, 74);
  assert.equal(L.R_TABLE.length, 87);
  assert.deepEqual([L.F_TABLE[0], L.F_TABLE[3], L.F_TABLE[43], L.F_TABLE[73]], [1e5, 1.4e5, 1.4e7, 4.5e8]);
  assert.deepEqual([L.R_TABLE[0], L.R_TABLE[6], L.R_TABLE[26], L.R_TABLE[37], L.R_TABLE[86]], [0.05, 0.1, 1, 3.55, 1000]);
  assert.deepEqual(L.F_TABLE.slice(20, 40).map((f) => f / 1e6), L.R20);
  for (const T of [L.F_TABLE, L.R_TABLE]) {
    for (let i = 1; i < T.length; i++) { const q = T[i] / T[i - 1]; assert.ok(q > 1.09 && q < 1.15, `${T[i]} / ${T[i - 1]}`); }
  }
});

// ── §2 the coupling ──

test('coupling beside: −(1/x³ + j/x² − 1/x)·e^{−jx}, the dipole module\'s E_θ by duality (Balanis 5-18b)', () => {
  for (const x of [0.02, 0.7, 1, 2.354, 9, 300]) {
    const g = L.coupling(x, 'side', false);
    const re = -(Math.cos(x) * (1 / x ** 3 - 1 / x) + Math.sin(x) / x ** 2);
    const im = -(Math.cos(x) / x ** 2 - Math.sin(x) * (1 / x ** 3 - 1 / x));
    near(g[0], re, 1e-9 * (1 + Math.abs(re)), `re ${x}`);
    near(g[1], im, 1e-9 * (1 + Math.abs(im)), `im ${x}`);
  }
});

test('coupling on the axis: 2(1/x³ + j/x²)·e^{−jx} (Balanis 5-18a)', () => {
  for (const x of [0.02, 0.7, 1, 2.354, 9, 300]) {
    const g = L.coupling(x, 'axis', false);
    const re = 2 * (Math.cos(x) / x ** 3 + Math.sin(x) / x ** 2), im = 2 * (Math.cos(x) / x ** 2 - Math.sin(x) / x ** 3);
    near(g[0], re, 1e-9 * (1 + Math.abs(re)), `re ${x}`);
    near(g[1], im, 1e-9 * (1 + Math.abs(im)), `im ${x}`);
  }
});

test('c infinite: −1/x³ beside and +2/x³ on the axis at every distance, no delay', () => {
  for (const x of [0.01, 1, 50]) {
    const s = L.coupling(x, 'side', true).map((v) => v * x ** 3), a = L.coupling(x, 'axis', true).map((v) => v * x ** 3);
    near(s[0], -1, 1e-12); near(s[1], 0, 1e-12); near(a[0], 2, 1e-12); near(a[1], 0, 1e-12);
  }
  const f = 14e6;
  for (const r of [0.05, 3.408, 1000]) {
    near(L.at(f, r, 'side', true).phase, 90, 1e-9);
    near(L.at(f, r, 'axis', true).phase, -90, 1e-9);
  }
});

test('near: V = ω·|M|·I0 with M = −μ0·A²/(4π·r³) for two small coplanar loops (the loose transformer)', () => {
  const f = 14e6, r = 0.05, M = L.MU0 * L.AREA ** 2 / (4 * Math.PI * r ** 3);
  const V = L.at(f, r, 'side', false).V;
  rel(V, TAU * f * M * L.I0, 1e-3, 'finite c, kr = 0.015');
  rel(L.at(f, r, 'side', true).V, TAU * f * M * L.I0, 1e-12, 'c infinite');
  near(V * 1e3, 0.4340, 5e-5, 'mV');
});

test('near: on the axis twice beside and of the opposite sign; phases +90° beside, −90° on the axis', () => {
  const f = 1e6, r = rAt(f, 0.001);
  const s = L.at(f, r, 'side', false), a = L.at(f, r, 'axis', false);
  near(a.V / s.V, 2, 1e-5);
  near(s.phase, 90, 0.01); near(a.phase, -90, 0.01);
});

test('slopes: r doubled gives 1/8 close in, 1/2 far out beside, 1/4 far out on the axis', () => {
  const f = 1e6, V = (x, g) => L.at(f, rAt(f, x), g, false).V;
  near(V(0.002, 'side') / V(0.001, 'side'), 1 / 8, 1e-5);
  near(V(0.002, 'axis') / V(0.001, 'axis'), 1 / 8, 1e-5);
  near(V(600, 'side') / V(300, 'side'), 1 / 2, 1e-5);
  near(V(600, 'axis') / V(300, 'axis'), 1 / 4, 1e-5);
  const g = (x) => L.at(f, rAt(f, x), 'side', true).V;
  near(g(600) / g(300), 1 / 8, 1e-12, 'c infinite: 1/r³ far out too');
});

test('crossover: the three terms are equal at kr = 1 (r = λ/2π), where |V| beside meets both asymptotes', () => {
  const g = mag(L.coupling(1, 'side', false)), a = L.asymptotes(1, 'side');
  near(g, 1, 1e-12); near(a.near, 1, 1e-15); near(a.far, 1, 1e-15);
  const b = L.asymptotes(1, 'axis');
  near(b.near, b.far, 1e-15, 'axis: 1/x³ and 1/x² meet at kr = 1 too');
  near(L.initial(P({ f: 43 })).cross, 3.408, 5e-4);
  near(L.initial(P({ f: 3 })).cross, 340.8, 0.05);
  near(L.initial(P({ f: 73 })).cross, 0.1060, 5e-5);
});

test('asymptotes: |V| tends to the near one close in and the far one far out, in both geometries', () => {
  for (const geom of ['side', 'axis']) {
    const lo = L.asymptotes(1e-3, geom), hi = L.asymptotes(1e3, geom);
    rel(mag(L.coupling(1e-3, geom, false)), lo.near, 1e-5, geom);
    rel(mag(L.coupling(1e3, geom, false)), hi.far, 1e-5, geom);
  }
});

test('beside and on the axis are equal at x = √((5 + √37)/2) = 2.354 (0.375 λ): the axis stronger inside, weaker outside', () => {
  near(L.EQUAL_KR, 2.35401, 1e-5);
  near(mag(L.coupling(L.EQUAL_KR, 'axis', false)), mag(L.coupling(L.EQUAL_KR, 'side', false)), 1e-12);
  assert.ok(mag(L.coupling(2.2, 'axis', false)) > mag(L.coupling(2.2, 'side', false)));
  assert.ok(mag(L.coupling(2.5, 'axis', false)) < mag(L.coupling(2.5, 'side', false)));
});

test('far-field phase: V turns −360° per wavelength (the travel time)', () => {
  const f = 14e6, lam = L.C0 / f, r = rAt(f, 300), d = lam / 100;
  let dp = L.at(f, r + d, 'side', false).phase - L.at(f, r, 'side', false).phase;
  if (dp > 180) dp -= 360;
  if (dp < -180) dp += 360;
  rel(dp / (d / lam), -360, 1e-3);
});

// ── §3 the slope ──

test('slope n beside overshoots both ends: 3.155 at kr = √(2 − √3), 0.845 at kr = √(2 + √3)', () => {
  near(L.slope(Math.sqrt(2 - Math.sqrt(3)), 'side', false), 3.1547, 1e-4);
  near(L.slope(Math.sqrt(2 + Math.sqrt(3)), 'side', false), 0.8453, 1e-4);
  assert.ok(L.slope(0.5, 'side', false) > L.slope(0.3, 'side', false), 'rises above 3 before the bend');
});

test('twice the distance: div is the real ratio V(r)/V(2r), not 2ⁿ of the local slope', () => {
  const s = L.initial(P({ r: 37 }));
  rel(s.div, s.V / L.at(s.f, 2 * s.r, 'side', false).V, 1e-12);
  near(s.div, 2.12, 0.01);
  near(L.initial(P({ r: 0 })).div, 8, 0.01);
  near(L.initial(P({ r: 86 })).div, 2, 0.001);
  near(L.initial(P({ c: 'inf', geom: 'axis' })).div, 8, 1e-9);
});

test('slope n: 3 close in, exactly 2 at kr = 1 beside (2.5 on the axis), 1 far out beside, 2 on the axis; 3 with c infinite', () => {
  near(L.slope(1e-4, 'side', false), 3, 1e-6);
  near(L.slope(1, 'side', false), 2, 1e-15);
  near(L.slope(1e4, 'side', false), 1, 1e-6);
  near(L.slope(1e-4, 'axis', false), 3, 1e-6);
  near(L.slope(1, 'axis', false), 2.5, 1e-15);
  near(L.slope(1e4, 'axis', false), 2, 1e-6);
  assert.equal(L.slope(1, 'side', true), 3);
  assert.equal(L.slope(1, 'axis', true), 3);
});

test('slope n is −d ln|V| / d ln r of the coupling itself (numerical derivative), and |V| always falls', () => {
  const h = 1e-5;
  for (const geom of ['side', 'axis']) {
    for (const x of [0.05, 0.5, 0.7071, 1, 1.5, 2.354, 8, 60]) {
      const n = -(Math.log(mag(L.coupling(x * (1 + h), geom, false))) - Math.log(mag(L.coupling(x * (1 - h), geom, false)))) /
        (Math.log(1 + h) - Math.log(1 - h));
      near(L.slope(x, geom, false), n, 1e-6, `${geom} ${x}`);
      assert.ok(n > 0, `${geom} ${x}: falls`);
    }
  }
});

// ── §4 energy ──

test('radiated power: η0·π/12·(ka)⁴·I0², the same at every r; R_rad = 20π²(C/λ)⁴ (Balanis 5-24, 5-27); 0 with c infinite', () => {
  const f = 14e6, ka = kOf(f) * L.RADIUS;
  rel(L.radiated(f, false), L.ETA0 * Math.PI / 12 * ka ** 4, 1e-12);
  rel(L.radiated(f, false), 0.457e-9, 2e-3);
  const C = TAU * L.RADIUS, lam = L.C0 / f;
  rel(2 * L.radiated(f, false) / L.I0 ** 2, 20 * Math.PI ** 2 * (C / lam) ** 4 * L.ETA0 / (120 * Math.PI), 1e-12);
  assert.equal(L.radiated(f, true), 0);
  assert.equal(L.initial(P({ r: 0 })).Prad, L.initial(P({ r: 86 })).Prad);
});

test('reactive power through the sphere: ω·μ0·A²·I0²/(12π·r³) = P/(kr)³; equal to P at kr = 1; the same with c infinite', () => {
  const f = 14e6, x = 0.3, r = rAt(f, x);
  rel(L.reactive(f, r), L.radiated(f, false) / x ** 3, 1e-12);
  rel(L.reactive(f, rAt(f, 1)), L.radiated(f, false), 1e-12);
  rel(L.reactive(f, 0.05), 0.1447e-3, 1e-3);
  assert.equal(L.initial(P({ c: 'inf' })).Q, L.initial(P({ c: 'finite' })).Q);
});

test('reactive and radiated power from the complex Poynting vector of the loop\'s fields, integrated over the sphere', () => {
  // E_φ = η0·u'·sin θ·(1 + 1/(jx))·e^{−jx}/x with u' = k²·m/(4π)·k (Balanis 5-18c), H_θ from the model: S_r = −½·E_φ·H_θ*
  const f = 450e6, k = kOf(f), m = L.I0 * L.AREA, u = k ** 3 * m / (4 * Math.PI);
  for (const r of [0.05, 1]) {
    const x = k * r, c = Math.cos(x), s = Math.sin(x);
    const ht = L.coupling(x, 'side', false).map((v) => -u * v);                    // H_θ = −H_z on the equator, per sin θ
    const a = [1, -1 / x];                                                          // 1 + 1/(jx)
    const ep = [L.ETA0 * u / x * (a[0] * c + a[1] * s), L.ETA0 * u / x * (a[1] * c - a[0] * s)];   // per sin θ
    const Sr = [-0.5 * (ep[0] * ht[0] + ep[1] * ht[1]), -0.5 * (ep[1] * ht[0] - ep[0] * ht[1])]; // −½ E·H*
    const sphere = 2 * Math.PI * r * r * 4 / 3;                                     // ∮ sin²θ dA
    rel(Sr[0] * sphere, L.radiated(f, false), 1e-9, `P at ${r}`);
    rel(Math.abs(Sr[1]) * sphere, L.reactive(f, r), 1e-9, `Q at ${r}`);
  }
});

// ── §5–§7 state, presets, time ──

test('state: V and its partner geometry, the ratio, i and v at the phase t', () => {
  const s = L.initial(P({ t: 90 }));
  near(s.i, 0, 1e-12);
  near(s.v, Math.cos((90 + s.phase) * Math.PI / 180), 1e-12);
  const a = L.initial(P({ geom: 'axis', t: 90 }));
  assert.equal(a.other, s.V); assert.equal(s.other, a.V);
  near(s.axisOverSide, a.V / s.V, 1e-12); near(a.axisOverSide, s.axisOverSide, 1e-12);
  near(s.kr, TAU * s.rl, 1e-12);
});

test('profile: both geometries over 5 cm … 1 km, log-spaced, with their asymptotes', () => {
  const pr = L.profile(43, false);
  assert.equal(pr.length, 161);
  near(pr[0].r, 0.05, 1e-12); near(pr[160].r, 1000, 1e-9);
  rel(pr[80].r, Math.sqrt(0.05 * 1000), 1e-12);
  rel(pr[0].side, L.at(14e6, 0.05, 'side', false).V, 1e-12);
  rel(pr[160].axis, L.at(14e6, 1000, 'axis', false).V, 1e-12);
  rel(pr[0].sideNear, pr[0].side, 1e-3); rel(pr[160].sideFar, pr[160].side, 1e-3);
  rel(pr[0].axisNear, pr[0].axis, 1e-3); rel(pr[160].axisFar, pr[160].axis, 1e-3);
  const inf = L.profile(43, true);
  rel(inf[160].side, inf[160].sideNear, 1e-12, 'c infinite: the near line all the way');
  rel(inf[160].axis, inf[160].axisNear, 1e-12, 'c infinite, on the axis too');
});

test('period: the current and the voltage every 5°, each over its own amplitude, the voltage shifted by the phase', () => {
  const pe = L.period(90);
  assert.equal(pe.length, 73);
  assert.equal(pe[72].t, 360);
  near(pe[0].i, 1, 1e-12); near(pe[0].v, 0, 1e-12);
  near(pe[18].v, -1, 1e-12, 'at 90°: cos 180°');
});

test('presets: the params SPEC.md §6 lists', () => {
  assert.deepEqual(L.presets.map((p) => p.id), ['card', 'charger', 'cross', 'far', 'axis', 'inf']);
  assert.deepEqual(L.presets.map((p) => p.params), [
    { f: 43, r: 0, geom: 'side', c: 'finite', t: 0 },
    { f: 3, r: 0, geom: 'side', c: 'finite', t: 0 },
    { f: 43, r: 37, geom: 'side', c: 'finite', t: 0 },
    { f: 43, r: 86, geom: 'side', c: 'finite', t: 0 },
    { f: 73, r: 6, geom: 'axis', c: 'finite', t: 0 },
    { f: 43, r: 86, geom: 'side', c: 'inf', t: 0 }
  ]);
  assert.deepEqual(L.defaults, { f: 43, r: 26, geom: 'side', c: 'finite', t: 0 }, 'SPEC.md §6: 14 MHz, 1 m');
  assert.equal(L.T_STEP, 5); assert.equal(L.KEY_STEP, 15);
});

test('presets: each shows what SPEC.md §6 says', () => {
  const st = (id) => L.initial(P(L.presets.find((p) => p.id === id).params));
  let s = st('card');
  assert.equal(s.zone, 'near'); near(s.kr, 0.01467, 1e-5); near(s.n, 3, 1e-3); near(s.V * 1e3, 0.4340, 1e-4);
  near(s.phase, 90, 0.005); near(s.cross, 3.408, 1e-3);
  s = st('charger');
  near(s.cross, 340.8, 0.05); assert.equal(s.zone, 'near'); near(s.V * 1e6, 4.341, 1e-3);
  assert.equal(L.zoneOf(340 / s.lambda, false), 'near', 'near field out to 340 m');
  near(L.slope(TAU * 30 / s.lambda, 'side', false), 3, 0.01, '1/r³ all the way to 30 m');
  s = st('cross');
  assert.equal(s.zone, 'mid'); near(s.kr, 1.042, 1e-3); near(s.n, 1.838, 1e-3); near(s.V * 1e9, 1.268, 1e-3);
  s = st('far');
  assert.equal(s.zone, 'far'); near(s.rl, 46.70, 0.01); near(s.n, 1, 1e-3); near(s.V * 1e12, 4.672, 1e-3);
  near(s.Prad * 1e9, 0.4569, 1e-4); near(s.Q * 1e18, 18.09, 0.01);
  s = st('axis');
  assert.equal(s.zone, 'near'); near(s.cross, 0.1060, 1e-4); near(s.n, 2.529, 1e-3); near(s.axisOverSide, 2.895, 1e-3);
  near(L.initial(P({ f: 73, r: 86, geom: 'axis' })).axisOverSide, 2.121e-4, 1e-7);
  s = st('inf');
  assert.equal(s.n, 3); assert.equal(s.Prad, 0); assert.equal(s.zone, 'near'); near(s.V * 1e18, 54.26, 0.01);
});

// ── the copied model (hertzian-dipole.js @ f87e209): the functions this sim uses, their tests kept (COMMON.md §6) ──

test('model: the three terms of E_θ, the two of E_r and of H_φ (Griffiths §11.1.2, Balanis 4-8 … 4-10)', () => {
  const x = 1.3, th = 0.9, ph = 0.4, a = ph - x, s = Math.sin(th), c = Math.cos(th);
  const F = HD.fieldsAt(x, th, ph, false);
  near(F.Et, s * (Math.cos(a) / x ** 3 - Math.sin(a) / x ** 2 - Math.cos(a) / x), 1e-12);
  near(F.Er, 2 * c * (Math.cos(a) / x ** 3 - Math.sin(a) / x ** 2), 1e-12);
  near(F.Hp, s * (-Math.sin(a) / x ** 2 - Math.cos(a) / x), 1e-12);
  const I = HD.fieldsAt(0.7, 1.0, 0.6, true);
  near(I.Et, Math.sin(1.0) * Math.cos(0.6) / 0.7 ** 3, 1e-12);
  near(I.Er, 2 * Math.cos(1.0) * Math.cos(0.6) / 0.7 ** 3, 1e-12);
});

test('model: phasors give the instantaneous field, Re(A·e^{jφ}), c finite and infinite', () => {
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

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const pr of [{ params: {} }].concat(L.presets)) {
    const s = L.initial(P(pr.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ t: 75, r: 30, geom: 'axis' });
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
    for (const key of ['preset_' + pr.id, 'preset_' + pr.id + 'Hint']) assert.ok(strings.hr[key] && strings.en[key], key);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
});
