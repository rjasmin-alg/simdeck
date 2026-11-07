/* SPDX-License-Identifier: AGPL-3.0-or-later
   Indexation and currency over a multi-year contract (SPEC.md rules 1-8). The part other contract pages could reuse
   (catalogue §5.23): pure functions over plain numbers, no words and no page code, so the coordinator can promote it
   to models/indexation.js unchanged (models/README.md). Rates are in percent as given (2 = 2 %), so a comparison
   with the cap or the floor never meets floating-point noise; years are 1-based in the text, 0-based in arrays.
   Payment y is due at the start of contract year y; inflation[k] is the inflation during year k + 1, applied at the
   next anniversary. In a page it registers on globalThis.SimdeckModels.indexation; under node it is module.exports. */
(function (root) {
  'use strict';

  /** Price level at each payment (rule 2): level[0] = 1, level[y] = level[y − 1] · (1 + inflation[y − 1] / 100). */
  function priceLevel(inflation, years) {
    var level = [1];
    for (var y = 1; y < years; y++) level.push(level[y - 1] * (1 + inflation[y - 1] / 100));
    return level;
  }

  /** The yearly adjustment a capped clause applies (rule 5): the inflation clamped to [floor, cap] (both in percent),
      and which bound held it. Equal to a bound is inside it (held: null). A floor above the cap is lowered to it. */
  function adjust(rate, cap, floor) {
    var lo = Math.min(floor, cap);
    if (rate > cap) return { rate: cap, held: 'cap' };
    if (rate < lo) return { rate: lo, held: 'floor' };
    return { rate: rate, held: null };
  }

  /** Price factor per year against the price at signing, and per anniversary what held it (rules 3-5).
      clause: 'fixed' (opts.premium in percent on every year), 'indexed', 'capped' (opts.cap, opts.floor). */
  function factors(clause, inflation, years, opts) {
    var f = [], held = [null];
    if (clause === 'fixed') {
      for (var y = 0; y < years; y++) { f.push(1 + opts.premium / 100); if (y) held.push(null); }
      return { factor: f, held: held };
    }
    f.push(1);
    for (var k = 1; k < years; k++) {
      var a = clause === 'capped' ? adjust(inflation[k - 1], opts.cap, opts.floor) : { rate: inflation[k - 1], held: null };
      f.push(f[k - 1] * (1 + a.rate / 100));
      held.push(a.held);
    }
    return { factor: f, held: held };
  }

  /** One contract along the paths (rules 6-8). base: the yearly price at signing in the contract currency;
      fx[y]: euros per unit of the contract currency at payment y (all 1 for a euro contract).
      Per year: the price in the contract currency, nominal euros paid, real euros (signing-day money). */
  function contract(o) {
    var level = priceLevel(o.inflation, o.years);
    var fc = factors(o.clause, o.inflation, o.years, o);
    var rows = [], nominal = 0, real = 0, atStartRate = 0;
    for (var y = 0; y < o.years; y++) {
      var price = o.base * fc.factor[y];
      var eur = price * o.fx[y];
      var r = eur / level[y];
      rows.push({ year: y + 1, factor: fc.factor[y], held: fc.held[y], level: level[y], fx: o.fx[y], price: price, nominal: eur, real: r });
      nominal += eur;
      real += r;
      atStartRate += price * o.fx[0];
    }
    return { rows: rows, nominal: nominal, real: real, fxEffect: nominal - atStartRate };
  }

  /** Round to a whole euro, half away from zero, never −0 (as discount.js roundMoney in fin-npv-discounting). */
  function roundMoney(x) {
    var r = x < 0 ? -Math.round(-x) : Math.round(x);
    return r === 0 ? 0 : r;
  }

  var model = { priceLevel: priceLevel, adjust: adjust, factors: factors, contract: contract, roundMoney: roundMoney };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {}).indexation = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
