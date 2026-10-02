/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ipv6-shorten: one full IPv6 address (eight groups, nothing left out) brought to the one recommended short
   form, in the steps of the URM book's chapter 10: letters to lowercase, leading zeros out of every group, find the
   longest run of zero groups, replace that run (and only it) with "::", check that the groups still add up to eight.
   Rules: RFC 5952 §4.1 (leading zeros), §4.2.1 (longest run), §4.2.2 (never one group), §4.2.3 (equal runs: the
   first), §4.3 (lowercase); RFC 4291 §2.2 ("::" once). The last step also names the address type by its prefix
   (chapter 10, "Vrste IPv6 adresa"), as the original did.
   Pure: no DOM, no Math.random, no Date, no timers. Groups are strings; state is plain JSON. The address helpers
   (parse, lower, stripLeading, zeroRuns, longestRun, compress, shorten, classify) are pure functions over arrays of
   strings, ready to move to models/ when another sim needs them. */
(function (root) {
  'use strict';

  /** "fe80:0000:…:f156" → its eight groups as written, or null unless it is a full address: exactly eight groups
      separated by single colons, each one to four hexadecimal digits. "::" is not accepted: the input is the full form. */
  function parse(str) {
    var groups = String(str).split(':');
    if (groups.length !== 8) return null;
    for (var i = 0; i < 8; i++) if (!/^[0-9a-fA-F]{1,4}$/.test(groups[i])) return null;
    return groups;
  }

  /** RFC 5952 §4.3: the letters a–f in lowercase. */
  function lower(groups) { return groups.map(function (g) { return g.toLowerCase(); }); }

  /** RFC 5952 §4.1: leading zeros out of every group; a group of zeros keeps one "0". */
  function stripLeading(groups) { return groups.map(function (g) { return g.replace(/^0+(?=.)/, ''); }); }

  /** Every run of consecutive zero groups, left to right: [{ start, len }]. A group is zero when its value is 0, so
      "0", "00" and "0000" all count (the runs do not depend on leading zeros being stripped first). */
  function zeroRuns(groups) {
    var runs = [], i = 0;
    while (i < groups.length) {
      if (parseInt(groups[i], 16) === 0) {
        var j = i;
        while (j < groups.length && parseInt(groups[j], 16) === 0) j++;
        runs.push({ start: i, len: j - i });
        i = j;
      } else i++;
    }
    return runs;
  }

  /** The run "::" replaces: the longest (RFC 5952 §4.2.1), the first of equally long ones (§4.2.3), and none if the
      longest is one group (§4.2.2). Returns { start, len } or null. */
  function longestRun(runs) {
    var best = null;
    for (var i = 0; i < runs.length; i++) if (!best || runs[i].len > best.len) best = runs[i]; // strict >: first wins
    return best && best.len >= 2 ? { start: best.start, len: best.len } : null;
  }

  /** What each run is: 'chosen', 'single' (one group, never shortened), 'shorter' (a longer run exists) or 'later'
      (as long as the chosen one, but after it). */
  function runVerdicts(runs, chosen) {
    return runs.map(function (r) {
      if (chosen && r.start === chosen.start) return 'chosen';
      if (r.len < 2) return 'single';
      if (chosen && r.len === chosen.len) return 'later';
      return 'shorter';
    });
  }

  /** The groups joined with ":", the chosen run replaced by "::" (at most once, RFC 4291 §2.2). */
  function compress(groups, run) {
    if (!run) return groups.join(':');
    var left = groups.slice(0, run.start).join(':');
    var right = groups.slice(run.start + run.len).join(':');
    return left + '::' + right;
  }

  /** The whole procedure on a full address: the one recommended text form (RFC 5952), or null for bad input. */
  function shorten(str) {
    var g = parse(str);
    if (!g) return null;
    var s = stripLeading(lower(g));
    return compress(s, longestRun(zeroRuns(s)));
  }

  /** The address type by its prefix, as chapter 10 names them: 'unspecified' (::), 'loopback' (::1), 'global'
      (2000::/3), 'linkLocal' (fe80::/10), 'uniqueLocal' (fc00::/7), 'multicast' (ff00::/8), or null for any other
      prefix. Prefixes count bits, not digits: 2000::/3 is every first group 2000–3fff. */
  function classify(groups) {
    var v = groups.map(function (g) { return parseInt(g, 16); });
    var headZero = v.slice(0, 7).every(function (n) { return n === 0; });
    if (headZero && v[7] === 0) return 'unspecified';
    if (headZero && v[7] === 1) return 'loopback';
    var g0 = v[0];
    if ((g0 >>> 13) === 1) return 'global';          // 001x xxxx xxxx xxxx
    if ((g0 >>> 6) === 0x3fa) return 'linkLocal';    // 1111 1110 10xx xxxx
    if ((g0 >>> 9) === 0x7e) return 'uniqueLocal';   // 1111 110x xxxx xxxx
    if ((g0 >>> 8) === 0xff) return 'multicast';     // 1111 1111 xxxx xxxx
    return null;
  }

  var PREFIX = { unspecified: '::', loopback: '::1', global: '2000::/3', linkLocal: 'fe80::/10',
    uniqueLocal: 'fc00::/7', multicast: 'ff00::/8' };

  /** Everything the page shows, worked out for one address. Every value is computed here, not on the page. */
  function analyze(p) {
    var full = parse(p.addr);
    var low = lower(full);
    var stripped = stripLeading(low);
    var runs = zeroRuns(stripped);
    var chosen = longestRun(runs);
    var type = classify(full);
    return {
      full: full,
      lower: low,
      lowerChanged: full.map(function (g, i) { return g !== low[i]; }),
      stripped: stripped,
      stripChanged: low.map(function (g, i) { return g !== stripped[i]; }),
      runs: runs,
      verdicts: runVerdicts(runs, chosen),
      chosen: chosen,
      ties: chosen ? runs.filter(function (r) { return r.len === chosen.len; }).length : 0,
      short: compress(stripped, chosen),
      kept: chosen ? 8 - chosen.len : 8,
      type: type,
      prefix: type ? PREFIX[type] : null,
      fullLength: full.join(':').length
    };
  }

  var PHASES = ['start', 'lowercase', 'leading', 'runs', 'compress', 'check'];

  var logic = {
    /** URM ch. 10, Primjer 1: fe80:0000:0000:0000:0204:61ff:fe9d:f156 → fe80::204:61ff:fe9d:f156 (link-local). */
    defaults: { addr: 'fe80:0000:0000:0000:0204:61ff:fe9d:f156' },

    /** Full addresses the page offers: the book's (ch. 10 text, Primjer 1 and 2 in full form, the fragment's
        exercises) and RFC 5952 §4.2.3's equal-runs example. */
    addrs: [
      'fe80:0000:0000:0000:0204:61ff:fe9d:f156',
      '2001:0db8:0000:0000:0000:ff00:0042:8329',
      '2001:0db8:0000:0001:0001:0001:0001:0001',
      '2001:0db8:0000:0000:0001:0000:0000:0001',
      '0000:0000:0000:0000:0000:0000:0000:0000',
      '0000:0000:0000:0000:0000:0000:0000:0001',
      'ABCD:EF01:2345:6789:ABCD:EF01:2345:6789',
      '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      'fe80:0000:0000:0000:0000:0000:0000:0001',
      'fc00:0000:0000:0000:0000:0000:0000:0001',
      'ff02:0000:0000:0000:0000:0000:0000:0001'
    ],

    phases: PHASES,
    steps: PHASES.length - 1,

    /** State at step 0: the full address. */
    initial: function (p) { return Object.assign({ phase: PHASES[0] }, analyze(p)); },

    /** Step n reveals phase n. Everything comes from the params, so picking another address recomputes at the same step. */
    step: function (s, n, p) { return Object.assign({ phase: PHASES[n] }, analyze(p)); },

    analyze: analyze,
    parse: parse,
    lower: lower,
    stripLeading: stripLeading,
    zeroRuns: zeroRuns,
    longestRun: longestRun,
    runVerdicts: runVerdicts,
    compress: compress,
    shorten: shorten,
    classify: classify
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
