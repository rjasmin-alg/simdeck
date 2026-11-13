/* SPDX-License-Identifier: AGPL-3.0-or-later
   The number line (brojevna crta): a stretch of whole numbers that zooms to what it must show, its ticks, where a
   number sits on it, which tick labels a marked point would cover, and jumps with their sizes. Shared model of
   catalogue §5.27, hub sims/ari-constant-difference/ (ari-mental-strategies, ari-unknown-term and ari-big-numbers
   copy it until the coordinator promotes it to models/number-line.js). Pure: no DOM, no strings, plain JSON in and
   out; it registers like a model in models/ (models/README.md), so it can move there unchanged.
   Copied unchanged from sims/ari-constant-difference/numberline.js @ f2a51d4 (COMMON.md §6); ari-mental-strategies
   uses view, ticks, pos and jump. */
(function (root) {
  'use strict';

  /** The leading factors of a nice step, in order: 1, 2 and 5 times a power of ten. */
  var FACTORS = [1, 2, 5];

  var model = {
    /** The smallest step 1, 2 or 5 · 10^k (at least 1) that cuts span into at most maxTicks parts. */
    niceStep: function (span, maxTicks) {
      var s = Math.max(1, span), m = Math.max(1, Math.floor(maxTicks) || 1);
      for (var p = 1; p < 1e15; p *= 10) {
        for (var i = 0; i < FACTORS.length; i++) if (s / (FACTORS[i] * p) <= m) return FACTORS[i] * p;
      }
      return 1e15;
    },

    /** The minor step under a major step: tenths of 1 · 10^k, halves of 2 · 10^k, fifths of 5 · 10^k; 0 when it
        would not be a whole number (a step of 1 has no minor ticks). */
    minorStep: function (step) {
      var lead = step;
      while (lead >= 10 && lead % 10 === 0) lead /= 10;
      var m = step / (lead === 1 ? 10 : lead === 2 ? 2 : 5);
      return m >= 1 && Math.floor(m) === m ? m : 0;
    },

    /**
     * The stretch that shows every value: { lo, hi, step, minor }, lo and hi whole multiples of step.
     * opts: maxTicks (major ticks, default 10), pad (share of the span added on each side, rounded up, default 0.08),
     * minSpan (the narrowest stretch, default 10, centred on the values), floor (the lowest number shown, default 0;
     * null for none), ceil (the highest number shown, default none: the stretch slides left, and hi is cut to it after
     * snapping). Ties: an odd widening puts the extra unit on the right.
     */
    view: function (values, opts) {
      var o = opts || {};
      var maxTicks = o.maxTicks == null ? 10 : o.maxTicks;
      var pad = o.pad == null ? 0.08 : o.pad;
      var minSpan = o.minSpan == null ? 10 : o.minSpan;
      var floor = o.floor === undefined ? 0 : o.floor;
      var ceil = o.ceil == null ? null : o.ceil;
      var lo = Math.min.apply(null, values), hi = Math.max.apply(null, values);
      if (hi - lo < minSpan) {
        var extra = minSpan - (hi - lo);
        lo -= Math.floor(extra / 2);
        hi += Math.ceil(extra / 2);
      }
      var p = Math.ceil((hi - lo) * pad);
      lo -= p; hi += p;
      if (ceil != null && hi > ceil) { lo -= hi - ceil; hi = ceil; }
      if (floor != null && lo < floor) { hi += floor - lo; lo = floor; }
      var step = model.niceStep(hi - lo, maxTicks);
      lo = Math.floor(lo / step) * step;
      hi = Math.ceil(hi / step) * step;
      if (floor != null && lo < floor) lo = floor;
      // snapping can leave more parts than asked for: widen the step once more
      if ((hi - lo) / step > maxTicks) {
        step = model.niceStep(hi - lo, maxTicks);
        lo = Math.floor(lo / step) * step;
        hi = Math.ceil(hi / step) * step;
        if (floor != null && lo < floor) lo = floor;
      }
      if (ceil != null && hi > ceil && ceil > lo) hi = ceil;
      return { lo: lo, hi: hi, step: step, minor: model.minorStep(step) };
    },

    /** Every tick of a view, left to right: { v, major }. Minor ticks only when there are at most maxMinor of them. */
    ticks: function (view, maxMinor) {
      var lim = maxMinor == null ? 120 : maxMinor;
      var by = view.minor && (view.hi - view.lo) / view.minor <= lim ? view.minor : view.step;
      var out = [];
      var first = Math.ceil(view.lo / by) * by;
      for (var v = first; v <= view.hi; v += by) out.push({ v: v, major: v % view.step === 0 });
      return out;
    },

    /** Where v sits on the view, 0 at lo and 1 at hi (outside the view: below 0 or above 1). */
    pos: function (v, view) {
      return view.hi === view.lo ? 0 : (v - view.lo) / (view.hi - view.lo);
    },

    /** The major ticks whose label stays clear of every marked point: farther than minFrac of the view from each.
        A tick exactly at a point is never shown (the point's own label says the number). */
    freeLabels: function (view, points, minFrac) {
      var d = minFrac == null ? 0.05 : minFrac;
      return model.ticks(view, 0).filter(function (t) {
        if (!t.major) return false;
        var x = model.pos(t.v, view);
        return points.every(function (p) { return Math.abs(model.pos(p, view) - x) > d; });
      }).map(function (t) { return t.v; });
    },

    /** A jump from one number to another: its size (signed) and direction ('right', 'left', 'none'). */
    jump: function (from, to) {
      return { from: from, to: to, size: to - from, dir: to > from ? 'right' : to < from ? 'left' : 'none' };
    },

    /** The whole number at a share x (0…1) of the view, rounded half up, kept inside the view: what a drag lands on. */
    valueAt: function (x, view) {
      var v = Math.floor(view.lo + x * (view.hi - view.lo) + 0.5);
      return Math.min(view.hi, Math.max(view.lo, v));
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {})['number-line'] = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
