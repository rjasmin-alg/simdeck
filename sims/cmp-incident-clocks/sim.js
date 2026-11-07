/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-incident-clocks: one incident placed on a week (attack, detection, triage, awareness), the reporting
   clocks that awareness starts, and a "now" that walks from the attack through the 24-hour and 72-hour marks and the
   final report's deadline to a summary. Stepper, 7 steps (SPEC.md rule 10). The timeline and
   its clocks are clocks.js, promotable to models/.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Rules: SPEC.md. */
(function (root) {
  'use strict';

  var C = typeof module === 'object' && module.exports
    ? require('./clocks.js')
    : root.SimdeckModels.clocks;

  /** The reference week: Monday 1 March 2027 (no daylight-saving change or public holiday in the weeks shown). */
  var WEEK0 = C.dayNumber(2027, 3, 1);
  var STAGES = ['start', 'attack', 'detect', 'aware', 'day1', 'day3', 'final', 'report'];
  var STEPS = STAGES.length - 1;
  var MODES = ['office', 'oncall'];
  var LIMITS = { day: [0, 6], hour: [0, 23], detect: [0, 168], triage: [1, 24] };

  var defaults = { day: 0, hour: 22, detect: 9, triage: 3, significant: true, personal: true, reporting: 'office' };

  /** Presets, SPEC.md table; expected outcomes there. */
  var presets = [
    { id: 'tuesday', params: { day: 0, hour: 22, detect: 9, triage: 3, significant: true, personal: true, reporting: 'office' }, step: 0 },
    { id: 'found-late', params: { day: 2, hour: 3, detect: 126, triage: 3, significant: true, personal: true, reporting: 'office' }, step: 0 },
    { id: 'friday', params: { day: 4, hour: 17, detect: 1, triage: 2, significant: true, personal: true, reporting: 'office' }, step: 0 },
    { id: 'on-call', params: { day: 4, hour: 17, detect: 1, triage: 2, significant: true, personal: true, reporting: 'oncall' }, step: 0 },
    { id: 'slow-triage', params: { day: 4, hour: 9, detect: 2, triage: 8, significant: true, personal: true, reporting: 'office' }, step: 0 },
    { id: 'data-only', params: { day: 3, hour: 14, detect: 2, triage: 4, significant: false, personal: true, reporting: 'office' }, step: 0 }
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
    Object.keys(LIMITS).forEach(function (k) {
      var v = num(p[k]);
      if (!Number.isFinite(v)) v = defaults[k];
      out[k] = Math.min(LIMITS[k][1], Math.max(LIMITS[k][0], Math.round(v)));
    });
    out.significant = bool(p.significant, defaults.significant);
    out.personal = bool(p.personal, defaults.personal);
    out.reporting = MODES.indexOf(p.reporting) >= 0 ? p.reporting : defaults.reporting;
    return out;
  }

  function incidentOf(q) {
    return { attack: q.day * 24 + q.hour, detectAfter: q.detect, triage: q.triage, significant: q.significant,
      personal: q.personal, reporting: q.reporting, week0: WEEK0 };
  }

  /** Rule 11: the hours the stage shows, from the attack's day to the day holding the later of the 72-hour mark and
      the last filing, plus 3 hours, as day segments with one gap segment when detection is more than two days after the attack's day. */
  function axis(tl) {
    var end = Math.max(tl.aware + 72, tl.lastFiled === null ? 0 : tl.lastFiled);
    var A = Math.floor(tl.attack / 24), D = Math.floor(tl.detected / 24), E = Math.floor((end + 3) / 24);
    var segs = [];
    function day(d) { segs.push({ kind: 'day', from: d * 24, to: d * 24 + 24, day: d, w: 1 }); }
    if (D - A <= 2) {
      for (var d = A; d <= E; d++) day(d);
    } else {
      day(A); day(A + 1);
      segs.push({ kind: 'gap', from: (A + 2) * 24, to: D * 24, days: D - A - 2, w: 0.5 });
      for (var e = D; e <= E; e++) day(e);
    }
    var total = segs.reduce(function (s, x) { return s + x.w; }, 0), acc = 0;
    segs.forEach(function (s) { s.x0 = acc / total; acc += s.w; s.x1 = acc / total; });
    return { from: segs[0].from, to: segs[segs.length - 1].to, segs: segs };
  }

  /** Position of hour h on the axis, 0…1 (clamped to the ends). */
  function xOf(ax, h) {
    if (h <= ax.from) return 0;
    if (h >= ax.to) return 1;
    for (var i = 0; i < ax.segs.length; i++) {
      var s = ax.segs[i];
      if (h <= s.to) return s.x0 + (s.x1 - s.x0) * (h - s.from) / (s.to - s.from);
    }
    return 1;
  }

  /** Rule 10: the hour "now" points at in a stage (null before the attack). */
  function nowAt(stage, tl) {
    var fin = tl.clocks[2];
    var last = Math.max(tl.aware + 72, tl.lastFiled === null ? 0 : tl.lastFiled);
    switch (stage) {
      case 'start': return null;
      case 'attack': return tl.attack;
      case 'detect': return tl.detected;
      case 'aware': return tl.aware;
      case 'day1': return tl.aware + 24;
      case 'day3': return tl.aware + 72;
      default: return fin.running ? Math.max(last, fin.due) : last;
    }
  }

  /** Rule 10: what a clock shows at hour now. */
  function statusAt(c, now, aware) {
    if (!c.running) return 'off';
    if (now === null || now < aware) return 'hidden';
    if (c.id === 'final') return 'set';
    if (c.filed <= now) return c.inTime ? 'ok' : 'late';
    if (now >= c.due) return 'overdue';
    return 'running';
  }

  function build(p, n) {
    var q = normalise(p);
    var stage = STAGES[Math.max(0, Math.min(STEPS, Math.round(Number(n) || 0)))];
    var tl = C.timeline(incidentOf(q));
    var now = nowAt(stage, tl);
    var clocks = tl.clocks.map(function (c) {
      return Object.assign({}, c, { status: statusAt(c, now, tl.aware) });
    });
    return {
      n: n, stage: stage, now: now, params: q,
      attack: tl.attack, detected: tl.detected, aware: tl.aware,
      clocks: clocks, work: tl.work, lastFiled: tl.lastFiled, ghost: tl.ghost,
      met: tl.met, missed: tl.missed,
      running: clocks.filter(function (c) { return c.running; }).length,
      axis: axis(tl),
      report: stage === 'report'
    };
  }

  function clock(s, id) { return s.clocks.filter(function (c) { return c.id === id; })[0]; }

  /** Rule 12: the sentences of the caption at this state (the page turns them into words). */
  function captionKeys(s) {
    var ew = clock(s, 'ew'), no = clock(s, 'notif'), fin = clock(s, 'final'), gd = clock(s, 'gdpr');
    var sig = s.params.significant, pers = s.params.personal;
    switch (s.stage) {
      case 'start': return ['cStart'];
      case 'attack': return ['cAttack'];
      case 'detect':
        if (s.detected === s.attack) return ['cDetectAtOnce'];
        return ['cDetect', s.ghost.beforeDetect > 0 ? 'cGhostGone' : s.ghost.beforeDetect === 0 ? 'cGhostJust' : 'cGhostLeft'];
      case 'aware': return ['cAware', sig && pers ? 'cAwareBoth' : sig ? 'cAwareNis' : pers ? 'cAwareGdpr' : 'cAwareNone'];
      case 'day1':
        if (!sig) return [pers ? 'cDay1Gdpr' : 'cDay1None'];
        return [ew.inTime ? 'cDay1Ok' : 'cDay1Missed'];
      case 'day3':
        if (!sig && !pers) return ['cDay3None'];
        var k = ['cDay3Lead'];
        if (sig && !ew.inTime) k.push('cDay3EwLate');
        if (sig) k.push(no.inTime ? 'cDay3NotifOk' : 'cDay3NotifMissed');
        if (pers) k.push(gd.inTime ? 'cDay3GdprOk' : 'cDay3GdprMissed');
        return k;
      case 'final':
        if (!fin.running) return ['cFinalNone'];
        return no.inTime ? ['cFinal'] : ['cFinal', 'cFinalShift'];
      default:
        if (!s.running) return ['cReportNone'];
        var r = [s.missed ? 'cReportMissed' : 'cReportOk'];
        if (s.missed && s.params.reporting === 'office') r.push('cReportOffice');
        if (s.ghost.beforeDetect >= 0) r.push('cReportGhost');
        return r;
    }
  }

  var logic = {
    WEEK0: WEEK0, STAGES: STAGES, MODES: MODES, LIMITS: LIMITS,
    defaults: defaults,
    presets: presets,
    steps: STEPS,
    normalise: normalise,
    incidentOf: incidentOf,
    axis: axis,
    xOf: xOf,
    nowAt: nowAt,
    statusAt: statusAt,
    captionKeys: captionKeys,
    clock: clock,
    initial: function (p) { return build(p, 0); },
    step: function (s, n, p) { return build(p, n); }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
