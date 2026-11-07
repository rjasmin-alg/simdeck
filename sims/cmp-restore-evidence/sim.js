/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-restore-evidence: a small firm's twelve systems are backed up every night and every job reports
   success; two of the backups would not restore, and two systems restore slower than their recovery time
   objective (RTO). Restore tests are the only way to know: a few slots a quarter, filled by criticality, in
   inventory order, quickest first, or by hand. The year's tests become the records an auditor receives (date,
   scope, time against the RTO, result, sign-off, or a ticket that only says "done"); the page reads the coverage,
   the systems never tested, the failures found and the restores slower than the RTO.
   Explorer: the state is a pure function of the params (compute). Rules: SPEC.md; words: strings.js.
   The evidence trail (one requirement, its records over the year) is trail.js, copied from cmp-policy-to-record
   (catalogue §5.24: cmp-restore-evidence fills it); each system is one yearly requirement walked there.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var trail = typeof module === 'object' && module.exports
    ? require('./trail.js')
    : root.SimdeckModels.trail;

  /** Rule 1: the systems, in inventory order (the asset list's order, the last tie-break everywhere).
      tier 1 critical, 2 important, 3 other; rto and time in hours; time is how long a whole-system restore takes;
      fails: the backup job reports success, but a restore from it fails until the first failed test gets it repaired. */
  var SYSTEMS = [
    { id: 'files', tier: 2, rto: 24, time: 10, fails: false },
    { id: 'mail', tier: 2, rto: 24, time: 16, fails: false },
    { id: 'wiki', tier: 3, rto: 72, time: 2, fails: false },
    { id: 'shop', tier: 1, rto: 4, time: 3, fails: false },
    { id: 'print', tier: 3, rto: 72, time: 1, fails: false },
    { id: 'pay', tier: 2, rto: 24, time: 30, fails: false },
    { id: 'wms', tier: 1, rto: 8, time: 6, fails: false },
    { id: 'crm', tier: 2, rto: 24, time: 12, fails: true },
    { id: 'dev', tier: 3, rto: 72, time: 8, fails: false },
    { id: 'erp', tier: 1, rto: 8, time: 14, fails: false },
    { id: 'idm', tier: 1, rto: 4, time: 4, fails: true },
    { id: 'arch', tier: 3, rto: 168, time: 20, fails: false }
  ];
  var N = SYSTEMS.length;
  var QUARTERS = 4;
  var MONTH = [2, 5, 8, 11];                          // rule 4: tests run in the middle month of each quarter
  var DAYS = 365;                                     // rule 6: one backup job report per system per day
  var SLOTS_MAX = 6;
  var PLAN_MAX = Math.pow(2, N * QUARTERS) - 1;       // rule 3: the hand-made plan, one bit per system × quarter
  var ORDERS = ['crit', 'list', 'easy', 'own'];
  var RECORDS = ['full', 'ticket'];

  // ── rule 2: the orders ──

  /** Rule 2: compare two systems (indices) under an order. crit: tier, then RTO, then inventory; list: inventory;
      easy: restore time (quickest first), then inventory; own: inventory (the slot order of a hand-made plan).
      A total order: the inventory index breaks every tie. */
  function before(order, i, j) {
    var a = SYSTEMS[i], b = SYSTEMS[j];
    if (order === 'crit') {
      if (a.tier !== b.tier) return a.tier - b.tier;
      if (a.rto !== b.rto) return a.rto - b.rto;
    } else if (order === 'easy') {
      if (a.time !== b.time) return a.time - b.time;
    }
    return i - j;
  }

  // ── rule 3: the plan ──

  function bitIndex(sys, q) { return sys * QUARTERS + q; }
  function hasBit(mask, b) { return Math.floor(mask / Math.pow(2, b)) % 2 === 1; }

  /** Rule 3: the year's tests, in date order: [{ q, slot, sys }]. An automatic order fills each quarter's `slots`
      with the systems tested least often so far this year, ties by the order (so it rotates through the estate before
      testing anything twice); own takes the plan's bits, each quarter in inventory order, and keeps the first `slots`
      of a quarter that holds more. */
  function plan(p) {
    var out = [], count = [];
    for (var i = 0; i < N; i++) count.push(0);
    for (var q = 0; q < QUARTERS; q++) {
      var pick;
      if (p.order === 'own') {
        pick = [];
        for (i = 0; i < N; i++) if (hasBit(p.plan, bitIndex(i, q))) pick.push(i);
      } else {
        pick = [];
        for (i = 0; i < N; i++) pick.push(i);
        pick.sort(function (x, y) { return (count[x] - count[y]) || before(p.order, x, y); });
      }
      pick = pick.slice(0, p.slots);
      pick.forEach(function (s, k) { count[s]++; out.push({ q: q, slot: k, sys: s }); });
    }
    return out;
  }

  /** Rule 3: the plan as the hand-made mask (one bit per system × quarter). */
  function maskOf(tests) {
    var m = 0;
    tests.forEach(function (x) { m += Math.pow(2, bitIndex(x.sys, x.q)); });
    return m;
  }

  // ── rules 4–5: the tests and their records ──

  /** Rule 4: slot k of quarter q runs on day 3 + 4k of the quarter's middle month. */
  function dateOf(q, slot) { return { month: MONTH[q], day: 3 + 4 * slot }; }

  /** Rules 4–5: run the plan. A test of a backup that fails, not yet repaired, fails (and the backup is repaired
      after it); otherwise the restore succeeds and takes the system's time; slower than the RTO is `slow` (equal
      to the RTO is in time). A full record holds date, scope, time, result and sign-off; a ticket only the date,
      the system and done / failed. */
  function run(tests, record) {
    var repaired = {};
    return tests.map(function (x) {
      var s = SYSTEMS[x.sys], d = dateOf(x.q, x.slot), res;
      if (s.fails && !repaired[x.sys]) { res = 'fail'; repaired[x.sys] = true; }
      else res = s.time > s.rto ? 'slow' : 'ok';
      return { q: x.q, slot: x.slot, sys: x.sys, month: d.month, day: d.day, res: res, time: s.time, rto: s.rto,
        complete: record === 'full' };
    });
  }

  // ── rule 6: the year per system, through the evidence trail ──

  /** Rule 6: each system is one requirement ("restored at least once a year"), walked in trail.js with its tests as
      records. status: never (the trail's operating finding), else from the last test: fail, slow or ok on a full
      record, done on a ticket (no time on it). found: the quarter of its failed test, or null. */
  function years(recs) {
    return SYSTEMS.map(function (s, i) {
      var mine = recs.filter(function (r) { return r.sys === i; });
      var walk = trail.walk({ policy: true, standard: 'measurable', procedure: true, freq: 'yearly',
        records: mine.map(function (r) { return r.month; }) }, 12);
      var last = mine.length ? mine[mine.length - 1] : null;
      var failed = mine.filter(function (r) { return r.res === 'fail'; });
      var status;
      if (walk.finding.kind !== 'none') status = 'never';
      else if (last.res === 'fail') status = 'fail';
      else if (!last.complete) status = 'done';
      else status = last.res;
      return { sys: i, tests: mine.length, status: status, found: failed.length ? failed[0].q : null,
        finding: walk.finding.reason };
    });
  }

  /** The crit order of a list of system indices (how the page and the caption name systems). */
  function byCrit(list) { return list.slice().sort(function (a, b) { return before('crit', a, b); }); }

  /** Rules 6–7: the numbers and the auditor's findings. */
  function measure(recs, ys, record) {
    var never = byCrit(ys.filter(function (y) { return y.status === 'never'; }).map(function (y) { return y.sys; }));
    var found = recs.filter(function (r) { return r.res === 'fail'; }).map(function (r) { return { sys: r.sys, q: r.q }; });
    var hidden = byCrit(never.filter(function (i) { return SYSTEMS[i].fails; }));
    var slowSeen = [];                                // systems a full record shows slower than the RTO, by date
    recs.forEach(function (r) { if (r.res === 'slow' && r.complete && slowSeen.indexOf(r.sys) < 0) slowSeen.push(r.sys); });
    var slowTrue = SYSTEMS.map(function (s, i) { return i; }).filter(function (i) { return SYSTEMS[i].time > SYSTEMS[i].rto; });
    var slowNever = byCrit(slowTrue.filter(function (i) { return never.indexOf(i) >= 0; }));
    var findings = [];
    if (never.length) findings.push({ kind: 'never', systems: never });
    var open = byCrit(ys.filter(function (y) { return y.status === 'fail'; }).map(function (y) { return y.sys; }));
    if (open.length) findings.push({ kind: 'failed', systems: open });
    var slow = byCrit(ys.filter(function (y) { return y.status === 'slow'; }).map(function (y) { return y.sys; }));
    if (slow.length) findings.push({ kind: 'slow', systems: slow });
    var done = byCrit(ys.filter(function (y) { return y.status === 'done'; }).map(function (y) { return y.sys; }));
    var tickets = recs.filter(function (r) { return !r.complete && r.res !== 'fail'; }).length;
    if (done.length) findings.push({ kind: 'unproven', systems: done, records: tickets });
    return {
      tests: recs.length,
      tested: N - never.length,
      never: never,
      neverCrit: never.filter(function (i) { return SYSTEMS[i].tier === 1; }).length,
      found: found,
      fails: SYSTEMS.filter(function (s) { return s.fails; }).length,
      hidden: hidden,
      slowSeen: slowSeen,
      slowTrue: slowTrue.length,
      slowNever: slowNever,
      jobs: N * DAYS,                                 // rule 6: every nightly job reports success, whatever the truth
      findings: findings,
      record: record
    };
  }

  /** Rule 8: the record the stage shows: the first test that is really slower than the RTO, else the first failed
      one, else the last; null without tests. */
  function shownRecord(recs) {
    for (var i = 0; i < recs.length; i++) if (recs[i].res === 'slow') return i;
    for (i = 0; i < recs.length; i++) if (recs[i].res === 'fail') return i;
    return recs.length ? recs.length - 1 : null;
  }

  // ── params, presets ──

  function P(over) { return Object.assign({ slots: 2, order: 'list', record: 'full', plan: 0 }, over); }
  /** Rule 9: the presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'jobs', params: P({ slots: 0 }) },
    { id: 'list', params: P({}) },
    { id: 'crit', params: P({ order: 'crit' }) },
    { id: 'easy', params: P({ order: 'easy' }) },
    { id: 'all', params: P({ order: 'crit', slots: 3 }) },
    { id: 'ticket', params: P({ order: 'crit', slots: 3, record: 'ticket' }) }
  ];
  var defaults = Object.assign({}, presets[1].params);

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function num(v, dflt) {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return dflt;
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }
  function oneOf(v, list, dflt) {
    for (var i = 0; i < list.length; i++) if (list[i] === String(v)) return list[i];
    return dflt;
  }

  /** Rule 9: params made safe (a URL may carry anything). */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    return {
      slots: clamp(Math.round(num(q.slots, defaults.slots)), 0, SLOTS_MAX),
      order: oneOf(q.order, ORDERS, defaults.order),
      record: oneOf(q.record, RECORDS, defaults.record),
      plan: clamp(Math.round(num(q.plan, 0)), 0, PLAN_MAX)
    };
  }

  /** Rule 3: a click on system × quarter. Removes a planned test, or adds one if the quarter has a free slot;
      either way the plan becomes hand-made (order own, starting from the tests on the stage).
      Returns { params } or { reject: 'noSlots' | 'full', q }. */
  function toggle(params, sys, q) {
    var p = normalise(params);
    var tests = plan(p);
    var mask = maskOf(tests);
    var b = bitIndex(sys, q);
    if (hasBit(mask, b)) mask -= Math.pow(2, b);
    else {
      if (p.slots === 0) return { reject: 'noSlots', q: q };
      if (tests.filter(function (x) { return x.q === q; }).length >= p.slots) return { reject: 'full', q: q };
      mask += Math.pow(2, b);
    }
    return { params: { slots: p.slots, order: 'own', record: p.record, plan: mask } };
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var tests = plan(p);
    var recs = run(tests, p.record);
    var ys = years(recs);
    var perQ = [];
    for (var q = 0; q < QUARTERS; q++) perQ.push(tests.filter(function (x) { return x.q === q; }).length);
    return { p: p, recs: recs, years: ys, perQ: perQ, m: measure(recs, ys, p.record), shown: shownRecord(recs) };
  }

  /** Rule 10: the caption: the main line (no test; every system tested; some never, with or without a critical one),
      then at most two notes, the first that apply in this order: tickets without time (nTicket); a failing backup
      nobody tested (nHidden); the first failure found (nFound); the first restore a full record shows slower than
      the RTO (nSlow); a slow system nobody tested (nSlowHidden, full records only). */
  function captionKey(s) {
    var m = s.m, notes = [];
    var key = m.tests === 0 ? 'capNone' : m.never.length === 0 ? 'capAll' : m.neverCrit > 0 ? 'capSomeCrit' : 'capSome';
    if (m.record === 'ticket' && m.tests > 0) notes.push('nTicket');
    if (m.hidden.length) notes.push('nHidden');
    if (m.found.length) notes.push('nFound');
    if (m.slowSeen.length) notes.push('nSlow');
    if (m.record === 'full' && m.slowNever.length) notes.push('nSlowHidden');
    return { key: key, notes: notes.slice(0, 2) };
  }

  var logic = {
    SYSTEMS: SYSTEMS, N: N, QUARTERS: QUARTERS, MONTH: MONTH, DAYS: DAYS, SLOTS_MAX: SLOTS_MAX, PLAN_MAX: PLAN_MAX,
    ORDERS: ORDERS, RECORDS: RECORDS,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    before: before,
    plan: plan,
    maskOf: maskOf,
    bitIndex: bitIndex,
    dateOf: dateOf,
    run: run,
    years: years,
    measure: measure,
    shownRecord: shownRecord,
    toggle: toggle,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
