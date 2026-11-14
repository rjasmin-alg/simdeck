/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for geo-angles: two rays (krakovi) from one vertex (vrh) V split the plane in two parts; the angle (kut) is
   the whole part between them, not the small arc that marks it; an angle is acute, right or obtuse by comparison with
   a right angle (the corner of a set square), not by the length of its arms; a point belongs to the angle or not; the
   angle aVb is read from arm a to arm b counter-clockwise.
   Three modes on one squared-paper plane (one square = 1 cm). Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic) after paper.js (the squared-paper model, copied from sims/geo-lines/paper.js @ 132bf88); node
   tests require() it. */
(function (root) {
  'use strict';
  var G = typeof module === 'object' && module.exports ? require('./paper.js') : root.SimdeckModels['squared-paper'];

  /** The paper: 24 × 12 squares of 1 cm, corners 0…24 by 0…12 (y grows upwards). */
  var W = 24, H = 12;
  var MODES = ['kind', 'point', 'name'];

  /* ── angles on squared paper: the part of this model meant for models/squared-paper.js (catalogue §5.27; NOTES.md,
        Shared requests). Pure functions over plain data, no strings. ── */

  /** The arms' directions: every shortest whole step with both parts at most 3, the whole way round, ordered
      anticlockwise from (1, 0). 32 of them; DIRS[i + 16] = −DIRS[i] and DIRS[i + 8] is DIRS[i] turned by a right angle
      (the set is the same after a quarter turn), so a right angle is always 8 places on. */
  var DIRS = [];
  for (var x = -3; x <= 3; x++) for (var y = -3; y <= 3; y++) if (G.gcd(x, y) === 1) DIRS.push([x, y]);
  // ordered exactly: the half-turn from (1, 0) up to just before (−1, 0) first, then the rest; within a half,
  // a before b when cross(a, b) > 0 (b is further anticlockwise). (paper.js's directions() gives line directions,
  // which point right or up, so it cannot give the arms of an angle.)
  function halfOf(v) { return v[1] > 0 || (v[1] === 0 && v[0] > 0) ? 0 : 1; }
  DIRS.sort(function (a, b) { return halfOf(a) - halfOf(b) || G.cross(b, a); });
  var N = DIRS.length; // 32
  var HALF = N / 2; // 16: the opposite direction
  var QUARTER = N / 4; // 8: a right angle
  /** Arms from 1 to 12 cm (the paper's width is 24). */
  var L_MIN = 1, L_MAX = 12;
  /** The arc that marks an angle: radius 1.5 cm, smaller for short arms (0.6 of the shorter arm), so it stays
      between them. */
  var ARC = 1.5;

  function mod(i, n) { return ((i % n) + n) % n; }

  var angle = {
    DIRS: DIRS,

    /** The kind of the angle from arm u to arm v, turning anticlockwise, both shortest whole steps (not zero):
        'acute', 'right' or 'obtuse' when it is less than a straight angle (cross(u, v) > 0), compared with a right
        angle by the sign of dot(u, v) (exact); 'straight' when the arms are opposite, 'zero' when they are the same
        ray, 'big' when it is more than a straight angle (cross(u, v) < 0). Grade 4 meets only the first three. */
    kindOf: function (u, v) {
      var c = G.cross(u, v), d = G.dot(u, v);
      if (c === 0) return d > 0 ? 'zero' : 'straight';
      if (c < 0) return 'big';
      return d > 0 ? 'acute' : d === 0 ? 'right' : 'obtuse';
    },

    /**
     * Where the corner t lies with respect to the angle from arm u to arm v (anticlockwise) with vertex at the corner
     * vx: 'vertex', 'armA', 'armB' (on an arm: the arms are rays, so past their drawn ends too), 'in' (between the
     * arms) or 'out'. The arms and the vertex belong to the angle. Exact (whole numbers). Works for a big angle too.
     */
    where: function (vx, u, v, t) {
      var w = G.sub(t, vx);
      if (w[0] === 0 && w[1] === 0) return 'vertex';
      if (G.cross(u, w) === 0 && G.dot(u, w) > 0) return 'armA';
      if (G.cross(v, w) === 0 && G.dot(v, w) > 0) return 'armB';
      var c = G.cross(u, v);
      var leftOfA = G.cross(u, w) > 0, rightOfB = G.cross(w, v) > 0;
      // less than a straight angle: between = left of a and right of b; more: anything not in the other part
      var inside = c > 0 ? leftOfA && rightOfB : c < 0 ? leftOfA || rightOfB : leftOfA;
      return inside ? 'in' : 'out';
    },

    /** Does the place say T belongs to the angle (the arms and the vertex do)? */
    belongs: function (where) { return where !== 'out'; },

    /** The direction nearest to the way (dx, dy), by the angle between them; a tie takes the lower index. */
    dirAt: function (dx, dy) {
      var a = Math.atan2(dy, dx), best = 0, bd = Infinity;
      for (var i = 0; i < N; i++) {
        var b = Math.atan2(DIRS[i][1], DIRS[i][0]);
        var d = Math.abs(a - b);
        d = Math.min(d, 2 * Math.PI - d);
        if (d < bd - 1e-12) { bd = d; best = i; }
      }
      return best;
    },

    /** The turn from arm a (index da) to the direction i, kept to 1 … 15 places anticlockwise (the angle stays
        less than a straight angle): the same direction gives 1; the opposite and the places past it up to three
        quarters give 15 (a straight angle is just out of reach); the last quarter gives 1. */
    turnTo: function (da, i) {
      var k = mod(i - da, N);
      if (k === 0) return 1;
      if (k >= HALF) return k < HALF + QUARTER ? HALF - 1 : 1;
      return k;
    },

    /** An arm's length from a drag: the distance in whole cm, within 1…12. */
    lenAt: function (dx, dy) { return Math.min(L_MAX, Math.max(L_MIN, Math.round(Math.hypot(dx, dy)))); }
  };

  function int(v, lo, hi, dflt) {
    var n = v === '' || v == null ? NaN : Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return Math.min(hi, Math.max(lo, n));
  }
  function pick(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }

  var GUESSES = { kind: ['acute', 'right', 'obtuse'], point: ['yes', 'no'], name: ['one', 'two'] };
  var DEF = {
    mode: 'kind', vx: 9, vy: 3, da: 0, kb: 6, la: 6, lb: 6, square: true,
    tx: 7, ty: 4, swap: false,
    hide: false, guess: ''
  };

  var logic = {
    W: W, H: H, MODES: MODES, N: N, HALF: HALF, QUARTER: QUARTER, L_MIN: L_MIN, L_MAX: L_MAX, GUESSES: GUESSES,
    angle: angle,

    defaults: DEF,

    /** The presets (SPEC, Presets). Keys 1–9. */
    PRESETS: [
      { id: 'kinds', params: { mode: 'kind', vx: 9, vy: 3, da: 0, kb: 6, la: 6, lb: 6, square: true } },
      { id: 'short', params: { mode: 'kind', vx: 11, vy: 4, da: 0, kb: 14, la: 2, lb: 2, square: true, hide: true } },
      { id: 'tilted', params: { mode: 'kind', vx: 10, vy: 2, da: 2, kb: 8, la: 5, lb: 5, square: true, hide: true } },
      { id: 'near', params: { mode: 'kind', vx: 9, vy: 3, da: 0, kb: 9, la: 7, lb: 7, square: true, hide: true } },
      { id: 'far', params: { mode: 'point', vx: 4, vy: 2, da: 0, kb: 4, la: 5, lb: 5, tx: 20, ty: 9, hide: true } },
      { id: 'arm', params: { mode: 'point', vx: 4, vy: 2, da: 0, kb: 4, la: 5, lb: 5, tx: 15, ty: 2, hide: true } },
      { id: 'outside', params: { mode: 'point', vx: 4, vy: 2, da: 0, kb: 4, la: 5, lb: 5, tx: 9, ty: 8, hide: true } },
      { id: 'name', params: { mode: 'name', vx: 12, vy: 5, da: 1, kb: 9, la: 5, lb: 5, swap: false, hide: true } },
      { id: 'swap', params: { mode: 'name', vx: 12, vy: 5, da: 1, kb: 9, la: 5, lb: 5, swap: true, hide: true } }
    ],

    /** Everything the page shows (an explorer: one state, no steps). */
    initial: function (p) {
      var mode = pick(p.mode, MODES, 'kind');
      // rule 1: the vertex on the paper, a square in from its edge; the arms 1…12 cm
      var v = [int(p.vx, 1, W - 1, DEF.vx), int(p.vy, 1, H - 1, DEF.vy)];
      var la = int(p.la, L_MIN, L_MAX, DEF.la), lb = int(p.lb, L_MIN, L_MAX, DEF.lb);
      // rule 2: arm a is one of the 32 directions; arm b is 1…15 places on, anticlockwise
      var da = mod(int(p.da, -1e6, 1e6, DEF.da), N);
      var kb = int(p.kb, 1, HALF - 1, DEF.kb);
      var db = (da + kb) % N;
      var u = DIRS[da], w = DIRS[db];
      // rule 3: the two parts of the plane. The smaller one (less than a straight angle) is part 1, from the first
      // ray to the second anticlockwise; the bigger one is part 2.
      var kind = angle.kindOf(u, w);
      var s = {
        mode: mode, v: v, da: da, db: db, kb: kb, u: u, w: w, la: la, lb: lb,
        kind: kind
      };
      // rule 6: naming. The arms' names: without a swap the first ray is a and the second b; swapped, the other way.
      // kut aVb is read from a to b anticlockwise: part 1 without a swap, part 2 swapped.
      s.swap = mode === 'name' && p.swap === true;
      s.named = s.swap ? 2 : 1;
      s.namedKind = s.swap ? angle.kindOf(w, u) : kind; // swapped: from b's ray round to a's, the bigger part
      // rule 4: the set square's corner at V, one leg on arm a (shown in mode kind, not while the class is asked)
      s.hide = p.hide === true;
      // and always once the class has answered: the set square decides, and the named mistakes refer to it
      s.square = mode === 'kind' && !s.hide && (p.square !== false || pick(p.guess, GUESSES.kind, '') !== '');
      // the arc's radius (drawn; rule 5)
      s.arc = Math.min(ARC, 0.6 * Math.min(la, lb));
      if (mode === 'point') {
        var t = [int(p.tx, 0, W, DEF.tx), int(p.ty, 0, H, DEF.ty)];
        var d = G.sub(t, v);
        var where = angle.where(v, u, w, t);
        s.t = t;
        s.where = where;
        s.inAngle = angle.belongs(where);
        s.d2 = G.dot(d, d);
        // rule 5: past the arc that marks the angle (|VT| > 1.5 cm), and past the arms' drawn ends
        s.pastArc = s.d2 > s.arc * s.arc;
        var end = where === 'armA' ? la : where === 'armB' ? lb : Math.max(la, lb);
        s.pastEnd = s.d2 > end * end;
      }
      // rule 7: the class's answer, judged against the question of the mode
      var g = pick(p.guess, GUESSES[mode], '');
      s.guess = g || null;
      s.answer = mode === 'kind' ? kind : mode === 'point' ? (s.inAngle ? 'yes' : 'no') : (s.named === 1 ? 'one' : 'two');
      s.right = g ? g === s.answer : null;
      s.mistake = g && !s.right ? logic.mistake(s) : null;
      return s;
    },

    /** rule 8: the typical mistake behind a wrong answer (a key; the page says it). */
    mistake: function (s) {
      if (s.mode === 'kind') {
        if (s.kind === 'right') return s.da % QUARTER === 0 ? 'notOnEdge' : 'tilted';
        if (s.guess === 'right') return 'nearRight';
        return 'arms';
      }
      if (s.mode === 'point') {
        if (s.inAngle) return s.where !== 'in' ? 'onArm' : s.pastArc ? 'arcOnly' : 'between';
        return 'otherPart';
      }
      return 'clockwise';
    },

    /** The corner nearest to a point of the paper (x, y real): what a click sets. Rounded half up, kept on the paper. */
    cornerAt: function (x, y) {
      return [Math.min(W, Math.max(0, Math.floor(x + 0.5))), Math.min(H, Math.max(0, Math.floor(y + 0.5)))];
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
