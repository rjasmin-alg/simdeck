// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-retention-hold. Run: node --test sims/cmp-retention-hold/
// Rules and expected numbers: SPEC.md. Tie-breaks and boundaries first, then the rules in order, the presets (checked
// against the Python re-implementation in SPEC.md), and the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => L.normalise(Object.assign({}, L.defaults, over));
const S = (over) => L.compute(Object.assign({}, L.defaults, over));
const preset = (id) => L.presets.find((x) => x.id === id).params;
const rec = (id) => L.RECORDS.find((x) => x.id === id);
const read = (id, over, nowM) => L.readRecord(rec(id), P(over), nowM === undefined ? L.MONTHS - 1 : nowM);
const byId = (s, id) => s.recs.find((x) => x.id === id);
const HELD = { purge: 'monthly', dispute: 'customer', hold: 'held' };   // dispute 2027–2029: months 84…119

// ── tie-breaks and boundaries first ──

test('rule 4: deleted in the due month itself is on time; the month before it stays', () => {
  const x = read('sjever', { purge: 'monthly' });                     // trigger 17 + 60 = due 77
  assert.equal(x.due, 77);
  assert.equal(x.del, 77);
  assert.equal(x.status, 'onTime');
  assert.equal(x.over, 0);
  assert.equal(read('sjever', { purge: 'monthly' }, 76).status, 'kept');
  assert.equal(read('sjever', { purge: 'monthly' }, 77).status, 'onTime');
});

test('rule 5: the dispute runs [from, to): the hold in the routine is lifted in month `to`, and deletion follows that month', () => {
  const p = P(HELD);
  assert.deepEqual(L.span(p), { from: 84, to: 120 });
  const lipa = rec('lipa');
  assert.equal(L.skipped(lipa, 119, p, L.span(p)), true);
  assert.equal(L.skipped(lipa, 120, p, L.span(p)), false);
  assert.equal(L.skipped(lipa, 83, p, L.span(p)), false);
  assert.equal(L.life(lipa, p).del, 120);
  // needed through the last month of the dispute, not in `to`
  assert.equal(L.needed(lipa, 97, 119, p, L.span(p)), true);
  assert.equal(L.needed(lipa, 97, 120, p, L.span(p)), false);
  assert.equal(read('lipa', HELD).status, 'onTime');
});

test('rule 7: an erased record is in the backups while now < deletion + backup; the last month is deletion + backup − 1', () => {
  const p = { purge: 'monthly', backup: 12 };
  const d = read('sjever', p).del;                                     // 77
  assert.equal(read('sjever', p, d + 11).inBackup, true);
  assert.equal(read('sjever', p, d + 12).inBackup, false);
  assert.equal(read('sjever', p, d).backupUntil, d + 11);
  assert.equal(read('sjever', p, d - 1).inBackup, false, 'not yet deleted');
});

test('rule 9: a period or backup from a URL goes to the nearest listed value; a tie goes to the smaller', () => {
  assert.equal(P({ retApp: 4.5 }).retApp, 3);
  assert.equal(P({ retApp: 5 }).retApp, 6);
  assert.equal(P({ backup: 90 }).backup, 60);
  assert.equal(P({ backup: 91 }).backup, 120);
  assert.equal(P({ retContract: 1000 }).retContract, 120);
});

test('rule 4: once a year runs only in January; every month always; none never', () => {
  for (let m = 0; m < L.MONTHS; m++) {
    assert.equal(L.runs('yearly', m), m % 12 === 0);
    assert.equal(L.runs('monthly', m), true);
    assert.equal(L.runs('none', m), false);
  }
  const x = read('sjever', { purge: 'yearly' });                       // due 77 (June 2026) → January 2027
  assert.equal(x.del, 84);
  assert.equal(x.status, 'late');
  assert.equal(x.over, 7);
});

test('rule 7: boundaries: at the trigger month the record is kept, at the due month (no routine) kept too long', () => {
  assert.equal(read('sjever', {}, 16).status, 'active');
  assert.equal(read('sjever', {}, 17).status, 'kept');
  assert.equal(read('sjever', {}, 76).status, 'kept');
  assert.equal(read('sjever', {}, 77).status, 'tooLong');
  assert.equal(read('sjever', {}, 77).over, 1);
});

test('rule 7: one month past the date is already late', () => {
  const x = read('kvadrat', { purge: 'yearly', retContract: 12 });       // due 131 (December 2030) → January 2031
  assert.equal(x.due, 131);
  assert.equal(x.del, 132);
  assert.equal(x.over, 1);
  assert.equal(x.status, 'late');
});

// ── the rules in order ──

test('rules 1–2: thirteen records in three classes; only those that exist by the read month are counted', () => {
  assert.equal(L.RECORDS.length, 13);
  assert.deepEqual(L.CLASSES.map((c) => L.RECORDS.filter((r) => r.cls === c).length), [4, 5, 4]);
  for (const r of L.RECORDS) assert.ok(r.from <= r.trigger, r.id);
  assert.equal(S({ now: 2031 }).recs.length, 13);
  const s20 = S({ now: 2020 });                                        // month 11: those from ≤ 11
  assert.equal(s20.now, 11);
  assert.deepEqual(s20.recs.map((x) => x.id), L.RECORDS.filter((r) => r.from <= 11).map((r) => r.id));
  // each dispute touches exactly one record
  assert.deepEqual(L.RECORDS.filter((r) => r.dispute === 'customer').map((r) => r.id), ['lipa']);
  assert.deepEqual(L.RECORDS.filter((r) => r.dispute === 'employee').map((r) => r.id), ['marko']);
});

test('rule 3: the due month is trigger + the class\'s period; each class reads its own param', () => {
  assert.equal(L.life(rec('a2022'), P({ retApp: 36 })).due, 29 + 36);
  assert.equal(L.life(rec('most'), P({ retContract: 24 })).due, 58 + 24);
  assert.equal(L.life(rec('petra'), P({ retStaff: 12 })).due, 72 + 12);
  assert.equal(L.life(rec('petra'), P({ retApp: 3, retContract: 12 })).due, 72 + 72, 'other classes\' periods do not move it');
});

test('rule 5: what each hold skips', () => {
  const sp = { from: 84, to: 120 };
  const lipa = rec('lipa'), most = rec('most');
  const sk = (hold, r, m) => L.skipped(r, m, P({ dispute: 'customer', hold }), sp);
  for (const m of [83, 84, 119, 120, 143]) {
    assert.equal(sk('paper', lipa, m), false, 'paper never');
    assert.equal(sk('held', lipa, m), m >= 84 && m < 120, 'held ' + m);
    assert.equal(sk('held', most, m), false, 'held: only the touched record');
    assert.equal(sk('forgotten', lipa, m), m >= 84, 'forgotten ' + m);
    assert.equal(sk('forgotten', most, m), false);
    assert.equal(sk('all', most, m), m >= 84 && m < 120, 'all ' + m);
  }
  // without a dispute nothing is skipped, whatever the hold says
  assert.equal(L.skipped(lipa, 100, P({ dispute: 'none', hold: 'forgotten' }), null), false);
  // a dispute touches only its own record
  assert.equal(L.skipped(lipa, 100, P({ dispute: 'employee', hold: 'held' }), sp), false);
  assert.equal(L.skipped(rec('marko'), 100, P({ dispute: 'employee', hold: 'held' }), sp), true);
});

test('rule 6: needed before due or while the dispute that touches it runs; a hold alone does not make it needed', () => {
  const p = P({ purge: 'monthly', dispute: 'customer', hold: 'forgotten' });
  const sp = L.span(p);
  assert.equal(L.needed(rec('lipa'), 97, 96, p, sp), true);
  assert.equal(L.needed(rec('lipa'), 97, 100, p, sp), true);
  assert.equal(L.needed(rec('lipa'), 97, 125, p, sp), false);
  assert.equal(L.needed(rec('most'), 118, 119, p, sp), false, 'the dispute does not touch Most');
  const x = read('lipa', { purge: 'monthly', dispute: 'customer', hold: 'forgotten' });
  assert.equal(x.del, null);
  assert.equal(x.status, 'tooLong');
  assert.equal(x.over, 143 - 120 + 1);
  assert.equal(read('lipa', { purge: 'monthly', dispute: 'customer', hold: 'forgotten' }, 110).status, 'held');
});

test('rule 7: deleted while the dispute needs it is underHold; a hold on everything makes others late; before the dispute is not', () => {
  assert.equal(read('lipa', { purge: 'monthly', dispute: 'customer', hold: 'paper' }).status, 'underHold');
  assert.equal(read('lipa', { purge: 'monthly', dispute: 'customer', hold: 'paper' }).del, 97);
  const all = { purge: 'monthly', dispute: 'customer', hold: 'all' };
  assert.equal(read('marko', all).status, 'late');
  assert.equal(read('marko', all).over, 120 - 99);
  assert.equal(read('marko', all).del, 120);
  assert.equal(read('lipa', all).status, 'onTime', 'the touched one is needed while held');
  // the dispute starts after Lipa's deletion: deleted on time, not during the dispute
  assert.equal(read('lipa', { purge: 'monthly', dispute: 'customer', hold: 'paper', from: 2029 }).status, 'onTime');
  // a record not yet at its trigger is active; between trigger and due it is kept
  assert.equal(read('kvadrat', {}, 100).status, 'active');
  assert.equal(read('kvadrat', {}, 130).status, 'kept');
});

test('rule 7: segments are clipped to the read month, merged, and their over length is the over count', () => {
  const x = read('a2020', {}, 40);                                     // no routine: due 14, over months 14…40
  assert.deepEqual(x.segs, [{ k: 'use', a: 0, b: 2 }, { k: 'keep', a: 2, b: 14 }, { k: 'over', a: 14, b: 41 }]);
  assert.equal(x.over, 27);
  const y = read('lipa', { purge: 'monthly', dispute: 'customer', hold: 'forgotten' });
  assert.deepEqual(y.segs.map((g) => g.k), ['use', 'keep', 'need', 'over']);
  assert.deepEqual(y.segs[2], { k: 'need', a: 97, b: 120 });
  assert.equal(y.segs[3].b - y.segs[3].a, y.over);
  const z = read('sjever', { purge: 'monthly', backup: 120 }, 100);    // deleted 77, the backup bar to the read month
  assert.deepEqual(z.segs[z.segs.length - 1], { k: 'backup', a: 77, b: 101 });
  for (const s of [S(preset('none')), S(preset('forgotten')), S({ purge: 'yearly', now: 2026 })]) {
    for (const r of s.recs) {
      const sum = r.segs.filter((g) => g.k === 'over').reduce((a, g) => a + g.b - g.a, 0);
      assert.equal(sum, r.over, r.id);
      for (const g of r.segs) assert.ok(g.a < g.b && g.b <= s.now + 1, r.id + ' ' + g.k);
    }
  }
});

test('rule 8: the numbers: records kept too long count late ones too; the last month in the backups', () => {
  const m = S({ purge: 'monthly', dispute: 'customer', hold: 'all' }).m;
  assert.equal(m.counts.tooLong, 0);
  assert.equal(m.counts.late, 3);
  assert.equal(m.overRecords, 3);
  assert.equal(m.over, 33);
  assert.equal(m.waitMax, 0, 'every delay here is the hold\'s, not the routine\'s');
  const y = S({ purge: 'yearly' }).m;
  assert.equal(y.waitMax, 11);
  assert.equal(y.over, 66);
  assert.equal(y.deleted, 9);
  assert.equal(y.counts.late, 9);
  // once a year with a hold on everything: the routine's own wait stays within 11 months
  assert.ok(S({ purge: 'yearly', dispute: 'customer', hold: 'all' }).m.waitMax <= 11);
  const a = S(preset('archive')).m;
  assert.equal(a.inBackup, 9);
  assert.equal(a.lastBackup, 139 + 120 - 1);                           // Orbita, deleted 08/2031
});

test('rule 9: params from a URL are made safe', () => {
  const p = L.normalise({ now: '2040', purge: 'weekly', dispute: 'x', hold: '', from: '-3', years: 9.6, retApp: 'abc', backup: null });
  assert.deepEqual(p, Object.assign({}, L.defaults, { now: 2031, from: 2020, years: 5 }));
  assert.equal(L.normalise({ now: 2025.4 }).now, 2025);
  assert.equal(L.normalise({ years: 0 }).years, 1);
});

test('rule 9: a stepper moves along its list and stays at the ends; off-list values start from the nearest', () => {
  assert.equal(L.stepList(L.BACKUP_STEPS, 12, 1), 24);
  assert.equal(L.stepList(L.BACKUP_STEPS, 12, -1), 6);
  assert.equal(L.stepList(L.BACKUP_STEPS, 120, 1), 120);
  assert.equal(L.stepList(L.BACKUP_STEPS, 1, -1), 1);
  assert.equal(L.stepList(L.RET_STEPS.staff, 72, 1), 120);
  assert.equal(L.stepList(L.RET_STEPS.app, 13, 1), 24);
});

test('rule 10: caption notes, in order, at most two', () => {
  const notes = (over) => L.captionKey(S(over)).notes;
  assert.deepEqual(notes(preset('none')), ['nNone']);
  assert.deepEqual(notes(preset('routine')), ['nBackup']);
  assert.deepEqual(notes(preset('paper')), ['nPaper', 'nBackup']);
  assert.deepEqual(notes(preset('held')), ['nHeld', 'nBackup']);
  assert.deepEqual(notes(preset('forgotten')), ['nForgotten', 'nBackup']);
  assert.deepEqual(notes(preset('archive')), ['nBackup']);
  assert.deepEqual(notes({ purge: 'monthly', dispute: 'customer', hold: 'all' }), ['nAll', 'nBackup']);
  assert.deepEqual(notes({ purge: 'yearly' }), ['nYearly']);
  assert.deepEqual(notes(Object.assign({}, HELD, { from: 2029 })), ['nGone', 'nBackup']);
  // a dispute that has not started by the read year says nothing
  assert.deepEqual(notes(Object.assign({}, HELD, { now: 2026 })), ['nBackup']);
  // the hold in the routine, before Lipa's due month: nothing held yet
  assert.deepEqual(notes(Object.assign({}, HELD, { now: 2027 })), [], 'the 2026 deletions aged out of the backups by the end of 2027');
  // a dispute that starts after the read year, after the record was deleted: not "gone before the dispute" yet
  assert.deepEqual(notes(Object.assign({}, HELD, { from: 2030, now: 2029 })), ['nBackup']);
  // the record falls due after the dispute ended: the hold held nothing
  assert.deepEqual(notes(Object.assign({}, HELD, { years: 1 })), ['nBackup']);
  // no routine and a dispute with the hold announced only: the record is kept anyway, so the dispute note is silent
  assert.deepEqual(notes({ purge: 'none', dispute: 'customer', hold: 'paper' }), ['nNone']);
  // three candidates: the dispute note and the routine note come first, the backup note is dropped
  const three = L.captionKey(S({ purge: 'yearly', dispute: 'customer', hold: 'paper', backup: 120 }));
  assert.deepEqual(three.notes, ['nPaper', 'nYearly']);
  assert.equal(L.captionKey(S({})).key, 'capMain');
});

test('the presets match SPEC.md\'s table', () => {
  const want = {
    none: [3, 10, 582, 0, 0, 0, 0, null],
    routine: [3, 0, 0, 10, 10, 0, 1, 150],
    paper: [3, 0, 0, 10, 9, 1, 1, 150],
    held: [3, 0, 0, 10, 10, 0, 1, 150],
    forgotten: [3, 1, 24, 9, 9, 0, 1, 150],
    archive: [3, 0, 0, 10, 10, 0, 9, 258]
  };
  assert.deepEqual(L.presets.map((x) => x.id), Object.keys(want));
  for (const x of L.presets) {
    const m = L.compute(x.params).m, c = m.counts;
    assert.deepEqual([c.active + c.kept + c.held, m.overRecords, m.over, m.deleted, c.onTime, c.underHold, m.inBackup, m.lastBackup],
      want[x.id], x.id);
  }
  const late = S({ purge: 'monthly', dispute: 'customer', hold: 'held', now: 2028 }).m;
  assert.deepEqual([late.counts.active + late.counts.kept + late.counts.held, late.deleted, late.inBackup, late.lastBackup], [7, 6, 1, 110]);
});

test('review: boundaries and guards the first tests missed', () => {
  // needed from the dispute's first month on
  const pe = P({ dispute: 'employee', hold: 'paper', from: 2025, years: 2 });
  assert.equal(L.needed(rec('marko'), 50, 60, pe, L.span(pe)), true);
  assert.equal(L.needed(rec('marko'), 50, 59, pe, L.span(pe)), false);
  // a deletion in the window's last month is found
  assert.equal(L.life(rec('kvadrat'), P({ purge: 'monthly', retContract: 24 })).del, 143);
  // no zero-width segments anywhere
  for (const over of [{}, preset('forgotten'), { purge: 'yearly', now: 2023 }, { purge: 'monthly', backup: 1, now: 2021 }])
    for (const x of S(over).recs) for (const g of x.segs) assert.ok(g.b > g.a, x.id + ' ' + g.k);
  // a dispute touches only its own record
  assert.equal(byId(S({ dispute: 'employee' }), 'lipa').touched, false);
  assert.equal(byId(S({ dispute: 'employee' }), 'marko').touched, true);
  assert.equal(byId(S({ dispute: 'none' }), 'lipa').touched, false);
  assert.equal(L.touchedRecord(S({})), null);
  assert.equal(L.touchedRecord(S({ dispute: 'customer' })).id, 'lipa');
  // the dispute's start is clamped
  assert.equal(P({ from: 2045 }).from, 2031);
  assert.equal(P({ from: '' }).from, 2027);
});

test('review: caption guards', () => {
  const notes = (over) => L.captionKey(S(over)).notes;
  // deleted exactly in the dispute's first month: during the dispute, not before it
  const at = { purge: 'monthly', dispute: 'customer', hold: 'paper', retContract: 60, from: 2028 };  // Lipa due 97 = 02/2028; dispute from 96
  assert.equal(byId(S(at), 'lipa').status, 'underHold');
  const first = { purge: 'yearly', dispute: 'customer', hold: 'paper', retContract: 12, from: 2024 }; // due 49 → January 2025 = 60
  assert.equal(byId(S(Object.assign({}, first, { from: 2025 })), 'lipa').del, 60);
  assert.equal(notes(Object.assign({}, first, { from: 2025 }))[0], 'nPaper');
  // deleted 01/2025, the dispute from 01/2026: with backups kept 24 months it is still in them, with 12 just aged out
  assert.equal(notes(Object.assign({}, first, { from: 2026, backup: 24 }))[0], 'nGone');
  assert.equal(notes(Object.assign({}, first, { from: 2026, backup: 12 }))[0], 'nGoneAged');
  // the dispute starting in the read year has started
  assert.equal(notes({ purge: 'monthly', dispute: 'customer', hold: 'paper', from: 2028, now: 2028 })[0], 'nPaper');
  // nHeld only with the routine every month, not for a hold on everything, and only when the due month is inside
  assert.ok(!notes({ purge: 'none', dispute: 'customer', hold: 'held' }).includes('nHeld'));
  assert.ok(!notes({ purge: 'yearly', dispute: 'customer', hold: 'held' }).includes('nHeld'));
  assert.ok(!notes({ purge: 'monthly', dispute: 'customer', hold: 'all', retApp: 3, retStaff: 12, retContract: 60, from: 2027 })
    .includes('nHeld') || L.allDelayed(S({ purge: 'monthly', dispute: 'customer', hold: 'all' })) > 0);
  assert.ok(!notes({ purge: 'monthly', dispute: 'customer', hold: 'held', from: 2029 }).includes('nHeld'), 'due before the dispute');
  assert.equal(notes({ purge: 'monthly', dispute: 'customer', hold: 'forgotten', now: 2028 })[0], 'nHeld');
  // nAll: only records the hold delayed, after it was lifted, and only with a routine
  assert.ok(!notes({ purge: 'none', dispute: 'customer', hold: 'all' }).includes('nAll'));
  assert.ok(!notes({ purge: 'monthly', dispute: 'customer', hold: 'all', now: 2028 }).includes('nAll'));
  assert.equal(L.allDelayed(S({ purge: 'monthly', dispute: 'customer', hold: 'all' })), 3);
  // once a year, late for the routine's own reasons is not the hold's delay
  const ya = S({ purge: 'yearly', dispute: 'customer', hold: 'all' });
  assert.equal(L.allDelayed(ya), ya.recs.filter((x) => !x.touched && x.del === 120).length);
  assert.ok(ya.recs.filter((x) => x.status === 'late' && !x.touched).length > L.allDelayed(ya));
  // nNone needs records kept too long; nYearly a wait the routine caused
  assert.deepEqual(notes({ now: 2020 }), []);
  assert.deepEqual(notes({ purge: 'yearly', retApp: 12, now: 2020 }), []);
  // nForgotten counts only the months after the dispute ended
  const f = S({ purge: 'yearly', dispute: 'customer', hold: 'forgotten', from: 2029, years: 1 });
  assert.equal(L.overFrom(byId(f, 'lipa'), f.span.to), 24);
  assert.ok(byId(f, 'lipa').over > 24);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [L.defaults].concat(L.presets.map((x) => x.params))) {
    const s = L.initial(Object.assign({}, p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = Object.assign({}, preset('forgotten'));
  const copy = structuredClone(p);
  assert.deepEqual(L.compute(p), L.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(L, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every class, status, preset, caption and note has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  assert.match(html, /<script src="strings\.js"><\/script>\s*<script src="sim\.js"><\/script>/);
  const keys = ['capMain', 'nPaper', 'nGone', 'nForgotten', 'nAll', 'nHeld', 'nNone', 'nYearly', 'nBackup'];
  const statuses = ['active', 'kept', 'held', 'tooLong', 'onTime', 'late', 'underHold'];
  for (const lang of ['hr', 'en']) {
    for (const c of L.CLASSES) for (const k of ['cls_', 'trig_', 'rec_']) assert.ok(strings[lang][k + c], `${lang} ${k}${c}`);
    for (const st of statuses) assert.ok(strings[lang]['st_' + st], `${lang} st_${st}`);
    for (const k of keys) assert.ok(strings[lang][k], `${lang} ${k}`);
    for (const x of L.presets) {
      const k = 'p' + x.id[0].toUpperCase() + x.id.slice(1);
      assert.ok(strings[lang][k], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][k + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});
