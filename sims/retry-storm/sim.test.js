// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for retry-storm's model (rules and numbers: SPEC.md). Run: node --test sims/retry-storm/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const preset = (id) => P(logic.presets.find((x) => x.id === id).params);
const run = (p) => kit.stateAt(logic, p, logic.steps(p));
const rec = (p, k) => run(p).history[k];
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-2, `${msg || ''} ${a} ≈ ${b}`);

// ── tie-breaks first ──

test('tie: previous p99 exactly at the timeout is no breach', () => {
  assert.deepEqual(logic.retryMultiplier(1, 1, 3), { mult: 1, breach: 0 });
  const r = logic.retryMultiplier(1.0001, 1, 3);
  assert.ok(r.mult > 1 && r.breach > 0);
});

test('tie: the breach is capped at 1, so the multiplier at most 1 + retryFactor', () => {
  assert.deepEqual(logic.retryMultiplier(460, 1, 3), { mult: 4, breach: 1 });
  assert.deepEqual(logic.retryMultiplier(2, 1, 3), { mult: 4, breach: 1 });
  near(logic.retryMultiplier(1.5, 1, 3).mult, 2.5);
});

test('tie: retryFactor 0 never retries; no previous tick never retries', () => {
  assert.deepEqual(logic.retryMultiplier(100, 1, 0), { mult: 1, breach: 0 });
  assert.deepEqual(logic.retryMultiplier(null, 1, 3), { mult: 1, breach: 0 });
  const r0 = rec(preset('collapse'), 0);
  assert.equal(r0.mult, 1);
  assert.equal(r0.lambda, 9);
});

test('tie: ρ exactly 1 is saturated', () => {
  assert.equal(logic.queueMetrics(10, 10, 1).saturated, true);
  assert.equal(logic.queueMetrics(9.99, 10, 1).saturated, false);
});

test('tie: shed windows: 5-6 is on at 5 and 6 only, from5 stays on', () => {
  const brief = P({ shed: '5-6' });
  assert.deepEqual([4, 5, 6, 7].map((k) => logic.shedAt(brief, k)), [0, 0.8, 0.8, 0]);
  const always = P({ shed: 'from5' });
  assert.deepEqual([4, 5, 14].map((k) => logic.shedAt(always, k)), [0, 0.8, 0.8]);
  assert.equal(logic.shedAt(P({ shed: 'off' }), 9), 0);
});

test('tie: the spike lasts exactly one tick; the raise is at tick 5, an event only when the capacity changes', () => {
  const p = P({ spikeAt: 2 });
  assert.deepEqual([1, 2, 3].map((k) => logic.demandAt(p, k)), [9, 14, 9]);
  assert.deepEqual([4, 5, 9].map((k) => logic.capacityAt(P({ capacity: '10-15' }), k)), [10, 15, 15]);
  assert.deepEqual([0, 5].map((k) => logic.capacityAt(P({ capacity: '15' }), k)), [15, 15]);
  assert.deepEqual(logic.eventsAt(P({ capacity: '15', spikeAt: -1 }), 5), []);
  assert.deepEqual(logic.eventsAt(P({ capacity: '10-15', spikeAt: -1 }), 5), ['capacity']);
  assert.deepEqual(logic.eventsAt(P({ shed: '5-6' }), 7), ['shedOff']);
  assert.deepEqual(logic.eventsAt(P({ shed: 'from5' }), 7), []);
  assert.deepEqual(logic.eventsAt(P({ shed: 'from5', spikeAt: -1 }), 5), ['shedOn']);
  assert.equal(logic.initial(P({ capacity: '10-15' })).capacity, 10);
});

// ── rules ──

test('rule 1: the multiplier comes from LAST tick\'s p99 (one-tick lag)', () => {
  const p = preset('metastable');
  const h = run(p).history;
  assert.equal(h[2].mult, 1, 'the spike tick itself has no retries');
  near(h[2].p99, 4.605);
  assert.equal(h[3].mult, 4, 'the tick after the spike retries at full breach');
});

test('rule 2: λ = demand × multiplier × (1 − shed); original, retries and turned away add up', () => {
  const h = run(preset('shed-dc-sim')).history;
  near(h[5].lambda, 7.2);
  near(h[5].original, 1.8);
  near(h[5].retries, 5.4);
  near(h[5].turnedAway, 28.8);
  for (const r of h) near(r.original + r.retries, r.lambda, 'split');
  for (const r of h) near(r.lambda + r.turnedAway, r.demand * r.mult, 'shed');
});

test('rule 3: db metrics are utilisation-latency\'s (ρ, p99 with clamp, saturated)', () => {
  const r = rec(preset('prevented'), 0);
  near(r.rho, 0.6);
  near(r.p99, 0.768);
  const c = rec(preset('collapse'), 1);
  near(c.rho, 3.6);
  near(c.p99, Math.log(100) / (10 * 0.001), 'clamped at 0.999');
  assert.equal(c.saturated, true);
});

test('rule 4: interventions apply at their own tick, before the multiplier', () => {
  const h = run(preset('capacity-too-late')).history;
  assert.equal(h[4].capacity, 10);
  assert.equal(h[5].capacity, 15);
  near(h[5].rho, 2.4, 'tick 5 uses the new capacity');
  const s = run(preset('shed-briefly')).history;
  assert.equal(s[4].shed, 0);
  assert.equal(s[5].shed, 0.8);
  assert.deepEqual(s[5].events, ['shedOn']);
  assert.deepEqual(s[2].events, ['spike']);
});

test('preset collapse: 9 → 36 and stays saturated (dc-sim acceptance b, test 1)', () => {
  const h = run(preset('collapse')).history;
  assert.equal(h.length, 8);
  assert.equal(h[0].lambda, 9);
  near(h[0].p99, 4.605);
  for (let k = 1; k < 8; k++) { near(h[k].lambda, 36); near(h[k].rho, 3.6); assert.equal(h[k].saturated, true); }
  const last = h[7];
  assert.ok(last.lambda > 18 && last.p99 > 10 && last.saturated);
});

test('preset prevented: capacity 15 from the start, no retries ever (test 2)', () => {
  const h = run(preset('prevented')).history;
  assert.equal(h.length, 8);
  for (const r of h) { assert.equal(r.lambda, 9); near(r.p99, 0.768); assert.equal(r.mult, 1); assert.equal(r.saturated, false); }
});

test('rule 6 / preset capacity-too-late: 15 after the collapse does not recover (test 3)', () => {
  const h = run(preset('capacity-too-late')).history;
  assert.equal(h.length, 15);
  for (let k = 5; k < 15; k++) { near(h[k].lambda, 36); near(h[k].rho, 2.4); assert.equal(h[k].saturated, true); }
  assert.ok(h[14].p99 > 10);
});

test('rule 7 / preset shed-dc-sim: shedding recovers without capacity, and stays on (test 4)', () => {
  const h = run(preset('shed-dc-sim')).history;
  assert.equal(h.length, 15);
  near(h[5].lambda, 7.2); near(h[5].p99, 1.645);
  near(h[6].lambda, 5.28); near(h[6].mult, 2.934); near(h[6].p99, 0.976);
  near(h[7].lambda, 1.8); near(h[7].p99, 0.562);
  const last = h[14];
  assert.equal(last.capacity, 10);
  assert.equal(last.saturated, false);
  assert.ok(last.p99 < 1);
  near(last.turnedAway, 7.2, '80 % of 9 still turned away');
});

test('rule 5 / preset metastable: the trigger is gone, the failure is not', () => {
  const h = run(preset('metastable')).history;
  assert.equal(h.length, 10);
  assert.equal(h[1].lambda, 9);
  assert.equal(h[2].lambda, 14); near(h[2].rho, 0.933);
  for (let k = 3; k < 10; k++) { assert.equal(h[k].demand, 9); near(h[k].lambda, 36); assert.equal(h[k].saturated, true); }
});

test('rule 8 / preset gentler-retries: λ settles at 13.5 below capacity, p99 over the timeout', () => {
  const h = run(preset('gentler-retries')).history;
  for (let k = 3; k < 10; k++) { near(h[k].lambda, 13.5); near(h[k].rho, 0.9); near(h[k].p99, 3.07); assert.equal(h[k].saturated, false); }
});

test('preset shed-briefly: two ticks of admission control end it for good', () => {
  const h = run(preset('shed-briefly')).history;
  near(h[5].lambda, 7.2); near(h[5].p99, 0.59);
  near(h[6].lambda, 1.8); assert.equal(h[6].mult, 1);
  for (let k = 7; k < 10; k++) { assert.equal(h[k].lambda, 9); near(h[k].p99, 0.768); assert.equal(h[k].shed, 0); }
});

test('rule 9: no backlog: the same λ and capacity give the same metrics whatever came before', () => {
  const a = rec(preset('shed-briefly'), 9), b = rec(preset('prevented'), 7);
  assert.equal(a.p99, b.p99);
  assert.equal(a.rho, b.rho);
});

test('steps: 8 / 15 / 10 by preset (task), defaults 10', () => {
  const n = (id) => logic.steps(preset(id));
  assert.deepEqual(['collapse', 'prevented', 'capacity-too-late', 'shed-dc-sim', 'metastable', 'gentler-retries', 'shed-briefly'].map(n),
    [8, 8, 15, 15, 10, 10, 10]);
  assert.equal(logic.steps(logic.defaults), 10);
});

test('story: the caption\'s closing sentence, first that applies', () => {
  const at = (p, n) => logic.story(kit.stateAt(logic, p, n), p);
  assert.equal(at(preset('metastable'), 0), null);
  assert.equal(at(preset('metastable'), 1), 'healthy');
  assert.equal(at(preset('metastable'), 3), 'breach', 'the spike tick: over the timeout, no retries yet');
  assert.equal(at(preset('metastable'), 4), 'stuck');
  assert.equal(at(preset('collapse'), 1), 'breach');
  assert.equal(at(preset('collapse'), 2), 'storm');
  assert.equal(at(preset('capacity-too-late'), 6), 'capacityTooLate');
  assert.equal(at(preset('shed-dc-sim'), 6), 'shedding');
  assert.equal(at(preset('shed-dc-sim'), 8), 'shedHealthy');
  assert.equal(at(preset('shed-briefly'), 8), 'recovered');
  assert.equal(at(preset('gentler-retries'), 5), 'overTimeout');
  assert.equal(at(P({ capacity: '10', retryFactor: 0, spikeAt: 2 }), 3), 'overload');
  assert.equal(at(P({ capacity: '10', spikeAt: 2 }), 5), 'storm', 'collapsed before the spike: the spike is not the trigger');
  assert.equal(at(preset('prevented'), 8), 'healthy');
  assert.equal(at(preset('shed-dc-sim'), 7), 'shedding', 'tick 6: retries ×2.93 still, under the timeout');
  assert.equal(at(preset('shed-briefly'), 10), 'recovered');
  // beyond the presets
  assert.equal(at(P({ capacity: '10', retryFactor: 0, spikeAt: -1 }), 3), 'slowNoRetry', 'no retries: never "retries next tick"');
  assert.equal(at(P({ capacity: '15', spikeAt: -1, shed: '5-6' }), 8), 'healthy', 'never unhealthy: nothing to recover from');
  assert.equal(at(P({ capacity: '10', spikeAt: -1, shed: '5-6' }), 8), 'breach', 'at C 10, 9/s alone breaches again');
  assert.equal(at(P({ capacity: '10-15', retryFactor: 0.5, spikeAt: -1 }), 7), 'overTimeout', 'out of saturation, over the timeout');
});

test('peak: the y axis covers every tick of the run', () => {
  near(logic.peak(preset('prevented')), 15);
  near(logic.peak(preset('collapse')), 36);
  near(logic.peak(P({ capacity: '10', spikeAt: 2 })), 56, 'spike after the collapse: 14 × 4');
});

// ── generic checks every sim keeps ──

const ALL = logic.presets.map((x) => P(x.params)).concat([logic.defaults, P({ retryFactor: 0, capacity: '10-15', spikeAt: 2, shed: '5-6' })]);

test('state is JSON-safe at every step', () => {
  for (const p of ALL) {
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const p of ALL) {
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = preset('shed-briefly');
  const s4 = kit.stateAt(logic, p, 4);
  const copy = structuredClone(s4);
  logic.step(s4, 5, p);
  assert.deepEqual(s4, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('the page\'s presets are the model\'s, and meta.steps is the default\'s', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(json.steps, logic.steps(logic.defaults), 'sim.json steps matches the model');
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `preset param ${k}`);
  assert.match(html, /presets:\s*L\.presets\.map/, 'the page takes its presets from the model');
});
