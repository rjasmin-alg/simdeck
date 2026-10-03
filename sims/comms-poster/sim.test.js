// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the communication technologies poster model (sim.js). Run: node --test sims/comms-poster/
// The model's rules first (tie-breaks first of all), then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const L = require('./sim.js');
const strings = require('./strings.js');

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

test('lanes: bars closer than the gap stack; a single frequency takes a minimum width', () => {
  // 0.03 decades is about 7 %: 100–200 and 210–300 MHz are 0.021 decades apart, so they stack.
  assert.deepEqual(L.packLanes([{ id: 'a', fMin: 100, fMax: 200 }, { id: 'b', fMin: 210, fMax: 300 }]).lane, { a: 0, b: 1 });
  assert.deepEqual(L.packLanes([{ id: 'a', fMin: 100, fMax: 200 }, { id: 'b', fMin: 250, fMax: 300 }]).lane, { a: 0, b: 0 });
  // A point at 100 MHz is 0.02 decades wide: a bar from 110 MHz (0.041 decades on) is within the gap, from 120 it is not.
  assert.deepEqual(L.packLanes([{ id: 'p', fMin: 100, fMax: 100 }, { id: 'q', fMin: 110, fMax: 120 }]).lane, { p: 0, q: 1 });
  assert.deepEqual(L.packLanes([{ id: 'p', fMin: 100, fMax: 100 }, { id: 'q', fMin: 120, fMax: 130 }]).lane, { p: 0, q: 0 });
});

test('lanes: the order of the input does not change the packing', () => {
  for (const c of L.CATEGORIES) {
    const rev = L.packLanes(c.techs.slice().reverse());
    assert.deepEqual(rev, L.LANES[c.id], c.id);
  }
});

// ── the axis ──

test('the axis runs from 100 kHz to 500 GHz on a log scale: equal ratios take equal widths', () => {
  close(L.frac(0.1), 0);
  close(L.frac(500000), 1);
  close(L.frac(10) - L.frac(1), L.frac(10000) - L.frac(1000));
  close(L.frac(3) - L.frac(1), L.frac(3000) - L.frac(1000));
});

test('the axis clamps: below 100 kHz sits at the left edge, above 500 GHz at the right', () => {
  assert.equal(L.frac(0.01), 0);
  assert.equal(L.frac(1e7), 1);
});

test('the ITU bands left of the axis are cut, the rest keep their decade from 3 to 30', () => {
  const s = L.initial();
  assert.deepEqual(s.itu.map((b) => b.id), ['LF', 'MF', 'HF', 'VHF', 'UHF', 'SHF', 'EHF']);
  close(s.itu[0].x, 0); // LF starts at 30 kHz, left of the axis
  const hf = s.itu.find((b) => b.id === 'HF');
  close(hf.x, L.frac(3));
  close(hf.w, L.frac(30) - L.frac(3));
});

// ── frequencies as text ──

test('frequencies pick kHz under 1 MHz, GHz from 1000 MHz, and drop trailing zeros', () => {
  assert.deepEqual(L.formatFreq(0.526), { num: '526', unit: 'kHz' });
  assert.deepEqual(L.formatFreq(13.56), { num: '13.56', unit: 'MHz' });
  assert.deepEqual(L.formatFreq(144.8), { num: '144.8', unit: 'MHz' });
  assert.deepEqual(L.formatFreq(999.9), { num: '999.9', unit: 'MHz' });
  assert.deepEqual(L.formatFreq(1000), { num: '1', unit: 'GHz' });
  assert.deepEqual(L.formatFreq(1575), { num: '1.575', unit: 'GHz' });
  assert.deepEqual(L.formatFreq(26.965), { num: '26.965', unit: 'MHz' });
});

test('a range is one frequency, one unit, or two units', () => {
  assert.equal(L.rangeOf(L.BY_ID.nfc).single, true);
  const gsm = L.rangeOf(L.BY_ID.gsm);
  assert.equal(gsm.same, true);
  assert.deepEqual([gsm.lo.num, gsm.hi.num, gsm.hi.unit], ['880', '960', 'MHz']);
  const lte = L.rangeOf(L.BY_ID['lte-a-pro']);
  assert.equal(lte.same, false);
  assert.deepEqual([lte.lo.unit, lte.hi.unit], ['MHz', 'GHz']);
});

// ── the data ──

test('every technology has a range inside the axis, a unique id, and a name and note in both languages', () => {
  const ids = new Set();
  for (const x of L.TECHS) {
    assert.ok(!ids.has(x.id), `duplicate ${x.id}`);
    ids.add(x.id);
    assert.ok(x.fMin > 0 && x.fMin <= x.fMax, `${x.id}: ${x.fMin}–${x.fMax}`);
    assert.ok(x.fMin >= L.AXIS_MIN && x.fMax <= L.AXIS_MAX, `${x.id} inside the axis`);
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['n_' + x.id], `n_${x.id} (${lang})`);
      assert.ok(strings[lang]['d_' + x.id], `d_${x.id} (${lang})`);
    }
  }
  assert.equal(L.TECHS.length, 77);
});

test('nine categories, each with a type from the original and a name in both languages', () => {
  assert.equal(L.CATEGORIES.length, 9);
  for (const c of L.CATEGORIES) {
    assert.ok(L.TYPES.includes(c.type), c.id);
    assert.ok(strings.hr['cat_' + c.id] && strings.en['cat_' + c.id], c.id);
  }
  assert.deepEqual(L.CATEGORIES.filter((c) => c.type === 'amateur').map((c) => c.id), ['ham']);
});

test('colour is not the only carrier: categories sharing a series colour differ by hatching', () => {
  const seen = {};
  for (const c of L.CATEGORIES) {
    const k = c.c + (c.hatch ? 'h' : '');
    assert.ok(!seen[k], `${c.id} and ${seen[k]} look the same`);
    seen[k] = c.id;
  }
});

test('the drawn state: every bar inside its card, in a lane below the lane count', () => {
  const s = L.initial();
  for (const c of s.cards) {
    assert.equal(c.bars.length, L.CATEGORIES.find((x) => x.id === c.id).techs.length);
    for (const b of c.bars) {
      assert.ok(b.x >= 0 && b.x + b.w <= 1 + 1e-12, b.id);
      assert.ok(b.lane >= 0 && b.lane < c.lanes, b.id);
      assert.equal(b.point, L.BY_ID[b.id].fMin === L.BY_ID[b.id].fMax);
    }
  }
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
