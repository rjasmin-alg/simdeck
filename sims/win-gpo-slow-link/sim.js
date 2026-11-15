/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-gpo-slow-link: the client estimates the speed of its link to the domain controller; slower than the
   slow-link threshold (500 kbit/s by default, 0 = never slow) is a slow link, and then some client-side extensions
   are skipped while Administrative Templates and Security always apply. Software Installation and Folder Redirection
   are not in a background refresh at all (win-gpo-processing). An explorer (no steps): initial(params) computes the
   whole table. Rules, tie-breaks and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers; the state is plain JSON. No strings: words are in strings.js.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** The speed ladder (kbit/s), one value per slider notch (SPEC.md, "Params"). */
  var SPEEDS = [56, 128, 256, 384, 500, 768, 1000, 1500, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];

  /** Rule 1: the policy's default threshold, and the slider's bounds. */
  var DEFAULT_THRESHOLD = 500;
  var MAX_THRESHOLD = 5000;
  var THRESHOLD_STEP = 100;

  /**
   * The client-side extensions in table order (SPEC.md, "The extensions"). slow: 'always' (rule 2, cannot be
   * changed), 'on' (rule 3, applied by default) or 'off' (rule 4, skipped by default). fgOnly: rule 6.
   * The fgOnly flag is win-gpo-processing's CSES[].sync (from sims/win-gpo-processing/sim.js @ 350b667).
   */
  var CSES = [
    { id: 'registry', slow: 'always', fgOnly: false },
    { id: 'security', slow: 'always', fgOnly: false },
    { id: 'efs', slow: 'on', fgOnly: false },
    { id: 'ipsec', slow: 'on', fgOnly: false },
    { id: 'scripts', slow: 'off', fgOnly: false },
    { id: 'folders', slow: 'off', fgOnly: true },
    { id: 'software', slow: 'off', fgOnly: true },
    { id: 'quotas', slow: 'off', fgOnly: false },
    { id: 'drivemaps', slow: 'on', fgOnly: false, pref: true }
  ];
  var PASSES = ['foreground', 'background'];

  function cse(id) { for (var i = 0; i < CSES.length; i++) if (CSES[i].id === id) return CSES[i]; return null; }
  /** A whole number within lo…hi; null, '' and anything not a number fall back to the default. */
  function clamp(v, lo, hi, dflt) {
    if (v === null || v === '' || typeof v === 'boolean') return dflt;
    v = Math.round(Number(v));
    return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : dflt;
  }

  // ── the rules, as pure functions ──

  /** Rule 1, T1, T2: is a link of this speed slow for this threshold? Equal is fast; threshold 0 is never slow. */
  function isSlow(speedKbps, thresholdKbps) { return thresholdKbps > 0 && speedKbps < thresholdKbps; }

  /** Rules 2, 3, 5: does this extension run over a slow link, with these allow settings? */
  function runsOnSlow(c, allowSlow) {
    if (c.slow === 'always') return true;
    if (allowSlow && Object.prototype.hasOwnProperty.call(allowSlow, c.id)) return !!allowSlow[c.id];
    return c.slow === 'on';
  }

  /** Rules 2–6, T3: 'ran' | 'skipped' | 'notInPass' for one extension, link and pass. */
  function outcome(c, slow, pass, allowSlow) {
    if (pass === 'background' && c.fgOnly) return 'notInPass';
    if (!slow) return 'ran';
    return runsOnSlow(c, allowSlow) ? 'ran' : 'skipped';
  }

  /** The allow settings: each configurable extension's default (rules 3, 4), Scripts from the param (rule 5). */
  function allowFor(p) {
    var a = {};
    CSES.forEach(function (c) { if (c.slow !== 'always') a[c.id] = c.slow === 'on'; });
    a.scripts = p.allowScripts === true;
    return a;
  }

  /** Normalised params: out-of-range or unknown values fall back to the bounds or the defaults. */
  function norm(p) {
    p = p || {};
    return {
      speed: clamp(p.speed, 0, SPEEDS.length - 1, logic.defaults.speed),
      thresholdKbps: clamp(p.thresholdKbps, 0, MAX_THRESHOLD, DEFAULT_THRESHOLD),
      allowScripts: p.allowScripts === true,
      pass: PASSES.indexOf(p.pass) >= 0 ? p.pass : 'foreground'
    };
  }

  /** Rows whose outcome now differs between two states (the page's "changed" marks and the caption). */
  function flipped(prev, cur) {
    if (!prev || !cur) return [];
    return cur.rows.filter(function (r, i) { return prev.rows[i] && prev.rows[i].now !== r.now; })
      .map(function (r) { return r.id; });
  }

  var logic = {
    /** Parameter defaults (SPEC.md, "Params"): the branch link of 200 000 kbit/s. */
    defaults: { speed: 14, thresholdKbps: DEFAULT_THRESHOLD, allowScripts: false, pass: 'foreground' },

    /** Explorer: no steps. */
    steps: 0,

    SPEEDS: SPEEDS,
    DEFAULT_THRESHOLD: DEFAULT_THRESHOLD,
    MAX_THRESHOLD: MAX_THRESHOLD,
    THRESHOLD_STEP: THRESHOLD_STEP,
    CSES: CSES,
    PASSES: PASSES,

    /** The presets (SPEC.md, "Expected numbers"). */
    presets: [
      { id: 'branch-200mb', params: { speed: SPEEDS.indexOf(200000), thresholdKbps: 500, allowScripts: false, pass: 'foreground' } },
      { id: 'vpn-384k', params: { speed: SPEEDS.indexOf(384), thresholdKbps: 500, allowScripts: false, pass: 'foreground' } },
      { id: 'threshold-0', params: { speed: SPEEDS.indexOf(384), thresholdKbps: 0, allowScripts: false, pass: 'foreground' } },
      { id: 'allow-scripts', params: { speed: SPEEDS.indexOf(384), thresholdKbps: 500, allowScripts: true, pass: 'foreground' } }
    ],

    /** The whole scene for these params. */
    initial: function (params) {
      var p = norm(params);
      var speedKbps = SPEEDS[p.speed];
      var slow = isSlow(speedKbps, p.thresholdKbps);
      var allowSlow = allowFor(p);
      var rows = CSES.map(function (c) {
        var fast = outcome(c, false, p.pass, allowSlow), onSlow = outcome(c, true, p.pass, allowSlow);
        return {
          id: c.id,
          setting: c.slow === 'always' ? 'always' : allowSlow[c.id] ? 'allowed' : 'notAllowed',
          fast: fast,
          slow: onSlow,
          now: slow ? onSlow : fast
        };
      });
      var count = { ran: 0, skipped: 0, notInPass: 0 };
      rows.forEach(function (r) { count[r.now]++; });
      return {
        speed: p.speed,
        speedKbps: speedKbps,
        thresholdKbps: p.thresholdKbps,
        detection: p.thresholdKbps > 0,
        equal: p.thresholdKbps > 0 && speedKbps === p.thresholdKbps,
        slow: slow,
        pass: p.pass,
        allowSlow: allowSlow,
        rows: rows,
        count: count
      };
    },

    // exported for the page and the tests
    isSlow: isSlow,
    runsOnSlow: runsOnSlow,
    outcome: outcome,
    allowFor: allowFor,
    norm: norm,
    flipped: flipped,
    cse: cse
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
