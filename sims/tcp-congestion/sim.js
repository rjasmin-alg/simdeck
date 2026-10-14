/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for TCP congestion control: the congestion window (cwnd) of one flow, round by round, for Reno and CUBIC.
   An explorer: no steps; the page draws initial(params), which recomputes the whole series from the params.
   Rules and every expected number, with their sources (RFC 5681, RFC 6928, RFC 9438): SPEC.md.
   One point per RTT round r = 0 … ROUNDS: the window sent in that round (cwnd, ssthresh, in MSS), its phase and the
   loss event the round ends with. A loss in round r changes the window from round r + 1 on.
   Pure: no DOM, no Math.random, no Date, no timers. Random losses come from a seeded generator. State is plain JSON.
   Reusable as is (pure functions over plain data, no strings): run(), summarize(), cubicW(), cubicK().
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var ROUNDS = 60;            // the chart is 60 RTT rounds wide (points 0 … 60)
  var INIT_SSTHRESH = 64;     // "arbitrarily high" initial ssthresh (RFC 5681 §3.1), 64 MSS here
  var MIN_SSTHRESH = 2;       // ssthresh never below 2 MSS (RFC 5681 §3.1, eq. 4)
  var BETA = 0.7;             // CUBIC multiplicative decrease factor (RFC 9438 §4.6)
  var C = 0.4;                // CUBIC scaling constant, MSS / s³ (RFC 9438 §5)
  var ALPHA = 3 * (1 - BETA) / (1 + BETA); // CUBIC's Reno-friendly additive increase, ≈ 0.53 MSS per RTT (§4.3)

  /** mulberry32, the same generator as Simdeck.rng (sim.test.js checks they agree). */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** CUBIC's window t seconds into an epoch: W(t) = C·(t − K)³ + Wmax (RFC 9438 §4.2, eq. 1). */
  function cubicW(t, wmax, K) { var d = t - K; return C * d * d * d + wmax; }

  /** Seconds the cubic takes from the epoch's start window back to Wmax: K = ∛((Wmax − cwnd_epoch) / C) (eq. 2). */
  function cubicK(wmax, cwndEpoch) { return Math.cbrt(Math.max(0, wmax - cwndEpoch) / C); }

  /** Chance that a round with w segments loses at least one, each lost with probability pct %. */
  function roundLoss(w, pct) { return 1 - Math.pow(1 - pct / 100, Math.max(1, Math.floor(w))); }

  /** Round a window for the record (CUBIC's is real-valued): 4 decimals keeps it JSON-stable. */
  function r4(x) { return Math.round(x * 1e4) / 1e4; }

  /** Fewest segments in flight that can bring three duplicate ACKs: the lost one plus three after it. */
  var DUP_MIN = 4;
  var EPS = 1e-9;   // CUBIC's W(0) = β·Wmax lands on ssthresh only up to rounding; count that as equal

  /** The Reno estimate k rounds into an epoch: α per RTT up to Wmax, then 1 per RTT (RFC 9438 §4.3). */
  function renoEstimate(ep, k) {
    var kStar = Math.max(0, (ep.wmax - ep.west) / ALPHA);
    return k <= kStar ? ep.west + ALPHA * k : Math.max(ep.west, ep.wmax) + (k - kStar);
  }

  /**
   * The series of one algorithm ('reno' | 'cubic') under the params: [{ r, t, cwnd, ssthresh, phase, event, cause }].
   * phase: 'ss' (cwnd < ssthresh) or 'ca' (cwnd ≥ ssthresh; the tie is congestion avoidance, RFC 5681 §3.1).
   * event: null, 'dup' (three duplicate ACKs) or 'timeout'; the round's window is the one that was hit.
   * cause: null, 'capacity' (the bottleneck overflowed), 'random' (a random loss) or 'timer' (the timeout param).
   */
  function run(algo, p) {
    var rtt = p.rtt / 1000;                    // seconds
    var draw = rng(p.seed);                    // one draw per round, the same for Reno and CUBIC (same "weather")
    var cwnd = p.iw, ssthresh = INIT_SSTHRESH;
    var ep = null;                             // CUBIC epoch: { r0, wmax, K, west }
    var out = [];
    for (var r = 0; r <= ROUNDS; r++) {
      var phase = cwnd < ssthresh - EPS ? 'ss' : 'ca';
      // CUBIC in congestion avoidance takes its window from the clock, not from the last round.
      if (algo === 'cubic' && phase === 'ca') {
        if (!ep) ep = { r0: r, wmax: cwnd, K: 0, west: cwnd };      // CA from slow start: K = 0, Wmax = cwnd
        var k = r - ep.r0;
        var w = k === 0 ? ep.west : cubicW(k * rtt, ep.wmax, ep.K);   // t = 0 is the epoch's window exactly
        if (p.friendly) w = Math.max(w, renoEstimate(ep, k));         // Reno-friendly region (§4.3)
        cwnd = r4(w);                     // W(t) only grows; kept to the precision the series records, which decides
      }
      var u = draw();
      var event = null, cause = null;
      if (p.timeoutAt && r === p.timeoutAt) { event = 'timeout'; cause = 'timer'; } // wins over a loss in the round
      else if (Math.floor(cwnd) > p.capacity) { event = 'dup'; cause = 'capacity'; } // ⌊cwnd⌋ segments overflow it
      else if (p.lossMode === 'random' && u < roundLoss(cwnd, p.p)) {
        cause = 'random';
        event = Math.floor(cwnd) < DUP_MIN ? 'timeout' : 'dup';     // too few segments for three duplicate ACKs
      }
      out.push({ r: r, t: r4(r * rtt), cwnd: r4(cwnd), ssthresh: r4(ssthresh), phase: phase, event: event, cause: cause });

      // The window for round r + 1.
      if (event === 'timeout') {
        ssthresh = algo === 'cubic' ? Math.max(cwnd * BETA, MIN_SSTHRESH)  // RFC 9438 §4.8: ssthresh by β
          : Math.max(Math.floor(cwnd / 2), MIN_SSTHRESH);                  // RFC 5681 §3.1, eq. 4
        cwnd = 1;                                                          // loss window (RFC 5681 §3.1)
        ep = null;                                                         // next CA stage starts a new epoch
      } else if (event === 'dup') {
        if (algo === 'cubic') {
          var wmax = Math.floor(cwnd);                                     // the window in whole segments
          ssthresh = afterDup('cubic', wmax);                               // §4.6: β·Wmax
          cwnd = ssthresh;
          ep = { r0: r + 1, wmax: wmax, K: cubicK(wmax, cwnd), west: cwnd }; // §4.2; t = 0 in round r + 1
        } else {
          ssthresh = afterDup('reno', cwnd);                                // RFC 5681 §3.2, step 2
          cwnd = ssthresh;                                                   // fast recovery in one round (step 6)
        }
      } else if (phase === 'ss') {
        cwnd = Math.min(cwnd * 2, ssthresh);                               // doubles per RTT, capped at ssthresh
      } else if (algo === 'reno') {
        cwnd = cwnd + 1;                                                   // +1 MSS per RTT
      }
      // CUBIC in CA: the next round computes its window from W(t).
      cwnd = r4(cwnd); ssthresh = r4(ssthresh);                            // both at the precision the series records
      if (ep) ep.west = r4(ep.west);
    }
    return out;
  }

  /**
   * The numbers the lecturer points at, for one series: { losses, dups, timeouts, random, avgCwnd, last, recover }.
   * random counts the losses the random draw caused. last: { r, kind, cause, from, to } | null, where from is the
   * window the loss counts (Reno's cwnd; CUBIC's Wmax, its whole segments) and to the window after it.
   * recover is for a last loss by duplicate ACKs: how long the window takes to climb back to from, if no further loss
   * came: { s, rounds, by }. by: 'reno' (from − to rounds), 'cubic' (K seconds) or 'friendly' (the Reno estimate gets
   * there before K). After a timeout there is no such climb (slow start again), so recover is null then.
   */
  function summarize(algo, series, p) {
    var rtt = p.rtt / 1000;
    var dups = 0, timeouts = 0, random = 0, sum = 0, last = null;
    series.forEach(function (pt) {
      sum += pt.cwnd;
      if (!pt.event) return;
      if (pt.event === 'dup') dups++; else timeouts++;
      if (pt.cause === 'random') random++;
      var from = pt.event === 'dup' && algo === 'cubic' ? Math.floor(pt.cwnd) : pt.cwnd;
      last = { r: pt.r, kind: pt.event, cause: pt.cause, from: from, to: pt.event === 'timeout' ? 1 : r4(afterDup(algo, from)) };
    });
    var recover = null;
    if (last && last.kind === 'dup') {
      var from = last.from, to = afterDup(algo, from);
      if (algo === 'cubic') {
        var s = cubicK(from, to), by = 'cubic';
        var sEst = (from - to) / ALPHA * rtt;
        if (p.friendly && sEst < s) { s = sEst; by = 'friendly'; }
        recover = { s: r4(s), rounds: r4(s / rtt), by: by };
      } else {
        recover = { s: r4((from - to) * rtt), rounds: from - to, by: 'reno' };
      }
    }
    return { losses: dups + timeouts, dups: dups, timeouts: timeouts, random: random, avgCwnd: r4(sum / series.length),
      last: last, recover: recover };
  }

  /** The window right after a loss by duplicate ACKs (rules 4 and 6), also when the series ends at the loss. */
  function afterDup(algo, cwnd) {
    return algo === 'cubic' ? Math.max(cwnd * BETA, MIN_SSTHRESH) : Math.max(Math.floor(cwnd / 2), MIN_SSTHRESH);
  }

  /** Which algorithms the params show. */
  function algosOf(p) { return p.algo === 'both' ? ['reno', 'cubic'] : [p.algo]; }

  var logic = {
    /** Parameter defaults. The page's controls describe how each one is shown. */
    defaults: { algo: 'reno', rtt: 100, capacity: 40, lossMode: 'capacity', p: 1, iw: 1, timeoutAt: 0, friendly: false, seed: 4 },

    /** The whole picture, recomputed from the params: { series: { reno?, cubic? }, summary: { reno?, cubic? } }. */
    initial: function (p) {
      var series = {}, summary = {};
      algosOf(p).forEach(function (a) {
        series[a] = run(a, p);
        summary[a] = summarize(a, series[a], p);
      });
      return { series: series, summary: summary };
    },

    /** Presets, keys 1–6; the page gives them their labels. */
    presets: [
      { id: 'slow-start', params: { algo: 'reno', capacity: 100 } },
      { id: 'sawtooth', params: { algo: 'reno', capacity: 40 } },
      { id: 'timeout', params: { algo: 'reno', capacity: 40, timeoutAt: 30 } },
      { id: 'reno-vs-cubic', params: { algo: 'both', capacity: 40, rtt: 100 } },
      { id: 'long-rtt', params: { algo: 'both', capacity: 40, rtt: 200 } },
      { id: 'random-loss', params: { algo: 'reno', capacity: 40, lossMode: 'random', p: 1, seed: 4 } }
    ],

    ROUNDS: ROUNDS, INIT_SSTHRESH: INIT_SSTHRESH, MIN_SSTHRESH: MIN_SSTHRESH, BETA: BETA, C: C, ALPHA: ALPHA,
    DUP_MIN: DUP_MIN, rng: rng, run: run, summarize: summarize, afterDup: afterDup, renoEstimate: renoEstimate, cubicW: cubicW, cubicK: cubicK, roundLoss: roundLoss, algosOf: algosOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
