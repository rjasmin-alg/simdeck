/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the Shannon–Hartley law: the capacity C = B · log2(1 + S/N) of a channel of bandwidth B at a
   signal-to-noise ratio S/N (SPEC.md). An explorer: no steps; the page draws initial(params).
   Rules after 50ohm-contents-hr sections/shannon_hartley_gesetzt.md (CC BY 4.0, 50ohm.de-Autorenteam,
   AJW-Referat des DARC e.V.) and C. E. Shannon, "Communication in the Presence of Noise", Proc. IRE 37(1), 1949.
   Params: b and rate are indices into GRID (log steps, so one slider spans 10 Hz to 20 MHz); snr is in whole dB.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // ── the log grid: 13 values per decade, in tenths so every value is exact ──
  // 2.4 and 2.5 are the reference bandwidths (SSB channel, weak-signal software), 4.8 and 9.6 twice and four
  // times 2.4: the presets and the caption's numbers lie on the grid.
  var MANTISSA = [10, 12, 15, 20, 24, 25, 30, 40, 48, 50, 60, 80, 96];
  var GRID = (function () {
    var out = [];
    for (var k = 0; k <= 8; k++) {
      for (var i = 0; i < MANTISSA.length; i++) out.push(Math.round(MANTISSA[i] * Math.pow(10, k - 1) * 10) / 10);
    }
    out.push(1e9);
    return out;
  })();

  /** Index of a value on the grid, or -1 when it is not on it. */
  function gridIndex(v) { return GRID.indexOf(v); }

  var B_MIN = gridIndex(10), B_MAX = gridIndex(2e7);        // 10 Hz … 20 MHz
  var RATE_MIN = gridIndex(1), RATE_MAX = gridIndex(1e9);   // 1 bit/s … 1 Gbit/s
  var SNR_MIN = -30, SNR_MAX = 40;                          // dB, step 1
  var Y_MAX = 14;                                           // bit/s per Hz shown: log2(1 + 10^4) = 13.29 at 40 dB

  // ── rules ──

  /** Rule 2: dB to a linear power ratio, S/N = 10^(dB/10). 0 dB is 1. */
  function dbToLin(db) { return Math.pow(10, db / 10); }

  /** log2(1 + S/N): the bits per second each hertz of bandwidth can carry at most. */
  function bitsPerHz(snrLin) { return Math.log2(1 + snrLin); }

  /** Rule 1: C = B · log2(1 + S/N) bit/s, S/N linear, N the noise inside B only. */
  function capacity(B, snrDb) { return B * bitsPerHz(dbToLin(snrDb)); }

  /** Rule 3: the S/N in dB needed for a rate R in a bandwidth B: S/N = 2^(R/B) − 1. Grows about 3 dB per
      extra bit per hertz, so R ≫ B makes it explode. Stable at both ends: expm1 for small R/B, and the
      asymptote R/B · 10·log10(2) where 2^(R/B) would overflow. */
  function requiredSnrDb(R, B) {
    var x = R / B;
    if (x > 60) return 10 * x * Math.LOG10E * Math.LN2 + 10 * Math.log10(-Math.expm1(-x * Math.LN2));
    return 10 * Math.log10(Math.expm1(x * Math.LN2));
  }

  /** The power of ten C has reached: floor(log10 C). Tie-break: exactly 10^k counts as reached (k, not k − 1);
      the tolerance absorbs the rounding of B · log2(…) (1000.0000000001 and 999.9999999999 are both 3). */
  function decade(C) { return Math.floor(Math.log10(C) + 1e-9); }

  /** Rule 4: a target rate against the bound. 'below' (R < C: possible, with good enough coding), 'limit'
      (R = C to 1e-9: the bound itself, only approached), 'above' (R > C: no system can do it).
      Tie-break: R = C is 'limit', not 'below'. */
  function verdict(R, C) {
    if (Math.abs(R - C) <= 1e-9 * Math.max(R, C)) return 'limit';
    return R < C ? 'below' : 'above';
  }

  /** The width axis of the rectangle: the smallest 1, 2 or 5 · 10^k that holds B (B itself when it is one). */
  function axisMax(B) {
    var k = Math.floor(Math.log10(B) + 1e-9), p = Math.pow(10, k);
    var steps = [1, 2, 5, 10];
    for (var i = 0; i < steps.length; i++) if (steps[i] * p >= B * (1 - 1e-12)) return steps[i] * p;
    return 10 * p;
  }

  // ── example systems (fixed markers): bandwidth and SNR as the 50ohm text and the task file put them ──
  // ft8: the SNR is the weak-signal software's, in a 2.5 kHz reference bandwidth (rule 5): it is not the SNR inside
  // the 50 Hz the signal really uses, and its C is a ceiling for the reference band only.
  var EXAMPLES = [
    { id: 'ft8', B: 2500, snrDb: -20, ref: true },
    { id: 'ssb', B: 2400, snrDb: 10 },
    { id: 'hamnet', B: 1e7, snrDb: 20 },
    { id: 'wlan', B: 2e7, snrDb: 30 }
  ];

  var defaults = { b: gridIndex(2400), snr: 10, target: false, rate: gridIndex(9600) };

  /** Presets (keys 1–6). The page adds the labels and hints. */
  var presets = [
    { id: 'zero-db', params: { b: gridIndex(2400), snr: 0, target: false } },
    { id: 'ssb-10', params: { b: gridIndex(2400), snr: 10, target: false } },
    { id: 'double-b', params: { b: gridIndex(4800), snr: 10, target: false } },
    { id: 'weak-signal', params: { b: gridIndex(2500), snr: -20, target: false } },
    { id: 'hamnet', params: { b: gridIndex(1e7), snr: 20, target: false } },
    { id: 'rate-above-b', params: { b: gridIndex(2400), snr: 10, target: true, rate: gridIndex(48000) } }
  ];

  function clampInt(v, lo, hi, dflt) {
    var n = Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return Math.min(hi, Math.max(lo, n));
  }

  /** The state the page draws. */
  function initial(p) {
    var B = GRID[clampInt(p.b, B_MIN, B_MAX, defaults.b)];
    var snrDb = clampInt(p.snr, SNR_MIN, SNR_MAX, defaults.snr);
    var snrLin = dbToLin(snrDb);
    var bph = bitsPerHz(snrLin);
    var C = B * bph;
    var s = {
      B: B, snrDb: snrDb, snrLin: snrLin, bitsPerHz: bph, C: C, decade: decade(C), axis: axisMax(B),
      target: null, rateRatio: null, requiredSnrDb: null, verdict: null,
      examples: EXAMPLES.map(function (e) {
        var lin = dbToLin(e.snrDb);
        return { id: e.id, B: e.B, snrDb: e.snrDb, bitsPerHz: bitsPerHz(lin), C: e.B * bitsPerHz(lin), ref: !!e.ref };
      })
    };
    if (p.target) {
      var R = GRID[clampInt(p.rate, RATE_MIN, RATE_MAX, defaults.rate)];
      s.target = R;
      s.rateRatio = R / B;
      s.requiredSnrDb = requiredSnrDb(R, B);
      s.verdict = verdict(R, C);
    }
    return s;
  }

  var logic = {
    GRID: GRID, B_MIN: B_MIN, B_MAX: B_MAX, RATE_MIN: RATE_MIN, RATE_MAX: RATE_MAX,
    SNR_MIN: SNR_MIN, SNR_MAX: SNR_MAX, Y_MAX: Y_MAX, EXAMPLES: EXAMPLES,
    defaults: defaults,
    presets: presets,
    initial: initial,
    gridIndex: gridIndex,
    dbToLin: dbToLin,
    bitsPerHz: bitsPerHz,
    capacity: capacity,
    requiredSnrDb: requiredSnrDb,
    decade: decade,
    verdict: verdict,
    axisMax: axisMax
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
