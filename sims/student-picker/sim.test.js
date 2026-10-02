// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the student picker's model. Run: node --test sims/student-picker/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const withNames = (names) => logic.add(logic.empty(), names).state;

// ── rules of this model, tie-breaks first ──

test('tie-break: u selects pool[floor(u · size)] in list order, both ends included', () => {
  const s = withNames(['Ana', 'Ivo', 'Eva', 'Luka']);
  assert.equal(logic.pick(s, 0).last, 'Ana');
  assert.equal(logic.pick(s, 0.25).last, 'Ivo');
  assert.equal(logic.pick(s, 0.4999).last, 'Ivo');
  assert.equal(logic.pick(s, 0.5).last, 'Eva');
  assert.equal(logic.pick(s, 0.999999).last, 'Luka');
  assert.equal(logic.pick(s, 1).last, 'Luka', 'u = 1 is clamped to the last name');
});

test('the pool skips picked names and keeps list order', () => {
  let s = withNames(['Ana', 'Ivo', 'Eva']);
  s = logic.pick(s, 0); // Ana
  assert.deepEqual(logic.pool(s), ['Ivo', 'Eva']);
  assert.equal(logic.pick(s, 0).last, 'Ivo', 'the first remaining one, not the first on the list');
});

test('every name has the same chance: equal slices of [0, 1)', () => {
  const s = withNames(['A', 'B', 'C', 'D', 'E']);
  const count = {};
  for (let k = 0; k < 1000; k++) { const n = logic.pick(s, k / 1000).last; count[n] = (count[n] || 0) + 1; }
  assert.deepEqual(count, { A: 200, B: 200, C: 200, D: 200, E: 200 });
});

test('no repeats: a round picks everyone exactly once, then nobody', () => {
  let s = withNames(['Ana', 'Ivo', 'Eva', 'Luka', 'Mia']);
  const order = [];
  for (let k = 0; k < 5; k++) { s = logic.pick(s, 0.7); order.push(s.last); }
  assert.deepEqual([...order].sort(), ['Ana', 'Eva', 'Ivo', 'Luka', 'Mia']);
  assert.deepEqual(s.picked, order, 'picked keeps the order of the draws');
  const after = logic.pick(s, 0.3);
  assert.equal(after.last, null);
  assert.deepEqual(after.picked, order);
});

test('a new round keeps the names and forgets the picks', () => {
  let s = logic.pick(withNames(['Ana', 'Ivo']), 0);
  s = logic.newRound(s);
  assert.deepEqual(s, { names: ['Ana', 'Ivo'], picked: [], last: null });
  assert.deepEqual(logic.clear(), logic.empty());
});

test('names are trimmed and inner whitespace collapsed; duplicates are exact after that', () => {
  assert.equal(logic.normalize('  Ana   Marija \t Kovač '), 'Ana Marija Kovač');
  const r = logic.add(logic.empty(), ['Ana', ' Ana ', 'ana', '', '   ']);
  assert.deepEqual(r.state.names, ['Ana', 'ana']);
  assert.equal(r.added, 2);
  assert.equal(r.duplicate, 1);
  assert.equal(r.full, 0);
});

test('at most 30 names; the rest is counted as not fitting; a duplicate counts as duplicate, not full', () => {
  const names = Array.from({ length: 32 }, (_, i) => 'S' + i);
  const r = logic.add(logic.empty(), names.concat(['S0']));
  assert.equal(r.state.names.length, logic.MAX);
  assert.equal(r.added, 30);
  assert.equal(r.full, 2);
  assert.equal(r.duplicate, 1);
});

test('a name is cut at 60 characters', () => {
  assert.equal(logic.normalize('x'.repeat(80)).length, logic.MAX_LEN);
});

test('the bulk field splits on new lines, commas and semicolons', () => {
  assert.deepEqual(logic.splitBulk('Ana, Ivo;Eva\n\n Luka ,,\r\nMia'), ['Ana', 'Ivo', 'Eva', 'Luka', 'Mia']);
});

test('removing a name drops it from the picks and from the result shown', () => {
  let s = withNames(['Ana', 'Ivo', 'Eva']);
  s = logic.pick(s, 0.5); // Ivo
  const r = logic.remove(s, 1);
  assert.deepEqual(r, { names: ['Ana', 'Eva'], picked: [], last: null });
  assert.deepEqual(logic.remove(s, 7), s, 'an index out of range changes nothing');
  const again = logic.add(r, ['Ivo']).state;
  assert.deepEqual(logic.pool(again), ['Ana', 'Eva', 'Ivo'], 'added back, not picked');
});

test('sanitize repairs a stored state', () => {
  const s = logic.sanitize({ names: ['Ana', 'Ana', 7, ' Ivo '], picked: ['Ivo', 'Ivo', 'Nobody'], last: 'Nobody', x: 1 });
  assert.deepEqual(s, { names: ['Ana', 'Ivo'], picked: ['Ivo'], last: null });
  assert.deepEqual(logic.sanitize(null), logic.empty());
  assert.deepEqual(logic.sanitize({ names: ['Ana'], picked: ['Ana'], last: 'Ana' }).last, 'Ana');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe after every action', () => {
  let s = withNames(['Ana', 'Ivo', 'Eva']);
  for (const next of [(x) => logic.pick(x, 0.2), (x) => logic.remove(x, 0), (x) => logic.newRound(x), () => logic.clear()]) {
    s = next(s);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its input', () => {
  const s = withNames(['Ana', 'Ivo', 'Eva']);
  const copy = structuredClone(s);
  assert.deepEqual(logic.pick(s, 0.6), logic.pick(s, 0.6));
  logic.pick(s, 0.6); logic.remove(s, 0); logic.add(s, ['Mia']); logic.newRound(s);
  assert.deepEqual(s, copy);
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('the page metadata matches the model: a tool, no steps', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'tool');
  assert.equal(meta.steps, undefined);
  assert.ok(!('step' in logic), 'no step function');
});
