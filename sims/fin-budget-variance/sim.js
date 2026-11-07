/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-budget-variance: a year's cloud and licence budget, phased by month, against the actuals booked
   month by month. The variance to date splits into volume (more used), price (dearer per unit) and timing (an
   invoice booked in another month than the service it is for); the run-rate forecast carries the latest month to
   year end. Stepper: step n books month n (1…12). Rules: SPEC.md. The ledger is in ledger.js (copied from
   fin-accruals-cash, promotable to models/): a line's booked actuals and its expense are the ledger's `billed(use,
   pay)`, so the timing variance to date is the ledger's cash − expense.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var Lg = typeof module === 'object' && module.exports
    ? require('./ledger.js')
    : root.SimdeckModels.ledger;

  var YEAR = 12;

  /** The budget lines, in their fixed order (rule 1). Budget: `qty` units a month at `price` euros a unit, the same
      every month (flat phasing). Whole euros, illustrative. */
  var LINES = [
    { id: 'cloud', qty: 2000, price: 5 },   // cloud compute, 2 000 units a month at €5: €10 000 a month
    { id: 'lic', qty: 150, price: 40 }      // licence subscription, 150 seats at €40 a seat a month: €6 000 a month
  ];
  var IDS = LINES.map(function (l) { return l.id; });

  /** The injections (rules 2-6). */
  var VOLUME = { line: 'cloud', from: 5, add: 300 };     // cloud usage 2 000 → 2 300 units from month 5
  var PRICE = { line: 'lic', from: 7, to: 48 };          // licence price €40 → €48 a seat from month 7 (the renewal)
  var LATE = { line: 'cloud', month: 10 };               // month 10's cloud invoice is booked in month 11
  var SPEND = { line: 'cloud', looked: 10, month: 11 };  // the apparent underspend to date at month 10 is spent in 11

  var defaults = { volume: true, price: true, late: true, accrue: false, spend: false, fy: 1 };

  /** Presets, SPEC.md table; expected numbers there. `step` is where the preset opens. */
  var presets = [
    { id: 'all', params: { volume: true, price: true, late: true, accrue: false, spend: false, fy: 1 }, step: 0 },
    { id: 'real', params: { volume: true, price: true, late: false, accrue: false, spend: false, fy: 1 }, step: 7 },
    { id: 'late', params: { volume: false, price: false, late: true, accrue: false, spend: false, fy: 1 }, step: 10 },
    { id: 'use-it', params: { volume: false, price: false, late: true, accrue: false, spend: true, fy: 1 }, step: 10 },
    { id: 'accrued', params: { volume: true, price: true, late: true, accrue: true, spend: false, fy: 1 }, step: 10 }
  ];

  var FLAGS = ['volume', 'price', 'late', 'accrue', 'spend'];

  function bool(v, dflt) {
    if (v === true || v === 'true' || v === 1 || v === '1') return true;
    if (v === false || v === 'false' || v === 0 || v === '0') return false;
    return dflt;
  }

  /** Params made safe (a URL may carry anything): booleans, and the fiscal year's first month 1…12. */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var fy = Math.round(Number(q.fy));
    var out = { fy: Number.isFinite(fy) && fy >= 1 && fy <= 12 ? fy : defaults.fy };
    FLAGS.forEach(function (k) { out[k] = bool(q[k], defaults[k]); });
    return out;
  }

  /** Calendar month (1 = January … 12 = December) of fiscal month m, for a year starting in month `fy` (rule 10:
      the start only names the months). */
  function calMonth(m, fy) {
    return ((fy - 1 + m - 1) % 12 + 12) % 12 + 1;
  }

  function zeros() {
    var out = [];
    for (var m = 0; m <= YEAR; m++) out.push(0);
    return out;
  }
  function sum(a, from, to) {
    var s = 0;
    for (var m = from; m <= to; m++) s += a[m];
    return s;
  }
  function z(x) { return x === 0 ? 0 : x; }

  /** One line's months 0…12 (index 0 is empty): budget, quantity and price used, expense (what belongs to the
      month), booked (what the month's report shows), the accrual in it, and the three variances (rules 1-7). */
  function lineMonths(l, p, extra) {
    var qty = zeros(), price = zeros(), budget = zeros(), expense = zeros(), booked = zeros(), accrual = zeros();
    var vol = zeros(), prc = zeros(), tim = zeros();
    for (var m = 1; m <= YEAR; m++) {
      budget[m] = l.qty * l.price;                                                    // rule 1
      qty[m] = l.qty + (p.volume && l.id === VOLUME.line && m >= VOLUME.from ? VOLUME.add : 0) + (extra[m] || 0);
      price[m] = p.price && l.id === PRICE.line && m >= PRICE.from ? PRICE.to : l.price;
      expense[m] = qty[m] * price[m];                                                 // rule 2
    }
    // rule 3: every invoice is booked in the month it is for, except the late one, booked a month later
    for (m = 1; m <= YEAR; m++) {
      var late = p.late && l.id === LATE.line && m === LATE.month;
      if (late) booked[m + 1] += expense[m];
      else booked[m] += expense[m];
      // rule 4: an accrual books the missing invoice's estimate (here exact) and is reversed when the invoice arrives
      if (late && p.accrue) {
        accrual[m] += expense[m];
        accrual[m + 1] -= expense[m];
      }
    }
    for (m = 1; m <= YEAR; m++) {
      booked[m] += accrual[m];
      vol[m] = (qty[m] - l.qty) * l.price;                                            // rule 5
      prc[m] = (price[m] - l.price) * qty[m];
      tim[m] = booked[m] - expense[m];
    }
    return { id: l.id, budgetQty: l.qty, budgetPrice: l.price, qty: qty, price: price, budget: budget,
      expense: expense, booked: booked, accrual: accrual, vol: vol, prc: prc, tim: tim };
  }

  /** The year to date at month n for one line or the total (rule 6). */
  function toDate(L, n) {
    var r = Lg.billed(L.expense, L.booked);
    var tot = Lg.totals(r, n);
    var out = {
      budget: sum(L.budget, 0, n),
      expense: tot.expense,
      booked: tot.cash,
      vol: sum(L.vol, 0, n),
      price: sum(L.prc, 0, n),
      timing: z(tot.cash - tot.expense)
    };
    out.variance = z(out.booked - out.budget);
    return out;
  }

  function lines(p) {
    var plain = LINES.map(function (l) { return lineMonths(l, p, {}); });
    var spent = 0;
    if (p.spend) {
      // rule 8: what looks left over to date at month 10 is spent in month 11 on more of the line, at its budget price
      var looked = 0;
      plain.forEach(function (L) { looked += toDate(L, SPEND.looked).budget - toDate(L, SPEND.looked).booked; });
      spent = Math.max(0, looked);
    }
    if (spent === 0) return { lines: plain, spent: 0 };
    var extra = {};
    var host = LINES.filter(function (l) { return l.id === SPEND.line; })[0];
    extra[SPEND.month] = spent / host.price;
    return {
      lines: LINES.map(function (l) { return lineMonths(l, p, l.id === SPEND.line ? extra : {}); }),
      spent: spent
    };
  }

  /** The state after month n is booked (n = 0: before the year). */
  function compute(n, params) {
    var p = normalise(params);
    var built = lines(p);
    var ls = built.lines.map(function (L) {
      return Object.assign({}, L, { ytd: toDate(L, n) });
    });
    var month = { budget: zeros(), expense: zeros(), booked: zeros() };
    ls.forEach(function (L) {
      for (var m = 1; m <= YEAR; m++) {
        month.budget[m] += L.budget[m];
        month.expense[m] += L.expense[m];
        month.booked[m] += L.booked[m];
      }
    });
    var ytd = { budget: 0, expense: 0, booked: 0, vol: 0, price: 0, timing: 0, variance: 0 };
    ls.forEach(function (L) { Object.keys(ytd).forEach(function (k) { ytd[k] += L.ytd[k]; }); });
    var budgetYear = sum(month.budget, 0, YEAR);
    // rule 9: the run rate is the latest month booked; the forecast adds it for every month left
    var runRate = n > 0 ? month.booked[n] : 0;
    var left = YEAR - n;
    var forecast = n > 0 ? ytd.booked + runRate * left : budgetYear;
    return {
      n: n,
      fy: p.fy,
      flags: { volume: p.volume, price: p.price, late: p.late, accrue: p.accrue, spend: p.spend },
      lines: ls,
      month: month,
      ytd: ytd,
      now: n > 0
        ? { budget: month.budget[n], booked: month.booked[n], expense: month.expense[n], variance: z(month.booked[n] - month.budget[n]) }
        : { budget: 0, booked: 0, expense: 0, variance: 0 },
      budgetYear: budgetYear,
      runRate: runRate,
      left: left,
      forecast: forecast,
      fcVariance: z(forecast - budgetYear),
      spent: built.spent
    };
  }

  /** Caption keys (SPEC.md "Captions", rule 11): the lead sentence and the to-date sentence. */
  function captionKey(s) {
    var f = s.flags, n = s.n;
    if (n === 0) return { lead: 'cStart', gap: null };
    if (n === YEAR) {
      var y = s.ytd.variance;
      return { lead: y > 0 ? 'cYearOver' : y < 0 ? 'cYearUnder' : 'cYearOn', gap: f.late ? 'gYearLate' : null };
    }
    var lead;
    if (f.spend && n === SPEND.month && s.spent > 0) lead = 'cSpend';
    else if (f.late && n === LATE.month) lead = f.accrue ? 'cAccrual' : 'cMissing';
    else if (f.late && n === LATE.month + 1) lead = f.accrue ? 'cReplace' : 'cArrives';
    else if (f.spend && n === SPEND.month) lead = 'cNoSpend';
    else if (f.price && n === PRICE.from) lead = 'cPrice';
    else if (f.volume && n === VOLUME.from) lead = 'cVolume';
    else lead = s.now.variance > 0 ? 'cOver' : s.now.variance < 0 ? 'cUnder' : 'cOnPlan';
    var d = s.ytd;
    var gap = d.variance > 0 ? 'gOver'
      : d.variance < 0 ? 'gUnder'
      : d.vol === 0 && d.price === 0 && d.timing === 0 ? 'gOn'
      : 'gEven';
    return { lead: lead, gap: gap };
  }

  var logic = {
    YEAR: YEAR,
    LINES: LINES,
    IDS: IDS,
    VOLUME: VOLUME,
    PRICE: PRICE,
    LATE: LATE,
    SPEND: SPEND,
    defaults: defaults,
    presets: presets,
    steps: YEAR,
    initial: function (p) { return compute(0, p); },
    step: function (s, n, p) { return compute(n, p); },
    compute: compute,
    normalise: normalise,
    calMonth: calMonth,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
