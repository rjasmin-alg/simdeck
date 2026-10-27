// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for packet-journey's model. Run: node --test sims/packet-journey/
// Numbers from SPEC.md: URM ch16 (figure ch16-put-podataka-detaljno, "Adresa dobivena unaprijed" … "Zahtjev, odgovor i
// put unatrag", Primjer 1–6), ch08, ch11, ch13, ch14, ch18; RFC 9112 §9.3, RFC 8446 §2, RFC 5737.
// Tie-breaks first, then one test per rule, then the presets, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const run = (over) => { const p = P(over); const out = [logic.initial(p)]; for (let n = 1; n <= logic.steps(p); n++) out.push(logic.step(out[n - 1], n, p)); return out; };
const end = (over) => { const r = run(over); return r[r.length - 1]; };
const phases = (over) => run(over).slice(1).map((s) => s.phase);
const wire = (over) => run(over).slice(1).flatMap((s) => s.packets);
const PRESETS = {
  'prvi-student': {},
  'drugi-student': { dnsWarm: true, arpWarm: true },
  'arp-istekao': { scheme: 'https', dnsWarm: true },
  'novo-spajanje': { scheme: 'https', joined: false },
  'otvorena-veza': { dnsWarm: true, arpWarm: true, connOpen: true }
};
/** Every combination of the six params (64). */
function* allParams() {
  for (const scheme of ['http', 'https']) for (const joined of [true, false]) for (const dnsWarm of [false, true])
    for (const arpWarm of [false, true]) for (const connOpen of [false, true]) for (const close of [false, true])
      yield { scheme, joined, dnsWarm, arpWarm, connOpen, close };
}
const { HOST, ROUTER, SERVER, PORTS } = logic;

// ── tie-breaks ──

test('tie-break: a host cache that can answer wins; the phase is absent and no packet is drawn for it', () => {
  for (const over of allParams()) {
    const r = run(over);
    const all = r.slice(1).flatMap((s) => s.packets);
    if (over.dnsWarm) {
      assert.equal(all.filter((k) => k.app && k.app.proto === 'dns').length, 0, JSON.stringify(over));
      assert.equal(r[r.length - 1].chain.dns, 'absent');
      const click = r.find((s) => s.phase === 'click');
      assert.deepEqual([click.lookup.hit, click.packets.length], [true, 0]);
    }
    if (over.arpWarm) {
      assert.equal(all.filter((k) => k.app && k.app.proto === 'arp').length, 0, JSON.stringify(over));
      assert.equal(r[r.length - 1].chain.arp, 'absent');
    }
    if (over.connOpen && over.joined) {
      assert.equal(all.filter((k) => k.l4 && k.l4.flags && k.l4.flags.includes('SYN')).length, 0, JSON.stringify(over));
      assert.equal(r[r.length - 1].chain.tcp, 'absent');
      assert.equal(r[r.length - 1].chain.tls, over.scheme === 'https' ? 'absent' : 'unused');
      assert.equal(all.filter((k) => k.app && /hello/.test(k.app.msg)).length, 0);
    }
    // every lookup that hit is a step with nothing on the wire
    for (const s of r.slice(1)) if (s.phase === 'click' || s.phase === 'decide') assert.equal(s.packets.length, 0);
  }
});

test('tie-break: the client always asks the resolver on a host-cache miss (no resolver-cache shortcut)', () => {
  const q = wire({}).find((k) => k.kind === 'dns-q');
  assert.deepEqual([q.l3.dst, q.l4.dport, q.l4.proto, q.app.type], [ROUTER.lan, 53, 'udp', 'A']);
  // and there is no param that could hide it: unknown keys change nothing
  assert.deepEqual(run({ resolverWarm: true }), run({}));
});

test('tie-break: the ARP entry learnt for the resolver is the gateway\'s, so the second decision hits it', () => {
  const r = run({});
  assert.deepEqual(r[2].lookup, { table: 'arp', key: '192.168.1.1', hit: false });
  assert.equal(r[7].phase, 'decide');
  assert.deepEqual([r[7].decision.local, r[7].decision.nextHop, r[7].lookup.hit], [false, '192.168.1.1', true]);
  assert.equal(r[7].chain.arp, 'done', 'a hit after the exchange does not turn ARP absent');
  assert.equal(wire({}).filter((k) => k.app && k.app.proto === 'arp').length, 2);
});

test('tie-break: connOpen is ignored while the host has no address', () => {
  assert.deepEqual(run({ joined: false, connOpen: true }), run({ joined: false }));
  assert.deepEqual(logic.norm({ joined: false, connOpen: true }).connOpen, false);
});

// ── rules ──

test('rule 1: DHCP only without an address: DORA as broadcast 68 ↔ 67, the ACK gives mask, gateway and DNS', () => {
  const r = run({ joined: false });
  assert.deepEqual([r[1].phase, r[2].phase, r[3].phase], ['dhcp1', 'dhcp2', 'click']);
  const dora = r[1].packets.concat(r[2].packets);
  assert.deepEqual(dora.map((k) => k.app.msg), ['discover', 'offer', 'request', 'ack']);
  for (const k of dora) {
    assert.equal(k.l2.dst, logic.BCAST_MAC);
    assert.equal(k.cast, 'broadcast');
    assert.equal(k.l3.dst, '255.255.255.255');
    assert.deepEqual([k.l4.proto, k.dir === 'out' ? k.l4.dport : k.l4.sport], ['udp', 67]);
  }
  assert.equal(dora[0].l3.src, '0.0.0.0');
  assert.equal(r[1].host, null, 'no address until the ACK');
  assert.deepEqual(r[2].host, { ip: HOST.ip, prefix: 24, gw: ROUTER.lan, dns: ROUTER.lan });
  assert.deepEqual([dora[3].app.prefix, dora[3].app.router, dora[3].app.dns], [24, ROUTER.lan, ROUTER.lan]);
  assert.equal(r[2].chain.dhcp, 'done');
  // joined: no DHCP packet, absent at step 1
  const j = run({});
  assert.equal(j[1].chain.dhcp, 'absent');
  assert.equal(j[0].chain.dhcp, 'pending');
  assert.equal(wire({}).filter((k) => k.app && k.app.proto === 'dhcp').length, 0);
});

test('rule 2: the name is resolved before any packet to the server; the host cache is asked first', () => {
  for (const over of allParams()) {
    const ph = phases(over);
    const click = ph.indexOf('click');
    assert.equal(ph.slice(0, click).filter((x) => !x.startsWith('dhcp')).length, 0, 'click comes right after DHCP');
    const firstToServer = run(over).findIndex((s) => s.packets.some((k) => k.l3 && k.l3.dst === SERVER.ip));
    const answer = run(over).findIndex((s) => s.phase === 'dns-a' || (s.phase === 'click' && s.lookup.hit));
    assert.ok(answer > 0 && answer < firstToServer, JSON.stringify(over));
  }
  assert.deepEqual(run({})[1].lookup, { table: 'dns', key: 'example.com', hit: false });
});

test('rule 3: on a miss, one recursive query to the resolver and an answer stored with its TTL', () => {
  const r = run({});
  const q = r[5].packets[0], a = r[6].packets[0];
  assert.deepEqual([r[5].phase, r[6].phase], ['dns-q', 'dns-a']);
  assert.deepEqual([q.l3.src, q.l3.dst, q.l4.sport, q.l4.dport], [HOST.ip, ROUTER.lan, 50500, 53]);
  assert.deepEqual([a.app.name, a.app.ip, a.app.ttl], ['example.com', '203.0.113.10', 300]);
  assert.deepEqual(r[5].dnsCache, {});
  assert.deepEqual(r[6].dnsCache, { 'example.com': { ip: '203.0.113.10', ttl: 300 } });
  assert.deepEqual(r[6].wrote, [{ table: 'dns', key: 'example.com' }]);
  assert.equal(wire({}).filter((k) => k.app && k.app.proto === 'dns').length, 2, 'one query, one answer: no iterative walk');
});

test('rule 4: local or remote is the AND with the host\'s mask, with nothing on the wire', () => {
  const host = { ip: HOST.ip, prefix: 24, gw: ROUTER.lan };
  assert.deepEqual(logic.decide(host, '192.168.1.1'), { dst: '192.168.1.1', own: '192.168.1.0', theirs: '192.168.1.0', mask: '255.255.255.0', local: true, nextHop: '192.168.1.1' });
  assert.deepEqual(logic.decide(host, '203.0.113.10'), { dst: '203.0.113.10', own: '192.168.1.0', theirs: '203.0.113.0', mask: '255.255.255.0', local: false, nextHop: '192.168.1.1' });
  // a neighbour on the same /24 is local and is its own next hop, not the gateway
  assert.equal(logic.decide(host, '192.168.1.200').nextHop, '192.168.1.200');
  assert.equal(logic.decide({ ip: HOST.ip, prefix: 25, gw: ROUTER.lan }, '192.168.1.200').nextHop, ROUTER.lan);
  const r = run({});
  assert.equal(r[2].packets.length, 0);
  assert.equal(r[2].chain.local, 'done');
});

test('rule 5: ARP for the next hop: miss → broadcast request and unicast reply, stored; hit → nothing', () => {
  const r = run({});
  const q = r[3].packets[0], a = r[4].packets[0];
  assert.deepEqual([q.cast, q.l2.src, q.l2.dst, q.app.op, q.app.tpa], ['broadcast', 'aa:23', logic.BCAST_MAC, 'request', '192.168.1.1']);
  assert.deepEqual([a.cast, a.l2.src, a.l2.dst, a.app.op, a.app.sha], ['unicast', 'bb:01', 'aa:23', 'reply', 'bb:01']);
  assert.deepEqual(r[3].arp, {});
  assert.deepEqual(r[4].arp, { '192.168.1.1': 'bb:01' });
  assert.equal(r[4].chain.arp, 'done');
  // order: ARP → DNS → TCP (ch16 Primjer 1)
  assert.deepEqual(phases({}).filter((x) => /^(arp-|dns-|syn$)/.test(x)), ['arp-req', 'arp-rep', 'dns-q', 'dns-a', 'syn']);
  // with DNS warm the ARP is for the gateway, before the SYN (Primjer 2)
  assert.deepEqual(phases({ dnsWarm: true }).slice(0, 5), ['click', 'decide', 'arp-req', 'arp-rep', 'syn']);
  assert.equal(logic.arpLookup({}, '192.168.1.1'), null);
  const hit = run({ arpWarm: true })[2];
  assert.deepEqual([hit.lookup.hit, hit.packets.length, hit.chain.arp], [true, 0, 'absent']);
});

test('rule 6: the switch floods broadcasts and unknown destinations, forwards the rest, never changes a frame', () => {
  assert.deepEqual(logic.switchAction(logic.SW_TABLE, logic.BCAST_MAC), { flood: true, port: null });
  assert.deepEqual(logic.switchAction(logic.SW_TABLE, 'de:ad'), { flood: true, port: null });
  assert.deepEqual(logic.switchAction(logic.SW_TABLE, 'bb:01'), { flood: false, port: 'router' });
  const r = run({});
  assert.equal(r[3].sw.flood, true);
  assert.equal(r[5].sw.flood, false);
  assert.equal(r[3].chain.switch, 'done', 'done at the first frame through it');
  assert.equal(r[2].chain.switch, 'pending');
  // every LAN frame keeps the MACs it was sent with: from the host to the router's LAN MAC, or back
  for (const over of allParams()) for (const k of wire(over)) {
    if (k.view !== 'lan') continue;
    assert.ok((k.l2.src === 'aa:23' && (k.l2.dst === 'bb:01' || k.l2.dst === logic.BCAST_MAC)) ||
      (k.l2.src === 'bb:01' && (k.l2.dst === 'aa:23' || k.l2.dst === logic.BCAST_MAC)), JSON.stringify(k.l2));
  }
});

test('rule 7: at the router IP addresses stay, TTL drops by one, both MACs are new', () => {
  const k = { l2: { src: 'aa:23', dst: 'bb:01' }, l3: { src: '1.1.1.1', dst: '2.2.2.2', ttl: 64 }, l4: null };
  const f = logic.routerForward(k, 'bb:02', 'cc:01');
  assert.deepEqual([f.l2.src, f.l2.dst, f.l3.src, f.l3.dst, f.l3.ttl], ['bb:02', 'cc:01', '1.1.1.1', '2.2.2.2', 63]);
  assert.equal(k.l3.ttl, 64, 'input untouched');
  const r = run({});
  const syn = r[8].packets[0], hop = r[9].packets[0];
  assert.deepEqual([r[9].phase, syn.l3.ttl, hop.l3.ttl, hop.l3.dst, hop.l2.src, hop.l2.dst], ['hop', 64, 63, SERVER.ip, 'bb:02', 'cc:01']);
  assert.deepEqual(hop.changed, ['l2.src', 'l2.dst', 'l3.ttl', 'l3.src', 'l4.sport']);
  assert.ok(!hop.changed.includes('l3.dst'), 'the destination IP never changes');
  assert.deepEqual(syn.path, ['PC', 'AP', 'SW', 'R'], 'the first packet stops at the router');
  assert.deepEqual(hop.path, ['R', 'NET', 'SRV']);
  // replies from the server: 64 − 10 Internet hops − 1 at the router
  assert.equal(r[10].packets[0].l3.ttl, 64 - logic.INTERNET_HOPS - 1);
});

test('rule 8: NAPT rewrites the source once, stores it, reuses it, reverses it; the capture never shows it', () => {
  const r = run({});
  assert.deepEqual(r[8].nat, []);
  assert.deepEqual(r[9].nat, [{ priv: '192.168.1.23:51000', pub: '198.51.100.7:40001' }]);
  assert.deepEqual([r[9].packets[0].l3.src, r[9].packets[0].l4.sport], ['198.51.100.7', 40001]);
  assert.deepEqual(r[9].natUse, { row: 0, dir: 'out', created: true });
  assert.deepEqual(r[11].natUse, { row: 0, dir: 'out', created: false }, 'later packets reuse the row');
  assert.deepEqual(r[10].natUse, { row: 0, dir: 'in', created: false });
  assert.deepEqual(r[10].packets[0].nat, { field: 'dst', wire: '192.168.1.23:51000', pub: '198.51.100.7:40001' });
  assert.deepEqual([r[10].packets[0].l3.dst, r[10].packets[0].l4.dport], [HOST.ip, 51000], 'reversed before the client\'s link');
  assert.equal(end({}).nat.length, 1);
  assert.deepEqual(logic.natIn([{ priv: 'a', pub: 'b' }], 'c'), null);
  assert.deepEqual(logic.natOut([{ priv: 'a', pub: 'b' }], 'x'), { row: 1, pub: '198.51.100.7:40002', created: true });
  // the misconception: nothing on the client's link (so nothing in its capture) carries the public address
  for (const over of allParams()) {
    for (const c of end(over).capture) assert.ok(![c.src, c.dst].includes(ROUTER.pub), JSON.stringify(over));
    for (const k of wire(over)) if (k.view === 'lan') assert.ok(![k.l3 && k.l3.src, k.l3 && k.l3.dst].includes(ROUTER.pub));
    assert.equal(run(over).slice(1).filter((s) => s.phase === 'hop').every((s) => s.newCapture.length === 0), true);
  }
});

test('rule 9: SYN, SYN-ACK, ACK from 51000 to 80 or 443, unless a connection is already open', () => {
  for (const scheme of ['http', 'https']) {
    const port = scheme === 'https' ? 443 : 80;
    const r = run({ scheme });
    const tcp = r.slice(1).flatMap((s) => s.newCapture.map((i) => s.capture[i])).filter((c) => c.filter === 'tcp');
    assert.deepEqual(tcp.map((c) => c.flags.join(',')), ['SYN', 'SYN,ACK', 'ACK']);
    assert.deepEqual(tcp.map((c) => (c.dir === 'out' ? [c.sport, c.dport] : [c.dport, c.sport])), [[51000, port], [51000, port], [51000, port]]);
    const syn = r.find((s) => s.phase === 'syn'), sa = r.find((s) => s.phase === 'synack');
    assert.deepEqual(syn.conns, [{ sport: 51000, dst: SERVER.ip, dport: port, state: 'syn-sent' }]);
    assert.equal(sa.conns[0].state, 'established');
    assert.equal(r.find((s) => s.phase === 'ack').chain.tcp, 'done');
  }
  const open = run({ connOpen: true, dnsWarm: true, arpWarm: true });
  assert.deepEqual(open[0].conns, [{ sport: 51000, dst: SERVER.ip, dport: 80, state: 'established' }]);
  assert.deepEqual([open[3].phase, open[3].chain.tcp, open[3].lookup.table], ['req', 'absent', 'conn']);
  // an open connection on the other port does not count (the open one is for this scheme's port)
  assert.equal(phases({ connOpen: true, scheme: 'https' }).includes('syn'), false);
});

test('rule 10: https adds TLS 1.3 in two steps after TCP, then only encrypted data; http shows GET and 200', () => {
  const ph = phases({ scheme: 'https' });
  assert.deepEqual(ph.slice(ph.indexOf('ack')), ['ack', 'tls1', 'tls2', 'req', 'resp']);
  const r = run({ scheme: 'https' });
  const tls = r.slice(1).flatMap((s) => s.packets).filter((k) => k.app && k.app.proto === 'tls');
  assert.deepEqual(tls.map((k) => k.app.msg), ['client-hello', 'server-hello', 'app-data', 'app-data']);
  assert.deepEqual(end({ scheme: 'https' }).capture.filter((c) => c.filter === 'http'), [], 'no readable GET or 200');
  assert.equal(r[0].chain.tls, 'pending');
  assert.equal(run({})[0].chain.tls, 'unused');
  const http = end({}).capture.filter((c) => c.filter === 'http');
  assert.deepEqual(http.map((c) => c.app.msg), ['get', '200']);
  assert.equal(phases({}).some((x) => x.startsWith('tls')), false);
});

test('rule 11: the response returns the same way, through the same router, and reaches the host', () => {
  for (const over of allParams()) for (const k of wire(over)) {
    if (k.dir !== 'in' || !k.l3 || k.l3.src !== SERVER.ip) continue;
    assert.deepEqual(k.path, ['SRV', 'NET', 'R', 'SW', 'AP', 'PC']);
    assert.deepEqual([k.l2.src, k.l2.dst, k.l3.dst], ['bb:01', 'aa:23', HOST.ip]);
  }
  for (const k of wire({})) if (k.dir === 'out' && k.l3 && k.l3.dst === SERVER.ip && k.kind !== 'syn' && k.kind !== 'hop') assert.deepEqual(k.path, ['PC', 'AP', 'SW', 'R', 'NET', 'SRV']);
});

test('rule 12: the connection stays open; close adds FIN and ACK each way in two steps', () => {
  for (const over of Object.values(PRESETS)) {
    const s = end(over);
    assert.equal(s.capture.some((c) => c.flags && c.flags.includes('FIN')), false);
    assert.equal(s.chain.close, 'absent');
    assert.equal(s.conns[0].state, 'established');
    const c = run(Object.assign({}, over, { close: true }));
    assert.equal(c.length - 1, logic.steps(P(over)) + 2);
    const last = c.slice(-2);
    assert.deepEqual(last.map((x) => x.phase), ['fin-c', 'fin-s']);
    assert.deepEqual(last.map((x) => x.packets.map((k) => k.dir + ':' + k.l4.flags.join(','))),
      [['out:FIN,ACK', 'in:ACK'], ['in:FIN,ACK', 'out:ACK']]);
    assert.deepEqual(last.map((x) => x.conns[0].state), ['fin-wait-2', 'time-wait']);
    assert.equal(c[c.length - 1].chain.close, 'done');
  }
});

test('tie-break: an open connection implies the name is known: DNS is absent with it', () => {
  assert.equal(logic.norm({ connOpen: true }).dnsWarm, true);
  assert.deepEqual(run({ connOpen: true }), run({ connOpen: true, dnsWarm: true }));
  assert.equal(logic.norm({ connOpen: true, joined: false }).dnsWarm, false);
});

test('invariant over all params: an ARP hit if and only if the next hop is already in the table', () => {
  for (const over of allParams()) {
    const r = run(over);
    for (let n = 1; n < r.length; n++) {
      const s = r[n];
      if (s.phase !== 'decide') continue;
      const known = Object.prototype.hasOwnProperty.call(r[n - 1].arp, s.decision.nextHop);
      assert.equal(s.lookup.hit, known, JSON.stringify(over));
      assert.equal(r[n + 1].phase === 'arp-req', !known);
    }
    const arpPk = wire(over).filter((k) => k.app && k.app.proto === 'arp');
    assert.equal(arpPk.length, over.arpWarm ? 0 : 2, JSON.stringify(over));
  }
});

test('addresses inside the messages: DHCP sources, ARP sender and target, DNS ports, request flags', () => {
  const d = run({ joined: false });
  assert.deepEqual(d[1].packets.map((k) => k.l3.src), ['0.0.0.0', ROUTER.lan]);
  assert.deepEqual(d[2].packets.map((k) => k.l3.src), ['0.0.0.0', ROUTER.lan]);
  assert.equal(d[2].packets[0].app.requested, HOST.ip);
  const r = run({});
  assert.deepEqual([r[3].packets[0].app.spa, r[3].packets[0].app.tpa], [HOST.ip, ROUTER.lan]);
  assert.deepEqual([r[4].packets[0].app.spa, r[4].packets[0].app.tpa], [ROUTER.lan, HOST.ip]);
  assert.deepEqual([r[6].packets[0].l4.sport, r[6].packets[0].l4.dport], [53, 50500]);
  assert.deepEqual([r[12].packets[0].l4.flags, r[13].packets[0].l4.flags], [['PSH', 'ACK'], ['PSH', 'ACK']]);
  // the switch forwards every unicast frame, in both directions; it floods only broadcasts
  for (const over of allParams()) for (const s of run(over).slice(1)) if (s.sw) {
    assert.equal(s.sw.flood, s.packets[s.packets.length - 1].l2.dst === logic.BCAST_MAC, s.phase);
  }
});

test('the router hop changes only MACs, TTL and the source socket; the destination port stays', () => {
  for (const scheme of ['http', 'https']) {
    const hop = run({ scheme }).find((s) => s.phase === 'hop').packets[0];
    assert.deepEqual([hop.l3.dst, hop.l4.dport, hop.l4.flags], [SERVER.ip, scheme === 'https' ? 443 : 80, ['SYN']]);
  }
});

test('TLS goes ClientHello out, ServerHello in', () => {
  const r = run({ scheme: 'https' });
  assert.deepEqual(r.slice(1).filter((s) => s.phase.startsWith('tls')).map((s) => s.packets[0].dir + ':' + s.packets[0].app.msg), ['out:client-hello', 'in:server-hello']);
});

test('a request after a handshake is not treated as an open connection', () => {
  for (const over of allParams()) {
    const r = run(over), opened = r.some((x) => x.phase === 'syn');
    r.filter((x) => x.phase === 'req').forEach((x, i) =>
      assert.equal(x.lookup ? x.lookup.table : null, !opened && i === 0 ? 'conn' : null, JSON.stringify(over)));
  }
});

test('an open connection brings its NAT row: never written again, only found', () => {
  const r = run(PRESETS['otvorena-veza']);
  assert.deepEqual(r[0].nat, [{ priv: '192.168.1.23:51000', pub: '198.51.100.7:40001' }]);
  for (const s of r.slice(1)) {
    assert.equal(s.wrote.some((w) => w.table === 'nat'), false);
    if (s.natUse) assert.equal(s.natUse.created, false);
  }
  assert.deepEqual(r[r.length - 1].nat, r[0].nat);
});

test('every TCP packet on the client\'s link after the hop carries its NAT note', () => {
  for (const over of allParams()) for (const s of run(over).slice(1)) for (const k of s.packets) {
    if (!k.l4 || k.l4.proto !== 'tcp' || k.kind === 'syn') continue;
    assert.ok(k.nat, `${s.phase} ${JSON.stringify(over)}`);
    assert.equal(k.nat.field, k.dir === 'out' ? 'src' : 'dst');
  }
});

test('prvi-student per step: the chain, the rows written and the chain changes (SPEC.md table)', () => {
  const r = run({});
  const chainAt = (n) => logic.CHAIN.map((k) => r[n].chain[k][0]).join('');
  // one letter per phase in CHAIN order (dhcp … close): p pending, d done, a absent, u unused
  assert.deepEqual(r.map((_, n) => chainAt(n)), ['ppppppppupp', 'apppppppupp', 'apdpppppupp', 'apdpdpppupp', 'apdddpppupp',
    'apdddpppupp', 'addddpppupp', 'addddpppupp', 'addddpppupp', 'addddddpupp', 'addddddpupp', 'adddddddupp', 'adddddddupp',
    'addddddduda']);
  assert.deepEqual(r.slice(1).map((s) => s.wrote.map((w) => w.table + ':' + w.key).join(',')),
    ['', '', '', 'arp:192.168.1.1', '', 'dns:example.com', '', 'conn:51000', 'nat:0', 'conn:51000', '', '', '']);
  assert.deepEqual(r.slice(1).map((s) => s.chainChanged.join(',')),
    ['dhcp', 'local', 'switch', 'arp', '', 'dns', '', '', 'router,nat', '', 'tcp', '', 'http,close']);
});

// ── presets (SPEC.md table) ──

test('presets: steps, capture and chain at the end', () => {
  const expect = {
    'prvi-student': [13, 'arp arp dns dns tcp tcp tcp http http', { dhcp: 'absent', tls: 'unused', close: 'absent' }],
    'drugi-student': [8, 'tcp tcp tcp http http', { dhcp: 'absent', dns: 'absent', arp: 'absent', tls: 'unused', close: 'absent' }],
    'arp-istekao': [12, 'arp arp tcp tcp tcp tls tls tls tls', { dhcp: 'absent', dns: 'absent', close: 'absent' }],
    'novo-spajanje': [17, 'dhcp dhcp dhcp dhcp arp arp dns dns tcp tcp tcp tls tls tls tls', { close: 'absent' }],
    'otvorena-veza': [6, 'http http http http', { dhcp: 'absent', dns: 'absent', arp: 'absent', tcp: 'absent', tls: 'unused', close: 'absent' }]
  };
  for (const [id, [n, cap, odd]] of Object.entries(expect)) {
    const p = P(PRESETS[id]);
    assert.equal(logic.steps(p), n, id);
    const s = end(PRESETS[id]);
    assert.equal(s.capture.map((c) => c.filter).join(' '), cap, id);
    assert.deepEqual(s.capture.map((c) => c.n), s.capture.map((_, i) => i + 1));
    for (const k of logic.CHAIN) assert.equal(s.chain[k], odd[k] || 'done', `${id} ${k}`);
    assert.equal(s.next, null);
  }
  // otvorena-veza: two GET/200 pairs on the same source port, no SYN
  const ov = end(PRESETS['otvorena-veza']).capture;
  assert.deepEqual(ov.map((c) => c.app.msg + ':' + (c.dir === 'out' ? c.sport : c.dport)), ['get:51000', '200:51000', 'get:51000', '200:51000']);
  assert.deepEqual(ov.filter((c) => c.app.msg === 'get').map((c) => c.app.path), ['/', '/logo.png']);
  // novo-spajanje: DHCP first
  assert.deepEqual(phases(PRESETS['novo-spajanje']).slice(0, 3), ['dhcp1', 'dhcp2', 'click']);
});

test('steps never exceed 19 (novo-spajanje with close); the default is prvi-student', () => {
  let max = 0;
  for (const over of allParams()) max = Math.max(max, logic.steps(P(over)));
  assert.equal(max, 19);
  assert.equal(logic.steps(P({ scheme: 'https', joined: false, close: true })), 19);
  assert.equal(logic.steps(logic.defaults), 13);
});

test('prvi-student step by step: what the header card shows (SPEC.md table)', () => {
  const r = run({});
  const row = (s) => { const k = s.packets[s.packets.length - 1]; return k ? [k.l2.src, k.l2.dst, k.l3 ? k.l3.ttl : null].join(' ') : '-'; };
  assert.deepEqual(r.slice(1).map(row), ['-', '-', 'aa:23 ff:ff:ff:ff:ff:ff ', 'bb:01 aa:23 ', 'aa:23 bb:01 64', 'bb:01 aa:23 64', '-',
    'aa:23 bb:01 64', 'bb:02 cc:01 63', 'bb:01 aa:23 53', 'aa:23 bb:01 64', 'aa:23 bb:01 64', 'bb:01 aa:23 53']);
});

test('params out of range fall back to the defaults', () => {
  assert.deepEqual(run({ scheme: 'ftp', joined: 'x', dnsWarm: 1 }), run({ joined: true }));
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of allParams()) for (const s of run(over)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of Object.values(PRESETS)) {
    const p = P(over);
    const forward = run(over);
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const over of allParams()) {
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

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const ids = [...html.matchAll(/\{ id: '([a-z0-9-]+)', label:/g)].map((m) => m[1]);
  assert.deepEqual(ids, Object.keys(PRESETS));
});
