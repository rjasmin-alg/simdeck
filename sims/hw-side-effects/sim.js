/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for side effects between correct parts: a victim program holds secret bits; an unrelated other program shares
   the hardware with it. Two optimisation axes each leave their own kind of trace in shared state:
     speed (running ahead, sharing, caching): a shared line stays warm after the work that warmed it was rolled back;
     space (density, smaller cells): a row next to the victim's row is disturbed by what the victim's row holds.
   The victim's result is always correct and every software check passes; the trace is a side effect. An explorer:
   no steps; the page draws initial(params). The probability curve is ILLUSTRATIVE, not measured (SPEC.md).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Promotable to models/ unchanged.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Slider range: optimisation level 0 (off) … MAX (as far as it goes). */
  var MAX = 10;
  /** Chance that one secret bit leaves a trace with the axis at MAX and no mitigation. */
  var PMAX = 0.8;
  /** Mitigations (hardware, OS, compiler) multiply each axis's chance by this … */
  var MIT_FACTOR = 0.25;
  /** … and cost this much extra time and energy per task. */
  var MIT_TIME = 1.25;
  var MIT_ENERGY = 1.1;
  /** Cost per level below MAX: time per task, linear cell size, energy per task (illustrative). */
  var TIME_PER_LEVEL = 0.15;
  var SIZE_PER_LEVEL = 0.1;
  var ENERGY_SPEED = 0.06;
  var ENERGY_SPACE = 0.08;
  /** The victim's secret: 16 bits, fixed. A 1 leaves a trace when the side effect survives; a 0 leaves none. */
  var SECRET = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1];

  /** How hard it is for the side effect at secret bit i to survive, per axis: the 1-bits get the evenly spaced
      values (rank + ½) / ones in a fixed order of their own on each axis, so the share of 1-bits with a trace follows
      the chance and the two axes miss different bits. A 0-bit has nothing to leave (1, never below a chance). */
  var RANKS = { speed: [4, 7, 1, 8, 0, 5, 2, 6, 3], space: [6, 2, 8, 0, 4, 1, 7, 3, 5] };
  var ONES = SECRET.reduce(function (a, b, i) { if (b === 1) a.push(i); return a; }, []);
  function toughness(axis, i) {
    var k = ONES.indexOf(i);
    return k < 0 ? 1 : (RANKS[axis][k] + 0.5) / ONES.length;
  }

  /** Clamp a level to 0 … MAX. */
  function level(x) { return Math.max(0, Math.min(MAX, x)); }

  /** Chance (0 … PMAX) that one secret bit leaves a trace on one axis: grows with the square of the level. */
  function chance(x, mitigate) {
    var f = level(x) / MAX;
    return PMAX * f * f * (mitigate ? MIT_FACTOR : 1);
  }

  /** Chance that at least one kind of trace survives: the two axes are independent. */
  function either(ps, pd) { return 1 - (1 - ps) * (1 - pd); }

  /** A secret bit leaves a trace when it is 1 and its cell's toughness is below the chance (a tie keeps no trace). */
  function leaves(bit, u, p) { return bit === 1 && u < p; }

  /** Cost relative to both axes at MAX without mitigation (= 1 each). */
  function cost(speed, density, mitigate) {
    var s = MAX - level(speed), d = MAX - level(density);
    var size = 1 + SIZE_PER_LEVEL * d;
    return {
      time: (1 + TIME_PER_LEVEL * s) * (mitigate ? MIT_TIME : 1),
      size: size,
      area: size * size,
      energy: (1 + ENERGY_SPEED * s + ENERGY_SPACE * d) * (mitigate ? MIT_ENERGY : 1)
    };
  }

  function axis(name, x, mitigate) {
    var p = chance(x, mitigate);
    var cells = SECRET.map(function (bit, i) {
      var u = toughness(name, i);
      return { i: i, bit: bit, trace: leaves(bit, u, p) };
    });
    return { level: level(x), p: p, cells: cells, traces: cells.filter(function (c) { return c.trace; }).length };
  }

  /** Who else runs code on the machine: 'hostile' (some code may be) or 'trusted' (all code is). The traces are the
      same either way; only with someone hostile does a trace become a risk. */
  var TRUST = ['hostile', 'trusted'];

  /** The risk that a leak does harm: the leak chance when someone may be hostile, nothing when all code is trusted. */
  function risk(p, trust) { return trust === 'trusted' ? 0 : p; }

  /** The limits on making circuits faster and smaller (the page names them): all physical but the last. */
  var LIMITS = [
    { id: 'light', physical: true },
    { id: 'heat', physical: true },
    { id: 'quantum', physical: true },
    { id: 'atoms', physical: true },
    { id: 'trust', physical: false }
  ];

  var defaults = { speed: 6, density: 4, mitigate: false, trust: 'hostile' };

  /** Presets (keys 1–6, in this order); the page adds the labels. Params apply on top of the defaults. */
  var presets = [
    { id: 'safe', params: { speed: 0, density: 0, mitigate: false } },
    { id: 'speed', params: { speed: MAX, density: 0, mitigate: false } },
    { id: 'space', params: { speed: 0, density: MAX, mitigate: false } },
    { id: 'both', params: { speed: MAX, density: MAX, mitigate: false } },
    { id: 'mitigated', params: { speed: MAX, density: MAX, mitigate: true } },
    { id: 'trusted', params: { speed: MAX, density: MAX, mitigate: false, trust: 'trusted' } }
  ];

  var logic = {
    MAX: MAX,
    PMAX: PMAX,
    MIT_FACTOR: MIT_FACTOR,
    SECRET: SECRET,
    TRUST: TRUST,
    LIMITS: LIMITS,
    defaults: defaults,
    presets: presets,
    steps: 0,
    chance: chance,
    either: either,
    leaves: leaves,
    cost: cost,
    risk: risk,
    toughness: toughness,

    /** Everything the page shows, from the params. */
    initial: function (p) {
      var sp = axis('speed', p.speed, p.mitigate);
      var dn = axis('space', p.density, p.mitigate);
      // What the other program sees: the secret 1-bits that left a trace of either kind.
      var seen = SECRET.map(function (bit, i) { return sp.cells[i].trace || dn.cells[i].trace; });
      return {
        speed: sp,
        space: dn,
        p: either(sp.p, dn.p),
        risk: risk(either(sp.p, dn.p), p.trust),
        // The limit that binds here: trust, when someone may be hostile and a secret bit has left a trace.
        trustBinds: p.trust !== 'trusted' && seen.some(Boolean),
        seen: seen.filter(Boolean).length,
        ones: SECRET.filter(function (b) { return b === 1; }).length,
        // The victim's side never changes: its result is correct, and every software check passes.
        victimCorrect: true,
        checksPass: true,
        cost: cost(p.speed, p.density, p.mitigate)
      };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
