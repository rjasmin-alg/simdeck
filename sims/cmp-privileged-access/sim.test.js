// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-privileged-access. Run: node --test sims/cmp-privileged-access/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules in order (the week, windows, thefts and
// break-glass stages in privileged.js, then the page's model in sim.js), the presets, and the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const M = require('./privileged.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const JIT = (over) => S(Object.assign({ mode: 'jit' }, over));

// ── tie-breaks first ──

test('rule 3: a window covers its first hour and ends before first + len (the end hour is outside)', () => {
  assert.equal(M.adminAt('jit', [32], 2, 31), false);
  assert.equal(M.adminAt('jit', [32], 2, 32), true);
  assert.equal(M.adminAt('jit', [32], 2, 33), true);
  assert.equal(M.adminAt('jit', [32], 2, 34), false);
  assert.equal(M.adminAt('jit', [], 2, 32), false);
  assert.equal(M.adminAt('standing', [], 2, 3), true);
});

test('rule 2: slots run Monday 08:00 onwards, day by day, without gaps inside the working day', () => {
  assert.deepEqual([0, 1, 2, 3, 4].map((s) => M.slotStart(s, 2)), [8, 10, 12, 14, 32]);
  assert.deepEqual([0, 1, 4].map((s) => M.slotStart(s, 8)), [8, 32, 104]);
  assert.equal(M.slotStart(39, 1), 4 * 24 + 15);
});

test('rule 2: schedules are drawn person by person: a person\'s windows do not depend on the team size', () => {
  const four = M.schedule(42, 4, 3, 2), eight = M.schedule(42, 8, 3, 2);
  assert.deepEqual(eight.slice(0, 4), four);
  assert.deepEqual(four, [[38, 56, 110], [80, 82, 104], [36, 58, 108], [34, 58, 106]]);
});

test('rule 4: every theft takes three draws, so the people and the order are the same at any hour or in working hours', () => {
  const any = M.thefts(42, 100, 4, 'any'), work = M.thefts(42, 100, 4, 'work');
  assert.deepEqual(any.map((x) => x.person), work.map((x) => x.person));
  // the first thefts do not depend on how many are drawn
  assert.deepEqual(M.thefts(42, 1000, 4, 'any').slice(0, 100), any);
  // the thefts' stream is not the schedule's
  const r = M.rng(42), first = r();
  assert.equal(any[0].person, Math.floor(first * 4));
});

// ── the rules ──

test('rule 1: the week and the year', () => {
  assert.equal(M.WEEK, 168);
  assert.equal(M.YEAR, 365 * 24);
  assert.equal(M.WORK_WEEK, 40);
  assert.deepEqual(M.LENGTHS, [1, 2, 4, 8]);
});

test('rule 2: windows are distinct, inside working hours, exactly `per` a person, sorted', () => {
  for (const len of M.LENGTHS) {
    for (let per = 1; per <= M.maxPer(len); per++) {
      for (const seed of [1, 42, 999]) {
        const sch = M.schedule(seed, 3, per, len);
        for (const starts of sch) {
          assert.equal(starts.length, per);
          assert.deepEqual(starts.slice().sort((a, b) => a - b), starts);
          for (let i = 0; i < starts.length; i++) {
            const day = Math.floor(starts[i] / 24), hr = starts[i] % 24;
            assert.ok(day < 5 && hr >= 8 && hr + len <= 16, `${starts[i]} len ${len}`);
            if (i) assert.ok(starts[i] >= starts[i - 1] + len, 'no overlap');
          }
        }
      }
    }
  }
});

test('rule 2: the most elevations a week is what fits the working week, at most 10', () => {
  assert.deepEqual(M.LENGTHS.map(M.maxPer), [10, 10, 10, 5]);
  // eight-hour windows five times a week cover every working hour
  const sch = M.schedule(7, 2, 5, 8);
  assert.deepEqual(sch[0], [8, 32, 56, 80, 104]);
});

test('rule 4: theft hours: any hour of the week, or a working hour on a weekday', () => {
  const any = M.thefts(5, 1000, 3, 'any'), work = M.thefts(5, 1000, 3, 'work');
  assert.ok(any.every((x) => x.hour >= 0 && x.hour < 168 && x.person >= 0 && x.person < 3));
  assert.ok(any.some((x) => Math.floor(x.hour / 24) >= 5), 'weekends happen');
  assert.ok(work.every((x) => Math.floor(x.hour / 24) < 5 && x.hour % 24 >= 8 && x.hour % 24 < 16));
});

test('rule 5: the expected share is the share of theft hours with rights', () => {
  assert.equal(M.expected('standing', 3, 2, 'any'), 1);
  assert.equal(M.expected('standing', 3, 2, 'work'), 1);
  assert.equal(M.expected('jit', 3, 2, 'any'), 6 / 168);
  assert.equal(M.expected('jit', 3, 2, 'work'), 6 / 40);
  assert.equal(M.expected('jit', 5, 8, 'work'), 1);
  assert.equal(M.expected('jit', 5, 8, 'any'), 40 / 168);
});

test('rule 5: admin hours a year and elevations a year', () => {
  assert.equal(M.adminHours('standing', 3, 2), 8760);
  assert.equal(M.adminHours('jit', 3, 2), 312);
  assert.equal(M.elevations('jit', 4, 3), 624);
  assert.equal(M.elevations('standing', 4, 3), 0);
});

test('rule 5: a theft carries the rights exactly when its person is admin at its hour', () => {
  const sch = [[32], [8]];
  const out = M.judge([{ person: 0, hour: 32 }, { person: 1, hour: 32 }, { person: 0, hour: 34 }, { person: 1, hour: 9 }], sch, 'jit', 2);
  assert.deepEqual(out.map((x) => x.admin), [true, false, false, true]);
  assert.ok(M.judge(out, sch, 'standing', 2).every((x) => x.admin));
});

test('rule 5: over many thefts the share comes close to the expected one', () => {
  for (const [per, len, when] of [[3, 2, 'any'], [3, 2, 'work'], [2, 4, 'any'], [10, 1, 'work']]) {
    let hits = 0, all = 0;
    for (const seed of [1, 2, 3, 4, 5]) {
      const sch = M.schedule(seed, 4, per, len);
      const j = M.judge(M.thefts(seed, 1000, 4, when), sch, 'jit', len);
      hits += j.filter((x) => x.admin).length; all += j.length;
    }
    const e = M.expected('jit', per, len, when);
    assert.ok(Math.abs(hits / all - e) < 4 * Math.sqrt(e * (1 - e) / all), `${per}×${len} ${when}: ${hits / all} vs ${e}`);
  }
});

test('rule 7: the break-glass outcome from stage 4 on, by outage and alert', () => {
  for (let st = 0; st < 4; st++) assert.equal(M.glassOutcome(st, true, true), null);
  assert.equal(M.glassOutcome(4, true, true), 'justified');
  assert.equal(M.glassOutcome(4, true, false), 'known');
  assert.equal(M.glassOutcome(4, false, true), 'caught');
  assert.equal(M.glassOutcome(5, false, false), 'unnoticed');
});

test('rule 8: what holds at each stage', () => {
  const row = (st, o, a) => { const g = M.glass(st, o, a); return [g.idpDown, g.open, g.alerted, g.reviewed, g.resealed]; };
  assert.deepEqual(row(0, true, true), [false, false, false, false, false]);
  assert.deepEqual(row(1, true, true), [true, false, false, false, false]);
  assert.deepEqual(row(2, true, true), [true, true, false, false, false]);
  assert.deepEqual(row(3, true, true), [true, true, true, false, false]);
  assert.deepEqual(row(4, true, true), [false, true, true, true, false]);
  assert.deepEqual(row(5, true, true), [false, false, true, true, true]);
  // no outage: the identity system is never down
  assert.ok([0, 1, 2, 3, 4, 5].every((st) => !M.glass(st, false, true).idpDown));
  // without an alert the stage-3 alert is not sent
  assert.equal(M.glass(3, true, false).alerted, false);
  // reviewed when there was an outage or an alert; otherwise the password stays out of the safe
  assert.deepEqual(row(5, true, false), [false, false, false, true, true]);
  assert.deepEqual(row(5, false, true), [false, false, true, true, true]);
  assert.deepEqual(row(5, false, false), [false, true, false, false, false]);
  assert.equal(M.glass(5, true, true).name, 'resealed');
});

test('rule 9: params made safe', () => {
  const n = logic.normalise({ mode: 'x', team: 99, per: 'abc', len: 3, work: 'maybe', thefts: 7, seed: -5, glass: 9, outage: 0, alert: '1' });
  assert.deepEqual(n, { mode: 'standing', team: 8, per: 3, len: 2, work: false, thefts: 100, seed: 1, glass: 5, outage: false, alert: true });
  assert.equal(logic.normalise({ len: '8', per: 9 }).per, 5, 'per clamped to what fits for 8 h');
  assert.equal(logic.normalise({ len: '8', per: 9 }).len, 8, 'len from a URL string');
  assert.equal(logic.normalise({ thefts: '1000' }).thefts, 1000);
  assert.equal(logic.normalise({ team: 1.4 }).team, 2);
  assert.equal(logic.normalise({ seed: 1000 }).seed, 999);
  assert.equal(logic.normalise({ per: 0 }).per, 1);
  assert.equal(logic.normalise({ mode: 'jit' }).mode, 'jit');
  assert.equal(logic.normalise({ glass: -1 }).glass, 0);
});

test('rule 9: "New thefts" moves the seed on by one and wraps after 999', () => {
  assert.equal(logic.nextSeed(42), 43);
  assert.equal(logic.nextSeed(999), 1);
});

test('rule 3, 5: the same thefts are judged under both settings; standing hits every one', () => {
  const st = S({ mode: 'standing' }), jit = JIT({});
  assert.deepEqual(st.thefts.map((x) => [x.person, x.hour]), jit.thefts.map((x) => [x.person, x.hour]));
  assert.equal(st.hits, 100);
  assert.equal(st.standingHits, 100);
  assert.equal(st.jitHits, jit.hits);
  assert.equal(st.sched, null);
  assert.equal(jit.standingHits, 100);
  assert.equal(jit.jitShare, jit.share);
  assert.equal(st.jitHours, 312);
  assert.equal(st.adminHours, 8760);
});

test('rule 10: the caption: break-glass first, then the thefts with at most one note', () => {
  const key = (over) => logic.captionKey(S(over));
  assert.deepEqual(key({ mode: 'standing' }), { key: 'capStanding', notes: [] });
  assert.deepEqual(key({ mode: 'jit' }), { key: 'capJit', notes: [] });
  assert.deepEqual(key({ mode: 'jit', work: true }), { key: 'capJit', notes: ['nWork'] });
  assert.deepEqual(key({ mode: 'jit', per: 5, len: 8, work: true }), { key: 'capJit', notes: ['nAlways'] });
  // nAlways beats nWork; nNone (no hit) beats nWork
  const none = S({ mode: 'jit', thefts: 10, per: 1, len: 1 });
  assert.equal(none.hits, 0);
  assert.deepEqual(logic.captionKey(none).notes, ['nNone']);
  const noneWork = S({ mode: 'jit', thefts: 10, per: 1, len: 1, work: true });
  assert.equal(noneWork.hits, 0);
  assert.deepEqual(logic.captionKey(noneWork).notes, ['nNone']);
  // the break-glass stages
  assert.equal(key({ glass: 1 }).key, 'g1Outage');
  assert.equal(key({ glass: 1, outage: false }).key, 'g1Day');
  assert.equal(key({ glass: 2 }).key, 'g2Outage');
  assert.equal(key({ glass: 2, outage: false }).key, 'g2Day');
  assert.equal(key({ glass: 3 }).key, 'g3Alert');
  assert.equal(key({ glass: 3, alert: false }).key, 'g3Silent');
  assert.equal(key({ glass: 4 }).key, 'g4_justified');
  assert.equal(key({ glass: 4, alert: false }).key, 'g4_known');
  assert.equal(key({ glass: 5, outage: false }).key, 'g5_caught');
  assert.equal(key({ glass: 5, outage: false, alert: false }).key, 'g5_unnoticed');
  assert.deepEqual(key({ glass: 5, mode: 'jit', work: true }).notes, []);
});

test('rule 2: all eight people get exactly `per` draws each (persons 4-7 too)', () => {
  assert.deepEqual(M.schedule(42, 8, 3, 2).slice(4), [[10, 56, 84], [58, 86, 106], [32, 38, 80], [36, 60, 104]]);
});

test('rule 4: thefts reach every person of a larger team', () => {
  assert.equal(new Set(M.thefts(42, 100, 8, 'any').map((x) => x.person)).size, 8);
  assert.ok(S({ team: 8 }).thefts.some((x) => x.person >= 4));
});

test('rule 5: the page numbers follow the team, the theft count and the mode', () => {
  const st = S({ mode: 'standing', team: 6, thefts: 1000 });
  assert.equal(st.standingHits, 1000);
  assert.equal(st.hits, 1000);
  assert.equal(st.elevations, 6 * 3 * 52);
  assert.equal(st.jitShare, 6 / 168, 'the just-in-time bar keeps its own expected share under standing rights');
  assert.equal(st.share, 1);
  assert.equal(JIT({ team: 2, per: 4 }).elevations, 2 * 4 * 52);
});

test('rule 8: the identity system is down with an outage whatever the alert', () => {
  assert.deepEqual([1, 2, 3].map((st) => M.glass(st, true, false).idpDown), [true, true, true]);
  assert.deepEqual(M.STAGES, ['sealed', 'outage', 'opened', 'alert', 'review', 'resealed']);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((st) => M.glass(st, true, true).name), M.STAGES);
});

test('rule 8: stage labels on the silent and unnoticed paths', () => {
  const keys = (o, a) => [0, 1, 2, 3, 4, 5].map((i) => logic.stageKey(i, o, a));
  assert.deepEqual(keys(true, true), ['s_0', 's_1', 's_2', 's_3', 's_4', 's_5']);
  assert.deepEqual(keys(true, false), ['s_0', 's_1', 's_2', 's_3off', 's_4', 's_5']);
  assert.deepEqual(keys(false, true), ['s_0', 's_1day', 's_2', 's_3', 's_4', 's_5']);
  assert.deepEqual(keys(false, false), ['s_0', 's_1day', 's_2', 's_3off', 's_4none', 's_5none']);
  for (const lang of ['hr', 'en']) for (const k of ['s_1day', 's_3off', 's_4none', 's_5none']) assert.ok(strings[lang][k], `${lang} ${k}`);
});

test('rule 9: booleans, empty values and rounding', () => {
  for (const v of [true, 'true', 1, '1']) assert.equal(logic.normalise({ outage: false, alert: v }).alert, true, String(v));
  for (const v of [false, 'false', 0, '0']) assert.equal(logic.normalise({ alert: v }).alert, false, String(v));
  assert.equal(logic.normalise({ alert: 'yes' }).alert, true, 'anything else: the default');
  assert.equal(logic.normalise({ team: '' }).team, 4);
  assert.equal(logic.normalise({ team: null }).team, 4);
  assert.equal(logic.normalise({ seed: '  ' }).seed, 42);
  assert.deepEqual(['team', 'per', 'seed', 'glass'].map((k) => logic.normalise({ team: 5.6, per: 2.6, seed: 9.5, glass: 2.5 })[k]), [6, 3, 10, 3]);
});

test('rule 10: exactly one hit is not "none"', () => {
  const one = JIT({ thefts: 10, seed: 5 });
  assert.equal(one.hits, 1);
  assert.deepEqual(logic.captionKey(one).notes, []);
});

// ── presets (SPEC.md table) ──

test('presets: the table in SPEC.md', () => {
  const row = (id) => {
    const s = logic.compute(preset(id));
    return [s.p.mode, s.hits, s.jitHits, Math.round(s.share * 1000) / 10, s.adminHours, s.elevations, s.glass.stage, s.glass.outcome];
  };
  assert.deepEqual(row('standing'), ['standing', 100, 4, 100, 8760, 624, 0, null]);
  assert.deepEqual(row('jit'), ['jit', 4, 4, 3.6, 312, 624, 0, null]);
  assert.deepEqual(row('work'), ['jit', 15, 15, 15, 312, 624, 0, null]);
  assert.deepEqual(row('all-day'), ['jit', 100, 100, 100, 2080, 1040, 0, null]);
  assert.deepEqual(row('glass'), ['jit', 4, 4, 3.6, 312, 624, 3, null]);
  assert.deepEqual(row('quiet'), ['jit', 4, 4, 3.6, 312, 624, 5, 'unnoticed']);
  assert.ok(logic.compute(preset('glass')).glass.idpDown);
  assert.ok(logic.compute(preset('quiet')).glass.open);
});

test('presets: the same seed with 1000 thefts comes close to the expected share', () => {
  assert.equal(S({ mode: 'jit', thefts: 1000 }).hits, 35);
  assert.equal(S({ mode: 'jit', thefts: 1000, work: true }).hits, 149);
  assert.equal(S({ mode: 'jit', per: 5, len: 8 }).hits, 23);
});

test('the defaults are preset 1; every preset is already normal', () => {
  assert.deepEqual(logic.defaults, preset('standing'));
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
  const p = P(preset('work'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every person, day, stage, outcome, preset and caption has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  assert.match(html, /<script src="strings\.js"><\/script>\s*<script src="privileged\.js"><\/script>\s*<script src="sim\.js"><\/script>/);
  const caps = ['capStanding', 'capJit', 'nAlways', 'nNone', 'nWork', 'g1Outage', 'g1Day', 'g2Outage', 'g2Day', 'g3Alert', 'g3Silent'];
  for (const o of ['justified', 'known', 'caught', 'unnoticed']) caps.push('g4_' + o, 'g5_' + o, 'o_' + o);
  for (const lang of ['hr', 'en']) {
    for (let i = 0; i < M.MAX_TEAM; i++) assert.ok(strings[lang]['n_' + i], `${lang} n_${i}`);
    for (let d = 0; d < 7; d++) assert.ok(strings[lang]['d_' + d], `${lang} d_${d}`);
    for (let st = 0; st < M.STAGES.length; st++) assert.ok(strings[lang]['s_' + st], `${lang} s_${st}`);
    for (const k of caps) assert.ok(strings[lang][k], `${lang} ${k}`);
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: all-day → pAllDay. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
