/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for small-antenna: a short dipole, a loading coil, losses, Q and the SWR bandwidth (SPEC.md).
   The physics is loaded-antenna.js (pure, promotable: catalogue §5.26, model 3), which takes the self impedance from
   mutual-impedance.js (copied unchanged from sims/yagi @ 917467e). This file adds the page's situation: a 2 mm copper
   dipole at 7.1 MHz, 0.05 … 0.48 λ, centre loading, an ideal transformer to 50 Ω, 100 W offered; the params (length,
   coil on, coil Q, time), the readout, the SWR curve across the 40 m band, the trade-off lines and the presets.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var LA = typeof module === 'object' && module.exports
    ? require('./loaded-antenna.js')
    : root.SimdeckModels['loaded-antenna'];

  var D2R = Math.PI / 180;
  var F0 = 7.1e6;                     // Hz: the 40 m band, as dipole-length
  var LAMBDA = LA.C0 / F0;            // m, 42.22 m
  var RADIUS_M = 1e-3;                // m: copper wire 2 mm thick
  var BAND = [7.0e6, 7.2e6];          // Hz: the 40 m band (region 1), drawn across the SWR plot
  var P_TX = 100;                     // W offered at f0
  var SWR_LIMIT = 2;                  // the bandwidth is where SWR ≤ 2
  var LEN_MIN = 0.05, LEN_MAX = 0.48, LEN_STEP = 0.01;
  var QCS = [50, 100, 200, 400, 'ideal'];
  var T_STEP = 5, KEY_STEP = 15;      // degrees: the time slider's step, → / ← in time
  var REF_LENS = [0.05, 0.1, 0.25, 0.48]; // the trade-off chart's reference lines

  /** Params: len = length in λ at f0; coil = loading coil on; qc = coil Q (or 'ideal'); t = phase ωt (degrees). */
  var defaults = { len: 0.1, coil: true, qc: 200, t: 0 };

  function given(v) { return v !== null && v !== undefined && v !== '' && isFinite(Number(v)); }

  /** Params made safe (SPEC.md §2, tie-breaks 1–3). */
  function norm(p) {
    p = p || {};
    var len = given(p.len) ? Math.min(LEN_MAX, Math.max(LEN_MIN, Number(p.len))) : defaults.len;
    len = Number((Math.round(len / LEN_STEP) * LEN_STEP).toFixed(2));
    var coil = p.coil === undefined ? defaults.coil : (p.coil === true || p.coil === 'true' || p.coil === '1' || p.coil === 1);
    var qc = QCS.filter(function (q) { return String(q) === String(p.qc); })[0];
    if (qc === undefined) qc = defaults.qc;
    var t = given(p.t) ? Number(p.t) : defaults.t;
    t = ((Math.round(t / T_STEP) * T_STEP) % 360 + 360) % 360;
    return { len: len, coil: coil, qc: qc, t: t + 0 };
  }

  /** The tuned antenna for these params (loaded-antenna.js system). */
  function sysOf(len, coil, qc) {
    return LA.system({ len: len, radiusM: RADIUS_M, f0: F0, coil: coil, qc: qc === 'ideal' ? 0 : qc });
  }

  /** Everything at these params except time: impedances, losses, η, Q, bandwidth, power split (SPEC.md §4). */
  function analyse(len, coil, qc) {
    var sys = sysOf(len, coil, qc);
    var eta = sys.rRad / sys.rIn;
    var m = LA.swr(sys.z(F0), sys.rIn);
    var tuned = coil;
    var q = tuned ? LA.qOf(sys) : null;
    var edges = tuned ? LA.bandEdges(sys, SWR_LIMIT) : { lo: null, hi: null, bw: null };
    var ka = Math.PI * len;
    var pIn = P_TX * (1 - m.gamma2);
    return {
      rRad: sys.rRad, xAnt: sys.xAnt, rWire: sys.rWire, xCoil: sys.xCoil, rCoil: sys.rCoil, rIn: sys.rIn,
      lCoil: sys.lCoil * 1e6,                        // µH
      eta: eta,
      swr0: m.swr, gamma2: m.gamma2,
      q: q, qRad: q === null ? null : q / eta, qChu: LA.chuQ(ka),
      bw: edges.bw, fLo: edges.lo, fHi: edges.hi,
      // η × bandwidth: fixed by the length, whatever the coil (rule 8); Chu's line for this size
      k: edges.bw === null ? null : eta * edges.bw,
      kChu: (SWR_LIMIT - 1) / Math.sqrt(SWR_LIMIT) * F0 / LA.chuQ(ka),
      pIn: pIn, pRad: pIn * eta, pCoil: pIn * sys.rCoil / sys.rIn, pWire: pIn * sys.rWire / sys.rIn, pRef: P_TX - pIn,
      perRad: q === null ? null : 2 * Math.PI * eta / q, perHeat: q === null ? null : 2 * Math.PI * (1 - eta) / q,
      // the coil's share of the magnetic energy: X_L/(Q·R_in) (W_m = Q·R_in·|I|²/(4ω), the coil's X_L·|I|²/(4ω))
      coilShare: q === null ? null : Math.min(1, sys.xCoil / (q * sys.rIn)),
      // without the coil: the lowest SWR anywhere in the band (the caption says whether any of it is under 2)
      bandMinSwr: tuned ? null : minSwr(sys)
    };
  }

  /** The lowest SWR on the 401 evenly spaced points across the band (null counts as ∞). */
  function minSwr(sys) {
    var m = Infinity;
    for (var i = 0; i < 401; i++) {
      var w = LA.swr(sys.z(BAND[0] + (BAND[1] - BAND[0]) * i / 400), sys.rIn).swr;
      if (w !== null && w < m) m = w;
    }
    return m === Infinity ? null : m;
  }

  /** The share of the 40 m band where the SWR stays ≤ 2 (0 … 1). */
  function bandShare(a) {
    if (a.bw === null) return 0;
    var lo = Math.max(BAND[0], a.fLo), hi = Math.min(BAND[1], a.fHi);
    return hi > lo ? (hi - lo) / (BAND[1] - BAND[0]) : 0;
  }

  /** State for the page (JSON-safe). */
  function initial(params) {
    var p = norm(Object.assign({}, defaults, params));
    var a = analyse(p.len, p.coil, p.qc);
    a.len = p.len; a.coil = p.coil; a.qc = p.qc; a.t = p.t;
    a.metres = p.len * LAMBDA;
    a.lossless = p.coil && p.qc === 'ideal';
    a.nearRes = Math.abs(a.xAnt) < a.rRad;          // almost resonant: |X| below R_rad (0.47 and 0.48 λ)
    a.wholeBand = a.bw !== null && a.fLo <= BAND[0] && a.fHi >= BAND[1];
    a.share = bandShare(a);
    a.cosT = snap(Math.cos(p.t * D2R));
    a.sinT = snap(Math.sin(p.t * D2R));
    a.wMag = a.cosT * a.cosT;                      // stored energy in the coil, of the total (rule 12)
    a.wEl = 1 - a.wMag;                            // around the wire
    return a;
  }

  function snap(x) { return Math.abs(x) < 1e-12 ? 0 : x; }

  /** The SWR across the 40 m band for drawing: n evenly spaced points plus 121 on f0 ± 3·BW, sorted (rule 14). */
  function swrCurve(p, n) {
    p = norm(p);
    n = n || 401;
    var sys = sysOf(p.len, p.coil, p.qc), fs = [];
    for (var i = 0; i < n; i++) fs.push(BAND[0] + (BAND[1] - BAND[0]) * i / (n - 1));
    if (p.coil) {
      var e = LA.bandEdges(sys, SWR_LIMIT);
      if (e.bw !== null) for (var j = 0; j <= 120; j++) fs.push(F0 + 3 * e.bw * (j / 60 - 1));
    }
    fs = fs.filter(function (f) { return f >= BAND[0] && f <= BAND[1]; }).sort(function (a, b) { return a - b; });
    return fs.map(function (f) { return { f: f, swr: LA.swr(sys.z(f), sys.rIn).swr }; });
  }

  /** The trade-off chart's points: for one length, (bandwidth, η) for every coil choice (SPEC.md §5). */
  function coilPoints(len) {
    return QCS.map(function (qc) { var a = analyse(len, true, qc); return { qc: qc, bw: a.bw, eta: a.eta }; });
  }

  /** For one coil choice, (bandwidth, η) over every length on the slider: the path of that coil (SPEC.md §5). */
  function lengthPath(qc, step) {
    step = step || LEN_STEP;
    var out = [];
    for (var i = 0; LEN_MIN + i * step <= LEN_MAX + 1e-9; i++) {
      var len = Number((LEN_MIN + i * step).toFixed(4)), a = analyse(len, true, qc);
      out.push({ len: len, bw: a.bw, eta: a.eta });
    }
    return out;
  }

  /** η × bandwidth for the reference lengths (the dotted lines of the trade-off chart). */
  function refLines() {
    return REF_LENS.map(function (len) { return { len: len, k: analyse(len, true, 'ideal').k }; });
  }

  /** Presets (the page gives them names): each with what the lecturer should see (SPEC.md §6). */
  var presets = [
    { id: 'full', params: { len: 0.48, coil: true, qc: 200, t: 0 } },
    { id: 'bare', params: { len: 0.1, coil: false, qc: 200, t: 0 } },
    { id: 'coil', params: { len: 0.1, coil: true, qc: 200, t: 0 } },
    { id: 'half', params: { len: 0.25, coil: true, qc: 200, t: 0 } },
    { id: 'lossy', params: { len: 0.1, coil: true, qc: 50, t: 0 } },
    { id: 'ideal', params: { len: 0.1, coil: true, qc: 'ideal', t: 0 } }
  ];

  var logic = {
    F0: F0, LAMBDA: LAMBDA, RADIUS_M: RADIUS_M, BAND: BAND, P_TX: P_TX, SWR_LIMIT: SWR_LIMIT,
    LEN_MIN: LEN_MIN, LEN_MAX: LEN_MAX, LEN_STEP: LEN_STEP, QCS: QCS, T_STEP: T_STEP, KEY_STEP: KEY_STEP, REF_LENS: REF_LENS,
    defaults: defaults, presets: presets, norm: norm, initial: initial, analyse: analyse, sysOf: sysOf, bandShare: bandShare,
    swrCurve: swrCurve, coilPoints: coilPoints, lengthPath: lengthPath, refLines: refLines, LA: LA
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
