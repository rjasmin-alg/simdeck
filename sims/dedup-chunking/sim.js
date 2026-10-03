/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for dedup-chunking: a file is cut into chunks twice, at fixed offsets and where a rolling hash of the content
   says so (content-defined chunking, CDC); each chunk's hash goes into a chunk store. After one byte is inserted or
   deleted, the edited file is cut again: every fixed chunk after the edit has moved and is new, while the CDC
   boundaries come back once the window has passed the edit, and the later chunks are found in the store.
   Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. The chunkers (fixedChunks,
   cdcChunks, dedup) take plain strings and arrays and hold no words, so they can move to models/ unchanged for later
   K3 block-grid pages. */
(function (root) {
  'use strict';

  /** The presets' file: 66 ASCII bytes, one character = one byte. */
  var TEXT = 'kopija se radi svaku noc i sve je uredno, a nitko je ne provjerava';

  /** The edits the `edit` param offers. Insert: `text` goes in before offset `at`. Delete: the byte at `at` goes. */
  var EDITS = {
    prepend: { kind: 'insert', at: 0, text: 'X' },
    insert: { kind: 'insert', at: 30, text: '!' },
    'delete': { kind: 'delete', at: 20, len: 1 },
    none: { kind: 'none', at: 0, text: '' }
  };
  var EDIT_IDS = Object.keys(EDITS);

  /** Apply an edit: returns { text, edit: { kind, at, text } } (for a delete, `text` is the byte removed). */
  function applyEdit(s, e) {
    if (e.kind === 'insert') return { text: s.slice(0, e.at) + e.text + s.slice(e.at), edit: { kind: 'insert', at: e.at, text: e.text } };
    if (e.kind === 'delete') return { text: s.slice(0, e.at) + s.slice(e.at + e.len), edit: { kind: 'delete', at: e.at, text: s.slice(e.at, e.at + e.len) } };
    return { text: s, edit: { kind: 'none', at: 0, text: '' } };
  }

  /** The chunk's hash: 32-bit FNV-1a over the bytes, as 8 hex digits (a stand-in for the strong hash real stores use;
      collisions are out of scope). The page shows the first 4 digits. */
  function hash(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  }

  function chunk(s, start, len) { return { start: start, len: len, hash: hash(s.slice(start, start + len)) }; }

  /** Rule 1: fixed-size chunks at offsets 0, S, 2S, …; the last one may be shorter. */
  function fixedChunks(s, S) {
    var out = [];
    for (var i = 0; i < s.length; i += S) out.push(chunk(s, i, Math.min(S, s.length - i)));
    return out;
  }

  /** Rule 2: the rolling sum of the last w bytes ending at each offset i (null until the window is full).
      Add the byte that enters, subtract the one that leaves. */
  function rollingSums(s, w) {
    var out = [], h = 0;
    for (var i = 0; i < s.length; i++) {
      h += s.charCodeAt(i);
      if (i >= w) h -= s.charCodeAt(i - w);
      out.push(i >= w - 1 ? h : null);
    }
    return out;
  }

  /** Rules 2 and 3: content-defined chunks. Cut after byte i when the window's sum is a multiple of D and the chunk
      already has at least `min` bytes (a hit below `min` is ignored: min wins); cut at `max` bytes whatever the sum
      (checked after the hash rule on the same byte). The rest after the last cut is the final chunk.
      Each chunk: { start, len, hash, cut: 'hash'|'max'|'end', sum (window sum at the cut, or null), win: [from, to]
      (the window at the cut, or null), ignored: [offsets of hits ignored for min] }. */
  function cdcChunks(s, o) {
    var sums = rollingSums(s, o.w), out = [], start = 0, ignored = [];
    for (var i = 0; i < s.length; i++) {
      var len = i - start + 1;
      var hit = sums[i] !== null && sums[i] % o.D === 0;
      var cut = null;
      if (hit && len >= o.min) cut = 'hash';
      else if (len >= o.max) cut = 'max';
      else if (hit) ignored.push(i);
      if (cut) {
        var c = chunk(s, start, len);
        c.cut = cut; c.sum = sums[i]; c.win = sums[i] === null ? null : [i - o.w + 1, i]; c.ignored = ignored;
        out.push(c);
        start = i + 1; ignored = [];
      }
    }
    if (start < s.length) {
      var last = chunk(s, start, s.length - start);
      last.cut = 'end'; last.sum = null; last.win = null; last.ignored = ignored;
      out.push(last);
    }
    return out;
  }

  /** Rule 4: block-level dedup. A chunk whose hash is in the store is `same`; a `new` one adds its hash and bytes.
      Identical chunks in one version are stored once (the second is `same`). Returns { chunks, store, newBytes };
      the inputs are not changed. */
  function dedup(chunks, store) {
    var st = store.slice(), bytes = 0;
    var out = chunks.map(function (c) {
      var d = Object.assign({}, c);
      if (st.indexOf(c.hash) >= 0) d.status = 'same';
      else { d.status = 'new'; st.push(c.hash); bytes += c.len; }
      return d;
    });
    return { chunks: out, store: st, newBytes: bytes };
  }

  /** Params → the chunker settings: S = D = size, min = size/2, max = 2·size (shown, not editable). */
  function settings(p) {
    var size = [4, 8, 16].indexOf(Number(p.size)) >= 0 ? Number(p.size) : 8;
    var w = [3, 4, 5].indexOf(Number(p.window)) >= 0 ? Number(p.window) : 4;
    return { S: size, D: size, w: w, min: size / 2, max: size * 2 };
  }
  function editOf(p) { return EDITS[p.edit] || EDITS.prepend; }

  /** Chunks decided per step: four at size 4; otherwise one, and the fixed ones two at a time if the run would pass
      20 steps (the contract's limit, so no exception is declared). Returns { gf, gc, nf, nc, steps }. */
  function plan(p) {
    var o = settings(p), edited = applyEdit(TEXT, editOf(p)).text;
    var nf = fixedChunks(edited, o.S).length, nc = cdcChunks(edited, o).length;
    var g = o.S === 4 ? 4 : 1, gf = g, gc = g;
    var count = function () { return 3 + Math.ceil(nf / gf) + Math.ceil(nc / gc); };
    if (count() > 20) gf = 2 * g;
    if (count() > 20) gc = 2 * g;
    return { gf: gf, gc: gc, nf: nf, nc: nc, steps: count() };
  }

  /** Totals of one method on the edited file: chunks reused (same) of all, bytes newly stored. */
  function totals(m) {
    var same = 0, bytes = 0;
    m.edited.forEach(function (c) { if (c.status === 'same') same++; else bytes += c.len; });
    return { same: same, n: m.edited.length, newBytes: bytes };
  }

  /** Every chunk of the edited file for one method ('fixed' | 'cdc'), deduped against the original's store: where the
      run is going, for the page's "from here on every chunk matches" caption. Needs step ≥ 2. */
  function finalChunks(s, key) {
    var o = { S: s.size, D: s.size, w: s.window, min: s.min, max: s.max };
    var all = key === 'fixed' ? fixedChunks(s.edited, o.S) : cdcChunks(s.edited, o);
    var store = dedup(key === 'fixed' ? fixedChunks(s.original, o.S) : cdcChunks(s.original, o), []).store;
    return dedup(all, store).chunks;
  }

  var PHASES =['start', 'original', 'edit', 'fixed', 'cdc', 'totals'];

  var logic = {
    TEXT: TEXT,
    EDITS: EDITS,
    EDIT_IDS: EDIT_IDS,
    PHASES: PHASES,

    /** Parameter defaults. The page's controls describe how each one is shown. */
    defaults: { size: 8, window: 4, edit: 'prepend', showHash: true },

    /** 1 (original) + 1 (edit) + fixed steps + CDC steps + 1 (totals). */
    steps: function (p) { return plan(p).steps; },

    /** Step 0: the original file, not yet cut; both stores empty. */
    initial: function (p) {
      var o = settings(p), g = plan(p);
      var m = function () { return { orig: [], edited: [], store: [], origBytes: 0 }; };
      return {
        original: TEXT, edited: null, edit: applyEdit(TEXT, editOf(p)).edit,
        size: o.S, window: o.w, min: o.min, max: o.max, gf: g.gf, gc: g.gc,
        fixed: m(), cdc: m(),
        phase: 'start', cursor: 0, last: []
      };
    },

    /** Step n from step n − 1 (SPEC.md "One step"). */
    step: function (s, n, p) {
      var out = JSON.parse(JSON.stringify(s));
      var o = { S: s.size, D: s.size, w: s.window, min: s.min, max: s.max };
      out.last = [];
      if (s.phase === 'start') {                       // (1) cut the original both ways, store every chunk
        var f = dedup(fixedChunks(s.original, o.S), []), c = dedup(cdcChunks(s.original, o), []);
        out.fixed.orig = f.chunks; out.fixed.store = f.store; out.fixed.origBytes = f.newBytes;
        out.cdc.orig = c.chunks; out.cdc.store = c.store; out.cdc.origBytes = c.newBytes;
        out.phase = 'original';
        return out;
      }
      if (s.phase === 'original') {                    // (2) apply the edit
        out.edited = applyEdit(s.original, editOf(p)).text;
        out.phase = 'edit';
        return out;
      }
      var all, key, g;
      if (s.phase === 'edit' || (s.phase === 'fixed' && s.fixed.edited.length < fixedChunks(s.edited, o.S).length)) {
        key = 'fixed'; all = fixedChunks(s.edited, o.S); g = s.gf;   // (3) fixed, g chunks per step
      } else if (s.phase === 'fixed' || (s.phase === 'cdc' && s.cdc.edited.length < cdcChunks(s.edited, o).length)) {
        key = 'cdc'; all = cdcChunks(s.edited, o); g = s.gc;          // (4) CDC, the same way
      } else if (s.phase === 'cdc') {
        out.phase = 'totals';                                         // (5) totals
        return out;
      } else throw new Error('no step after totals');
      var m = out[key], from = m.edited.length;
      var d = dedup(all.slice(from, from + g), m.store);
      m.edited = m.edited.concat(d.chunks);
      m.store = d.store;
      out.phase = key;
      out.cursor = m.edited.length;
      for (var i = from; i < m.edited.length; i++) out.last.push(i);
      return out;
    },

    hash: hash,
    applyEdit: applyEdit,
    fixedChunks: fixedChunks,
    rollingSums: rollingSums,
    cdcChunks: cdcChunks,
    dedup: dedup,
    settings: settings,
    plan: plan,
    totals: totals,
    finalChunks: finalChunks
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
