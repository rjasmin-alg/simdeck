/* SPDX-License-Identifier: AGPL-3.0-or-later
   The cost of downtime and the price of a nine: what an hour down costs in each band of the week (lost revenue, idle
   staff, recovery work, penalties), the expected yearly downtime cost at each availability level, the yearly cost of
   the redundancy that buys it, each extra nine against what it saves, and the cheapest level. Rules: SPEC.md 1–8.
   Exact, then to the euro: each level's downtime cost is computed exactly in "scaled" units of 1/700 000 € (S) and
   rounded once to whole euros (halves up); every comparison is between those whole-euro amounts, the ones a page
   shows, so a verdict never contradicts the numbers beside it. Pure: no DOM, no words, plain data in and out, so the coordinator can promote it to
   models/downtime.js unchanged. Registers on globalThis.SimdeckModels.downtime in a page; module.exports under node. */
(function (root) {
  'use strict';

  var WORK = 50;                 // Mon–Fri 08:00–18:00: hours a week
  var OFF = 118;                 // every other hour of the week
  var WEEK = WORK + OFF;         // 168
  var YEAR_S = 31536000;         // seconds in a 365-day year
  var S = 700000;                // scaled units per euro: 7 (days a week) × 10^5 (the finest level, five nines)
  var LEVELS = [2, 3, 4, 5];     // availability in nines: 99 %, 99.9 %, 99.99 %, 99.999 %
  var PARTS = ['rev', 'staff', 'fix', 'pen'];

  /** Rule 2: € per hour down in working hours and outside them, by component.
      c: { rev, off (% of rev outside working hours), people, fix, pen }; wage: € per idle person-hour. */
  function hourCost(c, wage) {
    var work = { rev: c.rev, staff: c.people * wage, fix: c.fix, pen: c.pen };
    var off = { rev: c.rev * c.off / 100, staff: 0, fix: c.fix, pen: c.pen };
    work.sum = work.rev + work.staff + work.fix + work.pen;
    off.sum = off.rev + off.staff + off.fix + off.pen;
    return { work: work, off: off };
  }

  /** Rule 3: the week's sum of hourly costs, by component and in all (€; ÷ 168 is the average hour). */
  function weekSum(hc) {
    var w = {};
    PARTS.concat('sum').forEach(function (k) { w[k] = WORK * hc.work[k] + OFF * hc.off[k]; });
    return w;
  }

  /** Rule 4: seconds down a year at n nines (unavailability 10^−n of the year). */
  function downSeconds(n) { return YEAR_S / Math.pow(10, n); }

  /** Rule 5: the expected yearly downtime cost at n nines, in S: ws × 365 ÷ (7 × 10^n) €. */
  function downCost(ws, n) { return ws * 365 * Math.pow(10, 5 - n); }

  /** Rule 6: the yearly cost of the redundancy for n nines (€): 0 at two nines, ha for the third, each further nine
      grow × the one before. */
  function haCost(ha, n, grow) {
    var sum = 0, step = ha;
    for (var k = 3; k <= n; k++) { sum += step; step *= grow; }
    return sum;
  }

  /** Rules 5–6: each level's downtime cost (exact in S, and in whole euros), redundancy cost and total (€). */
  function levels(ws, ha, grow) {
    return LEVELS.map(function (n) {
      var d = downCost(ws, n), down = euros(d), h = haCost(ha, n, grow);
      return { n: n, downS: d, down: down, ha: h, tot: down + h };
    });
  }

  /** Rule 1a / 8: the cheapest level; equal totals go to the fewer nines. */
  function best(ls) {
    var at = ls[0];
    ls.forEach(function (l) { if (l.tot < at.tot) at = l; });
    return at.n;
  }

  /** Rule 7 (tie 1b): the nine that takes level n−1 to n: what it saves, what it costs (€), and its verdict. */
  function nine(ls, n) {
    var a = ls[LEVELS.indexOf(n - 1)], b = ls[LEVELS.indexOf(n)];
    var value = a.down - b.down, cost = b.ha - a.ha;
    return { n: n, value: value, cost: cost, verdict: value > cost ? 'pays' : value < cost ? 'loses' : 'even' };
  }

  /** Rule 1c: a target level against no redundancy (two nines): 'save', 'even' or 'loss'. */
  function outcome(ls, n) {
    var d = ls[0].tot - ls[LEVELS.indexOf(n)].tot;
    return d > 0 ? 'save' : d < 0 ? 'loss' : 'even';
  }

  /** Whole euros from S, halves up (every amount here is 0 or more). */
  function euros(x) { return Math.floor((2 * x + S) / (2 * S)); }

  var downtime = {
    WORK: WORK, OFF: OFF, WEEK: WEEK, YEAR_S: YEAR_S, S: S, LEVELS: LEVELS, PARTS: PARTS,
    hourCost: hourCost, weekSum: weekSum, downSeconds: downSeconds, downCost: downCost, haCost: haCost,
    levels: levels, best: best, nine: nine, outcome: outcome, euros: euros
  };

  if (typeof module === 'object' && module.exports) module.exports = downtime;
  else (root.SimdeckModels = root.SimdeckModels || {}).downtime = downtime;
})(typeof globalThis !== 'undefined' ? globalThis : this);
