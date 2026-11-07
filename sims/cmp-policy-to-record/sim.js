/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-policy-to-record: three requirements, each a chain of policy, standard, procedure and records over a
   12-month audit period, walked by the auditor top to bottom, one requirement after another; the finding of each is
   revealed after its records, and the last step counts them. Stepper, 16 steps (SPEC.md rule 9). The trail itself
   (periods, coverage, the walk, the finding) is trail.js, promotable to models/.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Rules: SPEC.md. */
(function (root) {
  'use strict';

  var T = typeof module === 'object' && module.exports
    ? require('./trail.js')
    : root.SimdeckModels.trail;

  var MONTHS = 12;
  var REQS = [
    { id: 'backup', freq: 'quarterly' },
    { id: 'access', freq: 'monthly' },
    { id: 'patch', freq: 'monthly' }
  ];
  var CHAINS = ['complete', 'no-policy', 'vague', 'no-standard', 'no-procedure'];
  var STAGES = ['policy', 'standard', 'procedure', 'records', 'finding'];
  var STEPS = REQS.length * STAGES.length + 1;

  var defaults = { r1: 'complete', g1: 4, r2: 'no-policy', g2: 0, r3: 'complete', g3: 3 };

  /** Presets, SPEC.md table; expected outcomes there. */
  var presets = [
    { id: 'audit-day', params: { r1: 'complete', g1: 4, r2: 'no-policy', g2: 0, r3: 'complete', g3: 3 }, step: 0 },
    { id: 'whole-trail', params: { r1: 'complete', g1: 0, r2: 'complete', g2: 0, r3: 'complete', g3: 0 }, step: 0 },
    { id: 'paper', params: { r1: 'complete', g1: 4, r2: 'complete', g2: 0, r3: 'complete', g3: 12 }, step: 0 },
    { id: 'no-mandate', params: { r1: 'no-policy', g1: 0, r2: 'complete', g2: 0, r3: 'no-policy', g3: 12 }, step: 0 },
    { id: 'weak', params: { r1: 'vague', g1: 2, r2: 'no-procedure', g2: 0, r3: 'complete', g3: 0 }, step: 0 },
    { id: 'gaps', params: { r1: 'complete', g1: 1, r2: 'complete', g2: 5, r3: 'complete', g3: 0 }, step: 0 }
  ];

  /** Number of periods of requirement i. */
  function periodCount(i) { return T.periods(REQS[i].freq, MONTHS).length; }

  /** Rule 6: params from the controls or the URL, made valid. */
  function normalise(p) {
    var out = {};
    REQS.forEach(function (r, i) {
      var rk = 'r' + (i + 1), gk = 'g' + (i + 1);
      var c = p ? p[rk] : undefined;
      out[rk] = CHAINS.indexOf(c) >= 0 ? c : defaults[rk];
      var g = p ? p[gk] : undefined;
      var v = typeof g === 'number' ? g : (typeof g === 'string' && g.trim() !== '' ? Number(g) : NaN);
      if (!Number.isFinite(v)) v = defaults[gk];
      v = v < 0 ? -Math.round(-v) : Math.round(v);
      out[gk] = Math.min(periodCount(i), Math.max(0, v));
    });
    return out;
  }

  /** Rule 7: one record per period at its last month, except the last g periods. */
  function recordsFor(freq, gaps) {
    var ps = T.periods(freq, MONTHS);
    return ps.slice(0, Math.max(0, ps.length - gaps)).map(function (p) { return p.to; });
  }

  /** Rule 8: the chain a choice describes. */
  function chainOf(choice, freq, gaps) {
    return {
      policy: choice !== 'no-policy',
      standard: choice === 'vague' ? 'vague' : choice === 'no-standard' ? 'missing' : 'measurable',
      procedure: choice !== 'no-procedure',
      freq: freq,
      records: recordsFor(freq, gaps)
    };
  }

  /** Rule 9: where the auditor is at step n. */
  function cursorAt(n) {
    if (n <= 0) return { kind: 'start', req: null, stage: null };
    if (n >= STEPS) return { kind: 'report', req: null, stage: null };
    return { kind: 'walk', req: Math.floor((n - 1) / STAGES.length), stage: STAGES[(n - 1) % STAGES.length] };
  }

  /** Stages of requirement i the auditor has reached at the cursor (0…5). */
  function seenOf(cur, i) {
    if (cur.kind === 'start') return 0;
    if (cur.kind === 'report' || i < cur.req) return STAGES.length;
    if (i > cur.req) return 0;
    return STAGES.indexOf(cur.stage) + 1;
  }

  function build(p, n) {
    var q = normalise(p);
    var cur = cursorAt(n);
    var reqs = REQS.map(function (r, i) {
      var choice = q['r' + (i + 1)], gaps = q['g' + (i + 1)];
      var chain = chainOf(choice, r.freq, gaps);
      var w = T.walk(chain, MONTHS);
      var seen = seenOf(cur, i);
      return {
        id: r.id, freq: r.freq, choice: choice, gaps: gaps, chain: chain,
        periods: T.periods(r.freq, MONTHS),
        coverage: T.coverage(chain.records, r.freq, MONTHS),
        checks: w.checks, breakAt: w.breakAt, finding: w.finding,
        seen: seen, revealed: seen >= STAGES.length
      };
    });
    var counts = { design: 0, operation: 0, none: 0 };
    reqs.forEach(function (r) { counts[r.finding.kind] += 1; });
    return { n: n, cursor: cur, reqs: reqs, counts: counts, report: cur.kind === 'report' };
  }

  /** What the caption says at this state (the page turns it into words). Rule 9. */
  function captionKey(s) {
    var cur = s.cursor;
    if (cur.kind === 'start') return { key: 'cStart' };
    if (cur.kind === 'report') return { key: 'cReport' };
    var r = s.reqs[cur.req];
    var f = r.finding;
    if (cur.stage === 'finding') {
      var map = { 'no-policy': f.found > 0 ? 'cFindNoMandate' : 'cFindNoPolicy', 'no-standard': 'cFindNoStandard',
        'vague-standard': 'cFindVague', 'no-procedure': f.found > 0 ? 'cFindNoProcedure' : 'cFindNoProcedureNone', 'not-operating': 'cFindPaper', gaps: 'cFindGaps' };
      return { key: f.reason ? map[f.reason] : 'cFindNone', req: cur.req };
    }
    var c = r.checks[STAGES.indexOf(cur.stage)];
    var L = cur.stage.charAt(0).toUpperCase() + cur.stage.slice(1);
    if (cur.stage === 'records') {
      if (!c.inTrail) return { key: f.expected === null ? (f.found ? 'cRecordsOutNoStd' : 'cRecordsOutNone') : 'cRecordsOut', req: cur.req };
      return { key: c.status === 'ok' ? 'cRecordsOk' : c.status === 'none' ? 'cRecordsNone' : 'cRecordsGaps', req: cur.req };
    }
    if (!c.inTrail) return { key: 'c' + L + 'Out', req: cur.req };
    if (cur.stage === 'policy' && c.status === 'missing') return { key: f.found ? 'cPolicyMissingRecords' : 'cPolicyMissing', req: cur.req };
    var tail = c.status === 'ok' ? 'Ok' : c.status === 'vague' ? 'Vague' : 'Missing';
    return { key: 'c' + L + tail, req: cur.req };
  }

  var logic = {
    MONTHS: MONTHS, REQS: REQS, CHAINS: CHAINS, STAGES: STAGES,
    defaults: defaults,
    presets: presets,
    steps: STEPS,
    normalise: normalise,
    recordsFor: recordsFor,
    chainOf: chainOf,
    cursorAt: cursorAt,
    captionKey: captionKey,
    periodCount: periodCount,
    initial: function (p) { return build(p, 0); },
    step: function (s, n, p) { return build(p, n); }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
