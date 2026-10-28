// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for wifi-channels' model: SPEC.md's rules, tie-breaks first, then every preset's numbers, then the generic
// block every sim keeps. Run: node --test sims/wifi-channels/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => logic.withDefaults(over);
const D = (over) => logic.derive(P(over));
const ch = (band, width, n) => logic.channels(band, width).find((c) => c.ch === n);
const ix = logic.indexOf;
/** A state with channels given by number. */
function on(band, width, layout, range, chs) {
  const p = { band, layout, range, [band === '5' ? 'width5' : 'width24']: width };
  ['chA', 'chB', 'chC', 'chD'].forEach((k, i) => { if (chs[i] != null) p[k] = ix(band, width, chs[i]); });
  return D(p);
}
const pair = (s, ab) => s.pairs.find((q) => q.a + q.b === ab);
const kinds = (s) => Object.fromEntries(s.pairs.map((q) => [q.a + q.b, q.kind]));
const preset = (id) => D(logic.presets.find((p) => p.id === id).params);

// ── tie-breaks ──

test('rule 6: ranges that only touch do not overlap (1 and 5 at 20 MHz), 1 and 5 at 22 MHz do', () => {
  assert.equal(logic.overlap(ch('2.4', 20, 1), ch('2.4', 20, 5)), 0);
  assert.equal(logic.kindOf(ch('2.4', 20, 1), ch('2.4', 20, 5), true), 'none');
  assert.equal(logic.overlap(ch('2.4', 22, 1), ch('2.4', 22, 5)), 2);
  assert.equal(logic.kindOf(ch('2.4', 22, 1), ch('2.4', 22, 5), true), 'overlap');
});

test('rule 6: 1/5/9/13 is clean at 20 MHz but not at 22; 1/6/11 is clean at both', () => {
  const sq = (w, chs) => on('2.4', w, 'square4', 60, chs);
  assert.deepEqual(Object.values(kinds(sq(20, [1, 5, 9, 13]))), ['none', 'none', 'none', 'none', 'none', 'none']);
  const k22 = kinds(sq(22, [1, 5, 9, 13]));
  assert.equal(k22.AB, 'overlap');
  assert.equal(k22.BC, 'overlap'); // 5 and 9 (B, C)
  assert.equal(k22.CD, 'overlap');
  assert.equal(k22.AC, 'none');
  for (const w of [20, 22]) {
    const s = on('2.4', w, 'row3', 60, [1, 6, 11]);
    assert.deepEqual(Object.values(kinds(s)), ['none', 'none', 'none'], w + ' MHz');
  }
});

test('rule 3 tie-break: a block that touches a DFS sub-band edge is not DFS (42 = 5170–5250)', () => {
  const c = ch('5', 80, 42);
  assert.deepEqual([c.lo, c.hi, c.dfs], [5170, 5250, false]);
  assert.equal(ch('5', 20, 48).dfs, false);   // 5230–5250
  assert.equal(ch('5', 20, 52).dfs, true);    // 5250–5270
  assert.equal(ch('5', 40, 46).dfs, false);   // 5210–5250
  assert.equal(logic.isDfs(5330, 5350), true);
  assert.equal(logic.isDfs(5350, 5470), false); // the closed gap only touches both DFS bands
  assert.equal(logic.isDfs(5250, 5250.5), true);
});

test('rule 4 tie-break: at exactly the range the APs still hear each other', () => {
  assert.equal(pair(on('2.4', 20, 'row3', 20, [6, 6, 6]), 'AB').inRange, true);
  assert.equal(pair(on('2.4', 20, 'row3', 15, [6, 6, 6]), 'AB').inRange, false);
  assert.equal(pair(on('2.4', 20, 'row3', 40, [6, 6, 6]), 'AC').inRange, true);
});

test('rule 5 tie-break: same primary is co-channel, even when another rule would call it overlap', () => {
  const a = ch('2.4', 40, 1), b = ch('2.4', 40, 1);
  assert.equal(logic.kindOf(a, b, true), 'cci');
  assert.equal(logic.kindOf(a, b, false), 'none', 'out of range: nothing, whatever the channels');
  assert.equal(logic.kindOf(ch('2.4', 20, 1), ch('2.4', 20, 3), false), 'none');
});

// ── rules ──

test('rule 1: 2.4 GHz channel n is centred at 2407 + 5n; 20 MHz ± 10, DSSS ± 11; 13 channels', () => {
  assert.equal(logic.channels('2.4', 20).length, 13);
  assert.deepEqual([ch('2.4', 20, 1).centre, ch('2.4', 20, 1).lo, ch('2.4', 20, 1).hi], [2412, 2402, 2422]);
  assert.deepEqual([ch('2.4', 20, 6).centre, ch('2.4', 20, 11).centre, ch('2.4', 20, 13).centre], [2437, 2462, 2472]);
  assert.deepEqual([ch('2.4', 22, 6).lo, ch('2.4', 22, 6).hi], [2426, 2448]);
  assert.ok(ch('2.4', 20, 13).hi <= logic.BANDS['2.4'].hi);
});

test('rule 2: 5 GHz channel n is centred at 5000 + 5n; EU counts 19 / 9 / 4 / 2; 144 is out', () => {
  assert.deepEqual([20, 40, 80, 160].map((w) => logic.channels('5', w).length), [19, 9, 4, 2]);
  assert.deepEqual(logic.channels('5', 80).map((c) => c.ch), [42, 58, 106, 122]);
  assert.deepEqual(logic.channels('5', 160).map((c) => [c.ch, c.lo, c.hi]), [[50, 5170, 5330], [114, 5490, 5650]]);
  assert.deepEqual([ch('5', 20, 36).lo, ch('5', 20, 140).hi], [5170, 5710]);
  assert.equal(ch('5', 20, 144), undefined);
  for (const w of [20, 40, 80, 160]) {
    for (const c of logic.channels('5', w)) {
      assert.equal(c.centre, 5000 + 5 * c.ch);
      assert.equal(c.hi - c.lo, w);
      assert.ok(c.lo >= 5150 && c.hi <= 5725, `${c.ch} inside the EU band`);
      assert.ok(!(c.lo < 5470 && c.hi > 5350), `${c.ch} stays out of 5350–5470`);
    }
  }
});

test('rule 3: DFS marks 52–64 and 100–140 at 20 MHz, every 160 MHz block, and not 36–48', () => {
  const dfs = logic.channels('5', 20).filter((c) => c.dfs).map((c) => c.ch);
  assert.deepEqual(dfs, [52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140]);
  assert.ok(logic.channels('5', 160).every((c) => c.dfs));
  assert.ok(logic.channels('2.4', 20).every((c) => !c.dfs));
});

test('rule 5: same primary and in range is co-channel; overlapping ranges with other primaries is overlap', () => {
  const s = on('2.4', 20, 'row3', 25, [1, 3, 6]);
  assert.deepEqual(kinds(s), { AB: 'overlap', AC: 'none', BC: 'overlap' });
  assert.deepEqual([pair(s, 'AB').overlap, pair(s, 'BC').overlap], [10, 5]);
  assert.deepEqual([pair(s, 'AB').from, pair(s, 'AB').to], [2412, 2422]);
  assert.equal(pair(s, 'AC').overlap, 0);
  assert.equal(pair(s, 'AC').from, null);
  assert.deepEqual(s.warned, { A: true, B: true, C: true });
  assert.deepEqual(kinds(on('2.4', 20, 'row3', 25, [6, 6, 1])), { AB: 'cci', AC: 'none', BC: 'none' });
});

test('rule 7: airtime = 1 / (1 + co-channel APs heard); overlap keeps 1 but warns', () => {
  const s = on('2.4', 20, 'square4', 60, [6, 6, 6, 6]);
  assert.deepEqual(s.airtime, { A: 1 / 4, B: 1 / 4, C: 1 / 4, D: 1 / 4 });
  const o = on('2.4', 20, 'row3', 60, [1, 3, 3]);
  assert.deepEqual(o.airtime, { A: 1, B: 1 / 2, C: 1 / 2 });
  assert.deepEqual(o.warned, { A: true, B: true, C: true });
  assert.deepEqual(o.sharers, { A: 0, B: 1, C: 1 });
});

test('rule 8: at 2.4 GHz 40 MHz, 1+5 spans 2402–2442 and only two blocks are clean together (1+5, 9+13)', () => {
  const c = ch('2.4', 40, 1);
  assert.deepEqual([c.label, c.lo, c.hi], ['1+5', 2402, 2442]);
  assert.deepEqual([ch('2.4', 40, 9).lo, ch('2.4', 40, 9).hi], [2442, 2482]);
  assert.equal(logic.channels('2.4', 40).length, 9);
  // with 1+5 taken, a 40 MHz block on any primary 2–8 overlaps it; 9+13 only touches
  const clean = logic.channels('2.4', 40).filter((b) => logic.overlap(c, b) === 0).map((b) => b.ch);
  assert.deepEqual(clean, [9]);
  assert.deepEqual(kinds(on('2.4', 40, 'row3', 60, [1, 9, 6])), { AB: 'none', AC: 'overlap', BC: 'overlap' });
});

test('widths per band: 80/160 only on 5 GHz, 22 only on 2.4; an invalid width falls back to 20', () => {
  assert.equal(D({ band: '2.4', width24: 40 }).width, 40);
  assert.equal(D({ band: '5', width5: 160 }).width, 160);
  assert.equal(D({ band: '2.4', width24: 80 }).width, 20);
  assert.equal(D({ band: '5', width5: 22 }).width, 20);
  assert.equal(D({ band: 'x' }).band, '2.4');
  assert.equal(D({ layout: 'x' }).layout, 'row3');
});

test('channel params are indices into the list, clamped to its length', () => {
  const s = D({ band: '5', width5: 160, chA: 7, chB: -3, chC: 1 });
  assert.deepEqual(s.aps.map((a) => a.ch), [114, 50, 114]);
  assert.equal(logic.listFor(P({ band: '5', width5: 40 })).length, 9);
  assert.throws(() => ix('5', 80, 50));
});

test('spectrum lanes: a block goes in the first lane it does not overlap; touching blocks share a lane', () => {
  assert.deepEqual(on('2.4', 20, 'row3', 25, [1, 6, 11]).aps.map((a) => a.lane), [0, 0, 0]);
  assert.deepEqual(on('2.4', 20, 'row3', 25, [1, 5, 9]).aps.map((a) => a.lane), [0, 0, 0]);
  assert.deepEqual(on('2.4', 20, 'row3', 25, [6, 6, 6]).aps.map((a) => a.lane), [0, 1, 2]);
  const s = on('2.4', 20, 'square4', 25, [1, 3, 6, 11]);
  assert.deepEqual(s.aps.map((a) => a.lane), [0, 1, 0, 0]);
  assert.equal(s.lanes, 2);
});

test('changed: the AP whose block moved and every pair whose kind changed; band or layout change marks nothing', () => {
  const a = on('2.4', 20, 'row3', 25, [6, 6, 6]);
  const b = on('2.4', 20, 'row3', 25, [1, 6, 6]);
  assert.deepEqual(logic.changed(a, b), { aps: ['A'], pairs: ['AB'] });
  assert.deepEqual(logic.changed(a, on('2.4', 20, 'row3', 45, [6, 6, 6])), { aps: [], pairs: ['AC'] });
  assert.deepEqual(logic.changed(a, on('2.4', 22, 'row3', 25, [6, 6, 6])), { aps: ['A', 'B', 'C'], pairs: [] });
  assert.deepEqual(logic.changed(a, on('5', 20, 'row3', 25, [36, 36, 36])), { aps: [], pairs: [] });
  assert.deepEqual(logic.changed(null, a), { aps: [], pairs: [] });
  assert.deepEqual(logic.changed(a, on('2.4', 20, 'square4', 25, [6, 6, 6, 6])), { aps: [], pairs: [] });
});

test('remap: a width change keeps each AP on the channel holding its primary', () => {
  const chs = (band, w, m) => Object.values(m).map((i) => logic.channels(band, w)[i].ch);
  const sq = (band, w, c) => on(band, w, 'square4', 60, c).aps;
  assert.deepEqual(chs('2.4', 40, logic.remap(sq('2.4', 20, [1, 6, 11, 13]), '2.4', 40)), [1, 6, 9, 9]);
  assert.deepEqual(chs('2.4', 20, logic.remap(sq('2.4', 40, [1, 6, 9, 5]), '2.4', 20)), [1, 6, 9, 5]);
  assert.deepEqual(chs('2.4', 22, logic.remap(sq('2.4', 20, [1, 6, 11, 13]), '2.4', 22)), [1, 6, 11, 13]);
  assert.deepEqual(chs('5', 80, logic.remap(sq('5', 20, [44, 56, 100, 140]), '5', 80)), [42, 58, 106, 122]);
  assert.deepEqual(chs('5', 20, logic.remap(sq('5', 80, [42, 58, 106, 122]), '5', 20)), [36, 52, 100, 116]);
  assert.deepEqual(chs('5', 160, logic.remap(sq('5', 40, [46, 62, 110, 134]), '5', 160)), [50, 50, 114, 114]);
  // 140 (5700) is in no 160 MHz block: the nearest centre wins (114)
  assert.deepEqual(chs('5', 160, logic.remap(sq('5', 20, [140, 36, 64, 100]), '5', 160)), [114, 50, 50, 114]);
  assert.deepEqual(Object.keys(logic.remap(on('2.4', 20, 'row3', 25, [1, 6, 11]).aps, '2.4', 40)), ['chA', 'chB', 'chC']);
});

test('state details: warned only by overlap, counts, from/to and overlap of every pair, defaults', () => {
  assert.deepEqual(preset('all-on-6').warned, { A: false, B: false, C: false });
  assert.deepEqual([preset('one-three-six').overlaps, preset('one-three-six').cci], [2, 0]);
  assert.deepEqual([preset('all-on-6').overlaps, preset('all-on-6').cci], [0, 2]);
  const s = on('2.4', 20, 'row3', 25, [1, 3, 6]);
  assert.equal(pair(s, 'AC').to, null);
  assert.equal(pair(preset('all-on-6'), 'AC').overlap, 20, 'out of range still reports the overlap');
  assert.deepEqual([pair(preset('all-on-6'), 'AB').from, pair(preset('all-on-6'), 'AB').to], [2427, 2447]);
  assert.equal(D({ layout: 'square4' }).aps[3].ch, 1);
  assert.equal(D().range, 25);
  assert.ok([22, 40].every((w) => logic.channels('2.4', w).every((c) => !c.dfs)));
  assert.equal(D({ chA: 0.6 }).aps[0].idx, 1);
});

test('lanes look at every block in a lane, not only the last one', () => {
  assert.deepEqual(on('2.4', 20, 'square4', 25, [1, 11, 3, 6]).aps.map((a) => a.lane), [0, 0, 1, 0]);
});

test('changed: a block that keeps one edge but moves the other is marked', () => {
  const a = on('2.4', 20, 'row3', 25, [1, 6, 11]), b = on('2.4', 40, 'row3', 25, [1, 6, 9]);
  assert.ok(logic.changed(a, b).aps.includes('A'), '1 → 1+5 keeps lo 2402');
  const c = on('5', 40, 'row3', 60, [46, 46, 46]), d = on('5', 80, 'row3', 60, [42, 42, 42]);
  assert.deepEqual(logic.changed(c, d).aps, ['A', 'B', 'C'], '46 → 42 keeps hi 5250');
});

// ── presets: the task's numbers ──

test('preset all-on-6: A–B and B–C co-channel, A–C out of range; airtime ½ ⅓ ½', () => {
  const s = preset('all-on-6');
  assert.deepEqual(kinds(s), { AB: 'cci', AC: 'none', BC: 'cci' });
  assert.equal(pair(s, 'AC').inRange, false);
  assert.deepEqual(s.airtime, { A: 1 / 2, B: 1 / 3, C: 1 / 2 });
  assert.deepEqual(s.aps.map((a) => a.ch), [6, 6, 6]);
});

test('preset one-six-eleven: no conflict, full airtime', () => {
  const s = preset('one-six-eleven');
  assert.deepEqual(kinds(s), { AB: 'none', AC: 'none', BC: 'none' });
  assert.deepEqual(s.airtime, { A: 1, B: 1, C: 1 });
  assert.deepEqual([s.cci, s.overlaps], [0, 0]);
});

test('preset one-three-six: A–B (10 MHz) and B–C (5 MHz) overlap, A–C out of range; all warned', () => {
  const s = preset('one-three-six');
  assert.deepEqual(kinds(s), { AB: 'overlap', AC: 'none', BC: 'overlap' });
  assert.deepEqual(s.warned, { A: true, B: true, C: true });
  assert.deepEqual(s.airtime, { A: 1, B: 1, C: 1 });
});

test('preset four-in-a-square: diagonal A–D (28.3 m) co-channel at 30 m, gone at 25 m', () => {
  const s = preset('four-in-a-square');
  assert.equal(pair(s, 'AD').dist, 28.3);
  assert.deepEqual(kinds(s), { AB: 'none', AC: 'none', AD: 'cci', BC: 'none', BD: 'none', CD: 'none' });
  assert.deepEqual(s.airtime, { A: 1 / 2, B: 1, C: 1, D: 1 / 2 });
  const low = D(Object.assign({}, logic.presets.find((p) => p.id === 'four-in-a-square').params, { range: 25 }));
  assert.equal(pair(low, 'AD').inRange, false);
  assert.deepEqual(low.airtime, { A: 1, B: 1, C: 1, D: 1 });
});

test('preset five-ghz-80: no conflict; 58, 106, 122 DFS, 42 not', () => {
  const s = preset('five-ghz-80');
  assert.deepEqual(s.aps.map((a) => [a.ch, a.dfs]), [[42, false], [58, true], [106, true], [122, true]]);
  assert.equal(s.cci + s.overlaps, 0);
  assert.ok(s.pairs.every((q) => q.inRange));
});

test('preset five-ghz-160: only 50 and 114, two pairs share, airtime ½ each, all DFS', () => {
  const s = preset('five-ghz-160');
  assert.deepEqual(s.aps.map((a) => a.ch), [50, 50, 114, 114]);
  assert.deepEqual(kinds(s), { AB: 'cci', AC: 'none', AD: 'none', BC: 'none', BD: 'none', CD: 'cci' });
  assert.deepEqual(s.airtime, { A: 1 / 2, B: 1 / 2, C: 1 / 2, D: 1 / 2 });
  assert.ok(s.aps.every((a) => a.dfs));
});

test('defaults: the all-on-6 row', () => {
  assert.deepEqual(kinds(D()), kinds(preset('all-on-6')));
});

// ── generic checks every sim keeps ──

test('explorer: no steps; state is JSON-safe and deterministic for every preset', () => {
  assert.equal(logic.steps, undefined);
  assert.equal(logic.step, undefined);
  for (const p of logic.presets) {
    const a = D(p.params), b = D(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
    assert.deepEqual(a, b);
  }
});

test('derive does not mutate its params', () => {
  const p = P({ band: '5', width5: 80, chA: 2 });
  const copy = structuredClone(p);
  logic.derive(p);
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both languages', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: ${k} is a model param`);
    for (const lang of ['hr', 'en']) assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
  }
});
