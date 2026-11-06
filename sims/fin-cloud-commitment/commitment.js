/* SPDX-License-Identifier: AGPL-3.0-or-later
   A usage commitment against paying on demand: what a commitment level costs over its term (paid whether used or
   not), its unused part, the on-demand part above it, each server level's utilisation against break-even, and the
   best level. Rules: SPEC.md rules 1–7.
   Usage is in hundredths of a server per month (integers), prices in € per server-month, so the sums are exact.
   Pure: no DOM, no words, plain data in and out, so the coordinator can promote it to models/commitment.js unchanged.
   Registers on globalThis.SimdeckModels.commitment in a page; module.exports under node. */
(function (root) {
  'use strict';

  var ONE = 100;   // hundredths in one server

  /** Rule 3: usage month by month over the term. u: year 1 in whole servers; years 2…term are u × later ÷ 100. */
  function termUsage(u, years, later) {
    var out = u.map(function (x) { return x * ONE; });
    for (var y = 2; y <= years; y++) u.forEach(function (x) { out.push(x * later); });
    return out;
  }

  /** € for h hundredths of a server-month at a price per server-month. */
  function euros(h, price) { return h * price / ONE; }

  /** Rules 4–5: the term's totals for a commitment of c servers. us: termUsage; cp: committed price; p: on demand. */
  function cost(us, c, cp, p) {
    var C = c * ONE, all = 0, unused = 0, od = 0;
    us.forEach(function (U) {
      all += euros(U, p);
      unused += euros(Math.max(0, C - U), cp);
      od += euros(Math.max(0, U - C), p);
    });
    var paid = us.length * c * cp;
    return { all: all, paid: paid, used: paid - unused, unused: unused, od: od, with: paid + od, save: all - (paid + od) };
  }

  /** Rule 6: how much of server level k (1, 2, …) the usage takes, in hundredths of server-months over the term. */
  function levelUse(us, k) {
    var sum = 0;
    us.forEach(function (U) { sum += Math.min(ONE, Math.max(0, U - ONE * (k - 1))); });
    return sum;
  }

  /** Rule 6 (tie 1b): 'pays' above break-even, 'even' at it, 'loses' below; margin is the level's saving in €. */
  function level(us, k, cp, p) {
    var margin = euros(levelUse(us, k), p) - us.length * cp;
    return { k: k, use: levelUse(us, k), margin: margin, verdict: margin > 0 ? 'pays' : margin < 0 ? 'loses' : 'even' };
  }

  /** Rule 7 (tie 1a): the smallest c in 0…cmax with the lowest total with commitment. */
  function best(us, cmax, cp, p) {
    var at = 0, low = cost(us, 0, cp, p).with;
    for (var c = 1; c <= cmax; c++) {
      var w = cost(us, c, cp, p).with;
      if (w < low) { low = w; at = c; }
    }
    return at;
  }

  /** Rule 1d: x as a whole percent of t, rounded to nearest, halves away from zero; null when t is not above 0. */
  function pct(x, t) {
    if (!(t > 0)) return null;
    var q = Math.floor((200 * Math.abs(x) + t) / (2 * t));
    return x < 0 && q > 0 ? -q : q;   // never −0
  }

  /** 'save', 'even' or 'loss' (rule 1c). */
  function outcome(save) { return save > 0 ? 'save' : save < 0 ? 'loss' : 'even'; }

  var commitment = {
    ONE: ONE, termUsage: termUsage, euros: euros, cost: cost, levelUse: levelUse, level: level, best: best, pct: pct,
    outcome: outcome
  };

  if (typeof module === 'object' && module.exports) module.exports = commitment;
  else (root.SimdeckModels = root.SimdeckModels || {}).commitment = commitment;
})(typeof globalThis !== 'undefined' ? globalThis : this);
