/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-dns-client-order: how a Windows client (PC-07, corp.example, 10.0.0.57) resolves a typed name.
   The stages, in order: hosts file → DNS client cache → DNS servers (one candidate FQDN at a time, built from the
   suffixes) → LLMNR (link multicast) → NetBIOS (broadcast). One step = one try: one stage, one candidate name, or one
   server asked. The lookup stops at the first positive answer. A run is one lookup, or two when `repeat` is on: the
   same name again 60 s later, with the preferred server back up and, if `flush` is on, the cache flushed first.
   Rules, tie-breaks and numbers: SPEC.md (rule numbers in the comments below).
   The cache with TTL and negative entries follows sims/dns-resolution/sim.js @ 3debb2f (an entry with 0 s left is
   expired); the code is written here, as the client cache is a list of names, not RRsets.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var PC = { name: 'PC-07', ip: '10.0.0.57', primarySuffix: 'corp.example' };
  var PREFERRED = '10.0.0.10';
  var TYPED = ['fs1', 'fs1.corp.example', 'fs1.corp.example.', 'printer', 'fs1.'];
  var ALTERNATES = ['none', '10.0.0.11', '203.0.113.53'];
  var SEARCH = ['none', 'example.com'];

  /** What each server knows. The two DCs hold corp.example; the public resolver does not (NXDOMAIN for it). */
  var INTERNAL = { 'fs1.corp.example': '10.0.0.21', 'dc01.corp.example': '10.0.0.10', 'dc02.corp.example': '10.0.0.11' };
  var ZONES = { '10.0.0.10': INTERNAL, '10.0.0.11': INTERNAL, '203.0.113.53': {} };
  var KIND = { '10.0.0.10': 'internal', '10.0.0.11': 'internal', '203.0.113.53': 'public' };
  /** Hosts on PC-07's link that answer link-local queries (rule 6). The servers do not (SPEC.md "Scene"). */
  var SEGMENT = [{ name: 'printer', ip: '10.0.0.77', who: 'laptop', llmnr: true, netbios: true }];
  var STALE_HOSTS = [{ name: 'fs1', ip: '10.0.0.99' }];

  /** Rule 7: TTL of the A records here (a registered host record, 20 min) and the client's caps. */
  var RECORD_TTL = 1200;
  var MAX_CACHE_TTL = 86400;
  /** Rule 2: how long an NXDOMAIN is kept (MaxNegativeCacheTtl). */
  var NEG_TTL = 900;
  /** Rule 5: preferred asked at 0 s, the alternate at 1 s; nobody answered → the client gives up at 10 s. */
  var FIRST_WAIT = 1;
  var GIVE_UP = 10;
  /** When the repeat lookup starts (s after the first). */
  var REPEAT_AT = 60;

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function pick(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }

  /** The params the model acts on, cleaned. */
  function eff(p) {
    p = p || {};
    return {
      typed: pick(p.typed, TYPED, 'fs1'),
      searchList: pick(p.searchList, SEARCH, 'none'),
      alternate: pick(p.alternate, ALTERNATES, 'none'),
      preferredUp: p.preferredUp === undefined ? true : !!p.preferredUp,
      hostsEntry: !!p.hostsEntry,
      llmnr: p.llmnr === undefined ? true : !!p.llmnr,
      netbios: p.netbios === undefined ? true : !!p.netbios,
      repeat: !!p.repeat,
      flush: !!p.repeat && !!p.flush
    };
  }

  /** The scene from the params: plain data, so tests can build other scenes (devolution, two answers on the link). */
  function scene(p) {
    var e = eff(p);
    var servers = [PREFERRED];
    if (e.alternate !== 'none') servers.push(e.alternate);
    var lookups = [{ at: 0, flush: false, up: {} }];
    lookups[0].up[PREFERRED] = e.preferredUp;
    if (e.repeat) {
      var up = {};
      up[PREFERRED] = true; // the preferred server is back
      lookups.push({ at: REPEAT_AT, flush: e.flush, up: up });
    }
    return {
      typed: e.typed,
      settings: {
        primarySuffix: PC.primarySuffix, connSuffix: null,
        searchList: e.searchList === 'none' ? null : [e.searchList],
        devolution: true, appendMulti: false,
        dnsServers: servers, llmnr: e.llmnr, netbios: e.netbios
      },
      hosts: e.hostsEntry ? clone(STALE_HOSTS) : [],
      zones: ZONES,
      ttl: RECORD_TTL,
      segment: clone(SEGMENT),
      lookups: lookups
    };
  }

  // ── rules 3 and 4: the names tried ──

  /** Suffixes for a name, in order (rule 3): the search list alone if set; else primary, its devolution, connection. */
  function suffixes(st) {
    if (st.searchList && st.searchList.length) return st.searchList.map(function (s) { return { suffix: s, src: 'list' }; });
    var out = [];
    if (st.primarySuffix) {
      out.push({ suffix: st.primarySuffix, src: 'primary' });
      if (st.devolution) {
        var labels = st.primarySuffix.split('.');
        for (var i = 1; labels.length - i >= 2; i++) out.push({ suffix: labels.slice(i).join('.'), src: 'devolution' });
      }
    }
    if (st.connSuffix) out.push({ suffix: st.connSuffix, src: 'connection' });
    return out;
  }

  /** The candidate FQDNs for a typed name (rules 3, 4), duplicates dropped (the first stays). Stored without the final dot. */
  function candidates(typed, st) {
    var raw = String(typed).trim().toLowerCase();
    if (/\.$/.test(raw)) return [{ fqdn: raw.replace(/\.+$/, ''), src: 'typed' }]; // rule 3: a final dot → as typed only
    var out = [];
    function add(f, src) { if (!out.some(function (c) { return c.fqdn === f; })) out.push({ fqdn: f, src: src }); }
    var multi = raw.indexOf('.') >= 0;
    if (multi) add(raw, 'typed');                                                  // rule 4: as typed first
    if (!multi || st.appendMulti) suffixes(st).forEach(function (s) { add(raw + '.' + s.suffix, s.src); });
    return out;
  }

  /** The name without a final dot, lower case. */
  function bare(typed) { return String(typed).trim().toLowerCase().replace(/\.+$/, ''); }
  /** Rule 6: LLMNR and NetBIOS are tried only for a name typed without any dot (a single label). */
  function singleLabel(typed) { return String(typed).trim().indexOf('.') < 0; }

  // ── the cache ──

  /** The cache after a flush: empty, then the hosts entries loaded again (rule 7). Hosts rows never expire. */
  function hostsRows(hosts) {
    return hosts.map(function (h) { return { name: h.name.toLowerCase(), ip: h.ip, expiresAt: null, from: 'hosts' }; });
  }
  /** A row valid at t (an entry with 0 s left is expired, as in dns-resolution). */
  function valid(row, t) { return row.expiresAt === null || row.expiresAt > t; }
  function prune(cache, t) { return cache.filter(function (r) { return valid(r, t); }); }
  /** Add or replace a DNS row. */
  function put(cache, name, ip, expiresAt) {
    var out = cache.filter(function (r) { return !(r.name === name && r.from === 'dns'); });
    out.push({ name: name, ip: ip, expiresAt: expiresAt, from: 'dns' });
    return out;
  }

  // ── a lookup ──

  function startLookup(s, sc, k) {
    var lk = sc.lookups[k];
    s.lookup = k + 1;
    s.t = Math.max(s.t, lk.at);
    s.flushed = !!lk.flush;
    if (lk.flush) s.cache = hostsRows(sc.hosts);
    s.cache = prune(s.cache, s.t);
    s.servers = sc.settings.dnsServers.map(function (ip, i) {
      return { ip: ip, role: i === 0 ? 'preferred' : 'alternate', kind: KIND[ip] || 'internal',
        up: lk.up[ip] === undefined ? true : !!lk.up[ip] };
    });
    s.candidates = candidates(sc.typed, sc.settings).map(function (c) { return { fqdn: c.fqdn, src: c.src, result: null }; });
    s.stages = { hosts: 'idle', cache: 'idle', dns: 'idle', llmnr: 'idle', netbios: 'idle' };
    s.queries = [];
    s.answer = null;
    s.next = { phase: 'hosts', cand: 0, srv: 0, waited: 0 };
  }

  /** The stage after DNS: LLMNR, NetBIOS, or the end (rule 6). Marks the ones that will not run as 'skip'. */
  function afterDns(s, sc) {
    var one = singleLabel(sc.typed);
    if (!one || !sc.settings.llmnr) s.stages.llmnr = 'skip';
    if (!one || !sc.settings.netbios) s.stages.netbios = 'skip';
    if (s.stages.llmnr !== 'skip') return { phase: 'llmnr' };
    if (s.stages.netbios !== 'skip') return { phase: 'netbios' };
    return { phase: 'end' };
  }

  /** The next DNS candidate from index i that the cache did not rule out, or the stage after DNS. */
  function nextCandidate(s, sc, i) {
    for (; i < s.candidates.length; i++) if (s.candidates[i].result !== 'neg') return { phase: 'dns', cand: i, srv: 0, waited: 0 };
    if (s.stages.dns === 'idle') s.stages.dns = 'skip';   // every name ruled out by a negative entry: no server asked
    return afterDns(s, sc);
  }

  function finish(s, ip, stage) {
    s.answer = { ip: ip, stage: stage };
    s.next = { phase: 'end' };
  }

  /** One try (one step). */
  function advance(prev, sc) {
    var s = clone(prev);
    var nx = s.next;
    if (nx.phase === 'end') {                                  // lookup over: start the repeat, if any
      s.results.push(s.answer);
      startLookup(s, sc, s.lookup);                            // s.lookup is 1-based: index of the next one
      nx = s.next;
    }
    var name = bare(sc.typed);
    var last = { lookup: s.lookup, stage: nx.phase, fqdn: null, server: null, result: null, ip: null, wait: 0, t: s.t };

    if (nx.phase === 'hosts') {
      // rule 1: the hosts file first; it matches the name as typed or any candidate; the first line wins
      var fq = s.candidates.map(function (c) { return c.fqdn; });
      var hit = sc.hosts.filter(function (h) { var n = h.name.toLowerCase(); return n === name || fq.indexOf(n) >= 0; })[0];
      last.fqdn = name;
      if (hit) { s.stages.hosts = 'ok'; last.result = 'ok'; last.ip = hit.ip; finish(s, hit.ip, 'hosts'); }
      else { s.stages.hosts = 'no'; last.result = 'no'; s.next = { phase: 'cache' }; }
    } else if (nx.phase === 'cache') {
      // rule 2: every candidate, in order; a positive entry answers, a negative one rules that name out for DNS
      s.cache = prune(s.cache, s.t);
      var found = null, negs = 0;
      for (var i = 0; i < s.candidates.length && !found; i++) {
        var c = s.candidates[i];
        var row = s.cache.filter(function (r) { return r.name === c.fqdn && r.from === 'dns'; })[0];
        if (!row) continue;
        if (row.ip) { found = { c: c, row: row }; c.result = 'cache'; }
        else { c.result = 'neg'; negs++; }
      }
      last.fqdn = found ? found.c.fqdn : null;
      if (found) { s.stages.cache = 'ok'; last.result = 'ok'; last.ip = found.row.ip; finish(s, found.row.ip, 'cache'); }
      else {
        s.stages.cache = negs ? 'neg' : 'no';
        last.result = negs ? 'neg' : 'no';
        last.negs = negs;
        s.next = nextCandidate(s, sc, 0);
      }
    } else if (nx.phase === 'dns') {
      // rule 5: one server per try; the alternate only when the preferred did not answer in time; NXDOMAIN is an answer
      var cand = s.candidates[nx.cand];
      var srv = s.servers[nx.srv];
      s.stages.dns = 'trying';
      last.fqdn = cand.fqdn;
      last.server = srv.ip;
      if (srv.up) {
        var zone = sc.zones[srv.ip] || {};
        var ip = Object.prototype.hasOwnProperty.call(zone, cand.fqdn) ? zone[cand.fqdn] : null;
        s.queries.push({ fqdn: cand.fqdn, server: srv.ip, result: ip ? 'ok' : 'nx', ip: ip, wait: 0 });
        if (ip) {
          cand.result = 'ok';
          s.cache = put(s.cache, cand.fqdn, ip, s.t + Math.min(sc.ttl, MAX_CACHE_TTL)); // rule 7
          s.stages.dns = 'ok';
          last.result = 'ok'; last.ip = ip;
          finish(s, ip, 'dns');
        } else {
          cand.result = 'nx';
          s.cache = put(s.cache, cand.fqdn, null, s.t + NEG_TTL);                       // rule 2: negative entry
          last.result = 'nx';
          s.next = nextCandidate(s, sc, nx.cand + 1);
          if (s.next.phase !== 'dns') s.stages.dns = 'no';
        }
      } else {
        var more = nx.srv + 1 < s.servers.length;
        var wait = more ? FIRST_WAIT : GIVE_UP - nx.waited;   // the alternate at 1 s; nobody → give up at 10 s in all
        s.t += wait;
        last.wait = wait;
        last.result = 'timeout';
        s.queries.push({ fqdn: cand.fqdn, server: srv.ip, result: 'timeout', ip: null, wait: wait, gaveUp: !more });
        if (more) s.next = { phase: 'dns', cand: nx.cand, srv: nx.srv + 1, waited: nx.waited + wait };
        else {
          cand.result = 'timeout';                           // not an answer: nothing cached
          s.next = nextCandidate(s, sc, nx.cand + 1);
          if (s.next.phase !== 'dns') s.stages.dns = 'no';
        }
      }
    } else if (nx.phase === 'llmnr' || nx.phase === 'netbios') {
      // rule 6; rule 8: several answers → the first received (segment order) wins. Answers are not cached here.
      var key = nx.phase;
      var answers = sc.segment.filter(function (h) { return h[key] && h.name.toLowerCase() === name; });
      last.fqdn = name;
      last.answers = answers.map(function (h) { return h.ip; });
      if (answers.length) {
        s.stages[key] = 'ok'; last.result = 'ok'; last.ip = answers[0].ip;
        finish(s, answers[0].ip, key);
      } else {
        s.stages[key] = 'no'; last.result = 'no';
        s.next = key === 'llmnr' && sc.settings.netbios ? { phase: 'netbios' } : { phase: 'end' };
        if (key === 'llmnr' && !sc.settings.netbios) s.stages.netbios = 'skip';
      }
    }
    s.last = last;
    s.tries.push(last);
    return s;
  }

  function initialFrom(sc) {
    var s = {
      t: 0, lookup: 0, typed: sc.typed, flushed: false,
      hosts: clone(sc.hosts), cache: hostsRows(sc.hosts), servers: [], candidates: [], stages: {}, queries: [],
      answer: null, results: [], tries: [], last: null, next: null, done: false
    };
    startLookup(s, sc, 0);
    return s;
  }

  /** Is the run over after this state? */
  function over(s, sc) { return s.next.phase === 'end' && s.lookup >= sc.lookups.length; }

  /** Every state of a run, from step 0 to the end (bounded). */
  function runScene(sc) {
    var s = initialFrom(sc), out = [s];
    for (var guard = 0; guard < 200 && !over(s, sc); guard++) { s = advance(s, sc); out.push(s); }
    out[out.length - 1].done = true;
    return out;
  }

  function markDone(s, sc) { if (over(s, sc)) s.done = true; return s; }

  var logic = {
    PC: PC,
    PREFERRED: PREFERRED,
    TYPED: TYPED,
    ALTERNATES: ALTERNATES,
    SEGMENT: SEGMENT,
    NEG_TTL: NEG_TTL,
    MAX_CACHE_TTL: MAX_CACHE_TTL,
    RECORD_TTL: RECORD_TTL,
    GIVE_UP: GIVE_UP,
    REPEAT_AT: REPEAT_AT,

    defaults: { typed: 'fs1', searchList: 'none', alternate: 'none', preferredUp: true, hostsEntry: false, llmnr: true,
      netbios: true, repeat: false, flush: false },

    /** One step per try, until the (last) lookup ends. */
    steps: function (p) { return runScene(scene(p)).length - 1; },

    initial: function (p) { var sc = scene(p); return markDone(initialFrom(sc), sc); },
    step: function (s, n, p) { var sc = scene(p); return markDone(advance(s, sc), sc); },

    // exported for tests and the page
    eff: eff,
    scene: scene,
    suffixes: suffixes,
    candidates: candidates,
    singleLabel: singleLabel,
    run: runScene,
    valid: valid
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
