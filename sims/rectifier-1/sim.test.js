// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the centre-tap full-wave rectifier model. Run: node --test sims/rectifier-1/
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
const PI = Math.PI;

// ── tie-breaks first ──

test('tie-break: at a zero crossing no diode conducts and the half-period is neither', () => {
  for (const th of [0, PI, 2 * PI, 2 * PI + 1e-12, PI - 1e-12]) {
    assert.equal(logic.conducting(th), null, `θ = ${th}`);
    assert.equal(logic.halfAt(th), null, `θ = ${th}`);
    assert.ok(close(logic.ua(th), 0, 1e-8), `θ = ${th}`);
  }
  // just off the crossing, the side decides
  assert.equal(logic.conducting(1e-6), 'D1');
  assert.equal(logic.conducting(PI + 1e-6), 'D2');
  assert.equal(logic.conducting(-1e-6), 'D2');
});

test('tie-break: step 0 is the circuit at rest: no diode state, no path, no polarity, no window', () => {
  const s = at(0);
  assert.equal(s.half, null);
  assert.equal(s.d1, null);
  assert.equal(s.d2, null);
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

// ── the model's rules ──

test('U1 and U2 are equal and opposite against the centre tap, amplitude 0.9 as in the figures', () => {
  assert.equal(logic.A, 0.9);
  for (const th of [0.3, 1, PI / 2, 2, 4, 5.5]) assert.ok(close(logic.u1(th), -logic.u2(th)), `θ = ${th}`);
  assert.ok(close(logic.u1(PI / 2), 0.9));
  assert.ok(close(logic.u2(3 * PI / 2), 0.9));
});

test('the diode whose anode is positive against the centre tap conducts: D1 in 0 … π, D2 in π … 2π', () => {
  for (const th of [0.1, 1, PI / 2, 3]) { assert.equal(logic.conducting(th), 'D1'); assert.ok(logic.u1(th) > 0); }
  for (const th of [3.3, 4, 3 * PI / 2, 6.2]) { assert.equal(logic.conducting(th), 'D2'); assert.ok(logic.u2(th) > 0); }
  // and again in the next period
  assert.equal(logic.conducting(2 * PI + 1), 'D1');
  assert.equal(logic.halfAt(2 * PI + 1), 1);
  assert.equal(logic.halfAt(PI + 1), 2);
});

test('the output is |U1| = max(U1, U2): never negative, the conducting side\'s voltage', () => {
  for (let i = 1; i < 200; i++) {
    const th = i * logic.T_MAX / 200;
    const v = logic.ua(th);
    assert.ok(v >= 0, `θ = ${th}`);
    assert.ok(close(v, Math.abs(logic.u1(th))), `θ = ${th}`);
    const d = logic.conducting(th);
    if (d) assert.ok(close(v, d === 'D1' ? logic.u1(th) : logic.u2(th)), `θ = ${th}`);
  }
  // two humps per period: Ua peaks at π/2 and 3π/2
  assert.ok(close(logic.ua(PI / 2), 0.9));
  assert.ok(close(logic.ua(3 * PI / 2), 0.9));
});

test('the steps are the original\'s states, then both: none, 1st, 2nd half-period, both', () => {
  assert.equal(logic.steps, 3);
  assert.deepEqual(range().map((n) => at(n).half), [null, 1, 2, 'both']);
  assert.equal(at(3).last, true);
  assert.equal(at(2).last, false);
});

test('in each half-period one diode conducts and the other blocks; at step 3 they alternate', () => {
  assert.deepEqual(range().map((n) => [at(n).d1, at(n).d2]),
    [[null, null], ['conducts', 'blocks'], ['blocks', 'conducts'], ['alternate', 'alternate']]);
  assert.deepEqual(range().map((n) => at(n).paths), [[], ['D1'], ['D2'], ['D1', 'D2']]);
});

test('the positive end of the secondary is the conducting diode\'s: top in the 1st, bottom in the 2nd', () => {
  assert.deepEqual([at(1).top, at(1).bottom], ['+', '-']);
  assert.deepEqual([at(2).top, at(2).bottom], ['-', '+']);
});

test('the current through R flows the same way in every half-period', () => {
  assert.equal(at(1).load, 'down');
  assert.equal(at(2).load, 'down');
  assert.equal(at(3).load, 'down');
});

test('windows: the step\'s half-periods, as in the figures; at step 3 every half-period of the range', () => {
  assert.deepEqual(at(1).windows, [{ from: 0, to: PI, half: 1, diode: 'D1' }]);
  assert.deepEqual(at(2).windows, [{ from: PI, to: 2 * PI, half: 2, diode: 'D2' }]);
  const w = at(3).windows;
  assert.deepEqual(w.map((x) => [x.half, x.diode]), [[1, 'D1'], [2, 'D2'], [1, 'D1']]);
  // they tile 0 … 2.5π without gaps or overlap
  assert.equal(w[0].from, 0);
  for (let i = 1; i < w.length; i++) assert.equal(w[i].from, w[i - 1].to);
  assert.ok(close(w[w.length - 1].to, logic.T_MAX));
  // each window's diode is the one the model says conducts in its middle
  for (const x of w) assert.equal(logic.conducting((x.from + x.to) / 2), x.diode);
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
