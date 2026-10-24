/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-domain-logon: PC07 in HQ, at the branch or offline, and a user logging on to quillmoor.example:
   the DC locator (DNS SRV query, LDAP ping, the site from the ping), Kerberos AS with the DC found (RODC01 forwarding
   to DC01 when it lacks the password), then the cached verifier stored, or, when no DC can authenticate, a cached
   logon or none. One step = one message or event. Rules and numbers: SPEC.md.
   Record names and pick() are those of sims/win-dns-srv-records/sim.js @ 158f032 (no shared model yet).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DOMAIN = 'quillmoor.example';
  var NETBIOS = 'QUILLMOOR';
  var DC = {
    DC01: { name: 'DC01', ip: '10.10.0.10', site: 'HQ', rodc: false },
    RODC01: { name: 'RODC01', ip: '10.20.0.10', site: 'Branch', rodc: true }
  };
  var SITES = { HQ: { subnet: '10.10.0.0/16', dc: 'DC01' }, Branch: { subnet: '10.20.0.0/16', dc: 'RODC01' } };
  var PC = { name: 'PC07', ip: { hq: '10.10.20.57', branch: '10.20.20.57', offline: null } };
  var LOCATION_SITE = { hq: 'HQ', branch: 'Branch', offline: null };
  /** Rule 5: Interactive logon: Number of previous logons to cache, default 10. */
  var CACHE_MAX = 10;

  var LDAP_DC = '_ldap._tcp.dc._msdcs';
  function siteLdap(site) { return '_ldap._tcp.' + site + '._sites.dc._msdcs'; }
  function fqdn(name) { return name + '.' + DOMAIN; }

  /** SPEC "Records": an RODC registers only its own site's records, so the domain-wide one names DC01 alone. */
  var RECORDS = {};
  RECORDS[LDAP_DC] = ['DC01'];
  RECORDS[siteLdap('HQ')] = ['DC01'];
  RECORDS[siteLdap('Branch')] = ['RODC01'];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // from sims/win-dns-srv-records/sim.js @ 158f032
  /** Rule 1: lowest priority, then highest weight, then the first listed. Returns the index or -1. */
  function pick(targets) {
    var best = -1;
    for (var i = 0; i < targets.length; i++) {
      var t = targets[i], b = targets[best];
      if (best < 0 || t.prio < b.prio || (t.prio === b.prio && t.weight > b.weight)) best = i;
    }
    return best;
  }

  /** T1: the targets in the order the client pings them (repeated pick). */
  function order(targets) {
    var rest = targets.slice(), out = [];
    while (rest.length) out.push(rest.splice(pick(rest), 1)[0]);
    return out;
  }

  /** The answer for an owner name: SRV targets, priority 0, weight 100, port 389. */
  function answer(name) {
    return (RECORDS[name] || []).map(function (dc) { return { dc: dc, prio: 0, weight: 100, port: 389 }; });
  }

  /** SPEC "Reachability": both ends on the network and, across sites, the tunnel up. */
  function where(p, who) { return who === 'PC' ? LOCATION_SITE[p.location] : DC[who].site; }
  function reaches(p, a, b) {
    var sa = where(p, a), sb = where(p, b);
    if (!sa || !sb) return false;
    return sa === sb || !!p.wan;
  }
  function crosses(p, a, b) {
    var sa = where(p, a), sb = where(p, b);
    return !!sa && !!sb && sa !== sb;
  }

  /** Rule 2: the site the DC's reply names, from the client's address and the subnet objects (rule 3: none). */
  function siteOf(p) { return p.subnets ? LOCATION_SITE[p.location] : null; }

  /** Rule 5: the cache after a successful logon of user, least recently used first: stored or refreshed (moved to
      the end); past the maximum the least recently used goes. */
  function store(cache, user, max) {
    var out = cache.filter(function (u) { return u !== user; });
    out.push(user);
    while (out.length > (max || CACHE_MAX)) out.shift();
    return out;
  }

  function startCache(p) { return p.cachedOnPc ? ['ana'] : []; }
  function startSite(p) { return p.lastSite === 'none' ? null : p.lastSite; }
  function dnsServer(p) { var s = LOCATION_SITE[p.location]; return s ? SITES[s].dc : null; }

  /** The whole run for these params, as events (one per step) and the result. Pure; the steps replay it. */
  function plan(p) {
    var ev = [];
    var dns = dnsServer(p);
    var tried = [], asked = [];
    var site = startSite(p);

    // rule 1, 2, 2a: one DNS lookup, then ping its targets in order until one answers (T3: none twice)
    function lookup(scope, s) {
      var name = scope === 'site' ? siteLdap(s) : LDAP_DC;
      if (scope === 'site') asked.push(s);
      if (!dns) { ev.push({ kind: 'query', scope: scope, site: s || null, name: name, server: null, lost: true }); return null; } // T5
      var targets = order(answer(name));
      ev.push({ kind: 'query', scope: scope, site: s || null, name: name, server: dns, lost: false });
      ev.push({ kind: 'answer', scope: scope, site: s || null, name: name, server: dns, targets: targets.map(function (x) { return x.dc; }) });
      for (var i = 0; i < targets.length; i++) {
        var dc = targets[i].dc;
        if (tried.indexOf(dc) >= 0) continue;
        tried.push(dc);
        var ok = reaches(p, 'PC', dc);
        ev.push({ kind: 'ping', to: dc, lost: !ok, wan: crosses(p, 'PC', dc) });
        if (ok) {
          var real = siteOf(p);
          ev.push({ kind: 'pong', from: dc, site: real, closest: real === DC[dc].site, wan: crosses(p, 'PC', dc) });
          site = real; // rule 2: stored for next time; rule 3: no site, the remembered one is forgotten
          return dc;
        }
      }
      return null;
    }

    var dc = null;
    if (site) dc = lookup('site', site); // T2
    if (!dc) dc = lookup('domain', null); // rule 1, 2a
    if (dc && site && site !== DC[dc].site && asked.indexOf(site) < 0) { // rule 2, T4
      var near = lookup('site', site);
      if (near) dc = near;
    }

    var res = null, user = p.user;
    if (dc) {
      // rule 4, 7: Kerberos AS with the DC found
      ev.push({ kind: 'asReq', from: 'PC', to: dc, user: user, wan: crosses(p, 'PC', dc) });
      if (!DC[dc].rodc || p.rodcHasPwd) { // T7
        ev.push({ kind: 'asRep', from: dc, to: 'PC', user: user, wan: crosses(p, 'PC', dc) });
        res = { ok: true, how: 'kerberos', dc: dc, wan: crosses(p, 'PC', dc), forwarded: false };
      } else if (reaches(p, dc, 'DC01')) {
        ev.push({ kind: 'asReq', from: dc, to: 'DC01', user: user, fwd: true, wan: true });
        ev.push({ kind: 'asRep', from: 'DC01', to: dc, user: user, fwd: true, wan: true });
        ev.push({ kind: 'asRep', from: dc, to: 'PC', user: user, wan: crosses(p, dc, 'PC') });
        res = { ok: true, how: 'kerberos', dc: dc, wan: crosses(p, 'PC', dc), forwarded: true };
      } else {
        ev.push({ kind: 'asReq', from: dc, to: 'DC01', user: user, fwd: true, lost: true, wan: true });
        ev.push({ kind: 'krbError', from: dc, to: 'PC', user: user });
      }
    }

    var cache = startCache(p);
    if (res) {
      var after = store(cache, user);
      ev.push({ kind: 'cacheStore', user: user, added: after.length > cache.length, count: after.length }); // rule 5
    } else if (cache.indexOf(user) >= 0) {
      res = { ok: true, how: 'cached', dc: null, reason: dc ? 'rodc' : 'noDc' }; // rule 6, T6
      ev.push({ kind: 'cachedLogon', user: user, count: cache.length });
    } else {
      res = { ok: false, how: null, dc: null, reason: dc ? 'rodc' : 'noDc' };
      ev.push({ kind: 'noLogon', user: user, count: cache.length });
    }
    res.user = user;
    res.site = site;
    ev[ev.length - 1].result = res;
    return { events: ev, result: res };
  }

  /** Apply one event to the state. */
  function apply(s, e, n) {
    var x = clone(e);
    delete x.result;
    x.n = n;
    s.log.push(x);
    switch (e.kind) {
      case 'query': case 'answer': case 'ping': s.phase = 'locate'; break;
      case 'pong': s.dcChosen = e.from; s.pc.site = e.site; break;
      case 'asReq': case 'asRep': case 'krbError': s.phase = 'logon'; break;
      case 'cacheStore': s.pc.cache = store(s.pc.cache, e.user); s.phase = 'done'; break;
      case 'cachedLogon': case 'noLogon': s.dcChosen = null; s.phase = 'done'; break;
    }
    if (e.result) s.result = clone(e.result);
  }

  var logic = {
    defaults: { location: 'hq', lastSite: 'HQ', user: 'ana', subnets: true, wan: true, cachedOnPc: false, rodcHasPwd: false },

    DOMAIN: DOMAIN, NETBIOS: NETBIOS, DC: DC, SITES: SITES, PC: PC, LOCATION_SITE: LOCATION_SITE, CACHE_MAX: CACHE_MAX,
    LDAP_DC: LDAP_DC, RECORDS: RECORDS,

    /** Steps for these params (SPEC "Steps"): hq 7, branch-first 13, branch-wan-down 8, offline-new-user 3,
        no-subnets 7; 2 to 13. */
    steps: function (p) { return plan(p).events.length; },

    /** State at step 0: PC07 where it is, the site it remembers, its cache; nothing asked yet. */
    initial: function (p) {
      return {
        pc: { ip: PC.ip[p.location], location: p.location, site: startSite(p), dns: dnsServer(p), cache: startCache(p) },
        wanUp: !!p.wan,
        rodcCached: p.rodcHasPwd ? [p.user, PC.name] : [], // rule 7: the user's and PC07's passwords
        dcChosen: null,
        phase: 'start',
        log: [],
        result: null
      };
    },

    /** State after step n: the n-th event of the run applied. */
    step: function (s0, n, p) {
      var ev = plan(p).events;
      if (n < 1 || n > ev.length) return s0;
      var s = clone(s0);
      apply(s, ev[n - 1], n);
      return s;
    },

    // exported for the page and the tests
    plan: plan,
    pick: pick,
    order: order,
    answer: answer,
    reaches: reaches,
    crosses: crosses,
    siteOf: siteOf,
    store: store,
    siteLdap: siteLdap,
    fqdn: fqdn
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
