// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ari-parts-of-number: the model's rules (SPEC.md), tie-breaks first, then the generic block every sim keeps.
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
const sum = (a) => a.reduce((x, y) => x + y, 0);

// ── tie-breaks first ──

test('tie-break: a whole that does not divide comes first; the mistake is ignored (rule 4, 6c)', () => {
  const s = S({ n: 10, d: 3, k: 1, unequal: true });
  assert.equal(s.divides, false);
  assert.equal(s.q, 3);
  assert.equal(s.r, 1);
  assert.deepEqual(s.sizes, [3, 3, 3]);
  assert.equal(s.unequal, false);
  assert.equal(s.wrong, false);
  assert.equal(s.wayIgnored, true);
  assert.equal(s.value, null);
  assert.equal(s.right, null);
  assert.equal(S({ n: 10, d: 3 }).wayIgnored, false);
});

test('tie-break: all the parts are the whole, equal or not (rule 6a)', () => {
  for (const unequal of [false, true]) {
    const s = S({ n: 12, d: 3, k: 3, unequal });
    assert.equal(s.taken, 12);
    assert.equal(s.whole, true);
    assert.equal(s.wrong, false);
  }
  assert.equal(S({ n: 12, d: 3, k: 2 }).whole, false);
});

test('tie-break: one object per part has no unequal split (rule 6b)', () => {
  const s = S({ n: 3, d: 3, k: 1, unequal: true });
  assert.deepEqual(s.sizes, [1, 1, 1]);
  assert.equal(s.noUnequal, true);
  assert.equal(s.unequal, false);
  assert.equal(s.wrong, false);
  assert.equal(s.value, 1);
  assert.equal(S({ n: 6, d: 3, unequal: true }).noUnequal, false);   // q = 2: s = 1
  assert.equal(S({ n: 3, d: 3 }).noUnequal, false);                   // equal way: nothing to flag
});

test('tie-break flags are set only where they apply; no check when it does not divide', () => {
  assert.equal(S({ n: 12, d: 3, unequal: true }).wayIgnored, false);
  assert.equal(S({ n: 10, d: 3, unequal: true }).noUnequal, false);
  assert.equal(S({ n: 10, d: 3 }).check, null);
  assert.equal(S({ n: 12, d: 3 }).check, 12);
  assert.equal(logic.taskOf({ unequal: 'true' }).way, 'equal');
  assert.equal(logic.taskOf({ unequal: 1 }).way, 'equal');
});

test('tie-break: more parts than objects leaves every object over', () => {
  const s = S({ n: 2, d: 3 });
  assert.equal(s.q, 0);
  assert.equal(s.r, 2);
  assert.deepEqual(s.sizes, [0, 0, 0]);
  assert.equal(s.divides, false);
});

// ── rule 1: the task is made valid ──

test('rule 1: params are rounded, clamped, defaulted; the clock is always 60', () => {
  assert.deepEqual(logic.taskOf({ pic: 'pie', n: 250, d: 1, k: 9, unequal: 'yes', hide: 'yes' }),
    { pic: 'row', n: 100, N: 100, d: 2, k: 2, way: 'equal', hide: false });
  assert.deepEqual(logic.taskOf({ pic: 'row', n: 0, d: 40, k: 0, unequal: true, hide: true }),
    { pic: 'row', n: 1, N: 1, d: 12, k: 1, way: 'unequal', hide: true });
  const t = logic.taskOf({ pic: 'clock', n: 12, d: 4.4, k: 2.6 });
  assert.equal(t.N, 60);
  assert.equal(t.n, 12);
  assert.equal(t.d, 4);
  assert.equal(t.k, 3);
  for (const bad of ['', null, undefined, true, 'x', NaN]) {
    const u = logic.taskOf({ n: bad, d: bad, k: bad });
    assert.equal(u.n, 12);
    assert.equal(u.d, 3);
    assert.equal(u.k, 1);
  }
  assert.equal(logic.taskOf({ n: '20', d: '5', k: '4' }).k, 4);
});

// ── rule 2: equal parts ──

test('rule 2: d equal parts of N : d; k parts are k · q', () => {
  let s = S({ n: 12, d: 3, k: 1 });
  assert.deepEqual(s.sizes, [4, 4, 4]);
  assert.deepEqual(s.starts, [0, 4, 8]);
  assert.equal(s.value, 4);
  assert.equal(S({ n: 12, d: 3, k: 2 }).value, 8);
  assert.equal(S({ n: 12, d: 3, k: 3 }).value, 12);
  s = S({ n: 20, d: 5, k: 4 });
  assert.equal(s.q, 4);
  assert.equal(s.value, 16);
  s = S({ pic: 'clock', d: 4, k: 3 });
  assert.equal(s.N, 60);
  assert.equal(s.q, 15);
  assert.equal(s.value, 45);
  assert.deepEqual(s.starts, [0, 15, 30, 45]);
  assert.equal(S({ pic: 'clock', d: 2, k: 1 }).value, 30);
  assert.equal(S({ pic: 'clock', d: 12, k: 5 }).value, 25);
});

test('rule 2: sweep: every whole that divides gives k · q, and the check d · q = N', () => {
  for (let n = 1; n <= 100; n++) for (let d = 2; d <= 12; d++) {
    if (n % d) continue;
    for (let k = 1; k <= d; k++) {
      const s = S({ n, d, k });
      assert.equal(s.value, k * (n / d));
      assert.equal(s.taken, s.value);
      assert.equal(s.check, n);
      assert.equal(sum(s.sizes), n);
      assert.equal(s.wrong, false);
    }
  }
});

// ── rule 4: does not divide ──

test('rule 4: remainder: d parts of the quotient and r left over, on the row and on the clock', () => {
  let s = S({ pic: 'clock', d: 7 });
  assert.equal(s.q, 8);
  assert.equal(s.r, 4);
  assert.equal(sum(s.sizes) + s.r, 60);
  s = S({ pic: 'clock', d: 8 });
  assert.equal(s.q, 7);
  assert.equal(s.r, 4);
  for (let n = 1; n <= 100; n++) for (let d = 2; d <= 12; d++) {
    const u = S({ n, d });
    assert.equal(u.divides, n % d === 0);
    assert.equal(u.q * d + u.r, n);
    assert.ok(u.r < d);
  }
});

// ── rule 5: unequal parts ──

test('rule 5: unequal parts: q + s, q, …, q − s with s = ⌊q / 2⌋', () => {
  let s = S({ n: 12, d: 3, k: 1, unequal: true });
  assert.deepEqual(s.sizes, [6, 4, 2]);
  assert.equal(s.taken, 6);
  assert.equal(s.right, 4);
  assert.equal(s.value, null);
  assert.equal(s.wrong, true);
  assert.equal(s.check, 18);
  assert.equal(S({ n: 12, d: 3, k: 2, unequal: true }).taken, 10);
  s = S({ pic: 'clock', d: 4, k: 1, unequal: true });
  assert.deepEqual(s.sizes, [22, 15, 15, 8]);
  assert.equal(s.taken, 22);
  assert.equal(S({ pic: 'clock', d: 4, k: 3, unequal: true }).taken, 52);
  assert.deepEqual(S({ n: 10, d: 2, unequal: true }).sizes, [7, 3]);
  assert.deepEqual(S({ n: 6, d: 3, unequal: true }).sizes, [3, 2, 1]);   // q = 2, s = 1
  assert.deepEqual(S({ n: 9, d: 3, unequal: true }).sizes, [4, 3, 2]);   // q = 3, s = 1 (rounded down)
});

test('rule 5: sweep: unequal parts keep N, every part has an object, and k < d is always wrong by s', () => {
  for (let n = 1; n <= 100; n++) for (let d = 2; d <= 12; d++) {
    if (n % d) continue;
    const q = n / d;
    for (let k = 1; k <= d; k++) {
      const s = S({ n, d, k, unequal: true });
      assert.equal(sum(s.sizes), n);
      assert.ok(Math.min(...s.sizes) >= 1);
      if (q >= 2 && k < d) {
        assert.equal(s.taken, k * q + Math.floor(q / 2));
        assert.equal(s.wrong, true);
      } else assert.equal(s.wrong, false);
    }
  }
});

// ── the page's helpers ──

test('a click on part i colours parts 1…i', () => {
  const s = S({ n: 12, d: 4 });
  assert.equal(logic.kFor(s, 0), 1);
  assert.equal(logic.kFor(s, 2), 3);
  assert.equal(logic.kFor(s, 3), 4);
  assert.equal(logic.kFor(s, 9), 4);
  assert.equal(logic.kFor(s, -1), 1);
  assert.equal(logic.kFor(s, 1.7), 2);
});

test('the minute hand\'s numeral: multiples of 5 inside the hour', () => {
  assert.equal(logic.numeralAt(45), 9);
  assert.equal(logic.numeralAt(15), 3);
  assert.equal(logic.numeralAt(5), 1);
  assert.equal(logic.numeralAt(52), null);
  assert.equal(logic.numeralAt(60), null);
  assert.equal(logic.numeralAt(0), null);
});

test('presets give the SPEC numbers', () => {
  const by = Object.fromEntries(logic.PRESETS.map((p) => [p.id, logic.initial(P(p.params))]));
  assert.equal(by.third.value, 4);
  assert.equal(by.twoThirds.value, 8);
  assert.equal(by.fourFifths.value, 16);
  assert.equal(by.hour.value, 45);
  assert.equal(by.hour.pic, 'clock');
  assert.equal(by.unequal.wrong, true);
  assert.equal(by.unequal.hide, true);
  assert.deepEqual(by.unequal.sizes, [6, 4, 2]);
  assert.equal(by.leftover.r, 1);
  assert.equal(logic.PRESETS.length, 6);
  // the SPEC's preset table: { N, d, k } and the way
  const want = { third: [12, 3, 1, 'equal'], twoThirds: [12, 3, 2, 'equal'], fourFifths: [20, 5, 4, 'equal'],
    hour: [60, 4, 3, 'equal'], unequal: [12, 3, 1, 'unequal'], leftover: [10, 3, 1, 'equal'] };
  for (const [id, w] of Object.entries(want)) assert.deepEqual([by[id].N, by[id].d, by[id].k, by[id].way], w, id);
  assert.equal(by.leftover.q, 3);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe and deterministic', () => {
  for (const pr of logic.PRESETS) {
    const s = logic.initial(P(pr.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    assert.deepEqual(logic.initial(P(pr.params)), s);
  }
});

test('initial does not mutate its params', () => {
  const p = P({ n: 12, d: 3, unequal: true });
  const copy = structuredClone(p);
  logic.initial(p);
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every part name and number word exists for d 2…12 in both languages', () => {
  for (const lang of ['hr', 'en']) {
    for (let d = logic.D_MIN; d <= logic.D_MAX; d++) assert.ok(Array.isArray(strings[lang]['part' + d]), `${lang} part${d}`);
    for (let k = 1; k <= logic.D_MAX; k++) assert.ok(strings[lang]['w' + k], `${lang} w${k}`);
  }
});

test('the page is an explorer and its presets are the model\'s', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, k);
  const sj = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  for (const e of sj.entries || []) assert.ok(logic.PRESETS.some((p) => p.id === e.preset), e.preset);
});
