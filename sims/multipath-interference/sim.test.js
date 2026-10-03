// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the multipath interference model. Run: node --test sims/multipath-interference/
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

test('tie-break: only equal strength in opposite phase cancels, and exactly to 0', () => {
  const st = at({ phase: 180, amp: 100 });
  assert.equal(st.effect, 'cancelled');
  assert.equal(st.A, 0);
  assert.equal(st.db, null);
  // one degree or one percent away is weaker, not cancelled
  for (const over of [{ phase: 179 }, { phase: 181 }, { phase: 180, amp: 99 }]) {
    const s = at(Object.assign({ amp: 100 }, over));
    assert.equal(s.effect, 'weaker', JSON.stringify(over));
    assert.ok(s.A > 0 && s.db !== null);
  }
  assert.ok(near(at({ phase: 180, amp: 99 }).A, 0.01));
});

test('tie-break: a sum exactly as strong as the direct signal is "same", not stronger or weaker', () => {
  for (const phase of [120, 240]) {
    const st = at({ phase, amp: 100 });
    assert.equal(st.effect, 'same', `${phase}°`);
    assert.equal(st.db, 0);
    assert.ok(!Object.is(st.db, -0), 'no −0 dB');
  }
  assert.equal(at({ phase: 119, amp: 100 }).effect, 'stronger');
  assert.equal(at({ phase: 121, amp: 100 }).effect, 'weaker');
  assert.equal(at({ phase: 239, amp: 100 }).effect, 'weaker');
  assert.equal(at({ phase: 241, amp: 100 }).effect, 'stronger');
});

test('tie-break: no reflection is "none" before any other effect, whatever the phase', () => {
  for (let phase = 0; phase <= 360; phase += 15) {
    const st = at({ phase, amp: 0 });
    assert.equal(st.effect, 'none', `${phase}°, a = 0`);
    assert.equal(st.A, 1);
    assert.equal(st.db, 0);
  }
  assert.equal(at({ phase: 0, amp: 1 }).effect, 'stronger');
  assert.equal(at({ phase: 180, amp: 1 }).effect, 'weaker');
});

// ── rules of this model ──

test('the sum amplitude A = √((1 − a)² + 2a(1 + cos φ)) is the peak of the summed curve', () => {
  for (let phase = 0; phase <= 360; phase += 10) {
    for (const amp of [0, 30, 50, 100]) {
      const st = at({ phase, amp });
      const peak = Math.max(...logic.curve(st, 4000).map((q) => Math.abs(q.s)));
      assert.ok(near(peak, st.A, 1e-4), `${phase}°, ${amp}%: peak ${peak}, A ${st.A}`);
    }
  }
  assert.ok(near(at({ phase: 0, amp: 100 }).A, 2));
  assert.ok(near(at({ phase: 90, amp: 100 }).A, Math.SQRT2));
  assert.ok(near(at({ phase: 180, amp: 50 }).A, 0.5));
  assert.ok(near(at({ phase: 0, amp: 50 }).A, 1.5));
});

test('stronger exactly when cos φ > −a/2, weaker when below', () => {
  for (let phase = 0; phase <= 360; phase++) {
    for (const amp of [10, 50, 75, 100]) {
      const st = at({ phase, amp });
      const c = Math.cos(phase * Math.PI / 180), edge = -st.a / 2;
      if (Math.abs(c - edge) < 1e-9) continue;          // the ties, tested above
      assert.equal(st.effect === 'stronger', c > edge, `${phase}°, ${amp}%`);
      assert.equal(st.effect === 'weaker' || st.effect === 'cancelled', c < edge, `${phase}°, ${amp}%`);
    }
  }
});

test('a delay of a whole period looks like none, and φ and 360° − φ give the same strength', () => {
  const zero = at({ phase: 0 }), full = at({ phase: 360 });
  assert.equal(zero.A, full.A);
  assert.equal(zero.effect, full.effect);
  assert.equal(full.pathFraction, 0);
  for (let phase = 0; phase <= 180; phase += 7) {
    assert.ok(near(at({ phase, amp: 60 }).A, at({ phase: 360 - phase, amp: 60 }).A), `${phase}°`);
  }
});

test('the reflected copy is delayed: its crest comes φ/360 of a period after the direct crest', () => {
  for (const phase of [0, 45, 90, 200, 359]) {
    const st = at({ phase, amp: 70 });
    assert.equal(st.lag, phase / 360);
    const v = logic.signals(0.25 + st.lag, phase, st.a);
    assert.ok(near(v.r, st.a, 1e-12), `${phase}°: copy at its crest`);
    assert.ok(near(logic.signals(0.25, phase, st.a).d, 1, 1e-12));
    assert.ok(near(v.s, v.d + v.r, 1e-15));
  }
  // the copy is behind, not ahead: just after 0 it is still below the direct signal at 90°
  assert.ok(logic.signals(0.01, 90, 1).r < 0);
});

test('the level against the direct signal is 20·log10 A dB, to 0.1 dB', () => {
  assert.equal(at({ phase: 0, amp: 100 }).db, 6);
  assert.equal(at({ phase: 90, amp: 100 }).db, 3);
  assert.equal(at({ phase: 180, amp: 50 }).db, -6);
  assert.equal(at({ phase: 180, amp: 90 }).db, -20);
  assert.equal(logic.levelDb(1e-12), null);
});

test('the path difference is φ/360 of a wavelength, whole wavelengths left out', () => {
  assert.equal(at({ phase: 90 }).pathFraction, 0.25);
  assert.equal(at({ phase: 180 }).pathFraction, 0.5);
  assert.equal(at({ phase: 0 }).pathFraction, 0);
  assert.equal(at({ phase: 360 }).pathFraction, 0);
});

test('params are whole degrees 0 … 360 and whole percent 0 … 100, clamped', () => {
  assert.equal(at({ phase: -20 }).phase, 0);
  assert.equal(at({ phase: 400 }).phase, 360);
  assert.equal(at({ phase: 89.6 }).phase, 90);
  assert.equal(at({ phase: 'x' }).phase, 0);
  assert.equal(at({ amp: 150 }).amp, 100);
  assert.equal(at({ amp: -5 }).a, 0);
  assert.equal(at({ amp: '50' }).a, 0.5);
});

test('the curves cover 2.5 periods with at least 48 points per period, starting at t = 0', () => {
  const cv = logic.curve(at({}), 0);
  assert.equal(cv[0].t, 0);
  assert.equal(cv[cv.length - 1].t, logic.PERIODS);
  assert.ok(cv.length - 1 >= 48 * logic.PERIODS);
  assert.equal(logic.curve(at({}), 400).length, 401);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const p of logic.presets) {
    const st = at(p.params);
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
    for (const e of ['stronger', 'weaker', 'same', 'cancelled', 'none']) assert.ok(strings[lang]['eff_' + e], `${lang} eff_${e}`);
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
