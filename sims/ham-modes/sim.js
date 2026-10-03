/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the ham radio modes reference: 27 analog and digital modes in six groups, each with its ITU emission
   class, its bandwidth on a common log axis (1 Hz to 100 MHz) and the filter categories of the original. The emission
   class is decoded symbol by symbol and, where the necessary bandwidth is one number, written as a full designation
   (2K70J3E), both after ITU Radio Regulations Appendix 1. A reference page: no steps and no params.
   Adopted from single-page-labs/ham-radio-modes-reference-v2.html (modes, groups, categories, bands, bandwidths);
   see NOTES.md for what changed.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // ── data (names, notes and table rows are in strings.js under n_<id>, s_<id>, d_<id>, v_<id>_<row>) ──

  /** The original's six groups, in its order; `kind` is its two headings, analog and digital. */
  var GROUPS = [
    { id: 'voice', kind: 'analog' }, { id: 'image', kind: 'analog' }, { id: 'weak', kind: 'digital' },
    { id: 'hftext', kind: 'digital' }, { id: 'vhfdigi', kind: 'digital' }, { id: 'packet', kind: 'digital' }
  ];

  /** The original's filter buttons, in its order (after "all"). */
  var CATS = ['voice', 'digi', 'image', 'weak', 'emg'];

  /** Modes in the original's order. cats: filter categories; bands: the original's band tags; cls: ITU emission
      classes (null where none is given); bw: bandwidth in Hz as [low, high] (null where the original gives none);
      nb: necessary bandwidth in Hz for the full designation, given only where it is checked (NOTES.md); rows: the keys of the detail
      table, in order; note: whether the mode has a note under its table. */
  var MODES = [
    { id: 'ssb', group: 'voice', cats: ['voice'], bands: ['HF'], cls: ['J3E'], bw: [2700, 2700], nb: 2700, rows: ['bands', 'gain', 'pol'], note: true },
    { id: 'am', group: 'voice', cats: ['voice'], bands: ['HF'], cls: ['A3E'], bw: [6000, 6000], nb: 6000, rows: ['index', 'eff'] },
    { id: 'cw', group: 'voice', cats: ['weak'], bands: ['HF', 'VHF'], cls: ['A1A'], bw: [100, 500], nb: 100, rows: ['gain', 'speed'], note: true },
    { id: 'fm', group: 'voice', cats: ['voice'], bands: ['VHF', 'UHF'], cls: ['F3E'], bw: [11000, 16000], nb: 16000, rows: ['dev', 'spacing', 'offset'] },
    { id: 'isb', group: 'voice', cats: ['voice'], bands: ['HF'], cls: ['B8E', 'B9W'], bw: null, rows: ['related', 'use'] },

    { id: 'sstv', group: 'image', cats: ['image'], bands: ['HF', 'VHF'], cls: ['J3F'], bw: [3000, 3000], rows: ['time', 'res'] },
    { id: 'atv', group: 'image', cats: ['image'], bands: ['UHF'], cls: ['C3F', 'F3F'], bw: [5e6, 8e6], rows: ['bands'] },
    { id: 'fax', group: 'image', cats: ['image'], bands: ['HF'], cls: ['F3C'], bw: [3000, 3000], rows: ['lpm', 'tones'] },

    { id: 'ft8', group: 'weak', cats: ['digi', 'weak'], bands: ['HF', 'VHF'], cls: ['J2D'], bw: [50, 50], rows: ['mod', 'snr', 'slot', 'sync', 'msg'], note: true },
    { id: 'jt65', group: 'weak', cats: ['digi', 'weak'], bands: ['HF', 'VHF'], cls: ['J2D'], bw: [16, 178], rows: ['jt65bw', 'jt9bw', 'snr', 'cycle', 'fec'] },
    { id: 'wspr', group: 'weak', cats: ['digi', 'weak'], bands: ['HF'], cls: ['J2D'], bw: [6, 6], rows: ['snr', 'msg', 'cycle'] },

    { id: 'rtty', group: 'hftext', cats: ['digi'], bands: ['HF'], cls: ['F1B', 'J2B'], bw: [250, 250], rows: ['speed', 'coding', 'fec'] },
    { id: 'psk', group: 'hftext', cats: ['digi'], bands: ['HF'], cls: ['J2B'], bw: [31, 63], rows: ['psk31bw', 'psk63bw', 'mod', 'coding'] },
    { id: 'olivia', group: 'hftext', cats: ['digi'], bands: ['HF'], cls: null, bw: [125, 2000], rows: ['fec', 'popular'] },
    { id: 'js8', group: 'hftext', cats: ['digi', 'emg'], bands: ['HF'], cls: null, bw: [50, 50], rows: ['snr', 'funcs', 'use'] },
    { id: 'thor', group: 'hftext', cats: ['digi'], bands: ['HF'], cls: null, bw: null, rows: ['thor22bw', 'speed', 'tones'] },
    { id: 'email', group: 'hftext', cats: ['digi', 'emg'], bands: ['HF', 'VHF'], cls: null, bw: [500, 2300], rows: ['pactorbw', 'ofdmbw', 'transport', 'proto'] },

    { id: 'dstar', group: 'vhfdigi', cats: ['digi', 'voice'], bands: ['VHF', 'UHF'], cls: null, bw: [6250, 6250], rows: ['mod', 'vocoder', 'dd', 'slowdata', 'routing'] },
    { id: 'dmr', group: 'vhfdigi', cats: ['digi', 'voice'], bands: ['VHF', 'UHF'], cls: null, bw: [12500, 12500], rows: ['mod', 'slot', 'vocoder', 'tier2', 'tier3'] },
    { id: 'c4fm', group: 'vhfdigi', cats: ['digi', 'voice'], bands: ['VHF', 'UHF'], cls: null, bw: [12500, 12500], rows: ['mod', 'vocoder', 'vw'] },
    { id: 'p25', group: 'vhfdigi', cats: ['digi', 'voice'], bands: ['VHF', 'UHF'], cls: null, bw: [6250, 12500], rows: ['ph1', 'ph2', 'vocoder'] },

    { id: 'aprs', group: 'packet', cats: ['digi', 'emg'], bands: ['VHF'], cls: ['F2D'], bw: null, rows: ['mod', 'speed', 'proto', 'freq'], note: true },
    { id: 'packet', group: 'packet', cats: ['digi', 'emg'], bands: ['VHF', 'UHF'], cls: null, bw: null, rows: ['r1200', 'r9600', 'frame'] },
    { id: 'ipnet', group: 'packet', cats: ['digi', 'emg'], bands: ['UHF', 'SHF'], cls: null, bw: [5e6, 2e7], rows: ['freq', 'routing'], note: true },
    { id: 'datv', group: 'packet', cats: ['digi', 'image'], bands: ['UHF', 'SAT'], cls: null, bw: null, rows: ['std', 'codec', 'qo100wb', 'sr'] },
    { id: 'lora', group: 'packet', cats: ['digi', 'emg'], bands: ['UHF'], cls: null, bw: [125000, 500000], rows: ['mod', 'sf', 'payload', 'snr'] },
    { id: 'sat', group: 'packet', cats: ['digi', 'voice'], bands: ['SAT', 'UHF'], cls: null, bw: null, rows: ['qo100nb', 'transponder', 'doppler'] }
  ];

  var BY_ID = {};
  MODES.forEach(function (m) { BY_ID[m.id] = m; });

  // ── ITU emission classes (Radio Regulations, Appendix 1, §2–§4): three symbols ──

  /** First symbol: how the main carrier is modulated. Second: the nature of the modulating signal. Third: the type of
      information. Only the symbols listed here are known; the page names each in strings.js as e1_<s>, e2_<s>, e3_<s>. */
  var EMISSION = [
    ['N', 'A', 'H', 'R', 'J', 'B', 'C', 'F', 'G', 'D', 'P', 'K', 'L', 'M', 'Q', 'V', 'W', 'X'],
    ['0', '1', '2', '3', '7', '8', '9', 'X'],
    ['N', 'A', 'B', 'C', 'D', 'E', 'F', 'W', 'X']
  ];

  /** Splits an emission class like "J3E" into its three symbols. Returns null for anything that is not three known
      symbols, so a typo in the data shows up in the tests instead of on the page. */
  function decodeEmission(cls) {
    if (typeof cls !== 'string' || cls.length !== 3) return null;
    var out = [];
    for (var i = 0; i < 3; i++) {
      if (EMISSION[i].indexOf(cls.charAt(i)) < 0) return null;
      out.push({ pos: i + 1, sym: cls.charAt(i) });
    }
    return out;
  }

  /** Necessary bandwidth as the four characters of RR Appendix 1 §1: three significant figures with the unit letter
      (H, K, M, G) in place of the decimal point, rounded half up: 400 Hz → 400H, 2.7 kHz → 2K70, 12.5 kHz → 12K5,
      180.5 kHz → 181K, 0.1 Hz → H100. Valid from 0.001 Hz to under 1000 GHz. */
  function designator(hz) {
    var units = [['H', 1], ['K', 1e3], ['M', 1e6], ['G', 1e9]];
    var u = units[0];
    for (var i = units.length - 1; i >= 0; i--) {
      if (hz >= units[i][1] * (1 - 5e-4)) { u = units[i]; break; }
    }
    var v = hz / u[1];
    // Three significant figures. The unit switches at 999.5 of the smaller one, so a value never rounds up to 1000.
    var digits = v >= 99.95 ? 0 : v >= 9.995 ? 1 : v >= 0.9995 ? 2 : 3;
    var s = (Math.round(v * Math.pow(10, digits) + 1e-9) / Math.pow(10, digits)).toFixed(digits);
    if (digits === 3) s = s.replace(/^0/, ''); // 0.100 → .100 → H100
    if (s.indexOf('.') < 0) return s + u[0];
    return s.replace('.', u[0]);
  }

  /** The full designations of a mode (necessary bandwidth + class), for modes with a class and a checked `nb`. A
      mode's bandwidth is not used for this: a channel width or a filter is not the necessary bandwidth. */
  function designations(m) {
    if (!m.cls || !m.nb) return [];
    return m.cls.map(function (c) { return designator(m.nb) + c; });
  }

  // ── bandwidth: as text, and on a common log axis ──

  var AXIS_MIN = 1;    // Hz
  var AXIS_MAX = 1e8;  // Hz
  var TICKS = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8];

  /** Position of a bandwidth on the axis: 0 at 1 Hz, 1 at 100 MHz, clamped. */
  function frac(hz) {
    var x = (Math.log10(Math.max(hz, AXIS_MIN)) - Math.log10(AXIS_MIN)) / (Math.log10(AXIS_MAX) - Math.log10(AXIS_MIN));
    return Math.min(1, x);
  }

  /** A bandwidth in Hz as { num, unit }: Hz under 1 kHz, kHz under 1 MHz, else MHz; at most 3 decimals, trailing
      zeros dropped. `num` uses a point; the page writes a decimal comma in Croatian. */
  function formatHz(hz) {
    var unit = 'Hz', v = hz;
    if (hz >= 1e6) { unit = 'MHz'; v = hz / 1e6; } else if (hz >= 1e3) { unit = 'kHz'; v = hz / 1e3; }
    var s = v.toFixed(3);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return { num: s, unit: unit };
  }

  /** A bandwidth range as parts: { single, lo, hi, same } with lo and hi from formatHz. */
  function rangeOf(bw) {
    var lo = formatHz(bw[0]), hi = formatHz(bw[1]);
    return { single: bw[0] === bw[1], lo: lo, hi: hi, same: lo.unit === hi.unit };
  }

  // ── Doppler shift on a low-orbit satellite pass (the satellites card) ──

  var C_KMS = 299792.458;
  /** Orbital speed of a low-orbit satellite, km/s: the upper bound of its speed towards or away from the station. */
  var LEO_KMS = 7.5;

  /** The largest Doppler shift in kHz at a frequency in MHz: f · v / c. */
  function dopplerKHz(fMHz, vKms) {
    return fMHz * 1e3 * (vKms == null ? LEO_KMS : vKms) / C_KMS;
  }

  // ── filters ──

  /** The modes a filter keeps, in page order: every mode for 'all', else those carrying the category. */
  function filterModes(cat) {
    return MODES.filter(function (m) { return cat === 'all' || m.cats.indexOf(cat) >= 0; }).map(function (m) { return m.id; });
  }

  // ── what the page draws ──

  function initial() {
    return {
      groups: GROUPS.map(function (g) {
        return { id: g.id, kind: g.kind, modes: MODES.filter(function (m) { return m.group === g.id; }).map(function (m) { return m.id; }) };
      }),
      ticks: TICKS.map(function (f) { return { f: f, x: frac(f) }; }),
      bars: MODES.filter(function (m) { return m.bw; }).map(function (m) {
        var a = frac(m.bw[0]), z = frac(m.bw[1]);
        return { id: m.id, x: a, w: z - a, point: m.bw[0] === m.bw[1] };
      })
    };
  }

  var logic = {
    GROUPS: GROUPS, CATS: CATS, MODES: MODES, BY_ID: BY_ID, EMISSION: EMISSION, TICKS: TICKS,
    AXIS_MIN: AXIS_MIN, AXIS_MAX: AXIS_MAX, LEO_KMS: LEO_KMS,
    defaults: {}, steps: 0,
    decodeEmission: decodeEmission, designator: designator, designations: designations,
    frac: frac, formatHz: formatHz, rangeOf: rangeOf, dopplerKHz: dopplerKHz, filterModes: filterModes,
    initial: initial
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
