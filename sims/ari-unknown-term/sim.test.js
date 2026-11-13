// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ari-unknown-term: the number line model (numberline.js, copied from ari-constant-difference with these
// four tests, promotable), then the page's model (sim.js), tie-breaks first, then the generic block every sim keeps.
// Rules: SPEC.md.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const NL = require('./numberline.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
const T = (text, over) => { const r = logic.parseTask(text); assert.ok(r.task, text + ': ' + r.error); return S(Object.assign({}, r.task, over)); };

// ── the number line (numberline.js, from sims/ari-constant-difference/sim.test.js @ f2a51d4; moves with it) ──

test('number line: a nice step is 1, 2 or 5 · 10^k, the smallest giving at most maxTicks parts', () => {
  assert.equal(NL.niceStep(10, 10), 1);
  assert.equal(NL.niceStep(11, 10), 2);       // tie-break: 11 / 1 > 10, so 2
  assert.equal(NL.niceStep(20, 10), 2);       // exactly 10 parts is allowed
  assert.equal(NL.niceStep(21, 10), 5);
  assert.equal(NL.niceStep(350, 10), 50);
  assert.equal(NL.niceStep(1000, 10), 100);
  assert.equal(NL.niceStep(0, 10), 1);        // never below 1: whole numbers
  assert.equal(NL.niceStep(1e6, 10), 1e5);
});

test('number line: minor ticks are tenths of 1·10^k, halves of 2·10^k, fifths of 5·10^k, whole only', () => {
  assert.equal(NL.minorStep(1), 0);
  assert.equal(NL.minorStep(2), 1);
  assert.equal(NL.minorStep(5), 1);
  assert.equal(NL.minorStep(10), 1);
  assert.equal(NL.minorStep(20), 10);
  assert.equal(NL.minorStep(50), 10);
  assert.equal(NL.minorStep(100), 10);
});

test('number line: a view covers its values with padding, snapped to its step, never below the floor', () => {
  const v = NL.view([198, 523, 200, 525]);
  assert.deepEqual(v, { lo: 150, hi: 600, step: 50, minor: 10 });
  assert.ok(v.lo <= 198 && v.hi >= 525);
  assert.equal(v.lo % v.step, 0);
  assert.equal(v.hi % v.step, 0);
  // a narrow stretch is widened to minSpan, the odd unit on the right (tie-break)
  assert.deepEqual(NL.view([198, 200], { pad: 0, minSpan: 9 }), { lo: 195, hi: 204, step: 1, minor: 0 });
  // the floor: nothing below 0 unless asked
  assert.equal(NL.view([0, 643]).lo, 0);
  assert.deepEqual(NL.view([3, 5]), { lo: 0, hi: 12, step: 2, minor: 1 });   // the stretch slides right, not shrinks
  assert.ok(NL.view([3, 5], { floor: null }).lo < 0);
  // the ceiling: the stretch slides left and hi is cut to it
  assert.deepEqual(NL.view([600, 1000], { ceil: 1000 }), { lo: 500, hi: 1000, step: 50, minor: 10 });
  assert.ok(NL.view([0, 1000], { ceil: 1000 }).hi === 1000);
  assert.ok(NL.view([0, 1000]).hi > 1000);
  // never more major parts than maxTicks: snapping 1…21 to steps of 2 would give 11, so the step widens to 5
  assert.deepEqual(NL.view([1, 21], { pad: 0 }), { lo: 0, hi: 25, step: 5, minor: 1 });
  for (const vals of [[0, 999], [7, 13], [150, 151], [988, 1000], [1, 9999]]) {
    const w = NL.view(vals);
    assert.ok((w.hi - w.lo) / w.step <= 10, JSON.stringify(vals));
  }
});

test('number line: ticks, positions, free labels, jumps and the value under a drag', () => {
  const v = { lo: 190, hi: 210, step: 5, minor: 1 };
  const t = NL.ticks(v);
  assert.equal(t.length, 21);
  assert.deepEqual(t.filter((x) => x.major).map((x) => x.v), [190, 195, 200, 205, 210]);
  assert.equal(NL.ticks(v, 10).length, 5);    // too many minor ticks: majors only
  assert.equal(NL.pos(200, v), 0.5);
  assert.equal(NL.pos(190, v), 0);
  // a label at a point (tie-break: always hidden) or closer than minFrac to one is left out
  assert.deepEqual(NL.freeLabels(v, [200], 0), [190, 195, 205, 210]);
  assert.deepEqual(NL.freeLabels(v, [199], 0.06), [190, 195, 205, 210]);
  assert.deepEqual(NL.freeLabels(v, [201], 0.25), [190, 195, 210]);
  assert.deepEqual(NL.freeLabels(v, [190, 210]), [195, 200, 205]);
  assert.deepEqual(NL.jump(198, 200), { from: 198, to: 200, size: 2, dir: 'right' });
  assert.deepEqual(NL.jump(203, 200), { from: 203, to: 200, size: -3, dir: 'left' });
  assert.equal(NL.jump(5, 5).dir, 'none');
  assert.equal(NL.valueAt(0.5, v), 200);
  assert.equal(NL.valueAt(0.625, { lo: 0, hi: 4 }), 3);    // 2.5 rounds half up
  assert.equal(NL.valueAt(0.5, { lo: 0, hi: 5 }), 3);
  assert.equal(NL.valueAt(-1, v), 190);
  assert.equal(NL.valueAt(2, v), 210);
});

// ── tie-breaks ──

test('tie-break: a part that takes the whole over a million is lowered (rule 1)', () => {
  const a = logic.factOf(P({ op: 'add', pa: 700000, qa: 600000 }));
  assert.deepEqual(a, { fam: 'add', p: 700000, q: 300000, w: 1000000 });
  const m = logic.factOf(P({ op: 'mul', pm: 3000, qm: 400 }));
  assert.deepEqual(m, { fam: 'mul', p: 3000, q: 333, w: 999000 });
  // multiplication parts are at least 1, addition parts at least 0; not a number is the floor
  assert.deepEqual(logic.factOf(P({ op: 'div', pm: 0, qm: -4 })), { fam: 'mul', p: 1, q: 1, w: 1 });
  assert.deepEqual(logic.factOf(P({ op: 'sub', pa: 'x', qa: -4 })), { fam: 'add', p: 0, q: 0, w: 0 });
  assert.deepEqual(logic.factOf(P({ op: 'add', pa: 89.6, qa: 690.4 })), { fam: 'add', p: 90, q: 690, w: 780 });   // rounded
  // an unknown operation is subtraction, an unknown letter x
  assert.equal(S({ op: 'pow' }).op, 'sub');
  assert.equal(S({ letter: 'ab' }).letter, 'x');
});

test('tie-break: in a direct sentence (the result unknown) the mistake is not applied (rule 6)', () => {
  const s = S({ op: 'sub', u: 2, way: 'swap' });
  assert.equal(s.direct, true);
  assert.equal(s.way, 'right');
  assert.equal(s.wayAsked, 'swap');
  assert.equal(s.value, 89);
  assert.equal(s.inverse.op, 'sub');
  for (const op of logic.OPS) assert.equal(S({ op, u: 2 }).direct, true, op);
  for (const op of logic.OPS) for (const u of [0, 1]) assert.equal(S({ op, u }).direct, false, op + u);
});

test('tie-break: a wrong operation can give the right value with 0 or 1, and the check then holds (rule 6)', () => {
  for (const [text, y] of [['x · 1 = 7', 1], ['780 − b = 0', 0], ['x : 1 = 7', 1], ['x − 0 = 5', 0]]) {
    const s = T(text, { way: 'swap' });
    assert.equal(s.way, 'swap', text);
    assert.equal(s.correct, true, text);
    assert.equal(s.check.ok, true, text);
    assert.equal(s.inverse.y, y, text);   // the number that makes both operations agree
  }
  assert.equal(T('x · 2 = 8', { way: 'swap' }).correct, false);
});

test('tie-break: an unknown count is drawn 3 … 1 until its value is shown, and always under the mistake (rule 8)', () => {
  const f = (over) => S(Object.assign({ op: 'mul', pm: 5, qm: 7 }, over)).pieces;
  assert.deepEqual(f({ u: 0, show: 0 }), { count: 5, head: 3, tail: 1, elided: true });
  assert.deepEqual(f({ u: 0, show: 1 }), { count: 5, head: 3, tail: 1, elided: true });
  assert.deepEqual(f({ u: 0, show: 2 }), { count: 5, head: 5, tail: 0, elided: false });
  assert.deepEqual(f({ u: 0, show: 3, way: 'swap' }).elided, true);
  // the piece size unknown: the count is known, so every piece is drawn
  assert.deepEqual(f({ u: 1, show: 0 }), { count: 5, head: 5, tail: 0, elided: false });
  // in a division the count is the quotient (p): 35 : 7 = c
  assert.equal(S({ op: 'div', u: 2, pm: 5, qm: 7, show: 0 }).pieces.elided, true);
  // more than PIECES_MAX known pieces: 3 … 1
  assert.deepEqual(logic.piecesOf(12, false), { count: 12, head: 12, tail: 0, elided: false });
  assert.deepEqual(logic.piecesOf(13, false), { count: 13, head: 3, tail: 1, elided: true });
});

test('tie-break: inequality bounds are swapped, kept 1 to 20 apart (rule 9)', () => {
  assert.deepEqual(logic.boundsOf({ lo: 694, hi: 688 }), { lo: 688, hi: 694 });
  assert.deepEqual(logic.boundsOf({ lo: 50, hi: 50 }), { lo: 50, hi: 51 });
  assert.deepEqual(logic.boundsOf({ lo: 1e6, hi: 1e6 }), { lo: 999999, hi: 1000000 });
  assert.deepEqual(logic.boundsOf({ lo: 10, hi: 31 }), { lo: 10, hi: 30 });
  assert.deepEqual(logic.boundsOf({ lo: 10, hi: 30 }), { lo: 10, hi: 30 });
  assert.deepEqual(logic.boundsOf({ lo: -5, hi: 2e6 }), { lo: 0, hi: 20 });
});

test('tie-break: bounds 1 apart have no solution, and the line still shows them (rule 9)', () => {
  const s = S({ mode: 'ineq', lo: 693, hi: 694 });
  assert.deepEqual(s.solutions, []);
  assert.equal(s.count, 0);
  assert.equal(s.complete, true);
  assert.deepEqual([s.view.lo, s.view.hi], [690, 697]);
});

// ── rules ──

test('the sentence: where w, p and q stand for each operation (rule 2)', () => {
  assert.deepEqual(S({ op: 'add' }).values, [89, 691, 780]);
  assert.deepEqual(S({ op: 'sub' }).values, [780, 691, 89]);
  assert.deepEqual(S({ op: 'mul' }).values, [15, 65, 975]);
  assert.deepEqual(S({ op: 'div' }).values, [975, 65, 15]);
  assert.deepEqual(S({ op: 'sub', u: 1 }).role, 'q');
  assert.deepEqual(S({ op: 'sub', u: 0 }).role, 'w');
  assert.deepEqual(S({ op: 'div', u: 2 }).role, 'p');
  // each family keeps its own numbers when the operation is switched
  assert.equal(S({ op: 'add', pm: 3 }).w, 780);
  assert.equal(S({ op: 'mul', pa: 3 }).w, 975);
});

test('one fact, three readings; the given one and the one used (rule 3, 4)', () => {
  const s = S({ op: 'sub', u: 1 });
  assert.deepEqual(s.readings.map((r) => [r.op, r.roles.join('')]), [['add', 'pqw'], ['sub', 'wqp'], ['sub', 'wpq']]);
  assert.deepEqual(s.readings.map((r) => r.given), [false, true, false]);
  assert.deepEqual(s.readings.map((r) => r.used), [false, false, true]);
  const m = S({ op: 'mul', u: 0 });
  assert.deepEqual(m.readings.map((r) => r.op), ['mul', 'div', 'div']);
  assert.deepEqual(m.readings.map((r) => r.given), [true, false, false]);
  assert.deepEqual(m.readings.map((r) => r.used), [false, true, false]);
  // every reading holds for the fact
  for (const x of [s, m]) {
    const f = { w: x.w, p: x.p, q: x.q };
    for (const r of x.readings) assert.equal(logic.apply(r.op, f[r.roles[0]], f[r.roles[1]]).v, f[r.roles[2]]);
  }
});

test('the inverse: the reading with the unknown alone, for every operation and place (rule 4, 5)', () => {
  const want = {
    '780 − b = 89': [780, 'sub', 89, 691], 'a − 89 = 691': [691, 'add', 89, 780], '780 − 89 = c': [780, 'sub', 89, 691],
    '94 + s = 136': [136, 'sub', 94, 42], 'a + 245 = 643': [643, 'sub', 245, 398], '94 + 42 = z': [94, 'add', 42, 136],
    'f · 65 = 975': [975, 'div', 65, 15], '12 · x = 96': [96, 'div', 12, 8], '15 · 65 = p': [15, 'mul', 65, 975],
    '63 : b = 9': [63, 'div', 9, 7], 'a : 9 = 7': [7, 'mul', 9, 63], '63 : 7 = k': [63, 'div', 7, 9]
  };
  for (const [text, [x, op, y, v]] of Object.entries(want)) {
    const s = T(text);
    assert.deepEqual([s.inverse.x, s.inverse.op, s.inverse.y, s.value], [x, op, y, v], text);
    assert.equal(s.correct, true, text);
  }
  // across a sweep of facts the value is always the hidden number
  for (const op of logic.OPS) for (const u of [0, 1, 2]) for (const [a, b] of [[1, 1], [7, 9], [89, 691], [250, 4], [1000, 1]]) {
    const s = S({ op, u, pa: a, qa: b, pm: a, qm: b });
    assert.equal(s.value, s.values[u], op + u + ' ' + a + ',' + b);
  }
});

test('the typical mistake: the other operation of the pair, and its value or why there is none (rule 6)', () => {
  const v = (text) => { const s = T(text, { way: 'swap' }); return [s.inverse.op, s.value, s.why]; };
  assert.deepEqual(v('780 − b = 89'), ['add', 869, null]);
  assert.deepEqual(v('a − 89 = 691'), ['sub', 602, null]);
  assert.deepEqual(v('94 + s = 136'), ['add', 230, null]);
  assert.deepEqual(v('f · 65 = 975'), ['mul', 63375, null]);
  assert.deepEqual(v('63 : b = 9'), ['mul', 567, null]);
  assert.deepEqual(v('a : 9 = 7'), ['div', null, 'frac']);
  assert.deepEqual(v('a − 691 = 89'), ['sub', null, 'neg']);
  assert.deepEqual(v('x · 1000 = 1000000'), ['mul', null, 'big']);
  assert.equal(T('780 − b = 89', { way: 'swap' }).inverse.right, 'sub');
  assert.equal(T('780 − b = 89', { way: 'swap' }).correct, false);
});

test('the check: the value put back gives the sentence, a wrong one does not (rule 7)', () => {
  const c = (text, over) => T(text, over).check;
  assert.deepEqual(c('780 − b = 89'), { terms: [780, 691, 89], left: 89, why: null, ok: true });
  assert.deepEqual(c('780 − b = 89', { way: 'swap' }), { terms: [780, 869, 89], left: null, why: 'neg', ok: false });
  assert.deepEqual(c('a − 89 = 691', { way: 'swap' }), { terms: [602, 89, 691], left: 513, why: null, ok: false });
  // no cap in the check: the product is computed to be compared
  assert.deepEqual(c('f · 65 = 975', { way: 'swap' }), { terms: [63375, 65, 975], left: 4119375, why: null, ok: false });
  assert.deepEqual(c('63 : b = 9', { way: 'swap' }), { terms: [63, 567, 9], left: null, why: 'frac', ok: false });
  assert.equal(c('a : 9 = 7', { way: 'swap' }), null);
});

test('the bar: parts at least 0.15, the rest in proportion; equal for all 0 (rule 8)', () => {
  const s = logic.shares([89, 691], 0.15);
  assert.ok(Math.abs(s[0] - (0.15 + 0.7 * 89 / 780)) < 1e-12);
  assert.ok(Math.abs(s[0] + s[1] - 1) < 1e-12);
  assert.deepEqual(logic.shares([0, 0], 0.15), [0.5, 0.5]);
  assert.deepEqual(logic.shares([0, 10], 0.15), [0.15, 0.85]);
  assert.deepEqual(S({ op: 'add' }).shares, logic.shares([89, 691], logic.MIN_SHARE));
  assert.equal(S({ op: 'mul' }).shares, null);
  assert.equal(S({ op: 'sub' }).pieces, null);
});

test('the inequality: its line, solutions, halves and the slide at 0 (rule 9)', () => {
  const s = S({ mode: 'ineq', lo: 688, hi: 694, dir: 'gt' });
  assert.deepEqual([s.view.lo, s.view.hi, s.view.step], [685, 697, 1]);
  assert.deepEqual(s.solutions, [689, 690, 691, 692, 693]);
  assert.equal(s.nums.length, 13);
  assert.deepEqual(s.nums.filter((n) => n.bound).map((n) => n.v), [688, 694]);
  assert.deepEqual(s.halves, [{ rel: 'lt', b: 694 }, { rel: 'gt', b: 688 }]);
  assert.deepEqual(S({ mode: 'ineq', lo: 688, hi: 694, dir: 'lt' }).halves, [{ rel: 'gt', b: 688 }, { rel: 'lt', b: 694 }]);
  const b = S({ mode: 'ineq', lo: 12395, hi: 12402, dir: 'lt' });
  assert.deepEqual([b.view.lo, b.view.hi], [12392, 12405]);
  assert.equal(b.count, 6);
  assert.deepEqual([S({ mode: 'ineq', lo: 0, hi: 5 }).view.lo, S({ mode: 'ineq', lo: 0, hi: 5 }).view.hi], [0, 11]);
  assert.deepEqual([S({ mode: 'ineq', lo: 999990, hi: 1e6 }).view.lo, S({ mode: 'ineq', lo: 999990, hi: 1e6 }).view.hi], [999984, 1e6]);
  // the widest stretch still steps by 1
  const w = S({ mode: 'ineq', lo: 100, hi: 120 });
  assert.deepEqual([w.view.lo, w.view.hi, w.view.step], [97, 123, 1]);
  // an unknown dir is lt
  assert.equal(S({ mode: 'ineq', dir: 'x' }).dir, 'lt');
});

test('the inequality: marks, right, wrong, missing, and each mark checked by putting it back (rule 9)', () => {
  const view = logic.ineqView(688, 694);
  assert.equal(logic.maskOf([688, 689, 690, 691, 692, 693, 694], view), 1016);
  assert.deepEqual(logic.marksOf(1016, view), [688, 689, 690, 691, 692, 693, 694]);
  assert.deepEqual(logic.marksOf(1, view), [685]);
  assert.deepEqual(logic.marksOf(2 ** 20, view), []);        // a bit beyond the line is ignored
  assert.equal(logic.maskOf([700, 685], view), 1);            // a number off the line is not marked
  assert.equal(logic.maskOf([685, 685], view), 1);            // a duplicate counts once
  assert.equal(logic.toggle(0, view, 690), 32);
  assert.equal(logic.toggle(32, view, 690), 0);
  assert.equal(logic.toggle(0, view, 697), 4096);              // the last number on the line can be marked
  assert.deepEqual(logic.marksOf(4096, view), [697]);
  const out = S({ mode: 'ineq', lo: 688, hi: 694, marks: logic.maskOf([686, 696], view) });
  assert.deepEqual(out.wrong, [686, 696]);                     // outside the bounds is wrong too, not only the bounds
  const s = S({ mode: 'ineq', lo: 688, hi: 694, dir: 'gt', marks: 1016 });
  assert.deepEqual(s.right, [689, 690, 691, 692, 693]);
  assert.deepEqual(s.wrong, [688, 694]);
  assert.deepEqual(s.missing, []);
  assert.equal(s.complete, false);
  assert.deepEqual(s.checks.find((c) => c.v === 694), { v: 694, hold: [false, true], ok: false });
  assert.deepEqual(s.checks.find((c) => c.v === 688), { v: 688, hold: [true, false], ok: false });
  assert.deepEqual(s.checks.find((c) => c.v === 690), { v: 690, hold: [true, true], ok: true });
  const done = S({ mode: 'ineq', lo: 688, hi: 694, marks: logic.maskOf([689, 690, 691, 692, 693], view) });
  assert.equal(done.complete, true);
  const part = S({ mode: 'ineq', lo: 688, hi: 694, marks: logic.maskOf([690], view) });
  assert.deepEqual(part.missing, [689, 691, 692, 693]);
  assert.equal(part.complete, false);
});

test('the task field: sentences and inequalities, signs and spaces (rule 10)', () => {
  assert.deepEqual(logic.parseTask('780 − b = 89'), { task: { mode: 'eq', op: 'sub', u: 1, letter: 'b', pa: 89, qa: 691 } });
  assert.deepEqual(logic.parseTask('780-B=89').task.letter, 'b');
  assert.deepEqual(logic.parseTask('780 – b = 89').task.op, 'sub');
  assert.deepEqual(logic.parseTask('f · 65 = 975'), { task: { mode: 'eq', op: 'mul', u: 0, letter: 'f', pm: 15, qm: 65 } });
  for (const t of ['f*65=975', 'f × 65 = 975', 'f ⋅ 65 = 975']) assert.equal(logic.parseTask(t).task.op, 'mul', t);
  for (const t of ['63 : b = 9', '63/b=9', '63 ÷ b = 9']) assert.deepEqual(logic.parseTask(t).task, { mode: 'eq', op: 'div', u: 1, letter: 'b', pm: 9, qm: 7 }, t);
  assert.deepEqual(logic.parseTask('5871 + a = 7820').task, { mode: 'eq', op: 'add', u: 1, letter: 'a', pa: 5871, qa: 1949 });
  assert.deepEqual(logic.parseTask('a − 89 = 691').task, { mode: 'eq', op: 'sub', u: 0, letter: 'a', pa: 691, qa: 89 });
  assert.deepEqual(logic.parseTask('780 − 89 = c').task, { mode: 'eq', op: 'sub', u: 2, letter: 'c', pa: 691, qa: 89 });
  assert.deepEqual(logic.parseTask('a : 9 = 7').task, { mode: 'eq', op: 'div', u: 0, letter: 'a', pm: 7, qm: 9 });
  assert.deepEqual(logic.parseTask('63 : 7 = k').task, { mode: 'eq', op: 'div', u: 2, letter: 'k', pm: 9, qm: 7 });
  assert.deepEqual(logic.parseTask('694 > c > 688'), { task: { mode: 'ineq', lo: 688, hi: 694, dir: 'gt', letter: 'c' } });
  assert.deepEqual(logic.parseTask('12 395 < b < 12 402'), { task: { mode: 'ineq', lo: 12395, hi: 12402, dir: 'lt', letter: 'b' } });
  assert.deepEqual(logic.parseTask('12 395<b<12 402').task.hi, 12402);
  assert.equal(logic.parseTask('694 > C > 688').task.letter, 'c');
  // bounds exactly 20 apart are allowed, and 1 apart (no solution)
  assert.ok(logic.parseTask('10 < x < 30').task);
  assert.ok(logic.parseTask('10 < x < 11').task);
  // a sentence at the limit
  assert.ok(logic.parseTask('x + 1 = 1000000').task);
  assert.ok(logic.parseTask('999999 + 1 = x').task);
  assert.equal(T('x − 1 = 999999').value, 1000000);
  assert.equal(T('x : 1 = 1000000').value, 1000000);
  assert.equal(T('1000 · 1000 = x').value, 1000000);
  assert.deepEqual(logic.parseTask('1000000 > c > 999990').task, { mode: 'ineq', lo: 999990, hi: 1000000, dir: 'gt', letter: 'c' });
  // other signs and leading zeros
  assert.equal(logic.parseTask('780 — b = 89').task.op, 'sub');
  assert.equal(logic.parseTask('f ∙ 65 = 975').task.op, 'mul');
  assert.equal(logic.parseTask('0780 − b = 089').task.qa, 691);
  assert.equal(logic.parseTask('ab + 5 = 7').error, 'form');
});

test('the task field refuses, with the reason (rule 10)', () => {
  const e = (t) => logic.parseTask(t).error;
  assert.equal(e(''), 'empty');
  assert.equal(e('   '), 'empty');
  assert.equal(e(null), 'empty');
  assert.equal(e('780 − b'), 'form');
  assert.equal(e('89 = 780 − b'), 'form');
  assert.equal(e('780 − b = 89 = 89'), 'form');
  assert.equal(e('694 > c'), 'form');
  assert.equal(e('780 − 691 = 89'), 'letters');
  assert.equal(e('a − b = 89'), 'letters');
  assert.equal(e('c > 694 > 688'), 'letters');
  assert.equal(e('694 > c > d'), 'letters');
  assert.equal(e('x + 1 = 1000001'), 'big');
  assert.equal(e('999999 + 2 = x'), 'big');
  assert.equal(e('x − 999999 = 2'), 'big');
  assert.equal(e('x : 1000 = 1001'), 'big');
  assert.equal(e('1000 · 1001 = x'), 'big');
  assert.equal(e('5 < x < 1000001'), 'big');
  assert.equal(e('x + 245 = 100'), 'neg');
  assert.equal(e('245 + x = 100'), 'neg');
  assert.equal(e('100 − x = 200'), 'neg');
  assert.equal(e('100 − 200 = x'), 'neg');
  assert.equal(e('100 − x = 101'), 'neg');      // tie-break: one below 0 is already refused
  assert.equal(logic.parseTask('100 − x = 100').task.qa, 0);
  assert.equal(e('f · 7 = 50'), 'frac');
  assert.equal(e('7 · f = 50'), 'frac');
  assert.equal(e('50 : x = 7'), 'frac');
  assert.equal(e('5 : x = 7'), 'frac');
  assert.equal(e('50 : 7 = x'), 'rem');
  assert.equal(e('x · 0 = 5'), 'zero');
  assert.equal(e('x · 5 = 0'), 'zero');
  assert.equal(e('0 : x = 5'), 'zero');
  assert.equal(e('x : 0 = 5'), 'zero');
  assert.equal(e('688 < c > 694'), 'mixed');
  assert.equal(e('694 < c < 688'), 'order');
  assert.equal(e('694 > c > 694'), 'order');
  assert.equal(e('10 < x < 31'), 'wide');
});

test('the task as the field writes it, numbers grouped from 10 000 on', () => {
  assert.equal(logic.taskText(S({})), '780 − b = 89');
  assert.equal(logic.taskText(T('f · 65 = 975')), 'f · 65 = 975');
  assert.equal(logic.taskText(T('a : 9 = 7')), 'a : 9 = 7');
  assert.equal(logic.taskText(S({ mode: 'ineq', lo: 688, hi: 694, dir: 'gt', letter: 'c' })), '694 > c > 688');
  assert.equal(logic.taskText(S({ mode: 'ineq', lo: 12395, hi: 12402, dir: 'lt', letter: 'b' })), '12 395 < b < 12 402');
  assert.equal(logic.fmt(9999), '9999');
  assert.equal(logic.fmt(10000), '10 000');
  assert.equal(logic.fmt(1000000), '1 000 000');
  // what the field writes, it reads back as the same task
  for (const pr of logic.PRESETS) {
    const s = S(pr.params);
    const r = logic.parseTask(logic.taskText(s));
    assert.ok(r.task, pr.id);
    const back = S(Object.assign({}, pr.params, r.task));
    assert.equal(logic.taskText(back), logic.taskText(s), pr.id);
  }
});

test('the stages: show is clamped to the mode (0…3 sentence, 0…1 inequality)', () => {
  assert.equal(S({ show: 9 }).show, 3);
  assert.equal(S({ show: -1 }).show, 0);
  assert.equal(S({ mode: 'ineq', show: 3 }).show, 1);
  assert.equal(logic.showMax(P({})), 3);
  assert.equal(logic.showMax(P({ mode: 'ineq' })), 1);
});

test('the presets give the expected numbers (SPEC, Presets)', () => {
  const by = Object.fromEntries(logic.PRESETS.map((p) => [p.id, S(p.params)]));
  assert.equal(logic.taskText(by.minus), '780 − b = 89');
  assert.equal(by.minus.value, 691);
  assert.equal(by.plus.value, 42);
  assert.equal(logic.taskText(by.minuend), 'a − 89 = 691');
  assert.equal(by.minuend.value, 780);
  assert.equal(by.factor.value, 15);
  assert.equal(by.divisor.value, 7);
  assert.equal(by.divisor.pieces.head, 9);
  assert.equal(by.wrong.value, 869);
  assert.equal(by.wrong.check.why, 'neg');
  assert.equal(by.wrong.show, 1);
  assert.deepEqual(by.between.solutions, [689, 690, 691, 692, 693]);
  assert.deepEqual(by.ends.wrong, [688, 694]);
  assert.equal(by.big.count, 6);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [{}].concat(logic.PRESETS.map((x) => x.params))) {
    const s = S(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  for (const over of [{ op: 'mul', u: 0, way: 'swap' }, { mode: 'ineq', marks: 1016 }]) {
    const p = P(over);
    const copy = structuredClone(p);
    assert.deepEqual(logic.initial(p), logic.initial(p));
    logic.parseTask('780 − b = 89');
    assert.deepEqual(p, copy);
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the model is valid params, and the page is an explorer', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.ok(logic.PRESETS.length <= 9);
  for (const pr of logic.PRESETS) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.ok('p_' + pr.id in strings.hr, 'label for ' + pr.id);
    assert.ok('ph_' + pr.id in strings.hr, 'hint for ' + pr.id);
  }
});
