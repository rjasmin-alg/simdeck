// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-policy-to-record. Run: node --test sims/cmp-policy-to-record/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the trail model's rules (trail.js), then the sim's
// rules (sim.js), then the presets, then the strings and the page, then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const trail = require('./trail.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const preset = (id) => logic.presets.find((x) => x.id === id);
const atPreset = (id, n) => kit.stateAt(logic, P(preset(id).params), n);
const LAST = logic.steps;
const chain = (over) => Object.assign({ policy: true, standard: 'measurable', procedure: true, freq: 'monthly',
  records: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }, over);

// ── tie-breaks ──

test('tie-break: a record in a period\'s last month covers that period, not the next (months 3 and 4)', () => {
  const cov = trail.coverage([3], 'quarterly', 12);
  assert.deepEqual(cov.map((p) => p.ok), [true, false, false, false]);
  const cov4 = trail.coverage([4], 'quarterly', 12);
  assert.deepEqual(cov4.map((p) => p.ok), [false, true, false, false]);
  assert.equal(trail.periodOf(12, 'quarterly', 12), 3);
  assert.equal(trail.periodOf(1, 'monthly', 12), 0);
});

test('tie-break: two records in one period count once; they never fill another period', () => {
  const cov = trail.coverage([2, 3, 3], 'quarterly', 12);
  assert.equal(cov[0].count, 3);
  assert.deepEqual(cov.map((p) => p.ok), [true, false, false, false]);
  const w = trail.walk(chain({ freq: 'quarterly', records: [1, 2, 3, 12] }), 12);
  assert.equal(w.finding.found, 2);
  assert.equal(w.finding.expected, 4);
  assert.deepEqual(w.finding.missing, [1, 2]);
  assert.equal(w.finding.reason, 'gaps');
});

test('tie-break: the highest failing layer names the finding', () => {
  const w = trail.walk(chain({ policy: false, standard: 'vague', procedure: false }), 12);
  assert.equal(w.breakAt, 'policy');
  assert.equal(w.finding.reason, 'no-policy');
  const w2 = trail.walk(chain({ standard: 'missing', procedure: false }), 12);
  assert.equal(w2.breakAt, 'standard');
  assert.equal(w2.finding.reason, 'no-standard');
});

test('tie-break: design comes before operation (a break above empty records is a design finding)', () => {
  const w = trail.walk(chain({ procedure: false, records: [] }), 12);
  assert.equal(w.finding.kind, 'design');
  assert.equal(w.finding.reason, 'no-procedure');
  assert.equal(w.checks[3].status, 'none');
  assert.equal(w.checks[3].inTrail, false);
});

// ── the trail model (trail.js, SPEC rules 1-5) ──

test('rule 1: periods split the audit period; a short last period ends at the last month', () => {
  assert.deepEqual(trail.periods('quarterly', 12).map((p) => [p.from, p.to]), [[1, 3], [4, 6], [7, 9], [10, 12]]);
  assert.equal(trail.periods('monthly', 12).length, 12);
  assert.deepEqual(trail.periods('yearly', 12).map((p) => [p.from, p.to]), [[1, 12]]);
  assert.deepEqual(trail.periods('quarterly', 7).map((p) => [p.from, p.to]), [[1, 3], [4, 6], [7, 7]]);
  assert.throws(() => trail.periods('weekly', 12));
});

test('rule 2: records outside the audit period, or not whole months, are ignored', () => {
  const cov = trail.coverage([0, 13, -1, 2.5, '3', null, 5], 'monthly', 12);
  assert.deepEqual(cov.filter((p) => p.ok).map((p) => p.index), [4]);
  assert.deepEqual(trail.inPeriod([12, 0, 3, 14, 3], 12), [3, 3, 12]);
});

test('rule 3: the trail breaks at the first failing layer; every layer below is outside it', () => {
  const w = trail.walk(chain({ standard: 'vague' }), 12);
  assert.equal(w.breakAt, 'standard');
  assert.deepEqual(w.checks.map((c) => c.inTrail), [true, true, false, false]);
  assert.deepEqual(w.checks.map((c) => c.status), ['ok', 'vague', 'ok', 'found']);
  const whole = trail.walk(chain(), 12);
  assert.equal(whole.breakAt, null);
  assert.deepEqual(whole.checks.map((c) => c.inTrail), [true, true, true, true]);
});

test('rule 3: a missing procedure breaks the trail even when every record is there', () => {
  const w = trail.walk(chain({ procedure: false }), 12);
  assert.equal(w.breakAt, 'procedure');
  assert.equal(w.finding.kind, 'design');
  assert.equal(w.finding.found, 12);
  assert.equal(w.checks[3].status, 'ok');
});

test('rule 4: records status with a measurable standard: ok, gaps, none', () => {
  assert.equal(trail.walk(chain(), 12).checks[3].status, 'ok');
  assert.equal(trail.walk(chain({ records: [1, 2] }), 12).checks[3].status, 'gaps');
  assert.equal(trail.walk(chain({ records: [] }), 12).checks[3].status, 'none');
});

test('rule 4: without a measurable standard there is nothing to expect: found or none, expected null', () => {
  const w = trail.walk(chain({ standard: 'missing', freq: 'quarterly', records: [3, 6] }), 12);
  assert.equal(w.checks[3].status, 'found');
  assert.equal(w.finding.expected, null);
  assert.equal(w.finding.found, 2);
  assert.deepEqual(w.finding.missing, []);
  assert.equal(w.coverage, null);
  assert.equal(trail.walk(chain({ standard: 'vague', records: [] }), 12).checks[3].status, 'none');
});

test('rule 5: every finding reason from its break', () => {
  const r = (over) => trail.walk(chain(over), 12).finding;
  assert.deepEqual([r({ policy: false }).kind, r({ policy: false }).reason], ['design', 'no-policy']);
  assert.deepEqual([r({ standard: 'missing' }).kind, r({ standard: 'missing' }).reason], ['design', 'no-standard']);
  assert.deepEqual([r({ standard: 'vague' }).kind, r({ standard: 'vague' }).reason], ['design', 'vague-standard']);
  assert.deepEqual([r({ procedure: false }).kind, r({ procedure: false }).reason], ['design', 'no-procedure']);
  assert.deepEqual([r({ records: [] }).kind, r({ records: [] }).reason], ['operation', 'not-operating']);
  assert.deepEqual([r({ records: [1] }).kind, r({ records: [1] }).reason], ['operation', 'gaps']);
  assert.deepEqual([r({}).kind, r({}).reason], ['none', null]);
});

test('rule 5: records below a missing policy are counted but do not help (no mandate)', () => {
  const full = trail.walk(chain({ policy: false }), 12).finding;
  const empty = trail.walk(chain({ policy: false, records: [] }), 12).finding;
  assert.equal(full.kind, empty.kind);
  assert.equal(full.reason, empty.reason);
  assert.equal(full.found, 12);
  assert.equal(empty.found, 0);
});

test('rule 4: a single record under a vague or missing standard is found, not none', () => {
  const w = trail.walk(chain({ standard: 'vague', freq: 'quarterly', records: [3] }), 12);
  assert.equal(w.checks[3].status, 'found');
  assert.equal(w.finding.found, 1);
  const s = at({ r1: 'vague', g1: 3 }, 4);
  assert.equal(logic.captionKey(s).key, 'cRecordsOutNoStd');
});

test('rule 4: without a measurable standard, records outside the period or not whole months are not counted', () => {
  const w = trail.walk(chain({ standard: 'missing', records: [0, 2.5, 13, 4] }), 12);
  assert.equal(w.finding.found, 1);
  assert.deepEqual(trail.inPeriod([2.5, 2], 12), [2]);
});

test('rule 5: last is the month of the last record in the period', () => {
  assert.equal(trail.walk(chain({ records: [2, 9, 4, 15] }), 12).finding.last, 9);
  assert.equal(trail.walk(chain({ records: [] }), 12).finding.last, null);
});

// ── the sim (sim.js, SPEC rules 6-10) ──

test('rule 6: params are made valid (choices, numbers, clamps to each requirement\'s periods)', () => {
  assert.deepEqual(logic.normalise({ r1: 'nope', g1: 9, r2: 'vague', g2: -3, r3: 'no-standard', g3: 12.5 }),
    { r1: 'complete', g1: 4, r2: 'vague', g2: 0, r3: 'no-standard', g3: 12 });
  assert.deepEqual(logic.normalise({ r1: 'no-procedure', g1: '2', g2: null, g3: 'x' }),
    { r1: 'no-procedure', g1: 2, r2: 'no-policy', g2: 0, r3: 'complete', g3: 3 });
  assert.equal(logic.normalise({ g1: 2.5 }).g1, 3);
  assert.equal(logic.normalise({ g1: Infinity }).g1, 4);
  assert.equal(logic.normalise({ g1: true }).g1, 4);
  assert.equal(logic.normalise({ g2: '' }).g2, 0);
  assert.equal(logic.normalise({ g3: '' }).g3, 3, 'an empty string takes the default, not 0');
  assert.equal(logic.normalise({ g3: Infinity }).g3, 3, 'Infinity takes the default, not the clamp');
  assert.equal(logic.normalise({ g3: -Infinity }).g3, 3);
  assert.equal(logic.normalise(undefined).r2, 'no-policy');
});

test('rule 7: one record per period at its last month, the last g periods without', () => {
  assert.deepEqual(logic.recordsFor('quarterly', 0), [3, 6, 9, 12]);
  assert.deepEqual(logic.recordsFor('quarterly', 1), [3, 6, 9]);
  assert.deepEqual(logic.recordsFor('monthly', 10), [1, 2]);
  assert.deepEqual(logic.recordsFor('monthly', 12), []);
});

test('rule 7: the choice changes the documents, never the records', () => {
  for (const c of logic.CHAINS) {
    const s = at({ r1: c, g1: 1 }, 0);
    assert.deepEqual(s.reqs[0].chain.records, [3, 6, 9], c);
  }
});

test('rule 8: each choice changes exactly one layer', () => {
  const base = logic.chainOf('complete', 'monthly', 0);
  assert.deepEqual([base.policy, base.standard, base.procedure], [true, 'measurable', true]);
  const diff = (c) => ['policy', 'standard', 'procedure'].filter((k) => logic.chainOf(c, 'monthly', 0)[k] !== base[k]);
  assert.deepEqual(diff('no-policy'), ['policy']);
  assert.deepEqual(diff('vague'), ['standard']);
  assert.equal(logic.chainOf('vague', 'monthly', 0).standard, 'vague');
  assert.deepEqual(diff('no-standard'), ['standard']);
  assert.equal(logic.chainOf('no-standard', 'monthly', 0).standard, 'missing');
  assert.deepEqual(diff('no-procedure'), ['procedure']);
});

test('rule 9: 16 steps; the cursor walks five stages per requirement, then the report', () => {
  assert.equal(logic.steps, 16);
  assert.deepEqual(logic.cursorAt(0), { kind: 'start', req: null, stage: null });
  assert.deepEqual(logic.cursorAt(1), { kind: 'walk', req: 0, stage: 'policy' });
  assert.deepEqual(logic.cursorAt(5), { kind: 'walk', req: 0, stage: 'finding' });
  assert.deepEqual(logic.cursorAt(6), { kind: 'walk', req: 1, stage: 'policy' });
  assert.deepEqual(logic.cursorAt(14), { kind: 'walk', req: 2, stage: 'records' });
  assert.deepEqual(logic.cursorAt(15), { kind: 'walk', req: 2, stage: 'finding' });
  assert.deepEqual(logic.cursorAt(16), { kind: 'report', req: null, stage: null });
});

test('rule 9: what has been seen and revealed follows the cursor; the records step keeps the finding hidden', () => {
  assert.deepEqual(at({}, 0).reqs.map((r) => r.seen), [0, 0, 0]);
  assert.deepEqual(at({}, 4).reqs.map((r) => [r.seen, r.revealed]), [[4, false], [0, false], [0, false]]);
  assert.deepEqual(at({}, 5).reqs.map((r) => [r.seen, r.revealed]), [[5, true], [0, false], [0, false]]);
  assert.deepEqual(at({}, 7).reqs.map((r) => r.seen), [5, 2, 0]);
  assert.deepEqual(at({}, 16).reqs.map((r) => r.revealed), [true, true, true]);
  assert.equal(at({}, 16).report, true);
  assert.equal(at({}, 15).report, false);
});

test('rule 10: report counts sum to three', () => {
  for (const pr of logic.presets) {
    const c = atPreset(pr.id, LAST).counts;
    assert.equal(c.design + c.operation + c.none, 3, pr.id);
  }
});

test('captions: every step of every preset has a caption key that exists in both tables', () => {
  const seen = new Set();
  for (const pr of logic.presets) {
    for (let n = 0; n <= LAST; n++) {
      const k = logic.captionKey(atPreset(pr.id, n));
      assert.ok(k.key in strings.hr && k.key in strings.en, `${pr.id} step ${n}: ${k.key}`);
      seen.add(k.key);
    }
  }
  // the keys the presets reach (the rest are reached through params, tested below)
  for (const k of ['cStart', 'cReport', 'cPolicyOk', 'cPolicyMissing', 'cPolicyMissingRecords', 'cStandardOk',
    'cStandardVague', 'cStandardOut', 'cProcedureOk', 'cProcedureMissing', 'cProcedureOut', 'cRecordsOk',
    'cRecordsNone', 'cRecordsGaps', 'cRecordsOut', 'cRecordsOutNoStd', 'cFindNone', 'cFindNoPolicy',
    'cFindNoMandate', 'cFindVague', 'cFindNoProcedure', 'cFindPaper', 'cFindGaps']) assert.ok(seen.has(k), k);
});

test('captions: the keys only params reach', () => {
  assert.equal(logic.captionKey(at({ r1: 'no-standard' }, 2)).key, 'cStandardMissing');
  assert.equal(logic.captionKey(at({ r1: 'no-standard' }, 5)).key, 'cFindNoStandard');
  assert.equal(logic.captionKey(at({ r1: 'vague', g1: 4 }, 4)).key, 'cRecordsOutNone');
  assert.equal(logic.captionKey(at({ r1: 'no-policy', g1: 4 }, 4)).key, 'cRecordsOut');
  assert.equal(logic.captionKey(at({ r1: 'no-policy', g1: 4 }, 1)).key, 'cPolicyMissing');
  assert.equal(logic.captionKey(at({ r1: 'no-policy', g1: 3 }, 1)).key, 'cPolicyMissingRecords');
  assert.equal(logic.captionKey(at({ r1: 'no-procedure', g1: 4 }, 5)).key, 'cFindNoProcedureNone');
  assert.equal(logic.captionKey(at({ r1: 'no-procedure', g1: 3 }, 5)).key, 'cFindNoProcedure');
});

// ── presets (SPEC table) ──

function outcome(id) {
  const s = atPreset(id, LAST);
  return s.reqs.map((r) => [r.finding.kind, r.finding.reason, r.finding.found, r.finding.expected, r.finding.last]);
}

test('preset 1 audit-day (= defaults): paper, no mandate, gaps', () => {
  assert.deepEqual(preset('audit-day').params, logic.defaults);
  assert.deepEqual(outcome('audit-day'), [
    ['operation', 'not-operating', 0, 4, null],
    ['design', 'no-policy', 12, 12, 12],
    ['operation', 'gaps', 9, 12, 9]]);
  assert.deepEqual(atPreset('audit-day', LAST).counts, { design: 1, operation: 2, none: 0 });
});

test('preset 2 whole-trail: no findings', () => {
  assert.deepEqual(outcome('whole-trail'), [
    ['none', null, 4, 4, 12], ['none', null, 12, 12, 12], ['none', null, 12, 12, 12]]);
  assert.deepEqual(atPreset('whole-trail', LAST).counts, { design: 0, operation: 0, none: 3 });
});

test('preset 3 paper: the same documents with and without records', () => {
  assert.deepEqual(outcome('paper'), [
    ['operation', 'not-operating', 0, 4, null], ['none', null, 12, 12, 12], ['operation', 'not-operating', 0, 12, null]]);
  assert.deepEqual(atPreset('paper', LAST).counts, { design: 0, operation: 2, none: 1 });
});

test('preset 4 no-mandate: twelve records or none, the same design finding', () => {
  assert.deepEqual(outcome('no-mandate'), [
    ['design', 'no-policy', 4, 4, 12], ['none', null, 12, 12, 12], ['design', 'no-policy', 0, 12, null]]);
  assert.deepEqual(atPreset('no-mandate', LAST).counts, { design: 2, operation: 0, none: 1 });
});

test('preset 5 weak: a vague standard and a missing procedure are design findings while the work is done', () => {
  assert.deepEqual(outcome('weak'), [
    ['design', 'vague-standard', 2, null, 6], ['design', 'no-procedure', 12, 12, 12], ['none', null, 12, 12, 12]]);
  assert.deepEqual(atPreset('weak', LAST).reqs[0].chain.records, [3, 6]);
  assert.deepEqual(atPreset('weak', LAST).counts, { design: 2, operation: 0, none: 1 });
});

test('preset 6 gaps: the records stop in the middle of the year', () => {
  assert.deepEqual(outcome('gaps'), [
    ['operation', 'gaps', 3, 4, 9], ['operation', 'gaps', 7, 12, 7], ['none', null, 12, 12, 12]]);
  assert.deepEqual(atPreset('gaps', LAST).reqs[1].finding.missing, [7, 8, 9, 10, 11]);
  assert.deepEqual(atPreset('gaps', LAST).counts, { design: 0, operation: 2, none: 1 });
});

test('presets: ids unique, params valid for the model, at most nine', () => {
  const ids = logic.presets.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length >= 3 && ids.length <= 9);
  for (const pr of logic.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
    assert.deepEqual(logic.normalise(pr.params), pr.params, `${pr.id} params are already valid`);
  }
});

// ── strings and the page ──

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every string key the page and the model name exists', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const keys = new Set();
  for (const m of html.matchAll(/\bt(?:\.n|\.parts)?\('([A-Za-z0-9]+)'\s*[,)]/g)) keys.add(m[1]);
  for (const r of logic.REQS) {
    const id = r.id;
    for (const l of ['Policy', 'Standard', 'Vague', 'Procedure']) keys.add(id + l);
    keys.add('req' + id.charAt(0).toUpperCase() + id.slice(1));
  }
  for (let m = 1; m <= 12; m++) keys.add('mg' + m);
  for (const k of ['noPolicy', 'noStandard', 'noProcedure', 'lPolicy', 'lStandard', 'lProcedure', 'oComplete',
    'oNoPolicy', 'oVague', 'oNoStandard', 'oNoProcedure', 'prAuditDayHint', 'rNoStandard', 'rVague', 'rNoProcedure',
    'rPaper', 'rGaps']) keys.add(k);
  for (const k of keys) assert.ok(k in strings.hr && k in strings.en, k);
});

test('the page\'s meta matches sim.json and the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.steps, logic.steps);
  assert.equal(json.steps, logic.steps);
  for (const e of json.entries) assert.ok(preset(e.preset), `entry ${e.preset} is a preset`);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const pr of logic.presets) {
    for (let n = 0; n <= LAST; n++) {
      const s = atPreset(pr.id, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P(preset('weak').params);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= LAST; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = LAST; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({});
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('the model and the trail module are pure (no DOM, randomness, clock or timers)', () => {
  for (const f of ['sim.js', 'trail.js']) {
    const src = fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.doesNotMatch(src, /\b(document|window|Math\.random|Date|setTimeout|setInterval|localStorage)\b/, f);
  }
});
