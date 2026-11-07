// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-fixed-variable. Run: node --test sims/fin-fixed-variable/sim.test.js
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the stepcost module's rules (promotable with it),
// then the page model, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const M = require('./stepcost.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const PL = (over) => Object.assign({ fixed: 3000, step: 500, cap: 80, perUser: 2, size: 100 }, over);

/** Brute force for rule 8: first paying n, and the n from which every larger n pays (searched up to N). */
function brute(pl, price, N) {
  const ok = [];
  for (let n = 1; n <= N; n++) ok.push(M.cost(pl, n).total <= price * n);
  const first = ok.indexOf(true) + 1 || null;
  let good = 1;
  for (let i = N - 1; i >= 0; i--) if (!ok[i]) { good = i + 2; break; }
  return { first, good: good > N - 2000 ? null : good };
}

// ── tie-breaks ──

test('rule 1a: a full block stays one block; the next user opens the second', () => {
  assert.equal(M.blocks(80, 80), 1);
  assert.equal(M.blocks(81, 80), 2);
  assert.equal(M.blocks(79, 80), 1);
  assert.equal(M.blocks(1, 80), 1);
  assert.equal(M.blocks(0, 80), 0);
  assert.equal(M.blocks(160, 80), 2);
  assert.equal(S({ users: 400 }).inhouse.blocks, 5);
  assert.equal(S({ users: 410 }).inhouse.blocks, 6);
});

test('rule 1b: the next user opens a block exactly at a multiple of cap, 0 included', () => {
  const pl = PL();
  assert.equal(M.opensBlock(pl, 0), true);
  assert.equal(M.opensBlock(pl, 80), true);
  assert.equal(M.opensBlock(pl, 400), true);
  assert.equal(M.opensBlock(pl, 79), false);
  assert.equal(M.opensBlock(pl, 81), false);
  assert.equal(M.marginal(pl, 0), 502);
  assert.equal(M.marginal(pl, 400), 502);
  assert.equal(M.marginal(pl, 410), 2);
  // the marginal cost is exactly C(n + 1) − C(n)
  for (const n of [0, 1, 79, 80, 81, 399, 400, 401, 999]) {
    assert.equal(M.marginal(pl, n), M.cost(pl, n + 1).total - M.cost(pl, n).total, `n ${n}`);
  }
});

test('rule 1c: equal monthly costs are even, neither side cheaper', () => {
  assert.equal(M.outcome(0), 'even');
  assert.equal(M.outcome(1), 'inhouse');
  assert.equal(M.outcome(-1), 'service');
  const s = S({ users: 800 });
  assert.deepEqual([s.inhouse.total, s.service, s.diff, s.outcome], [9600, 9600, 0, 'even']);
  assert.equal(logic.captionKey(s).key, 'capEven');
  assert.equal(S({ users: 900 }).outcome, 'even');
  assert.equal(S({ users: 890 }).outcome, 'service');   // block 12 pays only from 900
  assert.equal(S({ users: 870 }).outcome, 'inhouse');   // the tail of block 11 (850–880)
  assert.equal(S({ users: 910 }).outcome, 'inhouse');
  assert.equal(S({ users: 810 }).outcome, 'service');
});

test('rule 1d: break-even counts equal cost as reached', () => {
  const pl = PL();
  assert.equal(M.cost(pl, 800).total, 12 * 800);
  assert.equal(M.first(pl, 12), 800);            // equal at 800, dearer at 799
  assert.ok(M.cost(pl, 799).total > 12 * 799);
  assert.equal(M.cost(pl, 900).total, 12 * 900);
  assert.equal(M.forGood(pl, 12), 900);          // equal at 900, never dearer after; dearer at 899
  assert.ok(M.cost(pl, 899).total > 12 * 899);
  // no fixed cost and a zero block margin: equal at every full block, never cheaper, never for good
  const flat = PL({ fixed: 0, cap: 50 });
  assert.equal(M.blockMargin(flat, 12), 0);
  assert.equal(M.first(flat, 12), 50);
  assert.equal(M.forGood(flat, 12), null);
  assert.equal(M.textbook(flat, 12), null);
});

test('rule 1e: averages round to the nearest cent, halves up', () => {
  assert.equal(M.cents(1, 8), 13);               // 12.5 → 13
  assert.equal(M.cents(1, 3), 33);
  assert.equal(M.cents(2, 3), 67);
  assert.equal(M.cents(6300, 400), 1575);
  assert.equal(M.cents(5, 0), null);
  assert.equal(M.average(PL(), 0), null);
  assert.deepEqual(M.average(PL(), 400), { total: 1575, fixed: 750, steps: 625, variable: 200 });
  // 3 000 + 500 + 2 × 3 = 3 506 over 3 users: 1 168.666… → 116 867 cents
  assert.equal(M.average(PL(), 3).total, 116867);
});

// ── stepcost.js ──

test('rule 2: a block takes cap = 100 × util ÷ 100 users', () => {
  assert.equal(logic.platform(P({ util: 80 })).cap, 80);
  assert.equal(logic.platform(P({ util: 55 })).cap, 55);
  assert.equal(logic.platform(P({ util: 100 })).cap, 100);
  assert.equal(S({ util: 50 }).cap, 50);
  assert.equal(S({ util: 50, users: 600 }).inhouse.blocks, 12);
  assert.equal(S({ util: 100, users: 600 }).inhouse.blocks, 6);
});

test('rule 4: in-house = fixed + steps + variable; the service = price × users', () => {
  assert.deepEqual(M.cost(PL(), 400), { blocks: 5, fixed: 3000, steps: 2500, variable: 800, total: 6300 });
  assert.deepEqual(M.cost(PL(), 0), { blocks: 0, fixed: 3000, steps: 0, variable: 0, total: 3000 });
  assert.equal(M.diff(PL(), 400, 12), 4800 - 6300);
  const s = S({});
  assert.equal(s.service, 4800);
  assert.equal(s.diff, -1500);
  assert.equal(s.outcome, 'service');
});

test('rule 5: the fixed share falls with users; the block share is a sawtooth', () => {
  const pl = PL();
  const f = [100, 200, 400, 800].map((n) => M.average(pl, n).fixed);
  assert.deepEqual(f, [3000, 1500, 750, 375]);
  // the block share at a full block is S ÷ cap, and jumps just after it
  assert.equal(M.average(pl, 400).steps, 625);
  assert.equal(M.average(pl, 401).steps, 748);   // 3 000 / 401 = 7.48…
  assert.equal(M.average(pl, 480).steps, 625);
  // the fixed share rounds to nearest (272.727… → 27 273 cents); the block share is the rest, so the parts add up
  assert.equal(M.average(pl, 11).fixed, 27273);
  assert.deepEqual(M.average(pl, 220), { total: 2245, fixed: 1364, steps: 681, variable: 200 });
  for (let n = 1; n <= 1000; n += 7) {
    const a = M.average(pl, n);
    assert.equal(a.fixed + a.steps + a.variable, a.total, `n ${n}`);
  }
});

test('rule 6: the next user costs v, or v + S when it opens a block — not the average', () => {
  const a = S(preset('step-edge'));
  assert.deepEqual([a.opens, a.marginal, a.avg.total], [true, 502, 1575]);
  const b = S(preset('grown'));
  assert.deepEqual([b.opens, b.marginal, b.avg.total], [false, 2, 1150]);
});

test('rule 7: spare capacity is b × 100 − n places, costing S × spare ÷ 100', () => {
  assert.deepEqual(M.spare(PL(), 400), { places: 100, cost: 500 });
  assert.deepEqual(M.spare(PL(), 410), { places: 190, cost: 950 });
  assert.deepEqual(M.spare(PL({ cap: 100 }), 800), { places: 0, cost: 0 });
  assert.deepEqual(M.spare(PL(), 0), { places: 0, cost: 0 });
  assert.deepEqual(M.spare(PL({ cap: 55 }), 1), { places: 99, cost: 495 });
});

test('rule 8: textbook break-even = F ÷ (p − v − S ÷ cap); none at a margin ≤ 0', () => {
  assert.equal(M.textbook(PL(), 12), 800);
  assert.equal(M.textbook(PL({ cap: 100 }), 12), 600);
  assert.equal(M.textbook(PL({ cap: 50 }), 12), null);
  assert.equal(M.textbook(PL({ cap: 100 }), 6), null);
  assert.ok(Math.abs(M.textbook(PL({ cap: 55 }), 15) - 3000 / (13 - 500 / 55)) < 1e-9);
  assert.equal(M.blockMargin(PL(), 12), 300);
  // the page keeps the exact value: 3 000 × 85 ÷ 350
  assert.ok(Math.abs(S({ util: 85 }).textbook - 3000 * 85 / 350) < 1e-9);
  assert.equal(S({ util: 55 }).textbook, 3300);
});

test('rule 8: first and for good, against brute force over the param grid', () => {
  for (let util = 50; util <= 100; util += 5) {
    for (let fixed = 0; fixed <= 6000; fixed += 1500) {
      for (const price of [4, 7, 8, 9, 10, 12, 15, 20, 30]) {
        const pl = PL({ fixed, cap: util });
        const margin = M.blockMargin(pl, price);
        if (margin > 0 && margin <= 40) continue;   // for good lies beyond the brute-force range; checked below
        const b = brute(pl, price, 12000);
        assert.deepEqual([M.first(pl, price), M.forGood(pl, price)], [b.first, b.good], `${util} ${fixed} ${price}`);
      }
    }
  }
  // a small block margin puts "for good" far out: 55 users a block, 11 €: margin 5 × … = 495 − 500 < 0 → none
  assert.equal(M.forGood(PL({ cap: 55 }), 11), null);
  // 60 a block, 11 €: margin 40, for good at 6 000 fixed is far beyond the scale
  const far = PL({ fixed: 6000, cap: 60 });
  const g = M.forGood(far, 11);
  assert.ok(g > logic.N_MAX);
  assert.equal(brute(far, 11, 60000).good, g);
});

test('rule 8: first ≥ textbook, first ≤ for good, and "for good" really holds', () => {
  for (const util of [50, 65, 80, 95, 100]) {
    for (const price of [9, 12, 20]) {
      const pl = PL({ cap: util });
      const tb = M.textbook(pl, price), f = M.first(pl, price), g = M.forGood(pl, price);
      if (tb !== null) assert.ok(f >= tb - 1e-9, `${util} ${price}`);
      if (g !== null) {
        assert.ok(f <= g);
        for (let n = g; n < g + 3 * util; n++) assert.ok(M.cost(pl, n).total <= price * n, `${util} ${price} ${n}`);
        if (g > 1) assert.ok(M.cost(pl, g - 1).total > price * (g - 1));
      }
    }
  }
  // the first user already pays when a block is cheap enough: 28 € margin ≥ 10 € block
  assert.equal(M.forGood(PL({ fixed: 0, step: 10, cap: 100 }), 30), 1);
  assert.equal(M.first(PL({ fixed: 0, step: 10, cap: 100 }), 30), 1);
});

test('rule 8: a block\'s paying tail starts inside the block, at ⌈(F + S·j) ÷ (p − v)⌉', () => {
  assert.equal(M.payFrom(PL(), 12, 12), 900);
  assert.equal(M.payFrom(PL(), 12, 11), 850);
  assert.equal(M.payFrom(PL(), 12, 10), 800);
  assert.equal(M.payFrom(PL(), 12, 9), null);              // needs 750, the block ends at 720
  assert.equal(M.payFrom(PL({ fixed: 0, step: 10, cap: 100 }), 30, 2), 101);   // never a user of block 1
});

test('rule 8: for good falls back to the first user of block j* when block j* − 1 has no paying tail', () => {
  // possible only when a block costs less than one user's margin (S < p − v): through the promotable API
  const pl = PL({ fixed: 21, step: 1, cap: 1 });
  assert.equal(M.payFrom(pl, 20, 1), null);
  assert.equal(M.forGood(pl, 20), 2);
  assert.equal(brute(pl, 20, 3000).good, 2);
});

test('rule 8: no paying user when the price does not cover the variable cost', () => {
  assert.equal(M.first(PL(), 2), null);
  assert.equal(M.forGood(PL(), 2), null);
  assert.equal(M.first(PL(), 1), null);
});

test('rule 9: the outcome mark follows a change of cheaper side or even', () => {
  const a = S(preset('step-edge')), b = S(preset('grown'));
  assert.deepEqual(logic.flipped(a, b), ['outcome']);
  assert.deepEqual(logic.flipped(a, S(preset('few-users'))), [], 'another amount on the same side is no change');
  assert.deepEqual(logic.flipped(null, a), []);
  assert.deepEqual(logic.flipped(b, S({ users: 800 })), ['outcome'], 'cheaper to even');
  // 0 users shows no outcome: leaving it is a change, whatever the fixed cost
  assert.deepEqual(logic.flipped(S({ users: 0 }), S({ users: 100 })), ['outcome']);
  assert.deepEqual(logic.flipped(S({ users: 0, fixed: 0 }), S({ users: 10, fixed: 0 })), ['outcome']);
});

// ── the page model ──

test('presets give the SPEC numbers', () => {
  const want = {
    'few-users': [2, 3000, 1000, 200, 4200, 1200, -3000, 4200, 2, 100, 500, 800, 900, 800, 'capService', ['nNext', 'nZone']],
    'step-edge': [5, 3000, 2500, 800, 6300, 4800, -1500, 1575, 502, 100, 500, 800, 900, 800, 'capService', ['nEdge', 'nZone']],
    grown: [13, 3000, 6500, 2000, 11500, 12000, 500, 1150, 2, 300, 1500, 800, 900, 800, 'capInhouse', ['nNext', 'nZone']],
    headroom: [12, 3000, 6000, 1200, 10200, 7200, -3000, 1700, 502, 600, 3000, null, null, null, 'capService', ['nEdge', 'nNever']],
    'run-hot': [8, 3000, 4000, 1600, 8600, 9600, 1000, 1075, 502, 0, 0, 600, 650, 600, 'capInhouse', ['nEdge', 'nZone']]
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  for (const x of logic.presets) {
    const s = logic.compute(P(x.params));
    const k = logic.captionKey(s);
    const i = s.inhouse;
    assert.deepEqual([i.blocks, i.fixed, i.steps, i.variable, i.total, s.service, s.diff, s.avg.total, s.marginal,
      s.spare.places, s.spare.cost, s.first, s.forGood, s.textbook, k.key, k.notes], want[x.id], x.id);
  }
});

test('SPEC extra cases', () => {
  let s = S({ users: 0 });
  assert.deepEqual([s.inhouse.total, s.service, s.avg, s.marginal, s.opens, s.outcome], [3000, 0, null, 502, true, 'none']);
  assert.deepEqual(s.spare, { places: 0, cost: 0 });
  assert.deepEqual(logic.captionKey(s), { key: 'capNone', notes: [] });
  s = S({ users: 0, fixed: 0 });
  assert.deepEqual([s.inhouse.total, s.outcome], [0, 'none']);
  assert.deepEqual(logic.captionKey(s), { key: 'capNoneFree', notes: [] });
  // a small count already gets the full caption
  assert.deepEqual(logic.captionKey(S({ users: 10 })), { key: 'capService', notes: ['nNext', 'nZone'] });
  s = S({ users: 600, util: 50, fixed: 0 });
  assert.deepEqual([s.inhouse.total, s.service, s.outcome, s.first, s.forGood], [7200, 7200, 'even', 50, null]);
  assert.deepEqual(logic.captionKey(s).notes, ['nEdge', 'nNever']);
  s = S({ users: 1000, util: 100, price: 6 });
  assert.deepEqual([s.inhouse.total, s.service, s.first, s.forGood], [10000, 6000, null, null]);
  s = S({ users: 900 });
  assert.deepEqual(logic.captionKey(s), { key: 'capEven', notes: ['nNext', 'nZone'] });
  // first = for good: the note says one number
  s = S({ util: 100, fixed: 0, price: 30 });
  assert.equal(s.first, s.forGood);
  assert.equal(logic.captionKey(s).notes[1], 'nBe');
});

test('a full block\'s cost per user is v + S ÷ cap, in cents', () => {
  assert.equal(S({ util: 80 }).unitCents, 825);
  assert.equal(S({ util: 50 }).unitCents, 1200);
  assert.equal(S({ util: 100 }).unitCents, 700);
  assert.equal(S({ util: 75 }).unitCents, 867);   // 6.666… → 6.67
  assert.equal(S({ util: 55 }).unitCents, 1109);
});

test('the charts: the staircase jumps at each block and ends at the scale', () => {
  const s = S({ util: 80 });
  const st = s.chart.stairs;
  assert.deepEqual(st.slice(0, 5), [[0, 3000], [0, 3500], [80, 3660], [80, 4160], [160, 4320]]);
  assert.deepEqual(st[st.length - 1], [1000, 3000 + 13 * 500 + 2000]);
  // every corner at a full block lies on the textbook line F + (v + S/cap) n
  for (let i = 2; i < st.length - 1; i += 2) assert.equal(st[i][1], 3000 + 8.25 * st[i][0]);
  assert.deepEqual(s.chart.edges.slice(0, 3), [0, 80, 160]);
  assert.equal(s.chart.edges.length, 13);
  // the right end of the scale counts when a block ends there (the 1 001st user would open one)
  assert.equal(S({ util: 100 }).chart.edges.slice(-1)[0], 1000);
  assert.equal(S({ util: 50 }).chart.edges.length, 21);
  for (const u of [50, 80, 100]) assert.ok(S({ util: u }).chart.avg.every((x) => x[0] >= 1 && x[0] <= 1000));
  assert.equal(s.chart.top, 20000);
  assert.equal(S({ price: 30 }).chart.top, 30000);
  assert.equal(S({ price: 22 }).chart.top, 25000);
  // the average curve has both sides of each step, in order
  const xs = s.chart.avg.map((x) => x[0]);
  assert.ok(xs.includes(400) && xs.includes(401));
  assert.deepEqual(xs, xs.slice().sort((a, b) => a - b));
  assert.equal(new Set(xs).size, xs.length);
  assert.equal(s.chart.avg.find((x) => x[0] === 400)[1], 15.75);
});

test('the defaults are preset 2', () => {
  assert.deepEqual(logic.defaults, preset('step-edge'));
});

test('normalise clamps, snaps and defaults params from a URL', () => {
  const p = logic.normalise({ users: 1234, util: 47, fixed: -10, price: 'x' });
  assert.deepEqual(p, { users: 1000, util: 50, fixed: 0, price: 12 });
  assert.equal(logic.normalise({ users: 404 }).users, 400);
  assert.equal(logic.normalise({ users: 405 }).users, 410);
  assert.equal(logic.normalise({ util: 83 }).util, 85);
  assert.equal(logic.normalise({ util: 101 }).util, 100);
  assert.equal(logic.normalise({ fixed: 2700 }).fixed, 2500);
  assert.equal(logic.normalise({ fixed: 9000 }).fixed, 6000);
  assert.equal(logic.normalise({ price: 2 }).price, 4);
  assert.equal(logic.normalise({ price: '15' }).price, 15);
  assert.equal(logic.normalise({ users: '' }).users, 400);
  assert.equal(logic.normalise({ users: null }).users, 400);
  assert.equal(logic.normalise({ users: true }).users, 400);
  assert.equal(logic.normalise({ users: Infinity }).users, 400);
  assert.equal(logic.normalise({ users: -20 }).users, 0);
  assert.equal(logic.normalise({ users: ' ' }).users, 400);
  assert.equal(logic.normalise({ price: 40 }).price, 30);
});

test('every preset sits inside the ranges', () => {
  for (const x of logic.presets) {
    assert.deepEqual(logic.normalise(x.params), Object.assign({}, logic.defaults, x.params), x.id);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params), [{ users: 0 }, { util: 55, price: 30 }])) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('run-hot'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset has its label and hint; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  for (const lang of ['hr', 'en']) {
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: step-edge → pStepEdge. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
