// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-licence-models. Run: node --test sims/fin-licence-models/sim.test.js
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the copied ledger.js block (from
// sims/fin-capex-opex/sim.test.js @ 2177381, kept with the copy, COMMON.md §6), then licensing.js (promotable), then
// the page model and its presets, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const Lg = require('./ledger.js');
const Li = require('./licensing.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const run = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);
const R = (x) => Lg.roundMoney(x);

// ── tie-breaks ──

test('rule 8: equal cash so far is not a crossing; the crossing is the year after the tie', () => {
  const s = logic.compute(preset('flat'));
  assert.equal(s.perp.cum[5], 160000);
  assert.equal(s.sub.cum[5], 160000, 'year 5: both have paid the same');
  assert.equal(s.cross, 6);
  assert.equal(Li.crossing([0, 10, 20], [0, 5, 20]), 0, 'a tie in the last year: no crossing');
});

test('rule 8: the crossing counts only if the subscription stays dearer to the end of the horizon', () => {
  assert.equal(Li.crossing([0, 10, 20, 30, 40], [0, 5, 25, 35, 45]), 2);
  assert.equal(Li.crossing([0, 10, 20, 30, 40], [0, 5, 25, 25, 45]), 4, 'dearer in year 2, not in 3: the crossing is 4');
  assert.equal(Li.crossing([0, 10, 20, 30, 40], [0, 5, 25, 35, 39]), 0, 'cheaper again by the end: no crossing');
  assert.equal(Li.crossing([0, 10, 20], [0, 11, 21]), 1, 'dearer from year 1');
  assert.equal(Li.crossing([0], [0]), 0, 'no years');
});

test('rule 8: the crossing compares cash rounded to the euro, as shown', () => {
  const r1 = [{ cash: 0, capex: 0, dep: 0, opex: 0 }, { cash: 100.4, capex: 0, dep: 0, opex: 100.4 }];
  const r2 = [{ cash: 0, capex: 0, dep: 0, opex: 0 }, { cash: 99.6, capex: 0, dep: 0, opex: 99.6 }];
  assert.deepEqual(Li.cumulative(r1), [0, 100]);
  assert.equal(Li.crossing(Li.cumulative(r2), Li.cumulative(r1)), 0, '100.4 and 99.6 both show 100: a tie');
});

test('rule 9: the cheaper option compares rounded totals; both on a tie', () => {
  assert.deepEqual(logic.cheaper(100, 100), ['perp', 'sub']);
  assert.deepEqual(logic.cheaper(99, 100), ['perp']);
  assert.deepEqual(logic.cheaper(101, 100), ['sub']);
  // flat, horizon 5: both 160 000
  assert.deepEqual(run({ growth: 0, rise: 0, horizon: 5 }).pick, ['perp', 'sub']);
});

test('rule 1: users are rounded half up, after tidying float noise', () => {
  assert.equal(Li.usersIn(200, 0.05, 3), 221, '200 × 1.05² = 220.5 → 221');
  assert.equal(Li.usersIn(200, 0.15, 3), 265, '200 × 1.15² = 264.5 → 265');
  assert.equal(Li.usersIn(200, 0.1, 4), 266, '266.2 → 266');
  assert.equal(Li.usersIn(200, 0.1, 1), 200, 'year 1 has no growth yet');
  assert.equal(Li.tidy(220.49999999999997), 220.5);
});

test('rule 1: servers round up: 250 users fit 5 servers, 251 need 6', () => {
  const c = (u0) => Li.counts({ u0, g: 0, perServer: 50, small: 16, big: 32, refresh: 0, H: 1 });
  assert.equal(c(250).servers[1], 5);
  assert.equal(c(251).servers[1], 6);
  assert.equal(c(200).cores[1], 64);
});

test('rule 1: the refresh year already has the bigger servers; refresh 0 never comes', () => {
  const c = (refresh) => Li.counts({ u0: 200, g: 0, perServer: 50, small: 16, big: 32, refresh, H: 5 });
  assert.deepEqual(c(4).perServer, [0, 16, 16, 16, 32, 32]);
  assert.deepEqual(c(4).cores, [0, 64, 64, 64, 128, 128]);
  assert.deepEqual(c(0).cores, [0, 64, 64, 64, 64, 64]);
  assert.deepEqual(c(9).cores, c(0).cores, 'a refresh after the horizon changes nothing');
});

test('rule 3: licences held never fall; only the increase is bought', () => {
  assert.deepEqual(Li.held([0, 5, 3, 7, 7]), [0, 5, 5, 7, 7]);
  const p = Li.perpetual({ need: [0, 5, 3, 7], list: [0, 10, 10, 10], m: 0.2, life: 5, lapse: 0, gap: 1, fee: 0.2 });
  assert.deepEqual(p.bought, [0, 5, 0, 2]);
  near(p.parts[2].maint, 10, 1e-9, 'maintenance on the 5 held, not the 3 needed');
});

// ── ledger.js (copied from fin-capex-opex with its tests) ──

test('ledger.js is the fin-capex-opex copy, unchanged apart from its header', () => {
  const fs = require('node:fs'), path = require('node:path');
  const mine = fs.readFileSync(path.join(__dirname, 'ledger.js'), 'utf8').split('\n');
  const src = path.join(__dirname, '..', 'fin-capex-opex', 'ledger.js');
  if (!fs.existsSync(src)) return; // promoted or moved: nothing to compare with
  const theirs = fs.readFileSync(src, 'utf8').split('\n');
  assert.deepEqual(mine.slice(0, 1).concat(mine.slice(3)), theirs);
});

test('ledger: rounding is half away from zero and never -0', () => {
  assert.equal(Lg.roundMoney(62.5), 63);
  assert.equal(Lg.roundMoney(-62.5), -63);
  assert.equal(Lg.roundMoney(62.49), 62);
  assert.ok(Object.is(Lg.roundMoney(-0.4), 0));
});

test('ledger: sums are tidied, so float noise cannot flip a tie', () => {
  const r = Lg.purchase(1, 3, true);
  assert.equal(Lg.sums(r, 3).dep, 1);
  assert.equal(Lg.totals(r, 3).book, 0);
});

test('ledger: the identity cash = expense + book value holds on the exact totals', () => {
  for (const r of [Lg.purchase(30000, 60, true), Lg.purchase(3000, 60, false), Lg.service(30000, 60)]) {
    for (let m = 0; m <= 60; m++) {
      const x = Lg.totals(r, m);
      near(x.cash, x.expense + x.book);
    }
  }
});

test('ledger: purchase and service rows (capex-opex rules 2-4)', () => {
  const r = Lg.purchase(30000, 60, true);
  assert.deepEqual(r[0], { cash: 30000, capex: 30000, dep: 0, opex: 0 });
  assert.deepEqual(Lg.totals(r, 12), { cash: 30000, expense: 6000, book: 24000, ebitda: 0, ebit: -6000 });
  assert.deepEqual(Lg.purchase(3000, 60, false)[0], { cash: 3000, capex: 0, dep: 0, opex: 3000 });
  assert.deepEqual(Lg.totals(Lg.service(30000, 60), 12), { cash: 6000, expense: 6000, book: 0, ebitda: -6000, ebit: -6000 });
  assert.deepEqual(Lg.totals(Lg.service(1200, 12), 99), Lg.totals(Lg.service(1200, 12), 12), 'month clamped');
});

// ── licensing.js ──

test('rule 2: the list price rises by r a year from year 1', () => {
  assert.equal(Li.listPrice(400, 0.03, 1), 400);
  near(Li.listPrice(400, 0.03, 3), 400 * 1.03 * 1.03, 1e-9);
  assert.equal(Li.listPrice(1250, 0, 7), 1250);
});

test('rule 4: a licence bought in year y is amortised over 5 years from that year, a full year in it', () => {
  const p = Li.perpetual({ need: [0, 10, 10, 10, 10, 10, 10, 10], list: [0, 100, 100, 100, 100, 100, 100, 100], m: 0, life: 5, lapse: 0, gap: 1, fee: 0 });
  assert.deepEqual(p.rows.map((r) => r.dep), [0, 200, 200, 200, 200, 200, 0, 0]);
  assert.deepEqual(Lg.shown(p.rows, 1), { cash: 1000, expense: 200, book: 800, ebitda: 0, ebit: -200 });
  assert.equal(Lg.shown(p.rows, 5).book, 0);
  // bought in year 3: amortised in years 3-7
  const q = Li.perpetual({ need: [0, 0, 0, 5, 5, 5, 5, 5], list: [0, 100, 100, 100, 100, 100, 100, 100], m: 0, life: 5, lapse: 0, gap: 1, fee: 0 });
  assert.deepEqual(q.rows.map((r) => r.dep), [0, 0, 0, 100, 100, 100, 100, 100]);
});

test('rule 4: amortisation past the horizon stays on the balance sheet', () => {
  const s = logic.compute(preset('short'));
  assert.equal(s.perp.at.book, 44413);
  assert.equal(s.perp.at.cash, s.perp.at.expense + s.perp.at.book);
});

test('rule 5: maintenance is m × this year\'s list price on every licence held, each year an expense', () => {
  const s = run({});
  near(s.years[0].perp.maint, 200 * 400 * 0.2);
  near(s.years[2].perp.maint, 242 * 400 * 1.03 * 1.03 * 0.2);
  assert.equal(s.years[0].perp.cash, 80000 + 16000);
});

test('rule 6: a lapse skips maintenance; the return pays the missed licence-years at the return year\'s price plus the fee', () => {
  const s = logic.compute(preset('lapse'));
  assert.deepEqual(s.years.map((y) => y.lapsed), [false, false, true, true, false, false, false]);
  assert.equal(s.years[2].perp.maint, 0);
  assert.equal(s.years[3].perp.maint, 0);
  const list5 = 400 * Math.pow(1.03, 4);
  near(s.lapse.paid, (242 + 266) * list5 * 0.2 * 1.2);
  assert.equal(R(s.lapse.paid), 54889);
  assert.equal(R(s.lapse.skipped), 43792);
  assert.equal(s.lapse.extra, 11096);
  assert.equal(s.years[4].perp.back, s.lapse.paid);
  assert.deepEqual([s.lapse.from, s.lapse.to, s.lapse.back], [3, 4, 5]);
});

test('rule 6: licences bought while lapsed pay no maintenance until the return, then count in the back-fees', () => {
  const p = Li.perpetual({ need: [0, 10, 20, 20], list: [0, 100, 100, 100], m: 0.1, life: 5, lapse: 2, gap: 1, fee: 0.5 });
  assert.equal(p.parts[2].maint, 0);
  assert.equal(p.rows[2].cash, 1000, 'the 10 new licences still bought');
  near(p.parts[3].back, 20 * 100 * 0.1 * 1.5);
  assert.equal(p.backYear, 3);
});

test('rule 7: the subscription pays s × list price per licence needed, all expense, nothing on the balance sheet', () => {
  const s = run({});
  near(s.years[0].sub.fee, 200 * 400 * 0.4);
  near(s.years[6].sub.fee, 354 * 400 * Math.pow(1.03, 6) * 0.4);
  assert.equal(s.sub.at.cash, s.sub.at.expense);
  assert.equal(s.sub.at.book, 0);
});

test('rule 7: per core, both options count cores; per user, users', () => {
  const u = run({}), c = run({ metric: 'core' });
  assert.deepEqual(u.years.map((y) => y.need), [200, 220, 242, 266, 293, 322, 354]);
  assert.deepEqual(c.years.map((y) => y.need), [64, 80, 80, 192, 192, 224, 256]);
  assert.equal(u.years[0].perp.cash, c.years[0].perp.cash, 'year 1 costs the same either way (200 × 400 = 64 × 1 250)');
});

test('ledger identity on the screen: cash = expense + book value, every year, every preset', () => {
  for (const x of logic.presets) {
    const H = x.params.horizon;
    const o = logic.compute(x.params);
    for (const side of ['perp', 'sub']) assert.equal(o[side].at.cash, o[side].at.expense + o[side].at.book, `${x.id} ${side}`);
    assert.equal(o.perp.cum.length, H + 1);
  }
});

// ── the page model ──

test('presets: the numbers of the SPEC table', () => {
  const want = {
    crossing: { cross: 6, p: [316934, 289678, 27256], s: 335961, pick: ['perp'] },
    flat: { cross: 6, p: [192000, 192000, 0], s: 224000, pick: ['perp'] },
    lapse: { cross: 7, p: [328030, 300774, 27256], s: 335961, pick: ['perp'] },
    'per-core': { cross: 0, p: [653347, 556718, 96629], s: 611264, pick: ['sub'] },
    'core-no-refresh': { cross: 7, p: [351246, 313859, 37387], s: 363450, pick: ['perp'] },
    short: { cross: 0, p: [152243, 107830, 44413], s: 109334, pick: ['sub'] }
  };
  for (const x of logic.presets) {
    const s = logic.compute(x.params), w = want[x.id];
    assert.equal(s.cross, w.cross, `${x.id} crossing`);
    assert.deepEqual([s.perp.at.cash, s.perp.at.expense, s.perp.at.book], w.p, `${x.id} perpetual`);
    assert.equal(s.sub.at.cash, w.s, `${x.id} subscription`);
    assert.deepEqual(s.pick, w.pick, `${x.id} pick`);
  }
});

test('presets: cash so far each year (SPEC.md)', () => {
  const c = (id) => logic.compute(preset(id));
  assert.deepEqual(c('crossing').perp.cum, [0, 96000, 122368, 152243, 185986, 224524, 267834, 316934]);
  assert.deepEqual(c('crossing').sub.cum, [0, 32000, 68256, 109334, 155841, 208604, 268330, 335961]);
  assert.deepEqual(c('lapse').perp.cum, [0, 96000, 122368, 131704, 142194, 235620, 278931, 328030]);
  assert.deepEqual(c('per-core').perp.cum, [0, 96000, 137200, 158418, 363851, 417875, 529165, 653347]);
  assert.deepEqual(c('per-core').sub.cum, [0, 32000, 73200, 115636, 220538, 328587, 458425, 611264]);
  assert.deepEqual(c('core-no-refresh').years.map((y) => y.cores), [64, 80, 80, 96, 96, 112, 128]);
});

test('presets: the yearly expense split (SPEC.md)', () => {
  const y = (id) => logic.compute(preset(id)).years.map((v) => [R(v.perp.amort), R(v.perp.maint), R(v.perp.back)]);
  assert.deepEqual(y('crossing'), [[16000, 16000, 0], [17648, 18128, 0], [19515, 20539, 0], [21613, 23253, 0], [24044, 26382, 0], [10734, 29863, 0], [12143, 33816, 0]]);
  assert.deepEqual(y('lapse')[4], [24044, 26382, 54889]);
  assert.deepEqual(logic.compute(preset('crossing')).years.map((v) => R(v.sub.fee)), [32000, 36256, 41078, 46506, 52764, 59726, 67631]);
});

test('the caption\'s numbers: year 1 of the perpetual licence, the counts\' span', () => {
  const s = run({});
  assert.deepEqual(s.perp.first, { cash: 96000, expense: 32000, book: 64000, ebitda: -16000, ebit: -32000 });
  assert.deepEqual(s.span, { u1: 200, uH: 354, c1: 64, cH: 256 });
  assert.equal(s.refreshIn, 4);
  assert.equal(run({ horizon: 3 }).refreshIn, 0, 'a refresh after the horizon is not mentioned');
  assert.equal(run({ refresh: 0 }).refreshIn, 0);
  assert.equal(s.price, 400);
  assert.equal(s.fee, 160);
  assert.equal(s.maintFee, 80);
  assert.equal(run({ metric: 'core' }).price, 1250);
});

test('rule 10: flipped lists what changed: the crossing year, the cheaper option', () => {
  const a = run({}), b = run({ horizon: 3 }), c = run({ horizon: 6 }), d = run({ growth: 0, rise: 0 });
  assert.deepEqual(logic.flipped(null, a), []);
  assert.deepEqual(logic.flipped(a, a), []);
  assert.deepEqual(logic.flipped(a, b), ['cross', 'pick']);
  assert.deepEqual(logic.flipped(a, c), [], 'horizon 6: still crossing in 6, perpetual cheaper');
  assert.deepEqual(logic.flipped(a, d), [], 'flat: crossing 6 as well');
  assert.deepEqual(logic.flipped(a, run({ lapse: 3 })), ['cross']);
});

test('rule 11: caption keys and notes, by priority, at most two', () => {
  assert.deepEqual(logic.captionKey(run({})), { key: 'capCross', notes: ['nUser', 'nExpense'] });
  assert.deepEqual(logic.captionKey(run({ horizon: 3 })), { key: 'capNever', notes: ['nUser', 'nExpense'] });
  assert.deepEqual(logic.captionKey(run({ lapse: 3 })), { key: 'capCross', notes: ['nLapse', 'nUser'] });
  assert.deepEqual(logic.captionKey(run({ metric: 'core' })), { key: 'capNever', notes: ['nCoreRefresh', 'nExpense'] });
  assert.deepEqual(logic.captionKey(run({ metric: 'core', refresh: 0 })), { key: 'capCross', notes: ['nCore', 'nExpense'] });
  assert.deepEqual(logic.captionKey(run({ metric: 'core', horizon: 3 })).notes, ['nCore', 'nExpense'], 'refresh after the horizon');
});

test('normalise: lapse within 2…H − 1, the return within the horizon', () => {
  assert.equal(logic.normalise({ lapse: 1 }).lapse, 0, 'year 1 is not a lapse');
  assert.equal(logic.normalise({ lapse: 9, horizon: 7 }).lapse, 6);
  assert.equal(logic.normalise({ lapse: 6, gap: 3, horizon: 7 }).gap, 1, 'back in year 7 at the latest');
  assert.equal(logic.normalise({ lapse: 5, gap: 3, horizon: 7 }).gap, 2);
  assert.equal(logic.normalise({ lapse: 2, gap: 3, horizon: 3 }).gap, 1);
  assert.equal(logic.normalise({ lapse: 0, gap: 3, horizon: 3 }).gap, 2, 'no lapse: the gap is kept in range');
  const s = run({ lapse: 6, gap: 3 });
  assert.equal(s.lapse.back, 7);
  assert.ok(s.years[6].perp.back > 0);
});

test('normalise: numbers clamped and snapped, junk takes the default, choices checked', () => {
  const n = logic.normalise({ growth: 99, maint: 3, rise: 3.3, horizon: 1, sub: 42, metric: 'socket', refresh: -1, lapse: 'x', gap: 0 });
  assert.deepEqual(n, { growth: 30, maint: 10, rise: 3.5, horizon: 3, sub: 40, metric: 'user', refresh: 0, lapse: 0, gap: 1 });
  assert.equal(logic.normalise({ growth: '' }).growth, 10, 'an empty value is not 0');
  assert.equal(logic.normalise({ maint: null }).maint, 20);
  assert.equal(logic.normalise({ horizon: true }).horizon, 7);
  assert.deepEqual(logic.normalise({}), logic.normalise(logic.defaults));
  assert.deepEqual(logic.normalise(logic.defaults), logic.defaults, 'the defaults are already normal');
});

test('rule 6: back-fees count the licences held, not the (lower) need of a missed year', () => {
  const p = Li.perpetual({ need: [0, 10, 4, 10], list: [0, 100, 100, 100], m: 0.1, life: 5, lapse: 2, gap: 1, fee: 0 });
  assert.equal(p.missed, 10);
  near(p.parts[3].back, 10 * 100 * 0.1);
});

test('normalise: a refresh in year 1 is none (there is never a small-server year to double)', () => {
  assert.equal(logic.normalise({ refresh: 1 }).refresh, 0);
  assert.equal(logic.normalise({ refresh: 2 }).refresh, 2);
  assert.deepEqual(logic.captionKey(run({ metric: 'core', refresh: 1 })).notes[0], 'nCore');
});

test('strings: no placeholder appears twice in one string (t.parts moves a node, the second would be empty)', () => {
  for (const lang of ['hr', 'en']) {
    for (const [k, v] of Object.entries(strings[lang])) {
      for (const form of [].concat(v)) {
        const names = (form.match(/\{(\w+)\}/g) || []);
        assert.equal(new Set(names).size, names.length, `${lang}.${k}: ${names.join(' ')}`);
      }
    }
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
  const p = P(preset('lapse'));
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

/** Preset id → string key: core-no-refresh → pCoreNoRefresh. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
