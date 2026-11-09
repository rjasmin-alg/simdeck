/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for QAM and OFDM (SPEC.md). Mode "qam": square M-QAM (M = 4, 16, 64, 256) with unit average symbol energy and
   a Gray code per axis; 400 symbols cross a channel with Gaussian noise on I and Q at a given SNR (Es/N0); the
   receiver decides for the nearest ideal point; symbol errors are counted against the theoretical SER. Mode "ofdm":
   the same symbols spread over N subcarriers spaced 1/T apart, at the same total symbol rate, with a narrow-band
   interferer that adds noise to the one carrier under it.
   Builds on sims/qpsk/sim.js @ 2136a30 (its generator, Box–Muller draw, mapping 11/01/00/10, quadrant tie-break),
   which comes from 50ohm-contents-hr/contents/html/applet_qpsk.html, CC BY 4.0, 50ohm.de-Autorenteam,
   AJW-Referat des DARC e.V.
   Pure: no DOM, no Math.random, no Date, no timers; randomness from a seeded generator. State is plain JSON.
   An explorer: the state is derived from the params by initial(); there are no steps.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MODES = ['qam', 'ofdm'];
  var ORDERS = [4, 16, 64, 256];
  var NS = [8, 16, 32];                 // subcarriers (OFDM)
  var SYMBOLS = 400;                    // symbols per QAM cloud
  var OFDM_SYMBOLS = 384;               // the largest multiple of 32 up to 400: 48, 24 or 12 per carrier
  var SNR_MIN = 0, SNR_MAX = 35;        // dB
  var SEED_MIN = 1, SEED_MAX = 99;
  var RATE_KBD = 16;                    // total symbol rate, kBd (illustrative), the same for every N (rule 6)
  var ECHO_MS = 0.1;                    // a multipath echo delay, ms (illustrative), against the symbol length
  var JAM = 1;                          // the interferer's power on its carrier, relative to the signal (0 dB)

  // ── shared with sims/qpsk/sim.js @ 2136a30 ──

  /** mulberry32, the same generator as Simdeck.rng. From sims/qpsk/sim.js @ 2136a30. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** One standard normal draw (Box–Muller; u and v are never 0). From sims/qpsk/sim.js @ 2136a30. */
  function gaussian(r) {
    var u = 0, v = 0;
    while (u === 0) u = r();
    while (v === 0) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function round4(x) { return Math.round(x * 1e4) / 1e4 || 0; }   // || 0: no −0 (from sims/qpsk)

  // ── rule 1: square M-QAM ──

  /** √M levels per axis at a·(2k − (√M − 1)), k = 0 … √M − 1, with a = √(3 / (2(M − 1))) so that the average
      symbol energy is 1; the decision thresholds lie midway, at a·(2k + 2 − √M). */
  function grid(M) {
    var L = Math.round(Math.sqrt(M)), a = Math.sqrt(3 / (2 * (M - 1))), levels = [], thresholds = [];
    for (var k = 0; k < L; k++) levels.push(a * (2 * k - (L - 1)));
    for (var j = 0; j < L - 1; j++) thresholds.push(a * (2 * j + 2 - L));
    return { L: L, a: a, levels: levels, thresholds: thresholds };
  }

  /** Smallest distance between two ideal points: 2a = √(6 / (M − 1)). */
  function dmin(M) { return Math.sqrt(6 / (M - 1)); }

  function bitsPerSymbol(M) { return Math.round(Math.log2(M)); }

  /** Binary-reflected Gray code: neighbouring levels differ in one bit. */
  function gray(k) { return k ^ (k >> 1); }

  /** A symbol index is kI·√M + kQ (level indices on I and Q, 0 = most negative). Its bits are the Gray code of kI
      followed by the Gray code of kQ, log2(√M) bits each; for M = 4 that is the qpsk mapping (11 at 45°, 01 at
      135°, 00 at 225°, 10 at 315°). */
  function bitsOf(idx, M) {
    var g = grid(M), half = bitsPerSymbol(M) / 2;
    var kI = Math.floor(idx / g.L), kQ = idx % g.L;
    return gray(kI).toString(2).padStart(half, '0') + gray(kQ).toString(2).padStart(half, '0');
  }

  function pointOf(idx, M) {
    var g = grid(M);
    return { i: g.levels[Math.floor(idx / g.L)], q: g.levels[idx % g.L] };
  }

  // ── rule 3: the decision ──

  /** The level index of one axis: the number of thresholds at or below x. Tie-break: a value exactly on a
      threshold goes to the upper level (for QPSK: a point on an axis counts to the positive side, as in qpsk). */
  function decideAxis(x, M) {
    var th = grid(M).thresholds, k = 0;
    for (var j = 0; j < th.length; j++) if (x >= th[j]) k = j + 1;
    return k;
  }

  function decide(i, q, M) { return decideAxis(i, M) * grid(M).L + decideAxis(q, M); }

  function bitErrors(a, b) {
    var n = 0;
    for (var k = 0; k < a.length; k++) if (a[k] !== b[k]) n++;
    return n;
  }

  // ── rule 2: the noise ──

  function snrLinear(db) { return Math.pow(10, db / 10); }

  /** σ on I and on Q: each gets variance (1/SNR)/2, so the noise energy per symbol is N0 = Es/SNR with Es = 1.
      An interferer adds its power `extra` (relative to Es) to N0. */
  function sigma(db, extra) { return Math.sqrt((1 / snrLinear(db) + (extra || 0)) / 2); }

  /** The draws for a seed: per symbol one uniform u (which symbol is sent: floor(u·M)) and two unit normals (I, Q).
      They do not depend on M or the SNR, so changing either moves the same symbols' noise further or nearer. */
  function plan(seed) {
    var r = rng(seed * 7919 + 13), u = [], g = [];
    for (var k = 0; k < SYMBOLS; k++) {
      u.push(r());
      g.push([gaussian(r), gaussian(r)]);
    }
    return { u: u, g: g };
  }

  /** One received symbol: the ideal point of symbol k plus s times its draws, rounded to 4 decimals (what is drawn
      is what is decided), then decided. */
  function receive(pl, k, M, s) {
    var sent = Math.min(M - 1, Math.floor(pl.u[k] * M)), ideal = pointOf(sent, M);
    var i = round4(ideal.i + pl.g[k][0] * s), q = round4(ideal.q + pl.g[k][1] * s);
    var got = decide(i, q, M), be = got === sent ? 0 : bitErrors(bitsOf(sent, M), bitsOf(got, M));
    return { i: i, q: q, sent: sent, decided: got, ok: got === sent, bitErrors: be };
  }

  // ── rule 4: the theoretical symbol error rate ──

  /** erfc with fractional error below 1.2e-7 everywhere (Numerical Recipes, erfcc: Chebyshev fit), good far into
      the tail, where 1 − erf would round to 0. */
  function erfc(x) {
    var z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
      t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
      t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }

  /** Gaussian tail Q(x) = ½·erfc(x / √2). */
  function Qf(x) { return 0.5 * erfc(x / Math.SQRT2); }

  /** SER = 1 − (1 − p)² with p = 2(1 − 1/√M)·Q(√(3·SNR/(M − 1))), written as 2p − p² so a tiny p does not round
      to 0 (Proakis, Digital Communications, §4.3). snr is the linear Es/N0. */
  function serOf(M, snr) {
    var p = 2 * (1 - 1 / Math.sqrt(M)) * Qf(Math.sqrt(3 * snr / (M - 1)));
    return 2 * p - p * p;
  }
  function serTheory(M, db) { return serOf(M, snrLinear(db)); }

  /** The class of an error count, for the "changed" mark: 'none' (0), 'low' (under 1 %), 'high' (1 % or more). */
  function errorClass(errors, n) {
    if (errors === 0) return 'none';
    return errors / n < 0.01 ? 'low' : 'high';
  }

  // ── rules 5 and 6: OFDM ──

  /** N carriers at the same total symbol rate: each carries RATE/N, so a symbol lasts T = N/RATE and the carriers
      are Δf = 1/T apart. Carrier c (1 … N) sits at (c − (N + 1)/2)·Δf from the centre. */
  function ofdmGrid(n) {
    var perCarrier = RATE_KBD / n, symbolMs = 1 / perCarrier, spacingKHz = 1 / symbolMs, carriers = [];
    for (var c = 1; c <= n; c++) carriers.push({ c: c, fKHz: (c - (n + 1) / 2) * spacingKHz });
    return { n: n, rateKBd: perCarrier, totalKBd: perCarrier * n, symbolMs: symbolMs, spacingKHz: spacingKHz,
      echoShare: ECHO_MS / symbolMs, carriers: carriers };
  }

  /** Normalised sinc, sin(πx)/(πx), 1 at 0. */
  function sinc(x) {
    if (x === 0) return 1;
    return Math.sin(Math.PI * x) / (Math.PI * x);
  }

  /** The spectrum of carrier k of n (a sinc in units of Δf = 1/T, peak 1) read at the centre frequency of carrier j:
      sinc((f_j − f_k)·T). 1 for j = k; for every other j the distance is a whole number of Δf, a null of the sinc
      (rounding leaves |x| < 1e-15). */
  function overlap(n, j, k) {
    var g = ofdmGrid(n);
    return sinc((g.carriers[j - 1].fKHz - g.carriers[k - 1].fKHz) * g.symbolMs);
  }

  /** Symbol k (0 … 383) rides on carrier (k mod N) + 1, in OFDM symbol floor(k / N). The interferer (a carrier
      number, 0 = off) adds noise of power JAM to its carrier only. */
  function ofdmRun(pl, n, M, db, at) {
    var errors = [], sent = [], s0 = sigma(db), sj = sigma(db, JAM);
    for (var c = 0; c < n; c++) { errors.push(0); sent.push(0); }
    for (var k = 0; k < OFDM_SYMBOLS; k++) {
      var c1 = (k % n) + 1, r = receive(pl, k, M, c1 === at ? sj : s0);
      sent[c1 - 1]++;
      if (!r.ok) errors[c1 - 1]++;
    }
    var total = errors.reduce(function (x, y) { return x + y; }, 0);
    return { errorsPerCarrier: errors, perCarrier: sent, errors: total };
  }

  // ── params ──

  function pick(v, list, dflt) {
    for (var i = 0; i < list.length; i++) if (String(list[i]) === String(v)) return list[i];
    return dflt;
  }
  function clamp(x, lo, hi, dflt) {
    var v = Math.round(Number(x));
    if (!isFinite(v)) return dflt;
    return Math.min(hi, Math.max(lo, v));
  }

  var defaults = { mode: 'qam', M: 16, snr: 20, seed: 21, n: 16, interferer: 0 };

  /** Presets (keys 1–5). Counts for the seed 21 are tested. */
  var presets = [
    { id: 'qpsk-20', params: { mode: 'qam', M: 4, snr: 20, seed: 21 } },
    { id: '16qam-20', params: { mode: 'qam', M: 16, snr: 20, seed: 21 } },
    { id: '64qam-20', params: { mode: 'qam', M: 64, snr: 20, seed: 21 } },
    { id: '64qam-25', params: { mode: 'qam', M: 64, snr: 25, seed: 21 } },
    { id: 'ofdm-interferer', params: { mode: 'ofdm', M: 16, snr: 20, seed: 21, n: 16, interferer: 5 } }
  ];

  function norm(p) {
    var n = pick(p.n, NS, defaults.n);
    return {
      mode: pick(p.mode, MODES, defaults.mode),
      M: pick(p.M, ORDERS, defaults.M),
      snr: clamp(p.snr, SNR_MIN, SNR_MAX, defaults.snr),
      seed: clamp(p.seed, SEED_MIN, SEED_MAX, defaults.seed),
      n: n,
      interferer: clamp(p.interferer, 0, n, 0)
    };
  }

  function initial(params) {
    var p = norm(params || {}), M = p.M, pl = plan(p.seed), s = sigma(p.snr), points = [], errors = 0, bits = 0;
    for (var k = 0; k < SYMBOLS; k++) {
      var r = receive(pl, k, M, s);
      points.push(r);
      if (!r.ok) errors++;
      bits += r.bitErrors;
    }
    var og = ofdmGrid(p.n), run = ofdmRun(pl, p.n, M, p.snr, p.interferer);
    return {
      mode: p.mode,
      M: M,
      bitsPerSymbol: bitsPerSymbol(M),
      levels: grid(M).L,
      snrDb: p.snr,
      sigma: sigma(p.snr),
      dmin: dmin(M),
      points: points,
      sent: SYMBOLS,
      errors: errors,
      bitErrors: bits,
      ser: errors / SYMBOLS,
      serTheory: serTheory(M, p.snr),
      errorClass: errorClass(errors, SYMBOLS),
      table: ORDERS.map(function (m) { return { M: m, bits: bitsPerSymbol(m), dmin: dmin(m), ser: serTheory(m, p.snr) }; }),
      ofdm: {
        n: p.n,
        spacingKHz: og.spacingKHz,
        symbolMs: og.symbolMs,
        rateKBd: og.rateKBd,
        totalKBd: og.totalKBd,
        echoShare: og.echoShare,
        carriers: og.carriers,
        interfererAt: p.interferer,
        perCarrier: run.perCarrier,
        errorsPerCarrier: run.errorsPerCarrier,
        errors: run.errors,
        sent: OFDM_SYMBOLS,
        errorClass: errorClass(run.errors, OFDM_SYMBOLS),
        serTheoryHit: p.interferer ? serOf(M, 1 / (1 / snrLinear(p.snr) + JAM)) : 0
      }
    };
  }

  var logic = {
    MODES: MODES, ORDERS: ORDERS, NS: NS, SYMBOLS: SYMBOLS, OFDM_SYMBOLS: OFDM_SYMBOLS,
    SNR_MIN: SNR_MIN, SNR_MAX: SNR_MAX, SEED_MIN: SEED_MIN, SEED_MAX: SEED_MAX,
    RATE_KBD: RATE_KBD, ECHO_MS: ECHO_MS, JAM: JAM,
    defaults: defaults,
    presets: presets,
    initial: initial,
    norm: norm,
    rng: rng, gaussian: gaussian, plan: plan,
    grid: grid, dmin: dmin, bitsPerSymbol: bitsPerSymbol, gray: gray, bitsOf: bitsOf, pointOf: pointOf,
    decideAxis: decideAxis, decide: decide, bitErrors: bitErrors, receive: receive,
    snrLinear: snrLinear, sigma: sigma,
    erfc: erfc, Q: Qf, serOf: serOf, serTheory: serTheory, errorClass: errorClass,
    ofdmGrid: ofdmGrid, sinc: sinc, overlap: overlap, ofdmRun: ofdmRun
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
