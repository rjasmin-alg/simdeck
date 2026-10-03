// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the LC resonant circuit model. Run: node --test sims/lc-resonance/
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
const close = (a, b, eps = 1e-12) => Math.abs(a - b) < eps;

// ── tie-breaks first ──

test('tie-break: where the current is zero it has no direction, where the voltage is zero the plates have no sign', () => {
  for (const n of [1, 5, 9]) {
    const s = at({}, n);
    assert.equal(s.i, 0, `n = ${n}: i is exactly 0`);
    assert.ok(Object.is(s.iDir, 0), `n = ${n}: iDir is +0`);
    assert.equal(s.hLines, 0);
  }
  for (const n of [3, 7]) {
    const s = at({}, n);
    assert.equal(s.u, 0, `n = ${n}: u is exactly 0`);
    assert.ok(Object.is(s.uDir, 0), `n = ${n}: uDir is +0`);
    assert.equal(s.eLines, 0);
  }
});

test('tie-break: at the odd eighths the energy is split exactly in half', () => {
  for (const n of [2, 4, 6, 8]) {
    const s = at({}, n);
    assert.equal(s.wE, 0.5, `n = ${n}`);
    assert.equal(s.wM, 0.5, `n = ${n}`);
  }
});

test('tie-break: step 9 (t = T) is step 1 again, marked full', () => {
  const a = at({}, 1), b = at({}, 9);
  for (const k of ['u', 'i', 'uDir', 'iDir', 'wE', 'wM', 'eLines', 'hLines']) assert.equal(b[k], a[k], k);
  assert.equal(b.k, 8);
  assert.equal(b.full, true);
  assert.equal(a.full, false);
});

test('tie-break: an L or C that is not an option falls back to the default', () => {
  for (const bad of [3, '10', null, undefined, NaN, -10]) {
    const s = at({ l: bad, c: bad }, 1);
    assert.equal(s.l, logic.defaults.l, `L ${String(bad)}`);
    assert.equal(s.c, logic.defaults.c, `C ${String(bad)}`);
  }
});

test('tie-break: sig3 rounds half away from zero after cutting float noise, never −0', () => {
  assert.equal(logic.sig3(1.005), 1.01);       // 1.005 is 1.00499999… in floats
  assert.equal(logic.sig3(-1.005), -1.01);
  assert.equal(logic.sig3(198.6918), 199);
  assert.equal(logic.sig3(999.6), 1000);
  assert.equal(logic.sig3(0.0012345), 0.00123);
  assert.equal(logic.sig3(12345), 12300);
  assert.ok(Object.is(logic.sig3(0), 0));
  assert.ok(Object.is(logic.sig3(-0), 0));
});

// ── the model's rules ──

test('step 0 is the circuit at rest: no charge, no current, no field, no time', () => {
  const s = at({}, 0);
  assert.equal(s.k, null);
  assert.equal(s.u, 0);
  assert.equal(s.i, 0);
  assert.equal(s.wE + s.wM, 0);
  assert.equal(s.eLines + s.hLines, 0);
  assert.equal(s.tNs, null);
});

test('step n ≥ 1 is k = n − 1 eighths of a period: u = cos, i = sin', () => {
  for (let n = 1; n <= logic.steps; n++) {
    const s = at({}, n), phi = 2 * Math.PI * (n - 1) / 8;
    assert.equal(s.k, n - 1);
    assert.ok(close(s.u, Math.cos(phi), 1e-9), `n = ${n}: u`);
    assert.ok(close(s.i, Math.sin(phi), 1e-9), `n = ${n}: i`);
  }
});

test('the charged capacitor starts with the upper plate +, the current then flows positive (towards the coil)', () => {
  assert.equal(at({}, 1).uDir, 1);
  assert.equal(at({}, 2).iDir, 1);
  assert.equal(at({}, 3).i, 1);
  // half a period on, the capacitor is charged the other way and the current reverses
  assert.equal(at({}, 5).uDir, -1);
  assert.equal(at({}, 7).i, -1);
});

test('current and voltage are a quarter period apart: i peaks where u crosses zero', () => {
  for (let n = 1; n <= logic.steps; n++) {
    const s = at({}, n);
    if (s.u === 0) assert.equal(Math.abs(s.i), 1, `n = ${n}`);
    if (s.i === 0) assert.equal(Math.abs(s.u), 1, `n = ${n}`);
  }
});

test('energy: W_E = u², W_M = i², and they always add up to the whole', () => {
  for (let n = 1; n <= logic.steps; n++) {
    const s = at({}, n);
    assert.ok(close(s.wE, s.u * s.u), `n = ${n}: W_E`);
    assert.ok(close(s.wM, s.i * s.i), `n = ${n}: W_M`);
    assert.equal(s.wE + s.wM, 1, `n = ${n}: sum`);
  }
  assert.equal(at({}, 1).wE, 1);
  assert.equal(at({}, 3).wM, 1);
});

test('field drawing aids: 6 / 4 / 0 E arrows and 0 / 2 / 3 H lines', () => {
  assert.deepEqual([1, 2, 3].map((n) => at({}, n).eLines), [6, 4, 0]);
  assert.deepEqual([1, 2, 3].map((n) => at({}, n).hLines), [0, 2, 3]);
});

test('Thomson formula: f0 = 1 / (2π √(LC)) with L in µH and C in pF', () => {
  assert.equal(at({ l: 10, c: 100 }, 0).f0Mhz, 5.03);
  assert.equal(at({ l: 10, c: 100 }, 0).Tns, 199);
  assert.equal(at({ l: 10, c: 470 }, 0).f0Mhz, 2.32);
  assert.equal(at({ l: 10, c: 470 }, 0).Tns, 431);
  assert.equal(at({ l: 2.2, c: 100 }, 0).f0Mhz, 10.7);
  assert.equal(at({ l: 2.2, c: 100 }, 0).Tns, 93.2);
  assert.ok(close(logic.f0(1, 1e6) * 2 * Math.PI, 1e6, 1e-3), 'L = 1 µH, C = 1 µF gives ω = 10⁶/s');
});

test('more L or more C lowers f0; four times C halves it', () => {
  const f = (l, c) => at({ l, c }, 0).f0;
  assert.ok(f(22, 100) < f(10, 100));
  assert.ok(f(10, 220) < f(10, 100));
  assert.ok(close(logic.f0(10, 400) / logic.f0(10, 100), 0.5, 1e-12));
});

test('time: k eighths of T, rounded to three digits', () => {
  const T = at({}, 0).T * 1e9;
  assert.equal(at({}, 1).tNs, 0);
  assert.equal(at({}, 4).tNs, logic.sig3(3 / 8 * T));
  assert.equal(at({}, 4).tNs, 74.5);
  assert.equal(at({}, 9).tNs, 199);
});

test('the trace is one period, exact at the eighths', () => {
  const tr = logic.trace();
  assert.equal(tr.length, 8 * logic.POINTS + 1);
  assert.equal(tr[0].t, 0);
  assert.equal(tr[tr.length - 1].t, 8);
  for (let k = 0; k <= 8; k++) {
    const p = tr[k * logic.POINTS], s = at({}, k + 1);
    assert.equal(p.u, s.u, `k = ${k}: u`);
    assert.equal(p.i, s.i, `k = ${k}: i`);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (let n = 0; n <= logic.steps; n++) {
    const s = at({ l: 4.7, c: 22 }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ l: 22, c: 220 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ c: 47 });
  const s1 = kit.stateAt(logic, p, 1);
  const copy = structuredClone(s1);
  logic.step(s1, 2, p);
  assert.deepEqual(s1, copy);
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
  for (const lang of ['hr', 'en']) {
    for (let n = 0; n <= logic.steps; n++) assert.ok(strings[lang]['caption' + n], `${lang}: caption${n}`);
  }
});

test('every preset is valid for the model, and the page meta matches the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'stepper');
  assert.equal(meta.steps, logic.steps);
  assert.ok(logic.steps <= 20);
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: param ${k}`);
    assert.ok(logic.L_OPTIONS.includes(p.params.l), `preset ${p.id}: L is an option`);
    assert.ok(logic.C_OPTIONS.includes(p.params.c), `preset ${p.id}: C is an option`);
    assert.ok(p.step >= 0 && p.step <= logic.steps, `preset ${p.id}: step`);
  }
});
