/* SPDX-License-Identifier: AGPL-3.0-or-later
   Line tension and working loads on a film set (catalogue §5.25, the forces-and-moments model): how much each line of
   a hanging pulls, the jolt of a load that drops a short way before the line catches it, and a line as a chain of
   pieces, each with its working load limit and its breaking strength. Built for set-working-load on top of the statics
   of set-stand-tipping (weight and the tie-break tolerance copied from there, below); promotable beside
   models/set-statics.js, or into it as additions.
   Pure plain data and functions, no strings and no page code. Registers on globalThis.SimdeckModels['set-rigging']
   (models/README.md); node tests require() it. Rules: SPEC.md rules 1–5 ("Rule n" below).
   Units: metres, kilograms, newtons, newtons per metre; angles in degrees. Every number here is illustrative except
   the physics. */
(function (root) {
  'use strict';

  // from sims/set-stand-tipping/statics.js @ a3f3f1a: G, EPS and weight(), unchanged.
  /** Rule 1: standard gravity, m/s². */
  var G = 9.81;
  /** Two values closer than this are equal (the tie-breaks of rules 4 and 5). */
  var EPS = 1e-9;
  /** Rule 1: the weight of a mass, newtons. */
  function weight(m) { return m * G; }

  /** Rule 2: the static pull in each of `n` equal lines holding a weight `w` (N), symmetric, with `angle` degrees
   *  between the two lines: each line's vertical part carries w / n, so the line pulls w / (n·cos(angle / 2)). One line
   *  hangs straight down (the angle is ignored). Two lines at 0° carry half each; at 120°, the whole weight each. */
  function lineTension(w, n, angle) {
    var half = n > 1 ? angle * Math.PI / 360 : 0;
    return w / (n * Math.cos(half));
  }

  /** Rule 3: how stiffly the hanging catches a load, vertically: `n` lines of stiffness `k` (N/m) each at half the
   *  angle from the vertical: n·k·cos²(angle / 2) (small stretch; the geometry does not change while it stretches). */
  function catchStiffness(k, n, angle) {
    var c = n > 1 ? Math.cos(angle * Math.PI / 360) : 1;
    return n * k * c * c;
  }

  /** Rule 3: the jolt of a drop. A load that falls `drop` metres before the line goes taut, on a hanging that stretches
   *  `stretch` metres under the load at rest, pulls 1 + √(1 + 2·drop / stretch) times the pull at rest at the bottom
   *  of the catch (energy: m·g·(drop + x) = ½·K·x², no damping). Tie-break: a drop of 0 (or less) is a load lowered
   *  gently onto the line, factor exactly 1, not the 2 of a load let go on a line that is just taut. */
  function dropFactor(drop, stretch) {
    if (!(drop > 0)) return 1;
    return 1 + Math.sqrt(1 + 2 * drop / stretch);
  }

  /** Rule 3: how far the hanging stretches to stop the drop: the stretch at rest times the factor. */
  function catchDistance(drop, stretch) {
    return stretch * dropFactor(drop, stretch);
  }

  /** Rule 4: a line is a chain of pieces [{ wll, breaking }] (newtons; wll null for a piece with no rating), from the
   *  top. The line's working load limit is the least of the pieces' (null when any piece has none); its breaking
   *  strength is the least of the pieces' real breaking strengths. `weakest`: the piece that breaks first (least
   *  breaking strength); `weakestLabel`: the piece with the least rating (an unrated piece first). Tie-break for both:
   *  within EPS counts as equal, and the first piece from the top wins. */
  function chain(pieces) {
    var weakest = 0, label = 0, wll = pieces[0].wll;
    pieces.forEach(function (p, i) {
      if (p.breaking < pieces[weakest].breaking - EPS) weakest = i;
      var cur = pieces[label].wll;
      if (cur !== null && (p.wll === null || p.wll < cur - EPS)) label = i;
      if (wll !== null) wll = p.wll === null ? null : Math.min(wll, p.wll);
    });
    return { wll: wll, breaking: pieces[weakest].breaking, weakest: weakest, weakestLabel: label };
  }

  /** Rule 5: a line's state under a pull `force` (N): 'breaks' above its breaking strength; else 'unrated' when it has
   *  no working load limit; else 'over' above the limit; else 'ok'. Tie-breaks: exactly at the limit is within it
   *  ('ok'); exactly at the breaking strength holds (within EPS counts as equal). */
  function lineState(force, wll, breaking) {
    if (force > breaking + EPS) return 'breaks';
    if (wll === null) return 'unrated';
    if (force > wll + EPS) return 'over';
    return 'ok';
  }

  var model = {
    G: G, EPS: EPS, weight: weight,
    lineTension: lineTension, catchStiffness: catchStiffness, dropFactor: dropFactor, catchDistance: catchDistance,
    chain: chain, lineState: lineState
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {})['set-rigging'] = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
