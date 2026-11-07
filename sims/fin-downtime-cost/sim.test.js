// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-downtime-cost. Run: node --test sims/fin-downtime-cost/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the downtime module's rules (promotable with it),
// then the page model, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const M = require('./downtime.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const ZERO = { rev: 0, off: 0, people: 0, fix: 0, pen: 0, ha: 0 };
const lv = (s, n) => s.levels[logic.LEVELS.indexOf(n)];

// ── tie-breaks ──

test('rule 1a: equal lowest totals go to the fewer nines', () => {
  // every total 0: the cheapest is 99 %
  assert.equal(M.best(M.levels(0, 0, 3)), 2);
  // a week's sum whose third nine saves exactly its cost: 99 % and 99.9 % tie; the cheapest is 99 %
  // downtime 73 000 € at 99 %, 7 300 € at 99.9 %: the nine saves 65 700 € = ha
  const ls = M.levels(140000, 65700, 3);
  assert.deepEqual([ls[0].down, ls[1].down], [73000, 7300]);
  assert.equal(ls[0].tot, ls[1].tot);
  assert.equal(M.best(ls), 2);
  // the same tie one nine up: 99.9 % and 99.99 % equal and lowest → 99.9 %
  const up = M.levels(1400000, 21900, 3);   // the fourth nine saves 73 000 − 7 300 = 65 700 = 3 × 21 900
  assert.equal(up[1].tot, up[2].tot);
  assert.ok(up[1].tot < up[0].tot);
  assert.equal(M.best(up), 3);
});

test('rule 1: ties are decided on the whole euros the page shows, not on fractions of a euro', () => {
  // exact totals 129 999.57 € (99.9 %) and 129 999.96 € (99.99 %): both show 130 000 €, so they tie → 99.9 %
  const s = S({ rev: 500, off: 0, people: 140, fix: 100, pen: 9500, ha: 30000, target: 4 });
  assert.equal(lv(s, 3).tot, lv(s, 4).tot);
  assert.equal(s.best, 3);
  assert.equal(s.nines[1].value, s.nines[1].cost);
  assert.equal(s.nines[1].verdict, 'even');
  assert.equal(s.sameAsBest, true);
  assert.equal(logic.captionKey(s).notes[0], 'nSameAsBest');
  // a nine that shows "saves 55 000 €, costs 55 000 €" is even, and a target with it costs the same as none
  const e = S({ rev: 1000, off: 0, people: 0, fix: 400, pen: 0, ha: 55000, target: 3 });
  assert.deepEqual([e.nines[0].value, e.nines[0].cost, e.nines[0].verdict], [55000, 55000, 'even']);
  assert.equal(e.outcome, 'even');
  assert.equal(e.save, 0);
  assert.equal(e.best, 2);
});

test('rule 1a: the page calls a level with the cheapest total "the same as the cheapest", not the cheapest', () => {
  const s = S(Object.assign({}, ZERO, { target: 4 }));   // every total 0
  assert.equal(s.best, 2);
  assert.equal(s.sameAsBest, true);
  assert.deepEqual(logic.captionKey(s), { key: 'capEven', notes: ['nSameAsBest'] });
  const t = S(Object.assign({}, preset('office'), { target: 4 }));
  assert.equal(t.sameAsBest, false);
  assert.deepEqual(logic.captionKey(t).notes, ['nBest']);
});

test('rule 1b: a nine whose saving equals its cost is even; more pays, less loses', () => {
  const ls = M.levels(140000, 65700, 3);
  assert.equal(M.nine(ls, 3).verdict, 'even');
  assert.equal(M.nine(ls, 3).value, M.nine(ls, 3).cost);
  assert.equal(M.nine(M.levels(140001, 65700, 3), 3).verdict, 'pays');
  assert.equal(M.nine(M.levels(139999, 65700, 3), 3).verdict, 'loses');
  const s = S(Object.assign({}, ZERO));
  assert.deepEqual(s.nines.map((x) => x.verdict), ['even', 'even', 'even']);
});

test('rule 1c: a target with the same total as no redundancy is even; 99 % is the base', () => {
  assert.equal(M.outcome(M.levels(140000, 65700, 3), 3), 'even');
  assert.equal(M.outcome(M.levels(140001, 65700, 3), 3), 'save');
  assert.equal(M.outcome(M.levels(139999, 65700, 3), 3), 'loss');
  const s = S(Object.assign({}, ZERO, { target: 3 }));
  assert.equal(s.outcome, 'even');
  assert.equal(s.save, 0);
  assert.equal(logic.captionKey(s).key, 'capEven');
  const b = S(Object.assign({}, preset('office'), { target: 2 }));
  assert.equal(b.outcome, 'base');
  assert.equal(logic.captionKey(b).key, 'capBase');
});

// ── the downtime module (promotable with it) ──

test('rule 2: an hour down by component; no idle staff outside working hours', () => {
  const hc = M.hourCost({ rev: 3000, off: 150, people: 10, fix: 500, pen: 250 }, 40);
  assert.deepEqual(hc.work, { rev: 3000, staff: 400, fix: 500, pen: 250, sum: 4150 });
  assert.deepEqual(hc.off, { rev: 4500, staff: 0, fix: 500, pen: 250, sum: 5250 });
});

test('rule 3: the week has 50 working hours and 118 others; the average hour is the week ÷ 168', () => {
  assert.equal(M.WORK + M.OFF, 168);
  const ws = M.weekSum(M.hourCost({ rev: 0, off: 0, people: 200, fix: 500, pen: 0 }, 40));
  assert.deepEqual(ws, { rev: 0, staff: 400000, fix: 84000, pen: 0, sum: 484000 });
  assert.equal(Math.round(S(preset('office')).avg), 2881);
  assert.equal(Math.round(S(preset('small-office')).avg), 419);
});

test('rule 4: downtime a year is 10^−n of 365 days', () => {
  assert.deepEqual(logic.LEVELS.map(M.downSeconds), [315360, 31536, 3153.6, 315.36]);
});

test('rule 5: the expected yearly downtime cost is the week × 365 ÷ (7 × 10^n), exact in 1/700 000 €', () => {
  assert.equal(M.S, 700000);
  assert.equal(M.downCost(484000, 2), 484000 * 365 * 1000);
  assert.equal(M.euros(M.downCost(484000, 2)), 252371);   // 252 371.43
  assert.equal(M.euros(M.downCost(484000, 5)), 252);      // 252.37
  assert.equal(M.euros(350000), 1);                        // half a euro rounds up
  assert.equal(M.euros(349999), 0);
  // each nine leaves a tenth: the costs fall tenfold
  const s = S(preset('payments'));
  assert.deepEqual(s.levels.map((l) => l.down), [2329743, 232974, 23297, 2330]);
});

test('rule 6: redundancy costs 0, ha, 4 ha, 13 ha: each nine three times the one before', () => {
  assert.deepEqual(logic.LEVELS.map((n) => M.haCost(40000, n, 3)), [0, 40000, 160000, 520000]);
  assert.deepEqual(logic.LEVELS.map((n) => M.haCost(1000, n, 2)), [0, 1000, 3000, 7000]);
  assert.deepEqual(S(preset('office')).levels.map((l) => l.ha), [0, 40000, 160000, 520000]);
  assert.deepEqual(S(preset('office')).levels.map((l) => l.tot), [252371, 65237, 162524, 520252]);
});

test('rule 7: a nine costs only its own step of redundancy, not the whole', () => {
  // payments with ha = 60 000: the fourth nine saves 209 677 € and costs 240 000 − 60 000 = 180 000 €: it pays
  const s = S(Object.assign({}, preset('payments'), { ha: 60000 }));
  assert.deepEqual([s.nines[1].value, s.nines[1].cost, s.nines[1].verdict], [209677, 180000, 'pays']);
  assert.equal(s.best, 4);
});

test('rule 7: each nine saves the difference in downtime cost and costs the difference in redundancy', () => {
  const s = S(preset('payments'));
  assert.deepEqual(s.nines.map((x) => [x.value, x.cost, x.verdict]),
    [[2096769, 40000, 'pays'], [209677, 120000, 'pays'], [20967, 360000, 'loses']]);
  assert.deepEqual(s.nines.map((x) => x.seconds), [283824, 28382.4, 2838.24]);
});

test('rule 8: the cheapest level is 99 % plus the nines that pay', () => {
  for (const x of logic.presets) {
    const s = S(x.params);
    const pays = s.nines.filter((n) => n.verdict === 'pays').length;
    assert.equal(s.best, 2 + pays, x.id);
  }
  assert.equal(S(Object.assign({}, preset('small-office'), { ha: 0 })).best, 5);   // free redundancy: every nine pays
  assert.equal(S(Object.assign({}, ZERO, { ha: 40000 })).best, 2);                 // nothing to lose: none pays
});

test('rule 9: priced by the working hour the small office would buy the third nine', () => {
  const s = S(preset('small-office'));
  assert.equal(s.best, 2);
  assert.equal(s.naive, 3);
  assert.deepEqual(logic.captionKey(s), { key: 'capLoss', notes: ['nNonePays', 'nNaive'] });
  // the shop's evenings cost more than its working hours: pricing by the working hour underrates it, same level
  const shop = S(preset('shop'));
  assert.ok(shop.hour.off.sum > shop.hour.work.sum);
  assert.equal(shop.naive, shop.best);
  assert.ok(!logic.captionKey(shop).notes.includes('nNaive'));
});

test('rule 9: the naive level prices every hour at the working hour, not at the dearer hour', () => {
  // working hours 3 000 €/h, other hours 6 000 €/h: the average (5 107 €/h) makes the fourth nine pay;
  // priced at the working hour it does not (priced at the dearer other hour it would)
  const s = S({ rev: 3000, off: 200, people: 0, fix: 0, pen: 0, ha: 10000, target: 4 });
  assert.equal(s.best, 4);
  assert.equal(s.naive, 3);
  assert.ok(logic.captionKey(s).notes.includes('nNaive'));
  // the naive week is exactly 168 working hours, on edges where 167 or 169 would flip it:
  // 700 €/h → the third nine saves 61 320 − 6 132 = 55 188 € > 55 000 € (with 167 hours: 54 859 €)
  assert.equal(S({ rev: 0, off: 0, people: 0, fix: 700, pen: 0, ha: 55000 }).naive, 3);
  // 950 €/h → it saves 83 220 − 8 322 = 74 898 € < 75 000 € (with 169 hours: 75 344 €)
  assert.equal(S({ rev: 0, off: 0, people: 0, fix: 700, pen: 250, ha: 75000 }).naive, 2);
});

test('the week chart is scaled to the dearer hour', () => {
  const shop = S(preset('shop'));
  assert.equal(shop.top, 5000);
  assert.equal(S(preset('office')).top, 8500);
});

test('rule 10: the changed mark follows the outcome and the cheapest level', () => {
  const a = S(preset('office'));
  assert.deepEqual(logic.flipped(null, a), []);
  assert.deepEqual(logic.flipped(a, S(Object.assign({}, preset('office'), { people: 210 }))), []);
  assert.deepEqual(logic.flipped(a, S(Object.assign({}, preset('office'), { target: 2 }))), ['outcome']);
  assert.deepEqual(logic.flipped(S(preset('small-office')), S(Object.assign({}, preset('small-office'), { ha: 30000 }))),
    ['outcome', 'best']);
  assert.deepEqual(logic.flipped(S(preset('payments')), S(preset('five-nines'))), []);
});

// ── the page model ──

test('presets give the SPEC numbers', () => {
  const want = {
    'small-office': { hour: [700, 300], down: [36709, 3671, 367, 37], tot: [36709, 43671, 160367, 520037], best: 2, naive: 3, outcome: 'loss', save: -6962 },
    office: { hour: [8500, 500], down: [252371, 25237, 2524, 252], tot: [252371, 65237, 162524, 520252], best: 3, naive: 3, outcome: 'save', save: 187134 },
    shop: { hour: [3900, 5000], down: [409321, 40932, 4093, 409], tot: [409321, 80932, 164093, 520409], best: 3, naive: 3, outcome: 'save', save: 245228 },
    payments: { hour: [28000, 26000], down: [2329743, 232974, 23297, 2330], tot: [2329743, 272974, 183297, 522330], best: 4, naive: 4, outcome: 'save', save: 2146446 },
    'five-nines': { hour: [28000, 26000], down: [2329743, 232974, 23297, 2330], tot: [2329743, 272974, 183297, 522330], best: 4, naive: 4, outcome: 'save', save: 1807413 }
  };
  for (const x of logic.presets) {
    const s = S(x.params), w = want[x.id];
    assert.deepEqual([s.hour.work.sum, s.hour.off.sum], w.hour, x.id);
    assert.deepEqual(s.levels.map((l) => l.down), w.down, x.id);
    assert.deepEqual(s.levels.map((l) => l.tot), w.tot, x.id);
    assert.equal(s.best, w.best, x.id);
    assert.equal(s.naive, w.naive, x.id);
    assert.equal(s.outcome, w.outcome, x.id);
    assert.equal(s.save, w.save, x.id);
  }
  assert.deepEqual(S(preset('small-office')).nines[0], { n: 3, seconds: 283824, value: 33038, cost: 40000, verdict: 'loses' });
});

test('the parts of each level add up to its downtime cost within a euro per part', () => {
  for (const x of logic.presets) {
    for (const l of S(x.params).levels) {
      const sum = l.parts.rev + l.parts.staff + l.parts.fix + l.parts.pen;
      assert.ok(Math.abs(sum - l.down) <= 2, `${x.id} ${l.n}`);
      assert.equal(l.tot, l.down + l.ha);
    }
  }
});

test('the top of the scale: every param at its maximum', () => {
  const s = S({ rev: 20000, off: 200, people: 500, fix: 5000, pen: 10000, ha: 200000, target: 5 });
  assert.equal(s.hour.work.sum, 55000);
  assert.equal(s.hour.off.sum, 55000);
  assert.deepEqual(s.levels.map((l) => l.tot), [4818000, 681800, 848180, 2604818]);
  assert.equal(s.best, 3);
  assert.ok(Number.isSafeInteger(M.downCost(M.WEEK * 55000, 2)));
});

test('captions: which notes go with which state', () => {
  assert.deepEqual(logic.captionKey(S(preset('office'))), { key: 'capSave', notes: ['nAtBest'] });
  assert.deepEqual(logic.captionKey(S(preset('shop'))), { key: 'capSave', notes: ['nBest'] });
  assert.deepEqual(logic.captionKey(S(preset('five-nines'))), { key: 'capSave', notes: ['nBest'] });
  assert.deepEqual(logic.captionKey(S(Object.assign({}, preset('small-office'), { target: 2 }))),
    { key: 'capBase', notes: ['nNonePays', 'nNaive'] });
  assert.deepEqual(logic.captionKey(S(Object.assign({}, preset('office'), { target: 2 }))),
    { key: 'capBase', notes: ['nBest'] });
  assert.deepEqual(logic.captionKey(S(Object.assign({}, preset('office'), { target: 5 }))),
    { key: 'capLoss', notes: ['nBest'] });
  assert.deepEqual(logic.captionKey(S(Object.assign({}, preset('small-office'), { ha: 0, target: 5 }))),
    { key: 'capSave', notes: ['nAtBest'] });
});

test('a loss: a target dearer than no redundancy', () => {
  const s = S(Object.assign({}, preset('office'), { target: 5 }));
  assert.equal(s.outcome, 'loss');
  assert.equal(s.save, 252371 - 520252);
  assert.equal(logic.captionKey(s).key, 'capLoss');
});

test('normalise clamps, snaps and defaults', () => {
  const d = logic.defaults;
  assert.equal(logic.normalise({ rev: 25000 }).rev, 20000);
  assert.equal(logic.normalise({ rev: -5 }).rev, 0);
  assert.equal(logic.normalise({ rev: 740 }).rev, 500);
  assert.equal(logic.normalise({ rev: 760 }).rev, 1000);
  assert.equal(logic.normalise({ off: 30 }).off, 25);
  assert.equal(logic.normalise({ off: 999 }).off, 200);
  assert.equal(logic.normalise({ people: 15 }).people, 20);
  assert.equal(logic.normalise({ people: 4 }).people, 0);
  assert.equal(logic.normalise({ fix: 5100 }).fix, 5000);
  assert.equal(logic.normalise({ pen: 130 }).pen, 250);
  assert.equal(logic.normalise({ ha: 2600 }).ha, 5000);
  assert.equal(logic.normalise({ ha: 1e9 }).ha, 200000);
  assert.equal(logic.normalise({ target: 6 }).target, 3);
  assert.equal(logic.normalise({ target: 1 }).target, 3);
  assert.equal(logic.normalise({ target: '5' }).target, 5);
  assert.equal(logic.normalise({ target: 'x' }).target, 3);
  assert.equal(logic.normalise({ target: 2 }).target, 2);
  assert.equal(logic.normalise({ people: Infinity }).people, d.people);
  assert.equal(logic.normalise({ people: '' }).people, d.people);
  assert.equal(logic.normalise({ people: null }).people, d.people);
  assert.equal(logic.normalise({ fix: true }).fix, d.fix);
  assert.equal(logic.normalise({ fix: 'abc' }).fix, d.fix);
  assert.equal(logic.normalise({ people: ' ' }).people, d.people);
  assert.equal(logic.normalise({ people: [] }).people, d.people);
  assert.equal(logic.normalise({ people: ' 30 ' }).people, 30);
  assert.equal(logic.normalise({ target: '3.5' }).target, 3);
  assert.equal(logic.normalise({ target: 4.6 }).target, 3);
  assert.equal(logic.normalise({ target: true }).target, 3);
  assert.equal(logic.normalise({ target: ' ' }).target, 3);
  assert.equal(logic.normalise({ people: 1000 }).people, 500);
  assert.equal(logic.normalise({ fix: 150 }).fix, 200);
  assert.equal(logic.normalise({ fix: 149 }).fix, 100);
  assert.equal(logic.normalise({ off: 210 }).off, 200);
  assert.equal(logic.normalise({ pen: 20000 }).pen, 10000);
  // after snapping, revenue outside working hours is whole euros
  for (const off of [25, 75, 125, 175]) assert.ok(Number.isInteger(S({ rev: 500, off }).hour.off.rev));
});

test('compute normalises whatever it is given', () => {
  const s = logic.compute({ target: 7, rev: 99999, people: -3 });
  assert.equal(s.p.target, 3);
  assert.equal(s.target.n, 3);
  assert.equal(s.hour.work.rev, 20000);
  assert.equal(s.hour.work.staff, 0);
  assert.deepEqual(logic.compute({}), logic.compute(logic.defaults));
});

test('the defaults are the office-system preset', () => {
  assert.deepEqual(logic.defaults, preset('office'));
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
  const p = P(preset('shop'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset has its label and hint; every level and day its name; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  for (const lang of ['hr', 'en']) {
    for (const n of logic.LEVELS) assert.ok(strings[lang]['lvl' + n], `${lang} level ${n}`);
    for (let d = 1; d <= 7; d++) assert.ok(strings[lang]['d' + d], `${lang} day ${d}`);
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: small-office → pSmallOffice. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
