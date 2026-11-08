/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-exceptions: a firm's 48 systems should meet one security standard; over two years 36 requests for an
   exception arrive, and every one is granted. With no end date nobody asks again and the exceptions pile up; an end
   date nobody checks only turns them into expired ones; renewal without a decision keeps the register in date; a
   review at expiry fixes, renews once or escalates. Explorer: the state is a pure function of the params (compute).
   Rules: SPEC.md. The lifecycle and the scoring live in exceptions.js (promotable to models/); this file adds the
   firm's requests, the params, presets, the history, the comparison and the caption.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var X = typeof module === 'object' && module.exports
    ? require('./exceptions.js')
    : root.SimdeckModels.exceptions;

  /** Rule 8: the estate and the stream. */
  var SYSTEMS = 48;
  var MONTHS = 24;
  var EXPIRIES = [0, 3, 6, 12];   // months; 0 = no end date
  var PILE = 12;                  // rule 11: a quarter of the estate on exception
  /** Rule 8: the 36 requests, in the order they arrive: [month granted, system, reason, months to fix, has an owner,
      names a compensating control, likelihood, impact, month the system is replaced or null]. Reasons: 0 an old
      operating system an old business application needs, 1 a supplier-managed device that cannot take the standard
      settings, 2 an update that breaks a business application, 3 a service account that cannot use multi-factor
      sign-in, 4 an old encryption protocol a partner still uses, 5 a test machine outside the standard build. */
  var RAW = [
    [0, 28, 2, 5, 1, 0, 2, 4, null], [0, 35, 3, 2, 1, 0, 4, 2, null], [1, 29, 2, 3, 1, 0, 4, 2, null],
    [2, 47, 5, 2, 0, 0, 4, 2, null], [2, 32, 5, 1, 1, 1, 3, 5, null], [3, 37, 1, 6, 1, 0, 2, 5, null],
    [4, 12, 0, 11, 1, 0, 3, 5, 24], [4, 11, 1, 8, 0, 1, 2, 5, null], [5, 43, 0, 13, 1, 0, 4, 4, null],
    [6, 30, 0, 11, 1, 1, 4, 2, 13], [6, 40, 1, 6, 0, 1, 3, 5, 11], [7, 6, 1, 5, 0, 0, 4, 5, null],
    [8, 44, 2, 3, 1, 0, 2, 4, null], [8, 19, 4, 6, 1, 0, 4, 3, null], [9, 9, 2, 5, 1, 0, 2, 2, 20],
    [10, 5, 1, 7, 0, 1, 4, 5, null], [10, 2, 1, 4, 0, 0, 4, 2, null], [11, 34, 5, 1, 1, 0, 3, 5, null],
    [12, 41, 0, 12, 1, 1, 2, 2, null], [12, 14, 5, 2, 1, 1, 4, 3, null], [13, 20, 5, 2, 1, 1, 2, 2, null],
    [14, 23, 0, 10, 1, 0, 2, 2, null], [14, 38, 2, 2, 1, 1, 4, 3, null], [15, 27, 5, 2, 0, 0, 2, 5, null],
    [16, 39, 0, 13, 1, 1, 3, 5, null], [16, 25, 3, 1, 0, 0, 3, 5, null], [17, 0, 2, 5, 1, 1, 2, 2, null],
    [18, 16, 0, 10, 0, 1, 3, 5, null], [18, 31, 0, 12, 0, 1, 4, 3, null], [19, 1, 2, 5, 1, 0, 3, 4, null],
    [20, 18, 2, 3, 1, 0, 4, 4, null], [20, 36, 0, 12, 1, 1, 4, 2, null], [21, 7, 1, 5, 0, 0, 2, 5, null],
    [22, 33, 3, 3, 0, 1, 4, 5, null], [22, 21, 4, 7, 1, 0, 4, 4, null], [23, 45, 2, 2, 1, 0, 2, 2, null]
  ];
  var REQUESTS = RAW.map(function (a) {
    return { g: a[0], sys: a[1], why: a[2], f: a[3], owner: a[4] === 1, ctl: a[5] === 1, l: a[6], i: a[7], rep: a[8] };
  });

  /** Every param. */
  function P(over) {
    return Object.assign({ expiry: 0, atExpiry: 'nothing', complete: true, month: MONTHS }, over);
  }
  /** The presets: SPEC.md table, expected numbers there. */
  var presets = [
    { id: 'open-ended', params: P({}) },
    { id: 'date-only', params: P({ expiry: 6 }) },
    { id: 'auto-renew', params: P({ expiry: 6, atExpiry: 'renew' }) },
    { id: 'review', params: P({ expiry: 6, atExpiry: 'review' }) },
    { id: 'incomplete', params: P({ expiry: 6, atExpiry: 'review', complete: false }) },
    { id: 'yearly', params: P({ expiry: 12, atExpiry: 'review' }) }
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
  function oneOf(v, list, dflt) {
    for (var i = 0; i < list.length; i++) if (String(list[i]) === String(v)) return list[i];
    return dflt;
  }

  /** Rule 10: params made safe (a URL may carry anything). */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    return {
      expiry: oneOf(q.expiry, EXPIRIES, defaults.expiry),
      atExpiry: oneOf(q.atExpiry, X.MODES, defaults.atExpiry),
      complete: bool(q.complete, defaults.complete),
      month: clamp(Math.round(num(q.month, defaults.month)), 0, MONTHS)
    };
  }

  /** Everything the page shows, from the params: the estate at the chosen month, the history month by month, what the
      reviews did, and the same requests at the same month under each of the four regimes. */
  function compute(params) {
    var p = normalise(params);
    var E = p.expiry, mode = p.atExpiry, m = p.month;
    var est = X.estate(REQUESTS, SYSTEMS, E, mode, p.complete, m);
    var history = [];
    for (var t = 0; t <= MONTHS; t++) {
      var h = X.estate(REQUESTS, SYSTEMS, E, mode, p.complete, t);
      history.push({ m: t, open: h.open, by: h.by });
    }
    var E2 = E || 6;              // rule 9: the comparison uses the chosen end date, or six months
    var cmp = [
      { rg: 'none', e: 0, mode: 'nothing' }, { rg: 'nothing', e: E2, mode: 'nothing' },
      { rg: 'renew', e: E2, mode: 'renew' }, { rg: 'review', e: E2, mode: 'review' }
    ].map(function (c) {
      var x = X.estate(REQUESTS, SYSTEMS, c.e, c.mode, p.complete, m);
      return { rg: c.rg, meets: x.meets, share: x.share };
    });
    var tiles = [];
    for (var s = 0; s < SYSTEMS; s++) tiles.push(null);
    est.items.forEach(function (x) { if (x.st) tiles[x.sys] = x; });
    var oldest = est.oldest ? { idx: est.oldest.idx, age: est.oldest.age, sys: REQUESTS[est.oldest.idx].sys,
      why: REQUESTS[est.oldest.idx].why } : null;
    return {
      p: p,
      regime: X.regime(E, mode),
      cmpExpiry: E2,
      open: est.open, meets: est.meets, share: est.share, by: est.by,
      oldest: oldest, year: est.year, noCtl: est.noCtl, noOwner: est.noOwner, board: est.board, replaced: est.replaced,
      reviews: X.reviews(REQUESTS, E, mode, p.complete, m),
      tiles: tiles,
      history: history,
      compare: cmp
    };
  }

  /** Rule 11: the caption: the regime's sentence, then at most one note in this order: a year's grace (review with a
      12-month end date and something still open); no owner (review, an escalation from a missing owner); no control
      (an open exception without one); the pile (a quarter of the estate or more on exception). */
  function captionKey(s) {
    var notes = [];
    if (s.regime === 'review' && s.p.expiry >= 12 && s.open > 0) notes.push('nSlack');
    else if (s.regime === 'review' && s.reviews.noOwner > 0) notes.push('nOwner');
    else if (s.noCtl > 0) notes.push('nCtl');
    else if (s.open >= PILE) notes.push('nPile');
    var key = { none: 'capNone', nothing: 'capNothing', renew: 'capRenew', review: 'capReview' }[s.regime];
    return { key: key, notes: notes };
  }

  var logic = {
    SYSTEMS: SYSTEMS, MONTHS: MONTHS, EXPIRIES: EXPIRIES, PILE: PILE, REQUESTS: REQUESTS,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
