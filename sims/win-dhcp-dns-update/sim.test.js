// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-dhcp-dns-update's model (rules: SPEC.md). Run: node --test sims/win-dhcp-dns-update/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const end = (over) => { const p = P(over); return kit.stateAt(logic, p, logic.steps(p)); };
const at = (over, n) => kit.stateAt(logic, P(over), n);
/** The run as short codes: down, expire, do, ra, U (update), then the answer's rcode. */
const path = (s) => s.msgs.map((e) => e.kind === 'update' ? 'U' : e.kind === 'answer' ? e.rcode : e.kind);
const fwd = (s, name, type = 'A') => logic.find(s.zones.fwd.records, name, type);
const rev = (s, name) => logic.find(s.zones.rev.records, name, 'PTR');
const zone = (records) => ({ name: 'corp.example', updates: 'secureOnly', records });
const R = (name, type, data, owner) => ({ name, type, data, owner, timestamp: 0, static: false });
const DHCP = (id) => ({ principal: id + '$', signed: true, proxy: false });
const add = (name, type, data) => ({ prereq: null, adds: [{ name, type, data }], deletes: [] });

// ── tie-breaks first ──

test('T1: an update is all or nothing: A and DHCID go in together or not at all', () => {
  const z = zone([R('fs1', 'A', '10.0.10.20', 'FS1$')]);
  const u = { prereq: null, adds: [{ name: 'fs1', type: 'A', data: '10.0.10.66' }, { name: 'fs1', type: 'DHCID', data: 'x' }], deletes: [] };
  const r = logic.applyUpdate(z, u, DHCP('DHCP1'), 5);
  assert.equal(r.rcode, 'REFUSED');
  assert.deepEqual(r.records, z.records);
  assert.deepEqual([r.added, r.updated], [[], []]);
  // two names, one not writable: nothing changes
  const r2 = logic.applyUpdate(zone([R('a', 'A', '1', 'X$')]), { prereq: null, adds: [{ name: 'b', type: 'A', data: '2' }, { name: 'a', type: 'A', data: '3' }], deletes: [] }, DHCP('DHCP1'), 1);
  assert.equal(r2.rcode, 'REFUSED');
  assert.equal(r2.records.length, 1);
  // with name protection the first try adds both records of the name
  const s = end({ nameProtection: true });
  assert.deepEqual(s.msgs[3].added, ['win10-07 A', 'win10-07 DHCID']);
});

test('T2: DC1 checks the zone setting, then prerequisites, then the owner', () => {
  const z = zone([R('pc', 'A', '1', 'DHCP1$'), R('pc', 'DHCID', 'm', 'DHCP1$')]);
  // unsigned: REFUSED before the prerequisite is looked at
  const u = logic.applyUpdate(z, { prereq: { nxdomain: 'pc' }, adds: [{ name: 'pc', type: 'A', data: '2' }], deletes: [] }, { principal: null, signed: false, proxy: false }, 1);
  assert.deepEqual([u.rcode, u.reason], ['REFUSED', 'unsigned']);
  // name in use: YXDOMAIN, even for a sender that could not write it anyway
  const y = logic.applyUpdate(z, { prereq: { nxdomain: 'pc' }, adds: [{ name: 'pc', type: 'A', data: '2' }], deletes: [] }, DHCP('DHCP2'), 1);
  assert.deepEqual([y.rcode, y.reason], ['YXDOMAIN', 'inUse']);
  // DHCID matches, but the owner is another account: REFUSED
  const o = logic.applyUpdate(z, { prereq: { dhcid: { name: 'pc', data: 'm' } }, adds: [{ name: 'pc', type: 'A', data: '2' }], deletes: [] }, DHCP('DHCP2'), 1);
  assert.deepEqual([o.rcode, o.reason], ['REFUSED', 'owner']);
  assert.deepEqual(path(end({ event: 'failover', nameProtection: true })),
    ['down', 'do', 'ra', 'U', 'YXDOMAIN', 'U', 'REFUSED', 'U', 'NOERROR']);
});

test('T3: the owner sits on the name; an open name is taken over, but not by a DnsUpdateProxy member', () => {
  const z = zone([R('h', 'A', '1', null)]);
  const taken = logic.applyUpdate(z, { prereq: null, adds: [{ name: 'h', type: 'DHCID', data: 'm' }], deletes: [] }, DHCP('DHCP2'), 3);
  assert.deepEqual(taken.records.map((r) => r.owner), ['DHCP2$', 'DHCP2$'], 'A and DHCID share the new owner');
  const open = logic.applyUpdate(z, add('h', 'A', '2'), { principal: 'DHCP2$', signed: true, proxy: true }, 3);
  assert.equal(open.records[0].owner, null, 'a member leaves it open');
  assert.equal(open.records[0].data, '2');
  // a new name written by a member has no owner
  const fresh = logic.applyUpdate(zone([]), add('n', 'A', '9'), { principal: 'DHCP1$', signed: true, proxy: true }, 3);
  assert.equal(fresh.records[0].owner, null);
  // an existing owner is kept when the owner adds a record type
  const kept = logic.applyUpdate(zone([R('k', 'A', '1', 'DHCP1$')]), add('k', 'DHCID', 'm'), DHCP('DHCP1'), 3);
  assert.deepEqual(kept.records.map((r) => r.owner), ['DHCP1$', 'DHCP1$']);
});

test('T4: switches that need others: updates off ignores legacy and Name Protection; Discard needs an expiry', () => {
  for (const over of [{ legacy: true }, { nameProtection: true }, { legacy: true, nameProtection: true }]) {
    assert.deepEqual(path(end(Object.assign({ client: 'printer', mode: 'off' }, over))), ['do', 'ra'], JSON.stringify(over));
  }
  const off = end({ mode: 'off', nameProtection: true });
  assert.equal(off.dhcp[0].settings.nameProtection, false);
  assert.equal(fwd(off, 'win10-07', 'DHCID'), null);
  assert.equal(rev(off, '57').owner, 'WIN10-07$', 'with updates off the Windows client writes its PTR itself');
  const ded = end({ client: 'printer', legacy: true, creds: 'dedicated' });
  assert.equal(ded.dhcp[0].inDnsUpdateProxy, false);
  assert.equal(fwd(ded, 'prn-3').owner, 'svc-dhcpdns');
  assert.equal(end({ client: 'printer', legacy: true, creds: 'proxy' }).dhcp[0].creds, 'computer', 'the proxy group holds the computer account');
  // discard matters only for the expiry event
  for (const ev of ['lease', 'failover']) {
    const a = end({ client: 'printer', legacy: true, event: ev, discard: true });
    const b = end({ client: 'printer', legacy: true, event: ev, discard: false });
    assert.deepEqual(a.zones, b.zones, ev);
    assert.deepEqual(path(a), path(b), ev);
  }
  assert.deepEqual(logic.matters(P({ mode: 'off' })), { legacy: false, nameProtection: false, discard: false });
  assert.deepEqual(logic.matters(P({ event: 'expiry' })), { legacy: true, nameProtection: true, discard: true });
});

test('T5: the server sends first, A before PTR; then the client', () => {
  const ups = (s) => s.msgs.filter((e) => e.kind === 'update').map((e) => e.by + ':' + e.op);
  assert.deepEqual(ups(end({})), ['DHCP1:PTR', 'client:A']);
  assert.deepEqual(ups(end({ mode: 'always' })), ['DHCP1:A', 'DHCP1:PTR']);
  assert.deepEqual(ups(end({ client: 'printer', legacy: true })), ['DHCP1:A', 'DHCP1:PTR']);
  assert.deepEqual(ups(end({ mode: 'off' })), ['client:A', 'client:PTR']);
  assert.deepEqual(ups(end({ event: 'failover' })), ['DHCP2:PTR', 'client:A']);
});

test('T6: names compare case-insensitively; PTR names are the last octet', () => {
  const r = logic.applyUpdate(zone([R('prn-3', 'A', '1', 'DHCP1$')]), add('PRN-3', 'A', '2'), DHCP('DHCP1'), 1);
  assert.equal(r.records.length, 1);
  assert.deepEqual(r.updated, ['prn-3 A']);
  assert.equal(logic.ptrName('10.0.10.57'), '57');
  const s = end({});
  assert.equal(rev(s, '57').data, 'win10-07.corp.example');
  assert.equal(s.zones.rev.name, '10.0.10.in-addr.arpa');
});

// ── rules ──

test('rule 1: a Windows client sends option 81 with S = 0; the host and the printer send none', () => {
  assert.deepEqual(at({}, 2).msgs[1].opt81, { fqdn: 'win10-07.corp.example', s: 0 });
  assert.equal(at({ client: 'other' }, 2).msgs[1].opt81, null);
  assert.equal(at({ client: 'printer' }, 2).msgs[1].opt81, null);
  assert.equal(at({ client: 'clash' }, 2).msgs[1].opt81.fqdn, 'fs1.corp.example');
});

test('rule 2: on request the server writes the PTR (S = 0) and the client its A; always: the server both (S = 1, O = 1)', () => {
  const s = end({});
  assert.deepEqual(s.msgs[1].reply, { s: 0, o: 0 });
  assert.deepEqual(path(s), ['do', 'ra', 'U', 'NOERROR', 'U', 'NOERROR']);
  assert.equal(rev(s, '57').owner, 'DHCP1$');
  assert.deepEqual([fwd(s, 'win10-07').data, fwd(s, 'win10-07').owner], ['10.0.10.57', 'WIN10-07$']);
  assert.equal(s.msgs[4].sender.principal, 'WIN10-07$');
  const a = end({ mode: 'always' });
  assert.deepEqual(a.msgs[1].reply, { s: 1, o: 1 });
  assert.equal(fwd(a, 'win10-07').owner, 'DHCP1$');
  assert.equal(rev(a, '57').owner, 'DHCP1$');
  assert.equal(end({ mode: 'off' }).msgs[1].reply, null, 'updates off: no option 81 in the ACK');
});

test('rule 3: no option 81 → no records, unless legacy clients are on', () => {
  for (const c of ['printer', 'other']) {
    const s = end({ client: c });
    assert.deepEqual(path(s), ['do', 'ra'], c);
    assert.deepEqual(s.zones, logic.initial(P({ client: c })).zones, c);
    // "always" is about clients that send option 81: without legacy these still get nothing
    assert.deepEqual(path(end({ client: c, mode: 'always' })), ['do', 'ra'], c + ' always');
    for (const mode of ['onRequest', 'always']) {
      const l = end({ client: c, legacy: true, mode });
      const cl = logic.CLIENTS[c];
      assert.deepEqual([fwd(l, cl.host).data, fwd(l, cl.host).owner], [cl.ip, 'DHCP1$'], c + mode);
      assert.equal(rev(l, logic.ptrName(cl.ip)).owner, 'DHCP1$');
    }
  }
});

test('rule 4: at expiry with Discard on the server deletes what it registered; the client\'s own A stays', () => {
  const s = end({ client: 'other', legacy: true, event: 'expiry' });
  assert.deepEqual(path(s), ['expire', 'U', 'NOERROR', 'U', 'NOERROR']);
  assert.equal(fwd(s, 'host-12'), null);
  assert.equal(rev(s, '62'), null);
  assert.deepEqual(s.msgs[2].removed, ['host-12 A']);
  assert.deepEqual(s.msgs[4].removed, ['62 PTR']);
  assert.equal(s.dhcp[0].leases.length, 0, 'the lease is deleted');
  const k = end({ client: 'other', legacy: true, event: 'expiry', discard: false });
  assert.deepEqual(path(k), ['expire']);
  assert.equal(fwd(k, 'host-12').data, '10.0.10.62');
  const w = end({ event: 'expiry' });
  assert.deepEqual(path(w), ['expire', 'U', 'NOERROR']);
  assert.equal(rev(w, '57'), null);
  assert.equal(fwd(w, 'win10-07').owner, 'WIN10-07$', 'the A is the client\'s');
  // with name protection A and DHCID go in one delete
  const n = end({ event: 'expiry', nameProtection: true });
  assert.deepEqual(n.msgs[2].removed, ['win10-07 A', 'win10-07 DHCID']);
  assert.equal(fwd(n, 'win10-07', 'DHCID'), null);
  // nothing registered: nothing to delete
  assert.deepEqual(path(end({ client: 'printer', event: 'expiry' })), ['expire']);
});

test('rule 5: the owner is the account the server writes with: DHCP1$ or the shared svc-dhcpdns', () => {
  assert.equal(rev(end({}), '57').owner, 'DHCP1$');
  assert.equal(rev(end({ creds: 'dedicated' }), '57').owner, 'svc-dhcpdns');
  assert.deepEqual(logic.senderOf({ id: 'DHCP2', creds: 'computer', inDnsUpdateProxy: false }), { principal: 'DHCP2$', signed: true, proxy: false });
  assert.deepEqual(logic.senderOf({ id: 'DHCP2', creds: 'dedicated', inDnsUpdateProxy: true }), { principal: 'svc-dhcpdns', signed: true, proxy: false });
});

test('rule 6: DHCP2 may not change DHCP1\'s record; the shared user may; a client without an account gives up', () => {
  const s = end({ client: 'printer', legacy: true, event: 'failover' });
  assert.deepEqual(path(s), ['down', 'do', 'ra', 'U', 'REFUSED', 'U', 'NOERROR']);
  assert.equal(s.msgs[4].reason, 'owner');
  assert.deepEqual(s.msgs[4].items, [{ name: 'prn-3', exists: true, owner: 'DHCP1$', may: false }]);
  assert.deepEqual([fwd(s, 'prn-3').data, fwd(s, 'prn-3').owner], ['10.0.10.53', 'DHCP1$']);
  assert.equal(rev(s, '88').owner, 'DHCP2$');
  assert.equal(rev(s, '53').data, 'prn-3.corp.example', 'the old PTR stays');
  assert.deepEqual(s.dhcp[1].leases[0].dns, [{ zone: 'rev', name: '88', types: ['PTR'] }], 'a refused update is not remembered');
  const f = end({ client: 'printer', legacy: true, event: 'failover', creds: 'dedicated' });
  assert.deepEqual([fwd(f, 'prn-3').data, fwd(f, 'prn-3').owner], ['10.0.10.88', 'svc-dhcpdns']);
  // the workgroup laptop's own update is unsigned: refused, and it does not try again
  const c = end({ client: 'clash' });
  assert.deepEqual(path(c), ['do', 'ra', 'U', 'NOERROR', 'U', 'REFUSED']);
  assert.equal(c.msgs[5].gaveUp, true);
  assert.equal(c.msgs[4].sender.signed, false);
  assert.deepEqual(path(end({ client: 'clash', mode: 'off' })), ['do', 'ra', 'U', 'REFUSED'], 'gives up the PTR too');
  assert.equal(end({}).msgs[5].gaveUp, undefined);
});

test('rule 7: DnsUpdateProxy: no owner, so DHCP2 may write; the records stay open', () => {
  const s = end({ client: 'printer', legacy: true, event: 'failover', creds: 'proxy' });
  assert.deepEqual(path(s), ['down', 'do', 'ra', 'U', 'NOERROR', 'U', 'NOERROR']);
  assert.deepEqual([fwd(s, 'prn-3').data, fwd(s, 'prn-3').owner], ['10.0.10.88', null]);
  assert.equal(rev(s, '88').owner, null);
  const i = logic.initial(P({ client: 'printer', legacy: true, event: 'failover', creds: 'proxy' }));
  assert.equal(fwd(i, 'prn-3').owner, null, 'created by a member: no owner');
  // the client writing an open name takes it
  const w = end({ creds: 'proxy', mode: 'off' });
  assert.equal(fwd(w, 'win10-07').owner, 'WIN10-07$');
});

test('rule 8: Name Protection: A + DHCID if the name is free; YXDOMAIN, then the DHCID must be this client\'s', () => {
  const s = end({ client: 'clash', nameProtection: true });
  assert.deepEqual(path(s), ['do', 'ra', 'U', 'YXDOMAIN', 'U', 'NXRRSET']);
  assert.deepEqual(s.msgs[2].update.prereq, { nxdomain: 'fs1' });
  assert.deepEqual(s.msgs[4].update.prereq, { dhcid: { name: 'fs1', data: '00-15-5D-0A-0A-66' } });
  assert.deepEqual(s.msgs[4].update.adds.map((a) => a.type), ['A'], 'the second try replaces the A only');
  // legacy clients get the same treatment: A with a DHCID
  const lg = end({ client: 'printer', legacy: true, nameProtection: true });
  assert.deepEqual(lg.msgs[2].update.prereq, { nxdomain: 'prn-3' });
  assert.equal(fwd(lg, 'prn-3', 'DHCID').data, logic.CLIENTS.printer.mac);
  assert.equal(s.msgs[5].reason, 'otherDhcid');
  assert.deepEqual(s.msgs[5].stopped, ['PTR'], 'no PTR after the conflict');
  assert.equal(fwd(s, 'fs1').data, '10.0.10.20');
  assert.equal(fwd(s, 'fs1', 'DHCID').data, '00-15-5D-0A-0A-20');
  assert.equal(rev(s, '66'), null);
  assert.deepEqual(s.msgs[1].reply, { s: 1, o: 1 });
  // a free name: one try, A and DHCID, then the PTR; the client sends nothing
  const w = end({ nameProtection: true });
  assert.deepEqual(path(w), ['do', 'ra', 'U', 'NOERROR', 'U', 'NOERROR']);
  assert.equal(fwd(w, 'win10-07', 'DHCID').data, logic.CLIENTS.windows.mac);
  // the same client again (its own DHCID): the second try passes the prerequisite
  const z = zone([R('pc', 'A', '1', 'DHCP1$'), R('pc', 'DHCID', 'm', 'DHCP1$')]);
  const ok = logic.applyUpdate(z, { prereq: { dhcid: { name: 'pc', data: 'm' } }, adds: [{ name: 'pc', type: 'A', data: '2' }], deletes: [] }, DHCP('DHCP1'), 1);
  assert.equal(ok.rcode, 'NOERROR');
  // a name with no DHCID at all: NXRRSET too
  const none = logic.applyUpdate(zone([R('pc', 'A', '1', 'PC$')]), { prereq: { dhcid: { name: 'pc', data: 'm' } }, adds: [], deletes: [] }, DHCP('DHCP1'), 1);
  assert.deepEqual([none.rcode, none.reason], ['NXRRSET', 'noDhcid']);
  // without Name Protection under "always" DHCP1 overwrites fs1: it owns the name
  const h = end({ client: 'clash', mode: 'always' });
  assert.deepEqual([fwd(h, 'fs1').data, fwd(h, 'fs1').owner], ['10.0.10.66', 'DHCP1$']);
  // and on request FS1 owns its A, so DHCP1 only writes the misleading PTR
  const q = end({ client: 'clash' });
  assert.deepEqual([fwd(q, 'fs1').data, fwd(q, 'fs1').owner, rev(q, '66').data], ['10.0.10.20', 'FS1$', 'fs1.corp.example']);
});

test('rule 9: leases last 8 days; the server keeps the lease and what it registered', () => {
  const s = end({});
  const l = s.dhcp[0].leases[0];
  assert.deepEqual([l.ip, l.granted, l.expires], ['10.0.10.57', logic.START + 2, logic.START + 2 + 8 * 86400]);
  assert.deepEqual(l.dns, [{ zone: 'rev', name: '57', types: ['PTR'] }], 'only the PTR: the A is the client\'s');
  const i = logic.initial(P({ client: 'other', legacy: true, event: 'expiry' }));
  assert.deepEqual(i.dhcp[0].leases[0].dns, [{ zone: 'fwd', name: 'host-12', types: ['A'] }, { zone: 'rev', name: '62', types: ['PTR'] }]);
  assert.equal(i.dhcp[0].leases[0].granted, logic.EARLIER_AT);
});

test('failover: DHCP1 goes down, the DISCOVER is lost there, DHCP2 leases 10.0.10.88', () => {
  const s = end({ event: 'failover' });
  assert.equal(s.dhcp[0].up, false);
  assert.deepEqual(s.msgs[1].lost, ['DHCP1']);
  assert.equal(s.msgs[1].by, 'DHCP2');
  assert.equal(s.dhcp[1].leases[0].ip, '10.0.10.88');
  assert.equal(s.dhcp[0].leases[0].ip, '10.0.10.57', 'DHCP1 still holds the old lease');
  assert.equal(fwd(s, 'win10-07').data, '10.0.10.88', 'the Windows client updates its own A');
  assert.equal(rev(s, '57').owner, 'DHCP1$', 'old PTR stays');
});

test('scenes: the standing records and the history', () => {
  const i = logic.initial(P({}));
  assert.deepEqual(i.zones.fwd.records, [R('dc1', 'A', '10.0.10.10', 'DC1$')]);
  assert.deepEqual(i.zones.rev.records, [R('10', 'PTR', 'dc1.corp.example', 'DC1$')]);
  const c = logic.initial(P({ client: 'clash' }));
  assert.deepEqual(c.zones.fwd.records.map((r) => [r.name, r.type, r.data, r.owner, r.timestamp]),
    [['dc1', 'A', '10.0.10.10', 'DC1$', 0], ['fs1', 'A', '10.0.10.20', 'FS1$', logic.FS1_AT + 4]]);
  assert.deepEqual(c.msgs, []);
  assert.equal(c.t, logic.START);
  assert.deepEqual(c.dhcp[0].leases.map((l) => l.ip), ['10.0.10.20']);
  const n = logic.initial(P({ client: 'clash', nameProtection: true }));
  assert.equal(fwd(n, 'fs1').owner, 'DHCP1$');
  assert.equal(fwd(n, 'fs1', 'DHCID').data, logic.FS1.mac);
});

test('times: day 3 10:00:00, one second per step; the expiry jumps to the lease end', () => {
  assert.equal(logic.START, 3 * 86400 + 10 * 3600);
  assert.deepEqual(end({}).msgs.map((e) => e.t), [1, 2, 3, 4, 5, 6].map((k) => logic.START + k));
  const x = end({ client: 'other', legacy: true, event: 'expiry' });
  const exp = logic.EARLIER_AT + logic.LEASE;
  assert.equal(exp, 9 * 86400 + 9 * 3600);
  assert.deepEqual(x.msgs.map((e) => e.t), [0, 1, 2, 3, 4].map((k) => exp + k));
});

test('presets: windows-default 6, printer-none 2 (6), failover-refused 7, lease-expiry 5 (1), name-protection 6; at most 9', () => {
  const cases = [[{}, 6], [{ client: 'printer' }, 2], [{ client: 'printer', legacy: true }, 6],
    [{ client: 'printer', legacy: true, event: 'failover' }, 7], [{ client: 'other', legacy: true, event: 'expiry' }, 5],
    [{ client: 'other', legacy: true, event: 'expiry', discard: false }, 1], [{ client: 'clash', nameProtection: true }, 6]];
  for (const [over, n] of cases) assert.equal(logic.steps(P(over)), n, JSON.stringify(over));
  let max = 0, count = 0;
  for (const client of logic.CLIENT_IDS) for (const event of logic.EVENTS) for (const mode of logic.MODES)
    for (const legacy of [false, true]) for (const discard of [false, true]) for (const creds of logic.CREDS)
      for (const nameProtection of [false, true]) {
        const p = P({ client, event, mode, legacy, discard, creds, nameProtection });
        const n = logic.steps(p);
        const s = kit.stateAt(logic, p, n);
        assert.equal(s.phase, 'done');
        max = Math.max(max, n); count++;
      }
  assert.equal(count, 864);
  assert.equal(max, 9);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of [{}, { client: 'clash', nameProtection: true }, { event: 'failover', nameProtection: true }, { client: 'other', legacy: true, event: 'expiry' }]) {
    const p = P(over);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ event: 'failover', nameProtection: true });
  const steps = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ client: 'printer', legacy: true, event: 'failover' });
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

test('every preset in the page is valid for the model', () => {
  const fs = require('node:fs'), path_ = require('node:path');
  const html = fs.readFileSync(path_.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const pairs = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):\s*'?(\w+)'?/g)].map((k) => [k[1], k[2]]));
  assert.ok(pairs.length > 0, 'found preset params');
  for (const [k, v] of pairs) {
    assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    if (k === 'client') assert.ok(logic.CLIENT_IDS.includes(v), `client ${v}`);
    if (k === 'event') assert.ok(logic.EVENTS.includes(v), `event ${v}`);
    if (k === 'mode') assert.ok(logic.MODES.includes(v), `mode ${v}`);
    if (k === 'creds') assert.ok(logic.CREDS.includes(v), `creds ${v}`);
  }
  const sim = JSON.parse(fs.readFileSync(path_.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults), 'sim.json steps matches the model');
});
