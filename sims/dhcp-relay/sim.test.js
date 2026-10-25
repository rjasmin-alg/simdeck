// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for dhcp-relay's model (rules: SPEC.md). Run: node --test sims/dhcp-relay/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const run = (over) => { const p = P(over); const out = []; for (let n = 0; n <= logic.steps(p); n++) out.push(kit.stateAt(logic, p, n)); return out; };
const end = (over) => { const r = run(over); return r[r.length - 1]; };
const did = (over) => run(over).slice(1).map((s) => s.last.did);
/** The message crossed in each step (null for a timer step without one). */
const crossed = (over) => run(over).slice(1).map((s) => (s.last.msg ? logic.msg(s, s.last.msg) : null));
const ZERO = '0.0.0.0';
const PRESETS = {
  branch: {},
  'sales-vlan': { client: 'sales' },
  'same-subnet': { client: 'admin' },
  'no-relay': { relay: false },
  'server-down': { server: false }
};
const req = (over) => Object.assign({ type: 'DISCOVER', giaddr: ZERO, hops: 0, yiaddr: ZERO, flagB: true, chaddr: logic.MAC,
  src: '0.0.0.0:68', dst: '255.255.255.255:67', cast: 'broadcast', wrote: [] }, over);

// ── tie-breaks first ──

test('tie-break: the relay writes giaddr only when it is 0; a giaddr set by an earlier relay stays', () => {
  const first = logic.relayForward(req(), '192.168.1.113', logic.SERVER);
  assert.equal(first.giaddr, '192.168.1.113');
  assert.deepEqual(first.wrote, ['giaddr', 'hops']);
  const second = logic.relayForward(first, '192.168.1.137', logic.SERVER);
  assert.equal(second.giaddr, '192.168.1.113');
  assert.equal(second.hops, 2);
  assert.deepEqual(second.wrote, ['hops']);
});

test('tie-break: hops over 16 is discarded; 16 is still forwarded', () => {
  assert.equal(logic.relayForward(req({ hops: 17 }), '192.168.1.113', logic.SERVER), null);
  assert.equal(logic.relayForward(req({ hops: 16 }), '192.168.1.113', logic.SERVER).hops, 17);
});

test('tie-break: giaddr decides the scope, not the server\'s own subnet; giaddr 0 means the receiving interface', () => {
  assert.equal(logic.scopeFor('192.168.1.113', logic.SERVER).id, 'branch');
  assert.equal(logic.scopeFor('192.168.1.1', logic.SERVER).id, 'sales');
  assert.equal(logic.scopeFor(ZERO, logic.SERVER).id, 'admin');
  assert.equal(logic.scopeFor('10.0.0.1', logic.SERVER), null);
  // subnet edges: .112–.127 is the branch /28, .128 is not; .0–.63 is the sales /26
  assert.equal(logic.scopeFor('192.168.1.127', logic.SERVER).id, 'branch');
  assert.equal(logic.scopeFor('192.168.1.128', logic.SERVER), null);
  assert.equal(logic.scopeFor('192.168.1.63', logic.SERVER).id, 'sales');
  assert.equal(logic.scopeFor('192.168.1.64', logic.SERVER), null);
});

test('tie-break: without the BROADCAST bit the server and the relay unicast to yiaddr, port 68', () => {
  assert.deepEqual(logic.replyTo({ giaddr: ZERO, flagB: false, yiaddr: '192.168.1.100' }), { dst: '192.168.1.100:68', cast: 'unicast' });
  assert.deepEqual(logic.replyTo({ giaddr: ZERO, flagB: true, yiaddr: '192.168.1.100' }), { dst: '255.255.255.255:68', cast: 'broadcast' });
  // giaddr wins over the bit: to the relay, port 67
  assert.deepEqual(logic.replyTo({ giaddr: '192.168.1.113', flagB: true, yiaddr: '192.168.1.116' }), { dst: '192.168.1.113:67', cast: 'unicast' });
  const d = logic.relayDeliver({ type: 'OFFER', giaddr: '192.168.1.113', hops: 1, yiaddr: '192.168.1.116', flagB: false }, '192.168.1.113');
  assert.equal(d.dst, '192.168.1.116:68');
  assert.equal(d.cast, 'unicast');
});

// ── rules ──

test('rule 1: DISCOVER and REQUEST leave the client as broadcast from 0.0.0.0:68 to 255.255.255.255:67, giaddr 0, hops 0', () => {
  for (const over of [{}, { client: 'sales' }, { client: 'admin' }]) {
    const ms = crossed(over).filter((m) => m && m.from === 'C');
    assert.deepEqual(ms.map((m) => m.type), ['DISCOVER', 'REQUEST']);
    for (const m of ms) {
      assert.equal(m.src, '0.0.0.0:68');
      assert.equal(m.dst, '255.255.255.255:67');
      assert.equal(m.cast, 'broadcast');
      assert.equal(m.giaddr, ZERO);
      assert.equal(m.hops, 0);
    }
  }
});

test('rule 2: with the relay off the DISCOVER ends at R2 (✕) and nothing reaches the server', () => {
  const ms = crossed({ relay: false }).filter(Boolean);
  assert.equal(ms.length, 4);
  for (const m of ms) { assert.equal(m.to, 'R2'); assert.equal(m.lost, true); }
  assert.ok(!ms.some((m) => m.to === 'S'));
});

test('rule 3: the relay writes its interface address into giaddr, hops 1, and unicasts to the server, port 67', () => {
  const m = crossed({})[1];
  assert.equal(m.from, 'R2');
  assert.equal(m.to, 'S');
  assert.deepEqual(m.via, ['R1']);
  assert.equal(m.giaddr, '192.168.1.113');
  assert.equal(m.hops, 1);
  assert.equal(m.src, '192.168.1.113:67');
  assert.equal(m.dst, '192.168.1.99:67');
  assert.equal(m.cast, 'unicast');
  assert.deepEqual(m.wrote, ['giaddr', 'hops']);
  const sales = crossed({ client: 'sales' })[1];
  assert.equal(sales.from, 'R1');
  assert.equal(sales.giaddr, '192.168.1.1');
  assert.deepEqual(sales.via, []);
});

test('rule 4: the server picks the scope by giaddr and offers its first free address', () => {
  assert.equal(run({})[2].scope, 'branch');
  assert.equal(run({})[2].last.server, 'offer');
  assert.equal(crossed({})[2].yiaddr, '192.168.1.116');
  assert.equal(run({ client: 'sales' })[2].scope, 'sales');
  assert.equal(crossed({ client: 'sales' })[2].yiaddr, '192.168.1.20');
  assert.equal(run({ client: 'admin' })[1].scope, 'admin');
  assert.equal(crossed({ client: 'admin' })[1].yiaddr, '192.168.1.100');
  assert.deepEqual(end({}).binding, { addr: '192.168.1.116', mac: logic.MAC });
});

test('rule 5: with giaddr set the OFFER and ACK go to the relay at giaddr:67 as unicast', () => {
  const ms = crossed({}).filter((m) => m.from === 'S');
  assert.deepEqual(ms.map((m) => m.type), ['OFFER', 'ACK']);
  for (const m of ms) {
    assert.equal(m.to, 'R2');
    assert.equal(m.src, '192.168.1.99:67');
    assert.equal(m.dst, '192.168.1.113:67');
    assert.equal(m.cast, 'unicast');
    assert.equal(m.giaddr, '192.168.1.113');
    assert.deepEqual(m.wrote, ['yiaddr']);
  }
  // giaddr 0 (same subnet): the server broadcasts to port 68 itself
  for (const m of crossed({ client: 'admin' }).filter((x) => x.from === 'S')) {
    assert.equal(m.dst, '255.255.255.255:68');
    assert.equal(m.cast, 'broadcast');
    assert.equal(m.giaddr, ZERO);
  }
});

test('rule 6: the relay delivers OFFER and ACK on the client\'s segment as broadcast to port 68, fields unchanged', () => {
  const ms = crossed({}).filter((m) => m.to === 'C');
  assert.deepEqual(ms.map((m) => m.type), ['OFFER', 'ACK']);
  for (const m of ms) {
    assert.equal(m.from, 'R2');
    assert.equal(m.src, '192.168.1.113:67');
    assert.equal(m.dst, '255.255.255.255:68');
    assert.equal(m.cast, 'broadcast');
    assert.equal(m.giaddr, '192.168.1.113');
    assert.equal(m.hops, 1);
    assert.equal(m.yiaddr, '192.168.1.116');
    assert.deepEqual(m.wrote, []);
  }
});

test('rule 7: REQUEST and ACK take the same path as DISCOVER and OFFER; the relay writes giaddr again', () => {
  const ms = crossed({});
  const path = ms.map((m) => m.type + ' ' + m.from + '>' + m.to);
  assert.deepEqual(path, ['DISCOVER C>R2', 'DISCOVER R2>S', 'OFFER S>R2', 'OFFER R2>C', 'REQUEST C>R2', 'REQUEST R2>S', 'ACK S>R2', 'ACK R2>C']);
  assert.equal(ms[4].o50, '192.168.1.116');
  assert.equal(ms[4].o54, '192.168.1.99');
  assert.equal(ms[5].giaddr, '192.168.1.113');
  assert.deepEqual(ms[5].wrote, ['giaddr', 'hops']);
});

test('rule 8: the ACK carries options 1, 3 and 6 and the client stores them; DNS is in another subnet', () => {
  assert.deepEqual(end({}).client, { ip: '192.168.1.116', mask: '255.255.255.240', gw: '192.168.1.113', dns: '192.168.1.99' });
  assert.deepEqual(end({ client: 'sales' }).client, { ip: '192.168.1.20', mask: '255.255.255.192', gw: '192.168.1.1', dns: '192.168.1.99' });
  assert.deepEqual(end({ client: 'admin' }).client, { ip: '192.168.1.100', mask: '255.255.255.240', gw: '192.168.1.97', dns: '192.168.1.99' });
  assert.ok(!logic.inSubnet('192.168.1.99', '192.168.1.112', 28));
  assert.equal(end({}).phase, 'BOUND');
  // the client has nothing before the ACK
  assert.equal(run({})[7].client, null);
});

test('rule 9: no answer: DISCOVER again at 4, 12, 28 s, then 169.254.28.7/16 at 60 s', () => {
  for (const over of [{ relay: false }, { server: false }, { client: 'admin', server: false }]) {
    const r = run(over);
    const sends = r.slice(1).filter((s) => s.last.type === 'DISCOVER' && s.last.msg && logic.msg(s, s.last.msg).from === 'C');
    assert.deepEqual(sends.map((s) => s.t), [0, 4, 12, 28], JSON.stringify(over));
    const e = r[r.length - 1];
    assert.equal(e.last.did, 'linkLocal');
    assert.equal(e.t, 60);
    assert.equal(e.phase, 'LINKLOCAL');
    assert.deepEqual(e.client, { ip: '169.254.28.7', mask: '255.255.0.0', gw: null, dns: null });
    assert.ok(logic.inSubnet(e.client.ip, '169.254.0.0', 16));
  }
});

test('rule 9: with the server down the relay still forwards every DISCOVER, and it is lost at the server', () => {
  const ms = crossed({ server: false }).filter(Boolean);
  assert.deepEqual(ms.map((m) => m.from + '>' + m.to + (m.lost ? '✕' : '')), ['C>R2', 'R2>S✕', 'C>R2', 'R2>S✕', 'C>R2', 'R2>S✕', 'C>R2', 'R2>S✕']);
  for (const m of ms.filter((x) => x.to === 'S')) assert.equal(m.giaddr, '192.168.1.113');
  assert.equal(end({ server: false }).scope, null);
});

test('the client\'s phase: SELECTING after a DISCOVER, REQUESTING after the offer, BOUND after the ACK', () => {
  assert.equal(run({ relay: false })[1].phase, 'SELECTING');
  assert.equal(run({})[4].phase, 'REQUESTING');
  assert.equal(run({})[7].phase, 'REQUESTING');
  assert.equal(end({}).phase, 'BOUND');
});

test('every crossing keeps its attempt and time; via only on the relay–server hop', () => {
  const ms = crossed({ server: false }).filter(Boolean);
  assert.deepEqual(ms.map((m) => m.attempt), [1, 1, 2, 2, 3, 3, 4, 4]);
  assert.deepEqual(ms.map((m) => m.t), [0, 0, 4, 4, 12, 12, 28, 28]);
  for (const over of Object.values(PRESETS)) for (const m of crossed(over).filter(Boolean)) {
    if (m.from === 'C' || m.to === 'C') assert.deepEqual(m.via, [], JSON.stringify(over));
  }
});

test('same subnet, server down: every broadcast is lost at the server', () => {
  const ms = crossed({ client: 'admin', server: false }).filter(Boolean);
  assert.equal(ms.length, 4);
  for (const m of ms) { assert.equal(m.to, 'S'); assert.equal(m.lost, true); }
});

test('the scope the server picked stays picked to the end; the ACK gives the address the REQUEST names', () => {
  assert.equal(end({}).scope, 'branch');
  assert.equal(end({ client: 'sales' }).scope, 'sales');
  assert.equal(end({ client: 'admin' }).scope, 'admin');
  const ans = logic.serverAnswer(req({ type: 'REQUEST', giaddr: '192.168.1.113', hops: 1, o50: '192.168.1.117' }), null);
  assert.equal(ans.reply.type, 'ACK');
  assert.equal(ans.reply.yiaddr, '192.168.1.117');
});

// ── presets and runs ──

test('step counts per preset; defaults give sim.json steps; no combination over 9', () => {
  const want = { branch: 8, 'sales-vlan': 8, 'same-subnet': 4, 'no-relay': 5, 'server-down': 9 };
  for (const [id, over] of Object.entries(PRESETS)) assert.equal(logic.steps(P(over)), want[id], id);
  const json = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(json.steps, logic.steps(P({})));
  let max = 0;
  for (const client of Object.keys(logic.PLACES)) for (const relay of [true, false]) for (const server of [true, false])
    max = Math.max(max, logic.steps({ client, relay, server }));
  assert.equal(max, 9);
});

test('preset outcomes: the sequence of events', () => {
  assert.deepEqual(did({}), ['relayTakes', 'relayed', 'toRelay', 'offerIn', 'relayTakes', 'relayed', 'toRelay', 'configured']);
  assert.deepEqual(did({ client: 'admin' }), ['offer', 'offerIn', 'ack', 'configured']);
  assert.deepEqual(did({ relay: false }), ['noRelay', 'noRelay', 'noRelay', 'noRelay', 'linkLocal']);
  // the relay toggle does not matter where there is no relay
  assert.deepEqual(did({ client: 'admin', relay: false }), did({ client: 'admin' }));
  // messages take no time: a successful run stays at 0 s
  assert.ok(run({}).every((s) => s.t === 0));
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
  for (const over of Object.values(PRESETS)) {
    const p = P(over);
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

test('every preset in the page is valid for the model and matches this file', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((x) => [...x[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  for (const id of Object.keys(PRESETS)) assert.ok(html.includes(`id: '${id}'`), `preset ${id} in the page`);
});
