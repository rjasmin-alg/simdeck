/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for dipole-length: current, pattern and radiation resistance of a centre-fed dipole (SPEC.md).
   The physics of currents and patterns is current-pattern.js (pure, promotable: catalogue §5.26, model 3). This file
   adds the page's situation: one thin dipole of length L (0.1 … 2 λ), the params (length, time), the readout (feed
   current, radiation and feed resistance, directivity, main lobe, beamwidth, length in metres at 7.1 MHz), the current
   along the wire and the pattern for drawing, the curve of R against L, and the presets.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var CP = typeof module === 'object' && module.exports
    ? require('./current-pattern.js')
    : root.SimdeckModels['current-pattern'];

  var D2R = Math.PI / 180;
  var C0 = 299792458;                 // m/s
  var FREQ = 7.1e6;                   // Hz: the 40 m band, for lengths in metres
  var LAMBDA = C0 / FREQ;             // m, 42.22 m
  var LEN_MIN = 0.1, LEN_MAX = 2, LEN_STEP = 0.01;
  var RIN_HIGH = 2000;                // Ω: above this the caption adds the thin-wire caveat (tie-break 5)
  var RIN_CAP = 10000;                // Ω: above this the feed resistance is shown as "> 10 kΩ" (SPEC.md §1, tie-break 5)
  var SHORT_K = CP.ETA0 * Math.PI / 6; // Ω: η·π/6 ≈ 197.3 (20π² with η = 120π), times (L/λ)², the short dipole's feed resistance (Balanis 4-37)
  var HALF = CP.resistanceAtCrest(0.5); // Ω: the half-wave dipole's 73.08 Ω
  var T_STEP = 5, KEY_STEP = 15;      // degrees: the time slider's step, → / ← in time

  /** Params: len = the dipole's whole length in wavelengths; t = the phase ωt of the current (0 … 355°). */
  var defaults = { len: 0.5, t: 0 };

  /** Params made safe: len clamped to 0.1 … 2 and put on the 0.01 grid; t wraps into [0, 360). */
  function norm(p) {
    p = p || {};
    var len = Number(p.len);
    len = isFinite(len) && p.len !== null && p.len !== '' ? Math.min(LEN_MAX, Math.max(LEN_MIN, len)) : defaults.len;
    len = Math.round(len / LEN_STEP) * LEN_STEP;
    len = Number(len.toFixed(2));
    var t = Number(p.t);
    t = isFinite(t) && p.t !== null && p.t !== '' ? ((t % 360) + 360) % 360 : defaults.t;
    if (t >= 360) t = 0;
    return { len: len, t: t };
  }

  /** dB of a power ratio; null for zero (−∞ is not JSON). */
  function db(x) { return x > 0 ? 10 * Math.log10(x) : null; }

  /** The largest current on the wire over the crest: |sin πL| up to λ/2, then 1 (the crest lies on the wire). */
  function iMax(len) { return len <= 0.5 ? Math.abs(CP.feedCurrent(len)) : 1; }

  /** The reversed segments on the upper half (s ≥ 0, mirror for s ≤ 0): intervals [s0, s1] where the current has the
      opposite sign to the end segment. Zeros of sin(2π(L/2 − s)) at s = L/2 − n/2, n = 1, 2, …; s = 0 (the feed) is not
      inside the wire's half, so a zero there starts no segment (tie-break 6). */
  function reversed(len) {
    var out = [], zeros = [];
    for (var n = 1; len / 2 - n / 2 > 1e-9; n++) zeros.push(Number((len / 2 - n / 2).toFixed(6)));
    // zeros run from the end towards the feed: segments between them alternate sign, the end segment positive
    var edges = [len / 2].concat(zeros).concat([0]);
    for (var i = 0; i + 1 < edges.length; i++) {
      if (i % 2 === 1 && edges[i] - edges[i + 1] > 1e-9) out.push([edges[i + 1], edges[i]]);
    }
    return out;
  }

  /** The current along the upper half, from the feed (s = 0) to the end, every step λ (for drawing; mirror below). */
  function currentAlong(len, step) {
    step = step || 0.005;
    var out = [], n = Math.max(2, Math.ceil(len / 2 / step));
    for (var i = 0; i <= n; i++) { var s = len / 2 * i / n; out.push({ s: s, i: CP.current(len, s) }); }
    return out;
  }

  /** The pattern in the plane through the wire, as field strength over an isotropic radiator of the same power:
      √D(θ) = √(2F²/∫F² sin θ dθ), θ from the wire 0 … 360° every step degrees (F is symmetric, 180 + θ = 180 − θ). */
  function patternPolar(len, step) {
    step = step || 1;
    var integ = CP.axialIntegral(len), out = [];
    for (var th = 0; th <= 360 + 1e-9; th += step) {
      var f = CP.elementFactor(len, Math.cos(th * D2R));
      out.push({ theta: th, r: integ > 0 ? Math.sqrt(2 * f * f / integ) : 0 });
    }
    return out;
  }

  /** The short dipole's √D(θ) = √1.5·|sin θ|, the reference drawn dashed. */
  function shortRef(th) { return Math.sqrt(1.5) * Math.abs(Math.sin(th * D2R)); }

  /** Everything the caption, the readout and the drawing need at these params (SPEC.md §3). */
  function link(p) {
    p = norm(p);
    var len = p.len;
    var feed = CP.feedCurrent(len);
    var im = iMax(len);
    var rc = CP.resistanceAtCrest(len);
    var rrad = rc / (im * im);
    var feedOpen = feed === 0;
    var rin = feedOpen ? null : rc / (feed * feed);
    var dd = CP.directivity(len);
    var rev = reversed(len);
    return {
      len: len,
      metres: len * LAMBDA,
      feed: feed,                                    // signed, over the crest
      feedPct: Math.abs(feed),
      iMax: im,
      atCrest: Math.abs(Math.abs(feed) - 1) < 1e-12,  // the feed sits at a current maximum (λ/2, 3λ/2)
      feedOpen: feedOpen,                            // the feed sits at a current zero (λ, 2λ)
      rCrest: rc, rRad: rrad, rIn: rin,
      feedHuge: rin === null || rin > RIN_CAP,
      feedHigh: rin === null || rin > RIN_HIGH,
      rShort: SHORT_K * len * len,                    // 197·(L/λ)², the short-dipole formula
      pctHalf: len <= 0.5 && rin !== null ? rin / HALF : null,   // power for the same feed current, against λ/2
      broadDb: db(Math.pow(CP.elementFactor(len, 0) / dd.fmax, 2)),   // broadside against the main lobe (null: a null)
      d: dd.d, dbi: db(dd.d), main: dd.main, broadside: dd.main === 90, beamwidth: dd.beamwidth, sideDb: dd.sideDb,
      reversed: rev,                                 // upper half; mirror for the lower
      hasReversed: rev.length > 0,
      feedReversed: feed < 0                         // the feed lies in a reversed segment
    };
  }

  /** The current at s and phase t over the crest: I(s)·cos ωt. */
  function currentNow(len, s, t) { return CP.snap(CP.current(len, s) * Math.cos(t * D2R)); }

  /** R_rad and R_feed against L over the slider's range (for the plot); R_feed null at the zeros. */
  function sweep(step) {
    step = step || 0.01;
    var out = [];
    for (var i = 0; LEN_MIN + i * step <= LEN_MAX + 1e-9; i++) {
      var len = Number((LEN_MIN + i * step).toFixed(4));
      var feed = CP.feedCurrent(len), rc = CP.resistanceAtCrest(len, 600), im = iMax(len);
      out.push({ len: len, rRad: rc / (im * im), rIn: feed === 0 ? null : rc / (feed * feed), rShort: SHORT_K * len * len });
    }
    return out;
  }

  /** State for the page (JSON-safe). */
  function initial(params) {
    var p = norm(Object.assign({}, defaults, params));
    var l = link(p);
    l.t = p.t;
    l.cosT = CP.snap(Math.cos(p.t * D2R));
    return l;
  }

  /** Presets (the page gives them names): each with what the lecturer should see (SPEC.md §5). */
  var presets = [
    { id: 'short', params: { len: 0.1, t: 0 } },
    { id: 'half', params: { len: 0.5, t: 0 } },
    { id: 'full', params: { len: 1, t: 0 } },
    { id: 'ext', params: { len: 1.25, t: 0 } },
    { id: 'three', params: { len: 1.5, t: 0 } },
    { id: 'two', params: { len: 2, t: 0 } }
  ];

  var logic = {
    C0: C0, FREQ: FREQ, LAMBDA: LAMBDA, LEN_MIN: LEN_MIN, LEN_MAX: LEN_MAX, LEN_STEP: LEN_STEP, RIN_CAP: RIN_CAP, RIN_HIGH: RIN_HIGH,
    SHORT_K: SHORT_K, HALF: HALF, T_STEP: T_STEP, KEY_STEP: KEY_STEP,
    defaults: defaults, presets: presets, norm: norm, initial: initial, link: link, db: db, iMax: iMax,
    reversed: reversed, currentAlong: currentAlong, currentNow: currentNow, patternPolar: patternPolar,
    shortRef: shortRef, sweep: sweep, CP: CP
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
