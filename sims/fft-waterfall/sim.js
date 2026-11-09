/* SPDX-License-Identifier: AGPL-3.0-or-later
   fft-waterfall: the sample rate sets the span, the FFT size sets the resolution (SPEC.md).
   An explorer: the state is derived from the params alone. Pure: no DOM, no Math.random, no Date, no timers.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MSPS = 1e6;
  var FS = [0.25, 2.5, 12.5];                       // MSPS (the task's choice)
  var NS = [1024, 4096, 32768, 65536];
  var BANDS = { '2m': 145.0e6, '70cm': 435.0e6 };  // HamMonitor DESIGN.md: centres of 144–146 and 430–440 MHz
  var LADDER = [1e3, 2e3, 5e3, 1e4, 2e4, 5e4, 1e5, 2e5, 5e5, 1e6, 2e6, 5e6, 1e7, 2e7]; // view widths, Hz
  var ROWS = 40;                                    // waterfall history
  var COLS = 480;                                   // most display columns
  var EDGE_BINS = 120;                              // bin edges are drawn up to this many bins in view
  var CHANNEL = 12500;                              // HamMonitor channel_bw_hz
  var DC_GUARD = 4;                                 // HamMonitor dc_guard_bins
  var THRESHOLD_DB = 10;                            // HamMonitor threshold_db
  var N0_DB = -131;                                 // noise density, dBFS/Hz
  var ENBW = 1.5;                                   // Hann equivalent noise bandwidth, bins (Harris 1978)
  var RESOLVE_BINS = 2;                             // Hann 6 dB bandwidth, bins (Harris 1978)
  var FM_HALF = 5500;                               // Carson: 2·(2.5 kHz + 3 kHz) = 11 kHz
  var PAIR_GAP = 200;                               // Hz between the two carriers
  var DC_DB = -80;
  var KERNEL = 48;                                  // bins either side a signal reaches (W² ≈ −111 dB at 48; the tail beyond ≈ −101 dB)
  var SEED = 7;

  /** Scene per band: offsets are absolute frequencies here; the model subtracts the centre. */
  var SCENES = {
    '2m': [
      { id: 'pair', kind: 'cw', f: 144.0300e6, level: -85, on: null },
      { id: 'pair2', kind: 'cw', f: 144.0300e6 + PAIR_GAP, level: -85, on: null },
      { id: 'burst', kind: 'fm', f: 144.8000e6, level: -60, on: [-0.055, -0.015] },
      { id: 'strong', kind: 'fm', f: 145.2000e6, level: -30, on: null },
      { id: 'repeater', kind: 'fm', f: 145.6000e6, level: -65, on: null }
    ],
    '70cm': [
      { id: 'pair', kind: 'cw', f: 432.0500e6, level: -85, on: null },
      { id: 'pair2', kind: 'cw', f: 432.0500e6 + PAIR_GAP, level: -85, on: null },
      { id: 'burst', kind: 'fm', f: 433.0250e6, level: -60, on: [-0.055, -0.015] },
      { id: 'strong', kind: 'fm', f: 433.4500e6, level: -30, on: null },
      { id: 'repeater', kind: 'fm', f: 439.1500e6, level: -65, on: null }
    ]
  };

  // ── the Hann window's response, in bins ──

  /** Amplitude a tone x bins away adds to a bin, normalised to 1 on the bin: sinc(x)/(1 − x²). */
  function hann(x) {
    var a = Math.abs(x);
    if (a < 1e-9) return 1;
    if (Math.abs(a - 1) < 1e-9) return 0.5;
    if (Math.abs(a - Math.round(a)) < 1e-9) return 0;
    return Math.sin(Math.PI * x) / (Math.PI * x) / (1 - x * x);
  }

  // ∫ W² from −KERNEL to x, tabulated (it reaches ENBW = 1.5 bins); a flat band's power in a bin is density·Δf·(C(b) − C(a))
  var CUM_STEP = 1 / 32, CUM = null;
  function cumTable() {
    if (CUM) return CUM;
    var n = Math.round(2 * KERNEL / CUM_STEP), out = new Float64Array(n + 1), acc = 0, prev = Math.pow(hann(-KERNEL), 2);
    for (var i = 1; i <= n; i++) {
      var w = Math.pow(hann(-KERNEL + i * CUM_STEP), 2);
      acc += (prev + w) / 2 * CUM_STEP;
      out[i] = acc;
      prev = w;
    }
    CUM = out;
    return out;
  }
  function cum(x) {
    var t = cumTable();
    if (x <= -KERNEL) return 0;
    if (x >= KERNEL) return t[t.length - 1];
    var p = (x + KERNEL) / CUM_STEP, i = Math.floor(p), f = p - i;
    return t[i] + (t[Math.min(i + 1, t.length - 1)] - t[i]) * f;
  }

  // ── numbers ──

  function db(p) { return p > 0 ? 10 * Math.log10(p) : -300; }
  function lin(d) { return Math.pow(10, d / 10); }
  function round(x, d) { var m = Math.pow(10, d); return Math.round(x * m) / m; }

  /** Rule 5: where an offset lands in the span −fs/2 … +fs/2 (exactly +fs/2 folds to −fs/2). */
  function fold(offset, fs) {
    var k = Math.floor((offset + fs / 2) / fs);
    return offset - k * fs;
  }
  function inSpan(offset, fs) { return offset >= -fs / 2 && offset < fs / 2; }

  /** Rule 4: two equal carriers this many bins apart are resolved. */
  function resolved(bins) { return bins >= RESOLVE_BINS - 1e-12; }

  /** Rule 8: the share of a Hann block's energy (w² = sin⁴) that falls in [a, b], times in the block 0 … T. */
  function energyShare(a, b, T) {
    a = Math.max(0, Math.min(T, a)); b = Math.max(0, Math.min(T, b));
    if (b <= a) return 0;
    function F(t) { var th = Math.PI * t / T; return 3 * th / 8 - Math.sin(2 * th) / 4 + Math.sin(4 * th) / 32; }
    return (F(b) - F(a)) / (3 * Math.PI / 8);
  }

  /** A uniform number in (0, 1] from (bin, row): an integer hash, so any bin's noise can be read alone. */
  function hash01(k, r) {
    var h = (Math.imul(k | 0, 0x9E3779B1) ^ Math.imul((r + 1) | 0, 0x85EBCA77) ^ Math.imul(SEED, 0xC2B2AE3D)) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x7FEB352D) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 0x846CA68B) >>> 0;
    h = (h ^ (h >>> 16)) >>> 0;
    return (h + 1) / 4294967296;
  }
  /** Rule 7: noise power in bin k of row r: the mean times an exponential draw (clipped to −20 … +8.4 dB). */
  function noiseIn(k, r, mean) {
    var e = -Math.log(Math.max(1e-3, hash01(k, r)));
    return mean * Math.max(0.01, e);
  }

  /** The signals as the receiver sees them: inside, filtered out, or folded in as an alias. */
  function signalsFor(p) {
    var fs = p.fs * MSPS, c = BANDS[p.band];
    return SCENES[p.band].map(function (s) {
      var off = s.f - c, inside = inSpan(off, fs), shown = inside || !p.filter;
      return {
        id: s.id, kind: s.kind, f: s.f, offset: off, level: s.level, on: s.on ? s.on.slice() : null,
        inSpan: inside, shown: shown, alias: !inside && !p.filter, at: shown ? fold(off, fs) : null
      };
    });
  }

  /** How strongly a signal is on in row r: the share of the block's window energy in its on time (rule 8). */
  function onShare(s, r, T) {
    if (!s.on) return 1;
    // the block runs from (r + 1)·T ago to r·T ago; in block time 0 … T, "t seconds ago" is at T·(r + 1) − t
    return energyShare(T * (r + 1) + s.on[0], T * (r + 1) + s.on[1], T);
  }

  /**
   * Signal power (no noise) per bin for row r, written into pow (length N, bin k at index k + N/2).
   * CW lines add in amplitude, in phase (rule 4); FM bands and the DC spike add in power (rule 7).
   */
  function rowSignal(p, sigs, r, amp, pow) {
    var fs = p.fs * MSPS, N = p.N, bin = fs / N, T = N / fs, half = N / 2, k, i, lo, hi;
    amp.fill(0); pow.fill(0);
    sigs.forEach(function (s) {
      if (!s.shown) return;
      var share = onShare(s, r, T);
      if (share <= 0) return;
      var x = s.at / bin;
      if (s.kind === 'cw') {
        var a = Math.sqrt(lin(s.level) * share);
        lo = Math.max(-half, Math.ceil(x - KERNEL)); hi = Math.min(half - 1, Math.floor(x + KERNEL));
        for (k = lo; k <= hi; k++) amp[k + half] += a * hann(k - x);
      } else {
        var dens = lin(s.level) * share / (2 * FM_HALF), xa = (s.at - FM_HALF) / bin, xb = (s.at + FM_HALF) / bin;
        lo = Math.max(-half, Math.ceil(xa - KERNEL)); hi = Math.min(half - 1, Math.floor(xb + KERNEL));
        for (k = lo; k <= hi; k++) pow[k + half] += dens * bin * (cum(k - xa) - cum(k - xb));
      }
    });
    var dc = lin(DC_DB);
    for (k = -KERNEL; k <= KERNEL; k++) if (k >= -half && k < half) pow[k + half] += dc * Math.pow(hann(k), 2);
    for (i = 0; i < N; i++) pow[i] += amp[i] * amp[i];
    return pow;
  }

  /** Rule 9: a bin counts as a signal when it is at least THRESHOLD_DB above the mean noise per bin. */
  function detected(dbValue, noiseDb) { return dbValue >= noiseDb + THRESHOLD_DB; }

  /** Rule 9: the strongest bin of a row (index k + N/2) with |k| > guard; strict >, so the lower bin wins a tie. */
  function strongest(vals, guard) {
    var half = vals.length / 2, best = -Infinity, bk = null;
    for (var k = -half; k < half; k++) {
      if (Math.abs(k) <= guard) continue;
      if (vals[k + half] > best) { best = vals[k + half]; bk = k; }
    }
    return { k: bk, v: best };
  }

  /** The view: the zoom's width centred on the focus, kept inside the span (rule 10). */
  function viewFor(p, sigs) {
    var fs = p.fs * MSPS, w = LADDER[Math.max(0, Math.min(LADDER.length - 1, p.zoom))];
    var full = w >= fs, centre = 0, missing = false;
    if (p.focus !== 'dc') {
      var s = sigs.filter(function (x) { return x.id === p.focus; })[0];
      if (!s || !s.shown) missing = true;
      else centre = p.focus === 'pair' ? s.at + PAIR_GAP / 2 : s.at;
    }
    if (full) return { lo: -fs / 2, hi: fs / 2, width: fs, full: true, centre: 0, missing: missing };
    var lo = Math.max(-fs / 2, Math.min(fs / 2 - w, centre - w / 2));
    return { lo: lo, hi: lo + w, width: w, full: false, centre: centre, missing: missing };
  }

  /** Display columns over the view: one per bin, or groups of bins (rule 10). */
  function columnsFor(p, view) {
    var bin = p.fs * MSPS / p.N, half = p.N / 2;
    var b0 = Math.max(-half, Math.round(view.lo / bin)), b1 = Math.min(half - 1, Math.round(view.hi / bin));
    if (view.full) { b0 = -half; b1 = half - 1; }
    var nb = b1 - b0 + 1, g = Math.max(1, Math.ceil(nb / COLS)), cols = [];
    for (var k = b0; k <= b1; k += g) cols.push({ k0: k, k1: Math.min(b1, k + g - 1) });
    return { bins: nb, group: g, b0: b0, b1: b1, cols: cols, edges: g === 1 && nb <= EDGE_BINS };
  }

  var logic = {
    defaults: { fs: 2.5, N: 32768, band: '2m', filter: true, zoom: 13, focus: 'dc' },

    FS: FS, NS: NS, BANDS: BANDS, LADDER: LADDER, ROWS: ROWS, COLS: COLS, EDGE_BINS: EDGE_BINS, CHANNEL: CHANNEL,
    DC_GUARD: DC_GUARD, THRESHOLD_DB: THRESHOLD_DB, N0_DB: N0_DB, ENBW: ENBW, RESOLVE_BINS: RESOLVE_BINS,
    FM_HALF: FM_HALF, PAIR_GAP: PAIR_GAP, DC_DB: DC_DB, SCENES: SCENES, FOCI: ['dc', 'pair', 'burst', 'strong'],

    presets: [
      { id: '2m-monitor', params: { fs: 2.5, N: 32768, band: '2m' } },
      { id: '70cm-monitor', params: { fs: 12.5, N: 32768, band: '70cm' } },
      { id: 'two-carriers', params: { fs: 2.5, N: 4096, band: '2m', zoom: 1, focus: 'pair' } },
      { id: 'fm-burst', params: { fs: 2.5, N: 4096, band: '2m', zoom: 5, focus: 'burst' } },
      { id: 'alias', params: { fs: 0.25, N: 32768, band: '2m', filter: false, focus: 'strong' } }
    ],

    hann: hann, cum: cum, fold: fold, inSpan: inSpan, resolved: resolved, energyShare: energyShare,
    hash01: hash01, noiseIn: noiseIn, detected: detected, strongest: strongest, signalsFor: signalsFor, viewFor: viewFor, columnsFor: columnsFor, onShare: onShare,

    /** Rows 0 … 39 of signal power per bin (no noise), for tests and the measurement. */
    rowPower: function (p, r) {
      var sigs = signalsFor(p);
      return rowSignal(p, sigs, r, new Float64Array(p.N), new Float64Array(p.N));
    },

    /** The whole state, from the params. */
    initial: function (p) {
      var fs = p.fs * MSPS, N = p.N, bin = fs / N, T = N / fs, half = N / 2, centre = BANDS[p.band];
      var sigs = signalsFor(p);
      var noise = lin(N0_DB) * ENBW * bin;
      var view = viewFor(p, sigs), grid = columnsFor(p, view);
      var amp = new Float64Array(N), pow = new Float64Array(N);
      var spectrum = [], waterfall = [], peak = null;

      for (var r = 0; r < ROWS; r++) {
        rowSignal(p, sigs, r, amp, pow);
        var row = grid.cols.map(function (c) {
          var m = 0;
          for (var k = c.k0; k <= c.k1; k++) if (pow[k + half] > m) m = pow[k + half];
          return round(db(m + noiseIn(c.k0, r, noise)), 2);
        });
        waterfall.push(row);
        if (r === 0) {
          spectrum = row.slice();
          // rule 9: the strongest bin outside the DC guard, 10 dB above the mean noise; the lower bin wins a tie
          var tot = new Float64Array(N);
          for (var k = -half; k < half; k++) tot[k + half] = pow[k + half] + noiseIn(k, 0, noise);
          var m9 = strongest(tot, DC_GUARD), bk = m9.k, best = m9.v;
          if (bk !== null && detected(db(best), db(noise))) {
            var from = sigs.filter(function (s) {
              if (!s.shown) return false;
              var w = s.kind === 'fm' ? FM_HALF + 2 * bin : 2 * bin;
              return Math.abs(bk * bin - s.at) <= w;
            })[0] || null;
            peak = { bin: bk, offset: bk * bin, f: centre + bk * bin, db: round(db(best), 2), id: from ? from.id : null, alias: !!(from && from.alias) };
          }
        }
      }

      var pairBins = PAIR_GAP / bin;
      var burst = sigs.filter(function (s) { return s.id === 'burst'; })[0];
      var burstRows = [];
      for (var q = 0; q < ROWS; q++) if (onShare(burst, q, T) > 0) burstRows.push(q);
      return {
        fs: fs, N: N, centre: centre, band: p.band, filter: p.filter, window: 'hann',
        span: fs, spanLo: centre - fs / 2, spanHi: centre + fs / 2,
        binHz: bin, blockMs: T * 1000, rowsPerSec: fs / N, historyS: ROWS * T,
        binsPerChannel: CHANNEL / bin, pairBins: pairBins, resolved: resolved(pairBins),
        noiseDb: round(db(noise), 2),
        guard: { lo: -DC_GUARD * bin - bin / 2, hi: DC_GUARD * bin + bin / 2 },
        signals: sigs,
        aliases: sigs.filter(function (s) { return s.alias; }).map(function (s) { return { id: s.id, f: s.f, foldedTo: centre + s.at }; }),
        filtered: sigs.filter(function (s) { return !s.shown; }).map(function (s) { return s.id; }),
        burstRows: burstRows,
        view: view,
        cols: grid.cols.map(function (c) { return [c.k0, c.k1]; }),
        binsInView: grid.bins, group: grid.group, edges: grid.edges,
        spectrum: spectrum, waterfall: waterfall, peak: peak
      };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
