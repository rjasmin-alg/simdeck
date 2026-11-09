// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ctcss's model (SPEC.md). Run: node --test sims/ctcss/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps(P(over)));
const col = (s, key) => s.slots.map((x) => x[key]);
const spk = (s) => s.slots.map((x) => (x.speaker === 'open' ? 'O' : '.')).join('');
const PRESETS = {
  'right-tone': {},
  'no-tone': { schedule: 'B' },
  'wrong-tone': { schedule: 'C' },
  'hidden-user': { schedule: 'AB' }
};

// ── tie-breaks first ──

test('T1: a new lock opens the loudspeaker from the next slot, not in the slot of the decision', () => {
  const s2 = at({}, 2), s3 = at({}, 3);
  assert.equal(s2.slots[1].det, 'found');
  assert.equal(s2.detector.locked, true);
  assert.equal(s2.slots[1].speaker, 'muted', 'the slot the decision is made in is lost');
  assert.equal(s3.slots[2].speaker, 'open');
  assert.ok(s3.events.includes('speaker.open'));
});

test('T2: losing the tone mutes in the same slot and restarts collection from that slot', () => {
  const s = end(PRESETS['hidden-user']);
  assert.equal(s.slots[12].det, 'lost');
  assert.equal(s.slots[12].speaker, 'muted', 'B alone in slot 13 is never heard');
  assert.equal(s.slots[12].collected, 1);
  assert.equal(s.slots[13].det, 'none', 'a fresh 0.5 s (slots 13–14) decides: no tone');
  assert.equal(s.slots[13].speaker, 'muted');
});

test('T3: equal powers: the lower tone is best; no margin, no decision', () => {
  const r = logic.decide(logic.TONES.map(() => -40));
  assert.equal(r.best, 67.0);
  assert.equal(r.marginDb, 0);
  assert.equal(r.decided, null);
  const two = logic.TONES.map((f) => (f === 88.5 || f === 91.5 ? 20 : 0));
  assert.equal(logic.decide(two).best, 88.5);
});

test('T4: a margin of exactly 12 dB is accepted (≥), 11.9 dB is not', () => {
  const db = (m) => logic.TONES.map((f) => (f === 100.0 ? m : 0));
  assert.equal(logic.decide(db(12)).decided, 100.0);
  assert.equal(logic.decide(db(11.9)).decided, null);
});

test('T5: doubling is marked even while the loudspeaker is muted', () => {
  const s = end({ schedule: 'AB', toneA: 'none' });
  assert.deepEqual(s.doubled, [7, 8, 9, 10, 11, 12]);
  assert.equal(spk(s), '..............');
});

test('T6: a station under the threshold neither opens R nor doubles', () => {
  const w = end({ weak: 'A' });
  assert.equal(spk(w), '............');
  assert.ok(w.slots.every((x) => !x.carrier && x.det === 'idle'));
  assert.equal(spk(end({ weak: 'A', squelch: 'carrier' })), '............', 'carrier squelch stays muted too');
  const ab = end({ schedule: 'AB', weak: 'B' });
  assert.deepEqual(ab.doubled, []);
  assert.deepEqual(ab.heard, [{ id: 'A', from: 3, to: 12 }]);
});

// ── rules ──

test('rule 1: carrier squelch opens at once for any carrier, tone or not, and mutes on noise', () => {
  const s = end({ schedule: 'B', squelch: 'carrier' });
  assert.equal(spk(s), 'OOOOOOOOOOOO');
  assert.ok(s.slots.every((x) => x.det === 'off'));
  const after = at({ squelch: 'carrier' }, 13);    // A released after 3 s: only noise
  assert.equal(after.slots[12].speaker, 'muted');
  assert.ok(after.events.includes('carrier.off'));
});

test('rule 2: 49 standard tones from 67.0 to 254.1 Hz, ascending, closest 2.4 Hz apart', () => {
  assert.equal(logic.TONES.length, 49);
  assert.equal(logic.TONES[0], 67.0);
  assert.equal(logic.TONES[48], 254.1);
  const gaps = logic.TONES.slice(1).map((f, i) => Math.round((f - logic.TONES[i]) * 10) / 10);
  assert.ok(gaps.every((g) => g > 0));
  assert.equal(Math.min(...gaps), 2.4);
});

test('rule 3: the detector needs 0.5 s; every standard tone is found as itself, ≥ 12 dB over the median', () => {
  assert.equal(at({}, 1).slots[0].det, 'listening');
  assert.equal(at({}, 1).detector.bestTone, null);
  assert.equal(logic.WINDOW_SLOTS * logic.SLOT_S, 0.5);
  assert.ok(67.0 * 0.5 > 33, '67 Hz completes about 33 cycles in the window');
  for (const f of logic.TONES) {
    const r = logic.analyseSlots(P({ toneA: f.toFixed(1) }), 1, 2);
    assert.equal(r.best, f, `tone ${f}`);
    assert.ok(r.marginDb >= logic.THRESHOLD_DB, `tone ${f}: margin ${r.marginDb}`);
  }
});

test('rule 3: speech and noise alone stay under 12 dB: no tone', () => {
  const s = end(PRESETS['no-tone']);
  const m = s.slots.slice(1).map((x) => x.marginDb);
  assert.ok(m.every((x) => x < logic.THRESHOLD_DB), m.join(' '));
  assert.ok(s.slots.slice(1).every((x) => x.det === 'none'));
});

test('rule 3: 91.5 Hz is told from 88.5 Hz (3 Hz apart); 88.5 gets spill but the best decides', () => {
  const r = logic.analyseSlots(P({ schedule: 'C' }), 1, 2);
  assert.equal(r.best, 91.5);
  assert.equal(r.decided, 91.5);
  const i88 = logic.TONES.indexOf(88.5), i91 = logic.TONES.indexOf(91.5);
  assert.ok(r.powers[i88] < r.powers[i91]);
});

test('rule 4: the loudspeaker opens only for carrier + the set tone; it mutes when the carrier drops', () => {
  assert.equal(spk(end(PRESETS['right-tone'])), '..OOOOOOOOOO');
  assert.equal(spk(end(PRESETS['wrong-tone'])), '............');
  assert.equal(spk(end(PRESETS['no-tone'])), '............');
  assert.equal(spk(end({ rxTone: '91.5', schedule: 'C' })), '..OOOOOOOOOO', 'set R to 91.5 and C opens it');
  const after = at({}, 13);
  assert.equal(after.slots[12].speaker, 'muted');
  assert.equal(after.detector.collected, 0);
  assert.equal(after.detector.locked, false);
  assert.equal(after.slots[12].det, 'idle');
});

test('rule 5: every tone is below the speech high-pass, all speech above it', () => {
  assert.ok(logic.TONES.every((f) => f < logic.HPF_HZ));
  assert.ok(logic.VOICE.every((v) => v[0] > logic.HPF_HZ));
});

test('rule 6 (hidden-user): B is never heard, yet doubles A from 1.5 s', () => {
  const s = end(PRESETS['hidden-user']);
  assert.deepEqual(s.heard, [{ id: 'A', from: 3, to: 6 }]);
  assert.equal(logic.heardSeconds(s, 'B'), 0);
  assert.deepEqual(s.doubled, [7, 8, 9, 10, 11, 12]);
  assert.equal(spk(s), '..OOOOOOOOOO..');
  const c = end(Object.assign({ squelch: 'carrier' }, PRESETS['hidden-user']));
  assert.deepEqual(c.heard, [{ id: 'A', from: 1, to: 6 }, { id: 'B', from: 13, to: 14 }], 'without the tone filter you hear B');
});

test('presets: steps and the task\'s numbers', () => {
  assert.equal(logic.steps(P(PRESETS['right-tone'])), 12);
  assert.equal(logic.steps(P(PRESETS['no-tone'])), 12);
  assert.equal(logic.steps(P(PRESETS['wrong-tone'])), 12);
  assert.equal(logic.steps(P(PRESETS['hidden-user'])), 14);
  const r = end(PRESETS['right-tone']);
  assert.deepEqual(r.heard, [{ id: 'A', from: 3, to: 12 }]);
  assert.equal(logic.heardSeconds(r, 'A'), 2.5, 'the first 0.5 s of 3 s is lost');
  assert.deepEqual(col(end(PRESETS['wrong-tone']), 'tone').slice(1), Array(11).fill(91.5));
});

// ── pinned numbers and the mutations a first review found unkilled ──

test('rule 2: the exact tone list (HamMonitor ctcss.py CTCSS_TONES)', () => {
  assert.deepEqual(logic.TONES, [
    67.0, 71.9, 74.4, 77.0, 79.7, 82.5, 85.4, 88.5, 91.5, 94.8, 97.4, 100.0, 103.5, 107.2, 110.9, 114.8,
    118.8, 123.0, 127.3, 131.8, 136.5, 141.3, 146.2, 151.4, 156.7, 159.8, 162.2, 165.5, 167.9, 171.3, 173.8, 177.3,
    179.9, 183.5, 186.2, 189.9, 192.8, 196.6, 199.5, 203.5, 206.5, 210.7, 218.1, 225.7, 229.1, 233.6, 241.8, 250.3,
    254.1]);
});

test('rule 3: 8000 samples/s, 2000 per slot; Goertzel normalised so a unit tone has power 1', () => {
  assert.equal(logic.RATE, 8000);
  assert.equal(logic.slotAudio(P({}), 1).length, 2000);
  const x = Array.from({ length: 4000 }, (_, i) => Math.sin(2 * Math.PI * 100 * i / 8000));
  assert.ok(Math.abs(logic.goertzel(x, 100) - 1) < 1e-6);
});

test('rule 3: the median is numeric and the middle value', () => {
  // numbers sorted as text would put 30 before 9; a quarter point would read 10 instead of 0
  const a = [].concat(Array(24).fill(9), Array(24).fill(10), [30]);
  assert.equal(logic.decide(a).marginDb, 20);
  const b = [].concat(Array(25).fill(0), Array(23).fill(10), [40]);
  assert.equal(logic.decide(b).marginDb, 40);
});

test('T4: the decision uses the exact margin, not the rounded one (11.95 dB is not enough)', () => {
  const db = logic.TONES.map((f) => (f === 100.0 ? 11.95 : 0));
  assert.equal(logic.decide(db).marginDb, 12);
  assert.equal(logic.decide(db).decided, null);
});

test('SPEC numbers: margins of the presets and of every tone sent alone', () => {
  assert.equal(at({}, 2).detector.marginDb, 39.9);
  const w = end(PRESETS['wrong-tone']).slots.slice(1).map((x) => x.marginDb);
  assert.deepEqual([Math.min(...w), Math.max(...w)], [38.4, 43.0]);
  const nt = end(PRESETS['no-tone']).slots.slice(1).map((x) => x.marginDb);
  assert.deepEqual([Math.min(...nt), Math.max(...nt)], [6.4, 10.6]);
  assert.equal(logic.analyseSlots(P({ schedule: 'C' }), 1, 2).powers[logic.TONES.indexOf(88.5)], 30.1);
  const ms = logic.TONES.map((f) => logic.analyseSlots(P({ toneA: f.toFixed(1) }), 1, 2).marginDb);
  assert.equal(Math.min(...ms), 37.1);
});

test('rule 3: the window slides: every locked slot is decided again over the last 0.5 s', () => {
  const s = end(PRESETS['right-tone']);
  assert.deepEqual(s.slots.slice(2).map((x) => x.det + ':' + x.tone), Array(10).fill('found:88.5'));
});

test('rule 4b: a lock holds only while the set tone is the decided one (best and ≥ 12 dB)', () => {
  assert.equal(logic.holds({ best: 88.5, decided: 88.5 }, 88.5), true);
  assert.equal(logic.holds({ best: 88.5, decided: null }, 88.5), false, 'best but under 12 dB');
  assert.equal(logic.holds({ best: 91.5, decided: 91.5 }, 88.5), false, 'another tone');
  // a toned intruder after A: B with 100 Hz is never heard
  const s = end({ schedule: 'AB', toneB: '100.0' });
  assert.equal(logic.heardSeconds(s, 'B'), 0);
  assert.deepEqual(s.slots.slice(12).map((x) => x.speaker), ['muted', 'muted']);
});

test('rule 4b: a lock lost by the sliding decision mutes that same slot', () => {
  const o = { schedule: 'AB', rxTone: '250.3', toneA: '250.3', toneB: '254.1' };
  const s = at(o, 12);
  assert.ok(s.events.includes('det.lost'));
  assert.equal(s.slots[11].tone, 254.1);
  assert.equal(s.slots[11].speaker, 'muted');
});

test('rule 4: a carrier drop empties the detector (beyond the page\'s 12 steps, slot 13)', () => {
  const d = at({}, 13).detector;
  assert.deepEqual([d.decided, d.bestTone, d.marginDb, d.powers, d.collected, d.locked], [null, null, null, null, 0, false]);
});

test('rule 5: the speech high-pass is at 300 Hz', () => {
  assert.equal(logic.HPF_HZ, 300);
});

test('rule 6: a doubled slot carries both stations\' audio (the second one 40 Hz higher)', () => {
  const both = logic.slotAudio(P({ schedule: 'AB' }), 7), one = logic.slotAudio(P({}), 7);
  assert.ok(logic.goertzel(both, 560) > 0.01, 'B\'s speech is in the mix');
  assert.ok(logic.goertzel(one, 560) < 0.001);
  assert.ok(logic.goertzel(both, 520) > 0.01, 'A\'s speech too');
});

test('events: key up, release, carrier and speaker changes', () => {
  assert.deepEqual(at({}, 1).events, ['key.up:A', 'carrier.on']);
  assert.ok(at(PRESETS['hidden-user'], 7).events.includes('key.up:B'));
  assert.ok(at(PRESETS['hidden-user'], 13).events.includes('key.down:A'));
  assert.deepEqual(at({}, 3).events, ['speaker.open']);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  const p = P({ schedule: 'AB', toneB: '100.0' });
  for (let n = 0; n <= logic.steps(p); n++) {
    const s = kit.stateAt(logic, p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ schedule: 'AB' });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({});
  const s1 = kit.stateAt(logic, p, 2);
  const copy = structuredClone(s1);
  logic.step(s1, 3, p);
  assert.deepEqual(s1, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the default preset');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const ids = [...html.matchAll(/\{ id: '([a-z-]+)'/g)].map((m) => m[1]);
  assert.deepEqual(ids, Object.keys(PRESETS));
  assert.deepEqual(meta.entries.map((e) => e.preset), Object.keys(PRESETS));
});
