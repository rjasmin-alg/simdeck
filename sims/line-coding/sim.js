/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for line-coding: one bit string sent as NRZ-L and as Manchester on a common time axis of bit cells, and a
   receiver that recovers the bits with its own clock, which drifts by d. It re-aligns on every transition and counts
   cells with its own clock in between, so a long NRZ run without a transition is read with a bit lost or gained;
   Manchester has a transition in the middle of every cell and is read correctly.
   Rules and numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   An explorer: no steps; the state is derived from the params. The page loads this as a classic script
   (window.SimLogic); node tests require() it.
   Times are in bit cells (cell i spans [i, i + 1]); every waveform time is a multiple of 0.5, exact in floating point.
   The receiver's sampling instants are computed in integers (units of 1/200 cell) so ties are decided by rule. */
(function (root) {
  'use strict';

  var MIN_BITS = 1, MAX_BITS = 16;          // rule 8
  var DRIFT_MIN = -20, DRIFT_MAX = 20;      // percent, the slider's range
  var CODE_MIN = 2, CODE_MAX = (1 << (MAX_BITS + 1)) - 1;   // sentinel-coded bit strings of 1–16 bits
  var PATTERNS = ['1001', '1101', '10101010', '0000000011111111', '1111111111111111'];

  /** A bit string as one number: a leading 1, then the bits ('1001' → 0b11001 = 25). Keeps leading zeros. */
  function codeOf(bits) { return parseInt('1' + bits, 2); }
  /** The inverse of codeOf. */
  function bitsOf(code) { return Math.floor(code).toString(2).slice(1); }

  /** The bit string the params describe: a pattern, or the bits edited on the stage ('own'). */
  function bitsFrom(p) {
    if (p.pattern !== 'own' && PATTERNS.indexOf(p.pattern) >= 0) return p.pattern;
    var c = Math.min(CODE_MAX, Math.max(CODE_MIN, Math.floor(Number(p.code)) || CODE_MIN));
    return bitsOf(c);
  }

  var defaults = { pattern: 'own', code: codeOf('1001'), drift: 0, showClock: false, lanes: 'both' };

  var presets = [
    { id: 'book-1001', params: { pattern: '1001', code: codeOf('1001'), drift: 0, showClock: false, lanes: 'both' } },
    { id: 'book-1101', params: { pattern: '1101', code: codeOf('1101'), drift: 0, showClock: false, lanes: 'both' } },
    { id: 'long-run', params: { pattern: '0000000011111111', code: codeOf('0000000011111111'), drift: 10, showClock: false, lanes: 'both' } },
    { id: 'alternating', params: { pattern: '10101010', code: codeOf('10101010'), drift: 10, showClock: false, lanes: 'both' } },
    { id: 'all-ones', params: { pattern: '1111111111111111', code: codeOf('1111111111111111'), drift: 0, showClock: true, lanes: 'both' } }
  ];

  /** Runs of equal bits: [{ bit, from, len }]. */
  function runs(bits) {
    var out = [];
    for (var i = 0; i < bits.length; i++) {
      var b = Number(bits[i]);
      if (out.length && out[out.length - 1].bit === b) out[out.length - 1].len++;
      else out.push({ bit: b, from: i, len: 1 });
    }
    return out;
  }

  /** Merge consecutive half-cells of equal level into segments [{ level, from, to }]. */
  function segments(halves) {
    var out = [];
    halves.forEach(function (lv, k) {
      var last = out[out.length - 1];
      if (last && last.level === lv) last.to = (k + 1) / 2;
      else out.push({ level: lv, from: k / 2, to: (k + 1) / 2 });
    });
    return out;
  }

  /** Rule 1, NRZ-L: the level is the bit for the whole cell (1 = high). */
  function nrz(bits) {
    var halves = [];
    for (var i = 0; i < bits.length; i++) halves.push(Number(bits[i]), Number(bits[i]));
    return segments(halves);
  }

  /** Rule 2, Manchester (IEEE 802.3): 1 = low then high, 0 = high then low; the level flips mid-cell. */
  function manchester(bits) {
    var halves = [];
    for (var i = 0; i < bits.length; i++) {
      var b = Number(bits[i]);
      halves.push(1 - b, b);
    }
    return segments(halves);
  }

  /** Transitions of a waveform: [{ t, dir: 'up' | 'down', kind: 'mid' | 'boundary' }] in time order. */
  function edgesOf(segs) {
    var out = [];
    for (var i = 1; i < segs.length; i++) {
      var t = segs[i].from;
      out.push({ t: t, dir: segs[i].level > segs[i - 1].level ? 'up' : 'down', kind: t % 1 === 0 ? 'boundary' : 'mid' });
    }
    return out;
  }

  /** Rule 5, the NRZ receiver. It knows where the string starts (a preamble stands in for that, rule 8) and
      re-aligns on every transition. In a run of k cells starting at a, it samples at a + (j + ½)·(1 + d) for
      j = 0, 1, … while the instant is strictly before the run's end (tie-break: an instant exactly on the run's end
      belongs to the next run, which re-aligns there). An instant exactly on a cell boundary inside the run falls in
      the later cell. Returns the samples [{ t, bit, cell }] and the misread cells [{ cell, kind: 'lost' | 'extra' }]. */
  function readNrz(bits, drift) {
    var samples = [], errors = [];
    var step = 100 + drift;                    // own cell length in 1/100 cell; sample j at (2j + 1)·step / 2
    runs(bits).forEach(function (r) {
      var end = 200 * r.len, perCell = {};
      for (var j = 0; (2 * j + 1) * step < end; j++) {
        var u = (2 * j + 1) * step;            // in 1/200 cell from the run's start
        var cell = r.from + Math.floor(u / 200);
        samples.push({ t: r.from + u / 200, bit: r.bit, cell: cell });
        perCell[cell] = (perCell[cell] || 0) + 1;
      }
      for (var c = r.from; c < r.from + r.len; c++) {
        var n = perCell[c] || 0;
        if (n === 0) errors.push({ cell: c, kind: 'lost' });
        else if (n > 1) errors.push({ cell: c, kind: 'extra' });
      }
    });
    return { samples: samples, errors: errors };
  }

  /** Rules 4 and 6, the Manchester receiver. It reads the direction of each mid-cell transition, not the level.
      After a mid-cell transition (the first one is expected half a cell after the known start) it ignores
      transitions for ¾ of its own cell, (¾)·(1 + d): a boundary jump comes ½ cell after, the next mid-cell
      transition 1 cell after. The next transition after the window is mid-cell; it re-aligns there. Correct for
      |d| < ⅓ (SPEC.md rule 6). */
  function readMan(bits, drift, edges) {
    var samples = [], last = -0.5, errors = [];
    edges.forEach(function (e) {
      // gap / (1 + d) > ¾  ⇔  400·gap > 3·(100 + d), with d in percent; gap is a multiple of ½, so this is exact
      if (400 * (e.t - last) > 3 * (100 + drift)) {
        samples.push({ t: e.t, bit: e.dir === 'up' ? 1 : 0, cell: Math.floor(e.t) });
        last = e.t;
      }
    });
    // A cell whose mid-cell transition was not taken, or read with the wrong bit, is misread.
    var got = {};
    samples.forEach(function (s) { got[s.cell] = (got[s.cell] || []).concat(s.bit); });
    for (var c = 0; c < bits.length; c++) {
      var g = got[c] || [];
      if (g.length === 0) errors.push({ cell: c, kind: 'lost' });
      else if (g.length > 1) errors.push({ cell: c, kind: 'extra' });
      else if (g[0] !== Number(bits[c])) errors.push({ cell: c, kind: 'wrong' });
    }
    return { samples: samples, errors: errors };
  }

  /** The derived state for one set of params (SPEC.md "State"). */
  function derive(p) {
    var bits = bitsFrom(p);
    var drift = Math.max(DRIFT_MIN, Math.min(DRIFT_MAX, Math.round(Number(p.drift) || 0)));
    var segN = nrz(bits), segM = manchester(bits);
    var eN = edgesOf(segN), eM = edgesOf(segM);
    var rN = readNrz(bits, drift), rM = readMan(bits, drift, eM);
    var rs = runs(bits);
    return {
      bits: bits, n: bits.length, drift: drift,
      nrz: segN, man: segM,
      edges: { nrz: eN, man: eM },
      transitions: {
        nrz: eN.length,
        man: eM.length,
        manMid: eM.filter(function (e) { return e.kind === 'mid'; }).length,
        manBoundary: eM.filter(function (e) { return e.kind === 'boundary'; }).length
      },
      samples: { nrz: rN.samples, man: rM.samples },
      readNrz: rN.samples.map(function (s) { return s.bit; }),
      readMan: rM.samples.map(function (s) { return s.bit; }),
      errors: { nrz: rN.errors, man: rM.errors },
      runs: rs,
      longestRun: rs.reduce(function (m, r) { return Math.max(m, r.len); }, 0),
      noTransitions: eN.length === 0                  // rule 8: one flat NRZ line
    };
  }

  /** What changed from `before` to `now` ("changed" in the legend): the bit cells that differ, and the transitions
      of each lane that appeared or disappeared. Strings of different lengths: the added cells only. */
  function changed(before, now) {
    var none = { cells: [], nrz: [], man: [] };
    if (!before) return none;
    var cells = [];
    for (var i = 0; i < now.n; i++) if (i >= before.n || before.bits[i] !== now.bits[i]) cells.push(i);
    if (before.n !== now.n) return { cells: now.n > before.n ? cells : [], nrz: [], man: [] };
    var diff = function (a, b) {
      var key = function (e) { return e.t + e.dir; };
      var ka = a.map(key);
      return b.filter(function (e) { return ka.indexOf(key(e)) < 0; }).map(function (e) { return e.t; })
        .concat(a.filter(function (e) { return b.map(key).indexOf(key(e)) < 0; }).map(function (e) { return e.t; }))
        .sort(function (x, y) { return x - y; })
        .filter(function (t, k, arr) { return k === 0 || arr[k - 1] !== t; });
    };
    return { cells: cells, nrz: diff(before.edges.nrz, now.edges.nrz), man: diff(before.edges.man, now.edges.man) };
  }

  /** The bit string after clicking cell i (flip it), adding a cell (a 0) or removing the last one, within 1–16. */
  function edit(bits, op, i) {
    if (op === 'flip' && i >= 0 && i < bits.length) return bits.slice(0, i) + (bits[i] === '1' ? '0' : '1') + bits.slice(i + 1);
    if (op === 'add' && bits.length < MAX_BITS) return bits + '0';
    if (op === 'remove' && bits.length > MIN_BITS) return bits.slice(0, -1);
    return bits;
  }

  var logic = {
    defaults: defaults,
    presets: presets,
    /** Explorer: no steps; the state is derived from the params. */
    initial: function (p) { return derive(p); },
    derive: derive, changed: changed, edit: edit, runs: runs, nrz: nrz, manchester: manchester, edgesOf: edgesOf,
    readNrz: readNrz, readMan: readMan, bitsFrom: bitsFrom, codeOf: codeOf, bitsOf: bitsOf,
    PATTERNS: PATTERNS, MIN_BITS: MIN_BITS, MAX_BITS: MAX_BITS, DRIFT_MIN: DRIFT_MIN, DRIFT_MAX: DRIFT_MAX,
    CODE_MIN: CODE_MIN, CODE_MAX: CODE_MAX
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
