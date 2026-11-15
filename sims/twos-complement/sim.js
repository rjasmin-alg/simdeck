/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for twos-complement: two n-bit operands go through one ripple-carry adder; the same result bits are read
   unsigned, signed (two's complement) and in hex, and the four flags N, Z, C, V say which reading wrapped.
   Rules and numbers: SPEC.md (Patterson & Hennessy, Computer Organization and Design, §2.4 and §3.2; the processor
   manuals' flag definitions).
   An explorer: the state is derived from the params, no steps. Values stay below 2^17, so plain Numbers are exact.
   Pure: no DOM, no Math.random, no Date, no timers.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var WIDTHS = [4, 8, 16];
  var VIEWS = ['signed', 'unsigned', 'both'];

  var defaults = { width: 8, a: 100, b: 50, view: 'both' };

  function P(p) { return Object.assign({}, defaults, p || {}); }

  /** A width the model knows (4, 8 or 16); anything else falls back to the default. */
  function widthOf(w) { w = Number(w); return WIDTHS.indexOf(w) >= 0 ? w : defaults.width; }
  function viewOf(v) { return VIEWS.indexOf(v) >= 0 ? v : defaults.view; }

  /** Rule 1: the signed range of n bits, −2^(n−1) … 2^(n−1) − 1. */
  function rangeOf(n) { var h = Math.pow(2, n - 1); return { min: -h, max: h - 1 }; }

  /** Rule 7: an operand is a signed integer in range; non-numbers become 0, fractions round (halves up), the rest is clamped. */
  function clamp(x, n) {
    var r = rangeOf(n);
    x = Math.round(Number(x));
    if (!isFinite(x) || x === 0) x = 0;   // NaN and −0 become 0 (Math.round(−0.4) is −0)
    return Math.min(r.max, Math.max(r.min, x));
  }

  /** The bit pattern of a signed value as an unsigned number 0 … 2^n − 1 (x mod 2^n). */
  function unsignedOf(x, n) { var m = Math.pow(2, n); return ((x % m) + m) % m; }

  /** Rule 1: the same pattern read as two's complement: −b(n−1)·2^(n−1) + Σ bᵢ·2ⁱ. */
  function signedOf(u, n) { var h = Math.pow(2, n - 1); return u >= h ? u - 2 * h : u; }

  /** Bits of an unsigned pattern, most significant first. */
  function bitsOf(u, n) {
    var out = [];
    for (var i = n - 1; i >= 0; i--) out.push(Math.floor(u / Math.pow(2, i)) % 2);
    return out;
  }

  /** The value of bits (most significant first), by the rule-1 weights: the top bit's weight is −2^(n−1). */
  function valueOfBits(bits) {
    var n = bits.length, v = 0;
    for (var k = 0; k < n; k++) v += bits[k] * weightOf(n - 1 - k, n);
    return v;
  }

  /** Rule 1: the weight of bit i (0 = least significant). */
  function weightOf(i, n) { return i === n - 1 ? -Math.pow(2, i) : Math.pow(2, i); }

  /** The weights, most significant first: −128, 64, 32 … 1 for n = 8. */
  function weights(n) { var out = []; for (var i = n - 1; i >= 0; i--) out.push(weightOf(i, n)); return out; }

  /** Hex digits of an unsigned pattern, n / 4 of them, upper case. */
  function hexOf(u, n) {
    var s = u.toString(16).toUpperCase();
    while (s.length < n / 4) s = '0' + s;
    return s;
  }

  /**
   * Rule 2: the ripple-carry adder, one column at a time from bit 0. Returns the sum bits and carries[k], the carry
   * INTO column k (most significant first, so carries[n − 1], into bit 0, is 0), and carryOut, out of the top bit.
   */
  function ripple(aBits, bBits) {
    var n = aBits.length, sum = new Array(n), carries = new Array(n), c = 0;
    for (var k = n - 1; k >= 0; k--) {
      carries[k] = c;
      var t = aBits[k] + bBits[k] + c;
      sum[k] = t % 2;
      c = t >= 2 ? 1 : 0;
    }
    return { sum: sum, carries: carries, carryOut: c };
  }

  /**
   * Rule 6: −x = (~x) + 1 in n bits. `overflow` is the edge case −(−2^(n−1)), whose answer +2^(n−1) does not fit, so
   * the pattern comes back unchanged (and V would be set: ~x + 1 adds two positives, 0111 1111 + 1).
   */
  function negate(x, n) {
    x = clamp(x, n);
    var m = Math.pow(2, n), u = unsignedOf(x, n);
    var inv = m - 1 - u;
    var r = (inv + 1) % m;
    return { bits: bitsOf(u, n), inverted: bitsOf(inv, n), resultBits: bitsOf(r, n), value: signedOf(r, n), overflow: x === rangeOf(n).min };
  }

  /** The value after clicking bit i (0 = least significant) of x: the pattern with that bit flipped, read signed. */
  function flipBit(x, i, n) {
    x = clamp(x, n);
    var u = unsignedOf(x, n), p = Math.pow(2, i);
    var bit = Math.floor(u / p) % 2;
    return signedOf(bit ? u - p : u + p, n);
  }

  /** Indices (most significant first) where two bit arrays differ; none when there is no previous array or the widths differ. */
  function changedBits(prev, cur) {
    var out = [];
    if (!prev || !cur || prev.length !== cur.length) return out;
    for (var k = 0; k < cur.length; k++) if (prev[k] !== cur[k]) out.push(k);
    return out;
  }

  /** The flags that differ between two states' flag sets (for the "changed" mark). */
  function changedFlags(prev, cur) {
    var out = [];
    if (!prev || !cur) return out;
    ['N', 'Z', 'C', 'V'].forEach(function (f) { if (prev[f] !== cur[f]) out.push(f); });
    return out;
  }

  /** The state: everything the page draws, from the params. */
  function derive(params) {
    var p = P(params);
    var n = widthOf(p.width);
    var a = clamp(p.a, n), b = clamp(p.b, n);
    var au = unsignedOf(a, n), bu = unsignedOf(b, n);
    var aBits = bitsOf(au, n), bBits = bitsOf(bu, n);
    var add = ripple(aBits, bBits);
    var ru = 0;
    for (var k = 0; k < n; k++) ru = ru * 2 + add.sum[k];
    var r = signedOf(ru, n);
    var range = rangeOf(n);
    // Rule 4, the definition: both operands have the same sign and the result's sign differs.
    var V = (a < 0) === (b < 0) && (r < 0) !== (a < 0);
    return {
      n: n,
      view: viewOf(p.view),
      a: a,
      b: b,
      aBits: aBits,
      bBits: bBits,
      sumBits: add.sum,
      carries: add.carries,
      carryOut: add.carryOut,
      weights: weights(n),
      range: range,
      unsigned: { a: au, b: bu, r: ru },
      signed: { a: a, b: b, r: r },
      hex: { a: hexOf(au, n), b: hexOf(bu, n), r: hexOf(ru, n) },
      flags: {
        N: add.sum[0],                 // rule 5: the top bit of r
        Z: ru === 0 ? 1 : 0,           // rule 5
        C: add.carryOut,               // rule 3: carry out of the top bit
        V: V ? 1 : 0                   // rule 4
      },
      // The arithmetic answers the bits should hold: the signed one fits iff V = 0, the unsigned one iff C = 0.
      trueSum: { signed: a + b, unsigned: au + bu }
    };
  }

  var presets = [
    { id: 'overflow', params: { width: 8, a: 100, b: 50 } },
    { id: 'max-plus-one', params: { width: 8, a: 127, b: 1 } },
    { id: 'carry-not-overflow', params: { width: 8, a: -1, b: 1 } },
    { id: 'both', params: { width: 8, a: -100, b: -50 } },
    { id: 'subtract', params: { width: 8, a: 5, b: -3 } },
    { id: '16-bit', params: { width: 16, a: 30000, b: 10000 } }
  ];

  var logic = {
    WIDTHS: WIDTHS, VIEWS: VIEWS, defaults: defaults,
    /** Explorer: no steps; the state is derived from the params. */
    initial: function (p) { return derive(p); },
    derive: derive, rangeOf: rangeOf, clamp: clamp, unsignedOf: unsignedOf, signedOf: signedOf, bitsOf: bitsOf,
    valueOfBits: valueOfBits, weightOf: weightOf, weights: weights, hexOf: hexOf, ripple: ripple, negate: negate,
    flipBit: flipBit, changedBits: changedBits, changedFlags: changedFlags, widthOf: widthOf, withDefaults: P,
    presets: presets
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
