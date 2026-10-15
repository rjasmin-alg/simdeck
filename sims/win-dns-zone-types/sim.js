/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-dns-zone-types: a small forest (corp.example and its child branch.corp.example), six servers and four
   zones. The student defines one zone (type, replication scope, the server it is created on) and the model derives
   which server holds which zone: writable, read-only, stub, stored but not served, a refused transfer, or nothing.
   Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. place() and holdingsOf() take any servers and
   zone definitions, so the tests can feed combinations the params cannot build.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var FOREST = 'corp.example';
  var PARTNER_MASTER = '10.20.0.53';               // the partner's primary server, outside the forest (task preset 5)
  /** An application directory partition for the custom scope, with the DCs enlisted in it (chosen here, SPEC §1). */
  var CUSTOM = { name: 'CustomDnsZones.corp.example', members: ['DC1', 'DC4'] };

  var TYPES = ['primary', 'secondary', 'stub', 'adPrimary', 'adStub'];
  var SCOPES = ['forest', 'domain', 'allDCsDomain', 'custom'];
  var ZONES = ['corp.example', 'branch.corp.example', 'partner.example', '_msdcs.corp.example'];
  /** The zones the student can define; _msdcs.corp.example is fixed (forest scope) and shown for comparison. */
  var CHOICES = ['corp.example', 'branch.corp.example', 'partner.example'];
  /** The servers a zone can be created on (DC2 behaves as DC1). */
  var HOSTS = ['DC1', 'DC3', 'RODC1', 'DC4', 'MS1'];

  /** Zone contents: serial, name servers with their addresses (the stub's NS and glue), and the size of a full copy. */
  var DATA = {
    'corp.example': { serial: 128, records: 14, ns: [['dc1.corp.example', '10.0.0.11'], ['dc2.corp.example', '10.0.0.12']], www: '10.0.0.80' },
    'branch.corp.example': { serial: 45, records: 6, ns: [['dc4.branch.corp.example', '10.1.0.14']], www: '10.1.0.80' },
    'partner.example': { serial: 2026101401, records: 9, ns: [['ns1.partner.example', '10.20.0.53'], ['ns2.partner.example', '10.20.0.54']], www: '10.20.0.80' },
    '_msdcs.corp.example': { serial: 77, records: 11, ns: [['dc1.corp.example', '10.0.0.11'], ['dc2.corp.example', '10.0.0.12']], www: null }
  };

  /** The forest's servers (task "Scene"); DC3 has the DNS role only when dc3Dns is on. */
  function serversOf(p) {
    return [
      { id: 'DC1', domain: 'corp.example', isDC: true, isRODC: false, dnsRole: true },
      { id: 'DC2', domain: 'corp.example', isDC: true, isRODC: false, dnsRole: true },
      { id: 'DC3', domain: 'corp.example', isDC: true, isRODC: false, dnsRole: !!p.dc3Dns },
      { id: 'RODC1', domain: 'corp.example', isDC: true, isRODC: true, dnsRole: true },
      { id: 'DC4', domain: 'branch.corp.example', isDC: true, isRODC: false, dnsRole: true },
      { id: 'MS1', domain: 'corp.example', isDC: false, isRODC: false, dnsRole: true }
    ];
  }

  /** The forest before the student defines anything: what DC promotion leaves (SPEC §1). partner.example is held by
      nobody. Each definition: { name, type, scope, host, master }. */
  function baseline() {
    return [
      { name: 'corp.example', type: 'adPrimary', scope: 'domain', host: 'DC1', master: null },
      { name: 'branch.corp.example', type: 'adPrimary', scope: 'domain', host: 'DC4', master: null },
      { name: '_msdcs.corp.example', type: 'adPrimary', scope: 'forest', host: 'DC1', master: null, fixed: true }
    ];
  }

  function isAD(type) { return type === 'adPrimary' || type === 'adStub'; }
  function isPrimary(type) { return type === 'primary' || type === 'adPrimary'; }
  function byId(servers, id) { for (var i = 0; i < servers.length; i++) if (servers[i].id === id) return servers[i]; return null; }
  /** A master outside the forest (an address, not a server of ours). */
  function external(master) { return !!master && /^\d+\.\d+\.\d+\.\d+$/.test(master); }

  /** Rule 5: the DCs whose directory gets the zone's data for this scope, created on host. */
  function scopeMembers(servers, scope, host) {
    return servers.filter(function (s) {
      if (!s.isDC) return false;
      if (scope === 'forest') return s.dnsRole;                                     // ForestDnsZones
      if (scope === 'domain') return s.dnsRole && s.domain === host.domain;         // DomainDnsZones of host's domain
      if (scope === 'allDCsDomain') return s.domain === host.domain;                // the domain partition itself
      if (scope === 'custom') return CUSTOM.members.indexOf(s.id) >= 0;             // enlisted in the custom partition
      return false;
    });
  }
  /** The directory partition a scope stores the zone in (the page shows its name). */
  function partitionOf(scope, host) {
    if (scope === 'forest') return 'ForestDnsZones.' + FOREST;
    if (scope === 'domain') return 'DomainDnsZones.' + host.domain;
    if (scope === 'allDCsDomain') return host.domain;
    if (scope === 'custom') return CUSTOM.name;
    return null;
  }

  /**
   * Rules 1–6: where one zone definition puts the zone, before conflicts with other definitions.
   * opts: { allowXfr } (the forest's masters allow zone transfers). Returns
   *   { cells: { [serverId]: cell }, errors: [{ code, server }] }
   * cell: { hold: 'write' | 'read' | 'stub' | 'stored' | 'refused', via: 'file' | 'xfr' | 'ad', from, serial }.
   * Errors stop the definition: cells is then {}.
   */
  function place(servers, z, opts) {
    var host = byId(servers, z.host);
    var errors = [];
    var data = DATA[z.name] || { serial: 0 };
    if (!host) return { cells: {}, errors: [{ code: 'no-host', server: z.host }] };
    if (!isAD(z.type) && z.scope) errors.push({ code: 'scope-on-file', server: host.id });            // rule 2
    if (isAD(z.type)) {
      if (!host.isDC) errors.push({ code: 'not-dc', server: host.id });                               // rule 4
      else if (host.isRODC) errors.push({ code: 'rodc', server: host.id });                           // rule 7
      if (SCOPES.indexOf(z.scope) < 0) errors.push({ code: 'no-scope', server: host.id });
      else if (z.scope === 'custom' && host.isDC && CUSTOM.members.indexOf(host.id) < 0) errors.push({ code: 'not-enlisted', server: host.id });
    }
    if (!host.dnsRole) errors.push({ code: 'no-dns', server: host.id });                             // rule 6
    if (errors.length) return { cells: {}, errors: errors };

    var needsXfr = !isPrimary(z.type);                                                                // rules 2, 3
    var xfrOk = !needsXfr || external(z.master) || !!(opts && opts.allowXfr);
    var cells = {};
    function cell(hold, via) {
      var c = { hold: hold, via: via, from: needsXfr ? z.master : null, serial: hold === 'refused' || hold === 'stored' ? null : data.serial };
      return c;
    }
    if (!isAD(z.type)) {
      if (z.type === 'primary') cells[host.id] = cell('write', 'file');                               // rule 1
      else cells[host.id] = cell(xfrOk ? (z.type === 'stub' ? 'stub' : 'read') : 'refused', 'xfr');  // rules 2, 3
      return { cells: cells, errors: [] };
    }
    scopeMembers(servers, z.scope, host).forEach(function (s) {                                       // rule 5
      var hold;
      if (!s.dnsRole) hold = 'stored';                                                                // rule 6: it asks for nothing
      else if (!xfrOk) hold = 'refused';
      else if (z.type === 'adStub') hold = 'stub';                                                    // rule 3
      else hold = s.isRODC ? 'read' : 'write';                                                        // rule 7
      cells[s.id] = cell(hold, 'ad');
    });
    return { cells: cells, errors: [] };
  }

  /** The baseline's master for a zone of ours, or the partner's server: where a secondary or stub copies from. */
  function masterFor(defs, name) {
    for (var i = 0; i < defs.length; i++) if (defs[i].name === name && isPrimary(defs[i].type)) return defs[i].host;
    return name === 'partner.example' ? PARTNER_MASTER : null;
  }

  /**
   * Rules 1–9 over the whole forest. defs: the baseline definitions; created: the student's definition (or null);
   * ms1Secondary: MS1 also holds a secondary of created.name. Returns
   *   { defs: [the definitions in force], holdings: { [server]: { [zone]: cell } }, errors: [{ code, server, zone, by }],
   *     accepted: bool (the student's definition is in force), ms1: 'none' | 'ok' | 'refused' | 'rejected' }
   * A cell with nothing held is { hold: 'none' }. A rejected definition leaves the previous holdings in place and
   * marks the cell with rejected: code (rule 9).
   */
  function holdingsOf(servers, defs, created, opts) {
    opts = opts || {};
    var errors = [];
    var inForce = defs.slice();
    var accepted = false;
    if (created) {
      // A primary (file or AD) made on a server that already holds the zone converts it: it replaces the zone's old
      // definition (a new type or scope). Made anywhere else it is a second, separate primary: a file one stands beside
      // the old zone; an AD one is rejected while the zone is already in AD (one name, one zone in the directory).
      // A secondary or stub is a further copy, made from the zone's master.
      var before = cellsOf(servers, defs, opts);
      var hostHolds = !!before[created.host] && before[created.host][created.name].hold !== 'none';
      var others = isPrimary(created.type) && hostHolds ? defs.filter(function (d) { return d.name !== created.name; }) : defs;
      var def = Object.assign({}, created);
      if (!isPrimary(def.type) && !def.master) def.master = masterFor(defs, def.name);
      var placed = place(servers, def, opts);
      var errs = placed.errors.slice();
      if (!errs.length && isAD(def.type) && isPrimary(def.type) && !hostHolds) {
        defs.forEach(function (d) {
          if (d.name === def.name && isAD(d.type)) {
            errs.push({ code: 'exists-ad', server: def.host, part: partitionOf(d.scope, byId(servers, d.host)) });   // rule 9
          }
        });
      }
      if (!errs.length) {
        var taken = cellsOf(servers, others, opts);
        Object.keys(placed.cells).forEach(function (id) {
          if (taken[id][def.name].hold !== 'none') errs.push({ code: 'exists', server: id });          // rule 9
        });
      }
      if (errs.length) {
        errs.forEach(function (e) {
          var x = { code: e.code, server: e.server, zone: def.name, by: 'zone' };
          if (e.part) x.part = e.part;
          errors.push(x);
        });
      }
      else { inForce = others.concat([def]); accepted = true; }
    }
    var holdings = cellsOf(servers, inForce, opts);
    var ms1 = 'none';
    if (created && opts.ms1Secondary && byId(servers, 'MS1')) {
      var name = created.name;
      if (holdings.MS1[name].hold !== 'none') {
        ms1 = 'rejected';
        errors.push({ code: 'exists', server: 'MS1', zone: name, by: 'ms1Secondary' });
      } else {
        var sec = place(servers, { name: name, type: 'secondary', scope: null, host: 'MS1', master: masterFor(inForce, name) }, opts);
        if (sec.errors.length) {
          ms1 = 'rejected';
          sec.errors.forEach(function (e) { errors.push({ code: e.code, server: 'MS1', zone: name, by: 'ms1Secondary' }); });
        } else {
          holdings.MS1[name] = sec.cells.MS1;
          ms1 = sec.cells.MS1.hold === 'refused' ? 'refused' : 'ok';
        }
      }
    }
    errors.forEach(function (e) {
      var c = holdings[e.server] && holdings[e.server][e.zone];
      if (c && !c.rejected) c.rejected = e.code;
    });
    return { defs: inForce, holdings: holdings, errors: errors, accepted: accepted, ms1: ms1 };
  }

  /** Every server × every zone from definitions that are known to be valid; later definitions win a shared cell. */
  function cellsOf(servers, defs, opts) {
    var out = {};
    servers.forEach(function (s) { out[s.id] = {}; ZONES.forEach(function (z) { out[s.id][z] = { hold: 'none' }; }); });
    defs.forEach(function (d) {
      var p = place(servers, d, opts);
      Object.keys(p.cells).forEach(function (id) { out[id][d.name] = p.cells[id]; });
    });
    return out;
  }

  /** What one server holds of a zone, as records (stub: SOA, NS, glue A; full copy: the count), and how it answers a
      query for www.<zone> (rule 3: a stub refers the query to the zone's own servers). */
  function contentOf(cell, zone) {
    var d = DATA[zone];
    var hold = cell.hold;
    if (hold === 'write' || hold === 'read') {
      return { kind: 'full', records: d.records, serial: cell.serial, answer: d.www ? { kind: 'answer', name: 'www.' + zone, addr: d.www } : null };
    }
    if (hold === 'stub') {
      var rr = [{ type: 'SOA', name: zone, data: d.ns[0][0] + ' ' + cell.serial }];
      d.ns.forEach(function (n) { rr.push({ type: 'NS', name: zone, data: n[0] }); });
      d.ns.forEach(function (n) { rr.push({ type: 'A', name: n[0], data: n[1] }); });
      return { kind: 'stub', records: rr.length, rr: rr, serial: cell.serial,
        answer: d.www ? { kind: 'refer', name: 'www.' + zone, ns: d.ns.map(function (n) { return n[0]; }), addrs: d.ns.map(function (n) { return n[1]; }) } : null };
    }
    // a zone that exists here but never loaded (refused) answers SERVFAIL for its names (check); otherwise the server
    // does not hold the zone and looks the name up like any other
    return { kind: hold === 'stored' ? 'stored' : hold === 'refused' ? 'refused' : 'none', records: 0, serial: null,
      answer: d.www ? { kind: hold === 'refused' ? 'servfail' : 'elsewhere', name: 'www.' + zone } : null };
  }

  /** Rule 8: the dynamic-update choices a zone type offers. */
  function updatesOf(type) {
    if (type === 'adPrimary') return ['none', 'nonsecure', 'secure'];
    if (type === 'primary') return ['none', 'nonsecure'];
    return [];                                                 // a copy: updates go to the master
  }

  /** For the K4 view: why a server is or is not in the definition's reach, as the columns that fail. */
  function reachOf(servers, def, id) {
    var s = byId(servers, id), host = byId(servers, def.host);
    if (!isAD(def.type)) return id === def.host ? [] : ['host'];
    var miss = [];
    if (!s.isDC) miss.push('role');
    if (def.scope === 'custom') { if (s.isDC && CUSTOM.members.indexOf(s.id) < 0) miss.push('partition'); return miss; }
    if (def.scope !== 'forest' && host && s.domain !== host.domain) miss.push('domain');
    if (def.scope !== 'allDCsDomain' && !s.dnsRole) miss.push('dns');
    return miss;
  }

  // ── the explorer ──

  /** The student's definition from the params: scope only for AD-integrated types (a file has no replication scope). */
  function createdOf(p) {
    return { name: p.zone, type: p.type, scope: isAD(p.type) ? p.scope : null, host: p.host, master: null };
  }

  var logic = {
    FOREST: FOREST,
    PARTNER_MASTER: PARTNER_MASTER,
    CUSTOM: CUSTOM,
    TYPES: TYPES,
    SCOPES: SCOPES,
    ZONES: ZONES,
    CHOICES: CHOICES,
    HOSTS: HOSTS,
    DATA: DATA,

    defaults: { zone: 'corp.example', type: 'adPrimary', scope: 'domain', host: 'DC1', dc3Dns: false, ms1Secondary: false, allowXfr: false },

    /** The task's six presets (SPEC §3). Each sets every param it depends on. */
    presets: [
      { id: 'domain-scope', params: { zone: 'corp.example', type: 'adPrimary', scope: 'domain', host: 'DC1', dc3Dns: false, ms1Secondary: false, allowXfr: false } },
      { id: 'forest-scope', params: { zone: 'corp.example', type: 'adPrimary', scope: 'forest', host: 'DC1', dc3Dns: false, ms1Secondary: false, allowXfr: false } },
      { id: 'all-dcs', params: { zone: 'corp.example', type: 'adPrimary', scope: 'allDCsDomain', host: 'DC1', dc3Dns: false, ms1Secondary: false, allowXfr: false } },
      { id: 'secondary-ms1', params: { zone: 'corp.example', type: 'adPrimary', scope: 'domain', host: 'DC1', dc3Dns: false, ms1Secondary: true, allowXfr: false } },
      { id: 'stub-partner', params: { zone: 'partner.example', type: 'stub', scope: 'domain', host: 'DC1', dc3Dns: false, ms1Secondary: false, allowXfr: false } },
      { id: 'ad-on-member', params: { zone: 'corp.example', type: 'adPrimary', scope: 'domain', host: 'MS1', dc3Dns: false, ms1Secondary: false, allowXfr: false } }
    ],

    /** The explorer's whole state from its params. */
    initial: function (p) {
      var servers = serversOf(p);
      var created = createdOf(p);
      var r = holdingsOf(servers, baseline(), created, { allowXfr: !!p.allowXfr, ms1Secondary: !!p.ms1Secondary });
      // the selected zone's definition in force: the student's when accepted, else the zone's primary (null: nobody)
      var def = r.accepted ? r.defs[r.defs.length - 1] : null;
      if (!def) r.defs.forEach(function (d) { if (d.name === p.zone && isPrimary(d.type)) def = d; });
      var host = def ? byId(servers, def.host) : null;
      return {
        servers: servers,
        zones: r.defs,
        created: created,
        accepted: r.accepted,
        zone: p.zone,
        def: def,                                           // the selected zone's definition in force (null: nobody holds it)
        partition: def && isAD(def.type) ? partitionOf(def.scope, host) : null,
        holdings: r.holdings,
        errors: r.errors,
        ms1: r.ms1,
        allowXfr: !!p.allowXfr
      };
    },

    serversOf: serversOf,
    baseline: baseline,
    place: place,
    holdingsOf: holdingsOf,
    scopeMembers: scopeMembers,
    partitionOf: partitionOf,
    masterFor: masterFor,
    contentOf: contentOf,
    updatesOf: updatesOf,
    reachOf: reachOf,
    isAD: isAD,
    isPrimary: isPrimary,
    external: external,

    /** Cells whose holding differs between two states, as [server, zone] pairs, for the page's "changed" mark. */
    changedCells: function (a, b) {
      var out = [];
      if (!a) return out;
      b.servers.forEach(function (s) {
        ZONES.forEach(function (z) {
          var x = a.holdings[s.id] && a.holdings[s.id][z], y = b.holdings[s.id][z];
          if (!x || x.hold !== y.hold || x.rejected !== y.rejected || x.serial !== y.serial) out.push([s.id, z]);
        });
      });
      return out;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
