// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fsk-psk-ask (SPEC.md). Run: node --test sims/fsk-psk-ask/
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
const bitSamples = (arr, k) => arr.slice(k * L.SPB, (k + 1) * L.SPB);

// ── tie-breaks ──

test('tie-break (rule 5): a tie decides 0 in every scheme', () => {
  const ook = L.symbolsFor(P({ ook: true })), keyed = L.symbolsFor(P({ ook: false }));
  // ASK: exactly at the midpoint is 0, a hair above is 1
  assert.equal(L.decide('ask', { env: 0.5 }, ook), '0');
  assert.equal(L.decide('ask', { env: 0.5 + 1e-9 }, ook), '1');
  assert.equal(L.decide('ask', { env: 0.75 }, keyed), '0');
  assert.equal(L.decide('ask', { env: 0.75 + 1e-9 }, keyed), '1');
  // FSK: equal magnitudes are 0
  assert.equal(L.decide('fsk', { m0: 0.7, m1: 0.7 }, ook), '0');
  assert.equal(L.decide('fsk', { m0: 0.7, m1: 0.7 + 1e-9 }, ook), '1');
  // PSK: I = 0 is 0 (0°), only a negative I is 1
  assert.equal(L.decide('psk', { i: 0 }, ook), '0');
  assert.equal(L.decide('psk', { i: -1e-9 }, ook), '1');
});

test('tie-break: a bits value that is not 1–8 characters of 0/1 falls back to the default; flip stays in range', () => {
  for (const bad of ['', '012', '101100101', null, 42]) assert.equal(S({ bits: bad }).bits, '10110010', String(bad));
  assert.equal(S({ bits: '1' }).bits, '1');
  assert.equal(L.flip('10110010', 0), '00110010');
  assert.equal(L.flip('10110010', 7), '10110011');
  assert.equal(L.flip('0101', 4), '0101');
  assert.equal(L.flip('0101', -1), '0101');
});

// ── rules ──

test('rule 1: ASK keys the amplitude: 1 → A1, 0 → A0; OOK switches the carrier off; the frequency is the carrier', () => {
  const s = S({ bits: '10' });
  const one = bitSamples(s.clean.ask, 0), zero = bitSamples(s.clean.ask, 1);
  near(Math.max(...one), 1, 0.01);
  assert.ok(zero.every((v) => v === 0), 'OOK: a 0 is no carrier');
  const k = S({ bits: '10', ook: false });
  near(Math.max(...bitSamples(k.clean.ask, 1)), 0.5, 0.01);
  assert.equal(k.a0, 0.5); assert.equal(s.a0, 0); assert.equal(s.a1, 1);
  // three cycles per bit: six zero crossings (sign changes) in a 1 bit, counting the start
  const sign = one.map((v) => (v >= 0 ? 1 : -1));
  assert.equal(sign.filter((v, i) => i > 0 && v !== sign[i - 1]).length, 2 * L.CARRIER - 1);
});

test('rule 2: FSK keys the frequency: 1 → f1 (4 cycles), 0 → f0 (2 cycles); amplitude constant; continuous phase', () => {
  const s = S({ bits: '10' });
  assert.equal(s.f1, 4); assert.equal(s.f0, 2);
  const crossings = (a) => a.filter((v, i) => i > 0 && Math.sign(v) !== Math.sign(a[i - 1]) && v !== 0).length;
  assert.ok(Math.abs(crossings(bitSamples(s.clean.fsk, 0)) - 8) <= 1);
  assert.ok(Math.abs(crossings(bitSamples(s.clean.fsk, 1)) - 4) <= 1);
  near(Math.max(...s.clean.fsk.map(Math.abs)), 1, 0.01);
  // AFSK: the phase runs on: no sample-to-sample step bigger than the steepest slope allows
  const a = S({ bits: '10110010', afsk: true });
  const maxStep = 2 * Math.PI * Math.max(a.f0, a.f1) / L.SPB + 1e-3;
  for (let j = 1; j < a.clean.fsk.length; j++) assert.ok(Math.abs(a.clean.fsk[j] - a.clean.fsk[j - 1]) <= maxStep, `jump at ${j}`);
});

test('rule 2: AFSK (APRS): mark 1200 Hz is one cycle a bit, space 2200 Hz is 1.83 cycles; a bit lasts 833.3 µs', () => {
  const a = S(preset('aprs-afsk'));
  assert.equal(a.f1, 1); near(a.f0, 11 / 6, 1e-6); near(a.f0, 1.8333, 1e-4);
  assert.deepEqual(a.afskHz, { mark: 1200, space: 2200, baud: 1200, bitUs: 833.3 });
  assert.equal(S({}).afskHz, null);
  assert.equal(a.decided.fsk, a.bits);
});

test('rule 3: BPSK keys the phase: 0 → 0°, 1 → 180°; the same amplitude and frequency; jumps where bits differ', () => {
  const s = S({ bits: '01' });
  const zero = bitSamples(s.clean.psk, 0), one = bitSamples(s.clean.psk, 1);
  for (let n = 0; n < L.SPB; n++) near(one[n], -zero[n], 1e-4, `n ${n}`);
  near(zero[L.SPB / 12], Math.sin(2 * Math.PI * 3 / 12), 1e-4, '0° is sin');
  assert.deepEqual(S({ bits: '0101' }).jumps, [1, 2, 3]);
  assert.deepEqual(S({ bits: '10110010' }).jumps, [1, 2, 4, 6, 7]);
  assert.deepEqual(S({ bits: '11110000' }).jumps, [4]);
  assert.deepEqual(S({ bits: '1' }).jumps, []);
});

test('rule 4: two symbols, one bit per symbol: one decision per bit in each scheme', () => {
  for (const bits of L.PATTERNS) {
    const s = S({ bits });
    for (const k of L.SCHEMES) {
      assert.equal(s.decided[k].length, bits.length);
      assert.equal(s.samples[k].length, bits.length * L.SPB);
      assert.equal(s.points[k].length, bits.length);
      assert.equal(s.ideal[k].length, 2);
    }
  }
});

test('rule 5: without noise every decision is right, in every pattern and setting', () => {
  for (const bits of L.PATTERNS.concat(['1', '0', '00000000', '11111111'])) for (const ook of [true, false]) for (const afsk of [true, false]) {
    const s = S({ bits, ook, afsk });
    for (const k of L.SCHEMES) { assert.equal(s.decided[k], bits, `${k} ${bits}`); assert.equal(s.errors[k], 0); }
  }
});

test('rule 5: the receiver: ASK by envelope against the midpoint, FSK by the stronger tone, PSK by the sign of I', () => {
  const s = S({ bits: '10110010', noise: 40, seed: 7 }), mid = (s.a0 + s.a1) / 2;
  s.points.ask.forEach((p, k) => assert.equal(p.got, Math.hypot(p.x, p.y) > mid ? '1' : '0', `ask ${k}`));
  s.points.fsk.forEach((p, k) => assert.equal(p.got, p.y > p.x ? '1' : '0', `fsk ${k}`));
  s.points.psk.forEach((p, k) => assert.equal(p.got, p.x < 0 ? '1' : '0', `psk ${k}`));
  // the coherent ASK and PSK receivers see the same noise: their I differs by the clean signal only, Q is equal
  s.points.ask.forEach((p, k) => near(p.y, s.points.psk[k].y, 1e-3));
  // errors and errorAt agree with the decisions
  for (const k of L.SCHEMES) {
    const at = [...s.bits].map((b, i) => (b !== s.decided[k][i] ? i : -1)).filter((i) => i >= 0);
    assert.deepEqual(s.errorAt[k], at); assert.equal(s.errors[k], at.length);
  }
});

test('rule 5: ideal points and distances: ASK 1 on the positive I axis, FSK √2, PSK 2 opposite on the circle', () => {
  const s = S({});
  assert.deepEqual(s.ideal.ask, [{ bit: '0', x: 0, y: 0 }, { bit: '1', x: 1, y: 0 }]);
  assert.deepEqual(s.ideal.psk, [{ bit: '0', x: 1, y: 0 }, { bit: '1', x: -1, y: 0 }]);
  assert.deepEqual(s.ideal.fsk, [{ bit: '0', x: 1, y: 0 }, { bit: '1', x: 0, y: 1 }]);
  assert.deepEqual(s.distance, { ask: 1, fsk: 1.4142, psk: 2 });
  assert.ok(s.distance.ask < s.distance.fsk && s.distance.fsk < s.distance.psk);
  assert.equal(S({ ook: false }).distance.ask, 0.5);
  const a = S({ afsk: true });
  assert.deepEqual(a.ideal.fsk, [{ bit: '0', x: 1.0238, y: 0.1835 }, { bit: '1', x: 0.1353, y: 1 }]);
  assert.equal(a.distance.fsk, 1.2068);
  // with AFSK each bit starts at another phase: the clean points lie near, not on, the crosses
  const marks = a.points.fsk.filter((p) => p.sent === '1');
  assert.ok(marks.some((p) => Math.abs(p.x - a.ideal.fsk[1].x) > 0.05));
  // the ideal points do not depend on the noise
  for (const over of [{}, { ook: false }, { afsk: true }]) assert.deepEqual(S(Object.assign({ noise: 60, seed: 5 }, over)).ideal, S(over).ideal);
});

test('rule 5: with equal noise ASK fails first, then FSK, PSK last (seed 7; and on average over seeds 1–99)', () => {
  const first = (k) => { let n = 0; while (n <= 100 && S({ noise: n, seed: 7 }).errors[k] === 0) n++; return n; };
  assert.equal(first('ask'), 27); assert.equal(first('fsk'), 34); assert.equal(first('psk'), 93);
  const tot = { ask: 0, fsk: 0, psk: 0 };
  for (let seed = 1; seed <= 99; seed++) { const s = S({ noise: 40, seed }); for (const k in tot) tot[k] += s.errors[k]; }
  near(tot.ask / 99, 1.71, 0.005); near(tot.fsk / 99, 0.44, 0.005); near(tot.psk / 99, 0.01, 0.005);
});

test('rule 6: the same seeded noise is added to all three traces; the slider only scales it', () => {
  const s = S({ bits: '10110010', noise: 40, seed: 7 });
  assert.equal(s.sigma, 0.8);
  const u = L.noiseFor(7);
  for (const k of L.SCHEMES) for (let j = 0; j < s.samples[k].length; j += 7) near(s.samples[k][j] - s.clean[k][j], 0.8 * u[j], 2e-4, `${k} ${j}`);
  const h = S({ bits: '10110010', noise: 20, seed: 7 });
  for (let j = 0; j < h.samples.ask.length; j += 11) near(h.samples.ask[j] - h.clean.ask[j], 0.4 * u[j], 2e-4);
  // a shorter string uses the first samples of the same noise
  const sh = S({ bits: '0101', noise: 40, seed: 7 });
  for (let j = 0; j < sh.samples.psk.length; j += 5) near(sh.samples.psk[j] - sh.clean.psk[j], 0.8 * u[j], 2e-4);
  // another seed, other noise; the same seed, the same noise
  assert.notDeepEqual(L.noiseFor(8).slice(0, 10), u.slice(0, 10));
  assert.deepEqual(L.noiseFor(7), u);
  assert.equal(S({ noise: 0, seed: 7 }).sigma, 0);
  assert.equal(S({ noise: 100 }).sigma, L.SIGMA_MAX);
});

test('rule 6: the noise is band-limited to 0.5–5.5 cycles per bit with variance 1 per sample', () => {
  const u = L.noiseFor(7), N = u.length;
  assert.equal(N, L.MAX_BITS * L.SPB);
  near(Math.sqrt(u.reduce((a, v) => a + v * v, 0) / N), 0.992, 0.0005);
  // DFT power outside bins 4 … 44 is zero, inside it is not
  const power = (m) => { let re = 0, im = 0; for (let j = 0; j < N; j++) { re += u[j] * Math.cos(2 * Math.PI * m * j / N); im += u[j] * Math.sin(2 * Math.PI * m * j / N); } return re * re + im * im; };
  for (const m of [0, 1, 3, 45, 60, 100]) assert.ok(power(m) < 1e-12, `bin ${m}`);
  for (const m of [4, 24, 44]) assert.ok(power(m) > 1e-3, `bin ${m}`);
  // over many seeds the mean variance per sample is 1
  let v = 0; for (let seed = 1; seed <= 99; seed++) { const w = L.noiseFor(seed); v += w.reduce((a, x) => a + x * x, 0) / N; }
  near(v / 99, 1, 0.05);
});

// ── presets ──

test('presets: the expected numbers of SPEC.md', () => {
  const tw = S(preset('three-ways'));
  assert.deepEqual(tw.errors, { ask: 0, fsk: 0, psk: 0 });
  assert.equal(tw.scheme, 'all');
  const cw = S(preset('cw-ook'));
  assert.equal(cw.scheme, 'ask'); assert.equal(cw.a0, 0); assert.equal(cw.bits, '11101000');
  [3, 5, 6, 7].forEach((k) => assert.ok(bitSamples(cw.clean.ask, k).every((v) => v === 0), `bit ${k} off`));
  const ap = S(preset('aprs-afsk'));
  assert.equal(ap.scheme, 'fsk'); assert.equal(ap.afsk, true); assert.equal(ap.errors.fsk, 0);
  const bp = S(preset('bpsk-phase'));
  assert.equal(bp.scheme, 'psk'); assert.deepEqual(bp.jumps, [1, 2, 3]);
  const race = S(preset('noise-race'));
  assert.deepEqual(race.errors, { ask: 3, fsk: 1, psk: 0 });
  assert.deepEqual(race.decided, { ask: '11110111', fsk: '11110010', psk: '10110010' });
  assert.deepEqual(race.errorAt, { ask: [1, 5, 7], fsk: [1], psk: [] });
  assert.deepEqual(S(Object.assign({}, preset('noise-race'), { ook: false })).errors.ask, 2);
  assert.deepEqual(S(Object.assign({}, preset('noise-race'), { afsk: true })).errors.fsk, 0);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset, the defaults and a spread of params', () => {
  for (const pr of [{ params: {} }].concat(L.presets)) {
    const s = S(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
  for (const bits of L.PATTERNS) for (const noise of [0, 55, 100]) for (const afsk of [true, false]) {
    const s = S({ bits, noise, afsk, ook: noise > 50, seed: 99 });
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    for (const k of L.SCHEMES) assert.ok(s.samples[k].every(Number.isFinite));
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ bits: '0101', noise: 63, seed: 12, afsk: true });
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
  assert.deepEqual(L.presets.map((x) => x.id), ['three-ways', 'cw-ook', 'aprs-afsk', 'bpsk-phase', 'noise-race']);
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.id, 'fsk-psk-ask');
});

test('constants SPEC.md names', () => {
  assert.equal(L.SPB, 48); assert.equal(L.MAX_BITS, 8); assert.equal(L.CARRIER, 3);
  assert.equal(L.FSK_F0, 2); assert.equal(L.FSK_F1, 4); assert.equal(L.A1, 1); assert.equal(L.A0_KEYED, 0.5);
  assert.equal(L.SIGMA_MAX, 2); assert.deepEqual(L.BAND, [0.5, 5.5]);
  assert.deepEqual(L.AFSK, { mark: 1200, space: 2200, baud: 1200 });
  assert.deepEqual(L.defaults, { bits: '10110010', scheme: 'all', ook: true, noise: 0, seed: 1, afsk: false });
  assert.deepEqual(L.PATTERNS, ['10110010', '11101000', '0101', '10101010', '11110000', '00110101']);
});
