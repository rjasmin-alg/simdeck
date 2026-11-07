// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-data-subject-request's model (SPEC.md). Run: node --test sims/cmp-data-subject-request/sim.test.js
// Tie-breaks and boundaries first, then rules 1–10, the presets against SPEC.md, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const at = (over, n) => kit.stateAt(L, P(over), n);
const ids = (xs) => xs.map((x) => x.id);
const ymd = (day) => { const d = L.dateOf(day); return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`; };

// ── tie-breaks and boundaries ──

test('tie-break: an answer on the due day itself is on time; one day later is late', () => {
  const due = at({ map: 'good', noticed: 14 }, 10);           // 14 + 1 + 14 + 2 = 31
  assert.equal(due.answer, L.DUE);
  assert.equal(due.onTime, true);
  assert.equal(due.late, 0);
  assert.deepEqual(L.captionKeys(due), ['cAnswerOnDue', 'cAccessAll']);
  const late = at({ map: 'good', noticed: 15 }, 10);
  assert.equal(late.answer, L.DUE + 1);
  assert.equal(late.onTime, false);
  assert.equal(late.late, 1);
  assert.equal(L.captionKeys(late)[0], 'cAnswerLate');
});

test('tie-break: a month later is the same day of the month, or the last day when the month is shorter', () => {
  assert.equal(ymd(L.addMonths(0, 1)), '2027-04-01');
  const mar31 = L.dayOf({ y: 2027, m: 3, d: 31 });
  assert.equal(mar31, 30);
  assert.equal(ymd(L.addMonths(mar31, 1)), '2027-04-30');   // April has no 31st
  assert.equal(ymd(L.addMonths(mar31, 11)), '2028-02-29');  // 2028 is a leap year
  assert.equal(ymd(L.addMonths(mar31, 23)), '2029-02-28');
  assert.equal(ymd(L.addMonths(L.dayOf({ y: 2027, m: 12, d: 15 }), 3)), '2028-03-15'); // across the year
});

test('tie-break: the erased data are in the backups up to the day before they age out, not on that day', () => {
  assert.equal(L.inBackup(100, 99), true);
  assert.equal(L.inBackup(100, 100), false);
  assert.equal(L.inBackup(null, 0), false);
  const s = at({ kind: 'erasure' }, 10);
  assert.equal(s.inBackup, true);
  const a = at({ kind: 'erasure' }, 11);
  assert.equal(a.day, s.gone);
  assert.equal(a.inBackup, false);
});

test('tie-break: a place not on the list takes no time', () => {
  const s4 = at({ map: 'partial' }, 5);                       // the fourth place, newsletter, on the list
  const s5 = at({ map: 'partial' }, 6);                       // the fifth, the salesperson's mailbox, not on it
  assert.equal(s5.places[4].onList, false);
  assert.equal(s5.day, s4.day);
  assert.equal(s5.places[4].took, 0);
  const none = at({ map: 'none' }, 9);                        // no map: the last five are missed
  assert.equal(none.day, at({ map: 'none' }, 4).day);
});

test('tie-break: the last erasure counts in-house erasures only, not the processor\'s', () => {
  const pl = L.plan(L.normalise(P({ kind: 'erasure', map: 'partial' })));
  // partial: crm, invoices, support, newsletter (processor), backups; the last in-house erasure is support's
  const support = pl.places.find((x) => x.id === 'support');
  const news = pl.places.find((x) => x.id === 'newsletter');
  assert.ok(news.day > support.day);
  assert.equal(pl.lastErase, support.day);
});

test('boundaries: params are clamped, rounded or replaced by the default', () => {
  assert.deepEqual(L.normalise({}), L.defaults);
  assert.deepEqual(L.normalise({ kind: 'x', map: 'y', noticed: 'z', backup: 7 }), L.defaults);
  assert.equal(L.normalise({ noticed: -3 }).noticed, 0);
  assert.equal(L.normalise({ noticed: 99 }).noticed, 21);
  assert.equal(L.normalise({ noticed: '4.6' }).noticed, 5);
  assert.equal(L.normalise({ noticed: '' }).noticed, L.defaults.noticed);
  assert.equal(L.normalise({ backup: '12' }).backup, 12);
  for (const m of [1, 3, 6, 12, 36]) assert.equal(L.normalise({ backup: m }).backup, m);
  assert.equal(at({}, 99).n, L.steps);
  assert.equal(at({}, -3).n, 0);
  assert.equal(L.step(null, 99, P({})).n, L.steps);
  assert.equal(L.step(null, -3, P({})).n, 0);
  assert.equal(L.normalise({ kind: 'erasure', map: 'none' }).map, 'none');
});

// ── rules ──

test('rule 1: received on day 0 (1 March 2027), due one month later (day 31), extension limit three months (day 92)', () => {
  assert.equal(ymd(0), '2027-03-01');
  assert.equal(L.DUE, 31);
  assert.equal(L.EXT, 92);
  assert.equal(ymd(L.EXT), '2027-06-01');
  for (let d = 0; d < 800; d += 37) assert.equal(L.dayOf(L.dateOf(d)), d);
});

test('rule 2: the request is logged the day after it reaches the person in charge', () => {
  assert.equal(at({ noticed: 0 }, 1).day, 1);
  assert.equal(at({ noticed: 9 }, 1).day, 10);
  assert.equal(at({ noticed: 9 }, 0).day, 0);
});

test('rule 3: the map decides the list; each place on it takes its days, four more without a map', () => {
  const on = (map) => ids(L.PLACES.filter((x) => L.listed(x, map)));
  assert.deepEqual(on('good'), ['crm', 'invoices', 'support', 'newsletter', 'sales', 'export', 'test', 'backups']);
  assert.deepEqual(on('partial'), ['crm', 'invoices', 'support', 'newsletter', 'backups']);
  assert.deepEqual(on('none'), ['crm', 'invoices', 'support']);
  const g = L.plan(L.normalise(P({ map: 'good', noticed: 0 })));
  assert.deepEqual(g.places.map((x) => x.took), [1, 2, 2, 3, 2, 1, 2, 1]);
  assert.deepEqual(g.places.map((x) => x.day), [2, 4, 6, 9, 11, 12, 14, 15]);
  const n = L.plan(L.normalise(P({ map: 'none', noticed: 0 })));
  assert.deepEqual(n.places.map((x) => x.took), [5, 6, 6, 0, 0, 0, 0, 0]);
  assert.deepEqual(n.places.map((x) => x.day), [6, 12, 18, null, null, null, null, null]);
});

test('rule 4: the answer goes out two days after the last search', () => {
  assert.equal(at({ map: 'good', noticed: 0 }, 10).answer, 17);
  assert.equal(at({ map: 'partial', noticed: 0 }, 10).answer, 12);
  assert.equal(at({ map: 'none', noticed: 0 }, 10).answer, 20);
});

test('rule 5: outcomes per place: access copies or states the period; erasure erases, instructs, keeps or records', () => {
  const acc = at({ kind: 'access', map: 'good' }, 10).places.map((x) => x.status);
  assert.deepEqual(acc, ['found', 'found', 'found', 'found', 'found', 'found', 'found', 'noted']);
  const er = at({ kind: 'erasure', map: 'good' }, 10).places.map((x) => x.status);
  assert.deepEqual(er, ['erased', 'kept', 'erased', 'processor', 'erased', 'erased', 'erased', 'recorded']);
  const miss = at({ kind: 'erasure', map: 'none' }, 10).places.map((x) => x.status);
  assert.deepEqual(miss, ['erased', 'kept', 'erased', 'missed', 'missed', 'missed', 'missed', 'missed']);
  const s = at({ kind: 'erasure', map: 'good' }, 10);
  assert.equal(s.erased, 6);
  assert.equal(s.kept, 1);
  assert.equal(s.still, 0);
  const n = at({ kind: 'erasure', map: 'none' }, 10);
  assert.equal(n.erased, 2);
  assert.equal(n.still, 4);            // newsletter, sales, export, test (the backups age out)
  assert.equal(n.missed, 5);
});

test('rule 6: the erased data leave the backups the chosen months after the last erasure; only for an erasure', () => {
  const s = at({ kind: 'erasure', map: 'good', backup: 3 }, 10);
  assert.equal(s.lastErase, 16);                     // the test copy, day 16 = 17 March
  assert.equal(ymd(s.gone), '2027-06-17');
  assert.equal(ymd(at({ kind: 'erasure', backup: 12 }, 10).gone), '2028-03-17');
  assert.equal(ymd(at({ kind: 'erasure', backup: 1 }, 10).gone), '2027-04-17');
  assert.equal(at({ kind: 'access' }, 10).gone, null);
  // without a map the backups are not on the list, but the data are in them all the same
  const n = at({ kind: 'erasure', map: 'none' }, 10);
  assert.equal(n.backupsListed, false);
  assert.equal(ymd(n.gone), '2027-06-21');
});

test('rule 7: the clock: the day of each step', () => {
  const days = [];
  for (let n = 0; n <= L.steps; n++) days.push(at({ kind: 'erasure', map: 'partial', noticed: 2 }, n).day);
  // received, logged, crm, invoices, support, newsletter, (sales, export, test: not listed), backups, answer, after
  assert.deepEqual(days, [0, 3, 4, 6, 8, 11, 11, 11, 11, 12, 14, L.dayOf({ y: 2027, m: 6, d: 9 })]);
  assert.equal(at({ kind: 'access' }, 11).day, at({ kind: 'access' }, 10).day);
});

test('rule 8: eleven steps; places are revealed one per step and all at the answer', () => {
  assert.equal(L.steps, 11);
  assert.deepEqual(L.STAGES, ['received', 'logged', 'place', 'place', 'place', 'place', 'place', 'place', 'place', 'place', 'answer', 'after']);
  for (let n = 0; n <= L.steps; n++) {
    const s = at({}, n);
    const shown = s.places.filter((x) => x.status !== 'wait').length;
    assert.equal(shown, n < 2 ? 0 : Math.min(8, n - 1), `step ${n}`);
    assert.equal(s.at, n >= 2 && n <= 9 ? n - 2 : null);
    assert.equal(s.done, n >= 10);
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, L.steps);
  assert.equal(JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8')).steps, L.steps);
});

test('rule 10: caption keys at each stage', () => {
  assert.deepEqual(L.captionKeys(at({}, 0)), ['cReceivedAccess', 'cClock']);
  assert.deepEqual(L.captionKeys(at({ kind: 'erasure' }, 0)), ['cReceivedErase', 'cClock']);
  assert.deepEqual(L.captionKeys(at({ noticed: 0 }, 1)), ['cLogged', 'cMap_good']);
  assert.deepEqual(L.captionKeys(at({ noticed: 1, map: 'none' }, 1)), ['cLoggedLate', 'cMap_none']);
  assert.deepEqual(L.captionKeys(at({}, 2)), ['cDone_found', 'cLeft']);
  assert.deepEqual(L.captionKeys(at({}, 9)), ['cDone_noted', 'cLeft']);
  assert.deepEqual(L.captionKeys(at({ kind: 'erasure' }, 3)), ['cDone_kept', 'cLeft']);
  assert.deepEqual(L.captionKeys(at({ kind: 'erasure' }, 5)), ['cDone_processor', 'cLeft']);
  assert.deepEqual(L.captionKeys(at({ kind: 'erasure' }, 9)), ['cDone_recorded', 'cLeft']);
  assert.deepEqual(L.captionKeys(at({ map: 'partial' }, 6)), ['cMissed']);
  assert.deepEqual(L.captionKeys(at({ map: 'none' }, 9)), ['cMissedBackups']);
  assert.deepEqual(L.captionKeys(at({ map: 'none', kind: 'erasure' }, 9)), ['cMissedBackupsErase']);
  // past the due day while still searching (day 21 + 1 + 14 = 36 at the backups)
  const over = at({ map: 'good', noticed: 21 }, 9);
  assert.ok(over.day > L.DUE);
  assert.deepEqual(L.captionKeys(over), ['cDone_noted', 'cOver']);
  // the due day itself while searching is not over
  const onDue = at({ map: 'good', noticed: 16 }, 9);         // 16 + 1 + 14 = 31
  assert.equal(onDue.day, L.DUE);
  assert.equal(L.captionKeys(onDue)[1], 'cLeftDue');
  assert.equal(L.captionKeys(at({ map: 'good', noticed: 15 }, 9))[1], 'cLeft');
  assert.deepEqual(L.captionKeys(at({ map: 'partial' }, 10)), ['cAnswerOnTime', 'cAccessPart']);
  assert.deepEqual(L.captionKeys(at({ kind: 'erasure', map: 'partial' }, 10)), ['cAnswerOnTime', 'cErasePart']);
  assert.deepEqual(L.captionKeys(at({ kind: 'erasure' }, 10)), ['cAnswerOnTime', 'cEraseAll']);
  assert.deepEqual(L.captionKeys(at({}, 11)), ['cAfterAccessAll']);
  assert.deepEqual(L.captionKeys(at({ map: 'none' }, 11)), ['cAfterAccessPart']);
  assert.deepEqual(L.captionKeys(at({ kind: 'erasure' }, 11)), ['cAfterRecorded', 'cAfterClean']);
  assert.deepEqual(L.captionKeys(at({ kind: 'erasure', map: 'partial' }, 11)), ['cAfterRecorded', 'cAfterStill']);
  assert.deepEqual(L.captionKeys(at({ kind: 'erasure', map: 'none' }, 11)), ['cAfterUnrecorded', 'cAfterStill']);
});

test('every caption key and place id has words', () => {
  for (const pr of L.presets.concat([{ params: { noticed: 21 } }, { params: { map: 'partial', kind: 'erasure' } }])) {
    for (let n = 0; n <= L.steps; n++) {
      for (const k of L.captionKeys(at(pr.params, n))) assert.ok(k in strings.en && k in strings.hr, k);
    }
  }
  for (const x of L.PLACES) for (const k of ['pl_', 'wh_']) assert.ok(k + x.id in strings.en, k + x.id);
});

// ── presets against SPEC.md ──

test('presets: the SPEC.md table', () => {
  const want = {
    good: { found: 8, answer: 19, onTime: true, late: 0, missed: 0, erased: 0, kept: 0, still: 0, gone: null },
    partial: { found: 5, answer: 14, onTime: true, late: 0, missed: 3, erased: 0, kept: 0, still: 3, gone: null },
    none: { found: 3, answer: 22, onTime: true, late: 0, missed: 5, erased: 0, kept: 0, still: 4, gone: null },
    late: { found: 3, answer: 34, onTime: false, late: 3, missed: 5, erased: 0, kept: 0, still: 4, gone: null },
    'erase-good': { found: 8, answer: 19, onTime: true, late: 0, missed: 0, erased: 6, kept: 1, still: 0, gone: '2027-06-17' },
    'erase-none': { found: 3, answer: 22, onTime: true, late: 0, missed: 5, erased: 2, kept: 1, still: 4, gone: '2027-06-21' }
  };
  assert.deepEqual(L.presets.map((x) => x.id), Object.keys(want));
  for (const pr of L.presets) {
    const s = kit.stateAt(L, pr.params, 10);
    const got = { found: s.found, answer: s.answer, onTime: s.onTime, late: s.late, missed: s.missed, erased: s.erased,
      kept: s.kept, still: s.still, gone: s.gone === null ? null : ymd(s.gone) };
    assert.deepEqual(got, want[pr.id], pr.id);
    assert.deepEqual(L.normalise(pr.params), pr.params, pr.id + ' is normal');
  }
});

test('sim.json entries name existing presets', () => {
  const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  for (const e of j.entries || []) assert.ok(L.presets.some((x) => x.id === e.preset), e.preset);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const pr of L.presets) {
    for (let n = 0; n <= L.steps; n++) {
      const s = kit.stateAt(L, pr.params, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ kind: 'erasure', map: 'partial', noticed: 7, backup: 12 });
  const forward = [];
  let s = L.initial(p);
  forward.push(s);
  for (let n = 1; n <= L.steps; n++) { s = L.step(s, n, p); forward.push(s); }
  for (let n = L.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(L, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ kind: 'erasure' });
  const s0 = L.initial(p);
  const copy = structuredClone(s0);
  L.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the model is valid for the model', () => {
  for (const pr of L.presets) for (const k of Object.keys(pr.params)) assert.ok(k in L.defaults, `${pr.id}: ${k}`);
});
