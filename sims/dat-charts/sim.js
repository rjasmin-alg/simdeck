/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for dat-charts: the same data as a tally, a table (rows, columns, cells), a pictogram (one picture can stand
   for 2, 5 or 10, and half a picture is half of that) and a bar chart with two axes; a change in the data changes
   every view; the chart answers which is the most and how many more. MAT OŠ E.3.1, E.4.1.
   Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. `charts` is the reusable part: pure functions over plain numbers, no
   strings. */
(function (root) {
  'use strict';

  var MAX = 30;              // the biggest count
  var CATS_MAX = 7;          // params c0 … c6
  var KEYS = [1, 2, 5, 10];  // what one picture can stand for
  var PIC_MAX = 12;          // the most pictures in one row (rule 5)
  var AXES = [[10, 1], [20, 2], [30, 5]];
  var QUESTIONS = ['most', 'least', 'more', 'total'];

  /** The data sets (SPEC, Data sets). cats are string-table ids; counts in table order. */
  var DATA = {
    fruit: { cats: ['apple', 'banana', 'strawberry', 'pear'], counts: [6, 4, 8, 2], pic: 'pupil', measured: false,
      ballots: [0, 1, 0, 2, 0, 3, 2, 1, 0, 2, 2, 1, 0, 2, 3, 2, 1, 0, 2, 2] },
    weather: { cats: ['sunny', 'cloudy', 'rainy', 'foggy'], counts: [8, 12, 7, 3], pic: 'day', measured: false },
    books: { cats: ['mon', 'tue', 'wed', 'thu', 'fri'], counts: [15, 25, 10, 30, 20], pic: 'book', measured: false },
    snow: { cats: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'], counts: [2, 5, 8, 12, 10, 6, 4], pic: 'flake', measured: true }
  };
  var DS_IDS = ['fruit', 'weather', 'books', 'snow'];

  function int(v, lo, hi, dflt) {
    var n = v === '' || v == null || typeof v === 'boolean' ? NaN : Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return Math.min(hi, Math.max(lo, n));
  }
  function pick(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }

  var charts = {
    /** Rule 3: groups of five and single strokes. */
    tally: function (v) { return { fives: Math.floor(v / 5), ones: v % 5 }; },

    /** Rule 4: whole pictures and what is left of one. */
    pictures: function (v, k) {
      var whole = Math.floor(v / k), r = v % k;
      return { whole: whole, rest: r, part: r === 0 ? 'none' : 2 * r === k ? 'half' : 'part' };
    },
    /** Rule 4: every count reads back exactly (no cut picture). */
    exact: function (counts, k) {
      return counts.every(function (v) { return charts.pictures(v, k).part !== 'part'; });
    },
    /** Rule 5: the biggest count needs at most PIC_MAX pictures. */
    fits: function (counts, k) { return Math.ceil(Math.max.apply(null, counts.concat(0)) / k) <= PIC_MAX; },
    /** Rule 5 (tie-break): the asked key if it fits, else the smallest bigger key that fits, else the biggest that fits. */
    keyFor: function (counts, k) {
      if (charts.fits(counts, k)) return k;
      var ok = KEYS.filter(function (x) { return charts.fits(counts, x); });
      var bigger = ok.filter(function (x) { return x > k; });
      return bigger.length ? bigger[0] : ok[ok.length - 1];
    },
    /** Rule 6: the number axis. */
    axis: function (counts) {
      var m = Math.max.apply(null, counts.concat(0));
      for (var i = 0; i < AXES.length; i++) if (m <= AXES[i][0]) return { top: AXES[i][0], step: AXES[i][1] };
      return { top: AXES[AXES.length - 1][0], step: AXES[AXES.length - 1][1] };
    },

    /** Rule 8: the answer to a question about the counts. */
    answer: function (counts, q) {
      var sum = counts.reduce(function (a, b) { return a + b; }, 0);
      if (q === 'none' || !QUESTIONS.includes(q)) return null;
      if (sum === 0) return { q: q, kind: 'empty' };
      var max = Math.max.apply(null, counts), min = Math.min.apply(null, counts);
      var at = function (x) { return counts.reduce(function (a, v, i) { if (v === x) a.push(i); return a; }, []); };
      if (q === 'total') return { q: q, kind: 'value', value: sum };
      if (q === 'more') {
        var a = counts.indexOf(max), b = counts.indexOf(min);
        return { q: q, kind: max === min ? 'equal' : 'diff', a: a, b: b, big: max, small: min, value: max - min };
      }
      if (max === min) return { q: q, kind: 'all', idx: at(max), value: max };
      var x = q === 'most' ? max : min;
      var idx = at(x);
      return { q: q, kind: idx.length > 1 ? 'tie' : 'one', idx: idx, value: x };
    }
  };

  function countsOf(p, d) {
    var out = [];
    for (var i = 0; i < d.cats.length; i++) {
      var v = p['c' + i];
      out.push(v === undefined ? d.counts[i] : int(v, 0, MAX, 0));
    }
    return out;
  }

  var logic = {
    MAX: MAX, CATS_MAX: CATS_MAX, KEYS: KEYS, PIC_MAX: PIC_MAX, QUESTIONS: QUESTIONS, DATA: DATA, DS_IDS: DS_IDS,
    charts: charts,

    defaults: {
      ds: 'fruit', c0: 6, c1: 4, c2: 8, c3: 2, c4: 0, c5: 0, c6: 0, n: 20, k: 1, q: 'none', sel: -1, hide: false
    },

    /** The presets (SPEC, Presets). Keys 1–6. */
    PRESETS: [
      { id: 'vote', params: { ds: 'fruit', c0: 0, c1: 0, c2: 0, c3: 0, n: 0, k: 1 } },
      { id: 'most', params: { ds: 'fruit', q: 'most', hide: true } },
      { id: 'key2', params: { ds: 'weather', c0: 8, c1: 12, c2: 7, c3: 3, k: 2 } },
      { id: 'key5', params: { ds: 'books', c0: 15, c1: 25, c2: 10, c3: 30, c4: 20, k: 5, q: 'more', hide: true } },
      { id: 'snow', params: { ds: 'snow', c0: 2, c1: 5, c2: 8, c3: 12, c4: 10, c5: 6, c6: 4, k: 1, q: 'more' } },
      { id: 'misfit', params: { ds: 'weather', c0: 8, c1: 12, c2: 7, c3: 3, k: 5 } }
    ],

    /** The params a data set starts with (the page sets them when the data set is changed by hand). */
    startParams: function (ds) {
      var d = DATA[pick(ds, DS_IDS, 'fruit')], out = {};
      for (var i = 0; i < CATS_MAX; i++) out['c' + i] = i < d.counts.length ? d.counts[i] : 0;
      out.n = d.ballots ? d.ballots.length : 0;
      out.sel = -1;
      return out;
    },

    /** Everything the page shows (an explorer: one state, no steps). */
    initial: function (p) {
      var ds = pick(p.ds, DS_IDS, 'fruit'), d = DATA[ds];
      var counts = countsOf(p, d);
      var asked = KEYS.indexOf(Number(p.k)) >= 0 ? Number(p.k) : 1;
      var k = charts.keyFor(counts, asked);
      var qs = d.measured ? QUESTIONS.filter(function (x) { return x !== 'total'; }) : QUESTIONS.slice();
      var q = qs.indexOf(p.q) >= 0 ? p.q : 'none';
      var nb = d.ballots ? d.ballots.length : 0;
      var n = d.ballots ? int(p.n, 0, nb, nb) : 0;
      var sel = int(p.sel, -1, d.cats.length - 1, -1);
      var pics = counts.map(function (v) { return charts.pictures(v, k); });
      return {
        ds: ds, cats: d.cats.slice(), pic: d.pic, measured: d.measured, counts: counts,
        total: counts.reduce(function (a, b) { return a + b; }, 0),
        tally: d.measured ? null : counts.map(charts.tally),
        k: k, askedK: asked, keyMoved: k !== asked, pictures: pics, exact: charts.exact(counts, k),
        hasHalf: pics.some(function (x) { return x.part === 'half'; }),
        keys: KEYS.map(function (x) { return { k: x, fits: charts.fits(counts, x), exact: charts.exact(counts, x) }; }),
        exactKeys: KEYS.filter(function (x) { return charts.fits(counts, x) && charts.exact(counts, x); }),
        axis: charts.axis(counts),
        questions: qs, q: q, answer: charts.answer(counts, q),
        ballots: d.ballots ? d.ballots.slice() : null, n: n,
        next: d.ballots && n < nb ? d.ballots[n] : -1,
        sel: sel, hide: p.hide === true
      };
    },

    // ── actions: each returns a params patch and what happened ──

    /** Rule 10: + or − on row i. */
    change: function (p, i, d) {
      var s = logic.initial(p);
      if (i < 0 || i >= s.counts.length) return { patch: {}, refused: 'row' };
      var v = s.counts[i] + d;
      if (v < 0 || v > MAX) return { patch: {}, refused: 'limit', i: i };
      var patch = {}; patch['c' + i] = v;
      return { patch: patch, refused: null, i: i, from: s.counts[i], to: v };
    },

    /** Rule 11: count the next ballot. */
    countBallot: function (p) {
      var s = logic.initial(p);
      if (!s.ballots) return { patch: {}, refused: 'none' };
      if (s.n >= s.ballots.length) return { patch: {}, refused: 'done' };
      var i = s.ballots[s.n];
      if (s.counts[i] >= MAX) return { patch: {}, refused: 'limit', i: i };
      var patch = { n: s.n + 1 }; patch['c' + i] = s.counts[i] + 1;
      return { patch: patch, refused: null, i: i, from: s.counts[i], to: s.counts[i] + 1 };
    },
    /** Rule 11: count every ballot left. */
    countAll: function (p) {
      var s = logic.initial(p);
      if (!s.ballots) return { patch: {}, refused: 'none' };
      if (s.n >= s.ballots.length) return { patch: {}, refused: 'done' };
      // stops before a ballot that would take its category past 30, like one ballot at a time (refused 'limit')
      var c = s.counts.slice(), j = s.n;
      while (j < s.ballots.length && c[s.ballots[j]] < MAX) { c[s.ballots[j]]++; j++; }
      if (j === s.n) return { patch: {}, refused: 'limit', i: s.ballots[j] };
      var patch = { n: j };
      c.forEach(function (v, i) { patch['c' + i] = v; });
      return { patch: patch, refused: j < s.ballots.length ? 'limit' : null, i: j < s.ballots.length ? s.ballots[j] : -1 };
    },
    /** Rule 11: start the count again. */
    restart: function (p) {
      var s = logic.initial(p), patch = { n: 0 };
      s.counts.forEach(function (v, i) { patch['c' + i] = 0; });
      return patch;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
