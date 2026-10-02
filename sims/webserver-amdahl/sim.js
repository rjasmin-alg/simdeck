/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for Amdahl's law on one web request: five components (network I/O, database, application logic on the CPU,
   disk I/O, application cache), each taking a share of the request time and sped up by its own factor
   (generalised Amdahl, S = 1 / Σ fᵢ / sᵢ). An explorer: no steps; the page draws initial(params).
   Adopted from single-page-labs/webserver-amdahl.html (COMPONENTS, calcSpeedup, calcSerial, calcCeiling and the
   chart's curve); see NOTES.md for what changed.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. A ceiling is null when it is unbounded,
   so the state stays JSON-safe.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** The request's components in the original's order; the share of request time of each, in per cent. */
  var COMPONENTS = ['network', 'database', 'cpu', 'disk', 'cache'];
  var FRACTIONS = [45, 25, 15, 10, 5];
  var PARTS = COMPONENTS.length;

  // from sims/amdahl/sim.js @ f670166 (SERIAL_EPS, isSerial, amdahl, the generalised law in initial)

  /** Above this, a part counts as sped up; at or below it, the part is serial. */
  var SERIAL_EPS = 1e-4;

  function isSerial(speedup) { return speedup <= 1 + SERIAL_EPS; }

  /** Classic Amdahl: speedup when the serial share s stays and the rest runs n times faster. */
  function amdahl(s, n) { return 1 / (s + (1 - s) / n); }

  var defaults = { sel: 1 };
  FRACTIONS.forEach(function (f, i) { defaults['f' + (i + 1)] = f; defaults['s' + (i + 1)] = 1; });

  /** The given speedups on top of the baseline (every part at 1×), with part sel selected. */
  function boost(over, sel) { return Object.assign({ s1: 1, s2: 1, s3: 1, s4: 1, s5: 1, sel: sel }, over); }

  /** Presets (keys 1–7, in this order): the baseline, the original's five worked examples (one per component),
      and the two large components together. The page adds the labels. Params apply on top of the defaults. */
  var presets = [
    { id: 'baseline', params: boost({}, 1) },
    { id: 'network-10x', params: boost({ s1: 10 }, 1) },
    { id: 'database-10x', params: boost({ s2: 10 }, 2) },
    { id: 'cpu-10x', params: boost({ s3: 10 }, 3) },
    { id: 'disk-50x', params: boost({ s4: 50 }, 4) },
    { id: 'cache-100x', params: boost({ s5: 100 }, 5) },
    { id: 'network-database-10x', params: boost({ s1: 10, s2: 10 }, 1) }
  ];

  var logic = {
    PARTS: PARTS,
    COMPONENTS: COMPONENTS,
    FRACTIONS: FRACTIONS,
    defaults: defaults,
    presets: presets,
    steps: 0,
    amdahl: amdahl,
    isSerial: isSerial,

    /** Everything the page shows, from the params. */
    initial: function (p) {
      var raw = [];
      for (var i = 1; i <= PARTS; i++) raw.push({ i: i, id: COMPONENTS[i - 1], weight: p['f' + i], speedup: p['s' + i] });
      var total = raw.reduce(function (a, c) { return a + c.weight; }, 0);
      // Shares are the weights scaled to 1, so the baseline is always 1× even when the sliders do not add up to 100.
      var parts = raw.map(function (c) {
        var share = c.weight / total;
        return { i: c.i, id: c.id, weight: c.weight, share: share, speedup: c.speedup, after: share / c.speedup, serial: isSerial(c.speedup) };
      });
      var after = parts.reduce(function (a, c) { return a + c.after; }, 0);
      var serial = parts.reduce(function (a, c) { return a + (c.serial ? c.share : 0); }, 0);
      var improvedAfter = after - serial;
      // The part that takes most of the new request time; ties go to the lower number.
      var bottleneck = parts.reduce(function (b, c) { return c.after > b.after + 1e-12 ? c : b; }, parts[0]).i;
      parts.forEach(function (c) {
        // With every other part as it is now, the most this part can give if it took no time at all.
        var rest = after - c.after;
        c.limit = rest > SERIAL_EPS ? 1 / rest : null;
      });
      var speedup = 1 / after;
      var ceiling = serial > SERIAL_EPS ? 1 / serial : null;
      return {
        parts: parts,
        weightSum: total,
        after: after,
        speedup: speedup,
        serial: serial,
        ceiling: ceiling,
        // How far from 1× to the ceiling the speedup has come (0…1); null without a ceiling or when the ceiling is 1×.
        progress: ceiling != null && ceiling > 1 + SERIAL_EPS ? Math.min(1, (speedup - 1) / (ceiling - 1)) : null,
        // The one factor n that, applied to every sped-up part, gives the same speedup (1 when nothing is sped up).
        equivalentN: improvedAfter > 0 ? (1 - serial) / improvedAfter : 1,
        bottleneck: bottleneck
      };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
