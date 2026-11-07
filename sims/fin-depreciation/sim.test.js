// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-depreciation. Run: node --test sims/fin-depreciation/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the asset model's rules (asset.js, promotable with
// them), then the ledger tests copied with ledger.js from fin-capex-opex, then the page model, then the template's
// generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const As = require('./asset.js');
const Lg = require('./ledger.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);
const deps = (sched) => sched.map((x) => x.dep);

// ── tie-breaks ──

test('rule 3 tie-break: declining charge equal to the even spread is not a switch', () => {
  // 24 000 over 4 years, no residual: year 3 opens at 6 000, 50 % = 3 000 = 6 000 / 2 years left
  const s = As.schedule(24000, 4, 0, 'db');
  assert.equal(s[2].dep, 3000);
  assert.equal(s[2].switched, false);
  assert.equal(s[3].switched, true);   // year 4: 1 500 declining < 3 000 even
  assert.equal(S(preset('licence')).db.switchYear, 4);
});

test('rule 3 tie-break: ties are compared tidied, so float noise is not a switch (12 000 over 6, no residual)', () => {
  const s = As.schedule(12000, 6, 0, 'db');
  assert.equal(s[3].switched, false);   // year 4: 1 185.19 declining = 1 185.19 even
  assert.equal(s[4].switched, true);
  assert.equal(S({ cost: 12000, life: 6, residual: 0 }).db.switchYear, 5);
});

test('rule 3: capped only when the floor really cuts the charge', () => {
  assert.equal(As.schedule(24000, 4, 0, 'db')[3].capped, false);   // even spread = the rest exactly: not cut
  assert.equal(As.schedule(30000, 2, 3000, 'db')[1].capped, true);  // year 2: 100 % of 3 000 cut to 0 by the floor
  assert.equal(As.schedule(30000, 2, 3000, 'db')[0].capped, true);
});

test('rule 3: the switch happens only when the even spread is strictly larger', () => {
  // 30 000 over 5, no residual: year 4 opens at 6 480, 40 % = 2 592 < 3 240 → switched
  const s = As.schedule(30000, 5, 0, 'db');
  assert.deepEqual(s.map((x) => x.switched), [false, false, false, true, true]);
  assert.equal(S({ residual: 0 }).db.switchYear, 4);
  // with the residual 3 000 the declining charge stays larger until the cap
  assert.equal(S({}).db.switchYear, null);
});

test('rule 4 tie-break: proceeds equal to the book value are neither a gain nor a loss', () => {
  const sched = As.schedule(30000, 5, 3000, 'sl');
  assert.deepEqual(As.disposal(sched, 30000, 3, 13800), { year: 3, book: 13800, proceeds: 13800, gain: 0, outcome: 'none' });
  assert.equal(As.disposal(sched, 30000, 3, 13799).outcome, 'loss');
  assert.equal(As.disposal(sched, 30000, 3, 13801).outcome, 'gain');
  const s = S({ sell: 3, proceeds: 13500 });
  assert.equal(s.sl.sale.outcome, 'loss');
  assert.equal(S(preset('server')).sl.sale.outcome, 'none');
  assert.equal(S(preset('server')).db.sale.outcome, 'none');
});

test('rule 6: rounding is half away from zero and never -0', () => {
  assert.equal(As.roundMoney(62.5), 63);
  assert.equal(As.roundMoney(-62.5), -63);
  assert.equal(As.roundMoney(62.49), 62);
  assert.ok(Object.is(As.roundMoney(-0.4), 0));
  assert.ok(Object.is(As.roundMoney(-0), 0));
  assert.ok(Object.is(As.tidy(-1e-9), 0));
});

test('rule 6: shown years are differences of rounded cumulative sums, so they add up', () => {
  // 10 000 over 7 years straight-line: 1 428.57… a year
  const sh = As.shown(As.schedule(10000, 7, 0, 'sl'), 10000, 7, 0);
  assert.deepEqual(sh.dep.slice(1), [1429, 1428, 1429, 1428, 1429, 1428, 1429]);
  assert.equal(sh.dep.reduce((a, x) => a + x, 0), 10000);
  const db = As.shown(As.schedule(10000, 7, 0, 'db'), 10000, 7, 0);
  assert.deepEqual(db.dep.slice(1), [2857, 2041, 1458, 1041, 868, 867, 868]);
  // 25 000 over 3, residual 2 500, sold after 2 for 5 000
  const odd = As.shown(As.schedule(25000, 3, 2500, 'db'), 25000, 2, 5000);
  assert.deepEqual(odd.dep.slice(1), [16667, 5555, 278]);
  assert.deepEqual([odd.sale.book, odd.sale.gain, odd.sale.total], [2778, 2222, 20000]);
});

test('rule 6: on the screen cost = depreciation so far + book value, and total = cost − proceeds, every case', () => {
  for (const cost of [1000, 7500, 25000, 33500, 60000]) {
    for (let life = logic.LIFE_MIN; life <= logic.LIFE_MAX; life++) {
      for (const residual of [0, 500, logic.residualMax(cost)]) {
        for (let sell = 1; sell <= life; sell++) {
          const s = S({ cost, life, residual, sell, proceeds: 500 });
          for (const m of logic.METHODS) {
            const d = s[m];
            for (let k = 0; k <= life; k++) assert.equal(d.book[k], cost - d.dep.slice(0, k + 1).reduce((a, x) => a + x, 0));
            assert.equal(d.sale.depSoFar + d.sale.book, cost);
            assert.equal(d.sale.total, cost - 500);
            assert.ok(d.dep.every((x) => Number.isInteger(x) && x >= 0), `${cost} ${life} ${residual} ${m}`);
          }
        }
      }
    }
  }
});

// ── asset.js ──

test('rule 2: straight-line: the same amount every year, down to the residual exactly', () => {
  const s = As.schedule(30000, 5, 3000, 'sl');
  assert.deepEqual(deps(s), [5400, 5400, 5400, 5400, 5400]);
  assert.deepEqual(s.map((x) => x.close), [24600, 19200, 13800, 8400, 3000]);
  assert.equal(s[0].open, 30000);
  assert.ok(s.every((x) => !x.switched && !x.capped));
  // a cost that does not divide evenly still lands on the residual
  const odd = As.schedule(10000, 7, 0, 'sl');
  assert.equal(odd[6].close, 0);
  near(odd[0].dep, 10000 / 7, 1e-6);
});

test('rule 3: declining balance at 2 ÷ life on the opening book value', () => {
  assert.equal(As.rate(5), 0.4);
  assert.equal(As.rate(4, 2), 0.5);
  assert.equal(As.rate(4, 1.5), 0.375);
  const s = As.schedule(30000, 5, 3000, 'db');
  assert.deepEqual(deps(s), [12000, 7200, 4320, 2592, 888]);
  assert.deepEqual(s.map((x) => x.open), [30000, 18000, 10800, 6480, 3888]);
});

test('rule 3: the residual is a floor: the charge is capped so the book value never goes below it', () => {
  const s = As.schedule(30000, 5, 3000, 'db');
  assert.deepEqual(s.map((x) => x.capped), [false, false, false, false, true]);
  assert.equal(s[4].close, 3000);
  // life 2: rate 100 %, capped in year 1, nothing left for year 2
  const two = As.schedule(30000, 2, 3000, 'db');
  assert.deepEqual(deps(two), [27000, 0]);
  assert.equal(two[0].capped, true);
  for (const life of [2, 3, 5, 8]) {
    for (const res of [0, 1000, 15000]) {
      const x = As.schedule(30000, life, res, 'db');
      assert.ok(x.every((y) => y.close >= res - 1e-9), `life ${life} res ${res}`);
      near(x[life - 1].close, res, 1e-6);
    }
  }
});

test('rule 3: with no residual the switch spreads the rest evenly, ending at 0', () => {
  assert.deepEqual(deps(As.schedule(30000, 5, 0, 'db')), [12000, 7200, 4320, 3240, 3240]);
  assert.deepEqual(deps(As.schedule(24000, 4, 0, 'db')), [12000, 6000, 3000, 3000]);
});

test('rule 4: disposal at the end of year n: gain = proceeds − book value; nothing back writes it all off', () => {
  const sl = As.schedule(30000, 5, 3000, 'sl'), db = As.schedule(30000, 5, 3000, 'db');
  assert.deepEqual(As.disposal(sl, 30000, 3, 10000), { year: 3, book: 13800, proceeds: 10000, gain: -3800, outcome: 'loss' });
  assert.deepEqual(As.disposal(db, 30000, 3, 10000), { year: 3, book: 6480, proceeds: 10000, gain: 3520, outcome: 'gain' });
  assert.equal(As.disposal(db, 30000, 3, 0).gain, -6480);
  assert.equal(As.bookAt(sl, 30000, 0), 30000);
  assert.equal(As.bookAt(sl, 30000, 99), 3000);
});

test('rule 4: no depreciation after the sale: the sold year is the last one counted', () => {
  const s = S({ sell: 2, proceeds: 0 });
  assert.equal(s.sl.sale.depSoFar, 10800);
  assert.equal(s.db.sale.depSoFar, 19200);
  assert.equal(s.sl.sale.book, s.sl.book[2]);
});

test('rule 5: the same total either way: cost − proceeds, also from the ledger rows', () => {
  for (const over of [{}, preset('sold-early'), preset('scrapped'), preset('licence'), { cost: 25000, life: 3, residual: 2500, sell: 2, proceeds: 5000 }]) {
    const s = S(over);
    for (const m of logic.METHODS) {
      assert.equal(s[m].sale.total, s.p.cost - s.p.proceeds, `${JSON.stringify(over)} ${m}`);
      assert.deepEqual(s[m].ledger, { cash: s.p.cost - s.p.proceeds, expense: s.p.cost - s.p.proceeds, book: 0 });
    }
  }
});

test('rule 5: ledger rows: purchase, depreciation, then the sale in row n', () => {
  const sched = As.schedule(30000, 5, 3000, 'db');
  const sale = As.disposal(sched, 30000, 3, 10000);
  const r = logic.ledgerRows(sched, 30000, sale);
  assert.equal(r.length, 4);
  assert.deepEqual(r[0], { cash: 30000, capex: 30000, dep: 0, opex: 0 });
  assert.deepEqual(r[1], { cash: 0, capex: 0, dep: 12000, opex: 0 });
  assert.deepEqual(r[3], { cash: -10000, capex: -6480, dep: 4320, opex: -3520 });
  assert.deepEqual(Lg.totals(r, 2), { cash: 30000, expense: 19200, book: 10800, ebitda: 0, ebit: -19200 });
  const end = Lg.totals(r, 3);
  assert.deepEqual([end.cash, end.expense, end.book], [20000, 20000, 0]);
});

test('rule 7: a licence has the same numbers as equipment', () => {
  for (const p of [preset('licence'), preset('sold-early'), preset('scrapped')]) {
    const a = S(Object.assign({}, p, { kind: 'licence' })), b = S(Object.assign({}, p, { kind: 'equipment' }));
    assert.deepEqual(a.sl, b.sl);
    assert.deepEqual(a.db, b.db);
  }
  assert.equal(preset('licence').residual, 0);
});

// ── ledger.js (copied from fin-capex-opex with its tests) ──

test('ledger (copied): the identity cash = expense + book value holds on the exact totals', () => {
  for (const r of [Lg.purchase(30000, 60, true), Lg.purchase(3000, 60, false), Lg.service(30000, 60)]) {
    for (let m = 0; m <= 60; m++) {
      const x = Lg.totals(r, m);
      near(x.cash, x.expense + x.book, 1e-6);
    }
  }
});

test('ledger (copied): capitalised purchase straight-line, expensed purchase, service', () => {
  const r = Lg.purchase(30000, 60, true);
  assert.deepEqual(r[0], { cash: 30000, capex: 30000, dep: 0, opex: 0 });
  assert.deepEqual(Lg.totals(r, 12), { cash: 30000, expense: 6000, book: 24000, ebitda: 0, ebit: -6000 });
  assert.deepEqual(Lg.totals(Lg.purchase(3000, 60, false), 30), { cash: 3000, expense: 3000, book: 0, ebitda: -3000, ebit: -3000 });
  assert.deepEqual(Lg.totals(Lg.service(30000, 60), 12), { cash: 6000, expense: 6000, book: 0, ebitda: -6000, ebit: -6000 });
  assert.equal(Lg.isCapitalised(5000, 5000), true);
  assert.equal(Lg.isCapitalised(4999, 5000), false);
});

test('ledger (copied): sums clamp and tidy; shown keeps cash = expense + book on the screen', () => {
  const r = Lg.service(1200, 12);
  assert.deepEqual(Lg.totals(r, 99), Lg.totals(r, 12));
  assert.deepEqual(Lg.totals(r, -3), Lg.totals(r, 0));
  assert.equal(Lg.series(r).length, 13);
  assert.equal(Lg.sums(Lg.purchase(1, 3, true), 3).dep, 1);
  const a = Lg.shown(Lg.purchase(500, 48, true), 6);
  assert.deepEqual([a.cash, a.expense, a.book], [500, 63, 437]);
  assert.equal(Lg.roundMoney(-62.5), -63);
});

// ── the page model ──

test('presets: the SPEC table', () => {
  const row = (id) => {
    const s = S(preset(id));
    return logic.METHODS.map((m) => [s[m].dep.slice(1), s[m].sale.book, s[m].sale.gain, s[m].sale.total]);
  };
  assert.deepEqual(row('server'), [
    [[5400, 5400, 5400, 5400, 5400], 3000, 0, 27000],
    [[12000, 7200, 4320, 2592, 888], 3000, 0, 27000]]);
  assert.deepEqual(row('sold-early').map((x) => x.slice(1)), [[13800, -3800, 20000], [6480, 3520, 20000]]);
  assert.deepEqual(row('scrapped').map((x) => x.slice(1)), [[13800, -13800, 30000], [6480, -6480, 30000]]);
  assert.deepEqual(row('licence'), [
    [[6000, 6000, 6000, 6000], 12000, -12000, 24000],
    [[12000, 6000, 3000, 3000], 6000, -6000, 24000]]);
  // kept to the end instead: both reach 0, nothing to write off
  const end = S(Object.assign({}, preset('licence'), { sell: 4 }));
  assert.deepEqual(logic.METHODS.map((m) => [end[m].sale.book, end[m].sale.gain, end[m].sale.total]), [[0, 0, 24000], [0, 0, 24000]]);
  assert.equal(S(preset('licence')).p.kind, 'licence');
  assert.equal(S(preset('server')).p.kind, 'equipment');
});

test('presets: the defaults are the first preset', () => {
  assert.deepEqual(logic.defaults, logic.presets[0].params);
});

test('rule 8: changed marks: the methods whose outcome flipped', () => {
  const a = S(preset('server')), b = S(preset('sold-early')), c = S(preset('scrapped'));
  assert.deepEqual(logic.flipped(a, b), ['sl', 'db']);           // none → loss, none → gain
  assert.deepEqual(logic.flipped(b, c), ['db']);                 // db gain → loss; sl stays a loss
  assert.deepEqual(logic.flipped(c, S(Object.assign({}, preset('scrapped'), { proceeds: 500 }))), []);
  assert.deepEqual(logic.flipped(null, a), []);
});

test('captions: lead, outcomes and the note by priority', () => {
  const k = (over) => logic.captionKey(S(over));
  assert.deepEqual(k(preset('server')), { lead: 'endSold', out: ['bothNone'], note: 'nYear1' });
  assert.deepEqual(k(preset('sold-early')), { lead: 'earlySold', out: ['slLoss', 'dbGain'], note: 'nFlip' });
  assert.deepEqual(k(preset('scrapped')), { lead: 'earlyScrapped', out: ['slLoss', 'dbLoss'], note: 'nTotal' });
  assert.deepEqual(k(preset('licence')), { lead: 'earlyScrapped', out: ['slLoss', 'dbLoss'], note: 'nTotal' });
  assert.deepEqual(k(Object.assign({}, preset('licence'), { sell: 4 })), { lead: 'endScrapped', out: ['bothNone'], note: 'nYear1' });
  // kept to the end, the residual estimate wrong: equal book values, one sentence, the total note
  assert.deepEqual(k({ proceeds: 5000 }), { lead: 'endSold', out: ['bothGain'], note: 'nTotal' });
  assert.deepEqual(k({ proceeds: 0 }), { lead: 'endScrapped', out: ['bothLoss'], note: 'nTotal' });
  // sold at exactly the straight-line book value (proceeds are on a 500 step: residual 0 gives book 12 000)
  assert.deepEqual(k({ residual: 0, sell: 3, proceeds: 12000 }).out, ['slNone', 'dbGain']);
  assert.equal(k({ residual: 0, sell: 3, proceeds: 12000 }).note, 'nTotal');
});

test('normalise: clamps, snaps, defaults non-numbers; residual, sale year and proceeds follow cost and life', () => {
  const p = logic.normalise({ cost: 123456, life: 99, residual: 99999, sell: 99, proceeds: 999999, kind: 'car' });
  assert.deepEqual(p, { kind: 'equipment', cost: logic.COST_MAX, life: logic.LIFE_MAX, residual: 30000, sell: 8, proceeds: 60000 });
  const q = logic.normalise({ cost: 1, life: 0, residual: -5, sell: -4, proceeds: -1 });
  assert.deepEqual(q, { kind: 'equipment', cost: logic.COST_MIN, life: logic.LIFE_MIN, residual: 0, sell: 1, proceeds: 0 });
  assert.equal(logic.normalise({ cost: 30240 }).cost, 30000);
  assert.equal(logic.normalise({ cost: 7500, residual: 9000 }).residual, 3500);   // half of 7 500 = 3 750 → 3 500
  assert.equal(logic.normalise({ cost: 5000, proceeds: 9000 }).proceeds, 5000);
  assert.equal(logic.normalise({ life: 3, sell: 5 }).sell, 3);
  assert.equal(logic.normalise({ life: 4.6 }).life, 5);
  assert.equal(logic.normalise({ sell: 2.4 }).sell, 2);
  assert.equal(logic.normalise({ kind: 'licence' }).kind, 'licence');
  assert.deepEqual(logic.normalise({ cost: 'x', life: 'y', residual: 'z', sell: 'w', proceeds: 'v' }), logic.defaults);
  assert.equal(logic.residualMax(1000), 500);
  assert.equal(logic.residualMax(1500), 500);
});

test('normalise: proceeds snap to the step; null, empty, booleans and infinities take the default', () => {
  assert.equal(logic.normalise({ proceeds: 3240 }).proceeds, 3000);
  assert.equal(logic.normalise({ cost: Infinity }).cost, 30000);
  assert.equal(logic.normalise({ cost: -Infinity }).cost, 30000);
  assert.deepEqual(logic.normalise({ cost: null, life: '', residual: true, sell: '  ', proceeds: false }), logic.defaults);
  assert.equal(logic.normalise({ cost: '12000' }).cost, 12000);
});

test('the headers\' numbers: the declining rate and the straight-line amount a year', () => {
  assert.equal(S({}).rate, 0.4);
  assert.equal(S({ life: 4 }).rate, 0.5);
  assert.equal(S({}).perYearSl, 5400);
  near(S({ cost: 10000, life: 7, residual: 0 }).perYearSl, 10000 / 7);
});

test('shown and flipped are safe at the edges', () => {
  const sched = As.schedule(30000, 5, 3000, 'sl');
  assert.equal(As.shown(sched, 30000, 99, 0).sale.book, 3000);
  assert.equal(As.shown(sched, 30000, 0, 0).sale.book, 30000);
  assert.deepEqual(logic.flipped(S({}), null), []);
});

test('defaults and ranges are the SPEC params table', () => {
  assert.deepEqual(logic.defaults, { kind: 'equipment', cost: 30000, life: 5, residual: 3000, sell: 5, proceeds: 3000 });
  assert.deepEqual([logic.COST_MIN, logic.COST_MAX, logic.STEP], [1000, 60000, 500]);
  assert.deepEqual([logic.LIFE_MIN, logic.LIFE_MAX, logic.FACTOR], [2, 8, 2]);
});

test('lines: one bar per year (year 0 empty) and one book value per year end, same for both methods\' ends', () => {
  const s = S({});
  for (const m of logic.METHODS) {
    assert.equal(s[m].dep.length, 6);
    assert.equal(s[m].book.length, 6);
    assert.equal(s[m].dep[0], 0);
    assert.equal(s[m].book[0], 30000);
    assert.equal(s[m].book[5], 3000);
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
  const p = P(preset('sold-early'));
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

/** Preset id → string key: sold-early → pSoldEarly. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
