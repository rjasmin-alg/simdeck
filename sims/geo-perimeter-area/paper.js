/* SPDX-License-Identifier: AGPL-3.0-or-later
   Copied unchanged from sims/geo-lines/paper.js @ 132bf88 (only this line added); geo-perimeter-area builds on it.
   Squared-paper geometry (geometrija na kvadratnoj mreži): points on the corners of the squares, lines through two
   of them, where a point lies with respect to a segment, a ray or a line, how two lines meet, and the ruler and the
   set square as tools that slide. Shared model of catalogue §5.27, hub sims/geo-lines/ (geo-compass, geo-angles,
   geo-triangles and geo-perimeter-area copy it until the coordinator promotes it to models/squared-paper.js).
   Pure: no DOM, no strings, plain JSON in and out (points are [x, y] with whole numbers; an exact point that is not
   on a corner is { x: [num, den], y: [num, den] }); it registers like a model in models/ (models/README.md), so it
   can move there unchanged. */
(function (root) {
  'use strict';

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var r = a % b; a = b; b = r; }
    return a;
  }

  /** A fraction [num, den] in lowest terms with den > 0. */
  function rat(n, d) {
    if (d === 0) throw new Error('rat: zero denominator');
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    return [n / g + 0, d / g]; // + 0 turns -0 into 0
  }

  function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function cross(u, v) { return u[0] * v[1] - u[1] * v[0]; }
  function dot(u, v) { return u[0] * v[0] + u[1] * v[1]; }

  /** The direction of a line as the shortest whole step along it, pointing right, or up when the line is vertical:
      (4, 2) and (−2, −1) are both (2, 1). [0, 0] has no direction and stays [0, 0]. */
  function lineDir(v) {
    var g = gcd(v[0], v[1]);
    if (!g) return [0, 0];
    var x = v[0] / g, y = v[1] / g;
    if (x < 0 || (x === 0 && y < 0)) { x = -x; y = -y; }
    return [x + 0, y + 0];
  }

  var model = {
    gcd: gcd,
    rat: rat,
    sub: sub,
    cross: cross,
    dot: dot,
    lineDir: lineDir,

    /** The step along a segment from a to b: { u, m } with b = a + m · u, u the shortest whole step (its sign kept),
        m the number of such steps (0 when a = b). */
    stepOf: function (a, b) {
      var d = sub(b, a), g = gcd(d[0], d[1]);
      return g ? { u: [d[0] / g + 0, d[1] / g + 0], m: g } : { u: [0, 0], m: 0 };
    },

    /** The directions of lines through a corner whose shortest step has both parts at most maxC, ordered by how far
        they are turned from the horizontal, anticlockwise: [1, 0] first, then [maxC, 1] … [1, 1] … [0, 1] … [−maxC, 1].
        Each is a lineDir. */
    directions: function (maxC) {
      var out = [];
      for (var x = -maxC; x <= maxC; x++) {
        for (var y = 0; y <= maxC; y++) {
          if (gcd(x, y) !== 1) continue;
          if (y === 0 && x !== 1) continue;
          out.push([x, y]);
        }
      }
      // the angle of (x, y) with y ≥ 0 grows as the cotangent x / y falls; (1, 0) is first. Compared exactly:
      // a before b when cross(a, b) > 0.
      out.sort(function (a, b) { return cross(b, a); });
      return out.map(lineDir);
    },

    /** The line direction a quarter turn from u (anticlockwise, then made a lineDir): (2, 1) → (−1, 2). */
    perp: function (u) { return lineDir([-u[1], u[0]]); },

    /**
     * Where the corner t lies on the line through a in whole steps u (u a shortest step, not zero): { on, k }.
     * on: t is on the line (cross(u, t − a) = 0); k: then t = a + k · u (a whole number), else null.
     */
    along: function (a, u, t) {
      var w = sub(t, a);
      if (cross(u, w) !== 0) return { on: false, k: null };
      return { on: true, k: dot(u, w) / dot(u, u) };
    },

    /** Does step k of a figure through a (segment: 0…m; ray: k ≥ 0; line: any) belong to it? kind is 'segment',
        'ray' or 'line'; ends belong to the figure. */
    inFigure: function (kind, k, m) {
      if (kind === 'line') return true;
      if (kind === 'ray') return k >= 0;
      return k >= 0 && k <= m;
    },

    /**
     * How two lines meet: line p through a with direction u, line q through b with direction v (both not zero).
     * { kind, at }: kind 'same' (one line), 'parallel' (no point in common), 'perp' (meet at a right angle) or
     * 'cross' (meet, not at a right angle); at is the exact point where they meet ({ x: [n, d], y: [n, d] }), null for
     * 'same' and 'parallel'. Ties: parallel is decided first (cross(u, v) = 0), then 'same' when b lies on p.
     */
    meet: function (a, u, b, v) {
      var D = cross(u, v);
      if (D === 0) return { kind: cross(u, sub(b, a)) === 0 ? 'same' : 'parallel', at: null };
      var n = cross(sub(b, a), v); // p's parameter s = n / D: the point a + s · u
      return {
        kind: dot(u, v) === 0 ? 'perp' : 'cross',
        at: { x: rat(a[0] * D + n * u[0], D), y: rat(a[1] * D + n * u[1], D) }
      };
    },

    /** The value of a fraction [n, d]. */
    val: function (r) { return r[0] / r[1]; },

    /** Is an exact point ({ x: [n, d], y: [n, d] }) inside the box { x0, y0, x1, y1 } (the edges count)? Exact. */
    inBox: function (p, box) {
      var x = p.x, y = p.y;
      return x[0] >= box.x0 * x[1] && x[0] <= box.x1 * x[1] && y[0] >= box.y0 * y[1] && y[0] <= box.y1 * y[1];
    },

    /** Is a corner [x, y] inside the box (the edges count)? */
    cornerIn: function (c, box) { return c[0] >= box.x0 && c[0] <= box.x1 && c[1] >= box.y0 && c[1] <= box.y1; },

    /** The stretch [s0, s1] of the line a + s · u (s a real number) inside the box, or null when the line misses it.
        For drawing: floating point. */
    clip: function (a, u, box) {
      var lo = -Infinity, hi = Infinity;
      var dims = [[a[0], u[0], box.x0, box.x1], [a[1], u[1], box.y0, box.y1]];
      for (var i = 0; i < 2; i++) {
        var p = dims[i][0], d = dims[i][1], e0 = dims[i][2], e1 = dims[i][3];
        if (d === 0) { if (p < e0 || p > e1) return null; continue; }
        var s0 = (e0 - p) / d, s1 = (e1 - p) / d;
        if (s0 > s1) { var tmp = s0; s0 = s1; s1 = tmp; }
        lo = Math.max(lo, s0); hi = Math.min(hi, s1);
      }
      return lo <= hi ? [lo, hi] : null;
    },

    /**
     * The set square slid along a ruler (catalogue §5.27, the school's way to draw parallel and perpendicular lines).
     * Line p goes through a with shortest step u. tool 'par': one leg of the set square lies on p and the ruler along
     * the other leg; the set square slides along the ruler, so the first leg stays parallel to p. tool 'perp': the
     * ruler lies on p and the set square slides along it, so its other leg stays perpendicular to p.
     * j counts the slide in the grid's own steps: after j steps the drawing leg lies on the j-th line of its direction
     * through corners, counted from a. Returns:
     *   edge   the drawing leg's direction (u for 'par', perp(u) for 'perp'),
     *   slide  the direction the set square moves (perp(u) for 'par', u for 'perp'),
     *   corner the set square's right-angle corner, exact: a + (j / |u|²) · slide' where slide' is the quarter turn
     *          (−u[1], u[0]) for 'par' and u for 'perp',
     *   target the j at which the drawing leg passes through t: cross(u, t − a) for 'par', dot(u, t − a) for 'perp'.
     */
    slide: function (tool, a, u, j, t) {
      var n = [-u[1], u[0]];
      var s = tool === 'perp' ? u : n;
      var uu = dot(u, u);
      var w = sub(t, a);
      return {
        edge: tool === 'perp' ? lineDir(n) : lineDir(u),
        slide: lineDir(s),
        corner: { x: rat(a[0] * uu + j * s[0], uu), y: rat(a[1] * uu + j * s[1], uu) },
        target: tool === 'perp' ? dot(u, w) : cross(u, w)
      };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {})['squared-paper'] = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
