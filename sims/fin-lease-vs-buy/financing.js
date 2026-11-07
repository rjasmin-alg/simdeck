/* SPDX-License-Identifier: AGPL-3.0-or-later
   Financing ledger: one piece of hardware bought for cash, bought on a loan or leased, month by month (SPEC.md "The
   ledger", rules 1-7). It extends the capex-opex ledger (sims/fin-capex-opex/ledger.js: cash, capex, dep, opex) with
   the two lines a financing needs, interest and the liability (debt), and splits the expense into dep, interest and
   rent. Pure functions over plain numbers, no words, so the coordinator can promote it to models/ unchanged
   (models/README.md). Rows 0…M: row 0 is day one, row m the end of month m. Each row: cash (paid out), capex (added
   to an asset), dep (depreciation), interest, rent, debt (change in a liability: + borrowed, − repaid). Rates are
   decimals per month. In a page it registers on globalThis.SimdeckModels.financing; under node it is module.exports. */
(function (root) {
  'use strict';

  var FIELDS = ['cash', 'capex', 'dep', 'interest', 'rent', 'debt'];

  function rows(months) {
    var out = [];
    for (var m = 0; m <= months; m++) out.push({ cash: 0, capex: 0, dep: 0, interest: 0, rent: 0, debt: 0 });
    return out;
  }

  /** The monthly rate equivalent to an annual effective rate (decimals): (1 + a)^(1/12) − 1 (rule 3). */
  function monthlyRate(annual) {
    return annual === 0 ? 0 : Math.pow(1 + annual, 1 / 12) - 1;
  }

  /** Rule 1: the hardware's value at month m, straight from price to residual at month n and on, never below 0. */
  function valueAt(price, residual, n, m) {
    return Math.max(0, price - (price - residual) * m / n);
  }

  /** Rule 3: the level instalment that repays `amount` over n months at rate j; amount / n when j is 0. */
  function annuity(amount, j, n) {
    return j === 0 ? amount / n : amount * j / (1 - Math.pow(1 + j, -n));
  }

  /** Rule 6: present value of n payments of q at the end of months 1…n at rate k; q n when k is 0. */
  function presentRentals(q, k, n) {
    if (k === 0) return q * n;
    var s = 0;
    for (var m = 1; m <= n; m++) s += q * Math.pow(1 + k, -m);
    return s;
  }

  /** Rule 2's depreciation of an owned server: each month the drop of the value line, months from..to. */
  function depreciate(r, price, residual, n, from, to) {
    for (var m = from; m <= to; m++) r[m].dep += valueAt(price, residual, n, m - 1) - valueAt(price, residual, n, m);
  }

  /** Rule 2: paid on day one, owned, depreciated along the value line over months 1…M. */
  function buyCash(o) {
    var r = rows(o.months);
    r[0].cash = o.price;
    r[0].capex = o.price;
    depreciate(r, o.price, o.residual, o.n, 1, o.months);
    return r;
  }

  /** Rule 3: borrowed in full on day one, repaid in n level instalments at monthly rate j; depreciated as rule 2. */
  function buyLoan(o) {
    var r = rows(o.months);
    var a = annuity(o.price, o.j, o.n), bal = o.price;
    r[0].capex = o.price;
    r[0].debt = o.price;
    for (var m = 1; m <= Math.min(o.n, o.months); m++) {
      var i = bal * o.j;
      r[m].interest = i;
      r[m].cash = a;
      r[m].debt = -(a - i);
      bal += i - a;
    }
    depreciate(r, o.price, o.residual, o.n, 1, o.months);
    return r;
  }

  /** Rules 4-7: rentals q at the end of months 1…nL, as rent or on the balance sheet (right-of-use asset and
      liability at monthly rate k); with buyoutAt, the residual is paid and the server owned from that month. */
  function lease(o) {
    var r = rows(o.months);
    var last = Math.min(o.nL, o.months);
    if (o.books === 'rou') {
      var l0 = presentRentals(o.rental, o.k, o.nL), bal = l0;
      r[0].capex = l0;
      r[0].debt = l0;
      for (var m = 1; m <= last; m++) {
        var i = bal * o.k;
        r[m].cash = o.rental;
        r[m].dep = l0 / o.nL;
        r[m].interest = i;
        r[m].debt = -(o.rental - i);
        bal += i - o.rental;
      }
    } else {
      for (var q = 1; q <= last; q++) {
        r[q].cash = o.rental;
        r[q].rent = o.rental;
      }
    }
    if (o.buyoutAt != null && o.buyoutAt <= o.months) {
      r[o.buyoutAt].cash += o.residual;
      r[o.buyoutAt].capex += o.residual;
    }
    return r;
  }

  /** Kept to a millionth of a unit, so month-by-month sums cannot turn x.5 into x.4999…9 (rule 11). */
  function tidy(x) {
    var v = Math.round(x * 1e6) / 1e6;
    return v === 0 ? 0 : v;
  }

  /** Running sums of rows from…to (clamped), tidied. */
  function sumRange(r, from, to) {
    var s = { cash: 0, capex: 0, dep: 0, interest: 0, rent: 0, debt: 0 };
    var a = Math.max(0, from), b = Math.min(to, r.length - 1);
    for (var m = a; m <= b; m++) FIELDS.forEach(function (f) { s[f] += r[m][f]; });
    FIELDS.forEach(function (f) { s[f] = tidy(s[f]); });
    return s;
  }

  /** The lines at month m: cash paid so far, expense so far (and its parts), asset, liability. Cash paid = expense +
      asset − liability (the ledger's identity). */
  function totals(r, m) {
    var s = sumRange(r, 0, m);
    return {
      cash: s.cash,
      dep: s.dep,
      interest: s.interest,
      rent: s.rent,
      expense: tidy(s.dep + s.interest + s.rent),
      asset: tidy(s.capex - s.dep),
      liability: s.debt
    };
  }

  /** Expense of each year 1…years (months 12y − 11 … 12y): { dep, interest, rent, total }. */
  function yearly(r, years) {
    var out = [];
    for (var y = 1; y <= years; y++) {
      var s = sumRange(r, 12 * y - 11, 12 * y);
      out.push({ dep: s.dep, interest: s.interest, rent: s.rent, total: tidy(s.dep + s.interest + s.rent) });
    }
    return out;
  }

  /** Cash paid so far at each month 0…M. */
  function cashSeries(r) {
    var out = [], s = 0;
    for (var m = 0; m < r.length; m++) {
      s += r[m].cash;
      out.push(tidy(s));
    }
    return out;
  }

  var model = {
    monthlyRate: monthlyRate, valueAt: valueAt, annuity: annuity, presentRentals: presentRentals,
    buyCash: buyCash, buyLoan: buyLoan, lease: lease,
    totals: totals, yearly: yearly, cashSeries: cashSeries, tidy: tidy
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {}).financing = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
