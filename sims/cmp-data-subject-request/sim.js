/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-data-subject-request: a former customer of a small made-up firm asks for a copy of their data, or for
   its erasure. The answer is due one month after the request was received. The customer's data sits in eight places;
   the team searches only the places its data map (record of processing activities) lists: all eight, the systems
   only, or what people remember. An erasure removes what was found, keeps what a law requires, and leaves the
   backups to age out (the backup rule of cmp-retention-hold, rule 7, at day granularity).
   Stepper, 11 steps (SPEC.md rule 8). Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   Rules: SPEC.md; words: strings.js. */
(function (root) {
  'use strict';

  /** Rule 1: the calendar. Day 0 is Monday 1 March 2027, the day the request is received. */
  var START = { y: 2027, m: 3, d: 1 };

  function leap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function monthLen(y, m) { return [31, leap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }

  /** Day number (from day 0) to a calendar date. Days are never negative here. */
  function dateOf(day) {
    var y = START.y, m = START.m, d = START.d + day;
    while (d > monthLen(y, m)) { d -= monthLen(y, m); m++; if (m > 12) { m = 1; y++; } }
    return { y: y, m: m, d: d };
  }
  /** A calendar date (on or after day 0) to its day number. */
  function dayOf(dt) {
    var n = 0, y = START.y, m = START.m;
    while (y < dt.y || (y === dt.y && m < dt.m)) { n += monthLen(y, m); m++; if (m > 12) { m = 1; y++; } }
    return n + dt.d - START.d;
  }
  /** Rule 1: k months after a day: the same day of the month, or the month's last day when it has no such day. */
  function addMonths(day, k) {
    var dt = dateOf(day);
    var t = dt.m - 1 + k;
    var y = dt.y + Math.floor(t / 12), m = (t % 12) + 1;
    return dayOf({ y: y, m: m, d: Math.min(dt.d, monthLen(y, m)) });
  }

  var DUE = addMonths(0, 1);         // rule 1: one month after receipt (day 31, 1 April 2027)
  var EXT = addMonths(0, 3);         // … two more months for a complex request, if extended in time (day 92)

  /** Rule 3: the eight places the customer's data really is, in the order the team would go through them. days: how
      long one search takes when the map names the place and its owner. lists: the maps that list it (g complete,
      p systems only, n none: what people remember). act: what an erasure does there. */
  var PLACES = [
    { id: 'crm', days: 1, lists: 'gpn', act: 'erase' },
    { id: 'invoices', days: 2, lists: 'gpn', act: 'keep' },
    { id: 'support', days: 2, lists: 'gpn', act: 'erase' },
    { id: 'newsletter', days: 3, lists: 'gp', act: 'processor' },
    { id: 'sales', days: 2, lists: 'g', act: 'erase' },
    { id: 'export', days: 1, lists: 'g', act: 'erase' },
    { id: 'test', days: 2, lists: 'g', act: 'erase' },
    { id: 'backups', days: 1, lists: 'gp', act: 'age' }
  ];
  var MAPS = ['good', 'partial', 'none'];
  var KINDS = ['access', 'erasure'];
  var BACKUPS = [1, 3, 6, 12, 36];   // rule 6: months one backup is kept
  var NOTICED = [0, 21];             // rule 2: days the request waits before it reaches the person in charge
  var LOGGING = 1;                   // rule 2: logging it and confirming identity
  var ASK = 4;                       // rule 3: extra days per place without a map (asking who has what)
  var ANSWER = 2;                    // rule 4: days to put the answer together

  /** Rule 8: the steps. 0 received, 1 logged, 2–9 the eight places, 10 the answer, 11 afterwards. */
  var STAGES = ['received', 'logged'].concat(PLACES.map(function (x) { return 'place'; }), ['answer', 'after']);
  var STEPS = STAGES.length - 1;

  var defaults = { kind: 'access', map: 'good', noticed: 2, backup: 3 };

  /** Presets, SPEC.md table; expected outcomes there. */
  var presets = [
    { id: 'good', params: { kind: 'access', map: 'good', noticed: 2, backup: 3 }, step: 0 },
    { id: 'partial', params: { kind: 'access', map: 'partial', noticed: 2, backup: 3 }, step: 0 },
    { id: 'none', params: { kind: 'access', map: 'none', noticed: 2, backup: 3 }, step: 0 },
    { id: 'late', params: { kind: 'access', map: 'none', noticed: 14, backup: 3 }, step: 0 },
    { id: 'erase-good', params: { kind: 'erasure', map: 'good', noticed: 2, backup: 3 }, step: 0 },
    { id: 'erase-none', params: { kind: 'erasure', map: 'none', noticed: 2, backup: 3 }, step: 0 }
  ];

  function num(v) {
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '') return Number(v);
    return NaN;
  }

  /** Rule 9: params from the controls or the URL, made valid. */
  function normalise(p) {
    p = p || {};
    var noticed = num(p.noticed);
    if (!Number.isFinite(noticed)) noticed = defaults.noticed;
    var backup = num(p.backup);
    return {
      kind: KINDS.indexOf(p.kind) >= 0 ? p.kind : defaults.kind,
      map: MAPS.indexOf(p.map) >= 0 ? p.map : defaults.map,
      noticed: Math.min(NOTICED[1], Math.max(NOTICED[0], Math.round(noticed))),
      backup: BACKUPS.indexOf(backup) >= 0 ? backup : defaults.backup
    };
  }

  /** Rule 3: is the place on the team's list under this map? */
  function listed(place, map) { return place.lists.indexOf(map.charAt(0)) >= 0; }

  /** Rule 5: what the request does to a place the team found. Access: the data goes into the copy (backups: the
      answer states how long they keep it). Erasure: erased, erased by the processor on instruction, kept because a
      law requires it, or recorded as in the backups until they age out. */
  function outcome(place, kind) {
    if (kind === 'access') return place.act === 'age' ? 'noted' : 'found';
    return { erase: 'erased', processor: 'processor', keep: 'kept', age: 'recorded' }[place.act];
  }

  /** Rules 2–7: the whole request, independent of the step: each place's day and outcome, the answer and the
      backups. */
  function plan(q) {
    var day = q.noticed + LOGGING, lastErase = null;
    var places = PLACES.map(function (pl) {
      if (!listed(pl, q.map)) return { id: pl.id, onList: false, status: 'missed', day: null, took: 0 };
      var took = pl.days + (q.map === 'none' ? ASK : 0);
      day += took;
      var st = outcome(pl, q.kind);
      if (st === 'erased') lastErase = day;
      return { id: pl.id, onList: true, status: st, day: day, took: took };
    });
    var answer = day + ANSWER;
    // rule 6 (cmp-retention-hold rule 7, in days): the last backup holding the erased data was taken the night before
    // the last erasure; it is kept `backup` months, so the data is in the backups while now < gone.
    var gone = lastErase !== null ? addMonths(lastErase, q.backup) : null;   // lastErase is set by an erasure only
    var count = function (st) { return places.filter(function (x) { return x.status === st; }).length; };
    return {
      places: places,
      logged: q.noticed + LOGGING,
      answer: answer,
      onTime: answer <= DUE,
      late: Math.max(0, answer - DUE),
      found: places.filter(function (x) { return x.onList; }).length,
      missed: count('missed'),
      erased: count('erased') + count('processor'),
      kept: count('kept'),
      backupsListed: places[PLACES.length - 1].onList,
      lastErase: lastErase,
      gone: gone,
      still: places.filter(function (x) { return !x.onList && x.id !== 'backups'; }).length
    };
  }

  /** Rule 6: are the erased data still in the backups on day `now`? */
  function inBackup(gone, now) { return gone !== null && now < gone; }

  /** Rule 8: the state after step n. */
  function build(p, n) {
    var q = normalise(p);
    n = Math.max(0, Math.min(STEPS, Math.round(Number(n) || 0)));
    var stage = STAGES[n];
    var pl = plan(q);
    var at = stage === 'place' ? n - 2 : null;          // the place this step visits
    var day;
    if (stage === 'received') day = 0;
    else if (stage === 'logged') day = pl.logged;
    else if (stage === 'place') {
      day = pl.logged;                                   // a place not on the list takes no time
      for (var i = 0; i <= at; i++) if (pl.places[i].onList) day = pl.places[i].day;
    } else if (stage === 'answer') day = pl.answer;
    else day = pl.gone !== null ? Math.max(pl.answer, pl.gone) : pl.answer;
    var reached = stage === 'answer' || stage === 'after' ? PLACES.length : stage === 'place' ? at + 1 : 0;
    var places = pl.places.map(function (x, i) {
      var y = Object.assign({}, x);
      if (i >= reached) y.status = 'wait';
      return y;
    });
    return {
      n: n, stage: stage, at: at, place: at === null ? null : PLACES[at].id, day: day, params: q,
      places: places, logged: pl.logged, answer: pl.answer, due: DUE, ext: EXT, onTime: pl.onTime, late: pl.late,
      found: pl.found, missed: pl.missed, erased: pl.erased, kept: pl.kept, still: pl.still,
      backupsListed: pl.backupsListed, lastErase: pl.lastErase, gone: pl.gone,
      inBackup: inBackup(pl.gone, day),
      done: stage === 'answer' || stage === 'after'
    };
  }

  /** Rule 10: the sentences of the caption at this state (the page turns them into words). */
  function captionKeys(s) {
    var q = s.params, er = q.kind === 'erasure';
    switch (s.stage) {
      case 'received': return [er ? 'cReceivedErase' : 'cReceivedAccess', 'cClock'];
      case 'logged': return [q.noticed > 0 ? 'cLoggedLate' : 'cLogged', 'cMap_' + q.map];
      case 'place':
        var x = s.places[s.at];
        if (!x.onList) return [x.id === 'backups' ? (er ? 'cMissedBackupsErase' : 'cMissedBackups') : 'cMissed'];
        return ['cDone_' + x.status, s.day > s.due ? 'cOver' : s.day === s.due ? 'cLeftDue' : 'cLeft'];
      case 'answer':
        var lead = s.onTime ? (s.day === s.due ? 'cAnswerOnDue' : 'cAnswerOnTime') : 'cAnswerLate';
        if (er) return [lead, s.missed > 0 ? 'cErasePart' : 'cEraseAll'];
        return [lead, s.missed > 0 ? 'cAccessPart' : 'cAccessAll'];
      default:
        if (!er) return [s.missed > 0 ? 'cAfterAccessPart' : 'cAfterAccessAll'];
        return [s.backupsListed ? 'cAfterRecorded' : 'cAfterUnrecorded', s.still > 0 ? 'cAfterStill' : 'cAfterClean'];
    }
  }

  var logic = {
    START: START, DUE: DUE, EXT: EXT, PLACES: PLACES, MAPS: MAPS, KINDS: KINDS, BACKUPS: BACKUPS, NOTICED: NOTICED,
    LOGGING: LOGGING, ASK: ASK, ANSWER: ANSWER, STAGES: STAGES,
    defaults: defaults,
    presets: presets,
    steps: STEPS,
    dateOf: dateOf,
    dayOf: dayOf,
    addMonths: addMonths,
    normalise: normalise,
    listed: listed,
    outcome: outcome,
    plan: plan,
    inBackup: inBackup,
    captionKeys: captionKeys,
    initial: function (p) { return build(p, 0); },
    step: function (s, n, p) { return build(p, n); }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
