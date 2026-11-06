// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-cloud-commitment. Run: node --test sims/fin-cloud-commitment/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the commitment module's rules (promotable with it),
// then the page model, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const M = require('./commitment.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const SEAS = logic.USAGE.seasonal;
const flat = (n) => Object.fromEntries(Array.from({ length: 12 }, (_, i) => ['u' + (i + 1), n]));
const useOf = (u) => Object.fromEntries(u.map((x, i) => ['u' + (i + 1), x]));

// ── tie-breaks ──

test('rule 1a: equal lowest totals pick the smallest commitment', () => {
  // seasonal, 3 years: level 8 runs exactly 6 of 12 months (50 %), so 7 and 8 cost the same; the best is 7
  const us = M.termUsage(SEAS, 3, 100);
  assert.equal(M.cost(us, 7, 100, 200).with, M.cost(us, 8, 100, 200).with);
  assert.equal(M.best(us, 20, 100, 200), 7);
  // half the months at 1, half at 0, 3-year price: committing 1 costs exactly what on demand does; the best is 0
  const half = M.termUsage([1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0], 3, 100);
  assert.equal(M.cost(half, 1, 100, 200).with, M.cost(half, 0, 100, 200).with);
  assert.equal(M.best(half, 20, 100, 200), 0);
  // no usage at all: every level only adds cost; the best is 0
  assert.equal(M.best(M.termUsage(new Array(12).fill(0), 1, 100), 20, 140, 200), 0);
});

test('rule 1a: the page calls a level with the best total "the same as the best", not the best', () => {
  const s = S(Object.assign({}, preset('three-years'), { commit: 8 }));
  assert.equal(s.best, 7);
  assert.equal(s.sameAsBest, true);
  assert.deepEqual(logic.captionKey(s), { key: 'capSave', notes: ['nSameAsBest'] });
  const t = S(Object.assign({}, preset('three-years'), { commit: 9 }));
  assert.equal(t.sameAsBest, false);
  assert.deepEqual(logic.captionKey(t).notes, ['nBest']);
});

test('rule 1b: a level exactly at break-even is even; above pays, below loses', () => {
  const us = M.termUsage(SEAS, 3, 100);       // break-even 50 % at the 3-year price
  assert.equal(M.level(us, 8, 100, 200).verdict, 'even');
  assert.equal(M.level(us, 8, 100, 200).margin, 0);
  assert.equal(M.level(us, 7, 100, 200).verdict, 'pays');   // 8 of 12 months
  assert.equal(M.level(us, 9, 100, 200).verdict, 'loses');  // 3 of 12 months
  const s = S(preset('three-years'));
  assert.deepEqual(s.levels.slice(5, 9).map((l) => l.verdict), ['pays', 'pays', 'even', 'loses']);
  assert.equal(s.levels[7].share, 50);
});

test('rule 1c: equal totals are even, neither saving nor loss', () => {
  assert.equal(M.outcome(0), 'even');
  assert.equal(M.outcome(1), 'save');
  assert.equal(M.outcome(-1), 'loss');
  // half the months at 1 server, 3-year term, 1 committed: paid 36 × 100 = 3 600 = 18 × 200 on demand
  const s = S(Object.assign(useOf([1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0]), { commit: 1, term: 3 }));
  assert.equal(s.cost.save, 0);
  assert.equal(s.outcome, 'even');
  assert.equal(s.pct, 0);
  assert.equal(logic.captionKey(s).key, 'capEven');
});

test('rule 1d: percent rounds to nearest, halves away from zero; none when nothing is used', () => {
  assert.equal(M.pct(43, 200), 22);        // 21.5 → 22
  assert.equal(M.pct(-43, 200), -22);      // −21.5 → −22
  assert.equal(M.pct(1, 201), 0);          // 0.497… → 0
  assert.equal(M.pct(-1, 201), 0);
  assert.equal(M.pct(-1, 200), -1);        // −0.5 → −1
  assert.equal(M.pct(2, 3), 67);
  assert.equal(M.pct(-2, 3), -67);
  assert.equal(M.pct(5, 0), null);
  assert.equal(M.pct(-5, 0), null);
});

// ── commitment.js ──

test('rule 2: committed price is the on-demand price less the term\'s discount', () => {
  assert.equal(logic.P, 200);
  assert.equal(logic.committedPrice(1), 140);
  assert.equal(logic.committedPrice(3), 100);
  assert.equal(S({ term: 1 }).breakEven, 70);
  assert.equal(S({ term: 3 }).breakEven, 50);
});

test('rule 3: usage over the term; years 2 and 3 are year 1 scaled by later', () => {
  assert.deepEqual(M.termUsage([1, 2], 1, 50), [100, 200]);
  assert.deepEqual(M.termUsage([1, 2], 3, 50), [100, 200, 50, 100, 50, 100]);
  assert.deepEqual(M.termUsage([4], 3, 125), [400, 500, 500]);
  assert.equal(M.termUsage(SEAS, 3, 100).length, 36);
});

test('rule 4: a month splits into used, unused and on demand around the commitment', () => {
  const s = S({ commit: 7 });
  assert.deepEqual(s.months[0], { u: 5, used: 5, unused: 2, od: 0 });
  assert.deepEqual(s.months[4], { u: 8, used: 7, unused: 0, od: 1 });
  assert.deepEqual(s.months[3], { u: 7, used: 7, unused: 0, od: 0 });
  // the commitment is paid whether used or not
  const c = M.cost([0, 0, 300], 2, 140, 200);
  assert.equal(c.paid, 3 * 2 * 140);
  assert.equal(c.unused, 2 * 140 + 2 * 140);
  assert.equal(c.od, 200);
  assert.equal(c.used, c.paid - c.unused);
});

test('rule 5: totals over the term and the saving', () => {
  const c = M.cost(M.termUsage(SEAS, 1, 100), 6, 140, 200);
  assert.equal(c.all, 92 * 200);
  assert.equal(c.with, c.paid + c.od);
  assert.equal(c.save, c.all - c.with);
  // fractional usage in years 2–3 stays exact
  const d = M.cost(M.termUsage(SEAS, 3, 25), 7, 100, 200);
  assert.equal(d.all, 27600);
  assert.equal(d.unused, 12800);
  assert.equal(d.od, 2800);
});

test('rule 6: a level\'s use counts the part of that server the usage takes', () => {
  assert.equal(M.levelUse([250], 1), 100);
  assert.equal(M.levelUse([250], 2), 100);
  assert.equal(M.levelUse([250], 3), 50);
  assert.equal(M.levelUse([250], 4), 0);
  // the 1-year break-even is 70 %: a server used 9 of 12 months pays, 8 of 12 loses
  const nine = M.termUsage([1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], 1, 100);
  const eight = M.termUsage([1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], 1, 100);
  assert.equal(M.level(nine, 1, 140, 200).verdict, 'pays');
  assert.equal(M.level(eight, 1, 140, 200).verdict, 'loses');
  assert.equal(M.level(nine, 1, 140, 200).margin, 9 * 200 - 12 * 140);
});

test('rule 7: the best level is the lowest total, and equals the number of levels that pay', () => {
  const cases = [[SEAS, 1, 100], [SEAS, 3, 100], [SEAS, 3, 25], [SEAS, 3, 150], [SEAS, 3, 0],
    [logic.USAGE.steady, 1, 100], [[0, 3, 16, 1, 9, 9, 9, 4, 0, 15, 2, 6], 1, 100], [[0, 3, 16, 1, 9, 9, 9, 4, 0, 15, 2, 6], 3, 75]];
  for (const [u, term, later] of cases) {
    const cp = logic.committedPrice(term);
    const us = M.termUsage(u, term, later);
    const b = M.best(us, 16, cp, 200);
    const totals = Array.from({ length: 17 }, (_, c) => M.cost(us, c, cp, 200).with);
    assert.equal(b, totals.indexOf(Math.min(...totals)), `${u} ${term} ${later}`);
    let pays = 0;
    for (let k = 1; k <= 16; k++) if (M.level(us, k, cp, 200).verdict === 'pays') pays++;
    assert.equal(b, pays, `pays ${u} ${term} ${later}`);
  }
});

test('rule 8: both terms\' saving at the chosen level, side by side', () => {
  const pcts = (id, over) => { const c = S(Object.assign({}, preset(id), over)).chips; return { 1: c[1].pct, 3: c[3].pct }; };
  assert.deepEqual(pcts('base-load'), { 1: 21, 3: 37 });
  assert.deepEqual(pcts('cover-peak'), { 1: -19, 3: 15 });
  assert.deepEqual(pcts('usage-falls'), { 1: 21, 3: -1 });
  // later does not touch the 1-year term, and still drives the 3-year chip while the 1-year term is chosen
  assert.equal(pcts('usage-falls', { later: 150 })[1], 21);
  assert.equal(pcts('usage-falls', { term: 1 })[3], -1);
  // each chip carries its own outcome: a saving that rounds to 0 % is still a saving
  const tiny = S(Object.assign(flat(11), { u12: 14, commit: 16, term: 1 }));
  assert.equal(tiny.cost.save, 120);
  assert.deepEqual(tiny.chips[1], { pct: 0, outcome: 'save' });
});

test('rule 9: the outcome mark follows a change of saving, even or loss', () => {
  const a = S(preset('base-load')), b = S(preset('cover-peak')), c = S({ commit: 7 });
  assert.deepEqual(logic.flipped(a, b), ['outcome']);
  assert.deepEqual(logic.flipped(a, c), []);
  assert.deepEqual(logic.flipped(null, a), []);
  assert.deepEqual(logic.flipped(a, S(preset('steady'))), [], 'another saving percent is no change');
  assert.deepEqual(logic.flipped(S({ commit: 0 }), b), ['outcome'], 'even to loss');
});

test('rule 7: the best level reaches the top of the scale and level 1', () => {
  assert.equal(S(flat(16)).best, 16);
  assert.equal(S(Object.assign(flat(1), { commit: 1 })).best, 1);
});

test('captions: the best-level note and the years 2–3 notes', () => {
  assert.deepEqual(logic.captionKey(S(Object.assign(flat(1), { commit: 1 }))).notes, ['nAtBest']);
  assert.deepEqual(logic.captionKey(S({ commit: 7 })).notes, ['nBest']);
  assert.deepEqual(logic.captionKey(S({ term: 1, later: 25 })).notes, ['nAtBest']);
  assert.deepEqual(logic.captionKey(S({ term: 3, commit: 7, later: 0 })).notes, ['nNonePays', 'nStop']);
  // best level 0 with something committed: no level pays, never "the best level is 0"
  assert.deepEqual(logic.captionKey(S(Object.assign(flat(0), { commit: 3, term: 3 }))).notes, ['nNonePays']);
});

test('a level\'s share is exact, not rounded', () => {
  assert.ok(Math.abs(S({}).levels[6].share - 200 / 3) < 1e-9);
});

test('the defaults are preset 2', () => {
  assert.deepEqual(logic.defaults, preset('base-load'));
});

// ── the page model ──

test('presets give the SPEC numbers', () => {
  const want = {
    steady: [19200, 13440, 13440, 0, 0, 5760, 30, 8, 'capSave', ['nAtBest']],
    'base-load': [18400, 14480, 10080, 280, 4400, 3920, 21, 6, 'capSave', ['nAtBest']],
    'cover-peak': [18400, 21840, 21840, 8960, 0, -3440, -19, 6, 'capLoss', ['nBest']],
    'three-years': [55200, 33600, 25200, 1800, 8400, 21600, 39, 7, 'capSave', ['nAtBest']],
    'usage-falls': [27600, 28000, 25200, 12800, 2800, -400, -1, 2, 'capLoss', ['nBest', 'nShrink']]
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  for (const x of logic.presets) {
    const s = logic.compute(P(x.params));
    const k = logic.captionKey(s);
    assert.deepEqual([s.cost.all, s.cost.with, s.cost.paid, s.cost.unused, s.cost.od, s.cost.save, s.pct, s.best, k.key, k.notes],
      want[x.id], x.id);
  }
});

test('SPEC extra cases', () => {
  let s = S({ commit: 0 });
  assert.deepEqual([s.cost.all, s.cost.with, s.outcome, s.best], [18400, 18400, 'even', 6]);
  assert.deepEqual(logic.captionKey(s), { key: 'capNone', notes: ['nBest'] });
  s = S(Object.assign(flat(0), { commit: 0 }));
  assert.deepEqual([s.cost.all, s.cost.with, s.pct, s.best, s.anyUsage], [0, 0, null, 0, false]);
  assert.deepEqual(logic.captionKey(s), { key: 'capNone', notes: [] });
  s = S(Object.assign(flat(0), { commit: 3, term: 3 }));
  assert.deepEqual([s.cost.save, s.pct, s.outcome], [-10800, null, 'loss']);
  s = S({ commit: 7, term: 3, later: 150 });
  assert.deepEqual([s.cost.save, s.pct, s.best, s.levels[9].verdict], [24000, 33, 9, 'even']);
  assert.deepEqual(logic.captionKey(s).notes, ['nBest', 'nGrow']);
  // nothing pays: every month at most 8 of 12 above level 1 with the 1-year price
  s = S(Object.assign(useOf([1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0]), { commit: 0 }));
  assert.deepEqual(logic.captionKey(s), { key: 'capNone', notes: ['nNonePays'] });
});

test('years 2–3 are drawn only for the 3-year term', () => {
  assert.equal(S({ term: 1 }).later, null);
  assert.deepEqual(S({ term: 3, later: 25 }).later.slice(0, 3), [1.25, 1.25, 1.5]);
});

test('the scale is 16 servers', () => {
  assert.equal(logic.N_MAX, 16);
  assert.equal(S({}).levels.length, 16);
});

test('normalise clamps, snaps and defaults params from a URL', () => {
  const p = logic.normalise({ commit: 99, u1: -3, u2: 'x', u3: 4.6, term: '3', later: 60 });
  assert.equal(p.commit, 16);
  assert.equal(p.u1, 0);
  assert.equal(p.u2, logic.defaults.u2);
  assert.equal(p.u3, 5);
  assert.equal(p.term, 3);
  assert.equal(p.later, 50);
  assert.equal(logic.normalise({ term: 2 }).term, 1);
  assert.equal(logic.normalise({ term: 'q' }).term, 1);
  assert.equal(logic.normalise({ later: 400 }).later, 150);
  assert.equal(logic.normalise({ later: Infinity }).later, 100);
  assert.equal(logic.normalise({ commit: Infinity }).commit, logic.defaults.commit);
  assert.equal(logic.normalise({ u12: 17 }).u12, 16);
  assert.equal(logic.normalise({ commit: 4.6 }).commit, 5);
  assert.equal(logic.normalise({ commit: -2 }).commit, 0);
  assert.equal(logic.normalise({ later: -50 }).later, 0);
  assert.equal(logic.normalise({ later: 90 }).later, 100);
  assert.equal(logic.normalise({ term: 5 }).term, 1);
  assert.equal(logic.normalise({ commit: '' }).commit, logic.defaults.commit);
  assert.equal(logic.normalise({ commit: null }).commit, logic.defaults.commit);
  assert.equal(logic.normalise({ u3: true }).u3, logic.defaults.u3);
});

test('every preset sits inside the ranges', () => {
  for (const x of logic.presets) {
    assert.deepEqual(logic.normalise(x.params), Object.assign({}, logic.defaults, x.params), x.id);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('usage-falls'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset has its label and hint; every month its name; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  for (const lang of ['hr', 'en']) {
    for (let m = 1; m <= 12; m++) assert.ok(strings[lang]['m' + m], `${lang} month ${m}`);
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: base-load → pBaseLoad. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
