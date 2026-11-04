/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-dns-forwarders: PC-07 asks DC1 once (rd); DC1 decides, once per query, along cache → hosted zone →
   conditional forwarder (longest domain) → server forwarders (list order, 3 s each) → root hints (if forwarders all
   timed out and fallback is on) → SERVFAIL. An answer, NXDOMAIN included, ends the search. One step = one message.
   Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. The decision (evaluate) and the run (initialFrom + step) work on a plain
   scene object with no strings, so the coordinator can promote them next to the dns-resolution walk. */
(function (root) {
  'use strict';

  /** Windows DNS server defaults (SPEC.md rules 3 and 7; Microsoft KB 2834250, Set-DnsServerCache). */
  var FWD_TIMEOUT = 3;      // ForwardingTimeout, per server forwarder
  var COND_TIMEOUT = 5;     // ForwarderTimeout, per conditional forwarder target
  var MAX_NEG_TTL = 900;    // MaxNegativeCacheTtl
  var MAX_TTL = 86400;      // MaxCacheTtl
  var ADVANCE = 60;         // the repeat comes 60 s after the first lookup ends
  var A_QTYPE = 'A';

  /** Lanes of the chart, by the name asked (K1 has at most six; SPEC.md "Lanes"). */
  var LANES_WWW = ['PC', 'DC', 'fwd', 'root', 'tld', 'auth'];
  var LANES_OTHER = ['PC', 'DC', 'partner', 'fwd', 'root'];

  var HOSTS = {
    PC: { ip: '10.0.0.57' },
    DC: { ip: '10.0.0.10' },
    partner: { ip: '10.20.0.53' },
    fwd: { ip: '198.51.100.53' },
    root: { ip: '198.41.0.4', ns: 'a.root-servers.net' },
    tld: { ip: '192.0.2.10', ns: 'a.ns.org' },
    auth: { ip: '203.0.113.53', ns: 'ns1.example.org' }
  };

  var NAMES = { fs1: 'fs1.corp.example', crm: 'crm.partner.example', www: 'www.example.org' };

  // ── from sims/dns-resolution/sim.js @ a66760c: the hierarchy shape, the cache and the iterative walk ──

  /**
   * The public hierarchy and the partner's own zone. Each zone: its servers (NS order is the order asked), its
   * delegations (child → NS names, glue, TTL), its records and SOA. Invented names and addresses except the root's.
   * The root does not delegate `example` (a reserved TLD): partner.example exists only on the partner's server.
   */
  function world() {
    return {
      '.': { lane: 'root', ns: ['a.root-servers.net', 'b.root-servers.net'],
        glue: { 'a.root-servers.net': '198.41.0.4', 'b.root-servers.net': '170.247.170.2' },
        cuts: { org: { ns: ['a.ns.org', 'b.ns.org'], glue: { 'a.ns.org': '192.0.2.10', 'b.ns.org': '192.0.2.11' }, ttl: 172800 } },
        records: {}, soa: { ttl: 86400, minimum: 86400 } },
      org: { lane: 'tld', ns: ['a.ns.org', 'b.ns.org'],
        cuts: { 'example.org': { ns: ['ns1.example.org', 'ns2.example.org'], glue: { 'ns1.example.org': '203.0.113.53', 'ns2.example.org': '203.0.113.54' }, ttl: 86400 } },
        records: {}, soa: { ttl: 3600, minimum: 3600 } },
      'example.org': { lane: 'auth', ns: ['ns1.example.org', 'ns2.example.org'], cuts: {},
        records: { 'www.example.org': { A: ['203.0.113.80'] } }, ttl: 3600, soa: { ttl: 3600, minimum: 900 } },
      'partner.example': { lane: 'partner', ns: ['ns1.partner.example'], cuts: {},
        records: { 'crm.partner.example': { A: ['10.20.5.8'] } }, ttl: 3600, soa: { ttl: 3600, minimum: 900 } }
    };
  }

  /** The zone names from the name up to the root: 'www.example.org' → ['www.example.org', 'example.org', 'org', '.']. */
  function ancestors(name) {
    var parts = name.split('.'), out = [];
    for (var i = 0; i < parts.length; i++) out.push(parts.slice(i).join('.'));
    out.push('.');
    return out;
  }

  /** An entry is usable while some of its TTL is left: at expiresAt (0 s left) it is expired. Hints never expire. */
  function valid(e, t) { return e.expiresAt === null || e.expiresAt > t; }
  function left(e, t) { return e.expiresAt === null ? null : Math.max(0, e.expiresAt - t); }
  function keyOf(name, type) { return name + ' ' + type; }
  function find(cache, name, type) {
    for (var i = 0; i < cache.length; i++) if (cache[i].name === name && cache[i].type === type) return cache[i];
    return null;
  }
  /** Put an RRset in the cache, replacing the one with the same name and type (an expired one included). */
  function put(cache, e) {
    var out = cache.filter(function (x) { return !(x.name === e.name && x.type === e.type); });
    out.push(e);
    return out;
  }

  /** The root hints: configuration, not a learned record; they never expire. */
  function hints() {
    var z = world()['.'];
    var out = [{ name: '.', type: 'NS', data: z.ns.slice(), ttl: null, expiresAt: null, negative: false, hint: true }];
    z.ns.forEach(function (n) { out.push({ name: n, type: 'A', data: [z.glue[n]], ttl: null, expiresAt: null, negative: false, hint: true }); });
    return out;
  }

  /** A valid cached answer for the name: a negative entry first, then the record. → { entry, negative } or null. */
  function cachedAnswer(cache, name, type, t) {
    var neg = find(cache, name, 'NXDOMAIN');
    if (neg && valid(neg, t)) return { entry: neg, negative: true };
    var pos = find(cache, name, type);
    if (pos && valid(pos, t)) return { entry: pos, negative: false };
    return null;
  }

  /** The deepest zone whose NS set is cached and valid, with an address for its first such server. */
  function deepestNS(cache, name, t) {
    var zs = ancestors(name);
    for (var i = 0; i < zs.length; i++) {
      var ns = find(cache, zs[i], 'NS');
      if (!ns || !valid(ns, t)) continue;
      for (var j = 0; j < ns.data.length; j++) {
        var a = find(cache, ns.data[j], 'A');
        if (a && valid(a, t)) return { zone: zs[i], server: ns.data[j], ip: a.data[0] };
      }
    }
    return null; // unreachable while the hints are in the cache
  }

  /** A server answers from its own data only: the record with aa, NXDOMAIN with aa and the SOA, or a referral. */
  function serve(zs, zone, name, type) {
    var z = zs[zone];
    var cut = Object.keys(z.cuts).filter(function (c) { return inDomain(name, c); })[0];
    if (cut) {
      var d = z.cuts[cut];
      return { kind: 'referral', aa: false, zone: cut, ns: d.ns.slice(), glue: d.ns.map(function (n) { return { name: n, ip: d.glue[n] }; }), ttl: d.ttl };
    }
    var rec = z.records[name];
    if (rec && rec[type]) return { kind: 'answer', aa: true, rr: { name: name, type: type, data: rec[type].slice(), ttl: z.ttl } };
    // RFC 2308 §5: the negative answer lives for the lower of the SOA's own TTL and its MINIMUM (before any cap)
    return { kind: 'nxdomain', aa: true, soa: { zone: zone, ttl: z.soa.ttl, minimum: z.soa.minimum }, ttl: Math.min(z.soa.ttl, z.soa.minimum) };
  }

  // ── new here: domains, the decision order, forwarding ──

  /** The name is the domain or under it: 'crm.partner.example' is in 'partner.example', 'xpartner.example' is not. */
  function inDomain(name, domain) {
    if (domain === '.') return true;
    return name === domain || name.slice(-(domain.length + 1)) === '.' + domain;
  }
  function labels(domain) { return domain === '.' ? 0 : domain.split('.').length; }

  /** Negative caching (RFC 2308 §5): the lower of the SOA's TTL and MINIMUM, capped by the server (rule 7). */
  function negTtl(soa) { return Math.min(soa.ttl, soa.minimum, MAX_NEG_TTL); }
  function posTtl(ttl) { return Math.min(ttl, MAX_TTL); }

  /** What a recursive resolver (the forwarder) answers: it walks the public hierarchy itself; ra, no aa. */
  function resolvePublic(zs, name, type) {
    var zone = '.';
    for (var i = 0; i < 10; i++) {
      var r = serve(zs, zone, name, type);
      if (r.kind !== 'referral') { r.aa = false; return r; }
      zone = r.zone;
    }
    return null;
  }

  /**
   * DC1's table: one row per check, in the order DC1 makes them. Conditional forwarders and forwarders keep their
   * list order; `on: false` is a row that is configured off (shown, never matches).
   */
  function tableRows(dc) {
    var rows = [{ kind: 'cache' }];
    dc.zones.forEach(function (z) { rows.push({ kind: 'zone', domain: z.name }); });
    dc.condForwarders.forEach(function (c) { rows.push({ kind: 'cond', domain: c.domain, targets: c.targets.slice(), on: c.on !== false }); });
    dc.forwarders.forEach(function (ip) { rows.push({ kind: 'fwd', ip: ip }); });
    rows.push({ kind: 'hints', on: !!dc.useRootHints });
    return rows;
  }

  /**
   * The decision for a name (rules 1–7). `cache` and `t0` are the cache and time when the query arrived; `failed`
   * lists the rows (indices) whose every target has timed out. Every row gets hit true/false and a note; the first
   * hit decides (K4 first match). → { rows, at, win } with at = the deciding row, rows.length for the implicit SERVFAIL.
   */
  function evaluate(dc, cache, name, t0, failed) {
    failed = failed || [];
    var rows = tableRows(dc);
    // rule 2 tie-break: of the conditional forwarders that are on and match, the longest domain; equal: the first
    var best = -1;
    rows.forEach(function (r, i) {
      if (r.kind === 'cond' && r.on && inDomain(name, r.domain) && (best < 0 || labels(r.domain) > labels(rows[best].domain))) best = i;
    });
    var anyFwd = rows.some(function (r) { return r.kind === 'fwd'; });
    var fwdLeft = rows.some(function (r, i) { return r.kind === 'fwd' && failed.indexOf(i) < 0; });
    var out = rows.map(function (r, i) {
      var row = { kind: r.kind, hit: false, note: null, mark: null };
      ['domain', 'ip', 'targets', 'on'].forEach(function (k) { if (r[k] !== undefined) row[k] = r[k]; });
      if (failed.indexOf(i) >= 0) { row.note = 'timeout'; row.mark = 'beaten'; return row; }
      switch (r.kind) {
        case 'cache': {
          var hit = cachedAnswer(cache, name, A_QTYPE, t0);
          row.hit = !!hit;
          if (hit) row.negative = hit.negative;
          break;
        }
        case 'zone': row.hit = inDomain(name, r.domain); break;
        case 'cond':
          if (!dc.recursion) row.note = 'norec';
          else if (!r.on) row.note = 'off';
          else if (inDomain(name, r.domain) && i !== best) row.note = r.domain === rows[best].domain ? 'same' : 'shorter';
          else row.hit = i === best;
          break;
        case 'fwd':
          if (!dc.recursion) row.note = 'norec';
          else row.hit = true; // any name; a failed one was handled above
          break;
        case 'hints':
          if (!dc.recursion) row.note = 'norec';
          // rule 4: after every forwarder timed out, if allowed; with no forwarders at all, always
          else if (anyFwd && !r.on) row.note = 'off';
          else row.hit = !anyFwd || !fwdLeft;
          break;
        default: break;
      }
      return row;
    });
    // rule 8: a conditional forwarder that never answered ends in SERVFAIL; the rows under it are not read
    var condFell = -1;
    failed.forEach(function (i) { if (rows[i].kind === 'cond' && (condFell < 0 || i < condFell)) condFell = i; });
    if (condFell >= 0) out.forEach(function (r, i) { if (i > condFell) { r.hit = false; r.note = null; r.mark = 'skip'; } });
    var win = -1;
    for (var i = 0; i < out.length; i++) if (out[i].hit) { win = i; break; }
    return { rows: out, at: win < 0 ? out.length : win, win: win };
  }

  /** The scene for the page's params (SPEC.md "Scene", "Params"). */
  function sceneOf(p) {
    return {
      name: NAMES[p.name] || p.name,
      repeat: !!p.repeat,
      dc: {
        zones: [{ name: 'corp.example', records: { 'fs1.corp.example': { A: ['10.0.0.21'] } }, ttl: 3600, soa: { ttl: 3600, minimum: 900 } }],
        condForwarders: [{ domain: 'partner.example', targets: ['10.20.0.53'], on: !!p.condFwd }],
        forwarders: ['198.51.100.53'],
        useRootHints: !!p.rootHints,
        recursion: !!p.recursion
      },
      servers: {
        '10.20.0.53': { lane: 'partner', role: 'auth', zone: 'partner.example' },
        '198.51.100.53': { lane: 'fwd', role: 'resolver' }
      },
      up: { '10.20.0.53': true, '198.51.100.53': !!p.forwarderUp }
    };
  }

  function msg(s, m) {
    var out = { n: s.msgs.length + 1, lookup: s.lookup, t: s.t, from: m.from, to: m.to, kind: m.kind,
      rd: !!m.rd, ra: !!m.ra, aa: !!m.aa, q: { name: s.query.name, type: s.query.type } };
    ['rr', 'ns', 'zone', 'glue', 'ttl', 'soa', 'fromCache', 'server', 'lost', 'wait', 'rule', 'source'].forEach(function (k) { if (m[k] !== undefined) out[k] = m[k]; });
    return out;
  }

  /** Re-decide after a timeout or at a new query; sets the table and the route (the winning row's action). */
  function route(s) {
    var ev = evaluate(s.dc, s.cache, s.query.name, s.qt, s.failed);
    s.table = { rows: ev.rows, at: ev.at, result: null };
    var r = ev.win < 0 ? { kind: 'fail' } : { kind: ev.rows[ev.win].kind, row: ev.win };
    if (r.kind === 'cond') { r.targets = ev.rows[ev.win].targets.slice(); r.timeout = COND_TIMEOUT; }
    if (r.kind === 'fwd') { r.targets = [ev.rows[ev.win].ip]; r.timeout = FWD_TIMEOUT; }
    r.ti = 0;
    s.route = r;
    if (r.kind === 'cache') {
      var hit = cachedAnswer(s.cache, s.query.name, A_QTYPE, s.qt);
      s.pending = { source: 'cache', entry: hit.entry, negative: hit.negative };
      s.touched = [{ key: keyOf(hit.entry.name, hit.entry.type), how: 'used' }];
      s.phase = 'reply';
    } else if (r.kind === 'zone') {
      var z = s.dc.zones.filter(function (x) { return x.name === ev.rows[ev.win].domain; })[0];
      var rec = z.records[s.query.name];
      s.pending = rec && rec[A_QTYPE] ? { source: 'zone', rr: { name: s.query.name, type: A_QTYPE, data: rec[A_QTYPE].slice(), ttl: z.ttl }, negative: false }
        : { source: 'zone', negative: true, soa: { zone: z.name, ttl: z.soa.ttl, minimum: z.soa.minimum }, ttl: negTtl(z.soa) };
      s.phase = 'reply';
    } else if (r.kind === 'fail') {
      s.pending = { source: 'fail', servfail: true };
      s.phase = 'reply';
    } else if (r.kind === 'hints') {
      s.target = deepestNS(s.cache, s.query.name, s.t);
      s.phase = 'ask';
    } else {
      s.phase = 'forward';
    }
  }

  /** Time passes for a target that did not answer: the clock moves on and the row fails when it has no target left. */
  function consumeWait(s) {
    if (!s.wait) return false;
    s.t += s.wait.sec;
    var fell = s.wait.rowDone;
    if (fell) s.failed.push(s.wait.row);
    s.wait = null;
    if (fell) route(s);
    return true;
  }

  function cacheAnswer(s, r) {
    // rule 7: whatever answer DC1 receives is cached for its TTL (capped); a referral's NS and glue too
    if (r.kind === 'answer') {
      var ttl = posTtl(r.rr.ttl);
      var e = { name: r.rr.name, type: r.rr.type, data: r.rr.data.slice(), ttl: ttl, expiresAt: s.t + ttl, negative: false };
      s.cache = put(s.cache, e);
      s.touched.push({ key: keyOf(e.name, e.type), how: 'added' });
      return e;
    }
    var nt = negTtl(r.soa);
    var ne = { name: s.query.name, type: 'NXDOMAIN', data: [], ttl: nt, expiresAt: s.t + nt, negative: true };
    s.cache = put(s.cache, ne);
    s.touched.push({ key: keyOf(ne.name, ne.type), how: 'added' });
    return ne;
  }

  /** The decision table's outcome once DC1 holds the answer: the address, or NXDOMAIN. */
  function resultOf(r) {
    return r.kind === 'answer' ? { kind: 'answer', ip: r.rr.data[0], ttl: r.rr.ttl } : { kind: 'nxdomain', ttl: r.ttl };
  }

  function startLookup(s, n) {
    s.qt = s.t;
    s.failed = [];
    s.target = null;
    s.pending = null;
    s.lookupStart.push(n);
    s.msgs.push(msg(s, { from: 'PC', to: 'DC', kind: 'query', rd: true }));
    route(s);
    s.msgs[s.msgs.length - 1].rule = s.route.kind;
  }

  function laneOf(s, ip) { return s.servers[ip] ? s.servers[ip].lane : ip; }

  function initialFrom(sc) {
    return { t: 0, lookup: 1, query: { name: sc.name, type: A_QTYPE }, qt: 0, repeat: !!sc.repeat,
      dc: JSON.parse(JSON.stringify(sc.dc)), servers: JSON.parse(JSON.stringify(sc.servers)), up: JSON.parse(JSON.stringify(sc.up)),
      cache: hints(), msgs: [], phase: 'start', route: null, failed: [], wait: null, target: null, pending: null,
      table: { rows: evaluate(sc.dc, hints(), sc.name, 0, []).rows.map(function (r) { r.hit = null; r.note = null; r.mark = null; return r; }), at: -1, result: null },
      touched: [], lookupStart: [], outcome: [] };
  }

  function stepState(s0) {
    var s = JSON.parse(JSON.stringify(s0));
    var n = s.msgs.length + 1; // the step number: one message per step
    var zs = world();
    s.touched = [];
    switch (s.phase) {
      case 'start':
      case 'between': {
        if (s.phase === 'between') { s.lookup = 2; s.t += ADVANCE; }
        startLookup(s, n);
        break;
      }
      case 'forward': {
        // rule 3: one target at a time, in list order; rd set (forwarding is a recursive query)
        consumeWait(s);
        if (s.phase !== 'forward') return stepFrom(s); // the row fell: the next row acts in this same step
        var ip = s.route.targets[s.route.ti];
        var up = s.up[ip] !== false;
        var m = { from: 'DC', to: laneOf(s, ip), kind: 'query', rd: true, server: ip, rule: s.route.kind };
        if (!up) {
          m.lost = true;
          m.wait = s.route.timeout;
          s.route.ti++;
          s.wait = { sec: s.route.timeout, row: s.route.row, rowDone: s.route.ti >= s.route.targets.length };
          // still 'forward': the next step lets the time pass and tries the next target or the next row
        } else {
          s.phase = 'fwdAwait';
        }
        s.msgs.push(msg(s, m));
        break;
      }
      case 'fwdAwait': {
        var sip = s.route.targets[s.route.ti], srv = s.servers[sip];
        var r = srv.role === 'auth' ? serve(zs, srv.zone, s.query.name, A_QTYPE) : resolvePublic(zs, s.query.name, A_QTYPE);
        if (srv.role === 'resolver') r.ra = true;
        var e = cacheAnswer(s, r);
        var am = { from: laneOf(s, sip), to: 'DC', kind: r.kind, aa: !!r.aa, ra: !!r.ra, server: sip, rule: s.route.kind, ttl: r.kind === 'answer' ? r.rr.ttl : r.ttl };
        if (r.kind === 'answer') am.rr = r.rr; else am.soa = r.soa;
        s.msgs.push(msg(s, am));
        // rule 5: an answer, NXDOMAIN included, ends the search
        s.pending = { source: s.route.kind, entry: e, negative: r.kind !== 'answer' };
        s.table.result = resultOf(r);
        s.phase = 'reply';
        break;
      }
      case 'ask': {
        // rule 4: iterative from the deepest cached NS (root hints at first); no rd
        consumeWait(s);
        if (s.phase !== 'ask') return stepFrom(s);
        if (!s.target) s.target = deepestNS(s.cache, s.query.name, s.t);
        var lane = zs[s.target.zone].lane;
        s.msgs.push(msg(s, { from: 'DC', to: lane, kind: 'query', rd: false, zone: s.target.zone, server: s.target.server, rule: 'hints' }));
        s.touched = [{ key: keyOf(s.target.zone, 'NS'), how: 'used' }];
        s.phase = 'await';
        break;
      }
      case 'await': {
        var zone = s.target.zone, from = zs[zone].lane;
        var w = serve(zs, zone, s.query.name, A_QTYPE);
        if (w.kind === 'referral') {
          s.msgs.push(msg(s, { from: from, to: 'DC', kind: 'referral', aa: false, zone: w.zone, ns: w.ns, glue: w.glue, ttl: w.ttl, server: s.target.server, rule: 'hints' }));
          s.cache = put(s.cache, { name: w.zone, type: 'NS', data: w.ns.slice(), ttl: w.ttl, expiresAt: s.t + w.ttl, negative: false });
          s.touched.push({ key: keyOf(w.zone, 'NS'), how: 'added' });
          w.glue.forEach(function (g) {
            s.cache = put(s.cache, { name: g.name, type: 'A', data: [g.ip], ttl: w.ttl, expiresAt: s.t + w.ttl, negative: false, glue: true });
          });
          s.target = deepestNS(s.cache, s.query.name, s.t);
          s.phase = 'ask';
        } else {
          var am2 = { from: from, to: 'DC', kind: w.kind, aa: true, server: s.target.server, rule: 'hints', ttl: w.kind === 'answer' ? w.rr.ttl : w.ttl };
          if (w.kind === 'answer') am2.rr = w.rr; else am2.soa = w.soa;
          s.msgs.push(msg(s, am2));
          var e2 = cacheAnswer(s, w);
          s.pending = { source: 'hints', entry: e2, negative: w.kind !== 'answer' };
          s.table.result = resultOf(w);
          s.target = null;
          s.phase = 'reply';
        }
        break;
      }
      case 'reply': {
        // DC1 to PC-07: an answer, NXDOMAIN or SERVFAIL; aa only from its own zone; ra when recursion is on
        consumeWait(s);
        var pr = s.pending, rm = { from: 'DC', to: 'PC', ra: !!s.dc.recursion, source: pr.source, rule: s.route.kind };
        var res;
        if (pr.servfail) {
          rm.kind = 'servfail';
          res = { kind: 'servfail' };
        } else if (pr.source === 'zone') {
          rm.aa = true;
          if (pr.negative) { rm.kind = 'nxdomain'; rm.soa = pr.soa; rm.ttl = pr.ttl; res = { kind: 'nxdomain' }; }
          else { rm.kind = 'answer'; rm.rr = pr.rr; rm.ttl = pr.rr.ttl; res = { kind: 'answer', ip: pr.rr.data[0] }; }
        } else {
          var en = pr.entry, ttlLeft = left(en, s.t);
          rm.ttl = ttlLeft;
          rm.fromCache = pr.source === 'cache';
          if (pr.negative) { rm.kind = 'nxdomain'; res = { kind: 'nxdomain' }; }
          else { rm.kind = 'answer'; rm.rr = { name: en.name, type: en.type, data: en.data.slice(), ttl: ttlLeft }; res = { kind: 'answer', ip: en.data[0] }; }
          s.touched = [{ key: keyOf(en.name, en.type), how: 'used' }];
        }
        s.msgs.push(msg(s, rm));
        res.ttl = rm.ttl === undefined ? null : rm.ttl;
        s.table.result = res;
        var mine = s.msgs.filter(function (x) { return x.lookup === s.lookup; });
        s.outcome.push({ lookup: s.lookup, name: s.query.name, result: res.kind, ip: res.ip || null, rule: s.route.kind,
          fromCache: !!rm.fromCache, msgs: mine.length, start: mine[0].t, end: s.t,
          out: mine.filter(function (x) { return x.from === 'DC' && x.to !== 'PC'; }).length });
        s.pending = null;
        s.phase = s.repeat && s.lookup === 1 ? 'between' : 'done';
        break;
      }
      default:
        break;
    }
    return s;
  }

  /** After a row fell in consumeWait, the new route's first action happens in the same step. */
  function stepFrom(s) { return stepState(s); }

  var logic = {
    defaults: { name: 'fs1', condFwd: true, forwarderUp: true, rootHints: true, recursion: true, repeat: false },

    HOSTS: HOSTS,
    NAMES: NAMES,
    FWD_TIMEOUT: FWD_TIMEOUT,
    COND_TIMEOUT: COND_TIMEOUT,
    MAX_NEG_TTL: MAX_NEG_TTL,
    MAX_TTL: MAX_TTL,
    ADVANCE: ADVANCE,

    /** The lanes of the chart for these params. */
    lanes: function (p) { return (NAMES[p.name] || p.name) === NAMES.www ? LANES_WWW.slice() : LANES_OTHER.slice(); },

    /** Steps for these params: every message of the run (both lookups with repeat). */
    steps: function (p) { return logic.run(sceneOf(p)).length - 1; },

    initial: function (p) { return initialFrom(sceneOf(p)); },

    /** State after step n: one message more. */
    step: function (s0) { return stepState(s0); },

    /** Every state of a run from a scene: [initial, after message 1, …]. */
    run: function (sc) {
      var s = initialFrom(sc), out = [s];
      while (s.phase !== 'done' && out.length < 60) { s = stepState(s); out.push(s); }
      return out;
    },

    // exported for the page and the tests
    sceneOf: sceneOf,
    initialFrom: initialFrom,
    world: world,
    ancestors: ancestors,
    valid: valid,
    left: left,
    keyOf: keyOf,
    find: find,
    hints: hints,
    cachedAnswer: cachedAnswer,
    deepestNS: deepestNS,
    serve: serve,
    inDomain: inDomain,
    negTtl: negTtl,
    resolvePublic: resolvePublic,
    tableRows: tableRows,
    evaluate: evaluate,

    /** The step after which the first lookup has answered PC-07. */
    firstDone: function (p) {
      var all = logic.run(sceneOf(p));
      for (var i = 0; i < all.length; i++) if (all[i].outcome.length) return i;
      return all.length - 1;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
