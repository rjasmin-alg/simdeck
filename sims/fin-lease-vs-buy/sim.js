/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-lease-vs-buy: one server bought for cash, bought on a loan or leased; cash paid, expense by year,
   the balance sheet at a year end and each way's NPV at the cost of capital. Explorer: the state is a pure function
   of the params (compute). Rules: SPEC.md. The month-by-month ledger is financing.js (promotable), the discounting
   discount.js (copied from fin-npv-discounting); this file adds the params, presets, picks and caption keys.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var node = typeof module === 'object' && module.exports;
  var D = node ? require('./discount.js') : root.SimdeckModels.discount;
  var F = node ? require('./financing.js') : root.SimdeckModels.financing;

  var WAYS = ['cash', 'loan', 'lease'];
  var ENDS = ['return', 'buyout', 'extend'];
  var BOOKS = ['rou', 'rent'];
  var LIM = {
    price: { min: 10000, max: 150000, step: 1000 },
    term: { min: 2, max: 5, step: 1 },
    lease: { min: 1, max: 5, step: 0.05 },
    residual: { min: 0, max: 50, step: 5 },
    loanRate: { min: 0, max: 15, step: 0.5 },
    coc: { min: 0, max: 20, step: 0.5 }
  };

  var defaults = {
    price: 60000, term: 3, lease: 2.9, residual: 20, loanRate: 6, coc: 8, end: 'return', books: 'rou', year: 1
  };

  /** Presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'three-ways', params: {} },
    { id: 'loan-at-coc', params: { loanRate: 8 } },
    { id: 'dear-money', params: { loanRate: 14, coc: 14 } },
    { id: 'buy-out', params: { end: 'buyout', year: 3 } },
    { id: 'extend', params: { end: 'extend', year: 4 } },
    { id: 'as-rent', params: { books: 'rent' } }
  ].map(function (x) { return { id: x.id, params: Object.assign({}, defaults, x.params) }; });

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  /** Snapped to the step, then cut to the step's decimals (0.05 steps would otherwise give 2.9000000000000004). */
  function snap(x, step) { return Number((Math.round(x / step) * step).toFixed(2)); }
  /** A number, or NaN for anything else, including '' and null (which Number() would read as 0). */
  function num(v) { return v === '' || v === null || typeof v === 'boolean' ? NaN : Number(v); }

  /** Years compared: the term, plus the extension year (SPEC.md "The ledger"). */
  function horizon(p) { return p.term + (p.end === 'extend' ? 1 : 0); }

  /** Params made safe (a URL may carry anything): numbers in range on their step, known choices, year within H. */
  function normalise(params) {
    var q = Object.assign({}, defaults, params);
    var out = {};
    Object.keys(LIM).forEach(function (k) {
      var v = num(q[k]), l = LIM[k];
      out[k] = Number.isFinite(v) ? clamp(snap(v, l.step), l.min, l.max) : defaults[k];
    });
    out.end = ENDS.indexOf(q.end) >= 0 ? q.end : defaults.end;
    out.books = BOOKS.indexOf(q.books) >= 0 ? q.books : defaults.books;
    var y = num(q.year);
    out.year = clamp(Number.isFinite(y) ? Math.round(y) : defaults.year, 0, horizon(out));
    return out;
  }

  /** Rule 8: NPV at annual rate c of the cash paid (outflows at m / 12 years) and what is owned at the end. */
  function npvOf(r, owns, c, years) {
    var s = 0;
    for (var m = 0; m < r.length; m++) if (r[m].cash) s -= D.presentValue(r[m].cash, c, m / 12);
    return s + D.presentValue(owns, c, years);
  }

  /** Rule 9: the ways with the best rounded amount (lowest when `low`), in WAYS order; all of them on a tie. */
  function best(ways, key, low) {
    var vals = ways.map(function (w) { return w[key]; });
    var target = low ? Math.min.apply(null, vals) : Math.max.apply(null, vals);
    return ways.filter(function (w) { return w[key] === target; }).map(function (w) { return w.id; });
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var price = p.price, n = 12 * p.term, H = horizon(p), M = 12 * H;
    var residual = price * p.residual / 100, rental = price * p.lease / 100;
    var j = F.monthlyRate(p.loanRate / 100), c = p.coc / 100;
    var nL = n + (p.end === 'extend' ? 12 : 0);
    var buyout = p.end === 'buyout';
    var common = { price: price, residual: residual, n: n, months: M };
    var ledgers = {
      cash: F.buyCash(common),
      loan: F.buyLoan(Object.assign({ j: j }, common)),
      lease: F.lease({ rental: rental, nL: nL, months: M, k: j, books: p.books, residual: residual, buyoutAt: buyout ? n : null })
    };
    var endValue = F.tidy(F.valueAt(price, residual, n, M));
    var ways = WAYS.map(function (id) {
      var r = ledgers[id];
      var owns = id === 'lease' && !buyout ? 0 : endValue;
      var end = F.totals(r, M), at = F.totals(r, 12 * p.year);
      var npv = npvOf(r, owns, c, H);
      return {
        id: id,
        paid: end.cash,
        paidR: D.roundMoney(end.cash),
        owns: owns,
        npv: npv,
        npvR: D.roundMoney(npv),
        expense: end.expense,
        interest: end.interest,
        yearly: F.yearly(r, H),
        series: F.cashSeries(r),
        asset: at.asset,
        liability: at.liability
      };
    });
    var by = {};
    ways.forEach(function (w) { by[w.id] = w; });
    var picks = { nominal: best(ways, 'paidR', true), value: best(ways, 'npvR', false) };
    var lease = by.lease;
    return {
      p: p,
      H: H,
      months: M,
      n: n,
      nL: nL,
      residual: residual,
      rental: rental,
      instalment: F.annuity(price, j, n),
      rightOfUse: F.totals(ledgers.lease, 0).liability, // L0 on the balance sheet, 0 as rent
      endValue: endValue,
      ways: ways,
      picks: picks,
      same: picks.nominal.join() === picks.value.join(),
      // the lease's year at the balance-sheet date (year 1 on day one), for the books note
      leaseYear: lease.yearly[Math.max(1, p.year) - 1],
      leaseYearN: Math.max(1, p.year)
    };
  }

  /** Rule 10: the picks that changed between two states. */
  function flipped(prev, next) {
    if (!prev || !next) return [];
    return ['nominal', 'value'].filter(function (k) { return prev.picks[k].join() !== next.picks[k].join(); });
  }

  /** Rule 12: the caption's main key and at most two notes, by priority: end, loan, books. */
  function captionKey(s) {
    var by = {};
    s.ways.forEach(function (w) { by[w.id] = w; });
    var notes = [];
    if (s.p.end === 'buyout') notes.push('nBuyout');
    if (s.p.end === 'extend') notes.push('nExtend');
    if (s.p.loanRate === s.p.coc) notes.push('nLoanCoc');
    else if (by.loan.npvR > by.cash.npvR) notes.push('nLoanCheap');
    if (s.p.books === 'rent') notes.push('nRent');
    else if (s.p.year === 0) notes.push('nRouDay');
    else if (s.p.loanRate > 0) notes.push('nRou'); // at 0 % the expense equals the rentals: nothing to say
    return { key: s.same ? 'capSame' : 'capDiffer', notes: notes.slice(0, 2) };
  }

  var logic = {
    WAYS: WAYS, ENDS: ENDS, BOOKS: BOOKS, LIM: LIM,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    best: best,
    horizon: horizon,
    flipped: flipped,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
