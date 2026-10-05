// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for hop-rewrite's model (rules: SPEC.md). Run: node --test sims/hop-rewrite/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const all = (over) => { const p = P(over); const out = []; for (let n = 0; n <= logic.steps(p); n++) out.push(kit.stateAt(logic, p, n)); return out; };
const end = (over) => at(over, logic.steps(P(over)));
const phases = (over) => all(over).slice(1).map((s) => s.phase + (s.phase === 'process' || s.phase === 'cross' ? ':' + s.at : ''));
const PRESETS = { book: {}, 'two-routers': { routers: 2 }, 'ttl-dies': { routers: 2, ttl0: 2 }, 'cold-arp': { coldArp: true } };
const mac = (x) => '02:00:00:00:00:' + x;

// ── tie-breaks first ──

test('tie-break: a router that receives TTL 1 decrements to 0 and drops it (check after the decrement)', () => {
  const s = all({ ttl0: 1 }).find((x) => x.phase === 'process');
  assert.equal(s.at, 'R1');
  assert.equal(s.ip.ttl, 0);
  assert.deepEqual(s.dropped, { at: 'R1', reason: 'ttl' });
  assert.equal(s.frame, null, 'no new frame for a dropped packet');
  assert.equal(s.work.expired, true);
  assert.equal(s.work.csumOut, null, 'the checksum of a dropped packet is not recomputed');
  assert.deepEqual(logic.changed(s), ['ttl']);
});

test('tie-break: a host that receives TTL 1 accepts it (the router before sent 1, not 0)', () => {
  const s = all({ ttl0: 2 }).find((x) => x.phase === 'arrive');
  assert.equal(s.ip.ttl, 1);
  assert.equal(s.delivered, true);
  assert.equal(s.dropped, null);
  assert.equal(s.work.ttl, 1);
});

test('tie-break: ttl-dies: R1 forwards with TTL 1, R2 drops, and the ICMP goes to the unchanged source', () => {
  const ss = all(PRESETS['ttl-dies']);
  assert.equal(ss.find((x) => x.phase === 'process' && x.at === 'R1').ip.ttl, 1);
  const drop = ss.find((x) => x.phase === 'process' && x.at === 'R2');
  assert.equal(drop.ip.ttl, 0);
  assert.deepEqual(drop.dropped, { at: 'R2', reason: 'ttl' });
  const icmp = ss.find((x) => x.phase === 'icmp').icmp;
  assert.equal(icmp.type, 11);
  assert.equal(icmp.code, 0);
  assert.equal(icmp.dst, '192.168.1.10');
  assert.equal(icmp.src, '10.0.0.2', 'from R2\'s interface towards the source');
  assert.deepEqual(icmp.path, ['R2', 'R1', 'A']);
  assert.equal(icmp.dstMac, mac('12'));
  assert.equal(icmp.srcMac, mac('21'));
  assert.equal(at({ ttl0: 1 }, 3).icmp.src, '192.168.1.1', 'R1 drops: from its Gi0/0');
});

test('tie-break: the first frame goes to the gateway\'s MAC, not B\'s', () => {
  const s = at({}, 1);
  assert.equal(s.frame.dstMac, mac('11'));
  assert.notEqual(s.frame.dstMac, mac('14'));
  assert.equal(s.ip.dst, '192.168.2.20');
});

test('tie-break: the checksum step adds 0x0100 even when the high byte wraps (RFC 1624 eq. 3 = full recompute)', () => {
  // TTL is the high byte of the word TTL|protocol: 64|1 → 63|1
  assert.equal(logic.incrementalChecksum(0x99f4, 0x4001, 0x3f01), 0x9af4);
  // a checksum with high byte 0xff: +0x0100 wraps with end-around carry
  const hdr = { ttl: 64, proto: 1, src: '192.168.1.10', dst: '192.168.2.20', len: 84, id: 0x1c46 };
  for (const id of [0x1c46, 0x0000, 0xb64a, 0xffff]) {
    const a = Object.assign({}, hdr, { id }), b = Object.assign({}, a, { ttl: 63 });
    const hc = logic.headerChecksum(a);
    assert.equal(logic.incrementalChecksum(hc, 0x4001, 0x3f01), logic.headerChecksum(b), 'id ' + id.toString(16));
  }
  const wrap = Object.assign({}, hdr, { id: 0xb64a });   // checksum 0xffef
  assert.equal(logic.headerChecksum(wrap) >> 8, 0xff, 'this header has a 0xff high byte');
  assert.equal(logic.headerChecksum(Object.assign({}, wrap, { ttl: 63 })), ((logic.headerChecksum(wrap) + 0x100) & 0xffff) + 1);
});

// ── rules ──

test('rule 1: source and destination IP stay the same on every segment and in every state', () => {
  for (const o of Object.values(PRESETS)) {
    const dst = o.routers === 2 ? '192.168.3.20' : '192.168.2.20';
    for (const s of all(o)) { assert.equal(s.ip.src, '192.168.1.10'); assert.equal(s.ip.dst, dst); }
    for (const r of end(o).history) { assert.equal(r.src, '192.168.1.10'); assert.equal(r.dst, dst); }
  }
});

test('rule 2: each router builds a new frame: src = its outgoing interface, dst = the next hop', () => {
  const h = end(PRESETS['two-routers']).history;
  assert.deepEqual(h.map((r) => [r.srcMac, r.dstMac]), [[mac('0a'), mac('11')], [mac('12'), mac('21')], [mac('22'), mac('14')]]);
  assert.deepEqual(end({}).history.map((r) => [r.srcMac, r.dstMac]), [[mac('0a'), mac('11')], [mac('12'), mac('14')]]);
  const r1 = at(PRESETS['two-routers'], 2).work;
  assert.equal(r1.nextHop, '10.0.0.2');
  assert.equal(r1.egress.name, 'Gi0/1');
  assert.equal(at({}, 2).work.nextHop, '192.168.2.20', 'directly connected: the next hop is B');
});

test('rule 3: TTL drops by one at each router and not at hosts', () => {
  assert.deepEqual(end(PRESETS['two-routers']).history.map((r) => r.ttl), [64, 63, 62]);
  assert.deepEqual(end({}).history.map((r) => r.ttl), [64, 63]);
  const ss = all(PRESETS['two-routers']);
  assert.equal(ss[0].ip.ttl, 64, 'A sends ttl0');
  assert.equal(ss.find((x) => x.phase === 'arrive').ip.ttl, 62, 'B does not decrement');
  assert.equal(at({ ttl0: 30 }, 1).ip.ttl, 30);
});

test('rule 4: TTL 0 drops the packet; nothing crosses the next segment', () => {
  const ss = all(PRESETS['ttl-dies']);
  assert.ok(!ss.some((x) => x.phase === 'arrive'));
  assert.equal(end(PRESETS['ttl-dies']).history.length, 2);
  assert.equal(end(PRESETS['ttl-dies']).delivered, false);
  assert.equal(end({}).delivered, true);
});

test('rule 5: the header checksum is recomputed at every hop (task file values)', () => {
  assert.deepEqual(end({}).history.map((r) => r.csum), ['0x99f4', '0x9af4']);
  assert.deepEqual(end(PRESETS['two-routers']).history.map((r) => r.csum), ['0x98f4', '0x99f4', '0x9af4']);
  assert.deepEqual(end(PRESETS['ttl-dies']).history.map((r) => r.csum), ['0xd6f4', '0xd7f4']);
  assert.equal(at({}, 2).work.csumIn, '0x99f4');
  assert.equal(at({}, 2).work.csumOut, '0x9af4');
  for (const s of all(PRESETS['two-routers'])) assert.equal(logic.headerChecksum(s.ip), s.ip.csum, 'valid at step ' + s.phase);
});

test('rule 6: the FCS is recomputed for every new frame (CRC-32 as zlib)', () => {
  assert.equal(logic.crc32([...Buffer.from('123456789')]), 0xcbf43926, 'CRC-32 check value');
  assert.deepEqual(end({}).history.map((r) => r.fcs), ['0xfac50cbc', '0xc8bc7f0a']);
  assert.deepEqual(end(PRESETS['two-routers']).history.map((r) => r.fcs), ['0x546340f8', '0x9ba8557c', '0xb5e04438']);
  assert.deepEqual(end(PRESETS['ttl-dies']).history.map((r) => r.fcs), ['0x639f1e54', '0x587eec5c']);
  assert.equal(logic.checksumOf(logic.ECHO), 0, 'the echo request carries a valid checksum');
});

test('rule 7: nothing else in the header changes', () => {
  for (const s of all(PRESETS['two-routers'])) {
    assert.equal(s.ip.len, 84); assert.equal(s.ip.id, 0x1c46); assert.equal(s.ip.proto, 1);
  }
  const s = at({}, 2);
  assert.deepEqual(logic.changed(s), ['dstMac', 'srcMac', 'fcs', 'ttl', 'csum']);
  assert.deepEqual(logic.changed(at({}, 4)), [], 'B rewrites nothing');
  assert.deepEqual(logic.changed(at({}, 1)), [], 'segment 1 has nothing to compare with');
});

test('rule 8: cold ARP: R1 holds the packet, ARP request (broadcast) and reply, then the frame', () => {
  const ss = all(PRESETS['cold-arp']);
  const proc = ss[2];
  assert.equal(proc.phase, 'process');
  assert.equal(proc.held, true);
  assert.equal(proc.frame, null);
  assert.equal(proc.ip.ttl, 63, 'already decremented while it waits');
  assert.equal(proc.work.arp, 'miss');
  assert.deepEqual([ss[3].phase, ss[3].arpMsg.kind, ss[3].arpMsg.dstMac, ss[3].arpMsg.targetIp], ['arpReq', 'req', 'ff:ff:ff:ff:ff:ff', '192.168.2.20']);
  assert.deepEqual([ss[4].phase, ss[4].arpMsg.kind, ss[4].arpMsg.from, ss[4].arpMsg.senderMac], ['arpRep', 'rep', 'B', mac('14')]);
  assert.equal(ss[5].phase, 'cross');
  assert.equal(ss[5].frame.dstMac, mac('14'));
  assert.deepEqual(end(PRESETS['cold-arp']).history, end({}).history, 'the same frames as book');
  // two routers: R1 ARPs for R2, R2's cache stays warm
  const two = all({ routers: 2, coldArp: true });
  assert.equal(two.find((x) => x.phase === 'arpReq').arpMsg.targetIp, '10.0.0.2');
  assert.equal(two.filter((x) => x.phase === 'arpReq').length, 1);
});

test('steps per preset (task file) and the largest case', () => {
  assert.deepEqual(phases({}), ['cross:R1', 'process:R1', 'cross:B', 'arrive', 'summary']);
  assert.equal(logic.steps(P(PRESETS['two-routers'])), 7);
  assert.deepEqual(phases(PRESETS['ttl-dies']), ['cross:R1', 'process:R1', 'cross:R2', 'process:R2', 'icmp', 'summary']);
  assert.deepEqual(phases(PRESETS['cold-arp']), ['cross:R1', 'process:R1', 'arpReq', 'arpRep', 'cross:B', 'arrive', 'summary']);
  assert.equal(logic.steps(P({ ttl0: 1 })), 4);
  assert.equal(logic.steps(P({ routers: 2, coldArp: true })), 9);
  for (let ttl0 = 1; ttl0 <= 64; ttl0++) for (const routers of [1, 2]) for (const coldArp of [false, true]) {
    const n = logic.steps(P({ ttl0, routers, coldArp }));
    assert.ok(n >= 4 && n <= 9 && end({ ttl0, routers, coldArp }).done);
  }
});

test('summary compares the last segment with segment 1', () => {
  const s = end(PRESETS['two-routers']);
  assert.equal(s.ref.segment, 1);
  assert.deepEqual(logic.changed(s), ['dstMac', 'srcMac', 'fcs', 'ttl', 'csum']);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const o of [...Object.values(PRESETS), { routers: 2, coldArp: true }, { ttl0: 1 }]) {
    for (const s of all(o)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of [...Object.values(PRESETS), { routers: 2, coldArp: true }]) {
    const p = P(o);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ routers: 2, coldArp: true });
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

test('every preset in the page is valid for the model, and meta.steps is the default\'s', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});

// ── review additions (fresh reviewer's surviving mutations) ──

test('scene and work records: networks, routes, TTL out, ICMP TTL, ARP reply unicast', () => {
  assert.deepEqual(logic.sceneOf(P({ routers: 2 })).nets, ['192.168.1.0/24', '10.0.0.0/30', '192.168.3.0/24']);
  assert.deepEqual(end(PRESETS['two-routers']).history.map((r) => r.net), ['192.168.1.0/24', '10.0.0.0/30', '192.168.3.0/24']);
  const r1 = at(PRESETS['two-routers'], 2).work;
  assert.deepEqual(r1.lookup, { dst: '192.168.3.20', net: '192.168.3.0/24', iface: 'Gi0/1', via: '10.0.0.2' });
  assert.equal(r1.ttlOut, 63);
  assert.equal(at(PRESETS['two-routers'], 4).work.lookup.via, null);
  assert.equal(all(PRESETS['ttl-dies']).find((x) => x.phase === 'icmp').icmp.ttl, 64);
  const ss = all(PRESETS['cold-arp']);
  assert.equal(ss[3].arpMsg.senderIp, '192.168.2.1');
  assert.equal(ss[4].arpMsg.dstMac, mac('12'), 'the reply is unicast to R1');
  assert.equal(ss[5].work.nextMac, mac('14'), 'the frame line has the learned MAC');
  assert.equal(ss[5].work.arp, 'learned');
  assert.equal(at({}, 1).frame.type, '0x0800');
});

test('marks: R2 compares with segment 2, a drop summary compares with nothing, TTL is clamped to 1..64', () => {
  assert.equal(at(PRESETS['two-routers'], 4).ref.segment, 2);
  assert.equal(end(PRESETS['ttl-dies']).ref, null);
  assert.equal(at({ ttl0: 0 }, 0).ip.ttl, 1);
  assert.equal(at({ ttl0: 99 }, 0).ip.ttl, 64);
});
