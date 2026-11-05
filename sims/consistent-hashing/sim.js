/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for consistent-hashing: the same 1000 keys placed on n nodes twice, by hash(key) mod n and on a hash ring
   (each key owned by the next node point clockwise), before and after a change from `from` nodes to `nodes` nodes.
   Rules and expected numbers: SPEC.md. An explorer: the state is a pure function of the params.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. The ring and hash functions are pure and promotable to models/. */
(function (root) {
  'use strict';

  var KEYS = 1000;
  var MIN_NODES = 2, MAX_NODES = 10;
  var NAMES = 'ABCDEFGHIJ';
  var SPACE = 4294967296; // 2^32, the size of the hash space (the ring's circumference)

  // ── rule 1: one fixed 32-bit hash for keys and node points ──

  /** FNV-1a, 32 bits, over the UTF-8 bytes of s (offset basis 0x811c9dc5, prime 0x01000193). */
  function fnv1a(s) {
    var bytes = utf8(s);
    var h = 0x811c9dc5;
    for (var i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  /** murmur3's 32-bit finaliser: spreads FNV-1a's output so that "key-1", "key-2", … land far apart. */
  function fmix32(h) {
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35) >>> 0;
    h ^= h >>> 16;
    return h >>> 0;
  }

  function utf8(s) {
    var out = [];
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }

  /** The sim's hash: fmix32(FNV-1a(s)), an integer in [0, 2^32). */
  function hash(s) { return fmix32(fnv1a(String(s))); }

  // ── names: data, the same in both languages (the numbers depend on them) ──

  function keyName(i) { return 'key-' + i; }
  function nodeName(i) { return NAMES.charAt(i); }
  /** Point j of node i on the ring; point 0 is the node point, 1 … vnodes − 1 its virtual points. */
  function pointName(i, j) { return nodeName(i) + '-' + j; }

  var keyHashes = null;
  /** The hashes of the 1000 keys (computed once). */
  function keys() {
    if (!keyHashes) {
      keyHashes = [];
      for (var i = 0; i < KEYS; i++) keyHashes.push(hash(keyName(i)));
    }
    return keyHashes;
  }

  // ── rule 2: mod-n ──

  /** Owner of a key with hash h among n nodes: node index h mod n. */
  function modOwner(h, n) { return h % n; }

  // ── rules 3 and 6: the ring ──

  /** The ring's points for n nodes with v points each, sorted clockwise: by hash, then node id, then point index
      (rule 6: two points on the same hash, the lower node id first). Each point: { h, node, j }. */
  function ringPoints(n, v) {
    var pts = [];
    for (var i = 0; i < n; i++) for (var j = 0; j < v; j++) pts.push({ h: hash(pointName(i, j)), node: i, j: j });
    return sortPoints(pts);
  }

  function sortPoints(pts) {
    return pts.slice().sort(function (a, b) { return (a.h - b.h) || (a.node - b.node) || (a.j - b.j); });
  }

  /** Index into sorted points of the first point at or after h, clockwise; past the last point it wraps to 0
      (rule 3). A key exactly on a point belongs to that point (rule 6). */
  function successor(pts, h) {
    var lo = 0, hi = pts.length;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (pts[mid].h < h) lo = mid + 1; else hi = mid;
    }
    return lo === pts.length ? 0 : lo;
  }

  /** Owner (node index) of a key with hash h on the ring of sorted points. */
  function ringOwner(pts, h) { return pts[successor(pts, h)].node; }

  // ── one layout: owners and loads for n nodes with v points per node ──

  function layout(n, v) {
    var ks = keys();
    var pts = ringPoints(n, v);
    var mod = [], ring = [];
    for (var i = 0; i < ks.length; i++) { mod.push(modOwner(ks[i], n)); ring.push(ringOwner(pts, ks[i])); }
    return { points: pts, owner: { mod: mod, ring: ring }, load: { mod: count(mod, n), ring: count(ring, n) } };
  }

  /** Keys per node, as an array indexed by node. */
  function count(owner, n) {
    var c = [];
    for (var i = 0; i < n; i++) c.push(0);
    owner.forEach(function (o) { c[o]++; });
    return c;
  }

  /** Indices of the keys whose owner differs between a and b. */
  function movedKeys(a, b) {
    var out = [];
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) out.push(i);
    return out;
  }

  /** Keys that arrived at each node (moved there from another node), as an array indexed by node. */
  function arrivals(before, after, n) {
    var c = [];
    for (var i = 0; i < n; i++) c.push(0);
    for (var k = 0; k < after.length; k++) if (before[k] !== after[k]) c[after[k]]++;
    return c;
  }

  function clampNodes(x) { return Math.max(MIN_NODES, Math.min(MAX_NODES, Math.round(Number(x) || MIN_NODES))); }

  /** The ideal number of keys to move for a change from a to b nodes: |b − a| / max(a, b) of all keys. */
  function ideal(a, b) {
    return { num: Math.abs(b - a), den: Math.max(a, b), keys: Math.round(KEYS * Math.abs(b - a) / Math.max(a, b)) };
  }

  var cache = {};
  function layoutCached(n, v) {
    var k = n + '/' + v;
    if (!cache[k]) cache[k] = layout(n, v);
    return cache[k];
  }

  var logic = {
    KEYS: KEYS, MIN_NODES: MIN_NODES, MAX_NODES: MAX_NODES, SPACE: SPACE,

    /** nodes: node count now; from: node count before the last change (equal = no change yet);
        vnodes: points per node on the ring. */
    defaults: { nodes: 4, from: 4, vnodes: 1 },

    /** Explorer: no steps. */
    steps: 0,

    /** The whole state for the params (SPEC.md, State). Node ids are indices 0 … n − 1, named A … J. */
    initial: function (p) {
      var n = clampNodes(p.nodes), f = clampNodes(p.from), v = Number(p.vnodes) || 1;
      var now = layoutCached(n, v), before = layoutCached(f, v);
      var movedMod = movedKeys(before.owner.mod, now.owner.mod);
      var movedRing = movedKeys(before.owner.ring, now.owner.ring);
      var nodes = [];
      for (var i = 0; i < n; i++) nodes.push(i);
      // A deep copy: the layouts are cached and shared, the state must not be.
      return JSON.parse(JSON.stringify({
        nodes: nodes,
        from: f,
        vnodes: v,
        points: now.points,
        before: { points: before.points, load: before.load },
        owner: now.owner,
        load: now.load,
        arrived: { mod: arrivals(before.owner.mod, now.owner.mod, n), ring: arrivals(before.owner.ring, now.owner.ring, n) },
        gave: { mod: arrivals(now.owner.mod, before.owner.mod, f), ring: arrivals(now.owner.ring, before.owner.ring, f) },
        moved: { mod: movedMod, ring: movedRing },
        movedLast: { mod: movedMod.length, ring: movedRing.length },
        ideal: ideal(f, n),
        keyHashes: keys()
      }));
    },

    /** Params after pressing "add node" or "remove node" (delta +1 / −1): the old count becomes `from`. Null when the
        count is already at its bound. */
    change: function (p, delta) {
      var n = clampNodes(p.nodes);
      if (n + delta < MIN_NODES || n + delta > MAX_NODES) return null;
      return { from: n, nodes: n + delta };
    },

    /** The node carrying the most and the fewest keys in a load array (ties: the lower id). */
    extremes: function (load) {
      var hi = 0, lo = 0;
      for (var i = 1; i < load.length; i++) {
        if (load[i] > load[hi]) hi = i;
        if (load[i] < load[lo]) lo = i;
      }
      return { max: hi, min: lo };
    },

    /** Presets (SPEC.md, Presets); the page adds the labels. */
    presets: [
      { id: 'mod-n-add', params: { from: 4, nodes: 5, vnodes: 1 } },
      { id: 'ring-add-1vnode', params: { from: 4, nodes: 5, vnodes: 1 } },
      { id: 'ring-add-100vnodes', params: { from: 4, nodes: 5, vnodes: 100 } },
      { id: 'remove-node', params: { from: 5, nodes: 4, vnodes: 100 } }
    ],

    hash: hash, fnv1a: fnv1a, fmix32: fmix32, keyName: keyName, nodeName: nodeName, pointName: pointName,
    modOwner: modOwner, ringPoints: ringPoints, sortPoints: sortPoints, successor: successor, ringOwner: ringOwner,
    movedKeys: movedKeys, ideal: ideal, count: count
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
