// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the I/Q signals model. Run: node --test sims/iq-signals/
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

// ── tie-breaks first ──

test('tie-break: I = Q = 0 is no signal; the phase is undefined (null), not atan2(0, 0) = 0°', () => {
  const s = at({ i: 0, q: 0 });
  assert.equal(s.none, true);
  assert.equal(s.a, 0);
  assert.equal(s.phi, null);
  assert.equal(s.phiRound, null);
  assert.equal(s.lead, 0);
  assert.deepEqual(s.peaks, []);
  assert.equal(at({ i: 5, q: 0 }).none, false);
  assert.equal(at({ i: 0, q: -5 }).none, false);
});

test('tie-break: φ is in (−180°, 180°]; negative I with Q = 0 is +180°, also from −0 and from rounding', () => {
  assert.equal(logic.polar(-100, 0).phi, 180);
  assert.equal(logic.polar(-100, -0).phi, 180, 'atan2(−0, −1) is −180°');
  assert.equal(at({ i: -100, q: '-0' }).phi, 180);
  assert.equal(logic.fold(-180), 180);
  assert.equal(logic.fold(540), 180);
  assert.equal(logic.fold(-190), 170);
  // a φ just above −180° that rounds to −180° is shown as 180°
  const near = logic.polar(-100, -0.5).phi;
  assert.ok(near > -180 && near < -179.5);
  assert.equal(logic.roundPhi(near), 180);
  assert.equal(logic.roundPhi(-179.4), -179);
  assert.equal(logic.roundPhi(null), null);
});

test('tie-break: I and Q clamp to −100 … 100 %, snap to 5 (a half step up), −0 is 0, a non-number is the default', () => {
  assert.equal(logic.clampLevel(-150, 7), -100);
  assert.equal(logic.clampLevel(130, 7), 100);
  assert.equal(logic.clampLevel(12.5, 7), 15);
  assert.equal(logic.clampLevel(12.4, 7), 10);
  assert.equal(logic.clampLevel(-12.5, 7), -10);
  assert.ok(Object.is(logic.clampLevel(-2, 7), 0), '−0 becomes 0');
  assert.equal(logic.clampLevel('45', 7), 45);
  for (const bad of ['abc', '', null, NaN, undefined, true, Infinity]) assert.equal(logic.clampLevel(bad, 7), 7, String(bad));
  const s = at({ i: 'x', q: 999 });
  assert.deepEqual([s.i, s.q], [logic.defaults.i, 100]);
});

test('tie-break: in phase (φ = 0°) and reversed (φ = 180°) neither lead nor lag', () => {
  assert.equal(at({ i: 50, q: 0 }).lead, 0);
  assert.equal(at({ i: -50, q: 0 }).lead, 0);
  assert.equal(at({ i: 0, q: 50 }).lead, 1);
  assert.equal(at({ i: -50, q: 5 }).lead, 1);
  assert.equal(at({ i: -50, q: -5 }).lead, -1);
  assert.equal(at({ i: 0, q: -50 }).lead, -1);
});

// ── the rules ──

test('the Q carrier is the I carrier shifted by 90°: Q · cos(ωt + 90°) = −Q · sin ωt', () => {
  for (const x of [-3, -1, 0, 0.7, 2, 5, 11]) {
    assert.ok(close(logic.qWave(80, x), -80 * Math.sin(x)));
    assert.ok(close(logic.iWave(80, x), 80 * Math.cos(x)));
    assert.ok(close(logic.qWave(80, x), 80 * Math.cos(x + Math.PI / 2)));
  }
});

test('the sum is one cosine of the same frequency, A · cos(ωt + φ), with A = √(I² + Q²) and φ = atan2(Q, I)', () => {
  for (const [i, q] of [[60, 80], [100, 0], [0, 100], [-70, 30], [-40, -90], [25, -100], [100, 100]]) {
    const s = at({ i, q });
    assert.ok(close(s.a, Math.hypot(i, q)), `A for ${i}, ${q}`);
    assert.ok(close(s.phi, Math.atan2(q, i) * 180 / Math.PI), `φ for ${i}, ${q}`);
    const ph = s.phi * Math.PI / 180;
    for (const p of logic.curve(i, q, 113)) {
      assert.ok(close(p.s, s.a * Math.cos(p.x + ph), 1e-9), `${i}, ${q} at ωt = ${p.x}`);
      assert.ok(close(p.s, p.i + p.q));
    }
    // the largest value of the sum over the window is A
    const top = Math.max(...logic.curve(i, q, 6000).map((p) => p.s));
    assert.ok(close(top, s.a, 1e-3 * s.a), `max of the sum for ${i}, ${q}`);
  }
});

test('the numbers the page shows: A and φ rounded to whole numbers, as in the original', () => {
  const s = at({ i: 60, q: 80 });
  assert.equal(s.aRound, 100);
  assert.equal(s.phiRound, 53);
  const e = at({ i: 70, q: 70 });
  assert.equal(e.aRound, 99);
  assert.equal(e.phiRound, 45);
  const c = at({ i: 100, q: 100 });
  assert.equal(c.aRound, 141);
  assert.equal(c.over, true);
  assert.equal(at({ i: 60, q: 80 }).over, false, 'exactly 100 % is not over');
  assert.equal(at({ i: 0, q: -100 }).phiRound, -90);
});

test('the sum peaks φ before the I carrier\'s peak (it leads for φ > 0), all peaks inside the window', () => {
  assert.deepEqual(logic.peaks(0).map((x) => x / Math.PI), [0, 2, 4], 'the reference marks: the I carrier\'s maxima');
  for (const phi of [-170, -90, -30, 45, 90, 180]) {
    const ps = logic.peaks(phi);
    assert.ok(ps.length >= 2);
    for (const x of ps) {
      assert.ok(x >= logic.X0 - 1e-9 && x <= logic.X1 + 1e-9);
      assert.ok(close(Math.cos(x + phi * Math.PI / 180), 1), `cos at a peak for φ = ${phi}`);
    }
    for (let k = 1; k < ps.length; k++) assert.ok(close(ps[k] - ps[k - 1], 2 * Math.PI));
    // the peak nearest the reference at 0 is at −φ: earlier for a positive φ
    const near = ps.reduce((a, x) => (Math.abs(x) < Math.abs(a) ? x : a));
    assert.ok(close(near, -phi * Math.PI / 180) || close(Math.abs(phi), 180), `φ = ${phi}`);
  }
  assert.ok(logic.peaks(90)[0] < 0);
  assert.deepEqual(at({ i: 0, q: 100 }).peaks, logic.peaks(90));
});

test('the window is ωt from −π to 4π, as in the original, at least 200 points per carrier period', () => {
  const pts = logic.curve(60, 80);
  assert.equal(pts.length, logic.POINTS + 1);
  assert.ok(close(pts[0].x, -Math.PI));
  assert.ok(close(pts[pts.length - 1].x, 4 * Math.PI));
  assert.ok(logic.POINTS / 2.5 >= 200);
});

test('presets: the start, only I, only Q, I = Q, negative I, the corner, and nothing', () => {
  const by = Object.fromEntries(logic.presets.map((p) => [p.id, at(p.params)]));
  assert.deepEqual(logic.presets[0].params, logic.defaults, 'the first preset is the start');
  assert.equal(by.start.aRound, 100);
  assert.equal(by.ionly.phi, 0);
  assert.equal(by.qonly.phi, 90);
  assert.equal(by.equal.phiRound, 45);
  assert.equal(by.reverse.phi, 180);
  assert.equal(by.corner.over, true);
  assert.equal(by.none.none, true);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const p of logic.presets) {
    const s = at(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ i: -35, q: 20 });
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
    assert.equal(logic.clampLevel(p.params.i, NaN), p.params.i, `preset ${p.id}: I on the slider`);
    assert.equal(logic.clampLevel(p.params.q, NaN), p.params.q, `preset ${p.id}: Q on the slider`);
  }
});
