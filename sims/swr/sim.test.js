// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for swr's model (SPEC.md). Run: node --test sims/swr/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
/** The state for a load R on Z0 (R in Ω, through the slider index). */
const at = (R, Z0 = 50, lossDb = 0) => logic.derive(P({ r: logic.rIndex(R), z0: Z0, end: 'load', lossDb }));
const preset = (id) => logic.derive(P(logic.presets.find((p) => p.id === id).params));
const near = (a, b, tol = 1e-9, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} ≈ ${b}`);
const round = (x, d) => Math.round(x * 10 ** d) / 10 ** d;

// ── tie-breaks first ──

test('tie-break: R = Z0 is matched: Γ exactly 0, SWR 1, flat envelope, neither maximum nor minimum at the load', () => {
  for (const z0 of [50, 75]) {
    const s = at(z0, z0);
    assert.equal(s.gamma, 0);
    assert.equal(s.swrLoad, 1);
    assert.equal(s.flat, true);
    assert.equal(s.maxAtLoad, false);
    assert.equal(s.minAtLoad, false);
    assert.deepEqual(s.maxima, []);
    assert.deepEqual(s.minima, []);
    assert.ok(s.envelope.every((p) => p.v === 1), 'flat at 1');
  }
});

test('tie-break rule 7: class boundaries are inclusive, with a tolerance for floating-point noise', () => {
  assert.equal(logic.swrClass(1), 0);
  assert.equal(logic.swrClass(1 + 1e-12), 0);
  assert.equal(logic.swrClass(1.0001), 1);
  assert.equal(logic.swrClass(2), 1);
  assert.equal(logic.swrClass(2.0000000000000004), 1);
  assert.equal(logic.swrClass(2.01), 2);
  assert.equal(logic.swrClass(3), 2);
  assert.equal(logic.swrClass(3.0000000000000004), 2);
  assert.equal(logic.swrClass(logic.swrFromPowers(100, 25)), 2, 'swr_2: P_R 25 W of 100 W is exactly class ≤ 3');
  assert.equal(logic.swrClass(3.01), 3);
  assert.equal(logic.swrClass(null), 3, '∞ is worse');
  // R = 100 Ω through the |Γ| form is 1.9999999999999998; the model's load SWR is exact
  assert.equal(at(100).swrLoad, 2);
  assert.equal(at(100).classLoad, 1);
  assert.equal(at(100).classTx, 1);
});

test('tie-break rule 2: P_R ≥ P_V gives ∞ (null), P_R = 0 gives 1, at any loss', () => {
  assert.equal(logic.swrFromPowers(100, 100), null);
  assert.equal(logic.swrFromPowers(100, 120), null);
  assert.equal(logic.swrFromPowers(100, 0), 1);
  assert.equal(logic.swrFromPowers(0, 0), null);
  for (const L of [0, 0.5, 5, 10]) assert.equal(at(50, 50, L).swrMeter, 1, `matched at ${L} dB`);
  const open = logic.derive(P({ end: 'open', lossDb: 0 }));
  assert.equal(open.swrMeter, null);
  assert.equal(open.meter.tx.pr, 100);
});

test('tie-break rule 6: SWR 99 is shown, above 99 is ∞; R is clamped to 1 Ω … 10 kΩ', () => {
  assert.equal(logic.shown(99), 99);
  assert.equal(logic.shown(99.01), null);
  assert.equal(logic.shown(null), null);
  assert.equal(logic.shown(logic.stateFor('load', 4950, 50, 0).swrLoad), 99);
  assert.equal(logic.shown(logic.stateFor('load', 5000, 50, 0).swrLoad), null);
  assert.equal(logic.stateFor('load', 20000, 50, 0).R, 10000);
  assert.equal(logic.stateFor('load', 20000, 50, 0).swrLoad, 200);
  assert.equal(logic.stateFor('load', 0.1, 50, 0).R, 1);
  assert.equal(logic.stateFor('load', 0.1, 50, 0).swrLoad, 50);
  assert.equal(logic.shown(at(1000).swrLoad), 20, 'the slider ends at SWR 20 on 50 Ω');
});

test('tie-break: open or short wins over R; out-of-range params are cleaned', () => {
  const a = logic.derive(P({ r: logic.rIndex(10), end: 'open' }));
  const b = logic.derive(P({ r: logic.rIndex(1000), end: 'open' }));
  assert.deepEqual(a, b);
  assert.equal(a.R, null);
  assert.deepEqual(logic.clean({ r: 99, z0: 60, end: 'nonsense', lossDb: 40 }), { r: 30, z0: 50, end: 'load', lossDb: 10 });
  assert.deepEqual(logic.clean({ r: -3.4, z0: '75', end: 'short', lossDb: -1 }), { r: 0, z0: 75, end: 'short', lossDb: 0 });
  assert.equal(logic.clean({ r: 16.6 }).r, 17);
});

// ── rules ──

test('rule 1: Γ = (R − Z0)/(R + Z0); SWR = R/Z0 above Z0 and Z0/R below (swr_3: 100 Ω → 2, 10 Ω → 5)', () => {
  near(at(100).gamma, 1 / 3);
  near(at(10).gamma, -2 / 3);
  near(at(150).gamma, 0.5);
  assert.equal(at(100).swrLoad, 2);
  assert.equal(at(10).swrLoad, 5);
  assert.equal(at(150, 75).swrLoad, 2);
  assert.equal(at(25, 75).swrLoad, 3);
  // the |Γ| form agrees with the ratio form for every slider value on both lines
  for (const z0 of [50, 75]) {
    for (const R of logic.R_VALUES) {
      const s = at(R, z0), g = Math.abs(s.gamma);
      near(s.swrLoad, (1 + g) / (1 - g), 1e-9 * s.swrLoad, `R ${R} on ${z0}`);
      assert.equal(s.swrLoad, R >= z0 ? R / z0 : z0 / R);
    }
  }
});

test('rule 2: reflected fraction |Γ|²; SWR from powers (swr_2: 100 W and 25 W → 3; table e_swr_werte)', () => {
  assert.equal(logic.swrFromPowers(100, 25), 3);
  const table = { 75: [1.5, 4], 100: [2, 11.1], 125: [2.5, 18.4], 150: [3, 25], 200: [4, 36], 300: [6, 51], 500: [10, 66.9], 1000: [20, 81.9] };
  for (const [R, [swr, pct]] of Object.entries(table)) {
    const s = at(Number(R));
    assert.equal(round(s.swrLoad, 2), swr, `SWR of ${R} Ω`);
    assert.equal(round(s.reflPct, 1), pct, `% of ${R} Ω`);
    near(s.swrMeter, s.swrLoad, 1e-9 * s.swrLoad, `meter = load without loss, ${R} Ω`);
  }
});

test('rule 3: envelope U_max/U_min = SWR, maximum at the load above Z0, minimum below, maxima λ/2 apart', () => {
  for (const R of [10, 100, 150, 300, 25]) {
    const s = at(R);
    const vs = s.envelope.map((p) => p.v);
    near(Math.max(...vs), s.umax, 1e-12, `U_max ${R}`);
    near(Math.min(...vs), s.umin, 1e-12, `U_min ${R}`);
    near(s.umax / s.umin, s.swrLoad, 1e-9, `ratio ${R}`);
    const atLoad = s.envelope[s.envelope.length - 1];
    near(atLoad.x, logic.LEN, 0);
    if (R > 50) { assert.equal(s.maxAtLoad, true); near(atLoad.v, s.umax, 1e-12); }
    else { assert.equal(s.minAtLoad, true); near(atLoad.v, s.umin, 1e-12); }
    // neighbouring maxima and minima λ/2 apart; a maximum and the next minimum λ/4
    for (const xs of [s.maxima, s.minima]) for (let i = 1; i < xs.length; i++) near(xs[i] - xs[i - 1], 0.5, 1e-12);
    near(Math.abs(s.maxima[0] - s.minima[0]), 0.25, 1e-12);
    // every listed extreme is a sample, at the right height
    for (const x of s.maxima) near(s.envelope.find((p) => Math.abs(p.x - x) < 1e-9).v, s.umax, 1e-12);
    for (const x of s.minima) near(s.envelope.find((p) => Math.abs(p.x - x) < 1e-9).v, s.umin, 1e-12);
  }
  assert.deepEqual(at(100).maxima, [0, 0.5, 1, 1.5, 2, 2.5]);
  assert.deepEqual(at(10).maxima, [0.25, 0.75, 1.25, 1.75, 2.25]);
  assert.equal(at(100).envelope.length, logic.SAMPLES);
});

test('rule 3: the envelope is |1 + Γ·e^(−j2βd)| with d measured from the load at the right end', () => {
  for (const g of [at(100).gamma, at(10).gamma, 0.2]) {
    logic.envelope(g).forEach((p) => {
      const th = 4 * Math.PI * (logic.LEN - p.x);
      near(p.v, Math.hypot(1 + g * Math.cos(th), -g * Math.sin(th)), 1e-12, `Γ ${g}, x ${p.x}`);
    });
  }
});

test('rule 3: any mismatch is not flat (R = 40 Ω and 60 Ω on 50 Ω have maxima and minima)', () => {
  for (const R of [40, 60]) {
    const s = at(R);
    assert.equal(s.flat, false, `${R} Ω`);
    assert.ok(s.maxima.length > 0 && s.minima.length > 0, `${R} Ω extremes`);
  }
});

test('the forward wave travels toward the load, the reflected wave back toward the transmitter', () => {
  const crest = (g, ph) => { const pts = logic.instant(g, ph); return pts.reduce((b, p) => (p.v > b.v ? p : b)).x; };
  // Γ = 0: only the forward wave; the crest nearest the middle moves to larger x (toward the load)
  const near0 = (g, ph) => logic.instant(g, ph).filter((p) => p.x > 1 && p.x < 2).reduce((b, p) => (p.v > b.v ? p : b)).x;
  assert.ok(near0(0, 0.2) > near0(0, 0), 'forward crest moves toward the load');
  // only the reflected part (instant(Γ) − instant(0) at Γ = 1): its crest moves toward the transmitter
  const refl = (ph) => {
    const a = logic.instant(1, ph), f = logic.instant(0, ph);
    return a.map((p, i) => ({ x: p.x, v: p.v - f[i].v })).filter((p) => p.x > 1 && p.x < 2).reduce((b, p) => (p.v > b.v ? p : b)).x;
  };
  assert.ok(refl(0.2) < refl(0), 'reflected crest moves toward the transmitter');
  assert.equal(typeof crest(0, 0), 'number');
});

test('rule 3: the instantaneous voltage never leaves the envelope', () => {
  for (const g of [at(100).gamma, at(10).gamma, 1, -1, 0]) {
    const env = logic.envelope(g);
    for (const ph of [0, 0.7, 1.9, Math.PI, 4.4]) {
      logic.instant(g, ph).forEach((p, i) => assert.ok(Math.abs(p.v) <= env[i].v + 1e-9, `Γ ${g}, phase ${ph}, x ${p.x}`));
    }
  }
});

test('rule 4: open and short reflect everything: |Γ| = 1, SWR ∞ (null), U_min 0; open has a maximum at the end', () => {
  const o = logic.derive(P({ end: 'open' })), s = logic.derive(P({ end: 'short' }));
  assert.equal(o.gamma, 1);
  assert.equal(s.gamma, -1);
  for (const x of [o, s]) {
    assert.equal(x.swrLoad, null);
    assert.equal(x.reflPct, 100);
    assert.equal(x.umin, 0);
    assert.equal(x.umax, 2);
    assert.equal(x.classLoad, 3);
  }
  assert.equal(o.maxAtLoad, true);
  assert.equal(s.minAtLoad, true);
  near(s.envelope[s.envelope.length - 1].v, 0, 1e-12);
});

test('rule 5: line loss: P_R/P_V at the transmitter is |Γ|²·10^(−2L/10); the meter reads better than the load', () => {
  const lo = preset('lossy-open');
  near(lo.meter.tx.pr, 10, 1e-9, 'AG404: P_R is a tenth of P_V');
  assert.equal(round(lo.swrMeter, 2), 1.92);
  assert.equal(lo.swrLoad, null);
  assert.equal(lo.meter.load.reflPct, 100);
  near(lo.meter.load.pv, 100 * 10 ** -0.5, 1e-9);
  near(lo.meter.load.pr, 31.6227766, 1e-6, 'P_R at the load = |Γ|²·P_V,load');
  near(lo.meter.load.pr, lo.meter.load.pv, 1e-12);
  near(at(100, 50, 3).meter.load.pr, (100 / 9) * 10 ** -0.3, 1e-9);
  // swr_3's half-and-half example: half the power lost each way → SWR 3 at the transmitter
  near(logic.meters(1, null, 10 * Math.log10(2)).tx.swr, 3, 1e-9);
  const open = (L) => round(logic.derive(P({ end: 'open', lossDb: L })).swrMeter, 2);
  assert.deepEqual([0.5, 1, 3, 10].map(open), [17.39, 8.72, 3.01, 1.22]);
  assert.equal(round(at(100, 50, 3).swrMeter, 2), 1.4);
  // loss never changes the load's SWR or the envelope
  assert.deepEqual(at(100, 50, 7).envelope, at(100, 50, 0).envelope);
  assert.equal(at(100, 50, 7).swrLoad, 2);
  // more loss, better reading, for every mismatch
  for (const R of [10, 100, 1000]) assert.ok(at(R, 50, 2).swrMeter < at(R, 50, 1).swrMeter);
});

test('presets give the task\'s numbers', () => {
  const m = preset('matched');
  assert.equal(m.swrLoad, 1); assert.equal(m.reflPct, 0); assert.equal(m.flat, true);
  const b = preset('book-100');
  assert.equal(b.swrLoad, 2); assert.equal(round(b.gamma, 3), 0.333); assert.equal(round(b.reflPct, 1), 11.1); assert.equal(b.maxAtLoad, true);
  const t = preset('book-10');
  assert.equal(t.swrLoad, 5); assert.equal(round(t.reflPct, 1), 44.4); assert.equal(t.minAtLoad, true);
  const s3 = preset('swr-3');
  assert.equal(s3.swrLoad, 3); assert.equal(s3.reflPct, 25); near(s3.meter.tx.pr, 25, 1e-9); assert.equal(s3.meter.tx.pv, 100);
  const f = preset('folded-dipole');
  assert.equal(f.swrLoad, 6); assert.equal(round(f.reflPct, 0), 51);
  const lo = preset('lossy-open');
  assert.equal(lo.end, 'open'); assert.equal(lo.lossDb, 5);
});

test('the slider spans 1 … 1000 Ω in 31 log steps with every preset value on it', () => {
  assert.equal(logic.R_VALUES.length, 31);
  assert.equal(logic.R_VALUES[0], 1);
  assert.equal(logic.R_VALUES[30], 1000);
  for (let i = 1; i < 31; i++) assert.ok(logic.R_VALUES[i] > logic.R_VALUES[i - 1]);
  for (const R of [10, 50, 75, 100, 150, 300]) assert.ok(logic.rIndex(R) >= 0, `${R} Ω on the slider`);
  assert.equal(logic.R_VALUES[logic.defaults.r], 50);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of logic.presets.concat([{ params: { end: 'short' } }])) {
    const s = logic.initial(P(p.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ r: 3, z0: 75, lossDb: 2.5 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model, on the controls\' scale, and named in both tables', () => {
  for (const p of logic.presets) {
    assert.deepEqual(Object.keys(p.params).sort(), ['end', 'lossDb', 'r', 'z0'], `${p.id} sets every model param`);
    assert.deepEqual(logic.clean(p.params), p.params, `${p.id} is on the controls' scale`);
    assert.equal((p.params.lossDb * 2) % 1, 0, `${p.id} loss on the 0.5 dB step`);
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + p.id.replace(/-/g, '_')], `${lang} name of ${p.id}`);
      assert.ok(strings[lang]['hint_' + p.id.replace(/-/g, '_')], `${lang} hint of ${p.id}`);
    }
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
