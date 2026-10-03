// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the aurora helpers and the recording. Run: node --test sims/aurora/
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
const wavBytes = () => new Uint8Array(Buffer.from(rec.audio.slice(rec.audio.indexOf(',') + 1), 'base64'));
let decoded = null;
const wav = () => decoded || (decoded = logic.decodeWav(wavBytes()));

// A tiny WAV: mono 16-bit PCM at `rate`, with optional extra chunks before 'data'.
function makeWav(samples, rate, extra = []) {
  const parts = [];
  const chunk = (id, body) => {
    const h = Buffer.alloc(8); h.write(id, 0, 'ascii'); h.writeUInt32LE(body.length, 4);
    parts.push(h, body, body.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0));
  };
  const fmt = Buffer.alloc(16);
  fmt.writeUInt16LE(1, 0); fmt.writeUInt16LE(1, 2); fmt.writeUInt32LE(rate, 4); fmt.writeUInt32LE(rate * 2, 8);
  fmt.writeUInt16LE(2, 12); fmt.writeUInt16LE(16, 14);
  chunk('fmt ', fmt);
  for (const [id, body] of extra) chunk(id, body);
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), 2 * i));
  chunk('data', data);
  const body = Buffer.concat(parts), head = Buffer.alloc(12);
  head.write('RIFF', 0, 'ascii'); head.writeUInt32LE(body.length + 4, 4); head.write('WAVE', 8, 'ascii');
  return new Uint8Array(Buffer.concat([head, body]));
}

// ── tie-breaks first ──

test('tie-break: the position snaps halves up and clamps; junk is 0', () => {
  assert.equal(logic.snapT(12.35), 12.4);
  assert.equal(logic.snapT(12.34), 12.3);
  assert.equal(logic.snapT(-1), 0);
  assert.equal(logic.snapT(rec.duration), logic.REC_MAX);
  assert.equal(logic.snapT('x'), 0);
  assert.equal(logic.snapT(null), 0);
  assert.equal(logic.snapT(true), 0);
  assert.equal(logic.snapT('21.9'), 21.9);
  assert.equal(at({ t: 7 }).t, 7);
});

test('tie-break: an over boundary belongs to the later over; before 0 is the first, past the end the last', () => {
  assert.equal(logic.overAt(0).id, 'a1');
  assert.equal(logic.overAt(-5).id, 'a1');
  assert.equal(logic.overAt(21.899).id, 'a1');
  assert.equal(logic.overAt(21.9).id, 'b');
  assert.equal(logic.overAt(29.499).id, 'b');
  assert.equal(logic.overAt(29.5).id, 'a2');
  assert.equal(logic.overAt(99).id, 'a2');
  assert.equal(at({ t: 21.9 }).over, 'b');
});

test('tie-break: a character of the transcript shows from its own time on (ms ≤ t)', () => {
  const ev = rec.events;
  assert.equal(logic.transcript(ev, 0, 0), 'R', 'the first R is complete at 0 ms, as in the original');
  assert.equal(logic.transcript(ev, 0.709, 0), 'R');
  assert.equal(logic.transcript(ev, 0.71, 0), 'R R');
  assert.equal(logic.transcript(ev, 21.963, 1), '');
  assert.equal(logic.transcript(ev, 21.964, 1), 'R');
});

test('tie-break: each bubble has its own transcript, and a bubble never starts with a space', () => {
  const ev = [[100, 'A', 1, 0], [200, 'B', 1, 1], [300, 'C', 1, 0], [400, 'D', 0, 1], [500, 'E', 1, 2]];
  assert.equal(logic.transcript(ev, 1, 0), 'A C');
  assert.equal(logic.transcript(ev, 1, 1), 'BD');
  assert.equal(logic.transcript(ev, 1, 2), 'E');
  assert.equal(logic.transcript(ev, 0.25, 1), 'B');
});

test('tie-break: the peak is the lowest of equal bins, and bins exactly 10 dB down are inside the width', () => {
  // df = 10 Hz; bins below FMIN_PEAK (100 Hz) are never the peak, however loud
  const p = new Array(40).fill(0);
  p[2] = 1000;                          // 20 Hz: below FMIN_PEAK
  p[20] = 10; p[25] = 10;               // two equal peaks: the lower one wins
  p[19] = 1; p[21] = 1; p[22] = 0.999;  // exactly −10 dB is in, just under is out
  const w = logic.widthOf(p, 10);
  assert.equal(w.peak, 200);
  assert.equal(w.lo, 190);
  assert.equal(w.hi, 210);
  assert.equal(w.width, 30, 'three bins × 10 Hz');
  assert.equal(logic.widthOf(new Array(40).fill(0), 10), null, 'nothing: no width');
});

test('tie-break: the width is the run around the peak, not every bin above the limit', () => {
  const p = new Array(60).fill(0);
  p[30] = 100; p[31] = 50; p[40] = 90;   // 40 is above the limit but not joined to the peak
  const w = logic.widthOf(p, 10);
  assert.deepEqual([w.lo, w.hi, w.width], [300, 310, 20]);
});

// ── the rules ──

test('decodeWav reads mono 16-bit PCM, skips other chunks (odd sizes padded), and refuses anything else', () => {
  const x = [0, 0.5, -0.5, 1, -1];
  const d = logic.decodeWav(makeWav(x, 8000, [['LIST', Buffer.from('abc')]]));
  assert.equal(d.rate, 8000);
  assert.equal(d.samples.length, 5);
  assert.ok(Math.abs(d.samples[1] - 0.5) < 1e-4 && Math.abs(d.samples[2] + 0.5) < 1e-4);
  assert.throws(() => logic.decodeWav(new Uint8Array(Buffer.from('RIFF\0\0\0\0AVI LIST'))), /not a WAV/);
  const stereo = makeWav(x, 8000); stereo[22] = 2;   // channels = 2
  assert.throws(() => logic.decodeWav(stereo), /mono 16-bit/);
});

test('the FFT finds a pure tone in its bin', () => {
  const n = 64, re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < n; i++) re[i] = Math.cos(2 * Math.PI * 5 * i / n);
  logic.fft(re, im);
  assert.ok(Math.abs(re[5] - n / 2) < 1e-9 && Math.abs(re[n - 5] - n / 2) < 1e-9);
  for (let k = 0; k < n; k++) if (k !== 5 && k !== n - 5) assert.ok(Math.hypot(re[k], im[k]) < 1e-9, `bin ${k}`);
});

test('a path\'s spectrum takes the key-up noise out: a keyed tone in noise measures as the tone alone', () => {
  // 8 kHz, 4 s: a 500 Hz tone keyed on and off every 0.25 s, over a steady 1500 Hz "noise" tone, in an over of its own
  const rate = 8000, x = [];
  for (let i = 0; i < 4 * rate; i++) {
    const on = Math.floor(i / (rate / 4)) % 2 === 0;
    x.push((on ? 0.5 * Math.sin(2 * Math.PI * 500 * i / rate) : 0) + 0.1 * Math.sin(2 * Math.PI * 1500 * i / rate));
  }
  const r = { rate, samples: Float32Array.from(x) };
  const saved = logic.OVERS.slice();
  logic.OVERS.length = 0;
  logic.OVERS.push({ id: 'x', from: 0, station: 'X', path: 'own', bubble: 0 });
  try {
    const sp = logic.pathSpectrum(r, 'own', 512);
    assert.equal(sp.peak, 500);
    assert.ok(sp.width <= 3 * sp.df, `a pure tone is a few bins wide: ${sp.width}`);
    assert.ok(sp.db[Math.round(1500 / sp.df)] <= -40, 'the steady 1500 Hz is in the key-up frames too, so it is taken out');
    assert.ok(sp.down > 0 && sp.up > 0);
  } finally {
    logic.OVERS.length = 0;
    saved.forEach((o) => logic.OVERS.push(o));
  }
});

test('quantile takes the value at floor(q·(n − 1)) of the sorted list', () => {
  assert.equal(logic.quantile([5, 1, 4, 2, 3], 0.9), 4);
  assert.equal(logic.quantile([5, 1, 4, 2, 3, 6, 7, 8, 9, 10, 11], 0.9), 10);
  assert.equal(logic.quantile([], 0.9), 0);
});

// ── the recording ──

test('the recording is the original\'s WAV, unchanged: 36.74 s, mono, 8 kHz', () => {
  assert.ok(rec.audio.startsWith('data:audio/wav;base64,'));
  assert.equal(crypto.createHash('sha256').update(rec.audio).digest('hex'),
    'd07199c146923737ab9530c21bbcde205b2b154909e08f2b8c541ed5ba97e678');
  assert.equal(rec.duration, logic.REC_DURATION);
  assert.equal(wav().rate, 8000);
  assert.equal(wav().samples.length, 293888);
  assert.equal(wav().samples.length / wav().rate, rec.duration);
});

test('the transcript is the original\'s three bubbles', () => {
  assert.equal(rec.events.length, 57);
  assert.equal(logic.transcript(rec.events, rec.duration, 0), 'R R R R "73" 73 ES TU TU OK/DF7TR/P DE GM4YXI TU EE');
  assert.equal(logic.transcript(rec.events, rec.duration, 1), 'R R R R R 73 73 EE');
  assert.equal(logic.transcript(rec.events, rec.duration, 2), 'EE TU DE GM4YXI');
  for (let i = 1; i < rec.events.length; i++) assert.ok(rec.events[i][0] >= rec.events[i - 1][0], `event ${i} in order`);
});

test('every character falls in its own bubble\'s over', () => {
  for (const [ms, ch, , b] of rec.events) assert.equal(logic.overAt(ms / 1000).bubble, b, `${ch} at ${ms} ms`);
});

test('the measured widths: via the aurora about 730 Hz around 560 Hz, the own signal within the analysis\'s limit at the same pitch', () => {
  const a = logic.pathSpectrum(wav(), 'aurora', 1024), o = logic.pathSpectrum(wav(), 'own', 1024);
  assert.equal(a.df, 7.8125);
  assert.equal(a.width, 734.375);
  assert.equal(a.peak, 562.5);
  assert.deepEqual([a.lo, a.hi], [320.3125, 1046.875]);
  assert.equal(o.width, 31.25, 'four bins: the Hann window\'s main lobe');
  assert.equal(o.peak, 546.875);
  assert.ok(Math.abs(a.peak - o.peak) < 20, 'the same pitch');
  assert.ok(a.width > 20 * o.width);
  assert.ok(a.down > 100 && a.up > 50 && o.down > 50 && o.up > 10, 'enough key-down and key-up frames on both paths');
});

test('the spectrogram covers the recording to FMAX, in dB from the floor to 0', () => {
  const sg = logic.spectrogram(wav(), 256, 160, -50);
  assert.equal(sg.bins, 65);
  assert.equal(sg.df * (sg.bins - 1), logic.FMAX);
  assert.equal(sg.cols, Math.floor((wav().samples.length - 256) / 160) + 1);
  let max = -Infinity, min = Infinity;
  for (const v of sg.db) { if (v > max) max = v; if (v < min) min = v; }
  assert.equal(max, 0);
  assert.equal(min, -50);
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
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer has no steps');
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('every preset is valid and starts its own over, and the page meta is an explorer', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.equal(new Set(logic.presets.map((p) => p.id)).size, logic.presets.length);
  const overs = { aurora: 'a1', own: 'b', last: 'a2' };
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: param ${k}`);
    assert.equal(at(p.params).t, p.params.t, `preset ${p.id} t in range`);
    assert.equal(at(p.params).over, overs[p.id], `preset ${p.id}`);
  }
});
