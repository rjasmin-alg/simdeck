/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the homogeneous multicore lab (LV13): three views of one machine with two or more equal cores.
   - Amdahl: speedup of a program whose parallel share p runs on n cores, S = 1 / ((1 − p) + p / n).
   - MESI: one cache line X in the private caches of two cores, write-back caches with write-invalidate (MESI).
   - False sharing: two threads on two cores write their own counters; without padding both counters sit in one
     cache line, so every write invalidates the other core's copy.
   An explorer: no steps; the page draws initial(params). The MESI operations are params (o1 … o16), so a reload,
   a link and the language switch keep them.
   Adopted from single-page-labs/homogeni-multicore-simulator.html (calcSp, mr, mw, fsStep); see NOTES.md for what
   changed. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var CORES = 2;
  var MAX_OPS = 16;          // MESI operations kept in the params
  var MAX_WRITES = 16;       // false sharing: writes on the slider
  var LINE_INTS = 16;        // a 64-byte cache line holds 16 four-byte integers
  var CHART_N = [1, 2, 4, 8, 16, 32, 64];
  var OPS = ['r0', 'w0', 'r1', 'w1'];

  // ── Amdahl ──

  /** Speedup when the share p (0…1) runs in parallel on n cores and the rest stays serial. */
  function speedup(p, n) { return 1 / ((1 - p) + p / n); }

  function amdahlView(pct, n) {
    var p = pct / 100;
    var s = speedup(p, n);
    return {
      p: p,
      n: n,
      speedup: s,
      efficiency: s / n,
      serial: 1 - p,
      ceiling: 1 / (1 - p),
      curve: CHART_N.map(function (x) { return { n: x, s: speedup(p, x) }; })
    };
  }

  // ── MESI: caches[core][line] = { st: 'M'|'E'|'S'|'I', v: value or null } ──

  function emptyMachine(lines) {
    var caches = [];
    for (var c = 0; c < CORES; c++) {
      var row = [];
      for (var l = 0; l < lines; l++) row.push({ st: 'I', v: null });
      caches.push(row);
    }
    var ram = [];
    for (var k = 0; k < lines; k++) ram.push(0);
    return { caches: caches, ram: ram, hits: 0, misses: 0, upgrades: 0, inval: 0, wb: 0, events: [] };
  }

  function clone(m) { return JSON.parse(JSON.stringify(m)); }

  /** One access by `core` to `line`: op 'r' (read) or 'w' (write; the new value is the line's latest value + 1).
      Returns a new machine; the access is appended to `events` as
      { core, op, line, value, outcome: 'hit' | 'miss' | 'upgrade', changes: [{ core, from, to }], wb: core | null }.
      hit: served by the own cache with no bus traffic (also E → M on a write).
      miss: the line is fetched over the bus (after the owner of an M copy writes it back to RAM).
      upgrade: a write to an S copy; the data is there, only the other copies are invalidated over the bus. */
  function access(machine, core, op, line) {
    var m = clone(machine);
    var own = m.caches[core][line];
    var ev = { core: core, op: op, line: line, value: null, outcome: 'hit', changes: [], wb: null };
    var others = [];
    for (var c = 0; c < CORES; c++) if (c !== core) others.push(c);
    var change = function (c, to) {
      var e = m.caches[c][line];
      if (e.st !== to) ev.changes.push({ core: c, from: e.st, to: to });
      e.st = to;
    };
    var writeBack = function (c) {
      m.ram[line] = m.caches[c][line].v;
      m.wb++;
      ev.wb = c;
    };

    if (op === 'r') {
      if (own.st !== 'I') {
        m.hits++;
      } else {
        m.misses++;
        ev.outcome = 'miss';
        var shared = false;
        others.forEach(function (c) {
          var o = m.caches[c][line];
          if (o.st === 'M') { writeBack(c); change(c, 'S'); shared = true; }
          else if (o.st === 'E') { change(c, 'S'); shared = true; }
          else if (o.st === 'S') shared = true;
        });
        own.v = m.ram[line];
        change(core, shared ? 'S' : 'E');
      }
      ev.value = own.v;
    } else {
      var latest = m.ram[line];
      for (var k = 0; k < CORES; k++) {
        var e = m.caches[k][line];
        if (e.st === 'M') latest = e.v;
      }
      if (own.st === 'M' || own.st === 'E') {
        m.hits++;
      } else {
        if (own.st === 'S') { m.upgrades++; ev.outcome = 'upgrade'; } else { m.misses++; ev.outcome = 'miss'; }
        others.forEach(function (c) {
          var o = m.caches[c][line];
          if (o.st === 'M') writeBack(c);
          if (o.st !== 'I') { m.inval++; change(c, 'I'); o.v = null; }
        });
      }
      own.v = latest + 1;
      change(core, 'M');
      ev.value = own.v;
    }
    m.events.push(ev);
    return m;
  }

  /** The operations in the params, in order, up to the first empty slot. */
  function opsOf(p) {
    var out = [];
    for (var i = 1; i <= MAX_OPS; i++) {
      var o = p['o' + i];
      if (OPS.indexOf(o) < 0) break;
      out.push(o);
    }
    return out;
  }

  /** Params that append one operation (null when all slots are used). */
  function pushOp(p, op) {
    var n = opsOf(p).length;
    if (n >= MAX_OPS) return null;
    var out = {};
    out['o' + (n + 1)] = op;
    return out;
  }

  /** Params that drop the last operation (null when there is none). */
  function popOp(p) {
    var n = opsOf(p).length;
    if (!n) return null;
    var out = {};
    out['o' + n] = '';
    return out;
  }

  function clearOps() {
    var out = {};
    for (var i = 1; i <= MAX_OPS; i++) out['o' + i] = '';
    return out;
  }

  function mesiView(p) {
    var ops = opsOf(p);
    var m = emptyMachine(1);
    ops.forEach(function (o) { m = access(m, Number(o[1]), o[0], 0); });
    m.ops = ops.length;
    m.full = ops.length >= MAX_OPS;
    // RAM is stale while some cache holds the line modified.
    m.stale = m.caches.some(function (row) { return row[0].st === 'M'; });
    return m;
  }

  // ── False sharing: core 0 writes counter[0], core 1 writes counter[1], alternating, core 0 first ──

  function fsView(writes, pad) {
    var lines = pad ? 2 : 1;
    var m = emptyMachine(lines);
    // Without padding both counters are in line 0 (ints 0 and 1); with 64 B of padding each starts its own line.
    var place = pad ? [{ line: 0, slot: 0 }, { line: 1, slot: 0 }] : [{ line: 0, slot: 0 }, { line: 0, slot: 1 }];
    var counters = [0, 0];
    for (var i = 0; i < writes; i++) {
      var core = i % 2;
      m = access(m, core, 'w', place[core].line);
      counters[core]++;
    }
    var last = m.events.length ? m.events[m.events.length - 1] : null;
    return {
      pad: !!pad,
      writes: writes,
      lines: lines,
      place: place,
      counters: counters,
      caches: m.caches,
      hits: m.hits,
      misses: m.misses + m.upgrades,
      inval: m.inval,
      wb: m.wb,
      last: last,
      hitShare: writes ? m.hits / writes : null
    };
  }

  // ── params, presets, state ──

  var defaults = { view: 'amdahl', p: 80, n: 8, writes: 0, pad: false };
  for (var i = 1; i <= MAX_OPS; i++) defaults['o' + i] = '';

  function ops(list) {
    var out = clearOps();
    list.forEach(function (o, k) { out['o' + (k + 1)] = o; });
    return out;
  }

  /** Presets (keys 1–8, in this order). The page adds the labels. Params apply on top of the defaults. */
  var presets = [
    { id: 'amdahl-80', params: { view: 'amdahl', p: 80, n: 8 } },
    { id: 'amdahl-95', params: { view: 'amdahl', p: 95, n: 64 } },
    { id: 'mesi-empty', params: Object.assign({ view: 'mesi' }, ops([])) },
    { id: 'mesi-share', params: Object.assign({ view: 'mesi' }, ops(['r0', 'r1'])) },
    { id: 'mesi-invalidate', params: Object.assign({ view: 'mesi' }, ops(['r0', 'r1', 'w0'])) },
    { id: 'mesi-pingpong', params: Object.assign({ view: 'mesi' }, ops(['w0', 'w1', 'w0', 'r1'])) },
    { id: 'fs-shared', params: { view: 'fs', writes: 8, pad: false } },
    { id: 'fs-padded', params: { view: 'fs', writes: 8, pad: true } }
  ];

  var logic = {
    CORES: CORES,
    MAX_OPS: MAX_OPS,
    MAX_WRITES: MAX_WRITES,
    LINE_INTS: LINE_INTS,
    CHART_N: CHART_N,
    OPS: OPS,
    defaults: defaults,
    presets: presets,
    steps: 0,
    speedup: speedup,
    access: access,
    emptyMachine: emptyMachine,
    opsOf: opsOf,
    pushOp: pushOp,
    popOp: popOp,
    clearOps: clearOps,
    fsView: fsView,

    /** Everything the page shows, from the params. All three views are computed; the page shows one. */
    initial: function (p) {
      return {
        view: p.view,
        amdahl: amdahlView(p.p, p.n),
        mesi: mesiView(p),
        fs: fsView(p.writes, p.pad)
      };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
