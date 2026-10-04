/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for backing-chains: a virtual disk of 8 blocks as a chain of image files. The base image at the bottom, an
   overlay per snapshot on top of it, each backing on the one below; the VM writes only to the active (top) layer and
   a read falls down the chain until a layer has the block. Then the middle layer is committed (merged down),
   streamed (pulled up) or its file deleted without a merge, which breaks every layer above it.
   Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. The chain operations
   (readPath, view, write, snapshot, commitCopy, repoint, remove, commit, streamCopy, stream, deleteFile) are pure
   functions over a plain array of layers and hold no words, so they can move to models/ unchanged
   (lnx-lvm-snapshot, lnx-cow-filesystem, win-ad-backup-restore). */
(function (root) {
  'use strict';

  var BLOCKS = 8;
  var FORMATS = ['qcow2', 'vhdx', 'vmdk'];
  var ENDINGS = ['none', 'commit', 'stream', 'delete'];

  /** File names per format and layer id (the overlay of the k-th snapshot is file k). VHDX GUIDs are shortened. */
  var FILES = {
    qcow2: { base: 'base.qcow2', s1: 's1.qcow2', s2: 's2.qcow2' },
    vhdx: { base: 'disk.vhdx', s1: 'disk_9c1e.avhdx', s2: 'disk_4b7d.avhdx' },
    vmdk: { base: 'disk.vmdk', s1: 'disk-000001.vmdk', s2: 'disk-000002.vmdk' }
  };

  /** The base image: blocks 0–3 hold A B C D, 4–7 were never written. */
  var BASE = { 0: 'A', 1: 'B', 2: 'C', 3: 'D' };

  /** The chain the presets build: snapshot, two writes, snapshot, two writes (SPEC.md, preset read-through). */
  var BUILD = [
    { op: 'snapshot' }, { op: 'write', b: 1, v: 'B1' }, { op: 'write', b: 4, v: 'E1' },
    { op: 'snapshot' }, { op: 'write', b: 1, v: 'B2' }, { op: 'write', b: 2, v: 'C2' }
  ];

  /** The blocks read at the end of each ending (rule 1 shown per layer visited). */
  var READS = { none: [0, 1, 4, 5], commit: [4, 1], stream: [4, 1], delete: [4] };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function find(layers, id) { for (var i = 0; i < layers.length; i++) if (layers[i].id === id) return layers[i]; return null; }
  function has(layer, b) { return Object.prototype.hasOwnProperty.call(layer.blocks, b); }
  function idx(layer) { return Object.keys(layer.blocks).map(Number).sort(function (a, b) { return a - b; }); }
  /** Layers that back directly on `id`. */
  function children(layers, id) { return layers.filter(function (l) { return l.backing === id; }); }

  /** Rule 1: the path a read of block b takes from layer `top` down the chain. Returns { path: ids visited,
      hit: id | null, value: label | null, fail: id of a missing file | null }. No layer has it: zeros (value null). */
  function readPath(layers, top, b) {
    var path = [], id = top;
    while (id !== null) {
      var l = find(layers, id);
      path.push(id);
      if (!l || l.missing) return { path: path, hit: null, value: null, fail: id };
      if (has(l, b)) return { path: path, hit: id, value: l.blocks[b], fail: null };
      id = l.backing;
    }
    return { path: path, hit: null, value: null, fail: null };
  }

  /** What the VM sees from `top`: per block { v, from, fail } (v null = zeros). */
  function view(layers, top) {
    var out = [];
    for (var b = 0; b < BLOCKS; b++) {
      var r = readPath(layers, top, b);
      out.push({ v: r.value, from: r.hit, fail: r.fail !== null });
    }
    return out;
  }

  /** Rule 8: the image opens only when every file down the chain from `top` is there. */
  function opens(layers, top) {
    for (var id = top; id !== null;) {
      var l = find(layers, id);
      if (!l || l.missing) return false;
      id = l.backing;
    }
    return true;
  }

  /** Rule 2: a write goes to the active layer only. */
  function write(layers, active, b, v) {
    var out = clone(layers);
    find(out, active).blocks[b] = v;
    return out;
  }

  /** Rule 3: the active layer becomes read-only; a new empty overlay backs on it. */
  function snapshot(layers, active, id, file) {
    var out = clone(layers);
    find(out, active).readOnly = true;
    out.push({ id: id, file: file, backing: active, blocks: {}, readOnly: false });
    return out;
  }

  /** Rule 7: why committing L into its backing is refused, or null. */
  function commitRefused(layers, L) {
    var l = find(layers, L);
    if (!l || l.backing === null) return 'base';
    if (children(layers, l.backing).length > 1) return 'branch';
    return null;
  }

  /** Rules 4 and 6, phase 1: every block of L is copied into its backing P; L's block wins. Returns the copied ids. */
  function commitCopy(layers, L) {
    var out = clone(layers), l = find(out, L), p = find(out, l.backing);
    var copied = idx(l);
    copied.forEach(function (b) { p.blocks[b] = l.blocks[b]; });
    return { layers: out, copied: copied };
  }

  /** Phase 2 of commit and stream: every child of L backs on `to` instead. */
  function repoint(layers, L, to) {
    var out = clone(layers);
    children(out, L).forEach(function (c) { c.backing = to; });
    return out;
  }

  /** Phase 3: L leaves the chain. */
  function remove(layers, L) { return clone(layers).filter(function (l) { return l.id !== L; }); }

  /** Rule 4 in one call (refused under rule 7: the layers come back unchanged with the reason). */
  function commit(layers, L) {
    var why = commitRefused(layers, L);
    if (why) return { layers: clone(layers), refused: why };
    var P = find(layers, L).backing;
    return { layers: remove(repoint(commitCopy(layers, L).layers, L, P), L), refused: null };
  }

  /** Rules 5 and 6, phase 1: blocks of L that C lacks are copied into C; C's own block wins. Returns the copied ids. */
  function streamCopy(layers, L, C) {
    var out = clone(layers), l = find(out, L), c = find(out, C);
    var copied = idx(l).filter(function (b) { return !has(c, b); });
    copied.forEach(function (b) { c.blocks[b] = l.blocks[b]; });
    return { layers: out, copied: copied, kept: idx(l).filter(function (b) { return copied.indexOf(b) < 0; }) };
  }

  /** Rule 5 in one call: C pulls L up and backs on L's backing. */
  function stream(layers, L, C) {
    var into = find(layers, L).backing;
    return remove(repoint(streamCopy(layers, L, C).layers, L, into), L);
  }

  /** Rule 8: L's file is gone without a merge. Returns the layers (L marked missing) and the ids broken above it. */
  function deleteFile(layers, L) {
    var out = clone(layers);
    var l = find(out, L);
    l.missing = true;
    l.lost = l.blocks;
    l.blocks = {};
    var broken = [], todo = [L];
    while (todo.length) {
      children(out, todo.shift()).forEach(function (c) { broken.push(c.id); todo.push(c.id); });
    }
    return { layers: out, broken: broken };
  }

  /** Params → clean values. */
  function norm(p) {
    return {
      format: FORMATS.indexOf(p.format) >= 0 ? p.format : 'qcow2',
      ending: ENDINGS.indexOf(p.ending) >= 0 ? p.ending : 'none',
      compact: !!p.compact
    };
  }

  function baseLayers(format) {
    return [{ id: 'base', file: FILES[format].base, backing: null, blocks: clone(BASE), readOnly: false }];
  }

  /** Apply one build op to { layers, active, snaps }. */
  function applyBuild(c, op, format) {
    if (op.op === 'snapshot') {
      var id = 's' + (c.snaps + 1);
      return { layers: snapshot(c.layers, c.active, id, FILES[format][id]), active: id, snaps: c.snaps + 1 };
    }
    return { layers: write(c.layers, c.active, op.b, op.v), active: c.active, snaps: c.snaps };
  }

  /** The step script: one entry per step (SPEC.md "One step"). Reads expand to one entry per layer the probe visits,
      counted on the chain as it stands after the ending. */
  function script(p) {
    var o = norm(p), out = [];
    var c = { layers: baseLayers(o.format), active: 'base', snaps: 0 };
    BUILD.forEach(function (op) { c = applyBuild(c, op, o.format); });
    if (o.compact) out.push({ op: 'build' });
    else BUILD.forEach(function (op) { out.push(op); });
    var after = c.layers;
    if (o.ending === 'commit') {
      out.push({ op: 'commit', phase: 'copy' }, { op: 'commit', phase: 'repoint' }, { op: 'commit', phase: 'remove' });
      after = commit(after, 's1').layers;
    } else if (o.ending === 'stream') {
      out.push({ op: 'stream', phase: 'copy' }, { op: 'stream', phase: 'repoint' }, { op: 'stream', phase: 'remove' });
      after = stream(after, 's1', 's2');
    } else if (o.ending === 'delete') {
      out.push({ op: 'delete' });
      after = deleteFile(after, 's1').layers;
    }
    READS[o.ending].forEach(function (b) {
      var len = readPath(after, c.active, b).path.length;
      for (var k = 0; k < len; k++) out.push({ op: 'read', b: b, k: k, last: k === len - 1 });
    });
    return out;
  }

  function steps(p) { return script(p).length; }

  var logic = {
    BLOCKS: BLOCKS,
    FORMATS: FORMATS,
    ENDINGS: ENDINGS,
    FILES: FILES,
    BUILD: BUILD,
    READS: READS,

    /** Parameter defaults. ending: what happens to the middle layer s1; compact: the chain is built in one step. */
    defaults: { format: 'qcow2', ending: 'none', compact: false, showView: true },

    steps: steps,
    script: script,

    /** Step 0: the base image alone, written to by the VM. */
    initial: function (p) {
      var o = norm(p);
      return {
        format: o.format, layers: baseLayers(o.format), active: 'base', snaps: 0,
        probe: null, broken: [], phase: 'start', op: null, changed: [], repointed: null, copied: [], kept: [], log: []
      };
    },

    /** Step n from step n − 1. */
    step: function (s, n, p) {
      var o = norm(p), op = script(p)[n - 1];
      var out = clone(s);
      out.op = op; out.changed = []; out.repointed = null; out.copied = []; out.kept = [];
      if (op.op !== 'read') out.probe = null;
      if (op.op === 'build' || op.op === 'snapshot' || op.op === 'write') {
        (op.op === 'build' ? BUILD : [op]).forEach(function (b) {
          var c = applyBuild({ layers: out.layers, active: out.active, snaps: out.snaps }, b, o.format);
          out.layers = c.layers; out.active = c.active; out.snaps = c.snaps;
        });
        out.phase = op.op;
        if (op.op === 'write') out.changed = [{ layer: out.active, b: op.b }];
        out.log.push(op.op === 'write' ? 'write ' + op.b : op.op);
        return out;
      }
      if (op.op === 'commit' || op.op === 'stream') {
        out.phase = op.op + '-' + op.phase;
        var L = 's1', l = find(out.layers, L), C = children(out.layers, L)[0];
        if (op.phase === 'copy') {
          var r = op.op === 'commit' ? commitCopy(out.layers, L) : streamCopy(out.layers, L, C.id);
          var into = op.op === 'commit' ? l.backing : C.id;
          out.layers = r.layers;
          out.changed = r.copied.map(function (b) { return { layer: into, b: b }; });
          out.copied = r.copied;
          out.kept = op.op === 'stream' ? r.kept : [];
        } else if (op.phase === 'repoint') {
          out.repointed = { child: C.id, from: L, to: l.backing };
          out.layers = repoint(out.layers, L, l.backing);
        } else {
          out.layers = remove(out.layers, L);
        }
        out.log.push(op.op + ' ' + op.phase);
        return out;
      }
      if (op.op === 'delete') {
        out.phase = 'delete';
        var d = deleteFile(out.layers, 's1');
        out.layers = d.layers;
        out.broken = d.broken;
        out.log.push('delete');
        return out;
      }
      // read: the probe visits one more layer
      var rp = readPath(out.layers, out.active, op.b);
      out.phase = 'read';
      out.probe = {
        block: op.b, path: rp.path.slice(0, op.k + 1),
        result: op.last ? (rp.fail ? 'fail' : rp.hit ? 'hit' : 'zero') : null,
        value: op.last ? rp.value : null, at: rp.path[op.k]
      };
      if (op.last) out.log.push('read ' + op.b);
      return out;
    },

    readPath: readPath,
    view: view,
    opens: opens,
    write: write,
    snapshot: snapshot,
    commitRefused: commitRefused,
    commitCopy: commitCopy,
    repoint: repoint,
    remove: remove,
    commit: commit,
    streamCopy: streamCopy,
    stream: stream,
    deleteFile: deleteFile,
    children: children,
    norm: norm
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
