// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the ring modulator model. Run: node --test sims/ring-modulator/
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
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// ── tie-breaks first ──

test('tie-break: Û1 = 0 gives U3 = 0 (+0, not −0) in both cases, while the diodes still switch', () => {
  const seen = new Set();
  for (let n = 1; n <= logic.steps; n++) {
    const s = at({ u1: 0 }, n);
    assert.ok(Object.is(s.u3, 0), `n = ${n}: U3 is +0`);
    assert.ok(Object.is(s.u3Round, 0));
    assert.equal(s.on.length, 2, 'two diodes conduct');
    seen.add(s.kase);
  }
  assert.deepEqual([...seen].sort(), [1, 2], 'both cases still occur');
});

test('tie-break: a switching instant belongs to the half period it starts (U2 = +1 V at t = 0, −1 V at t = 1)', () => {
  assert.equal(logic.u2Sign(0), 1);
  assert.equal(logic.u2Sign(0.999), 1);
  assert.equal(logic.u2Sign(1), -1);
  assert.equal(logic.u2Sign(2), 1);
  assert.equal(logic.u2Sign(11.5), -1);
  // the trace keeps both values at each edge, so the square edges are vertical
  const tr = logic.trace(0.6, 6);
  const at1 = tr.filter((p) => p.t === 1).map((p) => p.u2);
  assert.deepEqual(at1, [1, -1]);
});

test('tie-break: U1 is exactly 0 where sin is, at multiples of r, never 1e-16', () => {
  for (const r of [2, 3, 4, 5, 6]) {
    for (let m = 0; m * r <= logic.steps; m++) assert.ok(Object.is(logic.u1At(0.6, r, m * r), 0), `r = ${r}, t = ${m * r}`);
  }
  assert.ok(close(logic.u1At(1, 6, 3), 1), 'the peak a quarter period in');
});

test('tie-break: shown voltages round half away from zero to hundredths, so ±0.125 V show the same size; −0 is 0', () => {
  assert.equal(logic.roundV(0.125), 0.13);
  assert.equal(logic.roundV(-0.125), -0.13);
  assert.equal(logic.roundV(0.124), 0.12);
  assert.ok(Object.is(logic.roundV(-0.004), 0));
  assert.ok(Object.is(logic.roundV(-0), 0));
  assert.equal(logic.roundV(0.30000000000000004), 0.3);
  // U3 and U1 always show the same size: the case flips only the sign
  for (let n = 1; n <= logic.steps; n++) {
    const s = at({ u1: 0.7, r: 5 }, n);
    assert.equal(Math.abs(s.u3Round), Math.abs(s.uRound), `n = ${n}`);
  }
});

test('tie-break: Û1 and f2/f1 clamp to their ranges, snap to their steps (half a step up), a non-number is the default', () => {
  const su = (v) => logic.snap(v, logic.U1_MIN, logic.U1_MAX, logic.U1_STEP, 7);
  const sr = (v) => logic.snap(v, logic.R_MIN, logic.R_MAX, logic.R_STEP, 7);
  assert.equal(su(-1), 0);
  assert.equal(su(3), 1);
  assert.equal(su(0.25), 0.3, 'half a step up');
  assert.equal(su(0.35), 0.4, 'half a step up, despite 0.35 / 0.1 = 3.4999999999999996');
  assert.equal(su(0.24), 0.2);
  assert.equal(su(0.1 * 3), 0.3, 'no float noise');
  assert.equal(sr(1), 2);
  assert.equal(sr(9), 6);
  assert.equal(sr(3.5), 4);
  assert.equal(sr('5'), 5);
  assert.ok(Object.is(su(-0), 0));
  for (const bad of ['abc', '', null, NaN, undefined, true, Infinity]) assert.equal(su(bad), 7, String(bad));
  const s = at({ u1: 'x', r: 99 }, 1);
  assert.deepEqual([s.u1, s.r], [logic.defaults.u1, 6]);
});

// ── the rules ──

test('step 0 is the circuit at rest: no case, no conducting diode, no instant', () => {
  const s = at({}, 0);
  assert.equal(s.kase, 0);
  assert.deepEqual(s.on, []);
  assert.equal(s.t, null);
  assert.equal(s.u3, null);
});

test('the cases alternate with the half periods of U2: odd steps case 1, even steps case 2', () => {
  for (let n = 1; n <= logic.steps; n++) {
    const s = at({}, n);
    assert.equal(s.kase, n % 2 === 1 ? 1 : 2, `n = ${n}`);
    assert.equal(s.s, n % 2 === 1 ? 1 : -1);
    assert.equal(s.t, n - 0.5, 'read in the middle of the half period');
  }
});

test('case 1 (U2 > 0): D1 and D3 conduct, T1\'s upper end reaches T2\'s lower end, U3 = U1', () => {
  const c = logic.caseOf(1, 0.4);
  assert.equal(c.kase, 1);
  assert.deepEqual(c.on, ['d1', 'd3']);
  assert.equal(c.nTo, 'a2');
  assert.ok(close(c.u3, 0.4));
});

test('case 2 (U2 < 0): D2 and D4 conduct, T1\'s upper end reaches T2\'s upper end, U3 = −U1', () => {
  const c = logic.caseOf(-1, 0.4);
  assert.equal(c.kase, 2);
  assert.deepEqual(c.on, ['d2', 'd4']);
  assert.equal(c.nTo, 'a1');
  assert.ok(close(c.u3, -0.4));
});

test('the node voltages are the original\'s formulas: U3 = A2 − A1, and each A node carries the T1 end that reaches it', () => {
  for (const s of [1, -1]) {
    for (const u of [-0.9, -0.3, 0, 0.25, 1]) {
      const c = logic.caseOf(s, u), v = c.v;
      assert.equal(v.tap1, s * logic.U2, 'T1\'s centre tap is U2');
      assert.equal(v.tap2, 0, 'T2\'s centre tap is 0 V');
      assert.ok(close(v.n, s + u / 2) && close(v.s, s - u / 2), 'T1\'s halves carry U1 / 2 each');
      assert.ok(close(v.n - v.s, u), 'T1\'s secondary carries U1 (1:1)');
      assert.ok(close(v[c.nTo], v.n), 'N reaches its A node');
      assert.ok(close(v[c.nTo === 'a1' ? 'a2' : 'a1'], v.s), 'S reaches the other');
      assert.ok(close(v.a2 - v.a1, c.u3), 'U3 = A2 − A1');
    }
  }
  // the original's two formulas at U1 = 0.5 V
  assert.ok(close(logic.caseOf(1, 0.5).u3, (1 + 0.25) - (1 - 0.25)));
  assert.ok(close(logic.caseOf(-1, 0.5).u3, (-1 - 0.25) - (-1 + 0.25)));
});

test('the conducting diodes are opposite each other, and each case uses the pair the other blocks', () => {
  const ring = ['d1', 'd2', 'd3', 'd4'];
  const on1 = logic.caseOf(1, 0.5).on, on2 = logic.caseOf(-1, 0.5).on;
  for (const on of [on1, on2]) assert.equal(Math.abs(ring.indexOf(on[0]) - ring.indexOf(on[1])), 2);
  assert.deepEqual([...on1, ...on2].sort(), ring);
});

test('U3 = U1 · U2 / 1 V at every step and every setting: switching multiplies', () => {
  for (const u1 of [0.1, 0.6, 1]) {
    for (const r of [2, 3, 4, 5, 6]) {
      for (let n = 1; n <= logic.steps; n++) {
        const s = at({ u1, r }, n);
        const want = u1 * Math.sin(Math.PI * (n - 0.5) / r);
        assert.ok(close(s.u, want), `U1, u1 = ${u1}, r = ${r}, n = ${n}`);
        assert.ok(close(s.u3, s.u * s.s * logic.U2 / 1), `U3, u1 = ${u1}, r = ${r}, n = ${n}`);
      }
    }
  }
});

test('the window holds 12 / (2r) periods of U1: one at f2 = 6 · f1, three at 2 · f1', () => {
  assert.equal(at({ r: 6 }, 1).periods, 1);
  assert.equal(at({ r: 3 }, 1).periods, 2);
  assert.equal(at({ r: 2 }, 1).periods, 3);
  assert.equal(at({}, 12).last, true);
  for (let n = 0; n < 12; n++) assert.equal(at({}, n).last, false);
});

test('the trace matches the steps: U3 = ±U1 with the sign of U2 at every sample', () => {
  const tr = logic.trace(0.8, 4);
  assert.equal(tr.length, logic.steps * (logic.POINTS + 1));
  assert.equal(tr[0].t, 0);
  assert.equal(tr[tr.length - 1].t, logic.steps);
  for (const p of tr) {
    assert.ok(Math.abs(p.u2) === 1);
    assert.ok(close(p.u3, p.u1 * p.u2));
  }
  for (let n = 1; n <= logic.steps; n++) {
    const st = at({ u1: 0.8, r: 4 }, n), p = tr.find((x) => x.t === st.t);
    assert.ok(p && close(p.u3, st.u3), `the trace passes the state at step ${n}`);
  }
});

test('presets: the start, coarse switching, no input, and Û1 as large as U2', () => {
  const by = Object.fromEntries(logic.presets.map((p) => [p.id, p.params]));
  assert.deepEqual(logic.presets[0].params, logic.defaults, 'the first preset is the start');
  assert.equal(at(by.coarse, 1).periods, 3);
  assert.equal(at(by.none, 1).u1, 0);
  assert.equal(at(by.large, 1).u1, logic.U2);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (let n = 0; n <= logic.steps; n++) {
    const s = at({ u1: 0.3, r: 5 }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ u1: 0.9, r: 3 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ r: 4 });
  const s1 = kit.stateAt(logic, p, 1);
  const copy = structuredClone(s1);
  logic.step(s1, 2, p);
  assert.deepEqual(s1, copy);
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('every preset is valid for the model, and the page meta matches the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'stepper');
  assert.equal(meta.steps, logic.steps);
  assert.ok(logic.steps <= 20);
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: param ${k}`);
    assert.equal(logic.snap(p.params.u1, logic.U1_MIN, logic.U1_MAX, logic.U1_STEP, NaN), p.params.u1, `preset ${p.id}: Û1 on the slider`);
    assert.equal(logic.snap(p.params.r, logic.R_MIN, logic.R_MAX, logic.R_STEP, NaN), p.params.r, `preset ${p.id}: f2/f1 on the slider`);
  }
});
