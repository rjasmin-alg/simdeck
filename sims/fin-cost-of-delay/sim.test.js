// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-cost-of-delay. Run: node --test sims/fin-cost-of-delay/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the delay module's rules (promotable with it),
// then the page model, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const M = require('./delay.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const ids = (list) => list.map((x) => x.id).join(' ');
/** Items for M.order: [id, cd, d, v] with the list position i. */
const items = (...rows) => rows.map((r, i) => ({ id: r[0], cd: r[1], d: r[2], v: r[3] || 1, i }));
const rule = (s, id) => s.rules.find((r) => r.id === id);

// ── tie-breaks ──

test('rule 1a: equal keys keep the list order, for every rule', () => {
  const x = items(['p', 2000, 4, 3], ['q', 2000, 4, 3], ['r', 1000, 2, 3]);
  // p, q equal on everything; r has the same ratio (500) and loudness, a smaller cd and d
  assert.equal(ids(M.order(x, 'loud')), 'p q r');
  assert.equal(ids(M.order(x, 'ratio')), 'p q r');
  assert.equal(ids(M.order(x, 'big')), 'p q r');
  assert.equal(ids(M.order(x, 'small')), 'r p q');
  assert.equal(ids(M.order(x, 'value')), 'p q r');
  // reversed input order: the list position i decides, not where the item sits now
  assert.equal(ids(M.order(x.slice().reverse(), 'ratio')), 'p q r');
  // the page: every project 4 weeks → big and small both keep the list order
  const s = S(preset('same-size'));
  assert.deepEqual(rule(s, 'big').ids, logic.PROJECTS);
  assert.deepEqual(rule(s, 'small').ids, logic.PROJECTS);
});

test('rule 1b: ratios compare exactly; 1000/3 and 2000/6 tie, 1001/3 beats 2000/6', () => {
  assert.equal(M.byRatio({ cd: 1000, d: 3 }, { cd: 2000, d: 6 }), 0);
  assert.ok(M.byRatio({ cd: 1001, d: 3 }, { cd: 2000, d: 6 }) < 0);
  assert.ok(M.byRatio({ cd: 999, d: 3 }, { cd: 2000, d: 6 }) > 0);
  // a ratio shown rounded is only shown: 4000/12 = 333.3 → 333, 2500/2 = 1250, 500/3 = 166.7 → 167, 2500/4 = 625
  const s = S({ erpC: 4000, erpD: 12 });
  assert.equal(s.rows.find((r) => r.id === 'erp').ratio, 333);
  assert.equal(S({ order: 'cabde', portalC: 500, portalD: 3 }).rows.find((r) => r.id === 'portal').ratio, 167);
  assert.equal(S({ portalC: 2500, portalD: 2 }).rows.find((r) => r.id === 'portal').ratio, 1250);
  // 0.5 rounds up: 1500/4 = 375 exactly; 500/8 = 62.5 → 63
  assert.equal(S({ portalC: 500, portalD: 8 }).rows.find((r) => r.id === 'portal').ratio, 63);
});

test('rule 1c: an order with the best total is "best", even when it is not the ratio rule\'s order; ties are named', () => {
  // dash 2000/4 and invoice 1000/2 have the same ratio: either order of the two is best
  const over = { invoiceC: 1000, invoiceD: 2 };
  const a = S(Object.assign({ order: 'bdeac', n: 5 }, over));   // invoice, dash, …
  const b = S(Object.assign({ order: 'dbeac', n: 5 }, over));   // dash, invoice, …
  assert.equal(a.total, b.total);
  assert.equal(a.best, b.best);
  // the best order is sso (1000), portal (750), then invoice and dash (500 each) either way, erp (333)
  assert.deepEqual(a.tie, ['invoice', 'dash']);
  assert.equal(M.swapSaving({ cd: 1000, d: 2 }, { cd: 2000, d: 4 }), 0);
  const best = S(Object.assign({ order: 'eabdc' }, over));
  const best2 = S(Object.assign({ order: 'eadbc' }, over));
  assert.equal(best.outcome, 'best');
  assert.equal(best2.outcome, 'best');
  assert.equal(best.total, best2.total);
  assert.ok(logic.captionKey(best2).notes.includes('nTie'));
  assert.equal(best2.swap, null);
  // without a tie there is no note
  assert.equal(S().tie, null);
});

test('rule 1d: the biggest neighbour swap; the earlier of equal savings; none when nothing saves', () => {
  // queue x(1000,1) y(1000,1) z(3000,1) w(3000,1)… build two equal savings
  const q = items(['x', 1000, 1], ['y', 3000, 1], ['z', 1000, 1], ['w', 3000, 1]);
  // pairs: x→y saves 3000−1000 = 2000; y→z saves −2000; z→w saves 2000 → the earlier (pos 0)
  assert.deepEqual(M.bestSwap(q), { pos: 0, a: 'x', b: 'y', save: 2000 });
  assert.equal(M.bestSwap(items(['x', 3000, 1], ['y', 1000, 1])), null);
  assert.equal(M.bestSwap(items(['x', 1000, 1], ['y', 1000, 1])), null);   // saving 0 is no saving
  // the page's default: portal → invoice saves 3000×8 − 6000×2 = 12 000 (dash → portal saves 6000×4 − 2000×8 = 8 000)
  assert.deepEqual(S().swap, { pos: 2, a: 'portal', b: 'invoice', save: 12000 });
});

test('rule 1e: a rule row is "your order" only when the sequence is the same, not just the total', () => {
  const s = S(preset('same-value'));          // loud order; small and ratio both give the best order
  assert.equal(rule(s, 'loud').mine, true);
  assert.equal(rule(s, 'small').mine, false);
  const t = S(Object.assign({}, preset('same-value'), { order: 'ebdac' }));
  assert.equal(rule(t, 'small').mine, true);
  assert.equal(rule(t, 'ratio').mine, true);   // both rules give this very order
  assert.equal(t.outcome, 'best');
  // same total, other sequence: with equal durations big and small both give the list order (148 000), value 144 000
  const u = S(preset('same-size'));
  assert.equal(rule(u, 'big').total, rule(u, 'small').total);
  assert.equal(rule(u, 'big').mine, false);
  // same total as the ratio rule, other sequence (the tied pair the other way round): best, but not "= ratio"
  const v = S({ order: 'eadbc', invoiceC: 1000, invoiceD: 2 });
  assert.equal(v.outcome, 'best');
  assert.equal(rule(v, 'ratio').total, v.total);
  assert.equal(rule(v, 'ratio').mine, false);
  assert.deepEqual(rule(v, 'ratio').ids, ['sso', 'portal', 'invoice', 'dash', 'erp']);
});

// review additions (a fresh reviewer's mutations that the tests above missed)

test('rule 1c: the first tied pair in the ratio order, not the last and not by queue place; also when not best and at n=4', () => {
  // two tie groups: portal 6000/8 = invoice 1500/2 = 750, erp 4000/8 = dash 2000/4 = 500
  const s = S({ invoiceC: 1500, invoiceD: 2, erpD: 8 });
  assert.equal(s.outcome, 'worse');
  assert.deepEqual(s.tie, ['portal', 'invoice']);
  assert.deepEqual(logic.captionKey(s).notes, ['nSwap', 'nTie']);   // nTie with a worse queue too, after nSwap
  assert.deepEqual(S({ n: 4, invoiceC: 1000, invoiceD: 2 }).tie, ['invoice', 'dash']);
});

test('rule 1d: the last neighbour pair is looked at too', () => {
  assert.deepEqual(S({ order: 'beacd' }).swap, { pos: 3, a: 'erp', b: 'dash', save: 8000 });
});

test('rule 1b in the module: the ratio rule never sorts by rounded ratios', () => {
  assert.equal(ids(M.order(items(['p', 2000, 6], ['q', 1001, 3]), 'ratio')), 'q p');
  // 1000/3 = 333.3 and 3001/9 = 333.4 both round to 333: only the exact comparison puts q first
  assert.equal(ids(M.order(items(['p', 1000, 3], ['q', 3001, 9]), 'ratio')), 'q p');
});

test('rules 8–9: the rest keep their present order; the ends and projects out of play do not move', () => {
  assert.equal(logic.move(P({ n: 3, order: 'ceabd' }), 'portal', 1), 'cbaed');
  assert.equal(logic.ruleOrder(P({ n: 3, order: 'ceabd' }), 'ratio'), 'baced');
  assert.equal(logic.normalise({ order: 'baab' }).order, 'bacde');
  assert.equal(logic.move(P({ n: 3 }), 'invoice', 1), 'cdabe');   // last of three in play
  assert.equal(logic.move(P({ n: 3 }), 'sso', 1), 'cdabe');       // not in play
});

test('normalise: snap to the nearest step; Infinity, n=2 and loudness 0 take the default; "4" is 4', () => {
  assert.equal(logic.normalise({ portalC: 760 }).portalC, 1000);
  assert.equal(logic.normalise({ portalC: 'Infinity' }).portalC, logic.defaults.portalC);
  assert.equal(logic.normalise({ n: 2 }).n, 5);
  assert.equal(logic.normalise({ ssoV: 0 }).ssoV, logic.defaults.ssoV);
  assert.equal(logic.normalise({ n: '4' }).n, 4);
});

test('the bars scale to the largest total, your order included', () => {
  const s = S({ order: 'cdaeb' });   // the ratio order reversed: worse than every rule
  assert.equal(s.total, 330000);
  assert.equal(s.worst, s.total);
  assert.ok(s.rules.every((r) => r.total < s.total));
});

// ── the delay module ──

test('rule 2: one team, no gaps: each project starts when the one before is done', () => {
  const sch = M.schedule(items(['a', 4000, 12], ['b', 2000, 4], ['c', 6000, 8]));
  assert.deepEqual(sch.rows.map((r) => [r.start, r.done]), [[0, 12], [12, 16], [16, 24]]);
  assert.equal(sch.weeks, 24);
});

test('rule 3: a project loses cd × its delivery week; waiting and building add up to it', () => {
  const sch = M.schedule(items(['a', 4000, 12], ['b', 2000, 4]));
  assert.deepEqual(sch.rows.map((r) => [r.wait, r.build, r.lost]), [[0, 48000, 48000], [24000, 8000, 32000]]);
  assert.deepEqual([sch.total, sch.wait, sch.build], [80000, 24000, 56000]);
  // the building part is the same in every order
  const other = M.schedule(items(['b', 2000, 4], ['a', 4000, 12]));
  assert.equal(other.build, sch.build);
  assert.notEqual(other.total, sch.total);
});

test('rule 5: the five rules on the base projects (SPEC table)', () => {
  const s = S();
  const want = {
    loud: ['erp dash portal invoice sso', 329000],
    big: ['erp portal dash invoice sso', 321000],
    small: ['sso invoice dash portal erp', 222000],
    value: ['portal erp invoice dash sso', 273000],
    ratio: ['invoice sso portal dash erp', 213000]
  };
  for (const [k, [o, tot]] of Object.entries(want)) {
    assert.equal(rule(s, k).ids.join(' '), o, k);
    assert.equal(rule(s, k).total, tot, k);
  }
  assert.deepEqual(s.rules.filter((r) => r.best).map((r) => r.id), ['ratio']);
});

test('rule 6: the ratio order is the least total over every order (presets and 300 random queues)', () => {
  for (const pr of logic.presets) {
    for (const n of logic.COUNTS) {
      const s = S(Object.assign({}, pr.params, { n }));
      const q = s.ids.map((id) => ({ id, cd: s.p[id + 'C'], d: s.p[id + 'D'] }));
      assert.equal(s.best, M.bruteBest(q), pr.id + ' n=' + n);
    }
  }
  const r = kit.rng(7);
  for (let k = 0; k < 300; k++) {
    const n = 2 + r.int(5);
    const q = Array.from({ length: n }, (_, i) => ({ id: 'p' + i, i, cd: 500 * (1 + r.int(40)), d: 1 + r.int(20), v: 1 }));
    assert.equal(M.schedule(M.order(q, 'ratio')).total, M.bruteBest(q));
    // and no neighbour swap of the ratio order saves anything
    assert.equal(M.bestSwap(M.order(q, 'ratio')), null);
  }
});

test('rule 7: swapping neighbours changes the total by exactly cd_b × d_a − cd_a × d_b', () => {
  const r = kit.rng(11);
  for (let k = 0; k < 200; k++) {
    const q = Array.from({ length: 4 }, (_, i) => ({ id: 'p' + i, cd: 500 * (1 + r.int(40)), d: 1 + r.int(20) }));
    const i = r.int(3);
    const sw = q.slice();
    sw[i] = q[i + 1]; sw[i + 1] = q[i];
    assert.equal(M.schedule(q).total - M.schedule(sw).total, M.swapSaving(q[i], q[i + 1]));
  }
});

// ── the page model ──

test('rule 4: the bands stack: the first delivered on top, each on those delivered after it', () => {
  const s = S();
  assert.deepEqual(s.rows.map((r) => [r.id, r.lo, r.hi]), [
    ['erp', 12000, 16000], ['dash', 10000, 12000], ['portal', 4000, 10000], ['invoice', 1000, 4000], ['sso', 0, 1000]
  ]);
  assert.equal(s.rate, 16000);
  // the best order's outline: starts at the full rate, steps down at each delivery, ends at 0
  assert.deepEqual(s.stairs[0], [0, 16000]);
  assert.deepEqual(s.stairs[s.stairs.length - 1], [27, 0]);
  assert.deepEqual(s.stairs.slice(1, 3), [[2, 16000], [2, 13000]]);   // invoice done in week 2
});

test('rule 8: n takes the first n projects of the list; the queue keeps their order; the rest keep their place', () => {
  const s = S({ n: 3 });
  assert.deepEqual(s.ids, ['erp', 'portal', 'invoice']);
  assert.equal(s.total, 234000);
  assert.equal(s.best, 154000);
  assert.equal(logic.ruleOrder(P({ n: 3 }), 'ratio'), 'bacde');
  assert.equal(logic.move(P({ n: 3 }), 'portal', 1), 'cbade');   // erp, invoice, portal; then dash, sso as they were
  // a project out of play cannot be moved or selected
  assert.equal(logic.move(P({ n: 3 }), 'sso', -1), 'cdabe');
  assert.equal(S({ n: 3, proj: 'sso' }).p.proj, 'portal');
});

test('rule 9: moving at the ends changes nothing; one step swaps neighbours', () => {
  assert.equal(logic.move(P(), 'erp', -1), 'cdabe');     // already first
  assert.equal(logic.move(P(), 'sso', 1), 'cdabe');      // already last
  assert.equal(logic.move(P(), 'dash', -1), 'dcabe');
  assert.equal(logic.move(P(), 'dash', 1), 'cadbe');
  // eight moves turn the loud order into the ratio order
  let p = P();
  for (const [id, dir] of [['invoice', -1], ['invoice', -1], ['invoice', -1], ['sso', -1], ['sso', -1], ['sso', -1], ['portal', -1], ['portal', -1]]) {
    p = Object.assign({}, p, { order: logic.move(p, id, dir) });
  }
  assert.equal(S(p).ids.join(' '), 'invoice sso portal erp dash');
  p = Object.assign({}, p, { order: logic.move(p, 'dash', -1) });
  assert.equal(S(p).outcome, 'best');
});

test('presets: the SPEC table', () => {
  const want = {
    loud: [329000, 213000, 'worse', 'nSwap'],
    big: [321000, 213000, 'worse', 'nSwap'],
    quick: [222000, 213000, 'worse', 'nSwap'],
    ratio: [213000, 213000, 'best', null],
    'same-value': [315000, 159000, 'worse', 'nSwap'],
    'same-size': [172000, 144000, 'worse', 'nSwap']
  };
  for (const pr of logic.presets) {
    const s = logic.compute(pr.params);
    const w = want[pr.id];
    assert.deepEqual([s.total, s.best, s.outcome, logic.captionKey(s).notes[0] || null], w, pr.id);
    assert.equal(s.wait + s.build, s.total);
  }
  assert.equal(S(preset('quick')).swap.save, 8000);
  assert.deepEqual(S(preset('same-value')).rules.filter((r) => r.best).map((r) => r.id), ['small', 'ratio']);
  assert.deepEqual(S(preset('same-size')).rules.filter((r) => r.best).map((r) => r.id), ['value', 'ratio']);
});

test('normalise: bad values from a URL take the default; ranges clamp and snap; orders are made whole', () => {
  const p = logic.normalise({ portalC: '99999', invoiceC: 740, erpD: 0, dashD: 'x', ssoV: 9, n: 6, order: 'eeqa', proj: 'nope' });
  assert.equal(p.portalC, 20000);
  assert.equal(p.invoiceC, 500);
  assert.equal(p.erpD, 1);
  assert.equal(p.dashD, logic.defaults.dashD);
  assert.equal(p.ssoV, logic.defaults.ssoV);
  assert.equal(p.n, 5);
  assert.equal(p.order, 'eabcd');
  assert.equal(p.proj, 'portal');
  assert.equal(logic.normalise({ order: 5 }).order, logic.defaults.order);
  assert.equal(logic.normalise({ portalC: '', erpC: true }).portalC, logic.defaults.portalC);
  assert.equal(logic.normalise({ erpC: true }).erpC, logic.defaults.erpC);
  assert.equal(logic.ORDERS.length, 120);
  assert.ok(logic.ORDERS.includes(logic.normalise({ order: 'zz' }).order));
});

test('rule 10: the changed mark follows the outcome', () => {
  const a = S(), b = S(preset('ratio'));
  assert.deepEqual(logic.flipped(a, b), ['outcome']);
  assert.deepEqual(logic.flipped(a, S(preset('big'))), []);
  assert.deepEqual(logic.flipped(null, b), []);
  assert.deepEqual(logic.captionKey(b), { key: 'capBest', notes: [] });
  assert.deepEqual(logic.captionKey(a), { key: 'capWorse', notes: ['nSwap'] });
});

test('axes: nice steps from 0 past the top', () => {
  assert.deepEqual(logic.axis(16000, 4).ticks, [0, 5000, 10000, 15000, 20000]);
  assert.deepEqual(logic.axis(27, 6), { hi: 30, step: 5, ticks: [0, 5, 10, 15, 20, 25, 30] });
  assert.equal(logic.axis(3, 6).hi, 3);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const pr of logic.presets) {
    const s = logic.initial(P(pr.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P({ n: 4, order: 'dcba' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and the page lists them all', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(logic.steps, 0);
  for (const pr of logic.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.deepEqual(logic.normalise(pr.params), pr.params, pr.id + ' is already normal');
    assert.ok(logic.ORDERS.includes(pr.params.order), pr.id);
  }
  for (const id of logic.presets.map((x) => x.id)) assert.ok(html.includes(`'${id}'`) || html.includes(` ${id}:`), id);
});
