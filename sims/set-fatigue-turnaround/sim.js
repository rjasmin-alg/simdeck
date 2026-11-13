/* SPDX-License-Identifier: AGPL-3.0-or-later
   set-fatigue-turnaround: a five-day shooting week and three crew members (a grip, a make-up artist, a camera
   assistant). The unit's calls and wraps come from week.js; here each crew member's own call and release, their travel,
   the sleep left inside their rest, the sleep debt carried through the week, and the hours awake (plus the sleep owed)
   at the end of the drive home, with its risk. An explorer: the state follows from the params at once.
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. Rules: SPEC.md. */
(function (root) {
  'use strict';

  var week = typeof module === 'object' && module.exports
    ? require('./week.js')
    : root.SimdeckModels['set-week'];

  var DAYS = 5;
  var MORNING = 45;    // waking → leaving home (min, illustrative)
  var EVENING = 45;    // home → asleep (min, illustrative)
  var NEED = 480;      // sleep need (min, illustrative)
  var FAR = 60;        // travel from which someone counts as far (min); exactly FAR is far (rule 7)
  var ROOM = 15;       // travel from a room near the location (min)
  var TRAVEL_MIN = 15, TRAVEL_MAX = 150, TRAVEL_STEP = 15;
  var OVERRUN_STEP = 30;
  var RAISED = 960;    // 16 h: raised from here (illustrative)
  var HIGH = 1020;     // 17 h: research compares 17–19 h awake with 0.05 % blood alcohol

  /** The crew, in the fixed order every list of them is given in (SPEC.md "The week"). */
  var CREW = [
    { id: 'grip', precall: 0, afterWrap: 60, key: 'tGrip' },
    { id: 'makeup', precall: 60, afterWrap: 30, key: 'tMakeup' },
    { id: 'ac', precall: 0, afterWrap: 45, key: 'tAc' }
  ];
  /** Rule 4: what everyone's own rest must cover beyond the minimum: the largest pre-call + packing up. */
  var EXTRA_REST = CREW.reduce(function (m, c) { return Math.max(m, c.precall + c.afterWrap); }, 0);
  var OVERRUN_KEYS = ['o1', 'o2', 'o3', 'o4', 'o5'];
  var FAR_MODES = ['none', 'room', 'driver'];
  var WHO = CREW.map(function (c) { return c.id; });

  var defaults = {
    length: 660, minRest: false, onTime: false, shorter: false, far: 'none', who: 'ac',
    o1: 0, o2: 0, o3: 0, o4: 0, o5: 0, tGrip: 30, tMakeup: 45, tAc: 90
  };

  function withDefaults(over) {
    var p = {};
    Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; });
    Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
    return p;
  }

  var OVER2 = { o1: 120, o2: 120, o3: 120, o4: 120, o5: 120 };
  function plus(a, b) { var o = {}; [a, b].forEach(function (x) { Object.keys(x).forEach(function (k) { o[k] = x[k]; }); }); return o; }
  /** Presets (SPEC.md "Presets"): only what differs from the defaults. */
  var presets = [
    { id: 'planned', params: {} },
    { id: 'overrun', params: OVER2 },
    { id: 'min-rest', params: plus(OVER2, { minRest: true }) },
    { id: 'shorter', params: plus(OVER2, { shorter: true }) },
    { id: 'room', params: plus(OVER2, { far: 'room' }) },
    { id: 'driver', params: plus(OVER2, { far: 'driver' }) }
  ].map(function (x) { return { id: x.id, params: withDefaults(x.params) }; });

  /** Rule 7: travel in whole minutes within TRAVEL_MIN … TRAVEL_MAX; not a number → the crew member's default. */
  function clampTravel(x, dflt) {
    var n = typeof x === 'number' && isFinite(x) ? Math.round(x) : dflt;
    return Math.max(TRAVEL_MIN, Math.min(TRAVEL_MAX, n));
  }

  /** Rule 10: the risk level of an effective number of minutes awake. Exactly 16 h is raised, exactly 17 h high. */
  function riskOf(effective) {
    return effective >= HIGH ? 'high' : effective >= RAISED ? 'raised' : 'low';
  }

  /** Rules 6–11 for one crew member over the unit's days. */
  function member(c, days, p) {
    var travelSet = clampTravel(p[c.key], defaults[c.key]);
    var far = travelSet >= FAR;
    var roomed = far && p.far === 'room';
    var travel = roomed ? ROOM : travelSet;
    var atWheel = !(far && p.far === 'driver');
    var debt = 0, out = [];
    days.forEach(function (day, d) {
      var ownCall = day.call - c.precall, release = day.wrap + c.afterWrap;
      var wake = ownCall - travel - MORNING, home = release + travel;
      var awake = home - wake;
      var row = {
        d: d, ownCall: ownCall, release: release, wake: wake, home: home, awake: awake,
        debtBefore: debt, effective: awake + debt, risk: riskOf(awake + debt),
        rest: null, avail: null, sleep: null, asleep: null
      };
      if (d + 1 < days.length) {
        row.rest = (days[d + 1].call - c.precall) - release;
        row.avail = row.rest - 2 * travel - MORNING - EVENING;
        row.sleep = Math.min(Math.max(row.avail, 0), NEED);
        row.asleep = home + EVENING;
        debt += NEED - row.sleep;
      }
      out.push(row);
    });
    var worst = -1;
    if (atWheel) out.forEach(function (r, d) { if (worst < 0 || r.effective > out[worst].effective) worst = d; });
    return { id: c.id, travel: travel, travelSet: travelSet, far: far, roomed: roomed, atWheel: atWheel, days: out, debtEnd: debt, worst: worst };
  }

  /** The whole state from the params. */
  function derive(p) {
    var days = week.schedule({
      days: DAYS, length: p.length, overruns: OVERRUN_KEYS.map(function (k) { return p[k]; }),
      onTime: !!p.onTime, shorter: !!p.shorter, minRest: !!p.minRest, extraRest: EXTRA_REST
    });
    return {
      days: days,
      turnaround: week.turnarounds(days),
      crew: CREW.map(function (c) { return member(c, days, p); }),
      who: WHO.indexOf(p.who) >= 0 ? p.who : defaults.who,
      extraRest: EXTRA_REST
    };
  }

  /** Rule 12: the patch for a − / + click on a day's overrun or a crew member's travel, or null at a bound. */
  function bump(p, key, dir) {
    var isO = OVERRUN_KEYS.indexOf(key) >= 0;
    var crew = CREW.filter(function (c) { return c.key === key; })[0];
    if (!isO && !crew) return null;
    var cur = isO ? week.clampOverrun(p[key]) : clampTravel(p[key], defaults[key]);
    var step = isO ? OVERRUN_STEP : TRAVEL_STEP;
    var lo = isO ? 0 : TRAVEL_MIN, hi = isO ? week.MAX_OVERRUN : TRAVEL_MAX;
    var next = Math.max(lo, Math.min(hi, cur + (dir < 0 ? -step : step)));
    if (next === cur) return null;
    var patch = {};
    patch[key] = next;
    return patch;
  }

  /** The page's "changed" mark: [crew id, day] whose risk level differs between two states, crew order then day. */
  function changedRisk(a, b) {
    if (!a) return [];
    var out = [];
    b.crew.forEach(function (c, i) {
      c.days.forEach(function (r, d) {
        var o = a.crew[i].days[d];
        if (o.risk !== r.risk || a.crew[i].atWheel !== c.atWheel) out.push([c.id, d]);
      });
    });
    return out;
  }

  var logic = {
    week: week, DAYS: DAYS, MORNING: MORNING, EVENING: EVENING, NEED: NEED, FAR: FAR, ROOM: ROOM,
    TRAVEL_MIN: TRAVEL_MIN, TRAVEL_MAX: TRAVEL_MAX, TRAVEL_STEP: TRAVEL_STEP, OVERRUN_STEP: OVERRUN_STEP,
    RAISED: RAISED, HIGH: HIGH, CREW: CREW, EXTRA_REST: EXTRA_REST, OVERRUN_KEYS: OVERRUN_KEYS,
    FAR_MODES: FAR_MODES, WHO: WHO,
    defaults: defaults, presets: presets, withDefaults: withDefaults,
    initial: derive, derive: derive, clampTravel: clampTravel, riskOf: riskOf, bump: bump, changedRisk: changedRisk
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
