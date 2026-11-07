/* SPDX-License-Identifier: AGPL-3.0-or-later
   Copied unchanged from sims/cmp-risk-register/scoring.js @ d88138f (COMMON.md §6); promote one copy to models/.
   Risk scoring (rules: SPEC.md 1–6). A risk sits on a 5 × 5 matrix at likelihood L and impact I (integers 1–5);
   its score is L × I and its expected loss per year is the impact anchor × the likelihood anchor (fin-ale-risk's
   ALE). A treatment (accept, reduce, transfer, avoid) moves it from inherent to residual at a yearly cost. A value
   strictly above the appetite is outside it; who signs the residual follows. Rankings share the rank on ties.
   Pure: no DOM, no words, plain data in and out, so the coordinator can promote it to models/scoring.js unchanged.
   Registers on globalThis.SimdeckModels.scoring in a page; module.exports under node. */
(function (root) {
  'use strict';

  /** Rule 1: the scale anchors. Likelihood in hundredths of an event a year, impact in € per event (index = level − 1). */
  var SCALE = { f100: [5, 20, 50, 100, 300], eur: [2000, 10000, 40000, 150000, 600000] };
  /** Rule 3: transfer keeps impact level 2 (the deductible) and costs the expected payout plus a 50 % load. */
  var TRANSFER = { level: 2, load: 150 };
  var TREATMENTS = ['accept', 'reduce', 'transfer', 'avoid'];

  // from sims/fin-ale-risk/risk.js @ ad5f4b8
  /** num ÷ den rounded to a whole number, halves up (num ≥ 0, den > 0). */
  function hup(num, den) { return Math.floor((2 * num + den) / (2 * den)); }
  // from sims/fin-ale-risk/risk.js @ ad5f4b8
  /** ALE in whole euros from SLE (€) and the frequency in hundredths per year (f100). */
  function ale(sle, f100) { return hup(sle * f100, 100); }

  /** Rule 1: the ordinal score. */
  function score(l, i) { return l * i; }

  /** Rule 2: the expected loss per year of a cell, whole euros. */
  function loss(l, i, scale) {
    var s = scale || SCALE;
    return ale(s.eur[i - 1], s.f100[l - 1]);
  }

  /** Rule 3: one risk under its treatment. r: { l, i, t, dl, di, cost (the control, € a year), avoid (benefit given up,
      € a year) }. Returns { t, l0, i0, s0, e0, l1, i1, s1, e1, cost, removed, net, verdict, noEffect }; an avoided risk
      has l1 = i1 = null and s1 = e1 = 0. */
  function treat(r, scale, transfer) {
    var s = scale || SCALE, tr = transfer || TRANSFER;
    var t = TREATMENTS.indexOf(r.t) >= 0 ? r.t : 'accept';
    var out = { t: t, l0: r.l, i0: r.i, s0: score(r.l, r.i), e0: loss(r.l, r.i, s), cost: 0 };
    var l1 = r.l, i1 = r.i;
    if (t === 'reduce') {
      l1 = Math.max(1, r.l - (r.dl || 0));
      i1 = Math.max(1, r.i - (r.di || 0));
      out.cost = r.cost;
    } else if (t === 'transfer') {
      i1 = Math.min(r.i, tr.level);
      out.cost = hup(s.f100[r.l - 1] * (s.eur[r.i - 1] - s.eur[i1 - 1]) * tr.load, 10000);
    } else if (t === 'avoid') {
      out.cost = r.avoid;
    }
    if (t === 'avoid') { out.l1 = null; out.i1 = null; out.s1 = 0; out.e1 = 0; }
    else { out.l1 = l1; out.i1 = i1; out.s1 = score(l1, i1); out.e1 = loss(l1, i1, s); }
    out.removed = out.e0 - out.e1;
    out.net = out.removed - out.cost;
    out.verdict = t === 'accept' ? 'none' : out.net > 0 ? 'worth' : out.net === 0 ? 'even' : 'not';
    out.noEffect = (t === 'reduce' || t === 'transfer') && l1 === r.l && i1 === r.i;
    return out;
  }

  /** Rule 4: strictly above the appetite; equal is within. */
  function above(value, appetite) { return value > appetite; }

  /** Rule 5: who signs the residual: 'avoided', 'board' (above the appetite) or 'owner'. */
  function signer(t, residual, appetite) {
    if (t === 'avoid') return 'avoided';
    return above(residual, appetite) ? 'board' : 'owner';
  }

  /** Rule 6: competition ranks, descending (1, 1, 3): one more than the number of strictly greater values. */
  function ranks(values) {
    return values.map(function (x) {
      var r = 1;
      for (var k = 0; k < values.length; k++) if (values[k] > x) r++;
      return r;
    });
  }

  /** Rule 6: indices in rank order; equal values keep their original (register) order. */
  function order(values) {
    return values.map(function (v, k) { return k; })
      .sort(function (a, b) { return values[b] - values[a] || a - b; });
  }

  var scoring = {
    SCALE: SCALE, TRANSFER: TRANSFER, TREATMENTS: TREATMENTS,
    hup: hup, ale: ale, score: score, loss: loss, treat: treat, above: above, signer: signer, ranks: ranks, order: order
  };

  if (typeof module === 'object' && module.exports) module.exports = scoring;
  else (root.SimdeckModels = root.SimdeckModels || {}).scoring = scoring;
})(typeof globalThis !== 'undefined' ? globalThis : this);
