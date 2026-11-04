// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-dhcp-failover's model (rules and tie-breaks: SPEC.md). Run: node --test sims/win-dhcp-failover/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const H = 3600, MIN = 60, DAY = 86400;
const P = (over) => Object.assign({}, logic.defaults, over);
const steps = (over) => logic.steps(P(over));
const end = (over) => { const p = P(over); return kit.stateAt(logic, p, logic.steps(p)); };
const at = (over, n) => kit.stateAt(logic, P(over), n);
/** The event of step n. */
const ev = (over, n) => at(over, n).msgs[n - 1];
const items = (e, k) => e.items.filter((x) => x.k === k);
const state = (e, what) => e.items.filter((x) => x.k === 'state' && x.what === what)[0];
const named = (s, name) => logic.named(s, name);
/** Time never runs backwards: from step to step, and inside the moments folded into a step. */
function monotonic(s, label) {
  let t = 0;
  for (const e of s.msgs) {
    for (const x of (e.folded ? e.folded.times : []).concat([e.t])) { assert.ok(x >= t, label + ' at step ' + e.n); t = x; }
  }
}
const PRESETS = {
  'lb-normal': {},
  'lb-interrupted': { failAt: 2 },
  'lb-partner-down': { failAt: 2, pdAt: 4, newClients: 60 },
  'hs-reserve-runs-out': { mode: 'hotStandby', failAt: 2, newClients: 12 },
  'split-80-20': { mode: 'splitScope', failAt: 1, newClients: 0 }
};

// ── tie-breaks first ──

test('T1: within a moment, state changes come first, then renewals, rebinds, retries, expired leases, arrivals', () => {
  // lb-partner-down step 7 (1:35): the takeover (phase 1) is listed before the retry it makes possible (phase 2)
  const e = ev(PRESETS['lb-partner-down'], 7);
  assert.equal(e.t, H + 35 * MIN);
  assert.deepEqual(e.items.map((x) => x.k === 'state' ? x.what : x.k + (x.why ? ':' + x.why : '')), ['takeover', 'discover:retry']);
  // lb-interrupted step 4 (0:30): renewals of both servers' clients, then the arriving batch
  const e4 = ev(PRESETS['lb-interrupted'], 4);
  assert.deepEqual(e4.items.map((x) => x.k + (x.server ? ':' + x.server : '') + (x.why ? ':' + x.why : '')), ['renew:DHCP1', 'renew:DHCP2', 'discover:arrive']);
  // waiting clients ask before newcomers: hot standby, reserve 2 % (4 addresses), DHCP1 down from 0:00: the first batch
  // takes all four, and at the next arrival the retries are listed (and served) before the newcomers
  const s = end({ mode: 'hotStandby', reserve: 2, failAt: 0, newClients: 3 });
  const arrive = s.msgs.filter((x) => items(x, 'discover').some((d) => d.why === 'arrive' && d.n === 3))[0];
  const kinds = items(arrive, 'discover').map((d) => d.why);
  assert.deepEqual(kinds, ['retry', 'arrive']);
  // renewals before rebinds, retries before expired leases: built by hand on one moment
  const p = P({ failAt: 2, newClients: 0 });
  const s3 = at({ failAt: 2, newClients: 0 }, 3);
  const pc1 = named(s3, 'PC-01'), pc2 = named(s3, 'PC-02'), pc3 = named(s3, 'PC-03'), pc4 = named(s3, 'PC-04');
  pc1.phase = 'renewing'; pc1.granted = 0; pc1.len = 2 * H;          // T2 at 1:45
  pc2.granted = 0; pc2.len = 3.5 * H;                                 // T1 at 1:45
  pc3.phase = 'rebinding'; pc3.expires = 1.75 * H;                    // lease ends at 1:45
  pc4.phase = 'waiting'; pc4.server = null; pc4.octets = [];
  s3.cohorts.forEach((c) => { if (!['PC-01', 'PC-02', 'PC-03', 'PC-04'].includes(c.name)) { c.phase = 'bound'; c.granted = 10 * H; } });
  s3.anchor = 2 * H;
  const m = logic.step(s3, 4, p).msgs[3];
  assert.equal(m.t, 1.75 * H);
  assert.deepEqual(m.items.map((x) => x.k + (x.why ? ':' + x.why : '')), ['renew', 'rebind', 'discover:retry', 'discover:expired']);
});

test('T1: in a batch, named clients come first and each server gives its lowest free address first', () => {
  const s = at({}, 1);
  assert.deepEqual(['PC-01', 'PC-03', 'PC-05'].map((n) => logic.ip(named(s, n).octets[0])), ['10.0.10.10', '10.0.10.11', '10.0.10.12']);
  assert.deepEqual(['PC-02', 'PC-04', 'PC-06'].map((n) => logic.ip(named(s, n).octets[0])), ['10.0.10.110', '10.0.10.111', '10.0.10.112']);
  // with a nearly empty pool the named clients are served before the others: reserve 3 %, DHCP1 down from 0:00
  const s2 = at({ mode: 'hotStandby', reserve: 3, failAt: 0 }, 2);
  assert.equal(s2.pools.B.length, 0);
  assert.ok(logic.NAMED.every((x) => named(s2, x.name).phase === 'bound'), 'all six named clients got one of the 6 reserve addresses');
  assert.equal(logic.bound(s2).waiting, 94);
});

test('T2: binding updates of a moment go before an admin action pressed at that moment', () => {
  // fail pressed at step 1 (the 0:00 DORA): step 2 is still the binding updates, the failure lands at step 3
  const e2 = ev({ failAt: 1 }, 2), e3 = ev({ failAt: 1 }, 3);
  assert.equal(e2.kind, 'bnd');
  assert.ok(state(e3, 'down'));
  // so DHCP2 knows all of DHCP1's leases when it fails
  assert.deepEqual(logic.known(at({ failAt: 1 }, 3), 'DHCP2'), { own: 50, partner: 50 });
});

test('T3: an action lands in the next step, 5 min later or at the next moment if that is sooner', () => {
  const e = ev({ failAt: 2 }, 3);
  assert.equal(e.kind, 'action');
  assert.equal(e.t, 5 * MIN);
  // pressed at 0:52:30 (lb-interrupted step 5), the next moment is 1:00: lands at 0:57:30
  const p = Object.assign({}, PRESETS['lb-interrupted'], { pdAt: 5 });
  assert.equal(ev(p, 6).t, 57.5 * MIN);
  // next moment sooner than 5 min: MCLT 15 min, the new batch at 0:07:30 after a failure pressed at 0:05 + …
  const q = { mclt: 15, failAt: 2 };
  assert.equal(ev(q, 3).t, 5 * MIN);
  const r = { mclt: 15, failAt: 2, pdAt: 3 };
  assert.equal(ev(r, 4).t, 7.5 * MIN, 'capped at the 0:07:30 moment, and the action comes before it');
  assert.ok(state(ev(r, 4), 'pd'));
  assert.equal(ev(r, 5).t, 7.5 * MIN);
  // partner down pressed together with the failure lands one step after it
  const both = { failAt: 2, pdAt: 2 };
  assert.ok(state(ev(both, 3), 'down'));
  assert.ok(state(ev(both, 4), 'pd'));
});

test('T3: partner down needs a failure first; without one it is ignored, and in a split scope always', () => {
  assert.equal(steps({ pdAt: 1 }), steps({}));
  assert.deepEqual(end({ pdAt: 1 }).msgs, end({}).msgs);
  const s = end({ mode: 'splitScope', failAt: 1, pdAt: 2 });
  assert.ok(s.msgs.every((e) => !state(e, 'pd')));
});

test('T4: routine moments fold into the next step; routine moments at the end are dropped', () => {
  // lb-partner-down: 1:00, 1:22:30 and 1:30 are renewals by DHCP2 for 1 h, as before; they fold into 1:35
  const e = ev(PRESETS['lb-partner-down'], 7);
  assert.deepEqual(e.folded.times, [H, H + 22.5 * MIN, 1.5 * H]);
  assert.equal(e.folded.len, H);
  assert.equal(e.folded.retry, 10);
  // lb-interrupted ends at the rebind (0:52:30); its later renewals change nothing and are not steps
  assert.equal(steps(PRESETS['lb-interrupted']), 5);
  assert.equal(end(PRESETS['lb-interrupted']).t, 52.5 * MIN);
  // a renewal that changes the length is not routine (MCLT → 8 d at the first renewal)
  assert.ok(items(ev({}, 3), 'renew').every((x) => !x.routine));
  assert.equal(logic.routine({ items: [{ k: 'renew', routine: true }, { k: 'discover', why: 'retry', served: {} }] }), true);
  assert.equal(logic.routine({ items: [{ k: 'renew', routine: true }, { k: 'discover', why: 'retry', served: { DHCP2: { n: 1 } } }] }), false);
  assert.equal(logic.routine({ items: [{ k: 'state', what: 'pd' }] }), false);
});

test('T5: the horizon is MCLT after the last arrival or action (8 days in a split scope), and never cuts a state change', () => {
  assert.equal(logic.horizon(at({}, 0)), 30 * MIN + H);
  assert.equal(logic.horizon(at({ mode: 'splitScope', newClients: 0 }, 0)), 8 * DAY);
  // MCLT 15 min with the automatic switchover at 1:05: the routine renewals in between fold, PARTNER DOWN and the
  // takeover 15 min later are both reached
  const s = end({ mclt: 15, switchover: 60, failAt: 2 });
  const pd = s.msgs.filter((e) => state(e, 'pd'))[0], tk = s.msgs.filter((e) => state(e, 'takeover'))[0];
  assert.equal(pd.t, 65 * MIN);
  assert.equal(tk.t, 80 * MIN);
  monotonic(s, 'mclt 15 + switchover');
});

test('T6: every combination ends within 20 steps, time never runs backwards', () => {
  let max = 0, count = 0;
  for (const mode of logic.MODES) for (const mclt of logic.MCLTS) for (const switchover of [0, 60])
    for (const newClients of [0, 6, 60]) for (const failAt of [-1, 0, 1, 2, 4]) for (const pdAt of [-1, 2, 5])
      for (const share of [10, 50, 90]) {
        const p = P({ mode, mclt, switchover, newClients, failAt, pdAt, share, reserve: share > 20 ? 5 : 1 });
        const n = logic.steps(p);
        const s = kit.stateAt(logic, p, n);
        assert.ok(n <= logic.MAX_STEPS);
        monotonic(s, JSON.stringify(p));
        max = Math.max(max, n); count++;
      }
  assert.equal(count, 3 * 3 * 2 * 3 * 5 * 3 * 3);
  assert.equal(max, 11);
});

// ── rules ──

test('rule 1: both servers hold every lease after the binding updates; while the partner is unreachable they wait', () => {
  const s1 = at({}, 1);
  assert.deepEqual(logic.known(s1, 'DHCP1'), { own: 50, partner: 0 }, 'before the updates each knows only its own');
  assert.equal(logic.unsent(s1, 'DHCP1'), 50);
  const s2 = at({}, 2);
  assert.deepEqual(logic.known(s2, 'DHCP1'), { own: 50, partner: 50 });
  assert.deepEqual(logic.known(s2, 'DHCP2'), { own: 50, partner: 50 });
  assert.equal(logic.unsent(s2, 'DHCP1') + logic.unsent(s2, 'DHCP2'), 0);
  assert.deepEqual(items(ev({}, 2), 'bnd').map((x) => [x.from, x.to, x.n]), [['DHCP1', 'DHCP2', 50], ['DHCP2', 'DHCP1', 50]]);
  // after the failure DHCP2's updates are not sent, and DHCP1's database stays as it was
  const s = end(PRESETS['lb-interrupted']);
  assert.equal(logic.unsent(s, 'DHCP2'), 106);
  assert.deepEqual(logic.known(s, 'DHCP1'), { own: 50, partner: 50 });
  assert.ok(s.msgs.every((e) => e.kind !== 'bnd' || e.n <= 2));
  // no relationship, no updates: the split scope
  assert.ok(end({ mode: 'splitScope' }).msgs.every((e) => e.kind !== 'bnd'));
});

test('rule 2: load balance answers a DISCOVER by the hash bucket; each server renews its own clients', () => {
  assert.equal(logic.bucketOwner(127, 50), 'DHCP1');
  assert.equal(logic.bucketOwner(128, 50), 'DHCP2');
  assert.equal(logic.bucketOwner(25, 10), 'DHCP1');
  assert.equal(logic.bucketOwner(26, 10), 'DHCP2');
  const d = items(ev({}, 1), 'discover')[0];
  assert.deepEqual([d.served.DHCP1.n, d.served.DHCP2.n], [50, 50]);
  assert.deepEqual(d.served.DHCP1.names, ['PC-01', 'PC-03', 'PC-05']);
  // 90/10: five of the six named clients go to DHCP1
  const d9 = items(ev({ share: 90 }, 1), 'discover')[0];
  assert.deepEqual(d9.served.DHCP2.names, ['PC-06']);
  // the free addresses are split in the same ratio
  assert.deepEqual([at({ share: 30 }, 0).pools.A.length, at({ share: 30 }, 0).pools.B.length], [60, 140]);
  // renewals go to the server that gave the lease
  assert.deepEqual(items(ev({}, 3), 'renew').map((x) => [x.server, x.n]), [['DHCP1', 50], ['DHCP2', 50]]);
});

test('rule 3: hot standby: the active answers everyone; the standby keeps its reserve of the free addresses', () => {
  const s0 = at({ mode: 'hotStandby' }, 0);
  assert.deepEqual([s0.pools.A.length, s0.pools.B.length], [190, 10], '5 % of 200 free');
  assert.deepEqual([s0.pools.B[0], s0.pools.B[9]], [200, 209]);
  assert.deepEqual(at({ mode: 'hotStandby', reserve: 20 }, 0).pools.B.length, 40);
  const d = items(ev({ mode: 'hotStandby' }, 1), 'discover')[0];
  assert.deepEqual(Object.keys(d.served), ['DHCP1']);
  assert.equal(d.served.DHCP1.n, 100);
  // hs-reserve-runs-out: the standby gives its 10 and no more
  const e = ev(PRESETS['hs-reserve-runs-out'], 4);
  const a = items(e, 'discover')[0];
  assert.deepEqual([a.served.DHCP2.n, a.none.n], [10, 2]);
  assert.equal(at(PRESETS['hs-reserve-runs-out'], 4).pools.A.length, 90, "the active's 90 stay untouched");
});

test('rule 4: a new lease lasts MCLT; a renewal in NORMAL of a binding the partner knows gets the full 8 days', () => {
  const d = items(ev({}, 1), 'discover')[0];
  assert.equal(d.served.DHCP1.len, H);
  assert.equal(named(at({}, 1), 'PC-01').expires, H);
  const r = items(ev({}, 3), 'renew');
  assert.ok(r.every((x) => x.len === 8 * DAY));
  assert.equal(named(at({}, 3), 'PC-01').expires, 30 * MIN + 8 * DAY);
  // MCLT 4 h: the first lease is 4 h, T1 at 2 h
  assert.equal(items(ev({ mclt: 240 }, 1), 'discover')[0].served.DHCP1.len, 4 * H);
  assert.equal(ev({ mclt: 240 }, 3).t, 2 * H);
  // not acknowledged yet → MCLT even in NORMAL
  const s = at({}, 1);
  assert.equal(logic.leaseLen(s, 'DHCP1', true, named(s, 'PC-01')), H);
  assert.equal(logic.leaseLen(at({}, 2), 'DHCP1', true, named(at({}, 2), 'PC-01')), 8 * DAY);
});

test('rule 5: COMMUNICATION INTERRUPTED: the survivor renews everyone for MCLT and gives new addresses from its own share', () => {
  const e3 = ev(PRESETS['lb-interrupted'], 3);
  assert.ok(state(e3, 'down') && state(e3, 'commInt'));
  assert.equal(at(PRESETS['lb-interrupted'], 3).servers[1].state, 'commInt');
  const e4 = ev(PRESETS['lb-interrupted'], 4);
  const [lost, own] = items(e4, 'renew');
  assert.deepEqual([lost.server, lost.lost, lost.n], ['DHCP1', true, 50]);
  assert.deepEqual([own.server, own.len], ['DHCP2', H], "DHCP2's own clients: MCLT, not 8 days");
  const a = items(e4, 'discover')[0];
  assert.deepEqual(Object.keys(a.served), ['DHCP2']);
  assert.equal(a.served.DHCP2.n, 6, 'all six, also those whose bucket is DHCP1');
  assert.deepEqual([at(PRESETS['lb-interrupted'], 4).pools.A.length, at(PRESETS['lb-interrupted'], 4).pools.B.length], [50, 44]);
  // the rebind at T2 (0:52:30): DHCP1's 50 are renewed by DHCP2 for MCLT
  const e5 = ev(PRESETS['lb-interrupted'], 5);
  assert.equal(e5.t, 52.5 * MIN);
  const rb = items(e5, 'rebind')[0];
  assert.deepEqual([rb.n, rb.lost, rb.served.DHCP2.n, rb.served.DHCP2.len], [50, ['DHCP1'], 50, H]);
  assert.equal(named(at(PRESETS['lb-interrupted'], 5), 'PC-01').server, 'DHCP2');
  assert.equal(logic.usable(at(PRESETS['lb-interrupted'], 5), 'DHCP2').join(), 'B');
});

test('rule 6: PARTNER DOWN by the admin or after the switchover interval; the whole pool only after MCLT', () => {
  const pd = PRESETS['lb-partner-down'];
  const e5 = ev(pd, 5);
  assert.deepEqual([e5.t, state(e5, 'pd').by, state(e5, 'pd').until], [35 * MIN, 'admin', 95 * MIN]);
  assert.equal(logic.usable(at(pd, 5), 'DHCP2').join(), 'B', 'still only its own share');
  assert.equal(logic.usable(at(pd, 6), 'DHCP2').join(), 'B');
  const s7 = at(pd, 7);
  assert.ok(state(ev(pd, 7), 'takeover'));
  assert.equal(logic.usable(s7, 'DHCP2').join(), 'B,A');
  // automatic: 60 min after COMMUNICATION INTERRUPTED (0:05 → 1:05), then MCLT
  const s = end({ failAt: 2, switchover: 60 });
  const auto = s.msgs.filter((e) => state(e, 'pd'))[0];
  assert.deepEqual([auto.t, state(auto, 'pd').by], [65 * MIN, 'auto']);
  assert.equal(s.msgs.filter((e) => state(e, 'takeover'))[0].t, 125 * MIN);
  // PARTNER DOWN moves the horizon: the renewal at the takeover moment is still followed
  const late = end({ failAt: 2, pdAt: 5, newClients: 0 });
  assert.equal(late.msgs[late.msgs.length - 1].t, late.msgs.filter((e) => state(e, 'takeover'))[0].t);
  assert.equal(logic.horizon(at({ failAt: 2, pdAt: 5, newClients: 0 }, 6)), 57.5 * MIN + H);
  // off by default: no automatic switch
  assert.ok(end(PRESETS['lb-interrupted']).msgs.every((e) => !state(e, 'pd')));
});

test('rule 7: an empty pool gives no offer; the client waits and asks again', () => {
  const pd = PRESETS['lb-partner-down'];
  const a = items(ev(pd, 4), 'discover')[0];
  assert.deepEqual([a.served.DHCP2.n, a.none.n, a.full.DHCP2], [50, 10, true]);
  const r6 = items(ev(pd, 6), 'discover')[0];
  assert.deepEqual([r6.why, r6.n, Object.keys(r6.served).length], ['retry', 10, 0]);
  const r7 = items(ev(pd, 7), 'discover')[0];
  assert.deepEqual([r7.served.DHCP2.n, r7.none.n, r7.served.DHCP2.len], [10, 0, H], 'after the takeover leases still last MCLT');
  assert.deepEqual(at(pd, 7).pools.A.slice(0, 2), [70, 71], 'the 10 got .60–.69 from DHCP1\'s share');
  // in NORMAL too: with DHCP1's share empty, its bucket gets no offer and DHCP2 does not step in (the pools are split
  // in the bucket ratio, so the params alone never empty one in NORMAL; the state is built by hand)
  const p = P({});
  const s0 = logic.initial(p);
  s0.pools.A = [];
  const d = items(logic.step(s0, 1, p).msgs[0], 'discover')[0];
  assert.deepEqual([d.served.DHCP1, d.served.DHCP2.n, d.none.n, d.full.DHCP1], [undefined, 50, 50, true]);
  assert.deepEqual(d.none.names, ['PC-01', 'PC-03', 'PC-05']);
});

test('rule 8: split scope: no shared state; renewals fail; at expiry DHCP2 has only its 40', () => {
  const sp = PRESETS['split-80-20'];
  const s0 = at(sp, 0);
  assert.deepEqual([s0.pools.A[0], s0.pools.A.length, s0.pools.B[0], s0.pools.B.length], [10, 160, 170, 40]);
  const a = items(ev(sp, 1), 'discover')[0];
  assert.deepEqual([Object.keys(a.served).join(), a.served.DHCP1.n, a.served.DHCP1.len], ['DHCP1', 60, 8 * DAY]);
  assert.ok(state(ev(sp, 2), 'down') && !state(ev(sp, 2), 'commInt'));
  const t1 = items(ev(sp, 3), 'renew')[0];
  assert.deepEqual([ev(sp, 3).t, t1.lost], [4 * DAY, true]);
  const rb = items(ev(sp, 4), 'rebind')[0];
  assert.deepEqual([ev(sp, 4).t, rb.silent, rb.none.n], [7 * DAY, ['DHCP2'], 60]);
  const ex = items(ev(sp, 5), 'discover')[0];
  assert.deepEqual([ev(sp, 5).t, ex.why, ex.served.DHCP2.n, ex.none.n], [8 * DAY, 'expired', 40, 20]);
  assert.equal(logic.ip(named(at(sp, 5), 'PC-01').octets[0]), '10.0.10.170');
  assert.equal(steps(sp), 5);
  // DHCP1's scope stays as it was when it failed: its 60 leases, 100 free
  assert.equal(at(sp, 5).pools.A.length, 100);
  assert.deepEqual(logic.known(at(sp, 5), 'DHCP1'), { own: 60, partner: 0 });
  // a new client while DHCP1 is down gets DHCP2's address, at 0:30 (no MCLT in a split scope)
  const s = end({ mode: 'splitScope', failAt: 1 });
  assert.deepEqual([s.msgs[2].t, items(s.msgs[2], 'discover')[0].served.DHCP2.n], [30 * MIN, 6]);
});

test('rule 9: a rebinding client with both servers up is answered by its bucket owner, or the active server', () => {
  const lb = at({}, 1), hs = at({ mode: 'hotStandby' }, 1);
  assert.equal(logic.answerer(lb, 23, 'rebind', null), 'DHCP1');
  assert.equal(logic.answerer(lb, 201, 'rebind', null), 'DHCP2');
  assert.equal(logic.answerer(hs, 201, 'rebind', null), 'DHCP1');
  const down = at(PRESETS['lb-interrupted'], 3);
  assert.equal(logic.answerer(down, 23, 'rebind', null), 'DHCP2', 'with DHCP1 down the survivor answers every bucket');
  const sp = at(PRESETS['split-80-20'], 2);
  assert.equal(logic.answerer(sp, 23, 'rebind', { server: 'DHCP1' }), null, 'split: DHCP2 has no record');
  assert.equal(logic.answerer(sp, 23, 'discover', null), 'DHCP2');
});

test('a failure pressed late still shows the failed server\'s clients renewing (horizon follows them to T2)', () => {
  // lb-normal ends at 1:00 with 8-day leases; fail there: T1 at 4 d 0:30 (lost / MCLT), then the rebind at 7 d 0:30
  const p = { failAt: 6 };
  const s = end(p);
  const rb = s.msgs.filter((e) => items(e, 'rebind').length)[0];
  assert.ok(rb, 'a rebind step');
  assert.equal(rb.t, 30 * MIN + 7 * DAY);
  assert.equal(items(rb, 'rebind')[0].served.DHCP2.len, H);
  assert.ok(steps(p) <= 12);
  monotonic(s, 'late failure');
});

test('rule 10: T1 at half the lease, T2 at 7/8, the scope lease 8 days', () => {
  assert.deepEqual([logic.T1, logic.T2, logic.LEASE], [0.5, 0.875, 8 * DAY]);
  const c = named(at({}, 1), 'PC-01');
  assert.equal(logic.timerOf(c), 30 * MIN);
  assert.equal(logic.timerOf(Object.assign({}, c, { phase: 'renewing' })), 52.5 * MIN);
  assert.equal(logic.timerOf(Object.assign({}, c, { phase: 'rebinding' })), H);
  assert.equal(logic.timerOf(Object.assign({}, c, { phase: 'waiting' })), null);
});

test('presets: the step counts and the numbers in SPEC.md', () => {
  assert.deepEqual(Object.values(PRESETS).map((p) => steps(p)), [6, 5, 7, 5, 5]);
  assert.deepEqual(logic.bound(end(PRESETS['lb-normal'])), { DHCP1: 53, DHCP2: 53, waiting: 0 });
  assert.deepEqual(logic.bound(end(PRESETS['lb-partner-down'])), { DHCP1: 0, DHCP2: 160, waiting: 0 });
  assert.deepEqual(logic.bound(end(PRESETS['hs-reserve-runs-out'])), { DHCP1: 0, DHCP2: 110, waiting: 2 });
  assert.deepEqual(logic.bound(end(PRESETS['split-80-20'])), { DHCP1: 0, DHCP2: 40, waiting: 20 });
});

// ── generic checks every sim keeps ──

const SAMPLES = [{}, ...Object.values(PRESETS), { mclt: 15, switchover: 60, failAt: 2, newClients: 60 }, { failAt: 0 }];

test('state is JSON-safe at every step', () => {
  for (const over of SAMPLES) {
    const p = P(over);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of SAMPLES) {
    const p = P(over);
    const n0 = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= n0; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = n0; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P(PRESETS['lb-partner-down']);
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps(p); n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model and matches these tests', () => {
  const fs = require('node:fs'), path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const found = [...html.matchAll(/\{ id: '([\w-]+)', label: [^}]*params: (\{[^}]*\})/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(found.map((x) => x[0]), Object.keys(PRESETS));
  for (const [id, src] of found) {
    const params = Function('return ' + src)();
    for (const k of Object.keys(params)) assert.ok(k in logic.defaults, `preset ${id}: ${k} is a model param`);
    if (params.mode) assert.ok(logic.MODES.includes(params.mode));
    assert.deepEqual(params, PRESETS[id], `preset ${id} as in the tests`);
  }
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults), 'sim.json steps matches the model');
});
