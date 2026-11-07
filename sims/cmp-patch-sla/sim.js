/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-patch-sla: a small firm's twenty systems receive a steady stream of vulnerabilities for a year. A
   remediation policy sets a deadline by severity; the team fixes a set number a day from one queue, ordered by score
   or known-exploited first; systems nobody owns are in nobody's queue. An item past its deadline on such a system may
   get an exception: open-ended, or with an owner and an end date (the owner puts it in the queue). The page reads the
   share fixed in time (the report), the average time to fix, the oldest open item, the exposure (open items × days)
   and the known-exploited part of it under both orders. Explorer: the state is a pure function of the params
   (compute). Rules: SPEC.md; words: strings.js.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var DAYS = 365;                                     // rule 1: the period, day 1…365
  var SYSTEMS = 20;                                   // rule 1: systems 0…19; the last `unowned` have no owner
  var SEV = ['crit', 'high', 'med', 'low'];           // rule 2: severities, most severe first
  var SEV_P = [0.10, 0.30, 0.45, 0.15];               // rule 2: share of arrivals per severity
  var SEV_LO = [90, 70, 40, 1];                       // rule 2: score band in tenths, inclusive (9.0–10.0, 7.0–8.9, 4.0–6.9, 0.1–3.9)
  var SEV_HI = [100, 89, 69, 39];
  var EXPLOIT_P = [0.20, 0.10, 0.06, 0.02];           // rule 2: chance an item is known to be exploited, per severity
  var EXC_DAYS = 30;                                  // rule 5: an exception with an end date runs 30 days
  var ORDERS = ['score', 'exploited'];
  var EXCS = ['none', 'open', 'dated'];
  var DL_STEPS = [                                   // rule 9: the deadlines the stage's steppers offer, per severity
    [1, 3, 5, 7, 10, 15, 20, 30],
    [7, 14, 21, 30, 45, 60, 90],
    [14, 30, 45, 60, 90, 120, 180],
    [30, 60, 90, 120, 180, 270, 365]
  ];
  var DL_MIN = DL_STEPS.map(function (l) { return l[0]; });
  var DL_MAX = DL_STEPS.map(function (l) { return l[l.length - 1]; });
  var SEED_MAX = 999;
  var BIN = 10;                                       // rule 8: the age chart's bins, in days
  var CLEAN_AGE = 30;                                 // rule 10: nothing open longer than this is "no tail"

  /** mulberry32, the kit's Simdeck.rng (kit/kit.js), copied so node tests need no kit. */
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

  /** Rule 2: the stream. Day by day, one draw for the count (2…6), then exactly four draws per item: system,
      severity, score within the band, known exploited. Nothing here depends on any param but the seed. */
  function stream(seed) {
    var r = rng(seed), list = [];
    for (var d = 1; d <= DAYS; d++) {
      var k = 2 + Math.floor(r() * 5);
      for (var j = 0; j < k; j++) {
        var sys = Math.floor(r() * SYSTEMS);
        var u = r(), s = 0, acc = SEV_P[0];
        while (s < SEV.length - 1 && u >= acc) { s++; acc += SEV_P[s]; }
        var score = SEV_LO[s] + Math.floor(r() * (SEV_HI[s] - SEV_LO[s] + 1));
        var kev = r() < EXPLOIT_P[s];
        list.push({ id: list.length, day: d, sys: sys, sev: s, score: score, kev: kev });
      }
    }
    return list;
  }

  /** Rule 4: the queue's order. By score: higher score first; known-exploited first: exploited before the rest, then
      by score. Ties: earlier arrival, then lower id. A total order. */
  function before(order, a, b) {
    if (order === 'exploited' && a.kev !== b.kev) return a.kev ? -1 : 1;
    if (a.score !== b.score) return b.score - a.score;
    if (a.day !== b.day) return a.day - b.day;
    return a.id - b.id;
  }

  /** Rule 3: fixes on day d at `cap` a day: ⌊cap·d⌋ − ⌊cap·(d−1)⌋ (half fixes add up over two days). */
  function fixesOn(cap, d) { return Math.floor(cap * d + 1e-9) - Math.floor(cap * (d - 1) + 1e-9); }

  /** Rules 3–6: run the year. Returns one record per item: fixed (day or null), owned, exc (null, 'open' or the
      exception's end day), and the effective deadline day. */
  function run(items, p) {
    var firstUnowned = SYSTEMS - p.unowned;
    var recs = items.map(function (it) {
      var owned = it.sys < firstUnowned;
      return { id: it.id, day: it.day, sys: it.sys, sev: it.sev, score: it.score, kev: it.kev, owned: owned,
        due: it.day + p.deadlines[it.sev], fixed: null, exc: null };
    });
    var next = 0;                                     // first item not yet arrived
    var queue = [];                                   // records waiting, eligible from the day after they arrive
    var cmp = function (a, b) { return before(p.order, a, b); };
    for (var d = 1; d <= DAYS; d++) {
      // rule 5: an unowned item past its deadline gets its exception today (before the day's fixes)
      if (p.exc !== 'none') {
        for (var i = 0; i < next; i++) {
          var x = recs[i];
          if (!x.owned && x.exc === null && x.fixed === null && d > x.due) {
            if (p.exc === 'open') x.exc = 'open';
            else { x.exc = d + EXC_DAYS; queue.push(x); }
          }
        }
      }
      // rule 3: today's fixes, from the queue in order
      var k = fixesOn(p.cap, d);
      if (k > 0 && queue.length) {
        queue.sort(cmp);
        var done = queue.splice(0, k);
        done.forEach(function (x) { x.fixed = d; });
      }
      // rule 2: today's arrivals join at the end of the day
      while (next < recs.length && recs[next].day === d) {
        if (recs[next].owned) queue.push(recs[next]);
        next++;
      }
    }
    return recs;
  }

  /** Rule 6: an item's state at the end of the period (day 365). */
  function status(x) {
    var limit = typeof x.exc === 'number' ? x.exc : x.due;   // a dated exception moves the deadline to its end
    if (x.fixed !== null) return x.fixed <= limit ? 'inTime' : 'late';
    if (x.exc === 'open') return 'excepted';
    if (typeof x.exc === 'number' && DAYS <= x.exc) return 'excepted';
    return DAYS > limit ? 'overdue' : 'notDue';
  }

  /** Rule 6: open item-days: from arrival to its fix, or to the end of the period. */
  function openDays(x) { return (x.fixed !== null ? x.fixed : DAYS) - x.day; }

  /** Rules 6–7: the numbers from the records. */
  function measure(recs) {
    var c = { inTime: 0, late: 0, excepted: 0, overdue: 0, notDue: 0 };
    var overdueUnowned = 0;
    var fixed = 0, fixAge = 0, oldest = null, exp = 0, expUnowned = 0, expKev = 0, items = recs.length, unownedItems = 0;
    recs.forEach(function (x) {
      var st = status(x);
      c[st]++;
      if (st === 'overdue' && !x.owned) overdueUnowned++;
      var od = openDays(x);
      exp += od;
      if (!x.owned) { expUnowned += od; unownedItems++; }
      if (x.kev) expKev += od;
      if (x.fixed !== null) { fixed++; fixAge += x.fixed - x.day; }
      else if (!oldest || x.day < oldest.day || (x.day === oldest.day && x.id < oldest.id)) oldest = x;
    });
    var counted = c.inTime + c.late + c.overdue;
    return {
      counts: c,
      inTime: counted ? c.inTime / counted : 1,      // the report: excepted and not-yet-due items are not counted
      counted: counted,
      fixed: fixed,
      meanFix: fixed ? fixAge / fixed : 0,
      oldest: oldest ? { id: oldest.id, age: DAYS - oldest.day, owned: oldest.owned, sev: oldest.sev } : null,
      open: recs.length - fixed,
      exposure: exp,
      exposureUnowned: expUnowned,
      exposureKev: expKev,
      items: items,
      unownedItems: unownedItems,
      overdueUnowned: overdueUnowned
    };
  }

  /** Rule 8: the open items at the end, as the age chart draws them: lane (owned / unowned), age bin, and a mark. */
  function openItems(recs) {
    return recs.filter(function (x) { return x.fixed === null; }).map(function (x) {
      var st = status(x);
      return { id: x.id, owned: x.owned, sev: x.sev, kev: x.kev, age: DAYS - x.day, bin: Math.floor((DAYS - x.day) / BIN),
        mark: st === 'excepted' ? 'exc' : st === 'overdue' ? 'over' : 'ok' };
    }).sort(function (a, b) {
      return (a.bin - b.bin) || (a.sev - b.sev) || (Number(b.kev) - Number(a.kev)) || (a.id - b.id);
    });
  }

  // ── params, presets, the page's numbers ──

  /** Every param. */
  function P(over) {
    return Object.assign({
      order: 'score', cap: 3.5, unowned: 3, exc: 'open', dCrit: 15, dHigh: 30, dMed: 90, dLow: 180, seed: 7
    }, over);
  }
  /** Rule 9: the presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'report', params: P({}) },
    { id: 'no-exc', params: P({ exc: 'none' }) },
    { id: 'dated', params: P({ exc: 'dated' }) },
    { id: 'short', params: P({ cap: 3, unowned: 0, exc: 'none' }) },
    { id: 'kev', params: P({ cap: 3, unowned: 0, exc: 'none', order: 'exploited' }) },
    { id: 'tight', params: P({ cap: 3, unowned: 0, exc: 'none', order: 'exploited', dCrit: 7, dHigh: 14, dMed: 45, dLow: 90 }) }
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
  var DKEYS = ['dCrit', 'dHigh', 'dMed', 'dLow'];

  /** Rule 9: params made safe (a URL may carry anything). */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var out = {
      order: oneOf(q.order, ORDERS, defaults.order),
      cap: clamp(Math.round(num(q.cap, defaults.cap) * 2) / 2, 1, 6),
      unowned: clamp(Math.round(num(q.unowned, defaults.unowned)), 0, 6),
      exc: oneOf(q.exc, EXCS, defaults.exc)
    };
    DKEYS.forEach(function (k, s) { out[k] = clamp(Math.round(num(q[k], defaults[k])), DL_MIN[s], DL_MAX[s]); });
    out.seed = clamp(Math.round(num(q.seed, defaults.seed)), 1, SEED_MAX);
    return out;
  }

  /** Rule 9: a deadline stepper: the next offered value above (dir +1) or below (dir −1) the current one, which
      may itself be any whole number in the range (a URL); at the end of the list it stays. */
  function stepDeadline(sev, value, dir) {
    var list = DL_STEPS[sev], i;
    if (dir > 0) { for (i = 0; i < list.length; i++) if (list[i] > value) return list[i]; return list[list.length - 1]; }
    for (i = list.length - 1; i >= 0; i--) if (list[i] < value) return list[i];
    return list[0];
  }

  /** Rule 9: the next seed for "New stream": seed + 1, after 999 back to 1. */
  function nextSeed(seed) { return seed >= SEED_MAX ? 1 : seed + 1; }

  function runWith(items, p, order) {
    return run(items, { order: order, cap: p.cap, unowned: p.unowned, exc: p.exc,
      deadlines: [p.dCrit, p.dHigh, p.dMed, p.dLow] });
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var items = stream(p.seed);
    var recs = runWith(items, p, p.order);
    var other = runWith(items, p, p.order === 'score' ? 'exploited' : 'score');
    var m = measure(recs), mo = measure(other);
    var policy = DKEYS.every(function (k) { return p[k] === defaults[k]; });
    var std = policy ? null : measure(runWith(items, Object.assign({}, p, {
      dCrit: defaults.dCrit, dHigh: defaults.dHigh, dMed: defaults.dMed, dLow: defaults.dLow }), p.order));
    return {
      p: p,
      m: m,
      kevBy: p.order === 'score' ? { score: m.exposureKev, exploited: mo.exposureKev }
        : { score: mo.exposureKev, exploited: m.exposureKev },
      inTimeBy: p.order === 'score' ? { score: m.inTime, exploited: mo.inTime } : { score: mo.inTime, exploited: m.inTime },
      inTimeStd: std ? std.inTime : null,             // the share in time under the default deadlines, when they differ
      exposureStd: std ? std.exposure : null,
      arrivals: items.length,
      open: openItems(recs)
    };
  }

  /** Rule 10: the caption: the report against the tail (nothing open longer than 30 days; the tail with systems
      nobody owns; the tail on owned systems only), then at most one note, in this order: open-ended exceptions keep items out of the
      percentage; exceptions with an owner and an end date; deadlines other than the default policy (the share in
      time under the default ones, the same exposure); the order, when it matters (the known-exploited exposure
      under the other order differs by at least a quarter); overdue items on systems nobody owns, counted. */
  function captionKey(s) {
    var m = s.m, p = s.p, notes = [];
    var a = s.kevBy.score, b = s.kevBy.exploited;
    if (m.counts.excepted > 0 && p.exc === 'open') notes.push('nOpenExc');
    else if (p.exc === 'dated' && p.unowned > 0) notes.push('nDated');
    else if (s.inTimeStd !== null) notes.push('nDeadlines');
    else if (a - b >= a / 4 && a > 0) notes.push(p.order === 'score' ? 'nByScore' : 'nByKev');
    else if (m.overdueUnowned > 0) notes.push('nUnowned');
    var clean = !m.oldest || m.oldest.age <= CLEAN_AGE;
    return { key: clean ? 'capClean' : p.unowned > 0 ? 'capTail' : 'capTailOwned', notes: notes };
  }

  var logic = {
    DAYS: DAYS, SYSTEMS: SYSTEMS, SEV: SEV, SEV_P: SEV_P, SEV_LO: SEV_LO, SEV_HI: SEV_HI, EXPLOIT_P: EXPLOIT_P,
    EXC_DAYS: EXC_DAYS, ORDERS: ORDERS, EXCS: EXCS, DL_STEPS: DL_STEPS, DL_MIN: DL_MIN, DL_MAX: DL_MAX, DKEYS: DKEYS, SEED_MAX: SEED_MAX, BIN: BIN, CLEAN_AGE: CLEAN_AGE,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    nextSeed: nextSeed,
    stepDeadline: stepDeadline,
    rng: rng,
    stream: stream,
    before: before,
    fixesOn: fixesOn,
    run: run,
    status: status,
    openDays: openDays,
    measure: measure,
    openItems: openItems,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
