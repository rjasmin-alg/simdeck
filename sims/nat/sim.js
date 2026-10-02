/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for nat: router R translates addresses at the edge of a private network and builds its translation table
   as outbound packets leave (URM book, ch. 11, Primjer 4; RFC 3022). Two modes, as the chapter and catalogue §5.12
   ask: PAT (NAPT), which gives every outbound connection its own free port on the one outside address, and Basic
   NAT, which translates the address alone and so needs one outside address per inside host.
   The steps: A sends, then a second host (or A again), the server's two replies come back through the table, and
   a packet from outside that nobody asked for arrives last.
   Pure: no DOM, no Math.random, no Date, no timers. Addresses are strings ("a.b.c.d"), ports numbers; state is
   plain JSON. translateOut, translateIn and freePort are pure functions over plain data, ready for models/. */
(function (root) {
  'use strict';

  /** The book's numbers (URM ch. 11, Primjer 4). 203.0.113.0/24 and 198.51.100.0/24 are documentation blocks. */
  var HOSTS = { A: '192.168.1.10', B: '192.168.1.11' };
  var SRC_PORT = 51000;
  var SERVER = { ip: '198.51.100.10', port: 443 };
  var FIRST_PORT = 61000;
  /** R's outside addresses: PAT and Basic NAT use the first; the "two addresses" mode adds the second. */
  var POOL = ['203.0.113.5', '203.0.113.6'];

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

  /** An outbound packet { src, dst } reaches R. nat = { mode: 'pat' | 'basic', pool: [outside addresses] }.
      Returns { table, row, outcome, out }: outcome 'new' (a row is added), 'reuse' (a row for this connection, or
      under Basic NAT for this inside address, already exists) or 'nofree' (Basic NAT: every outside address is bound
      to another host, so the packet is dropped and out is null). The input table is not changed. */
  function translateOut(table, nat, pkt) {
    var i, r;
    for (i = 0; i < table.length; i++) {
      r = table[i];
      var hit = nat.mode === 'pat' ? same(r.inside, pkt.src) && same(r.dest, pkt.dst) : r.inside.ip === pkt.src.ip;
      if (hit) return { table: table, row: i, outcome: 'reuse', out: { src: ep(r.outside.ip, nat.mode === 'pat' ? r.outside.port : pkt.src.port), dst: pkt.dst } };
    }
    var outside;
    if (nat.mode === 'pat') {
      outside = ep(nat.pool[0], freePort(table, nat.pool[0], FIRST_PORT));
    } else {
      var free = nat.pool.filter(function (a) { return !table.some(function (x) { return x.outside.ip === a; }); });
      if (!free.length) return { table: table, row: -1, outcome: 'nofree', out: null };
      outside = ep(free[0], pkt.src.port); // Basic NAT: the port is not translated
    }
    var row = { inside: ep(pkt.src.ip, pkt.src.port), outside: outside, dest: ep(pkt.dst.ip, pkt.dst.port) };
    return { table: table.concat([row]), row: table.length, outcome: 'new', out: { src: outside, dst: pkt.dst } };
  }

  /** An inbound packet { src, dst } reaches R's outside. PAT looks up the outside address and port; Basic NAT the
      outside address alone (its rows bind addresses, so every port of a bound address belongs to that host). Returns
      { row, out }: the row found and the packet with its destination rewritten, or row -1 and out null (dropped). */
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

  function natFor(mode) {
    return mode === 'pat' ? { mode: 'pat', pool: POOL.slice(0, 1) }
      : { mode: 'basic', pool: POOL.slice(0, mode === 'basic2' ? 2 : 1) };
  }

  /** Everything the page shows after step n. Each step is one packet through R:
      1 A sends, 2 the second host sends, 3 and 4 the server answers each (a host whose packet was dropped gets no
      answer), 5 a packet from outside arrives at the probe port. event describes step n's packet. */
  function analyze(p, n) {
    var nat = natFor(p.mode), table = [], sent = [], event = null;
    var senders = ['A', p.second];
    for (var k = 1; k <= n; k++) {
      if (k <= 2) {
        var who = senders[k - 1], pkt = { src: ep(HOSTS[who], SRC_PORT), dst: ep(SERVER.ip, SERVER.port) };
        var res = translateOut(table, nat, pkt);
        table = res.table;
        sent.push(res.out);
        event = { kind: 'out', who: who, before: pkt, after: res.out, row: res.row, outcome: res.outcome };
      } else if (k <= 4) {
        var asked = sent[k - 3];
        if (!asked) { event = { kind: 'noreply', who: senders[k - 3], before: null, after: null, row: -1, outcome: 'none' }; continue; }
        var reply = { src: asked.dst, dst: asked.src }, back = translateIn(table, nat, reply);
        event = { kind: 'reply', who: senders[k - 3], before: reply, after: back.out, row: back.row, outcome: back.row < 0 ? 'drop' : 'deliver' };
      } else {
        var probe = { src: null, dst: ep(nat.pool[0], Number(p.probe)) }, got = translateIn(table, nat, probe);
        var owner = got.row < 0 ? null : (table[got.row].inside.ip === HOSTS.A ? 'A' : 'B');
        event = { kind: 'probe', who: owner, before: probe, after: got.out, row: got.row, outcome: got.row < 0 ? 'drop' : 'deliver' };
      }
    }
    return { mode: p.mode, table: table, event: event, outside: nat.pool };
  }

  var logic = {
    /** The book's worked example: PAT on 203.0.113.5, A then B, both from port 51000; a packet from outside to
        61050 (URM ch. 11, Primjer 4, and the fragment's exercises 1 and 2). */
    defaults: { mode: 'pat', second: 'B', probe: '61050' },

    modes: ['pat', 'basic', 'basic2'],
    seconds: ['B', 'A'],
    /** Probe ports: 61050 (Primjer 4 (b), exercise 2), 61000 and 61001 (exercise 3: a port the table holds). */
    probes: ['61050', '61000', '61001'],

    steps: 5,

    initial: function (p) { return Object.assign({ phase: 'start' }, analyze(p, 0)); },

    /** Step n replays the n packets from an empty table, so a param change recomputes at the same step. */
    step: function (s, n, p) {
      return Object.assign({ phase: ['start', 'out', 'out', 'reply', 'reply', 'probe'][n] }, analyze(p, n));
    },

    hosts: HOSTS,
    srcPort: SRC_PORT,
    server: SERVER,
    firstPort: FIRST_PORT,
    pool: POOL,
    natFor: natFor,
    analyze: analyze,
    freePort: freePort,
    translateOut: translateOut,
    translateIn: translateIn
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
