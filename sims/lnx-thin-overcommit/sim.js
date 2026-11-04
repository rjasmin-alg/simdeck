/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-thin-overcommit: promised vs real space; the thin pool fills under every volume.
   An explorer: the state is a pure function of the params (SPEC.md); nothing accumulates over time.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The pool operations (createPool, write,
   discard, autoextend, dataPct) hold no strings and no page code: promotable to models/ unchanged.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var FREE = -1;          // a pool cell no thin volume owns
  var MAX_LVS = 4;

  var defaults = {
    pool: 100, n: 3, virt: 50, w1: 20, w2: 20, w3: 20, w4: 20,
    autoextend: false, threshold: 70, percent: 20, vgFree: 0,
    deleted1: 0, discard: false, errorWhenFull: false
  };

  // ── the pool: cells of 1 GiB, each FREE or the index of the thin volume that owns it ──

  /** A thin pool of `size` GiB with `n` thin volumes of `virt` GiB each (rule 1: creating them allocates nothing). */
  function createPool(size, n, virt, vgFree) {
    var cells = [];
    for (var i = 0; i < size; i++) cells.push(FREE);
    var lvs = [];
    for (var k = 0; k < n; k++) lvs.push({ name: 'thin' + (k + 1), virt: virt, map: [] });
    return { cells: cells, lvs: lvs, vgFree: vgFree, extended: [], short: null };
  }

  function used(st) {
    var u = 0;
    for (var i = 0; i < st.cells.length; i++) if (st.cells[i] !== FREE) u++;
    return u;
  }

  /** Rule 3: pool Data% = allocated / pool size × 100. */
  function dataPct(st) { return st.cells.length ? used(st) * 100 / st.cells.length : 0; }

  /** Rules 1 and 5. Volume `lv` writes its virtual block `vb` (1 GiB). A block it already holds is rewritten in place
      ('rewrite': no pool space needed, works even when the pool is full). A block never written needs a pool cell: the
      lowest free one ('alloc'); when there is none the write is refused ('refused'), whichever volume asks and however
      much free space its own filesystem shows. Mutates st; returns the outcome. */
  function write(st, lv, vb) {
    var m = st.lvs[lv].map;
    if (m[vb] != null) return 'rewrite';
    var k = st.cells.indexOf(FREE);
    if (k < 0) return 'refused';
    st.cells[k] = lv;
    m[vb] = k;
    return 'alloc';
  }

  /** Rule 4: discard (fstrim, or the discard mount option) returns the pool cells behind virtual blocks the filesystem
      no longer uses. Without it the cells stay allocated. Mutates st; returns the number of cells freed. */
  function discard(st, lv, blocks) {
    var m = st.lvs[lv].map, freed = 0;
    blocks.forEach(function (vb) {
      if (m[vb] == null) return;
      st.cells[m[vb]] = FREE;
      m[vb] = null;
      freed++;
    });
    return freed;
  }

  /** Rule 6: when autoextend is on and Data% exceeds the threshold (strictly: at exactly the threshold nothing grows),
      the pool grows by percent of its current size, rounded up to whole GiB (lvextend rounds up to whole extents), if
      the VG has that much free; otherwise it does not grow at all. Compared in whole numbers: used·100 > thr·size.
      Mutates st; returns 'grew', 'short' or null. */
  function autoextend(st, cfg) {
    if (!cfg.on) return null;
    var size = st.cells.length, u = used(st);
    if (u * 100 <= cfg.threshold * size) return null;
    var by = Math.ceil(size * cfg.percent / 100 - 1e-9);
    if (by > st.vgFree) {
      if (!st.short) st.short = { at: u, size: size, want: by, vgFree: st.vgFree };
      return 'short';
    }
    for (var i = 0; i < by; i++) st.cells.push(FREE);
    st.vgFree -= by;
    st.extended.push({ from: size, to: size + by, by: by, at: u });
    return 'grew';
  }

  // ── the explorer: the params' writes applied in order ──

  function clampInt(v, lo, hi) { return Math.max(lo, Math.min(hi, Math.round(Number(v) || 0))); }

  /** Rules 1–7 over the params. Writes are applied volume by volume (thin1, thin2, …: rule 7), one 1-GiB block at a
      time, each a first write of the next virtual block; after each block the autoextend rule is checked. Right after
      thin1's writes, thin1's filesystem deletes `deleted1` GiB (its oldest blocks); with discard on, their pool cells
      are freed, so later volumes reuse them. */
  function compute(p) {
    var n = clampInt(p.n, 1, MAX_LVS);
    var virt = clampInt(p.virt, 1, 1000);
    var st = createPool(clampInt(p.pool, 1, 1000), n, virt, clampInt(p.vgFree, 0, 1000));
    var cfg = { on: !!p.autoextend, threshold: clampInt(p.threshold, 50, 100), percent: clampInt(p.percent, 1, 100) };
    var lvs = [];
    var firstRefused = null;   // { lv, at, free }: the volume, what it had written, and its filesystem's free space then
    for (var i = 0; i < n; i++) {
      var want = clampInt(p['w' + (i + 1)], 0, virt);   // a filesystem cannot hold more than its volume's size
      var written = 0, refused = 0;
      for (var vb = 0; vb < want; vb++) {
        var r = write(st, i, vb);
        if (r === 'refused') {
          refused++;
          if (!firstRefused) firstRefused = { lv: i, at: written, free: virt - written };
        } else written++;
        autoextend(st, cfg);
      }
      var deleted = 0, discarded = 0;
      if (i === 0) {
        deleted = clampInt(p.deleted1, 0, written);   // only what was written can be deleted
        if (deleted > 0 && p.discard) {
          var blocks = [];
          for (var d = 0; d < deleted; d++) blocks.push(d);
          discarded = discard(st, 0, blocks);   // lowers usage only: no autoextend check needed
        }
      }
      lvs.push({ name: st.lvs[i].name, virt: virt, want: want, written: written, refused: refused,
        deletedInFs: deleted, discarded: discarded });
    }
    // what each volume holds in the pool now, and what its filesystem believes
    lvs.forEach(function (lv, k) {
      lv.allocated = st.lvs[k].map.filter(function (c) { return c != null; }).length;
      lv.fsUsed = lv.written - lv.deletedInFs;
      lv.fsFree = lv.virt - lv.fsUsed;
      lv.dataPct = lv.allocated * 100 / lv.virt;                 // rule 3: relative to its own virtual size
      lv.kept = lv.allocated - lv.fsUsed;                         // deleted in the filesystem, still held in the pool
    });
    // pool cells behind blocks thin1's filesystem deleted but did not discard (rule 4): still allocated
    var keptCells = [];
    for (var j = 0; j < lvs[0].deletedInFs; j++) if (st.lvs[0].map[j] != null) keptCells.push(st.lvs[0].map[j]);
    var size = st.cells.length, u = used(st);
    var promised = n * virt;
    var refusedTotal = lvs.reduce(function (s, x) { return s + x.refused; }, 0);
    return {
      pool: { size: size, size0: clampInt(p.pool, 1, 1000), used: u, pct: dataPct(st), cells: st.cells.slice(), kept: keptCells },
      vgFree: st.vgFree,
      lvs: lvs,
      extended: st.extended,
      short: st.short,
      promised: promised,
      overcommit: promised * 100 / clampInt(p.pool, 1, 1000),    // rule 2: at creation, against the pool as created
      warned: promised > clampInt(p.pool, 1, 1000),
      full: u === size,
      refused: refusedTotal,
      firstRefused: firstRefused,
      mode: p.errorWhenFull ? 'error' : 'queue',
      autoextend: cfg.on,
      threshold: cfg.threshold,
      extPercent: cfg.percent
    };
  }

  function initial(p) { return compute(p); }

  /** Pool cells whose owner differs between two states (allocated, freed or taken over): the page marks them. */
  function changedCells(a, b) {
    if (!a || !b) return [];
    var out = [];
    for (var i = 0; i < b.pool.cells.length; i++) {
      if (i >= a.pool.cells.length || a.pool.cells[i] !== b.pool.cells[i]) out.push(i);   // new rows count as changed
    }
    return out;
  }

  /** Which caption explains the state, and the extra notes after it (the page words them). */
  function captionKey(s) {
    var key;
    if (s.refused > 0 && s.full) key = s.mode === 'error' ? 'cFullError' : 'cFullQueue';
    else if (s.refused > 0) key = s.mode === 'error' ? 'cWasFullError' : 'cWasFullQueue';   // thin1 hit it, then discarded
    else if (s.full && !s.warned) key = 'cFullExact';   // promised = pool, every volume written to its size
    else if (s.full) key = 'cFullNow';
    else if (!s.warned) key = 'cNoOvercommit';
    else key = 'cFits';
    var notes = [];
    if (s.refused > 0) {
      var others = s.lvs.filter(function (lv, k) { return lv.refused > 0 && k !== s.firstRefused.lv; });
      if (others.length) notes.push({ key: 'nAlsoRefused', lvs: others.map(function (x) { return x.name; }) });
      notes.push({ key: 'nRewrite' });
    }
    var rewrite = notes.length;   // the rewrite note goes last, and only while the caption stays short (below)
    var t1 = s.lvs[0];
    if (t1.deletedInFs > 0) {
      if (t1.discarded > 0) notes.push({ key: s.lvs.length > 1 ? 'nDiscarded' : 'nDiscardedOnly', d: t1.discarded });
      else notes.push({ key: 'nKept', d: t1.kept });
    }
    if (s.extended.length) notes.push({ key: s.short ? 'nGrewShort' : 'nGrew', n: s.extended.length });
    else if (s.short) notes.push({ key: 'nShort' });
    if (rewrite && notes.length > rewrite) notes.splice(rewrite - 1, 1);   // only with no other notes; the explanation says it too
    return { key: key, notes: notes };
  }

  var presets = [
    { id: 'overcommit-ok', params: { pool: 100, n: 3, virt: 50, w1: 20, w2: 20, w3: 20, autoextend: false, vgFree: 0, deleted1: 0, discard: false, errorWhenFull: false } },
    { id: 'one-tenant-fills', params: { pool: 100, n: 3, virt: 50, w1: 50, w2: 40, w3: 20, autoextend: false, vgFree: 0, deleted1: 0, discard: false, errorWhenFull: false } },
    { id: 'autoextend', params: { pool: 100, n: 3, virt: 50, w1: 40, w2: 40, w3: 50, autoextend: true, threshold: 70, percent: 20, vgFree: 50, deleted1: 0, discard: false, errorWhenFull: false } },
    { id: 'deleted-not-returned', params: { pool: 100, n: 3, virt: 50, w1: 50, w2: 40, w3: 0, autoextend: false, vgFree: 0, deleted1: 30, discard: false, errorWhenFull: false } },
    { id: 'error-at-once', params: { pool: 100, n: 3, virt: 50, w1: 50, w2: 40, w3: 20, autoextend: false, vgFree: 0, deleted1: 0, discard: false, errorWhenFull: true } }
  ];

  var logic = {
    defaults: defaults,
    initial: initial,
    presets: presets,
    compute: compute,
    createPool: createPool,
    write: write,
    discard: discard,
    autoextend: autoextend,
    dataPct: dataPct,
    used: used,
    changedCells: changedCells,
    captionKey: captionKey,
    FREE: FREE,
    MAX_LVS: MAX_LVS
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
