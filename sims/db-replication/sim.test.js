// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for db-replication's model: tie-breaks first, then one test per rule (SPEC.md), then the presets' numbers,
// then the template's generic block.
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
/** The step index of an event (fail, promote, …) in a run. */
const stepOf = (p, ev) => {
  for (let n = 0; n <= steps(p); n++) if (at(p, n).phase === ev) return n;
  return -1;
};
const applied = (s) => Object.fromEntries(s.ids.map((id) => [id, s.servers[id].applied]));

// ── tie-breaks ──

test('T1: equal applied LSN → the preferred replica, then the lower id', () => {
  assert.equal(logic.pickPromoted([{ id: 'R2', applied: 7 }, { id: 'R1', applied: 7 }], 'none'), 'R1');
  assert.equal(logic.pickPromoted([{ id: 'R1', applied: 7 }, { id: 'R2', applied: 7 }], 'R2'), 'R2');
  assert.equal(logic.pickPromoted([{ id: 'R2', applied: 7 }, { id: 'R1', applied: 7 }], 'R1'), 'R1');
  assert.equal(logic.pickPromoted([], 'none'), null);
  // in a run: both lag 250 → both at LSN 7 when the primary fails at 1000 ms
  const tie = P({ replicas: 2, lag2: 250, failAt: 1000 });
  assert.equal(end(tie).promoted, 'R1');
  assert.equal(end(P({ replicas: 2, lag2: 250, failAt: 1000, prefer: 'R2' })).promoted, 'R2');
});

test('T1: priority only breaks ties; the highest LSN wins over it', () => {
  assert.equal(logic.pickPromoted([{ id: 'R1', applied: 4 }, { id: 'R2', applied: 7 }], 'R1'), 'R2');
  const s = end(P({ replicas: 2, lag1: 600, lag2: 250, failAt: 1000, prefer: 'R1' }));
  assert.equal(s.promoted, 'R2');
  assert.deepEqual(s.lost, [8, 9, 10]);
});

test('T2: within a tick the write comes first, then the replicas apply, then the read', () => {
  // lag 0: record 5 written at 500 is applied at 500; record k applies in its own tick
  const s0 = at(P({ lag1: 0 }), 3);
  assert.deepEqual(applied(s0), { P: 3, R1: 3 });
  // read at 600 after writes 1–5: with lag 100, record 5 (500 + 100 ≤ 600) is applied before the read is served
  const s = at(P({ read: true, lag1: 100 }), 6);
  assert.equal(s.reads[0].got, 5);
  assert.equal(s.reads[0].fresh, true);
  // lag 150: 650 > 600, the read is stale with record 4
  assert.equal(at(P({ read: true, lag1: 150 }), 6).reads[0].got, 4);
});

test('T3: records in flight when the primary fails never arrive', () => {
  const p = P({ failAt: 1000 });
  const f = stepOf(p, 'fail');
  assert.equal(at(p, f).servers.R1.applied, 7);
  assert.equal(at(p, f).servers.P.up, false);
  assert.equal(end(p).servers.R1.applied, 7);
  assert.equal(end(p).t, 1000, 'failover steps take no clock time');
});

test('T4: a replica never goes back while it follows', () => {
  for (const p of [P({}), P({ replicas: 2, lag1: 1000, lag2: 50 }), P({ read: true, lag1: 1000, rywWait: true })]) {
    let last = { R1: 0, R2: 0 };
    for (let n = 0; n <= steps(p); n++) {
      const s = at(p, n);
      for (const id of s.ids.filter((x) => x !== 'P')) {
        assert.ok(s.servers[id].applied >= (last[id] || 0), `${id} at step ${n}`);
        last[id] = s.servers[id].applied;
      }
    }
  }
});

// ── rules ──

test('rule 1: the primary acknowledges at once; a replica applies in LSN order at at + lag', () => {
  const p = P({ lag1: 250 });
  for (let n = 1; n <= 10; n++) {
    const s = at(p, n);
    assert.equal(s.servers.P.applied, n);
    assert.equal(s.writes[n - 1].acked, true);
    assert.equal(s.writes[n - 1].at, n * 100);
    // record k applied once k × 100 + 250 ≤ t
    assert.equal(s.servers.R1.applied, Math.max(0, Math.floor((n * 100 - 250) / 100)));
  }
  assert.equal(logic.appliedAt([{ at: 100 }, { at: 200 }, { at: 300 }], 250, 450), 2);
  assert.equal(logic.appliedAt([{ at: 100 }, { at: 200 }], 0, 200), 2);
  // more than one record can arrive in one tick when it catches up (here: none in flight is skipped)
  assert.deepEqual(at(p, 4).changed.applied.R1, [1]);
});

test('rule 2: a replica holds the primary\'s value at its applied LSN', () => {
  const ws = [1, 2, 3].map((k) => ({ lsn: k, at: k * 100, value: k }));
  assert.equal(logic.valueAt(ws, 0), 0);
  assert.equal(logic.valueAt(ws, 2), 2);
  const s = at(P({ read: true }), 6);
  assert.equal(s.reads[0].from, 'R1');
  assert.equal(s.reads[0].got, 3);
  assert.equal(s.reads[0].gotLsn, 3);
  assert.equal(s.reads[0].fresh, false);
});

test('rule 3: read-your-writes from the primary, or by waiting for the own LSN', () => {
  const prim = at(P({ read: true, readFrom: 'primary' }), 6).reads[0];
  assert.deepEqual([prim.from, prim.got, prim.fresh, prim.servedAt], ['P', 5, true, 600]);
  const p = P({ read: true, rywWait: true });
  assert.equal(at(p, 6).reads[0].servedAt, null, 'held at 600');
  assert.equal(at(p, 7).reads[0].servedAt, null, 'still held at 700');
  const r = at(p, 8).reads[0];
  assert.deepEqual([r.got, r.fresh, r.servedAt, r.wait], [5, true, 750, 5]);
  assert.equal(at(p, 8).changed.served, true);
  // waiting is ignored when reading from the primary
  assert.equal(at(P({ read: true, readFrom: 'primary', rywWait: true }), 6).reads[0].wait, null);
  // a waiting read is answered when its record is applied, never before it was asked
  const fast = at(P({ read: true, rywWait: true, lag1: 50 }), 6).reads[0];
  assert.deepEqual([fast.got, fast.servedAt], [5, 600]);
});

test('rule 3: no writes after the read; the run lasts until the replica has the own write', () => {
  const p = P({ read: true });
  assert.equal(end(p).writes.length, 5);
  assert.equal(steps(p), 8);
  assert.equal(steps(P({ read: true, lag1: 1000 })), 15);
  assert.equal(steps(P({ read: true, lag1: 1000, readFrom: 'primary' })), 8);
  const late = end(P({ read: true, lag1: 1000, rywWait: true })).reads[0];
  assert.deepEqual([late.got, late.servedAt], [5, 1500]);
});

test('rule 4: failover promotes the replica with the highest applied LSN', () => {
  const s = end(P({ replicas: 2, failAt: 1000 }));
  assert.equal(s.promoted, 'R1');
  assert.equal(s.primary, 'R1');
  assert.equal(s.servers.R1.role, 'primary');
  const t = end(P({ replicas: 2, lag1: 900, lag2: 300, failAt: 1000 }));
  assert.equal(t.promoted, 'R2');
});

test('rule 5: acknowledged records above the promoted LSN are lost', () => {
  assert.deepEqual(logic.lostTail(10, 7), [8, 9, 10]);
  assert.deepEqual(logic.lostTail(10, 10), []);
  const s = end(P({ failAt: 1000 }));
  assert.deepEqual(s.lost, [8, 9, 10]);
  assert.deepEqual(s.writes.filter((w) => w.lost).map((w) => w.lsn), [8, 9, 10]);
  assert.ok(s.writes.filter((w) => w.lost).every((w) => w.acked), 'the client was told "committed"');
  assert.deepEqual(end(P({ failAt: 600 })).lost, [4, 5, 6]);
  assert.deepEqual(end(P({ failAt: 1000, lag1: 0 })).lost, []);
  assert.equal(at(P({ failAt: 1000 }), stepOf(P({ failAt: 1000 }), 'fail')).lost.length, 0, 'lost only at the promotion');
});

test('rule 6: the other replica follows the new primary; one ahead is rewound, not re-attached', () => {
  const p = P({ replicas: 2, failAt: 1000 });
  const s = end(p);
  assert.equal(s.phase, 'follow');
  assert.equal(s.servers.R2.follows, 'R1');
  assert.equal(s.servers.R2.applied, 7);
  assert.deepEqual(s.changed.received.R2, [5, 6, 7]);
  assert.deepEqual(logic.followPlan(4, 7), { action: 'catchup', receive: [5, 6, 7], discard: [] });
  assert.deepEqual(logic.followPlan(7, 7), { action: 'catchup', receive: [], discard: [] });
  assert.deepEqual(logic.followPlan(9, 7), { action: 'rewind', receive: [], discard: [8, 9] });
});

test('rule 7: the returning old primary is refused, then rebuilt from the new primary', () => {
  const p = P({ failAt: 1000, oldBack: true });
  const r = at(p, stepOf(p, 'return'));
  assert.equal(r.servers.P.up, true);
  assert.equal(r.servers.P.role, 'returned');
  assert.equal(r.servers.P.applied, 10);
  assert.deepEqual(r.servers.P.extra, [8, 9, 10]);
  assert.equal(r.refused, true);
  const b = end(p);
  assert.equal(b.phase, 'rebuild');
  assert.deepEqual(b.servers.P.discarded, [8, 9, 10]);
  assert.equal(b.servers.P.applied, 7);
  assert.equal(b.servers.P.role, 'replica');
  assert.equal(b.servers.P.follows, 'R1');
  // nothing extra (lag 0): not refused, it simply attaches
  const z = P({ failAt: 1000, oldBack: true, lag1: 0 });
  assert.equal(at(z, stepOf(z, 'return')).refused, false);
  assert.deepEqual(end(z).servers.P.discarded, []);
});

test('rule 3: the read run rounds up, so the waiting read is always answered on screen', () => {
  for (const lag1 of [0, 50, 250, 350, 650, 950, 1000]) {
    const p = P({ read: true, rywWait: true, lag1 });
    const r = end(p).reads[0];
    assert.notEqual(r.servedAt, null, `lag ${lag1}`);
    assert.equal(r.servedAt, Math.max(600, 500 + lag1), `lag ${lag1}`);
  }
  assert.equal(steps(P({ read: true, lag1: 950 })), 15);
});

test('the failover state the page draws: failure time, roles, changes of each step', () => {
  const p = P({ replicas: 2, failAt: 1000, oldBack: true });
  const fail = at(p, stepOf(p, 'fail'));
  assert.equal(fail.failedAt, 1000);
  assert.deepEqual(fail.changed.roles, ['P']);
  assert.equal(at(p, 10).failedAt, null);
  const pro = at(p, stepOf(p, 'promote'));
  assert.equal(pro.servers.P.role, 'old');
  assert.equal(pro.servers.R1.follows, null);
  assert.deepEqual(pro.changed.roles, ['R1', 'P']);
  const fol = at(p, stepOf(p, 'follow'));
  assert.deepEqual(fol.changed.applied.R2, [5, 6, 7]);
  assert.deepEqual(fol.changed.roles, ['R2']);
  const back = at(p, stepOf(p, 'return'));
  assert.deepEqual(back.changed.roles, ['P']);
  const reb = end(p);
  assert.equal(reb.servers.P.up, true);
  assert.deepEqual(reb.servers.P.extra, []);
  assert.deepEqual(reb.changed.discarded.P, [8, 9, 10]);
  assert.deepEqual(reb.changed.received.P, []);
  assert.deepEqual(reb.changed.roles, ['P']);
  // the read marks: asked at 600, answered later with the wait
  const w = P({ read: true, rywWait: true });
  assert.equal(at(w, 6).changed.asked, true);
  assert.equal(at(w, 6).changed.served, undefined);
  assert.equal(at(w, 7).changed.asked, undefined);
});

test('params: a read scenario has no failure; prefer only with two replicas; lags clamped', () => {
  assert.equal(logic.eff(P({ read: true, failAt: 1000 })).failAt, 0);
  assert.equal(logic.eff(P({ prefer: 'R2' })).prefer, 'none');
  assert.equal(logic.eff(P({ oldBack: true })).oldBack, false);
  assert.equal(logic.eff(P({ failAt: 700 })).failAt, 0);
  assert.deepEqual(logic.eff(P({ lag1: -5, lag2: 5000 })).lags, { R1: 0, R2: 1000 });
  assert.equal(logic.eff(P({ readFrom: 'primary', rywWait: true, read: true })).rywWait, false);
});

// ── sync-async-replication (SPEC.md "Synchronous commit"): tie-breaks first ──

const SYNC = P({ mode: 'sync', rttMs: 1 });
const ackOf = (s, k) => s.writes[k - 1];

test('S5: a confirmation in the failure tick counts: apply, then fail', () => {
  const p = P({ mode: 'sync', rttMs: 1, failAt: 1000 });
  const f = at(p, stepOf(p, 'fail'));
  assert.equal(f.t, 1000);
  assert.equal(ackOf(f, 10).acked, true, 'write 10 (at 1000 ms) is acknowledged before the failure');
  assert.equal(ackOf(f, 10).ackAt, 1001);
  assert.equal(f.servers.R1.applied, 10);
  assert.deepEqual(end(p).lost, []);
  // the same holds at 600 ms and at 40 ms RTT (RTT < one tick)
  const q = P({ mode: 'sync', rttMs: 40, failAt: 600 });
  assert.equal(ackOf(at(q, stepOf(q, 'fail')), 6).ackAt, 640);
  assert.deepEqual(end(q).lost, []);
});

test('S4 order: R1 becomes unreachable after the tick at 500 ms, in a step of its own that takes no time', () => {
  const p = P({ mode: 'sync', replicaDown: 500 });
  const n = stepOf(p, 'replicaDown');
  assert.equal(n, 6);
  const s = at(p, n);
  assert.equal(s.t, 500);
  assert.equal(s.servers.R1.reachable, false);
  assert.equal(s.servers.R1.up, true, 'unreachable from the primary, not failed');
  assert.equal(ackOf(s, 5).acked, true, 'write 5 was confirmed before the cut');
  assert.deepEqual(s.changed.roles, ['R1']);
  assert.deepEqual(logic.planOf(logic.eff(p)), [1, 2, 3, 4, 5, 'replicaDown', 6, 7, 8, 9, 10]);
});

test('S1: synchronous: acknowledged only once R1 has the record, one round trip after the write', () => {
  for (const rttMs of [1, 10, 40]) {
    const p = P({ mode: 'sync', rttMs });
    for (let n = 1; n <= 10; n++) {
      const s = at(p, n);
      assert.equal(s.servers.R1.applied, n, 'R1 has every record in its tick');
      assert.equal(ackOf(s, n).acked, true);
      assert.equal(ackOf(s, n).ackAt, n * 100 + rttMs);
      assert.deepEqual(s.ackLatency[n - 1], { lsn: n, ms: rttMs });
      assert.deepEqual(s.changed.acked, [n]);
    }
  }
  assert.equal(logic.commitLatency('sync', 40), 40);
  assert.equal(logic.commitLatency('async', 40), 0);
  // a client waiting for each commit: 1000 / RTT commits per second
  assert.equal(logic.serialRate(40), 25);
  assert.equal(logic.serialRate(10), 100);
  assert.equal(logic.serialRate(1), 1000);
  assert.equal(logic.serialRate(0), null);
  // synchronous commit is shown with one replica (quorum commit is out of scope)
  assert.deepEqual(end(P({ mode: 'sync', replicas: 2 })).ids, ['P', 'R1']);
});

test('S2: with a synchronous replica every acknowledged commit is on two servers: failover loses nothing', () => {
  for (const failAt of [600, 1000]) for (const rttMs of [1, 10, 40]) {
    const p = P({ mode: 'sync', rttMs, failAt });
    const s = end(p);
    assert.equal(s.promoted, 'R1');
    assert.equal(s.servers.R1.applied, failAt / 100);
    assert.deepEqual(s.lost, [], `fail ${failAt}, RTT ${rttMs}`);
  }
  // the old primary coming back has nothing extra: it attaches
  const b = P({ mode: 'sync', failAt: 1000, oldBack: true });
  assert.equal(at(b, stepOf(b, 'return')).refused, false);
});

test('S3: asynchronous: acknowledged at once (the host\'s rule 1); failover loses the lag', () => {
  // the host's failover-tail is the asynchronous twin of sync-failover
  const s = end(P({ failAt: 1000 }));
  assert.ok(s.writes.every((w) => w.acked));
  assert.deepEqual(s.lost, [8, 9, 10]);
  assert.deepEqual(end(P({ mode: 'async', rttMs: 40, failAt: 1000 })).lost, [8, 9, 10], 'RTT does nothing asynchronously');
  assert.equal(steps(P({ replicaDown: 500 })), 10, 'R1 unreachable only with a synchronous R1');
  // the same failure with a synchronous R1 at RTT 1: nothing lost (S2), each commit 1 ms later
  const sy = end(P({ mode: 'sync', failAt: 1000 }));
  assert.deepEqual([sy.lost, sy.writes[7].ackAt - sy.writes[7].at], [[], 1]);
});

test('S4 block: with the only synchronous replica unreachable, commits wait and nothing is acknowledged', () => {
  const p = P({ mode: 'sync', replicaDown: 500, onSyncLost: 'block' });
  const s = end(p);
  assert.deepEqual(s.blocked, [6, 7, 8, 9, 10]);
  assert.deepEqual(s.writes.filter((w) => w.acked).map((w) => w.lsn), [1, 2, 3, 4, 5]);
  assert.equal(s.servers.P.applied, 10, 'the primary has them in its own log');
  assert.equal(s.servers.R1.applied, 5);
  assert.equal(s.degraded, false);
  assert.deepEqual(at(p, stepOf(p, 'replicaDown') + 1).changed.blocked, [6]);
  assert.deepEqual(at(p, stepOf(p, 'replicaDown') + 1).changed.acked, []);
  // a failure now: R1 promoted with 5; 6–10 were never acknowledged, so they are not lost acknowledged data
  const f = end(P({ mode: 'sync', replicaDown: 500, failAt: 1000 }));
  assert.equal(f.promoted, 'R1');
  assert.deepEqual(f.lost, []);
  assert.ok(f.writes.every((w) => !w.lost));
});

test('S4 degrade: the primary switches to asynchronous and keeps going; a failure loses 6–10', () => {
  const p = P({ mode: 'sync', replicaDown: 500, onSyncLost: 'degrade' });
  const d = at(p, stepOf(p, 'replicaDown'));
  assert.equal(d.degraded, true);
  const s = end(p);
  assert.deepEqual(s.blocked, []);
  assert.deepEqual(s.writes.map((w) => w.acked), Array(10).fill(true));
  assert.deepEqual(s.ackLatency.map((a) => a.ms), [1, 1, 1, 1, 1, 0, 0, 0, 0, 0]);
  assert.equal(s.servers.R1.applied, 5, 'no replica has 6–10');
  const f = end(P({ mode: 'sync', replicaDown: 500, onSyncLost: 'degrade', failAt: 1000 }));
  assert.equal(f.promoted, 'R1');
  assert.deepEqual(f.lost, [6, 7, 8, 9, 10]);
  // with block it never degrades
  assert.equal(end(P({ mode: 'sync', replicaDown: 500, onSyncLost: 'block' })).degraded, false);
});

test('sync params: not with the read scenario; RTT 1/10/40; replicaDown only at 500', () => {
  const e = logic.eff(P({ read: true, mode: 'sync', replicaDown: 500 }));
  assert.deepEqual([e.mode, e.r1DownAt], ['async', 0]);
  assert.equal(logic.eff(P({ mode: 'sync', rttMs: 25 })).rttMs, 1);
  assert.equal(logic.eff(P({ mode: 'sync', rttMs: '40' })).rttMs, 40);
  assert.equal(logic.eff(P({ mode: 'sync', replicaDown: 300 })).r1DownAt, 0);
  assert.equal(logic.eff(P({ mode: 'sync', replicaDown: 500 })).r1DownAt, 500);
  assert.equal(logic.eff(P({ replicaDown: 500 })).r1DownAt, 0, 'asynchronous: ignored');
  assert.equal(logic.eff(P({ mode: 'sync', replicas: 2 })).replicas, 1);
  assert.equal(logic.eff(P({ onSyncLost: 'x' })).onSyncLost, 'block');
  assert.equal(logic.extOf(logic.eff(P({}))), false);
});

test('the host\'s states carry no field of the sync params', () => {
  for (const p of [P({}), P({ read: true, rywWait: true }), P({ replicas: 2, failAt: 1000, oldBack: true })]) {
    for (let n = 0; n <= steps(p); n++) {
      const s = at(p, n);
      for (const k of ['mode', 'rttMs', 'ackLatency', 'blocked', 'degraded', 'onSyncLost']) assert.ok(!(k in s), `${k} at ${n}`);
      for (const id of s.ids) assert.ok(!('mode' in s.servers[id]) && !('reachable' in s.servers[id]));
      for (const w of s.writes) assert.ok(!('ackAt' in w));
      assert.ok(!('acked' in s.changed));
    }
  }
});

// ── presets (SPEC.md table) ──

const PRESETS = {
  'steady-lag': P({}),
  'read-own-write': P({ read: true }),
  'failover-tail': P({ failAt: 1000 }),
  'two-replicas': P({ replicas: 2, failAt: 1000 }),
  'old-primary-returns': P({ failAt: 1000, oldBack: true }),
  'sync-failover': P({ mode: 'sync', rttMs: 1, failAt: 1000 }),
  'sync-over-wan': P({ mode: 'sync', rttMs: 40 }),
  'sync-replica-down': P({ mode: 'sync', rttMs: 1, replicaDown: 500, onSyncLost: 'block' }),
  'degrade-silently': P({ mode: 'sync', rttMs: 1, replicaDown: 500, onSyncLost: 'degrade', failAt: 1000 })
};

test('presets: the numbers in SPEC.md', () => {
  const want = { 'steady-lag': 10, 'read-own-write': 8, 'failover-tail': 12, 'two-replicas': 13, 'old-primary-returns': 14 };
  for (const id of Object.keys(want)) assert.equal(steps(PRESETS[id]), want[id], id);
  assert.deepEqual(applied(end(PRESETS['steady-lag'])), { P: 10, R1: 7 });
  const rd = end(PRESETS['read-own-write']);
  assert.deepEqual([rd.reads[0].at, rd.reads[0].got, rd.reads[0].fresh], [600, 3, false]);
  assert.equal(end(PRESETS['failover-tail']).promoted, 'R1');
  assert.deepEqual(end(PRESETS['failover-tail']).lost, [8, 9, 10]);
  const two = PRESETS['two-replicas'];
  assert.deepEqual(applied(at(two, stepOf(two, 'promote'))), { P: 10, R1: 7, R2: 4 });
  assert.deepEqual(end(two).changed.received.R2, [5, 6, 7]);
  assert.deepEqual(end(PRESETS['old-primary-returns']).servers.P.discarded, [8, 9, 10]);
});

test('sync presets: the numbers in SPEC.md', () => {
  const want = { 'sync-failover': 12, 'sync-over-wan': 10, 'sync-replica-down': 11, 'degrade-silently': 13 };
  for (const id of Object.keys(want)) assert.equal(steps(PRESETS[id]), want[id], id);
  const sf = end(PRESETS['sync-failover']);
  assert.deepEqual([sf.servers.R1.applied, sf.lost.length], [10, 0]);
  assert.ok(sf.ackLatency.every((a) => a.ms === 1), 'each commit ≈ 1 ms longer');
  const wan = end(PRESETS['sync-over-wan']);
  assert.ok(wan.ackLatency.every((a) => a.ms >= 40));
  assert.equal(logic.serialRate(logic.commitLatency(wan.mode, wan.rttMs)), 25);
  const down = end(PRESETS['sync-replica-down']);
  assert.deepEqual(down.blocked, [6, 7, 8, 9, 10]);
  assert.equal(down.writes.filter((w) => w.acked).length, 5);
  assert.deepEqual(end(PRESETS['degrade-silently']).lost, [6, 7, 8, 9, 10]);
});

test('page: the sync presets set every sync param, and the entry in sim.json is a page preset', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  const ids = [...html.matchAll(/\{ id: '([a-z-]+)', label:/g)].map((m) => m[1]);
  for (const e of meta.entries || []) assert.ok(ids.includes(e.preset), e.preset);
});

test('the page lists exactly these presets, in this order', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const ids = [...html.matchAll(/\{ id: '([a-z-]+)', label:/g)].map((m) => m[1]);
  assert.deepEqual(ids, Object.keys(PRESETS));
});

test('no combination of params exceeds 20 steps; the most is 15', () => {
  let max = 0;
  for (const replicas of [1, 2]) for (const lag1 of [0, 250, 1000]) for (const read of [false, true])
    for (const readFrom of ['primary', 'replica']) for (const failAt of [0, 600, 1000]) for (const oldBack of [false, true]) {
      max = Math.max(max, steps(P({ replicas, lag1, read, readFrom, failAt, oldBack, rywWait: true })));
    }
  assert.equal(max, 15);
  // with the sync params (one replica, R1 unreachable): 10 ticks + 1 + fail, promote, return, rebuild
  let maxSync = 0;
  for (const replicas of [1, 2]) for (const mode of ['async', 'sync']) for (const replicaDown of [0, 500])
    for (const failAt of [0, 600, 1000]) for (const oldBack of [false, true]) for (const onSyncLost of ['block', 'degrade']) {
      maxSync = Math.max(maxSync, steps(P({ replicas, mode, replicaDown, failAt, oldBack, onSyncLost })));
    }
  assert.equal(maxSync, 15);
});

// ── generic checks every sim keeps ──

const SAMPLES = [P({}), P({ read: true, rywWait: true }), P({ replicas: 2, failAt: 600, oldBack: true }), P({ replicas: 2, lag1: 1000, lag2: 0, failAt: 1000, oldBack: true }),
  P({ mode: 'sync', rttMs: 40, failAt: 600, oldBack: true }), P({ mode: 'sync', replicaDown: 500, onSyncLost: 'degrade', failAt: 1000, oldBack: true }),
  P({ mode: 'sync', replicaDown: 500, failAt: 1000 })];

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
