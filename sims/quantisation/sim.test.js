// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the sampling and quantisation model. Run: node --test sims/quantisation/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => logic.initial(P(over));
const q = (v, b) => logic.quantise(v, b).q;

// ── rules of this model ──

test('tie-break: a value on a decision boundary goes to the level above', () => {
  // 2 bits: levels −75, −25, 25, 75 %; boundaries at −50, 0, 50 %
  assert.equal(q(0, 2), 0.25);
  assert.equal(q(0.5, 2), 0.75);
  assert.equal(q(-0.5, 2), -0.25);
  assert.equal(q(0, 1), 0.5);
  assert.equal(q(-1e-12, 1), -0.5);
});

test('tie-break: the ends −1 and +1 go to the lowest and highest level', () => {
  for (const b of [1, 3, 16]) {
    const L = 2 ** b;
    assert.equal(logic.quantise(1, b).k, L - 1, `${b} bits, +1`);
    assert.equal(logic.quantise(-1, b).k, 0, `${b} bits, −1`);
    assert.equal(q(1, b), 1 - 1 / L);
  }
});

test('tie-break: zero crossings are exact, so they sit on the boundary and not beside it', () => {
  assert.equal(logic.signalAt(1, 2), 0);     // Math.sin(π) would be 1.2e-16
  assert.equal(logic.signalAt(2, 2), 0);
  assert.equal(logic.signalAt(4, 16), 1);
  assert.equal(logic.signalAt(12, 16), -1);
  assert.equal(logic.signalAt(-4, 16), -1);
  assert.ok(Math.abs(logic.signalAt(3, 16) - Math.sin(2 * Math.PI * 3 / 16)) < 1e-15);
});

test('b bits give exactly 2^b output levels, Δ = 2 / 2^b apart, symmetric about zero', () => {
  for (let b = logic.BITS_MIN; b <= 8; b++) {
    const lv = logic.levelsOf(b), d = 2 / 2 ** b;
    assert.equal(lv.length, 2 ** b);
    for (let i = 1; i < lv.length; i++) assert.ok(Math.abs(lv[i] - lv[i - 1] - d) < 1e-12);
    assert.ok(Math.abs(lv[0] + lv[lv.length - 1]) < 1e-12);
  }
  // every sample's level is one of them, and its code is its index
  const st = at({ rate: 10, bits: 3 }), lv = logic.levelsOf(3);
  const used = new Set(st.samples.map((s) => s.k));
  assert.equal(used.size, 8);
  for (const s of st.samples) assert.equal(s.q, lv[s.k]);
});

test('each sample goes to the nearest level: the error is at most Δ/2 at every setting', () => {
  for (let rate = logic.RATE_MIN; rate <= logic.RATE_MAX; rate++) {
    for (let bits = logic.BITS_MIN; bits <= logic.BITS_MAX; bits++) {
      const st = at({ rate, bits });
      assert.ok(st.maxError <= st.errorBound + 1e-12, `rate ${rate}, ${bits} bits: ${st.maxError} > ${st.errorBound}`);
      for (const s of st.samples) {
        const best = Math.min(...logic.levelsOf(Math.min(bits, 10)).map((l) => Math.abs(l - s.v)));
        if (bits <= 10) assert.ok(Math.abs(Math.abs(s.q - s.v) - best) < 1e-12, `rate ${rate}, ${bits} bits, n ${s.n}`);
      }
    }
  }
});

test('each extra bit halves the step and the error bound', () => {
  for (let b = 1; b < 16; b++) {
    assert.equal(at({ bits: b }).delta, 2 * at({ bits: b + 1 }).delta);
    assert.equal(at({ bits: b }).errorBound, at({ bits: b }).delta / 2);
  }
  assert.equal(at({ bits: 1 }).delta, 1);       // 100 %
  assert.equal(at({ bits: 3 }).delta, 0.25);    // 25 %
});

test('fs = 2^rate samples/s, one every 1/fs, over the 1 s window including both ends', () => {
  const st = at({ rate: 4 });
  assert.equal(st.fs, 16);
  assert.equal(st.ts, 1 / 16);
  assert.equal(st.samples.length, 17);
  assert.equal(st.samples[0].t, 0);
  assert.equal(st.samples[16].t, 1);
  assert.equal(at({ rate: 10 }).samples.length, 1025);
  assert.equal(at({ rate: 1 }).samples.length, 3);
});

test('the D/A output holds each level until the next sample, the last to the window end', () => {
  const st = at({ rate: 2, bits: 2 });   // 4 samples/s: 0, 0.25, 0.5, 0.75, 1 s
  const hd = logic.held(st.samples);
  assert.equal(hd.length, 2 * st.samples.length);
  assert.deepEqual(hd.slice(0, 4), [{ t: 0, y: 0.25 }, { t: 0.25, y: 0.25 }, { t: 0.25, y: 0.75 }, { t: 0.5, y: 0.75 }]);
  assert.deepEqual(hd[hd.length - 1], { t: 1, y: 0.25 });
});

test('one bit turns the sine into a square wave of ±50 %', () => {
  const st = at({ rate: 10, bits: 1 });
  for (const s of st.samples) assert.equal(s.q, s.v >= 0 ? 0.5 : -0.5);
});

test('two samples per period both land on zero crossings: the output is flat, the page says so', () => {
  const st = at({ rate: 1, bits: 16 });
  assert.equal(st.atLimit, true);
  for (const s of st.samples) assert.equal(s.v, 0);
  assert.equal(new Set(st.samples.map((s) => s.q)).size, 1);
  assert.equal(at({ rate: 2 }).atLimit, false);
});

test('params are clamped to the slider ranges and taken as whole numbers', () => {
  assert.equal(at({ rate: 0 }).fs, 2);
  assert.equal(at({ rate: 12 }).fs, 1024);
  assert.equal(at({ bits: 0 }).bits, 1);
  assert.equal(at({ bits: 20 }).bits, 16);
  assert.equal(at({ rate: 3.6, bits: '4' }).fs, 16);
  assert.equal(at({ rate: 3.6, bits: '4' }).bits, 4);
});

test('SNR rule of thumb: 6.02 dB per bit plus 1.76 dB', () => {
  assert.ok(Math.abs(at({ bits: 16 }).snr - 98.08) < 1e-9);
  assert.ok(Math.abs(at({ bits: 1 }).snr - 7.78) < 1e-9);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const p of logic.presets) {
    const st = at(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(st)), st);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ rate: 5, bits: 7 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer has no steps');
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('every preset is valid for the model, and the page meta is an explorer', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.equal(new Set(logic.presets.map((p) => p.id)).size, logic.presets.length);
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: param ${k}`);
    const st = at(p.params);
    assert.equal(st.rate, p.params.rate, `preset ${p.id} rate in range`);
    assert.equal(st.bits, p.params.bits, `preset ${p.id} bits in range`);
  }
});
