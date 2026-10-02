/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for Amdahl's law: a workload made of up to five parts, each taking a share of the run time and sped up by
   its own factor (generalised Amdahl, S = 1 / Σ fᵢ / sᵢ). An explorer: no steps; the page draws initial(params).
   Adopted from single-page-labs/amdahl-simulator.html (calcSpeedup, calcSerialFraction, calcTheoreticalMax and
   the chart's curve); see NOTES.md for what changed.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The ceiling is null when nothing is serial
   (it is unbounded), so the state stays JSON-safe.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var PARTS = 5;

  /** Workload profiles from the original page: the share of run time of each part, in per cent. */
  var PROFILES = {
    desktop: [40, 25, 20, 10, 5],
    web: [45, 25, 15, 10, 5],
    hpc: [70, 15, 10, 3, 2],
    mobile: [30, 30, 20, 12, 8],
    db: [45, 25, 15, 10, 5],
    custom: [20, 20, 20, 20, 20]
  };

  /** Above this, a part counts as sped up (the original's 1.0001); at or below it, the part is serial. */
  var SERIAL_EPS = 1e-4;

  function isSerial(speedup) { return speedup <= 1 + SERIAL_EPS; }

  /** Classic Amdahl: speedup when the serial share s stays and the rest runs n times faster. */
  function amdahl(s, n) { return 1 / (s + (1 - s) / n); }

  /** Gustafson: scaled speedup when the problem grows with n and the serial share of the scaled run is s. */
  function gustafson(s, n) { return s + n * (1 - s); }

  function profileParams(profile) {
    var out = { profile: profile };
    PROFILES[profile].forEach(function (f, i) { out['f' + (i + 1)] = f; out['s' + (i + 1)] = 1; });
    return out;
  }

  var defaults = Object.assign(profileParams('desktop'), { sel: 1, gustafson: false });

  /** Presets (keys 1–9, in this order): the original's six profiles, plus three that speed one part up.
      The page adds the labels. Params apply on top of the defaults. */
  var presets = [
    { id: 'desktop', params: profileParams('desktop') },
    { id: 'cpu-4x', params: Object.assign(profileParams('desktop'), { s1: 4, sel: 1 }) },
    { id: 'memory-4x', params: Object.assign(profileParams('desktop'), { s2: 4, sel: 2 }) },
    { id: 'web', params: profileParams('web') },
    { id: 'hpc', params: profileParams('hpc') },
    { id: 'hpc-16x', params: Object.assign(profileParams('hpc'), { s1: 16, sel: 1 }) },
    { id: 'mobile', params: profileParams('mobile') },
    { id: 'db', params: profileParams('db') },
    { id: 'custom', params: profileParams('custom') }
  ];

  var logic = {
    PARTS: PARTS,
    PROFILES: PROFILES,
    defaults: defaults,
    presets: presets,
    steps: 0,
    amdahl: amdahl,
    gustafson: gustafson,
    isSerial: isSerial,
    profileParams: profileParams,

    /** Everything the page shows, from the params. */
    initial: function (p) {
      var raw = [];
      for (var i = 1; i <= PARTS; i++) raw.push({ i: i, weight: p['f' + i], speedup: p['s' + i] });
      var total = raw.reduce(function (a, c) { return a + c.weight; }, 0);
      // Shares are the weights scaled to 1, so the baseline is always 1× even when the sliders do not add up to 100.
      var parts = raw.map(function (c) {
        var share = c.weight / total;
        return { i: c.i, weight: c.weight, share: share, speedup: c.speedup, after: share / c.speedup, serial: isSerial(c.speedup) };
      });
      var after = parts.reduce(function (a, c) { return a + c.after; }, 0);
      var serial = parts.reduce(function (a, c) { return a + (c.serial ? c.share : 0); }, 0);
      var improvedAfter = after - serial;
      // The part that takes most of the new run time; ties go to the lower number.
      var bottleneck = parts.reduce(function (b, c) { return c.after > b.after + 1e-12 ? c : b; }, parts[0]).i;
      return {
        parts: parts,
        weightSum: total,
        after: after,
        speedup: 1 / after,
        serial: serial,
        ceiling: serial > SERIAL_EPS ? 1 / serial : null,
        // The one factor n that, applied to every sped-up part, gives the same speedup (1 when nothing is sped up).
        equivalentN: improvedAfter > 0 ? (1 - serial) / improvedAfter : 1,
        bottleneck: bottleneck
      };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
