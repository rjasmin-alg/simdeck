/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for geo-compass: a compass keeps one distance, so every point it draws is that distance from the centre: the
   circle (kružnica), whose radius (polumjer) is that distance; the disc (krug) is the circle with everything inside
   it; a point is inside, on or outside by comparing its distance from the centre with the radius; the compass also
   carries a length from one place to another, which is how a rectangle or a square with given sides is constructed.
   Three modes on one squared-paper plane (one square = 1 cm). Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic) after paper.js (the squared-paper model, copied from sims/geo-lines/paper.js @ 132bf88); node
   tests require() it. */
(function (root) {
  'use strict';
  var G = typeof module === 'object' && module.exports ? require('./paper.js') : root.SimdeckModels['squared-paper'];

  /** The paper: 24 × 12 squares of 1 cm, corners 0…24 by 0…12 (y grows upwards). */
  var W = 24, H = 12;
  var MODES = ['circle', 'point', 'build'];
  var ASKS = ['circle', 'disc'];
  /** The compass opens from 1 to 6 cm (a circle of 6 cm just fits the paper's height). */
  var R_MIN = 1, R_MAX = 6;
  /** A full turn of the compass in twelve parts. */
  var TURN = 12;
  /** The rectangle: sides a (along p) and b (up), whole cm; A is fixed. */
  var A_MIN = 1, A_MAX = 9, B_MIN = 1, B_MAX = 6;
  var A_PT = [2, 2];
  /** The given segments ("zadano") on the right of the paper. */
  var GIVEN_A = [14, 10], GIVEN_B = [14, 8];
  /** The construction's steps: 0 … LAST (SPEC rule 8). */
  var STEPS = ['given', 'line', 'takeA', 'markB', 'perps', 'takeB', 'markDC', 'join'];
  var LAST = STEPS.length - 1;

  function int(v, lo, hi, dflt) {
    var n = v === '' || v == null ? NaN : Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return Math.min(hi, Math.max(lo, n));
  }
  function pick(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }

  /* ── the compass on squared paper: the part of this model meant for models/squared-paper.js (catalogue §5.27;
        NOTES.md, Shared requests). Pure functions over plain data, no strings. ── */
  var compass = {
    /** The squared distance between two corners: whole, so every comparison with a whole radius is exact. */
    dist2: function (a, b) { var d = G.sub(b, a); return G.dot(d, d); },

    /** Where t lies with respect to the circle with centre c and whole radius r: 'in', 'on' or 'out', by comparing
        |ct|² with r² (exact). The centre itself is 'in'. */
    side: function (c, r, t) {
      var d2 = compass.dist2(c, t), r2 = r * r;
      return d2 < r2 ? 'in' : d2 === r2 ? 'on' : 'out';
    },

    /** Does t belong to the circle (kružnica: only 'on') and to the disc (krug: 'in' or 'on'; the circle is the
        disc's edge and belongs to it)? */
    belongs: function (c, r, t) {
      var w = compass.side(c, r, t);
      return { circle: w === 'on', disc: w !== 'out' };
    },

    /** A length from its square: { exact: true, cm } when it is a whole number of cm, else { exact: false, cm, mm }
        rounded to the nearest millimetre (5.099 cm → 5 cm 1 mm). */
    length: function (d2) {
      var q = Math.round(Math.sqrt(d2));
      if (q * q === d2) return { exact: true, cm: q, mm: 0 };
      var mm = Math.round(10 * Math.sqrt(d2));
      return { exact: false, cm: Math.floor(mm / 10), mm: mm % 10 };
    },

    /** How far a distance (from its square d2) is from the radius r, in whole millimetres: 0 only when they are
        equal; a difference under half a millimetre still counts as 1, so "not on" is never shown as 0 mm. */
    missMm: function (d2, r) {
      if (d2 === r * r) return 0;
      return Math.max(1, Math.round(10 * Math.abs(Math.sqrt(d2) - r)));
    }
  };

  /** r whole 1…6, and the centre kept so that the whole circle lies on the paper (touching the edge is on it). */
  function circleOf(p, sx, sy) {
    var r = int(p.r, R_MIN, R_MAX, 4);
    var s = [int(p.sx, r, W - r, sx), int(p.sy, r, H - r, sy)];
    return { r: r, s: s };
  }

  var logic = {
    W: W, H: H, MODES: MODES, ASKS: ASKS, R_MIN: R_MIN, R_MAX: R_MAX, TURN: TURN,
    A_MIN: A_MIN, A_MAX: A_MAX, B_MIN: B_MIN, B_MAX: B_MAX, STEPS: STEPS, LAST: LAST,
    compass: compass,

    defaults: {
      mode: 'circle', r: 4, sx: 12, sy: 6, tx: 14, ty: 8, sweep: 0, fill: true,
      ask: 'circle', a: 7, b: 4, step: 0,
      hide: false, guess: ''
    },

    /** The presets (SPEC, Presets). Keys 1–8. */
    PRESETS: [
      { id: 'draw', params: { mode: 'circle', r: 4, sx: 12, sy: 6, sweep: 0, fill: true } },
      { id: 'centre', params: { mode: 'point', r: 4, sx: 12, sy: 6, tx: 12, ty: 6, ask: 'circle', hide: true } },
      { id: 'inside', params: { mode: 'point', r: 4, sx: 12, sy: 6, tx: 14, ty: 8, ask: 'circle', hide: true } },
      { id: 'slanted', params: { mode: 'point', r: 5, sx: 12, sy: 6, tx: 15, ty: 10, ask: 'circle', hide: true } },
      { id: 'near', params: { mode: 'point', r: 5, sx: 12, sy: 6, tx: 17, ty: 7, ask: 'circle', hide: true } },
      { id: 'edge', params: { mode: 'point', r: 4, sx: 12, sy: 6, tx: 16, ty: 6, ask: 'disc', hide: true } },
      { id: 'rect', params: { mode: 'build', a: 7, b: 4, step: 0 } },
      { id: 'square', params: { mode: 'build', a: 5, b: 5, step: 0 } }
    ],

    // ── mode 'circle': open the compass to r and turn it around S ──
    circle: function (p) {
      var c = circleOf(p, 12, 6);
      var sweep = int(p.sweep, 0, TURN, 0);
      var closed = sweep === TURN;
      return {
        s: c.s, r: c.r, sweep: sweep, closed: closed,
        // rule 3: only a closed line bounds a disc, so the disc is coloured only when the circle is closed
        fill: closed && p.fill !== false,
        // rule 2: the pencil's marks so far, one at each twelfth passed (the start counts; closed, the last is the first)
        marks: closed ? TURN : sweep + 1
      };
    },

    // ── mode 'point': where is T, and does it belong to the circle and to the disc? ──
    point: function (p) {
      var c = circleOf(p, 12, 6);
      var t = [int(p.tx, 0, W, 14), int(p.ty, 0, H, 8)];
      var d2 = compass.dist2(c.s, t);
      var where = compass.side(c.s, c.r, t);
      var b = compass.belongs(c.s, c.r, t);
      return {
        s: c.s, r: c.r, t: t, d2: d2, r2: c.r * c.r, where: where,
        inCircle: b.circle, inDisc: b.disc, centre: d2 === 0,
        dist: compass.length(d2), miss: compass.missMm(d2, c.r),
        ask: pick(p.ask, ASKS, 'circle'),
        fill: true
      };
    },

    // ── mode 'build': carry the sides with the compass and construct a rectangle (or a square) ──
    build: function (p) {
      var a = int(p.a, A_MIN, A_MAX, 7);
      var b = int(p.b, B_MIN, B_MAX, 4);
      // rule 9: equal sides make a square (a rectangle whose sides are all equally long): one given segment, and the
      // compass stays open from a to b
      var shape = a === b ? 'square' : 'rect';
      var step = int(p.step, 0, LAST, 0);
      var A = A_PT, B = [A[0] + a, A[1]], D = [A[0], A[1] + b], C = [A[0] + a, A[1] + b];
      var ga = [GIVEN_A, [GIVEN_A[0] + a, GIVEN_A[1]]];
      var gb = shape === 'square' ? null : [GIVEN_B, [GIVEN_B[0] + b, GIVEN_B[1]]];
      // rule 8: what each step adds; the compass's opening and where it stands
      var open = step < 2 ? 0 : step < 5 ? a : b;
      var at = null; // the compass: needle and pencil
      if (step === 2) at = { needle: ga[0], pencil: ga[1] };
      if (step === 3) at = { needle: A, pencil: B };
      if (step === 5) at = gb ? { needle: gb[0], pencil: gb[1] } : { needle: A, pencil: B }; // a square: it stays open, b = a
      if (step === 6) at = { needle: B, pencil: C };
      if (step === 7) at = { needle: D, pencil: C }; // the check: |DC| = |AB|
      var arcs = [];
      if (step >= 3) arcs.push({ c: A, r: a, at: B });
      if (step >= 6) arcs.push({ c: A, r: b, at: D }, { c: B, r: b, at: C });
      if (step >= 7) arcs.push({ c: D, r: a, at: C });
      return {
        shape: shape, a: a, b: b, step: step, stepId: STEPS[step], last: step === LAST,
        A: A, B: B, C: C, D: D, given: { a: ga, b: gb },
        open: open, compass: at, arcs: arcs,
        line: step >= 1, // p through A
        pts: step >= 6 ? ['A', 'B', 'C', 'D'] : step >= 3 ? ['A', 'B'] : step >= 1 ? ['A'] : [],
        perps: step >= 4, // the perpendiculars to p at A and at B (the set square)
        square: step === 4, // the set square stands at B
        sides: step >= 7,
        // the ruler lies along p while p is drawn (step 1); joining D and C (step 7) needs no picture of it
        ruler: step === 1 ? 'p' : null,
        dc2: compass.dist2(D, C)
      };
    },

    /** Everything the page shows (an explorer: one state, no steps). */
    initial: function (p) {
      var mode = pick(p.mode, MODES, 'circle');
      var s = mode === 'circle' ? logic.circle(p) : mode === 'point' ? logic.point(p) : logic.build(p);
      s.mode = mode;
      // rule 7: the class is asked only about a point
      s.hide = mode === 'point' && p.hide === true;
      var g = mode === 'point' ? pick(p.guess, ['yes', 'no'], '') : '';
      s.guess = g || null;
      s.right = g ? (g === 'yes') === (s.ask === 'disc' ? s.inDisc : s.inCircle) : null;
      return s;
    },

    /** The corner nearest to a point of the paper (x, y real): what a click sets. Rounded half up, kept on the paper. */
    cornerAt: function (x, y) {
      return [Math.min(W, Math.max(0, Math.floor(x + 0.5))), Math.min(H, Math.max(0, Math.floor(y + 0.5)))];
    },

    /** The whole radius a drag of the pencil sets: the distance from S rounded to whole cm, within 1…6. */
    radiusAt: function (s, x, y) {
      return Math.min(R_MAX, Math.max(R_MIN, Math.round(Math.hypot(x - s[0], y - s[1]))));
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
