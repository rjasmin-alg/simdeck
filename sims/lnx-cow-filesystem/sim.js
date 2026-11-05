/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-cow-filesystem: a pool of physical blocks under a copy-on-write filesystem. The live tree
   (subvolume / dataset `podaci`) holds file `a`, a list of pointers to pool blocks; a snapshot copies those
   pointers, not the data, so the blocks become shared; a write never overwrites a block another tree points to,
   it goes to a new block and moves only the live tree's pointer. Deleting a file or destroying a snapshot frees
   only the blocks no tree points to any more.
   Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. The pool operations
   (write, snapshot, rm, destroy, recount, space) are pure functions over { blocks, trees, poolSize, writes } and
   hold no words, so they can move to models/ unchanged (sto-cow-vs-row, win-vss as later presets, catalogue §5.2).
   Preset win-vss (Volume Shadow Copy, SPEC.md "Copy-on-write mode") adds the other variant: in mode
   'copy-on-write' the live file's blocks never move; on the first change of a block a shadow still shares, the old
   block is first copied into a separate diff area (ids poolSize … poolSize + diffSize − 1), the shadows' pointers move
   to the copy, and the new data overwrites the original in place (writeInPlace, restore, pickShadow). The host's
   scenes run in mode 'redirect-on-write' and are unchanged. */
(function (root) {
  'use strict';

  var LIVE = 'podaci';
  var FILE = 'a';
  /** Logical block k of the file is labelled by letter k and the number of times it was written: A0, C1, C2. */
  var LETTERS = 'ABCDEFGH';

  /** The preset scripts (SPEC.md "Presets"): one op per step. */
  var SCENES = {
    basic: [
      { op: 'write', file: FILE },
      { op: 'snapshot', name: '@s1' },
      { op: 'write', file: FILE, idx: [2, 3] }
    ],
    'delete-doesnt-free': [
      { op: 'write', file: FILE },
      { op: 'snapshot', name: '@s1' },
      { op: 'rm', file: FILE },
      { op: 'destroy', name: '@s1' }
    ],
    'middle-snapshot': [
      { op: 'write', file: FILE },
      { op: 'snapshot', name: '@s1' },
      { op: 'write', file: FILE, idx: [2] },
      { op: 'snapshot', name: '@s2' },
      { op: 'write', file: FILE, idx: [2] },
      { op: 'destroy', name: '@s1' },
      { op: 'destroy', name: '@s2' }
    ],
    'full-pool': [
      { op: 'write', file: FILE },
      { op: 'snapshot', name: '@s1' },
      { op: 'write', file: FILE, idx: [0] },
      { op: 'write', file: FILE, idx: [1] },
      { op: 'write', file: FILE, idx: [2] },
      { op: 'rm', file: FILE },
      { op: 'destroy', name: '@s1' }
    ],
    // win-vss (copy-on-write mode): a shadow copy is a snapshot with a time; restore takes the newest surviving shadow
    // older than `before` (the time of the change to undo). Every op touches only blocks 0–3 (any fileBlocks 4–8).
    'previous-versions': [
      { op: 'write', file: FILE, time: '09:00' },
      { op: 'snapshot', name: 'S1', time: '10:00' },
      { op: 'write', file: FILE, idx: [2, 3], time: '10:30' },
      { op: 'write', file: FILE, idx: [2], time: '10:45' },
      { op: 'snapshot', name: 'S2', time: '11:00' },
      { op: 'restore', file: FILE, before: '10:30', time: '11:30' }
    ],
    'diff-growth': [
      { op: 'write', file: FILE, time: '09:00' },
      { op: 'snapshot', name: 'S1', time: '10:00' },
      { op: 'write', file: FILE, idx: [0], time: '10:15' },
      { op: 'write', file: FILE, idx: [1], time: '10:30' },
      { op: 'write', file: FILE, idx: [0], time: '10:45' },
      { op: 'write', file: FILE, idx: [2, 3], time: '11:00' },
      { op: 'write', file: FILE, idx: [0, 1, 2, 3], time: '11:15' }
    ],
    'diff-full': [
      { op: 'write', file: FILE, time: '08:00' },
      { op: 'snapshot', name: 'S1', time: '09:00' },
      { op: 'write', file: FILE, idx: [0, 1], time: '09:30' },
      { op: 'snapshot', name: 'S2', time: '10:00' },
      { op: 'write', file: FILE, idx: [2, 3], time: '10:30' },
      { op: 'snapshot', name: 'S3', time: '11:00' },
      { op: 'write', file: FILE, idx: [0, 1], time: '11:30' },
      { op: 'restore', file: FILE, before: '09:30', time: '12:00' },
      { op: 'restore', file: FILE, before: '11:30', time: '12:15' }
    ]
  };
  var SCENE_IDS = Object.keys(SCENES);
  /** The write policy of each scene: the host's scenes redirect, the win-vss scenes copy the old block first. */
  var COW_SCENES = ['previous-versions', 'diff-growth', 'diff-full'];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function findTree(fs, name) { for (var i = 0; i < fs.trees.length; i++) if (fs.trees[i].name === name) return fs.trees[i]; return null; }
  function findBlock(fs, id) { for (var i = 0; i < fs.blocks.length; i++) if (fs.blocks[i].id === id) return fs.blocks[i]; return null; }
  function label(k, v) { return LETTERS.charAt(k) + v; }

  /** Every pointer of a tree, as a list of block ids (a block appears once per pointer). */
  function pointers(tree) {
    var out = [];
    Object.keys(tree.files).sort().forEach(function (f) { out = out.concat(tree.files[f]); });
    return out;
  }

  /** Rule 7: the free block ids, lowest first. */
  function freeIds(fs) {
    var used = {}, out = [];
    fs.blocks.forEach(function (b) { used[b.id] = true; });
    for (var id = 0; id < fs.poolSize; id++) if (!used[id]) out.push(id);
    return out;
  }

  /** Copy-on-write mode: the free diff-area ids, lowest first (rule V7). */
  function diffFreeIds(fs) {
    var used = {}, out = [];
    fs.blocks.forEach(function (b) { used[b.id] = true; });
    for (var id = fs.poolSize; id < fs.poolSize + (fs.diffSize || 0); id++) if (!used[id]) out.push(id);
    return out;
  }
  function isDiff(fs, id) { return id >= fs.poolSize; }
  /** The shadows (read-only trees), oldest first. */
  function shadows(fs) { return fs.trees.filter(function (t) { return t.readonly; }); }

  /** Recount every block's refs from the trees, then free the blocks with refs 0 (rules 3–5).
      Returns { fs, freed: [{ id, ver }], changed: ids whose refs changed (freed ones included) }. */
  function recount(fs) {
    var out = clone(fs), count = {};
    out.trees.forEach(function (t) { pointers(t).forEach(function (id) { count[id] = (count[id] || 0) + 1; }); });
    var freed = [], changed = [];
    out.blocks.forEach(function (b) {
      var n = count[b.id] || 0;
      if (n !== b.refs) changed.push(b.id);
      b.refs = n;
      if (n === 0) freed.push({ id: b.id, ver: b.ver });
    });
    out.blocks = out.blocks.filter(function (b) { return b.refs > 0; });
    return { fs: out, freed: freed, changed: changed };
  }

  function result(fs, extra) {
    return Object.assign({ fs: fs, err: null, moved: [], allocated: [], freed: [], changed: [] }, extra || {});
  }

  /** Rules 2, 3, 6, 7, 8: write logical blocks `idx` of `file` in `tree` (a new file of `n` blocks when the file
      does not exist and idx is omitted). Order: validate, allocate the lowest free ids (one per block, in logical
      order), move the pointers, recount, free refs-0 blocks. The old blocks are released only after the new ones are
      written, so every written block needs a free one, even when the old block was not shared. */
  function write(fs, tree, file, idx, n) {
    var t = findTree(fs, tree);
    if (!t) return result(clone(fs), { err: 'ENOENT' });
    if (t.readonly) return result(clone(fs), { err: 'EROFS' });
    var exists = Object.prototype.hasOwnProperty.call(t.files, file);
    var len = exists ? t.files[file].length : n;
    var ks = [];
    for (var k = 0; k < len; k++) if (!idx || idx.indexOf(k) >= 0) ks.push(k);     // logical order, each block once
    var free = freeIds(fs);
    if (free.length < ks.length) return result(clone(fs), { err: 'ENOSPC', want: ks });
    var out = clone(fs), ot = findTree(out, tree);
    if (!out.writes[file]) out.writes[file] = {};
    if (!exists) ot.files[file] = [];
    var moved = [], allocated = [];
    ks.forEach(function (k, i) {
      var id = free[i];
      var v = out.writes[file][k] || 0;
      out.writes[file][k] = v + 1;
      out.blocks.push({ id: id, ver: label(k, v), refs: 0 });
      moved.push({ tree: tree, file: file, k: k, from: exists ? ot.files[file][k] : null, to: id });
      ot.files[file][k] = id;
      allocated.push(id);
    });
    out.blocks.sort(function (a, b) { return a.id - b.id; });
    var r = recount(out);
    return result(r.fs, { moved: moved, allocated: allocated, freed: r.freed, changed: r.changed });
  }

  /** Rules 1 and 7: a read-only copy of the live tree's pointers, listed after the older snapshots. No block. */
  function snapshot(fs, name, from) {
    var out = clone(fs), src = findTree(out, from || LIVE);
    out.trees.push({ name: name, readonly: true, files: clone(src.files) });
    var r = recount(out);
    return result(r.fs, { changed: r.changed });
  }

  /** Rule 4: the file's pointers leave the tree; blocks a snapshot still points to stay. */
  function rm(fs, tree, file) {
    var out = clone(fs), t = findTree(out, tree);
    if (!t || !Object.prototype.hasOwnProperty.call(t.files, file)) return result(clone(fs), { err: 'ENOENT' });
    if (t.readonly) return result(clone(fs), { err: 'EROFS' });
    delete t.files[file];
    var r = recount(out);
    return result(r.fs, { freed: r.freed, changed: r.changed });
  }

  /** Rule 5: the snapshot leaves; exactly the blocks only it pointed to are freed. */
  function destroy(fs, name) {
    var out = clone(fs);
    if (!findTree(out, name) || name === LIVE) return result(clone(fs), { err: 'ENOENT' });
    out.trees = out.trees.filter(function (t) { return t.name !== name; });
    var r = recount(out);
    return result(r.fs, { freed: r.freed, changed: r.changed });
  }

  /** The space table: per tree referenced (distinct blocks it points to) and exclusive (blocks only it points to);
      the pool's used, free and shared (refs ≥ 2). */
  function space(fs) {
    var refs = {};
    fs.blocks.forEach(function (b) { refs[b.id] = b.refs; });
    var trees = fs.trees.map(function (t) {
      var own = {};
      pointers(t).forEach(function (id) { own[id] = (own[id] || 0) + 1; });
      var ids = Object.keys(own).map(Number);
      return {
        name: t.name,
        referenced: ids.length,
        exclusive: ids.filter(function (id) { return own[id] === refs[id]; }).length
      };
    });
    var vol = fs.blocks.filter(function (b) { return b.id < fs.poolSize; });
    var used = vol.length;
    var out = {
      trees: trees, used: used, free: fs.poolSize - used, total: fs.poolSize,
      shared: vol.filter(function (b) { return b.refs >= 2; }).length
    };
    if (fs.diffSize) {                              // copy-on-write mode: the diff area beside the volume (rule V3)
      out.diffUsed = fs.blocks.length - used;
      out.diffFree = fs.diffSize - out.diffUsed;
      out.diffTotal = fs.diffSize;
    }
    return out;
  }

  /** The trees pointing to block id, live first, then snapshots oldest first. */
  function holders(fs, id) {
    return fs.trees.filter(function (t) { return pointers(t).indexOf(id) >= 0; }).map(function (t) { return t.name; });
  }

  // ── copy-on-write mode (win-vss; SPEC.md "Copy-on-write mode", rules V1–V7) ──

  /** Rules V2, V3, V6, V7: write logical blocks `idx` of `file` in the live tree in place. For each written block a
      shadow still points to, the old block is first copied to the lowest free diff-area id (in logical order) and
      every shadow pointer to it moves to the copy; then the new data overwrites the original. A block no shadow
      shares (already preserved, or no shadow) is overwritten with no copy. If the diff area has too few free blocks,
      the oldest shadow is dropped (rule V3) and the need is counted again, until it fits; `keep` names a shadow that
      is never dropped (the source of a restore; rule V6). A restore never runs out: the blocks it writes differ from
      the source, so every shadow sharing them can be dropped; the ENOSPC branch only guards a `keep` that does share
      a written block, which no caller passes. `vers` (k → label) writes old contents back (restore) instead of a new version. A new file
      (no such file yet, idx omitted) is written into the lowest free volume blocks, as in the host. */
  function writeInPlace(fs, tree, file, idx, n, opts) {
    opts = opts || {};
    var t = findTree(fs, tree);
    if (!t) return result(clone(fs), { err: 'ENOENT' });
    if (t.readonly) return result(clone(fs), { err: 'EROFS' });
    if (!Object.prototype.hasOwnProperty.call(t.files, file)) {
      var c = write(fs, tree, file, idx, n);
      return Object.assign(c, { copied: [], overwritten: [], dropped: [] });
    }
    var len = t.files[file].length, ks = [];
    for (var k = 0; k < len; k++) if (!idx || idx.indexOf(k) >= 0) ks.push(k);
    var out = clone(fs), dropped = [], freed = [];
    var need = function () {
      var lt = findTree(out, tree);
      return ks.filter(function (k) {
        var id = lt.files[file][k];
        return shadows(out).some(function (sh) { return pointers(sh).indexOf(id) >= 0; });
      });
    };
    var copyKs = need();
    while (diffFreeIds(out).length < copyKs.length) {
      var victim = shadows(out).filter(function (sh) { return sh.name !== opts.keep; })[0];
      if (!victim) return result(clone(fs), { err: 'ENOSPC', want: ks, copied: [], overwritten: [], dropped: [] });
      var d = destroy(out, victim.name);
      out = d.fs;
      dropped.push(victim.name);
      freed = freed.concat(d.freed);
      copyKs = need();
    }
    var lt = findTree(out, tree), free = diffFreeIds(out), copied = [], moved = [], allocated = [], overwritten = [];
    if (!out.writes[file]) out.writes[file] = {};
    copyKs.forEach(function (k, i) {
      var id = lt.files[file][k], to = free[i];
      out.blocks.push({ id: to, ver: findBlock(out, id).ver, refs: 0 });
      copied.push({ k: k, from: id, to: to });
      allocated.push(to);
      shadows(out).forEach(function (sh) {
        var f = sh.files[file];
        if (f && f[k] === id) { f[k] = to; moved.push({ tree: sh.name, file: file, k: k, from: id, to: to }); }
      });
    });
    ks.forEach(function (k) {
      var b = findBlock(out, lt.files[file][k]);
      if (opts.vers && opts.vers[k] !== undefined) b.ver = opts.vers[k];
      else { var v = out.writes[file][k] || 0; out.writes[file][k] = v + 1; b.ver = label(k, v); }
      overwritten.push(b.id);
    });
    out.blocks.sort(function (a, b) { return a.id - b.id; });
    var r = recount(out);
    var changed = r.changed.concat(freed.map(function (f) { return f.id; })).filter(function (id, i, a) { return a.indexOf(id) === i; }).sort(function (a, b) { return a - b; });
    return result(r.fs, { moved: moved, allocated: allocated, freed: freed.concat(r.freed), changed: changed,
      copied: copied, overwritten: overwritten, dropped: dropped });
  }

  /** Rule V4 tie-break: the newest surviving shadow taken before `before` ("HH:MM"); of two with the same time, the
      one taken later (the larger id: shadows keep creation order). null when there is none. */
  function pickShadow(fs, before) {
    var best = null;
    shadows(fs).forEach(function (sh) {
      if (!(sh.time < before)) return;
      if (!best || sh.time >= best.time) best = sh;                // later in the list wins a tie
    });
    return best ? best.name : null;
  }

  /** Rule V4: restore `file` in the live tree from shadow `from`: every block whose contents differ gets the shadow's
      contents back, written in place like any other write (so a newer shadow that shares the live block keeps its
      view: the current block is copied first). The source shadow is never dropped by this write. */
  function restore(fs, file, from) {
    var sh = findTree(fs, from), live = findTree(fs, LIVE);
    if (!sh || !sh.readonly || !sh.files[file] || !live.files[file]) return result(clone(fs), { err: 'ENOENT', copied: [], overwritten: [], dropped: [] });
    var vers = {}, ks = [];
    sh.files[file].forEach(function (id, k) {
      var old = findBlock(fs, id).ver, now = findBlock(fs, live.files[file][k]).ver;
      if (old !== now) { vers[k] = old; ks.push(k); }
    });
    if (!ks.length) return result(clone(fs), { copied: [], overwritten: [], dropped: [] });
    return writeInPlace(fs, LIVE, file, ks, undefined, { vers: vers, keep: from });
  }

  function norm(p) {
    var clamp = function (v, lo, hi, d) { v = Math.round(Number(v)); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
    return {
      scene: SCENES[p.scene] ? p.scene : 'basic',
      fileBlocks: clamp(p.fileBlocks, 4, 8, 8),
      poolSize: clamp(p.poolSize, 10, 24, 24)
    };
  }

  function mode(p) { return COW_SCENES.indexOf(norm(p).scene) >= 0 ? 'copy-on-write' : 'redirect-on-write'; }
  /** The diff area's size limit in blocks (copy-on-write mode), 2–8. */
  function diffLimit(p) {
    var v = Math.round(Number(p.diffLimit));
    return Number.isFinite(v) ? Math.min(8, Math.max(2, v)) : 8;
  }

  function script(p) { return SCENES[norm(p).scene]; }
  function steps(p) { return script(p).length; }
  /** Every tree the scene ever has, in row order (the page keeps a row for each so the stage does not jump). */
  function treeNames(p) {
    var out = [LIVE];
    script(p).forEach(function (o) { if (o.op === 'snapshot') out.push(o.name); });
    return out;
  }

  function fsOf(s) {
    var fs = { blocks: s.blocks, trees: s.trees, poolSize: s.poolSize, writes: s.writes };
    if (s.diffSize) fs.diffSize = s.diffSize;
    return fs;
  }

  var logic = {
    LIVE: LIVE,
    FILE: FILE,
    SCENES: SCENES,
    SCENE_IDS: SCENE_IDS,
    COW_SCENES: COW_SCENES,

    /** Parameter defaults. scene: the preset script; fileBlocks: blocks in file a; poolSize: physical blocks;
        diffLimit: the diff area's limit in blocks (copy-on-write scenes only). */
    defaults: { scene: 'basic', fileBlocks: 8, poolSize: 24, showRefs: true, diffLimit: 8 },

    steps: steps,
    script: script,
    treeNames: treeNames,
    mode: mode,
    diffLimit: diffLimit,

    /** Step 0: an empty pool and the live tree with no files. */
    initial: function (p) {
      var o = norm(p);
      var s = {
        blocks: [], trees: [{ name: LIVE, readonly: false, files: {} }], poolSize: o.poolSize, writes: {},
        op: null, err: null, event: 'start', moved: [], allocated: [], freed: [], changed: [], gone: []
      };
      if (mode(p) === 'copy-on-write') {
        s.diffSize = diffLimit(p);
        s.copied = []; s.overwritten = []; s.dropped = []; s.from = null;
      }
      return s;
    },

    /** Step n from step n − 1. */
    step: function (s, n, p) {
      var o = norm(p), op = script(p)[n - 1], cow = mode(p) === 'copy-on-write';
      var fs = fsOf(s), r, from = null;
      if (op.op === 'write') r = cow ? writeInPlace(fs, LIVE, op.file, op.idx, o.fileBlocks) : write(fs, LIVE, op.file, op.idx, o.fileBlocks);
      else if (op.op === 'snapshot') {
        r = snapshot(fs, op.name);
        if (op.time) findTree(r.fs, op.name).time = op.time;
      } else if (op.op === 'restore') {
        from = pickShadow(fs, op.before);
        r = from ? restore(fs, op.file, from) : result(clone(fs), { copied: [], overwritten: [], dropped: [] });
      } else if (op.op === 'rm') r = rm(fs, LIVE, op.file);
      else r = destroy(fs, op.name);
      var out = clone(s);
      out.blocks = r.fs.blocks; out.trees = r.fs.trees; out.writes = r.fs.writes;
      out.op = clone(op);
      out.err = r.err;
      out.want = r.want || [];
      out.moved = r.moved; out.allocated = r.allocated; out.freed = r.freed; out.changed = r.changed;
      out.event = r.err ? 'error' : op.op === 'write' ? (op.idx ? 'overwrite' : 'create')
        : op.op === 'restore' ? (from ? 'restore' : 'restore-none') : op.op;
      if (op.op === 'destroy' && !r.err) out.gone = out.gone.concat([op.name]);
      if (cow) {
        out.copied = r.copied || []; out.overwritten = r.overwritten || []; out.dropped = r.dropped || [];
        out.from = from;
        if (out.dropped.length) out.gone = out.gone.concat(out.dropped);
      }
      return out;
    },

    write: write,
    writeInPlace: writeInPlace,
    restore: restore,
    pickShadow: pickShadow,
    diffFreeIds: diffFreeIds,
    isDiff: isDiff,
    snapshot: snapshot,
    rm: rm,
    destroy: destroy,
    recount: recount,
    space: space,
    holders: holders,
    freeIds: freeIds,
    pointers: pointers,
    fsOf: fsOf,
    norm: norm
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
