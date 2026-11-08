// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-cost-of-noncompliance. Run: node --test sims/cmp-cost-of-noncompliance/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules in order, the presets, and the template's
// generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const F = require('./fines.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const preset = (id) => logic.presets.find((x) => x.id === id).params;
const S = (id, patch) => logic.compute(Object.assign({}, preset(id), patch || {}));
/** SPEC.md's further checked case (not a preset). */
const FINE_HEAVY = { turn: 100, law: 'ess', p: 30, inc: 100000, q: 50, k: 25, spend: 250000, eff: 50 };
const E = (x) => F.expected(Object.assign({ eff: 50, spend: 0 }, x));

// ── tie-breaks first ──

test('rule 2: equal parts decide "equal", one euro either side decides fixed or pct', () => {
  for (const law of F.LAW_IDS) {
    const c = F.ceiling(law, 500);
    assert.equal(c.pct, c.fixed, law);
    assert.equal(c.decides, 'equal', law);
    assert.equal(c.crossover, 500, law);
  }
  assert.equal(F.ceiling('gdpr', 250).decides, 'fixed');
  assert.equal(F.ceiling('gdpr', 1000).decides, 'pct');
  // the comparison uses strict inequalities: fake a regime one euro off the crossover
  const saved = F.LAWS.ess.fixed;
  try {
    F.LAWS.ess.fixed = 10000001;
    assert.equal(F.ceiling('ess', 500).decides, 'fixed');
    F.LAWS.ess.fixed = 9999999;
    assert.equal(F.ceiling('ess', 500).decides, 'pct');
  } finally { F.LAWS.ess.fixed = saved; }
});

test('rule 6: saving exactly the price is break-even, not worth it; one euro either side flips it', () => {
  const s = S('break-even');
  assert.equal(s.cost.net, 0);
  assert.equal(s.cost.verdict, 'even');
  const base = { p: 10, inc: 250000, q: 20, fine: 5000000 };
  assert.equal(E(Object.assign({}, base, { spend: 99999 })).verdict, 'worth');
  assert.equal(E(Object.assign({}, base, { spend: 100001 })).verdict, 'not');
  assert.equal(E(Object.assign({}, base, { spend: 100000 })).verdict, 'even');
});

test('rule 7: fines part equal to the incidents part does not dominate', () => {
  const x = E({ p: 10, inc: 100000, q: 20, fine: 500000 });
  assert.equal(x.inc0, 10000);
  assert.equal(x.fin0, 10000);
  assert.equal(x.fineDominates, false);
  assert.equal(E({ p: 10, inc: 100000, q: 20, fine: 500025 }).fineDominates, true);   // 10 000.5 → 10 001
});

test('rule 10: a ceiling exactly equal to the turnover is not "more than a year\'s turnover"', () => {
  // 10 M€ turnover under ess: ceiling 10 000 000 = turnover
  const s = logic.compute({ turn: 10, law: 'ess' });
  assert.equal(s.ceiling.ceiling, 10000000);
  assert.equal(s.ceiling.share, 1);
  assert.equal(s.overTurnover, false);
  assert.equal(logic.compute({ turn: 2, law: 'ess' }).overTurnover, true);
  assert.equal(S('tiny-firm').overTurnover, true);
  assert.equal(S('small-fixed').overTurnover, false);
});

test('rule 3/4/5: halves round up, once per part', () => {
  assert.equal(F.hup(5, 2), 3);
  assert.equal(F.hup(3, 2), 2);
  assert.equal(F.hup(7, 4), 2);   // 1.75
  assert.equal(F.hup(5, 4), 1);   // 1.25
  assert.equal(F.fine(7000000, 25), 1750000);
  // p 1, inc 50 → 0.5 € rounds to 1; with eff 50: 0.25 → 0
  const x = E({ p: 1, inc: 50, q: 0, fine: 0 });
  assert.equal(x.inc0, 1);
  assert.equal(x.inc1, 0);
  // fin1 = 1 × 50 × 5 × 2 / 4 000 000 = 0.000125 → 0; 1 × 50 × 100 × 400 / 4 000 000 = 0.5 → 1
  assert.equal(E({ p: 1, inc: 0, q: 100, fine: 400 }).fin1, 1);
});

test('rounding: an exact half rounds up in inc1 and in the fine', () => {
  assert.equal(E({ p: 2, inc: 50, q: 0, fine: 0 }).inc1, 1);   // 2 × 50 × 50 / 10 000 = 0.5
  assert.equal(F.fine(150, 1), 2);                               // 1.5
});

test('rule 2: the crossover follows the regime table', () => {
  const saved = F.LAWS.ess.rate;
  try {
    F.LAWS.ess.rate = 25;
    assert.equal(F.ceiling('ess', 500).crossover, 400);
  } finally { F.LAWS.ess.rate = saved; }
});

// ── rules in order ──

test('rule 1: the three regimes and their legal values', () => {
  assert.deepEqual(F.LAW_IDS, ['gdpr', 'ess', 'imp']);
  assert.deepEqual(F.LAWS.gdpr, { fixed: 20000000, rate: 40 });
  assert.deepEqual(F.LAWS.ess, { fixed: 10000000, rate: 20 });
  assert.deepEqual(F.LAWS.imp, { fixed: 7000000, rate: 14 });
});

test('rule 2: the ceiling is the higher of the fixed sum and the share of turnover', () => {
  const small = F.ceiling('imp', 10);
  assert.equal(small.pct, 140000);
  assert.equal(small.ceiling, 7000000);
  assert.equal(small.decides, 'fixed');
  near(small.share, 0.7);
  const big = F.ceiling('gdpr', 2500);
  assert.equal(big.pct, 100000000);
  assert.equal(big.ceiling, 100000000);
  assert.equal(big.decides, 'pct');
  near(big.share, 0.04);
  // the ceiling never falls below either part, for every option and regime
  for (const law of F.LAW_IDS) {
    for (const T of logic.TURNS) {
      const c = F.ceiling(law, T);
      assert.ok(c.ceiling >= c.fixed && c.ceiling >= c.pct);
      assert.ok(c.ceiling === c.fixed || c.ceiling === c.pct);
      assert.equal(c.decides === 'pct', T > 500, `${law} ${T}`);
    }
  }
});

test('rule 3: the fine is k % of the ceiling', () => {
  assert.equal(F.fine(100000000, 10), 10000000);
  assert.equal(F.fine(20000000, 100), 20000000);
  assert.equal(S('small-fixed', { k: 100 }).fine, 7000000);
  assert.equal(S('small-fixed', { k: 10 }).fine, 700000);
});

test('rule 4: without the measures, likelihood × (incident cost + chance of a fine × fine)', () => {
  const x = E({ p: 20, inc: 250000, q: 40, fine: 1750000 });
  assert.equal(x.inc0, 50000);
  assert.equal(x.fin0, 140000);
  assert.equal(x.e0, 190000);
  assert.equal(E({ p: 20, inc: 250000, q: 0, fine: 1750000 }).fin0, 0);
});

test('rule 5: the measures cut the likelihood by eff and the chance of a fine to a quarter', () => {
  const x = E({ p: 20, inc: 250000, q: 40, fine: 1750000, spend: 100000 });
  assert.equal(x.inc1, 25000);
  assert.equal(x.fin1, 17500);
  assert.equal(x.e1, 42500);
  assert.equal(x.t1, 142500);
  assert.equal(x.p1, 10);
  assert.equal(x.q1, 10);
  const e75 = E({ p: 20, inc: 250000, q: 40, fine: 1750000, eff: 75 });
  assert.equal(e75.inc1, 12500);
  assert.equal(e75.fin1, 8750);
  const e25 = E({ p: 20, inc: 250000, q: 40, fine: 1750000, eff: 25 });
  assert.equal(e25.inc1, 37500);
  assert.equal(e25.fin1, 26250);
});

test('rule 6: saved = e0 − e1, net = saved − price', () => {
  const x = S('small-fixed').cost;
  assert.equal(x.saved, 147500);
  assert.equal(x.net, 47500);
  assert.equal(x.verdict, 'worth');
  const y = S('tiny-firm').cost;
  assert.equal(y.net, -41375);
  assert.equal(y.verdict, 'not');
  // a dearer price never improves the verdict
  assert.equal(S('small-fixed', { spend: 2500000 }).cost.verdict, 'not');
});

test('rule 8: the comparison shows the same turnover and fine share under each regime', () => {
  const s = S('small-fixed');
  assert.deepEqual(s.compare.map((x) => [x.id, x.ceiling, x.decides, x.fine, x.chosen]), [
    ['gdpr', 20000000, 'fixed', 5000000, false],
    ['ess', 10000000, 'fixed', 2500000, false],
    ['imp', 7000000, 'fixed', 1750000, true]
  ]);
  const l = S('large-pct');
  assert.deepEqual(l.compare.map((x) => [x.pct, x.ceiling, x.decides, x.fine]), [
    [100000000, 100000000, 'pct', 10000000],
    [50000000, 50000000, 'pct', 5000000],
    [35000000, 35000000, 'pct', 3500000]
  ]);
  assert.deepEqual(S('crossover').compare.map((x) => x.decides), ['equal', 'equal', 'equal']);
});

test('rule 9: params are normalised', () => {
  const d = logic.defaults;
  assert.deepEqual(logic.normalise({}), d);
  const n = logic.normalise({ turn: '2500', law: 'ess', p: '99', inc: '5000000', q: '37', k: '50', spend: '0', eff: '75' });
  assert.deepEqual(n, { turn: 2500, law: 'ess', p: 60, inc: 5000000, q: 35, k: 50, spend: 0, eff: 75 });
  const bad = logic.normalise({ turn: '0500', law: 'GDPR', p: ' ', inc: 1, q: 'x', k: 30, spend: -1, eff: 0 });
  assert.deepEqual(bad, d);
  assert.equal(logic.normalise({ p: 0 }).p, 1);
  assert.equal(logic.normalise({ p: 2.6 }).p, 3);
  assert.equal(logic.normalise({ p: Infinity }).p, d.p);
  assert.equal(logic.normalise({ q: -10 }).q, 0);
  assert.equal(logic.normalise({ q: 103 }).q, 100);
  assert.equal(logic.normalise({ q: null }).q, d.q);
});

test('rule 9: the option lists and the defaults are pinned', () => {
  assert.deepEqual(logic.TURNS, [2, 10, 50, 100, 250, 500, 1000, 2500]);
  assert.deepEqual(logic.INCS, [50000, 100000, 250000, 500000, 1000000, 2500000, 5000000]);
  assert.deepEqual(logic.SPENDS, [0, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000]);
  assert.deepEqual(logic.KS, [10, 25, 50, 100]);
  assert.deepEqual(logic.EFFS, [25, 50, 75]);
  assert.deepEqual(logic.defaults, preset('small-fixed'));
  assert.deepEqual(logic.normalise({ turn: '5000', k: '75', eff: '100' }), logic.defaults);
  assert.equal(logic.normalise({ q: 38 }).q, 40);
  assert.equal(logic.normalise({ q: 2.5 }).q, 5);
  assert.equal(logic.normalise({ q: 37 }).q, 35);
});

test('rule 10: caption keys and the order of the notes', () => {
  assert.deepEqual(logic.captionKey(S('small-fixed')), { ceiling: 'capFixed', verdict: 'capWorth', notes: ['nFine'] });
  assert.deepEqual(logic.captionKey(S('large-pct')), { ceiling: 'capPct', verdict: 'capWorth', notes: [] });
  assert.deepEqual(logic.captionKey(S('crossover')), { ceiling: 'capEqual', verdict: 'capWorth', notes: [] });
  // duty beats "more than a year's turnover" and "fine dominates"
  assert.deepEqual(logic.captionKey(S('tiny-firm')), { ceiling: 'capFixed', verdict: 'capNot', notes: ['nDutyNis2'] });
  assert.deepEqual(logic.captionKey(S('break-even')), { ceiling: 'capFixed', verdict: 'capEven', notes: ['nDutyGdpr'] });
  // over turnover beats fine dominates when the verdict is worth
  const s = S('tiny-firm', { spend: 0 });
  assert.equal(s.cost.verdict, 'worth');
  assert.equal(s.overTurnover, true);
  assert.deepEqual(logic.captionKey(s).notes, ['nOverTurnover']);
  const fh = S('tiny-firm', { spend: 0, q: 100, p: 60 });
  assert.equal(fh.cost.fineDominates, true);
  assert.deepEqual(logic.captionKey(fh).notes, ['nOverTurnover']);
  assert.deepEqual(logic.captionKey(logic.compute(FINE_HEAVY)).notes, ['nFine']);
});

// ── the presets against SPEC.md ──

test('presets: every number in the SPEC table', () => {
  const want = {
    'small-fixed': [140000, 7000000, 'fixed', 0.7, 1750000, 50000, 140000, 190000, 25000, 17500, 142500, 47500, 'worth'],
    'large-pct': [100000000, 100000000, 'pct', 0.04, 10000000, 250000, 200000, 450000, 125000, 25000, 400000, 50000, 'worth'],
    crossover: [10000000, 10000000, 'equal', 0.02, 1000000, 100000, 20000, 120000, 50000, 2500, 102500, 17500, 'worth'],
    'tiny-firm': [28000, 7000000, 'fixed', 3.5, 700000, 5000, 7000, 12000, 2500, 875, 53375, -41375, 'not'],
    'break-even': [2000000, 20000000, 'fixed', 0.4, 5000000, 25000, 100000, 125000, 12500, 12500, 125000, 0, 'even']
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  for (const [id, w] of Object.entries(want)) {
    const s = S(id), c = s.ceiling, x = s.cost;
    assert.deepEqual([c.pct, c.ceiling, c.decides], w.slice(0, 3), id);
    near(c.share, w[3]);
    assert.deepEqual([s.fine, x.inc0, x.fin0, x.e0, x.inc1, x.fin1, x.t1, x.net, x.verdict], w.slice(4), id);
    assert.deepEqual(logic.normalise(preset(id)), Object.assign({}, preset(id)), `${id} is already normal`);
  }
});

test('the further checked case in SPEC: fine-heavy', () => {
  const s = logic.compute(FINE_HEAVY), c = s.ceiling, x = s.cost;
  assert.deepEqual([c.pct, c.ceiling, c.decides, s.fine], [2000000, 10000000, 'fixed', 2500000]);
  assert.deepEqual([x.inc0, x.fin0, x.e0, x.inc1, x.fin1, x.t1, x.net, x.verdict],
    [30000, 375000, 405000, 15000, 46875, 311875, 93125, 'worth']);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.initial(Object.assign({}, logic.defaults, p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = Object.assign({}, preset('small-fixed'), { p: '7' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset, caption, regime and note has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  const keys = ['capFixed', 'capPct', 'capEqual', 'capWorth', 'capEven', 'capNot', 'nDutyNis2', 'nDutyGdpr',
    'nOverTurnover', 'nFine', 'vWorth', 'vEven', 'vNot'];
  for (const lang of ['hr', 'en']) {
    for (const k of keys) assert.ok(strings[lang][k], `${lang} ${k}`);
    for (const id of F.LAW_IDS) {
      for (const pre of ['law_', 'lawShort_', 'who_']) assert.ok(strings[lang][pre + id], `${lang} ${pre}${id}`);
    }
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

function near(a, b) { assert.ok(Math.abs(a - b) < 1e-12, `${a} ≈ ${b}`); }
/** Preset id → string key: small-fixed → pSmallFixed. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
