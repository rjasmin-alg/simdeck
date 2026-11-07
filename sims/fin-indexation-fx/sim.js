/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-indexation-fx: a five-year contract paid yearly, priced fixed, fully indexed or indexed with a cap and
   a floor, in euros or in a foreign currency, run along an inflation path and an exchange-rate path. Nominal euros
   paid against real euros (signing-day money). Explorer: the state is a pure function of the params (compute).
   Rules: SPEC.md. The contract arithmetic is indexation.js (promotable); this file adds the paths, params, presets,
   the ranking and the caption keys.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var node = typeof module === 'object' && module.exports;
  var M = node ? require('./indexation.js') : root.SimdeckModels.indexation;

  var YEARS = 5;
  var PRICE = 100000;              // € a year at signing (illustrative)
  var RATE0 = 0.8;                 // € per USD at signing (illustrative): the USD price is 125 000
  var CLAUSES = ['fixed', 'indexed', 'capped'];
  var CURRENCIES = ['eur', 'usd'];

  /** Inflation during contract years 1-4 in percent (the fifth year's inflation falls after the last payment). */
  var INFLATION = {
    steady: [2, 2, 2, 2],
    spike: [3, 9, 6, 3],
    low: [1, 0, -1, 1]
  };
  /** Euros per USD at each of the five payments; the first is the signing rate. */
  var FX = {
    flat: [0.8, 0.8, 0.8, 0.8, 0.8],
    eurWeak: [0.8, 0.84, 0.88, 0.92, 0.96],
    eurStrong: [0.8, 0.77, 0.74, 0.72, 0.7],
    swings: [0.8, 0.9, 0.76, 0.92, 0.82]
  };

  var LIM = {
    premium: { min: 0, max: 15, step: 0.5 },
    cap: { min: 0, max: 10, step: 0.5 },
    floor: { min: -3, max: 3, step: 0.5 }
  };
  var CHOICES = { clause: CLAUSES, cur: CURRENCIES, infl: Object.keys(INFLATION), fx: Object.keys(FX) };

  var defaults = { clause: 'fixed', cur: 'eur', infl: 'steady', fx: 'flat', premium: 4, cap: 3, floor: 0 };

  /** Presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'fixed-steady', params: {} },
    { id: 'indexed-spike', params: { clause: 'indexed', infl: 'spike' } },
    { id: 'capped-spike', params: { clause: 'capped', infl: 'spike' } },
    { id: 'floor-low', params: { clause: 'capped', infl: 'low' } },
    { id: 'usd-euro-weak', params: { cur: 'usd', fx: 'eurWeak' } },
    { id: 'usd-euro-strong', params: { cur: 'usd', fx: 'eurStrong', infl: 'spike' } }
  ].map(function (x) { return { id: x.id, params: Object.assign({}, defaults, x.params) }; });

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function snap(x, step) { return Number((Math.round(x / step) * step).toFixed(2)); }
  /** A number, or NaN for anything else, including '', '  ' and null (which Number() would read as 0). */
  function num(v) {
    return v === null || typeof v === 'boolean' || (typeof v === 'string' && v.trim() === '') ? NaN : Number(v);
  }

  /** Params made safe (a URL may carry anything): choices one of their options, numbers in range on their step. */
  function normalise(params) {
    var q = Object.assign({}, defaults, params);
    var out = {};
    Object.keys(CHOICES).forEach(function (k) {
      out[k] = CHOICES[k].indexOf(q[k]) >= 0 ? q[k] : defaults[k];
    });
    Object.keys(LIM).forEach(function (k) {
      var v = num(q[k]), l = LIM[k];
      out[k] = Number.isFinite(v) ? clamp(snap(v, l.step), l.min, l.max) : defaults[k];
      if (out[k] === 0) out[k] = 0; // no -0
    });
    return out;
  }

  /** Rule 9: the clauses whose rounded total equals the lowest, or none when all three are equal. */
  function cheapest(list, key) {
    var vals = list.map(function (c) { return c[key]; });
    var lo = Math.min.apply(null, vals);
    var ids = list.filter(function (c) { return c[key] === lo; }).map(function (c) { return c.id; });
    return ids.length === list.length ? [] : ids;
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var inflation = INFLATION[p.infl];
    var fx = p.cur === 'usd' ? FX[p.fx] : FX.flat.map(function () { return 1; });
    var base = p.cur === 'usd' ? PRICE / RATE0 : PRICE;
    var clauses = CLAUSES.map(function (id) {
      var c = M.contract({ clause: id, inflation: inflation, years: YEARS, base: base, fx: fx, premium: p.premium, cap: p.cap, floor: p.floor });
      return {
        id: id,
        rows: c.rows,
        nominal: c.nominal,
        real: c.real,
        nominalR: M.roundMoney(c.nominal),
        realR: M.roundMoney(c.real),
        fxEffect: c.fxEffect,
        heldCap: c.rows.filter(function (r) { return r.held === 'cap'; }).length,
        heldFloor: c.rows.filter(function (r) { return r.held === 'floor'; }).length
      };
    });
    var by = {};
    clauses.forEach(function (c) { by[c.id] = c; });
    return {
      p: p,
      years: YEARS,
      price: PRICE,
      base: base,
      floorUsed: Math.min(p.floor, p.cap),
      inflation: inflation,
      level: M.priceLevel(inflation, YEARS),
      fx: fx,
      signing: YEARS * PRICE,
      clauses: clauses,
      chosen: by[p.clause],
      vsIndexed: by.capped.nominal - by.indexed.nominal,
      best: { nominal: cheapest(clauses, 'nominalR'), real: cheapest(clauses, 'realR') }
    };
  }

  /** Whether the yearly payments in euros differ once rounded (a fixed dollar price on a flat rate does not). */
  function spread(rows) {
    var r = rows.map(function (x) { return M.roundMoney(x.nominal); });
    return Math.max.apply(null, r) !== Math.min.apply(null, r);
  }

  /** Rule 10: the caption's main key and at most two notes: the clause's, then the currency's. */
  function captionKey(s) {
    var c = s.chosen, usd = s.p.cur === 'usd';
    var notes = [];
    if (c.id === 'fixed') {
      if (!usd) notes.push(s.clauses[0].realR > s.clauses[1].realR ? 'nFixedDearer' : 'nFixed');
      else notes.push(spread(c.rows) ? 'nFixedUsd' : 'nFixedUsdFlat');
    }
    else if (c.id === 'indexed') notes.push(usd ? 'nIndexedUsd' : 'nIndexed');
    else notes.push(c.heldCap && c.heldFloor ? 'nCapFloor' : c.heldCap ? 'nCap' : c.heldFloor ? 'nFloor' : 'nNoBound');
    if (usd) {
      var x = M.roundMoney(c.fxEffect);
      notes.push(x > 0 ? 'nFxUp' : x < 0 ? 'nFxDown' : 'nFxNone');
    }
    return { key: 'capMain', notes: notes };
  }

  var logic = {
    YEARS: YEARS, PRICE: PRICE, RATE0: RATE0, CLAUSES: CLAUSES, CURRENCIES: CURRENCIES,
    INFLATION: INFLATION, FX: FX, LIM: LIM, CHOICES: CHOICES,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    cheapest: cheapest,
    captionKey: captionKey
  };

  if (node) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
