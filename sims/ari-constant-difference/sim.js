/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ari-constant-difference: move both numbers of a difference by the same amount and the difference stays
   (stalnost razlike); move one addend up and the other down by the same amount and the sum stays (stalnost zbroja);
   the two typical wrong moves. Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic) after numberline.js; node tests require() it. */
(function (root) {
  'use strict';
  var NL = typeof module === 'object' && module.exports ? require('./numberline.js') : root.SimdeckModels['number-line'];

  /** Grade 3 computes with numbers up to 1000 (MAT OŠ A.3.2): every number on the page, and a sum, stays in 0…1000. */
  var MAX = 1000;
  /** The shift slider's widest reach. 110 is the equal-additions preset (503 − 178 = 613 − 288). */
  var K_MAX = 200;
  var OPS = ['sub', 'add'];
  var WAYS = ['right', 'one', 'flip'];

  /** How each number moves with the shift k: a2 = a + ca · k, b2 = b + cb · k (rule 2). */
  var COEF = {
    sub: { right: { a: 1, b: 1 }, one: { a: 0, b: 1 }, flip: { a: 1, b: -1 } },
    add: { right: { a: 1, b: -1 }, one: { a: 1, b: 0 }, flip: { a: 1, b: 1 } }
  };

  function int(v, lo, hi, dflt) {
    var n = Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return Math.min(hi, Math.max(lo, n));
  }
  function valueOf(op, a, b) { return op === 'add' ? a + b : a - b; }

  /** Is the pair a valid task: both in 0…MAX, a difference not below 0, a sum not above MAX. */
  function fits(op, a, b) {
    if (a < 0 || b < 0 || a > MAX || b > MAX) return false;
    return op === 'add' ? a + b <= MAX : b <= a;
  }

  /** The distance from v to its nearest ten (0 for a multiple of 10). */
  function toTen(v) { var r = v % 10; return Math.min(r, 10 - r); }

  /** The round number a mental step aims at: the nearest ten (5 rounds up), but 10 for 1…4; a ten that is not a
      hundred goes to the nearest hundred (50 rounds up); a hundred and 0 stay. */
  function roundOf(v) {
    if (v > 0 && v < 10) return 10; // never aim at 0: 1…4 go up to 10 (0 is not called round, rule 7)
    if (v % 10 !== 0) return Math.floor((v + 5) / 10) * 10;
    if (v % 100 !== 0) return Math.floor((v + 50) / 100) * 100;
    return v;
  }

  var logic = {
    MAX: MAX, K_MAX: K_MAX, OPS: OPS, WAYS: WAYS, COEF: COEF,

    defaults: { op: 'sub', a: 523, b: 198, k: 2, way: 'right', hide: false },

    /** The presets: the catalogue's two examples, taking from both, the two typical mistakes, equal additions. */
    PRESETS: [
      { id: 'round', params: { op: 'sub', a: 523, b: 198, k: 2 } },
      { id: 'take', params: { op: 'sub', a: 645, b: 203, k: -3 } },
      { id: 'sum', params: { op: 'add', a: 398, b: 245, k: 2 } },
      { id: 'one', params: { op: 'sub', a: 523, b: 198, k: 2, way: 'one', hide: true } },
      { id: 'same', params: { op: 'add', a: 398, b: 245, k: 2, way: 'flip', hide: true } },
      { id: 'equal', params: { op: 'sub', a: 503, b: 178, k: 110 } }
    ],

    valueOf: valueOf,
    fits: fits,
    roundOf: roundOf,

    /** The task from the params, made valid (rule 1): whole numbers in 0…MAX; a subtrahend above the minuend is
        lowered to it; a second addend that would take the sum over MAX is lowered to MAX − a. */
    numbersOf: function (p) {
      var op = OPS.indexOf(p.op) >= 0 ? p.op : 'sub';
      var a = int(p.a, 0, MAX, 0), b = int(p.b, 0, MAX, 0);
      if (op === 'sub' && b > a) b = a;
      if (op === 'add' && a + b > MAX) b = MAX - a;
      return { op: op, a: a, b: b };
    },

    wayOf: function (p) { return WAYS.indexOf(p.way) >= 0 ? p.way : 'right'; },

    /** The numbers after a shift k, moved the given way (rule 2). */
    moved: function (op, way, a, b, k) {
      var c = COEF[op][way];
      return { a2: a + c.a * k, b2: b + c.b * k };
    },

    /** The shifts that keep the moved task valid, an interval around 0 inside ±K_MAX (rule 3). */
    kRange: function (p) {
      var n = logic.numbersOf(p), way = logic.wayOf(p);
      var ok = function (k) { var m = logic.moved(n.op, way, n.a, n.b, k); return fits(n.op, m.a2, m.b2); };
      var lo = 0, hi = 0;
      while (hi < K_MAX && ok(hi + 1)) hi++;
      while (lo > -K_MAX && ok(lo - 1)) lo--;
      return { lo: lo, hi: hi };
    },

    /** The shift, a whole number inside kRange. */
    kOf: function (p) {
      var r = logic.kRange(p);
      return int(p.k, r.lo, r.hi, 0);
    },

    /** The number the shift is meant to make round (rule 4): in a difference the subtrahend; in a sum the addend
        nearer a ten, the first on a tie, and the first when the second does not move (only one moved). */
    targetOf: function (op, way, a, b) {
      if (op === 'sub') return 'b';
      if (COEF.add[way].b === 0) return 'a';
      return toTen(b) < toTen(a) ? 'b' : 'a';
    },

    /** The shift that makes the target round, from the current one (rule 5): { k, from, to, fits, why }. fits is
        false when the round number is out of reach; why is 'range' (the moved task would leave 0…MAX) or 'cap' (the
        task fits, but the shift would pass ±K_MAX); the page then keeps k. */
    roundShift: function (p) {
      var n = logic.numbersOf(p), way = logic.wayOf(p), k = logic.kOf(p);
      var tg = logic.targetOf(n.op, way, n.a, n.b);
      var m = logic.moved(n.op, way, n.a, n.b, k);
      var v = tg === 'a' ? m.a2 : m.b2;
      var r = roundOf(v);
      var c = COEF[n.op][way][tg];
      var nk = k + (r - v) * c; // c is 1 or -1
      var range = logic.kRange(p);
      var fitsIn = nk >= range.lo && nk <= range.hi;
      var mm = logic.moved(n.op, way, n.a, n.b, nk);
      var why = fitsIn ? null : fits(n.op, mm.a2, mm.b2) ? 'cap' : 'range';
      return { k: nk, from: v, to: r, fits: fitsIn, why: why };
    },

    /** Everything the page shows (an explorer: one state, no steps). */
    initial: function (p) {
      var n = logic.numbersOf(p), way = logic.wayOf(p), k = logic.kOf(p);
      var op = n.op, a = n.a, b = n.b;
      var m = logic.moved(op, way, a, b, k);
      var right = logic.moved(op, 'right', a, b, k);
      var r = valueOf(op, a, b), r2 = valueOf(op, m.a2, m.b2);
      var tg = logic.targetOf(op, way, a, b);
      var tv = tg === 'a' ? m.a2 : m.b2;
      var range = logic.kRange(p);
      // the main lines: a difference shows its two numbers; a sum starts at 0 and shows where the addends meet and end
      var main = op === 'sub' ? [a, b, m.a2, m.b2] : [0, a + b, m.a2 + m.b2, a, m.a2];
      // two lenses on the points that move: where each number went, and where the right move would have put it
      var lenses = op === 'sub'
        ? [{ role: 'b', from: b, to: m.b2, want: right.b2 }, { role: 'a', from: a, to: m.a2, want: right.a2 }]
        : [{ role: 'split', from: a, to: m.a2, want: right.a2 }, { role: 'end', from: a + b, to: m.a2 + m.b2, want: a + b }];
      lenses.forEach(function (l) {
        l.jump = NL.jump(l.from, l.to);
        l.ok = l.to === l.want;
        // a mistake can shift by more than the right move allows: then "where it should be" is outside 0…MAX and is
        // not shown (wantShown false), and the close-up does not stretch to it
        l.wantShown = !l.ok && l.want >= 0 && l.want <= MAX;
        l.view = NL.view(l.wantShown ? [l.from, l.to, l.want] : [l.from, l.to], { maxTicks: 10, pad: 0.15, minSpan: 10, ceil: MAX });
      });
      return {
        op: op, way: way, a: a, b: b, k: k, hide: !!p.hide,
        a2: m.a2, b2: m.b2, r: r, r2: r2, delta: r2 - r, same: r2 === r,
        coef: { a: COEF[op][way].a, b: COEF[op][way].b },
        target: tg, targetValue: tv, targetRound: tv > 0 && tv % 10 === 0, // 0 is not called round
        kLo: range.lo, kHi: range.hi,
        view: NL.view(main, { maxTicks: 10, pad: 0.06, minSpan: 10, ceil: MAX }),
        lenses: lenses
      };
    },

    /**
     * The task field: "523 − 198", "523-198", "398 + 245" (spaces anywhere between, − or - or –, one "=" at the end
     * ignored, as pupils write it). Returns
     * { task: { op, a, b } } or { error } with error one of: empty, op (not exactly one + or −), num (a part is not a
     * whole number), big (a number over MAX), neg (the subtrahend is larger: the difference would be below 0),
     * sum (a sum over MAX).
     */
    parseTask: function (text) {
      var s = String(text == null ? '' : text).replace(/[−–—]/g, '-').replace(/\s+/g, '').replace(/=$/, '');
      if (!s) return { error: 'empty' };
      var ops = s.match(/[+-]/g);
      if (!ops || ops.length !== 1) return { error: 'op' };
      var op = ops[0] === '+' ? 'add' : 'sub';
      var parts = s.split(/[+-]/);
      if (!/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) return { error: 'num' };
      var a = parseInt(parts[0], 10), b = parseInt(parts[1], 10);
      if (a > MAX || b > MAX) return { error: 'big' };
      if (op === 'sub' && b > a) return { error: 'neg' };
      if (op === 'add' && a + b > MAX) return { error: 'sum' };
      return { task: { op: op, a: a, b: b } };
    },

    /** The task as the field writes it. */
    taskText: function (n) { return n.a + (n.op === 'add' ? ' + ' : ' − ') + n.b; }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
