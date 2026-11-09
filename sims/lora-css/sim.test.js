// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lora-css (SPEC.md). Run: node --test sims/lora-css/sim.test.js
// Tie-breaks first, then one test per rule, then the presets, then the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const S = (over) => L.initial(P(over));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b} (±${tol})`);
const preset = (id) => L.presets.find((x) => x.id === id).params;

// ── tie-breaks ──

test('tie-break (rule 3): an exact quotient is not rounded up; one byte more is', () => {
  // SF7, CR 4/5: (8·5 − 28 + 28 + 16) / 28 = 2 exactly → 8 + 2·5 = 18; PL 6: 64/28 → 3 → 23
  assert.equal(L.payloadSymbols(5, 7, 1, 0, 0, 1), 18);
  assert.equal(L.payloadSymbols(6, 7, 1, 0, 0, 1), 23);
});

test('tie-break (rule 3): a negative block count is clamped to 0, leaving the 8 symbols', () => {
  // implicit header, no CRC, PL 1 at SF12 with DE: (8 − 48 + 28 − 20) / 40 < 0 → 8 symbols
  assert.equal(L.payloadSymbols(1, 12, 1, 1, 1, 0), 8);
  // ceil of a small negative is −0, still 8; an empty implicit-header payload gives −1 blocks, clamped to 0
  assert.equal(L.payloadSymbols(2, 12, 1, 1, 1, 0), 8);
  assert.equal(L.payloadSymbols(0, 12, 1, 1, 1, 0), 8);
});

test('tie-break (rule 3): low-data-rate optimisation only above 16 ms; exactly 16 ms is off', () => {
  assert.equal(L.lowDataRate(16), 0);
  assert.equal(L.lowDataRate(16.001), 1);
  assert.equal(S({ SF: 10 }).de, 0);
  assert.equal(S({ SF: 11 }).de, 1);
  assert.equal(S({ SF: 12 }).de, 1);
  assert.equal(S({ SF: 12, BW: 250 }).de, 1);
  assert.equal(S({ SF: 11, BW: 250 }).de, 0);
  assert.equal(S({ SF: 12, BW: 500 }).de, 0);
});

test('tie-break: a bar that changes by exactly 10 % is not marked; more than 10 % is', () => {
  const a = { toaMs: 100, rangeFactor: 1, dutyWaitS: 10 };
  assert.deepEqual(L.changed(a, { toaMs: 110, rangeFactor: 0.9, dutyWaitS: 10 }), []);
  assert.deepEqual(L.changed(a, { toaMs: 110.1, rangeFactor: 0.89, dutyWaitS: 11.5 }), ['toa', 'range', 'wait']);
  assert.deepEqual(L.changed(null, a), []);
  // each bar reads its own value
  assert.deepEqual(L.changed(a, { toaMs: 100, rangeFactor: 1, dutyWaitS: 12 }), ['wait']);
  assert.deepEqual(L.changed(a, { toaMs: 120, rangeFactor: 1, dutyWaitS: 10 }), ['toa']);
  assert.deepEqual(L.changed(a, { toaMs: 100, rangeFactor: 1.2, dutyWaitS: 10 }), ['range']);
});

test('tie-break: out-of-range params fall back to the defaults', () => {
  const s = S({ SF: 6, BW: 200, CR: 0, payload: 0, n: 'x', view: 'y' });
  assert.equal(s.SF, 7); assert.equal(s.BW, 125); assert.equal(s.CR, 1); assert.equal(s.payload, 20);
  assert.equal(s.n, 'free'); assert.equal(s.view, 'window');
  assert.equal(S({ payload: 51 }).payload, 20);
  assert.equal(S({ payload: 2.5 }).payload, 20);
  assert.equal(S({ payload: 50 }).payload, 50);
  assert.equal(S({ view: 'symbols' }).view, 'symbols');
});

// ── rules ──

test('rule 1: T_s = 2^SF / BW; one symbol carries SF bits on 2^SF offsets', () => {
  assert.equal(L.symbolMs(7, 125), 1.024);
  assert.equal(L.symbolMs(12, 125), 32.768);
  assert.equal(L.symbolMs(9, 500), 1.024);
  const s = S({ SF: 9 });
  assert.equal(s.Ts, 4.096); assert.equal(s.chips, 512); assert.equal(s.bitsPerSymbol, 9);
  // every SF step doubles T_s; every BW doubling halves it
  for (const sf of [7, 8, 9, 10, 11]) assert.equal(L.symbolMs(sf + 1, 125), 2 * L.symbolMs(sf, 125));
  assert.equal(L.symbolMs(10, 250), L.symbolMs(10, 125) / 2);
});

test('rule 2: R_b = SF · BW / 2^SF · 4/(4 + CR)', () => {
  near(L.bitRate(7, 125, 1), 5468.75, 1e-9);
  near(L.bitRate(12, 125, 1), 292.96875, 1e-9);
  near(L.bitRate(7, 125, 4), 7 * 125000 / 128 / 2, 1e-9);
  assert.equal(S({ SF: 12 }).bitRate, 292.97);
});

test('rule 3: time on air = (8 + 4.25)·T_s + n_payload·T_s', () => {
  const a = L.airtime(7, 125, 1, 20);
  assert.equal(a.payloadSymbols, 43);
  assert.equal(a.symbols, 55.25);
  near(a.toaMs, 56.576, 1e-9);
  // CRC adds 16 bits, explicit header (H = 0) its 20 bits, DE divides by SF − 2
  assert.equal(L.payloadSymbols(20, 7, 1, 0, 1, 1), 8 + 6 * 5);
  assert.equal(L.payloadSymbols(20, 7, 1, 0, 0, 0), 8 + 6 * 5);
  assert.equal(L.payloadSymbols(20, 12, 1, 1, 0, 1), 28);
  assert.equal(L.payloadSymbols(20, 12, 1, 0, 0, 1), 8 + 4 * 5);
  assert.equal(L.payloadSymbols(50, 12, 4, 1, 0, 1), 88);
  // payload and coding rate change only the time on air
  const base = S({}), more = S({ payload: 50, CR: 4 });
  assert.ok(more.toaMs > base.toaMs);
  for (const k of ['Ts', 'sensitivityDbm', 'rangeFactor', 'snrLimit']) assert.equal(more[k], base[k], k);
  assert.ok(more.bitRate < base.bitRate);
});

test('rule 4: SNR limit −7.5 dB at SF7, 2.5 dB lower per step; sensitivity −174 + 10·log10(BW) + 6 + SNR', () => {
  assert.deepEqual(L.SFS.map(L.snrLimit), [-7.5, -10, -12.5, -15, -17.5, -20]);
  near(L.sensitivity(7, 125), -124.53, 0.005);
  near(L.sensitivity(12, 125), -137.03, 0.005);
  // doubling BW costs 10·log10(2) ≈ 3 dB
  near(L.sensitivity(9, 250) - L.sensitivity(9, 125), 3.0103, 1e-4);
  assert.ok(S({ SF: 12 }).snrLimit < 0, 'demodulates below the noise');
});

test('rule 5: range factor = 10^(Δ/(10·n)) against SF7 at 125 kHz; n 2 or 3.5', () => {
  near(L.rangeFactor(12.5, 2), 4.217, 1e-3);
  near(L.rangeFactor(12.5, 3.5), 2.276, 1e-3);
  assert.equal(L.rangeFactor(0, 2), 1);
  assert.equal(S({}).rangeFactor, 1);
  assert.equal(S({ SF: 12 }).rangeFactor, 4.217);
  assert.equal(S({ SF: 12, n: 'built' }).rangeFactor, 2.276);
  assert.equal(S({ BW: 500 }).rangeFactor, 0.5);
  assert.deepEqual(L.PATH_N, { free: 2, built: 3.5 });
});

test('rule 6: a 1 % duty cycle means 99 × the time on air of silence', () => {
  near(L.dutyWait(1000), 99, 1e-9);
  near(S({}).dutyWaitS, 5.601, 1e-3);
  near(S({ SF: 12 }).dutyWaitS, 130.57, 0.01);
});

test('chirps: preamble of 8 up-chirps at offset 0, 2 sync, 2.25 down, then the data symbols, back to back', () => {
  const s = S({});
  const kinds = s.chirps.map((c) => c.kind);
  assert.deepEqual(kinds.slice(0, 13), ['pre', 'pre', 'pre', 'pre', 'pre', 'pre', 'pre', 'pre', 'sync', 'sync', 'down', 'down', 'down']);
  assert.equal(kinds.filter((k) => k === 'data').length, s.payloadSymbols);
  assert.ok(s.chirps.filter((c) => c.kind === 'pre').every((c) => c.offset === 0));
  assert.equal(s.chirps[12].dur, s.Ts / 4);
  for (let i = 1; i < s.chirps.length; i++) near(s.chirps[i].start, s.chirps[i - 1].start + s.chirps[i - 1].dur, 1e-3, `chirp ${i}`);
  const last = s.chirps[s.chirps.length - 1];
  near(last.start + last.dur, s.toaMs, 1e-3);
  for (const sf of L.SFS) {
    const t = S({ SF: sf });
    assert.ok(t.chirps.every((c) => Number.isInteger(c.offset) && c.offset >= 0 && c.offset < t.chips), `SF${sf}`);
  }
  // over every payload at SF7 the values cover 0 … 127 and never reach 128
  const all = [];
  for (let pl = 1; pl <= L.PL_MAX; pl++) S({ payload: pl }).chirps.filter((c) => c.kind === 'data').forEach((c) => all.push(c.offset));
  assert.equal(Math.min(...all), 0); assert.equal(Math.max(...all), 127);
  // the data values depend on SF and payload only
  const vals = (t) => t.chirps.slice(13, 20).map((c) => c.offset);
  assert.deepEqual(vals(S({ CR: 4, BW: 500, n: 'built' })), vals(s));
  assert.notDeepEqual(vals(S({ payload: 21 })), vals(s));
  assert.notDeepEqual(vals(S({ SF: 8 })), vals(s));
});

test('chirps: an up-chirp with offset k wraps at 1 − k/2^SF of the symbol; offset 0 does not wrap', () => {
  assert.equal(L.wrapAt(0, 7), null);
  assert.equal(L.wrapAt(64, 7), 0.5);
  assert.equal(L.wrapAt(1, 7), 1 - 1 / 128);
  assert.equal(L.wrapAt(1024, 12), 0.75);
});

test('the plotted span: the first 100 ms, the whole packet, or the first 4 data symbols', () => {
  assert.deepEqual(S({ SF: 12 }).span, [0, 100]);
  assert.deepEqual(S({}).span, [0, 100], 'fixed even when the packet is shorter');
  assert.deepEqual(S({ view: 'packet' }).span, [0, 56.576]);
  const z = S({ SF: 12, view: 'symbols' });
  assert.deepEqual(z.span, [12.25 * 32.768, 16.25 * 32.768]);
  assert.equal(z.chirps.filter((c) => c.start >= z.span[0] - 1e-9 && c.start < z.span[1] - 1e-9).length, 4);
  assert.ok(z.chirps.filter((c) => c.start >= z.span[0] - 1e-9 && c.start < z.span[1] - 1e-9).every((c) => c.kind === 'data'));
});

test('the table lists SF7 … SF12 at the current BW, CR and payload; the bars\' full scale is fixed', () => {
  const s = S({ BW: 250, payload: 33, CR: 2 });
  assert.deepEqual(s.table.map((r) => r.sf), [7, 8, 9, 10, 11, 12]);
  assert.deepEqual(s.table[2], L.row(9, 250, 2, 33, 2));
  assert.deepEqual(S({ n: 'built' }).table[5], L.row(12, 125, 1, 20, 3.5));
  assert.equal(S({ n: 'built' }).table[5].rangeFactor, 2.276);
  assert.deepEqual(s.table[s.SF - 7].toaMs, s.toaMs);
  assert.deepEqual(s.scale, S({ SF: 9, BW: 500, payload: 1, n: 'built' }).scale);
  near(s.scale.toaMs, 3284.992, 1e-3);
  assert.deepEqual(s.ref, { toaMs: L.row(7, 125, 2, 33, 2).toaMs, rangeFactor: 1, dutyWaitS: L.row(7, 125, 2, 33, 2).dutyWaitS });
  assert.ok(L.SFS.every((sf) => L.BWS.every((bw) => S({ SF: sf, BW: bw, payload: 50, CR: 4 }).toaMs <= s.scale.toaMs)));
});

// ── presets: the task's numbers ──

test('preset sf7: T_s 1.024 ms, 43 symbols, 56.6 ms, 5.5 kbit/s, −124.5 dBm, wait 5.6 s', () => {
  const s = S(preset('sf7'));
  assert.equal(s.Ts, 1.024); assert.equal(s.payloadSymbols, 43); near(s.toaMs, 56.6, 0.05);
  near(s.bitRate, 5469, 1); near(s.sensitivityDbm, -124.5, 0.05); near(s.dutyWaitS, 5.6, 0.01);
});

test('preset sf12: 32.8 ms, 1319 ms (23× SF7), 293 bit/s, −137 dBm, × 4.2 or × 2.3, wait 131 s', () => {
  const s = S(preset('sf12'));
  near(s.Ts, 32.8, 0.05); near(s.toaMs, 1319, 0.5); assert.equal(s.vsSf7.toa, 23.31);
  near(s.bitRate, 293, 0.5); near(s.sensitivityDbm, -137, 0.05);
  near(s.rangeFactor, 4.2, 0.02); near(S(Object.assign({}, preset('sf12'), { n: 'built' })).rangeFactor, 2.3, 0.03);
  near(s.dutyWaitS, 131, 0.5);
  assert.equal(s.vsSf7.range, 4.22);
  // the caption compares with SF7 at the same bandwidth
  const w = S(Object.assign({}, preset('sf12'), { BW: 500 }));
  assert.equal(w.vsSf7.toa, 23.31); assert.equal(w.vsSf7.range, 4.22); assert.equal(w.rangeFactor, 2.108);
  const wb = S(Object.assign({}, preset('sf12'), { BW: 500, n: 'built' }));
  assert.equal(wb.vsSf7.range, 2.28);
});

test('preset sf9-bw: SF9 at 125 / 250 / 500 kHz → 185 / 93 / 46 ms; each doubling costs 3 dB', () => {
  const t = L.BWS.map((bw) => S(Object.assign({}, preset('sf9-bw'), { BW: bw })));
  assert.deepEqual(t.map((s) => Math.round(s.toaMs)), [185, 93, 46]);
  near(t[1].sensitivityDbm - t[0].sensitivityDbm, 3, 0.02);
  near(t[2].sensitivityDbm - t[1].sensitivityDbm, 3, 0.02);
  assert.equal(S(preset('sf9-bw')).BW, 250);
});

test('preset sf-step: SF10 → SF11 doubles the airtime (371 → 741 ms) for 2.5 dB', () => {
  const s = S(preset('sf-step'));
  assert.equal(s.SF, 11);
  near(s.table[3].toaMs, 370.7, 0.05); near(s.table[4].toaMs, 741.4, 0.05);
  near(s.table[3].sensitivityDbm - s.table[4].sensitivityDbm, 2.5, 1e-9);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and every SF × BW × CR', () => {
  for (const pr of [{ params: {} }].concat(L.presets)) {
    const s = S(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
  for (const SF of L.SFS) for (const BW of L.BWS) for (const CR of L.CRS) {
    const s = S({ SF, BW, CR, payload: 50, n: 'built', view: 'packet' });
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ SF: 10, BW: 500, CR: 3, payload: 37 });
  const copy = structuredClone(p);
  assert.deepEqual(L.initial(p), L.initial(p));
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has a name and hint in both languages; the page is an explorer', () => {
  for (const pr of L.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in L.defaults, `${pr.id}: ${k}`);
    for (const key of ['preset_' + pr.id, 'preset_' + pr.id + 'Hint']) assert.ok(strings.hr[key] && strings.en[key], key);
  }
  assert.deepEqual(L.presets.map((x) => x.id), ['sf7', 'sf12', 'sf9-bw', 'sf-step']);
  for (const pr of L.presets) { assert.equal(pr.params.payload, 20, pr.id); assert.equal(pr.params.CR, 1, pr.id); }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.id, 'lora-css');
});

test('constants SPEC.md names', () => {
  assert.deepEqual(L.defaults, { SF: 7, BW: 125, CR: 1, payload: 20, n: 'free', view: 'window' });
  assert.equal(L.PREAMBLE, 8); assert.equal(L.SYNC, 4.25); assert.equal(L.NF, 6); assert.equal(L.KTB, -174);
  assert.equal(L.DE_MS, 16); assert.equal(L.DUTY, 0.01); assert.equal(L.WINDOW_MS, 100); assert.equal(L.PL_MAX, 50);
  assert.deepEqual(L.REF, { sf: 7, bw: 125 });
  assert.equal(L.ZOOM_SYMBOLS, 4); assert.deepEqual(L.VIEWS, ['window', 'packet', 'symbols']);
});
