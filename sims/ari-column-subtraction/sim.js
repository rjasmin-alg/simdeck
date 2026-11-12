/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ari-column-subtraction: column subtraction by borrowing and by equal additions, side by side, in any
   base 2–16 (SPEC.md). Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The numbers are params as quantities (a: the top number, b: the number taken away); their digits come from the
   base, so a change of base keeps the quantity and rewrites the digits. The arithmetic part (subtractColumns,
   mistakeOf) works on plain values and is meant to be promotable to models/ with ari-column-addition's.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DIGITS = '0123456789ABCDEF';
  var MAX_DIGITS = 9;
  var MIN_BASE = 2;
  var MAX_BASE = 16;
  var MISTAKES = ['none', 'smaller', 'forget', 'zero'];

  // digitsOf, textOf, valueOf, fitsIn, minBase: from sims/ari-column-addition/sim.js @ 7ce9a39 (COMMON.md §6;
  // no ari- model in models/ yet). fitsIn and minBase take the values to check as an array, as there.

  /** Digits of a non-negative integer v in base b, least significant first. 0 is [0]. */
  function digitsOf(v, b) {
    var out = [];
    var x = Math.floor(Math.abs(v));
    do { out.push(x % b); x = Math.floor(x / b); } while (x > 0);
    return out;
  }

  /** The numeral of v in base b, most significant first ("3A7"). */
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

  /** The two numbers the params name, as quantities: [top, taken away], the second never larger (SPEC.md, Params). */
  function numbersOf(p) {
    var a = Math.max(0, Math.floor(Number(p.a) || 0));
    var b = Math.max(0, Math.floor(Number(p.b) || 0));
    return [a, Math.min(a, b)];
  }

  /**
   * Read typed numbers in base b: "503 − 178"; -, −, – and spaces as separators, a–f as A–F.
   * Returns { values: [a, b] } or { error: 'digit'|'long'|'count'|'empty'|'order', at }.
   */
  function parseList(text, b) {
    var src = String(text == null ? '' : text).trim();
    if (!src) return { error: 'count', at: '' };
    var parts = src.split(/[-−–]/).map(function (s) { return s.trim(); });
    var words = [];
    for (var i = 0; i < parts.length; i++) {
      var ws = parts[i].split(/\s+/).filter(Boolean);
      if (!ws.length) return { error: 'empty', at: '−' };
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
    if (values[1] > values[0]) return { error: 'order', at: words[1] };
    return { values: values };
  }

  /** The params patch that sets these numbers. */
  function paramsFor(values) { return { a: values[0], b: values[1] }; }

  /** Digits of a and b in base `base`, by place; the number taken away has null where it has no digit. */
  function rowsOf(a, b, base) {
    var A = digitsOf(a, base);
    var B = digitsOf(b, base);
    return { A: A, B: A.map(function (_, k) { return k < B.length ? B[k] : null; }) };
  }

  /**
   * Column subtraction of b from a (b ≤ a) in base `base`, both methods. Per column k:
   *   top, bottom (null: no digit), digit (the result digit, the same in both methods), lead (a leading 0, not written),
   *   borrow: { t (top digit before this column's look step), d, need, lender (column that lends, or null),
   *     zeros (columns of the zeros crossed, nearest first), nt (top after the borrow), diff },
   *   equal: { t, d0 (the digit taken away, 0 if none), plus (the carried 1, 0 or 1), d (d0 + plus), need, nt, diff }.
   * And hist (borrowing: every column's top digit and its rewrites, oldest first, after the last step), added (equal
   * additions: what both numbers grew by), cols.
   */
  function subtractColumns(a, b, base) {
    var r = rowsOf(a, b, base);
    var A = r.A, B = r.B, n = A.length;
    var cur = A.slice();
    var hist = A.map(function (x) { return [x]; });
    var carry = 0, added = 0;
    var cols = [];
    for (var k = 0; k < n; k++) {
      var d = B[k] == null ? 0 : B[k];
      // borrowing (rules 5, 6; tie-break 1: only a strictly smaller digit borrows)
      var bo = { t: cur[k], d: d, need: cur[k] < d, lender: null, zeros: [] };
      if (bo.need) {
        var j = k + 1;
        while (j < n && cur[j] === 0) j++;
        if (j >= n) throw new Error('subtractColumns: b > a');
        bo.lender = j;
        cur[j] -= 1; hist[j].push(cur[j]);
        for (var z = k + 1; z < j; z++) bo.zeros.push(z);
        for (var i = j - 1; i > k; i--) { hist[i].push(base); cur[i] = base - 1; hist[i].push(cur[i]); }
        cur[k] += base; hist[k].push(cur[k]);
      }
      bo.nt = cur[k];
      bo.diff = cur[k] - d;
      // equal additions (rule 7; tie-break 2: the carried 1 is added before comparing)
      var eq = { t: A[k], d0: d, plus: carry, d: d + carry };
      eq.need = eq.t < eq.d;
      eq.nt = eq.t + (eq.need ? base : 0);
      eq.diff = eq.nt - eq.d;
      if (eq.need) added += Math.pow(base, k + 1);
      carry = eq.need ? 1 : 0;
      cols.push({ k: k, top: A[k], bottom: B[k], digit: bo.diff, borrow: bo, equal: eq });
    }
    if (carry) throw new Error('subtractColumns: b > a');
    // tie-break 3: leading zeros of the result are not written (the ones always are)
    var lead = true;
    for (var m = n - 1; m >= 0; m--) {
      cols[m].lead = lead && m > 0 && cols[m].digit === 0;
      if (!cols[m].lead) lead = false;
    }
    return { cols: n, columns: cols, hist: hist, added: added, A: A, B: B };
  }

  /** The whole subtraction for these params. */
  function planOf(p) {
    var nums = numbersOf(p);
    var plan = subtractColumns(nums[0], nums[1], p.base);
    plan.a = nums[0];
    plan.b = nums[1];
    plan.diff = nums[0] - nums[1];
    return plan;
  }

  /** Result digits (least significant first) as written: null for leading zeros. */
  function shownDigits(digits) {
    var out = digits.slice();
    for (var k = out.length - 1; k > 0 && out[k] === 0; k--) out[k] = null;
    return out;
  }

  /**
   * A typical mistake done on the same numbers (SPEC.md, Typical mistakes). Returns
   * { kind, digits (the wrong digit per column), cells (as written: null for leading zeros), value, text (the wrong
   *   result), differs: [bool per column], same (the mistake gives the right answer here), over (wrong − right),
   *   rightText, firstZero (zero: the column of the first zero crossed, or null), lender (zero: its lender),
   *   zeros (zero: how many zeros that first borrow crossed) }.
   */
  function mistakeOf(p, kind) {
    var plan = planOf(p);
    var base = p.base;
    var A = plan.A, B = plan.B, n = plan.cols;
    var dig = [];
    var res = { kind: kind, firstZero: null, lender: null, zeros: 0 };
    if (kind === 'smaller') {
      for (var k = 0; k < n; k++) dig.push(Math.abs(A[k] - (B[k] == null ? 0 : B[k])));
    } else if (kind === 'forget') {
      for (var f = 0; f < n; f++) { var d = B[f] == null ? 0 : B[f]; dig.push(A[f] >= d ? A[f] - d : A[f] + base - d); }
    } else if (kind === 'zero') {
      // borrowing across zeros: each zero becomes base − 1, but the first non-zero digit is not lowered
      var cur = A.slice();
      for (var z = 0; z < n; z++) {
        var dz = B[z] == null ? 0 : B[z];
        if (cur[z] < dz) {
          var j = z + 1;
          while (j < n && cur[j] === 0) j++;
          if (j === z + 1) { if (j < n) cur[j] -= 1; }
          else {
            if (res.firstZero == null) { res.firstZero = z + 1; res.lender = j < n ? j : null; res.zeros = j - z - 1; }
            for (var i = j - 1; i > z; i--) cur[i] = base - 1;
          }
          cur[z] += base;
        }
        dig.push(cur[z] - dz);
      }
    }
    var right = plan.columns.map(function (c) { return c.digit; });
    res.digits = dig;
    res.cells = shownDigits(dig);
    res.value = valueOf(dig, base);
    res.text = textOf(res.value, base);
    res.rightText = textOf(plan.diff, base);
    res.same = res.value === plan.diff;
    res.over = res.value - plan.diff;
    var rightCells = shownDigits(right);
    res.differs = res.cells.map(function (x, i) { return !res.same && x !== rightCells[i]; });
    return res;
  }

  function stepsOf(p) { return 2 * planOf(p).cols; }

  function fill(n, v) { var a = []; for (var i = 0; i < n; i++) a.push(v); return a; }

  var logic = {
    DIGITS: DIGITS,
    MAX_DIGITS: MAX_DIGITS,
    MIN_BASE: MIN_BASE,
    MAX_BASE: MAX_BASE,
    MISTAKES: MISTAKES,
    /** The largest number a param may hold: nine hexadecimal digits. */
    MAX_VALUE: Math.pow(16, MAX_DIGITS) - 1,

    defaults: { a: 503, b: 178, base: 10, mistake: 'none' },

    PRESETS: [
      { id: 'zero-top', params: { a: 503, b: 178 } },
      { id: 'lend-borrow', params: { a: 742, b: 347 } },
      { id: 'many-zeros', params: { a: 1000, b: 1 } },
      { id: 'smaller-mistake', params: { a: 624, b: 358, mistake: 'smaller' } },
      { id: 'base-2', params: { a: 18, b: 7, base: 2 } },
      { id: 'base-16', params: { a: 1440, b: 505, base: 16 } }
    ],

    /** Steps depend on the numbers: two per column of the top number. */
    steps: stepsOf,

    initial: function (p) {
      var plan = planOf(p);
      var n = plan.cols;
      return { phase: 'start', col: -1, hist: plan.A.map(function (x) { return [x]; }), eTop: fill(n, false), eBot: fill(n, false), res: fill(n, null) };
    },

    /** State after step n from the state after step n − 1 (SPEC.md, One step). */
    step: function (s, n, p) {
      var plan = planOf(p);
      var next = { phase: s.phase, col: s.col, hist: s.hist.map(function (h) { return h.slice(); }),
        eTop: s.eTop.slice(), eBot: s.eBot.slice(), res: s.res.slice() };
      if (s.phase === 'look') {
        next.phase = 'write';
        next.res[s.col] = plan.columns[s.col].digit;
        return next;
      }
      if (s.col + 1 >= plan.cols) return next; // past the end: unchanged
      var k = s.col + 1;
      var c = plan.columns[k];
      next.phase = 'look';
      next.col = k;
      if (c.borrow.need) {
        var j = c.borrow.lender;
        next.hist[j].push(next.hist[j][next.hist[j].length - 1] - 1);
        for (var i = j - 1; i > k; i--) next.hist[i].push(p.base, p.base - 1);
        next.hist[k].push(c.borrow.nt);
      }
      if (c.equal.need) { next.eTop[k] = true; next.eBot[k + 1] = true; }
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
    subtractColumns: subtractColumns,
    planOf: planOf,
    shownDigits: shownDigits,
    mistakeOf: mistakeOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
