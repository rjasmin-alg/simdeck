// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-deploy-strategies. Rules and expected numbers: SPEC.md. Run: node --test sims/lnx-deploy-strategies/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps(P(over)));
const lane = (over, n, k) => at(over, n).lanes[k];
/** One lane's v2 share, failed count or phase per minute 1..steps. */
const series = (over, k, f) => { const n = logic.steps(P(over)); const out = []; for (let i = 1; i <= n; i++) out.push(at(over, i).lanes[k][f]); return out; };

const SUBTLE = { v2Error: 3 };
const BELOW = { v2Error: 1.5 };
const CRASH = { v2Ready: false };
const GOOD = { v2Error: 0 };

// ── tie-breaks first ──

test('tie-break (rule 6): a trip in the minute rolling reaches 100 % still rolls back', () => {
  const p = { v2Error: 3, threshold: 2.5 };
  assert.deepEqual(series(p, 'rolling', 'v2Share'), [25, 50, 75, 100, 75, 50, 25, 0]);
  const r4 = lane(p, 4, 'rolling');
  assert.equal(r4.event, 'trip');
  assert.equal(r4.phase, 'rollingBack');
  assert.equal(end(p).lanes.rolling.phase, 'rolledBack');
  assert.equal(end(p).lanes.rolling.total, 240);
  assert.equal(logic.steps(P(p)), 8);
});

test('tie-break (rule 6): blue-green tripping at the switch (it reaches 100 % at once) rolls back', () => {
  const b2 = lane(SUBTLE, 2, 'blueGreen');
  assert.equal(b2.v2Share, 100);
  assert.equal(b2.event, 'trip');
  assert.equal(lane(SUBTLE, 3, 'blueGreen').phase, 'rolledBack');
});

test('tie-break (rule 6): a lane done with no trip stops there and runs no more checks', () => {
  assert.deepEqual(series(BELOW, 'blueGreen', 'phase'), ['deploying', 'done', 'done', 'done', 'done']);
  assert.deepEqual(series(BELOW, 'blueGreen', 'event').slice(2), ['serving', 'serving', 'serving']);
  assert.equal(lane(BELOW, 4, 'rolling').event, 'done');
  assert.equal(lane(BELOW, 5, 'rolling').event, 'serving');
});

test('tie-break (rule 7): exactly at the threshold does not trip; just over does', () => {
  // canary at 10 %: 200 requests; 2 % of 200 = 4 failed = exactly 2 %
  const atThr = lane({ v2Error: 2, threshold: 2 }, 1, 'canary');
  assert.equal(atThr.failed, 4);
  assert.equal(atThr.phase, 'deploying');
  assert.equal(lane({ v2Error: 2.5, threshold: 2 }, 1, 'canary').phase, 'rollingBack');
  // blue-green at 100 %: 40 of 2,000 = 2 % does not trip; 2.5 % does
  assert.equal(lane({ v2Error: 2, threshold: 2 }, 2, 'blueGreen').phase, 'done');
  assert.equal(lane({ v2Error: 2.5, threshold: 2 }, 2, 'blueGreen').phase, 'rollingBack');
  // rolling at 25 %: 500 × 8 % = 40 of 2,000 = exactly 2 %: no trip; at 50 % it is 4 %
  assert.equal(lane({ v2Error: 8, threshold: 2 }, 1, 'rolling').phase, 'deploying');
  assert.equal(lane({ v2Error: 8, threshold: 2 }, 2, 'rolling').event, 'trip');
  assert.equal(logic.trips(500, 2000, P({ v2Error: 8, threshold: 2 })), false);
  assert.equal(logic.trips(0, 0, P({ threshold: 1 })), false, 'no requests, no trip');
});

test('tie-break (rule 7): the check reads the exact rate, not the rounded count', () => {
  // canary at 25 %: 500 × 1.5 % = 7.5 → 8 failed (1.6 %), but the rate is 1.5 %, not over 1.5 %
  const p = { v2Error: 1.5, threshold: 1.5 };
  const c3 = lane(p, 3, 'canary');
  assert.equal(c3.failed, 8);
  assert.equal(c3.rate, 1.5);
  assert.equal(c3.phase, 'deploying');
  assert.equal(end(p).lanes.canary.phase, 'done');
  for (let th = 1.5; th <= 9.5; th += 1) assert.equal(end({ v2Error: th, threshold: th }).lanes.canary.trippedAt, null, `canary at ${th} / ${th}`);
});

test('tie-break: the rollback move happens the minute after the trip, not in it', () => {
  const r3 = lane(SUBTLE, 3, 'rolling');
  assert.equal(r3.v2Share, 75, 'still 75 % in the minute it trips');
  assert.equal(r3.phase, 'rollingBack');
  assert.equal(lane(SUBTLE, 4, 'rolling').v2Share, 50);
  assert.equal(lane(SUBTLE, 1, 'canary').v2Share, 10);
  assert.equal(lane(SUBTLE, 2, 'canary').v2Share, 0);
});

test('tie-break: failed requests round half up to a whole request', () => {
  assert.equal(logic.failures(500, P({ v2Error: 1.5 })), 8);
  assert.equal(logic.failures(1500, P({ v2Error: 1.5 })), 23);
  assert.equal(logic.failures(200, P({ v2Error: 1.5 })), 3);
});

// ── rule 1: rolling replaces one instance per minute ──

test('rule 1: rolling goes 25 → 50 → 75 → 100 %, one instance replaced per minute', () => {
  assert.deepEqual(series(GOOD, 'rolling', 'v2Share'), [25, 50, 75, 100, 100]);
  for (let n = 1; n <= 4; n++) {
    const r = lane(GOOD, n, 'rolling');
    assert.equal(r.changed.length, 1);
    assert.equal(r.instances.length, 4);
    assert.equal(r.instances.filter((x) => x.ver === 2).length, n);
  }
  assert.deepEqual(lane(GOOD, 2, 'rolling').changed, ['r2']);
  assert.equal(lane(GOOD, 4, 'rolling').phase, 'done');
  assert.equal(lane(GOOD, 4, 'rolling').finishedAt, 4);
});

test('rule 1: requests go to ready instances only, evenly', () => {
  const r = lane(GOOD, 1, 'rolling');
  assert.deepEqual(logic.traffic(r), { r1: 500, r2: 500, r3: 500, r4: 500 });
  const stalled = lane(CRASH, 1, 'rolling');
  assert.deepEqual(logic.traffic(stalled), { r1: 500, r2: 500, r3: 500, r4: 500, r5: 0 });
  const c = lane(GOOD, 1, 'canary');
  assert.deepEqual(logic.traffic(c), { c1: 450, c2: 450, c3: 450, c4: 450, k1: 200 });
  const b = lane(GOOD, 2, 'blueGreen');
  assert.deepEqual(logic.traffic(b), { b1: 0, b2: 0, b3: 0, b4: 0, g1: 500, g2: 500, g3: 500, g4: 500 });
});

// ── rule 2: rolling with a v2 that never becomes ready ──

test('rule 2: rolling stalls with v1 serving, 0 failed, deadline at minute 11, no rollback', () => {
  for (let n = 1; n <= 3; n++) {
    const r = lane(CRASH, n, 'rolling');
    assert.equal(r.phase, 'stalled');
    assert.equal(r.v2Share, 0);
    assert.equal(r.failed, 0);
    assert.equal(r.instances.filter((x) => x.ver === 1 && x.ready).length, 4, 'all four v1 stay (unavailable 0)');
    assert.deepEqual(r.instances[4], { id: 'r5', ver: 2, ready: false }, 'the surge instance, not ready');
    assert.equal(r.deadlineAt, 11, '600 s after minute 1');
    assert.equal(r.trippedAt, null);
  }
  assert.equal(lane(CRASH, 1, 'rolling').event, 'stalled');
  assert.deepEqual(lane(CRASH, 1, 'rolling').changed, ['r5']);
  assert.equal(lane(CRASH, 1, 'rolling').finishedAt, 1);
  assert.equal(lane(CRASH, 2, 'rolling').event, 'waiting');
});

// ── rule 3: blue-green ──

test('rule 3: green beside blue at 0 %, then 100 % at once; back in one minute', () => {
  const b1 = lane(SUBTLE, 1, 'blueGreen');
  assert.equal(b1.event, 'deploy');
  assert.deepEqual(b1.changed, ['g1', 'g2', 'g3', 'g4']);
  assert.equal(b1.v2Share, 0);
  assert.equal(b1.instances.length, 8);
  assert.equal(b1.live, 'blue');
  const b2 = lane(SUBTLE, 2, 'blueGreen');
  assert.equal(b2.live, 'green');
  assert.equal(b2.failed, 60);
  const b3 = lane(SUBTLE, 3, 'blueGreen');
  assert.equal(b3.event, 'rolledBack');
  assert.equal(b3.finishedAt, 3);
  assert.equal(b2.trippedAt, 2);
  assert.equal(b3.live, 'blue');
  assert.equal(b3.v2Share, 0);
  assert.equal(b3.instances.filter((x) => x.set === 'blue' && x.ready).length, 4, 'blue never stopped');
  assert.equal(b3.instances.filter((x) => x.set === 'green').length, 4, 'green stays for a look');
  assert.equal(lane(GOOD, 2, 'blueGreen').phase, 'done');
  assert.equal(lane(GOOD, 2, 'blueGreen').event, 'done');
  assert.equal(lane(GOOD, 3, 'blueGreen').event, 'serving');
});

test('rule 3: the switch is refused when green is not ready', () => {
  const b2 = lane(CRASH, 2, 'blueGreen');
  assert.equal(b2.event, 'refused');
  assert.equal(b2.phase, 'stalled');
  assert.equal(b2.live, 'blue');
  assert.equal(b2.v2Share, 0);
  assert.equal(lane(CRASH, 1, 'blueGreen').instances.filter((x) => x.set === 'green' && !x.ready).length, 4);
});

// ── rule 4: canary ──

test('rule 4: canary stages 10, 10, 25, 50, 100 % with 1, 1, 1, 2, 4 v2 instances', () => {
  assert.deepEqual(series(GOOD, 'canary', 'v2Share'), [10, 10, 25, 50, 100]);
  assert.deepEqual([1, 2, 3, 4, 5].map((n) => lane(GOOD, n, 'canary').instances.filter((x) => x.ver === 2).length), [1, 1, 1, 2, 4]);
  assert.equal(lane(GOOD, 5, 'canary').phase, 'done');
  assert.deepEqual([1, 2, 3, 4, 5].map((n) => lane(GOOD, n, 'canary').event), ['advance', 'advance', 'advance', 'advance', 'done']);
  assert.deepEqual(lane(GOOD, 1, 'canary').changed, ['k1']);
  assert.deepEqual(lane(GOOD, 2, 'canary').changed, []);
  assert.deepEqual(lane(GOOD, 5, 'canary').changed, ['k3', 'k4']);
});

test('rule 4: the canary check uses its own error rate, not the service-wide one', () => {
  // 3 % of the canary's 200 = 6 failed: overall only 0.3 %, but its own 3 % > 2 %
  const c = lane(SUBTLE, 1, 'canary');
  assert.equal(c.failed, 6);
  assert.equal(c.rate, 3);
  assert.equal(c.event, 'trip');
  // the same 200 requests to v2 out of 2,000 would not trip the service-wide alert (0.3 %)
  assert.equal(logic.trips(200, 2000, P(SUBTLE)), false);
  assert.equal(logic.trips(200, 200, P(SUBTLE)), true);
});

test('rule 4: abort sets v2 to 0 % in one minute; a canary that is not ready gets no traffic', () => {
  const c2 = lane(SUBTLE, 2, 'canary');
  assert.equal(c2.v2Share, 0);
  assert.equal(c2.phase, 'rolledBack');
  assert.equal(c2.event, 'rolledBack');
  assert.equal(c2.finishedAt, 2);
  assert.equal(lane(SUBTLE, 1, 'canary').trippedAt, 1);
  assert.deepEqual(c2.instances.filter((x) => x.ver === 2).map((x) => x.id), ['k1'], 'the canary stays, with no traffic');
  const k = lane(CRASH, 1, 'canary');
  assert.equal(k.phase, 'stalled');
  assert.equal(k.event, 'stalled');
  assert.equal(k.instances.find((x) => x.id === 'k1').ready, false);
  assert.equal(k.v2Share, 0);
  assert.equal(logic.traffic(k).k1, 0);
});

// ── rule 5: rolling and blue-green use the service-wide alert; rolling rolls back rolling ──

test('rule 5: rolling trips on the overall rate and rolls back −25 % a minute, newest v2 first', () => {
  assert.deepEqual(series(SUBTLE, 'rolling', 'v2Share'), [25, 50, 75, 50, 25, 0]);
  assert.deepEqual(series(SUBTLE, 'rolling', 'failed'), [15, 30, 45, 30, 15, 0]);
  assert.equal(lane(SUBTLE, 2, 'rolling').phase, 'deploying', '1.5 % overall at 50 % is under 2 %');
  assert.equal(lane(SUBTLE, 3, 'rolling').rate, 2.25);
  assert.equal(lane(SUBTLE, 3, 'rolling').trippedAt, 3);
  assert.deepEqual(lane(SUBTLE, 4, 'rolling').changed, ['r3']);
  assert.deepEqual(lane(SUBTLE, 5, 'rolling').changed, ['r2']);
  assert.deepEqual(series(SUBTLE, 'rolling', 'event'), ['advance', 'advance', 'trip', 'back', 'back', 'rolledBack']);
});

// ── presets: the task's numbers ──

test('preset all-errors: 500 / 2,000 / 200 failed, 3 steps', () => {
  const s = end({});
  assert.equal(logic.steps(P({})), 3);
  assert.deepEqual([s.lanes.rolling.total, s.lanes.blueGreen.total, s.lanes.canary.total], [500, 2000, 200]);
  assert.ok(logic.LANES.every((k) => s.lanes[k].phase === 'rolledBack'));
});

test('preset subtle-bug: 135 / 60 / 6 failed, 6 steps', () => {
  const s = end(SUBTLE);
  assert.equal(logic.steps(P(SUBTLE)), 6);
  assert.deepEqual([s.lanes.rolling.total, s.lanes.blueGreen.total, s.lanes.canary.total], [135, 60, 6]);
});

test('preset below-threshold: every lane completes at 100 %, 30 failed a minute from then on', () => {
  const s = end(BELOW);
  assert.equal(logic.steps(P(BELOW)), 5);
  assert.ok(logic.LANES.every((k) => s.lanes[k].phase === 'done' && s.lanes[k].v2Share === 100 && s.lanes[k].failed === 30));
  assert.deepEqual([s.lanes.rolling.total, s.lanes.blueGreen.total, s.lanes.canary.total], [106, 120, 59]);
  assert.ok(logic.LANES.every((k) => s.lanes[k].trippedAt === null));
});

test('preset crash: 0 failed everywhere, every lane stalled, 3 steps', () => {
  const s = end(CRASH);
  assert.equal(logic.steps(P(CRASH)), 3);
  assert.ok(logic.LANES.every((k) => s.lanes[k].total === 0 && s.lanes[k].phase === 'stalled'));
});

test('preset good-release: rolling done at 4, blue-green at 2, canary at 5; 5 steps', () => {
  const s = end(GOOD);
  assert.equal(logic.steps(P(GOOD)), 5);
  assert.deepEqual(logic.LANES.map((k) => s.lanes[k].finishedAt), [4, 2, 5]);
  assert.ok(logic.LANES.every((k) => s.lanes[k].total === 0));
});

// ── rule 8: steps ──

test('rule 8: steps stay within 3..8 over the whole parameter range', () => {
  let max = 0;
  for (let e = 0; e <= 100; e += 0.5) {
    for (let th = 1; th <= 10; th += 0.5) {
      for (const ready of [true, false]) {
        const n = logic.steps(P({ v2Error: e, threshold: th, v2Ready: ready }));
        assert.ok(n >= 3 && n <= 8, `steps ${n} for ${e} / ${th} / ${ready}`);
        max = Math.max(max, n);
      }
    }
  }
  assert.equal(max, 8);
});

test('a finished lane keeps its last state while the others run on', () => {
  const c3 = lane({}, 3, 'canary');
  const c2 = lane({}, 2, 'canary');
  assert.equal(c3.phase, c2.phase);
  assert.deepEqual(c3.instances, c2.instances);
  assert.equal(c3.total, c2.total);
  assert.equal(c3.event, 'idle');
  assert.deepEqual(c3.changed, []);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of [{}, SUBTLE, BELOW, CRASH, GOOD]) {
    for (let n = 0; n <= logic.steps(P(over)); n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P(SUBTLE);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  const n = logic.steps(p);
  for (let i = 1; i <= n; i++) { s = logic.step(s, i, p); forward.push(s); }
  for (let i = n; i >= 0; i--) assert.deepEqual(kit.stateAt(logic, p, i), forward[i]);
});

test('step does not mutate its input', () => {
  const p = P(SUBTLE);
  const s = kit.stateAt(logic, p, 3);
  const copy = structuredClone(s);
  logic.step(s, 4, p);
  assert.deepEqual(s, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the default run');
  const presets = [...html.matchAll(/params:\s*\{([^}]*)\}/g)];
  assert.equal(presets.length, 5);
  for (const m of presets) {
    for (const k of [...m[1].matchAll(/(\w+):/g)].map((x) => x[1])) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  }
});
