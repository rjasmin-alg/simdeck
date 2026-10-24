// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for utilisation-latency's model (rules in SPEC.md). Run: node --test sims/utilisation-latency/
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
const node = (s, id) => s.chain.nodes.find((n) => n.id === id);

// ── tie-breaks first ──

test('rule 4 tie: ρ exactly 1 is saturated, 0.99 is not', () => {
  const full = C({ load: 100 });
  assert.equal(full.server.rho, 1);
  assert.equal(full.server.saturated, true);
  assert.equal(full.server.zone, 'saturated');
  const below = C({ load: 99 });
  assert.equal(below.server.saturated, false);
  assert.equal(below.server.zone, 'knee');
});

test('rule 4: at and past ρ = 1 the formulas take ρ = 0.999, so the numbers stay finite', () => {
  const full = C({ load: 100 }).server;
  near(full.w, 100);                       // (0.999 / 0.001 + 1) / 10
  near(full.p99, LN100 / (10 * 0.001));
  const over = logic.queueMetrics(12, 10, 1);   // dc-sim test_saturation_flagged_at_rho_ge_one
  near(over.rho, 1.2);
  assert.equal(over.saturated, true);
  assert.ok(Number.isFinite(over.wq) && Number.isFinite(over.p99));
  near(over.w, full.w);
});

test('rule 4 tie: ρ between the clamp and 1 is computed at the clamp and is not saturated', () => {
  const m = logic.queueMetrics(9.995, 10, 1);
  assert.equal(m.saturated, false);
  near(m.w, logic.queueMetrics(9.99, 10, 1).w);
  near(m.p99, logic.queueMetrics(9.99, 10, 1).p99);
});

test('rule 7 tie: ρ exactly 0.8 is in the knee, 0.79 below it', () => {
  assert.equal(C({ load: 80 }).server.zone, 'knee');
  assert.equal(C({ load: 79 }).server.zone, 'below');
  assert.equal(logic.zone(logic.KNEE), 'knee');
  assert.equal(logic.zone(0.7999), 'below');
});

test('load 0: no arrivals, nothing waits, W is the service time alone', () => {
  const s = C({ load: 0 }).server;
  assert.equal(s.lambda, 0);
  assert.equal(s.rho, 0);
  assert.equal(s.wq, 0);
  near(s.w, 0.1);
  assert.equal(s.L, 0);
  near(s.p99, LN100 / 10);
});

test('rule 6 tie: the end-to-end SLO is met at exactly the target, missed above it or when saturated', () => {
  assert.equal(logic.sloMet(2, false, 2), true);
  assert.equal(logic.sloMet(2.0001, false, 2), false);
  assert.equal(logic.sloMet(0.5, true, 2), false);
});

test('rule 6 tie: a saturated node passes on only what it processes, min(offered, C) × weight', () => {
  const ch = logic.chainMetrics(logic.THREE_TIER, 50);
  assert.equal(node({ chain: ch }, 'cache').lambda, 50);
  assert.equal(node({ chain: ch }, 'db').lambda, 20);          // cache's capacity, not 50
  near(node({ chain: ch }, 'audit').lambda, 10);               // 0.2 × min(50, 100)
  const flood = logic.chainMetrics(logic.THREE_TIER, 150);
  near(node({ chain: flood }, 'audit').lambda, 20);            // 0.2 × api's capacity 100
});

// ── rules ──

test('rule 1: λ = load × C and ρ = λ / C', () => {
  const s = C({ load: 90, capacity: 100 });
  near(s.lambda, 90);
  near(s.server.rho, 0.9);
  assert.equal(logic.utilization(5, 10), 0.5);
  assert.equal(logic.utilization(0, 0), 0);
  assert.equal(logic.utilization(1, 0), Infinity);
});

test('rule 2: P-K mean wait, and W = 1/(C − λ) at cv² = 1 (dc-sim M/M/1 closed form)', () => {
  for (const [mu, lam] of [[10, 3], [10, 7], [5, 4.5], [20, 1]]) {
    near(logic.queueMetrics(lam, mu, 1).w, 1 / (mu - lam));
  }
  const m = logic.queueMetrics(6, 10, 4);                     // ρ 0.6, (1 + 4)/2 = 2.5
  near(m.wq, (0.6 / 0.4) * 2.5 / 10);
  near(m.w, m.wq + 0.1);
  near(logic.queueMetrics(6, 10, 0).wq, (0.6 / 0.4) * 0.5 / 10);   // deterministic: half the M/M/1 wait
});

test('rule 3: p99 = ln 100 / (C − λ) at cv² = 1, scaled by (1 + cv²)/2 otherwise', () => {
  for (const [mu, lam] of [[10, 3], [10, 7], [5, 4.5], [20, 1]]) {
    near(logic.queueMetrics(lam, mu, 1).p99, LN100 / (mu - lam));
  }
  near(logic.queueMetrics(5, 10, 9).p99, 5 * LN100 / 5);
  near(logic.queueMetrics(5, 10, 0).p99, 0.5 * LN100 / 5);
});

test('rule 5: Little\'s law, L = λW and Lq = λWq', () => {
  const s = C({ load: 90 }).server;
  near(s.L, 9);
  near(s.Lq, 8.1);
  const v = C({ load: 37, cv2: 4, capacity: 100 }).server;
  near(v.L, v.lambda * v.w);
  near(v.Lq, v.lambda * v.wq);
});

test('rule 6: end-to-end p99 = api + cache + db + 0.2 × audit; unbounded when a node on it saturates', () => {
  const ch = logic.chainMetrics(logic.THREE_TIER, 5);
  const p = (id) => node({ chain: ch }, id).p99;
  near(ch.e2e, p('api') + p('cache') + p('db') + 0.2 * p('audit'));
  assert.deepEqual(ch.nodes.map((n) => [n.id, n.weight]), [['api', 1], ['cache', 1], ['db', 1], ['audit', 0.2]]);
  assert.equal(ch.e2eSaturated, false);
  const sat = C({ load: 15, capacity: 100, chain: true }).chain;   // λ 15 = db's capacity
  assert.equal(node({ chain: sat }, 'db').saturated, true);
  assert.equal(sat.e2eSaturated, true);
  assert.equal(sat.sloMet, false);
  assert.equal(C({ chain: false }).chain, null);
});

test('rule 7: the gauges whose zone changed with the last change', () => {
  assert.deepEqual(logic.crossed(C({ load: 85 }), C({ load: 70 })), ['server']);
  assert.deepEqual(logic.crossed(C({ load: 85 }), C({ load: 90 })), []);
  assert.deepEqual(logic.crossed(C({ load: 100 }), C({ load: 90 })), ['server']);
  assert.deepEqual(logic.crossed(C({ load: 50 }), null), []);
  // C 100, chain: λ 12 puts db at 0.8 (knee), λ 15 saturates it; the server stays below the knee.
  assert.deepEqual(logic.crossed(C({ load: 12, capacity: 100, chain: true }), C({ load: 11, capacity: 100, chain: true })), ['db']);
  assert.deepEqual(logic.crossed(C({ load: 15, capacity: 100, chain: true }), C({ load: 12, capacity: 100, chain: true })), ['db']);
});

test('caption choice, first that applies: saturated, chain, capacity changed, cv², load from a bounded state, state', () => {
  const key = (over, prevOver) => logic.captionKey(C(over), P(over), prevOver ? P(prevOver) : null);
  assert.equal(key({ load: 100, chain: true }, { load: 50 }), 'saturated');
  assert.equal(key({ chain: true }, { load: 40, chain: true }), 'chain');
  assert.equal(key({ load: 10, cv2: 9 }, { load: 10, cv2: 1 }), 'cv2');
  assert.equal(key({ load: 10, cv2: 9 }, { load: 50, cv2: 1 }), 'cv2');          // tie: both changed → cv² (variability preset)
  assert.equal(key({ load: 90, cv2: 1 }, { load: 10, cv2: 9 }), 'state');         // both changed, cv² down → state
  assert.equal(key({ load: 10, cv2: 1 }, { load: 10, cv2: 9 }), 'cv2');           // cv² alone, down
  assert.equal(key({ load: 10, cv2: 9, capacity: 100 }, { load: 10, cv2: 1 }), 'state');
  assert.equal(key({ load: 90 }, { load: 50, capacity: 100 }), 'state');        // a capacity change is not a load change
  assert.equal(key({ load: 99 }, { load: 90 }), 'load');
  assert.equal(key({ load: 90 }, { load: 100 }), 'state');                       // no numbers to start from
  assert.equal(key({ load: 90 }, null), 'state');
  assert.equal(key({ load: 90 }, { load: 90 }), 'state');
});

// ── presets: the task's numbers (SPEC.md table) ──

test('preset half-load: W 0.20 s, p99 0.921 s, L 1', () => {
  const s = C(preset('half-load')).server;
  near(s.w, 0.2); near(s.p99, 0.921, 1e-3); near(s.L, 1);
  near(C(preset('half-load')).service, 0.1);
});

test('preset knee: ρ 0.9 gives W 1.00 s and p99 4.61 s; ρ 0.8 gives 0.50 s and 2.30 s', () => {
  const s = C(preset('knee')).server;
  near(s.w, 1); near(s.p99, 4.605, 1e-3);
  const e = C({ load: 80 }).server;
  near(e.w, 0.5); near(e.p99, 2.303, 1e-3);
});

test('preset near-full: ρ 0.99 gives W 10 s, p99 46 s; ρ 0.95 gives 2.0 s and 9.2 s', () => {
  const s = C(preset('near-full')).server;
  near(s.w, 10, 1e-6); near(s.p99, 46.05, 1e-3);
  near(C({ load: 95 }).server.w, 2, 1e-9);
  near(C({ load: 95 }).server.p99, 9.21, 1e-3);
  near(s.w / C({ load: 90 }).server.w, 10, 1e-6);   // the last 9 % of load: 10× the latency
});

test('preset variability: cv² 1 → 9 at ρ 0.1 moves W ×1.4 and p99 ×5 (dc-sim tail decoupled from mean)', () => {
  const hi = C(preset('variability')).server, lo = C(Object.assign({}, preset('variability'), { cv2: 1 })).server;
  near(lo.w, 0.1111, 1e-3); near(hi.w, 0.1556, 1e-3);
  near(lo.p99, 0.5117, 1e-3); near(hi.p99, 2.5584, 1e-3);
  near(hi.w / lo.w, 1.4, 1e-9); near(hi.p99 / lo.p99, 5, 1e-9);
});

test('preset three-tier-chain: λ 5 → p99 api 0.048, cache 0.461, db 0.461, audit 0.094; end-to-end 0.99 s ≤ 2 s', () => {
  const s = C(preset('three-tier-chain'));
  near(s.lambda, 5);
  const ch = s.chain;
  near(node(s, 'api').p99, 0.0485, 1e-2);
  near(node(s, 'cache').p99, 0.4605, 1e-3);
  near(node(s, 'db').p99, 0.4605, 1e-3);
  near(node(s, 'audit').p99, 0.0940, 1e-2);
  near(ch.e2e, 0.9883, 1e-3);
  assert.equal(ch.sloMet, true);
  assert.deepEqual(ch.nodes.map((n) => n.lambda), [5, 5, 5, 1]);
});

test('capacity 100 scales every time by 1/10 at the same load', () => {
  const a = C({ load: 90 }).server, b = C({ load: 90, capacity: 100 }).server;
  near(b.w, a.w / 10); near(b.p99, a.p99 / 10); near(b.L, a.L);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe and deterministic for every preset', () => {
  for (const x of logic.presets) {
    const s = C(x.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    assert.deepEqual(C(x.params), s);
  }
});

test('compute does not mutate its params or the chain spec', () => {
  const p = P(preset('three-tier-chain'));
  const copy = structuredClone(p), spec = structuredClone(logic.THREE_TIER);
  logic.compute(p);
  assert.deepEqual(p, copy);
  assert.deepEqual(logic.THREE_TIER, spec);
});

test('every param combination gives a finite, JSON-safe state', () => {
  for (let load = 0; load <= 100; load++) for (const capacity of [10, 100]) for (const cv2 of [0, 1, 4, 9]) {
    const s = C({ load, capacity, cv2, chain: true });
    for (const n of [s.server, ...s.chain.nodes]) {
      for (const k of ['rho', 'wq', 'w', 'p99', 'L', 'Lq']) assert.ok(Number.isFinite(n[k]), `${load} ${capacity} ${cv2} ${n.id}.${k}`);
      assert.ok(n.w >= 1 / n.capacity - 1e-12);
    }
    assert.ok(Number.isFinite(s.chain.e2e));
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
