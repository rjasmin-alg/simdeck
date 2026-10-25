/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for crc-error-detection: one message is sent twice over the same line, once with an even parity bit and once
   with a CRC. The sender's long division (modulo 2) is worked out one XOR row per step; the remainder is the FCS.
   Then the line flips the chosen data bits in both frames, the receiver recounts the parity and divides the received
   codeword. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Bit 0 is the leftmost (first sent) bit.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Message length in bits (fixed: the default message 1101011111 and the presets use it). */
  var N = 10;
  /** Generator polynomials offered, as bit strings, highest power first. */
  var GENS = ['10011', '1011', '100000111'];

  // ── bits: pure functions over plain arrays, promotable to models/ unchanged ──

  /** The n bits of value, most significant (bit 0, sent first) first. */
  function bitsOf(value, n) {
    var out = [];
    for (var i = n - 1; i >= 0; i--) out.push(Math.floor(value / Math.pow(2, i)) % 2);
    return out;
  }

  /** '10011' → [1, 0, 0, 1, 1]. */
  function parse(s) { return String(s).split('').map(Number); }

  function ones(bits) { return bits.reduce(function (a, b) { return a + b; }, 0); }

  /** Rule 1: the even parity bit makes the number of 1s, check bit included, even. */
  function parityBit(bits) { return ones(bits) % 2; }

  /**
   * Rules 3, 4, 7: long division modulo 2, left to right. At every position whose leading bit is 1 the generator is
   * XORed in (no borrows); a leading 0 is only brought down (XOR with zeros changes nothing, so no row is written).
   * Returns the rows (window start, register before and after) and the remainder: the last deg(gen) bits.
   */
  function divide(bits, gen) {
    var reg = bits.slice(), rows = [], r = gen.length - 1;
    for (var i = 0; i + r < reg.length; i++) {
      if (reg[i] !== 1) continue;
      var before = reg.slice();
      for (var j = 0; j < gen.length; j++) reg[i + j] ^= gen[j];
      rows.push({ at: i, before: before, after: reg.slice() });
    }
    return { rows: rows, remainder: reg.slice(reg.length - r) };
  }

  /** Rule 3: append deg(gen) zeros, divide; the remainder is the FCS and the codeword is data followed by FCS. */
  function encode(data, gen) {
    var r = gen.length - 1;
    var dividend = data.concat(zeros(r));
    var d = divide(dividend, gen);
    return { dividend: dividend, rows: d.rows, fcs: d.remainder, codeword: data.concat(d.remainder) };
  }

  /** Rules 4, 6: the receiver divides the whole received codeword; remainder 0 → accept, otherwise detected. */
  function check(received, gen) {
    var d = divide(received, gen);
    return { rows: d.rows, remainder: d.remainder, accept: ones(d.remainder) === 0 };
  }

  /** Rule 2 at the receiver: an odd count of 1s (check bit included) is an error. */
  function parityCheck(received) {
    var k = ones(received);
    return { ones: k, accept: k % 2 === 0 };
  }

  /** What the receiver's answer means, given whether the line really changed something. */
  function verdict(accept, damaged) { return accept ? (damaged ? 'missed' : 'ok') : 'detected'; }

  function zeros(n) { var z = []; for (var i = 0; i < n; i++) z.push(0); return z; }

  /** Indices (ascending) of the set bits of a flip mask over the N message bits. */
  function flipList(mask) {
    return bitsOf(mask, N).map(function (b, i) { return b ? i : -1; }).filter(function (i) { return i >= 0; });
  }

  /** The frame with the bits at idx inverted. */
  function flipBits(bits, idx) {
    var out = bits.slice();
    idx.forEach(function (i) { out[i] ^= 1; });
    return out;
  }

  // ── the run ──

  /**
   * Phases: start (step 0), divide (one XOR row per step), sent (the FCS is appended), and only when bits are
   * flipped: line (the errors arrive), parity (the receiver recounts), crc (the receiver divides).
   */
  function plan(p) {
    var data = bitsOf(p.data, N), gen = parse(p.gen), enc = encode(data, gen), k = enc.rows.length;
    return { data: data, gen: gen, enc: enc, k: k, steps: k + 1 + (p.flip ? 3 : 0) };
  }

  function stateAt(p, n) {
    var pl = plan(p), data = pl.data, gen = pl.gen, enc = pl.enc, k = pl.k;
    var phase = n === 0 ? 'start' : n <= k ? 'divide' : n === k + 1 ? 'sent' : n === k + 2 ? 'line' : n === k + 3 ? 'parity' : 'crc';
    var at = ['start', 'divide', 'sent', 'line', 'parity', 'crc'].indexOf(phase);
    var flips = flipList(p.flip);
    var pbit = parityBit(data);
    var s = {
      phase: phase,
      data: data,
      gen: gen,
      r: gen.length - 1,
      parity: pbit,
      dividend: enc.dividend,
      rows: enc.rows.slice(0, Math.min(n, k)),
      fcs: at >= 2 ? enc.fcs : null,
      codeword: at >= 2 ? enc.codeword : null,
      planned: flips,
      flipped: at >= 3 ? flips : [],
      received: null,
      receivedParity: null,
      parityCheck: null,
      crcCheck: null
    };
    if (at >= 3) {
      s.received = flipBits(enc.codeword, flips);
      s.receivedParity = flipBits(data.concat([pbit]), flips);
    }
    var damaged = flips.length > 0;
    if (at >= 4) {
      var pc = parityCheck(s.receivedParity);
      s.parityCheck = { ones: pc.ones, verdict: verdict(pc.accept, damaged) };
    }
    if (at >= 5) {
      var cc = check(s.received, gen);
      s.crcCheck = { rows: cc.rows, remainder: cc.remainder, verdict: verdict(cc.accept, damaged) };
    }
    return s;
  }

  var logic = {
    N: N,
    GENS: GENS,

    /** data: the message as a number (bit 0 = its most significant bit); flip: a mask of message bits the line flips. */
    defaults: { data: 863, gen: '10011', flip: 0 },

    /** k XOR rows + the FCS step, and three more (line, parity, CRC) when the line flips bits. */
    steps: function (p) { return plan(p).steps; },

    initial: function (p) { return stateAt(p, 0); },

    /** Every step is a function of the params and n alone, so step back equals replay by construction. */
    step: function (s, n, p) { return stateAt(p, n); },

    bitsOf: bitsOf,
    parse: parse,
    ones: ones,
    parityBit: parityBit,
    divide: divide,
    encode: encode,
    check: check,
    parityCheck: parityCheck,
    verdict: verdict,
    flipList: flipList,
    flipBits: flipBits,
    /** The flip mask for a list of message bit indices. */
    maskOf: function (idx) {
      return idx.filter(function (i, j) { return idx.indexOf(i) === j; }).reduce(function (m, i) { return m + Math.pow(2, N - 1 - i); }, 0);
    },
    /** The message number for a bit string. */
    valueOf: function (s) { return parseInt(s, 2); }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
