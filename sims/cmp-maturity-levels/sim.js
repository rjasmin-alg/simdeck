/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-maturity-levels: a made-up firm rates eight control areas on five maturity levels (1 ad hoc …
   5 improving) and sets a target for each. Each level up costs twice the last (2^L weeks of work); each level up
   halves the area's expected incidents (2^(4 − L) a year); a simulated audit raises a major nonconformity at level 1
   and a minor one at level 2. The average of the eight can look fine while one area sits at the bottom, and that area
   is where the findings and most incidents come from. Explorer: the state is a pure function of the params (compute).
   Rules: SPEC.md (numbered as there).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. No words: the page has them. */
(function (root) {
  'use strict';

  /** Rule 1: eight areas, five levels. */
  var AREAS = 8;
  var MIN = 1;
  var MAX = 5;
  /** Rule 3: the audit line: level 3 and up raises nothing. */
  var LINE = 3;
  /** Rule 6: the budgets, in weeks of work. */
  var BUDGETS = [12, 24, 48, 96];

  /** Rule 2: the step from L to L + 1 costs 2^L weeks. */
  function stepCost(L) { return Math.pow(2, L); }
  /** Rule 2: raising one area from c to t costs 2^t − 2^c (0 when t ≤ c). */
  function areaCost(c, t) {
    var s = 0;
    for (var L = c; L < t; L++) s += stepCost(L);
    return s;
  }
  /** Rule 2: the plan's cost, summed over the areas. */
  function planCost(cur, tgt) {
    var s = 0;
    for (var i = 0; i < cur.length; i++) s += areaCost(cur[i], tgt[i]);
    return s;
  }
  /** Rule 3: what the audit raises for an area at level L: 'major', 'minor' or null. */
  function finding(L) { return L <= 1 ? 'major' : L === 2 ? 'minor' : null; }
  /** Rule 4: expected incidents a year from an area at level L. */
  function incidents(L) { return Math.pow(2, 4 - L); }

  /** Rules 3–5: the summary of a set of levels: average, weakest (lowest level, first in order on a tie), majors,
      minors, incidents a year and the weakest area's share of them. */
  function summary(levels) {
    var sum = 0, inc = 0, major = 0, minor = 0, w = 0;
    for (var i = 0; i < levels.length; i++) {
      var L = levels[i];
      sum += L;
      inc += incidents(L);
      if (finding(L) === 'major') major++;
      if (finding(L) === 'minor') minor++;
      if (L < levels[w]) w = i;
    }
    return {
      avg: sum / levels.length,
      weakest: w, low: levels[w],
      major: major, minor: minor,
      inc: inc, share: incidents(levels[w]) / inc
    };
  }

  /** Rule 8: the plans compared, from the same current levels. */
  var PLANS = ['now', 'plus1', 'floor', 'yours'];
  function planTargets(id, cur, tgt) {
    return cur.map(function (c, i) {
      if (id === 'now') return c;
      if (id === 'plus1') return Math.min(MAX, c + 1);
      if (id === 'floor') return Math.max(c, LINE);
      return tgt[i];
    });
  }

  function key(prefix, i) { return prefix + (i + 1); }
  function digits(s) { return s.split('').map(Number); }

  /** Params from two strings of eight digits and a budget. */
  function P(cur, tgt, budget) {
    var p = { budget: budget };
    digits(cur).forEach(function (x, i) { p[key('c', i)] = x; });
    digits(tgt).forEach(function (x, i) { p[key('t', i)] = x; });
    return p;
  }
  var A = '44341343';
  var S = '55452414';
  /** The presets: SPEC.md table, expected numbers there. */
  var presets = [
    { id: 'average-fine', params: P(A, A, 24) },
    { id: 'plus-one', params: P(A, '55452454', 96) },
    { id: 'floor', params: P(A, '44343343', 24) },
    { id: 'per-area', params: P(A, '44443443', 24) },
    { id: 'showcase', params: P(S, S, 24) },
    { id: 'showcase-floor', params: P(S, '55453434', 12) }
  ];
  var defaults = Object.assign({}, presets[0].params);

  function num(v, dflt) {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return dflt;
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }
  function level(v, dflt) { return Math.min(MAX, Math.max(MIN, Math.round(num(v, dflt)))); }
  function oneOf(v, list, dflt) {
    for (var i = 0; i < list.length; i++) if (String(list[i]) === String(v)) return list[i];
    return dflt;
  }

  /** Rule 9: params made safe (a URL may carry anything). Targets never below the current level. */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var out = { budget: oneOf(q.budget, BUDGETS, defaults.budget) };
    for (var i = 0; i < AREAS; i++) {
      var c = level(q[key('c', i)], defaults[key('c', i)]);
      var t = level(q[key('t', i)], defaults[key('t', i)]);
      out[key('c', i)] = c;
      out[key('t', i)] = Math.max(t, c);
    }
    return out;
  }

  function levelsOf(p, prefix) {
    var out = [];
    for (var i = 0; i < AREAS; i++) out.push(p[key(prefix, i)]);
    return out;
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var cur = levelsOf(p, 'c'), tgt = levelsOf(p, 't');
    var cost = planCost(cur, tgt);
    var rows = cur.map(function (c, i) {
      var t = tgt[i];
      return { i: i, c: c, t: t, cost: areaCost(c, t), f: finding(t), inc: incidents(t) };
    });
    var compare = PLANS.map(function (id) {
      var lv = planTargets(id, cur, tgt);
      var k = planCost(cur, lv);
      return Object.assign({ id: id, cost: k, fits: k <= p.budget, levels: lv }, summary(lv));
    });
    return {
      p: p,
      cur: cur, tgt: tgt,
      budget: p.budget, cost: cost, left: p.budget - cost, over: cost > p.budget,
      empty: cost === 0,
      buysTop: rows.some(function (r) { return r.t === MAX && r.c < MAX; }),
      now: summary(cur), plan: summary(tgt),
      rows: rows,
      compare: compare
    };
  }

  /** Rule 7: a move on the stage. kind: 'tUp', 'tDown', 'cUp', 'cDown'; i the area (0-based). Returns { ok, why,
      patch } where patch is the params to set when ok, and why the refusal ('top', 'budget', 'floor', 'bottom'). */
  function move(s, kind, i) {
    var c = s.cur[i], t = s.tgt[i], patch = {};
    if (kind === 'tUp') {
      if (t >= MAX) return { ok: false, why: 'top', patch: null };
      if (s.cost + stepCost(t) > s.budget) return { ok: false, why: 'budget', patch: null, need: stepCost(t), left: s.left };
      patch[key('t', i)] = t + 1;
    } else if (kind === 'tDown') {
      if (t <= c) return { ok: false, why: 'floor', patch: null };
      patch[key('t', i)] = t - 1;
    } else if (kind === 'cUp') {
      if (c >= MAX) return { ok: false, why: 'top', patch: null };
      patch[key('c', i)] = c + 1;
      patch[key('t', i)] = Math.max(t, c + 1);
    } else if (kind === 'cDown') {
      if (c <= MIN) return { ok: false, why: 'bottom', patch: null };
      patch[key('c', i)] = c - 1;
    } else return { ok: false, why: 'unknown', patch: null };
    return { ok: true, why: null, patch: patch };
  }

  /** The params that clear the plan: every target back to the current level. */
  function clearPlan(s) {
    var patch = {};
    s.cur.forEach(function (c, i) { patch[key('t', i)] = c; });
    return patch;
  }

  /** Rule 10: the caption: the sentence (now with the weakest below 3, now with nothing below 3, or now → plan) and at
      most one note, in this order: over budget; the average hides the weakest; the top step is dear; all clear. An
      empty plan has no note. */
  function captionKey(s) {
    var notes = [];
    if (!s.empty) {
      if (s.over) notes.push('nOver');
      else if (s.plan.avg >= LINE && s.plan.low < LINE) notes.push('nHides');
      else if (s.buysTop && s.plan.low < LINE) notes.push('nTop');
      else if (s.plan.major + s.plan.minor === 0) notes.push('nClear');
    }
    return { key: !s.empty ? 'capPlan' : s.now.low < LINE ? 'capNow' : 'capNowOk', notes: notes };
  }

  var logic = {
    AREAS: AREAS, MIN: MIN, MAX: MAX, LINE: LINE, BUDGETS: BUDGETS, PLANS: PLANS,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    stepCost: stepCost, areaCost: areaCost, planCost: planCost,
    finding: finding, incidents: incidents, summary: summary, planTargets: planTargets,
    move: move, clearPlan: clearPlan,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
