/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for stateful-firewall: a routing firewall with three interfaces (internet, DMZ, protected network) judges
   five packets, one per step, either statelessly (every packet alone, against the rule list) or statefully (first
   the state table of connections it has let out, then the rule list). URM book, ch. 18, Primjer 5 (a client inside
   opens a connection to a server on port 443; does the reply get back?) and the section on the DMZ (a third
   interface of the same device, not a way around it). NIST SP 800-41 r1 §2.1.1-2.1.2, §3.1-3.2, §4.
   The rule list is first match, deny by default (catalogue §5.1). The state lookup comes before the rules.
   Pure: no DOM, no Math.random, no Date, no timers. Addresses are strings, ports numbers; state is plain JSON.
   matchRule, firstMatch, lookupState and judge are pure functions over plain data, ready for models/. */
(function (root) {
  'use strict';

  /** Who is where. Documentation blocks (198.51.100.0/24, 203.0.113.0/24) outside, private addresses inside. NAT
      is left out on purpose (ch. 18: NAT is not part of the firewall's security function). */
  var HOSTS = {
    client: { ip: '192.168.1.10', zone: 'protected' },
    web: { ip: '198.51.100.10', zone: 'internet' },
    dns: { ip: '198.51.100.53', zone: 'internet' },
    stranger: { ip: '203.0.113.66', zone: 'internet' },
    dmzWeb: { ip: '192.168.2.10', zone: 'dmz' }
  };
  /** The book's diagram (ch18-dmz-vatrozid.svg): interface 1 internet, 2 DMZ, 3 protected network. */
  var IFACES = { internet: 1, dmz: 2, protected: 3 };
  var CLIENT_PORT = 51000;
  /** The service the client asks: Primjer 5 is TCP to 443; end-of-chapter question 13 is a DNS query over UDP. */
  var SERVICE = { tcp: { host: 'web', port: 443 }, udp: { host: 'dns', port: 53 } };
  var DMZ_PORT = 443;
  var INNER_PORT = 22;

  /** The rule list, in order, for protocol `proto` of the client's service. `returnRule` adds the stateless
      firewall's separate rule for the return direction (Primjer 5's "zasebno pravilo"): inbound from source port
      443 (or 53) to the protected network. Missing fields match anything. */
  function rules(proto, returnRule) {
    var list = [
      { id: 1, action: 'allow', proto: 'tcp', from: 'protected', to: 'internet', dport: 443 },
      { id: 2, action: 'allow', proto: 'udp', from: 'protected', to: 'internet', dport: 53 },
      { id: 3, action: 'allow', proto: 'tcp', from: 'internet', to: 'dmz', dst: HOSTS.dmzWeb.ip, dport: DMZ_PORT }
    ];
    if (returnRule) list.push({ id: 4, action: 'allow', proto: proto, from: 'internet', to: 'protected', sport: SERVICE[proto].port });
    return list;
  }

  /** Does rule r cover packet pkt ({ proto, src: { ip, port, zone }, dst: { ip, port, zone } })? */
  function matchRule(r, pkt) {
    if (r.proto && r.proto !== pkt.proto) return false;
    if (r.from && r.from !== pkt.src.zone) return false;
    if (r.to && r.to !== pkt.dst.zone) return false;
    if (r.dst && r.dst !== pkt.dst.ip) return false;
    if (r.dport != null && r.dport !== pkt.dst.port) return false;
    if (r.sport != null && r.sport !== pkt.src.port) return false;
    return true;
  }

  /** First match over the list: { index, trace } where trace[i] is 'miss', 'hit' or 'unchecked' (after the hit).
      index -1 means no rule matched, and the default (deny) applies. */
  function firstMatch(list, pkt) {
    var index = -1;
    var trace = list.map(function (r, i) {
      if (index >= 0) return 'unchecked';
      if (matchRule(r, pkt)) { index = i; return 'hit'; }
      return 'miss';
    });
    return { index: index, trace: trace };
  }

  function sameEp(a, b) { return a.ip === b.ip && a.port === b.port; }

  /** The state-table entry pkt belongs to, as an index, or -1. An entry { proto, a, b } is the connection a opened
      to b: a packet a → b (more of the same) or b → a (the reply) belongs to it. */
  function lookupState(table, pkt) {
    for (var i = 0; i < table.length; i++) {
      var e = table[i];
      if (e.proto !== pkt.proto) continue;
      if ((sameEp(e.a, pkt.src) && sameEp(e.b, pkt.dst)) || (sameEp(e.b, pkt.src) && sameEp(e.a, pkt.dst))) return i;
    }
    return -1;
  }

  /** The firewall's decision on pkt. kind 'stateless' | 'stateful'. Returns { verdict 'allow' | 'deny', by 'state' |
      'rule' | 'default', stateRow, rule (index or -1), trace, table }. A stateful firewall checks its state table
      first; a packet found there passes and the rules are not read (trace all 'unchecked'). Otherwise the rules
      decide, and a stateful firewall writes an entry for each new connection a rule lets through. The input table
      is not changed. */
  function judge(kind, list, table, pkt) {
    var row = kind === 'stateful' ? lookupState(table, pkt) : -1;
    if (row >= 0) {
      return { verdict: 'allow', by: 'state', stateRow: row, rule: -1, trace: list.map(function () { return 'unchecked'; }), table: table, added: -1 };
    }
    var m = firstMatch(list, pkt);
    var allow = m.index >= 0 && list[m.index].action === 'allow';
    var next = table, added = -1;
    if (kind === 'stateful' && allow) {
      next = table.concat([{ proto: pkt.proto, a: { ip: pkt.src.ip, port: pkt.src.port }, b: { ip: pkt.dst.ip, port: pkt.dst.port } }]);
      added = table.length;
    }
    return { verdict: allow ? 'allow' : 'deny', by: m.index >= 0 ? 'rule' : 'default', stateRow: -1, rule: m.index, trace: m.trace, table: next, added: added };
  }

  function ep(host, port) { return { ip: HOSTS[host].ip, port: port, zone: HOSTS[host].zone, host: host }; }

  /** The packet of step n (1..5). */
  function packetAt(p, n) {
    var svc = SERVICE[p.proto];
    switch (n) {
      case 1: return { kind: 'request', proto: p.proto, src: ep('client', CLIENT_PORT), dst: ep(svc.host, svc.port) };
      case 2: return { kind: 'reply', proto: p.proto, src: ep(svc.host, svc.port), dst: ep('client', CLIENT_PORT) };
      case 3: return { kind: 'unsolicited', proto: p.proto, src: ep('stranger', svc.port), dst: ep('client', CLIENT_PORT) };
      case 4: return { kind: 'toDmz', proto: 'tcp', src: ep('stranger', 52000), dst: ep('dmzWeb', DMZ_PORT) };
      default: return { kind: 'dmzToInside', proto: 'tcp', src: ep('dmzWeb', 52100), dst: ep('client', INNER_PORT) };
    }
  }

  /** Everything the page shows after step n: the rule list, the state table, and step n's packet and decision. */
  function analyze(p, n) {
    var list = rules(p.proto, p.returnRule), table = [], event = null;
    for (var k = 1; k <= n; k++) {
      var pkt = packetAt(p, k), res = judge(p.kind, list, table, pkt);
      table = res.table;
      event = { packet: pkt, verdict: res.verdict, by: res.by, stateRow: res.stateRow, rule: res.rule, trace: res.trace, added: res.added };
    }
    return { kind: p.kind, proto: p.proto, rules: list, table: table, event: event };
  }

  var logic = {
    /** The book's worked example: a stateless firewall without a return rule, TCP to port 443 (URM ch. 18,
        Primjer 5, and the fragment's "Primjer iz knjige" button). */
    defaults: { kind: 'stateless', returnRule: false, proto: 'tcp' },

    kinds: ['stateless', 'stateful'],
    protos: ['tcp', 'udp'],

    steps: 5,

    initial: function (p) { return Object.assign({ phase: 'start' }, analyze(p, 0)); },

    /** Step n replays the n packets from an empty state table, so a param change recomputes at the same step. */
    step: function (s, n, p) {
      return Object.assign({ phase: ['start', 'request', 'reply', 'unsolicited', 'toDmz', 'dmzToInside'][n] }, analyze(p, n));
    },

    hosts: HOSTS,
    ifaces: IFACES,
    clientPort: CLIENT_PORT,
    service: SERVICE,
    rules: rules,
    matchRule: matchRule,
    firstMatch: firstMatch,
    lookupState: lookupState,
    judge: judge,
    packetAt: packetAt,
    analyze: analyze
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
