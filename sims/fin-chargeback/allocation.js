/* SPDX-License-Identifier: AGPL-3.0-or-later
   Allocating a shared cost to departments by a key, and the spiral of departures under chargeback. Rules: SPEC.md
   rules 1–9.
   A department is { id, units: { <key>: n }, variable, quote }: its units of each allocation key, its own variable
   cost a month (what the shared cost loses when it leaves) and its outside offer a month (what it pays alone). The
   shared cost a month is the fixed cost plus the variable cost of every department still in. All amounts are whole
   euros and all units whole numbers, so every comparison is exact (integers, no rounding).
   Pure: no DOM, no words, plain data in and out, so the coordinator can promote it to models/ unchanged. Registers on
   globalThis.SimdeckModels.allocation in a page; module.exports under node. */
(function (root) {
  'use strict';

  /** Rule 1e: x ÷ n in cents, rounded to nearest, halves up (x, n ≥ 0); null when n = 0.
      From sims/fin-fixed-variable/stepcost.js @ 68befed (cents). */
  function cents(x, n) { return n > 0 ? Math.round(100 * x / n) : null; }

  /** Rule 2: the shared cost a month with these departments in: fixed + Σ their variable costs. */
  function shared(fixed, depts) {
    return depts.reduce(function (s, d) { return s + d.variable; }, fixed);
  }

  /** Rule 3: the key's units over these departments. */
  function units(depts, key) {
    return depts.reduce(function (s, d) { return s + d.units[key]; }, 0);
  }

  /** Rules 1a, 4: bills in whole euros, T × u ÷ U each, rounded so they add up to T exactly: every bill is floored
      and the euros left over go one each to the largest remainders; equal remainders go in the list's order.
      Returns { <id>: € }; {} when no department is in or the key's units are 0. */
  function bills(total, depts, key) {
    var U = units(depts, key), out = {};
    if (!depts.length || U <= 0) return out;
    var rest = total;
    var rems = depts.map(function (d, i) {
      var x = total * d.units[key];
      out[d.id] = Math.floor(x / U);
      rest -= out[d.id];
      return { id: d.id, r: x % U, i: i };
    });
    rems.sort(function (a, b) { return b.r - a.r || a.i - b.i; });
    for (var k = 0; k < rest; k++) out[rems[k].id] += 1;
    return out;
  }

  /** Rules 1b, 5: by how much the exact bill T × u ÷ U exceeds the offer, times U (an integer: T × u − q × U).
      Positive: dearer than going alone. 0: equal, which stays. */
  function excess(total, U, d, key) { return total * d.units[key] - d.quote * U; }

  /** Rules 1c, 6: the department that leaves this round: the largest positive excess; equal excesses go to the
      earlier department in the list. null when nobody's bill is above its offer. */
  function leaver(total, depts, key) {
    var U = units(depts, key), best = null, bestX = 0;
    depts.forEach(function (d) {
      var x = excess(total, U, d, key);
      if (x > bestX) { best = d.id; bestX = x; }
    });
    return best;
  }

  /** Rule 5: the departments whose exact bill is above their offer, in the list's order. */
  function over(total, depts, key) {
    var U = units(depts, key);
    return depts.filter(function (d) { return excess(total, U, d, key) > 0; }).map(function (d) { return d.id; });
  }

  /** Rule 7: the company's total a month: the shared cost of those in plus the outside offers of those out. */
  function company(fixed, depts, inIds) {
    var ins = depts.filter(function (d) { return inIds.indexOf(d.id) >= 0; });
    var outs = depts.filter(function (d) { return inIds.indexOf(d.id) < 0; });
    return shared(fixed, ins) + outs.reduce(function (s, d) { return s + d.quote; }, 0);
  }

  /** One round: who is in, the shared cost, the key's units, the price per unit (cents), the bills, who is over,
      and the company's total. */
  function round(fixed, depts, inIds, key) {
    var ins = depts.filter(function (d) { return inIds.indexOf(d.id) >= 0; });
    var T = shared(fixed, ins), U = units(ins, key);
    return {
      in: ins.map(function (d) { return d.id; }),
      total: T,
      units: U,
      unit: cents(T, U),
      bills: bills(T, ins, key),
      over: over(T, ins, key),
      company: company(fixed, depts, inIds),
      leaves: null
    };
  }

  /** Rules 6, 8: the rounds. Showback (charged = false) is one round: bills are shown, nobody leaves. Chargeback
      repeats: the round's leaver goes, the shared cost loses its variable cost, the next round splits what is left;
      it stops when nobody is over or nobody is left. `inIds`: the departments in at the start. */
  function spiral(fixed, depts, inIds, key, charged) {
    var ins = depts.filter(function (d) { return inIds.indexOf(d.id) >= 0; }).map(function (d) { return d.id; });
    var rounds = [];
    for (;;) {
      var r = round(fixed, depts, ins, key);
      rounds.push(r);
      if (!charged || !r.in.length) break;
      var go = leaver(r.total, depts.filter(function (d) { return ins.indexOf(d.id) >= 0; }), key);
      if (go === null) break;
      r.leaves = go;
      ins = ins.filter(function (id) { return id !== go; });
    }
    return rounds;
  }

  var api = {
    cents: cents, shared: shared, units: units, bills: bills, excess: excess, leaver: leaver, over: over,
    company: company, round: round, spiral: spiral
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.SimdeckModels = root.SimdeckModels || {}).allocation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
