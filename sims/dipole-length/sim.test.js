// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for dipole-length (SPEC.md). Run: node --test sims/dipole-length/
// Tie-breaks first, then one test per rule, then the module's own rules, then the generic block every sim keeps.
// Expected numbers come from an independent scipy check (quad integration and Balanis' Si/Ci closed form, SPEC.md §3).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const CP = require('./current-pattern.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const S = (over) => L.initial(P(over));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b} (±${tol})`);
const LENS = [0.1, 0.13, 0.25, 0.37, 0.5, 0.62, 0.75, 0.99, 1, 1.01, 1.25, 1.43, 1.5, 1.77, 1.99, 2];

// ── tie-breaks (SPEC.md §1) ──

test('tie-break 1: len is clamped to 0.1 … 2 and put on the 0.01 grid; a non-number gives 0.5', () => {
  assert.equal(L.norm({ len: 0 }).len, 0.1);
  assert.equal(L.norm({ len: -3 }).len, 0.1);
  assert.equal(L.norm({ len: 7 }).len, 2);
  assert.equal(L.norm({ len: 0.1 + 0.2 }).len, 0.3);
  assert.equal(L.norm({ len: 0.505 }).len, 0.51);
  assert.equal(L.norm({ len: 0.504 }).len, 0.5);
  assert.equal(L.norm({ len: 1.0000001 }).len, 1);
  for (const bad of ['x', null, undefined, '', NaN, Infinity]) assert.equal(L.norm({ len: bad }).len, 0.5, String(bad));
  assert.equal(L.norm({ len: '1.5' }).len, 1.5);
});

test('tie-break 2: time wraps into [0, 360); a non-number gives 0', () => {
  assert.equal(L.norm({ t: 360 }).t, 0);
  assert.equal(L.norm({ t: -5 }).t, 355);
  assert.equal(L.norm({ t: 725 }).t, 5);
  assert.equal(L.norm({ t: 'x' }).t, 0);
  assert.equal(L.norm({ t: null }).t, 0);
  assert.deepEqual(S({ t: 360 }), S({ t: 0 }));
});

test('tie-break 3: along the axis the element factor is exactly 0, never NaN', () => {
  for (const len of LENS) {
    assert.ok(Object.is(CP.elementFactor(len, 1), 0), `${len} θ=0`);
    assert.ok(Object.is(CP.elementFactor(len, -1), 0), `${len} θ=180`);
    assert.ok(Object.is(CP.elementFactor(len, 1 + 1e-15), 0), `${len} cos slightly over 1`);
  }
  for (const q of L.patternPolar(0.5, 90)) assert.ok(Number.isFinite(q.r));
  assert.equal(L.patternPolar(0.5, 90)[0].r, 0);
});

test('tie-break 4: at λ and 2λ the feed current is exactly 0, the feed resistance null (∞), feedOpen set', () => {
  for (const len of [1, 2]) {
    const s = S({ len });
    assert.ok(Object.is(s.feed, 0), `feed ${s.feed}`);
    assert.equal(s.rIn, null); assert.equal(s.feedOpen, true); assert.equal(s.feedHuge, true); assert.equal(s.feedPct, 0);
    assert.ok(s.rRad > 100, 'the antenna still radiates');
  }
  for (const len of [0.99, 1.01, 1.99, 0.5, 1.5]) assert.equal(S({ len }).feedOpen, false, String(len));
  assert.equal(CP.feedCurrent(1), 0);
  assert.equal(CP.feedCurrent(2), 0);
});

test('tie-break 5: feed resistance above 10 kΩ is flagged huge; below it is not', () => {
  assert.equal(L.RIN_CAP, 10000);
  const a = S({ len: 0.99 }), b = S({ len: 0.95 }), c = S({ len: 1.05 }), d = S({ len: 0.97 });
  assert.ok(a.rIn > 1e5); assert.equal(a.feedHuge, true);
  assert.ok(b.rIn > 8000 && b.rIn < 10000, `0.95: ${b.rIn}`); assert.equal(b.feedHuge, false);
  assert.ok(c.rIn < 10000); assert.equal(c.feedHuge, false);
  assert.ok(d.rIn > 10000); assert.equal(d.feedHuge, true);
  assert.equal(S({ len: 0.5 }).feedHuge, false);
});

test('tie-break 6: a zero at the feed or an end is not a reversal; at exactly λ there is none', () => {
  assert.deepEqual(L.reversed(1), []);
  assert.deepEqual(L.reversed(0.5), []);
  assert.deepEqual(L.reversed(0.99), []);
  assert.deepEqual(L.reversed(1.01), [[0, 0.005]]);
  assert.deepEqual(L.reversed(2), [[0, 0.5]]);
  assert.equal(S({ len: 1 }).hasReversed, false);
  assert.equal(S({ len: 1.01 }).hasReversed, true);
});

test('tie-break 7: the main lobe is reported 0 … 90° from the wire; equal peaks go to broadside', () => {
  for (const len of LENS) {
    const s = S({ len });
    assert.ok(s.main >= 0 && s.main <= 90, `${len}: ${s.main}`);
  }
  near(S({ len: 1.55 }).main, 44.432, 0.002, 'folded from 135.6°');
  // a symmetric set of peaks: F² of a λ-long wire peaks only at 90°; at 2 λ the two peaks θ and 180 − θ are equal
  assert.equal(S({ len: 2 }).main, CP.directivity(2).main);
  near(CP.directivity(2).mainTheta, 57.45, 0.06, 'the first of two equal peaks is kept, then folded');
  // hand-built ties: equal samples go to the angle closer to 90°; a strictly larger one wins wherever it is
  assert.equal(CP.pickMain([0, 45, 90, 135], [1, 1, 1, 1]), 2);
  assert.equal(CP.pickMain([30, 60, 120, 150], [1, 1, 1, 1]), 1, 'first of two equally close');
  assert.equal(CP.pickMain([30, 60, 90], [1, 1 - 1e-12, 0.5]), 1, 'within 1e-9 counts as equal');
  assert.equal(CP.pickMain([30, 60, 90], [1, 0.99, 0.5]), 0, 'a clearly larger peak wins');
  assert.equal(CP.pickMain([10, 150], [0.5, 1]), 1);
  assert.equal(S({ len: 0.5 }).main, 90);
  assert.equal(S({ len: 1.4 }).main, 90);
  assert.ok(S({ len: 1.45 }).main < 45);
});

test('tie-break 8: zero power has no dB; the broadside null at 2λ is null, not −Infinity, and JSON-safe', () => {
  assert.equal(L.db(0), null);
  assert.equal(L.db(1), 0);
  const s = S({ len: 2 });
  assert.equal(s.broadDb, null);
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('tie-break 1: every slider value lands exactly on the 0.01 grid (no 0.35000000000000003)', () => {
  for (let i = 10; i <= 200; i++) {
    const v = L.norm({ len: i / 100 + 1e-7 }).len;
    assert.equal(v, Number((i / 100).toFixed(2)), String(i));
    assert.equal(String(v).length <= 4, true, `${i}: ${v}`);
  }
});

test('tie-break 5: above 2 kΩ the feed is flagged high (the caption names the thin-wire caveat)', () => {
  assert.equal(L.RIN_HIGH, 2000);
  assert.equal(S({ len: 0.9 }).feedHigh, true); assert.equal(S({ len: 0.9 }).feedHuge, false);
  assert.equal(S({ len: 1.05 }).feedHigh, true);
  assert.equal(S({ len: 0.75 }).feedHigh, false);
  assert.equal(S({ len: 1.1 }).feedHigh, false);
  assert.equal(S({ len: 1 }).feedHigh, true);
});

test('only exactly λ/2 and 3λ/2 put the feed at a crest; the feed is reversed only where its current is negative', () => {
  for (const len of [0.49, 0.51, 1.49, 1.51, 0.3, 1]) assert.equal(S({ len }).atCrest, false, String(len));
  for (const len of [1, 2]) assert.equal(S({ len }).feedReversed, false, `${len}: a zero is not reversed`);
  assert.equal(S({ len: 1.01 }).feedReversed, true);
  assert.equal(S({ len: 1.5 }).feedPct, 1);
  for (const len of LENS) assert.ok(S({ len }).feedPct >= 0, String(len));
});

// ── rules (SPEC.md §3) ──

test('rule 1: the current is a standing wave, zero at both ends, symmetric, crest λ/4 from each end', () => {
  for (const len of LENS) {
    assert.equal(CP.current(len, len / 2), 0, `${len} top end`);
    assert.equal(CP.current(len, -len / 2), 0, `${len} bottom end`);
    assert.equal(CP.current(len, len / 2 + 0.1), 0, `${len} past the end`);
    for (const f of [0.1, 0.3, 0.7]) assert.equal(CP.current(len, f * len / 2), CP.current(len, -f * len / 2));
    if (len >= 0.5) near(CP.current(len, len / 2 - 0.25), 1, 1e-12, `${len} crest`);
  }
  near(CP.current(0.1, 0.025), Math.sin(2 * Math.PI * 0.025), 1e-15);
  // the short dipole's current is close to a triangle: half way out it is about half the feed's
  near(CP.current(0.1, 0.025) / CP.current(0.1, 0), 0.5, 0.02);
});

test('rule 2: the feed current is sin(πL): 0.309, 0.707, 1 (a maximum), 0 (a minimum), −1, 0', () => {
  near(S({ len: 0.1 }).feed, 0.30902, 1e-5);
  near(S({ len: 0.25 }).feed, 0.70711, 1e-5);
  assert.equal(S({ len: 0.5 }).feed, 1); assert.equal(S({ len: 0.5 }).atCrest, true);
  assert.equal(S({ len: 1 }).feed, 0);
  near(S({ len: 1.5 }).feed, -1, 1e-12); assert.equal(S({ len: 1.5 }).atCrest, true); assert.equal(S({ len: 1.5 }).feedReversed, true);
  assert.equal(S({ len: 0.75 }).atCrest, false);
  assert.equal(S({ len: 2 }).feed, 0);
  assert.equal(S({ len: 1.25 }).feedReversed, true);
  assert.equal(S({ len: 0.75 }).feedReversed, false);
});

test('rule 3: the largest current on the wire is |sin πL| up to λ/2, then the crest', () => {
  near(L.iMax(0.1), 0.30902, 1e-5);
  assert.equal(L.iMax(0.5), 1);
  assert.equal(L.iMax(0.51), 1);
  assert.equal(L.iMax(1), 1);
  for (const len of LENS) {
    let m = 0;
    for (let i = 0; i <= 2000; i++) m = Math.max(m, Math.abs(CP.current(len, len / 2 * i / 2000)));
    near(L.iMax(len), m, 1e-5, String(len));
  }
});

test('rule 4: reversed segments only beyond λ: the middle λ/2 at 3λ/2, the middle λ at 2λ; the current there is negative', () => {
  for (const len of [0.1, 0.5, 0.75, 1]) assert.equal(S({ len }).hasReversed, false, String(len));
  assert.deepEqual(L.reversed(1.5), [[0, 0.25]]);
  assert.deepEqual(L.reversed(1.25), [[0, 0.125]]);
  for (const len of [1.25, 1.5, 1.77, 2]) {
    const r = L.reversed(len)[0];
    const mid = (r[0] + r[1]) / 2;
    assert.ok(CP.current(len, mid) < 0, `${len}: inside the reversed segment`);
    assert.ok(CP.current(len, (r[1] + len / 2) / 2) > 0, `${len}: the end segment`);
  }
});

test('rule 5: the pattern is null along the wire and drawn over an isotropic radiator of the same power', () => {
  for (const len of [0.1, 0.5, 1, 1.5]) {
    const pat = L.patternPolar(len, 1);
    assert.equal(pat[0].r, 0); assert.equal(pat[180].r, 0); assert.equal(pat[360].r, 0);
    // the mean of D over the sphere is 1: ∫ r² sin θ dθ / 2 over 0 … π
    let sum = 0;
    for (let i = 0; i <= 180; i++) sum += (i === 0 || i === 180 ? 0.5 : 1) * pat[i].r * pat[i].r * Math.sin(i * Math.PI / 180);
    near(sum * Math.PI / 180 / 2, 1, 2e-3, String(len));
    near(Math.max(...pat.map((q) => q.r)) ** 2, S({ len }).d, 0.01, `${len} peak`);
  }
  near(L.shortRef(90), Math.sqrt(1.5), 1e-12);
  assert.equal(L.shortRef(0), 0);
  for (const th of [30, 120, 200, 270, 330]) near(L.shortRef(th), L.shortRef(360 - th), 1e-12, `mirror ${th}`);
  near(L.shortRef(270), Math.sqrt(1.5), 1e-12, 'the left half is drawn on the left: r ≥ 0');
});

test('rule 6: directivity, main lobe and beamwidth match the scipy check (Balanis Table 4.2)', () => {
  const table = [
    [0.1, 1.5050, 1.775, 90, 89.53],
    [0.5, 1.6409, 2.151, 90, 78.08],
    [1, 2.4110, 3.822, 90, 47.84],
    [1.25, 3.2825, 5.162, 90, 32.61],
    [1.5, 2.2263, 3.476, 42.564, 32.80],
    [2, 2.5286, 4.029, 57.439, 26.71]
  ];
  for (const [len, d, dbi, main, bw] of table) {
    const s = S({ len });
    near(s.d, d, 2e-4, `${len} D`); near(s.dbi, dbi, 1e-3, `${len} dBi`);
    near(s.main, main, 2e-3, `${len} main`); near(s.beamwidth, bw, 0.06, `${len} beamwidth`);
    assert.equal(s.broadside, main === 90);
  }
  // the short-dipole limit: D → 1.5, 90°
  near(CP.directivity(0.02).d, 1.5, 1e-3); near(CP.directivity(0.02).beamwidth, 90, 0.1);
  // side lobes: none up to λ, −10.3 dB at 1.25 λ, broadside 2.9 dB down at 3λ/2
  assert.equal(S({ len: 1 }).sideDb, null);
  near(S({ len: 1.1 }).sideDb, -23.74, 0.02, 'small side lobes appear just above λ');
  near(S({ len: 1.01 }).sideDb, -54, 1.5);
  near(S({ len: 1.5 }).sideDb, -2.916, 0.01, 'the mirror of the main lobe is not a side lobe');
  assert.equal(S({ len: 2 }).sideDb, null, 'two equal lobes: no side lobe');
  // the broadside lobe stays the main one up to 1.44 λ; directivity peaks near 1.27 λ
  assert.equal(S({ len: 1.44 }).broadside, true); assert.equal(S({ len: 1.45 }).broadside, false);
  assert.ok(S({ len: 1.27 }).d > S({ len: 1.25 }).d && S({ len: 1.27 }).d > S({ len: 1.3 }).d);
  near(S({ len: 1.27 }).d, 3.296, 1e-3);
  near(S({ len: 1.25 }).sideDb, -10.326, 0.01);
  near(S({ len: 1.5 }).broadDb, -2.916, 0.01);
  assert.equal(S({ len: 0.5 }).broadDb, 0);
});

test('rule 7: R_rad against the largest current, R_feed against the feed current (scipy and Balanis 4-70a)', () => {
  const table = [
    [0.1, 0.191, 1.999, 1.999],
    [0.25, 6.716, 13.431, 13.431],
    [0.5, 73.079, 73.079, 73.079],
    [0.75, 185.680, 185.680, 371.36],
    [1, 198.950, 198.950, null],
    [1.25, 106.463, 106.463, 212.93],
    [1.5, 105.421, 105.421, 105.42],
    [2, 259.455, 259.455, null]
  ];
  for (const [len, rc, rr, ri] of table) {
    const s = S({ len });
    near(s.rCrest, rc, 1e-3, `${len} crest`); near(s.rRad, rr, 1e-3, `${len} rad`);
    if (ri === null) assert.equal(s.rIn, null); else near(s.rIn, ri, 0.01, `${len} feed`);
  }
  near(L.HALF, 73.079, 1e-3);
  for (const len of [0.1, 0.3, 0.5]) near(S({ len }).rIn, S({ len }).rRad, 1e-9, `${len}: equal up to λ/2`);
  for (const len of [0.62, 0.75, 1.25]) assert.ok(S({ len }).rIn > S({ len }).rRad, `${len}: larger at the feed`);
});

test('rule 8: a short dipole\'s resistance goes with L²: ≈ 197·(L/λ)², a quarter of the uniform current\'s 790·(L/λ)²', () => {
  near(L.SHORT_K, 197.256, 0.001, 'η·π/6; with η = 120π it is 20π² = 197.39');
  near(L.SHORT_K * 4, 789.0, 0.1, 'the uniform-current (Hertzian) value is four times');
  near(S({ len: 0.1 }).rShort, 1.9726, 1e-4);
  near(S({ len: 0.1 }).rIn / S({ len: 0.1 }).rShort, 1, 0.02);
  near(S({ len: 0.2 }).rIn, 8.328, 1e-3);
  near(S({ len: 0.2 }).rIn / S({ len: 0.1 }).rIn, 4, 0.2, 'halving the length about quarters it');
  near(CP.resistanceAtCrest(0.02) / CP.feedCurrent(0.02) ** 2 / (L.SHORT_K * 0.02 * 0.02), 1, 1e-3, 'exact in the limit');
});

test('rule 9: for L ≤ λ/2 the same feed current radiates R_feed / 73.08 of a half-wave dipole\'s power', () => {
  near(S({ len: 0.1 }).pctHalf, 0.02735, 1e-4);
  assert.equal(S({ len: 0.5 }).pctHalf, 1);
  assert.equal(S({ len: 0.51 }).pctHalf, null);
  assert.equal(S({ len: 1.5 }).pctHalf, null);
});

test('rule 10: lengths in metres at 7.1 MHz (λ = 42.22 m)', () => {
  near(L.LAMBDA, 42.2243, 1e-4);
  near(S({ len: 0.5 }).metres, 21.112, 1e-3);
  near(S({ len: 2 }).metres, 84.449, 1e-3);
});

test('rule 11: the current now is I(s)·cos ωt; the reversed segment swings in antiphase; the pattern ignores time', () => {
  near(L.currentNow(0.5, 0, 0), 1, 1e-12);
  near(L.currentNow(0.5, 0, 60), 0.5, 1e-12);
  assert.equal(L.currentNow(0.5, 0, 90), 0);
  near(L.currentNow(0.5, 0, 180), -1, 1e-12);
  near(L.currentNow(1.5, 0, 0), -1, 1e-12);
  near(L.currentNow(1.5, 0.5, 0), 1, 1e-12);
  assert.equal(S({ t: 90 }).cosT, 0);
  const a = S({ len: 1.5, t: 0 }), b = S({ len: 1.5, t: 135 });
  for (const k of ['d', 'main', 'beamwidth', 'rRad', 'rIn']) assert.equal(a[k], b[k], k);
});

// ── the shared module's own rules (current-pattern.js, promotable) ──

test('module: the axial integral for λ/2 is Cin(2π)/2 = 1.21883', () => {
  near(CP.axialIntegral(0.5), 1.2188267, 1e-7);
  near(CP.axialIntegral(0.5, 7), CP.axialIntegral(0.5, 8), 1e-12, 'an odd n is made even');
});

test('module: one element gives the same resistance by the sphere integral, in any orientation and place', () => {
  const one = (dir, pos) => [{ len: 0.5, pos: pos || [0, 0, 0], dir, amp: 1, phase: 0 }];
  near(CP.resistanceOf(one([0, 0, 1])), 73.079, 0.01);
  near(CP.resistanceOf(one([0.6, 0, 0.8])), 73.079, 0.05);
  near(CP.resistanceOf(one([0, 0, 1], [0.3, 0.2, 0.1])), 73.079, 0.01, 'position is only a phase');
  near(CP.resistanceOf([{ len: 1, pos: [0, 0, 0], dir: [0, 0, 1] }]), 198.95, 0.05, 'amp and phase default to 1 and 0');
});

test('module: field() sums elements with their phases; two in antiphase at one place cancel', () => {
  const a = { len: 0.5, pos: [0, 0, 0], dir: [0, 0, 1], amp: 1, phase: 0 };
  const b = Object.assign({}, a, { phase: 180 });
  assert.equal(CP.norm2(CP.field([Object.assign({}, a, { amp: 0 })], [1, 0, 0])), 0, 'amp 0 is silent');
  const e = CP.field([a, b], [1, 0, 0]);
  near(CP.norm2(e), 0, 1e-24);
  const one = CP.field([a], [1, 0, 0]);
  near(CP.norm2(one), 1, 1e-12, 'λ/2 broadside: F = 1');
  // θ̂ for an element along z at broadside along x is −z: the field is −F·ẑ
  near(one[2][0], -1, 1e-12); near(one[0][0], 0, 1e-15);
  // along the element's axis it contributes nothing
  assert.equal(CP.norm2(CP.field([a], [0, 0, 1])), 0);
  // two in phase side by side λ/2 apart along y, seen along y: a half-wave path difference cancels
  const c = Object.assign({}, a, { pos: [0, 0.5, 0] });
  near(CP.norm2(CP.field([a, c], [0, 1, 0])), 0, 1e-24);
  near(CP.norm2(CP.field([a, c], [1, 0, 0])), 4, 1e-12, 'broadside to the pair they add');
});

test('module: patternCut runs 0 … 180° with the element factor', () => {
  const c = CP.patternCut(0.5, 45);
  assert.deepEqual(c.map((q) => q.theta), [0, 45, 90, 135, 180]);
  assert.equal(c[0].f, 0); near(c[2].f, 1, 1e-12);
  near(c[1].f, Math.cos(Math.PI / 2 * Math.cos(Math.PI / 4)) / Math.sin(Math.PI / 4), 1e-12);
});

test('module: snap makes rounding residue exact zeros', () => {
  assert.equal(CP.snap(Math.sin(Math.PI)), 0);
  assert.ok(Object.is(CP.snap(-1e-17), 0));
  assert.equal(CP.snap(0.5), 0.5);
});

test('page constants SPEC.md names: slider 0.1 … 2 by 0.01, time steps 5°, keys 15°', () => {
  assert.equal(L.LEN_MIN, 0.1); assert.equal(L.LEN_MAX, 2); assert.equal(L.LEN_STEP, 0.01);
  assert.equal(L.T_STEP, 5); assert.equal(L.KEY_STEP, 15);
  const sw = L.sweep(0.01);
  assert.equal(sw.length, 191); assert.equal(sw[0].len, 0.1); assert.equal(sw[190].len, 2);
  assert.equal(sw[90].len, 1); assert.equal(sw[90].rIn, null);
  near(sw[40].rRad, 73.079, 0.01);
  for (const q of sw.filter((_, i) => i % 9 === 0)) {
    const st = S({ len: q.len });
    near(q.rRad, st.rRad, 1e-6 * st.rRad + 1e-6, `${q.len} rRad`);
    if (st.rIn === null) assert.equal(q.rIn, null); else near(q.rIn, st.rIn, 1e-6 * st.rIn, `${q.len} rIn`);
    near(q.rShort, st.rShort, 1e-12);
  }
  const along = L.currentAlong(0.5, 0.05);
  assert.equal(along[0].s, 0); near(along[0].i, 1, 1e-12); assert.equal(along[along.length - 1].i, 0);
});

// ── presets (SPEC.md §5) ──

test('presets: the params SPEC.md §5 lists', () => {
  assert.deepEqual(L.presets.map((p) => p.id), ['short', 'half', 'full', 'ext', 'three', 'two']);
  assert.deepEqual(L.presets.map((p) => p.params.len), [0.1, 0.5, 1, 1.25, 1.5, 2]);
  for (const p of L.presets) assert.equal(p.params.t, 0);
});

test('presets: each shows what SPEC.md §5 says', () => {
  const st = (id) => S(L.presets.find((p) => p.id === id).params);
  let s = st('short');
  near(s.feedPct, 0.309, 1e-3); near(s.dbi, 1.78, 0.01); near(s.rRad, 2.0, 0.01); assert.equal(s.broadside, true);
  s = st('half');
  assert.equal(s.atCrest, true); near(s.rIn, 73.08, 0.01); near(s.dbi, 2.15, 0.005); near(s.beamwidth, 78.1, 0.05);
  s = st('full');
  assert.equal(s.feedOpen, true); assert.equal(s.rIn, null); assert.equal(s.hasReversed, false); near(s.dbi, 3.82, 0.005);
  near(s.beamwidth, 47.8, 0.05); assert.equal(s.broadside, true);
  s = st('ext');
  assert.equal(s.broadside, true); near(s.dbi, 5.16, 0.005); near(s.sideDb, -10.3, 0.05); assert.equal(s.hasReversed, true);
  s = st('three');
  assert.equal(s.broadside, false); near(s.main, 42.56, 0.01); near(s.broadDb, -2.92, 0.01); near(s.rIn, 105.4, 0.05);
  assert.deepEqual(s.reversed, [[0, 0.25]]);
  s = st('two');
  assert.equal(s.broadDb, null); near(s.main, 57.44, 0.01); near(s.dbi, 4.03, 0.005); assert.equal(s.feedOpen, true);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset, the defaults and every length on the slider', () => {
  for (const pr of [{ params: {} }].concat(L.presets)) {
    const s = S(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
  for (let i = 10; i <= 200; i += 7) {
    const s = S({ len: i / 100 });
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, String(i));
    for (const k of ['d', 'rRad', 'main', 'beamwidth', 'metres']) assert.ok(Number.isFinite(s[k]), `${i}: ${k}`);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ len: 1.37, t: 75 });
  const copy = structuredClone(p);
  assert.deepEqual(L.initial(p), L.initial(p));
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has a name and hint in both languages', () => {
  for (const pr of L.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in L.defaults, `${pr.id}: ${k}`);
    for (const key of ['preset_' + pr.id, 'preset_' + pr.id + 'Hint']) assert.ok(strings.hr[key] && strings.en[key], key);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
});
