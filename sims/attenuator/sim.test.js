// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the attenuator pad model. Run: node --test sims/attenuator/
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

// ── rules of this model ──

test('tie-break: a value exactly between two series values takes the lower one', () => {
  assert.equal(logic.nearest(110, 'E12'), 100);     // 100 and 120 are both 10 Ω away
  assert.equal(logic.nearest(1.1, 'E12'), 1);
  assert.equal(logic.nearest(11000, 'E12'), 10000);
  assert.equal(logic.nearest(115, 'E24'), 110);     // 110 and 120
  // a hair above the middle goes up
  assert.equal(logic.nearest(110.001, 'E12'), 120);
});

test('nearest: rounded candidates, the neighbouring decades searched, by absolute difference', () => {
  assert.equal(logic.nearest(219.9, 'E24'), 220);   // 2.2 · 100 is 220, not 220.00000000000003
  assert.equal(logic.nearest(0.99, 'E24'), 1);      // the next decade up
  assert.equal(logic.nearest(9.6, 'E24'), 10);      // 9.1 or 10: 10 is nearer
  assert.equal(logic.nearest(96.25, 'E12'), 100);
  assert.equal(logic.nearest(96.25, 'E96'), 95.3);
  // absolute, not relative, difference: 8.6 is 0.4 from 8.2 and 0.4 + ε from 9.1 … and 10 is 1.4 away
  assert.equal(logic.nearest(8.6, 'E24'), 8.2);
  // every result is a member of its series (times a power of ten)
  for (const name of logic.SERIES_NAMES) {
    for (let v = 0.7; v < 20000; v *= 1.37) {
      const n = logic.nearest(v, name);
      const mant = Number((n / Math.pow(10, Math.floor(Math.log10(n) + 1e-12))).toPrecision(3));
      assert.ok(logic.SERIES[name].includes(mant), `${name} ${v} → ${n}`);
    }
  }
});

test('nearest leaves a value with no standard counterpart as it is (and does not loop on Infinity)', () => {
  assert.equal(logic.nearest(Infinity, 'E24'), Infinity);
  assert.equal(logic.nearest(0, 'E24'), 0);
  assert.ok(Number.isNaN(logic.nearest(NaN, 'E24')));
});

test('ideal Pi and T values: the known 50 Ω table', () => {
  const pi10 = logic.ideal('pi', 10);
  assert.ok(near(pi10.across, 96.2475, 1e-4));
  assert.ok(near(pi10.series, 71.1512, 1e-4));
  const t10 = logic.ideal('t', 10);
  assert.ok(near(t10.series, 25.9747, 1e-4));
  assert.ok(near(t10.across, 35.1364, 1e-4));
  const pi3 = logic.ideal('pi', 3);
  assert.ok(near(pi3.across, 292.40, 1e-2));
  assert.ok(near(pi3.series, 17.61, 1e-2));
  // Pi and T are duals: series_T · across_Pi = across_T · series_Pi = z²
  for (const d of [0.1, 1, 7.3, 20, 40]) {
    const p = logic.ideal('pi', d), q = logic.ideal('t', d);
    assert.ok(near(q.series * p.across, 2500, 1e-6), `${d} dB`);
    assert.ok(near(q.across * p.series, 2500, 1e-6), `${d} dB`);
  }
});

test('with ideal values the pad gives exactly its attenuation and 50 Ω at the input', () => {
  for (const topo of logic.TOPOLOGIES) {
    for (let dt = logic.DT_MIN; dt <= logic.DT_MAX; dt += 7) {
      const st = at({ dt, topo });
      assert.ok(near(logic.attenuationOf(topo, st.ideal), dt / 10, 1e-9), `${topo} ${dt}`);
      assert.ok(near(st.zinIdeal, 50, 1e-9), `${topo} ${dt}`);
    }
  }
});

test('the chain matrix orders the parts: Pi is across, series, across; T the other way round', () => {
  const r = { series: 10, across: 1000 };
  assert.deepEqual(logic.chain('pi', r).map((row) => row.map((x) => +x.toFixed(9))), [[1.01, 10], [0.00201, 1.01]]);
  assert.deepEqual(logic.chain('t', r).map((row) => row.map((x) => +x.toFixed(9))), [[1.01, 20.1], [0.001, 1.01]]);
  // a direct connection (no series, infinite across) is 0 dB and 50 Ω
  assert.ok(near(logic.attenuationOf('t', { series: 0, across: Infinity }), 0));
  assert.ok(near(logic.inputResistance('t', { series: 0, across: Infinity }), 50));
});

test('standard values: what they really give', () => {
  const pi10 = at({ dt: 100, topo: 'pi', series: 'E24' });
  assert.deepEqual(pi10.std, { series: 68, across: 100 });
  assert.ok(near(pi10.achieved, 9.629, 1e-3));
  assert.ok(near(pi10.zinStd, 50.33, 1e-2));
  const e96 = at({ dt: 100, topo: 'pi', series: 'E96' });
  assert.deepEqual(e96.std, { series: 71.5, across: 95.3 });
  assert.ok(Math.abs(e96.achieved - 10) < Math.abs(pi10.achieved - 10), 'the denser series comes closer here');
  const t10 = at({ dt: 100, topo: 't', series: 'E24' });
  assert.deepEqual(t10.std, { series: 27, across: 36 });
  assert.ok(near(t10.achieved, 10.067, 1e-3));
  const e12 = at({ dt: 150, topo: 'pi', series: 'E12' });
  assert.deepEqual(e12.std, { series: 150, across: 68 });
  assert.ok(near(e12.achieved, 15.92, 1e-2));
});

test('power: P_out / P_in = 10^(−dB/10), the rest is heat', () => {
  assert.ok(near(at({ dt: 100 }).powerOut, 0.1));
  assert.ok(near(at({ dt: 100 }).heat, 0.9));
  assert.ok(near(at({ dt: 300 }).ratio, 1000, 1e-9));
  assert.ok(near(at({ dt: 30 }).ratio, 1.99526, 1e-5));
  for (let dt = logic.DT_MIN; dt <= logic.DT_MAX; dt += 11) {
    const st = at({ dt });
    assert.ok(near(st.powerOut + st.heat, 1, 1e-12));
    assert.ok(near(st.powerOut * st.ratio, 1, 1e-12));
  }
});

test('params: attenuation in whole tenths of a dB, clamped to 0.1 … 40; unknown shape or series fall back', () => {
  assert.equal(at({ dt: 0 }).dt, 1);
  assert.equal(at({ dt: 1000 }).dt, 400);
  assert.equal(at({ dt: 62.6 }).db, 6.3);
  assert.equal(at({ dt: 'x' }).dt, 1);
  assert.equal(at({ topo: 'h' }).topo, 'pi');
  assert.equal(at({ series: 'E6' }).series, 'E24');
});

test('the extremes stay finite and positive', () => {
  for (const topo of logic.TOPOLOGIES) {
    for (const series of logic.SERIES_NAMES) {
      for (const dt of [logic.DT_MIN, logic.DT_MAX]) {
        const st = at({ dt, topo, series });
        for (const v of [st.ideal.series, st.ideal.across, st.std.series, st.std.across, st.achieved, st.zinStd]) {
          assert.ok(Number.isFinite(v) && v > 0, `${topo} ${series} ${dt}: ${v}`);
        }
      }
    }
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const p of logic.presets) {
    const st = at(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(st)), st);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ dt: 123, topo: 't', series: 'E48' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer has no steps');
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('every preset is valid for the model, none on an exam answer, and the page meta is an explorer', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.equal(new Set(logic.presets.map((p) => p.id)).size, logic.presets.length);
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: param ${k}`);
    assert.deepEqual(Object.fromEntries(Object.keys(p.params).map((k) => [k, at(p.params)[k]])), p.params, `preset ${p.id} in range`);
    assert.ok(![60, 200].includes(p.params.dt), `preset ${p.id}: 6 and 20 dB are exam questions AD803/AD804/AD806`);
  }
  assert.ok(![60, 200].includes(logic.defaults.dt));
});
