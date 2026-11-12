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

  // ── lnx-send-receive: replication from snapshot pairs (opt-in: param repl; SPEC.md "Send and receive") ──
  //
  // Two machines: the source filesystem with its read-only snapshots (one per day, Mon–Wed), and the target with the
  // snapshots it has received. A send is full (every block of one snapshot) or incremental from a parent (only the
  // blocks that differ between parent and child). The receive applies the stream: the target then holds a complete
  // snapshot. An incremental receive needs the parent on the target, and (ZFS) a target unchanged since its newest
  // snapshot unless forced to roll back.

  /** The source's writes per day, Mon–Wed: Monday writes the data (blocks A–H), Tuesday 3 and 4, Wednesday 6. */
  var SEND_WEEK = [[0, 1, 2, 3, 4, 5, 6, 7], [3, 4], [6]];
  /** The block a file written on the target lands in (target-touched). */
  var TOUCH = 5;

  /** The four scripted cases, one op per step. send: take the day's snapshot (after its writes) and send it;
      parent 'common' = the newest snapshot both sides hold (rule 5), a number = the parent named, null = full. */
  var REPL = {
    chain: [{ op: 'send', day: 0, parent: 'common' }, { op: 'send', day: 1, parent: 'common' },
      { op: 'send', day: 2, parent: 'common' }, { op: 'restore', day: 2 }],
    missing: [{ op: 'send', day: 0, parent: 'common' }, { op: 'del', side: 'tgt', day: 0 },
      { op: 'send', day: 1, parent: 0 }, { op: 'resend', day: 1, parent: 'common' }],
    common: [{ op: 'send', day: 0, parent: 'common' }, { op: 'send', day: 1, parent: 'common' },
      { op: 'del', side: 'src', day: 0 }, { op: 'send', day: 2, parent: 'common' }],
    touched: [{ op: 'send', day: 0, parent: 'common' }, { op: 'touch', i: TOUCH }, { op: 'send', day: 1, parent: 'common' }]
  };
  var REPL_IDS = ['chain', 'missing', 'common', 'touched'];

  function normRepl(p) {
    return { id: REPL_IDS.indexOf(p.repl) >= 0 ? p.repl : null, force: p.force === true || p.force === 'true' };
  }

  function snapOf(side, day) {
    for (var k = 0; k < side.snaps.length; k++) if (side.snaps[k].day === day) return side.snaps[k];
    return null;
  }
  function days(side) { return side.snaps.map(function (x) { return x.day; }); }

  /** Rule 5 (tie-break): the newest snapshot both sides still hold, or null. */
  function commonParent(src, tgt) {
    var both = days(src).filter(function (d) { return snapOf(tgt, d); });
    return both.length ? Math.max.apply(null, both) : null;
  }
  /** The snapshots both sides hold, oldest first. */
  function commonSnaps(src, tgt) {
    return days(src).filter(function (d) { return snapOf(tgt, d); }).sort(function (a, b) { return a - b; });
  }

  /** Rules 1–2: the stream of a send. `what` must be a read-only snapshot on the source ('live' is refused: rule 2).
      parent null: full, every block; otherwise only the blocks where parent and child differ. */
  function makeStream(src, day, parent) {
    var child = snapOf(src, day);
    if (!child || !child.ro) return { day: day, parent: parent, kind: null, carried: [], blocks: {}, refused: 'not-snapshot' };
    var base = parent === null ? null : snapOf(src, parent);
    if (parent !== null && !base) return { day: day, parent: parent, kind: 'incr', carried: [], blocks: {}, refused: 'no-source-parent' };
    var carried = [];
    for (var i = 0; i < BLOCKS; i++) if (!base || base.blocks[i] !== child.blocks[i]) carried.push(i);
    var blocks = {};
    carried.forEach(function (i) { blocks[i] = child.blocks[i]; });
    return { day: day, parent: parent, kind: parent === null ? 'full' : 'incr', carried: carried, blocks: blocks, refused: null };
  }

  /** Rule 3: whether the target accepts a stream, and why not. A full stream is received as a new filesystem
      (it needs no parent); an incremental one needs the parent on the target, and a target not written to since its
      newest snapshot unless force rolls it back. */
  function receiveCheck(tgt, stream, force) {
    if (stream.refused) return stream.refused;
    if (stream.kind === 'full') return null;
    if (!snapOf(tgt, stream.parent)) return 'no-parent';
    if (tgt.modified && !force) return 'modified';
    return null;
  }

  /** Rule 4: apply an accepted stream. The new snapshot is the parent's blocks on the target with the carried blocks
      on top, so it is complete; the target's filesystem becomes it. Returns the new target and the blocks a forced
      rollback threw away. */
  function receive(tgt, stream) {
    var out = JSON.parse(JSON.stringify(tgt)), lostWrites = [];
    if (stream.kind === 'incr' && out.modified) {                        // receive -F: roll back to the newest snapshot first
      var newest = out.snaps[out.snaps.length - 1].blocks;
      for (var i = 0; i < BLOCKS; i++) if (out.live[i] !== newest[i]) lostWrites.push(i);
    }
    var base = stream.kind === 'full' ? [] : snapOf(tgt, stream.parent).blocks.slice();
    var blocks = [];
    for (var j = 0; j < BLOCKS; j++) blocks.push(j in stream.blocks ? stream.blocks[j] : base[j]);
    out.snaps.push({ day: stream.day, ro: true, blocks: blocks });
    out.snaps.sort(function (a, b) { return a.day - b.day; });
    out.live = blocks.slice();
    out.modified = false;
    return { tgt: out, lostWrites: lostWrites };
  }

  /** Blocks stored on one side: distinct (block, content) pairs over its snapshots and its filesystem. Snapshots
      share the blocks they have in common, so a received chain costs only the blocks its streams carried. */
  function storedOn(side) {
    var seen = {}, n = 0;
    side.snaps.map(function (x) { return x.blocks; }).concat(side.live ? [side.live] : []).forEach(function (b) {
      b.forEach(function (c, i) { if (c && !seen[i + ':' + c]) { seen[i + ':' + c] = true; n++; } });
    });
    return n;
  }
  /** How many of a side's snapshots hold block i with content c (the reference count the page shows). */
  function refsOf(side, i, c) {
    return side.snaps.filter(function (x) { return x.blocks[i] === c; }).length;
  }

  function replInitial(o) {
    var blank = [], ver = [];
    for (var i = 0; i < BLOCKS; i++) { blank.push(''); ver.push(-1); }
    var w = write(blank, ver, SEND_WEEK[0]);           // Monday's data is on the source from the start
    return {
      repl: o.id, phase: 'start', day: 0, op: null,
      src: { live: w.disk, ver: w.ver, snaps: [], gone: [] },
      tgt: { live: null, snaps: [], modified: false, touched: [], gone: [] },
      written: [], stream: null, check: null, lostWrites: [], deleted: null, restore: null, history: []
    };
  }

  function replStep(s, n, o) {
    var op = REPL[o.id][n - 1];
    var out = JSON.parse(JSON.stringify(s));
    out.op = op.op; out.phase = op.op; out.written = []; out.stream = null; out.check = null; out.lostWrites = [];
    out.deleted = null; out.restore = null;
    if (op.op === 'send' || op.op === 'resend') {
      out.day = op.day;
      if (op.op === 'send') {
        if (op.day > 0) {                              // the day's writes, then its read-only snapshot
          var w = write(s.src.live, s.src.ver, SEND_WEEK[op.day]);
          out.src.live = w.disk; out.src.ver = w.ver; out.written = w.written;
        }
        out.src.snaps.push({ day: op.day, ro: true, blocks: out.src.live.slice() });
        out.history.push(out.src.live.slice());
      }
      var parent = op.parent === 'common' ? commonParent(out.src, out.tgt) : op.parent;
      if (parent === op.day) parent = null;
      var stream = makeStream(out.src, op.day, parent);
      out.stream = stream;
      out.check = receiveCheck(out.tgt, stream, o.force);
      if (out.check === null) {
        var r = receive(out.tgt, stream);
        out.tgt = r.tgt; out.lostWrites = r.lostWrites;
        if (r.lostWrites.length) out.tgt.touched = [];
      }
      return out;
    }
    if (op.op === 'del') {                             // rule 4: deleting a snapshot leaves the others whole
      var side = out[op.side];
      side.snaps = side.snaps.filter(function (x) { return x.day !== op.day; });
      side.gone.push(op.day);
      out.deleted = { side: op.side, day: op.day };
      return out;
    }
    if (op.op === 'touch') {                           // a file written on the target after its newest snapshot
      out.tgt.live[op.i] = LETTERS[op.i] + '*';
      out.tgt.modified = true;
      out.tgt.touched = [op.i];
      out.written = [op.i];
      return out;
    }
    // restore: the day's snapshot on the target, alone (rule 4)
    var snap = snapOf(out.tgt, op.day);
    var result = snap ? snap.blocks.slice() : [];
    out.restore = { day: op.day, from: snap ? [op.day] : [], read: result.length, result: result,
      ok: diff(result, out.history[op.day]).length === 0 };
    return out;
  }

  var logic = {
    BLOCKS: BLOCKS,
    DAYS: DAYS,
    WEEK: WEEK,
    MODES: MODES,
    SEND_WEEK: SEND_WEEK,
    REPL: REPL,
    REPL_IDS: REPL_IDS,
    TOUCH: TOUCH,

    /** Parameter defaults. The page's controls describe how each one is shown. lose: 0 = none, 1–3 = Mon–Wed.
        repl: 'off' (the backup week) or one of the send/receive cases; force: receive -F (rolls the target back). */
    defaults: { mode: 'incr', compare: false, restoreDay: 4, lose: 0, repl: 'off', force: false },

    steps: function (p) {
      var r = normRepl(p);
      return r.id ? REPL[r.id].length : steps(p);
    },

    /** Step 0: an empty disk, no backups yet (send/receive: the source's data, no snapshots, an empty target). */
    initial: function (p) {
      var r = normRepl(p);
      if (r.id) return replInitial(r);
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
      var rp = normRepl(p);
      if (rp.id) return replStep(s, n, rp);
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
    norm: norm,
    normRepl: normRepl,
    snapOf: snapOf,
    commonParent: commonParent,
    commonSnaps: commonSnaps,
    makeStream: makeStream,
    receiveCheck: receiveCheck,
    receive: receive,
    storedOn: storedOn,
    refsOf: refsOf
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
