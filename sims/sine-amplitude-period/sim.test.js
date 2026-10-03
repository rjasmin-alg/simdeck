// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the sine amplitude and period model. Run: node --test sims/sine-amplitude-period/
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
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// ── rules of this model ──

test('tie-break: a = 0 is a flat line, with no crest and no half-wave marked', () => {
  const s = at({ a: 0, T: 4 });
  assert.equal(s.flat, true);
  assert.equal(s.crest, null);
  assert.deepEqual(s.halves, []);
  assert.equal(s.T, 4, 'the period is still set');
  for (const p of logic.curve(0, 4, 50)) assert.equal(Math.abs(p.y), 0);
  assert.equal(at({ a: 1 }).flat, false);
});

test('tie-break: a and T are clamped to the sliders, a fraction rounds half up, a non-number is the default', () => {
  assert.equal(logic.clampA(-5), 0);
  assert.equal(logic.clampA(150), 100);
  assert.equal(logic.clampA(49.5), 50);
  assert.equal(logic.clampA(49.4), 49);
  assert.equal(logic.clampA('abc'), logic.defaults.a);
  assert.equal(logic.clampA(''), logic.defaults.a);
  assert.equal(logic.clampA(null), logic.defaults.a);
  assert.equal(logic.clampA('30'), 30);
  assert.equal(logic.clampT(0), 1);
  assert.equal(logic.clampT(11), 10);
  assert.equal(logic.clampT(2.5), 3);
  assert.equal(logic.clampT(NaN), logic.defaults.T);
  assert.deepEqual([at({ a: 500, T: -3 }).a, at({ a: 500, T: -3 }).T], [100, 1]);
});

test('tie-break: the wave starts on the zero line going up, so the first period runs 0 … T and the crest is at T/4', () => {
  for (const T of [1, 3, 10]) {
    const s = at({ a: 60, T });
    assert.equal(logic.value(0, 60, T), 0);
    assert.ok(logic.value(T / 100, 60, T) > 0, 'going up at t = 0');
    assert.deepEqual(s.period, { t1: 0, t2: T });
    assert.equal(s.crest.t, T / 4);
    assert.ok(close(logic.value(s.crest.t, 60, T), 60));
  }
});

test('the amplitude is the greatest distance from the zero line, up and down', () => {
  for (const a of [1, 25, 50, 100]) {
    const ys = logic.curve(a, 4, 4800).map((p) => p.y);
    assert.ok(close(Math.max(...ys), a, 1e-6), `a = ${a}: crest`);
    assert.ok(close(Math.min(...ys), -a, 1e-6), `a = ${a}: trough`);
    assert.equal(at({ a }).crest.y, a);
  }
});

test('the period: the wave repeats after T, and the amplitude does not change it', () => {
  for (const T of [1, 2, 7, 10]) {
    for (const t of [0.3, 1.1, 5.5]) assert.ok(close(logic.value(t + T, 50, T), logic.value(t, 50, T), 1e-9));
    // not after half a period: there it is the mirror image (the negative half-wave)
    assert.ok(close(logic.value(0.3 + T / 2, 50, T), -logic.value(0.3, 50, T), 1e-9));
  }
  assert.equal(at({ a: 10, T: 4 }).f, at({ a: 90, T: 4 }).f);
  assert.equal(at({ a: 10, T: 4 }).periods, at({ a: 90, T: 4 }).periods);
});

test('the half-waves: positive over the first half of the period, negative over the second', () => {
  const s = at({ a: 50, T: 6 });
  assert.deepEqual(s.halves, [{ sign: 1, t1: 0, t2: 3 }, { sign: -1, t1: 3, t2: 6 }]);
  for (const hw of s.halves) {
    for (const f of [0.1, 0.5, 0.9]) {
      const y = logic.value(hw.t1 + f * (hw.t2 - hw.t1), 50, 6);
      assert.equal(Math.sign(y), hw.sign);
    }
  }
});

test('f = 1/T, and 24 s hold 24/T periods', () => {
  const want = { 1: 1, 2: 0.5, 4: 0.25, 5: 0.2, 8: 0.125, 10: 0.1 };
  for (const [T, f] of Object.entries(want)) {
    const s = at({ T: Number(T) });
    assert.ok(close(s.f, f), `T = ${T}`);
    assert.ok(close(s.f * s.T, 1));
    assert.ok(close(s.periods, 24 / T));
  }
  assert.equal(at({ T: 7 }).whole, 3);
  assert.equal(at({ T: 8 }).whole, 3);
  assert.equal(at({ T: 1 }).whole, 24);
});

test('the drawn curve spans 0 … 24 s with enough points per period', () => {
  const pts = logic.curve(50, 1);
  assert.equal(pts.length, logic.POINTS + 1);
  assert.equal(pts[0].t, 0);
  assert.equal(pts[pts.length - 1].t, logic.WINDOW);
  assert.ok(logic.POINTS / (logic.WINDOW / logic.T_MIN) >= 32, 'at least 32 points per period at T = 1 s');
  assert.equal(logic.curve(50, 1, 10).length, 11);
});

test('presets: the period doubles at a fixed amplitude, then the amplitude changes at a fixed period', () => {
  const ps = logic.presets.map((p) => p.params);
  assert.deepEqual(ps.slice(0, 4).map((p) => p.T), [1, 2, 4, 8]);
  assert.ok(ps.slice(0, 4).every((p) => p.a === ps[0].a));
  assert.ok(ps.slice(4).every((p) => p.T === ps[4].T));
  assert.deepEqual(ps.slice(4).map((p) => p.a), [100, 25, 0]);
  assert.deepEqual(ps[0], logic.defaults, 'the first preset is the original\'s start');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const p of logic.presets) {
    const s = at(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ a: 37, T: 6 });
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
    assert.equal(logic.clampA(p.params.a), p.params.a, `preset ${p.id}: a on the slider`);
    assert.equal(logic.clampT(p.params.T), p.params.T, `preset ${p.id}: T on the slider`);
  }
});
