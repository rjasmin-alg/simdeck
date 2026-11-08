/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for rate-limiting: one arrival stream through a token bucket (policer) and a leaky bucket (a queue drained at
   a fixed rate), side by side. Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   Time is an integer in tenths of a second (ds) so every instant (0.2, 0.5, 1 s leaks; 0.5 s steps) is exact;
   the token level is an integer in tenths of a token for the same reason (r tokens/s = r tenths per ds).
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var STEP_DS = 5; // one step = 0.5 s

  /** The arrival stream of each pattern: [{ id, at }] with at in ds, sorted by (at, id). */
  function arrivalsFor(pattern) {
    var out = [], id = 1;
    function add(at, count) { for (var i = 0; i < count; i++) out.push({ id: id++, at: at }); }
    if (pattern === 'steady') {
      // 3 requests/s for 6 s, on the half-second: 1, 2, 1, 2, ... (18 requests, the last group at 5.5 s)
      for (var k = 0; k < 12; k++) add(k * STEP_DS, k % 2 === 0 ? 1 : 2);
    } else if (pattern === 'idle-burst') {
      add(0, 5); // a burst of 5, then 3 s of silence, then another burst of 5
      add(30, 5);
    } else {
      add(0, 10); // burst: 10 requests at t = 0
    }
    return out;
  }

  /** ds between two leaks of the leaky bucket: 1/r s. r is 1, 2 or 5, so this is exact. */
  function gap(p) { return Math.round(10 / p.r); }

  var logic = {
    STEP_DS: STEP_DS,
    arrivalsFor: arrivalsFor,
    gap: gap,

    /** r: rate (requests or tokens per s) of both limiters; b: token bucket size; q: queue size; pattern: arrivals. */
    defaults: { r: 2, b: 5, q: 5, pattern: 'burst' },

    /** A burst is over in 3 s; the other patterns run 6 s (task: 6 and 12 steps). */
    steps: function (p) { return p.pattern === 'burst' ? 6 : 12; },

    /** Time handled by step n, in ds: step 1 is t = 0, step n is t = 0.5 (n - 1) s. Step 0 is before t = 0. */
    timeOf: function (n) { return (n - 1) * STEP_DS; },

    /** State at step 0: nothing has arrived yet; the token bucket starts full, the queue empty. */
    initial: function (p) {
      return {
        t: -STEP_DS,
        arrivals: arrivalsFor(p.pattern),
        next: 0, // index of the first arrival not yet handled
        tb: { level: p.b * 10, levelAt: 0, passed: [], rejected: [], decided: [] },
        lb: { queue: [], lastOut: null, passed: [], dropped: [], decided: [] }
      };
    },

    /** State after step n: every event in (t_prev, t_n] in time order. At one instant: (1) the token bucket refills
     *  and the leaky bucket releases requests that were already waiting, (2) the instant's arrivals in id order,
     *  (3) a request that reached an idle leaky bucket at this instant leaves at once. */
    step: function (s, n, p) {
      var T = logic.timeOf(n);
      var arrivals = s.arrivals;
      var next = s.next;
      var tb = { level: s.tb.level, levelAt: s.tb.levelAt, passed: s.tb.passed.slice(), rejected: s.tb.rejected.slice(), decided: [] };
      var lb = { queue: s.lb.queue.slice(), lastOut: s.lb.lastOut, passed: s.lb.passed.slice(), dropped: s.lb.dropped.slice(), decided: [] };
      var cap = p.b * 10;

      function refill(time) {
        if (time > tb.levelAt) {
          tb.level = Math.min(cap, tb.level + p.r * (time - tb.levelAt));
          tb.levelAt = time;
        }
      }
      // release from the head of the queue every request due at or before `time`
      function leak(time) {
        while (lb.queue.length && lb.queue[0].out <= time) {
          var r = lb.queue.shift();
          lb.passed.push(r);
          lb.decided.push(r.id);
        }
      }

      for (;;) {
        var ta = next < arrivals.length && arrivals[next].at <= T ? arrivals[next].at : Infinity;
        var tl = lb.queue.length && lb.queue[0].out <= T ? lb.queue[0].out : Infinity;
        if (ta === Infinity && tl === Infinity) break;
        var now = Math.min(ta, tl);
        // (1) refill, and leak the requests due now; this instant's arrivals are not in the queue yet
        refill(now);
        leak(now);
        if (ta !== now) continue;
        // (2) this instant's arrivals, in id order
        var batch = [];
        while (next < arrivals.length && arrivals[next].at === now) batch.push(arrivals[next++]);
        batch.sort(function (a, b) { return a.id - b.id; });
        batch.forEach(function (a) {
          if (tb.level >= 10) { tb.level -= 10; tb.passed.push({ id: a.id, at: a.at }); }
          else tb.rejected.push({ id: a.id, at: a.at });
          tb.decided.push(a.id);
          if (lb.queue.length >= p.q) lb.dropped.push({ id: a.id, at: a.at });
          else {
            var out = lb.lastOut == null ? a.at : Math.max(a.at, lb.lastOut + gap(p));
            lb.lastOut = out;
            lb.queue.push({ id: a.id, at: a.at, out: out });
          }
          lb.decided.push(a.id);
        });
        // (3) a request that found the leaky bucket idle leaves at its own arrival instant
        leak(now);
      }
      refill(T);
      // a request both admitted and released in this step is listed once
      lb.decided = lb.decided.filter(function (id, i, all) { return all.indexOf(id) === i; });
      return { t: T, arrivals: arrivals, next: next, tb: tb, lb: lb };
    },

    /** Longest wait (ds) of the requests the leaky bucket has released; 0 when none. */
    maxDelay: function (lb) {
      return lb.passed.reduce(function (m, r) { return Math.max(m, r.out - r.at); }, 0);
    },

    /** Longest wait (ds) any admitted request will have, counting the ones still queued. */
    maxDelayAll: function (lb) {
      return lb.passed.concat(lb.queue).reduce(function (m, r) { return Math.max(m, r.out - r.at); }, 0);
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
