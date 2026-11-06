// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-capex-opex. Run: node --test sims/fin-capex-opex/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the ledger module's rules (promotable with it), then
// the page model, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const Lg = require('./ledger.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);

// ── tie-breaks ──

test('rule 1: a price equal to the threshold is capitalised; a euro below is expensed', () => {
  assert.equal(Lg.isCapitalised(5000, 5000), true);
  assert.equal(Lg.isCapitalised(4999, 5000), false);
  assert.equal(Lg.isCapitalised(5001, 5000), true);
  assert.equal(S(preset('at-threshold')).cap, true);
  assert.equal(S({ price: 5000, threshold: 5100 }).cap, false);
});

test('rule 1: threshold 0 capitalises every purchase', () => {
  assert.equal(S({ price: logic.PRICE_MIN, threshold: 0 }).cap, true);
});

test('rule 8: rounding is half away from zero and never -0', () => {
  assert.equal(Lg.roundMoney(62.5), 63);
  assert.equal(Lg.roundMoney(-62.5), -63);
  assert.equal(Lg.roundMoney(62.49), 62);
  assert.ok(Object.is(Lg.roundMoney(-0.4), 0));
  assert.ok(Object.is(Lg.roundMoney(-0), 0));
});

test('rule 8: a rounding tie (500 € over 2 years, month 3: 62.5) shows 63, book 437, sum kept', () => {
  const s = S({ price: 500, life: 2, threshold: 0, month: 3 });
  assert.deepEqual(s.at.buy, { cash: 500, expense: 63, book: 437, ebitda: 0, ebit: -63 });
  assert.deepEqual(s.at.svc, { cash: 63, expense: 63, book: 0, ebitda: -63, ebit: -63 });
});

test('rule 8: ties that float summation turns into 62.4999… still round away from zero (tidy)', () => {
  // 500 € over 4 years: 500/48 summed 6 times is 62.49999999999999 in floating point
  const a = S({ price: 500, life: 4, threshold: 0, month: 6 });
  assert.deepEqual([a.at.buy.expense, a.at.buy.book, a.at.svc.cash], [63, 437, 63]);
  // 500 € over 2 years: 500/24 summed 21 times is 437.4999999999999
  const b = S({ price: 500, life: 2, threshold: 0, month: 21 });
  assert.deepEqual([b.at.buy.expense, b.at.buy.book, b.at.svc.cash], [438, 62, 438]);
});

test('rule 8: month-by-month sums are tidied, so float noise cannot flip a tie', () => {
  const r = Lg.purchase(1, 3, true); // dep 1/3 a month: 0.333… × 3 must be exactly 1
  assert.equal(Lg.sums(r, 3).dep, 1);
  assert.equal(Lg.totals(r, 3).book, 0);
});

test('rule 8: on the screen cash = expensed + book value, every month, every case', () => {
  for (const over of [{}, { price: 25000, life: 4 }, { price: 500, life: 2, threshold: 0 }, { price: 3000, threshold: 5000 }, { price: 55500, life: 8 }]) {
    const s0 = S(over);
    for (let m = 0; m <= s0.N; m++) {
      const s = S(Object.assign({}, over, { month: m }));
      for (const side of ['buy', 'svc']) {
        const a = s.at[side];
        assert.equal(a.cash, a.expense + a.book, `${JSON.stringify(over)} ${side} month ${m}`);
      }
    }
  }
});

// ── ledger.js ──

test('ledger: the identity cash = expense + book value holds on the exact totals', () => {
  for (const r of [Lg.purchase(30000, 60, true), Lg.purchase(3000, 60, false), Lg.service(30000, 60)]) {
    for (let m = 0; m <= 60; m++) {
      const x = Lg.totals(r, m);
      near(x.cash, x.expense + x.book, 1e-6);
    }
  }
});

test('rule 2: capitalised purchase: cash on day one, straight-line depreciation, book value falls to 0', () => {
  const r = Lg.purchase(30000, 60, true);
  assert.equal(r.length, 61);
  assert.deepEqual(r[0], { cash: 30000, capex: 30000, dep: 0, opex: 0 });
  for (let m = 1; m <= 60; m++) assert.deepEqual(r[m], { cash: 0, capex: 0, dep: 500, opex: 0 });
  assert.deepEqual(Lg.totals(r, 0), { cash: 30000, expense: 0, book: 30000, ebitda: 0, ebit: 0 });
  assert.deepEqual(Lg.totals(r, 12), { cash: 30000, expense: 6000, book: 24000, ebitda: 0, ebit: -6000 });
  assert.deepEqual(Lg.totals(r, 60), { cash: 30000, expense: 30000, book: 0, ebitda: 0, ebit: -30000 });
});

test('rule 2: depreciation starts in month 1, not on day one', () => {
  const r = Lg.purchase(30000, 60, true);
  assert.equal(Lg.totals(r, 0).expense, 0);
  assert.equal(Lg.totals(r, 1).expense, 500);
});

test('rule 3: expensed purchase: all of it on day one, no asset, EBITDA takes it', () => {
  const r = Lg.purchase(3000, 60, false);
  assert.deepEqual(r[0], { cash: 3000, capex: 0, dep: 0, opex: 3000 });
  for (const m of [0, 1, 30, 60]) {
    assert.deepEqual(Lg.totals(r, m), { cash: 3000, expense: 3000, book: 0, ebitda: -3000, ebit: -3000 });
  }
});

test('rule 4: service: nothing on day one, the fee paid and expensed at the end of each month', () => {
  const r = Lg.service(30000, 60);
  assert.deepEqual(r[0], { cash: 0, capex: 0, dep: 0, opex: 0 });
  for (let m = 1; m <= 60; m++) assert.deepEqual(r[m], { cash: 500, capex: 0, dep: 0, opex: 500 });
  assert.deepEqual(Lg.totals(r, 12), { cash: 6000, expense: 6000, book: 0, ebitda: -6000, ebit: -6000 });
  assert.deepEqual(Lg.totals(r, 60), { cash: 30000, expense: 30000, book: 0, ebitda: -30000, ebit: -30000 });
});

test('ledger: sums clamp the month to the timeline; series has one entry per month', () => {
  const r = Lg.service(1200, 12);
  assert.deepEqual(Lg.totals(r, 99), Lg.totals(r, 12));
  assert.deepEqual(Lg.totals(r, -3), Lg.totals(r, 0));
  const buy = Lg.purchase(30000, 60, true);
  assert.deepEqual(Lg.totals(buy, -3), Lg.totals(buy, 0));
  assert.equal(Lg.totals(buy, -3).cash, 30000);
  const s = Lg.series(r);
  assert.equal(s.length, 13);
  assert.equal(s[6].cash, 600);
});

test('rule 5: capitalised purchase and service have the same expense every month; EBITDA differs by it', () => {
  const buy = Lg.purchase(25000, 48, true), svc = Lg.service(25000, 48);
  for (let m = 0; m <= 48; m++) {
    const a = Lg.totals(buy, m), b = Lg.totals(svc, m);
    assert.equal(a.expense, b.expense, `month ${m}`);
    assert.equal(a.ebit, b.ebit);
    near(a.ebitda - b.ebitda, a.expense, 1e-6);
  }
});

// ── the page model ──

test('presets: the SPEC table, checked with exact fractions', () => {
  const want = {
    'server':         { cap: true,  fee: 500, buy: [30000, 6000, 24000, 0], svc: [6000, -6000], gap: 6000 },
    'day-one':        { cap: true,  fee: 500, buy: [30000, 0, 30000, 0], svc: [0, 0], gap: 0 },
    'end-of-life':    { cap: true,  fee: 500, buy: [30000, 30000, 0, 0], svc: [30000, -30000], gap: 30000 },
    'small-purchase': { cap: false, fee: 50,  buy: [3000, 3000, 0, -3000], svc: [600, -600], gap: -2400 },
    'at-threshold':   { cap: true,  fee: 83,  buy: [5000, 1000, 4000, 0], svc: [1000, -1000], gap: 1000 }
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  for (const [id, w] of Object.entries(want)) {
    const s = S(preset(id));
    assert.equal(s.cap, w.cap, id);
    assert.equal(Lg.roundMoney(s.perMonth), w.fee, id);
    const b = s.at.buy;
    assert.deepEqual([b.cash, b.expense, b.book, b.ebitda], w.buy, id);
    assert.deepEqual([s.at.svc.cash, s.at.svc.ebitda], w.svc, id);
    assert.equal(s.at.svc.expense, s.at.svc.cash, id);
    assert.equal(s.ebitdaGap, w.gap, id);
  }
});

test('odd price: 25 000 € over 4 years at month 7 shows 3 646 / 21 354, fee 521', () => {
  const s = S({ price: 25000, life: 4, threshold: 1000, month: 7 });
  assert.equal(s.N, 48);
  assert.deepEqual([s.at.buy.expense, s.at.buy.book], [3646, 21354]);
  assert.equal(s.at.svc.cash, 3646);
  assert.equal(Lg.roundMoney(s.perMonth), 521);
});

test('rule 6: budgets: capital for a capitalised purchase, operating otherwise and for the service', () => {
  assert.deepEqual(S(preset('server')).budget, { buy: 'capital', svc: 'operating' });
  assert.deepEqual(S(preset('small-purchase')).budget, { buy: 'operating', svc: 'operating' });
  assert.equal(S(preset('server')).perYear, 6000);
});

test('rule 7: the changed mark follows a flip of the classification only', () => {
  const a = S({ price: 5000, threshold: 5000 }), b = S({ price: 5000, threshold: 5100 }), c = S({ price: 5500, threshold: 5000 });
  assert.deepEqual(logic.flipped(a, b), ['class']);
  assert.deepEqual(logic.flipped(b, a), ['class']);
  assert.deepEqual(logic.flipped(a, c), []);
  // a threshold change that keeps the class is not marked
  assert.deepEqual(logic.flipped(a, S({ price: 5000, threshold: 4000 })), []);
  assert.deepEqual(logic.flipped(null, a), []);
});

test('lines: one point per month, same scale for both, the right shapes', () => {
  const s = S({});
  for (const side of ['buy', 'svc']) for (const k of ['cash', 'expense', 'book']) assert.equal(s.lines[side][k].length, 61);
  assert.equal(s.lines.buy.cash[0], 30000);
  assert.equal(s.lines.buy.book[0], 30000);
  assert.equal(s.lines.buy.book[60], 0);
  assert.equal(s.lines.svc.cash[0], 0);
  assert.equal(s.lines.svc.cash[60], 30000);
  assert.ok(s.lines.svc.book.every((x) => x === 0));
});

test('captions: the note by priority', () => {
  const k = (over) => logic.captionKey(S(over));
  assert.deepEqual(k(preset('server')), { buy: 'buyCap', svc: 'svcSoFar', note: 'nEbitdaBetter' });
  assert.deepEqual(k(preset('day-one')), { buy: 'buyCapDay', svc: 'svcNone', note: null });
  assert.deepEqual(k(Object.assign({}, preset('day-one'), { month: 1 })), { buy: 'buyCap', svc: 'svcSoFar', note: 'nEbitdaBetter' });
  assert.deepEqual(k(preset('end-of-life')), { buy: 'buyCap', svc: 'svcSoFar', note: 'nEnd' });
  assert.deepEqual(k(preset('small-purchase')), { buy: 'buyExp', svc: 'svcSoFar', note: 'nEbitdaWorse' });
  assert.deepEqual(k(Object.assign({}, preset('small-purchase'), { month: 0 })), { buy: 'buyExp', svc: 'svcNone', note: 'nEbitdaWorse' });
  assert.deepEqual(k(Object.assign({}, preset('small-purchase'), { month: 60 })), { buy: 'buyExp', svc: 'svcSoFar', note: 'nEndSame' });
});

test('normalise: clamps, snaps, defaults non-numbers, and pulls the month back with the life', () => {
  const p = logic.normalise({ price: 123456, life: 99, threshold: -5, month: 999 });
  assert.deepEqual(p, { price: logic.PRICE_MAX, life: logic.LIFE_MAX, threshold: 0, month: 96 });
  const q = logic.normalise({ price: 1, life: 0, threshold: 99999, month: -4 });
  assert.deepEqual(q, { price: logic.PRICE_MIN, life: logic.LIFE_MIN, threshold: logic.THR_MAX, month: 0 });
  assert.equal(logic.normalise({ price: 30240 }).price, 30000);
  assert.equal(logic.normalise({ threshold: 1049 }).threshold, 1000);
  assert.equal(logic.normalise({ life: 2, month: 60 }).month, 24);
  assert.deepEqual(logic.normalise({ price: 'x', life: 'y', threshold: 'z', month: 'w' }), logic.defaults);
  assert.equal(logic.normalise({ life: 4.6 }).life, 5);
  assert.equal(logic.normalise({ month: 12.4 }).month, 12);
});

test('defaults and ranges are the SPEC params table', () => {
  assert.deepEqual(logic.defaults, { price: 30000, life: 5, threshold: 1000, month: 12 });
  assert.deepEqual([logic.PRICE_MIN, logic.PRICE_MAX, logic.PRICE_STEP], [500, 60000, 500]);
  assert.deepEqual([logic.LIFE_MIN, logic.LIFE_MAX], [2, 8]);
  assert.deepEqual([logic.THR_MAX, logic.THR_STEP], [10000, 100]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('small-purchase'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the model has its label and hint in both languages; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  for (const x of logic.presets) {
    for (const k of Object.keys(x.params)) assert.ok(k in logic.defaults, `${x.id}: ${k} is a model param`);
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: day-one → pDayOne. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
