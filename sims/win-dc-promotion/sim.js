/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-dc-promotion: DC01 becomes the first domain controller of the forest quillmoor.example, or DC02
   becomes a second one. One step = one promotion phase on one server: the role's binaries, the forest, the database,
   DNS, SYSVOL, the restart (FSMO roles, GC, connection objects), Netlogon's records; for DC02 the DNS lookup that
   finds the domain, and the replication from DC01. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DOMAIN = 'quillmoor.example';
  var MSDCS = '_msdcs.' + DOMAIN;
  var NETBIOS = 'QUILLMOOR';
  var LEVEL = '2016';
  var SITE = 'Default-First-Site-Name';
  var PUBLIC = '203.0.113.53';
  var LOOPBACK = '127.0.0.1';
  var IP = { DC01: '10.10.0.10', DC02: '10.10.0.11' };
  /** Invented DSA GUIDs (SPEC rule 4). */
  var GUID = { DC01: '3b6f0c2e-8a41-4d7e-9c15-2f7a9e40b1d3', DC02: 'a8d24f61-0c9b-47e2-b3f8-6e15c7d9024a' };
  var PARTITIONS = ['schema', 'config', 'domain', 'domainDns', 'forestDns'];
  var FSMO = ['schema', 'naming', 'rid', 'pdc', 'infrastructure'];
  /** The two default GPOs (well-known GUIDs), rule 5. */
  var GPOS = [
    { id: '{31B2F340-016D-11D2-945F-00C04FB984F9}', name: 'Default Domain Policy' },
    { id: '{6AC1786C-016F-11D2-945F-00C04FB984F9}', name: 'Default Domain Controllers Policy' }
  ];
  /** Which partition each zone is stored in (rule 3). */
  var ZONE_STORE = {};
  ZONE_STORE[DOMAIN] = 'domainDns';
  ZONE_STORE[MSDCS] = 'forestDns';
  var ZONES = [DOMAIN, MSDCS];
  var LOCATOR = '_ldap._tcp.dc.' + MSDCS;

  /** Phases of each run (SPEC "Steps"); 'dns' only when DC01 installs DNS. */
  var DC01_PHASES = ['role', 'forest', 'database', 'dns', 'sysvol', 'reboot', 'register'];
  var DC02_PHASES = ['role', 'locate', 'replicate', 'reboot', 'sysvol', 'register'];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function host(dc) { return dc.toLowerCase() + '.' + DOMAIN + '.'; }

  function srv(zone, name, port, dc) {
    return { zone: zone, name: name, type: 'SRV', dc: dc, port: port, data: '0 100 ' + port + ' ' + host(dc) };
  }

  /** Rule 4 (and 9): the records a DC registers; the PDC record only for the PDC emulator, _gc only for a GC. */
  function dcRecords(dc, opts) {
    var out = [
      { zone: DOMAIN, name: '@', type: 'A', dc: dc, data: IP[dc] },
      { zone: DOMAIN, name: dc.toLowerCase(), type: 'A', dc: dc, data: IP[dc] },
      srv(DOMAIN, '_ldap._tcp', 389, dc),
      srv(DOMAIN, '_kerberos._tcp', 88, dc),
      srv(DOMAIN, '_kpasswd._tcp', 464, dc),
      srv(DOMAIN, '_ldap._tcp.' + SITE + '._sites', 389, dc),
      srv(MSDCS, '_ldap._tcp.dc', 389, dc),
      { zone: MSDCS, name: GUID[dc], type: 'CNAME', dc: dc, data: host(dc) }
    ];
    if (opts.gc) out.push(srv(DOMAIN, '_gc._tcp', 3268, dc));
    if (opts.pdc) out.push(srv(MSDCS, '_ldap._tcp.pdc', 389, dc));
    return out;
  }

  function recKey(r) { return r.zone + '|' + r.name + '|' + r.type + '|' + r.dc; }
  function byRecord(a, b) {
    var x = [a.name, a.type, a.dc], y = [b.name, b.type, b.dc];
    for (var i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
    return 0;
  }

  /** Add records to a server's zones, once each (T8), kept sorted. Records for a zone it lacks are not added. */
  function addRecords(server, recs) {
    recs.forEach(function (r) {
      var z = server.zones[r.zone];
      if (!z) return;
      if (z.some(function (x) { return recKey(x) === recKey(r); })) return;
      z.push(r);
    });
    Object.keys(server.zones).forEach(function (k) { server.zones[k].sort(byRecord); });
  }

  /** The DNS server a DC's DNS client asks: a server name (it runs DNS) or null (none in the scene answers). */
  function dnsServerAt(s, ip) {
    if (ip === LOOPBACK) return null; // resolved by the caller against the asking server
    var names = Object.keys(s.servers);
    for (var i = 0; i < names.length; i++) if (s.servers[names[i]].ip === ip && s.servers[names[i]].dnsServer) return names[i];
    return null;
  }
  function serverAsked(s, from) {
    var c = s.servers[from].dnsClient;
    if (c === LOOPBACK) return s.servers[from].dnsServer ? from : null;
    return dnsServerAt(s, c);
  }

  /** Rule 7: what DC02 learns when it looks up the locator record. */
  function locate(s, from) {
    var client = s.servers[from].dnsClient;
    var q = { from: from, server: client, name: LOCATOR, answer: null, target: null };
    if (client === PUBLIC) { q.answer = 'nxdomain'; return q; }
    var at = serverAsked(s, from);
    if (!at) { q.answer = 'noServer'; return q; }
    var z = s.servers[at].zones[MSDCS] || [];
    var hit = z.filter(function (r) { return r.name === '_ldap._tcp.dc' && r.type === 'SRV'; });
    if (!hit.length) { q.answer = 'nxdomain'; return q; }
    q.answer = 'found';
    q.target = hit[0].dc;
    return q;
  }

  function server(name, dnsClient) {
    return {
      ip: IP[name], role: 'server', partitions: [], zones: {}, dnsServer: false, sysvol: [], shares: [], dfsr: false,
      fsmo: [], gc: false, dsrm: false, dnsClient: dnsClient, failed: []
    };
  }

  function phases(p) {
    if (p.server === 'dc02') return DC02_PHASES;
    return DC01_PHASES.filter(function (x) { return x !== 'dns' || p.dns; });
  }

  /** One DC01 phase (rules 1–6, 4). */
  function stepDc01(s, phase, p) {
    var d = s.servers.DC01;
    switch (phase) {
      case 'role': d.role = 'binaries'; break;
      case 'forest':
        d.role = 'promoting';
        s.domain = { name: DOMAIN, netbios: NETBIOS, level: LEVEL };
        d.dsrm = true;
        break;
      case 'database': d.partitions = ['schema', 'config', 'domain']; break;
      case 'dns':
        d.dnsServer = true;
        d.partitions = d.partitions.concat(['domainDns', 'forestDns']);
        ZONES.forEach(function (z) { d.zones[z] = []; });
        d.dnsClient = LOOPBACK;
        break;
      case 'sysvol':
        d.shares = ['SYSVOL', 'NETLOGON'];
        d.sysvol = GPOS.map(function (g) { return g.id; });
        d.dfsr = true;
        break;
      case 'reboot':
        d.role = 'dc';
        d.fsmo = FSMO.slice();
        d.gc = true;
        break;
      case 'register': register(s, 'DC01'); break;
    }
  }

  /** Rule 4: the DC's records go to the DNS server its client asks; with no zone there, each one fails. */
  function register(s, name) {
    var d = s.servers[name];
    var recs = dcRecords(name, { gc: d.gc, pdc: d.fsmo.indexOf('pdc') >= 0 });
    var at = serverAsked(s, name);
    var ok = at ? recs.filter(function (r) { return !!s.servers[at].zones[r.zone]; }) : [];
    var bad = recs.filter(function (r) { return ok.indexOf(r) < 0; });
    // AD-integrated zones: the change replicates to every DNS server holding the zone (rule 9)
    Object.keys(s.servers).forEach(function (k) { if (s.servers[k].dnsServer) addRecords(s.servers[k], ok); });
    d.failed = bad;
    s.registered = ok.length;
    s.result = bad.length ? 'unregistered' : 'ok';
  }

  /** One DC02 phase (rules 7–9); the run stops after a failed lookup. SYSVOL's initial sync runs after the restart,
      and the DC advertises itself (registers) only once SYSVOL is shared. */
  function stepDc02(s, phase, p) {
    var d = s.servers.DC02, src = s.servers.DC01;
    switch (phase) {
      case 'role': d.role = 'binaries'; break;
      case 'locate':
        s.query = locate(s, 'DC02');
        if (s.query.answer !== 'found') { s.phase = 'stop'; return; }
        d.role = 'promoting';
        d.dsrm = true;
        break;
      case 'stop': s.result = 'stopped'; break;
      case 'replicate':
        d.partitions = PARTITIONS.filter(function (x) { return src.partitions.indexOf(x) >= 0; });
        s.flows = [{ from: 'DC01', to: 'DC02', kind: 'initial' }];
        break;
      case 'sysvol':
        d.shares = ['SYSVOL', 'NETLOGON'];
        d.sysvol = src.sysvol.slice();
        d.dfsr = true;
        s.flows = [{ from: 'DC01', to: 'DC02', kind: 'sysvol' }];
        break;
      case 'reboot':
        d.role = 'dc';
        d.gc = !!p.gc2;
        // rule 9: a DNS server by default when the domain's DCs run DNS; its zones come with the DNS partitions
        if (src.dnsServer) {
          d.dnsServer = true;
          ZONES.forEach(function (z) { if (src.zones[z]) d.zones[z] = clone(src.zones[z]); });
        }
        s.connections = [{ from: 'DC01', to: 'DC02' }, { from: 'DC02', to: 'DC01' }];
        break;
      case 'register': register(s, 'DC02'); break;
    }
  }

  /** DC01 as the DC01 run (same dns) leaves it, for the second-DC run. */
  function dc01Done(p) {
    var q = { server: 'dc01', dns: p.dns, dc2Dns: p.dc2Dns, gc2: p.gc2 };
    var s = logic.initial(q);
    var ph = phases(q);
    for (var n = 1; n <= ph.length; n++) s = logic.step(s, n, q);
    return s;
  }

  var logic = {
    defaults: { server: 'dc01', dns: true, dc2Dns: 'dc01', gc2: true },

    DOMAIN: DOMAIN, MSDCS: MSDCS, NETBIOS: NETBIOS, LEVEL: LEVEL, SITE: SITE, PUBLIC: PUBLIC, LOOPBACK: LOOPBACK,
    IP: IP, GUID: GUID, PARTITIONS: PARTITIONS, FSMO: FSMO, GPOS: GPOS, ZONE_STORE: ZONE_STORE, ZONES: ZONES,
    LOCATOR: LOCATOR,

    /** Steps for these params: until the run ends (first-dc 7, no-dns-role 6, second-dc 6, wrong-dns 3). */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (s.phase !== 'done' && n < 30) { n++; s = logic.step(s, n, p); }
      return n;
    },

    /** State at step 0: both servers plain (DC01 done for the second-DC run), nothing promoted yet. */
    initial: function (p) {
      var dc2Client = p.dc2Dns === 'public' ? PUBLIC : IP.DC01;
      if (p.server === 'dc02') {
        var s = dc01Done(p);
        s.servers.DC02 = server('DC02', dc2Client);
        s.flows = []; s.query = null; s.log = []; s.result = null; s.registered = 0;
        s.phase = phases(p)[0];
        return s;
      }
      return {
        servers: { DC01: server('DC01', PUBLIC), DC02: server('DC02', dc2Client) },
        domain: null,
        connections: [],
        flows: [],
        query: null,
        registered: 0,
        log: [],
        phase: phases(p)[0],
        result: null
      };
    },

    /** State after step n: the next phase of the run. */
    step: function (s0, n, p) {
      if (s0.phase === 'done') return s0;
      var s = clone(s0);
      var phase = s.phase;
      s.flows = [];
      if (p.server === 'dc02') stepDc02(s, phase, p);
      else stepDc01(s, phase, p);
      s.log.push(phase);
      if (phase === 'stop' || phase === 'register') s.phase = 'done';
      else if (s.phase === phase) {
        var ph = phases(p);
        s.phase = ph[ph.indexOf(phase) + 1] || 'done';
      }
      return s;
    },

    // exported for the page and the tests
    dcRecords: dcRecords,
    locate: locate,
    phases: phases,
    /** Records of a zone grouped by owner name and type: [{ name, type, recs: [rec] }], in zone order. */
    groups: function (recs) {
      var out = [];
      recs.forEach(function (r) {
        var g = out.filter(function (x) { return x.name === r.name && x.type === r.type; })[0];
        if (!g) { g = { name: r.name, type: r.type, recs: [] }; out.push(g); }
        g.recs.push(r);
      });
      return out;
    },
    recordCount: function (srv) {
      return Object.keys(srv.zones).reduce(function (a, k) { return a + srv.zones[k].length; }, 0);
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
