/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for write-cache: write-back vs write-through, a power cut and a battery-backed cache (SPEC.md).
   An application issues a few writes, one per ms, to a controller with a DRAM cache in front of one disk. The
   controller acknowledges a write when it is in cache (write-back) or when the disk has it (write-through); the disk
   writes one block per diskMs, taking dirty blocks in elevator order (C-LOOK by LBA). At cutAt the power fails: an
   unprotected cache is emptied, a battery-backed one keeps its dirty blocks and destages them after power returns.
   One step = the next moment something happens (an issue, an ack, a disk write done, the cut, the restore).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var CACHE_MS = 0.1; // a write into controller DRAM (fixed; SPEC.md "Derived")
  var MAX_LOOP = 200; // guard for countSteps

  /** Write patterns: [label, lba, earliest issue ms, depends on]. 'ack' = issued only after the previous write is
      acknowledged (a journal writes its commit record after its data is acknowledged). Labels are data, not words. */
  var PATTERNS = {
    six: [['A', 120, 0], ['B', 480, 1], ['C', 300, 2], ['D', 760, 3], ['E', 210, 4], ['F', 640, 5]],
    journal: [['X', 950, 0], ['D', 900, 1], ['C', 100, 2, 'ack']],
    rewrite: [['A', 120, 0], ['B', 480, 1], ['C', 300, 2], ['B2', 480, 3], ['E', 210, 4], ['F', 640, 5]]
  };

  /** The policy the controller really runs: write-back falls back to write-through while the battery is failed or
      charging (rule 5). */
  function effPolicy(p) {
    return p.policy === 'wb' && p.bbu !== 'failed' ? 'wb' : 'wt';
  }

  /** Does the cache survive a power cut? Only a working battery (or flash) module protects it (rule 4). */
  function protectedCache(p) { return p.bbu === 'on'; }

  /** The application's operations: writes, and with `flush` on a flush before every write that waits for an ack
      (the commit record), which then goes as a forced-unit-access write: acknowledged only when on disk (rule 6). */
  function opsOf(p) {
    var ops = [];
    (PATTERNS[p.pattern] || PATTERNS.six).forEach(function (w) {
      var dep = w[3] || null;
      if (dep && p.flush) {
        ops.push({ id: 'flush' + ops.length, kind: 'flush', at: w[2], dep: 'ack', issuedAt: null, doneAt: null });
        dep = 'flush';
      }
      ops.push({ id: w[0], kind: 'write', label: w[0], lba: w[1], at: w[2], dep: dep, fua: !!(w[3] && p.flush),
        issuedAt: null, ackAt: null, durableAt: null, supersededBy: null });
    });
    return ops;
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function opById(s, id) { for (var i = 0; i < s.ops.length; i++) if (s.ops[i].id === id) return s.ops[i]; return null; }

  /** The earliest tick at which op i may be issued, or null while its dependency has not happened yet. */
  function readyAt(s, i) {
    var o = s.ops[i];
    if (!o) return null;
    if (!o.dep) return o.at;
    var prev = s.ops[i - 1];
    if (o.dep === 'ack') return prev.ackAt === null ? null : Math.max(o.at, Math.ceil(prev.ackAt - 1e-9));
    if (o.dep === 'flush') return prev.doneAt === null ? null : Math.max(o.at, prev.doneAt);
    return null;
  }

  /** Elevator (C-LOOK): the lowest dirty LBA at or above the head, else the lowest dirty LBA; equal LBAs in issue
      order (only write-through queues two writes to one LBA, rule 7). Returns a cache entry or null. */
  function pickNext(s) {
    var dirty = s.cache.filter(function (c) { return c.dirty; });
    if (!dirty.length) return null;
    var byLba = function (a, b) { return a.lba - b.lba || a.seq - b.seq; };
    var up = dirty.filter(function (c) { return c.lba >= s.head; }).sort(byLba);
    return up.length ? up[0] : dirty.sort(byLba)[0];
  }

  /** Start the next disk write at T, if the disk is idle and a dirty block waits; the event says how many blocks the
      elevator chose from and whether it wrapped back to the lowest LBA (for the caption). */
  function startDisk(s, p, T, ev) {
    if (s.busy) return;
    var c = pickNext(s);
    if (!c) return;
    var of = s.cache.filter(function (x) { return x.dirty; }).length;
    s.busy = { id: c.id, lba: c.lba, doneAt: T + p.diskMs };
    ev.push({ type: 'start', id: c.id, of: of, wrap: c.lba < s.head });
  }

  /** A flush completes when every write issued before it is on disk or replaced by a later write in cache. */
  function settleFlushes(s, T, ev) {
    s.ops.forEach(function (o, i) {
      if (o.kind !== 'flush' || o.issuedAt === null || o.doneAt !== null) return;
      var open = s.ops.slice(0, i).some(function (w) { return w.kind === 'write' && w.durableAt === null && w.supersededBy === null; });
      if (!open) { o.doneAt = T; ev.push({ type: 'flushDone', id: o.id }); }
    });
  }

  /** The next event time after the state's clock, or null when nothing more happens. */
  function nextTime(s, p) {
    if (s.power === 'off') return s.t; // the restore: the clock stands still while the power is off
    var c = [];
    if (s.busy) c.push(s.busy.doneAt);
    if (s.power === 'on') {
      var r = readyAt(s, s.next);
      if (r !== null) c.push(Math.max(r, s.t + 1));
      if (p.cutAt > s.t) c.push(p.cutAt);
    }
    c = c.filter(function (x) { return x > s.t; });
    return c.length ? Math.min.apply(null, c) : null;
  }

  /** Process one tick T (SPEC.md "One step"): (1) the disk finishes a write, (2) flushes settle, (3) the application
      issues what it may, and the cache acknowledges (write-back) or forwards (write-through), (4) an idle disk takes
      the next dirty block, (5) the power cut, at the end of the tick. */
  function tick(s, p, T, ev) {
    var wb = s.eff === 'wb';
    s.t = T;
    // (1) disk completion
    if (s.busy && s.busy.doneAt === T) {
      var w = opById(s, s.busy.id);
      s.disk[String(w.lba)] = w.label;
      w.durableAt = T;
      if (w.ackAt === null && s.power === 'on') { w.ackAt = T; ev.push({ type: 'ack', id: w.id }); } // after a cut nobody waits for it
      s.cache.forEach(function (c) { if (c.id === w.id) c.dirty = false; });
      s.head = w.lba;
      s.busy = null;
      ev.push({ type: 'durable', id: w.id });
    }
    // (2) flushes
    settleFlushes(s, T, ev);
    // (3) the application issues, the cache acknowledges or forwards
    while (s.power === 'on' && s.next < s.ops.length) {
      var r = readyAt(s, s.next);
      if (r === null || r > T) break;
      var o = s.ops[s.next++];
      o.issuedAt = T;
      if (o.kind === 'flush') { ev.push({ type: 'flush', id: o.id }); settleFlushes(s, T, ev); continue; }
      if (wb && !o.fua) {
        o.ackAt = T + CACHE_MS;
        ev.push({ type: 'ack', id: o.id });
        // rule 7: a dirty block of the same LBA that the disk is not writing yet is replaced (one destage)
        var same = s.cache.filter(function (c) { return c.lba === o.lba && c.dirty && !(s.busy && s.busy.id === c.id); })[0];
        if (same) {
          opById(s, same.id).supersededBy = o.id;
          ev.push({ type: 'supersede', id: o.id, old: same.id });
          same.id = o.id; same.label = o.label;
          continue;
        }
      }
      s.cache = s.cache.filter(function (c) { return !(c.lba === o.lba && !c.dirty); }); // a clean copy of the LBA is replaced
      s.cache.push({ id: o.id, lba: o.lba, label: o.label, dirty: true, seq: s.seq++ });
      ev.push({ type: 'issue', id: o.id });
    }
    // (4) an idle disk takes the next dirty block
    if (s.power !== 'off') startDisk(s, p, T, ev);
    // (5) the power cut, at the end of the tick
    if (s.power === 'on' && T === p.cutAt) {
      s.power = 'off';
      s.busy = null; // the write in progress never completes; the block on disk keeps its old content
      if (!protectedCache(p)) s.cache = [];
      s.cutAt = T;
      ev.push({ type: 'cut' });
    }
  }

  function finish(s) {
    // lost: acknowledged, not on disk, not replaced, and no protected copy left in cache
    var cached = {};
    s.cache.forEach(function (c) { if (c.dirty) cached[c.id] = true; });
    var settled = s.power !== 'on';
    s.lost = settled ? s.ops.filter(function (o) {
      return o.kind === 'write' && o.ackAt !== null && o.durableAt === null && o.supersededBy === null && !cached[o.id];
    }).map(function (o) { return o.id; }) : [];
    return s;
  }

  var logic = {
    CACHE_MS: CACHE_MS,
    PATTERNS: PATTERNS,
    effPolicy: effPolicy,

    defaults: { policy: 'wb', bbu: 'off', flush: false, pattern: 'six', diskMs: 8, cutAt: 25 },

    /** One step per event time, plus the restore: 11 for the default preset (SPEC.md "Steps"). */
    steps: function (p) { return logic.countSteps(p); },

    initial: function (p) {
      return {
        t: -1, eff: effPolicy(p), power: 'on', cutAt: null,
        ops: opsOf(p), next: 0, seq: 0,
        cache: [], disk: {}, head: 0, busy: null,
        lost: [], ev: []
      };
    },

    step: function (prev, n, p) {
      var s = clone(prev);
      var ev = [];
      var T = nextTime(s, p);
      if (T === null) { s.ev = []; return s; }
      if (s.power === 'off') {
        s.power = 'restored';
        ev.push({ type: 'restore' });
        startDisk(s, p, s.t, ev); // a protected cache destages after power returns (rule 4)
      } else {
        tick(s, p, T, ev);
      }
      s.ev = ev;
      return finish(s);
    },

    countSteps: function (p) {
      var s = logic.initial(p), n = 0;
      while (n < MAX_LOOP && nextTime(s, p) !== null) { s = logic.step(s, n + 1, p); n++; }
      return n;
    },

    /** Counts for the table after power returns. ack = acknowledged writes; disk = on disk; replaced = superseded
        in cache by a later write to the same LBA; waiting = dirty in a protected cache; lost; unacked = issued,
        never acknowledged (the application knows); never = not issued before the cut. */
    tally: function (s) {
      var c = { issued: 0, ack: 0, disk: 0, diskNoAck: 0, replaced: 0, waiting: 0, lost: s.lost.length, unacked: 0, never: 0 };
      var cached = {};
      s.cache.forEach(function (x) { if (x.dirty) cached[x.id] = true; });
      s.ops.forEach(function (o) {
        if (o.kind !== 'write') return;
        if (o.issuedAt === null) { c.never++; return; }
        c.issued++;
        if (o.ackAt !== null) c.ack++;
        if (o.durableAt !== null) c.disk++;
        if (o.durableAt !== null && o.ackAt === null) c.diskNoAck++; // destaged after the cut from a protected cache
        if (o.supersededBy !== null) c.replaced++;
        if (cached[o.id]) c.waiting++;
        if (o.ackAt === null && o.durableAt === null && s.power !== 'on' && !cached[o.id]) c.unacked++;
      });
      return c;
    },

    /** The journal's state on disk (pattern 'journal'): 'new' (data and commit), 'old' (no commit: the transaction
        is ignored), 'corrupt' (commit without its data). null for other patterns. */
    journalOf: function (s) {
      var data = null, commit = null;
      s.ops.forEach(function (o) { if (o.label === 'D') data = o; if (o.label === 'C' && o.lba === 100) commit = o; });
      if (!data || !commit || data.lba !== 900) return null;
      var d = s.disk['900'] === 'D', c = s.disk['100'] === 'C';
      if (c && !d) return 'corrupt';
      return c ? 'new' : 'old';
    },

    /** Mean acknowledgement latency (ms) of the acknowledged writes, or null. */
    meanAck: function (s) {
      var xs = s.ops.filter(function (o) { return o.kind === 'write' && o.ackAt !== null; })
        .map(function (o) { return o.ackAt - o.issuedAt; });
      if (!xs.length) return null;
      return xs.reduce(function (a, b) { return a + b; }, 0) / xs.length;
    },

    /** The LBAs of the pattern, ascending: the disk row. */
    lbasOf: function (p) {
      var seen = {};
      (PATTERNS[p.pattern] || PATTERNS.six).forEach(function (w) { seen[w[1]] = true; });
      return Object.keys(seen).map(Number).sort(function (a, b) { return a - b; });
    },

    opsOf: opsOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
