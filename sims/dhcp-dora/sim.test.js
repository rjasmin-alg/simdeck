// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for dhcp-dora's model (rules: SPEC.md). Run: node --test sims/dhcp-dora/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const run = (over) => { const p = P(over); const out = []; for (let n = 0; n <= logic.steps(p); n++) out.push(kit.stateAt(logic, p, n)); return out; };
const end = (over) => { const r = run(over); return r[r.length - 1]; };
/** The first state whose last event matches `pred`. */
const first = (over, pred) => run(over).find((s) => s.last && pred(s.last, s)) || null;
const did = (over) => run(over).slice(1).map((s) => s.last.did);
const m = (s, n) => logic.msg(s, n);
const srv = (s, id) => logic.server(s, id);
const A = '192.168.180.1', B = '192.168.180.2';
const PRESETS = {
  'lease-600': {},
  'two-servers': { serverB: 'plain' },
  'server-dies': { failAt: 't1' },
  'rebind-to-b': { serverB: 'partner', failAt: 't1' },
  'no-backup': { serverB: 'plain', failAt: 't1' },
  'classroom-2h': { lease: 7200, leave: 'off' },
  'windows-8d': { lease: 691200, optChange: true }
};

// ── tie-breaks first ──

test('tie-break: two offers arrive together, the client takes the first server listed (A) and ignores B\'s', () => {
  const s = first({ serverB: 'plain' }, (l) => l.did === 'choose');
  assert.equal(s.last.srv, 'A');
  assert.equal(s.last.addr, '192.168.180.100');
  assert.deepEqual(s.last.late.map((x) => [x.srv, x.addr]), [['B', '192.168.180.150']]);
  assert.deepEqual(m(s, s.last.late[0].msg).ignored, ['C']);
  const req = m(s, s.last.reply);
  assert.equal(req.f.o54, A);
  assert.equal(req.f.o50, '192.168.180.100');
});

test('tie-break: a scripted event at the same time as a client timer comes first', () => {
  const p = P({});
  const s = structuredClone(kit.stateAt(logic, p, 5));
  s.events = [{ at: 300, kind: 'down', srv: 'A', done: false }];
  const s6 = logic.step(s, 6, p);
  assert.equal(s6.last.did, 'down');
  assert.equal(s6.t, 300);
  const s7 = logic.step(s6, 7, p);
  assert.equal(s7.last.did, 'renew');
  assert.equal(s7.t, 300);
  assert.equal(m(s7, s7.last.msg).state, 'lost');
});

test('tie-break: a message in flight is delivered before time moves on', () => {
  const s = at({}, 6);                                   // T1: the renewal REQUEST is in flight
  assert.equal(s.last.did, 'renew');
  assert.equal(at({}, 7).t, 300);
  assert.equal(at({}, 7).last.did, 'delivered');
});

test('tie-break: the retry is at least 60 s later; a retry not before the next timer is dropped', () => {
  assert.equal(logic.retryAt(300, 525), 412.5);          // half of 225 s
  assert.equal(logic.retryAt(525, 600), 585);            // half of 75 s is 37.5 → 60 s
  assert.equal(logic.retryAt(560, 600), null);           // 560 + 60 = 620 ≥ 600: no retry
});

// ── rules ──

test('rule 1: DISCOVER is broadcast from 0.0.0.0:68 to 255.255.255.255:67', () => {
  const s = at({}, 1);
  const d = m(s, s.last.msg);
  assert.equal(d.type, 'DISCOVER');
  assert.equal(d.bcast, true);
  assert.equal(d.src, '0.0.0.0:68');
  assert.equal(d.dst, '255.255.255.255:67');
  assert.equal(d.f.chaddr, '52:54:00:37:ea:d6');
  assert.equal(s.client.state, 'SELECTING');
});

test('rule 2: every server that is up and has a free address offers, with yiaddr, option 51 and option 54', () => {
  const s = at({ serverB: 'plain' }, 2);
  assert.deepEqual(s.last.acts.map((a) => [a.srv, a.did, a.addr]), [['A', 'offer', '192.168.180.100'], ['B', 'offer', '192.168.180.150']]);
  const offA = m(s, s.last.acts[0].reply);
  assert.equal(offA.type, 'OFFER');
  assert.equal(offA.f.yiaddr, '192.168.180.100');
  assert.equal(offA.f.o51, 600);
  assert.equal(offA.f.o54, A);
  assert.equal(m(s, s.last.acts[1].reply).f.o54, B);
  // an offer is not a binding: nothing in the lease table yet
  assert.deepEqual(srv(s, 'A').leases, []);
  assert.deepEqual(srv(s, 'A').offered, { addr: '192.168.180.100', mac: logic.CLIENT.mac });
  // a full pool offers nothing
  const full = structuredClone(at({}, 1));
  srv(full, 'A').pool = [];
  assert.equal(logic.step(full, 2, P({})).last.acts[0].did, 'full');
});

test('rule 3: the REQUEST after an offer is broadcast and names the chosen server in option 54', () => {
  const s = at({}, 3);
  const r = m(s, s.last.reply);
  assert.equal(r.type, 'REQUEST');
  assert.equal(r.bcast, true);
  assert.equal(r.dst, '255.255.255.255:67');
  assert.equal(r.f.o54, A);
  assert.equal(s.client.state, 'REQUESTING');
});

test('rule 4: the chosen server records the binding and ACKs; the other frees its offered address', () => {
  const s = first({ serverB: 'plain' }, (l) => l.did === 'delivered' && l.type === 'REQUEST');
  const a = s.last.acts.find((x) => x.srv === 'A'), b = s.last.acts.find((x) => x.srv === 'B');
  assert.equal(a.did, 'ack');
  assert.deepEqual(srv(s, 'A').leases, [{ addr: '192.168.180.100', mac: logic.CLIENT.mac, expires: 600 }]);
  assert.equal(srv(s, 'A').offered, null);
  assert.deepEqual([b.did, b.addr], ['freed', '192.168.180.150']);
  assert.equal(srv(s, 'B').offered, null);
  assert.deepEqual(srv(s, 'B').leases, []);
  const bound = first({ serverB: 'plain' }, (l) => l.did === 'bound');
  assert.equal(bound.client.addr, '192.168.180.100');
  assert.equal(bound.client.serverId, 'A');
});

test('rule 5: OFFER and ACK are broadcast with the BROADCAST flag, unicast to yiaddr without it', () => {
  const on = at({}, 2), off = at({ bcastFlag: false }, 2);
  const o1 = m(on, on.last.acts[0].reply), o2 = m(off, off.last.acts[0].reply);
  assert.deepEqual([o1.bcast, o1.dst, o1.f.flagB], [true, '255.255.255.255:68', true]);
  assert.deepEqual([o2.bcast, o2.dst, o2.f.flagB], [false, '192.168.180.100:68', false]);
  const a1 = at({}, 4), a2 = at({ bcastFlag: false }, 4);
  assert.equal(m(a1, a1.last.acts[0].reply).bcast, true);
  assert.equal(m(a2, a2.last.acts[0].reply).bcast, false);
  // the flag changes the picture, not the outcome
  assert.equal(logic.steps(P({ bcastFlag: false })), logic.steps(P({})));
});

test('rule 6: T1 = 0.5 × lease, T2 = 0.875 × lease, exact', () => {
  assert.deepEqual(logic.timers(0, 600), { t1: 300, t2: 525, exp: 600 });
  assert.deepEqual(logic.timers(0, 7200), { t1: 3600, t2: 6300, exp: 7200 });
  assert.deepEqual(logic.timers(0, 691200), { t1: 345600, t2: 604800, exp: 691200 });
  const s = first({}, (l) => l.did === 'bound');
  assert.deepEqual([s.client.t1, s.client.t2, s.client.exp], [300, 525, 600]);
});

test('rule 7: at T1 the client unicasts REQUEST to its server only; the ACK restarts the lease from now', () => {
  const s = first({ serverB: 'plain' }, (l) => l.did === 'renew');
  assert.equal(s.t, 300);
  assert.equal(s.client.state, 'RENEWING');
  const r = m(s, s.last.msg);
  assert.deepEqual([r.bcast, r.to, r.dst, r.src, r.f.ciaddr], [false, ['A'], A + ':67', '192.168.180.100:68', '192.168.180.100']);
  assert.equal(r.f.o54, undefined);
  const e = end({ serverB: 'plain' });
  assert.deepEqual([e.client.state, e.client.leaseStart, e.client.t1, e.client.t2, e.client.exp], ['BOUND', 300, 600, 825, 900]);
  assert.equal(srv(e, 'A').leases[0].expires, 900);
  const ack = m(e, e.last.msg);
  assert.deepEqual([ack.bcast, ack.dst], [false, '192.168.180.100:68']);
});

test('rule 8: at T2 the client broadcasts REQUEST; only a server that knows the lease ACKs, others stay silent', () => {
  const rb = first({ serverB: 'plain', failAt: 't1' }, (l) => l.did === 'rebind');
  assert.equal(rb.t, 525);
  const r = m(rb, rb.last.msg);
  assert.deepEqual([r.bcast, r.dst, r.f.ciaddr, r.f.o54], [true, '255.255.255.255:67', '192.168.180.100', undefined]);
  assert.deepEqual(r.lost, ['A']);
  const plain = first({ serverB: 'plain', failAt: 't1' }, (l) => l.did === 'delivered' && l.type === 'REQUEST' && l.t === 525);
  assert.deepEqual(plain.last.acts.map((a) => [a.srv, a.did]), [['B', 'silent']]);
  assert.equal(plain.client.state, 'REBINDING');
  const partner = first({ serverB: 'partner', failAt: 't1' }, (l) => l.did === 'delivered' && l.type === 'REQUEST' && l.t === 525);
  assert.deepEqual(partner.last.acts.map((a) => [a.srv, a.did]), [['B', 'ack']]);
  const e = end({ serverB: 'partner', failAt: 't1' });
  assert.deepEqual([e.client.state, e.client.serverId, e.client.addr, e.client.leaseStart, e.client.exp], ['BOUND', 'B', '192.168.180.100', 525, 1125]);
});

test('rule 8: a failover partner holds a copy of the binding and stays silent to DISCOVER while A is up', () => {
  const s = at({ serverB: 'partner' }, 2);
  assert.deepEqual(s.last.acts.map((a) => [a.srv, a.did]), [['A', 'offer'], ['B', 'standby']]);
  const ack = first({ serverB: 'partner' }, (l) => l.did === 'delivered' && l.type === 'REQUEST');
  assert.equal(ack.last.acts[0].copy, 'B');
  assert.deepEqual(srv(ack, 'B').leases, srv(ack, 'A').leases);
});

test('rule 9: no answer → one retry after half the time left, at least 60 s (server-dies: 412.5 s and 585 s)', () => {
  const r = run({ failAt: 't1' }).filter((s) => s.last && (s.last.did === 'renew' || s.last.did === 'retry' || s.last.did === 'rebind'));
  // one retry per state: none at 472.5 s (412.5 + 60 is still before T2, but the model retries once)
  assert.deepEqual(r.map((s) => [s.last.did, s.t, m(s, s.last.msg).state]),
    [['renew', 300, 'lost'], ['retry', 412.5, 'lost'], ['rebind', 525, 'lost'], ['retry', 585, 'lost']]);
  assert.equal(r[1].last.phase, 'RENEWING');
  assert.equal(r[3].last.phase, 'REBINDING');
});

test('rule 10: at expiry the client drops the address and starts again with DISCOVER; no offer → stays INIT', () => {
  const e = end({ failAt: 't1' });
  assert.equal(e.last.did, 'expire');
  assert.equal(e.t, 600);
  assert.equal(e.last.addr, '192.168.180.100');
  assert.equal(e.last.lost, true);
  assert.equal(m(e, e.last.msg).type, 'DISCOVER');
  assert.equal(m(e, e.last.msg).src, '0.0.0.0:68');
  assert.deepEqual([e.client.state, e.client.addr], ['INIT', null]);
  assert.equal(e.done, true);
  // with a plain B up, the new DISCOVER gets B's offer: a different address from another server
  const b = end({ serverB: 'plain', failAt: 't1' });
  assert.deepEqual([b.client.state, b.client.serverId, b.client.addr, b.client.leaseStart], ['BOUND', 'B', '192.168.180.150', 600]);
});

test('rule 11: RELEASE frees the binding at once; switched off without it, the server keeps it to expiry', () => {
  const rel = end({ lease: 7200, leave: 'release' });
  assert.equal(rel.t, 3000);
  assert.deepEqual(rel.last.acts.map((a) => [a.srv, a.did, a.addr]), [['A', 'released', '192.168.180.100']]);
  assert.deepEqual(srv(rel, 'A').leases, []);
  const off = run({ lease: 7200, leave: 'off' });
  const leave = off.find((s) => s.last && s.last.did === 'off');
  assert.equal(leave.t, 3000);
  assert.equal(leave.last.until, 7200);
  assert.deepEqual(srv(leave, 'A').leases.map((l) => l.addr), ['192.168.180.100']);
  const last = off[off.length - 1];
  assert.deepEqual([last.last.did, last.t, srv(last, 'A').leases.length], ['serverExpire', 7200, 0]);
});

test('rule 11: a NAK sends the client to INIT; a server without the binding NAKs a renewing REQUEST', () => {
  const p = P({});
  const s = structuredClone(kit.stateAt(logic, p, 6));     // renewal REQUEST in flight
  srv(s, 'A').leases = [];                                // A lost the binding
  const s7 = logic.step(s, 7, p);
  assert.equal(s7.last.acts[0].did, 'nak');
  const nak = m(s7, s7.last.acts[0].reply);
  assert.deepEqual([nak.type, nak.bcast], ['NAK', true]);
  const s8 = logic.step(s7, 8, p);
  assert.deepEqual([s8.last.did, s8.client.state, s8.client.addr], ['nak', 'INIT', null]);
  const s9 = logic.step(s8, 9, p);
  assert.equal(s9.last.did, 'discover');
  assert.equal(s9.t, 300);
});

test('option change: the client sees a new option only at its next ACK (T1)', () => {
  const r = run({ lease: 691200, optChange: true });
  const ch = r.find((s) => s.last && s.last.did === 'opt');
  assert.equal(ch.t, 86400);
  assert.equal(srv(ch, 'A').opts.dns, logic.NEW_DNS);
  assert.equal(ch.client.opts.dns, logic.OPTS.dns);
  const e = r[r.length - 1];
  assert.deepEqual([e.t, e.last.how, e.last.dnsChanged, e.client.opts.dns], [345600, 'renew', true, logic.NEW_DNS]);
  // with a failing server the option change is left out (one story at a time)
  assert.deepEqual(logic.events(P({ optChange: true, failAt: 't1' })).map((x) => x.kind), ['down']);
});

test('rule 2: a server offers the client\'s existing binding, and skips an address offered to another MAC', () => {
  const srvA = { id: 'A', pool: ['10.0.0.100', '10.0.0.101', '10.0.0.102'], leases: [{ addr: '10.0.0.101', mac: 'm1', expires: 9 }], offered: { addr: '10.0.0.100', mac: 'm2' } };
  assert.equal(logic.freeAddr(srvA, 'm1'), '10.0.0.101');
  assert.equal(logic.freeAddr(srvA, 'm3'), '10.0.0.102');
  assert.equal(logic.freeAddr(srvA, 'm2'), '10.0.0.100');
});

test('rule 9: retry time for a 2 h lease, and none when it would land on the next timer', () => {
  const r = run({ lease: 7200, failAt: 't1' }).filter((s) => s.last && s.last.did === 'retry').map((s) => s.t);
  assert.deepEqual(r, [3600 + 1350, 6300 + 450]);
  assert.equal(logic.retryAt(540, 600), null);            // 540 + 60 = 600: not before expiry
});

test('rule 10: after expiry the client holds no address; the new lease runs from the new ACK', () => {
  const ex = first({ serverB: 'plain', failAt: 't1' }, (l) => l.did === 'expire');
  assert.deepEqual([ex.client.addr, ex.lostAddr], [null, '192.168.180.100']);
  assert.equal(srv(end({ serverB: 'plain', failAt: 't1' }), 'B').leases[0].expires, 1200);
});

test('rule 10: a DISCOVER that reaches servers but gets no offer leaves the client in INIT and ends the run', () => {
  const p = P({});
  const s = structuredClone(kit.stateAt(logic, p, 1));
  srv(s, 'A').pool = [];
  const s2 = logic.step(s, 2, p);
  assert.deepEqual([s2.client.state, s2.client.startAt, s2.done], ['INIT', null, true]);
});

test('partner copy follows RELEASE and server expiry; a down server\'s records never expire', () => {
  const rel = first({ serverB: 'partner', lease: 7200, leave: 'release' }, (l) => l.did === 'delivered' && l.type === 'RELEASE');
  assert.deepEqual([rel.t, srv(rel, 'B').leases], [3000, []]);
  const off = end({ serverB: 'partner', lease: 7200, leave: 'off' });
  assert.deepEqual([srv(off, 'A').leases, srv(off, 'B').leases], [[], []]);
  const down = run({ failAt: 't1', leave: 'off' });
  assert.equal(down.length - 1, 7);
  assert.equal(down[down.length - 1].t, 290);
});

test('rule 11: a NAK is ignored by a client that is not waiting for an answer', () => {
  const p = P({});
  const s = structuredClone(kit.stateAt(logic, p, 5));      // BOUND
  s.msgs.push({ n: 99, t: 0, type: 'NAK', from: 'A', to: ['C'], bcast: true, f: {}, lost: [], got: [], ignored: [], react: {}, state: 'flight' });
  s.queue.push(99);
  const s6 = logic.step(s, 6, p);
  assert.deepEqual([s6.client.state, s6.client.addr], ['BOUND', '192.168.180.100']);
});

test('option change reaches every server', () => {
  const ch = run({ serverB: 'plain', optChange: true }).find((s) => s.last && s.last.did === 'opt');
  assert.deepEqual(ch.servers.map((x) => x.opts.dns), [logic.NEW_DNS, logic.NEW_DNS]);
});

// ── presets and step counts (SPEC.md table) ──

test('step counts per preset; defaults give sim.json steps; no combination over 20', () => {
  const want = { 'lease-600': 8, 'two-servers': 8, 'server-dies': 11, 'rebind-to-b': 11, 'no-backup': 17, 'classroom-2h': 7, 'windows-8d': 9 };
  for (const [id, over] of Object.entries(PRESETS)) assert.equal(logic.steps(P(over)), want[id], id);
  const json = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(json.steps, logic.steps(P({})));
  let max = 0;
  for (const lease of logic.LEASES) for (const serverB of ['none', 'plain', 'partner']) for (const failAt of ['none', 't1', 't2'])
    for (const leave of ['stay', 'off', 'release']) for (const optChange of [false, true]) for (const bcastFlag of [true, false])
      max = Math.max(max, logic.steps({ lease, serverB, failAt, leave, optChange, bcastFlag }));
  assert.equal(max, 20);
});

test('preset outcomes: lease-600 renews at 300 s; server-dies goes down at 290 s', () => {
  assert.deepEqual(did({}), ['discover', 'delivered', 'choose', 'delivered', 'bound', 'renew', 'delivered', 'bound']);
  assert.deepEqual(did({ failAt: 't1' }), ['discover', 'delivered', 'choose', 'delivered', 'bound', 'down', 'renew', 'retry', 'rebind', 'retry', 'expire']);
  assert.equal(run({ failAt: 't1' })[6].t, 290);
  assert.equal(run({ failAt: 't2' }).find((s) => s.last && s.last.did === 'down').t, 515);
});

test('the lease bar history: BOUND, RENEWING, REBINDING, INIT with their start times', () => {
  assert.deepEqual(end({ failAt: 't1' }).hist, [{ at: 0, state: 'BOUND' }, { at: 300, state: 'RENEWING' }, { at: 525, state: 'REBINDING' }, { at: 600, state: 'INIT' }]);
  assert.deepEqual(end({}).hist, [{ at: 0, state: 'BOUND' }]);         // a renewal answered at once leaves no gap
  assert.deepEqual(end({ lease: 7200, leave: 'off' }).hist, [{ at: 0, state: 'BOUND' }, { at: 3000, state: 'OFF' }]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of Object.values(PRESETS)) for (const s of run(over)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of Object.values(PRESETS)) {
    const p = P(over);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ serverB: 'plain', failAt: 't1' });
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

test('every preset in the page is valid for the model and matches this file', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((x) => [...x[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  for (const id of Object.keys(PRESETS)) assert.ok(html.includes(`id: '${id}'`), `preset ${id} in the page`);
});
