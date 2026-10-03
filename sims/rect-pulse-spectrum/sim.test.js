// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the square-wave spectrum model. Run: node --test sims/rect-pulse-spectrum/
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

test('tie-break: an even N goes down to the odd one below, never up', () => {
  assert.equal(logic.clampN(4), 3);
  assert.equal(logic.clampN(2), 1);
  assert.equal(logic.clampN(498), 497);
  assert.equal(logic.clampN(5), 5);
  assert.equal(at({ n: 10 }).n, 9);
});

test('tie-break: N is clamped to 1 … 499, and a non-number or a fraction is handled as the original did', () => {
  assert.equal(logic.clampN(0), 1);
  assert.equal(logic.clampN(-7), 1);
  assert.equal(logic.clampN(500), 499);
  assert.equal(logic.clampN(10000), 499);
  assert.equal(logic.clampN('abc'), 1);
  assert.equal(logic.clampN(NaN), 1);
  assert.equal(logic.clampN('7'), 7);
  assert.equal(logic.clampN(8.9), 7);   // parseInt truncates to 8, then down to odd (rounding would give 9)
});

test('tie-break: on a jump the sum and the ideal wave are both 0 (the midpoint), for every N', () => {
  for (const n of [1, 3, 25, 499]) {
    for (const x of [-Math.PI, 0, Math.PI]) assert.ok(close(logic.partialSum(x, n), 0, 1e-9), `n = ${n}, x = ${x}`);
  }
  assert.equal(logic.ideal(0), 0);
  assert.equal(logic.ideal(Math.PI), 0);
  assert.equal(logic.ideal(1), 1);
  assert.equal(logic.ideal(-1), -1);
  assert.equal(logic.ideal(-1.2 * Math.PI), 1);
});

test('only odd harmonics, with amplitude 4/(kπ): the k-th is 1/k of the fundamental', () => {
  assert.ok(close(logic.amplitude(1), 4 / Math.PI));
  assert.ok(close(logic.amplitude(3), logic.amplitude(1) / 3));
  assert.ok(close(logic.amplitude(99), logic.amplitude(1) / 99));
  for (const k of [2, 4, 100]) assert.equal(logic.amplitude(k), 0);
  const s = at({ n: 9 });
  assert.deepEqual(s.harmonics.map((h) => h.k), [1, 3, 5, 7, 9]);
  assert.equal(s.count, 5);
  assert.equal(at({ n: 499 }).count, 250);
  assert.ok(close(s.last, 4 / (9 * Math.PI)));
});

test('the sum is the series: N = 1 is the fundamental sine, N = 3 adds sin 3x / 3', () => {
  for (const x of [0.3, 1, 2.5, -2]) {
    assert.ok(close(logic.partialSum(x, 1), (4 / Math.PI) * Math.sin(x)));
    assert.ok(close(logic.partialSum(x, 3), (4 / Math.PI) * (Math.sin(x) + Math.sin(3 * x) / 3)));
  }
});

test('more harmonics bring the sum closer to the square wave away from the jumps', () => {
  const err = (n) => Math.max(...[0.5, 1, 1.5, 2, 2.6].map((x) => Math.abs(logic.partialSum(x, n) - logic.ideal(x))));
  assert.ok(err(1) > 0.2);
  assert.ok(err(9) < err(3));
  assert.ok(err(99) < err(9));
  assert.ok(err(499) < 0.01);
});

test('the first peak after the jump is at π/(N+1), the highest point of the sum', () => {
  for (const n of [1, 3, 5, 9, 25, 99]) {
    const p = logic.firstPeak(n);
    assert.ok(close(p.x, Math.PI / (n + 1)));
    const d = 1e-4;   // a maximum: lower on both sides
    assert.ok(logic.partialSum(p.x - d, n) < p.y && logic.partialSum(p.x + d, n) < p.y, `n = ${n}`);
    const top = Math.max(...logic.curve(n, 4000).map((q) => q.y));
    assert.ok(top <= p.y + 1e-9, `n = ${n}: sampled max ${top} above the peak ${p.y}`);
  }
});

test('Gibbs: the overshoot falls with N but never below about 9 % of the jump', () => {
  assert.ok(close(at({ n: 1 }).overshoot, (4 / Math.PI - 1) / 2));   // 13.7 %
  assert.ok(close(at({ n: 3 }).overshoot, 0.1002, 1e-4));
  let prev = Infinity;
  for (let n = logic.N_MIN; n <= logic.N_MAX; n += logic.N_STEP) {
    const o = at({ n }).overshoot;
    assert.ok(o < prev, `n = ${n}: not falling`);
    assert.ok(o > logic.GIBBS, `n = ${n}: below the limit`);
    prev = o;
  }
  assert.ok(close(at({ n: 499 }).overshoot, logic.GIBBS, 1e-3));
  assert.ok(close(at({ n: 499 }).peak.y, 1.179, 1e-3));
});

test('the drawn curve spans the window and has enough points per ripple', () => {
  const pts = logic.curve(5, 100);
  assert.equal(pts.length, 101);
  assert.ok(close(pts[0].x, -1.5 * Math.PI));
  assert.ok(close(pts[100].x, 1.5 * Math.PI));
  assert.equal(logic.pointsFor(1), 1200);
  assert.equal(logic.pointsFor(99), 3960);
  assert.equal(logic.pointsFor(499), 8000);
  // at N = 499 the ripple period is 2π/500: at least four points in each over the 3π window
  assert.ok(logic.pointsFor(499) / (3 * Math.PI) * (2 * Math.PI / 500) >= 4);
});

test('the ideal corners match the ideal wave between the jumps', () => {
  const c = logic.idealCorners();
  assert.equal(c[0].x, logic.X_MIN);
  assert.equal(c[c.length - 1].x, logic.X_MAX);
  for (let i = 0; i + 1 < c.length; i++) {
    if (c[i].x === c[i + 1].x) continue;   // a jump
    const mid = (c[i].x + c[i + 1].x) / 2;
    assert.equal(logic.ideal(mid), c[i].y, `segment ${i}`);
  }
});

test('presets go from the fundamental to the slider end, each on the slider grid', () => {
  const ns = logic.presets.map((p) => p.params.n);
  assert.deepEqual(ns, [...ns].sort((a, b) => a - b));
  assert.equal(ns[0], 1);
  assert.equal(ns[ns.length - 1], logic.N_MAX);
  for (const n of ns) assert.equal(logic.clampN(n), n);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const p of logic.presets) {
    const s = at(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ n: 37 });
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
    const n = p.params.n;
    assert.ok(n >= logic.N_MIN && n <= logic.N_MAX && (n - logic.N_MIN) % logic.N_STEP === 0, `preset ${p.id} on the slider grid`);
  }
});
