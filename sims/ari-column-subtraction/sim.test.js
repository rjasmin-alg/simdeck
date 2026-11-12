// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ari-column-subtraction's model (SPEC.md). Run: node --test sims/ari-column-subtraction/
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
/** The result as written (leading zeros left empty). */
const resultText = (p) => {
  const plan = logic.planOf(p);
  return last(p).res.map((d, k) => (plan.columns[k].lead ? '' : logic.DIGITS[d])).reverse().join('');
};
const hist = (p) => logic.planOf(p).hist;
const needs = (p) => logic.planOf(p).columns.map((c) => [c.borrow.need, c.equal.need]);

// ── tie-breaks first ──

test('tie-break 1: equal digits do not borrow', () => {
  const p = nums(77, 77);
  assert.deepEqual(needs(p), [[false, false], [false, false]]);
  assert.deepEqual(hist(p), [[7], [7]], 'nothing rewritten');
  const s = last(p);
  assert.deepEqual(s.eTop, [false, false]);
  assert.deepEqual(s.eBot, [false, false]);
  assert.equal(resultText(p), '0');
  // one column equal, one smaller: only the smaller borrows
  assert.deepEqual(needs(nums(52, 28)), [[true, true], [false, false]]);
  assert.deepEqual(needs(nums(55, 25)), [[false, false], [false, false]]);
});

test('tie-break 2: equal additions add the carried 1 before comparing (9 + 1 reaches the base)', () => {
  const c = logic.planOf(nums(1000, 999)).columns;
  assert.deepEqual(c.map((x) => [x.equal.d, x.equal.need, x.equal.diff]), [[9, true, 1], [10, true, 0], [10, true, 0], [1, false, 0]]);
  assert.equal(resultText(nums(1000, 999)), '1');
  // nothing taken away in the hundreds: the carried 1 alone
  const h = logic.planOf(nums(503, 78)).columns[2].equal;
  assert.deepEqual([h.d0, h.plus, h.d, h.need, h.diff], [0, 1, 1, false, 4]);
  // without the carry the comparison would be 0 < 9 only; with it the column is 10 − 10 = 0
});

test('tie-break 3: leading zeros of the result are not written, the ones always are', () => {
  assert.equal(resultText(nums(103, 98)), '5');
  assert.deepEqual(logic.planOf(nums(103, 98)).columns.map((c) => c.lead), [false, true, true]);
  assert.equal(resultText(nums(1000, 1)), '999');
  assert.equal(resultText(nums(77, 77)), '0');
  assert.equal(resultText(nums(0, 0)), '0');
  assert.equal(resultText(nums(705, 700)), '5', 'a zero inside a leading run is not written');
  assert.deepEqual(logic.shownDigits([5, 0, 3, 0]), [5, 0, 3, null], 'a zero between digits is written');
});

test('tie-break: leading zeros dropped in input, a–f read as A–F, separators -, −, – and spaces', () => {
  assert.deepEqual(logic.parseList('0503 − 178', 10), { values: [503, 178] });
  assert.deepEqual(logic.parseList('503-178', 10), { values: [503, 178] });
  assert.deepEqual(logic.parseList('503 – 178', 10), { values: [503, 178] });
  assert.deepEqual(logic.parseList('503 178', 10), { values: [503, 178] });
  assert.deepEqual(logic.parseList('5a0 − 1F9', 16), { values: [1440, 505] });
  assert.deepEqual(logic.parseList('7 - 7', 10), { values: [7, 7] }, 'equal numbers are allowed');
});

// ── rules ──

test('rule 4 and 5: columns from the right, look then write; borrowing across a 0 (503 − 178 = 325)', () => {
  const p = nums(503, 178);
  assert.equal(logic.steps(p), 6);
  const s0 = at(p, 0);
  assert.equal(s0.phase, 'start');
  assert.deepEqual(s0.hist, [[3], [0], [5]]);
  const s1 = at(p, 1);
  assert.deepEqual([s1.phase, s1.col], ['look', 0]);
  assert.deepEqual(s1.hist, [[3, 13], [0, 10, 9], [5, 4]], 'the hundreds lend, the 0 becomes 10 then 9, the ones 13');
  assert.deepEqual(s1.res, [null, null, null], 'nothing written in the look step');
  const s2 = at(p, 2);
  assert.deepEqual([s2.phase, s2.col], ['write', 0]);
  assert.deepEqual(s2.res, [5, null, null]);
  const c = logic.planOf(p).columns;
  assert.deepEqual(c.map((x) => [x.borrow.t, x.borrow.d, x.borrow.nt, x.borrow.diff]), [[3, 8, 13, 5], [9, 7, 9, 2], [4, 1, 4, 3]]);
  assert.deepEqual([c[0].borrow.lender, c[0].borrow.zeros], [2, [1]]);
  assert.equal(resultText(p), '325');
});

test('rule 5: the top number keeps its value at every step of borrowing', () => {
  for (const [a, b, base] of [[503, 178, 10], [742, 347, 10], [1000, 1, 10], [1440, 505, 16], [18, 7, 2]]) {
    const p = nums(a, b, { base });
    for (let n = 0; n <= logic.steps(p); n++) {
      const tops = at(p, n).hist.map((h) => h[h.length - 1]);
      assert.equal(tops.reduce((s, d, k) => s + d * Math.pow(base, k), 0), a, `${a} − ${b} step ${n}`);
    }
  }
});

test('rule 6: a column can lend, then borrow (742 − 347 = 395); at most two rewrites', () => {
  const p = nums(742, 347);
  assert.deepEqual(hist(p), [[2, 12], [4, 3, 13], [7, 6]]);
  assert.deepEqual(at(p, 1).hist, [[2, 12], [4, 3], [7]], 'after the ones: the tens lent');
  assert.deepEqual(at(p, 3).hist, [[2, 12], [4, 3, 13], [7, 6]], 'after the tens look: they borrowed');
  assert.equal(resultText(p), '395');
  for (let base = 2; base <= 16; base++) {
    const top = Math.pow(base, 6);
    for (const b of [1, base + 1, top - 1, Math.floor(top / 3)]) {
      assert.ok(hist(nums(top, b, { base })).every((h) => h.length <= 3), `base ${base}, ${b}`);
    }
  }
});

test('rule 7: equal additions, the base on top and one below; both numbers grow by the same', () => {
  const p = nums(503, 178);
  const c = logic.planOf(p).columns;
  assert.deepEqual(c.map((x) => [x.equal.t, x.equal.d, x.equal.need, x.equal.diff]), [[3, 8, true, 5], [0, 8, true, 2], [5, 2, false, 3]]);
  const s1 = at(p, 1);
  assert.deepEqual([s1.eTop, s1.eBot], [[true, false, false], [false, true, false]], 'tags made in the ones look step');
  const s3 = at(p, 3);
  assert.deepEqual([s3.eTop, s3.eBot], [[true, true, false], [false, true, true]]);
  assert.equal(logic.planOf(p).added, 110);
  assert.deepEqual(logic.planOf(nums(1440, 505, { base: 16 })).added, 272);
});

test('rule 8: both methods write the same digit in every column, and the result is a − b (any base)', () => {
  let seed = 7;
  const rnd = (m) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % m; };
  for (let base = 2; base <= 16; base++) {
    for (let i = 0; i < 300; i++) {
      const a = rnd(Math.pow(base, 1 + rnd(9)));
      const b = rnd(a + 1);
      const plan = logic.planOf(nums(a, b, { base }));
      for (const c of plan.columns) {
        assert.equal(c.borrow.diff, c.equal.diff, `${a} − ${b} base ${base} col ${c.k}`);
        assert.ok(c.digit >= 0 && c.digit < base);
      }
      assert.equal(logic.valueOf(plan.columns.map((c) => c.digit), base), a - b);
      assert.equal(logic.valueOf(last(nums(a, b, { base })).res, base), a - b);
    }
  }
});

test('rule 9: any base, the same algorithm (5A0₁₆ − 1F9₁₆, 10010₂ − 111₂)', () => {
  const hex = nums(1440, 505, { base: 16 });
  assert.deepEqual(hist(hex), [[0, 16], [10, 9, 25], [5, 4]]);
  assert.deepEqual(logic.planOf(hex).columns.map((c) => c.equal.d), [9, 16, 2]);
  assert.equal(resultText(hex), '3A7');
  const bin = nums(18, 7, { base: 2 });
  assert.deepEqual(hist(bin), [[0, 2], [1, 0, 2], [0, 2, 1], [0, 2, 1], [1, 0]]);
  assert.equal(resultText(bin), '1011');
  assert.equal(logic.steps(bin), 10);
});

test('the number taken away is never larger: refused when typed, clamped from a URL', () => {
  assert.deepEqual(logic.parseList('178 − 503', 10), { error: 'order', at: '503' });
  assert.deepEqual(logic.numbersOf({ a: 5, b: 9 }), [5, 5]);
  assert.deepEqual(logic.numbersOf({ a: 'x', b: -3 }), [0, 0]);
  assert.throws(() => logic.subtractColumns(5, 9, 10));
});

test('typed input is refused with a reason', () => {
  assert.deepEqual(logic.parseList('5A0 − 1', 10), { error: 'digit', at: 'A' });
  assert.deepEqual(logic.parseList('12 − 2', 2), { error: 'digit', at: '2' });
  assert.deepEqual(logic.parseList('1234567890 − 1', 10), { error: 'long', at: '1234567890' });
  assert.equal(logic.parseList('000000000123 − 1', 10).values[0], 123, 'leading zeros do not count');
  assert.deepEqual(logic.parseList('503', 10), { error: 'count', at: '1' });
  assert.deepEqual(logic.parseList('9 − 5 − 1', 10), { error: 'count', at: '3' });
  assert.deepEqual(logic.parseList('', 10), { error: 'count', at: '' });
  assert.deepEqual(logic.parseList('503 − − 1', 10), { error: 'empty', at: '−' });
});

test('minBase: the smallest base in which the top number fits in 9 digits', () => {
  assert.equal(logic.minBase([503, 178]), 2, '503 is 111110111 in base 2: 9 digits');
  assert.equal(logic.minBase([511, 0]), 2);
  assert.equal(logic.minBase([512, 0]), 3);
  assert.equal(logic.minBase([logic.MAX_VALUE, 0]), 16);
});

// ── typical mistakes ──

test('mistake smaller: the smaller digit from the larger (503 − 178 → 475)', () => {
  const m = logic.mistakeOf(nums(503, 178), 'smaller');
  assert.equal(m.text, '475');
  assert.deepEqual(m.differs, [false, true, true], '8 − 3 = 5 happens to be 13 − 8');
  assert.equal(logic.mistakeOf(nums(624, 358), 'smaller').text, '334');
  assert.equal(logic.mistakeOf(nums(1000, 1), 'smaller').text, '1001');
  assert.equal(logic.mistakeOf(nums(18, 7, { base: 2 }), 'smaller').text, '10101');
  assert.equal(logic.mistakeOf(nums(1440, 505, { base: 16 }), 'smaller').text, '459');
});

test('mistake forget: the base added, nothing taken from the left (too big by what was added)', () => {
  const m = logic.mistakeOf(nums(503, 178), 'forget');
  assert.equal(m.text, '435');
  assert.equal(m.over, 110);
  assert.deepEqual(m.differs, [false, true, true]);
  assert.equal(logic.mistakeOf(nums(624, 358), 'forget').text, '376');
  assert.equal(logic.mistakeOf(nums(742, 347), 'forget').text, '405');
  assert.equal(logic.mistakeOf(nums(1000, 1), 'forget').text, '1009');
  assert.equal(logic.mistakeOf(nums(1440, 505, { base: 16 }), 'forget').text, '4B7');
  // too big by base^(k+1) for every column whose top digit is smaller than the digit below it
  for (const [a, b, base] of [[503, 178, 10], [1000, 1, 10], [1440, 505, 16], [18, 7, 2]]) {
    const plan = logic.planOf(nums(a, b, { base }));
    const want = plan.columns.reduce((s, c) => s + (c.top < (c.bottom == null ? 0 : c.bottom) ? Math.pow(base, c.k + 1) : 0), 0);
    assert.equal(logic.mistakeOf(nums(a, b, { base }), 'forget').over, want, `${a} − ${b}`);
  }
  assert.equal(logic.mistakeOf(nums(1000, 1), 'forget').over, 10);
});

test('mistake zero: across a 0 the zeros become 9 but the lender is not lowered', () => {
  const m = logic.mistakeOf(nums(503, 178), 'zero');
  assert.equal(m.text, '425');
  assert.equal(m.over, 100);
  assert.deepEqual([m.firstZero, m.lender, m.zeros], [1, 2, 1]);
  assert.deepEqual([logic.mistakeOf(nums(1000, 1), 'zero').zeros, logic.mistakeOf(nums(1000, 1), 'zero').lender], [2, 3]);
  assert.deepEqual(m.differs, [false, false, true]);
  assert.equal(logic.mistakeOf(nums(1000, 1), 'zero').text, '1999');
  assert.equal(logic.mistakeOf(nums(500, 1), 'zero').text, '599');
  assert.equal(logic.mistakeOf(nums(18, 7, { base: 2 }), 'zero').text, '11011');
});

test('tie-break: a mistake that gives the right result here marks nothing wrong', () => {
  for (const [a, b, kind] of [[742, 347, 'zero'], [624, 358, 'zero'], [768, 345, 'smaller'], [768, 345, 'forget'], [77, 77, 'smaller']]) {
    const m = logic.mistakeOf(nums(a, b), kind);
    assert.equal(m.same, true, `${a} − ${b} ${kind}`);
    assert.ok(m.differs.every((x) => !x));
    assert.equal(m.firstZero, null);
  }
  const lead = logic.mistakeOf(nums(103, 98), 'forget');
  assert.equal(lead.text, '115');
  assert.deepEqual(lead.cells, [5, 1, 1]);
  assert.deepEqual(logic.mistakeOf(nums(100, 1), 'zero').cells, [9, 9, 1], 'zero mistake: 100 − 1 → 199');
});

test('every preset gives the expected result and step count (SPEC.md, Presets)', () => {
  const want = {
    'zero-top': ['325', 6], 'lend-borrow': ['395', 6], 'many-zeros': ['999', 8],
    'smaller-mistake': ['266', 6], 'base-2': ['1011', 10], 'base-16': ['3A7', 6]
  };
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    assert.deepEqual([resultText(p), logic.steps(p)], want[pr.id], pr.id);
  }
  assert.equal(logic.mistakeOf(P(logic.PRESETS[3].params), 'smaller').text, '334');
  assert.equal(logic.steps(logic.defaults), 6, 'sim.json steps');
});

test('at most 18 steps for any allowed input (9 digits, any base)', () => {
  for (let b = 2; b <= 16; b++) {
    const big = Math.pow(b, 9) - 1;
    assert.equal(logic.steps(nums(big, 1, { base: b })), 18, `base ${b}`);
  }
});

test('the last state holds every rewrite and tag of the plan', () => {
  for (const [a, b, base] of [[503, 178, 10], [1000, 1, 10], [18, 7, 2], [1440, 505, 16]]) {
    const p = nums(a, b, { base });
    const plan = logic.planOf(p);
    const s = last(p);
    assert.deepEqual(s.hist, plan.hist);
    assert.deepEqual(s.eTop, plan.columns.map((c) => c.equal.need));
    assert.deepEqual(s.eBot, plan.columns.map((c) => c.equal.plus === 1));
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  const p = nums(1000, 1);
  for (let n = 0; n <= logic.steps(p); n++) {
    const s = at(p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = nums(18, 7, { base: 2 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  assert.deepEqual(logic.step(forward[forward.length - 1], logic.steps(p) + 1, p), forward[forward.length - 1], 'past the end: unchanged');
});

test('step does not mutate its input', () => {
  const p = nums(503, 178);
  const s0 = logic.initial(p);
  const copy0 = structuredClone(s0);
  const s1 = logic.step(s0, 1, p);
  assert.deepEqual(s0, copy0);
  const copy = structuredClone(s1);
  logic.step(s1, 2, p);
  assert.deepEqual(s1, copy);
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
