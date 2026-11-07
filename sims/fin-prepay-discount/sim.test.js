// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-prepay-discount. Run: node --test sims/fin-prepay-discount/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then prepay.js (promotable with it), then the copied
// discount.js block (from sims/fin-npv-discounting/sim.test.js @ b341da3, kept with the copy, COMMON.md §6), then the
// page model, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const D = require('./discount.js');
const Q = require('./prepay.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);
const monthlyIn = (m, n = 36) => Array.from({ length: n }, (_, i) => ({ t: i, amount: m }));

// ── tie-breaks ──

test('rule 5 tie-break: at the same instant the inflow comes before the payment', () => {
  const b = Q.balance(100, [{ t: 0, amount: 10 }], [{ t: 0, amount: 10 }]);
  assert.deepEqual(b.points.map((x) => x.bal), [100, 110, 100]);
  assert.deepEqual(b.low, { t: 0, bal: 100 }, 'never 90');
  // several events at one instant: every inflow first, whatever the order of the lists
  const c = Q.balance(100, [{ t: 1, amount: 5 }, { t: 1, amount: 5 }], [{ t: 1, amount: 30 }, { t: 1, amount: 10 }]);
  assert.deepEqual(c.points.map((x) => x.bal), [100, 105, 110, 80, 70]);
  // on the page: with 0-day terms the monthly plan stays at the buffer
  const s = S({ terms: 0 });
  assert.equal(s.ways[0].low.bal, 200000);
  assert.equal(s.ways[0].points.every((x) => x.bal >= 200000), true);
  assert.equal(s.ways[1].low.bal, 200000 + 5000 - 162000, 'month 0 budget first, then the upfront payment');
});

test('rule 6 tie-break: the earliest of equal lows; equal to the minimum is not below it', () => {
  const b = Q.balance(50, [{ t: 1, amount: 20 }], [{ t: 0.5, amount: 20 }, { t: 1.5, amount: 20 }]);
  assert.deepEqual(b.low, { t: 0.5, bal: 30 });
  // the default upfront plan bottoms at 43 000: a minimum of 40 000 is not reached, 50 000 is
  assert.equal(S({ floor: 40000 }).ways[1].below, false);
  assert.equal(S({ floor: 50000 }).ways[1].below, true);
  // exactly at the minimum: 200 000 + 5 000 − 2 · 60 000 · 0.875 = 100 000
  const at = S({ buffer: 200000, years: 2, discount: 12.5, floor: 100000 });
  assert.equal(at.ways[1].lowR, 100000);
  assert.equal(at.ways[1].below, false, 'equal is not below');
  assert.equal(S({ buffer: 200000, years: 2, discount: 12.5, floor: 110000 }).ways[1].below, true);
});

test('rule 10 tie-break: a saving that rounds to 0 is "even", and only then', () => {
  for (const years of [1, 2, 3]) {
    const s = S({ years, discount: 0, coc: 0 });
    assert.equal(s.savingR, 0);
    assert.equal(s.verdict, 0);
    assert.equal(logic.captionKey(s).key, 'capEven');
  }
  assert.equal(S({ discount: 0.5, coc: 0 }).verdict, 1, 'any discount pays when money costs nothing');
  assert.equal(S({ discount: 0, coc: 0.5 }).verdict, -1, 'no discount never pays when money costs something');
  assert.equal(D.sign(0.49), 0);
  assert.equal(D.sign(-0.5), -1);
});

test('rule 11: the rate gets more decimals only when fewer would read as equal to the cost of capital', () => {
  assert.equal(logic.rateDigits(S({})), 1, '7.6 % against 8 %');
  const a = S({ years: 1, discount: 5, coc: 12 });   // 11.97 % reads 12.0 % at one decimal
  assert.equal((100 * a.rate).toFixed(1), '12.0');
  assert.notEqual(a.verdict, 0);
  assert.equal(logic.rateDigits(a), 2);
  const b = S({ years: 3, discount: 11, coc: 8.5 });  // 8.504 %
  assert.equal(logic.rateDigits(b), 3);
  assert.equal(b.verdict, 1);
  const c = S({ years: 3, discount: 5.5, coc: 4 });   // 3.996 %
  assert.equal(logic.rateDigits(c), 3);
  assert.equal(c.verdict, -1);
  assert.equal(logic.rateDigits(S({ discount: 0, coc: 0 })), 1, 'even: one decimal');
});

// ── prepay.js (rules 1-9) ──

test('rule 3: terms in months: 30 days = 12 · 30 / 365', () => {
  near(Q.termsMonths(30), 360 / 365, 1e-12);
  assert.equal(Q.termsMonths(0), 0);
  near(Q.termsMonths(90), 1080 / 365, 1e-12);
});

test('rule 2: monthly plan: one invoice of m a month; upfront: n months at (1 − d), the rest monthly', () => {
  const mon = Q.schedule({ monthly: 5000, months: 36, upfront: 0, discount: 0.1, days: 0 });
  assert.equal(mon.length, 36);
  assert.deepEqual(mon.slice(0, 2).map((x) => [x.t, x.amount]), [[0, 5000], [1, 5000]]);
  const up = Q.schedule({ monthly: 5000, months: 36, upfront: 12, discount: 0.1, days: 0 });
  assert.equal(up.length, 1 + 24);
  assert.deepEqual([up[0].t, up[0].amount, up[0].months], [0, 54000, 12]);
  assert.deepEqual([up[1].t, up[1].amount], [12, 5000]);
  const all = Q.schedule({ monthly: 5000, months: 36, upfront: 36, discount: 0.1, days: 0 });
  assert.equal(all.length, 1);
  assert.equal(all[0].amount, 162000);
  // more upfront months than the contract: capped at the contract
  assert.equal(Q.schedule({ monthly: 1, months: 12, upfront: 36, discount: 0, days: 0 })[0].months, 12);
});

test('rule 3: the terms shift every payment by the same time, in both plans', () => {
  for (const upfront of [0, 12, 24, 36]) {
    const a = Q.schedule({ monthly: 5000, months: 36, upfront, discount: 0.1, days: 0 });
    const b = Q.schedule({ monthly: 5000, months: 36, upfront, discount: 0.1, days: 60 });
    assert.equal(a.length, b.length);
    a.forEach((x, i) => { near(b[i].t - x.t, Q.termsMonths(60), 1e-12); assert.equal(b[i].amount, x.amount); });
  }
});

test('rule 4: expense per year: m a month, (1 − d) of it for months paid upfront; the terms change nothing', () => {
  assert.deepEqual(Q.expenseByYear({ monthly: 5000, months: 36, upfront: 0, discount: 0.1 }), [60000, 60000, 60000]);
  const e = Q.expenseByYear({ monthly: 5000, months: 36, upfront: 24, discount: 0.12 });
  e.forEach((x, i) => near(x, [52800, 52800, 60000][i], 1e-9));
  for (const terms of logic.TERMS) {
    assert.deepEqual(S({ terms, years: 1 }).ways[1].expense, S({ years: 1 }).ways[1].expense);
    assert.deepEqual(S({ terms }).ways[0].expense, [60000, 60000, 60000]);
  }
});

test('rule 5: balance = buffer + inflows so far − payments so far; the plans end apart by the saving on paper', () => {
  const s = S({});
  const [mon, up] = s.ways;
  assert.equal(mon.end, 200000);
  assert.equal(up.end, 200000 + 18000);
  near(up.end - mon.end, s.savingPaper, 1e-9);
  // at any time t: start + inflows up to t − payments up to t
  const t = 13.5;
  const inflow = 5000 * 14;
  const paid = up.payments.filter((x) => x.t <= t).reduce((a, x) => a + x.amount, 0);
  assert.equal(Q.balanceAt(up.points, t), 200000 + inflow - paid);
});

test('rule 6: the lowest balance includes the start; below 0 is overdrawn', () => {
  const b = Q.balance(100, [{ t: 0, amount: 50 }], []);
  assert.deepEqual(b.low, { t: 0, bal: 100 }, 'the start itself');
  const s = S({ buffer: 100000, discount: 0 });
  assert.ok(s.ways[1].lowR < 0);
  assert.deepEqual(logic.captionKey(s), { key: 'capNoDiscount', notes: ['nOverdrawn', 'nTerms'] });
});

test('rule 6: a lowest balance of exactly 0 is below the minimum, not overdrawn', () => {
  const s = S({ buffer: 130000, discount: 25 });   // 130 000 + 5 000 − 135 000
  assert.equal(s.ways[1].lowR, 0);
  assert.deepEqual(logic.captionKey(s).notes, ['nBelowFloor', 'nTerms']);
  assert.equal(logic.captionKey(S({ buffer: 120000, discount: 25 })).notes[0], 'nOverdrawn');
});

test('rule 5: balanceAt counts an event at exactly that time', () => {
  const pts = S({}).ways[1].points;
  assert.equal(Q.balanceAt(pts, 0), 205000, 'month 0: start and its budget');
  assert.equal(Q.balanceAt(pts, Q.termsMonths(30)), 43000, 'the upfront payment, at its own time');
  assert.equal(Q.balanceAt(pts, 1), 48000);
  assert.equal(Q.balanceAt(pts, 0.999), 43000);
});

test('rule 7: tied up = the upfront payment less the month the monthly plan pays at the same instant', () => {
  for (const [years, discount, terms] of [[1, 10, 30], [2, 12, 0], [3, 10, 90], [3, 0, 60]]) {
    const s = S({ years, discount, terms });
    near(s.tied, 5000 * 12 * years * (1 - discount / 100) - 5000, 1e-6);
  }
  assert.equal(Q.tiedUp([{ t: 0, bal: 5 }], [{ t: 0, bal: 9 }]), 0, 'never below: 0');
  // event times of either plan count, also when they differ
  assert.equal(Q.tiedUp([{ t: 0, bal: 10 }], [{ t: 0, bal: 10 }, { t: 2, bal: 4 }, { t: 3, bal: 10 }]), 6);
  assert.equal(Q.tiedUp([{ t: 0, bal: 10 }, { t: 2, bal: 16 }, { t: 3, bal: 10 }], [{ t: 0, bal: 10 }]), 6);
});

test('rule 8: cost today discounts each payment at (1 + c)^(−t / 12)', () => {
  const pay = [{ t: 0, amount: 100 }, { t: 12, amount: 108 }];
  near(Q.costToday(pay, 0.08, D), 200, 1e-9);
  near(Q.costToday([{ t: 6, amount: 100 }], 0.08, D), 100 / Math.sqrt(1.08), 1e-9);
  assert.equal(Q.costToday(pay, 0, D), 208);
});

test('rule 9: the implied rate makes both plans cost the same today; it ignores price and terms', () => {
  for (const [n, d] of [[12, 0.1], [24, 0.12], [36, 0.15], [36, 0.01]]) {
    const r = Q.impliedRate(n, d);
    const up = Q.schedule({ monthly: 1, months: n, upfront: n, discount: d, days: 0 });
    const mon = Q.schedule({ monthly: 1, months: n, upfront: 0, discount: d, days: 0 });
    near(Q.costToday(up, r, D), Q.costToday(mon, r, D), 1e-9);
  }
  assert.equal(Q.impliedRate(36, 0), 0);
  assert.equal(Q.impliedRate(1, 0.1), null, 'one month: a pure discount, no rate');
  assert.equal(Q.impliedRate(2, 0.5), null, 'paid upfront no more than the first month');
  const s = S({});
  for (const over of [{ terms: 0 }, { terms: 90 }, { price: 240000 }, { buffer: 0 }, { coc: 20 }]) assert.equal(S(over).rate, s.rate);
});

test('rule 9: the same discount is a higher rate the shorter the money is paid early', () => {
  near(100 * S({ years: 1 }).rate, 26.472, 0.001);
  near(100 * S({ years: 2 }).rate, 11.87, 0.01);
  near(100 * S({ years: 3 }).rate, 7.642, 0.001);
  assert.ok(S({ discount: 11 }).rate > S({ discount: 10 }).rate);
});

test('rule 10: the verdict agrees with rate against cost of capital over the param grid', () => {
  for (const years of [1, 2, 3]) {
    for (let d = 0; d <= 30; d += 2.5) {
      for (let c = 0; c <= 20; c += 2.5) {
        const s = S({ years, discount: d, coc: c });
        if (s.verdict === 0) continue;
        assert.equal(s.verdict, Math.sign(100 * s.rate - c), `K ${years}, d ${d}, c ${c}`);
      }
    }
  }
  // preset 2 turns at 7.5 %
  assert.equal(S({ coc: 7.5 }).verdict, 1);
  assert.equal(S({ coc: 8 }).verdict, -1);
});

// ── discount.js (copied; its rules as in fin-npv-discounting) ──

test('discount: the factor is 1 / (1 + r)^t; today is not discounted', () => {
  near(D.factor(0.08, 1), 1 / 1.08, 1e-12);
  near(D.factor(0.08, 0.5), 1 / Math.sqrt(1.08), 1e-12);
  for (const r of [0, 0.08, 0.3]) assert.equal(D.factor(r, 0), 1);
});

test('discount: roundMoney is half away from zero, never -0', () => {
  assert.equal(D.roundMoney(0.5), 1);
  assert.equal(D.roundMoney(-0.5), -1);
  assert.equal(D.roundMoney(-747.76), -748);
  assert.ok(Object.is(D.roundMoney(-0.4), 0));
});

test('discount.js is the fin-npv-discounting copy, unchanged apart from its header', () => {
  const fs = require('node:fs'), path = require('node:path');
  const mine = fs.readFileSync(path.join(__dirname, 'discount.js'), 'utf8').split('\n');
  const src = path.join(__dirname, '..', 'fin-npv-discounting', 'discount.js');
  if (!fs.existsSync(src)) return; // promoted or moved: nothing to compare with
  const theirs = fs.readFileSync(src, 'utf8').split('\n');
  assert.deepEqual(mine.slice(0, 1).concat(mine.slice(3)), theirs);
});

// ── the page model ──

test('presets give the numbers in SPEC.md', () => {
  const want = {
    //                 rate %   upfront  paid    cost mon  cost up  saving  low up  low t   below  verdict
    'year-upfront':    [26.472, 54000, 174000, 160231, 156321, 3910, 151000, 0.986, false, 1],
    'three-years':     [7.642, 162000, 162000, 160231, 160978, -748, 43000, 0.986, true, -1],
    'bigger-discount': [12.168, 153000, 153000, 160231, 152035, 8195, 52000, 0.986, true, 1],
    'two-years':       [14.640, 105600, 165600, 160231, 154291, 5940, 99400, 0.986, false, 1],
    'long-terms':      [26.472, 54000, 174000, 158216, 154356, 3861, 161000, 2.959, false, 1],
    'no-discount':     [0, 180000, 180000, 160231, 178865, -18634, 25000, 0.986, true, -1]
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  for (const [id, w] of Object.entries(want)) {
    const s = logic.compute(preset(id));
    const [mon, up] = s.ways;
    near(100 * s.rate, w[0], 0.001);
    assert.equal(D.roundMoney(s.upfrontAmount), w[1], `${id} upfront`);
    assert.equal(up.paidR, w[2], `${id} paid`);
    assert.equal(mon.costR, w[3], `${id} cost monthly`);
    assert.equal(up.costR, w[4], `${id} cost upfront`);
    assert.equal(s.savingR, w[5], `${id} saving`);
    assert.equal(up.lowR, w[6], `${id} low`);
    near(up.low.t, w[7], 0.001);
    assert.equal(up.below, w[8], `${id} below`);
    assert.equal(s.verdict, w[9], `${id} verdict`);
    assert.equal(mon.paidR, 180000);
    assert.deepEqual(mon.low, { t: 0, bal: 200000 }, `${id} monthly low at signing`);
    assert.equal(mon.below, false);
  }
  assert.deepEqual(logic.presets.find((x) => x.id === 'three-years').params, logic.defaults, 'preset 2 is the default');
});

test('rule 12: the verdict flip is marked, other changes are not', () => {
  const a = logic.compute(preset('year-upfront'));
  const b = logic.compute(preset('three-years'));
  const c = logic.compute(preset('two-years'));
  assert.deepEqual(logic.flipped(a, b), ['verdict']);
  assert.deepEqual(logic.flipped(a, c), []);
  assert.deepEqual(logic.flipped(null, a), []);
});

test('rule 13: captions: verdict, then at most two notes in order', () => {
  const ck = (id) => logic.captionKey(logic.compute(preset(id)));
  assert.deepEqual(ck('year-upfront'), { key: 'capTake', notes: ['nTied', 'nTerms'] });
  assert.deepEqual(ck('three-years'), { key: 'capSkip', notes: ['nBelowFloor', 'nTerms'] });
  assert.deepEqual(ck('bigger-discount'), { key: 'capTake', notes: ['nBelowFloor', 'nTerms'] });
  assert.deepEqual(ck('no-discount'), { key: 'capNoDiscount', notes: ['nBelowFloor', 'nTerms'] });
  assert.equal(logic.captionKey(S({ discount: 0, coc: 0 })).key, 'capEven', 'no discount and free money: even');
  assert.equal(logic.captionKey(S({ discount: 0.5 })).key, 'capSkip', 'a small discount is not "no discount"');
  assert.deepEqual(logic.captionKey(S({ years: 1, terms: 0 })), { key: 'capTake', notes: ['nTied'] });
});

test('normalise: clamps, snaps and repairs what a URL may carry', () => {
  const p = logic.normalise({ discount: 99, years: 7, terms: 45, coc: -3, buffer: 'x', floor: 123456, price: 1 });
  assert.equal(p.discount, 30);
  assert.equal(p.years, 3);
  assert.equal(p.terms, 30, 'not one of the terms: the default');
  assert.equal(p.coc, 0);
  assert.equal(p.buffer, 200000);
  assert.equal(p.floor, 120000);
  assert.equal(p.price, 12000);
  assert.equal(logic.normalise({ discount: 7.3 }).discount, 7.5);
  assert.equal(logic.normalise({ years: 1.6 }).years, 2);
  assert.equal(logic.normalise({ years: 0 }).years, 1);
  assert.equal(logic.normalise({ terms: '90' }).terms, 90, 'from a URL, a string');
  assert.equal(logic.normalise({ terms: '' }).terms, 30);
  assert.equal(logic.normalise({ terms: ' ' }).terms, 30, 'whitespace is not 0');
  assert.equal(logic.normalise({ coc: ' ' }).coc, 8);
  const hi = logic.normalise({ price: 1e9, coc: 99, buffer: 1e9, floor: 1e9, discount: -5 });
  assert.deepEqual([hi.price, hi.coc, hi.buffer, hi.floor, hi.discount], [600000, 20, 500000, 300000, 0]);
  assert.equal(logic.normalise({ discount: null }).discount, 10);
  assert.equal(logic.normalise({ discount: true }).discount, 10);
  assert.ok(Object.is(logic.normalise({ coc: -0 }).coc, 0));
  assert.equal(logic.normalise({ price: 60500 }).price, 60000, 'a multiple of 1 200: whole euros a month');
});

test('the price scales every amount, not the rate or the verdict', () => {
  const a = S({}), b = S({ price: 120000 });
  assert.equal(b.rate, a.rate);
  assert.equal(b.verdict, a.verdict);
  near(b.ways[1].paid, 2 * a.ways[1].paid, 1e-6);
  near(b.saving, 2 * a.saving, 1e-6);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('two-years'));
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

/** Preset id → string key: year-upfront → pYearUpfront. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
