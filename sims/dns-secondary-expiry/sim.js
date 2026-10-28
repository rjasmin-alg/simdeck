/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for dns-secondary-expiry: a primary P and a secondary S for one zone, S's three SOA timers (refresh, retry,
   expire) and a client that asks S. The primary can be edited (with or without a serial bump), switched off and
   switched on again; S checks P's serial every REFRESH, retries every RETRY when P does not answer, and stops being
   authoritative (SERVFAIL) EXPIRE seconds after its last successful check. One step = the next interesting moment;
   a run of identical checks is one step with a count. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Times are seconds from the start of the run.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MAX_STEPS = 20;
  var NONE = -1;
  var SERIAL_SPACE = 4294967296; // 2^32, RFC 1982 with SERIAL_BITS = 32
  var HALF = 2147483648;         // 2^31

  /**
   * The two zones. `lab`: UL ch19's lab.example (SOA serial 2026090301, refresh 3600, retry 900, expire 604800); the
   * secondary ns2 and the edit of klijent are derived. `estate`: the estate's qm.internal from the student-visible
   * zone file and the secondary's zone listing: t = 0 is the secondary's last successful check before the primary is
   * switched off (Tue 2026-11-10 17:02, on the 3-hour grid of its last transfer, 2026-11-02 05:02).
   */
  var SCENES = {
    lab: {
      zone: 'lab.example', primary: 'ns1.lab.example', secondary: 'ns2.lab.example', serial: 2026090301,
      records: [['posluzitelj', 'A', '192.168.180.1'], ['klijent', 'A', '192.168.180.100']],
      qname: 'klijent', edit: { name: 'klijent', value: '192.168.180.101' }, lastXfer: 0, epoch: null
    },
    estate: {
      zone: 'qm.internal', primary: 'loom', secondary: 'qm-dc02', serial: 2019052414,
      records: [['loom', 'A', '10.40.1.5'], ['rq', 'A', '10.44.10.30']],
      qname: 'rq', edit: { name: 'rq', value: '10.44.10.31' }, lastXfer: -734400, epoch: '2026-11-10T17:02'
    }
  };

  /** Equal times: expiry first (rule 4 tie-break), then the check, then the actions in this order. */
  var ACTIONS = ['edit', 'kill', 'revive'];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // ── serial numbers (RFC 1982) ──

  /** a is greater than b in serial number arithmetic; equal and undefined (exactly 2^31 apart) are not greater. */
  function serialGt(a, b) {
    return a !== b && ((a < b && b - a > HALF) || (a > b && a - b < HALF));
  }
  function serialInc(a) { return (a + 1) % SERIAL_SPACE; }

  // ── the run's actions ──

  /** Scheduled actions from the params, in time order (ties: edit, kill, revive). NONE (−1) means not scheduled. */
  function actions(p) {
    return ACTIONS.map(function (k) { return { kind: k, at: p[k + 'At'] }; })
      .filter(function (a) { return typeof a.at === 'number' && a.at >= 0; })
      .sort(function (a, b) { return a.at - b.at || ACTIONS.indexOf(a.kind) - ACTIONS.indexOf(b.kind); });
  }

  function nextAction(s, p) {
    return actions(p).filter(function (a) { return s.acted.indexOf(a.kind) < 0; })[0] || null;
  }

  // ── S's timers ──

  function nextCheckAt(S) { return S.nextRefresh !== null ? S.nextRefresh : S.nextRetry; }
  /** The next protocol moment: the check or the expiry, whichever comes first. */
  function nextMomentAt(S) { return S.expired ? nextCheckAt(S) : Math.min(nextCheckAt(S), S.expireAt); }

  /** Rule 2: the copy S takes from P (records and serial), and a successful check resets the expire clock. */
  function succeed(S, P, t, soa, transfer) {
    if (transfer) { S.records = clone(P.records); S.serial = P.serial; S.lastXfer = t; }
    S.lastOk = t;
    S.expireAt = t + soa.expire;
    S.expired = false;
    S.mode = 'ok';
    S.nextRefresh = t + soa.refresh;
    S.nextRetry = null;
  }

  /**
   * One protocol moment at t: the expiry, if due (rule 4: at exactly lastOk + EXPIRE the zone is expired), then the
   * check, if due (rules 1–3, 6). Returns what happened. Mutates s.
   */
  function moment(s, t) {
    var S = s.secondary, P = s.primary, soa = s.soa, out = { t: t, expired: false, check: null };
    if (!S.expired && S.expireAt <= t) {
      S.expired = true;
      S.expiredAt = t;
      S.mode = 'expired';
      out.expired = true;
    }
    if (nextCheckAt(S) === t) {
      var kind = S.nextRefresh !== null ? 'refresh' : 'retry';
      var outcome;
      if (!P.up) {
        // rule 3: no answer, try again in RETRY; the refresh timer is replaced by the retry timer
        outcome = 'fail';
        S.nextRefresh = null;
        S.nextRetry = t + soa.retry;
        if (!S.expired) S.mode = 'retrying';
      } else if (S.expired || serialGt(P.serial, S.serial)) {
        // rule 2 (and after an expiry: S has no usable copy, so it takes the whole zone again)
        outcome = 'transfer';
        succeed(S, P, t, soa, true);
      } else {
        // rule 2: the serial is not greater, so S keeps its copy even if P's records differ; still a success
        outcome = 'current';
        succeed(S, P, t, soa, false);
      }
      out.check = { kind: kind, outcome: outcome, serialP: P.up ? P.serial : null, serialS: S.serial };
    }
    s.t = t;
    return out;
  }

  /** A moment is routine when it is only a check like the previous one, with no action in between and nothing taken. */
  function routine(m, s) {
    return !m.expired && !!m.check && m.check.outcome !== 'transfer' && !s.actedSinceCheck &&
      !!s.lastCheck && s.lastCheck.kind === m.check.kind && s.lastCheck.outcome === m.check.outcome;
  }

  function applyAction(s, a, p) {
    var P = s.primary, sc = SCENES[s.scene], done = true;
    if (a.kind === 'edit') {
      if (!P.up) done = false;
      else {
        P.records[sc.edit.name] = sc.edit.value;
        if (p.bumpSerial) P.serial = serialInc(P.serial);
      }
    } else if (a.kind === 'kill') {
      if (P.up) P.up = false; else done = false;
    } else if (P.up) done = false;
    else P.up = true;
    s.t = a.at;
    s.acted.push(a.kind);
    s.lastActionAt = a.at;
    if (done) s.actedSinceCheck = true;
    return { kind: a.kind, t: a.at, applied: done, bumped: a.kind === 'edit' && done && !!p.bumpSerial };
  }

  /** What the client gets from S now (rule 5: the last copy until expiry; then SERVFAIL). */
  function answer(s) {
    var S = s.secondary, q = SCENES[s.scene].qname;
    return S.expired ? { qname: q, rcode: 'SERVFAIL', value: null } : { qname: q, rcode: 'NOERROR', value: S.records[q] };
  }

  function sameRecords(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  /** The marks: which parts changed between two states. */
  function marks(prev, s) {
    var out = [], P0 = prev.primary, P1 = s.primary, S0 = prev.secondary, S1 = s.secondary;
    if (P0.up !== P1.up || P0.serial !== P1.serial || !sameRecords(P0.records, P1.records)) out.push('primary');
    if (S0.serial !== S1.serial || !sameRecords(S0.records, S1.records) || S0.mode !== S1.mode) out.push('secondary');
    if (S0.nextRefresh !== S1.nextRefresh) out.push('refresh');
    if (S0.nextRetry !== S1.nextRetry) out.push('retry');
    if (S0.expireAt !== S1.expireAt || S0.expired !== S1.expired) out.push('expire');
    if (JSON.stringify(prev.client) !== JSON.stringify(s.client)) out.push('client');
    return out;
  }

  /** The run ends when nothing new can happen without the user: see SPEC.md, "The end of a run". */
  function horizon(s, p) {
    return (s.lastActionAt === null ? 0 : s.lastActionAt) + p.expire;
  }
  function isDone(s, p) {
    if (nextAction(s, p)) return false;
    if (!s.primary.up) return s.secondary.expired;
    return nextMomentAt(s.secondary) > horizon(s, p);
  }

  /** What comes next: a protocol moment (at equal times before any action) or an action. */
  function peek(s, p) {
    var a = nextAction(s, p), tm = nextMomentAt(s.secondary);
    if (a && a.at < tm) return { kind: 'action', at: a.at, action: a };
    return { kind: 'moment', at: tm };
  }

  function noteCheck(s, m) {
    if (!m.check) return;
    s.lastCheck = { t: m.t, kind: m.check.kind, outcome: m.check.outcome };
    s.actedSinceCheck = false;
  }

  function initial(p) {
    var sc = SCENES[p.scene] || SCENES.lab;
    var recs = {};
    sc.records.forEach(function (r) { recs[r[0]] = r[2]; });
    var soa = { refresh: p.refresh, retry: p.retry, expire: p.expire };
    var s = {
      t: 0,
      scene: SCENES[p.scene] ? p.scene : 'lab',
      soa: soa,
      primary: { up: true, serial: sc.serial, records: clone(recs) },
      secondary: { serial: sc.serial, records: clone(recs), lastOk: 0, lastXfer: sc.lastXfer, mode: 'ok', expired: false,
        expiredAt: null, expireAt: soa.expire, nextRefresh: soa.refresh, nextRetry: null },
      lastCheck: { t: 0, kind: 'refresh', outcome: 'current' },
      actedSinceCheck: false,
      lastActionAt: null,
      acted: [],
      ev: { kind: 'start', t: 0 },
      client: null,
      changed: [],
      log: [],
      done: false
    };
    s.client = answer(s);
    s.done = isDone(s, p);
    return s;
  }

  /**
   * State after one more step: an action, one protocol moment that is not routine, or a run of routine moments
   * (with its count, first and last time). Nothing after the end of the run (isDone) is processed.
   */
  function step(s0, n, p) {
    var s = clone(s0);
    var nx = peek(s, p);
    if (nx.kind === 'action') {
      s.ev = applyAction(s, nx.action, p);
      s.ev.kind = 'action';
      s.ev.act = nx.action.kind;
    } else {
      var m = moment(s, nx.at);
      if (!routine(m, s0)) {
        s.ev = { kind: 'moment', t: m.t, expired: m.expired, check: m.check };
        noteCheck(s, m);
      } else {
        var count = 1, from = m.t, last = m;
        noteCheck(s, m);
        while (!isDone(s, p)) {
          var nn = peek(s, p);
          if (nn.kind !== 'moment') break;
          var trial = clone(s);
          var mm = moment(trial, nn.at);
          if (!routine(mm, s)) break;
          noteCheck(trial, mm);
          s = trial;
          last = mm;
          count++;
        }
        s.ev = { kind: 'run', t: last.t, from: from, count: count, check: last.check };
      }
    }
    s.client = answer(s);
    s.changed = marks(s0, s);
    s.log = s0.log.concat([logEntry(s)]);
    s.done = isDone(s, p);
    return s;
  }

  function logEntry(s) {
    var e = s.ev, out = { t: e.t, kind: e.kind };
    if (e.kind === 'action') { out.act = e.act; out.applied = e.applied; out.bumped = e.bumped; }
    if (e.kind === 'run') { out.from = e.from; out.count = e.count; }
    if (e.kind !== 'action') { out.expired = !!e.expired; out.check = e.check ? e.check.kind : null; out.outcome = e.check ? e.check.outcome : null; }
    return out;
  }

  /** The number of steps of a run, up to MAX_STEPS. */
  function steps(p) {
    var s = initial(p), n = 0;
    while (!s.done && n < MAX_STEPS) { n++; s = step(s, n, p); }
    return n;
  }

  var logic = {
    /** Parameter defaults: the book-edit preset (UL ch19 zone, an edit with a serial bump at 600 s). */
    defaults: { scene: 'lab', refresh: 3600, retry: 900, expire: 604800, bumpSerial: true, editAt: 600, killAt: NONE, reviveAt: NONE },

    SCENES: SCENES,
    MAX_STEPS: MAX_STEPS,
    NONE: NONE,

    steps: steps,
    initial: initial,
    step: step,

    // exported for the page and the tests
    serialGt: serialGt,
    serialInc: serialInc,
    actions: actions,
    nextAction: nextAction,
    nextCheckAt: nextCheckAt,
    nextMomentAt: nextMomentAt,
    horizon: horizon,
    isDone: isDone,
    answer: answer,
    routine: routine,
    moment: moment
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
