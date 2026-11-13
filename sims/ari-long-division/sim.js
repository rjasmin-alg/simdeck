/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ari-long-division: long division in the Croatian layout, in any base 2–16 (SPEC.md).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The numbers are params as quantities (a: the dividend, b: the divisor); their digits come from the base, so a
   change of base keeps the quantity and rewrites the digits. The arithmetic part (divideColumns, invariantOf,
   multiplesOf, mistakeOf) works on plain values and is meant to be promotable to models/ with the other ari- models.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DIGITS = '0123456789ABCDEF';
  var MAX_DIVIDEND = 6;   // digits of the dividend in the base
  var MAX_DIVISOR = 3;    // digits of the divisor
  var MIN_BASE = 2;
  var MAX_BASE = 16;
  var MISTAKES = ['none', 'zero', 'dropped'];
  var LAYOUTS = ['short', 'long']; // kraći način (only the remainders) and dulji način (the partial products written)
  var MAX_A = Math.pow(16, MAX_DIVIDEND) - 1;
  var MAX_B = Math.pow(16, MAX_DIVISOR) - 1;

  // digitsOf, textOf, valueOf: from sims/ari-column-multiplication/sim.js @ c9a582e (itself from ari-column-addition;
  // COMMON.md §6: no ari- model in models/ yet). fitsIn and minBase take a limit per number here.

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

  /** True when the dividend has at most 6 digits and the divisor at most 3 in base b. */
  function fitsIn(values, b) {
    return digitsOf(values[0], b).length <= MAX_DIVIDEND && digitsOf(values[1], b).length <= MAX_DIVISOR;
  }

  /** The smallest base 2–16 in which both numbers fit (MAX_BASE + 1 if none). */
  function minBase(values) {
    for (var b = MIN_BASE; b <= MAX_BASE; b++) if (fitsIn(values, b)) return b;
    return MAX_BASE + 1;
  }

  /** The dividend and the divisor the params name, as quantities: whole, the dividend 0 … base⁶ − 1, the divisor 1 …
      base³ − 1 (without a base: 16). A bad URL value, even Infinity, is 0, so the divisor 1. Clamping to the base
      keeps the limits when the kit has already clamped a URL value to the range's maximum (?a=Infinity). */
  function numbersOf(p) {
    var b = p.base >= MIN_BASE && p.base <= MAX_BASE ? Math.floor(p.base) : MAX_BASE;
    var q = function (v, lo, hi) { var x = Number(v); return isFinite(x) ? Math.min(hi, Math.max(lo, Math.floor(x))) : lo; };
    return [q(p.a, 0, Math.pow(b, MAX_DIVIDEND) - 1), q(p.b, 1, Math.pow(b, MAX_DIVISOR) - 1)];
  }

  /**
   * Read a typed division in base b: "846 : 3"; :, ÷, / and spaces as separators, a–f as A–F.
   * Returns { values: [a, d] } or { error: 'digit'|'long'|'count'|'empty'|'zero', at }.
   */
  function parseList(text, b) {
    var src = String(text == null ? '' : text).trim();
    if (!src) return { error: 'count', at: '' };
    var parts = src.split(/[:÷/]/).map(function (s) { return s.trim(); });
    var words = [];
    for (var i = 0; i < parts.length; i++) {
      var ws = parts[i].split(/\s+/).filter(Boolean);
      if (!ws.length) return { error: 'empty', at: ':' };
      words = words.concat(ws);
    }
    if (words.length !== 2) {
      // a character that is not a digit is named first, so "8 4 6 : 3" and "846 : 3 : 2" still say why
      for (var w0 = 0; w0 < words.length; w0++) {
        for (var c0 = 0; c0 < words[w0].length; c0++) {
          var d0 = DIGITS.indexOf(words[w0][c0].toUpperCase());
          if (d0 < 0 || d0 >= b) return { error: 'digit', at: words[w0][c0] };
        }
      }
      return { error: 'count', at: String(words.length) };
    }
    var values = [];
    for (var j = 0; j < 2; j++) {
      var w = words[j].toUpperCase();
      for (var c = 0; c < w.length; c++) {
        var d = DIGITS.indexOf(w[c]);
        if (d < 0 || d >= b) return { error: 'digit', at: words[j][c] };
      }
      var stripped = w.replace(/^0+(?=.)/, '');
      if (stripped.length > (j === 0 ? MAX_DIVIDEND : MAX_DIVISOR)) return { error: 'long', at: words[j] };
      var v = 0;
      for (var k = 0; k < stripped.length; k++) v = v * b + DIGITS.indexOf(stripped[k]);
      values.push(v);
    }
    if (values[1] === 0) return { error: 'zero', at: '0' };
    return { values: values };
  }

  /** The params patch that sets these numbers. */
  function paramsFor(values) { return { a: values[0], b: values[1] }; }

  /**
   * Long division a : d in base `base` (SPEC.md, Plan; rules 1–7). mode: 'right' (default) or 'dropped' (the typical
   * mistake: each later number is the brought-down digit alone).
   * Returns { A (dividend digits, left first), n, g (digits of the first number), Q (quotient digits), steps: [{ i, num
   * (the number divided), end (the dividend place of its last digit), q, prod, rest, down (the digit brought down
   * after it, or null) }], quot (digits, left first), quotient, remainder }.
   */
  function divideColumns(a, d, base, mode) {
    var A = digitsOf(a, base).reverse();
    var n = A.length;
    var g = n, v = 0;
    for (var k = 0; k < n; k++) {
      v = v * base + A[k];
      if (v >= d) { g = k + 1; break; }
    }
    var num = 0;
    for (var x = 0; x < g; x++) num = num * base + A[x];
    var Q = n - g + 1;
    var steps = [];
    for (var i = 0; i < Q; i++) {
      var q = Math.floor(num / d);
      var rest = num - q * d;
      var down = i < Q - 1 ? A[g + i] : null;
      steps.push({ i: i, num: num, end: n - g - i, q: q, prod: q * d, rest: rest, down: down });
      if (down != null) num = mode === 'dropped' ? down : rest * base + down;
    }
    var quot = steps.map(function (s) { return s.q; });
    var quotient = quot.reduce(function (s, y) { return s * base + y; }, 0);
    return { A: A, n: n, g: g, Q: Q, steps: steps, quot: quot, quotient: quotient, remainder: steps[Q - 1].rest };
  }

  /** The whole division for these params; seq: the steps in order, { i, phase }. */
  function planOf(p) {
    var nums = numbersOf(p);
    var plan = divideColumns(nums[0], nums[1], p.base);
    plan.a = nums[0];
    plan.d = nums[1];
    plan.D = digitsOf(nums[1], p.base).reverse();
    plan.seq = [];
    plan.steps.forEach(function (s) {
      plan.seq.push({ i: s.i, phase: 'ask' });
      plan.seq.push({ i: s.i, phase: 'sub' });
      if (s.down != null) plan.seq.push({ i: s.i, phase: 'down' });
    });
    return plan;
  }

  /**
   * The invariant after the `sub` of quotient digit i (SPEC.md, rule 9): { done (already divided), left (still to
   * divide) } with a = d · done + left. i = −1: nothing divided yet.
   */
  function invariantOf(p, i) {
    var plan = planOf(p), base = p.base;
    if (i < 0) return { done: 0, left: plan.a };
    var s = plan.steps[Math.min(i, plan.Q - 1)];
    var done = 0;
    for (var j = 0; j <= s.i; j++) done = done * base + plan.quot[j];
    done *= Math.pow(base, s.end);
    return { done: done, left: plan.a - plan.d * done };
  }

  /** The multiples the "how many times" box lists for quotient digit i: [{ k, value, fits }], k = 1 … min(q + 1, base − 1). */
  function multiplesOf(p, i) {
    var plan = planOf(p), s = plan.steps[i];
    var top = Math.min(s.q + 1, p.base - 1);
    var out = [];
    for (var k = 1; k <= top; k++) out.push({ k: k, value: k * plan.d, fits: k * plan.d <= s.num });
    return out;
  }

  /**
   * A typical mistake on the same numbers (SPEC.md, Typical mistakes). Returns { kind, quot (the wrong quotient digits,
   * left first), keep (for zero: by right quotient digit, false where it is left out), steps (the wrong working, as
   * divideColumns), differs (by position from the left, over the longer of the two quotients), value, remainder,
   * text, rightText, same, check (wrong quotient · d + its remainder), first (the step that goes wrong: for zero the
   * first left-out 0 { i, num, end }; for dropped the first remainder left behind { i, rest, end, down, right (the right
   * next number), wrong } ) }.
   */
  function mistakeOf(p, kind) {
    var plan = planOf(p), base = p.base;
    var res = { kind: kind, first: null };
    if (kind === 'dropped') {
      var w = divideColumns(plan.a, plan.d, base, 'dropped');
      res.steps = w.steps;
      res.quot = w.quot;
      res.keep = w.quot.map(function () { return true; });
      res.remainder = w.remainder;
      for (var i = 0; i < w.Q - 1; i++) {
        if (w.steps[i].rest > 0) {
          res.first = { i: i, rest: w.steps[i].rest, end: w.steps[i].end, down: w.steps[i].down,
            right: w.steps[i].rest * base + w.steps[i].down, wrong: w.steps[i].down };
          break;
        }
      }
    } else {
      res.steps = plan.steps;
      res.keep = plan.quot.map(function (q, j) { return !(kind === 'zero' && j > 0 && q === 0); });
      res.quot = plan.quot.filter(function (q, j) { return res.keep[j]; });
      res.remainder = plan.remainder;
      var z = res.keep.indexOf(false);
      if (z >= 0) res.first = { i: z, num: plan.steps[z].num, end: plan.steps[z].end };
    }
    res.value = res.quot.reduce(function (s, y) { return s * base + y; }, 0);
    res.text = textOf(res.value, base);
    res.rightText = textOf(plan.quotient, base);
    res.same = res.value === plan.quotient && res.remainder === plan.remainder;
    res.check = res.value * plan.d + res.remainder;
    var len = Math.max(res.quot.length, plan.quot.length);
    res.differs = [];
    for (var j = 0; j < len; j++) res.differs.push(res.quot[j] !== plan.quot[j]);
    return res;
  }

  /**
   * The working under the line, row by row, for the layout (SPEC.md, Scene and Layouts): short: one row per quotient
   * digit, the remainder ending at end with the digit brought down beside it; long: before each remainder row the
   * partial product q · d, right-aligned under the number divided, a minus sign in the square left of that number, and
   * a rule over the remainder row under the number. Returns { cols (place squares: n, or n + 1 for the minus of the
   * first product), rows: [{ role: 'prod'|'rest', i, end, digits (ones first), minus (place) | down, rule { from, to }
   * | null }], numRow: [the row (0 = the line) holding the number divided by quotient digit i], restRow: [the row of
   * remainder i], hi: [the dividend place of the number's first digit] }. The steps are the same in both layouts.
   */
  function workingOf(p) {
    var plan = planOf(p), base = p.base, long = p.layout === 'long';
    var rows = [], numRow = [], restRow = [], hi = [];
    plan.steps.forEach(function (s, i) {
      // the number divided: on the line (digit 0), else the previous remainder with the digit brought down
      hi.push(i === 0 ? plan.n - 1 : s.end + digitsOf(plan.steps[i - 1].rest, base).length);
      numRow.push(i === 0 ? 0 : restRow[i - 1]);
      if (long) rows.push({ role: 'prod', i: i, end: s.end, digits: digitsOf(s.prod, base), minus: hi[i] + 1 });
      rows.push({ role: 'rest', i: i, end: s.end, digits: digitsOf(s.rest, base), down: s.down,
        rule: long ? { from: hi[i], to: s.end } : null });
      restRow.push(rows.length);
    });
    return { cols: long ? plan.n + 1 : plan.n, rows: rows, numRow: numRow, restRow: restRow, hi: hi };
  }

  /** v rounded half up to a multiple of place. */
  function roundTo(v, place) { return Math.floor((v + place / 2) / place) * place; }

  /**
   * The estimated partial quotient for quotient digit i (SPEC.md, rule 12): only for a two-digit divisor in base 10
   * (grade 4), else null. The number and the divisor are rounded half up to the tens (the divisor's leading place):
   * 98 : 12 → 100 : 10 = 10. The first try is that estimate, at most 9; a try whose product is too big is lowered by
   * one, a try that leaves a remainder ≥ the divisor is raised by one, until it fits. Returns { place, nr, dr, raw (the
   * estimate, maybe 10 or more), digit (raw is a digit), tries: [{ k, value (k · d), verdict: 'big'|'small'|'fits' }] }.
   */
  function estimateOf(p, i) {
    var plan = planOf(p);
    if (p.base !== 10 || plan.d < 10 || plan.d > 99) return null;
    var s = plan.steps[i], d = plan.d, place = 10;
    var nr = roundTo(s.num, place), dr = roundTo(d, place);
    var raw = Math.floor(nr / dr);
    var k = Math.min(raw, 9), tries = [];
    for (;;) {
      var v = k * d;
      if (v > s.num) { tries.push({ k: k, value: v, verdict: 'big' }); k--; }
      else if (s.num - v >= d) { tries.push({ k: k, value: v, verdict: 'small' }); k++; }
      else { tries.push({ k: k, value: v, verdict: 'fits' }); break; }
    }
    return { place: place, nr: nr, dr: dr, raw: raw, digit: raw <= 9, tries: tries };
  }

  function stepsOf(p) { return planOf(p).seq.length; }

  var logic = {
    DIGITS: DIGITS,
    MAX_DIVIDEND: MAX_DIVIDEND,
    MAX_DIVISOR: MAX_DIVISOR,
    MIN_BASE: MIN_BASE,
    MAX_BASE: MAX_BASE,
    MISTAKES: MISTAKES,
    LAYOUTS: LAYOUTS,
    /** The largest dividend and divisor a param may hold: six and three hexadecimal digits. */
    MAX_A: MAX_A,
    MAX_B: MAX_B,

    defaults: { a: 846, b: 3, base: 10, why: true, mistake: 'none', layout: 'short' },

    PRESETS: [
      { id: 'three-digit', params: { a: 846, b: 3 } },
      { id: 'first-two', params: { a: 1736, b: 7 } },
      { id: 'zero', params: { a: 618, b: 3, mistake: 'zero' } },
      { id: 'remainder', params: { a: 2023, b: 4 } },
      { id: 'two-digit', params: { a: 9876, b: 12 } },
      { id: 'base-2', params: { a: 46, b: 5, base: 2 } },
      { id: 'long', params: { a: 846, b: 3, layout: 'long' } },
      { id: 'long-two-digit', params: { a: 5517, b: 28, layout: 'long' } }
    ],

    /** Steps depend on the numbers: three per quotient digit (ask, subtract, bring down), the last without bring down. */
    steps: stepsOf,

    initial: function (p) {
      var plan = planOf(p);
      return { phase: 'start', i: -1, quot: [], rows: plan.steps.map(function () { return { rest: null, down: null }; }) };
    },

    /** State after step n from the state after step n − 1 (SPEC.md, One step). */
    step: function (s, n, p) {
      var plan = planOf(p);
      var next = { phase: s.phase, i: s.i, quot: s.quot.slice(),
        rows: s.rows.map(function (r) { return { rest: r.rest ? r.rest.slice() : null, down: r.down }; }) };
      var act = plan.seq[n - 1];
      if (!act) return next; // past the end: unchanged
      var st = plan.steps[act.i];
      next.phase = act.phase;
      next.i = act.i;
      if (act.phase === 'ask') next.quot.push(st.q);
      else if (act.phase === 'sub') next.rows[act.i].rest = digitsOf(st.rest, p.base);
      else next.rows[act.i].down = st.down;
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
    divideColumns: divideColumns,
    planOf: planOf,
    invariantOf: invariantOf,
    multiplesOf: multiplesOf,
    mistakeOf: mistakeOf,
    workingOf: workingOf,
    estimateOf: estimateOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
