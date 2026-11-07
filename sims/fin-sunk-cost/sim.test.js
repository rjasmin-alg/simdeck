// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-sunk-cost's model. Run: node --test sims/fin-sunk-cost/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules, then the presets, then the copied asset
// model, then the strings and the page, then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const asset = require('./asset.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const preset = (id) => logic.presets.find((x) => x.id === id);
const atPreset = (id, n) => kit.stateAt(logic, P(preset(id).params), n);
const row = (tb, id) => tb.rows.find((r) => r.id === id);
const LAST = logic.steps;

function allParams() {
  const out = [];
  for (const overrun of ['none', 'moderate', 'severe']) {
    for (let value = 0; value <= 10000; value += 2000) {
      for (const old of [0, 24000, 120000, 240000]) {
        for (const product of [true, false]) out.push({ overrun, value, old, product });
      }
    }
  }
  return out;
}

// ── tie-breaks (rule 6) ──

test('tie-break: equal scores go to the current course', () => {
  const rows = [
    { id: 'continue', fwd: 100, cash: 80 },
    { id: 'switch', fwd: 100, cash: 10 },
    { id: 'stop', fwd: 0, cash: 0 }
  ];
  assert.equal(logic.choose(rows, 'fwd', 'continue'), 'continue');
  const rows0 = [
    { id: 'continue', fwd: 50, cash: 80 },
    { id: 'switch', fwd: 10, cash: 120 },
    { id: 'stop', fwd: 50, cash: 0 }
  ];
  assert.equal(logic.choose(rows0, 'fwd', 'stop'), 'stop');
  assert.equal(logic.choose(rows0, 'fwd', 'continue'), 'continue');
});

test('tie-break: current course not among the tied → less cash still to spend, then continue, switch, stop', () => {
  const rows = [
    { id: 'continue', fwd: 10, cash: 0 },
    { id: 'switch', fwd: 100, cash: 120 },
    { id: 'stop', fwd: 100, cash: 0 }
  ];
  assert.equal(logic.choose(rows, 'fwd', 'continue'), 'stop');
  const even = [
    { id: 'stop', fwd: 100, cash: 50 },
    { id: 'switch', fwd: 100, cash: 50 },
    { id: 'continue', fwd: 0, cash: 50 }
  ];
  assert.equal(logic.choose(even, 'fwd', 'continue'), 'switch');
  const all = [
    { id: 'stop', fwd: 7, cash: 50 },
    { id: 'switch', fwd: 7, cash: 50 },
    { id: 'continue', fwd: 7, cash: 50 }
  ];
  assert.equal(logic.choose(all, 'fwd', 'none'), 'continue');
});

test('tie-break, reachable: old 240 000 at G0 ties start and keep for the sunk rule; keeping wins', () => {
  const p = { overrun: 'none', value: 5000, old: 240000 };
  const tb = at(p, 1).table;
  assert.equal(row(tb, 'continue').sunk, 0);
  assert.equal(row(tb, 'stop').sunk, 0);
  assert.equal(tb.current, 'stop');
  assert.equal(tb.sunk, 'stop');
  assert.equal(tb.fwd, 'continue');
  // one step either side of the tie: 228 000 starts, 240 000 keeps
  assert.equal(at({ overrun: 'none', value: 5000, old: 228000 }, 1).table.sunk, 'continue');
});

// ── rules ──

test('rule 1: params are normalised', () => {
  assert.deepEqual(logic.normalise({}), logic.defaults);
  assert.equal(logic.normalise({ overrun: 'huge' }).overrun, 'moderate');
  assert.equal(logic.normalise({ overrun: 'severe' }).overrun, 'severe');
  for (const bad of [null, '', true, Infinity, NaN, 'x']) {
    assert.equal(logic.normalise({ value: bad }).value, 5000, String(bad));
    assert.equal(logic.normalise({ old: bad }).old, 24000, String(bad));
  }
  assert.equal(logic.normalise({ value: 2500 }).value, 3000, 'half away from zero');
  assert.equal(logic.normalise({ value: 2499 }).value, 2000);
  assert.equal(logic.normalise({ value: '7000' }).value, 7000);
  assert.equal(logic.normalise({ value: -5000 }).value, 0);
  assert.equal(logic.normalise({ value: 99999 }).value, 10000);
  assert.equal(logic.normalise({ old: 18000 }).old, 24000);
  assert.equal(logic.normalise({ old: 1e9 }).old, 240000);
  for (const off of [false, 'false', 0, '0']) assert.equal(logic.normalise({ product: off }).product, false);
  for (const on of [true, 'true', 1, '1']) assert.equal(logic.normalise({ product: on }).product, true);
  assert.equal(logic.normalise({ product: 'maybe' }).product, true);
});

test('rule 2: the months still to build at each gate are the estimate minus the months built', () => {
  const rem = (over, n) => at(over, n).table.rem;
  assert.deepEqual([1, 5, 9].map((n) => rem({}, n)), [4, 4, 8]);
  assert.equal(at({}, 13).table.rem, 5);                       // G3 on the lane still building
  assert.deepEqual([1, 5, 9, 13].map((n) => rem({ overrun: 'severe', product: false }, n)), [4, 6, 11, 13]);
  assert.equal(at({ overrun: 'none' }, 5).table.rem, 1);
  assert.equal(at({}, 4).table.prevEst, 4);
  assert.equal(at({}, 4).table.est, 7);
});

test('rule 2: the true length is the last estimate: the build goes live in that month', () => {
  assert.equal(at({ overrun: 'none' }, LAST).final.fwd.live, 4);
  assert.equal(at({ value: 0 }, LAST).final.fwd.live, 14);
  assert.equal(at({ overrun: 'severe', product: false }, LAST).final.sunk.live, 22);
});

test('rule 3: the options and their inputs; no product, no switch row; gate 0 starts from nothing spent', () => {
  const tb = at({}, 9).table;
  assert.deepEqual(tb.rows.map((r) => r.id), ['continue', 'switch', 'stop']);
  assert.deepEqual(row(tb, 'continue'), Object.assign({}, row(tb, 'continue'), { benefit: 400000, cash: 160000, team: 32, people: 160000 }));
  assert.deepEqual([row(tb, 'switch').benefit, row(tb, 'switch').cash, row(tb, 'switch').team, row(tb, 'switch').people], [320000, 120000, 6, 30000]);
  assert.deepEqual([row(tb, 'stop').benefit, row(tb, 'stop').cash, row(tb, 'stop').team], [0, 0, 0]);
  assert.deepEqual(at({ product: false }, 9).table.rows.map((r) => r.id), ['continue', 'stop']);
  assert.equal(at({}, 1).table.spent, 0);
  assert.equal(at({}, 9).table.spent, 120000);
});

test('rule 4: looking forward = benefit − cash − people\'s time', () => {
  const tb = at({}, 9).table;
  assert.equal(row(tb, 'continue').fwd, 80000);
  assert.equal(row(tb, 'switch').fwd, 170000);
  assert.equal(row(tb, 'stop').fwd, 0);
  assert.equal(row(at({ value: 0 }, 9).table, 'continue').fwd, 240000);
});

test('rule 5: by already spent charges S to the ways out and W to the options that retire the old system', () => {
  const tb = at({}, 9).table;                                  // S 120 000, W 18 000
  assert.equal(tb.book, 18000);
  assert.deepEqual(tb.rows.map((r) => [r.id, r.lostSpent, r.lostBook, r.sunk]),
    [['continue', 0, 18000, 62000], ['switch', 120000, 18000, 32000], ['stop', 120000, 0, -120000]]);
  const g0 = at({}, 1).table;                                  // S 0, W 24 000
  assert.deepEqual(g0.rows.map((r) => [r.id, r.lostSpent, r.lostBook]), [['continue', 0, 24000], ['switch', 0, 24000], ['stop', 0, 0]]);
});

test('rule 6: each rule takes its highest score', () => {
  const tb = at({}, 9).table;
  assert.equal(tb.fwd, 'switch');
  assert.equal(tb.sunk, 'continue');
  const nw = at({ overrun: 'severe', product: false }, 9).table;
  assert.equal(nw.fwd, 'stop');
  assert.equal(nw.sunk, 'continue');
});

test('rule 7: adding the money already spent to every row keeps the order of looking forward', () => {
  for (const p of allParams()) {
    for (const n of [1, 5, 9, 13]) {
      const tb = at(p, n).table;
      if (!tb) continue;
      for (const r of tb.rows) assert.equal(r.whole, r.fwd - tb.spent);
      const byF = tb.rows.slice().sort((a, b) => b.fwd - a.fwd).map((r) => r.id);
      const byW = tb.rows.slice().sort((a, b) => b.whole - a.whole).map((r) => r.id);
      assert.deepEqual(byW, byF);
    }
  }
});

test('rule 8: a month of building, of setting up the product; going live adds the benefit and the write-off', () => {
  const s = at({}, 2);                                         // month 1
  assert.deepEqual([s.lanes.fwd.cash, s.lanes.fwd.team, s.lanes.fwd.months[1]], [20000, 4, 'build']);
  const m7 = at({}, 10);                                       // month 7: fwd switched at G2
  assert.deepEqual([m7.lanes.fwd.cash, m7.lanes.fwd.team, m7.lanes.fwd.setup, m7.lanes.fwd.months[7]], [160000, 26, 1, 'switch']);
  assert.deepEqual([m7.lanes.sunk.cash, m7.lanes.sunk.team, m7.lanes.sunk.months[7]], [140000, 28, 'build']);
  const m9 = at({}, 12);                                       // month 9: the product goes live
  assert.equal(m9.lanes.fwd.live, 9);
  assert.equal(m9.lanes.fwd.event, 'golive');
  assert.equal(m9.lanes.fwd.benefit, 320000);
  assert.equal(m9.lanes.fwd.writeOff, 15000);
  assert.equal(at({}, 14).lanes.fwd.months[10], 'live');
  const kept = at(preset('old-books').params, 3).lanes.sunk;
  assert.deepEqual([kept.cash, kept.months[2], kept.event], [0, 'kept', 'idle']);
});

test('rule 8: the old system\'s book value falls by a 24th of today\'s a month, not below 0; the write-off is the book value', () => {
  const p = logic.normalise({ old: 240000 });
  assert.equal(logic.oldBook(p, 0), 240000);
  assert.equal(logic.oldBook(p, 6), 180000);
  assert.equal(logic.oldBook(p, 24), 0);
  assert.equal(logic.oldBook(p, 30), 0);
  for (let m = 0; m <= 30; m++) assert.equal(logic.writeOff(p, m), logic.oldBook(p, m));
  assert.equal(logic.oldBook(logic.normalise({ old: 0 }), 5), 0);
});

test('rule 9: lanes are identical while both build; no table when neither builds', () => {
  const s = at({}, 8);
  assert.equal(s.same, true);
  assert.deepEqual(s.lanes.sunk.months, s.lanes.fwd.months);
  assert.deepEqual(s.facing, ['sunk', 'fwd']);
  assert.equal(at({}, 10).same, false);
  assert.deepEqual(at({}, 12).facing, ['sunk']);
  assert.equal(at({ overrun: 'none' }, 8).table, null);
  assert.equal(at({ overrun: 'none' }, 9).table, null);
});

test('rule 10: at the last step each lane runs on to its own end; a stopped lane keeps the old system on the books', () => {
  const s = at({}, LAST);
  assert.equal(s.lanes.sunk.live, null, 'not live by month 12');
  assert.equal(s.final.sunk.live, 14);
  assert.equal(s.final.sunk.net, -160000);
  assert.equal(s.final.parted, 2);
  assert.equal(s.final.diff, 90000);
  const ob = at(preset('old-books').params, LAST).final.sunk;
  assert.deepEqual([ob.live, ob.kept, ob.net], [null, 90000, 0]);
  assert.equal(at({}, LAST - 1).final, null, 'only at the last step');
});

test('rule 10: an early estimate that is too short can make the sunk lane come out better', () => {
  const f = at({ overrun: 'moderate', value: 5000, old: 240000 }, LAST).final;
  assert.deepEqual([f.sunk.net, f.fwd.net, f.sunk.choices[0], f.fwd.live], [0, -70000, 'stop', 9]);
  assert.equal(logic.captionKey(at({ overrun: 'moderate', value: 5000, old: 240000 }, LAST)).gap, 'gEndSunk');
});

test('rule 3: at an open gate the table counts the money already spent', () => {
  assert.deepEqual([4, 8, 12].map((n) => at({}, n).table.spent), [60000, 120000, 180000]);
  assert.equal(row(at({}, 8).table, 'stop').lostSpent, 120000);
});

test('rule 10: the gate where the paths parted, including gate 0', () => {
  assert.equal(atPreset('old-books', LAST).final.parted, 0);
  assert.equal(atPreset('no-way-out', LAST).final.parted, 2);
  assert.equal(atPreset('on-track', LAST).final.parted, null);
});

test('captions: the lane still building is named; a go-live in a gate month is told at the open step', () => {
  assert.equal(logic.captionKey(at({}, 12)).gap, 'gOnlySunk');
  assert.equal(logic.captionKey(atPreset('old-books', 4)).gap, 'gOnlyFwd');
  assert.equal(logic.captionKey(at({}, 12)).live, 'fwd');
  assert.equal(logic.captionKey(at({}, 13)).live, undefined);
  assert.equal(logic.captionKey(at({}, 8)).live, null);
});

test('rule 11: 16 steps; a gate opens with no choice made and decides on the next step', () => {
  assert.equal(logic.steps, 16);
  assert.deepEqual(logic.SCHEDULE.map((x) => x.month), [0, 0, 1, 2, 3, 3, 4, 5, 6, 6, 7, 8, 9, 9, 10, 11, 12]);
  assert.deepEqual(logic.SCHEDULE.filter((x) => x.phase === 'open').map((x) => x.gate), [0, 1, 2, 3]);
  const open = at({}, 8), done = at({}, 9);
  assert.equal(open.phase, 'open');
  assert.equal(open.lanes.fwd.choices[2], null);
  assert.equal(done.lanes.fwd.choices[2], 'switch');
  assert.equal(done.lanes.fwd.phase, 'switch');
  assert.equal(open.lanes.fwd.cash, done.lanes.fwd.cash, 'deciding spends nothing');
  assert.equal(at({}, 0).lanes.fwd.phase, 'plan');
  assert.equal(at({}, 13).lanes.fwd.choices[3], 'none');
});

// ── presets (SPEC.md table) ──

test('presets: the SPEC table', () => {
  assert.deepEqual(logic.presets.map((x) => x.id), ['overrun', 'on-track', 'team-free', 'old-books', 'no-way-out']);
  assert.deepEqual(logic.presets[0].params, logic.defaults);
  const out = (id) => {
    const f = atPreset(id, LAST).final;
    return ['sunk', 'fwd'].map((r) => [f[r].choices.join(','), f[r].cash, f[r].team, f[r].benefit, f[r].net, f[r].live, f[r].writeOff]);
  };
  assert.deepEqual(out('overrun'), [
    ['continue,continue,continue,continue', 280000, 56, 400000, -160000, 14, 10000],
    ['continue,continue,switch,none', 240000, 30, 320000, -70000, 9, 15000]]);
  assert.deepEqual(out('on-track'), [
    ['continue,continue,none,none', 80000, 16, 400000, 240000, 4, 20000],
    ['continue,continue,none,none', 80000, 16, 400000, 240000, 4, 20000]]);
  assert.deepEqual(out('team-free'), [
    ['continue,continue,continue,continue', 280000, 56, 400000, 120000, 14, 10000],
    ['continue,continue,continue,continue', 280000, 56, 400000, 120000, 14, 10000]]);
  assert.deepEqual(out('old-books'), [
    ['stop,none,none,none', 0, 0, 0, 0, null, null],
    ['continue,continue,none,none', 80000, 16, 400000, 160000, 4, 150000]]);
  assert.deepEqual(out('no-way-out'), [
    ['continue,continue,continue,continue', 440000, 88, 400000, -480000, 22, 2000],
    ['continue,continue,stop,none', 120000, 24, 0, -240000, null, null]]);
});

test('presets: the gate scores of the SPEC table', () => {
  const sc = (id, n) => atPreset(id, n).table.rows.map((r) => [r.id, r.fwd, r.sunk]);
  assert.deepEqual(sc('overrun', 1), [['continue', 240000, 216000], ['switch', 170000, 146000], ['stop', 0, 0]]);
  assert.deepEqual(sc('overrun', 9), [['continue', 80000, 62000], ['switch', 170000, 32000], ['stop', 0, -120000]]);
  assert.deepEqual(sc('overrun', 13), [['continue', 200000, 185000], ['switch', 170000, -25000], ['stop', 0, -180000]]);
  assert.deepEqual(sc('team-free', 9), [['continue', 240000, 222000], ['switch', 200000, 62000], ['stop', 0, -120000]]);
  assert.deepEqual(sc('old-books', 1), [['continue', 160000, -20000], ['switch', 140000, -40000], ['stop', 0, 0]]);
  assert.deepEqual(sc('no-way-out', 9), [['continue', -40000, -58000], ['stop', 0, -120000]]);
  assert.deepEqual(sc('no-way-out', 13), [['continue', -120000, -135000], ['stop', 0, -180000]]);
});

test('presets open on their own event: the caption lead at the opening step', () => {
  const leads = { overrun: 'cOpen0', 'on-track': 'cOpen0', 'team-free': 'cOpenGrew', 'old-books': 'cOpen0', 'no-way-out': 'cOpenGrew' };
  for (const x of logic.presets) assert.equal(logic.captionKey(atPreset(x.id, x.step)).lead, leads[x.id], x.id);
});

// ── asset model (copied from fin-depreciation, unchanged) ──

test('asset (copied): straight-line by month lands on 0; disposal books the book value as a loss', () => {
  const sched = asset.schedule(60000, 60, 0, 'sl');
  assert.equal(sched.length, 60);
  assert.equal(sched[59].close, 0);
  assert.equal(asset.bookAt(sched, 60000, 36), 24000);
  const d = asset.disposal(sched, 60000, 36, 0);
  assert.deepEqual([d.book, d.gain, d.outcome], [24000, -24000, 'loss']);
  assert.equal(asset.disposal(sched, 60000, 60, 0).outcome, 'none');
  assert.ok(Object.is(asset.roundMoney(-0.4), 0));
});

// ── strings and page ──

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every caption key the model can return has a string; the reachable ones are reached', () => {
  const keys = new Set();
  for (const p of allParams()) {
    for (let n = 0; n <= LAST; n++) {
      const k = logic.captionKey(at(p, n));
      for (const x of [k.lead, k.gap, k.only]) if (x) keys.add(x);
    }
  }
  for (const k of ['cOpen0', 'cOpen0NoProduct', 'cOpenGrew', 'cOpenHeld', 'gOnlySunk', 'gOnlyFwd', 'cAgree', 'cDiffer',
    'rSpent', 'rBook', 'cNoGate', 'cMonthSame', 'cMonthDiffer', 'cEndSame', 'cEnd', 'gEndFwd', 'gEndSunk']) assert.ok(keys.has(k), `${k} is reachable`);
  for (const k of [...keys, 'gEndEven']) {
    for (const lang of ['hr', 'en']) assert.equal(typeof strings[lang][k], 'string', `${lang}.${k}`);
  }
});

test('every option and lane has its words; every preset its label and hint; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  assert.match(html, /presets:\s*L\.presets\.map/);
  const labels = { overrun: 'prOverrun', 'on-track': 'prOnTrack', 'team-free': 'prTeamFree', 'old-books': 'prOldBooks', 'no-way-out': 'prNoWayOut' };
  for (const lang of ['hr', 'en']) {
    for (const x of logic.presets) {
      assert.equal(typeof strings[lang][labels[x.id]], 'string', `${lang} ${x.id}`);
      assert.equal(typeof strings[lang][labels[x.id] + 'Hint'], 'string');
    }
    for (const o of ['Continue', 'Switch', 'Stop']) {
      for (const k of ['o' + o, 'o' + o + '0', 'n' + o, 'n' + o + '0']) assert.equal(typeof strings[lang][k], 'string', `${lang}.${k}`);
    }
  }
  for (const x of logic.presets) for (const k of Object.keys(x.params)) assert.ok(k in logic.defaults, `preset param ${k}`);
  for (const e of meta.entries || []) assert.ok(logic.presets.some((x) => x.id === e.preset), `entry ${e.preset}`);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const p of [{}, preset('old-books').params, preset('no-way-out').params]) {
    for (let n = 0; n <= LAST; n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ overrun: 'severe', value: 3000 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= LAST; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = LAST; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input or the model\'s constants', () => {
  const p = P({});
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  const est = structuredClone(logic.EST);
  const s1 = logic.step(s0, 9, p);
  s1.est[0] = 99;
  s1.table.rows[0].fwd = 1;
  assert.deepEqual(s0, copy);
  assert.deepEqual(logic.EST, est);
  assert.equal(logic.step(s0, 9, p).table.rows[0].fwd, 80000);
});
