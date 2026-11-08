/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for nominal-vs-actual: how framing overhead, a shared half-duplex medium and retries cut the nominal
   bandwidth of an Ethernet link down to the achieved throughput. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MIN_PAYLOAD = 46;     // B, Ethernet payload minimum; shorter packets are padded (SPEC rule 1)
  var ETH_HDR = 14;         // B, destination 6 + source 6 + type 2
  var FCS = 4;              // B
  var PREAMBLE = 8;         // B, preamble 7 + SFD 1
  var GAP = 12;             // B, interframe gap: 96 bit times (IEEE 802.3 §4.4.2, check)
  var IP_HDR = 20;          // B, IPv4 without options (RFC 791)
  var TCP_HDR = 20;         // B, TCP without options (RFC 9293)
  var EPS = 1e-6;           // bit/s; smaller differences are float noise

  var RATES = [10, 100, 1000];               // Mb/s
  var DUPLEX = ['full', 'half-both'];
  var UNITS = ['Mb/s', 'MB/s'];
  var KINDS = ['data', 'l34', 'l2', 'l1', 'share', 'retry'];

  var defaults = { rate: 100, packet: 1500, l1: true, l2: true, l34: true, duplex: 'full', stations: 1, loss: 0, unit: 'Mb/s' };

  function P(over) {
    var p = {};
    Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; });
    Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
    return p;
  }

  // from sims/delay-components/sim.js @ bf2e9b5 (delays(): transmission = L / R, L = 8 × bytes)
  /** Transmission delay of `bytes` on a link of `rateBps` bit/s, in seconds. */
  function transTime(bytes, rateBps) { return 8 * bytes / rateBps; }

  /** Senders taking turns on the medium (SPEC rules 4 and 5): max(2, n) on half duplex both ways, 1 on full. */
  function shareOf(p) { return p.duplex === 'half-both' ? Math.max(2, p.stations) : 1; }

  /** The frame's fields left to right, in bytes (SPEC rules 1–2). Zero-byte fields are left out. */
  function frameFields(p) {
    var P = p.packet;
    var pad = p.l2 ? Math.max(0, MIN_PAYLOAD - P) : 0;
    var hdr = p.l34 ? Math.min(P, IP_HDR + TCP_HDR) : 0;
    var ip = p.l34 ? Math.min(P, IP_HDR) : 0;
    var all = [
      { kind: 'l1', field: 'preamble', bytes: p.l1 ? PREAMBLE : 0 },
      { kind: 'l2', field: 'dst', bytes: p.l2 ? 6 : 0 },
      { kind: 'l2', field: 'src', bytes: p.l2 ? 6 : 0 },
      { kind: 'l2', field: 'type', bytes: p.l2 ? 2 : 0 },
      { kind: 'l34', field: 'ip', bytes: ip },
      { kind: 'l34', field: 'tcp', bytes: hdr - ip },
      { kind: 'data', field: 'data', bytes: P - hdr },
      { kind: 'l2', field: 'pad', bytes: pad },
      { kind: 'l2', field: 'fcs', bytes: p.l2 ? FCS : 0 },
      { kind: 'l1', field: 'gap', bytes: p.l1 ? GAP : 0 }
    ];
    return all.filter(function (f) { return f.bytes > 0; });
  }

  /** Everything the page shows, from the params alone (SPEC "State"). */
  function compute(p) {
    var R = p.rate * 1e6;
    var fields = frameFields(p);
    var bytesOf = function (kind) { return fields.reduce(function (a, f) { return f.kind === kind ? a + f.bytes : a; }, 0); };
    var wire = fields.reduce(function (a, f) { return a + f.bytes; }, 0);
    var data = bytesOf('data');
    var eff = data / wire;
    var k = shareOf(p);
    var loss = Math.min(Math.max(p.loss, 0), 100) / 100;
    var own = R / k;
    var kept = own * (1 - loss);
    var segments = [
      { kind: 'data', bits: kept * data / wire },
      { kind: 'l34', bits: kept * bytesOf('l34') / wire },
      { kind: 'l2', bits: kept * bytesOf('l2') / wire },
      { kind: 'l1', bits: kept * bytesOf('l1') / wire },
      { kind: 'share', bits: R - own },
      { kind: 'retry', bits: own * loss }
    ];
    var goodput = R * eff;
    var frameTime = transTime(wire, R);
    return {
      wireBytes: wire, dataBytes: data, padBytes: fields.reduce(function (a, f) { return f.field === 'pad' ? a + f.bytes : a; }, 0),
      efficiency: eff, share: k, loss: loss,
      goodputBps: goodput, perStationBps: goodput / k, achievedBps: goodput / k * (1 - loss),
      fps: 1 / frameTime, frameTime: frameTime,
      segments: segments, fields: fields
    };
  }

  /** Kinds whose bits differ between two states, in bar order (SPEC "Changed"). */
  function changed(before, now) {
    if (!before) return [];
    return now.segments.filter(function (x, i) { return Math.abs(x.bits - before.segments[i].bits) > EPS; })
      .map(function (x) { return x.kind; });
  }

  /** Which caption sentence fits the state (SPEC "Caption"); language-neutral, the page fills it. */
  function captionKey(p, s) {
    if (s.share > 2) return 'capShared';
    if (s.share === 2) return 'capDuplex';
    if (s.loss > 0) return 'capLoss';
    if (!p.l1 || !p.l2 || !p.l34) return 'capOff';
    return 'capTotal';
  }

  /** Mb/s → the unit shown (SPEC rule 7). */
  function inUnit(bps, unit) { return unit === 'MB/s' ? bps / 8e6 : bps / 1e6; }

  /** A number with `sig` significant digits as a language-neutral string, no exponent, zeros kept to that precision. */
  function sigText(v, sig) {
    if (!(Math.abs(v) >= 1e-9)) return '0';
    var r = Number(v.toPrecision(sig));               // rounding first: 9.9996 → 10.00, not 10.000
    var digits = Math.floor(Math.log10(Math.abs(r))) + 1;
    return r.toFixed(Math.min(9, Math.max(0, sig - digits)));
  }

  /** Presets (SPEC "Presets"): each on top of the defaults. */
  var presets = [
    { id: 'book-ex1', params: { rate: 100, packet: 1500 } },
    { id: 'book-ex4', params: { rate: 100, packet: 1500, loss: 7, unit: 'MB/s' } },
    { id: 'tiny-frames', params: { rate: 1000, packet: 46 } },
    { id: 'gigabit-full', params: { rate: 1000, packet: 1500 } },
    { id: 'shared-hub', params: { rate: 100, packet: 1500, duplex: 'half-both', stations: 3 } }
  ];

  var logic = {
    RATES: RATES, DUPLEX: DUPLEX, UNITS: UNITS, KINDS: KINDS, MIN_PAYLOAD: MIN_PAYLOAD,
    defaults: defaults,
    /** Explorer: no steps; the state is the breakdown of the current params. */
    initial: function (p) { return compute(p); },
    compute: compute, frameFields: frameFields, shareOf: shareOf, transTime: transTime, changed: changed,
    captionKey: captionKey, inUnit: inUnit, sigText: sigText, withDefaults: P, presets: presets
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
