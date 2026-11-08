/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for asymmetric-path: an organization with two exits to the internet, each with an edge device that keeps
   connection state in its own table. A user inside opens a connection to a server outside; the request leaves through
   exit 1 (the default route), the reply comes back through the exit the internet chooses. A device lets a packet in
   only if it matches a row in its own table, so a reply that returns through the other exit is dropped although the
   server sent it. URM book ch. 15, "Paket je otišao, ali se ništa nije vratilo: asimetričan put, NAT i vatrozid", and
   Primjer 6; RFC 3022 (state built outbound only); RFC 3704 §2.2 (symmetric routing is not the rule). Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   lookupState is from sims/stateful-firewall/sim.js @ cdb4072 (a row matches its connection both ways); insertState,
   inspect and diagnose are pure functions over plain data, ready for models/. */
(function (root) {
  'use strict';

  var USER = { ip: '192.0.2.10', port: 51000 };
  var SERVER = { ip: '198.51.100.10', port: 443 };
  var PROTO = 'tcp';
  var EXITS = ['exit1', 'exit2'];
  /** The organization's default route: the request always leaves through exit 1. */
  var OUT_PATH = 'exit1';

  function sameEp(a, b) { return a.ip === b.ip && a.port === b.port; }

  /** The row of table that pkt belongs to, as an index, or -1. A row { proto, a, b } is the connection a opened to b:
      a packet a → b (more of the same) or b → a (the reply) belongs to it. From sims/stateful-firewall/sim.js @ cdb4072. */
  function lookupState(table, pkt) {
    for (var i = 0; i < table.length; i++) {
      var e = table[i];
      if (e.proto !== pkt.proto) continue;
      if ((sameEp(e.a, pkt.src) && sameEp(e.b, pkt.dst)) || (sameEp(e.b, pkt.src) && sameEp(e.a, pkt.dst))) return i;
    }
    return -1;
  }

  /** Rule 1: an outbound packet of a new connection writes a row on the device it leaves through. Returns the new
      table and the index of the row (an existing row is reused). The input is not changed. */
  function insertState(table, pkt, origin) {
    var i = lookupState(table, pkt);
    if (i >= 0) return { table: table, row: i, added: false };
    var row = { proto: pkt.proto, a: { ip: pkt.src.ip, port: pkt.src.port }, b: { ip: pkt.dst.ip, port: pkt.dst.port },
      state: 'ESTABLISHED', origin: origin };
    return { table: table.concat([row]), row: table.length, added: true };
  }

  /** Rules 1, 2 and 7: an inbound packet at a device. A device that keeps no state checks nothing ('none', passes);
      otherwise it passes only if its own table has a matching row ('hit'), else it is dropped ('miss'). Only this
      device's table is read. */
  function inspect(table, pkt, stateful) {
    if (!stateful) return { result: 'none', row: -1, pass: true };
    var i = lookupState(table, pkt);
    return i >= 0 ? { result: 'hit', row: i, pass: true } : { result: 'miss', row: -1, pass: false };
  }

  /** Rule 5: what the captures prove. which: 'user' | 'server' | 'both'. One side alone is 'inconclusive' (the user's
      "nothing back" fits a server that never replied as well as a reply lost on the way); both together give
      'lostBetween' (sent, never received), 'complete' (received) or 'inconclusive' (no reply sent yet). */
  function diagnose(captures, which) {
    if (which !== 'both') return 'inconclusive';
    var has = function (list, ev) { return list.some(function (e) { return e.ev === ev; }); };
    if (has(captures.user, 'repRecv')) return 'complete';
    if (has(captures.server, 'repSent') && has(captures.user, 'nothing')) return 'lostBetween';
    return 'inconclusive';
  }

  /** Rules 4 and 6: the exit the reply comes back through. The internet chooses (returnPath) unless the organization
      makes the path symmetric. */
  function inPathOf(p) { return p.fix === 'symmetric' ? OUT_PATH : p.returnPath; }

  var REQUEST = { kind: 'request', proto: PROTO, src: USER, dst: SERVER };
  var REPLY = { kind: 'reply', proto: PROTO, src: SERVER, dst: USER };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  var PHASES = ['start', 'out1', 'out2', 'arrive', 'reply', 'in', 'deliver', 'silence'];

  var logic = {
    /** The book's figure: the request out through exit 1, the reply back through exit 2, state kept on the exits. */
    defaults: { returnPath: 'exit2', stateful: true, fix: 'none', captures: false },

    exits: EXITS,
    fixes: ['none', 'symmetric', 'shared'],

    steps: 6,

    initial: function (p) {
      return {
        phase: 'start', outPath: OUT_PATH, inPath: inPathOf(p),
        tables: { exit1: [], exit2: [] },
        packet: null, lookup: null, inserted: null,
        captures: { user: [], server: [] },
        reply: { sent: false, seenBy: null, matched: null, delivered: false },
        verdict: null
      };
    },

    /** State after step n from the state after step n - 1. Order: the packet moves, the device looks up or inserts,
        delivered or dropped. */
    step: function (prev, n, p) {
      var s = clone(prev);
      s.inPath = inPathOf(p);
      s.lookup = null;
      s.inserted = null;
      switch (n) {
        case 1:
          s.phase = 'out1';
          s.packet = { kind: 'request', from: 'user', to: OUT_PATH };
          s.captures.user.push({ ev: 'reqSent', n: n });
          break;
        case 2:
          s.phase = 'out2';
          s.packet = { kind: 'request', from: OUT_PATH, to: 'internet' };
          if (p.stateful) {
            var ins = insertState(s.tables[OUT_PATH], REQUEST, OUT_PATH);
            s.tables[OUT_PATH] = ins.table;
            s.lookup = { device: OUT_PATH, row: ins.added ? -1 : ins.row, result: ins.added ? 'miss' : 'hit' };
            s.inserted = [{ device: OUT_PATH, row: ins.row }];
            if (p.fix === 'shared') {
              EXITS.forEach(function (x) {
                if (x === OUT_PATH) return;
                var other = insertState(s.tables[x], REQUEST, OUT_PATH);
                s.tables[x] = other.table;
                s.inserted.push({ device: x, row: other.row });
              });
            }
          }
          break;
        case 3:
          s.phase = 'arrive';
          s.packet = { kind: 'request', from: 'internet', to: 'server' };
          s.captures.server.push({ ev: 'reqRecv', n: n });
          break;
        case 4:
          s.phase = 'reply';
          s.packet = { kind: 'reply', from: 'server', to: 'internet' };
          s.captures.server.push({ ev: 'repSent', n: n });
          s.reply.sent = true;
          break;
        case 5: {
          s.phase = 'in';
          var dev = s.inPath;
          var res = inspect(s.tables[dev], REPLY, p.stateful);
          s.lookup = { device: dev, row: res.row, result: res.result };
          s.packet = { kind: 'reply', from: 'internet', to: dev, drop: !res.pass };
          s.reply.seenBy = dev;
          s.reply.matched = res.result === 'none' ? null : res.pass;
          if (!res.pass) s.verdict = 'dropped';
          break;
        }
        default:
          if (s.verdict === 'dropped') {
            s.phase = 'silence';
            s.packet = null;
            s.captures.user.push({ ev: 'nothing', n: n });
          } else {
            s.phase = 'deliver';
            s.packet = { kind: 'reply', from: s.inPath, to: 'user' };
            s.captures.user.push({ ev: 'repRecv', n: n });
            s.reply.delivered = true;
            s.verdict = 'delivered';
          }
      }
      return s;
    },

    phases: PHASES,
    user: USER,
    server: SERVER,
    proto: PROTO,
    outPath: OUT_PATH,
    request: REQUEST,
    reply: REPLY,
    lookupState: lookupState,
    insertState: insertState,
    inspect: inspect,
    diagnose: diagnose,
    inPathOf: inPathOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
