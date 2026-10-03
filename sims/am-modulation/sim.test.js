// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the diode AM modulator model. Run: node --test sims/am-modulation/
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
const near = (a, b, eps) => Math.abs(a - b) <= eps;
const C = logic.CIRCUIT;

// One state per setting is enough: the transient takes ~50 ms each.
const base = at({});
const fm1k = at({ fm: 1000 });
const noTank = at({ tank: false });
const noNf = at({ am: 0 });
const strong = at({ am: 15 });

// ── tie-breaks first ──

test('tie-break: a flat-topped peak counts once, at its first sample', () => {
  assert.deepEqual(logic.carrierPeaks([0, 1, 1, 0, 0.5, 0]), { max: 1, min: 0.5 });
  // a plateau on the way up is not a peak; a plateau at the end of the samples is not either
  assert.deepEqual(logic.carrierPeaks([0, 1, 2, 2, 3, 0]), { max: 3, min: 3 });
  assert.deepEqual(logic.carrierPeaks([0, 2, 0, 1, 1]), { max: 2, min: 2 });
  // nothing positive gives 0, 0
  assert.deepEqual(logic.carrierPeaks([0, -1, 0, -1, 0]), { max: 0, min: 0 });
});

test('tie-break: the diode current at exactly zero drive is zero, and the root is unique on both sides of it', () => {
  assert.equal(logic.diodeCurrent(0, 500), 0);
  for (const v of [-5, -0.3, 0.2, 0.6, 1, 3]) {
    const i = logic.diodeCurrent(v, 500);
    const nvt = C.n * C.vt;
    const resid = i - C.is * (Math.exp((v - i * 500) / nvt) - 1);
    assert.ok(Math.abs(resid) < 1e-12, `v = ${v}: residual ${resid}`);
  }
  // reverse: the current never goes below −Is
  assert.ok(logic.diodeCurrent(-5, 500) >= -C.is);
});

// ── rules of this model ──

test('the circuit values are the original\'s', () => {
  assert.deepEqual(
    [C.fc, C.uc, C.r1, C.r2, C.is, C.n, C.c1, C.l1, C.c2, C.l2, C.r3],
    [10000, 2, 1000, 1000, 1.88e-8, 2, 47e-9, 0.33, 12e-9, 0.022, 6800]);
  assert.deepEqual(logic.defaults, { fm: 500, am: 5, tank: true });
});

test('the tank resonates near the carrier: f0 = 1 / (2π √(LC)) ≈ 9.8 kHz, Q = R √(C/L) ≈ 5', () => {
  assert.ok(near(logic.tankF0(), 9795.31, 0.01));
  assert.ok(near(logic.tankQ(), 5.0221, 1e-4));
  assert.ok(base.bandLo < C.fc && C.fc < base.bandHi);
  assert.ok(near(base.bandHi - base.bandLo, base.f0 / base.q, 1e-9));
});

test('the sidebands sit at fc − fm and fc + fm, and move with fm', () => {
  assert.equal(base.lsb, 9500);
  assert.equal(base.usb, 10500);
  assert.equal(fm1k.lsb, 9000);
  assert.equal(fm1k.usb, 11000);
  // the strongest lines of the spectrum are the carrier and the two sidebands, in that order of size
  for (const st of [base, fm1k]) {
    const ranked = st.spectrum.map((a, k) => [k * st.bin, a]).sort((x, y) => y[1] - x[1] || x[0] - y[0]).slice(0, 3).map((x) => x[0]);
    assert.deepEqual(ranked.slice(0, 1), [C.fc]);
    assert.deepEqual(ranked.slice(1).sort((a, b) => a - b), [st.lsb, st.usb]);
  }
});

test('with the original values: carrier ≈ 0.43 V, sidebands ≈ 0.10 V each, m ≈ 0.48', () => {
  assert.ok(near(base.aCarrier, 0.425, 0.005), `carrier ${base.aCarrier}`);
  assert.ok(near(base.aLsb, 0.107, 0.005), `lsb ${base.aLsb}`);
  assert.ok(near(base.aUsb, 0.104, 0.005), `usb ${base.aUsb}`);
  assert.ok(near(base.depth, 0.48, 0.02), `m ${base.depth}`);
  // each sideband is about m/2 of the carrier (within the diode's distortion)
  assert.ok(near(base.aLsb / base.aCarrier, base.depth / 2, 0.03));
});

test('no AF signal: no sidebands, an unchanging carrier (m = 0)', () => {
  assert.ok(noNf.aLsb < 1e-3 && noNf.aUsb < 1e-3, `${noNf.aLsb} ${noNf.aUsb}`);
  assert.ok(noNf.aCarrier > 0.4);
  assert.ok(noNf.depth < 0.01, `m ${noNf.depth}`);
});

test('a stronger AF signal deepens the modulation and strengthens the sidebands', () => {
  assert.ok(strong.depth > 0.9 && strong.depth < 1, `m ${strong.depth}`);
  assert.ok(strong.aLsb > 2 * base.aLsb * 0.9);
  const depths = [0, 3, 6, 9, 12].map((am) => at({ am }).depth);
  for (let i = 1; i < depths.length; i++) assert.ok(depths[i] > depths[i - 1], depths.join(' '));
});

test('the tank suppresses the mixing products: without it the carrier harmonics come through', () => {
  const k20 = 20000 / base.bin, k30 = 30000 / base.bin;
  assert.ok(noTank.spectrum[k20] > 3 * base.spectrum[k20], `${noTank.spectrum[k20]} vs ${base.spectrum[k20]}`);
  assert.ok(noTank.spectrum[k20] > 0.1);
  assert.ok(noTank.spectrum[k30 - 10] > 2 * base.spectrum[k30 - 10]);   // 29.5 kHz, a sideband of the 3rd harmonic
  // the AF itself is kept out by the high-pass either way
  assert.ok(base.aNf < 0.01 && noTank.aNf < 0.05);
});

test('the high-pass and the tank are wired as the original: AF blocked, carrier passed', () => {
  // drive the network without the diode's nonlinearity: a big AF alone gives almost no output at fm
  const only = logic.simulate(500, 1.5, true);
  const sp = logic.spectrum(only.out, 1000);
  assert.ok(sp[10] < 0.03, `AF at the output ${sp[10]}`);
});

test('the integration is converged: a quarter of the step or four times the run-in moves no line by 0.1 %', () => {
  const lines = (sim) => { const sp = logic.spectrum(sim.out, 11000); return [sp[190], sp[200], sp[210]]; };
  const ref = lines(logic.simulate(500, 0.5, true));
  const fine = lines(logic.simulate(500, 0.5, true, { dt: 2.5e-7 }));
  const long = lines(logic.simulate(500, 0.5, true, { settle: 0.08 }));
  for (let i = 0; i < 3; i++) {
    assert.ok(Math.abs(fine[i] / ref[i] - 1) < 1e-3, `dt: ${fine[i]} vs ${ref[i]}`);
    assert.ok(Math.abs(long[i] / ref[i] - 1) < 1e-3, `settle: ${long[i]} vs ${ref[i]}`);
  }
});

test('solve: a small linear system by elimination with pivoting', () => {
  const x = logic.solve([[0, 1], [2, 3]], [2, 8]);
  assert.ok(near(x[0], 1, 1e-12) && near(x[1], 2, 1e-12));
});

test('spectrum: a pure sine of amplitude A over whole periods shows A at its bin and nothing else', () => {
  const N = 4000, xs = [];
  for (let n = 0; n < N; n++) xs.push(0.7 * Math.sin(2 * Math.PI * 200 * n / N) + 0.2);
  const sp = logic.spectrum(xs, 20000);
  assert.ok(near(sp[200], 0.7, 1e-9));
  assert.ok(near(sp[0], 0.2, 1e-9));
  assert.ok(sp.every((a, k) => k === 0 || k === 200 || a < 1e-9));
});

test('params are clamped and snapped: fm to 250 … 2500 in 50 Hz, am to 0 … 1.5 V in 0.1 V', () => {
  const st = logic.initial({ fm: 90, am: 99, tank: 'false' });
  assert.equal(st.fm, 250);
  assert.equal(st.am, 1.5);
  assert.equal(st.tank, false);
  assert.equal(logic.initial({ fm: 1234, am: 2.4, tank: true }).fm, 1250);
  assert.equal(logic.initial({ fm: 'x', am: 'y', tank: true }).fm, 250);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const p of logic.presets) {
    const st = at(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(st)), st);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ fm: 750 });
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
  assert.equal(new Set(logic.presets.map((p) => p.id)).size, logic.presets.length);
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: param ${k}`);
    const st = at(p.params);
    assert.equal(st.fm, p.params.fm, `preset ${p.id} fm in range`);
    assert.equal(st.amt, p.params.am, `preset ${p.id} am in range`);
  }
});
