/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for mains hum and ripple: the voltage on the load R_L behind a rectifier on 50 Hz mains, with or without a
   reservoir capacitor C_L, and the hum it makes in a speaker.
     mains: u(t) = sin(2π · 50 Hz · t), in units of the peak voltage Û (Û = 1).
     rectified: half-wave max(u, 0), full-wave |u|. Ideal diodes (no forward drop), ideal source (no resistance).
     with C_L: the time constant τ = R_L · C_L. While the diode conducts, the output follows the rectified sine; it stops
       conducting where the sine falls faster than C_L discharges into R_L (ω cos θ + sin θ / (ωτ) = 0, so
       θ_off = π − atan(ωτ)), and from there the output decays as e^(−t/τ) until the next half-wave reaches it.
     The ripple repeats with the rectified wave: every 20 ms (50 Hz) half-wave, every 10 ms (100 Hz) full-wave, because
     full-wave rectification turns the negative half-wave up as well (50ohm, restwelligkeit.md).
   Closed form in the steady state (an ideal diode reaches it at the first peak): out(rect, tau, t) at any time t.
   An explorer: no steps; the page draws initial(params) and plays the AC part of out() as the hum.
   Adopted from 50ohm-contents-hr/contents/html/applet_brumm.html (a 50 Hz and a 100 Hz ripple tone, shaped "fast
   rise, slow fall", its mean removed), CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; here the shape
   comes from the circuit instead of a fixed curve (NOTES.md says what and why).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MAINS = 50;                          // Hz
  var W = 2 * Math.PI * MAINS;             // ω, rad/s
  var T_MS = 60;                           // the plot's time axis: three mains periods, in ms
  var TAU_MIN = 0, TAU_MAX = 200, TAU_STEP = 10;   // τ = R_L · C_L in ms; 0 = no capacitor
  var SAMPLES = 2000;                      // per ripple period, for the mean and the minimum

  var RECTS = ['half', 'full'];
  var defaults = { rect: 'full', tau: 40, ac: false };

  /** τ in whole steps of 10 ms in [0, 200]. Tie-breaks: not a number → `fallback`; between two steps → the nearer, a
      half step up (as the kit snaps a slider). */
  function clampTau(v, fallback) {
    var x = Number(v);
    if (v === null || v === '' || typeof v === 'boolean' || !Number.isFinite(x)) return fallback;
    x = Math.max(TAU_MIN, Math.min(TAU_MAX, x));
    return Math.round(x / TAU_STEP) * TAU_STEP;
  }

  /** The ripple's frequency in Hz: the mains frequency half-wave, twice it full-wave. */
  function rippleHz(rect) { return rect === 'full' ? 2 * MAINS : MAINS; }

  /** The mains voltage at t (ms), in units of Û. */
  function mains(t) { return Math.sin(W * t / 1000); }

  /** The rectified voltage at t (ms) without a capacitor: max(u, 0) half-wave, |u| full-wave. */
  function rectified(rect, t) {
    var u = mains(t);
    return rect === 'full' ? Math.abs(u) : Math.max(u, 0);
  }

  /** The output on R_L at t (ms) with τ = R_L · C_L (ms), in the steady state. τ = 0: no capacitor, the rectified
      wave itself. Tie-break: exactly at the switch-off phase the diode still conducts (the sine's value, which equals
      the start of the decay). */
  function out(rect, tau, t) {
    var r = rectified(rect, t);
    if (!(tau > 0)) return r;
    var period = rect === 'full' ? Math.PI : 2 * Math.PI;      // of the rectified wave, in mains radians
    var wt = W * tau / 1000;                                    // ωτ
    var off = Math.PI - Math.atan(wt);                          // where the diode stops conducting
    var vOff = Math.sin(off);
    var th = ((W * t / 1000) % period + period) % period;
    if (th > off) return vOff * Math.exp(-(th - off) / wt);    // decaying, until the period ends
    // before the switch-off: the decay that began in the last period, until the rising half-wave reaches it
    return Math.max(r, vOff * Math.exp(-(th + period - off) / wt));
  }

  /** Over one ripple period: the mean (the DC part), the minimum and maximum, the peak-to-peak ripple, and the
      largest distance of the AC part from 0. In units of Û. */
  function stats(rect, tau) {
    var Tr = 1000 / rippleHz(rect), sum = 0, min = Infinity, max = -Infinity;
    for (var i = 0; i < SAMPLES; i++) {
      var v = out(rect, tau, i * Tr / SAMPLES);
      sum += v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    var mean = sum / SAMPLES;
    return { mean: mean, min: min, max: max, pp: max - min, acPeak: Math.max(max - mean, mean - min) };
  }

  /** One period of the hum, sampled at `rate` Hz: the AC part of out() (the mean removed, as a speaker behind a
      coupling capacitor gets it, and as the original removed it). Not normalised: a smaller ripple is a quieter hum.
      Plain array of numbers, length round(rate / rippleHz). */
  function humPeriod(rect, tau, rate) {
    var n = Math.round(rate / rippleHz(rect));
    var vals = [], sum = 0;
    for (var i = 0; i < n; i++) {
      var v = out(rect, tau, i * 1000 / rate);
      vals.push(v);
      sum += v;
    }
    var mean = sum / n;
    return vals.map(function (v) { return v - mean; });
  }

  /** Points for the plot: [t, value] from 0 to T_MS ms, n + 1 of them. */
  function trace(fn, n) {
    var pts = [];
    for (var k = 0; k <= n; k++) {
      var t = T_MS * k / n;
      pts.push([t, fn(t)]);
    }
    return pts;
  }

  var presets = [
    { id: 'half0', params: { rect: 'half', tau: 0, ac: false } },
    { id: 'full0', params: { rect: 'full', tau: 0, ac: false } },
    { id: 'half', params: { rect: 'half', tau: 40, ac: false } },
    { id: 'full', params: { rect: 'full', tau: 40, ac: false } },
    { id: 'big', params: { rect: 'full', tau: 160, ac: false } },
    { id: 'ac', params: { rect: 'full', tau: 40, ac: true } }
  ];

  /** The state the page draws. Unknown rect → the default, τ clamped, ac a boolean. Mean and ripple also in whole
      percent of Û (the smallest ripple on the slider, full-wave at 200 ms, is 4 %, so none rounds to 0 %). */
  function initial(p) {
    var rect = RECTS.indexOf(p.rect) >= 0 ? p.rect : defaults.rect;
    var tau = clampTau(p.tau, defaults.tau);
    var ac = p.ac === true || p.ac === 'true' || p.ac === 1 || p.ac === '1';
    var f = rippleHz(rect), st = stats(rect, tau);
    var N = 600;
    var round4 = function (x) { return Math.round(x * 1e4) / 1e4 || 0; };   // || 0: no −0, which JSON would turn into 0
    var pts = function (fn) { return trace(fn, N).map(function (q) { return [round4(q[0]), round4(q[1])]; }); };
    return {
      rect: rect,
      tau: tau,
      cap: tau > 0,
      ac: ac,
      f: f,
      periodMs: 1000 / f,
      mean: round4(st.mean),
      min: round4(st.min),
      pp: round4(st.pp),
      acPeak: round4(st.acPeak),
      meanPct: Math.round(st.mean * 100),
      ppPct: Math.round(st.pp * 100),
      mains: pts(mains),
      rectified: pts(function (t) { return rectified(rect, t); }),
      out: pts(function (t) { return out(rect, tau, t); })
    };
  }

  var logic = {
    MAINS: MAINS, T_MS: T_MS, TAU_MIN: TAU_MIN, TAU_MAX: TAU_MAX, TAU_STEP: TAU_STEP, RECTS: RECTS,
    defaults: defaults,
    presets: presets,
    initial: initial,
    clampTau: clampTau,
    rippleHz: rippleHz,
    mains: mains,
    rectified: rectified,
    out: out,
    stats: stats,
    humPeriod: humPeriod
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
