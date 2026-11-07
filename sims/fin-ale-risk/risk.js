/* SPDX-License-Identifier: AGPL-3.0-or-later
   Expected annual loss and risk treatments (rules: SPEC.md 1–8). A risk is a loss per event (SLE, whole euros) and a
   yearly frequency (ARO, in hundredths of an event per year); ALE = SLE × ARO. A treatment is accept, reduce (a control
   that cuts the frequency or the loss per event by a share, for a yearly cost), transfer (insurance: you keep the
   deductible per event, the insurer pays the rest for a premium) or avoid (give up the activity, and its benefit).
   Simulated years draw each risk's number of events from a Poisson distribution; one random number per year and risk
   serves the untreated and the treated count alike (inversion), so a control never adds an event.
   Deterministic: mulberry32 with a seed (the same generator as Simdeck.rng). Every expected amount is rounded once to
   whole euros, halves up; simulated amounts are whole euros by construction.
   Pure: no DOM, no words, plain data in and out, so the coordinator can promote it to models/risk.js unchanged.
   Registers on globalThis.SimdeckModels.risk in a page; module.exports under node. */
(function (root) {
  'use strict';

  /** mulberry32, as Simdeck.rng in kit/kit.js: a function returning [0, 1). */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** num ÷ den rounded to a whole number, halves up (num ≥ 0, den > 0). */
  function hup(num, den) { return Math.floor((2 * num + den) / (2 * den)); }

  /** Rule 2: ALE in whole euros from SLE (€) and the frequency in hundredths per year (f100). */
  function ale(sle, f100) { return hup(sle * f100, 100); }

  /** Rule 4: the insurer's premium: its expected payout (frequency × (loss − deductible)) × load % ÷ 100, whole euros. */
  function premium(sle, f100, ded, load) {
    var paid = Math.max(0, sle - Math.min(sle, ded));
    return hup(f100 * paid * load, 10000);
  }

  /** Rules 3–5: one risk under its treatment. r: { sle, f100, kind: 'aro' | 'sle', t, cost, eff, avoid };
      g: { ded, load }. Returns the yearly expected amounts and what a simulated event does:
      { t, ale, res (expected loss you keep), cost (yearly price of the treatment), removed, net, verdict,
        sle, f0 (the frequency per year), f (the treated frequency), per (the loss you keep per event) }. */
  function treat(r, g) {
    var a = ale(r.sle, r.f100);
    var out = { ale: a, res: a, cost: 0, f0: r.f100 / 100, f: r.f100 / 100, per: r.sle, sle: r.sle };
    if (r.sle <= 0) { out.res = 0; out.per = 0; out.t = 'off'; }
    else if (r.t === 'reduce') {
      out.res = hup(r.sle * r.f100 * (100 - r.eff), 10000);
      out.cost = r.cost;
      if (r.kind === 'aro') out.f = r.f100 * (100 - r.eff) / 10000;
      else out.per = r.sle * (100 - r.eff) / 100;
    } else if (r.t === 'transfer') {
      var keep = Math.min(r.sle, g.ded);
      out.res = hup(keep * r.f100, 100);
      out.cost = premium(r.sle, r.f100, g.ded, g.load);
      out.per = keep;
    } else if (r.t === 'avoid') {
      out.res = 0;
      out.cost = r.avoid;
      out.f = 0;
      out.per = 0;
    }
    if (!out.t) out.t = r.t === 'reduce' || r.t === 'transfer' || r.t === 'avoid' ? r.t : 'accept';
    out.removed = out.ale - out.res;
    out.net = out.removed - out.cost;
    // Rule 1a: worth it only when it removes more than it costs; equal is break-even
    out.verdict = out.t === 'accept' || out.t === 'off' ? 'none' : out.net > 0 ? 'worth' : out.net === 0 ? 'even' : 'not';
    return out;
  }

  /** Rule 6: the Poisson count for u in [0, 1) at rate lam: the number of k ≥ 0 with F(k) ≤ u (a u equal to F(k)
      counts k + 1 events). lam 0 gives 0. Monotone in lam: a lower rate never gives more events for the same u. */
  function poisson(u, lam) {
    var k = 0, p = Math.exp(-lam), F = p;
    while (u >= F && k < 1000) {
      k++;
      p *= lam / k;
      F += p;
    }
    return k;
  }

  /** Rules 6–7: n simulated years. risks: the treated risks (treat's output, in register order, each with sle);
      year y, risk i takes the (y × risks.length + i)-th number of the seeded stream, also for a risk not in the
      register. Returns per year the untreated loss (u), the treated loss you keep (k) and, once, the fixed yearly
      cost of the treatments (fixed). */
  function years(risks, n, seed) {
    var r = rng(seed), u = new Array(n), k = new Array(n);
    var fixed = 0;
    risks.forEach(function (x) { fixed += x.cost; });
    for (var y = 0; y < n; y++) {
      var a = 0, b = 0;
      for (var i = 0; i < risks.length; i++) {
        var x = risks[i], v = r();
        if (x.t === 'off') continue;
        a += poisson(v, x.f0) * x.sle;
        if (x.f > 0 && x.per > 0) b += poisson(v, x.f) * x.per;
      }
      u[y] = a;
      k[y] = b;
    }
    return { u: u, k: k, fixed: fixed };
  }

  /** Rule 8: average (whole euros, halves up), worst and its first year, and the years with a loss above 0. */
  function summary(list, plus) {
    var sum = 0, worst = -1, at = 0, hit = 0;
    list.forEach(function (x, i) {
      sum += x;
      if (x > worst) { worst = x; at = i; }   // the first of equal worst years
      if (x > 0) hit++;
    });
    return { avg: hup(sum + plus * list.length, list.length), worst: worst + plus, at: at, hit: hit };
  }

  /** A "nice" axis step (1, 2, 2.5 or 5 × 10^k) at least span ÷ parts. */
  function niceStep(span, parts) {
    var raw = Math.max(span, 1) / parts;
    var p = Math.pow(10, Math.floor(Math.log10(raw)));
    var m = [1, 2, 2.5, 5, 10].find(function (x) { return x * p >= raw - 1e-9; });
    return m * p;
  }

  var risk = {
    rng: rng, hup: hup, ale: ale, premium: premium, treat: treat, poisson: poisson, years: years, summary: summary,
    niceStep: niceStep
  };

  if (typeof module === 'object' && module.exports) module.exports = risk;
  else (root.SimdeckModels = root.SimdeckModels || {}).risk = risk;
})(typeof globalThis !== 'undefined' ? globalThis : this);
