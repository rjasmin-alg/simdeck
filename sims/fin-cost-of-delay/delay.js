/* SPDX-License-Identifier: AGPL-3.0-or-later
   Cost of delay for a queue of projects done one after another (rules: SPEC.md 1–7). A project is its cost of delay
   (cd, whole euros of value lost per week until it is delivered) and its duration (d, whole weeks). One team works the
   queue in order with no gaps, so a project starts when the one before it is done; it loses cd every week from week 0
   until its own delivery. Total lost = Σ cd × done; the least total comes from ordering by cd ÷ d, largest first
   (weighted shortest processing time, Smith's rule), which the tests check against every order.
   Everything is in whole euros and weeks: no rounding anywhere. Ratios are compared exactly by cross-multiplying.
   Pure: no DOM, no words, plain data in and out, so the coordinator can promote it to models/delay.js unchanged.
   Registers on globalThis.SimdeckModels.delay in a page; module.exports under node. */
(function (root) {
  'use strict';

  /** Rules 2–4: the schedule of a queue. queue: [{ id, cd, d }, …] in order. Returns per project its start and done
      week, what it loses waiting (cd × start), while being built (cd × d) and in all (cd × done), and the totals. */
  function schedule(queue) {
    var t = 0, total = 0, wait = 0;
    var rows = queue.map(function (x, i) {
      var start = t;
      t += x.d;
      var r = { id: x.id, pos: i, cd: x.cd, d: x.d, start: start, done: t,
        wait: x.cd * start, build: x.cd * x.d, lost: x.cd * t };
      total += r.lost;
      wait += r.wait;
      return r;
    });
    return { rows: rows, weeks: t, total: total, wait: wait, build: total - wait };
  }

  /** Rule 1b: compare two projects by cd ÷ d, exactly: negative when a's ratio is larger (a goes first). */
  function byRatio(a, b) { return b.cd * a.d - a.cd * b.d; }

  /** Rule 5: the order a rule gives. items: [{ id, cd, d, v, i }] with i the list position (rule 1a's tie-break).
      rule: 'loud' (v, largest first), 'big' (d, largest first), 'small' (d, smallest first), 'value' (cd, largest
      first), 'ratio' (cd ÷ d, largest first). Returns the items in the new order (a copy). */
  var KEYS = {
    loud: function (a, b) { return b.v - a.v; },
    big: function (a, b) { return b.d - a.d; },
    small: function (a, b) { return a.d - b.d; },
    value: function (a, b) { return b.cd - a.cd; },
    ratio: byRatio
  };
  function order(items, rule) {
    var k = KEYS[rule];
    return items.slice().sort(function (a, b) { return k(a, b) || a.i - b.i; });
  }

  /** Rule 7: what swapping neighbours a (first) and b (right after it) saves: cd_b × d_a − cd_a × d_b (negative: it
      costs more). Nothing else in the queue changes. */
  function swapSaving(a, b) { return b.cd * a.d - a.cd * b.d; }

  /** Rule 1d: the neighbour swap that saves the most, the earlier one of equal savings; null when none saves. */
  function bestSwap(queue) {
    var best = null;
    for (var i = 0; i + 1 < queue.length; i++) {
      var s = swapSaving(queue[i], queue[i + 1]);
      if (s > 0 && (!best || s > best.save)) best = { pos: i, a: queue[i].id, b: queue[i + 1].id, save: s };
    }
    return best;
  }

  /** Rule 6, the check: the least total over every order of the queue (n! orders; fine up to 8). */
  function bruteBest(queue) {
    var best = Infinity;
    (function perm(rest, done) {
      if (!rest.length) { best = Math.min(best, schedule(done).total); return; }
      for (var i = 0; i < rest.length; i++) perm(rest.slice(0, i).concat(rest.slice(i + 1)), done.concat([rest[i]]));
    })(queue.slice(), []);
    return best;
  }

  /** A "nice" axis step (1, 2, 2.5 or 5 × 10^k) at least span ÷ parts. */
  function niceStep(span, parts) {
    var raw = Math.max(span, 1) / parts;
    var p = Math.pow(10, Math.floor(Math.log10(raw)));
    var m = [1, 2, 2.5, 5, 10].find(function (x) { return x * p >= raw - 1e-9; });
    return m * p;
  }

  var delay = {
    schedule: schedule, byRatio: byRatio, order: order, swapSaving: swapSaving, bestSwap: bestSwap,
    bruteBest: bruteBest, niceStep: niceStep, RULES: Object.keys(KEYS)
  };

  if (typeof module === 'object' && module.exports) module.exports = delay;
  else (root.SimdeckModels = root.SimdeckModels || {}).delay = delay;
})(typeof globalThis !== 'undefined' ? globalThis : this);
