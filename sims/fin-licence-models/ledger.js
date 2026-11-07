/* SPDX-License-Identifier: AGPL-3.0-or-later
   From sims/fin-capex-opex/ledger.js @ 2177381, copied unchanged (models/ledger.js does not exist yet; COMMON.md §6).
   "SPEC.md rules" below are that sim's SPEC; here the rows are years, row 0 day one (this SPEC.md, "The ledger").
   The ledger: a month-by-month timeline with three lines, cash, expense and book value (SPEC.md "The ledger", rules
   2-4, 8). The shared model catalogue §5.23 puts under the capex, accruals, variance, lease and licence pages: pure
   functions over plain numbers, no words, so the coordinator can promote it to models/ledger.js unchanged
   (models/README.md). Rows 0…N: row 0 is day one, row m the end of month m; each row holds that month's cash (paid
   out), capex (added to the asset), dep (depreciation) and opex (any other expense). In a page it registers on
   globalThis.SimdeckModels.ledger; under node it is module.exports. */
(function (root) {
  'use strict';

  function row() { return { cash: 0, capex: 0, dep: 0, opex: 0 }; }
  function rows(months) {
    var out = [];
    for (var m = 0; m <= months; m++) out.push(row());
    return out;
  }

  /** Capitalised when the price reaches the threshold (SPEC.md rule 1: equal is capitalised). */
  function isCapitalised(price, threshold) {
    return price >= threshold;
  }

  /** A purchase paid on day one. Capitalised: an asset depreciated straight-line over `months`, no residual value
      (rule 2). Not capitalised: the whole price expensed on day one (rule 3). */
  function purchase(price, months, capitalised) {
    var r = rows(months);
    r[0].cash = price;
    if (capitalised) {
      r[0].capex = price;
      for (var m = 1; m <= months; m++) r[m].dep = price / months;
    } else {
      r[0].opex = price;
    }
    return r;
  }

  /** A service costing `total` over `months`: each month's fee billed, paid and expensed at the end of that month
      (rule 4). */
  function service(total, months) {
    var r = rows(months);
    for (var m = 1; m <= months; m++) {
      r[m].cash = total / months;
      r[m].opex = total / months;
    }
    return r;
  }

  /** Kept to a millionth of a unit, so summing price / N month by month cannot turn 62.5 into 62.4999…9 and flip a
      rounding tie (rule 8). */
  function tidy(x) {
    var v = Math.round(x * 1e6) / 1e6;
    return v === 0 ? 0 : v;
  }

  /** The running sums of rows 0…m (m clamped to the timeline), tidied. */
  function sums(r, m) {
    var s = row();
    var end = Math.max(0, Math.min(m, r.length - 1));
    for (var k = 0; k <= end; k++) {
      s.cash += r[k].cash;
      s.capex += r[k].capex;
      s.dep += r[k].dep;
      s.opex += r[k].opex;
    }
    return { cash: tidy(s.cash), capex: tidy(s.capex), dep: tidy(s.dep), opex: tidy(s.opex) };
  }

  /** The three lines (and the profit effects) at month m: exact amounts. */
  function totals(r, m) {
    var s = sums(r, m);
    return {
      cash: s.cash,
      expense: s.opex + s.dep,
      book: tidy(s.capex - s.dep),
      ebitda: tidy(-s.opex),
      ebit: tidy(-(s.opex + s.dep))
    };
  }

  /** Every month's totals, 0…N: the lines to draw. */
  function series(r) {
    return r.map(function (_, m) { return totals(r, m); });
  }

  /** Round to a whole unit, half away from zero, never -0. */
  function roundMoney(x) {
    var v = x < 0 ? -Math.round(-x) : Math.round(x);
    return v === 0 ? 0 : v;
  }

  /** The totals at month m as shown (rule 8): each sum rounded on its own, then expense and book value built from
      the rounded parts, so cash = expense + book value holds on the screen as in the ledger. */
  function shown(r, m) {
    var s = sums(r, m);
    var opex = roundMoney(s.opex), dep = roundMoney(s.dep), capex = roundMoney(s.capex);
    var z = function (x) { return x === 0 ? 0 : x; };
    return {
      cash: roundMoney(s.cash),
      expense: opex + dep,
      book: capex - dep,
      ebitda: z(-opex),
      ebit: z(-(opex + dep))
    };
  }

  var model = {
    isCapitalised: isCapitalised, purchase: purchase, service: service,
    sums: sums, totals: totals, series: series, shown: shown, roundMoney: roundMoney
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {}).ledger = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
