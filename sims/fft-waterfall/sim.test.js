// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fft-waterfall (SPEC.md). Run: node --test sims/fft-waterfall/
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
const dB = (p) => 10 * Math.log10(p);
const preset = (id) => L.presets.find((x) => x.id === id).params;
/** Local maxima of a noise-free row between two offsets (Hz), as bins. */
function peaks(p, r, lo, hi) {
  const pow = L.rowPower(p, r), half = p.N / 2, bin = p.fs * 1e6 / p.N, out = [];
  for (let k = Math.ceil(lo / bin); k <= Math.floor(hi / bin); k++) {
    const v = pow[k + half];
    if (v > pow[k + half - 1] && v >= pow[k + half + 1] && dB(v) > -100) out.push(k);
  }
  return out;
}

// ── tie-breaks ──

test('tie-break (rule 1, 5): −fs/2 is inside the span; exactly +fs/2 is outside and folds to −fs/2', () => {
  const fs = 2.5e6;
  assert.equal(L.inSpan(-fs / 2, fs), true);
  assert.equal(L.inSpan(fs / 2, fs), false);
  assert.equal(L.inSpan(fs / 2 - 1e-3, fs), true);
  assert.equal(L.fold(fs / 2, fs), -fs / 2);
  assert.equal(L.fold(-fs / 2, fs), -fs / 2);
  assert.equal(L.fold(3 * fs / 2, fs), -fs / 2);
});

test('tie-break (rule 4): carriers exactly 2 bins apart count as resolved, a hair less does not', () => {
  assert.equal(L.RESOLVE_BINS, 2);
  assert.equal(L.resolved(2), true);
  assert.equal(L.resolved(1.999), false);
  // the noise-free in-phase sum W(x) + W(x − d): one top in the middle at 1.8 bins; a dip already at 2 (from ≈ 1.88)
  const sum = (x, d) => L.hann(x) + L.hann(x - d);
  const top = (d) => { let m = -1; for (let x = 0; x <= d; x += 1e-3) m = Math.max(m, sum(x, d)); return m; };
  near(top(1.8), sum(0.9, 1.8), 1e-9, 'd = 1.8: the middle is the top');
  assert.ok(sum(1, 2) < top(2) - 0.02, 'd = 2: a dip in the middle');
  // the sidelobes alternate in sign (the in-phase sum needs them)
  assert.ok(L.hann(2.5) < 0 && L.hann(3.5) > 0);
});

test('tie-break (rule 9): equal bins, the lower one wins; the DC guard is skipped', () => {
  const v = new Float64Array(32);                          // bins −16 … 15
  v[16 + 7] = 5; v[16 - 9] = 5; v[16 + 2] = 9;              // bin 2 is in the guard
  assert.deepEqual(L.strongest(v, 4), { k: -9, v: 5 });
  assert.deepEqual(L.strongest(v, 0), { k: 2, v: 9 });
  // the guard is inclusive: ±4 excluded, ±5 measured
  const w = new Float64Array(32); w[16 + 4] = 9; w[16 - 5] = 3;
  assert.deepEqual(L.strongest(w, 4), { k: -5, v: 3 });
  // the threshold: 10 dB above the mean noise counts, a hair less does not
  assert.equal(L.detected(-90, -100), true);
  assert.equal(L.detected(-90.01, -100), false);
});

test('tie-break (rule 10): a zoom near the span edge is shifted inside; a focus outside the span centres on DC', () => {
  // the alias preset zoomed to 200 kHz round the strong signal's alias at −50 kHz: −150 … +50 would leave the span
  const s = S(Object.assign({}, preset('alias'), { zoom: 7 }));
  assert.equal(s.view.width, 200e3);
  assert.equal(s.view.lo, -125e3);
  assert.equal(s.view.hi, 75e3);
  // filter on: the strong signal is filtered out, so the view centres on DC
  const f = S({ fs: 0.25, filter: true, focus: 'strong', zoom: 5 });
  assert.equal(f.view.missing, true);
  assert.equal(f.view.lo, -25e3);
  assert.equal(f.view.hi, 25e3);
});

// ── rules ──

test('rule 1: the span is fs, centred on the tuned frequency', () => {
  for (const fs of L.FS) for (const band of ['2m', '70cm']) {
    const s = S({ fs, band });
    assert.equal(s.span, fs * 1e6);
    assert.equal(s.spanLo, L.BANDS[band] - fs * 1e6 / 2);
    assert.equal(s.spanHi, L.BANDS[band] + fs * 1e6 / 2);
  }
  const s = S(preset('2m-monitor'));
  assert.equal(s.spanLo, 143.75e6); assert.equal(s.spanHi, 146.25e6);
  // the whole 2 m band (144–146 MHz) fits at 2.5 MSPS; the 70 cm band (430–440) needs 12.5
  assert.ok(s.signals.every((x) => x.inSpan));
  assert.ok(S({ fs: 2.5, band: '70cm' }).signals.every((x) => !x.inSpan));
  assert.ok(S(preset('70cm-monitor')).signals.every((x) => x.inSpan));
});

test('rule 2: N bins of width fs/N; the full view covers all N', () => {
  for (const fs of L.FS) for (const N of L.NS) {
    const s = S({ fs, N });
    assert.equal(s.binHz, fs * 1e6 / N);
    assert.equal(s.binsInView, N);
    assert.equal(s.cols[0][0], -N / 2);
    assert.equal(s.cols[s.cols.length - 1][1], N / 2 - 1);
  }
  near(S(preset('2m-monitor')).binHz, 76.29, 0.005);
  near(S(preset('70cm-monitor')).binHz, 381.47, 0.005);
});

test('rule 3: a block lasts N/fs, rows come fs/N a second; doubling N halves the bin and the row rate', () => {
  const a = S({ fs: 2.5, N: 32768 }), b = S({ fs: 2.5, N: 65536 });
  near(a.blockMs, 13.107, 0.001); near(a.rowsPerSec, 76.29, 0.01); near(a.historyS, 0.524, 0.001);
  near(b.binHz, a.binHz / 2, 1e-9); near(b.rowsPerSec, a.rowsPerSec / 2, 1e-9); near(b.blockMs, 2 * a.blockMs, 1e-9);
  for (const s of [a, b]) near(s.binHz * s.blockMs / 1000, 1, 1e-12, 'Δf · T = 1');
  assert.equal(a.waterfall.length, L.ROWS);
});

test('rule 4: the Hann response: W(0) = 1, W(±1) = ½, zeros at ±2; scalloping 1.42 dB, 3 dB width 1.44, ENBW 1.5 bins', () => {
  assert.equal(L.hann(0), 1); assert.equal(L.hann(1), 0.5); assert.equal(L.hann(-1), 0.5);
  assert.equal(L.hann(2), 0); assert.equal(L.hann(-3), 0);
  near(20 * Math.log10(L.hann(0.5)), -1.424, 0.001);
  let x = 0; while (L.hann(x) > Math.SQRT1_2) x += 1e-4;
  near(2 * x, 1.44, 0.005);
  near(L.cum(48), L.ENBW, 1e-3);
});

test('rule 4: the two carriers 200 Hz apart: one bump at N 4096, two peaks at N 65536', () => {
  const p4 = P(preset('two-carriers')), p64 = P(Object.assign({}, preset('two-carriers'), { N: 65536 }));
  const mid = -970e3 + 100;                                // 144.0300 and 144.0302 MHz
  assert.equal(peaks(p4, 0, mid - 5e3, mid + 5e3).length, 1);
  assert.equal(peaks(p64, 0, mid - 5e3, mid + 5e3).length, 2);
  assert.equal(S(p4).resolved, false); near(S(p4).pairBins, 0.328, 0.001);
  assert.equal(S(p64).resolved, true); near(S(p64).pairBins, 5.243, 0.001);
});

test('rule 4: the two carriers add in amplitude, in phase: 0.08 bins apart they make one line 6 dB above either', () => {
  const p = P({ N: 1024 }), pow = L.rowPower(p, 0), bin = 2.5e6 / 1024, half = 512;
  let m = 0; for (let k = Math.floor(-970e3 / bin) - 3; k <= Math.ceil(-969.8e3 / bin) + 3; k++) m = Math.max(m, pow[k + half]);
  // in phase: (2a)² = +6.02 dB, less at most the 1.42 dB scalloping; in power it would be +3.01 dB at most
  assert.ok(dB(m) > -85 + 4.5 && dB(m) <= -85 + 6.03, `${dB(m)}`);
});

test('rule 5: filter off folds 145.200 MHz at 0.25 MSPS to 144.950 MHz as an alias; filter on removes it', () => {
  const s = S(preset('alias'));
  const a = s.aliases.find((x) => x.id === 'strong');
  near(a.foldedTo, 144.95e6, 1e-3);
  assert.deepEqual(s.aliases.map((x) => [x.id, Math.round(x.foldedTo / 1e3)]),
    [['pair', 145030], ['pair2', 145030], ['burst', 145050], ['strong', 144950], ['repeater', 145100]]);
  assert.deepEqual(s.filtered, []);
  const on = S(Object.assign({}, preset('alias'), { filter: true }));
  assert.deepEqual(on.aliases, []);
  assert.deepEqual(on.filtered, ['pair', 'pair2', 'burst', 'strong', 'repeater']);
  assert.ok(on.signals.every((x) => x.at === null), 'a filtered signal is drawn nowhere');
  // a signal inside the span is never an alias, filter or not
  assert.ok(S({ filter: false }).signals.every((x) => !x.alias && x.at === x.offset));
});

test('rule 5: no folded copy lands on DC or on another at 0.25 or 2.5 MSPS', () => {
  for (const band of ['2m', '70cm']) for (const fs of [0.25, 2.5]) {
    const at = S({ band, fs, filter: false }).signals.filter((x) => x.id !== 'pair2').map((x) => x.at);
    const pts = [0].concat(at);
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) assert.ok(Math.abs(pts[i] - pts[j]) >= 0.05 * fs * 1e6, `${band} ${fs}`);
  }
});

test('rule 6: a DC spike in the centre bin; the guard (±4 bins) keeps it out of the measurement', () => {
  const p = P({ fs: 0.25, filter: true });                  // nothing inside the span but the spike
  const pow = L.rowPower(p, 0);
  near(dB(pow[p.N / 2]), L.DC_DB, 1e-6);
  const s = L.initial(p);
  assert.equal(s.peak, null, 'the guard hides the spike');
  // without the guard the spike would be measured
  const tot = Float64Array.from(pow);
  assert.equal(L.strongest(tot, -1).k, 0);
  assert.equal(L.DC_GUARD, 4);
  near(s.guard.hi, 4.5 * s.binHz, 1e-9);
});

test('rule 7: deterministic noise; its mean per bin is N0·1.5·Δf, 3 dB lower per doubling of N, while a CW line stays', () => {
  for (const N of L.NS) near(S({ N }).noiseDb, L.N0_DB + 10 * Math.log10(1.5 * 2.5e6 / N), 0.01);
  near(S({ N: 32768 }).noiseDb - S({ N: 65536 }).noiseDb, 3.01, 0.01);
  near(S(preset('2m-monitor')).noiseDb, -110.41, 0.01);
  // the carriers' peaks stay within the scalloping loss of their level at both sizes where they are resolved
  for (const N of [32768, 65536]) {
    const p = P({ N }), pow = L.rowPower(p, 0), bin = 2.5e6 / N, half = N / 2;
    let m = 0; for (let k = Math.floor(-970e3 / bin) - 6; k <= Math.ceil(-969.8e3 / bin) + 6; k++) m = Math.max(m, pow[k + half]);
    assert.ok(dB(m) <= -85 + 0.2 && dB(m) >= -85 - 1.5, `${N}: ${dB(m)}`);
  }
  // the hash is uniform-ish and in (0, 1]
  let sum = 0; for (let k = 0; k < 4000; k++) { const u = L.hash01(k, 3); assert.ok(u > 0 && u <= 1); sum += u; }
  near(sum / 4000, 0.5, 0.02);
});

test('rule 7: an FM signal in a bin has density · ∫W² = its power over 11 kHz · 1.5 bins', () => {
  const p = P(), pow = L.rowPower(p, 0), bin = 2.5e6 / 32768;
  const k = Math.round(200e3 / bin);                          // the strong signal's centre bin
  near(dB(pow[k + p.N / 2]), -30 - dB(2 * L.FM_HALF) + dB(1.5 * bin), 0.01);
});

test('rule 8: the 40 ms burst covers rows 9–33 at N 4096 (sharp), rows 0–2 at N 65536 (one full, two partial)', () => {
  const s4 = S(preset('fm-burst'));
  assert.deepEqual(s4.burstRows, Array.from({ length: 25 }, (_, i) => i + 9));
  const p64 = P(Object.assign({}, preset('fm-burst'), { N: 65536 })), s64 = L.initial(p64);
  assert.deepEqual(s64.burstRows, [0, 1, 2]);
  const burst = s64.signals.find((x) => x.id === 'burst'), T = 65536 / 2.5e6;
  near(L.onShare(burst, 1, T), 1, 1e-12);
  const r0 = L.onShare(burst, 0, T), r2 = L.onShare(burst, 2, T);
  assert.ok(r0 > 0 && r0 < 1 && r2 > 0 && r2 < 0.01, `${r0} ${r2}`);
  // energy shares tile: the whole block is 1, halves are ½ each
  near(L.energyShare(0, 1, 1), 1, 1e-12); near(L.energyShare(0, 0.5, 1), 0.5, 1e-12);
  // the burst is not in the newest block at N 4096: the spectrum is the last 1.6 ms only
  assert.ok(!s4.burstRows.includes(0));
});

test('rule 9: the strongest bin 10 dB above the noise is reported with its frequency', () => {
  const s = S(preset('2m-monitor'));
  assert.equal(s.peak.id, 'strong'); assert.equal(s.peak.alias, false);
  near(s.peak.f, 145.2e6, 6e3);
  const a = S(preset('alias'));
  assert.equal(a.peak.id, 'strong'); assert.equal(a.peak.alias, true);
  near(a.peak.f, 144.95e6, 6e3);
  assert.equal(L.THRESHOLD_DB, 10);
});

test('rule 10: at most 480 columns; one per bin when zoomed, bin edges up to 120 bins; the view stays in the span', () => {
  for (const fs of L.FS) for (const N of L.NS) for (const zoom of [0, 3, 7, 13]) for (const focus of L.FOCI) {
    const s = S({ fs, N, zoom, focus, filter: false });
    assert.ok(s.cols.length <= L.COLS);
    assert.ok(s.view.lo >= -s.span / 2 - 1e-6 && s.view.hi <= s.span / 2 + 1e-6, `${fs} ${N} ${zoom} ${focus}`);
    assert.equal(s.spectrum.length, s.cols.length);
    assert.ok(s.waterfall.every((r) => r.length === s.cols.length));
    if (s.group === 1) assert.equal(s.edges, s.binsInView <= L.EDGE_BINS);
    else assert.equal(s.edges, false);
  }
  const t = S(preset('two-carriers'));
  assert.equal(t.group, 1); assert.equal(t.edges, true); assert.equal(t.view.width, 2e3);
  assert.equal(t.cols[0][0], Math.round(t.view.lo / t.binHz));
  assert.equal(t.cols[t.cols.length - 1][0], Math.round(t.view.hi / t.binHz));
  near(t.view.centre, -970e3 + 100, 1e-6);
});

test('rule 6: the DC spike is spread by the window in power: ±1 bin at W(1)² = −6 dB; the guard spans ±4.5 bins', () => {
  const p = P({ fs: 0.25, filter: true }), pow = L.rowPower(p, 0), s = L.initial(p);
  near(dB(pow[p.N / 2 + 1]), L.DC_DB - 6.02, 0.01);
  near(dB(pow[p.N / 2 - 1]), L.DC_DB - 6.02, 0.01);
  near(s.guard.lo, -4.5 * s.binHz, 1e-9);
});

test('rule 7: noise draws stay within −20 … +8.4 dB of the mean; each row draws its own', () => {
  let lo = Infinity, hi = -Infinity;
  for (let k = 0; k < 20000; k++) { const v = L.noiseIn(k, k % 40, 1); lo = Math.min(lo, v); hi = Math.max(hi, v); }
  assert.ok(lo >= 0.01 - 1e-12 && hi <= -Math.log(1e-3) + 1e-9, `${lo} ${hi}`);
  assert.ok(hi > 6, 'the ceiling is reached');
  assert.notEqual(L.noiseIn(10, 0, 1), L.noiseIn(10, 1, 1));
});

test('rule 7: an FM signal fades smoothly past its band edge (the window skirt reaches well beyond a few bins)', () => {
  const p = P(), pow = L.rowPower(p, 0), bin = 2.5e6 / 32768, half = p.N / 2;
  const edge = Math.round((200e3 + L.FM_HALF) / bin);
  for (const off of [5, 10, 20, 40]) assert.ok(pow[edge + off + half] > 0, `${off}`);
  assert.ok(pow[edge + 10 + half] < pow[edge + 5 + half] && pow[edge + 40 + half] < pow[edge + 20 + half]);
});

test('rule 8: a partial row carries the burst at its energy share (sin⁴ window), in the row power too', () => {
  const p = P(Object.assign({}, preset('fm-burst'), { N: 65536 })), T = 65536 / 2.5e6;
  const burst = L.signalsFor(p).find((x) => x.id === 'burst');
  near(L.onShare(burst, 0, T), 0.31389, 1e-5);
  near(L.onShare(burst, 2, T), 0.00045, 1e-5);
  const k = Math.round(-200e3 / (2.5e6 / 65536)) + p.N / 2;           // the burst's centre bin (144.800 MHz)
  near(L.rowPower(p, 0)[k] / L.rowPower(p, 1)[k], L.onShare(burst, 0, T), 1e-6);
});

test('rule 9: the peak level is the bin power of the newest block plus the noise of that bin', () => {
  for (const id of ['2m-monitor', 'alias', '70cm-monitor']) {
    const p = P(preset(id)), s = L.initial(p), pow = L.rowPower(p, 0);
    const mean = Math.pow(10, s.noiseDb / 10);
    near(s.peak.db, dB(pow[s.peak.bin + p.N / 2] + L.noiseIn(s.peak.bin, 0, mean)), 0.02, id);
    near(s.peak.f, s.centre + s.peak.bin * s.binHz, 1e-6, id);
  }
});

test('rule 10: a grouped column shows its strongest bin plus the noise of its first bin, row by row', () => {
  const p = P(preset('2m-monitor')), s = L.initial(p), mean = Math.pow(10, s.noiseDb / 10), half = p.N / 2;
  assert.ok(s.group > 1);
  for (const r of [0, 7, 39]) {
    const pow = L.rowPower(p, r);
    for (const i of [0, 100, 237, 300, 474]) {
      const [k0, k1] = s.cols[i];
      let m = 0; for (let k = k0; k <= k1; k++) m = Math.max(m, pow[k + half]);
      near(s.waterfall[r][i], dB(m + L.noiseIn(k0, r, mean)), 0.01, `${r} ${i}`);
    }
  }
  // the carriers and the strong signal keep their peaks in the full view
  const col = (f) => s.cols.findIndex((c) => (c[0] - 0.5) * s.binHz <= f && f < (c[1] + 0.5) * s.binHz);
  assert.ok(s.spectrum[col(-970e3)] > -87, 'the pair');
  assert.ok(s.spectrum[col(200e3)] > -51, 'the strong signal');
});

// ── presets ──

test('presets: the numbers SPEC.md lists', () => {
  const m2 = S(preset('2m-monitor'));
  near(m2.binHz, 76.29, 0.01); near(m2.blockMs, 13.11, 0.01); near(m2.rowsPerSec, 76.3, 0.05); near(m2.binsPerChannel, 163.8, 0.05);
  const m70 = S(preset('70cm-monitor'));
  near(m70.binHz, 381.47, 0.01); near(m70.blockMs, 2.621, 0.001); near(m70.rowsPerSec, 381.5, 0.05); near(m70.binsPerChannel, 32.8, 0.05);
  const two = S(preset('two-carriers'));
  near(two.binHz, 610.35, 0.01); near(two.blockMs, 1.638, 0.001);
  const al = S(preset('alias'));
  near(al.binHz, 7.63, 0.005); near(al.blockMs, 131.07, 0.01); near(al.historyS, 5.24, 0.01);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset, the defaults and every fs, N and band', () => {
  for (const pr of [{ params: {} }].concat(L.presets)) {
    const s = S(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
  for (const fs of L.FS) for (const N of [1024, 65536]) for (const band of ['2m', '70cm']) {
    const s = S({ fs, N, band, filter: false, zoom: 4, focus: 'burst' });
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    assert.ok(s.spectrum.every(Number.isFinite));
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ fs: 12.5, N: 4096, zoom: 6, focus: 'pair' });
  const copy = structuredClone(p);
  assert.deepEqual(L.initial(p), L.initial(p));
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has a name and hint in both languages', () => {
  for (const pr of L.presets) {
    for (const [k, v] of Object.entries(pr.params)) assert.ok(k in L.defaults, `${pr.id}: ${k}`) || v;
    for (const key of ['preset_' + pr.id, 'preset_' + pr.id + 'Hint']) assert.ok(strings.hr[key] && strings.en[key], key);
  }
  assert.deepEqual(L.presets.map((x) => x.id), ['2m-monitor', '70cm-monitor', 'two-carriers', 'fm-burst', 'alias']);
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.id, 'fft-waterfall');
});

test('constants SPEC.md names: HamMonitor fft_size, channel_bw_hz, dc_guard_bins, threshold_db; the ladder; defaults', () => {
  assert.equal(L.CHANNEL, 12500); assert.equal(L.DC_GUARD, 4); assert.equal(L.THRESHOLD_DB, 10);
  assert.deepEqual(L.FS, [0.25, 2.5, 12.5]); assert.deepEqual(L.NS, [1024, 4096, 32768, 65536]);
  assert.equal(L.LADDER[0], 1e3); assert.equal(L.LADDER[L.LADDER.length - 1], 2e7);
  assert.deepEqual(L.defaults, { fs: 2.5, N: 32768, band: '2m', filter: true, zoom: 13, focus: 'dc' });
  assert.equal(L.ROWS, 40);
});
