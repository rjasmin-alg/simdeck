/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for AM modulation with a diode: a low-frequency signal (NF) and a carrier (VF) are added through two
   resistors and fed to a diode; its curved characteristic makes the carrier's amplitude follow the NF. A high-pass
   and a tank circuit tuned to the carrier keep the carrier and its two sidebands, fc − fm and fc + fm.
   An explorer: no steps; the page draws initial(params).
   Adopted from 50ohm-contents-hr/contents/html/applet_am_modulator.html (a circuit for an in-browser circuit
   simulator: the sources, the 1N4004 diode, the C-L high-pass, the tank and the two scopes, all values as there),
   CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; changed for simdeck (NOTES.md says what and why).
   The circuit is solved here: trapezoidal integration of the linear part (as the original simulator does) and the
   diode's Shockley equation solved exactly at every time step.
   Units: V, A, Ω, F, H, s, Hz. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // ── the circuit, values from the original ──
  var C = {
    fc: 10000,          // carrier (VF) frequency, Hz
    uc: 2,              // carrier amplitude, V
    r1: 1000,           // NF source resistor, Ω
    r2: 1000,           // carrier source resistor, Ω
    is: 1.88e-8,        // diode saturation current, A (1N4004 model of the original simulator)
    n: 2,               // diode emission coefficient
    vt: 0.025865,       // thermal voltage, V (the original simulator's value)
    c1: 47e-9,          // high-pass series capacitor, F
    l1: 0.33,           // high-pass shunt inductor, H
    c2: 12e-9,          // tank capacitor, F
    l2: 0.022,          // tank inductor, H
    r3: 6800            // load resistor across the tank, Ω
  };

  var DT = 1e-6;          // integration step, s
  var SETTLE = 0.02;      // run-in before anything is recorded, s
  var RECORD = 0.02;      // recorded span for the spectrum, s: a whole number of periods of every 50 Hz multiple
  var EVERY = 5;          // record every 5th step: 5 µs, 4000 samples, spectrum up to 100 kHz
  var SHOW = 0.004;       // time view, s
  var FMAX = 40000;       // spectrum view, Hz
  var BIN = 1 / RECORD;   // spectrum resolution, Hz (50)
  var FM_MIN = 250, FM_MAX = 2500, FM_STEP = 50;
  var AM_MAX = 1.5;       // NF amplitude, V (slider in tenths)

  /** Resonance of the tank: f0 = 1 / (2π √(L C)). */
  function tankF0() { return 1 / (2 * Math.PI * Math.sqrt(C.l2 * C.c2)); }

  /** Quality factor of the tank with the load across it: Q = R √(C / L). Its −3 dB band is f0 ± f0 / (2Q), the usual
      narrow-band approximation (Q ≈ 5 here). */
  function tankQ() { return C.r3 * Math.sqrt(C.c2 / C.l2); }

  // Solve a small dense system M x = b (Gaussian elimination with partial pivoting). M is not changed.
  function solve(M, b) {
    var n = b.length, a = M.map(function (r, i) { return r.concat([b[i]]); });
    for (var c = 0; c < n; c++) {
      var p = c;
      for (var r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
      var tmp = a[c]; a[c] = a[p]; a[p] = tmp;
      for (var r2 = c + 1; r2 < n; r2++) {
        var f = a[r2][c] / a[c][c];
        for (var k = c; k <= n; k++) a[r2][k] -= f * a[c][k];
      }
    }
    var x = new Array(n);
    for (var i = n - 1; i >= 0; i--) {
      var s = a[i][n];
      for (var j = i + 1; j < n; j++) s -= a[i][j] * x[j];
      x[i] = s / a[i][i];
    }
    return x;
  }

  /** Diode current I for a diode in series with a resistance rx behind an open-circuit voltage v:
      I = Is (exp((v − I rx) / (n Vt)) − 1). The left side minus the right rises strictly with I, so the root is
      unique; Newton steps, kept inside a shrinking bracket (bisection when a step leaves it). */
  function diodeCurrent(v, rx) {
    var nvt = C.n * C.vt;
    var lo = -C.is, hi = Math.max(0, v / rx);
    var g = function (i) { return i - C.is * (Math.exp((v - i * rx) / nvt) - 1); };
    var i = Math.min(hi, Math.max(lo, 0));
    for (var k = 0; k < 100; k++) {
      var gi = g(i);
      if (gi > 0) hi = i; else lo = i;
      var e = C.is * Math.exp((v - i * rx) / nvt);
      var next = i - gi / (1 + e * rx / nvt);
      if (!(next > lo && next < hi)) next = (lo + hi) / 2;
      if (Math.abs(next - i) <= 1e-15 + 1e-12 * Math.abs(i)) return next;
      i = next;
    }
    return i;
  }

  /** Simulate the circuit. Nodes: A (the two resistors meet), B (diode cathode), C (output, across the tank).
      With tank false the tank's L and C are left out and only the load resistor stays (the original's "remove
      the tank"). Returns { t, out, nf, vd, id } sampled every 5 µs over [SETTLE, SETTLE + RECORD).
      opts (tests only): { dt, settle } replace DT and SETTLE; dt must divide 5 µs. */
  function simulate(fm, am, tank, opts) {
    var dt = (opts && opts.dt) || DT, settle = (opts && opts.settle) || SETTLE;
    var every = Math.round(EVERY * DT / dt);
    var gc1 = 2 * C.c1 / dt, gl1 = dt / (2 * C.l1);
    var gc2 = tank ? 2 * C.c2 / dt : 0, gl2 = tank ? dt / (2 * C.l2) : 0;
    var M = [
      [1 / C.r1 + 1 / C.r2, 0, 0],
      [0, gc1 + gl1, -gc1],
      [0, -gc1, gc1 + gc2 + gl2 + 1 / C.r3]
    ];
    // the network seen by the diode: z = M⁻¹ e for a unit current out of A into B
    var z = solve(M, [-1, 1, 0]), rx = z[1] - z[0];
    var vb = 0, vc = 0;
    var i1 = 0, i2 = 0, iL1 = 0, iL2 = 0;   // C1 (B→C), C2 (C→gnd), L1 (B→gnd), L2 (C→gnd)
    var total = Math.round((settle + RECORD) / dt), start = Math.round(settle / dt);
    var out = { t: [], out: [], nf: [], vd: [], id: [] };
    var w1 = 2 * Math.PI * fm, w2 = 2 * Math.PI * C.fc;
    for (var k = 1; k <= total; k++) {
      var t = k * dt;
      var v1 = am * Math.sin(w1 * t), v2 = C.uc * Math.sin(w2 * t);
      // history sources of the trapezoidal companions
      var h1 = gc1 * (vb - vc) + i1, h2 = gc2 * vc + i2, hl1 = iL1 + gl1 * vb, hl2 = iL2 + gl2 * vc;
      var rhs = [v1 / C.r1 + v2 / C.r2, h1 - hl1, -h1 + h2 - hl2];
      var x0 = solve(M, rhs);
      var id = diodeCurrent(x0[0] - x0[1], rx);
      var x = [x0[0] + id * z[0], x0[1] + id * z[1], x0[2] + id * z[2]];
      i1 = gc1 * (x[1] - x[2]) - h1;
      i2 = gc2 * x[2] - h2;
      iL1 = gl1 * x[1] + hl1;
      iL2 = gl2 * x[2] + hl2;
      vb = x[1]; vc = x[2];
      if (k > start && (k - start) % every === 0) {
        out.t.push(t - settle); out.out.push(vc); out.nf.push(v1); out.vd.push(x[0] - x[1]); out.id.push(id);
      }
    }
    return out;
  }

  /** Amplitude spectrum (peak volts) of samples spanning a whole number of periods: bins 0, BIN, 2·BIN … up to fmax. */
  function spectrum(xs, fmax) {
    var N = xs.length, K = Math.round(fmax / BIN), cos = new Array(N), sin = new Array(N), out = [];
    for (var n = 0; n < N; n++) { cos[n] = Math.cos(2 * Math.PI * n / N); sin[n] = Math.sin(2 * Math.PI * n / N); }
    for (var k = 0; k <= K; k++) {
      var re = 0, im = 0;
      for (var m = 0, j = 0; m < N; m++, j = (j + k) % N) { re += xs[m] * cos[j]; im -= xs[m] * sin[j]; }
      out.push((k === 0 ? 1 : 2) * Math.sqrt(re * re + im * im) / N);
    }
    return out;
  }

  function clamp(x, lo, hi, step) {
    var v = Number(x);
    if (!isFinite(v)) v = lo;
    v = Math.round(v / step) * step;
    return Math.min(hi, Math.max(lo, v));
  }

  var defaults = { fm: 500, am: 5, tank: true };   // am in tenths of a volt (0.5 V, as the original)

  /** Presets (keys 1–5, in this order). The page adds the labels. */
  var presets = [
    { id: 'original', params: { fm: 500, am: 5, tank: true } },
    { id: 'fm1k', params: { fm: 1000, am: 5, tank: true } },
    { id: 'noTank', params: { fm: 500, am: 5, tank: false } },
    { id: 'noNf', params: { fm: 500, am: 0, tank: true } },
    { id: 'strong', params: { fm: 500, am: 15, tank: true } }
  ];

  /** The state the page draws. */
  function initial(p) {
    var fm = clamp(p.fm, FM_MIN, FM_MAX, FM_STEP);
    var amt = clamp(p.am, 0, AM_MAX * 10, 1), am = amt / 10;
    var tank = p.tank !== false && p.tank !== 'false' && p.tank !== 0;
    var sim = simulate(fm, am, tank);
    var spec = spectrum(sim.out, FMAX);
    var at = function (f) { return spec[Math.round(f / BIN)]; };
    // the time view: the first SHOW seconds of the recording
    var nShow = Math.round(SHOW / (DT * EVERY)) + 1;
    var view = sim.out.slice(0, nShow);
    // envelope over the whole recording: the carrier's peaks at its highest and lowest
    var hi = Math.max.apply(null, sim.out), lo = Math.min.apply(null, sim.out);
    var peaks = carrierPeaks(sim.out);
    return {
      fm: fm, am: am, amt: amt, tank: tank,
      fc: C.fc, f0: tankF0(), q: tankQ(),
      bandLo: tankF0() * (1 - 1 / (2 * tankQ())), bandHi: tankF0() * (1 + 1 / (2 * tankQ())),
      lsb: C.fc - fm, usb: C.fc + fm,
      aCarrier: at(C.fc), aLsb: at(C.fc - fm), aUsb: at(C.fc + fm), aNf: at(fm),
      depth: peaks.max + peaks.min > 0 ? (peaks.max - peaks.min) / (peaks.max + peaks.min) : 0,
      envMax: peaks.max, envMin: peaks.min,
      vMax: hi, vMin: lo,
      dtView: DT * EVERY,
      time: view.map(round4),
      nf: sim.nf.slice(0, nShow).map(round4),
      bin: BIN,
      spectrum: spec.map(round4)
    };
  }

  /** The largest and the smallest positive peak of the output (local maxima above zero): the top of the envelope
      and its bottom. Tie-break: a flat top (equal samples) is one peak, and only when the run of equal samples
      falls afterwards; a plateau on the way up is not a peak. */
  function carrierPeaks(xs) {
    var max = 0, min = Infinity;
    for (var i = 1; i < xs.length - 1; i++) {
      if (!(xs[i] > 0 && xs[i] > xs[i - 1])) continue;
      var j = i;
      while (j < xs.length - 1 && xs[j + 1] === xs[i]) j++;
      if (j < xs.length - 1 && xs[j + 1] < xs[i]) {
        if (xs[i] > max) max = xs[i];
        if (xs[i] < min) min = xs[i];
      }
      i = j;
    }
    return { max: max, min: min === Infinity ? 0 : min };
  }

  function round4(x) { return Math.round(x * 1e4) / 1e4 || 0; }   // || 0: no −0 (JSON writes it as 0)

  var logic = {
    CIRCUIT: C, DT: DT, SETTLE: SETTLE, RECORD: RECORD, SHOW: SHOW, FMAX: FMAX, BIN: BIN,
    FM_MIN: FM_MIN, FM_MAX: FM_MAX, FM_STEP: FM_STEP, AM_MAX: AM_MAX,
    defaults: defaults,
    presets: presets,
    initial: initial,
    tankF0: tankF0,
    tankQ: tankQ,
    diodeCurrent: diodeCurrent,
    simulate: simulate,
    spectrum: spectrum,
    carrierPeaks: carrierPeaks,
    solve: solve
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
