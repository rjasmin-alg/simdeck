/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ari-column-addition: column addition with carrying, in any base 2–16 (SPEC.md).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The numbers are params as quantities (a, b, c, d; the first `count` used); their digits come from the base, so a
   change of base keeps the quantity and rewrites the digits. The arithmetic part (digitsOf, addColumns, mistakeOf)
   works on plain arrays and is meant to be promotable to models/ for the other ari- pages.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DIGITS = '0123456789ABCDEF';
  var MAX_DIGITS = 9;
  var MIN_NUMBERS = 2;
  var MAX_NUMBERS = 4;
  var MIN_BASE = 2;
  var MAX_BASE = 16;
  var KEYS = ['a', 'b', 'c', 'd'];
  var MISTAKES = ['none', 'nocarry', 'whole', 'left'];

  /** Digits of a non-negative integer v in base b, least significant first. 0 is [0]. */
  function digitsOf(v, b) {
    var out = [];
    var x = Math.floor(Math.abs(v));
    do { out.push(x % b); x = Math.floor(x / b); } while (x > 0);
    return out;
  }

  /** The numeral of v in base b, most significant first ("5A0"). */
  function textOf(v, b) {
    return digitsOf(v, b).reverse().map(function (d) { return DIGITS[d]; }).join('');
  }

  /** Value of digits (least significant first) in base b. */
  function valueOf(digits, b) {
    var v = 0;
    for (var k = digits.length - 1; k >= 0; k--) v = v * b + digits[k];
    return v;
  }

  /** The numbers the params name, as quantities. */
  function numbersOf(p) {
    var n = Math.max(MIN_NUMBERS, Math.min(MAX_NUMBERS, p.count | 0));
    return KEYS.slice(0, n).map(function (k) { return Math.max(0, Math.floor(Number(p[k]) || 0)); });
  }

  /** True when every number has at most MAX_DIGITS digits in base b. */
  function fitsIn(values, b) {
    return values.every(function (v) { return digitsOf(v, b).length <= MAX_DIGITS; });
  }

  /** The smallest base 2–16 in which every number fits (MAX_BASE + 1 if none). */
  function minBase(values) {
    for (var b = MIN_BASE; b <= MAX_BASE; b++) if (fitsIn(values, b)) return b;
    return MAX_BASE + 1;
  }

  /**
   * Read typed numbers in base b: "457 + 368", spaces and + as separators, a–f as A–F.
   * Returns { values } or { error: 'digit'|'long'|'count'|'empty', at } (at = the offending text).
   */
  function parseList(text, b) {
    var src = String(text == null ? '' : text).trim();
    if (!src) return { error: 'count', at: '' };
    var parts = src.split('+').map(function (s) { return s.trim(); });
    var words = [];
    for (var i = 0; i < parts.length; i++) {
      var ws = parts[i].split(/\s+/).filter(Boolean);
      if (!ws.length) return { error: 'empty', at: '+' };
      words = words.concat(ws);
    }
    var values = [];
    for (var j = 0; j < words.length; j++) {
      var w = words[j].toUpperCase();
      for (var c = 0; c < w.length; c++) {
        var d = DIGITS.indexOf(w[c]);
        if (d < 0 || d >= b) return { error: 'digit', at: words[j][c] };
      }
      var stripped = w.replace(/^0+(?=.)/, '');
      if (stripped.length > MAX_DIGITS) return { error: 'long', at: words[j] };
      var v = 0;
      for (var k = 0; k < stripped.length; k++) v = v * b + DIGITS.indexOf(stripped[k]);
      values.push(v);
    }
    if (values.length < MIN_NUMBERS || values.length > MAX_NUMBERS) return { error: 'count', at: String(values.length) };
    return { values: values };
  }

  /** The params patch that sets these numbers. */
  function paramsFor(values) {
    var patch = { count: values.length };
    KEYS.forEach(function (k, i) { patch[k] = i < values.length ? values[i] : 0; });
    return patch;
  }

  /**
   * Column addition of digit rows (each least significant first; a row may be shorter: missing digits are not
   * written, not zeros). Returns, per column k: digitSum (the column's digits), carryIn, sum, digit, carryOut;
   * and final (the carry left after the last column), finalDigits (its digits in the base, least significant first),
   * resultDigits (least significant first).
   */
  function addColumns(rows, b) {
    var cols = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    var out = [];
    var carry = 0;
    for (var k = 0; k < cols; k++) {
      var ds = 0;
      rows.forEach(function (r) { if (k < r.length && r[k] != null) ds += r[k]; });
      var sum = ds + carry;
      var col = { k: k, digitSum: ds, carryIn: carry, sum: sum, digit: sum % b, carryOut: Math.floor(sum / b) };
      out.push(col);
      carry = col.carryOut;
    }
    var finalDigits = carry > 0 ? digitsOf(carry, b) : [];
    return {
      cols: cols, columns: out, final: carry, finalDigits: finalDigits,
      resultDigits: out.map(function (c) { return c.digit; }).concat(finalDigits)
    };
  }

  /** The whole sum for these params: numbers, their digit rows, the columns. */
  function planOf(p) {
    var values = numbersOf(p);
    var rows = values.map(function (v) { return digitsOf(v, p.base); });
    var add = addColumns(rows, p.base);
    add.values = values;
    add.rows = rows;
    add.total = values.reduce(function (s, v) { return s + v; }, 0);
    return add;
  }

  /**
   * A typical mistake done on the same numbers (SPEC.md, Typical mistakes). Returns
   * { kind, rows (digit rows as the mistake places them), cells: [text per column], finalText, text (the wrong
   *   result), differs: [bool per column], same (the mistake gives the right answer here), lost (nocarry: value the
   *   forgotten carries are worth, or null), misread: [numeral as the left-aligned mistake reads each number] }.
   */
  function mistakeOf(p, kind) {
    var plan = planOf(p);
    var b = p.base;
    var right = plan.columns;
    var res = { kind: kind, rows: plan.rows, cells: [], finalText: '', text: '', differs: [], same: false, lost: null, misread: null };
    if (kind === 'nocarry') {
      res.cells = right.map(function (c) { return DIGITS[c.digitSum % b]; });
      var v = 0;
      for (var k = right.length - 1; k >= 0; k--) v = v * b + right[k].digitSum % b;
      res.lost = plan.total - v;
      res.value = v;
    } else if (kind === 'whole') {
      res.cells = right.map(function (c) { return textOf(c.digitSum, b); });
    } else if (kind === 'left') {
      var cols = plan.cols;
      var rows = plan.rows.map(function (r) {
        var msb = r.slice().reverse();
        var out = [];
        for (var i = 0; i < cols; i++) { var at = cols - 1 - i; out.push(at < msb.length ? msb[at] : null); }
        return out;
      });
      res.rows = rows;
      res.misread = plan.rows.map(function (r) { return textOf(valueOf(r, b), b) + new Array(cols - r.length + 1).join('0'); });
      var wrong = addColumns(rows, b);
      res.cells = wrong.columns.map(function (c) { return DIGITS[c.digit]; });
      res.finalText = wrong.finalDigits.slice().reverse().map(function (d) { return DIGITS[d]; }).join('');
      res.carries = wrong.columns.map(function (c) { return c.carryOut; });
    }
    var rightCells = right.map(function (c) { return DIGITS[c.digit]; });
    res.text = res.finalText + res.cells.slice().reverse().join('');
    var rightText = textOf(plan.total, b);
    // same: the mistake happens to give the right numeral here (no carry, equal lengths, or only the last column
    // carries for "whole"); then no digit is marked wrong
    res.same = res.text.replace(/^0+(?=.)/, '') === rightText;
    res.differs = res.cells.map(function (x, i) { return !res.same && x !== rightCells[i]; });
    res.anyReach = right.some(function (c) { return c.digitSum >= b; });
    res.equalLengths = plan.rows.every(function (r) { return r.length === plan.cols; });
    res.rightText = rightText;
    return res;
  }

  function stepsOf(p) {
    var plan = planOf(p);
    return 2 * plan.cols + (plan.final > 0 ? 1 : 0);
  }

  var logic = {
    DIGITS: DIGITS,
    MAX_DIGITS: MAX_DIGITS,
    MIN_NUMBERS: MIN_NUMBERS,
    MAX_NUMBERS: MAX_NUMBERS,
    MIN_BASE: MIN_BASE,
    MAX_BASE: MAX_BASE,
    KEYS: KEYS,
    MISTAKES: MISTAKES,
    /** The largest number a param may hold: nine hexadecimal digits. */
    MAX_VALUE: Math.pow(16, MAX_DIGITS) - 1,

    defaults: { count: 2, a: 457, b: 368, c: 0, d: 0, base: 10, mistake: 'none' },

    PRESETS: [
      { id: 'two-numbers', params: { count: 2, a: 457, b: 368 } },
      { id: 'reaches-base', params: { count: 2, a: 645, b: 355 } },
      { id: 'four-numbers', params: { count: 4, a: 2738, b: 4596, c: 1879, d: 3967 } },
      { id: 'left-aligned', params: { count: 2, a: 1205, b: 87, mistake: 'left' } },
      { id: 'base-2', params: { count: 2, a: 11, b: 7, base: 2 } },
      { id: 'base-16', params: { count: 2, a: 935, b: 505, base: 16 } }
    ],

    /** Steps depend on the numbers: two per column, one more for a final carry. */
    steps: stepsOf,

    initial: function (p) {
      var plan = planOf(p);
      var width = plan.cols + plan.finalDigits.length;
      return { phase: 'start', col: -1, sum: null, carryRow: fill(width, null), resultRow: fill(width, null) };
    },

    /** State after step n from the state after step n - 1 (SPEC.md, One step). */
    step: function (s, n, p) {
      var plan = planOf(p);
      var next = { phase: s.phase, col: s.col, sum: s.sum, carryRow: s.carryRow.slice(), resultRow: s.resultRow.slice() };
      if (s.phase === 'sum') {
        var c = plan.columns[s.col];
        next.phase = 'write';
        next.resultRow[s.col] = c.digit;
        if (c.carryOut > 0 && s.col + 1 < plan.cols) next.carryRow[s.col + 1] = c.carryOut;
        return next;
      }
      if (s.col + 1 < plan.cols) {
        next.phase = 'sum';
        next.col = s.col + 1;
        next.sum = plan.columns[next.col].sum;
        return next;
      }
      if (plan.final > 0 && s.phase !== 'final') {
        next.phase = 'final';
        next.col = plan.cols;
        next.sum = plan.final;
        plan.finalDigits.forEach(function (d, i) { next.resultRow[plan.cols + i] = d; });
        return next;
      }
      return next; // past the end: unchanged
    },

    digitsOf: digitsOf,
    textOf: textOf,
    valueOf: valueOf,
    numbersOf: numbersOf,
    fitsIn: fitsIn,
    minBase: minBase,
    parseList: parseList,
    paramsFor: paramsFor,
    addColumns: addColumns,
    planOf: planOf,
    mistakeOf: mistakeOf
  };

  function fill(n, v) { var a = []; for (var i = 0; i < n; i++) a.push(v); return a; }

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
