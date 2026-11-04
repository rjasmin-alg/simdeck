/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-zfs-self-heal: checksums in block pointers and a scrub that repairs from the mirror.
   Pool `tank`, vdev `mirror-0` of disks sda and sdb, 8 allocated data blocks (0–7) and 2 free ones (8, 9) per copy.
   Every block pointer stores the checksum of the block it points to, so a block is checked by its parent. A read takes
   the first copy, verifies it and, on a mismatch, the other copy; a good copy is returned and the bad one rewritten
   from it (self-healing). A scrub reads every copy of every allocated block. With no good copy the error is permanent.
   Contrasts: a single disk detects but cannot repair (unless copies=2); an md RAID 1 has no checksums, so it cannot
   tell which copy is right.
   Rules: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it.
   Builds on sims/lnx-cow-filesystem (its block grid and tree of pointers, a write never in place); no function of
   that model is needed here, so nothing is copied from its sim.js (NOTES.md). */
(function (root) {
  'use strict';

  var BLOCKS = 10;                       // per copy: 0–7 allocated, 8–9 free
  var LETTERS = 'ABCDEFGH';              // the content of data block k (one byte, for the picture)
  var FILES = [
    { name: 'log.txt', blocks: [0, 1, 2] },
    { name: 'film.mkv', blocks: [3, 4, 5, 6] },
    { name: 'todo.md', blocks: [7] }
  ];
  var ALLOCATED = [0, 1, 2, 3, 4, 5, 6, 7];
  var SECTORS = 8;                       // a 4K block is 8 sectors of 512 bytes (md's mismatch_cnt counts sectors;
                                         // real raid1 counts its whole resync window, SPEC.md "Deviations")
  var REDUNDANCY = ['mirror', 'single', 'md-mirror'];

  function scrubAll() { return ALLOCATED.map(function (b) { return { op: 'scrub', block: b }; }); }
  function reads(list) { return list.map(function (b) { return { op: 'read', block: b }; }); }

  /** The preset scripts (SPEC.md "Presets"): one action or one scrubbed block per step. `copy` is the copy index
      (0: sda, 1: sdb, or sda's second copy with copies=2); with fewer copies it wraps (rule 8). */
  var SCENES = {
    'scrub-repairs': [{ op: 'corrupt', copy: 1, block: 3 }, { op: 'corrupt', copy: 1, block: 5 }].concat(scrubAll()),
    'read-heals': [{ op: 'corrupt', copy: 0, block: 4 }].concat(reads([3, 4, 5, 6, 4])),
    'both-bad': [{ op: 'corrupt', copy: 0, block: 6 }, { op: 'corrupt', copy: 1, block: 6 }].concat(scrubAll()),
    'single-disk': [{ op: 'corrupt', copy: 0, block: 3 }].concat(reads([3, 4, 5, 6, 3])),
    'md-contrast': [{ op: 'corrupt', copy: 0, block: 3 }].concat(reads([3, 3]),
      [{ op: 'check' }, { op: 'repair' }], reads([3]))
  };
  var SCENE_IDS = Object.keys(SCENES);

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** Rule 1: the checksum the pointer stores (a toy 16-bit FNV-1a standing for fletcher4/sha256, shown as 4 hex
      digits). Any change of the content gives a different sum for every content in this model (tested). */
  function checksum(data) {
    var s = 'blk:' + data, h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    var x = ((h >>> 16) ^ (h & 0xffff)) >>> 0;
    return ('0000' + x.toString(16)).slice(-4);
  }

  /** The original content of block b ('' for a free block). */
  function good(b) { return b < LETTERS.length ? LETTERS.charAt(b) : ''; }
  /** Bit rot: one bit of the byte flips (0x20: D → d). */
  function rot(data) { return String.fromCharCode(data.charCodeAt(0) ^ 0x20); }

  function fileOf(b) { for (var i = 0; i < FILES.length; i++) if (FILES[i].blocks.indexOf(b) >= 0) return FILES[i].name; return null; }

  function norm(p) {
    p = p || {};
    return {
      scene: SCENES[p.scene] ? p.scene : 'scrub-repairs',
      redundancy: REDUNDANCY.indexOf(p.redundancy) >= 0 ? p.redundancy : 'mirror',
      copies2: !!p.copies2
    };
  }

  /** The copies of every block: two disks for a mirror, one for a single disk (two copies on it with copies=2). */
  function layout(p) {
    var o = norm(p);
    if (o.redundancy === 'single') return o.copies2 ? [{ dev: 'sda', copy: 1 }, { dev: 'sda', copy: 2 }] : [{ dev: 'sda', copy: 1 }];
    return [{ dev: 'sda', copy: 1 }, { dev: 'sdb', copy: 1 }];
  }
  function devices(p) { var out = []; layout(p).forEach(function (c) { if (out.indexOf(c.dev) < 0) out.push(c.dev); }); return out; }
  function hasSums(s) { return s.redundancy !== 'md-mirror'; }

  function script(p) { return SCENES[norm(p).scene]; }
  function steps(p) { return script(p).length; }

  function initial(p) {
    var o = norm(p), counters = {};
    devices(p).forEach(function (d) { counters[d] = { read: 0, write: 0, cksum: 0 }; });
    counters.top = { read: 0, write: 0, cksum: 0 };       // the pool and vdev lines: blocks no copy could serve
    var blocks = [];
    for (var b = 0; b < BLOCKS; b++) blocks.push({ data: good(b), rotten: false, healed: false });
    return {
      redundancy: o.redundancy,
      disks: layout(p).map(function (c) { return { name: c.dev, copy: c.copy, blocks: clone(blocks) }; }),
      // rule 1: a pointer per allocated block, with the checksum of the block it points to (md: no checksum)
      ptrs: ALLOCATED.map(function (b) { return { block: b, sum: o.redundancy === 'md-mirror' ? null : checksum(good(b)) }; }),
      counters: counters,
      scrub: null,                                        // { at, done, repaired, errors, kind }
      permanent: [],                                      // blocks no copy could serve (rule 4)
      mismatch: 0,                                        // md: mismatch_cnt, in sectors (rule 6)
      sync: 'idle',                                       // md: sync_action
      mdReads: 0,                                         // md: reads so far (tie-break for the copy md reads)
      last: { op: 'start' }
    };
  }

  function ptrOf(s, b) { for (var i = 0; i < s.ptrs.length; i++) if (s.ptrs[i].block === b) return s.ptrs[i]; return null; }
  /** Rule 1: copy k of block b checked against the sum its pointer stores. */
  function verify(s, k, b) {
    var sum = checksum(s.disks[k].blocks[b].data);
    return { copy: k, sum: sum, ok: sum === ptrOf(s, b).sum };
  }
  function rewrite(s, to, from, b) {
    var src = s.disks[from].blocks[b], dst = s.disks[to].blocks[b];
    dst.data = src.data;
    dst.rotten = src.data !== good(b);
    dst.healed = true;
  }
  function addPermanent(s, b) { if (s.permanent.indexOf(b) < 0) s.permanent.push(b); s.permanent.sort(function (x, y) { return x - y; }); }

  /** Rules 2, 4, 5, 7: verify the copies in order (first device first) until one matches; count a CKSUM error on
      the device of each bad copy read; rewrite the bad ones from the good copy; with none good, the block is a
      permanent error, counted once on the pool line. `all`: read every copy even after a good one (scrub, rule 3). */
  function zfsBlock(s, b, all) {
    var res = { block: b, read: [], wrote: [], from: null, result: 'ok' };
    var goodK = null;
    for (var k = 0; k < s.disks.length; k++) {
      if (!all && goodK !== null) break;
      var v = verify(s, k, b);
      res.read.push(v);
      if (v.ok) { if (goodK === null) goodK = k; } else s.counters[s.disks[k].name].cksum++;
    }
    var bad = res.read.filter(function (v) { return !v.ok; }).map(function (v) { return v.copy; });
    if (goodK === null) {
      res.result = 'permanent';
      s.counters.top.cksum++;
      addPermanent(s, b);
    } else if (bad.length) {
      bad.forEach(function (k) { rewrite(s, k, goodK, b); });
      res.wrote = bad; res.from = goodK; res.result = 'healed';
    }
    res.served = goodK;
    return res;
  }

  /** Rule 6: md compares the copies; no checksum says which one is right. */
  function differs(s, b) { return s.disks[0].blocks[b].data !== s.disks[1].blocks[b].data; }

  function startScrub(s, kind) {
    if (!s.scrub || s.scrub.done || s.scrub.kind !== kind) s.scrub = { at: null, done: false, repaired: 0, errors: 0, kind: kind };
  }

  function doCorrupt(s, op) {
    var k = op.copy % s.disks.length, cell = s.disks[k].blocks[op.block];
    var again = cell.rotten;
    if (!again) { cell.data = rot(good(op.block)); cell.rotten = true; cell.healed = false; }
    return { op: 'corrupt', block: op.block, copy: k, again: again, wrote: again ? [] : [k], read: [] };
  }

  function doRead(s, op) {
    var b = op.block;
    if (!hasSums(s)) {                                    // md: read one copy, return it unchecked (tie-break rule 7)
      var k = s.mdReads % s.disks.length;
      s.mdReads++;
      var cell = s.disks[k].blocks[b];
      return { op: 'read', block: b, read: [{ copy: k, sum: null, ok: null }], wrote: [], served: k,
        result: cell.rotten ? 'silent-bad' : 'ok' };
    }
    var r = zfsBlock(s, b, false);
    r.op = 'read';
    return r;
  }

  function doScrub(s, op) {
    var b = op.block, last = b === ALLOCATED[ALLOCATED.length - 1];
    if (!hasSums(s)) {                                    // md: the walk is a check, block by block (rule 6)
      startScrub(s, 'check');
      if (s.scrub.at === null) s.mismatch = 0;
      s.sync = 'check';
      var diff = differs(s, b);
      if (diff) s.mismatch += SECTORS;
      s.scrub.at = b;
      var extra = [];
      if (last) {                                         // md reads the whole device, free blocks too
        for (var f = b + 1; f < BLOCKS; f++) { extra.push(f); if (differs(s, f)) s.mismatch += SECTORS; }
        s.scrub.done = true; s.sync = 'idle';
      }
      return { op: 'scrub', block: b, read: [{ copy: 0 }, { copy: 1 }], wrote: [], result: diff ? 'mismatch' : 'same', extra: extra, done: last };
    }
    startScrub(s, 'zfs');
    var r = zfsBlock(s, b, true);
    s.scrub.at = b;
    s.scrub.repaired += r.wrote.length;
    if (r.result === 'permanent') s.scrub.errors++;
    if (last) s.scrub.done = true;
    r.op = 'scrub'; r.done = last;
    return r;
  }

  /** A whole pass in one step: md check (compare only) or md repair (rule 6: the first device's copy is written over
      the others, right or wrong); on ZFS both are a whole scrub (rule 3: it always repairs). */
  function doPass(s, op) {
    var list = [];
    if (!hasSums(s)) {
      s.mismatch = 0;
      s.scrub = { at: BLOCKS - 1, done: true, repaired: 0, errors: 0, kind: op.op };
      var blocks = [];
      for (var b = 0; b < BLOCKS; b++) {
        if (!differs(s, b)) continue;
        s.mismatch += SECTORS;
        blocks.push(b);
        if (op.op === 'repair') { rewrite(s, 1, 0, b); s.scrub.repaired++; }
      }
      return { op: op.op, blocks: blocks, wrote: op.op === 'repair' ? [1] : [], read: [], all: BLOCKS };
    }
    s.scrub = { at: null, done: false, repaired: 0, errors: 0, kind: 'zfs' };
    ALLOCATED.forEach(function (b) {
      var r = zfsBlock(s, b, true);
      s.scrub.repaired += r.wrote.length;
      if (r.result === 'permanent') s.scrub.errors++;
      list.push(r);
    });
    s.scrub.at = ALLOCATED[ALLOCATED.length - 1];
    s.scrub.done = true;
    return { op: op.op, blocks: list.filter(function (r) { return r.result !== 'ok'; }).map(function (r) { return r.block; }),
      results: list, read: [], wrote: [] };
  }

  /** Step n from step n − 1. */
  function step(prev, n, p) {
    var s = clone(prev), op = script(p)[n - 1];
    var last;
    if (op.op === 'corrupt') last = doCorrupt(s, op);
    else if (op.op === 'read') last = doRead(s, op);
    else if (op.op === 'scrub') last = doScrub(s, op);
    else last = doPass(s, op);
    s.last = last;
    return s;
  }

  /** The files with a permanent error, once each (rule 4, tie-break rule 7). */
  function permanentFiles(s) {
    var out = [];
    s.permanent.forEach(function (b) { var f = fileOf(b); if (f && out.indexOf(f) < 0) out.push(f); });
    return out;
  }

  /** Rule 3: the blocks a scrub reads: allocated ones only, in order. */
  function scrubPlan() { return ALLOCATED.slice(); }

  var logic = {
    BLOCKS: BLOCKS,
    FILES: FILES,
    ALLOCATED: ALLOCATED,
    SECTORS: SECTORS,
    SCENES: SCENES,
    SCENE_IDS: SCENE_IDS,
    REDUNDANCY: REDUNDANCY,

    /** Parameter defaults. scene: the preset script (hidden); redundancy: the layout; copies2: two copies per block
        on a single disk. */
    defaults: { scene: 'scrub-repairs', redundancy: 'mirror', copies2: false },

    steps: steps,
    script: script,
    initial: initial,
    step: step,

    checksum: checksum,
    good: good,
    rot: rot,
    fileOf: fileOf,
    layout: layout,
    devices: devices,
    permanentFiles: permanentFiles,
    scrubPlan: scrubPlan,
    norm: norm
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
