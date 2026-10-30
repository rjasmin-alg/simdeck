/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for dmz-matrix: one routing firewall with three interfaces (internet, DMZ, protected LAN) and a 3×3 "from →
   to" matrix whose off-diagonal cells list the services each zone may open to each other zone. A row of test
   connections is judged against the matrix: the request by its cell (a set: order does not matter), the reply by the
   state table (stateful) or by a reply entry of its own in the reverse cell (stateless). Anything not listed is
   dropped (deny by default). A test inside one zone never crosses the firewall.
   URM book ch. 18, "Vatrozid: filtriranje, segmentacija i ono što nije sigurnosna mjera" (NIST SP 800-41 r1 §2.1,
   §3.1-3.2, §4), Primjer 5, figure fig:dmz-vatrozid. Rules and numbers: SPEC.md.
   The stateful/stateless reply rule is the one of sims/stateful-firewall/sim.js (judge, lookupState) at the zone
   level: not copied, because a cell is a set, not a first-match list. zoneOf, lookup and judgeTest are pure functions
   over plain data, ready for models/.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var ZONES = ['inet', 'dmz', 'lan'];
  /** The six off-diagonal cells, row by row ('from>to'), and the param that holds each one. */
  var CELLS = ['inet>dmz', 'inet>lan', 'dmz>inet', 'dmz>lan', 'lan>inet', 'lan>dmz'];
  var PARAM = { 'inet>dmz': 'inetDmz', 'inet>lan': 'inetLan', 'dmz>inet': 'dmzInet', 'dmz>lan': 'dmzLan', 'lan>inet': 'lanInet', 'lan>dmz': 'lanDmz' };
  /** The services a cell can list, in chip order. 'any' covers every service. Bit i of a cell's number is
      SERVICES[i]; bit REPLY + i is the stateless reply entry for SERVICES[i] (source port = that service). */
  var SERVICES = ['tcp/443', 'tcp/80', 'tcp/25', 'udp/53', 'tcp/22', 'tcp/3389', 'tcp/445', 'tcp/5432', 'udp/161', 'any'];
  var REPLY = 10;
  var ANY = 'any';
  /** Every bit a cell may hold: ten services and nine reply entries (no reply entry for 'any'). */
  var MAX_CELL = Math.pow(2, REPLY + SERVICES.length - 1) - 1;

  /** Who is where. Documentation blocks outside and in the DMZ, private addresses in the LAN; there is no NAT row
      (ch. 18: NAT is not part of the firewall's security function). */
  var HOSTS = {
    visitor: { ip: '198.51.100.7', zone: 'inet' },
    extWeb: { ip: '198.51.100.10', zone: 'inet' },
    web: { ip: '203.0.113.10', zone: 'dmz' },
    mail: { ip: '203.0.113.25', zone: 'dmz' },
    client: { ip: '192.168.1.10', zone: 'lan' },
    files: { ip: '192.168.1.20', zone: 'lan' },
    db: { ip: '192.168.1.30', zone: 'lan' }
  };
  /** The book's figure: interface 1 internet, 2 DMZ, 3 protected network. */
  var IFACES = { inet: 1, dmz: 2, lan: 3 };

  /** The test connections: from a host, to a host, one service. */
  var TESTS = [
    { id: 't1', src: 'visitor', dst: 'web', service: 'tcp/443' },
    { id: 't2', src: 'visitor', dst: 'files', service: 'tcp/445' },
    { id: 't3', src: 'visitor', dst: 'client', service: 'tcp/3389' },
    { id: 't4', src: 'visitor', dst: 'files', service: 'tcp/3389' },
    { id: 't5', src: 'visitor', dst: 'web', service: 'udp/161' },
    { id: 't6', src: 'client', dst: 'extWeb', service: 'tcp/443' },
    { id: 't7', src: 'client', dst: 'web', service: 'tcp/22' },
    { id: 't8', src: 'web', dst: 'db', service: 'tcp/5432' },
    { id: 't9', src: 'client', dst: 'files', service: 'tcp/445' }
  ];
  /** With `compromised` on, the tests start from the DMZ web server instead (rule 5). */
  var ATTACKER = 'web';
  var ATTACKS = [
    { id: 'a1', src: 'web', dst: 'files', service: 'tcp/445' },
    { id: 'a2', src: 'web', dst: 'client', service: 'tcp/3389' },
    { id: 'a3', src: 'web', dst: 'db', service: 'tcp/5432' },
    { id: 'a4', src: 'web', dst: 'client', service: 'tcp/22' },
    { id: 'a5', src: 'web', dst: 'mail', service: 'tcp/25' },
    { id: 'a6', src: 'web', dst: 'extWeb', service: 'tcp/443' }
  ];

  function bit(service) { return 1 << SERVICES.indexOf(service); }
  function replyBit(service) { return service === ANY ? 0 : 1 << (REPLY + SERVICES.indexOf(service)); }
  /** A cell's number from lists of services and reply entries. */
  function mask(services, replies) {
    var m = 0;
    (services || []).forEach(function (s) { m |= bit(s); });
    (replies || []).forEach(function (s) { m |= replyBit(s); });
    return m;
  }
  /** The services and reply entries a cell's number lists, in chip order. Bits past MAX_CELL are ignored. */
  function unmask(m) {
    var v = Number(m) & MAX_CELL, services = [], replies = [];
    SERVICES.forEach(function (s, i) {
      if (v & (1 << i)) services.push(s);
      if (s !== ANY && v & (1 << (REPLY + i))) replies.push(s);
    });
    return { services: services, replies: replies };
  }
  /** Toggle one service (or, with reply true, one reply entry) in a cell's number. */
  function toggle(m, service, reply) { return (Number(m) & MAX_CELL) ^ (reply ? replyBit(service) : bit(service)); }

  function zoneOf(host) { return HOSTS[host].zone; }

  /** Rule 2: is `service` allowed from zone `from` to zone `to`? Looks up the one cell and nothing else; a cell is a
      set, so order inside it does not matter. 'any' in the cell covers every service. Rule 3: not listed → false. */
  function lookup(cells, from, to, service) {
    var cell = cells[from + '>' + to] || [];
    return cell.indexOf(ANY) >= 0 || cell.indexOf(service) >= 0;
  }
  /** Rule 4, stateless: does the reverse cell (to → from) carry a reply entry for `service`, or 'any'? */
  function replyEntry(cells, replies, from, to, service) {
    var back = to + '>' + from;
    return (cells[back] || []).indexOf(ANY) >= 0 || (replies[back] || []).indexOf(service) >= 0;
  }

  /** One test judged: { result 'pass' | 'drop', reason, reply: null | { result, reason }, ok }.
      reason: 'same-zone' (tie-break: never crosses the firewall), 'cell-allow', 'default-deny'; the reply's:
      'same-zone', 'reply-of-tracked' (stateful), 'cell-allow' (stateless, its own entry), 'no-rule-for-reply'.
      A dropped request has no reply. */
  function judgeTest(m, test) {
    var from = zoneOf(test.src), to = zoneOf(test.dst);
    if (from === to) {
      return { result: 'pass', reason: 'same-zone', reply: { result: 'pass', reason: 'same-zone' }, ok: true };
    }
    if (!lookup(m.cells, from, to, test.service)) return { result: 'drop', reason: 'default-deny', reply: null, ok: false };
    var reply;
    if (m.stateful) reply = { result: 'pass', reason: 'reply-of-tracked' };
    else if (replyEntry(m.cells, m.replies, from, to, test.service)) reply = { result: 'pass', reason: 'cell-allow' };
    else reply = { result: 'drop', reason: 'no-rule-for-reply' };
    return { result: 'pass', reason: 'cell-allow', reply: reply, ok: reply.result === 'pass' };
  }

  /** The cells and reply entries of params p, as lists. */
  function cellsOf(p) {
    var cells = {}, replies = {};
    CELLS.forEach(function (c) {
      var u = unmask(p[PARAM[c]]);
      cells[c] = u.services;
      replies[c] = u.replies;
    });
    return { cells: cells, replies: replies };
  }

  /** Everything the page shows: the matrix, the mode, and every test with its from/to zone and verdict. */
  function evaluate(p) {
    var cr = cellsOf(p);
    var m = { cells: cr.cells, replies: cr.replies, stateful: !!p.stateful, compromised: p.compromised ? 'dmz-web' : null };
    var list = p.compromised ? ATTACKS : TESTS;
    m.tests = list.map(function (x) {
      var j = judgeTest(m, x);
      return { id: x.id, src: x.src, dst: x.dst, from: zoneOf(x.src), to: zoneOf(x.dst), host: x.dst, service: x.service,
        result: j.result, reason: j.reason, reply: j.reply, ok: j.ok };
    });
    return m;
  }

  /** Ids of the tests whose request or reply verdict differs between two states (same test list), for the kit's
      "changed" mark. A different test list (compromised switched) marks nothing. */
  function changed(a, b) {
    if (!a || !b || a.compromised !== b.compromised) return [];
    var before = {};
    a.tests.forEach(function (x) { before[x.id] = x; });
    return b.tests.filter(function (x) {
      var y = before[x.id];
      return y && (y.result !== x.result || y.reason !== x.reason || JSON.stringify(y.reply) !== JSON.stringify(x.reply));
    }).map(function (x) { return x.id; });
  }

  /** Counts for the caption: tests that work both ways, requests dropped by default, replies with no rule, same zone. */
  function tally(s) {
    var out = { total: s.tests.length, ok: 0, denied: 0, noReply: 0, sameZone: 0 };
    s.tests.forEach(function (x) {
      if (x.ok) out.ok++;
      if (x.reason === 'default-deny') out.denied++;
      if (x.reply && x.reply.reason === 'no-rule-for-reply') out.noReply++;
      if (x.reason === 'same-zone') out.sameZone++;
    });
    return out;
  }

  function cellParams(spec) {
    var out = {};
    CELLS.forEach(function (c) { var x = spec[c] || {}; out[PARAM[c]] = mask(x.s, x.r); });
    return out;
  }

  /** The book's matrix (URM ch. 18, the DMZ paragraph and Primjer 5; the service choice is simdeck's): the internet
      may open web and mail in the DMZ, the LAN may open web and DNS outside and administer the DMZ over tcp/22, the
      DMZ may open nothing in the LAN. Stateful. */
  var BOOK = {
    'inet>dmz': { s: ['tcp/443', 'tcp/25'] },
    'lan>inet': { s: ['tcp/443', 'udp/53'] },
    'lan>dmz': { s: ['tcp/22'] }
  };
  var defaults = Object.assign({ stateful: true, compromised: false }, cellParams(BOOK));

  function withCells(extra) {
    var spec = {};
    CELLS.forEach(function (c) {
      var a = BOOK[c] || {}, b = extra[c] || {};
      spec[c] = { s: (a.s || []).concat(b.s || []), r: (a.r || []).concat(b.r || []) };
    });
    return cellParams(spec);
  }

  /** The presets (SPEC.md). Students' scenarios are not presets: these are the book's example and mistakes. */
  var presets = [
    { id: 'book', params: {} },
    { id: 'stateless', params: { stateful: false } },
    { id: 'web-compromised', params: { compromised: true } },
    // a "temporary" any rule internet → LAN and SNMP from anywhere (DR estate CV-58, CV-44)
    { id: 'any-any', params: withCells({ 'inet>lan': { s: ['any', 'udp/161'] }, 'inet>dmz': { s: ['udp/161'] }, 'dmz>lan': { s: ['udp/161'] } }) },
    // internet → LAN tcp/3389 meant for one PC (DR estate CV-59)
    { id: 'rdp-forward', params: withCells({ 'inet>lan': { s: ['tcp/3389'] } }) }
  ];

  var logic = {
    defaults: defaults,
    steps: 0,
    initial: function (p) { return evaluate(p); },

    zones: ZONES,
    cells: CELLS,
    param: PARAM,
    services: SERVICES,
    any: ANY,
    maxCell: MAX_CELL,
    hosts: HOSTS,
    ifaces: IFACES,
    tests: TESTS,
    attacks: ATTACKS,
    attacker: ATTACKER,
    presets: presets,
    mask: mask,
    unmask: unmask,
    toggle: toggle,
    zoneOf: zoneOf,
    lookup: lookup,
    replyEntry: replyEntry,
    judgeTest: judgeTest,
    cellsOf: cellsOf,
    evaluate: evaluate,
    changed: changed,
    tally: tally
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
