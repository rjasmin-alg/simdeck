// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for littles-law's model (rules in SPEC.md). Run: node --test sims/littles-law/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const C = (over) => logic.compute(P(over));
const preset = (id) => P(logic.presets.find((x) => x.id === id).params);
const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≉ ${b}`);

// ── tie-breaks first ──

test('rule 4 tie: L exactly equal to the places is not stable; one fewer is', () => {
  const full = C({ lambda: 2, W: 5, places: 10 });
  assert.equal(full.L, 10);
  assert.equal(full.rho, 1);
  assert.equal(full.stable, false);
  assert.equal(C({ lambda: 2, W: 5, places: 11 }).stable, true);
  // solving for W or λ: the set L against the places
  assert.equal(C({ solveFor: 'W', L: 16, places: 16 }).stable, false);
  assert.equal(C({ solveFor: 'lambda', L: 15, places: 16 }).stable, true);
});

test('rule 4 tie: from the queue, λ = C is not stable and has no W or L', () => {
  const s = C({ fromQueue: true, system: 'server', lambda: 10, capacity: 10 });
  assert.equal(s.rho, 1);
  assert.equal(s.stable, false);
  assert.equal(s.W, null);
  assert.equal(s.L, null);
  const below = C({ fromQueue: true, system: 'server', lambda: 9, capacity: 10 });
  assert.equal(below.stable, true);
});

test('rule 3 tie: a zero divisor gives no value, never Infinity or NaN', () => {
  const w = C({ solveFor: 'W', lambda: 0, L: 5 });
  assert.equal(w.W, null);
  assert.equal(w.defined, false);
  assert.equal(w.stable, false);
  const l = C({ solveFor: 'lambda', W: 0, L: 5 });
  assert.equal(l.lambda, null);
  assert.equal(l.lambdaPerW, null);
  assert.equal(l.defined, false);
});

test('rule 4: a not-stable state by hand still reports the product λ × W (the demand)', () => {
  const s = preset('build-farm');
  const st = logic.compute(s);
  assert.equal(st.stable, false);
  assert.equal(st.L, 5);
  assert.equal(st.rho, 1.25);
});

// ── rules ──

test('rule 1: L = λW when solving for L (shop preset: 2 per minute × 5 min = 10)', () => {
  const s = logic.compute(preset('shop'));
  assert.equal(s.solveFor, 'L');
  assert.equal(s.L, 10);
  assert.equal(s.stable, true);
});

test('rule 2: units are converted: λ per s with W in ms, λ per h with W in min', () => {
  const srv = logic.compute(preset('server'));
  assert.equal(srv.L, 10);                 // 200 /s × 50 ms
  assert.equal(srv.rho, 10 / 16);
  assert.equal(srv.lambdaPerW, 0.2);       // per ms
  const farm = logic.compute(preset('build-farm'));
  assert.equal(farm.lambdaPerW, 0.2);      // 12 /h = 0.2 /min
  assert.equal(farm.L, 5);
  // the same physical system in other units gives the same L
  assert.equal(C({ system: 'shop', lambda: 12, W: 25 }).L, 300);   // per min × min, no conversion
});

test('rule 2: the server preset with 8 workers is over capacity', () => {
  const s = logic.compute(Object.assign(preset('server'), { places: 8 }));
  assert.equal(s.L, 10);
  assert.equal(s.stable, false);
});

test('rule 3: any two determine the third (measure-w: 30 in flight at 600 /s → 50 ms)', () => {
  const s = logic.compute(preset('measure-w'));
  assert.equal(s.solveFor, 'W');
  assert.equal(s.W, 50);
  assert.equal(s.stable, true);
  const lam = C({ system: 'build-farm', solveFor: 'lambda', L: 5, W: 25, places: 8 });
  assert.equal(lam.lambda, 12);
  // round trip: λ → L → W gives back the W
  const l = C({ system: 'server', lambda: 300, W: 40, places: 64 }).L;
  assert.equal(C({ system: 'server', solveFor: 'W', lambda: 300, L: l, places: 64 }).W, 40);
});

test('rule 3: the solved quantity ignores its own slider value', () => {
  assert.equal(C({ solveFor: 'W', lambda: 2, L: 10, W: 29 }).W, 5);
  assert.equal(C({ solveFor: 'lambda', W: 5, L: 10, lambda: 17 }).lambda, 2);
  assert.equal(C({ solveFor: 'L', lambda: 2, W: 5, L: 59 }).L, 10);
});

test('rule 5: from the queue, W is dc-sim\'s M/G/1 time at cv² 1 and L = ρ/(1 − ρ)', () => {
  const s = logic.compute(preset('from-queue'));
  assert.equal(s.fromQueue, true);
  near(s.rho, 0.9);
  near(s.W, 1000);                         // 1.0 s in ms
  near(s.L, 9);
  near(s.L, s.rho / (1 - s.rho));
  near(s.queue.w, 1);
  // dc-sim test_queueing: M/M/1 W = 1/(C − λ) across loads
  for (const lam of [1, 5, 8, 9]) {
    const q = C({ fromQueue: true, system: 'shop', lambda: lam, capacity: 10 });
    near(q.W, 1 / (10 - lam));
    near(q.L, (lam / 10) / (1 - lam / 10));
  }
});

test('rule 5: from the queue, the state solves for L whatever solveFor says, and has no places', () => {
  const s = C({ fromQueue: true, solveFor: 'W', system: 'server', lambda: 100, capacity: 250 });
  assert.equal(s.solveFor, 'L');
  assert.equal(s.places, null);
  assert.equal(s.capacity, 250);
  near(s.W, 1000 / 150);                   // 1/(250 − 100) s in ms
});

test('rule 1: the trace\'s long-run mean is λW, for exponential, fixed and uniform stays', () => {
  const p = P({ lambda: 3, W: 7, places: 64 });   // L = 21
  for (const dist of ['exp', 'fixed', 'uniform']) {
    for (const seed of [1, 2, 3]) {
      const tr = logic.trace(p, kit.rng(seed), { dist, horizon: 4000 });
      assert.ok(Math.abs(tr.mean - 21) / 21 < 0.03, `${dist} seed ${seed}: ${tr.mean}`);
      assert.equal(tr.grows, false);
    }
  }
});

test('rule 5: the trace from the queue settles near ρ/(1 − ρ)', () => {
  const p = P({ fromQueue: true, system: 'shop', lambda: 5, capacity: 10 });   // L = 1
  const tr = logic.trace(p, kit.rng(4), { horizon: 20000 });
  assert.ok(Math.abs(tr.mean - 1) < 0.05, String(tr.mean));
});

test('rule 4: a not-stable trace grows: its last part averages well above the places', () => {
  const tr = logic.trace(preset('build-farm'), kit.rng(1));
  assert.equal(tr.grows, true);
  const tail = tr.samples.slice(-20).map((x) => x[1]);
  assert.ok(Math.min(...tail) > 4, tail.join(' '));
  const early = tr.samples.slice(0, 20).map((x) => x[1]);
  assert.ok(Math.max(...early) < Math.min(...tail), 'later is higher');
});

test('trace: deterministic for a seed, 200 samples, running mean is the area so far', () => {
  const a = logic.trace(preset('shop'), kit.rng(2));
  const b = logic.trace(preset('shop'), kit.rng(2));
  assert.deepEqual(a, b);
  assert.equal(a.samples.length, 200);
  near(a.samples[199][2], a.mean);
  near(a.samples[199][0], a.T);
  assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
  assert.equal(logic.trace(P({ solveFor: 'W', lambda: 0 }), kit.rng(1)).samples.length, 0);
});

test('captions: the first that applies', () => {
  const k = (over, prev) => logic.captionKey(C(over), P(over), prev ? P(prev) : null);
  assert.equal(k({ fromQueue: true, lambda: 3, capacity: 3 }), 'queueUnstable');
  assert.equal(k({ fromQueue: true, lambda: 2, capacity: 3 }), 'queue');
  assert.equal(k({ places: 10 }), 'unstable');                         // L 10 = 10 places
  assert.equal(k({ W: 6 }, {}), 'changeW');
  assert.equal(k({ lambda: 3 }, {}), 'changeLambda');
  assert.equal(k({ lambda: 3, W: 6 }, {}), 'solveL');                  // both changed
  assert.equal(k({ W: 6 }, { places: 10 }), 'solveL');                 // from a not-stable state
  assert.equal(k({ W: 6 }, { system: 'server' }), 'solveL');           // another system
  assert.equal(k({ solveFor: 'W' }), 'solveW');
  assert.equal(k({ solveFor: 'lambda' }), 'solveLambda');
  assert.equal(k({}), 'solveL');
});

test('presets: every system id exists and preset values sit inside that system\'s ranges', () => {
  for (const pr of logic.presets) {
    const p = preset(pr.id);
    const sys = logic.SYSTEMS[p.system];
    assert.ok(sys, pr.id);
    for (const key of ['lambda', 'W', 'L', 'places', 'capacity']) {
      assert.ok(p[key] >= sys[key][0] && p[key] <= sys[key][1], `${pr.id}.${key} = ${p[key]}`);
      assert.ok(Number.isInteger(p[key]), `${pr.id}.${key} whole`);
    }
    if (p.fromQueue) assert.ok(p.lambda < p.capacity, 'the from-queue preset is stable');
  }
  for (const id of logic.SYSTEM_IDS) {
    const sys = logic.SYSTEMS[id];
    const st = logic.compute(P(Object.assign({ system: id }, sys.start)));
    assert.equal(st.stable, true, `${id} start values are stable`);
    assert.equal(st.L, sys.start.L, `${id} start L = λW`);
  }
});

test('from the queue, the λ slider reaches past C: the tie and growth are both reachable', () => {
  assert.equal(logic.queueTop(10), 12);
  assert.equal(logic.queueTop(3), 4);       // at least C + 1
  assert.equal(logic.queueTop(1), 2);
  assert.equal(logic.queueTop(6), 7);       // floor, not ceil or round
  const over = C({ fromQueue: true, system: 'server', lambda: 12, capacity: 10 });
  assert.equal(over.stable, false);
  assert.equal(over.rho, 1.2);
  const tr = logic.trace(P({ fromQueue: true, system: 'server', lambda: 12, capacity: 10 }), kit.rng(1));
  assert.equal(tr.grows, true);
  assert.ok(tr.samples[199][1] > 100, String(tr.samples[199][1]));   // about (12 − 10) × 200 s
});

test('rule 2: the product is formed as λ × W / div (integers first), so it is exact', () => {
  assert.equal(C({ system: 'server', lambda: 9, W: 13, places: 64 }).L, 0.117);   // 9 / 1000 × 13 would give 0.11699…
  assert.equal(C({ system: 'build-farm', solveFor: 'W', lambda: 12, L: 5, places: 8 }).W, 25);
});

test('unknown system and solveFor fall back to the shop and to solving for L', () => {
  const s = C({ system: 'nowhere', solveFor: 'x', lambda: 2, W: 5 });
  assert.equal(s.system, 'shop');
  assert.equal(s.div, 1);
  assert.equal(s.solveFor, 'L');
  assert.equal(s.L, 10);
});

test('rule 1 with units: the trace\'s long-run mean is λW on the server and the build farm too', () => {
  const srv = logic.trace(P({ system: 'server', lambda: 300, W: 40, places: 64 }), kit.rng(5), { horizon: 400000 });  // L = 12
  assert.ok(Math.abs(srv.mean - 12) / 12 < 0.04, String(srv.mean));
  const farm = logic.trace(P({ system: 'build-farm', lambda: 30, W: 20, places: 20 }), kit.rng(6), { horizon: 40000 }); // L = 10
  assert.ok(Math.abs(farm.mean - 10) / 10 < 0.04, String(farm.mean));
  const q = logic.trace(P({ fromQueue: true, system: 'server', lambda: 500, capacity: 1000 }), kit.rng(7), { horizon: 40000 }); // L = 1
  assert.ok(Math.abs(q.mean - 1) < 0.06, String(q.mean));
});

test('trace: a stable trace starts in steady state (no warm-up), for every stay distribution', () => {
  // The mean of L at the first sample (t = T/200), over many seeds, is close to λW; an empty start gives about 0, and
  // items already inside with full stays instead of remaining ones give more.
  for (const dist of ['exp', 'fixed', 'uniform']) {
    let sum = 0;
    for (let seed = 1; seed <= 300; seed++) sum += logic.trace(P({ lambda: 2, W: 10, places: 64 }), kit.rng(seed), { dist, horizon: 100 }).samples[0][1];
    const avg = sum / 300;                                  // L = 20, sample at t = 0.5 = W / 20
    assert.ok(Math.abs(avg - 20) < 1.2, `${dist}: ${avg}`);
  }
  let late = 0;
  for (let seed = 1; seed <= 300; seed++) late += logic.trace(P({ lambda: 2, W: 10, places: 64 }), kit.rng(seed), { dist: 'fixed', horizon: 1600 }).samples[0][1];
  assert.ok(Math.abs(late / 300 - 20) < 1.2, `fixed at t = 0.8 W: ${late / 300}`);   // full stays would keep all starters in
  let q = 0;
  for (let seed = 1; seed <= 400; seed++) q += logic.trace(P({ fromQueue: true, lambda: 8, capacity: 10 }), kit.rng(seed), { horizon: 10 }).samples[0][1];
  assert.ok(Math.abs(q / 400 - 4) < 0.6, `from the queue: ${q / 400}`);   // L = 0.8 / 0.2 = 4, geometric start
});

test('trace horizons: 100 W stable by hand, 40 W not stable, 2000 W (or service times) from the queue', () => {
  near(logic.trace(preset('shop'), kit.rng(1)).T, 500);
  near(logic.trace(preset('build-farm'), kit.rng(1)).T, 1000);
  near(logic.trace(preset('from-queue'), kit.rng(1)).T, 2000 * 1000);
  near(logic.trace(P({ fromQueue: true, system: 'server', lambda: 12, capacity: 10 }), kit.rng(1)).T, 2000 * 100);
});

test('"W from the queue" switched on: C puts ρ near 0.8 within the system\'s range, and λ fits under the slider top', () => {
  assert.equal(logic.queueCapacity(600, 'server'), 750);
  assert.equal(logic.queueCapacity(2, 'shop'), 3);
  assert.equal(logic.queueCapacity(20, 'shop'), 20);       // capped by the range
  assert.equal(logic.queueCapacity(0, 'build-farm'), 1);   // at least the range's bottom
  for (const id of logic.SYSTEM_IDS) {
    const top = logic.SYSTEMS[id].lambda[1];
    for (const lam of [1, Math.round(top / 2), top]) assert.ok(logic.queueTop(logic.queueCapacity(lam, id)) >= lam, `${id} λ ${lam}`);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe and a pure function of the params', () => {
  for (const pr of logic.presets) {
    const p = preset(pr.id);
    const s = logic.initial(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    assert.deepEqual(logic.compute(p), s);
  }
});

test('compute does not mutate its input', () => {
  const p = preset('from-queue');
  const copy = structuredClone(p);
  logic.compute(p);
  logic.trace(p, kit.rng(1));
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined, 'an explorer has no steps');
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
  const ids = meta.entries.map((e) => e.preset);
  assert.deepEqual(ids, logic.presets.map((x) => x.id), 'sim.json entries list the presets in order');
});
