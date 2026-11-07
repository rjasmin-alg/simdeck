/* SPDX-License-Identifier: AGPL-3.0-or-later
   From sims/fin-npv-discounting/discount.js @ b341da3, copied unchanged (models/discount.js does not exist yet; COMMON.md §6).
   "SPEC.md rules" below are that sim's SPEC; here they are rules 1-3 of this SPEC.md.
   Discounting: the time value of money (SPEC.md rules 1-5). The part the investment pages reuse (catalogue §5.23):
   kept apart from the page's model, pure functions over plain numbers, no words, so the coordinator can promote it
   to models/discount.js unchanged (models/README.md). Rates are decimals (0.08 = 8 %); year 0 is today and a flow in
   year t arrives at the end of year t. In a page it registers on globalThis.SimdeckModels.discount; under node it is
   module.exports. */
(function (root) {
  'use strict';

  /** Value today of 1 received at the end of year t: 1 / (1 + rate)^t. */
  function factor(rate, t) {
    return 1 / Math.pow(1 + rate, t);
  }

  /** Value today of an amount received at the end of year t. */
  function presentValue(amount, rate, t) {
    return amount * factor(rate, t);
  }

  /** Net present value of flows[0..], flows[t] at the end of year t (flows[0] today, not discounted). */
  function npv(flows, rate) {
    var sum = 0;
    for (var t = 0; t < flows.length; t++) sum += presentValue(flows[t], rate, t);
    return sum;
  }

  /** Each year's flow, factor and present value: [{ t, cf, df, pv }]. */
  function table(flows, rate) {
    return flows.map(function (cf, t) {
      var df = factor(rate, t);
      return { t: t, cf: cf, df: df, pv: cf * df };
    });
  }

  /** Round to a whole unit, half away from zero, and never -0 (SPEC.md rule 5). */
  function roundMoney(x) {
    var r = x < 0 ? -Math.round(-x) : Math.round(x);
    return r === 0 ? 0 : r;
  }

  /** -1, 0 or 1: the sign of x rounded to a whole unit, so floating-point noise never decides it. */
  function sign(x) {
    var r = roundMoney(x);
    return r > 0 ? 1 : r < 0 ? -1 : 0;
  }

  var model = { factor: factor, presentValue: presentValue, npv: npv, table: table, roundMoney: roundMoney, sign: sign };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {}).discount = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
