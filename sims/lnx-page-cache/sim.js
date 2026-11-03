/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-page-cache: the page cache is not lost memory; dirty pages and writeback.
   An explorer: the state is a pure function of the params (SPEC.md). The machine starts as the book's `free -h`
   (rule 1, the same numbers as lnx-memory-swap-oom). What the params describe happens in a fixed order: read the file
   a.dat (and read it again), write the file b.dat at second 0, let `seconds` pass, then sync, drop caches, power loss.
   All sizes are MiB, all times seconds.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. readFile, thresholds, expiryTick and
   writeback hold no strings and no page code: promotable to models/ unchanged. */
(function (root) {
  'use strict';

  // Rule 1: the book's `free -h` (UL ch12): total 1.7Gi, used 417Mi, free 598Mi, buff/cache 885Mi, available 1.3Gi.
  // 159 MiB of the cache cannot be dropped (chosen so that available = 598 + 885 − 159 = 1324, as in
  // lnx-memory-swap-oom); the processes hold total − free − cache = 258.
  var TOTAL = 1741;
  var FREE0 = 598;
  var CACHE0 = 885;
  var CACHE_FIXED = 159;
  var PROC_MEM = TOTAL - FREE0 - CACHE0;   // 258
  var OLD0 = CACHE0 - CACHE_FIXED;         // 726: clean cache of files read earlier
  var DISK = 25;                           // MiB/s the disk writes (chosen: slow enough to watch, SPEC.md)
  var TICK = 5;                            // dirty_writeback_centisecs 500: the flusher wakes every 5 s
  var EXPIRE = 30;                         // dirty_expire_centisecs 3000: pages dirty for 30 s are old enough

  var RATIOS = { '10/20': [10, 20], '5/10': [5, 10] };

  var defaults = {
    readMiB: 0, reread: false, writeMiB: 0, seconds: 0,
    sync: false, dropCaches: false, powerLoss: false, ratios: '10/20'
  };

  /** Rule 5: the two marks, as a share of dirtyable memory (≈ available), rounded to whole MiB. */
  function thresholds(dirtyable, ratios) {
    var r = RATIOS[ratios] || RATIOS['10/20'];
    return { bgRatio: r[0], ratio: r[1], bg: Math.round(dirtyable * r[0] / 100), limit: Math.round(dirtyable * r[1] / 100) };
  }

  /** Rule 2: a read that misses the cache takes free memory first, then evicts the oldest clean cache.
      Mutates mem ({ free, old }); returns where the pages came from. */
  function readFile(mem, size) {
    var fromFree = Math.min(mem.free, size);
    mem.free -= fromFree;
    var evicted = Math.min(mem.old, size - fromFree);
    mem.old -= evicted;
    return { fromFree: fromFree, evicted: evicted };
  }

  /** Rule 4: the flusher wakes on every multiple of TICK; it writes pages dirtied at `dirtiedAt` on the first tick at
      which they are at least EXPIRE old (≥: a page that turns 30 s exactly on a tick goes on that tick). */
  function expiryTick(dirtiedAt) {
    return Math.ceil((dirtiedAt + EXPIRE) / TICK) * TICK;
  }

  /** Rules 3–5: one buffered write of `size` MiB at second 0, seen `t` seconds later, with marks th = { bg, limit }.
      Memory is fast and the disk writes DISK MiB/s, so:
        - the writer dirties pages at once, up to the limit; above the limit it is throttled and can only dirty as
          fast as the disk drains (write() returns at tw = (size − limit) / DISK);
        - while Dirty is above the background mark, the flusher hands the dirty pages above the mark to
          the disk (they count as Writeback until the disk has them);
        - at the expiry tick all of the file's dirty pages go to the disk (the age is the file's: the time of its
          first dirty page, second 0).
      Returns { dirty, writeback, written, pending, throttled, returnedAt, bgFrom, expiredAt, expired, phase };
      pending = the part the writer has not dirtied yet. Valid while tw < the expiry tick (true for every param on
      the page: tw ≤ 14.72 s, tested). */
  function writeback(size, t, th) {
    var out = { dirty: 0, writeback: 0, written: 0, pending: 0, throttled: false, returnedAt: 0,
      bgFrom: null, expiredAt: expiryTick(0), expired: 0, phase: 'none' };
    if (!(size > 0)) return out;
    var head = Math.min(size, th.limit);          // dirtied at second 0
    var over = Math.max(0, size - th.limit);      // what the throttled writer can only dirty as the disk drains
    var tw = over / DISK;
    var drained = function (x) { return DISK * x - over; };   // MiB the disk wrote after write() returned, at x
    var base = Math.min(head, th.bg);             // what stays dirty once background writeback is done
    out.returnedAt = tw;
    if (size > th.bg) out.bgFrom = 0;
    var te = out.expiredAt;
    var total;                                    // Dirty + Writeback
    if (t < tw) {                                 // throttled: held at the limit, dirty at the mark
      out.throttled = true;
      out.pending = size - head - DISK * t;
      out.dirty = th.bg;
      out.writeback = th.limit - th.bg;
      out.phase = 'throttled';
    } else if (t < te) {                          // background writeback drains to the mark, then nothing until expiry
      total = Math.max(base, head - drained(t));
      out.dirty = base;
      out.writeback = total - base;
      out.phase = out.writeback > 0 ? 'background' : 'waiting';
    } else {                                      // expired: everything still dirty goes to the disk
      var atTe = Math.max(base, head - drained(te));
      out.expired = base;                         // the pages the mark left dirty; writeback still running goes on
      total = Math.max(0, atTe - DISK * (t - te));
      out.writeback = total;
      out.phase = total > 0 ? 'expired' : 'clean';
    }
    out.written = size - out.pending - out.dirty - out.writeback;
    return out;
  }

  /** The whole run, in the fixed order of SPEC.md. */
  function initial(p) {
    var events = [];
    var mem = { free: FREE0, old: OLD0 };
    var read = 0, diskRead = 0;

    // rule 2: read a.dat, and again
    if (p.readMiB > 0) {
      var r = readFile(mem, p.readMiB);
      read = p.readMiB;
      diskRead += p.readMiB;
      events.push({ kind: 'read', size: p.readMiB, fromFree: r.fromFree, evicted: r.evicted });
      if (p.reread) events.push({ kind: 'reread', size: p.readMiB, fromDisk: 0 });
    }

    // rules 3–5: write b.dat at second 0 and let `seconds` pass
    var dirtyable = mem.free + mem.old + read;    // ≈ available: free + all page cache but the fixed part
    var th = thresholds(dirtyable, p.ratios);
    var W = p.writeMiB > 0 ? p.writeMiB : 0;
    var wb = writeback(W, p.seconds, th);
    var inRam = W - wb.pending;                   // the pages of b.dat dirtied so far: dirty, under writeback or clean
    var w = readFile(mem, inRam);                 // they take memory like a read does (free, then the oldest clean)
    if (W) {
      events.push({ kind: 'write', size: W, fromFree: w.fromFree, evicted: w.evicted, returnedAt: wb.returnedAt });
      if (wb.bgFrom !== null) events.push({ kind: 'background', mark: th.bg });
      if (wb.returnedAt > 0) events.push({ kind: 'throttle', limit: th.limit, until: wb.returnedAt, now: wb.throttled });
      if (p.seconds >= wb.expiredAt && wb.expired > 0) events.push({ kind: 'expire', tick: wb.expiredAt, size: wb.expired });
    }
    var s = {
      dirty: wb.dirty, writeback: wb.writeback, written: wb.written, pending: wb.pending,
      throttled: wb.throttled, phase: wb.phase, syncTook: null
    };

    // rule 6: sync writes everything not on disk and returns when the disk has it
    if (p.sync && W) {
      var left = W - s.written;
      s.syncTook = left / DISK;
      events.push({ kind: 'sync', size: left, took: s.syncTook });
      if (s.pending) {                            // the writer was still throttled: its rest goes through the cache
        var more = readFile(mem, s.pending);
        w.fromFree += more.fromFree;
        w.evicted += more.evicted;
        inRam += s.pending;
      }
      s.written = W;
      s.dirty = s.writeback = s.pending = 0;
      s.throttled = false;
      s.phase = 'clean';
    } else if (p.sync) {
      events.push({ kind: 'sync', size: 0, took: 0 });
    }

    var cleanWritten = inRam - s.dirty - s.writeback;
    var cleanRead = read;
    var cleanOld = mem.old;
    var free = mem.free;

    // rule 7: drop_caches frees clean page cache only
    var dropped = null;
    if (p.dropCaches) {
      dropped = cleanOld + cleanRead + cleanWritten;
      free += dropped;
      events.push({ kind: 'drop', size: dropped, kept: s.dirty + s.writeback });
      cleanOld = cleanRead = cleanWritten = 0;
    }

    // rule 8: power loss: what is not on disk is gone; clean cache loses nothing
    var lost = 0;
    if (p.powerLoss) {
      lost = W - s.written;
      events.push({ kind: 'power', lost: lost, inRam: s.dirty + s.writeback, unwritten: s.pending });
    }

    var clean = cleanOld + cleanRead + cleanWritten;
    var cache = CACHE_FIXED + clean + s.dirty + s.writeback;
    var available = free + clean + s.dirty + s.writeback;
    return {
      total: TOTAL,
      procMem: PROC_MEM,
      cacheFixed: CACHE_FIXED,
      free: free,
      clean: clean,
      cleanOld: cleanOld,
      cleanRead: cleanRead,
      cleanWritten: cleanWritten,
      dirty: s.dirty,
      writeback: s.writeback,
      cache: cache,
      available: available,
      used: TOTAL - available,
      diskRead: diskRead,
      diskWritten: s.written,
      writeSize: W,
      readSize: read,
      pending: s.pending,
      throttled: s.throttled,
      lost: lost,
      power: !!p.powerLoss,
      phase: s.phase,
      age: W ? p.seconds : null,
      seconds: p.seconds,
      powerAt: p.seconds + (s.syncTook || 0),   // the power goes after sync has returned (rule order)
      returnedAt: wb.returnedAt,
      expiredAt: wb.expiredAt,
      syncTook: s.syncTook,
      dropped: dropped,
      th: th,
      events: events
    };
  }

  /** The segments of the RAM bar, left to right. Sizes sum to total. */
  function segments(s) {
    return [
      { id: 'proc', size: s.procMem },
      { id: 'fixed', size: s.cacheFixed },
      { id: 'old', size: s.cleanOld },
      { id: 'read', size: s.cleanRead },
      { id: 'written', size: s.cleanWritten },
      { id: 'wb', size: s.writeback },
      { id: 'dirty', size: s.dirty },
      { id: 'free', size: s.free }
    ].filter(function (x) { return x.size > 0; });
  }

  /** What moved between two states (the page marks it): free -m cells, /proc/meminfo lines, bar segments, disk
      counters. */
  function changed(a, b) {
    var out = { mem: [], info: [], seg: [], disk: [] };
    if (!a || !b) return out;
    ['used', 'free', 'cache', 'available'].forEach(function (k) { if (a[k] !== b[k]) out.mem.push(k); });
    [['MemFree', 'free'], ['MemAvailable', 'available'], ['Cached', 'cache'], ['Dirty', 'dirty'], ['Writeback', 'writeback']]
      .forEach(function (x) { if (a[x[1]] !== b[x[1]]) out.info.push(x[0]); });
    var sa = {};
    segments(a).forEach(function (x) { sa[x.id] = x.size; });
    segments(b).forEach(function (x) { if (sa[x.id] !== x.size) out.seg.push(x.id); });
    ['diskRead', 'diskWritten', 'lost'].forEach(function (k) { if (a[k] !== b[k]) out.disk.push(k); });
    return out;
  }

  /** Which caption explains the state (the page words it), first that applies:
        cLost       the power went and data that was not on disk is gone (write() had returned)
        cLostMid    the same, while the writer was still throttled
        cSafe       the power went and nothing was lost (synced, or the disk had it all)
        cSafeNone   the power went and nothing had been written
        cDrop       drop_caches freed the clean cache: free rose, available did not
        cSync       sync wrote what was left (more than 0 MiB) and returned when the disk had it
        cThrottled  the writer is held at the dirty limit
        cBackground above the background mark: the disk is writing the pages above it
        cExpired    the expiry tick handed the old dirty pages to the disk; still writing
        cDirty      write() returned; the pages are dirty and wait for their 30 s
        cWritten    everything written is on disk and stays as clean cache
        cReread     the second read came from the cache
        cRead       a read filled the cache: free fell, available did not
        cBook       nothing done: the book's line */
  function captionKey(s) {
    var has = function (k) { return s.events.some(function (e) { return e.kind === k; }); };
    if (s.power) return s.lost > 0 ? (s.pending > 0 ? 'cLostMid' : 'cLost') : (s.writeSize ? 'cSafe' : 'cSafeNone');
    if (s.dropped !== null) return 'cDrop';
    if (s.events.some(function (e) { return e.kind === 'sync' && e.size > 0; })) return 'cSync';
    if (s.throttled) return 'cThrottled';
    if (s.phase === 'background') return 'cBackground';
    if (s.phase === 'expired') return 'cExpired';
    if (s.phase === 'waiting') return 'cDirty';
    if (s.writeSize) return 'cWritten';
    if (has('reread')) return 'cReread';
    if (has('read')) return 'cRead';
    return 'cBook';
  }

  var presets = [
    { id: 'book-free', params: {} },
    { id: 'read-twice', params: { readMiB: 400, reread: true } },
    { id: 'small-write', params: { writeMiB: 100 } },
    { id: 'big-write', params: { writeMiB: 500 } },
    { id: 'drop-caches', params: { dropCaches: true } },
    { id: 'power-loss', params: { writeMiB: 100, seconds: 10, powerLoss: true } }
  ].map(function (x) { return { id: x.id, params: Object.assign({}, defaults, x.params) }; });

  var logic = {
    defaults: defaults,
    initial: initial,
    presets: presets,
    readFile: readFile,
    thresholds: thresholds,
    expiryTick: expiryTick,
    writeback: writeback,
    segments: segments,
    changed: changed,
    captionKey: captionKey,
    TOTAL: TOTAL,
    FREE0: FREE0,
    CACHE0: CACHE0,
    CACHE_FIXED: CACHE_FIXED,
    PROC_MEM: PROC_MEM,
    OLD0: OLD0,
    DISK: DISK,
    TICK: TICK,
    EXPIRE: EXPIRE,
    RATIOS: RATIOS
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
