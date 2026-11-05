// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cap-under-partition's model: tie-breaks first, then one test per rule (SPEC.md), then the presets'
// numbers, then the template's generic block.
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
const steps = (p) => kit.stepsOf(logic, p);
const at = (p, n) => kit.stateAt(logic, p, n);
const end = (p) => at(p, steps(p));
const values = (s) => Object.fromEntries(logic.IDS.map((id) => [id, s.servers[id].value]));
/** The requests made in step n. */
const reqs = (p, n) => { const s = at(p, n); return s.changed.requests.map((i) => s.requests[i]); };
const req = (p, n) => reqs(p, n)[0];

// ── tie-breaks ──

test('T1 (rule 6): requests in one step are processed K1 before K2, whatever order the run names them', () => {
  for (const ops of ['w1+r2', 'r2+w1']) {
    const [a, b] = reqs(P({ mode: 'ap', ops }), 1);
    assert.equal(a.client, 'K1');
    assert.equal(b.client, 'K2');
    // K2's read sees K1's write of the same step
    assert.equal(b.value, 2);
    assert.equal(b.result, 'ok');
  }
  assert.deepEqual(logic.actionsOf({ ops: 'r2+w1' }), [[{ client: 'K1', op: 'write' }, { client: 'K2', op: 'read' }]]);
});

test('T2 (rule 5): equal steps in LWW → the larger client id wins', () => {
  assert.ok(logic.compare({ at: 2, client: 'K2', seq: 2 }, { at: 2, client: 'K1', seq: 1 }) > 0);
  assert.ok(logic.compare({ at: 3, client: 'K1', seq: 3 }, { at: 2, client: 'K2', seq: 2 }) > 0);
  assert.ok(logic.compare({ at: 1, client: 'K1', seq: 1 }, { at: 0, client: null, seq: 0 }) > 0);
  // in a run: both write in step 2 on opposite sides, K2's x = 3 is kept and K1's x = 2 is lost
  const s = at(P({ mode: 'ap', ops: 'p.w1+w2.h' }), 3);
  assert.equal(s.heal.kind, 'conflict');
  assert.deepEqual(values(s), { A: 3, B: 3, C: 3 });
  assert.deepEqual(s.heal.lost, [1]);
});

test('T3: a CP read returns the newest version among the replicas it consulted', () => {
  const r = req(P({ mode: 'cp', ops: 'p.w1.r1' }), 3);
  assert.deepEqual(r.consulted, ['A', 'B']);
  assert.equal(r.value, 2);
  // runs never leave a CP coordinator behind its reachable peers, so build that state by hand: C still at x = 1,
  // A and B at 2, the network whole, CP quorums. K2's read at C must return 2, not C's own 1.
  const prev = structuredClone(at(P({ mode: 'ap', ops: 'p.w1' }), 2));
  prev.quorum = { n: 3, w: 2, r: 2 };
  prev.partition = null;
  prev.partitionedAt = null;
  const s = logic.step(prev, 3, P({ mode: 'cp', ops: 'p.w1.r2' }));
  const q = s.requests[s.requests.length - 1];
  assert.deepEqual(q.consulted, ['A', 'B', 'C']);
  assert.equal(q.value, 2);
  assert.equal(q.result, 'ok');
});

test('T4: partition while partitioned and heal while whole change nothing', () => {
  const p = P({ mode: 'ap', ops: 'p.w1.p.h.h' });
  const s3 = at(p, 3), s2 = at(p, 2);
  assert.equal(s3.phase, 'noop');
  assert.equal(s3.noop, 'already');
  assert.equal(s3.partitionedAt, s2.partitionedAt);
  assert.deepEqual(values(s3), values(s2));
  const s5 = at(p, 5);
  assert.equal(s5.phase, 'noop');
  assert.equal(s5.noop, 'notPartitioned');
  assert.deepEqual(values(s5), values(at(p, 4)));
});

// ── rules ──

test('rule 1: without a partition both modes write all three and read the newest value', () => {
  for (const mode of ['cp', 'ap']) {
    const p = P({ mode, ops: 'w1.r2.w2.r1' });
    const w = req(p, 1);
    assert.equal(w.result, 'ok');
    assert.deepEqual(values(at(p, 1)), { A: 2, B: 2, C: 2 });
    assert.equal(req(p, 2).value, 2);
    assert.equal(req(p, 2).result, 'ok');
    assert.deepEqual(values(at(p, 3)), { A: 3, B: 3, C: 3 });
    assert.equal(req(p, 4).value, 3);
    assert.equal(req(p, 4).result, 'ok');
  }
});

test('rule 2: CP quorums W = 2, R = 2 of N = 3, so R + W > N', () => {
  const s = logic.initial(P({ mode: 'cp' }));
  assert.deepEqual(s.quorum, { n: 3, w: 2, r: 2 });
  assert.ok(s.quorum.r + s.quorum.w > s.quorum.n);
  // the majority side has exactly W acknowledgements
  const w = req(P({ mode: 'cp', ops: 'p.w1' }), 2);
  assert.equal(w.result, 'ok');
  assert.deepEqual(w.consulted, ['A', 'B']);
});

test('rule 2: no CP read is ever stale, over every run of five actions', () => {
  const toks = ['p', 'h', 'w1', 'r1', 'w2', 'r2'];
  let runs = [[]];
  for (let len = 0; len < 5; len++) runs = runs.flatMap((r) => toks.map((x) => r.concat(x)));
  let reads = 0;
  for (const r of runs) {
    const s = end(P({ mode: 'cp', ops: r.join('.') }));
    for (const q of s.requests) if (q.op === 'read') { reads++; assert.notEqual(q.result, 'stale', r.join('.')); }
    assert.equal(s.tally.lost, 0, r.join('.'));
  }
  assert.ok(reads > 500);
});

test('rule 3: CP under partition, the minority side times out on reads and writes and applies nothing', () => {
  const p = P({ mode: 'cp', ops: 'p.r2.w2' });
  const r = req(p, 2), w = req(p, 3);
  assert.equal(r.result, 'err');
  assert.equal(r.value, null);
  assert.equal(w.result, 'err');
  assert.deepEqual(at(p, 3).writes[0].on, []);
  assert.deepEqual(values(at(p, 3)), { A: 1, B: 1, C: 1 });
  // the majority side serves both
  const q = P({ mode: 'cp', ops: 'p.w1.r1' });
  assert.equal(req(q, 2).result, 'ok');
  assert.equal(req(q, 3).result, 'ok');
});

test('rule 4: AP answers alone; C accepts writes, serves a stale read, and the sides diverge', () => {
  const p = P({ mode: 'ap', ops: 'p.w1.r2.w2' });
  assert.deepEqual(logic.initial(p).quorum, { n: 3, w: 1, r: 1 });
  const r = req(p, 3);
  assert.deepEqual(r.consulted, ['C']);
  assert.equal(r.value, 1);
  assert.equal(r.newest, 2);
  assert.equal(r.result, 'stale');
  assert.equal(at(p, 3).divergence, null, 'only one side has written: behind, not diverged');
  const w = req(p, 4);
  assert.equal(w.result, 'ok');
  assert.deepEqual(w.consulted, ['C']);
  const d = at(p, 4).divergence;
  assert.deepEqual(d.map((x) => [x.side, x.value]), [[['A', 'B'], 2], [['C'], 3]]);
  // without a partition an AP read still asks its coordinator alone
  assert.deepEqual(req(P({ mode: 'ap', ops: 'r1' }), 1).consulted, ['A']);
  // a read on the side that has the newest value is not stale
  assert.equal(req(P({ mode: 'ap', ops: 'p.w1.r1' }), 3).result, 'ok');
});

test('rule 5: AP heal after both sides wrote: conflict, LWW keeps the later stamp, the other write is lost', () => {
  const s = at(P({ mode: 'ap', ops: 'p.w1.r2.w2.h' }), 5);
  assert.equal(s.heal.kind, 'conflict');
  assert.deepEqual(s.heal.versions.map((v) => v.value), [2, 3]);
  assert.equal(s.heal.winner, 2);
  assert.deepEqual(s.heal.lost, [1]);
  assert.equal(s.writes[0].lost, true);
  assert.deepEqual(values(s), { A: 3, B: 3, C: 3 });
  assert.deepEqual(s.heal.caughtUp, ['A', 'B']);
  assert.equal(s.partition, null);
  assert.equal(s.divergence, null);
  // the later write wins whichever side made it
  const t = at(P({ mode: 'ap', ops: 'p.w2.w1.h' }), 4);
  assert.deepEqual(values(t), { A: 3, B: 3, C: 3 });
  assert.equal(t.writes.find((w) => w.lost).client, 'K2');
});

test('rule 5: every write the losing side acknowledged during the partition is lost, not only its last', () => {
  const s = at(P({ mode: 'ap', ops: 'p.w1.w1.w2.h' }), 5);
  assert.equal(s.heal.kind, 'conflict');
  assert.deepEqual(s.heal.lost, [1, 2]);
  assert.deepEqual(s.writes.map((w) => w.lost), [true, true, false]);
  assert.deepEqual(values(s), { A: 4, B: 4, C: 4 });
});

test('the heal is shown in its own step only; the next step starts clean', () => {
  const p = P({ mode: 'ap', ops: 'p.w1.r2.w2.h' });
  assert.notEqual(at(p, 5).heal, null);
  assert.equal(at(p, 6).heal, null);
  assert.equal(at(p, 4).heal, null);
});

test('versions received and the changed replicas, per step (the strips and the changed marks)', () => {
  const p = P({ mode: 'cp', ops: 'p.w1.r2.w2.h' });
  assert.deepEqual(at(p, 2).changed.servers, ['A', 'B']);
  assert.deepEqual(at(p, 2).servers.C.got, [0]);
  assert.deepEqual(at(p, 2).servers.A.got, [0, 1]);
  assert.deepEqual(at(p, 3).changed.servers, []);
  assert.deepEqual(at(p, 4).changed.servers, [], 'a refused write changes nobody');
  assert.deepEqual(at(p, 5).changed.servers, ['C']);
  assert.deepEqual(at(p, 5).servers.C.got, [0, 1]);
  assert.deepEqual(at(p, 5).writes[0].on, ['A', 'B', 'C']);
});

test('rule 5: a heal without a conflict is a catch-up; nothing is lost', () => {
  for (const mode of ['cp', 'ap']) {
    const s = at(P({ mode, ops: 'p.w1.h' }), 3);
    assert.equal(s.heal.kind, 'catchup');
    assert.deepEqual(s.heal.caughtUp, ['C']);
    assert.deepEqual(s.heal.lost, []);
    assert.deepEqual(values(s), { A: 2, B: 2, C: 2 });
  }
});

test('a second partition starts a new divergence window', () => {
  const s = at(P({ mode: 'ap', ops: 'p.w2.h.p.w1.h' }), 6);
  assert.equal(s.heal.kind, 'catchup', 'K2\'s earlier write is from the first partition');
  assert.equal(s.writes.filter((w) => w.lost).length, 0);
});

test('values: 1 + the write requests so far, failed ones included; one request per client per step', () => {
  const s = end(P({ mode: 'cp', ops: 'p.w2.w1' }));
  assert.deepEqual(s.writes.map((w) => [w.client, w.value, w.result]), [['K2', 2, 'err'], ['K1', 3, 'ok']]);
  assert.deepEqual(logic.actionsOf({ ops: 'w1+w1+r2.x.p+w1..h' }), [[{ client: 'K1', op: 'write' }, { client: 'K2', op: 'read' }], 'p', 'h']);
  assert.equal(logic.encode(logic.actionsOf({ ops: 'r2+w1.p.h' })), 'w1+r2.p.h');
  // a step mixing a request with p or h keeps the first token's kind
  assert.deepEqual(logic.actionsOf({ ops: 'w1+p.h+r2' }), [[{ client: 'K1', op: 'write' }], 'h']);
});

test('the run holds at most 19 actions; with the summary at most 20 steps', () => {
  const long = Array(30).fill('w1').join('.');
  assert.equal(steps(P({ ops: long })), 20);
  assert.equal(steps(P({ ops: '' })), 1);
  assert.equal(end(P({ ops: '' })).phase, 'summary');
});

test('the summary counts the answers per client and the lost writes', () => {
  assert.deepEqual(end(P({ mode: 'ap', ops: 'p.w1.r2.w2.h' })).tally, {
    lost: 1, K1: { ok: 1, stale: 0, err: 0, n: 1 }, K2: { ok: 1, stale: 1, err: 0, n: 2 } });
  assert.deepEqual(end(P({ mode: 'cp', ops: 'p.w1.r2.w2.h' })).tally, {
    lost: 0, K1: { ok: 1, stale: 0, err: 0, n: 1 }, K2: { ok: 0, stale: 0, err: 2, n: 2 } });
});

// ── presets ──

const PRESETS = {
  'no-partition': { mode: 'cp', ops: 'w1.r2' },
  'cp-majority': { mode: 'cp', ops: 'p.w1.r2.w2.h' },
  'ap-both': { mode: 'ap', ops: 'p.w1.r2.w2.h' },
  'cp-client-view': { mode: 'cp', ops: 'p.r2.w2' }
};

test('presets: the numbers in SPEC.md', () => {
  // no-partition, in both modes
  for (const mode of ['cp', 'ap']) {
    const p = P(Object.assign({}, PRESETS['no-partition'], { mode }));
    assert.equal(steps(p), 3);
    assert.deepEqual(values(at(p, 1)), { A: 2, B: 2, C: 2 });
    assert.equal(req(p, 2).value, 2);
  }
  const cp = P(PRESETS['cp-majority']);
  assert.equal(steps(cp), 6);
  assert.deepEqual([req(cp, 2).result, req(cp, 3).result, req(cp, 4).result], ['ok', 'err', 'err']);
  assert.equal(req(cp, 4).value, 3);
  assert.deepEqual(values(at(cp, 2)), { A: 2, B: 2, C: 1 });
  assert.equal(at(cp, 5).heal.kind, 'catchup');
  assert.deepEqual(values(at(cp, 5)), { A: 2, B: 2, C: 2 });
  assert.equal(at(cp, 6).phase, 'summary');
  const ap = P(PRESETS['ap-both']);
  assert.equal(steps(ap), 6);
  assert.deepEqual([req(ap, 3).value, req(ap, 3).result], [1, 'stale']);
  assert.equal(req(ap, 4).result, 'ok');
  assert.deepEqual(at(ap, 5).heal.versions.map((v) => v.value), [2, 3]);
  assert.deepEqual(values(at(ap, 5)), { A: 3, B: 3, C: 3 });
  const view = P(PRESETS['cp-client-view']);
  assert.equal(steps(view), 4);
  assert.deepEqual([req(view, 2).result, req(view, 3).result], ['err', 'err']);
});

test('the page lists exactly these presets, in this order, with these params', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const found = [...html.matchAll(/\{ id: '([a-z-]+)', label: [^}]*params: \{ mode: '(\w+)', ops: '([\w.+]*)' \}/g)]
    .map((m) => [m[1], { mode: m[2], ops: m[3] }]);
  assert.deepEqual(Object.fromEntries(found), PRESETS);
  assert.deepEqual(found.map((f) => f[0]), Object.keys(PRESETS));
});

// ── generic checks every sim keeps ──

const SAMPLES = [P({}), P(PRESETS['cp-majority']), P(PRESETS['ap-both']), P({ mode: 'ap', ops: 'p.w1+w2.r1+r2.h.w2.p.p.h.h' }),
  P({ mode: 'cp', ops: 'w1+r2.p.w1+w2.r1+r2.h' }), P({ ops: '' })];

test('state is JSON-safe at every step', () => {
  for (const p of SAMPLES) for (let n = 0; n <= steps(p); n++) {
    const s = at(p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const p of SAMPLES) {
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const p of SAMPLES) for (let n = 1; n <= steps(p); n++) {
    const prev = at(p, n - 1);
    const copy = structuredClone(prev);
    logic.step(prev, n, p);
    assert.deepEqual(prev, copy);
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, steps(P({})), 'meta.steps matches the model at the defaults');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
