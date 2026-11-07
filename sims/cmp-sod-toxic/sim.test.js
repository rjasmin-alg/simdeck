// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-sod-toxic. Run: node --test sims/cmp-sod-toxic/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules in order (duties and conflicts in sod.js,
// then the page's model in sim.js), the presets, and the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const D = require('./sod.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const bits = (...ds) => ds.reduce((m, d) => m | (1 << d), 0);
const DEPTS = (n) => D.team(n).map((x) => x.dept);
const { REQUEST, APPROVE, CREATE, PAY, CODE, DEPLOY, BACKUPS, LOGS } = D;
/** Params with the student's masks for the first people. */
const EDIT = (team, list, over) => {
  const p = { team, edit: true };
  for (let i = 0; i < 12; i++) { p['m' + i] = 0; p['r' + i] = 0; }
  list.forEach((m, i) => { p['m' + i] = m; });
  return P(Object.assign(p, over));
};

// ── tie-breaks first ──

test('rule 6: sharing out: fewest duties first, ties by id', () => {
  // n = 6: request → 0 (all office at 0 duties, lowest id); approve → 2 (not holding request, lowest id);
  // create → 4 (only office person still at 0); pay → 0 (0 and 2 tie at one duty, 0 holds no create; lowest id)
  const m = D.share(6, false);
  assert.ok(D.has(m[0], REQUEST) && D.has(m[2], APPROVE) && D.has(m[4], CREATE) && D.has(m[0], PAY));
  assert.ok(D.has(m[1], CODE) && D.has(m[3], DEPLOY) && D.has(m[5], BACKUPS));
  // logs: everyone not holding backups, nobody in conflict, one duty each except person 0 (two): lowest id = 1
  assert.ok(D.has(m[1], LOGS));
  assert.deepEqual(m, [9, 144, 2, 32, 4, 64]);
});

test('rule 6: the logs go to someone without a conflict before fewer duties', () => {
  // n = 3: person 1 (IT) is in conflict (code + deploy) and holds the backups, so the logs go to the office;
  // persons 0 and 2 tie at two duties: lowest id
  const m = D.share(3, false);
  assert.deepEqual(m, [133, 112, 10]);
  // n = 6 with deputies: persons 0 and 1 are in conflict, so the logs go to office persons 2 and 4
  const c = D.share(6, true);
  assert.ok(D.has(c[2], LOGS) && D.has(c[4], LOGS));
  assert.ok(!D.has(c[0], LOGS) && !D.has(c[1], LOGS));
  // n = 7 with deputies: persons 0, 1 and 2 all hold two duties; by id person 1 would come before person 2, but
  // person 1 is in conflict (code + deploy), so the logs go to persons 0 and 2 and person 1's control holds
  const s = D.share(7, true);
  assert.deepEqual(s, [133, 48, 133, 80, 10, 96, 10]);
  assert.deepEqual(D.conflicts(s), [{ person: 1, pair: 2 }]);
  assert.equal(D.control(s, 1, 2).ok, true);
});

test('rule 6: an unavoidable overlap falls on someone already in conflict, so every control can hold', () => {
  // n = 6 with deputies: the purchases overlap goes to person 0 (no conflicts yet: fewest duties, then id); the
  // suppliers overlap to person 0 again (already in conflict) rather than a less busy colleague
  const m = D.share(6, true);
  assert.deepEqual(m, [15, 48, 133, 80, 138, 96]);
  assert.deepEqual(D.conflicts(m), [{ person: 0, pair: 0 }, { person: 0, pair: 1 }, { person: 1, pair: 2 }]);
  for (const c of D.conflicts(m)) assert.equal(D.control(m, c.person, c.pair).ok, true);
  for (const n of [5, 6, 7]) {
    const s = D.share(n, true);
    for (const c of D.conflicts(s)) assert.equal(D.control(s, c.person, c.pair).ok, true, `n ${n}`);
  }
});

test('rule 7: split moves the second duty first, to the taker with the fewest duties, ties by id', () => {
  // person 0 holds request + approve; office persons 2 and 4 hold nothing: approve goes to 2 (tie, lowest id)
  const m = [bits(REQUEST, APPROVE), 0, 0, 0, 0, 0];
  const r = D.split(m, 0, 0, DEPTS(6));
  assert.deepEqual([r.duty, r.to], [APPROVE, 2]);
  assert.deepEqual(r.masks, [bits(REQUEST), 0, bits(APPROVE), 0, 0, 0]);
  // with person 2 busier than 4, 4 takes it
  const m2 = [bits(REQUEST, APPROVE), 0, bits(CREATE), 0, 0, 0];
  assert.equal(D.split(m2, 0, 0, DEPTS(6)).to, 4);
  // a candidate holding either duty of the pair is skipped: 2 holds request, so 4 takes approve
  const m3 = [bits(REQUEST, APPROVE), 0, bits(REQUEST), 0, 0, 0];
  assert.equal(D.split(m3, 0, 0, DEPTS(6)).to, 4);
});

test('rule 7: when nobody can take the second duty, the first moves', () => {
  // backups + logs held by IT person 1 in a team of 3: backups is IT-only (nobody else), logs anyone: logs is
  // the second duty and goes to the office person with fewer duties
  const m = [bits(REQUEST, CREATE), bits(CODE, BACKUPS, LOGS), bits(APPROVE)];
  const r = D.split(m, 1, 3, DEPTS(3));
  assert.deepEqual([r.duty, r.to], [LOGS, 2]);
  // the logs taken by both office people already? Then nobody can take logs, and backups has no other IT person
  const m2 = [bits(LOGS), bits(BACKUPS, LOGS), bits(LOGS)];
  assert.equal(D.split(m2, 1, 3, DEPTS(3)), null);
  // the first duty moves when the second cannot: code + deploy, n = 4, person 3 holds deploy already
  const m3 = [0, bits(CODE, DEPLOY), 0, bits(DEPLOY)];
  const r3 = D.split(m3, 1, 2, DEPTS(4));
  assert.equal(r3, null, 'person 3 holds deploy, a half of the pair: cannot take code either');
  const m4 = [0, bits(CODE, DEPLOY), 0, bits(BACKUPS)];
  assert.deepEqual(D.split(m4, 1, 2, DEPTS(4)).to, 3);
});

test('rule 8: the reviewer is the first by id; "logs" wins over "no reviewer"', () => {
  const m = [bits(REQUEST), bits(CODE, DEPLOY), 0, 0];
  assert.deepEqual(D.control(m, 1, 2), { ok: true, why: null, reviewer: 0 });
  const m2 = [bits(CODE), bits(CODE, DEPLOY, LOGS), bits(DEPLOY)];
  assert.deepEqual(D.control(m2, 1, 2), { ok: false, why: 'logs', reviewer: null });
});

test('rule 4: conflicts by person, then pair', () => {
  const m = [bits(CREATE, PAY, REQUEST, APPROVE), bits(CODE, DEPLOY), 0];
  assert.deepEqual(D.conflicts(m), [{ person: 0, pair: 0 }, { person: 0, pair: 1 }, { person: 1, pair: 2 }]);
});

// ── rules in order ──

test('rule 1: eight duties, four forbidden pairs (2k, 2k + 1), every other pair allowed', () => {
  assert.equal(D.DUTIES, 8);
  assert.deepEqual(D.RULES, [[0, 1], [2, 3], [4, 5], [6, 7]]);
  for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) {
    const k = D.pairOf(a, b);
    if (a !== b && a >> 1 === b >> 1) assert.equal(k, a >> 1, `${a},${b}`);
    else assert.equal(k, -1, `${a},${b}`);
  }
});

test('rule 2: office, IT, office …; money duties office only, production IT only, logs anyone', () => {
  assert.deepEqual(D.team(5).map((x) => x.dept), [0, 1, 0, 1, 0]);
  for (let d = 0; d < 8; d++) {
    assert.equal(D.eligible(D.OFFICE, d), d < 4 || d === LOGS, `office ${d}`);
    assert.equal(D.eligible(D.IT, d), d >= 4, `IT ${d}`);
  }
  assert.equal(D.eligibleMask(D.OFFICE), bits(0, 1, 2, 3, 7));
  assert.equal(D.eligibleMask(D.IT), bits(4, 5, 6, 7));
});

test('rule 3: holders and short duties (one, or two with deputies), in duty order', () => {
  const m = [bits(REQUEST, APPROVE), bits(CODE), bits(REQUEST)];
  assert.deepEqual(D.holders(m), [2, 1, 0, 0, 1, 0, 0, 0]);
  assert.deepEqual(D.uncovered(m, false).map((x) => x.duty), [2, 3, 5, 6, 7]);
  assert.deepEqual(D.uncovered(m, true).map((x) => [x.duty, x.have]), [[1, 1], [2, 0], [3, 0], [4, 1], [5, 0], [6, 0], [7, 0]]);
  assert.equal(D.need(false), 1);
  assert.equal(D.need(true), 2);
});

test('rule 4: the matrix counts people holding both; the diagonal counts holders', () => {
  const m = [bits(REQUEST, APPROVE, LOGS), bits(CODE, LOGS), bits(REQUEST, APPROVE)];
  const x = D.matrix(m);
  assert.equal(x[1][0], 2);
  assert.equal(x[0][1], 2);
  assert.equal(x[7][7], 2);
  assert.equal(x[7][4], 1);
  assert.equal(x[5][4], 0);
  assert.equal(x[0][0], 2);
});

test('rule 5: the fewest conflicts by team size, SPEC table', () => {
  const one = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => D.minimum(n, false).total);
  const two = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => D.minimum(n, true).total);
  assert.deepEqual(one, [1, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(two, [5, 6, 4, 3, 1, 0, 0, 0, 0, 0]);
  assert.equal(D.minimum(3, true).short, 3);
  assert.equal(D.minimum(4, true).short, 0);
  assert.deepEqual(D.minimum(6, true).perPair, [1, 1, 1, 0]);
});

test('rule 5: the minimum is a floor: no random assignment with full cover beats it', () => {
  const r = kit.rng(7);
  for (const dep of [false, true]) for (let n = 3; n <= 8; n++) {
    const min = D.minimum(n, dep);
    for (let k = 0; k < 400; k++) {
      const m = D.team(n).map((x) => Math.floor(r() * 256) & D.eligibleMask(x.dept));
      const short = D.uncovered(m, dep).reduce((a, x) => a + x.need - x.have, 0);
      if (short <= min.short) assert.ok(D.conflicts(m).length >= min.total, `n ${n} dep ${dep}`);
    }
  }
});

test('rule 6: sharing out reaches the minimum for every team and both settings, and covers what it can', () => {
  for (const dep of [false, true]) for (let n = 3; n <= 12; n++) {
    const m = D.share(n, dep), min = D.minimum(n, dep);
    assert.equal(m.length, n);
    assert.equal(D.conflicts(m).length, min.total, `n ${n} dep ${dep}`);
    assert.equal(D.uncovered(m, dep).reduce((a, x) => a + x.need - x.have, 0), min.short, `short n ${n} dep ${dep}`);
    m.forEach((x, i) => assert.equal(x & ~D.eligibleMask(D.deptOf(i)), 0, 'only eligible duties'));
    assert.ok(D.holders(m).every((h) => h <= D.need(dep)), 'no duty gets more holders than needed');
  }
  assert.deepEqual(D.share(8, true), [5, 80, 5, 80, 10, 160, 10, 160]);
});

test('rule 7: a split keeps holders, removes that conflict and adds none; refuses without a conflict', () => {
  const r = kit.rng(3);
  let done = 0;
  for (let k = 0; k < 500; k++) {
    const n = 3 + Math.floor(r() * 10);
    const m = D.team(n).map((x) => Math.floor(r() * 256) & D.eligibleMask(x.dept));
    const cs = D.conflicts(m);
    if (!cs.length) continue;
    const c = cs[Math.floor(r() * cs.length)];
    const out = D.split(m, c.person, c.pair, DEPTS(n));
    if (!out) continue;
    done++;
    assert.deepEqual(D.holders(out.masks), D.holders(m));
    assert.equal(D.conflicts(out.masks).length, cs.length - 1);
    assert.ok(D.eligible(D.deptOf(out.to), out.duty));
  }
  assert.ok(done > 100);
  assert.equal(D.split([bits(REQUEST), 0, 0], 0, 0, DEPTS(3)), null);
});

test('rule 8: a control fails when the person manages the logs, or when nobody independent is left', () => {
  // backups + logs: the person holds the logs by definition
  assert.equal(D.control([0, bits(BACKUPS, LOGS), 0], 1, 3).why, 'logs');
  // code + deploy, both other people hold one of the two
  const m = [bits(REQUEST), bits(CODE, DEPLOY), 0, bits(CODE), 0, bits(DEPLOY)];
  assert.deepEqual(D.control(m, 1, 2), { ok: true, why: null, reviewer: 0 });
  const m2 = [bits(CODE), bits(CODE, DEPLOY), bits(DEPLOY)];
  assert.deepEqual(D.control(m2, 1, 2), { ok: false, why: 'reviewer', reviewer: null });
  // a reviewer may hold other duties, even the logs
  const m3 = [bits(LOGS, PAY), bits(CODE, DEPLOY), bits(CODE)];
  assert.equal(D.control(m3, 1, 2).reviewer, 0);
});

test('rule 9: params made safe; masks cut to what the person may hold', () => {
  const p = logic.normalise({ team: '99', deputies: 'yes', edit: '1', m0: 255, m1: -4, m2: 'x', r0: 200, r1: 3.6 });
  assert.equal(p.team, 12);
  assert.equal(p.deputies, false);
  assert.equal(p.edit, true);
  assert.equal(p.m0, D.eligibleMask(D.OFFICE));
  assert.equal(p.m1, 0);
  assert.equal(p.m2, 0);
  assert.equal(p.r0, 80);
  assert.equal(p.r1, 4);
  assert.equal(logic.normalise({ team: 1 }).team, 3);
  assert.equal(logic.normalise({ team: 4.5 }).team, 5);
  assert.equal(logic.normalise({ deputies: 0 }).deputies, false);
  assert.equal(logic.normalise({ deputies: 'true' }).deputies, true);
  assert.equal(logic.normalise({ edit: 0 }).edit, false);
  assert.equal(logic.normalise({ edit: '0' }).edit, false);
  assert.equal(logic.normalise({ team: '' }).team, 6);
  assert.equal(logic.normalise({ team: ' ' }).team, 6);
});

test('rule 9: resolutions are base-3 digits, one per pair', () => {
  const p = logic.normalise({ r1: 1 + 2 * 3 + 0 * 9 + 1 * 27 });
  assert.deepEqual([0, 1, 2, 3].map((k) => logic.resOf(p, 1, k)), ['control', 'accept', 'open', 'control']);
  assert.equal(logic.withRes(0, 2, 'accept'), 18);
  assert.equal(logic.withRes(18, 2, 'open'), 0);
  assert.equal(logic.withRes(34, 1, 'control'), 34 - 3);
  assert.equal(logic.withRes(80, 3, 'open'), 80 - 54);
});

test('rule 9: edit off uses the shared-out assignment; edit on the first `team` masks, the rest kept aside', () => {
  assert.deepEqual(S({ edit: false, team: 6 }).masks, D.share(6, false));
  const p = EDIT(3, [bits(REQUEST), bits(CODE), bits(PAY), bits(DEPLOY), bits(CREATE)]);
  assert.deepEqual(logic.compute(p).masks, [bits(REQUEST), bits(CODE), bits(PAY)]);
  assert.deepEqual(logic.compute(Object.assign({}, p, { team: 5 })).masks.slice(3), [bits(DEPLOY), bits(CREATE)]);
});

test('rule 11: outcome of a resolution; the matrix shows the worst conflict of a pair', () => {
  const ok = { ok: true }, bad = { ok: false };
  assert.equal(logic.outcomeOf('open', ok), 'open');
  assert.equal(logic.outcomeOf('control', ok), 'detected');
  assert.equal(logic.outcomeOf('control', bad), 'open');
  assert.equal(logic.outcomeOf('accept', bad), 'accepted');
  // two people with request + approve: one accepted, one controlled → the cell shows accepted
  const both = bits(REQUEST, APPROVE);
  const s = logic.compute(EDIT(5, [both, bits(CODE, LOGS), both, bits(DEPLOY, BACKUPS), bits(CREATE, PAY)], { r0: 2, r2: 1 }));
  assert.deepEqual(s.conflicts.map((c) => [c.person, c.pair, c.outcome]), [[0, 0, 'accepted'], [2, 0, 'detected'], [4, 1, 'open']]);
  assert.deepEqual(s.pairState, ['accepted', 'open', null, null]);
  const s2 = logic.compute(EDIT(5, [both, bits(CODE, LOGS), both, bits(DEPLOY, BACKUPS), bits(CREATE, PAY)], { r0: 0, r2: 1 }));
  assert.equal(s2.pairState[0], 'open');
});

test('rule 11: verdict: finding (short or open), managed (conflicts, none open), clean', () => {
  assert.equal(S(preset('separated')).verdict, 'clean');
  assert.equal(S(preset('three')).verdict, 'managed');
  assert.equal(S(preset('cover')).verdict, 'finding');
  const short = logic.compute(EDIT(4, [bits(REQUEST), bits(CODE), bits(APPROVE), bits(DEPLOY)]));
  assert.equal(short.counts.conflicts, 0);
  assert.equal(short.verdict, 'finding');
  assert.deepEqual(short.short.map((x) => x.duty), [CREATE, PAY, BACKUPS, LOGS]);
});

test('rule 12: the caption: main sentence by verdict, notes in priority order, at most two', () => {
  assert.deepEqual(logic.captionKey(S(preset('separated'))), { key: 'capClean', notes: [] });
  assert.deepEqual(logic.captionKey(S(preset('mixed'))), { key: 'capOpen', notes: ['nAvoidable'] });
  assert.deepEqual(logic.captionKey(S(preset('cover'))), { key: 'capOpen', notes: ['nForced'] });
  assert.deepEqual(logic.captionKey(S(preset('three'))), { key: 'capDetected', notes: ['nForced'] });
  assert.equal(logic.captionKey(S(Object.assign({}, preset('three'), { r1: 18 }))).key, 'capAccepted');
  const both = bits(REQUEST, APPROVE);
  const mixed = logic.compute(EDIT(5, [both, bits(CODE, LOGS), both, bits(DEPLOY, BACKUPS), bits(CREATE, PAY)], { r0: 2, r2: 1, r4: 6 }));
  assert.equal(logic.captionKey(mixed).key, 'capManaged');
  assert.deepEqual(logic.captionKey(S(preset('own-log'))), { key: 'capOpen', notes: ['nLogs', 'nForced'] });
  const short = logic.compute(EDIT(4, [bits(REQUEST), bits(CODE), bits(APPROVE), bits(DEPLOY)]));
  assert.deepEqual(logic.captionKey(short), { key: 'capShort', notes: ['nShort'] });
  const one = logic.compute(EDIT(4, [bits(REQUEST), bits(CODE, LOGS), bits(APPROVE, CREATE), bits(DEPLOY, BACKUPS)]));
  assert.deepEqual(one.short.map((x) => x.duty), [PAY]);
  assert.deepEqual(logic.captionKey(one), { key: 'capShort', notes: ['nShort'] });
  // four notes apply (short, logs, forced, avoidable): the first two are kept
  const four = logic.compute(EDIT(3, [bits(REQUEST, CREATE), bits(CODE, DEPLOY, BACKUPS, LOGS), bits(PAY)], { r1: 36 }));
  assert.ok(four.short.length && four.min > 0 && four.avoidable > 0);
  assert.deepEqual(logic.captionKey(four), { key: 'capOpen', notes: ['nShort', 'nLogs'] });
});

test('rule 12: each note has its own condition', () => {
  // nAvoidable only when there are more conflicts than the minimum; nForced only when the minimum is above 0
  const a = S(preset('mixed'));
  assert.equal(a.avoidable, 3);
  assert.equal(a.min, 0);
  const b = S(preset('cover'));
  assert.equal(b.avoidable, 0);
  assert.equal(b.min, 3);
  // nLogs needs a control that fails on the logs: an open conflict of a log manager gives no note
  const c = logic.compute(EDIT(3, [bits(REQUEST, CREATE), bits(CODE, DEPLOY, BACKUPS, LOGS), bits(APPROVE, PAY)]));
  assert.ok(!logic.captionKey(c).notes.includes('nLogs'));
  // … nor an accepted one
  const acc = S(Object.assign({}, preset('own-log'), { r1: 2 * 9 + 2 * 27 }));
  assert.ok(!logic.captionKey(acc).notes.includes('nLogs'));
  // the minimum follows the team and the deputies; avoidable never goes below 0
  const s3 = S({ team: 3, deputies: true, edit: false });
  assert.deepEqual([s3.min, s3.minShort], [5, 3]);
  assert.equal(logic.compute(EDIT(3, [])).avoidable, 0);
});

// ── presets ──

test('presets: the SPEC table', () => {
  const row = (id) => {
    const s = S(preset(id));
    return [s.p.team, s.counts.conflicts, s.counts.open, s.counts.detected, s.counts.accepted, s.min, s.avoidable, s.verdict];
  };
  assert.deepEqual(row('mixed'), [6, 3, 3, 0, 0, 0, 3, 'finding']);
  assert.deepEqual(row('separated'), [6, 0, 0, 0, 0, 0, 0, 'clean']);
  assert.deepEqual(row('cover'), [6, 3, 3, 0, 0, 3, 0, 'finding']);
  assert.deepEqual(row('three'), [3, 1, 0, 1, 0, 1, 0, 'managed']);
  assert.deepEqual(row('own-log'), [3, 2, 2, 0, 0, 1, 1, 'finding']);
  assert.deepEqual(row('eight'), [8, 0, 0, 0, 0, 0, 0, 'clean']);
  assert.deepEqual(S(preset('mixed')).conflicts.map((c) => [c.person, c.pair]), [[0, 0], [1, 2], [3, 3]]);
  assert.deepEqual(S(preset('cover')).conflicts.map((c) => [c.person, c.pair]), [[0, 0], [0, 1], [1, 2]]);
  assert.deepEqual(S(preset('cover')).masks, [15, 48, 133, 80, 138, 96]);
  assert.ok(S(preset('cover')).conflicts.every((c) => !c.canSplit && c.ctl.ok));
  assert.deepEqual(S(preset('own-log')).conflicts.map((c) => c.canSplit), [false, true]);
  assert.equal(S(preset('three')).conflicts[0].ctl.reviewer, 0);
  assert.deepEqual(S(preset('own-log')).conflicts.map((c) => c.ctl.why), ['logs', 'logs']);
});

test('presets: moving the logs away in preset 5 makes the code + deploy control hold', () => {
  const p = Object.assign({}, preset('own-log'));
  p.m1 = bits(CODE, DEPLOY, BACKUPS);
  p.m0 = bits(REQUEST, CREATE, LOGS);
  const s = logic.compute(p);
  assert.deepEqual(s.conflicts.map((c) => [c.person, c.pair, c.outcome, c.ctl.reviewer]), [[1, 2, 'detected', 0]]);
  assert.equal(s.verdict, 'managed');
});

test('the defaults are preset 1; every preset is already normal', () => {
  assert.deepEqual(logic.defaults, preset('mixed'));
  for (const x of logic.presets) assert.deepEqual(logic.normalise(x.params), x.params, x.id);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('own-log'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every duty, pair, person, outcome, preset and caption has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  assert.match(html, /<script src="strings\.js"><\/script>\s*<script src="sod\.js"><\/script>\s*<script src="sim\.js"><\/script>/);
  const caps = ['capClean', 'capShort', 'capOpen', 'capManaged', 'capDetected', 'capAccepted', 'nShort', 'nLogs', 'nForced', 'nForcedDep', 'nAvoidable'];
  for (const lang of ['hr', 'en']) {
    for (let d = 0; d < D.DUTIES; d++) assert.ok(strings[lang]['d_' + d], `${lang} d_${d}`);
    for (let k = 0; k < D.PAIRS; k++) assert.ok(strings[lang]['p_' + k] && strings[lang]['a_' + k], `${lang} pair ${k}`);
    for (let i = 0; i < D.MAX_TEAM; i++) assert.ok(strings[lang]['n_' + i], `${lang} n_${i}`);
    for (const o of ['open', 'detected', 'accepted']) assert.ok(strings[lang]['o_' + o], `${lang} o_${o}`);
    for (const v of ['clean', 'managed', 'finding']) assert.ok(strings[lang]['v_' + v], `${lang} v_${v}`);
    for (const k of caps) assert.ok(strings[lang][k], `${lang} ${k}`);
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: own-log → pOwnLog. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
