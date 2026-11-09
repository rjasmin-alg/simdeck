/* SPDX-License-Identifier: AGPL-3.0-or-later
   The link budget in dB (catalogue §5.26, shared model 5), first written for gain-directivity (SPEC.md §3): the
   transmitter's side, from the transmitter power through the cable and the antenna's losses to EIRP and ERP.
   ant-link-budget adds the path loss and the receiving side as new functions.
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

  var api = { db: db, fromDb: fromDb, dbw: dbw, dbm: dbm, gain: gain, dbdOf: dbdOf, transmit: transmit };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.SimdeckModels = root.SimdeckModels || {})['link-budget'] = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
