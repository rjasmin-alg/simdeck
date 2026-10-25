// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for dns-ttl-cache. Run: node --test sims/dns-ttl-cache/
// Rules first (tie-breaks first of all), then the presets' numbers, then the template's generic block. SPEC.md.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const MIN = 60;
const P = (over) => Object.assign({}, logic.defaults, over);
const PRESETS = {
  'book-naive': {},
  'book-lowered': { lower: true, lowerAt: -70, newTtl: 300, stepMin: 5 },
  'lowered-too-late': { lower: true, lowerAt: -10, stepMin: 10 },
  negative: { scenario: 'newname', stepMin: 5 }
};
/** The state whose clock reads `min` minutes (the step is found from the window). */
function atMin(over, min) {
  const p = P(over);
  const w = logic.windowOf(p);
  const n = (min * MIN - w.from) / logic.stepSec(p);
  assert.ok(Number.isInteger(n) && n >= 0 && n <= w.steps, `t = ${min} min is a step of this run`);
  const s = kit.stateAt(logic, p, n);
  assert.equal(s.t, min * MIN);
  return s;
}
const R = (s, id) => s.resolvers.find((r) => r.id === id);
const { old: OLD, new: NEW, novi: NOVI } = logic.ADDR;

// ── rule 1: expiry, tie-break first ──

test('rule 1 tie-break: an entry with 0 s left is expired', () => {
  const e = { expiresAt: 600 };
  assert.equal(logic.valid(e, 599), true);
  assert.equal(logic.valid(e, 600), false);
  assert.equal(logic.left(e, 600), 0);
});

test('rule 1 tie-break: at fetchedAt + ttl the busy resolver asks again at that very moment', () => {
  // book-naive: R1 fetched at −110 with 3600 s; at −50 the entry is expired and is fetched again, full TTL
  const s = atMin({}, -50);
  const r1 = R(s, 'R1');
  assert.equal(r1.answer.fetchedAt, -50 * MIN);
  assert.equal(r1.answer.ttlLeft, 3600);
  assert.equal(r1.source, 'auth');
  assert.equal(r1.refetches, 1);
  // one second earlier the old entry would still have served: the step before shows 600 s left
  assert.equal(R(atMin({}, -60), 'R1').answer.ttlLeft, 600);
});

test('rule 1: an expiry between two steps is refetched at its own moment, not at the next step', () => {
  // book-naive R3 fetched at −5 (between the steps −10 and 0): at 0 its answer has 3300 s left, not 3600
  const r3 = R(atMin({}, 0), 'R3');
  assert.equal(r3.answer.fetchedAt, -5 * MIN);
  assert.equal(r3.answer.ttlLeft, 3300);
  assert.equal(r3.source, 'auth');
});

// ── edits first at equal times ──

test('tie-break: a zone edit and an expiry at the same moment: the edit applies first', () => {
  // book-lowered: all three 300 s entries expire at exactly 0, when the address changes; all get the new one
  const s = atMin(PRESETS['book-lowered'], 0);
  for (const id of logic.IDS) {
    assert.equal(R(s, id).answer.addr, NEW, id);
    assert.equal(R(s, id).answer.fetchedAt, 0, id);
  }
});

test('tie-break: a TTL lowering at the moment an entry expires is seen by that fetch', () => {
  // R1's 3600 s entry expires at −50; lowering at −50 → the refetch at −50 already carries 300 s
  const r1 = R(atMin({ lower: true, lowerAt: -50, stepMin: 10 }, -50), 'R1');
  assert.equal(r1.answer.fetchedAt, -50 * MIN);
  assert.equal(r1.answer.ttl, 300);
});

test('tie-break: a first question at the moment a name is added gets the name', () => {
  const r2 = R(atMin(PRESETS.negative, 0), 'R2');
  assert.equal(r2.answer.addr, NOVI);
  assert.equal(r2.source, 'auth');
});

// ── rule 2: current address, current TTL, fixed at fetch time ──

test('rule 2: a miss gets the zone\'s current address and TTL', () => {
  const z = logic.zone0(P());
  assert.deepEqual(logic.fetch(z, P(), logic.NAME, 100), { name: logic.NAME, addr: OLD, ttl: 3600, fetchedAt: 100, expiresAt: 3700 });
  const z2 = logic.applyEdit(logic.applyEdit(z, { kind: 'ttl', ttl: 60 }), { kind: 'addr', name: logic.NAME, addr: NEW });
  assert.deepEqual(logic.fetch(z2, P(), logic.NAME, 100), { name: logic.NAME, addr: NEW, ttl: 60, fetchedAt: 100, expiresAt: 160 });
  // book-naive: R1's refetch at +10 gets the new address
  assert.equal(R(atMin({}, 10), 'R1').answer.addr, NEW);
});

test('rule 2: a later TTL lowering does not shorten an entry already cached', () => {
  // lowered-too-late: R2 fetched at −20 with 3600 s; the zone says 300 s from −10, R2 still holds 3600 s
  const s = atMin(PRESETS['lowered-too-late'], 30);
  assert.equal(s.zone.ttl, 300);
  const r2 = R(s, 'R2');
  assert.equal(r2.answer.ttl, 3600);
  assert.equal(r2.answer.addr, OLD);
  assert.equal(r2.answer.ttlLeft, 600);
});

test('rule 2: what is fetched after the lowering carries the new TTL', () => {
  // lowered-too-late: R3 fetched at −5, after the lowering at −10: 300 s, so it switches at 0
  const s = atMin(PRESETS['lowered-too-late'], 0);
  assert.equal(R(s, 'R3').answer.addr, NEW);
  assert.equal(R(s, 'R3').refetches, 2);
  assert.deepEqual(R(s, 'R3').history.slice(-2).map((e) => [e.fetchedAt / MIN, e.ttl, e.addr]), [[-5, 300, OLD], [0, 300, NEW]]);
});

// ── rule 3: no recall ──

test('rule 3: the zone has changed, the cache has not: R3 answers old until its entry runs out', () => {
  const s = atMin({}, 50);
  assert.equal(s.zone.records[logic.NAME], NEW);
  const r3 = R(s, 'R3');
  assert.equal(r3.answer.addr, OLD);
  assert.equal(r3.answer.ttlLeft, 300);
  assert.equal(logic.oldUntil(r3, s.t), 55 * MIN);
  assert.equal(logic.oldUntil(R(s, 'R1'), s.t), null);
});

// ── rule 4: negative caching ──

test('rule 4: no such name is cached for min(MINIMUM, SOA TTL)', () => {
  assert.equal(logic.fetch(logic.zone0(P()), P(), logic.NEW_NAME, 0).ttl, 900);
  assert.equal(logic.fetch(logic.zone0(P({ oldTtl: 300 })), P({ oldTtl: 300 }), logic.NEW_NAME, 0).ttl, 300);
  assert.equal(logic.fetch(logic.zone0(P({ oldTtl: 1800 })), P({ oldTtl: 1800 }), logic.NEW_NAME, 0).addr, null);
  // the zone card shows the same number the fetch uses
  for (const oldTtl of [300, 1800, 3600]) {
    const p = P({ oldTtl });
    assert.equal(logic.zone0(p).negTtl, logic.fetch(logic.zone0(p), p, logic.NEW_NAME, 0).ttl);
  }
  // a lowered record TTL does not change the SOA: still 900
  const z = logic.applyEdit(logic.zone0(P()), { kind: 'ttl', ttl: 60 });
  assert.equal(logic.fetch(z, P(), logic.NEW_NAME, 0).ttl, 900);
});

test('rule 4: R1 keeps saying "no such name" after the name exists, until +10 min', () => {
  const o = PRESETS.negative;
  assert.equal(R(atMin(o, -5), 'R1').answer.addr, null);
  assert.equal(R(atMin(o, -5), 'R1').answer.ttlLeft, 900);
  assert.equal(R(atMin(o, 0), 'R1').answer.addr, null);
  assert.equal(R(atMin(o, 5), 'R1').answer.addr, null);
  assert.equal(R(atMin(o, 5), 'R1').answer.ttlLeft, 300);
  assert.equal(R(atMin(o, 10), 'R1').answer.addr, NOVI);
  assert.equal(R(atMin(o, 10), 'R1').source, 'auth');
});

test('rule 4: a resolver that never asked sees the new name at once; before its first question it has nothing', () => {
  const o = PRESETS.negative;
  assert.equal(R(atMin(o, -5), 'R2').answer, null);
  assert.equal(R(atMin(o, 0), 'R3').answer, null);
  assert.equal(R(atMin(o, 5), 'R3').answer.addr, NOVI);
});

// ── rule 5: the remaining TTL ──

test('rule 5: the client gets fetchedAt + ttl − t', () => {
  const s = atMin({}, -60);
  assert.deepEqual(s.resolvers.map((r) => r.answer.ttlLeft), [600, 2400, 3300]);
  assert.deepEqual(s.resolvers.map((r) => r.answer.ttl), [3600, 3600, 3600]);
});

// ── marks ──

test('marks: changed only when the cached value changes; refetches count the asks in the step', () => {
  const late = PRESETS['lowered-too-late'];
  const s = atMin(late, 20);
  assert.equal(R(s, 'R1').refetches, 2);       // 300 s entries, 10 min step
  assert.equal(R(s, 'R1').changed, false);     // new before, new now
  assert.equal(R(s, 'R1').source, 'auth');
  assert.equal(R(atMin(late, 10), 'R1').changed, true);
  assert.equal(R(atMin(late, 10), 'R2').changed, false);
  assert.equal(R(atMin(late, 10), 'R2').source, 'cache');
  // step 0 has no "changed"
  assert.ok(atMin({}, -60).resolvers.every((r) => r.changed === false));
});

test('marks at step 0: "auth" and one refetch only for a fetch at the first moment; no step log of earlier events', () => {
  const naive = atMin({}, -60);
  assert.deepEqual(naive.resolvers.map((r) => [r.source, r.refetches]), [['cache', 0], ['cache', 0], ['cache', 0]]);
  assert.deepEqual(naive.stepLog, []);
  const neg = atMin(PRESETS.negative, -5);
  assert.equal(R(neg, 'R1').source, 'auth');
  assert.equal(R(neg, 'R1').refetches, 1);
  assert.deepEqual(neg.stepLog.map((x) => [x.kind, x.at]), [['fetch', -300]]);
});

test('marks: the step after a fetch reads from the cache; nothing → an answer is a change', () => {
  assert.equal(R(atMin({}, -40), 'R1').source, 'cache');
  assert.equal(R(atMin({}, -40), 'R1').refetches, 0);
  assert.equal(R(atMin(PRESETS.negative, 0), 'R2').changed, true);
});

test('step log: only this step\'s events', () => {
  assert.deepEqual(atMin({}, 10).stepLog.map((x) => [x.kind, x.at / MIN, x.r || x.edit]), [['fetch', 10, 'R1']]);
  assert.deepEqual(atMin({}, 20).stepLog, []);
  assert.deepEqual(atMin({}, 0).stepLog.map((x) => [x.kind, x.at / MIN, x.r || x.edit]), [['fetch', -5, 'R3'], ['edit', 0, 'addr']]);
});

test('oldUntil: only for the old address, never for a cached NXDOMAIN', () => {
  const r1 = R(atMin(PRESETS.negative, 0), 'R1');
  assert.equal(r1.cache.addr, null);
  assert.equal(logic.oldUntil(r1, 0), null);
});

test('seed: the entries before the first edit carry oldTtl', () => {
  const s = atMin({ oldTtl: 1800 }, -30);
  assert.deepEqual(s.resolvers.map((r) => r.history[0].ttl), [1800, 1800, 1800]);
  assert.deepEqual(s.resolvers.map((r) => r.answer.ttlLeft), [600, 600, 1500]);
});

test('window cap: the resolvers still saw the lowering before the window', () => {
  // lowered at −120, window from −90: R1 already holds a 300 s entry; R2 (fetched −140) and R3 (−125) still 3600 s
  const s = atMin({ lower: true, lowerAt: -120, stepMin: 5 }, -90);
  assert.deepEqual(s.resolvers.map((r) => [r.answer.fetchedAt / MIN, r.answer.ttl]), [[-90, 300], [-140, 3600], [-125, 3600]]);
});

test('window: "in time" means at least one full old TTL before the change', () => {
  assert.deepEqual(logic.windowOf(P({ lower: true, lowerAt: -60 })), { from: -60 * MIN, steps: 8 });
  assert.deepEqual(logic.windowOf(P({ lower: true, lowerAt: -50 })), { from: -50 * MIN, steps: 11 });
  assert.deepEqual(logic.windowOf(P({ scenario: 'newname', oldTtl: 300 })), { from: -5 * MIN, steps: 2 });
  assert.deepEqual(logic.windowOf(P({ scenario: 'newname', oldTtl: 300, stepMin: 5 })), { from: -5 * MIN, steps: 2 });
});

// ── the presets' numbers (SPEC.md) ──

function lastState(over) { const p = P(over); return kit.stateAt(logic, p, logic.steps(p)); }

test('presets: steps and windows', () => {
  const got = Object.fromEntries(Object.entries(PRESETS).map(([k, o]) => {
    const w = logic.windowOf(P(o));
    return [k, [w.from / MIN, w.steps]];
  }));
  assert.deepEqual(got, { 'book-naive': [-60, 12], 'book-lowered': [-70, 16], 'lowered-too-late': [-20, 8], negative: [-5, 4] });
});

test('presets: when each resolver switches', () => {
  const sw = (o) => lastState(o).resolvers.map((r) => logic.switchedAt(r) / MIN);
  assert.deepEqual(sw(PRESETS['book-naive']), [10, 40, 55]);
  assert.deepEqual(sw(PRESETS['book-lowered']), [0, 0, 0]);
  assert.deepEqual(sw(PRESETS['lowered-too-late']), [10, 40, 0]);
  assert.deepEqual(sw(PRESETS.negative), [10, 0, 5]);
  // the same offices with a 30 min TTL (the hand model's numbers)
  assert.deepEqual(sw({ oldTtl: 1800 }), [10, 10, 25]);
});

test('book-naive at +40: R2\'s record fetched at −20 expired, it asked, now new (the task\'s caption)', () => {
  const r2 = R(atMin({}, 40), 'R2');
  assert.equal(r2.answer.addr, NEW);
  assert.equal(r2.changed, true);
  assert.deepEqual(r2.history.slice(-2).map((e) => [e.fetchedAt / MIN, e.ttl]), [[-20, 3600], [40, 3600]]);
});

test('book-lowered: the 3600 s entries are refetched with 300 s at −50, −20 and −65', () => {
  const s = lastState(PRESETS['book-lowered']);
  const firstShort = (r) => r.history.find((e) => e.ttl === 300).fetchedAt / MIN;
  assert.deepEqual(s.resolvers.map(firstShort), [-50, -20, -65]);
  assert.deepEqual(s.resolvers.map((r) => r.history[0].fetchedAt / MIN), [-110, -80, -125]);
});

test('window: never more than 20 steps; a far lowering moves the start later', () => {
  const p = P({ lower: true, lowerAt: -120, stepMin: 5 });
  assert.deepEqual(logic.windowOf(p), { from: -90 * MIN, steps: 20 });
  for (const sc of ['move', 'newname']) for (const oldTtl of [300, 1800, 3600]) for (const lower of [false, true])
    for (const lowerAt of [-120, -70, -10, 0]) for (const newTtl of [60, 300]) for (const stepMin of [5, 10]) {
      const n = logic.steps(P({ scenario: sc, oldTtl, lower, lowerAt, newTtl, stepMin }));
      assert.ok(n >= 1 && n <= 20, `${n} steps`);
    }
});

test('the copied serve() still answers like dns-resolution\'s', () => {
  const zs = { z: { cuts: {}, records: { 'a.z': { A: ['1.2.3.4'] } }, soa: { ttl: 3600, minimum: 900 }, ttlA: 60 } };
  assert.deepEqual(logic.serve(zs, 'z', 'a.z', 'A'), { kind: 'answer', aa: true, rr: { name: 'a.z', type: 'A', data: ['1.2.3.4'], ttl: 60 } });
  const nx = logic.serve(zs, 'z', 'b.z', 'A');
  assert.equal(nx.kind, 'nxdomain');
  assert.equal(nx.ttl, 900);
  zs.z.soa.ttl = 300;
  assert.equal(logic.serve(zs, 'z', 'b.z', 'A').ttl, 300);
});

// ── generic checks every sim keeps ──

const SWEEP = [{}, ...Object.values(PRESETS), { oldTtl: 300, lower: true, lowerAt: 0, newTtl: 60, stepMin: 5 }, { scenario: 'newname', oldTtl: 300, stepMin: 10 }];

test('state is JSON-safe at every step', () => {
  for (const o of SWEEP) {
    const p = P(o);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of SWEEP) {
    const p = P(o);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P(PRESETS['lowered-too-late']);
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, and matches the tests\' presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const sim = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults), 'sim.json steps matches the model');
  const found = [...html.matchAll(/id: '([\w-]+)',[^\n]*?params: (\{[^}]*\})/g)];
  assert.equal(found.length, Object.keys(PRESETS).length, 'found every preset');
  for (const [, id, obj] of found) {
    const params = Function('return ' + obj)();
    for (const k of Object.keys(params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.deepEqual(P(params), P(PRESETS[id]), `preset ${id}`);
  }
});
