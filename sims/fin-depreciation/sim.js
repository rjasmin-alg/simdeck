/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-depreciation: one asset depreciated two ways side by side, straight-line and declining balance,
   down to a residual value, then sold or retired at the end of year n: the remaining book value against the proceeds
   is a loss or a gain. Explorer: the state is a pure function of the params (compute). Rules: SPEC.md.
   The schedule and the disposal are in asset.js (promotable to models/asset.js); the yearly ledger lines (cash out,
   expensed) come from ledger.js, copied from fin-capex-opex. This file adds the params, the presets and the page's
   derived numbers. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var node = typeof module === 'object' && module.exports;
  var As = node ? require('./asset.js') : root.SimdeckModels.asset;
  var Lg = node ? require('./ledger.js') : root.SimdeckModels.ledger;

  var COST_MIN = 1000, COST_MAX = 60000, STEP = 500;
  var LIFE_MIN = 2, LIFE_MAX = 8;
  var FACTOR = 2;                       // double-declining balance (SPEC.md rule 3)
  var METHODS = ['sl', 'db'];
  var KINDS = ['equipment', 'licence'];

  var defaults = { kind: 'equipment', cost: 30000, life: 5, residual: 3000, sell: 5, proceeds: 3000 };

  /** Presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'server', params: { kind: 'equipment', cost: 30000, life: 5, residual: 3000, sell: 5, proceeds: 3000 } },
    { id: 'sold-early', params: { kind: 'equipment', cost: 30000, life: 5, residual: 3000, sell: 3, proceeds: 10000 } },
    { id: 'scrapped', params: { kind: 'equipment', cost: 30000, life: 5, residual: 3000, sell: 3, proceeds: 0 } },
    { id: 'licence', params: { kind: 'licence', cost: 24000, life: 4, residual: 0, sell: 2, proceeds: 0 } }
  ];

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function snap(x, step) { return Math.round(x / step) * step; }
  /** A number, or the default for anything else (null, '', true, 'x', Infinity: rule 1). */
  function num(v, dflt) {
    if (typeof v !== 'number' && !(typeof v === 'string' && v.trim() !== '')) return dflt;
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }

  /** The largest residual value for a cost: half of it, on the step, rounded down (rule 1). */
  function residualMax(cost) { return Math.floor(cost / 2 / STEP) * STEP; }

  /** Params made safe (a URL may carry anything): numbers in range and on their step; residual after cost, the sale
      year after life, proceeds after cost (rule 1). */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var cost = clamp(snap(num(q.cost, defaults.cost), STEP), COST_MIN, COST_MAX);
    var life = clamp(Math.round(num(q.life, defaults.life)), LIFE_MIN, LIFE_MAX);
    return {
      kind: KINDS.indexOf(q.kind) >= 0 ? q.kind : defaults.kind,
      cost: cost,
      life: life,
      residual: clamp(snap(num(q.residual, defaults.residual), STEP), 0, residualMax(cost)),
      sell: clamp(Math.round(num(q.sell, defaults.sell)), 1, life),
      proceeds: clamp(snap(num(q.proceeds, defaults.proceeds), STEP), 0, cost)
    };
  }

  /** The asset's years as ledger rows (rule 5): row 0 the purchase (cash out, onto the balance sheet), rows 1…n the
      depreciation, and in row n the sale: cash in (negative cash), the book value off the balance sheet, the loss as
      an expense (a gain as a negative one). */
  function ledgerRows(sched, cost, sale) {
    var r = [];
    for (var y = 0; y <= sale.year; y++) r.push({ cash: 0, capex: 0, dep: 0, opex: 0 });
    r[0].cash = cost;
    r[0].capex = cost;
    for (var k = 1; k <= sale.year; k++) r[k].dep = sched[k - 1].dep;
    r[sale.year].cash -= sale.proceeds;
    r[sale.year].capex -= sale.book;
    r[sale.year].opex = -sale.gain;
    return r;
  }

  function side(p, method) {
    var sched = As.schedule(p.cost, p.life, p.residual, method, FACTOR);
    var exact = As.disposal(sched, p.cost, p.sell, p.proceeds);
    var sh = As.shown(sched, p.cost, p.sell, p.proceeds);
    var first = null;
    sched.forEach(function (x) { if (x.switched && first === null) first = x.year; });
    var end = Lg.totals(ledgerRows(sched, p.cost, exact), p.sell);
    return {
      method: method,
      dep: sh.dep,               // shown, years 0…life (0 for year 0)
      book: sh.book,             // shown, years 0…life
      sale: sh.sale,             // shown: year, book, proceeds, gain, depSoFar, total, outcome
      switchYear: first,         // db: the first year the rest is spread evenly, or null
      ledger: { cash: Lg.roundMoney(end.cash), expense: Lg.roundMoney(end.expense), book: Lg.roundMoney(end.book) }
    };
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var s = { p: p, rate: As.rate(p.life, FACTOR), perYearSl: (p.cost - p.residual) / p.life, early: p.sell < p.life };
    METHODS.forEach(function (m) { s[m] = side(p, m); });
    return s;
  }

  /** Changed marks: the methods whose outcome (loss, gain, none) a param change flipped. */
  function flipped(prev, next) {
    if (!prev || !next) return [];
    return METHODS.filter(function (m) { return prev[m].sale.outcome !== next[m].sale.outcome; });
  }

  /** Caption keys (SPEC.md "Captions"): the lead, the outcome (one sentence for both when the book values are equal,
      else one per method), and the note by priority. */
  function captionKey(s) {
    var sl = s.sl.sale, db = s.db.sale;
    var lead = (s.early ? 'early' : 'end') + (s.p.proceeds > 0 ? 'Sold' : 'Scrapped');
    var cap = function (o) { return o[0].toUpperCase() + o.slice(1); };
    var out = sl.book === db.book ? ['both' + cap(sl.outcome)] : ['sl' + cap(sl.outcome), 'db' + cap(db.outcome)];
    var signs = [sl.outcome, db.outcome].sort().join();
    var note = signs === 'gain,loss' ? 'nFlip' : (s.early || sl.gain !== 0 || db.gain !== 0) ? 'nTotal' : 'nYear1';
    return { lead: lead, out: out, note: note };
  }

  var logic = {
    COST_MIN: COST_MIN, COST_MAX: COST_MAX, STEP: STEP, LIFE_MIN: LIFE_MIN, LIFE_MAX: LIFE_MAX, FACTOR: FACTOR,
    METHODS: METHODS, KINDS: KINDS,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    residualMax: residualMax,
    ledgerRows: ledgerRows,
    flipped: flipped,
    captionKey: captionKey
  };

  if (node) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
