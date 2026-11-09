/* SPDX-License-Identifier: AGPL-3.0-or-later
   lora-css: LoRa chirp spread spectrum (SPEC.md). The spreading factor SF and the bandwidth BW set the symbol
   duration; from it follow the time on air of a packet, the raw bit rate, the sensitivity (and so the range) and the
   wait a 1 % duty cycle imposes. The page draws the chirps of the packet in a time–frequency plot.
   Rules from Semtech, LoRa Modem Designer's Guide (AN1200.13) and the "Time on air" section and sensitivity table of
   Semtech's LoRa transceiver data sheets; ETSI EN 300 220 for the duty cycle. Vendor-specific because LoRa is one
   vendor's modulation.
   An explorer: the state is derived from the params alone. Pure: no DOM, no Math.random, no Date, no timers. State
   is plain JSON. The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var SFS = [7, 8, 9, 10, 11, 12];
  var BWS = [125, 250, 500];            // kHz
  var CRS = [1, 2, 3, 4];               // coding rate 4/(4 + CR): 4/5 … 4/8
  var PREAMBLE = 8;                     // programmed preamble symbols
  var SYNC = 4.25;                      // the modem adds 4.25 symbols: 2 sync-word symbols and 2.25 down-chirps
  var NF = 6;                           // receiver noise figure, dB (derived rule 4)
  var KTB = -174;                       // thermal noise density at 290 K, dBm/Hz
  var DE_MS = 16;                       // low-data-rate optimisation when a symbol lasts longer than this, ms
  var DUTY = 0.01;                      // 1 % duty cycle (EU 868 MHz sub-band)
  var PATH_N = { free: 2, built: 3.5 }; // path-loss exponent (rule 5, illustrative)
  var REF = { sf: 7, bw: 125 };         // the range factor's reference
  var WINDOW_MS = 100;                  // the time–frequency plot's fixed window
  var ZOOM_SYMBOLS = 4;                 // the zoomed view: the first data symbols
  var VIEWS = ['window', 'packet', 'symbols'];
  var PL_MAX = 50;

  /** mulberry32, the same generator as Simdeck.rng (the illustrative symbol values). */
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

  function round(x, d) { var m = Math.pow(10, d); return Math.round(x * m) / m || 0; }

  /** Rule 1: symbol duration T_s = 2^SF / BW, in ms for BW in kHz. One symbol carries SF bits. */
  function symbolMs(sf, bw) { return Math.pow(2, sf) / bw; }

  /** Rule 3: low-data-rate optimisation, on when a symbol lasts longer than 16 ms (SF11 and SF12 at 125 kHz, SF12 at
      250 kHz). Exactly 16 ms is off. */
  function lowDataRate(ts) { return ts > DE_MS ? 1 : 0; }

  /** Rule 3: payload symbols, n = 8 + max(⌈(8·PL − 4·SF + 28 + 16·CRC − 20·H) / (4·(SF − 2·DE))⌉·(CR + 4), 0). */
  function payloadSymbols(pl, sf, cr, de, h, crc) {
    var k = Math.ceil((8 * pl - 4 * sf + 28 + 16 * crc - 20 * h) / (4 * (sf - 2 * de)));
    return 8 + Math.max(k * (cr + 4), 0);
  }

  /** Rule 2: raw bit rate R_b = SF · (BW / 2^SF) · 4 / (4 + CR), bit/s. */
  function bitRate(sf, bw, cr) { return sf * bw * 1000 / Math.pow(2, sf) * 4 / (4 + cr); }

  /** Rule 4: the SNR the demodulator still needs: −7.5 dB at SF7, 2.5 dB lower per SF step, −20 dB at SF12. */
  function snrLimit(sf) { return -7.5 - 2.5 * (sf - 7); }

  /** Rule 4: sensitivity = −174 + 10·log10(BW) + NF + SNR limit, dBm (BW in Hz). */
  function sensitivity(sf, bw) { return KTB + 10 * Math.log10(bw * 1000) + NF + snrLimit(sf); }

  /** Rule 5: range relative to the reference = 10^(Δ / (10·n)), Δ the dB of sensitivity gained over the reference. */
  function rangeFactor(gainDb, n) { return Math.pow(10, gainDb / (10 * n)); }

  /** Rule 6: after a packet the device stays silent (1/duty − 1) × time on air: 99 × at 1 %. */
  function dutyWait(toaMs) { return toaMs * (1 / DUTY - 1) / 1000; }

  /** Time on air and its parts for one setting (rules 1–3): explicit header, CRC on, preamble 8. */
  function airtime(sf, bw, cr, pl) {
    var ts = symbolMs(sf, bw), de = lowDataRate(ts), n = payloadSymbols(pl, sf, cr, de, 0, 1);
    return { ts: ts, de: de, payloadSymbols: n, symbols: PREAMBLE + SYNC + n, toaMs: (PREAMBLE + SYNC + n) * ts };
  }

  /** One row of the SF table, rounded for display and JSON. n is the path-loss exponent. */
  function row(sf, bw, cr, pl, n) {
    var a = airtime(sf, bw, cr, pl), sens = sensitivity(sf, bw);
    return {
      sf: sf, ts: round(a.ts, 3), de: a.de, payloadSymbols: a.payloadSymbols, symbols: a.symbols,
      toaMs: round(a.toaMs, 3), bitRate: round(bitRate(sf, bw, cr), 2), snrLimit: snrLimit(sf),
      sensitivityDbm: round(sens, 2), rangeFactor: round(rangeFactor(sensitivity(REF.sf, REF.bw) - sens, n), 3),
      dutyWaitS: round(dutyWait(a.toaMs), 3)
    };
  }

  /** The chirps of the packet, in order: preamble up-chirps (offset 0), two sync-word up-chirps, 2.25 down-chirps,
      then the payload symbols. start and dur are ms; offset is the symbol value 0 … 2^SF − 1, where the chirp starts
      on the 2^SF cyclic positions across BW. The sync and data values are illustrative (seeded by SF and payload):
      a real modem whitens, codes and interleaves the payload first (out of scope). */
  function chirpsFor(sf, ts, nPayload, pl) {
    var out = [], t = 0, M = Math.pow(2, sf), r = rng(sf * 131 + pl);
    var push = function (kind, offset, dur) { out.push({ kind: kind, start: round(t, 4), dur: round(dur, 4), offset: offset }); t += dur; };
    for (var i = 0; i < PREAMBLE; i++) push('pre', 0, ts);
    push('sync', 3 * M / 16, ts);
    push('sync', 4 * M / 16, ts);
    push('down', 0, ts); push('down', 0, ts); push('down', 0, ts / 4);
    for (var k = 0; k < nPayload; k++) push('data', Math.floor(r() * M), ts);
    return out;
  }

  /** Where a chirp of this offset wraps, as a fraction of the symbol: it starts at offset/2^SF of the band, rises
      across BW in T_s and wraps at the top. Offset 0 never wraps (null). */
  function wrapAt(offset, sf) { return offset > 0 ? 1 - offset / Math.pow(2, sf) : null; }

  /** The bars that changed by more than 10 % between two states (the page's "changed" mark). Exactly 10 % is not. */
  function changed(prev, next) {
    if (!prev) return [];
    var bars = { toa: 'toaMs', range: 'rangeFactor', wait: 'dutyWaitS' };
    return Object.keys(bars).filter(function (b) {
      var a = prev[bars[b]], z = next[bars[b]];
      return Math.abs(z - a) > 0.1 * Math.abs(a);
    });
  }

  var logic = {
    defaults: { SF: 7, BW: 125, CR: 1, payload: 20, n: 'free', view: 'window' },

    SFS: SFS, BWS: BWS, CRS: CRS, PREAMBLE: PREAMBLE, SYNC: SYNC, NF: NF, KTB: KTB, DE_MS: DE_MS, DUTY: DUTY,
    PATH_N: PATH_N, REF: REF, WINDOW_MS: WINDOW_MS, ZOOM_SYMBOLS: ZOOM_SYMBOLS, VIEWS: VIEWS, PL_MAX: PL_MAX,

    presets: [
      { id: 'sf7', params: { SF: 7, BW: 125, CR: 1, payload: 20 } },
      { id: 'sf12', params: { SF: 12, BW: 125, CR: 1, payload: 20 } },
      { id: 'sf9-bw', params: { SF: 9, BW: 250, CR: 1, payload: 20 } },
      { id: 'sf-step', params: { SF: 11, BW: 125, CR: 1, payload: 20 } }
    ],

    rng: rng, symbolMs: symbolMs, lowDataRate: lowDataRate, payloadSymbols: payloadSymbols, bitRate: bitRate,
    snrLimit: snrLimit, sensitivity: sensitivity, rangeFactor: rangeFactor, dutyWait: dutyWait, airtime: airtime,
    row: row, chirpsFor: chirpsFor, wrapAt: wrapAt, changed: changed,

    /** The whole state, from the params. Out-of-range params fall back to the defaults. */
    initial: function (p) {
      var D = logic.defaults;
      var SF = SFS.indexOf(p.SF) >= 0 ? p.SF : D.SF, BW = BWS.indexOf(p.BW) >= 0 ? p.BW : D.BW;
      var CR = CRS.indexOf(p.CR) >= 0 ? p.CR : D.CR;
      var PL = Number.isInteger(p.payload) && p.payload >= 1 && p.payload <= PL_MAX ? p.payload : D.payload;
      var nKey = PATH_N[p.n] ? p.n : D.n, n = PATH_N[nKey];
      var view = VIEWS.indexOf(p.view) >= 0 ? p.view : D.view;
      var cur = row(SF, BW, CR, PL, n), a = airtime(SF, BW, CR, PL);
      var base = row(REF.sf, BW, CR, PL, n);                  // SF7 at the same bandwidth (the caption's comparison)
      var top = row(12, REF.bw, 4, PL_MAX, PATH_N.free);      // the bars' full scale: the longest, furthest setting
      var ref = row(REF.sf, REF.bw, CR, PL, n);               // the bars' reference tick: SF7 at 125 kHz
      return {
        SF: SF, BW: BW, CR: CR, payload: PL, n: nKey, pathN: n, view: view,
        chips: Math.pow(2, SF), bitsPerSymbol: SF,
        Ts: cur.ts, de: cur.de, payloadSymbols: cur.payloadSymbols, symbols: cur.symbols, toaMs: cur.toaMs,
        bitRate: cur.bitRate, snrLimit: cur.snrLimit, sensitivityDbm: cur.sensitivityDbm,
        rangeFactor: cur.rangeFactor, dutyWaitS: cur.dutyWaitS,
        vsSf7: { toa: round(cur.toaMs / base.toaMs, 2), range: round(cur.rangeFactor / base.rangeFactor, 2) },
        scale: { toaMs: top.toaMs, rangeFactor: top.rangeFactor, dutyWaitS: top.dutyWaitS },
        ref: { toaMs: ref.toaMs, rangeFactor: ref.rangeFactor, dutyWaitS: ref.dutyWaitS },
        table: SFS.map(function (sf) { return row(sf, BW, CR, PL, n); }),
        windowMs: WINDOW_MS,
        // the plotted span [from, to] in ms: the first 100 ms, the whole packet, or the first data symbols
        span: view === 'packet' ? [0, cur.toaMs] : view === 'symbols'
          ? [round((PREAMBLE + SYNC) * a.ts, 4), round((PREAMBLE + SYNC + ZOOM_SYMBOLS) * a.ts, 4)] : [0, WINDOW_MS],
        chirps: chirpsFor(SF, a.ts, a.payloadSymbols, PL)
      };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
