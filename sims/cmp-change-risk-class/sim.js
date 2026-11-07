/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-change-risk-class: one quarter of changes (65 working days) run under three regimes side by side:
   no process, every change to the change advisory board, and risk classes (standard, normal, high risk to the board,
   emergency). The same changes and the same hidden defects in all three (common random numbers), so the lanes differ
   only by the process. Read: lead time, changes per deployment, the share of deployments that failed, and changes
   that went in without a record.
   Explorer: the state is a pure function of the params (compute). Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  /** Rule 1: the quarter and the changes. */
  var DAYS = 65;                                        // 13 weeks × 5 working days
  var KINDS = ['routine', 'medium', 'high', 'urgent'];
  var SHARE = [0.50, 0.80, 0.92, 1];                    // cumulative: routine 50 %, medium 30 %, high 12 %, urgent 8 %
  var DEFECT = { routine: 0.03, medium: 0.10, high: 0.25, urgent: 0.20 };   // chance a change carries a defect
  /** Rule 3: the chance a review finds the defect. */
  var CATCH = { none: 0, bypass: 0, standard: 0, emergency: 0, peer: 0.5, cab: 0.5, high: 0.75 };
  var FIX = 2;                                          // days to fix a defect found by a review or by a failure
  var REGIMES = ['none', 'cab', 'classes'];
  var BOARDS = [1, 2, 5, 10];                           // working days between board meetings
  var STANDARDS = ['none', 'routine', 'medium'];        // what counts as a standard change
  var RANGES = { load: [4, 16], seed: [1, 999999] };

  /** Presets, SPEC.md table; expected numbers there. Each carries every param. */
  function P(over) { return Object.assign({ load: 8, board: 5, standard: 'routine', seed: 1501 }, over); }
  var presets = [
    { id: 'weekly', params: P({}) },
    { id: 'fortnight', params: P({ board: 10 }) },
    { id: 'daily', params: P({ board: 1 }) },
    { id: 'wide-standard', params: P({ standard: 'medium' }) },
    { id: 'busy', params: P({ load: 16 }) }
  ];
  var defaults = Object.assign({}, presets[0].params);

  /** mulberry32, the same generator as Simdeck.rng in kit/kit.js: a function returning [0, 1). */
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

  /** Rule 1: the kind from a draw in [0, 1): the first kind whose cumulative share is above it (a draw equal to a
      boundary belongs to the next kind). */
  function kindOf(u) {
    var k = 0;
    while (u >= SHARE[k]) k++;
    return KINDS[k];
  }
  /** Rule 1: a change carries a defect when its draw is below the kind's chance (equal: no defect). */
  function defectOf(kind, u) { return u < DEFECT[kind]; }

  /** Rule 1: the quarter's changes: four draws each, in this order (ready day, kind, defect, review); sorted by ready
      day, ties in draw order, then numbered 1…n. A higher load keeps the first changes and adds more. */
  function changes(n, seed) {
    var r = rng(seed), raw = [];
    for (var i = 0; i < n; i++) {
      var ready = Math.floor(r() * DAYS), kind = kindOf(r());
      var uDef = r(), uRev = r();
      raw.push({ i: i, ready: ready, kind: kind, defect: defectOf(kind, uDef), uRev: uRev });
    }
    raw.sort(function (a, b) { return a.ready - b.ready || a.i - b.i; });
    return raw.map(function (c, j) { return { id: j + 1, ready: c.ready, kind: c.kind, defect: c.defect, uRev: c.uRev }; });
  }

  /** Rule 2: the board meets on day m when m mod interval = interval − 1 (weekly: days 4, 9, 14 …). */
  function isMeeting(day, I) { return day % I === I - 1; }
  /** The first meeting on or after `day`. */
  function meetingFrom(day, I) { return day + ((I - 1 - day % I) % I + I) % I; }
  /** Meetings held in the quarter. */
  function meetingsIn(I) { return Math.floor(DAYS / I); }

  /** Rule 4: the route a change takes when it is ready on `day`, per regime. */
  function routeOf(regime, kind, day, p) {
    if (regime === 'none') return 'none';
    if (regime === 'cab') {
      // an urgent change that cannot be approved by the next working day goes in at once, without a record
      if (kind === 'urgent' && meetingFrom(day + 1, p.board) > day + 1) return 'bypass';
      return 'cab';
    }
    if (kind === 'urgent') return 'emergency';
    if (kind === 'high') return 'high';
    if (kind === 'routine' && p.standard !== 'none') return 'standard';
    if (kind === 'medium' && p.standard === 'medium') return 'standard';
    return 'peer';
  }
  /** Rule 4: the day a change on `route`, ready on `day`, is reviewed and deployed. The board's agenda closes the day
      before the meeting. */
  function atOf(route, day, I) {
    if (route === 'peer') return day + 1;
    if (route === 'cab' || route === 'high') return meetingFrom(day + 1, I);
    return day;                                         // none, bypass, standard, emergency: the same day
  }

  /** Rules 3–6: run one regime over the quarter's changes. Returns the deployments in order and per change the day it
      finally went live. */
  function run(list, regime, p) {
    var items = list.map(function (c) {
      return { id: c.id, kind: c.kind, ready0: c.ready, ready: c.ready, defect: c.defect, uRev: c.uRev,
        route: null, at: null, done: null, unrec: false, fails: 0 };
    });
    var deploys = [], left = items.length, day;
    function deploy(group, route) {
      var failed = group.some(function (it) { return it.defect; });
      var unrec = route === 'none' || route === 'bypass';
      deploys.push({ day: day, ids: group.map(function (it) { return it.id; }), failed: failed, unrec: unrec, route: route });
      group.forEach(function (it) {
        if (unrec) it.unrec = true;
        if (!failed) { it.done = day; left--; return; }
        if (it.defect) { it.fails++; it.defect = false; it.ready = day + FIX; }   // found by the failure, fixed
        else it.ready = day + 1;                                                // rolled back with it, resubmitted
        it.at = null;
      });
    }
    /** Rule 3: a review finds the defect when the change's review draw is below the route's catch rate. */
    function review(it) {
      if (it.defect && it.uRev < CATCH[it.route]) {
        it.defect = false; it.ready = day + FIX; it.at = null;
        return false;
      }
      return true;
    }
    // every change goes live within a few meetings (rule 6); the cap only guards against a broken rule
    for (day = 0; left > 0 && day < 1000; day++) {
      items.forEach(function (it) {
        if (it.done === null && it.at === null && it.ready === day) {
          it.route = routeOf(regime, it.kind, day, p);
          it.at = atOf(it.route, day, p.board);
        }
      });
      var due = items.filter(function (it) { return it.done === null && it.at === day; });
      // one deployment per change, in id order; under the board everything approved at the meeting is one release
      var batch = [];
      due.forEach(function (it) {
        if (!review(it)) return;
        if (it.route === 'cab') batch.push(it);
        else deploy([it], it.route);
      });
      if (batch.length) deploy(batch, 'cab');
    }
    return { deploys: deploys, items: items };
  }

  /** a ÷ b in tenths, halves up, in integers (b > 0). */
  function tenths(a, b) { return Math.floor((20 * a + b) / (2 * b)); }
  /** a ÷ b as whole percent, halves up (b > 0). */
  function pct(a, b) { return Math.floor((200 * a + b) / (2 * b)); }

  /** Rule 7: the numbers each lane reads. */
  function metrics(r, I, regime) {
    var d = r.deploys, it = r.items;
    var shipped = 0, failed = 0, unrecFailed = 0, rolled = 0, lead = 0, maxLead = 0, unrec = 0;
    d.forEach(function (x) {
      shipped += x.ids.length;
      if (x.failed) { failed++; rolled += x.ids.length; if (x.unrec) unrecFailed++; }
    });
    it.forEach(function (x) {
      var l = x.done - x.ready0;
      lead += l; if (l > maxLead) maxLead = l;
      if (x.unrec) unrec++;
    });
    return {
      n: it.length,
      deploys: d.length,
      failed: failed,
      cfr: d.length ? pct(failed, d.length) : 0,
      batch10: d.length ? tenths(shipped, d.length) : 0,
      lead10: it.length ? tenths(lead, it.length) : 0,
      maxLead: maxLead,
      unrec: unrec,
      unrecFailed: unrecFailed,
      rolled: rolled,
      meetings: regime === 'none' ? 0 : meetingsIn(I),
      last: d.length ? d[d.length - 1].day : 0
    };
  }

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function num(v, dflt) {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return dflt;
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }

  /** Rule 8: params made safe (a URL may carry anything). */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var out = {};
    Object.keys(RANGES).forEach(function (k) {
      var x = num(q[k], defaults[k]);
      out[k] = clamp(Math.round(x), RANGES[k][0], RANGES[k][1]);
    });
    var b = num(q.board, NaN);
    out.board = BOARDS.indexOf(b) >= 0 ? b : defaults.board;
    out.standard = STANDARDS.indexOf(q.standard) >= 0 ? q.standard : defaults.standard;
    return out;
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var list = changes(13 * p.load, p.seed);
    var lanes = {}, horizon = DAYS;
    REGIMES.forEach(function (g) {
      var r = run(list, g, p);
      var m = metrics(r, p.board, g);
      if (m.last + 1 > horizon) horizon = m.last + 1;
      lanes[g] = {
        deploys: r.deploys.map(function (x) {
          return { day: x.day, size: x.ids.length, failed: x.failed, unrec: x.unrec };
        }),
        m: m
      };
    });
    var kinds = {};
    KINDS.forEach(function (k) { kinds[k] = 0; });
    list.forEach(function (c) { kinds[c.kind]++; });
    // rule 9: medium changes that went out as standard and failed (the "too broad" note)
    var stdMediumFailed = 0;
    if (p.standard === 'medium') {
      var r2 = run(list, 'classes', p);
      r2.items.forEach(function (x) { if (x.kind === 'medium' && x.fails) stdMediumFailed++; });
    }
    return {
      p: p,
      n: list.length,
      kinds: kinds,
      defects: list.filter(function (c) { return c.defect; }).length,
      horizon: horizon,
      lanes: lanes,
      stdMediumFailed: stdMediumFailed
    };
  }

  /** Rule 9: the caption: the main sentence and the notes, in this order (at most two: nothing bypasses a daily
      board, so nBypass and nDaily never come together). */
  function captionKey(s) {
    var notes = [];
    if (s.p.standard === 'medium') notes.push('nWide');
    else if (s.p.standard === 'none') notes.push('nNoStd');
    if (s.lanes.cab.m.unrec > 0) notes.push('nBypass');
    if (s.p.board === 1) notes.push('nDaily');
    return { key: 'capMain', notes: notes };
  }

  function nextSeed(seed) { return seed >= RANGES.seed[1] ? 1 : seed + 1; }

  var logic = {
    DAYS: DAYS, KINDS: KINDS, SHARE: SHARE, DEFECT: DEFECT, CATCH: CATCH, FIX: FIX, REGIMES: REGIMES, BOARDS: BOARDS,
    STANDARDS: STANDARDS, RANGES: RANGES,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    rng: rng,
    kindOf: kindOf,
    defectOf: defectOf,
    changes: changes,
    isMeeting: isMeeting,
    meetingFrom: meetingFrom,
    meetingsIn: meetingsIn,
    routeOf: routeOf,
    atOf: atOf,
    run: run,
    metrics: metrics,
    tenths: tenths,
    pct: pct,
    nextSeed: nextSeed,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
