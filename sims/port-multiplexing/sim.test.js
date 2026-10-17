// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for port-multiplexing's model: tie-breaks first, then one test per rule (SPEC.md), then the presets' numbers,
// then the student's open button, then the template's generic block.
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
/** A lookup as "key[failed fields]" per row read, and its result. */
const read = (s) => s.look.read.map((r) => `${r.key}[${r.miss.join(',')}]`).join(' ');
const pair = (c) => `${c.proto} ${c.cip}:${c.cport} ${c.sip}:${c.sport}`;
const seg = (g) => `${g.proto} ${g.sip}:${g.sport} > ${g.dip}:${g.dport} ${g.flag}`;
const tcp = (sip, sport, dip, dport, flag = 'ACK') => ({ proto: 'tcp', sip, sport, dip, dport, flag });
const SRV = '203.0.113.10';
/** A server table: connections (5-tuples from the server's side) and a listening TCP 443. */
const table = (conns, listen = [{ proto: 'tcp', port: 443 }]) => conns.map(([proto, rip, rport], i) => (
  { key: 'k' + (i + 1), conn: 'k' + (i + 1), proto, lip: SRV, lport: 443, rip, rport }
)).concat(listen.map((l) => ({ key: `L:${l.proto}:${l.port}`, listen: true, proto: l.proto, lip: '*', lport: l.port, rip: '*', rport: '*', flag: l.proto === 'tcp' ? 'SYN' : '*' })));

// ── tie-breaks ──

test('tie-break (rule 5): an exact match on an established connection wins over the listening socket', () => {
  const rows = table([['tcp', '192.168.1.50', 51000]]);
  // a SYN with the existing pair: row 1 decides, the listening socket is never read (rule 7 follows)
  const syn = logic.demux(rows, tcp('192.168.1.50', 51000, SRV, 443, 'SYN'));
  assert.equal(syn.at, 0);
  assert.equal(syn.result, 'same');
  assert.equal(syn.read.length, 1, 'the listening row is not read');
  // the same SYN with the listening socket alone becomes a new connection
  assert.equal(logic.demux(table([]), tcp('192.168.1.50', 51000, SRV, 443, 'SYN')).result, 'new');
  // data on the pair: the row, not the listening socket
  const data = logic.demux(rows, tcp('192.168.1.50', 51000, SRV, 443));
  assert.deepEqual([data.at, data.result, data.key], [0, 'deliver', 'k1']);
});

test('tie-break (rule 5): the listening TCP socket takes only a SYN; data with no row is rejected with RST', () => {
  const rows = table([['tcp', '192.168.1.50', 51000]]);
  const stray = logic.demux(rows, tcp('192.168.1.50', 51009, SRV, 443));
  assert.deepEqual(stray.read.map((r) => r.miss), [['rport'], ['flag']]);
  assert.deepEqual([stray.at, stray.result, stray.answer], [2, 'reject', 'rst']);
  const syn = logic.demux(rows, tcp('192.168.1.50', 51009, SRV, 443, 'SYN'));
  assert.deepEqual([syn.at, syn.result, syn.key], [1, 'new', 'L:tcp:443']);
});

test('tie-break (rule 5): the first matching row decides, in table order (connections in the order made)', () => {
  // two rows that both match are impossible in a valid table; with one forced, the earlier row wins
  const rows = table([['tcp', '192.168.1.50', 51000], ['tcp', '192.168.1.50', 51000]]);
  const r = logic.demux(rows, tcp('192.168.1.50', 51000, SRV, 443));
  assert.equal(r.key, 'k1');
});

test('tie-break (rule 7): a SYN with an existing pair adds no row, and its program gets no connection', () => {
  const p = P({ scene: 'port-clash', forcePort: 'reuse' });
  const s = at(p, 4);
  assert.equal(s.event.kind, 'open');
  assert.equal(s.look.result, 'same');
  assert.equal(read(s), 'k1[]');
  assert.equal(s.conns.length, 1);
  const tab2 = logic.hostOf(s, 'c50').procs.find((x) => x.id === 'tab2');
  assert.deepEqual(tab2.socks, [{ id: 'k2', proto: 'tcp', port: 51000, conn: null, fail: true }]);
  assert.deepEqual(at(p, 5).conns.length, 1);
  assert.deepEqual(s.look.decide, ['proto', 'sip', 'sport', 'dip', 'dport']);
  assert.ok(s.changed.includes('conn:k1'), 'the matched row is marked');
  assert.equal(s.event.forced, true, 'tab 2 gets 51000 again');
  assert.equal(at(p, 1).event.forced, false, 'the first 51000 is not "again"');
  // later events on that never-made connection do nothing
  const reuse = all(P({ scene: 'two-tabs', forcePort: 'reuse' })).slice(1).map((x) => x.event.kind);
  assert.deepEqual(reuse, ['open', 'open', 'send', 'none', 'none', 'reply']);
  const none = at(P({ scene: 'two-tabs', forcePort: 'reuse' }), 4).event;
  assert.deepEqual([none.what, none.host, none.prog], ['send', 'c50', 'tab2']);
});

// ── rules ──

test('rule 1: the destination port picks the process; replies to one IP go to three programs', () => {
  const p = P({ scene: 'three-programs' });
  const replies = all(p).filter((s) => s.event.kind === 'reply');
  assert.deepEqual(replies.map((s) => [s.seg.dip, s.seg.dport, s.event.prog]), [
    ['192.168.1.50', 52141, 'ssh'], ['192.168.1.50', 52140, 'browser'], ['192.168.1.50', 53217, 'game']
  ]);
  // the SSH reply: the browser's row fails on the ports (and the server), the SSH row delivers
  assert.equal(read(replies[0]), 'k1[lport,rip,rport] k2[]');
  assert.deepEqual(replies[0].look.decide, ['dport', 'sip', 'sport']);
  assert.ok(replies[0].changed.includes('prog:c50:ssh'));
  // a segment that differs from a row only in the destination port is not that row's
  const rows = table([['tcp', '192.168.1.50', 51000]]);
  const r = logic.demux(rows.slice(0, 1), { proto: 'tcp', sip: '192.168.1.50', sport: 51000, dip: SRV, dport: 444, flag: 'ACK' });
  assert.deepEqual(r.read[0].miss, ['lport']);
});

test('rule 2: each of the five values is part of the key', () => {
  const row = table([['tcp', '192.168.1.50', 51000]])[0];
  const base = { proto: 'tcp', sip: '192.168.1.50', sport: 51000, dip: SRV, dport: 443, flag: 'ACK' };
  assert.deepEqual(logic.missOf(row, base), []);
  assert.deepEqual(logic.missOf(row, Object.assign({}, base, { proto: 'udp' })), ['proto']);
  assert.deepEqual(logic.missOf(row, Object.assign({}, base, { dip: '203.0.113.11' })), ['lip']);
  assert.deepEqual(logic.missOf(row, Object.assign({}, base, { dport: 80 })), ['lport']);
  assert.deepEqual(logic.missOf(row, Object.assign({}, base, { sip: '192.168.1.60' })), ['rip']);
  assert.deepEqual(logic.missOf(row, Object.assign({}, base, { sport: 51001 })), ['rport']);
  // a listening row's '*' matches any remote socket, but not another port or protocol
  const lis = table([])[0];
  assert.deepEqual(logic.missOf(lis, Object.assign({}, base, { flag: 'SYN', sip: '9.9.9.9', sport: 1 })), []);
  assert.deepEqual(logic.missOf(lis, Object.assign({}, base, { flag: 'SYN', dport: 80 })), ['lport']);
});

test('rule 2: two tabs, three of four values equal, are two rows', () => {
  const e = end(P({ scene: 'two-tabs' }));
  assert.deepEqual(e.conns.map(pair), ['tcp 192.168.1.50:51000 203.0.113.10:443', 'tcp 192.168.1.50:51001 203.0.113.10:443']);
  const s2 = at(P({ scene: 'two-tabs' }), 2);
  assert.equal(read(s2), 'k1[rport] L:tcp:443[]');
  assert.equal(s2.look.result, 'new');
  assert.deepEqual(s2.look.decide, ['sport', 'flag']);
  assert.equal(read(at(P({ scene: 'two-tabs' }), 4)), 'k1[rport] k2[]');
});

test('rule 3: the OS picks a free port from the dynamic range, per host and per protocol', () => {
  const host = (socks, next = 0) => ({ next, procs: [{ socks }] });
  assert.equal(logic.pickPort(host([]), 'tcp', null, 'auto'), 49152, 'a fresh host starts at 49152');
  assert.equal(logic.pickPort(host([{ proto: 'tcp', port: 51000, conn: 'k1' }], 51001), 'tcp', null, 'auto'), 51001);
  // a used port is skipped; the same number in the other protocol is free
  const used = host([{ proto: 'tcp', port: 51001, conn: 'k1' }], 51001);
  assert.equal(logic.pickPort(used, 'tcp', null, 'auto'), 51002);
  assert.equal(logic.pickPort(used, 'udp', null, 'auto'), 51001);
  // a failed attempt does not hold its port
  assert.equal(logic.pickPort(host([{ proto: 'tcp', port: 51001, conn: null, fail: true }], 51001), 'tcp', null, 'auto'), 51001);
  // wraps at the top of the range
  assert.equal(logic.pickPort(host([{ proto: 'tcp', port: 65535, conn: 'k1' }], 65535), 'tcp', null, 'auto'), 49152);
  // the book's number when given; 51000 for everything under reuse
  assert.equal(logic.pickPort(host([]), 'tcp', 52140, 'auto'), 52140);
  assert.equal(logic.pickPort(host([]), 'tcp', 52140, 'reuse'), 51000);
  // every source port in every preset lies in 49152–65535 (and in Linux's 32768–60999)
  for (const scene of logic.SCENE_IDS) for (const forcePort of ['auto', 'reuse']) {
    for (const c of end(P({ scene, forcePort, adds: logic.addClick(0, 0, 'c50') })).conns) {
      assert.ok(c.cport >= 49152 && c.cport <= 60999, `${scene} ${c.cport}`);
    }
  }
  // port-clash tab 2 with auto: the next port after 51000
  assert.equal(at(P({ scene: 'port-clash' }), 4).seg.sport, 51001);
});

test('rule 4: a reply swaps source and destination', () => {
  for (const scene of logic.SCENE_IDS) {
    const fr = all(P({ scene }));
    for (const s of fr.filter((x) => x.event.kind === 'reply')) {
      const c = logic.connOf(s, s.event.conn);
      assert.deepEqual([s.seg.sip, s.seg.sport, s.seg.dip, s.seg.dport, s.seg.dir], [c.sip, c.sport, c.cip, c.cport, 'down']);
      assert.equal(s.look.side, 'client');
    }
    for (const s of fr.filter((x) => x.event.kind === 'send')) {
      const c = logic.connOf(s, s.event.conn);
      assert.deepEqual([s.seg.sip, s.seg.sport, s.seg.dip, s.seg.dport, s.seg.dir], [c.cip, c.cport, c.sip, c.sport, 'up']);
      assert.equal(s.look.side, 'server');
    }
  }
});

test('rule 6: the same source port on two hosts is two rows, told apart by the remote IP', () => {
  const p = P({ scene: 'many-clients' });
  const s2 = at(p, 2);
  assert.equal(read(s2), 'k1[rip] L:tcp:443[]');
  assert.deepEqual(s2.look.decide, ['sip', 'flag']);
  const s6 = at(p, 6);
  assert.equal(s6.event.kind, 'send');
  assert.equal(read(s6), 'k1[rip] k2[]');
  assert.deepEqual(s6.look.decide, ['sip']);
  assert.ok(s6.changed.includes('conn:k2'));
  assert.ok(!s6.changed.includes('conn:k1'));
});

test('rule 8: the protocol is part of the key; TCP and UDP from 51002 are two rows', () => {
  const p = P({ scene: 'quic-too' });
  const s2 = at(p, 2);
  assert.equal(read(s2), 'k1[proto] L:tcp:443[proto,flag] L:udp:443[]');
  assert.equal(s2.look.result, 'new');
  assert.deepEqual(s2.look.decide, ['proto'], 'a datagram has no flag to decide');
  assert.equal(s2.seg.flag, '');
  const s4 = at(p, 4);
  assert.equal(read(s4), 'k1[proto] k2[]');
  assert.deepEqual(s4.look.decide, ['proto']);
  assert.deepEqual(end(p).conns.map(pair), ['tcp 192.168.1.50:51002 203.0.113.10:443', 'udp 192.168.1.50:51002 203.0.113.10:443']);
});

test('rule 9: no socket for it: TCP answers RST, UDP answers ICMP port unreachable', () => {
  const rows = table([]);
  const t = logic.demux(rows, tcp('192.168.1.50', 51000, SRV, 8443, 'SYN'));
  assert.deepEqual([t.result, t.answer, t.at], ['reject', 'rst', 1]);
  const u = logic.demux(rows, { proto: 'udp', sip: '192.168.1.50', sport: 51000, dip: SRV, dport: 443, flag: '' });
  assert.deepEqual([u.result, u.answer], ['reject', 'icmp']);
  assert.deepEqual(logic.decidingFields(Object.assign({ flag: '' }, u)), []);
  // a bound UDP socket takes any datagram (no SYN)
  const b = logic.demux(table([], [{ proto: 'udp', port: 443 }]), { proto: 'udp', sip: '192.168.1.50', sport: 51000, dip: SRV, dport: 443, flag: '' });
  assert.equal(b.result, 'new');
});

test('bytes: a delivery adds the segment\'s payload to the matching row only; SYN carries none', () => {
  const p = P({ scene: 'two-tabs' });
  const fr = all(p);
  assert.deepEqual(fr.map((s) => s.conns.map((c) => c.bytes).join('/')), ['', '0', '0/0', '400/0', '400/400', '400/1600', '1600/1600']);
  assert.equal(logic.SEND_BYTES, 400);
  assert.equal(logic.REPLY_BYTES, 1200);
});

// ── presets ──

const PRESETS = {
  'three-programs': { scene: 'three-programs', view: 'client' },
  'two-tabs': { scene: 'two-tabs', view: 'server' },
  'many-clients': { scene: 'many-clients', view: 'server' },
  'port-clash': { scene: 'port-clash', forcePort: 'reuse', view: 'server' },
  'quic-too': { scene: 'quic-too', view: 'server' }
};

test('steps per preset: 9, 6, 10, 5, 5; the defaults 9', () => {
  assert.deepEqual(Object.fromEntries(Object.entries(PRESETS).map(([k, o]) => [k, steps(P(o))])),
    { 'three-programs': 9, 'two-tabs': 6, 'many-clients': 10, 'port-clash': 5, 'quic-too': 5 });
  assert.equal(steps(P({})), 9);
  for (const k of Object.keys(PRESETS)) assert.equal(logic.SCENES[k].view, PRESETS[k].view, `${k} default view`);
});

test('where each preset ends: its rows', () => {
  const rows = Object.fromEntries(Object.entries(PRESETS).map(([k, o]) => [k, end(P(o)).conns.map((c) => `${pair(c)} ${c.bytes}`)]));
  assert.deepEqual(rows, {
    'three-programs': ['tcp 192.168.1.50:52140 203.0.113.10:443 1600', 'tcp 192.168.1.50:52141 203.0.113.22:22 1600', 'tcp 192.168.1.50:53217 203.0.113.40:41800 1600'],
    'two-tabs': ['tcp 192.168.1.50:51000 203.0.113.10:443 1600', 'tcp 192.168.1.50:51001 203.0.113.10:443 1600'],
    'many-clients': ['tcp 192.168.1.50:51000 203.0.113.10:443 400', 'tcp 192.168.1.60:51000 203.0.113.10:443 400',
      'tcp 198.51.100.7:50122 203.0.113.10:443 400', 'tcp 198.51.100.8:58410 203.0.113.10:443 400', 'tcp 192.168.1.50:51001 203.0.113.10:443 400'],
    'port-clash': ['tcp 192.168.1.50:51000 203.0.113.10:443 2000'],
    'quic-too': ['tcp 192.168.1.50:51002 203.0.113.10:443 400', 'udp 192.168.1.50:51002 203.0.113.10:443 2000']
  });
  // many-clients: five rows, one listening socket
  const e = end(P(PRESETS['many-clients']));
  assert.equal(logic.tableOf(e, 'server', SRV).filter((r) => r.listen).length, 1);
  // port-clash with auto: two rows
  assert.equal(end(P({ scene: 'port-clash' })).conns.length, 2);
});

test('the segments of preset 1, step by step', () => {
  assert.deepEqual(all(P(PRESETS['three-programs'])).slice(1).map((s) => seg(s.seg)), [
    'tcp 192.168.1.50:52140 > 203.0.113.10:443 SYN', 'tcp 192.168.1.50:52141 > 203.0.113.22:22 SYN',
    'tcp 192.168.1.50:53217 > 203.0.113.40:41800 SYN', 'tcp 192.168.1.50:52140 > 203.0.113.10:443 ACK',
    'tcp 192.168.1.50:52141 > 203.0.113.22:22 ACK', 'tcp 192.168.1.50:53217 > 203.0.113.40:41800 ACK',
    'tcp 203.0.113.22:22 > 192.168.1.50:52141 ACK', 'tcp 203.0.113.10:443 > 192.168.1.50:52140 ACK',
    'tcp 203.0.113.40:41800 > 192.168.1.50:53217 ACK'
  ]);
});

test('forcePort reuse: rule 7 in two-tabs and many-clients; three-programs keeps three rows from 51000', () => {
  assert.equal(at(P({ scene: 'two-tabs', forcePort: 'reuse' }), 2).look.result, 'same');
  const m = all(P({ scene: 'many-clients', forcePort: 'reuse' }));
  assert.equal(m[5].look.result, 'same');
  assert.equal(m[10].event.kind, 'none');
  assert.equal(m[10].conns.length, 4);
  const t = end(P({ scene: 'three-programs', forcePort: 'reuse' }));
  assert.deepEqual(t.conns.map((c) => c.cport), [51000, 51000, 51000]);
  assert.equal(read(at(P({ scene: 'three-programs', forcePort: 'reuse' }), 7)), 'k1[rip,rport] k2[]');
});

test('sim.json steps is the defaults\' count, and its preset entries are the page\'s presets', () => {
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, steps(P({})));
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const e of sim.entries || []) assert.ok(html.includes(`id: '${e.preset}'`), e.preset);
});

// ── the open button ──

test('open button: adds packs clicks; each opens a new tab as the next step', () => {
  let v = logic.addClick(0, 3, 'c7');
  v = logic.addClick(v, 0, 'c50');
  assert.deepEqual(logic.decodeAdds(v), [{ after: 3, client: 'c7' }, { after: 0, client: 'c50' }]);
  assert.equal(logic.encodeAdds(logic.decodeAdds(v)), v);
  const p = P({ scene: 'two-tabs', adds: logic.addClick(0, 2, 'c7') });
  assert.equal(steps(p), 7);
  const s = at(p, 3);
  assert.deepEqual([s.event.kind, s.event.by, s.event.host], ['open', 'user', 'c7']);
  assert.equal(seg(s.seg), 'tcp 198.51.100.7:49152 > 203.0.113.10:443 SYN');
  assert.equal(s.look.result, 'new');
  assert.deepEqual(s.hosts.map((x) => x.id), ['c50', 'c7'], 'the new host joins in client order');
  // the step before is unchanged, and the script goes on after it
  assert.deepEqual(at(p, 2), at(P({ scene: 'two-tabs' }), 2));
  assert.equal(at(p, 4).event.kind, 'send');
  // a second tab on 192.168.1.50 after two-tabs' opens takes the next free port
  const q = P({ scene: 'two-tabs', adds: logic.addClick(0, 2, 'c50') });
  const t = at(q, 3);
  assert.equal(t.seg.sport, 51002);
  assert.equal(logic.hostOf(t, 'c50').procs.at(-1).tab, 3);
  // the student's open always goes to the web server on 443, also in the scene with three servers
  const u = at(P({ scene: 'three-programs', adds: logic.addClick(0, 9, 'c60') }), 10);
  assert.equal(seg(u.seg), 'tcp 192.168.1.60:49152 > 203.0.113.10:443 SYN');
  assert.ok(u.changed.includes('prog:c60:' + u.event.prog), 'the opening program is marked');
  // new hosts take their place in client order, whatever the click order
  const order = at(P({ scene: 'two-tabs', adds: logic.addClick(logic.addClick(0, 0, 'c8'), 1, 'c60') }), 2);
  assert.deepEqual(order.hosts.map((x) => x.id), ['c50', 'c60', 'c8']);
  // under reuse, a new tab on a host that already has 51000 → 443 hits rule 7
  assert.equal(at(P({ scene: 'two-tabs', forcePort: 'reuse', adds: logic.addClick(0, 1, 'c50') }), 2).look.result, 'same');
});

test('open button: at most 4 clicks, and at most 8 opens in a demo; the longest stays within 20 steps', () => {
  let v = 0;
  for (let i = 0; i < 6; i++) v = logic.addClick(v, 10, logic.CLIENT_IDS[i % 4]);
  assert.equal(logic.decodeAdds(v).length, logic.MAX_ADDS);
  // many-clients has 5 opens of its own: 3 more fit, a fourth click is ignored
  assert.equal(logic.addsLeft(P({ scene: 'many-clients' })), 3);
  assert.equal(logic.addsLeft(P({ scene: 'many-clients', adds: v })), 0);
  const p = P({ scene: 'many-clients', adds: v });
  assert.equal(steps(p), 13);
  assert.equal(end(p).conns.length, 8);
  for (const scene of logic.SCENE_IDS) {
    assert.equal(logic.addsLeft(P({ scene })), scene === 'many-clients' ? 3 : 4, scene);
    const q = P({ scene, adds: v });
    assert.ok(end(q).conns.length <= 8 && steps(q) <= 20, scene);
  }
  // a click past the end goes at the end
  assert.equal(logic.eventsOf(P({ scene: 'quic-too', adds: logic.addClick(0, 99, 'c8') })).at(-1).host, 'c8');
});

// ── generic checks every sim keeps ──

const VARIANTS = Object.values(PRESETS).concat([{}, { scene: 'many-clients', forcePort: 'reuse' },
  { scene: 'two-tabs', adds: logic.addClick(logic.addClick(0, 1, 'c60'), 4, 'c50') }]);

test('state is JSON-safe at every step', () => {
  for (const o of VARIANTS) {
    const p = P(o);
    for (let n = 0; n <= steps(p); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of VARIANTS) {
    const p = P(o);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input, and states handed out are copies', () => {
  const p = P({ scene: 'two-tabs' });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
  const s1 = at(p, 1);
  s1.conns[0].bytes = 999;
  assert.equal(at(p, 1).conns[0].bytes, 0);
});

test('the view param does not change the model', () => {
  for (const o of Object.values(PRESETS)) {
    const a = all(P(Object.assign({}, o, { view: 'server' })));
    const b = all(P(Object.assign({}, o, { view: 'client' })));
    assert.deepEqual(a, b);
  }
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
