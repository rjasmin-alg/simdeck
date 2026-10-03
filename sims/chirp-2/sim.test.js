// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the chirp-2 helpers and the recording. Run: node --test sims/chirp-2/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');
const rec = require('./recording.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => logic.initial(P(over));

// ── tie-breaks first ──

test('tie-break: the position snaps halves up and clamps; junk is 0', () => {
  assert.equal(logic.snapT(12.35), 12.4);
  assert.equal(logic.snapT(12.34), 12.3);
  assert.equal(logic.snapT(-1), 0);
  assert.equal(logic.snapT(rec.duration), logic.REC_MAX);
  assert.equal(logic.snapT(99), logic.REC_MAX);
  assert.equal(logic.snapT('x'), 0);
  assert.equal(logic.snapT(null), 0);
  assert.equal(logic.snapT(true), 0);
  assert.equal(logic.snapT('8.8'), 8.8);
  assert.equal(at({ t: 7 }).t, 7);
});

test('tie-break: a character of the transcript shows from its own time on (ms ≤ t)', () => {
  const ev = rec.events;
  assert.equal(logic.transcript(ev, 0, 0), '');
  assert.equal(logic.transcript(ev, 1.416, 0), '');
  assert.equal(logic.transcript(ev, 1.417, 0), 'O');
  assert.equal(logic.sender(ev, 1.416), -1, 'before the first character nobody has sent');
  assert.equal(logic.sender(ev, 1.417), 0);
  assert.equal(logic.sender(ev, 9.625), 1, 'the second pass from its first character on');
  assert.equal(logic.sender(ev, 9.624), 0, 'until then the last character is the first pass\'s');
});

test('tie-break: each pass has its own transcript, and a pass never starts with a space', () => {
  const ev = [[100, 'A', 1, 0], [200, 'B', 1, 1], [300, 'C', 1, 0], [400, 'D', 0, 1]];
  assert.equal(logic.transcript(ev, 1, 0), 'A C');
  assert.equal(logic.transcript(ev, 1, 1), 'BD');
  assert.equal(logic.transcript(ev, 0.25, 1), 'B');
});

test('tie-break: the page boundaries go to the later page, and the very end to the last page', () => {
  const w = logic.REC_DURATION / logic.REC_PAGES;
  assert.equal(logic.recPage(0).i, 0);
  assert.equal(logic.recPage(w - 1e-6).i, 0);
  assert.equal(logic.recPage(w).i, 1);
  assert.equal(logic.recPage(3 * w).i, 3);
  assert.equal(logic.recPage(logic.REC_DURATION).i, logic.REC_PAGES - 1);
  assert.equal(logic.recPage(logic.REC_MAX).i, logic.REC_PAGES - 1);
  assert.equal(logic.recPage(-1).i, 0);
  const p = logic.recPage(10);
  assert.ok(p.from <= 10 && 10 < p.to);
});

test('tie-break: an element shorter than a dah has no rise; a mean of nothing is null; a mean that rounds to 0 is +0', () => {
  assert.equal(logic.rise([300, 301, 302, 303, 304, 305, 306, 307, 308]), null, '9 samples: not a dah');
  assert.equal(logic.rise(null), null);
  assert.equal(logic.rise([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 5, '10 samples: a dah');
  assert.deepEqual(logic.passRise([], 0), { n: 0, mean: null });
  const tiny = [[0, 0, 1, 0, [300, 300, 300, 300, 300, 300, 300, 300, 300, 300]],
                [0, 2, 3, 2, [300, 300, 300, 300, 300, 300, 300, 300, 300, 299.8]]];
  const r = logic.passRise(tiny, 0);
  assert.equal(r.n, 2);
  assert.ok(Object.is(r.mean, 0), 'not −0');
});

test('tie-break: a dah counts as heard once its key-up is reached (off ≤ upTo)', () => {
  const tr = [[1, 0, 1, 0, [0, 0, 0, 0, 0, 10, 10, 10, 10, 10]]];
  assert.equal(logic.passRise(tr, 1, 0.999).n, 0);
  assert.equal(logic.passRise(tr, 1, 1).n, 1);
  assert.equal(logic.passRise(tr, 1).n, 1, 'no upTo: the whole recording');
  assert.equal(logic.passRise(tr, 0).n, 0, 'another pass\'s dahs do not count');
});

// ── the rules ──

test('rise is the median of the last five samples minus the median of the first five, so one stray sample does not move it', () => {
  const f = [380, 360, 361, 362, 363, 370, 380, 390, 400, 401, 402, 403, 450];
  assert.equal(logic.median([3, 1, 2]), 2);
  assert.equal(logic.median([4, 1, 3, 2]), 2.5);
  assert.equal(logic.rise(f), 402 - 362);
  assert.equal(logic.rise(f.slice().reverse()), 362 - 402, 'falling is negative');
});

// ── the recording ──

test('the recording is the original\'s MP3, unchanged', () => {
  assert.ok(rec.audio.startsWith('data:audio/mpeg;base64,'));
  assert.equal(crypto.createHash('sha256').update(rec.audio).digest('hex'),
    '438ac8735619e7363a0d11705a72932ef18b04d6f7c70bbdaabe7190f50d512e');
  assert.equal(rec.duration, logic.REC_DURATION);
});

test('the transcript is the original\'s: OM3YCY? in the first pass, DA DA OK RA1OW DE OM3YCY in the second', () => {
  assert.equal(rec.events.length, 26);
  assert.equal(logic.transcript(rec.events, rec.duration, 0), 'OM3YCY?');
  assert.equal(logic.transcript(rec.events, rec.duration, 1), 'DA DA OK RA1OW DE OM3YCY');
  for (let i = 1; i < rec.events.length; i++) assert.ok(rec.events[i][0] >= rec.events[i - 1][0], `event ${i} in order`);
});

test('the measured track is in order, inside the recording and the detector\'s band, and each element in its pass', () => {
  let prevOff = 0;
  for (const [b, on, off, t0, f] of rec.track) {
    assert.ok(on >= prevOff && off > on && off <= rec.duration, `${on}`);
    assert.ok(t0 >= on && t0 + (f.length - 1) * 0.01 <= off + 1e-9, `${on}: samples inside the element`);
    assert.ok(f.length >= 3);
    for (const v of f) assert.ok(v >= 200 && v <= 520, `${on}: ${v}`);
    assert.equal(b, on < 8 ? 0 : 1, `${on}: pass`);
    prevOff = off;
  }
});

test('the measured chirp: the first pass\'s dahs stay within 1 Hz, the second\'s rise by 32 Hz on average and every one rises', () => {
  const a = logic.passRise(rec.track, 0), b = logic.passRise(rec.track, 1);
  assert.deepEqual(a, { n: 17, mean: 0 });
  assert.deepEqual(b, { n: 36, mean: 32 });
  for (const [p, , , , f] of rec.track) {
    const r = logic.rise(f);
    if (r === null) continue;
    if (p === 0) assert.ok(Math.abs(r) <= 1, `pass 1 dah ${r}`);
    else assert.ok(r >= 20, `pass 2 dah ${r}`);
  }
  assert.equal(logic.passRise(rec.track, 1, 8.8).n, 0, 'nothing of the second pass is heard at its preset');
  assert.equal(logic.passRise(rec.track, 1, 31.4).n, 36, 'everything is heard at the whole-contact preset');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const p of logic.presets) {
    const st = at(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(st)), st);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ t: 12.3 });
  const copy = structuredClone(p);
  const st = logic.initial(p);
  assert.deepEqual(logic.initial(p), st);
  assert.deepEqual(p, copy);
  st.page.i = 99;
  assert.notEqual(logic.initial(p).page.i, 99);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer has no steps');
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('every preset is valid, and the page meta is an explorer', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.equal(new Set(logic.presets.map((p) => p.id)).size, logic.presets.length);
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: param ${k}`);
    assert.equal(at(p.params).t, p.params.t, `preset ${p.id} t in range`);
  }
});
