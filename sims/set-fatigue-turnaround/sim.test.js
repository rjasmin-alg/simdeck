// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for set-fatigue-turnaround's model (rules in SPEC.md). Run: node --test sims/set-fatigue-turnaround/
// The "week" block covers week.js (the week of calls and wraps, catalogue §5.25); it moves with it to models/.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const week = require('./week.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => logic.withDefaults(over);
const D = (over) => logic.derive(P(over));
const M = (s, id) => s.crew.find((c) => c.id === id);
const H = (h) => Math.round(h * 60);
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const OVER2 = { o1: 120, o2: 120, o3: 120, o4: 120, o5: 120 };
const effs = (s, id) => M(s, id).days.map((r) => r.effective / 60);
const risks = (s, id) => M(s, id).days.map((r) => r.risk);
const sleeps = (s, id) => M(s, id).days.slice(0, 4).map((r) => r.sleep / 60);
const clock = (m) => String(Math.floor((m % 1440) / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

// ── tie-breaks first ──

test('tie-break (rule 10): exactly 16 h is raised, exactly 17 h is high', () => {
  assert.equal(logic.riskOf(H(16) - 1), 'low');
  assert.equal(logic.riskOf(H(16)), 'raised');
  assert.equal(logic.riskOf(H(17) - 1), 'raised');
  assert.equal(logic.riskOf(H(17)), 'high');
  // in the model: the camera assistant's Wednesday in the planned week is 15.5 h + 0.5 h owed = exactly 16 h
  const s = D({});
  assert.equal(M(s, 'ac').days[2].effective, H(16));
  assert.equal(M(s, 'ac').days[2].risk, 'raised');
  // a camera assistant 2 h away: awake 0.75 + 2 + 11.75 + 2 = 16.5 h
  const t = D({ tAc: 120 });
  const r = M(t, 'ac').days;
  assert.equal(r[0].awake, H(16.5));
  assert.equal(r[0].risk, 'raised');
  // debt per night: rest 12.25 − 4 − 1.5 = 6.75 h → 1.25 h; Tuesday 16.5 + 1.25 = 17.75 high
  assert.equal(r[1].debtBefore, H(1.25));
  assert.equal(r[1].risk, 'high');
});

test('tie-break (rule 10): an effective of exactly 17 h in the model is high', () => {
  // 11.5 h days, 75 min away: awake 0.75 + 1.25 + 12.25 + 1.25 = 15.5 h; rest 11.75, sleep 11.75 − 2.5 − 1.5 = 7.75
  const s = D({ length: 690, tAc: 75 });
  const r = M(s, 'ac').days;
  assert.equal(r[0].awake, H(15.5));
  assert.equal(r[1].debtBefore, H(0.25));
  assert.equal(r[4].effective, H(16.5));
  const u = D({ length: 690, tAc: 75, o5: 30 }); // Friday 30 min longer: 16.5 + 0.5 = exactly 17 h
  assert.equal(M(u, 'ac').days[4].effective, H(17));
  assert.equal(M(u, 'ac').days[4].risk, 'high');
});

test('tie-break (rule 7): exactly 60 min of travel is far, 45 is not', () => {
  const at60 = D({ tGrip: 60, far: 'room' });
  assert.equal(M(at60, 'grip').far, true);
  assert.equal(M(at60, 'grip').roomed, true);
  assert.equal(M(at60, 'grip').travel, logic.ROOM);
  const at45 = D({ tGrip: 45, far: 'room' });
  assert.equal(M(at45, 'grip').far, false);
  assert.equal(M(at45, 'grip').travel, 45);
  assert.equal(D({ tMakeup: 60, far: 'driver' }).crew[1].atWheel, false);
  assert.equal(D({ tMakeup: 45, far: 'driver' }).crew[1].atWheel, true);
});

test('tie-break (rule 8): exactly 8 h left to sleep gives 8 h and no debt; more is not slept ahead', () => {
  // the grip in the planned week rests 12 h; 75 min away leaves 12 − 2.5 − 1.5 = exactly 8 h
  const s = D({ tGrip: 75 });
  assert.equal(M(s, 'grip').days[0].avail, H(8));
  assert.equal(M(s, 'grip').days[0].sleep, H(8));
  assert.equal(M(s, 'grip').debtEnd, 0);
  const t = D({ tGrip: 15 });
  assert.ok(M(t, 'grip').days[0].avail > H(8));
  assert.equal(M(t, 'grip').days[0].sleep, H(8), 'no more than the need');
  assert.equal(M(t, 'grip').days[1].debtBefore, 0, 'no credit carried');
});

test('tie-break (rule 8): no time left to sleep is 0 h, never negative', () => {
  const s = D({ length: 840, o1: 240, o2: 240, o3: 240, o4: 240, o5: 240, tAc: 150 });
  const r = M(s, 'ac').days[0];
  assert.ok(r.avail < 0, 'less than nothing left');
  assert.equal(r.sleep, 0);
  assert.equal(M(s, 'ac').days[1].debtBefore, logic.NEED);
});

test('tie-break (rule 4): the minimum rest moves nothing when the planned call already gives it', () => {
  // 11 h days: wrap 18:00, planned call 07:00 = 13 h ≥ 11 + 1.5: unchanged
  const a = D({ minRest: true });
  assert.deepEqual(a.days.map((x) => x.call), D({}).days.map((x) => x.call));
  // 11.5 h days: wrap 18:30 + 12.5 h = exactly 07:00: unchanged (the planned call wins the tie)
  const b = D({ minRest: true, length: 690 });
  assert.deepEqual(b.days.map((x) => clock(x.call)), ['07:00', '07:00', '07:00', '07:00', '07:00']);
  assert.deepEqual(b.turnaround, [750, 750, 750, 750]);
  // 30 min more and it moves
  const c = D({ minRest: true, length: 720 });
  assert.equal(clock(c.days[1].call), '07:30');
});

test('tie-break (rule 11): the worst drive is the earliest of equals; −1 when not at the wheel', () => {
  const s = D({}); // the make-up artist: 14.75 h every day, all equal
  assert.equal(M(s, 'makeup').worst, 0);
  assert.equal(M(s, 'ac').worst, 4, 'climbs to Friday');
  const sh = D(Object.assign({ shorter: true }, OVER2));
  assert.equal(M(sh, 'ac').worst, 0, 'Monday (17.5) beats Friday (16.5)');
  const dr = D(Object.assign({ far: 'driver' }, OVER2));
  assert.equal(M(dr, 'ac').worst, -1);
  assert.equal(M(dr, 'grip').worst, 4);
});

test('tie-break: the crew is always grip, make-up, camera assistant', () => {
  assert.deepEqual(logic.WHO, ['grip', 'makeup', 'ac']);
  assert.deepEqual(D({ who: 'grip' }).crew.map((c) => c.id), ['grip', 'makeup', 'ac']);
  assert.equal(logic.EXTRA_REST, 90, 'the make-up artist: 60 pre-call + 30 packing up');
});

// ── week (week.js) ──

test('rule 1: overruns clamp to 0 … 240; not a number is 0; wrap on time cuts them all', () => {
  assert.equal(week.clampOverrun(-30), 0);
  assert.equal(week.clampOverrun(300), 240);
  assert.equal(week.clampOverrun('90'), 0);
  assert.equal(week.clampOverrun(undefined), 0);
  assert.equal(week.clampOverrun(NaN), 0);
  assert.equal(week.clampOverrun(90), 90);
  const s = week.schedule({ days: 5, length: 660, overruns: [120, 60, 0, 30, 240], onTime: true });
  assert.deepEqual(s.map((d) => d.overrun), [0, 0, 0, 0, 0]);
  assert.deepEqual(s.map((d) => d.wrap % 1440), [1080, 1080, 1080, 1080, 1080]);
});

test('rule 2: call at 07:00 each day, wrap = call + planned length + overrun', () => {
  const s = week.schedule({ days: 5, length: 660, overruns: [0, 60, 120, 0, 240] });
  assert.deepEqual(s.map((d) => d.call), [420, 1860, 3300, 4740, 6180]);
  assert.deepEqual(s.map((d) => d.len), [660, 720, 780, 660, 900]);
  assert.deepEqual(s.map((d) => d.wrap - d.call), [660, 720, 780, 660, 900]);
  assert.deepEqual(s.map((d) => d.planned), [420, 1860, 3300, 4740, 6180]);
});

test('rule 3: shorter next day: the day after an overrun starts later by it and keeps its planned wrap', () => {
  const s = week.schedule({ days: 5, length: 660, overruns: [120, 0, 60, 0, 0], shorter: true });
  assert.deepEqual(s.map((d) => clock(d.call)), ['07:00', '09:00', '07:00', '08:00', '07:00']);
  assert.deepEqual(s.map((d) => clock(d.wrap)), ['20:00', '18:00', '19:00', '18:00', '18:00']);
  assert.deepEqual(s.map((d) => d.len), [780, 540, 720, 600, 660]);
  // wrap on time overrides: no overruns, nothing to give back
  const t = week.schedule({ days: 5, length: 660, overruns: [120, 0, 60, 0, 0], shorter: true, onTime: true });
  assert.deepEqual(t.map((d) => clock(d.call)), ['07:00', '07:00', '07:00', '07:00', '07:00']);
});

test('rule 4: the minimum rest moves the next call to wrap + 11 h + the extra, and the week slides', () => {
  const s = week.schedule({ days: 5, length: 660, overruns: [120, 120, 120, 120, 120], minRest: true, extraRest: 90 });
  assert.deepEqual(s.map((d) => clock(d.call)), ['07:00', '08:30', '10:00', '11:30', '13:00']);
  assert.deepEqual(s.map((d) => d.len), [780, 780, 780, 780, 780], 'the day keeps its length');
  assert.equal(s[4].wrap, 4 * 1440 + 1440 + 120, 'Friday wraps at 02:00 on Saturday');
  assert.deepEqual(week.turnarounds(s), [750, 750, 750, 750]);
  // without extra: exactly 11 h
  const t = week.schedule({ days: 5, length: 780, overruns: [], minRest: true });
  assert.deepEqual(week.turnarounds(t), [660, 660, 660, 660]);
  assert.equal(week.MIN_REST, 660);
});

test('rule 5: turnaround = next call − wrap, one fewer than days', () => {
  const s = week.schedule({ days: 5, length: 660, overruns: [0, 60, 120, 180, 240] });
  assert.deepEqual(week.turnarounds(s), [780, 720, 660, 600]);
  assert.deepEqual(D({}).turnaround, [780, 780, 780, 780]);
});

test('rules 1–4 with odd inputs: rounding, Infinity, long overruns, shorter with the minimum rest', () => {
  assert.equal(week.clampOverrun(Infinity), 0);
  assert.equal(week.clampOverrun(-Infinity), 0);
  assert.equal(week.clampOverrun(90.4), 90);
  // shorter after a 4 h overrun: Tuesday 11:00–18:00
  const a = week.schedule({ days: 5, length: 660, overruns: [240], shorter: true });
  assert.equal(clock(a[1].call), '11:00');
  assert.equal(clock(a[1].wrap), '18:00');
  // planned stays 07:00 under shorter; base records the later start
  assert.deepEqual(a.map((d) => clock(d.planned)), ['07:00', '07:00', '07:00', '07:00', '07:00']);
  assert.deepEqual(a.map((d) => clock(d.base)), ['07:00', '11:00', '07:00', '07:00', '07:00']);
  // shorter + minimum rest with 2 h overruns: the shorter start already gives the rest, nothing more moves
  const b = D(Object.assign({ shorter: true, minRest: true }, OVER2));
  assert.deepEqual(b.days.map((d) => clock(d.call)), ['07:00', '09:00', '09:00', '09:00', '09:00']);
  assert.ok(b.days.every((d) => d.call === d.base), 'the minimum rest moved nothing');
  // the minimum rest moves only Tuesday after a 1 h Monday overrun on 12 h days
  const c = D({ minRest: true, length: 720, o1: 0 });
  assert.equal(clock(c.days[1].call), '07:30');
  assert.equal(c.days[1].base, c.days[1].planned);
  // the longest planned day is not clamped by the model
  assert.equal(D({ length: 840 }).days[0].wrap, 420 + 840);
});

test('rule 7 with odd inputs: rounding, Infinity, the default for a bad value, the driver with other remedies', () => {
  assert.equal(logic.clampTravel(44.6, 30), 45);
  assert.equal(logic.clampTravel(Infinity, 30), 30);
  assert.equal(logic.clampTravel(-Infinity, 90), 90);
  assert.deepEqual(logic.bump(P({ tAc: 'x' }), 'tAc', 1), { tAc: 105 });
  assert.deepEqual(logic.bump(P({ tGrip: 'x' }), 'tGrip', -1), { tGrip: 15 });
  const s = D(Object.assign({ far: 'driver', minRest: true }, OVER2));
  assert.equal(M(s, 'ac').atWheel, false);
  assert.equal(M(s, 'ac').worst, -1);
  assert.deepEqual(s.crew.map((c) => c.atWheel), [true, true, false]);
  const r = D(Object.assign({ far: 'room', shorter: true, onTime: true }, OVER2));
  assert.deepEqual(r.crew.map((c) => c.atWheel), [true, true, true]);
});

// ── the crew (sim.js) ──

test('rule 6: own call, release, wake, home and hours awake at the end of the drive home', () => {
  const s = D({ o1: 60 });
  const g = M(s, 'grip').days[0], m = M(s, 'makeup').days[0], a = M(s, 'ac').days[0];
  assert.deepEqual([g.ownCall, g.release, g.wake, g.home], [420, 420 + 720 + 60, 420 - 30 - 45, 1200 + 30]);
  assert.deepEqual([m.ownCall, m.release, m.wake, m.home], [360, 1140 + 30, 360 - 45 - 45, 1170 + 45]);
  assert.deepEqual([a.ownCall, a.release, a.wake, a.home], [420, 1140 + 45, 420 - 90 - 45, 1185 + 90]);
  assert.equal(g.awake, 45 + 30 + 720 + 60 + 30);
  assert.equal(m.awake, 45 + 45 + 60 + 720 + 30 + 45);
  assert.equal(a.awake, 45 + 90 + 720 + 45 + 90);
  for (const r of [g, m, a]) assert.equal(r.awake, r.home - r.wake);
});

test('rule 7: travel clamps to 15 … 150; a room puts the far 15 min away; a driver keeps the travel', () => {
  assert.equal(logic.clampTravel(0, 30), 15);
  assert.equal(logic.clampTravel(200, 30), 150);
  assert.equal(logic.clampTravel('x', 30), 30);
  assert.equal(M(D({ tGrip: -5 }), 'grip').travelSet, 15);
  const room = D({ far: 'room' });
  assert.deepEqual(room.crew.map((c) => c.travel), [30, 45, 15]);
  assert.deepEqual(room.crew.map((c) => c.travelSet), [30, 45, 90]);
  assert.deepEqual(room.crew.map((c) => c.atWheel), [true, true, true]);
  const drv = D({ far: 'driver' });
  assert.deepEqual(drv.crew.map((c) => c.travel), [30, 45, 90]);
  assert.deepEqual(drv.crew.map((c) => c.atWheel), [true, true, false]);
  assert.deepEqual(D({ far: 'driver', tGrip: 120 }).crew.map((c) => c.atWheel), [false, true, false]);
  assert.deepEqual(D({ far: 'none' }).crew.map((c) => c.roomed), [false, false, false]);
});

test('rule 8: sleep = own rest − travel both ways − evening − morning; Friday has none', () => {
  const s = D(OVER2);
  const a = M(s, 'ac').days;
  assert.equal(a[0].rest, 1440 + 420 - (420 + 780 + 45)); // 10.25 h
  assert.equal(a[0].avail, a[0].rest - 180 - 90);
  assert.equal(a[0].sleep, H(5.75));
  assert.equal(a[0].asleep, a[0].home + 45);
  const m = M(s, 'makeup').days[0];
  assert.equal(m.rest, (1440 + 360) - (420 + 780 + 30), 'the pre-call comes out of the rest');
  assert.deepEqual([a[4].rest, a[4].avail, a[4].sleep, a[4].asleep], [null, null, null, null]);
});

test('rule 9: the debt adds up night by night, from 0 on Monday', () => {
  const s = D(OVER2);
  assert.deepEqual(M(s, 'ac').days.map((r) => r.debtBefore / 60), [0, 2.25, 4.5, 6.75, 9]);
  assert.equal(M(s, 'ac').debtEnd, H(9));
  assert.equal(M(s, 'grip').debtEnd, H(2));
  assert.equal(M(s, 'makeup').debtEnd, H(6));
});

test('rule 10: effective = awake + debt; a driven crew member keeps the level', () => {
  const s = D(Object.assign({ far: 'driver' }, OVER2));
  for (const r of M(s, 'ac').days) assert.equal(r.effective, r.awake + r.debtBefore);
  assert.deepEqual(risks(s, 'ac'), ['high', 'high', 'high', 'high', 'high']);
  assert.equal(M(s, 'ac').atWheel, false);
  assert.equal(logic.RAISED, H(16));
  assert.equal(logic.HIGH, H(17));
});

test('rule 11: the worst drive is the highest effective at the wheel', () => {
  const s = D({ o3: 240 });
  assert.equal(M(s, 'grip').worst, 2);
});

test('rule 12: − / + on overruns (30 min, 0 … 240) and travel (15 min, 15 … 150); null at a bound', () => {
  assert.deepEqual(logic.bump(P({}), 'o1', 1), { o1: 30 });
  assert.equal(logic.bump(P({}), 'o1', -1), null);
  assert.equal(logic.bump(P({ o3: 240 }), 'o3', 1), null);
  assert.deepEqual(logic.bump(P({ o3: 240 }), 'o3', -1), { o3: 210 });
  assert.deepEqual(logic.bump(P({}), 'tAc', 1), { tAc: 105 });
  assert.deepEqual(logic.bump(P({}), 'tGrip', -1), { tGrip: 15 });
  assert.equal(logic.bump(P({ tGrip: 15 }), 'tGrip', -1), null);
  assert.equal(logic.bump(P({ tMakeup: 150 }), 'tMakeup', 1), null);
  assert.equal(logic.bump(P({}), 'length', 1), null, 'only overruns and travel');
  assert.deepEqual(logic.bump(P({ o2: 'x' }), 'o2', 1), { o2: 30 }, 'a bad value counts as 0');
});

test('the page\'s "changed" mark: risk levels that differ, crew order then day', () => {
  const a = D({}), b = D({ o3: 120 });
  assert.deepEqual(logic.changedRisk(null, b), []);
  assert.deepEqual(logic.changedRisk(a, a), []);
  // Wednesday 2 h over: make-up raised from Wednesday (16.75, then 1.5 h owed: 16.25), the camera assistant high from Wednesday
  const ch = logic.changedRisk(a, b);
  assert.deepEqual(ch, [['makeup', 2], ['makeup', 3], ['makeup', 4], ['ac', 2], ['ac', 3], ['ac', 4]]);
  // the driver flips the camera assistant's wheel mark on every day
  assert.deepEqual(logic.changedRisk(a, D({ far: 'driver' })), [0, 1, 2, 3, 4].map((d) => ['ac', d]));
});

test('who: an unknown crew member shows the default', () => {
  assert.equal(D({ who: 'gaffer' }).who, 'ac');
  assert.equal(D({ who: 'grip' }).who, 'grip');
});

// ── presets: the expected numbers of SPEC.md ──

test('preset planned: 13 h turnaround; only the camera assistant owes sleep and climbs to raised', () => {
  const s = logic.derive(preset('planned'));
  assert.deepEqual(s.turnaround.map((x) => x / 60), [13, 13, 13, 13]);
  assert.deepEqual(effs(s, 'grip'), [13.75, 13.75, 13.75, 13.75, 13.75]);
  assert.deepEqual(effs(s, 'makeup'), [14.75, 14.75, 14.75, 14.75, 14.75]);
  assert.deepEqual(effs(s, 'ac'), [15.5, 15.75, 16, 16.25, 16.5]);
  assert.deepEqual(risks(s, 'ac'), ['low', 'low', 'raised', 'raised', 'raised']);
  assert.deepEqual(sleeps(s, 'ac'), [7.75, 7.75, 7.75, 7.75]);
  assert.equal(M(s, 'ac').days[0].rest, H(12.25));
  assert.equal(M(s, 'ac').debtEnd, H(1));
  assert.equal(M(s, 'grip').debtEnd + M(s, 'makeup').debtEnd, 0);
});

test('preset overrun: 11 h turnaround, and still everyone owes sleep', () => {
  const s = logic.derive(preset('overrun'));
  assert.deepEqual(s.turnaround.map((x) => x / 60), [11, 11, 11, 11]);
  assert.deepEqual(sleeps(s, 'grip'), [7.5, 7.5, 7.5, 7.5]);
  assert.deepEqual(sleeps(s, 'makeup'), [6.5, 6.5, 6.5, 6.5]);
  assert.deepEqual(sleeps(s, 'ac'), [5.75, 5.75, 5.75, 5.75]);
  assert.deepEqual(effs(s, 'grip'), [15.75, 16.25, 16.75, 17.25, 17.75]);
  assert.deepEqual(risks(s, 'grip'), ['low', 'raised', 'raised', 'high', 'high']);
  assert.deepEqual(effs(s, 'makeup'), [16.75, 18.25, 19.75, 21.25, 22.75]);
  assert.deepEqual(effs(s, 'ac'), [17.5, 19.75, 22, 24.25, 26.5]);
  assert.deepEqual(risks(s, 'ac'), ['high', 'high', 'high', 'high', 'high']);
});

test('preset min-rest: the calls slide, no debt for the near, the far still high', () => {
  const s = logic.derive(preset('min-rest'));
  assert.deepEqual(s.days.map((d) => clock(d.call)), ['07:00', '08:30', '10:00', '11:30', '13:00']);
  assert.equal(clock(s.days[4].wrap), '02:00');
  assert.equal(Math.floor(s.days[4].wrap / 1440), 5, 'Saturday');
  assert.deepEqual(s.turnaround.map((x) => x / 60), [12.5, 12.5, 12.5, 12.5]);
  for (const c of s.crew) for (const r of c.days.slice(0, 4)) assert.ok(r.rest >= 660, `${c.id} rests at least 11 h`);
  assert.equal(M(s, 'makeup').days[0].rest, 660, 'the make-up artist exactly 11 h');
  assert.equal(M(s, 'grip').debtEnd + M(s, 'makeup').debtEnd, 0);
  assert.deepEqual(sleeps(s, 'ac'), [7.25, 7.25, 7.25, 7.25]);
  assert.deepEqual(effs(s, 'ac'), [17.5, 18.25, 19, 19.75, 20.5]);
  assert.deepEqual(effs(s, 'makeup'), [16.75, 16.75, 16.75, 16.75, 16.75]);
});

test('preset shorter: Monday is still long; after it the week stays near planned', () => {
  const s = logic.derive(preset('shorter'));
  assert.deepEqual(s.days.map((d) => clock(d.call)), ['07:00', '09:00', '09:00', '09:00', '09:00']);
  assert.deepEqual(s.days.map((d) => clock(d.wrap)), ['20:00', '20:00', '20:00', '20:00', '20:00']);
  assert.deepEqual(s.turnaround.map((x) => x / 60), [13, 13, 13, 13]);
  assert.deepEqual(effs(s, 'ac'), [17.5, 15.75, 16, 16.25, 16.5]);
  assert.equal(M(s, 'ac').debtEnd, H(1));
  assert.equal(M(s, 'grip').debtEnd + M(s, 'makeup').debtEnd, 0);
});

test('preset room: the far camera assistant sleeps 8 h and stays low', () => {
  const s = logic.derive(preset('room'));
  assert.equal(M(s, 'ac').travel, 15);
  assert.deepEqual(sleeps(s, 'ac'), [8, 8, 8, 8]);
  assert.deepEqual(effs(s, 'ac'), [15, 15, 15, 15, 15]);
  assert.deepEqual(effs(s, 'makeup'), effs(logic.derive(preset('overrun')), 'makeup'), 'the near are unchanged');
});

test('preset driver: not at the wheel, the debt the same as without', () => {
  const s = logic.derive(preset('driver')), o = logic.derive(preset('overrun'));
  assert.equal(M(s, 'ac').atWheel, false);
  assert.deepEqual(effs(s, 'ac'), effs(o, 'ac'));
  assert.equal(M(s, 'ac').debtEnd, H(9));
});

test('wrap on time with the overruns is the planned week', () => {
  const a = logic.derive(P(Object.assign({ onTime: true }, OVER2))), b = D({});
  assert.deepEqual(a.crew, b.crew);
  assert.deepEqual(a.turnaround, b.turnaround);
});

// ── generic checks every sim keeps ──

function* someParams() {
  for (const x of logic.presets) yield x.params;
  for (const far of logic.FAR_MODES) for (const who of logic.WHO) {
    yield P({ far, who, minRest: true, shorter: true, o2: 240, tAc: 150, length: 840 });
    yield P({ far, who, onTime: true, length: 480, tGrip: 15 });
  }
}

test('state is JSON-safe', () => {
  for (const p of someParams()) {
    const s = logic.initial(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P(Object.assign({ minRest: true, far: 'room' }, OVER2));
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both tables; the page is an explorer', () => {
  for (const x of logic.presets) {
    assert.deepEqual(Object.keys(x.params).sort(), Object.keys(logic.defaults).sort(), x.id);
    assert.ok(logic.FAR_MODES.includes(x.params.far));
    assert.ok(logic.WHO.includes(x.params.who));
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + x.id], `${lang} name of ${x.id}`);
      assert.ok(strings[lang]['hint_' + x.id], `${lang} hint of ${x.id}`);
    }
  }
  for (const lang of ['hr', 'en']) {
    for (const c of logic.WHO) assert.ok(strings[lang]['crew_' + c], `${lang} crew_${c}`);
    for (const f of logic.FAR_MODES) assert.ok(strings[lang]['far_' + f], `${lang} far_${f}`);
    for (const r of ['low', 'raised', 'high']) assert.ok(strings[lang]['risk_' + r], `${lang} risk_${r}`);
    for (let d = 0; d < logic.DAYS; d++) assert.ok(strings[lang]['day' + d], `${lang} day${d}`);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.ok(html.indexOf('<script src="week.js"></script>') < html.indexOf('<script src="sim.js"></script>'), 'week.js before sim.js');
});
