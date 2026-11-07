// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-contingency-reserve. Run: node --test sims/fin-contingency-reserve/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the reserve module's rules (promotable with it),
// then the page model, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const M = require('./reserve.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
/** Every line flat at v € (no range), so every trial total is 5 v. */
const FLAT = (v) => Object.fromEntries(logic.LINES.flatMap((id) => [[id, v], [id + 'D', 0], [id + 'U', 0]]));

// ── tie-breaks ──

test('rule 1a: a total equal to the base is enough', () => {
  assert.equal(M.atOrBelow([1, 2, 2, 2, 3], 2), 4);
  assert.equal(M.atOrBelow([1, 2, 2, 2, 3], 1), 1);
  assert.equal(M.atOrBelow([1, 2, 3], 0), 0);
  assert.equal(M.atOrBelow([1, 2, 3], 3), 3);
  // no ranges: every total is the base, and the base is enough in every trial
  const s = S(FLAT(10000));
  assert.equal(s.base, 50000);
  assert.equal(s.enough, s.n);
  assert.equal(s.enoughTenths, 1000);
});

test('rule 1b: a budget equal to the base is covered; below it too', () => {
  const s = S(Object.assign(FLAT(10000), { conf: 95 }));
  assert.deepEqual([s.at.budget, s.at.reserve, s.covered], [50000, 0, true]);
  assert.equal(logic.captionKey(s).key, 'capCovered');
  const sym = S(preset('symmetric'));
  assert.deepEqual([sym.at.q, sym.at.budget, sym.at.reserve, sym.covered], [50, 59998, -2, true]);
  const one = S(Object.assign(FLAT(10000), { hwU: 5, conf: 95 }));   // one line may only rise: a reserve
  assert.ok(one.at.reserve > 0);
  assert.equal(one.covered, false);
  assert.equal(logic.captionKey(one).key, 'capReserve');
});

test('rule 1c: nearest rank: the ceil(q n / 100)-th smallest total', () => {
  const ten = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  assert.equal(M.level(ten, 50), 50);    // 5th
  assert.equal(M.level(ten, 80), 80);    // 8th
  assert.equal(M.level(ten, 95), 100);   // ceil(9.5) = 10th
  assert.equal(M.level(ten, 70), 70);
  assert.equal(M.level([1, 2, 3], 50), 2);   // ceil(1.5) = 2nd
  assert.equal(M.level([1, 2, 3], 0), 1);    // never below the first
  const hundred = Array.from({ length: 100 }, (_, i) => i + 1);
  for (const q of logic.CONF) assert.equal(M.level(hundred, q), q);
});

test('rule 1d: a total on a bin edge goes to the upper bin; the axis end to the last bin', () => {
  // totals 0 … 4 000 on a 0–4 000 axis (step 1 000), 4 bins of 1 000
  const h = M.histogram([0, 999, 1000, 2000, 3999, 4000], 1000, 2000, 4);
  assert.deepEqual([h.lo, h.hi, h.step], [0, 4000, 1000]);
  assert.deepEqual(h.bins.map((b) => b.in + b.res + b.over), [2, 1, 1, 2]);
  // within the base (≤ 1 000), reserve (≤ 2 000), over
  assert.deepEqual(h.bins[0], { in: 2, res: 0, over: 0 });
  assert.deepEqual(h.bins[1], { in: 1, res: 0, over: 0 });
  assert.deepEqual(h.bins[2], { in: 0, res: 1, over: 0 });
  assert.deepEqual(h.bins[3], { in: 0, res: 0, over: 2 });
});

test('rule 1e: halves round up: averages, trial totals, shares', () => {
  // averages: (lo + ml + hi) / 3 rounded once; 1 + 1 + 2 = 4 → 1.33 → 1; 1 + 2 + 2 = 5 → 1.67 → 2; 3 halves
  assert.equal(M.meanSum([{ lo: 1, ml: 1, hi: 2 }]), 1);
  assert.equal(M.meanSum([{ lo: 1, ml: 2, hi: 2 }]), 2);
  assert.equal(M.meanSum([{ lo: 0, ml: 0, hi: 1 }, { lo: 0, ml: 0, hi: 1 }, { lo: 0, ml: 0, hi: 0.5 }]), 1);   // 2.5 / 3 → 0.83
  assert.equal(M.meanSum([{ lo: 0, ml: 0, hi: 1.5 }]), 1);   // 0.5 → 1
  // a trial total of x.5 € rounds up: a flat line at 0.5 €
  assert.deepEqual(M.trials([{ lo: 0.5, ml: 0.5, hi: 0.5 }], 2, 1), [1, 1]);
  assert.deepEqual(M.trials([{ lo: 0.49, ml: 0.49, hi: 0.49 }], 1, 1), [0]);
  assert.equal(M.tenths(1, 2000), 1);      // 0.05 % → 0.1 %
  assert.equal(M.tenths(1, 2001), 0);
  assert.equal(M.pct(1, 200), 1);          // 0.5 % → 1 %
  assert.equal(M.pct(-1, 200), -1);        // away from zero
  assert.equal(M.pct(-1, 201), 0);
  assert.equal(M.pct(5, 0), null);
  assert.equal(M.tenths(5, 0), null);
});

// ── the reserve module (promotable with it) ──

test('rng: the same stream as the kit\'s Simdeck.rng', () => {
  for (const seed of [1, 2, 42, 999999]) {
    const a = M.rng(seed), b = kit.rng(seed);
    for (let i = 0; i < 20; i++) assert.equal(a(), b());
  }
});

test('rule 2: a line\'s low and high from its most likely value and the fall and rise in per cent', () => {
  assert.deepEqual(M.line(8000, 15, 100), { lo: 6800, ml: 8000, hi: 16000 });
  assert.deepEqual(M.line(500, 5, 5), { lo: 475, ml: 500, hi: 525 });
  assert.deepEqual(M.line(0, 50, 200), { lo: 0, ml: 0, hi: 0 });
  assert.deepEqual(S(preset('project')).lines.map((l) => [l.lo, l.ml, l.hi, l.mean]),
    [[19000, 20000, 23000, 20667], [13500, 15000, 21000, 16500], [10800, 12000, 15600, 12800],
      [6800, 8000, 16000, 10267], [4250, 5000, 7000, 5417]]);
});

test('rule 3: the triangular draw: ends, the mode, both sides, and a zero-width range', () => {
  const l = { lo: 0, ml: 25, hi: 100 };            // the mode's share is 0.25
  assert.equal(M.draw(l, 0), 0);
  assert.equal(M.draw(l, 0.25), 25);                // u at the mode's share: the mode (right side's formula)
  assert.equal(M.draw(l, 0.04), 10);                // left: √(0.04 × 100 × 25) = 10
  assert.ok(Math.abs(M.draw(l, 2 / 3) - 50) < 1e-9);  // right: 100 − √(1/3 × 100 × 75) = 100 − 50
  assert.ok(Math.abs(M.draw(l, 0.24) - Math.sqrt(0.24 * 100 * 25)) < 1e-9);   // just below the mode: left side
  assert.equal(M.draw({ lo: 7, ml: 7, hi: 7 }, 0.9), 7);
  // mode at the low end: only the right side
  assert.equal(M.draw({ lo: 0, ml: 0, hi: 100 }, 0), 0);
  assert.equal(M.draw({ lo: 0, ml: 0, hi: 100 }, 0.75), 50);   // 100 − √(0.25 × 100 × 100)
  // mode at the high end: only the left side
  assert.equal(M.draw({ lo: 0, ml: 100, hi: 100 }, 0.25), 50); // √(0.25 × 100 × 100)
  // the draw stays inside the range and rises with u
  let last = -1;
  for (let i = 0; i < 100; i++) {
    const x = M.draw({ lo: 6800, ml: 8000, hi: 16000 }, i / 100);
    assert.ok(x >= 6800 && x <= 16000 && x >= last);
    last = x;
  }
});

test('rule 3: the draws follow the triangle: share below the mode and the average', () => {
  const l = M.line(8000, 15, 100);                 // 6 800 / 8 000 / 16 000: 1 200 ÷ 9 200 below the mode
  const r = M.rng(7);
  let below = 0, sum = 0;
  const n = 20000;
  for (let i = 0; i < n; i++) { const x = M.draw(l, r()); if (x < l.ml) below++; sum += x; }
  assert.ok(Math.abs(below / n - 1200 / 9200) < 0.01);
  assert.ok(Math.abs(sum / n - (6800 + 8000 + 16000) / 3) < 40);
});

test('rule 4: trial t draws line i with the (5t + i)-th number of the stream; totals sorted', () => {
  const lines = logic.LINES.map((id) => M.line(preset('project')[id], preset('project')[id + 'D'], preset('project')[id + 'U']));
  const r = M.rng(3), want = [];
  for (let t = 0; t < 50; t++) {
    let s = 0;
    for (const l of lines) s += M.draw(l, r());
    want.push(Math.floor(s + 0.5));
  }
  want.sort((a, b) => a - b);
  assert.deepEqual(M.trials(lines, 50, 3), want);
  // a different order of the lines draws differently: the order is part of the rule
  assert.notDeepEqual(M.trials(lines.slice().reverse(), 50, 3), want);
  // sorted numerically, not as text
  const big = M.trials([{ lo: 5, ml: 50, hi: 500 }], 200, 1);
  for (let i = 1; i < big.length; i++) assert.ok(big[i - 1] <= big[i]);
});

test('rule 5: the budget, the reserve and its share of the base', () => {
  const s = S(preset('project'));
  assert.deepEqual(s.levels.map((l) => [l.q, l.budget, l.reserve, l.pct]),
    [[50, 65443, 5443, 9], [70, 67150, 7150, 12], [80, 68199, 8199, 14], [90, 69648, 9648, 16], [95, 70916, 10916, 18]]);
  assert.equal(s.at.q, 80);
  assert.equal(s.p50, 65443);
});

test('rule 6: the share of trials the base is enough in, in tenths of a per cent', () => {
  const s = S(preset('project'));
  assert.deepEqual([s.enough, s.n, s.enoughTenths], [150, 10000, 15]);
  assert.equal(M.tenths(5003, 10000), 500);
  assert.equal(M.tenths(1, 100), 10);
});

test('rule 7: each average is above its most likely value when the range rises further than it falls; P50 near Σ averages', () => {
  const s = S(preset('project'));
  for (const l of s.lines) assert.ok(l.mean > l.ml, l.id);
  assert.equal(s.mean, 65650);
  assert.ok(s.p50 > s.base);
  assert.ok(Math.abs(s.p50 - s.mean) < 0.01 * s.mean);
  const sym = S(preset('symmetric'));
  assert.equal(sym.mean, sym.base);
  assert.equal(sym.symmetric, true);
  assert.ok(Math.abs(sym.p50 - sym.base) < 0.005 * sym.base);
  // a range that falls further than it rises: the average below the most likely value, P50 below the base
  const down = S(Object.fromEntries(logic.LINES.flatMap((id) => [[id + 'D', 40], [id + 'U', 10]])));
  assert.ok(down.mean < down.base && down.p50 < down.base);
  assert.equal(down.covered, true);
});

test('rule 8: shares of the base: none when the base is 0', () => {
  const s = S(FLAT(0));
  assert.equal(s.base, 0);
  assert.ok(s.levels.every((l) => l.pct === null && l.reserve === 0));
  assert.equal(s.covered, true);
  assert.equal(s.enoughTenths, 1000);
});

test('rule 9: the axis on nice steps covers the base and every total; the bins hold every trial', () => {
  assert.deepEqual([1, 4, 9, 10, 11, 25000, 3000, 7000].map((x) => M.niceStep(x, 4)), [0.25, 1, 2.5, 2.5, 5, 10000, 1000, 2000]);
  for (const x of logic.presets) {
    const s = S(x.params);
    const h = s.hist;
    assert.equal(h.bins.length, logic.BINS);
    assert.equal(h.bins.reduce((a, b) => a + b.in + b.res + b.over, 0), s.n, x.id);
    assert.equal(h.bins.reduce((a, b) => a + b.in, 0), s.enough, x.id);
    assert.equal(h.bins.reduce((a, b) => a + b.in + b.res, 0), Math.max(s.enough, M.atOrBelow(M.trials(
      s.lines, s.n, s.p.seed), s.at.budget)), x.id);
    assert.ok(h.lo <= s.base && h.hi >= s.base, x.id);
    assert.equal(h.lo % h.step, 0);
    assert.equal(h.hi % h.step, 0);
    assert.equal(h.ticks[0], h.lo);
    assert.equal(h.ticks[h.ticks.length - 1], h.hi);
  }
  assert.deepEqual(S(preset('project')).hist.ticks, [55000, 60000, 65000, 70000, 75000, 80000]);
  // the base below every total still sits on the axis
  const h = M.histogram([700, 800], 100, 800, 4);
  assert.ok(h.lo <= 100 && h.hi >= 800);
  // one value only: the axis still has a width
  const one = M.histogram([500, 500], 500, 500, 4);
  assert.ok(one.hi > one.lo);
  assert.equal(one.bins.reduce((a, b) => a + b.in, 0), 2);
});

test('rule 10: the changed mark follows covered ↔ needs a reserve', () => {
  const a = S(preset('project'));
  assert.deepEqual(logic.flipped(null, a), []);
  assert.deepEqual(logic.flipped(a, S(Object.assign({}, preset('project'), { conf: 95 }))), []);
  assert.deepEqual(logic.flipped(S(preset('symmetric')), S(Object.assign({}, preset('symmetric'), { conf: 70 }))), ['outcome']);
  assert.deepEqual(logic.flipped(a, S(FLAT(1000))), ['outcome']);
});

// ── the page model ──

test('presets give the SPEC numbers', () => {
  const want = {
    project: [60000, 65650, 54350, 82600, 150, [65443, 67150, 68199, 69648, 70916], 8199, 14],
    symmetric: [60000, 60000, 51000, 69000, 5003, [59998, 60965, 61551, 62336, 62999], -2, 0],
    'one-wild': [60000, 65933, 56600, 81200, 186, [65234, 67927, 69589, 71781, 73228], 9589, 16],
    'few-trials': [60000, 65650, 54350, 82600, 1, [64781, 66923, 67717, 69219, 70387], 7717, 13],
    'spend-cap': [12500, 13667, 11500, 17000, 101, [13631, 13954, 14153, 14436, 14677], 2177, 17]
  };
  for (const x of logic.presets) {
    const s = S(x.params), w = want[x.id];
    assert.deepEqual([s.base, s.mean, s.low, s.high, s.enough, s.levels.map((l) => l.budget), s.at.reserve, s.at.pct], w, x.id);
  }
  assert.equal(preset('one-wild').line, 'mig');
  assert.ok(S(preset('spend-cap')).levels[4].budget < 15000);
});

test('more trials make the levels steadier, not cheaper', () => {
  const p80 = (trials) => [1, 2, 3, 4, 5].map((seed) => S({ trials, seed }).at.budget);
  const spread = (v) => Math.max(...v) - Math.min(...v);
  assert.deepEqual(p80(100), [67717, 67662, 67803, 69125, 67576]);
  assert.ok(spread(p80(100)) > 1000);
  assert.ok(spread(p80(10000)) < 200);
});

test('the levels rise with the confidence, and each step up costs more per point near the top', () => {
  for (const x of logic.presets) {
    const b = S(x.params).levels.map((l) => l.budget);
    for (let i = 1; i < b.length; i++) assert.ok(b[i] >= b[i - 1], x.id);
  }
  const b = S(preset('project')).levels.map((l) => l.budget);
  assert.ok((b[4] - b[3]) / 5 > (b[2] - b[1]) / 10);   // 90 → 95 costs more per point than 70 → 80
});

test('Σ high is far above P95: budgeting for the worst case', () => {
  const s = S(preset('project'));
  assert.ok(s.high > s.levels[4].budget + 10000);
  assert.ok(s.low < s.hist.lo + s.hist.step);
});

test('captions: which notes go with which state', () => {
  assert.deepEqual(logic.captionKey(S(preset('project'))), { key: 'capReserve', notes: ['nSkew'] });
  assert.deepEqual(logic.captionKey(S(preset('symmetric'))), { key: 'capCovered', notes: ['nSymmetric'] });
  assert.deepEqual(logic.captionKey(S(preset('few-trials'))), { key: 'capReserve', notes: ['nSkew', 'nFew'] });
  assert.deepEqual(logic.captionKey(S(Object.assign({}, preset('symmetric'), { conf: 80 }))), { key: 'capReserve', notes: ['nSymmetric'] });
  assert.deepEqual(logic.captionKey(S(Object.assign(FLAT(1000), { trials: 100 }))), { key: 'capCovered', notes: ['nSymmetric', 'nFew'] });
  // falling further than rising: no skew note
  const down = S(Object.fromEntries(logic.LINES.flatMap((id) => [[id + 'D', 40], [id + 'U', 10]])));
  assert.deepEqual(logic.captionKey(down).notes, []);
  // one symmetric line among skewed ones is not "every line symmetric"
  assert.equal(S(Object.assign({}, preset('project'), { hwD: 15, hwU: 15 })).symmetric, false);
});

test('normalise clamps, snaps and defaults', () => {
  const d = logic.defaults;
  const n = logic.normalise;
  assert.equal(n({ hw: 120000 }).hw, 100000);
  assert.equal(n({ hw: -5 }).hw, 0);
  assert.equal(n({ hw: 1240 }).hw, 1000);
  assert.equal(n({ hw: 1250 }).hw, 1500);
  assert.equal(n({ migD: 7 }).migD, 5);
  assert.equal(n({ migD: 80 }).migD, 50);
  assert.equal(n({ migU: 999 }).migU, 200);
  assert.equal(n({ migU: 13 }).migU, 15);
  assert.equal(n({ seed: 0 }).seed, 1);
  assert.equal(n({ seed: 2e6 }).seed, logic.SEED_MAX);
  assert.equal(n({ seed: 4.4 }).seed, 4);
  assert.equal(n({ conf: 85 }).conf, d.conf);
  assert.equal(n({ conf: '95' }).conf, 95);
  assert.equal(n({ conf: true }).conf, d.conf);
  assert.equal(n({ conf: ' ' }).conf, d.conf);
  assert.equal(n({ trials: 500 }).trials, d.trials);
  assert.equal(n({ trials: '100' }).trials, 100);
  assert.equal(n({ trials: 1e9 }).trials, d.trials);
  assert.equal(n({ line: 'mig' }).line, 'mig');
  assert.equal(n({ line: 'nope' }).line, d.line);
  assert.equal(n({ line: 3 }).line, d.line);
  assert.equal(n({ staff: Infinity }).staff, d.staff);
  assert.equal(n({ staff: '' }).staff, d.staff);
  assert.equal(n({ staff: null }).staff, d.staff);
  assert.equal(n({ staff: true }).staff, d.staff);
  assert.equal(n({ staff: [] }).staff, d.staff);
  assert.equal(n({ staff: 'abc' }).staff, d.staff);
  assert.equal(n({ staff: ' 2500 ' }).staff, 2500);
  // after snapping, every low and high is whole euros
  for (const ml of [500, 1500, 99500]) {
    for (let p = 0; p <= 200; p += 5) {
      const l = M.line(ml, Math.min(p, 50), p);
      assert.ok(Number.isInteger(l.lo) && Number.isInteger(l.hi), `${ml} ${p}`);
    }
  }
});

test('compute normalises whatever it is given', () => {
  const s = logic.compute({ conf: 7, hw: 1e9, trials: 'x', line: {} });
  assert.equal(s.p.conf, 80);
  assert.equal(s.at.q, 80);
  assert.equal(s.lines[0].ml, 100000);
  assert.equal(s.n, 10000);
  assert.equal(s.p.line, 'hw');
  assert.deepEqual(logic.compute({}), logic.compute(logic.defaults));
});

test('the defaults are the project preset', () => {
  assert.deepEqual(logic.defaults, preset('project'));
});

test('every preset sits inside the ranges', () => {
  for (const x of logic.presets) {
    assert.deepEqual(logic.normalise(x.params), Object.assign({}, logic.defaults, x.params), x.id);
  }
});

test('the top of the scale: every line at its maximum', () => {
  const s = S(Object.fromEntries(logic.LINES.flatMap((id) => [[id, 100000], [id + 'D', 50], [id + 'U', 200]])));
  assert.equal(s.base, 500000);
  assert.equal(s.high, 1500000);
  assert.equal(s.top, 300000);
  assert.ok(s.levels.every((l) => Number.isSafeInteger(l.budget)));
});

test('review gaps: nearest rank rounds up, the axis reaches the base, the quarter-span step, the constants', () => {
  assert.equal(M.level([1, 2, 3], 70), 3);                 // ceil(2.1) = 3rd (round would give the 2nd)
  assert.equal(M.level([1, 2, 3, 4, 5, 6, 7], 30), 3);     // ceil(2.1) = 3rd
  assert.ok(M.histogram([700, 800], 900, 800, 4).hi >= 900);   // the base above every total is on the axis
  const h = M.histogram([0, 4000], 0, 4000, 4);            // span 4 000 → step 1 000 (a quarter), not 800 → 1 000 by luck
  assert.equal(h.step, 1000);
  assert.equal(M.histogram([0, 10000], 0, 10000, 4).step, 2500);
  assert.equal(logic.BINS, 40);
  assert.equal(logic.SEED_MAX, 999999);
  assert.deepEqual(logic.CONF, [50, 70, 80, 90, 95]);
  assert.deepEqual(logic.TRIALS, [100, 1000, 10000]);
});

test('review gaps: Run again wraps after the last seed', () => {
  assert.equal(logic.nextSeed(1), 2);
  assert.equal(logic.nextSeed(999998), 999999);
  assert.equal(logic.nextSeed(999999), 1);
});

test('review gaps: caption notes at 1 000 trials and with averages equal to the base', () => {
  assert.deepEqual(logic.captionKey(S({ trials: 1000 })).notes, ['nSkew']);
  // not symmetric, but the averages add up to the base: no skew note
  const even = S(Object.assign(Object.fromEntries(logic.LINES.flatMap((id) => [[id, 10000], [id + 'D', 10], [id + 'U', 10]])),
    { hw: 20000, hwD: 10, hwU: 0, staff: 20000, staffD: 0, staffU: 10 }));
  assert.equal(even.symmetric, false);
  assert.equal(even.mean, even.base);
  assert.deepEqual(logic.captionKey(even).notes, []);
  // a line at 0 € counts as symmetric whatever its fall and rise (SPEC "Captions")
  assert.equal(S(Object.assign({}, preset('symmetric'), { hw: 0, hwD: 5, hwU: 15 })).symmetric, true);
});

test('review gaps: a blank range value takes the default; every line at 0 € still has a scale', () => {
  const d = logic.defaults;
  assert.equal(logic.normalise({ staff: ' ' }).staff, d.staff);
  assert.equal(logic.normalise({ seed: ' ' }).seed, d.seed);
  assert.ok(S(FLAT(0)).top > 0);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('one-wild'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset, line and level has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  for (const lang of ['hr', 'en']) {
    for (const id of logic.LINES) assert.ok(strings[lang]['line_' + id], `${lang} line ${id}`);
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: one-wild → pOneWild. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
