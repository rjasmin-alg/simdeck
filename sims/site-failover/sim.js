/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for site-failover: a site fails, the DNS record moves to the standby site, users follow as their cached
   answers expire; sessions, recent writes and a licence bound to a machine do not follow (SPEC.md).
   One step = the next event. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var AGE = [525, 120, 120, 1490, 525, 3570];   // seconds since each user's last lookup at t = 0 (SPEC.md "Users")
  var COPY_S = 60;                              // failback: the copy of B's writes to A takes 60 s (derived)
  var REHOST_DAYS = 5;                          // DR estate inventory/licences.csv: "vendor rehost 5 working days"
  var ADDR = { A: '203.0.113.19', B: '198.51.100.36' };
  var NAME = 'chat.quillmoor.example';

  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function other(site) { return site === 'A' ? 'B' : 'A'; }

  /** Seconds left in user i's cache at t = 0 (rule 1: it asked AGE[i] s ago and asks again on every expiry). */
  function remaining(i, ttl) { return ttl - (AGE[i] % ttl); }

  /** When the record changes (rule 2): after `threshold` failed checks, or when a person decides; failback: after the
      copy. */
  function tcOf(p) {
    if (p.scenario === 'failback') return COPY_S;
    return p.auto ? p.checkInterval * p.threshold : p.decideMin * 60;
  }

  /** The events of the run, one per step (SPEC.md "Events"). Windows end at Tc + k · ttl / 4. */
  function eventsOf(p) {
    var tc = tcOf(p), ev = [];
    if (p.scenario === 'failback') {
      ev.push({ code: 'return', t: 0 }, { code: 'copy', t: COPY_S }, { code: 'change', t: tc });
    } else {
      ev.push({ code: 'fail', t: 0 });
      if (p.auto) for (var k = 1; k <= p.threshold; k++) ev.push({ code: 'check', k: k, t: k * p.checkInterval });
      ev.push({ code: 'change', t: tc });
    }
    for (var w = 1; w <= 4; w++) ev.push({ code: 'window', k: w, t: tc + w * p.ttl / 4 });
    ev.push({ code: 'summary', t: tc + p.ttl });
    return ev;
  }

  // phase bars, the rpo-rto pattern (consecutive from t = 0): from sims/rpo-rto/sim.js @ 6183a2e (compute's phases)
  function phasesOf(p) {
    var tc = tcOf(p);
    if (p.scenario === 'failback') {
      return [{ id: p.copyBack ? 'copy' : 'nocopy', from: 0, to: tc }, { id: 'caches', from: tc, to: tc + p.ttl }];
    }
    var det = Math.min(p.checkInterval * p.threshold, tc);
    return [{ id: 'detect', from: 0, to: det }, { id: 'decide', from: det, to: tc }, { id: 'caches', from: tc, to: tc + p.ttl }];
  }

  /** Apply every lookup due at or before t: earliest first, then by id. A lookup gets the record as it is now; the
      caller applies a change at t afterwards, so a lookup in the same second gets the old answer (rule 8). */
  function lookUpTo(s, t, p) {
    for (;;) {
      var u = null;
      s.users.forEach(function (x) { if (x.exp <= t && (!u || x.exp < u.exp)) u = x; });   // ties: lowest id (list order)
      if (!u) return;
      var at = u.exp, got = s.record.addr;
      u.exp = at + p.ttl;
      if (got === u.addr) {
        if (s.renewed.indexOf(u.id) < 0) s.renewed.push(u.id);
        continue;
      }
      u.addr = got;                                    // rule 1: the new answer arrives only now
      u.movedAt = at;
      if (u.session !== got) { u.session = got; u.relogins += 1; }      // rule 4: sessions stay where they were made
      u.lostData = s.sites[got].data === 'old';                          // rule 7: back on A without B's writes
      s.switched.push(u.id);
      var r = s.renewed.indexOf(u.id);
      if (r >= 0) s.renewed.splice(r, 1);
    }
  }

  function byId(a, b) { return a - b; }

  var logic = {
    AGE: AGE, COPY_S: COPY_S, REHOST_DAYS: REHOST_DAYS, ADDR: ADDR, NAME: NAME,
    remaining: remaining, tcOf: tcOf, eventsOf: eventsOf, phasesOf: phasesOf,

    defaults: {
      scenario: 'failover', ttl: 300, checkInterval: 10, threshold: 3, auto: true, decideMin: 30,
      licenceBound: true, copyBack: true, clockMin: -1, lagS: 5
    },

    steps: function (p) { return eventsOf(p).length; },

    initial: function (p) {
      var back = p.scenario === 'failback';
      var on = back ? 'B' : 'A';
      var users = AGE.map(function (_, i) {
        return { id: i + 1, addr: on, exp: remaining(i, p.ttl), session: on, relogins: 0, movedAt: null, lostData: false };
      });
      var tc = tcOf(p);
      return {
        t: 0, scenario: back ? 'failback' : 'failover', event: { code: 'start' },
        phase: back ? 'switched' : 'normal',
        sites: back
          ? { A: { up: false, data: 'none', readOnly: false }, B: { up: true, data: 'current', readOnly: false } }
          : { A: { up: true, data: 'current', readOnly: false }, B: { up: true, data: 'replica', readOnly: false } },
        record: { addr: on, ttl: p.ttl, changedAt: null },
        users: users,
        health: { fails: 0, threshold: p.threshold },
        replicaLagS: p.lagS, lostWritesS: 0,
        licence: { boundTo: 'A', movable: !p.licenceBound },
        switched: [], renewed: [],
        tc: tc, end: tc + p.ttl, phases: phasesOf(p)
      };
    },

    step: function (prev, n, p) {
      var ev = eventsOf(p)[n - 1];
      var s = copy(prev);
      s.switched = []; s.renewed = [];
      if (!ev) return s;
      lookUpTo(s, ev.t, p);
      switch (ev.code) {
        case 'fail':
          s.sites.A.up = false; s.sites.A.data = 'none'; s.phase = 'failed';
          break;
        case 'check':
          break;
        case 'change':
          s.record.addr = other(s.record.addr); s.record.changedAt = ev.t;
          if (s.scenario === 'failover') { s.phase = 'switched'; s.sites.B.data = 'current'; s.lostWritesS = p.lagS; }
          break;
        case 'return':
          s.sites.A.up = true; s.sites.A.data = 'old'; s.phase = 'failback'; s.health.fails = 0;
          if (p.copyBack) s.sites.B.readOnly = true;        // rule 7: freeze B first, then copy
          break;
        case 'copy':
          if (p.copyBack) s.sites.A.data = 'current';
          break;
        default:
          break;
      }
      // rule 2: every check while A is down fails; the count stops at the threshold (also with a person deciding)
      if (s.scenario === 'failover' && !s.sites.A.up) s.health.fails = Math.min(p.threshold, Math.floor(ev.t / p.checkInterval));
      s.switched.sort(byId); s.renewed.sort(byId);         // rule 8: listed in id order
      s.t = ev.t;
      s.event = ev.k ? { code: ev.code, k: ev.k } : { code: ev.code };
      return s;
    },

    /** Does the licensed work run at this site? (rule 6) */
    licenceWorks: function (s, site) {
      return s.sites[site].up && (s.licence.movable || s.licence.boundTo === site);
    },

    /** Does user u reach a live site? */
    reaches: function (s, u) { return s.sites[u.addr].up; },

    /** The user holding a stale address longest (caption): { id, left } or null; ties: lowest id. */
    longestStale: function (s) {
      var best = null;
      s.users.forEach(function (u) {
        if (u.addr === s.record.addr) return;
        var left = u.exp - s.t;
        if (!best || left > best.left) best = { id: u.id, left: left };
      });
      return best;
    },

    /** Totals for the summary: the last move, the worst case (Tc + ttl), relogins, users on old data. */
    stats: function (s) {
      var moved = s.users.filter(function (u) { return u.movedAt !== null; });
      return {
        last: moved.length ? Math.max.apply(null, moved.map(function (u) { return u.movedAt; })) : null,
        worst: s.end,
        relogins: s.users.reduce(function (a, u) { return a + u.relogins; }, 0),
        lostData: s.users.filter(function (u) { return u.lostData; }).length
      };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
