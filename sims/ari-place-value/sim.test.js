// SPDX-License-Identifier: AGPL-3.0-or-later
// Rule tests for ari-place-value (SPEC.md), tie-breaks first, then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const mat = (base, n, counts, over) => P(Object.assign({ base }, logic.paramsFor(n, counts), over));
const blocks = (p) => logic.blocksOf(p).slice(0, 6);

// ── tie-breaks ──

test('rule 3: changing only the base keeps the quantity and regroups it fully', () => {
  // the default 347 in base 10, base switched to 8 by the slider: counts 7,4,3 are worth 7 + 32 + 192 = 231 ≠ 347
  assert.deepEqual(blocks(P({ base: 8 })), [3, 3, 5, 0, 0, 0]);
  assert.equal(logic.initial(P({ base: 8 })).numeral, '533');
  assert.equal(logic.initial(P({ base: 2 })).numeral, '101011011');
  assert.equal(logic.initial(P({ base: 16 })).numeral, '15B');
  // counts not valid in the new base (7 > 2·2 − 1) fall back to the digits of n, even before comparing worth
  assert.deepEqual(blocks(mat(10, 10, [10], { base: 2 })), [0, 1, 0, 1, 0, 0]);
});

test('rule 3: counts valid in the new base and worth the same n are kept (loose units)', () => {
  // 12 loose ones in base 10, switched to base 11: still 12 ones (cap 21), worth 12
  assert.deepEqual(blocks(mat(10, 12, [12], { base: 11 })), [12, 0, 0, 0, 0, 0]);
  // a stale n (counts worth something else) is never shown: the digits of n win
  assert.deepEqual(blocks(mat(10, 33, [13, 3])), [3, 3, 0, 0, 0, 0]);
});

test('squash tie-break: only the highest place full happens to give the right numeral', () => {
  const m = logic.mistakeOf(mat(10, 123, [3, 12]), 'squash');
  assert.equal(m.applies, true);
  assert.equal(m.wrongText, '123');
  assert.equal(m.same, true);
  const m2 = logic.mistakeOf(mat(10, 33, [13, 2]), 'squash');
  assert.equal(m2.wrongText, '213');
  assert.equal(m2.wrongValue, 213);
  assert.equal(m2.same, false);
});

test('decimal tie-break: a one-digit numeral reads the same in base 10', () => {
  const m = logic.mistakeOf(mat(8, 7, [7]), 'decimal');
  assert.equal(m.applies, true);
  assert.equal(m.same, true);
});

// ── rules ──

test('rule 1: a block in place k is worth b^k; the mat is worth the sum', () => {
  assert.equal(logic.valueOf([7, 4, 3], 10), 347);
  assert.equal(logic.valueOf([3, 3, 5], 8), 347);
  assert.equal(logic.valueOf([13, 2], 10), 33);
  assert.equal(logic.valueOf([1, 0, 1, 1], 2), 13);
  assert.equal(logic.valueOf([15, 15], 16), 255);
});

test('rule 2: places per base and the columns shown', () => {
  const want = { 2: 14, 3: 9, 4: 7, 5: 6, 6: 6, 7: 5, 8: 5, 9: 5, 10: 4, 11: 4, 16: 4 };
  for (const [b, k] of Object.entries(want)) assert.equal(logic.placesFor(Number(b)), k, `base ${b}`);
  assert.equal(logic.digitsOf(9999, 2).length, 14);
  // at least four, the places in use and one free place, at most the base's places
  assert.equal(logic.shownPlaces(logic.blocksOf(mat(2, 13, [1, 0, 1, 1])), 2), 5);
  assert.equal(logic.shownPlaces(logic.blocksOf(mat(2, 1, [1])), 2), 4);
  assert.equal(logic.shownPlaces(logic.blocksOf(mat(2, 9999, logic.digitsOf(9999, 2))), 2), 14);
  assert.equal(logic.shownPlaces(logic.blocksOf(P()), 10), 4);
  assert.equal(logic.shownPlaces(logic.blocksOf(mat(3, 6561, logic.digitsOf(6561, 3))), 3), 9);
});

test('rule 4: add a block, refused in the order place, full, max', () => {
  assert.deepEqual(logic.act(P(), 'add', 1).params.c1, 5);
  assert.equal(logic.act(P(), 'add', 1).params.n, 357);
  assert.equal(logic.act(P(), 'add', 4).error, 'place');
  assert.equal(logic.act(mat(10, 19, [19]), 'add', 0).error, 'full');
  assert.equal(logic.act(mat(10, 9999, [9, 9, 9, 9]), 'add', 0).error, 'max');
  assert.equal(logic.act(mat(10, 9990, [0, 9, 9, 9]), 'add', 0).params.n, 9991);
  // full is checked before max (both apply: 19 ones and 9999)
  assert.equal(logic.act(mat(10, 9999, [19, 8, 9, 9]), 'add', 0).error, 'full');
  assert.equal(logic.act(mat(10, 9019, [19, 0, 0, 9]), 'add', 0).error, 'full');
  // reaching 9999 exactly is allowed
  assert.equal(logic.act(mat(10, 9998, [8, 9, 9, 9]), 'add', 0).params.n, 9999);
  assert.equal(logic.act(mat(2, 8192, logic.digitsOf(8192, 2)), 'add', 13).error, 'max');
});

test('rule 5: take a block away; an empty column refuses', () => {
  const r = logic.act(P(), 'remove', 2);
  assert.equal(r.params.n, 247);
  assert.equal(r.params.c2, 2);
  assert.equal(logic.act(P(), 'remove', 3).error, 'empty');
});

test('rule 6: regroup b blocks into one of the next place; the quantity stays', () => {
  const r = logic.act(mat(10, 33, [13, 2]), 'regroup', 0);
  assert.equal(r.params.n, 33);
  assert.deepEqual([r.params.c0, r.params.c1], [3, 3]);
  const r8 = logic.act(mat(8, 8, [8]), 'regroup', 0);
  assert.deepEqual([r8.params.c0, r8.params.c1], [0, 1]);
  assert.equal(logic.numeralOf(logic.blocksOf(P(Object.assign({ base: 8 }, r8.params))), 8), '10');
  assert.equal(logic.act(P(), 'regroup', 0).error, 'few');
  // the next place already holds 2b − 1
  assert.equal(logic.act(mat(10, 200, [10, 19]), 'regroup', 0).error, 'full');
  // exactly b regroups
  assert.equal(logic.act(mat(10, 10, [10]), 'regroup', 0).params.c1, 1);
});

test('rule 7: break one block into b of the place to its right', () => {
  const r = logic.act(P(), 'break', 1);
  assert.deepEqual([r.params.c0, r.params.c1, r.params.n], [17, 3, 347]);
  assert.equal(logic.act(P(), 'break', 0).error, 'ones');
  assert.equal(logic.act(P(), 'break', 3).error, 'empty');
  // the place to the right must hold at most b − 1
  assert.equal(logic.act(mat(10, 33, [13, 2]), 'break', 1).error, 'full');
  assert.equal(logic.act(mat(10, 29, [9, 2]), 'break', 1).params.c0, 19);
  assert.equal(logic.act(mat(10, 30, [10, 2]), 'break', 1).error, 'full', 'b blocks on the right: no room for b more');
});

test('rule 8: a full place cannot be written; leading empty places are not written', () => {
  assert.equal(logic.numeralOf([13, 2], 10), null);
  assert.deepEqual(logic.overOf([13, 2], 10), [0]);
  assert.deepEqual(logic.overOf([10, 9], 10), [0], 'a count equal to the base is full');
  assert.equal(logic.numeralOf([7, 0, 3, 0, 0], 10), '307');
  assert.equal(logic.numeralOf([0, 0, 0], 10), '0');
  assert.equal(logic.numeralOf([11, 10], 16), 'AB');
});

test('rule 9: regroup all writes the digits of n', () => {
  const r = logic.regroupAll(mat(10, 33, [13, 2]));
  assert.deepEqual([r.c0, r.c1, r.n], [3, 3, 33]);
});

test('rule 10: the same quantity in base 10, 2, 8 and 16, the current base first', () => {
  assert.deepEqual(logic.basesOf(347, 10).map((x) => x.text), ['347', '101011011', '533', '15B']);
  assert.deepEqual(logic.basesOf(9999, 10).map((x) => x.text), ['9999', '10011100001111', '23417', '270F']);
  assert.deepEqual(logic.basesOf(307, 10).map((x) => x.text), ['307', '100110011', '463', '133']);
  assert.deepEqual(logic.basesOf(33, 10).map((x) => x.text), ['33', '100001', '41', '21']);
  assert.deepEqual(logic.basesOf(8, 5).map((x) => [x.base, x.text, x.current]),
    [[5, '13', true], [10, '8', false], [2, '1000', false], [8, '10', false], [16, '8', false]]);
});

test('rule 11: the expansion runs from the highest place to the ones and sums to n', () => {
  const e = logic.expansionOf([7, 0, 3, 0], 10);
  assert.deepEqual(e.map((x) => [x.d, x.pv, x.worth]), [[3, 100, 300], [0, 10, 0], [7, 1, 7]]);
  const e8 = logic.expansionOf([3, 3, 5], 8);
  assert.deepEqual(e8.map((x) => x.worth), [320, 24, 3]);
  assert.equal(logic.expansionOf([0], 10).length, 1);
});

test('mistakes: squash, zero, decimal and why they do not apply', () => {
  assert.equal(logic.mistakeOf(P(), 'squash').reason, 'nofull');
  const z = logic.mistakeOf(mat(10, 307, [7, 0, 3]), 'zero');
  assert.deepEqual([z.applies, z.wrongText, z.wrongValue], [true, '37', 37]);
  assert.equal(logic.mistakeOf(P(), 'zero').reason, 'nozero');
  assert.equal(logic.mistakeOf(mat(10, 0, [0]), 'zero').reason, 'nozero');
  const d = logic.mistakeOf(mat(2, 13, [1, 0, 1, 1]), 'decimal');
  assert.deepEqual([d.applies, d.wrongText, d.wrongValue, d.same], [true, '1101', 1101, false]);
  assert.equal(logic.mistakeOf(P(), 'decimal').reason, 'base10');
  assert.equal(logic.mistakeOf(mat(16, 255, [15, 15]), 'decimal').reason, 'letters');
  // a base above 10 without letters still applies
  assert.equal(logic.mistakeOf(mat(16, 17, [1, 1]), 'decimal').wrongValue, 11);
});

test('typed numbers: digits of the base, at most 9999', () => {
  assert.deepEqual(logic.parseNumber(' 15b ', 16), { value: 347 });
  assert.deepEqual(logic.parseNumber('1101', 2), { value: 13 });
  assert.equal(logic.parseNumber('12', 2).error, 'digit');
  assert.equal(logic.parseNumber('12', 2).at, '2');
  assert.equal(logic.parseNumber('10000', 10).error, 'max');
  assert.equal(logic.parseNumber('', 10).error, 'empty');
  assert.deepEqual(logic.parseNumber('9999', 10), { value: 9999 });
});

test('presets: blocks worth n and valid, with the expected numerals', () => {
  const want = {
    'build-347': [347, '347'], 'thirteen-ones': [33, null], 'zero-place': [307, '307'],
    'base-2': [13, '1101'], 'base-8-full': [8, null], 'base-16': [255, 'FF']
  };
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    const s = logic.initial(p);
    assert.equal(s.n, want[pr.id][0], pr.id);
    assert.equal(s.numeral, want[pr.id][1], pr.id);
    // the preset's own counts are used, not the fallback
    assert.deepEqual(s.counts, logic.KEYS.map((k) => p[k]), `${pr.id}: counts kept`);
  }
});

test('bad params do not break the model', () => {
  const s = logic.initial(P({ base: 'abc', n: -5, c0: 'x', c1: 99 }));
  assert.equal(s.base, 10);
  assert.equal(s.n, 0);
  assert.equal(s.numeral, '0');
  assert.equal(logic.initial(P({ base: 99 })).base, 16);
  assert.equal(logic.initial(P({ base: 1 })).base, 2);
  assert.equal(logic.initial(P({ n: 123456 })).n, 9999);
});

test('boundaries: regroup at b − 1 and b, the next column at cap − 1; refusal order of regroup and break', () => {
  assert.equal(logic.act(mat(10, 9, [9]), 'regroup', 0).error, 'few');
  // the next column holds 18 = cap − 1: one more fits
  assert.equal(logic.act(mat(10, 190, [10, 18]), 'regroup', 0).params.c1, 19);
  // few before full: 9 ones under 19 tens
  assert.equal(logic.act(mat(10, 199, [9, 19]), 'regroup', 0).error, 'few');
  // empty before full: no tens, 13 ones
  assert.equal(logic.act(mat(10, 13, [13, 0]), 'break', 1).error, 'empty');
  // base 16 holds up to 31 blocks a column
  assert.equal(logic.blocksOf(mat(16, 31, [31])).slice(0, 2).join(), '31,0');
  assert.equal(logic.act(mat(16, 31, [31]), 'add', 0).error, 'full');
  assert.equal(logic.act(mat(16, 30, [30]), 'add', 0).params.c0, 31);
});

test('digits and numerals: 0 is "0"; regroup all and the other bases in any base', () => {
  assert.equal(logic.textOf(0, 2), '0');
  assert.deepEqual(logic.digitsOf(0, 10), [0]);
  const r = logic.regroupAll(mat(16, 47, [31, 1]));
  assert.deepEqual([r.c0, r.c1, r.n], [15, 2, 47]);
  assert.deepEqual(logic.basesOf(13, 2).map((x) => [x.base, x.current]), [[10, false], [2, true], [8, false], [16, false]]);
});

test('mistakes in other bases: counts written in the base, zeros read in the base', () => {
  const sq = logic.mistakeOf(mat(16, 49, [17, 2]), 'squash');
  assert.deepEqual([sq.wrongText, sq.wrongValue, sq.rightText], ['211', 529, '31']);
  const z = logic.mistakeOf(mat(8, 64 * 3 + 5, [5, 0, 3]), 'zero');
  assert.deepEqual([z.wrongText, z.wrongValue], ['35', 29]);
});

test('initial: places, full places, numeral, expansion and bases from the params', () => {
  const s = logic.initial(mat(10, 33, [13, 2]));
  assert.equal(s.places, 4);
  assert.deepEqual(s.over, [0]);
  assert.equal(s.numeral, null);
  assert.deepEqual(s.expansion.map((x) => x.worth), [20, 13]);
  assert.deepEqual(s.bases.map((x) => x.text), ['33', '100001', '41', '21']);
});

test('presets carry the mistake they show', () => {
  const want = { 'build-347': 'none', 'thirteen-ones': 'squash', 'zero-place': 'zero', 'base-2': 'decimal', 'base-8-full': 'none', 'base-16': 'none' };
  for (const pr of logic.PRESETS) {
    assert.equal(pr.params.mistake, want[pr.id], pr.id);
    if (pr.params.mistake !== 'none') assert.equal(logic.mistakeOf(P(pr.params), pr.params.mistake).applies, true, pr.id);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const pr of logic.PRESETS) {
    const s = kit.stateAt(logic, P(pr.params), 0);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('deterministic, and initial and act do not mutate their params', () => {
  const p = P({ base: 8 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  logic.act(p, 'add', 0);
  logic.act(p, 'break', 1);
  assert.deepEqual(p, copy);
  assert.equal(logic.steps, 0, 'an explorer');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset has a label in both languages and only model params', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  for (const pr of logic.PRESETS) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k} is a model param`);
    assert.ok(html.includes(`'${pr.id}'`), `${pr.id}: label in index.html`);
  }
});
