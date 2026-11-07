/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-roi-payback-npv: two projects' cash flows ranked by simple ROI, payback and NPV, with each one's IRR
   and the rate at which their NPVs swap. Explorer: the state is a pure function of the params (compute). Rules:
   SPEC.md. Discounting is discount.js (copied from fin-npv-discounting), the yardsticks are yardsticks.js (both
   promotable); this file adds the params, presets, the NPV profile and the page's derived marks.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var node = typeof module === 'object' && module.exports;
  var D = node ? require('./discount.js') : root.SimdeckModels.discount;
  var Y = node ? require('./yardsticks.js') : root.SimdeckModels.yardsticks;

  var MAX_YEARS = 8;
  var CF_MIN = -200000, CF_MAX = 200000, CF_STEP = 1000;
  var RATE_MAX = 30, RATE_STEP = 0.5;

  /** Param keys of the flows: a0 (today) … a8, b0 … b8. */
  var KEYS = { a: [], b: [] };
  for (var i = 0; i <= MAX_YEARS; i++) { KEYS.a.push('a' + i); KEYS.b.push('b' + i); }
  var CF_KEYS = KEYS.a.concat(KEYS.b);

  /** Params of two lists of flows (missing years are 0). */
  function flowParams(a, b) {
    var p = {};
    KEYS.a.forEach(function (k, t) { p[k] = a[t] || 0; });
    KEYS.b.forEach(function (k, t) { p[k] = b[t] || 0; });
    return p;
  }
  function preset(id, rate, years, a, b) {
    return { id: id, params: Object.assign({ rate: rate, years: years }, flowParams(a, b)) };
  }

  var QUICK = [-100000, 80000, 40000, 10000];
  var SLOW = [-100000, 0, 20000, 40000, 60000, 60000];
  var EARLY = [-100000, 50000, 40000, 30000, 20000, 10000];

  /** Presets, SPEC.md table; expected numbers there. */
  var presets = [
    preset('quick-vs-slow', 8, 5, QUICK, SLOW),
    preset('dear-money', 18, 5, QUICK, SLOW),
    preset('same-total', 8, 5, EARLY, EARLY.slice(0, 1).concat(EARLY.slice(1).reverse())),
    preset('after-payback', 8, 5, [-100000, 60000, 60000], [-100000, 60000, 60000, 0, 0, 80000]),
    preset('at-the-swap', 10, 3, [-100000, 120000, 10000], [-100000, 20000, 10000, 121000]),
    preset('irr', 10, 5, [-100000, 110000], SLOW)
  ];

  var defaults = Object.assign({}, presets[0].params);

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function snap(x, step) { return Math.round(x / step) * step; }

  /** A number, or NaN for anything else, including '' and null (which Number() would read as 0). */
  function num(v) { return v === '' || v === null || typeof v === 'boolean' ? NaN : Number(v); }

  /** Params made safe (a URL may carry anything): numbers, in range, on their step. */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var rate = num(q.rate), years = num(q.years);
    var out = {
      rate: Number.isFinite(rate) ? clamp(snap(rate, RATE_STEP), 0, RATE_MAX) : defaults.rate,
      years: Number.isFinite(years) ? clamp(Math.round(years), 1, MAX_YEARS) : defaults.years
    };
    CF_KEYS.forEach(function (k) {
      var v = num(q[k]);
      out[k] = Number.isFinite(v) ? clamp(snap(v, CF_STEP), CF_MIN, CF_MAX) : 0;
      if (out[k] === 0) out[k] = 0; // no -0
    });
    return out;
  }

  /** Rule 3: the flows that count, years 0…years, of project 'a' or 'b'. */
  function flowsOf(p, x) {
    return KEYS[x].slice(0, p.years + 1).map(function (k) { return p[k]; });
  }

  /** One project's yardsticks at rate r (decimal). */
  function project(flows, r) {
    var npv = D.npv(flows, r);
    return {
      flows: flows,
      roi: Y.roi(flows),
      payback: Y.payback(flows),
      npv: npv,
      npvR: D.roundMoney(npv),
      irr: Y.irr(flows, D.npv),
      empty: flows.every(function (v) { return v === 0; })
    };
  }

  /** 'A', 'B' or 'tie': who has the higher NPV at rate r (rule 8's NPV comparison). */
  function aheadAt(fa, fb, r) { return Y.pickNpv(D.npv(fa, r), D.npv(fb, r)); }

  /** Rule 10: both NPVs from 0 to RATE_MAX by RATE_STEP, for the profile chart. */
  function profile(fa, fb) {
    var out = [];
    for (var i = 0; i <= RATE_MAX / RATE_STEP; i++) {
      var pct = i * RATE_STEP;
      out.push({ rate: pct, a: D.npv(fa, pct / 100), b: D.npv(fb, pct / 100) });
    }
    return out;
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var r = p.rate / 100;
    var fa = flowsOf(p, 'a'), fb = flowsOf(p, 'b');
    var A = project(fa, r), B = project(fb, r);
    var picks = {
      roi: Y.pickRoi(A.roi, B.roi),
      payback: Y.pickPayback(A.payback, B.payback),
      npv: Y.pickNpv(A.npv, B.npv)
    };
    var same = fa.every(function (v, t) { return v === fb[t]; });
    var swaps = Y.crossings(fa, fb, D.npv, RATE_MAX / 100);
    var first = swaps.length ? swaps[0] : null, last = swaps.length ? swaps[swaps.length - 1] : null;
    var hi = RATE_MAX / 100;
    return {
      p: p,
      A: A,
      B: B,
      picks: picks,
      agree: picks.roi && picks.roi !== 'tie' && picks.roi === picks.payback && picks.roi === picks.npv ? picks.roi : null,
      same: same,
      swaps: swaps,
      // who leads below the first swap and above the last one (or over the whole range when there is none)
      below: first === null ? aheadAt(fa, fb, hi / 2) : first > 0.00005 ? aheadAt(fa, fb, first / 2) : null,
      above: last === null ? aheadAt(fa, fb, hi / 2) : aheadAt(fa, fb, last + 0.005),
      profile: profile(fa, fb),
      empty: A.empty && B.empty
    };
  }

  /** Rule 11: the yardsticks whose pick changed between two states. */
  function flipped(prev, next) {
    if (!prev || !next) return [];
    return ['roi', 'payback', 'npv'].filter(function (k) { return prev.picks[k] !== next.picks[k]; });
  }

  /** Rule 12: caption keys: the rankings, the swap, and notes, in order. */
  function captionKey(s) {
    if (s.empty) return { key: 'capEmpty', swap: null, notes: [] };
    // agree: all three pick one project; disagree: a yardstick picks a project and another picks the other one or
    // ties; otherwise (only ties, or a single pick beside "cannot compare") the picks are worded without a verdict
    var votes = [s.picks.roi, s.picks.payback, s.picks.npv].filter(function (v) { return v !== null; });
    var picked = votes.filter(function (v) { return v === 'A' || v === 'B'; });
    var split = picked.length > 0 && votes.some(function (v) { return v !== picked[0]; });
    var key = s.agree ? 'capAgree' : split ? 'capDisagree' : 'capPicks';
    var swap;
    if (s.same) swap = 'swSame';
    else if (s.swaps.length === 0) swap = 'swNone';
    else if (s.swaps.length > 1) swap = 'swMany';
    else swap = s.swaps[0] <= 0.00005 ? 'swZero' : 'swOne';
    var notes = [];
    if (!s.same) {
      // rule 12: a project's NPV is 0 at the rate; with several IRRs the note says "one of"
      if (!s.A.empty && s.A.npvR === 0) notes.push(s.A.irr.kind === 'many' ? 'nIrrSomeA' : 'nIrrA');
      if (!s.B.empty && s.B.npvR === 0) notes.push(s.B.irr.kind === 'many' ? 'nIrrSomeB' : 'nIrrB');
      if (s.picks.npv === 'tie' && notes.length === 0) notes.push('nAtSwap');
    }
    return { key: key, swap: swap, notes: notes };
  }

  var logic = {
    MAX_YEARS: MAX_YEARS, CF_MIN: CF_MIN, CF_MAX: CF_MAX, CF_STEP: CF_STEP, RATE_MAX: RATE_MAX, RATE_STEP: RATE_STEP,
    KEYS: KEYS, CF_KEYS: CF_KEYS,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    flowsOf: flowsOf,
    flipped: flipped,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
