/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the sampling theorem: a 1 kHz sine is sampled at fs and rebuilt from its samples by sinc
   (Whittaker–Shannon) interpolation. An explorer: no steps; the page draws initial(params).
   Adopted from 50ohm-contents-hr/contents/html/applet_nyquist.html (signal, sinc, reconstruct, the sample grid
   and the 3-period window), CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; changed for simdeck
   (NOTES.md says what and why).
   Units: time in ms, frequency in kHz, so one period of the 1 kHz signal is 1 ms. The param fs is in Hz (an integer,
   so the slider, the URL and the Nyquist comparison are exact).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var F_SIG = 1;      // signal frequency, kHz (the original's F_SIG)
  var T_SHOW = 3;     // shown window, ms: three periods (the original's T_SHOW)
  var MARGIN = 100;    // samples are taken over [-MARGIN, T_SHOW + MARGIN] ms, so the sinc sum is not cut at the edges
  var FS_MIN = 1000, FS_MAX = 8000, FS_STEP = 25;   // Hz, the original's slider (1.0–8.0 kHz in 0.025 steps)

  /** Normalised sinc: sin(πu) / (πu), 1 at u = 0. */
  function sinc(u) {
    if (Math.abs(u) < 1e-10) return 1;
    return Math.sin(Math.PI * u) / (Math.PI * u);
  }

  /** The analogue signal at time t (ms): a sine of F_SIG kHz starting at zero phase. */
  function signal(t) { return Math.sin(2 * Math.PI * F_SIG * t); }

  /** Samples x[n] = signal(n / fs) for every n whose time lies in [from, to] ms; fs in kHz. */
  function sample(fsKhz, from, to) {
    var out = [];
    // + 0 turns Math.ceil(-1e-9) = -0 into 0: JSON has no -0, and the state must survive a round trip.
    var n0 = Math.ceil(from * fsKhz - 1e-9) + 0, n1 = Math.floor(to * fsKhz + 1e-9);
    for (var n = n0; n <= n1; n++) out.push({ n: n, t: n / fsKhz, y: signal(n / fsKhz) });
    return out;
  }

  /** Whittaker–Shannon: x(t) = Σ x[n] · sinc(fs·t − n), over the given samples. */
  function reconstruct(t, samples, fsKhz) {
    var sum = 0;
    for (var i = 0; i < samples.length; i++) sum += samples[i].y * sinc(fsKhz * t - samples[i].n);
    return sum;
  }

  /** The frequency the samples show: f folded into [0, fs/2] (|f − k·fs| for the nearest k). In kHz. */
  function aliasFrequency(fKhz, fsKhz) {
    var k = Math.round(fKhz / fsKhz);
    return Math.abs(fKhz - k * fsKhz);
  }

  /** Nyquist condition for the signal: 'ok' when fs > 2f, 'boundary' at fs = 2f exactly, 'alias' below.
      Tie-break: fs = 2f is not enough. The theorem asks for fs > 2f: at exactly 2f the samples of this sine land
      on its zero crossings and the reconstruction is a flat line (the original counted it as met). Integers in Hz,
      so the comparison is exact. */
  function condition(fsHz) {
    var limit = 2 * F_SIG * 1000;
    if (fsHz > limit) return 'ok';
    if (fsHz === limit) return 'boundary';
    return 'alias';
  }

  var defaults = { fs: 3000 };

  /** Presets (keys 1–7, in this order), from well above the limit down to fs = f. The page adds the labels. */
  var presets = [
    { id: 'oversampled', params: { fs: 8000 } },
    { id: 'above', params: { fs: 3000 } },
    { id: 'just-above', params: { fs: 2200 } },
    { id: 'boundary', params: { fs: 2000 } },
    { id: 'alias', params: { fs: 1500 } },
    { id: 'slow-alias', params: { fs: 1200 } },
    { id: 'equal', params: { fs: 1000 } }
  ];

  /** The state the page draws: the samples in the window and the numbers the caption names. */
  function initial(p) {
    var fsHz = Math.min(FS_MAX, Math.max(FS_MIN, Math.round(p.fs)));
    var fsKhz = fsHz / 1000;
    var cond = condition(fsHz);
    return {
      fs: fsKhz,
      limit: 2 * F_SIG,
      perPeriod: fsKhz / F_SIG,
      condition: cond,
      // The frequency the reconstruction shows: the signal itself when fs > 2f, its alias below 2f, and none at
      // fs = 2f (the samples are all zero: a flat line).
      shown: cond === 'ok' ? F_SIG : cond === 'boundary' ? null : aliasFrequency(F_SIG, fsKhz),
      samples: sample(fsKhz, 0, T_SHOW)
    };
  }

  /** Reconstruction over the window at `points` + 1 evenly spaced times, from samples over the wider margin. */
  function reconstruction(fsKhz, points) {
    var samples = sample(fsKhz, -MARGIN, T_SHOW + MARGIN);
    var out = [];
    for (var i = 0; i <= points; i++) {
      var t = (i / points) * T_SHOW;
      out.push({ t: t, y: reconstruct(t, samples, fsKhz) });
    }
    return out;
  }

  /** The analogue curve over the window at `points` + 1 evenly spaced times. */
  function curve(points) {
    var out = [];
    for (var i = 0; i <= points; i++) { var t = (i / points) * T_SHOW; out.push({ t: t, y: signal(t) }); }
    return out;
  }

  var logic = {
    F_SIG: F_SIG, T_SHOW: T_SHOW, MARGIN: MARGIN, FS_MIN: FS_MIN, FS_MAX: FS_MAX, FS_STEP: FS_STEP,
    defaults: defaults,
    presets: presets,
    initial: initial,
    sinc: sinc,
    signal: signal,
    sample: sample,
    reconstruct: reconstruct,
    reconstruction: reconstruction,
    curve: curve,
    aliasFrequency: aliasFrequency,
    condition: condition
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
