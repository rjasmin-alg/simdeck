/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-breach-triage: one personal-data breach of a small firm (a stolen laptop, an e-mail to the wrong
   recipient, ransomware that also copied files out, a restore that lost two days), triaged question by question:
   which of confidentiality, integrity and availability was lost; does strong encryption with a key that was not lost
   contain the confidentiality loss; does recovery in time contain the availability and integrity loss; how big is
   the risk to people that remains; and so: record only, notify the supervisory authority (72 hours from awareness,
   the GDPR clock of clocks.js), or also inform the people. Stepper, 7 steps (SPEC.md rule 7).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Rules: SPEC.md. */
(function (root) {
  'use strict';

  var C = typeof module === 'object' && module.exports
    ? require('./clocks.js')
    : root.SimdeckModels.clocks;

  /** The reference week of cmp-incident-clocks: Monday 1 March 2027. */
  var WEEK0 = C.dayNumber(2027, 3, 1);

  /** The four cases (illustrative). `losses` in C, I, A order; `attack`, `detect`, `triage` in hours from Monday
      00:00 of the reference week, as clocks.js takes them. */
  var CASES = {
    laptop: { losses: ['C', 'A'], attack: 3 * 24 + 19, detect: 13, triage: 2 },     // stolen Thu 19:00, aware Fri 10:00
    email: { losses: ['C'], attack: 1 * 24 + 10, detect: 1, triage: 1 },            // sent Tue 10:00, aware Tue 12:00
    ransomware: { losses: ['C', 'A'], attack: 5 * 24 + 2, detect: 5, triage: 6 },   // Sat 02:00, aware Sat 13:00
    restore: { losses: ['I', 'A'], attack: 2 * 24 + 14, detect: 0, triage: 2 }      // Wed 14:00, aware Wed 16:00
  };
  var CASE_IDS = ['laptop', 'email', 'ransomware', 'restore'];
  var KINDS = ['C', 'I', 'A'];
  var ENC = ['none', 'safe', 'lost'];
  /** What the data would do to the people it is about, if it got out or went missing (rule 4). Illustrative. */
  var DATA = { contact: 1, financial: 2, special: 3 };
  var DATA_IDS = ['contact', 'financial', 'special'];
  var PEOPLE = [1, 10, 100, 1000, 10000];
  /** From this many people the breach counts as large-scale: +1 (rule 4). Illustrative. */
  var LARGE = 1000;
  /** Score thresholds (rule 5): from RISK a risk to people (notify), from HIGH a high risk (also inform). */
  var RISK = 2, HIGH = 3;

  var STAGES = ['case', 'breach', 'conf', 'avail', 'risk', 'notify', 'inform', 'summary'];
  var STEPS = STAGES.length - 1;

  var defaults = { case: 'laptop', enc: 'safe', recovered: true, data: 'financial', people: 1000 };

  /** Presets, SPEC.md table; expected outcomes there. */
  var presets = [
    { id: 'laptop-encrypted', params: { case: 'laptop', enc: 'safe', recovered: true, data: 'financial', people: 1000 }, step: 0 },
    { id: 'laptop-key-lost', params: { case: 'laptop', enc: 'lost', recovered: true, data: 'financial', people: 1000 }, step: 0 },
    { id: 'wrong-email', params: { case: 'email', enc: 'none', recovered: false, data: 'financial', people: 10 }, step: 0 },
    { id: 'sick-note', params: { case: 'email', enc: 'none', recovered: false, data: 'special', people: 1 }, step: 0 },
    { id: 'ransomware', params: { case: 'ransomware', enc: 'none', recovered: true, data: 'contact', people: 10000 }, step: 0 },
    { id: 'restore', params: { case: 'restore', enc: 'none', recovered: false, data: 'contact', people: 100 }, step: 0 }
  ];

  function bool(v, d) {
    if (v === true || v === 'true' || v === '1' || v === 1) return true;
    if (v === false || v === 'false' || v === '0' || v === 0) return false;
    return d;
  }

  /** Rule 1: params from the controls or the URL, made valid. */
  function normalise(p) {
    p = p || {};
    var people = typeof p.people === 'string' && p.people.trim() !== '' ? Number(p.people) : p.people;
    return {
      case: CASE_IDS.indexOf(p.case) >= 0 ? p.case : defaults.case,
      enc: ENC.indexOf(p.enc) >= 0 ? p.enc : defaults.enc,
      recovered: bool(p.recovered, defaults.recovered),
      data: DATA_IDS.indexOf(p.data) >= 0 ? p.data : defaults.data,
      people: PEOPLE.indexOf(people) >= 0 ? people : defaults.people
    };
  }

  /** Rule 3: is a loss contained? Confidentiality by strong encryption whose key was not lost; integrity and
      availability by recovery in time. */
  function contained(kind, q) {
    return kind === 'C' ? q.enc === 'safe' : q.recovered;
  }

  /** Rules 2-6: the decision for params q (already normalised): losses, what remains, the score, the level and the
      three outcomes. Pure and wordless. */
  function triage(q) {
    var cs = CASES[q.case];
    var losses = KINDS.map(function (k) {
      var hit = cs.losses.indexOf(k) >= 0;
      return { kind: k, hit: hit, contained: hit && contained(k, q) };
    });
    var remaining = losses.filter(function (l) { return l.hit && !l.contained; }).map(function (l) { return l.kind; });
    var dataPts = remaining.length ? DATA[q.data] : 0;
    var scalePts = remaining.length && q.people >= LARGE ? 1 : 0;
    var score = dataPts + scalePts;
    var level = score >= HIGH ? 'high' : score >= RISK ? 'risk' : 'unlikely';
    return {
      losses: losses, remaining: remaining, dataPts: dataPts, scalePts: scalePts, score: score, level: level,
      record: true, notify: level !== 'unlikely', inform: level === 'high'
    };
  }

  /** Rule 6: the decision as one word: the furthest outcome required. */
  function decisionOf(tr) { return tr.inform ? 'inform' : tr.notify ? 'notify' : 'record'; }

  /** Rule 8: the same case with neither control (no encryption, nothing recovered), and with both. */
  function without(q) { return triage(Object.assign({}, q, { enc: 'none', recovered: false })); }
  function withBoth(q) { return triage(Object.assign({}, q, { enc: 'safe', recovered: true })); }

  /** Rule 6: the GDPR clock from clocks.js: 72 hours from awareness, the notification prepared in office hours. Runs
      only when the breach is notified. */
  function clockOf(q, notify) {
    var cs = CASES[q.case];
    var tl = C.timeline({ attack: cs.attack, detectAfter: cs.detect, triage: cs.triage, significant: false,
      personal: notify, reporting: 'office', week0: WEEK0 });
    var g = tl.clocks.filter(function (c) { return c.id === 'gdpr'; })[0];
    return { attack: tl.attack, detected: tl.detected, aware: tl.aware, running: g.running, due: g.due,
      filed: g.filed, inTime: g.inTime, spare: g.spare, late: g.late };
  }

  function seen(stage, at) { return STAGES.indexOf(stage) >= STAGES.indexOf(at); }

  /** Rule 7: what the stage shows at a step. A loss is 'none' (not hit), 'unknown' (before the breach step),
      'lost', or 'contained' once its question is answered. An outcome is null until its step, then true or false. */
  function build(p, n) {
    var q = normalise(p);
    var stage = STAGES[Math.max(0, Math.min(STEPS, Math.round(Number(n) || 0)))];
    var tr = triage(q);
    var wo = without(q), wb = withBoth(q);
    var losses = tr.losses.map(function (l) {
      var asked = l.kind === 'C' ? 'conf' : 'avail';
      var st = !l.hit ? 'none' : !seen(stage, 'breach') ? 'unknown' : (l.contained && seen(stage, asked)) ? 'contained' : 'lost';
      return { kind: l.kind, hit: l.hit, contained: l.contained, status: st };
    });
    return {
      n: STAGES.indexOf(stage), stage: stage, params: q,
      losses: losses,
      hasC: tr.losses[0].hit,
      hasIA: tr.losses[1].hit || tr.losses[2].hit,
      remaining: tr.remaining,
      dataPts: tr.dataPts, scalePts: tr.scalePts, score: tr.score, level: tr.level,
      decision: decisionOf(tr),
      outcome: {
        record: seen(stage, 'breach') ? true : null,
        notify: seen(stage, 'notify') ? tr.notify : null,
        inform: seen(stage, 'inform') ? tr.inform : null
      },
      without: { score: wo.score, level: wo.level, decision: decisionOf(wo) },
      withBoth: { score: wb.score, level: wb.level, decision: decisionOf(wb) },
      clock: clockOf(q, tr.notify),
      report: stage === 'summary'
    };
  }

  var RANK = { record: 0, notify: 1, inform: 2 };

  /** Rule 9: the sentences of the caption at this state (the page turns them into words). */
  function captionKeys(s) {
    var q = s.params;
    switch (s.stage) {
      case 'case': return ['cCase' + cap(q.case)];
      case 'breach': return ['cBreach'];
      case 'conf':
        if (!s.hasC) return ['cConfNone'];
        return [q.enc === 'safe' ? 'cConfSafe' : q.enc === 'lost' ? 'cConfLost' : 'cConfPlain'];
      case 'avail':
        if (!s.hasIA) return ['cAvailNone'];
        return [q.recovered ? 'cAvailBack' : 'cAvailGone'];
      case 'risk':
        if (!s.remaining.length) return ['cRiskContained'];
        return ['cRiskScore', s.level === 'high' ? 'cRiskHigh' : s.level === 'risk' ? 'cRiskRisk' : 'cRiskUnlikely'];
      case 'notify': return [s.outcome.notify ? 'cNotifyYes' : 'cNotifyNo'];
      case 'inform': return [s.outcome.inform ? 'cInformYes' : s.outcome.notify ? 'cInformNoHigh' : 'cInformNo'];
      default:
        var k = ['cSum' + cap(s.decision)];
        if (RANK[s.without.decision] > RANK[s.decision]) k.push('cSumWithout');
        if (RANK[s.withBoth.decision] < RANK[s.decision]) k.push('cSumWith');
        return k;
    }
  }

  function cap(x) { return x.charAt(0).toUpperCase() + x.slice(1); }

  var logic = {
    WEEK0: WEEK0, CASES: CASES, CASE_IDS: CASE_IDS, KINDS: KINDS, ENC: ENC, DATA: DATA, DATA_IDS: DATA_IDS,
    PEOPLE: PEOPLE, LARGE: LARGE, RISK: RISK, HIGH: HIGH, STAGES: STAGES,
    defaults: defaults,
    presets: presets,
    steps: STEPS,
    normalise: normalise,
    contained: contained,
    triage: triage,
    decisionOf: decisionOf,
    without: without,
    withBoth: withBoth,
    clockOf: clockOf,
    captionKeys: captionKeys,
    initial: function (p) { return build(p, 0); },
    step: function (s, n, p) { return build(p, n); }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
