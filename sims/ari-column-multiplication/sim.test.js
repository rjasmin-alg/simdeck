// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ari-column-multiplication's model (SPEC.md). Run: node --test sims/ari-column-multiplication/
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
/** A row of digits (ones first) as a numeral. */
const txt = (ds) => ds.slice().reverse().map((d) => logic.DIGITS[d]).join('');
/** The digit steps of row j as [prod, written, carried]. */
const dsteps = (p, j) => plan(p).rows[j].steps.map((s) => [s.prod, txt(s.write), s.cout]);

// ── tie-breaks first ──

test('tie-break 1: a carry of 0 is not carried (no tag in the state)', () => {
  const p = nums(312, 2);
  assert.deepEqual(dsteps(p, 0), [[4, '4', 0], [2, '2', 0], [6, '6', 0]]);
  for (let n = 1; n <= logic.steps(p); n++) assert.equal(at(p, n).carry, 0);
  assert.equal(at(nums(457, 3), 1).carry, 2, 'a carry that is not 0 is kept for the next square');
});

test('tie-break 2: a product that reaches the base exactly writes 0 and carries 1', () => {
  assert.deepEqual(dsteps(nums(312, 5), 0), [[10, '0', 1], [6, '6', 0], [15, '15', 0]]);
  assert.equal(txt(plan(nums(312, 5)).rows[0].digits), '1560');
  // in base 2 every digit is 0 or 1, so the same rule shows in base 3: 2 · 2 = 4 = 11₃ → 1 carry 1
  assert.deepEqual(dsteps(nums(5, 2, { base: 3 }), 0), [[4, '1', 1], [3, '10', 0]]);
});

test('tie-break 3: the last digit of the first factor writes its whole product; nothing leaves the row', () => {
  const p = nums(457, 3);
  assert.deepEqual(dsteps(p, 0), [[21, '1', 2], [17, '7', 1], [13, '13', 0]]);
  const s = at(p, 3);
  assert.deepEqual(s.parts[0], [1, 7, 3, 1], 'two squares in the last step');
  assert.equal(s.carry, 0);
  assert.deepEqual(dsteps(nums(7, 9), 0), [[63, '63', 0]], 'a one-digit first factor: one step, both digits');
});

test('tie-break 4: a digit 0 or 1 writes its row in one step; zeros keep the columns; a lone 0 is the product 0', () => {
  const p = nums(312, 205);
  const r = plan(p).rows;
  assert.deepEqual(r.map((x) => [x.d, x.kind, x.place]), [[2, 'mul', 2], [0, 'zero', 1], [5, 'mul', 0]]);
  assert.equal(txt(r[1].digits), '000', 'as many zeros as the first factor has digits');
  assert.equal(logic.steps(p), 3 + 1 + 3 + 1);
  const s4 = at(p, 4);
  assert.deepEqual([s4.phase, s4.row], ['row', 1]);
  assert.deepEqual(s4.parts[1], [0, 0, 0]);
  const one = plan(nums(457, 1)).rows[0];
  assert.deepEqual([one.kind, txt(one.digits)], ['one', '457']);
  assert.equal(logic.steps(nums(457, 1)), 1, 'one row, no sum');
  assert.equal(txt(plan(nums(457, 0)).rows[0].digits), '0', 'a one-digit second factor 0: the product 0');
  assert.equal(txt(plan(nums(457, 0)).sum), '0');
  assert.equal(txt(plan(nums(0, 36)).sum), '0');
});

test('tie-break: input separators ·, ×, *, x and spaces; a–f read as A–F; leading zeros dropped', () => {
  assert.deepEqual(logic.parseList('457 · 36', 10), { values: [457, 36] });
  assert.deepEqual(logic.parseList('457*36', 10), { values: [457, 36] });
  assert.deepEqual(logic.parseList('457 x 36', 10), { values: [457, 36] });
  assert.deepEqual(logic.parseList('457×36', 10), { values: [457, 36] });
  assert.deepEqual(logic.parseList('457 36', 10), { values: [457, 36] });
  assert.deepEqual(logic.parseList('1c9 · 24', 16), { values: [457, 36] });
  assert.deepEqual(logic.parseList('0457 · 036', 10), { values: [457, 36] });
});

// ── rules ──

test('rule 5: rows from the second factor\'s left digit, each from the first factor\'s ones; the sum last', () => {
  const p = nums(457, 36);
  assert.deepEqual(plan(p).seq, [{ row: 0, i: 0 }, { row: 0, i: 1 }, { row: 0, i: 2 }, { row: 1, i: 0 }, { row: 1, i: 1 }, { row: 1, i: 2 }, { sum: true }]);
  assert.equal(logic.steps(p), 7);
  const s0 = at(p, 0);
  assert.deepEqual([s0.phase, s0.parts, s0.sum], ['start', [null, null], false]);
  const s2 = at(p, 2);
  assert.deepEqual([s2.phase, s2.row, s2.i, s2.parts, s2.carry], ['digit', 0, 1, [[1, 7], null], 1]);
  const s4 = at(p, 4);
  assert.deepEqual([s4.row, s4.i, s4.parts[1], s4.carry], [1, 0, [2], 4]);
  const s7 = at(p, 7);
  assert.deepEqual([s7.phase, s7.sum], ['sum', true]);
});

test('rule 6: each row ends under its digit; its value on the paper is value · base^place (457 · 36 = 16452)', () => {
  const pl = plan(nums(457, 36));
  assert.deepEqual(pl.rows.map((r) => [r.d, r.place, txt(r.digits)]), [[3, 1, '1371'], [6, 0, '2742']]);
  assert.equal(txt(pl.sum), '16452');
  assert.deepEqual(pl.carries, [0, 0, 0, 1, 0], 'one carry, into the thousands (3 + 7 = 10)');
  assert.equal(pl.cols, 6, 'the factors line 457·36 is the widest');
});

test('rule 7: the carries inside a row are at most base − 2', () => {
  assert.deepEqual(dsteps(nums(457, 6), 0), [[42, '2', 4], [34, '4', 3], [27, '27', 0]]);
  for (let b = 3; b <= 16; b++) {
    const top = b * b * b * b - 1;
    for (let d = 2; d < b; d++) {
      for (const a of [top, top - 1, Math.floor(top / 3), b * b - 1]) {
        for (const s of logic.multiplyColumns(a, d, b).rows[0].steps) assert.ok(s.cout <= b - 2, `${a}·${d} base ${b}`);
      }
    }
  }
});

test('rule 8 and 9: the product is a · b in every base; the sum\'s carries are at most 3', () => {
  let seed = 7;
  const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  for (let b = 2; b <= 16; b++) {
    const lim = b ** 4;
    for (let t = 0; t < 150; t++) {
      const a = rnd(lim), c = rnd(lim);
      const pl = logic.multiplyColumns(a, c, b);
      assert.equal(pl.value, a * c, `${a}·${c} base ${b}`);
      assert.ok(Math.max(...pl.carries) <= 3);
      assert.ok(pl.seq.length <= 17);
    }
    assert.equal(logic.multiplyColumns(lim - 1, lim - 1, b).value, (lim - 1) ** 2);
  }
  assert.equal(logic.steps(nums(9999, 9999)), 17, 'the most steps: 4 × 4 + 1');
});

test('rule 10: the area model: cells add up to their row\'s total, the row total is the shifted partial product', () => {
  const ar = logic.areaOf(nums(457, 36));
  assert.deepEqual(ar.cols.map((c) => c.value), [400, 50, 7]);
  assert.deepEqual(ar.rows.map((r) => r.value), [30, 6]);
  assert.deepEqual(ar.cells, [[12000, 1500, 210], [2400, 300, 42]]);
  assert.deepEqual(ar.rowTotals, [13710, 2742]);
  assert.equal(ar.total, 16452);
  for (const [a, c, b] of [[13, 11, 2], [457, 36, 16], [312, 205, 10], [4095, 4095, 8]]) {
    const r = logic.areaOf(nums(a, c, { base: b }));
    r.cells.forEach((row, j) => assert.equal(row.reduce((x, y) => x + y, 0), r.rowTotals[j]));
    assert.equal(r.total, a * c);
  }
});

test('rule 11: any base, same algorithm (1C9 · 24 in base 16; 1101 · 1011 in base 2)', () => {
  const h = nums(457, 36, { base: 16 });
  assert.deepEqual(dsteps(h, 0), [[18, '2', 1], [25, '9', 1], [3, '3', 0]]);
  assert.deepEqual(dsteps(h, 1), [[36, '4', 2], [50, '2', 3], [7, '7', 0]]);
  assert.equal(txt(plan(h).sum), '4044');
  const b2 = nums(13, 11, { base: 2 });
  const pl = plan(b2);
  assert.deepEqual(pl.rows.map((r) => [r.kind, txt(r.digits), r.place]), [['one', '1101', 3], ['zero', '0000', 2], ['one', '1101', 1], ['one', '1101', 0]]);
  assert.equal(txt(pl.sum), '10001111');
  assert.deepEqual(pl.carries, [0, 0, 0, 0, 1, 1, 1, 1]);
  assert.equal(logic.steps(b2), 5);
  // every row in base 2 is the first factor or zeros: shift-and-add
  for (let a = 1; a < 16; a++) for (let c = 1; c < 16; c++) {
    for (const r of logic.multiplyColumns(a, c, 2).rows) assert.ok(r.kind === 'one' || r.kind === 'zero');
  }
});

test('limits: at most 4 digits per factor; typed input refused with a reason', () => {
  assert.equal(logic.fitsIn([9999, 36], 10), true);
  assert.equal(logic.fitsIn([10000, 36], 10), false);
  assert.equal(logic.minBase([457, 36]), 5, '457 needs 4 digits in base 5 (3312), 5 in base 4');
  assert.equal(logic.minBase([13, 11]), 2);
  assert.deepEqual(logic.parseList('12345 · 6', 10), { error: 'long', at: '12345' });
  assert.deepEqual(logic.parseList('457 · 3A', 10), { error: 'digit', at: 'A' });
  assert.deepEqual(logic.parseList('102 · 2', 2), { error: 'digit', at: '2' });
  assert.deepEqual(logic.parseList('457', 10), { error: 'count', at: '1' });
  assert.deepEqual(logic.parseList('4 · 5 · 6', 10), { error: 'count', at: '3' });
  assert.deepEqual(logic.parseList('', 10), { error: 'count', at: '' });
  assert.deepEqual(logic.parseList('457 ·', 10), { error: 'empty', at: '·' });
  assert.deepEqual(logic.numbersOf({ a: -3, b: 'x' }), [0, 0]);
  assert.deepEqual(logic.numbersOf({ a: Infinity, b: 1e400 }), [0, 0], 'a non-finite URL value is 0');
  assert.deepEqual(logic.numbersOf({ a: 99999, b: 4.7 }), [65535, 4], 'clamped to four hexadecimal digits, whole');
});

// ── typical mistakes ──

test('mistake noshift: rows end under the ones (457 · 36 → 4113); a one-digit second factor gives the right answer', () => {
  const m = logic.mistakeOf(nums(457, 36), 'noshift');
  assert.equal(m.text, '4113');
  assert.deepEqual(m.rows.map((r) => r.place), [0, 0]);
  assert.ok(m.rows.every((r) => r.differs.every((x) => !x)), 'the digits are right, only the place is wrong');
  assert.equal(m.same, false);
  assert.equal(m.over, 4113 - 16452);
  assert.equal(logic.mistakeOf(nums(312, 205), 'noshift').text, '2184');
  assert.equal(logic.mistakeOf(nums(13, 11, { base: 2 }), 'noshift').text, '100111');
  assert.equal(logic.mistakeOf(nums(457, 36, { base: 16 }), 'noshift').text, 'AB6');
  assert.equal(logic.mistakeOf(nums(248, 7), 'noshift').same, true);
  assert.deepEqual(logic.mistakeOf(nums(248, 7), 'noshift').differs, [false, false, false, false]);
});

test('mistake carry: the carry forgotten (457 · 36 → 14912: 1251, 2402)', () => {
  const m = logic.mistakeOf(nums(457, 36), 'carry');
  assert.deepEqual(m.rows.map((r) => txt(r.digits)), ['1251', '2402']);
  assert.deepEqual(m.rows[0].differs, [false, true, true, false], '1371 against 1251');
  assert.equal(m.text, '14912');
  assert.deepEqual(m.first, { row: 0, ad: 5, d: 3, cin: 2, right: 17, prod: 15 });
  assert.equal(logic.mistakeOf(nums(248, 7), 'carry').text, '1486');
  assert.equal(logic.mistakeOf(nums(312, 205), 'carry').text, '63950');
  assert.equal(logic.mistakeOf(nums(457, 36, { base: 16 }), 'carry').text, '2C24');
});

test('mistake carryfirst: the carry added before multiplying (457 · 36 → 23552: 1811, 5442)', () => {
  const m = logic.mistakeOf(nums(457, 36), 'carryfirst');
  assert.deepEqual(m.rows.map((r) => txt(r.digits)), ['1811', '5442']);
  assert.equal(m.text, '23552');
  assert.deepEqual(m.first, { row: 0, ad: 5, d: 3, cin: 2, right: 17, prod: 21 });
  assert.equal(logic.mistakeOf(nums(248, 7), 'carryfirst').text, '5636');
  assert.equal(logic.mistakeOf(nums(312, 205), 'carryfirst').text, '64400');
  assert.equal(logic.mistakeOf(nums(457, 36, { base: 16 }), 'carryfirst').text, '5AA4');
});

test('mistake tie-break: no carry anywhere (base 2, 312 · 2) gives the right answer; nothing is marked', () => {
  for (const kind of ['carry', 'carryfirst']) {
    for (const p of [nums(13, 11, { base: 2 }), nums(312, 2), nums(11, 11)]) {
      const m = logic.mistakeOf(p, kind);
      assert.equal(m.same, true, kind);
      assert.equal(m.first, null);
      assert.ok(m.differs.every((x) => !x));
      assert.ok(m.rows.every((r) => r.differs.every((x) => !x)));
    }
  }
});

test('presets: the numbers and step counts of SPEC.md', () => {
  const want = { 'two-digit': ['16452', 7], 'one-digit': ['1736', 3], 'zero-digit': ['63960', 8], 'no-shift': ['16452', 7],
    'base-2': ['10001111', 5], 'base-16': ['4044', 7] };
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    assert.equal(txt(plan(p).sum), want[pr.id][0], pr.id);
    assert.equal(logic.steps(p), want[pr.id][1], pr.id);
    assert.ok(logic.fitsIn(logic.numbersOf(p), p.base), pr.id);
  }
  assert.equal(logic.mistakeOf(P(logic.PRESETS[3].params), 'noshift').text, '4113');
});

test('every step writes what the plan says, and the last state has every row and the product', () => {
  let seed = 3;
  const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  for (let t = 0; t < 120; t++) {
    const b = 2 + rnd(15), lim = b ** 4;
    const p = nums(rnd(lim), rnd(lim), { base: b });
    const pl = plan(p);
    const s = last(p);
    assert.deepEqual(s.parts, pl.rows.map((r) => r.digits));
    assert.equal(s.sum, pl.m > 1);
    assert.equal(s.carry, 0);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  const p = nums(312, 205);
  for (let n = 0; n <= logic.steps(p); n++) {
    const s = at(p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = nums(457, 36, { base: 16 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  assert.deepEqual(logic.step(forward[forward.length - 1], logic.steps(p) + 1, p), forward[forward.length - 1], 'past the end: unchanged');
});

test('step does not mutate its input', () => {
  const p = nums(457, 36);
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
