/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-ipam-audit: "who had 10.0.40.57 on Monday 28 Sep at 14:32?", answered from the audit trail.
   Evidence: the DHCP server's lease events for the address (new, renew, release, expire), the domain controllers'
   logon events from that address (a TGT request, Security event 4768), and the DNS record as it is now. One step is one
   link of the chain IP → lease → device (MAC, host name) → logons in the lease → users still on → answer (SPEC.md).
   Each source keeps its events for a while: the DHCP server's audit log one week (a file per weekday, overwritten), the
   DCs' Security log about 3 days in this scenario, IPAM what it collected until it is purged.
   Times are minutes after midnight on 28 Sep. Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON.
   The reusable part (coveringLease, leaseStart, logonsInLease, stillOn, availability, solve) takes plain data. */
(function (root) {
  'use strict';

  var IP = '10.0.40.57';
  var DAY_START = 8 * 60, DAY_END = 18 * 60;   // the time axis, 08:00–18:00
  var AT = { '09:10': 550, '14:32': 872, '17:55': 1075 };

  /** How long each source keeps an event, in days (rule 5). null: until an administrator purges it. */
  var RETENTION = {
    dhcp: 7,      // DhcpSrvLog-<weekday>.log: the same weekday a week later starts the file again (check)
    dc: 3,        // the DCs' Security log is size-limited and overwrites the oldest events; ~3 days here (scenario)
    ipam: null    // IPAM keeps collected events until they are purged (check)
  };

  var MAC = { lab07: '02-AB-CD-0A-0B-07', ivan: '02-AB-CD-1C-2D-31', lab12: '02-AB-CD-0A-0B-12' };

  function hm(h, m) { return h * 60 + m; }
  function lease(t, id, mac, host) { return { t: t, id: id, ip: IP, mac: mac, host: host }; }
  function logon(t, user, dc, kind) { return { t: t, user: user, clientIp: IP, dc: dc, kind: kind || 'tgt' }; }

  /** The evidence sets (task presets, "derived, unchecked"; SPEC.md "Evidence sets"). Lease events in log order. */
  var EVIDENCE = {
    'one-user': {
      leaseEvents: [lease(hm(8, 12), 'new', MAC.lab07, 'PC-LAB07'), lease(hm(13, 5), 'renew', MAC.lab07, 'PC-LAB07'),
        lease(hm(17, 40), 'release', MAC.lab07, 'PC-LAB07')],
      logonEvents: [logon(hm(8, 15), 'ana', 'DC1')],
      dnsNow: { name: 'pc-lab07', ip: IP }
    },
    'address-reused': {
      leaseEvents: [lease(hm(8, 12), 'new', MAC.lab07, 'PC-LAB07'), lease(hm(11, 58), 'release', MAC.lab07, 'PC-LAB07'),
        lease(hm(12, 30), 'new', MAC.ivan, 'LAPTOP-IVAN'), lease(hm(16, 30), 'renew', MAC.ivan, 'LAPTOP-IVAN')],
      logonEvents: [logon(hm(8, 15), 'ana', 'DC1'), logon(hm(12, 33), 'ivan', 'DC2')],
      dnsNow: { name: 'laptop-ivan', ip: IP },
      again: true
    },
    'two-users': {
      leaseEvents: [lease(hm(8, 12), 'new', MAC.lab07, 'PC-LAB07'), lease(hm(12, 12), 'renew', MAC.lab07, 'PC-LAB07'),
        lease(hm(16, 12), 'renew', MAC.lab07, 'PC-LAB07')],
      logonEvents: [logon(hm(8, 15), 'ana', 'DC1'), logon(hm(13, 50), 'marko', 'DC2')],
      dnsNow: { name: 'pc-lab07', ip: IP }
    },
    'dns-trap': {
      leaseEvents: [lease(hm(8, 12), 'new', MAC.lab07, 'PC-LAB07'), lease(hm(13, 5), 'renew', MAC.lab07, 'PC-LAB07'),
        lease(hm(16, 40), 'release', MAC.lab07, 'PC-LAB07'), lease(hm(16, 45), 'new', MAC.lab12, 'PC-LAB12')],
      logonEvents: [logon(hm(8, 15), 'ana', 'DC1'), logon(hm(16, 48), 'petra', 'DC1')],
      dnsNow: { name: 'pc-lab12', ip: IP }
    }
  };

  var HOLDS = ['new', 'renew'];        // events that start or extend a lease
  var ENDS = ['release', 'expire'];    // events that end it

  /** Event indices of one address, oldest first: by time, equal times keep the log order. */
  function chronological(events, ip) {
    var idx = [];
    events.forEach(function (e, i) { if (e.ip === ip) idx.push(i); });
    idx.sort(function (a, b) { return events[a].t - events[b].t || a - b; });
    return idx;
  }

  /** Rule 1 (with rule 7): read the address's events back from `at`, newest first. Events after `at` are passed over;
      the first event at or before `at` decides: new/renew → that lease covers `at`; release/expire → the address was
      free at `at`; none → the log has nothing for `at`. Returns { order: newest-first indices, read: indices passed
      over, decider: index or -1, kind: 'lease' | 'free' | 'none' }. */
  function coveringLease(events, ip, at) {
    var order = chronological(events, ip).reverse();
    var read = [];
    for (var k = 0; k < order.length; k++) {
      var e = events[order[k]];
      if (e.t > at) { read.push(order[k]); continue; }   // rule 7: an event exactly at `at` counts as before it
      return { order: order, read: read, decider: order[k], kind: HOLDS.indexOf(e.id) >= 0 ? 'lease' : 'free' };
    }
    return { order: order, read: read, decider: -1, kind: 'none' };
  }

  /** When the device's lease began: walk back from the covering event over renews of the same MAC to the new lease
      that started them. A release, an expiry or another MAC ends the walk (the lease began after it). Returns the
      event index the lease starts at. */
  function leaseStart(events, cover) {
    var chron = chronological(events, events[cover].ip);
    var pos = chron.indexOf(cover), start = cover;
    for (var k = pos; k >= 0; k--) {
      var e = events[chron[k]];
      if (e.mac !== events[cover].mac || HOLDS.indexOf(e.id) < 0) break;
      start = chron[k];
      if (e.id === 'new') break;
    }
    return start;
  }

  /** Rule 3 (with rule 7): logon events (TGT requests) from `ip` at or after the lease start and at or before `at`.
      Returns { inside: indices, before: indices before the lease, after: indices after `at` } over TGT events only. */
  function logonsInLease(logons, ip, from, at) {
    var out = { inside: [], before: [], after: [] };
    logons.forEach(function (l, i) {
      if (l.clientIp !== ip || l.kind !== 'tgt') return;
      if (l.t < from) out.before.push(i);
      else if (l.t > at) out.after.push(i);
      else out.inside.push(i);
    });
    return out;
  }

  /** Rule 4: of the logons inside the lease, the users still on at `at`: a user is dropped when a logoff of theirs from
      the same address follows their latest logon and is at or before `at`. Returns { users: [names, first logon
      order], kept: indices, dropped: indices, by: logoff indices that dropped someone }. */
  function stillOn(logons, inside, at) {
    var latest = {}, order = [];
    inside.forEach(function (i) {
      var u = logons[i].user;
      if (!(u in latest)) order.push(u);
      if (!(u in latest) || logons[i].t >= logons[latest[u]].t) latest[u] = i;
    });
    var out = { users: [], kept: [], dropped: [], by: [] };
    order.forEach(function (u) {
      var li = latest[u], off = -1;
      logons.forEach(function (l, j) {
        if (l.kind === 'logoff' && l.user === u && l.clientIp === logons[li].clientIp && l.t >= logons[li].t && l.t <= at) off = j;
      });
      inside.forEach(function (i) {
        if (logons[i].user !== u) return;
        if (off >= 0) out.dropped.push(i); else out.kept.push(i);
      });
      if (off >= 0) out.by.push(off); else out.users.push(u);
    });
    return out;
  }

  /** Rule 5: which sources still hold the day's events when the question is asked `days` later. A source holds them
      while days < its retention; with IPAM collecting, IPAM holds both kinds whatever the servers kept. */
  function availability(days, ipamCollected) {
    var dhcp = days < RETENTION.dhcp, dc = days < RETENTION.dc;
    return {
      dhcp: dhcp, dc: dc, ipam: !!ipamCollected,
      leases: ipamCollected || dhcp, logons: ipamCollected || dc,
      via: ipamCollected ? 'ipam' : 'servers'
    };
  }

  /** The whole chain for one question (rules 1–7). Links: lease, device, logons, logoffs, answer; ok is 'found',
      'missing' or 'ambiguous'. answer: { kind: 'one' | 'several' | 'device' | 'unknown', host, mac, users, why }. */
  function solve(ev, ip, at, avail) {
    var L = ev.leaseEvents, G = ev.logonEvents;
    var r = { cover: null, start: -1, logons: null, on: null, chain: [], answer: null };
    if (!avail.leases) {
      r.chain = [{ link: 'lease', ok: 'missing', why: 'gone', evidence: [] }];
    } else {
      r.cover = coveringLease(L, ip, at);
      r.chain = [{ link: 'lease', ok: r.cover.kind === 'lease' ? 'found' : 'missing', why: r.cover.kind === 'lease' ? null : r.cover.kind,
        evidence: r.cover.decider >= 0 ? [r.cover.decider] : [] }];
    }
    var held = r.cover && r.cover.kind === 'lease';
    if (held) {
      r.start = leaseStart(L, r.cover.decider);
      var e = L[r.cover.decider];
      r.chain.push({ link: 'device', ok: 'found', why: e.host ? null : 'no-host', evidence: [r.cover.decider, r.start] });
    } else r.chain.push({ link: 'device', ok: 'missing', why: 'no-lease', evidence: [] });

    if (!avail.logons) r.chain.push({ link: 'logons', ok: 'missing', why: 'gone', evidence: [] });
    else if (!held) r.chain.push({ link: 'logons', ok: 'missing', why: 'no-lease', evidence: [] });
    else {
      r.logons = logonsInLease(G, ip, L[r.start].t, at);
      r.chain.push({ link: 'logons', ok: r.logons.inside.length ? 'found' : 'missing', why: r.logons.inside.length ? null : 'none',
        evidence: r.logons.inside.slice() });
    }

    if (!r.logons || !r.logons.inside.length) r.chain.push({ link: 'logoffs', ok: 'missing', why: r.chain[2].why, evidence: [] });
    else {
      r.on = stillOn(G, r.logons.inside, at);
      var n = r.on.users.length;
      r.chain.push({ link: 'logoffs', ok: n === 1 ? 'found' : n > 1 ? 'ambiguous' : 'missing', why: n ? null : 'all-off',
        evidence: r.on.kept.concat(r.on.by) });
    }

    var a;
    if (!held) a = { kind: 'unknown', host: null, mac: null, users: [], why: r.chain[0].why };
    else {
      var le = L[r.cover.decider];
      var users = r.on ? r.on.users.slice() : [];
      a = { kind: users.length === 1 ? 'one' : users.length > 1 ? 'several' : 'device', host: le.host || null, mac: le.mac, users: users,
        why: users.length ? null : r.chain[3].why };
    }
    r.answer = a;
    r.chain.push({ link: 'answer', ok: a.kind === 'one' ? 'found' : a.kind === 'unknown' ? 'missing' : 'ambiguous', why: a.why,
      evidence: [] });
    return r;
  }

  /** The questions a run asks: `at`, and for the reused-address set the same address again at 09:10 (at 14:32 when the
      first question already is 09:10). */
  function questions(p) {
    var qs = [p.at];
    if (EVIDENCE[p.evidence].again) qs.push(p.at === AT['09:10'] ? AT['14:32'] : AT['09:10']);
    return qs;
  }

  /** The day the question is asked, `days` after Monday 28 Sep: { d, m, wd } (wd 0 = Monday). */
  function dayAfter(days) {
    var d = 28 + days, m = 9;
    if (d > 30) { d -= 30; m = 10; }
    return { d: d, m: m, wd: days % 7 };
  }

  var LINKS = 5;

  /** State after step n: question qi, links shown so far, the solved chain for it, and earlier answers. */
  function stateAt(p, n) {
    var ev = EVIDENCE[p.evidence], qs = questions(p);
    var qi = n === 0 ? 0 : Math.min(qs.length - 1, Math.floor((n - 1) / LINKS));
    var link = n === 0 ? 0 : n - qi * LINKS;
    var avail = availability(p.askedDaysAgo, p.ipamCollected);
    var r = solve(ev, IP, qs[qi], avail);
    var prior = [];
    for (var i = 0; i < qi; i++) prior.push({ at: qs[i], answer: solve(ev, IP, qs[i], avail).answer });
    return {
      question: { ip: IP, at: qs[qi], qi: qi, of: qs.length },
      link: link,
      leaseEvents: ev.leaseEvents, logonEvents: ev.logonEvents, dnsNow: ev.dnsNow,
      retentionDays: RETENTION, askedDaysAgo: p.askedDaysAgo, asked: dayAfter(p.askedDaysAgo), avail: avail,
      cover: r.cover, start: r.start, logons: r.logons, on: r.on,
      chain: r.chain.slice(0, link),
      answer: link >= LINKS ? r.answer : null,
      prior: prior
    };
  }

  var logic = {
    IP: IP, AT: AT, DAY_START: DAY_START, DAY_END: DAY_END, RETENTION: RETENTION, EVIDENCE: EVIDENCE, LINKS: LINKS,
    defaults: { evidence: 'one-user', at: AT['14:32'], askedDaysAgo: 0, ipamCollected: true },
    steps: function (p) { return questions(p).length * LINKS; },
    initial: function (p) { return stateAt(p, 0); },
    step: function (s, n, p) { return stateAt(p, n); },
    chronological: chronological, coveringLease: coveringLease, leaseStart: leaseStart, logonsInLease: logonsInLease,
    stillOn: stillOn, availability: availability, solve: solve, questions: questions, dayAfter: dayAfter,
    /** "hh:mm" of minutes after midnight (data, not language). */
    clock: function (t) { var h = Math.floor(t / 60), m = t % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
