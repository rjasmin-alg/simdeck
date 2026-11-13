// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ari-long-division's model (SPEC.md). Run: node --test sims/ari-long-division/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const nums = (a, b, over) => P(Object.assign({ a: a, b: b }, over));
const at = (p, n) => kit.stateAt(logic, p, n);
const last = (p) => at(p, logic.steps(p));
const plan = (p) => logic.planOf(p);
const D = logic.DIGITS;
/** The quotient digits (left first) as a numeral. */
const qtxt = (ds) => ds.map((d) => D[d]).join('');
/** The rows of the paper as written: the remainder's numeral, then the digit brought down. */
const rows = (p) => plan(p).steps.map((s) => logic.textOf(s.rest, p.base) + (s.down == null ? '' : D[s.down]));
/** Each quotient digit's work as [number, q, product, remainder], numerals in the base. */
const work = (p) => plan(p).steps.map((s) => [logic.textOf(s.num, p.base), s.q, logic.textOf(s.prod, p.base), logic.textOf(s.rest, p.base)]);

// ── tie-breaks first ──

test('tie-break 1: a leading part equal to the divisor can be divided (312 : 3 starts with 3)', () => {
  const pl = plan(nums(312, 3));
  assert.equal(pl.g, 1);
  assert.deepEqual(work(nums(312, 3))[0], ['3', 1, '3', '0']);
  assert.equal(qtxt(pl.quot), '104');
  const one = plan(nums(3, 3));
  assert.deepEqual([one.g, one.Q, qtxt(one.quot), one.remainder], [1, 1, '1', 0]);
  assert.equal(logic.steps(nums(3, 3)), 2);
  assert.equal(plan(nums(12, 12)).g, 2, 'two digits equal to a two-digit divisor');
});

test('tie-break 2: a whole dividend smaller than the divisor: quotient 0, remainder the dividend', () => {
  const p = nums(2, 3);
  const pl = plan(p);
  assert.deepEqual([pl.g, pl.Q, qtxt(pl.quot), pl.remainder], [1, 1, '0', 2]);
  assert.equal(logic.steps(p), 2);
  assert.deepEqual(rows(p), ['2']);
  assert.deepEqual([plan(nums(0, 3)).quotient, plan(nums(0, 3)).remainder], [0, 0]);
  const big = plan(nums(99, 123));
  assert.deepEqual([big.g, big.Q, qtxt(big.quot), big.remainder], [2, 1, '0', 99], 'the whole dividend is the one number');
});

test('tie-break 3: a remainder of 0 is written, with the digit brought down beside it; the last 0 too', () => {
  assert.deepEqual(rows(nums(846, 3)), ['24', '06', '0']);
  assert.deepEqual(rows(nums(630, 3)), ['03', '00', '0']);
  const s = last(nums(846, 3));
  assert.deepEqual(s.rows, [{ rest: [2], down: 4 }, { rest: [0], down: 6 }, { rest: [0], down: null }]);
});

// ── rules ──

test('rule 4: take as few leading digits as can be divided (1736 : 7 starts with 17; no leading 0)', () => {
  const p = nums(1736, 7);
  const pl = plan(p);
  assert.deepEqual([pl.g, pl.Q], [2, 3]);
  assert.deepEqual(work(p), [['17', 2, '14', '3'], ['33', 4, '28', '5'], ['56', 8, '56', '0']]);
  assert.equal(qtxt(pl.quot), '248');
  assert.deepEqual(rows(p), ['33', '56', '0']);
  assert.deepEqual(pl.steps.map((s) => s.end), [2, 1, 0], 'each number ends under its last dividend digit');
  assert.deepEqual(work(nums(9876, 12))[0], ['98', 8, '96', '2']);
});

test('rule 5: a number smaller than the divisor gives a 0 in the quotient, and the work goes on', () => {
  const p = nums(618, 3);
  assert.deepEqual(work(p), [['6', 2, '6', '0'], ['1', 0, '0', '1'], ['18', 6, '18', '0']]);
  assert.deepEqual(rows(p), ['01', '18', '0']);
  assert.equal(qtxt(plan(p).quot), '206');
  assert.equal(qtxt(plan(nums(630, 3)).quot), '210', 'a 0 at the end');
  const r = plan(nums(2023, 4));
  assert.deepEqual([qtxt(r.quot), r.remainder], ['505', 3]);
  assert.deepEqual(rows(nums(2023, 4)), ['02', '23', '3']);
  assert.equal(qtxt(plan(nums(100000, 1)).quot), '100000');
});

test('rule 6 and 7: q is the largest k with k · d ≤ the number; every q is a digit; every remainder < divisor', () => {
  let seed = 11;
  const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  for (let b = 2; b <= 16; b++) {
    for (let t = 0; t < 120; t++) {
      const a = rnd(b ** 6), d = 1 + rnd(b ** 3 - 1);
      for (const s of logic.divideColumns(a, d, b).steps) {
        assert.ok(s.q * d <= s.num && (s.q + 1) * d > s.num, `${a}:${d} base ${b}`);
        assert.ok(s.q < b);
        assert.ok(s.rest < d);
        assert.equal(s.prod, s.q * d);
        assert.equal(s.rest, s.num - s.prod);
      }
    }
  }
});

test('rule 8: quotient · divisor + remainder = dividend in every base; at most 17 steps', () => {
  let seed = 5;
  const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  for (let b = 2; b <= 16; b++) {
    const cases = [[b ** 6 - 1, 1], [b ** 6 - 1, b ** 3 - 1], [b ** 5, b - 1 || 1]];
    for (let t = 0; t < 150; t++) cases.push([rnd(b ** 6), 1 + rnd(b ** 3 - 1)]);
    for (const [a, d] of cases) {
      const pl = logic.divideColumns(a, d, b);
      assert.equal(pl.quotient, Math.floor(a / d), `${a}:${d} base ${b}`);
      assert.equal(pl.remainder, a % d);
      assert.ok(pl.Q === 1 || pl.quot[0] > 0, 'no leading 0');
      assert.ok(3 * pl.Q - 1 <= 17);
    }
  }
  assert.equal(logic.steps(nums(999999, 1)), 17, 'the most steps: six quotient digits');
});

test('one step: ask writes q, sub writes the remainder, down the next digit; the order of 846 : 3', () => {
  const p = nums(846, 3);
  assert.equal(logic.steps(p), 8);
  assert.deepEqual(plan(p).seq.map((x) => x.phase + x.i), ['ask0', 'sub0', 'down0', 'ask1', 'sub1', 'down1', 'ask2', 'sub2']);
  const s0 = at(p, 0);
  assert.deepEqual([s0.phase, s0.i, s0.quot, s0.rows[0]], ['start', -1, [], { rest: null, down: null }]);
  const s1 = at(p, 1);
  assert.deepEqual([s1.phase, s1.quot, s1.rows[0].rest], ['ask', [2], null]);
  const s2 = at(p, 2);
  assert.deepEqual([s2.phase, s2.rows[0]], ['sub', { rest: [2], down: null }]);
  const s3 = at(p, 3);
  assert.deepEqual([s3.phase, s3.rows[0]], ['down', { rest: [2], down: 4 }]);
  const s4 = at(p, 4);
  assert.deepEqual([s4.phase, s4.i, s4.quot], ['ask', 1, [2, 8]]);
  const s8 = last(p);
  assert.deepEqual([s8.phase, s8.i, qtxt(s8.quot)], ['sub', 2, '282']);
  assert.deepEqual(at(nums(2, 3), 2).rows, [{ rest: [2], down: null }]);
});

test('rule 9: the invariant a = d · done + left after each subtraction (846 = 3 · 200 + 246 …)', () => {
  const p = nums(846, 3);
  assert.deepEqual(logic.invariantOf(p, -1), { done: 0, left: 846 });
  assert.deepEqual(logic.invariantOf(p, 0), { done: 200, left: 246 });
  assert.deepEqual(logic.invariantOf(p, 1), { done: 280, left: 6 });
  assert.deepEqual(logic.invariantOf(p, 2), { done: 282, left: 0 });
  assert.deepEqual(logic.invariantOf(nums(1736, 7), 0), { done: 200, left: 336 });
  for (const [a, d, b] of [[618, 3, 10], [46, 5, 2], [846, 3, 16], [65535, 255, 16], [2, 3, 10]]) {
    const q = nums(a, d, { base: b });
    const pl = plan(q);
    pl.steps.forEach((s) => {
      const inv = logic.invariantOf(q, s.i);
      assert.equal(d * inv.done + inv.left, a);
      assert.equal(inv.left, s.rest * b ** s.end + (a % b ** s.end), 'left = remainder at its place + the digits not yet brought down');
    });
    assert.deepEqual(logic.invariantOf(q, pl.Q - 1), { done: Math.floor(a / d), left: a % d });
  }
});

test('the box: the multiples k · d up to q + 1 (at most base − 1), each fits or not', () => {
  assert.deepEqual(logic.multiplesOf(nums(846, 3), 0), [{ k: 1, value: 3, fits: true }, { k: 2, value: 6, fits: true }, { k: 3, value: 9, fits: false }]);
  assert.deepEqual(logic.multiplesOf(nums(618, 3), 1), [{ k: 1, value: 3, fits: false }], 'q = 0: only the first, too big');
  const nine = logic.multiplesOf(nums(9, 1), 0);
  assert.equal(nine.length, 9, 'q = base − 1: no tenth row');
  assert.ok(nine.every((m) => m.fits));
  assert.deepEqual(logic.multiplesOf(nums(46, 5, { base: 2 }), 0), [{ k: 1, value: 5, fits: true }], 'base 2: only "does it fit"');
});

test('rule 10: any base, same algorithm (34E : 3 = 11A in base 16; 101110 : 101 = 1001 r 1 in base 2)', () => {
  const h = nums(846, 3, { base: 16 });
  assert.deepEqual(work(h), [['3', 1, '3', '0'], ['4', 1, '3', '1'], ['1E', 10, '1E', '0']]);
  assert.deepEqual(rows(h), ['04', '1E', '0']);
  assert.equal(qtxt(plan(h).quot), '11A');
  const b2 = nums(46, 5, { base: 2 });
  const pl = plan(b2);
  assert.deepEqual([pl.g, qtxt(pl.quot), pl.remainder], [3, '1001', 1]);
  assert.deepEqual(rows(b2), ['01', '11', '110', '1']);
  assert.equal(logic.steps(b2), 11);
  for (let a = 0; a < 64; a++) for (let d = 1; d < 8; d++) {
    for (const s of logic.divideColumns(a, d, 2).steps) assert.ok(s.q === 0 || s.q === 1);
  }
});

test('limits: dividend 6 digits, divisor 3, divisor not 0; typed input refused with a reason', () => {
  assert.equal(logic.fitsIn([999999, 999], 10), true);
  assert.equal(logic.fitsIn([1000000, 3], 10), false);
  assert.equal(logic.fitsIn([846, 1000], 10), false);
  assert.equal(logic.minBase([846, 3]), 4, '846 has 5 digits in base 4 (31032), 7 in base 3');
  assert.equal(logic.minBase([46, 5]), 2);
  assert.deepEqual(logic.parseList('846 : 3', 10), { values: [846, 3] });
  assert.deepEqual(logic.parseList('846÷3', 10), { values: [846, 3] });
  assert.deepEqual(logic.parseList('846/3', 10), { values: [846, 3] });
  assert.deepEqual(logic.parseList('846 3', 10), { values: [846, 3] });
  assert.deepEqual(logic.parseList('34e : 3', 16), { values: [846, 3] });
  assert.deepEqual(logic.parseList('0846 : 03', 10), { values: [846, 3] });
  assert.deepEqual(logic.parseList('0000846 : 0003', 10), { values: [846, 3] }, 'leading zeros do not count against the limit');
  assert.deepEqual(logic.parseList('1234567 : 3', 10), { error: 'long', at: '1234567' });
  assert.deepEqual(logic.parseList('846 : 1234', 10), { error: 'long', at: '1234' });
  assert.deepEqual(logic.parseList('846 : 3A', 10), { error: 'digit', at: 'A' });
  assert.deepEqual(logic.parseList('846 · 3', 10), { error: 'digit', at: '·' });
  assert.deepEqual(logic.parseList('102 : 1', 2), { error: 'digit', at: '2' });
  assert.deepEqual(logic.parseList('846', 10), { error: 'count', at: '1' });
  assert.deepEqual(logic.parseList('8 : 4 : 2', 10), { error: 'count', at: '3' });
  assert.deepEqual(logic.parseList('', 10), { error: 'count', at: '' });
  assert.deepEqual(logic.parseList('846 :', 10), { error: 'empty', at: ':' });
  assert.deepEqual(logic.parseList('846 : 0', 10), { error: 'zero', at: '0' });
  assert.deepEqual(logic.parseList('846 : 000', 10), { error: 'zero', at: '0' });
  assert.deepEqual(logic.numbersOf({ a: -3, b: 'x' }), [0, 1], 'a bad divisor is 1, never 0');
  assert.deepEqual(logic.numbersOf({ a: Infinity, b: 0 }), [0, 1]);
  assert.deepEqual(logic.numbersOf({ a: 2e7, b: 5000.7 }), [16777215, 4095], 'clamped to six and three hexadecimal digits');
  assert.deepEqual(logic.numbersOf({ a: 16777215, b: 4095, base: 10 }), [999999, 999], 'and to the limits of the base');
  assert.deepEqual(logic.numbersOf({ a: 999999.6, b: 7.9, base: 10 }), [999999, 7], 'whole: floored, not rounded');
  assert.ok(logic.steps({ a: 16777215, b: 1, base: 10 }) <= 17, '?a=Infinity, clamped by the kit, keeps the step limit');
  assert.deepEqual(logic.parseList('2 2 2', 2), { error: 'digit', at: '2' }, 'a wrong count still names a bad digit first');
});

// ── typical mistakes ──

test('mistake zero: a 0 in the quotient left out (618 : 3 → 26; 2023 : 4 → 55; 630 : 3 → 21)', () => {
  const m = logic.mistakeOf(nums(618, 3), 'zero');
  assert.equal(m.text, '26');
  assert.deepEqual(m.keep, [true, false, true]);
  assert.deepEqual(m.differs, [false, true, true], '2·6 against 2·0·6, from the left');
  assert.deepEqual(m.first, { i: 1, num: 1, end: 1 });
  assert.equal(m.check, 78);
  assert.equal(m.same, false);
  assert.equal(logic.mistakeOf(nums(2023, 4), 'zero').text, '55');
  assert.equal(logic.mistakeOf(nums(630, 3), 'zero').text, '21');
  assert.equal(logic.mistakeOf(nums(46, 5, { base: 2 }), 'zero').text, '11');
  assert.equal(logic.mistakeOf(nums(2, 3), 'zero').text, '0', 'a lone 0 quotient is written');
  assert.deepEqual(logic.mistakeOf(nums(100000, 1), 'zero').differs, [false, true, true, true, true, true],
    '1 against 100000: compared from the left, as written after =');
  assert.deepEqual(logic.mistakeOf(nums(100000, 1), 'zero').first, { i: 1, num: 0, end: 4 }, 'the first 0 left out');
});

test('mistake dropped: each later number is the digit alone (846 : 3 → 212 r 0; 618 : 3 → 202 r 2)', () => {
  const m = logic.mistakeOf(nums(846, 3), 'dropped');
  assert.deepEqual([m.text, m.remainder, m.check], ['212', 0, 636]);
  assert.deepEqual(m.differs, [false, true, false]);
  assert.deepEqual(m.first, { i: 0, rest: 2, end: 2, down: 4, right: 24, wrong: 4 });
  assert.deepEqual(m.steps.map((s) => [s.num, s.q, s.rest]), [[8, 2, 2], [4, 1, 1], [6, 2, 0]]);
  const z = logic.mistakeOf(nums(618, 3), 'dropped');
  assert.deepEqual([z.text, z.remainder], ['202', 2]);
  const f = logic.mistakeOf(nums(1736, 7), 'dropped');
  assert.deepEqual([f.text, f.remainder], ['200', 6]);
  assert.deepEqual([logic.mistakeOf(nums(2023, 4), 'dropped').text, logic.mistakeOf(nums(2023, 4), 'dropped').remainder], ['500', 3]);
  const h = logic.mistakeOf(nums(846, 3, { base: 16 }), 'dropped');
  assert.deepEqual([h.text, h.remainder], ['114', 2]);
  assert.deepEqual(h.first, { i: 1, rest: 1, end: 1, down: 14, right: 30, wrong: 14 }, '1 left of E is 1E = 30 in base 16');
  // the right quotient with a wrong remainder is still the mistake: 10010 : 111 = 10 r 100 in base 2 (18 : 7 = 2 r 4)
  const r = logic.mistakeOf(nums(18, 7, { base: 2 }), 'dropped');
  assert.deepEqual([r.text, r.rightText, r.remainder, plan(nums(18, 7, { base: 2 })).remainder, r.same], ['10', '10', 0, 4, false]);
});

test('mistake tie-break: a mistake that changes nothing here marks nothing (846 : 3 for zero; 369 : 3 for dropped)', () => {
  for (const [a, d, kind] of [[846, 3, 'zero'], [369, 3, 'dropped'], [605, 3, 'dropped'], [2, 3, 'zero'], [2, 3, 'dropped']]) {
    const m = logic.mistakeOf(nums(a, d), kind);
    assert.equal(m.same, true, `${a}:${d} ${kind}`);
    assert.equal(m.first, null);
    assert.ok(m.differs.every((x) => !x));
  }
  assert.equal(logic.mistakeOf(nums(605, 3), 'zero').same, false, '605 : 3 = 201: the 0 can be forgotten');
});

test('presets: the numbers and step counts of SPEC.md', () => {
  const want = { 'three-digit': ['282', 0, 8], 'first-two': ['248', 0, 8], zero: ['206', 0, 8], remainder: ['505', 3, 8],
    'two-digit': ['823', 0, 8], 'base-2': ['1001', 1, 11] };
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    assert.deepEqual([qtxt(plan(p).quot), plan(p).remainder, logic.steps(p)], want[pr.id], pr.id);
    assert.ok(logic.fitsIn(logic.numbersOf(p), p.base), pr.id);
  }
  assert.equal(logic.mistakeOf(P(logic.PRESETS[2].params), 'zero').text, '26');
});

test('every step writes what the plan says; the last state has the quotient and every row', () => {
  let seed = 3;
  const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  for (let t = 0; t < 150; t++) {
    const b = 2 + rnd(15);
    const p = nums(rnd(b ** 6), 1 + rnd(b ** 3 - 1), { base: b });
    const pl = plan(p);
    const s = last(p);
    assert.deepEqual(s.quot, pl.quot);
    assert.deepEqual(s.rows.map((r) => logic.valueOf(r.rest, b)), pl.steps.map((x) => x.rest));
    assert.deepEqual(s.rows.map((r) => r.down), pl.steps.map((x) => x.down));
    assert.equal(logic.steps(p), 3 * pl.Q - 1);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  const p = nums(2023, 4);
  for (let n = 0; n <= logic.steps(p); n++) {
    const s = at(p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = nums(46, 5, { base: 2 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  assert.deepEqual(logic.step(forward[forward.length - 1], logic.steps(p) + 1, p), forward[forward.length - 1], 'past the end: unchanged');
});

test('step does not mutate its input', () => {
  const p = nums(846, 3);
  const s0 = logic.initial(p);
  const copy0 = structuredClone(s0);
  const s1 = logic.step(s0, 1, p);
  assert.deepEqual(s0, copy0);
  const s2 = logic.step(s1, 2, p);
  const copy2 = structuredClone(s2);
  logic.step(s2, 3, p);
  assert.deepEqual(s2, copy2);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the model is valid; the page mounts the model presets and meta.steps matches', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
  assert.match(html, /L\.PRESETS\.map/);
});
