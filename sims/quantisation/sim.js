/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for sampling and quantisation: an A/D converter samples a 1 Hz sine fs times a second and rounds each sample
   to one of 2^bits levels; a D/A converter holds each level until the next sample (zero-order hold). An explorer:
   no steps; the page draws initial(params).
   Adopted from 50ohm-contents-hr/contents/html/quantisierung_und_sampling.html (script by DL9MJ, 2024: the 1 Hz sine
   over 1 s, fs = 2^1 … 2^10 samples/s, 1 … 16 bits, the stepped D/A output), CC BY 4.0, 50ohm.de-Autorenteam,
   AJW-Referat des DARC e.V.; changed for simdeck (NOTES.md says what and why).
   Units: time in s, values as a fraction of the amplitude (−1 … 1; the page shows %).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DURATION = 1;                  // shown window, s: one period of the 1 Hz signal (the original's max)
  var RATE_MIN = 1, RATE_MAX = 10;   // fs = 2^rate samples/s: 2 … 1024 (the original's time slider)
  var BITS_MIN = 1, BITS_MAX = 16;   // the original's value slider

  function clampInt(x, lo, hi) { return Math.min(hi, Math.max(lo, Math.round(Number(x)))); }

  /** The analogue signal at sample n of fs per second: sin(2π n / fs), exact at the quarter periods.
      fs is a power of two, so n / fs is exact; the quarter points return exactly 0, ±1 (Math.sin(π) is 1.2e-16,
      which would put a zero crossing on the wrong side of a decision boundary). */
  function signalAt(n, fs) {
    var m = ((n % fs) + fs) % fs;
    if ((4 * m) % fs === 0) return [0, 1, 0, -1][(4 * m) / fs];
    return Math.sin(2 * Math.PI * m / fs);
  }

  /** The analogue signal at time t (s), for drawing. */
  function signal(t) { return Math.sin(2 * Math.PI * t); }

  /** A b-bit mid-rise quantiser over −1 … 1: 2^b levels Δ = 2 / 2^b apart, at −1 + (k + ½)Δ, k = 0 … 2^b − 1.
      Each value goes to the nearest level, so the error is at most Δ/2.
      Tie-breaks: a value exactly on a decision boundary (−1 + kΔ, 0 among them) goes to the level above; the
      ends −1 and +1 go to the lowest and highest level. Returns the code k and the level q. */
  function quantise(v, bits) {
    var levels = Math.pow(2, bits), delta = 2 / levels;
    var k = Math.min(levels - 1, Math.max(0, Math.floor((v + 1) / delta)));
    return { k: k, q: -1 + (k + 0.5) * delta };
  }

  var defaults = { rate: 4, bits: 16 };

  /** Presets (keys 1–6, in this order). The page adds the labels. */
  var presets = [
    { id: 'fine', params: { rate: 10, bits: 16 } },
    { id: 'coarse-time', params: { rate: 4, bits: 16 } },
    { id: 'coarse-value', params: { rate: 10, bits: 3 } },
    { id: 'both', params: { rate: 4, bits: 3 } },
    { id: 'one-bit', params: { rate: 10, bits: 1 } },
    { id: 'limit', params: { rate: 1, bits: 16 } }
  ];

  /** The state the page draws: every sample with its code and level, and the numbers the caption names. */
  function initial(p) {
    var rate = clampInt(p.rate, RATE_MIN, RATE_MAX), bits = clampInt(p.bits, BITS_MIN, BITS_MAX);
    var fs = Math.pow(2, rate), levels = Math.pow(2, bits), delta = 2 / levels;
    var samples = [], maxError = 0;
    for (var n = 0; n <= fs * DURATION; n++) {
      var v = signalAt(n, fs), qz = quantise(v, bits);
      samples.push({ n: n, t: n / fs, v: v, k: qz.k, q: qz.q });
      maxError = Math.max(maxError, Math.abs(qz.q - v));
    }
    return {
      rate: rate,
      fs: fs,
      ts: 1 / fs,
      bits: bits,
      levels: levels,
      delta: delta,
      errorBound: delta / 2,
      maxError: maxError,
      // Rule of thumb for a full-scale sine: SNR ≈ 6.02 · b + 1.76 dB.
      snr: 6.02 * bits + 1.76,
      // fs = 2 per period: every sample lands on a zero crossing (the sampling theorem's limit, sims/nyquist).
      atLimit: fs === 2,
      samples: samples
    };
  }

  /** The D/A output as a polyline: each level held from its sample to the next, the last one to the window's end. */
  function held(samples) {
    var out = [];
    for (var i = 0; i < samples.length; i++) {
      var end = i + 1 < samples.length ? samples[i + 1].t : DURATION;
      out.push({ t: samples[i].t, y: samples[i].q }, { t: end, y: samples[i].q });
    }
    return out;
  }

  /** The analogue curve over the window at `points` + 1 evenly spaced times. */
  function curve(points) {
    var out = [];
    for (var i = 0; i <= points; i++) { var t = (i / points) * DURATION; out.push({ t: t, y: signal(t) }); }
    return out;
  }

  /** The 2^bits output levels, lowest first. */
  function levelsOf(bits) {
    var L = Math.pow(2, bits), out = [];
    for (var k = 0; k < L; k++) out.push(-1 + (k + 0.5) * (2 / L));
    return out;
  }

  var logic = {
    DURATION: DURATION, RATE_MIN: RATE_MIN, RATE_MAX: RATE_MAX, BITS_MIN: BITS_MIN, BITS_MAX: BITS_MAX,
    defaults: defaults,
    presets: presets,
    initial: initial,
    signal: signal,
    signalAt: signalAt,
    quantise: quantise,
    held: held,
    curve: curve,
    levelsOf: levelsOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
