/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-dns-srv-records: the SRV records DC01 and DC02 publish in quillmoor.example and
   _msdcs.quillmoor.example, groups of them deleted, and PC07 trying to join the domain or log on: the DC locator's
   DNS queries and LDAP pings, the KDC lookup, Kerberos AS or the NTLM fallback; optionally Netlogon restarted on
   DC01 first, which registers DC01's records again. One step = one message or event. Rules and numbers: SPEC.md.
   The domain, DCs and DSA GUIDs are those of sims/win-dc-promotion/sim.js @ f2e6118 (no shared model yet).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DOMAIN = 'quillmoor.example';
  var MSDCS = '_msdcs.' + DOMAIN;
  var NETBIOS = 'QUILLMOOR';
  var PUBLIC = '203.0.113.53';
  var USER = 'ana';
  var DC = {
    DC01: { name: 'DC01', ip: '10.10.0.10', site: 'HQ' },
    DC02: { name: 'DC02', ip: '10.20.0.10', site: 'Branch' }
  };
  var SITE_DC = { HQ: 'DC01', Branch: 'DC02' };
  var SITES = ['HQ', 'Branch'];
  var CLIENT = { name: 'PC07', ip: { HQ: '10.10.20.57', Branch: '10.20.20.57' } };
  /** Invented DSA GUIDs, as in win-dc-promotion. */
  var GUID = { DC01: '3b6f0c2e-8a41-4d7e-9c15-2f7a9e40b1d3', DC02: 'a8d24f61-0c9b-47e2-b3f8-6e15c7d9024a' };
  var PORT = { ldap: 389, kerberos: 88, kpasswd: 464, gc: 3268 };
  /** Which toggle deletes which group (SPEC "Params"). */
  var TOGGLE = { locator: 'locator', siteRecord: 'site', kerberos: 'kerberos', gc: 'gc' };

  var LDAP_DC = '_ldap._tcp.dc._msdcs';
  var KDC_DC = '_kerberos._tcp.dc._msdcs';
  function siteLdap(site) { return '_ldap._tcp.' + site + '._sites.dc._msdcs'; }
  function siteKdc(site) { return '_kerberos._tcp.' + site + '._sites.dc._msdcs'; }
  function fqdn(name) { return name + '.' + DOMAIN; }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /** Rule 3: the site the client knows at the start. A computer being joined is not a member yet and knows none;
      a member that logs on knows the site it learnt before (unless `unknown`). */
  function knownSite(p, subnet) { return p.action === 'logon' && p.site !== 'unknown' ? subnet : null; }

  /** Rule 2: the 14 owner names, in display order: [{ id, name, zone, type, port, use, groups, targets }]. */
  var ROWS = (function () {
    var both = ['DC01', 'DC02'];
    function row(id, name, zone, type, port, use, groups, targets) {
      return { id: id, name: name, zone: zone, type: type, port: port, use: use, groups: groups, targets: targets };
    }
    return [
      row('ldap', '_ldap._tcp', DOMAIN, 'SRV', PORT.ldap, 'locator', ['locator'], both),
      row('ldapDc', LDAP_DC, MSDCS, 'SRV', PORT.ldap, 'locator', ['locator'], both),
      row('ldapHQ', siteLdap('HQ'), MSDCS, 'SRV', PORT.ldap, 'locator', ['site'], ['DC01']),
      row('ldapBranch', siteLdap('Branch'), MSDCS, 'SRV', PORT.ldap, 'locator', ['site'], ['DC02']),
      row('pdc', '_ldap._tcp.pdc._msdcs', MSDCS, 'SRV', PORT.ldap, 'locator', ['locator'], ['DC01']),
      row('krb', '_kerberos._tcp', DOMAIN, 'SRV', PORT.kerberos, 'kerberos', ['kerberos'], both),
      row('krbDc', KDC_DC, MSDCS, 'SRV', PORT.kerberos, 'kerberos', ['kerberos'], both),
      row('krbHQ', siteKdc('HQ'), MSDCS, 'SRV', PORT.kerberos, 'kerberos', ['kerberos', 'site'], ['DC01']),
      row('krbBranch', siteKdc('Branch'), MSDCS, 'SRV', PORT.kerberos, 'kerberos', ['kerberos', 'site'], ['DC02']),
      row('kpasswd', '_kpasswd._tcp', DOMAIN, 'SRV', PORT.kpasswd, 'kerberos', ['kerberos'], both),
      row('gc', '_gc._tcp', DOMAIN, 'SRV', PORT.gc, 'gc', ['gc'], both),
      row('gcMsdcs', '_ldap._tcp.gc._msdcs', MSDCS, 'SRV', PORT.gc, 'gc', ['gc'], both),
      row('guid1', GUID.DC01 + '._msdcs', MSDCS, 'CNAME', null, 'replication', [], ['DC01']),
      row('guid2', GUID.DC02 + '._msdcs', MSDCS, 'CNAME', null, 'replication', [], ['DC02'])
    ];
  })();
  var USES = ['locator', 'kerberos', 'gc', 'replication'];

  /** The groups the params delete. */
  function deletedGroups(p) {
    return Object.keys(TOGGLE).filter(function (k) { return !!p[k]; }).map(function (k) { return TOGGLE[k]; });
  }

  /** The 21 records at step 0: one per (row, target), present unless one of its groups is deleted. */
  function initialRecords(p) {
    var del = deletedGroups(p);
    var out = [];
    ROWS.forEach(function (r) {
      r.targets.forEach(function (dc) {
        out.push({
          key: r.id + '|' + dc, row: r.id, name: r.name, zone: r.zone, type: r.type, target: dc,
          prio: r.type === 'SRV' ? 0 : null, weight: r.type === 'SRV' ? 100 : null, port: r.port,
          present: !r.groups.some(function (g) { return del.indexOf(g) >= 0; })
        });
      });
    });
    return out;
  }

  /** Rule 8: lowest priority, then highest weight, then the first listed. Returns the index or -1. */
  function pick(targets) {
    var best = -1;
    for (var i = 0; i < targets.length; i++) {
      var t = targets[i], b = targets[best];
      if (best < 0 || t.prio < b.prio || (t.prio === b.prio && t.weight > b.weight)) best = i;
    }
    return best;
  }

  /** What the client's DNS server answers for an owner name (relative to the domain). Rule 7: the public
      resolver holds no quillmoor.example. */
  function resolve(records, dns, name) {
    if (dns === PUBLIC) return { rcode: 'NXDOMAIN', targets: [] };
    var hit = records.filter(function (r) { return r.name === name && r.present; });
    if (!hit.length) return { rcode: 'NXDOMAIN', targets: [] };
    return { rcode: 'NOERROR', targets: hit.map(function (r) { return { dc: r.target, prio: r.prio, weight: r.weight, port: r.port }; }) };
  }

  /** The whole run for these params, as events (one per step) and the result. Pure; the steps replay it. */
  function plan(p) {
    var records = initialRecords(p);
    var subnet = p.site === 'hq' ? 'HQ' : 'Branch';
    var client = { name: CLIENT.name, ip: CLIENT.ip[subnet], subnet: subnet, site: knownSite(p, subnet),
      dns: p.dns === 'public' ? PUBLIC : DC.DC01.ip };
    var ev = [];

    // rule 1: Netlogon on DC01 registers its records again; DC02's stay as they are
    if (p.restartNetlogon) {
      var back = records.filter(function (r) { return r.target === 'DC01' && !r.present; }).map(function (r) { return r.key; });
      var mine = records.filter(function (r) { return r.target === 'DC01'; }).length;
      ev.push({ kind: 'restart', dc: 'DC01' });
      ev.push({ kind: 'update', from: 'DC01', count: mine });
      ev.push({ kind: 'updateOk', to: 'DC01', added: back.length, restore: back });
      records.forEach(function (r) { if (back.indexOf(r.key) >= 0) r.present = true; });
    }

    function query(purpose, scope, site, name) {
      var a = resolve(records, client.dns, name);
      var i = pick(a.targets);
      ev.push({ kind: 'query', purpose: purpose, scope: scope, site: site, name: name, server: client.dns });
      ev.push({ kind: 'answer', purpose: purpose, scope: scope, site: site, name: name, server: client.dns, rcode: a.rcode,
        targets: a.targets, pick: i < 0 ? null : a.targets[i].dc });
      return i < 0 ? null : a.targets[i].dc;
    }
    function ping(dc) {
      ev.push({ kind: 'ping', to: dc });
      ev.push({ kind: 'pong', from: dc, site: client.subnet, closest: DC[dc].site === client.subnet, learnt: client.site === null });
      if (client.site === null) client.site = client.subnet;
    }
    function finish(res) {
      res.action = p.action;
      ev[ev.length - 1].result = res;
      return { events: ev, result: res };
    }

    // rule 3, 4: the DC locator
    var dc = null, askedSite = false;
    if (client.site) { askedSite = true; dc = query('ldap', 'site', client.site, siteLdap(client.site)); }
    if (!dc) {
      dc = query('ldap', 'domain', null, LDAP_DC);
      if (!dc) return finish({ ok: false, code: 'noDc' }); // rule 5, T5
    }
    var unknownBefore = client.site === null;
    ping(dc);
    // rule 3: a client that just learnt its site, from a DC not in it, asks that site's record (T3)
    if (unknownBefore && !askedSite && DC[dc].site !== client.site) {
      var near = query('ldap', 'site', client.site, siteLdap(client.site));
      if (near) { dc = near; ping(dc); }
    }

    // rule 6: the KDC, site first, then domain-wide; NTLM with the located DC when none is found
    var kdc = query('kdc', 'site', client.site, siteKdc(client.site));
    if (!kdc) kdc = query('kdc', 'domain', null, KDC_DC);
    var wan = DC[dc].site !== client.subnet || (!!kdc && DC[kdc].site !== client.subnet);
    if (kdc) {
      ev.push({ kind: 'asReq', to: kdc, user: USER });
      ev.push({ kind: 'asRep', from: kdc, user: USER });
      return finish({ ok: true, how: 'kerberos', dc: dc, kdc: kdc, wan: wan });
    }
    ev.push({ kind: 'ntlm', to: dc, user: USER });
    ev.push({ kind: 'ntlmOk', from: dc, user: USER });
    return finish({ ok: true, how: 'ntlm', dc: dc, kdc: null, wan: wan });
  }

  /** Apply one event to the state (the client's knowledge, the records, the result). */
  function apply(s, e, n) {
    var x = clone(e);
    delete x.restore;
    x.n = n;
    s.log.push(x);
    s.focus = null;
    switch (e.kind) {
      case 'restart': s.restarted = true; break;
      case 'updateOk':
        s.records.forEach(function (r) { if (e.restore.indexOf(r.key) >= 0) r.present = true; });
        s.restored = e.restore.slice();
        break;
      case 'query': s.focus = e.name; break;
      case 'answer':
        s.focus = e.name;
        if (e.pick && e.purpose === 'ldap') s.client.dc = e.pick;
        if (e.pick && e.purpose === 'kdc') s.client.kdc = e.pick;
        break;
      case 'pong': s.client.site = e.site; break;
    }
    if (e.result) s.result = clone(e.result);
  }

  var logic = {
    defaults: { action: 'join', site: 'hq', dns: 'dc01', locator: false, siteRecord: false, kerberos: false, gc: false, restartNetlogon: false },

    DOMAIN: DOMAIN, MSDCS: MSDCS, NETBIOS: NETBIOS, PUBLIC: PUBLIC, USER: USER, DC: DC, SITE_DC: SITE_DC, SITES: SITES,
    CLIENT: CLIENT, GUID: GUID, PORT: PORT, ROWS: ROWS, USES: USES, TOGGLE: TOGGLE, LDAP_DC: LDAP_DC, KDC_DC: KDC_DC,

    /** Steps for these params (SPEC "Steps"): healthy-join 8, no-locator 2, no-site-record 12, public-dns 2,
        netlogon-fix 11, no-kerberos 10; at most 17. */
    steps: function (p) { return plan(p).events.length; },

    /** State at step 0: the records after the deletions, the client before it asks anything. */
    initial: function (p) {
      var subnet = p.site === 'hq' ? 'HQ' : 'Branch';
      return {
        records: initialRecords(p),
        client: { name: CLIENT.name, ip: CLIENT.ip[subnet], subnet: subnet, site: knownSite(p, subnet),
          dns: p.dns === 'public' ? PUBLIC : DC.DC01.ip, dc: null, kdc: null },
        log: [],
        focus: null,
        restarted: false,
        restored: [],
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
    resolve: resolve,
    initialRecords: initialRecords,
    knownSite: knownSite,
    siteLdap: siteLdap,
    siteKdc: siteKdc,
    fqdn: fqdn,
    /** Records of one row, in target order. */
    rowRecords: function (s, rowId) { return s.records.filter(function (r) { return r.row === rowId; }); },
    /** Rows of one use (display group). */
    rowsOf: function (use) { return ROWS.filter(function (r) { return r.use === use; }); }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
