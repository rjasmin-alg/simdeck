/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for DRAM disturbance (Rowhammer): a bank of rows, one or two aggressor rows activated many times within one
   refresh window, and the charge their activations knock out of the cells in the neighbouring rows. An explorer: no
   steps; the page draws initial(params).
   Adopted from single-page-labs/rowhammer.html (initGrid's layout: aggressors around the middle row; the flip
   threshold; rows and cells per row). The original's real-time loop with Math.random became a pure function of the
   params; see NOTES.md for what changed.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Refresh window in ms: every row is refreshed (its charge restored) once per window. */
  var WINDOW_MS = 64;
  /** Target row refresh: once a row has been activated this many times (thousands) in a window, the controller
      refreshes its two neighbours, so no neighbour takes more than this from one aggressor. */
  var TRR_LIMIT = 8;
  /** ECC word: SECDED over 8 data cells (the 8 check bits are not drawn). */
  var WORD = 8;
  /** Bank sizes the page offers: rows × cells per row (cells in whole ECC words). */
  var SIZES = { small: [5, 8], medium: [9, 16], large: [11, 24] };
  /** A cell's own threshold is the chip's (weakest cell) times 1 … 1 + SPREAD. */
  var SPREAD = 3;

  /** Pattern of a cell, from its position only: [0, 1). Integer hash, the same on every run. */
  function hash(r, c, salt) {
    var x = (Math.imul(r + 1, 374761393) + Math.imul(c + 1, 668265263) + Math.imul(salt, 2246822519)) | 0;
    x = Math.imul(x ^ (x >>> 15), 2654435761);
    x = Math.imul(x ^ (x >>> 13), 1274126177);
    x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  }

  /** The stored bit of a cell (1 = charged) and how hard it is to disturb (0 = the weakest). */
  function bitOf(r, c) { return hash(r, c, 1) < 0.5 ? 0 : 1; }
  function toughness(r, c) { return hash(r, c, 2); }

  /** Aggressor rows for a pattern: single-sided hammers the middle row; double-sided the two rows around it. */
  function aggressors(rows, pattern) {
    var mid = Math.floor(rows / 2);
    return pattern === 'single' ? [mid] : [mid - 1, mid + 1];
  }

  /** Activations (thousands) one aggressor row adds to each neighbour before that neighbour is refreshed. */
  function effective(acts, mitigation) {
    if (mitigation === 'refresh2x') return acts / 2; // twice the refresh rate: half a window between refreshes
    if (mitigation === 'trr') return Math.min(acts, TRR_LIMIT);
    return acts;
  }

  /** SECDED on one word, by the number of flipped cells in it. */
  function eccStatus(k) {
    if (k === 0) return 'clean';
    if (k === 1) return 'corrected';
    if (k === 2) return 'detected';
    return 'beyond'; // three or more: SECDED guarantees nothing, the word may be miscorrected or pass as good
  }

  var defaults = { acts: 30, thresh: 20, pattern: 'double', mitigation: 'none', size: 'medium' };

  /** Presets (keys 1–7, in this order); the page adds the labels. Params apply on top of the defaults. */
  var presets = [
    { id: 'single', params: { pattern: 'single', acts: 30, mitigation: 'none' } },
    { id: 'double', params: { pattern: 'double', acts: 30, mitigation: 'none' } },
    { id: 'refresh2x', params: { pattern: 'double', acts: 30, mitigation: 'refresh2x' } },
    { id: 'trr', params: { pattern: 'double', acts: 30, mitigation: 'trr' } },
    { id: 'trr-weak', params: { pattern: 'double', acts: 30, mitigation: 'trr', thresh: 6 } },
    { id: 'ecc', params: { pattern: 'double', acts: 30, mitigation: 'ecc' } },
    { id: 'ecc-heavy', params: { pattern: 'double', acts: 90, mitigation: 'ecc' } }
  ];

  var logic = {
    WINDOW_MS: WINDOW_MS,
    TRR_LIMIT: TRR_LIMIT,
    WORD: WORD,
    SPREAD: SPREAD,
    SIZES: SIZES,
    defaults: defaults,
    presets: presets,
    steps: 0,
    aggressors: aggressors,
    effective: effective,
    eccStatus: eccStatus,
    bitOf: bitOf,
    toughness: toughness,

    /** A cell flips when it holds charge and its row's disturbance reaches its own threshold (a tie flips). */
    flips: function (bit, dist, thr) { return bit === 1 && dist >= thr; },

    /** Everything the page shows, from the params. */
    initial: function (p) {
      var rowsN = SIZES[p.size][0], cols = SIZES[p.size][1];
      var agg = aggressors(rowsN, p.pattern);
      var per = effective(p.acts, p.mitigation);
      var ecc = p.mitigation === 'ecc';
      var flips = 0, wrongWords = 0, maxDist = 0, words = { clean: 0, corrected: 0, detected: 0, beyond: 0 };
      var rows = [];
      for (var r = 0; r < rowsN; r++) {
        var isAgg = agg.indexOf(r) >= 0;
        var near = (agg.indexOf(r - 1) >= 0 ? 1 : 0) + (agg.indexOf(r + 1) >= 0 ? 1 : 0);
        // Disturbance comes from adjacent aggressors only. No pattern puts two aggressors side by side, so an aggressor
        // row takes none (its own activations restore its charge anyway).
        var dist = per * near;
        if (dist > maxDist) maxDist = dist;
        var cells = [];
        for (var c = 0; c < cols; c++) {
          var bit = bitOf(r, c);
          var thr = p.thresh * (1 + SPREAD * toughness(r, c));
          var f = logic.flips(bit, dist, thr);
          if (f) flips++;
          cells.push({ bit: bit, now: f ? 0 : bit, flipped: f });
        }
        var ws = [];
        for (var w = 0; w * WORD < cols; w++) {
          var k = 0;
          for (var j = w * WORD; j < (w + 1) * WORD && j < cols; j++) if (cells[j].flipped) k++;
          var status = eccStatus(k);
          // What a program reading the word gets: without ECC every flip is wrong data; with it one flip is fixed,
          // two are reported, three or more may come back wrong.
          var wrong = ecc ? status === 'beyond' : k > 0;
          if (wrong) wrongWords++;
          if (ecc) words[status]++;
          ws.push({ flips: k, status: ecc ? status : (k ? 'wrong' : 'clean'), wrong: wrong });
        }
        rows.push({ r: r, kind: isAgg ? 'aggressor' : near ? 'victim' : 'far', near: near, dist: dist, cells: cells, words: ws });
      }
      var phase = p.acts === 0 ? 'idle' : flips > 0 ? 'flip' : maxDist >= 0.4 * p.thresh ? 'disturb' : 'activate';
      return {
        cols: cols,
        aggressors: agg,
        per: per,
        rows: rows,
        flips: flips,
        wrongWords: wrongWords,
        words: ecc ? words : null,
        maxDist: maxDist,
        // Activations per ms per aggressor row needed for p.acts thousand in one window.
        rate: Math.round(p.acts * 1000 / WINDOW_MS),
        phase: phase
      };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
