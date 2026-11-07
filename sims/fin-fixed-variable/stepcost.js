/* SPDX-License-Identifier: AGPL-3.0-or-later
   Fixed, step and variable costs of a platform against a price per user: the blocks of capacity, the monthly cost and
   its parts, the average and the marginal cost, the spare capacity, and the break-even volume (textbook, first and
   for good). Rules: SPEC.md rules 1–8.
   A platform is { fixed, step, cap, perUser, size }: the fixed cost a month, the cost of one capacity block a month,
   the users one block takes at the planned utilisation, the variable cost per user a month, and a block's users at
   100 %. All amounts are whole euros, so every sum is exact.
   Pure: no DOM, no words, plain data in and out, so the coordinator can promote it to models/stepcost.js unchanged
   (fin-chargeback takes its unit cost from here). Registers on globalThis.SimdeckModels.stepcost in a page;
   module.exports under node. */
(function (root) {
  'use strict';

  /** Rules 1a, 3: blocks for n users, ⌈n ÷ cap⌉; a full block stays one block. */
  function blocks(n, cap) { return n <= 0 ? 0 : Math.ceil(n / cap); }

  /** Rule 4: the monthly cost of n users and its parts. */
  function cost(pl, n) {
    var b = blocks(n, pl.cap);
    var steps = pl.step * b, variable = pl.perUser * n;
    return { blocks: b, fixed: pl.fixed, steps: steps, variable: variable, total: pl.fixed + steps + variable };
  }

  /** Rule 1e: x ÷ n in cents, rounded to nearest, halves up (x, n ≥ 0); null when n = 0. */
  function cents(x, n) { return n > 0 ? Math.round(100 * x / n) : null; }

  /** Rule 5: the average cost per user and its three shares, in cents; null at 0 users. The total and the fixed share
      are rounded; the block share is the rest, so the three shares add up to the rounded average. */
  function average(pl, n) {
    if (n <= 0) return null;
    var c = cost(pl, n);
    var total = cents(c.total, n), fixed = cents(c.fixed, n), variable = 100 * pl.perUser;
    return { total: total, fixed: fixed, steps: total - fixed - variable, variable: variable };
  }

  /** Rules 1b, 6: does the next user open a block, and what it costs. */
  function opensBlock(pl, n) { return n % pl.cap === 0; }
  function marginal(pl, n) { return pl.perUser + (opensBlock(pl, n) ? pl.step : 0); }

  /** Rule 7: user places paid for and idle, and their monthly cost (exact: euros × places ÷ size, may be fractional). */
  function spare(pl, n) {
    var places = blocks(n, pl.cap) * pl.size - n;
    return { places: places, cost: pl.step * places / pl.size };
  }

  /** Rules 1c, 4: positive when running it yourself is cheaper than the service at `price` per user. */
  function diff(pl, n, price) { return price * n - cost(pl, n).total; }
  function outcome(d) { return d > 0 ? 'inhouse' : d < 0 ? 'service' : 'even'; }

  /** Rule 8: the margin of one full block against the service: (p − v) × cap − S. */
  function blockMargin(pl, price) { return (price - pl.perUser) * pl.cap - pl.step; }

  /** Rule 8, textbook: F ÷ (p − v − S ÷ cap) as a plain number; null when that margin is ≤ 0. */
  function textbook(pl, price) {
    var m = blockMargin(pl, price);
    return m > 0 ? pl.fixed * pl.cap / m : null;
  }

  /** Rule 8: the first user of block j's paying tail (in-house cost ≤ service), or null when none of block j pays. */
  function payFrom(pl, price, j) {
    var lo = (j - 1) * pl.cap + 1;
    var need = Math.ceil((pl.fixed + pl.step * j) / (price - pl.perUser));
    var m = Math.max(lo, need);
    return m <= j * pl.cap ? m : null;
  }

  var LIMIT = 1e6;   // blocks searched; far beyond any param (a positive block margin is at least 1 €)

  /** Rule 8, first: the smallest n ≥ 1 with cost ≤ p × n; null when there is none. */
  function first(pl, price) {
    if (price <= pl.perUser) return null;
    var grows = blockMargin(pl, price) > 0;
    for (var j = 1; j <= LIMIT; j++) {
      var m = payFrom(pl, price, j);
      if (m !== null) return m;
      if (!grows) return null;      // a block's best point never improves: only block 1 could pay
    }
    return null;
  }

  /** Rule 8, for good: the smallest n ≥ 1 from which every m ≥ n pays; null when the block margin is ≤ 0. */
  function forGood(pl, price) {
    if (price <= pl.perUser || blockMargin(pl, price) <= 0) return null;
    var j = 1;
    while (j < LIMIT && (price - pl.perUser) * ((j - 1) * pl.cap + 1) < pl.fixed + pl.step * j) j++;
    if (j === 1) return 1;
    var tail = payFrom(pl, price, j - 1);
    return tail !== null ? tail : (j - 1) * pl.cap + 1;
  }

  var api = {
    blocks: blocks, cost: cost, cents: cents, average: average, opensBlock: opensBlock, marginal: marginal,
    spare: spare, diff: diff, outcome: outcome, blockMargin: blockMargin, textbook: textbook, payFrom: payFrom,
    first: first, forGood: forGood
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.SimdeckModels = root.SimdeckModels || {}).stepcost = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
