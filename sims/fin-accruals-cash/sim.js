/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-accruals-cash: a year of IT invoices posted month by month, seen as cash (when the money leaves) and
   as expense (when the service is used). Stepper: step n posts month n (1…12 the year, 13 the next year's first
   month, when the year's last invoices arrive). Rules: SPEC.md. The ledger itself is in ledger.js (promotable to
   models/); this file adds the contracts, the params, the presets and the page's derived numbers.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var Lg = typeof module === 'object' && module.exports
    ? require('./ledger.js')
    : root.SimdeckModels.ledger;

  var YEAR = 12;          // months in the fiscal year
  var MONTHS = YEAR + 1;  // the timeline: months 1…12, then the next year's first month

  /** The contracts, in their fixed order (the tie-break order of SPEC.md rule 6). Amounts in whole euros. Every
      contract starts with this fiscal year; only this year's service is shown (rule 5). */
  var CONTRACTS = [
    // annual support, invoiced and paid in month 1 for all twelve months
    { id: 'support', fee: 1000, use: monthsOf(1, YEAR, 1000), pay: at(1, 12000) },
    // colocation, billed quarterly in arrears: each quarter's invoice arrives (and is paid) the month after it
    { id: 'colo', fee: 1500, use: monthsOf(1, YEAR, 1500), pay: merge([at(4, 4500), at(7, 4500), at(10, 4500), at(13, 4500)]) },
    // the internet link, billed and paid in the month it is used
    { id: 'link', fee: 800, use: monthsOf(1, YEAR, 800), pay: monthsOf(1, YEAR, 800) },
    // a contractor's work in the year's last month, invoiced late: the invoice comes in the next year's first month
    { id: 'late', fee: 6000, use: at(YEAR, 6000), pay: at(MONTHS, 6000) }
  ];
  var IDS = CONTRACTS.map(function (c) { return c.id; });

  /** Arrays 0…MONTHS: `v` in months a…b. */
  function monthsOf(a, b, v) {
    var out = [];
    for (var m = 0; m <= MONTHS; m++) out.push(m >= a && m <= b ? v : 0);
    return out;
  }
  function at(m, v) { return monthsOf(m, m, v); }
  function merge(list) {
    return list.reduce(function (acc, a) { return acc.map(function (x, m) { return x + a[m]; }); }, monthsOf(1, 0, 0));
  }

  var defaults = { support: true, colo: true, link: true, late: true, fy: 1 };

  /** Presets, SPEC.md table; expected numbers there. `step` is where the preset opens. */
  var presets = [
    { id: 'year', params: { support: true, colo: true, link: true, late: true, fy: 1 }, step: 0 },
    { id: 'prepaid', params: { support: true, colo: false, link: false, late: false, fy: 1 }, step: 1 },
    { id: 'arrears', params: { support: false, colo: true, link: false, late: false, fy: 1 }, step: 3 },
    { id: 'late', params: { support: false, colo: false, link: true, late: true, fy: 1 }, step: 11 },
    { id: 'year-end', params: { support: true, colo: true, link: true, late: true, fy: 1 }, step: 12 }
  ];

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
    IDS.forEach(function (id) { out[id] = bool(q[id], defaults[id]); });
    return out;
  }

  /** Calendar month (1 = January … 12 = December) of timeline month m (1…13), for a year starting in month `fy`
      (rule 7: the start only names the months). */
  function calMonth(m, fy) {
    return ((fy - 1 + m - 1) % 12 + 12) % 12 + 1;
  }

  function sum(a, from, to) {
    var s = 0;
    for (var m = from; m <= to; m++) s += a[m];
    return s;
  }

  /** The state after month n is posted (n = 0: before the year). */
  function compute(n, params) {
    var p = normalise(params);
    var on = CONTRACTS.filter(function (c) { return p[c.id]; });
    var items = on.map(function (c) {
      var r = Lg.billed(c.use, c.pay);
      var tot = Lg.totals(r, n);
      return {
        id: c.id,
        fee: c.fee,
        use: c.use.slice(),
        pay: c.pay.slice(),
        useNow: n > 0 ? c.use[n] : 0,
        payNow: n > 0 ? c.pay[n] : 0,
        paid: tot.cash,
        used: tot.expense,
        bal: tot.cash - tot.expense            // rule 4: > 0 prepaid, < 0 accrued, 0 settled
      };
    });
    var cash = 0, expense = 0, prepaid = 0, accrued = 0;
    items.forEach(function (it) {
      cash += it.paid;
      expense += it.used;
      if (it.bal > 0) prepaid += it.bal;
      else if (it.bal < 0) accrued -= it.bal;
    });
    // the lines over the whole timeline (rule 3), for the chart
    var lineCash = [], lineExp = [];
    for (var m = 0; m <= MONTHS; m++) {
      lineCash.push(on.reduce(function (s, c) { return s + sum(c.pay, 0, m); }, 0));
      lineExp.push(on.reduce(function (s, c) { return s + sum(c.use, 0, m); }, 0));
    }
    return {
      n: n,
      fy: p.fy,
      items: items,
      cash: cash,
      expense: expense,
      prepaid: prepaid,
      accrued: accrued,
      net: cash - expense,                     // = prepaid − accrued
      cashNow: items.reduce(function (s, it) { return s + it.payNow; }, 0),
      expNow: items.reduce(function (s, it) { return s + it.useNow; }, 0),
      yearCash: lineCash[YEAR],                // rule 5
      yearExpense: lineExp[YEAR],
      lines: { cash: lineCash, expense: lineExp }
    };
  }

  /** What month n's posting did to one contract (rule 6). */
  function eventOf(it, n) {
    if (n === 0 || (it.payNow === 0 && it.useNow === 0)) return 'none';
    var before = it.bal - it.payNow + it.useNow;     // the balance at the end of the month before
    if (it.payNow > 0) {
      if (it.bal > 0) return 'prepay';                // paid ahead of use
      if (before < 0) return 'settle';                // pays for service already expensed
      return it.bal < 0 ? 'accrue' : 'same';          // part-paid: the unpaid use is accrued
    }
    return it.bal < 0 ? 'accrue' : 'release';         // used and not paid this month
  }

  var LEAD_ORDER = ['prepay', 'settle', 'accrue', 'release', 'same'];

  /** Caption keys (SPEC.md "Captions", rule 6): the lead sentence and the gap sentence, with the contract the lead
      is about. Ties between contracts with the same event go to the earlier contract in CONTRACTS order. */
  function captionKey(s) {
    if (s.items.length === 0) return { lead: 'cNone', gap: null, item: null };
    if (s.n === 0) return { lead: 'cStart', gap: null, item: null };
    if (s.n === MONTHS) return { lead: s.cashNow > 0 ? 'cNext' : 'cNextQuiet', gap: null, item: null };
    if (s.n === YEAR) return { lead: s.accrued > 0 ? 'cYearEnd' : 'cYearEndEven', gap: null, item: null };
    var best = null, rank = LEAD_ORDER.length;
    s.items.forEach(function (it) {
      var r = LEAD_ORDER.indexOf(eventOf(it, s.n));
      if (r >= 0 && r < rank) { rank = r; best = it; }
    });
    var leads = { prepay: 'cPrepay', settle: 'cSettle', accrue: 'cAccrue', release: 'cRelease', same: 'cSame' };
    var gap = s.prepaid > 0 && s.accrued > 0 ? 'gBoth'
      : s.prepaid > 0 ? 'gPrepaid'
      : s.accrued > 0 ? 'gAccrued'
      : 'gMeet';
    return { lead: best ? leads[LEAD_ORDER[rank]] : 'cQuiet', gap: gap, item: best ? best.id : null };
  }

  /** The quarter (1…4) an arrears invoice paid in month n covers: the three months before it. */
  function quarterOf(n) {
    return Math.floor((n - 2) / 3) + 1;
  }

  var logic = {
    YEAR: YEAR,
    MONTHS: MONTHS,
    CONTRACTS: CONTRACTS,
    IDS: IDS,
    defaults: defaults,
    presets: presets,
    steps: MONTHS,
    initial: function (p) { return compute(0, p); },
    step: function (s, n, p) { return compute(n, p); },
    compute: compute,
    normalise: normalise,
    calMonth: calMonth,
    eventOf: eventOf,
    captionKey: captionKey,
    quarterOf: quarterOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
