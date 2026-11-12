// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ari-column-addition's model (SPEC.md). Run: node --test sims/ari-column-addition/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const nums = (values, over) => P(Object.assign(logic.paramsFor(values), over));
const at = (p, n) => kit.stateAt(logic, p, n);
const last = (p) => at(p, logic.steps(p));
const resultText = (p) => {
  const s = last(p);
  return s.resultRow.slice().reverse().map((d) => logic.DIGITS[d]).join('');
};
const cols = (p) => logic.planOf(p).columns.map((c) => [c.sum, c.digit, c.carryOut]);

// ── tie-breaks first ──

test('tie-break: a column sum equal to the base writes 0 and carries 1', () => {
  const p = nums([645, 355]);
  assert.deepEqual(cols(p), [[10, 0, 1], [10, 0, 1], [10, 0, 1]]);
  assert.equal(resultText(p), '1000');
  // the same in base 2: 1 + 1 = 2 reaches the base
  assert.deepEqual(cols(nums([1, 1], { base: 2 })), [[2, 0, 1]]);
  assert.equal(resultText(nums([1, 1], { base: 2 })), '10');
});

test('tie-break: a column sum of base − 1 does not carry', () => {
  assert.deepEqual(cols(nums([45, 54])), [[9, 9, 0], [9, 9, 0]]);
  assert.equal(logic.steps(nums([45, 54])), 4, 'no final step without a final carry');
  assert.deepEqual(cols(nums([0xF, 0], { base: 16 })), [[15, 15, 0]]);
});

test('tie-break: leading zeros are dropped, 0 is one digit, a–f read as A–F', () => {
  assert.deepEqual(logic.parseList('0457 + 368', 10), { values: [457, 368] });
  assert.deepEqual(logic.parseList('0 + 0', 10), { values: [0, 0] });
  assert.deepEqual(logic.parseList('3a7+1F9', 16), { values: [935, 505] });
  assert.deepEqual(logic.digitsOf(0, 7), [0]);
});

// ── rules ──

test('rule 2 and 3: columns from the right, write what is left over, carry the quotient (457 + 368 = 825)', () => {
  const p = nums([457, 368]);
  assert.deepEqual(cols(p), [[15, 5, 1], [12, 2, 1], [8, 8, 0]]);
  assert.equal(logic.steps(p), 6);
  const s1 = at(p, 1);
  assert.equal(s1.phase, 'sum');
  assert.equal(s1.col, 0);
  assert.equal(s1.sum, 15);
  assert.deepEqual(s1.resultRow, [null, null, null], 'nothing written in the sum step');
  const s2 = at(p, 2);
  assert.equal(s2.phase, 'write');
  assert.deepEqual(s2.resultRow, [5, null, null]);
  assert.deepEqual(s2.carryRow, [null, 1, null], 'carry written above the next column');
  const s3 = at(p, 3);
  assert.equal(s3.col, 1);
  assert.equal(s3.sum, 12, 'the carry is part of the next sum');
  assert.equal(resultText(p), '825');
});

test('rule 4: the carry into a column is added like a digit', () => {
  const plan = logic.planOf(nums([457, 368]));
  assert.equal(plan.columns[1].digitSum, 11);
  assert.equal(plan.columns[1].carryIn, 1);
  assert.equal(plan.columns[1].sum, 12);
});

test('rule 5: four numbers carry up to 3 (2738 + 4596 + 1879 + 3967 = 13180)', () => {
  const p = nums([2738, 4596, 1879, 3967]);
  assert.deepEqual(cols(p), [[30, 0, 3], [28, 8, 2], [31, 1, 3], [13, 3, 1]]);
  assert.equal(resultText(p), '13180');
  assert.equal(logic.steps(p), 9);
  const s = last(p);
  assert.equal(s.phase, 'final');
  assert.deepEqual(s.carryRow, [null, 3, 2, 3, null]);
});

test('rule 5: with k numbers the carry never exceeds k − 1, in every base', () => {
  for (let b = 2; b <= 16; b++) {
    for (let k = 2; k <= 4; k++) {
      const big = Math.pow(b, 9) - 1;
      const plan = logic.planOf(nums(new Array(k).fill(big), { base: b }));
      for (const c of plan.columns) assert.ok(c.carryOut <= k - 1, `base ${b}, ${k} numbers`);
      assert.ok(plan.final <= k - 1);
    }
  }
});

test('rule 6: a carry that reaches the base is written with its own digits (4 × 111₂ = 11100₂)', () => {
  const p = nums([7, 7, 7, 7], { base: 2 });
  assert.deepEqual(cols(p), [[4, 0, 2], [6, 0, 3], [7, 1, 3]]);
  const plan = logic.planOf(p);
  assert.deepEqual(plan.finalDigits, [1, 1]);
  assert.equal(resultText(p), '11100');
  assert.equal(logic.steps(p), 7, 'one final step writes both digits');
  assert.equal(last(p).resultRow.length, 5);
});

test('rule 7: a shorter number adds only the digits it has (1205 + 87 = 1292)', () => {
  const p = nums([1205, 87]);
  const plan = logic.planOf(p);
  assert.deepEqual(plan.columns.map((c) => c.digitSum), [12, 8, 2, 1]);
  assert.equal(resultText(p), '1292');
  assert.equal(logic.steps(p), 8);
});

test('rule 8: any base, the same algorithm (3A7₁₆ + 1F9₁₆, 1011₂ + 111₂)', () => {
  const hex = nums([0x3A7, 0x1F9], { base: 16 });
  assert.deepEqual(cols(hex), [[16, 0, 1], [26, 10, 1], [5, 5, 0]]);
  assert.equal(resultText(hex), '5A0');
  const bin = nums([11, 7], { base: 2 });
  assert.deepEqual(cols(bin), [[2, 0, 1], [3, 1, 1], [2, 0, 1], [2, 0, 1]]);
  assert.equal(resultText(bin), '10010');
  assert.equal(logic.steps(bin), 9);
});

test('rule 9: the result is the sum of the quantities, in every base', () => {
  const r = kit.rng(7);
  for (let i = 0; i < 400; i++) {
    const b = 2 + r.int(15);
    const k = 2 + r.int(3);
    const values = Array.from({ length: k }, () => r.int(Math.min(Math.pow(b, 1 + r.int(9)), 1e9)));
    const p = nums(values, { base: b });
    assert.equal(resultText(p).replace(/^0+(?=.)/, ''), logic.textOf(values.reduce((a, v) => a + v, 0), b));
  }
});

test('a change of base keeps the quantities and rewrites the digits', () => {
  const p = nums([935, 505]);
  assert.equal(logic.textOf(935, 16), '3A7');
  assert.equal(logic.textOf(935, 10), '935');
  assert.equal(logic.textOf(935, 2), '1110100111');
  assert.equal(logic.fitsIn(logic.numbersOf(p), 2), false, '935 needs 10 binary digits');
  assert.equal(logic.minBase([935, 505]), 3);
  assert.equal(logic.minBase([457, 368]), 2);
  assert.equal(logic.minBase([logic.MAX_VALUE, 1]), 16);
});

test('typed input: refused with a reason, never half applied', () => {
  assert.deepEqual(logic.parseList('457 + 3a8', 10), { error: 'digit', at: 'a' });
  assert.deepEqual(logic.parseList('12 + 2', 2), { error: 'digit', at: '2' });
  assert.deepEqual(logic.parseList('1234567890 + 1', 10), { error: 'long', at: '1234567890' });
  assert.deepEqual(logic.parseList('000000000123 + 1', 10), { values: [123, 1] }, 'leading zeros do not count');
  assert.equal(logic.parseList('457', 10).error, 'count');
  assert.equal(logic.parseList('1+2+3+4+5', 10).error, 'count');
  assert.equal(logic.parseList('', 10).error, 'count');
  assert.equal(logic.parseList('4 + + 5', 10).error, 'empty');
  assert.deepEqual(logic.parseList('4 5 6', 10), { values: [4, 5, 6] }, 'spaces separate too');
  assert.deepEqual(logic.paramsFor([1, 2, 3]), { count: 3, a: 1, b: 2, c: 3, d: 0 });
});

// ── typical mistakes ──

test('tie-break: a mistake that happens to give the right numeral marks nothing wrong', () => {
  const whole = logic.mistakeOf(nums([5, 5]), 'whole');
  assert.equal(whole.text, '10');
  assert.equal(whole.same, true, 'only the last column reaches the base: writing it whole is right');
  assert.equal(whole.anyReach, true);
  assert.deepEqual(whole.differs, [false]);
  assert.equal(logic.mistakeOf(nums([600, 500]), 'whole').same, true);
  const left = logic.mistakeOf(nums([0, 10]), 'left');
  assert.equal(left.same, true, '0 reads as 0 wherever it is aligned');
  assert.equal(left.equalLengths, false);
  const none = logic.mistakeOf(nums([12, 34]), 'nocarry');
  assert.equal(none.same, true);
  assert.equal(none.anyReach, false);
  assert.equal(none.lost, 0);
});

test('mistake nocarry: 457 + 368 gives 715, short by the forgotten carries 10 + 100', () => {
  const m = logic.mistakeOf(nums([457, 368]), 'nocarry');
  assert.equal(m.text, '715');
  assert.equal(m.lost, 110);
  assert.deepEqual(m.differs, [false, true, true]);
  assert.equal(logic.mistakeOf(nums([645, 355]), 'nocarry').text, '990');
  const four = logic.mistakeOf(nums([2738, 4596, 1879, 3967]), 'nocarry');
  assert.equal(four.text, '0950');
  assert.equal(four.lost, 12230);
  const hex = logic.mistakeOf(nums([0x3A7, 0x1F9], { base: 16 }), 'nocarry');
  assert.equal(hex.text, '490');
  assert.equal(hex.lost, 272);
  assert.equal(logic.mistakeOf(nums([11, 7], { base: 2 }), 'nocarry').lost, 6);
});

test('mistake whole: the whole column sum written in each column (71115)', () => {
  assert.equal(logic.mistakeOf(nums([457, 368]), 'whole').text, '71115');
  assert.equal(logic.mistakeOf(nums([645, 355]), 'whole').text, '9910');
  assert.equal(logic.mistakeOf(nums([2738, 4596, 1879, 3967]), 'whole').text, '10292530');
  assert.equal(logic.mistakeOf(nums([0x3A7, 0x1F9], { base: 16 }), 'whole').text, '41910');
  assert.equal(logic.mistakeOf(nums([11, 7], { base: 2 }), 'whole').text, '111010');
});

test('mistake left: numbers aligned on the left (1205 + 87 → 9905, 87 read as 8700)', () => {
  const m = logic.mistakeOf(nums([1205, 87]), 'left');
  assert.equal(m.text, '9905');
  assert.deepEqual(m.misread, ['1205', '8700']);
  assert.equal(m.same, false);
  const bin = logic.mistakeOf(nums([11, 7], { base: 2 }), 'left');
  assert.equal(bin.text, '11001');
  assert.deepEqual(bin.misread, ['1011', '1110']);
  assert.equal(logic.mistakeOf(nums([457, 368]), 'left').same, true, 'same lengths: the mistake changes nothing');
});

test('every preset gives the expected result and step count (SPEC.md, Presets)', () => {
  const want = {
    'two-numbers': ['825', 6], 'reaches-base': ['1000', 7], 'four-numbers': ['13180', 9],
    'left-aligned': ['1292', 8], 'base-2': ['10010', 9], 'base-16': ['5A0', 6]
  };
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    assert.deepEqual([resultText(p), logic.steps(p)], want[pr.id], pr.id);
    assert.ok(logic.steps(p) <= 20);
  }
  assert.equal(logic.steps(logic.defaults), 6, 'sim.json steps');
});

test('at most 19 steps for any allowed input (9 digits, 4 numbers, any base)', () => {
  for (let b = 2; b <= 16; b++) {
    const big = Math.pow(b, 9) - 1;
    assert.ok(logic.steps(nums([big, big, big, big], { base: b })) <= 19, `base ${b}`);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  const p = nums([2738, 4596, 1879, 3967]);
  for (let n = 0; n <= logic.steps(p); n++) {
    const s = at(p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = nums([7, 7, 7, 7], { base: 2 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = nums([457, 368]);
  const s0 = logic.initial(p);
  const s1 = logic.step(s0, 1, p);
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
