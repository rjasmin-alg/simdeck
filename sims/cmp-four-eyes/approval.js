/* SPDX-License-Identifier: AGPL-3.0-or-later
   An approval queue under the four-eyes principle (catalogue §5.24: it sits beside cmp-jml-drift's people × roles ×
   rights model and adds a second signature on each request, but reads nothing from it, only its generator). A month
   of one team's requests (a few of them bad) goes to an approver who has a fixed hour a day for approvals; the
   approver's queue sets the minutes per request, review in depth goes to the riskiest share, and a bad request is
   caught only if the approver looks long enough and is independent. Every request carries two signatures whatever
   happened. SPEC.md rules 1-6.
   Pure functions over plain data, no words and no dependencies, ready to be promoted to models/ unchanged
   (models/README.md). In a page it registers on globalThis.SimdeckModels['approval-queue']; under node it is
   module.exports. */
(function (root) {
  'use strict';

  /** Rule 1: the stream. A month of one team's requests: 300, of which 30 are high-risk (privileged access, a change
      to production, a payment over the limit) with 9 bad ones among them, and 270 routine with 3 bad ones. */
  var N = 300;
  var HIGH = 30;
  var HIGH_BAD = 9;
  var LOW_BAD = 3;
  var BAD = HIGH_BAD + LOW_BAD;
  var STREAM_SALT = 7919;         // the order is rng(seed + 7919), the look draws rng(seed)
  /** Rule 2: the approver's day. */
  var BUDGET = 60;                // minutes a day for approvals
  var LOADS = [10, 20, 40, 80, 160];   // requests a day in the approver's queue
  var DEEPS = [0.1, 0.2, 0.3, 0.5];    // share reviewed in depth (by risk)
  var DEEP_T = 15;                // minutes an in-depth review takes
  /** Rule 5: the look. */
  var GLANCE = 1;                 // under a minute nobody opens the request: the signature is a click
  var TAU = 4;                    // minutes: p(t) = q · (1 − e^(−t / TAU))
  var Q_DEPENDENT = 0.25;         // an approver who is not independent challenges a quarter as often

  /** mulberry32, the same generator as Simdeck.rng in kit/kit.js.
      // from sims/cmp-jml-drift/access.js @ 59b7f46 */
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

  /** Rule 1: the stream in arrival order. The kinds [9 high bad, 21 high, 3 routine bad, 267 routine] are shuffled by
      Fisher-Yates from rng(seed + 7919), i from N − 1 down to 1, j = ⌊r · (i + 1)⌋. Each request then takes one draw u
      from rng(seed), in arrival order: the same draw decides whether it is caught under every setting (rule 5). */
  function stream(seed) {
    var kinds = [], i;
    for (i = 0; i < N; i++) {
      kinds.push(i < HIGH_BAD ? 'hb' : i < HIGH ? 'h' : i < HIGH + LOW_BAD ? 'lb' : 'l');
    }
    var r = rng(seed + STREAM_SALT);
    for (i = N - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var x = kinds[i]; kinds[i] = kinds[j]; kinds[j] = x;
    }
    var u = rng(seed);
    return kinds.map(function (k, n) {
      return { n: n, high: k.charAt(0) === 'h', bad: k.length === 2, u: u() };
    });
  }

  /** Rule 3: minutes per request. Evenly: budget / load. By risk: d · load requests a day in depth, each
      min(15, budget / (d · load)) minutes; the rest share what is left, at least 0. */
  function times(policy, load, deep) {
    if (policy !== 'risk') return { deep: null, thin: BUDGET / load, perDay: 0 };
    var d = deep * load;
    var td = Math.min(DEEP_T, BUDGET / d);
    return { deep: td, thin: Math.max(0, (BUDGET - d * td) / (load - d)), perDay: d };
  }

  /** Rule 4: which requests of the stream get depth: the first round(d · N) in risk order, high-risk first in arrival
      order, then routine in arrival order. Evenly: none. Returns a list of booleans by arrival. */
  function depth(list, policy, deep) {
    var out = list.map(function () { return false; });
    if (policy !== 'risk') return out;
    var order = list.filter(function (x) { return x.high; }).concat(list.filter(function (x) { return !x.high; }));
    var k = Math.round(deep * list.length);
    for (var i = 0; i < k && i < order.length; i++) out[order[i].n] = true;
    return out;
  }

  /** Rule 5: the chance a bad request is caught when the approver spends t minutes on it. Under a minute (GLANCE) the
      request is not opened: 0. From a minute on (exactly a minute looks): q · (1 − e^(−t / 4)), q = 1 for an
      independent approver, 0.25 otherwise. */
  function catchP(t, independent) {
    if (t < GLANCE) return 0;
    return (independent ? 1 : Q_DEPENDENT) * (1 - Math.exp(-t / TAU));
  }

  /** Rules 3-6: every request of the stream reviewed under one setting. A bad request is caught (rejected) when its
      draw u < p; good requests are approved (wrongly rejected good ones are out of scope). Every request carries the
      second signature, approved or rejected (rule 6). */
  function review(list, policy, load, deep, independent) {
    var tm = times(policy, load, deep), dp = depth(list, policy, deep);
    var caught = 0, expected = 0, stamped = 0;
    var items = list.map(function (x) {
      var t = dp[x.n] ? tm.deep : tm.thin;
      var p = catchP(t, independent);
      var c = x.bad && x.u < p;
      if (x.bad) expected += p;
      if (c) caught++;
      if (t < GLANCE) stamped++;
      return { n: x.n, high: x.high, bad: x.bad, deep: dp[x.n], minutes: t, looked: t >= GLANCE, caught: c };
    });
    var bad = list.filter(function (x) { return x.bad; }).length;
    return {
      items: items,
      times: tm,
      bad: bad,
      caught: caught,
      passed: bad - caught,              // bad requests approved with two signatures
      expected: bad ? expected / bad : 0,   // the expected catch rate
      stamped: stamped,                  // signed without opening
      record: { signed: list.length, of: list.length, rejected: caught, approved: list.length - caught }
    };
  }

  var api = {
    N: N, HIGH: HIGH, HIGH_BAD: HIGH_BAD, LOW_BAD: LOW_BAD, BAD: BAD, STREAM_SALT: STREAM_SALT,
    BUDGET: BUDGET, LOADS: LOADS, DEEPS: DEEPS, DEEP_T: DEEP_T, GLANCE: GLANCE, TAU: TAU, Q_DEPENDENT: Q_DEPENDENT,
    rng: rng, stream: stream, times: times, depth: depth, catchP: catchP, review: review
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.SimdeckModels = root.SimdeckModels || {})['approval-queue'] = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
