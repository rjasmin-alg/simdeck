/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for geo-lines: a segment has two ends, a ray one, a line none, so a point beyond the drawn part of a line can
   still lie on it; two lines meet in one point (sjecište) or are parallel, perpendicular ones at a right angle;
   parallel and perpendicular lines are drawn by sliding a set square along a ruler. Three modes on one squared-paper
   plane. Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic) after paper.js; node tests require() it. */
(function (root) {
  'use strict';
  var G = typeof module === 'object' && module.exports ? require('./paper.js') : root.SimdeckModels['squared-paper'];

  /** The paper at zoom 1: 24 × 12 squares, corners 0…24 by 0…12 (y grows upwards). Every point stays on it. */
  var W = 24, H = 12;
  var ZOOMS = [1, 2, 4];
  var MODES = ['parts', 'two', 'slide'];
  var KINDS = ['segment', 'ray', 'line'];
  var TOOLS = ['par', 'perp'];
  /** The directions line q can be turned to: shortest steps with both parts at most 6, by angle from (1, 0). */
  var DIR_MAX = 6;
  var DIRS = G.directions(DIR_MAX);
  /** The answers the class can give in each mode. */
  var GUESSES = { parts: ['on', 'off'], two: ['par', 'perp', 'cross'], slide: [] };

  function int(v, lo, hi, dflt) {
    var n = v === '' || v == null ? NaN : Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return Math.min(hi, Math.max(lo, n));
  }
  function pick(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }
  function pt(x, y, dx, dy) { return [int(x, 0, W, dx), int(y, 0, H, dy)]; }
  function same(a, b) { return a[0] === b[0] && a[1] === b[1]; }

  /** The view at zoom z: the paper's centre (12, 6) with z times the paper around it. */
  function viewOf(z) {
    return { x0: W / 2 - z * W / 2, y0: H / 2 - z * H / 2, x1: W / 2 + z * W / 2, y1: H / 2 + z * H / 2, z: z };
  }

  /** A shortest step from params (dx, dy): reduced first, then each part kept within ±DIR_MAX; (0, 0) or nonsense
      becomes (1, 0). (8, 4) → (2, 1); (7, 1) → (6, 1). */
  function dirOf(dx, dy) {
    var x = int(dx, -99, 99, NaN), y = int(dy, -99, 99, NaN);
    if (!isFinite(x) || !isFinite(y)) return [1, 0];
    var v = G.lineDir([x, y]);
    if (v[0] === 0 && v[1] === 0) return [1, 0];
    return G.lineDir([Math.min(DIR_MAX, Math.max(-DIR_MAX, v[0])), Math.min(DIR_MAX, Math.max(-DIR_MAX, v[1]))]);
  }

  var logic = {
    W: W, H: H, ZOOMS: ZOOMS, MODES: MODES, KINDS: KINDS, TOOLS: TOOLS, DIRS: DIRS, DIR_MAX: DIR_MAX,
    GUESSES: GUESSES,
    viewOf: viewOf,

    defaults: {
      mode: 'parts', kind: 'segment', reach: 0, zoom: '1',
      ax: 5, ay: 4, bx: 11, by: 7, tx: 17, ty: 10,
      pdx: 1, pdy: 0, turn: 0, tool: 'par', j: 0,
      hide: false, guess: ''
    },

    /** The presets (SPEC, Presets). Keys 1–8. */
    PRESETS: [
      { id: 'segment', params: { mode: 'parts', kind: 'segment', reach: 0, ax: 5, ay: 4, bx: 11, by: 7, tx: 17, ty: 10 } },
      { id: 'beyond', params: { mode: 'parts', kind: 'line', reach: 1, ax: 5, ay: 4, bx: 11, by: 7, tx: 19, ty: 11, hide: true } },
      { id: 'near', params: { mode: 'parts', kind: 'line', reach: 2, ax: 3, ay: 2, bx: 9, by: 5, tx: 21, ty: 10, hide: true } },
      { id: 'meet', params: { mode: 'two', ax: 2, ay: 3, pdx: 1, pdy: 0, tx: 12, ty: 8, turn: 12 } },
      { id: 'far', params: { mode: 'two', ax: 2, ay: 3, pdx: 1, pdy: 0, tx: 12, ty: 8, turn: 3, hide: true } },
      { id: 'perp', params: { mode: 'two', ax: 4, ay: 2, pdx: 2, pdy: 1, tx: 13, ty: 4, turn: 30, hide: true } },
      { id: 'slide', params: { mode: 'slide', tool: 'par', ax: 3, ay: 2, pdx: 2, pdy: 1, tx: 10, ty: 9, j: 0 } },
      { id: 'square', params: { mode: 'slide', tool: 'perp', ax: 2, ay: 3, pdx: 1, pdy: 0, tx: 15, ty: 9, j: 0 } }
    ],

    dirOf: dirOf,

    /** The index in DIRS of a line direction (nearest by angle when it is not in the list; it always is for
        |dx|, |dy| ≤ DIR_MAX). */
    turnOf: function (v) {
      var d = G.lineDir(v);
      for (var i = 0; i < DIRS.length; i++) if (same(DIRS[i], d)) return i;
      return 0;
    },

    // ── mode 'parts': a segment, a ray or a line through A and B, and a point T ──
    parts: function (p) {
      var kind = pick(p.kind, KINDS, 'segment');
      var a = pt(p.ax, p.ay, 5, 4), b = pt(p.bx, p.by, 11, 7), t = pt(p.tx, p.ty, 17, 10);
      // rule 1: B may not be A; it moves one square right (left at the right edge)
      var bMoved = same(a, b);
      if (bMoved) b = [a[0] < W ? a[0] + 1 : a[0] - 1, a[1]];
      var st = G.stepOf(a, b), u = st.u, m = st.m;
      // the paper at zoom 1: the parts of a line are seen on the school sheet (zoom belongs to mode 'two')
      var view = viewOf(1);
      // rule 2: the drawn part, in steps u from A: segment [0, m]; ray [0, m + reach]; line [−reach, m + reach]
      var rmax = logic.reachMax(a, u, m, kind, view);
      var reach = kind === 'segment' ? 0 : int(p.reach, 0, rmax, 0);
      var from = kind === 'line' ? -reach : 0;
      var to = kind === 'segment' ? m : m + reach;
      // rule 3: where T is
      var al = G.along(a, u, t);
      var k = al.k;
      var onFig = al.on && G.inFigure(kind, k, m);
      var where = !al.on ? 'off' : !onFig ? 'outside' : k >= from && k <= to ? 'drawn' : 'beyond';
      // rule 4: the lengthening that reaches T (beyond only)
      var need = where === 'beyond' ? (k < from ? -k : k - m) : null;
      // rule 5: how far T is from the line, in squares along the grid, when it is off: the nearest corner of the line
      // straight above or below T (or beside it, for a line steeper than 45°)
      var miss = null;
      if (!al.on) {
        var c = G.cross(u, G.sub(t, a));
        miss = Math.abs(u[0]) >= Math.abs(u[1]) ? { axis: 'y', by: Math.abs(c / u[0]) } : { axis: 'x', by: Math.abs(c / u[1]) };
      }
      return {
        kind: kind, a: a, b: b, t: t, bMoved: bMoved, u: u, m: m,
        reach: reach, reachMax: kind === 'segment' ? 0 : rmax, from: from, to: to,
        on: onFig, onLine: al.on, k: k, where: where, need: need, miss: miss,
        ends: kind === 'segment' ? 2 : kind === 'ray' ? 1 : 0,
        tAt: same(t, a) ? 'A' : same(t, b) ? 'B' : null,
        view: view
      };
    },

    /** The smallest lengthening at which the drawn part reaches the edge of the box on every open side: the slider's end. */
    reachMax: function (a, u, m, kind, box) {
      if (kind === 'segment') return 0;
      var c = G.clip(a, u, box); // the stretch of the line inside the box, in steps u from A
      var r = Math.max(0, Math.ceil(c[1]) - m);
      if (kind === 'line') r = Math.max(r, Math.ceil(-c[0]));
      return r;
    },

    // ── mode 'two': line p through A, line q through T turned to one of DIRS ──
    two: function (p) {
      var a = pt(p.ax, p.ay, 2, 3), t = pt(p.tx, p.ty, 12, 8);
      var u = dirOf(p.pdx, p.pdy);
      var turn = int(p.turn, 0, DIRS.length - 1, 0);
      var v = DIRS[turn];
      var z = Number(pick(String(p.zoom), ['1', '2', '4'], '1'));
      var view = viewOf(z);
      var mt = G.meet(a, u, t, v);
      var inView = mt.at ? G.inBox(mt.at, view) : null;
      var inPaper = mt.at ? G.inBox(mt.at, viewOf(1)) : null;
      // rule 8: the smallest zoom that shows S (null: not even the biggest)
      var zoomNeeded = null;
      if (mt.at) for (var i = 0; i < ZOOMS.length; i++) if (G.inBox(mt.at, viewOf(ZOOMS[i]))) { zoomNeeded = ZOOMS[i]; break; }
      var corner = mt.at && mt.at.x[1] === 1 && mt.at.y[1] === 1;
      return {
        a: a, t: t, u: u, v: v, turn: turn, turnPar: logic.turnOf(u), turnPerp: logic.turnOf(G.perp(u)),
        rel: mt.kind, at: mt.at, inView: inView, inPaper: inPaper, zoomNeeded: zoomNeeded, corner: !!corner,
        view: view
      };
    },

    // ── mode 'slide': the set square slides along the ruler to T ──
    slide: function (p) {
      var tool = pick(p.tool, TOOLS, 'par');
      var a = pt(p.ax, p.ay, 3, 2), t = pt(p.tx, p.ty, 10, 9);
      var u = dirOf(p.pdx, p.pdy);
      var target = G.slide(tool, a, u, 0, t).target;
      // rule 10: the slider reaches a little past 0 and past T on both sides, one square's worth of steps (|u|²)
      var uu = G.dot(u, u);
      var jLo = Math.min(0, target) - uu, jHi = Math.max(0, target) + uu;
      var j = int(p.j, jLo, jHi, 0);
      var sl = G.slide(tool, a, u, j, t);
      var done = j === target;
      // rule 11: past T when j has gone beyond the target, on the target's side
      var past = !done && target !== 0 && (target > 0 ? j > target : j < target);
      // which way the legs point from the corner: towards T (the drawing leg) and away from the ruler (the other)
      var w = G.sub(t, a);
      var alongEdge = tool === 'par' ? G.dot(u, w) : G.cross(u, w);
      return {
        tool: tool, a: a, t: t, u: u, j: j, jLo: jLo, jHi: jHi, target: target, done: done, past: past,
        onP: target === 0 && tool === 'par',
        edge: sl.edge, slideDir: sl.slide, corner: sl.corner,
        legSign: alongEdge < 0 ? -1 : 1,
        reachT: Math.abs(alongEdge) / Math.sqrt(uu), // T's distance from the ruler along the drawing leg, in squares
        rel: tool === 'perp' ? 'perp' : 'parallel',
        view: viewOf(1)
      };
    },

    /** Everything the page shows (an explorer: one state, no steps). */
    initial: function (p) {
      var mode = pick(p.mode, MODES, 'parts');
      var s = mode === 'parts' ? logic.parts(p) : mode === 'two' ? logic.two(p) : logic.slide(p);
      s.mode = mode;
      s.hide = mode !== 'slide' && p.hide === true;
      // rule 6 / 9: the class's answer, checked against the model
      var g = pick(p.guess, GUESSES[mode], '');
      s.guess = g || null;
      s.right = null;
      if (g && mode === 'parts') s.right = (g === 'on') === s.on;
      if (g && mode === 'two') s.right = logic.judge(g, s.rel);
      return s;
    },

    /** A guess about two lines against their relation (rule 9): 'yes', 'more' (true, and there is more to say:
        "they cross" for perpendicular lines) or 'no'. Same lines: no guess is right. */
    judge: function (g, rel) {
      if (rel === 'same') return 'no';
      if (g === 'par') return rel === 'parallel' ? 'yes' : 'no';
      if (g === 'perp') return rel === 'perp' ? 'yes' : 'no';
      return rel === 'perp' ? 'more' : rel === 'cross' ? 'yes' : 'no';
    },

    /** The corner nearest to a point of the paper (x, y real): what a click sets. Rounded half up, kept on the paper. */
    cornerAt: function (x, y) {
      return [Math.min(W, Math.max(0, Math.floor(x + 0.5))), Math.min(H, Math.max(0, Math.floor(y + 0.5)))];
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
