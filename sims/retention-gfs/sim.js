/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for retention-gfs: one backup a night through 2026, and after every successful job a prune that keeps the
   newest backups by the rules last, daily, weekly, monthly and yearly, in that order (rules in SPEC.md). What is
   left is the set of recovery points: how many, how old the oldest, the largest gap, and whether a fault noticed
   N days late has a clean point before it.
   Pure: no DOM, no Math.random, no Date, no timers (the calendar is integer arithmetic below). State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it.
   An explorer: the state is a pure function of the params, initial(params) = compute(params), no steps.
   Shares only vocabulary with sims/backup-diff-incr (a nightly backup, a restore point); none of its code. `prune`
   and `run` are pure over plain data (ISO date strings) and promotable to models/ unchanged. */
(function (root) {
  'use strict';

  // ── calendar: days since 1970-01-01 ⇄ civil dates (proleptic Gregorian; H. Hinnant's algorithms) ──

  function dayOf(y, m, d) {
    y -= m <= 2 ? 1 : 0;
    var era = Math.floor(y / 400);
    var yoe = y - era * 400;
    var doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
    var doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
    return era * 146097 + doe - 719468;
  }
  function civil(n) {
    n += 719468;
    var era = Math.floor(n / 146097);
    var doe = n - era * 146097;
    var yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    var doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    var mp = Math.floor((5 * doy + 2) / 153);
    var d = doy - Math.floor((153 * mp + 2) / 5) + 1;
    var m = mp + (mp < 10 ? 3 : -9);
    return { y: yoe + era * 400 + (m <= 2 ? 1 : 0), m: m, d: d };
  }
  function pad(v) { return (v < 10 ? '0' : '') + v; }
  /** Day number → 'YYYY-MM-DD'. */
  function iso(n) { var c = civil(n); return c.y + '-' + pad(c.m) + '-' + pad(c.d); }
  /** 'YYYY-MM-DD' (or 'YYYY-MM-DDTHH:MM') → day number. */
  function dayNum(s) { return dayOf(+s.slice(0, 4), +s.slice(5, 7), +s.slice(8, 10)); }
  /** ISO weekday, 1 = Monday … 7 = Sunday (1970-01-01 was a Thursday). */
  function weekday(n) { return ((n + 3) % 7 + 7) % 7 + 1; }
  /** The Monday of n's ISO week, as a day number: one id per ISO week (rule 2). */
  function weekStart(n) { return n - weekday(n) + 1; }

  /** Rule 2: the period each option groups backups by (keep-last: every backup is its own). */
  var RULES = ['last', 'daily', 'weekly', 'monthly', 'yearly'];
  function periodOf(rule, b) {
    if (rule === 'last') return b;
    if (rule === 'daily') return b.slice(0, 10);
    if (rule === 'weekly') return 'W' + weekStart(dayNum(b));
    if (rule === 'monthly') return b.slice(0, 7);
    return b.slice(0, 4);
  }

  /**
   * One prune (rules 1–3, 5). backups: ISO strings ('YYYY-MM-DD', optionally 'THH:MM'); keep: { last, daily, weekly,
   * monthly, yearly } counts. Returns { kept: { backup: rule }, removed: [backup] }, newest first.
   * Per option in the order of RULES (rule 1), walking the backups newest first:
   *   – a backup another option already marked (kept, or removed as an older one in a kept period) is skipped;
   *   – a backup in a period that an earlier option already keeps is skipped and not counted (rule 3);
   *   – the first (newest) backup of a new period is kept (rule 5: the later of two on one day), until the option has
   *     kept its count, and then the option stops (later options still see the backups it never reached);
   *   – an older backup in a period this option has kept is marked for removal.
   * Whatever no option keeps is removed.
   */
  function prune(backups, keep) {
    var list = backups.slice().sort(function (a, b) { return a < b ? 1 : a > b ? -1 : 0; });
    var mark = {};          // backup → { keep: bool, rule }
    var counts = RULES.map(function (rule) { return Math.max(0, Math.floor(Number(keep && keep[rule]) || 0)); });
    // Rule 7: with no option set at all, the prune keeps everything (it never deletes on an empty policy).
    if (counts.every(function (n) { return n === 0; })) {
      var all = {};
      list.forEach(function (b) { all[b] = 'all'; });
      return { kept: all, removed: [] };
    }
    RULES.forEach(function (rule, r) {
      var n = counts[r];
      if (!n) return;
      var already = {}, mine = {}, count = 0;
      list.forEach(function (b) { if (mark[b] && mark[b].keep) already[periodOf(rule, b)] = true; });
      for (var i = 0; i < list.length; i++) {
        var b = list[i];
        if (mark[b]) continue;
        var id = periodOf(rule, b);
        if (already[id]) continue;
        if (!mine[id]) {
          if (count >= n) break;
          mine[id] = true; count++;
          mark[b] = { keep: true, rule: rule };
        } else {
          mark[b] = { keep: false, rule: rule };
        }
      }
    });
    var kept = {}, removed = [];
    list.forEach(function (b) { if (mark[b] && mark[b].keep) kept[b] = mark[b].rule; else removed.push(b); });
    return { kept: kept, removed: removed };
  }

  // ── the run ──

  var YEAR = 2026;
  var START = dayOf(YEAR, 1, 1);
  var DAYS = dayOf(YEAR, 12, 31) - START + 1;     // 365
  var JOB_TIME = '01:40';
  var FAIL_DAYS = { none: null, '2026-09-14': '2026-09-14' };
  var FAIL_IDS = ['none', '2026-09-14'];

  var LIMITS = { last: 30, daily: 14, weekly: 8, monthly: 24, yearly: 5, detectAfter: 400, day: DAYS };
  var defaults = { last: 0, daily: 7, weekly: 4, monthly: 12, yearly: 0, failFrom: 'none', detectAfter: 0, day: DAYS };

  function int(v, lo, hi, dflt) {
    var x = Number(v);
    if (!Number.isFinite(x)) return dflt;
    return Math.min(hi, Math.max(lo, Math.round(x)));
  }
  /** Params cleaned: counts and days clamped to their ranges, an unknown failFrom is 'none'. */
  function norm(p) {
    p = p || {};
    var o = {};
    ['last', 'daily', 'weekly', 'monthly', 'yearly', 'detectAfter'].forEach(function (k) { o[k] = int(p[k], 0, LIMITS[k], defaults[k]); });
    o.failFrom = FAIL_IDS.indexOf(p.failFrom) >= 0 ? p.failFrom : defaults.failFrom;
    o.day = int(p.day, 1, DAYS, defaults.day);
    return { last: o.last, daily: o.daily, weekly: o.weekly, monthly: o.monthly, yearly: o.yearly, failFrom: o.failFrom, detectAfter: o.detectAfter, day: o.day };
  }

  /**
   * Rules 4 and 6: from `start` to `end` (day numbers), one job a night at 01:40; when it succeeds the new backup is
   * added and the prune runs over what survived the night before (progressive: a backup removed is gone). A job on or
   * after `failFrom` fails: nothing is added and nothing is removed. Returns the backups made and the kept map.
   */
  function run(keep, start, end, failFrom) {
    var kept = {}, made = [], failed = [];
    for (var n = start; n <= end; n++) {
      if (failFrom != null && n >= failFrom) { failed.push(iso(n)); continue; }
      var b = iso(n) + 'T' + JOB_TIME;
      made.push(b);
      kept = prune(Object.keys(kept).concat([b]), keep).kept;
    }
    return { made: made, failed: failed, kept: kept };
  }

  function compute(params) {
    var p = norm(params);
    var today = START + p.day - 1;
    var fail = FAIL_DAYS[p.failFrom];
    var r = run(p, START, today, fail == null ? null : dayNum(fail));
    var keptDates = Object.keys(r.kept).sort();
    var kept = keptDates.map(function (b) { return { date: b.slice(0, 10), rule: r.kept[b], age: today - dayNum(b) }; });
    var keptSet = {};
    keptDates.forEach(function (b) { keptSet[b] = true; });
    var pruned = r.made.filter(function (b) { return !keptSet[b]; }).map(function (b) { return b.slice(0, 10); });

    var byRule = { last: 0, daily: 0, weekly: 0, monthly: 0, yearly: 0, all: 0 };
    kept.forEach(function (k) { byRule[k.rule]++; });
    var gap = null;
    for (var i = 1; i < kept.length; i++) {
      var g = kept[i - 1].age - kept[i].age;
      if (!gap || g > gap.days) gap = { days: g, from: kept[i - 1].date, to: kept[i].date };
    }
    var oldest = kept.length ? kept[0] : null, newest = kept.length ? kept[kept.length - 1] : null;

    // The verdict: a fault that appeared N days ago, during the working day after that night's job, has a clean point
    // when some kept point is N or more days old; the newest such point is where a restore goes back to.
    var verdict = null;
    if (p.detectAfter > 0) {
      var clean = null;
      kept.forEach(function (k) { if (k.age >= p.detectAfter) clean = k; });
      verdict = { after: p.detectAfter, faultDate: iso(today - p.detectAfter), clean: clean ? clean.date : null, cleanAge: clean ? clean.age : null };
    }

    // Why a rule keeps fewer than asked: the run has had `total` periods of it so far (its days, weeks, months, years;
    // backups for keep-last), and `covered` of them already hold a point of an earlier rule (rule 3). got = total − covered.
    var shortInfo = null;
    if (!byRule.all) {
      RULES.forEach(function (rule, ri) {
        if (shortInfo || byRule[rule] >= p[rule]) return;
        var all = {}, cov = {};
        r.made.forEach(function (b) { all[periodOf(rule, b)] = true; });
        kept.forEach(function (k) { if (RULES.indexOf(k.rule) < ri) cov[periodOf(rule, k.date + 'T' + JOB_TIME)] = true; });
        shortInfo = { rule: rule, asked: p[rule], got: byRule[rule], total: Object.keys(all).length, covered: Object.keys(cov).length };
      });
    }

    return {
      start: iso(START), end: iso(START + DAYS - 1), today: iso(today), day: p.day,
      failFrom: fail, failing: r.failed.length > 0, failedDays: r.failed,
      backups: r.made.map(function (b) { return b.slice(0, 10); }),
      kept: kept, pruned: pruned, byRule: byRule,
      copies: kept.length,
      oldest: oldest ? oldest.date : null, oldestAge: oldest ? oldest.age : null,
      newest: newest ? newest.date : null, newestAge: newest ? newest.age : null,
      gap: gap,
      verdict: verdict,
      short: shortInfo,
      params: p
    };
  }

  /** "Changed" (legend): dates kept now and not before (appeared), and kept before and not now (gone). */
  function changed(s, prev) {
    if (!prev) return { appeared: [], gone: [] };
    var now = {}, was = {};
    s.kept.forEach(function (k) { now[k.date] = true; });
    prev.kept.forEach(function (k) { was[k.date] = true; });
    return {
      appeared: s.kept.filter(function (k) { return !was[k.date]; }).map(function (k) { return k.date; }),
      gone: prev.kept.filter(function (k) { return !now[k.date]; }).map(function (k) { return k.date; })
    };
  }

  /**
   * What the caption says (the page picks the words). `change`: the one param that changed since prevP (null when none
   * or several). `key`: the sentence for the state now: the jobs are failing; nothing kept; no rule set (everything
   * kept); else the plain count. `verdict`: the sentence for a fault noticed late (vcNo, vcYes), null when off.
   * `short`: the first rule asked for more than it keeps (null when none), so the page can say why.
   */
  function captionKey(s, prevP) {
    var change = null;
    if (prevP) {
      var a = norm(prevP), diff = Object.keys(a).filter(function (k) { return a[k] !== s.params[k]; });
      if (diff.length === 1) change = diff[0];
    }
    var key;
    if (s.failing) key = 'sFailing';
    else if (!s.copies) key = 'sNone';
    else if (s.byRule.all) key = 'sAll';
    else key = 'sPlain';
    var short = s.short ? s.short.rule : null;
    return { change: change, key: key, verdict: s.verdict ? (s.verdict.clean ? 'vcYes' : 'vcNo') : null, short: short };
  }

  /** Day of the year (1 = 1 January 2026) of an ISO date, for presets and the page. */
  function dayOfYear(s) { return dayNum(s) - START + 1; }

  var presets = [
    { id: 'ul-primjer-6', params: { last: 0, daily: 7, weekly: 4, monthly: 0, yearly: 0, failFrom: 'none', detectAfter: 42, day: DAYS } },
    { id: 'gfs-7-4-12', params: { last: 0, daily: 7, weekly: 4, monthly: 12, yearly: 0, failFrom: 'none', detectAfter: 0, day: DAYS } },
    { id: 'last-30', params: { last: 30, daily: 0, weekly: 0, monthly: 0, yearly: 0, failFrom: 'none', detectAfter: 0, day: DAYS } },
    { id: 'dr-vm-dumps', params: { last: 0, daily: 7, weekly: 4, monthly: 0, yearly: 0, failFrom: 'none', detectAfter: 0, day: dayOfYear('2026-09-13') } },
    { id: 'dr-vm-dumps-failing', params: { last: 0, daily: 7, weekly: 4, monthly: 0, yearly: 0, failFrom: '2026-09-14', detectAfter: 0, day: dayOfYear('2026-11-01') } }
  ];

  var logic = {
    RULES: RULES, YEAR: YEAR, DAYS: DAYS, START: START, LIMITS: LIMITS, FAIL_IDS: FAIL_IDS, JOB_TIME: JOB_TIME,
    defaults: defaults,
    presets: presets,
    norm: norm,
    dayOf: dayOf, civil: civil, iso: iso, dayNum: dayNum, weekday: weekday, weekStart: weekStart, dayOfYear: dayOfYear,
    periodOf: periodOf,
    prune: prune,
    run: run,
    initial: compute,
    compute: compute,
    changed: changed,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
