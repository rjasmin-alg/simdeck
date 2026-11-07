// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-breach-triage. Run: node --test sims/cmp-breach-triage/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the triage rules (sim.js), then the presets, then the
// copied clocks model (clocks.js, its tests copied from sims/cmp-incident-clocks/sim.test.js @ b48f936), then the
// strings and the page, then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const clocks = require('./clocks.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const preset = (id) => logic.presets.find((x) => x.id === id);
const atPreset = (id, n) => kit.stateAt(logic, P(preset(id).params), n);
const LAST = logic.steps;
const W0 = logic.WEEK0;
const H = (day, hour) => day * 24 + hour;           // hour of the reference week (day 0 = Monday 1 March 2027)
const tri = (over) => logic.triage(logic.normalise(P(over)));
const inc = (over) => Object.assign({ attack: H(0, 22), detectAfter: 9, triage: 3, significant: true, personal: true,
  reporting: 'office', week0: W0 }, over);
const byId = (tl, id) => tl.clocks.find((c) => c.id === id);

// ── tie-breaks ──

test('tie-break: a score exactly at a threshold takes the higher outcome (2 notifies, 3 informs)', () => {
  // email, confidentiality lost, small: the score is the data's points
  assert.deepEqual([tri({ case: 'email', enc: 'none', data: 'contact', people: 10 }).score, tri({ case: 'email', enc: 'none', data: 'contact', people: 10 }).level], [1, 'unlikely']);
  const two = tri({ case: 'email', enc: 'none', data: 'financial', people: 10 });
  assert.deepEqual([two.score, two.level, two.notify, two.inform], [2, 'risk', true, false]);
  const three = tri({ case: 'email', enc: 'none', data: 'special', people: 10 });
  assert.deepEqual([three.score, three.level, three.notify, three.inform], [3, 'high', true, true]);
  assert.equal(logic.RISK, 2);
  assert.equal(logic.HIGH, 3);
});

test('tie-break: exactly LARGE people (1000) counts as large-scale; 100 does not', () => {
  assert.equal(logic.LARGE, 1000);
  assert.equal(tri({ case: 'email', enc: 'none', data: 'contact', people: 1000 }).scalePts, 1);
  assert.equal(tri({ case: 'email', enc: 'none', data: 'contact', people: 1000 }).level, 'risk');
  assert.equal(tri({ case: 'email', enc: 'none', data: 'contact', people: 100 }).scalePts, 0);
  assert.equal(tri({ case: 'email', enc: 'none', data: 'contact', people: 10000 }).scalePts, 1);
});

test('tie-break: one loss left uncontained is enough; every hit loss must be contained for "unlikely"', () => {
  // ransomware: backup restored (A contained), files copied out unencrypted (C left)
  const r = tri({ case: 'ransomware', enc: 'none', recovered: true, data: 'contact', people: 10000 });
  assert.deepEqual(r.remaining, ['C']);
  assert.equal(r.score, 2);
  // laptop: encrypted with the key safe (C contained), no other copy (A left)
  const l = tri({ case: 'laptop', enc: 'safe', recovered: false, data: 'financial', people: 1000 });
  assert.deepEqual(l.remaining, ['A']);
  assert.equal(l.level, 'high');
  const both = tri({ case: 'laptop', enc: 'safe', recovered: true, data: 'special', people: 10000 });
  assert.deepEqual([both.remaining, both.score, both.level], [[], 0, 'unlikely']);
});

test('tie-break: encrypted with the key lost counts as not encrypted', () => {
  for (const c of logic.CASE_IDS) for (const d of logic.DATA_IDS) for (const n of logic.PEOPLE) for (const rec of [true, false]) {
    const lost = tri({ case: c, enc: 'lost', recovered: rec, data: d, people: n });
    const none = tri({ case: c, enc: 'none', recovered: rec, data: d, people: n });
    assert.deepEqual(lost, none, `${c} ${d} ${n} ${rec}`);
  }
  assert.equal(logic.contained('C', { enc: 'lost', recovered: true }), false);
});

test('tie-break: a control for a loss the case does not have changes nothing', () => {
  // the restore lost no confidentiality: encryption is irrelevant; the e-mail has nothing to recover
  for (const d of logic.DATA_IDS) for (const n of logic.PEOPLE) {
    assert.deepEqual(tri({ case: 'restore', enc: 'safe', recovered: false, data: d, people: n }),
      tri({ case: 'restore', enc: 'none', recovered: false, data: d, people: n }));
    assert.deepEqual(tri({ case: 'email', enc: 'none', recovered: true, data: d, people: n }),
      tri({ case: 'email', enc: 'none', recovered: false, data: d, people: n }));
  }
});

// ── the triage (sim.js, SPEC rules 1-9) ──

test('rule 1: params are made valid (unknown values take the default; people from the list only)', () => {
  assert.deepEqual(logic.normalise({}), logic.defaults);
  assert.deepEqual(logic.normalise(null), logic.defaults);
  assert.deepEqual(logic.normalise({ case: 'fax', enc: 'maybe', recovered: 'x', data: 'shoe size', people: 7 }), logic.defaults);
  assert.deepEqual(logic.normalise({ case: 'email', enc: 'lost', recovered: 'false', data: 'special', people: '10' }),
    { case: 'email', enc: 'lost', recovered: false, data: 'special', people: 10 });
  assert.equal(logic.normalise({ recovered: '0' }).recovered, false);
  assert.equal(logic.normalise({ recovered: 0 }).recovered, false);
  assert.equal(logic.normalise({ recovered: '1' }).recovered, true);
  for (const bad of [null, '', true, NaN, Infinity, 1001, 10.5, '1e3x']) assert.equal(logic.normalise({ people: bad }).people, logic.defaults.people, String(bad));
  assert.equal(logic.normalise({ people: '1e3' }).people, 1000);
});

test('rule 2: which of confidentiality, integrity and availability each case loses', () => {
  const hit = (c) => tri({ case: c }).losses.filter((l) => l.hit).map((l) => l.kind).join('');
  assert.deepEqual(logic.CASE_IDS.map(hit), ['CA', 'C', 'CA', 'IA']);
  assert.deepEqual(tri({}).losses.map((l) => l.kind), ['C', 'I', 'A']);
});

test('rule 3: encryption with the key safe contains confidentiality only; recovery contains integrity and availability only', () => {
  assert.equal(logic.contained('C', { enc: 'safe', recovered: false }), true);
  assert.equal(logic.contained('C', { enc: 'none', recovered: true }), false);
  assert.equal(logic.contained('A', { enc: 'safe', recovered: false }), false);
  assert.equal(logic.contained('A', { enc: 'none', recovered: true }), true);
  assert.equal(logic.contained('I', { enc: 'none', recovered: true }), true);
  assert.equal(logic.contained('I', { enc: 'safe', recovered: false }), false);
  const r = tri({ case: 'restore', enc: 'none', recovered: true });
  assert.deepEqual(r.losses.map((l) => [l.kind, l.hit, l.contained]), [['C', false, false], ['I', true, true], ['A', true, true]]);
});

test('rule 4: the score is the data\'s points plus one for large scale, and 0 when nothing is left', () => {
  assert.deepEqual(logic.DATA, { contact: 1, financial: 2, special: 3 });
  for (const d of logic.DATA_IDS) for (const n of logic.PEOPLE) {
    const t = tri({ case: 'email', enc: 'none', data: d, people: n });
    assert.equal(t.score, logic.DATA[d] + (n >= 1000 ? 1 : 0), `${d} ${n}`);
    assert.equal(t.dataPts + t.scalePts, t.score);
    const z = tri({ case: 'email', enc: 'safe', data: d, people: n });
    assert.deepEqual([z.score, z.dataPts, z.scalePts], [0, 0, 0]);
  }
});

test('rule 5 and 6: level from the score; record always, notify from "risk", inform only at "high"', () => {
  const want = { 0: ['unlikely', 'record'], 1: ['unlikely', 'record'], 2: ['risk', 'notify'], 3: ['high', 'inform'], 4: ['high', 'inform'] };
  let seen = new Set();
  for (const c of logic.CASE_IDS) for (const e of logic.ENC) for (const rec of [true, false]) for (const d of logic.DATA_IDS) for (const n of logic.PEOPLE) {
    const t = tri({ case: c, enc: e, recovered: rec, data: d, people: n });
    assert.deepEqual([t.level, logic.decisionOf(t)], want[t.score]);
    assert.equal(t.record, true);
    assert.equal(t.notify, t.score >= 2);
    assert.equal(t.inform, t.score >= 3);
    assert.ok(!t.inform || t.notify, 'whoever informs also notifies');
    seen.add(t.score);
  }
  assert.deepEqual([...seen].sort(), [0, 1, 2, 3, 4]);
});

test('rule 6: the GDPR clock runs only when the breach is notified: 72 h from awareness, prepared in office hours', () => {
  const s = atPreset('laptop-key-lost', LAST);
  assert.deepEqual(s.clock, { attack: H(3, 19), detected: H(4, 8), aware: H(4, 10), running: true, due: H(7, 10),
    filed: H(4, 13), inTime: true, spare: 69, late: 0 });
  const r = atPreset('laptop-encrypted', LAST).clock;
  assert.deepEqual([r.running, r.due, r.filed, r.aware], [false, null, null, H(4, 10)]);
  for (const c of logic.CASE_IDS) {
    const k = logic.clockOf(logic.normalise({ case: c }), true);
    assert.equal(k.due, k.aware + 72, c);
    assert.equal(k.inTime, true, c);
  }
});

test('rule 7: 7 steps; outcomes appear at their own step; losses turn contained when their question is asked', () => {
  assert.equal(logic.steps, 7);
  assert.deepEqual(logic.STAGES, ['case', 'breach', 'conf', 'avail', 'risk', 'notify', 'inform', 'summary']);
  const st = (n) => { const s = atPreset('laptop-encrypted', n); return [s.losses.map((l) => l.status).join(','), s.outcome.record, s.outcome.notify, s.outcome.inform]; };
  assert.deepEqual([...Array(LAST + 1).keys()].map(st), [
    ['unknown,none,unknown', null, null, null],
    ['lost,none,lost', true, null, null],
    ['contained,none,lost', true, null, null],
    ['contained,none,contained', true, null, null],
    ['contained,none,contained', true, null, null],
    ['contained,none,contained', true, false, null],
    ['contained,none,contained', true, false, false],
    ['contained,none,contained', true, false, false]]);
  // an uncontained loss stays lost
  assert.deepEqual(atPreset('laptop-key-lost', LAST).losses.map((l) => l.status), ['lost', 'none', 'contained']);
  assert.deepEqual(atPreset('laptop-key-lost', LAST).outcome, { record: true, notify: true, inform: true });
  // steps out of range or fractional are clamped and rounded
  assert.equal(logic.step(null, -3, P({})).stage, 'case');
  assert.equal(logic.step(null, 99, P({})).stage, 'summary');
  assert.equal(logic.step(null, 2.4, P({})).stage, 'conf');
  assert.equal(logic.step(null, 'x', P({})).stage, 'case');
  assert.equal(at({}, 7).report, true);
  assert.equal(at({}, 6).report, false);
});

test('rule 8: the counterfactuals: the same case with neither control and with both', () => {
  const s = atPreset('laptop-encrypted', LAST);
  assert.deepEqual(s.without, { score: 3, level: 'high', decision: 'inform' });
  assert.deepEqual(s.withBoth, { score: 0, level: 'unlikely', decision: 'record' });
  // with both controls every case is only recorded; without them never better than with the chosen ones
  const rank = { record: 0, notify: 1, inform: 2 };
  for (const c of logic.CASE_IDS) for (const e of logic.ENC) for (const rec of [true, false]) for (const d of logic.DATA_IDS) for (const n of logic.PEOPLE) {
    const x = at({ case: c, enc: e, recovered: rec, data: d, people: n }, LAST);
    assert.equal(x.withBoth.decision, 'record');
    assert.ok(rank[x.without.decision] >= rank[x.decision]);
  }
});

test('rule 9: caption keys at every step (sequence for the default) and the branches', () => {
  const keys = [...Array(LAST + 1).keys()].map((n) => logic.captionKeys(at({}, n)));
  assert.deepEqual(keys, [['cCaseLaptop'], ['cBreach'], ['cConfSafe'], ['cAvailBack'], ['cRiskContained'], ['cNotifyNo'],
    ['cInformNo'], ['cSumRecord', 'cSumWithout']]);
  assert.deepEqual(logic.captionKeys(atPreset('laptop-key-lost', 2)), ['cConfLost']);
  assert.deepEqual(logic.captionKeys(atPreset('wrong-email', 2)), ['cConfPlain']);
  assert.deepEqual(logic.captionKeys(atPreset('wrong-email', 3)), ['cAvailNone']);
  assert.deepEqual(logic.captionKeys(atPreset('restore', 2)), ['cConfNone']);
  assert.deepEqual(logic.captionKeys(atPreset('restore', 3)), ['cAvailGone']);
  assert.deepEqual(logic.captionKeys(atPreset('restore', 4)), ['cRiskScore', 'cRiskUnlikely']);
  assert.deepEqual(logic.captionKeys(atPreset('wrong-email', 4)), ['cRiskScore', 'cRiskRisk']);
  assert.deepEqual(logic.captionKeys(atPreset('sick-note', 4)), ['cRiskScore', 'cRiskHigh']);
  assert.deepEqual(logic.captionKeys(atPreset('wrong-email', 5)), ['cNotifyYes']);
  assert.deepEqual(logic.captionKeys(atPreset('wrong-email', 6)), ['cInformNoHigh']);
  assert.deepEqual(logic.captionKeys(atPreset('sick-note', 6)), ['cInformYes']);
  assert.deepEqual(logic.captionKeys(atPreset('restore', 6)), ['cInformNo']);
  assert.deepEqual(logic.captionKeys(atPreset('laptop-key-lost', LAST)), ['cSumInform', 'cSumWith']);
  assert.deepEqual(logic.captionKeys(atPreset('wrong-email', LAST)), ['cSumNotify', 'cSumWith']);
  assert.deepEqual(logic.captionKeys(atPreset('restore', LAST)), ['cSumRecord']);
  // mixed: one control on, one off: the loss left scores the same as two, so only "with both" differs
  assert.deepEqual(logic.captionKeys(at({ case: 'laptop', enc: 'safe', recovered: false, data: 'contact', people: 1000 }, LAST)),
    ['cSumNotify', 'cSumWith']);
  // so the two counterfactual sentences never come together (SPEC rule 8)
  for (const c of logic.CASE_IDS) for (const e of logic.ENC) for (const rec of [true, false]) for (const d of logic.DATA_IDS) for (const n of logic.PEOPLE) {
    const k = logic.captionKeys(at({ case: c, enc: e, recovered: rec, data: d, people: n }, LAST));
    assert.ok(!(k.includes('cSumWithout') && k.includes('cSumWith')));
  }
  for (const c of logic.CASE_IDS) assert.deepEqual(logic.captionKeys(at({ case: c }, 0)), ['cCase' + c[0].toUpperCase() + c.slice(1)]);
});

test('captions: every key the model can name exists in both tables, and every caption string is reachable', () => {
  const seen = new Set();
  for (const c of logic.CASE_IDS) for (const e of logic.ENC) for (const rec of [true, false]) for (const d of logic.DATA_IDS) for (const n of logic.PEOPLE) {
    for (let k = 0; k <= LAST; k++) for (const key of logic.captionKeys(at({ case: c, enc: e, recovered: rec, data: d, people: n }, k))) seen.add(key);
  }
  for (const k of seen) assert.ok(k in strings.hr && k in strings.en, k);
  const all = Object.keys(strings.hr).filter((k) => /^c[A-Z]/.test(k));
  assert.deepEqual(all.filter((k) => !seen.has(k)), [], 'every caption string is reachable');
});

test('rule 8: "without" turns both controls off, whichever the case uses', () => {
  assert.deepEqual(at({ case: 'email', enc: 'safe', recovered: false, data: 'financial', people: 10 }, LAST).without, { score: 2, level: 'risk', decision: 'notify' });
  const r = at({ case: 'restore', enc: 'none', recovered: true, data: 'special', people: 10 }, LAST);
  assert.deepEqual(r.without, { score: 3, level: 'high', decision: 'inform' });
  assert.deepEqual(logic.captionKeys(r), ['cSumRecord', 'cSumWithout']);
});

test('rule 7: fractional steps round half up; the state\'s n is the clamped step', () => {
  assert.equal(logic.step(null, 2.5, P({})).stage, 'avail');
  assert.equal(logic.step(null, 2.6, P({})).stage, 'avail');
  assert.equal(logic.step(null, 99, P({})).n, LAST);
  assert.equal(logic.step(null, -3, P({})).n, 0);
});

test('rule 7: integrity and availability turn contained at the availability step (restore)', () => {
  const st = (n) => at({ case: 'restore', enc: 'none', recovered: true }, n).losses.map((l) => l.status);
  assert.deepEqual([1, 2, 3, 4].map(st), [['none', 'lost', 'lost'], ['none', 'lost', 'lost'], ['none', 'contained', 'contained'], ['none', 'contained', 'contained']]);
});

test('fixed data: event and awareness per case (SPEC table); the people list', () => {
  const ev = logic.CASE_IDS.map((c) => { const k = at({ case: c }, 0).clock; return [k.attack, k.aware]; });
  assert.deepEqual(ev, [[H(3, 19), H(4, 10)], [H(1, 10), H(1, 12)], [H(5, 2), H(5, 13)], [H(2, 14), H(2, 16)]]);
  assert.deepEqual(logic.PEOPLE, [1, 10, 100, 1000, 10000]);
});

// ── presets (SPEC table) ──

const outcome = (id) => {
  const s = atPreset(id, LAST);
  return { left: s.remaining.join(''), score: s.score, decision: s.decision, aware: s.clock.aware, due: s.clock.due,
    filed: s.clock.filed, without: s.without.decision, withBoth: s.withBoth.decision };
};

test('preset 1 laptop-encrypted (= defaults, the entry): only recorded; without the controls the people are informed', () => {
  assert.deepEqual(preset('laptop-encrypted').params, logic.defaults);
  assert.deepEqual(outcome('laptop-encrypted'), { left: '', score: 0, decision: 'record', aware: H(4, 10), due: null,
    filed: null, without: 'inform', withBoth: 'record' });
});

test('preset 2 laptop-key-lost: the same laptop with the password in the bag: notify and inform', () => {
  assert.deepEqual(outcome('laptop-key-lost'), { left: 'C', score: 3, decision: 'inform', aware: H(4, 10), due: H(7, 10),
    filed: H(4, 13), without: 'inform', withBoth: 'record' });
});

test('preset 3 wrong-email: ten people\'s salaries to the wrong recipient: notify', () => {
  assert.deepEqual(outcome('wrong-email'), { left: 'C', score: 2, decision: 'notify', aware: H(1, 12), due: H(4, 12),
    filed: H(1, 15), without: 'notify', withBoth: 'record' });
});

test('preset 4 sick-note: one person\'s health data to the wrong recipient: inform', () => {
  assert.deepEqual(outcome('sick-note'), { left: 'C', score: 3, decision: 'inform', aware: H(1, 12), due: H(4, 12),
    filed: H(1, 15), without: 'inform', withBoth: 'record' });
});

test('preset 5 ransomware: the backup brings the files back, the copied data stays out: notify', () => {
  assert.deepEqual(outcome('ransomware'), { left: 'C', score: 2, decision: 'notify', aware: H(5, 13), due: H(8, 13),
    filed: H(7, 11), without: 'notify', withBoth: 'record' });
});

test('preset 6 restore: two days of contact entries lost: recorded, not notified', () => {
  assert.deepEqual(outcome('restore'), { left: 'IA', score: 1, decision: 'record', aware: H(2, 16), due: null,
    filed: null, without: 'record', withBoth: 'record' });
});

test('presets: ids unique, params valid for the model, 3 to 9; every outcome and every case shown at least once', () => {
  const ids = logic.presets.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length >= 3 && ids.length <= 9);
  for (const pr of logic.presets) {
    assert.deepEqual(Object.keys(pr.params).sort(), Object.keys(logic.defaults).sort(), pr.id);
    assert.deepEqual(logic.normalise(pr.params), pr.params, `${pr.id} params are already valid`);
  }
  assert.deepEqual([...new Set(ids.map((id) => atPreset(id, LAST).decision))].sort(), ['inform', 'notify', 'record']);
  assert.deepEqual([...new Set(logic.presets.map((x) => x.params.case))].sort(), [...logic.CASE_IDS].sort());
});

// ── the copied clocks model (clocks.js; tests from sims/cmp-incident-clocks/sim.test.js @ b48f936) ──

test('tie-break: a report filed exactly at its deadline is in time (late 0, spare 0)', () => {
  const tl = clocks.timeline(inc({ reporting: 'oncall', prep: { ew: 24, notif: 48, gdpr: 1 } }));
  const ew = byId(tl, 'ew'), no = byId(tl, 'notif');
  assert.equal(ew.filed, ew.due);
  assert.equal(ew.inTime, true);
  assert.equal(ew.late, 0);
  assert.equal(ew.spare, 0);
  assert.equal(no.filed, no.due);
  assert.equal(no.inTime, true);
  const one = clocks.timeline(inc({ reporting: 'oncall', prep: { ew: 25, notif: 1, gdpr: 1 } }));
  assert.equal(byId(one, 'ew').inTime, false);
  assert.equal(byId(one, 'ew').late, 1);
});

test('tie-break: equal deadlines (72 h): the NIS2 notification is prepared before the GDPR one', () => {
  const tl = clocks.timeline(inc({ attack: H(4, 17), detectAfter: 1, triage: 2 }));
  assert.equal(byId(tl, 'notif').due, byId(tl, 'gdpr').due);
  assert.ok(byId(tl, 'notif').filed < byId(tl, 'gdpr').filed);
  assert.deepEqual(tl.work.map((w) => w.id), ['ew', 'notif', 'gdpr']);
  assert.equal(tl.work[2].from, byId(tl, 'notif').filed);
});

test('tie-break: office hours are the slots 08:00 to 16:00; the 16:00 slot is not worked', () => {
  assert.equal(clocks.isWorking(H(0, 8), 'office'), true);
  assert.equal(clocks.isWorking(H(0, 15), 'office'), true);
  assert.equal(clocks.isWorking(H(0, 16), 'office'), false);
  assert.equal(clocks.isWorking(H(0, 7), 'office'), false);
  assert.equal(clocks.work(H(1, 15), 1, 'office').done, H(1, 16));    // aware 15:00: filed 16:00 the same day
  assert.equal(clocks.work(H(1, 16), 1, 'office').done, H(2, 9));     // aware 16:00: filed 09:00 the next day
});

test('tie-break: one month later on a day the month lacks is its last day', () => {
  assert.deepEqual(clocks.addMonths(2027, 1, 31, 1), { y: 2027, m: 2, d: 28 });
  assert.deepEqual(clocks.addMonths(2028, 1, 31, 1), { y: 2028, m: 2, d: 29 });
  assert.deepEqual(clocks.addMonths(2027, 3, 31, 1), { y: 2027, m: 4, d: 30 });
  assert.deepEqual(clocks.addMonths(2027, 12, 15, 1), { y: 2028, m: 1, d: 15 });
  assert.deepEqual(clocks.addMonths(2027, 3, 8, 1), { y: 2027, m: 4, d: 8 });
});

test('clocks rule 1: calendar: the reference Monday, day numbers both ways, weekdays', () => {
  const c = clocks.civil(W0);
  assert.deepEqual(c, { y: 2027, m: 3, d: 1, wd: 0 });
  assert.equal(clocks.civil(0).wd, 3);                     // 1970-01-01 was a Thursday
  for (const dn of [0, 59, 10956, 20780, W0, W0 + 400]) {
    const x = clocks.civil(dn);
    assert.equal(clocks.dayNumber(x.y, x.m, x.d), dn);
  }
  assert.deepEqual(clocks.moment(H(4, 20), W0), { day: 4, hour: 20, wd: 4, y: 2027, m: 3, d: 5 });
  assert.equal(clocks.daysIn(2027, 2), 28);
  assert.equal(clocks.daysIn(2000, 2), 29);
  assert.equal(clocks.daysIn(1900, 2), 28);
  assert.deepEqual(clocks.moment(-1, W0), { day: -1, hour: 23, wd: 6, y: 2027, m: 2, d: 28 });
  assert.throws(() => clocks.timeline(inc({ week0: W0 + 1 })), /Monday/);
});

test('clocks rule 2: on call works every hour; office hours skip nights and weekends; an unknown mode throws', () => {
  for (let h = 0; h < 7 * 24; h++) assert.equal(clocks.isWorking(h, 'oncall'), true);
  assert.equal(clocks.isWorking(H(5, 10), 'office'), false);
  assert.equal(clocks.isWorking(H(6, 10), 'office'), false);
  assert.equal(clocks.isWorking(H(7, 10), 'office'), true);      // the next Monday
  let n = 0;
  for (let h = 0; h < 7 * 24; h++) if (clocks.isWorking(h, 'office')) n++;
  assert.equal(n, 40);
  assert.throws(() => clocks.isWorking(0, 'weekdays'));
  assert.throws(() => clocks.timeline(inc({ reporting: 'weekdays', significant: false, personal: false })));
});

test('clocks rule 3: work fills worked slots from the start, merges runs, spans the weekend; zero work is done at once', () => {
  const w = clocks.work(H(4, 14), 4, 'office');                  // Friday 14:00, four hours
  assert.deepEqual(w.slots, [{ from: H(4, 14), to: H(4, 16) }, { from: H(7, 8), to: H(7, 10) }]);
  assert.equal(w.done, H(7, 10));
  assert.deepEqual(clocks.work(H(4, 14), 0, 'office'), { done: H(4, 14), slots: [] });
  assert.equal(clocks.work(H(5, 3), 3, 'oncall').done, H(5, 6));
});

test('clocks rule 4: detection is attack + delay, awareness is detection + triage; the clocks start at awareness', () => {
  const tl = clocks.timeline(inc({ attack: H(2, 3), detectAfter: 126, triage: 3 }));
  assert.equal(tl.detected, H(7, 9));
  assert.equal(tl.aware, H(7, 12));
  for (const id of ['ew', 'notif', 'gdpr']) assert.equal(byId(tl, id).start, tl.aware);
  // the same awareness after a short or a long undetected attack gives the same clocks
  const a = clocks.timeline(inc({ attack: H(7, 8), detectAfter: 1, triage: 3 }));
  assert.deepEqual(a.clocks, tl.clocks);
  assert.notEqual(a.attack, tl.attack);
});

test('clocks rule 5: deadlines: 24 h and 72 h from awareness, through nights and weekends', () => {
  const tl = clocks.timeline(inc({ attack: H(4, 17), detectAfter: 1, triage: 2 }));   // aware Friday 20:00
  assert.equal(byId(tl, 'ew').due, H(5, 20));              // Saturday 20:00
  assert.equal(byId(tl, 'notif').due, H(7, 20));           // Monday 20:00
  assert.equal(byId(tl, 'gdpr').due, H(7, 20));
});

test('clocks rule 5: the final report is due one calendar month after the notification was filed, same hour', () => {
  const tl = clocks.timeline(inc({ attack: H(0, 22), detectAfter: 9, triage: 3 }));
  const no = byId(tl, 'notif'), fin = byId(tl, 'final');
  assert.equal(fin.start, no.filed);
  const m = clocks.moment(fin.due, W0);
  assert.deepEqual([m.y, m.m, m.d, m.hour], [2027, 4, 2, 14]);
  assert.equal(fin.filed, null);
  assert.equal(fin.inTime, null);
});

test('clocks rule 5: a late notification moves the final report\'s deadline with it', () => {
  const late = clocks.timeline(inc({ attack: H(0, 22), detectAfter: 9, triage: 3, reporting: 'oncall', prep: { ew: 1, notif: 100, gdpr: 1 } }));
  const no = byId(late, 'notif');
  assert.equal(no.inTime, false);
  const m = clocks.moment(byId(late, 'final').start, W0), d = clocks.moment(byId(late, 'final').due, W0);
  assert.equal(byId(late, 'final').start, no.filed);
  assert.deepEqual([d.m, d.d, d.hour], [m.m + 1, m.d, m.hour]);
});

test('clocks rule 6: which clocks run: NIS2 for a significant incident, GDPR when personal data is affected', () => {
  const run = (significant, personal) => clocks.timeline(inc({ significant, personal })).clocks.map((c) => c.running);
  assert.deepEqual(run(true, true), [true, true, true, true]);
  assert.deepEqual(run(true, false), [true, true, true, false]);
  assert.deepEqual(run(false, true), [false, false, false, true]);
  assert.deepEqual(run(false, false), [false, false, false, false]);
  const none = clocks.timeline(inc({ significant: false, personal: false }));
  assert.equal(none.lastFiled, null);
  assert.deepEqual(none.work, []);
  assert.deepEqual(clocks.CLOCKS.map((c) => c.id), ['ew', 'notif', 'final', 'gdpr']);
});

test('clocks rule 7: one queue in clock order; each report starts when the one before is filed; GDPR alone starts at awareness', () => {
  const tl = clocks.timeline(inc());                        // aware Tuesday 10:00, office hours
  assert.deepEqual([byId(tl, 'ew').filed, byId(tl, 'notif').filed, byId(tl, 'gdpr').filed], [H(1, 11), H(1, 14), H(2, 9)]);
  const only = clocks.timeline(inc({ significant: false }));
  assert.equal(only.work[0].from, only.aware);
  assert.equal(byId(only, 'gdpr').filed, H(1, 13));
  assert.equal(only.lastFiled, H(1, 13));
  const slow = clocks.timeline(inc({ prep: { ew: 1, notif: 30, gdpr: 2 } }));
  assert.equal(slow.lastFiled, byId(slow, 'gdpr').filed);
  assert.ok(slow.lastFiled > byId(slow, 'ew').filed);
});

test('clocks rule 8: in time, late and spare; met and missed count the hour clocks only', () => {
  const tl = clocks.timeline(inc({ attack: H(4, 17), detectAfter: 1, triage: 2 }));
  const ew = byId(tl, 'ew');
  assert.deepEqual([ew.inTime, ew.late, ew.spare, ew.filed], [false, 37, 0, H(7, 9)]);
  assert.deepEqual([byId(tl, 'notif').spare, byId(tl, 'gdpr').spare], [8, 5]);
  assert.equal(tl.met, 2);
  assert.equal(tl.missed, 1);
  assert.equal(tl.ghost.due, H(5, 17));
  assert.equal(tl.ghost.beforeDetect, -23);
});

test('clocks rule 8 (claims in SPEC): on call meets every deadline; in office hours only the early warning can be missed', () => {
  let missedEw = 0;
  for (let a = 0; a < 7 * 24; a++) {
    for (const triage of [1, 6, 24]) {
      const on = clocks.timeline(inc({ attack: a, detectAfter: 0, triage, reporting: 'oncall' }));
      assert.equal(on.missed, 0, `on call, attack ${a}`);
      const off = clocks.timeline(inc({ attack: a, detectAfter: 0, triage }));
      assert.equal(byId(off, 'notif').inTime, true, `office notif, attack ${a}`);
      assert.equal(byId(off, 'gdpr').inTime, true, `office gdpr, attack ${a}`);
      if (!byId(off, 'ew').inTime) missedEw++;
    }
  }
  assert.ok(missedEw > 0);
});
// ── strings and the page ──

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every string key the page names exists', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const keys = new Set();
  for (const m of html.matchAll(/\bt(?:\.n|\.parts|\.html)?\('([A-Za-z0-9]+)'\s*[,)]/g)) keys.add(m[1]);
  const cap = (x) => x[0].toUpperCase() + x.slice(1);
  for (let i = 0; i < 7; i++) keys.add('wd' + i);
  for (let i = 1; i <= 12; i++) keys.add('mo' + i);
  for (const c of logic.CASE_IDS) for (const k of ['case', 'what']) keys.add(k + cap(c));
  for (const c of logic.CASE_IDS) {
    if (logic.CASES[c].losses.includes('C')) keys.add('enc' + cap(c));
    if (logic.CASES[c].losses.some((k) => k !== 'C')) keys.add('rec' + cap(c));
  }
  for (const k of logic.KINDS) { keys.add('kind' + k); }
  keys.add('peopleN'); keys.add('peopleAcc');
  for (const k of ['stNone', 'stUnknown', 'stLost', 'stContained', 'bRecorded', 'bYes', 'bNo', 'bPending']) keys.add(k);
  for (const d of logic.DATA_IDS) { keys.add('data' + cap(d)); keys.add('dataS' + cap(d)); }
  for (const e of logic.ENC) keys.add('oEnc' + cap(e));
  for (const l of ['unlikely', 'risk', 'high']) keys.add('lvl' + cap(l));
  for (const o of ['record', 'notify', 'inform']) { keys.add('out' + cap(o)); keys.add('out' + cap(o) + 'Sub'); keys.add('dec' + cap(o)); }
  for (const z of ['zRecord', 'zNotify', 'zInform']) keys.add(z);
  for (const pr of logic.presets) { const k = 'pr' + pr.id.split('-').map(cap).join(''); keys.add(k); keys.add(k + 'Hint'); }
  for (const k of keys) assert.ok(k in strings.hr && k in strings.en, k);
});

test('the page\'s meta matches sim.json and the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.steps, logic.steps);
  assert.equal(json.steps, logic.steps);
  assert.deepEqual(meta.title, json.title);
  assert.deepEqual(meta.concept, json.concept);
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
  const p = P(preset('laptop-key-lost').params);
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

test('the model and the clocks module are pure (no DOM, randomness, clock or timers)', () => {
  for (const f of ['sim.js', 'clocks.js']) {
    const src = fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.doesNotMatch(src, /\b(document|window|Math\.random|Date|setTimeout|setInterval|localStorage)\b/, f);
  }
});
