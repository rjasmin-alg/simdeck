/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for layered-diagnosis: the three orders of checks through the seven OSI layers (URM book, ch. 15,
   "Metodika rješavanja problema po slojevima", Primjer 8), run side by side on the same fault.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.

   Rules (NOTES.md says where each comes from):
   - Layers are numbered 1 (physical) to 7 (application). One layer is faulty: the param `fault`.
   - Each step, every approach that has not finished makes one check. All three start at step 1.
   - A check of layer L examines that layer alone: it fails exactly when L is the faulty layer, and then the
     approach has found the fault and stops.
   - Bottom-up (bu) checks 1, 2, … 7. Top-down (td) checks 7, 6, … 1.
   - Divide-and-conquer (dc) first runs a reachability test at the network layer (3). It works only when layers
     1–3 all work, so it fails exactly when fault ≤ 3. If it works, layers 1–3 are excluded and dc goes on upward,
     4, 5, 6, 7, as bottom-up. If it fails, layers 4–7 are excluded and dc goes on downward, 2 then 1, as top-down;
     when both of those work, the fault is in the network layer itself (found by elimination, no extra check).
   - Tie-break: a failed reachability test is not yet a found fault; the fault is found only by a failing
     one-layer check or by elimination. A finished approach does nothing in later steps.
   - steps = 7, the longest any approach can take (bu with fault 7, td with fault 1). */
(function (root) {
  'use strict';

  var LAYERS = 7;
  var NET = 3;
  var APPROACHES = ['bu', 'td', 'dc'];

  /** The layer approach `a` checks next, given the checks it has made, or null when it has finished. */
  function next(a, run, ping) {
    if (run.found) return null;
    var k = run.checks.length;
    if (a === 'bu') return k + 1;
    if (a === 'td') return LAYERS - k;
    if (k === 0) return NET;
    if (ping) return NET + k;   // 4, 5, 6, 7
    return NET - k;             // 2, 1
  }

  /** Checks approach `a` makes before it has found the fault in layer `fault` (the reachability test counts). */
  function checksFor(a, fault) {
    if (a === 'bu') return fault;
    if (a === 'td') return LAYERS + 1 - fault;
    if (fault > NET) return 1 + fault - NET;  // the test, then NET + 1 … fault
    return fault === NET - 1 ? 2 : 3;          // the test, then NET - 1 (found there), or NET - 1 and 1
  }

  var logic = {
    layers: LAYERS,
    net: NET,
    approaches: APPROACHES,

    /** fault: the faulty layer, 1–7. The book's Primjer 8 (a web application that does not open) is 7. */
    defaults: { fault: 7 },

    steps: LAYERS,

    initial: function () {
      var runs = {};
      APPROACHES.forEach(function (a) { runs[a] = { checks: [], found: null }; });
      return { ping: null, runs: runs, events: [] };
    },

    step: function (s, n, p) {
      var f = p.fault;
      var ping = s.ping;
      var runs = {};
      var events = [];
      APPROACHES.forEach(function (a) {
        var old = s.runs[a];
        var run = { checks: old.checks.slice(), found: old.found };
        var L = next(a, run, ping);
        if (L !== null) {
          var test = a === 'dc' && run.checks.length === 0;
          var ok = test ? f > NET : L !== f;
          run.checks.push({ layer: L, ok: ok, test: test });
          events.push({ e: test ? 'test' : 'check', a: a, layer: L, ok: ok });
          if (test) ping = ok;
          if (!ok && !test) run.found = { layer: L, at: n, checks: run.checks.length, elim: false };
          else if (a === 'dc' && !test && ping === false && L === 1) {
            run.found = { layer: NET, at: n, checks: run.checks.length, elim: true };
          }
          if (run.found) events.push({ e: 'found', a: a, layer: run.found.layer, checks: run.found.checks, elim: run.found.elim });
        }
        runs[a] = run;
      });
      return { ping: ping, runs: runs, events: events };
    },

    /** Layers the reachability test has excluded for dc (none before it, 1–3 if it worked, 4–7 if not). */
    excluded: function (ping) {
      var out = [];
      for (var L = 1; L <= LAYERS; L++) if (ping === true ? L <= NET : ping === false ? L > NET : false) out.push(L);
      return out;
    },

    /** The order approach `a` would check in, given the reachability test's result (dc before it: just [3]). */
    plan: function (a, ping) {
      var out = [];
      for (var k = 0; k < LAYERS; k++) {
        var L = next(a, { checks: out.slice(), found: null }, ping);
        if (L === null || L < 1 || L > LAYERS) break;
        out.push(L);
        if (a === 'dc' && ping === null) break;
      }
      return out;
    },

    checksFor: checksFor,

    /** Average checks of approach `a` over the seven possible faulty layers. */
    average: function (a) {
      var sum = 0;
      for (var f = 1; f <= LAYERS; f++) sum += checksFor(a, f);
      return sum / LAYERS;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
