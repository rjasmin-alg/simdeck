/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for phase modulation, set against frequency modulation. Over a window of one time unit a carrier makes FC = 8
   periods; a modulating signal m(t) between −1 and +1 makes FS = 1.2 periods. With k = Δφ in radians:
     PM: s(t) = sin(2π · FC · t + k · m(t))           the phase follows the value of the signal directly
     FM: s(t) = sin(2π · FC · t + 2π · k · ∫₀ᵗ m)      the frequency follows it (FC ± k periods per window),
                                                       so the phase is its running integral
   An edge of m (a square or a sawtooth) makes the PM phase jump at once by Δφ · (m after − m before); the FM phase
   does not jump, it only bends.
   An explorer: no steps; the page draws initial(params) and the curves from curve().
   Adopted from 50ohm-contents-hr/contents/html/applet_pm.html (FC = 8, FS = 1.2, the four signal shapes, one strength
   for both FM and PM, 1200 samples), CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; changed for
   simdeck (NOTES.md says what and why).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var FC = 8;                                // carrier periods in the window (the original's FC)
  var FS = 1.2;                              // modulating signal periods in the window (the original's fs)
  var POINTS = 1200;                         // samples over the window (the original's N): 150 per carrier period
  var DEV_MIN = 0, DEV_MAX = 180, DEV_STEP = 15;   // peak phase shift Δφ in degrees
  var SHAPES = ['sine', 'square', 'saw', 'ramp'];  // the original's drop-down, in its order

  var defaults = { shape: 'sine', dev: 90 };       // the original's start: a sine, k = 1.5 rad (≈ 86°, here 90°)

  /** Δφ in whole steps of 15° in [0, 180]. Tie-breaks: not a number → the default; between two steps → the nearer,
      a half step up (as the kit snaps a slider value to its grid). */
  function clampDev(v) {
    var x = Number(v);
    if (v === null || v === '' || typeof v === 'boolean' || !Number.isFinite(x)) return defaults.dev;
    x = Math.max(DEV_MIN, Math.min(DEV_MAX, x));
    return Math.round(x / DEV_STEP) * DEV_STEP;
  }
  /** A known shape, else the default. */
  function clampShape(v) { return SHAPES.indexOf(v) >= 0 ? v : defaults.shape; }

  function frac(x) { return x - Math.floor(x); }

  /** The modulating signal at time t (0 ≤ t ≤ 1), between −1 and +1.
      Tie-break: at an edge the square and the sawtooth already have their new value (each period is [start, end)),
      so the square is +1 from t = 0, not 0 as Math.sign(sin 0) gave in the original. */
  function message(shape, t) {
    var x = frac(FS * t);                    // position in the signal's own period, 0 ≤ x < 1
    switch (shape) {
      case 'sine': return Math.sin(2 * Math.PI * FS * t);
      case 'square': return x < 0.5 ? 1 : -1;
      case 'saw': return 2 * x - 1;
      case 'ramp': return Math.max(-1, Math.min(1, 2 * t - 1));
      default: return 0;
    }
  }

  /** ∫₀ᵗ m(u) du, exactly. Every full period of the sine, square and sawtooth adds 0. */
  function integral(shape, t) {
    var p = 1 / FS, x = t - Math.floor(t * FS) * p;   // time into the current period
    switch (shape) {
      case 'sine': return (1 - Math.cos(2 * Math.PI * FS * t)) / (2 * Math.PI * FS);
      case 'square': return x < p / 2 ? x : p - x;
      case 'saw': return FS * x * x - x;
      case 'ramp': return t * t - t;
      default: return 0;
    }
  }

  function rad(deg) { return deg * Math.PI / 180; }

  /** The phase each wave adds to the carrier at time t, in radians. */
  function phasePM(shape, dev, t) { return rad(dev) * message(shape, t); }
  function phaseFM(shape, dev, t) { return 2 * Math.PI * rad(dev) * integral(shape, t); }

  function carrier(t) { return Math.sin(2 * Math.PI * FC * t); }
  function pm(shape, dev, t) { return Math.sin(2 * Math.PI * FC * t + phasePM(shape, dev, t)); }
  function fm(shape, dev, t) { return Math.sin(2 * Math.PI * FC * t + phaseFM(shape, dev, t)); }

  /** A phase step in degrees, folded into (−180, 180]: a jump by a whole turn cannot be seen. */
  function fold(deg) {
    var r = ((deg % 360) + 360) % 360;
    return r > 180 ? r - 360 : r;
  }

  /** The edges of the signal inside the window (0 < t < 1), each with the PM phase jump it causes, in degrees.
      The sine and the ramp have none; the square has one every half period, the sawtooth one every period. */
  function edges(shape, dev) {
    var out = [], step = shape === 'square' ? 0.5 / FS : shape === 'saw' ? 1 / FS : 0;
    if (!step) return out;
    for (var j = 1; j * step < 1; j++) {
      var t = j * step;
      var before = shape === 'square' ? (j % 2 ? 1 : -1) : 1;
      var after = -before;
      out.push({ t: t, before: before, after: after, jump: fold(dev * (after - before)) });
    }
    return out;
  }

  /** Where the unmodulated carrier crosses zero going up: t = i / FC, i = 0 … FC − 1. The page draws them as
      reference marks, so a PM wave that leads or lags is visible. */
  function zeros() {
    var out = [];
    for (var i = 0; i < FC; i++) out.push(i / FC);
    return out;
  }

  /** The four rows over the window at `points` + 1 evenly spaced times: signal, carrier, FM, PM. */
  function curve(shape, dev, points) {
    var n = points || POINTS, out = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      out.push({ t: t, m: message(shape, t), c: carrier(t), fm: fm(shape, dev, t), pm: pm(shape, dev, t) });
    }
    return out;
  }

  /** Presets (keys 1–6, in this order): the original's start; the square with phase reversal; the sawtooth; the
      ramp, whose steadily rising phase is a higher frequency; no modulation; and the square at 180°, where each
      jump is a whole turn. The page adds labels. */
  var presets = [
    { id: 'sine', params: { shape: 'sine', dev: 90 } },
    { id: 'reversal', params: { shape: 'square', dev: 90 } },
    { id: 'saw', params: { shape: 'saw', dev: 90 } },
    { id: 'ramp', params: { shape: 'ramp', dev: 180 } },
    { id: 'none', params: { shape: 'sine', dev: 0 } },
    { id: 'turn', params: { shape: 'square', dev: 180 } }
  ];

  /** The state the page draws. Tie-breaks: with Δφ = 0 there is no modulation (`none`), and FM and PM are the carrier;
      an edge whose jump folds to 0° (a whole turn) is listed but counts as not visible (`hidden`). */
  function initial(p) {
    var shape = clampShape(p.shape), dev = clampDev(p.dev);
    var es = dev === 0 ? [] : edges(shape, dev);
    var k = rad(dev);
    return {
      shape: shape,
      dev: dev,
      none: dev === 0,
      fmSwing: k,                            // FM: the frequency runs between FC − k and FC + k periods per window
      fmLow: FC - k,
      fmHigh: FC + k,
      // PM with the ramp: the phase rises by 2Δφ over the window, i.e. 2Δφ/360° periods more than the carrier
      rampExtra: shape === 'ramp' ? 2 * dev / 360 : 0,
      edges: es,
      jumps: es.filter(function (e) { return e.jump !== 0; }).length,
      hidden: es.length > 0 && es.every(function (e) { return e.jump === 0; }),
      zeros: zeros()
    };
  }

  var logic = {
    FC: FC, FS: FS, POINTS: POINTS, DEV_MIN: DEV_MIN, DEV_MAX: DEV_MAX, DEV_STEP: DEV_STEP, SHAPES: SHAPES,
    defaults: defaults,
    presets: presets,
    initial: initial,
    clampDev: clampDev,
    clampShape: clampShape,
    message: message,
    integral: integral,
    phasePM: phasePM,
    phaseFM: phaseFM,
    carrier: carrier,
    pm: pm,
    fm: fm,
    fold: fold,
    edges: edges,
    zeros: zeros,
    curve: curve
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
