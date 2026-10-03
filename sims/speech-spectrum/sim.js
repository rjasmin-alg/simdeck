/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the spectrum of speech signals: the amplitude spectrum of a spoken sound, 50 Hz … 20 kHz on a log axis.
     voiced sound (a vowel): lines at the harmonics k · f0 of the pitch f0. Each line's amplitude is the source
       (1/k: the glottal pulse, −12 dB per octave, plus +6 dB per octave from the lips) times the vocal tract, a chain
       of resonances (formants): F1–F3 make the vowel, five more from 3.5 to 7.5 kHz, 1 kHz apart as in a 17 cm tube,
       are the same for every vowel.
     unvoiced sound ("s"): noise, no pitch: a continuous spectrum, sampled every 50 Hz, shaped by one broad resonance
       high up and a high-pass (the narrow gap between tongue and teeth).
   Levels are in dB relative to the strongest component (0 dB) and cut at FLOOR (−60 dB), the bottom of the plot.
   The page also shows the live microphone spectrum (Web Audio): fromAnalyser() turns its dB bins into the same shape,
   so strongest() and bandShare() read both the same way.
   An explorer: no steps; the page draws initial(params).
   Adopted from 50ohm-contents-hr/contents/html/spektrum_sprachsignale.html (the live microphone spectrum on a log
   axis up to 24 kHz, the strongest frequency, the first bin of the largest value), CC BY 4.0, 50ohm.de-Autorenteam,
   AJW-Referat des DARC e.V.; the model sound is added for simdeck (NOTES.md says what and why).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var FMIN = 50, FMAX = 20000;              // the plot's frequency axis, in Hz (log)
  var FLOOR = -60;                          // the plot's bottom, in dB below the strongest component
  var CEIL = 10;                            // the plot's top: a formant between two lines can peak above 0 dB
  var BAND = [300, 2700];                   // the voice band of a radio transmitter (50ohm, sprachsignale.md), in Hz
  var PITCH_MIN = 80, PITCH_MAX = 300, PITCH_STEP = 10;
  var NOISE_DF = 50;                        // the unvoiced spectrum's sample spacing, in Hz

  // Formants F1–F3 [Hz] of the vowels, men's averages (Peterson & Barney 1952); the higher ones, fixed; bandwidths.
  var VOWELS = {
    a: [730, 1090, 2440],
    i: [270, 2290, 3010],
    u: [300, 870, 2240]
  };
  var BW = [90, 110, 170, 250, 300, 350, 400, 450];
  var HIGH = [3500, 4500, 5500, 6500, 7500];
  // "s": one broad resonance and a second-order high-pass.
  var S_PEAK = 6500, S_BW = 3000, S_HP = 3500;

  var SOUNDS = ['a', 'i', 'u', 's'];
  var defaults = { sound: 'a', pitch: 120, band: false };

  /** The pitch in whole steps of 10 Hz in [80, 300]. Tie-breaks: not a number → `fallback`; between two steps → the
      nearer, a half step up (as the kit snaps a slider). */
  function clampPitch(v, fallback) {
    var x = Number(v);
    if (v === null || v === '' || typeof v === 'boolean' || !Number.isFinite(x)) return fallback;
    x = Math.max(PITCH_MIN, Math.min(PITCH_MAX, x));
    return Math.round(x / PITCH_STEP) * PITCH_STEP;
  }

  /** Gain of one resonance at F with bandwidth B: 1 at 0 Hz, about F/B at F, falling 12 dB per octave above. */
  function resonance(f, F, B) {
    return F * F / Math.sqrt(Math.pow(F * F - f * f, 2) + Math.pow(B * f, 2));
  }

  /** The vocal tract's gain at f for a vowel: the product of its resonances. */
  function tract(vowel, f) {
    var fs = VOWELS[vowel].concat(HIGH), g = 1;
    for (var i = 0; i < fs.length; i++) g *= resonance(f, fs[i], BW[i]);
    return g;
  }

  /** Raw (linear) amplitude of a voiced sound's k-th harmonic. */
  function harmonic(vowel, f0, k) { return tract(vowel, k * f0) / k; }

  /** Raw (linear) amplitude of the "s" noise at f. */
  function hiss(f) {
    var hp = (f * f) / (f * f + S_HP * S_HP);
    return resonance(f, S_PEAK, S_BW) * hp * hp;
  }

  function dB(a) { return 20 * Math.log10(a); }

  /** Lines [{ f, a }] (a linear, raw) → [{ f, a, db }] with db relative to the largest a, so the largest is 0 dB.
      A line below FLOOR keeps its true db; the page cuts it at the floor. */
  function normalise(lines) {
    var max = 0;
    lines.forEach(function (l) { if (l.a > max) max = l.a; });
    return lines.map(function (l) {
      return { f: l.f, a: max > 0 ? l.a / max : 0, db: max > 0 && l.a > 0 ? dB(l.a / max) : -Infinity };
    });
  }

  /** The spectrum of a sound: voiced → its harmonics k · f0 from f0 up to FMAX; "s" → samples every 50 Hz from FMIN
      to FMAX. Ascending in f. */
  function spectrum(sound, f0) {
    var out = [], k, f;
    if (sound === 's') {
      for (f = FMIN; f <= FMAX; f += NOISE_DF) out.push({ f: f, a: hiss(f) });
    } else {
      for (k = 1; k * f0 <= FMAX; k++) out.push({ f: k * f0, a: harmonic(sound, f0, k) });
    }
    return normalise(out);
  }

  /** The source-and-tract envelope a voiced sound's lines sit on, from f0 (the first line; below it the source has
      nothing) to FMAX at `n` + 1 points evenly spaced on the log axis,
      in dB relative to the strongest harmonic (so a formant between two lines can peak a little above 0 dB). "s" has
      no lines and no separate envelope: []. */
  function envelope(sound, f0, n) {
    if (sound === 's') return [];
    var m = n || 240, max = 0, k, out = [];
    for (k = 1; k * f0 <= FMAX; k++) max = Math.max(max, harmonic(sound, f0, k));
    for (var i = 0; i <= m; i++) {
      var f = f0 * Math.pow(FMAX / f0, i / m);
      out.push({ f: f, db: dB(tract(sound, f) * f0 / f / max) });
    }
    return out;
  }

  /** The vowel's formants F1–F3 as { n, f, db } (db on the envelope, as above); "s" → []. */
  function formants(sound, f0) {
    if (sound === 's') return [];
    var max = 0;
    for (var k = 1; k * f0 <= FMAX; k++) max = Math.max(max, harmonic(sound, f0, k));
    return VOWELS[sound].map(function (F, i) { return { n: i + 1, f: F, db: dB(tract(sound, F) * f0 / F / max) }; });
  }

  /** Index of the strongest line. Tie-break: equal amplitudes → the first, i.e. the lowest frequency (the original's
      getBigBinIndex: only a strictly larger value moves it). Empty or all −Infinity → 0, as in the original. */
  function strongest(lines) {
    var best = 0;
    for (var i = 1; i < lines.length; i++) if (lines[i].db > lines[best].db) best = i;
    return best;
  }

  /** Share of the power (sum of a²) that lies in [lo, hi], 0 … 1. Tie-break: a line exactly on an edge is inside.
      No power at all → 0. */
  function bandShare(lines, lo, hi) {
    var all = 0, inside = 0;
    lines.forEach(function (l) {
      var p = l.a * l.a;
      all += p;
      if (l.f >= lo && l.f <= hi) inside += p;
    });
    return all > 0 ? inside / all : 0;
  }

  /** The analyser's bins (dB, one per binHz from 0 Hz) as lines: bins below FMIN (0 Hz, rumble and hum, off the plot)
      and above FMAX are dropped, a −Infinity bin (silence) has a = 0. Levels are relative to the strongest bin left. */
  function fromAnalyser(dbs, binHz) {
    var out = [];
    for (var i = 0; i < dbs.length; i++) {
      var f = i * binHz;
      if (f < FMIN) continue;
      if (f > FMAX) break;
      out.push({ f: f, a: Number.isFinite(dbs[i]) ? Math.pow(10, dbs[i] / 20) : 0 });
    }
    return normalise(out);
  }

  /** Presets (keys 1–6, in this order): the vowels a, i, u at a low voice; a at a high voice (the lines move apart,
      the formants stay); the unvoiced "s"; and a with the radio band shown. The page adds labels. */
  var presets = [
    { id: 'a', params: { sound: 'a', pitch: 120 } },
    { id: 'i', params: { sound: 'i', pitch: 120 } },
    { id: 'u', params: { sound: 'u', pitch: 120 } },
    { id: 'high', params: { sound: 'a', pitch: 240 } },
    { id: 's', params: { sound: 's', pitch: 120 } },
    { id: 'band', params: { sound: 'a', pitch: 120, band: true } }
  ];

  /** The state the page draws. `peak` is the strongest line ({ f, k } with k the harmonic number, 0 for noise);
      `share` the power share inside the radio band, also as whole percent (`sharePct`; tie-break: a share above 0 that
      rounds to 0 % sets `shareLow`, shown as "< 1 %", and one below 1 that rounds to 100 % sets `shareHigh`, shown as
      "> 99 %"); `top` the highest frequency that still reaches FLOOR.
      Unknown sound → the default, the pitch clamped, band a boolean. */
  function initial(p) {
    var sound = SOUNDS.indexOf(p.sound) >= 0 ? p.sound : defaults.sound;
    var pitch = clampPitch(p.pitch, defaults.pitch);
    var band = p.band === true || p.band === 'true' || p.band === 1 || p.band === '1';
    var lines = spectrum(sound, pitch);
    var bi = strongest(lines);
    var share = bandShare(lines, BAND[0], BAND[1]);
    var top = 0;
    lines.forEach(function (l) { if (l.db >= FLOOR) top = l.f; });
    return {
      sound: sound,
      voiced: sound !== 's',
      pitch: pitch,
      band: band,
      lines: lines.map(function (l) { return { f: l.f, db: Number.isFinite(l.db) ? Math.max(l.db, FLOOR - 1) : FLOOR - 1 }; }),
      envelope: envelope(sound, pitch).map(function (e) { return { f: e.f, db: Math.max(e.db, FLOOR - 1) }; }),
      formants: formants(sound, pitch),
      peak: { f: lines[bi].f, k: sound === 's' ? 0 : Math.round(lines[bi].f / pitch) },
      share: share,
      sharePct: Math.round(share * 100),
      shareLow: share > 0 && Math.round(share * 100) === 0,
      shareHigh: share < 1 && Math.round(share * 100) === 100,
      top: top
    };
  }

  var logic = {
    FMIN: FMIN, FMAX: FMAX, FLOOR: FLOOR, CEIL: CEIL, BAND: BAND, NOISE_DF: NOISE_DF,
    PITCH_MIN: PITCH_MIN, PITCH_MAX: PITCH_MAX, PITCH_STEP: PITCH_STEP,
    VOWELS: VOWELS, SOUNDS: SOUNDS,
    defaults: defaults,
    presets: presets,
    initial: initial,
    clampPitch: clampPitch,
    resonance: resonance,
    tract: tract,
    harmonic: harmonic,
    hiss: hiss,
    normalise: normalise,
    envelope: envelope,
    formants: formants,
    spectrum: spectrum,
    strongest: strongest,
    bandShare: bandShare,
    fromAnalyser: fromAnalyser
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
