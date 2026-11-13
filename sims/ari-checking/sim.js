/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ari-checking: is a given result right? An estimate from rounded numbers catches a result that is off by a
   place; the inverse operation checks it exactly (SPEC.md). Any base 2–16.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The numbers are params as quantities (a, b: the two numbers; g: the given result; r: the given remainder of a
   division); their digits come from the base, so a change of base keeps the quantities and rewrites the digits.
   An explorer: no steps; initial(params) is everything the page draws. The arithmetic part (estimateOf, farOf,
   checkOf, wrongOf) is pure over plain values and promotable to models/ with the other ari- models.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DIGITS = '0123456789ABCDEF';
  var MIN_BASE = 2;
  var MAX_BASE = 16;
  var OPS = ['add', 'sub', 'mul', 'div'];
  var SIGN = { add: '+', sub: '−', mul: '·', div: ':' };
  /** Digits allowed in the base: [first number, second number]; the given result up to 7, its remainder up to 4. */
  var LIMITS = { add: [6, 6], sub: [6, 6], mul: [4, 3], div: [6, 3] };
  var MAX_G = 7;
  var MAX_R = 4;
  /** The wrong results the page can give, by operation, in the order they are tried (SPEC.md, Wrong results). */
  var WRONGS = { add: ['carry', 'lastCarry'], sub: ['borrow', 'align'], mul: ['carry', 'shift'], div: ['rest', 'zero'] };
  var MAX_V = Math.pow(16, 6) - 1;
  var MAX_GV = Math.pow(16, MAX_G) - 1;
  var MAX_RV = Math.pow(16, MAX_R) - 1;

  // digitsOf, textOf, valueOf: from sims/ari-long-division/sim.js @ 1160392 (itself from ari-column-multiplication and
  // ari-column-addition; COMMON.md §6: no ari- model in models/ yet).

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

  function pow(b, k) { return Math.pow(b, k); }
  /** The leading place of v (0 for one digit). */
  function leadOf(v, b) { return digitsOf(v, b).length - 1; }

  // ── rounding (SPEC.md, rules 1, 5) ──

  /** v rounded to place k, half up: the rest below the place rounds up when twice it is at least b^k. */
  function roundTo(v, k, b) {
    var p = pow(b, k);
    var q = Math.floor(v / p), rest = v - q * p;
    if (2 * rest >= p) q += 1;
    return q * p;
  }

  /** v rounded to its own leading place ("keep the first digit"); a one-digit number stays. */
  function roundLead(v, b) { return v < b ? v : roundTo(v, leadOf(v, b), b); }

  /** The fraction n / d (d ≥ 1) rounded to one significant digit, half up; below 1, to 0 or 1. */
  function roundQuot(n, d, b) {
    if (n < d) return 2 * n >= d ? 1 : 0;
    var k = 0;
    while (pow(b, k + 1) * d <= n) k++;
    var p = pow(b, k) * d;               // n / d = (n / p) · b^k, with 1 ≤ n / p < b
    var q = Math.floor(n / p), rest = n - q * p;
    if (2 * rest >= p) q += 1;
    return q * pow(b, k);
  }

  // ── the right result, the estimate, the check ──

  /** The right result: { value, rem } (rem only for a division). */
  function rightOf(op, a, c) {
    if (op === 'add') return { value: a + c, rem: null };
    if (op === 'sub') return { value: a - c, rem: null };
    if (op === 'mul') return { value: a * c, rem: null };
    var q = Math.floor(a / c);
    return { value: q, rem: a - q * c };
  }

  /**
   * The estimate from rounded numbers (SPEC.md, rules 3–6): { ra, rb (the rounded numbers), value, place (sub: the
   * place both were rounded to when the own leading places gave 0 or less; else null) }.
   */
  function estimateOf(op, a, c, b) {
    var ra, rb;
    if (op === 'div') {
      rb = roundLead(c, b);
      var e = roundQuot(a, rb, b);
      return { ra: e * rb, rb: rb, value: e, place: null };
    }
    ra = roundLead(a, b);
    rb = roundLead(c, b);
    if (op === 'add') return { ra: ra, rb: rb, value: ra + rb, place: null };
    if (op === 'mul') return { ra: ra, rb: rb, value: ra * rb, place: null };
    // sub: the rounded numbers must keep the top number bigger, or the estimate says nothing
    var place = null;
    if (a > c && ra - rb <= 0) {
      for (var k = Math.max(leadOf(a, b), leadOf(c, b)) - 1; k >= 0; k--) {
        ra = roundTo(a, k, b);
        rb = roundTo(c, k, b);
        place = k;
        if (ra - rb > 0) break;
      }
    }
    return { ra: ra, rb: rb, value: ra - rb, place: place };
  }

  /**
   * Is g about the size of the estimate e (SPEC.md, rule 7)? far when g ≥ √b · e or g ≤ e / √b (exactly √b: far), in
   * integers: g² ≥ b·e² or b·g² ≤ e². A 0 is near only a 0. off: 0 when near, else ±n places (n ≥ 1: the k with
   * g/e nearest b^k), + when g is bigger.
   */
  function farOf(g, e, b) {
    if (g === 0 || e === 0) return { far: g !== e, off: g === e ? 0 : g > e ? 1 : -1, zero: true };
    var big = Math.max(g, e), small = Math.min(g, e);
    var far = big * big >= b * small * small;
    if (!far) return { far: false, off: 0, zero: false };
    var n = 1;
    // n + 1 when big/small ≥ b^(n + 1/2): big² ≥ b^(2n+1) · small²
    while (big * big >= pow(b, 2 * n + 1) * small * small) n++;
    return { far: true, off: g > e ? n : -n, zero: false };
  }

  /**
   * The check by the inverse operation (SPEC.md, rule 9). add: g − b = a (less: g < b, cannot be); sub: g + b = a; mul:
   * g : b = a with remainder 0; div: g · b + r = a and r < b. Returns { value (what the check computes), rem (mul: the
   * remainder of g : b), prod (div: g · b), want (a), eq, remOk (div), less (add), ok }.
   */
  function checkOf(op, a, c, g, r) {
    var out = { value: null, rem: null, prod: null, want: a, eq: false, remOk: true, less: false, ok: false };
    if (op === 'add') {
      out.less = g < c;
      out.value = out.less ? null : g - c;
      out.eq = out.value === a;
    } else if (op === 'sub') {
      out.value = g + c;
      out.eq = out.value === a;
    } else if (op === 'mul') {
      out.value = Math.floor(g / c);
      out.rem = g - out.value * c;
      out.eq = out.value === a;
      out.remOk = out.rem === 0;
    } else {
      out.prod = g * c;
      out.value = out.prod + r;
      out.eq = out.value === a;
      out.remOk = r < c;
    }
    out.ok = out.eq && out.remOk;
    return out;
  }

  /** The places (ones first) where x and y differ, over the longer of the two. */
  function differs(x, y, b) {
    var dx = digitsOf(x, b), dy = digitsOf(y, b), out = [];
    for (var k = 0; k < Math.max(dx.length, dy.length); k++) if (dx[k] !== dy[k]) out.push(k);
    return out;
  }

  // ── wrong results (SPEC.md, Wrong results) ──

  /**
   * A typical wrong result on these numbers: { kind, g, r, at } or null when it does not apply (or gives the right
   * result). at: where it goes wrong, for the page's words (see SPEC.md).
   */
  function wrongOf(op, a, c, b, kind) {
    var R = rightOf(op, a, c);
    var A = digitsOf(a, b), C = digitsOf(c, b);
    var n = Math.max(A.length, C.length);
    var res = null;
    if (op === 'add' && kind === 'carry') {
      // the first carry is not added into the next column (a column of the numbers; the last carry is written anyway)
      var cy = 0;
      for (var k = 0; k < n && !res; k++) {
        var s = (A[k] || 0) + (C[k] || 0) + cy;
        cy = Math.floor(s / b);
        if (cy && k + 1 < n) res = { g: R.value - pow(b, k + 1), r: null, at: { k: k, sum: s } };
      }
    } else if (op === 'add' && kind === 'lastCarry') {
      // the carry out of the top column is not written: the sum loses its first digit
      if (digitsOf(R.value, b).length > n) res = { g: R.value - pow(b, n), r: null, at: { k: n } };
    } else if (op === 'sub' && kind === 'borrow') {
      // the first borrow is not paid back: the next column takes away one too few
      var bw = 0;
      for (var j = 0; j < A.length && !res; j++) {
        var d = A[j] - (C[j] || 0) - bw;
        bw = d < 0 ? 1 : 0;
        if (bw) res = { g: R.value + pow(b, j + 1), r: null, at: { k: j } };
      }
    } else if (op === 'sub' && kind === 'align') {
      // the shorter number written under the left digits: it is worth b^shift times as much
      var shift = A.length - C.length;
      if (shift > 0 && c > 0 && c * pow(b, shift) <= a) res = { g: a - c * pow(b, shift), r: null, at: { shift: shift, moved: c * pow(b, shift) } };
    } else if (op === 'mul' && kind === 'carry') {
      // in the partial products, in the Croatian written order (rows from the second factor's left digit, as
      // ari-column-multiplication writes them), the first carry into a next digit of the first factor is forgotten
      for (var jj = C.length - 1; jj >= 0 && !res; jj--) {
        var c2 = 0;
        for (var i = 0; i < A.length && !res; i++) {
          var p = A[i] * C[jj] + c2;
          c2 = Math.floor(p / b);
          if (c2 && i + 1 < A.length) res = { g: R.value - c2 * pow(b, i + 1 + jj), r: null, at: { i: i, j: jj, carry: c2, prod: p } };
        }
      }
    } else if (op === 'mul' && kind === 'shift') {
      // the partial products added without shifting them by their places
      if (C.length > 1) {
        var sum = 0;
        C.forEach(function (cj) { sum += a * cj; });
        res = { g: sum, r: null, at: { rows: C.length } };
      }
    } else if (op === 'div' && kind === 'rest') {
      // the last "how many times" one too small: the remainder is as big as the divisor or more
      if (R.value % b >= 1) res = { g: R.value - 1, r: R.rem + c, at: { q: R.value % b } };
    } else if (op === 'div' && kind === 'zero') {
      // a 0 in the quotient after its first digit is not written
      var Q = digitsOf(R.value, b).reverse();
      if (Q.length > 1 && Q.slice(1).indexOf(0) >= 0) {
        var kept = [Q[0]].concat(Q.slice(1).filter(function (x) { return x !== 0; }));
        res = { g: valueOf(kept.reverse(), b), r: R.rem, at: { zeros: Q.length - kept.length } };
      }
    }
    if (!res) return null;
    if (res.g === R.value && (op !== 'div' || res.r === R.rem)) return null;
    res.kind = kind;
    return res;
  }

  /** Which given result this is: 'right', one of WRONGS[op] (the first that gives it), or 'other'. */
  function kindOf(op, a, c, g, r, b) {
    var R = rightOf(op, a, c);
    if (g === R.value && (op !== 'div' || r === R.rem)) return 'right';
    var ks = WRONGS[op];
    for (var i = 0; i < ks.length; i++) {
      var w = wrongOf(op, a, c, b, ks[i]);
      if (w && w.g === g && (op !== 'div' || w.r === r)) return ks[i];
    }
    return 'other';
  }

  // ── params ──

  function opOf(p) { return OPS.indexOf(p.op) >= 0 ? p.op : 'sub'; }

  /** True when every number of the task fits the limits in base b. */
  function fitsIn(t, b) {
    var lim = LIMITS[t.op];
    return digitsOf(t.a, b).length <= lim[0] && digitsOf(t.b, b).length <= lim[1] &&
      digitsOf(t.g, b).length <= MAX_G && (t.op !== 'div' || digitsOf(t.r, b).length <= MAX_R);
  }

  /** The smallest base 2–16 in which the task fits (MAX_BASE + 1 if none). */
  function minBase(t) {
    for (var b = MIN_BASE; b <= MAX_BASE; b++) if (fitsIn(t, b)) return b;
    return MAX_BASE + 1;
  }

  /**
   * The task the params name, as quantities, clamped to the base's limits (without a valid base: 10, as analyse): whole numbers; the
   * second number at least 1 for mul and div, at most the first for sub; the given remainder only for div.
   */
  function numbersOf(p) {
    var b = p.base >= MIN_BASE && p.base <= MAX_BASE ? Math.floor(p.base) : 10;
    var op = opOf(p), lim = LIMITS[op];
    var q = function (v, lo, hi) { var x = Number(v); return isFinite(x) ? Math.min(hi, Math.max(lo, Math.floor(x))) : lo; };
    var a = q(p.a, 0, pow(b, lim[0]) - 1);
    var lo = op === 'mul' || op === 'div' ? 1 : 0;
    var c = q(p.b, lo, pow(b, lim[1]) - 1);
    if (op === 'sub' && c > a) c = a;
    var g = q(p.g, 0, pow(b, MAX_G) - 1);
    var r = op === 'div' ? q(p.r, 0, pow(b, MAX_R) - 1) : 0;
    return { op: op, a: a, b: c, g: g, r: r };
  }

  /** The params patch for a task. */
  function paramsFor(t) { return { op: t.op, a: t.a, b: t.b, g: t.g, r: t.op === 'div' ? t.r : 0 }; }

  /** The task as typed in the field: "846 − 378 = 478", "846 : 3 = 281, 3". */
  function taskText(t, b) {
    var s = textOf(t.a, b) + ' ' + SIGN[t.op] + ' ' + textOf(t.b, b) + ' = ' + textOf(t.g, b);
    return t.op === 'div' && t.r ? s + ', ' + textOf(t.r, b) : s;
  }

  var OP_OF = { '+': 'add', '-': 'sub', '−': 'sub', '–': 'sub', '·': 'mul', '⋅': 'mul', '.': 'mul', '*': 'mul', '×': 'mul', 'x': 'mul', 'X': 'mul',
    ':': 'div', '÷': 'div', '/': 'div' };

  /** Read one numeral in base b: { value } or { error: 'empty'|'gap'|'digit'|'long', at }. */
  function readNum(word, b, max) {
    var w = String(word).trim();
    if (!w) return { error: 'empty', at: '' };
    if (/\s/.test(w)) return { error: 'gap', at: w };
    for (var i = 0; i < w.length; i++) {
      var d = DIGITS.indexOf(w[i].toUpperCase());
      if (d < 0 || d >= b) return { error: 'digit', at: w[i] };
    }
    var stripped = w.toUpperCase().replace(/^0+(?=.)/, '');
    if (stripped.length > max) return { error: 'long', at: w };
    var v = 0;
    for (var k = 0; k < stripped.length; k++) v = v * b + DIGITS.indexOf(stripped[k]);
    return { value: v };
  }

  /**
   * Read a typed task in base b (SPEC.md, Params): "846 − 378 = 478"; signs + − - · * × x : ÷ /; a–f as A–F; after =
   * the given result, and for a division its remainder after a comma, "r", "ost" or "ostatak" (or in brackets). No =:
   * the given result is the right one. Returns { task: { op, a, b, g, r } } or { error, at }: 'empty' (nothing, or a
   * number missing), 'op' (not exactly one sign), 'gap' (a space inside a number), 'digit', 'long', 'neg' (sub: the second number bigger), 'zero' (mul
   * or div by 0), 'rest' (a remainder outside a division), 'count' (more than a result and a remainder).
   */
  function parseTask(text, b) {
    var src = String(text == null ? '' : text).trim();
    if (!src) return { error: 'empty', at: '' };
    var eq = src.split('=');
    if (eq.length > 2) return { error: 'count', at: '=' };
    var left = eq[0];
    var signs = [];
    for (var i = 0; i < left.length; i++) if (OP_OF[left[i]]) signs.push(i);
    if (signs.length !== 1) return { error: 'op', at: String(signs.length) };
    var op = OP_OF[left[signs[0]]];
    var lim = LIMITS[op];
    var A = readNum(left.slice(0, signs[0]), b, lim[0]);
    if (A.error) return A;
    var C = readNum(left.slice(signs[0] + 1), b, lim[1]);
    if (C.error) return C;
    if (op === 'sub' && C.value > A.value) return { error: 'neg', at: '' };
    if ((op === 'mul' || op === 'div') && C.value === 0) return { error: 'zero', at: '0' };
    var R = rightOf(op, A.value, C.value);
    var task = { op: op, a: A.value, b: C.value, g: R.value, r: op === 'div' ? R.rem : 0 };
    if (eq.length === 2) {
      // the remainder's word (r, ost., ostatak, rem, remainder; a colon after it) may touch the number: "281 r3"
      var words = eq[1].replace(/(ostatak|remainder|ost|rem|r)\.?\s*:?/gi, ' ').replace(/[(),;]/g, ' ').split(/\s+/)
        .filter(function (w) { return w; });
      if (!words.length) return { error: 'empty', at: '=' };
      if (words.length > 2) return { error: 'count', at: String(words.length) };
      if (words.length === 2 && op !== 'div') return { error: 'rest', at: words[1] };
      var G = readNum(words[0], b, MAX_G);
      if (G.error) return G;
      task.g = G.value;
      task.r = 0;
      if (words.length === 2) {
        var Rr = readNum(words[1], b, MAX_R);
        if (Rr.error) return Rr;
        task.r = Rr.value;
      }
    }
    return { task: task };
  }

  /** Everything the page draws, from the params (SPEC.md, State). */
  function analyse(p) {
    var b = p.base >= MIN_BASE && p.base <= MAX_BASE ? Math.floor(p.base) : 10;
    var t = numbersOf(p);
    var R = rightOf(t.op, t.a, t.b);
    var E = estimateOf(t.op, t.a, t.b, b);
    var near = farOf(t.g, E.value, b);
    var rough = farOf(R.value, E.value, b).far;
    var chk = checkOf(t.op, t.a, t.b, t.g, t.r);
    var correct = t.g === R.value && (t.op !== 'div' || t.r === R.rem);
    var kind = kindOf(t.op, t.a, t.b, t.g, t.r, b);
    var w = kind !== 'right' && kind !== 'other' ? wrongOf(t.op, t.a, t.b, b, kind) : null;
    return {
      op: t.op, a: t.a, b: t.b, g: t.g, r: t.r, base: b,
      right: R.value, rightRem: R.rem, correct: correct,
      est: E, size: near, rough: rough,
      // the estimate's verdict: 'far' (caught), 'near' (not caught: the check decides), 'rough' (the estimate is too
      // rough here: even the right result is far from it)
      verdict: rough ? 'rough' : near.far ? 'far' : 'near',
      // digits of the given result minus digits of the estimate: a place too many (> 0) or too few (< 0)
      places: digitsOf(t.g, b).length - digitsOf(E.value, b).length,
      check: chk,
      wrongDigits: correct ? [] : differs(t.g, R.value, b),
      checkDigits: chk.value == null ? [] : differs(chk.value, t.a, b),
      kind: kind,
      at: w ? w.at : null
    };
  }

  var logic = {
    DIGITS: DIGITS,
    MIN_BASE: MIN_BASE,
    MAX_BASE: MAX_BASE,
    OPS: OPS,
    SIGN: SIGN,
    LIMITS: LIMITS,
    MAX_G: MAX_G,
    MAX_R: MAX_R,
    WRONGS: WRONGS,
    /** The largest values a param may hold: the base-16 limits. */
    MAX_V: MAX_V,
    MAX_GV: MAX_GV,
    MAX_RV: MAX_RV,

    defaults: { op: 'sub', a: 846, b: 378, g: 478, r: 0, base: 10, est: false, chk: false },

    PRESETS: [
      { id: 'borrow', params: { op: 'sub', a: 846, b: 378, g: 478, r: 0 } },
      { id: 'sum', params: { op: 'add', a: 457, b: 368, g: 825, r: 0 } },
      { id: 'shift', params: { op: 'mul', a: 457, b: 36, g: 4113, r: 0 } },
      { id: 'zero', params: { op: 'div', a: 618, b: 3, g: 26, r: 0 } },
      { id: 'remainder', params: { op: 'div', a: 846, b: 3, g: 281, r: 3 } },
      { id: 'base-2', params: { op: 'mul', a: 13, b: 5, g: 26, r: 0, base: 2 } }
    ],

    /** An explorer: everything the stage shows comes from the params. */
    initial: analyse,

    digitsOf: digitsOf,
    textOf: textOf,
    valueOf: valueOf,
    leadOf: leadOf,
    roundTo: roundTo,
    roundLead: roundLead,
    roundQuot: roundQuot,
    rightOf: rightOf,
    estimateOf: estimateOf,
    farOf: farOf,
    checkOf: checkOf,
    differs: differs,
    wrongOf: wrongOf,
    kindOf: kindOf,
    fitsIn: fitsIn,
    minBase: minBase,
    numbersOf: numbersOf,
    paramsFor: paramsFor,
    taskText: taskText,
    parseTask: parseTask,
    analyse: analyse
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
