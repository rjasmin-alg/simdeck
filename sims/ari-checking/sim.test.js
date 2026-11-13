// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ari-checking's model (SPEC.md). Run: node --test sims/ari-checking/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const task = (op, a, b, g, r, over) => P(Object.assign({ op: op, a: a, b: b, g: g, r: r || 0 }, over));
const S = (p) => logic.initial(p);
const T = (v, b) => logic.textOf(v, b || 10);
/** The estimate as "ra op rb = e", numerals in the base. */
const est = (op, a, b, base) => {
  const e = logic.estimateOf(op, a, b, base || 10);
  return `${T(e.ra, base)} ${logic.SIGN[op]} ${T(e.rb, base)} = ${T(e.value, base)}`;
};
const wrong = (op, a, b, kind, base) => {
  const w = logic.wrongOf(op, a, b, base || 10, kind);
  return w && (op === 'div' ? [w.g, w.r] : w.g);
};
/** A deterministic random sequence (tests only). */
function rng(seed) {
  let s = seed >>> 0;
  return (n) => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s % n; };
}

// ── tie-breaks first ──

test('tie-break 1: rounding is half up (2 · rest ≥ the place value), in any base; rounding may add a place', () => {
  assert.equal(logic.roundLead(850, 10), 900);
  assert.equal(logic.roundLead(849, 10), 800);
  assert.equal(logic.roundLead(0x380, 16), 0x400, '8 is half of 16: up');
  assert.equal(logic.roundLead(0x37f, 16), 0x300);
  assert.equal(T(logic.roundLead(5, 3), 3), '20', 'base 3: 12 → 20 (2 · 2 ≥ 3)');
  assert.equal(T(logic.roundLead(4, 3), 3), '10', 'base 3: 11 → 10 (2 · 1 < 3)');
  assert.equal(logic.roundLead(96, 10), 100);
  assert.equal(logic.roundLead(7, 10), 7, 'a one-digit number stays');
  assert.equal(logic.roundTo(846, 1, 10), 850);
  assert.equal(logic.roundTo(845, 1, 10), 850);
  assert.equal(logic.roundTo(844, 1, 10), 840);
});

test('tie-break 2: exactly √b times the estimate is far; a 0 is near only a 0', () => {
  assert.deepEqual(logic.farOf(16, 4, 16), { far: true, off: 1, zero: false });
  assert.equal(logic.farOf(15, 4, 16).far, false);
  assert.equal(logic.farOf(1, 4, 16).far, true, '1/4 = 1/√16: far');
  assert.equal(logic.farOf(2, 4, 16).far, false);
  assert.equal(logic.farOf(4, 2, 4).far, true, 'base 4: ratio 2 = √4');
  assert.equal(logic.farOf(3, 2, 4).far, false);
  assert.equal(logic.farOf(8, 1, 4).off, 2, 'exactly b^(n + 1/2) counts as n + 1 places: 8 = 4^1.5');
  assert.equal(logic.farOf(7, 1, 4).off, 1);
  assert.equal(logic.farOf(0, 0, 10).far, false);
  assert.equal(logic.farOf(0, 300, 10).far, true);
  assert.equal(logic.farOf(5, 0, 10).far, true);
});

test('tie-break 3: a subtraction whose rounded numbers leave 0 or less is rounded again, lower, until positive', () => {
  assert.equal(est('sub', 846, 778), '850 − 780 = 70');
  assert.equal(logic.estimateOf('sub', 846, 778, 10).place, 1);
  assert.equal(est('sub', 100, 96), '100 − 96 = 4', 'tens still give 0: ones');
  assert.equal(logic.estimateOf('sub', 100, 96, 10).place, 0);
  assert.equal(est('sub', 846, 378), '800 − 400 = 400', 'positive at once: own places, no second rounding');
  assert.equal(logic.estimateOf('sub', 846, 378, 10).place, null);
  assert.equal(est('sub', 500, 500), '500 − 500 = 0', 'equal numbers: 0');
  assert.equal(logic.estimateOf('sub', 500, 500, 10).place, null, 'equal numbers are not rounded again');
  assert.equal(est('sub', 1200, 960), '1200 − 1000 = 200', 'one place below the larger leading place, not the smaller');
});

test('tie-break 4: a division estimate uses a nearby dividend the rounded divisor divides', () => {
  assert.equal(est('div', 846, 3), '900 : 3 = 300');
  assert.equal(est('div', 618, 3), '600 : 3 = 200');
  assert.equal(est('div', 1736, 7), '1400 : 7 = 200');
  assert.equal(est('div', 9876, 12), '10000 : 10 = 1000');
  assert.equal(est('div', 2023, 4), '2000 : 4 = 500');
  assert.equal(logic.roundQuot(2, 3, 10), 1, 'a quotient below 1: to 1 when at least a half');
  assert.equal(logic.roundQuot(1, 3, 10), 0);
  assert.equal(logic.roundQuot(1, 2, 10), 1, 'exactly a half: up');
  assert.equal(logic.roundQuot(150, 1, 10), 200, 'half up');
  assert.equal(logic.roundQuot(149, 1, 10), 100);
});

// ── rules ──

test('rule 5–6: each number to its own leading place, then the operation', () => {
  assert.equal(est('add', 457, 368), '500 + 400 = 900');
  assert.equal(est('mul', 457, 36), '500 · 40 = 20000');
  assert.equal(est('mul', 248, 7), '200 · 7 = 1400');
  assert.equal(est('sub', 846, 78), '800 − 80 = 720');
  assert.equal(est('add', 846, 378), '800 + 400 = 1200');
  assert.equal(est('mul', 0x1c9, 0x24, 16), '200 · 20 = 4000', 'base 16: the same rule, other digits');
});

test('rule 7: far from the estimate when about half a place away; n places off', () => {
  assert.deepEqual(logic.farOf(4113, 20000, 10), { far: true, off: -1, zero: false });
  assert.deepEqual(logic.farOf(26, 200, 10), { far: true, off: -1, zero: false });
  assert.deepEqual(logic.farOf(0, 300, 10), { far: true, off: -1, zero: true }, 'a 0 says nothing about places');
  assert.deepEqual(logic.farOf(478, 400, 10), { far: false, off: 0, zero: false });
  assert.equal(logic.farOf(4680, 400, 10).off, 1);
  assert.equal(logic.farOf(46800, 400, 10).off, 2);
  assert.equal(logic.farOf(126, 400, 10).far, true, '400/126 = 3.17 > √10');
  assert.equal(logic.farOf(127, 400, 10).far, false, '400/127 = 3.15 < √10');
  // n + 1 from b^(n + 1/2): 400 · 10^1.5 = 12649.1
  assert.equal(logic.farOf(12649, 400, 10).off, 1);
  assert.equal(logic.farOf(12650, 400, 10).off, 2);
});

test('rule 8: rough when even the right result is far from the estimate', () => {
  const s = S(task('div', 14, 15, 0, 14));
  assert.equal(s.right, 0);
  assert.equal(s.est.value, 1, '14 : 20 → 0.7 → 1');
  assert.equal(s.rough, true);
  assert.equal(s.verdict, 'rough');
  const s2 = S(task('sub', 46, 11, 35, 0, { base: 2 }));
  assert.equal(est('sub', 46, 11, 2), '100000 − 1000 = 11000');
  assert.equal(s2.verdict, 'rough', 'base 2: 35 against 24 is more than √2');
  assert.equal(S(P()).rough, false);
});

test('rule 9: the check is the inverse operation', () => {
  assert.deepEqual(pick(logic.checkOf('sub', 846, 378, 478, 0)), { value: 856, eq: false, ok: false });
  assert.deepEqual(pick(logic.checkOf('sub', 846, 378, 468, 0)), { value: 846, eq: true, ok: true });
  assert.deepEqual(pick(logic.checkOf('add', 457, 368, 825, 0)), { value: 457, eq: true, ok: true });
  assert.deepEqual(pick(logic.checkOf('add', 457, 368, 815, 0)), { value: 447, eq: false, ok: false });
  const less = logic.checkOf('add', 846, 378, 224, 0);
  assert.deepEqual([less.less, less.value, less.ok], [true, null, false], 'a sum smaller than an addend');
  const m = logic.checkOf('mul', 457, 36, 4113, 0);
  assert.deepEqual([m.value, m.rem, m.ok], [114, 9, false]);
  const m2 = logic.checkOf('mul', 457, 36, 16452, 0);
  assert.deepEqual([m2.value, m2.rem, m2.ok], [457, 0, true]);
  const m3 = logic.checkOf('mul', 457, 36, 16453, 0);
  assert.deepEqual([m3.value, m3.eq, m3.remOk, m3.ok], [457, true, false, false], 'the quotient right, a remainder left: wrong');
  const d = logic.checkOf('div', 846, 3, 281, 3);
  assert.deepEqual([d.prod, d.value, d.eq, d.remOk, d.ok], [843, 846, true, false, false], 'the remainder must be less than the divisor');
  const d2 = logic.checkOf('div', 2023, 4, 505, 3);
  assert.deepEqual([d2.prod, d2.value, d2.ok], [2020, 2023, true]);
  const d3 = logic.checkOf('div', 618, 3, 26, 0);
  assert.deepEqual([d3.value, d3.ok], [78, false]);
});
function pick(c) { return { value: c.value, eq: c.eq, ok: c.ok }; }

test('rule 9: the check says right exactly when the result is right (random tasks, every base)', () => {
  const R = rng(11);
  for (let b = 2; b <= 16; b++) {
    for (const op of logic.OPS) {
      const lim = logic.LIMITS[op];
      for (let n = 0; n < 60; n++) {
        let a = R(Math.pow(b, 1 + R(lim[0])));
        let c = R(Math.pow(b, 1 + R(lim[1])));
        if (op === 'mul' || op === 'div') c = Math.max(1, c);
        if (op === 'sub' && c > a) [a, c] = [c, a];
        const right = logic.rightOf(op, a, c);
        assert.ok(logic.checkOf(op, a, c, right.value, right.rem || 0).ok, `${op} ${a} ${c} base ${b}`);
        for (const dg of [1, -1, b]) {
          const g = right.value + dg;
          if (g < 0) continue;
          assert.equal(logic.checkOf(op, a, c, g, right.rem || 0).ok, false, `${op} ${a} ${c} given ${g}`);
        }
        if (op === 'div') assert.equal(logic.checkOf(op, a, c, right.value, right.rem + 1).ok, false);
        for (const k of logic.WRONGS[op]) {
          const w = logic.wrongOf(op, a, c, b, k);
          if (w) assert.equal(logic.checkOf(op, a, c, w.g, w.r || 0).ok, false, `${op} ${k} ${a} ${c} base ${b}`);
        }
      }
    }
  }
});

test('rule 10: the places that differ, on the task line and on the check', () => {
  const s = S(P());
  assert.deepEqual(s.wrongDigits, [1], '478 against 468: the tens');
  assert.deepEqual(s.checkDigits, [1], '856 against 846: the tens');
  assert.deepEqual(S(task('div', 618, 3, 26)).wrongDigits, [1, 2], '26 against 206, by place: the 6 is the same');
  assert.deepEqual(logic.differs(4113, 16452, 10), [0, 1, 2, 3, 4]);
  assert.deepEqual(S(task('sub', 846, 378, 468)).wrongDigits, []);
  assert.deepEqual(S(P()).at, { k: 0 }, 'analyse names where a typical wrong result goes wrong');
  assert.equal(S(task('sub', 846, 378, 468)).at, null);
  assert.equal(S(task('sub', 846, 378, 470)).at, null, 'a typed wrong result: no cause');
  assert.equal(S(task('mul', 457, 36, 4113)).places, -1, '4 digits against the estimate\'s 5');
  assert.equal(S(task('sub', 846, 378, 126)).places, 0, 'far but the same number of digits: no place missed');
  assert.equal(S(task('sub', 846, 378, 126)).verdict, 'far');
  assert.equal(S(P(logic.PRESETS[5].params)).places, -2, 'base 2: 11010 against 1000000, the two places banded');
  assert.equal(S(task('div', 846, 3, 282, 3)).correct, false, 'the right quotient with a wrong remainder is wrong');
  assert.equal(S(task('div', 2023, 4, 505, 3)).correct, true);
  assert.deepEqual(S(task('add', 846, 378, 224)).checkDigits, [], 'no check value: nothing to compare');
});

// ── wrong results ──

test('wrong results: add (a carry not added; the last carry not written)', () => {
  assert.equal(wrong('add', 457, 368, 'carry'), 815);
  assert.equal(wrong('add', 846, 378, 'carry'), 1214);
  assert.equal(wrong('add', 846, 378, 'lastCarry'), 224);
  assert.equal(wrong('add', 123, 456, 'carry'), null, 'no carry');
  assert.equal(wrong('add', 457, 368, 'lastCarry'), null, 'no carry out of the top column');
  assert.equal(wrong('add', 5, 7, 'carry'), null, 'a carry out of the top column is written anyway');
  assert.equal(wrong('add', 5, 97, 'carry'), 92, 'the column exists in the longer number');
  assert.deepEqual(logic.wrongOf('add', 457, 368, 10, 'carry').at, { k: 0, sum: 15 });
  assert.deepEqual(logic.wrongOf('add', 846, 378, 10, 'lastCarry').at, { k: 3 });
});

test('wrong results: sub (a borrow not paid back; the columns not lined up)', () => {
  assert.equal(wrong('sub', 846, 378, 'borrow'), 478);
  assert.equal(wrong('sub', 503, 178, 'borrow'), 335);
  assert.equal(wrong('sub', 846, 78, 'align'), 66);
  assert.equal(wrong('sub', 846, 123, 'borrow'), null, 'no borrow');
  assert.equal(wrong('sub', 846, 378, 'align'), null, 'same length');
  assert.equal(wrong('sub', 300, 78, 'align'), null, '780 is more than 300');
  assert.equal(wrong('sub', 846, 0, 'align'), null, 'moving 0 changes nothing');
  assert.equal(wrong('sub', 780, 78, 'align'), 0, '780 − 780: exactly the top number is allowed');
  assert.deepEqual(logic.wrongOf('sub', 846, 378, 10, 'borrow').at, { k: 0 });
  assert.deepEqual(logic.wrongOf('sub', 846, 78, 10, 'align').at, { shift: 1, moved: 780 });
});

test('wrong results: mul (a carry forgotten; the rows not shifted)', () => {
  assert.equal(wrong('mul', 457, 36, 'carry'), 16252, 'the 3-row first (Croatian order): 7 · 3 = 21, the 2 not added to 5 · 3');
  assert.deepEqual(logic.wrongOf('mul', 457, 36, 10, 'carry').at, { i: 0, j: 1, carry: 2, prod: 21 });
  assert.equal(wrong('mul', 457, 30, 'carry'), 13710 - 200, '457 · 30: the 3-row, 7 · 3 = 21, the 2 is worth 200');
  assert.equal(wrong('mul', 34, 21, 'carry'), null, 'no carry in the 2-row (8, 6) nor in the 1-row');
  assert.equal(wrong('mul', 248, 7, 'carry'), 1686);
  assert.equal(wrong('mul', 25, 41, 'carry'), 825, 'no carry in the ones row; 5 · 4 = 20 in the tens row: 2 forgotten, worth 200');
  assert.deepEqual(logic.wrongOf('mul', 25, 41, 10, 'carry').at, { i: 0, j: 1, carry: 2, prod: 20 });
  assert.equal(wrong('mul', 457, 36, 'shift'), 4113);
  assert.equal(wrong('mul', 13, 5, 'shift', 2), 26, 'base 2: 1101 + 0 + 1101');
  assert.equal(wrong('mul', 13, 5, 'carry', 2), null, 'base 2 digit products never carry');
  assert.equal(wrong('mul', 248, 7, 'shift'), null, 'one row');
  assert.equal(wrong('mul', 21, 13, 'carry'), null, 'no carry');
  assert.equal(wrong('mul', 9, 9, 'carry'), null, 'the carry of the last digit is written');
  assert.equal(wrong('mul', 12, 30, 'carry'), null, 'a 0 digit row and 1 · 3, 2 · 3: no carry');
});

test('wrong results: div (the last "how many times" one too small; a 0 left out)', () => {
  assert.deepEqual(wrong('div', 846, 3, 'rest'), [281, 3]);
  assert.deepEqual(wrong('div', 2023, 4, 'rest'), [504, 7]);
  assert.deepEqual(wrong('div', 618, 3, 'zero'), [26, 0]);
  assert.deepEqual(wrong('div', 2023, 4, 'zero'), [55, 3]);
  assert.deepEqual(wrong('div', 630, 3, 'zero'), [21, 0], 'a trailing 0 too');
  assert.equal(wrong('div', 630, 3, 'rest'), null, 'the last quotient digit is 0');
  assert.deepEqual(logic.wrongOf('div', 846, 3, 10, 'rest').at, { q: 2 });
  assert.equal(wrong('div', 846, 3, 'zero'), null, 'no 0 in the quotient');
  assert.deepEqual(wrong('div', 46, 5, 'zero', 2), [3, 1], '101110 : 101 = 1001 → 11');
});

test('kindOf names the given result; the first kind that gives it wins', () => {
  assert.equal(logic.kindOf('sub', 846, 378, 478, 0, 10), 'borrow');
  assert.equal(logic.kindOf('sub', 846, 378, 468, 0, 10), 'right');
  assert.equal(logic.kindOf('sub', 846, 378, 470, 0, 10), 'other');
  assert.equal(logic.kindOf('div', 846, 3, 281, 3, 10), 'rest');
  assert.equal(logic.kindOf('div', 846, 3, 281, 0, 10), 'other', 'the remainder belongs to the result');
  assert.equal(logic.kindOf('div', 2023, 4, 505, 3, 10), 'right');
  assert.equal(logic.kindOf('div', 2023, 4, 505, 0, 10), 'other');
  // 10 + 90 in base 10: the carry out of the tens is the top column, so `carry` does not apply; `lastCarry` gives 0
  assert.equal(logic.kindOf('add', 10, 90, 0, 0, 10), 'lastCarry');
});

test('the two wrong results of a pair never coincide, so kindOf has one answer (search, every base)', () => {
  // add: carry gives right − b^(k+1) with k + 1 < n, lastCarry right − b^n; sub: borrow is above the right result,
  // align below it; div: rest changes the remainder, zero keeps it. mul: none found in 6.2 million tasks (NOTES.md).
  for (let b = 2; b <= 16; b++) {
    for (let a = 1; a < Math.min(Math.pow(b, 3), 300); a += 7) {
      for (let c = 1; c < Math.min(Math.pow(b, 3), 60); c += 3) {
        for (const op of logic.OPS) {
          if (op === 'sub' && c > a) continue;
          const [k1, k2] = logic.WRONGS[op];
          const w1 = logic.wrongOf(op, a, c, b, k1), w2 = logic.wrongOf(op, a, c, b, k2);
          if (w1 && w2) assert.ok(w1.g !== w2.g || w1.r !== w2.r, `${op} ${a} ${c} base ${b}`);
        }
      }
    }
  }
});

// ── params ──

test('numbersOf: whole, clamped to the base limits; b ≥ 1 for mul and div; b ≤ a for sub; r only for div', () => {
  assert.deepEqual(logic.numbersOf(P()), { op: 'sub', a: 846, b: 378, g: 478, r: 0 });
  assert.deepEqual(logic.numbersOf(task('div', 846.7, 0, 281.2, 3.9)), { op: 'div', a: 846, b: 1, g: 281, r: 3 });
  assert.deepEqual(logic.numbersOf(task('sub', 5, 9, 0)), { op: 'sub', a: 5, b: 5, g: 0, r: 0 });
  assert.deepEqual(logic.numbersOf(task('add', 1, 2, 3, 7)).r, 0);
  assert.deepEqual(logic.numbersOf(task('sub', 5, 2, 3, 7)).r, 0);
  assert.deepEqual(logic.numbersOf(task('mul', 5, 2, 10, 7)).r, 0);
  assert.deepEqual(logic.numbersOf(task('mul', Infinity, NaN, -4)), { op: 'mul', a: 0, b: 1, g: 0, r: 0 });
  assert.deepEqual(logic.numbersOf(task('mul', 99999, 9999, 1e9)), { op: 'mul', a: 9999, b: 999, g: 9999999, r: 0 });
  assert.equal(logic.numbersOf(task('div', 1e9, 1e9, 0, 1e9, { base: 2 })).a, 63);
  assert.equal(logic.numbersOf(task('div', 1e9, 1e9, 0, 1e9, { base: 2 })).r, 15);
  assert.equal(logic.numbersOf(P({ op: 'pow' })).op, 'sub', 'an unknown operation reads as the default');
  assert.equal(logic.numbersOf({ op: 'add', a: 9999999, b: 1, g: 0 }).a, 999999, 'no base: base 10, as analyse draws it');
  assert.equal(logic.initial({ op: 'add', a: 9999999, b: 1, g: 0 }).a, 999999);
});

test('fitsIn and minBase: a base in which a number needs more digits is refused', () => {
  const t = logic.numbersOf(P());
  assert.equal(logic.fitsIn(t, 10), true);
  assert.equal(logic.fitsIn(t, 2), false, '846 has 10 binary digits');
  assert.equal(logic.minBase(t), 4, '846 in base 3 has 7 digits, in base 4 five');
  assert.equal(logic.minBase({ op: 'mul', a: 13, b: 5, g: 26, r: 0 }), 2);
  assert.equal(logic.fitsIn({ op: 'div', a: 1, b: 1, g: 0, r: 16 }, 2), false, 'a remainder of 5 binary digits');
  assert.equal(logic.fitsIn({ op: 'div', a: 1, b: 1, g: 0, r: 15 }, 2), true);
  assert.equal(logic.fitsIn({ op: 'add', a: 1, b: 1, g: 128, r: 0 }, 2), false, 'a given result of 8 binary digits');
  assert.equal(logic.fitsIn({ op: 'add', a: 1, b: 1, g: 127, r: 0 }, 2), true);
  assert.equal(logic.minBase({ op: 'mul', a: 457, b: 36, g: 4113, r: 0 }), 5, '457 has 4 digits from base 5');
});

test('parseTask: signs, the given result, the remainder, and every refusal', () => {
  const ok = (s, b) => logic.parseTask(s, b || 10).task;
  const err = (s, b) => logic.parseTask(s, b || 10).error;
  assert.deepEqual(ok('846 − 378 = 478'), { op: 'sub', a: 846, b: 378, g: 478, r: 0 });
  assert.deepEqual(ok('846-378=478'), { op: 'sub', a: 846, b: 378, g: 478, r: 0 });
  assert.deepEqual(ok('457 + 368'), { op: 'add', a: 457, b: 368, g: 825, r: 0 }, 'no =: the right result');
  assert.deepEqual(ok('457 x 36 = 4113'), { op: 'mul', a: 457, b: 36, g: 4113, r: 0 });
  assert.deepEqual(ok('457*36=4113').op, 'mul');
  assert.deepEqual(ok('846 : 3 = 281, 3'), { op: 'div', a: 846, b: 3, g: 281, r: 3 });
  assert.deepEqual(ok('846 / 3 = 281 r 3'), { op: 'div', a: 846, b: 3, g: 281, r: 3 });
  assert.deepEqual(ok('846 ÷ 3 = 281 ostatak 3'), { op: 'div', a: 846, b: 3, g: 281, r: 3 });
  assert.deepEqual(ok('846 : 3 = 281 (3)'), { op: 'div', a: 846, b: 3, g: 281, r: 3 });
  assert.deepEqual(ok('846 : 3 = 282'), { op: 'div', a: 846, b: 3, g: 282, r: 0 }, 'no remainder: 0');
  assert.deepEqual(ok('2023 : 4'), { op: 'div', a: 2023, b: 4, g: 505, r: 3 });
  assert.deepEqual(ok('1c9 · 24 = 4044', 16), { op: 'mul', a: 457, b: 36, g: 16452, r: 0 });
  assert.deepEqual(ok('0846 − 0378 = 0478'), { op: 'sub', a: 846, b: 378, g: 478, r: 0 }, 'leading zeros dropped');
  assert.equal(err(''), 'empty');
  assert.equal(err('846 − '), 'empty');
  assert.equal(err('846 − 378 ='), 'empty');
  assert.equal(err('846 378'), 'op');
  assert.equal(err('846 − 378 + 1'), 'op');
  assert.equal(err('8G6 − 378', 16), 'digit');
  assert.deepEqual(logic.parseTask('846 − 378', 8), { error: 'digit', at: '8' });
  assert.equal(err('1234567 + 1'), 'long');
  assert.deepEqual(ok('0000001 + 1'), { op: 'add', a: 1, b: 1, g: 2, r: 0 }, 'leading zeros do not count');
  assert.deepEqual(ok('2023 : 4 = 505'), { op: 'div', a: 2023, b: 4, g: 505, r: 0 }, 'a result without its remainder: remainder 0');
  assert.equal(err('12345 · 1'), 'long', 'a factor has at most 4 digits');
  assert.equal(err('846 : 1234'), 'long', 'a divisor has at most 3 digits');
  assert.equal(err('8 46 − 3'), 'gap');
  for (const [s, g, r] of [['846 : 3 = 281 ost 3', 281, 3], ['846 : 3 = 281 ost. 3', 281, 3], ['846 : 3 = 281 rem 3', 281, 3],
    ['846 : 3 = 281 r3', 281, 3], ['846 : 3 = 281, ostatak: 3', 281, 3], ['846:3=281R3', 281, 3]]) {
    assert.deepEqual([ok(s).g, ok(s).r], [g, r], s);
  }
  for (const s of ['846 – 378 = 478']) assert.equal(ok(s).op, 'sub', s);
  for (const s of ['457 × 36', '457 ⋅ 36', '457 . 36', '457 X 36']) assert.equal(ok(s).op, 'mul', s);
  assert.equal(ok('1c9 · 24 = 4044', 16).g, 0x4044, 'hex digits are not remainder words');
  assert.equal(err('846 − 378 = 12345678'), 'long');
  assert.equal(err('846 : 3 = 281, 12345'), 'long');
  assert.equal(err('378 − 846'), 'neg');
  assert.equal(err('846 : 0'), 'zero');
  assert.equal(err('846 · 0 = 0'), 'zero');
  assert.equal(err('846 − 378 = 468, 1'), 'rest');
  assert.equal(err('846 : 3 = 281, 3, 1'), 'count');
  assert.equal(err('846 : 3 = 282 = 282'), 'count');
});

test('taskText writes the task back as the field shows it', () => {
  assert.equal(logic.taskText(logic.numbersOf(P()), 10), '846 − 378 = 478');
  assert.equal(logic.taskText({ op: 'div', a: 846, b: 3, g: 281, r: 3 }, 10), '846 : 3 = 281, 3');
  assert.equal(logic.taskText({ op: 'div', a: 846, b: 3, g: 282, r: 0 }, 10), '846 : 3 = 282');
  assert.equal(logic.taskText({ op: 'mul', a: 13, b: 5, g: 26, r: 0 }, 2), '1101 · 101 = 11010');
  for (const pr of logic.PRESETS) {
    const p = P(pr.params), t = logic.numbersOf(p);
    assert.deepEqual(logic.parseTask(logic.taskText(t, p.base), p.base).task, t, `${pr.id} reads back`);
  }
});

// ── presets (SPEC.md, Presets) ──

test('presets: the given result, the estimate and the check of each', () => {
  const rows = logic.PRESETS.map((pr) => {
    const p = P(pr.params), s = S(p), b = s.base;
    return [pr.id, T(s.right, b), `${T(s.est.ra, b)} ${logic.SIGN[s.op]} ${T(s.est.rb, b)} = ${T(s.est.value, b)}`, s.verdict, s.size.off,
      s.check.ok, s.kind];
  });
  assert.deepEqual(rows, [
    ['borrow', '468', '800 − 400 = 400', 'near', 0, false, 'borrow'],
    ['sum', '825', '500 + 400 = 900', 'near', 0, true, 'right'],
    ['shift', '16452', '500 · 40 = 20000', 'far', -1, false, 'shift'],
    ['zero', '206', '600 : 3 = 200', 'far', -1, false, 'zero'],
    ['remainder', '282', '900 : 3 = 300', 'near', 0, false, 'rest'],
    ['base-2', '1000001', '10000 · 100 = 1000000', 'far', -1, false, 'shift']
  ]);
  const rem = S(P(logic.PRESETS[4].params)).check;
  assert.deepEqual([rem.eq, rem.remOk], [true, false], 'preset 5: the equation holds, the remainder is too big');
  const shift = S(P(logic.PRESETS[2].params)).check;
  assert.deepEqual([shift.value, shift.rem], [114, 9]);
  const bin = S(P(logic.PRESETS[5].params)).check;
  assert.deepEqual([T(bin.value, 2), T(bin.rem, 2)], ['101', '1']);
});

test('the default is preset 1 with the estimate and the check closed', () => {
  const d = logic.defaults;
  assert.deepEqual([d.op, d.a, d.b, d.g, d.r, d.base, d.est, d.chk], ['sub', 846, 378, 478, 0, 10, false, false]);
  for (const pr of logic.PRESETS) assert.ok(!('est' in pr.params) && !('chk' in pr.params), `${pr.id} keeps the switches`);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.PRESETS.map((pr) => P(pr.params)))) {
    const s = logic.initial(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate the params', () => {
  const p = P(logic.PRESETS[4].params);
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the model is valid; the page mounts the model presets; an explorer has no steps', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.equal(logic.steps, undefined);
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
  assert.match(html, /L\.PRESETS\.map/);
});
