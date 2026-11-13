/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ari-times-ten: multiplying and dividing by 10, 100 and 1000 as moves in the place-value table (SPEC.md).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   A move multiplies by the base b (every digit one place left, a 0 fills the ones) or divides by it (one place right,
   the 0 of the ones leaves). · 10ᵏ and : 10ᵏ, written in base b, are k moves (10ᵏ in base b is bᵏ).
   digitsOf, textOf and parseNumber are from sims/ari-place-value/sim.js @ a3f3b18 (not in models/ yet; COMMON.md §6).
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DIGITS = '0123456789ABCDEF';
  var MIN_BASE = 2, MAX_BASE = 16;
  var MAX_VALUE = 1000000;   // grade 4 counts to a million (MAT OŠ A.4.1, A.4.3)
  var MIN_COLS = 4;
  var OPS = ['m1', 'm2', 'm3', 'd1', 'd2', 'd3'];
  var MISTAKES = ['none', 'few', 'middle'];

  // ── from sims/ari-place-value/sim.js @ a3f3b18 ──
  /** Digits of a non-negative integer v in base b, ones first. 0 is [0]. */
  function digitsOf(v, b) {
    var out = [], x = Math.floor(Math.abs(v));
    do { out.push(x % b); x = Math.floor(x / b); } while (x > 0);
    return out;
  }
  /** v written in base b, most significant digit first. */
  function textOf(v, b) { return digitsOf(v, b).reverse().map(function (d) { return DIGITS[d]; }).join(''); }
  /** Read a numeral typed in base b: { value } or { error: 'empty'|'digit'|'max'|'zero', at }. Spaces are ignored
      (a number may be typed in groups: 205 000). Changed here: the limit is a million, and 0 is refused. */
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
    if (v === 0) return { error: 'zero', at: s };
    return { value: v };
  }
  // ── end of the copy ──

  function round(v, lo, hi, dflt) {
    var x = Math.round(Number(v));
    if (v === '' || v == null || !isFinite(x)) return dflt;
    return Math.min(hi, Math.max(lo, x));
  }

  /** The params, whole and in range (SPEC "Params"). */
  function numbersOf(p) {
    var b = round(p.base, MIN_BASE, MAX_BASE, 10);
    var n = round(p.n, 1, MAX_VALUE, 47);
    var op = OPS.indexOf(p.op) >= 0 ? p.op : 'm2';
    var mistake = MISTAKES.indexOf(p.mistake) >= 0 ? p.mistake : 'none';
    return { n: n, b: b, op: op, kind: op[0] === 'm' ? 'mul' : 'div', k: Number(op[1]), mistake: mistake };
  }

  /** The whole demo (rules 1–7): rows [{ value, out }] (out: the digit that left the ones, dividing; null multiplying
      and in row 0), fail ('over' | 'stop' | null), the result, and the states step by step. */
  function demoOf(p) {
    var x = numbersOf(p), b = x.b;
    var rows = [{ value: x.n, out: null }];
    var states = [{ phase: 'start', i: 0 }];
    var fail = null, v = x.n;
    if (x.kind === 'mul' && x.n * Math.pow(b, x.k) > MAX_VALUE) {   // rule 5: exactly a million fits
      fail = 'over';
      states.push({ phase: 'over', i: 0 });
    } else {
      for (var j = 1; j <= x.k; j++) {
        if (x.kind === 'mul') {
          v = v * b;                                           // rule 2: a 0 fills the ones
          rows.push({ value: v, out: null });
        } else {
          var d = v % b;                                       // rule 3: the ones digit leaves
          v = (v - d) / b;
          rows.push({ value: v, out: d });
          if (d !== 0) { fail = 'stop'; states.push({ phase: 'stop', i: j }); break; }   // rule 6
        }
        states.push({ phase: 'move', i: j });
      }
      if (!fail) states.push({ phase: 'done', i: x.k });
    }
    return {
      n: x.n, b: b, op: x.op, kind: x.kind, k: x.k, rows: rows, fail: fail, states: states,
      result: fail ? null : v, steps: states.length - 1
    };
  }

  /** Whether an operation can be finished for n in base b: 'ok', 'over' (rule 5) or 'stop' (rule 6). */
  function statusOf(n, b, op) {
    var D = demoOf({ n: n, base: b, op: op });
    return D.fail || 'ok';
  }

  /** The table's width: the most digits any row of the demo has, at least MIN_COLS. */
  function colsOf(D) {
    var w = MIN_COLS;
    D.rows.forEach(function (r) { w = Math.max(w, digitsOf(r.value, D.b).length); });
    return w;
  }

  /** Where each non-zero digit of n goes: { d, from, to } (the Why box). Places are k with the ones at 0. */
  function movesOf(p) {
    var D = demoOf(p), s = D.kind === 'mul' ? D.k : -D.k, out = [];
    var ds = digitsOf(D.n, D.b);
    for (var k = ds.length - 1; k >= 0; k--) if (ds[k] !== 0) out.push({ d: ds[k], from: k, to: k + s });
    return out;
  }

  /** The typical mistake (SPEC "Typical mistakes"): { kind, applies, reason, wrong, wrongText, rightText, diff }.
      diff: the places where the wrong numeral differs from the right one (a digit or a missing digit). */
  function mistakeOf(p, kindIn) {
    var D = demoOf(p), b = D.b;
    var kind = kindIn || numbersOf(p).mistake;
    var out = { kind: kind, applies: false, reason: null, wrong: null, wrongText: null, rightText: null, diff: [] };
    if (kind === 'none') { out.reason = 'none'; return out; }
    if (D.fail) { out.reason = D.fail; return out; }
    out.rightText = textOf(D.result, b);
    if (kind === 'few') {
      var f = Math.pow(b, D.k - 1);
      out.wrong = D.kind === 'mul' ? D.n * f : D.n / f;
    } else if (kind === 'middle') {
      if (D.kind === 'mul') { out.reason = 'mul'; return out; }
      var s = textOf(D.n, b);
      for (var i = 0; i < D.k; i++) { var at = s.indexOf('0'); s = s.slice(0, at) + s.slice(at + 1); }
      if (s === out.rightText) { out.reason = 'same'; return out; }
      out.wrong = s.split('').reduce(function (v, ch) { return v * b + DIGITS.indexOf(ch); }, 0);
    } else { out.reason = 'none'; return out; }
    out.applies = true;
    out.wrongText = textOf(out.wrong, b);
    var r = digitsOf(D.result, b), w = digitsOf(out.wrong, b);
    for (var k = 0; k < Math.max(r.length, w.length); k++) if (r[k] !== w[k]) out.diff.push(k);
    return out;
  }

  var defaults = { n: 47, op: 'm2', base: 10, mistake: 'none' };

  var PRESETS = [
    { id: 'ten', params: { n: 34, op: 'm1', base: 10, mistake: 'none' } },
    { id: 'hundred', params: { n: 47, op: 'm2', base: 10, mistake: 'few' } },
    { id: 'thousand', params: { n: 205, op: 'm3', base: 10, mistake: 'none' } },
    { id: 'divide', params: { n: 3040, op: 'd1', base: 10, mistake: 'middle' } },
    { id: 'two-zeros', params: { n: 3470, op: 'd2', base: 10, mistake: 'none' } },
    { id: 'base-2', params: { n: 11, op: 'm2', base: 2, mistake: 'none' } }
  ];

  var logic = {
    DIGITS: DIGITS, MIN_BASE: MIN_BASE, MAX_BASE: MAX_BASE, MAX_VALUE: MAX_VALUE, MIN_COLS: MIN_COLS, OPS: OPS,
    MISTAKES: MISTAKES, PRESETS: PRESETS, defaults: defaults,
    digitsOf: digitsOf, textOf: textOf, parseNumber: parseNumber, numbersOf: numbersOf, demoOf: demoOf,
    statusOf: statusOf, colsOf: colsOf, movesOf: movesOf, mistakeOf: mistakeOf,

    /** k + 1 when the operation is done; 1 over a million; j when move j stops (rule 4–6). */
    steps: function (p) { return demoOf(p).steps; },

    initial: function () { return { phase: 'start', i: 0 }; },

    /** The state after step n: the demo's n-th state (a plan computed from the params, so replay is exact). */
    step: function (s, n, p) {
      var st = demoOf(p).states;
      var x = st[Math.min(n, st.length - 1)];
      return { phase: x.phase, i: x.i };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
