// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for rpo-rto's model (rules in SPEC.md). Run: node --test sims/rpo-rto/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const C = (over) => logic.compute(P(over));
const H = 60, D = logic.DAY;
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const byT = (s, t) => s.points.find((x) => x.t === t);

// ── tie-breaks first ──

test('rule 6 tie: actual equal to the target counts as met', () => {
  // Thu 14:05 − Thu 01:40 = 745 min; RTO 30 + 60 + 240 + 60 = 390 min.
  const s = C({ rpoH: 745 / H, rtoH: 390 / H });
  assert.equal(s.lossM, 745);
  assert.equal(s.rpoMet, true);
  assert.equal(s.rtoMet, true);
  const over = C({ rpoH: 12, rtoH: 6 });
  assert.equal(over.rpoMet, false);
  assert.equal(over.rtoMet, false);
});

test('unfinished tie: a copy complete exactly when the system stops is good, one minute later it is unfinished', () => {
  // The Thursday copy starts 01:40 (4420) and takes 12 min: done 01:52 (4432).
  const at = C({ incidentAt: 3 * D + 112 });
  assert.equal(byT(at, 3 * D + 100).state, 'good');
  assert.equal(at.lastGood, 3 * D + 100);
  const late = C({ incidentAt: 3 * D + 111 });
  assert.equal(byT(late, 3 * D + 100).state, 'unfinished');
  assert.equal(late.lastGood, 2 * D + 100);
  assert.equal(late.lossM, D + 11);
});

test('rule 4 tie: a run starting exactly at the real start holds clean data (good); one minute after, damaged', () => {
  // Damage starts Thu 01:40 exactly; incident Thu 14:05.
  const s = C({ damageBefore: 745 });
  assert.equal(s.damageStart, 3 * D + 100);
  assert.equal(byT(s, 3 * D + 100).state, 'good');
  const later = C({ damageBefore: 746 });
  assert.equal(byT(later, 3 * D + 100).state, 'damaged');
  assert.equal(later.lastGood, 2 * D + 100);
});

test('unfinished only when the system stops: under damage a copy started before the damage completes and is good', () => {
  // 01:40 copy taking 60 min, damage at 02:10 (still running then).
  const dmg = C({ kind: 'damage', incidentAt: 3 * D + 130, jobMin: 60 });
  assert.equal(byT(dmg, 3 * D + 100).state, 'good');
  assert.equal(dmg.lossM, 30);
  const loss = C({ kind: 'loss', incidentAt: 3 * D + 130, jobMin: 60 });
  assert.equal(byT(loss, 3 * D + 100).state, 'unfinished');
  // A copy that finished before the incident, with damage begun after its start, is good (data as at its start).
  const early = C({ incidentAt: 3 * D + 115, damageBefore: 10 });
  assert.equal(byT(early, 3 * D + 100).state, 'good');
  // A run starting at the moment of an outage never completes: unfinished, not damaged.
  const atI = C({ incidentAt: 3 * D + 100 });
  assert.equal(byT(atI, 3 * D + 100).state, 'unfinished');
  assert.equal(byT(atI, 3 * D + 100).after, false);
});

test('a run starting exactly at the incident counts as before it (failedRuns, and good with jobMin 0)', () => {
  const s = C({ incidentAt: 3 * D + 100, jobMin: 0 });
  assert.equal(s.lastGood, 3 * D + 100);
  assert.equal(s.lossM, 0);
  const f = C({ incidentAt: 3 * D + 100, jobMin: 0, failedRuns: 1 });
  assert.equal(byT(f, 3 * D + 100).state, 'failed');
  assert.equal(f.lastGood, 2 * D + 100);
});

test('replica ties: good at the incident under loss only without earlier damage; never good under damage', () => {
  const loss = C({ replica: true });
  assert.equal(loss.replica.state, 'good');
  assert.equal(loss.replica.t, loss.incident);
  assert.equal(loss.lastGoodKind, 'replica');
  assert.equal(loss.lossM, 0);
  const corrupt = C({ replica: true, damageBefore: 10 });
  assert.equal(corrupt.replica.state, 'damaged');
  assert.equal(corrupt.lastGoodKind, 'copy');
  const instant = C({ replica: true, kind: 'damage', detect: 0 });
  assert.equal(instant.replica.state, 'damaged');
  assert.equal(instant.replica.t, instant.incident);
  assert.equal(instant.replica.after, false);
  assert.equal(loss.replica.after, false);
  assert.equal(instant.lastGood, 3 * D + 100);
});

test('an incident before the week\'s first run falls back to the Monday before (negative minutes)', () => {
  const s = C({ incidentAt: 60, interval: 7 * D });
  assert.equal(s.lastGood, 100 - 7 * D);
  assert.equal(s.lossM, 7 * D - 40);
  const m = logic.moment(s.lastGood, 20780);
  assert.deepEqual([m.y, m.m, m.d, m.wd, m.h, m.min], [2026, 11, 16, 0, 1, 40]);
});

// ── rules ──

test('rule 1: actual RPO = incident − newest good recovery point', () => {
  const s = C({});
  assert.equal(s.lastGood, 3 * D + 100);
  assert.equal(s.lossM, 745);
  assert.equal(s.lossH, 745 / 60);
  assert.equal(C({ interval: 60 }).lossM, 25);          // 13:40 → 14:05
  assert.equal(C({ interval: 15 }).lossM, 25);          // 13:55 is still running (done 14:07): 13:40 → 14:05
  assert.equal(C({ interval: 15, jobMin: 0 }).lossM, 10); // 13:55 → 14:05
  assert.equal(C({ interval: 7 * D }).lossM, 3 * D + 745); // Monday 01:40
});

test('rule 2: worst case = interval + job, average = interval / 2 + job, and the loss stays in [job, interval + job]', () => {
  const s = C({ interval: 60, jobMin: 12 });
  assert.equal(s.worstM, 72);
  assert.equal(s.avgM, 42);
  const slow = C({ interval: 15, jobMin: 120 });
  assert.equal(slow.worstM, 135);
  assert.equal(slow.avgM, 127.5);
  let sum = 0, n = 0, lo = Infinity, hi = -Infinity;
  for (let t = 2 * D; t < 2 * D + 60; t++) {
    const x = C({ interval: 60, jobMin: 12, incidentAt: t }).lossM;
    sum += x; n++; lo = Math.min(lo, x); hi = Math.max(hi, x);
  }
  assert.equal(lo, 12);
  assert.equal(hi, 71);                // the supremum 72 is not reached on a whole-minute grid
  assert.equal(sum / n, 41.5);         // the grid's mean; the continuous mean is 42
});

test('rule 3: actual RTO = detect + decide + restore + verify from the incident, phases consecutive', () => {
  const s = C({ detect: 100, decide: 30, restore: 600, verify: 90 });
  assert.equal(s.downM, 820);
  assert.equal(s.downH, 820 / 60);
  assert.deepEqual(s.phases.map((x) => x.id), ['detect', 'decide', 'restore', 'verify']);
  assert.equal(s.phases[0].from, s.incident);
  for (let i = 1; i < 4; i++) assert.equal(s.phases[i].from, s.phases[i - 1].to);
  assert.equal(s.back, s.incident + 820);
  // Detection counts from the incident even when the damage began earlier.
  assert.equal(C({ damageBefore: 600, detect: 100 }).phases[0].from, 5165);
});

test('rule 4: copies after the real start carry the damage; the last good one is before it', () => {
  const s = C({ damageBefore: 3 * D });          // damage since Monday 14:05
  assert.equal(s.damageStart, 845);
  ['damaged', 'damaged', 'damaged'].forEach((st, i) => assert.equal(byT(s, (1 + i) * D + 100).state, st));
  assert.equal(s.lastGood, 100);
  assert.equal(s.lossM, 3 * D + 745);
  assert.equal(s.skipped.damaged, 3);
});

test('rule 4: under damage, copies are still taken after the incident until detection ends, all damaged', () => {
  const s = C({ kind: 'damage', interval: 60, detect: 200 });  // 14:05 → 17:25: copies 14:40, 15:40, 16:40
  const after = s.points.filter((x) => x.after);
  assert.deepEqual(after.map((x) => x.t - 3 * D), [880, 940, 1000]);
  assert.ok(after.every((x) => x.state === 'damaged'));
  assert.equal(s.lastGood, 3 * D + 820);
  assert.equal(C({ kind: 'loss', interval: 60, detect: 200 }).points.filter((x) => x.after).length, 0);
  assert.equal(s.skipped.damaged, 3);                       // counted for the caption, though after the incident
  // Failures go on after the incident while the system runs on.
  const f = C({ kind: 'damage', interval: 60, detect: 200, failedRuns: 1 });
  assert.ok(f.points.filter((x) => x.after).every((x) => x.state === 'failed'));
  // Tie: a copy starting exactly when detection ends is still taken (14:05 + 35 min = 14:40).
  const tie = C({ kind: 'damage', interval: 60, detect: 35 });
  assert.equal(tie.points.filter((x) => x.after).length, 1);
});

test('failed runs: the newest n runs at or before the incident fail; the walk back finds the next good one', () => {
  const s = C({ failedRuns: 2 });
  assert.equal(byT(s, 3 * D + 100).state, 'failed');
  assert.equal(byT(s, 2 * D + 100).state, 'failed');
  assert.equal(byT(s, D + 100).state, 'good');
  assert.equal(s.lastGood, D + 100);
  assert.equal(s.skipped.failed, 2);
});

test('rule 5: a replica stops with the system under loss (RPO 0), and copies the damage on under damage', () => {
  const loss = C({ replica: true });
  assert.equal(loss.lossM, 0);
  assert.equal(loss.rpoMet, true);
  const dmg = C({ replica: true, kind: 'damage', detect: 15 });
  assert.equal(dmg.replica.t, dmg.incident + 15);
  assert.equal(dmg.replica.after, true);
  assert.equal(dmg.lastGoodKind, 'copy');
  assert.equal(dmg.lossM, 745);
});

test('rule 7: the walk back returns the last good point and one earlier run, sorted', () => {
  const s = C({ failedRuns: 3 });
  assert.equal(s.points[0].t, 100 - D);                 // the run before the last good one (Monday 01:40)
  assert.equal(s.points[1].t, s.lastGood);
  for (let i = 1; i < s.points.length; i++) assert.ok(s.points[i].t > s.points[i - 1].t);
});

test('captionKey: each branch, in order', () => {
  const key = (over) => logic.captionKey(C(over), P(over));
  assert.equal(key({}), 'both');
  assert.equal(key({ replica: true }), 'replicaGood');
  assert.equal(key({ incidentAt: 3 * D + 111 }), 'unfinished');
  assert.equal(key({ damageBefore: 3 * D }), 'damaged');
  assert.equal(key({ detect: 481 }), 'detect');
  assert.equal(key({ detect: 480, rtoH: 8 }), 'both');         // detection equal to the target: not "alone longer"
  assert.equal(key({ detect: 481, failedRuns: 1 }), 'failed');
  assert.equal(key({ failedRuns: 1, replica: true, kind: 'damage' }), 'replica');
  // Both an unfinished copy (13:55, done 14:07) and a damaged one (13:40, after the damage at 13:35): damaged first.
  const both = { interval: 15, damageBefore: 30 };
  assert.deepEqual([C(both).skipped.unfinished, C(both).skipped.damaged], [1, 1]);
  assert.equal(key(both), 'damaged');
  assert.equal(key({ replica: true, kind: 'damage', interval: 60, detect: 200 }), 'replicaAndCopies');
  assert.equal(key({ replica: true, failedRuns: 2 }), 'replicaGood');
});

test('civil dates, moments and duration parts', () => {
  assert.deepEqual(logic.civil(0), { y: 1970, m: 1, d: 1, wd: 3 });
  assert.deepEqual(logic.civil(20780), { y: 2026, m: 11, d: 23, wd: 0 });
  assert.deepEqual(logic.civil(20709), { y: 2026, m: 9, d: 13, wd: 6 });
  assert.deepEqual(logic.civil(11016), { y: 2000, m: 2, d: 29, wd: 1 });
  const m = logic.moment(5 * D + 1420 + 1950, 20780);   // S12: found Monday 08:10
  assert.deepEqual([m.m, m.d, m.wd, m.h, m.min], [11, 30, 0, 8, 10]);
  assert.deepEqual(logic.parts(745), { d: 0, h: 12, m: 25 });
  assert.deepEqual(logic.parts(1950), { d: 0, h: 32, m: 30 });
  assert.deepEqual(logic.parts(2 * D), { d: 2, h: 0, m: 0 });
  assert.deepEqual(logic.parts(71305), { d: 49, h: 12, m: 25 });
});

// ── presets: the task's expected numbers (SPEC.md table) ──

const when = (p, x) => { const m = logic.moment(x, p.week); return [m.y, m.m, m.d, m.wd, m.h, m.min]; };

test('presets: incident dates and weekdays, and RTO, as in the SPEC table', () => {
  const rows = {
    'nightly-backup': [[2026, 11, 26, 3, 14, 5], 390],
    'failing-backups': [[2026, 11, 1, 6, 14, 5], 390],
    'found-on-monday': [[2026, 11, 28, 5, 23, 40], 2310],
    'ransomware': [[2026, 11, 9, 0, 2, 10], 700],
    'replica-not-backup': [[2026, 12, 2, 2, 16, 40], 390]
  };
  for (const x of logic.presets) {
    const p = P(x.params), s = logic.compute(p);
    assert.deepEqual(when(p, s.incident), rows[x.id][0], x.id);
    assert.equal(s.downM, rows[x.id][1], x.id);
    assert.equal(logic.civil(p.week).wd, 0, x.id + ': week starts on a Monday');
  }
});

test('preset nightly-backup: RPO 12 h 25 min, RTO 6.5 h, both met', () => {
  const s = C(preset('nightly-backup'));
  assert.equal(s.lossM, 12 * H + 25);
  assert.equal(s.downM, 6.5 * H);
  assert.equal(s.rpoMet && s.rtoMet, true);
});

test('preset failing-backups: last good 2026-09-13 01:40, RPO 49 days, RTO met', () => {
  const p = P(preset('failing-backups'));
  const s = logic.compute(p);
  const m = logic.moment(s.lastGood, p.week);
  assert.deepEqual([m.y, m.m, m.d, m.h, m.min], [2026, 9, 13, 1, 40]);
  const inc = logic.moment(s.incident, p.week);
  assert.deepEqual([inc.m, inc.d, inc.h, inc.min], [11, 1, 14, 5]);
  assert.deepEqual(logic.parts(s.lossM), { d: 49, h: 12, m: 25 });
  assert.equal(s.skipped.failed, 49);
  assert.equal(s.rpoMet, false);
  assert.equal(s.rtoMet, true);
  assert.equal(logic.captionKey(s, p), 'failed');
});

test('preset found-on-monday: detection alone 32.5 h, RTO missed before any restore', () => {
  const p = P(preset('found-on-monday'));
  const s = logic.compute(p);
  assert.equal(s.phases[0].to - s.incident, 32.5 * H);
  assert.ok(s.phases[0].to - s.incident > p.rtoH * H);
  assert.equal(s.rtoMet, false);
  assert.equal(s.lossM, 22 * H);
  assert.equal(logic.captionKey(s, p), 'detect');
});

test('preset ransomware: copies after 02:10 and the replica carry the encryption; the last good copy is 01:40', () => {
  const p = P(preset('ransomware'));
  const s = logic.compute(p);
  assert.equal(s.replica.state, 'damaged');
  assert.deepEqual(s.points.filter((x) => x.after).map((x) => [x.state, x.t]),
    [160, 220, 280, 340, 400, 460].map((t) => ['damaged', t]));   // 02:40 … 07:40
  const m = logic.moment(s.lastGood, p.week);
  assert.deepEqual([m.m, m.d, m.h, m.min], [11, 9, 1, 40]);
  assert.equal(s.lossM, 30);
  assert.equal(s.phases[0].to - s.incident, 340);             // 02:10 → 07:50
  assert.equal(logic.captionKey(s, p), 'replicaAndCopies');
});

test('preset replica-not-backup: replication is no recovery point for a deletion; RPO 0 for a loss', () => {
  const p = P(preset('replica-not-backup'));
  const s = logic.compute(p);
  assert.equal(s.replica.state, 'damaged');
  assert.equal(s.lastGoodKind, 'copy');
  assert.equal(s.lossM, 15 * H);
  const loss = logic.compute(P(Object.assign({}, preset('replica-not-backup'), { kind: 'loss' })));
  assert.equal(loss.lossM, 0);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe and deterministic for every preset', () => {
  for (const x of logic.presets) {
    const s = C(x.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    assert.deepEqual(C(x.params), s);
  }
});

test('compute does not mutate its params', () => {
  const p = P(preset('ransomware'));
  const copy = structuredClone(p);
  logic.compute(p);
  assert.deepEqual(p, copy);
});

test('every param combination at the ends of the ranges gives a valid state', () => {
  for (const interval of [15, 60, D, 7 * D]) for (const kind of ['loss', 'damage']) for (const replica of [false, true])
    for (const jobMin of [0, 120]) for (const damageBefore of [0, 72 * H]) for (const failedRuns of [0, 60]) {
      const s = C({ interval, kind, replica, jobMin, damageBefore, failedRuns, detect: 48 * H });
      assert.ok(s.lossM >= 0 && Number.isInteger(s.lossM));
      assert.ok(s.points.some((x) => x.state === 'good' && x.t === s.lastGood) || s.lastGoodKind === 'replica');
    }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the model is listed in the page and in sim.json entries, with model params only', () => {
  const fs = require('node:fs'), path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.deepEqual(json.entries.map((e) => e.preset), logic.presets.map((x) => x.id));
  for (const x of logic.presets) for (const k of Object.keys(x.params)) assert.ok(k in logic.defaults, `${x.id}: ${k}`);
});
