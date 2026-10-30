/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-deploy-strategies: one bad (or good) v2 deployed three ways at once, one step per minute.
   Three lanes in lockstep: a rolling update (surge 1, unavailable 0), blue-green and a canary. Each step, per lane:
   (1) the strategy's next move or its rollback move, (2) route 2,000 requests by the split to ready instances only,
   (3) failed = requests to v2 × v2's error rate, (4) the lane's check on the exact rate (the counts are rounded to
   whole requests, the check is not); a trip sets phase rollingBack, and the rollback move happens in the next step. Rules, tie-breaks and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. Shares are whole percentages; rates are compared in integers. */
(function (root) {
  'use strict';

  var REQUESTS = 2000;               // per lane per minute (task: fixed)
  var DEADLINE_MIN = 10;             // the rolling update's progress deadline, 600 s (rule 2)
  var CANARY_STAGES = [10, 10, 25, 50, 100]; // rule 4: 10 % for two steps, then 25, 50, 100
  var MAX_STEPS = 20;
  var MIN_STEPS = 3;
  var LANES = ['rolling', 'blueGreen', 'canary'];
  var FINISHED = { done: true, rolledBack: true, stalled: true };

  function inst(id, ver, ready) { return { id: id, ver: ver, ready: ready }; }
  function copy(lane) { return JSON.parse(JSON.stringify(lane)); }

  /** Failed requests out of `req` sent to v2 (rounded to a whole request, half up). */
  function failures(req, p) { return Math.round(req * p.v2Error / 100); }

  /** The check: true when the exact error rate of `req` requests, `v2Req` of them to v2, is over threshold %.
      Strict, and on the unrounded rate (v2Req × v2Error and threshold × req are exact on the 0.5 % grid),
      so 40 of 2,000 at 2 % does not trip, nor a canary at 1.5 % against 1.5 % whose 7.5 failures round to 8. */
  function trips(v2Req, req, p) { return req > 0 && v2Req * p.v2Error > p.threshold * req; }

  /** Requests per instance this minute: the split goes to ready instances only, evenly inside each version. */
  function traffic(lane) {
    var out = {};
    var share = { 1: 100 - lane.v2Share, 2: lane.v2Share };
    var live = lane.live || null;
    [1, 2].forEach(function (ver) {
      var ready = lane.instances.filter(function (x) {
        return x.ver === ver && x.ready && (!live || x.set === live);
      });
      ready.forEach(function (x) { out[x.id] = REQUESTS * share[ver] / 100 / ready.length; });
    });
    lane.instances.forEach(function (x) { if (!(x.id in out)) out[x.id] = 0; });
    return out;
  }

  /** Steps 2 and 3 of a minute: route by the split, count failures, add to the running total. `rate` is what
      the lane's check reads, exact: the canary its own rate, the others the service-wide one. */
  function route(lane, p, own) {
    lane.v2Req = REQUESTS * lane.v2Share / 100;
    lane.failed = failures(lane.v2Req, p);
    lane.total += lane.failed;
    lane.rate = own ? (lane.v2Req ? p.v2Error : 0) : lane.v2Req * p.v2Error / REQUESTS;
    return lane;
  }

  /** A finished lane keeps its last state; done keeps serving at 100 % (and keeps failing), the others serve v1. */
  function idle(lane, p, own) {
    lane.changed = [];
    lane.event = lane.phase === 'done' ? 'serving' : lane.phase === 'stalled' ? 'waiting' : 'idle';
    return route(lane, p, own);
  }

  /** Rule 1, 2, 5: one instance replaced per step; rollback is rolling too, newest v2 first. */
  function stepRolling(prev, n, p) {
    var lane = copy(prev);
    if (FINISHED[lane.phase]) return idle(lane, p);
    lane.changed = [];
    if (lane.phase === 'rollingBack') {
      var v2 = lane.instances.filter(function (x) { return x.ver === 2; });
      var last = v2[v2.length - 1];
      last.ver = 1;
      lane.changed.push(last.id);
      lane.v2Share -= 25;
      route(lane, p);
      if (lane.v2Share === 0) { lane.phase = 'rolledBack'; lane.event = 'rolledBack'; lane.finishedAt = n; }
      else lane.event = 'back';
      return lane;
    }
    // surge 1: start one v2 beside the four; unavailable 0: a v1 goes only once that v2 is ready
    if (!p.v2Ready) {
      lane.instances.push(inst('r5', 2, false));
      lane.changed.push('r5');
      lane.phase = 'stalled';
      lane.event = 'stalled';
      lane.finishedAt = n;
      lane.deadlineAt = n + DEADLINE_MIN;
      return route(lane, p);
    }
    var next = lane.instances.filter(function (x) { return x.ver === 1; })[0];
    next.ver = 2;
    lane.changed.push(next.id);
    lane.v2Share += 25;
    route(lane, p);
    // rule 5: the service-wide alert; rule 6: a trip at 100 % still rolls back
    if (trips(lane.v2Req, REQUESTS, p)) { lane.phase = 'rollingBack'; lane.event = 'trip'; lane.trippedAt = n; }
    else if (lane.v2Share === 100) { lane.phase = 'done'; lane.event = 'done'; lane.finishedAt = n; }
    else { lane.phase = 'deploying'; lane.event = 'advance'; }
    return lane;
  }

  /** Rule 3: deploy green beside blue and health-check it, then switch 100 % at once; back in one step. */
  function stepBlueGreen(prev, n, p) {
    var lane = copy(prev);
    if (FINISHED[lane.phase]) return idle(lane, p);
    lane.changed = [];
    if (lane.phase === 'rollingBack') {
      lane.live = 'blue';
      lane.v2Share = 0;
      lane.phase = 'rolledBack';
      lane.event = 'rolledBack';
      lane.finishedAt = n;
      return route(lane, p);
    }
    if (!lane.instances.some(function (x) { return x.set === 'green'; })) {
      for (var i = 1; i <= 4; i++) {
        var g = inst('g' + i, 2, p.v2Ready);
        g.set = 'green';
        lane.instances.push(g);
        lane.changed.push(g.id);
      }
      lane.phase = 'deploying';
      lane.event = 'deploy';
      return route(lane, p);
    }
    if (!p.v2Ready) {
      lane.phase = 'stalled';
      lane.event = 'refused';
      lane.finishedAt = n;
      return route(lane, p);
    }
    lane.live = 'green';
    lane.v2Share = 100;
    route(lane, p);
    if (trips(lane.v2Req, REQUESTS, p)) { lane.phase = 'rollingBack'; lane.event = 'trip'; lane.trippedAt = n; }
    else { lane.phase = 'done'; lane.event = 'done'; lane.finishedAt = n; }
    return lane;
  }

  /** Rule 4: 10, 10, 25, 50, 100 %; the check compares the canary's own error rate; abort sets 0 % next step. */
  function stepCanary(prev, n, p) {
    var lane = copy(prev);
    if (FINISHED[lane.phase]) return idle(lane, p, true);
    lane.changed = [];
    if (lane.phase === 'rollingBack') {
      lane.v2Share = 0;
      lane.phase = 'rolledBack';
      lane.event = 'rolledBack';
      lane.finishedAt = n;
      return route(lane, p, true);
    }
    lane.stage += 1;
    var share = CANARY_STAGES[lane.stage - 1];
    var want = Math.ceil(share / 25); // instances for v2 at this share: 1, 1, 1, 2, 4
    for (var k = lane.instances.filter(function (x) { return x.ver === 2; }).length + 1; k <= want; k++) {
      lane.instances.push(inst('k' + k, 2, p.v2Ready));
      lane.changed.push('k' + k);
    }
    if (!p.v2Ready) {
      lane.phase = 'stalled';
      lane.event = 'stalled';
      lane.finishedAt = n;
      return route(lane, p, true);
    }
    lane.v2Share = share;
    route(lane, p, true);
    if (trips(lane.v2Req, lane.v2Req, p)) { lane.phase = 'rollingBack'; lane.event = 'trip'; lane.trippedAt = n; }
    else if (share === 100) { lane.phase = 'done'; lane.event = 'done'; lane.finishedAt = n; }
    else { lane.phase = 'deploying'; lane.event = 'advance'; }
    return lane;
  }

  function lane0(extra, instances) {
    return Object.assign({
      phase: 'idle', event: 'start', v2Share: 0, v2Req: 0, instances: instances, changed: [],
      failed: 0, total: 0, rate: 0, trippedAt: null, finishedAt: null
    }, extra);
  }
  function four(prefix, set) {
    return [1, 2, 3, 4].map(function (i) { var x = inst(prefix + i, 1, true); if (set) x.set = set; return x; });
  }

  var logic = {
    REQUESTS: REQUESTS,
    DEADLINE_MIN: DEADLINE_MIN,
    CANARY_STAGES: CANARY_STAGES,
    LANES: LANES,

    /** v2Error in %, v2Ready = v2 passes its health check, threshold in % (task: Params). */
    defaults: { v2Error: 100, v2Ready: true, threshold: 2 },

    /** State at step 0: v1 everywhere, 100 % of traffic on v1. */
    initial: function () {
      return {
        t: 0,
        lanes: {
          rolling: lane0({ deadlineAt: null }, four('r')),
          blueGreen: lane0({ live: 'blue' }, four('b', 'blue')),
          canary: lane0({ stage: 0 }, four('c'))
        }
      };
    },

    /** State after minute n, from the state after minute n - 1. */
    step: function (s, n, p) {
      return {
        t: n,
        lanes: {
          rolling: stepRolling(s.lanes.rolling, n, p),
          blueGreen: stepBlueGreen(s.lanes.blueGreen, n, p),
          canary: stepCanary(s.lanes.canary, n, p)
        }
      };
    },

    /** Steps: the minute the last lane finishes (done, rolled back or stalled), at least 3 (task: 3–6 per preset). */
    steps: function (p) {
      var s = logic.initial(p);
      for (var n = 1; n <= MAX_STEPS; n++) {
        s = logic.step(s, n, p);
        if (LANES.every(function (k) { return s.lanes[k].finishedAt !== null; })) {
          return Math.max(MIN_STEPS, Math.max.apply(null, LANES.map(function (k) { return s.lanes[k].finishedAt; })));
        }
      }
      return MAX_STEPS;
    },

    traffic: traffic,
    failures: failures,
    trips: trips
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
