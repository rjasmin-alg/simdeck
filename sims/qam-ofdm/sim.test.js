// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for qam-ofdm's model (SPEC.md): tie-breaks first, then one test per rule, the presets, then the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const S = (over) => L.initial(P(over));
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} ≈ ${b} (± ${tol})`);
const rel = (a, b, r, msg) => assert.ok(Math.abs(a - b) <= r * Math.abs(b), `${msg || ''} ${a} ≈ ${b} (± ${r * 100} %)`);

// ── tie-breaks ──

test('tie-break (rule 3): a value exactly on a threshold goes to the upper level; QPSK axis counts positive', () => {
  for (const M of L.ORDERS) {
    const g = L.grid(M);
    g.thresholds.forEach((th, j) => {
      assert.equal(L.decideAxis(th, M), j + 1, `M ${M} threshold ${j}`);
      assert.equal(L.decideAxis(th - 1e-9, M), j, `M ${M} just below threshold ${j}`);
    });
  }
  assert.equal(L.bitsOf(L.decide(0, 0, 4), 4), '11', 'origin → 11, as qpsk');
  assert.equal(L.bitsOf(L.decide(0, -0.5, 4), 4), '10');
  assert.equal(L.bitsOf(L.decide(-0.5, 0, 4), 4), '01');
});

test('tie-break (rule 3): far outside the grid decides for the outermost level', () => {
  assert.equal(L.decideAxis(-99, 64), 0);
  assert.equal(L.decideAxis(99, 64), 7);
});

test('tie-break: exactly 1 % of errors is the class "high"; just under is "low"; none is "none"', () => {
  assert.equal(L.errorClass(0, 400), 'none');
  assert.equal(L.errorClass(3, 400), 'low');
  assert.equal(L.errorClass(4, 400), 'high');
  assert.equal(L.errorClass(3, 384), 'low');
  assert.equal(L.errorClass(4, 384), 'high');
});

test('tie-break: out-of-range params fall back or clamp; the interferer clamps to the last carrier', () => {
  assert.deepEqual(L.norm({ mode: 'x', M: 8, snr: 'a', seed: NaN, n: 12, interferer: -3 }), L.defaults);
  const p = L.norm({ snr: 99, seed: 500, n: 8, interferer: 20, M: '64' });
  assert.equal(p.snr, 35); assert.equal(p.seed, 99); assert.equal(p.interferer, 8); assert.equal(p.M, 64);
  assert.equal(L.norm({ snr: -4 }).snr, 0);
});

test('tie-break: a draw of u near 1 never picks a symbol past M − 1', () => {
  const pl = { u: [0.9999999999], g: [[0, 0]] };
  assert.equal(L.receive(pl, 0, 256, 0).sent, 255);
});

// ── rule 1: square M-QAM ──

test('rule 1: √M levels per axis, unit average energy, d_min = √(6/(M − 1)), log2 M bits', () => {
  const want = { 4: 1.414, 16: 0.632, 64: 0.309, 256: 0.153 };
  for (const M of L.ORDERS) {
    const g = L.grid(M);
    assert.equal(g.L, Math.sqrt(M));
    let e = 0;
    for (let k = 0; k < M; k++) { const p = L.pointOf(k, M); e += p.i * p.i + p.q * p.q; }
    close(e / M, 1, 1e-12, `average energy M ${M}`);
    close(g.levels[1] - g.levels[0], L.dmin(M), 1e-12, 'level spacing is d_min');
    close(L.dmin(M), want[M], 5e-4, `d_min ${M}`);
    assert.equal(L.bitsPerSymbol(M), Math.log2(M));
    // thresholds midway between levels
    g.thresholds.forEach((th, j) => close(th, (g.levels[j] + g.levels[j + 1]) / 2, 1e-12));
  }
  close(L.dmin(4) / L.dmin(64), 4.58, 0.005, 'QPSK points 4.6 × further apart than 64-QAM');
  for (let i = 1; i < 4; i++) {
    const r = L.dmin(L.ORDERS[i]) / L.dmin(L.ORDERS[i - 1]);
    assert.ok(r > 0.44 && r < 0.5, 'each step about halves d_min');
  }
});

test('rule 3: Gray code: horizontal and vertical neighbours differ in exactly one bit; M = 4 is the qpsk mapping', () => {
  for (const M of L.ORDERS) {
    const n = Math.sqrt(M), seen = new Set();
    for (let kI = 0; kI < n; kI++) for (let kQ = 0; kQ < n; kQ++) {
      const b = L.bitsOf(kI * n + kQ, M);
      assert.equal(b.length, L.bitsPerSymbol(M));
      seen.add(b);
      if (kI + 1 < n) assert.equal(L.bitErrors(b, L.bitsOf((kI + 1) * n + kQ, M)), 1);
      if (kQ + 1 < n) assert.equal(L.bitErrors(b, L.bitsOf(kI * n + kQ + 1, M)), 1);
    }
    assert.equal(seen.size, M, 'every symbol has its own bits');
  }
  const at = (bits) => { for (let k = 0; k < 4; k++) if (L.bitsOf(k, 4) === bits) return L.pointOf(k, 4); };
  const deg = (p) => (Math.atan2(p.q, p.i) * 180 / Math.PI + 360) % 360;
  assert.equal(Math.round(deg(at('11'))), 45);
  assert.equal(Math.round(deg(at('01'))), 135);
  assert.equal(Math.round(deg(at('00'))), 225);
  assert.equal(Math.round(deg(at('10'))), 315);
});

test('rule 3: every ideal point and every point within d_min/2 of it decides back to itself', () => {
  for (const M of L.ORDERS) {
    const h = L.dmin(M) / 2 * 0.999;
    for (let k = 0; k < M; k++) {
      const p = L.pointOf(k, M);
      assert.equal(L.decide(p.i, p.q, M), k);
      assert.equal(L.decide(p.i + h, p.q - h, M), k);
      assert.equal(L.decide(p.i - h, p.q + h, M), k);
    }
  }
});

// ── rule 2: the noise ──

test('rule 2: σ per axis = √((1/SNR)/2): 0.0707 at 20 dB; an interferer adds its power to N0', () => {
  close(L.sigma(20), 0.0707, 5e-5);
  close(L.sigma(0), Math.SQRT1_2, 1e-12);
  close(L.sigma(20, 1), Math.sqrt(1.01 / 2), 1e-12);
});

test('rule 2: the received point is the ideal point plus σ times the seed\'s draws, rounded to 4 decimals', () => {
  const pl = L.plan(21), s = L.sigma(13);
  for (const k of [0, 1, 99, 399]) {
    const r = L.receive(pl, k, 16, s), p = L.pointOf(r.sent, 16);
    close(r.i, p.i + pl.g[k][0] * s, 5e-5, 'I');
    close(r.q, p.q + pl.g[k][1] * s, 5e-5, 'Q');
    assert.equal(r.sent, Math.floor(pl.u[k] * 16));
    assert.equal(r.decided, L.decide(r.i, r.q, 16));
  }
});

test('rule 2: draws do not depend on M or SNR: the same symbols, only further from their points', () => {
  const a = S({ M: 64, snr: 30 }), b = S({ M: 64, snr: 10 });
  for (let k = 0; k < 400; k += 37) {
    assert.equal(a.points[k].sent, b.points[k].sent);
    const p = L.pointOf(a.points[k].sent, 64);
    close(b.points[k].i - p.i, (a.points[k].i - p.i) * L.sigma(10) / L.sigma(30), 1e-3);
  }
  // Box–Muller draws are unit normals: mean ≈ 0, variance ≈ 1 over the 800 draws of a seed
  const g = L.plan(3).g.flat(), m = g.reduce((x, y) => x + y) / g.length;
  const v = g.reduce((x, y) => x + (y - m) ** 2, 0) / g.length;
  close(m, 0, 0.1); close(v, 1, 0.15);
});

// ── rule 4: theory ──

test('rule 4: Q(x) = ½ erfc(x/√2): known values; the tail does not round to 0', () => {
  close(L.Q(0), 0.5, 1e-7);
  rel(L.Q(1), 0.1586552539, 1e-6);
  rel(L.Q(3), 1.349898e-3, 1e-5);
  rel(L.Q(5), 2.866516e-7, 1e-5);
  rel(L.Q(10), 7.619853e-24, 1e-5);
  close(L.Q(-1), 1 - 0.1586552539, 1e-6);
});

test('rule 4: SER = 1 − (1 − p)², p = 2(1 − 1/√M) Q(√(3 SNR/(M − 1))), at the task\'s points', () => {
  rel(L.serTheory(16, 20), 1.162e-5, 2e-3);
  rel(L.serTheory(64, 20), 0.05027, 2e-3);
  rel(L.serTheory(64, 25), 1.824e-4, 2e-3);
  rel(L.serTheory(4, 20), 1.524e-23, 2e-3);
  rel(L.serTheory(256, 20), 0.453, 2e-3);
  rel(L.serTheory(256, 30), 1.13e-3, 1e-2);
  rel(L.serTheory(16, 15), 0.01778, 2e-3);
  // the formula, written out
  const M = 64, snr = L.snrLinear(20), p = 2 * (1 - 1 / 8) * L.Q(Math.sqrt(3 * snr / 63));
  rel(L.serTheory(64, 20), 1 - (1 - p) ** 2, 1e-12);
  // ≈ 6 dB per step: 16-QAM at 20 dB and 64-QAM at about 26 dB are in the same range
  assert.ok(L.serTheory(64, 26) < L.serTheory(16, 20) * 10 && L.serTheory(64, 26) > L.serTheory(16, 20) / 10);
});

test('rule 4: the counts follow the theory: a large Monte Carlo run lands within 10 %', () => {
  const r = L.rng(4242);
  for (const [M, db] of [[16, 15], [64, 20], [256, 25]]) {
    let err = 0; const N = 60000, s = L.sigma(db);
    for (let k = 0; k < N; k++) {
      const idx = Math.floor(r() * M), p = L.pointOf(idx, M);
      if (L.decide(p.i + L.gaussian(r) * s, p.q + L.gaussian(r) * s, M) !== idx) err++;
    }
    rel(err / N, L.serTheory(M, db), 0.1, `M ${M} at ${db} dB`);
  }
});

// ── rules 5 and 6: OFDM ──

test('rule 5: carriers spaced Δf = 1/T; each carrier\'s sinc is 0 at every other carrier\'s centre, 1 at its own', () => {
  for (const n of L.NS) {
    const g = L.ofdmGrid(n);
    close(g.spacingKHz * g.symbolMs, 1, 1e-12, 'Δf · T');
    assert.equal(g.carriers.length, n);
    close(g.carriers[0].fKHz + g.carriers[n - 1].fKHz, 0, 1e-12, 'centred');
    for (let j = 1; j <= n; j++) for (const k of [1, Math.ceil(n / 2), n]) {
      if (j === k) assert.equal(L.overlap(n, j, k), 1);
      else assert.ok(Math.abs(L.overlap(n, j, k)) < 1e-12, `carrier ${k} at carrier ${j}`);
    }
    // half-way between two carriers the neighbour is not zero: they overlap, orthogonality separates them
    assert.ok(L.sinc(0.5) > 0.6);
  }
});

test('rule 5: longer symbols, smaller echo share: 20 %, 10 %, 5 % of a symbol; 160 % for one carrier', () => {
  assert.deepEqual(L.NS.map((n) => L.ofdmGrid(n).echoShare), [0.2, 0.1, 0.05]);
  close(L.ECHO_MS / (1 / L.RATE_KBD), 1.6, 1e-12);
});

test('rule 5: the interferer adds noise only to its carrier; off leaves every carrier alone', () => {
  const on = S({ mode: 'ofdm', n: 16, interferer: 5 }).ofdm, off = S({ mode: 'ofdm', n: 16, interferer: 0 }).ofdm;
  assert.equal(off.errors, 0);
  on.errorsPerCarrier.forEach((e, i) => { if (i !== 4) assert.equal(e, 0, `carrier ${i + 1}`); });
  assert.ok(on.errorsPerCarrier[4] > 0);
  // in the model: carrier 5's symbols get σ with N0 + JAM, the rest plain σ
  const pl = L.plan(21);
  const viaRun = L.ofdmRun(pl, 8, 64, 15, 3), byHand = new Array(8).fill(0);
  for (let k = 0; k < L.OFDM_SYMBOLS; k++) {
    const c = k % 8 + 1, r = L.receive(pl, k, 64, c === 3 ? L.sigma(15, L.JAM) : L.sigma(15));
    if (!r.ok) byHand[c - 1]++;
  }
  assert.deepEqual(viaRun.errorsPerCarrier, byHand);
});

test('rule 6: same total rate: N × rate per carrier = 16 kBd; T = N/16 ms; Δf = 16/N kHz; 384 symbols spread evenly', () => {
  const want = { 8: [2, 0.5, 2, 48], 16: [1, 1, 1, 24], 32: [0.5, 2, 0.5, 12] };
  for (const n of L.NS) {
    const g = L.ofdmGrid(n), o = S({ mode: 'ofdm', n }).ofdm;
    assert.deepEqual([g.rateKBd, g.symbolMs, g.spacingKHz], want[n].slice(0, 3));
    assert.equal(g.totalKBd, 16);
    assert.deepEqual(o.perCarrier, new Array(n).fill(want[n][3]));
  }
});

test('rule 6: OFDM symbol k rides on carrier (k mod N) + 1 with the QAM cloud\'s draw k', () => {
  // with no interferer and the same M and SNR, carrier c's errors are the QAM cloud's errors at k ≡ c − 1 (mod N), k < 384
  const s = S({ M: 64, snr: 18, n: 8 });
  const want = new Array(8).fill(0);
  s.points.slice(0, 384).forEach((p, k) => { if (!p.ok) want[k % 8]++; });
  assert.deepEqual(s.ofdm.errorsPerCarrier, want);
  assert.ok(want.reduce((a, b) => a + b) > 0);
});

test('rule 2: the received point is rounded to 4 decimals before the decision (a tie at 0 goes up)', () => {
  // QPSK point (−a, −a) pushed by +a − 0.00003 on I: −0.00003 before rounding, −0 after, so the I decision is "1"
  const a = L.grid(4).a, pl = { u: [0], g: [[(a - 0.00003) / 0.5, 0]] };
  const r = L.receive(pl, 0, 4, 0.5);
  assert.equal(r.i, 0);
  assert.equal(L.bitsOf(r.decided, 4), '10');
  assert.equal(r.ok, false);
});

test('rule 3: bit errors are counted per bit: a diagonal neighbour costs 2 bits, a far one more', () => {
  // QPSK 00 decided as 11: two wrong bits
  const a = L.grid(4).a, pl = { u: [0], g: [[2 * a / 0.1, 2 * a / 0.1]] };
  const r = L.receive(pl, 0, 4, 0.1);
  assert.equal(L.bitsOf(r.decided, 4), '11');
  assert.equal(r.bitErrors, 2);
  // a noisy 64-QAM cloud: the state's bit errors are the sum over its points, and some symbols lose more than one bit
  const s = S({ M: 64, snr: 4 });
  assert.equal(s.bitErrors, s.points.reduce((x, p) => x + (p.ok ? 0 : L.bitErrors(L.bitsOf(p.sent, 64), L.bitsOf(p.decided, 64))), 0));
  assert.ok(s.bitErrors > s.errors);
});

test('rule 5: the interferer adds JAM to N0: at 0 dB its carrier gets σ = √((1 + 1)/2) = 1', () => {
  close(L.sigma(0, L.JAM), 1, 1e-12);
  const pl = L.plan(5), run = L.ofdmRun(pl, 8, 4, 0, 2), byHand = new Array(8).fill(0);
  for (let k = 0; k < L.OFDM_SYMBOLS; k++) {
    const c = k % 8 + 1, r = L.receive(pl, k, 4, c === 2 ? 1 : Math.SQRT1_2);
    if (!r.ok) byHand[c - 1]++;
  }
  assert.deepEqual(run.errorsPerCarrier, byHand);
});

// ── presets (seed 21) ──

test('presets: counts and theory for seed 21', () => {
  const get = (id) => L.initial(L.presets.find((x) => x.id === id).params);
  const q = get('qpsk-20');
  assert.equal(q.errors, 0); assert.equal(q.M, 4); assert.ok(q.serTheory < 1e-20);
  const a = get('16qam-20');
  assert.equal(a.errors, 0); rel(a.serTheory, 1.16e-5, 0.01);
  const b = get('64qam-20');
  assert.equal(b.errors, 20); assert.equal(b.bitErrors, 20, 'each wrong symbol one bit wrong: Gray');
  assert.equal(b.errorClass, 'high'); rel(b.serTheory, 0.0503, 0.01);
  const c = get('64qam-25');
  assert.equal(c.errors, 0); rel(c.serTheory, 1.82e-4, 0.01);
  const o = get('ofdm-interferer');
  assert.equal(o.mode, 'ofdm');
  assert.deepEqual(o.ofdm.errorsPerCarrier, [0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  rel(o.ofdm.serTheoryHit, 0.742, 0.01);
  assert.equal(o.ofdm.interfererAt, 5);
});

test('defaults and constants SPEC.md names', () => {
  assert.deepEqual(L.defaults, { mode: 'qam', M: 16, snr: 20, seed: 21, n: 16, interferer: 0 });
  assert.equal(L.JAM, 1); assert.equal(L.RATE_KBD, 16); assert.equal(L.ECHO_MS, 0.1);
  assert.equal(L.SYMBOLS, 400); assert.equal(L.OFDM_SYMBOLS, 384);
  assert.deepEqual([L.SNR_MIN, L.SNR_MAX, L.SEED_MIN, L.SEED_MAX], [0, 35, 1, 99]);
});

test('initial() fills every shown field from the helpers (QAM and OFDM)', () => {
  for (const pr of L.presets) {
    const p = L.norm(P(pr.params)), s = L.initial(p), o = s.ofdm, g = L.ofdmGrid(p.n);
    assert.equal(s.bitsPerSymbol, L.bitsPerSymbol(p.M));
    assert.equal(s.levels, Math.sqrt(p.M));
    assert.equal(s.sigma, L.sigma(p.snr));
    assert.equal(s.dmin, L.dmin(p.M));
    assert.equal(s.sent, 400);
    assert.equal(s.errors, s.points.filter((x) => !x.ok).length);
    assert.equal(s.ser, s.errors / 400);
    assert.equal(s.errorClass, L.errorClass(s.errors, 400));
    assert.deepEqual(s.table, L.ORDERS.map((m) => ({ M: m, bits: L.bitsPerSymbol(m), dmin: L.dmin(m), ser: L.serTheory(m, p.snr) })));
    assert.deepEqual([o.spacingKHz, o.symbolMs, o.rateKBd, o.totalKBd, o.echoShare], [g.spacingKHz, g.symbolMs, g.rateKBd, g.totalKBd, g.echoShare]);
    assert.equal(o.sent, 384);
    assert.equal(o.errors, o.errorsPerCarrier.reduce((a, b) => a + b, 0));
    assert.equal(o.errorClass, L.errorClass(o.errors, 384));
    assert.equal(o.serTheoryHit, p.interferer ? L.serOf(p.M, 1 / (1 / L.snrLinear(p.snr) + L.JAM)) : 0);
  }
  const o = S({ mode: 'ofdm', n: 16, interferer: 5 }).ofdm, q = S({ M: 16 });
  assert.equal(o.errors, 18); assert.equal(o.errorClass, 'high'); assert.equal(q.errorClass, 'none');
  assert.deepEqual(S({ n: 8 }).ofdm.carriers, L.ofdmGrid(8).carriers);
});

test('the state carries the fields the task names', () => {
  const s = S({});
  for (const k of ['mode', 'M', 'bitsPerSymbol', 'snrDb', 'points', 'ser', 'serTheory', 'dmin', 'ofdm']) assert.ok(k in s, k);
  for (const k of ['i', 'q', 'sent', 'decided', 'ok']) assert.ok(k in s.points[0], k);
  for (const k of ['n', 'spacingKHz', 'symbolMs', 'interfererAt', 'errorsPerCarrier']) assert.ok(k in s.ofdm, k);
  assert.equal(s.points.length, 400);
  assert.equal(s.ser, s.errors / 400);
  assert.deepEqual(s.table.map((r) => r.M), L.ORDERS);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and across M × SNR × N', () => {
  const cases = L.presets.map((x) => x.params);
  for (const M of L.ORDERS) for (const snr of [0, 17, 35]) for (const n of L.NS) cases.push({ M, snr, n, interferer: n });
  for (const c of cases) {
    const s = S(c);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ M: 256, snr: 12, seed: 55, mode: 'ofdm', n: 32, interferer: 30 });
  const copy = structuredClone(p);
  assert.deepEqual(L.initial(p), L.initial(p));
  assert.deepEqual(p, copy);
  assert.notDeepEqual(S({ seed: 1 }).points, S({ seed: 2 }).points);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has a name and hint in both languages; the page is an explorer', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.ok(!('steps' in meta));
  assert.ok(!('steps' in L));
  for (const pr of L.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in L.defaults, `${pr.id}: ${k}`);
    assert.deepEqual(L.norm(P(pr.params)), P(pr.params), `${pr.id} params are in range`);
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + pr.id], `${lang} name ${pr.id}`);
      assert.ok(strings[lang]['preset_' + pr.id + 'Hint'], `${lang} hint ${pr.id}`);
    }
  }
  assert.deepEqual(L.presets.map((x) => x.id), ['qpsk-20', '16qam-20', '64qam-20', '64qam-25', 'ofdm-interferer']);
});
