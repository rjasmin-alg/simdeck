// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-accruals-cash. Run: node --test sims/fin-accruals-cash/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules, then the ledger module (its tests copied
// with it from fin-capex-opex, plus `billed`), then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const Lg = require('./ledger.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const only = (...ids) => Object.fromEntries(logic.IDS.map((id) => [id, ids.includes(id)]));
const preset = (id) => logic.presets.find((x) => x.id === id);
const line = (s) => [s.cash, s.expense, s.prepaid, s.accrued];
const item = (s, id) => s.items.find((x) => x.id === id);
const subsets = () => {
  const out = [];
  for (let mask = 0; mask < 16; mask++) out.push(Object.fromEntries(logic.IDS.map((id, i) => [id, !!(mask & (1 << i))])));
  return out;
};

// ── tie-breaks ──

test('rule 4: a zero balance is neither prepaid nor accrued', () => {
  const s = at(only('link'), 5);
  assert.equal(item(s, 'link').bal, 0);
  assert.deepEqual([s.prepaid, s.accrued], [0, 0]);
  const p = at(only('support'), 12);
  assert.equal(item(p, 'support').bal, 0);
  assert.deepEqual([p.prepaid, p.accrued], [0, 0]);
});

test('rule 4: prepaid and accrued are summed per contract, not netted', () => {
  const s = at({}, 4);
  assert.deepEqual([s.prepaid, s.accrued, s.net], [8000, 1500, 6500]);
  const t9 = at({}, 9); // the net is negative, yet a prepayment is still there
  assert.deepEqual([t9.prepaid, t9.accrued, t9.net], [3000, 4500, -1500]);
});

test('rule 6: two contracts with the same event: the lead goes to the earlier one in contract order', () => {
  const mk = (id) => ({ id, payNow: 0, useNow: 100, paid: 0, used: 100 * 5, bal: -500 });
  const s = { n: 5, items: [mk('colo'), mk('late')], prepaid: 0, accrued: 1000, cashNow: 0 };
  assert.equal(logic.captionKey(s).item, 'colo');
  s.items.reverse();
  assert.equal(logic.captionKey(s).item, 'late');
});

test('rule 6: priority prepay > settle > accrue > release > same, whatever the contract order', () => {
  // month 1: support prepays, colo accrues, link is the same month
  assert.deepEqual(logic.captionKey(at({}, 1)), { lead: 'cPrepay', gap: 'gBoth', item: 'support' });
  // month 4: colo settles Q1 over support releasing and link
  assert.deepEqual(logic.captionKey(at({}, 4)), { lead: 'cSettle', gap: 'gBoth', item: 'colo' });
  // month 2: colo accrues over support releasing
  assert.equal(logic.captionKey(at({}, 2)).item, 'colo');
  // without colo, support releasing beats the link
  assert.deepEqual(logic.captionKey(at(only('support', 'link'), 2)), { lead: 'cRelease', gap: 'gPrepaid', item: 'support' });
});

test('rule 6: prepay outranks settle in the same month (no fixed month has both)', () => {
  const settle = { id: 'colo', payNow: 4500, useNow: 1500, paid: 4500, used: 6000, bal: -1500 };
  const prepay = { id: 'support', payNow: 12000, useNow: 1000, paid: 12000, used: 1000, bal: 11000 };
  const s = { n: 4, items: [settle, prepay], prepaid: 11000, accrued: 1500, cashNow: 16500 };
  assert.equal(logic.captionKey(s).lead, 'cPrepay');
  s.items.reverse();
  assert.equal(logic.captionKey(s).lead, 'cPrepay');
});

test('rule 6: accrue outranks release and settle outranks accrue in the same month (synthetic)', () => {
  const settle = { id: 'late', payNow: 6000, useNow: 0, paid: 6000, used: 6000, bal: 0 };
  const accrue = { id: 'colo', payNow: 0, useNow: 1500, paid: 0, used: 3000, bal: -3000 };
  const s = { n: 5, items: [accrue, settle], prepaid: 0, accrued: 3000, cashNow: 6000 };
  assert.equal(logic.captionKey(s).lead, 'cSettle');
  s.items.reverse();
  assert.equal(logic.captionKey(s).lead, 'cSettle');
});

test('rule 6: at month 12 nothing is prepaid, for every set of contracts (so cYearEndEven is true)', () => {
  for (const p of subsets()) assert.equal(at(p, 12).prepaid, 0);
});

test('rule 6: event edges: paid as used is same; paying off an accrual to zero is settle; a last prepaid month is release', () => {
  assert.equal(logic.eventOf(item(at({}, 3), 'link'), 3), 'same');
  assert.equal(logic.eventOf(item(at({}, 13), 'colo'), 13), 'settle');   // b₀ = −4 500, b = 0
  assert.equal(logic.eventOf(item(at({}, 13), 'late'), 13), 'settle');
  assert.equal(logic.eventOf(item(at({}, 12), 'support'), 12), 'release'); // b = 0 after the use: not accrue
  assert.equal(logic.eventOf(item(at({}, 0), 'support'), 0), 'none');
  assert.equal(logic.eventOf(item(at({}, 5), 'late'), 5), 'none');
  assert.equal(logic.eventOf(item(at({}, 12), 'late'), 12), 'accrue');
  // synthetic edges the fixed contracts do not reach
  assert.equal(logic.eventOf({ payNow: 100, useNow: 0, bal: 0 }, 3), 'settle');   // b₀ = −100
  assert.equal(logic.eventOf({ payNow: 100, useNow: 50, bal: 50 }, 3), 'prepay');
  assert.equal(logic.eventOf({ payNow: 50, useNow: 100, bal: -50 }, 3), 'accrue'); // part-paid from b₀ = 0
  assert.equal(logic.eventOf({ payNow: 50, useNow: 100, bal: 0 }, 3), 'same');     // b₀ = 50: pay and use net out
});

// ── rules ──

test('rule 1-2: each contract\'s expense in its months of use, its cash in the months it is paid', () => {
  const c = Object.fromEntries(logic.CONTRACTS.map((x) => [x.id, x]));
  const months = (a) => a.map((v, m) => (v ? m : null)).filter((m) => m !== null);
  assert.deepEqual(months(c.support.use), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.deepEqual(months(c.support.pay), [1]);
  assert.equal(c.support.pay[1], 12000);
  assert.deepEqual(months(c.colo.pay), [4, 7, 10, 13]);
  assert.ok(c.colo.pay.every((v) => v === 0 || v === 4500));
  assert.deepEqual(months(c.link.pay), months(c.link.use));
  assert.deepEqual(months(c.late.use), [12]);
  assert.deepEqual(months(c.late.pay), [13]);
  for (const x of logic.CONTRACTS) assert.equal(x.use.length, logic.MONTHS + 1);
  for (const x of logic.CONTRACTS) assert.ok(x.use.every((v) => v === 0 || v === x.fee), `${x.id}: fee = use per month`);
  assert.equal(c.support.fee * logic.YEAR, c.support.pay[1]);
  assert.deepEqual(logic.CONTRACTS.map((x) => x.fee), [1000, 1500, 800, 6000]);
  for (const x of logic.CONTRACTS) assert.equal(x.pay.length, logic.MONTHS + 1);
});

test('rule 3: the running lines at every step equal the chart\'s lines', () => {
  for (const p of subsets()) {
    const last = at(p, logic.MONTHS);
    for (let n = 0; n <= logic.MONTHS; n++) {
      const s = at(p, n);
      assert.equal(s.cash, last.lines.cash[n]);
      assert.equal(s.expense, last.lines.expense[n]);
      assert.equal(s.net, s.cash - s.expense);
      assert.equal(s.net, s.prepaid - s.accrued);
    }
  }
});

test('rule 3: nothing is posted before the year; this month\'s amounts', () => {
  assert.deepEqual(line(at({}, 0)), [0, 0, 0, 0]);
  const s = at({}, 1);
  assert.deepEqual([s.cashNow, s.expNow], [12800, 3300]);
  const s13 = at({}, 13);
  assert.deepEqual([s13.cashNow, s13.expNow], [10500, 0]);
});

test('rule 5: for every set of contracts the lines meet at month 13 at the year\'s expense', () => {
  for (const p of subsets()) {
    const s = at(p, 13);
    assert.equal(s.cash, s.expense, JSON.stringify(p));
    assert.equal(s.expense, s.yearExpense);
    assert.deepEqual([s.prepaid, s.accrued], [0, 0]);
    assert.equal(at(p, 12).expense, s.yearExpense, 'nothing of the next year is expensed in month 13');
  }
});

test('rule 5: the year\'s expense and cash; prepaid support alone meets at month 12', () => {
  const s = at({}, 12);
  assert.deepEqual([s.yearExpense, s.yearCash, s.accrued], [45600, 35100, 10500]);
  const p = at(only('support'), 12);
  assert.equal(p.cash, p.expense);
  assert.notEqual(at(only('support'), 11).cash, at(only('support'), 11).expense);
});

test('rule 7: the fiscal year start only names the months', () => {
  assert.equal(logic.calMonth(1, 1), 1);
  assert.equal(logic.calMonth(12, 1), 12);
  assert.equal(logic.calMonth(13, 1), 1);
  assert.equal(logic.calMonth(1, 4), 4);
  assert.equal(logic.calMonth(9, 4), 12);
  assert.equal(logic.calMonth(10, 4), 1);
  assert.equal(logic.calMonth(13, 4), 4);
  assert.equal(logic.calMonth(13, 12), 12);
  for (let n = 0; n <= logic.MONTHS; n++) {
    const a = at({ fy: 1 }, n), b = at({ fy: 4 }, n);
    assert.deepEqual(Object.assign({}, b, { fy: 1 }), a);
    assert.equal(b.fy, 4, 'the state carries the start for the page to name the months');
  }
});

test('rule 8: arrears invoices cover Q1…Q4', () => {
  assert.deepEqual([4, 7, 10, 13].map(logic.quarterOf), [1, 2, 3, 4]);
});

test('rule 6: caption leads through the full year, as in SPEC.md', () => {
  const leads = [];
  const gaps = [];
  for (let n = 0; n <= 13; n++) { const k = logic.captionKey(at({}, n)); leads.push(k.lead); gaps.push(k.gap); }
  assert.deepEqual(leads, ['cStart', 'cPrepay', 'cAccrue', 'cAccrue', 'cSettle', 'cAccrue', 'cAccrue', 'cSettle',
    'cAccrue', 'cAccrue', 'cSettle', 'cAccrue', 'cYearEnd', 'cNext']);
  assert.deepEqual(gaps, [null].concat(Array(11).fill('gBoth'), [null, null]));
});

test('rule 6: caption leads of the other presets and the edge cases', () => {
  const run = (p) => Array.from({ length: 14 }, (_, n) => logic.captionKey(at(p, n)).lead);
  assert.deepEqual(run(only('support')), ['cStart', 'cPrepay'].concat(Array(10).fill('cRelease'), ['cYearEndEven', 'cNextQuiet']));
  assert.deepEqual(run(only('link', 'late')), ['cStart'].concat(Array(11).fill('cSame'), ['cYearEnd', 'cNext']));
  assert.deepEqual(run(only('late')), ['cStart'].concat(Array(11).fill('cQuiet'), ['cYearEnd', 'cNext']));
  assert.deepEqual(run(only()), Array(14).fill('cNone'));
  assert.equal(logic.captionKey(at(only('link', 'late'), 5)).gap, 'gMeet');
  assert.equal(logic.captionKey(at(only('colo'), 5)).gap, 'gAccrued');
  assert.equal(logic.captionKey(at(only('link'), 12)).lead, 'cYearEndEven');
});

test('presets: the SPEC table', () => {
  const want = {
    'year': { 1: [12800, 3300, 11000, 1500], 4: [19700, 13200, 8000, 1500], 12: [35100, 45600, 0, 10500], 13: [45600, 45600, 0, 0] },
    'prepaid': { 1: [12000, 1000, 11000, 0], 6: [12000, 6000, 6000, 0], 12: [12000, 12000, 0, 0] },
    'arrears': { 3: [0, 4500, 0, 4500], 4: [4500, 6000, 0, 1500], 12: [13500, 18000, 0, 4500], 13: [18000, 18000, 0, 0] },
    'late': { 11: [8800, 8800, 0, 0], 12: [9600, 15600, 0, 6000], 13: [15600, 15600, 0, 0] },
    'year-end': { 12: [35100, 45600, 0, 10500] }
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  assert.deepEqual(logic.presets.map((x) => x.step), [0, 1, 3, 11, 12]);
  for (const [id, months] of Object.entries(want)) {
    for (const [n, v] of Object.entries(months)) assert.deepEqual(line(at(preset(id).params, Number(n))), v, `${id} month ${n}`);
  }
  const ye = at(preset('year-end').params, 12);
  assert.deepEqual([item(ye, 'colo').bal, item(ye, 'late').bal], [-4500, -6000]);
});

test('normalise: booleans from a URL, fy in 1…12, junk takes the default', () => {
  assert.deepEqual(logic.normalise({}), logic.defaults);
  assert.deepEqual(logic.normalise({ support: 'false', colo: '0', link: 0, late: 'true', fy: '4' }),
    { support: false, colo: false, link: false, late: true, fy: 4 });
  assert.deepEqual(logic.normalise({ support: 'maybe', fy: 13 }), logic.defaults);
  assert.equal(logic.normalise({ fy: 0 }).fy, 1);
  assert.equal(logic.normalise({ fy: 'x' }).fy, 1);
  assert.equal(logic.normalise({ fy: 3.6 }).fy, 4);
  assert.equal(logic.compute(5, { colo: 'false' }).items.some((x) => x.id === 'colo'), false);
});

test('contracts appear in table order, only when on', () => {
  assert.deepEqual(at({}, 3).items.map((x) => x.id), ['support', 'colo', 'link', 'late']);
  assert.deepEqual(at(only('late', 'support'), 3).items.map((x) => x.id), ['support', 'late']);
});

// ── ledger.js: billed (added here), then the tests copied with it from sims/fin-capex-opex/sim.test.js @ 2177381 ──

test('ledger: billed puts use in opex and pay in cash; missing months are 0', () => {
  const r = Lg.billed([0, 10, 10, 10], [0, 30]);
  assert.equal(r.length, 4);
  assert.deepEqual(r[1], { cash: 30, capex: 0, dep: 0, opex: 10 });
  assert.deepEqual(r[3], { cash: 0, capex: 0, dep: 0, opex: 10 });
  assert.deepEqual(Lg.totals(r, 1), { cash: 30, expense: 10, book: 0, ebitda: -10, ebit: -10 });
  assert.deepEqual(Lg.totals(r, 3), { cash: 30, expense: 30, book: 0, ebitda: -30, ebit: -30 });
  assert.equal(Lg.billed([], []).length, 1);
  const longer = Lg.billed([0, 10], [0, 0, 0, 30]); // the timeline is as long as the longer list
  assert.equal(longer.length, 4);
  assert.deepEqual(longer[3], { cash: 30, capex: 0, dep: 0, opex: 0 });
  assert.deepEqual(Lg.billed([5], [7])[0], { cash: 7, capex: 0, dep: 0, opex: 5 }); // row 0 counts too
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

test('every caption key the model can return has a string', () => {
  const keys = new Set();
  for (const p of subsets()) {
    for (let n = 0; n <= 13; n++) {
      const k = logic.captionKey(at(p, n));
      keys.add(k.lead);
      if (k.gap) keys.add(k.gap);
    }
  }
  for (const k of ['cStart', 'cNone', 'cPrepay', 'cSettle', 'cAccrue', 'cRelease', 'cSame', 'cQuiet', 'cYearEnd',
    'cYearEndEven', 'cNext', 'cNextQuiet', 'gBoth', 'gPrepaid', 'gAccrued', 'gMeet']) assert.ok(keys.has(k), `${k} is reachable`);
  for (const k of keys) for (const lang of ['hr', 'en']) assert.equal(typeof strings[lang][k], 'string', `${lang}.${k}`);
});

test('every preset has its label and hint in both languages; the page uses the model\'s presets and steps', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  assert.equal(logic.steps, 13);
  assert.match(html, /presets:\s*L\.presets\.map/);
  const labels = { 'year': 'prYear', 'prepaid': 'prPrepaid', 'arrears': 'prArrears', 'late': 'prLate', 'year-end': 'prYearEnd' };
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
    const s = at({ fy: 4 }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ colo: false, fy: 7 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input or the contracts', () => {
  const p = P({});
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  const contracts = structuredClone(logic.CONTRACTS);
  const s1 = logic.step(s0, 1, p);
  s1.items[0].use[1] = 999;
  s1.items[0].pay[1] = 999;
  assert.deepEqual(s0, copy);
  assert.deepEqual(logic.CONTRACTS, contracts);
});
