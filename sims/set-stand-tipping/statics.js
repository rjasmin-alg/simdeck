/* SPDX-License-Identifier: AGPL-3.0-or-later
   Forces and moments on a film set (catalogue §5.25): the shared statics model, built first here (set-stand-tipping
   is its hub; set-working-load and set-manual-handling reuse the statics, set-weather-lightning the wind force).
   Weights, the wind's push on a flat surface, a three-legged stand's footprint and its tipping edges, the moments
   about an edge, the wind speed at which a stand tips and the angle it can lean before it falls by itself.
   Pure plain data and functions, no strings and no page code. Registers on globalThis.SimdeckModels['set-statics']
   (models/README.md); node tests require() it. Rules: SPEC.md rules 1–6 ("Rule n" below).
   Coordinates: x horizontal in the direction of the push (the wind blows toward +x), y horizontal across it, heights z
   up from the ground; metres, kilograms, newtons, newton-metres. Every number here is illustrative except the physics. */
(function (root) {
  'use strict';

  /** Rule 1: standard gravity, m/s². */
  var G = 9.81;

  /** Rule 2: air density near sea level (kg/m³; the standard atmosphere has 1.225) and the drag coefficient of a flat
   *  plate face-on to the wind (about 1.1–1.3 in the literature): both rounded, both illustrative. */
  var RHO = 1.25;
  var CD = 1.2;

  /** Two values closer than this are equal (rule 4's tie-break), so a tie computed two ways stays a tie. */
  var EPS = 1e-9;

  /** Rule 1: the weight of a mass, newtons. */
  function weight(m) { return m * G; }

  /** Rule 2: the wind's push on a flat surface of `area` m² face-on to a wind of `v` m/s: ½·ρ·Cd·A·v². It grows with
   *  the area and with the square of the speed. */
  function windForce(v, area, cd, rho) {
    return 0.5 * (rho === undefined ? RHO : rho) * (cd === undefined ? CD : cd) * area * v * v;
  }

  /** Rule 3: a three-legged stand seen from above: feet A, B, C a third of a turn apart, each `r` from the column.
   *  'leg': foot A points the way the push goes (+x), the load over a leg; 'gap': foot A points against it, so the push
   *  goes between feet B and C. Exact coordinates (cos 120° = −½), feet in the order A, B, C. */
  function tripod(r, orient) {
    var s = r * Math.sqrt(3) / 2, k = orient === 'gap' ? -1 : 1;
    return [
      { leg: 'A', x: k * r, y: 0 },
      { leg: 'B', x: -k * r / 2, y: s },
      { leg: 'C', x: -k * r / 2, y: -s }
    ];
  }

  /** Rule 3: the tipping edges, the lines between two feet, in the order A–B, B–C, C–A. Each has its outward normal
   *  (nx, ny), its distance `e` from the column, and, when it faces the push (nx > 0), `cross`: where it crosses the
   *  push's line through the column, the edge's distance from the column measured in the push's direction (e / nx). */
  function edges(feet) {
    return feet.map(function (p, i) {
      var q = feet[(i + 1) % feet.length];
      var dx = q.x - p.x, dy = q.y - p.y, len = Math.sqrt(dx * dx + dy * dy);
      var nx = dy / len, ny = -dx / len;
      var e = p.x * nx + p.y * ny;
      if (e < 0) { nx = -nx; ny = -ny; e = -e; }
      if (Math.abs(nx) < EPS) nx = 0;
      if (Math.abs(ny) < EPS) ny = 0;
      return { a: p.leg, b: q.leg, nx: nx, ny: ny, e: e, cross: nx > 0 ? e / nx : null };
    });
  }

  /** Rule 4: the restoring moment of one weight `w` (N) standing at (x, y) about an edge, counted per unit of the
   *  push's direction (divided by nx), so it compares directly with a push times its height: w × its distance from the
   *  edge in the push's direction. Zero for a weight on the edge; negative beyond it. */
  function restoringOf(edge, w, x, y) {
    return w * (edge.e - (x * edge.nx + y * edge.ny)) / edge.nx;
  }

  /** Rule 4: the balance of a stand. weights: [{ w, x, y }] (newtons, standing on the stand); overturn: the moment
   *  that pushes toward +x (N·m: the wind times its height, a weight's offset times its distance); extra: a restoring
   *  moment that acts against the push whatever the edge (N·m, a hand on the column). Of the edges facing the push,
   *  the one with the least restoring moment governs; tie-break: the first in the order A–B, B–C, C–A. The stand tips
   *  when the overturning moment is above the restoring moment; exactly equal stands. */
  function balance(feet, weights, overturn, extra) {
    var list = edges(feet).map(function (ed) {
      if (!(ed.nx > 0)) return Object.assign({}, ed, { restoring: null });
      var r = weights.reduce(function (s, x) { return s + restoringOf(ed, x.w, x.x, x.y); }, 0);
      return Object.assign({}, ed, { restoring: r });
    });
    var gov = -1;
    list.forEach(function (ed, i) {
      if (ed.restoring === null) return;
      if (gov < 0 || ed.restoring < list[gov].restoring - EPS) gov = i;
    });
    var restoring = list[gov].restoring + (extra || 0);
    return {
      edges: list,
      edge: gov,
      restoring: restoring,
      overturn: overturn,
      tips: tips(overturn, restoring),
      ratio: restoring > 0 ? overturn / restoring : Infinity
    };
  }

  /** Rule 4: tips when overturning > restoring. Tie-break: within EPS of each other is equal, and equal stands. */
  function tips(overturn, restoring) { return overturn > restoring + EPS; }

  /** Rule 5: the wind speed at which the stand starts to tip: the speed whose push on `area` at `height`, added to the
   *  other overturning moment, equals the restoring moment. 0 when it tips without wind; Infinity when the wind has no
   *  surface or no lever. */
  function criticalSpeed(restoring, otherOverturn, area, height, cd, rho) {
    var perV2 = windForce(1, area, cd, rho) * height;
    if (!(perV2 > 0)) return Infinity;
    return Math.sqrt(Math.max(0, restoring - otherOverturn) / perV2);
  }

  /** Rule 6: how far a stand can lean over an edge before its centre of gravity passes over it and it falls by itself:
   *  atan(the centre of gravity's distance from the edge / its height), in degrees. 0 when it is already over. */
  function leanAngle(dist, height) {
    if (!(dist > 0)) return 0;
    return Math.atan2(dist, height) * 180 / Math.PI;
  }

  /** Rule 6: the centre of gravity's height of several masses [{ m, z }]. */
  function cgHeight(masses) {
    var m = 0, mz = 0;
    masses.forEach(function (x) { m += x.m; mz += x.m * x.z; });
    return m > 0 ? mz / m : 0;
  }

  var model = {
    G: G, RHO: RHO, CD: CD, EPS: EPS,
    weight: weight, windForce: windForce, tripod: tripod, edges: edges, restoringOf: restoringOf,
    balance: balance, tips: tips, criticalSpeed: criticalSpeed, leanAngle: leanAngle, cgHeight: cgHeight
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {})['set-statics'] = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
