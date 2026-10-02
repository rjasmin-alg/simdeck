// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the sampling-theorem model. Run: node --test sims/nyquist/
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
const maxError = (pts, f) => Math.max(...pts.map((p) => Math.abs(p.y - f(p.t))));

// ── rules of this model ──

test('tie-break: fs exactly 2f is the boundary, not the condition met', () => {
  assert.equal(logic.condition(2000), 'boundary');
  assert.equal(logic.condition(2025), 'ok');
  assert.equal(logic.condition(1975), 'alias');
  assert.equal(at({ fs: 2000 }).condition, 'boundary');
  assert.equal(at({ fs: 2000 }).shown, null);
});

test('at fs = 2f every sample is a zero crossing and the reconstruction is flat', () => {
  for (const s of at({ fs: 2000 }).samples) assert.ok(Math.abs(s.y) < 1e-9, `sample at ${s.t} ms`);
  assert.ok(maxError(logic.reconstruction(2, 300), () => 0) < 1e-9);
});

test('tie-break: alias frequency folds to the nearest multiple of fs, half rounding up', () => {
  assert.equal(logic.aliasFrequency(1, 1.5), 0.5);
  assert.ok(Math.abs(logic.aliasFrequency(1, 1.2) - 0.2) < 1e-12);
  assert.equal(logic.aliasFrequency(1, 1), 0);
  assert.equal(logic.aliasFrequency(1, 2), 1);   // f/fs = 0.5 rounds to k = 1: |1 − 2| = 1
  assert.equal(logic.aliasFrequency(1, 3), 1);   // above the limit the signal shows as itself
  assert.ok(Math.abs(logic.aliasFrequency(1, 0.3) - 0.1) < 1e-12);  // general fold, k = 3
});

test('Nyquist condition: fs > 2 kHz is met, below it aliases', () => {
  assert.equal(at({ fs: 8000 }).condition, 'ok');
  assert.equal(at({ fs: 2200 }).condition, 'ok');
  assert.equal(at({ fs: 1500 }).condition, 'alias');
  assert.equal(at({ fs: 1000 }).condition, 'alias');
  assert.equal(at({ fs: 3000 }).shown, 1);
  assert.equal(at({ fs: 1500 }).shown, 0.5);
  assert.equal(at({ fs: 1000 }).shown, 0);
});

test('above the limit the reconstruction matches the original signal', () => {
  for (const k of [8, 3, 2.2]) {
    const err = maxError(logic.reconstruction(k, 300), logic.signal);
    assert.ok(err < 0.03, `fs = ${k} kHz: error ${err}`);
  }
});

test('below the limit the reconstruction is the alias sine, not the original', () => {
  // 1 kHz sampled at 1.5 kHz: the samples equal those of sin(2π · (1 − 1.5) · t) = −sin(π t)
  const r = logic.reconstruction(1.5, 300);
  assert.ok(maxError(r, (t) => -Math.sin(Math.PI * t)) < 0.03);
  assert.ok(maxError(r, logic.signal) > 1);
  const r2 = logic.reconstruction(1.2, 300);
  assert.ok(maxError(r2, (t) => Math.sin(2 * Math.PI * -0.2 * t)) < 0.03);
});

test('at every slider value but the limit, the reconstruction is the folded sine within 0.05', () => {
  for (let hz = logic.FS_MIN; hz <= logic.FS_MAX; hz += logic.FS_STEP) {
    if (hz === 2000) continue;
    const k = hz / 1000, fa = 1 - Math.round(1 / k) * k;   // signed: the samples equal those of sin(2π · fa · t)
    const err = maxError(logic.reconstruction(k, 150), (t) => Math.sin(2 * Math.PI * fa * t));
    assert.ok(err < 0.05, `fs = ${hz} Hz: error ${err}`);
  }
});

test('samples sit at n / fs over the 3 ms window, including both ends', () => {
  const s = at({ fs: 3000 }).samples;
  assert.equal(s.length, 10);                           // 0, 1/3, …, 3 ms
  assert.equal(s[0].t, 0);
  assert.ok(Math.abs(s[9].t - 3) < 1e-12);
  assert.equal(at({ fs: 8000 }).samples.length, 25);
  assert.equal(at({ fs: 1500 }).samples.length, 5);
  for (const p of at({ fs: 2200 }).samples) assert.ok(Math.abs(p.y - logic.signal(p.t)) < 1e-12);
});

test('the reconstruction passes through every sample (sinc is 1 at 0 and 0 at other integers)', () => {
  assert.equal(logic.sinc(0), 1);
  assert.ok(Math.abs(logic.sinc(3)) < 1e-12);
  const k = 1.5, samples = logic.sample(k, -logic.MARGIN, logic.T_SHOW + logic.MARGIN);
  for (const p of logic.sample(k, 0, logic.T_SHOW)) assert.ok(Math.abs(logic.reconstruct(p.t, samples, k) - p.y) < 1e-9);
});

test('fs is clamped to the slider range and taken in whole hertz', () => {
  assert.equal(at({ fs: 500 }).fs, 1);
  assert.equal(at({ fs: 9000 }).fs, 8);
  assert.equal(at({ fs: 2000.4 }).condition, 'boundary');
});

test('presets are ordered from well above the limit down to fs = f', () => {
  const rates = logic.presets.map((p) => p.params.fs);
  assert.deepEqual(rates, [...rates].sort((a, b) => b - a));
  assert.deepEqual(logic.presets.map((p) => at(p.params).condition), ['ok', 'ok', 'ok', 'boundary', 'alias', 'alias', 'alias']);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const p of logic.presets) {
    const s = at(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ fs: 1725 });
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
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: param ${k}`);
    const fsHz = p.params.fs;
    assert.ok(fsHz >= logic.FS_MIN && fsHz <= logic.FS_MAX && (fsHz - logic.FS_MIN) % logic.FS_STEP === 0, `preset ${p.id} on the slider grid`);
  }
});
