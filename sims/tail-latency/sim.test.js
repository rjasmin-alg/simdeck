// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for tail-latency's model (rules in SPEC.md). Run: node --test sims/tail-latency/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const C = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≉ ${b}`);
const LN100 = Math.log(100);
const key = (over, prevOver) => logic.captionKey(C(over), P(over), prevOver ? P(prevOver) : null);

// ── tie-breaks first ──

test('rule 1 tie: decoupled is strict, p99 ratio exactly twice the mean ratio is not decoupled', () => {
  assert.equal(logic.decoupled(1, 2), false);
  assert.equal(logic.decoupled(1, 2 + 1e-9), true);
  assert.equal(logic.decoupled(1.4, 5), true);           // the preset
  assert.equal(logic.decoupled(3, 5), false);            // ρ 0.5, cv² 9
});

test('rule 2 tie: N = 1 gives the backend\'s own share exactly', () => {
  assert.equal(C({ fanout: 1 }).pSlow, 0.01);
  assert.equal(C({ fanout: 1, slowP: 'p999' }).pSlow, 0.001);
  assert.equal(C({ fanout: 1 }).slowCalls, 0.01);
});

test('rule 1 tie: at cv² 1 both ratios are exactly 1, at every ρ', () => {
  for (const rho of [0.1, 0.5, 0.8]) {
    const s = C({ rho });
    assert.equal(s.ratioMean, 1);
    assert.equal(s.ratioP99, 1);
  }
});

test('"changed" tie: a ρ change at cv² 1 moves W and p99 by the same factor, so both are marked', () => {
  assert.deepEqual(logic.moved(C({ rho: 0.5 }), C({ rho: 0.1 })), ['wMean', 'p99']);
  assert.deepEqual(logic.moved(C({ rho: 0.1 }), C({ rho: 0.8 })), ['wMean', 'p99']);   // equal only within the tolerance
  assert.deepEqual(logic.moved(C({ rho: 0.5 }), C({ rho: 0.5 })), []);
  assert.deepEqual(logic.moved(C({ rho: 0.5 }), null), []);
});

test('caption tie: a change on both sides (or none) follows the state: N > 1 → fan-out, else the left story', () => {
  assert.equal(key({ cv2: 9 }, { fanout: 10 }), 'tail');                   // preset 1 after preset 2
  assert.equal(key({ fanout: 10 }, { cv2: 9 }), 'fanout');                 // preset 2 after preset 1
  assert.equal(key({ fanout: 10, cv2: 9 }, { fanout: 10, cv2: 9 }), 'fanout');
  assert.equal(key({ cv2: 9 }, { cv2: 9 }), 'tail');
  assert.equal(key({ fanout: 100 }, null), 'fanout');
  assert.equal(key({}, null), 'cv2Ref');
  assert.equal(key({ fanout: 2, cv2: 9 }, {}), 'fanout');                            // N 2 is already a fan-out
  assert.equal(key({ fanout: 2 }, {}), 'fanout');
});

test('sketch tie: of 100 sorted requests the 100th is past p99 and the 99th is not, at every cv² and ρ', () => {
  for (const rho of [0.1, 0.5, 0.8]) for (const cv2 of [0, 1, 2, 9, 16]) {
    const s = C({ rho, cv2 });
    const sk = logic.sketchOf(s);
    assert.equal(sk.times.length, 100);
    if (cv2 === 0) assert.ok(sk.times[0] >= 0.1, `ρ ${rho}: no request beats the service time at cv² 0`);
    near(sk.times[0], sk.floor + sk.scale * logic.gammaQuantile(sk.shape, 0.005));
    near(sk.times[99], sk.floor + sk.scale * logic.gammaQuantile(sk.shape, 0.995));
    assert.ok(sk.times[98] < s.p99 && sk.times[99] > s.p99, `ρ ${rho} cv² ${cv2}`);
    assert.ok(sk.times[99] < s.p999, `ρ ${rho} cv² ${cv2}: none of the 100 past p99.9`);
    // sorted; at cv² 0 the fastest requests do not wait at all and tie at the service time
    for (let i = 1; i < 100; i++) assert.ok(cv2 === 0 ? sk.times[i] >= sk.times[i - 1] : sk.times[i] > sk.times[i - 1]);
  }
});

// ── rules ──

test('rule 1: W = ρ/(1 − ρ) × (1 + cv²)/2 × 1/C + 1/C and p99 = ln 100 × (1 + cv²)/2 / (C(1 − ρ)), C 10', () => {
  const s = C({ rho: 0.5, cv2: 4 });                     // vf 2.5
  near(s.lambda, 5);
  near(s.wMean, 1 * 2.5 / 10 + 0.1);
  near(s.p99, LN100 * 2.5 / 5);
  near(C({ rho: 0.8 }).wMean, 1 / (10 - 8));             // M/M/1: 1/(C − λ)
  near(C({ rho: 0.8 }).p99, LN100 / (10 - 8));
  near(s.service, 0.1);
});

test('rule 1: the mean barely moves with cv² at low ρ, p99 scales with (1 + cv²)/2 at every ρ', () => {
  for (const rho of [0.1, 0.5, 0.8]) for (const cv2 of [0, 3, 16]) near(C({ rho, cv2 }).ratioP99, (1 + cv2) / 2);
  near(C({ rho: 0.1, cv2: 16 }).ratioMean, (0.1 / 0.9 * 8.5 / 10 + 0.1) / (1 / 9));
  assert.ok(C({ rho: 0.1, cv2: 16 }).ratioMean < 2);
  near(C({ rho: 0.1, cv2: 0 }).ratioMean, 0.95);
});

test('rule 1: p99.9 = ln 1000 / ln 100 × p99 (the same tail form); the threshold follows slowP', () => {
  const s = C({ rho: 0.8, cv2: 16 });
  near(s.p999, Math.log(1000) * 8.5 / 2);
  near(s.p999 / s.p99, 1.5);
  assert.equal(s.threshold, s.p99);
  assert.equal(C({ rho: 0.8, cv2: 16, slowP: 'p999' }).threshold, s.p999);
});

test('rule 2: pSlow = 1 − (1 − q)^N, rising with N, and slowCalls = N × q', () => {
  near(logic.pSlow(200, 0.01), 0.8660203251420383);
  near(logic.pSlow(200, 0.001), 0.18135117052136);
  let last = 0;
  for (let n = 1; n <= 200; n++) { const v = C({ fanout: n }).pSlow; assert.ok(v > last); last = v; }
  near(C({ fanout: 37 }).slowCalls, 0.37);
  near(C({ fanout: 37, slowP: 'p999' }).slowCalls, 0.037);
});

test('rule 2: the fan-out share does not depend on cv² or ρ (q is a share, not a time)', () => {
  assert.equal(C({ fanout: 50, cv2: 16, rho: 0.8 }).pSlow, C({ fanout: 50 }).pSlow);
});

test('"changed": the gauge that moved most, by |ln(new/old)|', () => {
  assert.deepEqual(logic.moved(C({ cv2: 9 }), C({ cv2: 1 })), ['p99']);            // ×5 against ×1.4
  assert.deepEqual(logic.moved(C({ fanout: 100 }), C({ fanout: 10 })), ['pSlow']);
  assert.deepEqual(logic.moved(C({ cv2: 1 }), C({ cv2: 9 })), ['p99']);            // down counts the same as up
  assert.deepEqual(logic.moved(C({ slowP: 'p999' }), C({})), ['pSlow']);
  assert.deepEqual(logic.moved(C({ rho: 0.8, cv2: 9 }), C({ rho: 0.8 })), ['p99']);     // ×5 against ×4.2: no tie
  assert.deepEqual(logic.moved(C({ cv2: 9 }), C({ fanout: 100 })), ['pSlow']);         // |ln|: 63.4× beats 5×
  // ρ 0.1 → 0.8 at cv² 0: W ×2.84, p99 ×4.5
  assert.deepEqual(logic.moved(C({ rho: 0.8, cv2: 0 }), C({ rho: 0.1, cv2: 0 })), ['p99']);
});

test('caption choice: a left-only change tells the left story, a right-only change the right one', () => {
  assert.equal(key({ cv2: 9 }, {}), 'tail');
  assert.equal(key({ cv2: 9, fanout: 100 }, { fanout: 100 }), 'tail');             // left change wins at N 100
  assert.equal(key({ cv2: 9, rho: 0.5 }, { cv2: 9 }), 'cv2Load');                  // ×3 and ×5: not decoupled, under load
  assert.equal(key({ cv2: 2, rho: 0.5 }, {}), 'cv2Load');
  assert.equal(key({ cv2: 2 }, {}), 'cv2Up');                                      // ×1.05 and ×1.5
  assert.equal(key({ cv2: 4 }, {}), 'tail');
  assert.equal(key({ cv2: 1 }, { cv2: 9 }), 'cv2Ref');
  assert.equal(key({ cv2: 0 }, {}), 'cv2Down');
  assert.equal(key({ fanout: 10, cv2: 9 }, { cv2: 9 }), 'fanout');                 // right change wins at cv² 9
  assert.equal(key({ fanout: 1 }, { fanout: 10 }), 'fanOne');
  assert.equal(key({ slowP: 'p999' }, {}), 'fanOne');
  assert.equal(key({ fanout: 100, slowP: 'p999' }, { fanout: 100 }), 'fanout');
});

// ── presets: the task's numbers (SPEC.md table) ──

test('preset tail-decoupled: cv² 1 → 9 at ρ 0.1: W 0.111 → 0.156 s, p99 0.512 → 2.558 s (dc-sim acceptance a)', () => {
  const hi = C(preset('tail-decoupled')), lo = C({});
  near(lo.wMean, 0.1111, 1e-3); near(hi.wMean, 0.1556, 1e-3);
  near(lo.p99, 0.5117, 1e-3); near(hi.p99, 2.5584, 1e-3);
  near(hi.ratioMean, 1.4); near(hi.ratioP99, 5);
  assert.ok(hi.ratioP99 > 3 && hi.ratioMean < 1.5 && hi.ratioP99 > 2 * hi.ratioMean);   // the dc-sim assertions
  near(hi.lambda, 1);
  assert.equal(hi.decoupled, true);
});

test('preset fanout-10: 1 − 0.99^10 = 9.56 %', () => {
  near(C(preset('fanout-10')).pSlow, 0.0956179, 1e-6);
});

test('preset fanout-100: 1 − 0.99^100 = 63.4 % (Dean & Barroso)', () => {
  near(C(preset('fanout-100')).pSlow, 0.6339677, 1e-6);
  near(C(preset('fanout-100')).slowCalls, 1);
});

test('preset p999: N 100 at p99.9: 1 − 0.999^100 = 9.52 %', () => {
  const s = C(preset('p999'));
  near(s.pSlow, 0.0952079, 1e-6);
  assert.equal(s.q, 0.001);
});

test('the sketch has the model\'s mean and p99 (gamma fitted to both)', () => {
  for (const rho of [0.1, 0.5, 0.8]) for (const cv2 of [0, 1, 9, 16]) {
    const s = C({ rho, cv2 });
    const sk = logic.sketchOf(s);
    near(sk.floor + sk.shape * sk.scale, s.wMean, 1e-12);
    near(sk.floor + sk.scale * logic.gammaQuantile(sk.shape, 0.99), s.p99, 1e-6);
    assert.equal(sk.floor, cv2 === 0 ? 0.1 : 0);
  }
  near(logic.sketch(1, LN100).shape, 1, 1e-6);           // cv² 1: exponential
  near(logic.sketchOf(C({ cv2: 0 })).floor, 0.1);
  near(logic.gammaP(1, 2), 1 - Math.exp(-2), 1e-12);
  near(logic.gammaP(0.5, 1), 0.8427007929497149, 1e-12);  // erf(1)
  near(logic.gammaP(3, 7), 1 - Math.exp(-7) * (1 + 7 + 24.5), 1e-12);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe and deterministic for every preset', () => {
  for (const x of logic.presets) {
    const s = C(x.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    assert.deepEqual(C(x.params), s);
  }
});

test('compute does not mutate its params', () => {
  const p = P(preset('p999'));
  const copy = structuredClone(p);
  logic.compute(p);
  assert.deepEqual(p, copy);
});

test('every param combination gives a finite, JSON-safe state', () => {
  for (let cv2 = 0; cv2 <= 16; cv2++) for (const rho of [0.1, 0.5, 0.8]) for (const fanout of [1, 2, 99, 200]) for (const slowP of ['p99', 'p999']) {
    const s = C({ cv2, rho, fanout, slowP });
    for (const k of ['wMean', 'p99', 'p999', 'ratioMean', 'ratioP99', 'pSlow', 'slowCalls', 'threshold']) {
      assert.ok(Number.isFinite(s[k]), `${cv2} ${rho} ${fanout} ${slowP} ${k}`);
    }
    assert.ok(s.pSlow > 0 && s.pSlow < 1);
    assert.ok(s.wMean < s.p99);
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the model is listed in sim.json entries, with model params only', () => {
  const fs = require('node:fs'), path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.deepEqual(json.entries.map((e) => e.preset), logic.presets.map((x) => x.id));
  for (const x of logic.presets) for (const k of Object.keys(x.params)) assert.ok(k in logic.defaults, `${x.id}: ${k}`);
});
