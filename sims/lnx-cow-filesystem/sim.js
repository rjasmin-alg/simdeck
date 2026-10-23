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
   hold no words, so they can move to models/ unchanged (sto-cow-vs-row, win-vss as later presets, catalogue §5.2). */
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
    ]
  };
  var SCENE_IDS = Object.keys(SCENES);

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
    var used = fs.blocks.length;
    return {
      trees: trees, used: used, free: fs.poolSize - used, total: fs.poolSize,
      shared: fs.blocks.filter(function (b) { return b.refs >= 2; }).length
    };
  }

  /** The trees pointing to block id, live first, then snapshots oldest first. */
  function holders(fs, id) {
    return fs.trees.filter(function (t) { return pointers(t).indexOf(id) >= 0; }).map(function (t) { return t.name; });
  }

  function norm(p) {
    var clamp = function (v, lo, hi, d) { v = Math.round(Number(v)); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
    return {
      scene: SCENES[p.scene] ? p.scene : 'basic',
      fileBlocks: clamp(p.fileBlocks, 4, 8, 8),
      poolSize: clamp(p.poolSize, 10, 24, 24)
    };
  }

  function script(p) { return SCENES[norm(p).scene]; }
  function steps(p) { return script(p).length; }
  /** Every tree the scene ever has, in row order (the page keeps a row for each so the stage does not jump). */
  function treeNames(p) {
    var out = [LIVE];
    script(p).forEach(function (o) { if (o.op === 'snapshot') out.push(o.name); });
    return out;
  }

  function fsOf(s) { return { blocks: s.blocks, trees: s.trees, poolSize: s.poolSize, writes: s.writes }; }

  var logic = {
    LIVE: LIVE,
    FILE: FILE,
    SCENES: SCENES,
    SCENE_IDS: SCENE_IDS,

    /** Parameter defaults. scene: the preset script; fileBlocks: blocks in file a; poolSize: physical blocks. */
    defaults: { scene: 'basic', fileBlocks: 8, poolSize: 24, showRefs: true },

    steps: steps,
    script: script,
    treeNames: treeNames,

    /** Step 0: an empty pool and the live tree with no files. */
    initial: function (p) {
      var o = norm(p);
      return {
        blocks: [], trees: [{ name: LIVE, readonly: false, files: {} }], poolSize: o.poolSize, writes: {},
        op: null, err: null, event: 'start', moved: [], allocated: [], freed: [], changed: [], gone: []
      };
    },

    /** Step n from step n − 1. */
    step: function (s, n, p) {
      var o = norm(p), op = script(p)[n - 1];
      var fs = fsOf(s), r;
      if (op.op === 'write') r = write(fs, LIVE, op.file, op.idx, o.fileBlocks);
      else if (op.op === 'snapshot') r = snapshot(fs, op.name);
      else if (op.op === 'rm') r = rm(fs, LIVE, op.file);
      else r = destroy(fs, op.name);
      var out = clone(s);
      out.blocks = r.fs.blocks; out.trees = r.fs.trees; out.writes = r.fs.writes;
      out.op = clone(op);
      out.err = r.err;
      out.want = r.want || [];
      out.moved = r.moved; out.allocated = r.allocated; out.freed = r.freed; out.changed = r.changed;
      out.event = r.err ? 'error' : op.op === 'write' ? (op.idx ? 'overwrite' : 'create') : op.op;
      if (op.op === 'destroy' && !r.err) out.gone = out.gone.concat([op.name]);
      return out;
    },

    write: write,
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
