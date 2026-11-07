/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-retention-hold: a small made-up firm keeps three classes of records (rejected job applications,
   customer contracts, personnel files of people who left), each for a period counted from its trigger (the hiring
   decision, the end of the contract, the end of employment). After the period the record must go (storage
   limitation): a deletion routine (none, once a year, every month) removes what is due. A dispute needs the records it
   touches while it runs; a legal hold tells the routine to skip them (announced only, in the routine, never lifted, or
   on everything). A deleted record stays in the backup set until the last backup that holds it ages out.
   Explorer: the state is a pure function of the params (compute), read at the end of the chosen year. Months are
   integers, 0 = January 2020. Rules: SPEC.md; words: strings.js.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. `life`, `needed`, `skipped` and `measure`
   are pure over plain data, so cmp-data-subject-request can copy the backup ageing. */
(function (root) {
  'use strict';

  var Y0 = 2020;                                      // rule 1: the window, January 2020 …
  var YEARS = 12;                                     // … December 2031
  var MONTHS = YEARS * 12;                            // months 0…143
  var CLASSES = ['app', 'contract', 'staff'];         // rule 2: record classes, in the stage's order

  /** Rule 2: the records. from: first month it exists (0 = it was there before the window); trigger: the month the
      period starts counting (hiring decision, end of contract, last month of employment); dispute: which dispute
      touches it. Names are data (made up). */
  var RECORDS = [
    { id: 'a2020', cls: 'app', name: '2020', from: 0, trigger: 2 },
    { id: 'a2022', cls: 'app', name: '2022', from: 27, trigger: 29 },
    { id: 'a2025', cls: 'app', name: '2025', from: 67, trigger: 69 },
    { id: 'a2028', cls: 'app', name: '2028', from: 96, trigger: 98 },
    { id: 'sjever', cls: 'contract', name: 'Sjever', from: 0, trigger: 17 },
    { id: 'lipa', cls: 'contract', name: 'Lipa', from: 3, trigger: 37, dispute: 'customer' },
    { id: 'most', cls: 'contract', name: 'Most', from: 20, trigger: 58 },
    { id: 'orbita', cls: 'contract', name: 'Orbita', from: 38, trigger: 79 },
    { id: 'kvadrat', cls: 'contract', name: 'Kvadrat', from: 61, trigger: 119 },
    { id: 'iva', cls: 'staff', name: 'Iva', from: 0, trigger: 10 },
    { id: 'marko', cls: 'staff', name: 'Marko', from: 0, trigger: 27, dispute: 'employee' },
    { id: 'petra', cls: 'staff', name: 'Petra', from: 14, trigger: 72 },
    { id: 'luka', cls: 'staff', name: 'Luka', from: 0, trigger: 101 }
  ];

  var RET_KEYS = { app: 'retApp', contract: 'retContract', staff: 'retStaff' };
  var RET_STEPS = {                                   // rule 3: retention periods the stage's steppers offer, months
    app: [3, 6, 12, 24, 36, 60],
    contract: [12, 24, 36, 60, 84, 120],
    staff: [12, 24, 36, 60, 72, 120]
  };
  var BACKUP_STEPS = [1, 3, 6, 12, 24, 36, 60, 120];  // rule 7: how long one backup is kept, months
  var PURGES = ['none', 'yearly', 'monthly'];
  var DISPUTES = ['none', 'customer', 'employee'];
  var HOLDS = ['paper', 'held', 'forgotten', 'all'];
  var FROM_MIN = Y0, FROM_MAX = Y0 + YEARS - 1;       // rule 5: a dispute starts in January of one of these years
  var LEN_MIN = 1, LEN_MAX = 5;                       // … and runs whole years

  /** Rule 4: does the deletion routine run in month m? Once a year: in January. */
  function runs(purge, m) {
    if (purge === 'monthly') return true;
    if (purge === 'yearly') return m % 12 === 0;
    return false;
  }

  /** Rule 5: the dispute's months [from, to), or null. */
  function span(p) {
    if (p.dispute === 'none') return null;
    var a = (p.from - Y0) * 12;
    return { from: a, to: a + p.years * 12 };
  }

  function touches(r, p) { return p.dispute !== 'none' && r.dispute === p.dispute; }

  /** Rule 6: is the record needed in month m? Before its due month (the retention period), or while a dispute that
      touches it runs. Nothing else makes keeping it lawful. */
  function needed(r, due, m, p, sp) {
    if (m < due) return true;
    return !!sp && touches(r, p) && m >= sp.from && m < sp.to;
  }

  /** Rule 5: does the routine skip the record in month m? Only a hold it knows of: announced only (paper) never;
      in the routine (held) the touched records while the dispute runs; never lifted (forgotten) the touched records
      from the dispute's start on; on everything (all) every record while the dispute runs. */
  function skipped(r, m, p, sp) {
    if (!sp || m < sp.from) return false;
    if (p.hold === 'held') return touches(r, p) && m < sp.to;
    if (p.hold === 'forgotten') return touches(r, p);
    if (p.hold === 'all') return m < sp.to;
    return false;
  }

  /** Rules 3–4: a record's life over the whole window: due month, deletion month (null: never in the window). The
      routine deletes it in the first month ≥ due in which it runs and does not skip it. */
  function life(r, p) {
    var sp = span(p);
    var due = r.trigger + p[RET_KEYS[r.cls]];
    var del = null;
    for (var m = due; m < MONTHS; m++) if (runs(p.purge, m) && !skipped(r, m, p, sp)) { del = m; break; }
    return { due: due, del: del };
  }

  /** Rules 6–7: one record read at the end of month `now` (it must exist by then: r.from ≤ now). */
  function readRecord(r, p, now) {
    var sp = span(p), l = life(r, p), due = l.due;
    var deleted = l.del !== null && l.del <= now;
    var end = deleted ? l.del : now + 1;                // months [from, end) the record exists in the window
    var over = 0, segs = [];
    function seg(k, a, b) {
      a = Math.max(a, r.from); b = Math.min(b, end);
      if (b <= a) return;
      var last = segs[segs.length - 1];
      if (last && last.k === k && last.b === a) last.b = b;
      else segs.push({ k: k, a: a, b: b });
    }
    seg('use', r.from, r.trigger);
    seg('keep', r.trigger, due);
    for (var m = Math.max(due, r.from); m < end; m++) {
      var need = needed(r, due, m, p, sp);
      if (!need) over++;
      seg(need ? 'need' : 'over', m, m + 1);
    }
    var status;
    if (deleted) status = needed(r, due, l.del, p, sp) ? 'underHold' : over > 0 ? 'late' : 'onTime';
    else if (now < r.trigger) status = 'active';
    else if (now < due) status = 'kept';
    else status = needed(r, due, now, p, sp) ? 'held' : 'tooLong';
    // the routine's own wait: the months in [due, deletion) it did not skip (a hold's delay is not the routine's)
    var wait = 0;
    if (deleted) for (var w = due; w < l.del; w++) if (!skipped(r, w, p, sp)) wait++;
    var inBackup = deleted && now < l.del + p.backup;
    if (deleted) segs.push({ k: 'backup', a: l.del, b: Math.min(l.del + p.backup, now + 1) });
    return {
      id: r.id, cls: r.cls, name: r.name, touched: touches(r, p), from: r.from, trigger: r.trigger, due: due,
      del: deleted ? l.del : null, status: status, over: over, wait: wait, inBackup: inBackup,
      backupUntil: deleted ? l.del + p.backup - 1 : null, segs: segs
    };
  }

  /** Rule 8: the numbers at the end of month `now`, over the records that exist by then. overRecords: kept past
      their date for at least a month, still there (tooLong) or deleted late (late). waitMax: the longest wait the
      routine itself caused (a hold's delay not counted). */
  function measure(recs) {
    var c = { active: 0, kept: 0, held: 0, tooLong: 0, onTime: 0, late: 0, underHold: 0 };
    var over = 0, overRecords = 0, inBackup = 0, lastBackup = null, deleted = 0, waitMax = 0;
    recs.forEach(function (x) {
      c[x.status]++;
      over += x.over;
      if (x.over > 0) overRecords++;
      if (x.del !== null) deleted++;
      if (x.del !== null) waitMax = Math.max(waitMax, x.wait);
      if (x.inBackup) {
        inBackup++;
        if (lastBackup === null || x.backupUntil > lastBackup) lastBackup = x.backupUntil;
      }
    });
    return { counts: c, over: over, overRecords: overRecords, deleted: deleted, inBackup: inBackup, lastBackup: lastBackup, waitMax: waitMax };
  }

  // ── params, presets, the page's state ──

  function P(over) {
    return Object.assign({
      now: 2031, purge: 'none', dispute: 'none', hold: 'held', from: 2027, years: 3,
      retApp: 12, retContract: 60, retStaff: 72, backup: 12
    }, over);
  }
  /** Rule 9: the presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'none', params: P({}) },
    { id: 'routine', params: P({ purge: 'monthly' }) },
    { id: 'paper', params: P({ purge: 'monthly', dispute: 'customer', hold: 'paper' }) },
    { id: 'held', params: P({ purge: 'monthly', dispute: 'customer', hold: 'held' }) },
    { id: 'forgotten', params: P({ purge: 'monthly', dispute: 'customer', hold: 'forgotten' }) },
    { id: 'archive', params: P({ purge: 'monthly', backup: 120 }) }
  ];
  var defaults = Object.assign({}, presets[0].params);

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function num(v, dflt) {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return dflt;
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }
  function oneOf(v, list, dflt) {
    for (var i = 0; i < list.length; i++) if (String(list[i]) === String(v)) return list[i];
    return dflt;
  }
  /** The nearest value of a list (a URL may carry any number); ties go to the smaller. */
  function nearest(list, v) {
    var best = list[0];
    list.forEach(function (x) { if (Math.abs(x - v) < Math.abs(best - v)) best = x; });
    return best;
  }

  /** Rule 9: params made safe. */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var out = {
      now: clamp(Math.round(num(q.now, defaults.now)), Y0, Y0 + YEARS - 1),
      purge: oneOf(q.purge, PURGES, defaults.purge),
      dispute: oneOf(q.dispute, DISPUTES, defaults.dispute),
      hold: oneOf(q.hold, HOLDS, defaults.hold),
      from: clamp(Math.round(num(q.from, defaults.from)), FROM_MIN, FROM_MAX),
      years: clamp(Math.round(num(q.years, defaults.years)), LEN_MIN, LEN_MAX)
    };
    CLASSES.forEach(function (c) { var k = RET_KEYS[c]; out[k] = nearest(RET_STEPS[c], num(q[k], defaults[k])); });
    out.backup = nearest(BACKUP_STEPS, num(q.backup, defaults.backup));
    return out;
  }

  /** Rule 9: a stepper over a list: the next value above (dir +1) or below (dir −1); at the end it stays. */
  function stepList(list, value, dir) {
    var i = list.indexOf(value);
    if (i < 0) i = list.indexOf(nearest(list, value));
    return list[clamp(i + (dir > 0 ? 1 : -1), 0, list.length - 1)];
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var now = (p.now - Y0) * 12 + 11;                 // the end of the chosen year
    var recs = RECORDS.filter(function (r) { return r.from <= now; }).map(function (r) { return readRecord(r, p, now); });
    return { p: p, now: now, span: span(p), recs: recs, m: measure(recs) };
  }

  /** Rule 10: the caption: the main line, then at most two notes. About the dispute, once it has started by the read
      month (at most one, in this order): the touched record was deleted before the dispute began (nGone while it was
      still in the backups then, else nGoneAged); it was deleted during it (nPaper); the hold was never lifted and it
      is now kept too long (nForgotten); the hold on everything delayed other records' deletion until it was lifted
      (nAll); with the routine every month, the hold in the routine (or not yet lifted) kept the record past a due
      month that fell inside the dispute (nHeld). About the routine (at most one): none, with records kept too long
      (nNone); once a year, with a record it deleted late (nYearly). Last: erased records still in the backups
      (nBackup). Only the first two are shown. */
  function captionKey(s) {
    var p = s.p, m = s.m, sp = s.span, notes = [];
    var x = touchedRecord(s);
    var started = sp && sp.from <= s.now;
    if (started && x) {
      if (x.del !== null && x.del < sp.from) notes.push(x.del + p.backup > sp.from ? 'nGone' : 'nGoneAged');
      else if (x.status === 'underHold') notes.push('nPaper');
      else if (p.hold === 'forgotten' && x.status === 'tooLong') notes.push('nForgotten');
      else if (p.hold === 'all' && allDelayed(s) > 0) notes.push('nAll');
      else if (p.purge === 'monthly' && (p.hold === 'held' || p.hold === 'forgotten') &&
        x.due >= sp.from && x.due < sp.to && x.due <= s.now) notes.push('nHeld');
    }
    if (p.purge === 'none' && m.counts.tooLong > 0) notes.push('nNone');
    else if (p.purge === 'yearly' && m.waitMax > 0) notes.push('nYearly');
    if (m.inBackup > 0) notes.push('nBackup');
    return { key: 'capMain', notes: notes.slice(0, 2) };
  }

  /** Records the dispute does not touch whose deletion a hold on everything delayed: deleted late, in the month the
      hold was lifted (rule 10, nAll). */
  function allDelayed(s) {
    var sp = s.span;
    return s.recs.filter(function (x) { return !x.touched && x.status === 'late' && x.del === sp.to; }).length;
  }

  /** Months a record was kept too long from month `from` on (nForgotten: only those after the dispute ended). */
  function overFrom(x, from) {
    return x.segs.reduce(function (a, g) { return g.k === 'over' ? a + Math.max(0, g.b - Math.max(g.a, from)) : a; }, 0);
  }

  /** The record a note talks about: the touched one. */
  function touchedRecord(s) { return s.recs.filter(function (x) { return x.touched; })[0] || null; }

  var logic = {
    Y0: Y0, YEARS: YEARS, MONTHS: MONTHS, CLASSES: CLASSES, RECORDS: RECORDS, RET_KEYS: RET_KEYS, RET_STEPS: RET_STEPS,
    BACKUP_STEPS: BACKUP_STEPS, PURGES: PURGES, DISPUTES: DISPUTES, HOLDS: HOLDS,
    FROM_MIN: FROM_MIN, FROM_MAX: FROM_MAX, LEN_MIN: LEN_MIN, LEN_MAX: LEN_MAX,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    stepList: stepList,
    runs: runs,
    span: span,
    needed: needed,
    skipped: skipped,
    life: life,
    readRecord: readRecord,
    measure: measure,
    captionKey: captionKey,
    allDelayed: allDelayed,
    overFrom: overFrom,
    touchedRecord: touchedRecord
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
