// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-budget-variance. Run: node --test sims/fin-budget-variance/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules, then the presets, then the ledger module
// (its tests copied with it from fin-accruals-cash), then strings, page and the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const Lg = require('./ledger.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const NONE = { volume: false, price: false, late: false, accrue: false, spend: false };
const P = (over) => Object.assign({}, logic.defaults, over);
const only = (over) => P(Object.assign({}, NONE, over));
const at = (over, n) => kit.stateAt(logic, only(over), n);
const preset = (id) => logic.presets.find((x) => x.id === id);
const atPreset = (id, n) => kit.stateAt(logic, P(preset(id).params), n);
const line = (s, id) => s.lines.find((l) => l.id === id);
const ytd = (s) => [s.ytd.budget, s.ytd.booked, s.ytd.variance, s.ytd.vol, s.ytd.price, s.ytd.timing];
const allFlags = () => {
  const out = [];
  for (let mask = 0; mask < 32; mask++) {
    out.push(Object.fromEntries(['volume', 'price', 'late', 'accrue', 'spend'].map((k, i) => [k, !!(mask & (1 << i))])));
  }
  return out;
};

// ── tie-breaks ──

test('rule 6: zero variance is on budget (neither over nor under), in the month and to date', () => {
  const s = at({}, 4);
  assert.equal(s.now.variance, 0);
  assert.equal(s.ytd.variance, 0);
  assert.deepEqual(logic.captionKey(s), { lead: 'cOnPlan', gap: 'gOn' });
  assert.ok(Object.is(s.ytd.variance, 0) && Object.is(s.ytd.timing, 0), 'never -0');
});

test('rule 11: to date at 0 with non-zero parts is gEven, not gOn (synthetic: no preset reaches it)', () => {
  const base = at({}, 3);
  const s = Object.assign({}, base, { ytd: Object.assign({}, base.ytd, { vol: 500, price: 0, timing: -500, variance: 0 }) });
  assert.equal(logic.captionKey(s).gap, 'gEven');
  s.ytd.vol = 0; s.ytd.price = 500;
  assert.equal(logic.captionKey(s).gap, 'gEven', 'price and timing cancel');
  s.ytd.price = 0; s.ytd.timing = 0;
  assert.equal(logic.captionKey(s).gap, 'gOn');
});

test('rule 8: an apparent underspend of exactly 0 spends nothing; below 0 spends nothing', () => {
  // accrued: the late invoice is accrued, so nothing looks left over (exactly 0)
  const s = at({ late: true, accrue: true, spend: true }, 12);
  assert.equal(s.spent, 0);
  assert.equal(line(s, 'cloud').qty[11], 2000);
  // over budget at month 10 (volume): nothing is spent either
  assert.equal(at({ volume: true, spend: true }, 12).spent, 0);
});

test('rule 11: lead priority spend > late (month 10, 11) > price > volume > the month\'s own variance', () => {
  // month 11: spend and the arrival of the late invoice; spend leads
  assert.equal(logic.captionKey(at({ late: true, spend: true }, 11)).lead, 'cSpend');
  assert.equal(logic.captionKey(at({ late: true, accrue: true, spend: true }, 11)).lead, 'cReplace');
  assert.equal(logic.captionKey(at({ late: true }, 11)).lead, 'cArrives');
  assert.equal(logic.captionKey(at({ late: true, accrue: true }, 11)).lead, 'cReplace');
  assert.equal(logic.captionKey(at({ late: true, volume: true, price: true }, 10)).lead, 'cMissing');
  assert.equal(logic.captionKey(at({ late: true, accrue: true }, 10)).lead, 'cAccrual');
  assert.equal(logic.captionKey(at({ price: true, volume: true }, 7)).lead, 'cPrice');
  assert.equal(logic.captionKey(at({ volume: true }, 5)).lead, 'cVolume');
  assert.equal(logic.captionKey(at({ volume: true }, 6)).lead, 'cOver');
  assert.equal(logic.captionKey(at({ volume: true }, 4)).lead, 'cOnPlan');
  // nothing spent: the late invoice's arrival leads; spend alone (nothing late) gives cNoSpend
  assert.equal(logic.captionKey(at({ late: true, volume: true, price: true, spend: true }, 11)).lead, 'cArrives');
  assert.equal(logic.captionKey(at({ spend: true }, 11)).lead, 'cNoSpend');
  // an event month with its flag off is an ordinary month
  for (const n of [5, 7, 10, 11]) assert.equal(logic.captionKey(at({}, n)).lead, 'cOnPlan', `month ${n}`);
  // the year-end note on the late invoice comes only with it
  assert.equal(logic.captionKey(at({ late: true }, 12)).gap, 'gYearLate');
  assert.equal(logic.captionKey(at({ volume: true }, 12)).gap, null);
});

test('rule 11: a month under budget without an event is cUnder (synthetic), step 0 and step 12 leads', () => {
  const base = at({}, 3);
  const s = Object.assign({}, base, { now: Object.assign({}, base.now, { variance: -100 }) });
  assert.equal(logic.captionKey(s).lead, 'cUnder');
  assert.deepEqual(logic.captionKey(at({}, 0)), { lead: 'cStart', gap: null });
  assert.equal(logic.captionKey(at({}, 12)).lead, 'cYearOn');
  assert.equal(logic.captionKey(at({ volume: true }, 12)).lead, 'cYearOver');
  const u = Object.assign({}, at({}, 12));
  u.ytd = Object.assign({}, u.ytd, { variance: -1 });
  assert.equal(logic.captionKey(u).lead, 'cYearUnder');
});

// ── rules ──

test('rule 1: the budget is 2 000 × €5 and 150 × €40 every month, €192 000 for the year, known from step 0', () => {
  const s = at({}, 0);
  assert.deepEqual(line(s, 'cloud').budget.slice(1), Array(12).fill(10000));
  assert.deepEqual(line(s, 'lic').budget.slice(1), Array(12).fill(6000));
  assert.equal(s.budgetYear, 192000);
  assert.equal(s.month.budget[0], 0);
});

test('rule 2: volume adds 300 cloud units from month 5; price makes licences €48 from month 7', () => {
  const v = line(at({ volume: true }, 0), 'cloud');
  assert.equal(v.qty[4], 2000);
  assert.equal(v.qty[5], 2300);
  assert.equal(v.expense[5], 11500);
  const p = line(at({ price: true }, 0), 'lic');
  assert.equal(p.price[6], 40);
  assert.equal(p.price[7], 48);
  assert.equal(p.expense[7], 7200);
  // the injections touch only their own line
  assert.deepEqual(line(at({ volume: true }, 0), 'lic').expense, line(at({}, 0), 'lic').expense);
  assert.deepEqual(line(at({ price: true }, 0), 'cloud').expense, line(at({}, 0), 'cloud').expense);
});

test('rule 3: the late invoice is booked a month later; nothing else moves', () => {
  const c = line(at({ late: true, volume: true }, 0), 'cloud');
  assert.equal(c.booked[10], 0);
  assert.equal(c.booked[11], 23000);
  assert.equal(c.booked[9], c.expense[9]);
  assert.equal(c.booked[12], c.expense[12]);
  assert.equal(line(at({ late: true }, 0), 'lic').booked[10], 6000);
});

test('rule 4: an accrual books month 10\'s estimate and reverses it in month 11; without late it does nothing', () => {
  const c = line(at({ late: true, accrue: true, volume: true }, 0), 'cloud');
  assert.equal(c.accrual[10], 11500);
  assert.equal(c.accrual[11], -11500);
  assert.deepEqual(c.booked, c.expense);
  assert.deepEqual(c.tim, Array(13).fill(0));
  const a = structuredClone(at({ accrue: true, volume: true }, 12));
  const b = structuredClone(at({ volume: true }, 12));
  delete a.flags; delete b.flags;
  assert.deepEqual(a, b);
});

test('rule 5: the three parts of each month add up to booked − budget exactly, for every combination', () => {
  for (const f of allFlags()) {
    const s = kit.stateAt(logic, P(f), 12);
    for (const L of s.lines) {
      for (let m = 1; m <= 12; m++) {
        assert.equal(L.vol[m] + L.prc[m] + L.tim[m], L.booked[m] - L.budget[m], `${JSON.stringify(f)} ${L.id} ${m}`);
      }
    }
  }
});

test('rule 5: volume at the budgeted price, price at the quantity used', () => {
  const s = at({ volume: true, price: true }, 0);
  assert.equal(line(s, 'cloud').vol[5], 300 * 5);
  assert.equal(line(s, 'lic').prc[7], 8 * 150);
  // on one line with both a volume and a price change: volume at the budgeted price, price at the quantity used
  const was = logic.VOLUME.line;
  logic.VOLUME.line = 'lic';
  try {
    const L = line(at({ volume: true, price: true }, 0), 'lic');
    assert.equal(L.vol[7], 300 * 40);
    assert.equal(L.prc[7], 8 * 450);
  } finally { logic.VOLUME.line = was; }
  // spending adds volume on the cloud line at €5 a unit
  const u = at({ late: true, spend: true }, 0);
  assert.equal(line(u, 'cloud').qty[11], 4000);
  assert.equal(line(u, 'cloud').vol[11], 10000);
});

test('rule 6: to date sums months 1…n; timing to date is the ledger\'s cash − expense', () => {
  for (let n = 0; n <= 12; n++) {
    const s = atPreset('all', n);
    let b = 0, k = 0;
    for (let m = 1; m <= n; m++) { b += s.month.budget[m]; k += s.month.booked[m]; }
    assert.equal(s.ytd.budget, b);
    assert.equal(s.ytd.booked, k);
    assert.equal(s.ytd.variance, k - b);
    assert.equal(s.ytd.vol + s.ytd.price + s.ytd.timing, s.ytd.variance);
    const c = line(s, 'cloud');
    const t = Lg.totals(Lg.billed(c.expense, c.booked), n);
    assert.equal(c.ytd.timing, t.cash - t.expense);
  }
});

test('rule 8: use it or lose it spends what looked left over at month 10, in month 11', () => {
  const s = at({ late: true, spend: true }, 12);
  assert.equal(s.spent, 10000);
  assert.equal(line(s, 'cloud').booked[11], 30000);
  assert.equal(s.ytd.variance, 10000);
  assert.equal(s.ytd.vol, 10000);
  // months 1…10 are as without spending
  const plain = at({ late: true }, 12);
  for (let m = 1; m <= 10; m++) assert.equal(s.month.booked[m], plain.month.booked[m]);
  // with volume and price on too, the underspend is smaller (all three parts) and still spent
  assert.equal(at({ late: true, spend: true, price: true }, 12).spent, 10000 - 4800);
  assert.equal(at({ late: true, spend: true, volume: true }, 12).spent, 11500 - 9000);
});

test('rule 9: run rate is the latest month booked; forecast = to date + run rate × months left', () => {
  for (let n = 1; n <= 12; n++) {
    const s = atPreset('all', n);
    assert.equal(s.runRate, s.month.booked[n]);
    assert.equal(s.left, 12 - n);
    assert.equal(s.forecast, s.ytd.booked + s.runRate * (12 - n));
    assert.equal(s.fcVariance, s.forecast - 192000);
  }
  const s0 = atPreset('all', 0);
  assert.deepEqual([s0.runRate, s0.forecast, s0.fcVariance], [0, 192000, 0]);
  const s12 = atPreset('all', 12);
  assert.equal(s12.forecast, s12.ytd.booked);
});

test('rule 10: the fiscal year start only names the months', () => {
  assert.equal(logic.calMonth(1, 1), 1);
  assert.equal(logic.calMonth(10, 1), 10);
  assert.equal(logic.calMonth(1, 4), 4);
  assert.equal(logic.calMonth(10, 4), 1);
  assert.equal(logic.calMonth(12, 4), 3);
  const a = Object.assign({}, kit.stateAt(logic, P({ fy: 4 }), 10));
  const b = Object.assign({}, kit.stateAt(logic, P({ fy: 1 }), 10));
  assert.equal(a.fy, 4);
  delete a.fy; delete b.fy;
  assert.deepEqual(a, b);
});

// ── presets (SPEC.md table) ──

test('presets: the SPEC table', () => {
  assert.deepEqual(logic.presets.map((x) => [x.id, x.step]),
    [['all', 0], ['real', 7], ['late', 10], ['use-it', 10], ['accrued', 10]]);
  // all: month 10 under for the month, over to date; forecast drops; the year ends 19 200 over
  const a10 = atPreset('all', 10);
  assert.equal(a10.now.variance, -8800);
  assert.deepEqual([a10.month.expense[10], a10.month.booked[10]], [18700, 7200]);
  assert.deepEqual(ytd(a10), [160000, 162300, 2300, 9000, 4800, -11500]);
  assert.deepEqual([a10.runRate, a10.forecast, a10.fcVariance], [7200, 176700, -15300]);
  assert.deepEqual(ytd(atPreset('all', 5)), [80000, 81500, 1500, 1500, 0, 0]);
  assert.deepEqual(ytd(atPreset('all', 7)), [112000, 117700, 5700, 4500, 1200, 0]);
  assert.deepEqual(ytd(atPreset('all', 9)), [144000, 155100, 11100, 7500, 3600, 0]);
  const a11 = atPreset('all', 11);
  assert.deepEqual(ytd(a11), [176000, 192500, 16500, 10500, 6000, 0]);
  assert.deepEqual([a11.runRate, a11.forecast], [30200, 222700]);
  assert.deepEqual(ytd(atPreset('all', 12)), [192000, 211200, 19200, 12000, 7200, 0]);
  // volume and price, no late invoice: the run rate from month 7 forecasts the year's result
  const r5 = atPreset('real', 5);
  assert.deepEqual([r5.now.variance, r5.runRate, r5.forecast, r5.fcVariance], [1500, 17500, 204000, 12000]);
  const r7 = atPreset('real', 7);
  assert.deepEqual([r7.now.variance, r7.runRate, r7.forecast, r7.fcVariance], [2700, 18700, 211200, 19200]);
  for (let n = 7; n <= 12; n++) assert.equal(atPreset('real', n).forecast, 211200);
  assert.deepEqual(ytd(atPreset('real', 12)), [192000, 211200, 19200, 12000, 7200, 0]);
  // volume alone and price alone (toggles)
  assert.equal(at({ volume: true }, 12).ytd.variance, 12000);
  const p = at({ price: true }, 7);
  assert.deepEqual([p.now.variance, p.forecast, p.fcVariance], [1200, 199200, 7200]);
  assert.equal(at({ price: true }, 12).ytd.variance, 7200);
  // late
  const l10 = atPreset('late', 10);
  assert.deepEqual([l10.ytd.variance, l10.ytd.timing, l10.forecast, l10.fcVariance], [-10000, -10000, 162000, -30000]);
  const l11 = atPreset('late', 11);
  assert.deepEqual([l11.ytd.variance, l11.runRate, l11.forecast, l11.fcVariance], [0, 26000, 202000, 10000]);
  assert.equal(atPreset('late', 12).ytd.variance, 0);
  // use it or lose it
  const u = atPreset('use-it', 12);
  assert.deepEqual([u.spent, u.ytd.variance, u.ytd.vol, u.ytd.timing], [10000, 10000, 10000, 0]);
  // accrued
  for (let n = 1; n <= 12; n++) assert.equal(atPreset('accrued', n).ytd.timing, 0);
  const c10 = atPreset('accrued', 10);
  assert.deepEqual([c10.ytd.variance, c10.forecast, c10.fcVariance], [13800, 211200, 19200]);
  for (let n = 7; n <= 12; n++) assert.equal(atPreset('accrued', n).forecast, 211200);
});

test('presets open on their own event: the caption lead at the opening step', () => {
  const leads = { all: 'cStart', real: 'cPrice', late: 'cMissing', 'use-it': 'cMissing', accrued: 'cAccrual' };
  for (const x of logic.presets) assert.equal(logic.captionKey(atPreset(x.id, x.step)).lead, leads[x.id], x.id);
});

test('normalise: booleans from a URL, fy in 1…12, junk takes the default', () => {
  assert.deepEqual(logic.normalise({ volume: 'false', price: '1', late: 0, accrue: 'true', spend: 'x', fy: '4' }),
    { fy: 4, volume: false, price: true, late: false, accrue: true, spend: false });
  assert.deepEqual(logic.normalise({ volume: '0', accrue: '1', spend: 1, late: false }),
    { fy: 1, volume: false, price: true, late: false, accrue: true, spend: true });
  assert.equal(logic.normalise({ fy: 13 }).fy, 1);
  assert.equal(logic.normalise({ fy: 0 }).fy, 1);
  assert.equal(logic.normalise({ fy: 'x' }).fy, 1);
  assert.equal(logic.normalise({ fy: 6.6 }).fy, 7);
});

// ── ledger (copied with fin-accruals-cash's tests) ──

test('ledger: billed puts use in opex and pay in cash; missing months are 0', () => {
  const r = Lg.billed([0, 10, 10, 10], [0, 30]);
  assert.equal(r.length, 4);
  assert.deepEqual(r[1], { cash: 30, capex: 0, dep: 0, opex: 10 });
  assert.deepEqual(r[3], { cash: 0, capex: 0, dep: 0, opex: 10 });
  assert.deepEqual(Lg.totals(r, 1), { cash: 30, expense: 10, book: 0, ebitda: -10, ebit: -10 });
  assert.deepEqual(Lg.totals(r, 3), { cash: 30, expense: 30, book: 0, ebitda: -30, ebit: -30 });
  assert.equal(Lg.billed([], []).length, 1);
  const longer = Lg.billed([0, 10], [0, 0, 0, 30]);
  assert.equal(longer.length, 4);
  assert.deepEqual(longer[3], { cash: 30, capex: 0, dep: 0, opex: 0 });
  assert.deepEqual(Lg.billed([5], [7])[0], { cash: 7, capex: 0, dep: 0, opex: 5 });
});

test('ledger (copied): the identity cash = expense + book value holds on the exact totals', () => {
  for (const r of [Lg.purchase(30000, 60, true), Lg.purchase(3000, 60, false), Lg.service(30000, 60)]) {
    for (let m = 0; m <= 60; m++) {
      const x = Lg.totals(r, m);
      assert.ok(Math.abs(x.cash - (x.expense + x.book)) <= 1e-6);
    }
  }
});

test('ledger (copied): capitalised purchase: cash on day one, straight-line depreciation, book value falls to 0', () => {
  const r = Lg.purchase(30000, 60, true);
  assert.deepEqual(r[0], { cash: 30000, capex: 30000, dep: 0, opex: 0 });
  assert.deepEqual(Lg.totals(r, 12), { cash: 30000, expense: 6000, book: 24000, ebitda: 0, ebit: -6000 });
  assert.deepEqual(Lg.totals(r, 60), { cash: 30000, expense: 30000, book: 0, ebitda: 0, ebit: -30000 });
});

test('ledger (copied): expensed purchase and service', () => {
  assert.deepEqual(Lg.totals(Lg.purchase(3000, 60, false), 30), { cash: 3000, expense: 3000, book: 0, ebitda: -3000, ebit: -3000 });
  const r = Lg.service(30000, 60);
  assert.deepEqual(r[0], { cash: 0, capex: 0, dep: 0, opex: 0 });
  assert.deepEqual(Lg.totals(r, 12), { cash: 6000, expense: 6000, book: 0, ebitda: -6000, ebit: -6000 });
});

test('ledger (copied): sums clamp the month to the timeline and are tidied; series has one entry per month', () => {
  const r = Lg.service(1200, 12);
  assert.deepEqual(Lg.totals(r, 99), Lg.totals(r, 12));
  assert.deepEqual(Lg.totals(r, -3), Lg.totals(r, 0));
  assert.equal(Lg.series(r).length, 13);
  assert.equal(Lg.sums(Lg.purchase(1, 3, true), 3).dep, 1);
  assert.equal(Lg.isCapitalised(5000, 5000), true);
  assert.equal(Lg.isCapitalised(4999, 5000), false);
});

test('ledger (copied): rounding is half away from zero and never -0', () => {
  assert.equal(Lg.roundMoney(62.5), 63);
  assert.equal(Lg.roundMoney(-62.5), -63);
  assert.equal(Lg.roundMoney(62.49), 62);
  assert.ok(Object.is(Lg.roundMoney(-0.4), 0));
});

// ── strings and page ──

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('month lists have twelve names in both languages', () => {
  for (const lang of ['hr', 'en']) {
    for (const k of ['monthsShort', 'monthsLong', 'monthsLoc']) assert.equal(strings[lang][k].split('|').length, 12, `${lang}.${k}`);
  }
});

test('every caption key the model can return has a string; the reachable ones are reached', () => {
  const keys = new Set();
  for (const f of allFlags()) {
    for (let n = 0; n <= 12; n++) {
      const k = logic.captionKey(kit.stateAt(logic, P(f), n));
      keys.add(k.lead);
      if (k.gap) keys.add(k.gap);
    }
  }
  for (const k of ['cStart', 'cOnPlan', 'cOver', 'cVolume', 'cPrice', 'cMissing', 'cAccrual', 'cArrives', 'cReplace',
    'cSpend', 'cNoSpend', 'cYearOver', 'cYearOn', 'gOver', 'gUnder', 'gOn']) assert.ok(keys.has(k), `${k} is reachable`);
  for (const k of [...keys, 'cUnder', 'cYearUnder', 'gEven']) {
    for (const lang of ['hr', 'en']) assert.equal(typeof strings[lang][k], 'string', `${lang}.${k}`);
  }
});

test('every preset has its label and hint in both languages; the page uses the model\'s presets and steps', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  assert.equal(logic.steps, 12);
  assert.match(html, /presets:\s*L\.presets\.map/);
  const labels = { all: 'prAll', real: 'prReal', late: 'prLate', 'use-it': 'prUseIt', accrued: 'prAccrued' };
  for (const x of logic.presets) {
    for (const lang of ['hr', 'en']) {
      assert.equal(typeof strings[lang][labels[x.id]], 'string', `${lang} ${x.id}`);
      assert.equal(typeof strings[lang][labels[x.id] + 'Hint'], 'string');
    }
    for (const k of Object.keys(x.params)) assert.ok(k in logic.defaults, `preset param ${k}`);
  }
  for (const e of meta.entries || []) assert.ok(logic.presets.some((x) => x.id === e.preset), `entry ${e.preset}`);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (let n = 0; n <= logic.steps; n++) {
    const s = kit.stateAt(logic, P({ fy: 4, spend: true }), n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ accrue: true, fy: 7 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input or the budget lines', () => {
  const p = P({});
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  const lines = structuredClone(logic.LINES);
  const s1 = logic.step(s0, 1, p);
  s1.lines[0].qty[1] = 999;
  s1.lines[0].budget[1] = 999;
  assert.deepEqual(s0, copy);
  assert.deepEqual(logic.LINES, lines);
});
