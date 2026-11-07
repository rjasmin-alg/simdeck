/* SPDX-License-Identifier: AGPL-3.0-or-later
   Paying a contract monthly or some months upfront at a discount: the payment schedule, the cash balance it leaves,
   the cost in today's money and the annual rate the discount implies (SPEC.md rules 1-9). The part other contract
   pages could reuse (catalogue §5.23): pure functions over plain numbers, no words, so the coordinator can promote it
   to models/ unchanged (models/README.md). Time is in months from signing (month i starts at t = i); rates are annual
   decimals (0.08 = 8 %). It needs the discount model, passed in (discount.js), so it requires nothing itself.
   In a page it registers on globalThis.SimdeckModels.prepay; under node it is module.exports. */
(function (root) {
  'use strict';

  var DAYS_PER_YEAR = 365;

  /** Rule 3: months after the invoice that a payment on `days`-day terms leaves (30 days = 0.986 months). */
  function termsMonths(days) {
    return 12 * days / DAYS_PER_YEAR;
  }

  /** Rules 2-3: the payments of one plan, in time order. `upfront` months (0 = none) are invoiced at month 0 at
      (1 - discount) of their price; the rest of the `months` are invoiced monthly at `monthly`. Each invoice is paid
      `days` after it. Returns [{ t, amount, months }] (months = how many months the payment covers). */
  function schedule(o) {
    var lag = termsMonths(o.days), out = [];
    var up = Math.min(o.upfront, o.months);
    if (up > 0) out.push({ t: lag, amount: up * o.monthly * (1 - o.discount), months: up });
    for (var i = up; i < o.months; i++) out.push({ t: i + lag, amount: o.monthly, months: 1 });
    return out;
  }

  /** Rule 4: the expense booked in each contract year (12 months each): a month costs `monthly`, or
      (1 - discount) of it when it was paid upfront. The payment terms play no part. */
  function expenseByYear(o) {
    var years = Math.ceil(o.months / 12), out = [];
    for (var y = 0; y < years; y++) {
      var s = 0;
      for (var i = 12 * y; i < Math.min(12 * (y + 1), o.months); i++) s += i < o.upfront ? o.monthly * (1 - o.discount) : o.monthly;
      out.push(s);
    }
    return out;
  }

  /** Rules 5-6: the cash balance over time. Starts at `start`; `inflows` and `payments` are [{ t, amount }].
      At the same instant inflows come first (tie-break). Returns { points: [{ t, bal }] after each event, starting
      with { t: 0, bal: start }, low: { t, bal } the lowest balance, earliest on a tie }. */
  function balance(start, inflows, payments) {
    // payments listed first: on a tie only the comparator's k puts the inflow ahead
    var ev = payments.map(function (x) { return { t: x.t, d: -x.amount, k: 1 }; })
      .concat(inflows.map(function (x) { return { t: x.t, d: x.amount, k: 0 }; }));
    ev.sort(function (a, b) { return a.t - b.t || a.k - b.k; });
    var bal = start, points = [{ t: 0, bal: start }], low = { t: 0, bal: start };
    ev.forEach(function (e) {
      bal += e.d;
      points.push({ t: e.t, bal: bal });
      if (bal < low.bal) low = { t: e.t, bal: bal };
    });
    return { points: points, low: low };
  }

  /** The balance just after every event at or before t (a step function of the points). */
  function balanceAt(points, t) {
    var b = points[0].bal;
    for (var i = 0; i < points.length && points[i].t <= t; i++) b = points[i].bal;
    return b;
  }

  /** Rule 7: the most one plan's balance falls below another's at any instant (0 if never below). */
  function tiedUp(base, other) {
    var ts = base.map(function (p) { return p.t; }).concat(other.map(function (p) { return p.t; }));
    var most = 0;
    ts.forEach(function (t) { most = Math.max(most, balanceAt(base, t) - balanceAt(other, t)); });
    return most;
  }

  /** Rule 8: the payments in today's money at annual rate c (t in months). */
  function costToday(payments, c, D) {
    var s = 0;
    payments.forEach(function (x) { s += D.presentValue(x.amount, c, x.t / 12); });
    return s;
  }

  /** Rule 9: the annual rate the discount implies: the r at which paying n months upfront at (1 - d) today costs the
      same as paying 1 at the start of each of those n months, so it does not depend on the price or the terms.
      0 when d = 0; found by bisection on [0, 100] (0 % to 10 000 %) to 1e-12. null when no rate exists (n·(1 - d)
      not above the first month's 1: everything but the first month free). */
  function impliedRate(n, d) {
    if (!(d > 0)) return 0;
    var paid = n * (1 - d);
    if (paid <= 1) return null;
    var f = function (r) {
      var s = -paid;
      for (var i = 0; i < n; i++) s += Math.pow(1 + r, -i / 12);
      return s; // > 0 while r is below the implied rate
    };
    var lo = 0, hi = 100;
    if (f(hi) > 0) return null;
    while (hi - lo > 1e-12) {
      var mid = (lo + hi) / 2;
      if (f(mid) > 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  var model = {
    DAYS_PER_YEAR: DAYS_PER_YEAR,
    termsMonths: termsMonths,
    schedule: schedule,
    expenseByYear: expenseByYear,
    balance: balance,
    balanceAt: balanceAt,
    tiedUp: tiedUp,
    costToday: costToday,
    impliedRate: impliedRate
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {}).prepay = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
