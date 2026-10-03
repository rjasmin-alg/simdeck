// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the skip-distance model. Run: node --test sims/skip-distance/
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

// ── tie-breaks first ──

test('tie-break: 0° is "grazing" and the longest hop at its height; 1° is already oblique and shorter', () => {
  for (const height of [100, 110, 300, 400]) {
    const st = at({ angle: 0, height });
    assert.equal(st.kind, 'grazing');
    assert.equal(st.exact, logic.hopKm(0, height));
    assert.equal(st.km, st.maxKm);
    const one = at({ angle: 1, height });
    assert.equal(one.kind, 'oblique');
    assert.ok(one.exact < st.exact, `${height} km`);
  }
});

test('tie-break: 90° is "vertical" and exactly 0 km at every height; 89° is oblique and not 0', () => {
  for (let height = logic.H_MIN; height <= logic.H_MAX; height += logic.H_STEP) {
    const st = at({ angle: 90, height });
    assert.equal(st.kind, 'vertical');
    assert.equal(st.beta, 0);
    assert.equal(st.exact, 0);
    assert.equal(st.km, 0);
    const near90 = at({ angle: 89, height });
    assert.equal(near90.kind, 'oblique');
    assert.ok(near90.exact > 0);
  }
  // the half-angle is never negative, even where floating point would make it so
  for (let a = 0; a <= 90; a += 0.25) assert.ok(logic.halfAngle(a, 300) >= 0, `${a}°`);
  assert.equal(logic.halfAngle(90, 300), 0);
});

test('tie-break: distances round to the nearest 10 km, halves up', () => {
  assert.equal(logic.round10(3835.8), 3840);
  assert.equal(logic.round10(3834.9), 3830);
  assert.equal(logic.round10(2195), 2200);
  assert.equal(logic.round10(0), 0);
});

// ── rules of this model ──

test('the hop is d = 2R·(arccos(R·cos α/(R + h)) − α), checked against the triangle by the law of sines', () => {
  const R = logic.R;
  for (const height of [110, 200, 300, 400]) {
    for (let angle = 0; angle < 90; angle += 5) {
      const b = logic.halfAngle(angle, height);
      // in the triangle centre–antenna–turning point, the angle at the antenna is 90° + α, at the turning point
      // 90° − α − β; the law of sines then says R / sin(turn) = (R + h) / sin(antenna)
      const a = angle * Math.PI / 180;
      assert.ok(near(R / Math.sin(Math.PI / 2 - a - b), (R + height) / Math.sin(Math.PI / 2 + a), 1e-6), `${angle}°, ${height} km`);
      assert.ok(near(logic.hopKm(angle, height), 2 * R * b, 1e-9));
    }
  }
});

test('the numbers: E region ~2350 km and F2 ~3840 km at 0°, as the section\'s "up to 2000 / 4000 km"', () => {
  assert.equal(logic.R, 6371);
  assert.equal(at({ angle: 0, height: 110 }).km, 2350);
  assert.equal(at({ angle: 0, height: 300 }).km, 3840);
  assert.equal(at({ angle: 0, height: 400 }).km, 4400);
  assert.equal(at({ angle: 10, height: 300 }).km, 2190);
  assert.equal(at({ angle: 30, height: 300 }).km, 930);
  assert.equal(at({ angle: 60, height: 300 }).km, 330);
  assert.equal(at({ angle: 10, height: 110 }).km, 1000);
  // the longest hop is the height's, whatever the angle
  assert.equal(at({ angle: 10, height: 300 }).maxKm, 3840);
  assert.equal(at({ angle: 90, height: 110 }).maxKm, 2350);
  // a real antenna hardly radiates below a few degrees: at 4° the E region gives ~1620 km, F2 ~3050 km
  assert.equal(logic.round10(logic.hopKm(4, 110)), 1620);
  assert.equal(logic.round10(logic.hopKm(4, 300)), 3050);
});

test('the flatter the angle, the longer the hop (at every height)', () => {
  for (const height of [100, 110, 250, 300, 400]) {
    let prev = Infinity;
    for (let angle = 0; angle <= 90; angle++) {
      const d = logic.hopKm(angle, height);
      assert.ok(d < prev, `${height} km, ${angle}°`);
      prev = d;
    }
  }
});

test('the higher the region, the longer the hop (at every angle below 90°)', () => {
  for (let angle = 0; angle < 90; angle += 3) {
    let prev = -Infinity;
    for (let height = logic.H_MIN; height <= logic.H_MAX; height += logic.H_STEP) {
      const d = logic.hopKm(angle, height);
      assert.ok(d > prev, `${angle}°, ${height} km`);
      prev = d;
    }
  }
});

test('on a flat Earth the hop would be 2h/tan α (endless at 0°); the curved Earth makes it shorter, most at flat angles', () => {
  for (const height of [110, 300]) {
    let prev = 0;
    for (let angle = 1; angle < 90; angle++) {
      const flat = 2 * height / Math.tan(angle * Math.PI / 180);
      const ratio = logic.hopKm(angle, height) / flat;
      assert.ok(ratio < 1 && ratio > prev, `${angle}°, ${height} km`);
      prev = ratio;
    }
    // steep: only the ground being R/(R + h) of the arc at the region's height is left
    assert.ok(near(prev, logic.R / (logic.R + height), 1e-3), `${height} km: ${prev}`);
  }
});

test('the curve runs 0 … 90° with at least one point per degree, matching hopKm', () => {
  const cv = logic.curve(300, 0);
  assert.equal(cv.length, 91);
  assert.equal(cv[0].angle, 0);
  assert.equal(cv[90].angle, 90);
  assert.equal(cv[90].km, 0);
  for (const q of cv) assert.equal(q.km, logic.hopKm(q.angle, 300));
  assert.equal(logic.curve(110, 360).length, 361);
});

test('params are whole degrees 0 … 90 and heights 100 … 400 km in 10 km steps, clamped', () => {
  assert.equal(at({ angle: -5 }).angle, 0);
  assert.equal(at({ angle: 120 }).angle, 90);
  assert.equal(at({ angle: 9.6 }).angle, 10);
  assert.equal(at({ angle: 'x' }).angle, 0);
  assert.equal(at({ height: 50 }).height, 100);
  assert.equal(at({ height: 999 }).height, 400);
  assert.equal(at({ height: 304 }).height, 300);
  assert.equal(at({ height: 305 }).height, 310);
  assert.equal(at({ height: '110' }).height, 110);
});

test('the defaults are the original applet\'s 0°, at an F2 height of 300 km', () => {
  assert.deepEqual(logic.defaults, { angle: 0, height: 300 });
  assert.deepEqual(logic.presets[0].params, logic.defaults);
  assert.equal(logic.E_KM, 110);
  assert.equal(logic.F2_KM, 300);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and at the edges', () => {
  for (const params of logic.presets.map((p) => p.params).concat([{ angle: 90, height: 100 }, { angle: 0, height: 400 }])) {
    const st = at(params);
    assert.deepEqual(JSON.parse(JSON.stringify(st)), st);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ angle: 37, height: 230 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer has no steps');
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
  for (const lang of ['hr', 'en']) {
    for (const k of ['grazing', 'vertical', 'oblique']) assert.ok(strings[lang]['cap_' + k], `${lang} cap_${k}`);
  }
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
    assert.equal(st.angle, p.params.angle, `preset ${p.id} in range`);
    assert.equal(st.height, p.params.height, `preset ${p.id} in range`);
  }
});
