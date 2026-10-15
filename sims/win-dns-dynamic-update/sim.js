/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-dns-dynamic-update: one client registers its A record in the AD-integrated zone corp.example.
   SOA query, an unsigned UPDATE, and when that is refused a security context (TKEY, GSS-TSIG) with the computer
   account and the UPDATE again, signed. The server checks the zone's Dynamic updates setting, then each name's
   owner (the SID on the record's ACL): a new name is created and owned by the sender, an existing one may be
   changed by its owner only. One step = one message (a query with its answer counts as one) or one admin action.
   Rules and numbers: SPEC.md.
   The record-lifecycle part (zoneAccepts, mayWrite, applyUpdate; records { name, type, data, owner, timestamp,
   static }) is pure and string-free, so it can be promoted to models/ for win-dhcp-dns-update and
   win-dns-scavenging (catalogue §5.21).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DAY = 86400, HOUR = 3600, MIN = 60;
  var ZONE = 'corp.example';
  var DOMAIN_SID = 'S-1-5-21-3623811015-3361044348-30300820';
  function sid(rid) { return DOMAIN_SID + '-' + rid; }
  /** Every action happens on day 3 at 10:00:00; the admin's deletion at 10:30:00 (SPEC.md "Times"). */
  var START = 3 * DAY + 10 * HOUR;
  var ADMIN_AT = START + 30 * MIN;

  var SID = { DC1: sid(1000), FS1: sid(1103), PC1: sid(1104), PC2: sid(1105), PC1_NEW: sid(1131) };

  function rec(name, data, owner, timestamp) {
    return { name: name, type: 'A', data: data, owner: owner, timestamp: timestamp, static: false };
  }

  /** The scene of each action: the records and accounts before it, the client, and the update it sends. */
  var ACTIONS = {
    join: {
      records: [], computers: [['PC1', SID.PC1]],
      client: { id: 'pc1', name: 'PC1', ip: '10.0.0.51', sid: SID.PC1, domainMember: true },
      adds: ['pc1'], deletes: []
    },
    move: {
      records: [rec('pc1', '10.0.0.51', SID.PC1, 2 * DAY + 9 * HOUR + 15 * MIN)], computers: [['PC1', SID.PC1]],
      client: { id: 'pc1', name: 'PC1', ip: '10.0.1.23', sid: SID.PC1, domainMember: true },
      adds: ['pc1'], deletes: []
    },
    rename: {
      records: [rec('pc2', '10.0.0.52', SID.PC2, 1 * DAY + 9 * HOUR)], computers: [['PC2-NEW', SID.PC2]],
      client: { id: 'pc2', name: 'PC2-NEW', ip: '10.0.0.52', sid: SID.PC2, domainMember: true, renamedFrom: 'PC2' },
      adds: ['pc2-new'], deletes: ['pc2']
    },
    rebuildNew: {
      records: [rec('pc1', '10.0.0.51', SID.PC1, 2 * DAY + 9 * HOUR + 15 * MIN)], computers: [['PC1', SID.PC1_NEW]],
      client: { id: 'pc1', name: 'PC1', ip: '10.0.0.77', sid: SID.PC1_NEW, domainMember: true, oldSid: SID.PC1 },
      adds: ['pc1'], deletes: []
    },
    rebuildReset: {
      records: [rec('pc1', '10.0.0.51', SID.PC1, 2 * DAY + 9 * HOUR + 15 * MIN)], computers: [['PC1', SID.PC1]],
      client: { id: 'pc1', name: 'PC1', ip: '10.0.0.77', sid: SID.PC1, domainMember: true, reset: true },
      adds: ['pc1'], deletes: []
    },
    rogue: {
      records: [], computers: [],
      client: { id: 'laptop', name: 'LAPTOP', ip: '10.0.0.66', sid: null, domainMember: false },
      adds: ['fs1'], deletes: []
    }
  };
  var ACTION_IDS = ['join', 'move', 'rename', 'rebuildNew', 'rebuildReset', 'rogue'];
  var UPDATES = ['none', 'nonsecureAndSecure', 'secureOnly'];

  /** Records every scene has (SPEC.md "Times"). */
  function baseRecords() {
    return [rec('dc1', '10.0.0.10', SID.DC1, 7 * HOUR), rec('fs1', '10.0.0.20', SID.FS1, 8 * HOUR)];
  }
  function baseComputers() { return [['DC1', SID.DC1], ['FS1', SID.FS1]]; }

  // ── the record-lifecycle rules, as pure functions (promotable) ──

  /** DNS names compare case-insensitively (T3). */
  function key(name) { return String(name).toLowerCase(); }
  function find(records, name) {
    for (var i = 0; i < records.length; i++) if (key(records[i].name) === key(name)) return records[i];
    return null;
  }
  function byName(a, b) { return key(a.name) < key(b.name) ? -1 : key(a.name) > key(b.name) ? 1 : 0; }

  /** Rules 3, 7, 8: does the zone's setting take an update signed or not? */
  function zoneAccepts(updates, signed) {
    if (updates === 'none') return false;
    if (updates === 'nonsecureAndSecure') return true;
    return !!signed; // secureOnly
  }

  /** Rules 5, 6, T2: may the sender (a SID) write this name? No record: anyone authenticated creates it. A record
      with no owner (created unsigned) is open. Otherwise only the same SID. */
  function mayWrite(records, name, senderSid) {
    var r = find(records, name);
    if (!r) return true;
    if (r.owner === null) return true;
    return r.owner === senderSid;
  }

  /** The server's whole decision on one update: { rcode, reason, records, items, added, updated, removed }.
      update = { adds: [{ name, data }], deletes: [name] }; sender = { sid | null, signed }.
      Order: the zone's setting first (rules 3, 7, 8), then, for a signed update, each name's owner (rules 5, 6);
      all or nothing (T1). An unsigned update the zone accepts is not checked against the ACL (rule 7). */
  function applyUpdate(zone, update, sender, now) {
    var names = update.adds.map(function (a) { return a.name; }).concat(update.deletes);
    var items = names.map(function (n) {
      var r = find(zone.records, n);
      return { name: n, exists: !!r, owner: r ? r.owner : null, may: mayWrite(zone.records, n, sender.sid) };
    });
    var out = { rcode: 'REFUSED', reason: null, records: zone.records, items: items, added: [], updated: [], removed: [] };
    if (!zoneAccepts(zone.updates, sender.signed)) {
      out.reason = zone.updates === 'none' ? 'zoneNone' : 'unsigned';
      return out;
    }
    if (sender.signed && items.some(function (it) { return !it.may; })) { out.reason = 'owner'; return out; }
    var records = zone.records.map(function (r) { return Object.assign({}, r); });
    update.adds.forEach(function (a) {
      var r = find(records, a.name);
      if (r) {
        // rule 9: the owner (or an unsigned update in a nonsecure zone, rule 7) changes the data and the timestamp
        r.data = a.data; r.timestamp = now;
        if (sender.signed && r.owner === null) r.owner = sender.sid;
        out.updated.push(key(a.name));
      } else {
        // rule 5: a new name belongs to the signed sender; created unsigned it has no owner (rule 7)
        records.push(rec(key(a.name), a.data, sender.signed ? sender.sid : null, now));
        out.added.push(key(a.name));
      }
    });
    update.deletes.forEach(function (n) {
      var before = records.length;
      records = records.filter(function (r) { return key(r.name) !== key(n); });
      if (records.length < before) out.removed.push(key(n));
    });
    records.sort(byName);
    out.rcode = 'NOERROR';
    out.records = records;
    return out;
  }

  // ── the client's run ──

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /** The update the client of an action sends (the names from ACTIONS with the client's address). */
  function updateFor(action) {
    var a = ACTIONS[action];
    return { adds: a.adds.map(function (n) { return { name: n, data: a.client.ip }; }), deletes: a.deletes.slice() };
  }

  /** T5: the admin's fix applies only after a refusal by ownership. */
  function fixApplies(s) { return s.result === 'owner' && !s.fixed; }

  var logic = {
    /** Parameter defaults. */
    defaults: { updates: 'secureOnly', action: 'join', adminDelete: false },

    ZONE: ZONE,
    SID: SID,
    START: START,
    ADMIN_AT: ADMIN_AT,
    ACTION_IDS: ACTION_IDS,
    UPDATES: UPDATES,

    /** Steps for these params: until the run ends (join 6; the hijack 3; a rebuild with the admin's fix 13). */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (s.phase !== 'done' && n < 30) { n++; s = logic.step(s, n, p); }
      return n;
    },

    /** State at step 0: the zone and accounts before the action, the client, nothing sent yet. */
    initial: function (p) {
      var a = ACTIONS[p.action] || ACTIONS.join;
      var records = baseRecords().concat(a.records.map(function (r) { return Object.assign({}, r); })).sort(byName);
      var client = Object.assign({}, a.client);
      return {
        zone: { name: ZONE, updates: p.updates, records: records },
        ad: { computers: baseComputers().concat(a.computers).map(function (c) { return { name: c[0], sid: c[1] }; }) },
        clients: [client],
        update: updateFor(p.action in ACTIONS ? p.action : 'join'),
        msgs: [],
        phase: 'soa',
        round: 1,
        fixed: false,
        result: null,
        t: START
      };
    },

    /** State after step n: one message (or query and answer) more, or the admin's action. */
    step: function (s0, n, p) {
      var s = clone(s0);
      var c = s.clients[0];
      var e;
      s.t = s.phase === 'admin' ? ADMIN_AT : s.t + 1;
      switch (s.phase) {
        case 'soa':
          // rule 2: the SOA of the name it registers; an AD-integrated zone's server names itself as the primary
          e = { kind: 'soa', q: s.update.adds[0].name + '.' + ZONE, primary: 'dc1.' + ZONE };
          s.phase = 'unsigned';
          break;
        case 'unsigned':
        case 'signed':
          // rule 3: unsigned first; signed after a refusal, with the security context
          e = { kind: 'update', signed: s.phase === 'signed', update: s.update };
          s.phase = s.phase === 'signed' ? 'answer2' : 'answer1';
          break;
        case 'answer1':
        case 'answer2': {
          var signed = s.phase === 'answer2';
          var r = applyUpdate(s.zone, s.update, { sid: c.sid, signed: signed }, s.t);
          s.zone.records = r.records;
          e = { kind: 'answer', signed: signed, rcode: r.rcode, reason: r.reason, items: r.items,
            added: r.added, updated: r.updated, removed: r.removed };
          if (r.rcode === 'NOERROR') { s.result = 'ok'; s.phase = 'done'; }
          else if (!signed && c.domainMember) s.phase = 'tkey';
          else {
            // rule 13: a workgroup client cannot get a security context and gives up
            if (!signed) e.gaveUp = true;
            s.result = r.reason;
            s.phase = p.adminDelete && fixApplies(s) ? 'admin' : 'done';
          }
          break;
        }
        case 'tkey':
          // rule 3: TKEY with GSS-TSIG, the computer account authenticates
          e = { kind: 'tkey', account: c.name + '$', sid: c.sid };
          s.phase = 'signed';
          break;
        case 'admin': {
          // rule 12: the admin deletes the stale record; the client registers again
          var name = s.update.adds[0].name;
          var old = find(s.zone.records, name);
          s.zone.records = s.zone.records.filter(function (x) { return key(x.name) !== key(name); });
          e = { kind: 'admin', deleted: key(name), data: old ? old.data : null, owner: old ? old.owner : null };
          s.fixed = true;
          s.result = null;
          s.round = 2;
          s.phase = 'soa';
          break;
        }
        default:
          return s;
      }
      e.n = n;
      e.t = s.t;
      e.round = s.round;
      s.msgs.push(e);
      return s;
    },

    /** T5, for the page: would the admin's fix add steps for these params? */
    fixPossible: function (p) {
      var q = Object.assign({}, p, { adminDelete: false });
      var s = logic.initial(q), n = 0;
      while (s.phase !== 'done' && n < 30) { n++; s = logic.step(s, n, q); }
      return s.result === 'owner';
    },

    // exported for the page and the tests
    key: key,
    find: find,
    zoneAccepts: zoneAccepts,
    mayWrite: mayWrite,
    applyUpdate: applyUpdate,
    updateFor: updateFor
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
