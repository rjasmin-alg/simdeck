/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for multiple-access: three ways to share one channel (SPEC.md). FDMA cuts the band into channels, TDMA the
   frame into slots, CDMA lets everyone send at once and separates them by orthogonal codes.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. Explorer: initial() only. */
(function (root) {
  'use strict';

  var MIN_CHANNEL_KHZ = 12.5;   // the narrowest FDMA channel
  var GUARD_KHZ = 2.5;          // guard band between FDMA channels
  var FRAME_MS = 60;            // TDMA frame
  var GUARD_MS = 2.5;           // guard time after each TDMA slot
  var MAX_SLOTS = 4;            // slots a TDMA frame holds
  var MAX_USERS = 5;
  // Rows of the 4×4 Walsh–Hadamard matrix (rule 4): mutually orthogonal.
  var CODES = [[1, 1, 1, 1], [1, -1, 1, -1], [1, 1, -1, -1], [1, -1, -1, 1]];
  var L = CODES.length;         // chips per bit
  var BANDS = [100, 12.5];
  var SCHEMES = ['fdma', 'tdma', 'cdma'];

  var defaults = { scheme: 'fdma', users: 4, idle: 0, bits: 13, guard: true, band: 100 };

  function clampInt(v, lo, hi, dflt) {
    v = Math.round(Number(v));
    return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : dflt;
  }
  // Rounded to 1e-9 so shares and widths compare exactly in tests and in the page.
  function r9(x) { return Math.round(x * 1e9) / 1e9 || 0; }

  /** Bit of user id (1-based) from the bit mask: bit (id − 1). */
  function bitOf(mask, id) { return (mask >> (id - 1)) & 1; }
  /** The mask with user id's bit flipped. */
  function flipBit(mask, id) { return mask ^ (1 << (id - 1)); }

  /** Rule 5: how many users each scheme can serve. */
  function capacity(scheme, bandKHz, guard) {
    if (scheme === 'fdma') {
      var g = guard ? GUARD_KHZ : 0;
      return Math.floor(r9((bandKHz + g) / (MIN_CHANNEL_KHZ + g)));
    }
    if (scheme === 'tdma') return MAX_SLOTS;
    return L;
  }

  /** Rule 1: n channels of (B − (n − 1)·guard)/n, channel k from k·(w + g). */
  function fdmaChannels(n, bandKHz, guard) {
    var g = guard ? GUARD_KHZ : 0, w = n ? (bandKHz - (n - 1) * g) / n : 0, ch = [], gb = [];
    for (var k = 0; k < n; k++) {
      var lo = k * (w + g);
      ch.push({ index: k, user: k + 1, loKHz: r9(lo), hiKHz: r9(lo + w), widthKHz: r9(w) });
      if (k < n - 1 && g) gb.push({ loKHz: r9(lo + w), hiKHz: r9(lo + w + g) });
    }
    return { channels: ch, guards: gb, widthKHz: r9(w) };
  }

  /** Rule 2: n slots of (frame − n·guardTime)/n, slot k from k·(len + gt), its guard time right after it. */
  function tdmaSlots(n, guard) {
    var g = guard ? GUARD_MS : 0, len = n ? (FRAME_MS - n * g) / n : 0, sl = [], gt = [];
    for (var k = 0; k < n; k++) {
      var t0 = k * (len + g);
      sl.push({ index: k, user: k + 1, startMs: r9(t0), endMs: r9(t0 + len), lenMs: r9(len) });
      if (g) gt.push({ startMs: r9(t0 + len), endMs: r9(t0 + len + g) });
    }
    return { slots: sl, guards: gt, lenMs: r9(len) };
  }

  /** Rule 3: the air carries Σ d_i·c_i; receiver j computes (Σ chips × c_j)/L and decides by sign. */
  function cdma(users) {
    var rows = users.map(function (u) {
      var d = u.active ? (u.bit ? 1 : -1) : 0;
      return { id: u.id, code: u.code, d: d, chips: CODES[u.code].map(function (c) { return d * c || 0; }) };
    });
    var sum = [0, 0, 0, 0];
    rows.forEach(function (r) { r.chips.forEach(function (x, k) { sum[k] += x; }); });
    var decoded = CODES.map(function (code, j) {
      var corr = r9(sum.reduce(function (a, x, k) { return a + x * code[k]; }, 0) / L);
      var holders = users.filter(function (u) { return u.code === j; }).map(function (u) { return u.id; });
      var senders = rows.filter(function (r) { return r.code === j && r.d !== 0; }).map(function (r) { return r.id; });
      // Tie-break: a correlation of exactly 0 decides nothing (nobody sent on this code, or two senders cancel).
      var sign = corr > 0 ? 1 : corr < 0 ? 0 : null;
      var collision = senders.length > 1;
      return { code: j, holders: holders, senders: senders, products: sum.map(function (x, k) { return x * code[k] || 0; }),
        corr: corr, sign: sign, collision: collision, bit: collision ? null : sign };
    });
    return { rows: rows, sumChips: sum, decoded: decoded };
  }

  /** The explorer state for one set of params; all three schemes are computed, `scheme` says which is shown. */
  function initial(p) {
    var scheme = SCHEMES.indexOf(p.scheme) >= 0 ? p.scheme : defaults.scheme;
    var n = clampInt(p.users, 1, MAX_USERS, defaults.users);
    var idle = clampInt(p.idle, 0, MAX_USERS, 0);
    var mask = clampInt(p.bits, 0, 31, defaults.bits);
    var band = BANDS.indexOf(Number(p.band)) >= 0 ? Number(p.band) : defaults.band;
    var guard = !!p.guard;
    var users = [];
    // Rule 6: users take channels, slots and codes in the order they were added, lowest free index first;
    // in CDMA, past L the codes are reused from the lowest index (user L + 1 gets code 1).
    for (var id = 1; id <= n; id++) users.push({ id: id, active: id !== idle, bit: bitOf(mask, id), code: (id - 1) % L });

    function common(s, cap, perUser, idleShare, guardShare) {
      var served = s === 'cdma' ? n : Math.min(n, cap);
      var activeServed = users.filter(function (u) { return u.id <= served && u.active; }).length;
      var share = perUser.bandwidthKHz / band * perUser.timeShare;   // unrounded, so N shares add up exactly
      var used = s === 'cdma' ? (activeServed ? 1 : 0) : r9(activeServed * share);
      return {
        capacity: cap, served: served,
        refused: users.filter(function (u) { return u.id > served; }).map(function (u) { return u.id; }),
        capacityLeft: Math.max(0, cap - n), overflow: n > cap,
        perUser: { bandwidthKHz: perUser.bandwidthKHz, timeShare: r9(perUser.timeShare), share: s === 'cdma' ? 1 : r9(share) },
        usedShare: used, idleShare: idleShare, guardShare: guardShare,
        freeShare: Math.max(0, Math.round((1 - used - (s === 'cdma' ? 0 : idleShare + guardShare)) * 1e6) / 1e6)
      };
    }

    var g = guard ? GUARD_KHZ : 0, gt = guard ? GUARD_MS : 0;
    var capF = capacity('fdma', band, guard), nF = Math.min(n, capF), F = fdmaChannels(nF, band, guard);
    var fdma = common('fdma', capF, { bandwidthKHz: F.widthKHz, timeShare: 1 },
      idle && idle <= nF ? r9(F.widthKHz / band) : 0, r9((nF - 1) * g / band));
    fdma.channels = F.channels.map(function (c) { c.active = c.user !== idle; return c; });
    fdma.guards = F.guards;
    // the channel width if all n users had one (below MIN_CHANNEL_KHZ: the reason a user is refused)
    fdma.wouldBeKHz = r9((band - (n - 1) * g) / n);

    var capT = capacity('tdma', band, guard), nT = Math.min(n, capT), T = tdmaSlots(nT, guard);
    var tdma = common('tdma', capT, { bandwidthKHz: band, timeShare: T.lenMs / FRAME_MS },
      idle && idle <= nT ? r9(T.lenMs / FRAME_MS) : 0, r9(nT * gt / FRAME_MS));
    tdma.slots = T.slots.map(function (x) { x.active = x.user !== idle; return x; });
    tdma.guards = T.guards;

    var C = cdma(users);
    var cd = common('cdma', L, { bandwidthKHz: band, timeShare: 1 }, 0, 0);
    cd.rows = C.rows; cd.sumChips = C.sumChips; cd.decoded = C.decoded;
    cd.collided = users.filter(function (u) { return C.decoded[u.code].collision && u.active; }).map(function (u) { return u.id; });
    // CDMA refuses nobody, but a user whose bit cannot be read is not served
    cd.served = n - cd.collided.length;
    cd.reused = users.filter(function (u) { return u.id > L; }).map(function (u) { return u.id; });

    return { scheme: scheme, n: n, idle: idle <= n ? idle : 0, bits: mask, guard: guard, bandKHz: band, frameMs: FRAME_MS,
      users: users, fdma: fdma, tdma: tdma, cdma: cd };
  }

  /** What moved between two states, for the "changed" marks: user ids whose channel, slot or chips differ in the
      shown scheme (new users included), and the air chips (CDMA) that changed. Nothing when the scheme differs. */
  function changed(prev, next) {
    var out = { users: [], chips: [] };
    if (!prev || prev.scheme !== next.scheme) return out;
    var k = next.scheme;
    function key(s, id) {
      if (k === 'fdma') { var c = s.fdma.channels[id - 1]; return c ? c.loKHz + '/' + c.hiKHz : null; }
      if (k === 'tdma') { var x = s.tdma.slots[id - 1]; return x ? x.startMs + '/' + x.endMs : null; }
      var r = s.cdma.rows[id - 1]; return r ? r.chips.join(',') : null;
    }
    next.users.forEach(function (u) {
      var a = key(prev, u.id), b = key(next, u.id);
      if (b !== null && a !== b) out.users.push(u.id);
    });
    if (k === 'cdma') next.cdma.sumChips.forEach(function (x, i) { if (prev.cdma.sumChips[i] !== x) out.chips.push(i); });
    return out;
  }

  var presets = [
    { id: 'fdma-4', params: { scheme: 'fdma', users: 4 } },
    { id: 'fdma-idle', params: { scheme: 'fdma', users: 4, idle: 2 } },
    { id: 'tdma-dmr', params: { scheme: 'tdma', users: 2, band: 12.5 } },
    { id: 'cdma-2', params: { scheme: 'cdma', users: 2, bits: 13 } },
    { id: 'cdma-overflow', params: { scheme: 'cdma', users: 5, bits: 13 } }
  ];

  var logic = {
    MIN_CHANNEL_KHZ: MIN_CHANNEL_KHZ, GUARD_KHZ: GUARD_KHZ, FRAME_MS: FRAME_MS, GUARD_MS: GUARD_MS,
    MAX_SLOTS: MAX_SLOTS, MAX_USERS: MAX_USERS, CODES: CODES, L: L, BANDS: BANDS, SCHEMES: SCHEMES,
    defaults: defaults, presets: presets,
    initial: initial, capacity: capacity, fdmaChannels: fdmaChannels, tdmaSlots: tdmaSlots, cdma: cdma,
    changed: changed, bitOf: bitOf, flipBit: flipBit
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
