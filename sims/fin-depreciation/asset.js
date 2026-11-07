/* SPDX-License-Identifier: AGPL-3.0-or-later
   The asset model: a bought asset's depreciation schedule over its useful life, year by year, by straight-line or
   declining balance down to a residual value, and its disposal (sold or retired at the end of a year: the gain or
   loss is the proceeds minus the book value). SPEC.md rules 1-6. Catalogue §5.23: fin-depreciation and
   fin-refresh-cycle share this model, so it is pure functions over plain numbers, no words and no dependencies, ready
   for the coordinator to promote to models/asset.js unchanged (models/README.md). A licence (an intangible asset) is
   amortised by the same functions. In a page it registers on globalThis.SimdeckModels.asset; under node it is
   module.exports. */
(function (root) {
  'use strict';

  /** Kept to a millionth of a unit, so year-by-year floating point cannot turn 6480 into 6479.9999…9 (rule 6). */
  function tidy(x) {
    var v = Math.round(x * 1e6) / 1e6;
    return v === 0 ? 0 : v;
  }

  /** Round to a whole unit, half away from zero, never -0 (rule 6). */
  function roundMoney(x) {
    var v = x < 0 ? -Math.round(-x) : Math.round(x);
    return v === 0 ? 0 : v;
  }

  /** The declining-balance rate: factor ÷ life (2 ÷ 5 = 40 % for double-declining over five years). */
  function rate(life, factor) {
    return (factor || 2) / life;
  }

  /** The schedule, years 1…life: [{ year, open, dep, close, switched, capped }] (open and close are book values).
      'sl' (rule 2): (cost − residual) ÷ life each year, built from the cumulative amount so the last close is the
      residual exactly. 'db' (rule 3): each year the larger of rate × opening book value and the rest spread evenly
      over the years left (opening − residual) ÷ years left, but never more than opening − residual. `switched` marks
      a year where the even spread is strictly larger (a tie is not a switch: rule 3's tie-break); `capped` a year
      where the residual floor cut the amount. */
  function schedule(cost, life, residual, method, factor) {
    var out = [], open = cost;
    var r = rate(life, factor);
    for (var y = 1; y <= life; y++) {
      var dep, switched = false, capped = false;
      if (method === 'sl') {
        var close0 = tidy(cost - (cost - residual) * y / life);
        dep = tidy(open - close0);
      } else {
        var rest = tidy(open - residual);
        var declining = tidy(r * open);                 // both tidied before comparing, so float noise cannot
        var even = tidy(rest / (life - y + 1));         // turn a tie into a switch (rule 3 tie-break, rule 6)
        dep = declining;
        if (even > declining) { dep = even; switched = true; }
        if (dep > rest) { dep = rest; capped = true; }
        dep = tidy(dep);
      }
      var close = tidy(open - dep);
      out.push({ year: y, open: open, dep: dep, close: close, switched: switched, capped: capped });
      open = close;
    }
    return out;
  }

  /** The book value at the end of year y (0 = the purchase date: the cost). */
  function bookAt(sched, cost, y) {
    return y <= 0 ? cost : sched[Math.min(y, sched.length) - 1].close;
  }

  /** Sold or retired at the end of year y for `proceeds` (rule 4): the gain (> 0) or loss (< 0) is proceeds − book
      value; equal is neither (the tie-break). */
  function disposal(sched, cost, y, proceeds) {
    var book = bookAt(sched, cost, y);
    var gain = tidy(proceeds - book);
    return { year: y, book: book, proceeds: proceeds, gain: gain, outcome: gain > 0 ? 'gain' : gain < 0 ? 'loss' : 'none' };
  }

  /** The schedule and the disposal as shown, in whole units (rule 6): the cumulative depreciation is rounded, each
      year's amount is the difference of two rounded sums, the book value is cost − rounded sum, so the shown years add
      up to the shown totals. `cum[k]` 0…life, `dep[k]` and `book[k]` likewise (dep[0] = 0). */
  function shown(sched, cost, y, proceeds) {
    var cum = [0], dep = [0], book = [cost], acc = 0;
    for (var k = 0; k < sched.length; k++) {
      acc = tidy(acc + sched[k].dep);
      cum.push(roundMoney(acc));
      dep.push(cum[k + 1] - cum[k]);
      book.push(cost - cum[k + 1]);
    }
    var bk = book[Math.max(0, Math.min(y, sched.length))];
    var gain = proceeds - bk;
    return {
      cum: cum, dep: dep, book: book,
      sale: { year: y, book: bk, proceeds: proceeds, gain: gain, depSoFar: cost - bk, total: cost - bk - gain,
        outcome: gain > 0 ? 'gain' : gain < 0 ? 'loss' : 'none' }
    };
  }

  var model = {
    tidy: tidy, roundMoney: roundMoney, rate: rate, schedule: schedule, bookAt: bookAt, disposal: disposal, shown: shown
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {}).asset = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
