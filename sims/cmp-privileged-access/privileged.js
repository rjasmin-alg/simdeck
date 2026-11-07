/* SPDX-License-Identifier: AGPL-3.0-or-later
   Privileged access over time (catalogue §5.24; it sits beside cmp-jml-drift's people × roles × rights model but reads
   nothing from it, only its generator): a
   team of administrators holds admin rights either all the time (standing) or only in windows they request (just in
   time: requested, approved, limited in time, logged); credentials are stolen at random hours, and each theft either
   carries admin rights at that hour or not. A break-glass account, for when the identity system itself is down, is
   followed through six stages. SPEC.md rules 1-8.
   Pure functions over plain data, no words and no dependencies, ready to be promoted to models/ unchanged
   (models/README.md). In a page it registers on globalThis.SimdeckModels['privileged-access']; under node it is
   module.exports. */
(function (root) {
  'use strict';

  /** Rule 1: the week and the year. Hour h of the week is day ⌊h / 24⌋ (0 = Monday) at hour h mod 24. */
  var WEEK = 168;
  var YEAR = 8760;                // 365 × 24: hours a standing right is there
  var WEEKS = 52;                 // weeks a year of just-in-time windows
  var WORK_DAYS = 5;              // Monday to Friday
  var WORK_START = 8;             // working hours 08:00-16:00
  var WORK_LEN = 8;
  var WORK_WEEK = WORK_DAYS * WORK_LEN;   // 40
  var LENGTHS = [1, 2, 4, 8];     // hours one elevation lasts; each divides the working day
  var MIN_TEAM = 2;
  var MAX_TEAM = 8;
  var MAX_PER = 10;               // elevations a week per person
  var SCHEDULE_SALT = 7919;       // the schedule's stream is rng(seed + 7919), the thefts' rng(seed)

  /** mulberry32, the same generator as Simdeck.rng in kit/kit.js.
      // from sims/cmp-jml-drift/access.js @ 59b7f46 */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Rule 2: the most elevations a week of `len` hours that fit the working week without overlapping. */
  function maxPer(len) { return Math.min(MAX_PER, WORK_WEEK / len); }
  /** Rule 2: slot s of length len → its first hour of the week. Slots run Monday 08:00 onwards, day by day. */
  function slotStart(s, len) {
    var perDay = WORK_LEN / len;
    return Math.floor(s / perDay) * 24 + WORK_START + (s % perDay) * len;
  }

  /** Rule 2: each person's elevation windows in a week, as sorted first hours. Person by person in id order, `per`
      distinct slots of the working week are drawn by a partial Fisher-Yates shuffle (exactly `per` draws each) from
      rng(seed + 7919). The same every week of the year. */
  function schedule(seed, team, per, len) {
    var r = rng(seed + SCHEDULE_SALT), n = WORK_WEEK / len, out = [];
    for (var i = 0; i < team; i++) {
      var slots = [];
      for (var s = 0; s < n; s++) slots.push(s);
      for (var j = 0; j < per; j++) {
        var k = j + Math.floor(r() * (n - j));
        var x = slots[j]; slots[j] = slots[k]; slots[k] = x;
      }
      out.push(slots.slice(0, per).map(function (s) { return slotStart(s, len); }).sort(function (a, b) { return a - b; }));
    }
    return out;
  }

  /** Rule 3: is a person admin at hour h of the week? Standing: always. Just in time: inside a window, which covers
      its first hour and ends before first + len (an hour exactly at the end is outside). */
  function adminAt(mode, starts, len, h) {
    if (mode === 'standing') return true;
    for (var i = 0; i < starts.length; i++) if (h >= starts[i] && h < starts[i] + len) return true;
    return false;
  }

  /** Rule 4: the thefts. Each takes three draws from rng(seed), always three: who (⌊u₁ · team⌋), then the hour: at
      any hour ⌊u₂ · 168⌋; in working hours day ⌊u₂ · 5⌋ at 08 + ⌊u₃ · 8⌋. The thefts do not depend on the mode or on
      the schedule, so standing and just in time are compared on the same thefts. */
  function thefts(seed, count, team, when) {
    var r = rng(seed), out = [];
    for (var i = 0; i < count; i++) {
      var u1 = r(), u2 = r(), u3 = r();
      var hour = when === 'work'
        ? Math.floor(u2 * WORK_DAYS) * 24 + WORK_START + Math.floor(u3 * WORK_LEN)
        : Math.floor(u2 * WEEK);
      out.push({ person: Math.floor(u1 * team), hour: hour });
    }
    return out;
  }

  /** Rule 5: the expected share of thefts that carry admin rights: the share of the theft hours a person is admin. */
  function expected(mode, per, len, when) {
    if (mode === 'standing') return 1;
    return per * len / (when === 'work' ? WORK_WEEK : WEEK);
  }
  /** Rule 5: admin hours a year per person; elevations a year for the team (each requested, approved and logged). */
  function adminHours(mode, per, len) { return mode === 'standing' ? YEAR : per * len * WEEKS; }
  function elevations(mode, team, per) { return mode === 'standing' ? 0 : team * per * WEEKS; }

  /** Rule 5: each theft marked with whether it carried admin rights. */
  function judge(list, sched, mode, len) {
    return list.map(function (x) {
      return { person: x.person, hour: x.hour, admin: adminAt(mode, sched[x.person], len, x.hour) };
    });
  }

  /** Rule 6-8: the break-glass account. Stages 0 sealed, 1 the identity system is down (or, without an outage, an
      ordinary day), 2 opened, 3 the alert, 4 restored and reviewed, 5 resealed. */
  var STAGES = ['sealed', 'outage', 'opened', 'alert', 'review', 'resealed'];
  /** Rule 7: the outcome, from stage 4 on: justified (outage, alert), known (outage, no alert: the use is known from
      the outage, the missing alert is a finding), caught (no outage, alert: misuse found within minutes), unnoticed
      (no outage, no alert). Before stage 4 there is none. */
  function glassOutcome(stage, outage, alert) {
    if (stage < 4) return null;
    if (outage) return alert ? 'justified' : 'known';
    return alert ? 'caught' : 'unnoticed';
  }
  /** Rule 8: what holds at a stage. */
  function glass(stage, outage, alert) {
    var outcome = glassOutcome(stage, outage, alert);
    var reviewed = stage >= 4 && (outage || alert);
    return {
      stage: stage,
      name: STAGES[stage],
      idpDown: outage && stage >= 1 && stage <= 3,     // nobody can sign in as admin or get an elevation approved
      open: stage >= 2 && !(stage >= 5 && reviewed),    // the password is out of the safe
      alerted: alert && stage >= 3,
      reviewed: reviewed,
      resealed: stage >= 5 && reviewed,                 // password changed, new halves sealed
      outcome: outcome
    };
  }

  var api = {
    WEEK: WEEK, YEAR: YEAR, WEEKS: WEEKS, WORK_DAYS: WORK_DAYS, WORK_START: WORK_START, WORK_LEN: WORK_LEN,
    WORK_WEEK: WORK_WEEK, LENGTHS: LENGTHS, MIN_TEAM: MIN_TEAM, MAX_TEAM: MAX_TEAM, MAX_PER: MAX_PER,
    SCHEDULE_SALT: SCHEDULE_SALT, STAGES: STAGES,
    rng: rng, maxPer: maxPer, slotStart: slotStart, schedule: schedule, adminAt: adminAt, thefts: thefts,
    expected: expected, adminHours: adminHours, elevations: elevations, judge: judge,
    glassOutcome: glassOutcome, glass: glass
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.SimdeckModels = root.SimdeckModels || {})['privileged-access'] = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
