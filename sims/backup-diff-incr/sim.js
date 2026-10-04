/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for backup-diff-incr: a disk of 8 blocks changes over a week (Sunday to Thursday) and is backed up every
   night: a full backup (level 0) on Sunday, then incremental (changed since the previous backup), differential
   (changed since the full) or full every night. Then a restore to a chosen day applies the sets it needs, oldest
   first, and compares the result with that day's disk. A lost set breaks an incremental chain from that day on;
   in differential mode only that day.
   Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. The week, the sets and the
   restore plan are pure functions over plain arrays and hold no words, so they can move to models/ unchanged
   (lnx-send-receive, retention-gfs). */
(function (root) {
  'use strict';

  var BLOCKS = 8;
  var DAYS = 5;                                     // 0 Sun, 1 Mon, 2 Tue, 3 Wed, 4 Thu
  var LETTERS = 'ABCDEFGH';

  /** The week's writes, block indices in order, per day. Sunday writes every block (the data the full backup finds);
      Thursday writes block 0 twice (rule 7). As sets: Mon {1}, Tue {3, 4}, Wed {1, 6}, Thu {0}. */
  var WEEK = [[0, 1, 2, 3, 4, 5, 6, 7], [1], [3, 4], [1, 6], [0, 0]];

  var MODES = ['incr', 'diff', 'full'];

  /** A block's content label: its letter, and from the second write on the number of rewrites (B, B1, B2). */
  function label(i, ver) { return LETTERS[i] + (ver > 0 ? String(ver) : ''); }

  function uniqSorted(list) {
    var out = [];
    list.forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); });
    return out.sort(function (a, b) { return a - b; });
  }

  /** Rule 7: apply one day's writes in order. Returns { disk, ver, written (sorted, each block once), twice }.
      A block written twice keeps its last content; the inputs are not changed. */
  function write(disk, ver, writes) {
    var d = disk.slice(), v = ver.slice(), count = {};
    writes.forEach(function (i) {
      v[i] += 1;
      d[i] = label(i, v[i]);
      count[i] = (count[i] || 0) + 1;
    });
    var written = uniqSorted(writes);
    return { disk: d, ver: v, written: written, twice: written.filter(function (i) { return count[i] > 1; }) };
  }

  /** Rules 1–3: the kind of the night's set and the blocks it stores. Day 0 is always full (level 0: the snapshot
      file does not exist yet). sinceLast / sinceFull are sorted block indices. */
  function kindOf(mode, day) { return day === 0 || mode === 'full' ? 'full' : mode; }
  function setBlocks(kind, disk, sinceLast, sinceFull) {
    var idx = kind === 'full' ? disk.map(function (x, i) { return i; }) : kind === 'incr' ? sinceLast : sinceFull;
    var blocks = {};
    idx.forEach(function (i) { blocks[i] = disk[i]; });
    return blocks;
  }

  /** Rule 4: the sets a restore to day `target` needs, oldest first. */
  function planFor(mode, target) {
    if (mode === 'full') return [target];
    if (mode === 'diff') return target > 0 ? [0, target] : [0];
    var out = [];
    for (var d = 0; d <= target; d++) out.push(d);
    return out;
  }

  /** Rule 6: the newest day ≤ target whose plan needs no lost set (-1: none). */
  function newestRestorable(mode, target, lost) {
    for (var d = target; d >= 0; d--) if (planFor(mode, d).indexOf(lost) < 0) return d;
    return -1;
  }

  /** Restore steps of one lane: one per set applied, then one to compare, or one to stop at a missing set. */
  function restoreLen(mode, target, lost) {
    var plan = planFor(mode, target), gap = plan.indexOf(lost);
    return (gap >= 0 ? gap : plan.length) + 1;
  }

  /** Params → clean values. */
  function norm(p) {
    var mode = MODES.indexOf(p.mode) >= 0 ? p.mode : 'incr';
    var target = [1, 2, 3, 4].indexOf(Number(p.restoreDay)) >= 0 ? Number(p.restoreDay) : 4;
    var lost = [1, 2, 3].indexOf(Number(p.lose)) >= 0 ? Number(p.lose) : null;
    return { modes: p.compare ? ['incr', 'diff'] : [mode], target: target, lost: lost };
  }

  /** 2 steps per day, 1 to choose the target, then the longest lane's restore. */
  function steps(p) {
    var o = norm(p);
    return 2 * DAYS + 1 + Math.max.apply(null, o.modes.map(function (m) { return restoreLen(m, o.target, o.lost); }));
  }

  function lane(mode) { return { mode: mode, sets: [], stored: 0, restore: null }; }

  var logic = {
    BLOCKS: BLOCKS,
    DAYS: DAYS,
    WEEK: WEEK,
    MODES: MODES,

    /** Parameter defaults. The page's controls describe how each one is shown. lose: 0 = none, 1–3 = Mon–Wed. */
    defaults: { mode: 'incr', compare: false, restoreDay: 4, lose: 0 },

    steps: steps,

    /** Step 0: an empty disk, no backups yet. */
    initial: function (p) {
      var o = norm(p), blank = [];
      for (var i = 0; i < BLOCKS; i++) blank.push('');
      return {
        phase: 'start', day: -1, disk: blank, ver: [-1, -1, -1, -1, -1, -1, -1, -1],
        written: [], twice: [], changed: { sinceLast: [], sinceFull: [] }, history: [],
        lanes: o.modes.map(lane), lost: null, target: o.target
      };
    },

    /** Step n from step n − 1 (SPEC.md "One step"). */
    step: function (s, n, p) {
      var o = norm(p);
      var out = JSON.parse(JSON.stringify(s));
      out.written = []; out.twice = [];
      if (n <= 2 * DAYS) {
        var day = Math.floor((n - 1) / 2);
        out.day = day;
        if ((n - 1) % 2 === 0) {                      // (a) the day's writes
          out.phase = 'write';
          var w = write(s.disk, s.ver, WEEK[day]);
          out.disk = w.disk; out.ver = w.ver; out.written = w.written; out.twice = w.twice;
          out.changed.sinceLast = uniqSorted(s.changed.sinceLast.concat(w.written));
          out.changed.sinceFull = day === 0 ? [] : uniqSorted(s.changed.sinceFull.concat(w.written));
          return out;
        }
        out.phase = 'backup';                         // (b) the night's backup, one set per lane
        out.lanes.forEach(function (l) {
          var kind = kindOf(l.mode, day);
          var blocks = setBlocks(kind, s.disk, s.changed.sinceLast, s.changed.sinceFull);
          l.sets.push({ day: day, kind: kind, blocks: blocks });
          l.stored += Object.keys(blocks).length;
        });
        out.history.push(s.disk.slice());
        out.changed.sinceLast = [];
        if (day === 0) out.changed.sinceFull = [];
        return out;
      }
      if (n === 2 * DAYS + 1) {                       // (c) choose the target; a lost set shows now
        out.phase = 'target';
        out.target = o.target;
        out.lost = o.lost;
        out.lanes.forEach(function (l) {
          var plan = planFor(l.mode, o.target);
          var blank = [], from = [];
          for (var i = 0; i < BLOCKS; i++) { blank.push(null); from.push(null); }
          l.restore = { target: o.target, plan: plan, applied: 0, read: 0, result: blank, from: from, now: [],
            done: false, ok: null, end: null, reached: null, wrong: [], newest: newestRestorable(l.mode, o.target, o.lost) };
        });
        return out;
      }
      out.phase = 'restore';                          // (d) one set per lane per step, (e) compare or stop
      out.lanes.forEach(function (l) {
        var r = l.restore;
        r.now = [];
        r.step = null;
        if (r.done) return;                           // this lane has finished: it waits for the other one
        if (r.applied < r.plan.length) {
          var d = r.plan[r.applied];
          if (d === s.lost) {                         // rule 6: stop at the gap, say what was really restored
            r.done = true; r.ok = false; r.end = 'gap'; r.step = 'gap';
            r.reached = r.applied ? r.plan[r.applied - 1] : null;
            r.wrong = diff(r.result, s.history[r.target]);
            return;
          }
          var set = l.sets[d], idx = Object.keys(set.blocks).map(Number).sort(function (a, b) { return a - b; });
          idx.forEach(function (i) { r.result[i] = set.blocks[i]; r.from[i] = d; });   // rule 5: newest wins
          r.now = idx; r.read += idx.length; r.applied += 1; r.step = 'apply';
          return;
        }
        r.done = true; r.end = 'compare'; r.step = 'compare';
        r.wrong = diff(r.result, s.history[r.target]);
        r.ok = r.wrong.length === 0;
        r.reached = r.ok ? r.target : null;
      });
      return out;
    },

    label: label,
    write: write,
    kindOf: kindOf,
    setBlocks: setBlocks,
    planFor: planFor,
    newestRestorable: newestRestorable,
    restoreLen: restoreLen,
    norm: norm
  };

  /** Indices where two disks differ (an empty or missing block counts as different). */
  function diff(a, b) {
    var out = [];
    for (var i = 0; i < BLOCKS; i++) if (a[i] !== b[i]) out.push(i);
    return out;
  }
  logic.diff = diff;

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
