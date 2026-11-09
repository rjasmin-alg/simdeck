/* SPDX-License-Identifier: AGPL-3.0-or-later
   fsk-psk-ask: three ways to put bits on a carrier (SPEC.md). The same bits key the carrier's amplitude (ASK),
   frequency (FSK) or phase (BPSK); the same seeded noise is added to all three, and a simple receiver decides each
   bit from its own symbol period.
   Rules from 50ohm.de (ask_fsk_afsk, psk, afsk; CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.).
   An explorer: the state is derived from the params alone. Pure: no DOM, no Math.random, no Date, no timers;
   randomness from a seeded generator. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var SPB = 48;                 // samples per bit (symbol)
  var MAX_BITS = 8;
  var CARRIER = 3;              // ASK and PSK carrier: cycles per bit
  var FSK_F0 = 2, FSK_F1 = 4;   // FSK space (0) and mark (1): cycles per bit; 2 cycles apart, so orthogonal over a bit
  var AFSK = { mark: 1200, space: 2200, baud: 1200 };   // APRS AFSK, Bell 202 (check)
  var A1 = 1;                   // ASK amplitude of a 1; PSK and FSK amplitude
  var A0_KEYED = 0.5;           // ASK amplitude of a 0 when OOK is off
  var SIGMA_MAX = 2;            // noise per sample (rms) at 100 %, in units of the carrier amplitude
  var BAND = [0.5, 5.5];        // the noise band, cycles per bit (the receiver's filter)
  var SCHEMES = ['ask', 'fsk', 'psk'];
  var PATTERNS = ['10110010', '11101000', '0101', '10101010', '11110000', '00110101'];

  /** mulberry32, the same generator as Simdeck.rng. */
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

  /** One standard normal draw (Box–Muller; u is never 0). */
  function gaussian(r) {
    var u = 0;
    while (u === 0) u = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
  }

  /** Unit noise for a seed: band-limited Gaussian noise over MAX_BITS·SPB samples, variance 1 per sample. It is a sum of
      sinusoids at m/MAX_BITS cycles per bit for the DFT bins m of the band BAND (the receiver's input filter: it passes
      the band the three signals use and nothing else), each with standard normal sine and cosine weights of variance
      1/M. A shorter bit string uses the first samples, and the noise slider only scales them, so the same seed gives
      the same noise to every scheme and at every level. */
  function noiseFor(seed) {
    var r = rng(seed * 7919 + 13), N = MAX_BITS * SPB, out = new Array(N).fill(0);
    var m0 = Math.round(BAND[0] * MAX_BITS), m1 = Math.round(BAND[1] * MAX_BITS), M = m1 - m0 + 1, w = Math.sqrt(1 / M);
    for (var m = m0; m <= m1; m++) {
      var a = gaussian(r) * w, b = gaussian(r) * w;
      for (var j = 0; j < N; j++) {
        var th = 2 * Math.PI * m * j / N;
        out[j] += a * Math.cos(th) + b * Math.sin(th);
      }
    }
    return out;
  }

  /** A bit string of 1 to 8 characters 0/1; anything else falls back to the default pattern. */
  function cleanBits(b) {
    return typeof b === 'string' && /^[01]{1,8}$/.test(b) ? b : PATTERNS[0];
  }

  /** The bit string with bit i flipped (the page's click on a cell). */
  function flip(bits, i) {
    var b = cleanBits(bits);
    if (i < 0 || i >= b.length) return b;
    return b.slice(0, i) + (b[i] === '1' ? '0' : '1') + b.slice(i + 1);
  }

  /** Amplitudes, frequencies and phases of the symbols for these params. Frequencies are cycles per bit. */
  function symbolsFor(p) {
    var a0 = p.ook ? 0 : A0_KEYED;
    var f0 = p.afsk ? AFSK.space / AFSK.baud : FSK_F0;
    var f1 = p.afsk ? AFSK.mark / AFSK.baud : FSK_F1;
    return { a0: a0, a1: A1, f0: f0, f1: f1, carrierCycles: CARRIER, phase0: 0, phase1: 180 };
  }

  /** Clean samples of the three keyed carriers. ASK and PSK: A·sin(2π·fc·t + φ), t in bits; FSK keeps its phase
      running across the bit boundaries (continuous phase, as an AFSK modem). */
  function modulate(bits, sym) {
    var out = { ask: [], fsk: [], psk: [] }, theta = 0;
    for (var k = 0; k < bits.length; k++) {
      var one = bits[k] === '1';
      var amp = one ? sym.a1 : sym.a0, ph = (one ? sym.phase1 : sym.phase0) * Math.PI / 180;
      var f = one ? sym.f1 : sym.f0;
      for (var n = 0; n < SPB; n++) {
        var t = k + n / SPB, w = 2 * Math.PI * sym.carrierCycles * t;
        out.ask.push(amp * Math.sin(w));
        out.psk.push(A1 * Math.sin(w + ph));
        out.fsk.push(A1 * Math.sin(theta));
        theta += 2 * Math.PI * f / SPB;
      }
    }
    return out;
  }

  /** Correlation of bit k's samples with a carrier of f cycles per bit: (2/N)·Σ r·sin and (2/N)·Σ r·cos.
      global: the reference runs on from t = 0 (the coherent ASK/PSK receiver); else it restarts in each bit (FSK). */
  function correlate(r, k, f, global) {
    var i = 0, q = 0;
    for (var n = 0; n < SPB; n++) {
      var t = (global ? k : 0) + n / SPB, w = 2 * Math.PI * f * t, v = r[k * SPB + n];
      i += v * Math.sin(w);
      q += v * Math.cos(w);
    }
    return { i: 2 * i / SPB, q: 2 * q / SPB };
  }

  /** Rule 5, the receiver's decision for one bit, from its statistics. A tie decides 0 in every scheme.
      ask: envelope against the midpoint (A0 + A1)/2; fsk: the stronger of the two tones; psk: the sign of the
      correlation with the reference (0° → 0, 180° → 1). */
  function decide(scheme, st, sym) {
    if (scheme === 'ask') return st.env > (sym.a0 + sym.a1) / 2 ? '1' : '0';
    if (scheme === 'fsk') return st.m1 > st.m0 ? '1' : '0';
    return st.i < 0 ? '1' : '0';
  }

  /** The statistics of bit k in each scheme, and the point drawn in its symbol view. */
  function stats(scheme, r, k, sym) {
    if (scheme === 'fsk') {
      var c0 = correlate(r, k, sym.f0, false), c1 = correlate(r, k, sym.f1, false);
      var m0 = Math.hypot(c0.i, c0.q), m1 = Math.hypot(c1.i, c1.q);
      return { m0: m0, m1: m1, x: m0, y: m1 };
    }
    var c = correlate(r, k, sym.carrierCycles, true);
    return { i: c.i, q: c.q, env: Math.hypot(c.i, c.q), x: c.i, y: c.q };
  }

  function round(x, d) { var m = Math.pow(10, d); return Math.round(x * m) / m || 0; }

  var logic = {
    defaults: { bits: '10110010', scheme: 'all', ook: true, noise: 0, seed: 1, afsk: false },

    SPB: SPB, MAX_BITS: MAX_BITS, CARRIER: CARRIER, FSK_F0: FSK_F0, FSK_F1: FSK_F1, AFSK: AFSK, A1: A1,
    A0_KEYED: A0_KEYED, SIGMA_MAX: SIGMA_MAX, BAND: BAND, SCHEMES: SCHEMES, PATTERNS: PATTERNS,

    presets: [
      { id: 'three-ways', params: { bits: '10110010', scheme: 'all', noise: 0 } },
      { id: 'cw-ook', params: { bits: '11101000', scheme: 'ask', ook: true } },
      { id: 'aprs-afsk', params: { bits: '10110010', scheme: 'fsk', afsk: true } },
      { id: 'bpsk-phase', params: { bits: '0101', scheme: 'psk' } },
      { id: 'noise-race', params: { bits: '10110010', scheme: 'all', noise: 40, seed: 7 } }
    ],

    rng: rng, gaussian: gaussian, noiseFor: noiseFor, cleanBits: cleanBits, flip: flip, symbolsFor: symbolsFor,
    modulate: modulate, correlate: correlate, decide: decide, stats: stats,

    /** The whole state, from the params. */
    initial: function (p) {
      var bits = cleanBits(p.bits), sym = symbolsFor(p), nb = bits.length;
      var sigma = SIGMA_MAX * p.noise / 100;
      var unit = noiseFor(p.seed), clean = modulate(bits, sym);
      var samples = {}, decided = {}, errors = {}, errorAt = {}, points = {};
      SCHEMES.forEach(function (s) {
        var r = clean[s].map(function (v, j) { return v + sigma * unit[j]; });
        var d = '', at = [], pts = [];
        for (var k = 0; k < nb; k++) {
          var st = stats(s, r, k, sym), b = decide(s, st, sym);
          d += b;
          if (b !== bits[k]) at.push(k);
          pts.push({ x: round(st.x, 4), y: round(st.y, 4), sent: bits[k], got: b });
        }
        samples[s] = r.map(function (v) { return round(v, 4); });
        clean[s] = clean[s].map(function (v) { return round(v, 4); });
        decided[s] = d; errors[s] = at.length; errorAt[s] = at; points[s] = pts;
      });
      // the ideal symbol points: what the receiver measures with no noise for a bit that starts at phase 0. ASK, PSK
      // and generic FSK start every bit there; with AFSK (continuous phase, 11/6 cycles a bit) each bit starts at
      // another phase, so the clean points lie near, not on, these crosses.
      var ideal = {}, raw = {};
      SCHEMES.forEach(function (s) {
        raw[s] = ['0', '1'].map(function (b) { return stats(s, modulate(b, sym)[s], 0, sym); });
        ideal[s] = raw[s].map(function (st, i) { return { bit: String(i), x: round(st.x, 4), y: round(st.y, 4) }; });
      });
      var jumps = [];
      for (var k = 1; k < nb; k++) if (bits[k] !== bits[k - 1]) jumps.push(k);
      var dist = function (s) { return round(Math.hypot(raw[s][1].x - raw[s][0].x, raw[s][1].y - raw[s][0].y), 4); };
      return {
        bits: bits, scheme: p.scheme, ook: !!p.ook, afsk: !!p.afsk, noise: p.noise, seed: p.seed,
        sigma: round(sigma, 4), spb: SPB,
        carrierCycles: sym.carrierCycles, f0: round(sym.f0, 6), f1: round(sym.f1, 6), a0: sym.a0, a1: sym.a1,
        afskHz: p.afsk ? { mark: AFSK.mark, space: AFSK.space, baud: AFSK.baud, bitUs: round(1e6 / AFSK.baud, 1) } : null,
        samples: samples, clean: clean, points: points, ideal: ideal,
        decided: decided, errors: errors, errorAt: errorAt,
        distance: { ask: dist('ask'), fsk: dist('fsk'), psk: dist('psk') },
        jumps: jumps
      };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
