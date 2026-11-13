/* SPDX-License-Identifier: AGPL-3.0-or-later
   A crew member's shooting day as an ordered list of blocks (catalogue §5.25: set-hearing reads the shooting day's
   exposures). The day is kept in a fixed number of slots, each a kind (or 'none'), a length in minutes and a flag (here:
   ear defenders worn); this module turns the slots into the day's blocks, in order and from the call, and gives the
   patches that add, remove, lengthen, shorten and flag a block. The kinds are the caller's: this file knows nothing of
   noise. Pure plain data and functions, no strings and no page code, so the coordinator can promote it to models/
   unchanged (or merge it with set-call-sheet's day when that is built). Registers on
   globalThis.SimdeckModels['set-day-blocks']; node tests require() it. Rules: SPEC.md rules 1–3. */
(function (root) {
  'use strict';

  var SLOTS = 6;            // blocks a day can hold
  var CALL = 420;           // the crew call, 07:00, minutes from midnight
  var MIN_LEN = 15, MAX_LEN = 240, STEP = 15, NEW_LEN = 60;
  var NONE = 'none';

  function kKey(i) { return 'k' + (i + 1); }
  function tKey(i) { return 't' + (i + 1); }
  function eKey(i) { return 'e' + (i + 1); }

  /** Rule 2: a block's length in whole STEPs within MIN_LEN … MAX_LEN; not a number → NEW_LEN. */
  function clampLen(x) {
    var n = typeof x === 'number' && isFinite(x) ? Math.round(x / STEP) * STEP : NEW_LEN;
    return Math.max(MIN_LEN, Math.min(MAX_LEN, n));
  }

  /** Rule 1: the day's blocks from the slots, in slot order; a slot whose kind is 'none' or not one of `kinds` is
   *  skipped, so the blocks are always packed. Each block: { i (its index in the day), slot, kind, len, flag, start,
   *  end } with start and end in minutes from the call. */
  function blocks(p, kinds) {
    var out = [], at = 0;
    for (var s = 0; s < SLOTS; s++) {
      var k = p[kKey(s)];
      if (k === NONE || kinds.indexOf(k) < 0) continue;
      var len = clampLen(p[tKey(s)]);
      out.push({ i: out.length, slot: s, kind: k, len: len, flag: p[eKey(s)] === true, start: at, end: at + len });
      at += len;
    }
    return out;
  }

  /** The patch that writes a list of { kind, len, flag } back into the slots, packed from slot 1; the rest empty. */
  function write(list) {
    var patch = {};
    for (var s = 0; s < SLOTS; s++) {
      var b = list[s];
      patch[kKey(s)] = b ? b.kind : NONE;
      patch[tKey(s)] = b ? b.len : NEW_LEN;
      patch[eKey(s)] = b ? b.flag : false;
    }
    return patch;
  }
  function copy(bs) { return bs.map(function (b) { return { kind: b.kind, len: b.len, flag: b.flag }; }); }

  /** Rule 3: add a block of `kind` (NEW_LEN, flag off) at the end of the day; null when the day is full or the kind is
   *  unknown. */
  function add(p, kinds, kind) {
    var bs = blocks(p, kinds);
    if (bs.length >= SLOTS || kinds.indexOf(kind) < 0) return null;
    var list = copy(bs);
    list.push({ kind: kind, len: NEW_LEN, flag: false });
    return write(list);
  }

  /** Rule 3: remove block i; the later blocks move up. null when there is no block i. */
  function remove(p, kinds, i) {
    var bs = blocks(p, kinds);
    if (!(i >= 0 && i < bs.length)) return null;
    var list = copy(bs);
    list.splice(i, 1);
    return write(list);
  }

  /** Rule 3: lengthen (dir > 0) or shorten block i by STEP; null at a bound or when there is no block i. */
  function bump(p, kinds, i, dir) {
    var bs = blocks(p, kinds);
    if (!(i >= 0 && i < bs.length)) return null;
    var next = Math.max(MIN_LEN, Math.min(MAX_LEN, bs[i].len + (dir < 0 ? -STEP : STEP)));
    if (next === bs[i].len) return null;
    var list = copy(bs);
    list[i].len = next;
    return write(list);
  }

  /** Rule 3: switch block i's flag; null when there is no block i. */
  function flag(p, kinds, i) {
    var bs = blocks(p, kinds);
    if (!(i >= 0 && i < bs.length)) return null;
    var list = copy(bs);
    list[i].flag = !list[i].flag;
    return write(list);
  }

  var model = {
    SLOTS: SLOTS, CALL: CALL, MIN_LEN: MIN_LEN, MAX_LEN: MAX_LEN, STEP: STEP, NEW_LEN: NEW_LEN, NONE: NONE,
    kKey: kKey, tKey: tKey, eKey: eKey,
    clampLen: clampLen, blocks: blocks, write: write, add: add, remove: remove, bump: bump, flag: flag
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {})['set-day-blocks'] = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
