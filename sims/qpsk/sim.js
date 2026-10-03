/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for QPSK with noise: a bit string is cut into pairs, each pair is one of four symbols at 45°, 135°, 225° or
   315° in the I/Q plane, noise moves the received point, and the receiver decides for the symbol whose quadrant the
   point lies in. One step sends one symbol.
   Adopted from 50ohm-contents-hr/contents/html/applet_qpsk.html (the mapping 11/01/00/10, the bit string of shuffled
   groups of all four symbols, Gaussian noise of σ = noise % / 100 on I and Q, the noise slider 0–60 % at 18 %),
   CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; changed for simdeck (NOTES.md says what and why).
   Pure: no DOM, no Math.random, no Date, no timers; randomness from a seeded generator. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** The original's mapping (a Gray code: neighbours differ in one bit). i, q are the ideal point. */
  var MAPPING = {
    '11': { angle: 45, i: 1, q: 1 },
    '01': { angle: 135, i: -1, q: 1 },
    '00': { angle: 225, i: -1, q: -1 },
    '10': { angle: 315, i: 1, q: -1 }
  };
  var ORDER = ['11', '01', '00', '10'];   // counter-clockwise from 45°, as the original

  var GROUPS = 4;                          // shuffled groups of all four symbols (the original sends 8)
  var STEPS = GROUPS * ORDER.length;       // one step per symbol: 16
  var NOISE_MAX = 60;                      // %, as the original's slider

  /** mulberry32, the same generator as Simdeck.rng. */
  function rng(seed) {
    var a = seed >>> 0;
    var next = function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return next;
  }

  /** One standard normal draw (Box–Muller, as the original; u and v are never 0). */
  function gaussian(r) {
    var u = 0, v = 0;
    while (u === 0) u = r();
    while (v === 0) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** The bit string and its noise for a seed: GROUPS groups, each a Fisher–Yates shuffle of the four symbols, so
      every symbol is sent equally often; then two unit normal draws (I, Q) per symbol. Noise is drawn unscaled, so
      changing the noise level moves the same points further or nearer, and the bit string stays. */
  function plan(seed) {
    var r = rng(seed * 7919 + 13), sent = [], noise = [];
    for (var g = 0; g < GROUPS; g++) {
      var group = ORDER.slice();
      for (var i = group.length - 1; i > 0; i--) {
        var j = Math.floor(r() * (i + 1));
        var tmp = group[i]; group[i] = group[j]; group[j] = tmp;
      }
      sent.push.apply(sent, group);
    }
    for (var k = 0; k < sent.length; k++) noise.push([gaussian(r), gaussian(r)]);
    return { sent: sent, noise: noise };
  }

  /** The receiver's decision: the quadrant of the point. The first bit is 1 right of the Q axis, the second 1 above
      the I axis (that is the mapping). Tie-break: a point exactly on an axis counts to the positive side. */
  function decide(i, q) { return (i >= 0 ? '1' : '0') + (q >= 0 ? '1' : '0'); }

  /** Bits that differ between two pairs. */
  function bitErrors(a, b) { return (a[0] !== b[0] ? 1 : 0) + (a[1] !== b[1] ? 1 : 0); }

  /** Angle of a point in degrees, 0 ≤ a < 360. */
  function phase(i, q) {
    var a = Math.atan2(q, i) * 180 / Math.PI;
    return a < 0 ? a + 360 : a || 0;   // || 0: atan2(−0, x) is −0
  }

  function round4(x) { return Math.round(x * 1e4) / 1e4 || 0; }   // || 0: no −0 (JSON writes it as 0)

  function clamp(x, lo, hi) {
    var v = Math.round(Number(x));
    if (!isFinite(v)) v = lo;
    return Math.min(hi, Math.max(lo, v));
  }

  var defaults = { noise: 18, seed: 25 };

  /** Presets (keys 1–5, in this order). The page adds the labels. One bit string (seed 25) under more and more
      noise: no wrong symbol up to 30 %, two at 45 %, five at 60 %, each only one bit wrong (Gray code); seed 37 at
      60 % lands symbol 2 in the opposite quadrant, two bits wrong (all tested). */
  var presets = [
    { id: 'clean', params: { noise: 0, seed: 25 } },
    { id: 'original', params: { noise: 18, seed: 25 } },
    { id: 'strong', params: { noise: 45, seed: 25 } },
    { id: 'max', params: { noise: 60, seed: 25 } },
    { id: 'twoBits', params: { noise: 60, seed: 37 } }
  ];

  /** Step 0: the bit string is ready, nothing is sent yet. */
  function initial(p) {
    var pl = plan(clamp(p.seed, 1, 1e6));
    return {
      sigma: clamp(p.noise, 0, NOISE_MAX) / 100,
      sent: pl.sent,
      received: [],
      symbolErrors: 0,
      bitErrors: 0
    };
  }

  /** Step n sends symbol n − 1: its ideal point plus σ times its two noise draws, decided by quadrant. */
  function step(s, n, p) {
    var k = n - 1, bits = s.sent[k], ideal = MAPPING[bits];
    var g = plan(clamp(p.seed, 1, 1e6)).noise[k];
    var i = round4(ideal.i + g[0] * s.sigma), q = round4(ideal.q + g[1] * s.sigma);
    var got = decide(i, q), be = bitErrors(bits, got);
    var point = { k: k, bits: bits, i: i, q: q, phase: round4(phase(i, q)), decided: got, bitErrors: be };
    return {
      sigma: s.sigma,
      sent: s.sent,
      received: s.received.concat([point]),
      symbolErrors: s.symbolErrors + (be > 0 ? 1 : 0),
      bitErrors: s.bitErrors + be
    };
  }

  var logic = {
    MAPPING: MAPPING, ORDER: ORDER, GROUPS: GROUPS, NOISE_MAX: NOISE_MAX,
    steps: STEPS,
    defaults: defaults,
    presets: presets,
    initial: initial,
    step: step,
    plan: plan,
    gaussian: gaussian,
    decide: decide,
    bitErrors: bitErrors,
    phase: phase,
    rng: rng
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
