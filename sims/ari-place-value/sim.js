/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ari-place-value: place value in any base 2–16, with blocks (SPEC.md).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   An explorer: the page draws initial(params). The params are the base, the quantity n (in units) and the blocks per
   place c0…c13; the blocks follow the quantity (SPEC rule 3), so a change of base alone keeps the quantity.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DIGITS = '0123456789ABCDEF';
  var MIN_BASE = 2;
  var MAX_BASE = 16;
  var MAX_VALUE = 9999;
  var MAX_PLACES = 14;        // base 2: 2^13 = 8192 ≤ 9999
  var MAX_COUNT = 2 * MAX_BASE - 1;
  var OTHER_BASES = [10, 2, 8, 16];
  var MISTAKES = ['none', 'squash', 'zero', 'decimal'];
  var KEYS = [];
  for (var i = 0; i < MAX_PLACES; i++) KEYS.push('c' + i);

  function pow(b, k) { return Math.pow(b, k); }

  /** Digits of a non-negative integer v in base b, ones first. 0 is [0]. */
  function digitsOf(v, b) {
    var out = [], x = Math.floor(Math.abs(v));
    do { out.push(x % b); x = Math.floor(x / b); } while (x > 0);
    return out;
  }
  /** v written in base b, most significant digit first. */
  function textOf(v, b) { return digitsOf(v, b).reverse().map(function (d) { return DIGITS[d]; }).join(''); }

  /** The places base b has: k with b^k ≤ MAX_VALUE (rule 2). */
  function placesFor(b) { var k = 0; while (pow(b, k) <= MAX_VALUE) k++; return k; }
  /** Most blocks one column may hold: 2b − 1 (one full group and a digit's worth). */
  function capOf(b) { return 2 * b - 1; }

  /** Worth of the blocks, in units (rule 1). */
  function valueOf(counts, b) {
    var v = 0;
    for (var k = counts.length - 1; k >= 0; k--) v = v * b + counts[k];
    return v;
  }
  function pad(arr) { var out = arr.slice(0, MAX_PLACES); while (out.length < MAX_PLACES) out.push(0); return out; }
  function canonical(n, b) { return pad(digitsOf(n, b)); }
  function topOf(counts) { for (var k = counts.length - 1; k >= 0; k--) if (counts[k] > 0) return k; return -1; }

  function clampInt(v, lo, hi, dflt) {
    var x = Math.floor(Number(v));
    if (!Number.isFinite(x)) return dflt;
    return Math.max(lo, Math.min(hi, x));
  }
  function baseOf(p) { return clampInt(p.base, MIN_BASE, MAX_BASE, 10); }
  function nOf(p) { return clampInt(p.n, 0, MAX_VALUE, 0); }
  function rawCounts(p) { return KEYS.map(function (key) { return clampInt(p[key], 0, MAX_COUNT, 0); }); }

  /** True when the counts are a valid mat for base b: each 0 … 2b − 1, nothing beyond the base's places. */
  function validFor(counts, b) {
    var P = placesFor(b), cap = capOf(b);
    return counts.every(function (c, k) { return c >= 0 && c <= cap && (c === 0 || k < P); });
  }

  /** The blocks on the mat (rule 3): the params' counts when valid and worth n, else the digits of n. */
  function blocksOf(p) {
    var b = baseOf(p), n = nOf(p), c = rawCounts(p);
    return validFor(c, b) && valueOf(c, b) === n ? c : canonical(n, b);
  }

  /** Columns on the mat (rule 2). */
  function shownPlaces(counts, b) {
    var P = placesFor(b);
    return Math.min(P, Math.max(Math.min(4, P), topOf(counts) + 2));
  }

  /** The params for a quantity and its blocks. */
  function paramsFor(n, counts) {
    var out = { n: n };
    pad(counts).forEach(function (c, k) { out[KEYS[k]] = c; });
    return out;
  }

  /** Why an action is refused, or null (rules 4–7). */
  function refusal(p, action, k) {
    var b = baseOf(p), c = blocksOf(p), cap = capOf(b), P = placesFor(b);
    if (action === 'add') {
      if (k < 0 || k >= P) return 'place';
      if (c[k] >= cap) return 'full';
      if (nOf(p) + pow(b, k) > MAX_VALUE) return 'max';
      return null;
    }
    if (action === 'remove') return c[k] > 0 ? null : 'empty';
    if (action === 'regroup') {
      if (c[k] < b) return 'few';     // b or more blocks are worth b^(k+1) ≤ 9999, so place k + 1 always exists
      if (c[k + 1] + 1 > cap) return 'full';
      return null;
    }
    if (action === 'break') {
      if (k === 0) return 'ones';
      if (c[k] < 1) return 'empty';
      if (c[k - 1] + b > cap) return 'full';
      return null;
    }
    return 'unknown';
  }

  /** The params after an action on place k, or { error } (rules 4–7). */
  function act(p, action, k) {
    var why = refusal(p, action, k);
    if (why) return { error: why };
    var b = baseOf(p), c = blocksOf(p).slice(), n = nOf(p);
    if (action === 'add') { c[k] += 1; n += pow(b, k); }
    else if (action === 'remove') { c[k] -= 1; n -= pow(b, k); }
    else if (action === 'regroup') { c[k] -= b; c[k + 1] += 1; }
    else if (action === 'break') { c[k] -= 1; c[k - 1] += b; }
    return { params: paramsFor(n, c) };
  }

  /** Regroup all (rule 9). */
  function regroupAll(p) { return paramsFor(nOf(p), canonical(nOf(p), baseOf(p))); }

  /** Places with b or more blocks (rule 8). */
  function overOf(counts, b) { var out = []; counts.forEach(function (c, k) { if (c >= b) out.push(k); }); return out; }

  /** The numeral of the mat, or null while a place is full (rule 8). */
  function numeralOf(counts, b) {
    if (overOf(counts, b).length) return null;
    var top = topOf(counts);
    if (top < 0) return '0';
    var s = '';
    for (var k = top; k >= 0; k--) s += DIGITS[counts[k]];
    return s;
  }

  /** Read a numeral typed in base b: { value } or { error: 'empty'|'digit'|'max', at }. */
  function parseNumber(text, b) {
    var s = String(text == null ? '' : text).replace(/\s+/g, '').toUpperCase();
    if (!s) return { error: 'empty', at: '' };
    var v = 0;
    for (var i = 0; i < s.length; i++) {
      var d = DIGITS.indexOf(s[i]);
      if (d < 0 || d >= b) return { error: 'digit', at: s[i] };
      v = v * b + d;
      if (v > MAX_VALUE) return { error: 'max', at: s };
    }
    return { value: v };
  }

  /** From the highest place in use down to the ones: { k, d, pv, worth } (rule 11). */
  function expansionOf(counts, b) {
    var top = Math.max(0, topOf(counts)), out = [];
    for (var k = top; k >= 0; k--) out.push({ k: k, d: counts[k], pv: pow(b, k), worth: counts[k] * pow(b, k) });
    return out;
  }

  /** n in the other bases, the current one first when it is not among them (rule 10). */
  function basesOf(n, b) {
    var list = OTHER_BASES.indexOf(b) >= 0 ? OTHER_BASES : [b].concat(OTHER_BASES);
    return list.map(function (x) { return { base: x, text: textOf(n, x), current: x === b }; });
  }

  /** The typical mistake for these params (SPEC "Typical mistakes"). */
  function mistakeOf(p, kind) {
    var b = baseOf(p), n = nOf(p), c = blocksOf(p);
    var right = textOf(n, b);
    var out = { kind: kind, applies: false, reason: null, wrongText: null, wrongValue: null, rightText: right, same: false };
    if (kind === 'squash') {
      var over = overOf(c, b);
      if (!over.length) { out.reason = 'nofull'; return out; }
      var top = topOf(c), s = '';
      for (var k = top; k >= 0; k--) s += textOf(c[k], b);
      out.applies = true;
      out.wrongText = s;
      out.wrongValue = s.split('').reduce(function (v, ch) { return v * b + DIGITS.indexOf(ch); }, 0);
      out.over = over;
      out.same = out.wrongValue === n;
      return out;
    }
    if (kind === 'zero') {
      if (n === 0 || right.indexOf('0') < 0) { out.reason = 'nozero'; return out; }
      out.applies = true;
      out.wrongText = right.replace(/0/g, '');
      out.wrongValue = out.wrongText.split('').reduce(function (v, ch) { return v * b + DIGITS.indexOf(ch); }, 0);
      out.same = out.wrongValue === n;
      return out;
    }
    if (kind === 'decimal') {
      if (b === 10) { out.reason = 'base10'; return out; }
      if (/[A-F]/.test(right)) { out.reason = 'letters'; return out; }
      out.applies = true;
      out.wrongText = right;
      out.wrongValue = parseInt(right, 10);
      out.same = out.wrongValue === n;
      return out;
    }
    out.reason = 'none';
    return out;
  }

  var defaults = Object.assign({ base: 10, mistake: 'none' }, paramsFor(347, [7, 4, 3]));

  function preset(id, base, n, counts, mistake) {
    return { id: id, params: Object.assign({ base: base, mistake: mistake || 'none' }, paramsFor(n, counts)) };
  }
  var PRESETS = [
    preset('build-347', 10, 347, [7, 4, 3]),
    preset('thirteen-ones', 10, 33, [13, 2], 'squash'),
    preset('zero-place', 10, 307, [7, 0, 3], 'zero'),
    preset('base-2', 2, 13, [1, 0, 1, 1], 'decimal'),
    preset('base-8-full', 8, 8, [8]),
    preset('base-16', 16, 255, [15, 15])
  ];

  var logic = {
    DIGITS: DIGITS, MIN_BASE: MIN_BASE, MAX_BASE: MAX_BASE, MAX_VALUE: MAX_VALUE, MAX_PLACES: MAX_PLACES,
    MAX_COUNT: MAX_COUNT, OTHER_BASES: OTHER_BASES, MISTAKES: MISTAKES, KEYS: KEYS, PRESETS: PRESETS,
    defaults: defaults,
    steps: 0,
    pow: pow, digitsOf: digitsOf, textOf: textOf, placesFor: placesFor, capOf: capOf, valueOf: valueOf,
    blocksOf: blocksOf, shownPlaces: shownPlaces, paramsFor: paramsFor, refusal: refusal, act: act,
    regroupAll: regroupAll, overOf: overOf, numeralOf: numeralOf, parseNumber: parseNumber, expansionOf: expansionOf,
    basesOf: basesOf, mistakeOf: mistakeOf, baseOf: baseOf, nOf: nOf,

    /** Everything the page shows, from the params. */
    initial: function (p) {
      var b = baseOf(p), n = nOf(p), c = blocksOf(p);
      return {
        base: b, n: n, counts: c,
        places: shownPlaces(c, b),
        over: overOf(c, b),
        numeral: numeralOf(c, b),
        expansion: expansionOf(c, b),
        bases: basesOf(n, b)
      };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
