// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for dat-charts' model: SPEC.md, rules 1–13, tie-breaks first. Run: node --test sims/dat-charts/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const C = logic.charts;
const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
const DS = (ds, over) => P(Object.assign({ ds }, logic.startParams(ds), over));

// ── tie-breaks first ──

test('rule 8 tie-break: a tie for the most lists every tied category in table order', () => {
  // after 11 ballots: 4, 2, 4, 1
  const a = C.answer([4, 2, 4, 1], 'most');
  assert.equal(a.kind, 'tie');
  assert.deepEqual(a.idx, [0, 2]);
  assert.equal(a.value, 4);
  const l = C.answer([3, 1, 5, 1], 'least');
  assert.equal(l.kind, 'tie');
  assert.deepEqual(l.idx, [1, 3]);
});

test('rule 8 tie-break: "more" takes the first biggest and the first smallest in table order', () => {
  const a = C.answer([4, 2, 4, 2], 'more');
  assert.equal(a.kind, 'diff');
  assert.equal(a.a, 0);
  assert.equal(a.b, 1);
  assert.equal(a.value, 2);
});

test('rule 8 tie-break: all counts equal is "all" for most and least, "equal" (0) for more', () => {
  assert.equal(C.answer([3, 3, 3], 'most').kind, 'all');
  assert.deepEqual(C.answer([3, 3, 3], 'least').idx, [0, 1, 2]);
  const m = C.answer([3, 3, 3], 'more');
  assert.equal(m.kind, 'equal');
  assert.equal(m.value, 0);
});

test('rule 8 tie-break: every count 0 has no answer; "none" asks nothing', () => {
  for (const q of logic.QUESTIONS) assert.equal(C.answer([0, 0, 0, 0], q).kind, 'empty');
  assert.equal(C.answer([1, 2], 'none'), null);
  // a single non-zero count among zeros: the zeros are the least, together
  assert.deepEqual(C.answer([0, 5, 0], 'least').idx, [0, 2]);
});

test('rule 5 tie-break: the asked key if it fits, else the smallest bigger that fits, else the biggest that fits', () => {
  const books = [15, 25, 10, 30, 20];
  assert.equal(C.keyFor(books, 5), 5);
  assert.equal(C.keyFor(books, 10), 10);
  assert.equal(C.keyFor(books, 1), 5);
  assert.equal(C.keyFor(books, 2), 5);
  // a key that fits but is not exact is kept
  assert.equal(C.keyFor([8, 12, 7, 3], 5), 5);
  // nothing bigger fits (a made-up limit case): the biggest that fits; here 10 always fits up to 30
  assert.equal(C.keyFor([30], 10), 10);
  assert.equal(S({ ds: 'books', c0: 15, c1: 25, c2: 10, c3: 30, c4: 20, k: 1 }).k, 5);
  assert.equal(S({ ds: 'books', c0: 15, c1: 25, c2: 10, c3: 30, c4: 20, k: 1 }).keyMoved, true);
});

test('rule 5: a key fits when the biggest count needs at most 12 pictures (12 fits with 1, 13 does not)', () => {
  assert.equal(logic.PIC_MAX, 12);
  assert.equal(C.fits([12], 1), true);
  assert.equal(C.fits([13], 1), false);
  assert.equal(C.fits([24], 2), true);
  assert.equal(C.fits([25], 2), false);
  // raising a count to 13 with key 1 moves the key to 2
  const r = logic.change(P({ ds: 'weather', c0: 8, c1: 12, c2: 7, c3: 3, k: 1 }), 1, 1);
  assert.deepEqual(r.patch, { c1: 13 });
  assert.equal(S({ ds: 'weather', c0: 8, c1: 13, c2: 7, c3: 3, k: 1 }).k, 2);
});

test('rule 4 tie-break: a rest of exactly half the key is a half, any other rest a part', () => {
  assert.deepEqual(C.pictures(7, 2), { whole: 3, rest: 1, part: 'half' });
  assert.deepEqual(C.pictures(15, 10), { whole: 1, rest: 5, part: 'half' });
  assert.deepEqual(C.pictures(8, 5), { whole: 1, rest: 3, part: 'part' });
  assert.deepEqual(C.pictures(12, 5), { whole: 2, rest: 2, part: 'part' });
  assert.deepEqual(C.pictures(6, 2), { whole: 3, rest: 0, part: 'none' });
  // key 1: never a rest; key 5: a half would be 2 and a half, never a whole count
  for (let v = 0; v <= 30; v++) {
    assert.equal(C.pictures(v, 1).part, 'none');
    assert.notEqual(C.pictures(v, 5).part, 'half');
  }
  assert.deepEqual(C.pictures(0, 2), { whole: 0, rest: 0, part: 'none' });
});

test('rule 1 tie-break: a missing count takes the data set\'s start, a present non-number is 0; out of range clamps', () => {
  const s = logic.initial({ ds: 'books' });
  assert.deepEqual(s.counts, [15, 25, 10, 30, 20]);
  assert.deepEqual(logic.initial({ ds: 'books', c0: 'x', c1: 40, c2: -3, c3: 2.6 }).counts, [0, 30, 0, 3, 20]);
  const d = S({ ds: 'nope', k: 3, q: 'why', sel: 9, n: 99 });
  assert.equal(d.ds, 'fruit');
  assert.equal(d.k, 1);
  assert.equal(d.q, 'none');
  assert.equal(d.sel, 3);
  assert.equal(d.n, 20);
  assert.equal(S({ sel: 'x' }).sel, -1);
  assert.equal(S({ sel: -5 }).sel, -1);
});

// ── the rules in order ──

test('rule 2: one count per category feeds the table, the tally, the pictogram and the bar', () => {
  const s = S({ ds: 'weather', c0: 8, c1: 12, c2: 7, c3: 3, k: 2 });
  assert.deepEqual(s.counts, [8, 12, 7, 3]);
  assert.equal(s.tally.length, 4);
  assert.equal(s.pictures.length, 4);
  // change one count: every view follows
  const t = S({ ds: 'weather', c0: 9, c1: 12, c2: 7, c3: 3, k: 2 });
  assert.deepEqual(t.tally[0], { fives: 1, ones: 4 });
  assert.deepEqual(t.pictures[0], { whole: 4, rest: 1, part: 'half' });
  assert.equal(t.total, 31);
});

test('rule 3: the tally is groups of five and single strokes; measured data has none', () => {
  assert.deepEqual(C.tally(8), { fives: 1, ones: 3 });
  assert.deepEqual(C.tally(12), { fives: 2, ones: 2 });
  assert.deepEqual(C.tally(5), { fives: 1, ones: 0 });
  assert.deepEqual(C.tally(0), { fives: 0, ones: 0 });
  assert.deepEqual(C.tally(30), { fives: 6, ones: 0 });
  assert.equal(S({ ds: 'snow' }).tally, null);
  assert.equal(S({ ds: 'snow' }).measured, true);
});

test('rule 4: pictogram rows of the presets; read back as whole · k plus half of k', () => {
  const w = S(logic.PRESETS.find((x) => x.id === 'key2').params);
  assert.deepEqual(w.pictures.map((x) => [x.whole, x.part]), [[4, 'none'], [6, 'none'], [3, 'half'], [1, 'half']]);
  assert.equal(w.exact, true);
  assert.equal(w.hasHalf, true);
  // read back: 3 · 2 + 1 = 7
  const back = (x, k) => x.whole * k + (x.part === 'half' ? k / 2 : 0);
  assert.deepEqual(w.pictures.map((x) => back(x, 2)), [8, 12, 7, 3]);
  const b10 = S({ ds: 'books', c0: 15, c1: 25, c2: 10, c3: 30, c4: 20, k: 10 });
  assert.deepEqual(b10.pictures.map((x) => [x.whole, x.part]), [[1, 'half'], [2, 'half'], [1, 'none'], [3, 'none'], [2, 'none']]);
  const b5 = S({ ds: 'books', c0: 15, c1: 25, c2: 10, c3: 30, c4: 20, k: 5 });
  assert.deepEqual(b5.pictures.map((x) => x.whole), [3, 5, 2, 6, 4]);
  assert.equal(b5.hasHalf, false);
});

test('rule 4/5: not exact with key 5 for the weather, and the exact keys that fit are named', () => {
  const s = S(logic.PRESETS.find((x) => x.id === 'misfit').params);
  assert.equal(s.k, 5);
  assert.equal(s.exact, false);
  assert.deepEqual(s.pictures[0], { whole: 1, rest: 3, part: 'part' });
  assert.deepEqual(s.exactKeys, [1, 2]);
  assert.deepEqual(S({ ds: 'fruit', k: 10 }).exactKeys, [1, 2]);
  assert.deepEqual(S({ ds: 'books', c0: 15, c1: 25, c2: 10, c3: 30, c4: 20 }).exactKeys, [5, 10]);
  const keys = S({ ds: 'books', c0: 15, c1: 25, c2: 10, c3: 30, c4: 20 }).keys;
  assert.deepEqual(keys.map((x) => x.fits), [false, false, true, true]);
});

test('rule 6: the number axis is 0 … 10 by 1, 0 … 20 by 2 or 0 … 30 by 5', () => {
  assert.deepEqual(C.axis([6, 4, 8, 2]), { top: 10, step: 1 });
  assert.deepEqual(C.axis([10]), { top: 10, step: 1 });
  assert.deepEqual(C.axis([11]), { top: 20, step: 2 });
  assert.deepEqual(C.axis([8, 12, 7, 3]), { top: 20, step: 2 });
  assert.deepEqual(C.axis([20]), { top: 20, step: 2 });
  assert.deepEqual(C.axis([21]), { top: 30, step: 5 });
  assert.deepEqual(C.axis([15, 25, 10, 30, 20]), { top: 30, step: 5 });
  assert.deepEqual(C.axis([0, 0]), { top: 10, step: 1 });
});

test('rule 7: the questions, in order; measured data is not added up', () => {
  assert.deepEqual(S({ ds: 'fruit' }).questions, ['most', 'least', 'more', 'total']);
  assert.deepEqual(S({ ds: 'snow' }).questions, ['most', 'least', 'more']);
  assert.equal(S({ ds: 'snow', q: 'total' }).q, 'none');
  assert.equal(S({ ds: 'snow', q: 'total' }).answer, null);
});

test('rule 8: the answers of every data set', () => {
  const ans = (ds, q) => logic.initial(DS(ds, { q })).answer;
  assert.deepEqual([ans('fruit', 'most').idx, ans('fruit', 'most').value], [[2], 8]);
  assert.deepEqual([ans('fruit', 'least').idx, ans('fruit', 'least').value], [[3], 2]);
  assert.deepEqual([ans('fruit', 'more').a, ans('fruit', 'more').b, ans('fruit', 'more').value], [2, 3, 6]);
  assert.equal(ans('fruit', 'total').value, 20);
  assert.deepEqual([ans('weather', 'most').idx, ans('weather', 'least').idx, ans('weather', 'more').value, ans('weather', 'total').value], [[1], [3], 9, 30]);
  assert.deepEqual([ans('books', 'most').idx, ans('books', 'least').idx, ans('books', 'more').value, ans('books', 'total').value], [[3], [2], 20, 100]);
  assert.deepEqual([ans('snow', 'most').idx, ans('snow', 'least').idx, ans('snow', 'more').value], [[3], [0], 10]);
  assert.equal(ans('snow', 'most').kind, 'one');
});

test('rule 9: the selected row is cleaned to the data set\'s rows', () => {
  assert.equal(S({ ds: 'snow', sel: 6 }).sel, 6);
  assert.equal(S({ ds: 'fruit', sel: 6 }).sel, 3);
  assert.equal(S({ ds: 'fruit', sel: -1 }).sel, -1);
});

test('rule 10: + and − change one count; refused at 30 and at 0, params unchanged', () => {
  assert.deepEqual(logic.change(P({ ds: 'fruit' }), 2, 1).patch, { c2: 9 });
  assert.deepEqual(logic.change(P({ ds: 'fruit' }), 3, -1).patch, { c3: 1 });
  const lo = logic.change(P({ ds: 'fruit', c3: 0 }), 3, -1);
  assert.equal(lo.refused, 'limit');
  assert.deepEqual(lo.patch, {});
  const hi = logic.change(P({ ds: 'fruit', c0: 30 }), 0, 1);
  assert.equal(hi.refused, 'limit');
  assert.deepEqual(hi.patch, {});
  assert.equal(logic.change(P({ ds: 'fruit' }), 4, 1).refused, 'row');
});

test('rule 11: counting the ballots one by one: jabuka leads after 9, two lead after 11, 6 4 8 2 after 20', () => {
  let p = P(logic.PRESETS.find((x) => x.id === 'vote').params);
  assert.deepEqual(logic.initial(p).counts, [0, 0, 0, 0]);
  const after = {};
  for (let i = 1; i <= 20; i++) {
    const r = logic.countBallot(p);
    assert.equal(r.refused, null);
    assert.equal(r.to, r.from + 1);
    p = Object.assign({}, p, r.patch);
    after[i] = logic.initial(p);
  }
  assert.deepEqual(after[9].counts, [4, 2, 2, 1]);
  assert.deepEqual(after[9].answer, null);
  assert.deepEqual(C.answer(after[9].counts, 'most').idx, [0]);
  assert.deepEqual(after[11].counts, [4, 2, 4, 1]);
  assert.equal(C.answer(after[11].counts, 'most').kind, 'tie');
  assert.deepEqual(after[20].counts, [6, 4, 8, 2]);
  assert.equal(after[20].n, 20);
  assert.equal(after[20].next, -1);
  const done = logic.countBallot(p);
  assert.equal(done.refused, 'done');
  assert.deepEqual(done.patch, {});
  assert.equal(logic.countAll(p).refused, 'done');
});

test('rule 11: count all counts the rest; start again empties; counting follows the pile after + or −', () => {
  const p = P({ ds: 'fruit', c0: 4, c1: 2, c2: 2, c3: 1, n: 9 });
  assert.equal(logic.initial(p).next, 2);
  assert.deepEqual(logic.countAll(p).patch, { n: 20, c0: 6, c1: 4, c2: 8, c3: 2 });
  assert.deepEqual(logic.restart(p), { n: 0, c0: 0, c1: 0, c2: 0, c3: 0 });
  // after + on banana the next ballot still goes where the pile says
  const q = P({ ds: 'fruit', c0: 4, c1: 3, c2: 2, c3: 1, n: 9 });
  assert.deepEqual(logic.countBallot(q).patch, { n: 10, c2: 3 });
  // a category at 30 refuses its ballot
  const full = logic.countBallot(P({ ds: 'fruit', c0: 30, n: 0 }));
  assert.equal(full.refused, 'limit');
  // count all stops before a category would pass 30: nothing dropped
  const at29 = logic.countAll(P({ ds: 'fruit', c0: 0, c1: 0, c2: 29, c3: 0, n: 0 }));
  assert.equal(at29.refused, 'limit');
  assert.deepEqual(at29.patch, { n: 6, c0: 3, c1: 1, c2: 30, c3: 1 });
  const stuck = logic.countAll(P({ ds: 'fruit', c0: 30, n: 0 }));
  assert.equal(stuck.refused, 'limit');
  assert.deepEqual(stuck.patch, {});
  // other data sets have no ballots
  assert.equal(logic.countBallot(DS('weather')).refused, 'none');
  assert.equal(S({ ds: 'weather' }).ballots, null);
  assert.equal(S({ ds: 'weather', n: 5 }).n, 0);
});

test('rule 11: the ballots add up to the starting counts of fruit', () => {
  const d = logic.DATA.fruit, c = [0, 0, 0, 0];
  for (const b of d.ballots) c[b]++;
  assert.deepEqual(c, d.counts);
  assert.equal(d.ballots.length, 20);
});

test('rule 12: ask first is a plain flag; the answer is still computed', () => {
  const s = S(logic.PRESETS.find((x) => x.id === 'most').params);
  assert.equal(s.hide, true);
  assert.deepEqual(s.answer.idx, [2]);
  assert.equal(S({ hide: 'yes' }).hide, false);
});

test('presets: the expected numbers of SPEC, Presets', () => {
  const pr = (id) => S(logic.PRESETS.find((x) => x.id === id).params);
  assert.equal(pr('vote').total, 0);
  assert.equal(pr('vote').n, 0);
  assert.equal(pr('most').answer.value, 8);
  assert.equal(pr('key5').answer.value, 20);
  assert.deepEqual([pr('key5').answer.a, pr('key5').answer.b], [3, 2]);
  assert.equal(pr('snow').answer.value, 10);
  assert.equal(pr('snow').tally, null);
  assert.deepEqual(pr('snow').axis, { top: 20, step: 2 });
  assert.equal(pr('misfit').exact, false);
  assert.equal(logic.PRESETS.length, 6);
});

test('startParams: every count of the data set, the rest 0, the pile counted, nothing selected', () => {
  assert.deepEqual(logic.startParams('books'), { c0: 15, c1: 25, c2: 10, c3: 30, c4: 20, c5: 0, c6: 0, n: 0, sel: -1 });
  assert.deepEqual(logic.startParams('fruit'), { c0: 6, c1: 4, c2: 8, c3: 2, c4: 0, c5: 0, c6: 0, n: 20, sel: -1 });
  for (const ds of logic.DS_IDS) assert.ok(logic.DATA[ds].cats.length <= logic.CATS_MAX, ds);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe in every data set and preset', () => {
  for (const pr of logic.PRESETS) {
    const s = logic.initial(P(pr.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
  for (const ds of logic.DS_IDS) {
    const s = logic.initial(DS(ds, { q: 'more', sel: 1 }));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  for (const pr of logic.PRESETS) {
    const p = P(pr.params), copy = structuredClone(p);
    assert.deepEqual(logic.initial(p), logic.initial(p));
    logic.change(p, 0, 1); logic.countBallot(p); logic.countAll(p); logic.restart(p);
    assert.deepEqual(p, copy);
  }
});

test('an explorer: no steps', () => {
  assert.equal(logic.steps, undefined);
  assert.equal(kit.stepsOf(logic, P()), 0);
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
  for (const ds of logic.DS_IDS) {
    for (const k of ['ds_', 'title_', 'axisC_', 'axisN_', 'colC_', 'u_', 'pic_']) assert.ok(strings.hr[k + ds] && strings.en[k + ds], k + ds);
    for (const c of logic.DATA[ds].cats) for (const k of ['cat_', 'cn_', 'qn_']) assert.ok(strings.hr[k + c] && strings.en[k + c], k + c);
    for (const q of logic.QUESTIONS) if (!(ds === 'snow' && q === 'total')) assert.ok(strings.hr['q_' + q + '_' + ds] && strings.en['q_' + q + '_' + ds], q + ds);
  }
  for (const pr of logic.PRESETS) assert.ok(strings.hr['p_' + pr.id] && strings.hr['ph_' + pr.id], pr.id);
});

test('every preset param is a model param; the page and sim.json agree with the model', () => {
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  const ids = logic.PRESETS.map((x) => x.id);
  for (const e of sim.entries) assert.ok(ids.includes(e.preset), e.preset);
});
