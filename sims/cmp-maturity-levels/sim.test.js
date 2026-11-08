// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-maturity-levels. Run: node --test sims/cmp-maturity-levels/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules in order, the presets, and the template's
// generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

/** Params from two strings of eight digits and a budget. */
function P(cur, tgt, budget) {
  const p = { budget: budget === undefined ? 24 : budget };
  cur.split('').forEach((x, i) => { p['c' + (i + 1)] = Number(x); });
  (tgt || cur).split('').forEach((x, i) => { p['t' + (i + 1)] = Number(x); });
  return p;
}
const S = (cur, tgt, budget) => logic.compute(P(cur, tgt, budget));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);

// ── tie-breaks first ──

test('rule 5: on a tie the weakest area is the first in area order', () => {
  assert.equal(logic.summary([3, 2, 4, 2, 5, 3, 3, 3]).weakest, 1);
  assert.equal(logic.summary([3, 3, 3, 3, 3, 3, 3, 3]).weakest, 0);
  assert.equal(logic.summary([4, 4, 4, 4, 4, 4, 4, 1]).weakest, 7);
});

test('rule 6: a plan that costs exactly the budget fits; one week more does not', () => {
  // 1 → 3 is 2 + 4 = 6; 3 → 4 is 8; 1 → 4 is 14 … build exactly 12 and 14
  const s12 = S('11111111', '13311111', 12); // 6 + 6 = 12
  assert.equal(s12.cost, 12);
  assert.equal(s12.over, false);
  assert.equal(s12.left, 0);
  const s14 = S('11111111', '14111111', 12); // 14
  assert.equal(s14.over, true);
  assert.equal(s14.left, -2);
  assert.equal(s12.compare.find((x) => x.id === 'yours').fits, true);
  assert.equal(s14.compare.find((x) => x.id === 'yours').fits, false);
});

test('rule 7: target + that reaches the budget exactly is allowed; past it refused', () => {
  const s = S('11111111', '13211111', 12); // 6 + 2 = 8, next step of area 3 (2 → 3) costs 4 → 12
  assert.equal(s.cost, 8);
  assert.deepEqual(logic.move(s, 'tUp', 2), { ok: true, why: null, patch: { t3: 3 } });
  const s2 = S('11111111', '13311111', 12); // 12 used
  const m = logic.move(s2, 'tUp', 0);
  assert.equal(m.ok, false);
  assert.equal(m.why, 'budget');
});

test('rule 7: at level 5 the refusal is "top", checked before the budget', () => {
  const s = S('51111111', '51111111', 12);
  const over = S('11111111', '15111111', 12); // over budget already (30 > 12)
  assert.equal(logic.move(s, 'tUp', 0).why, 'top');
  assert.equal(over.over, true);
  assert.equal(logic.move(over, 'tUp', 1).why, 'top');
  assert.equal(logic.move(over, 'tUp', 2).why, 'budget');
});

test('rule 9: a target below the current level is raised to it', () => {
  const p = logic.normalise(P('44341343', '11111111'));
  assert.equal(p.c5, 1);
  assert.equal(p.t5, 1);
  assert.equal(p.c1, 4);
  assert.equal(p.t1, 4);
  assert.equal(S('44341343', '11111111').cost, 0);
});

test('rule 3: level 3 raises nothing; level 2 a minor, level 1 a major', () => {
  assert.equal(logic.finding(1), 'major');
  assert.equal(logic.finding(2), 'minor');
  assert.equal(logic.finding(3), null);
  assert.equal(logic.finding(5), null);
});

test('rule 10: an average of exactly 3 with a weak area gives the "hides" note', () => {
  const e = S('11111111', '24333333', 96); // (2+4+18)/8 = 3
  near(e.plan.avg, 3);
  assert.equal(e.plan.low, 2);
  assert.deepEqual(logic.captionKey(e).notes, ['nHides']);
  const b = S('11111111', '23333333', 96); // 23/8 < 3
  assert.ok(b.plan.avg < 3);
  assert.notDeepEqual(logic.captionKey(b).notes, ['nHides']);
});

// ── rules in order ──

test('rule 1: eight areas, levels 1 to 5', () => {
  assert.equal(logic.AREAS, 8);
  assert.equal(logic.MIN, 1);
  assert.equal(logic.MAX, 5);
  assert.equal(S('44341343').rows.length, 8);
});

test('rule 2: each level up costs twice the last; an area from c to t costs 2^t − 2^c', () => {
  assert.deepEqual([1, 2, 3, 4].map(logic.stepCost), [2, 4, 8, 16]);
  for (let c = 1; c <= 5; c++) {
    for (let t = c; t <= 5; t++) assert.equal(logic.areaCost(c, t), Math.pow(2, t) - Math.pow(2, c));
  }
  assert.equal(logic.areaCost(3, 3), 0);
  assert.equal(logic.areaCost(4, 2), 0);
  assert.equal(logic.planCost([1, 4], [3, 5]), 6 + 16);
});

test('rule 3: majors and minors are counted separately', () => {
  const x = logic.summary([1, 2, 2, 3, 4, 5, 1, 3]);
  assert.equal(x.major, 2);
  assert.equal(x.minor, 2);
});

test('rule 4: each level up halves the incidents; the sum over the areas', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(logic.incidents), [8, 4, 2, 1, 0.5]);
  assert.equal(logic.summary([1, 1, 1, 1, 1, 1, 1, 1]).inc, 64);
  assert.equal(logic.summary([5, 5, 5, 5, 5, 5, 5, 5]).inc, 4);
});

test('rule 5: average, weakest and its share of the incidents', () => {
  const x = logic.summary([4, 4, 3, 4, 1, 3, 4, 3]);
  near(x.avg, 3.25);
  assert.equal(x.weakest, 4);
  assert.equal(x.low, 1);
  assert.equal(x.inc, 18);
  near(x.share, 8 / 18);
});

test('rule 7: target − stops at the current level; current ± within 1…5; current + pushes the target', () => {
  const s = S('44341343', '44343343');
  assert.deepEqual(logic.move(s, 'tDown', 4), { ok: true, why: null, patch: { t5: 2 } });
  assert.equal(logic.move(s, 'tDown', 0).why, 'floor');
  assert.deepEqual(logic.move(s, 'cUp', 0), { ok: true, why: null, patch: { c1: 5, t1: 5 } });
  assert.deepEqual(logic.move(s, 'cUp', 4), { ok: true, why: null, patch: { c5: 2, t5: 3 } });
  assert.equal(logic.move(S('54341343'), 'cUp', 0).why, 'top');
  assert.deepEqual(logic.move(s, 'cDown', 0), { ok: true, why: null, patch: { c1: 3 } });
  assert.equal(logic.move(s, 'cDown', 4).why, 'bottom');
  assert.equal(logic.move(s, 'sideways', 0).why, 'unknown');
});

test('rule 7: lowering a current level keeps the target, so the plan can go over the budget', () => {
  const p = Object.assign(P('44341343', '44443443'), { c3: 1 });
  const s = logic.compute(p);
  assert.equal(s.tgt[2], 4);
  assert.equal(s.cost, 14 + 6 + 8);
  assert.equal(s.over, true);
});

test('rule 8: the four plans from the same current levels', () => {
  const s = S('44341343', '44443443', 24);
  assert.deepEqual(s.compare.map((x) => x.id), ['now', 'plus1', 'floor', 'yours']);
  const [now, plus1, floor, yours] = s.compare;
  assert.deepEqual(now.levels, [4, 4, 3, 4, 1, 3, 4, 3]);
  assert.equal(now.cost, 0);
  assert.deepEqual(plus1.levels, [5, 5, 4, 5, 2, 4, 5, 4]);
  assert.equal(plus1.cost, 90);
  assert.equal(plus1.fits, false);
  assert.deepEqual(floor.levels, [4, 4, 3, 4, 3, 3, 4, 3]);
  assert.equal(floor.cost, 6);
  assert.equal(yours.cost, 22);
  assert.equal(yours.fits, true);
  assert.deepEqual(logic.planTargets('plus1', [5, 1], [5, 1]), [5, 2]);
});

test('rule 9: normalise edge cases', () => {
  const d = logic.defaults;
  assert.equal(logic.normalise({ c1: '  ' }).c1, d.c1);
  assert.equal(logic.normalise({ c1: null }).c1, d.c1);
  assert.equal(logic.normalise({ c1: -Infinity }).c1, d.c1);
  assert.equal(logic.normalise({ c1: 'x' }).c1, d.c1);
  assert.equal(logic.normalise({ c1: '2' }).c1, 2);
  assert.equal(logic.normalise({ c1: 2.6 }).c1, 3);
  assert.equal(logic.normalise({ c1: 9 }).c1, 5);
  assert.equal(logic.normalise({ c1: 0 }).c1, 1);
  assert.equal(logic.normalise({ budget: '48' }).budget, 48);
  assert.equal(logic.normalise({ budget: '048' }).budget, 24);
  assert.equal(logic.normalise({ budget: '12' }).budget, 12);
  assert.equal(logic.normalise({ c1: true }).c1, d.c1);
  assert.equal(logic.normalise({ budget: 30 }).budget, 24);
});

test('rule 10: the sentence: empty plan or plan; the notes in order', () => {
  assert.deepEqual(logic.captionKey(S('44341343')), { key: 'capNow', notes: [] });
  // over budget beats everything
  assert.deepEqual(logic.captionKey(S('44341343', '55452454', 24)).notes, ['nOver']);
  // hides: preset plus-one
  assert.deepEqual(logic.captionKey(logic.compute(preset('plus-one'))).notes, ['nHides']);
  // top: buys 4 → 5 while an area stays below 3, average below 3
  const top = S('11111114', '11111115', 24);
  assert.ok(top.plan.avg < 3);
  assert.deepEqual(logic.captionKey(top), { key: 'capPlan', notes: ['nTop'] });
  // clear
  assert.deepEqual(logic.captionKey(logic.compute(preset('floor'))).notes, ['nClear']);
  // a plan with a finding left, no top step, average below 3: no note
  assert.deepEqual(logic.captionKey(S('11111111', '21111111', 24)).notes, []);
});

test('the clear-plan patch sets every target to the current level', () => {
  const s = S('44341343', '44443443');
  const p = Object.assign({}, s.p, logic.clearPlan(s));
  assert.equal(logic.compute(p).cost, 0);
  assert.equal(logic.compute(p).empty, true);
});

// ── added after the fresh review (mutants that survived) ──

test('rule 10: a one-week plan is not empty; nothing below 3 now gives the neutral sentence', () => {
  assert.equal(S('11111111', '21111111').empty, false);
  assert.deepEqual(logic.captionKey(S('44444444')), { key: 'capNowOk', notes: [] });
  assert.deepEqual(logic.captionKey(S('34444444')), { key: 'capNowOk', notes: [] });
  assert.deepEqual(logic.captionKey(S('24444444')), { key: 'capNow', notes: [] });
});

test('rule 10: the top note needs a bought 4 → 5 step and an area below 3; clear needs no minors either', () => {
  assert.deepEqual(logic.captionKey(S('51111111', '52111111', 24)).notes, []);
  assert.deepEqual(logic.captionKey(S('11111113', '11111114', 24)).notes, []);
  assert.deepEqual(logic.captionKey(S('33333334', '33333335', 24)).notes, ['nClear']);
  assert.deepEqual(logic.captionKey(S('11111111', '22222222', 24)).notes, []);
});

test('rule 7: a budget refusal carries the step\'s cost and what is left', () => {
  const m = logic.move(S('11111111', '13311111', 12), 'tUp', 1); // 3 → 4 costs 8, 0 left
  assert.equal(m.need, 8);
  assert.equal(m.left, 0);
});

test('rules 2–4: the table rows', () => {
  assert.deepEqual(S('44341343', '44343343').rows[4], { i: 4, c: 1, t: 3, cost: 6, f: null, inc: 2 });
  assert.deepEqual(S('44341343', '44343343').rows[0], { i: 0, c: 4, t: 4, cost: 0, f: null, inc: 1 });
  assert.equal(S('44341343', '44342343').rows[4].f, 'minor');
});

test('the clear-plan patch is the current levels', () => {
  assert.deepEqual(logic.clearPlan(S('44341343', '44443443')), { t1: 4, t2: 4, t3: 3, t4: 4, t5: 1, t6: 3, t7: 4, t8: 3 });
});

// ── presets against SPEC.md ──

test('presets: the SPEC table', () => {
  const want = {
    'average-fine': { cost: 0, budget: 24, avg: [3.25, 3.25], w: [4, 4], low: [1, 1], f: [[1, 0], [1, 0]], inc: [18, 18], share: 8 / 18, notes: [] },
    'plus-one': { cost: 90, budget: 96, avg: [3.25, 4.25], w: [4, 4], low: [1, 2], f: [[1, 0], [0, 1]], inc: [18, 9], share: 4 / 9, notes: ['nHides'] },
    floor: { cost: 6, budget: 24, avg: [3.25, 3.5], w: [4, 2], low: [1, 3], f: [[1, 0], [0, 0]], inc: [18, 12], share: 2 / 12, notes: ['nClear'] },
    'per-area': { cost: 22, budget: 24, avg: [3.25, 3.75], w: [4, 4], low: [1, 3], f: [[1, 0], [0, 0]], inc: [18, 10], share: 2 / 10, notes: ['nClear'] },
    showcase: { cost: 0, budget: 24, avg: [3.75, 3.75], w: [6, 6], low: [1, 1], f: [[1, 1], [1, 1]], inc: [16.5, 16.5], share: 8 / 16.5, notes: [] },
    'showcase-floor': { cost: 10, budget: 12, avg: [3.75, 4.125], w: [6, 4], low: [1, 3], f: [[1, 1], [0, 0]], inc: [16.5, 8.5], share: 2 / 8.5, notes: ['nClear'] }
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  for (const [id, w] of Object.entries(want)) {
    const s = logic.compute(preset(id));
    assert.equal(s.cost, w.cost, id);
    assert.equal(s.budget, w.budget, id);
    assert.equal(s.over, false, id);
    near(s.now.avg, w.avg[0]); near(s.plan.avg, w.avg[1]);
    assert.deepEqual([s.now.weakest, s.plan.weakest], w.w, id);
    assert.deepEqual([s.now.low, s.plan.low], w.low, id);
    assert.deepEqual([[s.now.major, s.now.minor], [s.plan.major, s.plan.minor]], w.f, id);
    assert.deepEqual([s.now.inc, s.plan.inc], w.inc, id);
    near(s.plan.share, w.share);
    assert.deepEqual(logic.captionKey(s).notes, w.notes, id);
  }
});

test('presets: the comparison for both firms (SPEC)', () => {
  const a = logic.compute(preset('average-fine')).compare;
  assert.deepEqual(a.map((x) => [x.cost, x.avg, x.weakest, x.low, x.major, x.minor, x.inc]).slice(0, 3),
    [[0, 3.25, 4, 1, 1, 0, 18], [90, 4.25, 4, 2, 0, 1, 9], [6, 3.5, 2, 3, 0, 0, 12]]);
  const s = logic.compute(preset('showcase')).compare;
  assert.deepEqual(s.map((x) => [x.cost, x.avg, x.weakest, x.low, x.major, x.minor, x.inc]).slice(1, 3),
    [[54, 4.375, 6, 2, 0, 1, 9], [10, 4.125, 4, 3, 0, 0, 8.5]]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.initial(Object.assign({}, logic.defaults, p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = Object.assign({}, preset('per-area'), { t1: 1 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset, caption, area, level and plan has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  const keys = ['capNow', 'capNowOk', 'capPlan', 'refOver', 'nOver', 'nHides', 'nTop', 'nClear', 'refTop', 'refBudget', 'refFloor', 'refBottom'];
  for (const lang of ['hr', 'en']) {
    for (const k of keys) assert.ok(strings[lang][k], `${lang} ${k}`);
    for (let i = 1; i <= logic.AREAS; i++) assert.ok(strings[lang]['area' + i], `${lang} area${i}`);
    for (let L = logic.MIN; L <= logic.MAX; L++) assert.ok(strings[lang]['lv' + L], `${lang} lv${L}`);
    for (const id of logic.PLANS) assert.ok(strings[lang]['plan_' + id], `${lang} plan_${id}`);
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: average-fine → pAverageFine. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
