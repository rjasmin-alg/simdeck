// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ari-order-of-operations (SPEC.md). Tie-breaks first, then the rules, then the generic block.
// Run: node --test sims/ari-order-of-operations/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = logic.SIGN;
/** The order as "a op b = v" strings. */
const order = (text, opts) => {
  const A = opts && opts.flat ? logic.planOf(logic.parse(text, opts)) : logic.analyse(text);
  assert.ok(opts && opts.flat ? true : A.ok, `${text}: ${A.error}`);
  return A.order.map((o) => `${o.a} ${S[o.op]} ${o.b} = ${o.v}`);
};
const valueOf = (text) => logic.analyse(text).value;
const presetExpr = (id) => logic.PRESETS.find((p) => p.id === id).params.expr;

// ── tie-breaks ──

test('tie-break 1: of two innermost brackets, the left one first', () => {
  assert.deepEqual(order('(36 + 14) : (12 − 7)'), ['36 + 14 = 50', '12 − 7 = 5', '50 : 5 = 10']);
  assert.deepEqual(order('(2 · 3) + (8 : 4)'), ['2 · 3 = 6', '8 : 4 = 2', '6 + 2 = 8']);
  const first = logic.analyse('(36 + 14) : (12 − 7)').order;
  assert.equal(first[0].brackets, 2, 'two brackets waited');
  assert.equal(first[1].brackets, 1);
});

test('tie-break 2: · and : are one rank, the leftmost first (24 : 4 · 2 = 12, not 3)', () => {
  assert.deepEqual(order('24 : 4 · 2'), ['24 : 4 = 6', '6 · 2 = 12']);
  assert.deepEqual(order('8 · 6 : 4'), ['8 · 6 = 48', '48 : 4 = 12']);
});

test('tie-break 2: + and − are one rank, the leftmost first (543 − 423 + 28 = 148, not 92)', () => {
  assert.deepEqual(order('543 − 423 + 28'), ['543 − 423 = 120', '120 + 28 = 148']);
  assert.deepEqual(order('60 − 20 − 10'), ['60 − 20 = 40', '40 − 10 = 30']);
  assert.deepEqual(order('5 + 9 − 3'), ['5 + 9 = 14', '14 − 3 = 11']);
});

test('tie-break: nested brackets, the innermost first', () => {
  assert.deepEqual(order('((3 + 4) · 2 − 4) : 5'), ['3 + 4 = 7', '7 · 2 = 14', '14 − 4 = 10', '10 : 5 = 2']);
});

// ── rule 1: brackets first ──

test('rule 1: the bracket before everything else (543 − (423 + 28) = 92)', () => {
  assert.deepEqual(order('543 − (423 + 28)'), ['423 + 28 = 451', '543 − 451 = 92']);
  assert.deepEqual(order('(6 + 4) · 3'), ['6 + 4 = 10', '10 · 3 = 30']);
  const o = logic.analyse('543 − (423 + 28)').order;
  assert.notEqual(o[0].group, null, 'picked in a bracket');
  assert.equal(o[1].group, null, 'then in the whole expression');
});

test('rule 1: inside a bracket rules 2 and 3 hold too', () => {
  assert.deepEqual(order('2 · (3 + 4 · 5)'), ['4 · 5 = 20', '3 + 20 = 23', '2 · 23 = 46']);
});

// ── rule 2: · and : before + and − ──

test('rule 2: · before the + to its left (6 + 4 · 3 = 18)', () => {
  assert.deepEqual(order('6 + 4 · 3'), ['4 · 3 = 12', '6 + 12 = 18']);
  const o = logic.analyse('6 + 4 · 3').order[0];
  assert.equal(o.rank, 'mul');
  assert.equal(o.skipped, true, 'the + to the left was passed over');
  assert.equal(logic.analyse('4 · 3 + 6').order[0].skipped, false);
  assert.equal(logic.analyse('4 · 3 + 6').order[0].waits, true, 'the + to the right waits');
  assert.equal(logic.analyse('4 · 3 + 6').order[1].waits, false);
  assert.equal(logic.analyse('2 · (3 + 4)').order[0].waits, false, 'the · outside the bracket is not in its group');
});

test('rule 2 and 3 together: the curriculum-sized example', () => {
  assert.deepEqual(order(presetExpr('everything')),
    ['12 + 8 = 20', '20 · 4 = 80', '30 : 5 = 6', '100 − 80 = 20', '20 + 6 = 26']);
});

// ── rule 3 shown: the other order is a bracketed expression ──

test('rule 3: the other order of a left-to-right pick is that expression with brackets, and its value', () => {
  const A = logic.analyse('543 − 423 + 28');
  assert.equal(A.order[0].nextSame, true);
  const x = logic.otherOrderOf(A, 0);
  assert.equal(x.text, '543 − (423 + 28)');
  assert.equal(x.value, 92);
  const B = logic.analyse('24 : 4 · 2');
  assert.deepEqual([logic.otherOrderOf(B, 0).text, logic.otherOrderOf(B, 0).value], ['24 : (4 · 2)', 3]);
  // a same-rank operation further right but not next to it: no other order to show
  const C = logic.analyse('6 · 2 + 3 · 4');
  assert.equal(C.order[0].ltr, true);
  assert.equal(C.order[0].nextSame, false);
  assert.equal(logic.otherOrderOf(C, 0), null);
  // the other order that cannot be done in whole numbers says so
  const D = logic.analyse('20 − 5 − 9');
  assert.deepEqual([logic.otherOrderOf(D, 0).text, logic.otherOrderOf(D, 0).value], ['20 − (5 − 9)', null]);
  assert.equal(logic.otherOrderOf(D, 0).error, 'negative');
  assert.deepEqual(logic.otherOrderOf(D, 0).fail, { error: 'negative', a: 5, op: '-', b: 9, at: 0 }, 'the operation that fails');
});

// ── rule 4: whole numbers ──

test('rule 4: below zero, a remainder, division by zero and too big are refused, with the operation', () => {
  assert.deepEqual(pick(logic.analyse('3 − 5 + 9')), ['negative', 3, '-', 5]);
  assert.deepEqual(pick(logic.analyse('7 : 2 + 1')), ['notWhole', 7, ':', 2]);
  assert.deepEqual(pick(logic.analyse('7 : (2 − 2)')), ['zero', 7, ':', 0]);
  assert.deepEqual(pick(logic.analyse('999 · 999 + 1')), ['big', 999, '*', 999]);
  // the order decides: 3 − 5 + 9 is refused, 3 + 9 − 5 is fine, and (3 + 9) − 5 too
  assert.equal(valueOf('3 + 9 − 5'), 7);
  assert.equal(logic.analyse('99999 + 0').ok, false, 'numbers have at most 4 digits');
  assert.equal(valueOf('9999 · 10'), 99990);
  function pick(A) { return [A.error, A.a, A.op, A.b]; }
});

test('rule 4: the text: signs typed several ways, and the errors with their place', () => {
  assert.equal(logic.canonical('6+4*3'), '6 + 4 · 3');
  assert.equal(logic.canonical('6 + 4x3'), '6 + 4 · 3');
  assert.equal(logic.canonical('24/4×2'), '24 : 4 · 2');
  assert.equal(logic.canonical('543-(423+28)'), '543 − (423 + 28)');
  assert.equal(logic.canonical('007 + 1'), '7 + 1');
  assert.equal(logic.parse('00001 + 1').error, 'long', 'digits are counted as typed');
  const err = (t) => { const r = logic.parse(t); return [r.error, r.at]; };
  assert.deepEqual(err(''), ['empty', 0]);
  assert.deepEqual(err('3 + a'), ['char', 5]);
  assert.deepEqual(err('12345 + 1'), ['long', 1]);
  assert.deepEqual(err('3 +'), ['number', 0]);
  assert.deepEqual(err('3 4'), ['sign', 3]);
  assert.deepEqual(err('2(3 + 4)'), ['sign', 2]);
  assert.deepEqual(err('3 + (4'), ['open', 5]);
  assert.deepEqual(err('3 + 4)'), ['close', 6]);
  assert.deepEqual(err('(3) + 4'), ['lone', 1]);
  assert.deepEqual(err('5'), ['single', 0]);
  assert.deepEqual(err('1+2+3+4+5+6+7+8'), ['many', 0]);
  assert.equal(logic.parse('1+2+3+4+5+6+7').ok, true, 'seven numbers are fine');
});

// ── rule 5: steps ──

test('rule 5: two steps per operation, pick then do', () => {
  assert.equal(logic.steps(P()), 4);
  assert.equal(logic.steps(P({ expr: presetExpr('two-brackets') })), 6);
  assert.equal(logic.steps(P({ expr: presetExpr('everything') })), 10);
  assert.equal(logic.steps(P({ expr: '1+2+3+4+5+6+7' })), 12);
  const p = P({ expr: '6 + 4 · 3' });
  const A = logic.analyse(p.expr);
  const run = [0, 1, 2, 3, 4].map((n) => kit.stateAt(logic, p, n));
  assert.deepEqual(run.map((s) => [s.phase, s.k, s.cur]),
    [['start', 0, null], ['pick', 0, A.order[0].id], ['do', 1, A.order[0].id], ['pick', 1, A.order[1].id], ['do', 2, A.order[1].id]]);
});

test('rule 5: the written form after each operation; a bracket goes when its inside is one number', () => {
  const A = logic.analyse('100 − (12 + 8) · 4 + 30 : 5');
  const lines = [0, 1, 2, 3, 4, 5].map((k) => logic.textOf(logic.writtenAt(A, k)));
  assert.deepEqual(lines, ['100 − (12 + 8) · 4 + 30 : 5', '100 − 20 · 4 + 30 : 5', '100 − 80 + 30 : 5', '100 − 80 + 6',
    '20 + 6', '26']);
  const B = logic.analyse('((3 + 4) · 2 − 4) : 5');
  assert.deepEqual([1, 2].map((k) => logic.textOf(logic.writtenAt(B, k))), ['(7 · 2 − 4) : 5', '(14 − 4) : 5']);
});

test('rule 5: a bad text in the params falls back to the default expression', () => {
  assert.equal(logic.steps(P({ expr: '7 : 2' })), 4);
  assert.equal(logic.planFor(P({ expr: 'abc' })).value, 92);
});

// ── rule 6: without the brackets ──

test('rule 6: the same text without brackets: another result, the same order, or not possible', () => {
  assert.deepEqual(pickW(logic.withoutBrackets('543 − (423 + 28)')), ['543 − 423 + 28', 148, false]);
  assert.deepEqual(pickW(logic.withoutBrackets('6 + (4 · 3)')), ['6 + 4 · 3', 18, true]);
  assert.deepEqual(pickW(logic.withoutBrackets('(36 + 14) : (12 − 7)')), ['36 + 14 : 12 − 7', null, false]);
  assert.equal(logic.withoutBrackets('(36 + 14) : (12 − 7)').error, 'notWhole');
  assert.deepEqual(logic.withoutBrackets('(36 + 14) : (12 − 7)').fail, { error: 'notWhole', a: 14, op: ':', b: 12, at: 0 });
  assert.equal(logic.withoutBrackets('(10 − 9) · 9999 · 10').fail.error, 'big', 'too big is its own reason');
  assert.equal(logic.withoutBrackets('100 − (12 + 8) · 4 + 30 : 5').value, 126);
  assert.equal(logic.withoutBrackets('6 + 4 · 3'), null, 'no brackets: nothing to compare');
  function pickW(w) { return [w.text, w.value, w.same]; }
});

// ── rule 7: moving the brackets ──

test('rule 7: every place for one pair of brackets, 2 to 4 numbers', () => {
  const o = logic.bracketOptions('543 − 423 + 28');
  assert.deepEqual(o.map((x) => [x.text, x.value, x.same]),
    [['543 − 423 + 28', 148, true], ['(543 − 423) + 28', 148, true], ['543 − (423 + 28)', 92, false]]);
  const q = logic.bracketOptions('6 + 4 · 3');
  assert.deepEqual(q.map((x) => [x.text, x.value, x.same]),
    [['6 + 4 · 3', 18, true], ['(6 + 4) · 3', 30, false], ['6 + (4 · 3)', 18, true]]);
  assert.equal(logic.bracketOptions('(36 + 14) : (12 − 7)').length, 6, '4 numbers: none and 5 pairs');
  const bad = logic.bracketOptions('(36 + 14) : (12 − 7)').find((x) => x.i === -1);
  assert.deepEqual([bad.ok, bad.error, bad.a, bad.op, bad.b], [false, 'notWhole', 14, ':', 12], 'the failing operation');
  const q2 = logic.bracketOptions('2 + 6 : 3').find((x) => x.i === 0 && x.j === 1);
  assert.deepEqual([q2.text, q2.error, q2.a, q2.b], ['(2 + 6) : 3', 'notWhole', 8, 3]);
  assert.equal(logic.bracketOptions('1 + 2 + 3 + 4 + 5').length, 0, 'five numbers: typed');
  assert.equal(logic.bracketOptions('1 + 2').length, 1, 'two numbers: only none');
});

// ── rule 8: the typical mistake ──

test('rule 8: strictly left to right gives 30 for 6 + 4 · 3', () => {
  const m = logic.mistakeOf('6 + 4 · 3');
  assert.deepEqual([m.value, m.right, m.same], [30, 18, false]);
  assert.deepEqual(order('6 + 4 · 3', { flat: true }), ['6 + 4 = 10', '10 · 3 = 30']);
});

test('rule 8: brackets still first in the mistake; the curriculum example does not show it', () => {
  assert.deepEqual(order('100 − (12 + 8) · 4 + 30 : 5', { flat: true }),
    ['12 + 8 = 20', '100 − 20 = 80', '80 · 4 = 320', '320 + 30 = 350', '350 : 5 = 70']);
  assert.equal(logic.mistakeOf('100 − (12 + 8) · 4 + 30 : 5').value, 70);
  assert.equal(logic.mistakeOf('543 − (423 + 28)').same, true);
  assert.equal(logic.mistakeOf('24 : 4 · 2').same, true);
});

test('rule 8: the mistake can get stuck where the right order does not', () => {
  const m = logic.mistakeOf('2 + 6 : 3');
  assert.equal(logic.analyse('2 + 6 : 3').value, 4);
  assert.deepEqual([m.stuck.a, m.stuck.op, m.stuck.b, m.stuck.error], [8, ':', 3, 'notWhole']);
  assert.equal(m.value, null);
  assert.equal(m.same, false);
});

// ── the presets ──

test('presets: expressions, steps and results as in SPEC.md', () => {
  const want = { brackets: [4, 92], 'no-brackets': [4, 148], 'times-first': [4, 18], 'same-rank': [4, 12],
    'two-brackets': [6, 10], everything: [10, 26] };
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    assert.deepEqual([logic.steps(p), logic.planFor(p).value], want[pr.id], pr.id);
    assert.equal(logic.canonical(pr.params.expr), pr.params.expr, `${pr.id}: written canonically`);
  }
});

test('every pick is ready: its operands are numbers or done (random expressions)', () => {
  const rng = kit.rng(7);
  const ops = ['+', '−', '·', ':'];
  let checked = 0;
  for (let i = 0; i < 400; i++) {
    const n = 2 + rng.int(6);
    let s = '';
    let open = 0;
    for (let k = 0; k < n; k++) {
      if (k < n - 1 && rng.int(4) === 0) { s += '('; open++; }
      s += String(1 + rng.int(30));
      if (open && k > 0 && rng.int(3) === 0) { s += ')'; open--; }
      if (k < n - 1) s += ' ' + ops[rng.int(4)] + ' ';
    }
    s += ')'.repeat(open);
    for (const flat of [false, true]) {
      const tree = logic.parse(s, { flat });
      if (!tree.ok) continue;
      const plan = logic.planOf(tree);
      const done = new Set();
      for (const o of plan.order) {
        const nd = tree.nodes[o.id];
        for (const c of [nd.a, nd.b]) assert.ok(tree.nodes[c].kind === 'num' || done.has(c), `${s}: ${o.id}`);
        done.add(o.id);
        checked++;
      }
      if (!flat && !plan.stuck) {
        // the value agrees with the language's own precedence
        const js = Function('return ' + s.replace(/·/g, '*').replace(/:/g, '/').replace(/−/g, '-'))();
        assert.equal(plan.value, js, s);
      }
    }
  }
  assert.ok(checked > 300);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  const p = P({ expr: presetExpr('everything') });
  for (let n = 0; n <= logic.steps(p); n++) {
    const s = kit.stateAt(logic, p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ expr: presetExpr('everything') });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  const steps = logic.steps(p);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P();
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
