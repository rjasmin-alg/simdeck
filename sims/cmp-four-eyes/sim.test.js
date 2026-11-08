// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-four-eyes. Run: node --test sims/cmp-four-eyes/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules in order (the stream, minutes, depth, look and
// record in approval.js, then the page's model in sim.js), the presets, and the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const M = require('./approval.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg || ''} ${a} vs ${b}`);

// ── tie-breaks first ──

test('rule 5: exactly one minute is a look; just under a minute is a click (0)', () => {
  assert.equal(M.catchP(0.999, true), 0);
  assert.equal(M.catchP(0, true), 0);
  close(M.catchP(1, true), 1 - Math.exp(-1 / 4));
  close(M.catchP(1, false), 0.25 * (1 - Math.exp(-1 / 4)));
});

test('rule 4: depth goes to high-risk first in arrival order, then routine in arrival order', () => {
  const list = [
    { n: 0, high: false }, { n: 1, high: true }, { n: 2, high: false }, { n: 3, high: true }, { n: 4, high: false }
  ];
  // round(0.6 · 5) = 3: both high-risk, then the first routine one
  assert.deepEqual(M.depth(list, 'risk', 0.6), [true, true, false, true, false]);
  // round(0.3 · 5) = round(1.5) = 2
  assert.deepEqual(M.depth(list, 'risk', 0.3), [false, true, false, true, false]);
  // round(0.2 · 5) = 1: the first high-risk one in arrival order
  assert.deepEqual(M.depth(list, 'risk', 0.2), [false, true, false, false, false]);
  assert.deepEqual(M.depth(list, 'all', 0.6), [false, false, false, false, false]);
});

test('rule 1: the look draws come from rng(seed) in arrival order, the order from rng(seed + 7919)', () => {
  const s = M.stream(26), r = M.rng(26);
  assert.deepEqual(s.slice(0, 5).map((x) => x.u), [r(), r(), r(), r(), r()]);
  assert.notDeepEqual(M.stream(27).map((x) => x.high), s.map((x) => x.high));
  // the same seed, the same stream
  assert.deepEqual(M.stream(26), s);
});

test('rule 5: the same draws under every setting: more time never catches fewer', () => {
  for (const seed of [1, 26, 500]) {
    const list = M.stream(seed);
    let prev = -1;
    for (const load of M.LOADS.slice().reverse()) {        // 160 → 10: more minutes each
      const c = M.review(list, 'all', load, 0.1, true).caught;
      assert.ok(c >= prev, `seed ${seed} load ${load}`);
      prev = c;
    }
    // independent catches at least what a colleague catches, request by request
    const a = M.review(list, 'all', 10, 0.1, true).items, d = M.review(list, 'all', 10, 0.1, false).items;
    for (let i = 0; i < a.length; i++) assert.ok(a[i].caught || !d[i].caught);
  }
});

test('rule 3: in depth for too many: each gets budget / (d · load), the rest 0, never negative', () => {
  const tm = M.times('risk', 80, 0.5);
  assert.equal(tm.perDay, 40);
  assert.equal(tm.deep, 1.5);
  assert.equal(tm.thin, 0);
  // exactly the budget: 4 a day × 15 min = 60
  assert.deepEqual(M.times('risk', 40, 0.1), { deep: 15, thin: 0, perDay: 4 });
  for (const load of M.LOADS) for (const d of M.DEEPS) {
    const x = M.times('risk', load, d);
    assert.ok(x.thin >= 0 && x.deep > 0 && x.deep <= 15, `${load} ${d}`);
    // the whole hour is used, never more
    close(x.perDay * x.deep + (load - x.perDay) * x.thin, 60, `${load} ${d}`);
  }
});

test('rule 5: a draw equal to p is not caught (u < p); a draw of 0 is not caught when p is 0', () => {
  assert.equal(M.review([{ n: 0, high: false, bad: true, u: 0 }], 'all', 80, 0.1, true).caught, 0);
  const p = M.catchP(6, true);
  assert.equal(M.review([{ n: 0, high: false, bad: true, u: p }], 'all', 10, 0.1, true).caught, 0);
});

test('rule 6: exactly one minute counts as looked, not signed unread', () => {
  const r = M.review([{ n: 0, high: false, bad: false, u: 0.5 }], 'all', 60, 0.1, true);
  assert.equal(r.stamped, 0);
  assert.equal(r.items[0].looked, true);
});

test('rule 4: round(d · n) rounds a fraction below .5 down', () => {
  const list = [0, 1, 2, 3, 4].map((n) => ({ n, high: n === 1 }));
  assert.deepEqual(M.depth(list, 'risk', 0.25), [false, true, false, false, false]);   // 1.25 → 1
});

test('rule 1: the shuffle of seed 26 (pins the Fisher-Yates direction and range)', () => {
  assert.deepEqual(M.stream(26).filter((x) => x.high).map((x) => x.n),
    [15, 18, 20, 24, 41, 43, 46, 55, 57, 66, 105, 113, 131, 136, 137, 174, 182, 186, 193, 198, 209, 223, 244, 246, 251, 257, 288, 293, 296, 298]);
});

test('rule 5: an in-depth review under a minute is not opened either', () => {
  const r = M.review(M.stream(26), 'risk', 160, 0.5, true);
  assert.equal(r.times.deep, 0.75);
  assert.equal(r.stamped, 300);
  assert.equal(r.caught, 0);
});

// ── the rules ──

test('rule 1: 300 requests, 30 high-risk, 9 + 3 bad, every seed', () => {
  for (const seed of [1, 26, 999]) {
    const s = M.stream(seed);
    assert.equal(s.length, 300);
    assert.equal(s.filter((x) => x.high).length, 30);
    assert.equal(s.filter((x) => x.high && x.bad).length, 9);
    assert.equal(s.filter((x) => !x.high && x.bad).length, 3);
    assert.deepEqual(s.map((x) => x.n), s.map((_, i) => i));
    assert.ok(s.every((x) => x.u >= 0 && x.u < 1));
  }
  assert.equal(M.BAD, 12);
});

test('rule 1: the shuffle moves the high-risk requests through the whole month', () => {
  const s = M.stream(26);
  const hi = s.filter((x) => x.high).map((x) => x.n);
  assert.ok(hi[0] < 50 && hi[hi.length - 1] > 250, hi.join(','));
});

test('rule 2-3: evenly, the hour is split over the queue', () => {
  assert.deepEqual(M.LOADS.map((l) => M.times('all', l, 0.1).thin), [6, 3, 1.5, 0.75, 0.375]);
  assert.equal(M.times('all', 10, 0.5).deep, null);
  assert.equal(M.times('all', 10, 0.5).perDay, 0);
});

test('rule 3: by risk, depth first, then the rest share what is left', () => {
  assert.deepEqual(M.times('risk', 10, 0.1), { deep: 15, thin: 5, perDay: 1 });
  const x = M.times('risk', 20, 0.1);
  assert.equal(x.deep, 15);
  close(x.thin, 30 / 18);
  assert.deepEqual(M.times('risk', 80, 0.1), { deep: 7.5, thin: 0, perDay: 8 });
  assert.deepEqual(M.times('risk', 160, 0.1), { deep: 3.75, thin: 0, perDay: 16 });
});

test('rule 4: round(d · 300) requests of the stream get depth', () => {
  const s = M.stream(26);
  for (const d of M.DEEPS) {
    const dp = M.depth(s, 'risk', d);
    assert.equal(dp.filter(Boolean).length, Math.round(d * 300));
    // every high-risk one is reviewed in depth once d ≥ 10 %
    assert.ok(s.every((x) => !x.high || dp[x.n]));
  }
});

test('rule 5: the look grows with time and saturates; a colleague a quarter as often', () => {
  close(M.catchP(6, true), 1 - Math.exp(-1.5));
  close(M.catchP(15, true), 1 - Math.exp(-15 / 4));
  close(M.catchP(6, false), 0.25 * (1 - Math.exp(-1.5)));
  assert.ok(M.catchP(3, true) < M.catchP(6, true));
  assert.ok(M.catchP(1000, true) <= 1);
});

test('rule 5: a bad request is caught exactly when its draw is under p; good ones are never rejected', () => {
  const list = [
    { n: 0, high: true, bad: true, u: 0.5 }, { n: 1, high: false, bad: true, u: 0.9 },
    { n: 2, high: false, bad: false, u: 0.0 }
  ];
  const r = M.review(list, 'all', 10, 0.1, true);       // 6 min each: p = 0.777
  assert.deepEqual(r.items.map((x) => x.caught), [true, false, false]);
  assert.equal(r.caught, 1);
  assert.equal(r.passed, 1);
  close(r.expected, 1 - Math.exp(-1.5));
});

test('rule 6: the record shows every request signed twice, whatever happened', () => {
  for (const load of M.LOADS) for (const policy of ['all', 'risk']) for (const ind of [true, false]) {
    const r = M.review(M.stream(26), policy, load, 0.1, ind);
    assert.equal(r.record.signed, 300);
    assert.equal(r.record.of, 300);
    assert.equal(r.record.rejected, r.caught);
    assert.equal(r.record.approved, 300 - r.caught);
    assert.equal(r.caught + r.passed, 12);
  }
});

test('rule 6: requests signed without opening are those under a minute', () => {
  assert.equal(M.review(M.stream(26), 'all', 80, 0.1, true).stamped, 300);
  assert.equal(M.review(M.stream(26), 'all', 40, 0.1, true).stamped, 0);
  assert.equal(M.review(M.stream(26), 'risk', 80, 0.1, true).stamped, 270);
  assert.equal(M.review(M.stream(26), 'risk', 10, 0.1, true).stamped, 0);
});

test('rule 7: params made safe', () => {
  const n = logic.normalise({ policy: 'x', load: 7, deep: 0.15, independent: 'maybe', seed: -5 });
  assert.deepEqual(n, { policy: 'all', load: 10, deep: 0.1, independent: true, seed: 1 });
  assert.equal(logic.normalise({ load: '160' }).load, 160);
  assert.equal(logic.normalise({ deep: '0.5' }).deep, 0.5);
  assert.equal(logic.normalise({ policy: 'risk' }).policy, 'risk');
  assert.equal(logic.normalise({ seed: 1000 }).seed, 999);
  assert.equal(logic.normalise({ seed: 9.5 }).seed, 10);
  assert.equal(logic.normalise({ seed: '' }).seed, 26);
  assert.equal(logic.normalise({ seed: 'abc' }).seed, 26);
  for (const v of [false, 'false', 0, '0']) assert.equal(logic.normalise({ independent: v }).independent, false, String(v));
  for (const v of [true, 'true', 1, '1']) assert.equal(logic.normalise({ independent: v }).independent, true, String(v));
});

test('rule 7: "New requests" moves the seed on by one and wraps after 999', () => {
  assert.equal(logic.nextSeed(26), 27);
  assert.equal(logic.nextSeed(999), 1);
});

test('rule 7: both policies on the same stream and draws; the chosen one is shown', () => {
  const a = S({ load: 80 }), r = S({ load: 80, policy: 'risk' });
  assert.deepEqual(a.even, r.even);
  assert.deepEqual(a.risk, r.risk);
  assert.equal(a.caught, a.even.caught);
  assert.equal(r.caught, r.risk.caught);
  assert.equal(a.average, 0.75);
  assert.equal(r.average, 0.75);
  assert.equal(a.items.filter((x) => x.deep).length, 0);
  assert.equal(r.items.filter((x) => x.deep).length, 30);
});

test('rule 8: the caption: the policy, then at most one note in order', () => {
  const key = (over) => logic.captionKey(S(over));
  assert.deepEqual(key({}), { key: 'capAll', notes: [] });
  assert.deepEqual(key({ load: 80 }), { key: 'capAll', notes: ['nStamp'] });
  // nStamp beats nDep
  assert.deepEqual(key({ load: 80, independent: false }), { key: 'capAll', notes: ['nStamp'] });
  assert.deepEqual(key({ independent: false }), { key: 'capAll', notes: ['nDep'] });
  assert.deepEqual(key({ policy: 'risk' }), { key: 'capRisk', notes: [] });
  assert.deepEqual(key({ policy: 'risk', load: 40 }), { key: 'capRisk', notes: ['nRest'] });
  assert.deepEqual(key({ policy: 'risk', load: 80 }), { key: 'capRisk', notes: ['nRest'] });
  // nThinDeep beats nDep and nRest; under 5 minutes is thin, exactly 5 is not
  assert.deepEqual(key({ policy: 'risk', load: 160, independent: false }), { key: 'capRisk', notes: ['nThinDeep'] });
  assert.deepEqual(key({ policy: 'risk', load: 80, deep: 0.5 }), { key: 'capRisk', notes: ['nThinDeep'] });
  assert.equal(logic.THIN_DEEP, 5);
  const five = S({ policy: 'risk', load: 40, deep: 0.3 });  // 12 a day: 5 min each
  assert.equal(five.times.deep, 5);
  assert.deepEqual(logic.captionKey(five).notes, ['nRest']);
  // nRest only when a bad request really goes unread
  const all = S({ policy: 'risk', load: 10, deep: 0.5, seed: 28 });
  assert.equal(all.times.thin, 0);
  assert.ok(all.items.every((x) => !x.bad || x.looked));
  assert.deepEqual(logic.captionKey(all).notes, []);
  // nDep beats nRest
  assert.deepEqual(key({ policy: 'risk', load: 40, independent: false }), { key: 'capRisk', notes: ['nDep'] });
});

// ── presets (SPEC.md table) ──

test('presets: the table in SPEC.md', () => {
  const row = (id) => {
    const s = logic.compute(preset(id));
    return [s.p.policy, s.p.load, s.caught, Math.round(s.expected * 1000) / 10, s.even.caught, s.risk.caught, s.stamped, s.record.signed];
  };
  assert.deepEqual(row('quiet'), ['all', 10, 9, 77.7, 9, 12, 0, 300]);
  assert.deepEqual(row('busy'), ['all', 80, 0, 0, 0, 8, 300, 300]);
  assert.deepEqual(row('colleague'), ['all', 10, 3, 19.4, 3, 3, 0, 300]);
  assert.deepEqual(row('by-risk'), ['risk', 80, 8, 63.5, 0, 8, 270, 300]);
  assert.deepEqual(row('too-deep'), ['risk', 80, 4, 28.7, 0, 4, 150, 300]);
});

test('the defaults are preset 1; every preset is already normal', () => {
  assert.deepEqual(logic.defaults, preset('quiet'));
  for (const x of logic.presets) assert.deepEqual(logic.normalise(x.params), x.params, x.id);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('by-risk'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset and caption has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  assert.match(html, /<script src="strings\.js"><\/script>\s*<script src="approval\.js"><\/script>\s*<script src="sim\.js"><\/script>/);
  const keys = ['capAll', 'capRisk', 'nStamp', 'nThinDeep', 'nDep', 'nRest'];
  for (const lang of ['hr', 'en']) {
    for (const k of keys) assert.ok(strings[lang][k], `${lang} ${k}`);
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: by-risk → pByRisk. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
