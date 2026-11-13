/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ari-column-multiplication: column multiplication with partial products, in any base 2–16 (SPEC.md).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The numbers are params as quantities (a: the first factor, b: the second); their digits come from the base, so a
   change of base keeps the quantity and rewrites the digits. The arithmetic part (multiplyColumns, areaOf,
   mistakeOf) works on plain values and is meant to be promotable to models/ with ari-column-addition's.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DIGITS = '0123456789ABCDEF';
  var MAX_DIGITS = 4;
  var MIN_BASE = 2;
  var MAX_BASE = 16;
  var MISTAKES = ['none', 'noshift', 'carry', 'carryfirst'];
  var MAX_VALUE = Math.pow(16, MAX_DIGITS) - 1;

  // digitsOf, textOf, valueOf, fitsIn, minBase: from sims/ari-column-addition/sim.js @ 7ce9a39 (COMMON.md §6;
  // no ari- model in models/ yet), as copied into sims/ari-column-subtraction. MAX_DIGITS is 4 here.

  /** Digits of a non-negative integer v in base b, least significant first. 0 is [0]. */
  function digitsOf(v, b) {
    var out = [];
    var x = Math.floor(Math.abs(v));
    do { out.push(x % b); x = Math.floor(x / b); } while (x > 0);
    return out;
  }

  /** The numeral of v in base b, most significant first ("1C9"). */
  function textOf(v, b) {
    return digitsOf(v, b).reverse().map(function (d) { return DIGITS[d]; }).join('');
  }

  /** Value of digits (least significant first) in base b. */
  function valueOf(digits, b) {
    var v = 0;
    for (var k = digits.length - 1; k >= 0; k--) v = v * b + digits[k];
    return v;
  }

  /** True when every value has at most MAX_DIGITS digits in base b. */
  function fitsIn(values, b) {
    return values.every(function (v) { return digitsOf(v, b).length <= MAX_DIGITS; });
  }

  /** The smallest base 2–16 in which every value fits (MAX_BASE + 1 if none). */
  function minBase(values) {
    for (var b = MIN_BASE; b <= MAX_BASE; b++) if (fitsIn(values, b)) return b;
    return MAX_BASE + 1;
  }

  /** The two factors the params name, as quantities: whole, 0 … MAX_VALUE (a bad URL value, even Infinity, is 0). */
  function numbersOf(p) {
    var q = function (v) { var x = Number(v); return isFinite(x) ? Math.min(MAX_VALUE, Math.max(0, Math.floor(x))) : 0; };
    return [q(p.a), q(p.b)];
  }

  /**
   * Read typed factors in base b: "457 · 36"; ·, ⋅, ×, *, x, X and spaces as separators, a–f as A–F.
   * Returns { values: [a, b] } or { error: 'digit'|'long'|'count'|'empty', at }.
   */
  function parseList(text, b) {
    var src = String(text == null ? '' : text).trim();
    if (!src) return { error: 'count', at: '' };
    var parts = src.split(/[·⋅×*xX]/).map(function (s) { return s.trim(); });
    var words = [];
    for (var i = 0; i < parts.length; i++) {
      var ws = parts[i].split(/\s+/).filter(Boolean);
      if (!ws.length) return { error: 'empty', at: '·' };
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
    if (values.length !== 2) return { error: 'count', at: String(values.length) };
    return { values: values };
  }

  /** The params patch that sets these numbers. */
  function paramsFor(values) { return { a: values[0], b: values[1] }; }

  /**
   * One partial product a · d in base `base` (SPEC.md, Plan; rules 1–4). mode: 'right' (default), 'carry' (the carry
   * forgotten), 'carryfirst' (the carry added to the digit before multiplying), for the typical mistakes.
   * Returns { kind, digits (as written, ones first), steps: [{ i, ad, cin, prod, write, cout, last }] (mul only) }.
   */
  function partialOf(A, d, base, alone, mode) {
    var n = A.length;
    if (d === 0) return { kind: 'zero', digits: alone ? [0] : A.map(function () { return 0; }), steps: [] };
    if (d === 1) return { kind: 'one', digits: A.slice(), steps: [] };
    var out = [], steps = [], carry = 0;
    for (var i = 0; i < n; i++) {
      var cin = carry;
      var prod = mode === 'carryfirst' ? (A[i] + cin) * d : mode === 'carry' ? A[i] * d : A[i] * d + cin;
      var last = i === n - 1;
      var write = last ? digitsOf(prod, base) : [prod % base];
      var cout = last ? 0 : Math.floor(prod / base);
      out = out.concat(write);
      steps.push({ i: i, ad: A[i], cin: mode === 'carry' ? 0 : cin, prod: prod, write: write, cout: cout, last: last });
      carry = cout;
    }
    return { kind: 'mul', digits: out, steps: steps };
  }

  /**
   * Column multiplication a · b in base `base`. Rows from the second factor's left digit: { j, d, place, kind,
   * digits, value, steps }. Sum: { digits (the product, ones first), carries (carry into place k, by place), width }.
   * seq: the steps in order, { row, i } (i null for a whole row) or { sum: true }.
   */
  function multiplyColumns(a, b, base, mode) {
    var A = digitsOf(a, base), B = digitsOf(b, base);
    var n = A.length, m = B.length;
    var rows = [], seq = [];
    for (var j = 0; j < m; j++) {
      var place = m - 1 - j;
      var d = B[place];
      var part = partialOf(A, d, base, m === 1, mode);
      rows.push({ j: j, d: d, place: place, kind: part.kind, digits: part.digits,
        value: valueOf(part.digits, base), steps: part.steps });
      if (part.kind === 'mul') part.steps.forEach(function (st) { seq.push({ row: j, i: st.i }); });
      else seq.push({ row: j, i: null });
    }
    // the sum, column by column (rules 6, 8); with m = 1 the only row is the product
    var width = rows.reduce(function (w, r) { return Math.max(w, r.place + r.digits.length); }, 1);
    var carries = [0], sum = [], c = 0;
    for (var k = 0; k < width || c > 0; k++) {
      var s = c;
      rows.forEach(function (r) { var x = k - r.place; if (x >= 0 && x < r.digits.length) s += r.digits[x]; });
      sum.push(s % base);
      c = Math.floor(s / base);
      carries.push(c);
    }
    while (sum.length > 1 && sum[sum.length - 1] === 0) sum.pop();
    carries.length = sum.length;
    if (m > 1) seq.push({ sum: true });
    return { A: A, B: B, n: n, m: m, rows: rows, sum: sum, carries: carries, value: valueOf(sum, base), seq: seq };
  }

  /** The whole multiplication for these params; cols is the paper's width: the factors line, n + 1 + m squares. */
  function planOf(p) {
    var nums = numbersOf(p);
    var plan = multiplyColumns(nums[0], nums[1], p.base);
    plan.a = nums[0];
    plan.b = nums[1];
    plan.product = nums[0] * nums[1];
    plan.cols = Math.max(plan.n + 1 + plan.m, plan.sum.length);
    return plan;
  }

  /**
   * The area model (SPEC.md, rule 10): parts of the first factor by place, from the left (value = digit · base^i),
   * parts of the second from the left (rows), cells[j][c] the products, rowTotals[j] = row value · base^place.
   */
  function areaOf(p) {
    var plan = planOf(p), base = p.base;
    var cols = [];
    for (var i = plan.n - 1; i >= 0; i--) cols.push({ i: i, digit: plan.A[i], value: plan.A[i] * Math.pow(base, i) });
    var rows = plan.rows.map(function (r) { return { j: r.j, digit: r.d, place: r.place, value: r.d * Math.pow(base, r.place) }; });
    var cells = rows.map(function (r) { return cols.map(function (c) { return r.value * c.value; }); });
    var rowTotals = plan.rows.map(function (r) { return r.value * Math.pow(base, r.place); });
    var total = rowTotals.reduce(function (x, y) { return x + y; }, 0);
    return { cols: cols, rows: rows, cells: cells, rowTotals: rowTotals, total: total };
  }

  /**
   * A typical mistake on the same numbers (SPEC.md, Typical mistakes). Returns { kind, rows: [{ place, digits,
   * differs: [bool by digit] }], sum (wrong product digits), differs (by place of the product), value, text,
   * rightText, same, over (wrong − right), first (carry mistakes: the first digit step done differently:
   * { row, ad, d, cin, prod (as done), right (the right product) }) }.
   */
  function mistakeOf(p, kind) {
    var plan = planOf(p), base = p.base;
    var mode = kind === 'carry' || kind === 'carryfirst' ? kind : 'right';
    var wrong = multiplyColumns(plan.a, plan.b, base, mode);
    var res = { kind: kind, first: null };
    res.rows = wrong.rows.map(function (r, j) {
      var right = plan.rows[j];
      var place = kind === 'noshift' ? 0 : r.place;
      // noshift writes the right digits, only in the wrong place: nothing differs digit by digit
      return { place: place, digits: r.digits,
        differs: r.digits.map(function (x, i) { return right.digits[i] !== x; }) };
    });
    if (kind === 'noshift') {
      var v = wrong.rows.reduce(function (s, r) { return s + r.value; }, 0);
      res.sum = digitsOf(v, base);
    } else res.sum = wrong.sum;
    if (mode !== 'right') {
      for (var j = 0; j < plan.rows.length && !res.first; j++) {
        var rs = plan.rows[j].steps;
        for (var i = 0; i < rs.length; i++) {
          if (rs[i].cin > 0) {
            res.first = { row: j, ad: rs[i].ad, d: plan.rows[j].d, cin: rs[i].cin, right: rs[i].prod,
              prod: wrong.rows[j].steps[i].prod };
            break;
          }
        }
      }
    }
    res.value = valueOf(res.sum, base);
    res.text = textOf(res.value, base);
    res.rightText = textOf(plan.product, base);
    res.same = res.value === plan.product;
    res.over = res.value - plan.product;
    res.differs = res.sum.map(function (x, k) { return x !== plan.sum[k]; });
    return res;
  }

  function stepsOf(p) { return planOf(p).seq.length; }

  var logic = {
    DIGITS: DIGITS,
    MAX_DIGITS: MAX_DIGITS,
    MIN_BASE: MIN_BASE,
    MAX_BASE: MAX_BASE,
    MISTAKES: MISTAKES,
    /** The largest number a param may hold: four hexadecimal digits. */
    MAX_VALUE: MAX_VALUE,

    defaults: { a: 457, b: 36, base: 10, area: true, mistake: 'none' },

    PRESETS: [
      { id: 'two-digit', params: { a: 457, b: 36 } },
      { id: 'one-digit', params: { a: 248, b: 7 } },
      { id: 'zero-digit', params: { a: 312, b: 205 } },
      { id: 'no-shift', params: { a: 457, b: 36, mistake: 'noshift' } },
      { id: 'base-2', params: { a: 13, b: 11, base: 2 } },
      { id: 'base-16', params: { a: 457, b: 36, base: 16 } }
    ],

    /** Steps depend on the numbers: one per digit product, one per 0 or 1 row, one for the sum. */
    steps: stepsOf,

    initial: function (p) {
      var plan = planOf(p);
      return { phase: 'start', row: -1, i: -1, parts: plan.rows.map(function () { return null; }), carry: 0, sum: false };
    },

    /** State after step n from the state after step n − 1 (SPEC.md, One step). */
    step: function (s, n, p) {
      var plan = planOf(p);
      var next = { phase: s.phase, row: s.row, i: s.i, parts: s.parts.map(function (x) { return x ? x.slice() : null; }),
        carry: s.carry, sum: s.sum };
      var act = plan.seq[n - 1];
      if (!act) return next; // past the end: unchanged
      if (act.sum) {
        next.phase = 'sum';
        next.row = -1; next.i = -1; next.carry = 0; next.sum = true;
        return next;
      }
      var r = plan.rows[act.row];
      next.row = act.row;
      if (act.i == null) {
        next.phase = 'row'; next.i = -1; next.carry = 0;
        next.parts[act.row] = r.digits.slice();
        return next;
      }
      var st = r.steps[act.i];
      next.phase = 'digit'; next.i = act.i; next.carry = st.cout;
      next.parts[act.row] = (next.parts[act.row] || []).concat(st.write);
      return next;
    },

    digitsOf: digitsOf,
    textOf: textOf,
    valueOf: valueOf,
    numbersOf: numbersOf,
    fitsIn: fitsIn,
    minBase: minBase,
    parseList: parseList,
    paramsFor: paramsFor,
    multiplyColumns: multiplyColumns,
    planOf: planOf,
    areaOf: areaOf,
    mistakeOf: mistakeOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
