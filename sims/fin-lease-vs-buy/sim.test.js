// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-lease-vs-buy. Run: node --test sims/fin-lease-vs-buy/sim.test.js
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the copied discount.js block (from
// sims/fin-npv-discounting/sim.test.js @ b341da3, kept with the copy, COMMON.md §6), then the ledger (financing.js,
// promotable), then the page model and its presets, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const D = require('./discount.js');
const F = require('./financing.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const run = (over) => logic.compute(P(over));
const way = (s, id) => s.ways.find((w) => w.id === id);
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);
const R = (x) => D.roundMoney(x);

// ── tie-breaks ──

test('rule 9: NPVs tie at the euro: a loan at the cost of capital ties with cash despite floating-point noise', () => {
  const s = logic.compute(preset('loan-at-coc'));
  assert.notEqual(way(s, 'loan').npv, way(s, 'cash').npv, 'the raw floats differ in the last bits');
  assert.equal(way(s, 'loan').npvR, way(s, 'cash').npvR);
  assert.deepEqual(s.picks.value, ['cash', 'loan'], 'both tied ways are picked, in order');
});

test('rule 9: every tied way is picked; least cash for nominal, highest NPV for value', () => {
  // 0 % everywhere: cash and a 0 % loan both pay 60 000; rentals 3.75 % × 24 = 90 % = price − residual
  const s = run({ term: 2, residual: 10, lease: 3.75, loanRate: 0, coc: 0 });
  assert.deepEqual(s.ways.map((w) => w.paidR), [60000, 60000, 54000]);
  assert.deepEqual(s.picks.nominal, ['lease'], 'least cash paid');
  assert.deepEqual(s.ways.map((w) => w.npvR), [-54000, -54000, -54000]);
  assert.deepEqual(s.picks.value, ['cash', 'loan', 'lease'], 'a three-way tie');
  assert.deepEqual(run({ loanRate: 0 }).picks.nominal, ['cash', 'loan']);
});

test('rule 9: best() compares the rounded fields, half a euro apart is not a tie', () => {
  const w = (a, b, c) => [{ id: 'cash', v: R(a) }, { id: 'loan', v: R(b) }, { id: 'lease', v: R(c) }];
  assert.deepEqual(logic.best(w(-100.4, -99.6, -200), 'v', false), ['cash', 'loan'], 'both shown as −100 €');
  assert.deepEqual(logic.best(w(-100.5, -100.4, -200), 'v', false), ['loan'], '−100.5 rounds to −101');
  assert.deepEqual(logic.best(w(500, 400, 400), 'v', true), ['loan', 'lease']);
  assert.deepEqual(logic.best(w(1, 1, 1), 'v', true), ['cash', 'loan', 'lease']);
});

test('rule 3: a 0 % loan repays price / n a month (no division by zero)', () => {
  near(F.annuity(60000, 0, 36), 60000 / 36);
  const s = run({ loanRate: 0 });
  near(s.instalment, 1666.6666666666667);
  assert.equal(R(way(s, 'loan').interest), 0);
  assert.equal(way(s, 'loan').paidR, 60000);
  assert.equal(F.monthlyRate(0), 0);
});

test('rule 6: a 0 % borrowing rate puts the plain sum of the rentals on the balance sheet', () => {
  near(F.presentRentals(1740, 0, 36), 62640);
  assert.equal(R(run({ loanRate: 0 }).rightOfUse), 62640);
});

test('rule 1: the value line never goes below 0', () => {
  assert.equal(F.valueAt(60000, 12000, 36, 48), 0, 'extrapolated 12 000 − 16 000 is clamped');
  assert.equal(F.valueAt(60000, 0, 36, 40), 0);
  near(F.valueAt(60000, 12000, 36, 18), 36000);
  assert.equal(F.valueAt(60000, 12000, 36, 0), 60000);
  near(F.valueAt(60000, 12000, 36, 36), 12000);
});

test('normalise: year is clamped to the horizon after the end of the term is known', () => {
  assert.equal(logic.normalise({ year: 4, end: 'extend' }).year, 4);
  assert.equal(logic.normalise({ year: 4, end: 'return' }).year, 3, 'leaving extend pulls the cursor back');
  assert.equal(logic.normalise({ year: 4, end: 'nonsense' }).year, 3, 'an unknown end is "return"');
  assert.equal(logic.normalise({ year: -2 }).year, 0);
  assert.equal(logic.horizon({ term: 5, end: 'extend' }), 6);
  assert.equal(logic.horizon({ term: 5, end: 'buyout' }), 5);
  assert.equal(logic.normalise({ term: 9, year: 9 }).year, 5, 'clamped to the clamped term');
  assert.equal(logic.normalise({ year: 'x' }).year, 1, 'junk takes the default');
  assert.equal(logic.normalise({ year: 1.6 }).year, 2, 'rounded, not floored');
  assert.equal(logic.normalise({ end: 'zzz' }).end, 'return');
});

// ── discount.js (copied; its rules 1-4 as in fin-npv-discounting) ──

test('discount: the factor is 1 / (1 + r)^t; today is not discounted', () => {
  near(D.factor(0.08, 1), 1 / 1.08, 1e-12);
  near(D.factor(0.08, 5), 0.6805831970337531, 1e-12);
  near(D.factor(0.08, 0.5), 1 / Math.sqrt(1.08), 1e-12);
  for (const r of [0, 0.08, 0.3]) assert.equal(D.factor(r, 0), 1);
});

test('discount: NPV sums the discounted flows; at 0 % it is the nominal sum', () => {
  near(D.npv([-120000, 35000, 35000, 35000, 35000, 35000], 0.08), 19744.85129773297);
  assert.equal(D.npv([-120000, 35000, 35000, 35000, 35000, 35000], 0), 55000);
});

test('discount: roundMoney is half away from zero, never -0', () => {
  assert.equal(D.roundMoney(0.5), 1);
  assert.equal(D.roundMoney(-0.5), -1);
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

// ── the ledger (financing.js) ──

test('ledger identity: cash paid = expense + asset − liability, every month, every way and setting', () => {
  const combos = [];
  for (const end of logic.ENDS) for (const books of logic.BOOKS) for (const loanRate of [0, 6]) combos.push({ end, books, loanRate });
  for (const c of combos) {
    const p = logic.normalise(P(c));
    const n = 12 * p.term, M = 12 * logic.horizon(p);
    const price = p.price, residual = price * p.residual / 100, j = F.monthlyRate(p.loanRate / 100);
    const nL = n + (p.end === 'extend' ? 12 : 0);
    const ledgers = [
      F.buyCash({ price, residual, n, months: M }),
      F.buyLoan({ price, residual, n, months: M, j }),
      F.lease({ rental: price * p.lease / 100, nL, months: M, k: j, books: p.books, residual, buyoutAt: p.end === 'buyout' ? n : null })
    ];
    for (const r of ledgers) {
      for (let m = 0; m <= M; m++) {
        const x = F.totals(r, m);
        near(x.cash, x.expense + x.asset - x.liability, 1e-5);
      }
    }
  }
});

test('rule 2: cash pays the price on day one and depreciates along the value line', () => {
  const r = F.buyCash({ price: 60000, residual: 12000, n: 36, months: 36 });
  assert.equal(r[0].cash, 60000);
  assert.equal(r[0].capex, 60000);
  near(r[1].dep, 16000 / 12);
  assert.equal(r.slice(1).reduce((a, x) => a + x.cash, 0), 0, 'no cash after day one');
  const end = F.totals(r, 36);
  near(end.asset, 12000);
  near(end.expense, 48000);
  near(F.totals(r, 12).asset, 44000);
});

test('rule 3: the loan borrows the price on day one and repays it in level instalments', () => {
  const j = F.monthlyRate(0.06);
  near(Math.pow(1 + j, 12), 1.06, 1e-12);
  const r = F.buyLoan({ price: 60000, residual: 12000, n: 36, months: 36, j });
  assert.equal(r[0].cash, 0);
  assert.equal(r[0].debt, 60000);
  const a = F.annuity(60000, j, 36);
  assert.equal(R(a), 1821);
  for (let m = 1; m <= 36; m++) near(r[m].cash, a, 1e-9);
  near(r[1].interest, 60000 * j);
  assert.ok(r[36].interest < r[1].interest, 'interest falls as the balance is repaid');
  near(F.totals(r, 36).liability, 0, 1e-5);
  assert.equal(R(F.totals(r, 12).liability), 41153);
  // after the loan (extend: months 37…48) no more cash or interest
  const x = F.buyLoan({ price: 60000, residual: 12000, n: 36, months: 48, j });
  assert.equal(x[40].cash, 0);
  assert.equal(x[40].interest, 0);
});

test('rules 4-5: as rent, every rental is an expense in its month; nothing on the balance sheet', () => {
  const r = F.lease({ rental: 1740, nL: 36, months: 36, k: 0.004, books: 'rent', residual: 12000, buyoutAt: null });
  assert.equal(r[0].cash, 0);
  for (let m = 1; m <= 36; m++) { assert.equal(r[m].cash, 1740); assert.equal(r[m].rent, 1740); }
  const x = F.totals(r, 12);
  assert.equal(x.asset, 0);
  assert.equal(x.liability, 0);
  assert.equal(x.expense, 20880);
});

test('rule 6: on the balance sheet, L0 = rentals discounted at the borrowing rate; expense front-loaded, same total', () => {
  const k = F.monthlyRate(0.06);
  const r = F.lease({ rental: 1740, nL: 36, months: 36, k, books: 'rou', residual: 12000, buyoutAt: null });
  assert.equal(R(r[0].capex), 57331);
  assert.equal(r[0].debt, r[0].capex);
  const y = F.yearly(r, 3).map((e) => R(e.total));
  assert.deepEqual(y, [21982, 20902, 19756]);
  assert.ok(y[0] > 20880 && y[2] < 20880, 'more than the rent at first, less at the end');
  near(F.totals(r, 36).expense, 62640, 1e-5);
  near(F.totals(r, 36).liability, 0, 1e-5);
  near(F.totals(r, 36).asset, 0, 1e-5);
  near(r[1].dep, r[0].capex / 36);
});

test('rule 4: extend adds 12 rentals at the same rate; the extension is in the lease term from the start', () => {
  const s = run({ end: 'extend' });
  assert.equal(s.nL, 48);
  assert.equal(s.H, 4);
  assert.equal(way(s, 'lease').paidR, 83520);
  assert.equal(R(s.rightOfUse), 74320);
  assert.equal(way(s, 'lease').yearly.length, 4);
});

test('rule 7: buying out pays the residual at the end of the term and owns the server', () => {
  const s = run({ end: 'buyout', year: 3 });
  const l = way(s, 'lease');
  assert.equal(l.paidR, 74640);
  assert.equal(R(l.owns), 12000);
  assert.equal(R(l.asset), 12000);
  assert.equal(R(l.liability), 0);
  const ret = way(run({ end: 'return', year: 3 }), 'lease');
  assert.equal(ret.owns, 0);
  assert.equal(R(ret.asset), 0);
  // as rent, the bought-out server is the only thing on the balance sheet
  assert.equal(R(way(run({ end: 'buyout', books: 'rent', year: 3 }), 'lease').asset), 12000);
  assert.equal(R(way(run({ end: 'buyout', books: 'rent', year: 2 }), 'lease').asset), 0);
});

// ── NPV and the picks ──

test('rule 8: NPV discounts each payment at m/12 years and adds the value still owned', () => {
  const s = run({});
  assert.equal(way(s, 'cash').npvR, -50474);
  near(way(s, 'cash').npv, -60000 + 12000 / Math.pow(1.08, 3));
  assert.equal(way(s, 'loan').npvR, -48825);
  assert.equal(way(s, 'lease').npvR, -55755);
  // a lease that returns the server owns nothing: its NPV is the rentals alone
  let pv = 0;
  for (let m = 1; m <= 36; m++) pv += 1740 / Math.pow(1.08, m / 12);
  near(way(s, 'lease').npv, -pv);
});

test('rule 8: a loan at the cost of capital has the same NPV as cash (it moves cash, not value)', () => {
  for (const r of [0, 3, 8, 14.5]) {
    const s = run({ loanRate: r, coc: r });
    near(way(s, 'loan').npv, way(s, 'cash').npv, 1e-6);
  }
  const s = run({ loanRate: 6, coc: 8 });
  assert.ok(way(s, 'loan').npv > way(s, 'cash').npv, 'cheaper than money: better');
  const d = run({ loanRate: 10, coc: 8 });
  assert.ok(way(d, 'loan').npv < way(d, 'cash').npv, 'dearer than money: worse');
});

test('rule 8: buying out at the residual has the same NPV as returning', () => {
  for (const coc of [0, 8, 20]) {
    near(way(run({ end: 'buyout', coc }), 'lease').npv, way(run({ end: 'return', coc }), 'lease').npv, 1e-6);
  }
});

test('rule 8: with an extension every way is compared over the longer horizon', () => {
  const s = run({ end: 'extend', year: 4 });
  assert.equal(R(s.endValue), 0, 'the value line is at 0 by year 4');
  assert.deepEqual(s.ways.map((w) => w.npvR), [-60000, -58351, -71658]);
  assert.deepEqual(way(s, 'cash').yearly.map((e) => R(e.total)), [16000, 16000, 16000, 12000]);
  // with a residual of 50 % the server is still worth 20 000 € after four years, discounted over four years
  const h = run({ end: 'extend', residual: 50 });
  assert.equal(R(h.endValue), 20000);
  near(way(h, 'cash').npv, -60000 + 20000 / Math.pow(1.08, 4));
  assert.deepEqual(h.ways.map((w) => w.npvR), [-45299, -43650, -71658]);
});

test('rule 8: NPV at 0 % is the nominal difference: value owned minus cash paid', () => {
  const s = run({ coc: 0 });
  for (const w of s.ways) near(w.npv, w.owns - w.paid, 1e-6);
});

test('rule 10: flipped lists the picks that changed', () => {
  const a = logic.compute(preset('three-ways')), b = logic.compute(preset('dear-money'));
  assert.deepEqual(logic.flipped(a, b), ['value']);
  assert.deepEqual(logic.flipped(a, a), []);
  assert.deepEqual(logic.flipped(null, a), []);
  const c = logic.compute(preset('loan-at-coc'));
  assert.deepEqual(logic.flipped(a, c), ['value'], 'a tie is a change of pick');
  const cheap = run({ lease: 2, loanRate: 10 });
  assert.deepEqual(logic.flipped(a, cheap), ['nominal', 'value']);
});

test('rule 12: caption keys and notes, by priority, at most two', () => {
  const k = (over) => logic.captionKey(run(over));
  assert.deepEqual(k({}), { key: 'capDiffer', notes: ['nLoanCheap', 'nRou'] });
  assert.deepEqual(k({ loanRate: 8 }).notes, ['nLoanCoc', 'nRou']);
  assert.deepEqual(k({ loanRate: 10 }).notes, ['nRou'], 'a dearer loan has no note');
  assert.deepEqual(k({ loanRate: 10, year: 0 }).notes, ['nRouDay']);
  assert.deepEqual(k({ end: 'buyout' }).notes, ['nBuyout', 'nLoanCheap']);
  assert.deepEqual(k({ end: 'extend' }).notes, ['nExtend', 'nLoanCheap']);
  assert.deepEqual(k({ books: 'rent', loanRate: 10 }).notes, ['nRent']);
  assert.deepEqual(k({ books: 'rent' }).notes, ['nLoanCheap', 'nRent']);
  assert.deepEqual(k({ loanRate: 0, coc: 0 }).notes, ['nLoanCoc'], 'at 0 % the lease expense equals the rentals: no books note');
  assert.equal(k({ loanRate: 8 }).key, 'capDiffer', 'nominal [cash] against value [cash, loan] is not the same pick');
  // the picks agree: capSame
  const same = run({ lease: 2, loanRate: 10 });
  assert.deepEqual(same.picks, { nominal: ['lease'], value: ['lease'] });
  assert.equal(logic.captionKey(same).key, 'capSame');
});

// ── presets (SPEC.md table) ──

test('presets: the numbers of the SPEC table', () => {
  const rows = {
    'three-ways': { paid: [60000, 65556, 62640], owns: [12000, 12000, 0], npv: [-50474, -48825, -55755], picks: [['cash'], ['loan']] },
    'loan-at-coc': { paid: [60000, 67409, 62640], owns: [12000, 12000, 0], npv: [-50474, -50474, -55755], picks: [['cash'], ['cash', 'loan']] },
    'dear-money': { paid: [60000, 72961, 62640], owns: [12000, 12000, 0], npv: [-51900, -51900, -51513], picks: [['cash'], ['lease']] },
    'buy-out': { paid: [60000, 65556, 74640], owns: [12000, 12000, 12000], npv: [-50474, -48825, -55755], picks: [['cash'], ['loan']] },
    'extend': { paid: [60000, 65556, 83520], owns: [0, 0, 0], npv: [-60000, -58351, -71658], picks: [['cash'], ['loan']] },
    'as-rent': { paid: [60000, 65556, 62640], owns: [12000, 12000, 0], npv: [-50474, -48825, -55755], picks: [['cash'], ['loan']] }
  };
  for (const [id, x] of Object.entries(rows)) {
    const s = logic.compute(preset(id));
    assert.deepEqual(s.ways.map((w) => w.paidR), x.paid, id + ' paid');
    assert.deepEqual(s.ways.map((w) => R(w.owns)), x.owns, id + ' owns');
    assert.deepEqual(s.ways.map((w) => w.npvR), x.npv, id + ' npv');
    assert.deepEqual([s.picks.nominal, s.picks.value], x.picks, id + ' picks');
  }
  assert.equal(R(logic.compute(preset('loan-at-coc')).instalment), 1872);
  assert.equal(R(logic.compute(preset('dear-money')).instalment), 2027);
});

test('the caption\'s numbers: loan interest over the term, the lease year, the right-of-use on day one', () => {
  const s = run({});
  assert.equal(R(way(s, 'loan').interest), 5556, 'interest over the whole loan, not to the balance-sheet date');
  assert.equal(R(run({ year: 2 }).leaseYear.total), 20902);
  assert.equal(run({ year: 2 }).leaseYearN, 2);
  assert.equal(R(run({ year: 0 }).leaseYear.total), 21982, 'day one reads year 1');
  assert.equal(R(s.rightOfUse), 57331);
  assert.equal(run({ books: 'rent' }).rightOfUse, 0);
});

test('presets: yearly expense and the balance sheet (SPEC.md)', () => {
  const y = (s, id) => way(s, id).yearly.map((e) => R(e.total));
  const sheet = (s) => s.ways.map((w) => [R(w.asset), R(w.liability)]);
  const a = logic.compute(preset('three-ways'));
  assert.deepEqual(y(a, 'cash'), [16000, 16000, 16000]);
  assert.deepEqual(y(a, 'loan'), [19005, 17875, 16676]);
  assert.deepEqual(y(a, 'lease'), [21982, 20902, 19756]);
  assert.deepEqual(a.ways.map((w) => R(w.expense)), [48000, 53556, 62640]);
  assert.deepEqual(sheet(a), [[44000, 0], [44000, 41153], [38221, 39323]]);
  const r = logic.compute(preset('as-rent'));
  assert.deepEqual(y(r, 'lease'), [20880, 20880, 20880]);
  assert.deepEqual(sheet(r)[2], [0, 0]);
  assert.deepEqual(sheet(run({ year: 0 })), [[60000, 0], [60000, 60000], [57331, 57331]]);
  assert.deepEqual(sheet(logic.compute(preset('buy-out'))), [[12000, 0], [12000, 0], [12000, 0]]);
  assert.deepEqual(y(logic.compute(preset('extend')), 'lease'), [22471, 21452, 20371, 19226]);
  const z = run({ residual: 0 });
  assert.equal(way(z, 'cash').npvR, -60000);
  assert.deepEqual(y(z, 'cash'), [20000, 20000, 20000]);
});

test('normalise: numbers clamped and snapped, junk takes the default, choices checked', () => {
  const n = logic.normalise({ price: 999999, term: 9, lease: 2.93, residual: 17, loanRate: -3, coc: 'x', end: 'buyout', books: 'zzz' });
  assert.deepEqual(n, { price: 150000, term: 5, lease: 2.95, residual: 15, loanRate: 0, coc: 8, end: 'buyout', books: 'rou', year: 1 });
  assert.equal(logic.normalise({ lease: 2.9 }).lease, 2.9, 'no floating-point tail');
  assert.equal(logic.normalise({ price: '' }).price, 60000, 'an empty value is not 0');
  assert.equal(logic.normalise({ coc: null }).coc, 8);
  assert.equal(logic.normalise({ term: true }).term, 3);
  assert.deepEqual(logic.normalise({}), logic.normalise(logic.defaults));
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('extend'));
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

/** Preset id → string key: three-ways → pThreeWays. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
