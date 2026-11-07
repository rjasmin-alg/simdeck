/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-prepay-discount: a three-year contract paid monthly or some years upfront at a discount. The rate
   the discount implies against the cost of capital, the cost in today's money, the expense by year and the cash
   buffer over time. Explorer: the state is a pure function of the params (compute). Rules: SPEC.md. The schedule,
   balance and implied rate are prepay.js (promotable), the discounting discount.js (copied from
   fin-npv-discounting); this file adds the params, presets, verdict and caption keys.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var node = typeof module === 'object' && module.exports;
  var D = node ? require('./discount.js') : root.SimdeckModels.discount;
  var Q = node ? require('./prepay.js') : root.SimdeckModels.prepay;

  var MONTHS = 36;                 // the contract: three years
  var TERMS = [0, 30, 60, 90];     // payment terms, days after the invoice
  var WAYS = ['monthly', 'upfront'];
  var LIM = {
    price: { min: 12000, max: 600000, step: 1200 },   // per year; a multiple of 12, so a month is whole euros
    discount: { min: 0, max: 30, step: 0.5 },
    years: { min: 1, max: 3, step: 1 },
    coc: { min: 0, max: 20, step: 0.5 },
    buffer: { min: 0, max: 500000, step: 10000 },
    floor: { min: 0, max: 300000, step: 10000 }
  };

  var defaults = { price: 60000, discount: 10, years: 3, terms: 30, coc: 8, buffer: 200000, floor: 60000 };

  /** Presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'year-upfront', params: { years: 1 } },
    { id: 'three-years', params: {} },
    { id: 'bigger-discount', params: { discount: 15 } },
    { id: 'two-years', params: { years: 2, discount: 12 } },
    { id: 'long-terms', params: { years: 1, terms: 90 } },
    { id: 'no-discount', params: { discount: 0 } }
  ].map(function (x) { return { id: x.id, params: Object.assign({}, defaults, x.params) }; });

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  /** Snapped to the step, then cut to the step's decimals (no 7.500000001). */
  function snap(x, step) { return Number((Math.round(x / step) * step).toFixed(2)); }
  /** A number, or NaN for anything else, including '', '  ' and null (which Number() would read as 0). */
  function num(v) {
    return v === null || typeof v === 'boolean' || (typeof v === 'string' && v.trim() === '') ? NaN : Number(v);
  }

  /** Params made safe (a URL may carry anything): numbers in range on their step, terms one of TERMS. */
  function normalise(params) {
    var q = Object.assign({}, defaults, params);
    var out = {};
    Object.keys(LIM).forEach(function (k) {
      var v = num(q[k]), l = LIM[k];
      out[k] = Number.isFinite(v) ? clamp(snap(v, l.step), l.min, l.max) : defaults[k];
      if (out[k] === 0) out[k] = 0; // no -0
    });
    var terms = num(q.terms);
    out.terms = TERMS.indexOf(terms) >= 0 ? terms : defaults.terms;
    return out;
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var monthly = p.price / 12, d = p.discount / 100, c = p.coc / 100, n = 12 * p.years;
    var inflows = [];
    for (var i = 0; i < MONTHS; i++) inflows.push({ t: i, amount: monthly });
    var plans = { monthly: 0, upfront: n };
    var ways = WAYS.map(function (id) {
      var o = { monthly: monthly, months: MONTHS, upfront: plans[id], discount: d, days: p.terms };
      var pay = Q.schedule(o);
      var bal = Q.balance(p.buffer, inflows, pay);
      var cost = Q.costToday(pay, c, D);
      var paid = pay.reduce(function (a, x) { return a + x.amount; }, 0);
      return {
        id: id,
        payments: pay,
        paid: paid,
        paidR: D.roundMoney(paid),
        expense: Q.expenseByYear(o),
        cost: cost,
        costR: D.roundMoney(cost),
        points: bal.points,
        low: bal.low,
        lowR: D.roundMoney(bal.low.bal),
        below: D.roundMoney(bal.low.bal) < p.floor,
        end: bal.points[bal.points.length - 1].bal
      };
    });
    var by = { monthly: ways[0], upfront: ways[1] };
    var saving = by.monthly.cost - by.upfront.cost;
    return {
      p: p,
      months: MONTHS,
      monthly: monthly,
      n: n,
      upfrontAmount: by.upfront.payments[0].amount,
      rate: Q.impliedRate(n, d),
      ways: ways,
      savingPaper: by.monthly.paid - by.upfront.paid,
      saving: saving,
      savingR: D.roundMoney(saving),
      verdict: D.sign(saving),
      tied: Q.tiedUp(by.monthly.points, by.upfront.points)
    };
  }

  /** Rule 11: decimals to show the rate with: 1, or up to 3 until it no longer reads as equal to the cost of capital
      while the verdict says it is above or below (an implied 8.504 % against 8.5 % must not read 8.5 % against 8.5 %). */
  function rateDigits(s) {
    if (s.rate === null || s.verdict === 0) return 1;
    for (var k = 1; k < 3; k++) if ((100 * s.rate).toFixed(k) !== s.p.coc.toFixed(k)) return k;
    return 3;
  }

  /** Rule 12: the marks that changed between two states (only the verdict). */
  function flipped(prev, next) {
    if (!prev || !next) return [];
    return prev.verdict !== next.verdict ? ['verdict'] : [];
  }

  /** Rule 13: the caption's main key (no discount has its own when it costs) and at most two notes, by priority:
      buffer, terms. */
  function captionKey(s) {
    var key = s.verdict > 0 ? 'capTake' : s.verdict < 0 ? (s.p.discount === 0 ? 'capNoDiscount' : 'capSkip') : 'capEven';
    var notes = [];
    if (s.ways[1].below) notes.push(s.ways[1].lowR < 0 ? 'nOverdrawn' : 'nBelowFloor');
    else notes.push('nTied');
    if (s.p.terms > 0) notes.push('nTerms');
    return { key: key, notes: notes.slice(0, 2) };
  }

  var logic = {
    MONTHS: MONTHS, TERMS: TERMS, WAYS: WAYS, LIM: LIM,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    flipped: flipped,
    rateDigits: rateDigits,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
