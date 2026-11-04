// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-ipam-audit's model (SPEC.md). Run: node --test sims/win-ipam-audit/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const final = (over, q) => at(over, (q || 1) * logic.LINKS);
const IP = logic.IP;
const ev = (t, id, mac, host, ip) => ({ t, id, ip: ip || IP, mac, host });
const lg = (t, user, kind, ip) => ({ t, user, clientIp: ip || IP, dc: 'DC1', kind: kind || 'tgt' });
const ALL = logic.availability(0, true);

// ── tie-breaks first (rule 7) ──

test('rule 7: a lease event exactly at T counts as before T', () => {
  const L = [ev(100, 'new', 'A', 'PC-A'), ev(200, 'release', 'A', 'PC-A'), ev(300, 'new', 'B', 'PC-B')];
  assert.equal(logic.coveringLease(L, IP, 300).decider, 2, 'new lease at T covers T');
  assert.equal(logic.coveringLease(L, IP, 299).decider, 1);
  assert.equal(logic.coveringLease(L, IP, 200).kind, 'free', 'release at T: free at T');
  assert.equal(logic.coveringLease(L, IP, 199).kind, 'lease');
});

test('rule 7: a logon exactly at T counts; one exactly at the lease start counts too', () => {
  const G = [lg(100, 'a'), lg(150, 'b'), lg(151, 'c'), lg(99, 'd')];
  const r = logic.logonsInLease(G, IP, 100, 150);
  assert.deepEqual(r.inside, [0, 1]);
  assert.deepEqual(r.after, [2]);
  assert.deepEqual(r.before, [3]);
});

test('tie-break: two events at the same minute keep the log order (the later line is newer)', () => {
  const L = [ev(100, 'new', 'A', 'PC-A'), ev(200, 'release', 'A', 'PC-A'), ev(200, 'new', 'B', 'PC-B')];
  assert.equal(logic.coveringLease(L, IP, 200).decider, 2);
  const swapped = [L[0], L[2], L[1]];
  assert.equal(logic.coveringLease(swapped, IP, 200).kind, 'free');
});

// ── rule 1: the lease covering T ──

test('rule 1: the last new/renew at or before T, read newest first; later events are passed over', () => {
  const r = logic.coveringLease(logic.EVIDENCE['address-reused'].leaseEvents, IP, logic.AT['14:32']);
  assert.equal(r.kind, 'lease');
  assert.equal(r.decider, 2, 'the 12:30 lease of LAPTOP-IVAN, not the day\'s first (08:12)');
  assert.deepEqual(r.read, [3], 'the 16:30 renew is after T');
  assert.deepEqual(r.order, [3, 2, 1, 0]);
});

test('rule 1: a release or expiry between the lease and T leaves the address free', () => {
  const L = [ev(100, 'new', 'A', 'PC-A'), ev(140, 'expire', 'A', 'PC-A')];
  assert.equal(logic.coveringLease(L, IP, 150).kind, 'free');
  assert.equal(logic.coveringLease(L, IP, 130).kind, 'lease');
  assert.equal(logic.coveringLease(logic.EVIDENCE['one-user'].leaseEvents, IP, logic.AT['17:55']).kind, 'free');
});

test('rule 1: nothing at or before T → none; other addresses are ignored', () => {
  const L = [ev(50, 'new', 'X', 'PC-X', '10.0.40.58'), ev(200, 'new', 'A', 'PC-A')];
  const r = logic.coveringLease(L, IP, 150);
  assert.equal(r.kind, 'none');
  assert.equal(r.decider, -1);
  assert.deepEqual(r.order, [1]);
});

test('rule 1: the lease start walks back over renews of the same MAC to the new lease', () => {
  const L = [ev(10, 'new', 'B', 'PC-B'), ev(20, 'release', 'B', 'PC-B'), ev(100, 'new', 'A', 'PC-A'), ev(200, 'renew', 'A', 'PC-A'),
    ev(300, 'renew', 'A', 'PC-A')];
  assert.equal(logic.leaseStart(L, 4), 2);
  const other = [ev(100, 'renew', 'B', 'PC-B'), ev(200, 'renew', 'A', 'PC-A')];
  assert.equal(logic.leaseStart(other, 1), 1, 'another MAC before it ends the walk');
  const afterRelease = [ev(100, 'renew', 'A', 'PC-A'), ev(150, 'release', 'A', 'PC-A'), ev(200, 'renew', 'A', 'PC-A')];
  assert.equal(logic.leaseStart(afterRelease, 2), 2, 'a release ends the walk');
  const twoNews = [ev(100, 'new', 'A', 'PC-A'), ev(200, 'new', 'A', 'PC-A')];
  assert.equal(logic.leaseStart(twoNews, 1), 1, 'a new lease is a start of its own');
});

// ── rule 2: the MAC identifies the device ──

test('rule 2: the device is the MAC; an empty host name still gives the device', () => {
  const ev2 = { leaseEvents: [ev(100, 'new', 'A', '')], logonEvents: [lg(110, 'ana')], dnsNow: { name: 'x', ip: IP } };
  const r = logic.solve(ev2, IP, 200, ALL);
  assert.equal(r.answer.mac, 'A');
  assert.equal(r.answer.host, null);
  assert.equal(r.chain[1].ok, 'found');
  assert.equal(r.chain[1].why, 'no-host');
  assert.deepEqual(r.answer.users, ['ana']);
});

test('rule 2: the device is read from the covering event (the renew), the lease start from the new lease', () => {
  const r = logic.solve(logic.EVIDENCE['one-user'], IP, logic.AT['14:32'], ALL);
  assert.deepEqual(r.chain[1].evidence, [1, 0]);
  assert.equal(r.answer.mac, '02-AB-CD-0A-0B-07');
  assert.equal(r.answer.host, 'PC-LAB07');
});

// ── rule 3: logons tie a user to the address only during the lease ──

test('rule 3: a logon before the lease start belongs to the previous holder', () => {
  const s = final({ evidence: 'address-reused' });
  assert.deepEqual(s.logons.before, [0], 'ana 08:15 is before LAPTOP-IVAN\'s 12:30 lease');
  assert.deepEqual(s.logons.inside, [1]);
  assert.deepEqual(s.answer, { kind: 'one', host: 'LAPTOP-IVAN', mac: '02-AB-CD-1C-2D-31', users: ['ivan'], why: null });
});

test('rule 3: logoff events and other addresses are not logons', () => {
  const G = [lg(100, 'a', 'logoff'), lg(110, 'b', 'tgt', '10.0.40.58'), lg(120, 'c')];
  assert.deepEqual(logic.logonsInLease(G, IP, 0, 200), { inside: [2], before: [], after: [] });
});

test('rule 3: no logon inside the lease → the device without a user', () => {
  const e = { leaseEvents: [ev(100, 'new', 'A', 'PC-A')], logonEvents: [lg(90, 'ana')], dnsNow: { name: 'x', ip: IP } };
  const r = logic.solve(e, IP, 200, ALL);
  assert.equal(r.chain[2].ok, 'missing');
  assert.equal(r.answer.kind, 'device');
  assert.equal(r.answer.why, 'none');
});

// ── rule 4: several users → several candidates; logoffs drop a user ──

test('rule 4: two users from the same device before T → two candidates, ambiguous', () => {
  const s = final({ evidence: 'two-users' });
  assert.equal(s.answer.kind, 'several');
  assert.deepEqual(s.answer.users, ['ana', 'marko']);
  assert.equal(s.answer.host, 'PC-LAB07');
  assert.deepEqual(s.chain.map((c) => c.ok), ['found', 'found', 'found', 'ambiguous', 'ambiguous']);
});

test('rule 4: at 09:10 only ana had logged on', () => {
  assert.deepEqual(final({ evidence: 'two-users', at: logic.AT['09:10'] }).answer.users, ['ana']);
});

test('rule 4: a logoff after the user\'s latest logon and at or before T drops the user', () => {
  const G = [lg(100, 'ana'), lg(120, 'marko'), lg(130, 'ana', 'logoff'), lg(160, 'marko', 'logoff')];
  const r = logic.stillOn(G, [0, 1], 150);
  assert.deepEqual(r.users, ['marko']);
  assert.deepEqual(r.dropped, [0]);
  assert.deepEqual(r.by, [2]);
  assert.deepEqual(logic.stillOn(G, [0, 1], 130).users, ['marko'], 'a logoff exactly at T counts (rule 7)');
  assert.deepEqual(logic.stillOn(G, [0, 1], 129).users, ['ana', 'marko']);
  const back = [lg(100, 'ana'), lg(110, 'ana', 'logoff'), lg(120, 'ana')];
  assert.deepEqual(logic.stillOn(back, [0, 2], 150).users, ['ana'], 'a logon after the logoff counts again');
  const other = [lg(100, 'ana'), lg(110, 'ana', 'logoff', '10.0.40.58')];
  assert.deepEqual(logic.stillOn(other, [0], 150).users, ['ana'], 'a logoff from another address does not drop');
});

test('rule 4: everyone logged off → device only, why all-off', () => {
  const e = { leaseEvents: [ev(100, 'new', 'A', 'PC-A')], logonEvents: [lg(110, 'ana'), lg(120, 'ana', 'logoff')], dnsNow: { name: 'x', ip: IP } };
  const r = logic.solve(e, IP, 200, ALL);
  assert.equal(r.chain[3].ok, 'missing');
  assert.equal(r.answer.kind, 'device');
  assert.equal(r.answer.why, 'all-off');
});

// ── rule 5: retention ──

test('rule 5: the DHCP log keeps 7 days, the DC log 3, IPAM until purged', () => {
  assert.deepEqual([6, 7].map((d) => logic.availability(d, false).leases), [true, false]);
  assert.deepEqual([2, 3].map((d) => logic.availability(d, false).logons), [true, false]);
  assert.equal(logic.availability(14, true).leases, true);
  assert.equal(logic.availability(14, true).logons, true);
  assert.equal(logic.availability(14, true).dhcp, false, 'the server\'s own file is gone; IPAM has the copy');
});

test('rule 5: too old for every source → no answer; IPAM still has it', () => {
  const off = final({ askedDaysAgo: 9, ipamCollected: false });
  assert.equal(off.answer.kind, 'unknown');
  assert.equal(off.answer.why, 'gone');
  assert.deepEqual(off.chain.map((c) => c.ok), ['missing', 'missing', 'missing', 'missing', 'missing']);
  const on = final({ askedDaysAgo: 9, ipamCollected: true });
  assert.deepEqual(on.answer.users, ['ana']);
});

test('rule 5: leases kept but logons overwritten → the machine, not the user', () => {
  const s = final({ askedDaysAgo: 4, ipamCollected: false });
  assert.equal(s.answer.kind, 'device');
  assert.equal(s.answer.host, 'PC-LAB07');
  assert.equal(s.chain[2].why, 'gone');
});

test('rule 5: the day asked and its weekday', () => {
  assert.deepEqual(logic.dayAfter(0), { d: 28, m: 9, wd: 0 });
  assert.deepEqual(logic.dayAfter(2), { d: 30, m: 9, wd: 2 });
  assert.deepEqual(logic.dayAfter(9), { d: 7, m: 10, wd: 2 });
  assert.deepEqual(logic.dayAfter(7), { d: 5, m: 10, wd: 0 }, 'the next Monday starts the Monday file again');
});

// ── rule 6: DNS now is never evidence ──

test('rule 6: the answer ignores the DNS record (dns-trap: DNS says pc-lab12, the trail says PC-LAB07)', () => {
  const s = final({ evidence: 'dns-trap' });
  assert.equal(s.dnsNow.name, 'pc-lab12');
  assert.equal(s.answer.host, 'PC-LAB07');
  assert.deepEqual(s.answer.users, ['ana']);
  const e = Object.assign({}, logic.EVIDENCE['dns-trap'], { dnsNow: { name: 'zzz', ip: IP } });
  assert.deepEqual(logic.solve(e, IP, logic.AT['14:32'], ALL), logic.solve(logic.EVIDENCE['dns-trap'], IP, logic.AT['14:32'], ALL));
  assert.equal(final({ evidence: 'dns-trap', at: logic.AT['17:55'] }).answer.host, 'PC-LAB12');
});

// ── steps, presets and the chain ──

test('steps: 5 per question; the reused-address set asks twice (14:32 then 09:10; 09:10 then 14:32)', () => {
  assert.equal(logic.steps(P()), 5);
  assert.equal(logic.steps(P({ evidence: 'address-reused' })), 10);
  assert.deepEqual(logic.questions(P({ evidence: 'address-reused' })), [872, 550]);
  assert.deepEqual(logic.questions(P({ evidence: 'address-reused', at: 550 })), [550, 872]);
  assert.deepEqual(logic.questions(P({ evidence: 'address-reused', at: 1075 })), [1075, 550]);
  const s = at({ evidence: 'address-reused' }, 10);
  assert.equal(s.question.at, 550);
  assert.deepEqual(s.answer.users, ['ana']);
  assert.equal(s.answer.host, 'PC-LAB07');
  assert.equal(s.prior.length, 1);
  assert.equal(s.prior[0].answer.host, 'LAPTOP-IVAN');
});

test('one link per step: the chain grows by one, the answer only at link 5', () => {
  for (let n = 0; n <= 5; n++) {
    const s = at({}, n);
    assert.equal(s.chain.length, n);
    assert.equal(s.answer === null, n < 5);
  }
  assert.deepEqual(at({}, 5).chain.map((c) => c.link), ['lease', 'device', 'logons', 'logoffs', 'answer']);
  const s6 = at({ evidence: 'address-reused' }, 6);
  assert.equal(s6.question.qi, 1);
  assert.equal(s6.chain.length, 1);
});

test('presets: expected answers (SPEC.md table)', () => {
  const ans = (o, q) => { const a = final(o, q).answer; return [a.kind, a.host, a.users.join('+')].join(' '); };
  assert.equal(ans({ evidence: 'one-user' }), 'one PC-LAB07 ana');
  assert.equal(ans({ evidence: 'address-reused' }), 'one LAPTOP-IVAN ivan');
  assert.equal(ans({ evidence: 'address-reused' }, 2), 'one PC-LAB07 ana');
  assert.equal(ans({ evidence: 'two-users' }), 'several PC-LAB07 ana+marko');
  assert.equal(ans({ evidence: 'one-user', askedDaysAgo: 9, ipamCollected: false }), 'unknown  ');
  assert.equal(ans({ evidence: 'dns-trap', askedDaysAgo: 2 }), 'one PC-LAB07 ana');
  assert.equal(ans({ evidence: 'one-user', at: logic.AT['17:55'] }), 'unknown  ');
});

test('chain reasons: overwritten logons are reported as gone before a missing lease', () => {
  const four = final({ askedDaysAgo: 4, ipamCollected: false });
  assert.deepEqual(four.chain.map((c) => c.ok), ['found', 'found', 'missing', 'missing', 'ambiguous'], 'device known, user not: ≈ partial');
  assert.deepEqual(four.chain.map((c) => c.why), [null, null, 'gone', 'gone', 'gone']);
  const nine = final({ askedDaysAgo: 9, ipamCollected: false });
  assert.deepEqual(nine.chain.map((c) => c.why), ['gone', 'no-lease', 'gone', 'gone', 'gone']);
  const free = final({ at: logic.AT['17:55'] });
  assert.deepEqual(free.chain.map((c) => c.why), ['free', 'no-lease', 'no-lease', 'no-lease', 'free']);
});

test('chain evidence: the lease link points at the covering event', () => {
  assert.deepEqual(final({}).chain[0].evidence, [1]);
  assert.deepEqual(final({ at: logic.AT['17:55'] }).chain[0].evidence, [2], 'the release that freed it');
  assert.deepEqual(final({ evidence: 'two-users' }).chain[2].evidence, [0, 1]);
});

test('rule 2: the host name is the one in the covering event, not the lease start', () => {
  const e = { leaseEvents: [ev(100, 'new', 'A', 'OLD-NAME'), ev(150, 'renew', 'A', 'NEW-NAME')], logonEvents: [], dnsNow: { name: 'x', ip: IP } };
  assert.equal(logic.solve(e, IP, 200, ALL).answer.host, 'NEW-NAME');
});

test('rule 5: which source is read, and the IPAM chip', () => {
  assert.equal(logic.availability(0, false).via, 'servers');
  assert.equal(logic.availability(0, true).via, 'ipam');
  assert.equal(logic.availability(0, false).ipam, false);
  assert.equal(logic.availability(0, true).ipam, true);
  assert.deepEqual(logic.dayAfter(3), { d: 1, m: 10, wd: 3 }, 'September has 30 days');
});

// ── generic checks every sim keeps ──

const COMBOS = [];
for (const evidence of Object.keys(logic.EVIDENCE)) for (const t of Object.values(logic.AT)) for (const d of [0, 2, 3, 6, 7, 14]) for (const ipam of [true, false]) COMBOS.push({ evidence, at: t, askedDaysAgo: d, ipamCollected: ipam });

test('state is JSON-safe at every step', () => {
  for (const c of COMBOS) {
    for (let n = 0; n <= logic.steps(P(c)); n++) {
      const s = at(c, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ evidence: 'address-reused', askedDaysAgo: 4, ipamCollected: false });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input or the evidence', () => {
  const p = P({ evidence: 'two-users' });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  const evCopy = structuredClone(logic.EVIDENCE);
  for (let n = 1; n <= 5; n++) logic.step(s0, n, p);
  assert.deepEqual(s0, copy);
  assert.deepEqual(logic.EVIDENCE, evCopy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model; meta steps match the defaults', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
