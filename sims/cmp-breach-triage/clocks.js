/* SPDX-License-Identifier: AGPL-3.0-or-later
   The incident-timeline model with its reporting clocks: an incident starts, is detected, is triaged; the end of the
   triage is awareness, and awareness starts the clocks: NIS2's early warning (24 h) and incident notification
   (72 h), and its final report (one calendar month after the notification was submitted); GDPR's personal-data
   breach notification (72 h). Hour clocks run through nights and weekends; the people who file the reports work
   either around the clock (on call) or in office hours only.
   // from sims/cmp-incident-clocks/clocks.js @ b48f936, unchanged (COMMON.md §6: models/clocks.js does not exist yet).
   cmp-breach-triage uses only the GDPR clock (significant: false); the rules are cmp-incident-clocks' SPEC.md 1-8,
   and their tests are kept in this folder's sim.test.js.
   Catalogue §5.24: cmp-incident-clocks is the hub of this model (cmp-breach-triage adds the decision), so it is pure
   functions over plain data, no words and no dependencies, ready for the coordinator to promote to
   models/clocks.js unchanged (models/README.md). In a page it registers on globalThis.SimdeckModels.clocks; under
   node it is module.exports.
   Time is in whole hours from Monday 00:00 of the reference week; `week0` is that Monday as a day number (days since
   1970-01-01, which was a Thursday). No time zones, daylight saving or public holidays. */
(function (root) {
  'use strict';

  /** The clocks, in reporting order (rule 7). `hours` from awareness, or `months` from another clock's filing. */
  var CLOCKS = [
    { id: 'ew', regime: 'nis2', hours: 24 },
    { id: 'notif', regime: 'nis2', hours: 72 },
    { id: 'final', regime: 'nis2', months: 1, after: 'notif' },
    { id: 'gdpr', regime: 'gdpr', hours: 72 }
  ];
  /** Office hours: weekdays, from 08:00 to 16:00 (the hour slots 8…15). Illustrative. */
  var OFFICE = { from: 8, to: 16 };
  /** Hours of work each filing takes (illustrative); the final report is not simulated, only its deadline. */
  var PREP = { ew: 1, notif: 3, gdpr: 3 };
  /** The deadline the misconception would use: 24 hours from the start of the attack. */
  var GHOST_HOURS = 24;

  // ── calendar (rule 1) ──

  /** Civil date of a day number: { y, m (1-12), d, wd (0 = Monday) }. */
  function civil(dn) {
    var z = dn + 719468;
    var era = Math.floor(z / 146097);
    var doe = z - era * 146097;
    var yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    var doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    var mp = Math.floor((5 * doy + 2) / 153);
    var d = doy - Math.floor((153 * mp + 2) / 5) + 1;
    var m = mp < 10 ? mp + 3 : mp - 9;
    var y = yoe + era * 400 + (m <= 2 ? 1 : 0);
    return { y: y, m: m, d: d, wd: ((dn % 7) + 7 + 3) % 7 };
  }

  /** Day number of a civil date (inverse of civil). */
  function dayNumber(y, m, d) {
    y -= m <= 2 ? 1 : 0;
    var era = Math.floor(y / 400);
    var yoe = y - era * 400;
    var doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
    var doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
    return era * 146097 + doe - 719468;
  }

  function daysIn(y, m) {
    return [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  }

  /** The same day number k calendar months later; a day the target month lacks becomes its last day (rule 1). */
  function addMonths(y, m, d, k) {
    var mi = (m - 1) + k;
    var ny = y + Math.floor(mi / 12), nm = ((mi % 12) + 12) % 12 + 1;
    return { y: ny, m: nm, d: Math.min(d, daysIn(ny, nm)) };
  }

  /** An hour of the reference week as a moment: { day (from week0), hour (0-23), wd, y, m, d }. */
  function moment(h, week0) {
    var day = Math.floor(h / 24);
    var c = civil(week0 + day);
    return { day: day, hour: h - day * 24, wd: c.wd, y: c.y, m: c.m, d: c.d };
  }

  // ── working time (rules 2-3) ──

  /** Is hour slot h (from h to h + 1) worked? On call: always. Office: weekdays 08:00-16:00. */
  function isWorking(h, mode) {
    if (mode === 'oncall') return true;
    if (mode !== 'office') throw new Error('clocks: unknown reporting mode ' + mode);
    var day = Math.floor(h / 24), hour = h - day * 24;
    var wd = ((day % 7) + 7) % 7;
    return wd < 5 && hour >= OFFICE.from && hour < OFFICE.to;
  }

  /** Work `need` hours starting at hour `start`: { done (the hour the last worked slot ends), slots: [{ from, to }] }.
      need 0 finishes at once. Worked slots are merged into runs. */
  function work(start, need, mode) {
    var t = start, left = need, slots = [];
    while (left > 0) {
      if (isWorking(t, mode)) {
        var last = slots[slots.length - 1];
        if (last && last.to === t) last.to = t + 1;
        else slots.push({ from: t, to: t + 1 });
        left -= 1;
      }
      t += 1;
    }
    return { done: left === need ? start : slots[slots.length - 1].to, slots: slots };
  }

  // ── the timeline (rules 4-8) ──

  /** incident = { attack (hour), detectAfter (h), triage (h), significant, personal, reporting ('office'|'oncall'),
      week0, prep? }. Returns the timeline: the three moments, the clocks in CLOCKS order, the ghost and the work. */
  function timeline(inc) {
    if (civil(inc.week0).wd !== 0) throw new Error('clocks: week0 must be a Monday');
    isWorking(0, inc.reporting);
    var prep = inc.prep || PREP;
    var attack = inc.attack;
    var detected = attack + inc.detectAfter;
    var aware = detected + inc.triage;
    var t = aware, byId = {}, clocks = [], work_ = [];
    CLOCKS.forEach(function (c) {
      var running = c.regime === 'nis2' ? !!inc.significant : !!inc.personal;
      var out = { id: c.id, regime: c.regime, running: running, start: null, due: null, filed: null, inTime: null,
        late: null, spare: null };
      if (running && c.hours) {
        out.start = aware;
        out.due = aware + c.hours;
        var w = work(t, prep[c.id], inc.reporting);
        t = w.done;
        out.filed = w.done;
        out.inTime = out.filed <= out.due;
        out.late = out.inTime ? 0 : out.filed - out.due;
        out.spare = out.inTime ? out.due - out.filed : 0;
        w.slots.forEach(function (s) { work_.push({ id: c.id, from: s.from, to: s.to }); });
      } else if (running && c.months) {
        var from = byId[c.after].filed;
        var m = moment(from, inc.week0);
        var dd = addMonths(m.y, m.m, m.d, c.months);
        out.start = from;
        out.due = (dayNumber(dd.y, dd.m, dd.d) - inc.week0) * 24 + m.hour;
      }
      byId[c.id] = out;
      clocks.push(out);
    });
    var hourly = clocks.filter(function (c) { return c.running && c.filed !== null; });
    var lastFiled = hourly.length ? Math.max.apply(null, hourly.map(function (c) { return c.filed; })) : null;
    return {
      attack: attack, detected: detected, aware: aware,
      clocks: clocks,
      work: work_,
      lastFiled: lastFiled,
      ghost: { due: attack + GHOST_HOURS, beforeDetect: detected - (attack + GHOST_HOURS) },
      met: clocks.filter(function (c) { return c.inTime === true; }).length,
      missed: clocks.filter(function (c) { return c.inTime === false; }).length
    };
  }

  var model = {
    CLOCKS: CLOCKS, OFFICE: OFFICE, PREP: PREP, GHOST_HOURS: GHOST_HOURS,
    civil: civil, dayNumber: dayNumber, daysIn: daysIn, addMonths: addMonths, moment: moment,
    isWorking: isWorking, work: work, timeline: timeline
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {}).clocks = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
