/* SPDX-License-Identifier: AGPL-3.0-or-later
   Investment yardsticks over a list of yearly cash flows (SPEC.md rules 4-9): simple ROI, payback period, the rates
   where an NPV is zero (IRR) and where two projects' NPVs cross (the swap rate). Kept apart from the page's model,
   pure functions over plain numbers, no words, so the coordinator can promote it to models/ next to discount.js
   (models/README.md). flows[t] is the flow at the end of year t, flows[0] today. Rates are decimals (0.08 = 8 %).
   It requires nothing: the NPV function comes in as an argument (discount.js npv). In a page it registers on
   globalThis.SimdeckModels.yardsticks; under node it is module.exports. */
(function (root) {
  'use strict';

  /** Half away from zero, never -0 (as discount.js roundMoney). */
  function roundHalfAway(x) {
    var r = x < 0 ? -Math.round(-x) : Math.round(x);
    return r === 0 ? 0 : r;
  }

  /** Rule 4: simple ROI = (Σ flows) / (Σ outflows), nominal, over the whole list. value is null with no outflow. */
  function roi(flows) {
    var invested = 0, net = 0;
    flows.forEach(function (x) { net += x; if (x < 0) invested -= x; });
    return { invested: invested, net: net, value: invested > 0 ? net / invested : null };
  }

  /** Rule 5: the first time the cumulative nominal flow climbs from below zero back to zero or above, the year
      interpolated linearly inside the year it happens: (t - 1) + (still owed at the end of year t - 1) / flow(t).
      kind 'none': nothing invested (no outflow); 'at' with years (0 when the cumulative is never negative);
      'never': still below zero at the end of the list. */
  function payback(flows) {
    var invested = flows.some(function (x) { return x < 0; });
    if (!invested) return { kind: 'none', years: null };
    var c = 0, wasNeg = false;
    for (var t = 0; t < flows.length; t++) {
      var prev = c;
      c += flows[t];
      if (prev < 0 && c >= 0) return { kind: 'at', years: (t - 1) + (-prev) / flows[t] };
      if (c < 0) wasNeg = true;
    }
    return wasNeg ? { kind: 'never', years: null } : { kind: 'at', years: 0 };
  }

  /** Number of sign changes in the non-zero flows (Descartes: at most this many IRRs above -100 %). */
  function signChanges(flows) {
    var n = 0, last = 0;
    flows.forEach(function (x) {
      if (x === 0) return;
      var s = x > 0 ? 1 : -1;
      if (last && s !== last) n++;
      last = s;
    });
    return n;
  }

  /** Bisection of f between a and b, f(a) and f(b) of opposite sign. */
  function bisect(f, a, b) {
    var fa = f(a);
    for (var i = 0; i < 200 && b - a > 1e-13; i++) {
      var m = (a + b) / 2, fm = f(m);
      if (fm === 0) return m;
      if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m;
    }
    return (a + b) / 2;
  }

  /** Rule 6: every root of f on the sorted grid xs: a grid point where f is exactly 0, or a sign change between two
      neighbouring points, refined by bisection. A root that touches zero without crossing between grid points is not
      found (documented). Sorted ascending. */
  function roots(f, xs) {
    var out = [], prevX = null, prevV = null;
    for (var i = 0; i < xs.length; i++) {
      var x = xs[i], v = f(x);
      if (v === 0) out.push(x);
      else if (prevV !== null && prevV !== 0 && (v > 0) !== (prevV > 0)) out.push(bisect(f, prevX, x));
      prevX = x;
      prevV = v;
    }
    return out;
  }

  /** The IRR search grid: -90 % to 100 % by 0.1 %, then to 1000 % by 1 %, built from integers (no drift). */
  var IRR_GRID = [];
  (function () {
    for (var i = -900; i <= 1000; i++) IRR_GRID.push(i / 1000);
    for (var j = 101; j <= 1000; j++) IRR_GRID.push(j / 100);
  })();
  var IRR_LO = IRR_GRID[0], IRR_HI = IRR_GRID[IRR_GRID.length - 1];

  /** Rule 6: the IRR, the rate at which the NPV is zero. kind 'none': the flows never change sign (no IRR);
      'one' with rate; 'many' with rates (non-conventional flows); 'out': the flows change sign but no root was
      found in -90…1000 % (outside it, or none at all: the grid cannot tell which). */
  function irr(flows, npv) {
    if (signChanges(flows) === 0) return { kind: 'none', rates: [] };
    var r = roots(function (x) { return npv(flows, x); }, IRR_GRID);
    if (r.length === 0) return { kind: 'out', rates: [] };
    return { kind: r.length === 1 ? 'one' : 'many', rates: r };
  }

  /** Rule 7: the rates in [0, hi] where the NPVs of a and b are equal: the roots of the NPV of b - a (padded with
      zeros to the same length). Grid step 0.05 %. Identical flows have no crossing (they are equal everywhere). */
  function crossings(a, b, npv, hi) {
    var n = Math.max(a.length, b.length), d = [];
    for (var t = 0; t < n; t++) d.push((b[t] || 0) - (a[t] || 0));
    if (d.every(function (x) { return x === 0; })) return [];
    var xs = [], steps = Math.round(hi * 2000);
    for (var i = 0; i <= steps; i++) xs.push(i / 2000);
    return roots(function (x) { return npv(d, x); }, xs);
  }

  /** Rule 8: which of two values is better: 'A', 'B' or 'tie'. Higher is better unless lower is set. */
  function pick(a, b, lower) {
    if (a === b) return 'tie';
    return (a > b) !== Boolean(lower) ? 'A' : 'B';
  }

  /** A ratio in tenths of a percent, half away from zero (0.2875 → 288): what the page shows and ROI compares. */
  function tenthsPct(x) { return roundHalfAway(x * 1000); }

  /** Rule 8, ROI: compared at the shown precision (0.1 percentage point); null when either has no outflow. */
  function pickRoi(ra, rb) {
    if (ra.value === null || rb.value === null) return null;
    return pick(tenthsPct(ra.value), tenthsPct(rb.value));
  }

  /** Rule 8, payback: shorter wins, compared at the shown precision (0.1 year); 'never' loses to any year, two
      'never' tie; null when either invested nothing. */
  function pickPayback(pa, pb) {
    if (pa.kind === 'none' || pb.kind === 'none') return null;
    var big = Infinity;
    var a = pa.kind === 'never' ? big : roundHalfAway(pa.years * 10);
    var b = pb.kind === 'never' ? big : roundHalfAway(pb.years * 10);
    return pick(a, b, true);
  }

  /** Rule 8, NPV: each NPV rounded to the euro, as shown, then compared; equal shown amounts tie, so
      floating-point noise never decides and the pick never contradicts the screen. */
  function pickNpv(npvA, npvB) {
    return pick(roundHalfAway(npvA), roundHalfAway(npvB));
  }

  var model = {
    IRR_LO: IRR_LO, IRR_HI: IRR_HI,
    roi: roi, payback: payback, signChanges: signChanges, roots: roots, irr: irr,
    crossings: crossings, pick: pick, tenthsPct: tenthsPct, pickRoi: pickRoi, pickPayback: pickPayback, pickNpv: pickNpv
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {}).yardsticks = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
