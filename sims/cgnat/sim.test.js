// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cgnat's model (rules in SPEC.md). Run: node --test sims/cgnat/
// Tie-breaks first, then one test per rule, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.stepsFor(P(over)));
const e = (s) => s.ip + ':' + s.port;

const PRESETS = {
  'outbound-works': { direction: 'outbound', senders: 'one', portForward: false, subscribers: 2 },
  'inbound-dropped': { direction: 'inbound', portForward: false },
  'port-forward-fails': { direction: 'inbound', portForward: true },
  'shared-address': { direction: 'outbound', senders: 'all', subscribers: 2 }
};

// ── rule 7: tie-breaks ──

test('rule 7: each NAT gives the lowest free port; equal inside endpoints behind two homes get 62000 and 62001', () => {
  const s = end(PRESETS['shared-address']);
  // both home routers hand out their own first port, 61000
  assert.deepEqual(s.homes.map((h) => e(h.table[0].outside)), ['100.64.0.5:61000', '100.64.0.6:61000']);
  assert.deepEqual(s.homes.map((h) => e(h.table[0].inside)), ['192.168.1.10:51000', '192.168.1.10:51000']);
  // the CGN tells them apart by port, in the order they arrive
  assert.deepEqual(s.cgn.map((r) => e(r.inside) + '>' + e(r.outside)),
    ['100.64.0.5:61000>203.0.113.5:62000', '100.64.0.6:61000>203.0.113.5:62001']);
  const three = end({ direction: 'outbound', senders: 'all', subscribers: 3 });
  assert.deepEqual(three.cgn.map((r) => r.outside.port), [62000, 62001, 62002]);
});

test('rule 7: a freed hole is filled first; the CGN starts at 62000, the home router at 61000', () => {
  const t = [{ inside: { ip: 'x', port: 1 }, outside: { ip: '203.0.113.5', port: 62001 }, dest: { ip: 'd', port: 1 } }];
  assert.equal(logic.freePort(t, '203.0.113.5', 62000), 62000);
  const r = logic.translateOut(t, logic.cgnNat, { src: { ip: '100.64.0.9', port: 61000 }, dst: logic.server });
  assert.equal(r.out.src.port, 62000);
  const h = logic.translateOut([], logic.homeNat(0), { src: { ip: '192.168.1.10', port: 51000 }, dst: logic.server });
  assert.equal(e(h.out.src), '100.64.0.5:61000');
  // the copy keeps nat's default when no first port is given
  assert.equal(logic.translateOut([], { mode: 'pat', pool: ['203.0.113.5'] }, { src: { ip: 'a', port: 1 }, dst: logic.server }).out.src.port, 61000);
});

test('rule 7: the same connection reuses its row', () => {
  const pkt = { src: { ip: '100.64.0.5', port: 61000 }, dst: logic.server };
  const a = logic.translateOut([], logic.cgnNat, pkt);
  const b = logic.translateOut(a.table, logic.cgnNat, pkt);
  assert.equal(b.outcome, 'reuse');
  assert.equal(b.table.length, 1);
  assert.equal(b.out.src.port, 62000);
});

// ── rule 1 and 4: translate twice out, twice back ──

test('rules 1 and 4: outbound-works: A leaves as 203.0.113.5:62000 and the reply comes home through both rows', () => {
  const p = PRESETS['outbound-works'];
  assert.equal(logic.stepsFor(P(p)), 6);
  const hdr = [1, 2, 3, 4, 5, 6].map((n) => { const s = at(p, n); return e(s.packet.src) + '>' + e(s.packet.dst); });
  assert.deepEqual(hdr, [
    '192.168.1.10:51000>198.51.100.10:443',
    '100.64.0.5:61000>198.51.100.10:443',
    '203.0.113.5:62000>198.51.100.10:443',
    '198.51.100.10:443>203.0.113.5:62000',
    '198.51.100.10:443>100.64.0.5:61000',
    '198.51.100.10:443>192.168.1.10:51000'
  ]);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((n) => at(p, n).phase), ['send', 'nat1', 'nat2', 'reply', 'back2', 'back1']);
  // the rewritten field and its old value
  assert.deepEqual(at(p, 2).packet.was, { field: 'src', ep: { ip: '192.168.1.10', port: 51000 } });
  assert.deepEqual(at(p, 3).packet.was, { field: 'src', ep: { ip: '100.64.0.5', port: 61000 } });
  assert.deepEqual(at(p, 5).packet.was, { field: 'dst', ep: { ip: '203.0.113.5', port: 62000 } });
  assert.deepEqual(at(p, 6).packet.was, { field: 'dst', ep: { ip: '100.64.0.5', port: 61000 } });
  assert.equal(at(p, 1).packet.was, null);
  assert.equal(at(p, 4).packet.was, null);
  // the rows: written on the way out, looked up on the way back
  assert.deepEqual(at(p, 2).lookup, { box: 'hA', row: 0, result: 'new' });
  assert.deepEqual(at(p, 3).lookup, { box: 'cgn', row: 0, result: 'new' });
  assert.deepEqual(at(p, 5).lookup, { box: 'cgn', row: 0, result: 'hit' });
  assert.deepEqual(at(p, 6).lookup, { box: 'hA', row: 0, result: 'hit' });
  assert.equal(end(p).verdict, 'delivered');
  // B is drawn but sends nothing
  assert.equal(end(p).homes.length, 2);
  assert.equal(end(p).homes[1].table.length, 0);
});

test('rule 4: what the server sees is the CGN address and port, nothing the subscriber chose', () => {
  const s = at(PRESETS['outbound-works'], 3);
  assert.deepEqual(s.seen, [{ ip: '203.0.113.5', port: 62000 }]);
  assert.equal(logic.addressSpace(s.seen[0].ip), 'public');
  assert.notEqual(s.seen[0].port, logic.srcPort);
});

// ── rule 2: one-way sessions, at each NAT ──

test('rule 2: an unsolicited packet to 203.0.113.5:62050 has no CGN row and is dropped at the CGN', () => {
  const p = PRESETS['inbound-dropped'];
  assert.equal(logic.stepsFor(P(p)), 3);
  const s1 = at(p, 1);
  assert.equal(e(s1.packet.dst), '203.0.113.5:62050');
  assert.equal(s1.packet.drop, false);
  const s2 = at(p, 2);
  assert.deepEqual(s2.lookup, { box: 'cgn', row: -1, result: 'miss' });
  assert.equal(s2.packet.to, 'cgn');
  assert.equal(s2.packet.drop, true);
  assert.equal(s2.verdict, 'dropped');
  const s3 = at(p, 3);
  assert.equal(s3.packet, null);
  assert.equal(s3.verdict, 'dropped');
});

test('rule 2: each NAT reads only its own table', () => {
  // a CGN row does not open home B; a home row does not open the CGN
  const s = at(PRESETS['outbound-works'], 3);
  const reply = { src: logic.server, dst: { ip: '100.64.0.6', port: 61000 } };
  assert.equal(logic.homeIn(s.homes[1], 1, reply).result, 'miss');
  assert.equal(logic.translateIn(s.cgn, logic.cgnNat, { src: logic.server, dst: { ip: '203.0.113.5', port: 61000 } }).row, -1);
  assert.equal(logic.translateIn(s.cgn, logic.cgnNat, { src: logic.server, dst: { ip: '203.0.113.5', port: 62000 } }).row, 0);
});

// ── rule 3: shared address space ──

test('rule 3: 100.64.0.0/10 is shared, neither private nor public, and the internet does not carry it', () => {
  assert.equal(logic.addressSpace('100.64.0.0'), 'shared');
  assert.equal(logic.addressSpace('100.127.255.255'), 'shared');
  assert.equal(logic.addressSpace('100.63.255.255'), 'public');
  assert.equal(logic.addressSpace('100.128.0.0'), 'public');
  assert.equal(logic.addressSpace('192.168.1.10'), 'private');
  assert.equal(logic.addressSpace('10.1.2.3'), 'private');
  assert.equal(logic.addressSpace('172.31.255.255'), 'private');
  assert.equal(logic.addressSpace('172.32.0.0'), 'public');
  assert.equal(logic.addressSpace('203.0.113.5'), 'public');
  assert.equal(logic.routable('100.64.0.5'), false);
  assert.equal(logic.routable('192.168.1.10'), false);
  assert.equal(logic.routable('203.0.113.5'), true);
  for (const s of logic.subs) assert.equal(logic.addressSpace(s.cpe), 'shared');
  assert.equal(logic.addressSpace(logic.cgnInside), 'shared');
});

// ── rule 5: port forwarding on the home router does not help ──

test('rule 5: port-forward-fails: 203.0.113.5:8080 dies at the CGN, the forward is never read; 100.64.0.5:8080 is unreachable', () => {
  const p = PRESETS['port-forward-fails'];
  assert.equal(logic.stepsFor(P(p)), 4);
  assert.deepEqual(at(p, 0).homes[0].forwards, [{ outside: { ip: '100.64.0.5', port: 8080 }, inside: { ip: '192.168.1.10', port: 8080 } }]);
  assert.equal(e(at(p, 1).packet.dst), '203.0.113.5:8080');
  const s2 = at(p, 2);
  assert.equal(s2.lookup.box, 'cgn');
  assert.equal(s2.lookup.result, 'miss');
  assert.equal(s2.packet.drop, true);
  // no step ever looks at a home router
  for (let n = 0; n <= 4; n++) assert.ok(!at(p, n).lookup || at(p, n).lookup.box === 'cgn');
  const s4 = at(p, 4);
  assert.equal(e(s4.packet.dst), '100.64.0.5:8080');
  assert.equal(s4.packet.to, 'net');
  assert.equal(s4.packet.drop, true);
  assert.equal(s4.verdict, 'unreachable');
});

test('rule 5: the forward itself works when a packet reaches the home router', () => {
  const home = at(PRESETS['port-forward-fails'], 0).homes[0];
  const got = logic.homeIn(home, 0, { src: logic.client, dst: { ip: '100.64.0.5', port: 8080 } });
  assert.equal(got.result, 'forward');
  assert.equal(e(got.out.dst), '192.168.1.10:8080');
  // the dynamic table is read before the forwards
  const s = at({ portForward: true }, 3);
  assert.equal(logic.homeIn(s.homes[0], 0, { src: logic.server, dst: { ip: '100.64.0.5', port: 61000 } }).result, 'hit');
  // a forward on A's router does not change the ports it hands out
  assert.equal(e(at({ portForward: true }, 2).packet.src), '100.64.0.5:61000');
  assert.equal(end({ portForward: true }).verdict, 'delivered');
});

// ── rule 6: one public address, many homes ──

test('rule 6: shared-address: the server sees one address twice, only the ports differ', () => {
  const p = PRESETS['shared-address'];
  assert.equal(logic.stepsFor(P(p)), 6);
  const s = end(p);
  assert.deepEqual(s.seen.map(e), ['203.0.113.5:62000', '203.0.113.5:62001']);
  assert.equal(new Set(s.seen.map((x) => x.ip)).size, 1);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((n) => at(p, n).who), ['A', 'A', 'A', 'B', 'B', 'B']);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((n) => at(p, n).phase), ['send', 'nat1', 'nat2', 'send', 'nat1', 'nat2']);
});

// ── params and steps ──

test('steps: 6 by default, 3 per subscriber when all send, 3 or 4 inbound', () => {
  assert.equal(kit.stepsOf(logic, P({})), 6);
  assert.deepEqual([1, 2, 3].map((k) => logic.stepsFor(P({ senders: 'all', subscribers: k }))), [3, 6, 9]);
  assert.equal(logic.stepsFor(P({ direction: 'inbound' })), 3);
  assert.equal(logic.stepsFor(P({ direction: 'inbound', portForward: true })), 4);
  for (const p of Object.values(PRESETS)) assert.ok(logic.stepsFor(P(p)) <= 20);
});

test('subscribers 1–3 are drawn; out of range is clamped', () => {
  assert.equal(at({ subscribers: 1 }, 0).homes.length, 1);
  assert.equal(at({ subscribers: 3 }, 0).homes.length, 3);
  assert.equal(at({ subscribers: 9 }, 0).homes.length, 3);
  assert.equal(at({ subscribers: 0 }, 0).homes.length, 1);
  assert.deepEqual(at({ subscribers: 3 }, 0).homes.map((h) => h.id), ['A', 'B', 'C']);
});

// ── added after the fresh review: each closes a mutation the tests above let through ──

test('defaults and the scene: preset 1, the client, the start phase', () => {
  assert.deepEqual(logic.defaults, { direction: 'outbound', senders: 'one', portForward: false, subscribers: 2 });
  assert.deepEqual(logic.client, { ip: '192.0.2.50', port: 50000 });
  for (const over of Object.values(PRESETS)) {
    const s = at(over, 0);
    assert.equal(s.phase, 'start');
    assert.equal(s.packet, null);
    assert.equal(s.lookup, null);
    assert.equal(s.who, null);
    assert.equal(s.verdict, null);
  }
});

test('lookup is step-local: no row is marked on steps that look nothing up', () => {
  const o = PRESETS['outbound-works'];
  assert.equal(at(o, 1).lookup, null);
  assert.equal(at(o, 4).lookup, null);
  assert.equal(at(PRESETS['inbound-dropped'], 1).lookup, null);
  assert.equal(at(PRESETS['inbound-dropped'], 3).lookup, null);
  assert.equal(at(PRESETS['port-forward-fails'], 4).lookup, null);
  assert.equal(at(PRESETS['inbound-dropped'], 3).packet, null);
});

test('every hop goes between the right nodes', () => {
  const hops = (over) => Array.from({ length: logic.stepsFor(P(over)) }, (_, k) => {
    const p = at(over, k + 1).packet;
    return p ? p.from + '>' + p.to : '-';
  });
  assert.deepEqual(hops(PRESETS['outbound-works']), ['A>hA', 'hA>cgn', 'cgn>server', 'server>cgn', 'cgn>hA', 'hA>A']);
  assert.deepEqual(hops(PRESETS['shared-address']), ['A>hA', 'hA>cgn', 'cgn>server', 'B>hB', 'hB>cgn', 'cgn>server']);
  assert.deepEqual(hops(PRESETS['port-forward-fails']), ['client>net', 'net>cgn', '-', 'client>net']);
  // a packet from outside belongs to no subscriber
  for (let n = 1; n <= 4; n++) assert.equal(at(PRESETS['port-forward-fails'], n).who, null);
});

test('subscribers: clamped to 1–3 and rounded, also for the step count', () => {
  assert.equal(logic.stepsFor(P({ senders: 'all', subscribers: 9 })), 9);
  assert.equal(end({ senders: 'all', subscribers: 9 }).cgn.length, 3);
  assert.equal(at({ subscribers: -2 }, 0).homes.length, 1);
  assert.equal(at({ subscribers: 2.6 }, 0).homes.length, 3);
  assert.equal(at({ subscribers: '2' }, 0).homes.length, 2);
});

test('rule 3: the edges of the private ranges', () => {
  for (const ip of ['9.255.255.255', '11.0.0.0', '172.15.255.255', '172.32.0.0', '192.167.255.255', '192.169.0.0']) {
    assert.equal(logic.addressSpace(ip), 'public', ip);
  }
  for (const ip of ['10.0.0.0', '10.255.255.255', '172.16.0.0', '192.168.0.0', '192.168.255.255']) {
    assert.equal(logic.addressSpace(ip), 'private', ip);
  }
});

test('rule 5: the forward is on A\'s router only and matches its address and port', () => {
  const s = at(PRESETS['port-forward-fails'], 0);
  assert.equal(s.homes[0].forwards.length, 1);
  assert.equal(s.homes[1].forwards.length, 0);
  assert.equal(logic.homeIn(s.homes[0], 0, { src: logic.client, dst: { ip: '100.64.0.6', port: 8080 } }).result, 'miss');
  assert.equal(logic.homeIn(s.homes[0], 0, { src: logic.client, dst: { ip: '100.64.0.5', port: 8081 } }).result, 'miss');
});

test('rules 2 and 7: rows are matched and ports counted on the right address', () => {
  // a port used on another address is free on this one
  const other = [{ inside: { ip: 'x', port: 1 }, outside: { ip: '198.18.0.1', port: 62000 }, dest: logic.server }];
  assert.equal(logic.freePort(other, '203.0.113.5', 62000), 62000);
  // the same port on another address is not this row
  assert.equal(logic.translateIn(other, logic.cgnNat, { src: logic.server, dst: { ip: '203.0.113.5', port: 62000 } }).row, -1);
  // reuse returns the index of the row it reused
  const a = logic.translateOut([], logic.cgnNat, { src: { ip: '100.64.0.5', port: 61000 }, dst: logic.server });
  const b = logic.translateOut(a.table, logic.cgnNat, { src: { ip: '100.64.0.6', port: 61000 }, dst: logic.server });
  const again = logic.translateOut(b.table, logic.cgnNat, { src: { ip: '100.64.0.6', port: 61000 }, dst: logic.server });
  assert.equal(again.outcome, 'reuse');
  assert.equal(again.row, 1);
  assert.equal(again.out.src.port, 62001);
});

// ── generic checks every sim keeps ──

const ALL = [...Object.values(PRESETS), { subscribers: 3, senders: 'all' }, { subscribers: 1 }, { portForward: true, senders: 'all', subscribers: 3 }];

test('state is JSON-safe at every step', () => {
  for (const over of ALL) {
    for (let n = 0; n <= logic.stepsFor(P(over)); n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of ALL) {
    const p = P(over), last = logic.stepsFor(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= last; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = last; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const over of ALL) {
    const p = P(over);
    let s = logic.initial(p);
    for (let n = 1; n <= logic.stepsFor(p); n++) {
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

test('every preset in the page is valid for the model and matches the presets tested here', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, kit.stepsOf(logic, P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  for (const [id, params] of Object.entries(PRESETS)) {
    const m = html.match(new RegExp("id: '" + id + "'[^}]*params: (\\{[^}]*\\})"));
    assert.ok(m, `preset ${id} in the page`);
    const got = Function('return ' + m[1])();
    assert.deepEqual(got, params, `preset ${id} params`);
  }
});
