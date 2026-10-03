// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the I/Q phasor model. Run: node --test sims/iq-phasor/
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
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// ── tie-breaks first ──

test('tie-break: A = 0 is no signal: both projections 0 at every step, no axis note', () => {
  for (let n = 0; n <= logic.steps; n++) {
    const s = at({ a: 0, phi: 30 }, n);
    assert.equal(s.none, true);
    assert.ok(Object.is(s.i, 0) && Object.is(s.q, 0), `n = ${n}: +0, not −0`);
    assert.equal(s.axis, null);
  }
  assert.equal(at({ a: 5 }, 0).none, false);
});

test('tie-break: the angle is folded into (−180°, 180°]; φ = −180° is the same phasor as 180°', () => {
  assert.equal(logic.fold(-180), 180);
  assert.equal(logic.fold(540), 180);
  assert.equal(logic.fold(-190), 170);
  assert.equal(logic.fold(360), 0);
  assert.equal(at({ phi: -180 }, 0).angle, 180);
  assert.equal(at({ phi: 180 }, 0).angle, 180);
  assert.equal(at({ phi: 150 }, 1).angle, 180, '150° + 30°');
  assert.equal(at({ phi: 150 }, 2).angle, -150, '150° + 60° = 210°');
  assert.equal(at({ phi: -180 }, 0).phi, -180, 'the slider value itself is kept');
});

test('tie-break: on the axes the projections are exact (0 and ±A, not 6e-17), and never −0', () => {
  for (const [deg, c, sn] of [[0, 1, 0], [90, 0, 1], [180, -1, 0], [-90, 0, -1], [270, 0, -1], [-180, -1, 0]]) {
    assert.ok(Object.is(logic.cosd(deg) + 0, c), `cos ${deg}`);
    assert.ok(Object.is(logic.sind(deg) + 0, sn), `sin ${deg}`);
  }
  const s = at({ a: 80, phi: 0 }, 3);   // ωt = 90°: on the positive Q axis
  assert.ok(Object.is(s.i, 0));
  assert.equal(s.q, 80);
  const r = at({ a: 80, phi: 0 }, 6);   // ωt = 180°: on the negative I axis
  assert.equal(r.i, -80);
  assert.ok(Object.is(r.q, 0));
});

test('tie-break: shown values round half away from zero, so +2.5 and −2.5 show the same size; −0 shows as 0', () => {
  assert.equal(logic.roundPct(2.5), 3);
  assert.equal(logic.roundPct(-2.5), -3);
  assert.equal(logic.roundPct(2.4), 2);
  assert.equal(logic.roundPct(-2.4), -2);
  assert.ok(Object.is(logic.roundPct(-0.3), 0));
  assert.ok(Object.is(logic.roundPct(-0), 0));
  // A = 5 % at 60° and 120°: I = ±2.5 %
  assert.equal(at({ a: 5, phi: 60 }, 0).iRound, 3);
  assert.equal(at({ a: 5, phi: 120 }, 0).iRound, -3);
});

test('tie-break: A and φ clamp to their ranges, snap to their steps (half a step up), −0 is 0, a non-number is the default', () => {
  const sa = (v) => logic.snap(v, logic.A_MIN, logic.A_MAX, logic.A_STEP, 7);
  const sp = (v) => logic.snap(v, logic.PHI_MIN, logic.PHI_MAX, logic.PHI_STEP, 7);
  assert.equal(sa(-10), 0);
  assert.equal(sa(130), 100);
  assert.equal(sa(12.5), 15);
  assert.equal(sa(12.4), 10);
  assert.equal(sp(-200), -180);
  assert.equal(sp(7.5), 15);
  assert.equal(sp(-7.5), 0);
  assert.ok(Object.is(sp(-7), 0), '−0 becomes 0');
  assert.equal(sp('45'), 45);
  for (const bad of ['abc', '', null, NaN, undefined, true, Infinity]) assert.equal(sa(bad), 7, String(bad));
  const s = at({ a: 'x', phi: 999 }, 0);
  assert.deepEqual([s.a, s.phi], [logic.defaults.a, 180]);
});

test('tie-break: the axis note names the axis the phasor lies on, and only there', () => {
  assert.equal(logic.axisOf(0), 'i+');
  assert.equal(logic.axisOf(90), 'q+');
  assert.equal(logic.axisOf(180), 'i-');
  assert.equal(logic.axisOf(-90), 'q-');
  for (const a of [30, -30, 45, 135, -165, 179]) assert.equal(logic.axisOf(a), null, String(a));
  // φ = 30°: on the axes at ωt = 60°, 150°, 240°, 330°
  const hits = [];
  for (let n = 0; n <= logic.steps; n++) if (at({ phi: 30 }, n).axis) hits.push(n);
  assert.deepEqual(hits, [2, 5, 8, 11]);
});

// ── the rules ──

test('at t = 0 the projections are the symbol: I = A · cos φ, Q = A · sin φ', () => {
  for (const [a, phi] of [[80, 30], [100, -45], [55, 135], [20, -120], [100, 90]]) {
    const s = at({ a, phi }, 0);
    assert.equal(s.wt, 0);
    assert.ok(close(s.i, a * Math.cos(phi * Math.PI / 180)), `I for ${a}, ${phi}`);
    assert.ok(close(s.q, a * Math.sin(phi * Math.PI / 180)), `Q for ${a}, ${phi}`);
    assert.ok(close(s.i0, s.i) && close(s.q0, s.q));
    assert.ok(close(Math.hypot(s.i, s.q), a), 'the phasor has length A');
  }
});

test('each step turns the phasor counter-clockwise by 30°; the projections are A · cos(ωt + φ) and A · sin(ωt + φ)', () => {
  const p = { a: 80, phi: 30 };
  for (let n = 0; n <= logic.steps; n++) {
    const s = at(p, n);
    assert.equal(s.wt, 30 * n);
    const x = (30 * n + 30) * Math.PI / 180;
    assert.ok(close(s.i, 80 * Math.cos(x)), `I at step ${n}`);
    assert.ok(close(s.q, 80 * Math.sin(x)), `Q at step ${n}`);
    assert.ok(close(s.i0, 80 * Math.cos(Math.PI / 6)), 'the start values stay');
    assert.equal(s.a, 80);
  }
  // counter-clockwise: from 30° a quarter turn later the phasor stands at 120°
  assert.equal(at(p, 3).angle, 120);
});

test('the projections are 90° apart: the sine is the cosine a quarter turn later', () => {
  for (const phi of [-150, -45, 0, 30, 90, 165]) {
    for (let n = 0; n + 3 <= logic.steps; n++) {
      // Q(ωt) = A sin(ωt + φ) = A cos(ωt + φ − 90°) = I(ωt − 90°), so I at step n + 3 is −Q at step n
      assert.ok(close(at({ phi }, n + 3).i, -at({ phi }, n).q), `φ = ${phi}, n = ${n}`);
      assert.ok(close(at({ phi }, n + 3).q, at({ phi }, n).i));
    }
  }
});

test('12 steps make one full turn: step 12 is back at the start, flagged as full', () => {
  for (const phi of [-180, -45, 0, 30, 120]) {
    const s0 = at({ phi }, 0), s12 = at({ phi }, 12);
    assert.equal(s12.angle, s0.angle);
    assert.ok(close(s12.i, s0.i) && close(s12.q, s0.q));
    assert.equal(s12.full, true);
    for (let n = 0; n < 12; n++) assert.equal(at({ phi }, n).full, false);
  }
  assert.equal(logic.steps * logic.TURN, 360);
});

test('the trace runs one period from t = 0 and starts and ends at the symbol', () => {
  const tr = logic.trace(80, 30);
  assert.equal(tr.length, logic.POINTS + 1);
  assert.equal(tr[0].wt, 0);
  assert.equal(tr[tr.length - 1].wt, 360);
  const s = at({ a: 80, phi: 30 }, 0);
  for (const p of [tr[0], tr[tr.length - 1]]) assert.ok(close(p.i, s.i) && close(p.q, s.q));
  for (let n = 0; n <= logic.steps; n++) {
    const st = at({ a: 80, phi: 30 }, n), p = tr.find((x) => x.wt === st.wt);
    assert.ok(p && close(p.i, st.i) && close(p.q, st.q), `the trace passes the phasor at step ${n}`);
  }
  assert.ok(Math.max(...tr.map((p) => p.q)) <= 80 + 1e-9);
});

test('presets: the start, all I, all Q, I negative, −45° at full scale, and no signal', () => {
  const by = Object.fromEntries(logic.presets.map((p) => [p.id, at(p.params, 0)]));
  assert.deepEqual(logic.presets[0].params, logic.defaults, 'the first preset is the start');
  assert.ok(by.start.iRound !== 0 && by.start.qRound !== 0 && by.start.iRound !== by.start.qRound);
  assert.equal(by.ionly.axis, 'i+');
  assert.equal(by.qonly.axis, 'q+');
  assert.equal(by.reverse.axis, 'i-');
  assert.ok(by.minus45.qRound < 0 && by.minus45.iRound === -by.minus45.qRound);
  assert.equal(by.none.none, true);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (let n = 0; n <= logic.steps; n++) {
    const s = at({ a: 35, phi: -135 }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ a: 65, phi: 105 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ phi: -60 });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('every preset is valid for the model, and the page meta matches the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'stepper');
  assert.equal(meta.steps, logic.steps);
  assert.ok(logic.steps <= 20);
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: param ${k}`);
    assert.equal(logic.snap(p.params.a, logic.A_MIN, logic.A_MAX, logic.A_STEP, NaN), p.params.a, `preset ${p.id}: A on the slider`);
    assert.equal(logic.snap(p.params.phi, logic.PHI_MIN, logic.PHI_MAX, logic.PHI_STEP, NaN), p.params.phi, `preset ${p.id}: φ on the slider`);
  }
});
