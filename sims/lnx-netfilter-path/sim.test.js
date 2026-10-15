// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-netfilter-path's model: tie-breaks first, then one test per rule (SPEC.md), then the presets'
// numbers, then the template's generic block.
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
const all = (p) => Array.from({ length: steps(p) + 1 }, (_, n) => at(p, n));
/** The boxes in step order (the reply's after the original's). */
const boxes = (p) => all(p).slice(1).map((s) => s.at);
/** The frame where the packet (dir) is at a box. */
const frameAt = (p, box, dir = 'orig') => all(p).find((s) => s.at === box && s.dir === dir);
/** The trace of one hook as "chain:rule:verdict" (rule 1-based, '-' when no rule was read). */
const traceAt = (s, hook) => s.trace.filter((x) => x.hook === hook).map((x) => `${x.chain}:${x.rule === null ? '-' : x.rule + 1}:${x.verdict}`);
const addr = (pk) => `${pk.src}:${pk.sport} -> ${pk.dst}:${pk.dport}`;

// ── tie-breaks ──

test('tie-break (rule 4): two input chains with the same priority run by name, and the tie is flagged', () => {
  const p = P({ extra: '0' });
  const order = logic.chainsAt(logic.chainsOf(p), 'input');
  assert.deepEqual(order.chains.map((c) => c.name), ['extra', 'filter_in']);
  assert.equal(order.tie, true);
  const s = frameAt(p, 'input');
  assert.equal(s.event.tie, true, 'the page is told to warn');
  // extra runs first, its policy drops the packet, so filter_in never runs
  assert.deepEqual(traceAt(s, 'input'), ['extra:2:drop']);
  assert.equal(end(p).at, 'dropped');
});

test('tie-break (rule 4): different priorities run in ascending order, whatever the names, with no tie', () => {
  const p = P({ extra: '10' });
  const order = logic.chainsAt(logic.chainsOf(p), 'input');
  assert.deepEqual(order.chains.map((c) => [c.name, c.prio]), [['filter_in', 0], ['extra', 10]]);
  assert.equal(order.tie, false);
  // priority beats the name, and a negative priority comes first
  const mixed = [
    { name: 'a', hook: 'input', prio: 100 }, { name: 'z', hook: 'input', prio: -100 }, { name: 'm', hook: 'input', prio: 0 },
    { name: 'b', hook: 'forward', prio: -300 }
  ];
  assert.deepEqual(logic.chainsAt(mixed, 'input').chains.map((c) => c.name), ['z', 'm', 'a']);
  assert.equal(frameAt(P({}), 'input').event.tie, false);
});

test('tie-break (rule 6): accept ends only its chain; a later chain at the same hook still drops the packet', () => {
  const p = P({ extra: '10' });
  const s = frameAt(p, 'input');
  assert.deepEqual(traceAt(s, 'input'), ['filter_in:2:accept', 'extra:2:drop']);
  assert.equal(s.event.dropped, true);
  assert.deepEqual(boxes(p), ['prerouting', 'route', 'input', 'dropped']);
  assert.equal(end(p).dropAt, 'input');
});

test('tie-break (rule 6): drop is final, so no later chain or hook sees the packet', () => {
  const p = P({ packet: 'port-fwd', fwdRule: '8080' });
  assert.deepEqual(boxes(p), ['prerouting', 'route', 'forward', 'dropped']);
  const e = end(p);
  assert.ok(!e.visited.includes('postrouting'));
  assert.deepEqual(e.trace.map((x) => x.hook), ['prerouting', 'forward']);
  // a drop in the first of two chains: the second is not run
  const tie = frameAt(P({ extra: '0' }), 'input');
  assert.ok(!tie.trace.some((x) => x.chain === 'filter_in'));
});

test('tie-break (rule 8): with forwarding off, local delivery and local traffic are not affected', () => {
  assert.deepEqual(boxes(P({ ipForward: false })), ['prerouting', 'route', 'input', 'local']);
  assert.deepEqual(boxes(P({ packet: 'local-out', ipForward: false })), ['route-out', 'output', 'postrouting', 'out']);
  assert.deepEqual(logic.routeDecision('198.51.100.10', false), { to: 'input', oif: null, route: -1, local: true });
});

test('tie-break (rule 8): with forwarding off, a packet routed elsewhere is dropped at the routing decision', () => {
  const p = P({ packet: 'lan-out', ipForward: false });
  assert.deepEqual(boxes(p), ['prerouting', 'route', 'dropped']);
  const e = end(p);
  assert.equal(e.dropAt, 'route');
  assert.ok(!e.visited.includes('forward'), 'forward never sees it');
  assert.equal(e.trace.filter((x) => x.hook === 'forward').length, 0);
  assert.equal(logic.routeDecision('203.0.113.7', false).to, 'dropped');
  // the port forward too: DNAT made it a forwarded packet
  assert.deepEqual(boxes(P({ packet: 'port-fwd', ipForward: false })), ['prerouting', 'route', 'dropped']);
});

// ── rules ──

test('rule 1: the three paths: local delivery, forwarding, locally generated', () => {
  assert.deepEqual(boxes(P({ packet: 'ssh-in' })), ['prerouting', 'route', 'input', 'local']);
  assert.deepEqual(boxes(P({ packet: 'lan-out' })), ['prerouting', 'route', 'forward', 'postrouting', 'out']);
  assert.deepEqual(boxes(P({ packet: 'local-out' })), ['route-out', 'output', 'postrouting', 'out']);
});

test('rule 1: the boxes not on a path stay dark (never visited)', () => {
  assert.deepEqual(end(P({ packet: 'local-out' })).visited, ['route-out', 'output', 'postrouting', 'out']);
  const inbound = end(P({ packet: 'ssh-in' })).visited;
  for (const b of ['forward', 'output', 'postrouting', 'route-out', 'out']) assert.ok(!inbound.includes(b), b);
  assert.equal(at(P({ packet: 'local-out' }), 0).at, 'local');
  assert.equal(at(P({ packet: 'ssh-in' }), 0).at, 'in');
});

test('rule 2: the routing decision reads the destination after DNAT, so a port forward goes through forward', () => {
  const p = P({ packet: 'port-fwd' });
  const r = frameAt(p, 'route');
  assert.equal(addr(r.packet), '203.0.113.7:51000 -> 10.0.0.5:80');
  assert.equal(r.route.to, 'forward');
  assert.equal(r.route.oif, 'eth1');
  assert.equal(r.event.rewrite, 'dnat');
  assert.ok(!end(p).visited.includes('input'), 'a rule in input never sees it');
  // the same address without DNAT would be local
  assert.equal(logic.routeDecision('198.51.100.10', true).to, 'input');
  assert.equal(logic.routeDecision('10.0.0.5', true).oif, 'eth1');
  assert.equal(logic.routeDecision('203.0.113.7', true).oif, 'eth0');
  // and the input policy does not matter to it
  assert.deepEqual(boxes(P({ packet: 'port-fwd', fwdRule: '8080', inputPolicy: 'accept' })), ['prerouting', 'route', 'forward', 'dropped']);
});

test('rule 3: DNAT in prerouting, SNAT in postrouting; forward sees the new destination and the old source', () => {
  const pf = P({ packet: 'port-fwd' });
  assert.equal(addr(frameAt(pf, 'prerouting').packet), '203.0.113.7:51000 -> 10.0.0.5:80');
  assert.deepEqual(frameAt(pf, 'prerouting').changed.filter((m) => m.startsWith('pkt:')), ['pkt:dst', 'pkt:dport']);
  const m = P({ packet: 'lan-out' });
  assert.equal(addr(frameAt(m, 'forward').packet), '10.0.0.5:50000 -> 203.0.113.7:443', 'forward sees the old source');
  assert.equal(addr(frameAt(m, 'postrouting').packet), '198.51.100.10:50000 -> 203.0.113.7:443');
  assert.deepEqual(frameAt(m, 'postrouting').changed.filter((x) => x.startsWith('pkt:')), ['pkt:src']);
  assert.equal(frameAt(m, 'postrouting').packet.src, logic.IFACES.eth0.addr, 'masquerade takes the output interface\'s address');
});

test('rule 3: a packet the NAT rules do not match keeps its addresses', () => {
  const lo = P({ packet: 'local-out' });
  assert.deepEqual(traceAt(frameAt(lo, 'postrouting'), 'postrouting'), ['nat_post:2:accept']);
  assert.equal(addr(end(lo).packet), '198.51.100.10:40000 -> 203.0.113.7:443');
  assert.deepEqual(traceAt(frameAt(P({}), 'prerouting'), 'prerouting'), ['nat_pre:2:accept']);
});

test('rule 5: first match per chain, top down; the rows below it are not read', () => {
  const s = frameAt(P({ packet: 'port-fwd' }), 'forward');
  const x = s.trace.find((t) => t.chain === 'filter_fwd');
  assert.equal(x.rule, 2);
  assert.deepEqual(x.miss, [['ct'], ['iif', 'oif'], []]);
  const lan = frameAt(P({ packet: 'lan-out' }), 'forward').trace.find((t) => t.chain === 'filter_fwd');
  assert.equal(lan.rule, 1);
  assert.equal(lan.miss.length, 2, 'row 3 is not read');
  // a packet accepted in prerouting's nat chain is still filtered later: first match is per chain, not per path
  assert.deepEqual(traceAt(end(P({ packet: 'port-fwd', fwdRule: 'none' })), 'forward'), ['filter_fwd:3:drop']);
});

test('rule 5: no match → the chain\'s policy', () => {
  const chains = logic.chainsOf(P({ inputPolicy: 'accept' }));
  const fin = chains.find((c) => c.name === 'filter_in');
  const pkt = { src: '203.0.113.7', sport: 51000, dst: '198.51.100.10', dport: 80, proto: 'tcp', iif: 'eth0', oif: null };
  assert.deepEqual(logic.runChain(fin, pkt, 'new'), { at: 2, verdict: 'accept', miss: [['ct'], ['dport']] });
  const drop = logic.chainsOf(P({})).find((c) => c.name === 'filter_in');
  assert.equal(logic.runChain(drop, pkt, 'new').verdict, 'drop');
  // the nat chains keep the default policy, accept
  for (const c of logic.chainsOf(P({}))) if (c.type === 'nat') assert.equal(c.policy, 'accept');
});

test('rule 7: the reply skips the nat chain; conntrack reverses the masquerade in prerouting', () => {
  const p = P({ packet: 'lan-out', reply: true });
  const pre = frameAt(p, 'prerouting', 'reply');
  assert.deepEqual(traceAt(pre, 'prerouting'), ['nat_pre:-:ct-nat']);
  assert.equal(addr(pre.packet), '203.0.113.7:443 -> 10.0.0.5:50000');
  assert.deepEqual(pre.ct, { idx: 0, dir: 'reply', state: 'established' });
  assert.equal(frameAt(p, 'route', 'reply').event.rewrite, 'ct');
  // filter chains still see every packet: the reply is accepted by the established rule
  assert.deepEqual(traceAt(frameAt(p, 'forward', 'reply'), 'forward'), ['filter_fwd:1:accept']);
  assert.deepEqual(traceAt(frameAt(p, 'postrouting', 'reply'), 'postrouting'), ['nat_post:-:skip']);
  assert.equal(end(p).packet.oif, 'eth1');
  assert.deepEqual(end(p).conntrack, [{
    orig: { src: '10.0.0.5', sport: 50000, dst: '203.0.113.7', dport: 443 },
    reply: { src: '203.0.113.7', sport: 443, dst: '198.51.100.10', dport: 50000 },
    nat: ['snat'], status: 'established'
  }]);
});

test('rule 7: a port forward\'s reply gets its source back in postrouting, without the nat chain', () => {
  const p = P({ packet: 'port-fwd', reply: true });
  const post = frameAt(p, 'postrouting', 'reply');
  assert.deepEqual(traceAt(post, 'postrouting'), ['nat_post:-:ct-nat']);
  assert.equal(addr(post.packet), '198.51.100.10:8080 -> 203.0.113.7:51000');
  assert.equal(addr(frameAt(p, 'forward', 'reply').packet), '10.0.0.5:80 -> 203.0.113.7:51000', 'not yet rewritten in forward');
  assert.deepEqual(traceAt(frameAt(p, 'prerouting', 'reply'), 'prerouting'), ['nat_pre:-:skip']);
  // the conntrack translation unit: the original direction again gets the recorded DNAT
  const entry = end(p).conntrack[0];
  const again = { src: '203.0.113.7', sport: 51000, dst: '198.51.100.10', dport: 8080 };
  assert.deepEqual(logic.ctTranslate(entry, 'orig', again, 'dst'), ['dst', 'dport']);
  assert.equal(addr(again), '203.0.113.7:51000 -> 10.0.0.5:80');
});

test('conntrack: a connection is recorded at its first hook, kept when it leaves, removed when dropped', () => {
  assert.equal(at(P({}), 0).conntrack.length, 0);
  assert.equal(frameAt(P({}), 'prerouting').conntrack[0].status, 'new');
  assert.equal(end(P({})).conntrack.length, 1);
  assert.equal(frameAt(P({ packet: 'local-out' }), 'route-out').conntrack.length, 0, 'local: recorded at output');
  assert.equal(frameAt(P({ packet: 'local-out' }), 'output').conntrack.length, 1);
  for (const o of [{ extra: '10' }, { packet: 'lan-out', ipForward: false }, { packet: 'port-fwd', fwdRule: 'none' }]) {
    const e = end(P(o));
    assert.equal(e.at, 'dropped');
    assert.deepEqual(e.conntrack, [], JSON.stringify(o));
    assert.ok(e.changed.includes('ct:gone'));
  }
  // a reply to a local connection is accepted by the established rule in input
  assert.deepEqual(traceAt(frameAt(P({ packet: 'local-out', reply: true }), 'input', 'reply'), 'input'), ['filter_in:1:accept']);
});

test('the reply starts where its sender is: a wire (prerouting) or the local process (route-out)', () => {
  assert.deepEqual(boxes(P({ packet: 'lan-out', reply: true })).slice(5), ['prerouting', 'route', 'forward', 'postrouting', 'out']);
  assert.deepEqual(boxes(P({ packet: 'ssh-in', reply: true })).slice(4), ['route-out', 'output', 'postrouting', 'out']);
  const r = frameAt(P({ packet: 'lan-out', reply: true }), 'prerouting', 'reply');
  assert.equal(r.packet.iif, 'eth0');
  assert.equal(r.from, 'outside');
  assert.equal(frameAt(P({ packet: 'port-fwd', reply: true }), 'prerouting', 'reply').from, 'inside');
  assert.deepEqual(r.visited, ['prerouting'], 'the reply has its own path');
});

test('conntrack: a dropped reply loses only the packet; its established connection stays recorded', () => {
  const p = P({ packet: 'local-out', reply: true, extra: '10' });
  const e = end(p);
  assert.equal(e.at, 'dropped');
  assert.equal(e.dropAt, 'input');
  assert.equal(e.conntrack.length, 1);
  assert.equal(e.conntrack[0].status, 'established');
  assert.ok(!e.changed.includes('ct:gone'));
});

test('the reply arrives on the interface the packet left by, and is looked up at its first hook', () => {
  assert.equal(frameAt(P({ packet: 'port-fwd', reply: true }), 'prerouting', 'reply').packet.iif, 'eth1');
  assert.equal(frameAt(P({ packet: 'lan-out', reply: true }), 'prerouting', 'reply').packet.iif, 'eth0');
  // a local reply: conntrack finds it at output, so postrouting's nat chain is skipped
  const p = P({ packet: 'ssh-in', reply: true });
  assert.equal(frameAt(p, 'route-out', 'reply').ct, null);
  assert.deepEqual(frameAt(p, 'output', 'reply').ct, { idx: 0, dir: 'reply', state: 'established' });
  assert.deepEqual(traceAt(frameAt(p, 'postrouting', 'reply'), 'postrouting'), ['nat_post:-:skip']);
});

test('the routing decision sets the output interface (longest prefix)', () => {
  assert.equal(logic.routeOf('10.0.0.5').oif, 'eth1');
  assert.equal(logic.routeOf('10.0.1.5').oif, 'eth0');
  assert.equal(logic.routeOf('203.0.113.7').oif, 'eth0');
  assert.ok(logic.inNet('10.0.0.255', '10.0.0.0/24'));
  assert.ok(!logic.inNet('10.0.1.0', '10.0.0.0/24'));
  assert.equal(frameAt(P({ packet: 'local-out' }), 'route-out').packet.oif, 'eth0');
});

// ── presets and numbers (SPEC.md) ──

const PRESETS = {
  'inbound-ssh': { packet: 'ssh-in' },
  'port-forward': { packet: 'port-fwd' },
  'masquerade': { packet: 'lan-out', reply: true },
  'local-out': { packet: 'local-out' },
  'accept-not-final': { packet: 'ssh-in', extra: '10' },
  'no-forwarding': { packet: 'lan-out', ipForward: false }
};

test('steps per preset: 4, 5, 10, 4, 4, 3; the defaults 4; every combination within 20', () => {
  assert.deepEqual(Object.fromEntries(Object.entries(PRESETS).map(([k, o]) => [k, steps(P(o))])),
    { 'inbound-ssh': 4, 'port-forward': 5, 'masquerade': 10, 'local-out': 4, 'accept-not-final': 4, 'no-forwarding': 3 });
  assert.equal(steps(P({})), 4);
  let max = 0;
  for (const packet of logic.PACKET_IDS) for (const reply of [false, true]) for (const ipForward of [true, false])
    for (const inputPolicy of ['accept', 'drop']) for (const fwdRule of ['80', '8080', 'none']) for (const extra of ['none', '10', '0']) {
      max = Math.max(max, steps(P({ packet, reply, ipForward, inputPolicy, fwdRule, extra })));
    }
  assert.equal(max, 10);
  assert.equal(steps(P({ packet: 'port-fwd', reply: true })), 10);
  assert.equal(steps(P({ packet: 'local-out', reply: true })), 8);
  assert.equal(steps(P({ packet: 'port-fwd', fwdRule: '8080' })), 4);
});

test('where each preset ends', () => {
  const ends = Object.fromEntries(Object.entries(PRESETS).map(([k, o]) => { const e = end(P(o)); return [k, [e.at, e.dropAt, addr(e.packet), e.packet.oif]]; }));
  assert.deepEqual(ends, {
    'inbound-ssh': ['local', null, '203.0.113.7:51000 -> 198.51.100.10:22', null],
    'port-forward': ['out', null, '203.0.113.7:51000 -> 10.0.0.5:80', 'eth1'],
    'masquerade': ['out', null, '203.0.113.7:443 -> 10.0.0.5:50000', 'eth1'],
    'local-out': ['out', null, '198.51.100.10:40000 -> 203.0.113.7:443', 'eth0'],
    'accept-not-final': ['dropped', 'input', '203.0.113.7:51000 -> 198.51.100.10:22', null],
    'no-forwarding': ['dropped', 'route', '10.0.0.5:50000 -> 203.0.113.7:443', null]
  });
  assert.equal(addr(frameAt(P(PRESETS.masquerade), 'out').packet), '198.51.100.10:50000 -> 203.0.113.7:443');
});

test('sim.json steps is the defaults\' count, and its preset entries are the page\'s presets', () => {
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, steps(P({})));
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const e of sim.entries || []) assert.ok(html.includes(`id: '${e.preset}'`), e.preset);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const o of Object.values(PRESETS).concat([{}, { packet: 'port-fwd', reply: true }, { extra: '0' }])) {
    const p = P(o);
    for (let n = 0; n <= steps(p); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of Object.values(PRESETS)) {
    const p = P(o);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input, and states handed out are copies', () => {
  const p = P({ packet: 'port-fwd' });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
  const s1 = at(p, 1);
  s1.packet.dst = '1.2.3.4';
  assert.equal(at(p, 1).packet.dst, '10.0.0.5');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, steps(P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  for (const id of Object.keys(PRESETS)) assert.ok(html.includes(`id: '${id}'`), `preset ${id} in the page`);
});
