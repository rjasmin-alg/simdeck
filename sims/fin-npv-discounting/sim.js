/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-npv-discounting: a few years of cash flows, seen nominal and discounted, and their NPV.
   Explorer: the state is a pure function of the params (compute). Rules: SPEC.md. The discounting itself is in
   discount.js (promotable to models/); this file adds the params, presets and the page's derived numbers.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var D = typeof module === 'object' && module.exports
    ? require('./discount.js')
    : root.SimdeckModels.discount;

  var MAX_YEARS = 10;
  var CF_MIN = -200000, CF_MAX = 200000, CF_STEP = 1000;
  var RATE_MAX = 20, RATE_STEP = 0.5;

  /** Param keys of the flows: cf0 (today) … cf10. */
  var CF_KEYS = [];
  for (var i = 0; i <= MAX_YEARS; i++) CF_KEYS.push('cf' + i);

  /** Params of a set of flows (missing years are 0). */
  function flowParams(list) {
    var p = {};
    CF_KEYS.forEach(function (k, t) { p[k] = list[t] || 0; });
    return p;
  }

  var UPGRADE = [-120000, 35000, 35000, 35000, 35000, 35000];

  var defaults = Object.assign({ rate: 8, years: 5 }, flowParams(UPGRADE));

  /** Presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'euro-later', params: Object.assign({ rate: 8, years: 5 }, flowParams([0, 0, 0, 0, 0, 100000])) },
    { id: 'upgrade', params: Object.assign({ rate: 8, years: 5 }, flowParams(UPGRADE)) },
    { id: 'dear-money', params: Object.assign({ rate: 15, years: 5 }, flowParams(UPGRADE)) },
    { id: 'just-the-rate', params: Object.assign({ rate: 8, years: 1 }, flowParams([-100000, 108000])) },
    { id: 'late-payoff', params: Object.assign({ rate: 8, years: 5 }, flowParams([-100000, 10000, 20000, 30000, 40000, 50000])) },
    { id: 'early-payoff', params: Object.assign({ rate: 8, years: 5 }, flowParams([-100000, 50000, 40000, 30000, 20000, 10000])) }
  ];

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function snap(x, step) { return Math.round(x / step) * step; }

  /** Params made safe (a URL may carry anything): numbers, in range, on their step. */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var rate = Number(q.rate), years = Number(q.years);
    var out = {
      rate: Number.isFinite(rate) ? clamp(snap(rate, RATE_STEP), 0, RATE_MAX) : defaults.rate,
      years: Number.isFinite(years) ? clamp(Math.round(years), 1, MAX_YEARS) : defaults.years
    };
    CF_KEYS.forEach(function (k) {
      var v = Number(q[k]);
      out[k] = Number.isFinite(v) ? clamp(snap(v, CF_STEP), CF_MIN, CF_MAX) : 0;
      if (out[k] === 0) out[k] = 0; // no -0
    });
    return out;
  }

  /** The flows that count: years 0…years (SPEC.md rule 4). */
  function flowsOf(p) {
    return CF_KEYS.slice(0, p.years + 1).map(function (k) { return p[k]; });
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var r = p.rate / 100;
    var flows = flowsOf(p);
    var rows = D.table(flows, r);
    var nominal = flows.reduce(function (a, b) { return a + b; }, 0);
    var npv = D.npv(flows, r);
    return {
      p: p,
      rows: rows,
      nominal: nominal,
      npv: npv,
      npvR: D.roundMoney(npv),
      sign: D.sign(npv),
      nominalSign: D.sign(nominal),
      lost: nominal - npv,                      // what discounting took off the sum on paper
      euroLater: D.factor(r, p.years),          // rule 7
      empty: flows.every(function (x) { return x === 0; })
    };
  }

  /** Rule 9: flows of years 1…years reversed; year 0 and years after the horizon stay. */
  function mirror(params) {
    var p = normalise(params);
    var patch = {};
    for (var t = 1; t <= p.years; t++) patch['cf' + t] = p['cf' + (p.years + 1 - t)];
    return patch;
  }

  /** Rule 8: the marks that changed between two states (only the NPV sign). */
  function flipped(prev, next) {
    if (!prev || !next) return [];
    return prev.sign !== next.sign ? ['sign'] : [];
  }

  /** Caption: the verdict key and the notes that apply, in order. */
  function captionKey(s) {
    if (s.empty) return { key: 'capEmpty', notes: [] };
    var notes = [];
    if (s.p.rate === 0) notes.push('nRateZero');
    else if (s.nominalSign > 0 && s.sign < 0) notes.push('nTimeAte');
    return { key: s.sign > 0 ? 'capPos' : s.sign < 0 ? 'capNeg' : 'capZero', notes: notes };
  }

  var logic = {
    MAX_YEARS: MAX_YEARS, CF_MIN: CF_MIN, CF_MAX: CF_MAX, CF_STEP: CF_STEP, RATE_MAX: RATE_MAX, RATE_STEP: RATE_STEP,
    CF_KEYS: CF_KEYS,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    flowsOf: flowsOf,
    mirror: mirror,
    flipped: flipped,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
