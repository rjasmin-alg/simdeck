/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for dipole-field: the oscillating (Hertzian) dipole over one period; near field, far field, and loops that
   break away (SPEC.md).
   The physics is hertzian-dipole.js (pure, promotable: catalogue §5.26, model 2). This file adds the page's
   situation: one short dipole at 10 MHz, the params (time as a phase, c finite or infinite, the probe's distance,
   the zones), the probe readout in volts, amperes and ohms, the zones, the pinch-off, the presets.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   Units: distances in wavelengths λ (the page's ruler, also with c infinite), time as the phase ωt in degrees,
   E in V/m, H in A/m, wave impedance in Ω. */
(function (root) {
  'use strict';

  var HD = typeof module === 'object' && module.exports
    ? require('./hertzian-dipole.js')
    : root.SimdeckModels['hertzian-dipole'];

  var TAU = 2 * Math.PI;
  var C0 = 299792458;                       // m/s
  var ETA0 = 376.730313668;                 // Ω, the wave impedance of free space, μ0·c (CODATA 2018)
  var FREQ = 10e6;                          // Hz: the dipole's frequency
  var LAMBDA = C0 / FREQ;                   // m, 29.98 m
  var PERIOD_NS = 1e9 / FREQ;               // ns, 100 ns
  var LEN = LAMBDA / 50;                    // m: a short dipole, l = λ/50 (0.60 m)
  var I0 = 1;                               // A: peak current at the feed (uniform along a Hertzian dipole)
  var K = TAU / LAMBDA;                     // rad/m
  var E_U = I0 * LEN * K * K * ETA0 / (4 * Math.PI);   // V/m: the model's E unit, p0·k³/(4π·ε0) with I0·l = ω·p0
  var H_U = I0 * LEN * K * K / (4 * Math.PI);          // A/m: the model's H unit, p0·ω·k²/(4π) = E_U/η0
  var NEAR = 1 / TAU;                       // λ: the reactive near field ends at λ/2π (kr = 1)
  var FAR = 1;                              // λ: the far field from about λ (kr = 2π) on this page
  var PINCH = Math.SQRT2 / TAU;             // λ: a new X point (pinch-off) is born at kr = √2
  var PINCH_DEG = (Math.SQRT2 - Math.atan(1 / Math.SQRT2)) * 180 / Math.PI;   // 45.76°: when, after p's maximum
  var T_STEP = 5;                           // degrees: the time slider's step
  var KEY_STEP = 15;                        // degrees: → / ← move time by this much
  var R_MIN = 0.04, R_MAX = 1.5, R_STEP = 0.01; // λ: the probe's range
  var LEVEL_STEP = 0.25, LEVEL_COUNT = 24;  // contour levels ±0.125, ±0.375, … (hertzian-dipole.levels)

  /** Params: t = phase ωt in degrees (0 … 355); c = 'finite' | 'inf'; r = the probe's distance from the dipole on the
      broadside line, in λ; zones = mark the near and far zones. */
  var defaults = { t: 0, c: 'finite', r: 0.5, zones: true };

  function num(x, lo, hi, d) { x = Number(x); return isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d; }

  /** Params made safe: anything but 'inf' is finite c; t wraps into [0, 360) (360 is 0, −5 is 355: tie-break,
      SPEC.md §1); r is clamped to R_MIN … R_MAX; zones is a boolean (false, 'false', '0' and 0 are off). */
  function norm(p) {
    p = p || {};
    var t = Number(p.t);
    t = isFinite(t) ? ((t % 360) + 360) % 360 : defaults.t;
    if (t >= 360) t = 0;
    var z = p.zones;
    return {
      t: t,
      c: p.c === 'inf' ? 'inf' : 'finite',
      r: num(p.r, R_MIN, R_MAX, defaults.r),
      zones: z === undefined ? defaults.zones : !(z === false || z === 'false' || z === '0' || z === 0)
    };
  }

  /** Which zone a distance r (in λ) is in. Boundaries belong to the outer zone (tie-break, SPEC.md §5):
      'near' below λ/2π, 'mid' from λ/2π to below λ, 'far' from λ. With c infinite everything is 'near'. */
  function zoneOf(r, inf) {
    if (inf) return 'near';
    if (r < NEAR) return 'near';
    return r < FAR ? 'mid' : 'far';
  }

  /** The dipole's own state at phase t (degrees): the charge on its ends and the current, each as a fraction of
      its peak. q = cos ωt (the top end's charge), i = dq/d(ωt) = −sin ωt (positive: current flowing up). */
  function dipoleAt(t) {
    var ph = t * Math.PI / 180;
    var q = Math.cos(ph), i = -Math.sin(ph);
    if (Math.abs(q) < 1e-12) q = 0;
    if (Math.abs(i) < 1e-12) i = 0;
    return { q: q, i: i };
  }

  /** The probe at r (λ) on the broadside line at phase t: amplitudes, instantaneous values, wave impedance, H's lead
      over E, the mean outward flow S and the power P through a sphere of radius r (S·4πr²·⅔: sin²θ averages ⅔). */
  function probeAt(r, t, inf) {
    var x = TAU * r, pr = HD.probe(x, inf), f = HD.fieldsAt(x, Math.PI / 2, t * Math.PI / 180, inf);
    var rm = r * LAMBDA, S = pr.S * E_U * H_U;
    return {
      r: r, kr: x, metres: rm,
      E: pr.E * E_U, H: pr.H * H_U,              // amplitudes, V/m and A/m
      e: f.Et * E_U, h: f.Hp * H_U,              // now: E_θ (positive points down there) and H_φ (positive into the page)
      Z: pr.Z * ETA0, lead: pr.lead,             // Ω and degrees
      S: S, P: S * 4 * Math.PI * rm * rm * 2 / 3 // W/m² and W
    };
  }

  /** |E| and |H| (times η0, so both in V/m) over r = from … to λ, log-spaced, for the page's distance plot. */
  function profile(inf, from, to, n) {
    from = from || R_MIN; to = to || R_MAX; n = n || 120;
    var out = [];
    for (var i = 0; i <= n; i++) {
      var r = from * Math.pow(to / from, i / n), pr = HD.probe(TAU * r, inf);
      out.push({ r: r, E: pr.E * E_U, etaH: pr.H * H_U * ETA0 });
    }
    return out;
  }

  /** E and H at the probe over one period, each over its own amplitude (−1 … 1), every 5°, for the page's time plot. */
  function period(r, inf) {
    var x = TAU * r, pr = HD.probe(x, inf), out = [];
    for (var d = 0; d <= 360; d += T_STEP) {
      var f = HD.fieldsAt(x, Math.PI / 2, d * Math.PI / 180, inf);
      out.push({ t: d, e: f.Et / pr.E, h: f.Hp / pr.H });
    }
    return out;
  }

  /** The X points on the broadside line at phase t, in λ, ascending: where a loop is pinching off (none with c
      infinite). Searched out to 2.5 λ. */
  function pinchAt(t, inf) {
    return HD.saddles(t * Math.PI / 180, inf, 0.02 * TAU, 2.5 * TAU).map(function (x) { return x / TAU; });
  }

  /** The contour levels the page draws. */
  function levelList() { return HD.levels(LEVEL_STEP, LEVEL_COUNT); }

  /** Field lines in a box (wavelengths) at phase t: one entry per level, { level, lines: [[[X, Z], …], …] }.
      spec: { x0, z0, d, nx, nz, rClip } as hertzian-dipole.grid takes it. */
  function fieldLines(p, spec) {
    p = norm(p);
    var g = HD.grid(spec, p.t * Math.PI / 180, p.c === 'inf');
    return levelList().map(function (L) { return { level: L, lines: HD.contour(g, L) }; });
  }

  /** Where the drawn lines cross the broadside line, with the direction of E there (for the page's arrows). */
  function crossings(p, r0, r1) {
    p = norm(p);
    return HD.broadsideCrossings(levelList(), p.t * Math.PI / 180, p.c === 'inf', r0, r1);
  }

  /** State for the page: everything the caption and the readout need (JSON-safe). */
  function initial(params) {
    var p = norm(Object.assign({}, defaults, params));
    var inf = p.c === 'inf';
    var pinch = pinchAt(p.t, inf);
    return {
      t: p.t, ns: p.t / 360 * PERIOD_NS, inf: inf, zones: p.zones,
      dipole: dipoleAt(p.t),
      probe: probeAt(p.r, p.t, inf),
      zone: zoneOf(p.r, inf),
      pinch: pinch,
      lambda: LAMBDA, near: NEAR, far: FAR, pinchR: PINCH
    };
  }

  /** Presets (the page gives them names): each with what the lecturer should see (SPEC.md §6). */
  var presets = [
    { id: 'near', params: { t: 0, c: 'finite', r: 0.08, zones: true } },
    { id: 'pinch', params: { t: 60, c: 'finite', r: 0.25, zones: true } },
    { id: 'edge', params: { t: 90, c: 'finite', r: 0.16, zones: true } },
    { id: 'far', params: { t: 0, c: 'finite', r: 1.5, zones: true } },
    { id: 'inf', params: { t: 60, c: 'inf', r: 1.5, zones: true } }
  ];

  var logic = {
    C0: C0, ETA0: ETA0, FREQ: FREQ, LAMBDA: LAMBDA, PERIOD_NS: PERIOD_NS, LEN: LEN, I0: I0, E_U: E_U, H_U: H_U,
    NEAR: NEAR, FAR: FAR, PINCH: PINCH, PINCH_DEG: PINCH_DEG, T_STEP: T_STEP, KEY_STEP: KEY_STEP,
    R_MIN: R_MIN, R_MAX: R_MAX, R_STEP: R_STEP, LEVEL_STEP: LEVEL_STEP, LEVEL_COUNT: LEVEL_COUNT,
    defaults: defaults, presets: presets, initial: initial, norm: norm, zoneOf: zoneOf, dipoleAt: dipoleAt,
    probeAt: probeAt, profile: profile, period: period, pinchAt: pinchAt, levelList: levelList,
    fieldLines: fieldLines, crossings: crossings, HD: HD
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
