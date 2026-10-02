// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the Rowhammer model (sim.js). Run: node --test sims/rowhammer/
// The model's rules first (tie-breaks first of all), then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => kit.stateAt(logic, P(over), 0);
const preset = (id) => at(logic.presets.find((x) => x.id === id).params);
const dists = (st) => st.rows.map((r) => r.dist);

// ── tie-breaks ──

test('a disturbance exactly at a cell\'s threshold flips it; just below does not', () => {
  assert.equal(logic.flips(1, 20, 20), true);
  assert.equal(logic.flips(1, 19.999, 20), false);
});

test('a cell holding 0 has no charge to lose and never flips', () => {
  assert.equal(logic.flips(0, 1e9, 1), false);
  const st = at({ acts: 120, thresh: 4 });
  for (const r of st.rows) for (const c of r.cells) if (c.bit === 0) assert.equal(c.flipped, false);
});

test('ECC boundaries: 0 clean, 1 corrected, 2 detected, 3 and more beyond SECDED', () => {
  assert.deepEqual([0, 1, 2, 3, 8].map(logic.eccStatus), ['clean', 'corrected', 'detected', 'beyond', 'beyond']);
});

test('TRR caps at its limit exactly; below the limit it does nothing', () => {
  assert.equal(logic.effective(logic.TRR_LIMIT, 'trr'), logic.TRR_LIMIT);
  assert.equal(logic.effective(logic.TRR_LIMIT + 5, 'trr'), logic.TRR_LIMIT);
  assert.equal(logic.effective(logic.TRR_LIMIT - 1, 'trr'), logic.TRR_LIMIT - 1);
});

// ── layout of aggressors and victims ──

test('double-sided: aggressors around the middle row; the middle row takes twice, the outer neighbours once', () => {
  const st = at({ pattern: 'double', acts: 30, mitigation: 'none', size: 'medium' });
  assert.deepEqual(st.aggressors, [3, 5]);
  assert.deepEqual(dists(st), [0, 0, 30, 0, 60, 0, 30, 0, 0]);
  assert.deepEqual(st.rows.map((r) => r.kind), ['far', 'far', 'victim', 'aggressor', 'victim', 'aggressor', 'victim', 'far', 'far']);
});

test('single-sided: the middle row is the aggressor and both neighbours take it once', () => {
  const st = at({ pattern: 'single', acts: 30, size: 'small' });
  assert.deepEqual(st.aggressors, [2]);
  assert.deepEqual(dists(st), [0, 30, 0, 30, 0]);
});

test('an aggressor row takes no disturbance: its own activations restore it', () => {
  const st = at({ acts: 120, thresh: 4 });
  for (const r of st.rows) if (r.kind === 'aggressor') {
    assert.equal(r.dist, 0);
    assert.ok(r.cells.every((c) => !c.flipped));
  }
});

// ── mitigations ──

test('twice the refresh rate halves the disturbance; ECC leaves it as it is', () => {
  assert.equal(logic.effective(30, 'refresh2x'), 15);
  assert.equal(logic.effective(30, 'ecc'), 30);
  assert.equal(logic.effective(30, 'none'), 30);
  assert.deepEqual(dists(at({ mitigation: 'refresh2x' })), dists(at({ mitigation: 'none' })).map((d) => d / 2));
});

test('ECC: one flip per word is not wrong data, two are reported, three or more are counted wrong', () => {
  const st = at({ acts: 90, mitigation: 'ecc' });
  let wrong = 0;
  for (const r of st.rows) for (const w of r.words) {
    assert.equal(w.status, logic.eccStatus(w.flips));
    assert.equal(w.wrong, w.flips >= 3);
    if (w.wrong) wrong++;
  }
  assert.equal(st.wrongWords, wrong);
  const sum = st.words.clean + st.words.corrected + st.words.detected + st.words.beyond;
  assert.equal(sum, st.rows.length * (st.cols / logic.WORD));
});

test('without ECC every word with a flip is wrong data', () => {
  const st = at({ acts: 90 });
  for (const r of st.rows) for (const w of r.words) assert.equal(w.wrong, w.flips > 0);
  assert.equal(st.words, null);
});

test('ECC changes what is read, not which cells flip', () => {
  const a = at({ acts: 60, mitigation: 'ecc' }), b = at({ acts: 60, mitigation: 'none' });
  assert.equal(a.flips, b.flips);
});

// ── thresholds and monotonicity ──

test('below the weakest cell\'s threshold nothing flips', () => {
  const st = at({ acts: 9, thresh: 20 }); // double-sided victim takes 18 < 20
  assert.equal(st.flips, 0);
  for (const r of st.rows) for (const c of r.cells) assert.ok(c.bit === c.now);
});

test('a cell\'s threshold lies between the weakest one\'s and 1 + SPREAD times it: all charged victims flip at the top', () => {
  const st = at({ acts: 40, thresh: 10, pattern: 'single' }); // victims take 40 = (1 + 3) × 10
  for (const r of st.rows) if (r.kind === 'victim') for (const c of r.cells) assert.equal(c.flipped, c.bit === 1);
});

test('more activations never undo a flip', () => {
  let prev = null;
  for (let acts = 0; acts <= 120; acts += 5) {
    const st = at({ acts });
    if (prev) st.rows.forEach((r, i) => r.cells.forEach((c, j) => { if (prev.rows[i].cells[j].flipped) assert.ok(c.flipped, `${acts} ${i}:${j}`); }));
    prev = st;
  }
});

test('a flipped cell reads 0', () => {
  const st = at({ acts: 90 });
  for (const r of st.rows) for (const c of r.cells) if (c.flipped) assert.equal(c.now, 0);
});

// ── phases and numbers ──

test('phase: idle at 0, activate below 40 % of the threshold, disturb at 40 % without flips, flip with flips', () => {
  assert.equal(at({ acts: 0 }).phase, 'idle');
  assert.equal(at({ acts: 3, thresh: 20 }).phase, 'activate'); // 6 < 8
  assert.equal(at({ acts: 4, thresh: 20 }).phase, 'disturb'); // 8 = 40 % of 20, the tie counts as disturb
  assert.equal(at({ acts: 30 }).phase, 'flip');
});

test('rate: activations per ms per aggressor row for the window', () => {
  assert.equal(logic.WINDOW_MS, 64);
  assert.equal(at({ acts: 32 }).rate, 500);
  assert.equal(at({ acts: 30 }).rate, 469);
});

test('stored data has both bits and does not depend on the params', () => {
  const a = at({ size: 'large' }), b = at({ size: 'large', acts: 0, pattern: 'single' });
  const bits = a.rows.flatMap((r) => r.cells.map((c) => c.bit));
  assert.ok(bits.includes(0) && bits.includes(1));
  assert.deepEqual(bits, b.rows.flatMap((r) => r.cells.map((c) => c.bit)));
});

// ── presets: what each one is for ──

test('presets show what their labels say', () => {
  const single = preset('single'), double = preset('double');
  assert.ok(single.flips > 0, 'single-sided flips');
  assert.ok(double.flips > single.flips, 'double-sided flips more at the same activations');
  assert.ok(preset('refresh2x').flips < double.flips, '2× refresh flips less');
  assert.equal(preset('trr').flips, 0, 'TRR stops it');
  assert.ok(preset('trr-weak').flips > 0, 'TRR on a sensitive chip does not');
  const ecc = preset('ecc');
  assert.ok(ecc.words.corrected > 0 && ecc.wrongWords < double.wrongWords, 'ECC corrects most');
  const heavy = preset('ecc-heavy');
  assert.ok(heavy.words.beyond > ecc.words.beyond, 'heavy hammering beats SECDED');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const pr of logic.presets) {
    const s = at(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
});

test('deterministic, and initial does not mutate its params', () => {
  const p = P({ acts: 55, mitigation: 'ecc', size: 'large' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer');
});

test('every bank size builds a full bank in whole ECC words', () => {
  for (const [size, [rows, cols]] of Object.entries(logic.SIZES)) {
    assert.equal(cols % logic.WORD, 0, size);
    const st = at({ size });
    assert.equal(st.rows.length, rows);
    for (const r of st.rows) { assert.equal(r.cells.length, cols); assert.equal(r.words.length, cols / logic.WORD); }
  }
});

test('both languages: same keys, plural forms and placeholders', () => {
  const glossary = require('../../kit/glossary.js');
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has a label in the page', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  const ids = logic.presets.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length, 'unique ids');
  assert.ok(ids.length <= 9, 'keys 1–9');
  for (const pr of logic.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k} is a model param`);
    assert.ok(html.includes(`'${pr.id}'`) || new RegExp(`\\b${pr.id}:`).test(html), `${pr.id}: label in index.html`);
  }
});
