/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-jml-drift: two years of a department (four teams of twelve) with joiners, movers, leavers and one-off
   requests, replayed twice on the same events: once with no controls and once with the controls the student switched
   on (HR-driven leavers, roles, removal on move, a quarterly access review of a chosen scope and care). Read: rights
   per person the job does not need, leavers' accounts still open, the lines a review lists and what the reviews
   removed. Explorer: the state is a pure function of the params (compute). Rules: SPEC.md. People × roles × rights
   live in access.js (promotable to models/); this file adds the params, presets, the page's numbers and the caption.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var A = typeof module === 'object' && module.exports
    ? require('./access.js')
    : root.SimdeckModels['access-rights'];

  var REVIEWS = ['off', 'one', 'teams'];
  var RANGES = { care: [10, 500], month: [0, A.MONTHS], seed: [1, 999999] };
  var CARE_STEP = 10;
  var NONE = { hr: false, roles: false, move: false, review: 'off', care: 50 };

  /** Presets, SPEC.md table; expected numbers there. Each carries every param. */
  function P(over) {
    return Object.assign({ hr: false, roles: false, move: false, review: 'off', care: 50, month: 24, seed: 949 }, over);
  }
  var presets = [
    { id: 'drift', params: P({}) },
    { id: 'hr', params: P({ hr: true }) },
    { id: 'big-review', params: P({ review: 'one' }) },
    { id: 'team-review', params: P({ review: 'teams' }) },
    { id: 'roles', params: P({ hr: true, roles: true, move: true }) },
    { id: 'all', params: P({ hr: true, roles: true, move: true, review: 'teams' }) }
  ];
  var defaults = Object.assign({}, presets[0].params);

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function num(v, dflt) {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return dflt;
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }
  function bool(v, dflt) {
    if (v === true || v === 'true' || v === 1 || v === '1') return true;
    if (v === false || v === 'false' || v === 0 || v === '0') return false;
    return dflt;
  }

  /** Rule 9: params made safe (a URL may carry anything). */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var out = {};
    ['hr', 'roles', 'move'].forEach(function (k) { out[k] = bool(q[k], defaults[k]); });
    out.review = REVIEWS.indexOf(q.review) >= 0 ? q.review : defaults.review;
    out.care = clamp(Math.round(num(q.care, defaults.care) / CARE_STEP) * CARE_STEP, RANGES.care[0], RANGES.care[1]);
    out.month = clamp(Math.round(num(q.month, defaults.month)), RANGES.month[0], RANGES.month[1]);
    out.seed = clamp(Math.round(num(q.seed, defaults.seed)), RANGES.seed[0], RANGES.seed[1]);
    return out;
  }

  /** The controls of a params object. */
  function controlsOf(p) { return { hr: p.hr, roles: p.roles, move: p.move, review: p.review, care: p.care }; }
  /** True when the student's controls do nothing the baseline does not (every switch off, no review). */
  function isNone(c) { return !c.hr && !c.roles && !c.move && c.review === 'off'; }

  /** Rule 8: the reviews up to month m, summed: lines read, unneeded rights found and removed, leavers' accounts
      found and closed; and the last one. */
  function reviewsUpTo(reviews, m) {
    var done = reviews.filter(function (r) { return r.month <= m; });
    var sum = { count: done.length, excess: 0, removed: 0, orphans: 0, closed: 0, checked: 0, lines: 0 };
    done.forEach(function (r) {
      sum.excess += r.excess; sum.removed += r.removed; sum.orphans += r.orphans; sum.closed += r.closed;
      sum.checked += r.checked; sum.lines += r.lines;
    });
    sum.last = done.length ? done[done.length - 1] : null;
    return sum;
  }

  /** Rule 7: the matrix at month m: the open accounts, active people by team then id, then the leavers' accounts by
      id; for each its held rights, and which of them the job needs. */
  function matrix(accts) {
    var open = accts.filter(function (a) { return a.on; });
    var active = open.filter(function (a) { return a.left === null; })
      .sort(function (x, y) { return x.team - y.team || x.id - y.id; });
    var gone = open.filter(function (a) { return a.left !== null; }).sort(function (x, y) { return x.id - y.id; });
    return active.concat(gone).map(function (a) {
      return { id: a.id, team: a.team, left: a.left, held: A.rightsOf(a), extra: A.excessOf(a), lines: A.linesOf(a) };
    });
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var ev = A.events(p.seed);
    var ctl = controlsOf(p);
    var base = A.replay(ev, NONE, p.seed, p.month);
    var mine = A.replay(ev, ctl, p.seed, p.month);
    var counts = { leaves: 0, moves: 0, requests: 0, joins: 0, untold: 0 };
    for (var m = 1; m <= p.month; m++) {
      var e = ev.months[m];
      counts.leaves += e.leaves.length; counts.moves += e.moves.length;
      counts.requests += e.requests.length; counts.joins += e.joins.length;
      e.leaves.forEach(function (x) { if (!x.told) counts.untold++; });
    }
    return {
      p: p,
      none: isNone(ctl),
      counts: counts,
      base: { series: base.series, copied: copiedUpTo(base, p.month) },
      mine: {
        series: mine.series,
        reviews: mine.reviews.map(function (r) { return r.month; }),
        sum: reviewsUpTo(mine.reviews, p.month),
        copied: copiedUpTo(mine, p.month),
        cols: matrix(mine.accounts)
      }
    };
  }
  function copiedUpTo(run, m) {
    var n = 0;
    for (var i = 1; i <= m; i++) n += run.copied[i];
    return n;
  }

  /** Rule 10: the caption: the main sentence, then at most two notes in this order of priority. */
  function captionKey(s) {
    var m = s.p.month;
    if (m === 0) return { key: 'capStart', notes: [] };
    var notes = [];
    if (s.mine.sum.last) notes.push('nReview');
    if (s.p.roles && !s.p.move && s.counts.moves > 0) notes.push('nRolesNoMove');
    if (!s.p.roles && s.mine.copied > 0) notes.push('nCopy');
    if (!s.p.hr && s.counts.untold > 0) notes.push('nUntold');
    if (s.p.roles && s.p.move && s.mine.series[m].excess > 0) notes.push('nOneOff');
    return { key: s.none ? 'capNone' : 'capMain', notes: notes.slice(0, 2) };
  }

  function nextSeed(seed) { return seed >= RANGES.seed[1] ? 1 : seed + 1; }

  var logic = {
    REVIEWS: REVIEWS, RANGES: RANGES, CARE_STEP: CARE_STEP, NONE: NONE,
    MONTHS: A.MONTHS, TEAMS: A.TEAMS, PER_TEAM: A.PER_TEAM, RIGHTS: A.RIGHTS, EVERY: A.EVERY,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    controlsOf: controlsOf,
    isNone: isNone,
    reviewsUpTo: reviewsUpTo,
    matrix: matrix,
    nextSeed: nextSeed,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
