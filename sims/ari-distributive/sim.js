/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ari-distributive: an array of a rows of b dots; a cut splits it into two parts, so a · b = a · p + a · q
   (multiplying a sum), and (p + q) : a = p : a + q : a when each part divides (dividing a sum); the written form is the
   cut after the full tens; the typical mistake multiplies or divides only the first addend. Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** At most 9 rows (a one-digit factor or divisor) and 99 columns: the array stays drawable (rule 1). */
  var A_MAX = 9;
  var B_MAX = 99;
  var OPS = ['mul', 'div'];
  var WAYS = ['right', 'one'];

  function int(v, lo, hi, dflt) {
    var n = Math.round(Number(v));
    if (v === null || v === '' || typeof v === 'boolean' || !isFinite(n)) n = dflt;
    return Math.min(hi, Math.max(lo, n));
  }

  var logic = {
    A_MAX: A_MAX, B_MAX: B_MAX, OPS: OPS, WAYS: WAYS,

    defaults: { op: 'mul', a: 4, b: 23, p: 20, way: 'right', hide: false },

    /** The presets (SPEC.md, Presets): the catalogue's two examples, the written form, a split that does not divide,
        the two typical mistakes (asked first). */
    PRESETS: [
      { id: 'split', params: { op: 'mul', a: 4, b: 23, p: 20 } },
      { id: 'written', params: { op: 'mul', a: 6, b: 47, p: 40 } },
      { id: 'divide', params: { op: 'div', a: 4, b: 21, p: 80 } },
      { id: 'nodiv', params: { op: 'div', a: 4, b: 18, p: 70 } },
      { id: 'mistake', params: { op: 'mul', a: 4, b: 23, p: 20, way: 'one', hide: true } },
      { id: 'mistakeDiv', params: { op: 'div', a: 4, b: 21, p: 80, way: 'one', hide: true } }
    ],

    /** The task from the params, made valid (rule 1): { op, a, b, n, pMax }. */
    taskOf: function (prm) {
      var op = OPS.indexOf(prm.op) >= 0 ? prm.op : 'mul';
      var a = int(prm.a, 1, A_MAX, logic.defaults.a);
      var b = int(prm.b, 1, B_MAX, logic.defaults.b);
      var n = a * b;
      return { op: op, a: a, b: b, n: n, pMax: op === 'mul' ? b : n };
    },

    /** The cut, a whole number in 0…pMax (rule 1; not a number → 0). */
    pOf: function (prm) {
      var t = logic.taskOf(prm);
      return int(prm.p, 0, t.pMax, 0);
    },

    wayOf: function (prm) { return WAYS.indexOf(prm.way) >= 0 ? prm.way : 'right'; },

    /** The same cut in the other operation (the page calls it when the operation is switched): p columns → a · p dots;
        p dots → round(p / a) columns, half up. */
    convertP: function (fromOp, a, p) {
      return fromOp === 'mul' ? a * p : Math.floor(p / a + 0.5);
    },

    /** The cut of the written form (rule 7): after the full tens of columns. { p, trivial }. */
    placeCut: function (op, a, b) {
      var w = 10 * Math.floor(b / 10);
      return { p: op === 'mul' ? w : a * w, trivial: w === 0 || w === b };
    },

    /** The written form's steps (rule 8), as numbers; the page says them. */
    written: function (op, a, b) {
      var T = Math.floor(b / 10), U = b % 10;
      if (op === 'mul') {
        var u = U * a, carry = Math.floor(u / 10);
        if (!T) return { op: op, steps: [{ kind: 'mulOnly', d: U, a: a, prod: u }], result: a * b, carry: 0 };
        var tp = T * a;
        return {
          op: op, result: a * b, carry: carry,
          steps: [
            { kind: 'mulOnes', d: U, a: a, prod: u, write: u % 10, carry: carry, part: 2 },
            { kind: 'mulTens', d: T, a: a, prod: tp, carryIn: carry, sum: tp + carry, write: tp + carry, part: 1 }
          ]
        };
      }
      var n = a * b;
      if (!T) return { op: op, n: n, steps: [{ kind: 'divOnly', num: n, a: a, quot: b }], result: b, work: [{ text: '0', end: 0 }] };
      var N = Math.floor(n / 10), r1 = N - a * T, R = 10 * r1 + n % 10;
      return {
        op: op, n: n, result: b,
        steps: [
          { kind: 'divTens', num: N, a: a, quot: T, rem: r1, part: 1 },
          { kind: 'divOnes', num: R, a: a, quot: U, rem: 0, part: 2, down: n % 10 }
        ],
        // the working under the dividend (the shorter way): each line is its text and the place its last digit ends
        // under (0 = the ones of the dividend): r1 with the ones brought down, then the remainder 0
        work: [{ text: String(r1) + String(n % 10), end: 0 }, { text: '0', end: 0 }]
      };
    },

    /** Everything the page shows (an explorer: one state, no steps). */
    initial: function (prm) {
      var t = logic.taskOf(prm), p = logic.pOf(prm), way = logic.wayOf(prm);
      var op = t.op, a = t.a, b = t.b, n = t.n;
      var q = t.pMax - p;
      var trivial = p === 0 || q === 0;
      var c, r, divides = true;
      if (op === 'mul') { c = p; r = 0; } else { c = Math.floor(p / a); r = p % a; divides = r === 0; }

      // the parts (rule 3, 4): values of the two terms; null where a part does not divide
      var parts = null, result = op === 'mul' ? n : b, right = result;
      if (!trivial) {
        if (op === 'mul') parts = [{ add: p, val: a * p }, { add: q, val: a * q }];
        else parts = [{ add: p, val: divides ? p / a : null }, { add: q, val: divides ? q / a : null }];
      }

      // the typical mistake (rule 6): only on a cut, and in div only on a split that divides
      var wrong = way === 'one' && !trivial && divides;
      var wideOk = true, cols = b;
      if (wrong) {
        if (op === 'mul') { parts[1] = { add: q, val: q, raw: true }; result = a * p + q; }
        else {
          parts[1] = { add: q, val: q, raw: true };
          result = p / a + q;
          wideOk = c + q <= B_MAX;
          if (wideOk) cols = c + q;
        }
      }

      // the cells (rule 5, 6): '1' part 1, '2' part 2, 'x' lost (mul mistake), 'o' phantom (div mistake)
      var rows = [];
      for (var i = 0; i < a; i++) {
        var s = '';
        for (var j = 0; j < cols; j++) {
          var one = j < c || (j === c && i < r);
          if (trivial) s += p === 0 ? '2' : '1';
          else if (one) s += '1';
          else if (wrong && i > 0 && (op === 'mul' || wideOk)) s += op === 'mul' ? 'x' : 'o';
          else s += '2';
        }
        rows.push(s);
      }

      var pc = logic.placeCut(op, a, b);
      return {
        op: op, a: a, b: b, n: n, p: p, q: q, way: way, hide: !!prm.hide,
        trivial: trivial, divides: divides, c: c, r: r,
        wrong: wrong, wideOk: wideOk,
        parts: parts,
        result: result, right: right, delta: result - right, ok: result === right && divides,
        check: op === 'div' ? result * a : null,   // the check of a quotient by multiplying (veza množenja i dijeljenja)
        lost: wrong ? (a - 1) * q : 0,
        cols: cols, rows: rows,
        place: { p: pc.p, trivial: pc.trivial, here: !pc.trivial && pc.p === p },
        written: logic.written(op, a, b)
      };
    },

    /**
     * The task field (rule 9): "4 · 23", "23 · 4", "4*23", "4x23", "84 : 4", "84/4", "84 ÷ 4". Returns
     * { task: { op, a, b } } or { error } with error one of empty, op, num, zero, two, big, divisor, rem.
     */
    parseTask: function (text) {
      var s = String(text == null ? '' : text).replace(/\s+/g, '').replace(/=$/, '')
        .replace(/[·⋅×*xX]/g, '·').replace(/[:/÷]/g, ':');
      if (!s) return { error: 'empty' };
      var ops = s.match(/[·:]/g);
      if (!ops || ops.length !== 1) return { error: 'op' };
      var parts = s.split(/[·:]/);
      if (!/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) return { error: 'num' };
      var x = parseInt(parts[0], 10), y = parseInt(parts[1], 10);
      if (!x || !y) return { error: 'zero' };
      if (ops[0] === '·') {
        var a, b;
        if (x <= A_MAX) { a = x; b = y; } else if (y <= A_MAX) { a = y; b = x; } else return { error: 'two' };
        if (b > B_MAX) return { error: 'big' };
        return { task: { op: 'mul', a: a, b: b } };
      }
      if (y > A_MAX) return { error: 'divisor' };
      if (x % y) return { error: 'rem' };
      if (x / y > B_MAX) return { error: 'big' };
      return { task: { op: 'div', a: y, b: x / y } };
    },

    /** The task as the field writes it. */
    taskText: function (t) { return t.op === 'mul' ? t.a + ' · ' + t.b : (t.a * t.b) + ' : ' + t.a; }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
