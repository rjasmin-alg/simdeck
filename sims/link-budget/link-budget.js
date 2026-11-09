/* SPDX-License-Identifier: AGPL-3.0-or-later
   The link budget in dB (catalogue §5.26, shared model 5), first written for gain-directivity (its SPEC.md §3): the
   transmitter's side, from the transmitter power through the cable and the antenna's losses to EIRP and ERP.
   Copied from sims/gain-directivity/link-budget.js @ 5f85cdb with every function unchanged (COMMON.md §6). Added for
   link-budget (additive, promotable; link-budget SPEC.md §2): the wavelength, the free-space path loss and its two
   parts (spreading over the sphere, the isotropic antenna's area), effective area and gain, a dish's gain, the
   polarization loss in dB, the receiving side, and the distance a margin buys.
   Pure, DOM-free, no strings: registers as SimdeckModels['link-budget'] in a page and is module.exports under node,
   so the coordinator can move it to models/ unchanged. Powers in watts, ratios as plain numbers, losses in dB (≥ 0). */
(function (root) {
  'use strict';

  /** dB of a power ratio; null for zero or less (−∞ is not JSON). */
  function db(x) { return x > 0 ? 10 * Math.log10(x) : null; }
  /** A power ratio from dB. */
  function fromDb(d) { return Math.pow(10, d / 10); }
  /** dBW of a power in watts, and dBm (dBW + 30). */
  function dbw(p) { return db(p); }
  function dbm(p) { var v = db(p); return v === null ? null : v + 30; }

  /** Gain from directivity and radiation efficiency η (0 … 1): G = η·D (Balanis eq. 2-49). */
  function gain(d, eff) { return eff * d; }

  /** dBd from dBi, given the half-wave dipole's directivity dDipole (1.6409): dBd = dBi − 10·log dDipole. */
  function dbdOf(dbi, dDipole) { return dbi === null ? null : dbi - db(dDipole); }

  /** The transmitter's side in watts and dB: { ptx, cableDb, pAnt, pRad, eirp, erp, ...Dbw }.
      ptx in W; cableDb ≥ 0; d the directivity; eff the efficiency; dDipole the reference dipole's directivity. */
  function transmit(ptx, cableDb, d, eff, dDipole) {
    var pAnt = ptx * fromDb(-cableDb);
    var pRad = eff * pAnt;
    var g = gain(d, eff);
    var eirp = pAnt * g;                       // = pRad·d
    var erp = eirp / dDipole;
    return {
      ptx: ptx, cableDb: cableDb, pAnt: pAnt, pRad: pRad, lossW: pAnt - pRad, cableW: ptx - pAnt,
      g: g, gDbi: db(g), gDbd: dbdOf(db(g), dDipole), effDb: db(eff),
      eirp: eirp, erp: erp,
      ptxDbw: dbw(ptx), pAntDbw: dbw(pAnt), pRadDbw: dbw(pRad), eirpDbw: dbw(eirp), erpDbw: dbw(erp),
      ptxDbm: dbm(ptx)
    };
  }

  // ── added for link-budget ──

  var C = 299792458;                    // m/s, the speed of light in vacuum (exact)

  /** The wavelength in metres of a frequency in MHz: λ = c / f. */
  function wavelength(fMHz) { return C / (fMHz * 1e6); }

  /** Spreading over a sphere of radius d (m): 10·log(4πd² / 1 m²), dB. The EIRP over 4πd² is the power flux density. */
  function spreadingDb(d) { return db(4 * Math.PI * d * d); }

  /** The effective area of an isotropic antenna, λ²/4π, in dB over 1 m² (negative below 84.6 MHz's 3.545 m). */
  function isoAreaDb(lam) { return db(lam * lam / (4 * Math.PI)); }

  /** The free-space path loss between two isotropic antennas, 20·log(4πd/λ) = spreadingDb(d) − isoAreaDb(λ), dB
      (Friis 1946; Balanis eq. 2-118 with G = 1). */
  function pathLossDb(d, lam) { return 20 * Math.log10(4 * Math.PI * d / lam); }

  /** The effective area of an antenna of gain g (a ratio) at wavelength λ: A = g·λ²/4π, m² (Balanis eq. 2-111). */
  function effArea(g, lam) { return g * lam * lam / (4 * Math.PI); }
  /** The gain of an antenna of effective area a (m²): g = 4πa/λ². */
  function gainOfArea(a, lam) { return 4 * Math.PI * a / (lam * lam); }

  /** A dish of diameter dia (m) with aperture efficiency eta: g = eta·(π·dia/λ)², the gain of its area eta·π·dia²/4. */
  function dishGain(dia, lam, eta) { return gainOfArea(eta * Math.PI * dia * dia / 4, lam); }

  /** The polarization loss in dB of a polarization loss factor plf (0 … 1): −10·log plf ≥ 0; null for plf 0 (crossed:
      in theory nothing is received). */
  function polLossDb(plf) { return plf > 0 ? (plf >= 1 ? 0 : -db(plf)) : null; }

  /** The receiving side in dB: the power at the receiver from the EIRP (dBm or dBW), the path loss, the receiving gain
      (dBi), the polarization loss and the receiving cable's loss (both dB ≥ 0). null when the polarization loss is
      null (crossed). Friis: P_r = P_t·G_t·G_r·(λ/4πd)², each loss a factor below 1. */
  function receive(eirp, pathDb, grDbi, polDb, cableRxDb) {
    if (polDb === null) return null;
    return eirp - pathDb + grDbi - polDb - cableRxDb;
  }

  /** The distance at which the received power changes by extraDb from its value at d: d·10^(extraDb/20), since the
      path loss grows by 20·log 2 = 6.02 dB for each doubling. */
  function distanceFor(d, extraDb) { return d * Math.pow(10, extraDb / 20); }

  /** The voltage (V, rms) a power p (W) gives across a resistance r (Ω): √(p·r). */
  function volts(p, r) { return Math.sqrt(p * r); }

  var api = {
    db: db, fromDb: fromDb, dbw: dbw, dbm: dbm, gain: gain, dbdOf: dbdOf, transmit: transmit,
    C: C, wavelength: wavelength, spreadingDb: spreadingDb, isoAreaDb: isoAreaDb, pathLossDb: pathLossDb,
    effArea: effArea, gainOfArea: gainOfArea, dishGain: dishGain, polLossDb: polLossDb, receive: receive,
    distanceFor: distanceFor, volts: volts
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.SimdeckModels = root.SimdeckModels || {})['link-budget'] = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
