// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for polarization (SPEC.md). Run: node --test sims/polarization/
// Tie-breaks first, then one test per rule, then the module's own rules, then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const PZ = require('./polarization.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const S = (over) => L.initial(P(over));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b} (±${tol})`);
const rad = (d) => d * Math.PI / 180;
const ANGLES = [0, 5, 30, 45, 60, 85, 90, 95, 120, 135, 150, 175, 180];
const ELS = [0, 5, 30, 40, 45, 60, 85, 90];

// ── tie-breaks (SPEC.md §1) ──

test('tie-break: angles are clamped, non-numbers give the default; 0 and 180 are both allowed', () => {
  assert.deepEqual(L.norm({ a: -10, el: 120, b: 400 }), { a: 0, el: 90, b: 180, from: 'a', t: 0 });
  assert.deepEqual(L.norm({ a: 'x', el: null, b: undefined }), Object.assign({}, L.defaults, { el: 0 }));
  assert.equal(L.norm({ a: 180 }).a, 180);
  assert.equal(L.norm({ b: 180 }).b, 180);
});

test('tie-break: time wraps into [0, 360); only "b" sends from B', () => {
  assert.equal(L.norm({ t: 360 }).t, 0);
  assert.equal(L.norm({ t: -5 }).t, 355);
  assert.equal(L.norm({ t: 725 }).t, 5);
  assert.equal(L.norm({ t: 'x' }).t, 0);
  assert.equal(L.norm({ from: 'B' }).from, 'a');
  assert.equal(L.norm({ from: 'b' }).from, 'b');
  assert.deepEqual(S({ t: 360 }), S({ t: 0 }));
});

test('tie-break: a line\'s angle is in [0, 180); 180 is 0', () => {
  assert.equal(L.line180(180), 0);
  assert.equal(L.line180(-30), 150);
  assert.equal(L.line180(359.9999999999), 0);
  assert.equal(S({ a: 180 }).tau, 0);
  assert.equal(S({ a: 180, el: 0 }).wavePol, 0);
  assert.equal(S({ b: 180, from: 'b' }).wavePol, 0);
});

test('tie-break: the mismatch is acute, 0 … 90; exactly 90 is 90 (crossed), from either side', () => {
  assert.equal(L.between(90, 0), 90);
  assert.equal(L.between(0, 90), 90);
  assert.equal(L.between(270, 0), 90);
  assert.equal(L.between(170, 10), 20);
  assert.equal(L.between(10, 170), 20);
  for (const b of [90, 0]) {
    const s = S({ a: b === 90 ? 0 : 90, b });
    assert.equal(s.mis, 90); assert.equal(s.crossed, true); assert.equal(s.v, 0); assert.equal(s.plf, 0);
  }
});

test('tie-break: end-on the polarization is undefined: τ, mismatch and PLF null, voltage exactly 0, dB null', () => {
  for (const b of ANGLES) {
    const s = S({ a: 0, el: 90, b });
    assert.equal(s.gain, 0); assert.equal(s.theta, 0); assert.equal(s.endOn, true); assert.equal(s.crossed, false);
    assert.equal(s.tau, null); assert.equal(s.mis, null); assert.equal(s.plf, null); assert.equal(s.plfDb, null);
    assert.ok(Object.is(s.v, 0), 'v is +0'); assert.equal(s.pDb, null); assert.equal(s.wavePol, null); assert.equal(s.E, 0);
  }
  assert.equal(S({ a: 180, el: 90 }).endOn, true);
});

test('tie-break: zero power has no dB (null, not −Infinity), and the state stays JSON-safe', () => {
  const s = S({ b: 90 });
  assert.equal(s.pDb, null); assert.equal(s.plfDb, null);
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  assert.equal(L.db(0), null);
  assert.equal(L.db(1), 0);
});

test('tie-break: B turned end for end gives the same power in antiphase', () => {
  const p = S({ b: 0 }), q = S({ b: 180 });
  assert.equal(p.v, 1); assert.equal(q.v, -1); assert.equal(q.anti, true); assert.equal(p.anti, false);
  assert.equal(q.p, p.p); assert.equal(q.mis, 0); assert.equal(q.V, p.V);
  assert.equal(S({ b: 90 }).anti, false, 'crossed is not antiphase');
  assert.equal(S({ a: 5, el: 5, b: 95 }).crossed, false, 'just short of 90° is not crossed');
  near(S({ a: 5, el: 5, b: 95 }).mis, 89.98, 0.01);
  const r = S({ a: 60, b: 150 });                        // τ = 60, b − τ = 90 + … : 150 is 90° from 60 → crossed
  assert.equal(r.mis, 90); assert.equal(r.v, 0);
  const u = S({ a: 60, b: 170 });                        // 110° from E: 70° mismatch, antiphase
  near(u.mis, 70, 1e-9); assert.equal(u.anti, true); near(u.v, -Math.cos(rad(70)), 1e-12);
});

// ── rules of the link (SPEC.md §3) ──

test('rule 1: A\'s field towards B is at right angles to the line of sight and in the plane of the wire and that line', () => {
  for (const a of ANGLES) for (const el of ELS) {
    const A = L.dirA(a), r = L.rhat(el), w = PZ.dipoleWave(A, r);
    if (!w.e) continue;
    const e = w.e.map((c) => c[0]);
    near(PZ.dot3(e, r), 0, 1e-12, `e ⊥ r a=${a} el=${el}`);
    near(PZ.dot3(PZ.cross3(A, r), e), 0, 1e-12, `coplanar a=${a} el=${el}`);
    assert.ok(PZ.dot3(e, A) > 0, 'along the wire\'s transverse part, not against it');
    w.e.forEach((c) => assert.equal(c[1], 0, 'a dipole sends a linear (real) polarization'));
  }
});

test('rule 2: the amplitude is sin θ: 1, 0.866, 0.5, 0 as B rises over a vertical A; a horizontal A is broadside to the whole plane', () => {
  near(S({ el: 0 }).gain, 1, 1e-12);
  near(S({ el: 30 }).gain, Math.sqrt(3) / 2, 1e-12);
  near(S({ el: 60 }).gain, 0.5, 1e-12);
  assert.equal(S({ el: 90 }).gain, 0);
  near(S({ el: 30 }).theta, 60, 1e-9);
  near(S({ a: 180, el: 30 }).theta, 60, 1e-9, 'the angle between two lines is acute');
  for (const a of ANGLES) for (const el of ELS) assert.ok(S({ a, el }).theta <= 90);
  for (const el of ELS) assert.equal(S({ a: 90, el }).gain, 1, `el ${el}`);
  for (const a of ANGLES) for (const el of ELS) {
    const s = S({ a, el });
    near(s.gain, Math.sin(rad(s.theta)), 1e-12);
    near(s.gain, Math.sqrt(1 - Math.pow(Math.cos(rad(a)) * Math.sin(rad(el)), 2)), 1e-12, `a=${a} el=${el}`);
  }
  near(S({ el: 60 }).pDb, -6.0206, 1e-4);
});

test('rule 3: at broadside the wave carries A\'s direction (τ = a); off broadside the wire\'s projection seen from B', () => {
  for (const a of ANGLES) assert.equal(S({ a, el: 0 }).tau, a % 180, `a=${a}`);
  near(S({ a: 45, el: 60 }).tau, 63.4349, 1e-4);
  near(S({ a: 45, el: 60 }).gain, 0.790569, 1e-6);
  for (const a of [5, 30, 60, 85, 95, 150]) for (const el of [5, 40, 85]) {
    const want = ((Math.atan2(Math.sin(rad(a)), Math.cos(rad(a)) * Math.cos(rad(el))) * 180 / Math.PI) + 180) % 180;
    near(S({ a, el }).tau, want, 1e-9, `a=${a} el=${el}`);
  }
  assert.equal(S({ a: 0, el: 40 }).tau, 0, 'a vertical A stays "up" in B\'s view at any height');
  assert.equal(S({ a: 90, el: 40 }).tau, 90, 'an A across the path stays across');
});

test('rule 4: cos law: v = sin θ·cos(mismatch), PLF = cos²: 1, 0.75, 0.5, 0.25, 0 at 0, 30, 45, 60, 90°', () => {
  const want = { 0: [1, 0], 30: [0.75, -1.2494], 45: [0.5, -3.0103], 60: [0.25, -6.0206], 90: [0, null] };
  for (const b of Object.keys(want)) {
    const s = S({ b: Number(b) });
    near(s.plf, want[b][0], 1e-12); near(s.p, want[b][0], 1e-12); near(s.v, Math.cos(rad(b)), 1e-12);
    if (want[b][1] === null) assert.equal(s.plfDb, null); else near(s.plfDb, want[b][1], 1e-4);
  }
  for (const a of ANGLES) for (const el of ELS) for (const b of ANGLES) {
    const s = S({ a, el, b });
    if (s.endOn) continue;
    near(Math.abs(s.v), s.gain * Math.cos(rad(s.mis)), 1e-12, `a=${a} el=${el} b=${b}`);
    near(s.plf, Math.pow(Math.cos(rad(s.mis)), 2), 1e-12);
    near(s.p, s.gain * s.gain * s.plf, 1e-12);
    // signed: with the arrow's angle (τ is a line's angle, which forgets which end of A is which)
    const A = L.dirA(a), arrow = Math.atan2(PZ.dot3(A, L.U2), PZ.dot3(A, L.u1(el))) * 180 / Math.PI;
    near(s.v, s.gain * Math.cos(rad(b - arrow)), 1e-12, `signed a=${a} el=${el} b=${b}`);
  }
});

test('rule 5: the voltage is signed: past 90° from E the same power arrives in antiphase', () => {
  const s = S({ a: 0, b: 135 });
  near(s.v, -Math.SQRT1_2, 1e-12); assert.equal(s.anti, true); near(s.mis, 45, 1e-9); near(s.p, 0.5, 1e-12);
  assert.equal(S({ a: 0, b: 45 }).anti, false);
});

test('rule 6: reciprocity: the voltage is the same whichever dipole sends; the field at the receiver is not', () => {
  for (const a of ANGLES) for (const el of ELS) for (const b of ANGLES) {
    const sa = S({ a, el, b, from: 'a' }), sb = S({ a, el, b, from: 'b' });
    assert.equal(sb.v, sa.v); assert.equal(sb.V, sa.V); assert.equal(sb.pDb, sa.pDb);
    // B sends: full amplitude along its own wire; A sends: A's pattern along A's projection
    assert.equal(sb.waveAmp, 1); assert.equal(sb.wavePol, L.line180(b)); near(sb.E, L.E_MAX, 1e-15);
    assert.equal(sa.waveAmp, sa.gain); assert.equal(sa.wavePol, sa.tau); near(sa.E, sa.gain * L.E_MAX, 1e-15);
    // computed the other way round: B's field at A projected on A
    const back = PZ.dipoleWave(L.dirB(b, el), L.rhat(el).map((x) => -x));
    near(back.amp, 1, 1e-12);
    near(PZ.projection(back.e, PZ.linear(L.dirA(a)))[0] * back.amp, sa.v, 1e-12, `a=${a} el=${el} b=${b}`);
  }
});

test('rule 7: the real numbers: λ, l = λ/50, 3.767 mV/m broadside at 1 km, 2.259 mV open circuit', () => {
  near(L.LAMBDA, 29.9792458, 1e-9);
  near(L.LEN, 0.5996, 1e-4);
  near(L.E_MAX * 1e3, 3.7673, 1e-4);
  near(L.V_MAX * 1e3, 2.2588, 1e-4);
  near(L.E_MAX, L.ETA0 * (2 * Math.PI / L.LAMBDA) * L.I0 * L.LEN / (4 * Math.PI * L.DIST), 1e-15, 'η k I l /(4πr)');
  assert.ok(2 * Math.PI * L.DIST / L.LAMBDA > 200, 'far field: kr ≫ 1');
  const s = S({ b: 45 });
  near(s.V, L.V_MAX * Math.SQRT1_2, 1e-15);
  near(S({ el: 60 }).E, L.E_MAX / 2, 1e-15);
});

test('rule 8: time: the received voltage is v·cos ωt; a crest travels from the sender towards the receiver', () => {
  near(S({ b: 45, t: 60 }).vNow, Math.SQRT1_2 * 0.5, 1e-12);
  assert.equal(S({ t: 90 }).vNow, 0);
  near(S({ b: 180, t: 0 }).vNow, -1, 1e-12);
  assert.equal(L.waveAt(1, 0), 1, 'at the receiver the phase is ωt');
  near(L.waveAt(1, 120), Math.cos(rad(120)), 1e-12);
  const crest = (t) => {                                 // the crest nearest the receiver, as a fraction of the path
    let best = 0, bv = -2;
    for (let i = 0; i <= 3000; i++) { const f = i / 3000, v = L.waveAt(f, t); if (v > bv + 1e-12 && f > 0.6) { bv = v; best = f; } }
    return best;
  };
  const c0 = crest(10), c1 = crest(40);
  assert.ok(c1 > c0, `the crest moves on: ${c0} → ${c1}`);
  near(c1 - c0, 30 / 360 / L.WAVES, 1e-3, 'by 30° of phase = 1/12 of a wavelength');
});

test('A\'s pattern in the x–z plane: a figure eight for a vertical A, a circle for one across the path', () => {
  const v = L.patternXZ(0, 90);
  assert.deepEqual(v.map((q) => q.phi), [0, 90, 180, 270, 360]);
  assert.deepEqual(v.map((q) => q.amp), [1, 0, 1, 0, 1]);
  for (const q of L.patternXZ(90, 15)) assert.equal(q.amp, 1);
  for (const q of L.patternXZ(30, 10)) near(q.amp, Math.sqrt(1 - Math.pow(Math.cos(rad(30)) * Math.sin(rad(q.phi)), 2)), 1e-12);
});

test('the sweep of B\'s angle: v = sin θ·cos(b − τ), nulls 90° from τ, the current b on the curve', () => {
  const sw = L.sweepB(45, 60, 1);
  assert.equal(sw.length, 181);
  const tau = S({ a: 45, el: 60 }).tau;
  for (const q of sw) { near(q.v, 0.790569415 * Math.cos(rad(q.b - tau)), 1e-8); near(q.p, q.v * q.v, 1e-15); }
  assert.equal(L.sweepB(0, 0).length, 91, 'every 2° by default');
  assert.equal(L.patternXZ(0).length, 121, 'every 3° by default');
  const minP = sw.reduce((m, q) => (q.p < m.p ? q : m));
  near(minP.b, (tau + 90) % 180, 1);
  for (const b of [0, 30, 90, 150]) near(sw[b].v, S({ a: 45, el: 60, b }).v, 1e-12);
  assert.ok(L.sweepB(0, 90).every((q) => q.v === 0 && q.p === 0), 'end-on: nothing at any angle');
});

// ── the polarization vector module (polarization.js, catalogue §5.26 model 4) ──

test('module: transverse and dipoleWave: length sin θ, null along the wire, linear (real) polarization', () => {
  near(PZ.len3(PZ.transverse([0, 0, 1], [Math.SQRT1_2, 0, Math.SQRT1_2])), Math.SQRT1_2, 1e-12);
  const w = PZ.dipoleWave([0, 0, 1], [0, 0, 1]);
  assert.equal(w.amp, 0); assert.equal(w.e, null);
  const x = PZ.dipoleWave([0, 0, 1], [1, 0, 0]);
  assert.deepEqual(x.e, [[0, 0], [0, 0], [1, 0]]);
});

test('module: plf: lines at ψ give cos²ψ; null for a zero vector; independent of length', () => {
  for (const psi of [0, 30, 45, 60, 90]) {
    near(PZ.plf(PZ.linear([0, 0, 1]), PZ.linear([0, Math.sin(rad(psi)), Math.cos(rad(psi))])), Math.pow(Math.cos(rad(psi)), 2), 1e-12);
  }
  assert.equal(PZ.plf(PZ.linear([0, 0, 0]), PZ.linear([0, 0, 1])), null);
  near(PZ.plf(PZ.linear([0, 0, 5]), PZ.linear([0, 2, 2])), 0.5, 1e-12);
});

test('module: complex vectors for the next page: linear against circular is 0.5 at any angle; the same sense facing is matched', () => {
  const s = Math.SQRT1_2;
  const rhcpUp = [[s, 0], [0, -s], [0, 0]];              // sends along +z: x − jy (e^{+jωt})
  const rhcpDown = [[s, 0], [0, s], [0, 0]];             // the same sense sending along −z: x + jy
  const lhcpDown = [[s, 0], [0, -s], [0, 0]];
  for (const psi of [0, 20, 45, 90, 135]) near(PZ.plf(rhcpUp, PZ.linear([Math.cos(rad(psi)), Math.sin(rad(psi)), 0])), 0.5, 1e-12);
  near(PZ.plf(rhcpUp, rhcpDown), 1, 1e-12, 'right into right, facing');
  near(PZ.plf(rhcpUp, lhcpDown), 0, 1e-12, 'right into left, facing');
});

test('module: instant and ellipse: a line\'s tilt and ratio 0, a circle\'s ratio 1', () => {
  assert.deepEqual(PZ.instant(PZ.linear([0, 0, 1]), 2, Math.PI), [0, 0, -2]);
  assert.deepEqual(PZ.instant(PZ.linear([0, 0, 1]), 2, Math.PI / 2), [0, 0, 0]);
  const u1 = [0, 0, 1], u2 = [0, 1, 0];
  for (const tilt of [0, 30, 90, 150]) {
    const e = PZ.ellipse(PZ.linear([0, Math.sin(rad(tilt)), Math.cos(rad(tilt))]), u1, u2);
    near(e.tilt, tilt, 1e-9); near(e.major, 1, 1e-12); assert.equal(e.minor, 0); assert.equal(e.ratio, 0);
  }
  const c = PZ.ellipse([[0, 0], [0, Math.SQRT1_2], [Math.SQRT1_2, 0]], u1, u2);
  near(c.ratio, 1, 1e-12);
  const el = PZ.ellipse([[0, 0], [0, 0.5], [1, 0]], u1, u2);  // z + j·y/2: an upright ellipse, axial ratio 2
  near(el.tilt, 0, 1e-9); near(el.ratio, 0.5, 1e-12);
});

test('module: the imaginary parts: projection keeps the sign of j, unit scales both parts, e^{+jωt} turns right-hand', () => {
  assert.deepEqual(PZ.projection([[0, 1], [0, 0], [0, 0]], PZ.linear([1, 0, 0])), [0, 1]);
  assert.deepEqual(PZ.projection([[0, 1], [0, 0], [0, 0]], [[0, 1], [0, 0], [0, 0]]), [-1, 0]);
  const s = Math.SQRT1_2, rhcpUp = [[s, 0], [0, -s], [0, 0]];
  near(PZ.plf(rhcpUp.map((c) => [2 * c[0], 2 * c[1]]), [[s, 0], [0, s], [0, 0]]), 1, 1e-12, 'unit() scales the imaginary part too');
  const u = PZ.unit([[0, 3], [0, 0], [0, 4]]);
  near(u[0][1], 0.6, 1e-12); near(u[2][1], 0.8, 1e-12);
  assert.equal(PZ.unit([[1e-13, 0], [0, 0], [0, 0]]), null, 'below EPS is zero');
  // x − jy: at ωt = 0 along x, a quarter period later along +y (x → y: right-hand sending along +z)
  const q0 = PZ.instant(rhcpUp, 1, 0), q1 = PZ.instant(rhcpUp, 1, Math.PI / 2);
  near(q0[0], s, 1e-12); near(q0[1], 0, 1e-12); near(q1[0], 0, 1e-12); near(q1[1], s, 1e-12);
});

test('module: a tilted ellipse: tilt from Re(x·y*), zero vector ratio 0', () => {
  // e = (1 + j)·u1 + (1 + 0.5j)·u2: |x|² = 2, |y|² = 1.25, Re(x·y*) = 1 + 0.5 = 1.5 → tilt = ½·atan2(3, 0.75)
  const e = PZ.ellipse([[0, 0], [1, 0.5], [1, 1]], [0, 0, 1], [0, 1, 0]);
  near(e.tilt, 0.5 * Math.atan2(3, 0.75) * 180 / Math.PI, 1e-9);
  const mean = 1.625, dev = Math.sqrt(0.375 * 0.375 + 1.5 * 1.5);
  near(e.major, Math.sqrt(mean + dev), 1e-12); near(e.minor, Math.sqrt(mean - dev), 1e-12);
  const z = PZ.ellipse([[0, 0], [0, 0], [0, 0]], [0, 0, 1], [0, 1, 0]);
  assert.equal(z.ratio, 0); assert.equal(z.major, 0);
});

test('page constants SPEC.md §1 and §4 name: steps 5°, keys 15°, 3 wavelengths drawn', () => {
  assert.equal(L.T_STEP, 5); assert.equal(L.KEY_STEP, 15); assert.equal(L.ANG_STEP, 5); assert.equal(L.WAVES, 3);
});

test('module: snap makes rounding residue and −0 exact zeros', () => {
  assert.equal(PZ.snap(Math.cos(Math.PI / 2)), 0);
  assert.ok(Object.is(PZ.snap(-0), 0) || PZ.snap(-0) === 0);
  assert.ok(Object.is(PZ.snap(-1e-17), 0));
  assert.equal(PZ.snap(0.5), 0.5);
});

// ── presets (SPEC.md §5) ──

test('presets: the params SPEC.md §5 lists', () => {
  assert.deepEqual(L.presets.map((p) => p.id), ['matched', 'slant', 'crossed', 'endon', 'up', 'recip']);
  assert.deepEqual(L.presets.map((p) => p.params), [
    { a: 0, el: 0, b: 0, from: 'a', t: 0 },
    { a: 0, el: 0, b: 45, from: 'a', t: 0 },
    { a: 0, el: 0, b: 90, from: 'a', t: 0 },
    { a: 0, el: 90, b: 0, from: 'a', t: 0 },
    { a: 90, el: 90, b: 90, from: 'a', t: 0 },
    { a: 30, el: 40, b: 60, from: 'b', t: 0 }
  ]);
});

test('presets: each shows what SPEC.md §5 says', () => {
  const st = (id) => S(L.presets.find((p) => p.id === id).params);
  let s = st('matched');
  assert.equal(s.v, 1); assert.equal(s.pDb, 0); near(s.V * 1e3, 2.2588, 1e-4);
  s = st('slant');
  near(s.v, 0.7071, 1e-4); near(s.plf, 0.5, 1e-12); near(s.pDb, -3.0103, 1e-4);
  s = st('crossed');
  assert.equal(s.crossed, true); assert.equal(s.v, 0); assert.equal(s.pDb, null); near(s.E, L.E_MAX, 1e-15);
  s = st('endon');
  assert.equal(s.endOn, true); assert.equal(s.E, 0);
  for (const b of ANGLES) assert.equal(S({ a: 0, el: 90, b }).v, 0);
  s = st('up');
  assert.equal(s.gain, 1); assert.equal(s.tau, 90); assert.equal(s.v, 1);
  s = st('recip');
  near(s.gain, 0.8307, 1e-4); near(s.tau, 37.00, 0.005); near(s.mis, 23.00, 0.005); near(s.v, 0.7647, 1e-4);
  near(s.pDb, -2.33, 0.005); assert.equal(s.from, 'b');
  assert.equal(S(Object.assign({}, L.presets[5].params, { from: 'a' })).v, s.v);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const pr of [{ params: {} }].concat(L.presets)) {
    const s = S(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ a: 35, el: 25, b: 70, t: 75 });
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
