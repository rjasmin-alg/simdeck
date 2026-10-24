/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for rpo-rto: recovery points, an incident and the recovery phases on one timeline (rules in SPEC.md).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON (numbers, strings, booleans, arrays).
   Time is in whole minutes from Monday 00:00 of the week `week` (days since 1970-01-01, a Monday); targets are in
   hours. The page loads this as a classic script (window.SimLogic); node tests require() it. An explorer: the state
   is a pure function of the params, initial(params) = compute(params), no steps. */
(function (root) {
  'use strict';

  var DAY = 1440;
  var WEEK = 7 * DAY;
  /** Scheduled copies start at 01:40 on Monday and every `interval` from there (DR estate: the VM backup log). */
  var ANCHOR = 100;
  var PHASES = ['detect', 'decide', 'restore', 'verify'];

  var defaults = {
    week: 20780,          // Monday 2026-11-23 (S1's week)
    interval: 1440,       // minutes between scheduled copies: 15, 60, 1440, 10080
    jobMin: 12,           // minutes a copy takes to complete (01:40 → 01:52 in the estate)
    failedRuns: 0,        // the newest n scheduled copies before the incident failed
    replica: false,       // a replica kept in step with the system
    kind: 'loss',         // 'loss': the system stops (power, hardware); 'damage': it runs on with the damage
    incidentAt: 5165,     // Thursday 14:05
    damageBefore: 0,      // minutes the damage started before the incident (corruption found late)
    detect: 30, decide: 60, restore: 240, verify: 60,
    rpoH: 24, rtoH: 8
  };

  /** Runs whose start is at or before t have index ≤ this (floor division, also for t before the anchor). */
  function runIndexAtOrBefore(t, interval) { return Math.floor((t - ANCHOR) / interval); }

  /**
   * Rule 1, 4 and the failed runs: why a scheduled copy is or is not a good recovery point. A copy holds the data as
   * at its start; it restores only if it was completed.
   */
  function classify(start, done, failed, S, I, kind) {
    if (failed) return 'failed';                            // the job did not produce a copy that restores
    if (kind === 'loss' && done > I) return 'unfinished';   // still being written when the system stopped
    if (start <= S) return 'good';                          // its data is from before the damage (tie: good)
    return 'damaged';                                       // taken after the damage began: it carries it (rule 4)
  }

  function compute(p) {
    var I = p.incidentAt, S = I - p.damageBefore, iv = p.interval;
    var kLast = runIndexAtOrBefore(I, iv);                 // newest run that started at or before the incident
    var failedFrom = kLast - p.failedRuns + 1;             // runs k ≥ failedFrom failed
    var t = I, phases = [];
    PHASES.forEach(function (id) { phases.push({ id: id, from: t, to: t + p[id] }); t += p[id]; });
    var detectEnd = phases[0].to, back = t;

    function run(k) {
      var start = ANCHOR + k * iv, done = start + p.jobMin;
      var failed = p.failedRuns > 0 && k >= failedFrom;  // after the incident only while the failures go on
      return { t: start, done: done, kind: 'copy', state: classify(start, done, failed, S, I, p.kind), after: start > I };
    }

    // Walk back from the newest run to the newest good one (rule 1), then one more for the spacing.
    var points = [], lastCopy = null, k = kLast;
    for (; ; k--) {
      var r = run(k);
      points.unshift(r);
      if (r.state === 'good') { lastCopy = r; break; }
    }
    points.unshift(run(k - 1));
    // Damage keeps running: copies taken after the incident until it is noticed carry it (rule 4). A stopped system
    // takes none.
    if (p.kind === 'damage') for (k = kLast + 1; ANCHOR + k * iv <= detectEnd; k++) points.push(run(k));

    // A replica stops where the system stopped; under damage it copies the damage on (rule 4).
    var replica = null;
    if (p.replica) {
      var at = p.kind === 'loss' ? I : detectEnd;
      replica = { t: at, done: at, kind: 'replica', state: p.kind === 'loss' && at <= S ? 'good' : 'damaged', after: at > I };
    }

    var lastGood = replica && replica.state === 'good' && replica.t >= lastCopy.t ? replica : lastCopy;
    var lossM = I - lastGood.t, downM = back - I;
    var lost = points.filter(function (x) { return x.t > lastGood.t; });
    var count = function (st) { return lost.filter(function (x) { return x.state === st; }).length; };
    return {
      incident: I, damageStart: S, back: back,
      points: points, replica: replica,
      lastGood: lastGood.t, lastGoodKind: lastGood.kind,
      phases: phases,
      lossM: lossM, downM: downM, lossH: lossM / 60, downH: downM / 60,
      rpoMet: lossM <= p.rpoH * 60, rtoMet: downM <= p.rtoH * 60,   // rule 5: equal counts as met
      worstM: iv + p.jobMin, avgM: iv / 2 + p.jobMin,               // rule 2
      skipped: { failed: count('failed'), unfinished: count('unfinished'), damaged: count('damaged') }
    };
  }

  /** The one thing the caption should say about this state (page picks the words). */
  function captionKey(s, p) {
    if (s.replica && s.replica.state === 'damaged') return s.skipped.damaged > 0 ? 'replicaAndCopies' : 'replica';
    if (s.skipped.failed > 0) return 'failed';
    if (p.detect > p.rtoH * 60) return 'detect';   // detection alone over the target: RTO is missed whatever follows
    if (s.skipped.damaged > 0) return 'damaged';
    if (s.skipped.unfinished > 0) return 'unfinished';
    if (s.lastGoodKind === 'replica') return 'replicaGood';
    return 'both';
  }

  /** Civil date of a day number (days since 1970-01-01): { y, m (1–12), d, wd (0 = Monday) }. */
  function civil(z) {
    var wd = ((z % 7) + 7 + 3) % 7;  // 1970-01-01 was a Thursday
    z += 719468;
    var era = Math.floor(z / 146097), doe = z - era * 146097;
    var yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    var doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    var mp = Math.floor((5 * doy + 2) / 153);
    var d = doy - Math.floor((153 * mp + 2) / 5) + 1, m = mp < 10 ? mp + 3 : mp - 9;
    return { y: yoe + era * 400 + (m <= 2 ? 1 : 0), m: m, d: d, wd: wd };
  }

  /** A minute of the model as a calendar moment: date of day week + floor(t / 1440), hour, minute. */
  function moment(t, week) {
    var day = Math.floor(t / DAY), min = t - day * DAY, c = civil(week + day);
    c.h = Math.floor(min / 60); c.min = min % 60;
    return c;
  }

  /** A duration in minutes as { d, h, m } parts (days only from 48 h up, so 32 h 30 min stays in hours). */
  function parts(min) {
    var d = min >= 2 * DAY ? Math.floor(min / DAY) : 0, rest = min - d * DAY;
    return { d: d, h: Math.floor(rest / 60), m: rest % 60 };
  }

  var presets = [
    { id: 'nightly-backup', params: {} },
    { id: 'failing-backups', params: { week: 20752, incidentAt: 6 * DAY + 845, failedRuns: 49 } },
    { id: 'found-on-monday', params: { incidentAt: 5 * DAY + 1420, detect: 1950 } },
    { id: 'ransomware', params: { week: 20766, interval: 60, incidentAt: 130, kind: 'damage', replica: true, detect: 340 } },
    { id: 'replica-not-backup', params: { week: 20787, incidentAt: 2 * DAY + 1000, kind: 'damage', replica: true } }
  ];

  var logic = {
    DAY: DAY, WEEK: WEEK, ANCHOR: ANCHOR, PHASES: PHASES,
    defaults: defaults,
    presets: presets,
    initial: compute,
    compute: compute,
    classify: classify,
    captionKey: captionKey,
    civil: civil,
    moment: moment,
    parts: parts
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
