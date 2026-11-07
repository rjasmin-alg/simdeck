// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-change-risk-class. Run: node --test sims/cmp-change-risk-class/
// Rules and expected numbers: SPEC.md. Tie-breaks and boundaries first, then the rules in order, the presets, the
// behaviour over many quarters, and the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
/** A hand-made change: ready day, kind, defect, review draw. */
const C = (id, ready, kind, defect, uRev) => ({ id, ready, kind: kind || 'medium', defect: !!defect, uRev: uRev === undefined ? 0.99 : uRev });
const W = { board: 5, standard: 'routine' };
/** A run reduced to [day, ids, failed, unrecorded] per deployment. */
const deps = (r) => r.deploys.map((d) => [d.day, d.ids, d.failed, d.unrec]);
const doneOf = (r) => Object.fromEntries(r.items.map((x) => [x.id, x.done]));

// ── tie-breaks and boundaries ──

test('rule 1: changes ready on the same day keep their draw order; ids follow the sorted order', () => {
  const list = logic.changes(104, 1501);
  // redraw independently: four draws per change
  const r = logic.rng(1501), raw = [];
  for (let i = 0; i < 104; i++) { raw.push({ i, ready: Math.floor(r() * 65), u: r(), uDef: r(), uRev: r() }); }
  const order = raw.slice().sort((a, b) => a.ready - b.ready || a.i - b.i);
  assert.deepEqual(list.map((c) => [c.ready, c.uRev]), order.map((x) => [x.ready, x.uRev]));
  assert.deepEqual(list.map((c) => c.id), list.map((_, j) => j + 1));
  const sameDay = raw.filter((x) => x.ready === order[0].ready).map((x) => x.i);
  assert.ok(sameDay.length > 1, 'the seed has a shared first day');
  for (let j = 1; j < list.length; j++) assert.ok(list[j - 1].ready <= list[j].ready);
});

test('rule 1: a draw equal to a share boundary or the defect chance falls above it (strict <)', () => {
  assert.deepEqual([0, 0.4999, 0.5, 0.7999, 0.8, 0.92, 0.9999].map(logic.kindOf),
    ['routine', 'routine', 'medium', 'medium', 'high', 'urgent', 'urgent']);
  assert.deepEqual([[0.0299, 'routine'], [0.03, 'routine'], [0.0999, 'medium'], [0.1, 'medium'], [0.25, 'high'], [0.1999, 'urgent'], [0.2, 'urgent']]
    .map(([u, k]) => logic.defectOf(k, u)), [true, false, true, false, false, true, false]);
  // kinds: u < 0.5 routine, u < 0.8 medium …; defect: uDef < chance. Checked on every generated change.
  const r = logic.rng(77), list = logic.changes(400, 77);
  const byI = [];
  for (let i = 0; i < 400; i++) {
    const ready = Math.floor(r() * 65), u = r(), uDef = r(), uRev = r();
    let k = 0; while (u >= logic.SHARE[k]) k++;
    byI.push({ ready, kind: logic.KINDS[k], defect: uDef < logic.DEFECT[logic.KINDS[k]], uRev });
  }
  const key = (c) => [c.ready, c.kind, c.defect, c.uRev].join('|');
  assert.deepEqual(list.map(key).sort(), byI.map(key).sort());
});

test('rule 2: the agenda closes the day before; a change ready on a meeting day waits for the next one', () => {
  assert.equal(logic.atOf('cab', 3, 5), 4);    // ready Thursday, meeting Friday
  assert.equal(logic.atOf('cab', 4, 5), 9);    // ready on the meeting day: next week
  assert.equal(logic.atOf('high', 4, 5), 9);
  assert.equal(logic.atOf('cab', 0, 1), 1);    // daily board: the next day
  assert.equal(logic.atOf('cab', 8, 10), 9);
  assert.equal(logic.atOf('cab', 9, 10), 19);
});

test('rule 4: an urgent change waits for a board meeting on the next day, and bypasses it when it is later', () => {
  assert.equal(logic.routeOf('cab', 'urgent', 3, W), 'cab');      // meeting on day 4 = the next day
  assert.equal(logic.routeOf('cab', 'urgent', 2, W), 'bypass');   // meeting on day 4 = two days later
  assert.equal(logic.routeOf('cab', 'urgent', 4, W), 'bypass');   // ready on the meeting day
  assert.equal(logic.routeOf('cab', 'urgent', 7, { board: 1 }), 'cab');
  assert.equal(logic.routeOf('cab', 'urgent', 0, { board: 2 }), 'cab');
  assert.equal(logic.routeOf('cab', 'urgent', 1, { board: 2 }), 'bypass');
  assert.equal(logic.routeOf('cab', 'high', 2, W), 'cab');        // only urgent changes bypass
});

test('rule 3: a review draw equal to the catch rate does not find the defect (strict <)', () => {
  const at = (u) => deps(logic.run([C(1, 0, 'medium', true, u)], 'classes', W));
  // peer review 0.5: missed, fails on day 1, fixed by day 3, reviewed again and out on day 4
  assert.deepEqual(at(0.5), [[1, [1], true, false], [4, [1], false, false]]);
  assert.deepEqual(at(0.4999), [[4, [1], false, false]]);          // found on day 1, fixed by day 3, out on day 4
  const hi = (u) => deps(logic.run([C(1, 0, 'high', true, u)], 'classes', W));
  assert.deepEqual(hi(0.75), [[4, [1], true, false], [9, [1], false, false]]);
  assert.deepEqual(hi(0.7499), [[9, [1], false, false]]);          // found at the meeting on day 4, next one day 9
});

test('rule 5: a failed release sends its good changes back the next day and the bad ones after the fix', () => {
  const list = [C(1, 0, 'medium', false), C(2, 1, 'medium', true), C(3, 2, 'routine', false)];
  const r = logic.run(list, 'cab', W);
  // all three on the agenda of day 4; change 2 is bad: the release fails; 1 and 3 ready day 5, 2 ready day 6;
  // the next meeting is day 9 for all of them
  assert.deepEqual(deps(r), [[4, [1, 2, 3], true, false], [9, [1, 2, 3], false, false]]);
  assert.deepEqual(doneOf(r), { 1: 9, 2: 9, 3: 9 });
  // daily board: the good ones on day 2 + … the agenda of day 6 has 1 and 3 (ready 5), change 2 (ready 6) waits a day
  const d = logic.run([C(1, 0, 'medium', false), C(2, 0, 'medium', true)], 'cab', { board: 1 });
  assert.deepEqual(deps(d), [[1, [1, 2], true, false], [3, [1], false, false], [4, [2], false, false]]);
});

test('halves up: tenths and percent', () => {
  assert.equal(logic.tenths(1, 4), 3);        // 0.25 → 0.3
  assert.equal(logic.tenths(3, 4), 8);        // 0.75 → 0.8
  assert.equal(logic.tenths(1, 3), 3);        // 0.333 → 0.3
  assert.equal(logic.pct(1, 8), 13);          // 12.5 → 13
  assert.equal(logic.pct(1, 40), 3);          // 2.5 → 3
  assert.equal(logic.pct(5, 24), 21);
});

// ── the rules in order ──

test('rule 1: 13 × load changes; a higher load keeps the first changes and adds more', () => {
  assert.equal(S({}).n, 104);
  assert.equal(S({ load: 4 }).n, 52);
  const key = (c) => [c.ready, c.kind, c.defect, c.uRev].join('|');
  const small = logic.changes(52, 9).map(key), big = new Set(logic.changes(104, 9).map(key));
  for (const k of small) assert.ok(big.has(k), k);
  assert.deepEqual(S({}).kinds, { routine: 54, medium: 36, high: 7, urgent: 7 });
  assert.equal(S({}).defects, 8);
});

test('rule 2: meeting days per interval, and the meetings in a quarter', () => {
  const days = (I) => Array.from({ length: 21 }, (_, d) => d).filter((d) => logic.isMeeting(d, I));
  assert.deepEqual(days(5), [4, 9, 14, 19]);
  assert.deepEqual(days(10), [9, 19]);
  assert.deepEqual(days(2), [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]);
  assert.equal(days(1).length, 21);
  assert.deepEqual([1, 2, 5, 10].map(logic.meetingsIn), [65, 32, 13, 6]);
  assert.equal(logic.meetingFrom(4, 5), 4);
  assert.equal(logic.meetingFrom(5, 5), 9);
});

test('rule 3: the catch rate of each route', () => {
  assert.deepEqual(logic.CATCH, { none: 0, bypass: 0, standard: 0, emergency: 0, peer: 0.5, cab: 0.5, high: 0.75 });
  // a defect nobody reviews always fails: no process, standard, emergency, bypass
  for (const [reg, kind] of [['none', 'medium'], ['classes', 'routine'], ['classes', 'urgent'], ['cab', 'urgent']]) {
    const r = logic.run([C(1, 2, kind, true, 0)], reg, W);
    assert.equal(r.deploys[0].failed, true, reg + ' ' + kind);
  }
});

test('rule 4: the routes under risk classes follow "what counts as standard"', () => {
  const R = (kind, standard) => logic.routeOf('classes', kind, 0, { board: 5, standard });
  assert.deepEqual(['routine', 'medium', 'high', 'urgent'].map((k) => R(k, 'none')), ['peer', 'peer', 'high', 'emergency']);
  assert.deepEqual(['routine', 'medium', 'high', 'urgent'].map((k) => R(k, 'routine')), ['standard', 'peer', 'high', 'emergency']);
  assert.deepEqual(['routine', 'medium', 'high', 'urgent'].map((k) => R(k, 'medium')), ['standard', 'standard', 'high', 'emergency']);
  assert.equal(logic.routeOf('none', 'high', 0, W), 'none');
  assert.deepEqual(['none', 'bypass', 'standard', 'emergency'].map((r) => logic.atOf(r, 7, 5)), [7, 7, 7, 7]);
  assert.equal(logic.atOf('peer', 7, 5), 8);
});

test('rule 5: no process: the same day, no record; a failure is fixed and goes again after two days', () => {
  const r = logic.run([C(1, 3, 'high', true, 0), C(2, 3, 'routine', false)], 'none', W);
  assert.deepEqual(deps(r), [[3, [1], true, true], [3, [2], false, true], [5, [1], false, true]]);
  assert.deepEqual(doneOf(r), { 1: 5, 2: 3 });
  assert.ok(r.items.every((x) => x.unrec));
});

test('rule 5: everything to the board: one release per meeting; urgent changes bypass it without a record', () => {
  const list = [C(1, 0, 'routine'), C(2, 1, 'urgent'), C(3, 2, 'high'), C(4, 3, 'urgent'), C(5, 4, 'medium')];
  const r = logic.run(list, 'cab', W);
  // 2 is urgent on day 1 (meeting on day 4 is not the next day): bypass on day 1; 4 is urgent on day 3, meeting on day 4
  assert.deepEqual(deps(r), [[1, [2], false, true], [4, [1, 3, 4], false, false], [9, [5], false, false]]);
  assert.deepEqual(r.items.map((x) => x.unrec), [false, true, false, false, false]);
});

test('rule 5: a change that ever went out without a record stays unrecorded after a recorded redeploy', () => {
  const r = logic.run([C(1, 1, 'urgent', true)], 'cab', W);
  // urgent on day 1, meeting day 4: bypass, fails; ready day 3, meeting day 4 is the next day: the board
  assert.deepEqual(deps(r), [[1, [1], true, true], [4, [1], false, false]]);
  assert.equal(r.items[0].unrec, true);
  const m = logic.metrics(r, 5, 'cab');
  assert.deepEqual([m.unrec, m.unrecFailed], [1, 1]);
});

test('rule 5: risk classes: one deployment per change, also at the meeting', () => {
  const list = [C(1, 0, 'routine'), C(2, 0, 'medium'), C(3, 1, 'high'), C(4, 2, 'high'), C(5, 3, 'urgent')];
  const r = logic.run(list, 'classes', W);
  assert.deepEqual(deps(r), [[0, [1], false, false], [1, [2], false, false], [3, [5], false, false], [4, [3], false, false], [4, [4], false, false]]);
  assert.ok(r.items.every((x) => !x.unrec));
});

test('rule 5: a change rolled back with a failed release is counted once per deployment', () => {
  const r = logic.run([C(1, 0, 'medium', true), C(2, 0, 'medium', true), C(3, 0, 'medium', false)], 'cab', W);
  const m = logic.metrics(r, 5, 'cab');
  assert.deepEqual(deps(r), [[4, [1, 2, 3], true, false], [9, [1, 2, 3], false, false]]);
  assert.deepEqual([m.deploys, m.failed, m.rolled, m.batch10, m.cfr, m.lead10, m.maxLead], [2, 1, 3, 30, 50, 90, 9]);
  assert.deepEqual(r.items.map((x) => x.fails), [1, 1, 0]);
});

test('rule 6: every run ends; each change goes live exactly once', () => {
  for (const p of [P({}), P({ board: 10, load: 16 }), P({ board: 1, standard: 'none', seed: 3 })]) {
    const list = logic.changes(13 * p.load, p.seed);
    for (const g of logic.REGIMES) {
      const r = logic.run(list, g, p);
      assert.ok(r.items.every((x) => x.done !== null && x.done >= x.ready0), g);
      const ok = r.deploys.filter((d) => !d.failed).flatMap((d) => d.ids).sort((a, b) => a - b);
      assert.deepEqual(ok, list.map((c) => c.id), g + ': each change in exactly one good deployment');
      assert.ok(r.items.every((x) => x.fails <= 1), g + ': one defect, fixed at most once');
    }
  }
});

test('rule 7: the numbers of a lane', () => {
  const r = logic.run([C(1, 0, 'routine'), C(2, 0, 'medium', true, 0.9), C(3, 1, 'urgent', true)], 'none', W);
  const m = logic.metrics(r, 5, 'none');
  // deployments: 1 (day 0), 2 (day 0, fails), 3 (day 1, fails), 2 (day 2), 3 (day 3)
  assert.deepEqual([m.n, m.deploys, m.failed, m.cfr, m.batch10, m.unrec, m.unrecFailed, m.rolled, m.meetings],
    [3, 5, 2, 40, 10, 3, 2, 2, 0]);
  assert.deepEqual([m.lead10, m.maxLead, m.last], [13, 2, 3]);       // leads 0, 2, 2 → 1.33 → 1.3
  assert.equal(logic.metrics(logic.run([], 'cab', W), 5, 'cab').cfr, 0);
  assert.equal(S({}).lanes.cab.m.meetings, 13);
});

test('rule 8: normalise: numbers, the board list, the standard list, unknown keys dropped', () => {
  assert.deepEqual(logic.normalise({}), logic.defaults);
  assert.deepEqual(logic.normalise({ load: '12', board: '10', standard: 'none', seed: '42', x: 1 }),
    { load: 12, seed: 42, board: 10, standard: 'none' });
  assert.deepEqual(logic.normalise({ load: 99, board: 3, standard: 'all', seed: -5 }),
    { load: 16, seed: 1, board: 5, standard: 'routine' });
  assert.deepEqual(logic.normalise({ load: 'x', board: null, standard: 'constructor', seed: Infinity }), logic.defaults);
  assert.equal(logic.normalise({ load: 4.5 }).load, 5);
  assert.equal(logic.normalise({ board: true }).board, 5);
  assert.equal(logic.normalise({ seed: 1e7 }).seed, 999999);
  assert.equal(logic.normalise({ load: 1 }).load, 4);
  assert.equal(logic.normalise({ load: '  ' }).load, 8);
});

test('rule 9: the caption notes, in order, at most two', () => {
  assert.deepEqual(logic.captionKey(S({})), { key: 'capMain', notes: ['nBypass'] });
  assert.deepEqual(logic.captionKey(S({ standard: 'medium' })).notes, ['nWide', 'nBypass']);
  assert.deepEqual(logic.captionKey(S({ standard: 'none' })).notes, ['nNoStd', 'nBypass']);
  assert.deepEqual(logic.captionKey(S({ board: 1 })).notes, ['nDaily']);                 // a daily board: nothing bypasses
  assert.deepEqual(logic.captionKey(S({ board: 1, standard: 'medium' })).notes, ['nWide', 'nDaily']);
  for (const board of logic.BOARDS) for (const standard of logic.STANDARDS) for (const seed of [1, 2, 3]) {
    assert.ok(logic.captionKey(S({ board, standard, seed })).notes.length <= 2);
    if (board === 1) assert.equal(S({ board, standard, seed }).lanes.cab.m.unrec, 0, 'nothing bypasses a daily board');
  }
  assert.deepEqual(logic.captionKey(S({ seed: 2, board: 2, load: 4 })).notes, []);          // nothing bypassed
  const one = S({ seed: 1, board: 2, load: 4 });                                              // bypassed, none failed
  assert.deepEqual([one.lanes.cab.m.unrec, one.lanes.cab.m.unrecFailed, logic.captionKey(one).notes], [5, 0, ['nBypass']]);
  assert.equal(S({ standard: 'medium' }).stdMediumFailed, 4);
  assert.equal(S({}).stdMediumFailed, 0);
});

// ── the presets (SPEC.md table; the Python check there prints the same) ──

const EXPECT = {
  // lane: [lead10, maxLead, batch10, cfr, failed, deploys, unrec, unrecFailed, rolled]
  weekly: { none: [2, 2, 10, 7, 8, 112, 104, 8, 8], cab: [47, 15, 60, 21, 5, 24, 7, 2, 39], classes: [8, 10, 10, 5, 5, 109, 0, 0, 5] },
  fortnight: { none: [2, 2, 10, 7, 8, 112, 104, 8, 8], cab: [105, 30, 94, 24, 4, 17, 7, 2, 55], classes: [11, 15, 10, 5, 5, 109, 0, 0, 5] },
  daily: { none: [2, 2, 10, 7, 8, 112, 104, 8, 8], cab: [13, 4, 19, 5, 3, 59, 0, 0, 8], classes: [6, 4, 10, 5, 5, 109, 0, 0, 5] },
  'wide-standard': { none: [2, 2, 10, 7, 8, 112, 104, 8, 8], cab: [47, 15, 60, 21, 5, 24, 7, 2, 39], classes: [4, 10, 10, 6, 7, 111, 0, 0, 7] },
  busy: { none: [3, 2, 10, 11, 26, 234, 208, 26, 26], cab: [77, 25, 111, 35, 13, 37, 17, 5, 201], classes: [9, 10, 10, 9, 21, 229, 0, 0, 21] }
};

test('presets: every lane as in SPEC.md', () => {
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(EXPECT));
  for (const [id, lanes] of Object.entries(EXPECT)) {
    const s = logic.compute(preset(id));
    for (const [g, v] of Object.entries(lanes)) {
      const m = s.lanes[g].m;
      assert.deepEqual([m.lead10, m.maxLead, m.batch10, m.cfr, m.failed, m.deploys, m.unrec, m.unrecFailed, m.rolled], v, id + ' ' + g);
    }
  }
  assert.deepEqual([S({}).horizon, S(preset('fortnight')).horizon, S(preset('daily')).horizon], [75, 80, 69]);
  assert.equal(S({ seed: 12, load: 4 }).horizon, 65, 'at least the quarter, when every lane ends earlier');
});

test('compute: each lane\'s stage data are its run\'s deployments, and its numbers', () => {
  for (const p of [P({}), P(preset('busy')), P({ board: 2, standard: 'none', seed: 5 })]) {
    const s = logic.compute(p), list = logic.changes(13 * p.load, p.seed);
    for (const g of logic.REGIMES) {
      const r = logic.run(list, g, p);
      assert.deepEqual(s.lanes[g].deploys, r.deploys.map((d) => ({ day: d.day, size: d.ids.length, failed: d.failed, unrec: d.unrec })), g);
      assert.deepEqual(s.lanes[g].m, logic.metrics(r, p.board, g), g);
      assert.equal(s.lanes[g].deploys.filter((d) => d.failed).length, s.lanes[g].m.failed);
    }
    assert.equal(s.lanes.classes.m.meetings, logic.meetingsIn(p.board));
    assert.equal(s.lanes.none.m.meetings, 0);
  }
});

// ── the concept over many quarters (seeds 1–200) ──

test('over 200 quarters: the board for everything waits longer, batches, fails more per deployment; classes record everything', () => {
  const sum = { none: [0, 0], cab: [0, 0], classes: [0, 0] };
  for (let seed = 1; seed <= 200; seed++) {
    const s = S({ seed });
    const { none, cab, classes } = s.lanes;
    assert.ok(cab.m.lead10 > classes.m.lead10, 'lead ' + seed);
    assert.ok(cab.m.batch10 > 10, 'batch ' + seed);
    assert.equal(classes.m.batch10, 10);
    assert.equal(classes.m.unrec, 0);
    assert.equal(none.m.unrec, s.n);
    for (const g of logic.REGIMES) { sum[g][0] += s.lanes[g].m.cfr; sum[g][1] += s.lanes[g].m.lead10; }
  }
  assert.ok(sum.classes[0] < sum.none[0] && sum.none[0] < sum.cab[0], JSON.stringify(sum));
  // a wider standard is faster and fails more; nothing standard is slower and fails less (averages)
  const avg = (over) => { let c = 0, l = 0; for (let seed = 1; seed <= 200; seed++) { const m = S(Object.assign({ seed }, over)).lanes.classes.m; c += m.cfr; l += m.lead10; } return [c, l]; };
  const none = avg({ standard: 'none' }), routine = avg({}), medium = avg({ standard: 'medium' });
  assert.ok(medium[0] > routine[0] && routine[0] > none[0], 'cfr ' + [none, routine, medium]);
  assert.ok(medium[1] < routine[1] && routine[1] < none[1], 'lead ' + [none, routine, medium]);
});

test('the controls: next seed', () => {
  assert.equal(logic.nextSeed(1501), 1502);
  assert.equal(logic.nextSeed(logic.RANGES.seed[1]), 1);
});

test('the defaults are the weekly preset; every preset sits inside the ranges', () => {
  assert.deepEqual(logic.defaults, preset('weekly'));
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
  const p = P(preset('busy'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  const list = logic.changes(30, 5), before = structuredClone(list);
  logic.run(list, 'cab', W);
  assert.deepEqual(list, before, 'run does not change the list');
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset, lane, board interval, standard and caption has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  const caps = ['capMain', 'nBypass', 'nWide', 'nNoStd', 'nDaily'];
  for (const lang of ['hr', 'en']) {
    for (const g of logic.REGIMES) for (const k of ['r_', 'sub_']) assert.ok(strings[lang][k + g], `${lang} ${k}${g}`);
    for (const I of logic.BOARDS) assert.ok(strings[lang]['b_' + I], `${lang} b_${I}`);
    for (const x of logic.STANDARDS) assert.ok(strings[lang]['s_' + x], `${lang} s_${x}`);
    for (const k of caps) assert.ok(strings[lang][k], `${lang} ${k}`);
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: wide-standard → pWideStandard. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
