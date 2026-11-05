// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for retention-gfs's model (rules: SPEC.md). Run: node --test sims/retention-gfs/
// Tie-breaks first, then one test per rule, then the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.filter((x) => x.id === id)[0];
const fromPreset = (id) => logic.compute(preset(id).params);
const NONE = { last: 0, daily: 0, weekly: 0, monthly: 0, yearly: 0 };
const K = (over) => Object.assign({}, NONE, over);
/** Every night from a to b (inclusive), at 01:40. */
function nights(a, b) {
  const out = [];
  for (let n = logic.dayNum(a); n <= logic.dayNum(b); n++) out.push(logic.iso(n) + 'T01:40');
  return out;
}
const kept = (r) => Object.keys(r.kept).sort().map((b) => b.slice(0, 10) + ' ' + r.kept[b]);
const keptDates = (s) => s.kept.map((k) => k.date);

// ── tie-breaks ──

test('rule 5 tie-break: two backups on one day, the later one counts for that day', () => {
  const r = logic.prune(['2026-03-02T01:40', '2026-03-02T13:00', '2026-03-01T01:40'], K({ daily: 2 }));
  assert.deepEqual(kept(r), ['2026-03-01 daily', '2026-03-02 daily']);
  assert.ok(r.kept['2026-03-02T13:00']);
  assert.deepEqual(r.removed, ['2026-03-02T01:40']);
});

test('rule 5 tie-break: the earlier one of a kept day is marked, so a later option cannot take it', () => {
  // daily 1 keeps 13:00 and marks 01:40 for removal; weekly then skips the marked one and that week (already covered)
  const r = logic.prune(['2026-03-04T01:40', '2026-03-04T13:00'], K({ daily: 1, weekly: 4 }));
  assert.deepEqual(Object.keys(r.kept), ['2026-03-04T13:00']);
  assert.deepEqual(r.removed, ['2026-03-04T01:40']);
});

test('rule 5 tie-break: a backup an earlier option marked for removal stays removed (a week across two months)', () => {
  // weekly keeps Sun 5 Jul for the week 29 Jun – 5 Jul and marks 29 and 30 Jun; monthly finds June uncovered and
  // takes the newest *unmarked* June backup, 28 Jun, not 30 Jun
  const r = logic.prune(nights('2026-06-20', '2026-07-05'), K({ weekly: 1, monthly: 1 }));
  assert.deepEqual(kept(r), ['2026-06-28 monthly', '2026-07-05 weekly']);
});

test('rule 3 tie-break: a period an earlier option covers is skipped and not counted', () => {
  // 2026-12-25 … 31 daily covers ISO weeks 21–27 Dec (Fri–Sun) and 28 Dec – 3 Jan; weekly 4 starts at 20 Dec
  const r = logic.prune(nights('2026-10-01', '2026-12-31'), K({ daily: 7, weekly: 4 }));
  assert.deepEqual(kept(r).filter((x) => x.endsWith('weekly')), ['2026-11-29 weekly', '2026-12-06 weekly', '2026-12-13 weekly', '2026-12-20 weekly']);
  assert.equal(Object.keys(r.kept).length, 11);
  // the Monday–Thursday of the week 21–27 Dec are not kept by weekly (the week is already covered)
  assert.equal(r.kept['2026-12-24T01:40'], undefined);
});

test('verdict tie-break: a point exactly N days old is clean (the fault appears after that night\'s job)', () => {
  // ul-primjer-6 run: the oldest point (29 Nov) is 32 days old
  assert.equal(S({ monthly: 0, detectAfter: 32 }).verdict.clean, '2026-11-29');
  assert.equal(S({ monthly: 0, detectAfter: 33 }).verdict.clean, null);
  assert.equal(S({ monthly: 0, detectAfter: 32 }).verdict.cleanAge, 32);
});

test('largest gap tie-break: of equal gaps, the oldest is reported', () => {
  // 7 daily + 4 weekly: three 7-day gaps (29 Nov → 6 Dec → 13 Dec → 20 Dec), then 5 days to 25 Dec
  const s = fromPreset('ul-primjer-6');
  assert.deepEqual(s.gap, { days: 7, from: '2026-11-29', to: '2026-12-06' });
});

// ── rules ──

test('rule 1: options apply in the order last, daily, weekly, monthly, yearly', () => {
  const r = logic.prune(nights('2026-12-01', '2026-12-31'), K({ last: 3, daily: 2 }));
  // last takes the 3 newest, daily the 2 days older than those, not the other way round
  assert.deepEqual(kept(r), ['2026-12-27 daily', '2026-12-28 daily', '2026-12-29 last', '2026-12-30 last', '2026-12-31 last']);
  assert.deepEqual(logic.RULES, ['last', 'daily', 'weekly', 'monthly', 'yearly']);
});

test('rule 2: daily = newest of each day; weekly = ISO weeks (Mon–Sun); monthly = months; yearly = years', () => {
  assert.equal(logic.periodOf('daily', '2026-05-05T01:40'), '2026-05-05');
  // ISO week: Sunday 2026-01-04 and Monday 2025-12-29 are one week; Monday 2026-01-05 starts the next
  assert.equal(logic.periodOf('weekly', '2026-01-04T01:40'), logic.periodOf('weekly', '2025-12-29T01:40'));
  assert.notEqual(logic.periodOf('weekly', '2026-01-04T01:40'), logic.periodOf('weekly', '2026-01-05T01:40'));
  assert.equal(logic.periodOf('monthly', '2026-02-28T01:40'), '2026-02');
  assert.equal(logic.periodOf('yearly', '2026-02-28T01:40'), '2026');
  const r = logic.prune(nights('2026-06-01', '2026-06-30'), K({ weekly: 2 }));
  // the newest backup of each week: Tuesday 30 Jun for the week still running, Sunday 28 Jun for the one before
  assert.deepEqual(kept(r), ['2026-06-28 weekly', '2026-06-30 weekly']);
  const y = logic.prune(['2024-07-01T01:40', '2025-03-01T01:40', '2025-12-31T01:40', '2026-01-01T01:40'], K({ yearly: 3 }));
  assert.deepEqual(kept(y), ['2024-07-01 yearly', '2025-12-31 yearly', '2026-01-01 yearly']);
});

test('rule 2: an option stops at its count; older backups it never reached go to the next option', () => {
  const r = logic.prune(nights('2026-03-01', '2026-03-31'), K({ daily: 3, monthly: 1 }));
  // nothing in March is older than an uncovered month: monthly finds no new period, the rest is removed
  assert.deepEqual(kept(r), ['2026-03-29 daily', '2026-03-30 daily', '2026-03-31 daily']);
  const r2 = logic.prune(nights('2026-02-20', '2026-03-03'), K({ daily: 3, monthly: 1 }));
  assert.deepEqual(kept(r2), ['2026-02-28 monthly', '2026-03-01 daily', '2026-03-02 daily', '2026-03-03 daily']);
});

test('rule 3: 7 daily + 4 weekly = 11 points reaching 32 days, not 11 weeks', () => {
  const s = S({ monthly: 0 });
  assert.equal(s.copies, 11);
  assert.equal(s.oldestAge, 32);
  assert.ok(s.oldestAge < 11 * 7);
});

test('rule 4: a failed job adds nothing and prunes nothing', () => {
  const ok = fromPreset('dr-vm-dumps');
  const failing = fromPreset('dr-vm-dumps-failing');
  assert.deepEqual(keptDates(failing), keptDates(ok));
  assert.equal(failing.failing, true);
  assert.equal(failing.failedDays[0], '2026-09-14');
  assert.equal(failing.failedDays.length, 49);
  assert.equal(failing.backups[failing.backups.length - 1], '2026-09-13');
  assert.equal(S({ monthly: 0, failFrom: '2026-09-14', day: logic.dayOfYear('2026-09-13') }).failing, false);
});

test('rule 6: the prune is progressive; January\'s monthly point is 25 Jan, not 31 Jan', () => {
  const s = fromPreset('gfs-7-4-12');
  const jan = s.kept.filter((k) => k.date.startsWith('2026-01'));
  assert.deepEqual(jan, [{ date: '2026-01-25', rule: 'monthly', age: 340 }]);
  // one prune over all 365 nights at once (not progressive) would keep 31 Jan instead
  const once = logic.prune(nights('2026-01-01', '2026-12-31'), K({ daily: 7, weekly: 4, monthly: 12 }));
  assert.equal(once.kept['2026-01-31T01:40'], 'monthly');
  assert.equal(once.kept['2026-01-25T01:40'], undefined);
});

test('rule 7: with no option set, nothing is pruned', () => {
  const r = logic.prune(nights('2026-01-01', '2026-01-10'), NONE);
  assert.equal(Object.keys(r.kept).length, 10);
  assert.ok(Object.values(r.kept).every((x) => x === 'all'));
  const s = S(NONE);
  assert.equal(s.copies, 365);
  assert.equal(s.byRule.all, 365);
  assert.equal(logic.captionKey(s, null).key, 'sAll');
});

test('stats: oldest, newest, gap; a run stopped mid-year counts from that day', () => {
  const s = S({ day: logic.dayOfYear('2026-03-15') });
  assert.equal(s.today, '2026-03-15');
  assert.equal(s.newestAge, 0);
  assert.equal(s.backups.length, 74);
  assert.equal(s.copies + s.pruned.length, s.backups.length);
  assert.equal(s.oldest, '2026-01-25');           // January's monthly already
  const one = S({ day: 1 });
  assert.equal(one.copies, 1);
  assert.equal(one.gap, null);
});

test('rule 3: coverage counts every earlier option, not only the one just before', () => {
  // June is covered only by daily (two options before monthly): monthly must not keep 2 Jun
  const r = logic.prune(nights('2026-05-20', '2026-06-09'), K({ daily: 7, weekly: 1, monthly: 1 }));
  assert.deepEqual(kept(r), ['2026-05-31 weekly', '2026-06-03 daily', '2026-06-04 daily', '2026-06-05 daily',
    '2026-06-06 daily', '2026-06-07 daily', '2026-06-08 daily', '2026-06-09 daily']);
});

test('verdict: the restore goes to the newest clean point; detectAfter 1 is on', () => {
  const v = S({ detectAfter: 42 }).verdict;          // 7 + 4 + 12: 29 Nov is 32 days old, 25 Oct 67
  assert.equal(v.clean, '2026-10-25');
  assert.equal(v.cleanAge, 67);
  assert.deepEqual(S({ detectAfter: 1 }).verdict, { after: 1, faultDate: '2026-12-30', clean: '2026-12-30', cleanAge: 1 });
  assert.equal(S({ detectAfter: 0 }).verdict, null);
  // a fault before the run's start: the date is in 2025 and nothing is clean
  assert.deepEqual(S({ day: 30, detectAfter: 42 }).verdict, { after: 42, faultDate: '2025-12-19', clean: null, cleanAge: null });
});

test('short: why a rule keeps fewer than asked (periods so far, and how many earlier rules cover)', () => {
  assert.deepEqual(fromPreset('gfs-7-4-12').short, { rule: 'monthly', asked: 12, got: 10, total: 12, covered: 2 });
  assert.deepEqual(S({ last: 30, daily: 0, weekly: 0, monthly: 0, day: 10 }).short, { rule: 'last', asked: 30, got: 10, total: 10, covered: 0 });
  assert.deepEqual(S({ day: 74 }).short, { rule: 'monthly', asked: 12, got: 1, total: 3, covered: 2 });
  assert.equal(fromPreset('ul-primjer-6').short, null);
  assert.equal(S(NONE).short, null);
});

test('captions: failing first, before the empty policy; a preset load (several params) is not one change', () => {
  assert.equal(logic.captionKey(S(Object.assign({}, NONE, { failFrom: '2026-09-14' })), null).key, 'sFailing');
  assert.equal(logic.captionKey(fromPreset('gfs-7-4-12'), preset('last-30').params).change, null);
  assert.equal(logic.captionKey(S({ day: 100 }), P({})).change, 'day');
});

// ── the presets' numbers (SPEC.md) ──

test('preset ul-primjer-6: 11 points, oldest 32 days, no clean point for a fault 42 days back', () => {
  const s = fromPreset('ul-primjer-6');
  assert.deepEqual(keptDates(s), ['2026-11-29', '2026-12-06', '2026-12-13', '2026-12-20',
    '2026-12-25', '2026-12-26', '2026-12-27', '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31']);
  assert.equal(s.oldestAge, 32);
  assert.deepEqual(s.verdict, { after: 42, faultDate: '2026-11-19', clean: null, cleanAge: null });
});

test('preset gfs-7-4-12: 21 points (7 + 4 + 10), oldest 25 Jan, 340 days; largest gap 35 days', () => {
  const s = fromPreset('gfs-7-4-12');
  assert.equal(s.copies, 21);
  assert.deepEqual([s.byRule.daily, s.byRule.weekly, s.byRule.monthly], [7, 4, 10]);
  assert.equal(s.oldest, '2026-01-25');
  assert.equal(s.oldestAge, 340);
  assert.deepEqual(s.gap, { days: 35, from: '2026-02-22', to: '2026-03-29' });
  assert.equal(logic.captionKey(s, null).short, 'monthly');
});

test('preset last-30: 30 points, oldest 29 days', () => {
  const s = fromPreset('last-30');
  assert.equal(s.copies, 30);
  assert.equal(s.oldestAge, 29);
  assert.ok(s.copies > fromPreset('gfs-7-4-12').copies);
});

test('preset dr-vm-dumps: 16 Aug … 6 Sep weekly, 7 … 13 Sep daily, 11 in all', () => {
  const s = fromPreset('dr-vm-dumps');
  assert.deepEqual(s.kept.map((k) => k.date + ' ' + k.rule), [
    '2026-08-16 weekly', '2026-08-23 weekly', '2026-08-30 weekly', '2026-09-06 weekly',
    '2026-09-07 daily', '2026-09-08 daily', '2026-09-09 daily', '2026-09-10 daily', '2026-09-11 daily',
    '2026-09-12 daily', '2026-09-13 daily']);
  // the task runs it from 1 Aug; from 1 Jan the set is the same (no monthly rule)
  const fromAug = logic.run(K({ daily: 7, weekly: 4 }), logic.dayNum('2026-08-01'), logic.dayNum('2026-09-13'), null);
  assert.deepEqual(Object.keys(fromAug.kept).sort().map((b) => b.slice(0, 10)), keptDates(s));
});

test('preset dr-vm-dumps-failing: the same 11, the newest 49 days old', () => {
  const s = fromPreset('dr-vm-dumps-failing');
  assert.equal(s.today, '2026-11-01');
  assert.equal(s.copies, 11);
  assert.equal(s.newest, '2026-09-13');
  assert.equal(s.newestAge, 49);
  assert.equal(logic.captionKey(s, null).key, 'sFailing');
});

// ── calendar arithmetic (no Date in the model) ──

test('calendar: day numbers, ISO weekday and week start', () => {
  assert.equal(logic.dayOf(1970, 1, 1), 0);
  assert.equal(logic.iso(logic.dayOf(2026, 12, 31)), '2026-12-31');
  assert.equal(logic.DAYS, 365);
  assert.equal(logic.weekday(logic.dayNum('2026-01-01')), 4);        // Thursday
  assert.equal(logic.weekday(logic.dayNum('2026-09-13')), 7);        // Sunday
  assert.equal(logic.iso(logic.weekStart(logic.dayNum('2026-01-01'))), '2025-12-29');
  assert.equal(logic.dayOfYear('2026-09-13'), 256);
  for (let n = logic.dayNum('2024-01-01'); n < logic.dayNum('2028-12-31'); n += 37) assert.equal(logic.dayNum(logic.iso(n)), n);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const pr of logic.presets) {
    const s = fromPreset(pr.id);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic, does not mutate its params, and cleans bad input', () => {
  const p = P({ last: 2, yearly: 1, detectAfter: 9 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.deepEqual(kit.stateAt(logic, p, 0), logic.initial(p));
  assert.deepEqual(logic.norm({ daily: 99, weekly: -3, failFrom: 'x', day: 0, detectAfter: 'q' }),
    Object.assign({}, logic.defaults, { daily: 14, weekly: 0, day: 1 }));
  assert.deepEqual(logic.norm({ daily: '5' }).daily, 5);
  assert.deepEqual(logic.norm({ last: 99, daily: 99, weekly: 99, monthly: 99, yearly: 99, detectAfter: 999, day: 999 }),
    { last: 30, daily: 14, weekly: 8, monthly: 24, yearly: 5, failFrom: 'none', detectAfter: 400, day: 365 });
  assert.deepEqual(logic.compute({}), logic.compute(logic.defaults));
});

test('changed: points that appear and disappear after a change', () => {
  const a = S({ monthly: 0 }), b = S({ monthly: 0, weekly: 5 });
  assert.deepEqual(logic.changed(b, a), { appeared: ['2026-11-22'], gone: [] });
  assert.deepEqual(logic.changed(a, b), { appeared: [], gone: ['2026-11-22'] });
  assert.deepEqual(logic.changed(a, null), { appeared: [], gone: [] });
  assert.equal(logic.captionKey(b, P({ monthly: 0 })).change, 'weekly');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every caption key, rule and preset has its strings; the page is an explorer; preset params are known params', () => {
  const keys = ['sPlain', 'sShortCovered', 'sShortRun', 'sAll', 'sNone', 'sFailing', 'vcNo', 'vcYes', 'chRule'];
  for (const key of keys) assert.ok(key in strings.hr && key in strings.en, key);
  for (const r of logic.RULES) for (const pre of ['tag-', 'adj-', 'rule-', 'per-', 'c-']) assert.ok((pre + r) in strings.hr, pre + r);
  for (const f of logic.FAIL_IDS) assert.ok(('fail-' + f) in strings.hr, f);
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const pr of logic.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
    assert.deepEqual(logic.norm(pr.params), pr.params, `${pr.id} params are valid values`);
    assert.ok(html.includes(`'${pr.id}'`), `page labels preset ${pr.id}`);
  }
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  for (const e of sim.entries || []) assert.ok(preset(e.preset), e.preset);
});
