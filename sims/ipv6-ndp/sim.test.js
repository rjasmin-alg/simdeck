// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ipv6-ndp's model (rules: SPEC.md). Run: node --test sims/ipv6-ndp/
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
/** The state right after the first event `phase` of `lane`. */
function after(over, lane, phase, k) {
  const p = P(over);
  const sched = logic.schedule(p);
  const i = sched.findIndex((e) => e.lane === lane && e.ev.phase === phase && (k == null || e.ev.k === k));
  assert.ok(i >= 0, `${lane} ${phase} in the run`);
  return kit.stateAt(logic, p, i + 1);
}

const B_LL = 'fe80::204:61ff:fe9d:f156';
const B_MAC = '00:04:61:9d:f1:56';
const A_LL = 'fe80::200:5eff:fe00:530a';
const A_MAC = '00:00:5e:00:53:0a';

// ── tie-breaks first ──

test('rule 5 tie-break: with collide, B and C both accept the NS, only B (the target) answers', () => {
  const f = after({ collide: true, lanes: 'v6' }, 'v6', 'filter');
  assert.deepEqual(f.v6.accepted, ['B', 'C']);
  assert.deepEqual(f.v6.dropped, []);
  assert.deepEqual(f.v6.inspected, ['B', 'C']);
  const c = after({ collide: true, lanes: 'v6' }, 'v6', 'check');
  assert.deepEqual(c.v6.verdicts, { B: 'mine', C: 'notMine' });
  assert.equal(c.v6.table.C.length, 0, 'C discards the NS: no entry for A');
  const r = after({ collide: true, lanes: 'v6' }, 'v6', 'reply');
  assert.equal(r.v6.frame.from, 'B');
});

test('rule 5 tie-break, the other way: target C with collide, B in the group stays silent', () => {
  const c = after({ target: 'C', collide: true, lanes: 'v6' }, 'v6', 'check');
  assert.deepEqual(c.v6.verdicts, { B: 'notMine', C: 'mine' });
  assert.equal(c.v6.table.B.length, 0);
  assert.equal(end({ target: 'C', collide: true, lanes: 'v6' }).v6.table.A[0].mac, '10:34:56:9d:f1:56');
});

test('rule 1 tie-break: the ARP target adds the asker, a non-target with no entry adds nothing', () => {
  const c = after({}, 'v4', 'check');
  assert.deepEqual(c.v4.verdicts, { B: 'mine', C: 'notMine' });
  assert.deepEqual(c.v4.table.B.map((e) => [e.ip, e.mac]), [['192.168.1.10', A_MAC]]);
  assert.deepEqual(c.v4.table.C, []);
});

// ── rules ──

test('rule 1: the ARP request is a broadcast every other host takes; the reply is unicast; A learns B', () => {
  const r = after({}, 'v4', 'req');
  assert.equal(r.v4.frame.dstMac, 'ff:ff:ff:ff:ff:ff');
  assert.equal(r.v4.frame.targetIp, '192.168.1.20');
  const f = after({}, 'v4', 'filter');
  assert.deepEqual(f.v4.accepted, ['B', 'C']);
  assert.deepEqual(f.v4.inspected, ['B', 'C']);
  const rep = after({}, 'v4', 'reply');
  assert.equal(rep.v4.frame.dstMac, A_MAC);
  assert.equal(rep.v4.frame.from, 'B');
  assert.equal(rep.v4.frame.senderIp, '192.168.1.20');
  assert.equal(rep.v4.frame.senderMac, B_MAC);
  assert.equal(rep.v4.frame.targetIp, '192.168.1.10');
  assert.deepEqual(end({}).v4.table.A.map((e) => [e.ip, e.mac]), [['192.168.1.20', B_MAC]]);
});

test('rule 2: a host joins ff02::1 and the solicited-node group of each address (low 24 bits)', () => {
  assert.equal(logic.solicitedNode(B_LL), 'ff02::1:ff9d:f156');
  assert.equal(logic.solicitedNode('fe80::99'), 'ff02::1:ff00:99');
  assert.equal(logic.solicitedNode('2001:db8:1:0:200:5eff:fe00:530a'), 'ff02::1:ff00:530a');
  const H = logic.hosts(P({}));
  assert.deepEqual(H.B.groups, ['ff02::1', 'ff02::1:ff9d:f156']);
  assert.equal(H.B.ll, B_LL);
  assert.equal(H.A.ll, A_LL);
  const Hc = logic.hosts(P({ collide: true }));
  assert.equal(Hc.C.ll, 'fe80::1234:56ff:fe9d:f156');
  assert.deepEqual(Hc.C.groups, Hc.B.groups);
  const Hf = logic.hosts(P({ forged: true }));
  assert.deepEqual(Hf.A.groups, ['ff02::1', 'ff02::1:ff00:530a'], 'the global joins the group the link-local already did');
});

test('rule 3: multicast MAC is 33:33 + the low 32 bits; a card passes only its own groups', () => {
  assert.equal(logic.multicastMac('ff02::1:ff9d:f156'), '33:33:ff:9d:f1:56');
  assert.equal(logic.multicastMac('ff02::1'), '33:33:00:00:00:01');
  assert.equal(logic.multicastMac('ff02::1:ff00:99'), '33:33:ff:00:00:99');
  const H = logic.hosts(P({}));
  assert.deepEqual(H.B.nic6, [B_MAC, '33:33:00:00:00:01', '33:33:ff:9d:f1:56']);
  assert.deepEqual(H.B.nic4, [B_MAC, 'ff:ff:ff:ff:ff:ff']);
  const f = after({}, 'v6', 'filter');
  assert.deepEqual(f.v6.accepted, ['B']);
  assert.deepEqual(f.v6.dropped, ['C']);
  assert.deepEqual(f.v6.inspected, ['B']);
  const fc = after({ target: 'C' }, 'v6', 'filter');
  assert.deepEqual(fc.v6.accepted, ['C']);
  assert.deepEqual(fc.v6.dropped, ['B']);
});

test('rule 4: the NS goes from A\'s link-local to the solicited-node group, hop limit 255, with A\'s MAC; INCOMPLETE', () => {
  const r = after({}, 'v6', 'req');
  const f = r.v6.frame;
  assert.equal(f.kind, 'ns');
  assert.equal(f.type, 135);
  assert.equal(f.src, A_LL);
  assert.equal(f.dst, 'ff02::1:ff9d:f156');
  assert.equal(f.dstMac, '33:33:ff:9d:f1:56');
  assert.equal(f.hopLimit, 255);
  assert.equal(f.target, B_LL);
  assert.equal(f.slla, A_MAC);
  assert.deepEqual(r.v6.table.A.map((e) => [e.ip, e.mac, e.state]), [[B_LL, null, 'INCOMPLETE']]);
  assert.equal(r.v6.timer, 'running');
  assert.equal(after({}, 'v6', 'miss').v6.table.A.length, 0, 'no entry before the NS');
});

test('rule 5: the owner caches the asker as STALE from the source link-layer option', () => {
  const c = after({}, 'v6', 'check');
  assert.deepEqual(c.v6.verdicts, { B: 'mine' });
  assert.deepEqual(c.v6.table.B.map((e) => [e.ip, e.mac, e.state]), [[A_LL, A_MAC, 'STALE']]);
});

test('rule 6: the NA is unicast to A, S = 1, O = 1, R = 0, with B\'s MAC; the entry becomes REACHABLE', () => {
  const r = after({}, 'v6', 'reply');
  const f = r.v6.frame;
  assert.equal(f.type, 136);
  assert.equal(f.cast, 'unicast');
  assert.equal(f.src, B_LL);
  assert.equal(f.dst, A_LL);
  assert.equal(f.dstMac, A_MAC);
  assert.equal(f.hopLimit, 255);
  assert.deepEqual([f.S, f.O, f.R], [1, 1, 0]);
  assert.equal(f.tlla, B_MAC);
  assert.equal(r.v6.table.A[0].state, 'INCOMPLETE', 'still INCOMPLETE until the NA arrives');
  const e = end({});
  assert.deepEqual(e.v6.table.A.map((x) => [x.ip, x.mac, x.state]), [[B_LL, B_MAC, 'REACHABLE']]);
  assert.equal(e.v6.timer, 'stopped');
  assert.equal(e.v6.result, 'resolved');
});

test('rule 7: a forged NA crosses router R (255 → 254) and is dropped; B\'s entry is kept', () => {
  assert.equal(logic.ndpValid({ hopLimit: 255 }), true);
  assert.equal(logic.ndpValid({ hopLimit: 254 }), false);
  assert.equal(logic.ndpValid({ hopLimit: 64 }), false);
  const forge = at({ forged: true }, 1).v6.frame;
  assert.deepEqual([forge.from, forge.to, forge.hopLimit, forge.S, forge.O, forge.R], ['X', 'R', 255, 0, 1, 0]);
  assert.equal(forge.target, B_LL);
  assert.equal(forge.tlla, '00:00:5e:00:53:66', 'a MAC that is not B\'s');
  assert.equal(forge.dst, '2001:db8:1:0:200:5eff:fe00:530a', 'A\'s global: a router does not forward to a link-local');
  const fwd = at({ forged: true }, 2).v6.frame;
  assert.deepEqual([fwd.from, fwd.to, fwd.hopLimit, fwd.srcMac, fwd.dstMac], ['R', 'A', 254, '00:00:5e:00:53:01', A_MAC]);
  const acc = at({ forged: true }, 3);
  assert.deepEqual(acc.v6.accepted, ['A']);
  assert.deepEqual(acc.v6.inspected, ['A']);
  const e = end({ forged: true });
  assert.equal(e.v6.result, 'dropped');
  assert.deepEqual(e.v6.inspected, ['A']);
  assert.deepEqual(e.v6.table.A.map((x) => [x.ip, x.mac, x.state, x.mark]), [[B_LL, B_MAC, 'REACHABLE', 'hit']]);
});

test('rule 8: no answer: 3 NS 1 s apart, then the entry is deleted at 3 s, address unreachable', () => {
  const p = { target: 'absent', lanes: 'v6' };
  const times = [1, 2, 3].map((k) => after(p, 'v6', 'req', k).v6.t);
  assert.deepEqual(times, [0, 1, 2]);
  [1, 2, 3].forEach((k) => assert.deepEqual(after(p, 'v6', 'filter', k).v6.accepted, []));
  assert.equal(after(p, 'v6', 'req', 3).v6.table.A.length, 1, 'one INCOMPLETE entry, not one per NS');
  const e = end(p);
  assert.equal(e.v6.t, 3);
  assert.equal(e.v6.table.A.length, 0);
  assert.equal(e.v6.result, 'unreachable');
  assert.equal(e.v6.timer, 'expired');
  assert.deepEqual(e.v6.inspected, []);
  assert.equal(logic.C.maxMulticastSolicit, 3);
  assert.equal(logic.C.retransTimer, 1);
});

test('the ARP lane with no owner: three requests, B and C look each time, no entry, nobody answers', () => {
  const e = end({ target: 'absent' });
  assert.deepEqual(e.v4.inspected, ['B', 'C', 'B', 'C', 'B', 'C']);
  assert.deepEqual(e.v4.table, { A: [], B: [], C: [] });
  assert.equal(e.v4.result, 'unreachable');
  assert.deepEqual(after({ target: 'absent' }, 'v4', 'filter', 1).v4.verdicts, { B: 'notMine', C: 'notMine' });
});

test('the lanes alternate, IPv4 first, and line up event by event', () => {
  const sched = logic.schedule(P({}));
  assert.deepEqual(sched.map((e) => e.lane), ['v4', 'v6', 'v4', 'v6', 'v4', 'v6', 'v4', 'v6', 'v4', 'v6', 'v4', 'v6']);
  assert.deepEqual(sched.filter((e) => e.lane === 'v4').map((e) => e.ev.phase), ['miss', 'req', 'filter', 'check', 'reply', 'cache']);
  assert.deepEqual(sched.filter((e) => e.lane === 'v6').map((e) => e.ev.phase), ['miss', 'req', 'filter', 'check', 'reply', 'cache']);
  const s = at({}, 3);
  assert.equal(s.v6.phase, 'miss', 'the lane not stepped keeps its state');
});

test('presets: step counts and the counters (task: side-by-side, same-group, absent, forged)', () => {
  assert.equal(logic.steps(P({})), 12);
  assert.equal(logic.steps(P({ collide: true, lanes: 'v6' })), 6);
  assert.equal(logic.steps(P({ target: 'absent', lanes: 'v6' })), 8);
  assert.equal(logic.steps(P({ forged: true })), 4);
  assert.equal(logic.steps(P({ forged: true, lanes: 'both', target: 'absent' })), 4, 'forged ignores the other params');
  assert.equal(logic.steps(P({ target: 'absent' })), 16);
  const e = end({});
  assert.equal(e.v4.inspected.length, 2);
  assert.equal(e.v6.inspected.length, 1);
  assert.equal(end({ collide: true, lanes: 'v6' }).v6.inspected.length, 2);
  assert.equal(end({ collide: true, lanes: 'v6' }).v4, null);
});

test('rule 7 at the asker: an NA that is not 255 leaves the entry INCOMPLETE; a valid forged one would override', () => {
  const p = P({}), H = logic.hosts(p);
  const s = at({}, 10).v6;                                          // after the NA was sent, before A takes it
  assert.equal(s.phase, 'reply');
  const bad = structuredClone(s); bad.frame.hopLimit = 64;
  const out = logic.stepLane(bad, { phase: 'cache', k: 1 }, p, H);
  assert.deepEqual(out.table.A.map((x) => [x.mac, x.state]), [[null, 'INCOMPLETE']]);
  assert.equal(out.result, 'dropped');
  assert.equal(out.timer, 'running');
  const pf = P({ forged: true }), Hf = logic.hosts(pf);
  const f = structuredClone(at({ forged: true }, 3).v6); f.frame.hopLimit = 255;
  const o = logic.stepLane(f, { phase: 'drop' }, pf, Hf);
  assert.equal(o.result, 'overridden');
  assert.deepEqual(o.table.A.map((x) => [x.mac, x.state]), [['00:00:5e:00:53:66', 'STALE']]);
});

test('RFC 826 merge and RFC 4861 §7.2.3 update: an entry for the asker is refreshed, never duplicated', () => {
  const p = P({}), H = logic.hosts(p);
  for (const lane of ['v4', 'v6']) {
    const s = structuredClone(after({}, lane, 'filter')[lane]);
    const ip = lane === 'v4' ? H.A.v4 : H.A.ll;
    s.table.B.push({ ip, mac: '00:00:5e:00:53:99', state: lane === 'v6' ? 'STALE' : null, mark: null });
    s.table.C.push({ ip, mac: '00:00:5e:00:53:99', state: lane === 'v6' ? 'STALE' : null, mark: null });
    const o = logic.stepLane(s, { phase: 'check', k: 1 }, p, H);
    assert.deepEqual(o.table.B.map((e) => [e.mac, e.mark]), [[A_MAC, 'refreshed']], lane + ' owner');
    if (lane === 'v4') assert.deepEqual(o.table.C.map((e) => [e.mac, e.mark]), [[A_MAC, 'refreshed']], 'ARP: a listener refreshes');
    else assert.deepEqual(o.table.C.map((e) => e.mac), ['00:00:5e:00:53:99'], 'NDP: C\'s card dropped the NS, nothing changes');
  }
  const s4 = structuredClone(after({}, 'v4', 'reply').v4);
  s4.table.A.push({ ip: H.B.v4, mac: '00:00:5e:00:53:99', state: null, mark: null });
  const o4 = logic.stepLane(s4, { phase: 'cache', k: 1 }, p, H);
  assert.deepEqual(o4.table.A.map((e) => [e.mac, e.mark]), [[B_MAC, 'refreshed']]);
});

// ── generic checks every sim keeps ──

const RUNS = [{}, { target: 'C' }, { collide: true }, { target: 'absent' }, { target: 'absent', lanes: 'v6' },
  { collide: true, lanes: 'v6' }, { forged: true }, { target: 'C', collide: true, lanes: 'v6' }];

test('state is JSON-safe at every step', () => {
  for (const r of RUNS) {
    for (let n = 0; n <= logic.steps(P(r)); n++) {
      const s = at(r, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const r of RUNS) {
    const p = P(r), N = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= N; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = N; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
    assert.equal(forward[N].done, true);
  }
});

test('step does not mutate its input', () => {
  for (const r of RUNS) {
    const p = P(r);
    let s = logic.initial(p);
    for (let n = 1; n <= logic.steps(p); n++) {
      const copy = structuredClone(s);
      const next = logic.step(s, n, p);
      assert.deepEqual(s, copy);
      s = next;
    }
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, and sim.json steps is the default run', () => {
  const fs = require('node:fs'), path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  const ids = [...html.matchAll(/\{ id: '([\w-]+)', label:/g)].map((m) => m[1]);
  for (const e of json.entries) assert.ok(ids.includes(e.preset), `entry ${e.preset} is a preset`);
});
