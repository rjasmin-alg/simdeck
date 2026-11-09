// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for autoscaling-lag's model (rules in SPEC.md). Run: node --test sims/autoscaling-lag/
// Tie-breaks first, then one test per rule, the presets' expected numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const run = (over) => logic.compute(P(over));
const preset = (id) => run(logic.presets.find((x) => x.id === id).params);
const near = (a, b, eps = 5e-4) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
/** A one-block spec with flat or given demand, for rules the scenarios do not isolate. */
const spec = (demand, over) => Object.assign({
  n: demand.length, demand,
  blocks: [{ id: 'base', kind: 'baseline', amount: 10, domain: 'default' }],
  orders: [], failures: [], preemptions: []
}, over);
const autoOrders = (s) => s.orders.filter((o) => o.by === 'auto');

// ── tie-breaks ──

test('tie-break: ρ exactly 0.8 does not trigger the autoscaler; just above it does (rule 5)', () => {
  const at = logic.simulate(spec([8, 8, 8]), 1, 'reactive');
  assert.equal(at.ticks[0].rho, 0.8);
  assert.equal(at.orders.length, 0);
  const above = logic.simulate(spec([8.01, 8.01, 8.01]), 1, 'reactive');
  assert.equal(autoOrders(above).length, 1);
  assert.equal(autoOrders(above)[0].at, 0);
  near(autoOrders(above)[0].amount, 8.01 / 0.7 - 10, 1e-9);
});

test('tie-break: capacity already on order counts, so the slow scaler orders once (rule 2)', () => {
  const s = preset('slow-scaler');
  assert.equal(s.orders.length, 1);
  assert.deepEqual([s.orders[0].at, s.orders[0].online], [2, 6]);
  [3, 4, 5].forEach((t) => assert.equal(s.ticks[t].ordered, 0));
});

test('tie-break: a block is active at its online tick, not one later (rule 1)', () => {
  const s = logic.simulate(spec([0, 0, 0, 0, 0], { blocks: [], orders: [{ id: 'r', kind: 'reserved', amount: 10, at: 0, lead: 3 }] }), 4, 'none');
  assert.deepEqual(s.ticks.map((k) => k.capacity), [0, 0, 0, 10, 10]);   // dc-sim test_reserved_resource_waits_for_lead_time
});

test('tie-break: a domain down for d ticks is back at f + d exactly (rule 3)', () => {
  const s = logic.simulate(spec([1, 1, 1, 1], {
    blocks: [{ id: 'a', kind: 'baseline', amount: 6, domain: 'rack-a' }, { id: 'b', kind: 'baseline', amount: 4, domain: 'rack-b' }],
    failures: [{ domain: 'rack-a', at: 1, duration: 2 }]
  }), 1, 'none');
  assert.deepEqual(s.ticks.map((k) => k.capacity), [10, 4, 4, 10]);  // dc-sim test_domain_failure_only_zeroes_matching_domain_resources
  assert.deepEqual(s.ticks[1].down, [{ id: 'a', kind: 'baseline', amount: 6, why: 'domain' }]);
});

test('tie-break: ρ exactly 1 is saturated (spot ticks 6–8)', () => {
  const s = preset('spot-and-domains');
  [6, 7, 8].forEach((t) => { assert.equal(s.ticks[t].rho, 1); assert.equal(s.ticks[t].saturated, true); assert.equal(s.ticks[t].verdict, 'saturated'); });
});

test('tie-break: p99 exactly at the SLO is met (rule 7)', () => {
  assert.equal(logic.verdict({ saturated: false, p99: 1 }), 'ok');
  assert.equal(logic.verdict({ saturated: false, p99: 1.0001 }), 'over');
  assert.equal(logic.verdict({ saturated: true, p99: 0.5 }), 'saturated');
  // and through simulate: p99 = ln 100 / (C − λ) at cv² 1, just over 1 s
  assert.equal(logic.simulate(spec([10 - Math.log(100) + 0.01]), 1, 'none').ticks[0].verdict, 'over');
});

test('tie-break: capacity online at the last spike tick is a lag, one later is too late (caption)', () => {
  assert.equal(logic.captionKey(preset('slow-scaler')), 'lag');            // online at 6 = last spike tick
  const s = run({ lead: 4 });
  s.orders[0].online = 7;                                                  // the same run with the order one tick later
  assert.equal(logic.captionKey(s), 'tooLate');
});

// ── rules ──

test('rule 1: capacity is the sum of active blocks; an order comes online at t + lead', () => {
  const s = preset('dc-sim-provisioning');
  assert.deepEqual(s.ticks.map((k) => k.capacity), [5, 5, 5, 15, 15, 15, 15, 15]);
  assert.deepEqual(s.orders, [{ id: 'reserved', by: 'plan', at: 0, online: 3, amount: 10 }]);
  assert.equal(s.ticks[0].ordered, 10);
  assert.equal(s.ticks[3].online, 10);
  assert.deepEqual(s.ticks[3].parts, { baseline: 5, reserved: 10, spot: 0 });
});

test('rule 2: the autoscaler orders up to ρ 0.7 minus what is on order, online after the lead', () => {
  for (const lead of [1, 4, 9]) {
    const s = run({ lead });
    const o = autoOrders(s);
    assert.equal(o.length, 1);
    assert.equal(o[0].at, 2);
    assert.equal(o[0].online, 2 + lead);
    near(o[0].amount, 16 / 0.7 - 10, 1e-9);
  }
  // the scenario's own reserved block on order covers the provisioning gap: 5 + 10 ≥ 8 / 0.7
  assert.equal(autoOrders(run({ scenario: 'provisioning', policy: 'reactive' })).length, 0);
  // no autoscaler with policy none
  assert.equal(run({ policy: 'none' }).orders.length, 0);
});

test('rule 3: a failed domain comes back, a preempted spot block does not', () => {
  const s = preset('spot-and-domains');
  assert.deepEqual(s.ticks.map((k) => k.capacity), [28, 28, 18, 18, 18, 28, 20, 20, 20]);
  assert.deepEqual(s.ticks[3].down.map((d) => [d.id, d.why]), [['rack-a', 'domain']]);
  assert.deepEqual(s.ticks[8].down.map((d) => [d.id, d.why]), [['spot', 'reclaimed']]);
  assert.deepEqual(s.ticks[5].parts, { baseline: 20, reserved: 0, spot: 8 });
});

test('rule 4: ρ and p99 per tick from utilisation-latency, saturated at ρ ≥ 1', () => {
  const s = preset('dc-sim-provisioning');
  near(s.ticks[0].rho, 1.6);
  assert.equal(s.ticks[0].saturated, true);
  near(s.ticks[0].p99, Math.log(100) / (5 * (1 - 0.999)), 1e-6);         // computed at the clamp, shown as ∞
  near(s.ticks[3].rho, 8 / 15);
  near(s.ticks[3].p99, Math.log(100) / 7, 1e-9);
});

test('rule 6: pre-provisioning orders lead ticks ahead of the planned rise, so nothing saturates', () => {
  const s = run({ policy: 'pre', lead: 4 });
  assert.equal(s.orders.length, 1);
  assert.equal(s.orders[0].by, 'pre');
  assert.deepEqual([s.orders[0].at, s.orders[0].online], [-2, 2]);
  near(s.orders[0].amount, 16 / 0.7 - 10, 1e-9);
  assert.deepEqual(logic.saturatedTicks(s), []);
  assert.equal(logic.captionKey(s), 'pre');
  // preemption cannot be planned: in the spot scenario pre acts as reactive
  assert.deepEqual(run({ scenario: 'spot', policy: 'pre' }).orders, run({ scenario: 'spot', policy: 'reactive' }).orders);
  // a baseline big enough for the peak needs no order
  assert.equal(run({ policy: 'pre', baseline: 20 }).orders.length, 1);
  assert.equal(run({ policy: 'pre', baseline: 23 }).orders.length, 0);
});

test('rule 7: verdicts, and changed ticks against the run before the last change', () => {
  const slow = preset('slow-scaler'), fast = preset('fast-scaler');
  assert.deepEqual(slow.ticks.map((k) => k.verdict),
    ['over', 'over', 'saturated', 'saturated', 'saturated', 'saturated', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok']);
  assert.deepEqual(logic.changedTicks(fast, slow), [3, 4, 5]);
  assert.deepEqual(logic.changedTicks(fast, null), []);
  assert.deepEqual(logic.changedTicks(preset('spot-and-domains'), slow), []);   // new scenario: nothing marked
  const other = Object.assign({}, fast, { scenario: 'spot' });                  // same length, other scenario
  assert.deepEqual(logic.changedTicks(other, slow), []);
});

// ── presets: the task's expected numbers ──

test('preset dc-sim-provisioning: ρ 1.6 saturated at 0–2, then 15, ρ 0.53, p99 0.66 under the SLO', () => {
  const s = preset('dc-sim-provisioning');
  assert.equal(s.n, 8);
  assert.deepEqual(logic.saturatedTicks(s), [0, 1, 2]);
  near(s.ticks[3].rho, 0.533);
  near(s.ticks[3].p99, 0.658);
  assert.equal(s.ticks[3].verdict, 'ok');
  assert.equal(logic.captionKey(s), 'provisioning');
});

test('preset fast-scaler: saturated only at tick 2; from 3 capacity 22.9, ρ 0.70, p99 0.67', () => {
  const s = preset('fast-scaler');
  assert.deepEqual(logic.saturatedTicks(s), [2]);
  near(s.ticks[3].capacity, 22.857);
  near(s.ticks[3].rho, 0.7);
  near(s.ticks[3].p99, 0.672);
  near(s.ticks[0].p99, 2.303);          // ρ 0.8 already misses the 1 s SLO
  near(s.ticks[7].rho, 0.35);
  assert.equal(logic.captionKey(s), 'lag');
});

test('preset slow-scaler: saturated 2–5, capacity at 6, one tick before the spike ends', () => {
  const s = preset('slow-scaler');
  assert.deepEqual(logic.saturatedTicks(s), [2, 3, 4, 5]);
  near(s.ticks[6].capacity, 22.857);
  near(s.ticks[6].rho, 0.7);
});

test('preset too-late: the whole spike saturated; 12.9 online at tick 11, idle at ρ 0.35', () => {
  const s = preset('too-late');
  assert.deepEqual(logic.saturatedTicks(s), [2, 3, 4, 5, 6]);
  near(s.ticks[11].online, 12.857);
  near(s.ticks[11].rho, 0.35);
  [7, 8, 9, 10].forEach((t) => assert.equal(s.ticks[t].rho, 0.8));
  assert.equal(logic.captionKey(s), 'tooLate');
});

test('preset spot-and-domains: ρ 0.71, rack-a down saturated, back, spot gone at ρ 1.0', () => {
  const s = preset('spot-and-domains');
  assert.equal(s.n, 9);
  near(s.ticks[0].rho, 0.714);
  near(s.ticks[0].p99, 0.576);
  assert.deepEqual(logic.saturatedTicks(s), [2, 3, 4, 6, 7, 8]);
  near(s.ticks[2].rho, 1.111);
  near(s.ticks[5].rho, 0.714);
  assert.equal(logic.captionKey(s), 'spot');
});

test('spot with the reactive autoscaler: 10.57 at tick 2 online at 6; at lead 9 beyond the run and no second order', () => {
  const s = run({ scenario: 'spot', lead: 4 });
  assert.equal(s.orders.length, 1);
  near(s.orders[0].amount, 20 / 0.7 - 18, 1e-9);
  near(s.ticks[6].capacity, 30.571);
  near(s.ticks[6].rho, 0.654);
  assert.equal(logic.captionKey(s), 'lag');
  const late = run({ scenario: 'spot', lead: 9 });
  assert.equal(late.orders.length, 1);
  assert.equal(late.orders[0].online, 11);
  assert.equal(logic.captionKey(late), 'beyondRun');
});

test('caption order: in the spike scenario the reaction to the spike, not an earlier order', () => {
  // baseline 9: ρ 0.89 at tick 0 already orders 2.43; the spike's own order is at tick 2
  const s = run({ baseline: 9, lead: 1 });
  assert.deepEqual(s.orders.map((o) => o.at), [0, 2]);
  assert.equal(logic.captionOrder(s).at, 2);
  assert.equal(logic.captionOrder(run({ policy: 'none' })), null);
  assert.equal(logic.captionOrder(run({ scenario: 'spot', lead: 4 })).at, 2);
});

test('captions: no spike is calm, no autoscaler is noScaler', () => {
  assert.equal(logic.captionKey(run({ spike: false })), 'calm');
  assert.equal(logic.captionKey(run({ policy: 'none' })), 'noScaler');
  assert.equal(logic.captionKey(run({ policy: 'none', baseline: 18 })), 'noScalerCalm');   // ρ 0.89, no autoscaler
  // spike off: never a spike caption, even when a small baseline makes the autoscaler order
  const off = run({ spike: false, baseline: 6, lead: 9 });
  assert.equal(off.spike, null);
  assert.equal(logic.captionKey(off), 'lag');
  // pre with a baseline below the quiet demand: the pre order on order holds back the backstop, ticks 0–1 saturate
  const ps = run({ policy: 'pre', baseline: 6, lead: 4 });
  assert.deepEqual(logic.saturatedTicks(ps), [0, 1]);
  assert.equal(logic.captionKey(ps), 'preSat');
});

// ── generic checks every sim keeps ──

test('autoscaler blocks sit in the default domain: a rack outage does not touch them (rule 2)', () => {
  const s = run({ scenario: 'spot', lead: 1 });
  assert.deepEqual([s.orders[0].at, s.orders[0].online], [2, 3]);
  near(s.ticks[3].capacity, 10 + 8 + 20 / 0.7 - 18);      // rack-a still down at 3–4, the order runs
  near(s.ticks[5].capacity, 38.571);                        // rack-a back on top
  near(s.ticks[6].capacity, 30.571);                        // spot reclaimed
});

test('more numbers: fast-scaler tail, spot reactive 7–8, pre at lead 1 and 9', () => {
  const fast = preset('fast-scaler');
  [7, 8, 9, 10, 11].forEach((t) => near(fast.ticks[t].p99, 0.310));
  const spot = run({ scenario: 'spot', lead: 4 });
  [7, 8].forEach((t) => { near(spot.ticks[t].capacity, 30.571); near(spot.ticks[t].rho, 0.654); });
  assert.deepEqual(run({ policy: 'pre', lead: 1 }).orders.map((o) => [o.by, o.at, o.online]), [['pre', 1, 2]]);
  const p9 = run({ policy: 'pre', lead: 9 });
  assert.deepEqual(p9.orders.map((o) => [o.by, o.at, o.online]), [['pre', -7, 2]]);
  assert.equal(p9.ticks[2].online > 12.85, true);
  assert.equal(p9.ticks[0].ordered, 0);                     // placed before the run: no tick carries it
});

test('state is JSON-safe for every param combination', () => {
  for (const scenario of ['spike', 'provisioning', 'spot']) for (const lead of [1, 4, 9]) for (const policy of ['none', 'reactive', 'pre'])
    for (const spike of [true, false]) for (const baseline of [5, 10, 20]) {
      const s = run({ scenario, lead, policy, spike, baseline });
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
});

test('compute is deterministic and does not mutate its params', () => {
  const p = P({ lead: 9, policy: 'pre' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.deepEqual(logic.initial(p), logic.compute(p));
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, and sim.json lists every preset', () => {
  const fs = require('node:fs'), path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  for (const x of logic.presets) for (const k of Object.keys(x.params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.deepEqual(sim.entries.map((e) => e.preset), logic.presets.map((x) => x.id));
});
