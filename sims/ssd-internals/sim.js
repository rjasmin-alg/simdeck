/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ssd-internals: a tiny SSD. The host sees 10 logical blocks (LBA 0–9); the NAND has 4 erase blocks × 4
   pages (16 pages, 6 of them over-provisioning). The flash translation layer (FTL) writes every LBA to the next free
   page of the active block and marks the old page invalid; erase works on whole blocks only; when the last free
   block is needed, garbage collection copies the valid pages of the block with the most invalid ones into the
   reserve and erases it. TRIM invalidates pages without writing. Write amplification = NAND programs / host writes.
   Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. The drive operations
   (writeLba, trim, gcRun, pickVictim, needsGc) are pure functions over the drive state and hold no words. */
(function (root) {
  'use strict';

  var BLOCKS = 4, PAGES = 4, LBAS = 10;
  var MAX_STEPS = 20;            // contract: a stepper has at most about 20 steps; added ops stop there
  var FILL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  var SPREAD = [0, 4, 8, 1, 5, 9, 2, 6];

  function w(l) { return { op: 'w', lba: l }; }
  /** The pattern scripts (SPEC.md "Presets"). */
  var PATTERNS = {
    hot: [{ op: 'fill' }].concat([0, 1, 2, 3, 0, 1, 2, 3].map(w)),
    spread: [{ op: 'fill' }].concat(SPREAD.map(w)),
    trim: [{ op: 'fill' }, { op: 't', lbas: [6, 7, 8, 9] }].concat(SPREAD.map(w)),
    fill: FILL.map(w)
  };
  var PATTERN_IDS = Object.keys(PATTERNS);

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** An empty drive: every page erased, block 0 active. */
  function emptyDrive() {
    var pages = [];
    for (var b = 0; b < BLOCKS; b++) { var row = []; for (var p = 0; p < PAGES; p++) row.push(null); pages.push(row); }
    var erase = [];
    for (var e = 0; e < BLOCKS; e++) erase.push(0);
    return { pages: pages, erase: erase, map: {}, active: 0, ptr: 0, host: 0, nand: 0, gc: [], trimmed: [] };
  }

  function isFree(d, b) { return d.pages[b].every(function (v) { return v === null; }); }
  function isFull(d, b) { return d.pages[b].every(function (v) { return v !== null; }); }
  function invalidCount(d, b) { return d.pages[b].filter(function (v) { return v === 'X'; }).length; }
  function validCount(d, b) { return d.pages[b].filter(function (v) { return typeof v === 'number'; }).length; }

  /** Free (all pages erased) blocks other than the active one, lowest first. */
  function freeBlocks(d) {
    var out = [];
    for (var b = 0; b < BLOCKS; b++) if (b !== d.active && isFree(d, b)) out.push(b);
    return out;
  }

  /** The reserve block: the one free block left besides the active one (rule 4), or null while more are free. */
  function reserveOf(d) {
    var f = freeBlocks(d);
    return f.length === 1 ? f[0] : null;
  }

  /** Rule 4: the next write needs a GC run first (active block full, fewer than two free blocks). */
  function needsGc(d) { return d.ptr >= PAGES && freeBlocks(d).length < 2; }

  /** Rule 5: the full block with the most invalid pages; tie → lower erase count; tie → lower block number. */
  function pickVictim(d) {
    var best = null;
    for (var b = 0; b < BLOCKS; b++) {
      if (!isFull(d, b)) continue;
      if (best === null) { best = b; continue; }
      var di = invalidCount(d, b) - invalidCount(d, best);
      if (di > 0 || (di === 0 && d.erase[b] < d.erase[best])) best = b;   // equal on both: the lower number stays
    }
    return best;
  }

  /** Rule 3: erase a whole block; its erase counter goes up by one. Mutates d. */
  function eraseBlock(d, b) {
    for (var p = 0; p < PAGES; p++) d.pages[b][p] = null;
    d.erase[b] += 1;
  }

  /** Rules 3, 5: one GC run. Returns { d, ev }. ev = { kind: 'gc', victim, to, moves: [{ lba, from, to }], erase }. */
  function gcRun(drive) {
    var d = clone(drive);
    var victim = pickVictim(d);
    var to = freeBlocks(d)[0];
    // invariants of rules 4–5 (SPEC.md, Derived): a model bug, never a user action, so fail loudly instead of looping
    if (victim === null || to === undefined) throw new Error('gcRun: no full victim or no reserve block');
    if (invalidCount(d, victim) === 0) throw new Error('gcRun: the victim has no invalid page');
    var moves = [];
    // which tie-break decided (for the caption): the other full blocks with as many invalid pages as the victim
    var invalid = invalidCount(d, victim);
    var tiedErase = [], tiedNumber = [];   // beaten on the erase count; beaten on the block number
    for (var b = 0; b < BLOCKS; b++) {
      if (b === victim || !isFull(d, b) || invalidCount(d, b) !== invalid) continue;
      (d.erase[b] > d.erase[victim] ? tiedErase : tiedNumber).push(b);
    }
    d.active = to;
    d.ptr = 0;
    for (var p = 0; p < PAGES; p++) {
      var v = d.pages[victim][p];
      if (typeof v !== 'number') continue;
      d.pages[to][d.ptr] = v;
      d.map[v] = [to, d.ptr];
      moves.push({ lba: v, from: [victim, p], to: [to, d.ptr] });
      d.ptr += 1;
      d.nand += 1;
    }
    if (d.ptr >= PAGES) throw new Error('gcRun: the reserve is full after the copy');
    eraseBlock(d, victim);
    d.gc.push({ victim: victim, to: to, moved: moves.length });
    return { d: d, ev: { kind: 'gc', victim: victim, to: to, moves: moves, erase: d.erase[victim], invalid: invalid,
      tiedErase: tiedErase, tiedNumber: tiedNumber } };
  }

  /** Rules 1, 2, 4: write one LBA. The caller runs GC first when needsGc(d). Returns { d, ev }.
      ev = { kind: 'write', lba, to: [b, p], from: [b, p] | null, opened: b | null }. */
  function writeLba(drive, lba) {
    var d = clone(drive);
    var opened = null;
    if (d.ptr >= PAGES) {
      var f = freeBlocks(d);
      if (f.length < 2) throw new Error('writeLba: GC needed first');
      d.active = f[0];
      d.ptr = 0;
      opened = f[0];
    }
    if (d.pages[d.active][d.ptr] !== null) throw new Error('writeLba: page not erased');   // rule 1, a model bug
    var key = String(lba);
    var from = d.map[key] || null;
    if (from) d.pages[from[0]][from[1]] = 'X';
    var to = [d.active, d.ptr];
    d.pages[d.active][d.ptr] = lba;
    d.map[key] = to;
    d.ptr += 1;
    d.host += 1;
    d.nand += 1;
    d.trimmed = d.trimmed.filter(function (x) { return x !== lba; });
    return { d: d, ev: { kind: 'write', lba: lba, to: to, from: from, opened: opened } };
  }

  /** Rule 6: TRIM a set of LBAs. ev = { kind: 'trim', lbas, hits: [{ lba, at }], misses: [lba] }. */
  function trim(drive, lbas) {
    var d = clone(drive);
    var hits = [], misses = [];
    lbas.forEach(function (lba) {
      var key = String(lba);
      var at = d.map[key];
      if (!at) { misses.push(lba); return; }
      d.pages[at[0]][at[1]] = 'X';
      delete d.map[key];
      if (d.trimmed.indexOf(lba) < 0) d.trimmed.push(lba);
      hits.push({ lba: lba, at: at });
    });
    return { d: d, ev: { kind: 'trim', lbas: lbas.slice(), hits: hits, misses: misses } };
  }

  /** The fill (prep of presets 1–3): LBA 0–9 in order, then the counters start at 0 (rule 7). */
  function fill(drive) {
    var d = drive, written = [];
    FILL.forEach(function (l) { var r = writeLba(d, l); d = r.d; written.push(r.ev.to); });
    var ev = { kind: 'fill', host: d.host, nand: d.nand, pages: written };
    d.host = 0;
    d.nand = 0;
    return { d: d, ev: ev };
  }

  /** Rule 7: write amplification, or null before the first host write. */
  function wa(d) { return d.host > 0 ? d.nand / d.host : null; }

  // ── the script: the pattern, then the ops the student added ──

  /** `extra` is a string of ops: `w3` writes LBA 3, `t5` trims LBA 5; anything else is ignored. */
  function parseExtra(s) {
    var out = [];
    String(s || '').split(/\s+/).forEach(function (tok) {
      var m = /^([wt])([0-9])$/.exec(tok);
      if (!m) return;
      var l = Number(m[2]);
      out.push(m[1] === 'w' ? w(l) : { op: 't', lbas: [l] });
    });
    return out;
  }

  function patternOf(p) { return PATTERNS[p.pattern] ? p.pattern : 'hot'; }

  /** Replay a script on an empty drive; the number of steps it takes (one per op, plus one per GC). */
  function countSteps(script) {
    var s = { drive: emptyDrive(), i: 0 };
    var n = 0;
    while (s.i < script.length && n < 100) { s = advance(s, script); n++; }   // 100: a guard, never reached
    return n;
  }

  /** The script of a run: the pattern's ops, then as many added ops as fit in MAX_STEPS. */
  function scriptOf(p) {
    var script = PATTERNS[patternOf(p)].slice();
    parseExtra(p.extra).forEach(function (op) {
      var next = script.concat([op]);
      if (countSteps(next) <= MAX_STEPS) script = next;
    });
    return script;
  }

  /** One step on { drive, i }: a GC run if the next op is a write that needs one, else the op itself. */
  function advance(s, script) {
    var op = script[s.i];
    var r;
    if (op.op === 'w' && needsGc(s.drive)) { r = gcRun(s.drive); return { drive: r.d, i: s.i, ev: r.ev }; }
    if (op.op === 'w') r = writeLba(s.drive, op.lba);
    else if (op.op === 't') r = trim(s.drive, op.lbas);
    else r = fill(s.drive);
    return { drive: r.d, i: s.i + 1, ev: r.ev };
  }

  function steps(p) { return countSteps(scriptOf(p)); }

  /** Can the button add this op (`w3`, `t5`) without going past MAX_STEPS? */
  function canAdd(p, tok) {
    var script = scriptOf(p);
    return countSteps(script.concat(parseExtra(tok))) <= MAX_STEPS;
  }
  function addOp(p, tok) { return (String(p.extra || '') + ' ' + tok).trim(); }

  function toState(s) {
    var d = s.drive;
    return { pages: d.pages, erase: d.erase, map: d.map, active: d.active, ptr: d.ptr, host: d.host, nand: d.nand,
      gc: d.gc, trimmed: d.trimmed, i: s.i, ev: s.ev || null };
  }
  function fromState(st) {
    return { drive: { pages: st.pages, erase: st.erase, map: st.map, active: st.active, ptr: st.ptr, host: st.host,
      nand: st.nand, gc: st.gc, trimmed: st.trimmed }, i: st.i };
  }

  var logic = {
    /** pattern: the preset script; lba: what the buttons act on; showMap: mapping line and arrows; extra: added ops. */
    defaults: { pattern: 'hot', lba: 0, showMap: true, extra: '' },
    steps: steps,
    initial: function () { return toState({ drive: emptyDrive(), i: 0, ev: null }); },
    step: function (st, n, p) {
      var script = scriptOf(p);
      if (st.i >= script.length) return Object.assign(clone(st), { ev: { kind: 'idle' } });
      return toState(advance(fromState(clone(st)), script));
    },

    BLOCKS: BLOCKS, PAGES: PAGES, LBAS: LBAS, MAX_STEPS: MAX_STEPS,
    PATTERNS: PATTERNS, PATTERN_IDS: PATTERN_IDS,
    emptyDrive: emptyDrive, writeLba: writeLba, trim: trim, gcRun: gcRun, fill: fill,
    pickVictim: pickVictim, needsGc: needsGc, freeBlocks: freeBlocks, reserveOf: reserveOf,
    invalidCount: invalidCount, validCount: validCount, wa: wa,
    parseExtra: parseExtra, scriptOf: scriptOf, canAdd: canAdd, addOp: addOp
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
