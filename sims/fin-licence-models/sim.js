/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-licence-models: the same software as a perpetual licence (bought, capitalised and amortised, plus
   yearly maintenance) or as a subscription (a yearly fee), counted per user or per core, over a horizon of years.
   Explorer: the state is a pure function of the params (compute). Rules: SPEC.md. The ledger is ledger.js (copied
   from fin-capex-opex), the licensing on top of it licensing.js (promotable); this file adds the params, presets,
   the comparison and the caption keys.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var node = typeof module === 'object' && module.exports;
  var Lg = node ? require('./ledger.js') : root.SimdeckModels.ledger;
  var Li = node ? require('./licensing.js') : root.SimdeckModels.licensing;

  /** Fixed facts of the illustration (SPEC.md "Constants"). */
  var C = {
    u0: 200,          // users in year 1
    perServer: 50,    // users one server carries
    small: 16,        // cores per server before the hardware refresh
    big: 32,          // cores per server from the refresh on
    list: { user: 400, core: 1250 }, // list price of one perpetual licence in year 1, €
    life: 5,          // years a perpetual licence is amortised over
    fee: 0.2          // reinstatement fee on the back-maintenance
  };

  var METRICS = ['user', 'core'];
  var LIM = {
    growth: { min: 0, max: 30, step: 1 },
    maint: { min: 10, max: 30, step: 1 },
    rise: { min: 0, max: 10, step: 0.5 },
    horizon: { min: 3, max: 10, step: 1 },
    sub: { min: 20, max: 80, step: 5 },
    refresh: { min: 0, max: 10, step: 1 },
    lapse: { min: 0, max: 9, step: 1 },
    gap: { min: 1, max: 3, step: 1 }
  };

  var defaults = { growth: 10, maint: 20, rise: 3, horizon: 7, sub: 40, metric: 'user', refresh: 4, lapse: 0, gap: 2 };

  /** Presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'crossing', params: {} },
    { id: 'flat', params: { growth: 0, rise: 0 } },
    { id: 'lapse', params: { lapse: 3, gap: 2 } },
    { id: 'per-core', params: { metric: 'core' } },
    { id: 'core-no-refresh', params: { metric: 'core', refresh: 0 } },
    { id: 'short', params: { horizon: 3 } }
  ].map(function (x) { return { id: x.id, params: Object.assign({}, defaults, x.params) }; });

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  /** Snapped to the step, then cut to the step's decimals (no 3.5000000000000004). */
  function snap(x, step) { return Number((Math.round(x / step) * step).toFixed(2)); }
  /** A number, or NaN for anything else, including '' and null (which Number() would read as 0). */
  function num(v) { return v === '' || v === null || typeof v === 'boolean' ? NaN : Number(v); }

  /** Params made safe (a URL may carry anything): numbers in range on their step, a known metric; the lapse starts
      in year 2…H − 1 (or 0, none, also for year 1; a refresh in year 1 is none too) and lasts until at most year H − 1, so the return falls within the
      horizon (SPEC.md "Params"). */
  function normalise(params) {
    var q = Object.assign({}, defaults, params);
    var out = {};
    Object.keys(LIM).forEach(function (k) {
      var v = num(q[k]), l = LIM[k];
      out[k] = Number.isFinite(v) ? clamp(snap(v, l.step), l.min, l.max) : defaults[k];
    });
    out.metric = METRICS.indexOf(q.metric) >= 0 ? q.metric : defaults.metric;
    var H = out.horizon;
    if (out.refresh < 2) out.refresh = 0;
    if (out.lapse < 2) out.lapse = 0;
    out.lapse = Math.min(out.lapse, H - 1);
    out.gap = Math.min(out.gap, H - Math.max(out.lapse, 1));
    return out;
  }

  /** The two options for normalised params p. */
  function options(p) {
    var H = p.horizon;
    var n = Li.counts({ u0: C.u0, g: p.growth / 100, perServer: C.perServer, small: C.small, big: C.big, refresh: p.refresh, H: H });
    var need = p.metric === 'user' ? n.users : n.cores;
    var list = [0];
    for (var y = 1; y <= H; y++) list.push(Li.listPrice(C.list[p.metric], p.rise / 100, y));
    var perp = Li.perpetual({ need: need, list: list, m: p.maint / 100, life: C.life, lapse: p.lapse, gap: p.gap, fee: C.fee });
    var sub = Li.subscription({ need: need, list: list, s: p.sub / 100 });
    return { n: n, need: need, list: list, perp: perp, sub: sub };
  }

  /** Rule 9: the option(s) with the least cash paid by the end, rounded to the euro; both on a tie. */
  function cheaper(perpR, subR) {
    if (perpR === subR) return ['perp', 'sub'];
    return perpR < subR ? ['perp'] : ['sub'];
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var H = p.horizon;
    var o = options(p);
    var cumP = Li.cumulative(o.perp.rows), cumS = Li.cumulative(o.sub.rows);
    var atP = Lg.shown(o.perp.rows, H), atS = Lg.shown(o.sub.rows, H);
    var years = [];
    for (var y = 1; y <= H; y++) {
      var pt = o.perp.parts[y];
      years.push({
        y: y,
        users: o.n.users[y], servers: o.n.servers[y], perServer: o.n.perServer[y], cores: o.n.cores[y],
        need: o.need[y], held: o.perp.held[y], bought: o.perp.bought[y],
        lapsed: p.lapse > 0 && y >= p.lapse && y < p.lapse + p.gap,
        perp: { amort: pt.amort, maint: pt.maint, back: pt.back, total: pt.amort + pt.maint + pt.back, cash: o.perp.rows[y].cash },
        sub: { fee: o.sub.fee[y], total: o.sub.fee[y], cash: o.sub.fee[y] }
      });
    }
    var lapse = null;
    if (p.lapse > 0) {
      var current = options(Object.assign({}, p, { lapse: 0 }));
      var totalCurrent = Lg.roundMoney(Lg.sums(current.perp.rows, H).cash);
      lapse = {
        from: p.lapse, to: p.lapse + p.gap - 1, back: o.perp.backYear,
        skipped: o.perp.skipped, paid: o.perp.parts[o.perp.backYear].back,
        extra: atP.cash - totalCurrent
      };
    }
    return {
      p: p,
      H: H,
      years: years,
      price: o.list[1],               // one perpetual licence in year 1
      fee: o.list[1] * p.sub / 100,   // one licence's subscription in year 1
      maintFee: o.list[1] * p.maint / 100,
      perp: { cum: cumP, at: atP, first: Lg.shown(o.perp.rows, 1) },
      sub: { cum: cumS, at: atS },
      cross: Li.crossing(cumP, cumS),
      pick: cheaper(atP.cash, atS.cash),
      lapse: lapse,
      span: { u1: o.n.users[1], uH: o.n.users[H], c1: o.n.cores[1], cH: o.n.cores[H] },
      refreshIn: p.refresh > 0 && p.refresh <= H ? p.refresh : 0
    };
  }

  /** Rule 10: what changed between two states: the crossing year, the cheaper option. */
  function flipped(prev, next) {
    if (!prev || !next) return [];
    var out = [];
    if (prev.cross !== next.cross) out.push('cross');
    if (prev.pick.join() !== next.pick.join()) out.push('pick');
    return out;
  }

  /** Rule 11: the caption's main key and at most two notes, by priority: lapse, metric, expense. */
  function captionKey(s) {
    var notes = [];
    if (s.lapse) notes.push('nLapse');
    if (s.p.metric === 'core') notes.push(s.refreshIn ? 'nCoreRefresh' : 'nCore');
    else notes.push('nUser');
    notes.push('nExpense');
    return { key: s.cross ? 'capCross' : 'capNever', notes: notes.slice(0, 2) };
  }

  var logic = {
    C: C, METRICS: METRICS, LIM: LIM,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    cheaper: cheaper,
    flipped: flipped,
    captionKey: captionKey
  };

  if (node) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
