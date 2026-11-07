// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-indexation-fx. Run: node --test sims/fin-indexation-fx/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then indexation.js (promotable with it), then the page
// model and the presets, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const M = require('./indexation.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);
const clause = (s, id) => s.clauses.find((c) => c.id === id);
const round = (xs) => xs.map(M.roundMoney);

// ── tie-breaks ──

test('rule 5 tie-break: inflation equal to the cap or the floor passes; only beyond a bound is it held', () => {
  assert.deepEqual(M.adjust(3, 3, 0), { rate: 3, held: null });
  assert.deepEqual(M.adjust(0, 3, 0), { rate: 0, held: null });
  assert.deepEqual(M.adjust(3.5, 3, 0), { rate: 3, held: 'cap' });
  assert.deepEqual(M.adjust(-0.5, 3, 0), { rate: 0, held: 'floor' });
  // the spike path 3, 9, 6, 3 under a 3 % cap: held at the second and third anniversaries, not the first and fourth
  const c = clause(S({ infl: 'spike' }), 'capped');
  assert.deepEqual(c.rows.map((r) => r.held), [null, null, 'cap', 'cap', null]);
  assert.equal(c.heldCap, 2);
});

test('rule 5 tie-break: a floor above the cap is lowered to the cap', () => {
  assert.deepEqual(M.adjust(2, 1, 2), { rate: 1, held: 'cap' });
  assert.deepEqual(M.adjust(0.5, 1, 2), { rate: 1, held: 'floor' }, 'below the lowered floor: held by the floor');
  assert.deepEqual(M.adjust(1, 1, 2), { rate: 1, held: null }, 'equal to both');
  const s = S({ cap: 1, floor: 2 });
  assert.equal(s.floorUsed, 1);
  // steady 2 %: every rise held at 1 %
  assert.deepEqual(clause(s, 'capped').rows.map((r) => r.held), [null, 'cap', 'cap', 'cap', 'cap']);
  near(clause(s, 'capped').rows[4].factor, Math.pow(1.01, 4));
});

test('rule 9 tie-break: every clause at the lowest rounded total is ticked, none when all three are equal', () => {
  // cap 0 and floor 0 freeze the capped price; premium 0 makes the fixed price the same
  const s = S({ premium: 0, cap: 0, floor: 0 });
  assert.equal(clause(s, 'fixed').nominalR, 500000);
  assert.equal(clause(s, 'capped').nominalR, 500000);
  assert.deepEqual(s.best.nominal, ['fixed', 'capped']);
  assert.deepEqual(s.best.real, ['fixed', 'capped']);
  // the default: indexed and capped tie on the real total (the cap never holds 2 %), fixed is 4 € dearer
  assert.deepEqual(S({}).best.real, ['indexed', 'capped']);
  assert.deepEqual(S({}).best.nominal, ['fixed']);
  // all three equal: no tick
  assert.deepEqual(logic.cheapest([{ id: 'a', x: 1 }, { id: 'b', x: 1 }, { id: 'c', x: 1 }], 'x'), []);
  assert.deepEqual(logic.cheapest([{ id: 'a', x: 2 }, { id: 'b', x: 1 }, { id: 'c', x: 1 }], 'x'), ['b', 'c']);
});

test('rule 9 tie-break: totals are compared rounded to the euro', () => {
  const list = [{ id: 'a', v: 100.4 }, { id: 'b', v: 99.6 }, { id: 'c', v: 120 }]
    .map((x) => ({ id: x.id, r: M.roundMoney(x.v) }));
  assert.deepEqual(logic.cheapest(list, 'r'), ['a', 'b']);
  assert.equal(M.roundMoney(-0.4), 0);
  assert.ok(Object.is(M.roundMoney(-0.4), 0), 'never −0');
  assert.equal(M.roundMoney(2.5), 3);
  assert.equal(M.roundMoney(-2.5), -3);
});

// ── indexation.js ──

test('rule 2: the price level compounds the past years\' inflation; the payment at signing is at 1', () => {
  const l = M.priceLevel([2, 2, 2, 2], 5);
  assert.equal(l.length, 5);
  assert.equal(l[0], 1);
  near(l[1], 1.02);
  near(l[4], Math.pow(1.02, 4));
  const low = M.priceLevel([1, 0, -1, 1], 5);
  near(low[3], 1.01 * 0.99);
  assert.ok(low[3] < 1, 'falling prices take the level below signing');
});

test('rule 3: a fixed price is the price at signing plus the premium, every year', () => {
  const f = M.factors('fixed', [3, 9, 6, 3], 5, { premium: 4 });
  assert.deepEqual(f.factor, [1.04, 1.04, 1.04, 1.04, 1.04]);
  assert.deepEqual(f.held, [null, null, null, null, null]);
  assert.deepEqual(M.factors('fixed', [3, 9, 6, 3], 5, { premium: 0 }).factor, [1, 1, 1, 1, 1]);
});

test('rule 4: a fully indexed price follows the price level exactly, falls included', () => {
  for (const infl of [[2, 2, 2, 2], [3, 9, 6, 3], [1, 0, -1, 1]]) {
    const f = M.factors('indexed', infl, 5, {}).factor;
    const l = M.priceLevel(infl, 5);
    f.forEach((x, y) => near(x, l[y], 1e-12));
  }
  const low = M.factors('indexed', [1, 0, -1, 1], 5, {}).factor;
  assert.ok(low[3] < low[2], 'indexation works both ways');
});

test('rule 5: a capped price compounds the clamped rates; the premium does not apply', () => {
  const f = M.factors('capped', [3, 9, 6, 3], 5, { cap: 3, floor: 0, premium: 10 });
  near(f.factor[4], Math.pow(1.03, 4));
  const g = M.factors('capped', [1, 0, -1, 1], 5, { cap: 3, floor: 0 });
  assert.deepEqual(g.held, [null, null, null, 'floor', null]);
  near(g.factor[3], 1.01);
  near(g.factor[4], 1.01 * 1.01);
  const neg = M.factors('capped', [1, 0, -1, 1], 5, { cap: 3, floor: -0.5 });
  near(neg.factor[3], 1.01 * 0.995);
});

test('rules 6-7: nominal = price in the contract currency × the rate; real = nominal ÷ the price level', () => {
  const c = M.contract({ clause: 'indexed', inflation: [2, 2, 2, 2], years: 5, base: 125000, fx: [0.8, 0.84, 0.88, 0.92, 0.96] });
  c.rows.forEach((r) => {
    near(r.nominal, r.price * r.fx);
    near(r.real, r.nominal / r.level);
  });
  near(c.rows[1].real, 105000, 1e-6);
  near(c.real, 550000, 1e-6);
  near(c.nominal, c.rows.reduce((a, r) => a + r.nominal, 0));
});

test('rule 8: the exchange-rate effect is the nominal total against every payment at the signing rate', () => {
  const o = { clause: 'fixed', inflation: [2, 2, 2, 2], years: 5, base: 125000, premium: 4 };
  const weak = M.contract(Object.assign({ fx: [0.8, 0.84, 0.88, 0.92, 0.96] }, o));
  const flat = M.contract(Object.assign({ fx: [0.8, 0.8, 0.8, 0.8, 0.8] }, o));
  near(weak.fxEffect, weak.nominal - flat.nominal);
  near(weak.fxEffect, 52000, 1e-6);
  assert.equal(flat.fxEffect, 0);
});

// ── the page model ──

test('the swings path: 0.80, 0.90, 0.76, 0.92, 0.82 € per USD', () => {
  const s = S({ cur: 'usd', fx: 'swings' });
  assert.deepEqual(round(s.chosen.rows.map((r) => r.nominal)), [104000, 117000, 98800, 119600, 106600]);
  assert.equal(M.roundMoney(s.chosen.fxEffect), 26000);
  assert.deepEqual([clause(s, 'indexed').nominalR, clause(s, 'indexed').realR], [546576, 525000]);
});

test('rule 1: a euro contract starts at 100 000 €; a dollar contract at the same euros, 125 000 USD', () => {
  const e = S({ clause: 'indexed' }), u = S({ clause: 'indexed', cur: 'usd' });
  assert.equal(e.chosen.rows[0].nominal, 100000);
  assert.equal(u.chosen.rows[0].price, 125000);
  assert.equal(u.chosen.rows[0].nominal, 100000);
  assert.deepEqual(e.fx, [1, 1, 1, 1, 1], 'a euro contract has no exchange rate');
  assert.deepEqual(S({ fx: 'swings' }).fx, [1, 1, 1, 1, 1], 'the rate path matters only in dollars');
  assert.equal(e.signing, 500000);
});

test('presets: the expected numbers in SPEC.md', () => {
  const table = {
    'fixed-steady': { fixed: [520000, 500004], indexed: [520404, 500000], capped: [520404, 500000] },
    'indexed-spike': { fixed: [520000, 469840], indexed: [556853, 500000], capped: [530914, 478137] },
    'capped-spike': { fixed: [520000, 469840], indexed: [556853, 500000], capped: [530914, 478137] },
    'floor-low': { fixed: [520000, 516932], indexed: [502980, 500000], capped: [505010, 502020] },
    'usd-euro-weak': { fixed: [572000, 549014], indexed: [573475, 550000], capped: [573475, 550000] },
    'usd-euro-strong': { fixed: [484900, 439762], indexed: [517347, 466250], capped: [494098, 446641] }
  };
  for (const [id, exp] of Object.entries(table)) {
    const s = logic.compute(preset(id));
    for (const c of s.clauses) assert.deepEqual([c.nominalR, c.realR], exp[c.id], `${id} ${c.id}`);
  }
  assert.deepEqual(round(clause(S({}), 'fixed').rows.map((r) => r.real)), [104000, 101961, 99962, 98002, 96080]);
  assert.deepEqual(round(clause(logic.compute(preset('capped-spike')), 'capped').rows.map((r) => r.nominal)), [100000, 103000, 106090, 109273, 112551]);
  assert.deepEqual(round(logic.compute(preset('usd-euro-weak')).chosen.rows.map((r) => r.nominal)), [104000, 109200, 114400, 119600, 124800]);
  assert.equal(M.roundMoney(logic.compute(preset('capped-spike')).vsIndexed), -25939);
  assert.equal(M.roundMoney(logic.compute(preset('floor-low')).vsIndexed), 2030);
  assert.equal(M.roundMoney(logic.compute(preset('usd-euro-weak')).chosen.fxEffect), 52000);
  assert.equal(M.roundMoney(logic.compute(preset('usd-euro-strong')).chosen.fxEffect), -35100);
  assert.deepEqual(logic.compute(preset('floor-low')).best.real, ['indexed']);
  assert.deepEqual(logic.compute(preset('indexed-spike')).best.real, ['fixed']);
});

test('rule 10: the caption notes follow the clause, then the currency', () => {
  const k = (id) => logic.captionKey(logic.compute(preset(id))).notes;
  assert.deepEqual(k('fixed-steady'), ['nFixedDearer'], 'fixed 500 004 € against indexed 500 000 € in real terms');
  assert.deepEqual(k('indexed-spike'), ['nIndexed']);
  assert.deepEqual(k('capped-spike'), ['nCap']);
  assert.deepEqual(k('floor-low'), ['nFloor']);
  assert.deepEqual(k('usd-euro-weak'), ['nFixedUsd', 'nFxUp']);
  assert.deepEqual(k('usd-euro-strong'), ['nFixedUsd', 'nFxDown']);
  const n = (over) => logic.captionKey(S(over)).notes;
  assert.deepEqual(n({ clause: 'capped' }), ['nNoBound']);
  assert.deepEqual(n({ clause: 'capped', infl: 'low', cap: 0.5 }), ['nCapFloor'], 'the 1 % rises held at 0.5 %, the −1 % at 0');
  assert.deepEqual(n({ clause: 'indexed', cur: 'usd' }), ['nIndexedUsd', 'nFxNone']);
  // fixed in euros: dearer than indexation in real terms only when the premium outweighs inflation; equal is not dearer
  assert.deepEqual(n({ premium: 3 }), ['nFixed']);
  assert.deepEqual(n({ infl: 'spike' }), ['nFixed']);
  assert.deepEqual(n({ infl: 'low' }), ['nFixedDearer']);
  const tie = { p: { cur: 'eur' }, chosen: { id: 'fixed', rows: [] }, clauses: [{ realR: 500000 }, { realR: 500000 }] };
  assert.deepEqual(logic.captionKey(tie).notes, ['nFixed'], 'a tie is not dearer');
  // fixed in dollars on a flat rate: the euros do not move, so no "runs from … to …"
  assert.deepEqual(n({ cur: 'usd', fx: 'flat' }), ['nFixedUsdFlat', 'nFxNone']);
  assert.deepEqual(n({ cur: 'usd', fx: 'swings' }), ['nFixedUsd', 'nFxUp']);
  assert.equal(logic.captionKey(S({})).key, 'capMain');
});

test('normalise: choices from their lists, numbers clamped and snapped, junk takes the default', () => {
  const p = logic.normalise({ clause: 'leased', cur: 'gbp', infl: 'hyper', fx: '', premium: 99, cap: -4, floor: '2.3' });
  assert.deepEqual(p, { clause: 'fixed', cur: 'eur', infl: 'steady', fx: 'flat', premium: 15, cap: 0, floor: 2.5 });
  assert.equal(logic.normalise({ premium: ' ' }).premium, 4, 'whitespace is not 0');
  assert.equal(logic.normalise({ premium: null }).premium, 4);
  assert.equal(logic.normalise({ cap: true }).cap, 3);
  assert.equal(logic.normalise({ floor: -9 }).floor, -3);
  assert.ok(Object.is(logic.normalise({ floor: -0 }).floor, 0));
  assert.equal(logic.normalise({ clause: 'capped' }).clause, 'capped');
});

test('premium, cap and floor change only the clause they belong to', () => {
  const a = S({}), b = S({ premium: 10, cap: 1, floor: -2 });
  assert.equal(clause(b, 'indexed').nominal, clause(a, 'indexed').nominal);
  assert.notEqual(clause(b, 'fixed').nominal, clause(a, 'fixed').nominal);
  assert.notEqual(clause(b, 'capped').nominal, clause(a, 'capped').nominal);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('usd-euro-strong'));
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
  const ids = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8')).entries.map((e) => e.preset);
  for (const id of ids) assert.ok(logic.presets.some((x) => x.id === id), `entry ${id} is a preset`);
});

/** Preset id → string key: fixed-steady → pFixedSteady. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
