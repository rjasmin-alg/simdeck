/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-downtime-cost: the cost components of an hour down, the availability target and the yearly cost of
   the redundancy; what an hour costs across the week, each level's expected downtime cost and total, what each extra
   nine saves and costs, the cheapest level, and the target against no redundancy.
   Explorer: the state is a pure function of the params (compute). Rules: SPEC.md. The sums are in downtime.js
   (promotable to models/); this file adds the constants, params, presets and the page's derived numbers.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var M = typeof module === 'object' && module.exports
    ? require('./downtime.js')
    : root.SimdeckModels.downtime;

  var WAGE = 40;      // € per idle person-hour, loaded (pay and on-costs) (SPEC.md, constants)
  var GROW = 3;       // each further nine costs three times the one before

  /** Params: key → [min, max, step]. */
  var RANGES = {
    rev: [0, 20000, 500],
    off: [0, 200, 25],
    people: [0, 500, 10],
    fix: [0, 5000, 100],
    pen: [0, 10000, 250],
    ha: [0, 200000, 5000]
  };

  function cost(rev, off, people, fix, pen, ha, target) {
    return { rev: rev, off: off, people: people, fix: fix, pen: pen, ha: ha, target: target };
  }

  /** Presets, SPEC.md table; expected numbers there. Each carries every param, so a preset is a whole scenario. */
  var presets = [
    { id: 'small-office', params: cost(0, 0, 10, 300, 0, 40000, 3) },
    { id: 'office', params: cost(0, 0, 200, 500, 0, 40000, 3) },
    { id: 'shop', params: cost(3000, 150, 10, 500, 0, 40000, 4) },
    { id: 'payments', params: cost(20000, 100, 50, 1000, 5000, 40000, 4) },
    { id: 'five-nines', params: cost(20000, 100, 50, 1000, 5000, 40000, 5) }
  ];

  var defaults = Object.assign({}, presets[1].params);

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function num(v, dflt) {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return dflt;   // empty, boolean, object…
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }

  /** Params made safe (a URL may carry anything): clamped, snapped to the step; a target outside 2–5 is 3. */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var out = {};
    Object.keys(RANGES).forEach(function (k) {
      var r = RANGES[k];
      out[k] = clamp(Math.round(num(q[k], defaults[k]) / r[2]) * r[2], r[0], r[1]);
    });
    var t = num(q.target, 3);
    out.target = M.LEVELS.indexOf(t) >= 0 ? t : 3;
    return out;
  }

  /** The level views and the cheapest level for a week's sum (€). */
  function ladder(ws, ha) {
    var ls = M.levels(ws, ha, GROW);
    return { ls: ls, best: M.best(ls) };
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var hc = M.hourCost(p, WAGE);
    var ws = M.weekSum(hc);
    var lad = ladder(ws.sum, p.ha);
    var levels = lad.ls.map(function (l) {
      var parts = {};   // only for the bar widths: each part rounded on its own
      M.PARTS.forEach(function (k) { parts[k] = M.euros(M.downCost(ws[k], l.n)); });
      return { n: l.n, seconds: M.downSeconds(l.n), down: l.down, parts: parts, ha: l.ha, tot: l.tot };
    });
    var at = function (n) { return levels[M.LEVELS.indexOf(n)]; };
    var nines = M.LEVELS.slice(1).map(function (n) {
      var x = M.nine(lad.ls, n);
      return { n: n, seconds: M.downSeconds(n - 1) - M.downSeconds(n), value: x.value, cost: x.cost, verdict: x.verdict };
    });
    // rule 9: the same decision priced as if every hour down cost a working hour
    var naive = ladder(M.WEEK * hc.work.sum, p.ha).best;
    var tgt = at(p.target);
    return {
      p: p,
      wage: WAGE,
      grow: GROW,
      hour: hc,                                     // € an hour down: work / off, by component
      avg: ws.sum / M.WEEK,                         // € the average hour (for the line; the page rounds it)
      top: Math.max(hc.work.sum, hc.off.sum),
      levels: levels,
      nines: nines,
      best: lad.best,
      naive: naive,
      target: tgt,
      base: levels[0],
      outcome: p.target === 2 ? 'base' : M.outcome(lad.ls, p.target),
      save: levels[0].tot - tgt.tot,                // whole euros; negative is a loss
      sameAsBest: p.target !== lad.best && tgt.tot === at(lad.best).tot
    };
  }

  /** Rule 10: the marks that changed between two states (the outcome or the cheapest level). */
  function flipped(prev, next) {
    if (!prev || !next) return [];
    var out = [];
    if (prev.outcome !== next.outcome) out.push('outcome');
    if (prev.best !== next.best) out.push('best');
    return out;
  }

  /** Caption: the main sentence and the notes that apply, in order (SPEC.md "Captions"). */
  function captionKey(s) {
    var notes = [];
    var t = s.p.target;
    if (t === s.best) notes.push(t === 2 ? 'nNonePays' : 'nAtBest');
    else if (s.sameAsBest) notes.push('nSameAsBest');
    else notes.push(s.best === 2 ? 'nNonePays' : 'nBest');
    if (s.naive !== s.best) notes.push('nNaive');
    var key = s.outcome === 'base' ? 'capBase' : s.outcome === 'save' ? 'capSave' : s.outcome === 'loss' ? 'capLoss' : 'capEven';
    return { key: key, notes: notes };
  }

  var logic = {
    WAGE: WAGE, GROW: GROW, RANGES: RANGES, LEVELS: M.LEVELS,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    flipped: flipped,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
