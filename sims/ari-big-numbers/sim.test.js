// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ari-big-numbers: the number line model (numberline.js, copied from ari-constant-difference with these
// four tests, promotable), then the page's model (sim.js): tie-breaks first, the rules, the presets' expected numbers
// (from the independent script, SPEC "Presets"), then the generic block every sim keeps. Rules: SPEC.md.
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
const at = (over, n) => kit.stateAt(logic, P(over), n);
const stepsOf = (over) => kit.stepsOf(logic, P(over));
const run = (over) => { const out = []; for (let i = 0; i <= stepsOf(over); i++) out.push(at(over, i)); return out; };
const C = (n, e, dir, count) => logic.countOf(P({ mode: 'count', n, e, dir, count }));
const W = (n, lang) => logic.wordsOf(n, lang).join(' ');

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

test('rule 4 tie: both ends of the range are reached; one count more is the end step', () => {
  const up = C(999997, 0, 'on', 4);
  assert.deepEqual(up.values, [999997, 999998, 999999, 1000000]);
  assert.equal(up.fit, 3);
  assert.equal(up.end, true);
  assert.equal(up.steps, 4);
  assert.deepEqual(up.states[4], { phase: 'end', i: 3, k: null });
  const exact = C(999999, 0, 'on', 1);
  assert.deepEqual(exact.values, [999999, 1000000]);
  assert.equal(exact.end, false);
  assert.equal(exact.steps, 1);
  const down = C(3, 0, 'back', 3);
  assert.deepEqual(down.values, [3, 2, 1, 0]);
  assert.equal(down.end, false);
  assert.deepEqual(run({ mode: 'count', n: 0, dir: 'back', count: 2 }), [{ phase: 'start', i: 0, k: null }, { phase: 'end', i: 0, k: null }]);
  // by 100 000 from 950 000: none fits (1 050 000 > a million)
  assert.equal(C(950000, 5, 'on', 3).fit, 0);
  assert.equal(C(900000, 5, 'on', 3).fit, 1);
});

test('rule 3 tie: a highest digit that becomes 0 is not written (10 000 − 1 = 9999, four places)', () => {
  const ch = logic.changeOf(10000, 0, 'back');
  assert.deepEqual(ch, { from: 10000, to: 9999, rolled: [0, 1, 2, 3], grew: 4, carries: [1, 2, 3, 4] });
  assert.equal(logic.digitsOf(ch.to).length, 4);
});

test('rule 7 tie: 0 alone is read nula / zero; a class 000 and the zeros in front of a class are not read', () => {
  assert.deepEqual(logic.wordsOf(0, 'hr'), ['zero']);
  assert.deepEqual(logic.wordsOf(0, 'en'), ['zero']);
  assert.equal(W(300005, 'hr'), 'h3 kC u5');
  assert.equal(W(7000, 'hr'), 'u7 kC');
  assert.equal(W(30005, 'hr'), 't3 kC u5');
  assert.deepEqual(logic.classWordsOf(0, 1, 'hr'), []);
  assert.deepEqual(logic.classWordsOf(5, 0, 'hr'), ['u5']);
});

test('rule 13 tie: equal numbers are compared down to the ones; more digits decide at the first step', () => {
  const eq = logic.compareOf(P({ mode: 'compare', n: 12345, m: 12345 }));
  assert.deepEqual(eq.places.map((x) => x.k), [4, 3, 2, 1, 0]);
  assert.equal(eq.decide, null);
  assert.equal(eq.verdict, '=');
  assert.equal(eq.steps, 6);
  assert.deepEqual(eq.states[6], { phase: 'verdict', i: 6, k: 0 });
  const zero = logic.compareOf(P({ mode: 'compare', n: 0, m: 0 }));
  assert.deepEqual([zero.verdict, zero.steps], ['=', 2]);
  const len = logic.compareOf(P({ mode: 'compare', n: 9876, m: 12345 }));
  assert.deepEqual(len.places, [{ k: 4, a: 0, b: 1 }]);
  assert.deepEqual([len.decide, len.verdict, len.steps], [4, '<', 2]);
  const mil = logic.compareOf(P({ mode: 'compare', n: 1000000, m: 999999 }));
  assert.deepEqual([mil.top, mil.decide, mil.verdict, mil.steps], [6, 6, '>', 2]);
});

test('mistake ties: 9 + 1 with nothing on the left is 10 either way; 6-digit numbers group the same from both ends', () => {
  const m = logic.mistakeOf(P({ mode: 'count', n: 8, count: 2 }));
  assert.equal(m.applies, false);
  assert.equal(m.reason, 'same');
  assert.equal(logic.mistakeOf(P({ mode: 'read', n: 345678 })).reason, 'six');
  assert.equal(logic.mistakeOf(P({ mode: 'read', n: 999 })).reason, 'short');
  // compare: the left-aligned verdict that happens to be right is no mistake to show
  assert.equal(logic.mistakeOf(P({ mode: 'compare', n: 92345, m: 1000 })).reason, 'agrees');
  assert.equal(logic.mistakeOf(P({ mode: 'compare', n: 345678, m: 345687 })).reason, 'same');
  assert.equal(logic.mistakeOf(P({ mode: 'compare', n: 123, m: 12345 })).reason, 'agrees');
});

// ── count ──

test('rule 1: a count adds or takes away 10^e; the places below e do not change', () => {
  assert.deepEqual(C(102000, 3, 'back', 5).values, [102000, 101000, 100000, 99000, 98000, 97000]);
  assert.deepEqual(C(40, 1, 'on', 2).values, [40, 50, 60]);
  const ch = logic.changeOf(99456, 3, 'on');
  assert.equal(ch.to, 100456);
  assert.deepEqual(ch.rolled, [3, 4]);
  assert.equal(logic.digitsOf(ch.to).slice(0, 3).join(''), logic.digitsOf(99456).slice(0, 3).join(''));
});

test('rule 2: on, every 9 from place e up turns to 0 and carries once; the first other digit grows by 1', () => {
  assert.deepEqual(logic.changeOf(99999, 0, 'on'), { from: 99999, to: 100000, rolled: [0, 1, 2, 3, 4], grew: 5, carries: [1, 2, 3, 4, 5] });
  assert.deepEqual(logic.changeOf(9999, 0, 'on'), { from: 9999, to: 10000, rolled: [0, 1, 2, 3], grew: 4, carries: [1, 2, 3, 4] });
  assert.deepEqual(logic.changeOf(4099, 0, 'on'), { from: 4099, to: 4100, rolled: [0, 1], grew: 2, carries: [1, 2] });
  assert.deepEqual(logic.changeOf(999999, 0, 'on').carries.length, 6);
  // no 9 at place e: nothing rolls, no carry
  assert.deepEqual(logic.changeOf(9998, 0, 'on'), { from: 9998, to: 9999, rolled: [], grew: 0, carries: [] });
  // a 9 below e does not roll (counting by thousands from 9 999)
  assert.deepEqual(logic.changeOf(9999, 3, 'on'), { from: 9999, to: 10999, rolled: [3], grew: 4, carries: [4] });
  // an empty place grows from 0 (5 + 1000)
  assert.deepEqual(logic.changeOf(5, 3, 'on'), { from: 5, to: 1005, rolled: [], grew: 3, carries: [] });
  // a 9 above a digit that is not 9 does not roll (9 899 + 1 = 9 900)
  assert.deepEqual(logic.changeOf(9899, 0, 'on').rolled, [0, 1]);
});

test('rule 3: back, every 0 from place e up turns to 9 and borrows once; the first other digit shrinks by 1', () => {
  assert.deepEqual(logic.changeOf(100000, 3, 'back'), { from: 100000, to: 99000, rolled: [3, 4], grew: 5, carries: [4, 5] });
  assert.deepEqual(logic.changeOf(100000, 0, 'back'), { from: 100000, to: 99999, rolled: [0, 1, 2, 3, 4], grew: 5, carries: [1, 2, 3, 4, 5] });
  assert.deepEqual(logic.changeOf(4100, 0, 'back'), { from: 4100, to: 4099, rolled: [0, 1], grew: 2, carries: [1, 2] });
  assert.deepEqual(logic.changeOf(4101, 0, 'back'), { from: 4101, to: 4100, rolled: [], grew: 0, carries: [] });
});

test('rule 4: the counts that fit; rule 5: start, one step per count, the end step when cut', () => {
  assert.equal(C(99997, 0, 'on', 5).steps, 5);
  assert.equal(C(5, 1, 'back', 3).fit, 0);
  assert.equal(C(10, 1, 'back', 3).fit, 1);
  assert.equal(C(10, 1, 'back', 3).steps, 2);
  assert.deepEqual(run({ mode: 'count', n: 9998, count: 2 }), [
    { phase: 'start', i: 0, k: null }, { phase: 'count', i: 1, k: null }, { phase: 'count', i: 2, k: null }]);
  let most = 0;
  for (const n of [0, 5, 999995, 1000000, 99997]) for (let e = 0; e <= 5; e++) for (const dir of logic.DIRS) {
    for (let c = 1; c <= logic.MAX_COUNT; c++) most = Math.max(most, stepsOf({ mode: 'count', n, e, dir, count: c }));
  }
  assert.equal(most, 10);   // the end step only comes when fewer than count fit
});

// ── read ──

test('rule 6: classes of three from the right, the highest may be shorter', () => {
  assert.deepEqual(logic.classesOf(345678).map((k) => [k.c, k.value]), [[1, 345], [0, 678]]);
  assert.deepEqual(logic.classesOf(30005).map((k) => [k.c, k.value, k.digits.length]), [[1, 30, 2], [0, 5, 3]]);
  assert.deepEqual(logic.classesOf(1000000).map((k) => [k.c, k.value]), [[2, 1], [1, 0], [0, 0]]);
  assert.deepEqual(logic.classesOf(7).map((k) => [k.c, k.value, k.digits.length]), [[0, 7, 1]]);
  assert.deepEqual(logic.classesOf(1000).map((k) => [k.c, k.value]), [[1, 1], [0, 0]]);
});

test('rule 8, hr: hundreds one word, tens and ones apart, 1 and 2 feminine in the thousands, tisuća by the plural form', () => {
  assert.equal(W(345678, 'hr'), 'h3 t4 u5 kC h6 t7 u8');
  assert.equal(W(99999, 'hr'), 't9 u9 kC h9 t9 u9');
  assert.equal(W(1000, 'hr'), 'k1');
  assert.equal(W(1021, 'hr'), 'k1 t2 u1');
  assert.equal(W(2000, 'hr'), 'f2 kB');
  assert.equal(W(21000, 'hr'), 't2 f1 kA');
  assert.equal(W(22000, 'hr'), 't2 f2 kB');
  assert.equal(W(11000, 'hr'), 'e11 kC');
  assert.equal(W(12000, 'hr'), 'e12 kC');
  assert.equal(W(101000, 'hr'), 'h1 f1 kA');
  assert.equal(W(112000, 'hr'), 'h1 e12 kC');
  assert.equal(W(1000000, 'hr'), 'm1');
  assert.equal(W(21, 'hr'), 't2 u1');
  assert.deepEqual([1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 111, 112, 122].map(logic.hrForm), [0, 1, 1, 2, 2, 2, 2, 0, 1, 2, 2, 2, 1]);
  // the kit's plural rule agrees (one rule for the page's plurals and for tisuća)
  for (let v = 1; v < 1000; v++) assert.equal(logic.hrForm(v), kit.pluralIndex('hr', v), String(v));
});

test('rule 8, en: and after hundred, hyphenated tens, and before a small ones class', () => {
  assert.equal(W(345678, 'en'), 'u3 hundred and t4 - u5 kC u6 hundred and t7 - u8');
  assert.equal(W(30005, 'en'), 't3 kC and u5');
  assert.equal(W(300005, 'en'), 'u3 hundred kC and u5');
  assert.equal(W(1000, 'en'), 'k1');
  assert.equal(W(1001, 'en'), 'k1 and u1');
  assert.equal(W(100000, 'en'), 'u1 hundred kC');
  assert.equal(W(112000, 'en'), 'u1 hundred and e12 kC');
  assert.equal(W(1200, 'en'), 'k1 u2 hundred');
  assert.equal(W(1000000, 'en'), 'm1');
  assert.equal(W(40, 'en'), 't4');
  assert.equal(W(1099, 'en'), 'k1 and t9 - u9');   // and before a ones class up to 99
  assert.equal(W(1100, 'en'), 'k1 u1 hundred');
});

test('rule 9: digits, classes, one step per class from the highest, words', () => {
  assert.deepEqual(run({ mode: 'read', n: 345678 }), [
    { phase: 'digits', i: 0, k: null }, { phase: 'classes', i: 1, k: null }, { phase: 'class', i: 2, k: 1 },
    { phase: 'class', i: 3, k: 0 }, { phase: 'words', i: 4, k: null }]);
  assert.equal(stepsOf({ mode: 'read', n: 7 }), 3);
  assert.equal(stepsOf({ mode: 'read', n: 1000000 }), 5);
  assert.deepEqual(run({ mode: 'read', n: 1000000 }).map((s) => s.k), [null, null, 2, 1, 0, null]);
});

// ── compare ──

test('rules 10–12: by place from the highest down; the first place that differs decides', () => {
  const D = logic.compareOf(P({ mode: 'compare', n: 345678, m: 345687 }));
  assert.deepEqual(D.places.map((x) => x.k), [5, 4, 3, 2, 1]);
  assert.deepEqual(D.places[4], { k: 1, a: 7, b: 8 });
  assert.deepEqual([D.decide, D.verdict, D.steps], [1, '<', 6]);
  const E = logic.compareOf(P({ mode: 'compare', n: 12402, m: 12395 }));
  assert.deepEqual([E.decide, E.verdict, E.steps], [2, '>', 4]);
  assert.deepEqual([logic.compareOf(P({ mode: 'compare', n: 5, m: 0 })).verdict, logic.compareOf(P({ mode: 'compare', n: 5, m: 0 })).decide], ['>', 0]);
  // the places right of the deciding one are never compared, whatever they hold
  assert.equal(logic.compareOf(P({ mode: 'compare', n: 200000, m: 199999 })).places.length, 1);
});

test('rule 14: question, one step per place, the verdict; at most 8 steps', () => {
  assert.deepEqual(run({ mode: 'compare', n: 345678, m: 345687 }).map((s) => [s.phase, s.k]),
    [['start', 5], ['place', 5], ['place', 4], ['place', 3], ['place', 2], ['place', 1], ['verdict', 1]]);
  assert.equal(stepsOf({ mode: 'compare', n: 1000000, m: 1000000 }), 8);
});

// ── the number line ──

test('rule 15: count, the stretch of the whole demo one step wider, cut to the range; it does not move', () => {
  const p = P({ mode: 'count', n: 99997 });
  for (let i = 0; i <= 5; i++) assert.deepEqual(logic.lineOf(p, at({ mode: 'count', n: 99997 }, i)).view, { lo: 99996, hi: 100003, step: 1, minor: 0 });
  const l3 = logic.lineOf(p, at({ mode: 'count', n: 99997 }, 3));
  assert.deepEqual(l3.points, [{ v: 99997, role: 'done' }, { v: 99998, role: 'done' }, { v: 99999, role: 'done' }, { v: 100000, role: 'now' }]);
  assert.deepEqual(logic.lineOf(P({ mode: 'count', n: 999997, count: 4 }), at({ mode: 'count', n: 999997, count: 4 }, 4)).view, { lo: 999996, hi: 1000000, step: 1, minor: 0 });
  assert.deepEqual(logic.lineOf(P({ mode: 'count', n: 2, dir: 'back', count: 4 }), { phase: 'start', i: 0, k: null }).view, { lo: 0, hi: 3, step: 1, minor: 0 });
  assert.deepEqual(logic.lineOf(P({ mode: 'count', n: 102000, e: 3, dir: 'back' }), { phase: 'start', i: 0, k: null }).view, { lo: 96000, hi: 103000, step: 1000, minor: 0 });
  // n not a multiple of by: the stretch starts one count before n, so every tick is a count (99 997 + j · 1000)
  assert.deepEqual(logic.lineOf(P({ mode: 'count', n: 99997, e: 3 }), { phase: 'start', i: 0, k: null }).view, { lo: 98997, hi: 105997, step: 1000, minor: 0 });
  // no room on one side: no padding there (50 000 back by 100 000: nothing fits; one count wide)
  assert.deepEqual(logic.lineOf(P({ mode: 'count', n: 50000, e: 5, dir: 'back', count: 2 }), { phase: 'start', i: 0, k: null }).view, { lo: 50000, hi: 150000, step: 100000, minor: 0 });
  assert.deepEqual(logic.lineOf(P({ mode: 'count', n: 15, e: 1, dir: 'back', count: 3 }), { phase: 'start', i: 0, k: null }).view, { lo: 5, hi: 25, step: 10, minor: 0 });
  assert.deepEqual(logic.lineOf(P({ mode: 'count', n: 950000, e: 5, count: 1 }), { phase: 'start', i: 0, k: null }).view, { lo: 850000, hi: 950000, step: 100000, minor: 0 });
  // the end step keeps the last count as the current one
  assert.equal(logic.lineOf(P({ mode: 'count', n: 999997, count: 4 }), { phase: 'end', i: 3, k: null }).points.pop().v, 1000000);
});

test('rule 16: read, the whole line, then the thousands read, then the stretch of 1000 around the number', () => {
  const p = P({ mode: 'read', n: 345678 });
  const L = (n) => logic.lineOf(p, at({ mode: 'read', n: 345678 }, n));
  assert.deepEqual(L(0), { view: { lo: 0, hi: 1000000, step: 100000, minor: 10000 }, points: [{ v: 345678, role: 'now' }] });
  assert.deepEqual(L(2), { view: { lo: 0, hi: 1000000, step: 100000, minor: 10000 }, points: [{ v: 345000, role: 'now' }] });
  assert.deepEqual(L(3), { view: { lo: 345000, hi: 346000, step: 100, minor: 10 }, points: [{ v: 345678, role: 'now' }] });
  assert.deepEqual(L(4).view, L(3).view);
  const M = (n) => logic.lineOf(P({ mode: 'read', n: 1000000 }), at({ mode: 'read', n: 1000000 }, n));
  assert.deepEqual(M(2).points, [{ v: 1000000, role: 'now' }]);
  assert.deepEqual(M(4).view, { lo: 999000, hi: 1000000, step: 100, minor: 10 });
  assert.deepEqual(logic.stretchOf(345678, 1e9), { lo: 0, hi: 1000000, step: 100000 });
});

test('rule 17: compare, the stretch of 10^(k+1) holding both numbers, tenfold smaller per equal place', () => {
  const over = { mode: 'compare', n: 345678, m: 345687 };
  const views = run(over).map((s) => { const v = logic.lineOf(P(over), s).view; return [v.lo, v.hi, v.step]; });
  assert.deepEqual(views, [[0, 1000000, 100000], [0, 1000000, 100000], [300000, 400000, 10000], [340000, 350000, 1000],
    [345000, 346000, 100], [345600, 345700, 10], [345600, 345700, 10]]);
  assert.deepEqual(logic.lineOf(P({ mode: 'compare', n: 9876, m: 12345 }), { phase: 'start', i: 0, k: 4 }).view,
    { lo: 0, hi: 100000, step: 10000, minor: 1000 });
  // equal at a million: the stretch of 10 slides left into the range
  assert.deepEqual(logic.lineOf(P({ mode: 'compare', n: 1000000, m: 1000000 }), { phase: 'verdict', i: 8, k: 0 }).view,
    { lo: 999990, hi: 1000000, step: 1, minor: 0 });
  // the place M: 10^7 is over a million, so the whole line (1 000 000 ? 999 999)
  for (const s of run({ mode: 'compare', n: 1000000, m: 999999 })) {
    assert.deepEqual(logic.lineOf(P({ mode: 'compare', n: 1000000, m: 999999 }), s).view, { lo: 0, hi: 1000000, step: 100000, minor: 10000 });
  }
  assert.deepEqual(logic.lineOf(P({ mode: 'compare', n: 9876, m: 12345 }), { phase: 'start', i: 0, k: 4 }).points,
    [{ v: 9876, role: 'a' }, { v: 12345, role: 'b' }]);
});

// ── the typical mistakes ──

test('mistake, count on: the 10 written in the square at the first count that carries', () => {
  const m = logic.mistakeOf(P({ mode: 'count', n: 9997 }));
  assert.deepEqual([m.applies, m.at, m.from, m.right, m.wrong], [true, 3, 9999, 10000, 99910]);
  assert.equal(logic.mistakeOf(P({ mode: 'count', n: 99997 })).wrong, 999910);
  assert.equal(logic.mistakeOf(P({ mode: 'count', n: 99000, e: 3, count: 2 })).wrong, 910000);
  assert.equal(logic.mistakeOf(P({ mode: 'count', n: 4098, count: 2 })).wrong, 40910);
  assert.equal(logic.mistakeOf(P({ mode: 'count', n: 1000, count: 3 })).reason, 'nocarry');
  // e ≥ 1 keeps the digits below e: 9995 + 10 written with 10 in the tens square is 99 105 (right 10 005)
  const lo = logic.mistakeOf(P({ mode: 'count', n: 9995, e: 1, count: 2 }));
  assert.deepEqual([lo.right, lo.wrong], [10005, 99105]);
});

test('mistake, count back: the borrow is lost at the first count that borrows', () => {
  const m = logic.mistakeOf(P({ mode: 'count', n: 102000, e: 3, dir: 'back' }));
  assert.deepEqual([m.applies, m.at, m.from, m.right, m.wrong], [true, 3, 100000, 99000, 199000]);
  assert.equal(logic.mistakeOf(P({ mode: 'count', n: 10001, dir: 'back', count: 3 })).wrong, 19999);
  assert.equal(logic.mistakeOf(P({ mode: 'count', n: 4100, dir: 'back', count: 1 })).wrong, 4199);
  assert.equal(logic.mistakeOf(P({ mode: 'count', n: 9999, dir: 'back', count: 3 })).reason, 'noborrow');
});

test('mistake, read: classes from the left for 4 and 5 digits', () => {
  assert.deepEqual(logic.mistakeOf(P({ mode: 'read', n: 30005 })), { mode: 'read', applies: true, reason: null, groups: ['300', '05'], wrong: 300005 });
  assert.equal(logic.mistakeOf(P({ mode: 'read', n: 34567 })).wrong, 345067);
  assert.equal(logic.mistakeOf(P({ mode: 'read', n: 1234 })).wrong, 123004);
  assert.equal(logic.mistakeOf(P({ mode: 'read', n: 1000000 })).reason, 'long');
});

test('mistake, compare: aligned at the left, the first digits decide whatever their places', () => {
  assert.deepEqual(logic.mistakeOf(P({ mode: 'compare', n: 9876, m: 12345 })), { mode: 'compare', applies: true, reason: null, wrong: '>', col: 0 });
  assert.equal(logic.mistakeOf(P({ mode: 'compare', n: 12345, m: 2000 })).wrong, '<');
  assert.equal(logic.mistakeOf(P({ mode: 'compare', n: 12345, m: 1299 })).col, 2);
});

// ── params and parsing ──

test('params: rounded and clamped; unknown mode and dir fall back', () => {
  const x = logic.numbersOf({ mode: 'x', n: '12.6', m: -4, e: 9, dir: 'y', count: 0, mistake: 'true' });
  assert.deepEqual(x, { mode: 'count', n: 13, m: 0, e: 5, by: 100000, dir: 'on', count: 1, mistake: true });
  assert.equal(logic.numbersOf({ n: 5e9 }).n, 1000000);
  assert.equal(logic.numbersOf({ n: 'abc' }).n, 99997);
  assert.equal(logic.numbersOf({ n: '' }).n, 99997);
  assert.equal(logic.numbersOf({ mistake: false }).mistake, false);
  assert.equal(logic.numbersOf({ mistake: 'false' }).mistake, false, 'the URL gives a string');
  assert.equal(logic.numbersOf({ count: 99 }).count, 10);
});

test('parseNumber: digits and spaces, 0 … a million', () => {
  assert.deepEqual(logic.parseNumber('345 678'), { value: 345678 });
  assert.deepEqual(logic.parseNumber('345 678'), { value: 345678 });
  assert.deepEqual(logic.parseNumber('0'), { value: 0 });
  assert.deepEqual(logic.parseNumber('1000000'), { value: 1000000 });
  assert.equal(logic.parseNumber('1000001').error, 'max');
  assert.deepEqual(logic.parseNumber('34.5'), { error: 'digit', at: '.' });
  assert.equal(logic.parseNumber(' ').error, 'empty');
});

// ── presets: expected numbers from the independent script (SPEC "Presets") ──

test('presets', () => {
  const pr = Object.fromEntries(logic.PRESETS.map((x) => [x.id, x.params]));
  assert.equal(logic.PRESETS.length, 8);
  assert.deepEqual(logic.countOf(P(pr['over-9999'])).values, [9997, 9998, 9999, 10000, 10001, 10002]);
  assert.deepEqual(logic.countOf(P(pr['over-9999'])).changes[2].rolled, [0, 1, 2, 3]);
  assert.deepEqual(logic.countOf(P(pr['over-99999'])).values, [99997, 99998, 99999, 100000, 100001, 100002]);
  assert.deepEqual(logic.countOf(P(pr['over-99999'])).changes[2].grew, 5);
  assert.deepEqual(logic.countOf(P(pr['back-thousands'])).values, [102000, 101000, 100000, 99000, 98000, 97000]);
  assert.equal(logic.mistakeOf(P(pr['back-thousands'])).wrong, 199000);
  assert.deepEqual(logic.countOf(P(pr.million)).values, [999997, 999998, 999999, 1000000]);
  assert.equal(logic.countOf(P(pr.million)).changes[2].carries.length, 6);
  assert.equal(W(pr.read.n, 'hr'), 'h3 t4 u5 kC h6 t7 u8');
  assert.equal(W(pr['read-zeros'].n, 'hr'), 't3 kC u5');
  assert.equal(logic.mistakeOf(P(pr['read-zeros'])).wrong, 300005);
  assert.deepEqual([logic.compareOf(P(pr.compare)).decide, logic.compareOf(P(pr.compare)).verdict], [1, '<']);
  assert.deepEqual([logic.compareOf(P(pr['compare-length'])).decide, logic.mistakeOf(P(pr['compare-length'])).wrong], [4, '>']);
  assert.deepEqual(logic.PRESETS.map((x) => stepsOf(x.params)), [5, 5, 5, 4, 4, 4, 6, 2]);
  assert.deepEqual(logic.PRESETS.map((x) => x.params.mistake), [false, false, true, false, false, true, false, true]);
  assert.deepEqual(pr['over-99999'], Object.assign({}, { mode: logic.defaults.mode, n: logic.defaults.n, e: logic.defaults.e,
    dir: logic.defaults.dir, count: logic.defaults.count, mistake: logic.defaults.mistake }), 'the default demo is preset 2');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of [{}, { mode: 'read', n: 1000000 }, { mode: 'compare', n: 9876, m: 12345 }]) {
    for (const s of run(over)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of [{}, { mode: 'count', n: 999997, count: 4 }, { mode: 'read', n: 345678 }, { mode: 'compare', n: 12345, m: 12345 }]) {
    const p = P(over);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    const steps = logic.steps(p);
    for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('a step past the end is the last state', () => {
  const p = P({ mode: 'compare', n: 9876, m: 12345 });
  assert.deepEqual(logic.step(logic.initial(p), 9, p), { phase: 'verdict', i: 2, k: 4 });
});

test('step does not mutate its input', () => {
  const p = P({ mode: 'compare', n: 345678, m: 345687 });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every word token the model can give has a string in both languages', () => {
  const keys = new Set();
  for (let v = 0; v <= 1000; v++) for (const lang of ['hr', 'en']) for (const k of logic.wordsOf(v, lang)) keys.add(k);
  for (const v of [1000000, 21000, 22000, 2000, 5000, 1000, 112000]) for (const lang of ['hr', 'en']) for (const k of logic.wordsOf(v, lang)) keys.add(k);
  keys.delete('-');
  for (const k of keys) for (const lang of ['hr', 'en']) assert.ok(strings[lang]['w_' + k], lang + ': w_' + k);
});

test('the page and sim.json agree with the model (steps of the default, preset params)', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps is the default demo');
  assert.equal(json.steps, meta.steps);
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
  for (const e of json.entries || []) assert.ok(logic.PRESETS.some((pr) => pr.id === e.preset), e.preset);
});
