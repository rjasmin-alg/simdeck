// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the wavelength and frequency model. Run: node --test sims/lambda-f/
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
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

// ── rules of this model ──

test('tie-break: at λ = 8 m the second crest lands on the window end and still counts', () => {
  const st = at({ cm: 800 });
  assert.deepEqual(st.crests, [2, 10]);
  assert.deepEqual(st.marker, { kind: 'crest', x1: 2, x2: 10 });
  // one centimetre more and the second crest is outside: the marker falls back to 0 … λ
  const over = at({ cm: 801 });
  assert.equal(over.crests.length, 1);
  assert.deepEqual(over.marker, { kind: 'zero', x1: 0, x2: 8.01 });
});

test('the marker spans exactly one wavelength, from crest to crest when two fit', () => {
  for (let cm = logic.CM_MIN; cm <= logic.CM_MAX; cm++) {
    const st = at({ cm });
    assert.ok(near(st.marker.x2 - st.marker.x1, st.lambda), `${cm} cm`);
    assert.ok(st.marker.x2 <= logic.WINDOW + 1e-9, `${cm} cm inside the window`);
    if (st.marker.kind === 'crest') {
      assert.ok(near(logic.wave(st.marker.x1, st.lambda), 1, 1e-12));
      assert.ok(near(logic.wave(st.marker.x2, st.lambda), 1, 1e-12));
    } else {
      assert.ok(cm > 800, `${cm} cm: two crests fit, so the marker should go crest to crest`);
    }
  }
});

test('crests sit at λ/4 + kλ, every one inside the window, none missing', () => {
  const st = at({ cm: 300 });
  assert.deepEqual(st.crests.map((x) => +x.toFixed(9)), [0.75, 3.75, 6.75, 9.75]);
  assert.equal(at({ cm: 50 }).crests.length, 20);
  assert.equal(at({ cm: 1000 }).crests.length, 1);
  for (const c of at({ cm: 137 }).crests) assert.ok(near(logic.wave(c, 1.37), 1, 1e-12));
});

test('f = c / λ with c = 299.792458 m·MHz', () => {
  assert.ok(near(at({ cm: 100 }).f, 299.792458));
  assert.ok(near(at({ cm: 200 }).f, 149.896229));
  assert.ok(near(at({ cm: 1000 }).f, 29.9792458));
  assert.ok(near(at({ cm: 50 }).f, 599.584916));
  for (let cm = logic.CM_MIN; cm <= logic.CM_MAX; cm += 7) {
    const st = at({ cm });
    assert.ok(near(st.f * st.lambda, logic.C, 1e-9), `${cm} cm: f · λ = c`);
  }
});

test('half the wavelength, twice the frequency: the halving presets double f each time', () => {
  const chain = ['m8', 'm4', 'm2', 'm1', 'cm50'].map((id) => at(logic.presets.find((p) => p.id === id).params));
  for (let i = 1; i < chain.length; i++) {
    assert.equal(chain[i].lambda * 2, chain[i - 1].lambda);
    assert.ok(near(chain[i].f, 2 * chain[i - 1].f));
  }
  // and f falls strictly as λ grows, over the whole slider
  for (let cm = logic.CM_MIN + 1; cm <= logic.CM_MAX; cm++) assert.ok(at({ cm }).f < at({ cm: cm - 1 }).f);
});

test('the rule of thumb 300 / λ is about 0.07 % above the exact frequency', () => {
  assert.equal(at({ cm: 300 }).fRule, 100);
  assert.equal(at({ cm: 200 }).fRule, 150);
  for (let cm = logic.CM_MIN; cm <= logic.CM_MAX; cm += 13) {
    const st = at({ cm });
    const rel = st.fRule / st.f - 1;
    assert.ok(rel > 0.00069 && rel < 0.0007, `${cm} cm: ${rel}`);
  }
});

test('λ is taken in whole centimetres, clamped to the slider range 0.5 … 10 m', () => {
  assert.equal(at({ cm: 10 }).cm, 50);
  assert.equal(at({ cm: 5000 }).cm, 1000);
  assert.equal(at({ cm: 123.6 }).cm, 124);
  assert.equal(at({ cm: '69' }).lambda, 0.69);
  assert.equal(at({ cm: 'x' }).cm, 50);
  assert.equal(at({ cm: 57 }).lambda, 0.57);
});

test('the window holds 10 / λ wavelengths, and the curve starts at zero, rising', () => {
  assert.equal(at({ cm: 200 }).periods, 5);
  assert.equal(at({ cm: 800 }).periods, 1.25);
  const cv = logic.curve(2, 48, 400);
  assert.equal(cv[0].x, 0);
  assert.equal(cv[0].y, 0);
  assert.ok(cv[1].y > 0);
  assert.equal(cv[cv.length - 1].x, logic.WINDOW);
  // at least 48 points per wavelength even at the shortest λ
  assert.ok(logic.curve(0.5, 48, 400).length - 1 >= 20 * 48);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const p of logic.presets) {
    const st = at(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(st)), st);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ cm: 345 });
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
    assert.equal(at(p.params).cm, p.params.cm, `preset ${p.id} in range`);
  }
});
