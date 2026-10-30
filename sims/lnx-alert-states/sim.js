/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-alert-states: one alerting rule (`expr: cpu > threshold`, `for`, `keep_firing_for`) evaluated every
   minute on the samples scraped from a metric. One step = one minute: (1) scrape, if t is a scrape time; (2) evaluate
   the condition on the latest scraped sample; (3) apply the state transition; (4) append to history.
   Transitions follow Prometheus rules/alerting.go (Eval): rules and sources in SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** The metric shapes (CPU %, one value per minute 1…n). The run is as long as its series. */
  var SERIES = {
    sustained: [50, 50, 95, 95, 95, 95, 95, 95, 95, 95, 95, 60, 60, 60, 60],
    flapping: [95, 95, 60, 95, 95, 60, 95, 95, 60, 95, 95, 60, 95, 95, 60],
    'short-spike': [50, 50, 50, 95, 95, 50, 50, 50, 50, 50],
    'one-spike': [50, 50, 50, 50, 50, 95, 50, 50, 50, 50]
  };

  /** The value of the metric at minute t (1…n), or null outside the run. */
  function valueAt(p, t) {
    var s = SERIES[p.series];
    return t >= 1 && t <= s.length ? s[t - 1] : null;
  }

  /** Scrapes happen at minute 1 and then every `scrape` minutes (1, 3, 5, … for 2 min). */
  function isScrape(p, t) { return t >= 1 && (t - 1) % p.scrape === 0; }

  /** Rule 5: the minute at which a firing alert, false since keepSince, resolves (null without keep_firing_for). */
  function resolvesAt(s, p) {
    return s.alert === 'firing' && s.keepSince !== null ? s.keepSince + p.keepFiringFor : null;
  }

  var logic = {
    SERIES: SERIES,
    valueAt: valueAt,
    isScrape: isScrape,
    resolvesAt: resolvesAt,

    defaults: { series: 'sustained', threshold: 90, forMin: 5, keepFiringFor: 0, scrape: 1 },

    /** One step per evaluation minute: the length of the series. */
    steps: function (p) { return SERIES[p.series].length; },

    /** Minute 0: nothing scraped yet, the rule has no data and the alert is inactive. */
    initial: function () {
      return { t: 0, lastSample: null, cond: false, alert: 'inactive', activeAt: null, firedAt: null, keepSince: null,
        cycles: 0, fired: 0, event: null, history: [] };
    },

    /** One minute passes. Events: pending, held, fired, firing, reset, resolved, kept, idle. */
    step: function (s, n, p) {
      var t = s.t + 1;
      var v = valueAt(p, t);
      // (1) scrape: the rule sees only scraped samples; between scrapes it sees the last one (rule 1)
      var sampled = isScrape(p, t);
      var lastSample = sampled ? { t: t, v: v } : s.lastSample;
      // (2) evaluate on the latest scraped sample; no sample yet means no data, so no alert
      var cond = lastSample !== null && lastSample.v > p.threshold;
      var o = { t: t, lastSample: lastSample, cond: cond, alert: s.alert, activeAt: s.activeAt, firedAt: s.firedAt,
        keepSince: s.keepSince, cycles: s.cycles, fired: s.fired, event: 'idle',
        history: s.history.slice() };
      // (3) the transition, evaluated once per step (rule 6)
      if (cond) {
        o.keepSince = null; // true again: keep_firing_for starts over at the next false evaluation
        if (o.alert === 'inactive') { o.alert = 'pending'; o.activeAt = t; o.event = 'pending'; } // rule 2
        else o.event = o.alert === 'pending' ? 'held' : 'firing';
        if (o.alert === 'pending' && t - o.activeAt >= p.forMin) { // rule 3; for: 0 fires at once
          o.alert = 'firing'; o.firedAt = t; o.fired += 1; o.event = 'fired';
        }
      } else if (o.alert === 'pending') { // rule 4: back to inactive, the for timer is gone
        o.alert = 'inactive'; o.activeAt = null; o.event = 'reset';
      } else if (o.alert === 'firing') { // rule 5
        if (p.keepFiringFor > 0 && o.keepSince === null) o.keepSince = t;
        if (p.keepFiringFor > 0 && t - o.keepSince < p.keepFiringFor) o.event = 'kept';
        else {
          o.alert = 'inactive'; o.activeAt = null; o.firedAt = null; o.keepSince = null; o.cycles += 1; o.event = 'resolved';
        }
      }
      // (4) history
      o.history.push({ t: t, v: v, sampled: sampled, cond: cond, alert: o.alert, kept: o.event === 'kept' });
      return o;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
