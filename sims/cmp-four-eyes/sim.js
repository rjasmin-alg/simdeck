/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-four-eyes: a month of one team's requests (300, twelve of them bad) needs a second signature from an
   approver who has an hour a day for approvals. The approver's queue sets the minutes per request; reviewing evenly
   spreads them thin, reviewing by risk gives the riskiest share fifteen minutes each. A bad request is caught only if
   the approver opens it, looks long enough and is independent; the record shows two signatures on every request
   either way. Explorer: the state is a pure function of the params (compute). Rules: SPEC.md. The stream, the
   minutes, the look and the record live in approval.js (promotable to models/); this file adds the params, presets,
   the comparison of the two policies and the caption.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var M = typeof module === 'object' && module.exports
    ? require('./approval.js')
    : root.SimdeckModels['approval-queue'];

  var POLICIES = ['all', 'risk'];
  var SEED_MAX = 999;
  var THIN_DEEP = 5;              // rule 8: an "in-depth" review under 5 minutes is thin again (caption only)

  /** Every param. */
  function P(over) {
    return Object.assign({ policy: 'all', load: 10, deep: 0.1, independent: true, seed: 26 }, over);
  }
  /** Rule 7: the presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'quiet', params: P({}) },
    { id: 'busy', params: P({ load: 80 }) },
    { id: 'colleague', params: P({ independent: false }) },
    { id: 'by-risk', params: P({ policy: 'risk', load: 80 }) },
    { id: 'too-deep', params: P({ policy: 'risk', load: 80, deep: 0.5 }) }
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

  /** Rule 7: params made safe (a URL may carry anything). */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    return {
      policy: oneOf(q.policy, POLICIES, defaults.policy),
      load: oneOf(q.load, M.LOADS, defaults.load),
      deep: oneOf(q.deep, M.DEEPS, defaults.deep),
      independent: bool(q.independent, defaults.independent),
      seed: clamp(Math.round(num(q.seed, defaults.seed)), 1, SEED_MAX)
    };
  }

  /** Rule 7: the next seed for "New requests": seed + 1, after 999 back to 1. */
  function nextSeed(seed) { return seed >= SEED_MAX ? 1 : seed + 1; }

  /** Everything the page shows, from the params: the chosen policy, and both policies on the same stream and draws. */
  function compute(params) {
    var p = normalise(params);
    var list = M.stream(p.seed);
    var even = M.review(list, 'all', p.load, p.deep, p.independent);
    var risk = M.review(list, 'risk', p.load, p.deep, p.independent);
    var cur = p.policy === 'risk' ? risk : even;
    return {
      p: p,
      items: cur.items,
      times: cur.times,
      bad: cur.bad,
      caught: cur.caught,
      passed: cur.passed,
      expected: cur.expected,
      stamped: cur.stamped,
      record: cur.record,
      average: M.BUDGET / p.load,                    // minutes per request on average, whatever the policy
      even: { caught: even.caught, expected: even.expected },
      risk: { caught: risk.caught, expected: risk.expected }
    };
  }

  /** Rule 8: the caption: the policy's sentence, then at most one note in this order: everything signed without a
      look (evenly); in depth for too many (by risk, under 5 minutes each); the approver is not independent; a bad
      request signed without a look (by risk). */
  function captionKey(s) {
    var p = s.p, notes = [];
    if (p.policy === 'all' && s.times.thin < M.GLANCE) notes.push('nStamp');
    else if (p.policy === 'risk' && s.times.deep < THIN_DEEP) notes.push('nThinDeep');
    else if (!p.independent) notes.push('nDep');
    else if (p.policy === 'risk' && s.items.some(function (x) { return x.bad && !x.looked; })) notes.push('nRest');
    return { key: p.policy === 'risk' ? 'capRisk' : 'capAll', notes: notes };
  }

  var logic = {
    POLICIES: POLICIES, SEED_MAX: SEED_MAX, THIN_DEEP: THIN_DEEP,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    nextSeed: nextSeed,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
