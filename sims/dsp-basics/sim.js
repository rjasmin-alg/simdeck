/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for a balanced modulator: a ring of four diodes, switched by a square-wave oscillator, passes the AF signal to
   the output with alternating polarity, so the output holds the two sidebands but not the carrier (a DSB signal).
   The oscillator feeds the ring through a potentiometer (carrier balance); off centre, the two halves no longer cancel
   and the carrier shows up in the spectrum.
   An explorer: no steps; the page draws initial(params).
   Adopted from 50ohm-contents-hr/contents/html/applet_dsp.html (a circuit for an in-browser circuit simulator: the
   AF source with its coupling capacitor, the diode ring, the 1 kΩ balance potentiometer, the 10 kHz square-wave
   oscillator, the transformer, the load and the two scopes, all values as there), CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; changed for simdeck (NOTES.md says what and why).
   The circuit is solved here: trapezoidal integration of the capacitor and the transformer (as the original
   simulator does) and Newton iterations for the four diodes at every time step.
   Units: V, A, Ω, F, H, s, Hz. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  // ── the circuit, values from the original ──
  var C = {
    fc: 10000,          // oscillator (carrier) frequency, Hz; a square wave
    uc: 5,              // oscillator amplitude, V
    cc: 10e-6,          // AF coupling capacitor, F
    rp: 1000,           // balance potentiometer, end to end, Ω
    lp: 0.01,           // transformer primary inductance, H
    ratio: 1,           // turns ratio (secondary / primary)
    k: 0.999,           // coupling coefficient
    rl: 1000,           // load across the secondary, Ω
    is: 1e-14,          // diode saturation current, A (the original simulator's default diode)
    n: 1,               // diode emission coefficient
    vt: 0.025865        // thermal voltage, V (the original simulator's value)
  };

  var DT = 1e-6;          // integration step, s (the original's time step)
  var SETTLE = 0.03;      // run-in before anything is recorded, s
  var RECORD = 0.01;      // recorded span, s: whole periods of every 100 Hz multiple
  var EVERY = 2;          // record every 2nd step: 2 µs, 5000 samples, spectrum up to 250 kHz
  var SHOW = 0.002;       // time view, s
  var FMAX = 40000;       // spectrum view, Hz
  var BIN = 1 / RECORD;   // spectrum resolution, Hz (100)
  var FM_MIN = 500, FM_MAX = 3000, FM_STEP = 100;
  var AM_MAX = 1;         // AF amplitude, V (slider in tenths)
  var BAL_MIN = 5, BAL_MAX = 95;   // potentiometer position, %
  var FLOOR = 1e-3;       // a line below 1 mV counts as gone (suppression shown as "more than")
  var GMIN = 1e-12;       // conductance across each diode, as circuit simulators add for convergence

  /** Square wave of ±1 at frequency f: +1 in the first half of each period. Tie-break: exactly at an edge the new
      half already holds (+1 at t = 0, −1 at t = 1/(2f)). Counted in half periods with a tolerance, so that sampling
      at whole microseconds lands on the edges exactly instead of on either side by rounding. */
  function square(f, t) {
    var h = Math.floor(2 * f * t + 1e-9);
    return ((h % 2) + 2) % 2 === 0 ? 1 : -1;
  }

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

  /** Diode current and its slope at voltage v (anode − cathode): Shockley, I = Is (exp(v / nVt) − 1). */
  function diode(v) {
    var nvt = C.n * C.vt, e = C.is * Math.exp(v / nvt);
    return { i: e - C.is, g: e / nvt };
  }

  /** Limit a Newton step on a junction voltage (the usual circuit-simulator rule): above the critical voltage a
      step up moves along the logarithm, so the exponential cannot overflow. */
  function limitStep(vnew, vold) {
    var nvt = C.n * C.vt, vcrit = nvt * Math.log(nvt / (Math.SQRT2 * C.is));
    if (vnew > vcrit && Math.abs(vnew - vold) > 2 * nvt) {
      if (vold > 0) {
        var arg = 1 + (vnew - vold) / nvt;
        return arg > 0 ? vold + nvt * Math.log(arg) : vcrit;
      }
      return nvt * Math.log(vnew / nvt);
    }
    return vnew;
  }

  // The ring: diodes from node to node. 0 = ground (the ring's right corner), 1 = L (left corner, behind the
  // coupling capacitor), 2 = T (top corner, primary top), 3 = B (bottom corner, primary bottom).
  var RING = [[1, 2], [2, 0], [0, 3], [3, 1]];   // D1 L→T, D2 T→right, D3 right→B, D4 B→L (anode, cathode)

  /** Simulate the circuit. Unknown node voltages x = [L, T, B, O] (O: the output, across the secondary). The AF
      source drives L through the capacitor, the oscillator drives the pot's wiper, whose two parts go to T
      (bal · Rp) and B ((1 − bal) · Rp); the primary sits between T and B. Returns { out, af, osc } sampled every
      2 µs over [SETTLE, SETTLE + RECORD), plus the Newton iteration count of the worst step.
      opts (tests only): { dt, settle } replace DT and SETTLE; dt must divide 2 µs. */
  function simulate(fm, am, bal, opts) {
    var dt = (opts && opts.dt) || DT, settle = (opts && opts.settle) || SETTLE;
    var every = Math.round(EVERY * DT / dt);
    var r1 = bal * C.rp, r2 = (1 - bal) * C.rp;
    var gc = 2 * C.cc / dt;
    // the transformer: [i1, i2] = G [v1, v2] + history, G = (dt / 2) L⁻¹ (trapezoidal companion of coupled coils)
    var l1 = C.lp, l2 = C.lp * C.ratio * C.ratio, m = C.k * Math.sqrt(l1 * l2), det = l1 * l2 - m * m;
    var g11 = dt / 2 * l2 / det, g22 = dt / 2 * l1 / det, g12 = -dt / 2 * m / det;
    var x = [0, 0, 0, 0], vd = [0, 0, 0, 0];
    var ic = 0, vcPrev = 0;                 // capacitor current (N → L) and voltage (N − L) of the last step
    var i1 = 0, i2 = 0, v1Prev = 0, v2Prev = 0;   // primary current T → B, secondary current O → ground
    var total = Math.round((settle + RECORD) / dt), start = Math.round(settle / dt);
    var out = { out: [], af: [], osc: [], iterations: 0 };
    var w1 = 2 * Math.PI * fm;
    var V = function (xs, node) { return node === 0 ? 0 : xs[node - 1]; };
    for (var k = 1; k <= total; k++) {
      var t = k * dt;
      // both sources as the original wires them: their first terminal is the minus one, so the node gets −v
      var vn = -am * Math.sin(w1 * t), vw = -C.uc * square(C.fc, t);
      var hc = gc * vcPrev + ic;                          // i_c = gc · v_c − hc
      var h1 = i1 + g11 * v1Prev + g12 * v2Prev;           // i_1 = g11 v1 + g12 v2 + h1
      var h2 = i2 + g12 * v1Prev + g22 * v2Prev;
      for (var it = 0; it < 100; it++) {
        var M = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], b = [0, 0, 0, 0];
        // capacitor N–L: current into L is gc (vn − L) − hc
        M[0][0] += gc; b[0] += gc * vn - hc;
        // potentiometer: W–T and W–B
        M[1][1] += 1 / r1; b[1] += vw / r1;
        M[2][2] += 1 / r2; b[2] += vw / r2;
        // primary, current i1 = g11 (T − B) + g12 O + h1 leaves T and enters B
        M[1][1] += g11; M[1][2] -= g11; M[1][3] += g12; b[1] -= h1;
        M[2][1] -= g11; M[2][2] += g11; M[2][3] -= g12; b[2] += h1;
        // secondary, current i2 = g12 (T − B) + g22 O + h2 leaves O; load to ground
        M[3][1] += g12; M[3][2] -= g12; M[3][3] += g22 + 1 / C.rl; b[3] -= h2;
        // diodes, linearised at their (limited) voltages
        for (var d = 0; d < 4; d++) {
          var a = RING[d][0], c = RING[d][1];
          var dv = diode(vd[d]), g = dv.g + GMIN, ieq = dv.i - dv.g * vd[d];
          if (a) { M[a - 1][a - 1] += g; b[a - 1] -= ieq; if (c) M[a - 1][c - 1] -= g; }
          if (c) { M[c - 1][c - 1] += g; b[c - 1] += ieq; if (a) M[c - 1][a - 1] -= g; }
        }
        var xn = solve(M, b), moved = 0;
        for (var j = 0; j < 4; j++) moved = Math.max(moved, Math.abs(xn[j] - x[j]));
        x = xn;
        var limited = false;
        for (var d2 = 0; d2 < 4; d2++) {
          var want = V(x, RING[d2][0]) - V(x, RING[d2][1]), got = limitStep(want, vd[d2]);
          if (got !== want) limited = true;
          vd[d2] = got;
        }
        if (!limited && moved < 1e-9) break;
      }
      if (it + 1 > out.iterations) out.iterations = it + 1;
      // accept the step: update the companions' histories
      var vc = vn - x[0];
      ic = gc * vc - hc; vcPrev = vc;
      var v1 = x[1] - x[2], v2 = x[3];
      i1 = g11 * v1 + g12 * v2 + h1;
      i2 = g12 * v1 + g22 * v2 + h2;
      v1Prev = v1; v2Prev = v2;
      if (k > start && (k - start) % every === 0) { out.out.push(x[3]); out.af.push(vn); out.osc.push(vw); }
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

  /** Carrier suppression in dB: how far the residual carrier lies below the stronger sideband, 20 log10(side / carrier).
      Tie-breaks: with no sideband (no AF) there is nothing to compare, null; a carrier below FLOOR counts as FLOOR,
      and the result is then a lower bound (more: true). */
  function suppression(side, carrier) {
    if (!(side >= FLOOR)) return null;
    var more = !(carrier >= FLOOR);
    return { db: 20 * Math.log10(side / (more ? FLOOR : carrier)), more: more };
  }

  function clamp(x, lo, hi, step) {
    var v = Number(x);
    if (!isFinite(v)) v = lo;
    v = Math.round(v / step) * step;
    return Math.min(hi, Math.max(lo, v));
  }

  var defaults = { bal: 50, fm: 1000, am: 5 };   // bal in %, am in tenths of a volt (0.5 V, as the original)

  /** Presets (keys 1–5, in this order). The page adds the labels. */
  var presets = [
    { id: 'balanced', params: { bal: 50, fm: 1000, am: 5 } },
    { id: 'slightly', params: { bal: 48, fm: 1000, am: 5 } },
    { id: 'far', params: { bal: 30, fm: 1000, am: 5 } },
    { id: 'noAfBalanced', params: { bal: 50, fm: 1000, am: 0 } },
    { id: 'noAfOff', params: { bal: 30, fm: 1000, am: 0 } }
  ];

  /** The state the page draws. */
  function initial(p) {
    var bal = clamp(p.bal, BAL_MIN, BAL_MAX, 1);
    var fm = clamp(p.fm, FM_MIN, FM_MAX, FM_STEP);
    var amt = clamp(p.am, 0, AM_MAX * 10, 1), am = amt / 10;
    var sim = simulate(fm, am, bal / 100);
    var spec = spectrum(sim.out, FMAX);
    var at = function (f) { return spec[Math.round(f / BIN)]; };
    var nShow = Math.round(SHOW / (DT * EVERY)) + 1;
    var aLsb = at(C.fc - fm), aUsb = at(C.fc + fm), aCarrier = at(C.fc);
    return {
      bal: bal, fm: fm, am: am, amt: amt,
      r1: bal / 100 * C.rp, r2: (1 - bal / 100) * C.rp,
      fc: C.fc, lsb: C.fc - fm, usb: C.fc + fm,
      aCarrier: round4(aCarrier), aLsb: round4(aLsb), aUsb: round4(aUsb),
      supp: suppression(Math.max(aLsb, aUsb), aCarrier),
      vPeak: round4(Math.max.apply(null, sim.out.map(Math.abs))),
      dtView: DT * EVERY,
      time: sim.out.slice(0, nShow).map(round4),
      af: sim.af.slice(0, nShow).map(round4),
      bin: BIN,
      spectrum: spec.map(round4)
    };
  }

  function round4(x) { return Math.round(x * 1e4) / 1e4 || 0; }   // || 0: no −0 (JSON writes it as 0)

  var logic = {
    CIRCUIT: C, DT: DT, SETTLE: SETTLE, RECORD: RECORD, SHOW: SHOW, FMAX: FMAX, BIN: BIN, FLOOR: FLOOR,
    FM_MIN: FM_MIN, FM_MAX: FM_MAX, FM_STEP: FM_STEP, AM_MAX: AM_MAX, BAL_MIN: BAL_MIN, BAL_MAX: BAL_MAX,
    defaults: defaults,
    presets: presets,
    initial: initial,
    square: square,
    diode: diode,
    limitStep: limitStep,
    simulate: simulate,
    spectrum: spectrum,
    suppression: suppression,
    solve: solve
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
