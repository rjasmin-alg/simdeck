// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the ham radio modes reference model (sim.js). Run: node --test sims/ham-modes/
// The model's rules first (tie-breaks first of all), then the data, then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

// ── tie-breaks: the designator at the edges of its rounding and its units ──

test('designator: a half rounds up (RR Appendix 1: 180.5 kHz is 181K)', () => {
  assert.equal(L.designator(180400), '180K');
  assert.equal(L.designator(180500), '181K');
  assert.equal(L.designator(180700), '181K');
  assert.equal(L.designator(12.45e3), '12K5');
});

test('designator: a value that rounds to 1000 of a unit is written in the next unit', () => {
  assert.equal(L.designator(999.4), '999H');
  assert.equal(L.designator(999.5), '1K00');
  assert.equal(L.designator(999.5e3), '1M00');
  assert.equal(L.designator(1000), '1K00');
});

// ── the designator (ITU RR Appendix 1 §1, its own examples) ──

test('designator: three figures with the unit letter in place of the decimal point', () => {
  const cases = [[0.002, 'H002'], [0.1, 'H100'], [25.3, '25H3'], [400, '400H'], [2400, '2K40'], [6000, '6K00'],
    [12500, '12K5'], [1.25e6, '1M25'], [2e6, '2M00'], [10e6, '10M0'], [202e6, '202M'], [5.65e9, '5G65']];
  for (const [hz, s] of cases) assert.equal(L.designator(hz), s, String(hz));
});

test('full designations: only with a class and a checked necessary bandwidth', () => {
  assert.deepEqual(L.designations(L.BY_ID.ssb), ['2K70J3E']);
  assert.deepEqual(L.designations(L.BY_ID.am), ['6K00A3E']);
  assert.deepEqual(L.designations(L.BY_ID.cw), ['100HA1A']);
  assert.deepEqual(L.designations(L.BY_ID.fm), ['16K0F3E']);
  // A class with a bandwidth that is a channel or a filter, not the necessary bandwidth: no designation.
  assert.deepEqual(L.designations(L.BY_ID.rtty), []);
  assert.deepEqual(L.designations(L.BY_ID.dmr), []);
});

// ── emission classes ──

test('an emission class decodes into its three symbols, by position', () => {
  assert.deepEqual(L.decodeEmission('J3E'), [{ pos: 1, sym: 'J' }, { pos: 2, sym: '3' }, { pos: 3, sym: 'E' }]);
  assert.deepEqual(L.decodeEmission('F1B').map((p) => p.sym), ['F', '1', 'B']);
});

test('an emission class with an unknown symbol, in the wrong place or of the wrong length is rejected', () => {
  assert.equal(L.decodeEmission('J3Z'), null); // Z is no information type
  assert.equal(L.decodeEmission('3JE'), null); // a digit cannot be first
  assert.equal(L.decodeEmission('J4E'), null); // there is no 4 in the second position
  assert.equal(L.decodeEmission('J3'), null);
  assert.equal(L.decodeEmission('J3EE'), null);
  assert.equal(L.decodeEmission(null), null);
});

test('every symbol has a name in both languages', () => {
  L.EMISSION.forEach((syms, i) => {
    for (const s of syms) for (const lang of ['hr', 'en']) assert.ok(strings[lang][`e${i + 1}_${s}`], `e${i + 1}_${s} (${lang})`);
  });
});

// ── bandwidth ──

test('the bandwidth axis runs from 1 Hz to 100 MHz on a log scale, clamped', () => {
  close(L.frac(1), 0);
  close(L.frac(1e8), 1);
  close(L.frac(100) - L.frac(10), L.frac(1e6) - L.frac(1e5));
  assert.equal(L.frac(0.5), 0);
  assert.equal(L.frac(1e9), 1);
});

test('bandwidths pick Hz under 1 kHz, kHz under 1 MHz, MHz above, and drop trailing zeros', () => {
  assert.deepEqual(L.formatHz(6), { num: '6', unit: 'Hz' });
  assert.deepEqual(L.formatHz(999), { num: '999', unit: 'Hz' });
  assert.deepEqual(L.formatHz(1000), { num: '1', unit: 'kHz' });
  assert.deepEqual(L.formatHz(2700), { num: '2.7', unit: 'kHz' });
  assert.deepEqual(L.formatHz(12500), { num: '12.5', unit: 'kHz' });
  assert.deepEqual(L.formatHz(5e6), { num: '5', unit: 'MHz' });
});

test('a bandwidth is one value, a range in one unit, or a range across units', () => {
  assert.equal(L.rangeOf([50, 50]).single, true);
  const cw = L.rangeOf([100, 500]);
  assert.deepEqual([cw.single, cw.same, cw.hi.unit], [false, true, 'Hz']);
  const ol = L.rangeOf([125, 2000]);
  assert.deepEqual([ol.same, ol.lo.unit, ol.hi.unit], [false, 'Hz', 'kHz']);
});

test('Doppler on a low-orbit pass: f · v / c, about 3.7 kHz at 2 m and 11 kHz at 70 cm', () => {
  close(L.dopplerKHz(145.9), 145.9e3 * 7.5 / 299792.458);
  assert.equal(L.dopplerKHz(145.9).toFixed(1), '3.7');
  assert.equal(L.dopplerKHz(435).toFixed(0), '11');
  close(L.dopplerKHz(435) / L.dopplerKHz(145), 3); // proportional to the frequency
  close(L.dopplerKHz(100, 0), 0);
});

// ── filters ──

test('filters: "all" keeps all 27, a category keeps the modes carrying it, in page order', () => {
  assert.equal(L.filterModes('all').length, 27);
  assert.deepEqual(L.filterModes('image'), ['sstv', 'atv', 'fax', 'datv']);
  assert.deepEqual(L.filterModes('weak'), ['cw', 'ft8', 'jt65', 'wspr']);
  assert.deepEqual(L.filterModes('nothing'), []);
  for (const c of L.CATS) {
    const ids = L.filterModes(c);
    assert.ok(ids.length > 0, c);
    assert.deepEqual(ids, L.MODES.map((m) => m.id).filter((id) => ids.includes(id)), `${c} keeps page order`);
  }
});

test('CW is not a voice mode (the original listed it under voice)', () => {
  assert.ok(!L.filterModes('voice').includes('cw'));
});

// ── the data ──

test('27 modes in six groups, unique ids, each with name, subtitle and description in both languages', () => {
  assert.equal(L.MODES.length, 27);
  assert.deepEqual(L.GROUPS.map((g) => L.MODES.filter((m) => m.group === g.id).length), [5, 3, 3, 6, 4, 6]);
  const ids = new Set();
  for (const m of L.MODES) {
    assert.ok(!ids.has(m.id), `duplicate ${m.id}`);
    ids.add(m.id);
    for (const lang of ['hr', 'en']) for (const k of ['n_', 's_', 'd_']) assert.ok(strings[lang][k + m.id], `${k}${m.id} (${lang})`);
  }
});

test('every mode: known categories and bands, valid classes, a bandwidth inside the axis, its rows and note in both languages', () => {
  const bands = ['HF', 'VHF', 'UHF', 'SHF', 'SAT'];
  for (const m of L.MODES) {
    assert.ok(m.cats.length && m.cats.every((c) => L.CATS.includes(c)), `${m.id} cats`);
    assert.ok(m.bands.length && m.bands.every((b) => bands.includes(b)), `${m.id} bands`);
    for (const c of m.cls || []) assert.ok(L.decodeEmission(c), `${m.id}: ${c}`);
    if (m.bw) assert.ok(m.bw[0] > 0 && m.bw[0] <= m.bw[1] && m.bw[0] >= L.AXIS_MIN && m.bw[1] <= L.AXIS_MAX, `${m.id} bw`);
    if (m.nb) assert.ok(m.cls && m.bw && m.nb >= m.bw[0] * 0.5 && m.nb <= m.bw[1], `${m.id} nb near its bandwidth`);
    assert.ok(m.rows.length > 0, `${m.id} rows`);
    for (const lang of ['hr', 'en']) {
      for (const r of m.rows) {
        assert.ok(strings[lang]['r_' + r], `r_${r} (${lang})`);
        assert.ok(strings[lang][`v_${m.id}_${r}`], `v_${m.id}_${r} (${lang})`);
      }
      assert.equal(!!strings[lang]['note_' + m.id], !!m.note, `note_${m.id} (${lang})`);
    }
  }
});

test('no value string is left without its mode and row (no orphans in the tables)', () => {
  const used = new Set();
  for (const m of L.MODES) for (const r of m.rows) used.add(`v_${m.id}_${r}`);
  for (const k of Object.keys(strings.hr)) if (k.startsWith('v_')) assert.ok(used.has(k), k);
});

test('the drawn state: groups in order holding every mode once, bars inside the axis', () => {
  const s = L.initial();
  assert.deepEqual(s.groups.map((g) => g.id), L.GROUPS.map((g) => g.id));
  assert.deepEqual(s.groups.flatMap((g) => g.modes), L.MODES.map((m) => m.id));
  assert.equal(s.bars.length, L.MODES.filter((m) => m.bw).length);
  for (const b of s.bars) {
    assert.ok(b.x >= 0 && b.x + b.w <= 1 + 1e-12, b.id);
    assert.equal(b.point, L.BY_ID[b.id].bw[0] === L.BY_ID[b.id].bw[1]);
  }
  assert.equal(s.ticks.length, 9);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe and deterministic', () => {
  const s = kit.stateAt(L, L.defaults, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  assert.deepEqual(L.initial(), s);
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('the page meta matches the model: a reference page without steps', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.class, 'reference');
  assert.equal(json.class, 'reference');
  assert.equal(meta.steps, undefined);
  assert.equal(L.steps, 0);
});
