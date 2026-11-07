// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-roi-payback-npv. Run: node --test sims/fin-roi-payback-npv/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the copied discount.js block (from
// sims/fin-npv-discounting/sim.test.js @ b341da3, kept with the copy, COMMON.md §6), then the yardsticks (promotable
// with yardsticks.js), then the page model, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const D = require('./discount.js');
const Y = require('./yardsticks.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
/** Params for two lists of flows (missing years 0), on top of the defaults. */
const two = (a, b, over) => {
  const p = {};
  logic.KEYS.a.forEach((k, t) => { p[k] = a[t] || 0; });
  logic.KEYS.b.forEach((k, t) => { p[k] = b[t] || 0; });
  return P(Object.assign(p, over));
};
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);
const QUICK = [-100000, 80000, 40000, 10000];
const SLOW = [-100000, 0, 20000, 40000, 60000, 60000];

// ── tie-breaks (rule 8) ──

test('rule 8: NPVs are compared as shown, rounded to the euro', () => {
  assert.equal(Y.pickNpv(100.4, 99.6), 'tie', 'both shown as 100 €');
  assert.equal(Y.pickNpv(51418.4, 51418.6), 'B', 'shown 51 418 against 51 419');
  assert.equal(Y.pickNpv(-0.4, 0.4), 'tie');
});

test('rule 8: NPVs equal to the euro tie, despite floating-point noise', () => {
  const s = logic.compute(preset('at-the-swap'));
  assert.equal(s.picks.npv, 'tie');
  assert.equal(Y.pickNpv(17355.37, 17355.37 + 1e-9), 'tie');
  assert.equal(Y.pickNpv(100.4, 100), 'tie', 'a difference under half a euro');
  assert.equal(Y.pickNpv(100.5, 100), 'A', 'half a euro rounds away from zero');
  assert.equal(Y.pickNpv(100, 100.5), 'B');
  // a thousand euros more for B in year 1 breaks the tie
  assert.equal(logic.compute(Object.assign({}, preset('at-the-swap'), { b1: 21000 })).picks.npv, 'B');
});

test('rule 8: ROI ties at the shown precision (0.1 percentage point)', () => {
  assert.equal(Y.pickRoi({ value: 0.3004 }, { value: 0.3 }), 'tie');
  assert.equal(Y.pickRoi({ value: 0.3005 }, { value: 0.3 }), 'A', '30.05 % rounds up to 30.1 %');
  assert.equal(Y.pickRoi({ value: -0.2 }, { value: -0.1 }), 'B');
  assert.equal(Y.pickRoi({ value: -0.3005 }, { value: -0.3 }), 'B', 'half away from zero below zero too');
  // 0.2875 exactly is shown and compared as 28.8 % (x * 100 * 10 would give 28.7 % in floating point), against
  // 28.7 %: the page and the pick agree (tenthsPct is what both use)
  const s = logic.compute(two([-80000, 103000], [-87000, 112000], { years: 1 }));
  assert.deepEqual([Y.tenthsPct(s.A.roi.value), Y.tenthsPct(s.B.roi.value)], [288, 287]);
  assert.equal(s.picks.roi, 'A');
  assert.equal(Y.pickRoi({ value: null }, { value: 0.5 }), null, 'no outflow: not compared');
  assert.equal(logic.compute(preset('same-total')).picks.roi, 'tie');
});

test('rule 8: payback ties at 0.1 year; never loses; two nevers tie; nothing invested is not compared', () => {
  const at = (y) => ({ kind: 'at', years: y });
  assert.equal(Y.pickPayback(at(1.66), at(1.7)), 'tie');
  assert.equal(Y.pickPayback(at(1.64), at(1.7)), 'A', 'shorter wins');
  assert.equal(Y.pickPayback(at(3), at(1)), 'B');
  assert.equal(Y.pickPayback(at(7.9), { kind: 'never', years: null }), 'A');
  assert.equal(Y.pickPayback({ kind: 'never', years: null }, at(0)), 'B');
  assert.equal(Y.pickPayback({ kind: 'never', years: null }, { kind: 'never', years: null }), 'tie');
  assert.equal(Y.pickPayback(at(8), { kind: 'never', years: null }), 'A', 'eight years still beats never');
  assert.equal(Y.pickPayback({ kind: 'none', years: null }, at(1)), null);
  assert.equal(logic.compute(preset('after-payback')).picks.payback, 'tie');
});

test('rule 8: agree only when all three pick the same project, never on a tie', () => {
  assert.equal(logic.compute(preset('quick-vs-slow')).agree, null);
  const dominant = logic.compute(two([-100000, 90000, 60000], [-100000, 30000, 30000, 30000]));
  assert.deepEqual(dominant.picks, { roi: 'A', payback: 'A', npv: 'A' });
  assert.equal(dominant.agree, 'A');
  const same = logic.compute(two(QUICK, QUICK));
  assert.deepEqual(same.picks, { roi: 'tie', payback: 'tie', npv: 'tie' });
  assert.equal(same.agree, null);
});

// ── discount.js (copied; its rules 1-4 as in fin-npv-discounting) ──

test('discount: the factor is 1 / (1 + r)^t; today is not discounted', () => {
  near(D.factor(0.08, 1), 1 / 1.08);
  near(D.factor(0.08, 5), 0.6805831970337531);
  for (const r of [0, 0.08, 0.3]) assert.equal(D.factor(r, 0), 1);
  for (let t = 0; t <= 8; t++) assert.equal(D.factor(0, t), 1);
});

test('discount: NPV sums the discounted flows; at 0 % it is the nominal sum', () => {
  near(D.npv([-120000, 35000, 35000, 35000, 35000, 35000], 0.08), 19744.85129773297, 1e-6);
  assert.equal(D.npv([-120000, 35000, 35000, 35000, 35000, 35000], 0), 55000);
  assert.equal(D.npv([], 0.08), 0);
});

test('discount: roundMoney is half away from zero, never -0; sign follows it', () => {
  assert.equal(D.roundMoney(0.5), 1);
  assert.equal(D.roundMoney(-0.5), -1);
  assert.ok(Object.is(D.roundMoney(-0.4), 0));
  assert.equal(D.sign(1e-9), 0);
  assert.equal(D.sign(-0.5), -1);
});

test('discount.js is the fin-npv-discounting copy, unchanged apart from its header', () => {
  const fs = require('node:fs'), path = require('node:path');
  const mine = fs.readFileSync(path.join(__dirname, 'discount.js'), 'utf8').split('\n');
  const src = path.join(__dirname, '..', 'fin-npv-discounting', 'discount.js');
  if (!fs.existsSync(src)) return; // promoted or moved: nothing to compare with
  const theirs = fs.readFileSync(src, 'utf8').split('\n');
  assert.deepEqual(mine.slice(0, 1).concat(mine.slice(3)), theirs);
});

// ── yardsticks.js (rules 4-7) ──

test('rule 4: simple ROI is the sum on paper over the outflows', () => {
  assert.deepEqual(Y.roi(QUICK), { invested: 100000, net: 30000, value: 0.3 });
  assert.equal(Y.roi(SLOW).value, 0.8);
  assert.equal(Y.roi([-50000, 20000, -50000, 120000]).value, 0.4, 'every outflow counts as invested');
  assert.equal(Y.roi([-100000, 60000]).value, -0.4, 'a loss is negative');
  assert.equal(Y.roi([0, 5000]).value, null, 'no outflow: no ROI');
  assert.equal(Y.roi([]).value, null);
});

test('rule 4: ROI ignores timing: the same flows in any order give the same ROI', () => {
  const late = [-100000, 10000, 20000, 30000, 40000, 50000];
  const early = [-100000, 50000, 40000, 30000, 20000, 10000];
  assert.equal(Y.roi(late).value, Y.roi(early).value);
  assert.ok(D.npv(early, 0.08) > D.npv(late, 0.08));
});

test('rule 5: payback is the first climb back to zero, interpolated inside the year', () => {
  assert.deepEqual(Y.payback(QUICK), { kind: 'at', years: 1.5 });
  near(Y.payback(SLOW).years, 3 + 40000 / 60000);
  assert.deepEqual(Y.payback([-100000, 100000]), { kind: 'at', years: 1 }, 'exactly zero counts as paid back');
  assert.deepEqual(Y.payback([-100000, 50000, 50000, 0]), { kind: 'at', years: 2 });
  near(Y.payback([0, -100000, 110000]).years, 1 + 100000 / 110000, 1e-12);
});

test('rule 5: payback ignores everything after it, even an outflow that brings the sum back below zero', () => {
  const base = [-100000, 60000, 60000];
  assert.deepEqual(Y.payback(base.concat([0, 0, 80000])), Y.payback(base));
  assert.deepEqual(Y.payback(base.concat([-500000])), Y.payback(base));
});

test('rule 5: payback kinds: nothing invested, never negative, never paid back', () => {
  assert.deepEqual(Y.payback([0, 0, 5000]), { kind: 'none', years: null });
  assert.deepEqual(Y.payback([]), { kind: 'none', years: null });
  assert.deepEqual(Y.payback([10000, -5000]), { kind: 'at', years: 0 }, 'an outflow, but the sum never below zero');
  assert.deepEqual(Y.payback([10000, -10000]), { kind: 'at', years: 0 }, 'touching zero is not below it');
  assert.deepEqual(Y.payback([-100000, 30000, 30000]), { kind: 'never', years: null });
});

test('rule 6: IRR is the rate at which the NPV is zero', () => {
  const one = Y.irr([-100000, 110000], D.npv);
  assert.equal(one.kind, 'one');
  near(one.rates[0], 0.1, 1e-9);
  near(Y.irr([-100000, 10000, 10000, 110000], D.npv).rates[0], 0.1, 1e-9);
  near(Y.irr(QUICK, D.npv).rates[0], 0.201994, 1e-5);
  near(Y.irr(SLOW, D.npv).rates[0], 0.166760, 1e-5);
  for (const f of [QUICK, SLOW]) assert.ok(Math.abs(D.npv(f, Y.irr(f, D.npv).rates[0])) < 1e-4);
});

test('rule 6: IRR kinds: no sign change, several, outside the search range, negative', () => {
  assert.deepEqual(Y.irr([0, 5000, 5000], D.npv), { kind: 'none', rates: [] });
  assert.deepEqual(Y.irr([0, 0], D.npv), { kind: 'none', rates: [] });
  // -100, +230, -132: NPV zero at 10 % and 20 % (a cost at the end)
  const many = Y.irr([-100000, 230000, -132000], D.npv);
  assert.equal(many.kind, 'many');
  assert.equal(many.rates.length, 2);
  near(many.rates[0], 0.1, 1e-9);
  near(many.rates[1], 0.2, 1e-9);
  // a tiny outlay, a huge return: above 1000 %
  assert.deepEqual(Y.irr([-1000, 200000], D.npv), { kind: 'out', rates: [] });
  assert.deepEqual(Y.irr([-1000, 20000], D.npv), { kind: 'out', rates: [] }, '1900 % is above the 1000 % end of the search');
  near(Y.irr([-1000, 11000], D.npv).rates[0], 10, 1e-9, '1000 % is the last grid point');
  // 100 % sits on the grid once; 25 % comes out exact
  assert.deepEqual(Y.irr([-100000, 200000], D.npv), { kind: 'one', rates: [1] });
  assert.equal(Y.irr([-100000, 125000], D.npv).rates[0], 0.25);
  // two sign changes, but the second root (-93 %) is outside the search: one IRR
  assert.equal(Y.irr([-100000, 150000, -10000], D.npv).kind, 'one');
  // an outflow at the end with an NPV below zero at every rate: no root found
  assert.equal(Y.irr([-100000, 150000, -100000], D.npv).kind, 'out');
  // losing money: a negative IRR
  near(Y.irr([-100000, 60000], D.npv).rates[0], -0.4, 1e-9);
  assert.equal(Y.signChanges([-1, 0, 2, -3, 0, 4]), 3);
});

test('rule 6: an exact zero on the grid is one root, not two', () => {
  assert.deepEqual(Y.roots((x) => x - 0.5, [0, 0.5, 1]), [0.5]);
  assert.deepEqual(Y.roots((x) => x * x, [-1, 0, 1]), [0], 'a touching root on the grid is found once');
  assert.deepEqual(Y.roots((x) => (x - 0.25) * (x - 0.25), [0, 0.5, 1]), [], 'a touching root between points is not found');
});

test('rule 7: the swap rate is where the NPVs are equal (the IRR of B - A)', () => {
  const c = Y.crossings(QUICK, SLOW, D.npv, 0.3);
  assert.equal(c.length, 1);
  near(c[0], 0.146172, 1e-5);
  near(D.npv(QUICK, c[0]), D.npv(SLOW, c[0]), 1e-4);
  assert.equal(Y.crossings([-100000, 120000, 10000], [-100000, 20000, 10000, 121000], D.npv, 0.3).length, 1);
  near(Y.crossings([-100000, 120000, 10000], [-100000, 20000, 10000, 121000], D.npv, 0.3)[0], 0.1, 1e-9);
});

test('rule 7: no swap for identical projects or one ahead everywhere; a swap at 0 % for the same total', () => {
  assert.deepEqual(Y.crossings(QUICK, QUICK, D.npv, 0.3), []);
  assert.deepEqual(Y.crossings([-100000, 60000, 60000], [-100000, 60000, 60000, 0, 0, 80000], D.npv, 0.3), []);
  assert.deepEqual(Y.crossings([-100000, 50000, 40000, 30000, 20000, 10000], [-100000, 10000, 20000, 30000, 40000, 50000], D.npv, 0.3), [0]);
  assert.deepEqual(Y.crossings(QUICK, SLOW, D.npv, 0.1), [], 'outside the range asked for');
  assert.deepEqual(Y.crossings([-100000, 130000], [-100000, 0, 169000], D.npv, 0.3), [0.3], 'a crossing on the last point');
});

// ── the page model ──

test('rule 3: flows after the horizon are kept but ignored by every yardstick', () => {
  const p = two([-100000, 110000], [-100000, 110000], { years: 1, a5: 200000, b3: -50000 });
  const s = logic.compute(p);
  assert.deepEqual(s.A.flows, [-100000, 110000]);
  assert.equal(s.A.roi.value, 0.1);
  assert.equal(s.B.payback.years, 100000 / 110000);
  assert.equal(s.same, true);
  assert.equal(s.p.a5, 200000, 'kept in the params');
});

test('presets give the numbers in SPEC.md', () => {
  const want = {
    'quick-vs-slow': { roi: [300, 800], pb: [15, 37], npv: [16306, 33837], picks: ['B', 'A', 'B'], irr: [202, 167], swap: [146] },
    'dear-money': { roi: [300, 800], pb: [15, 37], npv: [2610, -4117], picks: ['B', 'A', 'A'], irr: [202, 167], swap: [146] },
    'same-total': { roi: [500, 500], pb: [23, 40], npv: [25911, 13651], picks: ['tie', 'A', 'A'], irr: [203, 120], swap: [0] },
    'after-payback': { roi: [200, 1000], pb: [17, 17], npv: [6996, 61443], picks: ['B', 'tie', 'B'], irr: [131, 319], swap: [] },
    'at-the-swap': { roi: [300, 510], pb: [8, 26], npv: [17355, 17355], picks: ['B', 'A', 'tie'], irr: [278, 170], swap: [100] },
    'irr': { roi: [100, 800], pb: [9, 37], npv: [0, 24818], picks: ['B', 'A', 'B'], irr: [100, 167], swap: [192] }
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  const r = (x, f) => D.roundMoney(x * f);
  for (const [id, w] of Object.entries(want)) {
    const s = logic.compute(preset(id));
    assert.deepEqual([r(s.A.roi.value, 1000), r(s.B.roi.value, 1000)], w.roi, `${id} ROI`);
    assert.deepEqual([r(s.A.payback.years, 10), r(s.B.payback.years, 10)], w.pb, `${id} payback`);
    assert.deepEqual([s.A.npvR, s.B.npvR], w.npv, `${id} NPV`);
    assert.deepEqual([s.picks.roi, s.picks.payback, s.picks.npv], w.picks, `${id} picks`);
    assert.deepEqual([r(s.A.irr.rates[0], 1000), r(s.B.irr.rates[0], 1000)], w.irr, `${id} IRR`);
    assert.deepEqual(s.swaps.map((x) => r(x, 1000)), w.swap, `${id} swap`);
  }
});

test('preset lessons: dearer money changes only the NPV pick', () => {
  const a = logic.compute(preset('quick-vs-slow')), b = logic.compute(preset('dear-money'));
  assert.deepEqual(logic.flipped(a, b), ['npv']);
  assert.deepEqual(b.A.roi, a.A.roi);
  assert.deepEqual(b.B.payback, a.B.payback);
});

test('rule 10: the profile runs 0…30 % by 0.5 %, and at 0 % it is the sum on paper', () => {
  const s = logic.compute(preset('quick-vs-slow'));
  assert.equal(s.profile.length, 61);
  assert.equal(s.profile[0].rate, 0);
  assert.equal(s.profile[60].rate, 30);
  assert.deepEqual([s.profile[0].a, s.profile[0].b], [30000, 80000]);
  near(s.profile[16].a, s.A.npv, 1e-9);
});

test('rule 7: who is ahead below and above the swap', () => {
  const s = logic.compute(preset('quick-vs-slow'));
  assert.equal(s.below, 'B');
  assert.equal(s.above, 'A');
  const z = logic.compute(preset('same-total'));
  assert.equal(z.below, null, 'a swap at 0 % has no below');
  assert.equal(z.above, 'A');
  const n = logic.compute(preset('after-payback'));
  assert.equal(n.above, 'B');
  assert.equal(n.below, 'B');
});

test('rule 11: a flipped pick is marked, other changes are not', () => {
  const a = logic.compute(preset('quick-vs-slow'));
  assert.deepEqual(logic.flipped(a, logic.compute(Object.assign({}, preset('quick-vs-slow'), { rate: 9 }))), []);
  assert.deepEqual(logic.flipped(a, logic.compute(preset('same-total'))), ['roi', 'npv']);
  assert.deepEqual(logic.flipped(null, a), []);
});

test('rule 12: caption keys', () => {
  const k = (p) => logic.captionKey(logic.compute(p));
  assert.deepEqual(k(preset('quick-vs-slow')), { key: 'capDisagree', swap: 'swOne', notes: [] });
  assert.deepEqual(k(preset('same-total')), { key: 'capDisagree', swap: 'swZero', notes: [] });
  assert.deepEqual(k(preset('after-payback')), { key: 'capDisagree', swap: 'swNone', notes: [] });
  assert.deepEqual(k(preset('at-the-swap')), { key: 'capDisagree', swap: 'swOne', notes: ['nAtSwap'] });
  assert.deepEqual(k(preset('irr')), { key: 'capDisagree', swap: 'swOne', notes: ['nIrrA'] });
  assert.deepEqual(k(two([-100000, 90000, 60000], [-100000, 30000, 30000, 30000])), { key: 'capAgree', swap: 'swNone', notes: [] });
  assert.deepEqual(k(two(QUICK, QUICK)), { key: 'capPicks', swap: 'swSame', notes: [] }, 'all ties: no "disagree"');
  assert.equal(k(two(QUICK, [])).key, 'capPicks', 'one empty: only NPV can pick, nothing to disagree with');
  assert.equal(k(preset('same-total')).key, 'capDisagree', 'a tie against a pick is a disagreement');
  assert.deepEqual(k(two([], [])), { key: 'capEmpty', swap: null, notes: [] });
  assert.equal(k(two([-50000, 50000], [-100000, 165000, -66000])).swap, 'swMany', 'B - A crosses at 10 % and 20 %');
  // B's NPV zero at its IRR, A's not
  assert.deepEqual(k(two(QUICK, [-100000, 110000], { rate: 10 })).notes, ['nIrrB']);
  // several IRRs: the note says "one of"
  assert.deepEqual(k(two(QUICK, [-50000, 115000, -66000], { rate: 10 })).notes, ['nIrrSomeB']);
  // NPV noise at the IRR (-1.5e-11 at 30 %) still counts as zero
  assert.deepEqual(k(two([-100000, 130000], SLOW, { rate: 30 })).notes, ['nIrrA']);
  // a crossing just above 0 % is one crossing, not the "equal at 0 %" case
  assert.equal(k(two([200000, 0, 0, 0, 0, 0, 0, 0, -200000], [-199000, 0, 0, 0, 0, 0, 0, 0, 200000], { years: 8 })).swap, 'swOne');
  // an empty project has NPV 0 but no IRR note
  assert.deepEqual(k(two(QUICK, [])).notes, []);
  assert.deepEqual(k(two([], QUICK)).notes, []);
  // both NPVs zero at the rate (both IRRs 10 %): the two IRR notes, not the crossing note
  assert.deepEqual(k(two([-100000, 110000], [-100000, 10000, 110000], { rate: 10 })).notes, ['nIrrA', 'nIrrB']);
});

test('normalise: clamps, snaps and repairs what a URL may carry', () => {
  const p = logic.normalise({ rate: 33, years: 0, a0: -999999, a1: 1234, b2: 'x', b3: -400 });
  assert.equal(p.rate, logic.RATE_MAX);
  assert.equal(p.years, 1);
  assert.equal(p.a0, logic.CF_MIN);
  assert.equal(p.a1, 1000);
  assert.equal(p.b2, 0);
  assert.ok(Object.is(p.b3, 0), '-400 snaps to +0');
  assert.equal(logic.normalise({ rate: 7.3 }).rate, 7.5);
  assert.equal(logic.normalise({ rate: -5, years: 99, b8: 999999 }).rate, 0);
  assert.equal(logic.normalise({ years: 99 }).years, logic.MAX_YEARS);
  assert.equal(logic.normalise({ b8: 999999 }).b8, logic.CF_MAX);
  assert.equal(logic.normalise({ rate: 'x', years: 'y' }).rate, logic.defaults.rate);
  assert.equal(logic.normalise({ rate: 'x', years: 'y' }).years, logic.defaults.years);
  assert.equal(logic.normalise({ rate: '', years: null }).rate, logic.defaults.rate, 'an empty value is not 0');
  assert.equal(logic.normalise({ years: '' }).years, logic.defaults.years);
  assert.equal(logic.normalise({ years: 4.6 }).years, 5);
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
  const p = P(preset('irr'));
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

/** Preset id → string key: quick-vs-slow → pQuickVsSlow. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
