/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for slo-error-budget: an SLO's error budget over a 30-day window, the burn rate over five rolling windows,
   and the three multiwindow, multi-burn-rate alerts (rules in SPEC.md). An explorer: the state is a pure function of
   the params (compute), no steps.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON (numbers, booleans, arrays, objects).
   Exact arithmetic: error rates are whole basis points (1 bp = 0.01 %), time is whole minutes, so a budget or a
   window holds an integer number of bp·min and every threshold is compared in integers (a tie fires, rule 5).
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DAY = 1440;                 // minutes
  var WINDOW_DAYS = 30;           // the SLO window (fixed)
  var T = WINDOW_DAYS * DAY;      // 43 200 minutes
  var FULL = 10000;               // 100 % in basis points

  /** The SLOs on offer, in percent. */
  var SLOS = [99, 99.5, 99.9, 99.99];

  /** The rolling windows, in minutes. */
  var WINDOWS = { w5m: 5, w30m: 30, w1h: 60, w6h: 360, w3d: 3 * DAY };
  var WINDOW_IDS = ['w5m', 'w30m', 'w1h', 'w6h', 'w3d'];

  /** Rule 3: each alert needs its long and its short window at or above the threshold (thr10 = threshold × 10). */
  var ALERTS = [
    { id: 'fast', long: 'w1h', short: 'w5m', thr10: 144 },     // page: 14.4 over 1 h and 5 min
    { id: 'slow', long: 'w6h', short: 'w30m', thr10: 60 },     // page: 6 over 6 h and 30 min
    { id: 'ticket', long: 'w3d', short: 'w6h', thr10: 10 }     // ticket: 1 over 3 days and 6 h
  ];
  var ALERT_IDS = ['fast', 'slow', 'ticket'];

  /** The stops of the incident editor's sliders (the page's sliders run over these indices). */
  var DURATIONS = [1, 2, 5, 10, 20, 30, 60, 120, 240, 360, 720, 1440, 4320, 10080, 21600, 43200];
  var RATES = [0.05, 0.1, 0.2, 0.5, 1, 1.44, 2, 5, 10, 25, 50, 100];
  var MAX_INCIDENTS = 6;

  /** SLO in percent → the allowed error rate in bp (99.9 % → 10 bp = 0.1 %). */
  function allowedBp(slo) { return Math.round((100 - slo) * 100); }
  /** An error rate in percent → bp, within 0…100 %. */
  function bpOf(pct) { return Math.max(0, Math.min(FULL, Math.round(Number(pct) * 100))); }

  /** An incident as whole minutes and bp, clipped to the window: { start, end, bp } (end exclusive). */
  function norm(inc) {
    var s0 = Math.round(Number(inc.startDay) * DAY);
    var start = Math.min(T, Math.max(0, s0));
    var end = Math.max(start, Math.min(T, s0 + Math.max(0, Math.round(Number(inc.durationMin)))));
    return { start: start, end: end, bp: bpOf(inc.errorRatePct) };
  }

  /** Error rate in bp for every minute of the window; overlapping incidents add up, at most 100 %. */
  function series(incidents) {
    var e = new Array(T).fill(0);
    (incidents || []).forEach(function (inc) {
      var n = norm(inc);
      for (var m = n.start; m < n.end; m++) e[m] = Math.min(FULL, e[m] + n.bp);
    });
    return e;
  }

  /** Prefix sums: P[t] = bp·min of errors in minutes 0 … t − 1 (P[0] = 0, P[T] = the whole window). */
  function prefix(e) {
    var P = new Array(e.length + 1);
    P[0] = 0;
    for (var i = 0; i < e.length; i++) P[i + 1] = P[i] + e[i];
    return P;
  }

  /** bp·min in the window of w minutes that ends at instant t: minutes t − w … t − 1. Before day 0 there were no
      errors (the month starts after a clean one), so a window reaching back past day 0 counts zeros there. */
  function windowSum(P, t, w) { return P[t] - P[Math.max(0, t - w)]; }

  /** Rule 2: burn rate = the window's error rate / the allowed rate. */
  function burnOf(sum, w, allowed) { return sum / (w * allowed); }

  /** Rules 3 and 5, in integers: burn ≥ threshold ⇔ 10 × sum ≥ thr10 × w × allowed. */
  function over(sum, w, allowed, thr10) { return 10 * sum >= thr10 * w * allowed; }

  function alertOn(P, t, a, allowed) {
    var lw = WINDOWS[a.long], sw = WINDOWS[a.short];
    return over(windowSum(P, t, lw), lw, allowed, a.thr10) && over(windowSum(P, t, sw), sw, allowed, a.thr10);
  }

  var logic = {
    DAY: DAY, T: T, WINDOW_DAYS: WINDOW_DAYS, SLOS: SLOS, WINDOWS: WINDOWS, WINDOW_IDS: WINDOW_IDS,
    ALERTS: ALERTS, ALERT_IDS: ALERT_IDS, DURATIONS: DURATIONS, RATES: RATES, MAX_INCIDENTS: MAX_INCIDENTS,

    /** Params. incidents: [{ startDay, durationMin, errorRatePct }]; at: the cursor (minutes since day 0) where the
        gauges and lamps are read. sel, iStart (hours), iDur and iRate (indices into DURATIONS, RATES) are the page's
        incident editor: they mirror incidents[sel] (mirror, applyEdit). */
    defaults: { slo: 99.9, incidents: [], at: 0, showWindows: true, sel: 0, iStart: 0, iDur: 6, iRate: 8 },

    steps: 0,

    norm: norm,
    series: series,
    prefix: prefix,
    allowedBp: allowedBp,

    /** The whole state for these params (rules 1–5). */
    compute: function (p) {
      var allowed = allowedBp(p.slo);
      var budget = allowed * T;                                  // rule 1, in bp·min
      var incidents = (p.incidents || []).map(norm);
      var e = series(p.incidents);
      var P = prefix(e);
      var at = Math.max(0, Math.min(T, Math.round(Number(p.at) || 0)));

      var burn = {};
      WINDOW_IDS.forEach(function (k) { burn[k] = burnOf(windowSum(P, at, WINDOWS[k]), WINDOWS[k], allowed); });
      var alerts = {};
      ALERTS.forEach(function (a) { alerts[a.id] = alertOn(P, at, a, allowed); });

      // When each alert is on over the month: instants 0 … T; an interval [from, to) ends at the first instant off.
      var lit = {}, firstFired = {};
      ALERTS.forEach(function (a) {
        var list = [], from = -1;
        for (var t = 0; t <= T; t++) {
          var on = alertOn(P, t, a, allowed);
          if (on && from < 0) from = t;
          if (!on && from >= 0) { list.push([from, t]); from = -1; }
        }
        if (from >= 0) list.push([from, T + 1]);
        lit[a.id] = list;
        firstFired[a.id] = list.length ? list[0][0] : null;
      });

      // Peak burn of each window over the month (for the captions: "never reaches a threshold").
      var peak = {};
      WINDOW_IDS.forEach(function (k) {
        var w = WINDOWS[k], best = 0;
        for (var t = 1; t <= T; t++) { var s = windowSum(P, t, w); if (s > best) best = s; }
        peak[k] = burnOf(best, w, allowed);
      });

      // The first instant the errors so far reach the budget (a tie exhausts it), or null.
      var exhaustedAt = null;
      if (P[T] >= budget) { for (var t = 0; t <= T; t++) if (P[t] >= budget) { exhaustedAt = t; break; } }

      // Mean error rate per hour, in bp, for the timeline's bars.
      var hourly = [];
      for (var h = 0; h < T / 60; h++) hourly.push((P[(h + 1) * 60] - P[h * 60]) / 60);

      var used = P[T] / FULL, usedAt = P[at] / FULL, budgetMin = budget / FULL;
      return {
        allowedBp: allowed,
        budgetMin: budgetMin,
        usedMin: used,                                        // over the whole window, overlaps capped at 100 %
        usedPct: 100 * P[T] / budget,
        remainingPct: Math.max(0, 100 - 100 * P[T] / budget),
        at: at,
        usedAtMin: usedAt,                                    // by the cursor
        remainingAtPct: Math.max(0, 100 - 100 * P[at] / budget),
        burn: burn,
        alerts: alerts,
        lit: lit,
        firstFired: firstFired,
        peak: peak,
        exhaustedAt: exhaustedAt,
        hourly: hourly,
        // rule 4: each incident on its own, error rate × duration in minutes of full failure
        incidents: incidents.map(function (n) {
          return { start: n.start, end: n.end, bp: n.bp, usedMin: n.bp * (n.end - n.start) / FULL };
        })
      };
    },

    /** Explorer: the state is compute(params). */
    initial: function (p) { return logic.compute(p); },

    /** Burn rate of the window of w minutes ending at t, for any series (tests, rule 2). */
    burnAt: function (incidents, slo, t, w) {
      return burnOf(windowSum(prefix(series(incidents)), t, w), w, allowedBp(slo));
    },

    /** The incident editor's slider values for incidents[sel] (iStart in whole hours, nearest stops). */
    mirror: function (incidents, sel) {
      var inc = (incidents || [])[sel];
      if (!inc) return {};
      var nearest = function (list, v) {
        var best = 0;
        list.forEach(function (x, i) { if (Math.abs(x - v) < Math.abs(list[best] - v)) best = i; });
        return best;
      };
      return {
        iStart: Math.max(0, Math.min(WINDOW_DAYS * 24 - 1, Math.round(Number(inc.startDay) * 24))),
        iDur: nearest(DURATIONS, Number(inc.durationMin)),
        iRate: nearest(RATES, Number(inc.errorRatePct))
      };
    },

    /** incidents with incidents[sel] replaced by the editor's slider values (a new array; the input is kept). */
    applyEdit: function (p) {
      var list = (p.incidents || []).slice();
      if (!list[p.sel]) return list;
      list[p.sel] = { startDay: p.iStart / 24, durationMin: DURATIONS[p.iDur], errorRatePct: RATES[p.iRate] };
      return list;
    },

    /** A new incident at the cursor's hour (30 min at 10 %), appended; at most MAX_INCIDENTS. */
    addIncident: function (p) {
      var list = (p.incidents || []).slice();
      if (list.length >= MAX_INCIDENTS) return list;
      var hour = Math.min(WINDOW_DAYS * 24 - 1, Math.floor((Number(p.at) || 0) / 60));
      list.push({ startDay: hour / 24, durationMin: 30, errorRatePct: 10 });
      return list;
    },

    /** Lamps whose state differs between two states (the page marks them "changed"). */
    changedAlerts: function (prev, cur) {
      if (!prev) return [];
      return ALERT_IDS.filter(function (id) { return prev.alerts[id] !== cur.alerts[id]; });
    },

    /** Which caption the state calls for (SPEC.md, "Captions"): { key, alert }. */
    captionKey: function (st) {
      if (!st.incidents.length) return { key: 'empty' };
      for (var i = 0; i < 2; i++) if (st.alerts[ALERT_IDS[i]]) return { key: 'page', alert: ALERT_IDS[i] };
      for (var j = 0; j < 2; j++) {
        var a = ALERTS[j];
        if (st.burn[a.long] * 10 >= a.thr10 - 1e-9 && st.firstFired[a.id] != null && st.firstFired[a.id] <= st.at) {
          return { key: 'cleared', alert: a.id };
        }
      }
      var paged = st.firstFired.fast != null || st.firstFired.slow != null;
      if (st.exhaustedAt != null && !paged && st.firstFired.ticket != null) return { key: 'slowBurn', alert: 'ticket' };
      if (st.alerts.ticket) return { key: 'ticket', alert: 'ticket' };
      if (st.exhaustedAt != null) return { key: 'exhausted' };
      if (ALERT_IDS.every(function (id) { return st.firstFired[id] == null; })) return { key: 'quiet' };
      return { key: 'after' };
    },

    /** The first alert to fire over the month (most severe first on a tie), or null. */
    firstAlert: function (st) {
      var best = null;
      ALERT_IDS.forEach(function (id) {
        var f = st.firstFired[id];
        if (f != null && (best == null || f < st.firstFired[best])) best = id;
      });
      return best;
    },

    /** Presets (SPEC.md): SLO 99.9 %; the cursor where the preset's point shows. sel 0; the page adds the mirror. */
    presets: [
      { id: 'outage-20min', params: { slo: 99.9, incidents: [{ startDay: 10.5, durationMin: 20, errorRatePct: 100 }], at: 10.5 * DAY + 20 } },
      { id: 'fast-burn', params: { slo: 99.9, incidents: [{ startDay: 8.5, durationMin: 60, errorRatePct: 1.44 }], at: 8.5 * DAY + 60 } },
      { id: 'slow-burn', params: { slo: 99.9, incidents: [{ startDay: 0, durationMin: 43200, errorRatePct: 0.2 }], at: 15 * DAY } },
      { id: 'blip', params: { slo: 99.9, incidents: [{ startDay: 5.5, durationMin: 2, errorRatePct: 100 }], at: 5.5 * DAY + 7 } },
      { id: 'under-the-radar', params: { slo: 99.9, incidents: [{ startDay: 0, durationMin: 43200, errorRatePct: 0.05 }], at: T } }
    ]
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
