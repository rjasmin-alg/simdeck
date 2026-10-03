// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the trap antenna model. Run: node --test sims/trap-antenna/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (n) => kit.stateAt(logic, P({}), n);
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
const range = () => Array.from({ length: logic.steps + 1 }, (_, n) => n);

// ── tie-breaks first ──

test('tie-break: f exactly at f_res, or within rounding of it, blocks; just outside it does not', () => {
  assert.equal(logic.trapAt(7.05, 7.05), 'blocks');
  assert.equal(logic.trapAt(7.05 + 1e-12, 7.05), 'blocks');
  assert.equal(logic.trapAt(0.1 * 70.5, 7.05), 'blocks');   // 7.050000000000001 in floating point
  assert.equal(logic.trapAt(7.05 - 1e-6, 7.05), 'inductive');
  assert.equal(logic.trapAt(7.05 + 1e-6, 7.05), 'capacitive');
});

test('tie-break: no excitation (f null or undefined) is no trap action, not a frequency of 0', () => {
  assert.equal(logic.trapAt(null, 7.05), 'none');
  assert.equal(logic.trapAt(undefined, 7.05), 'none');
  assert.equal(logic.trapAt(0, 7.05), 'inductive');
  const s = at(0);
  assert.equal(s.active, 'none');
  assert.equal(s.length, 0);
  assert.equal(s.reactance, null);
  assert.equal(s.halfWave, null);
});

test('tie-break: the reactance has no finite value at resonance (null), and is 0 at f = 0', () => {
  assert.equal(logic.reactance(1), null);
  assert.equal(logic.reactance(1 + 1e-12), null);
  assert.equal(logic.reactance(0), 0);
  assert.equal(at(2).reactance, null);
});

test('tie-break: a step outside 0 … steps goes to the nearest end, a fraction to the nearest step', () => {
  assert.equal(logic.at({}, -3).n, 0);
  assert.equal(logic.at({}, 99).n, logic.steps);
  assert.equal(logic.at({}, 1.4).n, 1);
  assert.equal(logic.at({}, 1.6).n, 2);
  assert.equal(logic.at({}, 'x').n, 0);
});

// ── the model's rules ──

test('the steps are the original\'s states in its order: no excitation, 3.5, 7.05, 14 MHz', () => {
  assert.equal(logic.steps, 3);
  assert.deepEqual(range().map((n) => at(n).f), [null, 3.5, 7.05, 14]);
  assert.equal(at(3).last, true);
  assert.equal(at(2).last, false);
});

test('below f_res the trap is inductive and lengthens; at f_res it blocks; above it is capacitive and shortens', () => {
  assert.deepEqual(range().map((n) => at(n).trap), ['none', 'inductive', 'blocks', 'capacitive']);
  assert.deepEqual(range().map((n) => at(n).effect), ['none', 'longer', 'ends', 'shorter']);
});

test('at f_res only the inner part is active, 2 × 10.07 m = 20.14 m; otherwise the whole wire, 2 × (10.07 + 6.71) m', () => {
  assert.deepEqual(range().map((n) => at(n).active), ['none', 'whole', 'inner', 'whole']);
  assert.equal(at(2).length, 20.14);
  assert.equal(at(1).length, 33.56);
  assert.equal(at(3).length, 33.56);
});

test('the blocked dipole is about half a wavelength long at f_res', () => {
  const s = at(2);
  assert.equal(s.halfWave, 21.26);
  // 20.14 m is 95 % of λ/2, the usual shortening of a wire dipole
  assert.ok(s.length / s.halfWave > 0.9 && s.length / s.halfWave < 1);
  assert.equal(at(1).halfWave, 42.83);
  assert.equal(at(3).halfWave, 10.71);
});

test('reactance: X / Z0 = x / (1 − x²), positive below resonance, negative above, odd in x', () => {
  assert.ok(close(logic.reactance(0.5), 0.5 / 0.75));
  assert.ok(close(logic.reactance(2), -2 / 3));
  for (const x of [0.1, 0.5, 0.9, 0.99]) assert.ok(logic.reactance(x) > 0, `x = ${x}`);
  for (const x of [1.01, 1.5, 2, 2.5]) assert.ok(logic.reactance(x) < 0, `x = ${x}`);
  // it grows towards resonance from both sides
  assert.ok(logic.reactance(0.9) > logic.reactance(0.5));
  assert.ok(logic.reactance(1.1) < logic.reactance(1.5));
  for (const x of [0.3, 0.7, 1.4]) assert.ok(close(logic.reactance(-x), -logic.reactance(x)), `x = ${x}`);
});

test('the sign of the reactance matches the trap\'s action at every step', () => {
  assert.ok(at(1).reactance > 0);
  assert.ok(at(3).reactance < 0);
  assert.ok(close(at(1).x, 3.5 / 7.05, 1e-4));
});

test('curve: two branches split at resonance, every point within the range and on the formula', () => {
  const c = logic.curve(2.5, 4, 400);
  assert.ok(c.below.length > 50 && c.above.length > 50);
  for (const [x, y] of c.below) { assert.ok(x < 1 && y >= 0 && y <= 4); assert.ok(close(y, logic.reactance(x))); }
  for (const [x, y] of c.above) { assert.ok(x > 1 && y < 0 && y >= -4); assert.ok(close(y, logic.reactance(x))); }
  assert.deepEqual(c.below[0], [0, 0]);
  assert.ok(close(c.above[c.above.length - 1][0], 2.5));
  // x = 1 itself (sample 160 of 400) is never drawn
  assert.ok(!c.below.concat(c.above).some((p) => close(p[0], 1)));
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const n of range()) {
    const s = at(n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({});
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({});
  const s1 = kit.stateAt(logic, p, 1);
  const copy = structuredClone(s1);
  logic.step(s1, 2, p);
  assert.deepEqual(s1, copy);
});

test('both languages: same keys and placeholders; a caption for every step', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
  for (const lang of ['hr', 'en']) {
    for (const n of range()) assert.ok(strings[lang]['caption' + n], `${lang}: caption${n}`);
  }
});

test('every preset is valid for the model, and the page meta matches the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'stepper');
  assert.equal(meta.steps, logic.steps);
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: param ${k}`);
    assert.ok(p.step >= 0 && p.step <= logic.steps, `preset ${p.id}: step`);
  }
  assert.deepEqual(logic.presets.map((p) => at(p.step).f), [3.5, 7.05, 14]);
});
