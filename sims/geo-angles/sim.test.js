// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for geo-angles: the angle on squared paper (logic.angle) and the three modes (sim.js), rules from SPEC.md,
// tie-breaks first; then the squared-paper model copied from geo-lines (paper.js, the parts used here); then the
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

const A = logic.angle;
const D = A.DIRS;
const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
const preset = (id) => S(logic.PRESETS.find((p) => p.id === id).params);
const idx = (v) => D.findIndex((d) => d[0] === v[0] && d[1] === v[1]);

// ── tie-breaks first ──

test('tie-break: the vertex and the arms belong to the angle, past the drawn ends too (rule 5)', () => {
  const v = [4, 2], u = [1, 0], w = [1, 1];
  assert.equal(A.where(v, u, w, [4, 2]), 'vertex');
  assert.equal(A.where(v, u, w, [5, 2]), 'armA');
  assert.equal(A.where(v, u, w, [23, 2]), 'armA');
  assert.equal(A.where(v, u, w, [12, 10]), 'armB');
  for (const k of ['vertex', 'armA', 'armB', 'in']) assert.equal(A.belongs(k), true, k);
  assert.equal(A.belongs('out'), false);
  // the line through an arm, behind the vertex, is not the arm
  assert.equal(A.where(v, u, w, [1, 2]), 'out');
  assert.equal(A.where(v, u, w, [2, 0]), 'out');
  const s = preset('arm');
  assert.equal(s.where, 'armA');
  assert.equal(s.inAngle, true);
  assert.equal(s.pastEnd, true);
});

test('tie-break: the arms\' lengths do not change the kind (rule 4)', () => {
  for (let kb = 1; kb <= 15; kb++) {
    const k = S({ kb, la: 6, lb: 6 }).kind;
    for (const [la, lb] of [[1, 1], [1, 12], [12, 1], [12, 12], [2, 9]]) assert.equal(S({ kb, la, lb }).kind, k, `${kb} ${la} ${lb}`);
  }
});

test('tie-break: the turn of b is kept within 1…15, so aVb is less than a straight angle in kind and point (rule 2)', () => {
  assert.equal(S({ kb: 0 }).kb, 1);
  assert.equal(S({ kb: 16 }).kb, 15);
  assert.equal(S({ kb: -4 }).kb, 1);
  for (let da = 0; da < 32; da++) for (let kb = 1; kb <= 15; kb++) {
    const s = S({ da, kb });
    assert.ok(G.cross(s.u, s.w) > 0, `${da} ${kb}`);
    assert.notEqual(s.kind, 'big');
  }
});

test('tie-break: swapped names make kut aVb the bigger part, only in mode name (rule 6)', () => {
  const s = preset('swap');
  assert.equal(s.named, 2);
  assert.equal(s.namedKind, 'big');
  assert.equal(s.kind, 'obtuse'); // part 1 itself is still obtuse
  assert.equal(S({ mode: 'kind', swap: true }).swap, false);
  assert.equal(S({ mode: 'point', swap: true }).named, 1);
  assert.equal(S({ mode: 'name', swap: 'true' }).swap, false);
});

test('tie-break: dirAt ties take the lower index; turnTo keeps 1…15 (rule 9)', () => {
  // exactly between (1, 0) [0] and (3, 1) [1]: the lower index
  const a = (Math.atan2(0, 1) + Math.atan2(1, 3)) / 2;
  assert.equal(A.dirAt(Math.cos(a), Math.sin(a)), 0);
  assert.equal(A.turnTo(0, 0), 1); // the same direction
  assert.equal(A.turnTo(0, 16), 15); // the opposite: a straight angle is just out of reach
  assert.equal(A.turnTo(0, 23), 15);
  assert.equal(A.turnTo(0, 24), 1);
  assert.equal(A.turnTo(0, 31), 1);
  assert.equal(A.turnTo(5, 3), 1); // behind a
  assert.equal(A.turnTo(30, 2), 4); // across index 0
  assert.equal(A.turnTo(0, 8), 8);
});

// ── the angle on squared paper ──

test('angle: 32 directions, anticlockwise from (1, 0); opposite 16 on, a right angle 8 on (rule 2)', () => {
  assert.equal(D.length, 32);
  assert.deepEqual(D[0], [1, 0]);
  assert.deepEqual(D[8], [0, 1]);
  assert.deepEqual(D[16], [-1, 0]);
  assert.deepEqual(D[24], [0, -1]);
  assert.deepEqual(D[1], [3, 1]);
  assert.deepEqual(D[31], [3, -1]);
  for (let i = 0; i < 32; i++) {
    const v = D[i], o = D[(i + 16) % 32], r = D[(i + 8) % 32], n = D[(i + 1) % 32];
    assert.equal(G.gcd(v[0], v[1]), 1);
    assert.ok(Math.max(Math.abs(v[0]), Math.abs(v[1])) <= 3);
    assert.deepEqual(o, [-v[0] + 0, -v[1] + 0]);
    assert.deepEqual(r, [-v[1] + 0, v[0]]);
    assert.ok(G.cross(v, n) > 0, `order at ${i}`);
  }
  assert.equal(new Set(D.map(String)).size, 32);
});

test('angle: kindOf compares with a right angle exactly (rule 4)', () => {
  assert.equal(A.kindOf([1, 0], [1, 2]), 'acute');
  assert.equal(A.kindOf([1, 0], [0, 1]), 'right');
  assert.equal(A.kindOf([2, 1], [-1, 2]), 'right');
  assert.equal(A.kindOf([1, 0], [-1, 3]), 'obtuse');
  assert.equal(A.kindOf([1, 0], [1, 3]), 'acute');
  assert.equal(A.kindOf([1, 0], [-1, 0]), 'straight');
  assert.equal(A.kindOf([1, 0], [1, 0]), 'zero');
  assert.equal(A.kindOf([0, 1], [1, 0]), 'big');
});

test('rule 4: right is exactly kb 8, acute below, obtuse above, for every arm a', () => {
  for (let da = 0; da < 32; da++) for (let kb = 1; kb <= 15; kb++) {
    const s = S({ da, kb });
    assert.equal(s.kind, kb < 8 ? 'acute' : kb === 8 ? 'right' : 'obtuse', `${da} ${kb}`);
    assert.equal(s.kind, A.kindOf(s.u, s.w));
  }
});

test('rule 5: in and out between the arms, exactly', () => {
  const v = [4, 2], u = [1, 0], w = [1, 1];
  assert.equal(A.where(v, u, w, [20, 9]), 'in');
  assert.equal(A.where(v, u, w, [7, 4]), 'in');
  assert.equal(A.where(v, u, w, [9, 8]), 'out'); // just over arm b
  assert.equal(A.where(v, u, w, [9, 7]), 'armB');
  assert.equal(A.where(v, u, w, [6, 1]), 'out'); // just under arm a
  // an obtuse angle: (1, 0) to (−2, 1)
  assert.equal(A.where([10, 4], [1, 0], [-2, 1], [5, 7]), 'in');
  assert.equal(A.where([10, 4], [1, 0], [-2, 1], [5, 6]), 'out');
  assert.equal(A.where([10, 4], [1, 0], [-2, 1], [6, 6]), 'armB');
  // a bigger angle (more than half a turn): everything but the open other part
  assert.equal(A.where([10, 4], [-1, 2], [3, 1], [11, 6]), 'out'); // inside the small part
  assert.equal(A.where([10, 4], [-1, 2], [3, 1], [10, 1]), 'in');
  assert.equal(A.where([10, 4], [-1, 2], [3, 1], [13, 5]), 'armB');
  assert.equal(A.where([10, 4], [-1, 2], [3, 1], [13, 3]), 'in'); // right of b only: still in the bigger part
  assert.equal(A.where([10, 4], [-1, 2], [3, 1], [8, 6]), 'in'); // left of a only
  // a straight angle: the half-plane on the left of a
  assert.equal(A.where([10, 4], [1, 0], [-1, 0], [3, 6]), 'in');
  assert.equal(A.where([10, 4], [1, 0], [-1, 0], [3, 2]), 'out');
});

test('rule 5: the arc is 1.5 cm, or 0.6 of the shorter arm', () => {
  assert.equal(S({}).arc, 1.5);
  assert.equal(S({ la: 2, lb: 9 }).arc, 1.2);
  assert.equal(S({ la: 3, lb: 1 }).arc, 0.6);
  assert.equal(S({ mode: 'point', vx: 4, vy: 2, la: 2, lb: 2, tx: 5, ty: 3 }).pastArc, true); // 2 > 1.44
  assert.equal(S({ mode: 'point', vx: 4, vy: 2, la: 2, lb: 2, tx: 5, ty: 2 }).pastArc, false); // 1 ≤ 1.44
});

test('rule 5: past the arc and past the arms\' drawn ends', () => {
  assert.equal(S({ mode: 'point', vx: 4, vy: 2, da: 0, kb: 4, tx: 5, ty: 3 }).pastArc, false); // |VT|² = 2, 8 ≤ 9
  assert.equal(S({ mode: 'point', vx: 4, vy: 2, da: 0, kb: 4, tx: 6, ty: 2 }).pastArc, true); // |VT| = 2 > 1.5
  assert.equal(S({ mode: 'point', vx: 4, vy: 2, da: 0, kb: 4, tx: 5, ty: 2 }).pastArc, false); // 4 ≤ 9
  assert.equal(S({ mode: 'point', vx: 4, vy: 2, da: 0, kb: 4, la: 5, tx: 9, ty: 2 }).pastEnd, false); // 5 = la
  assert.equal(S({ mode: 'point', vx: 4, vy: 2, da: 0, kb: 4, la: 5, tx: 10, ty: 2 }).pastEnd, true);
  assert.equal(S({ mode: 'point', vx: 4, vy: 2, da: 0, kb: 4, lb: 4, tx: 7, ty: 5 }).pastEnd, true); // arm b: 18 > 16
  assert.equal(S({ mode: 'point', vx: 4, vy: 2, da: 0, kb: 4, la: 3, lb: 5, tx: 8, ty: 3 }).pastEnd, false); // 17 ≤ 25
  assert.equal(S({ mode: 'point', vx: 4, vy: 2, da: 0, kb: 4, la: 3, lb: 4, tx: 8, ty: 3 }).pastEnd, true); // 17 > 16
});

test('rule 6: kut aVb is part 1 without a swap, part 2 with one', () => {
  const n = preset('name');
  assert.equal(n.named, 1);
  assert.equal(n.namedKind, 'obtuse');
  assert.equal(n.answer, 'one');
  assert.equal(preset('swap').answer, 'two');
  assert.equal(S({ mode: 'name', kb: 3 }).namedKind, 'acute');
  assert.equal(S({ mode: 'name', kb: 3, swap: true }).namedKind, 'big');
});

test('rule 7: the class\'s answer is judged against the mode\'s question', () => {
  assert.equal(S({ kb: 6, guess: 'acute' }).right, true);
  assert.equal(S({ kb: 6, guess: 'obtuse' }).right, false);
  assert.equal(S({ kb: 6, guess: 'yes' }).guess, null); // not an answer of mode kind
  assert.equal(S({ kb: 6, guess: 'yes' }).right, null);
  const far = logic.PRESETS.find((p) => p.id === 'far').params;
  assert.equal(S(Object.assign({}, far, { guess: 'yes' })).right, true);
  assert.equal(S(Object.assign({}, far, { guess: 'no' })).right, false);
  assert.equal(S(Object.assign({}, far, { guess: 'acute' })).guess, null);
  const sw = logic.PRESETS.find((p) => p.id === 'swap').params;
  assert.equal(S(Object.assign({}, sw, { guess: 'two' })).right, true);
  assert.equal(S(Object.assign({}, sw, { guess: 'one' })).right, false);
  assert.equal(S({ mode: 'name', guess: 'one' }).right, true);
});

test('rule 7: while asked, no set square; once answered, always the set square', () => {
  assert.equal(S({ square: true }).square, true);
  assert.equal(S({ square: null }).square, true);
  assert.equal(S({ square: 0 }).square, true);
  assert.equal(S({ square: false, guess: 'acute' }).square, true);
  assert.equal(S({ square: false, guess: 'yes' }).square, false);
  assert.equal(S({ square: true, hide: true, guess: 'acute' }).square, false);
  assert.equal(S({ square: true, hide: true }).square, false);
  assert.equal(S({ square: false }).square, false);
  assert.equal(S({ mode: 'point', square: true }).square, false);
  assert.equal(S({ hide: 'true' }).hide, false);
});

test('rule 8: the named mistakes', () => {
  const m = (over) => S(over).mistake;
  assert.equal(m({ kb: 8, guess: 'right' }), null);
  assert.equal(m({ kb: 8, guess: 'acute' }), 'notOnEdge');
  assert.equal(m({ da: 8, kb: 8, guess: 'obtuse' }), 'notOnEdge');
  assert.equal(m({ da: 2, kb: 8, guess: 'acute' }), 'tilted');
  assert.equal(m({ kb: 9, guess: 'right' }), 'nearRight');
  assert.equal(m({ kb: 14, guess: 'acute' }), 'arms');
  assert.equal(m({ kb: 3, guess: 'obtuse' }), 'arms');
  const pt = { mode: 'point', vx: 4, vy: 2, da: 0, kb: 4 };
  assert.equal(m(Object.assign({}, pt, { tx: 20, ty: 9, guess: 'no' })), 'arcOnly');
  // between the arms but inside the arc: not the arc mistake
  const rt = { mode: 'point', vx: 4, vy: 2, da: 0, kb: 8, tx: 5, ty: 3, guess: 'no' };
  assert.equal(m(rt), 'between');
  assert.equal(m(Object.assign({}, rt, { la: 1, lb: 1 })), 'arcOnly'); // short arms: a smaller arc
  assert.equal(m(Object.assign({}, pt, { tx: 15, ty: 2, guess: 'no' })), 'onArm');
  assert.equal(m(Object.assign({}, pt, { tx: 4, ty: 2, guess: 'no' })), 'onArm');
  assert.equal(m(Object.assign({}, pt, { tx: 9, ty: 8, guess: 'yes' })), 'otherPart');
  assert.equal(m(Object.assign({}, pt, { tx: 9, ty: 8, guess: 'no' })), null);
  assert.equal(m({ mode: 'name', guess: 'two' }), 'clockwise');
  assert.equal(m({ mode: 'name', swap: true, guess: 'one' }), 'clockwise');
});

test('rule 9: drags: the nearest direction, the turn, the length', () => {
  assert.equal(A.dirAt(1, 0), 0);
  assert.equal(A.dirAt(-1, 0.001), 16);
  assert.equal(A.dirAt(-1, -0.001), 16);
  assert.equal(A.dirAt(0.1, 1), 8);
  assert.equal(A.dirAt(2.1, 1), 2);
  assert.equal(A.dirAt(3, -1.05), 31);
  assert.equal(A.lenAt(3, 4), 5);
  assert.equal(A.lenAt(0.2, 0.2), 1);
  assert.equal(A.lenAt(30, 0), 12);
  assert.equal(A.lenAt(4.4, 0), 4);
  assert.equal(A.lenAt(4.5, 0), 5);
});

test('rule 1 and 10: params are made valid', () => {
  assert.equal(S({ mode: 'nope' }).mode, 'kind');
  assert.deepEqual(S({ vx: 0, vy: 0 }).v, [1, 1]);
  assert.deepEqual(S({ vx: 30, vy: 30 }).v, [23, 11]);
  assert.deepEqual(S({ vx: 4.5, vy: '' }).v, [5, 3]);
  assert.deepEqual(S({ vx: null, vy: 'x' }).v, [9, 3]);
  assert.equal(S({ la: 0, lb: 99 }).la, 1);
  assert.equal(S({ la: 0, lb: 99 }).lb, 12);
  assert.equal(S({ la: '', lb: null }).la, 6);
  assert.equal(S({ la: '', lb: null }).lb, 6);
  assert.deepEqual(S({ mode: 'point' }).t, [7, 4]);
  assert.deepEqual(S({ mode: 'point', tx: 30, ty: -3 }).t, [24, 0]);
  assert.deepEqual(S({ mode: 'point', tx: -1, ty: 12.4 }).t, [0, 12]);
  assert.equal(S({ da: 33 }).da, 1);
  assert.equal(S({ da: -1 }).da, 31);
  assert.equal(S({ da: -1, kb: 1 }).db, 0);
  assert.equal(S({ da: 'x' }).da, 0);
  assert.equal(S({ kb: 'x' }).kb, 6);
  assert.deepEqual(S({ mode: 'point', tx: -3, ty: 40 }).t, [0, 12]);
  assert.deepEqual(S({ mode: 'point', tx: '', ty: null }).t, [7, 4]);
  assert.equal(S({ square: 'false' }).square, true);
  assert.deepEqual(logic.cornerAt(3.5, 2.49), [4, 2]);
  assert.deepEqual(logic.cornerAt(-2, 13), [0, 12]);
  assert.deepEqual(logic.cornerAt(24.6, 2.5), [24, 3]);
});

test('the presets are the SPEC\'s', () => {
  const want = {
    kinds: { kind: 'acute', u: [1, 0], w: [1, 2], v: [9, 3], la: 6, lb: 6, square: true },
    short: { kind: 'obtuse', u: [1, 0], w: [-2, 1], answer: 'obtuse', v: [11, 4], la: 2, lb: 2 },
    tilted: { kind: 'right', u: [2, 1], w: [-1, 2], answer: 'right', v: [10, 2], la: 5, lb: 5 },
    near: { kind: 'obtuse', u: [1, 0], w: [-1, 3], answer: 'obtuse', v: [9, 3], la: 7, lb: 7 },
    far: { where: 'in', answer: 'yes', pastArc: true, pastEnd: true, t: [20, 9], v: [4, 2], u: [1, 0], w: [1, 1], la: 5, lb: 5 },
    arm: { where: 'armA', answer: 'yes', pastEnd: true, t: [15, 2], v: [4, 2], u: [1, 0], w: [1, 1], la: 5, lb: 5 },
    outside: { where: 'out', answer: 'no', t: [9, 8], v: [4, 2], u: [1, 0], w: [1, 1], la: 5, lb: 5 },
    name: { kind: 'obtuse', u: [3, 1], w: [-1, 2], answer: 'one', named: 1, v: [12, 5], la: 5, lb: 5 },
    swap: { kind: 'obtuse', u: [3, 1], w: [-1, 2], answer: 'two', named: 2, namedKind: 'big', v: [12, 5], la: 5, lb: 5 }
  };
  assert.deepEqual(logic.PRESETS.map((p) => p.id), Object.keys(want));
  for (const [id, exp] of Object.entries(want)) {
    const s = preset(id);
    for (const [k, v] of Object.entries(exp)) assert.deepEqual(s[k], v, `${id}.${k}`);
  }
  // the asked presets hide the answer; the first does not
  for (const p of logic.PRESETS) assert.equal(preset(p.id).hide, p.id !== 'kinds', p.id);
  assert.deepEqual(preset('far').d2, 16 * 16 + 7 * 7);
  assert.equal(G.cross([9 - 4, 8 - 2], [1, 1]), -1); // outside: just over arm b
  // the defaults are the first preset's angle
  const d = S({});
  assert.deepEqual([d.mode, d.v, d.u, d.w, d.la, d.lb, d.square], ['kind', [9, 3], [1, 0], [1, 2], 6, 6, true]);
  assert.equal(idx([1, 2]), 6);
});

// ── the squared-paper model copied from geo-lines: the parts used here ──

test('paper: gcd, sub, cross and dot', () => {
  assert.equal(G.gcd(0, 3), 3);
  assert.equal(G.gcd(-2, 3), 1);
  assert.equal(G.gcd(0, 0), 0);
  assert.deepEqual(G.sub([5, 2], [1, 7]), [4, -5]);
  assert.equal(G.cross([1, 0], [0, 1]), 1);
  assert.equal(G.cross([0, 1], [1, 0]), -1);
  assert.equal(G.dot([2, 1], [-1, 2]), 0);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe and deterministic', () => {
  for (const pr of logic.PRESETS) {
    for (const g of ['', 'acute', 'right', 'obtuse', 'yes', 'no', 'one', 'two']) {
      const s = logic.initial(P(Object.assign({}, pr.params, { guess: g })));
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
      assert.deepEqual(logic.initial(P(Object.assign({}, pr.params, { guess: g }))), s);
    }
  }
});

test('initial does not mutate its params', () => {
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    const copy = structuredClone(p);
    logic.initial(p);
    assert.deepEqual(p, copy);
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('the page is an explorer and its presets are the model\'s', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, k);
  for (const pr of logic.PRESETS) {
    assert.ok(strings.hr['p_' + pr.id] && strings.en['p_' + pr.id], pr.id);
  }
  const sj = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  for (const e of sj.entries || []) assert.ok(logic.PRESETS.some((p) => p.id === e.preset), e.preset);
});
