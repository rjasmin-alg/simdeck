// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the bridge rectifier model. Run: node --test sims/rectifier-2/
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
const states = (s) => logic.DIODES.map((d) => s.diodes[d]);
const PI = Math.PI;

// ── tie-breaks first ──

test('tie-break: at a zero crossing no diode conducts and the half-period is neither', () => {
  for (const th of [0, PI, 2 * PI, 2 * PI + 1e-12, PI - 1e-12]) {
    assert.deepEqual(logic.conducting(th), [], `θ = ${th}`);
    assert.equal(logic.halfAt(th), null, `θ = ${th}`);
    assert.ok(close(logic.ua(th), 0, 1e-8), `θ = ${th}`);
  }
  // just off the crossing, the side decides
  assert.deepEqual(logic.conducting(1e-6), ['D1', 'D2']);
  assert.deepEqual(logic.conducting(PI + 1e-6), ['D3', 'D4']);
  assert.deepEqual(logic.conducting(-1e-6), ['D3', 'D4']);
});

test('tie-break: step 0 is the circuit at rest: no diode state, no path, no polarity, no window', () => {
  const s = at(0);
  assert.equal(s.half, null);
  assert.deepEqual(states(s), [null, null, null, null]);
  assert.equal(s.top, null);
  assert.equal(s.bottom, null);
  assert.equal(s.load, null);
  assert.deepEqual(s.paths, []);
  assert.deepEqual(s.windows, []);
});

test('tie-break: a step outside 0 … steps goes to the nearest end, a fraction to the nearest step', () => {
  assert.equal(logic.at({}, -3).n, 0);
  assert.equal(logic.at({}, 99).n, logic.steps);
  assert.equal(logic.at({}, 1.4).n, 1);
  assert.equal(logic.at({}, 1.6).n, 2);
  assert.equal(logic.at({}, 'x').n, 0);
});

test('tie-break: pair() of anything but 1 or 2 is empty, and a returned pair is a copy', () => {
  assert.deepEqual(logic.pair(0), []);
  assert.deepEqual(logic.pair(null), []);
  const a = logic.pair(1);
  a.push('X');
  assert.deepEqual(logic.pair(1), ['D1', 'D2']);
  const c = logic.conducting(1);
  c.pop();
  assert.deepEqual(logic.conducting(1), ['D1', 'D2']);
});

// ── the model's rules ──

test('Us is a sine of amplitude 0.9 as in the figures; the output is |Us|', () => {
  assert.equal(logic.A, 0.9);
  assert.ok(close(logic.us(PI / 2), 0.9));
  assert.ok(close(logic.us(3 * PI / 2), -0.9));
  for (let i = 1; i < 200; i++) {
    const th = i * logic.T_MAX / 200;
    assert.ok(logic.ua(th) >= 0, `θ = ${th}`);
    assert.ok(close(logic.ua(th), Math.abs(logic.us(th))), `θ = ${th}`);
  }
  // two humps per period: Ua peaks at π/2 and 3π/2
  assert.ok(close(logic.ua(PI / 2), 0.9));
  assert.ok(close(logic.ua(3 * PI / 2), 0.9));
});

test('two diodes in series conduct per half-period: D1, D2 while the top end is +, D3, D4 while the bottom end is', () => {
  for (const th of [0.1, 1, PI / 2, 3]) { assert.deepEqual(logic.conducting(th), ['D1', 'D2']); assert.ok(logic.us(th) > 0); }
  for (const th of [3.3, 4, 3 * PI / 2, 6.2]) { assert.deepEqual(logic.conducting(th), ['D3', 'D4']); assert.ok(logic.us(th) < 0); }
  // and again in the next period
  assert.deepEqual(logic.conducting(2 * PI + 1), ['D1', 'D2']);
  assert.equal(logic.halfAt(2 * PI + 1), 1);
  assert.equal(logic.halfAt(PI + 1), 2);
  // the two pairs never share a diode, and together they are all four
  assert.deepEqual([...logic.pair(1), ...logic.pair(2)].sort(), logic.DIODES);
});

test('the steps are the original\'s states, then both: none, 1st, 2nd half-period, both', () => {
  assert.equal(logic.steps, 3);
  assert.deepEqual(range().map((n) => at(n).half), [null, 1, 2, 'both']);
  assert.equal(at(3).last, true);
  assert.equal(at(2).last, false);
});

test('in each half-period one pair conducts and the other blocks; at step 3 they alternate', () => {
  assert.deepEqual(range().map((n) => states(at(n))), [
    [null, null, null, null],
    ['conducts', 'conducts', 'blocks', 'blocks'],
    ['blocks', 'blocks', 'conducts', 'conducts'],
    ['alternate', 'alternate', 'alternate', 'alternate']
  ]);
  assert.deepEqual(range().map((n) => at(n).paths), [[], [1], [2], [1, 2]]);
});

test('the positive end of the secondary changes with the half-period: top in the 1st, bottom in the 2nd', () => {
  assert.deepEqual([at(1).top, at(1).bottom], ['+', '-']);
  assert.deepEqual([at(2).top, at(2).bottom], ['-', '+']);
});

test('the current through R flows the same way in every half-period', () => {
  assert.equal(at(1).load, 'down');
  assert.equal(at(2).load, 'down');
  assert.equal(at(3).load, 'down');
});

test('windows: the step\'s half-periods, as in the figures; at step 3 every half-period of the range', () => {
  assert.deepEqual(at(1).windows, [{ from: 0, to: PI, half: 1, diodes: ['D1', 'D2'] }]);
  assert.deepEqual(at(2).windows, [{ from: PI, to: 2 * PI, half: 2, diodes: ['D3', 'D4'] }]);
  const w = at(3).windows;
  assert.deepEqual(w.map((x) => x.half), [1, 2, 1]);
  // they tile 0 … 2.5π without gaps or overlap
  assert.equal(w[0].from, 0);
  for (let i = 1; i < w.length; i++) assert.equal(w[i].from, w[i - 1].to);
  assert.ok(close(w[w.length - 1].to, logic.T_MAX));
  // each window's diodes are the ones the model says conduct in its middle
  for (const x of w) assert.deepEqual(logic.conducting((x.from + x.to) / 2), x.diodes);
});

test('curve: samples from 0 to 2.5π on the function', () => {
  const c = logic.curve(logic.ua, 100);
  assert.equal(c.length, 101);
  assert.deepEqual(c[0], [0, logic.ua(0)]);
  assert.ok(close(c[100][0], 2.5 * PI));
  for (const [th, v] of c) assert.ok(close(v, logic.ua(th)));
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
  assert.deepEqual(logic.presets.map((p) => at(p.step).half), [1, 2, 'both']);
});
