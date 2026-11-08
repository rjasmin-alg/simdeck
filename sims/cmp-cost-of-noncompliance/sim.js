/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-cost-of-noncompliance: a made-up firm sets its worldwide yearly turnover and its regime (GDPR, NIS2
   essential, NIS2 important); the fine ceiling is the higher of a fixed sum and a share of the turnover, so below
   500 M€ the fixed sum decides and above it the percentage. The expected yearly cost of an incident and its fine,
   without and with the measures, is compared with what the measures cost each year. Explorer: the state is a pure
   function of the params (compute). Rules: SPEC.md (numbered as there). The ceilings and the expected cost live in
   fines.js (promotable to models/); this file adds the params, presets, the comparison across regimes and the caption.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. No words: the page has them. */
(function (root) {
  'use strict';

  var F = typeof module === 'object' && module.exports
    ? require('./fines.js')
    : root.SimdeckModels.fines;

  /** Rule 9: the options. */
  var TURNS = [2, 10, 50, 100, 250, 500, 1000, 2500];          // M€
  var INCS = [50000, 100000, 250000, 500000, 1000000, 2500000, 5000000];
  var SPENDS = [0, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000];
  var KS = [10, 25, 50, 100];
  var EFFS = [25, 50, 75];
  var P_MIN = 1, P_MAX = 60, Q_STEP = 5;

  function P(turn, law, p, inc, q, k, spend, eff) {
    return { turn: turn, law: law, p: p, inc: inc, q: q, k: k, spend: spend, eff: eff === undefined ? 50 : eff };
  }
  /** The presets: SPEC.md table, expected numbers there. */
  var presets = [
    { id: 'small-fixed', params: P(10, 'imp', 20, 250000, 40, 25, 100000) },
    { id: 'large-pct', params: P(2500, 'gdpr', 10, 2500000, 20, 10, 250000) },
    { id: 'crossover', params: P(500, 'ess', 10, 1000000, 20, 10, 50000) },
    { id: 'tiny-firm', params: P(2, 'imp', 5, 100000, 20, 10, 50000) },
    { id: 'break-even', params: P(50, 'gdpr', 10, 250000, 20, 25, 100000) }
  ];
  var defaults = Object.assign({}, presets[0].params);

  function num(v, dflt) {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return dflt;
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }
  function oneOf(v, list, dflt) {
    for (var i = 0; i < list.length; i++) if (String(list[i]) === String(v)) return list[i];
    return dflt;
  }

  /** Rule 9: params made safe (a URL may carry anything). */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    return {
      turn: oneOf(q.turn, TURNS, defaults.turn),
      law: oneOf(q.law, F.LAW_IDS, defaults.law),
      p: Math.min(P_MAX, Math.max(P_MIN, Math.round(num(q.p, defaults.p)))),
      inc: oneOf(q.inc, INCS, defaults.inc),
      q: Math.min(100, Math.max(0, Math.round(num(q.q, defaults.q) / Q_STEP) * Q_STEP)),
      k: oneOf(q.k, KS, defaults.k),
      spend: oneOf(q.spend, SPENDS, defaults.spend),
      eff: oneOf(q.eff, EFFS, defaults.eff)
    };
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var c = F.ceiling(p.law, p.turn);
    var fine = F.fine(c.ceiling, p.k);
    var e = F.expected({ p: p.p, inc: p.inc, q: p.q, fine: fine, spend: p.spend, eff: p.eff });
    // rule 8: the same turnover and fine share under each regime
    var compare = F.LAW_IDS.map(function (id) {
      var x = F.ceiling(id, p.turn);
      return { id: id, fixed: x.fixed, rate: x.rate, pct: x.pct, ceiling: x.ceiling, decides: x.decides,
        fine: F.fine(x.ceiling, p.k), chosen: id === p.law };
    });
    return {
      p: p,
      turnover: p.turn * 1000000,
      ceiling: c,
      fine: fine,
      cost: e,
      overTurnover: c.ceiling > p.turn * 1000000,
      compare: compare
    };
  }

  /** Rule 10: the caption: the ceiling sentence, the verdict sentence, at most one note. */
  function captionKey(s) {
    var d = s.ceiling.decides, v = s.cost.verdict, notes = [];
    if (v !== 'worth') notes.push(s.p.law === 'gdpr' ? 'nDutyGdpr' : 'nDutyNis2');
    else if (s.overTurnover) notes.push('nOverTurnover');
    else if (s.cost.fineDominates) notes.push('nFine');
    return {
      ceiling: d === 'fixed' ? 'capFixed' : d === 'pct' ? 'capPct' : 'capEqual',
      verdict: v === 'worth' ? 'capWorth' : v === 'even' ? 'capEven' : 'capNot',
      notes: notes
    };
  }

  var logic = {
    TURNS: TURNS, INCS: INCS, SPENDS: SPENDS, KS: KS, EFFS: EFFS, P_MIN: P_MIN, P_MAX: P_MAX, Q_STEP: Q_STEP,
    LAW_IDS: F.LAW_IDS,
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
