/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the amplitude and period of a sine wave: u(t) = a · sin(2π · t / T). The amplitude a is the greatest
   distance from the zero line to a crest or a trough; the period T is the time from the start of a positive
   half-wave to the end of the following negative one; f = 1/T oscillations per second (Hz).
   An explorer: no steps; the page draws initial(params).
   Adopted from 50ohm-contents-hr/contents/html/applet_sinus_amplitude_und_periode.html (script by DL9MJ, 2024: the
   formula, the sliders a = 0 … 100 % and T = 1 … 10 s, the 0 … 24 s time axis), CC BY 4.0, 50ohm.de-Autorenteam,
   AJW-Referat des DARC e.V.; changed for simdeck (NOTES.md says what and why).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var A_MIN = 0, A_MAX = 100, A_STEP = 1;   // the original's amplitude slider, in % of full scale
  var T_MIN = 1, T_MAX = 10, T_STEP = 1;    // the original's period slider, in whole seconds
  var WINDOW = 24;                          // the original's time axis: 0 … 24 s
  var POINTS = 1536;                        // samples over the window: 64 per period at T = 1 s

  var defaults = { a: 50, T: 1 };           // the original's starting values

  /** A whole number in [lo, hi]. Tie-breaks: not a number → the default (the original's start value); a fraction
      is rounded to the nearest whole number, a half up (as the kit snaps a slider value to its grid). */
  function clampInt(v, lo, hi, dflt) {
    var x = Number(v);
    if (v === null || v === '' || !Number.isFinite(x)) return dflt;
    return Math.max(lo, Math.min(hi, Math.round(x)));
  }
  function clampA(v) { return clampInt(v, A_MIN, A_MAX, defaults.a); }
  function clampT(v) { return clampInt(v, T_MIN, T_MAX, defaults.T); }

  /** The wave at time t (s): a · sin(2π t / T). At t = 0 it starts on the zero line, going up. */
  function value(t, a, T) { return a * Math.sin(2 * Math.PI * t / T); }

  /** The frequency in Hz: one period per T seconds, so f = 1/T. */
  function frequency(T) { return 1 / T; }

  /** The wave over the window at `points` + 1 evenly spaced times. */
  function curve(a, T, points) {
    var n = points || POINTS, out = [];
    for (var i = 0; i <= n; i++) {
      var t = (i / n) * WINDOW;
      out.push({ t: t, y: value(t, a, T) });
    }
    return out;
  }

  /** Presets (keys 1–7, in this order): the period doubles at a fixed amplitude (1 → 2 → 4 → 8 s), then the
      amplitude changes at a fixed period (100, 25, 0 %). The page adds labels. */
  var presets = [
    { id: 'start', params: { a: 50, T: 1 } },
    { id: 't2', params: { a: 50, T: 2 } },
    { id: 't4', params: { a: 50, T: 4 } },
    { id: 't8', params: { a: 50, T: 8 } },
    { id: 'full', params: { a: 100, T: 4 } },
    { id: 'quarter', params: { a: 25, T: 4 } },
    { id: 'zero', params: { a: 0, T: 4 } }
  ];

  /** The state the page draws. The marked period is the first one, from t = 0 (an upward zero crossing) to t = T,
      split into its positive half-wave [0, T/2] and its negative one [T/2, T]; the amplitude is marked at the first
      crest, t = T/4. Tie-break: with a = 0 there is no oscillation, so `flat` is set and neither a crest nor a
      half-wave is marked (the period of a flat line cannot be seen). */
  function initial(p) {
    var a = clampA(p.a), T = clampT(p.T);
    var flat = a === 0;
    return {
      a: a,
      T: T,
      f: frequency(T),
      periods: WINDOW / T,
      whole: Math.floor(WINDOW / T),
      flat: flat,
      period: { t1: 0, t2: T },
      halves: flat ? [] : [{ sign: 1, t1: 0, t2: T / 2 }, { sign: -1, t1: T / 2, t2: T }],
      crest: flat ? null : { t: T / 4, y: a }
    };
  }

  var logic = {
    A_MIN: A_MIN, A_MAX: A_MAX, A_STEP: A_STEP, T_MIN: T_MIN, T_MAX: T_MAX, T_STEP: T_STEP,
    WINDOW: WINDOW, POINTS: POINTS,
    defaults: defaults,
    presets: presets,
    initial: initial,
    clampA: clampA,
    clampT: clampT,
    value: value,
    frequency: frequency,
    curve: curve
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
