// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-ale-risk. Run: node --test sims/fin-ale-risk/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the risk module's rules (promotable with it),
// then the page model, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const M = require('./risk.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const R = (id, s) => s.risks.find((x) => x.id === id);
const G = { ded: 10000, load: 150 };
/** One risk for M.treat: loss, frequency in hundredths, kind, treatment and the control's numbers. */
const risk = (o) => Object.assign({ sle: 500000, f100: 5, kind: 'sle', t: 'accept', cost: 15000, eff: 80, avoid: 80000 }, o);
/** Every other risk out of the register. */
const ONLY = (id) => Object.fromEntries(logic.RISKS.filter((x) => x !== id).map((x) => [x + 'L', 0]));

// ── tie-breaks ──

test('rule 1a: a control that removes exactly its cost is break-even, not worth it; one euro more is worth it', () => {
  // ransom: ALE 25 000, kept 5 000 → removes 20 000
  assert.deepEqual(['removed', 'net', 'verdict'].map((k) => M.treat(risk({ t: 'reduce', cost: 20000 }), G)[k]), [20000, 0, 'even']);
  assert.equal(M.treat(risk({ t: 'reduce', cost: 19999 }), G).verdict, 'worth');
  assert.equal(M.treat(risk({ t: 'reduce', cost: 20001 }), G).verdict, 'not');
  // the same for avoidance: gives up exactly the ALE
  assert.equal(M.treat(risk({ t: 'avoid', avoid: 25000 }), G).verdict, 'even');
  assert.equal(M.treat(risk({ t: 'avoid', avoid: 24999 }), G).verdict, 'worth');
  // accept has no verdict
  assert.equal(M.treat(risk({ t: 'accept' }), G).verdict, 'none');
  // the page: break-even preset; captions call it not worth it, the result "even"
  const s = S(preset('break-even'));
  assert.equal(R('ransom', s).verdict, 'even');
  assert.equal(s.outcome, 'even');
  assert.deepEqual(logic.captionKey(s), { key: 'capEven', notes: ['nNotWorth'] });
});

test('rule 1b: a loss at or below the deductible is all kept; the insurer pays nothing', () => {
  const at = M.treat(risk({ sle: 10000, f100: 100, t: 'transfer' }), G);
  assert.deepEqual([at.res, at.cost, at.per, at.removed], [10000, 0, 10000, 0]);
  assert.equal(M.premium(10000, 100, 10000, 150), 0);
  assert.equal(M.premium(11000, 100, 10000, 150), 1500);   // one euro … one thousand above: covered
  const s = S({ laptopT: 'transfer', risk: 'laptop' });   // 2 000 € laptop under a 10 000 € deductible
  assert.equal(R('laptop', s).belowDed, true);
  assert.ok(logic.captionKey(s).notes.includes('nBelowDed'));
  assert.ok(!logic.captionKey(s).notes.includes('nInsure'));
  const eq = S({ laptopT: 'transfer', ded: 2000 });          // equal to the loss: still no cover
  assert.equal(R('laptop', eq).belowDed, true);
  assert.equal(R('laptop', S({ laptopT: 'transfer', ded: 1000 })).belowDed, false);
});

test('rule 1c: Poisson inversion: u equal to F(k) counts k + 1', () => {
  const lam = 0.5, F0 = Math.exp(-lam);
  assert.equal(M.poisson(0, lam), 0);
  assert.equal(M.poisson(F0 - 1e-12, lam), 0);
  assert.equal(M.poisson(F0, lam), 1);                       // exactly F(0): one event
  const F1 = F0 + F0 * lam;
  assert.equal(M.poisson(F1, lam), 2);
  assert.equal(M.poisson(0.999999, 0), 0);                   // rate 0: never
  assert.equal(M.poisson(0.5, 4), 4);                        // median of Poisson(4) is 4 (F(3) = 0.433, F(4) = 0.629)
});

test('rule 1d: the worst year is the first of equal largest years', () => {
  assert.deepEqual(M.summary([0, 5, 2, 5, 1], 0), { avg: 3, worst: 5, at: 1, hit: 4 });
  assert.deepEqual(M.summary([0, 0, 0], 0), { avg: 0, worst: 0, at: 0, hit: 0 });
  assert.deepEqual(M.summary([0, 3, 3], 10), { avg: 12, worst: 13, at: 1, hit: 2 });   // the fixed cost added, not a "loss"
});

test('rule 1e: expected amounts round once, halves up', () => {
  assert.equal(M.hup(5, 2), 3);        // 2.5 → 3
  assert.equal(M.hup(7, 2), 4);        // 3.5 → 4
  assert.equal(M.hup(49, 100), 0);
  assert.equal(M.hup(50, 100), 1);
  // 1 000 € once in 100 years, a frequency control removing 95 %: 1 000 × 0.01 × 0.05 = 0.5 → 1
  assert.equal(M.treat(risk({ sle: 1000, f100: 1, kind: 'aro', t: 'reduce', eff: 95, cost: 0 }), G).res, 1);
  // a frequency control removing 85 % of 1 000 € × 0.01 = 1.5 → 2
  assert.equal(M.treat(risk({ sle: 1000, f100: 1, kind: 'aro', t: 'reduce', eff: 85, cost: 0 }), G).res, 2);
  // the average of the simulated years: 5 ÷ 2 = 2.5 → 3
  assert.equal(M.summary([2, 3], 0).avg, 3);
  // the worst year as a multiple of ALE, in tenths: 592 000 ÷ 88 000 = 6.727 → 67
  assert.equal(S({}).times, 67);
});

test('rule 1f: choices that save exactly nothing are "even"; nothing treated is "none"', () => {
  assert.equal(S({}).outcome, 'none');
  assert.equal(S(preset('break-even')).outcome, 'even');
  assert.equal(S(preset('controls')).outcome, 'save');
  assert.equal(S(preset('insure')).outcome, 'cost');
  assert.equal(logic.captionKey(S({})).key, 'capNone');
  assert.equal(logic.captionKey(S(preset('controls'))).key, 'capSave');
  assert.equal(logic.captionKey(S(preset('insure'))).key, 'capCost');
});

// ── the risk module ──

test('rng: the same stream as the kit\'s Simdeck.rng', () => {
  const a = M.rng(7), b = kit.rng(7);
  for (let i = 0; i < 50; i++) assert.equal(a(), b());
});

test('rule 2: ALE = SLE × ARO', () => {
  assert.equal(M.ale(500000, 5), 25000);
  assert.equal(M.ale(2000, 400), 8000);
  assert.equal(M.ale(1000000, 1), 10000);
  assert.equal(M.ale(50000, 50), 25000);
  for (const id of logic.RISKS) {
    const s = S({});
    const x = R(id, s);
    assert.equal(x.ale, Math.round(s.p[id + 'L'] * s.p[id + 'F']), id);
  }
});

test('rule 3: a risk with loss 0 is out of the register: nothing counts, no events', () => {
  const s = S({ ransomL: 0, ransomT: 'reduce' });
  const x = R('ransom', s);
  assert.deepEqual([x.t, x.ale, x.res, x.cost, x.verdict], ['off', 0, 0, 0, 'none']);
  assert.equal(s.tot.ale, 88000 - 25000);
  const empty = S(Object.assign(ONLY('ransom'), { ransomL: 0 }));
  assert.equal(empty.empty, true);
  assert.deepEqual([empty.before.worst, empty.after.worst, empty.tot.ale], [0, 0, 0]);
  assert.equal(logic.captionKey(empty).key, 'capEmpty');
});

test('rule 3: a risk out of the register still takes its random number', () => {
  // taking laptop out must not change the other risks' years: compare the fraud-only years
  const a = S(ONLY('fraud'));   // fraud is risk 1: it keeps the 2nd number of each year's five
  const r = M.rng(1), alone = [];
  for (let y = 0; y < 100; y++) {
    let v;
    for (let i = 0; i < 5; i++) { const u = r(); if (i === 1) v = u; }
    alone.push(M.poisson(v, 0.5) * 50000);
  }
  assert.deepEqual(a.years.u, alone);
});

test('rule 4: the four treatments: loss kept and yearly cost', () => {
  const acc = M.treat(risk({}), G);
  assert.deepEqual([acc.ale, acc.res, acc.cost, acc.t], [25000, 25000, 0, 'accept']);
  const sle = M.treat(risk({ t: 'reduce' }), G);
  assert.deepEqual([sle.res, sle.cost, sle.per, sle.f], [5000, 15000, 100000, 0.05]);
  const aro = M.treat(risk({ t: 'reduce', kind: 'aro' }), G);
  assert.deepEqual([aro.res, aro.cost, aro.per], [5000, 15000, 500000]);
  assert.ok(Math.abs(aro.f - 0.01) < 1e-12);
  const tr = M.treat(risk({ t: 'transfer' }), G);
  // premium = 0.05 × (500 000 − 10 000) × 150 % = 36 750; kept 10 000 × 0.05 = 500
  assert.deepEqual([tr.res, tr.cost, tr.per, tr.removed, tr.net], [500, 36750, 10000, 24500, -12250]);
  const av = M.treat(risk({ t: 'avoid' }), G);
  assert.deepEqual([av.res, av.cost, av.f, av.per], [0, 80000, 0, 0]);
  // an unknown treatment is accept
  assert.equal(M.treat(risk({ t: 'pray' }), G).t, 'accept');
});

test('rule 4: with a load above 100 % insurance always costs more than the ALE it removes', () => {
  for (const sle of [20000, 200000, 1000000]) {
    for (const f100 of [1, 10, 400]) {
      const x = M.treat(risk({ sle, f100, t: 'transfer' }), G);
      assert.ok(x.cost > x.removed, `${sle} ${f100}`);
    }
  }
  const fair = M.treat(risk({ t: 'transfer' }), { ded: 10000, load: 100 });
  assert.equal(fair.net, 0);
});

test('rule 5: totals and the saving', () => {
  const s = S(preset('controls'));
  assert.deepEqual(s.tot, { ale: 88000, res: 12500, cost: 52000, exp: 64500, save: 23500 });
  const sum = (k) => s.risks.reduce((a, x) => a + x[k], 0);
  assert.equal(s.tot.res, sum('res'));
  assert.equal(s.tot.cost, sum('cost'));
});

test('rule 6: year y takes the (5y + i)-th number; the same u for untreated and treated', () => {
  const s = S(preset('controls'));
  const r = M.rng(1);
  for (let y = 0; y < 100; y++) {
    let u0 = 0, k = 0;
    for (const x of s.risks) {
      const u = r();
      u0 += M.poisson(u, x.f0) * x.sle;
      k += M.poisson(u, x.f) * x.per;
    }
    assert.equal(s.years.u[y], u0, `year ${y}`);
    assert.equal(s.years.k[y], k, `year ${y}`);
  }
});

test('rule 6: a frequency control never adds an event (monotone inversion)', () => {
  for (let i = 0; i < 2000; i++) {
    const u = i / 2000;
    for (const lam of [0.05, 0.5, 4, 12]) {
      assert.ok(M.poisson(u, lam * 0.1) <= M.poisson(u, lam));
      assert.ok(M.poisson(u, lam) <= M.poisson(u, lam * 2));
    }
  }
  const s = S({ fraudT: 'reduce', outageT: 'reduce', portalT: 'reduce', years: 1000 });
  s.years.u.forEach((u, y) => assert.ok(s.years.k[y] <= u, `year ${y}`));
});

test('rule 6: the counts follow Poisson: many years average near the ALE', () => {
  const s = S({ years: 1000 });
  assert.ok(Math.abs(s.before.avg - s.tot.ale) < 0.1 * s.tot.ale);
  for (let seed = 1; seed <= 3; seed++) {
    const r = M.rng(seed);
    let n = 0;
    for (let i = 0; i < 20000; i++) n += M.poisson(r(), 0.5);
    assert.ok(Math.abs(n / 20000 - 0.5) < 0.02);
  }
});

test('rule 7: a year with the choices: the fixed cost every year plus the losses kept', () => {
  const s = S(preset('controls'));
  assert.equal(s.years.fixed, 52000);
  assert.equal(s.after.worst, Math.max(...s.years.k) + 52000);
  // avoided: never an event; a loss control keeps a share of each loss
  const av = S(Object.assign(ONLY('portal'), { portalT: 'avoid' }));
  assert.ok(av.years.k.every((x) => x === 0));
  assert.ok(av.years.u.some((x) => x > 0));
  const red = S(Object.assign(ONLY('ransom'), { ransomT: 'reduce', ransomF: 1, years: 1000 }));
  red.years.u.forEach((u, y) => assert.equal(red.years.k[y], u / 5));   // 80 % off each loss
  const ins = S(Object.assign(ONLY('ransom'), { ransomT: 'transfer', ransomF: 1 }));
  ins.years.u.forEach((u, y) => assert.equal(ins.years.k[y], u / 50));   // 10 000 of each 500 000 kept
});

test('rule 8: averages, worst years and years with a loss', () => {
  const s = S(preset('controls'));
  assert.deepEqual(s.before, { avg: 86280, worst: 592000, at: 81, hit: 100 });
  assert.deepEqual(s.after, { avg: 64440, worst: 178000, at: 21, hit: 99 });
  const r = S(preset('rare'));
  assert.equal(r.quiet, 98);
  assert.ok(logic.captionKey(r).notes.includes('nQuiet'));
  assert.ok(!logic.captionKey(S({})).notes.includes('nQuiet'));
});

test('rule 9: the axis reaches every column and both lines, on a nice step', () => {
  for (const x of logic.presets) {
    for (const years of logic.YEARS) {
      const s = S(Object.assign({}, x.params, { years }));
      const top = Math.max(s.before.worst, s.after.worst, s.tot.ale, s.tot.exp);
      assert.ok(s.axis.hi >= top, x.id);
      assert.ok(s.axis.hi - s.axis.step < top, x.id + ' no empty step on top');
      assert.ok(s.axis.step >= top / 4 - 1e-9, x.id);
      assert.equal(s.axis.ticks[0], 0);
      assert.equal(s.axis.ticks[s.axis.ticks.length - 1], s.axis.hi);
    }
  }
  assert.deepEqual(logic.axis(592000), { hi: 600000, step: 200000, ticks: [0, 200000, 400000, 600000] });
  assert.deepEqual(logic.axis(1).hi, 1);
  assert.equal(M.niceStep(1000, 4), 250);
  assert.equal(M.niceStep(1001, 4), 500);
});

test('rule 10: the changed mark follows the outcome', () => {
  const a = S({}), b = S(preset('controls')), c = S(preset('insure')), d = S(preset('break-even'));
  assert.deepEqual(logic.flipped(a, b), ['outcome']);
  assert.deepEqual(logic.flipped(b, c), ['outcome']);
  assert.deepEqual(logic.flipped(c, d), ['outcome']);
  assert.deepEqual(logic.flipped(b, S(Object.assign({}, preset('controls'), { laptopC: 2500 }))), []);
  assert.deepEqual(logic.flipped(null, a), []);
});

test('presets give the SPEC numbers', () => {
  const rows = {
    register: [88000, 88000, 0, 86280, 592000, 100, 86280, 592000, 100, 1024000, 1024000],
    controls: [88000, 12500, 52000, 86280, 592000, 100, 64440, 178000, 99, 1024000, 257000],
    insure: [88000, 44500, 65250, 86280, 592000, 100, 109130, 231250, 100, 1024000, 323250],
    rare: [10000, 10000, 0, 20000, 1000000, 2, 20000, 1000000, 2, 1000000, 1000000],
    'break-even': [88000, 68000, 20000, 86280, 592000, 100, 90280, 566000, 100, 1024000, 566000]
  };
  for (const x of logic.presets) {
    const s = S(x.params), k = S(Object.assign({}, x.params, { years: 1000 }));
    assert.deepEqual([s.tot.ale, s.tot.res, s.tot.cost, s.before.avg, s.before.worst, s.before.hit,
      s.after.avg, s.after.worst, s.after.hit, k.before.worst, k.after.worst], rows[x.id], x.id);
  }
  const per = (id, p) => R(id, S(preset(p)));
  assert.deepEqual(['laptop', 'fraud', 'ransom', 'outage', 'portal'].map((id) => [per(id, 'controls').net, per(id, 'controls').verdict]),
    [[2000, 'worth'], [19500, 'worth'], [5000, 'worth'], [-11000, 'not'], [8000, 'worth']]);
  assert.deepEqual([per('ransom', 'insure').cost, per('portal', 'insure').cost], [36750, 28500]);
  assert.equal(S(preset('rare')).p.ransomL, 1000000);
});

test('Run again on the rare preset: some centuries see nothing, some two ruinous years', () => {
  const hits = [1, 2, 3, 4, 5].map((seed) => S(Object.assign({}, preset('rare'), { seed })).before.hit);
  assert.deepEqual(hits, [2, 0, 2, 1, 1]);
  assert.equal(logic.nextSeed(1), 2);
  assert.equal(logic.nextSeed(logic.SEED_MAX), 1);
});

test('captions: which notes go with which state', () => {
  assert.deepEqual(logic.captionKey(S({})), { key: 'capNone', notes: [] });
  assert.deepEqual(logic.captionKey(S(preset('controls'))), { key: 'capSave', notes: ['nNotWorth'] });
  assert.deepEqual(logic.captionKey(S(preset('insure'))), { key: 'capCost', notes: ['nInsure'] });
  assert.deepEqual(logic.captionKey(S(preset('rare'))), { key: 'capNone', notes: ['nQuiet'] });
  // a reduce that is worth it brings no note; transfer and avoid never bring nNotWorth
  assert.deepEqual(logic.captionKey(S({ ransomT: 'reduce' })).notes, []);
  assert.deepEqual(logic.captionKey(S({ outageT: 'avoid' })).notes, []);
  // exactly half the years quiet is enough for nQuiet
  const half = { quiet: 50, p: { years: 100 }, risks: [], none: true, outcome: 'none', before: { worst: 1, hit: 1 } };
  assert.deepEqual(logic.captionKey(half).notes, ['nQuiet']);
  assert.deepEqual(logic.captionKey(Object.assign({}, half, { quiet: 49 })).notes, []);
});

test('normalise clamps, snaps and defaults', () => {
  const d = logic.defaults;
  const n = logic.normalise({
    ransomC: 123456, ransomE: 7, ransomA: -5, ded: 1499, load: 55, seed: 0, years: 50, risk: 'moon',
    ransomL: 123, ransomF: 0.3, ransomT: 'pray', laptopL: '20000', laptopF: '0.5', laptopT: 'avoid'
  });
  assert.deepEqual([n.ransomC, n.ransomE, n.ransomA, n.ded, n.load, n.seed], [100000, 5, 0, 1000, 100, 1]);
  assert.deepEqual([n.years, n.risk, n.ransomL, n.ransomF, n.ransomT], [d.years, d.risk, d.ransomL, d.ransomF, d.ransomT]);
  assert.deepEqual([n.laptopL, n.laptopF, n.laptopT], [20000, 0.5, 'avoid']);
  for (const bad of [NaN, Infinity, '', ' ', true, null, {}, [], 'abc']) {
    const m = logic.normalise({ ransomC: bad, ransomL: bad, years: bad });
    assert.deepEqual([m.ransomC, m.ransomL, m.years], [d.ransomC, d.ransomL, d.years], String(bad));
  }
  assert.equal(logic.normalise({ seed: 1e9 }).seed, logic.SEED_MAX);
});

test('the constants', () => {
  assert.deepEqual(logic.RISKS, ['laptop', 'fraud', 'ransom', 'outage', 'portal']);
  assert.deepEqual(logic.TREAT, ['accept', 'reduce', 'transfer', 'avoid']);
  assert.deepEqual(logic.YEARS, [100, 1000]);
  assert.equal(logic.SEED_MAX, 999999);
  assert.deepEqual(logic.KIND, { laptop: 'sle', fraud: 'aro', ransom: 'sle', outage: 'aro', portal: 'aro' });
  assert.deepEqual(logic.LOSS, [0, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000]);
  assert.deepEqual(logic.FREQ, [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 4, 12]);
  assert.deepEqual([logic.defaults.ded, logic.defaults.load, logic.defaults.years, logic.defaults.seed], [10000, 150, 100, 1]);
});

test('the defaults are the register preset; every preset sits inside the ranges', () => {
  assert.deepEqual(logic.defaults, preset('register'));
  for (const x of logic.presets) assert.deepEqual(logic.normalise(x.params), x.params, x.id);
});

test('review gaps: below the deductible nothing is paid and no more than the loss is kept', () => {
  assert.equal(M.premium(5000, 100, 10000, 150), 0);
  const x = M.treat(risk({ sle: 5000, f100: 100, t: 'transfer' }), G);
  assert.deepEqual([x.per, x.res, x.cost, x.removed, x.verdict], [5000, 5000, 0, 0, 'even']);
  assert.equal(R('laptop', S({ laptopT: 'transfer' })).keep, 2000);
});

test('review gaps: Poisson counts beyond ten events a year', () => {
  assert.ok(M.poisson(0.999999, 12) > 20);
  const s = S(Object.assign(ONLY('laptop'), { laptopF: 12 }));
  assert.ok(Math.max(...s.years.u) / 2000 > 15);
});

test('review gaps: times rounds halves up; quiet counts the untreated years', () => {
  const s = S(Object.assign(ONLY('laptop'), { laptopF: 1 }));   // ALE 2 000: worst 2 000 k, ratio 10 k exactly
  assert.equal(s.times, 10 * s.before.worst / 2000);
  const odd = S(Object.assign(ONLY('laptop'), { laptopL: 5000, laptopF: 4, seed: 5 }));   // ALE 20 000, worst 45 000
  assert.deepEqual([odd.tot.ale, odd.before.worst, odd.times], [20000, 45000, 23]);   // 22.5 → 23
  const av = S(Object.assign({}, preset('rare'), { ransomT: 'avoid' }));
  assert.deepEqual([av.before.hit, av.after.hit, av.quiet], [2, 0, 98]);
});

test('review gaps: the axis also holds an empty untreated column and a taller treated one', () => {
  for (const over of [{ seed: 2 }, { seed: 2, ransomT: 'avoid' }, { seed: 2, ransomT: 'reduce', ransomC: 100000 }]) {
    const s = S(Object.assign({}, preset('rare'), over));
    assert.ok(s.axis.hi >= Math.max(s.before.worst, s.after.worst, s.tot.ale, s.tot.exp), JSON.stringify(over));
  }
  const tall = S(Object.assign({}, preset('rare'), { seed: 2, ransomT: 'avoid' }));
  assert.equal(tall.before.worst, 0);
  assert.equal(tall.axis.hi, 200000);
  // dear insurance on a frequent loss: the treated worst year is above the untreated one and above both lines
  const dear = S(Object.assign(ONLY('laptop'), { laptopL: 20000, laptopF: 12, laptopT: 'transfer', load: 300, ded: 5000 }));
  assert.deepEqual([dear.before.worst, dear.after.worst, dear.tot.exp, dear.axis.hi], [440000, 650000, 600000, 800000]);
  assert.ok(dear.after.worst > Math.max(dear.before.worst, dear.tot.ale, dear.tot.exp));
  assert.ok(dear.axis.hi >= dear.after.worst);
  const noLoss = S(Object.assign({}, preset('rare'), { seed: 2 }));
  assert.equal(noLoss.axis.hi, 10000);
  assert.deepEqual(logic.captionKey(noLoss), { key: 'capNoLoss', notes: [] });
});

test('review gaps: note order, the empty caption, insurance verdicts and the fair premium', () => {
  const both = S(Object.assign({}, preset('insure'), { laptopT: 'transfer', outageT: 'reduce' }));
  assert.deepEqual(logic.captionKey(both).notes, ['nNotWorth', 'nInsure', 'nBelowDed']);
  const empty = S(Object.assign(ONLY('ransom'), { ransomL: 0 }));
  assert.deepEqual(logic.captionKey(empty), { key: 'capEmpty', notes: [] });
  const ins = S(preset('insure'));
  assert.deepEqual([R('ransom', ins).verdict, R('portal', ins).verdict], ['not', 'not']);
  const fair = S(Object.assign({}, preset('insure'), { load: 100 }));   // premium = expected payout: break-even, no nInsure
  assert.equal(R('ransom', fair).verdict, 'even');
  assert.ok(!logic.captionKey(fair).notes.includes('nInsure'));
  assert.equal(preset('controls').risk, 'outage');
  for (const id of ['register', 'insure', 'rare', 'break-even']) assert.equal(preset(id).risk, 'ransom');
});

test('review gaps: normalise rounds to the nearest step; the ranges', () => {
  assert.equal(logic.normalise({ ded: 1500 }).ded, 2000);
  assert.equal(logic.normalise({ ransomC: 1249 }).ransomC, 1000);
  assert.equal(logic.normalise({ ransomC: 1250 }).ransomC, 1500);
  const r = { ded: [0, 100000, 1000], load: [100, 300, 10], seed: [1, 999999, 1] };
  for (const id of logic.RISKS) Object.assign(r, { [id + 'C']: [0, 100000, 500], [id + 'E']: [0, 100, 5], [id + 'A']: [0, 200000, 1000] });
  assert.deepEqual(logic.RANGES, r);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('controls'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset, risk and treatment has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  for (const lang of ['hr', 'en']) {
    for (const id of logic.RISKS) {
      for (const k of ['r_', 'ctrl_', 'avoid_']) assert.ok(strings[lang][k + id], `${lang} ${k}${id}`);
    }
    for (const tr of logic.TREAT) assert.ok(strings[lang]['t_' + tr], `${lang} t_${tr}`);
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: break-even → pBreakEven. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
