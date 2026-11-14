/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for geo-triangles: a triangle is equilateral, isosceles or scalene by its sides (jednakostranični,
   jednakokračni, raznostranični) and right-angled or not by its angles (pravokutni), so a right triangle is also
   isosceles or scalene; from three given sides the compass finds the third vertex where two circles meet; when one
   side is as long as the other two together or longer, the circles do not meet and there is no triangle.
   A stepper with two modes on one sheet (24 × 12 squares, one square = 1 cm): `build` (construct ∆ABC from a, b, c
   in six steps) and `kind` (drag the vertices over the squared paper; five steps name, measure and sort it).
   Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic) after paper.js (the squared-paper model, copied from sims/geo-lines/paper.js @ 132bf88); node
   tests require() it. */
(function (root) {
  'use strict';
  var G = typeof module === 'object' && module.exports ? require('./paper.js') : root.SimdeckModels['squared-paper'];

  /** The paper: 24 × 12 squares of 1 cm, corners 0…24 by 0…12 (y grows upwards). */
  var W = 24, H = 12;
  var MODES = ['build', 'kind'];
  /** The given sides: whole cm, 1…9 (a triangle with sides up to 9 cm fits the sheet, SPEC rule 1). */
  var S_MIN = 1, S_MAX = 9;
  /** In mode build, side AB lies on the line y = Y0 (room for the ruler under it). */
  var Y0 = 2;
  /** The steps of each mode (SPEC rules 7 and 8); step n shows everything up to STEPS[n]. */
  var BUILD = ['given', 'base', 'arcA', 'arcB', 'meet', 'join', 'kind'];
  var KIND = ['draw', 'name', 'measure', 'sides', 'right', 'both'];
  var NAMES = ['A', 'B', 'C'];
  var SIDE = { A: 'a', B: 'b', C: 'c' }; // the side opposite each vertex

  function int(v, lo, hi, dflt) {
    var n = v === '' || v == null ? NaN : Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return Math.min(hi, Math.max(lo, n));
  }
  function pick(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }
  function dist2(p, q) { var d = G.sub(q, p); return G.dot(d, d); }

  /* ── lengths, from sims/geo-compass/sim.js @ 3c7b1ca (logic.compass.length), unchanged ── */
  /** A length from its square: { exact: true, cm } when it is a whole number of cm, else { exact: false, cm, mm }
      rounded to the nearest millimetre (5.831 cm → 5 cm 8 mm). */
  function length(d2) {
    var q = Math.round(Math.sqrt(d2));
    if (q * q === d2) return { exact: true, cm: q, mm: 0 };
    var mm = Math.round(10 * Math.sqrt(d2));
    return { exact: false, cm: Math.floor(mm / 10), mm: mm % 10 };
  }

  /* ── the triangle: the part of this model meant for models/squared-paper.js (catalogue §5.27; NOTES.md, Shared
        requests). Pure functions over plain data, no strings. A triangle's sides are given by their squares
        { a, b, c } (whole numbers): a = |BC|² opposite A, b = |CA|² opposite B, c = |AB|² opposite C. Every decision
        compares whole numbers, so it is exact; whole lengths a, b, c work the same once squared. ── */
  var tri = {
    /** The squared sides of the triangle with vertices A, B, C (corners). */
    sides2: function (A, B, C) { return { a: dist2(B, C), b: dist2(C, A), c: dist2(A, B) }; },

    /** Twice the signed area: > 0 when A, B, C go round anticlockwise, < 0 clockwise, 0 when they lie on one line
        (two of them in one place too). */
    turn: function (A, B, C) { return G.cross(G.sub(B, A), G.sub(C, A)); },

    /** By the sides (rule 4): 'equilateral' (all three equal), 'isosceles' (exactly two equal) or 'scalene'. */
    bySides: function (s) {
      if (s.a === s.b && s.b === s.c) return 'equilateral';
      if (s.a === s.b || s.b === s.c || s.a === s.c) return 'isosceles';
      return 'scalene';
    },

    /** The sides that are equally long, in the order a, b, c: [] for a scalene triangle (rule 4). */
    equal: function (s) {
      var out = [];
      ['a', 'b', 'c'].forEach(function (k) {
        var n = ['a', 'b', 'c'].filter(function (j) { return s[j] === s[k]; }).length;
        if (n > 1) out.push(k);
      });
      return out;
    },

    /** The angle at vertex V ('A', 'B' or 'C'), by the squared sides (the law the set square checks, rule 5):
        'right' when the two sides at V squared add up to the opposite one squared, 'acute' when they add up to more,
        'obtuse' when to less. */
    angleAt: function (s, V) {
      var opp = SIDE[V], q = 0;
      ['a', 'b', 'c'].forEach(function (k) { if (k !== opp) q += s[k]; });
      q -= s[opp];
      return q > 0 ? 'acute' : q === 0 ? 'right' : 'obtuse';
    },

    /** The vertex with the right angle, or null (rule 5). A triangle has at most one. */
    rightAt: function (s) {
      for (var i = 0; i < 3; i++) if (tri.angleAt(s, NAMES[i]) === 'right') return NAMES[i];
      return null;
    },

    /** The vertex with the biggest angle: opposite the longest side; a tie takes the first of A, B, C (rule 5). */
    biggest: function (s) {
      var best = 'A';
      NAMES.forEach(function (V) { if (s[SIDE[V]] > s[SIDE[best]]) best = V; });
      return best;
    },

    /**
     * Can whole lengths a, b, c make a triangle (rule 2)? The longest side against the other two together:
     * { is: 'yes' } when it is shorter, else { is: 'flat' (as long) or 'no' (longer), long: its name, sum: the other
     * two together, gap: long − sum }. Only one side can be as long as the other two together or longer.
     */
    exists: function (a, b, c) {
      var len = { a: a, b: b, c: c }, L = 'a';
      ['b', 'c'].forEach(function (k) { if (len[k] > len[L]) L = k; });
      var sum = a + b + c - len[L];
      if (len[L] < sum) return { is: 'yes', long: null, sum: sum, gap: 0 };
      return { is: len[L] === sum ? 'flat' : 'no', long: L, sum: sum, gap: len[L] - sum };
    },

    /**
     * Where the circle around A with radius b meets the circle around B with radius a, for A = (0, 0), B = (c, 0)
     * (rule 3): x = (b² + c² − a²) / 2c, and k = (2c · y)² = 4b²c² − (b² + c² − a²)², a whole number.
     * k > 0: two points (x, ±y), the construction takes the one above AB; k = 0: the circles touch on line AB (y = 0);
     * k < 0: they do not meet. k = (a + b + c)(−a + b + c)(a − b + c)(a + b − c), so its sign agrees with exists().
     */
    apex: function (a, b, c) {
      var n = b * b + c * c - a * a, k = 4 * b * b * c * c - n * n;
      return { xn: n, den: 2 * c, k: k, x: n / (2 * c), y: k > 0 ? Math.sqrt(k) / (2 * c) : k === 0 ? 0 : null };
    },

    /**
     * When there is no triangle (rule 6): where each circle crosses line AB on the side nearest the other circle, for
     * A = (0, 0), B = (c, 0). The radius b from A and the radius a from B laid along the line; between their ends is
     * the gap (long − sum; 0 when they touch). Returns { fa, fb } (x of each end).
     */
    feet: function (a, b, c) {
      var e = tri.exists(a, b, c);
      if (e.long === 'a') return { fa: -b, fb: c - a };  // a too long: both ends left of A
      if (e.long === 'b') return { fa: b, fb: c + a };   // b too long: both ends right of B
      return { fa: b, fb: c - a };                        // c too long (or a triangle): between A and B
    }
  };

  /** The kind of a triangle from its squared sides: what steps 3–5 (kind) and step 6 (build) show. */
  function kindOf(s) {
    var right = tri.rightAt(s), big = tri.biggest(s);
    var at = right || big;
    var longest = Math.max(s.a, s.b, s.c);
    return {
      sides: tri.bySides(s), equal: tri.equal(s),
      right: right, biggest: big, angle: tri.angleAt(s, at),
      // another angle is as big (equilateral, or isosceles with the two equal sides the longest)
      bigTie: ['a', 'b', 'c'].filter(function (k) { return s[k] === longest; }).length > 1,
      // the set square: its right-angle corner in `at`, one leg along the side to `along`, the other towards `toward`
      square: { at: at, along: NAMES[(NAMES.indexOf(at) + 1) % 3], toward: NAMES[(NAMES.indexOf(at) + 2) % 3] }
    };
  }

  var logic = {
    W: W, H: H, MODES: MODES, S_MIN: S_MIN, S_MAX: S_MAX, Y0: Y0, BUILD: BUILD, KIND: KIND,
    tri: tri, length: length,

    defaults: {
      mode: 'build', a: 5, b: 4, c: 6,
      ax: 5, ay: 2, bx: 15, by: 2, cx: 9, cy: 8
    },

    /** The presets (SPEC, Presets). Keys 1–8. */
    PRESETS: [
      { id: 'build', params: { mode: 'build', a: 5, b: 4, c: 6 } },
      { id: 'equi', params: { mode: 'build', a: 6, b: 6, c: 6 } },
      { id: 'iso', params: { mode: 'build', a: 6, b: 6, c: 4 } },
      { id: 'right', params: { mode: 'build', a: 5, b: 3, c: 4 } },
      { id: 'long', params: { mode: 'build', a: 2, b: 3, c: 7 } },
      { id: 'flat', params: { mode: 'build', a: 3, b: 4, c: 7 } },
      { id: 'right-iso', params: { mode: 'kind', ax: 8, ay: 2, bx: 14, by: 5, cx: 5, cy: 8 } },
      { id: 'near-eq', params: { mode: 'kind', ax: 8, ay: 2, bx: 14, by: 2, cx: 11, cy: 7 } }
    ],

    /** The mode, from the params (rule 9). */
    modeOf: function (p) { return pick(p.mode, MODES, 'build'); },

    /** Steps per demo: 6 in mode build, 5 in mode kind (rules 7, 8). */
    steps: function (p) { return logic.modeOf(p) === 'kind' ? KIND.length - 1 : BUILD.length - 1; },

    // ── mode build: construct ∆ABC from a, b, c ──
    build: function (p, n) {
      var a = int(p.a, S_MIN, S_MAX, 5), b = int(p.b, S_MIN, S_MAX, 4), c = int(p.c, S_MIN, S_MAX, 6);
      var ex = tri.exists(a, b, c), ap = tri.apex(a, b, c), ft = ex.is === 'yes' ? null : tri.feet(a, b, c);
      // rule 1: the figure is centred across the sheet: A, B and C, or (no triangle) A, B and the radii's ends
      var xs = ex.is === 'yes' ? [0, c, ap.x] : [0, c, ft.fa, ft.fb];
      var lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs);
      var x0 = (W - (hi - lo)) / 2 - lo;
      var A = [x0, Y0], B = [x0 + c, Y0];
      var C = ex.is === 'yes' ? [x0 + ap.x, Y0 + ap.y] : ex.is === 'flat' ? [x0 + ft.fa, Y0] : null;
      var sq = { a: a * a, b: b * b, c: c * c };
      var yes = ex.is === 'yes';
      var mistake = null;
      // rule 10: the named mistakes
      if (!yes && n >= 4) mistake = ex.is === 'no' ? 'always' : 'flatOk';
      return {
        mode: 'build', n: n, stepId: BUILD[n], last: n === BUILD.length - 1,
        a: a, b: b, c: c, exists: ex.is, long: ex.long, sum: ex.sum, gap: ex.gap,
        A: A, B: B, C: C, k: ap.k,
        feet: ft && { fa: [x0 + ft.fa, Y0], fb: [x0 + ft.fb, Y0] },
        // what each step adds (rule 7)
        base: n >= 1, arcA: n >= 2, arcB: n >= 3,
        apex: n >= 4 && C !== null,       // C where the arcs meet (or, flat, the one point where they touch)
        sides: n >= 5 && yes,             // AC and BC joined, the sides named
        compare: n >= 5 && !yes,          // the radii laid along line AB and the gap between their ends
        kind: n >= 6 && yes ? kindOf(sq) : null,
        compass: n === 2 ? { needle: 'A', open: b } : n === 3 ? { needle: 'B', open: a } : null,
        ruler: n === 1 ? 'AB' : n === 2 ? 'A' : n === 3 ? 'B' : null,
        mistake: mistake
      };
    },

    // ── mode kind: three corners of the squared paper ──
    kind: function (p, n) {
      var A = [int(p.ax, 0, W, 5), int(p.ay, 0, H, 2)];
      var B = [int(p.bx, 0, W, 15), int(p.by, 0, H, 2)];
      var C = [int(p.cx, 0, W, 9), int(p.cy, 0, H, 8)];
      var turn = tri.turn(A, B, C);
      var s2 = tri.sides2(A, B, C);
      var flat = turn === 0; // rule 11: three corners on one line (two in one place too) make no triangle
      var k = flat ? null : kindOf(s2);
      var len = { a: length(s2.a), b: length(s2.b), c: length(s2.c) };
      var onGrid = false, nearEq = false;
      if (k && k.right) {
        // the right angle's arms run along the grid lines (one arm has a zero part; the other is then too)
        var P = { A: A, B: B, C: C }, d = G.sub(P[k.square.along], P[k.right]);
        onGrid = d[0] === 0 || d[1] === 0;
      }
      if (k && k.sides === 'isosceles') {
        // rule 12: it looks equilateral: the longest and the shortest side differ by less than 1 cm
        var mx = Math.max(s2.a, s2.b, s2.c), mn = Math.min(s2.a, s2.b, s2.c);
        nearEq = Math.sqrt(mx) - Math.sqrt(mn) < 1;
      }
      var mistake = null;
      if (k && KIND[n] === 'sides' && nearEq) mistake = 'looks';
      if (k && KIND[n] === 'right' && k.right && !onGrid) mistake = 'tilted';
      if (k && KIND[n] === 'both' && k.right && k.sides === 'isosceles') mistake = 'rightIso';
      return {
        mode: 'kind', n: n, stepId: KIND[n], last: n === KIND.length - 1,
        A: A, B: B, C: C, flat: flat, anticlockwise: turn > 0,
        s2: s2, len: len,
        names: n >= 1 && !flat, measure: n >= 2 && !flat,
        bySides: n >= 3 && !flat, byAngle: n >= 4 && !flat, both: n >= 5 && !flat,
        kind: k, onGrid: onGrid, nearEq: nearEq,
        mistake: mistake
      };
    },

    /** State at step 0. */
    initial: function (p) { return logic.view(p, 0); },
    /** State after step n: each step adds to the drawing, so it is computed from the params and n alone. */
    step: function (s, n, p) { return logic.view(p, n); },
    view: function (p, n) {
      var m = logic.modeOf(p);
      var last = logic.steps(p);
      var k = Math.max(0, Math.min(last, Math.round(Number(n)) || 0));
      return m === 'kind' ? logic.kind(p, k) : logic.build(p, k);
    },

    /** The corner nearest to a point of the paper (x, y real): what a drag sets. Rounded half up, kept on the paper. */
    cornerAt: function (x, y) {
      return [Math.min(W, Math.max(0, Math.floor(x + 0.5))), Math.min(H, Math.max(0, Math.floor(y + 0.5)))];
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
