/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-dhcp-dns-update: a DHCP server registers DNS records for its clients. One client gets a lease
   (DISCOVER/OFFER, REQUEST/ACK with option 81, Client FQDN), then the DHCP server and the client send the DNS
   updates the server's DNS settings call for to DC1, which holds the AD-integrated zones corp.example and
   10.0.10.in-addr.arpa (both "Secure only"). DC1 checks prerequisites (Name Protection, RFC 4703), then each name's
   owner (the account on the record's ACL). Other events: DHCP1 goes down and DHCP2 gives the client a new address; the
   client's lease expires and DHCP1 removes what it registered. One step = one message, a DHCP query with its answer,
   or one event. Rules and numbers: SPEC.md.
   The record part (rec, key, find, byName, zoneAccepts, mayWrite) is from sims/win-dns-dynamic-update/sim.js @
   7a49e71; applyUpdate is that function extended with record types, prerequisites and an unowned writer
   (DnsUpdateProxy). Pure and string-free, ready for models/ (catalogue §5.21).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DAY = 86400, HOUR = 3600;
  var FWD = 'corp.example', REV = '10.0.10.in-addr.arpa';
  /** Every visible event starts on day 3 at 10:00:00 and each step adds a second (SPEC.md "Times"). */
  var START = 3 * DAY + 10 * HOUR;
  /** Earlier leases (the history a scene starts from): FS1 on day 0, the client on day 1, ACK at 08:00 / 09:00. */
  var FS1_AT = 8 * HOUR, EARLIER_AT = DAY + 9 * HOUR;
  /** The Windows DHCP server's default lease duration, 8 days (SPEC.md rule 9, check). */
  var LEASE = 8 * DAY;
  var NEW_IP = '10.0.10.88';
  var SVC = 'svc-dhcpdns';

  var CLIENTS = {
    windows: { id: 'windows', name: 'WIN10-07', host: 'win10-07', mac: '00-15-5D-0A-0A-07', os: 'windows', sendsOpt81: true, account: 'WIN10-07$', ip: '10.0.10.57' },
    other: { id: 'other', name: 'HOST-12', host: 'host-12', mac: '52-54-00-3C-4D-12', os: 'other', sendsOpt81: false, account: null, ip: '10.0.10.62' },
    printer: { id: 'printer', name: 'PRN-3', host: 'prn-3', mac: '00-80-77-11-22-03', os: 'printer', sendsOpt81: false, account: null, ip: '10.0.10.53' },
    clash: { id: 'clash', name: 'FS1', host: 'fs1', mac: '00-15-5D-0A-0A-66', os: 'windows', sendsOpt81: true, account: null, ip: '10.0.10.66' }
  };
  /** The real file server: a reservation on DHCP1, a domain member. Only in the clash scene, as history. */
  var FS1 = { id: 'fs1', name: 'FS1', host: 'fs1', mac: '00-15-5D-0A-0A-20', os: 'windows', sendsOpt81: true, account: 'FS1$', ip: '10.0.10.20' };
  var SERVERS = { DHCP1: '10.0.10.11', DHCP2: '10.0.10.12' };

  var CLIENT_IDS = ['windows', 'other', 'printer', 'clash'];
  var EVENTS = ['lease', 'failover', 'expiry'];
  var MODES = ['off', 'onRequest', 'always'];
  /** Rule 5 and rule 7: the computer account, the computer account in DnsUpdateProxy, or the shared user. */
  var CREDS = ['computer', 'proxy', 'dedicated'];
  var TYPE_ORDER = { A: 0, DHCID: 1, PTR: 2 };

  // ── from sims/win-dns-dynamic-update/sim.js @ 7a49e71: the record shape, name lookup and the ownership rule ──

  function rec(name, type, data, owner, timestamp) {
    return { name: name, type: type, data: data, owner: owner, timestamp: timestamp, static: false };
  }
  /** DNS names compare case-insensitively. */
  function key(name) { return String(name).toLowerCase(); }
  function find(records, name, type) {
    for (var i = 0; i < records.length; i++) {
      if (key(records[i].name) === key(name) && (!type || records[i].type === type)) return records[i];
    }
    return null;
  }
  /** By name, then A, DHCID, PTR (adapted: the source sorts by name only, it has A records only). */
  function byName(a, b) {
    if (key(a.name) !== key(b.name)) return key(a.name) < key(b.name) ? -1 : 1;
    return TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
  }
  /** Both zones here are "Secure only" (rule 6). */
  function zoneAccepts(updates, signed) {
    if (updates === 'none') return false;
    if (updates === 'nonsecureAndSecure') return true;
    return !!signed;
  }
  /** Rules 5–7: a new name is open to any authenticated writer; a name with no owner (created by a DnsUpdateProxy
      member) is open; otherwise only the owner writes it. The ACL sits on the name, so all its records share it. */
  function mayWrite(records, name, principal) {
    var r = find(records, name);
    if (!r) return true;
    if (r.owner === null) return true;
    return r.owner === principal;
  }

  /** One DNS UPDATE at DC1: { rcode, reason, items, added, updated, removed, records }.
      update = { prereq: null | { nxdomain: name } | { dhcid: { name, data } }, adds: [{ name, type, data }],
                 deletes: [{ name, type }] }; sender = { principal, signed, proxy }.
      Order: the zone's setting (rule 6), the prerequisites (rule 8, RFC 2136 §3.2), then each name's owner (rules 5–7,
      §3.3); all or nothing (T1). A new name is owned by the sender, or by nobody if the sender is in DnsUpdateProxy
      (rule 7); a signed writer that is not in DnsUpdateProxy takes over a name with no owner (T3). */
  function applyUpdate(zone, update, sender, now) {
    var names = [];
    update.adds.concat(update.deletes).forEach(function (x) { if (names.indexOf(key(x.name)) < 0) names.push(key(x.name)); });
    var items = names.map(function (n) {
      var r = find(zone.records, n);
      return { name: n, exists: !!r, owner: r ? r.owner : null, may: mayWrite(zone.records, n, sender.principal) };
    });
    var out = { rcode: 'REFUSED', reason: null, items: items, added: [], updated: [], removed: [], records: zone.records };
    if (!zoneAccepts(zone.updates, sender.signed)) { out.reason = 'unsigned'; return out; }
    var pq = update.prereq;
    if (pq && pq.nxdomain && find(zone.records, pq.nxdomain)) { out.rcode = 'YXDOMAIN'; out.reason = 'inUse'; return out; }
    if (pq && pq.dhcid) {
      var d = find(zone.records, pq.dhcid.name, 'DHCID');
      if (!d || d.data !== pq.dhcid.data) { out.rcode = 'NXRRSET'; out.reason = d ? 'otherDhcid' : 'noDhcid'; return out; }
    }
    if (items.some(function (it) { return !it.may; })) { out.reason = 'owner'; return out; }
    var records = zone.records.map(function (r) { return Object.assign({}, r); });
    update.deletes.forEach(function (x) {
      var before = records.length;
      records = records.filter(function (r) { return !(key(r.name) === key(x.name) && r.type === x.type); });
      if (records.length < before) out.removed.push(key(x.name) + ' ' + x.type);
    });
    update.adds.forEach(function (a) {
      var n = key(a.name);
      var r = find(records, n, a.type);
      if (r) { r.data = a.data; r.timestamp = now; out.updated.push(n + ' ' + a.type); }
      else { records.push(rec(n, a.type, a.data, null, now)); out.added.push(n + ' ' + a.type); }
      // the owner of the name (all its records): kept, taken over if open, or set for a new name
      var any = records.filter(function (x) { return key(x.name) === n; });
      var old = zone.records.filter(function (x) { return key(x.name) === n; });
      var owner = old.length ? old[0].owner : null;
      if ((!old.length || owner === null) && !sender.proxy) owner = sender.principal;
      any.forEach(function (x) { x.owner = owner; });
    });
    records.sort(byName);
    out.rcode = 'NOERROR';
    out.records = records;
    return out;
  }

  // ── the DHCP server's DNS settings ──

  /** Rule 5: the account the server writes with. Rule 7: DnsUpdateProxy holds the computer accounts only. */
  function senderOf(srv) {
    if (srv.creds === 'dedicated') return { principal: SVC, signed: true, proxy: false };
    return { principal: srv.id + '$', signed: true, proxy: !!srv.inDnsUpdateProxy };
  }
  /** Rules 1–3, 8: who registers what after the ACK. { server: ['A', 'PTR'], client: [...], reply: opt81 reply }.
      reply null = no option 81 in the ACK. */
  function plan(settings, client) {
    if (settings.mode === 'off') return { server: [], client: client.sendsOpt81 ? ['A', 'PTR'] : [], reply: null };
    if (client.sendsOpt81) {
      if (settings.nameProtection || settings.mode === 'always') return { server: ['A', 'PTR'], client: [], reply: { s: 1, o: 1 } };
      return { server: ['PTR'], client: ['A'], reply: { s: 0, o: 0 } };
    }
    return { server: settings.legacyClients ? ['A', 'PTR'] : [], client: [], reply: null };
  }
  function ptrName(ip) { return ip.split('.').pop(); }

  // ── the run ──

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function server(s, id) { for (var i = 0; i < s.dhcp.length; i++) if (s.dhcp[i].id === id) return s.dhcp[i]; return null; }
  function settingsOf(p) {
    return { mode: p.mode, discardOnDelete: !!p.discard, legacyClients: !!p.legacy, nameProtection: !!p.nameProtection && p.mode !== 'off' };
  }

  /** The update a task sends (rules 2–4, 8). */
  function updateFor(s, task) {
    var c = s.lease.client, ip = s.lease.ip, fqdn = c.host + '.' + FWD;
    var np = task.by !== 'client' && server(s, task.by).settings.nameProtection;
    if (task.op === 'del') return { zone: task.zone, prereq: null, adds: [], deletes: task.types.map(function (t) { return { name: task.name, type: t }; }) };
    if (task.op === 'PTR') return { zone: 'rev', prereq: null, adds: [{ name: ptrName(ip), type: 'PTR', data: fqdn }], deletes: [] };
    var a = { name: c.host, type: 'A', data: ip };
    if (!np) return { zone: 'fwd', prereq: null, adds: [a], deletes: [] };
    if (task.try === 1) return { zone: 'fwd', prereq: { nxdomain: c.host }, adds: [a, { name: c.host, type: 'DHCID', data: c.mac }], deletes: [] };
    return { zone: 'fwd', prereq: { dhcid: { name: c.host, data: c.mac } }, adds: [a], deletes: [] };
  }

  /** Start a lease run: the client asks, the serving server answers. */
  function beginLease(s, client, ip, by) {
    s.lease = { client: client, ip: ip, by: by };
    s.phase = 'do';
  }

  /** One transition; returns the event. s is the caller's copy. */
  function advance(s) {
    var e, L = s.lease, srv;
    s.t += 1;
    switch (s.phase) {
      case 'down':
        server(s, 'DHCP1').up = false;
        e = { kind: 'down', server: 'DHCP1' };
        beginLease(s, s.clients[0], NEW_IP, 'DHCP2');
        break;
      case 'expire': {
        // rule 4: the lease expires and is deleted; with "Discard" the server removes what it registered
        srv = server(s, 'DHCP1');
        var ls = srv.leases.filter(function (x) { return x.mac === s.clients[0].mac; })[0];
        srv.leases = srv.leases.filter(function (x) { return x !== ls; });
        s.t = ls.expires;
        e = { kind: 'expire', server: 'DHCP1', ip: ls.ip, dns: ls.dns, discard: srv.settings.discardOnDelete };
        s.lease = { client: s.clients[0], ip: ls.ip, by: 'DHCP1' };
        s.queue = srv.settings.discardOnDelete
          ? ls.dns.map(function (d) { return { by: 'DHCP1', op: 'del', zone: d.zone, name: d.name, types: d.types.slice(), try: 1 }; })
          : [];
        s.phase = s.queue.length ? 'upd' : 'done';
        break;
      }
      case 'do':
        e = { kind: 'do', by: L.by, ip: L.ip, lost: s.dhcp.filter(function (x) { return !x.up; }).map(function (x) { return x.id; }) };
        s.phase = 'ra';
        break;
      case 'ra': {
        srv = server(s, L.by);
        var pl = plan(srv.settings, L.client);
        srv.leases = srv.leases.filter(function (x) { return x.mac !== L.client.mac; });
        srv.leases.push({ host: L.client.host, mac: L.client.mac, ip: L.ip, granted: s.t, expires: s.t + LEASE, dns: [] });
        e = { kind: 'ra', by: L.by, ip: L.ip, opt81: L.client.sendsOpt81 ? { fqdn: L.client.host + '.' + FWD, s: 0 } : null, reply: pl.reply,
          server: pl.server.slice(), client: pl.client.slice() };
        s.queue = pl.server.map(function (op) { return { by: L.by, op: op, try: 1 }; })
          .concat(pl.client.map(function (op) { return { by: 'client', op: op, try: 1 }; }));
        s.phase = s.queue.length ? 'upd' : 'done';
        break;
      }
      case 'upd': {
        var task = s.queue[0];
        var u = updateFor(s, task);
        var snd = task.by === 'client' ? { principal: L.client.account, signed: !!L.client.account, proxy: false } : senderOf(server(s, task.by));
        e = { kind: 'update', by: task.by, op: task.op, try: task.try, update: u, sender: snd };
        s.pending = { update: u, sender: snd };
        s.phase = 'ans';
        break;
      }
      case 'ans': {
        var t0 = s.queue[0], pu = s.pending;
        var z = s.zones[pu.update.zone];
        var r = applyUpdate(z, pu.update, pu.sender, s.t);
        z.records = r.records;
        e = { kind: 'answer', by: t0.by, op: t0.op, try: t0.try, zone: pu.update.zone, rcode: r.rcode, reason: r.reason, items: r.items,
          added: r.added, updated: r.updated, removed: r.removed, principal: pu.sender.principal };
        s.pending = null;
        if (r.rcode === 'NOERROR' && t0.by !== 'client' && t0.op !== 'del') {
          // the server remembers what it registered, for rule 4
          var ls2 = server(s, t0.by).leases.filter(function (x) { return x.mac === L.client.mac; })[0];
          var types = pu.update.adds.map(function (a) { return a.type; });
          var nm = pu.update.adds[0].name;
          var have = ls2.dns.filter(function (d) { return d.zone === pu.update.zone && d.name === nm; })[0];
          if (have) types.forEach(function (ty) { if (have.types.indexOf(ty) < 0) have.types.push(ty); });
          else ls2.dns.push({ zone: pu.update.zone, name: nm, types: types });
        }
        if (r.rcode === 'YXDOMAIN') {
          t0.try = 2; // rule 8: the name is in use; try again, on condition that its DHCID is this client's
        } else {
          s.queue.shift();
          if (r.rcode === 'NXRRSET') {
            // rule 8: another client's name: the server stops for this client (no PTR either)
            e.stopped = s.queue.filter(function (x) { return x.by === t0.by; }).map(function (x) { return x.op; });
            s.queue = s.queue.filter(function (x) { return x.by !== t0.by; });
          }
          if (r.reason === 'unsigned' && t0.by === 'client') {
            // a client with no computer account cannot sign: it gives up its registration
            e.gaveUp = true;
            s.queue = s.queue.filter(function (x) { return x.by !== 'client'; });
          }
        }
        s.phase = s.queue.length ? 'upd' : 'done';
        break;
      }
      default:
        return null;
    }
    return e;
  }

  /** Run a lease to its end without keeping its messages (a scene's history). */
  function history(s, client, ip, at) {
    s.t = at - 2; // the ACK lands at `at`
    beginLease(s, client, ip, 'DHCP1');
    var guard = 0;
    while (s.phase !== 'done' && guard++ < 40) advance(s);
  }

  function baseZones() {
    return {
      fwd: { name: FWD, updates: 'secureOnly', records: [rec('dc1', 'A', '10.0.10.10', 'DC1$', 0)] },
      rev: { name: REV, updates: 'secureOnly', records: [rec('10', 'PTR', 'dc1.' + FWD, 'DC1$', 0)] }
    };
  }

  var logic = {
    defaults: { client: 'windows', event: 'lease', mode: 'onRequest', legacy: false, discard: true, creds: 'computer', nameProtection: false },

    FWD: FWD, REV: REV, START: START, LEASE: LEASE, NEW_IP: NEW_IP, SVC: SVC, FS1_AT: FS1_AT, EARLIER_AT: EARLIER_AT,
    CLIENTS: CLIENTS, FS1: FS1, SERVERS: SERVERS,
    CLIENT_IDS: CLIENT_IDS, EVENTS: EVENTS, MODES: MODES, CREDS: CREDS,

    /** Steps for these params: until the run ends. */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (s.phase !== 'done' && n < 40) { n++; s = logic.step(s, n, p); }
      return n;
    },

    /** State at step 0: the zones and leases after the scene's history, nothing sent yet. */
    initial: function (p) {
      var c = Object.assign({}, CLIENTS[p.client] || CLIENTS.windows);
      var ev = EVENTS.indexOf(p.event) >= 0 ? p.event : 'lease';
      var settings = settingsOf(p);
      var mk = function (id) {
        return { id: id, ip: SERVERS[id], up: true, creds: p.creds === 'dedicated' ? 'dedicated' : 'computer',
          inDnsUpdateProxy: p.creds === 'proxy', settings: Object.assign({}, settings), leases: [] };
      };
      var s = {
        dhcp: ev === 'failover' ? [mk('DHCP1'), mk('DHCP2')] : [mk('DHCP1')],
        clients: [c],
        zones: baseZones(),
        lease: null, queue: [], pending: null,
        msgs: [], phase: 'done', t: 0
      };
      if (c.id === 'clash') history(s, Object.assign({}, FS1), FS1.ip, FS1_AT);
      if (ev !== 'lease') history(s, c, c.ip, EARLIER_AT);
      s.t = START;
      s.lease = null; s.queue = []; s.pending = null;
      if (ev === 'lease') beginLease(s, c, c.ip, 'DHCP1');
      else s.phase = ev === 'failover' ? 'down' : 'expire';
      s.event = ev;
      return s;
    },

    /** State after step n: one message (a DHCP query and its answer count as one) or one event more. */
    step: function (s0, n) {
      if (s0.phase === 'done') return s0;
      var s = clone(s0);
      var e = advance(s);
      e.n = n;
      e.t = s.t;
      s.msgs.push(e);
      return s;
    },

    /** For the page: which toggles change anything (T4: legacy clients and Name Protection need updates on;
        "Discard" matters only when a lease expires). */
    matters: function (p) {
      return { legacy: p.mode !== 'off', nameProtection: p.mode !== 'off', discard: p.event === 'expiry' };
    },

    key: key, find: find, byName: byName, zoneAccepts: zoneAccepts, mayWrite: mayWrite, applyUpdate: applyUpdate,
    plan: plan, senderOf: senderOf, ptrName: ptrName
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
