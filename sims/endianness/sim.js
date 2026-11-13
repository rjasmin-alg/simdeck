/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for endianness: one value (16 or 32 bits, or the 4-byte text "HTTP") written to memory at 0x1000… in
   big-endian and little-endian order, sent on the wire in network byte order (big-endian), and read back by a
   program on a host of the chosen order, with or without ntohl / ntohs. Rules and numbers: SPEC.md.
   An explorer: the state is derived from the params, no steps.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** The first address of the strips (task: 0x1000…0x1003). */
  var BASE = 0x1000;

  /**
   * The values the select offers. `num` is a multi-byte integer, `text` a byte string (ASCII, one byte per char).
   * 'typed' takes its digits from params.hex (the page's stage field).
   */
  var VALUES = {
    ipv4: { num: 0xAC10051E },      // 172.16.5.30, URM ch08 Primjer 1
    port443: { num: 0x01BB },       // 443
    textbook: { num: 0x0A0B0C0D },  // the usual teaching value
    one: { num: 0x00000001 },       // 1
    http: { text: 'HTTP' },         // rule 5: a byte string
    typed: { typed: true }          // hex digits from the stage field
  };
  var VALUE_IDS = Object.keys(VALUES);
  var WIDTHS = [16, 32];
  var HOSTS = ['little', 'big'];
  /** Hex digits the stage field keeps (32 bits). */
  var MAX_DIGITS = 8;

  var defaults = { width: 32, value: 'ipv4', host: 'little', convert: true, hex: '' };

  function P(p) { return Object.assign({}, defaults, p || {}); }

  /** The stage field's text → at most 8 upper-case hex digits (anything else is dropped; a leading 0x too). */
  function cleanHex(s) {
    return String(s == null ? '' : s).replace(/^\s*0[xX]/, '').replace(/[^0-9a-fA-F]/g, '').slice(0, MAX_DIGITS).toUpperCase();
  }

  /** The number a value id stands for (before the width is applied); null for a byte string. */
  function numberOf(p) {
    var v = VALUES[p.value] || VALUES[defaults.value];
    if (v.text) return null;
    if (v.typed) { var h = cleanHex(p.hex); return h ? parseInt(h, 16) : 0; }
    return v.num;
  }

  /** v's bytes, most significant first (big-endian order), for a width of 8·n bits. */
  function bytesOf(v, width) {
    var n = width / 8, out = [];
    for (var i = n - 1; i >= 0; i--) out.push(Math.floor(v / Math.pow(256, i)) % 256);
    return out;
  }

  /** The integer whose bytes, most significant first, are `bytes`. */
  function valueOf(bytes) {
    return bytes.reduce(function (acc, b) { return acc * 256 + b; }, 0);
  }

  /**
   * Rule 4: load `mem` (bytes at increasing addresses) as one integer on a host of the given order. A big-endian host
   * takes the lowest address as the most significant byte; a little-endian host as the least.
   * Bytes are moved whole: the bits inside a byte never change.
   */
  function load(mem, host) {
    return valueOf(host === 'big' ? mem.slice() : mem.slice().reverse());
  }

  /** Rule 1: store v at increasing addresses in the given order. */
  function store(v, width, order) {
    var be = bytesOf(v, width);
    return order === 'big' ? be : be.slice().reverse();
  }

  /** Swap the bytes of v (what ntohl / ntohs do on a little-endian host). */
  function swap(v, width) { return valueOf(bytesOf(v, width).reverse()); }

  /** Rule 3: ntohl / ntohs on a host: a byte swap on a little-endian host, nothing on a big-endian one. */
  function ntoh(v, width, host) { return host === 'big' ? v : swap(v, width); }
  /** htonl / htons: the same swap (it is its own inverse). */
  function hton(v, width, host) { return ntoh(v, width, host); }

  /** 32-bit value as four decimal octets, most significant first (an IPv4 address in dotted notation). */
  function dottedOf(v) { return bytesOf(v, 32).join('.'); }

  /**
   * Significance of each byte in `order` (0 = most significant of the written value), so the page can colour a byte
   * the same in every row ("a byte's colour follows the byte").
   */
  function sigOf(n, order) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(order === 'big' ? i : n - 1 - i);
    return out;
  }

  function derive(params) {
    var p = P(params);
    var width = WIDTHS.indexOf(p.width) >= 0 ? p.width : defaults.width;
    var host = HOSTS.indexOf(p.host) >= 0 ? p.host : defaults.host;
    var def = VALUES[p.value] || VALUES[defaults.value];
    var s;
    if (def.text) {
      // Rule 5: one byte per character, the same at every address in every order; no conversion applies.
      var bytes = def.text.split('').map(function (ch) { return ch.charCodeAt(0); });
      var pos = bytes.map(function (b, i) { return i; });
      s = {
        width: bytes.length * 8, text: def.text, value: null, full: null, cut: false,
        bytesBE: bytes.slice(), bytesLE: bytes.slice(), wire: bytes.slice(), hostOrder: host, hostBytes: bytes.slice(),
        sigBE: pos.slice(), sigLE: pos.slice(), sigWire: pos.slice(),
        readAs: { withConversion: null, withoutConversion: null }, convert: false, read: null, readBytes: bytes.slice(),
        sigRead: pos.slice(), differs: false, fn: null, dotted: null, dottedRead: null, dottedOther: null
      };
      return s;
    }
    var full = numberOf(p);
    var n = width / 8;
    var value = full % Math.pow(2, width);
    var bytesBE = store(value, width, 'big');
    var bytesLE = store(value, width, 'little');
    // Rule 2: the sender converts with htonl / htons, so the wire carries the most significant byte first.
    var wire = bytesBE.slice();
    // The receiver's buffer holds the wire bytes at increasing addresses; a raw load reads them in host order.
    var raw = load(wire, host);
    var converted = ntoh(raw, width, host);
    var read = p.convert ? converted : raw;
    var sigRead = p.convert || host === 'big' ? sigOf(n, 'big') : sigOf(n, 'little');
    s = {
      width: width, text: null, value: value, full: full, cut: full !== value,
      bytesBE: bytesBE, bytesLE: bytesLE, wire: wire, hostOrder: host,
      hostBytes: host === 'big' ? bytesBE.slice() : bytesLE.slice(),
      sigBE: sigOf(n, 'big'), sigLE: sigOf(n, 'little'), sigWire: sigOf(n, 'big'),
      readAs: { withConversion: converted, withoutConversion: raw },
      convert: !!p.convert, read: read, readBytes: bytesOf(read, width), sigRead: sigRead,
      differs: converted !== raw, fn: width === 32 ? 'ntohl' : 'ntohs',
      dotted: width === 32 ? dottedOf(value) : null,
      dottedRead: width === 32 ? dottedOf(read) : null,
      dottedOther: width === 32 ? dottedOf(p.convert ? raw : converted) : null
    };
    return s;
  }

  /**
   * Legend "Changed": the reader row is marked when the last input flipped only the conversion toggle and the value
   * the program reads changed with it. No params before → nothing.
   */
  function readerChanged(before, now) {
    if (!before) return false;
    var a = P(before), b = P(now);
    var others = Object.keys(defaults).filter(function (k) { return k !== 'convert'; });
    if (a.convert === b.convert) return false;
    if (others.some(function (k) { return a[k] !== b[k]; })) return false;
    return derive(a).read !== derive(b).read;
  }

  var presets = [
    { id: 'ipv4-address', params: { width: 32, value: 'ipv4', host: 'little', convert: false } },
    { id: 'port-443', params: { width: 16, value: 'port443', host: 'little', convert: false } },
    { id: 'textbook', params: { width: 32, value: 'textbook', host: 'little', convert: true } },
    { id: 'text', params: { width: 32, value: 'http', host: 'little', convert: true } },
    { id: 'big-host', params: { width: 32, value: 'ipv4', host: 'big', convert: true } }
  ];

  var logic = {
    BASE: BASE, VALUES: VALUES, VALUE_IDS: VALUE_IDS, WIDTHS: WIDTHS, HOSTS: HOSTS, MAX_DIGITS: MAX_DIGITS,
    defaults: defaults,
    /** Explorer: no steps; the state is derived from the params. */
    initial: function (p) { return derive(p); },
    derive: derive, cleanHex: cleanHex, numberOf: numberOf, bytesOf: bytesOf, valueOf: valueOf, load: load,
    store: store, swap: swap, ntoh: ntoh, hton: hton, dottedOf: dottedOf, sigOf: sigOf, readerChanged: readerChanged,
    withDefaults: P, presets: presets
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
