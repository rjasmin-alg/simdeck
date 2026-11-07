// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-vendor-tiers. Run: node --test sims/cmp-vendor-tiers/
// Rules and expected numbers: SPEC.md. Tie-breaks and boundaries first, then the rules in order, the presets (checked
// against the Python re-implementation in SPEC.md), the copied scoring module, and the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const M = require('./scoring.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const S = (over) => L.compute(Object.assign({}, L.defaults, over));
const preset = (id) => L.presets.find((x) => x.id === id).params;
const SP = (id, over) => L.compute(Object.assign({}, preset(id), over));
const row = (s, id) => s.rows.find((x) => x.id === id);
const sup = (id) => L.SUPPLIERS.find((x) => x.id === id);
const T = { view: 'tiered' };

// ── tie-breaks and boundaries first ──

test('rule 3 tie-break: equal spend → register order, also across the tier 2 / tier 3 boundary', () => {
  for (const id of ['office', 'pay', 'backup']) assert.equal(sup(id).spend, 10);
  const ord = L.spendOrder(L.SUPPLIERS);
  assert.deepEqual(ord.slice(20, 23), ['office', 'pay', 'backup']);      // positions 21–23
  const t = L.tiersBySpend(L.SUPPLIERS);
  assert.deepEqual([t.office, t.pay, t.backup], [2, 2, 3]);              // 9 + 13 = 22: the boundary falls inside the tie
  assert.ok(ord.indexOf('msp') < ord.indexOf('telco'), 'msp and telco both 18: register order');
  // the function itself on hand-made rows
  assert.deepEqual(L.spendOrder([{ id: 'b', spend: 5 }, { id: 'a', spend: 5 }, { id: 'c', spend: 9 }]), ['c', 'b', 'a']);
});

test('rule 5 tie-break: within a tier, equal impact → register order (budget 50 leaves the last impact-5 supplier out)', () => {
  const s = S({ view: 'tiered', budget: 50 });
  const five = s.rows.filter((x) => x.tier === 1 && x.i === 5).map((x) => x.id);
  assert.deepEqual(five, ['erp', 'msp', 'host', 'mail', 'backup', 'pspay']);
  assert.equal(row(s, 'backup').tiered.depth, 'audit');
  assert.equal(row(s, 'pspay').tiered.depth, null);
  assert.deepEqual(L.priority([{ id: 'x', acc: 1, pd: 0, crit: 0, hard: 0 }, { id: 'y', acc: 1, pd: 0, crit: 0, hard: 0 }], 'reach',
    { x: 1, y: 1 }), ['x', 'y']);
});

test('rule 5 tie-break: impact before register order inside a tier (the wholesaler, impact 3, comes after card payments)', () => {
  const s = S(T);
  const t1 = s.rows.filter((x) => x.tier === 1).map((x) => x.id);
  assert.deepEqual(t1, ['erp', 'msp', 'host', 'mail', 'backup', 'pspay', 'goods', 'web', 'wms']);
  assert.ok(L.SUPPLIERS.findIndex((x) => x.id === 'goods') < L.SUPPLIERS.findIndex((x) => x.id === 'pspay'));
});

test('rule 5 boundary: hours equal to what is left fit; one more does not', () => {
  const a = L.allocate(['a', 'b'], () => 'cert', 8);
  assert.deepEqual(a, { depth: { a: 'cert', b: 'cert' }, hours: 8 });
  const b = L.allocate(['a', 'b'], () => 'cert', 7);
  assert.deepEqual(b, { depth: { a: 'cert', b: null }, hours: 4 });
});

test('rule 5: a check that does not fit is skipped and the walk goes on to cheaper ones (budget 100)', () => {
  const s = S({ view: 'tiered', budget: 100 });
  const got = (n) => s.rows.filter((x) => x.tier === n && x.tiered.depth).map((x) => x.id);
  assert.equal(got(1).length, 9);                         // 90 h
  assert.deepEqual(got(2), ['courier', 'pay']);           // 8 h; the next 4 h no longer fit in 2 h
  assert.deepEqual(got(3), ['clean']);                    // but a 2 h questionnaire does
  assert.equal(s.tiered.hours, 100);
});

test('rule 10 tie-break: the misfits by spend: the riskiest pushed down, the one lifted most tiers (then the highest spend)', () => {
  const s = S({ rule: 'spend', view: 'tiered' });
  assert.deepEqual(L.spendMisfits(s), { down: 'msp', up: 'hw' });      // hw 3 → 1 (35 k€) beats clean 3 → 1 (28 k€)
  assert.equal(row(s, 'courier').reach - row(s, 'courier').bySpend, 1); // courier spends most, but moves only one tier
});

test('rule 10 tie-breaks on hand-made rows: equal risk pushed down → register order; a bigger jump beats a bigger spend', () => {
  const blank = (id) => ({ id, reach: 1, bySpend: 1, risk: 0, spend: 0 });
  const rows = L.SUPPLIERS.map((x) => blank(x.id));
  const set = (id, o) => Object.assign(rows.find((r) => r.id === id), o);
  set('erp', { reach: 1, bySpend: 2, risk: 5 });
  set('msp', { reach: 1, bySpend: 3, risk: 5 });
  set('clean', { reach: 3, bySpend: 2, spend: 999 });     // lifted one tier, huge spend, first in the register
  set('office', { reach: 3, bySpend: 1, spend: 1 });      // lifted two tiers
  set('host', { reach: 3, bySpend: 1, spend: 2 });        // lifted two tiers, more spend
  assert.deepEqual(L.spendMisfits({ rows }), { down: 'erp', up: 'host' });
  // equal jump and equal spend → register order; the bigger jump wins even when it comes later in the register
  set('office', { reach: 3, bySpend: 1, spend: 2 });
  assert.equal(L.spendMisfits({ rows }).up, 'office');
  set('office', { reach: 2, bySpend: 1, spend: 5 });
  assert.equal(L.spendMisfits({ rows }).up, 'host');
});

test('rule 7: covered rounds halves up on any risk (the register\'s risks are all multiples of 20)', () => {
  assert.equal(L.covered(1, 'audit'), 1);                 // 0.8 → 1
  assert.equal(L.covered(1, 'cert'), 1);                  // 0.5 → 1
  assert.equal(L.covered(1, 'quest'), 0);                 // 0.2 → 0
  for (const x of L.SUPPLIERS) assert.equal(L.risk(x) % 20, 0, x.id);
});

test('boundaries: budget rounding (halves up) and clamping; reveal only for true or "true"', () => {
  assert.equal(L.normalise({ budget: 55 }).budget, 60);
  assert.equal(L.normalise({ budget: 54.9 }).budget, 50);
  assert.equal(L.normalise({ budget: 0 }).budget, 10);
  assert.equal(L.normalise({ budget: 999 }).budget, 160);
  assert.equal(L.normalise({ budget: '90' }).budget, 90);
  for (const v of ['', ' ', 'x', '90x', null, NaN, Infinity, {}]) assert.equal(L.normalise({ budget: v }).budget, 60, String(v));
  assert.equal(L.normalise({ budget: '-50' }).budget, 10);
  assert.equal(L.normalise({ reveal: 'true' }).reveal, true);
  for (const v of ['false', 'TRUE', 1, 'yes', false]) assert.equal(L.normalise({ reveal: v }).reveal, false, String(v));
  assert.equal(L.normalise({ view: 'x', rule: 'y' }).view, 'same');
  assert.equal(L.normalise({ view: 'x', rule: 'y' }).rule, 'reach');
});

// ── the rules in order ──

test('rule 1: impact = 1 + 2 data + 2 access + critical + hard-to-replace critical, capped at 5', () => {
  const I = (pd, acc, crit, hard) => L.impact({ pd, acc, crit, hard });
  assert.equal(I(0, 0, 0, 0), 1);
  assert.equal(I(1, 0, 0, 0), 3);
  assert.equal(I(0, 1, 0, 0), 3);
  assert.equal(I(0, 0, 1, 0), 2);
  assert.equal(I(0, 0, 1, 1), 3);
  assert.equal(I(0, 0, 0, 1), 1, 'hard to replace counts only for a critical service');
  assert.equal(I(1, 0, 1, 0), 4);
  assert.equal(I(1, 1, 0, 0), 5);
  assert.equal(I(1, 1, 1, 1), 5, 'capped');
});

test('rule 1: risk = the risk register\'s expected loss at (likelihood, impact); total €593 600', () => {
  assert.equal(L.risk(sup('erp')), 120000);       // 0.2 a year × €600 000
  assert.equal(L.risk(sup('courier')), 75000);    // 0.5 × €150 000
  assert.equal(L.risk(sup('coffee')), 100);       // 0.05 × €2 000
  assert.equal(L.risk(sup('isp')), 10000);        // 1 × €10 000
  assert.equal(S({}).base, 593600);
  for (const x of L.SUPPLIERS) assert.equal(L.risk(x), M.loss(x.l, L.impact(x)), x.id);
});

test('rule 2: tier by reach: access, or critical and hard → 1; data, or critical → 2; else 3 (9 / 13 / 8)', () => {
  const R = (pd, acc, crit, hard) => L.tierByReach({ pd, acc, crit, hard });
  assert.equal(R(0, 1, 0, 0), 1);
  assert.equal(R(0, 0, 1, 1), 1);
  assert.equal(R(1, 0, 1, 0), 2);
  assert.equal(R(0, 0, 1, 0), 2);
  assert.equal(R(1, 0, 0, 0), 2);
  assert.equal(R(0, 0, 0, 1), 3);
  assert.equal(R(0, 0, 0, 0), 3);
  const n = [1, 2, 3].map((k) => L.SUPPLIERS.filter((x) => L.tierByReach(x) === k).length);
  assert.deepEqual(n, [9, 13, 8]);
});

test('rule 3: tier by spend keeps the tier sizes and fills them from the largest spend down', () => {
  const t = L.tiersBySpend(L.SUPPLIERS);
  const n = [1, 2, 3].map((k) => Object.values(t).filter((v) => v === k).length);
  assert.deepEqual(n, [9, 13, 8]);
  assert.deepEqual(L.spendOrder(L.SUPPLIERS).slice(0, 9), ['goods', 'courier', 'pack', 'erp', 'callc', 'host', 'hw', 'pspay', 'clean']);
  assert.equal(t.msp, 2);
  assert.equal(t.domain, 3);
});

test('rule 4: depths: audit 10 h / 80 %, certification 4 h / 50 %, questionnaire 2 h / 20 %; tier 1, 2, 3 in that order', () => {
  assert.deepEqual(L.DEPTHS, { audit: { hours: 10, cover: 80 }, cert: { hours: 4, cover: 50 }, quest: { hours: 2, cover: 20 } });
  assert.deepEqual(L.DEPTH_OF_TIER, { 1: 'audit', 2: 'cert', 3: 'quest' });
  const s = S({ view: 'tiered', budget: 160 });
  for (const x of s.rows) assert.equal(x.tiered.depth, L.DEPTH_OF_TIER[x.tier], x.id);
  assert.equal(s.tiered.hours, 9 * 10 + 13 * 4 + 8 * 2);
});

test('rule 5: by spend the hours go in spend order (budget 10: only the wholesaler gets its audit)', () => {
  const s = S({ view: 'tiered', rule: 'spend', budget: 10 });
  assert.deepEqual(s.rows.filter((x) => x.tiered.depth).map((x) => x.id), ['goods']);
  assert.deepEqual(s.rows.map((x) => x.id), L.spendOrder(L.SUPPLIERS));
  const r = S({ view: 'tiered', budget: 10 });
  assert.deepEqual(r.rows.filter((x) => x.tiered.depth).map((x) => x.id), ['erp']);
});

test('rule 6: one questionnaire for all: register order, 2 h each, never more than 60 h', () => {
  const s = S({ budget: 160 });
  assert.equal(s.same.hours, 60);
  assert.ok(s.rows.every((x) => x.same.depth === 'quest'));
  const t = S({ budget: 10 });
  assert.deepEqual(t.rows.filter((x) => x.same.depth).map((x) => x.id).sort(), ['clean', 'courier', 'erp', 'msp', 'office'].sort());
  assert.equal(t.same.hours, 10);
  assert.deepEqual(t.same.unchecked.length, 25);
});

test('rule 7: covered = risk × share (halves up); pct and per hour round halves up; 0 per hour when no hours', () => {
  assert.equal(L.covered(120000, 'audit'), 96000);
  assert.equal(L.covered(100, 'quest'), 20);
  assert.equal(L.covered(500, null), 0);
  const s = S({});
  assert.equal(s.same.covered, 118720);
  assert.equal(s.same.perHour, 1979);                // 118 720 / 60 = 1978.67
  assert.equal(s.same.pct, 20);
  assert.equal(s.tiered.covered, 288000);
  assert.equal(s.tiered.pct, 49);                    // 48.52 %
  assert.equal(s.tiered.uncheckedPct, 39);
  const e = L.compute(Object.assign({}, L.defaults, { budget: 10 }));
  assert.ok(e.same.perHour > 0);
  assert.equal(L.allocate([], () => 'quest', 10).hours, 0);
});

test('rule 8: behind the suppliers: the subcontractor (only an audit covers half), the shared provider (nothing covers)', () => {
  const s = SP('reveal');
  assert.equal(s.extra.sub.risk, 30000);
  assert.equal(s.extra.sub.tiered, 15000);
  assert.equal(s.extra.sub.same, 0);
  assert.deepEqual(s.extra.shared.ids, ['host', 'news', 'mail', 'backup', 'wms']);   // register order
  assert.deepEqual(SP('reveal', { rule: 'spend' }).extra.shared.ids, ['host', 'news', 'mail', 'backup', 'wms']);
  assert.equal(s.extra.shared.risk, 94000);          // 0.05 × (600 000 × 3 + 40 000 × 2)
  assert.equal(s.extra.shared.tiered, 0);
  assert.equal(s.total, 593600 + 30000 + 94000);
  assert.equal(s.tiered.covered, 414370 + 15000);
  // shares are of the displayed total, extras included
  assert.equal(s.tier1.pct, 55);                     // 396 000 / 717 600
  const r = SP('reveal', { budget: 60 });
  assert.equal(r.tiered.uncheckedPct, 33);           // 233 600 / 717 600 = 32.55 %
  assert.deepEqual(r.tiered.unchecked.slice(0, 3), ['goods', 'web', 'wms'], 'unchecked in priority order');
  // by spend the IT support contractor is tier 2: certification evidence does not reach its subcontractor
  assert.equal(SP('reveal', { rule: 'spend' }).extra.sub.tiered, 0);
  // and when the hours do not reach its audit, nothing covers it either
  assert.equal(SP('reveal', { budget: 10 }).extra.sub.tiered, 0);
  assert.equal(SP('reveal', { budget: 20 }).extra.sub.tiered, 15000);
  assert.equal(S({}).extra, null);
});

test('rule 10: caption keys and notes, the first two that apply', () => {
  const k = (id, over) => L.captionKey(SP(id, over));
  assert.deepEqual(k('same'), { key: 'capSame', notes: ['nTopSame'] });
  assert.deepEqual(k('tiered'), { key: 'capTiered', notes: ['nOut', 'nTopTiered'] });
  assert.deepEqual(k('enough'), { key: 'capTiered', notes: ['nTopTiered'] });
  assert.deepEqual(k('spend'), { key: 'capTiered', notes: ['nSpend', 'nTopTiered'] });
  assert.deepEqual(k('reveal'), { key: 'capTiered', notes: ['nSubOn', 'nShared'] });
  assert.deepEqual(k('reveal', { view: 'same' }), { key: 'capSame', notes: ['nSubOff', 'nShared'] });
  assert.deepEqual(k('spend', { view: 'same', budget: 40 }), { key: 'capSame', notes: ['nOut', 'nTopSame'] });
  assert.deepEqual(k('spend', { budget: 60 }), { key: 'capTiered', notes: ['nSpend', 'nOut'] });
});

// ── presets ──

test('presets: hours, covered, per hour for both strategies (SPEC.md table)', () => {
  const want = {
    same: { T: [60, 288000, 49, 4800], S: [60, 118720, 20, 1979] },
    tiered: { T: [60, 288000, 49, 4800], S: [60, 118720, 20, 1979] },
    enough: { T: [158, 414370, 70, 2623], S: [60, 118720, 20, 1979] },
    spend: { T: [158, 360040, 61, 2279], S: [60, 118720, 20, 1979] },
    reveal: { T: [158, 429370, 60, 2718], S: [60, 118720, 17, 1979] }
  };
  for (const x of L.presets) {
    const s = L.compute(x.params), w = want[x.id];
    assert.deepEqual([s.tiered.hours, s.tiered.covered, s.tiered.pct, s.tiered.perHour], w.T, x.id + ' tiered');
    assert.deepEqual([s.same.hours, s.same.covered, s.same.pct, s.same.perHour], w.S, x.id + ' same');
  }
  assert.equal(SP('same').tier1.pct, 67);
  assert.equal(SP('spend').tier1.pct, 48);
  assert.deepEqual(L.defaults, preset('same'));
});

// ── the copied scoring module ──

test('scoring.js is the risk register\'s copy: anchors, loss and halves-up rounding', () => {
  assert.deepEqual(M.SCALE, { f100: [5, 20, 50, 100, 300], eur: [2000, 10000, 40000, 150000, 600000] });
  assert.equal(M.loss(1, 5), 30000);
  assert.equal(M.hup(5, 2), 3);
  assert.equal(M.hup(4, 3), 1);
  assert.equal(M.ale(1880000, 5), 94000);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [L.defaults].concat(L.presets.map((x) => x.params))) {
    const s = L.initial(Object.assign({}, p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = Object.assign({}, preset('reveal'));
  const copy = structuredClone(p);
  assert.deepEqual(L.compute(p), L.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(L, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every supplier, depth, preset, caption and note has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  assert.match(html, /<script src="scoring\.js"><\/script>\s*<script src="strings\.js"><\/script>\s*<script src="sim\.js"><\/script>/);
  const keys = ['capSame', 'capTiered', 'nSubOn', 'nSubOff', 'nShared', 'nSpend', 'nOut', 'nTopSame', 'nTopTiered'];
  for (const lang of ['hr', 'en']) {
    for (const x of L.SUPPLIERS) assert.ok(strings[lang]['s_' + x.id], `${lang} s_${x.id}`);
    for (const d of Object.keys(L.DEPTHS)) for (const k of ['d_', 'dl_']) assert.ok(strings[lang][k + d], `${lang} ${k}${d}`);
    for (const n of [1, 2, 3]) for (const r of L.RULES) assert.ok(strings[lang]['r' + n + '_' + r], `${lang} r${n}_${r}`);
    for (const k of keys) assert.ok(strings[lang][k], `${lang} ${k}`);
    for (const x of L.presets) {
      const k = 'p' + x.id[0].toUpperCase() + x.id.slice(1);
      assert.ok(strings[lang][k], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][k + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
  for (const x of L.presets) for (const k of Object.keys(x.params)) assert.ok(k in L.defaults, `${x.id}: ${k}`);
});
