/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the communication technologies poster: wireless technologies grouped by purpose (nine categories, each
   amateur, professional or mixed), every one placed by its frequency range on a logarithmic axis from 100 kHz to
   500 GHz, with the ITU bands behind. A reference page: no steps and no params; the page draws initial().
   Adopted from single-page-labs/komunikacijske-tehnologije-poster.html (CATEGORIES, the axis range, the ITU bands,
   the categories' types); see NOTES.md for what changed.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // ── data (frequencies in MHz, as in the original; names and notes are in strings.js under n_<id>, d_<id>) ──

  /** Categories in the original's order. `type` is the original's badge: amateur, professional or mixed.
      `c` is the kit series colour (as in sims/rf-bandplan); `hatch` tells the two that share --c1 apart. */
  var CATEGORIES = [
    { id: 'mobile', type: 'mixed', c: 2, techs: [
      ['gsm', 880, 960], ['umts', 1920, 2170], ['lte', 700, 2600], ['lte-a-pro', 700, 3500],
      ['nr-sub6', 600, 6000], ['nr-mmwave', 24000, 40000], ['redcap', 700, 3500]] },
    { id: 'wlan', type: 'mixed', c: 1, techs: [
      ['wifi4', 2400, 2500], ['wifi5', 5150, 5850], ['wifi6', 2400, 5850], ['wifi6e', 5925, 7125],
      ['wifi7', 2400, 7125], ['bluetooth', 2402, 2480], ['zigbee', 2405, 2480], ['thread', 2405, 2480],
      ['zwave', 868, 869], ['uwb', 6240, 8240], ['nfc', 13.56, 13.56], ['dect', 1880, 1900]] },
    { id: 'iot', type: 'mixed', c: 3, techs: [
      ['lora-eu', 863, 870], ['lora-us', 902, 928], ['unb', 868, 868.2], ['nbiot', 700, 2100],
      ['ltem', 700, 2100], ['tsunb', 868, 870], ['dash7', 433, 434], ['lora-mesh', 868, 870]] },
    { id: 'sat', type: 'professional', c: 4, techs: [
      ['gps', 1176, 1575], ['galileo', 1164, 1591], ['glonass', 1246, 1616], ['leo-mss-tdma', 1616, 1626],
      ['leo-ku', 10700, 14500], ['geo-mss', 1525, 1559], ['geo-phone', 1525, 1559], ['leo-mss-cdma', 1610, 1618],
      ['cospas', 406, 406.1]] },
    { id: 'broadcast', type: 'professional', c: 7, techs: [
      ['am', 0.526, 1.606], ['fm', 87.5, 108], ['dab', 174, 240], ['dvbt2', 470, 694],
      ['dvbs2', 10700, 12750], ['dvbc2', 50, 862], ['sw', 2.3, 26.1]] },
    { id: 'ham', type: 'amateur', c: 6, techs: [
      ['hf', 1.8, 29.7], ['vhf2m', 144, 146], ['uhf70', 430, 440], ['ham23', 1240, 1300],
      ['ham13', 2300, 2450], ['dstar', 144, 1300], ['dmr-ham', 430, 440], ['c4fm', 144, 440],
      ['ft8', 1.8, 50], ['npr', 430, 440], ['aprs', 144.8, 144.8], ['qo100', 2400, 2410]] },
    { id: 'pmr', type: 'professional', c: 5, techs: [
      ['tetra', 380, 400], ['dmr3', 400, 470], ['p25', 138, 870], ['nxdn', 400, 520],
      ['dpmr', 400, 470], ['pmr446', 446, 446.2], ['mcptt', 700, 3500], ['cb', 26.965, 27.405]] },
    { id: 'fixed', type: 'professional', c: 1, hatch: true, techs: [
      ['ptp', 6000, 42000], ['ptp60', 57000, 71000], ['ptp-e', 71000, 86000], ['wimax', 2300, 3500],
      ['cbrs', 3550, 3700]] },
    { id: 'radar', type: 'professional', c: 8, techs: [
      ['adsb', 1090, 1090], ['ssr', 1030, 1090], ['vor', 108, 117.95], ['ils', 108.1, 111.95],
      ['dme', 962, 1213], ['ais', 161.975, 162.025], ['marine', 156, 162.025], ['acars', 129.125, 136.9],
      ['autoradar', 76000, 81000]] }
  ].map(function (cat) {
    return { id: cat.id, type: cat.type, c: cat.c, hatch: !!cat.hatch, techs: cat.techs.map(function (x) {
      return { id: x[0], fMin: x[1], fMax: x[2], cat: cat.id };
    }) };
  });

  var TYPES = ['amateur', 'professional', 'mixed'];

  /** The ITU bands the original drew behind the bars (VLF and LF lie left of the axis and are cut). */
  var ITU = [
    ['VLF', 0.003, 0.03], ['LF', 0.03, 0.3], ['MF', 0.3, 3], ['HF', 3, 30], ['VHF', 30, 300], ['UHF', 300, 3000],
    ['SHF', 3000, 30000], ['EHF', 30000, 300000]
  ].map(function (x) { return { id: x[0], fMin: x[1], fMax: x[2] }; });

  var TECHS = [];
  CATEGORIES.forEach(function (c) { TECHS = TECHS.concat(c.techs); });
  var BY_ID = {};
  TECHS.forEach(function (x) { BY_ID[x.id] = x; });

  // ── the axis: the original's range, 0.1 MHz to 500 GHz, log10 of the frequency in MHz ──

  var AXIS_MIN = 0.1;
  var AXIS_MAX = 500000;
  var LOG_MIN = Math.log10(AXIS_MIN);
  var LOG_MAX = Math.log10(AXIS_MAX);

  function lg(f) { return Math.log10(f); }

  /** Position of a frequency on the axis: 0 at 100 kHz, 1 at 500 GHz. Frequencies below the axis sit at 0, as the
      original clamped them; above it they are clamped to 1. */
  function frac(f) {
    var x = (lg(Math.max(f, AXIS_MIN)) - LOG_MIN) / (LOG_MAX - LOG_MIN);
    return Math.min(1, x);
  }

  /** The original's axis ticks: every 1 and 3 from 100 kHz to 300 GHz. */
  var TICKS = [0.1, 0.3, 1, 3, 10, 30, 100, 300, 1000, 3000, 10000, 30000, 100000, 300000];

  // ── lanes: overlapping bars of one category stack ──

  /** A single frequency (fMin = fMax) is drawn as a marker; for packing it takes this width in decades. */
  var POINT_W = 0.02;
  /** Two bars in one lane keep this gap in decades, so neighbours do not touch on the small strips. */
  var LANE_GAP = 0.03;

  // from sims/rf-bandplan/sim.js @ 22e2490 (packLanes), with POINT_W and LANE_GAP sized for this page's strips
  /** Greedy interval packing: bars sorted by start, then the wider first, then by id; each goes into the first lane
      whose last bar ends at least LANE_GAP before it. Returns { lane: { id: index }, count }. */
  function packLanes(items) {
    var sorted = items.slice().sort(function (a, b) {
      return lg(a.fMin) - lg(b.fMin) || lg(b.fMax) - lg(a.fMax) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    });
    var ends = [], lane = {};
    sorted.forEach(function (x) {
      var s = lg(x.fMin), e = Math.max(lg(x.fMax), s + POINT_W);
      var i = 0;
      while (i < ends.length && ends[i] + LANE_GAP > s) i++;
      ends[i] = e;
      lane[x.id] = i;
    });
    return { lane: lane, count: ends.length };
  }

  // ── frequencies as text ──

  /** A frequency in MHz as { num, unit }: kHz under 1 MHz, GHz from 1000 MHz, else MHz; at most 3 decimals,
      trailing zeros dropped (13.56 stays 13.56, where the original rounded it to 13.6). `num` uses a point. */
  function formatFreq(f) {
    var unit = 'MHz', v = f;
    if (f < 1) { unit = 'kHz'; v = f * 1000; } else if (f >= 1000) { unit = 'GHz'; v = f / 1000; }
    var s = v.toFixed(3);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return { num: s, unit: unit };
  }

  /** A technology's range as parts: one frequency, a range in one unit ("880–960 MHz") or across units
      ("700 MHz – 3.5 GHz"). Returns { single, lo, hi, same } with lo and hi from formatFreq. */
  function rangeOf(x) {
    var lo = formatFreq(x.fMin), hi = formatFreq(x.fMax);
    return { single: x.fMin === x.fMax, lo: lo, hi: hi, same: lo.unit === hi.unit };
  }

  // ── what the page draws ──

  /** Packed once per category, over the whole axis. */
  var LANES = {};
  CATEGORIES.forEach(function (c) { LANES[c.id] = packLanes(c.techs); });

  function initial() {
    return {
      itu: ITU.filter(function (b) { return b.fMax > AXIS_MIN; }).map(function (b) {
        var a = frac(b.fMin), z = frac(b.fMax);
        return { id: b.id, x: a, w: z - a };
      }),
      ticks: TICKS.map(function (f) { return { f: f, x: frac(f) }; }),
      cards: CATEGORIES.map(function (c) {
        return {
          id: c.id, type: c.type, c: c.c, hatch: c.hatch, lanes: LANES[c.id].count,
          bars: c.techs.map(function (x) {
            var a = frac(x.fMin), z = frac(x.fMax);
            return { id: x.id, x: a, w: z - a, lane: LANES[c.id].lane[x.id], point: x.fMin === x.fMax };
          })
        };
      })
    };
  }

  var logic = {
    CATEGORIES: CATEGORIES, TYPES: TYPES, ITU: ITU, TECHS: TECHS, BY_ID: BY_ID, TICKS: TICKS, LANES: LANES,
    AXIS_MIN: AXIS_MIN, AXIS_MAX: AXIS_MAX, POINT_W: POINT_W, LANE_GAP: LANE_GAP,
    defaults: {}, steps: 0,
    frac: frac, packLanes: packLanes, formatFreq: formatFreq, rangeOf: rangeOf,
    initial: initial
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
