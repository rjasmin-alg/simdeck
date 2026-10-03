/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the attenuator pad: a symmetric resistive Pi or T network that lowers a signal by a set number of dB while
   both its ports still look like 50 Ω. Ideal resistor values from the attenuation, the nearest values of a standard
   E series, and what those standard values really give (attenuation and input resistance). An explorer: no steps; the
   page draws initial(params).
   Adopted from 50ohm-contents-hr/contents/html/applet_daempfungsglied.html (the Pi and T formulas, the E12 … E96
   tables, the nearest value over three decades, the achieved attenuation from the chain (ABCD) matrix), CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; changed for simdeck (NOTES.md says what and why).
   Names as in the applet and the 50ohm figures 341/342: Pi has R1 = R3 across the line and R2 in series; T has
   R1 = R2 in series and R3 across.
   Units: attenuation as whole tenths of a dB in the params (exact), dB in the state; resistance in Ω.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var Z0 = 50;                        // system impedance, Ω (the applet's fixed value)
  var DT_MIN = 1, DT_MAX = 400;       // 0.1 … 40.0 dB in 0.1 dB steps (the applet allowed up to 100 dB)
  var TOPOLOGIES = ['pi', 't'];

  /** The standard series, one decade each, as in the applet (IEC 60063). */
  var SERIES = {
    E12: [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2],
    E24: [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1],
    E48: [1.00, 1.05, 1.10, 1.15, 1.21, 1.27, 1.33, 1.40, 1.47, 1.54, 1.62, 1.69, 1.78, 1.87, 1.96, 2.05, 2.15, 2.26, 2.37, 2.49, 2.61, 2.74, 2.87, 3.01, 3.16, 3.32, 3.48, 3.65, 3.83, 4.02, 4.22, 4.42, 4.64, 4.87, 5.11, 5.36, 5.62, 5.90, 6.19, 6.49, 6.81, 7.15, 7.50, 7.87, 8.25, 8.66, 9.09, 9.53],
    E96: [1.00, 1.02, 1.05, 1.07, 1.10, 1.13, 1.15, 1.18, 1.21, 1.24, 1.27, 1.30, 1.33, 1.37, 1.40, 1.43, 1.47, 1.50, 1.54, 1.58, 1.62, 1.65, 1.69, 1.74, 1.78, 1.82, 1.87, 1.91, 1.96, 2.00, 2.05, 2.10, 2.15, 2.21, 2.26, 2.32, 2.37, 2.43, 2.49, 2.55, 2.61, 2.67, 2.74, 2.80, 2.87, 2.94, 3.01, 3.09, 3.16, 3.24, 3.32, 3.40, 3.48, 3.57, 3.65, 3.74, 3.83, 3.92, 4.02, 4.12, 4.22, 4.32, 4.42, 4.53, 4.64, 4.75, 4.87, 4.99, 5.11, 5.23, 5.36, 5.49, 5.62, 5.76, 5.90, 6.04, 6.19, 6.34, 6.49, 6.65, 6.81, 6.98, 7.15, 7.32, 7.50, 7.68, 7.87, 8.06, 8.25, 8.45, 8.66, 8.87, 9.09, 9.31, 9.53, 9.76]
  };
  var SERIES_NAMES = Object.keys(SERIES);

  function clampInt(x, lo, hi) {
    var n = Math.round(Number(x));
    if (!isFinite(n)) n = lo;
    return Math.min(hi, Math.max(lo, n));
  }

  /** Ideal values for a symmetric pad of `db` dB in a z-ohm system. K = 10^(dB/20) is the voltage ratio.
      Pi: across = z (K + 1) / (K − 1), series = z (K² − 1) / (2K). T: series = z (K − 1) / (K + 1),
      across = 2zK / (K² − 1). Returns { series, across } in Ω. */
  function ideal(topology, db, z) {
    z = z || Z0;
    var K = Math.pow(10, db / 20);
    if (topology === 'pi') return { across: z * (K + 1) / (K - 1), series: z * (K * K - 1) / (2 * K) };
    return { series: z * (K - 1) / (K + 1), across: 2 * z * K / (K * K - 1) };
  }

  /** The nearest value of the series to `value`, by absolute difference, searched over the value's decade and the
      ones either side (as the applet). Candidates are rounded to 12 significant digits, so 2.2 · 100 is 220.
      Tie-break: when two candidates are equally near (110 Ω in E12: 100 and 120), the lower one wins, as the
      applet's strict "<" over an ascending list. "Equally near" allows for rounding (1.1 − 1.0 and 1.2 − 1.1 differ
      in the 17th digit): a candidate replaces the best only when it is nearer by more than 1e-9 of the value. */
  function nearest(value, seriesName) {
    var base = SERIES[seriesName] || SERIES.E24;
    // no standard value stands for 0, a negative or an infinite resistance (a 0 dB pad's open branch): keep it
    if (!(value > 0 && value < Infinity)) return value;
    var decade = Math.floor(Math.log10(value));
    var best = null;
    for (var e = decade - 1; e <= decade + 1; e++) {
      for (var i = 0; i < base.length; i++) {
        var c = Number((base[i] * Math.pow(10, e)).toPrecision(12));
        if (best === null || Math.abs(c - value) < Math.abs(best - value) - 1e-9 * value) best = c;
      }
    }
    return best;
  }

  /** The chain (ABCD) matrix of the pad: a series R is [[1, R], [0, 1]], an R across the line [[1, 0], [1/R, 1]]. */
  function chain(topology, r) {
    var S = function (x) { return [[1, x], [0, 1]]; };
    var P = function (x) { return [[1, 0], [1 / x, 1]]; };
    var mul = function (a, b) {
      return [[a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
              [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]]];
    };
    if (topology === 'pi') return mul(mul(P(r.across), S(r.series)), P(r.across));
    return mul(mul(S(r.series), P(r.across)), S(r.series));
  }

  /** Attenuation in dB of the pad between a z source and a z load, against a direct connection (the applet's
      −20 log |2 / (A + B/z + Cz + D)|). */
  function attenuationOf(topology, r, z) {
    z = z || Z0;
    var m = chain(topology, r);
    return -20 * Math.log10(Math.abs(2 / (m[0][0] + m[0][1] / z + m[1][0] * z + m[1][1])));
  }

  /** The resistance seen at the input with a z load on the output: (A z + B) / (C z + D). */
  function inputResistance(topology, r, z) {
    z = z || Z0;
    var m = chain(topology, r);
    return (m[0][0] * z + m[0][1]) / (m[1][0] * z + m[1][1]);
  }

  var defaults = { dt: 100, topo: 'pi', series: 'E24' };

  /** Presets (keys 1–6, in this order). The page adds the labels. No preset sits on 6 or 20 dB: those are the
      50ohm exam questions AD803, AD804 and AD806 (NOTES.md). */
  var presets = [
    { id: 'pi3', params: { dt: 30, topo: 'pi', series: 'E24' } },
    { id: 'pi10', params: { dt: 100, topo: 'pi', series: 'E24' } },
    { id: 'pi10e96', params: { dt: 100, topo: 'pi', series: 'E96' } },
    { id: 't10', params: { dt: 100, topo: 't', series: 'E24' } },
    { id: 'pi15e12', params: { dt: 150, topo: 'pi', series: 'E12' } },
    { id: 'pi30', params: { dt: 300, topo: 'pi', series: 'E24' } }
  ];

  /** The state the page draws. */
  function initial(p) {
    var dt = clampInt(p.dt, DT_MIN, DT_MAX), db = dt / 10;
    var topo = TOPOLOGIES.indexOf(p.topo) >= 0 ? p.topo : defaults.topo;
    var series = SERIES[p.series] ? p.series : defaults.series;
    var r = ideal(topo, db, Z0);
    var std = { series: nearest(r.series, series), across: nearest(r.across, series) };
    var powerOut = Math.pow(10, -db / 10);
    return {
      dt: dt,
      db: db,
      topo: topo,
      series: series,
      ideal: r,
      std: std,
      achieved: attenuationOf(topo, std, Z0),
      zinIdeal: inputResistance(topo, r, Z0),
      zinStd: inputResistance(topo, std, Z0),
      powerOut: powerOut,        // P_out / P_in with the ideal values, matched load
      heat: 1 - powerOut,        // the rest is turned into heat in the pad
      ratio: 1 / powerOut        // P_in : P_out
    };
  }

  var logic = {
    Z0: Z0, DT_MIN: DT_MIN, DT_MAX: DT_MAX, TOPOLOGIES: TOPOLOGIES, SERIES: SERIES, SERIES_NAMES: SERIES_NAMES,
    defaults: defaults,
    presets: presets,
    initial: initial,
    ideal: ideal,
    nearest: nearest,
    chain: chain,
    attenuationOf: attenuationOf,
    inputResistance: inputResistance
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
