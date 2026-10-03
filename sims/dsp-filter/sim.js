/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the SSB filter method (dsp-filter), after 50ohm's applet_dsp_filter.html and its figures 831/832 and
   940/941 (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; figures by DL9MJ).
   Speech (300 Hz … 3 kHz) goes into a balanced mixer with a crystal oscillator; the mixer gives both sidebands (DSB),
   and a bandpass filter fixed at 9000 kHz ± 1.5 kHz keeps one of them. Which one depends only on the crystal:
   9001.5 kHz puts the lower sideband into the filter (LSB), 8998.5 kHz the upper one (USB).
   Every frequency is a whole number of hertz, so the filter's edges compare exactly.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var AF_LO = 300, AF_HI = 3000;                    // the speech band, Hz (figures 940/941)
  var FILTER = [8998500, 9001500];                  // 9000 kHz ± 1.5 kHz, Hz (figures 831/832)
  var XTAL = { lsb: 9001500, usb: 8998500 };        // the two crystals, Hz
  var P_LO = 1, P_HI = 0.6;                         // relative power at 300 Hz and 3 kHz (the figures' 1.25 and 0.75)
  var TONE_MIN = AF_LO, TONE_MAX = AF_HI, TONE_STEP = 100;

  var defaults = { sb: 'lsb', tone: 1000 };

  var presets = [
    { id: 'lsb', params: { sb: 'lsb', tone: 1000 } },
    { id: 'usb', params: { sb: 'usb', tone: 1000 } },
    { id: 'lsbEdge', params: { sb: 'lsb', tone: 3000 } },
    { id: 'usbLow', params: { sb: 'usb', tone: 300 } }
  ];

  /** The sideband switch: 'usb' or else 'lsb' (the original's start, also for anything unknown). */
  function sideband(x) { return x === 'usb' ? 'usb' : 'lsb'; }

  /** A tone in Hz, clamped to the speech band and snapped to 100 Hz (halves up); a non-number gives the default. */
  function snapTone(x) {
    var v = Number(x);
    if (!isFinite(v)) v = defaults.tone;
    v = Math.min(TONE_MAX, Math.max(TONE_MIN, v));
    return TONE_MIN + Math.floor((v - TONE_MIN) / TONE_STEP + 0.5 + 1e-9) * TONE_STEP;
  }

  /** Relative power of the speech spectrum at f (Hz), falling in a straight line; 0 outside 300 Hz … 3 kHz. */
  function power(f) {
    if (f < AF_LO || f > AF_HI) return 0;
    return P_LO + (P_HI - P_LO) * (f - AF_LO) / (AF_HI - AF_LO);
  }

  /** Whether a frequency is inside the filter's passband. Ideal filter, edges included. */
  function inFilter(f) { return f >= FILTER[0] && f <= FILTER[1]; }

  /** Whether a whole band [lo, hi] is inside the passband. */
  function bandPasses(b) { return inFilter(b[0]) && inFilter(b[1]); }

  /** The mixer's output for oscillator fo: the lower sideband fo − f (mirrored) and the upper fo + f. */
  function mix(fo) {
    return { lower: [fo - AF_HI, fo - AF_LO], upper: [fo + AF_LO, fo + AF_HI] };
  }

  /** The distance from the passband to the nearest edge of a band that lies outside it (0 when they touch or overlap). */
  function gapTo(b) {
    if (b[0] > FILTER[1]) return b[0] - FILTER[1];
    if (b[1] < FILTER[0]) return FILTER[0] - b[1];
    return 0;
  }

  function initial(p) {
    var sb = sideband(p.sb), tone = snapTone(p.tone), fo = XTAL[sb];
    var d = mix(fo);
    var lowerOk = bandPasses(d.lower), upperOk = bandPasses(d.upper);
    // the band the filter keeps: decided by the frequencies, not by the switch's name
    var kept = lowerOk && !upperOk ? 'lower' : upperOk && !lowerOk ? 'upper' : null;
    var gone = kept === 'lower' ? 'upper' : kept === 'upper' ? 'lower' : null;
    var toneLower = fo - tone, toneUpper = fo + tone;
    return {
      sb: sb, tone: tone, fo: fo,
      filter: FILTER.slice(),
      lower: d.lower, upper: d.upper,
      kept: kept, gone: gone,
      out: kept ? d[kept] : null,
      // in the lower sideband a higher tone lands lower: the spectrum comes out mirrored
      mirrored: kept === 'lower',
      gap: gone ? gapTo(d[gone]) : 0,
      toneLower: toneLower, toneUpper: toneUpper,
      toneOut: inFilter(toneLower) && !inFilter(toneUpper) ? toneLower : inFilter(toneUpper) && !inFilter(toneLower) ? toneUpper : null,
      toneEdge: toneLower === FILTER[0] || toneLower === FILTER[1] || toneUpper === FILTER[0] || toneUpper === FILTER[1],
      // the carrier sits on the passband's edge: the balanced mixer suppresses it, the filter would not
      carrierEdge: fo === FILTER[0] || fo === FILTER[1],
      tonePower: power(tone)
    };
  }

  var logic = {
    AF_LO: AF_LO, AF_HI: AF_HI, FILTER: FILTER, XTAL: XTAL, P_LO: P_LO, P_HI: P_HI,
    TONE_MIN: TONE_MIN, TONE_MAX: TONE_MAX, TONE_STEP: TONE_STEP,
    defaults: defaults,
    presets: presets,
    initial: initial,
    sideband: sideband,
    snapTone: snapTone,
    power: power,
    inFilter: inFilter,
    bandPasses: bandPasses,
    mix: mix,
    gapTo: gapTo
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
