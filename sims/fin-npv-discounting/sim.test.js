// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-npv-discounting. Run: node --test sims/fin-npv-discounting/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the discount module's rules (promotable with it), then
// the page model, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const D = require('./discount.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const flows = (list) => Object.fromEntries(logic.CF_KEYS.map((k, t) => [k, list[t] || 0]));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);

// ── tie-breaks (rule 5) ──

test('rule 5: rounding is half away from zero, and -0 is 0', () => {
  assert.equal(D.roundMoney(0.5), 1);
  assert.equal(D.roundMoney(-0.5), -1);
  assert.equal(D.roundMoney(-2674.5716), -2675);
  assert.equal(D.roundMoney(2674.4999), 2674);
  assert.ok(Object.is(D.roundMoney(-0.4), 0), '-0.4 rounds to +0');
  assert.ok(Object.is(D.roundMoney(-0), 0), '-0 is 0');
});

test('rule 5: the sign is the rounded sign, so noise never decides it', () => {
  assert.equal(D.sign(1e-9), 0);
  assert.equal(D.sign(-1e-9), 0);
  assert.equal(D.sign(0.49), 0);
  assert.equal(D.sign(-0.49), 0);
  assert.equal(D.sign(0.5), 1);
  assert.equal(D.sign(-0.5), -1);
});

test('rule 5: earning exactly the cost of capital is NPV 0, not a loss or a gain', () => {
  const s = logic.compute(preset('just-the-rate'));
  assert.ok(Math.abs(s.npv) < 1e-6, 'raw NPV is floating-point noise around 0');
  assert.equal(s.npvR, 0);
  assert.equal(s.sign, 0);
  assert.equal(logic.captionKey(s).key, 'capZero');
  // a euro more or less flips it
  assert.equal(logic.compute(Object.assign({}, preset('just-the-rate'), { cf1: 109000 })).sign, 1);
  assert.equal(logic.compute(Object.assign({}, preset('just-the-rate'), { cf1: 107000 })).sign, -1);
});

// ── discount.js (rules 1-4) ──

test('rule 2: the discount factor is 1 / (1 + r)^t', () => {
  near(D.factor(0.08, 1), 1 / 1.08);
  near(D.factor(0.08, 5), 0.6805831970337531);
  near(D.factor(0.08, 10), 0.46319348808468447);
  near(D.factor(0.15, 5), 0.4971767352982897);
});

test('rule 2: today is not discounted, nor anything at 0 %', () => {
  for (const r of [0, 0.08, 0.2]) assert.equal(D.factor(r, 0), 1);
  for (let t = 0; t <= 10; t++) assert.equal(D.factor(0, t), 1);
});

test('rule 2: a euro later is worth less, the more so the later and the dearer the money', () => {
  for (let t = 1; t <= 10; t++) assert.ok(D.factor(0.08, t) < D.factor(0.08, t - 1), `year ${t} below year ${t - 1}`);
  assert.ok(D.factor(0.15, 3) < D.factor(0.08, 3));
});

test('rule 3: present value keeps the sign and shrinks the size', () => {
  near(D.presentValue(100000, 0.08, 5), 68058.31970337531, 1e-6);
  near(D.presentValue(-35000, 0.08, 1), -32407.407407407405, 1e-6);
  const rows = D.table([-120000, 35000, 0], 0.08);
  assert.deepEqual(rows.map((r) => r.t), [0, 1, 2]);
  assert.equal(rows[0].pv, -120000);
  assert.ok(rows[1].pv > 0 && rows[1].pv < 35000);
  assert.equal(rows[2].pv, 0);
});

test('rule 4: NPV sums the discounted flows; at 0 % it is the nominal sum', () => {
  near(D.npv([-120000, 35000, 35000, 35000, 35000, 35000], 0.08), 19744.85129773297, 1e-6);
  assert.equal(D.npv([-120000, 35000, 35000, 35000, 35000, 35000], 0), 55000);
  assert.equal(D.npv([], 0.08), 0);
});

// ── the page model ──

test('rule 4: flows after the horizon are kept but ignored', () => {
  const base = P(flows([-100000, 108000]));
  const withLate = Object.assign({}, base, { years: 1, cf5: 200000 });
  const s = logic.compute(withLate);
  assert.equal(s.rows.length, 2);
  assert.equal(s.nominal, 8000);
  assert.equal(s.npvR, 0);
  assert.equal(s.p.cf5, 200000, 'kept in the params');
});

test('rule 7: a euro at the end of the horizon', () => {
  near(logic.compute(P({ rate: 8, years: 5 })).euroLater, 0.6805831970337531);
  near(logic.compute(P({ rate: 15, years: 5 })).euroLater, 0.4971767352982897);
  assert.equal(logic.compute(P({ rate: 0, years: 10 })).euroLater, 1);
});

test('presets give the numbers in SPEC.md', () => {
  const want = {
    'euro-later': [100000, 68058, 1],
    'upgrade': [55000, 19745, 1],
    'dear-money': [55000, -2675, -1],
    'just-the-rate': [8000, 0, 0],
    'late-payoff': [50000, 13651, 1],
    'early-payoff': [50000, 25911, 1]
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  for (const [id, [nominal, npv, sign]] of Object.entries(want)) {
    const s = logic.compute(preset(id));
    assert.equal(s.nominal, nominal, `${id} nominal`);
    assert.equal(s.npvR, npv, `${id} NPV`);
    assert.equal(s.sign, sign, `${id} sign`);
  }
});

test('upgrade: NPV changes sign between 14 % and 14.5 %', () => {
  assert.equal(logic.compute(Object.assign({}, preset('upgrade'), { rate: 14 })).sign, 1);
  assert.equal(logic.compute(Object.assign({}, preset('upgrade'), { rate: 14.5 })).sign, -1);
});

test('rule 9: mirror reverses years 1…n, keeps year 0, the horizon and the nominal sum', () => {
  const late = preset('late-payoff');
  const patch = logic.mirror(late);
  assert.deepEqual(patch, { cf1: 50000, cf2: 40000, cf3: 30000, cf4: 20000, cf5: 10000 });
  const after = Object.assign({}, late, patch);
  assert.deepEqual(logic.flowsOf(logic.normalise(after)), logic.flowsOf(logic.normalise(preset('early-payoff'))));
  assert.equal(logic.compute(after).nominal, logic.compute(late).nominal);
  assert.notEqual(logic.compute(after).npvR, logic.compute(late).npvR);
  // years after the horizon are not touched; mirroring twice is the identity
  const short = P(Object.assign(flows([-1000, 1000, 2000, 3000, 4000]), { years: 2 }));
  assert.deepEqual(logic.mirror(short), { cf1: 2000, cf2: 1000 });
  const back = Object.assign({}, late, patch, logic.mirror(after));
  assert.deepEqual(logic.normalise(back), logic.normalise(late));
});

test('rule 8: the sign flip is marked, other changes are not', () => {
  const a = logic.compute(preset('upgrade'));
  const b = logic.compute(preset('dear-money'));
  const c = logic.compute(Object.assign({}, preset('upgrade'), { rate: 9 }));
  assert.deepEqual(logic.flipped(a, b), ['sign']);
  assert.deepEqual(logic.flipped(a, c), []);
  assert.deepEqual(logic.flipped(null, a), []);
});

test('captions: verdict and notes', () => {
  assert.deepEqual(logic.captionKey(logic.compute(preset('upgrade'))), { key: 'capPos', notes: [] });
  assert.deepEqual(logic.captionKey(logic.compute(preset('dear-money'))), { key: 'capNeg', notes: ['nTimeAte'] });
  assert.deepEqual(logic.captionKey(logic.compute(Object.assign({}, preset('upgrade'), { rate: 0 }))), { key: 'capPos', notes: ['nRateZero'] });
  assert.deepEqual(logic.captionKey(logic.compute(P(flows([])))), { key: 'capEmpty', notes: [] });
  // negative on paper and negative today: no "time ate" note
  assert.deepEqual(logic.captionKey(logic.compute(P(flows([-100000, 10000])))), { key: 'capNeg', notes: [] });
});

test('normalise: clamps, snaps and repairs what a URL may carry', () => {
  const p = logic.normalise({ rate: 33, years: 0, cf0: -999999, cf1: 1234, cf2: 'x', cf3: -400 });
  assert.equal(p.rate, 20);
  assert.equal(p.years, 1);
  assert.equal(p.cf0, logic.CF_MIN);
  assert.equal(p.cf1, 1000);
  assert.equal(p.cf2, 0);
  assert.ok(Object.is(p.cf3, 0), '-400 snaps to +0');
  assert.equal(logic.normalise({ rate: 7.3 }).rate, 7.5);
  assert.equal(logic.normalise({ rate: 'x', years: 'y' }).rate, logic.defaults.rate);
  assert.equal(logic.normalise({ rate: 'x', years: 'y' }).years, logic.defaults.years);
});

test('captions: no "time ate" note when the sum on paper is zero', () => {
  assert.deepEqual(logic.captionKey(logic.compute(P(flows([-100000, 100000])))), { key: 'capNeg', notes: [] });
});

test('empty means no flow inside the horizon', () => {
  assert.equal(logic.compute(P(flows([0, 1000]))).empty, false);
  assert.equal(logic.compute(P(Object.assign(flows([0, 0, 0, 5000]), { years: 2 }))).empty, true);
  assert.equal(logic.compute(P(flows([-1000]))).empty, false);
});

test('lost: what discounting took off the sum on paper, negative when an outflow comes late', () => {
  near(logic.compute(preset('upgrade')).lost, 55000 - 19744.85129773297, 1e-6);
  assert.ok(logic.compute(P(flows([100000, 0, -100000]))).lost < 0);
});

test('table: the PVs add up to the NPV (no rounded factor inside)', () => {
  const list = [-120000, 35000, 35000, 35000, 35000, 35000];
  const sum = D.table(list, 0.08).reduce((a, r) => a + r.pv, 0);
  near(sum, D.npv(list, 0.08), 1e-6);
  near(D.table([0, 0, 0, 100000], 0.15)[3].pv, 100000 / Math.pow(1.15, 3), 1e-9);
});

test('normalise: the other bounds clamp too', () => {
  const p = logic.normalise({ rate: -5, years: 99, cf4: 999999 });
  assert.equal(p.rate, 0);
  assert.equal(p.years, logic.MAX_YEARS);
  assert.equal(p.cf4, logic.CF_MAX);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('late-payoff'));
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

/** Preset id → string key: euro-later → pEuroLater. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
