/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for link-budget (SPEC.md): from the transmitter to the receiver in dB. The transmitter's power, its cable and
   connectors, both antennas' gains (set directly, or from two dishes of fixed size), the free-space path loss split
   into spreading over the sphere and the isotropic antenna's area λ²/4π, the polarization loss, the receiving cable,
   and the margin above the receiver's sensitivity, less a fade reserve; the longest distance that still works.
   The dB chain is link-budget.js (catalogue §5.26 model 5, copied from gain-directivity and extended); the
   polarization loss factor is polarization.js (model 4, an unchanged copy from polarization-mismatch). Both pure and
   promotable. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var node = typeof module === 'object' && module.exports;
  var LB = node ? require('./link-budget.js') : root.SimdeckModels['link-budget'];
  var PZ = node ? require('./polarization.js') : root.SimdeckModels['polarization'];

  var D2R = Math.PI / 180;
  var TOL = 1e-9;                        // dB: a margin this close to a threshold counts as on it (tie-break 3)
  var FREQS = [145, 435, 1296, 2400, 10368];   // MHz: the 2 m, 70 cm, 23 cm, 13 cm and 3 cm amateur bands
  var R10 = [1, 1.25, 1.6, 2, 2.5, 3.2, 4, 5, 6.3, 8];   // the rounded R10 series: three steps double the distance
  var RANGES = {                         // [min, max, step, default]
    ptx: [0, 50, 1, 37],                 // dBm (1 mW … 100 W); 37 dBm = 5 W
    gt: [-10, 40, 0.5, 0],               // dBi
    gr: [-10, 40, 0.5, 0],
    dt: [0.3, 3, 0.1, 1],                // m, dish diameters
    dr: [0.3, 3, 0.1, 1],
    lt: [0, 50, 1, 0],                   // m of cable
    lr: [0, 50, 1, 0],
    dk: [-10, 56, 1, 10],                // the distance's step on the R10 grid: 0.1 km … 400 000 km; 10 = 10 km
    psi: [0, 90, 5, 0],                  // degrees between the two antennas' (linear) polarizations
    sens: [-150, -80, 1, -120],          // dBm
    fade: [0, 30, 1, 10]                 // dB kept for fading
  };
  var ETA = 0.55;                        // a dish's aperture efficiency (check)
  var CONN = 0.1;                        // dB per connector, two on each cable (check)
  var COAX = [0.63, 0.0071];             // a thick 50 Ω coaxial cable: α = 0.63·√f + 0.0071·f dB per 100 m, f in MHz (check)
  var R_IN = 50;                         // Ω, the receiver's input
  var SMALL = 3;                         // a dish under 3 λ across is only roughly a dish (tie-break 6)

  var defaults = { ptx: 37, dish: false, gt: 0, gr: 0, dt: 1, dr: 1, lt: 0, lr: 0, f: 145, dk: 10, psi: 0, sens: -120, fade: 10 };

  function bad(v) { return v === null || v === undefined || v === '' || typeof v === 'boolean'; }

  /** Params made safe (tie-break 1): ranges clamped and put on their grid; f from its list; dish only true or false. */
  function norm(p) {
    p = p || {};
    var out = {};
    Object.keys(RANGES).forEach(function (k) {
      var r = RANGES[k], v = Number(p[k]);
      if (!isFinite(v) || bad(p[k])) v = r[3];
      v = Math.min(r[1], Math.max(r[0], v));
      v = r[0] + Math.round((v - r[0]) / r[2]) * r[2];
      out[k] = Number(Math.min(r[1], v).toFixed(2));
    });
    var f = Number(p.f);
    out.f = !bad(p.f) && FREQS.indexOf(f) >= 0 ? f : defaults.f;
    out.dish = p.dish === true;
    return out;
  }

  /** The distance in km of grid step k: R10[k mod 10]·10^⌊k/10⌋ (k = 0 is 1 km, −10 is 0.1 km). */
  function distanceKm(k) {
    var i = ((k % 10) + 10) % 10, e = Math.floor(k / 10);
    return Number((R10[i] * Math.pow(10, e)).toPrecision(6));
  }

  /** The cable's loss per 100 m at f MHz, and a cable of len metres with its two connectors (tie-break 4: no cable,
      no connectors). */
  function alpha(f) { return COAX[0] * Math.sqrt(f) + COAX[1] * f; }
  function cableLoss(f, len) { return len > 0 ? alpha(f) * len / 100 + 2 * CONN : 0; }

  /** The polarization loss factor of two linear antennas ψ degrees apart, |ê_tx·ê_rx*|² = cos²ψ (polarization.js). */
  function plfOf(psi) {
    var tx = PZ.linear([1, 0, 0]), rx = PZ.linear([Math.cos(psi * D2R), Math.sin(psi * D2R), 0]);
    return PZ.plf(tx, rx);
  }

  /** The link's status from the margin (dB, null when crossed) and the fade reserve (tie-breaks 2 and 3: a threshold
      met to within TOL counts as met). */
  function statusOf(margin, fade) {
    if (margin === null) return 'crossed';
    return margin - fade >= -TOL ? 'works' : margin >= -TOL ? 'fading' : 'fail';
  }

  /** Everything the caption, the readouts and the drawing need (SPEC.md §2). */
  function initial(params) {
    var p = norm(Object.assign({}, defaults, params));
    var lam = LB.wavelength(p.f);
    var dKm = distanceKm(p.dk), d = dKm * 1000;
    var dish = p.dish;
    var gt = dish ? LB.db(LB.dishGain(p.dt, lam, ETA)) : p.gt;          // tie-break 5: the other pair is ignored
    var gr = dish ? LB.db(LB.dishGain(p.dr, lam, ETA)) : p.gr;
    var ltx = cableLoss(p.f, p.lt), lrx = cableLoss(p.f, p.lr);
    var eirp = p.ptx - ltx + gt;
    var spread = LB.spreadingDb(d), aIso = LB.isoAreaDb(lam), path = LB.pathLossDb(d, lam);
    var plf = plfOf(p.psi), pol = LB.polLossDb(plf);
    var prx = LB.receive(eirp, path, gr, pol, lrx);
    var crossed = prx === null;
    var margin = crossed ? null : prx - p.sens;
    var left = crossed ? null : margin - p.fade;
    var status = statusOf(margin, p.fade);
    var dMax = crossed ? null : LB.distanceFor(dKm, left);              // the longest distance with the reserve kept
    var dEdge = crossed ? null : LB.distanceFor(dKm, margin);           // … with nothing kept for fading
    var big = Math.max(p.dt, p.dr);
    return {
      p: p, lam: lam, dKm: dKm, dish: dish,
      gt: gt, gr: gr, ltx: ltx, lrx: lrx, alpha: alpha(p.f),
      eirp: eirp, spread: spread, aIso: aIso, path: path,
      flux: eirp - spread,                                            // dBm per m² at the receiver
      aEff: LB.effArea(LB.fromDb(gr), lam),                           // m², the receiving antenna's catching area
      pAnt: eirp - path + gr,                                         // dBm at the receiving antenna's terminals
      plf: plf, pol: pol, prx: prx,
      prxW: crossed ? 0 : LB.fromDb(prx - 30),
      uv: crossed ? 0 : 1e6 * LB.volts(LB.fromDb(prx - 30), R_IN),
      margin: margin, left: left, status: status, dMax: dMax, dEdge: dEdge,
      small: dish && Math.min(p.dt, p.dr) < SMALL * lam,               // tie-break 6
      near: dish && d < 2 * big * big / lam,                          // tie-break 7: closer than the far-field distance 2D²/λ
      farKm: dish ? 2 * big * big / lam / 1000 : null
    };
  }

  /** The received power (dBm) at another distance x km, everything else the same: 20 dB per decade, 6.02 per doubling. */
  function prxAt(st, xKm) { return st.prx === null ? null : st.prx - 20 * Math.log10(xKm / st.dKm); }

  /** Presets (the page gives them names), each with what the lecturer should see (SPEC.md §4). */
  var presets = [
    { id: 'handheld', params: { ptx: 37, dish: false, gt: 0, gr: 0, lt: 0, lr: 0, f: 145, dk: 10, psi: 0, sens: -120, fade: 10 } },
    { id: 'band', params: { ptx: 37, dish: false, gt: 0, gr: 0, lt: 0, lr: 0, f: 2400, dk: 10, psi: 0, sens: -120, fade: 10 } },
    { id: 'base', params: { ptx: 47, dish: false, gt: 10, gr: 0, lt: 30, lr: 0, f: 435, dk: 14, psi: 45, sens: -120, fade: 10 } },
    { id: 'satellite', params: { ptx: 27, dish: false, gt: 0, gr: 0, lt: 0, lr: 0, f: 145, dk: 33, psi: 45, sens: -120, fade: 10 } },
    { id: 'dishes', params: { ptx: 30, dish: true, dt: 1, dr: 1, lt: 1, lr: 1, f: 1296, dk: 20, psi: 0, sens: -120, fade: 10 } }
  ];

  var logic = {
    FREQS: FREQS, R10: R10, RANGES: RANGES, ETA: ETA, CONN: CONN, COAX: COAX, R_IN: R_IN, SMALL: SMALL, TOL: TOL,
    defaults: defaults, presets: presets, norm: norm, initial: initial, prxAt: prxAt, statusOf: statusOf,
    distanceKm: distanceKm, alpha: alpha, cableLoss: cableLoss, plfOf: plfOf,
    LB: LB, PZ: PZ
  };

  if (node) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
