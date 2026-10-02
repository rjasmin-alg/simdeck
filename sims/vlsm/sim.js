/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for vlsm: six units of Grafo d.o.o. share 192.168.1.0/24 (URM book, ch. 9, Primjer 1 and 2). Each unit gets the
   smallest block that holds its hosts, the blocks are ordered (largest first, smallest first, or one fixed mask for
   all), and each is placed at the next start that is a multiple of its own size. The steps follow the book's
   procedure: needs, block sizes, order, one block per step, the result.
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. The arithmetic (prefixFor, blockSize, order,
   allocate) is pure functions over numbers and arrays with no strings, so it can move to models/ unchanged when
   win-ipam-address-plan (catalogue §5.21) reuses it. */
(function (root) {
  'use strict';

  var MAX_PREFIX = 30;   // /31 (RFC 3021, the book's Primjer 3) is the link-only exception; the original stops at /30
  var SPACE = 256;       // a /24: addresses .0 to .255
  var BASE = 3232235776; // 192.168.1.0

  /** The smallest block that holds `hosts` usable addresses: the largest n ≤ 30 with 2^(32 − n) − 2 ≥ hosts. */
  function prefixFor(hosts) {
    for (var n = MAX_PREFIX; n >= 1; n--) if (Math.pow(2, 32 - n) - 2 >= hosts) return n;
    return 1;
  }

  /** Addresses in a block of prefix n: 2^(32 − n). */
  function blockSize(n) { return Math.pow(2, 32 - n); }

  /** Usable addresses in a block of prefix n: the network and broadcast addresses left out. */
  function usable(n) { return blockSize(n) - 2; }

  /** The mask of a prefix length, as an unsigned 32-bit number. */
  function mask(n) { return n <= 0 ? 0 : (0xffffffff << (32 - n)) >>> 0; }

  /** Unsigned 32-bit number → "a.b.c.d". */
  function format(v) { return [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.'); }

  /** The order in which blocks are placed, as indices into `sizes`.
      'largest': biggest block first; equal blocks keep the list order (the tie-break).
      'smallest': the exact reverse of 'largest' (the book's wrong order, ch. 9: link, guests, branch, management, …).
      'list': the list order (one fixed mask: every block is the same size). */
  function order(sizes, how) {
    var idx = sizes.map(function (s, i) { return i; });
    if (how === 'list') return idx;
    idx.sort(function (a, b) { return sizes[b] - sizes[a] || a - b; });
    return how === 'smallest' ? idx.reverse() : idx;
  }

  /** Place blocks of the given sizes in the given order into a space of `space` addresses, each at the next start
      that is a multiple of its size, never before the end of the previous block. A block that does not fit is left
      out and the cursor stays where it was. Returns per-index starts (null = did not fit), the holes left in front of
      blocks, and the end of the last placed block. */
  function allocate(sizes, seq, space) {
    var start = sizes.map(function () { return null; });
    var holes = [], pos = 0;
    seq.forEach(function (i) {
      var size = sizes[i];
      var at = Math.ceil(pos / size) * size;
      if (at + size > space) return;
      if (at > pos) holes.push({ start: pos, size: at - pos, before: i });
      start[i] = at;
      pos = at + size;
    });
    return { start: start, holes: holes, end: pos };
  }

  var UNITS = ['sales', 'production', 'management', 'branch', 'guests', 'link'];
  var KEYS = ['h0', 'h1', 'h2', 'h3', 'h4', 'h5'];

  /** The whole plan for one set of params. Every number the page shows is computed here. */
  function plan(p) {
    var hosts = KEYS.map(function (k) { return p[k]; });
    var own = hosts.map(prefixFor);
    var fixed = p.scheme === 'fixed';
    var common = Math.min.apply(null, own); // the largest need decides the one mask
    var prefixes = fixed ? own.map(function () { return common; }) : own;
    var sizes = prefixes.map(blockSize);
    var seq = order(sizes, fixed ? 'list' : p.scheme);
    var a = allocate(sizes, seq, SPACE);
    var units = UNITS.map(function (id, i) {
      var s = a.start[i];
      return {
        id: id, hosts: hosts[i], prefix: prefixes[i], size: sizes[i], usable: usable(prefixes[i]),
        rank: seq.indexOf(i), fits: s !== null, start: s,
        network: s === null ? null : BASE + s,
        broadcast: s === null ? null : BASE + s + sizes[i] - 1
      };
    });
    var used = 0, needed = 0, vlsmNeeded = 0;
    units.forEach(function (u, i) { needed += u.size; vlsmNeeded += blockSize(own[i]); if (u.fits) used += u.size; });
    return {
      units: units,
      seq: seq,
      holes: a.holes,
      end: a.end,
      used: used,
      holeTotal: a.holes.reduce(function (t, h) { return t + h.size; }, 0),
      reserve: SPACE - a.end,
      needed: needed,         // every block's size, placed or not (Primjer 2: 6 × 64 = 384)
      vlsmNeeded: vlsmNeeded, // the same needs with VLSM (Primjer 2: 140)
      unplaced: units.filter(function (u) { return !u.fits; }).length
    };
  }

  // Steps: 0 needs, 1 block sizes, 2 order, 3–8 place the next block, 9 the result.
  var PLACE = 3;
  var STEPS = PLACE + UNITS.length;

  /** What the page shows at step n: the plan, the phase, and how many blocks are placed so far. */
  function at(p, n) {
    var phase = n === 0 ? 'needs' : n === 1 ? 'sizes' : n === 2 ? 'order' : n === STEPS ? 'summary' : 'place';
    var placed = Math.max(0, Math.min(UNITS.length, n - PLACE + 1));
    var s = plan(p);
    // the cursor before the block of this step, for the caption: the end of the last block placed before it
    var cur = 0;
    for (var k = 0; k < (phase === 'place' ? placed - 1 : placed); k++) {
      var u = s.units[s.seq[k]];
      if (u.fits) cur = u.start + u.size;
    }
    return Object.assign(s, { phase: phase, placed: placed, cursor: cur, current: phase === 'place' ? s.seq[placed - 1] : null });
  }

  var logic = {
    /** The book's numbers: URM ch. 9, Primjer 1 (Grafo d.o.o.), placed largest first. */
    defaults: { h0: 60, h1: 28, h2: 12, h3: 10, h4: 6, h5: 2, scheme: 'largest' },
    units: UNITS,
    keys: KEYS,
    schemes: ['largest', 'smallest', 'fixed'],
    minHosts: 1,
    maxHosts: 100,
    space: SPACE,
    base: BASE,
    steps: STEPS,

    initial: function (p) { return at(p, 0); },
    /** Step n reveals one more stage; the numbers come from the params, so a param change recomputes them in place. */
    step: function (s, n, p) { return at(p, n); },

    plan: plan,
    prefixFor: prefixFor,
    blockSize: blockSize,
    usable: usable,
    mask: mask,
    format: format,
    order: order,
    allocate: allocate
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
