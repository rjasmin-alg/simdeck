/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ethernet-frame: the fields of a basic (untagged) Ethernet frame, the 64 B minimum and the pad that reaches
   it, the 1500 B data limit, the length/type rule, the I/G bit of the destination, and the FCS (CRC-32 over destination
   through pad) sent by the sender and recomputed by the receiver, with one bit flipped in transit.
   Rules and numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   An explorer: no steps; the state is derived from the params. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // Rule 1: field sizes in octets (IEEE 802.3 Figure 3-1, URM ch07).
  var SIZE = { pre: 7, sfd: 1, dst: 6, src: 6, type: 2, fcs: 4 };
  var HEADER = SIZE.dst + SIZE.src + SIZE.type;   // 14
  var MIN_DATA = 46, MAX_DATA = 1500;              // rule 3
  var MIN_FRAME = HEADER + MIN_DATA + SIZE.fcs;    // 64
  var MAX_FRAME = HEADER + MAX_DATA + SIZE.fcs;    // 1518
  var PREAMBLE = SIZE.pre + SIZE.sfd;              // 8, not counted (rule 2)
  var PAYLOAD_UI_MAX = 1600;                       // the slider goes past 1500 so rule 5 can be reached
  var TYPE_MIN = 0x0600;                           // rule 6: 1536 and up is an EtherType

  /** Destination choices (rule 9) and the fixed source; AC-DE-48 is the IEEE's own example OUI. */
  var DST = {
    unicast: [0xAC, 0xDE, 0x48, 0x23, 0x45, 0x67],
    broadcast: [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF],
    multicast: [0x01, 0x00, 0x5E, 0x00, 0x00, 0x01]
  };
  var SRC = [0xAC, 0xDE, 0x48, 0x00, 0x00, 0x80];
  /** EtherType values (rule 6). */
  var ETHERTYPE = { ipv4: 0x0800, arp: 0x0806, ipv6: 0x86DD };

  var defaults = { payload: 28, type: 'ipv4', dst: 'unicast', flip: -1 };

  var presets = [
    { id: 'arp-request', params: { payload: 28, type: 'arp', dst: 'broadcast', flip: -1 } },
    { id: 'exact-minimum', params: { payload: 46, type: 'ipv4', dst: 'unicast', flip: -1 } },
    { id: 'tcp-ack', params: { payload: 40, type: 'ipv4', dst: 'unicast', flip: -1 } },
    { id: 'full-frame', params: { payload: 1500, type: 'ipv4', dst: 'unicast', flip: -1 } },
    { id: 'bit-flip', params: { payload: 1500, type: 'ipv4', dst: 'unicast', flip: 8000 } },
    { id: 'too-big', params: { payload: 1501, type: 'ipv4', dst: 'unicast', flip: -1 } }
  ];

  // ── CRC-32 (rule 7): the reflected IEEE polynomial 0xEDB88320, init and final XOR 0xFFFFFFFF (as zlib) ──
  var TABLE = (function () {
    var t = [];
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t.push(c >>> 0);
    }
    return t;
  })();
  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  /** The content of n octets of data: a fixed pattern, so the FCS depends only on the params. */
  function payloadBytes(n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push((i * 29 + 7) & 0xFF);
    return out;
  }

  /** Rule 4: pad octets for n octets of data. */
  function padFor(n) { return Math.max(0, MIN_DATA - n); }

  /** Rule 6: what a length/type value means. 1501–1535 is neither (a tie-break the task leaves open; SPEC.md). */
  function lengthType(v) {
    if (v >= TYPE_MIN) return 'type';
    if (v <= MAX_DATA) return 'length';
    return 'undefined';
  }

  /** Rule 9: broadcast (all ones) first, then the I/G bit (lowest bit of the first octet). */
  function addrKind(a) {
    if (a.every(function (b) { return b === 0xFF; })) return 'broadcast';
    return a[0] & 1 ? 'multicast' : 'unicast';
  }

  function macText(a) {
    return a.map(function (b) { return (b < 16 ? '0' : '') + b.toString(16).toUpperCase(); }).join('-');
  }
  function hex32(v) { return v === null ? null : '0x' + ('0000000' + v.toString(16).toUpperCase()).slice(-8); }

  /** Counted fields in order with their octet offsets from the destination address (rule 2). */
  function layout(n) {
    var pad = n > MAX_DATA ? 0 : padFor(n);
    var spec = [['dst', SIZE.dst], ['src', SIZE.src], ['type', SIZE.type], ['data', n], ['pad', pad], ['fcs', SIZE.fcs]];
    var at = 0;
    return spec.map(function (f) {
      var x = { id: f[0], bytes: f[1], from: at };
      at += f[1];
      return x;
    });
  }

  /** The field an octet offset falls into (pad of 0 octets is never hit). */
  function fieldAt(fields, octet) {
    for (var i = 0; i < fields.length; i++) if (octet >= fields[i].from && octet < fields[i].from + fields[i].bytes) return fields[i].id;
    return null;
  }

  /** The derived state for one set of params (SPEC.md "State"). */
  function derive(p) {
    var n = p.payload;
    var dst = DST[p.dst], type = ETHERTYPE[p.type];
    var fields = layout(n);
    var tooLong = n > MAX_DATA;
    var padLen = tooLong ? 0 : padFor(n);
    var frameLen = HEADER + n + padLen + SIZE.fcs;
    var s = {
      dst: macText(dst), dstKind: addrKind(dst), src: macText(SRC), srcKind: addrKind(SRC),
      type: type, typeHex: '0x' + ('000' + type.toString(16).toUpperCase()).slice(-4), typeKind: lengthType(type),
      payloadLen: n, padLen: padLen, frameLen: frameLen, wireLen: frameLen + PREAMBLE,
      fields: fields, coveredBits: (HEADER + n + padLen) * 8,
      flipBit: null, flipField: null, fcsSent: null, fcsRecv: null, verdict: 'ok'
    };
    if (tooLong) { s.verdict = 'too-long'; return s; }           // rule 5: refused, not sent, no FCS

    var bytes = dst.concat(SRC, [type >> 8, type & 0xFF], payloadBytes(n));
    for (var i = 0; i < padLen; i++) bytes.push(0);                // rule 4: pad of zeros after the data
    var sent = crc32(bytes);                                       // rule 7: destination through pad
    var recv = sent;
    if (p.flip >= 0) {
      var k = Math.min(Math.floor(p.flip), s.coveredBits - 1);     // past the end: the last covered bit
      var got = bytes.slice();
      got[k >> 3] ^= 0x80 >> (k & 7);
      recv = crc32(got);
      s.flipBit = k;
      s.flipField = fieldAt(fields, k >> 3);
    }
    s.fcsSent = hex32(sent);
    s.fcsRecv = hex32(recv);
    if (recv !== sent) s.verdict = 'fcs-error';
    return s;
  }

  /** Fields whose size or value changed from `before` to `now` ("changed" in the legend); "recv" is the check. */
  function changed(before, now) {
    if (!before) return [];
    var out = [];
    var size = function (s, id) { return s.fields.filter(function (f) { return f.id === id; })[0].bytes; };
    if (before.dst !== now.dst) out.push('dst');
    if (before.type !== now.type) out.push('type');
    if (size(before, 'data') !== size(now, 'data')) out.push('data');
    if (size(before, 'pad') !== size(now, 'pad')) out.push('pad');
    if (before.fcsSent !== now.fcsSent) out.push('fcs');
    if (before.fcsRecv !== now.fcsRecv) out.push('recv');   // a new flip or verdict always changes the recomputed FCS
    return out;
  }

  var logic = {
    defaults: defaults,
    presets: presets,
    /** Explorer: no steps; the state is derived from the params. */
    initial: function (p) { return derive(p); },
    derive: derive, changed: changed, crc32: crc32, payloadBytes: payloadBytes, padFor: padFor,
    lengthType: lengthType, addrKind: addrKind, macText: macText, layout: layout,
    SIZE: SIZE, HEADER: HEADER, MIN_DATA: MIN_DATA, MAX_DATA: MAX_DATA, MIN_FRAME: MIN_FRAME, MAX_FRAME: MAX_FRAME,
    PREAMBLE: PREAMBLE, PAYLOAD_UI_MAX: PAYLOAD_UI_MAX, TYPE_MIN: TYPE_MIN, DST: DST, SRC: SRC, ETHERTYPE: ETHERTYPE
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
