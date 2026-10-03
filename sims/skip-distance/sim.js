/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for skip distance: a sky wave leaves the antenna at the radiation angle α above the horizon, is turned back
   by the ionosphere at height h, and comes down again one hop away. The distance is pure geometry on a round Earth,
   with the ionosphere as a mirror at height h (its virtual height):
     half the hop, as an angle at the Earth's centre:  β = arccos(R · cos α / (R + h)) − α
     the hop along the ground:                          d = 2 · R · β
   (the triangle centre–antenna–turning point, law of sines). The flatter the angle and the higher the region, the
   longer the hop; straight up (α = 90°) it comes back down on the antenna. An explorer: no steps; the page draws
   initial(params).
   Adopted from 50ohm-contents-hr/contents/html/sprungdistanz_applet.html (one slider for the radiation angle
   0 … 90°, default 0°, and a canvas with a ray mirrored at a circle 1.8 Earth radii out), CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; changed for simdeck (NOTES.md says what and why).
   Units: α in whole degrees, h in whole km (params, exact); distances in km; angles inside in radians.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var R = 6371;                       // mean Earth radius, km
  var H_MIN = 100, H_MAX = 400, H_STEP = 10;   // the height slider, km: the E region (~110 km) to a high F2 (~400 km)
  var E_KM = 110, F2_KM = 300;        // the two regions the section names, at typical virtual heights (reference curves)
  var ROUND = 10;                     // distances are shown to 10 km

  function clampInt(x, lo, hi) {
    var n = Math.round(Number(x));
    if (!isFinite(n)) n = lo;
    return Math.min(hi, Math.max(lo, n));
  }

  function rad(deg) { return deg * Math.PI / 180; }

  /** Half the hop as an angle at the Earth's centre (radians), for radiation angle α (deg) and height h (km).
      Tie-break: α = 90° is exactly 0 (straight up and straight back). cos 90° is not exactly 0 in floating point;
      for every height tried the formula still gives exactly 0 there, and the guard keeps it so whatever the
      arithmetic does. Never negative. */
  function halfAngle(alphaDeg, h) {
    if (alphaDeg >= 90) return 0;
    var a = rad(alphaDeg);
    return Math.max(0, Math.acos(R * Math.cos(a) / (R + h)) - a);
  }

  /** The hop along the ground, km (not rounded). */
  function hopKm(alphaDeg, h) {
    return 2 * R * halfAngle(alphaDeg, h);
  }

  function round10(x) { return Math.round(x / ROUND) * ROUND; }

  /** What kind of ray it is. Tie-breaks, in this order: α = 0° is 'grazing' (it leaves along the horizon: the longest
      hop this height allows), α = 90° is 'vertical' (straight up, back down on the antenna, no distance); anything
      in between is 'oblique'. α is a whole number of degrees, so the ties are exact. */
  function kindOf(alphaDeg) {
    if (alphaDeg === 0) return 'grazing';
    if (alphaDeg === 90) return 'vertical';
    return 'oblique';
  }

  var defaults = { angle: 0, height: 300 };

  /** Presets (keys 1–6, in this order). The page adds the labels. */
  var presets = [
    { id: 'original', params: { angle: 0, height: 300 } },
    { id: 'flatF2', params: { angle: 10, height: 300 } },
    { id: 'mediumF2', params: { angle: 30, height: 300 } },
    { id: 'steepF2', params: { angle: 60, height: 300 } },
    { id: 'vertical', params: { angle: 90, height: 300 } },
    { id: 'flatE', params: { angle: 10, height: 110 } }
  ];

  /** The state the page draws: the parameters, the hop (exact and to 10 km), its half-angle at the centre, the longest hop at this height (α = 0°), and the kind of ray. */
  function initial(p) {
    var angle = clampInt(p.angle, 0, 90);
    var height = Math.round(clampInt(p.height, H_MIN, H_MAX) / H_STEP) * H_STEP;
    var exact = hopKm(angle, height), longest = hopKm(0, height);
    return {
      angle: angle,
      height: height,
      beta: halfAngle(angle, height),
      exact: exact,
      km: round10(exact),
      maxKm: round10(longest),
      kind: kindOf(angle)
    };
  }

  /** The hop against the angle, 0 … 90°, for height h: { angle, km } points, `n` intervals (at least one per degree). */
  function curve(h, n) {
    n = Math.max(n || 0, 90);
    var out = [];
    for (var i = 0; i <= n; i++) {
      var a = (i / n) * 90;
      out.push({ angle: a, km: hopKm(a, h) });
    }
    return out;
  }

  var logic = {
    R: R, H_MIN: H_MIN, H_MAX: H_MAX, H_STEP: H_STEP, E_KM: E_KM, F2_KM: F2_KM, ROUND: ROUND,
    defaults: defaults,
    presets: presets,
    initial: initial,
    halfAngle: halfAngle,
    hopKm: hopKm,
    round10: round10,
    kindOf: kindOf,
    curve: curve
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
