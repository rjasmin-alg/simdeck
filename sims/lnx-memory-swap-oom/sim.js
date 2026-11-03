/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-memory-swap-oom: page cache vs used, swapping, and who the OOM killer picks.
   An explorer: the state is a pure function of the params (SPEC.md). The machine starts as the book's `free -h`
   (rule 1); the started processes run in fixed order backup → db → build, and each one's demand goes through
   rules 2–6. All sizes are MiB.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. run, allocate, badness and pickVictim hold
   no strings and no page code: promotable to models/ unchanged.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // Rule 1: the book's `free -h` (UL ch12): total 1.7Gi, used 417Mi, free 598Mi, buff/cache 885Mi, available 1.3Gi.
  // 159 MiB of the cache is not reclaimable (chosen so that available = 598 + 885 − 159 = 1324); the other processes
  // hold total − free − cache = 258.
  var TOTAL = 1741;
  var FREE0 = 598;
  var CACHE0 = 885;
  var CACHE_FIXED = 159;
  var OTHER = TOTAL - FREE0 - CACHE0;   // 258
  var BACKUP_READ = 800;                // rule 2: the backup reads 800 MiB of files
  var ADJ_MIN = -1000;                  // OOM_SCORE_ADJ_MIN: never picked (rule 5)

  // The three processes, in start order, with fixed PIDs.
  var PROCS = [
    { key: 'backup', pid: 2101 },
    { key: 'db', pid: 2102 },
    { key: 'build', pid: 2103 }
  ];

  // dbSize / buildSize 0 = not started (the task's db and build toggles folded into the size, NOTES.md).
  var defaults = { swap: 0, backup: false, dbSize: 0, dbAdj: 0, buildSize: 0 };

  /** Rule 5: the score the OOM killer compares. RSS + swap entries (+ page tables, ignored) + adj × totalpages / 1000,
      totalpages = RAM + swap. adj = −1000 → null: never a candidate. A killed process has no score. */
  function badness(proc, swapTotal) {
    if (proc.killed || proc.adj === ADJ_MIN) return null;
    return proc.rss + proc.swap + proc.adj * (TOTAL + swapTotal) / 1000;
  }

  /** Rules 5 and 6: walk the live processes in start order (the task list) and keep the one with the highest score,
      replacing the choice on ≥, so on a tie the later-started one wins. Returns the index into procs, or −1. */
  function pickVictim(procs, swapTotal) {
    var chosen = -1, best = -Infinity;
    for (var i = 0; i < procs.length; i++) {
      var pts = badness(procs[i], swapTotal);
      if (pts === null || pts < best) continue;
      chosen = i;
      best = pts;
    }
    return chosen;
  }

  /** Rule 2: reading files fills the page cache from free memory. What does not fit in free replaces older
      reclaimable cache (least recently used first): buff/cache stops growing, available does not move. */
  function readFiles(mem, size) {
    var fromFree = Math.min(mem.free, size);
    mem.free -= fromFree;
    mem.cache += fromFree;
    return { fromFree: fromFree, replaced: size - fromFree };
  }

  /** Rules 3–5: one process allocates `size` of anonymous memory. procs holds the processes started before it;
      the new one is appended. Free memory first, then reclaimable cache, then the earliest-started processes'
      pages go to swap while it has room; what is still missing triggers the OOM killer, which may kill another
      process (its memory and swap are freed and the allocation completes) or the one asking (it fails).
      Mutates mem and procs; returns the event that describes it. */
  function allocate(mem, procs, proc, size) {
    var ev = { kind: 'alloc', key: proc.key, ask: size, fromFree: 0, fromCache: 0, swapped: [], short: 0, oom: [] };
    procs.push(proc);
    var need = size;

    // rule 3: free first, then clean page cache down to the part that cannot be reclaimed
    ev.fromFree = Math.min(mem.free, need);
    mem.free -= ev.fromFree;
    need -= ev.fromFree;
    ev.fromCache = Math.min(mem.cache - CACHE_FIXED, need);
    mem.cache -= ev.fromCache;
    need -= ev.fromCache;
    proc.rss = ev.fromFree + ev.fromCache;

    // rule 4: the least recently used anonymous pages, those of the earliest-started process, go to swap
    for (var i = 0; i < procs.length - 1 && need > 0 && mem.swapUsed < mem.swapTotal; i++) {
      var v = procs[i];
      if (v.killed) continue;
      var n = Math.min(v.rss, need, mem.swapTotal - mem.swapUsed);
      if (n <= 0) continue;
      v.rss -= n;
      v.swap += n;
      mem.swapUsed += n;
      proc.rss += n;
      need -= n;
      ev.swapped.push({ key: v.key, n: n });
    }
    ev.short = need;

    // rule 5: still short → the OOM killer frees the process with the highest score, until the allocation fits
    while (need > 0) {
      var vi = pickVictim(procs, mem.swapTotal);
      if (vi < 0) break;   // nothing killable: not reachable with these params (the asker is always a candidate)
      var victim = procs[vi];
      var scores = procs.map(function (p) { return { key: p.key, score: badness(p, mem.swapTotal) }; })
        .filter(function (x) { return x.score !== null; });
      ev.oom.push({ victim: victim.key, score: badness(victim, mem.swapTotal), scores: scores, self: victim === proc });
      victim.killed = true;
      mem.free += victim.rss;
      mem.swapUsed -= victim.swap;
      if (victim === proc) break;   // the asker died: its allocation never completes
      var take = Math.min(mem.free, need);
      mem.free -= take;
      proc.rss += take;
      need -= take;
    }
    return ev;
  }

  /** The whole run: the book's machine, then each started process in order. */
  function run(p) {
    var mem = { free: FREE0, cache: CACHE0, swapTotal: p.swap, swapUsed: 0 };
    var procs = [];
    var events = [];
    PROCS.forEach(function (d) {
      if (d.key === 'backup') {
        if (!p.backup) return;
        // its own anonymous memory (a few MiB in reality) is left out: it shows RSS 0
        procs.push({ key: d.key, pid: d.pid, ask: 0, rss: 0, swap: 0, adj: 0, killed: false });
        var r = readFiles(mem, BACKUP_READ);
        events.push({ kind: 'read', key: d.key, size: BACKUP_READ, fromFree: r.fromFree, replaced: r.replaced });
        return;
      }
      var size = d.key === 'db' ? p.dbSize : p.buildSize;
      if (!(size > 0)) return;
      var adj = d.key === 'db' ? p.dbAdj : 0;
      var proc = { key: d.key, pid: d.pid, ask: size, rss: 0, swap: 0, adj: adj, killed: false };
      events.push(allocate(mem, procs, proc, size));
    });
    return { mem: mem, procs: procs, events: events };
  }

  /** The state the page draws: free -m's columns (used = total − available, procps-ng 4) and the process table. */
  function initial(p) {
    var r = run(p);
    var m = r.mem;
    var available = m.free + m.cache - CACHE_FIXED;
    var oomEv = r.events.filter(function (e) { return e.oom && e.oom.length; })[0] || null;
    var procs = r.procs.map(function (x) {
      return {
        key: x.key, pid: x.pid, ask: x.ask, rss: x.rss, swap: x.swap, adj: x.adj, killed: x.killed,
        // the live score; a killed row keeps the score it was killed with
        score: x.killed ? scoreAtKill(r.events, x.key) : badness(x, m.swapTotal)
      };
    });
    return {
      total: TOTAL,
      free: m.free,
      cache: m.cache,
      cacheFixed: CACHE_FIXED,
      other: OTHER,
      available: available,
      used: TOTAL - available,
      swapTotal: m.swapTotal,
      swapUsed: m.swapUsed,
      procs: procs,
      oomVictim: oomEv ? oomEv.oom[0].victim : null,
      events: r.events
    };
  }

  function scoreAtKill(events, key) {
    for (var i = 0; i < events.length; i++) {
      var o = events[i].oom || [];
      for (var j = 0; j < o.length; j++) if (o[j].victim === key) return o[j].score;
    }
    return null;
  }

  /** The segments of the RAM bar, left to right: other processes, each live process, unreclaimable cache,
      reclaimable cache, free. Sizes sum to total. */
  function segments(s) {
    var out = [{ id: 'other', size: s.other }];
    s.procs.forEach(function (x) { if (!x.killed && x.rss > 0) out.push({ id: 'p-' + x.key, key: x.key, size: x.rss }); });
    out.push({ id: 'fixed', size: s.cacheFixed });
    out.push({ id: 'cache', size: s.cache - s.cacheFixed });
    out.push({ id: 'free', size: s.free });
    return out.filter(function (x) { return x.size > 0; });
  }

  /** What moved between two states (the page marks it): free -m cells, bar segments and process-table cells. */
  function changed(a, b) {
    var out = { mem: [], swap: [], seg: [], procs: {} };
    if (!a || !b) return out;
    ['used', 'free', 'cache', 'available'].forEach(function (k) { if (a[k] !== b[k]) out.mem.push(k); });
    if (a.swapTotal !== b.swapTotal) out.swap.push('total');
    if (a.swapUsed !== b.swapUsed) out.swap.push('used');
    if (a.swapTotal - a.swapUsed !== b.swapTotal - b.swapUsed) out.swap.push('free');
    var sa = {};
    segments(a).forEach(function (x) { sa[x.id] = x.size; });
    segments(b).forEach(function (x) { if (sa[x.id] !== x.size) out.seg.push(x.id); });
    if (out.swap.indexOf('used') >= 0) out.seg.push('swap');
    var pa = {};
    a.procs.forEach(function (x) { pa[x.key] = x; });
    b.procs.forEach(function (x) {
      var o = pa[x.key];
      var cells = !o ? ['row'] : ['ask', 'rss', 'swap', 'adj', 'score', 'killed'].filter(function (k) { return o[k] !== x[k]; });
      if (cells.length) out.procs[x.key] = cells;
    });
    return out;
  }

  /** Which caption explains the state (the page words it), first that applies:
        cOomDb        the OOM killer killed the database for the build
        cOomProtected it killed the build itself while the database had oom_score_adj −1000
        cOomSelf      it killed the build itself because the build had the highest score (also when a −1000
                      database would have scored lower anyway)
        cSwap         nobody killed, but pages went to swap
        cReclaim      an allocation took page cache back (free may read 0; available tells the truth)
        cRead         only the backup's reads moved memory: free fell, available did not
        cFits         the started processes fit in free memory
        cBook         nothing started: the book's line */
  function captionKey(s) {
    var allocs = s.events.filter(function (e) { return e.kind === 'alloc'; });
    var oomEv = allocs.filter(function (e) { return e.oom.length; })[0];
    if (oomEv) {
      var o = oomEv.oom[0];
      if (!o.self) return 'cOomDb';
      // the protection decided it only if the protected process would have outscored the asker without it
      var askerScore = o.score;
      var decided = s.procs.some(function (x) {
        return x.key !== oomEv.key && x.adj === ADJ_MIN && !x.killed && x.rss + x.swap > askerScore;
      });
      return decided ? 'cOomProtected' : 'cOomSelf';
    }
    if (allocs.some(function (e) { return e.swapped.length; })) return 'cSwap';
    if (allocs.some(function (e) { return e.fromCache > 0; })) return 'cReclaim';
    if (s.events.some(function (e) { return e.kind === 'read'; })) return 'cRead';
    if (s.events.length) return 'cFits';
    return 'cBook';
  }

  var presets = [
    { id: 'book-free', params: {} },
    { id: 'backup-reads', params: { backup: true } },
    { id: 'cache-gives-way', params: { buildSize: 900 } },
    { id: 'oom-kills-db', params: { dbSize: 900, buildSize: 600 } },
    { id: 'swap-saves', params: { swap: 512, dbSize: 900, buildSize: 600 } },
    { id: 'protect-db', params: { dbSize: 900, dbAdj: -1000, buildSize: 600 } }
  ].map(function (x) { return { id: x.id, params: Object.assign({}, defaults, x.params) }; });

  var logic = {
    defaults: defaults,
    initial: initial,
    presets: presets,
    run: run,
    allocate: allocate,
    readFiles: readFiles,
    badness: badness,
    pickVictim: pickVictim,
    segments: segments,
    changed: changed,
    captionKey: captionKey,
    TOTAL: TOTAL,
    FREE0: FREE0,
    CACHE0: CACHE0,
    CACHE_FIXED: CACHE_FIXED,
    OTHER: OTHER,
    BACKUP_READ: BACKUP_READ,
    ADJ_MIN: ADJ_MIN,
    PROCS: PROCS
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
