/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for wavelength and frequency: a wave in free space with wavelength λ has frequency f = c / λ. The page shows
   a snapshot of the wave over 10 m of distance and marks one wavelength. An explorer: no steps; the page draws
   initial(params).
   Adopted from 50ohm-contents-hr/contents/html/applet_lambda_und_f.html (script by DL9MJ, 2024: the λ slider from
   0.5 to 10 m, the sine over 0 … 10 m, f = 299.792458 / λ MHz), CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des
   DARC e.V.; changed for simdeck (NOTES.md says what and why).
   Units: λ as a whole number of cm in the params (exact), m in the state; distance in m; f in MHz.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var C = 299.792458;                 // speed of light in m·MHz (299 792 458 m/s), as the original
  var RULE = 300;                     // the rule of thumb of the 50ohm section and the exam formula sheet
  var WINDOW = 10;                    // shown distance, m (the original's x axis)
  var CM_MIN = 50, CM_MAX = 1000;     // the original's slider: 0.50 … 10.00 m in 1 cm steps

  function clampInt(x, lo, hi) {
    var n = Math.round(Number(x));
    if (!isFinite(n)) n = lo;
    return Math.min(hi, Math.max(lo, n));
  }

  /** f in MHz for λ in whole cm: c / λ. Computed from cm (c · 100 / cm), so no λ = cm / 100 rounding enters. */
  function frequencyOf(cm) { return (C * 100) / cm; }

  /** The rule of thumb 300 / λ, in MHz, for λ in whole cm. */
  function ruleOf(cm) { return (RULE * 100) / cm; }

  /** The wave's displacement at distance x (m), as a fraction of the amplitude: sin(2π x / λ). Zero at x = 0. */
  function wave(x, lambda) { return Math.sin(2 * Math.PI * x / lambda); }

  /** Crest positions (m) inside the window: x = λ/4 + kλ, both ends included. */
  function crestsOf(lambda) {
    var out = [];
    for (var k = 0; lambda / 4 + k * lambda <= WINDOW + 1e-9; k++) out.push(lambda / 4 + k * lambda);
    return out;
  }

  /** The wavelength marker: from one crest to the next when two crests fit in the window, otherwise from x = 0 to
      x = λ (two points in the same phase, an upward zero crossing each).
      Tie-break: λ = 8 m puts the second crest exactly on the window's end (10 m), and that counts as fitting. */
  function markerOf(lambda) {
    var c = crestsOf(lambda);
    if (c.length >= 2) return { kind: 'crest', x1: c[0], x2: c[1] };
    return { kind: 'zero', x1: 0, x2: lambda };
  }

  var defaults = { cm: 200 };

  /** Presets (keys 1–7, in this order). The first five halve λ each time, so f doubles. The page adds the labels. */
  var presets = [
    { id: 'm8', params: { cm: 800 } },
    { id: 'm4', params: { cm: 400 } },
    { id: 'm2', params: { cm: 200 } },
    { id: 'm1', params: { cm: 100 } },
    { id: 'cm50', params: { cm: 50 } },
    { id: 'm3', params: { cm: 300 } },
    { id: 'm10', params: { cm: 1000 } }
  ];

  /** The state the page draws: λ, f exact and by the rule of thumb, how many wavelengths fit, and the marker. */
  function initial(p) {
    var cm = clampInt(p.cm, CM_MIN, CM_MAX), lambda = cm / 100;
    return {
      cm: cm,
      lambda: lambda,
      f: frequencyOf(cm),
      fRule: ruleOf(cm),
      periods: WINDOW / lambda,
      crests: crestsOf(lambda),
      marker: markerOf(lambda)
    };
  }

  /** The wave over the window as { x, y } points: at least `perPeriod` points per wavelength, at least `min` overall. */
  function curve(lambda, perPeriod, min) {
    var n = Math.max(min || 0, Math.ceil((WINDOW / lambda) * (perPeriod || 48)));
    var out = [];
    for (var i = 0; i <= n; i++) { var x = (i / n) * WINDOW; out.push({ x: x, y: wave(x, lambda) }); }
    return out;
  }

  var logic = {
    C: C, RULE: RULE, WINDOW: WINDOW, CM_MIN: CM_MIN, CM_MAX: CM_MAX,
    defaults: defaults,
    presets: presets,
    initial: initial,
    frequencyOf: frequencyOf,
    ruleOf: ruleOf,
    wave: wave,
    crestsOf: crestsOf,
    markerOf: markerOf,
    curve: curve
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
