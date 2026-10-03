// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the SSB filter method model. Run: node --test sims/dsp-filter/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => logic.initial(P(over));

// ── tie-breaks first ──

test('tie-break: the filter edges belong to the passband (ideal filter, closed interval)', () => {
  assert.equal(logic.inFilter(8998500), true);
  assert.equal(logic.inFilter(9001500), true);
  assert.equal(logic.inFilter(8998499), false);
  assert.equal(logic.inFilter(9001501), false);
});

test('tie-break: a tone that lands on the filter edge comes out, and the page is told it is on the edge', () => {
  const l = at({ sb: 'lsb', tone: 3000 });
  assert.equal(l.toneOut, 8998500);
  assert.equal(l.toneEdge, true);
  const u = at({ sb: 'usb', tone: 3000 });
  assert.equal(u.toneOut, 9001500);
  assert.equal(u.toneEdge, true);
  assert.equal(at({ sb: 'lsb', tone: 2900 }).toneEdge, false);
});

test('tie-break: the carrier sits exactly on a filter edge in both settings (suppressed by the mixer, not the filter)', () => {
  assert.equal(at({ sb: 'lsb' }).carrierEdge, true);
  assert.equal(at({ sb: 'usb' }).carrierEdge, true);
});

test('tie-break: an unknown sideband is LSB, the original\'s start', () => {
  assert.equal(logic.sideband('usb'), 'usb');
  assert.equal(logic.sideband('lsb'), 'lsb');
  assert.equal(logic.sideband('USB'), 'lsb');
  assert.equal(logic.sideband(undefined), 'lsb');
  assert.equal(at({ sb: 'x' }).fo, 9001500);
});

test('tie-break: the tone snaps half a step up, clamps to the speech band, and a non-number gives the default', () => {
  assert.equal(logic.snapTone(1050), 1100);
  assert.equal(logic.snapTone(1049.9), 1000);
  assert.equal(logic.snapTone(350), 400);
  assert.equal(logic.snapTone(0), 300);
  assert.equal(logic.snapTone(9999), 3000);
  assert.equal(logic.snapTone('x'), 1000);
  assert.equal(logic.snapTone(undefined), 1000);
});

test('tie-break: a band that touches the passband has no gap', () => {
  assert.equal(logic.gapTo([9001500, 9004000]), 0);
  assert.equal(logic.gapTo([8995000, 8998500]), 0);
  assert.equal(logic.gapTo([9001800, 9004500]), 300);
  assert.equal(logic.gapTo([8995500, 8998200]), 300);
});

// ── rules of this model ──

test('the values are the figures\': speech 300 Hz … 3 kHz, filter 9000 kHz ± 1.5 kHz, crystals 9001.5 and 8998.5 kHz', () => {
  assert.deepEqual([logic.AF_LO, logic.AF_HI], [300, 3000]);
  assert.deepEqual(logic.FILTER, [8998500, 9001500]);
  assert.deepEqual(logic.XTAL, { lsb: 9001500, usb: 8998500 });
});

test('LSB: the mixer gives 8998.5–9001.2 and 9001.8–9004.5 kHz, the filter keeps the lower one (figure 831)', () => {
  const s = at({ sb: 'lsb' });
  assert.equal(s.fo, 9001500);
  assert.deepEqual(s.lower, [8998500, 9001200]);
  assert.deepEqual(s.upper, [9001800, 9004500]);
  assert.equal(s.kept, 'lower');
  assert.equal(s.gone, 'upper');
  assert.deepEqual(s.out, [8998500, 9001200]);
});

test('USB: the mixer gives 8995.5–8998.2 and 8998.8–9001.5 kHz, the filter keeps the upper one (figure 832)', () => {
  const s = at({ sb: 'usb' });
  assert.equal(s.fo, 8998500);
  assert.deepEqual(s.lower, [8995500, 8998200]);
  assert.deepEqual(s.upper, [8998800, 9001500]);
  assert.equal(s.kept, 'upper');
  assert.equal(s.gone, 'lower');
  assert.deepEqual(s.out, [8998800, 9001500]);
});

test('the kept band is decided by the frequencies: a crystal that puts neither band inside keeps none', () => {
  const d = logic.mix(9000000);
  assert.equal(logic.bandPasses(d.lower), false);
  assert.equal(logic.bandPasses(d.upper), false);
  assert.equal(logic.bandPasses([8998500, 9001500]), true);
  assert.equal(logic.bandPasses([8998400, 9001000]), false);
});

test('the suppressed sideband starts 300 Hz beyond the filter edge in both settings (twice 300 Hz between the bands)', () => {
  for (const sb of ['lsb', 'usb']) {
    const s = at({ sb });
    assert.equal(s.gap, 300, sb);
    assert.equal(s.upper[0] - s.lower[1], 600, sb);
  }
});

test('a tone f lands at fo − f and fo + f; only the one in the passband comes out', () => {
  const l = at({ sb: 'lsb', tone: 1000 });
  assert.deepEqual([l.toneLower, l.toneUpper, l.toneOut], [9000500, 9002500, 9000500]);
  const u = at({ sb: 'usb', tone: 1000 });
  assert.deepEqual([u.toneLower, u.toneUpper, u.toneOut], [8997500, 8999500, 8999500]);
  // the lowest tone comes closest to the suppressed image: 600 Hz apart
  const low = at({ sb: 'usb', tone: 300 });
  assert.equal(low.toneOut, 8998800);
  assert.equal(low.toneOut - low.toneLower, 600);
});

test('LSB mirrors the spectrum, USB keeps its order', () => {
  const a = at({ sb: 'lsb', tone: 500 }), b = at({ sb: 'lsb', tone: 2500 });
  assert.equal(a.mirrored, true);
  assert.ok(b.toneOut < a.toneOut);
  const c = at({ sb: 'usb', tone: 500 }), d = at({ sb: 'usb', tone: 2500 });
  assert.equal(c.mirrored, false);
  assert.ok(d.toneOut > c.toneOut);
});

test('every tone of the speech band comes out in both settings', () => {
  for (const sb of ['lsb', 'usb']) {
    for (let f = logic.TONE_MIN; f <= logic.TONE_MAX; f += logic.TONE_STEP) {
      const s = at({ sb, tone: f });
      assert.notEqual(s.toneOut, null, `${sb} ${f}`);
      assert.equal(logic.inFilter(sb === 'lsb' ? s.toneUpper : s.toneLower), false, `${sb} ${f}`);
    }
  }
});

test('the speech power falls in a straight line from 1 at 300 Hz to 0.6 at 3 kHz, and is 0 outside', () => {
  assert.equal(logic.power(300), 1);
  assert.ok(Math.abs(logic.power(3000) - 0.6) < 1e-12);
  assert.ok(Math.abs(logic.power(1650) - 0.8) < 1e-12);
  assert.equal(logic.power(299), 0);
  assert.equal(logic.power(3001), 0);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const p of logic.presets) {
    const st = at(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(st)), st);
  }
});

test('initial is deterministic and does not mutate its params or the model\'s constants', () => {
  const p = P({ sb: 'usb', tone: 1200 });
  const copy = structuredClone(p);
  const st = logic.initial(p);
  assert.deepEqual(logic.initial(p), st);
  assert.deepEqual(p, copy);
  st.filter[0] = 0;
  assert.deepEqual(logic.FILTER, [8998500, 9001500]);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer has no steps');
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('every preset is valid for the model, and the page meta is an explorer', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.equal(new Set(logic.presets.map((p) => p.id)).size, logic.presets.length);
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: param ${k}`);
    const st = at(p.params);
    assert.equal(st.sb, p.params.sb, `preset ${p.id} sb`);
    assert.equal(st.tone, p.params.tone, `preset ${p.id} tone in range`);
  }
});
