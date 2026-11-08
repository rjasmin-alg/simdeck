/* SPDX-License-Identifier: AGPL-3.0-or-later
   Fine ceilings and the expected yearly cost of non-compliance (rules: SPEC.md 1–7). A regime's ceiling is the higher
   of a fixed sum and a share of the worldwide yearly turnover; the fine is a share of the ceiling; the expected yearly
   cost is likelihood × (incident cost + chance of a fine × fine), the expected-loss model of fin-ale-risk with the fine
   as a second loss that follows only some incidents. The measures prevent a share of incidents and, being in place,
   cut the chance of a fine to a quarter; the verdict compares what they remove with what they cost.
   Whole euros throughout; every expected amount is rounded once, halves up. Turnover in whole millions of euros;
   likelihood, chance of a fine, fine share and effect in whole per cent; the share of turnover in per mille.
   Pure: no DOM, no words, plain data in and out, so the coordinator can promote it to models/ unchanged.
   Registers on globalThis.SimdeckModels.fines in a page; module.exports under node. */
(function (root) {
  'use strict';

  /** Rule 1: the regimes: fixed sum F (€) and share of turnover r (per mille). GDPR art. 83(5); NIS2 art. 34(4), (5). */
  var LAWS = {
    gdpr: { fixed: 20000000, rate: 40 },
    ess: { fixed: 10000000, rate: 20 },
    imp: { fixed: 7000000, rate: 14 }
  };
  var LAW_IDS = ['gdpr', 'ess', 'imp'];

  // from sims/fin-ale-risk/risk.js @ ad5f4b8
  /** num ÷ den rounded to a whole number, halves up (num ≥ 0, den > 0). */
  function hup(num, den) { return Math.floor((2 * num + den) / (2 * den)); }

  /** Rule 2: the ceiling for turnover T (M€) under a regime: { fixed, pct, ceiling, decides, share, crossover }.
      decides: 'fixed' | 'pct' | 'equal' (tie-break). share: ceiling ÷ turnover. crossover: the turnover (M€) at which
      the two parts are equal. */
  function ceiling(law, turn) {
    var L = LAWS[law];
    var pct = turn * L.rate * 1000;
    var c = Math.max(L.fixed, pct);
    return {
      fixed: L.fixed, rate: L.rate, pct: pct, ceiling: c,
      decides: L.fixed > pct ? 'fixed' : pct > L.fixed ? 'pct' : 'equal',
      share: c / (turn * 1000000),
      crossover: L.fixed * 1000 / L.rate / 1000000
    };
  }

  /** Rule 3: the fine at k % of the ceiling, whole euros. */
  function fine(c, k) { return hup(c * k, 100); }

  /** Rules 4–6: the expected yearly cost without and with the measures, and the verdict.
      x: { p, inc, q, fine, spend, eff }. */
  function expected(x) {
    var keep = 100 - x.eff;
    var inc0 = hup(x.p * x.inc, 100);
    var fin0 = hup(x.p * x.q * x.fine, 10000);
    var inc1 = hup(x.p * keep * x.inc, 10000);
    var fin1 = hup(x.p * keep * x.q * x.fine, 4000000);
    var e0 = inc0 + fin0, e1 = inc1 + fin1;
    var saved = e0 - e1, net = saved - x.spend;
    return {
      inc0: inc0, fin0: fin0, e0: e0,
      inc1: inc1, fin1: fin1, e1: e1, t1: e1 + x.spend, spend: x.spend,
      p1: x.p * keep / 100, q1: x.q / 4,
      saved: saved, net: net,
      // fin-ale-risk rule 1a: worth it only when it removes more than it costs; equal is break-even
      verdict: net > 0 ? 'worth' : net === 0 ? 'even' : 'not',
      // rule 7: strict
      fineDominates: fin0 > inc0
    };
  }

  var fines = { LAWS: LAWS, LAW_IDS: LAW_IDS, hup: hup, ceiling: ceiling, fine: fine, expected: expected };

  if (typeof module === 'object' && module.exports) module.exports = fines;
  else (root.SimdeckModels = root.SimdeckModels || {}).fines = fines;
})(typeof globalThis !== 'undefined' ? globalThis : this);
