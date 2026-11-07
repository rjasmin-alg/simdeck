// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-audit-sampling. Run: node --test sims/cmp-audit-sampling/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the sampling module's rules (promotable with it),
// then the page model, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const M = require('./sampling.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const near = (a, b, eps) => assert.ok(Math.abs(a - b) < (eps || 1e-9), `${a} ≈ ${b}`);
/** C(n, r) as a float, for checking the exact chances independently. */
function comb(n, r) {
  if (r < 0 || r > n) return 0;
  let c = 1;
  for (let i = 0; i < r; i++) c = c * (n - i) / (i + 1);
  return c;
}

// ── tie-breaks ──

test('rule 1: failures round halves up', () => {
  assert.equal(M.failuresOf(250, 1), 3);     // 2.5 → 3
  assert.equal(M.failuresOf(250, 2), 5);
  assert.equal(M.failuresOf(12, 10), 1);     // 1.2 → 1
  assert.equal(M.failuresOf(12, 2), 0);      // 0.24 → 0
  assert.equal(M.failuresOf(4, 12), 0);      // 0.48 → 0
  assert.equal(M.failuresOf(4, 13), 1);      // 0.52 → 1
  assert.equal(M.failuresOf(52, 5), 3);      // 2.6 → 3
  assert.equal(M.failuresOf(1000, 0), 0);
  // the true rate in tenths of a percent, halves up
  assert.deepEqual([S({ rate: 1 }).rate10, S({ freq: 'monthly', rate: 10 }).rate10, S({}).rate10], [12, 83, 20]);
});

test('rule 2: the first m picks do not depend on how many are taken (rate adds failures, n extends samples)', () => {
  const a = M.pick(250, 5, M.rng(9)), b = M.pick(250, 40, M.rng(9));
  assert.deepEqual(b.slice(0, 5), a);
  // a higher rate keeps the failed occurrences of a lower one
  const f2 = M.population(250, 5, 6), f10 = M.population(250, 25, 6);
  for (const i of f2) assert.ok(f10.includes(i), `failed ${i} stays failed`);
  // a larger sample contains the smaller one, sample by sample: a find stays a find
  for (let d = 0; d < 50; d++) {
    const s = M.sample(250, 25, 6, d), t = M.sample(250, 26, 6, d);
    for (const i of s) assert.ok(t.includes(i));
  }
  const small = S({ draws: 300 }), big = S({ draws: 300, n: 26 });
  small.per.forEach((x, d) => assert.ok(big.per[d] >= x, `draw ${d}`));
});

test('rule 4: 0 exceptions pass, exactly 1 extends, 2 or more is a finding', () => {
  assert.deepEqual([0, 1, 2, 3, 25].map(M.conclude), ['pass', 'extend', 'finding', 'finding', 'finding']);
  assert.deepEqual(M.run(4, [0], 4, 1, 1).hist, [0, 1, 0]);        // the whole population, one failed: one exception
  assert.deepEqual(M.run(4, [0, 1], 4, 1, 1).hist, [0, 0, 1]);     // two failed: a finding
});

test('rule 4: the verdict against the truth: caught, missed, right', () => {
  assert.equal(S({}).last.outcome, 'missed');                      // 0 exceptions, 5 failed
  assert.equal(S({ rate: 0 }).last.outcome, 'right');
  assert.equal(S({ n: 250 }).last.outcome, 'caught');              // the whole population
  assert.equal(S({ draws: 0 }).last, null);
});

test('rule 3: exact chances at the edges: n > N − k always finds; k = 0 never; P(2+) is never negative', () => {
  assert.equal(M.chance(250, 5, 246).p0, 0);
  assert.equal(M.chance(250, 5, 245).p0 > 0, true);
  assert.deepEqual(M.chance(250, 0, 25), { p0: 1, p1: 0, p2: 0 });
  assert.deepEqual(M.chance(12, 12, 1), { p0: 0, p1: 1, p2: 0 });
  const one = M.chance(12, 1, 5);
  near(one.p0 + one.p1, 1);
  assert.ok(one.p2 >= 0);
  near(M.chance(12, 1, 12).p1, 1);
  assert.equal(M.chance(12, 1, 12).p0, 0);
  // the size for 95 %: the first n at or above the target
  const n = M.sizeFor(250, 5, 0.95);
  assert.equal(n, 112);
  assert.ok(1 - M.chance(250, 5, n).p0 >= 0.95);
  assert.ok(1 - M.chance(250, 5, n - 1).p0 < 0.95);
  assert.equal(M.sizeFor(250, 0, 0.95), null);
  assert.equal(M.sizeFor(12, 1, 0.95), 12);
  assert.equal(M.sizeFor(4, 4, 0.95), 1);
  // review gaps: +0 not −0 (JSON-safe), P(2+) clamped at 0, n capped at N
  assert.ok(Object.is(M.chance(12, 2, 12).p0, 0));
  assert.equal(M.chance(12, 2, 1).p2, 0);
  assert.deepEqual(M.chance(12, 1, 20), M.chance(12, 1, 12));
  const all = S({ freq: 'monthly', rate: 20, n: 12 });
  assert.deepEqual(JSON.parse(JSON.stringify(all)), all);
});

test('rule 3: shares round to whole percent, halves up', () => {
  assert.equal(logic.pct(0.5), 50);
  assert.equal(logic.pct(0.125), 13);
  assert.equal(logic.pct(0.12499), 12);
  assert.equal(logic.ratio(1, 8), 13);    // 12.5 → 13
  assert.equal(logic.ratio(3, 8), 38);    // 37.5 → 38
  assert.equal(logic.ratio(1, 3), 33);
  assert.equal(logic.ratio(0, 7), 0);
  assert.equal(logic.ratio(7, 7), 100);
});

// ── the sampling module ──

test('rng: the same stream as the kit\'s Simdeck.rng', () => {
  const a = M.rng(7), b = kit.rng(7);
  for (let i = 0; i < 50; i++) assert.equal(a(), b());
});

test('rule 2: streams: population is stream 0, sample d is stream d + 1', () => {
  assert.equal(M.streamSeed(6, 0), (Math.imul(6, 0x9e3779b1) + Math.imul(1, 0x85ebca6b)) >>> 0);
  assert.deepEqual(M.population(250, 5, 6), M.pick(250, 5, M.rng(M.streamSeed(6, 0))).sort((a, b) => a - b));
  assert.deepEqual(M.sample(250, 25, 6, 3), M.pick(250, 25, M.rng(M.streamSeed(6, 4))).sort((a, b) => a - b));
  assert.notDeepEqual(M.sample(250, 25, 6, 0), M.sample(250, 25, 6, 1));
  assert.notDeepEqual(M.population(250, 5, 6), M.population(250, 5, 7));
});

test('rule 2: a pick is without replacement, inside 0…N−1, and at most N long', () => {
  for (const seed of [1, 2, 3]) {
    const s = M.pick(250, 250, M.rng(seed));
    assert.equal(new Set(s).size, 250);
    assert.deepEqual([...s].sort((a, b) => a - b), Array.from({ length: 250 }, (_, i) => i));
  }
  assert.equal(M.pick(12, 40, M.rng(1)).length, 12);
  assert.deepEqual(M.pick(10, 0, M.rng(1)), []);
  // uniform enough: every ticket is drawn about n ÷ N of the time
  const hits = new Array(50).fill(0);
  for (let d = 0; d < 4000; d++) M.sample(50, 5, 3, d).forEach((i) => hits[i]++);
  for (const h of hits) assert.ok(h > 300 && h < 500, String(h));   // expected 400
});

test('rule 3: exact chances equal the combinations; the formula is the large-population approximation', () => {
  for (const [N, k, n] of [[250, 5, 25], [250, 25, 25], [12, 1, 2], [52, 3, 10], [1000, 20, 25], [250, 3, 60]]) {
    const c = M.chance(N, k, n);
    near(c.p0, comb(N - k, n) / comb(N, n), 1e-12);
    near(c.p1, k * comb(N - k, n - 1) / comb(N, n), 1e-12);
    near(c.p2, 1 - c.p0 - c.p1, 1e-12);
    assert.ok(M.formula(k / N, n) <= 1 - c.p0 + 1e-12, `${N} ${k} ${n}: the formula is not above the exact chance`);
  }
  near(M.formula(0.02, 25), 1 - Math.pow(0.98, 25));
  assert.equal(logic.pct(M.formula(0.02, 25)), 40);           // the catalogue's 25 vs 2 %: misses about 60 %
  assert.equal(logic.pct(1 - M.chance(250, 5, 25).p0), 41);
  assert.equal(logic.pct(M.chance(1000, 20, 25).p0), 60);     // 25 of 1000 misses about as often as 25 of 250
});

test('rule 3: the bound after no exceptions', () => {
  near(M.upperBound(25, 0.95), 1 - Math.pow(0.05, 1 / 25));
  assert.equal(logic.pct(M.upperBound(25, 0.95)), 11);
  assert.equal(logic.pct(M.upperBound(112, 0.95)), 3);
  assert.equal(logic.pct(M.upperBound(2, 0.95)), 78);
  assert.ok(M.upperBound(40, 0.95) < M.upperBound(25, 0.95));
});

test('rule 5: the tally counts samples by exceptions; found = one + two or more', () => {
  const r = M.run(250, M.population(250, 5, 6), 25, 200, 6);
  assert.equal(r.per.length, 200);
  assert.deepEqual(r.hist, [0, 1, 2].map((x) => r.per.filter((v) => Math.min(v, 2) === x).length));
  assert.equal(r.hist.reduce((a, b) => a + b, 0), 200);
  assert.equal(r.hits.length, r.per[199]);
  assert.deepEqual(r.last, M.sample(250, 25, 6, 199));
  assert.ok(r.hits.every((i) => r.last.includes(i)));
  const s = S({ draws: 200 });
  assert.equal(s.found, s.hist[1] + s.hist[2]);
  assert.equal(s.foundPct, logic.ratio(s.found, 200));
  assert.deepEqual(s.histPct, s.hist.map((c) => logic.ratio(c, 200)));
  assert.deepEqual(M.run(250, [], 25, 0, 6), { per: [], hist: [0, 0, 0], last: [], hits: [] });
});

test('rule 5: many samples converge to the exact chance', () => {
  for (const over of [{}, { rate: 10 }, { freq: 'weekly', rate: 5, n: 10 }, { freq: 'multi', rate: 2, n: 25 }]) {
    const s = S(Object.assign({ draws: 1000 }, over));
    assert.ok(Math.abs(s.found / 1000 - s.exact.found) < 0.05, JSON.stringify(over));
  }
});

// ── the page model ──

test('rule 6: frequencies, populations and usual samples; the band', () => {
  assert.deepEqual(logic.FREQS, ['quarterly', 'monthly', 'weekly', 'daily', 'multi']);
  assert.deepEqual(logic.FREQS.map((f) => logic.POP[f]), [4, 12, 52, 250, 1000]);
  assert.deepEqual(logic.FREQS.map((f) => logic.USUAL[f]), [[2, 2], [2, 5], [5, 15], [20, 40], [25, 60]]);
  assert.deepEqual([19, 20, 40, 41].map((n) => S({ n }).band), ['below', 'in', 'in', 'above']);
  assert.deepEqual(logic.FREQS.map(logic.nMax), [4, 12, 52, 250, 250]);
  assert.equal(S({ freq: 'monthly', n: 25 }).n, 12);           // clamped to the population
  assert.equal(S({ freq: 'monthly', n: 12 }).all, true);
  assert.equal(S({ n: 249 }).all, false);
});

test('rule 6: normalise clamps, rounds and defaults', () => {
  const d = logic.defaults;
  const n = logic.normalise({ freq: 'hourly', rate: 25, n: 0, draws: 5000, seed: 0, extra: 1 });
  assert.deepEqual(n, { freq: d.freq, rate: 20, n: 1, draws: 1000, seed: 1 });
  assert.deepEqual(logic.normalise({ rate: 2.5, n: 24.5, draws: '7', seed: -3 }), { freq: 'daily', rate: 3, n: 25, draws: 7, seed: 1 });
  assert.equal(logic.normalise({ rate: -0.5 }).rate, 0);
  assert.equal(logic.normalise({ freq: 'multi', n: 900 }).n, 250);
  for (const f of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) assert.equal(logic.normalise({ freq: f }).freq, 'daily', f);
  for (const bad of [NaN, Infinity, -Infinity, '', ' ', true, null, {}, [], 'abc']) {
    const m = logic.normalise({ rate: bad, n: bad, draws: bad, seed: bad });
    assert.deepEqual([m.rate, m.n, m.draws, m.seed], [d.rate, d.n, d.draws, d.seed], String(bad));
  }
});

test('rule 7: captions and notes', () => {
  const key = (over) => logic.captionKey(S(over));
  assert.deepEqual(key({ draws: 0 }), { key: 'capStart', notes: [] });
  assert.deepEqual(key({ draws: 0, rate: 0 }), { key: 'capStartClean', notes: [] });
  assert.deepEqual(key({}), { key: 'capMiss', notes: [] });
  assert.deepEqual(key({ rate: 0 }), { key: 'capClean', notes: [] });
  assert.deepEqual(key(preset('many')), { key: 'capMany', notes: ['nOthers'] });
  assert.deepEqual(key({ rate: 10, n: 250, draws: 100 }), { key: 'capMany', notes: ['nAll'] });   // every sample found one
  assert.deepEqual(key({ freq: 'quarterly', rate: 20, n: 4 }), { key: 'capOneAll', notes: ['nAll'] });
  assert.deepEqual(key({ freq: 'quarterly', rate: 20, n: 1, draws: 100 }).notes, ['nOthers', 'nBelow']);
  assert.deepEqual(key(preset('clean')), { key: 'capManyClean', notes: [] });
  // one sample with one and with two or more exceptions
  const one = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find((seed) => S({ seed }).last.x === 1);
  const two = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find((seed) => S({ seed, rate: 10 }).last.x >= 2);
  assert.equal(key({ seed: one }).key, 'capOne');
  assert.equal(key({ seed: two, rate: 10 }).key, 'capFinding');
  // notes: the whole population (never below the usual range); below the usual range; inside or above none
  assert.deepEqual(key({ n: 19 }).notes, ['nBelow']);
  assert.deepEqual(key({ n: 20 }).notes, []);
  assert.deepEqual(key({ n: 112 }).notes, []);
  assert.deepEqual(key({ n: 250 }).notes, ['nAll']);
  assert.deepEqual(key({ freq: 'quarterly', n: 1 }).notes, ['nBelow']);
  assert.deepEqual(key({ freq: 'quarterly', n: 4 }).notes, ['nAll']);
});

test('presets give the SPEC numbers', () => {
  const rows = {
    'one-sample': [5, [41, 59, 33, 8], 40, 112, 11, [1, 0, 0], 0, 0, 'missed'],
    many: [5, [41, 59, 33, 8], 40, 112, 11, [591, 328, 81], 41, 1, 'caught'],
    clean: [0, [0, 100, 0, 0], 0, null, 11, [1000, 0, 0], 0, 0, 'right'],
    'bad-control': [25, [94, 6, 19, 74], 93, 27, 11, [65, 169, 766], 94, 1, 'caught'],
    sure: [5, [95, 5, 21, 74], 90, 112, 3, [54, 190, 756], 95, 3, 'caught'],
    monthly: [1, [17, 83, 17, 0], 16, 12, 78, [826, 174, 0], 17, 0, 'missed']
  };
  for (const x of logic.presets) {
    const s = S(x.params), e = s.expPct;
    assert.deepEqual([s.k, [e.found, e.p0, e.p1, e.p2], s.formula, s.need, s.bound, s.hist, s.foundPct, s.last.x, s.last.outcome],
      rows[x.id], x.id);
  }
  assert.deepEqual(S({}).failed, [7, 114, 162, 185, 228]);
  assert.deepEqual(S(preset('monthly')).failed, [10]);
});

test('the controls: next seed, more draws', () => {
  assert.equal(logic.nextSeed(6), 7);
  assert.equal(logic.nextSeed(logic.SEED_MAX), 1);
  assert.equal(logic.more(1, 100), 101);
  assert.equal(logic.more(950, 100), 1000);
  assert.equal(logic.more(1000, 1), 1000);
});

test('the defaults are the one-sample preset; every preset sits inside the ranges', () => {
  assert.deepEqual(logic.defaults, preset('one-sample'));
  for (const x of logic.presets) assert.deepEqual(logic.normalise(x.params), x.params, x.id);
  assert.equal(logic.defaults.seed, 6);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('many'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset, frequency, conclusion and caption has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  const caps = ['capStart', 'capStartClean', 'capOne', 'capOneAll', 'capFinding', 'capMiss', 'capClean', 'capMany', 'capManyClean', 'nOthers', 'nAll', 'nBelow', 'c_extendAll'];
  for (const lang of ['hr', 'en']) {
    for (const f of logic.FREQS) for (const k of ['f_', 'item_']) assert.ok(strings[lang][k + f], `${lang} ${k}${f}`);
    for (const v of ['pass', 'extend', 'finding']) assert.ok(strings[lang]['c_' + v], `${lang} c_${v}`);
    for (const v of ['missed', 'right', 'caught']) assert.ok(strings[lang]['o_' + v], `${lang} o_${v}`);
    for (const k of caps) assert.ok(strings[lang][k], `${lang} ${k}`);
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: bad-control → pBadControl. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
