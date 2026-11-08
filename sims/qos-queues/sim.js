/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for QoS queues: three traffic classes (voice, video, bulk) share one outgoing link of C packets per tick,
   through a FIFO queue, strict priority queues (PQ) or weighted round robin (WRR, the equal-packet form of weighted
   fair queuing). A full queue drops new arrivals (tail drop).
   An explorer: no steps; the page draws initial(params), which runs the whole simulation from the params.
   Rules and every expected number, with their sources (RFC 2474, 3246, 4594, 7567; Shreedhar & Varghese 1995): SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. The arrival order within a tick comes from a seeded generator.
   State is plain JSON. Reusable as is (pure functions over plain data, no strings): run(), schedule(). */
(function (root) {
  'use strict';

  var T = 300;                       // ticks simulated, 0 … 299
  var FROM = 100;                    // statistics over ticks FROM … T − 1, after the queues have filled
  var CLASSES = ['voice', 'video', 'bulk'];   // also the priority order (PQ) and the visiting order (WRR)

  /** mulberry32, the same generator as Simdeck.rng (sim.test.js checks they agree). */
  function rng(seed) {
    var a = seed >>> 0;
    var next = function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.int = function (n) { return Math.floor(next() * n); };
    return next;
  }

  function ratesOf(p) { return [p.rVoice, p.rVideo, p.rBulk]; }
  function weightsOf(p) { return [p.wVoice, p.wVideo, p.wBulk]; }

  /** One scheduler pass (rules 1, 3, 4): takes up to C packets from the heads of the queues, in place.
      queues: arrays of packets { c, t } (class index, arrival tick). rr: the round robin's position { i, used },
      carried from tick to tick (WRR only; updated in place). Returns the packets sent, in send order. */
  function schedule(sched, queues, C, weights, rr) {
    var sent = [], i;
    if (sched === 'fifo') {
      while (sent.length < C && queues[0].length) sent.push(queues[0].shift());
    } else if (sched === 'pq') {
      // Rule 3: always the highest-priority non-empty queue (index 0 = voice first).
      for (i = 0; i < queues.length; i++) while (sent.length < C && queues[i].length) sent.push(queues[i].shift());
    } else {
      // Rule 4: visits voice, video, bulk in turn, up to w_i from each; an empty queue loses the rest of its turn.
      // A tick that runs out of capacity mid-turn ends there, and the next tick carries on from that point.
      var busy = function () { return queues.some(function (q) { return q.length > 0; }); };
      rr = rr || { i: 0, used: 0 };
      while (sent.length < C && busy()) {
        var q = queues[rr.i];
        while (rr.used < weights[rr.i] && sent.length < C && q.length) { sent.push(q.shift()); rr.used++; }
        if (rr.used >= weights[rr.i] || !q.length) { rr.i = (rr.i + 1) % queues.length; rr.used = 0; }
      }
    }
    return sent;
  }

  /** The whole run: per-tick series, totals over ticks FROM … T − 1, and the last tick as a snapshot. */
  function run(p) {
    var rates = ratesOf(p), weights = weightsOf(p), r = rng(p.seed);
    var nq = p.sched === 'fifo' ? 1 : 3;
    var queues = [], acc = [0, 0, 0], rr = { i: 0, used: 0 }, i, t;
    for (i = 0; i < nq; i++) queues.push([]);
    var delivered = [], dropped = [], fill = [];
    var tot = CLASSES.map(function () { return { offered: 0, delivered: 0, dropped: 0, wait: 0 }; });
    var snap = null;

    for (t = 0; t < T; t++) {
      // (1) arrivals: rate_i per tick, fractional rates accumulate; the tick's arrivals in a seeded random order
      var arr = [];
      for (i = 0; i < 3; i++) {
        acc[i] += rates[i];
        var k = Math.floor(acc[i]);
        acc[i] -= k;
        for (var j = 0; j < k; j++) arr.push(i);
      }
      for (var m = arr.length - 1; m > 0; m--) {          // Fisher–Yates with the seeded generator
        var x = r.int(m + 1), tmp = arr[m]; arr[m] = arr[x]; arr[x] = tmp;
      }
      // (2) queue each arrival, or drop it if its queue is full (tail drop, rule 2)
      var dTick = [0, 0, 0], drops = [];
      arr.forEach(function (c) {
        var q = queues[nq === 1 ? 0 : c];
        if (t >= FROM) tot[c].offered++;
        if (q.length >= p.limit) { dTick[c]++; drops.push(c); if (t >= FROM) tot[c].dropped++; }
        else q.push({ c: c, t: t });
      });
      var before = queues.map(function (q) { return q.map(function (pk) { return pk.c; }); });
      var ages = queues.map(function (q) { return q.map(function (pk) { return pk.t; }); });
      // (3) the scheduler sends up to C packets
      var sent = schedule(p.sched, queues, p.C, weights, rr);
      // (4) delay of a sent packet = departure tick − arrival tick
      var sTick = [0, 0, 0];
      sent.forEach(function (pk) {
        sTick[pk.c]++;
        if (t >= FROM) { tot[pk.c].delivered++; tot[pk.c].wait += t - pk.t; }
      });
      delivered.push(sTick);
      dropped.push(dTick);
      fill.push(queues.map(function (q) { return q.length; }));
      if (t === T - 1) {
        var sentFrom = before.map(function (q, qi) { return q.length - queues[qi].length; });
        snap = { t: t, queues: before, arrived: ages, sentFrom: sentFrom, sent: sent.map(function (pk) { return pk.c; }), dropped: drops };
      }
    }

    var n = T - FROM;
    var totals = tot.map(function (o) {
      return {
        offered: o.offered, delivered: o.delivered, dropped: o.dropped,
        offeredRate: o.offered / n, deliveredRate: o.delivered / n, droppedRate: o.dropped / n,
        dropPct: o.offered ? 100 * o.dropped / o.offered : 0,
        delay: o.delivered ? o.wait / o.delivered : null
      };
    });
    var all = tot.reduce(function (s, o) { return { offered: s.offered + o.offered, delivered: s.delivered + o.delivered, dropped: s.dropped + o.dropped }; },
      { offered: 0, delivered: 0, dropped: 0 });
    all.dropPct = all.offered ? 100 * all.dropped / all.offered : 0;
    all.offeredRate = rates[0] + rates[1] + rates[2];
    all.deliveredRate = all.delivered / n;
    return { series: { delivered: delivered, dropped: dropped, fill: fill }, totals: totals, all: all, snapshot: snap };
  }

  var logic = {
    /** Parameter defaults. The page's controls describe how each one is shown. */
    defaults: { sched: 'fifo', rVoice: 2, rVideo: 5, rBulk: 8, C: 10, limit: 20, wVoice: 2, wVideo: 3, wBulk: 5, seed: 1 },

    /** The whole picture, recomputed from the params (an explorer has no steps). */
    initial: function (p) { return run(p); },

    /** Presets, keys 1–6; the page gives them their labels. */
    presets: [
      { id: 'fifo-congested', params: { sched: 'fifo' } },
      { id: 'priority', params: { sched: 'pq' } },
      { id: 'starvation', params: { sched: 'pq', rVoice: 11 } },
      { id: 'weighted', params: { sched: 'wrr' } },
      { id: 'bufferbloat', params: { sched: 'fifo', limit: 60 } },
      { id: 'uncongested', params: { sched: 'fifo', rVideo: 3, rBulk: 4 } }
    ],

    T: T, FROM: FROM, CLASSES: CLASSES, rng: rng, run: run, schedule: schedule
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
