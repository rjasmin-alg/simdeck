// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ari-times-ten's model (SPEC.md). Run: node --test sims/ari-times-ten/
// Tie-breaks first, then the rules, the presets' expected numbers (from the independent script), the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const stepsOf = (over) => kit.stepsOf(logic, P(over));
const run = (over) => { const out = []; for (let i = 0; i <= stepsOf(over); i++) out.push(at(over, i)); return out; };
const rowsOf = (over) => logic.demoOf(P(over)).rows.map((r) => logic.textOf(r.value, logic.demoOf(P(over)).b));
const outsOf = (over) => logic.demoOf(P(over)).rows.map((r) => r.out);

// ── tie-breaks ──

test('rule 5 tie: exactly a million fits (1000 · 1000, 100 000 · 10); one more is over', () => {
  assert.equal(logic.statusOf(1000, 10, 'm3'), 'ok');
  assert.deepEqual(rowsOf({ n: 1000, op: 'm3' }), ['1000', '10000', '100000', '1000000']);
  assert.equal(stepsOf({ n: 1000, op: 'm3' }), 4);
  assert.equal(logic.statusOf(100000, 10, 'm1'), 'ok');
  assert.equal(logic.statusOf(1001, 10, 'm3'), 'over');
  assert.equal(logic.statusOf(100001, 10, 'm1'), 'over');
  assert.equal(stepsOf({ n: 2000, op: 'm3' }), 1);
  assert.deepEqual(at({ n: 2000, op: 'm3' }, 1), { phase: 'over', i: 0 });
  assert.deepEqual(rowsOf({ n: 2000, op: 'm3' }), ['2000']);
});

test('rule 6 tie: a 0 inside the number does not count (3040 : 100 stops at the second move, the 4)', () => {
  assert.equal(logic.statusOf(3040, 10, 'd2'), 'stop');
  assert.deepEqual(rowsOf({ n: 3040, op: 'd2' }), ['3040', '304', '30']);
  assert.deepEqual(outsOf({ n: 3040, op: 'd2' }), [null, 0, 4]);
  assert.equal(stepsOf({ n: 3040, op: 'd2' }), 2);
  assert.deepEqual(at({ n: 3040, op: 'd2' }, 1), { phase: 'move', i: 1 });
  assert.deepEqual(at({ n: 3040, op: 'd2' }, 2), { phase: 'stop', i: 2 });
  // exactly k zeros at the end is enough
  assert.equal(logic.statusOf(3400, 10, 'd2'), 'ok');
  assert.equal(logic.demoOf(P({ n: 3400, op: 'd2' })).result, 34);
});

test('mistake middle tie: when the first zeros are the last ones there is nothing to see (3400 : 100)', () => {
  const m = logic.mistakeOf(P({ n: 3400, op: 'd2' }), 'middle');
  assert.equal(m.applies, false);
  assert.equal(m.reason, 'same');
  assert.equal(logic.mistakeOf(P({ n: 1000, op: 'd1' }), 'middle').reason, 'same');
});

// ── rules ──

test('rules 1–2: multiplying, every digit one place left per move and a 0 fills the ones', () => {
  assert.deepEqual(rowsOf({ n: 47, op: 'm2' }), ['47', '470', '4700']);
  assert.deepEqual(outsOf({ n: 47, op: 'm2' }), [null, null, null]);
  for (const [n, op, k] of [[47, 'm1', 1], [47, 'm2', 2], [47, 'm3', 3], [999, 'm3', 3]]) {
    const D = logic.demoOf(P({ n, op }));
    assert.equal(D.k, k);
    D.rows.forEach((r, j) => {
      assert.equal(r.value, n * 10 ** j);
      if (j > 0) {
        const prev = logic.digitsOf(D.rows[j - 1].value, 10), now = logic.digitsOf(r.value, 10);
        assert.equal(now[0], 0, 'a 0 in the ones');
        assert.deepEqual(now.slice(1), prev, 'every digit one place left');
      }
    });
  }
});

test('rule 3: dividing, every digit one place right and the 0 of the ones leaves', () => {
  assert.deepEqual(rowsOf({ n: 52000, op: 'd3' }), ['52000', '5200', '520', '52']);
  assert.deepEqual(outsOf({ n: 52000, op: 'd3' }), [null, 0, 0, 0]);
  const D = logic.demoOf(P({ n: 52000, op: 'd3' }));
  D.rows.slice(1).forEach((r, i) => {
    const prev = logic.digitsOf(D.rows[i].value, 10), now = logic.digitsOf(r.value, 10);
    assert.deepEqual(now, prev.slice(1));
    assert.equal(r.out, prev[0]);
  });
});

test('rule 4: k + 1 steps, start, k moves, done', () => {
  assert.deepEqual(run({ n: 205, op: 'm3' }), [
    { phase: 'start', i: 0 }, { phase: 'move', i: 1 }, { phase: 'move', i: 2 }, { phase: 'move', i: 3 }, { phase: 'done', i: 3 }]);
  assert.equal(stepsOf({ n: 34, op: 'm1' }), 2);
  assert.equal(stepsOf({ n: 3400, op: 'd2' }), 3);
  assert.equal(stepsOf({ n: 1000, op: 'd3' }), 4);
  // the most any demo takes is 4 (a stepper may have 20)
  let most = 0;
  for (let b = 2; b <= 16; b++) for (const op of logic.OPS) for (const n of [1, 7, b ** 3, b ** 3 * 5, 1000, 999999, 1000000]) {
    most = Math.max(most, stepsOf({ n, op, base: b }));
  }
  assert.equal(most, 4);
});

test('rule 6: dividing a number that does not end in 0 stops at the first move (347 : 10, the 7)', () => {
  assert.deepEqual(run({ n: 347, op: 'd1' }), [{ phase: 'start', i: 0 }, { phase: 'stop', i: 1 }]);
  assert.deepEqual(outsOf({ n: 347, op: 'd1' }), [null, 7]);
  assert.equal(logic.demoOf(P({ n: 347, op: 'd1' })).result, null);
  assert.deepEqual(rowsOf({ n: 340, op: 'd2' }), ['340', '34', '3']);
  assert.equal(stepsOf({ n: 340, op: 'd2' }), 2);
  // any digit other than 0 stops it, 1 too (341 : 10; 11₂ : 10₂, an odd number in base 2)
  assert.equal(logic.statusOf(341, 10, 'd1'), 'stop');
  assert.equal(logic.statusOf(3, 2, 'd1'), 'stop');
  assert.equal(logic.statusOf(6, 2, 'd1'), 'ok');
});

test('rule 7: the result, in the base\'s numerals', () => {
  assert.equal(logic.demoOf(P({ n: 1000, op: 'd3' })).result, 1);
  assert.equal(logic.textOf(logic.demoOf(P({ n: 26, op: 'm3', base: 16 })).result, 16), '1A000');
  assert.equal(logic.textOf(logic.demoOf(P({ n: 64, op: 'd2', base: 8 })).result, 8), '1');
});

test('any base: one move is · b, and 10ᵏ written in base b is bᵏ', () => {
  for (let b = 2; b <= 16; b++) {
    assert.equal(logic.textOf(b, b), '10');
    assert.equal(logic.textOf(b ** 3, b), '1000');
    const D = logic.demoOf(P({ n: 5, op: 'm3', base: b }));
    assert.deepEqual(D.rows.map((r) => r.value), [5, 5 * b, 5 * b * b, 5 * b ** 3]);
  }
  assert.deepEqual(rowsOf({ n: 1000000, op: 'd3', base: 2 }),
    ['11110100001001000000', '1111010000100100000', '111101000010010000', '11110100001001000']);
});

test('the table is as wide as the widest row, at least 4 places', () => {
  assert.equal(logic.colsOf(logic.demoOf(P({ n: 34, op: 'm1' }))), 4);
  assert.equal(logic.colsOf(logic.demoOf(P({ n: 205, op: 'm3' }))), 6);
  assert.equal(logic.colsOf(logic.demoOf(P({ n: 1000, op: 'm3' }))), 7);
  assert.equal(logic.colsOf(logic.demoOf(P({ n: 52000, op: 'd3' }))), 5);
  assert.equal(logic.colsOf(logic.demoOf(P({ n: 1000000, op: 'd1', base: 2 }))), 20);
  assert.equal(logic.colsOf(logic.demoOf(P({ n: 2000, op: 'm3' }))), 4);
});

test('moves: each non-zero digit and the place it goes to', () => {
  assert.deepEqual(logic.movesOf(P({ n: 47, op: 'm2' })), [{ d: 4, from: 1, to: 3 }, { d: 7, from: 0, to: 2 }]);
  assert.deepEqual(logic.movesOf(P({ n: 3040, op: 'd1' })), [{ d: 3, from: 3, to: 2 }, { d: 4, from: 1, to: 0 }]);
});

test('mistake few: one move too few, for every operation that is done', () => {
  const m = logic.mistakeOf(P({ n: 47, op: 'm2' }), 'few');
  assert.equal(m.applies, true);
  assert.equal(m.wrongText, '470');
  assert.equal(m.rightText, '4700');
  assert.deepEqual(m.diff, [1, 2, 3]);
  assert.equal(logic.mistakeOf(P({ n: 34, op: 'm1' }), 'few').wrongText, '34');
  assert.equal(logic.mistakeOf(P({ n: 52000, op: 'd3' }), 'few').wrongText, '520');
  assert.equal(logic.mistakeOf(P({ n: 205, op: 'm3' }), 'few').wrongText, '20500');
  assert.equal(logic.mistakeOf(P({ n: 347, op: 'd1' }), 'few').reason, 'stop');
  assert.equal(logic.mistakeOf(P({ n: 2000, op: 'm3' }), 'few').reason, 'over');
});

test('mistake middle: the first zeros from the left are crossed out instead of the last', () => {
  const m = logic.mistakeOf(P({ n: 3040, op: 'd1' }), 'middle');
  assert.equal(m.applies, true);
  assert.deepEqual([m.wrongText, m.rightText], ['340', '304']);
  assert.deepEqual(m.diff, [0, 1]);
  assert.equal(logic.mistakeOf(P({ n: 20500, op: 'd2' }), 'middle').wrongText, '250');
  assert.equal(logic.mistakeOf(P({ n: 47, op: 'm2' }), 'middle').reason, 'mul');
  assert.equal(logic.mistakeOf(P({ n: 3470, op: 'd2' }), 'middle').reason, 'stop');
  assert.equal(logic.mistakeOf(P({ n: 3040, op: 'd1' }), 'none').reason, 'none');
  // the param picks the kind when none is given
  assert.equal(logic.mistakeOf(P({ n: 3040, op: 'd1', mistake: 'middle' })).wrongText, '340');
});

test('params: rounded and clamped; unknown op and mistake fall back', () => {
  assert.deepEqual(logic.numbersOf({ n: '12.6', base: 1, op: 'x', mistake: 'y' }),
    { n: 13, b: 2, op: 'm2', kind: 'mul', k: 2, mistake: 'none' });
  assert.equal(logic.numbersOf({ n: 5e9, base: 99, op: 'd3' }).n, 1000000);
  assert.equal(logic.numbersOf({ n: 5e9, base: 99, op: 'd3' }).b, 16);
  assert.equal(logic.numbersOf({ n: 'abc', base: 'x', op: 'd1' }).n, 47);
  assert.equal(logic.numbersOf({ n: 0, base: 10, op: 'd1' }).n, 1);
  assert.equal(logic.numbersOf({ n: '', base: '', op: 'd1' }).b, 10);
});

test('parseNumber: digits of the base, spaces allowed, 1 … a million', () => {
  assert.deepEqual(logic.parseNumber('205 000', 10), { value: 205000 });
  assert.deepEqual(logic.parseNumber('205 000', 10), { value: 205000 }, 'a number pasted from the page (non-breaking space)');
  assert.deepEqual(logic.parseNumber('1a', 16), { value: 26 });
  assert.deepEqual(logic.parseNumber('12', 2), { error: 'digit', at: '2' });
  assert.deepEqual(logic.parseNumber('1g', 16), { error: 'digit', at: 'G' });
  assert.equal(logic.parseNumber('1000001', 10).error, 'max');
  assert.deepEqual(logic.parseNumber('1000000', 10), { value: 1000000 });
  assert.equal(logic.parseNumber('  ', 10).error, 'empty');
  assert.equal(logic.parseNumber('000', 10).error, 'zero');
});

test('other bases: the limit, the mistakes, the moves and the diff use the base, not 10', () => {
  // rule 5 in base 16: 100000 · 16 = 1 600 000 is over; · 2 in base 2 is not
  assert.equal(logic.statusOf(100000, 16, 'm1'), 'over');
  assert.equal(logic.statusOf(100000, 2, 'm1'), 'ok');
  // few: 11 · 100₂ (· 4) one move too few is 10110₂ (22)
  const f = logic.mistakeOf(P({ n: 11, op: 'm2', base: 2 }), 'few');
  assert.deepEqual([f.wrongText, f.rightText, f.wrong], ['10110', '101100', 22]);
  assert.deepEqual(f.diff, [1, 3, 4, 5]);   // 101100 vs 10110: place 2 holds a 1 in both
  // middle in base 8: 1010₈ : 10₈ crosses the first 0 → 110₈, right 101₈
  const m = logic.mistakeOf(P({ n: 0o1010, op: 'd1', base: 8 }), 'middle');
  assert.deepEqual([m.wrongText, m.rightText], ['110', '101']);
  assert.deepEqual(m.diff, [0, 1]);
  // moves in base 16: 1A · 100₁₆ → 1 to place 3, A to place 2
  assert.deepEqual(logic.movesOf(P({ n: 26, op: 'm2', base: 16 })), [{ d: 1, from: 1, to: 3 }, { d: 10, from: 0, to: 2 }]);
});

test('diff counts a digit the wrong result has and the right one lacks (340 : 10, few: 340 vs 34)', () => {
  const m = logic.mistakeOf(P({ n: 340, op: 'd1' }), 'few');
  assert.deepEqual([m.wrongText, m.rightText], ['340', '34']);
  assert.deepEqual(m.diff, [0, 1, 2]);
});

// ── presets: expected numbers from the independent script (SPEC "Presets") ──

test('presets', () => {
  const pr = Object.fromEntries(logic.PRESETS.map((x) => [x.id, x.params]));
  const expect = {
    ten: [['34', '340'], 2, null], hundred: [['47', '470', '4700'], 3, null],
    thousand: [['205', '2050', '20500', '205000'], 4, null], divide: [['3040', '304'], 2, null],
    'two-zeros': [['3470', '347', '34'], 2, 'stop'], 'base-2': [['1011', '10110', '101100'], 3, null]
  };
  for (const [id, [rows, steps, fail]] of Object.entries(expect)) {
    assert.deepEqual(rowsOf(pr[id]), rows, id);
    assert.equal(stepsOf(pr[id]), steps, id);
    assert.equal(logic.demoOf(P(pr[id])).fail, fail, id);
  }
  assert.deepEqual(logic.demoOf(P(pr['base-2'])).rows.map((r) => r.value), [11, 22, 44]);
  assert.equal(logic.mistakeOf(P(pr.hundred)).wrongText, '470');
  assert.equal(logic.mistakeOf(P(pr.divide)).wrongText, '340');
  assert.deepEqual(outsOf(pr['two-zeros']), [null, 0, 7]);
  assert.equal(logic.PRESETS.length, 6);
  assert.deepEqual(logic.PRESETS.map((x) => x.params.mistake), ['none', 'few', 'none', 'middle', 'none', 'none']);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const s of run({ n: 205, op: 'm3' })) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of [{ n: 205, op: 'm3' }, { n: 3040, op: 'd2' }, { n: 2000, op: 'm3' }]) {
    const p = P(over);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    const steps = logic.steps(p);
    for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ n: 205, op: 'm3' });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('the page and sim.json agree with the model (steps of the default, preset params)', () => {
  const fs = require('node:fs'), path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps is the default demo');
  assert.equal(json.steps, meta.steps);
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
  for (const e of json.entries || []) assert.ok(logic.PRESETS.some((pr) => pr.id === e.preset), e.preset);
});
