// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the fading model. Run: node --test sims/fading/
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

test('tie-break: no ground wave is "steady" before any other trend, whatever the phase', () => {
  for (let phase = 0; phase <= 360; phase += 15) {
    const st = at({ amp: 0, phase });
    assert.equal(st.trend, 'steady', `${phase}°`);
    assert.equal(st.A, 1);
    assert.equal(st.max, 1);
    assert.equal(st.min, 1);
    assert.equal(st.depth, 0);
  }
  assert.equal(at({ amp: 1, phase: 0 }).trend, 'peak');
  assert.equal(at({ amp: 1, phase: 180 }).trend, 'trough');
});

test('tie-break: 0° and 360° are the peak, 180° the trough; one degree off is fading or rising', () => {
  for (const amp of [30, 80, 100]) {
    assert.equal(at({ amp, phase: 0 }).trend, 'peak');
    assert.equal(at({ amp, phase: 360 }).trend, 'peak');
    assert.equal(at({ amp, phase: 1 }).trend, 'fading');
    assert.equal(at({ amp, phase: 179 }).trend, 'fading');
    assert.equal(at({ amp, phase: 181 }).trend, 'rising');
    assert.equal(at({ amp, phase: 359 }).trend, 'rising');
  }
  assert.equal(at({ amp: 80, phase: 180 }).trend, 'trough');
  assert.equal(at({ amp: 99, phase: 180 }).trend, 'trough');
  // whole turns either way are the same point of the fade
  assert.equal(logic.trendOf(540, 0.5), 'trough');
  assert.equal(logic.trendOf(-90, 0.5), 'rising');
  assert.equal(logic.trendOf(-360, 0.5), 'peak');
});

test('tie-break: only equal waves in opposite phase drop out, exactly to 0, with an infinitely deep fade', () => {
  const st = at({ amp: 100, phase: 180 });
  assert.equal(st.trend, 'dropout');
  assert.equal(st.A, 0);
  assert.equal(st.min, 0);
  assert.equal(st.depth, null);
  // at 100 % every phase has the infinite depth; 99 % has a finite one and no dropout
  assert.equal(at({ amp: 100, phase: 90 }).depth, null);
  const s99 = at({ amp: 99, phase: 180 });
  assert.equal(s99.trend, 'trough');
  assert.ok(near(s99.A, 0.01) && s99.depth !== null && s99.depth > 40);
  // only an exact 0 is infinite: a weakest of 0.0005 is a finite, very deep fade
  assert.equal(logic.fadeRange(0.9995).depth, 72);
});

// ── rules of this model ──

test('the sum amplitude A = √((1 − a)² + 2a(1 + cos φ)) is the peak of the summed curve', () => {
  for (let phase = 0; phase <= 360; phase += 10) {
    for (const amp of [0, 30, 80, 100]) {
      const st = at({ amp, phase });
      const peak = Math.max(...logic.curve(st, 4000).map((q) => Math.abs(q.s)));
      assert.ok(near(peak, st.A, 1e-4), `${phase}°, ${amp}%: peak ${peak}, A ${st.A}`);
    }
  }
  assert.ok(near(at({ amp: 100, phase: 0 }).A, 2));
  assert.ok(near(at({ amp: 100, phase: 90 }).A, Math.SQRT2));
  assert.ok(near(at({ amp: 80, phase: 180 }).A, 0.2));
  assert.ok(near(at({ amp: 30, phase: 0 }).A, 1.3));
});

test('the strength swings between |1 − a| and 1 + a, and never leaves that band', () => {
  for (const amp of [10, 30, 50, 80, 100]) {
    const a = amp / 100, r = logic.fadeRange(a);
    assert.ok(near(r.max, 1 + a) && near(r.min, Math.abs(1 - a)));
    let lo = Infinity, hi = -Infinity;
    for (let phase = 0; phase <= 360; phase++) {
      const A = at({ amp, phase }).A;
      lo = Math.min(lo, A); hi = Math.max(hi, A);
    }
    assert.ok(near(lo, r.min, 1e-12) && near(hi, r.max, 1e-12), `${amp}%`);
  }
});

test('the fade depth is 20·log10((1 + a)/(1 − a)) dB, to 0.1 dB, and grows as the waves get closer in strength', () => {
  assert.equal(at({ amp: 80 }).depth, 19.1);           // 20·log10 9
  assert.equal(at({ amp: 30 }).depth, 5.4);            // 20·log10(1.3/0.7)
  assert.equal(at({ amp: 50 }).depth, 9.5);            // 20·log10 3
  assert.equal(at({ amp: 0 }).depth, 0);
  let prev = -1;
  for (let amp = 0; amp < 100; amp++) {
    const d = at({ amp }).depth;
    assert.ok(d >= prev, `${amp}%`);
    prev = d;
  }
});

test('fading while φ grows from 0° to 180°, rising from 180° to 360°: the trend matches the drift', () => {
  for (const amp of [20, 80, 100]) {
    for (let phase = 1; phase < 360; phase++) {
      const st = at({ amp, phase });
      if (st.trend !== 'fading' && st.trend !== 'rising') continue;
      const next = logic.sumAmplitude(logic.drift(phase, 0.01), amp / 100);
      assert.equal(st.trend === 'fading', next < st.A, `${amp}%, ${phase}°`);
    }
  }
});

test('the ground wave is shifted by +φ against the sky wave, as in the original applet', () => {
  for (const phase of [0, 45, 90, 200, 359]) {
    const a = 0.7, x = 0.3;
    const v = logic.signals(x, phase, a);
    assert.ok(near(v.sky, Math.sin(2 * Math.PI * x), 1e-12));
    assert.ok(near(v.ground, a * Math.sin(2 * Math.PI * x + phase * Math.PI / 180), 1e-12));
    assert.ok(near(v.s, v.sky + v.ground, 1e-15));
  }
});

test('the drift adds DRIFT °/s and wraps into 0 … 360', () => {
  assert.equal(logic.DRIFT, 18);
  assert.equal(logic.drift(0, 1), 18);
  assert.equal(logic.drift(350, 1), 8);
  assert.equal(logic.drift(180, 10), 0);
  assert.equal(logic.drift(10, -1), 352);
  assert.ok(near(logic.drift(0, 20), 0));                // one fade every 20 s
});

test('the history ends now at the current strength and has φ(t) = φ + DRIFT·t before it', () => {
  for (const over of [{ amp: 80, phase: 180 }, { amp: 50, phase: 37 }, { amp: 100, phase: 0 }]) {
    const st = at(over), h = logic.history(st, 600);
    assert.equal(h.length, 601);
    assert.equal(h[0].t, -logic.WINDOW);
    assert.equal(h[h.length - 1].t, 0);
    assert.ok(near(h[h.length - 1].A, st.A, 1e-12));
    for (const q of h) assert.ok(near(q.A, logic.sumAmplitude(st.phase + logic.DRIFT * q.t, st.a), 1e-12));
  }
  // 60 s at 18 °/s is three whole fades: the strength 20 s ago equals the strength now
  const st = at({ amp: 60, phase: 123 });
  assert.ok(near(logic.sumAmplitude(st.phase - 20 * logic.DRIFT, st.a), st.A, 1e-12));
  // at least 8 points per fade even when asked for fewer
  assert.ok(logic.history(st, 0).length - 1 >= 8 * logic.WINDOW * logic.DRIFT / 360);
});

test('params are whole percent 0 … 100 and whole degrees 0 … 360, clamped', () => {
  assert.equal(at({ phase: -20 }).phase, 0);
  assert.equal(at({ phase: 400 }).phase, 360);
  assert.equal(at({ phase: 89.6 }).phase, 90);
  assert.equal(at({ phase: 'x' }).phase, 0);
  assert.equal(at({ amp: 150 }).amp, 100);
  assert.equal(at({ amp: -5 }).a, 0);
  assert.equal(at({ amp: '50' }).a, 0.5);
});

test('the waves cover 2.5 periods with at least 48 points per period, starting at t = 0', () => {
  const cv = logic.curve(at({}), 0);
  assert.equal(cv[0].t, 0);
  assert.equal(cv[cv.length - 1].t, logic.PERIODS);
  assert.ok(cv.length - 1 >= 48 * logic.PERIODS);
  assert.equal(logic.curve(at({}), 400).length, 401);
});

test('the defaults are the original applet\'s: 80 % and 180°', () => {
  assert.deepEqual(logic.defaults, { amp: 80, phase: 180 });
  assert.deepEqual(logic.presets[0].params, logic.defaults);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and at the edges', () => {
  for (const params of logic.presets.map((p) => p.params).concat([{ amp: 100, phase: 180 }, { amp: 0, phase: 0 }])) {
    const st = at(params);
    assert.deepEqual(JSON.parse(JSON.stringify(st)), st);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ phase: 137, amp: 42 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer has no steps');
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
  for (const lang of ['hr', 'en']) {
    for (const tr of ['peak', 'trough', 'fading', 'rising']) assert.ok(strings[lang]['trend_' + tr], `${lang} trend_${tr}`);
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
    assert.equal(st.phase, p.params.phase, `preset ${p.id} in range`);
    assert.equal(st.amp, p.params.amp, `preset ${p.id} in range`);
  }
});
