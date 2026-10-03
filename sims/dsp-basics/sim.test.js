// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the balanced (diode-ring) modulator model. Run: node --test sims/dsp-basics/
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

// One state per setting is enough: the transient takes ~130 ms each.
const base = at({});
const slightly = at({ bal: 48 });
const mirrored = at({ bal: 52 });
const far = at({ bal: 30 });
const noAf = at({ am: 0 });
const noAfOff = at({ am: 0, bal: 30 });

// ── tie-breaks first ──

test('tie-break: exactly at an edge the square wave already holds its new half', () => {
  assert.equal(logic.square(10000, 0), 1);
  assert.equal(logic.square(10000, 50e-6), -1);    // the half-period edge
  assert.equal(logic.square(10000, 100e-6), 1);    // the period edge
  // and at whole microseconds, where k · 1e-6 is not exact in floating point, the edges still land on their step
  for (let k = 0; k <= 400; k++) assert.equal(logic.square(10000, k * 1e-6), Math.floor(k / 50) % 2 === 0 ? 1 : -1, `k = ${k}`);
  assert.equal(logic.square(10000, 49.5e-6), 1);
  assert.equal(logic.square(10000, -10e-6), -1);   // negative time keeps the pattern
});

test('tie-break: suppression with no sideband is null; a carrier under 1 mV gives a lower bound', () => {
  assert.equal(logic.suppression(0, 0.5), null);
  assert.equal(logic.suppression(logic.FLOOR / 2, 0), null);
  assert.deepEqual(logic.suppression(0.1, 0), { db: 40, more: true });
  assert.deepEqual(logic.suppression(0.1, logic.FLOOR / 2), { db: 40, more: true });
  // exactly at the floor the carrier is measured, not bounded
  const r = logic.suppression(0.1, logic.FLOOR);
  assert.equal(r.more, false);
  assert.ok(near(r.db, 40, 1e-9));
  // a carrier stronger than the sidebands is negative
  assert.ok(near(logic.suppression(0.1, 1).db, -20, 1e-9));
});

test('tie-break: an exactly centred wiper cancels the carrier, and the two sides of centre are mirror images', () => {
  assert.ok(base.aCarrier < logic.FLOOR, `carrier ${base.aCarrier}`);
  assert.equal(base.supp.more, true);
  assert.ok(near(slightly.aCarrier, mirrored.aCarrier, 1e-3), `${slightly.aCarrier} vs ${mirrored.aCarrier}`);
});

// ── rules of this model ──

test('the circuit values are the original\'s', () => {
  assert.deepEqual(
    [C.fc, C.uc, C.cc, C.rp, C.lp, C.ratio, C.k, C.rl, C.is, C.n, C.vt],
    [10000, 5, 10e-6, 1000, 0.01, 1, 0.999, 1000, 1e-14, 1, 0.025865]);
  assert.deepEqual(logic.defaults, { bal: 50, fm: 1000, am: 5 });
  assert.equal(base.r1, 500);
  assert.equal(base.r2, 500);
  assert.equal(far.r1, 300);
  assert.equal(far.r2, 700);
});

test('the output holds the sidebands at fc − fm and fc + fm, and they move with fm', () => {
  assert.equal(base.lsb, 9000);
  assert.equal(base.usb, 11000);
  const f2 = at({ fm: 2000 });
  assert.equal(f2.lsb, 8000);
  assert.equal(f2.usb, 12000);
  for (const st of [base, f2]) {
    // balanced: the two strongest lines are the two sidebands, nearly equal
    const ranked = st.spectrum.map((a, k) => [k * st.bin, a]).sort((x, y) => y[1] - x[1] || x[0] - y[0]).slice(0, 2).map((x) => x[0]);
    assert.deepEqual(ranked.sort((a, b) => a - b), [st.lsb, st.usb]);
    assert.ok(near(st.aLsb, st.aUsb, 0.005), `${st.aLsb} ${st.aUsb}`);
  }
});

test('with the original values: sidebands ≈ 0.31 V each, the square wave\'s 3rd harmonic repeats them at 29 and 31 kHz', () => {
  assert.ok(near(base.aLsb, 0.309, 0.005), `lsb ${base.aLsb}`);
  assert.ok(near(base.aUsb, 0.309, 0.005), `usb ${base.aUsb}`);
  const k29 = 29000 / base.bin, k31 = 31000 / base.bin, k30 = 30000 / base.bin;
  assert.ok(base.spectrum[k29] > 0.08 && base.spectrum[k31] > 0.08);
  assert.ok(base.spectrum[k30] < logic.FLOOR);
  // the AF itself does not reach the output: the ring switches it at 10 kHz
  assert.ok(base.spectrum[1000 / base.bin] < 0.005);
});

test('off balance the carrier comes back, growing with the wiper\'s distance from the middle', () => {
  const carriers = [50, 49, 48, 45, 40, 30].map((bal) => at({ bal }).aCarrier);
  for (let i = 1; i < carriers.length; i++) assert.ok(carriers[i] > carriers[i - 1], carriers.join(' '));
  // small offsets: about proportional (49 % gives half of 48 %)
  assert.ok(near(carriers[1] * 2, carriers[2], 0.01), carriers.join(' '));
  assert.equal(slightly.supp.more, false);
  assert.ok(slightly.supp.db > 0, `48 %: carrier below the sidebands, ${slightly.supp.db} dB`);
  assert.ok(far.supp.db < 0, `30 %: carrier above the sidebands, ${far.supp.db} dB`);
  // the sidebands stay about where they were
  assert.ok(near(slightly.aLsb, base.aLsb, 0.01));
});

test('no AF signal: balanced gives no carrier and no sidebands; off balance gives the carrier alone', () => {
  assert.ok(noAf.aCarrier < logic.FLOOR && noAf.aLsb < logic.FLOOR && noAf.aUsb < logic.FLOOR);
  assert.equal(noAf.supp, null);
  assert.ok(noAfOff.aCarrier > 0.5, `carrier ${noAfOff.aCarrier}`);
  assert.ok(noAfOff.aLsb < logic.FLOOR && noAfOff.aUsb < logic.FLOOR);
  assert.equal(noAfOff.supp, null);
});

test('a stronger AF signal gives stronger sidebands, about in proportion', () => {
  const side = [1, 3, 5, 10].map((am) => at({ am }).aLsb);
  for (let i = 1; i < side.length; i++) assert.ok(side[i] > side[i - 1], side.join(' '));
  assert.ok(near(side[3] / side[2], 2, 0.15), side.join(' '));
});

test('the diode and the Newton step limit: Shockley current and slope, steps up the exponential are tamed', () => {
  const d = logic.diode(0.6), nvt = C.n * C.vt;
  assert.ok(near(d.i, C.is * (Math.exp(0.6 / nvt) - 1), 1e-15));
  assert.ok(near(d.g, C.is * Math.exp(0.6 / nvt) / nvt, 1e-12));
  assert.equal(logic.diode(0).i, 0);
  assert.equal(logic.limitStep(0.3, 0.2), 0.3);           // below the critical voltage: unchanged
  assert.ok(logic.limitStep(5, 0.6) < 0.8);                // a big step up is cut back
  assert.equal(logic.limitStep(0.6, 0.6), 0.6);
});

test('the transient is solved: every step converges, and four times the run-in changes no line by 0.1 %', () => {
  const ref = logic.simulate(1000, 0.5, 0.48);
  assert.ok(ref.iterations < 100, `iterations ${ref.iterations}`);
  const long = logic.simulate(1000, 0.5, 0.48, { settle: 0.12 });
  const lines = (sim) => { const sp = logic.spectrum(sim.out, 11000); return [sp[90], sp[100], sp[110]]; };
  const a = lines(ref), b = lines(long);
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(b[i] / a[i] - 1) < 1e-3, `settle: ${b[i]} vs ${a[i]}`);
});

test('the step is the original\'s (1 µs): a quarter of it moves the lines by less than 2.5 %', () => {
  const lines = (sim) => { const sp = logic.spectrum(sim.out, 11000); return [sp[90], sp[100], sp[110]]; };
  const a = lines(logic.simulate(1000, 0.5, 0.48)), b = lines(logic.simulate(1000, 0.5, 0.48, { dt: 2.5e-7 }));
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(b[i] / a[i] - 1) < 0.025, `dt: ${b[i]} vs ${a[i]}`);
});

test('solve: a small linear system by elimination with pivoting', () => {
  const x = logic.solve([[0, 1], [2, 3]], [2, 8]);
  assert.ok(near(x[0], 1, 1e-12) && near(x[1], 2, 1e-12));
});

test('spectrum: a pure sine of amplitude A over whole periods shows A at its bin and nothing else', () => {
  const N = 5000, xs = [];
  for (let n = 0; n < N; n++) xs.push(0.7 * Math.sin(2 * Math.PI * 90 * n / N) + 0.2);
  const sp = logic.spectrum(xs, 40000);
  assert.ok(near(sp[90], 0.7, 1e-9));
  assert.ok(near(sp[0], 0.2, 1e-9));
  assert.ok(sp.every((a, k) => k === 0 || k === 90 || a < 1e-9));
});

test('params are clamped and snapped: bal 5 … 95 %, fm 500 … 3000 Hz in 100 Hz, am 0 … 1 V in 0.1 V', () => {
  const st = logic.initial({ bal: 0, fm: 90, am: 99 });
  assert.equal(st.bal, 5);
  assert.equal(st.fm, 500);
  assert.equal(st.am, 1);
  const st2 = logic.initial({ bal: 100.4, fm: 1234, am: 2.4 });
  assert.equal(st2.bal, 95);
  assert.equal(st2.fm, 1200);
  assert.equal(st2.amt, 2);
  assert.equal(logic.initial({ bal: 'x', fm: 'y', am: 'z' }).bal, 5);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const p of logic.presets) {
    const st = at(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(st)), st);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ bal: 47 });
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
    assert.equal(st.bal, p.params.bal, `preset ${p.id} bal in range`);
    assert.equal(st.fm, p.params.fm, `preset ${p.id} fm in range`);
    assert.equal(st.amt, p.params.am, `preset ${p.id} am in range`);
  }
});
