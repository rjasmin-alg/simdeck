/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-account-lockout: account lockout with two DCs, the PDC emulator counting every DC's bad attempts.
   One event per step (a logon attempt, a stale session's retry, a password change or a pause). Rules and expected
   numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var CLIENTS = ['PC-A', 'PC-B', 'phone'];      // tie-break order within a minute (T1)
  var DCS = ['DC01', 'DC02'];
  var PDC = 'DC01';
  var DC_OF = { 'PC-A': 'DC02', 'PC-B': 'DC01', phone: 'DC02' };
  var SCENARIOS = ['one-pc', 'two-pcs', 'stale-phone', 'old-password', 'reset-window'];

  function range(a, b) { var out = []; for (var i = a; i < b; i++) out.push(i); return out; }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** The script of a scenario, unsorted: { t, kind: 'logon' | 'retry' | 'change' | 'tick', client, pwd }.
      pwd: 'typo', 'current' (whatever is current at that moment) or a password label. */
  function script(p) {
    var r = p.retryMin;
    function logon(t, client, pwd) { return { t: t, kind: 'logon', client: client, pwd: pwd }; }
    switch (p.scenario) {
      case 'two-pcs':
        return [logon(0, 'PC-A', 'typo'), logon(1, 'PC-A', 'typo'), logon(2, 'PC-B', 'typo'), logon(2, 'PC-A', 'typo'),
          logon(3, 'PC-B', 'typo'), logon(4, 'PC-A', 'current')];
      case 'stale-phone':
        return [{ t: 0, kind: 'change', client: 'PC-A', pwd: 'P3' }]
          .concat(range(0, 5).map(function (k) { return { t: k * r, kind: 'retry', client: 'phone', pwd: 'P2' }; }))
          .concat([logon(4 * r + 5, 'PC-A', 'current')]);
      case 'old-password':
        return range(0, 6).map(function (t) { return logon(t, 'PC-A', 'P1'); }).concat([logon(6, 'PC-A', 'current')]);
      case 'reset-window':
        return range(0, 4).map(function (t) { return logon(t, 'PC-A', 'typo'); })
          .concat([{ t: 34, kind: 'tick', client: null, pwd: null }])
          .concat(range(34, 38).map(function (t) { return logon(t, 'PC-A', 'typo'); }));
      default: // one-pc
        return range(0, 5).map(function (t) { return logon(t, 'PC-A', 'typo'); }).concat([logon(5, 'PC-A', 'current')]);
    }
  }

  /** Tie-break T1: by minute, a tick first, then PC-A, PC-B, phone; equal keys keep their script order. */
  function rank(e) { return e.kind === 'tick' ? -1 : CLIENTS.indexOf(e.client); }
  function events(p) {
    return script(p).map(function (e, i) { return { e: e, i: i }; })
      .sort(function (a, b) { return a.e.t - b.e.t || rank(a.e) - rank(b.e) || a.i - b.i; })
      .map(function (x) { return x.e; });
  }

  /** The policy's own constraint: reset ≤ duration when the duration is not 0. */
  function resetOf(p) { return p.durationMin > 0 ? Math.min(p.resetMin, p.durationMin) : p.resetMin; }

  /** Rules 4 and 5 at minute t: an expired lockout ends, a count with no bad attempt for resetMin goes to 0.
      Returns what changed: { unlocked, reset: [dc ids] }. Mutates s. */
  function passTime(s, t, p) {
    var out = { unlocked: false, reset: [] };
    if (s.locked && p.durationMin > 0 && t >= s.locked.since + p.durationMin) { // T3
      s.locked = null;
      DCS.forEach(function (d) { s.dcs[d].lockoutTime = null; });
      out.unlocked = true;
    }
    var rm = resetOf(p);
    DCS.forEach(function (d) {
      var dc = s.dcs[d];
      if (dc.bad > 0 && dc.lastBad !== null && t - dc.lastBad >= rm) { dc.bad = 0; out.reset.push(d); } // T2
    });
    s.t = t;
    return out;
  }

  /** Rule 3: the PDC's count first (T4), then the authenticating DC's. */
  function checkLock(s, dc, t, p) {
    if (p.threshold <= 0 || s.locked) return null;
    var by = s.dcs[PDC].bad >= p.threshold ? PDC : s.dcs[dc].bad >= p.threshold ? dc : null;
    if (!by) return null;
    s.locked = { since: t, by: by };
    DCS.forEach(function (d) { s.dcs[d].lockoutTime = t; }); // urgent replication: every DC in the same step
    return by;
  }

  /** One attempt of client with password label pw. Returns the event record for the page. Mutates s. */
  function attempt(s, e, pw, p) {
    var dc = DC_OF[e.client];
    var rec = { dc: dc, typed: pw, result: null, chained: false, counted: [], pdcReset: false, lockedBy: null,
      role: pw === s.pwd.current ? 'current' : pw === 'typo' ? 'typo' : s.pwd.history.indexOf(pw) };
    if (s.locked) { rec.result = 'locked'; return rec; }                 // rule 5: refused, not counted, not chained
    if (pw === s.pwd.current) {                                         // rule 4: success clears the count
      rec.result = 'ok';
      if (dc !== PDC && s.dcs[PDC].bad > 0) rec.pdcReset = true;
      s.dcs[dc].bad = 0;
      s.dcs[PDC].bad = 0;
      return rec;
    }
    rec.chained = dc !== PDC;                                           // rule 2
    if (p.historyCheck && s.pwd.history.slice(0, 2).indexOf(pw) >= 0) { // rule 6, T5
      rec.result = 'old';
      return rec;
    }
    rec.result = 'bad';
    s.dcs[PDC].bad += 1; s.dcs[PDC].lastBad = e.t; rec.counted.push(PDC);
    if (dc !== PDC) { s.dcs[dc].bad += 1; s.dcs[dc].lastBad = e.t; rec.counted.push(dc); }
    rec.lockedBy = checkLock(s, dc, e.t, p);
    return rec;
  }

  var logic = {
    CLIENTS: CLIENTS, DCS: DCS, PDC: PDC, DC_OF: DC_OF, SCENARIOS: SCENARIOS,

    defaults: { scenario: 'one-pc', threshold: 5, resetMin: 30, durationMin: 30, retryMin: 10, historyCheck: true },

    /** One step per event: 6 / 6 / 7 / 7 / 9. */
    steps: function (p) { return events(p).length; },

    events: events,
    resetOf: resetOf,

    initial: function (p) {
      var sessions = p.scenario === 'stale-phone' ? [{ client: 'phone', pwdUsed: 'P2', retryMin: p.retryMin }] : [];
      return {
        t: 0,
        pwd: { current: 'P2', history: ['P1', 'P0'] },
        dcs: { DC01: { bad: 0, lastBad: null, lockoutTime: null }, DC02: { bad: 0, lastBad: null, lockoutTime: null } },
        locked: null,
        sessions: sessions,
        log: [],
        last: null
      };
    },

    step: function (prev, n, p) {
      var s = clone(prev);
      var e = events(p)[n - 1];
      if (!e) return s;
      var time = passTime(s, e.t, p);
      var rec;
      if (e.kind === 'tick') {
        rec = { result: 'tick' };
      } else if (e.kind === 'change') {                                  // rule 8
        rec = { dc: DC_OF[e.client], typed: e.pwd, result: 'changed', chained: DC_OF[e.client] !== PDC, old: s.pwd.current };
        s.pwd.history.unshift(s.pwd.current);
        s.pwd.current = e.pwd;
      } else {
        var pw = e.kind === 'retry' ? s.sessions[0].pwdUsed : e.pwd === 'current' ? s.pwd.current : e.pwd; // rule 7
        rec = attempt(s, e, pw, p);
      }
      rec.n = n; rec.t = e.t; rec.kind = e.kind; rec.client = e.client;
      rec.unlocked = time.unlocked; rec.reset = time.reset;
      s.last = rec;
      s.log.push({ n: n, t: e.t, kind: e.kind, client: e.client, result: rec.result, DC01: s.dcs.DC01.bad, DC02: s.dcs.DC02.bad,
        locked: !!s.locked });
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
