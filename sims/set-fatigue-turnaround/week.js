/* SPDX-License-Identifier: AGPL-3.0-or-later
   A shooting week of calls and wraps (catalogue §5.25: set-fatigue-turnaround keeps its own week of calls and wraps in
   the shooting day's format, minutes from the first day's midnight). Every day is planned with the same call and
   length; a day may run over; three remedies change the week: wrap on time (overruns cut), a shorter next day (the day
   after an overrun starts later by it and keeps its planned wrap) and a fixed minimum rest (the next call moves so that
   everyone's own rest reaches it). Pure plain data and functions, no strings and no page code, so the coordinator can
   promote it to models/set-week.js unchanged. Registers on globalThis.SimdeckModels['set-week']; node tests require()
   it. Rules: SPEC.md rules 1–5. */
(function (root) {
  'use strict';

  var DAY = 1440;          // minutes in a day
  var CALL = 420;          // the planned call, 07:00
  var MAX_OVERRUN = 240;   // minutes a day may run over (illustrative)
  var MIN_REST = 660;      // Directive 2003/88/EC art. 3: 11 consecutive hours of daily rest

  /** Rule 1: an overrun in whole minutes within 0 … MAX_OVERRUN; anything that is not a number is 0. */
  function clampOverrun(x) {
    var n = typeof x === 'number' && isFinite(x) ? Math.round(x) : 0;
    return Math.max(0, Math.min(MAX_OVERRUN, n));
  }

  /** Rules 1–4: the unit's days.
   *  opts: { days, length (planned call → wrap, min), overruns [min per day], onTime, shorter,
   *          minRest, extraRest (min the rest must also cover beyond MIN_REST: pre-calls and packing up, rule 4) }.
   *  Returns [{ d, call, wrap, len, overrun, planned, base }] with call and wrap in minutes from day 0's midnight;
   *  `planned` is the planned call of that day (d·DAY + CALL); `base` the call before the minimum rest moves it
   *  (later than planned after an overrun with the shorter next day). */
  function schedule(opts) {
    var n = opts.days || 5, out = [];
    for (var d = 0; d < n; d++) {
      var o = opts.onTime ? 0 : clampOverrun((opts.overruns || [])[d]);
      var prev = d > 0 ? out[d - 1].overrun : 0;
      var later = opts.shorter ? prev : 0;
      var base = d * DAY + CALL + later;
      var call = base;
      if (d > 0 && opts.minRest) call = Math.max(base, out[d - 1].wrap + MIN_REST + (opts.extraRest || 0));
      var len = opts.length + o - later;
      out.push({ d: d, call: call, wrap: call + len, len: len, overrun: o, planned: d * DAY + CALL, base: base });
    }
    return out;
  }

  /** Rule 5: turnaround of each night, the unit's wrap → the next call (one fewer than days). */
  function turnarounds(days) {
    var out = [];
    for (var d = 0; d + 1 < days.length; d++) out.push(days[d + 1].call - days[d].wrap);
    return out;
  }

  var model = {
    DAY: DAY, CALL: CALL, MAX_OVERRUN: MAX_OVERRUN, MIN_REST: MIN_REST,
    clampOverrun: clampOverrun, schedule: schedule, turnarounds: turnarounds
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {})['set-week'] = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
