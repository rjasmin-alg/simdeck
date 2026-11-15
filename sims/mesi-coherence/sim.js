/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for mesi-coherence: the MESI states of one cache line X in 2–4 private caches on a snooping bus
   (Illinois protocol, write-invalidate). One step = one read or write by one core. Rules and numbers: SPEC.md.
   The transition table is the one of sims/multicore-mesi/sim.js access() @ 7f16d4a (from single-page-labs/
   homogeni-multicore-simulator.html mr, mw), extended to N cores, with bus transactions, value tracking and
   downgrades counted apart from invalidations. models/ has no MESI model yet; access() below is pure and promotable.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MAX_OPS = 20;                 // cap on the sequence (task: steps plus appended, cap 20)
  var MAX_CORES = 4;
  var OPS = [];                     // every slot value: '0R', '0W', '1R', … '3W'
  for (var c = 0; c < MAX_CORES; c++) OPS.push(c + 'R', c + 'W');

  // The presets' sequences (SPEC.md "Presets").
  var SEQUENCES = {
    'classic': { cores: 2, ops: ['0R', '1R', '0W', '1R'] },
    'silent-upgrade': { cores: 2, ops: ['0R', '0W', '0R', '1W'] },
    'ping-pong': { cores: 2, ops: ['0W', '1W', '0W', '1W', '0W', '1W'] },
    'readers-writer': { cores: 3, ops: ['0R', '1R', '2R', '1W', '0R', '2R'] }
  };
  var SEQUENCE_IDS = ['classic', 'silent-upgrade', 'ping-pong', 'readers-writer'];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** An empty machine: every core I with no value, RAM 0, no writes yet. */
  function emptyMachine(n) {
    var cores = [];
    for (var k = 0; k < n; k++) cores.push({ state: 'I', value: null });
    return { cores: cores, mem: 0, version: 0, last: null,
      counts: { hits: 0, busTx: 0, invalidations: 0, downgrades: 0, writebacks: 0 } };
  }

  /** One operation of `core` on X: op 'R' or 'W'. Returns a new machine (rules 1–9 of SPEC.md). */
  function access(machine, core, op) {
    var m = clone(machine);
    var own = m.cores[core];
    var last = { core: core, op: op, hit: false, bus: null, flush: null, transitions: [], value: null };
    var mine = [];   // the requester's transition, listed after the snoopers' (rule 8)
    function move(k, to, list) {
      var e = m.cores[k];
      if (e.state !== to) list.push({ core: k, from: e.state, to: to });
      e.state = to;
    }
    function writeBack(k) {
      m.mem = m.cores[k].value;
      m.counts.writebacks++;
      last.flush = k;
    }
    var others = [];
    for (var k = 0; k < m.cores.length; k++) if (k !== core) others.push(k);

    if (op === 'R') {
      if (own.state !== 'I') {                          // rule 1: read hit
        last.hit = true;
        m.counts.hits++;
      } else {                                          // rule 2: read miss
        last.bus = 'BusRd';
        m.counts.busTx++;
        var shared = false;
        others.forEach(function (k) {
          var o = m.cores[k];
          if (o.state === 'M') { writeBack(k); move(k, 'S', last.transitions); m.counts.downgrades++; shared = true; }
          else if (o.state === 'E') { move(k, 'S', last.transitions); m.counts.downgrades++; shared = true; }
          else if (o.state === 'S') shared = true;
        });
        own.value = m.mem;
        move(core, shared ? 'S' : 'E', mine);
      }
      last.value = own.value;
    } else {
      if (own.state === 'M' || own.state === 'E') {     // rule 3: write hit, E → M is silent
        last.hit = true;
        m.counts.hits++;
      } else {                                          // rule 4 (S: BusUpgr) and rule 5 (I: BusRdX)
        last.bus = own.state === 'S' ? 'BusUpgr' : 'BusRdX';
        m.counts.busTx++;
        others.forEach(function (k) {
          var o = m.cores[k];
          if (o.state === 'M') writeBack(k);
          if (o.state !== 'I') { move(k, 'I', last.transitions); o.value = null; m.counts.invalidations++; }
        });
      }
      m.version++;                                      // rule 6: every write makes a new value; RAM waits
      own.value = m.version;
      move(core, 'M', mine);
      last.value = own.value;
    }
    last.transitions = last.transitions.concat(mine);
    m.last = last;
    return m;
  }

  /** Rule 7: at most one core in M or E, and M/E never together with S. */
  function invariantHolds(m) {
    var owners = 0, shared = 0;
    m.cores.forEach(function (e) { if (e.state === 'M' || e.state === 'E') owners++; if (e.state === 'S') shared++; });
    return owners <= 1 && !(owners && shared);
  }

  /** RAM is stale while some core holds X modified (rule 6). */
  function isStale(m) { return m.cores.some(function (e) { return e.state === 'M'; }); }

  /** The operations in the params: slots o1 … o20 up to the first empty one, without ops on missing cores. */
  function opsOf(p) {
    var out = [];
    for (var i = 1; i <= MAX_OPS; i++) {
      var o = p['o' + i];
      if (OPS.indexOf(o) < 0) break;
      if (Number(o[0]) < p.cores) out.push(o);
    }
    return out;
  }

  /** Params whose slots hold exactly this list (the rest emptied). */
  function slots(list) {
    var out = {};
    for (var i = 1; i <= MAX_OPS; i++) out['o' + i] = list[i - 1] || '';
    return out;
  }

  /** Params that keep the first n operations and add `op` after them (null at the cap or for a missing core). */
  function appendAt(p, n, op) {
    if (OPS.indexOf(op) < 0 || Number(op[0]) >= p.cores) return null;
    var keep = opsOf(p).slice(0, n);
    if (keep.length >= MAX_OPS) return null;
    return slots(keep.concat([op]));
  }

  var defaults = Object.assign({ cores: SEQUENCES.classic.cores }, slots(SEQUENCES.classic.ops));

  var presets = SEQUENCE_IDS.map(function (id) {
    return { id: id, params: Object.assign({ cores: SEQUENCES[id].cores }, slots(SEQUENCES[id].ops)) };
  });

  var logic = {
    MAX_OPS: MAX_OPS,
    MAX_CORES: MAX_CORES,
    OPS: OPS,
    SEQUENCES: SEQUENCES,
    SEQUENCE_IDS: SEQUENCE_IDS,
    emptyMachine: emptyMachine,
    access: access,
    invariantHolds: invariantHolds,
    isStale: isStale,
    opsOf: opsOf,
    slots: slots,
    appendAt: appendAt,
    defaults: defaults,
    presets: presets,

    /** One step per operation in the sequence (4, 4, 6, 6 for the presets; at most 20). */
    steps: function (p) { return opsOf(p).length; },

    initial: function (p) { return emptyMachine(p.cores); },

    /** Operation n (1-based) of the sequence. */
    step: function (s, n, p) {
      var o = opsOf(p)[n - 1];
      return access(s, Number(o[0]), o[1]);
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
