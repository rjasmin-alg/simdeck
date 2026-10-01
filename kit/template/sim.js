/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the proto-simulator: counting in binary with a fixed number of bits.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON (numbers and arrays).
   The page loads this as a classic script (window.SimLogic); node tests require() it.
   Copying the template? Replace the model below and keep the shape: defaults, steps, initial, step. */
(function (root) {
  'use strict';

  var logic = {
    /** Parameter defaults. The page's controls describe how each one is shown. */
    defaults: { bits: 4, start: 0, inc: 1, signed: false, places: true },

    /** Steps per demo: fixed, so the index can show it and a demo stays a few minutes long. */
    steps: 16,

    /** State at step 0. */
    initial: function (p) {
      return { value: p.start % Math.pow(2, p.bits), added: 0, flipped: [], wrapped: false };
    },

    /** State after step n (n = 1, 2, ...), from the state after step n - 1. */
    step: function (s, n, p) {
      var size = Math.pow(2, p.bits);
      var sum = s.value + p.inc;
      var value = sum % size;
      var changed = s.value ^ value;
      var flipped = [];
      for (var i = 0; i < p.bits; i++) if (changed & (1 << i)) flipped.push(i); // ascending bit index
      return { value: value, added: p.inc, flipped: flipped, wrapped: sum >= size };
    },

    /** Bits of value, most significant first. */
    bitsOf: function (value, bits) {
      var out = [];
      for (var i = bits - 1; i >= 0; i--) out.push((value >> i) & 1);
      return out;
    },

    /** The same bit pattern read as a two's complement number. */
    signedOf: function (value, bits) {
      var half = Math.pow(2, bits - 1);
      return value >= half ? value - 2 * half : value;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
