/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-log-evidence: one night in a small firm. An admin account logs in through the gateway, creates an
   admin account on the identity server, copies the customer folder from the file server and deletes the local logs
   on those two servers. Weeks later the incident is found and the investigation asks five questions; which it can
   still answer depends on where the logs were kept, whether the clocks agreed, whether file reads were logged and how
   long records are kept. Stepper, 7 steps (SPEC.md rule 10). The log-evidence rules are logs.js, promotable to
   models/. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Rules: SPEC.md. */
(function (root) {
  'use strict';

  var M = typeof module === 'object' && module.exports
    ? require('./logs.js')
    : root.SimdeckModels.logs;

  /** The night of the incident (SPEC.md "Fixed data"): times in minutes from day 0, 00:00. */
  var SCENARIO = {
    hosts: ['gw', 'idm', 'fs'],
    actions: [
      { id: 'login', host: 'gw', at: 23 * 60 + 10 },
      { id: 'change', host: 'idm', at: 23 * 60 + 14 },
      { id: 'export', host: 'fs', at: 23 * 60 + 20, needs: 'fileReads' }
    ],
    wipe: { at: 23 * 60 + 31, hosts: ['idm', 'fs'] }
  };
  /** The hour of day the investigation starts on the day the incident is found. */
  var FOUND_AT = 10 * 60;
  var STAGES = ['start', 'login', 'change', 'export', 'cover', 'found', 'timeline', 'answers'];
  var STEPS = STAGES.length - 1;
  var KEEPS = [30, 90, 180, 365];
  var LIMITS = { drift: [0, 30], found: [1, 365] };
  var QUESTIONS = ['who', 'what', 'data', 'order', 'tamper'];
  var ASKS = { who: 'login', what: 'change', data: 'export' };

  var defaults = { store: 'local', drift: 0, keep: 180, found: 45, fileReads: true, readers: 'admins' };

  /** Presets, SPEC.md table; expected outcomes there. */
  var presets = [
    { id: 'local', params: { store: 'local', drift: 0, keep: 180, found: 45, fileReads: true, readers: 'admins' }, step: 0 },
    { id: 'central', params: { store: 'central', drift: 0, keep: 180, found: 45, fileReads: true, readers: 'named' }, step: 0 },
    { id: 'drift', params: { store: 'central', drift: 12, keep: 180, found: 45, fileReads: true, readers: 'named' }, step: 0 },
    { id: 'short-keep', params: { store: 'central', drift: 0, keep: 30, found: 45, fileReads: true, readers: 'named' }, step: 0 },
    { id: 'not-logged', params: { store: 'central', drift: 0, keep: 180, found: 45, fileReads: false, readers: 'named' }, step: 0 },
    { id: 'open-store', params: { store: 'central', drift: 0, keep: 180, found: 45, fileReads: true, readers: 'admins' }, step: 0 }
  ];

  function num(v) {
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '') return Number(v);
    return NaN;
  }
  function bool(v, d) {
    if (v === true || v === 'true' || v === '1' || v === 1) return true;
    if (v === false || v === 'false' || v === '0' || v === 0) return false;
    return d;
  }

  /** Rule 9: params from the controls or the URL, made valid. */
  function normalise(p) {
    p = p || {};
    var out = {};
    out.store = M.STORES.indexOf(p.store) >= 0 ? p.store : defaults.store;
    Object.keys(LIMITS).forEach(function (k) {
      var v = num(p[k]);
      if (!Number.isFinite(v)) v = defaults[k];
      out[k] = Math.min(LIMITS[k][1], Math.max(LIMITS[k][0], Math.round(v)));
    });
    var keep = num(p.keep);
    out.keep = KEEPS.indexOf(keep) >= 0 ? keep : defaults.keep;
    out.fileReads = bool(p.fileReads, defaults.fileReads);
    out.readers = M.READERS.indexOf(p.readers) >= 0 ? p.readers : defaults.readers;
    // key order as in defaults, so a normalised preset deep-equals its params
    var ordered = {};
    Object.keys(defaults).forEach(function (k) { ordered[k] = out[k]; });
    return ordered;
  }

  /** The params as the log-evidence model's setup: only the file server's clock drifts. */
  function setupOf(q) {
    return { store: q.store, drift: { fs: q.drift }, keep: q.keep, logged: { fileReads: q.fileReads }, readers: q.readers };
  }

  /** Rule 10: the minute "now" points at in a stage (-1 before the night). */
  function nowAt(stage, q) {
    switch (stage) {
      case 'start': return -1;
      case 'login': return SCENARIO.actions[0].at;
      case 'change': return SCENARIO.actions[1].at;
      case 'export': return SCENARIO.actions[2].at;
      case 'cover': return SCENARIO.wipe.at;
      default: return q.found * M.DAY + FOUND_AT;
    }
  }

  /** Rule 11: the five questions at the investigation. */
  function questions(inv) {
    return QUESTIONS.map(function (id) {
      if (ASKS[id]) {
        var a = inv.actions.filter(function (x) { return x.id === ASKS[id]; })[0];
        return { id: id, status: a.status === 'kept' ? 'yes' : 'no', reason: a.status === 'kept' ? null : a.status };
      }
      if (id === 'order') return { id: id, status: inv.order.status, reason: inv.order.reason };
      return { id: id, status: inv.tamper.status, reason: inv.tamper.reason };
    });
  }

  function build(p, n) {
    var q = normalise(p);
    var stage = STAGES[Math.max(0, Math.min(STEPS, Math.round(Number(n) || 0)))];
    var setup = setupOf(q);
    var now = nowAt(stage, q);
    var foundT = nowAt('found', q);
    var inv = M.investigate(SCENARIO, setup, now);
    var fin = M.investigate(SCENARIO, setup, foundT);
    var qs = questions(fin);
    return {
      n: STAGES.indexOf(stage), stage: stage, now: now, params: q,
      inv: inv,
      aged: M.isAged(SCENARIO.actions[0].at, foundT, q.keep),
      order: fin.order,
      questions: qs,
      yes: qs.filter(function (x) { return x.status === 'yes'; }).length,
      partly: qs.filter(function (x) { return x.status === 'partly'; }).length,
      access: fin.access
    };
  }

  function question(s, id) { return s.questions.filter(function (x) { return x.id === id; })[0]; }

  var ORDER_KEY = { gaps: 'cOrderGaps', drift: 'cOrderLucky', tie: 'cOrderTie', wrong: 'cOrderWrong' };
  var ACCESS_KEY = { host: 'cAccessHost', admins: 'cAccessAdmins', named: 'cAccessNamed' };

  /** Rule 12: the sentences of the caption at this state (the page turns them into words). */
  function captionKeys(s) {
    var q = s.params, central = q.store === 'central';
    switch (s.stage) {
      case 'start': return ['cStart', central ? 'cStartCentral' : 'cStartLocal'];
      case 'login': return ['cLogin', central ? 'cLoginCentral' : 'cLoginLocal'];
      case 'change': return ['cChange'];
      case 'export':
        if (!q.fileReads) return ['cExportUnlogged'];
        return q.drift > 0 ? ['cExport', 'cExportDrift'] : ['cExport'];
      case 'cover': return [central ? 'cCoverCentral' : 'cCoverLocal'];
      case 'found': return ['cFound', s.aged ? 'cFoundAged' : 'cFoundKept'];
      case 'timeline':
        if (s.order.status === 'yes') return ['cOrderYes'];
        if (s.order.status === 'no' && s.order.reason === 'gaps') return ['cOrderNone'];
        return [ORDER_KEY[s.order.reason]];
      default:
        var lead = s.yes === QUESTIONS.length ? 'cAnswersAll'
          : s.yes + s.partly === 0 ? 'cAnswersNone'
          : s.partly > 0 ? 'cAnswersSome' : 'cAnswersCount';
        return [lead, ACCESS_KEY[s.access.who]];
    }
  }

  var logic = {
    SCENARIO: SCENARIO, FOUND_AT: FOUND_AT, STAGES: STAGES, KEEPS: KEEPS, LIMITS: LIMITS, QUESTIONS: QUESTIONS,
    defaults: defaults,
    presets: presets,
    steps: STEPS,
    normalise: normalise,
    setupOf: setupOf,
    nowAt: nowAt,
    questions: questions,
    question: question,
    captionKeys: captionKeys,
    initial: function (p) { return build(p, 0); },
    step: function (s, n, p) { return build(p, n); }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
