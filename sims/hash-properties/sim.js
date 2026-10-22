/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for hash-properties: two inputs A and B, their SHA-256 digests and the bits that differ; beside them a toy
   hash (the first 8 or 16 bits of SHA-256) over the messages "poruka 1" … "poruka n" and its first collision.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Rules and numbers: SPEC.md.
   SHA-256 is computed here (FIPS 180-4 §6.2) because Web Crypto is asynchronous and the model must be pure. */
(function (root) {
  'use strict';

  // ── SHA-256 (FIPS 180-4) ──

  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  var H0 = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

  /** The UTF-8 bytes of a string (code points; a lone surrogate becomes U+FFFD, as TextEncoder does). */
  function utf8(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
        var d = str.charCodeAt(i + 1);
        if (d >= 0xdc00 && d <= 0xdfff) { c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00); i++; }
      }
      if (c >= 0xd800 && c <= 0xdfff) c = 0xfffd;
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }

  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

  /** SHA-256 of a byte array, as 32 bytes. */
  function sha256Bytes(bytes) {
    var len = bytes.length;
    var msg = bytes.slice();
    msg.push(0x80);
    while (msg.length % 64 !== 56) msg.push(0);
    var bitsHi = Math.floor(len / 0x20000000), bitsLo = (len * 8) >>> 0;
    msg.push((bitsHi >>> 24) & 255, (bitsHi >>> 16) & 255, (bitsHi >>> 8) & 255, bitsHi & 255,
      (bitsLo >>> 24) & 255, (bitsLo >>> 16) & 255, (bitsLo >>> 8) & 255, bitsLo & 255);
    var h = H0.slice();
    var w = new Array(64);
    for (var off = 0; off < msg.length; off += 64) {
      for (var t = 0; t < 16; t++) {
        var j = off + 4 * t;
        w[t] = ((msg[j] << 24) | (msg[j + 1] << 16) | (msg[j + 2] << 8) | msg[j + 3]) >>> 0;
      }
      for (t = 16; t < 64; t++) {
        var s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        var s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (t = 0; t < 64; t++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var T1 = (hh + S1 + ch + K[t] + w[t]) >>> 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var T2 = (S0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + T1) >>> 0; d = c; c = b; b = a; a = (T1 + T2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }
    var out = [];
    h.forEach(function (x) { out.push((x >>> 24) & 255, (x >>> 16) & 255, (x >>> 8) & 255, x & 255); });
    return out;
  }

  function hex(bytes) {
    return bytes.map(function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join('');
  }

  /** SHA-256 of a string's UTF-8 bytes, as 64 lower-case hex characters. */
  function sha256(str) { return hex(sha256Bytes(utf8(str))); }

  /** The 256 bits of a hex digest: bytes left to right, most significant bit first (rule 6). */
  function bitsOf(hexDigest) {
    var out = [];
    for (var i = 0; i < hexDigest.length; i += 2) {
      var byte = parseInt(hexDigest.slice(i, i + 2), 16);
      for (var k = 7; k >= 0; k--) out.push((byte >> k) & 1);
    }
    return out;
  }

  /** Indices (ascending, rule-6 order) of the bits where two digests differ. */
  function diffIndices(hexA, hexB) {
    var a = bitsOf(hexA), b = bitsOf(hexB), out = [];
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) out.push(i);
    return out;
  }

  /** True when b is a one with exactly one character (code point) replaced, inserted or deleted. */
  function oneEditApart(a, b) {
    var x = Array.from(a), y = Array.from(b);
    if (Math.abs(x.length - y.length) > 1) return false;
    var i = 0;
    while (i < x.length && i < y.length && x[i] === y[i]) i++;
    if (i === x.length && i === y.length) return false;
    var j = 0;
    while (j < x.length - i && j < y.length - i && x[x.length - 1 - j] === y[y.length - 1 - j]) j++;
    return x.length - i - j <= 1 && y.length - i - j <= 1;
  }

  /** How A and the B that is hashed differ. Tie-break order: same, newline, one, more (SPEC.md, Inputs). */
  function editKind(a, b, newline) {
    var bb = b + (newline ? '\n' : '');
    if (a === bb) return 'same';
    if (newline && a === b) return 'newline';
    if (oneEditApart(a, bb)) return 'one';
    return 'more';
  }

  // ── the toy hash: the first toyBits bits of SHA-256("poruka i") ──

  var TOY_MAX = 600;
  var toyMemo = {};

  /** The message the toy hash is fed as number i. Data, the same string in both languages (the numbers depend on it). */
  function toyMessage(i) { return 'poruka ' + i; }

  /** Toy values of messages 1 … TOY_MAX for this width, computed once (a pure memo). */
  function toyValues(bits) {
    bits = Number(bits) === 16 ? 16 : 8;
    if (!toyMemo[bits]) {
      var vals = [];
      for (var i = 1; i <= TOY_MAX; i++) {
        var d = sha256Bytes(utf8(toyMessage(i)));
        vals.push(bits === 8 ? d[0] : (d[0] << 8) | d[1]);
      }
      toyMemo[bits] = vals;
    }
    return toyMemo[bits];
  }

  /** First collision among messages 1 … n: the smallest j whose value an earlier message i already had.
      Before j every value is new, so i is unique. Null when there is none. */
  function firstCollision(bits, n) {
    var vals = toyValues(bits), seen = {};
    for (var j = 1; j <= n; j++) {
      var v = vals[j - 1];
      if (seen[v]) return { i: seen[v], j: j, value: v };
      seen[v] = j;
    }
    return null;
  }

  /** Expected number of messages until the first collision of an n-bit hash: √(π/2 · 2^n) (birthday bound). */
  function expectedFirst(bits) { return Math.sqrt(Math.PI / 2 * Math.pow(2, bits)); }

  var logic = {
    defaults: { a: 'abc', b: 'abc', newline: false, toyBits: 8, toyCount: 30 },
    TOY_MAX: TOY_MAX,

    presets: [
      { id: 'abc', params: { a: 'abc', b: 'abc' } },
      { id: 'one-char', params: { a: 'abc', b: 'abd' } },
      { id: 'payment', params: { a: 'Plati 100 EUR', b: 'Plati 900 EUR' } },
      { id: 'empty', params: { a: '', b: 'Isti sažetak, dakle ista datoteka.' } },
      { id: 'newline', params: { a: 'abc', b: 'abc', newline: true } },
      { id: 'toy8', params: { toyBits: 8, toyCount: 22 } },
      { id: 'toy16', params: { toyBits: 16, toyCount: 449 } }
    ],

    /** The whole state; an explorer has no steps. */
    initial: function (p) {
      var b = p.b + (p.newline ? '\n' : '');
      var digestA = sha256(p.a), digestB = sha256(b);
      var diff = diffIndices(digestA, digestB);
      var n = Math.max(1, Math.min(TOY_MAX, Math.round(p.toyCount)));
      var vals = toyValues(p.toyBits).slice(0, n);
      var counts = {};
      vals.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; });
      var distinct = Object.keys(counts).length;
      var map = null;
      if (p.toyBits === 8) {
        map = [];
        for (var v = 0; v < 256; v++) map.push(counts[v] || 0);
      }
      return {
        a: p.a, b: b,
        bytesA: utf8(p.a).length, bytesB: utf8(b).length,
        digestA: digestA, digestB: digestB,
        diffBits: diff.length, diff: diff,
        edit: editKind(p.a, p.b, p.newline),
        toyBits: p.toyBits, toyInputs: n, toySize: Math.pow(2, p.toyBits),
        toyFirstCollision: firstCollision(p.toyBits, n),
        toyDistinct: distinct, toyRepeats: n - distinct,
        toyLast: { i: n, value: vals[n - 1] },
        toyExpected: Math.round(expectedFirst(p.toyBits)),
        toyMap: map
      };
    },

    /** Which half the caption speaks about: 'toy' after a change to the toy hash, else 'digest' (SPEC.md, Captions).
        With no previous params (page start) the defaults stand in, so a link that changes only toy params opens on toy. */
    nextFocus: function (focus, prev, params, preset, prevPreset) {
      if (preset && preset !== prevPreset) return preset === 'toy8' || preset === 'toy16' ? 'toy' : 'digest';
      if (!prev) prev = logic.defaults;
      var changed = Object.keys(params).filter(function (k) { return !Object.is(prev[k], params[k]); });
      if (!changed.length) return focus || 'digest';
      return changed.every(function (k) { return k === 'toyBits' || k === 'toyCount'; }) ? 'toy' : 'digest';
    },

    sha256: sha256,
    sha256Bytes: sha256Bytes,
    utf8: utf8,
    bitsOf: bitsOf,
    diffIndices: diffIndices,
    oneEditApart: oneEditApart,
    editKind: editKind,
    toyMessage: toyMessage,
    toyValues: toyValues,
    firstCollision: firstCollision,
    expectedFirst: expectedFirst,

    /** A toy value as hex with its width: 0x84, 0xaf50. */
    toyHex: function (v, bits) { var s = v.toString(16); while (s.length < bits / 4) s = '0' + s; return '0x' + s; }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
