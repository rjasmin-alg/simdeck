/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ari-unknown-term: addition and subtraction are one fact read three ways (p + q = w, w − q = p,
   w − p = q), and so are multiplication and division (p · q = w, w : q = p, w : p = q); the unknown term of a
   sentence is found by the reading that has it alone (780 − b = 89 → b = 780 − 89) and checked by putting it back;
   an inequality (694 > c > 688) is a stretch of the number line. Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic) after numberline.js; node tests require() it. */
(function (root) {
  'use strict';
  var NL = typeof module === 'object' && module.exports ? require('./numberline.js') : root.SimdeckModels['number-line'];

  /** Grade 4 works with numbers up to a million (MAT OŠ A.4.1, B.4.1: 5871 + a = 7820, 12 395 < b < 12 402). */
  var MAX = 1000000;
  /** An inequality's stretch: hi − lo at most GAP_MAX, so every whole number on its line is a target to click. */
  var GAP_MAX = 20;
  /** Whole numbers shown on each side of the stretch. */
  var PAD = 3;
  /** A multiplication bar draws its pieces one by one up to this many; more are drawn 3 … 1. */
  var PIECES_MAX = 12;
  /** The narrowest part of an addition bar, as a share of the whole (labels must fit). */
  var MIN_SHARE = 0.15;
  /** The solving stages of a sentence: 0 the sentence, 1 the inverse, 2 the value, 3 the check. */
  var SHOW_EQ = 3;
  var SHOW_INEQ = 1;

  var OPS = ['add', 'sub', 'mul', 'div'];
  var FAMILY = { add: 'add', sub: 'add', mul: 'mul', div: 'mul' };
  /** The other operation of the pair: what the wrong step uses. */
  var SWAP = { add: 'sub', sub: 'add', mul: 'div', div: 'mul' };
  /** Which number of the fact stands in each place of a sentence: w the whole, p and q the parts (rule 2). */
  var ROLES = { add: ['p', 'q', 'w'], sub: ['w', 'q', 'p'], mul: ['p', 'q', 'w'], div: ['w', 'q', 'p'] };
  /** The three readings of one fact: p ∘ q = w, w ∘⁻¹ q = p, w ∘⁻¹ p = q (rule 3). */
  var READINGS = [['p', 'q', 'w'], ['w', 'q', 'p'], ['w', 'p', 'q']];
  /** Which reading a sentence is, and which reading has each number alone on the right. */
  var GIVEN = { add: 0, sub: 1, mul: 0, div: 1 };
  var ALONE = { w: 0, p: 1, q: 2 };
  var WAYS = ['right', 'swap'];
  var DIRS = ['lt', 'gt'];
  var LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

  function int(v, lo, hi, dflt) {
    var n = Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return Math.min(hi, Math.max(lo, n));
  }

  /** One operation on whole numbers: { v } or { why }: 'neg' (a difference below 0), 'frac' (a quotient that is not
      whole), 'zero' (division by 0), 'big' (over cap, when a cap is given). */
  function apply(op, x, y, cap) {
    var v;
    if (op === 'add') v = x + y;
    else if (op === 'sub') { if (y > x) return { why: 'neg' }; v = x - y; }
    else if (op === 'mul') v = x * y;
    else { if (y === 0) return { why: 'zero' }; if (x % y !== 0) return { why: 'frac' }; v = x / y; }
    if (cap != null && v > cap) return { why: 'big' };
    return { v: v };
  }

  /** Shares of a bar for parts of the given sizes: each at least min, the rest in proportion (equal for all 0). */
  function shares(values, min) {
    var n = values.length, sum = values.reduce(function (s, v) { return s + v; }, 0);
    var free = 1 - n * min;
    return values.map(function (v) { return min + free * (sum ? v / sum : 1 / n); });
  }

  /** The pieces a multiplication bar draws: all of them, or the first 3, a gap and the last when there are more than
      PIECES_MAX or the count is still unknown (hidden). */
  function piecesOf(count, hidden) {
    if (!hidden && count <= PIECES_MAX) return { count: count, head: count, tail: 0, elided: false };
    return { count: count, head: 3, tail: 1, elided: true };
  }

  /** Whole numbers written as in the curriculum: 5871, 12 395 (groups of three from 10 000 on, a no-break space). */
  function fmt(n) {
    var s = String(n);
    if (Math.abs(n) < 10000) return s;
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  var logic = {
    MAX: MAX, GAP_MAX: GAP_MAX, PAD: PAD, PIECES_MAX: PIECES_MAX, MIN_SHARE: MIN_SHARE, SHOW_EQ: SHOW_EQ, SHOW_INEQ: SHOW_INEQ,
    OPS: OPS, FAMILY: FAMILY, SWAP: SWAP, ROLES: ROLES, READINGS: READINGS, GIVEN: GIVEN, ALONE: ALONE,
    WAYS: WAYS, DIRS: DIRS, LETTERS: LETTERS,

    /** The curriculum's 780 − b = 89 (MAT OŠ B.3.1). pa, qa: the parts of the addition fact; pm, qm: of the
        multiplication fact (each family keeps its own numbers when the operation is switched). */
    defaults: { mode: 'eq', op: 'sub', u: 1, pa: 89, qa: 691, pm: 15, qm: 65, letter: 'b', way: 'right', show: 0,
      lo: 688, hi: 694, dir: 'gt', marks: 0 },

    PRESETS: [
      { id: 'minus', params: { mode: 'eq', op: 'sub', u: 1, pa: 89, qa: 691, letter: 'b' } },
      { id: 'plus', params: { mode: 'eq', op: 'add', u: 1, pa: 94, qa: 42, letter: 's' } },
      { id: 'minuend', params: { mode: 'eq', op: 'sub', u: 0, pa: 691, qa: 89, letter: 'a' } },
      { id: 'factor', params: { mode: 'eq', op: 'mul', u: 0, pm: 15, qm: 65, letter: 'f' } },
      { id: 'divisor', params: { mode: 'eq', op: 'div', u: 1, pm: 9, qm: 7, letter: 'b' } },
      { id: 'wrong', params: { mode: 'eq', op: 'sub', u: 1, pa: 89, qa: 691, letter: 'b', way: 'swap', show: 1 } },
      { id: 'between', params: { mode: 'ineq', lo: 688, hi: 694, dir: 'gt', letter: 'c' } },
      // 688 … 694 marked on the view 685 … 697: bits 3 … 9
      { id: 'ends', params: { mode: 'ineq', lo: 688, hi: 694, dir: 'gt', letter: 'c', marks: 1016 } },
      { id: 'big', params: { mode: 'ineq', lo: 12395, hi: 12402, dir: 'lt', letter: 'b' } }
    ],

    apply: apply,
    shares: shares,
    piecesOf: piecesOf,
    fmt: fmt,

    modeOf: function (p) { return p.mode === 'ineq' ? 'ineq' : 'eq'; },
    opOf: function (p) { return OPS.indexOf(p.op) >= 0 ? p.op : 'sub'; },
    letterOf: function (p) { return LETTERS.indexOf(p.letter) >= 0 ? p.letter : 'x'; },

    /** The fact of the sentence's family, made valid (rule 1): addition parts whole in 0…MAX, and a second part that
        would take the whole over MAX is lowered to MAX − p; multiplication parts whole in 1…MAX, the second lowered to
        ⌊MAX / p⌋. */
    factOf: function (p) {
      var fam = FAMILY[logic.opOf(p)];
      if (fam === 'add') {
        var pa = int(p.pa, 0, MAX, 0), qa = int(p.qa, 0, MAX, 0);
        if (pa + qa > MAX) qa = MAX - pa;
        return { fam: fam, p: pa, q: qa, w: pa + qa };
      }
      var pm = int(p.pm, 1, MAX, 1), qm = int(p.qm, 1, MAX, 1);
      if (pm * qm > MAX) qm = Math.floor(MAX / pm);
      return { fam: fam, p: pm, q: qm, w: pm * qm };
    },

    /** Everything the page shows for a sentence with one unknown term (mode eq). */
    sentence: function (p) {
      var op = logic.opOf(p), f = logic.factOf(p), fam = f.fam;
      var u = int(p.u, 0, 2, 1);
      var roles = ROLES[op], role = roles[u];
      var given = GIVEN[op], inv = ALONE[role];
      var direct = given === inv;
      var askedWay = WAYS.indexOf(p.way) >= 0 ? p.way : 'right';
      var way = direct ? 'right' : askedWay;            // nothing to undo when the unknown is the result (rule 6)
      var show = int(p.show, 0, SHOW_EQ, 0);
      var invOp = inv === 0 ? fam : SWAP[fam];
      var useOp = way === 'swap' ? SWAP[invOp] : invOp;
      var r = READINGS[inv];
      var x = f[r[0]], y = f[r[1]];
      var got = apply(useOp, x, y, MAX);
      var value = got.v == null ? null : got.v;
      // the check (rule 7): the value back in its place, the left side computed (no cap: it is only compared)
      var terms = roles.map(function (rl, i) { return i === u ? value : f[rl]; });
      var check = null;
      if (value != null) {
        var left = apply(op, terms[0], terms[1]);
        check = { terms: terms, left: left.v == null ? null : left.v, why: left.why || null, ok: left.v === terms[2] };
      }
      var pieces = fam === 'mul' ? piecesOf(f.p, role === 'p' && (show < 2 || way === 'swap')) : null;
      return {
        mode: 'eq', op: op, fam: fam, u: u, role: role, letter: logic.letterOf(p), show: show,
        way: way, wayAsked: askedWay, direct: direct,
        w: f.w, p: f.p, q: f.q,
        values: roles.map(function (rl) { return f[rl]; }),
        roles: roles.slice(),
        given: given, inv: inv,
        readings: READINGS.map(function (rd, i) {
          return { op: i === 0 ? fam : SWAP[fam], roles: rd.slice(), given: i === given, used: i === inv };
        }),
        inverse: { op: useOp, right: invOp, x: x, y: y, xr: r[0], yr: r[1] },
        value: value, why: got.why || null, truth: f[role], correct: value === f[role],
        check: check,
        shares: fam === 'add' ? shares([f.p, f.q], MIN_SHARE) : null,
        pieces: pieces
      };
    },

    /** The inequality made valid (rule 9): whole bounds in 0…MAX, swapped when reversed, at least 1 apart (an equal
        pair moves hi up, or lo down at MAX), at most GAP_MAX apart (hi is lowered). */
    boundsOf: function (p) {
      var lo = int(p.lo, 0, MAX, 0), hi = int(p.hi, 0, MAX, 0);
      if (lo > hi) { var t = lo; lo = hi; hi = t; }
      if (hi === lo) { if (hi < MAX) hi = lo + 1; else lo = hi - 1; }
      if (hi - lo > GAP_MAX) hi = lo + GAP_MAX;
      return { lo: lo, hi: hi };
    },

    /** The line of an inequality: PAD whole numbers each side of the bounds, slid inside 0…MAX (number line model). */
    ineqView: function (lo, hi) {
      return NL.view([lo, hi], { pad: 0, minSpan: hi - lo + 2 * PAD, maxTicks: 40, floor: 0, ceil: MAX });
    },

    /** Marks are a bit mask over the line's whole numbers, bit i for view.lo + i. */
    marksOf: function (mask, view) {
      var m = int(mask, 0, Number.MAX_SAFE_INTEGER, 0), out = [];
      for (var i = 0; i <= view.hi - view.lo; i++) if (Math.floor(m / Math.pow(2, i)) % 2 === 1) out.push(view.lo + i);
      return out;
    },
    maskOf: function (nums, view) {
      return nums.reduce(function (m, v) {
        var i = v - view.lo;
        return i >= 0 && i <= view.hi - view.lo && Math.floor(m / Math.pow(2, i)) % 2 === 0 ? m + Math.pow(2, i) : m;
      }, 0);
    },
    /** The mask with v marked or unmarked. */
    toggle: function (mask, view, v) {
      var marked = logic.marksOf(mask, view);
      var i = marked.indexOf(v);
      if (i >= 0) marked.splice(i, 1); else marked.push(v);
      return logic.maskOf(marked, view);
    },

    /** Everything the page shows for an inequality (mode ineq). */
    inequality: function (p) {
      var b = logic.boundsOf(p), lo = b.lo, hi = b.hi;
      var dir = DIRS.indexOf(p.dir) >= 0 ? p.dir : 'lt';
      var view = logic.ineqView(lo, hi);
      var marked = logic.marksOf(p.marks, view);
      var nums = [];
      for (var v = view.lo; v <= view.hi; v++) {
        nums.push({ v: v, inside: v > lo && v < hi, bound: v === lo || v === hi, marked: marked.indexOf(v) >= 0 });
      }
      var sol = nums.filter(function (n) { return n.inside; }).map(function (n) { return n.v; });
      var right = marked.filter(function (v) { return v > lo && v < hi; });
      var wrong = marked.filter(function (v) { return !(v > lo && v < hi); });
      var missing = sol.filter(function (v) { return marked.indexOf(v) < 0; });
      // the two halves as written: hi > c > lo is c < hi and c > lo; lo < c < hi is c > lo and c < hi
      var halves = dir === 'gt' ? [{ rel: 'lt', b: hi }, { rel: 'gt', b: lo }] : [{ rel: 'gt', b: lo }, { rel: 'lt', b: hi }];
      // putting each marked number back: which half holds
      var checks = marked.map(function (m) {
        var hold = halves.map(function (hf) { return hf.rel === 'lt' ? m < hf.b : m > hf.b; });
        return { v: m, hold: hold, ok: hold[0] && hold[1] };
      });
      return {
        mode: 'ineq', lo: lo, hi: hi, dir: dir, letter: logic.letterOf(p), show: int(p.show, 0, SHOW_INEQ, 0),
        view: view, nums: nums, solutions: sol, count: sol.length,
        marked: marked, right: right, wrong: wrong, missing: missing,
        complete: wrong.length === 0 && missing.length === 0,
        halves: halves, checks: checks
      };
    },

    /** The page's state (an explorer: one state, no steps). */
    initial: function (p) {
      return logic.modeOf(p) === 'ineq' ? logic.inequality(p) : logic.sentence(p);
    },

    /** The last solving stage of a mode. */
    showMax: function (p) { return logic.modeOf(p) === 'ineq' ? SHOW_INEQ : SHOW_EQ; },

    /**
     * The task field (rule 10): "780 − b = 89", "f · 65 = 975", "63 : b = 9", "694 > c > 688", "12 395 < b < 12 402".
     * Spaces anywhere are ignored; − – - are minus, · × * ⋅ times, : ÷ / divided by; one lower-case or capital letter
     * is the unknown. Returns { task } (params) or { error }: empty, form, letters (not exactly one letter), big (a
     * number over MAX), neg (the unknown would be below 0), frac (no whole number fits), rem (a division with a
     * remainder), zero (a 0 in a multiplication or division), mixed (< and > in one inequality), order (no number is
     * between the bounds as written), wide (bounds more than GAP_MAX apart).
     */
    parseTask: function (text) {
      var s = String(text == null ? '' : text)
        .replace(/[\s   ]+/g, '')
        .replace(/[−–—]/g, '-').replace(/[·×⋅∙*]/g, '*').replace(/[÷/]/g, ':');
      if (!s) return { error: 'empty' };
      var tok = '(\\d+|[A-Za-z])';
      var mi = s.match(new RegExp('^' + tok + '([<>])' + tok + '([<>])' + tok + '$'));
      if (mi) {
        if (!/^[A-Za-z]$/.test(mi[3]) || /[A-Za-z]/.test(mi[1] + mi[5])) return { error: 'letters' };
        if (mi[2] !== mi[4]) return { error: 'mixed' };
        var n1 = parseInt(mi[1], 10), n2 = parseInt(mi[5], 10);
        if (n1 > MAX || n2 > MAX) return { error: 'big' };
        var dir = mi[2] === '<' ? 'lt' : 'gt';
        var lo = dir === 'lt' ? n1 : n2, hi = dir === 'lt' ? n2 : n1;
        if (hi <= lo) return { error: 'order' };
        if (hi - lo > GAP_MAX) return { error: 'wide' };
        return { task: { mode: 'ineq', lo: lo, hi: hi, dir: dir, letter: mi[3].toLowerCase() } };
      }
      if (/[<>]/.test(s)) return { error: 'form' };
      var me = s.match(new RegExp('^' + tok + '([-+*:])' + tok + '=' + tok + '$'));
      if (!me) return { error: 'form' };
      var parts = [me[1], me[3], me[4]];
      var u = -1, letter = null, nums = [];
      for (var i = 0; i < 3; i++) {
        if (/^[A-Za-z]$/.test(parts[i])) { if (u >= 0) return { error: 'letters' }; u = i; letter = parts[i].toLowerCase(); nums.push(null); }
        else nums.push(parseInt(parts[i], 10));
      }
      if (u < 0) return { error: 'letters' };
      if (nums.some(function (n) { return n != null && n > MAX; })) return { error: 'big' };
      var op = { '+': 'add', '-': 'sub', '*': 'mul', ':': 'div' }[me[2]];
      var A = nums[0], B = nums[1], C = nums[2];
      var task = { mode: 'eq', op: op, u: u, letter: letter };
      var r;
      if (op === 'add') {
        // p + q = w
        if (u === 0) { r = apply('sub', C, B); if (r.why) return { error: r.why }; task.pa = r.v; task.qa = B; }
        else if (u === 1) { r = apply('sub', C, A); if (r.why) return { error: r.why }; task.pa = A; task.qa = r.v; }
        else { if (A + B > MAX) return { error: 'big' }; task.pa = A; task.qa = B; }
      } else if (op === 'sub') {
        // w − q = p
        if (u === 0) { if (B + C > MAX) return { error: 'big' }; task.pa = C; task.qa = B; }
        else if (u === 1) { r = apply('sub', A, C); if (r.why) return { error: r.why }; task.pa = C; task.qa = r.v; }
        else { r = apply('sub', A, B); if (r.why) return { error: r.why }; task.pa = r.v; task.qa = B; }
      } else {
        if (nums.some(function (n) { return n === 0; })) return { error: 'zero' };
        if (op === 'mul') {
          // p · q = w
          if (u === 0) { r = apply('div', C, B); if (r.why) return { error: r.why }; task.pm = r.v; task.qm = B; }
          else if (u === 1) { r = apply('div', C, A); if (r.why) return { error: r.why }; task.pm = A; task.qm = r.v; }
          else { if (A * B > MAX) return { error: 'big' }; task.pm = A; task.qm = B; }
        } else {
          // w : q = p
          if (u === 0) { if (B * C > MAX) return { error: 'big' }; task.pm = C; task.qm = B; }
          else if (u === 1) { r = apply('div', A, C); if (r.why) return { error: r.why }; task.pm = C; task.qm = r.v; }
          else { r = apply('div', A, B); if (r.why) return { error: r.why === 'frac' ? 'rem' : r.why }; task.pm = r.v; task.qm = B; }
        }
      }
      return { task: task };
    },

    /** The task as the field writes it. */
    taskText: function (s) {
      var sign = { add: '+', sub: '−', mul: '·', div: ':' };
      if (s.mode === 'ineq') {
        var rel = s.dir === 'lt' ? ' < ' : ' > ';
        return s.dir === 'lt' ? fmt(s.lo) + rel + s.letter + rel + fmt(s.hi) : fmt(s.hi) + rel + s.letter + rel + fmt(s.lo);
      }
      var t = s.values.map(function (v, i) { return i === s.u ? s.letter : fmt(v); });
      return t[0] + ' ' + sign[s.op] + ' ' + t[1] + ' = ' + t[2];
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
