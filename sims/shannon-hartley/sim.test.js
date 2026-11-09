// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the Shannon–Hartley model (SPEC.md). Run: node --test sims/shannon-hartley/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const G = logic.gridIndex;
const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => logic.initial(P(over));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} ≉ ${b} (±${tol})`);

// ── tie-breaks first ──

test('tie-break: R = C is the limit, not below; just under is below, just over above', () => {
  assert.equal(logic.verdict(2400, 2400), 'limit');
  assert.equal(logic.verdict(2400, 2400 * (1 + 1e-12)), 'limit');      // the rounding of B · log2(…)
  assert.equal(logic.verdict(2399, 2400), 'below');
  assert.equal(logic.verdict(2401, 2400), 'above');
  // on the grid: 0 dB and R = B
  const s = at({ b: G(2400), snr: 0, target: true, rate: G(2400) });
  assert.equal(s.verdict, 'limit');
  near(s.requiredSnrDb, 0, 1e-9);
});

test('tie-break: C exactly a power of ten has reached that decade', () => {
  assert.equal(logic.decade(1000), 3);
  assert.equal(logic.decade(999.9999999999), 3);
  assert.equal(logic.decade(1000.0000000001), 3);
  assert.equal(logic.decade(999), 2);
  assert.equal(logic.decade(9999), 3);
  assert.equal(at({ b: G(1000), snr: 0 }).decade, 3);                   // C = B = 1000
  assert.equal(at({ b: G(100), snr: 0 }).decade, 2);
  assert.equal(logic.decade(0.0144), -2);
});

test('tie-break: the width axis is the smallest 1, 2, 5 · 10^k that holds B, B itself when it is one', () => {
  assert.equal(logic.axisMax(2400), 5000);
  assert.equal(logic.axisMax(4800), 5000);       // doubling 2.4 → 4.8 kHz doubles the drawn width
  assert.equal(logic.axisMax(5000), 5000);
  assert.equal(logic.axisMax(1e7), 1e7);
  assert.equal(logic.axisMax(2e7), 2e7);
  assert.equal(logic.axisMax(10), 10);
  assert.equal(logic.axisMax(12), 20);
  assert.equal(logic.axisMax(9.6e6), 1e7);
  for (let i = logic.B_MIN; i <= logic.B_MAX; i++) {
    const B = logic.GRID[i], ax = logic.axisMax(B);
    assert.ok(ax >= B && B / ax >= 0.48, `B = ${B}: axis ${ax}`);
  }
});

// ── rules ──

test('rule 1: C = B · log2(1 + S/N), linear in B', () => {
  near(logic.capacity(2400, 10), 8302.64, 0.01);
  near(logic.capacity(2400, 30), 23921.34, 0.01);
  near(logic.capacity(4800, 10), 16605.27, 0.01);
  near(logic.capacity(2500, -20), 35.89, 0.01);
  near(logic.capacity(1e7, 20), 66582114.8, 0.1);
  near(logic.capacity(2e7, 30), 199344525.2, 0.1);
  near(logic.capacity(4800, 10), 2 * logic.capacity(2400, 10), 1e-6, 'twice B, twice C');
  // twice the power (+3 dB) is not twice the capacity
  near(logic.capacity(2400, 13), 10533.74, 0.01);
  assert.ok(logic.capacity(2400, 13) < 1.3 * logic.capacity(2400, 10));
});

test('rule 2: dB to linear, and 0 dB gives C = B exactly', () => {
  assert.equal(logic.dbToLin(0), 1);
  assert.equal(logic.dbToLin(10), 10);
  assert.equal(logic.dbToLin(-20), 0.01);
  near(logic.dbToLin(3), 1.995, 0.001);
  for (const B of [10, 2400, 2500, 1e7, 2e7]) assert.equal(logic.capacity(B, 0), B);
  const s = at({ b: G(2400), snr: 0 });
  assert.equal(s.C, 2400);
  assert.equal(s.bitsPerHz, 1);
});

test('rule 3: required S/N = 2^(R/B) − 1, exploding for R ≫ B', () => {
  near(logic.requiredSnrDb(4800, 2400), 4.771, 0.001);       // twice the rate: 2² − 1 = 3
  near(logic.requiredSnrDb(9600, 2400), 11.761, 0.001);      // four times: 2⁴ − 1 = 15
  near(logic.requiredSnrDb(48000, 2400), 60.206, 0.001);     // 20 times: 2²⁰ − 1
  near(logic.requiredSnrDb(1200, 2400), 10 * Math.log10(Math.SQRT2 - 1), 1e-9);
  // the inverse of rule 1 at every dB of the slider
  for (let d = logic.SNR_MIN; d <= logic.SNR_MAX; d++) near(logic.requiredSnrDb(logic.capacity(2400, d), 2400), d, 1e-6, `${d} dB`);
  // continuous across the switch to the asymptote at R/B = 60, and finite where 2^(R/B) overflows
  near(logic.requiredSnrDb(60 * 2400, 2400), logic.requiredSnrDb(60.000001 * 2400, 2400), 1e-3);
  const huge = logic.requiredSnrDb(1e9, 10);
  assert.ok(Number.isFinite(huge));
  near(huge, 1e8 * 10 * Math.log10(2), 1);
  // roughly 3 dB per extra bit per hertz once R/B is large
  near(logic.requiredSnrDb(21 * 2400, 2400) - logic.requiredSnrDb(20 * 2400, 2400), 3.0103, 0.001);
  // a tiny R/B needs a very low S/N, without losing precision
  near(logic.requiredSnrDb(1, 2e7), 10 * Math.log10(Math.LN2 / 2e7), 1e-6);
});

test('rule 4: a target is below, at or above the bound C', () => {
  const s = (snr, r) => at({ b: G(2400), snr, target: true, rate: G(r) });
  assert.equal(s(10, 4800).verdict, 'below');
  assert.equal(s(4, 4800).verdict, 'above');       // 4 dB < 4.77 dB
  assert.equal(s(5, 4800).verdict, 'below');
  assert.equal(s(11, 9600).verdict, 'above');      // 11 dB < 11.76 dB
  assert.equal(s(12, 9600).verdict, 'below');
  assert.equal(s(10, 48000).verdict, 'above');
  assert.equal(s(40, 48000).verdict, 'above');     // even the top of the slider is short of 60.2 dB
  // the verdict agrees with comparing the S/N against the required S/N
  for (let d = -30; d <= 40; d += 7) {
    const x = s(d, 9600);
    assert.equal(x.verdict === 'above', d < x.requiredSnrDb, `${d} dB`);
  }
});

test('rule 5: the FT8 example carries the reference-band flag, and only it', () => {
  const ex = at({}).examples;
  assert.deepEqual(ex.map((e) => e.id), ['ft8', 'ssb', 'hamnet', 'wlan']);
  assert.deepEqual(ex.filter((e) => e.ref).map((e) => e.id), ['ft8']);
  const ft8 = ex[0];
  assert.equal(ft8.B, 2500);
  assert.equal(ft8.snrDb, -20);
  near(ft8.C, 35.89, 0.01);
});

test('examples: their C is rule 1 at their B and SNR, and they do not depend on the params', () => {
  const a = at({}).examples, b = at({ b: G(10), snr: -30, target: true }).examples;
  assert.deepEqual(a, b);
  for (const e of a) near(e.C, logic.capacity(e.B, e.snrDb), 1e-9);
  near(a[1].C, 8302.64, 0.01);
  near(a[2].C, 66582114.8, 0.1);
  near(a[3].C, 199344525.2, 0.1);
});

test('target off: no target fields; target on: rate from the grid', () => {
  const off = at({ target: false });
  for (const k of ['target', 'rateRatio', 'requiredSnrDb', 'verdict']) assert.equal(off[k], null, k);
  const on = at({ target: true, rate: G(9600) });
  assert.equal(on.target, 9600);
  assert.equal(on.rateRatio, 4);
});

test('the log grid: exact values, 13 per decade, B 10 Hz … 20 MHz and R 1 bit/s … 1 Gbit/s', () => {
  const g = logic.GRID;
  for (const v of [10, 2400, 2500, 4800, 9600, 48000, 1e7, 2e7, 1, 1e9]) assert.ok(g.includes(v), `${v} on the grid`);
  assert.equal(g[logic.B_MIN], 10);
  assert.equal(g[logic.B_MAX], 2e7);
  assert.equal(g[logic.RATE_MIN], 1);
  assert.equal(g[logic.RATE_MAX], 1e9);
  assert.equal(g.length, 9 * 13 + 1);                               // 1 … 9.6·10⁸, then 10⁹
  for (let k = 0; k < 9; k++) {
    const lo = 10 ** k, hi = 10 ** (k + 1);
    assert.equal(g.filter((v) => v >= lo && v < hi).length, 13, `13 values in [${lo}, ${hi})`);
  }
  for (let i = 1; i < g.length; i++) assert.ok(g[i] > g[i - 1], 'increasing');
  for (const v of g) assert.equal(v, Number(v.toPrecision(2)), `${v} has at most two significant digits`);
});

test('params are rounded and clamped to the sliders', () => {
  assert.equal(at({ b: -5 }).B, 10);
  assert.equal(at({ b: 999 }).B, 2e7);
  assert.equal(at({ snr: -99 }).snrDb, -30);
  assert.equal(at({ snr: 99 }).snrDb, 40);
  assert.equal(at({ snr: 9.6 }).snrDb, 10);
  assert.equal(at({ b: 'x' }).B, 2400);
  assert.equal(at({ target: true, rate: 9999 }).target, 1e9);
  assert.equal(at({ target: true, rate: -5 }).target, 1);
  assert.equal(at({ snr: 9.4 }).snrDb, 9);
  assert.equal(at({ snr: -9.6 }).snrDb, -10);
  for (const v of [undefined, null, false, 0]) assert.equal(logic.initial({ b: G(2400), snr: 10, target: v }).target, null, String(v));
});

test('defaults: 2.4 kHz, 10 dB, target off at 9.6 kbit/s', () => {
  assert.deepEqual(logic.defaults, { b: G(2400), snr: 10, target: false, rate: G(9600) });
});

test('the drawn height axis holds the top of the S/N slider, and the state carries the width axis of B', () => {
  assert.ok(logic.Y_MAX >= logic.bitsPerHz(logic.dbToLin(logic.SNR_MAX)));
  assert.ok(logic.Y_MAX - logic.bitsPerHz(logic.dbToLin(logic.SNR_MAX)) < 1, 'and not much more');
  assert.equal(at({ b: G(2400), snr: 40 }).axis, 5000);
  assert.equal(at({ b: G(1e7), snr: -30 }).axis, 1e7);
  assert.equal(at({ b: G(12), snr: 0 }).axis, 20);
});

test('presets give the numbers of the task file', () => {
  const byId = Object.fromEntries(logic.presets.map((p) => [p.id, at(p.params)]));
  assert.deepEqual(Object.keys(byId), ['zero-db', 'ssb-10', 'double-b', 'weak-signal', 'hamnet', 'rate-above-b']);
  assert.equal(byId['zero-db'].C, 2400);
  near(byId['ssb-10'].C, 8302.64, 0.01);
  near(byId['double-b'].C, 16605.27, 0.01);
  near(byId['weak-signal'].C, 35.89, 0.01);
  near(byId.hamnet.C, 66582114.8, 0.1);
  near(byId['rate-above-b'].requiredSnrDb, 60.21, 0.01);
  assert.equal(byId['rate-above-b'].verdict, 'above');
  for (const id of ['zero-db', 'ssb-10', 'double-b', 'weak-signal', 'hamnet']) assert.equal(byId[id].target, null, id);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and at the slider ends', () => {
  const cases = logic.presets.map((p) => p.params).concat([
    { b: logic.B_MIN, snr: -30, target: true, rate: logic.RATE_MAX },
    { b: logic.B_MAX, snr: 40, target: true, rate: logic.RATE_MIN }
  ]);
  for (const c of cases) {
    const s = at(c);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ b: G(4800), snr: 7, target: true, rate: G(12000) });
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
    for (const [k, v] of Object.entries(p.params)) {
      assert.ok(k in logic.defaults, `preset ${p.id}: param ${k}`);
      if (k === 'b' || k === 'rate') assert.ok(v >= 0, `preset ${p.id}: ${k} on the grid`);
    }
    assert.ok(strings.hr['preset_' + p.id] && strings.en['preset_' + p.id + 'Hint'], `preset ${p.id} has strings`);
  }
  for (const e of logic.EXAMPLES) assert.ok(strings.hr['ex_' + e.id] && strings.en['exShort_' + e.id], `example ${e.id} has strings`);
});
