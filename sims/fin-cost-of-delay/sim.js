/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-cost-of-delay: three to five IT projects in one team's queue, each losing its value per week until it
   is delivered; the student reorders the queue and compares the total lost with five ordering rules (who asks
   loudest, biggest first, smallest first, most valuable first, value per week ÷ duration).
   Explorer: the state is a pure function of the params (compute). Rules: SPEC.md. The schedule, the rules and the
   swap saving are in delay.js (promotable to models/); this file adds the projects, params, presets and the page's
   numbers. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var M = typeof module === 'object' && module.exports
    ? require('./delay.js')
    : root.SimdeckModels.delay;

  /** The projects in list order (the order they were asked for; rule 1a's tie-break) and their letters in `order`. */
  var PROJECTS = ['portal', 'invoice', 'erp', 'dash', 'sso'];
  var LETTER = { portal: 'a', invoice: 'b', erp: 'c', dash: 'd', sso: 'e' };
  var RULES = ['loud', 'big', 'small', 'value', 'ratio'];
  var COUNTS = [3, 4, 5];
  var LOUD = [1, 2, 3, 4, 5];

  /** Every order of the five letters (120), for the hidden `order` select. */
  var ORDERS = (function () {
    var out = [];
    (function perm(rest, s) {
      if (!rest) { out.push(s); return; }
      for (var i = 0; i < rest.length; i++) perm(rest.slice(0, i) + rest.slice(i + 1), s + rest[i]);
    })('abcde', '');
    return out;
  })();

  /** Ranges: key → [min, max, step]. Per project: cost of delay (€/week) and duration (weeks). */
  var RANGES = {};
  PROJECTS.forEach(function (id) {
    RANGES[id + 'C'] = [500, 20000, 500];
    RANGES[id + 'D'] = [1, 20, 1];
  });

  /** The illustrative projects: [cost of delay €/week, duration weeks, how loudly asked 1–5]. */
  var BASE = {
    portal: [6000, 8, 3],
    invoice: [3000, 2, 2],
    erp: [4000, 12, 5],
    dash: [2000, 4, 4],
    sso: [1000, 1, 1]
  };

  /** A whole scenario: the base projects with some numbers replaced, a queue order and the project the panel edits. */
  function scenario(order, over, sel) {
    var p = { n: 5, order: order, proj: sel || 'erp' };
    PROJECTS.forEach(function (id) {
      var r = Object.assign([], BASE[id], (over && over[id]) || {});
      p[id + 'C'] = r[0]; p[id + 'D'] = r[1]; p[id + 'V'] = r[2];
    });
    return p;
  }
  function all(i, v) {
    var o = {};
    PROJECTS.forEach(function (id) { var r = {}; r[i] = v; o[id] = r; });
    return o;
  }

  /** Presets, SPEC.md table; expected numbers there. Each carries every param, so a preset is a whole scenario. */
  var presets = [
    { id: 'loud', params: scenario('cdabe') },
    { id: 'big', params: scenario('cadbe') },
    { id: 'quick', params: scenario('ebdac', null, 'sso') },
    { id: 'ratio', params: scenario('beadc', null, 'invoice') },
    { id: 'same-value', params: scenario('cdabe', all(0, 3000), 'sso') },
    { id: 'same-size', params: scenario('cdabe', all(1, 4), 'portal') }
  ];

  var defaults = Object.assign({}, presets[0].params);

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function num(v, dflt) {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return dflt;   // empty, boolean, object…
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }
  function oneOf(list, v, dflt) {
    var x = num(v, NaN);
    return list.indexOf(x) >= 0 ? x : dflt;
  }

  /** Rule 8: an order string made whole: the known letters in the order given, each once, then the missing ones in
      list order. Anything that is not a string gives the default order. */
  function fixOrder(s) {
    if (typeof s !== 'string') return defaults.order;
    var out = '';
    for (var i = 0; i < s.length; i++) if ('abcde'.indexOf(s[i]) >= 0 && out.indexOf(s[i]) < 0) out += s[i];
    'abcde'.split('').forEach(function (c) { if (out.indexOf(c) < 0) out += c; });
    return out;
  }

  /** Params made safe (a URL may carry anything): ranges clamped and snapped to the step; a count, loudness or project
      outside its list takes the default; a project not in play is replaced by the first in the list. */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var out = {};
    Object.keys(RANGES).forEach(function (k) {
      var r = RANGES[k];
      out[k] = clamp(Math.round(num(q[k], defaults[k]) / r[2]) * r[2], r[0], r[1]);
    });
    PROJECTS.forEach(function (id) { out[id + 'V'] = oneOf(LOUD, q[id + 'V'], defaults[id + 'V']); });
    out.n = oneOf(COUNTS, q.n, defaults.n);
    out.order = fixOrder(q.order);
    var live = PROJECTS.slice(0, out.n);
    out.proj = live.indexOf(q.proj) >= 0 ? q.proj : live[0];
    return out;
  }

  /** The projects in play (the first n of the list), in queue order. */
  function queueOf(p) {
    var live = PROJECTS.slice(0, p.n);
    return p.order.split('').map(function (c) { return PROJECTS['abcde'.indexOf(c)]; })
      .filter(function (id) { return live.indexOf(id) >= 0; });
  }
  /** The order string for a queue: its letters, then the projects not in play in their present order. */
  function orderFor(p, ids) {
    var s = ids.map(function (id) { return LETTER[id]; }).join('');
    return s + p.order.split('').filter(function (c) { return s.indexOf(c) < 0; }).join('');
  }
  function item(p, id) {
    return { id: id, cd: p[id + 'C'], d: p[id + 'D'], v: p[id + 'V'], i: PROJECTS.indexOf(id) };
  }

  /** Rule 9: move a project one place earlier (dir −1) or later (+1) in the queue. Returns the new order string, the
      same one when it is already first (or last) or not in play. */
  function move(params, id, dir) {
    var p = normalise(params);
    var q = queueOf(p), i = q.indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= q.length) return p.order;
    q[i] = q[j];
    q[j] = id;
    return orderFor(p, q);
  }
  /** Rule 5 on the page: the order string a rule gives for the projects in play. */
  function ruleOrder(params, rule) {
    var p = normalise(params);
    return orderFor(p, M.order(queueOf(p).map(function (id) { return item(p, id); }), rule).map(function (x) { return x.id; }));
  }

  /** The axis: 0 to the top on nice steps (at least a quarter of it). */
  function axis(top, parts) {
    var step = M.niceStep(top, parts);
    var hi = Math.max(step, Math.ceil(top / step) * step);
    var ticks = [];
    for (var v = 0; v <= hi + 1e-9; v += step) ticks.push(v);
    return { hi: hi, step: step, ticks: ticks };
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var ids = queueOf(p);
    var items = ids.map(function (id) { return item(p, id); });
    var sch = M.schedule(items);
    var rate = 0;
    items.forEach(function (x) { rate += x.cd; });
    // the bands of the staircase: a project's band sits on those delivered after it (rule 4)
    var below = rate;
    var rows = sch.rows.map(function (r, k) {
      below -= r.cd;
      var x = items[k];
      return Object.assign(r, {
        v: x.v,
        ratio: Math.floor((2 * r.cd + r.d) / (2 * r.d)),   // shown only, whole euros, halves up (rule 1b)
        lo: below, hi: below + r.cd
      });
    });
    var sorted = M.order(items, 'ratio');
    var bestSch = M.schedule(sorted);
    var best = bestSch.total;
    var mine = ids.join(' ');
    var rules = RULES.map(function (rule) {
      var o = M.order(items, rule);
      var tot = M.schedule(o).total;
      return { id: rule, ids: o.map(function (x) { return x.id; }), total: tot, extra: tot - best,
        best: tot === best, mine: o.map(function (x) { return x.id; }).join(' ') === mine };
    });
    // the best order's staircase, for the dashed outline: € per week still lost after each delivery
    var left = rate, stairs = [[0, rate]];
    bestSch.rows.forEach(function (r) { stairs.push([r.done, left]); left -= r.cd; stairs.push([r.done, left]); });
    // rule 1c: the first neighbours in the best order with the same ratio
    var tie = null;
    for (var i = 0; i + 1 < sorted.length && !tie; i++) {
      if (M.byRatio(sorted[i], sorted[i + 1]) === 0) tie = [sorted[i].id, sorted[i + 1].id];
    }
    var outcome = sch.total === best ? 'best' : 'worse';
    return {
      p: p,
      ids: ids,
      rows: rows,
      weeks: sch.weeks,
      rate: rate,
      total: sch.total,
      wait: sch.wait,
      build: sch.build,
      best: best,
      bestIds: sorted.map(function (x) { return x.id; }),
      extra: sch.total - best,
      outcome: outcome,
      rules: rules,
      worst: Math.max.apply(null, rules.map(function (r) { return r.total; }).concat([sch.total])),
      swap: outcome === 'best' ? null : M.bestSwap(items),
      tie: tie,
      stairs: stairs,
      yAxis: axis(rate, 4),
      xAxis: axis(sch.weeks, 6)
    };
  }

  /** Rule 10: the marks that changed between two states (the outcome moves between best and worse). */
  function flipped(prev, next) {
    if (!prev || !next) return [];
    return prev.outcome !== next.outcome ? ['outcome'] : [];
  }

  /** Caption: the main sentence and the notes that apply, in order (SPEC.md "Captions"). */
  function captionKey(s) {
    var notes = [];
    if (s.swap) notes.push('nSwap');
    if (s.tie) notes.push('nTie');
    return { key: s.outcome === 'best' ? 'capBest' : 'capWorse', notes: notes };
  }

  var logic = {
    PROJECTS: PROJECTS, LETTER: LETTER, RULES: RULES, COUNTS: COUNTS, LOUD: LOUD, ORDERS: ORDERS, RANGES: RANGES,
    BASE: BASE,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    queueOf: queueOf,
    move: move,
    ruleOrder: ruleOrder,
    axis: axis,
    flipped: flipped,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
