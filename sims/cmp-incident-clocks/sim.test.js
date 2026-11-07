// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-incident-clocks. Run: node --test sims/cmp-incident-clocks/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the timeline model's rules (clocks.js), then the sim's
// rules (sim.js), then the presets, then the strings and the page, then the generic block every sim keeps.
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
const inc = (over) => Object.assign({ attack: H(0, 22), detectAfter: 9, triage: 3, significant: true, personal: true,
  reporting: 'office', week0: W0 }, over);
const byId = (tl, id) => tl.clocks.find((c) => c.id === id);

// ── tie-breaks ──

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

test('tie-break: detection exactly 24 h after the attack: the misconception\'s clock runs out at that moment', () => {
  const s = at({ day: 0, hour: 10, detect: 24 }, 2);
  assert.equal(s.ghost.beforeDetect, 0);
  assert.deepEqual(logic.captionKeys(s), ['cDetect', 'cGhostJust']);
  assert.deepEqual(logic.captionKeys(at({ day: 0, hour: 10, detect: 23 }, 2)), ['cDetect', 'cGhostLeft']);
  assert.deepEqual(logic.captionKeys(at({ day: 0, hour: 10, detect: 25 }, 2)), ['cDetect', 'cGhostGone']);
  assert.deepEqual(logic.captionKeys(at({ day: 0, hour: 10, detect: 0 }, 2)), ['cDetectAtOnce']);
  // the summary recalls the unseen attack from exactly 24 h on
  assert.ok(logic.captionKeys(at({ day: 0, hour: 10, detect: 24 }, LAST)).includes('cReportGhost'));
  assert.ok(!logic.captionKeys(at({ day: 0, hour: 10, detect: 23 }, LAST)).includes('cReportGhost'));
});

test('tie-break: at the deadline hour an unfiled report is overdue; filed at now counts as filed', () => {
  const c = { id: 'ew', running: true, due: 50, filed: 60, inTime: false };
  assert.equal(logic.statusAt(c, 49, 26), 'running');
  assert.equal(logic.statusAt(c, 50, 26), 'overdue');
  assert.equal(logic.statusAt(c, 60, 26), 'late');
  assert.equal(logic.statusAt({ id: 'ew', running: true, due: 50, filed: 30, inTime: true }, 30, 26), 'ok');
});

// ── the timeline model (clocks.js, SPEC rules 1-8) ──

test('rule 1: calendar: the reference Monday, day numbers both ways, weekdays', () => {
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

test('rule 2: on call works every hour; office hours skip nights and weekends; an unknown mode throws', () => {
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

test('rule 3: work fills worked slots from the start, merges runs, spans the weekend; zero work is done at once', () => {
  const w = clocks.work(H(4, 14), 4, 'office');                  // Friday 14:00, four hours
  assert.deepEqual(w.slots, [{ from: H(4, 14), to: H(4, 16) }, { from: H(7, 8), to: H(7, 10) }]);
  assert.equal(w.done, H(7, 10));
  assert.deepEqual(clocks.work(H(4, 14), 0, 'office'), { done: H(4, 14), slots: [] });
  assert.equal(clocks.work(H(5, 3), 3, 'oncall').done, H(5, 6));
});

test('rule 4: detection is attack + delay, awareness is detection + triage; the clocks start at awareness', () => {
  const tl = clocks.timeline(inc({ attack: H(2, 3), detectAfter: 126, triage: 3 }));
  assert.equal(tl.detected, H(7, 9));
  assert.equal(tl.aware, H(7, 12));
  for (const id of ['ew', 'notif', 'gdpr']) assert.equal(byId(tl, id).start, tl.aware);
  // the same awareness after a short or a long undetected attack gives the same clocks
  const a = clocks.timeline(inc({ attack: H(7, 8), detectAfter: 1, triage: 3 }));
  assert.deepEqual(a.clocks, tl.clocks);
  assert.notEqual(a.attack, tl.attack);
});

test('rule 5: deadlines: 24 h and 72 h from awareness, through nights and weekends', () => {
  const tl = clocks.timeline(inc({ attack: H(4, 17), detectAfter: 1, triage: 2 }));   // aware Friday 20:00
  assert.equal(byId(tl, 'ew').due, H(5, 20));              // Saturday 20:00
  assert.equal(byId(tl, 'notif').due, H(7, 20));           // Monday 20:00
  assert.equal(byId(tl, 'gdpr').due, H(7, 20));
});

test('rule 5: the final report is due one calendar month after the notification was filed, same hour', () => {
  const tl = clocks.timeline(inc({ attack: H(0, 22), detectAfter: 9, triage: 3 }));
  const no = byId(tl, 'notif'), fin = byId(tl, 'final');
  assert.equal(fin.start, no.filed);
  const m = clocks.moment(fin.due, W0);
  assert.deepEqual([m.y, m.m, m.d, m.hour], [2027, 4, 2, 14]);
  assert.equal(fin.filed, null);
  assert.equal(fin.inTime, null);
});

test('rule 5: a late notification moves the final report\'s deadline with it', () => {
  const late = clocks.timeline(inc({ attack: H(0, 22), detectAfter: 9, triage: 3, reporting: 'oncall', prep: { ew: 1, notif: 100, gdpr: 1 } }));
  const no = byId(late, 'notif');
  assert.equal(no.inTime, false);
  const m = clocks.moment(byId(late, 'final').start, W0), d = clocks.moment(byId(late, 'final').due, W0);
  assert.equal(byId(late, 'final').start, no.filed);
  assert.deepEqual([d.m, d.d, d.hour], [m.m + 1, m.d, m.hour]);
});

test('rule 6: which clocks run: NIS2 for a significant incident, GDPR when personal data is affected', () => {
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

test('rule 7: one queue in clock order; each report starts when the one before is filed; GDPR alone starts at awareness', () => {
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

test('rule 8: in time, late and spare; met and missed count the hour clocks only', () => {
  const tl = clocks.timeline(inc({ attack: H(4, 17), detectAfter: 1, triage: 2 }));
  const ew = byId(tl, 'ew');
  assert.deepEqual([ew.inTime, ew.late, ew.spare, ew.filed], [false, 37, 0, H(7, 9)]);
  assert.deepEqual([byId(tl, 'notif').spare, byId(tl, 'gdpr').spare], [8, 5]);
  assert.equal(tl.met, 2);
  assert.equal(tl.missed, 1);
  assert.equal(tl.ghost.due, H(5, 17));
  assert.equal(tl.ghost.beforeDetect, -23);
});

test('rule 8 (claims in SPEC): on call meets every deadline; in office hours only the early warning can be missed', () => {
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

// ── the sim (sim.js, SPEC rules 9-12) ──

test('rule 9: params are made valid (numbers rounded and clamped, booleans, the mode)', () => {
  assert.deepEqual(logic.normalise({}), logic.defaults);
  assert.deepEqual(logic.normalise(null), logic.defaults);
  const q = logic.normalise({ day: 9, hour: -3, detect: '200', triage: 0, significant: 'false', personal: '1', reporting: 'x' });
  assert.deepEqual(q, { day: 6, hour: 0, detect: 168, triage: 1, significant: false, personal: true, reporting: 'office' });
  assert.equal(logic.normalise({ hour: 2.5 }).hour, 3);
  assert.equal(logic.normalise({ hour: -2.5 }).hour, 0);
  assert.equal(logic.normalise({ significant: '0' }).significant, false);
  assert.equal(logic.normalise({ personal: false }).personal, false);
  for (const bad of [null, '', true, NaN, Infinity, 'x']) assert.equal(logic.normalise({ triage: bad }).triage, logic.defaults.triage, String(bad));
  assert.equal(logic.normalise({ significant: 'maybe' }).significant, true);
  assert.equal(logic.normalise({ personal: 0 }).personal, false);
  assert.equal(logic.normalise({ reporting: 'oncall' }).reporting, 'oncall');
});

test('rule 10: 7 steps; now walks attack, detection, awareness, +24 h, +72 h, the final report, the summary', () => {
  assert.equal(logic.steps, 7);
  assert.deepEqual(logic.STAGES, ['start', 'attack', 'detect', 'aware', 'day1', 'day3', 'final', 'report']);
  const now = [...Array(LAST + 1).keys()].map((n) => atPreset('friday', n).now);
  const s = atPreset('friday', LAST);
  const fin = logic.clock(s, 'final');
  assert.deepEqual(now, [null, s.attack, s.detected, s.aware, s.aware + 24, s.aware + 72, fin.due, fin.due]);
  // without a final report the last stages stay at the later of the 72-hour mark and the last filing
  assert.equal(logic.nowAt('final', { aware: 0, lastFiled: null, clocks: [{}, {}, { running: false }] }), 72);
  assert.equal(logic.nowAt('report', { aware: 0, lastFiled: 90, clocks: [{}, {}, { running: false }] }), 90);
  // steps out of range or fractional are clamped and rounded
  assert.equal(logic.step(null, -3, P({})).stage, 'start');
  assert.equal(logic.step(null, 99, P({})).stage, 'report');
  assert.equal(logic.step(null, 2.4, P({})).stage, 'detect');
});

test('rule 10: what each clock shows follows now (hidden before awareness, then running, ok, overdue, late)', () => {
  const st = (n) => atPreset('friday', n).clocks.map((c) => c.status);
  assert.deepEqual(st(2), ['hidden', 'hidden', 'hidden', 'hidden']);
  assert.deepEqual(st(3), ['running', 'running', 'set', 'running']);
  assert.deepEqual(st(4), ['overdue', 'running', 'set', 'running']);
  assert.deepEqual(st(5), ['late', 'ok', 'set', 'ok']);
  assert.deepEqual(atPreset('data-only', 3).clocks.map((c) => c.status), ['off', 'off', 'off', 'running']);
  assert.equal(at({}, 7).report, true);
  assert.equal(at({}, 6).report, false);
});

test('rule 11: the axis runs from the attack\'s day to past the last mark, with one gap for a long detection delay', () => {
  for (const pr of logic.presets) {
    const s = atPreset(pr.id, 0);
    const ax = s.axis;
    assert.ok(ax.from <= s.attack && ax.to >= s.aware + 72 && ax.to >= s.lastFiled, pr.id);
    assert.ok(ax.to >= s.ghost.due, pr.id);
    assert.equal(ax.segs[0].x0, 0);
    assert.equal(ax.segs[ax.segs.length - 1].x1, 1);
    for (let i = 1; i < ax.segs.length; i++) assert.equal(ax.segs[i].from, ax.segs[i - 1].to);
    let last = -1;
    for (let h = ax.from; h <= ax.to; h++) { const x = logic.xOf(ax, h); assert.ok(x >= last && x <= 1); last = x; }
  }
  const late = atPreset('found-late', 0).axis.segs;
  assert.deepEqual(late.map((g) => g.kind === 'gap' ? 'gap' + g.days : g.day), [2, 3, 'gap3', 7, 8, 9, 10]);
  assert.deepEqual(at({ day: 0, hour: 22, detect: 30 }, 0).axis.segs.map((g) => g.kind), Array(6).fill('day'));   // detected day 2
  assert.deepEqual(at({ day: 0, hour: 22, detect: 50 }, 0).axis.segs.map((g) => g.kind === 'gap' ? 'gap' + g.days : g.day), [0, 1, 'gap1', 3, 4, 5, 6]);
  assert.equal(logic.xOf(atPreset('found-late', 0).axis, -100), 0);
  assert.equal(logic.xOf(atPreset('found-late', 0).axis, 10000), 1);
  // the gap column is half a day wide
  const fl = atPreset('found-late', 0).axis, gap = fl.segs[2], day = fl.segs[3];
  assert.ok(Math.abs((gap.x1 - gap.x0) * 2 - (day.x1 - day.x0)) < 1e-9);
  // 3 hours of margin: a 72-hour mark at 22:00 adds the next day to the axis, one at 20:00 does not
  const end = (hour) => { const s = at({ day: 0, hour, detect: 0, triage: 1 }, 0); return s.axis.to - (s.aware + 72); };
  assert.equal(end(21), 24 + 2);      // aware Tue 22:00, mark Fri 22:00, axis to Sun 00:00
  assert.equal(end(19), 4);           // aware Tue 20:00, mark Fri 20:00, axis to Sat 00:00
  // a filing later than the 72-hour mark stretches the axis (hand-made timeline: not reachable with the page's hours)
  assert.equal(logic.axis({ attack: 0, detected: 1, aware: 2, lastFiled: 200 }).to, 9 * 24);
  assert.equal(logic.axis({ attack: 0, detected: 1, aware: 2, lastFiled: 10 }).to, 4 * 24);
});

test('rule 12: caption keys at every step (sequence for the default)', () => {
  const keys = [...Array(LAST + 1).keys()].map((n) => logic.captionKeys(at({}, n)));
  assert.deepEqual(keys, [['cStart'], ['cAttack'], ['cDetect', 'cGhostLeft'], ['cAware', 'cAwareBoth'], ['cDay1Ok'],
    ['cDay3Lead', 'cDay3NotifOk', 'cDay3GdprOk'], ['cFinal'], ['cReportOk']]);
  assert.deepEqual(logic.captionKeys(atPreset('friday', 4)), ['cDay1Missed']);
  assert.deepEqual(logic.captionKeys(atPreset('friday', 5)), ['cDay3Lead', 'cDay3EwLate', 'cDay3NotifOk', 'cDay3GdprOk']);
  assert.deepEqual(logic.captionKeys(atPreset('friday', 7)), ['cReportMissed', 'cReportOffice']);
  assert.deepEqual(logic.captionKeys(atPreset('found-late', 7)), ['cReportOk', 'cReportGhost']);
  assert.deepEqual(logic.captionKeys(atPreset('data-only', 4)), ['cDay1Gdpr']);
  assert.deepEqual(logic.captionKeys(atPreset('data-only', 5)), ['cDay3Lead', 'cDay3GdprOk']);
  assert.deepEqual(logic.captionKeys(atPreset('data-only', 6)), ['cFinalNone']);
  const none = (n) => logic.captionKeys(at({ significant: false, personal: false }, n));
  assert.deepEqual([3, 4, 5, 6, 7].map(none), [['cAware', 'cAwareNone'], ['cDay1None'], ['cDay3None'], ['cFinalNone'],
    ['cReportNone']]);
  assert.deepEqual(logic.captionKeys(at({ personal: false }, 3)), ['cAware', 'cAwareNis']);
  assert.deepEqual(logic.captionKeys(at({ personal: false }, 5)), ['cDay3Lead', 'cDay3NotifOk']);
});

test('rule 12: the caption keys only a late 72-hour report reaches (built on a hand-made state)', () => {
  const s = structuredClone(at({}, 5));
  for (const c of s.clocks) if (c.id !== 'final') { c.inTime = false; c.late = 3; }
  s.missed = 3; s.met = 0;
  assert.deepEqual(logic.captionKeys(s), ['cDay3Lead', 'cDay3EwLate', 'cDay3NotifMissed', 'cDay3GdprMissed']);
  s.stage = 'final';
  assert.deepEqual(logic.captionKeys(s), ['cFinal', 'cFinalShift']);
});

test('captions: every key the model can name exists in both tables', () => {
  const seen = new Set(['cDay3NotifMissed', 'cDay3GdprMissed', 'cFinalShift']);
  const grid = [];
  for (const significant of [true, false]) for (const personal of [true, false]) for (const reporting of logic.MODES) {
    for (const day of [0, 4, 5]) for (const detect of [0, 23, 24, 30, 120]) grid.push({ significant, personal, reporting, day, hour: 19, detect });
  }
  for (const p of grid.concat(logic.presets.map((x) => x.params))) {
    for (let n = 0; n <= LAST; n++) for (const k of logic.captionKeys(at(p, n))) seen.add(k);
  }
  for (const k of seen) assert.ok(k in strings.hr && k in strings.en, k);
  const all = Object.keys(strings.hr).filter((k) => /^c[A-Z]/.test(k));
  assert.deepEqual(all.filter((k) => !seen.has(k)), [], 'every caption string is reachable');
});

// ── presets (SPEC table) ──

const outcome = (id) => {
  const s = atPreset(id, LAST);
  const f = (c) => !c.running ? 'off' : c.id === 'final' ? 'due ' + c.due : (c.inTime ? 'ok ' + c.filed : 'late ' + c.late);
  return { aware: s.aware, ghost: s.ghost.beforeDetect, clocks: s.clocks.map(f), met: s.met, missed: s.missed };
};

test('preset 1 tuesday (= defaults): everything in time', () => {
  assert.deepEqual(preset('tuesday').params, logic.defaults);
  const o = outcome('tuesday');
  assert.deepEqual(o, { aware: H(1, 10), ghost: -15, clocks: ['ok ' + H(1, 11), 'ok ' + H(1, 14), 'due ' + (32 * 24 + 14), 'ok ' + H(2, 9)], met: 3, missed: 0 });
});

test('preset 2 found-late: the attack ran five days unseen; the clocks still start at awareness', () => {
  const o = outcome('found-late');
  assert.equal(o.aware, H(7, 12));
  assert.equal(o.ghost, 102);
  assert.deepEqual(o.clocks, ['ok ' + H(7, 13), 'ok ' + H(7, 16), 'due ' + (38 * 24 + 16), 'ok ' + H(8, 11)]);
  assert.equal(o.missed, 0);
});

test('preset 3 friday: office hours miss the early warning by 37 h; the 72-hour reports make it', () => {
  const o = outcome('friday');
  assert.equal(o.aware, H(4, 20));
  assert.deepEqual(o.clocks, ['late 37', 'ok ' + H(7, 12), 'due ' + (38 * 24 + 12), 'ok ' + H(7, 15)]);
  assert.deepEqual([o.met, o.missed], [2, 1]);
});

test('preset 4 on-call: the same incident, every report in time', () => {
  const o = outcome('on-call');
  assert.deepEqual(o.clocks, ['ok ' + H(4, 21), 'ok ' + H(5, 0), 'due ' + (36 * 24 + 0), 'ok ' + H(5, 3)]);
  assert.deepEqual([o.met, o.missed], [3, 0]);
});

test('preset 5 slow-triage: 8 hours push awareness past office hours (missed); 2 hours would not', () => {
  const o = outcome('slow-triage');
  assert.equal(o.aware, H(4, 19));
  assert.deepEqual(o.clocks, ['late 38', 'ok ' + H(7, 12), 'due ' + (38 * 24 + 12), 'ok ' + H(7, 15)]);
  const fast = at(Object.assign({}, preset('slow-triage').params, { triage: 2 }), LAST);
  assert.equal(fast.aware, H(4, 13));
  assert.deepEqual([fast.met, fast.missed], [3, 0]);
  assert.equal(logic.clock(fast, 'gdpr').spare, 1);
});

test('preset 6 data-only: not significant, personal data affected: only the GDPR clock runs', () => {
  const o = outcome('data-only');
  assert.deepEqual(o.clocks, ['off', 'off', 'off', 'ok ' + H(4, 11)]);
  assert.deepEqual([o.met, o.missed], [1, 0]);
});

test('presets: ids unique, params valid for the model, at most nine; the entry is a preset', () => {
  const ids = logic.presets.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length >= 3 && ids.length <= 9);
  for (const pr of logic.presets) {
    assert.deepEqual(Object.keys(pr.params).sort(), Object.keys(logic.defaults).sort(), pr.id);
    assert.deepEqual(logic.normalise(pr.params), pr.params, `${pr.id} params are already valid`);
  }
});

// ── strings and the page ──

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every string key the page names exists', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const keys = new Set();
  for (const m of html.matchAll(/\bt(?:\.n|\.parts)?\('([A-Za-z0-9]+)'\s*[,)]/g)) keys.add(m[1]);
  for (let i = 0; i < 7; i++) { keys.add('wd' + i); keys.add('dayL' + i); }
  for (let i = 1; i <= 12; i++) keys.add('mo' + i);
  for (const k of ['Ew', 'Notif', 'Gdpr']) { keys.add('lane' + k); keys.add('lane' + k + 'Sub'); keys.add('name' + k); }
  for (const k of ['Ew', 'Notif', 'Final', 'Gdpr']) { keys.add('row' + k); keys.add('row' + k + 'Sub'); }
  for (const k of ['thClock', 'thStart', 'thDue', 'thFiled', 'thResult']) keys.add(k);
  for (const k of ['prTuesday', 'prFoundLate', 'prFriday', 'prOnCall', 'prSlowTriage', 'prDataOnly']) { keys.add(k); keys.add(k + 'Hint'); }
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
  const p = P(preset('friday').params);
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
