/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ntp-sync: one NTP client/server exchange, four timestamps, the offset and delay computed from them, and
   the clock corrected by a step or a slew; a second mode reads a source list and works out the stratum.
   All times are integer microseconds (µs), so every number the page shows is exact (the one exception is the book's
   offset in chain mode, 37.158 µs). The server's clock is right
   (stratum 1); the client's clock reads trueOffset behind it, and T1 = 0 on the client's clock. Rules and numbers:
   SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic
   script (window.SimLogic); node tests require() it. No strings: the page words everything from codes. */
(function (root) {
  'use strict';

  var MS = 1000;                       // µs per ms
  var S = 1000000;                     // µs per s
  /** Rule 6: the book's configuration, "step if more than 1 s, only in the first 3 updates" (UL ch18). */
  var STEP_RULE = { threshold: 1 * S, limit: 3 };
  /** Slew rate: at most 500 ppm, i.e. 0.5 ms per second (RFC 5905's frequency limit; check). */
  var SLEW_PPM = 500;
  /** The next exchange starts this long after the correction (a typical poll interval; polling is out of scope). */
  var NEXT_AFTER = 64 * S;
  var UNSYNC = 16;                     // rule 4: stratum 16 = unsynchronised

  // ── the exchange (rules 1–3) ──

  /** The four timestamps of one exchange. T1 and T4 are the client's clock, T2 and T3 the server's.
      t1: the client's reading when it sends; offset: server clock − client clock (true); dOut, dBack: one-way
      delays; proc: the server's time between receiving and answering. */
  function timestamps(t1, offset, dOut, dBack, proc) {
    var T2 = t1 + offset + dOut;
    return { T1: t1, T2: T2, T3: T2 + proc, T4: t1 + dOut + proc + dBack };
  }
  /** Rule 1: θ = ((T2 − T1) + (T3 − T4)) / 2 (RFC 5905 §8). */
  function offsetOf(t) { return ((t.T2 - t.T1) + (t.T3 - t.T4)) / 2; }
  /** Rule 1: δ = (T4 − T1) − (T3 − T2) (RFC 5905 §8). Rule 3: the server's time T3 − T2 is taken out. */
  function delayOf(t) { return (t.T4 - t.T1) - (t.T3 - t.T2); }
  /** Rule 2: the estimate is off by (dOut − dBack) / 2, and never by more than δ / 2. */
  function errorOf(dOut, dBack) { return (dOut - dBack) / 2; }
  function boundOf(delay) { return delay / 2; }

  // ── the correction (rule 6, tie-break rule 7) ──

  /** Step when the adjustment is larger than the threshold and this is one of the first `limit` updates; otherwise
      slew. Rule 7: exactly the threshold is not larger, so it is slewed. Update numbers count from 1. */
  function decide(theta, update, rule) {
    var r = rule || STEP_RULE;
    return Math.abs(theta) > r.threshold && update <= r.limit ? 'step' : 'slew';
  }
  /** How much of theta a slew has applied after `us` microseconds (same sign as theta). */
  function slewed(theta, us) {
    var done = Math.min(Math.abs(theta), us * SLEW_PPM / 1e6);
    return theta < 0 ? -done : done;
  }
  /** How long a slew of theta takes, in µs. */
  function slewTime(theta) { return Math.abs(theta) * 1e6 / SLEW_PPM; }
  /** The client's clock reading after the correction, `us` after it started, from the reading `at` when it started.
      A step jumps by theta at once (backwards when theta < 0); a slew runs the clock faster or slower, so the
      reading only grows (rate 1 ± 500 ppm). */
  function clockAfter(at, theta, mode, us) {
    return at + us + (mode === 'step' ? theta : slewed(theta, us));
  }

  // ── stratum and sources (rules 4, 5) ──

  /** Rule 4: one hop further than the source; 16 when the source is unsynchronised (or there is none). */
  function stratumAfter(source) {
    if (source == null || source >= UNSYNC - 1) return UNSYNC;
    return source + 1;
  }
  /** Rule 5: a source at stratum 16 is not usable. */
  function usable(src) { return src.stratum < UNSYNC; }
  /** Rule 5: among the usable sources, the lowest stratum; then the smallest error bound; then the name (a total
      order). The full selection algorithm is out of scope (SPEC.md). Returns the index, or -1 for none. */
  function select(sources) {
    var best = -1;
    sources.forEach(function (s, i) {
      if (!usable(s)) return;
      if (best < 0) { best = i; return; }
      var b = sources[best];
      if (s.stratum < b.stratum || (s.stratum === b.stratum && (s.bound < b.bound || (s.bound === b.bound && s.name < b.name)))) best = i;
    });
    return best;
  }

  /** The source list as UL ch18 prints it (chronyc sources; names, strata and the ± error bound in µs), and the
      client's offset from the selected source (tracking: "System time 0.000037158 seconds slow"). */
  var BOOK_SOURCES = [
    { name: '232.184.183.46.static.ed…', stratum: 2, bound: 8800 },
    { name: 'gu.irb.hr', stratum: 3, bound: 34000 },
    { name: '161.53.78.72', stratum: 1, bound: 4699 },
    { name: '161.53.78.71', stratum: 1, bound: 2581 }
  ];
  var BOOK_OFFSET = 37.158;            // µs: the client is slow, so server − client > 0
  /** The `down` param: which sources report stratum 16 (made up; the book's list has none). */
  var DOWN = {
    none: [],
    one: ['161.53.78.71'],
    both: ['161.53.78.71', '161.53.78.72'],
    all: ['232.184.183.46.static.ed…', 'gu.irb.hr', '161.53.78.71', '161.53.78.72']
  };
  function sourcesOf(down) {
    var off = DOWN[down] || [];
    return BOOK_SOURCES.map(function (s) {
      return { name: s.name, stratum: off.indexOf(s.name) >= 0 ? UNSYNC : s.stratum, bound: s.bound, usable: null, selected: false };
    });
  }

  // ── the run ──

  function copy(s) { return JSON.parse(JSON.stringify(s)); }
  function us(p) {
    return { offset: Math.round(p.trueOffset * MS), dOut: Math.round(p.dOut * MS), dBack: Math.round(p.dBack * MS), proc: Math.round(p.proc * MS) };
  }

  /** One whole exchange and what it gives: the timestamps, θ, δ, the error and its bound, the decision. */
  function exchange(t1, offset, v, update) {
    var t = timestamps(t1, offset, v.dOut, v.dBack, v.proc);
    var theta = offsetOf(t), delay = delayOf(t);
    return { t: t, offset: theta, delay: delay, error: theta - offset, bound: boundOf(delay), trueOffset: offset, update: update,
      mode: decide(theta, update) };
  }

  /** The true instants (µs from the first T1) of the four timestamps. */
  function instants(v) { return { T1: 0, T2: v.dOut, T3: v.dOut + v.proc, T4: v.dOut + v.proc + v.dBack }; }

  /** The next exchange: NEXT_AFTER after the correction, with the clock as the correction left it. */
  function nextExchange(first, v) {
    var tN = first.t.T4 + NEXT_AFTER;          // client reading at the start of the next exchange, before the correction
    var applied = first.mode === 'step' ? first.offset : slewed(first.offset, NEXT_AFTER);
    var x = exchange(tN + applied, first.trueOffset - applied, v, first.update + 1);
    x.applied = applied;
    return x;
  }

  var ORDER = ['T1', 'T2', 'T3', 'T4'];

  var logic = {
    MS: MS, S: S, STEP_RULE: STEP_RULE, SLEW_PPM: SLEW_PPM, NEXT_AFTER: NEXT_AFTER, UNSYNC: UNSYNC, ORDER: ORDER,
    BOOK_SOURCES: BOOK_SOURCES, BOOK_OFFSET: BOOK_OFFSET, DOWN: DOWN,
    timestamps: timestamps, offsetOf: offsetOf, delayOf: delayOf, errorOf: errorOf, boundOf: boundOf,
    decide: decide, slewed: slewed, slewTime: slewTime, clockAfter: clockAfter,
    stratumAfter: stratumAfter, usable: usable, select: select, sourcesOf: sourcesOf,
    exchange: exchange, nextExchange: nextExchange, instants: instants,

    /** Params: offsets and delays in ms (the page's sliders), updateNo counts from 1. */
    defaults: { mode: 'exchange', trueOffset: 100, dOut: 10, dBack: 10, proc: 1, updateNo: 1, next: false, down: 'none' },

    steps: function (p) { return p.mode === 'chain' ? 4 : p.next ? 7 : 6; },

    initial: function (p) {
      if (p.mode === 'chain') {
        return { n: 0, mode: 'chain', phase: 'start', ev: { kind: 'start' }, done: false,
          sources: sourcesOf(p.down), selected: -1, stratum: { client: UNSYNC }, offset: null, clock: { mode: null } };
      }
      var v = us(p), at = instants(v), x = exchange(0, v.offset, v, p.updateNo);
      return {
        n: 0, mode: 'exchange', phase: 'start', ev: { kind: 'start' }, done: false,
        trueOffset: v.offset, dOut: v.dOut, dBack: v.dBack, proc: v.proc,
        t: { T1: null, T2: null, T3: null, T4: null }, taken: [], offset: null, delay: null, error: null, bound: null,
        // the two clocks at the instant of the current event (true time `now`, µs from the first T1)
        now: 0, clock: { value: 0, server: v.offset, mode: null, from: null, to: null, backwards: false, took: null },
        updates: p.updateNo, stepRule: copy(STEP_RULE),
        stratum: { server: 1, client: p.updateNo === 1 ? UNSYNC : stratumAfter(1), was: p.updateNo === 1 ? UNSYNC : stratumAfter(1) },
        planned: x, at: at, next: null
      };
    },

    step: function (prev, n, p) {
      var s = copy(prev);
      s.n = n;
      s.done = n === logic.steps(p);
      if (s.mode === 'chain') {
        if (n === 1) {
          s.phase = 'replies';
          s.ev = { kind: 'replies' };
        } else if (n === 2) {
          s.phase = 'usable';
          s.sources.forEach(function (x) { x.usable = usable(x); });
          s.ev = { kind: 'usable', dropped: s.sources.filter(function (x) { return !x.usable; }).length };
        } else if (n === 3) {
          s.phase = 'select';
          s.selected = select(s.sources);
          if (s.selected >= 0) s.sources[s.selected].selected = true;
          s.ev = { kind: 'select', none: s.selected < 0 };
        } else if (n === 4) {
          s.phase = 'stratum';
          var src = s.selected >= 0 ? s.sources[s.selected] : null;
          s.stratum.client = stratumAfter(src ? src.stratum : null);
          // the book's tracking line belongs to the book's selection only
          s.offset = src && src.name === '161.53.78.71' && p.down === 'none' ? BOOK_OFFSET : null;
          s.clock.mode = src ? decide(s.offset || 0, 4) : null;
          s.ev = { kind: 'stratum', none: !src };
        }
        return s;
      }

      var x = s.planned;
      if (n <= 4) {
        // (1)–(4): one timestamp per step, each on the clock of the side that takes it
        var k = ORDER[n - 1];
        s.phase = k;
        s.t[k] = x.t[k];
        s.taken.push(k);
        s.now = s.at[k];
        s.clock.value = s.now;
        s.clock.server = s.now + s.trueOffset;
        s.ev = { kind: 'stamp', which: k };
      } else if (n === 5) {
        // (5): offset and delay from the four timestamps
        s.phase = 'compute';
        s.offset = x.offset; s.delay = x.delay; s.error = x.error; s.bound = x.bound;
        s.ev = { kind: 'compute', symmetric: s.dOut === s.dBack };
      } else if (n === 6) {
        // (6): the correction; the client now follows a stratum-1 source
        s.phase = 'correct';
        var before = s.clock.value;
        s.clock.mode = x.mode;
        s.clock.from = before;
        s.clock.to = x.mode === 'step' ? before + x.offset : before;
        s.clock.value = s.clock.to;
        s.clock.backwards = x.mode === 'step' && x.offset < 0;
        s.clock.took = x.mode === 'slew' ? slewTime(x.offset) : 0;
        s.stratum.was = s.stratum.client;
        s.stratum.client = stratumAfter(s.stratum.server);
        s.ev = { kind: 'correct', mode: x.mode, update: s.updates, big: Math.abs(x.offset) > STEP_RULE.threshold,
          exact: Math.abs(x.offset) === STEP_RULE.threshold, late: s.updates > STEP_RULE.limit, backwards: s.clock.backwards,
          joined: s.stratum.was !== s.stratum.client };
      } else if (n === 7) {
        // (7): the next exchange, all at once
        var v = { dOut: s.dOut, dBack: s.dBack, proc: s.proc };
        var nx = nextExchange(x, v);
        s.phase = 'next';
        s.next = nx;
        s.updates = nx.update;
        s.now = s.at.T4 + NEXT_AFTER + s.at.T4;    // true time of the next T4: correction at T4, then 64 s, then one exchange
        s.clock.value = nx.t.T4;
        s.clock.server = nx.t.T4 + nx.trueOffset;
        s.ev = { kind: 'next', mode: x.mode, applied: nx.applied, offset: nx.offset, decision: nx.mode, update: nx.update,
          finished: Math.abs(nx.applied) >= Math.abs(x.offset) };
      }
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
