/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for static-default-route: a ping from A over the chain A — R1 — R2 — R3 — ISP (B behind R2), with routes the
   student turns on: two static routes, three default routes and the wrong default route on R3. One step: one node
   handles one packet (a host or a router sends it, a router forwards or drops it, the ISP takes it off the scene).
   Lookup by the longest prefix (routing-table's), TTL − 1 per router, ICMP 3/0 for no route and 11/0 for TTL 0 to
   the packet's source, never an error about an error. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // from sims/routing-table/sim.js @ 7bd975d (parse, format, mask, match, lookup); not in models/ yet (NOTES.md)
  /** "10.1.2.55" → unsigned 32-bit number, or null if it is not a dotted-quad IPv4 address. */
  function parse(str) {
    var parts = String(str).split('.');
    if (parts.length !== 4) return null;
    var v = 0;
    for (var i = 0; i < 4; i++) {
      if (!/^\d{1,3}$/.test(parts[i])) return null;
      var n = Number(parts[i]);
      if (n > 255) return null;
      v = v * 256 + n;
    }
    return v;
  }

  /** Unsigned 32-bit number → "a.b.c.d". */
  function format(v) {
    return [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
  }

  /** The mask of a prefix length: p ones from the left, then zeros. p = 0 is 0.0.0.0, p = 32 is 255.255.255.255. */
  function mask(p) {
    return p <= 0 ? 0 : (0xffffffff << (32 - p)) >>> 0; // a shift by 32 would be a shift by 0, hence the p = 0 case
  }

  /** An entry matches when the first `prefix` bits of the destination equal those of the entry's network.
      Prefix 0 compares no bit, so the default route matches every address. */
  function match(dest, net, prefix) {
    var m = mask(prefix);
    return ((dest & m) >>> 0) === ((net & m) >>> 0);
  }

  /** Longest-prefix lookup over a table of { net, prefix } (net a number). Returns the indices of the matching
      entries in table order, the winner (the longest matching prefix; on equal length the earlier entry, which only
      a duplicated entry can cause) and the first match in table order. winner = -1 when nothing matches. */
  function lookup(table, dest) {
    var matches = [], winner = -1;
    for (var i = 0; i < table.length; i++) {
      if (!match(dest, table[i].net, table[i].prefix)) continue;
      matches.push(i);
      if (winner < 0 || table[i].prefix > table[winner].prefix) winner = i; // strictly longer: ties keep the earlier
    }
    return { matches: matches, winner: winner, firstMatch: matches.length ? matches[0] : -1 };
  }
  // end of the copy from sims/routing-table

  // ── the scene (SPEC.md "Scene") ──

  var A_IP = '192.168.1.10', B_IP = '192.168.2.20', ISP_IP = '203.0.113.2';
  var HOSTS = {
    A: { ip: A_IP, prefix: 24, gw: '192.168.1.1' },
    B: { ip: B_IP, prefix: 24, gw: '192.168.2.1' }
  };
  /** Each router's interfaces, in the order its connected rows are listed. */
  var ROUTERS = {
    R1: [{ name: 'Gi0/0', ip: '192.168.1.1', prefix: 24 }, { name: 'Gi0/1', ip: '192.168.100.1', prefix: 30 }],
    R2: [{ name: 'Gi0/0', ip: '192.168.2.1', prefix: 24 }, { name: 'Gi0/1', ip: '192.168.100.2', prefix: 30 },
      { name: 'Gi0/2', ip: '192.168.100.5', prefix: 30 }],
    R3: [{ name: 'Gi0/0', ip: '203.0.113.1', prefix: 30 }, { name: 'Gi0/1', ip: '192.168.100.6', prefix: 30 }]
  };
  var ROUTER_IDS = ['R1', 'R2', 'R3'];

  /** The routes the student can add, in table order (SPEC.md "Routes the student can add"). */
  var OPTIONS = [
    { key: 'r1Static', router: 'R1', net: '192.168.2.0', prefix: 24, via: '192.168.100.2' },
    { key: 'r1Default', router: 'R1', net: '0.0.0.0', prefix: 0, via: '192.168.100.2' },
    { key: 'r2Static', router: 'R2', net: '192.168.1.0', prefix: 24, via: '192.168.100.1' },
    { key: 'r2Default', router: 'R2', net: '0.0.0.0', prefix: 0, via: '192.168.100.6' },
    { key: 'r3Default', router: 'R3', net: '0.0.0.0', prefix: 0, via: ISP_IP },
    { key: 'r3Back', router: 'R3', net: '0.0.0.0', prefix: 0, via: '192.168.100.5' }
  ];
  var KEYS = OPTIONS.map(function (o) { return o.key; });

  var DSTS = { B: B_IP, '8.8.8.8': '8.8.8.8', '198.51.100.7': '198.51.100.7' };
  var TTL_MIN = 4, TTL_MAX = 64;

  /** Which node owns an address (a host, a router interface, the ISP), or null. */
  function ownerOf(ip) {
    for (var h in HOSTS) if (HOSTS[h].ip === ip) return h;
    for (var r in ROUTERS) if (ROUTERS[r].some(function (f) { return f.ip === ip; })) return r;
    return ip === ISP_IP ? 'ISP' : null;
  }

  /** Private address (RFC 1918): the ISP has no way back to it. */
  function isPrivate(ip) {
    var v = parse(ip);
    return match(v, parse('10.0.0.0'), 8) || match(v, parse('172.16.0.0'), 12) || match(v, parse('192.168.0.0'), 16);
  }

  function netOf(ip, prefix) { return format((parse(ip) & mask(prefix)) >>> 0); }

  // ── tables (rules 1, 2, 9) ──

  /** Adds row to table unless an entry for the same network and prefix is there (rule 9). Returns the verdict. */
  function addRoute(table, row) {
    for (var i = 0; i < table.length; i++) {
      if (table[i].net === row.net && table[i].prefix === row.prefix) return { ok: false, reason: 'duplicate', clash: table[i].key || null };
    }
    table.push(row);
    return { ok: true };
  }

  /** The interface of router r whose connected network holds ip, or null. */
  function ifaceFor(r, ip) {
    var v = parse(ip);
    for (var i = 0; i < ROUTERS[r].length; i++) {
      var f = ROUTERS[r][i];
      if (match(v, parse(f.ip), f.prefix)) return f;
    }
    return null;
  }

  /** The three tables for these params: connected rows first (rule 1), then the routes switched on, in OPTIONS order;
      a duplicate prefix is refused (rule 9). Rows: { kind: 'C' | 'S' | 'S*', net, prefix, via, iface, key }. */
  function tablesOf(p) {
    var tables = {}, refused = [];
    ROUTER_IDS.forEach(function (r) {
      tables[r] = ROUTERS[r].map(function (f) { return { kind: 'C', net: netOf(f.ip, f.prefix), prefix: f.prefix, via: null, iface: f.name, key: null }; });
    });
    OPTIONS.forEach(function (o) {
      if (!p[o.key]) return;
      var row = { kind: o.prefix === 0 ? 'S*' : 'S', net: o.net, prefix: o.prefix, via: o.via, iface: ifaceFor(o.router, o.via).name, key: o.key };
      var v = addRoute(tables[o.router], row);
      if (!v.ok) refused.push({ key: o.key, router: o.router, reason: v.reason, clash: v.clash });
    });
    return { tables: tables, refused: refused };
  }

  /** Rules 3, 4: the longest-prefix lookup of dst in a table of rows (addresses as strings). */
  function routeLookup(table, dst) {
    return lookup(table.map(function (r) { return { net: parse(r.net), prefix: r.prefix }; }), parse(dst));
  }

  /** Why a param cannot be switched on: another entry with its prefix is already on that router (rule 9), or false. */
  function blockedBy(p, key) {
    var o = OPTIONS[KEYS.indexOf(key)];
    if (!o || p[key]) return false;
    for (var i = 0; i < OPTIONS.length; i++) {
      var x = OPTIONS[i];
      if (x.key !== key && p[x.key] && x.router === o.router && x.net === o.net && x.prefix === o.prefix) return x.key;
    }
    return false;
  }

  // ── params ──

  function norm(p) {
    var out = {};
    KEYS.forEach(function (k) { out[k] = p[k] === true || p[k] === 'true' || p[k] === 1; });
    out.dst = Object.prototype.hasOwnProperty.call(DSTS, p.dst) ? p.dst : 'B';
    var t = Math.round(Number(p.ttl));
    out.ttl = Math.max(TTL_MIN, Math.min(TTL_MAX, isFinite(t) ? t : TTL_MAX));
    return out;
  }

  // ── the run (SPEC.md "Step") ──

  /** Where a host sends a packet: the destination itself on its own /24, else its gateway. */
  function hostHop(h, dst) {
    var me = HOSTS[h], own = match(parse(dst), parse(me.ip), me.prefix);
    return { own: own, net: netOf(me.ip, me.prefix) + '/' + me.prefix, gw: me.gw, next: ownerOf(own ? dst : me.gw) };
  }

  /** What a router does with a packet (RFC 1812 §5.2.1, the forwarding walk-through (check)): the route lookup first (rule 5: none → 'no-route'),
      then the TTL (rule 6: TTL − 1 = 0 → 'ttl-expired'), else 'forward' with the TTL after the decrement. */
  function decide(table, pkt) {
    var res = routeLookup(table, pkt.dst);
    var action = res.winner < 0 ? 'no-route' : pkt.ttl - 1 <= 0 ? 'ttl-expired' : 'forward';
    return { action: action, matches: res.matches, winner: res.winner, ttl: action === 'forward' ? pkt.ttl - 1 : pkt.ttl };
  }

  var ERR = { 'no-route': { type: 3, code: 0 }, 'ttl-expired': { type: 11, code: 0 } };

  /** The whole run as a list of events, one per step. */
  function plan(params) {
    var p = norm(params), tt = tablesOf(p), tables = tt.tables, ev = [], id = 0;

    /** A new packet's first step: its sender puts it on the first link (rule 7: a reply is a packet of its own). */
    function send(node, pkt, hop, route) {
      pkt.id = ++id;
      var e = { ev: 'send', node: node, pkt: Object.assign({}, pkt), to: hop.next, host: route ? null : hop, route: route || null };
      ev.push(e);
      travel(pkt, node, hop.next, e);
    }

    /** The packet arrives at node `at`, sent by `from` in event e: deliver it, or let the node handle it. */
    function travel(pkt, from, at, e) {
      var seen = {};
      for (;;) {
        if (HOSTS[at]) {                                    // a host accepts a packet for itself (in the same step)
          e.arrive = at;
          e.outcome = 'delivered';
          if (pkt.kind === 'echo' && at === 'B') {          // B answers: a new packet, next step
            send('B', { kind: 'reply', src: B_IP, dst: pkt.src, ttl: p.ttl }, hostHop('B', pkt.src));
          }
          return;
        }
        if (at === 'ISP') {                                 // the edge of the scene
          ev.push({ ev: 'out', node: 'ISP', from: from, pkt: Object.assign({}, pkt), outcome: 'left', lost: isPrivate(pkt.dst) });
          return;
        }
        var table = tables[at], d = decide(table, pkt);
        var visit = (seen[at] = (seen[at] || 0) + 1);
        var look = { node: at, dst: pkt.dst, matches: d.matches, winner: d.winner };
        if (d.action !== 'forward') return drop(at, from, pkt, d.action, look, visit);
        var ttlIn = pkt.ttl;
        pkt.ttl = d.ttl;
        var row = table[d.winner], next = ownerOf(row.via || pkt.dst);
        if (!next) throw new Error('nobody has ' + (row.via || pkt.dst));
        e = { ev: 'forward', node: at, from: from, to: next, pkt: Object.assign({}, pkt), ttlIn: ttlIn, lookup: look, visit: visit };
        ev.push(e);
        from = at;
        at = next;
      }
    }

    /** Rules 5, 6, 8: drop at router r; an ICMP error goes to the source in the next step, unless the dropped packet
        is an error itself or r has no route to the source. */
    function drop(r, from, pkt, why, look, visit) {
      var d = { ev: 'drop', node: r, from: from, pkt: Object.assign({}, pkt), ttlIn: pkt.ttl, why: why, lookup: look, visit: visit,
        outcome: why, error: null, noError: null };
      if (why === 'ttl-expired') d.pkt.ttl = 0;
      ev.push(d);
      if (pkt.kind === 'icmp') { d.noError = 'about-icmp'; return; }
      var back = routeLookup(tables[r], pkt.src);
      if (back.winner < 0) { d.noError = 'no-route-to-source'; return; }
      var row = tables[r][back.winner];
      var out = ROUTERS[r].filter(function (f) { return f.name === row.iface; })[0];
      d.error = { type: ERR[why].type, code: ERR[why].code, src: out.ip, dst: pkt.src };
      send(r, { kind: 'icmp', type: d.error.type, code: d.error.code, src: out.ip, dst: pkt.src, ttl: p.ttl, about: pkt.kind },
        { next: ownerOf(row.via || pkt.src) }, { node: r, dst: pkt.src, matches: back.matches, winner: back.winner });
    }

    send('A', { kind: 'echo', src: A_IP, dst: DSTS[p.dst], ttl: p.ttl }, hostHop('A', DSTS[p.dst]));
    return ev;
  }

  /** What A has at the end: the echo reply, an ICMP error (type/code and its source), the request left the scene, or
      nothing. */
  function aSees(events) {
    var got = null, left = false;
    events.forEach(function (e) {
      if (e.arrive === 'A') got = e.pkt.kind === 'reply' ? { kind: 'reply', ttl: e.pkt.ttl } : { kind: 'icmp', type: e.pkt.type, code: e.pkt.code, src: e.pkt.src };
      if (e.ev === 'out' && e.pkt.kind === 'echo' && !e.lost) left = true;
    });
    return got || (left ? { kind: 'left' } : { kind: 'silence' });
  }

  function copy(o) { return o == null ? null : JSON.parse(JSON.stringify(o)); }

  var logic = {
    /** Preset both-ways (URM ch11 Primjer 3a): a static route each way, a ping from A to B. */
    defaults: { r1Static: true, r1Default: false, r2Static: true, r2Default: false, r3Default: false, r3Back: false, dst: 'B', ttl: 64 },

    /** Steps for these params (6 for the defaults; every preset under 20). */
    steps: function (p) { return plan(p).length; },

    /** Step 0: the tables as set, A about to send; nothing on the wire. */
    initial: function (params) {
      var p = norm(params), tt = tablesOf(p);
      return { tables: tt.tables, refused: tt.refused, dst: DSTS[p.dst], ttl0: p.ttl, ev: 'start', node: 'A', at: 'A',
        packet: null, from: null, to: null, ttlIn: null, lookup: null, host: null, visit: 0, arrive: null,
        path: [], outcome: null, icmp: null, noError: null, lost: false, sent: [], done: false, seen: null };
    },

    /** State after step n, from the state after step n − 1. */
    step: function (s, n, params) {
      var events = plan(params), e = events[n - 1];
      if (!e) throw new Error('no step ' + n);
      var out = copy(s);
      var fresh = e.ev === 'send';
      out.ev = e.ev;
      out.node = e.node;
      out.packet = copy(e.pkt);
      out.from = e.from || null;
      out.to = e.to || null;
      out.ttlIn = e.ttlIn == null ? null : e.ttlIn;
      out.lookup = copy(e.lookup || e.route) || null;
      out.host = copy(e.host) || null;
      out.visit = e.visit || 0;
      out.arrive = e.arrive || null;
      out.outcome = e.outcome || null;
      out.noError = e.noError || null;
      out.lost = !!e.lost;
      if (fresh) {
        out.path = [{ node: e.node, ttl: e.pkt.ttl }];
        out.sent.push({ id: e.pkt.id, kind: e.pkt.kind, from: e.node, type: e.pkt.type == null ? null : e.pkt.type, code: e.pkt.code == null ? null : e.pkt.code });
      } else {
        out.path.push(e.ev === 'drop' ? { node: e.node, ttl: e.pkt.ttl, dropped: true } : { node: e.node, ttl: e.pkt.ttl });
      }
      if (e.arrive) out.path.push({ node: e.arrive, ttl: e.pkt.ttl });
      if (e.ev === 'drop') out.icmp = copy(e.error);
      out.at = e.arrive || (e.ev === 'drop' || e.ev === 'out' ? e.node : e.to);
      out.done = n === events.length;
      out.seen = out.done ? aSees(events) : null;
      return out;
    },

    plan: plan,
    tablesOf: tablesOf,
    addRoute: addRoute,
    blockedBy: blockedBy,
    routeLookup: routeLookup,
    decide: decide,
    hostHop: hostHop,
    aSees: aSees,
    norm: norm,
    isPrivate: isPrivate,
    parse: parse,
    format: format,
    mask: mask,
    match: match,
    lookup: lookup,
    OPTIONS: OPTIONS,
    KEYS: KEYS,
    ROUTERS: ROUTERS,
    HOSTS: HOSTS,
    DSTS: DSTS,
    ISP_IP: ISP_IP,
    TTL_MIN: TTL_MIN,
    TTL_MAX: TTL_MAX
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
