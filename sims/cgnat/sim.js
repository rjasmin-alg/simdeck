/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cgnat: a connection crosses two NATs, the subscriber's home router (NAT 1) and the carrier's NAT (CGN,
   NAT 2), with the shared address space 100.64.0.0/10 between them (URM ch. 11 "NAT" and Primjer 4; URM ch. 08,
   Šire o temi; RFC 6598; RFC 6888). Outbound a packet is translated twice and its reply twice back; an inbound packet
   nobody asked for dies at the CGN, so a port forward on the home router is never read. Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   freePort, translateOut and translateIn are from sims/nat/sim.js @ ff047ee (the nat model is not in models/ yet);
   translateOut takes an optional nat.first (the first port to hand out), which the copy adds (NOTES.md, Shared
   requests). Everything else is pure over plain data, ready for models/. */
(function (root) {
  'use strict';

  // ── from sims/nat/sim.js @ ff047ee ──

  var FIRST_PORT = 61000;

  function ep(ip, port) { return { ip: ip, port: port }; }
  function same(a, b) { return a.ip === b.ip && a.port === b.port; }

  /** The lowest port from `first` up that no row of the table uses on outside address `ip`. */
  function freePort(table, ip, first) {
    var port = first;
    for (;;) {
      var taken = table.some(function (r) { return r.outside.ip === ip && r.outside.port === port; });
      if (!taken) return port;
      port++;
    }
  }

  /** An outbound packet { src, dst } reaches R. nat = { mode: 'pat' | 'basic', pool: [outside addresses], first }.
      Returns { table, row, outcome, out }: outcome 'new' (a row is added), 'reuse' (a row for this connection, or
      under Basic NAT for this inside address, already exists) or 'nofree' (Basic NAT: every outside address is bound
      to another host, so the packet is dropped and out is null). The input table is not changed.
      cgnat: nat.first (optional, default 61000) is the first port PAT hands out. */
  function translateOut(table, nat, pkt) {
    var i, r;
    for (i = 0; i < table.length; i++) {
      r = table[i];
      var hit = nat.mode === 'pat' ? same(r.inside, pkt.src) && same(r.dest, pkt.dst) : r.inside.ip === pkt.src.ip;
      if (hit) return { table: table, row: i, outcome: 'reuse', out: { src: ep(r.outside.ip, nat.mode === 'pat' ? r.outside.port : pkt.src.port), dst: pkt.dst } };
    }
    var outside;
    if (nat.mode === 'pat') {
      outside = ep(nat.pool[0], freePort(table, nat.pool[0], nat.first || FIRST_PORT));
    } else {
      var free = nat.pool.filter(function (a) { return !table.some(function (x) { return x.outside.ip === a; }); });
      if (!free.length) return { table: table, row: -1, outcome: 'nofree', out: null };
      outside = ep(free[0], pkt.src.port); // Basic NAT: the port is not translated
    }
    var row = { inside: ep(pkt.src.ip, pkt.src.port), outside: outside, dest: ep(pkt.dst.ip, pkt.dst.port) };
    return { table: table.concat([row]), row: table.length, outcome: 'new', out: { src: outside, dst: pkt.dst } };
  }

  /** An inbound packet { src, dst } reaches R's outside. PAT looks up the outside address and port; Basic NAT the
      outside address alone. Returns { row, out }: the row found and the packet with its destination rewritten, or
      row -1 and out null (dropped). */
  function translateIn(table, nat, pkt) {
    for (var i = 0; i < table.length; i++) {
      var r = table[i];
      if (nat.mode === 'pat' ? same(r.outside, pkt.dst) : r.outside.ip === pkt.dst.ip) {
        var to = nat.mode === 'pat' ? ep(r.inside.ip, r.inside.port) : ep(r.inside.ip, pkt.dst.port);
        return { row: i, out: { src: pkt.src, dst: to } };
      }
    }
    return { row: -1, out: null };
  }

  // ── end of the copy ──

  /** The scene (SPEC.md "Scene"). Every home uses the same private range and host address (RFC 6598 §4). */
  var SUBS = [
    { id: 'A', host: '192.168.1.10', cpe: '100.64.0.5' },
    { id: 'B', host: '192.168.1.10', cpe: '100.64.0.6' },
    { id: 'C', host: '192.168.1.10', cpe: '100.64.0.7' }
  ];
  var SRC_PORT = 51000;
  var HOME_FIRST = 61000;
  var CGN_FIRST = 62000;
  var CGN_PUBLIC = '203.0.113.5';
  var CGN_INSIDE = '100.64.0.1';
  var SERVER = ep('198.51.100.10', 443);
  var CLIENT = ep('192.0.2.50', 50000);
  /** The port forward on A's home router (param portForward). */
  var FORWARD = { outside: ep('100.64.0.5', 8080), inside: ep('192.168.1.10', 8080) };
  var PROBE_PORT = 62050;

  function homeNat(i) { return { mode: 'pat', pool: [SUBS[i].cpe], first: HOME_FIRST }; }
  var CGN_NAT = { mode: 'pat', pool: [CGN_PUBLIC], first: CGN_FIRST };

  function ipNum(ip) {
    return ip.split('.').reduce(function (n, o) { return n * 256 + Number(o); }, 0);
  }
  function inNet(ip, net, bits) {
    var size = Math.pow(2, 32 - bits);
    return Math.floor(ipNum(ip) / size) === Math.floor(ipNum(net) / size);
  }

  /** Rule 3: which space an address is in. 'shared' is 100.64.0.0/10 (RFC 6598); 'private' the three ranges of
      RFC 1918; anything else 'public' (the demo uses no other special block as a destination). */
  function addressSpace(ip) {
    if (inNet(ip, '100.64.0.0', 10)) return 'shared';
    if (inNet(ip, '10.0.0.0', 8) || inNet(ip, '172.16.0.0', 12) || inNet(ip, '192.168.0.0', 16)) return 'private';
    return 'public';
  }

  /** Rule 3: the internet carries a packet only to a public address (RFC 6598 §4: shared space is not forwarded
      across provider boundaries). */
  function routable(ip) { return addressSpace(ip) === 'public'; }

  /** Rule 5: an inbound packet at a home router. The dynamic table first, then the static forwards. Returns
      { row, result: 'hit' | 'forward' | 'miss', out }. */
  function homeIn(home, i, pkt) {
    var got = translateIn(home.table, homeNat(i), pkt);
    if (got.row >= 0) return { row: got.row, result: 'hit', out: got.out };
    for (var k = 0; k < home.forwards.length; k++) {
      var f = home.forwards[k];
      if (same(f.outside, pkt.dst)) return { row: k, result: 'forward', out: { src: pkt.src, dst: ep(f.inside.ip, f.inside.port) } };
    }
    return { row: -1, result: 'miss', out: null };
  }

  function subsOf(p) { return Math.max(1, Math.min(SUBS.length, Math.round(Number(p.subscribers) || 1))); }

  /** Steps for these params (SPEC.md "Steps"). */
  function stepsFor(p) {
    if (p.direction === 'inbound') return p.portForward ? 4 : 3;
    return p.senders === 'all' ? 3 * subsOf(p) : 6;
  }

  function probePort(p) { return p.portForward ? FORWARD.outside.port : PROBE_PORT; }

  function emptyScene(p) {
    var homes = [];
    for (var i = 0; i < subsOf(p); i++) {
      homes.push({ id: SUBS[i].id, table: [], forwards: i === 0 && p.portForward ? [{ outside: ep(FORWARD.outside.ip, FORWARD.outside.port), inside: ep(FORWARD.inside.ip, FORWARD.inside.port) }] : [] });
    }
    return { phase: 'start', who: null, homes: homes, cgn: [], packet: null, lookup: null, seen: [], verdict: null };
  }

  function pkt(from, to, src, dst, was, drop) {
    return { from: from, to: to, src: ep(src.ip, src.port), dst: ep(dst.ip, dst.port), was: was || null, drop: !!drop };
  }

  /** Outbound hops of subscriber i: 0 send, 1 home router, 2 CGN. s is replaced in place (a fresh copy). */
  function outHop(s, i, hop) {
    var sub = SUBS[i], home = s.homes[i], hid = 'h' + sub.id;
    var first = { src: ep(sub.host, SRC_PORT), dst: ep(SERVER.ip, SERVER.port) };
    s.who = sub.id;
    if (hop === 0) {
      s.phase = 'send';
      s.packet = pkt(sub.id, hid, first.src, first.dst);
      return;
    }
    var r1 = translateOut(home.table, homeNat(i), first);
    if (hop === 1) {
      home.table = r1.table;
      s.phase = 'nat1';
      s.lookup = { box: hid, row: r1.row, result: r1.outcome };
      s.packet = pkt(hid, 'cgn', r1.out.src, r1.out.dst, { field: 'src', ep: first.src });
      return;
    }
    var r2 = translateOut(s.cgn, CGN_NAT, r1.out);
    s.cgn = r2.table;
    s.phase = 'nat2';
    s.lookup = { box: 'cgn', row: r2.row, result: r2.outcome };
    s.packet = pkt('cgn', 'server', r2.out.src, r2.out.dst, { field: 'src', ep: r1.out.src });
    s.seen = s.seen.concat([ep(r2.out.src.ip, r2.out.src.port)]);
  }

  /** Step n from step n - 1 (the kit replays from initial, so step back is exact). */
  function step(prev, n, p) {
    var s = JSON.parse(JSON.stringify(prev));
    s.lookup = null;
    s.packet = null;
    if (p.direction === 'inbound') {
      var dst = ep(CGN_PUBLIC, probePort(p));
      if (n === 1) {
        s.phase = 'probe';
        s.packet = pkt('client', 'net', CLIENT, dst);
      } else if (n === 2) {
        var got = translateIn(s.cgn, CGN_NAT, { src: CLIENT, dst: dst });
        s.phase = 'arrive';
        s.lookup = { box: 'cgn', row: got.row, result: got.row < 0 ? 'miss' : 'hit' };
        s.packet = pkt('net', 'cgn', CLIENT, dst, null, got.row < 0);
        s.verdict = got.row < 0 ? 'dropped' : null;
      } else if (n === 3) {
        s.phase = 'after';
      } else {
        var direct = FORWARD.outside;
        s.phase = 'direct';
        s.packet = pkt('client', 'net', CLIENT, direct, null, !routable(direct.ip));
        s.verdict = routable(direct.ip) ? null : 'unreachable';
      }
      return s;
    }
    if (p.senders === 'all') {
      outHop(s, Math.floor((n - 1) / 3), (n - 1) % 3);
      return s;
    }
    if (n <= 3) { outHop(s, 0, n - 1); return s; }
    // the reply to A's connection: server → CGN, CGN → home A, home A → A
    var sent = s.seen[0];
    var reply = { src: ep(SERVER.ip, SERVER.port), dst: ep(sent.ip, sent.port) };
    s.who = 'A';
    if (n === 4) {
      s.phase = 'reply';
      s.packet = pkt('server', 'cgn', reply.src, reply.dst);
      return s;
    }
    var back2 = translateIn(s.cgn, CGN_NAT, reply);
    if (n === 5) {
      s.phase = 'back2';
      s.lookup = { box: 'cgn', row: back2.row, result: back2.row < 0 ? 'miss' : 'hit' };
      s.packet = pkt('cgn', 'hA', back2.out.src, back2.out.dst, { field: 'dst', ep: reply.dst });
      return s;
    }
    var back1 = homeIn(s.homes[0], 0, back2.out);
    s.phase = 'back1';
    s.lookup = { box: 'hA', row: back1.row, result: back1.result };
    s.packet = pkt('hA', 'A', back1.out.src, back1.out.dst, { field: 'dst', ep: back2.out.dst });
    s.verdict = 'delivered';
    return s;
  }

  var logic = {
    /** Preset 1, outbound-works: A's connection out through both NATs and its reply home, B drawn beside it. */
    defaults: { direction: 'outbound', senders: 'one', portForward: false, subscribers: 2 },

    directions: ['outbound', 'inbound'],
    sendersOptions: ['one', 'all'],
    maxSubscribers: SUBS.length,

    steps: stepsFor,
    stepsFor: stepsFor,

    initial: function (p) { return emptyScene(p); },
    step: step,

    subs: SUBS,
    srcPort: SRC_PORT,
    homeFirst: HOME_FIRST,
    cgnFirst: CGN_FIRST,
    cgnPublic: CGN_PUBLIC,
    cgnInside: CGN_INSIDE,
    server: SERVER,
    client: CLIENT,
    forward: FORWARD,
    probePort: probePort,
    subsOf: subsOf,
    homeNat: homeNat,
    cgnNat: CGN_NAT,

    freePort: freePort,
    translateOut: translateOut,
    translateIn: translateIn,
    homeIn: homeIn,
    addressSpace: addressSpace,
    routable: routable
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
