// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the phase modulation model. Run: node --test sims/phase-modulation/
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
// An angle folded into (−π, π].
const wrap = (x) => { const r = ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); return r > Math.PI ? r - 2 * Math.PI : r; };

// ── tie-breaks first ──

test('tie-break: at an edge the square and the sawtooth already have their new value; the square starts at +1', () => {
  assert.equal(logic.message('square', 0), 1, 'not 0, as Math.sign(sin 0) gave in the original');
  assert.equal(logic.message('saw', 0), -1);
  const half = 0.5 / logic.FS;
  assert.equal(logic.message('square', half - 1e-9), 1);
  assert.equal(logic.message('square', half + 1e-9), -1);
  assert.equal(logic.message('square', 1 / logic.FS + 1e-9), 1);
  assert.ok(close(logic.message('saw', 1 / logic.FS - 1e-9), 1, 1e-6));
  assert.ok(close(logic.message('saw', 1 / logic.FS + 1e-9), -1, 1e-6));
});

test('tie-break: Δφ is clamped to 0 … 180°, snapped to 15° (a half step up), and a non-number is the default', () => {
  assert.equal(logic.clampDev(-10), 0);
  assert.equal(logic.clampDev(500), 180);
  assert.equal(logic.clampDev(22.5), 30);
  assert.equal(logic.clampDev(22.4), 15);
  assert.equal(logic.clampDev('45'), 45);
  for (const bad of ['abc', '', null, NaN, undefined, true]) assert.equal(logic.clampDev(bad), logic.defaults.dev, String(bad));
  assert.equal(logic.clampShape('triangle'), logic.defaults.shape);
  assert.equal(logic.clampShape('saw'), 'saw');
  assert.deepEqual([at({ shape: 'x', dev: 999 }).shape, at({ shape: 'x', dev: 999 }).dev], ['sine', 180]);
});

test('tie-break: Δφ = 0 is no modulation; FM and PM equal the carrier and no edge is marked', () => {
  for (const shape of logic.SHAPES) {
    const s = at({ shape, dev: 0 });
    assert.equal(s.none, true);
    assert.deepEqual(s.edges, []);
    for (const p of logic.curve(shape, 0, 97)) {
      assert.ok(close(p.pm, p.c) && close(p.fm, p.c), `${shape} at t = ${p.t}`);
    }
  }
  assert.equal(at({ dev: 15 }).none, false);
});

test('tie-break: a phase jump folds into (−180°, 180°]; a whole turn is 0° and cannot be seen', () => {
  assert.equal(logic.fold(-180), 180);
  assert.equal(logic.fold(180), 180);
  assert.equal(logic.fold(360), 0);
  assert.equal(logic.fold(-360), 0);
  assert.equal(logic.fold(-270), 90);
  assert.equal(logic.fold(270), -90);
  const turn = at({ shape: 'square', dev: 180 });
  assert.ok(turn.edges.length > 0);
  assert.ok(turn.edges.every((e) => e.jump === 0));
  assert.equal(turn.hidden, true);
  assert.equal(turn.jumps, 0);
  // so the PM wave is the carrier again on either side of the jump: φ = ±π both give −sin
  for (const t of [0.1, 0.6]) assert.ok(close(logic.pm('square', 180, t), -logic.carrier(t)));
  assert.equal(at({ shape: 'square', dev: 90 }).hidden, false);
});

// ── the rules ──

test('PM: the phase follows the value of the signal directly, k · m(t), and the amplitude stays 1', () => {
  for (const shape of logic.SHAPES) {
    for (const dev of [30, 90, 150]) {
      const k = dev * Math.PI / 180;
      for (const t of [0.05, 0.23, 0.61, 0.97]) {
        assert.ok(close(logic.phasePM(shape, dev, t), k * logic.message(shape, t)), `${shape} ${dev}° t = ${t}`);
        assert.ok(close(logic.pm(shape, dev, t), Math.sin(2 * Math.PI * logic.FC * t + k * logic.message(shape, t))));
      }
      const ys = logic.curve(shape, dev, 4800).map((p) => p.pm);
      assert.ok(Math.max(...ys) <= 1 + 1e-12 && Math.min(...ys) >= -1 - 1e-12);
      assert.ok(Math.max(...ys) > 0.999, 'the amplitude does not shrink');
    }
  }
});

test('PM: the larger the signal, the further the phase shifts; the larger Δφ, the further too', () => {
  const t1 = 0.05, t2 = 0.2;   // the sine is rising: m(t1) < m(t2)
  assert.ok(logic.message('sine', t1) < logic.message('sine', t2));
  assert.ok(logic.phasePM('sine', 90, t1) < logic.phasePM('sine', 90, t2));
  assert.ok(logic.phasePM('sine', 45, t2) < logic.phasePM('sine', 90, t2));
});

test('FM: the frequency follows the signal (FC + k · m), so the phase is 2πk times its running integral', () => {
  for (const shape of logic.SHAPES) {
    const dev = 90, k = Math.PI / 2;
    // the integral, checked against a fine numerical sum
    let sum = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      sum += logic.message(shape, u) / n;
      if ((i + 1) % 2500 === 0) {
        const t = (i + 1) / n;
        assert.ok(close(logic.integral(shape, t), sum, 2e-4), `${shape}: ∫ at t = ${t}`);
      }
    }
    // the instantaneous frequency, from the phase's slope: FC + k · m(t), in periods per window
    for (const t of [0.13, 0.37, 0.71]) {
      const d = 1e-6;
      const f = logic.FC + (logic.phaseFM(shape, dev, t + d) - logic.phaseFM(shape, dev, t - d)) / (2 * d) / (2 * Math.PI);
      assert.ok(close(f, logic.FC + k * logic.message(shape, t), 1e-4), `${shape} f at t = ${t}`);
    }
  }
  const s = at({ dev: 90 });
  assert.ok(close(s.fmLow, 8 - Math.PI / 2) && close(s.fmHigh, 8 + Math.PI / 2));
});

test('an edge makes the PM phase jump at once; the FM phase does not jump', () => {
  for (const shape of ['square', 'saw']) {
    for (const e of logic.edges(shape, 90)) {
      const d = 1e-7;
      const pmStep = wrap(logic.phasePM(shape, 90, e.t + d) - logic.phasePM(shape, 90, e.t - d)) * 180 / Math.PI;
      const fmStep = logic.phaseFM(shape, 90, e.t + d) - logic.phaseFM(shape, 90, e.t - d);
      assert.ok(close(Math.abs(pmStep), 180, 1e-3), `${shape} PM jump at ${e.t}: ${pmStep}`);
      assert.ok(Math.abs(fmStep) < 1e-5, `${shape} FM continuous at ${e.t}`);
    }
  }
  // the sine and the ramp have no edges: the PM phase moves continuously
  for (const shape of ['sine', 'ramp']) {
    assert.deepEqual(logic.edges(shape, 90), []);
    for (let t = 0.01; t < 1; t += 0.01) {
      assert.ok(Math.abs(logic.phasePM(shape, 90, t + 1e-7) - logic.phasePM(shape, 90, t)) < 1e-5);
    }
  }
});

test('edges: the square has one every half period, the sawtooth one every period, inside the window', () => {
  const sq = logic.edges('square', 90);
  assert.equal(sq.length, 2);
  assert.ok(close(sq[0].t, 0.5 / 1.2) && close(sq[1].t, 1 / 1.2));
  assert.deepEqual(sq.map((e) => [e.before, e.after]), [[1, -1], [-1, 1]]);
  const saw = logic.edges('saw', 90);
  assert.equal(saw.length, 1);
  assert.ok(close(saw[0].t, 1 / 1.2));
  assert.deepEqual([saw[0].before, saw[0].after], [1, -1]);
  // jump = Δφ · (after − before), folded
  assert.deepEqual(logic.edges('square', 45).map((e) => e.jump), [-90, 90]);
  assert.deepEqual(logic.edges('square', 90).map((e) => e.jump), [180, 180]);
  assert.deepEqual(logic.edges('square', 135).map((e) => e.jump), [90, -90]);
  assert.deepEqual(logic.edges('saw', 60).map((e) => e.jump), [-120]);
});

test('ramp: a steadily rising PM phase is a higher frequency, FC + 2Δφ/360° periods', () => {
  const s = at({ shape: 'ramp', dev: 180 });
  assert.ok(close(s.rampExtra, 1));
  // count upward zero crossings of the PM wave
  const pts = logic.curve('ramp', 180, 12000);
  let ups = 0;
  for (let i = 1; i < pts.length; i++) if (pts[i - 1].pm <= 0 && pts[i].pm > 0) ups++;
  assert.equal(ups, logic.FC + 1);
  assert.equal(at({ shape: 'ramp', dev: 90 }).rampExtra, 0.5);
  assert.equal(at({ shape: 'sine', dev: 90 }).rampExtra, 0);
});

test('the carrier makes FC periods in the window; its upward zero crossings are at i / FC', () => {
  assert.deepEqual(logic.zeros(), [0, 1, 2, 3, 4, 5, 6, 7].map((i) => i / 8));
  for (const z of logic.zeros()) {
    assert.ok(Math.abs(logic.carrier(z)) < 1e-9);
    assert.ok(logic.carrier(z + 1e-4) > 0);
  }
  const pts = logic.curve('sine', 90);
  assert.equal(pts.length, logic.POINTS + 1);
  assert.equal(pts[0].t, 0);
  assert.equal(pts[pts.length - 1].t, 1);
  assert.ok(logic.POINTS / logic.FC >= 100, 'at least 100 points per carrier period');
});

test('presets: the start, phase reversal, sawtooth, ramp, none, and the hidden whole turn', () => {
  const by = Object.fromEntries(logic.presets.map((p) => [p.id, at(p.params)]));
  assert.deepEqual(logic.presets[0].params, logic.defaults, 'the first preset is the start');
  assert.ok(by.reversal.edges.every((e) => e.jump === 180));
  assert.equal(by.saw.edges.length, 1);
  assert.ok(by.ramp.rampExtra > 0);
  assert.equal(by.none.none, true);
  assert.equal(by.turn.hidden, true);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const p of logic.presets) {
    const s = at(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ shape: 'square', dev: 45 });
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
    assert.equal(logic.clampDev(p.params.dev), p.params.dev, `preset ${p.id}: Δφ on the slider`);
    assert.equal(logic.clampShape(p.params.shape), p.params.shape, `preset ${p.id}: shape`);
  }
});
