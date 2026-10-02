// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the Fourier synthesis model and its projection. Run: node --test sims/fourier/
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
const preset = (id) => logic.initial(P(logic.presets.find((p) => p.id === id).params));
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
// sample a sum on a fine grid
const samples = (st, n = 2000) => Array.from({ length: n }, (_, i) => logic.sumAt(st.harmonics, i / n));

// ── rules of this model ──

test('tie-break: one line in the spectrum is "single", even when it is odd; none is "none"', () => {
  assert.equal(preset('sine').kind, 'single');
  assert.equal(at(Object.assign(logic.waves.none(9), { a3: 0.5 })).kind, 'single');   // 3 Hz alone: odd, still single
  assert.equal(preset('none').kind, 'none');
  assert.equal(preset('square').kind, 'odd');
  assert.equal(preset('triangle').kind, 'odd');
  assert.equal(preset('sawtooth').kind, 'mixed');
  assert.equal(preset('all').kind, 'mixed');
  assert.equal(at(Object.assign(logic.waves.none(9), { a2: 1, a4: 1 })).kind, 'mixed');  // even only is not "odd"
});

test('tie-break: harmonics beyond count are not part of the signal, but keep their values', () => {
  const p = P(logic.waves.all(30));
  const st = logic.initial(Object.assign({}, p, { count: 3 }));
  assert.equal(st.harmonics.length, 3);
  assert.deepEqual(st.active, [1, 2, 3]);
  assert.equal(p.a30, 1, 'the slider value of 30 Hz is untouched');
  assert.equal(logic.initial(Object.assign({}, p, { count: 30 })).active.length, 30);
});

test('tie-break: the selected harmonic is clamped to count', () => {
  assert.equal(at({ count: 5, sel: 9 }).sel, 5);
  assert.equal(at({ count: 5, sel: 0 }).sel, 1);
  assert.equal(at({ count: 9, sel: 4 }).sel, 4);
});

test('tie-break: an amplitude of 0 is silent whatever its phase; the state survives JSON (no −0)', () => {
  const st = at(Object.assign(logic.waves.none(9), { p1: 90, p2: 180, a3: -0, p3: -0 }));
  assert.equal(st.kind, 'none');
  assert.equal(st.peak, 0);
  assert.ok(!Object.is(st.peak, -0));
  for (const x of samples(st, 50)) assert.ok(x === 0);
  assert.deepEqual(JSON.parse(JSON.stringify(st)), st);
});

test('a component is a · sin(2π n t − φ), phase in degrees', () => {
  const hm = { n: 3, a: 0.5, phase: 90 };
  for (const tm of [0, 0.1, 0.37, 0.9]) {
    assert.ok(near(logic.component(hm, tm), 0.5 * Math.sin(2 * Math.PI * 3 * tm - Math.PI / 2)));
  }
  assert.ok(near(logic.component({ n: 1, a: 1, phase: 0 }, 0.25), 1));
  assert.ok(near(logic.component({ n: 1, a: 1, phase: 180 }, 0.25), -1), '180° inverts');
  assert.ok(near(logic.component({ n: 2, a: 1, phase: 0 }, 0.125), 1), '2 Hz peaks at 1/8 s');
});

test('the sum is the sum of the components at every instant', () => {
  const st = preset('sawtooth');
  for (const tm of [0, 0.05, 0.3, 0.71]) {
    const want = st.harmonics.reduce((y, hm) => y + logic.component(hm, tm), 0);
    assert.ok(near(logic.sumAt(st.harmonics, tm), want));
  }
});

test('square: odd harmonics at 1/n, phase 0; the sum tends to ±π/4, overshooting about 9 % of the jump', () => {
  const st = preset('square');
  for (const hm of st.harmonics) {
    assert.ok(near(hm.a, hm.n % 2 ? Math.round(1000 / hm.n) / 1000 : 0, 1e-12), `${hm.n} Hz`);
    assert.equal(hm.phase, 0);
  }
  assert.deepEqual(st.active, [1, 3, 5, 7, 9]);
  // in the middle of each half the 30-harmonic sum is close to π/4 and −π/4
  const s30 = preset('square-30');
  assert.ok(near(logic.sumAt(s30.harmonics, 0.25), Math.PI / 4, 0.04));
  assert.ok(near(logic.sumAt(s30.harmonics, 0.75), -Math.PI / 4, 0.04));
  // Gibbs: the peak stays about 9 % of the jump (π/2) above π/4, with 9 harmonics as with 30
  const over = (x) => (x.peak - Math.PI / 4) / (Math.PI / 2);
  assert.ok(over(s30) > 0.08 && over(s30) < 0.1, `overshoot ${over(s30)}`);
  assert.ok(over(st) > 0.07 && over(st) < 0.11, `overshoot ${over(st)}`);
  // more harmonics: a steeper edge (closer to the final value just after the jump)
  assert.ok(logic.sumAt(s30.harmonics, 0.02) > logic.sumAt(st.harmonics, 0.02));
});

test('sawtooth: every harmonic at 1/n, even ones inverted; it ramps up and drops at half the period', () => {
  const st = preset('sawtooth');
  for (const hm of st.harmonics) assert.equal(hm.phase, hm.n % 2 ? 0 : 180, `${hm.n} Hz`);
  assert.equal(st.active.length, 9);
  // rising through the middle of the first half, dropping at t = 0.5
  assert.ok(logic.sumAt(st.harmonics, 0.2) < logic.sumAt(st.harmonics, 0.3));
  assert.ok(logic.sumAt(st.harmonics, 0.48) > 1);
  assert.ok(logic.sumAt(st.harmonics, 0.52) < -1);
  assert.ok(near(logic.sumAt(st.harmonics, 0.5), 0, 1e-9));
});

test('triangle: odd harmonics at 1/n², every second inverted; its peak is Σ 1/n² (→ π²/8), and it is nearly straight', () => {
  const st = preset('triangle');
  assert.deepEqual(st.active, [1, 3, 5, 7, 9]);
  assert.deepEqual(st.harmonics.filter((hm) => hm.a > 0).map((hm) => hm.phase), [0, 180, 0, 180, 0]);
  // all components line up at t = 1/4: the peak is 1 + 1/9 + 1/25 + 1/49 + 1/81, short of π²/8 ≈ 1.234
  assert.ok(near(st.peak, 1 + 1 / 9 + 1 / 25 + 1 / 49 + 1 / 81, 2e-3), `peak ${st.peak}`);
  assert.ok(near(logic.sumAt(st.harmonics, 0.25), st.peak, 2e-3));
  // linear between the corners: equal steps in time give equal steps in value
  const y = [0.05, 0.1, 0.15].map((tm) => logic.sumAt(st.harmonics, tm));
  assert.ok(near(y[1] - y[0], y[2] - y[1], 0.01));
});

test('same spectrum, other phases: the amplitudes match the square, the signal does not', () => {
  const a = preset('square'), b = preset('square-phase');
  assert.deepEqual(b.harmonics.map((hm) => hm.a), a.harmonics.map((hm) => hm.a));
  assert.deepEqual(b.active, a.active);
  assert.equal(b.kind, a.kind);
  const diff = Math.max(...samples(a, 200).map((y, i) => Math.abs(y - samples(b, 200)[i])));
  assert.ok(diff > 0.5, `max difference ${diff}`);
  assert.ok(b.peak > a.peak + 0.5, 'the cosine sum piles up at t = 0');
});

test('the peak is the largest |sum| over the period, and the plot scale is 1 unless the sum goes beyond it', () => {
  const st = preset('all');
  const fine = Math.max(...samples(st, 6000).map(Math.abs));
  assert.ok(st.peak <= fine + 1e-12 && st.peak > fine - 0.05, `${st.peak} vs ${fine}`);
  assert.equal(st.scale, st.peak);
  assert.equal(preset('square').scale, 1);
  assert.equal(preset('sine').scale, 1);
  assert.ok(near(preset('sine').peak, 1, 1e-9));
});

test('params are clamped and snapped: count 1–30, amplitude 0–1, phase 0–355 in 5° steps', () => {
  assert.equal(at({ count: 0 }).count, 1);
  assert.equal(at({ count: 31 }).count, 30);
  assert.equal(at({ count: 4.6 }).count, 5);
  assert.equal(at({ a1: 2 }).harmonics[0].a, 1);
  assert.equal(at({ a1: -1 }).harmonics[0].a, 0);
  assert.equal(at({ p1: 400 }).harmonics[0].phase, 355);
  assert.equal(at({ p1: 92 }).harmonics[0].phase, 90);
  assert.equal(at({ a1: 'x' }).harmonics[0].a, 0);
});

test('lanes: harmonic 1 at the front, all inside 0 … 1 and evenly spaced', () => {
  for (const c of [1, 9, 30]) {
    const zs = Array.from({ length: c }, (_, i) => logic.laneZ(i + 1, c));
    assert.ok(zs[0] > zs[zs.length - 1] || c === 1);
    for (const zz of zs) assert.ok(zz > 0 && zz < 1);
    for (let i = 1; i < zs.length; i++) assert.ok(near(zs[i - 1] - zs[i], 1 / c));
  }
});

test('projection: the time view sees the sum plane face on with time to the right; the frequency view the spectrum, low to high', () => {
  const tv = logic.camera(logic.VIEWS.time.yaw, logic.VIEWS.time.pitch);
  const fv = logic.camera(logic.VIEWS.freq.yaw, logic.VIEWS.freq.pitch);
  assert.ok(logic.facing(tv, [0, 0, 1]) > 0.85 && logic.facing(tv, [1, 0, 0]) < 0.2);
  assert.ok(logic.facing(fv, [1, 0, 0]) > 0.85 && logic.facing(fv, [0, 0, 1]) < 0.2);
  const pt = (cam, p) => logic.project(cam, p);
  assert.ok(pt(tv, [1, 0.5, logic.FRONT]).x > pt(tv, [0, 0.5, logic.FRONT]).x, 'time runs to the right');
  assert.ok(pt(fv, [logic.SIDE, 0.5, logic.laneZ(9, 9)]).x > pt(fv, [logic.SIDE, 0.5, logic.laneZ(1, 9)]).x, 'frequency runs to the right');
  // up is up, and the sum plane is nearer than the far lane in the time view
  assert.ok(pt(tv, [0.5, 0.75, 1]).y > pt(tv, [0.5, 0.25, 1]).y);
  assert.ok(pt(tv, [0.5, 0.5, logic.FRONT]).depth < pt(tv, [0.5, 0.5, 0]).depth);
  // every corner of the scene is in front of the camera at any yaw
  for (let yaw = -180; yaw < 180; yaw += 15) {
    const cam = logic.camera(yaw, 24);
    for (const c of logic.box()) assert.ok(logic.project(cam, c).depth > 0);
  }
});

test('camera: the basis is orthonormal and the pitch is clamped', () => {
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  for (const [y, p] of [[45, 24], [-120, -10], [170, 55]]) {
    const c = logic.camera(y, p);
    for (const v of [c.back, c.right, c.up]) assert.ok(near(dot(v, v), 1));
    assert.ok(near(dot(c.back, c.right), 0) && near(dot(c.back, c.up), 0) && near(dot(c.right, c.up), 0));
  }
  assert.equal(logic.camera(0, 90).pitch, logic.PITCH_MAX);
  assert.equal(logic.camera(0, -90).pitch, logic.PITCH_MIN);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const p of logic.presets) {
    const st = at(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(st)), st, p.id);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ count: 12, sel: 4, a4: 0.3, p4: 45 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer has no steps');
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('every preset is valid for the model and sets every harmonic; the page meta is an explorer', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.equal(new Set(logic.presets.map((p) => p.id)).size, logic.presets.length);
  assert.ok(logic.presets.length <= 9, 'keys 1–9');
  for (const p of logic.presets) {
    assert.deepEqual(Object.keys(p.params).sort(), Object.keys(logic.defaults).sort(), `preset ${p.id} sets every param`);
    const st = at(p.params);
    assert.equal(st.count, p.params.count);
    for (const hm of st.harmonics) {
      assert.equal(hm.a, p.params[logic.aKey(hm.n)], `${p.id} a${hm.n} on the slider grid`);
      assert.equal(hm.phase, p.params[logic.pKey(hm.n)], `${p.id} p${hm.n} on the slider grid`);
    }
  }
});
