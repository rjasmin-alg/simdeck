// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for geo-units: units of length, mass and volume (sim.js), rules from SPEC.md, tie-breaks first; then the
// generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const U = logic.units;
const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
const preset = (id) => S(logic.PRESETS.find((p) => p.id === id).params);
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-3, a + ' ≈ ' + b);

// ── tie-breaks first ──

test('tie-break: the best unit is the largest one giving a whole number of at least 1 (rule 4)', () => {
  const best = Object.fromEntries(logic.THING_IDS.map((id) => [id, U.best(logic.THINGS[id], 'length')]));
  assert.deepEqual(best, { ant: 'mm', fingers: 'dm', pencil: 'cm', desk: 'dm', board: 'dm', path: 'km' });
  // not the largest unit that fits once (pencil: 1 dm fits, but 14 cm is whole)
  assert.equal(U.measure(140, 'length', 'dm').count, 1);
  assert.equal(U.best(150, 'mass'), 'dag');
  assert.equal(U.best(2350, 'mass'), 'dag');
  assert.equal(U.best(1000, 'mass'), 'kg');
  assert.equal(S({ thing: 'board' }).best, 'dm');
});

test('tie-break: a new thing fits the smallest zoom whose view is at least 1.15 times as long (rule 6)', () => {
  const z = Object.fromEntries(logic.THING_IDS.map((id) => [id, U.fitZoom(logic.THINGS[id])]));
  assert.deepEqual(z, { ant: 0, fingers: 8, pencil: 10, desk: 17, board: 21, path: 40 });
  close(U.viewWidth(10), 213.3935);
  close(U.viewWidth(17), 1600.2257);
  close(U.viewWidth(21), 5060.3580);
  // one step less would not fit
  assert.ok(U.viewWidth(9) < 1.15 * 140);
  assert.ok(U.viewWidth(16) < 1.15 * 1200);
  // longer than the longest view: the longest
  assert.equal(U.fitZoom(5e6), 40);
  // a zoom that is not a number falls back to the thing's fit
  assert.equal(S({ thing: 'desk', zoom: 'x' }).zoom, 17);
});

test('tie-break: an empty right pan weighs 0, so the left pan goes down (rule 9)', () => {
  const s = S({ mode: 'balance', item: 'clip', w: [] });
  assert.equal(s.mR, 0);
  assert.equal(s.side, 'left');
  assert.equal(s.tilt, -12);
  assert.equal(s.weighed, false);
});

test('tie-break: a reading over a million is refused, exactly a million is allowed (rule 11)', () => {
  assert.equal(U.table('length', 3, 'km', 'mm').over, true);
  const one = U.table('length', 1, 'km', 'mm');
  assert.equal(one.whole, 1000000);
  assert.equal(one.over, false);
  assert.equal(U.table('length', 9, 'km', 'm').whole, 9000);
});

// ── the rules ──

test('rule 1: unknown choices fall back, numbers are clamped, units of another family are replaced', () => {
  const s = S({ mode: 'nope', thing: 'car', unit: 'g' });
  assert.equal(s.mode, 'ruler');
  assert.equal(s.thing, 'pencil');
  assert.equal(s.unit, 'cm');
  assert.equal(S({ zoom: 99 }).zoom, 40);
  assert.equal(S({ zoom: -3 }).zoom, 0);
  const tv = S({ mode: 'table', qty: 'volume', from: 'm', to: 'km' });
  assert.equal(tv.from, 'l');
  assert.equal(tv.to, 'dl');
  const tl = S({ mode: 'table', qty: 'oil', from: 'l', to: 'dl' });
  assert.equal(tl.qty, 'length');
  assert.equal(tl.from, 'dm');
  assert.equal(tl.to, 'm');
  assert.equal(S({ mode: 'table', n: 0 }).n, 1);
  assert.equal(S({ mode: 'table', n: 5000 }).n, 1000);
  assert.equal(S({ mode: 'table', n: 12.6 }).n, 13);
  assert.equal(S({ mode: 'balance', item: 'apple', vs: 'apple' }).side, 'level');
  assert.deepEqual(U.normWeights([100, 3, 'x', 50, 5000, null, 100]), [5000, 100, 100, 50]);
  assert.deepEqual(U.normWeights('100'), []);
  assert.equal(U.normWeights(new Array(40).fill(1)).length, 30);
  // the cap keeps the first 30 given, then sorts
  assert.deepEqual(U.normWeights(new Array(30).fill(1).concat([5000])), new Array(30).fill(1));
  // a boolean is not a number
  assert.equal(S({ thing: 'desk', zoom: true }).zoom, 17);
});

test('rule 2: measuring counts how many whole units fit, and what is left', () => {
  const m = (u) => { const r = U.measure(140, 'length', u); return [r.count, r.rest, r.exact, r.less]; };
  assert.deepEqual(m('mm'), [140, 0, true, false]);
  assert.deepEqual(m('cm'), [14, 0, true, false]);
  assert.deepEqual(m('dm'), [1, 40, false, false]);
  assert.deepEqual(m('m'), [0, 140, false, true]);
  assert.deepEqual(m('km'), [0, 140, false, true]);
  const s = S({ thing: 'board', unit: 'm' });
  assert.equal(s.count, 3);
  assert.equal(s.rest, 400);
});

test('rule 3: the reading is the count, then the rest in smaller units, largest first, zeros left out', () => {
  const r = (len, u) => U.reading(len, 'length', u);
  assert.deepEqual(r(140, 'mm'), [[140, 'mm']]);
  assert.deepEqual(r(140, 'cm'), [[14, 'cm']]);
  assert.deepEqual(r(140, 'dm'), [[1, 'dm'], [4, 'cm']]);
  assert.deepEqual(r(140, 'm'), [[1, 'dm'], [4, 'cm']]);
  assert.deepEqual(r(3400, 'dm'), [[34, 'dm']]);
  assert.deepEqual(r(3400, 'm'), [[3, 'm'], [4, 'dm']]);
  assert.deepEqual(r(3400, 'cm'), [[340, 'cm']]);
  assert.deepEqual(r(1000000, 'km'), [[1, 'km']]);
  assert.deepEqual(r(1000000, 'm'), [[1000, 'm']]);
  assert.deepEqual(r(1000000, 'mm'), [[1000000, 'mm']]);
  assert.deepEqual(r(5, 'km'), [[5, 'mm']]);
  assert.deepEqual(U.mixed(1052, 'mass'), [[1, 'kg'], [5, 'dag'], [2, 'g']]);
  assert.deepEqual(U.mixed(2350, 'mass'), [[2, 'kg'], [35, 'dag']]);
  assert.deepEqual(U.mixed(1000000, 'mass'), [[1, 't']]);
});

test('rule 5: a smaller unit gives a bigger number, by the ratio of the units', () => {
  const c = (len, u) => U.measure(len, 'length', u).count;
  assert.deepEqual([c(140, 'cm'), c(140, 'mm')], [14, 140]);
  assert.deepEqual([c(3400, 'dm'), c(3400, 'cm')], [34, 340]);
  assert.deepEqual([c(1e6, 'km'), c(1e6, 'm')], [1, 1000]);
  for (const id of logic.THING_IDS) {
    const len = logic.THINGS[id];
    for (let i = 1; i < logic.RULER_UNITS.length; i++) {
      assert.ok(c(len, logic.RULER_UNITS[i - 1]) >= c(len, logic.RULER_UNITS[i]), id);
    }
  }
});

test('rule 7: the finest mark and the finest unit at each zoom', () => {
  const f = (z) => { const sc = U.scale(z); return [sc.fine.k + sc.fine.u, sc.fineUnit.u]; };
  assert.deepEqual(f(0), ['1mm', 'mm']);
  assert.deepEqual(f(8), ['1mm', 'mm']);
  // zoom 9: W = 160 mm, the mm spacing 0.00625 is just above 0.006
  assert.deepEqual(f(9), ['1mm', 'mm']);
  close(U.scale(9).levels[0].frac, 1 / 160);
  assert.deepEqual(f(10), ['1cm', 'cm']);
  assert.deepEqual(f(16), ['1cm', 'cm']);
  assert.deepEqual(f(21), ['1dm', 'dm']);
  assert.deepEqual(f(24), ['1dm', 'dm']);
  assert.deepEqual(f(32), ['1m', 'm']);
  assert.deepEqual(f(40), ['10m', 'km']);
  close(U.scale(40).levels.find((l) => l.k === 100).frac, 1 / 12);
});

test('rule 8: bands narrower than the finest mark are not drawn; a unit longer than the thing does not fit once', () => {
  assert.equal(S({ thing: 'path', unit: 'm', zoom: 40 }).tooSmall, true);
  assert.equal(S({ thing: 'path', unit: 'km', zoom: 40 }).tooSmall, false);
  assert.equal(S({ thing: 'pencil', unit: 'mm', zoom: 10 }).tooSmall, true);
  assert.equal(S({ thing: 'pencil', unit: 'mm', zoom: 8 }).tooSmall, false);
  const s = S({ thing: 'pencil', unit: 'm', zoom: 10 });
  assert.equal(s.less, true);
  assert.equal(s.count, 0);
});

test('rule 9: the heavier pan goes down; the turn is 3 to 12, a fifth or more is the full turn', () => {
  const b = (item, w, vs) => S({ mode: 'balance', item, w, vs: vs || 'none' });
  assert.equal(b('apple', [100]).side, 'left');
  assert.equal(b('apple', [100]).tilt, -12);
  close(U.tilt(150, 151), 3 + 9 * 5 / 151);
  assert.equal(U.tilt(150, 150), 0);
  assert.equal(U.tilt(100, 120), 3 + 9 * 5 * 20 / 120 > 12 ? 12 : 3 + 9 * 5 * 20 / 120);
  assert.equal(U.tilt(100, 125), 12);
  close(U.tilt(100, 110), 3 + 9 * 5 * 10 / 110);
  assert.equal(b('pillow', [], 'stone').side, 'right');
  assert.equal(b('pillow', [], 'stone').tilt, 12);
  assert.equal(b('pillow', [], 'stone').bigger, 'left');
  assert.equal(b('apple', [], 'apple').bigger, 'same');
  assert.equal(b('stone', [], 'pillow').bigger, 'right');
  assert.equal(b('apple', [100]).bigger, null);
  assert.deepEqual(b('apple', [5, 100, 20, 50]).w, [100, 50, 20, 5]);
  // the full pan refuses one more
  const full = new Array(30).fill(1);
  assert.equal(logic.addWeight(full, 2).length, 30);
  assert.equal(b('clip', full).full, true);
  assert.deepEqual(logic.addWeight([100], 50), [100, 50]);
  assert.deepEqual(logic.addWeight([100], 7), [100]);
  assert.deepEqual(logic.removeWeight([100, 50, 50], 50), [100, 50]);
  assert.deepEqual(logic.removeWeight([100], 50), [100]);
  // weights on the right are ignored when a second thing is there
  assert.deepEqual(b('apple', [100], 'stone').w, []);
});

test('rule 10: level with weights, the weights say the mass; the fewest weights', () => {
  const s = S({ mode: 'balance', item: 'apple', w: [100, 50] });
  assert.equal(s.side, 'level');
  assert.equal(s.weighed, true);
  assert.deepEqual(s.massL, [[15, 'dag']]);
  assert.deepEqual(U.fewest(150), [100, 50]);
  assert.deepEqual(U.fewest(2350), [2000, 200, 100, 50]);
  assert.deepEqual(U.fewest(800), [500, 200, 100]);
  assert.deepEqual(U.fewest(1), [1]);
  assert.deepEqual(U.fewest(27), [20, 5, 2]);
  assert.deepEqual(U.fewest(3999), [2000, 1000, 500, 200, 200, 50, 20, 20, 5, 2, 2]);
  for (const id of logic.ITEM_IDS) {
    const g = logic.ITEMS[id].g, fw = U.fewest(g);
    assert.equal(fw.reduce((a, x) => a + x, 0), g, id);
    assert.equal(S({ mode: 'balance', item: id, w: fw }).weighed, true, id);
  }
  // level against a second thing is not weighing
  assert.equal(S({ mode: 'balance', item: 'kg1', vs: 'flour' }).weighed, false);
  assert.equal(S({ mode: 'balance', item: 'kg1', vs: 'flour' }).side, 'level');
});

test('rule 11: the table: digits in their columns, the reading stops at the new unit, zeros fill the empty columns', () => {
  const t = (fam, n, from, to) => U.table(fam, n, from, to);
  const a = t('length', 34, 'dm', 'm');
  assert.deepEqual(a.digits, [0, 0, 0, 3, 4, 0, 0]);
  assert.deepEqual(a.reading, [[3, 'm'], [4, 'dm']]);
  assert.equal(a.exact, false);
  assert.deepEqual(a.zeros, []);
  assert.equal(a.dir, 'bigger');
  const b = t('length', 34, 'dm', 'cm');
  assert.deepEqual(b.reading, [[340, 'cm']]);
  assert.deepEqual(b.zeros, [5]);
  const c = t('length', 3, 'm', 'cm');
  assert.equal(c.whole, 300);
  assert.deepEqual(c.zeros, [4, 5]);
  assert.equal(c.steps, 2);
  assert.equal(c.factor, 100);
  const d = t('volume', 3, 'l', 'dl');
  assert.equal(d.whole, 30);
  assert.deepEqual(d.zeros, [3]);
  assert.deepEqual(t('volume', 25, 'dl', 'l').reading, [[2, 'l'], [5, 'dl']]);
  const e = t('length', 1, 'km', 'm');
  assert.equal(e.whole, 1000);
  assert.deepEqual(e.zeros, [1, 2, 3]);
  assert.equal(e.steps, 3);
  assert.deepEqual(t('length', 1000, 'm', 'km').reading, [[1, 'km']]);
  assert.deepEqual(t('length', 1000, 'mm', 'm').reading, [[1, 'm']]);
  assert.deepEqual(t('length', 250, 'cm', 'm').reading, [[2, 'm'], [5, 'dm']]);
  assert.deepEqual(t('length', 140, 'mm', 'cm').reading, [[14, 'cm']]);
  assert.equal(t('length', 34, 'dm', 'dm').dir, 'same');
  // nMax: km 9, l 999, the rest 1000
  assert.equal(t('length', 50, 'km', 'm').n, 9);
  assert.equal(t('volume', 5000, 'l', 'dl').n, 999);
  assert.equal(t('volume', 5000, 'dl', 'l').n, 1000);
  assert.deepEqual(t('volume', 999, 'l', 'dl').digits, [9, 9, 9, 0]);
  // the whole table is shown, so every unit can be read in; first is the leading digit's column
  assert.deepEqual([a.left, a.right, a.first], [0, 6, 3]);
  assert.deepEqual([e.left, e.right, e.first], [0, 6, 0]);
  assert.equal(t('length', 15, 'm', 'dm').first, 2);
  assert.equal(t('length', 5, 'mm', 'cm').first, 6);
  assert.deepEqual([d.left, d.right, d.first], [0, 3, 2]);
  // to a bigger unit: the steps count columns either way
  assert.equal(a.steps, 1);
  assert.equal(t('length', 1000, 'm', 'km').steps, 3);
  // a bigger unit that does not fit once: the whole part is 0, everything keeps its units
  const z = t('length', 34, 'dm', 'km');
  assert.equal(z.whole, 0);
  assert.deepEqual(z.reading, [[3, 'm'], [4, 'dm']]);
  // n missing: the default 34
  assert.equal(S({ mode: 'table', n: undefined }).n, 34);
});

test('rule 12: asking first is a flag the page reads', () => {
  const hid = Object.fromEntries(logic.PRESETS.map((p) => [p.id, preset(p.id).hide]));
  assert.deepEqual(hid, { zoom: false, pencil: true, apple: true, 'kg-dag': false, 'big-light': false, 'table-m': true, 'table-cm': false, 'table-l': true });
  assert.equal(S({ hide: 'yes' }).hide, false);
});

test('rule 13: the typical mistake: one zero for every conversion, only where it is wrong', () => {
  assert.equal(U.table('length', 3, 'm', 'cm').mistake, 30);
  assert.equal(U.table('length', 1, 'km', 'm').mistake, 10);
  assert.equal(U.table('length', 3, 'm', 'dm').mistake, null);
  assert.equal(U.table('length', 34, 'dm', 'm').mistake, null);
  assert.equal(U.table('volume', 3, 'l', 'dl').mistake, null);
});

test('presets: the expected numbers of SPEC, Presets', () => {
  const z = preset('zoom');
  assert.deepEqual(z.reading, [[1, 'km']]);
  assert.equal(z.scale.fine.k + z.scale.fine.u, '10m');
  assert.deepEqual(preset('pencil').reading, [[14, 'cm']]);
  assert.deepEqual(S({ thing: 'board', unit: 'dm' }).reading, [[34, 'dm']]);
  const ap = preset('apple');
  assert.equal(ap.side, 'left');
  assert.equal(ap.tilt, -12);
  const kd = preset('kg-dag');
  assert.equal(kd.side, 'level');
  assert.equal(kd.sum, 1000);
  assert.deepEqual(kd.sumMixed, [[1, 'kg']]);
  const bl = preset('big-light');
  assert.equal(bl.side, 'right');
  assert.equal(bl.bigger, 'left');
  assert.deepEqual(preset('table-m').reading, [[3, 'm'], [4, 'dm']]);
  assert.equal(preset('table-cm').whole, 300);
  assert.equal(preset('table-cm').mistake, 30);
  assert.equal(preset('table-l').whole, 30);
  for (const id of ['zoom', 'pencil']) {
    const pr = logic.PRESETS.find((p) => p.id === id);
    if (id !== 'zoom') assert.equal(pr.params.zoom, U.fitZoom(logic.THINGS[pr.params.thing]), id);
  }
});

test('the weights in the URL round-trip', () => {
  assert.equal(logic.encodeW([50, 100, 5]), '100.50.5');
  assert.deepEqual(logic.decodeW('100.50.5'), [100, 50, 5]);
  assert.deepEqual(logic.decodeW('100.x.7..5'), [100, 5]);
  assert.deepEqual(logic.decodeW(''), []);
  assert.deepEqual(logic.decodeW(null), []);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe and deterministic', () => {
  for (const pr of logic.PRESETS) {
    const s = logic.initial(P(pr.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    assert.deepEqual(logic.initial(P(pr.params)), s);
  }
});

test('initial does not mutate its params', () => {
  for (const pr of logic.PRESETS) {
    const p = P(JSON.parse(JSON.stringify(pr.params)));
    const before = JSON.stringify(p);
    logic.initial(p);
    assert.equal(JSON.stringify(p), before);
  }
  const w = [5, 100];
  logic.addWeight(w, 50);
  logic.removeWeight(w, 5);
  assert.deepEqual(w, [5, 100]);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('the page is an explorer and its presets are the model\'s', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, k);
  for (const pr of logic.PRESETS) {
    assert.ok(strings.hr['p_' + pr.id] && strings.en['p_' + pr.id], pr.id);
  }
  const sj = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sj.class, 'explorer');
  for (const e of sj.entries || []) assert.ok(logic.PRESETS.some((p) => p.id === e.preset), e.preset);
});
