// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the speech spectrum model. Run: node --test sims/speech-spectrum/
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
const lines = (pairs) => pairs.map(([f, a]) => ({ f, a, db: a > 0 ? 20 * Math.log10(a) : -Infinity }));

// ── tie-breaks first ──

test('tie-break: equal strongest amplitudes → the first, the lowest frequency (as the original getBigBinIndex)', () => {
  assert.equal(logic.strongest(lines([[100, 0.5], [200, 1], [300, 1], [400, 0.2]])), 1);
  assert.equal(logic.strongest(lines([[100, 1], [200, 1]])), 0);
  assert.equal(logic.strongest(lines([[100, 0.1], [200, 0.1], [300, 0.9]])), 2);
  // all silent (−Infinity) or empty → index 0, as the original
  assert.equal(logic.strongest(lines([[100, 0], [200, 0]])), 0);
  assert.equal(logic.strongest([]), 0);
});

test('tie-break: a line exactly on a band edge is inside the band', () => {
  const ls = logic.normalise([{ f: 300, a: 1 }, { f: 2700, a: 1 }, { f: 299, a: 1 }, { f: 2701, a: 1 }]);
  assert.equal(logic.bandShare(ls, 300, 2700), 0.5);
  // f0 = 300 Hz: the fundamental sits on the lower edge and counts
  const u300 = at({ sound: 'u', pitch: 300 }), u290 = at({ sound: 'u', pitch: 290 });
  assert.ok(u300.share > 0.95 && u290.share < 0.5, `${u300.share} ${u290.share}`);
  assert.equal(logic.bandShare([], 300, 2700), 0, 'no power → 0');
  assert.equal(logic.bandShare(logic.normalise([{ f: 500, a: 0 }]), 300, 2700), 0);
});

test('tie-break: a share above 0 that rounds to 0 % is "low" (shown as < 1 %), an exact 0 is not', () => {
  const s = at({ sound: 's' });
  assert.ok(s.share > 0 && s.share < 0.005, String(s.share));
  assert.equal(s.sharePct, 0);
  assert.equal(s.shareLow, true);
  assert.equal(at({ sound: 'a' }).shareLow, false);
});

test('tie-break: a share below 1 that rounds to 100 % is "high" (shown as > 99 %), an exact 1 is not', () => {
  const s = at({ sound: 'a', pitch: 300 });
  assert.ok(s.share < 1 && s.share > 0.995, String(s.share));
  assert.equal(s.sharePct, 100);
  assert.equal(s.shareHigh, true);
  assert.equal(at({ sound: 'a' }).shareHigh, false);
  const all = logic.normalise([{ f: 1000, a: 1 }]);
  assert.equal(logic.bandShare(all, 300, 2700), 1);
});

test('tie-break: pitch clamps to 80 … 300 Hz, snaps to 10 (a half step up), a non-number is the default', () => {
  assert.equal(logic.clampPitch(20, 7), 80);
  assert.equal(logic.clampPitch(900, 7), 300);
  assert.equal(logic.clampPitch(125, 7), 130);
  assert.equal(logic.clampPitch(124.9, 7), 120);
  assert.equal(logic.clampPitch('150', 7), 150);
  for (const bad of ['abc', '', null, NaN, undefined, true, Infinity]) assert.equal(logic.clampPitch(bad, 7), 7, String(bad));
  assert.equal(at({ pitch: 'x' }).pitch, logic.defaults.pitch);
});

test('tie-break: an unknown sound is the default; band is true only for true, "true", 1, "1"', () => {
  assert.equal(at({ sound: 'x' }).sound, logic.defaults.sound);
  assert.equal(at({ sound: 'S' }).sound, logic.defaults.sound, 'no case folding');
  assert.equal(at({ sound: ' s' }).sound, logic.defaults.sound);
  for (const v of [true, 'true', 1, '1']) assert.equal(at({ band: v }).band, true, String(v));
  for (const v of [false, 'false', 0, '0', '', null, undefined, 'yes']) assert.equal(at({ band: v }).band, false, String(v));
});

// ── the model's rules ──

test('voiced: lines exactly at k · f0 for k = 1, 2, … up to 20 kHz', () => {
  for (const f0 of [80, 120, 170, 300]) {
    const s = at({ sound: 'a', pitch: f0 });
    assert.equal(s.lines.length, Math.floor(logic.FMAX / f0));
    s.lines.forEach((l, i) => assert.equal(l.f, (i + 1) * f0));
  }
});

test('unvoiced "s": a continuous spectrum every 50 Hz from 50 Hz to 20 kHz, no harmonic number', () => {
  const s = at({ sound: 's', pitch: 250 });
  assert.equal(s.voiced, false);
  assert.equal(s.lines.length, (logic.FMAX - logic.FMIN) / logic.NOISE_DF + 1);
  s.lines.forEach((l, i) => assert.equal(l.f, logic.FMIN + i * logic.NOISE_DF));
  assert.equal(s.peak.k, 0);
  assert.deepEqual(s.envelope, []);
  assert.deepEqual(s.formants, []);
  assert.deepEqual(s.lines, at({ sound: 's', pitch: 90 }).lines, 'the pitch does not change noise');
});

test('levels: the strongest line is 0 dB, everything else below; the state cuts at FLOOR − 1', () => {
  for (const p of logic.presets) {
    const s = at(p.params);
    const max = Math.max(...s.lines.map((l) => l.db));
    assert.ok(Math.abs(max) < 1e-9, `${p.id}: ${max}`);
    assert.ok(s.lines.every((l) => l.db >= logic.FLOOR - 1), p.id);
    assert.equal(s.lines.find((l) => l.f === s.peak.f).db, max);
  }
});

test('normalise: relative to the largest amplitude, a zero is −Infinity, all zero stays zero', () => {
  const n = logic.normalise([{ f: 1, a: 2 }, { f: 2, a: 1 }, { f: 3, a: 0 }]);
  assert.deepEqual(n.map((l) => l.a), [1, 0.5, 0]);
  assert.equal(n[0].db, 0);
  assert.ok(Math.abs(n[1].db - -6.0206) < 1e-3);
  assert.equal(n[2].db, -Infinity);
  assert.deepEqual(logic.normalise([{ f: 1, a: 0 }]).map((l) => l.a), [0]);
});

test('resonance: gain 1 at 0 Hz, F/B near F, falls 12 dB per octave far above', () => {
  assert.equal(logic.resonance(0, 700, 100), 1);
  assert.ok(Math.abs(logic.resonance(700, 700, 100) - 7) < 1e-9);
  const r1 = logic.resonance(20000, 700, 100), r2 = logic.resonance(40000, 700, 100);
  assert.ok(Math.abs(20 * Math.log10(r1 / r2) - 12.04) < 0.1);
});

test('the source falls 6 dB per octave: with a flat tract a harmonic is 1/k', () => {
  // harmonic() = tract / k; check the 1/k part by dividing the tract out
  for (const k of [1, 2, 4, 8]) {
    const f0 = 100;
    assert.ok(Math.abs(logic.harmonic('a', f0, k) * k - logic.tract('a', k * f0)) < 1e-12);
  }
});

test('vowels: the strongest harmonic is the one nearest a formant peak; formants are F1–F3 of the vowel', () => {
  assert.equal(at({ sound: 'a', pitch: 120 }).peak.f, 720);    // 6 · 120, next to F1 = 730
  assert.equal(at({ sound: 'a', pitch: 120 }).peak.k, 6);
  assert.equal(at({ sound: 'a', pitch: 240 }).peak.f, 720);    // 3 · 240: the line moves, the formant stays
  assert.equal(at({ sound: 'a', pitch: 240 }).peak.k, 3);
  assert.equal(at({ sound: 'i', pitch: 120 }).peak.f, 240);    // next to F1 = 270
  assert.deepEqual(at({ sound: 'i' }).formants.map((f) => f.f), [270, 2290, 3010]);
  assert.deepEqual(at({ sound: 'u' }).formants.map((f) => f.n), [1, 2, 3]);
  // the formant F2 of "i" lifts the lines near 2.3 kHz far above those of "u"
  const near = (s) => s.lines.find((l) => l.f === 2280).db;
  assert.ok(near(at({ sound: 'i' })) - near(at({ sound: 'u' })) > 15);
});

test('the radio band 300–2700 Hz keeps most of "a", little of "i" at a low voice, almost nothing of "s"', () => {
  assert.equal(at({ sound: 'a' }).sharePct, 91);
  assert.equal(at({ sound: 'a', pitch: 240 }).sharePct, 96);
  assert.equal(at({ sound: 'i' }).sharePct, 5);
  assert.equal(at({ sound: 'u' }).sharePct, 18);
  assert.equal(at({ sound: 's' }).sharePct, 0);
  // share is a power share: lines squared
  const ls = logic.normalise([{ f: 100, a: 1 }, { f: 1000, a: 1 }, { f: 1100, a: 1 }]);
  assert.ok(Math.abs(logic.bandShare(ls, 300, 2700) - 2 / 3) < 1e-12);
  const lq = logic.normalise([{ f: 100, a: 2 }, { f: 1000, a: 1 }]);
  assert.ok(Math.abs(logic.bandShare(lq, 300, 2700) - 1 / 5) < 1e-12);
});

test('top: the highest frequency still above the floor; vowels stop below 5 kHz, "s" reaches 20 kHz', () => {
  assert.equal(at({ sound: 'a' }).top, 4560);
  assert.equal(at({ sound: 'u' }).top, 2520);
  assert.equal(at({ sound: 's' }).top, 20000);
  for (const p of logic.presets) {
    const s = at(p.params);
    assert.ok(s.lines.filter((l) => l.f > s.top).every((l) => l.db < logic.FLOOR), p.id);
  }
});

test('envelope: from f0 up, passes through every line, log-spaced to 20 kHz', () => {
  const f0 = 150;
  const env = logic.envelope('a', f0, 100);
  assert.equal(env.length, 101);
  assert.ok(Math.abs(env[0].f - f0) < 1e-9);
  assert.ok(Math.abs(env[100].f - logic.FMAX) < 1e-6);
  assert.ok(Math.abs(env[1].f / env[0].f - env[2].f / env[1].f) < 1e-9);
  // at f0 the envelope equals the first line's level
  const line1 = logic.spectrum('a', f0)[0];
  assert.ok(Math.abs(env[0].db - line1.db) < 1e-9);
});

test('fromAnalyser: bins below 50 Hz and above 20 kHz dropped, −Infinity is silence, levels relative to the strongest', () => {
  const low = logic.fromAnalyser([0, 0, -50, -60], 25);   // 0, 25 Hz (rumble, louder) dropped; 50 Hz is the first
  assert.deepEqual(low.map((l) => l.f), [50, 75]);
  assert.equal(low[0].db, 0);
  const ls = logic.fromAnalyser([-10, -40, -20, -Infinity, -20, -30], 5000);
  assert.deepEqual(ls.map((l) => l.f), [5000, 10000, 15000, 20000]);
  assert.ok(Math.abs(ls[1].db) < 1e-9);
  assert.ok(Math.abs(ls[0].db - -20) < 1e-9);
  assert.equal(ls[2].db, -Infinity);
  assert.equal(ls[3].a, 1, 'equal level: also 0 dB');
  assert.equal(logic.strongest(ls), 1, 'two equal bins: the lower frequency');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const p of logic.presets) {
    const s = at(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ sound: 'i', pitch: 210, band: true });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
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
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: param ${k}`);
    assert.ok(logic.SOUNDS.includes(p.params.sound), `preset ${p.id}: sound`);
    assert.equal(logic.clampPitch(p.params.pitch, NaN), p.params.pitch, `preset ${p.id}: pitch on the slider`);
  }
});
