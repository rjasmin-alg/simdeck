/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for dns-resolution: a stub resolver asks a recursive resolver once (rd); the resolver walks the hierarchy
   iteratively (root → hr → grafo.hr), caches every RRset for its TTL, and a second lookup later starts from what is
   still cached. One step = one message. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. The resolver part (lookup, deepest NS, serve) works on plain data with no
   strings, so a later preset (forwarders) or a TTL page can reuse it. */
(function (root) {
  'use strict';

  var A_QTYPE = 'A';
  /** SOA of grafo.hr: the record's own TTL and MINIMUM (UL ch19, Primjer 2: MINIMUM 900 s). */
  var SOA = { ttl: 3600, minimum: 900 };
  /** TTL of the hr delegation (NS + glue) in the root zone: two days. */
  var TTL_TLD = 172800;

  /** The parties, left to right: the lanes of the chart. */
  var HOSTS = {
    S: { ip: '192.168.1.5' },
    R: { ip: '192.168.1.99' },
    root: { zone: '.' },
    tld: { zone: 'hr' },
    auth: { zone: 'grafo.hr' }
  };
  var LANES = ['S', 'R', 'root', 'tld', 'auth'];

  /**
   * The fixed hierarchy, with the TTLs that depend on params filled in. Each zone has its servers (NS order is the
   * order the model asks them in: rule 8), its delegations (child zone → NS names, glue addresses, TTL) and its own
   * records. Server names and addresses are invented (documentation ranges) except the root's.
   */
  function zones(p) {
    return {
      '.': { lane: 'root', ns: ['a.root-servers.net', 'b.root-servers.net'],
        glue: { 'a.root-servers.net': '198.41.0.4', 'b.root-servers.net': '170.247.170.2' },
        cuts: { hr: { ns: ['a.ns.hr', 'b.ns.hr'], glue: { 'a.ns.hr': '198.51.100.10', 'b.ns.hr': '198.51.100.11' }, ttl: TTL_TLD } },
        records: {}, soa: { ttl: 86400, minimum: 86400 } },
      hr: { lane: 'tld', ns: ['a.ns.hr', 'b.ns.hr'],
        cuts: { 'grafo.hr': { ns: ['ns1.grafo.hr', 'ns2.grafo.hr'], glue: { 'ns1.grafo.hr': '203.0.113.53', 'ns2.grafo.hr': '203.0.113.54' }, ttl: p.ttlNS } },
        records: {}, soa: { ttl: 3600, minimum: 3600 } },
      'grafo.hr': { lane: 'auth', ns: ['ns1.grafo.hr', 'ns2.grafo.hr'], cuts: {},
        records: { 'www.grafo.hr': { A: ['203.0.113.80'] }, 'mail.grafo.hr': { A: ['203.0.113.25'] } },
        soa: SOA, ttlA: p.ttlA }
    };
  }

  /** 'www' → 'www.grafo.hr'. */
  function fqdn(label) { return label + '.grafo.hr'; }
  /** The name the second lookup asks for. */
  function againName(p) { return fqdn(p.again === 'same' ? p.name : p.again); }

  /** The zone names from the name up to the root: 'www.grafo.hr' → ['www.grafo.hr', 'grafo.hr', 'hr', '.']. */
  function ancestors(name) {
    var parts = name.split('.'), out = [];
    for (var i = 0; i < parts.length; i++) out.push(parts.slice(i).join('.'));
    out.push('.');
    return out;
  }

  // ── the cache ──

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

  /** The root hints: where the walk starts when nothing deeper is cached. Configuration, not a learned record. */
  function hints(p) {
    var z = zones(p)['.'];
    var out = [{ name: '.', type: 'NS', data: z.ns.slice(), ttl: null, expiresAt: null, negative: false, hint: true }];
    z.ns.forEach(function (n) { out.push({ name: n, type: 'A', data: [z.glue[n]], ttl: null, expiresAt: null, negative: false, hint: true }); });
    return out;
  }

  /**
   * Step (1) of the resolver: the exact answer from the cache, or a cached negative answer for the name.
   * → { rr, negative } or null.
   */
  function cachedAnswer(cache, name, type, t) {
    var neg = find(cache, name, 'NXDOMAIN');
    if (neg && valid(neg, t)) return { entry: neg, negative: true };
    var pos = find(cache, name, type);
    if (pos && valid(pos, t)) return { entry: pos, negative: false };
    return null;
  }

  /**
   * Step (2): the deepest zone whose NS set is cached and still valid, with an address for one of its servers.
   * The server asked is the first listed NS with a valid address (rule 8; real resolvers pick by measured RTT).
   * → { zone, server, ip }.
   */
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

  /**
   * A server answers from its own data only (rule 2): the record with aa, NXDOMAIN with aa and the SOA, or a referral
   * to the child zone that is closer to the name (NS + glue, no aa).
   */
  function serve(zs, zone, name, type) {
    var z = zs[zone];
    var cut = Object.keys(z.cuts).filter(function (c) { return name === c || name.slice(-(c.length + 1)) === '.' + c; })[0];
    if (cut) {
      var d = z.cuts[cut];
      return { kind: 'referral', aa: false, zone: cut, ns: d.ns.slice(), glue: d.ns.map(function (n) { return { name: n, ip: d.glue[n] }; }), ttl: d.ttl };
    }
    var rec = z.records[name];
    if (rec && rec[type]) return { kind: 'answer', aa: true, rr: { name: name, type: type, data: rec[type].slice(), ttl: z.ttlA } };
    // RFC 2308 §5: the negative answer is cached for the lower of the SOA's own TTL and its MINIMUM
    return { kind: 'nxdomain', aa: true, soa: { zone: zone, ttl: z.soa.ttl, minimum: z.soa.minimum }, ttl: Math.min(z.soa.ttl, z.soa.minimum) };
  }

  /** The number of the lookup (1 or 2) a state is in, and the name it asks. */
  function qnameOf(s, p) { return s.lookup === 2 ? againName(p) : fqdn(p.name); }

  function msg(s, m) {
    var out = { n: s.msgs.length + 1, lookup: s.lookup, t: s.t, from: m.from, to: m.to, kind: m.kind, rd: !!m.rd, ra: !!m.ra, aa: !!m.aa,
      q: { name: s.query.name, type: s.query.type } };
    ['rr', 'ns', 'zone', 'glue', 'ttl', 'soa', 'fromCache', 'server'].forEach(function (k) { if (m[k] !== undefined) out[k] = m[k]; });
    return out;
  }

  /** What the resolver does next after it has a question and a cache: answer from the cache, or ask a server. */
  function plan(cache, q, t) {
    var hit = cachedAnswer(cache, q.name, q.type, t);
    if (hit) return { phase: 'reply', hit: hit, used: [keyOf(hit.entry.name, hit.entry.type)] };
    var d = deepestNS(cache, q.name, t);
    return { phase: 'ask', target: d, used: [keyOf(d.zone, 'NS'), keyOf(d.server, 'A')] };
  }

  var logic = {
    /** Parameter defaults. */
    defaults: { name: 'www', again: 'same', advance: 60, ttlA: 3600, ttlNS: 86400 },

    HOSTS: HOSTS,
    LANES: LANES,
    SOA: SOA,
    TTL_TLD: TTL_TLD,

    /** Steps for these params: the messages of both lookups (cold www + warm at +60 s: 8 + 2 = 10). */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (s.phase !== 'done' && n < 40) { n++; s = logic.step(s, n, p); }
      return n;
    },

    /** State at step 0: an empty cache (only the root hints), the first lookup about to start at t = 0. */
    initial: function (p) {
      return { t: 0, lookup: 1, query: { name: fqdn(p.name), type: A_QTYPE }, phase: 'start', target: null, pendingReply: null,
        cache: hints(p), msgs: [], touched: [], lookupStart: [], outcome: [] };
    },

    /** State after step n: one message more. */
    step: function (s0, n, p) {
      var s = JSON.parse(JSON.stringify(s0));
      var zs = zones(p);
      s.touched = [];
      var next;
      switch (s.phase) {
        case 'start':
        case 'between': {
          if (s.phase === 'between') { s.lookup = 2; s.t += p.advance; }
          s.query = { name: qnameOf(s, p), type: A_QTYPE };
          s.lookupStart.push(n);
          // rule 1: the stub sends one recursive query (rd) to the resolver
          s.msgs.push(msg(s, { from: 'S', to: 'R', kind: 'query', rd: true }));
          next = plan(s.cache, s.query, s.t);
          s.phase = next.phase;
          s.target = next.target || null;
          s.pendingReply = next.hit ? { fromCache: true, entry: next.hit.entry, negative: next.hit.negative } : null;
          s.touched = next.used.map(function (k) { return { key: k, how: 'used' }; });
          break;
        }
        case 'ask': {
          // rule 2: an iterative query (no rd) to the server of the deepest cached zone
          var lane = zs[s.target.zone].lane;
          s.msgs.push(msg(s, { from: 'R', to: lane, kind: 'query', rd: false, zone: s.target.zone, server: s.target.server }));
          s.phase = 'await';
          s.touched = [{ key: keyOf(s.target.zone, 'NS'), how: 'used' }, { key: keyOf(s.target.server, 'A'), how: 'used' }];
          break;
        }
        case 'await': {
          var zone = s.target.zone, from = zs[zone].lane;
          var r = serve(zs, zone, s.query.name, s.query.type);
          if (r.kind === 'referral') {
            // rule 3: NS + glue, no aa; cached for the delegation's TTL; then step (2) again
            s.msgs.push(msg(s, { from: from, to: 'R', kind: 'referral', aa: false, zone: r.zone, ns: r.ns, glue: r.glue, ttl: r.ttl, server: s.target.server }));
            s.cache = put(s.cache, { name: r.zone, type: 'NS', data: r.ns.slice(), ttl: r.ttl, expiresAt: s.t + r.ttl, negative: false });
            s.touched.push({ key: keyOf(r.zone, 'NS'), how: 'added' });
            r.glue.forEach(function (g) {
              s.cache = put(s.cache, { name: g.name, type: 'A', data: [g.ip], ttl: r.ttl, expiresAt: s.t + r.ttl, negative: false, glue: true });
              s.touched.push({ key: keyOf(g.name, 'A'), how: 'added' });
            });
            next = plan(s.cache, s.query, s.t);
            s.phase = next.phase;
            s.target = next.target || null;
            s.pendingReply = next.hit ? { fromCache: false, entry: next.hit.entry, negative: next.hit.negative } : null;
          } else if (r.kind === 'answer') {
            // rule 4: only the authoritative answer has aa; rule 5: cached for its TTL
            s.msgs.push(msg(s, { from: from, to: 'R', kind: 'answer', aa: true, rr: r.rr, ttl: r.rr.ttl, server: s.target.server }));
            var e = { name: r.rr.name, type: r.rr.type, data: r.rr.data.slice(), ttl: r.rr.ttl, expiresAt: s.t + r.rr.ttl, negative: false };
            s.cache = put(s.cache, e);
            s.touched.push({ key: keyOf(e.name, e.type), how: 'added' });
            s.phase = 'reply';
            s.pendingReply = { fromCache: false, entry: e, negative: false };
          } else {
            // rule 7: NXDOMAIN with aa; cached as a negative answer for min(SOA TTL, MINIMUM)
            s.msgs.push(msg(s, { from: from, to: 'R', kind: 'nxdomain', aa: true, soa: r.soa, ttl: r.ttl, server: s.target.server }));
            var ne = { name: s.query.name, type: 'NXDOMAIN', data: [], ttl: r.ttl, expiresAt: s.t + r.ttl, negative: true };
            s.cache = put(s.cache, ne);
            s.touched.push({ key: keyOf(ne.name, ne.type), how: 'added' });
            s.phase = 'reply';
            s.pendingReply = { fromCache: false, entry: ne, negative: true };
          }
          s.target = s.phase === 'ask' ? s.target : null;
          break;
        }
        case 'reply': {
          // rules 1 and 4: an answer or an error to the stub, never a referral; ra set, no aa; the TTL is what is left
          var pr = s.pendingReply, en = pr.entry, ttlLeft = left(en, s.t);
          var m = { from: 'R', to: 'S', kind: pr.negative ? 'nxdomain' : 'answer', ra: true, aa: false, ttl: ttlLeft, fromCache: pr.fromCache };
          if (!pr.negative) m.rr = { name: en.name, type: en.type, data: en.data.slice(), ttl: ttlLeft };
          s.msgs.push(msg(s, m));
          s.touched = [{ key: keyOf(en.name, en.type), how: 'used' }];
          s.outcome.push({ lookup: s.lookup, name: s.query.name, negative: pr.negative, fromCache: pr.fromCache, ttl: ttlLeft,
            msgs: s.msgs.filter(function (x) { return x.lookup === s.lookup; }).length,
            out: s.msgs.filter(function (x) { return x.lookup === s.lookup && x.from === 'R' && x.to !== 'S'; }).length });
          s.pendingReply = null;
          s.phase = s.lookup === 1 ? 'between' : 'done';
          break;
        }
        default:
          break;
      }
      return s;
    },

    // exported for the page and the tests
    zones: zones,
    fqdn: fqdn,
    againName: againName,
    ancestors: ancestors,
    valid: valid,
    left: left,
    keyOf: keyOf,
    find: find,
    hints: hints,
    cachedAnswer: cachedAnswer,
    deepestNS: deepestNS,
    serve: serve,

    /** The step after which the first lookup has answered the stub (the "repeat warm" button goes one past it). */
    firstDone: function (p) {
      var s = logic.initial(p), n = 0;
      while (s.phase !== 'between' && n < 40) { n++; s = logic.step(s, n, p); }
      return n;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
