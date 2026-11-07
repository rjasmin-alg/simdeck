// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-refresh-cycle. Run: node --test sims/fin-refresh-cycle/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules in order, then the asset model's own tests
// (asset.js, copied from fin-depreciation), then the presets and the page model, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const As = require('./asset.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const near = (a, b, eps = 1e-3) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);
const totals = (s) => s.curve.map((c) => Math.round(c.total * 100) / 100);

// ── tie-breaks ──

test('rule 2 tie-break: uneven cohorts, the first N mod c get one device more', () => {
  assert.deepEqual(logic.cohortsOf(7, 7).map((k) => k.size), [35, 35, 34, 34, 34, 34, 34]);
  assert.deepEqual(logic.cohortsOf(8, 7).map((k) => k.size), [35, 35, 34, 34, 34, 34, 34]);
  assert.deepEqual(logic.cohortsOf(4, 4).map((k) => k.size), [60, 60, 60, 60]);
  for (let n = 2; n <= 8; n++) {
    for (let c = 1; c <= n; c++) {
      const co = logic.cohortsOf(n, c);
      assert.equal(co.reduce((a, k) => a + k.size, 0), 240, `n ${n} c ${c}: all 240 devices`);
      assert.equal(new Set(co.map((k) => k.offset)).size, c, `n ${n} c ${c}: distinct offsets`);
    }
  }
});

test('rule 5 tie-break: equal totals go to the longer cycle', () => {
  assert.equal(logic.lowest([{ cycle: 3, total: 400 }, { cycle: 4, total: 400 }, { cycle: 5, total: 401 }]), 4);
  assert.equal(logic.lowest([{ cycle: 2, total: 9 }, { cycle: 3, total: 9 }, { cycle: 4, total: 9 }]), 4);
  assert.equal(logic.lowest([{ cycle: 3, total: 399.99 }, { cycle: 4, total: 400 }]), 3);
  // on the model: the flat bottom is not a tie (4 wins by 5.58 €; staff off, 7 wins by 1.25 €)
  assert.equal(logic.curve(1, true).econ, 4);
  near(logic.perDevice(6, 1, false).total - logic.perDevice(7, 1, false).total, 1.2455357, 1e-4);
  assert.equal(logic.curve(1, false).econ, 7);
});

test('rule 8 tie-break: the earliest year wins a tie for the peak', () => {
  assert.equal(S(preset('wall')).peak.year, 1);          // years 1, 5 and 9 all 270 000
  assert.equal(S(preset('staggered')).peak.year, 1);     // every year 76 297.50
  assert.equal(S({ cycle: 3, cohorts: 1 }).peak.year, 1);
});

// ── rules ──

test('rule 1: normalise clamps and rounds; cohorts follow the cycle', () => {
  assert.deepEqual(logic.normalise({}), logic.defaults);
  assert.deepEqual(logic.normalise({ cycle: 99, cohorts: 99, slow: 99 }), { cycle: 8, cohorts: 8, slow: 4, staff: true });
  assert.deepEqual(logic.normalise({ cycle: 0, cohorts: 0, slow: -3 }), { cycle: 2, cohorts: 1, slow: 0, staff: true });
  assert.equal(logic.normalise({ cycle: 3, cohorts: 6 }).cohorts, 3);
  assert.equal(logic.normalise({ cycle: 4.4 }).cycle, 4);
  assert.equal(logic.normalise({ slow: 1.3 }).slow, 1.5);
  assert.equal(logic.normalise({ slow: 1.2 }).slow, 1);
  assert.equal(logic.normalise({ cycle: '6' }).cycle, 6);
  assert.equal(logic.normalise({ cycle: 4.6 }).cycle, 5);
  assert.equal(logic.normalise({ cohorts: 2.4 }).cohorts, 2);
  assert.equal(logic.normalise({ cohorts: 2.6 }).cohorts, 3);
});

test('rule 1: non-numbers take the default; staff accepts booleans and their strings only', () => {
  assert.deepEqual(logic.normalise({ cycle: null, cohorts: '', slow: true }), logic.defaults);
  assert.equal(logic.normalise({ cycle: true }).cycle, 4);
  assert.equal(logic.normalise({ cycle: '  ' }).cycle, 4);
  assert.equal(logic.normalise({ cycle: false }).cycle, 4);
  assert.equal(logic.normalise({ cycle: Infinity }).cycle, 4);
  assert.equal(logic.normalise({ slow: 'x' }).slow, 1);
  for (const v of [false, 'false', 0, '0']) assert.equal(logic.normalise({ staff: v }).staff, false, String(v));
  for (const v of [true, 'true', 1, '1']) assert.equal(logic.normalise({ staff: v }).staff, true, String(v));
  for (const v of ['yes', null, 2, '']) assert.equal(logic.normalise({ staff: v }).staff, true, String(v));
});

test('rule 2: offsets ⌊i·n/c⌋ and the age of a cohort, 1 in the year it is bought', () => {
  assert.deepEqual(logic.cohortsOf(8, 3).map((k) => k.offset), [0, 2, 5]);
  assert.deepEqual(logic.cohortsOf(6, 2).map((k) => k.offset), [0, 3]);
  assert.deepEqual(logic.cohortsOf(4, 4).map((k) => k.offset), [0, 1, 2, 3]);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((y) => logic.ageIn(y, 4, 0)), [1, 2, 3, 4, 1, 2]);
  assert.deepEqual([1, 2, 3, 4, 5].map((y) => logic.ageIn(y, 4, 2)), [3, 4, 1, 2, 3]);
  assert.equal(logic.ageIn(0, 4, 0), 4);
  assert.equal(logic.ageIn(1, 4, 1), 4);   // an asymmetric offset: bought in year 2, so 4 years old in year 1
  assert.deepEqual(S({ cycle: 8, cohorts: 3 }).years.map((r) => r.bought), [80, 0, 80, 0, 0, 80, 0, 0, 80, 0]);   // the year before the run: the old fleet at the end of its cycle
});

test('rule 2: one cohort replaces the whole fleet in years 1, 1 + n, 1 + 2n', () => {
  assert.deepEqual(S({ cycle: 4, cohorts: 1 }).wallYears, [1, 5, 9]);
  assert.deepEqual(S({ cycle: 3, cohorts: 1 }).wallYears, [1, 4, 7, 10]);
  assert.deepEqual(S({ cycle: 7, cohorts: 1 }).wallYears, [1, 8]);
  assert.deepEqual(S({ cycle: 4, cohorts: 2 }).years.map((r) => r.bought), [120, 0, 120, 0, 120, 0, 120, 0, 120, 0]);
  assert.deepEqual(S({ cycle: 4, cohorts: 4 }).years.map((r) => r.bought), Array(10).fill(60));
});

test('rule 3: resale halves, failures grow ×1.5, support and repairs only after the warranty', () => {
  assert.deepEqual([1, 2, 3, 4].map(logic.resale), [600, 300, 150, 75]);
  [0.05, 0.075, 0.1125, 0.16875].forEach((x, i) => near(logic.failRate(i + 1), x, 1e-12));
  assert.deepEqual([1, 2, 3].map(logic.supRep), [0, 0, 0]);
  near(logic.supRep(4), 96 + 0.16875 * 300, 1e-9);
  near(logic.supRep(5), 96 + 0.253125 * 300, 1e-6);
});

test('rule 3: lost staff time = 40 € × (6 h × failures + slow × (age − 1)), 0 when not counted', () => {
  near(logic.staffCost(1, 1, true), 12, 1e-9);
  near(logic.staffCost(2, 1, true), 58, 1e-9);
  near(logic.staffCost(4, 1, true), 160.5, 1e-9);
  near(logic.staffCost(4, 0, true), 40.5, 1e-9);
  near(logic.staffCost(4, 3, true), 400.5, 1e-9);
  assert.equal(logic.staffCost(4, 3, false), 0);
});

test('rule 4: capital cost per year = straight-line depreciation to the resale value; sold at book value', () => {
  assert.equal(logic.perDevice(4, 1, true).capital, 281.25);
  near(logic.perDevice(7, 1, true).capital, (1200 - 1200 / 128) / 7, 1e-6);
  const sched = As.schedule(1200, 4, 75, 'sl');
  assert.equal(sched[0].dep, 281.25);
  assert.equal(As.disposal(sched, 1200, 4, logic.resale(4)).outcome, 'none');
  for (let n = 2; n <= 8; n++) assert.equal(S({ cycle: n }).sale, 'none');
  // the capital cost falls as the cycle lengthens
  const caps = [2, 3, 4, 5, 6, 7, 8].map((n) => logic.perDevice(n, 1, true).capital);
  for (let i = 1; i < caps.length; i++) assert.ok(caps[i] < caps[i - 1]);
});

test('rule 5: the curve and the economic life (SPEC numbers)', () => {
  assert.deepEqual(totals(S({})), [485, 409, 402.28, 407.86, 426.52, 458.86, 506.75]);
  assert.equal(S({}).econ, 4);
  assert.deepEqual(totals(S({ staff: false })), [450, 350, 317.91, 296.21, 284.95, 283.71, 292.87]);
  assert.equal(S({ staff: false }).econ, 7);
  const bySlow = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].map((slow) => S({ slow }).econ);
  assert.deepEqual(bySlow, [6, 5, 4, 3, 3, 3, 3, 3, 3]);
  for (const slow of [0, 2, 4]) assert.equal(S({ slow, staff: false }).econ, 7);
  // the age-related parts rise with the cycle
  const pts = S({}).curve;
  for (let i = 1; i < pts.length; i++) {
    assert.ok(pts[i].supRep >= pts[i - 1].supRep);
    assert.ok(pts[i].staff > pts[i - 1].staff);
  }
});

test('rule 5: econAlt is the economic life with staff time flipped; excess is above the minimum', () => {
  assert.equal(S({}).econAlt, 7);
  assert.equal(S({ staff: false }).econAlt, 4);
  near(S(preset('stretched')).excess, 56.578125);
  assert.equal(S(preset('wall')).excess, 0);
  near(S({ cycle: 2 }).excess, 485 - 402.28125);
  assert.equal(As.roundMoney(S({ cycle: 7, slow: 0 }).excessFleet), 2963);   // exact 2 962.5: rounds up, not down
});

test('rule 6: fleet depreciation is the same every year, whatever the cohorts', () => {
  for (const c of [1, 2, 3, 4]) {
    const s = S({ cycle: 4, cohorts: c });
    for (const r of s.years) assert.equal(r.dep, 67500);
  }
  for (const r of S({ cycle: 7, cohorts: 3 }).years) near(r.dep, 240 * (1200 - 1200 / 128) / 7);
  // the fleet's depreciation is asset.js's straight-line amount (taken untidied so the fleet sum rounds exactly)
  for (let n = 2; n <= 8; n++) {
    const sched = As.schedule(1200, n, logic.resale(n), 'sl');
    for (const x of sched) near(x.dep, logic.perDevice(n, 1, true).capital, 1e-6);
    near(S({ cycle: n }).years[0].dep, 240 * sched[0].dep, 1e-3);
  }
});

test('rule 6: cash = purchases − resale + support and repairs; expense = depreciation + support and repairs', () => {
  const s = S(preset('stretched'));
  for (const r of s.years) {
    near(r.cash, r.purchases - r.resale + r.supRep, 1e-6);
    near(r.expense, r.dep + r.supRep, 1e-6);
  }
  assert.equal(s.years[0].purchases, 288000);
  near(s.years[0].resale, 240 * 1200 / 128, 1e-6);
  assert.equal(s.years[3].supRep, 35190);
  assert.equal(s.years[1].cash, 0);   // in warranty and nothing bought: no cash at all
});

test('rule 7: ten-year cash − expense = the change in the fleet\'s book value', () => {
  for (let n = 2; n <= 8; n++) {
    for (let c = 1; c <= n; c++) {
      const s = S({ cycle: n, cohorts: c });
      const cash = s.years.reduce((a, r) => a + r.cash, 0);
      const exp = s.years.reduce((a, r) => a + r.expense, 0);
      near(cash - exp, s.book.end - s.book.start, 1e-3);
    }
  }
  assert.deepEqual(S(preset('wall')).book, { start: 18000, end: 153000 });
  assert.deepEqual(S(preset('staggered')).book, { start: 119250, end: 119250 });
});

test('rule 7: with c = n and equal cohorts the cash equals the expense every year (not 7: 35 and 34)', () => {
  const seven = S({ cycle: 7, cohorts: 7 });
  assert.notEqual(Math.round(seven.years[0].cash), Math.round(seven.years[0].expense));
  for (const n of [2, 3, 4, 5, 6, 8]) {
    const s = S({ cycle: n, cohorts: n });
    for (const r of s.years) near(r.cash, r.expense, 1e-6);
    assert.deepEqual(s.shown.cash, s.shown.expense);
  }
});

test('rule 8: the wall ratio, peak ÷ average', () => {
  near(S(preset('wall')).peak.ratio, 270000 / 88038, 1e-5);
  near(S(preset('stretched')).peak.ratio, 3.748137, 1e-5);
  assert.equal(S(preset('staggered')).peak.ratio, 1);
  assert.ok(S({ cycle: 4, cohorts: 2 }).peak.ratio < S({ cycle: 4, cohorts: 1 }).peak.ratio);
});

test('rule 9: shown series add up to the rounded total; rounding is half away from zero', () => {
  assert.deepEqual(logic.shownSeries([0.5, 0.5, 0.5, 0.5]), [1, 0, 1, 0]);
  assert.deepEqual(logic.shownSeries([76297.5, 76297.5]), [76298, 76297]);
  // sums on an exact .5 boundary round as the exact fractions do (per-device amounts are summed untidied)
  assert.deepEqual(S({ cycle: 8, cohorts: 3, slow: 0 }).shown.staff.slice(1, 3), [22703, 10410]);
  assert.deepEqual(S({ cycle: 8, cohorts: 1 }).shown.expense.slice(8), [35860, 35859]);
  for (let n = 2; n <= 8; n++) {
    for (let c = 1; c <= n; c++) {
      for (const staff of [true, false]) {
        const s = S({ cycle: n, cohorts: c, slow: 2.5, staff });
        for (const k of ['cash', 'expense', 'dep', 'staff']) {
          const exact = s.years.reduce((a, r) => a + r[k === 'expense' ? 'expense' : k], 0);
          assert.equal(s.totals[k], As.roundMoney(exact), `${k} n ${n} c ${c}`);
          for (const v of s.shown[k]) assert.ok(!Object.is(v, -0));
        }
      }
    }
  }
});

test('rule 10: changed marks: the economic life and the totals that moved', () => {
  assert.deepEqual(logic.changed(null, S({})), []);
  assert.deepEqual(logic.changed(S({}), S({})), []);
  assert.deepEqual(logic.changed(S({}), S({ staff: false })), ['econ', 'total', 'staff']);
  assert.deepEqual(logic.changed(S({ slow: 1 }), S({ slow: 1.5 })), ['econ', 'total', 'staff']);
  assert.deepEqual(logic.changed(S({ cycle: 4 }), S({ cycle: 5, cohorts: 1 })).slice(0, 1), ['total']);
  assert.deepEqual(logic.changed(S({ cohorts: 1 }), S({ cohorts: 4 })), ['cash', 'expense', 'staff', 'ratio']);
});

// ── asset.js (copied from fin-depreciation; its rules 2 and 4 as used here) ──

test('asset (copied): straight-line to the residual; book value; disposal at book value is neither', () => {
  const s = As.schedule(30000, 5, 3000, 'sl');
  assert.deepEqual(s.map((x) => x.dep), [5400, 5400, 5400, 5400, 5400]);
  assert.equal(As.bookAt(s, 30000, 0), 30000);
  assert.equal(As.bookAt(s, 30000, 3), 13800);
  assert.equal(As.bookAt(s, 30000, 9), 3000);
  assert.equal(As.disposal(s, 30000, 3, 13800).outcome, 'none');
  assert.equal(As.disposal(s, 30000, 3, 13000).outcome, 'loss');
  assert.equal(As.roundMoney(-62.5), -63);
  assert.ok(Object.is(As.tidy(-1e-9), 0));
});

// ── presets and the page model ──

test('presets: the SPEC table', () => {
  const want = {
    wall: { econ: 4, cash: [270000, 0, 0, 35190, 270000, 0, 0, 35190, 270000, 0], totals: [880380, 745380, 178800] },
    staggered: { econ: 4, cash: [76298, 76297, 76298, 76297, 76298, 76297, 76298, 76297, 76298, 76297], totals: [762975, 762975, 202500] },
    stretched: { econ: 4, cash: [285750, 0, 0, 35190, 41265, 50378, 64046, 285750, 0, 0], totals: [762379, 599093, 336735] },
    budget: { econ: 7, cash: [285750, 0, 0, 35190, 41265, 50378, 64046, 285750, 0, 0], totals: [762379, 599093, 0] },
    slow: { econ: 3, cash: Array(10).fill(84000), totals: [840000, 840000, 333600] }
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  for (const x of logic.presets) {
    const s = S(x.params), w = want[x.id];
    assert.equal(s.econ, w.econ, x.id);
    assert.deepEqual(s.shown.cash, w.cash, x.id);
    assert.deepEqual([s.totals.cash, s.totals.expense, s.totals.staff], w.totals, x.id);
  }
  assert.deepEqual(S(preset('wall')).shown.dep, Array(10).fill(67500));
  assert.deepEqual(S(preset('stretched')).shown.dep.slice(0, 4), [40821, 40822, 40821, 40822]);
});

test('presets: the defaults are the first preset', () => {
  assert.deepEqual(logic.presets[0].params, logic.defaults);
});

test('captions: lead, economic life, cash and note', () => {
  assert.deepEqual(logic.captionKey(S(preset('wall'))), { lead: 'leadOne', econ: 'atEcon', cash: 'cashWall', note: 'nStagger' });
  assert.deepEqual(logic.captionKey(S(preset('staggered'))), { lead: 'leadEvery', econ: 'atEcon', cash: 'cashFlat', note: 'nSame' });
  assert.deepEqual(logic.captionKey(S(preset('stretched'))), { lead: 'leadOne', econ: 'aboveEcon', cash: 'cashWall', note: 'nStagger' });
  assert.deepEqual(logic.captionKey(S(preset('budget'))), { lead: 'leadOne', econ: 'atEcon', cash: 'cashWall', note: 'nBudget' });
  assert.deepEqual(logic.captionKey(S({ cycle: 2, cohorts: 1 })), { lead: 'leadOne', econ: 'belowEcon', cash: 'cashWall', note: 'nStagger' });
  assert.deepEqual(logic.captionKey(S({ cycle: 6, cohorts: 2 })), { lead: 'leadSome', econ: 'aboveEcon', cash: 'cashSpread', note: 'nSame' });
});

test('the economic life stays inside the range for every param (no edge case to caption)', () => {
  for (let slow = 0; slow <= 4; slow += 0.5) {
    for (const staff of [true, false]) {
      const e = S({ slow, staff }).econ;
      assert.ok(e > logic.CYCLE_MIN && e < logic.CYCLE_MAX, `slow ${slow} staff ${staff}: ${e}`);
    }
  }
});

test('defaults and ranges are the SPEC params table', () => {
  assert.deepEqual(logic.defaults, { cycle: 4, cohorts: 1, slow: 1, staff: true });
  assert.deepEqual([logic.CYCLE_MIN, logic.CYCLE_MAX, logic.SLOW_MAX, logic.SLOW_STEP], [2, 8, 4, 0.5]);
  assert.deepEqual([logic.FLEET, logic.PRICE, logic.KEEP, logic.WARRANTY, logic.YEARS], [240, 1200, 0.5, 3, 10]);
  assert.deepEqual([logic.SUPPORT, logic.REPAIR, logic.FAIL1, logic.FAILGROW, logic.HOURS_FAIL, logic.HOURLY], [0.08, 0.25, 0.05, 1.5, 6, 40]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('stretched'));
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

/** Preset id → string key: stretched → pStretched. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
