/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-dpia-triage: a planned IT project of a made-up firm, described by six activities (and a group-wide
   roll-out), is screened against six criteria; two or more usually mean a data protection impact assessment. Each
   active activity is a risk to people on the 5 × 5 likelihood × severity matrix; measures move it from before to
   after; the highest remaining risk decides between going ahead and consulting the supervisory authority.
   Explorer: the state is a pure function of the params (compute). Rules: SPEC.md.
   Scoring (score, the high-risk line, a reduction with floors) is scoring.js, copied from cmp-risk-register.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var M = typeof module === 'object' && module.exports
    ? require('./scoring.js')
    : root.SimdeckModels.scoring;

  /** Rule 4: the criteria in WP248 order (criteria 3–8). */
  var CRITERIA = ['monitor', 'sensitive', 'large', 'combined', 'vulnerable', 'newtech'];
  /** Rule 5: the measures, in the order of the effect columns below. */
  var MEASURES = ['minimise', 'pseudo', 'retention', 'access'];
  /** Rule 1: the activities in order: criteria, likelihood, severity, [ΔL, ΔS] per measure (MEASURES order). */
  var ACTIVITIES = ['badge', 'cars', 'camera', 'pcs', 'combine', 'face'];
  var ACT = {
    badge: { crit: ['vulnerable'], l: 2, s: 1, eff: [[0, 0], [0, 0], [1, 0], [0, 0]] },
    cars: { crit: ['monitor', 'sensitive', 'vulnerable'], l: 3, s: 3, eff: [[0, 1], [1, 0], [1, 0], [1, 0]] },
    camera: { crit: ['monitor', 'vulnerable'], l: 4, s: 4, eff: [[0, 1], [0, 0], [1, 0], [1, 0]] },
    pcs: { crit: ['monitor', 'sensitive', 'vulnerable'], l: 4, s: 4, eff: [[0, 2], [1, 0], [1, 0], [1, 0]] },
    combine: { crit: ['combined', 'vulnerable'], l: 3, s: 4, eff: [[0, 1], [1, 0], [0, 0], [1, 0]] },
    face: { crit: ['sensitive', 'newtech', 'vulnerable'], l: 3, s: 5, eff: [[0, 1], [0, 0], [0, 0], [0, 0]] }
  };
  /** Rule 6: a score strictly above this is high. */
  var HIGH = 12;
  /** Rule 3: people covered (illustrative), for the page. */
  var PEOPLE = { firm: 140, group: 2400 };
  var KEYS = ACTIVITIES.concat(['group'], MEASURES);
  var VERDICTS = ['empty', 'record', 'consult', 'proceed'];

  /** A whole scenario: the listed keys on, every other key off. */
  function plan(on) {
    var p = {};
    KEYS.forEach(function (k) { p[k] = on.indexOf(k) >= 0; });
    return p;
  }

  /** Presets, SPEC.md table; each carries every param, so a preset is a whole scenario. */
  var presets = [
    { id: 'badge', params: plan(['badge']) },
    { id: 'camera', params: plan(['camera']) },
    { id: 'camera-measures', params: plan(['camera', 'minimise', 'retention', 'access']) },
    { id: 'join', params: plan(['badge', 'combine']) },
    { id: 'package', params: plan(['badge', 'cars', 'camera', 'pcs', 'combine']) },
    { id: 'face-group', params: plan(['face', 'group'].concat(MEASURES)) }
  ];
  var defaults = Object.assign({}, presets[0].params);

  /** Rule 12: a toggle is on only for true, 'true', 1 or '1'. */
  function bool(v) { return v === true || v === 'true' || v === 1 || v === '1'; }

  /** Rule 12: params made safe (a URL may carry anything). */
  function normalise(p) {
    var q = Object.assign({}, defaults, p), out = {};
    KEYS.forEach(function (k) { out[k] = bool(q[k]); });
    return out;
  }

  /** The 25 cells, likelihood 5 (top row) to 1, severity 1 to 5, with the high-risk staircase edges (left: the cell to
      the left is not high; bottom: the cell below is not high). */
  function cells() {
    var out = [];
    for (var l = 5; l >= 1; l--) {
      for (var s = 1; s <= 5; s++) {
        var up = M.above(M.score(l, s), HIGH);
        out.push({
          l: l, s: s, score: M.score(l, s), high: up,
          edgeL: up && s > 1 && !M.above(M.score(l, s - 1), HIGH),
          edgeB: up && l > 1 && !M.above(M.score(l - 1, s), HIGH)
        });
      }
    }
    return out;
  }

  /** Rule 7: the index of the highest value; the first on a tie (null for an empty list). */
  function top(values) {
    var best = null;
    values.forEach(function (v, k) { if (best === null || v > values[best]) best = k; });
    return best;
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var source = ACTIVITIES.some(function (id) { return id !== 'combine' && p[id]; });
    var on = MEASURES.filter(function (m) { return p[m]; });
    var acts = ACTIVITIES.map(function (id, k) {
      var a = ACT[id];
      var active = p[id] && (id !== 'combine' || source);                    // rule 2
      var x = { id: id, n: k + 1, on: p[id], active: active, crit: a.crit.slice() };
      if (!active) return x;
      var dl = 0, ds = 0, by = [];
      MEASURES.forEach(function (m, j) {
        if (!p[m]) return;
        dl += a.eff[j][0];
        ds += a.eff[j][1];
        if (a.eff[j][0] || a.eff[j][1]) by.push(m);
      });
      var l0 = Math.min(5, a.l + (p.group ? 1 : 0));                         // rule 3
      var r = M.treat({ l: l0, i: a.s, t: 'reduce', dl: dl, di: ds, cost: 0, avoid: 0 });   // rule 5
      x.l0 = r.l0; x.s0 = r.i0; x.score0 = r.s0;
      x.l1 = r.l1; x.s1 = r.i1; x.score1 = r.s1;
      x.high0 = M.above(r.s0, HIGH);
      x.high1 = M.above(r.s1, HIGH);
      x.moved = r.l1 !== r.l0 || r.i1 !== r.i0;
      x.by = by;
      return x;
    });
    var active = acts.filter(function (x) { return x.active; });
    var crit = CRITERIA.map(function (c) {
      var by = active.filter(function (x) { return x.crit.indexOf(c) >= 0; }).map(function (x) { return x.id; });
      if (c === 'large' && p.group && active.length) by.push('group');      // rule 3
      return { id: c, lit: by.length > 0, by: by };
    });
    var count = crit.filter(function (c) { return c.lit; }).length;
    var k0 = top(active.map(function (x) { return x.score0; }));
    var k1 = top(active.map(function (x) { return x.score1; }));
    var top0 = k0 === null ? null : active[k0];
    var top1 = k1 === null ? null : active[k1];
    var verdict = !active.length ? 'empty'                                    // rule 8
      : count < 2 ? 'record'
      : top1.high1 ? 'consult' : 'proceed';
    var idle = on.filter(function (m) {                                       // rule 9
      var j = MEASURES.indexOf(m);
      return active.every(function (x) { var e = ACT[x.id].eff[j]; return !e[0] && !e[1]; });
    });
    return {
      p: p,
      acts: acts,
      crit: crit,
      count: count,
      verdict: verdict,
      top0: top0 && { id: top0.id, score: top0.score0, high: top0.high0 },
      top1: top1 && { id: top1.id, score: top1.score1, high: top1.high1 },
      measures: on,
      idle: idle,
      noSource: p.combine && !source,
      people: p.group ? PEOPLE.group : PEOPLE.firm,
      cells: cells()
    };
  }

  /** Rule 11: the criteria whose lit state changed between two states, and whether the verdict changed. */
  function flipped(prev, next) {
    if (!prev || !next) return { crit: [], verdict: false };
    return {
      crit: next.crit.filter(function (c, k) { return prev.crit[k].lit !== c.lit; }).map(function (c) { return c.id; }),
      verdict: prev.verdict !== next.verdict
    };
  }

  /** Rule 10: the caption's main sentence and at most two notes, in order. */
  function captionKey(s) {
    var any = s.measures.length > 0;
    var key = s.verdict === 'empty' ? 'capEmpty'
      : s.verdict === 'record' ? 'capRecord'
      : s.verdict === 'consult' ? (any ? 'capConsult' : 'capConsult0')
      : (any ? 'capProceed' : 'capProceed0');
    var notes = [];
    if (s.noSource) notes.push('nNoSource');
    if (s.idle.length) notes.push('nIdle');
    if (s.measures.length > s.idle.length && s.count >= 2) notes.push('nSame');   // some measure acts
    return { key: key, notes: notes.slice(0, 2) };
  }

  var logic = {
    CRITERIA: CRITERIA, MEASURES: MEASURES, ACTIVITIES: ACTIVITIES, ACT: ACT, HIGH: HIGH, PEOPLE: PEOPLE,
    KEYS: KEYS, VERDICTS: VERDICTS,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    cells: cells,
    top: top,
    flipped: flipped,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
