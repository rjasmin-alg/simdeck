// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for geo-triangles: the triangle on squared paper (logic.tri) and the two modes (sim.js), rules from SPEC.md,
// tie-breaks first; then the squared-paper model copied from geo-lines (paper.js, a few of its tests kept); then the
// generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const G = require('./paper.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const T = logic.tri;
const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => logic.view(P(over), n);
const params = (id) => P(logic.PRESETS.find((p) => p.id === id).params);
const end = (id) => { const p = params(id); return logic.view(p, logic.steps(p)); };
const near = (x, y, eps = 1e-9) => Math.abs(x - y) < eps;
const key = (id) => 'p_' + id.replace(/-(\w)/g, (m, c) => c.toUpperCase());
const sq = (a, b, c) => ({ a: a * a, b: b * b, c: c * c });

// ── tie-breaks first ──

test('tie-break: as long as the other two together is flat, not a triangle (rule 2)', () => {
  assert.deepEqual(T.exists(3, 4, 7), { is: 'flat', long: 'c', sum: 7, gap: 0 });
  assert.deepEqual(T.exists(7, 3, 4), { is: 'flat', long: 'a', sum: 7, gap: 0 });
  assert.deepEqual(T.exists(3, 7, 4), { is: 'flat', long: 'b', sum: 7, gap: 0 });
  assert.equal(T.exists(3, 4, 6).is, 'yes');
  assert.equal(T.exists(3, 4, 8).is, 'no');
  // the smallest: 1, 1, 1 is a triangle; 1, 1, 2 is flat
  assert.equal(T.exists(1, 1, 1).is, 'yes');
  assert.equal(T.exists(1, 1, 2).is, 'flat');
});

test('tie-break: the longest side is one name; a triangle names none (rule 2)', () => {
  assert.equal(T.exists(9, 9, 1).long, null); // a triangle names none
  assert.deepEqual(T.exists(2, 2, 5), { is: 'no', long: 'c', sum: 4, gap: 1 });
  assert.deepEqual(T.exists(9, 2, 3), { is: 'no', long: 'a', sum: 5, gap: 4 });
  assert.deepEqual(T.exists(2, 9, 3), { is: 'no', long: 'b', sum: 5, gap: 4 });
});

test('tie-break: the construction takes the meeting point above AB (rule 3)', () => {
  const s = at({ a: 5, b: 4, c: 6 }, 4);
  assert.ok(s.C[1] > s.A[1]);
  assert.ok(T.turn(s.A, s.B, s.C) > 0, 'anticlockwise');
});

test('tie-break: an equilateral triangle is not called isosceles (rule 4)', () => {
  assert.equal(T.bySides(sq(6, 6, 6)), 'equilateral');
  assert.deepEqual(T.equal(sq(6, 6, 6)), ['a', 'b', 'c']);
  assert.equal(T.bySides(sq(6, 6, 4)), 'isosceles');
  assert.equal(T.bySides(sq(6, 4, 6)), 'isosceles');
  assert.equal(T.bySides(sq(4, 6, 6)), 'isosceles');
  assert.deepEqual(T.equal(sq(4, 6, 6)), ['b', 'c']);
  assert.deepEqual(T.equal(sq(6, 4, 6)), ['a', 'c']);
  assert.equal(T.bySides(sq(4, 5, 6)), 'scalene');
  assert.deepEqual(T.equal(sq(4, 5, 6)), []);
});

test('tie-break: the biggest angle on a tie is the first of A, B, C (rule 5)', () => {
  assert.equal(T.biggest(sq(6, 6, 6)), 'A');
  assert.equal(T.biggest(sq(6, 6, 4)), 'A');
  assert.equal(T.biggest(sq(4, 6, 6)), 'B');
  assert.equal(T.biggest(sq(4, 5, 6)), 'C');
  assert.equal(T.biggest(sq(6, 4, 6)), 'A');
});

test('tie-break: three corners on one line, or two in one place, are no triangle (rule 11)', () => {
  for (const [A, B, C] of [[[2, 2], [6, 4], [10, 6]], [[3, 3], [3, 3], [8, 5]], [[1, 1], [1, 1], [1, 1]]]) {
    const s = at({ mode: 'kind', ax: A[0], ay: A[1], bx: B[0], by: B[1], cx: C[0], cy: C[1] }, 5);
    assert.equal(s.flat, true);
    assert.equal(s.kind, null);
    assert.equal(s.names || s.measure || s.bySides || s.byAngle || s.both, false);
    assert.equal(s.mistake, null);
  }
});

test('tie-break: a clockwise ABC is still ∆ABC, with its sides opposite their vertices (rule 11)', () => {
  const s = at({ mode: 'kind', ax: 5, ay: 2, bx: 9, by: 8, cx: 15, cy: 2 }, 5);
  assert.equal(s.anticlockwise, false);
  assert.equal(s.flat, false);
  assert.deepEqual(s.s2, { a: 72, b: 100, c: 52 });
  assert.equal(s.kind.sides, 'scalene');
});

test('tie-break: dragging keeps the step; the kind follows (rule 8)', () => {
  const p = P({ mode: 'kind' });
  const s1 = logic.view(p, 4);
  const s2 = logic.view(Object.assign({}, p, { cx: 5, cy: 8 }), 4);
  assert.equal(s1.n, 4);
  assert.equal(s2.n, 4);
  assert.equal(s1.kind.right, null);
  assert.equal(s2.kind.right, 'A');
});

// ── the triangle on squared paper (logic.tri) ──

test('tri: squared sides opposite their vertices, exact', () => {
  assert.deepEqual(T.sides2([5, 2], [15, 2], [9, 8]), { a: 72, b: 52, c: 100 });
  assert.equal(T.turn([5, 2], [15, 2], [9, 8]), 60);
  assert.equal(T.turn([5, 2], [9, 8], [15, 2]), -60);
});

test('rule 3: where the circles meet: x, k and the sign of k agree with rule 2', () => {
  const ap = T.apex(5, 4, 6);
  assert.equal(ap.xn, 27);
  assert.equal(ap.den, 12);
  assert.equal(ap.k, 4 * 16 * 36 - 27 * 27);
  assert.ok(near(ap.x, 2.25));
  assert.ok(near(ap.y, Math.sqrt(16 - 2.25 * 2.25)));
  assert.equal(T.apex(3, 4, 7).k, 0);
  assert.equal(T.apex(3, 4, 7).y, 0);
  assert.ok(T.apex(2, 3, 7).k < 0);
  assert.equal(T.apex(2, 3, 7).y, null);
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) for (let c = 1; c <= 9; c++) {
    const k = T.apex(a, b, c).k, e = T.exists(a, b, c).is;
    assert.equal(k > 0 ? 'yes' : k === 0 ? 'flat' : 'no', e, `${a} ${b} ${c}`);
    assert.equal(k, (a + b + c) * (-a + b + c) * (a - b + c) * (a + b - c));
  }
});

test('rule 5: the angle at a vertex by squared sides; right at most once', () => {
  assert.equal(T.angleAt(sq(5, 3, 4), 'A'), 'right');
  assert.equal(T.angleAt(sq(5, 3, 4), 'B'), 'acute');
  assert.equal(T.angleAt(sq(3, 5, 4), 'B'), 'right');
  assert.equal(T.angleAt(sq(3, 4, 5), 'C'), 'right');
  assert.equal(T.angleAt(sq(6, 3, 4), 'A'), 'obtuse');
  assert.equal(T.rightAt(sq(5, 3, 4)), 'A');
  assert.equal(T.rightAt(sq(3, 5, 4)), 'B');
  assert.equal(T.rightAt(sq(3, 4, 5)), 'C');
  assert.equal(T.rightAt(sq(4, 5, 6)), null);
  assert.equal(T.rightAt({ a: 90, b: 45, c: 45 }), 'A');
  // integer sides: right only for the Pythagorean triples that fit (3-4-5, 6-8-…: 6, 8 and 10 does not fit 1…9)
  let rights = 0;
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) for (let c = 1; c <= 9; c++) {
    if (T.exists(a, b, c).is === 'yes' && T.rightAt(sq(a, b, c))) rights++;
  }
  assert.equal(rights, 6); // the six orders of 3, 4, 5
});

test('rule 6: the radii\'s ends along line AB, and the gap between them', () => {
  assert.deepEqual(T.feet(2, 3, 7), { fa: 3, fb: 5 }); // c too long: b from A, a from B, gap 2
  assert.deepEqual(T.feet(9, 2, 3), { fa: -2, fb: -6 }); // a too long: both left of A, gap 4
  assert.deepEqual(T.feet(2, 9, 3), { fa: 9, fb: 5 }); // b too long: both right of B, gap 4
  assert.deepEqual(T.feet(3, 4, 7), { fa: 4, fb: 4 }); // flat: they meet
  for (const [a, b, c] of [[2, 3, 7], [9, 2, 3], [2, 9, 3], [3, 4, 7], [7, 3, 4], [1, 1, 5]]) {
    const f = T.feet(a, b, c), e = T.exists(a, b, c);
    assert.equal(Math.abs(f.fa - f.fb), e.gap, `${a} ${b} ${c}`);
  }
});

// ── mode build ──

test('rule 1: the figure is centred; AB on y = 2; the triangle fits the sheet for every a, b, c', () => {
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) for (let c = 1; c <= 9; c++) {
    const s = at({ a, b, c }, 6);
    assert.equal(s.A[1], logic.Y0);
    assert.ok(near(s.B[0] - s.A[0], c));
    const xs = [s.A[0], s.B[0]].concat(s.exists === 'yes' ? [s.C[0]] : [s.feet.fa[0], s.feet.fb[0]]);
    const lo = Math.min(...xs), hi = Math.max(...xs);
    assert.ok(near(lo + hi, logic.W), `centred ${a} ${b} ${c}`);
    if (s.exists === 'yes') {
      assert.ok(lo >= 0 && hi <= logic.W && s.C[1] <= logic.H - 0.5, `${a} ${b} ${c}`);
      assert.ok(near((s.C[0] - s.A[0]) ** 2 + (s.C[1] - s.A[1]) ** 2, b * b), 'AC = b');
      assert.ok(near((s.C[0] - s.B[0]) ** 2 + (s.C[1] - s.B[1]) ** 2, a * a), 'BC = a');
    }
  }
});

test('rule 7: what each build step adds', () => {
  const want = [
    { base: false, arcA: false, arcB: false, apex: false, sides: false, kind: false, compass: null, ruler: null },
    { base: true, arcA: false, arcB: false, apex: false, sides: false, kind: false, compass: null, ruler: 'AB' },
    { base: true, arcA: true, arcB: false, apex: false, sides: false, kind: false, compass: { needle: 'A', open: 4 }, ruler: 'A' },
    { base: true, arcA: true, arcB: true, apex: false, sides: false, kind: false, compass: { needle: 'B', open: 5 }, ruler: 'B' },
    { base: true, arcA: true, arcB: true, apex: true, sides: false, kind: false, compass: null, ruler: null },
    { base: true, arcA: true, arcB: true, apex: true, sides: true, kind: false, compass: null, ruler: null },
    { base: true, arcA: true, arcB: true, apex: true, sides: true, kind: true, compass: null, ruler: null }
  ];
  for (let n = 0; n <= 6; n++) {
    const s = at({}, n);
    const got = { base: s.base, arcA: s.arcA, arcB: s.arcB, apex: s.apex, sides: s.sides, kind: !!s.kind, compass: s.compass, ruler: s.ruler };
    assert.deepEqual(got, want[n], `step ${n}`);
    assert.equal(s.stepId, logic.BUILD[n]);
    assert.equal(s.last, n === 6);
    assert.equal(s.compare, false);
  }
});

test('rule 6, 7: no triangle: no C, the radii compared from step 5; flat: C on AB from step 4', () => {
  for (let n = 0; n <= 6; n++) {
    const s = at({ a: 2, b: 3, c: 7 }, n);
    assert.equal(s.C, null);
    assert.equal(s.apex, false);
    assert.equal(s.sides, false);
    assert.equal(s.kind, null);
    assert.equal(s.compare, n >= 5, `step ${n}`);
  }
  const f = at({ a: 3, b: 4, c: 7 }, 4);
  assert.equal(f.apex, true);
  assert.deepEqual(f.C, [f.A[0] + 4, logic.Y0]);
  assert.equal(at({ a: 3, b: 4, c: 7 }, 3).apex, false);
});

test('rule 10: the named mistakes of build', () => {
  for (let n = 0; n <= 6; n++) {
    assert.equal(at({ a: 2, b: 3, c: 7 }, n).mistake, n >= 4 ? 'always' : null);
    assert.equal(at({ a: 3, b: 4, c: 7 }, n).mistake, n >= 4 ? 'flatOk' : null);
    assert.equal(at({ a: 5, b: 4, c: 6 }, n).mistake, null);
  }
});

test('build: the kind at step 6 is the kind of the whole sides', () => {
  assert.deepEqual(end('build').kind, { sides: 'scalene', equal: [], right: null, biggest: 'C', angle: 'acute', bigTie: false,
    square: { at: 'C', along: 'A', toward: 'B' } });
  assert.equal(end('equi').kind.sides, 'equilateral');
  assert.deepEqual(end('iso').kind.equal, ['a', 'b']);
  assert.equal(end('iso').kind.right, null);
  const r = end('right').kind;
  assert.deepEqual([r.sides, r.right, r.angle], ['scalene', 'A', 'right']);
  assert.deepEqual(r.square, { at: 'A', along: 'B', toward: 'C' });
  assert.equal(at({ a: 3, b: 4, c: 6 }, 6).kind.angle, 'obtuse'); // biggest angle at C: 9 + 16 < 36
});

// ── mode kind ──

test('rule 8: what each kind step adds', () => {
  for (let n = 0; n <= 5; n++) {
    const s = at({ mode: 'kind' }, n);
    assert.deepEqual([s.names, s.measure, s.bySides, s.byAngle, s.both], [n >= 1, n >= 2, n >= 3, n >= 4, n >= 5], `step ${n}`);
    assert.equal(s.stepId, logic.KIND[n]);
    assert.equal(s.last, n === 5);
  }
});

test('rule 8: lengths: whole cm or about c cm m mm', () => {
  assert.deepEqual(logic.length(100), { exact: true, cm: 10, mm: 0 });
  assert.deepEqual(logic.length(72), { exact: false, cm: 8, mm: 5 });
  assert.deepEqual(logic.length(45), { exact: false, cm: 6, mm: 7 });
  assert.deepEqual(logic.length(34), { exact: false, cm: 5, mm: 8 });
  assert.deepEqual(logic.length(399), { exact: false, cm: 20, mm: 0 }); // 19.97: "about 20 cm"
});

test('rule 10, 12: the named mistakes of kind, each at its step', () => {
  const ne = (n) => logic.view(params('near-eq'), n);
  const ri = (n) => logic.view(params('right-iso'), n);
  for (let n = 0; n <= 5; n++) {
    assert.equal(ne(n).mistake, n === 3 ? 'looks' : null, `nearEq ${n}`);
    assert.equal(ri(n).mistake, n === 4 ? 'tilted' : n === 5 ? 'rightIso' : null, `right-iso ${n}`);
  }
  // upright right isosceles: not tilted at step 4, still rightIso at step 5
  const up = { mode: 'kind', ax: 6, ay: 2, bx: 12, by: 2, cx: 6, cy: 8 };
  assert.equal(at(up, 4).onGrid, true);
  assert.equal(at(up, 4).mistake, null);
  assert.equal(at(up, 5).mistake, 'rightIso');
  // upright right scalene: no mistake at all
  const rs = { mode: 'kind', ax: 4, ay: 2, bx: 12, by: 2, cx: 4, cy: 8 };
  for (let n = 0; n <= 5; n++) assert.equal(at(rs, n).mistake, null);
  // isosceles but far from equilateral: not "looks"
  assert.equal(at({ mode: 'kind', ax: 6, ay: 2, bx: 12, by: 2, cx: 9, cy: 10 }, 3).nearEq, false);
});

test('rule 12: no three corners of the sheet make an equilateral triangle', () => {
  // every triangle with A at the origin of a 12 × 12 window and B, C anywhere in it (translation does not matter)
  let n = 0;
  for (let bx = 0; bx <= 12; bx++) for (let by = 0; by <= 12; by++) for (let cx = -12; cx <= 12; cx++) for (let cy = 0; cy <= 12; cy++) {
    const s2 = T.sides2([0, 0], [bx, by], [cx, cy]);
    if (T.turn([0, 0], [bx, by], [cx, cy]) !== 0 && T.bySides(s2) === 'equilateral') n++;
  }
  assert.equal(n, 0);
});

test('review: nearEq only for an isosceles triangle with sides less than 1 cm apart (rule 12)', () => {
  const k = (A, B, C) => at({ mode: 'kind', ax: A[0], ay: A[1], bx: B[0], by: B[1], cx: C[0], cy: C[1] }, 3);
  assert.equal(k([5, 2], [10, 2], [7, 7]).nearEq, false); // scalene 34, 29, 25: close, but not isosceles
  assert.equal(k([5, 2], [10, 2], [7, 7]).mistake, null);
  assert.equal(k([5, 2], [11, 2], [8, 6]).nearEq, false); // 5, 5, 6: exactly 1 cm apart
  assert.equal(k([5, 2], [11, 2], [8, 9]).nearEq, false); // 58, 58, 36: 1 cm 6 mm apart
  assert.equal(k([4, 2], [14, 2], [9, 4]).nearEq, false); // 29, 29, 100: the base is the longest
  assert.equal(k([8, 2], [14, 2], [11, 7]).nearEq, true);
});

test('review: the biggest angle ties for equilateral and for isosceles with the equal sides longest', () => {
  assert.equal(end('equi').kind.bigTie, true);
  assert.equal(end('iso').kind.bigTie, true);
  assert.equal(end('build').kind.bigTie, false);
  assert.equal(at({ a: 6, b: 6, c: 8 }, 6).kind.bigTie, false);
  assert.equal(at({ a: 4, b: 6, c: 6 }, 6).kind.bigTie, true);
});

test('review: every vertex is clamped; a bad C falls back to (9, 8); a flat triangle is not anticlockwise', () => {
  const k = at({ mode: 'kind', bx: -1, by: 99, cx: 'x', cy: null }, 0);
  assert.deepEqual([k.B, k.C], [[0, 12], [9, 8]]);
  assert.deepEqual(at({ mode: 'kind', bx: 99, by: -4 }, 0).B, [24, 0]);
  assert.equal(at({ mode: 'kind', ax: 2, ay: 2, bx: 6, by: 4, cx: 10, cy: 6 }, 0).anticlockwise, false);
});

test('rule 9: params are made valid; a drag lands on the nearest corner', () => {
  assert.equal(logic.modeOf({ mode: 'x' }), 'build');
  assert.equal(logic.steps({ mode: 'kind' }), 5);
  assert.equal(logic.steps({ mode: 'build' }), 6);
  assert.equal(logic.steps({}), 6);
  const s = at({ a: 0, b: 99, c: 'x' }, 0);
  assert.deepEqual([s.a, s.b, s.c], [1, 9, 6]);
  assert.deepEqual([at({ a: '', b: null }, 0).a, at({ a: '', b: null }, 0).b], [5, 4]);
  assert.deepEqual([at({ a: 4.6 }, 0).a], [5]);
  const k = at({ mode: 'kind', ax: -3, ay: 99, bx: 'q', by: null, cx: 30.2, cy: 2.5 }, 0);
  assert.deepEqual([k.A, k.B, k.C], [[0, 12], [15, 2], [24, 3]]);
  assert.deepEqual(logic.cornerAt(3.5, 2.49), [4, 2]);
  assert.deepEqual(logic.cornerAt(-1, 13), [0, 12]);
  assert.equal(logic.view(P({}), 99).n, 6);
  assert.equal(logic.view(P({ mode: 'kind' }), 99).n, 5);
  assert.equal(logic.view(P({}), -2).n, 0);
});

test('the presets are the SPEC\'s', () => {
  assert.deepEqual(logic.PRESETS.map((p) => p.id), ['build', 'equi', 'iso', 'right', 'long', 'flat', 'right-iso', 'near-eq']);
  const b = end('build');
  assert.deepEqual([b.A, b.B], [[9, 2], [15, 2]]);
  assert.ok(near(b.C[0], 11.25) && near(b.C[1], 5.30719, 1e-5));
  assert.ok(near(end('equi').C[0], 12) && near(end('equi').C[1], 7.19615, 1e-5));
  assert.ok(near(end('iso').C[0], 12) && near(end('iso').C[1], 7.65685, 1e-5));
  assert.deepEqual(end('right').C, [10, 5]);
  const l = end('long');
  assert.deepEqual([l.exists, l.long, l.sum, l.gap], ['no', 'c', 5, 2]);
  assert.deepEqual([l.feet.fa, l.feet.fb], [[11.5, 2], [13.5, 2]]);
  const f = end('flat');
  assert.deepEqual([f.exists, f.long, f.sum, f.gap, f.C], ['flat', 'c', 7, 0, [12.5, 2]]);
  const d = at({ mode: 'kind' }, 5);
  assert.deepEqual(d.s2, { a: 72, b: 52, c: 100 });
  assert.deepEqual([d.kind.sides, d.kind.right, d.kind.biggest, d.kind.angle], ['scalene', null, 'C', 'acute']);
  const r = end('right-iso');
  assert.deepEqual(r.s2, { a: 90, b: 45, c: 45 });
  assert.deepEqual([r.kind.sides, r.kind.right, r.onGrid, r.anticlockwise], ['isosceles', 'A', false, true]);
  assert.deepEqual(r.len.b, { exact: false, cm: 6, mm: 7 });
  const q = end('near-eq');
  assert.deepEqual(q.s2, { a: 34, b: 34, c: 36 });
  assert.deepEqual([q.kind.sides, q.nearEq], ['isosceles', true]);
  assert.deepEqual(logic.defaults, { mode: 'build', a: 5, b: 4, c: 6, ax: 5, ay: 2, bx: 15, by: 2, cx: 9, cy: 8 });
});

// ── the squared-paper model, copied from sims/geo-lines (COMMON.md §6); the parts this sim uses ──

test('paper: sub, dot and cross', () => {
  assert.deepEqual(G.sub([5, 4], [2, 1]), [3, 3]);
  assert.equal(G.dot([2, 1], [-1, 2]), 0);
  assert.equal(G.cross([1, 0], [0, 1]), 1);
  assert.equal(G.cross([0, 1], [1, 0]), -1);
  assert.deepEqual(G.lineDir([4, 2]), [2, 1]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step of every preset', () => {
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = logic.view(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step and initial do not mutate their input', () => {
  const p = P({ mode: 'kind' });
  const pc = structuredClone(p);
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
  assert.deepEqual(p, pc);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('the page is a stepper of 6 steps and its presets are the model\'s', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'stepper');
  assert.equal(meta.steps, logic.steps(logic.defaults));
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, k);
  for (const pr of logic.PRESETS) assert.ok(strings.hr[key(pr.id)] && strings.en[key(pr.id)], pr.id);
  const sj = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sj.steps, 6);
  for (const e of sj.entries || []) assert.ok(logic.PRESETS.some((p) => p.id === e.preset), e.preset);
  // the second preset steps (the gate's deep link opens it at step 3)
  assert.ok(logic.steps(P(logic.PRESETS[1].params)) >= 3);
});
