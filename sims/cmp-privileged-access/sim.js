/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-privileged-access: a small firm's team of 2-8 administrators holds admin rights all the time
   (standing) or in short windows it requests (just in time: requested, approved, limited in time, logged). Credentials
   are stolen at random hours, the same thefts under both, and the page counts how many carried admin rights. A
   break-glass account for when the identity system itself is down is opened stage by stage: the alert, the review,
   the reseal. Explorer: the state is a pure function of the params (compute). Rules: SPEC.md. The week, the windows,
   the thefts and the break-glass stages live in privileged.js (promotable to models/); this file adds the params,
   presets, the page's numbers and the caption.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var M = typeof module === 'object' && module.exports
    ? require('./privileged.js')
    : root.SimdeckModels['privileged-access'];

  var MODES = ['standing', 'jit'];
    var COUNTS = [10, 100, 1000];
  var SEED_MAX = 999;

  /** Every param. */
  function P(over) {
    return Object.assign({
      mode: 'jit', team: 4, per: 3, len: 2, work: false, thefts: 100, seed: 42,
      glass: 0, outage: true, alert: true
    }, over);
  }
  /** Rule 9: the presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'standing', params: P({ mode: 'standing' }) },
    { id: 'jit', params: P({}) },
    { id: 'work', params: P({ work: true }) },
    { id: 'all-day', params: P({ per: 5, len: 8, work: true }) },
    { id: 'glass', params: P({ glass: 3 }) },
    { id: 'quiet', params: P({ glass: 5, outage: false, alert: false }) }
  ];
  var defaults = Object.assign({}, presets[0].params);

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function num(v, dflt) {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return dflt;
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }
  function bool(v, dflt) {
    if (v === true || v === 'true' || v === 1 || v === '1') return true;
    if (v === false || v === 'false' || v === 0 || v === '0') return false;
    return dflt;
  }
  function oneOf(v, list, dflt) {
    for (var i = 0; i < list.length; i++) if (String(list[i]) === String(v)) return list[i];
    return dflt;
  }

  /** Rule 9: params made safe (a URL may carry anything). `per` is clamped to what fits the working week for `len`. */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var len = oneOf(q.len, M.LENGTHS, defaults.len);
    return {
      mode: oneOf(q.mode, MODES, defaults.mode),
      team: clamp(Math.round(num(q.team, defaults.team)), M.MIN_TEAM, M.MAX_TEAM),
      per: clamp(Math.round(num(q.per, defaults.per)), 1, M.maxPer(len)),
      len: len,
      work: bool(q.work, defaults.work),
      thefts: oneOf(q.thefts, COUNTS, defaults.thefts),
      seed: clamp(Math.round(num(q.seed, defaults.seed)), 1, SEED_MAX),
      glass: clamp(Math.round(num(q.glass, defaults.glass)), 0, M.STAGES.length - 1),
      outage: bool(q.outage, defaults.outage),
      alert: bool(q.alert, defaults.alert)
    };
  }

  /** Rule 9: the next seed for "New thefts": seed + 1, after 999 back to 1. */
  function nextSeed(seed) { return seed >= SEED_MAX ? 1 : seed + 1; }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var sched = M.schedule(p.seed, p.team, p.per, p.len);
    var list = M.judge(M.thefts(p.seed, p.thefts, p.team, p.work ? 'work' : 'any'), sched, p.mode, p.len);
    var hits = list.filter(function (x) { return x.admin; }).length;
    var jitHits = p.mode === 'jit' ? hits
      : M.judge(list, sched, 'jit', p.len).filter(function (x) { return x.admin; }).length;
    var share = M.expected(p.mode, p.per, p.len, p.work ? 'work' : 'any');
    return {
      p: p,
      sched: p.mode === 'jit' ? sched : null,
      thefts: list,
      hits: hits,
      standingHits: p.thefts,                         // rule 3: under standing rights every theft is an admin one
      jitHits: jitHits,                               // the same thefts against the same windows
      share: share,
      jitShare: M.expected('jit', p.per, p.len, p.work ? 'work' : 'any'),
      adminHours: M.adminHours(p.mode, p.per, p.len),
      jitHours: M.adminHours('jit', p.per, p.len),
      elevations: M.elevations('jit', p.team, p.per),
      glass: M.glass(p.glass, p.outage, p.alert)
    };
  }

  /** Rule 8: the word key of break-glass stage i: stage 1 without an outage is an ordinary day, stage 3 without an
      alert has none, stages 4 and 5 without a review (no outage, no alert) have no review and no reseal. */
  function stageKey(i, outage, alert) {
    if (i === 1 && !outage) return 's_1day';
    if (i === 3 && !alert) return 's_3off';
    if (i >= 4 && !outage && !alert) return i === 4 ? 's_4none' : 's_5none';
    return 's_' + i;
  }

  /** Rule 10: the caption. With the break-glass account out of its seal (stage > 0) the caption follows it; otherwise
      the thefts, then at most one note: always in a window, no theft hit (just in time), thefts in working hours. */
  function captionKey(s) {
    var g = s.glass, p = s.p;
    if (g.stage > 0) {
      var key = g.stage === 1 ? (p.outage ? 'g1Outage' : 'g1Day')
        : g.stage === 2 ? (p.outage ? 'g2Outage' : 'g2Day')
        : g.stage === 3 ? (p.alert ? 'g3Alert' : 'g3Silent')
        : 'g' + g.stage + '_' + g.outcome;
      return { key: key, notes: [] };
    }
    if (p.mode === 'standing') return { key: 'capStanding', notes: [] };
    var notes = [];
    if (s.share >= 1) notes.push('nAlways');
    else if (s.hits === 0) notes.push('nNone');
    else if (p.work) notes.push('nWork');
    return { key: 'capJit', notes: notes };
  }

  var logic = {
    MODES: MODES, COUNTS: COUNTS, SEED_MAX: SEED_MAX,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    nextSeed: nextSeed,
    stageKey: stageKey,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
