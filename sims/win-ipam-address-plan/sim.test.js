// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-ipam-address-plan's model (SPEC.md). Run: node --test sims/win-ipam-address-plan/
// Rules first, tie-breaks first of all; then the presets' numbers; then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const plan = (over) => logic.plan(P(over));
const R = (s, id) => s.ranges.find((r) => r.id === id);
const at = (s, id) => { const r = R(s, id); return r.placed ? [r.start, r.end] : null; };
const preset = (id) => plan(logic.presets.find((x) => x.id === id).params);

// ── tie-breaks ──

test('tie-break (rule 2): equal sizes keep the list order, and `first` swaps them', () => {
  const s = plan({});
  assert.deepEqual([at(s, 'management'), at(s, 'branch')], [[96, 111], [112, 127]]);
  const t = plan({ first: 'branch' });
  assert.deepEqual([at(t, 'branch'), at(t, 'management')], [[96, 111], [112, 127]]);
  assert.equal(at(t, 'sales')[0], 0, 'a larger range still goes first');
});

test('tie-break (rule 7): a later addition takes the lowest aligned free slot, reusing a gap', () => {
  const s = plan({ strategy: 'listed', first: 'guests', nabava: 'add' });
  assert.deepEqual(at(s, 'purchasing'), [8, 15], 'first fit in the hole .8–.63, not after the plan');
  assert.equal(R(s, 'purchasing').cursor, 196);
  assert.deepEqual(logic.firstFit(8, [[4, 11], [16, 31]]), 16, '.8 would cover .8–.15, past the end .11');
  assert.deepEqual(logic.firstFit(8, [[4, 15], [16, 31]]), 8);
  assert.equal(logic.firstFit(64, [[0, 62]]), null);
});

test('tie-break: the first unplaced is the first in placement order, not in list or address order', () => {
  const s = plan({ growth: 100 });
  assert.deepEqual(s.placeOrder.slice(-2), ['guests', 'link']);
  assert.equal(s.firstUnplaced, 'guests');
  const l = plan({ growth: 100, strategy: 'listed', first: 'link' });
  assert.equal(at(l, 'link')[0], 0);
  assert.equal(at(l, 'sales')[0], 128, 'the /25 waits for .128');
  assert.equal(l.firstUnplaced, 'production', 'then the /26 has no room');
});

// ── rules ──

test('rule 1: hosts with growth, rounded up; smallest prefix with 2^(32−n) − 2 ≥ needed', () => {
  assert.equal(logic.needed(60, 0, false), 60);
  assert.equal(logic.needed(6, 25, false), 8, '7.5 → 8');
  assert.equal(logic.needed(10, 25, false), 13, '12.5 → 13');
  assert.equal(logic.needed(60, 100, false), 120);
  assert.equal(logic.needed(200, 200, false), 600);
  assert.deepEqual([62, 63, 64, 126, 127].map(logic.prefixFor), [26, 25, 25, 25, 24]);
  assert.equal(logic.prefixFor(6), 29, '6 usable in a /29: exactly full');
  assert.equal(R(plan({ growth: 25 }), 'guests').prefix, 28, '8 hosts no longer fit a /29');
});

test('rule 1/6: a router link does not grow and stays a /30; /31 is never used', () => {
  for (const g of [0, 100, 200]) {
    const l = R(plan({ growth: g }), 'link');
    assert.deepEqual([l.needed, l.prefix, l.usable], [2, 30, 2]);
  }
  assert.equal(logic.prefixFor(1), 30, 'even one host gets a /30');
  assert.equal(logic.prefixFor(2), 30);
});

test('rule 2: largest first, each range aligned on its own size, no holes', () => {
  for (const over of [{}, { growth: 50, block: '10.20.0.0/16' }, { twoSites: true, block: '10.20.0.0/16', growth: 75 }]) {
    const s = plan(over);
    assert.equal(s.gapTotal, 0, JSON.stringify(over));
    for (const r of s.ranges) if (r.placed) assert.equal(r.start % r.total, 0, `${r.id} aligned`);
    const sizes = s.placeOrder.map((id) => R(s, id).total);
    assert.deepEqual(sizes, sizes.slice().sort((a, b) => b - a), 'non-increasing');
  }
});

test('rule 2: as listed keeps the list order and shows the alignment holes', () => {
  const s = plan({ strategy: 'listed', first: 'guests' });
  assert.deepEqual(s.placeOrder, ['guests', 'sales', 'production', 'management', 'branch', 'link']);
  assert.deepEqual(s.free.map((f) => [f.from, f.to, f.gap]), [[8, 63, true], [196, 255, false]]);
  assert.equal(s.gapTotal, 56);
  const same = plan({ strategy: 'listed' });
  assert.deepEqual(same.ranges.map((r) => r.start), plan({}).ranges.map((r) => r.start), 'the book order is already largest first');
});

test('rule 3: placed ranges never overlap and lie inside the block, for every param set', () => {
  for (const block of logic.blocks) for (const twoSites of [false, true]) for (const nabava of ['off', 'add', 'plan'])
    for (const strategy of ['largest', 'listed']) for (let growth = 0; growth <= 200; growth += 25) for (const first of ['', 'guests', 'link', 'st30']) {
      const s = plan({ block, twoSites, nabava, strategy, growth, first });
      const segs = s.ranges.filter((r) => r.placed).map((r) => [r.start, r.end]).sort((a, b) => a[0] - b[0]);
      for (const [a, b] of segs) assert.ok(a >= 0 && b < s.block.size && b - a + 1 > 0);
      for (let i = 1; i < segs.length; i++) assert.ok(segs[i][0] > segs[i - 1][1], 'no overlap');
      assert.equal(s.used + s.freeTotal, s.block.size);
      assert.equal(s.free.reduce((t, f) => t + f.size, 0), s.freeTotal);
      assert.equal(s.fits, s.ranges.every((r) => r.placed));
    }
});

test('rule 4: does not fit — sum error, first unplaced marked, every unplaced listed after the placed', () => {
  const s = plan({ growth: 100 });
  assert.equal(s.fits, false);
  assert.equal(s.sum, 276);
  assert.deepEqual(s.errors, [{ code: 'sum', sum: 276, space: 256 }, { code: 'noRoom', id: 'guests' }, { code: 'noRoom', id: 'link' }]);
  assert.deepEqual(s.order.slice(-2), ['guests', 'link']);
  const ok = plan({ growth: 100, block: '10.20.0.0/16' });
  assert.equal(ok.fits, true, 're-plan: the larger block');
  assert.deepEqual(ok.errors, []);
  const g25 = plan({ growth: 25 });
  assert.deepEqual([g25.fits, g25.sum, g25.firstUnplaced], [false, 260, 'link']);
});

test('rule 4: alignment alone can leave a range without a place (as listed)', () => {
  // No page param set reaches this (every failure there also has a sum error); the allocator still handles it.
  const a = logic.allocate([8, 128, 64], [0, 1, 2], 256);
  assert.deepEqual(a.start, [0, 128, null], 'sum 200 ≤ 256, but the /26 has no aligned place after .255');
  assert.deepEqual(a.holes, [{ start: 8, size: 120, before: 1 }]);
  assert.deepEqual(logic.allocate([64, 128, 8], logic.order([64, 128, 8], 'largest'), 256).start, [128, 0, 192], 'largest first fits it');
});

test('rule 5: IPAM hierarchy — range start and end are usable addresses; DHCP scopes and a static link', () => {
  const s = plan({});
  const sales = R(s, 'sales');
  assert.deepEqual([sales.network, sales.first, sales.last, sales.broadcast].map(logic.format),
    ['192.168.1.0', '192.168.1.1', '192.168.1.62', '192.168.1.63']);
  assert.equal(logic.format(sales.mask), '255.255.255.192');
  assert.equal(sales.managedBy, 'dhcp');
  assert.equal(R(s, 'link').managedBy, 'ipam');
  assert.equal(s.block.name, '192.168.1.0/24');
  assert.equal(logic.format(s.block.broadcast), '192.168.1.255');
  const big = plan({ block: '10.20.0.0/16' });
  assert.equal(logic.format(big.block.base), '10.20.0.0');
  assert.equal(big.block.size, 65536);
  assert.equal(plan({ block: 'bogus' }).block.name, '192.168.1.0/24', 'an unknown block falls back');
});

test('rule 7: Nabava added later keeps the plan; re-planned it moves R1–R2', () => {
  const add = plan({ nabava: 'add' });
  const base = plan({});
  for (const r of base.ranges) assert.deepEqual(at(add, r.id), at(base, r.id), `${r.id} stays`);
  const re = plan({ nabava: 'plan' });
  assert.deepEqual([at(re, 'purchasing'), at(re, 'link')], [[136, 143], [144, 147]]);
  assert.equal(re.gapTotal, 0);
  assert.equal(re.freeTotal, 108);
  assert.equal(plan({ nabava: 'add', twoSites: true }).ranges.length, 9, 'Nabava belongs to Grafo only');
});

test('rule 8: free intervals in front of a range are gaps, the tail is reserve', () => {
  assert.deepEqual(logic.freeOf([[0, 64], [144, 8]], 256), [[64, 143], [152, 255]]);
  assert.deepEqual(logic.freeOf([], 16), [[0, 15]]);
  assert.deepEqual(logic.freeOf([[0, 256]], 256), []);
  assert.deepEqual(plan({ growth: 100 }).free, [], 'the /24 is full');
});

test('rule 9: utilisation is today\'s hosts ÷ usable; full when no room is left (links never)', () => {
  const s = plan({});
  assert.deepEqual(['sales', 'guests', 'link'].map((id) => [R(s, id).util, R(s, id).full]), [[97, false], [100, true], [100, false]]);
  const g = plan({ growth: 100 });
  assert.deepEqual([R(g, 'sales').util, R(g, 'sales').full], [48, false]);
});

test('rule 2: a range that does not fit leaves the cursor where it was', () => {
  const s = plan({ growth: 125, strategy: 'listed', first: 'production' });
  assert.deepEqual(at(s, 'production'), [0, 127]);
  assert.equal(s.firstUnplaced, 'sales', 'the /24 cannot follow');
  assert.deepEqual(at(s, 'management'), [128, 159], 'the next range starts from .128, not after the failed one');
});

test('rule 4: the first unplaced follows placement order, not list order', () => {
  const s = plan({ growth: 50, first: 'link' });
  assert.equal(s.ranges[0].id, 'link', 'first in the list');
  assert.equal(s.firstUnplaced, 'guests');
});

test('rule 9: utilisation rounds to the nearest percent; full counts today\'s hosts', () => {
  assert.equal(R(plan({}), 'production').util, 93, '28 / 30 = 93.3');
  const g = R(plan({ growth: 125 }), 'guests');
  assert.deepEqual([g.needed, g.usable, g.full], [14, 14, false], 'room left today, though the plan with growth is exact');
});

test('growth is clamped to 0–200 %', () => {
  assert.equal(plan({ growth: 999 }).growth, 200);
  assert.equal(plan({ growth: -50 }).growth, 0);
});

// ── presets: the task's numbers (SPEC §4) ──

test('preset grafo: URM ch. 9 Primjer 1', () => {
  const s = preset('grafo');
  assert.deepEqual(s.order.map((id) => [id, R(s, id).prefix, ...at(s, id)]), [
    ['sales', 26, 0, 63], ['production', 27, 64, 95], ['management', 28, 96, 111],
    ['branch', 28, 112, 127], ['guests', 29, 128, 135], ['link', 30, 136, 139]]);
  assert.deepEqual(s.free.map((f) => [f.from, f.to, f.size, f.gap]), [[140, 255, 116, false]]);
  assert.equal(s.used, 140);
});

test('preset add-nabava: /29 at .144, gap .140–.143, free 108', () => {
  const s = preset('add-nabava');
  assert.deepEqual([R(s, 'purchasing').prefix, ...at(s, 'purchasing')], [29, 144, 151]);
  assert.deepEqual(s.free.map((f) => [f.from, f.to, f.gap]), [[140, 143, true], [152, 255, false]]);
  assert.deepEqual([s.gapTotal, s.freeTotal], [4, 108]);
});

test('preset double-growth: 276 > 256, Gosti first that cannot be placed', () => {
  const s = preset('double-growth');
  assert.deepEqual(s.placeOrder.map((id) => R(s, id).prefix), [25, 26, 27, 27, 28, 30]);
  assert.deepEqual(['sales', 'production', 'management', 'branch'].map((id) => at(s, id)), [[0, 127], [128, 191], [192, 223], [224, 255]]);
  assert.deepEqual([s.fits, s.firstUnplaced, s.sum], [false, 'guests', 276]);
});

test('preset as-listed: Gosti .0–.7, Prodaja from .64, 56 wasted', () => {
  const s = preset('as-listed');
  assert.deepEqual([at(s, 'guests'), at(s, 'sales'), at(s, 'link')], [[0, 7], [64, 127], [192, 195]]);
  assert.deepEqual([s.gapTotal, s.freeTotal], [56, 116]);
});

test('preset two-sites: Zagreb 10.20.0.0–10.20.5.255, Split 10.20.6.0–10.20.7.127, free from 10.20.7.128', () => {
  const s = preset('two-sites');
  const f = (id, k) => logic.format(R(s, id)[k]);
  assert.deepEqual([f('zg10', 'network'), f('zg60', 'broadcast'), f('st10', 'network'), f('st30', 'broadcast')],
    ['10.20.0.0', '10.20.5.255', '10.20.6.0', '10.20.7.127']);
  assert.ok(s.ranges.every((r) => r.prefix === (r.site === 'zagreb' ? 24 : 25)));
  assert.equal(logic.format(s.block.base + s.free[0].from), '10.20.7.128');
  assert.equal(s.freeTotal, 63616);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and many param sets', () => {
  for (const pr of logic.presets) {
    const s = plan(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
  for (const growth of [0, 75, 200]) for (const nabava of ['off', 'add', 'plan']) {
    const s = plan({ growth, nabava, strategy: 'listed' });
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('deterministic, an explorer, and initial does not mutate its params', () => {
  const p = P({ growth: 50, nabava: 'add', first: 'guests' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer');
  assert.deepEqual(kit.stateAt(logic, p, 0), logic.plan(p));
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has a label in the page', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  const ids = logic.presets.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length, 'unique ids');
  assert.ok(ids.length <= 9, 'keys 1–9');
  for (const pr of logic.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k} is a model param`);
    assert.ok(html.includes(`'${pr.id}'`), `${pr.id}: label in index.html`);
  }
});

test('every name, site and managed-by value has a string in both languages', () => {
  const keys = logic.GRAFO.concat([logic.NABAVA]).map((n) => 'n_' + n.id)
    .concat(['s_hq', 's_branch', 's_wan', 'm_dhcp', 'm_ipam']);
  for (const k of keys) assert.ok(strings.hr[k] && strings.en[k], k);
});
