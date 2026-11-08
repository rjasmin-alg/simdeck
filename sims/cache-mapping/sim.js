/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cache-mapping: one trace of 12-bit addresses through a cache of 8 lines, direct mapped or set
   associative (1, 2, 4 or 8 ways, LRU), with a fully associative LRU cache of the same size beside it as the
   reference that sorts every miss into compulsory, capacity or conflict (3C). Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. One step = one memory access. */
(function (root) {
  'use strict';

  var LINES = 8;        // lines in the cache (fixed, task)
  var ADDR_BITS = 12;   // address width shown on the strip

  // The presets' traces (SPEC.md "Presets"). Addresses are byte addresses.
  var TRACES = {
    'ping-pong': [0x000, 0x080, 0x000, 0x080, 0x000, 0x080, 0x000, 0x080],
    'three-way': [0x000, 0x080, 0x100, 0x000, 0x080, 0x100, 0x000, 0x080, 0x100],
    'locality': [0x000, 0x004, 0x008, 0x00C, 0x010, 0x014, 0x018, 0x01C],
    'capacity': (function () {
      var out = [];
      for (var pass = 0; pass < 2; pass++) for (var a = 0x000; a <= 0x090; a += 0x10) out.push(a);
      return out;
    })()
  };
  var TRACE_IDS = ['ping-pong', 'three-way', 'locality', 'capacity'];

  function log2(x) { var n = 0; while ((1 << n) < x) n++; return n; }
  function traceOf(p) { return TRACES[p.trace] || TRACES['ping-pong']; }

  /** Cache shape for the params: block size B, ways, sets S = lines / ways, and the bit widths of the address. */
  function geometry(p) {
    var ways = p.ways, B = p.block, sets = LINES / ways;
    var offsetBits = log2(B), setBits = log2(sets);
    return { lines: LINES, ways: ways, block: B, sets: sets, offsetBits: offsetBits, setBits: setBits,
      tagBits: ADDR_BITS - offsetBits - setBits, addrBits: ADDR_BITS };
  }

  /** Rule 1: block = ⌊addr / B⌋, offset = addr mod B, set = block mod S, tag = ⌊block / S⌋. */
  function split(addr, p) {
    var g = geometry(p);
    var block = Math.floor(addr / g.block);
    return { addr: addr, block: block, offset: addr % g.block, set: block % g.sets, tag: Math.floor(block / g.sets) };
  }

  /** Rule 3: the way to fill on a miss: the lowest-numbered invalid way, else the way with the smallest lastUse. */
  function victimWay(setLines) {
    var i;
    for (i = 0; i < setLines.length; i++) if (!setLines[i].valid) return i;
    var best = 0;
    for (i = 1; i < setLines.length; i++) if (setLines[i].lastUse < setLines[best].lastUse) best = i;
    return best;
  }

  var logic = {
    LINES: LINES,
    ADDR_BITS: ADDR_BITS,
    TRACES: TRACES,
    TRACE_IDS: TRACE_IDS,
    geometry: geometry,
    split: split,
    victimWay: victimWay,
    traceOf: traceOf,

    defaults: { trace: 'ping-pong', ways: 1, block: 16 },

    /** One step per access of the chosen trace (8, 9, 8, 20). */
    steps: function (p) { return traceOf(p).length; },

    /** Empty cache: every line invalid, sets in order, ways in order inside a set. */
    initial: function (p) {
      var g = geometry(p), lines = [];
      for (var s = 0; s < g.sets; s++) {
        for (var w = 0; w < g.ways; w++) lines.push({ set: s, way: w, valid: false, tag: null, block: null, lastUse: null });
      }
      return { i: 0, lines: lines, fa: [], log: [], hits: 0, faHits: 0, misses: { compulsory: 0, capacity: 0, conflict: 0 } };
    },

    /** Access n (1-based): split, select the set, compare tags, fill on a miss (LRU), classify, update. */
    step: function (s, n, p) {
      var g = geometry(p);
      var addr = traceOf(p)[n - 1];
      var a = split(addr, p);
      var lines = s.lines.map(function (l) { return Object.assign({}, l); });
      var setLines = lines.filter(function (l) { return l.set === a.set; });

      // (3) compare the tag with every valid way of the set (rule 2)
      var hitLine = null;
      for (var k = 0; k < setLines.length; k++) if (setLines[k].valid && setLines[k].tag === a.tag) { hitLine = setLines[k]; break; }
      var held = setLines.filter(function (l) { return l.valid; }).map(function (l) { return l.tag; });

      // (5) the fully associative shadow of the same size, LRU order (index 0 = least recently used)
      var faHit = s.fa.indexOf(a.block) >= 0;
      var fa = s.fa.filter(function (b) { return b !== a.block; });
      var faVictim = null;
      if (!faHit && fa.length >= g.lines) faVictim = fa.shift();
      fa.push(a.block);

      var result, way, victim = null;
      if (hitLine) {
        result = 'hit';
        way = hitLine.way;
        hitLine.lastUse = n; // rule 2: a hit only refreshes lastUse
      } else {
        // (4) victim and fill (rule 3)
        var vw = victimWay(setLines);
        var line = setLines[vw];
        if (line.valid) victim = line.block;
        way = line.way;
        line.valid = true;
        line.tag = a.tag;
        line.block = a.block;
        line.lastUse = n;
        // (5) classify (rule 5): first access ever → compulsory; else the fully associative cache decides
        var seen = s.log.some(function (e) { return e.block === a.block; });
        result = !seen ? 'compulsory' : (faHit ? 'conflict' : 'capacity');
      }

      // (6) counts
      var misses = Object.assign({}, s.misses);
      if (result !== 'hit') misses[result] += 1;
      var entry = { addr: addr, block: a.block, offset: a.offset, set: a.set, tag: a.tag, way: way, held: held,
        result: result, victim: victim, faHit: faHit, faVictim: faVictim };
      return { i: n, lines: lines, fa: fa, log: s.log.concat([entry]),
        hits: s.hits + (result === 'hit' ? 1 : 0), faHits: s.faHits + (faHit ? 1 : 0), misses: misses };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
