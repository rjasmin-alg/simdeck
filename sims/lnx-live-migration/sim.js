/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-live-migration: pre-copy rounds converge only if dirtying is slower than copying.
   An explorer: the state is a pure function of the params (SPEC.md); nothing accumulates over time.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. migrate, throttleAt and pickCells hold no
   strings and no page code: promotable to models/ unchanged.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var THROTTLE_INITIAL = 20;    // % of vCPU time taken away in the first throttled round (rule 6)
  var THROTTLE_INCREMENT = 10;  // % more in every later round (rule 6)
  var THROTTLE_MAX = 99;        // the throttle never takes the whole CPU
  var THROTTLE_FROM = 2;        // the first throttled round (rule 6)
  var GRID_COLS = 32;           // the page grid: GRID_ROWS × GRID_COLS cells, each M / CELLS MiB
  var GRID_ROWS = 4;
  var CELLS = GRID_COLS * GRID_ROWS;
  var EPS = 1e-9;

  var defaults = {
    memGiB: 4, bwMiBs: 1000, dirtyMiBs: 100, wssMiB: 1024, downtimeMs: 300, maxRounds: 30, autoConverge: false,
    round: 1
  };

  /** Rule 6: the throttle in round i, in % of vCPU time (0 when auto-converge is off or before round 2). */
  function throttleAt(i, on) {
    if (!on || i < THROTTLE_FROM) return 0;
    return Math.min(THROTTLE_MAX, THROTTLE_INITIAL + THROTTLE_INCREMENT * (i - THROTTLE_FROM));
  }

  /** Rule 3 and 7: the remaining dirty memory fits the downtime limit (≤: exactly at the limit stops). Compared as
      remaining · 1000 ≤ limit_ms · B so that whole numbers compare exactly. */
  function fits(remainingMiB, bwMiBs, downtimeMs) {
    return remainingMiB * 1000 <= downtimeMs * bwMiBs + EPS;
  }

  /** Rules 1–7. Plain numbers in, the whole migration out:
      { memMiB, wssMiB, limitMiB, rounds: [{ i, sentMiB, seconds, dirtiedMiB, throttlePct }], outcome
        ('converged' | 'forced'), remainingMiB (copied during the pause), downtimeMs, totalS, throttlePct (the last
        round's), ratio (D / B, unthrottled) }. */
  function migrate(p) {
    var M = p.memGiB * 1024;
    var B = p.bwMiBs;
    var D = p.dirtyMiBs;
    var W = Math.min(p.wssMiB, M);               // the working set is clamped to the memory
    var rounds = [];
    var toSend = M;                               // rule 1: round 0 sends all memory
    var outcome;
    for (var i = 0; ; i++) {
      if (i > 0 && fits(toSend, B, p.downtimeMs)) { outcome = 'converged'; break; }   // rule 3; round 0 never stops (7)
      if (i >= p.maxRounds) { outcome = 'forced'; break; }                           // rule 5
      var thr = throttleAt(i, p.autoConverge);                                        // rule 6
      var seconds = toSend / B;
      var dirtied = Math.min(D * (100 - thr) / 100 * seconds, W);                     // rule 2
      rounds.push({ i: i, sentMiB: toSend, seconds: seconds, dirtiedMiB: dirtied, throttlePct: thr });
      toSend = dirtied;                                                               // rule 2: resend what is dirty
    }
    var pauseS = toSend / B;
    var liveS = rounds.reduce(function (s, r) { return s + r.seconds; }, 0);
    return {
      memMiB: M,
      wssMiB: W,
      limitMiB: p.downtimeMs * B / 1000,
      rounds: rounds,
      outcome: outcome,
      remainingMiB: toSend,
      downtimeMs: pauseS * 1000,
      totalS: liveS + pauseS,
      throttlePct: rounds[rounds.length - 1].throttlePct,
      ratio: D / B
    };
  }

  /** count distinct cells out of the first n, in an order that looks scattered but is fixed by seed (mulberry32, as
      Simdeck.rng; a Fisher–Yates shuffle). Sorted ascending. */
  function pickCells(n, count, seed) {
    var a = 0x9e3779b9 ^ (seed >>> 0);
    function r() {
      a = (a + 0x6d2b79f5) | 0;
      var x = Math.imul(a ^ (a >>> 15), 1 | a);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    }
    var idx = [];
    for (var i = 0; i < n; i++) idx.push(i);
    for (var j = n - 1; j > 0; j--) {
      var k = Math.floor(r() * (j + 1));
      var tmp = idx[j]; idx[j] = idx[k]; idx[k] = tmp;
    }
    return idx.slice(0, Math.min(n, count)).sort(function (x, y) { return x - y; });
  }

  /** Cells needed for mib MiB, rounded up (a page with any dirty byte is a dirty page), at most max. */
  function cellsFor(mib, cellMiB, max) {
    return Math.min(max, Math.ceil(mib / cellMiB - EPS));
  }

  /** The page grid at position view: 0…rounds − 1 is the start of that round (what it is about to send), rounds is the
      pause. Kinds: 'todo' not yet copied, 'clean' copied and clean, 'dirty' dirtied after its copy (this round resends
      it), 'paused' copied during the pause. The working set is the first wsCells cells. */
  function grid(m, view) {
    var cellMiB = m.memMiB / CELLS;
    var wsCells = Math.max(1, cellsFor(m.wssMiB, cellMiB, CELLS));
    var n = m.rounds.length;
    var cells = [];
    var i;
    if (view === 0) {
      for (i = 0; i < CELLS; i++) cells.push('todo');
    } else {
      var mib = view < n ? m.rounds[view - 1].dirtiedMiB : m.remainingMiB;
      var kind = view < n ? 'dirty' : 'paused';
      var picked = pickCells(wsCells, cellsFor(mib, cellMiB, wsCells), view);
      for (i = 0; i < CELLS; i++) cells.push('clean');
      picked.forEach(function (c) { cells[c] = kind; });
    }
    return { cols: GRID_COLS, rows: GRID_ROWS, cellMiB: cellMiB, wsCells: wsCells, cells: cells };
  }

  /** The state the page draws: the migration, the position the round slider shows and the grid at it. */
  function initial(p) {
    var m = migrate(p);
    var view = Math.max(0, Math.min(m.rounds.length, Math.round(p.round)));
    m.view = view;
    m.paused = view === m.rounds.length;
    m.grid = grid(m, view);
    return m;
  }

  /** The number of positions after 0 the round slider has: one per live round after round 0, then the pause. */
  function lastView(p) { return migrate(p).rounds.length; }

  /** The result-card values that differ between two states (the page marks them as changed). */
  function changed(a, b) {
    if (!a || !b) return [];
    var out = [];
    if (a.outcome !== b.outcome) out.push('outcome');
    if (a.rounds.length !== b.rounds.length) out.push('rounds');
    if (Math.abs(a.totalS - b.totalS) > 0.005) out.push('total');
    if (Math.abs(a.downtimeMs - b.downtimeMs) > 0.5) out.push('downtime');
    if (Math.abs(a.ratio - b.ratio) > 0.005) out.push('ratio');
    if (a.throttlePct !== b.throttlePct) out.push('throttle');
    return out;
  }

  /** Which caption explains the outcome, and the numbers it needs (the page words and formats them). */
  function captionKey(s) {
    var n = s.rounds.length;
    var base = { n: n, rem: s.remainingMiB, dt: s.downtimeMs, total: s.totalS, ratio: s.ratio, thr: s.throttlePct, w: s.wssMiB };
    var key;
    if (s.rounds[0].dirtiedMiB <= EPS) key = 'cIdle';
    else if (s.outcome === 'converged') key = s.throttlePct > 0 ? 'cThrottled' : s.ratio < 1 ? 'cConverged' : 'cSmallWss';
    else {
      // forced: did any round after round 0 send less than the working set? (rule 4: with D ≥ B, even throttled, none did)
      var flat = n > 1 && s.rounds.slice(1).every(function (r) { return r.sentMiB >= s.wssMiB - EPS; });
      key = flat ? 'cForcedWss' : 'cForcedSlow';
    }
    base.key = key;
    return base;
  }

  var presets = [
    { id: '10gbe-converges', params: { bwMiBs: 1000, dirtyMiBs: 100, round: 1 } },
    { id: '1gbe-busy', params: { bwMiBs: 110, dirtyMiBs: 100, round: 30 } },
    { id: 'dirty-faster', params: { bwMiBs: 110, dirtyMiBs: 150, round: 1 } },
    { id: 'auto-converge', params: { bwMiBs: 110, dirtyMiBs: 150, autoConverge: true, round: 5 } },
    { id: '1gbe-quiet', params: { bwMiBs: 110, dirtyMiBs: 50, round: 2 } }
  ];

  var logic = {
    defaults: defaults,
    initial: initial,
    presets: presets,
    migrate: migrate,
    throttleAt: throttleAt,
    fits: fits,
    pickCells: pickCells,
    grid: grid,
    lastView: lastView,
    changed: changed,
    captionKey: captionKey,
    CELLS: CELLS
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
