/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ari-parts-of-number: a whole (a row of n objects, or an hour of 60 minutes) split into d equal parts; k
   parts coloured are "k d-ths" of the whole: N : d = q, k · q. The parts must be equal; the typical mistake splits
   into unequal parts; a whole that does not divide leaves a remainder. Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var N_MAX = 100;
  var D_MIN = 2;
  var D_MAX = 12;
  var HOUR = 60;
  var PICS = ['row', 'clock'];

  function int(v, lo, hi, dflt) {
    var n = Math.round(Number(v));
    if (v === null || v === undefined || v === '' || typeof v === 'boolean' || !isFinite(n)) n = dflt;
    return Math.min(hi, Math.max(lo, n));
  }

  var logic = {
    N_MAX: N_MAX, D_MIN: D_MIN, D_MAX: D_MAX, HOUR: HOUR, PICS: PICS,

    defaults: { pic: 'row', n: 12, d: 3, k: 1, unequal: false, hide: false },

    /** The presets (SPEC.md, Presets). */
    PRESETS: [
      { id: 'third', params: { pic: 'row', n: 12, d: 3, k: 1 } },
      { id: 'twoThirds', params: { pic: 'row', n: 12, d: 3, k: 2 } },
      { id: 'fourFifths', params: { pic: 'row', n: 20, d: 5, k: 4 } },
      { id: 'hour', params: { pic: 'clock', d: 4, k: 3 } },
      { id: 'unequal', params: { pic: 'row', n: 12, d: 3, k: 1, unequal: true, hide: true } },
      { id: 'leftover', params: { pic: 'row', n: 10, d: 3, k: 1 } }
    ],

    /** The task from the params, made valid (rule 1): { pic, N, n, d, k, way, hide }; way is 'unequal' only for unequal === true. */
    taskOf: function (prm) {
      var pic = PICS.indexOf(prm.pic) >= 0 ? prm.pic : 'row';
      var n = int(prm.n, 1, N_MAX, logic.defaults.n);
      var d = int(prm.d, D_MIN, D_MAX, logic.defaults.d);
      var k = int(prm.k, 1, d, 1);
      var way = prm.unequal === true ? 'unequal' : 'equal';
      return { pic: pic, n: n, N: pic === 'clock' ? HOUR : n, d: d, k: k, way: way, hide: prm.hide === true };
    },

    /** The part sizes (rules 2, 4, 5): { q, r, s, sizes }. r > 0: d parts of q and r left over; s > 0: unequal. */
    partsOf: function (N, d, way) {
      var q = Math.floor(N / d), r = N - q * d;
      var sizes = [];
      for (var i = 0; i < d; i++) sizes.push(q);
      var s = 0;
      if (r === 0 && way === 'unequal') {
        s = Math.floor(q / 2);
        if (s > 0) { sizes[0] += s; sizes[d - 1] -= s; }
      }
      return { q: q, r: r, s: s, sizes: sizes };
    },

    /** The state (explorer: no steps). */
    initial: function (prm) {
      var t = logic.taskOf(prm);
      var P = logic.partsOf(t.N, t.d, t.way);
      var divides = P.r === 0;
      var starts = [], at = 0;
      for (var i = 0; i < t.d; i++) { starts.push(at); at += P.sizes[i]; }
      var taken = 0;
      for (var j = 0; j < t.k; j++) taken += P.sizes[j];
      var unequal = P.s > 0;
      var right = divides ? t.k * P.q : null;
      return {
        pic: t.pic, N: t.N, n: t.n, d: t.d, k: t.k, way: t.way, hide: t.hide,
        q: P.q, r: P.r, sizes: P.sizes, starts: starts,
        divides: divides,
        whole: t.k === t.d,
        unequal: unequal,
        // rule 4 first: a whole that does not divide ignores the mistake; rule 6b: no unequal parts of 1
        wayIgnored: t.way === 'unequal' && !divides,
        noUnequal: t.way === 'unequal' && divides && !unequal,
        taken: taken,                              // the coloured amount (objects or minutes)
        right: right,                              // k · q, the value of "k d-ths" (null when it does not divide)
        value: divides && !unequal ? right : null, // shown as the answer only when the parts are equal
        wrong: divides && unequal && taken !== right,
        check: divides ? t.d * P.sizes[0] : null   // what d parts like the first one would make (d · q = N when equal)
      };
    },

    /** The part a click on the picture hits, as the new k (rule: clicking part i colours parts 1…i). */
    kFor: function (s, i) { return Math.min(s.d, Math.max(1, Math.floor(i) + 1)); },

    /** The numeral on the clock face the minute hand points at, or null (not a multiple of 5, or the full hour). */
    numeralAt: function (minutes) {
      if (minutes % 5 !== 0 || minutes <= 0 || minutes >= HOUR) return null;
      return minutes / 5;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
