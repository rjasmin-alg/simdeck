/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the random student picker: a list of up to 30 names, drawn one at a time without repeats until everyone
   has been picked, then a new round. A tool (lecturer-only, docs/site-structure.md §2.1): no steps; the page keeps
   the state and redraws it after every action.
   Adopted from single-page-labs/random-student-picker.html (normalize, addStudent, the bulk split, pickRandom, the
   remove, reset and clear buttons); see NOTES.md for what changed.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON: { names: [...], picked: [...], last }.
   picked keeps the order of the draws (the original kept a Set, so the order was lost). The page draws the random
   number (crypto) and passes it to pick() as u in [0, 1), so the draw is testable.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** The original's limit on the list. */
  var MAX = 30;
  /** The original's input limit on one name (maxlength on the text field). */
  var MAX_LEN = 60;

  function empty() { return { names: [], picked: [], last: null }; }

  function copy(s) { return { names: s.names.slice(), picked: s.picked.slice(), last: s.last }; }

  /** Trim and collapse inner whitespace (the original's normalize). */
  function normalize(name) { return String(name).trim().replace(/\s+/g, ' ').slice(0, MAX_LEN); }

  /** The bulk field: one name per line, or separated by commas or semicolons (the original's split). */
  function splitBulk(text) {
    return String(text).split(/[\n,;]+/).map(normalize).filter(Boolean);
  }

  /** Why a name would not be added, or null. Same order as the original: empty, duplicate, full. */
  function rejectReason(state, name) {
    if (!name) return 'empty';
    if (state.names.indexOf(name) >= 0) return 'duplicate';
    if (state.names.length >= MAX) return 'full';
    return null;
  }

  /** Add names in order. Returns { state, added, duplicate, full } (counts; empty entries are skipped silently). */
  function add(state, list) {
    var s = copy(state);
    var out = { state: s, added: 0, duplicate: 0, full: 0 };
    list.forEach(function (raw) {
      var name = normalize(raw);
      var why = rejectReason(s, name);
      if (why === null) { s.names.push(name); out.added++; } else if (why !== 'empty') out[why]++;
    });
    return out;
  }

  /** Remove the name at index i; it leaves the picked list too, and the result shown if it was the last draw. */
  function remove(state, i) {
    var s = copy(state);
    if (i < 0 || i >= s.names.length) return s;
    var name = s.names.splice(i, 1)[0];
    s.picked = s.picked.filter(function (p) { return p !== name; });
    if (s.last === name) s.last = null;
    return s;
  }

  /** Names not picked yet in this round, in list order. */
  function pool(state) {
    return state.names.filter(function (n) { return state.picked.indexOf(n) < 0; });
  }

  /** Draw one of the remaining names: u in [0, 1) selects pool[floor(u · size)], so every name has the same chance.
      Returns the same state (and last = null) when nobody is left; the page then says so. */
  function pick(state, u) {
    var p = pool(state);
    var s = copy(state);
    if (p.length === 0) { s.last = null; return s; }
    var i = Math.min(p.length - 1, Math.max(0, Math.floor(u * p.length)));
    s.last = p[i];
    s.picked.push(p[i]);
    return s;
  }

  /** A new round: keep the names, forget who was picked (the original's "resetiraj odabrane"). */
  function newRound(state) { return { names: state.names.slice(), picked: [], last: null }; }

  /** Clear everything (the original's "obriši sve"). */
  function clear() { return empty(); }

  /** Make a stored state safe to use: drop unknown fields, duplicates, over-long lists and picks of absent names. */
  function sanitize(x) {
    var s = empty();
    if (!x || typeof x !== 'object') return s;
    if (Array.isArray(x.names)) s = add(s, x.names.filter(function (n) { return typeof n === 'string'; })).state;
    if (Array.isArray(x.picked)) {
      x.picked.forEach(function (n) { if (s.names.indexOf(n) >= 0 && s.picked.indexOf(n) < 0) s.picked.push(n); });
    }
    if (typeof x.last === 'string' && s.picked.indexOf(x.last) >= 0) s.last = x.last;
    return s;
  }

  var api = {
    MAX: MAX, MAX_LEN: MAX_LEN,
    defaults: { roll: true },
    empty: empty, normalize: normalize, splitBulk: splitBulk, rejectReason: rejectReason,
    add: add, remove: remove, pool: pool, pick: pick, newRound: newRound, clear: clear, sanitize: sanitize,
    initial: function () { return empty(); }
  };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.SimLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
