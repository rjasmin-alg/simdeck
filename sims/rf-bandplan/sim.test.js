// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the RF spectrum model (sim.js). Run: node --test sims/rf-bandplan/
// The model's rules first (tie-breaks first of all), then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const at = (over) => kit.stateAt(L, P(over), 0);
const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

// ── tie-breaks ──

test('lanes: equal starts put the wider bar first, equal ranges go by id', () => {
  const r = L.packLanes([
    { id: 'b', fMin: 10, fMax: 20 }, { id: 'a', fMin: 10, fMax: 20 }, { id: 'wide', fMin: 10, fMax: 50 }
  ]);
  assert.deepEqual(r.lane, { wide: 0, a: 1, b: 2 });
  assert.equal(r.count, 3);
});

test('lanes: a bar goes into the first lane that is free, not a new one', () => {
  const r = L.packLanes([
    { id: 'x', fMin: 1, fMax: 100 }, { id: 'y', fMin: 2, fMax: 3 }, { id: 'z', fMin: 4, fMax: 5 }, { id: 'w', fMin: 200, fMax: 300 }
  ]);
  assert.deepEqual(r.lane, { x: 0, y: 1, z: 1, w: 0 });
});

test('lanes: touching ranges share a frequency and stack; a single frequency takes a minimum width', () => {
  // The plan has 960–1215 and 1215–1300: closed ranges, so they overlap at 1215.
  assert.deepEqual(L.packLanes([{ id: 'a', fMin: 960, fMax: 1215 }, { id: 'b', fMin: 1215, fMax: 1300 }]).lane, { a: 0, b: 1 });
  assert.deepEqual(L.packLanes([{ id: 'p', fMin: 868.42, fMax: 868.42 }, { id: 'q', fMin: 868.43, fMax: 869 }]).lane, { p: 0, q: 1 });
  assert.deepEqual(L.packLanes([{ id: 'p', fMin: 100, fMax: 100 }, { id: 'q', fMin: 110, fMax: 120 }]).lane, { p: 0, q: 0 });
});

test('label modes: inside when it fits, else right if the lane is free to the next bar, else none', () => {
  const bars = [
    { id: 'big', x: 0.0, w: 0.5, lane: 0 }, { id: 'small', x: 0.6, w: 0.01, lane: 0 }, { id: 'tight', x: 0.7, w: 0.01, lane: 0 },
    { id: 'next', x: 0.72, w: 0.2, lane: 0 }
  ];
  const m = L.labelModes(bars, 1000, { big: 100, small: 50, tight: 50, next: 300 }, { pad: 8 });
  assert.deepEqual(m, { big: 'in', small: 'right', tight: 'none', next: 'none' });
});

test('label modes: a label to the right never runs past the right edge, and lanes do not see each other', () => {
  const m = L.labelModes([{ id: 'edge', x: 0.95, w: 0.01, lane: 0 }, { id: 'other', x: 0.96, w: 0.03, lane: 1 }], 1000,
    { edge: 60, other: 10 }, { pad: 8 });
  assert.deepEqual(m, { edge: 'none', other: 'in' });
});

test('ticks: decades win when labels would touch', () => {
  const v = L.viewOf(P({ zoom: 0 }));
  const kept = L.thinTicks([0.9, 1, 1.1, 10], v, 0.05);
  assert.deepEqual(kept, [1, 10]);
});

// ── the view ──

test('the full view is 9 kHz to 300 GHz, 7.5 decades', () => {
  const v = L.viewOf(L.defaults);
  close(v.lo, Math.log10(0.009), 1e-2);
  close(v.hi, Math.log10(300000), 1e-2);
  close(v.span, L.FULL);
  assert.equal(L.FULL.toFixed(2), '7.52');
});

test('zoom: 10 steps halve the span; the narrowest view is the original\'s 0.15 decades or just above', () => {
  close(L.spanOf(10), L.FULL / 2);
  assert.ok(L.spanOf(L.ZOOM_MAX) >= L.MIN_SPAN);
  assert.ok(L.FULL / Math.pow(2, (L.ZOOM_MAX + 1) / 10) < L.MIN_SPAN, 'one more step would pass it');
  close(L.spanOf(999), L.spanOf(L.ZOOM_MAX));
});

test('the centre is clamped so the view never leaves 9 kHz – 300 GHz', () => {
  for (const zoom of [0, 10, 30, L.ZOOM_MAX]) {
    for (const center of [-1000, 0, 300, 9000]) {
      const v = L.viewOf(P({ zoom, center }));
      assert.ok(v.lo >= L.LOG_MIN - 1e-9 && v.hi <= L.LOG_MAX + 1e-9, `${zoom} ${center}`);
    }
    const [lo, hi] = L.centerBounds(zoom);
    assert.ok(lo <= hi);
  }
});

test('zoomAt keeps the frequency under the pointer in place', () => {
  const p = P({ zoom: 20, center: 300 });
  const v = L.viewOf(p);
  const f = v.lo + 0.3 * v.span;
  const q = L.zoomAt(p, 4, 0.3);
  const w = L.viewOf(P(q));
  close(w.lo + 0.3 * w.span, f, 0.006); // the centre is rounded to 0.01 decades
  assert.equal(q.zoom, 24);
  assert.equal(L.zoomAt(P({ zoom: L.ZOOM_MAX }), 4, 0.5).zoom, L.ZOOM_MAX);
  assert.equal(L.zoomAt(P({ zoom: 1 }), -4, 0.5).zoom, 0);
});

test('panBy moves by a share of the view and stops at the ends', () => {
  const p = P({ zoom: 30, center: 200 });
  const q = L.panBy(p, 0.25);
  close(q.center / 100 - 2, 0.25 * L.spanOf(30), 0.006);
  assert.equal(L.panBy(P({ zoom: 30, center: 200 }), 100).center, L.centerBounds(30)[1]);
  assert.equal(L.panBy(P({ zoom: 0 }), 1).center, L.centerBounds(0)[1]);
});

test('paramsFor shows the whole asked range', () => {
  for (const [a, b] of [[1.7, 30], [370, 1000], [2250, 2750], [3200, 3900], [20000, 90000], [0.009, 300000]]) {
    const v = L.viewOf(P(L.paramsFor(a, b)));
    assert.ok(v.lo <= Math.log10(a) + 1e-9 && v.hi >= Math.log10(b) - 0.006, `${a}–${b}`);
  }
});

// ── the data ──

test('the overlap rule is the original\'s (closed ranges)', () => {
  assert.ok(L.overlaps({ fMin: 1, fMax: 2 }, { fMin: 2, fMax: 3 }));
  assert.ok(!L.overlaps({ fMin: 1, fMax: 2 }, { fMin: 2.01, fMax: 3 }));
  assert.ok(L.overlaps({ fMin: 868.42, fMax: 868.42 }, { fMin: 862, fMax: 876 }));
});

test('a technology lists its plan blocks; a block lists its technologies, narrowest first', () => {
  assert.deepEqual(L.bandsOf('ham9'), ['cband']);
  assert.deepEqual(L.bandsOf('wifi24'), ['bp-ham13', 'ism24']);
  assert.deepEqual(L.bandsOf('nfc'), []);
  const ism = L.techsIn('ism24');
  assert.deepEqual(ism.slice(0, 3), ['zigbee', 'bluetooth', 'wifi24']);
  assert.ok(ism.indexOf('wifi24') < ism.indexOf('redcap'), 'the wide ones come last');
  assert.deepEqual(L.techsIn('ham630'), ['am'], 'the 630 m block lies inside the LW/MW AM range');
});

test('every range is ordered and inside 9 kHz – 300 GHz; ids are unique', () => {
  const all = L.TECHS.concat(L.BANDPLAN);
  assert.equal(new Set(all.map((x) => x.id)).size, all.length);
  for (const x of all) assert.ok(x.fMin <= x.fMax && x.fMin >= 0.009 && x.fMax <= 300000, x.id);
  assert.equal(L.TECHS.length, 87);
  assert.equal(L.BANDPLAN.length, 70);
  for (const b of L.BANDPLAN) assert.ok(b.service in L.SERVICES, b.id);
});

test('the frequency format picks kHz, MHz or GHz and drops trailing zeros', () => {
  assert.deepEqual(L.formatFreq(0.1485), { num: '148.5', unit: 'kHz' });
  assert.deepEqual(L.formatFreq(5.3515), { num: '5.3515', unit: 'MHz' });
  assert.deepEqual(L.formatFreq(1575.42), { num: '1.57542', unit: 'GHz' });
  assert.deepEqual(L.formatFreq(1000), { num: '1', unit: 'GHz' });
  assert.deepEqual(L.formatFreq(999.9), { num: '999.9', unit: 'MHz' });
  assert.deepEqual(L.formatFreq(10000), { num: '10', unit: 'GHz' });
});

test('ticks: decades only on the full view, rounder mantissas as it narrows, all inside the view', () => {
  const full = L.ticks(L.viewOf(L.defaults));
  assert.deepEqual(full, [0.01, 0.1, 1, 10, 100, 1000, 10000, 100000]);
  const uhf = L.viewOf(P(L.paramsFor(370, 1000)));
  const t = L.ticks(uhf);
  assert.ok(t.includes(400) && t.includes(500) && t.includes(700) && !t.includes(710));
  for (const f of t) assert.ok(Math.log10(f) >= uhf.lo && Math.log10(f) <= uhf.hi);
  assert.equal(new Set(t).size, t.length);
});

// ── state ──

test('hidden categories leave their row out; the plan switch removes the plan row', () => {
  const s = at({ 'cat-ham': false, plan: false });
  assert.ok(!s.rows.some((r) => r.id === 'ham'));
  assert.equal(s.rows.length, 8);
  assert.equal(s.plan, null);
});

test('a selection of a hidden thing is dropped', () => {
  assert.equal(at({ sel: 'ham9' }).sel, 'ham9');
  assert.equal(at({ sel: 'ham9', 'cat-ham': false }).sel, '');
  assert.equal(at({ sel: 'cband', plan: false }).sel, '');
  assert.equal(at({ sel: 'nonsense' }).sel, '');
  assert.deepEqual(at({ sel: 'cband' }).related, L.techsIn('cband'));
});

test('lanes in view are compacted: a zoomed row keeps only lanes with bars', () => {
  const s = at(L.presets.find((x) => x.id === 'cband').params);
  const mobile = s.rows.find((r) => r.id === 'mobile');
  assert.ok(mobile.lanes < L.CAT_LANES.mobile.count);
  const used = new Set(mobile.bars.map((b) => b.lane));
  assert.equal(used.size, mobile.lanes);
  assert.equal(s.rows.find((r) => r.id === 'wlan').lanes, 1, 'an empty row keeps one lane');
  const full = at({});
  for (const r of full.rows) assert.equal(r.lanes, L.CAT_LANES[r.id].count, r.id);
});

test('the presets show what they name', () => {
  const sel = (id) => at(L.presets.find((x) => x.id === id).params);
  assert.equal(sel('cband').sel, 'ham9');
  assert.equal(sel('ism24').sel, 'ism24');
  assert.ok(sel('hf').rows.find((r) => r.id === 'ham').bars.length >= 10, 'HF ham bands');
  const uhf = sel('uhf');
  assert.ok(uhf.plan.bars.some((b) => b.id === 'dd1') && uhf.plan.bars.some((b) => b.id === 'bp-dvbt'));
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const pr of L.presets) {
    const s = at(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
});

test('deterministic, and initial does not mutate its params', () => {
  const p = P({ zoom: 33, center: 250, sel: 'gsm900', 'cat-sat': false });
  const copy = structuredClone(p);
  assert.deepEqual(L.initial(p), L.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(L, p), 0, 'an explorer');
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('every technology, block and category has a name; every technology and block a note', () => {
  for (const lang of ['hr', 'en']) {
    for (const x of L.TECHS.concat(L.BANDPLAN)) {
      assert.ok(strings[lang]['n_' + x.id], `${lang} n_${x.id}`);
      assert.ok(strings[lang]['d_' + x.id], `${lang} d_${x.id}`);
    }
    for (const c of L.CATEGORIES) assert.ok(strings[lang]['cat_' + c.id], `${lang} cat_${c.id}`);
    for (const s of Object.keys(L.SERVICES)) assert.ok(strings[lang]['svc_' + s], `${lang} svc_${s}`);
  }
});

test('every preset is valid for the model and has a label in the page', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  const ids = L.presets.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length, 'unique ids');
  assert.ok(ids.length <= 9, 'keys 1–9');
  for (const pr of L.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in L.defaults, `${pr.id}: ${k} is a model param`);
    const [lo, hi] = L.centerBounds(pr.params.zoom);
    assert.ok(pr.params.center >= lo && pr.params.center <= hi, `${pr.id}: centre within bounds`);
    assert.ok(new RegExp(`\\b${pr.id}:`).test(html), `${pr.id}: label in index.html`);
  }
});
