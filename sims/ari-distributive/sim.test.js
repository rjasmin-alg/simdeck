// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ari-distributive: the model's rules (SPEC.md), tie-breaks first, then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
const count = (s, ch) => s.rows.join('').split(ch).length - 1;

// ── tie-breaks first ──

test('tie-break: no cut (p = 0 or q = 0) is only the whole, and the mistake is ignored', () => {
  for (const p of [0, 23]) {
    const s = S({ p, way: 'one' });
    assert.equal(s.trivial, true);
    assert.equal(s.parts, null);
    assert.equal(s.wrong, false);
    assert.equal(s.result, 92);
    assert.equal(s.ok, true);
    assert.equal(count(s, 'x'), 0);
  }
  assert.ok(S({ p: 0 }).rows.every((r) => r === '2'.repeat(23)));   // the cut at the left edge: all is part 2
  assert.ok(S({ p: 23 }).rows.every((r) => r === '1'.repeat(23)));
  const d = S({ op: 'div', a: 4, b: 21, p: 84, way: 'one' });
  assert.equal(d.trivial, true);
  assert.equal(d.wrong, false);
  assert.equal(d.result, 21);
});

test('tie-break: a split that does not divide is shown first; the mistake waits', () => {
  const s = S({ op: 'div', a: 4, b: 18, p: 70, way: 'one' });
  assert.equal(s.divides, false);
  assert.equal(s.wrong, false);
  assert.equal(count(s, 'o'), 0);
  assert.equal(s.ok, false);
  assert.equal(s.cols, 18);
});

test('tie-break: one row (a = 1) always divides and the mistake loses nothing', () => {
  const d = S({ op: 'div', a: 1, b: 37, p: 13 });
  assert.equal(d.divides, true);
  assert.deepEqual(d.parts.map((x) => x.val), [13, 24]);
  const m = S({ a: 1, b: 23, p: 20, way: 'one' });
  assert.equal(m.wrong, true);
  assert.equal(m.delta, 0);
  assert.equal(m.ok, true);
  assert.equal(m.lost, 0);
  const dm = S({ op: 'div', a: 1, b: 23, p: 20, way: 'one' });
  assert.equal(dm.delta, 0);
  assert.equal(count(dm, 'o'), 0);
});

test('tie-break: the written cut is no cut when b < 10 or b is a multiple of 10', () => {
  assert.deepEqual(logic.placeCut('mul', 6, 7), { p: 0, trivial: true });
  assert.deepEqual(logic.placeCut('mul', 4, 30), { p: 30, trivial: true });
  assert.deepEqual(logic.placeCut('div', 4, 7), { p: 0, trivial: true });
  assert.deepEqual(logic.placeCut('div', 3, 20), { p: 60, trivial: true });
  assert.equal(S({ a: 4, b: 30, p: 30 }).place.here, false);
});

test('tie-break: both factors one-digit: the first is the rows; "23 · 4" is 4 rows of 23', () => {
  assert.deepEqual(logic.parseTask('6 · 7'), { task: { op: 'mul', a: 6, b: 7 } });
  assert.deepEqual(logic.parseTask('23 · 4'), { task: { op: 'mul', a: 4, b: 23 } });
  assert.deepEqual(logic.parseTask('4 · 23'), { task: { op: 'mul', a: 4, b: 23 } });
});

// ── rule 1: the task is made valid ──

test('rule 1: a, b and p are rounded and clamped; unknown op and way take the defaults', () => {
  const t = logic.taskOf({ op: 'pow', a: 12, b: 150 });
  assert.deepEqual(t, { op: 'mul', a: 9, b: 99, n: 891, pMax: 99 });
  assert.deepEqual(logic.taskOf({ op: 'div', a: 0, b: 0 }), { op: 'div', a: 1, b: 1, n: 1, pMax: 1 });
  assert.equal(logic.taskOf({ a: 'x', b: undefined }).a, 4);
  assert.equal(logic.taskOf({ a: 'x', b: undefined }).b, 23);
  assert.equal(logic.pOf({ op: 'mul', a: 4, b: 23, p: 40 }), 23);
  assert.equal(logic.pOf({ op: 'div', a: 4, b: 23, p: 40 }), 40);       // div: up to n = 92
  assert.equal(logic.pOf({ op: 'div', a: 4, b: 23, p: 200 }), 92);
  assert.equal(logic.pOf({ op: 'mul', a: 4, b: 23, p: -3 }), 0);
  assert.equal(logic.pOf({ op: 'mul', a: 4, b: 23, p: 'x' }), 0);
  assert.equal(logic.pOf({ op: 'mul', a: 4, b: 23, p: 7.6 }), 8);
  assert.equal(logic.wayOf({ way: 'flip' }), 'right');
  // an empty value or a boolean is not a number: the default (a, b) or 0 (p), never 0 or 1 by coercion
  assert.equal(logic.taskOf({ a: '', b: true }).a, 4);
  assert.equal(logic.taskOf({ a: '', b: true }).b, 23);
  assert.equal(logic.taskOf({ a: false, b: null }).a, 4);
  assert.equal(logic.pOf({ op: 'mul', a: 4, b: 23, p: true }), 0);
  assert.equal(logic.pOf({ op: 'mul', a: 4, b: 23, p: '' }), 0);
});

// ── rule 3: multiplying a sum ──

test('rule 3: the parts are a · p and a · q; their sum is a · b for every cut', () => {
  const s = S({});
  assert.deepEqual(s.parts.map((x) => x.val), [80, 12]);
  assert.deepEqual(s.parts.map((x) => x.add), [20, 3]);
  assert.equal(s.result, 92);
  assert.equal(s.ok, true);
  assert.deepEqual(S({ p: 13 }).parts.map((x) => x.val), [52, 40]);
  assert.deepEqual(S({ a: 6, b: 47, p: 40 }).parts.map((x) => x.val), [240, 42]);
  for (let a = 1; a <= 9; a++) {
    for (const b of [1, 2, 9, 10, 23, 58, 99]) {
      for (let p = 1; p < b; p++) {
        const x = S({ a, b, p });
        assert.equal(x.parts[0].val + x.parts[1].val, a * b);
      }
    }
  }
});

// ── rule 4: dividing a sum ──

test('rule 4: a split that divides gives p : a + q : a = b, and the check b · a = n', () => {
  const s = S({ op: 'div', a: 4, b: 21, p: 80 });
  assert.equal(s.n, 84);
  assert.equal(s.divides, true);
  assert.deepEqual(s.parts.map((x) => x.val), [20, 1]);
  assert.equal(s.result, 21);
  assert.equal(s.check, 84);
  assert.equal(s.ok, true);
  for (let p = 4; p < 84; p += 4) assert.equal(S({ op: 'div', a: 4, b: 21, p }).result, 21);
});

test('rule 4: a split that does not divide fills c columns and r dots, and is not ok', () => {
  const s = S({ op: 'div', a: 4, b: 18, p: 70 });
  assert.equal(s.divides, false);
  assert.equal(s.c, 17);
  assert.equal(s.r, 2);
  assert.deepEqual(s.parts.map((x) => x.val), [null, null]);
  assert.deepEqual(s.parts.map((x) => x.add), [70, 2]);
  assert.equal(s.ok, false);
  const ok = S({ op: 'div', a: 4, b: 18, p: 40 });
  assert.deepEqual(ok.parts.map((x) => x.val), [10, 8]);
});

// ── rule 5: the cells ──

test('rule 5: part 1 is the columns before the cut and the first r dots of the split column', () => {
  const s = S({ op: 'div', a: 4, b: 18, p: 70 });
  assert.equal(s.rows.length, 4);
  assert.equal(s.rows[0], '1'.repeat(18) + '');
  assert.equal(s.rows[0].length, 18);
  assert.equal(s.rows[0].slice(0, 18), '1'.repeat(17) + '1');   // row 0, column 17: one of the r = 2 dots
  assert.equal(s.rows[1].slice(17, 18), '1');
  assert.equal(s.rows[2], '1'.repeat(17) + '2');
  assert.equal(s.rows[3], '1'.repeat(17) + '2');
  assert.equal(count(s, '1'), 70);
  assert.equal(count(s, '2'), 2);
  const m = S({});
  assert.ok(m.rows.every((r) => r === '1'.repeat(20) + '222'));
});

// ── rule 6: the typical mistake ──

test('rule 6: mul, only the first addend multiplied: a · p + q, (a − 1) · q dots lost', () => {
  const s = S({ way: 'one' });
  assert.equal(s.wrong, true);
  assert.equal(s.result, 83);
  assert.equal(s.delta, -9);
  assert.equal(s.lost, 9);
  assert.equal(s.ok, false);
  assert.equal(s.parts[1].val, 3);
  assert.equal(s.parts[1].raw, true);
  assert.equal(s.rows[0], '1'.repeat(20) + '222');
  assert.equal(s.rows[1], '1'.repeat(20) + 'xxx');
  assert.equal(count(s, 'x'), 9);
  assert.equal(s.cols, 23);
});

test('rule 6: div, only the first part divided: p : a + q, the row drawn that wide with phantom dots', () => {
  const s = S({ op: 'div', a: 4, b: 21, p: 80, way: 'one' });
  assert.equal(s.wrong, true);
  assert.equal(s.result, 24);
  assert.equal(s.check, 96);
  assert.equal(s.delta, 3);
  assert.equal(s.ok, false);
  assert.equal(s.cols, 24);
  assert.equal(s.wideOk, true);
  assert.equal(s.rows[0], '1'.repeat(20) + '2222');
  assert.equal(s.rows[3], '1'.repeat(20) + 'oooo');
  assert.equal(count(s, 'o'), 12);
  assert.equal(s.lost, 12);
});

test('rule 6: a claimed row wider than 99 columns is drawn the right way', () => {
  const s = S({ op: 'div', a: 4, b: 99, p: 4, way: 'one' });   // 1 + 392 columns
  assert.equal(s.wrong, true);
  assert.equal(s.wideOk, false);
  assert.equal(s.cols, 99);
  assert.equal(count(s, 'o'), 0);
  assert.equal(s.result, 1 + 392);
  // the boundary: a claimed row of exactly 99 columns is drawn
  const edge = S({ op: 'div', a: 2, b: 60, p: 42, way: 'one' });   // 21 + 78 = 99
  assert.equal(edge.wideOk, true);
  assert.equal(edge.cols, 99);
  assert.equal(S({ op: 'div', a: 2, b: 60, p: 40, way: 'one' }).wideOk, false);   // 20 + 80 = 100
});

// ── rule 7: the written cut ──

test('rule 7: the written form cuts after the full tens of columns', () => {
  assert.equal(logic.placeCut('mul', 4, 23).p, 20);
  assert.equal(logic.placeCut('mul', 6, 47).p, 40);
  assert.equal(logic.placeCut('div', 4, 21).p, 80);
  assert.equal(logic.placeCut('div', 4, 18).p, 40);
  assert.equal(logic.placeCut('div', 3, 32).p, 90);
  assert.equal(logic.placeCut('div', 6, 26).p, 120);
  assert.equal(S({}).place.here, true);
  assert.equal(S({ p: 13 }).place.here, false);
  assert.equal(S({ op: 'div', a: 4, b: 18, p: 70 }).place.p, 40);
});

// ── rule 8: the written form ──

test('rule 8: written multiplication: ones first with the carry, then the tens with it', () => {
  const w = logic.written('mul', 4, 23);
  assert.equal(w.result, 92);
  assert.deepEqual(w.steps[0], { kind: 'mulOnes', d: 3, a: 4, prod: 12, write: 2, carry: 1, part: 2 });
  assert.deepEqual(w.steps[1], { kind: 'mulTens', d: 2, a: 4, prod: 8, carryIn: 1, sum: 9, write: 9, part: 1 });
  const w2 = logic.written('mul', 6, 47);
  assert.deepEqual([w2.steps[0].write, w2.steps[0].carry, w2.steps[1].prod, w2.steps[1].write], [2, 4, 24, 28]);
  assert.equal(w2.result, 282);
  const one = logic.written('mul', 6, 7);
  assert.deepEqual(one.steps, [{ kind: 'mulOnly', d: 7, a: 6, prod: 42 }]);
  const z = logic.written('mul', 4, 30);
  assert.deepEqual([z.steps[0].prod, z.steps[0].carry, z.steps[1].sum], [0, 0, 12]);
  // the carry is the tens of the ones' product, rounded down (75 → 7, not 8)
  const c = logic.written('mul', 3, 25);
  assert.deepEqual([c.steps[0].prod, c.steps[0].write, c.steps[0].carry, c.steps[1].sum], [15, 5, 1, 7]);
  const c2 = logic.written('mul', 5, 15);
  assert.deepEqual([c2.steps[0].prod, c2.steps[0].carry, c2.carry], [25, 2, 2]);
  assert.equal(logic.written('mul', 9, 9).carry, 0);   // one step: no carry is drawn
  assert.equal(logic.written('mul', 3, 25).steps.length, 2);
  for (let a = 1; a <= 9; a++) for (let b = 10; b <= 99; b++) {
    const w = logic.written('mul', a, b);
    assert.equal(w.steps[0].carry, Math.floor((b % 10) * a / 10));
    assert.equal(10 * w.steps[1].write + w.steps[0].write, a * b);
  }
});

test('rule 8: written division: the tens with a remainder, then the remainder and the ones brought down', () => {
  const w = logic.written('div', 4, 21);
  assert.deepEqual(w.steps[0], { kind: 'divTens', num: 8, a: 4, quot: 2, rem: 0, part: 1 });
  assert.deepEqual(w.steps[1], { kind: 'divOnes', num: 4, a: 4, quot: 1, rem: 0, part: 2, down: 4 });
  assert.equal(w.work[0].text, '04');
  const w2 = logic.written('div', 4, 18);
  assert.deepEqual([w2.steps[0].num, w2.steps[0].quot, w2.steps[0].rem, w2.steps[1].num, w2.steps[1].quot], [7, 1, 3, 32, 8]);
  assert.equal(w2.work[0].text, '32');
  const w3 = logic.written('div', 6, 26);
  assert.deepEqual([w3.steps[0].num, w3.steps[0].rem, w3.steps[1].num, w3.steps[1].quot], [15, 3, 36, 6]);
  const one = logic.written('div', 4, 7);
  assert.deepEqual(one.steps, [{ kind: 'divOnly', num: 28, a: 4, quot: 7 }]);
  // the working ends under the ones of the dividend: the remainder with the ones brought down, then 0
  assert.deepEqual(w2.work, [{ text: '32', end: 0 }, { text: '0', end: 0 }]);
  assert.deepEqual(one.work, [{ text: '0', end: 0 }]);
  // step 2's number is always the second part of the written cut
  for (let a = 1; a <= 9; a++) {
    for (let b = 11; b <= 99; b++) {
      if (b % 10 === 0) continue;
      const x = logic.written('div', a, b);
      assert.equal(x.steps[1].num, a * b - logic.placeCut('div', a, b).p);
      assert.ok(x.steps[0].rem < a);
    }
  }
});

// ── rule 9: the task field ──

test('rule 9: the task field reads the signs pupils write and refuses with a reason, in order', () => {
  assert.deepEqual(logic.parseTask('4*23'), { task: { op: 'mul', a: 4, b: 23 } });
  assert.deepEqual(logic.parseTask(' 4 x 23 = '), { task: { op: 'mul', a: 4, b: 23 } });
  assert.deepEqual(logic.parseTask('4×23'), { task: { op: 'mul', a: 4, b: 23 } });
  assert.deepEqual(logic.parseTask('84 : 4'), { task: { op: 'div', a: 4, b: 21 } });
  assert.deepEqual(logic.parseTask('84/4'), { task: { op: 'div', a: 4, b: 21 } });
  assert.deepEqual(logic.parseTask('84÷4'), { task: { op: 'div', a: 4, b: 21 } });
  assert.deepEqual(logic.parseTask('891 : 9'), { task: { op: 'div', a: 9, b: 99 } });
  assert.equal(logic.parseTask('').error, 'empty');
  assert.equal(logic.parseTask('4 + 23').error, 'op');
  assert.equal(logic.parseTask('4 · 2 · 3').error, 'op');
  assert.equal(logic.parseTask('4 · ').error, 'num');
  assert.equal(logic.parseTask('0 · 23').error, 'zero');
  assert.equal(logic.parseTask('84 : 0').error, 'zero');
  assert.equal(logic.parseTask('12 · 23').error, 'two');
  assert.equal(logic.parseTask('4 · 123').error, 'big');
  assert.equal(logic.parseTask('84 : 12').error, 'divisor');
  assert.equal(logic.parseTask('85 : 4').error, 'rem');
  assert.equal(logic.parseTask('900 : 9').error, 'big');
  // two refusals at once: the first in the order wins
  assert.equal(logic.parseTask('0 · ').error, 'num');        // num before zero
  assert.equal(logic.parseTask('123 · 456').error, 'two');   // two before big
  assert.equal(logic.parseTask('85 : 12').error, 'divisor'); // divisor before rem
  assert.equal(logic.parseTask('1000 : 9').error, 'rem');    // rem before big
  // only a trailing "=" is ignored; ⋅ and X are multiplication signs
  assert.equal(logic.parseTask('4 · 2=3').error, 'num');
  assert.deepEqual(logic.parseTask('4⋅23'), { task: { op: 'mul', a: 4, b: 23 } });
  assert.deepEqual(logic.parseTask('4X23'), { task: { op: 'mul', a: 4, b: 23 } });
  assert.equal(logic.taskText({ op: 'mul', a: 4, b: 23 }), '4 · 23');
  assert.equal(logic.taskText({ op: 'div', a: 4, b: 21 }), '84 : 4');
});

test('switching the operation keeps the cut: p columns ↔ a · p dots (half up back)', () => {
  assert.equal(logic.convertP('mul', 4, 20), 80);
  assert.equal(logic.convertP('div', 4, 80), 20);
  assert.equal(logic.convertP('div', 4, 70), 18);   // 17.5 rounds up
  assert.equal(logic.convertP('div', 4, 69), 17);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [{}].concat(logic.PRESETS.map((x) => x.params))) {
    const s = S(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ op: 'div', a: 4, b: 21, p: 80, way: 'one' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
});

test('every preset gives its expected numbers (SPEC.md, Presets)', () => {
  const by = Object.fromEntries(logic.PRESETS.map((x) => [x.id, S(x.params)]));
  assert.deepEqual(by.split.parts.map((x) => x.val).concat(by.split.result), [80, 12, 92]);
  assert.deepEqual(by.written.parts.map((x) => x.val).concat(by.written.result), [240, 42, 282]);
  assert.deepEqual(by.divide.parts.map((x) => x.val).concat(by.divide.result, by.divide.check), [20, 1, 21, 84]);
  assert.equal(by.nodiv.divides, false);
  assert.equal(by.nodiv.place.p, 40);
  assert.deepEqual([by.mistake.result, by.mistake.lost, by.mistake.hide], [83, 9, true]);
  assert.deepEqual([by.mistakeDiv.result, by.mistakeDiv.check, by.mistakeDiv.lost], [24, 96, 12]);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the model is valid params, and the page is an explorer', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const pr of logic.PRESETS) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.equal(logic.pOf(pr.params), pr.params.p, pr.id + ': p in range');
    assert.ok('p_' + pr.id in strings.hr, 'label for ' + pr.id);
    assert.ok('ph_' + pr.id in strings.hr, 'hint for ' + pr.id);
  }
});
