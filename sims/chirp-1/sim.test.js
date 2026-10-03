// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the chirp model and the recording's helpers. Run: node --test sims/chirp-1/
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
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

// ── tie-breaks first ──

test('tie-break: a regulated supply means no jump, whatever the jump slider says', () => {
  const s = at({ src: 'model', reg: true, jump: -150, tau: 400 });
  assert.equal(s.jump, 0);
  assert.equal(s.jumpSet, -150, 'the slider value is kept for when the regulator is switched off');
  assert.equal(s.dir, 'none');
  assert.equal(s.ditEnd, 0);
  assert.equal(s.dahEnd, 0);
  assert.equal(at({ reg: 'yes' }).reg, false, 'only true switches the regulator on');
});

test('tie-break: a jump of 0 is no chirp, neither from below nor from above', () => {
  const s = at({ src: 'model', jump: 0 });
  assert.equal(s.dir, 'none');
  assert.equal(at({ jump: -10 }).dir, 'below');
  assert.equal(at({ jump: 10 }).dir, 'above');
});

test('tie-break: an end offset that rounds to 0 Hz counts as settled (and is never −0)', () => {
  // 90 Hz · e^(−300/30) = 0.004 Hz
  const s = at({ jump: -90, tau: 30 });
  assert.equal(s.dahEnd, 0);
  assert.ok(Object.is(s.dahEnd, 0), 'not −0');
  assert.equal(s.ditEnd, -3);    // 90 · e^(−100/30) = 3.2
});

test('tie-break: sliders snap halves away from the bottom and clamp; junk gives the default', () => {
  assert.equal(logic.snapJump(-95), -90);
  assert.equal(logic.snapJump(-94), -90);
  assert.equal(logic.snapJump(-96), -100);
  assert.equal(logic.snapJump(5), 10);
  assert.equal(logic.snapJump(999), 200);
  assert.equal(logic.snapJump(-999), -200);
  assert.equal(logic.snapJump('x'), logic.defaults.jump);
  assert.equal(logic.snapJump(null), logic.defaults.jump);
  assert.equal(logic.snapTau(25), 30);
  assert.equal(logic.snapTau(0), 20);
  assert.equal(logic.snapTau(1e6), 500);
  assert.equal(logic.snapTau(undefined), logic.defaults.tau);
  assert.equal(logic.snapT(37.56), 37.5);
  assert.equal(logic.snapT(-1), 0);
  assert.equal(logic.snapT(12.35), 12.4);
  assert.equal(logic.snapT('x'), 0);
});

test('tie-break: an unknown source falls back to the recording', () => {
  assert.equal(logic.source('tape'), 'rec');
  assert.equal(logic.source('model'), 'model');
  assert.equal(logic.source(undefined), 'rec');
  assert.equal(at({ src: 'x' }).src, 'rec');
});

test('tie-break: a character of the transcript shows from its own time on (ms ≤ t)', () => {
  const ev = rec.events;
  assert.equal(logic.transcript(ev, 0), '');
  assert.equal(logic.transcript(ev, 1.666), '');
  assert.equal(logic.transcript(ev, 1.667), 'Q');
  assert.equal(logic.transcript(ev, 5.125), 'QTH R', 'a space goes before the character that has sp set');
});

test('tie-break: the recording\'s page boundaries go to the later page, and the very end to the last page', () => {
  const w = logic.REC_DURATION / logic.REC_PAGES;
  assert.equal(logic.recPage(0).i, 0);
  assert.equal(logic.recPage(w - 1e-6).i, 0);
  assert.equal(logic.recPage(w).i, 1);
  assert.equal(logic.recPage(3 * w).i, 3);
  assert.equal(logic.recPage(logic.REC_DURATION).i, logic.REC_PAGES - 1);
  assert.equal(logic.recPage(logic.REC_MAX).i, logic.REC_PAGES - 1);
  const p = logic.recPage(10);
  assert.ok(p.from <= 10 && 10 < p.to);
});

// ── the model's rules ──

test('the pitch starts at the true pitch plus the jump and returns exponentially with tau', () => {
  assert.equal(logic.pitch(0, -90, 300), logic.F0 - 90);
  assert.ok(near(logic.pitch(300, -90, 300), logic.F0 - 90 / Math.E));
  assert.ok(near(logic.pitch(600, 120, 300), logic.F0 + 120 / Math.E / Math.E));
  assert.ok(logic.pitch(5000, -90, 300) > logic.F0 - 1e-5);
  // monotonic towards the true pitch, from either side
  assert.ok(logic.pitch(50, -90, 100) > logic.pitch(10, -90, 100));
  assert.ok(logic.pitch(50, 90, 100) < logic.pitch(10, 90, 100));
});

test('end offsets: dits end further from the true pitch than dahs (the preset numbers)', () => {
  const like = at({ src: 'model', jump: -90, tau: 300 });
  assert.equal(like.ditEnd, -64);   // 90 · e^(−1/3) = 64.5
  assert.equal(like.dahEnd, -33);   // 90 · e^(−1)   = 33.1
  const fast = at({ src: 'model', jump: -90, tau: 100 });
  assert.equal(fast.ditEnd, -33);
  assert.equal(fast.dahEnd, -4);    // 90 · e^(−3)   = 4.5
  const above = at({ src: 'model', jump: 150, tau: 60 });
  assert.equal(above.dir, 'above');
  assert.equal(above.ditEnd, 28);   // 150 · e^(−100/60) = 28.3
});

test('Morse timing: dit 1, dah 3, gap 1 inside a letter, 3 between letters (CQ = 27 units)', () => {
  const u = logic.DIT;
  const k = logic.keying('CQ', u);
  assert.deepEqual(k.map((e) => e.dah ? '-' : '.').join(''), '-.-.--.-');
  assert.deepEqual(k.slice(0, 2).map((e) => [e.on, e.off]), [[0, 3 * u], [4 * u, 5 * u]]);
  assert.equal(k[3].off, 11 * u, 'C is 11 units long');
  assert.equal(k[4].on, 14 * u, 'Q starts after a 3-unit gap');
  assert.equal(k[k.length - 1].off, 27 * u);
  assert.equal(at({}).duration, 27 * u);
  assert.equal(at({}).word, 'CQ');
  assert.equal(logic.keying('SSS', u)[8].off, 21 * u);
  assert.equal(logic.keying('OOO', u)[8].off, 39 * u);
  assert.equal(logic.keying('C?Q', u).length, 8, 'letters without a code are skipped');
});

// ── the recording ──

test('the recording is the original\'s MP3, unchanged', () => {
  assert.ok(rec.audio.startsWith('data:audio/mpeg;base64,'));
  assert.equal(crypto.createHash('sha256').update(rec.audio).digest('hex'),
    '284f858588e3f305742381503908358cd32013a6d340991038daf4b649e34b47');
  assert.equal(rec.duration, logic.REC_DURATION);
});

test('the transcript is the original\'s: QTH RHEINHAUSEN RHEINHAUSEN HW?', () => {
  assert.equal(rec.events.length, 28);
  assert.equal(logic.transcript(rec.events, rec.duration), 'QTH RHEINHAUSEN RHEINHAUSEN HW?');
  for (let i = 1; i < rec.events.length; i++) assert.ok(rec.events[i][0] >= rec.events[i - 1][0], `event ${i} in order`);
});

test('the measured pitch track is in order, inside the recording and the detector\'s band, and rises on average', () => {
  let prevOff = 0, rises = 0;
  for (const [on, off, t0, f] of rec.track) {
    assert.ok(on >= prevOff && off > on && off <= rec.duration, `${on}`);
    assert.ok(t0 >= on && t0 + (f.length - 1) * 0.01 <= off + 1e-9, `${on}: samples inside the element`);
    assert.ok(f.length >= 3);
    for (const v of f) assert.ok(v >= 170 && v <= 360, `${on}: ${v}`);
    prevOff = off;
  }
  // the chirp of this recording: the dahs (longer than 170 ms) start lower than they end
  const dahs = rec.track.filter(([on, off]) => off - on > 0.17);
  assert.equal(dahs.length, 18, 'QTH RHEINHAUSEN RHEINHAUSEN HW? has 18 dahs');
  for (const [, , , f] of dahs) if (f[f.length - 1] > f[0]) rises++;
  assert.ok(rises >= 15, `${rises} of 18 dahs rise`);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const p of logic.presets) {
    const st = at(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(st)), st);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ src: 'model', jump: 70, tau: 120 });
  const copy = structuredClone(p);
  const st = logic.initial(p);
  assert.deepEqual(logic.initial(p), st);
  assert.deepEqual(p, copy);
  st.elements[0].on = 99;
  assert.equal(logic.initial(p).elements[0].on, 0);
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
    assert.equal(st.src, p.params.src, `preset ${p.id} src`);
    if (p.params.jump != null) assert.equal(st.jumpSet, p.params.jump, `preset ${p.id} jump in range`);
    if (p.params.tau != null) assert.equal(st.tau, p.params.tau, `preset ${p.id} tau in range`);
  }
});
