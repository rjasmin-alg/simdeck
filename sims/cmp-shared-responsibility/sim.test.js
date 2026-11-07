// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-shared-responsibility. Run: node --test sims/cmp-shared-responsibility/
// Rules and expected numbers: SPEC.md. Tie-breaks and boundaries first, then the rules in order, the presets (checked
// against the Python re-implementation in SPEC.md), and the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const S = (over) => L.compute(Object.assign({}, L.defaults, over));
const preset = (id) => L.presets.find((x) => x.id === id).params;
const SP = (id, over) => L.compute(Object.assign({}, preset(id), over));
const row = (s, id) => s.rows.find((x) => x.id === id);
const bits = (...ks) => ks.reduce((a, k) => a + 2 ** k, 0);
const K = (id) => L.CONTROLS.findIndex((c) => c.id === id);

// ── tie-breaks and boundaries first ──

test('tie-break: gaps and double work are listed in register order (top of the stack first), so the caption names the topmost', () => {
  // mark power (11), then ident (1), then data (0): order of marking does not matter, register order does
  const s = S({ model: 'iaas', mask: bits(11, 1, 0) });
  assert.deepEqual(s.gaps, ['data', 'ident']);
  assert.deepEqual(s.extra, ['hwfail', 'disk', 'phys']);           // power is marked, the other three provider rows are not
  const t = S({ model: 'saas', mask: bits(3, 0) });
  assert.deepEqual(t.gaps, ['data', 'backup']);
  assert.equal(t.extra[0], 'appupd');
});

test('boundary: a layer is the provider\'s only when its index is strictly below the layers handed over', () => {
  // IaaS hands 2 layers: hw (index 1) is the provider's, os (index 2) is not
  assert.equal(L.owner('iaas', { layer: 'hw' }), 'provider');
  assert.equal(L.owner('iaas', { layer: 'os' }), 'customer');
  assert.equal(L.owner('paas', { layer: 'os' }), 'provider');
  assert.equal(L.owner('paas', { layer: 'app' }), 'customer');
  assert.equal(L.owner('saas', { layer: 'app' }), 'provider');
  assert.equal(L.owner('saas', { layer: 'data' }), 'customer');      // index 4 is never below 4
  assert.equal(L.owner('own', { layer: 'site' }), 'customer');       // index 0 is not below 0
});

test('boundary: mask 0 and 4095 are kept; one past either end is clamped', () => {
  assert.equal(L.normalise({ mask: 0 }).mask, 0);
  assert.equal(L.normalise({ mask: 4095 }).mask, 4095);
  assert.equal(L.normalise({ mask: 4096 }).mask, 4095);
  assert.equal(L.normalise({ mask: -1 }).mask, 0);
  assert.equal(L.MASK_MAX, 4095);
});

// ── rule 1: layers and controls ──

test('rule 1: twelve controls in five layers, bottom-up order of the layers, register order top of the stack first', () => {
  assert.deepEqual(L.LAYERS, ['site', 'hw', 'os', 'app', 'data']);
  assert.deepEqual(L.CONTROLS.map((c) => c.id),
    ['data', 'ident', 'access', 'backup', 'appupd', 'appavail', 'ospatch', 'osharden', 'hwfail', 'disk', 'phys', 'power']);
  const per = {};
  for (const c of L.CONTROLS) per[c.layer] = (per[c.layer] || 0) + 1;
  assert.deepEqual(per, { data: 4, app: 2, os: 2, hw: 2, site: 2 });
  // layers never go back down the register
  const idx = L.CONTROLS.map((c) => L.LAYERS.indexOf(c.layer));
  for (let k = 1; k < idx.length; k++) assert.ok(idx[k] <= idx[k - 1]);
});

// ── rule 2: the owner ──

test('rule 2: each model hands the provider 0, 2, 3, 4 layers: 0, 4, 6, 8 controls', () => {
  assert.deepEqual(L.HANDED, { own: 0, iaas: 2, paas: 3, saas: 4 });
  const counts = L.MODELS.map((m) => [S({ model: m }).provider, S({ model: m }).customer]);
  assert.deepEqual(counts, [[0, 12], [4, 8], [6, 6], [8, 4]]);
});

test('rule 2: the data layer stays with the customer in every model, and every row carries its owner per model', () => {
  for (const m of L.MODELS) {
    const s = S({ model: m });
    for (const id of ['data', 'ident', 'access', 'backup']) assert.equal(row(s, id).owner, 'customer', `${m} ${id}`);
    assert.deepEqual(s.kept, ['data', 'ident', 'access', 'backup']);
    for (const r of s.rows) assert.equal(r.by[m], r.owner);
  }
  assert.deepEqual(row(S({}), 'ospatch').by, { own: 'customer', iaas: 'customer', paas: 'provider', saas: 'provider' });
  assert.deepEqual(row(S({}), 'phys').by, { own: 'customer', iaas: 'provider', paas: 'provider', saas: 'provider' });
  assert.deepEqual(row(S({}), 'appupd').by, { own: 'customer', iaas: 'customer', paas: 'customer', saas: 'provider' });
});

// ── rule 3: belief and outcome ──

test('rule 3: bit k of the mask is control k; toggle flips exactly that bit', () => {
  assert.equal(L.assumed(bits(3), 3), true);
  assert.equal(L.assumed(bits(3), 2), false);
  assert.equal(L.assumed(bits(11), 11), true);
  assert.equal(L.toggle(0, 3), 8);
  assert.equal(L.toggle(8, 3), 0);
  assert.equal(L.toggle(4095, 0), 4094);
  for (let k = 0; k < 12; k++) assert.equal(L.toggle(L.toggle(1234, k), k), 1234);
  const s = S({ mask: bits(K('backup')) });
  assert.equal(row(s, 'backup').assumed, true);
  assert.equal(s.marked, 1);
});

test('rule 3: the contract\'s mask marks exactly the provider\'s rows: no gaps, no double work', () => {
  assert.deepEqual(L.MODELS.map(L.contractMask), [0, 3840, 4032, 4080]);
  for (const m of L.MODELS) {
    const s = S({ model: m, mask: L.contractMask(m) });
    assert.deepEqual([s.gaps, s.extra, s.ok, s.marked], [[], [], 12, s.provider], m);
  }
  assert.equal(L.contractMask('iaas'), preset('iaas').mask);
});

test('rule 3: the four outcomes', () => {
  assert.equal(L.outcome('provider', true), 'ok');
  assert.equal(L.outcome('provider', false), 'extra');
  assert.equal(L.outcome('customer', true), 'gap');
  assert.equal(L.outcome('customer', false), 'ok');
});

test('rule 3: on own servers every mark is a gap; switching the model keeps the marks', () => {
  const own = S({ model: 'own', mask: bits(8, 9, 10, 11) });
  assert.deepEqual(own.gaps, ['hwfail', 'disk', 'phys', 'power']);
  const iaas = S({ model: 'iaas', mask: bits(8, 9, 10, 11) });
  assert.deepEqual(iaas.gaps, []);
  assert.equal(iaas.p.mask, own.p.mask);
  assert.equal(own.ok + own.gaps.length + own.extra.length, 12);
});

test('rule 3: lift and shift with nothing marked: the four provider controls are double work, not gaps', () => {
  const s = S({ model: 'iaas', mask: 0 });
  assert.deepEqual(s.extra, ['hwfail', 'disk', 'phys', 'power']);
  assert.deepEqual(s.gaps, []);
  assert.equal(s.ok, 8);
});

// ── rule 4: the report ──

test('rule 4: closed → null everywhere; carve alone changes nothing', () => {
  const s = S({ model: 'iaas', carve: true });
  assert.equal(s.report, null);
  for (const r of s.rows) assert.equal(r.evidence, null);
});

test('rule 4: own servers → none for every row (no provider, no report)', () => {
  const s = S({ model: 'own', report: true, carve: true });
  for (const r of s.rows) assert.equal(r.evidence, 'none');
  assert.deepEqual(s.report, { proven: 0, carved: 0, yours: 0, none: 12 });
});

test('rule 4: the report proves the provider\'s rows only; the customer\'s are "yours" whatever the team believes', () => {
  for (const m of ['iaas', 'paas', 'saas']) {
    for (const mask of [0, 4095]) {
      const s = S({ model: m, mask, report: true });
      for (const r of s.rows) assert.equal(r.evidence, r.owner === 'provider' ? 'proven' : 'yours', `${m} ${mask} ${r.id}`);
      assert.equal(s.report.proven, s.provider);
      assert.equal(s.report.yours, s.customer);
    }
  }
});

test('rule 4: carve-out takes the building layer only, and only from the provider\'s rows', () => {
  const s = S({ model: 'paas', report: true, carve: true });
  assert.equal(row(s, 'phys').evidence, 'carved');
  assert.equal(row(s, 'power').evidence, 'carved');
  assert.equal(row(s, 'hwfail').evidence, 'proven');
  assert.equal(row(s, 'ospatch').evidence, 'proven');
  assert.equal(row(s, 'appupd').evidence, 'yours');
  assert.deepEqual(s.report, { proven: 4, carved: 2, yours: 6, none: 0 });
});

// ── rule 5: params ──

test('rule 5: normalise: model, mask strings and junk, rounding halves up, flags', () => {
  assert.deepEqual(L.normalise({}), { model: 'own', mask: 0, report: false, carve: false });
  assert.equal(L.normalise({ model: 'cloud' }).model, 'own');
  assert.equal(L.normalise({ model: 'paas' }).model, 'paas');
  assert.equal(L.normalise({ mask: '3840' }).mask, 3840);
  assert.equal(L.normalise({ mask: ' 12 ' }).mask, 12);
  for (const junk of ['abc', '', '  ', '12x', NaN, null, undefined, Infinity, {}, true]) {
    assert.equal(L.normalise({ mask: junk }).mask, 0, String(junk));
  }
  assert.equal(L.normalise({ mask: 2.5 }).mask, 3);
  assert.equal(L.normalise({ mask: 2.49 }).mask, 2);
  assert.equal(L.normalise({ mask: '7.5' }).mask, 8);
  assert.equal(L.normalise({ mask: 1e9 }).mask, 4095);
  assert.equal(L.normalise({ report: 'true' }).report, true);
  assert.equal(L.normalise({ report: 'TRUE' }).report, false);
  assert.equal(L.normalise({ carve: 1 }).carve, false);
  assert.equal(L.normalise({ carve: true }).carve, true);
});

// ── rule 6: presets (SPEC.md table, the Python output) ──

test('rule 6: presets match SPEC.md', () => {
  const want = {
    own: [0, 12, 0, [], [], null, ['nKeep']],
    iaas: [4, 8, 4, [], [], null, ['nKeep']],
    iaasOs: [4, 8, 6, ['ospatch', 'osharden'], [], null, ['nGap']],
    saasAll: [8, 4, 12, ['data', 'ident', 'access', 'backup'], [], null, ['nGap']],
    saasReport: [8, 4, 9, ['backup'], [], [8, 0, 4], ['nGap', 'nReport']],
    carve: [4, 8, 4, [], [], [2, 2, 8], ['nCarve']]
  };
  assert.deepEqual(L.presets.map((x) => x.id), Object.keys(want));
  for (const [id, w] of Object.entries(want)) {
    const s = SP(id);
    const rep = s.report ? [s.report.proven, s.report.carved, s.report.yours] : null;
    assert.deepEqual([s.provider, s.customer, s.marked, s.gaps, s.extra, rep, L.captionKey(s).notes], w, id);
    assert.equal(L.captionKey(s).key, 'cap_' + s.p.model);
  }
  assert.deepEqual(L.defaults, preset('own'));
});

// ── rule 7: the caption ──

test('rule 7: notes in order gap, report, extra, at most two; keep only when none applies', () => {
  const keys = (over) => L.captionKey(S(over)).notes;
  assert.deepEqual(keys({}), ['nKeep']);
  assert.deepEqual(keys({ model: 'iaas' }), ['nExtra']);
  assert.deepEqual(keys({ model: 'iaas', mask: 3840 }), ['nKeep']);
  assert.deepEqual(keys({ model: 'iaas', report: true }), ['nReport', 'nExtra']);
  assert.deepEqual(keys({ model: 'iaas', report: true, carve: true }), ['nCarve', 'nExtra']);
  assert.deepEqual(keys({ model: 'own', report: true }), ['nNoReport']);
  assert.deepEqual(keys({ model: 'own', report: true, carve: true }), ['nNoReport'], 'own servers: no report, carve or not');
  assert.deepEqual(keys({ model: 'iaas', mask: 1, report: true }), ['nGap', 'nReport'], 'three apply: only two shown');
  assert.deepEqual(keys({ model: 'own', report: true, mask: 1 }), ['nGap', 'nNoReport']);
  assert.deepEqual(keys({ model: 'iaas', mask: 1 }), ['nGap', 'nExtra']);
  assert.deepEqual(keys({ model: 'saas', mask: 4095, report: true }), ['nGap', 'nReport']);
  assert.equal(L.captionKey(S({ model: 'paas' })).key, 'cap_paas');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [L.defaults].concat(L.presets.map((x) => x.params))) {
    const s = L.initial(Object.assign({}, p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = Object.assign({}, preset('carve'));
  const copy = structuredClone(p);
  assert.deepEqual(L.compute(p), L.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(L, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every control, layer, model, outcome, preset, caption and note has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  assert.match(html, /<script src="strings\.js"><\/script>\s*<script src="sim\.js"><\/script>/);
  const keys = ['nGap', 'nNoReport', 'nCarve', 'nReport', 'nExtra', 'nKeep'];
  for (const lang of ['hr', 'en']) {
    for (const c of L.CONTROLS) for (const k of ['c_', 'g_']) assert.ok(strings[lang][k + c.id], `${lang} ${k}${c.id}`);
    // double work needs a provider owner: every control outside the data layer can be one
    for (const c of L.CONTROLS) if (c.layer !== 'data') assert.ok(strings[lang]['x_' + c.id], `${lang} x_${c.id}`);
    for (const l of L.LAYERS) assert.ok(strings[lang]['l_' + l], `${lang} l_${l}`);
    for (const m of L.MODELS) for (const k of ['m_', 'ms_', 'cap_']) assert.ok(strings[lang][k + m], `${lang} ${k}${m}`);
    for (const e of ['proven', 'carved', 'yours', 'none']) assert.ok(strings[lang]['e_' + e], `${lang} e_${e}`);
    for (const k of keys) assert.ok(strings[lang][k], `${lang} ${k}`);
    for (const x of L.presets) {
      const k = 'p' + x.id[0].toUpperCase() + x.id.slice(1);
      assert.ok(strings[lang][k], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][k + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
  for (const x of L.presets) for (const k of Object.keys(x.params)) assert.ok(k in L.defaults, `${x.id}: ${k}`);
});
