// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the QPSK-with-noise model. Run: node --test sims/qpsk/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps);

// ── tie-breaks first ──

test('tie-break: a point exactly on an axis counts to the positive side', () => {
  assert.equal(logic.decide(0, 0), '11');
  assert.equal(logic.decide(0, -0.5), '10');
  assert.equal(logic.decide(-0.5, 0), '01');
  assert.equal(logic.decide(-0, -0), '11');
  // just off the axis goes by the sign
  assert.equal(logic.decide(-1e-9, -1e-9), '00');
});

test('tie-break: the phase of a point on the positive I axis is 0°, never 360°', () => {
  assert.equal(logic.phase(1, 0), 0);
  assert.equal(logic.phase(1, -0), 0);
  assert.ok(Math.abs(logic.phase(1, -1e-12) - 360) < 1e-6);
  assert.equal(logic.phase(0, -1), 270);
});

// ── rules of this model ──

test('the mapping is the original\'s: 11 at 45°, 01 at 135°, 00 at 225°, 10 at 315°, on the circle of radius √2', () => {
  assert.deepEqual(logic.ORDER, ['11', '01', '00', '10']);
  for (const bits of logic.ORDER) {
    const m = logic.MAPPING[bits];
    assert.equal(logic.phase(m.i, m.q), m.angle);
    assert.equal(Math.hypot(m.i, m.q), Math.SQRT2);
    assert.equal(logic.decide(m.i, m.q), bits, 'an ideal point is decided as itself');
  }
});

test('the mapping is a Gray code: neighbours differ in one bit, opposite symbols in two', () => {
  const o = logic.ORDER;
  for (let k = 0; k < 4; k++) {
    assert.equal(logic.bitErrors(o[k], o[(k + 1) % 4]), 1);
    assert.equal(logic.bitErrors(o[k], o[(k + 2) % 4]), 2);
  }
  assert.equal(logic.bitErrors('11', '11'), 0);
});

test('the bit string: four shuffled groups, each holding every symbol once', () => {
  for (const seed of [1, 2, 25, 37, 999]) {
    const { sent, noise } = logic.plan(seed);
    assert.equal(sent.length, logic.steps);
    assert.equal(noise.length, logic.steps);
    for (let g = 0; g < logic.GROUPS; g++) assert.deepEqual(sent.slice(4 * g, 4 * g + 4).sort(), ['00', '01', '10', '11']);
  }
  assert.notDeepEqual(logic.plan(1).sent, logic.plan(2).sent, 'another seed, another bit string');
});

test('tie-break: a draw of exactly 0 is skipped (log 0 would be −∞)', () => {
  const seq = (xs) => { let k = 0; return () => xs[k++]; };
  const g = logic.gaussian(seq([0, 0.5, 0, 0.25]));   // u = 0.5, v = 0.25 after the zeros
  assert.ok(Number.isFinite(g));
  assert.ok(Math.abs(g - Math.sqrt(-2 * Math.log(0.5)) * Math.cos(Math.PI / 2)) < 1e-12);
});

test('the noise draws are standard normal (mean ≈ 0, deviation ≈ 1 over many seeds)', () => {
  const xs = [];
  for (let seed = 1; seed <= 400; seed++) for (const g of logic.plan(seed).noise) xs.push(g[0], g[1]);
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
  assert.ok(Math.abs(mean) < 0.03, `mean ${mean}`);
  assert.ok(Math.abs(sd - 1) < 0.03, `sd ${sd}`);
});

test('step n sends symbol n: ideal point plus σ × its noise draws, σ = noise % / 100', () => {
  const p = P({ noise: 30, seed: 7 });
  const pl = logic.plan(7);
  for (let n = 1; n <= logic.steps; n++) {
    const s = kit.stateAt(logic, p, n), pt = s.received[n - 1], m = logic.MAPPING[pl.sent[n - 1]];
    assert.equal(s.received.length, n);
    assert.equal(pt.bits, pl.sent[n - 1]);
    assert.ok(Math.abs(pt.i - (m.i + 0.3 * pl.noise[n - 1][0])) < 1e-4);
    assert.ok(Math.abs(pt.q - (m.q + 0.3 * pl.noise[n - 1][1])) < 1e-4);
    assert.equal(pt.decided, logic.decide(pt.i, pt.q));
  }
  assert.equal(at({}, 0).received.length, 0);
});

test('without noise every point is on its ideal symbol and nothing is wrong', () => {
  const s = end({ noise: 0 });
  for (const pt of s.received) {
    assert.equal(pt.i, logic.MAPPING[pt.bits].i);
    assert.equal(pt.q, logic.MAPPING[pt.bits].q);
    assert.equal(pt.decided, pt.bits);
  }
  assert.equal(s.symbolErrors, 0);
  assert.equal(s.bitErrors, 0);
});

test('the tally counts wrong symbols and wrong bits up to this step', () => {
  for (const over of [{ noise: 60 }, { noise: 60, seed: 37 }, { noise: 45 }]) {
    for (let n = 0; n <= logic.steps; n++) {
      const s = at(over, n);
      assert.equal(s.symbolErrors, s.received.filter((x) => x.decided !== x.bits).length);
      assert.equal(s.bitErrors, s.received.reduce((a, x) => a + logic.bitErrors(x.bits, x.decided), 0));
      for (const x of s.received) assert.equal(x.bitErrors, logic.bitErrors(x.bits, x.decided));
    }
  }
});

test('changing the noise keeps the bit string and moves the same points along their noise direction', () => {
  const a = end({ noise: 10 }), b = end({ noise: 40 });
  assert.deepEqual(a.sent, b.sent);
  for (let k = 0; k < logic.steps; k++) {
    const m = logic.MAPPING[a.sent[k]];
    assert.ok(Math.abs((b.received[k].i - m.i) - 4 * (a.received[k].i - m.i)) < 1e-3);
  }
});

test('the presets tell the story: none wrong up to 30 %, two at 45 %, five single-bit at 60 %, two bits at seed 37', () => {
  const byId = Object.fromEntries(logic.presets.map((p) => [p.id, end(p.params)]));
  assert.equal(byId.clean.symbolErrors, 0);
  assert.equal(byId.original.symbolErrors, 0);
  assert.equal(end({ noise: 30 }).symbolErrors, 0);
  assert.deepEqual([byId.strong.symbolErrors, byId.strong.bitErrors], [2, 2]);
  assert.deepEqual([byId.max.symbolErrors, byId.max.bitErrors], [5, 5]);
  assert.deepEqual([byId.twoBits.symbolErrors, byId.twoBits.bitErrors], [1, 2]);
  assert.equal(byId.twoBits.received[1].bitErrors, 2, 'the opposite quadrant at symbol 2');
});

test('params are clamped: noise to 0 … 60 %, the seed to a whole number ≥ 1', () => {
  assert.equal(logic.initial({ noise: 99, seed: 1 }).sigma, 0.6);
  assert.equal(logic.initial({ noise: -5, seed: 1 }).sigma, 0);
  assert.equal(logic.initial({ noise: 'x', seed: 1 }).sigma, 0);
  assert.deepEqual(logic.initial({ noise: 18, seed: 0 }).sent, logic.initial({ noise: 18, seed: 1 }).sent);
  assert.deepEqual(logic.initial({ noise: 18, seed: 2.4 }).sent, logic.initial({ noise: 18, seed: 2 }).sent);
});

test('mulberry32 is Simdeck.rng', () => {
  const a = logic.rng(12345), b = kit.rng(12345);
  for (let k = 0; k < 20; k++) assert.equal(a(), b());
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const p of logic.presets) {
    for (let n = 0; n <= logic.steps; n++) {
      const s = at(p.params, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ noise: 52, seed: 11 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ noise: 40 });
  const s1 = kit.stateAt(logic, p, 1);
  const copy = structuredClone(s1);
  logic.step(s1, 2, p);
  assert.deepEqual(s1, copy);
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('every preset is valid for the model, and the page meta matches', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'stepper');
  assert.equal(meta.steps, logic.steps);
  assert.ok(logic.steps <= 20);
  assert.equal(new Set(logic.presets.map((p) => p.id)).size, logic.presets.length);
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: param ${k}`);
    assert.equal(at(p.params, 0).sigma, p.params.noise / 100, `preset ${p.id} noise in range`);
  }
});
