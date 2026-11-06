/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-capex-opex: the same amount spent as a bought asset or as a service, seen as cash, expense and book
   value month by month. Explorer: the state is a pure function of the params (compute). Rules: SPEC.md. The ledger
   itself is in ledger.js (promotable to models/); this file adds the params, presets and the page's derived numbers.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var Lg = typeof module === 'object' && module.exports
    ? require('./ledger.js')
    : root.SimdeckModels.ledger;

  var PRICE_MIN = 500, PRICE_MAX = 60000, PRICE_STEP = 500;
  var LIFE_MIN = 2, LIFE_MAX = 8;
  var THR_MAX = 10000, THR_STEP = 100;

  var defaults = { price: 30000, life: 5, threshold: 1000, month: 12 };

  /** Presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'server', params: { price: 30000, life: 5, threshold: 1000, month: 12 } },
    { id: 'day-one', params: { price: 30000, life: 5, threshold: 1000, month: 0 } },
    { id: 'end-of-life', params: { price: 30000, life: 5, threshold: 1000, month: 60 } },
    { id: 'small-purchase', params: { price: 3000, life: 5, threshold: 5000, month: 12 } },
    { id: 'at-threshold', params: { price: 5000, life: 5, threshold: 5000, month: 12 } }
  ];

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function snap(x, step) { return Math.round(x / step) * step; }
  function num(v, dflt) { var x = Number(v); return Number.isFinite(x) ? x : dflt; }

  /** Months in the useful life (= the service's term). */
  function monthsOf(life) { return 12 * life; }

  /** Params made safe (a URL may carry anything): numbers, in range, on their step; month after life. */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var life = clamp(Math.round(num(q.life, defaults.life)), LIFE_MIN, LIFE_MAX);
    return {
      price: clamp(snap(num(q.price, defaults.price), PRICE_STEP), PRICE_MIN, PRICE_MAX),
      life: life,
      threshold: clamp(snap(num(q.threshold, defaults.threshold), THR_STEP), 0, THR_MAX),
      month: clamp(Math.round(num(q.month, defaults.month)), 0, monthsOf(life))
    };
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var N = monthsOf(p.life);
    var cap = Lg.isCapitalised(p.price, p.threshold);
    var buyRows = Lg.purchase(p.price, N, cap);
    var svcRows = Lg.service(p.price, N);
    var lines = function (r) {
      var s = Lg.series(r);
      return { cash: s.map(function (x) { return x.cash; }), expense: s.map(function (x) { return x.expense; }),
        book: s.map(function (x) { return x.book; }) };
    };
    var buy = Lg.shown(buyRows, p.month), svc = Lg.shown(svcRows, p.month);
    return {
      p: p,
      N: N,
      cap: cap,
      perMonth: p.price / N,                                   // depreciation (capitalised) and the service's fee
      perYear: p.price / p.life,                               // the service's draw on the operating budget
      budget: { buy: cap ? 'capital' : 'operating', svc: 'operating' },   // rule 6
      lines: { buy: lines(buyRows), svc: lines(svcRows) },
      at: { buy: buy, svc: svc },
      ebitdaGap: buy.ebitda - svc.ebitda                       // > 0: EBITDA so far better with the purchase
    };
  }

  /** Rule 7: the marks that changed between two states (only the classification). */
  function flipped(prev, next) {
    if (!prev || !next) return [];
    return prev.cap !== next.cap ? ['class'] : [];
  }

  /** Caption: the purchase's sentence, the service's, and the one note that applies, by priority (SPEC.md
      "Captions"). */
  function captionKey(s) {
    var m = s.p.month;
    var note = null;
    if (m === s.N) note = s.ebitdaGap > 0 ? 'nEnd' : 'nEndSame';
    else if (s.ebitdaGap > 0) note = 'nEbitdaBetter';
    else if (s.ebitdaGap < 0) note = 'nEbitdaWorse';
    return {
      buy: !s.cap ? 'buyExp' : m === 0 ? 'buyCapDay' : 'buyCap',
      svc: m === 0 ? 'svcNone' : 'svcSoFar',
      note: note
    };
  }

  var logic = {
    PRICE_MIN: PRICE_MIN, PRICE_MAX: PRICE_MAX, PRICE_STEP: PRICE_STEP, LIFE_MIN: LIFE_MIN, LIFE_MAX: LIFE_MAX,
    THR_MAX: THR_MAX, THR_STEP: THR_STEP,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    monthsOf: monthsOf,
    flipped: flipped,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
