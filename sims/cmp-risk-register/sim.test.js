// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-risk-register. Run: node --test sims/cmp-risk-register/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the scoring module's rules (promotable with it),
// then the page model and the presets, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const M = require('./scoring.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const R = (s, id) => s.risks.find((x) => x.id === id);
const ids = (s, f) => s.risks.filter(f).map((x) => x.id);

// ── tie-breaks ──

test('rule 4: equal to the appetite is within, one more is above', () => {
  assert.equal(M.above(8, 8), false);
  assert.equal(M.above(9, 8), true);
  assert.equal(M.above(25000, 25000), false);
  // change and share score exactly 8: within at appetite 8, above at 7
  assert.equal(R(S({}), 'share').signer, 'owner');
  assert.equal(R(S({ appS: 7 }), 'share').signer, 'board');
  // saas costs exactly 20 000 a year: within a money appetite of 25 000 and above 10 000
  assert.equal(R(S({ view: 'money' }), 'saas').signer, 'owner');
  assert.equal(R(S({ view: 'money', appM: 10000 }), 'saas').signer, 'board');
  // fire and share cost exactly 30 000: above 25 000, within 50 000
  assert.equal(R(S({ view: 'money', appM: 50000 }), 'fire').signer, 'owner');
});

test('rule 6: equal values share the rank (1, 1, 3); equal ranks keep register order', () => {
  assert.deepEqual(M.ranks([5, 5, 9]), [2, 2, 1]);
  assert.deepEqual(M.ranks([12, 10, 12, 4]), [1, 3, 1, 4]);
  assert.deepEqual(M.order([5, 9, 5, 9]), [1, 3, 0, 2]);
  const s = S({});
  const rank = (k) => Object.fromEntries(s.risks.map((x) => [x.id, x[k]]));
  assert.deepEqual(rank('rankScore'), { phish: 1, ransom: 3, laptop: 9, fire: 9, saas: 4, patch: 1, leaver: 7, change: 5, flood: 11, share: 5, invoice: 7, power: 11 });
  assert.deepEqual(rank('rankMoney'), { phish: 3, ransom: 1, laptop: 9, fire: 4, saas: 6, patch: 2, leaver: 10, change: 7, flood: 11, share: 4, invoice: 8, power: 11 });
  assert.deepEqual(s.order, ['phish', 'patch', 'ransom', 'saas', 'change', 'share', 'leaver', 'invoice', 'laptop', 'fire', 'flood', 'power']);
  assert.deepEqual(S({ view: 'money' }).order, ['ransom', 'patch', 'phish', 'fire', 'share', 'saas', 'change', 'invoice', 'laptop', 'leaver', 'flood', 'power']);
  // tied rows are marked, single ones not; the move is against the other view
  assert.equal(R(s, 'laptop').tied, true);
  assert.equal(R(s, 'saas').tied, false);
  assert.equal(R(S({ view: 'money' }), 'fire').move, 5);     // 9th by score, 4th by money
  assert.equal(R(S({ view: 'money' }), 'saas').move, -2);    // 4th by score, 6th by money
  assert.equal(R(s, 'fire').move, -5);
});

test('rule 10: the tie note picks the largest ratio, the first pair on equal ratios, none below 2', () => {
  const mk = (list) => list.map(([id, s0, e0]) => ({ id, s0, e0 }));
  assert.deepEqual(logic.tiePair(mk([['a', 5, 6000], ['b', 5, 30000], ['c', 8, 10000], ['d', 8, 30000]])),
    { a: 'a', b: 'b', hi: 30000, lo: 6000, s: 5 });
  // equal ratios (3 and 3): the first pair in register order
  assert.equal(logic.tiePair(mk([['a', 8, 10000], ['b', 8, 30000], ['c', 6, 2000], ['d', 6, 6000]])).a, 'a');
  // a ratio of exactly 2 counts, just under 2 does not
  assert.equal(logic.tiePair(mk([['a', 4, 1000], ['b', 4, 2000]])).b, 'b');
  assert.equal(logic.tiePair(mk([['a', 4, 1001], ['b', 4, 2000]])), null);
  assert.equal(logic.tiePair(mk([['a', 4, 1000], ['b', 6, 9000]])), null);
  // the ratio decides, not the difference: 3× (2 000 apart) beats 2.5× (15 000 apart)
  assert.equal(logic.tiePair(mk([['a', 4, 1000], ['b', 4, 3000], ['c', 6, 10000], ['d', 6, 25000]])).a, 'a');
  assert.deepEqual(S({}).tie, { a: 'laptop', b: 'fire', hi: 30000, lo: 6000, s: 5 });
});

test('rule 3: a reduction at the floor still costs and changes nothing; transfer at or below the deductible is free and empty', () => {
  const floor = M.treat({ l: 1, i: 5, t: 'reduce', dl: 2, di: 0, cost: 6000, avoid: 0 });
  assert.deepEqual([floor.l1, floor.i1, floor.cost, floor.noEffect, floor.verdict], [1, 5, 6000, true, 'not']);
  const ifloor = R(S({ ransomI: 1, ransomT: 'reduce' }), 'ransom');                     // impact already at 1
  assert.deepEqual([ifloor.i1, ifloor.e1, ifloor.noEffect], [1, 400, true]);
  assert.equal(M.treat({ l: 4, i: 3, t: 'reduce', di: 1, cost: 0 }).l1, 4);               // no dl: likelihood stays
  const part = M.treat({ l: 2, i: 3, t: 'reduce', dl: 2, di: 0, cost: 1000, avoid: 0 });   // only one level left
  assert.deepEqual([part.l1, part.noEffect], [1, false]);
  for (const i of [1, 2]) {
    const tr = M.treat({ l: 4, i, t: 'transfer', dl: 0, di: 0, cost: 0, avoid: 0 });
    assert.deepEqual([tr.i1, tr.cost, tr.noEffect, tr.verdict], [i, 0, true, 'even']);
  }
  const s = S({ phishL: 1, phishT: 'reduce', laptopT: 'transfer' });
  assert.deepEqual(s.noEffect, ['phish', 'laptop']);
  assert.equal(logic.captionKey(s).notes[0], 'nNoEffect');
});

test('rule 3: the verdict is worth above zero, even at zero, not below', () => {
  // phish reduced removes 32 000: a cost of 32 000 is break-even
  const at = (cost) => M.treat({ l: 4, i: 3, t: 'reduce', dl: 2, di: 0, cost, avoid: 0 }).verdict;
  assert.deepEqual([at(31999), at(32000), at(32001)], ['worth', 'even', 'not']);
  assert.equal(M.treat({ l: 4, i: 3, t: 'accept' }).verdict, 'none');
  assert.equal(M.treat({ l: 4, i: 3, t: 'bogus' }).t, 'accept');
});

// ── the scoring module ──

test('rules 1–2: score and expected loss of every cell (SPEC table); halves round up', () => {
  const grid = [
    [100, 500, 2000, 7500, 30000],
    [400, 2000, 8000, 30000, 120000],
    [1000, 5000, 20000, 75000, 300000],
    [2000, 10000, 40000, 150000, 600000],
    [6000, 30000, 120000, 450000, 1800000]
  ];
  for (let l = 1; l <= 5; l++) {
    for (let i = 1; i <= 5; i++) {
      assert.equal(M.score(l, i), l * i);
      assert.equal(M.loss(l, i), grid[l - 1][i - 1], `${l}×${i}`);
    }
  }
  assert.equal(M.hup(1, 2), 1);         // 0.5 → 1
  assert.equal(M.hup(3, 2), 2);         // 1.5 → 2
  assert.equal(M.hup(4, 3), 1);         // 1.33 → 1
  assert.equal(M.ale(1, 50), 1);        // €1 × 0.5 = 0.5 → 1
  assert.equal(M.ale(2000, 5), 100);
});

test('rule 2: the ordinal trap: 5×1 and 1×5 tie, 3×3 outranks both by score but not by money', () => {
  assert.equal(M.score(5, 1), M.score(1, 5));
  assert.ok(M.score(3, 3) > M.score(1, 5));
  assert.deepEqual([M.loss(5, 1), M.loss(1, 5), M.loss(3, 3)], [6000, 30000, 20000]);
  assert.ok(M.loss(1, 5) > M.loss(3, 3) && M.loss(3, 3) > M.loss(5, 1));
});

test('rule 3: each treatment\'s residual and cost', () => {
  const r = (t) => M.treat({ l: 2, i: 5, t, dl: 0, di: 2, cost: 15000, avoid: 400000 });
  const acc = r('accept'), red = r('reduce'), tra = r('transfer'), avo = r('avoid');
  assert.deepEqual([acc.l1, acc.i1, acc.s1, acc.e1, acc.cost], [2, 5, 10, 120000, 0]);
  assert.deepEqual([red.l1, red.i1, red.s1, red.e1, red.cost, red.removed, red.net], [2, 3, 6, 8000, 15000, 112000, 97000]);
  // premium = 0.2 × (600 000 − 10 000) × 150 % = 177 000; the firm keeps 10 000 per event
  assert.deepEqual([tra.l1, tra.i1, tra.s1, tra.e1, tra.cost, tra.net], [2, 2, 4, 2000, 177000, -59000]);
  assert.deepEqual([avo.l1, avo.i1, avo.s1, avo.e1, avo.cost, avo.removed], [null, null, 0, 0, 400000, 120000]);
  // likelihood reductions; fire transferred
  const ph = M.treat({ l: 4, i: 3, t: 'reduce', dl: 2, di: 0, cost: 6000 });
  assert.deepEqual([ph.l1, ph.i1, ph.e1], [2, 3, 8000]);
  assert.equal(M.treat({ l: 1, i: 5, t: 'transfer' }).cost, 44250);
  // the premium rounds halves up: 0.01 × €50 × 150 % = 0.75 → 1
  assert.equal(M.treat({ l: 1, i: 3, t: 'transfer' }, { f100: [1, 1, 1, 1, 1], eur: [0, 0, 50, 0, 0] }, { level: 2, load: 150 }).cost, 1);
  // the premium follows the likelihood: the insurer prices the risk
  assert.equal(M.treat({ l: 3, i: 5, t: 'transfer' }).cost, 442500);
});

test('rule 5: who signs, per view; needs treatment', () => {
  assert.equal(M.signer('avoid', 99, 8), 'avoided');
  assert.equal(M.signer('accept', 9, 8), 'board');
  assert.equal(M.signer('reduce', 8, 8), 'owner');
  const s = S(preset('money'));
  const sc = R(s, 'saas');
  assert.deepEqual([sc.sigScore, sc.sigMoney, sc.needScore, sc.needMoney], ['owner', 'owner', true, false]);
  const f = R(s, 'fire');
  assert.deepEqual([f.sigScore, f.sigMoney, f.signer, f.need], ['owner', 'board', 'board', true]);
  // avoided: nobody signs, in both views
  const a = R(S({ ransomT: 'avoid' }), 'ransom');
  assert.deepEqual([a.sigScore, a.sigMoney, a.s1, a.e1, a.cost], ['avoided', 'avoided', 0, 0, 400000]);
});

// ── the sim ──

test('rule 7: the register: twelve risks at their places, 348 000 € a year inherent', () => {
  const s = S({});
  assert.equal(s.risks.length, 12);
  assert.deepEqual(s.risks.map((x) => [x.l0, x.i0]),
    [[4, 3], [2, 5], [5, 1], [1, 5], [3, 3], [3, 4], [3, 2], [4, 2], [2, 2], [2, 4], [2, 3], [4, 1]]);
  assert.deepEqual(s.risks.map((x) => x.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.equal(s.tot.e0, 348000);
});

test('rule 8: params are normalised', () => {
  const n = logic.normalise({ view: 'x', appS: '30', appM: '25000', risk: 'constructor', phishL: '0', phishI: 7.4,
    phishT: 'toString', fireL: null, fireI: '', ransomT: 'avoid', junk: 1 });
  assert.equal(n.view, 'score');
  assert.equal(n.appS, 24);
  assert.equal(n.appM, 25000);
  assert.equal(n.risk, 'phish');
  assert.deepEqual([n.phishL, n.phishI, n.phishT], [1, 5, 'accept']);
  assert.deepEqual([n.fireL, n.fireI], [1, 5]);       // the defaults
  assert.equal(n.ransomT, 'avoid');
  assert.equal(n.junk, undefined);
  assert.equal(logic.normalise({ appM: 20000 }).appM, 25000);
  assert.equal(logic.normalise({ appS: -3 }).appS, 1);
  assert.equal(logic.normalise({ appS: 8.5 }).appS, 9);
  assert.equal(logic.normalise({ appS: true }).appS, 8);
  assert.equal(logic.normalise({ saasL: '4' }).saasL, 4);
  assert.equal(logic.normalise({ appS: 'Infinity' }).appS, 8);
  assert.equal(logic.normalise({ appS: -Infinity }).appS, 8);
  for (const v of logic.APP_M) assert.equal(logic.normalise({ appM: String(v) }).appM, v);
  assert.deepEqual(logic.APP_M, [5000, 10000, 25000, 50000, 100000]);
});

test('the matrix cells: above the appetite and the staircase edges, in both views', () => {
  const cell = (cs, l, i) => cs.find((c) => c.l === l && c.i === i);
  const sc = logic.cells('score', 8, 25000);
  assert.equal(sc.length, 25);
  assert.deepEqual([sc[0].l, sc[0].i, sc[24].l, sc[24].i], [5, 1, 1, 5]);   // top-left, bottom-right
  assert.equal(sc.filter((c) => c.above).length, 11);   // products of 9 and more
  const c33 = cell(sc, 3, 3);
  assert.deepEqual([c33.above, c33.edgeL, c33.edgeB], [true, true, true]);
  assert.deepEqual([cell(sc, 1, 5).above, cell(sc, 2, 4).above, cell(sc, 2, 5).edgeB], [false, false, true]);
  assert.equal(cell(sc, 3, 4).edgeL, false);                // 3×3 is above too
  const mo = logic.cells('money', 8, 25000);
  // three cells change sides: 1×5 and 2×4 (30 000) above in money only; 3×3 (20 000) above by score only
  assert.deepEqual([cell(mo, 1, 5).above, cell(mo, 2, 4).above, cell(mo, 3, 3).above], [true, true, false]);
  const diff = sc.filter((c, k) => c.above !== mo[k].above).map((c) => c.l + '×' + c.i);
  assert.deepEqual(diff.sort(), ['1×5', '2×4', '3×3']);
  assert.equal(cell(mo, 1, 5).edgeL, true);
  assert.equal(cell(mo, 1, 5).edgeB, false);                // bottom row: no edge below
  assert.equal(cell(logic.cells('score', 4, 25000), 5, 1).edgeL, false);   // left column: no edge to the left
  for (const cs of [sc, mo, logic.cells('score', 1, 5000), logic.cells('money', 24, 100000)]) {
    assert.ok(cs.every((c) => c.above || (!c.edgeL && !c.edgeB)), 'edges only on cells above');
  }
});

test('rule 9: switching the view lights the rows whose rank or signer changes', () => {
  const a = S(preset('treated')), b = S(Object.assign({}, preset('treated'), { view: 'money' }));
  const f = logic.flipped(a, b);
  for (const id of ['ransom', 'phish', 'fire', 'share', 'saas']) assert.ok(f.includes(id), id);
  assert.ok(!f.includes('flood'), 'flood ranks 11th in both, the owner signs in both');
  assert.deepEqual(logic.flipped(null, b), []);
  assert.deepEqual(logic.flipped(a, a), []);
  // a treatment that moves a signer only
  assert.deepEqual(logic.flipped(S({}), S({ phishT: 'reduce' })), ['phish']);
  assert.deepEqual(logic.flipped(S({}), S({ floodT: 'reduce' })), [], 'a treatment that moves neither');
});

test('presets: the SPEC table (need, board, cost, expected loss, notes)', () => {
  const rows = {
    register: [['phish', 'ransom', 'saas', 'patch'], ['phish', 'ransom', 'saas', 'patch'], 0, 348000, 'capScoreBoard', ['nTie']],
    treated: [['phish', 'ransom', 'saas', 'patch'], [], 51000, 121500, 'capScoreOk', ['nTie']],
    money: [['phish', 'ransom', 'fire', 'patch', 'share'], ['fire', 'share'], 51000, 121500, 'capMoneyBoard', ['nUp', 'nNotWorth']],
    'by-money': [['phish', 'ransom', 'fire', 'patch', 'share'], [], 50000, 86000, 'capMoneyOk', ['nDown']],
    insure: [['phish', 'ransom', 'fire', 'patch', 'share'], [], 244250, 78500, 'capMoneyOk', ['nDown', 'nNotWorth']]
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(rows));
  for (const [id, [need, board, cost, e1, cap, notes]] of Object.entries(rows)) {
    const s = S(preset(id));
    assert.deepEqual(ids(s, (x) => x.need), need, `${id} need`);
    assert.deepEqual(ids(s, (x) => x.signer === 'board'), board, `${id} board`);
    assert.equal(s.tot.cost, cost, `${id} cost`);
    assert.equal(s.tot.e0, 348000);
    assert.equal(s.tot.e1, e1, `${id} e1`);
    assert.equal(s.tot.exp, e1 + cost);
    assert.deepEqual(logic.captionKey(s), { key: cap, notes }, `${id} caption`);
  }
  const m = S(preset('money'));
  assert.deepEqual([m.up, m.down, m.notWorth], [['fire', 'share'], [], ['saas']]);
  assert.equal(R(m, 'saas').net, -3000);
  const i = S(preset('insure'));
  assert.deepEqual(i.notWorth, ['ransom', 'fire']);
  assert.deepEqual([R(i, 'ransom').net, R(i, 'fire').net], [-59000, -14750]);
  assert.equal(S(preset('by-money')).top, 'ransom');
});

test('the lists behind the notes; ranks stay on the inherent value; totals', () => {
  const d = S({ view: 'money' });
  assert.deepEqual([d.up, d.down], [['fire', 'share'], ['saas']]);
  assert.deepEqual(logic.captionKey(d), { key: 'capMoneyBoard', notes: ['nUp', 'nDown'] });
  assert.deepEqual(S({ view: 'money', phishT: 'avoid' }).notWorth, [], 'avoid is never "not worth it" in this list');
  assert.deepEqual(S({ laptopT: 'transfer' }).notWorth, [], 'break-even is not a loss');
  assert.deepEqual(S(preset('insure')).risks.map((x) => x.rankMoney), [3, 1, 9, 4, 6, 2, 10, 7, 11, 4, 8, 11]);
  const t = S(Object.assign({}, preset('money'), { laptopT: 'avoid' })).tot;
  assert.deepEqual([t.need, t.board, t.cost], [5, 2, 91000]);
  assert.equal(S({}).tot.need, 4);
});

test('rule 7: every control and avoid price of the register (SPEC table)', () => {
  const reduce = { phish: [6, 8000, 6000], ransom: [6, 8000, 15000], laptop: [4, 2000, 3000], fire: [3, 2000, 12000],
    saas: [6, 5000, 18000], patch: [4, 7500, 12000], leaver: [2, 500, 2000], change: [6, 5000, 4000],
    flood: [2, 500, 5000], share: [4, 7500, 5000], invoice: [3, 2000, 1000], power: [2, 400, 2500] };
  const avoid = { phish: 300000, ransom: 400000, laptop: 40000, fire: 35000, saas: 30000, patch: 60000, leaver: 15000,
    change: 25000, flood: 80000, share: 20000, invoice: 30000, power: 50000 };
  const all = (t) => Object.fromEntries(logic.RISKS.map((id) => [id + 'T', t]));
  const r = S(all('reduce')), a = S(all('avoid'));
  for (const id of logic.RISKS) {
    const x = R(r, id);
    assert.deepEqual([x.s1, x.e1, x.cost], reduce[id], id);
    assert.equal(R(a, id).cost, avoid[id], id);
  }
});

test('rule 10: at most two notes, no-effect first; the score view never shows the money notes', () => {
  const s = S({ view: 'money', phishL: 1, phishT: 'reduce', saasT: 'reduce', patchT: 'reduce', ransomT: 'reduce' });
  assert.deepEqual(logic.captionKey(s).notes, ['nNoEffect', 'nUp']);
  assert.ok(!logic.captionKey(S(preset('treated'))).notes.includes('nNotWorth'));
  // no tie of ratio 2 or more: no tie note
  const flat = S({ laptopL: 1, laptopI: 5, changeI: 4, changeL: 2, phishI: 4, phishL: 3 });
  assert.equal(flat.tie, null);
  assert.deepEqual(logic.captionKey(flat).notes, []);
});

test('the defaults are the register preset; every preset sits inside the ranges', () => {
  assert.deepEqual(logic.defaults, preset('register'));
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
  const p = P(preset('insure'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every risk, treatment, level, signer, caption and preset has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  const caps = ['capScoreBoard', 'capScoreOk', 'capMoneyBoard', 'capMoneyOk', 'nTie', 'nUp', 'nDown', 'nNotWorth', 'nNoEffect'];
  for (const lang of ['hr', 'en']) {
    for (const id of logic.RISKS) for (const k of ['r_', 'd_', 'c_', 'a_']) assert.ok(strings[lang][k + id], `${lang} ${k}${id}`);
    for (const tr of logic.TREATMENTS) assert.ok(strings[lang]['t_' + tr], `${lang} t_${tr}`);
    for (const n of logic.LEVELS) for (const k of ['l', 'lf', 'i']) assert.ok(strings[lang][k + n], `${lang} ${k}${n}`);
    for (const s of ['owner', 'board', 'avoided']) assert.ok(strings[lang]['sig_' + s], `${lang} sig_${s}`);
    for (const k of caps) assert.ok(strings[lang][k], `${lang} ${k}`);
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: by-money → pByMoney. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
