/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for password-storage: four users as a server stores them under four schemes (plain, fast hash, salted fast
   hash, slow salted hash), what a stolen copy reveals (equal stored values, a lookup in a precomputed table), and the
   worst-case time to guess one password = guesses / rate on a log scale.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Rules and numbers: SPEC.md.
   SHA-256 (utf8, rotr, sha256Bytes, hex, sha256) from sims/hash-properties/sim.js @ 377c608, unchanged: there is no
   shared hash model in models/ yet (NOTES.md, Shared requests). */
(function (root) {
  'use strict';

  // ── SHA-256 (FIPS 180-4), from sims/hash-properties/sim.js @ 377c608 ──

  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  var H0 = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

  /** The UTF-8 bytes of a string (code points; a lone surrogate becomes U+FFFD, as TextEncoder does). */
  function utf8(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
        var d = str.charCodeAt(i + 1);
        if (d >= 0xdc00 && d <= 0xdfff) { c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00); i++; }
      }
      if (c >= 0xd800 && c <= 0xdfff) c = 0xfffd;
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }

  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

  /** SHA-256 of a byte array, as 32 bytes. */
  function sha256Bytes(bytes) {
    var len = bytes.length;
    var msg = bytes.slice();
    msg.push(0x80);
    while (msg.length % 64 !== 56) msg.push(0);
    var bitsHi = Math.floor(len / 0x20000000), bitsLo = (len * 8) >>> 0;
    msg.push((bitsHi >>> 24) & 255, (bitsHi >>> 16) & 255, (bitsHi >>> 8) & 255, bitsHi & 255,
      (bitsLo >>> 24) & 255, (bitsLo >>> 16) & 255, (bitsLo >>> 8) & 255, bitsLo & 255);
    var h = H0.slice();
    var w = new Array(64);
    for (var off = 0; off < msg.length; off += 64) {
      for (var t = 0; t < 16; t++) {
        var j = off + 4 * t;
        w[t] = ((msg[j] << 24) | (msg[j + 1] << 16) | (msg[j + 2] << 8) | msg[j + 3]) >>> 0;
      }
      for (t = 16; t < 64; t++) {
        var s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        var s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (t = 0; t < 64; t++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var T1 = (hh + S1 + ch + K[t] + w[t]) >>> 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var T2 = (S0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + T1) >>> 0; d = c; c = b; b = a; a = (T1 + T2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }
    var out = [];
    h.forEach(function (x) { out.push((x >>> 24) & 255, (x >>> 16) & 255, (x >>> 8) & 255, x & 255); });
    return out;
  }

  function hex(bytes) {
    return bytes.map(function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join('');
  }

  /** SHA-256 of a string's UTF-8 bytes, as 64 lower-case hex characters. */
  function sha256(str) { return hex(sha256Bytes(utf8(str))); }

  // ── the server's table ──

  /** The four users in the server's order. Ana and Marko share a password; Luka's password is the param.
      Salts are fixed stand-ins for random per-user values (rule 3), 8 hex characters each. */
  var USERS = [
    { name: 'Ana', password: 'ljeto2026', salt: '3f9a1c07' },
    { name: 'Marko', password: 'ljeto2026', salt: 'b24e6d91' },
    { name: 'Iva', password: 'Tr4m!vaj', salt: '7c05e2ab' },
    { name: 'Luka', password: null, salt: 'e81d4f36' }
  ];
  var SCHEMES = ['plain', 'hash', 'salted', 'slow'];
  var ALPHABETS = [10, 26, 62, 95];
  /** Common passwords: the precomputed (rainbow) table's entries and a sample of the breach list (rules 2, 6). */
  var COMMON = ['123456', 'lozinka', 'qwerty', 'ljeto2026', 'volimte', 'sunce123', 'iloveyou', 'qwertyuiopasdfg'];
  var LIST_SIZE = 1e6;
  /** Rounds of SHA-256 behind the slow column's stored value. A stand-in for a slow function; the attacker's cost is
      the slowRate param, not these rounds (SPEC.md, rule 4). */
  var ROUNDS = 1000;
  /** Shown characters of a stored hash (64 hex in full). */
  var SHOW = 16;
  var YEAR = 365.25 * 86400;

  var slowMemo = {};
  function slowHash(salt, password) {
    var key = salt + '\u0000' + password;
    if (!slowMemo[key]) {
      var x = sha256Bytes(utf8(salt + password));
      for (var r = 1; r < ROUNDS; r++) x = sha256Bytes(x);
      slowMemo[key] = hex(x);
    }
    return slowMemo[key];
  }

  /** What the server stores for one user under one scheme, in full (rules 1–4). */
  function storedFull(user, scheme) {
    if (scheme === 'plain') return user.password;
    if (scheme === 'hash') return sha256(user.password);
    if (scheme === 'salted') return sha256(user.salt + user.password);
    return slowHash(user.salt, user.password);
  }

  function byName(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

  /** Users whose stored values are equal, groups of two or more. Tie-break: members in name order, groups by their
      first member's name. */
  function sameGroups(rows) {
    var by = {};
    rows.forEach(function (r) { (by[r.value] = by[r.value] || []).push(r.name); });
    return Object.keys(by).map(function (k) { return by[k].slice().sort(byName); })
      .filter(function (g) { return g.length > 1; })
      .sort(function (a, b) { return byName(a[0], b[0]); });
  }

  var rainbowMemo = null;
  /** The precomputed table: each common password with its unsalted SHA-256 (rule 2). */
  function rainbowTable() {
    if (!rainbowMemo) rainbowMemo = COMMON.map(function (p) { return { password: p, hash: sha256(p) }; });
    return rainbowMemo;
  }

  /** Users whose stored value is in the precomputed table, in server order: { name, password }. Plain needs no
      lookup (null). */
  function rainbowHits(users, scheme) {
    if (scheme === 'plain') return null;
    var index = {};
    rainbowTable().forEach(function (e) { index[e.hash] = e.password; });
    return users.filter(function (u) { return index[storedFull(u, scheme)] !== undefined; })
      .map(function (u) { return { name: u.name, password: index[storedFull(u, scheme)] }; });
  }

  // ── the attack ──

  /** Worst-case guessing per scheme (rules 4–6). Unsalted: one pass checks every stored value at once; salted: each
      user is attacked separately, so the whole table takes users × one password. */
  function attackOf(p, users) {
    var space = Math.pow(p.alphabet, p.length);
    var guesses = p.inBreachList ? Math.min(space, LIST_SIZE) : space;
    var n = users.length;
    function row(scheme, rate, perUser) {
      if (!rate) return { scheme: scheme, guesses: 0, seconds: 0, average: 0, table: 0, rate: 0 };
      var s = guesses / rate;
      return { scheme: scheme, guesses: guesses, seconds: s, average: s / 2, table: perUser ? s * n : s, rate: rate };
    }
    return {
      space: space, guesses: guesses, listSize: LIST_SIZE,
      schemes: [row('plain', 0), row('hash', p.fastRate, false), row('salted', p.fastRate, true), row('slow', p.slowRate, true)]
    };
  }

  /** Length, alphabet and breach-list flag of a typed password: the attacker's view of its shape. Length clamped to
      4…20; alphabet the smallest of digits, lowercase, letters and digits, or any printable that covers every
      character. Null for an empty password. */
  function shapeOf(password) {
    var chars = Array.from(String(password));
    if (!chars.length) return null;
    var alphabet = /^[0-9]+$/.test(password) ? 10 : /^[a-z]+$/.test(password) ? 26 : /^[A-Za-z0-9]+$/.test(password) ? 62 : 95;
    return { length: Math.max(4, Math.min(20, chars.length)), alphabet: alphabet, inBreachList: COMMON.indexOf(password) >= 0 };
  }

  // ── numbers for the page (pure; the separators come from the strings) ──

  var UNITS = [['us', 1e-6], ['ms', 1e-3], ['s', 1], ['min', 60], ['h', 3600], ['d', 86400], ['y', YEAR]];

  /** Round for display: one decimal under 10, whole numbers from 10 up. */
  function roundShow(v) { return v < 10 ? Math.round(v * 10) / 10 : Math.round(v); }

  /** A duration as { unit, value } (value rounded) or { unit: 'y', m, e } for a million years and more, or
      { unit: 'now' } for zero. The largest unit with value ≥ 1; when rounding reaches the next unit (59.97 s), that
      one (1 min). */
  function timeParts(seconds) {
    if (!(seconds > 0)) return { unit: 'now' };
    var years = seconds / YEAR;
    if (roundShow(years) >= 1e6) return Object.assign({ unit: 'y' }, sci(years));
    var i = UNITS.length - 1;
    while (i > 0 && seconds / UNITS[i][1] < 1) i--;
    if (i + 1 < UNITS.length && roundShow(seconds / UNITS[i][1]) * UNITS[i][1] >= UNITS[i + 1][1]) i++;
    return { unit: UNITS[i][0], value: roundShow(seconds / UNITS[i][1]) };
  }

  /** x as m · 10^e with m rounded to three significant figures (1 ≤ m < 10). */
  function sci(x) {
    var e = Math.floor(Math.log10(x));
    var m = Math.round(x / Math.pow(10, e) * 100) / 100;
    if (m >= 10) { m = Math.round(m) / 10; e += 1; }
    return { m: m, e: e };
  }

  /** A number with the page language's separators: grouped thousands, one decimal place at most. */
  function fmtNum(v, group, decimal) {
    var neg = v < 0, s = String(Math.abs(v)).split('.');
    var int = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, group);
    return (neg ? '-' : '') + int + (s[1] ? decimal + s[1] : '');
  }

  var SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  /** An exponent in Unicode superscripts: 14 → ¹⁴, -6 → ⁻⁶. */
  function sup(e) { return String(e).replace(/-/g, '⁻').replace(/\d/g, function (d) { return SUP[d]; }); }

  /** Position on the log time axis, 0 … 1, from 0.1 µs to 10¹² years; over: past the right end. */
  var LOG_MIN = -7, LOG_MAX = Math.log10(1e12 * YEAR);
  function axisPos(seconds) {
    if (!(seconds > 0)) return { pos: 0, over: false };
    var x = (Math.log10(seconds) - LOG_MIN) / (LOG_MAX - LOG_MIN);
    return { pos: Math.max(0, Math.min(1, x)), over: x > 1 };
  }
  /** Tick marks of the axis: seconds and a label key. */
  var TICKS = [[1e-6, 'us'], [1e-3, 'ms'], [1, 's'], [3600, 'h'], [YEAR, 'y'], [1e3 * YEAR, 'ky'], [1e6 * YEAR, 'My'], [1e9 * YEAR, 'Gy'], [1e12 * YEAR, 'Ty']];

  var logic = {
    defaults: { scheme: 'hash', password: 'k7Pm2xQa', length: 8, alphabet: 62, inBreachList: false, slowRate: 1e4, fastRate: 1e10 },
    SCHEMES: SCHEMES,
    ALPHABETS: ALPHABETS,
    FAST_RATES: [1e8, 1e9, 1e10, 1e11],
    SLOW_RATES: [1e3, 1e4, 1e5, 1e6],
    COMMON: COMMON,
    LIST_SIZE: LIST_SIZE,
    ROUNDS: ROUNDS,
    SHOW: SHOW,
    YEAR: YEAR,
    TICKS: TICKS,

    presets: [
      { id: 'four-chars', params: { scheme: 'slow', password: 'kava', length: 4, alphabet: 26, inBreachList: false } },
      { id: 'same-password', params: { scheme: 'hash' } },
      { id: 'eight-alnum', params: { scheme: 'hash', password: 'k7Pm2xQa', length: 8, alphabet: 62, inBreachList: false } },
      { id: 'passphrase15', params: { scheme: 'hash', password: 'plavakucanabrdu', length: 15, alphabet: 26, inBreachList: false } },
      { id: 'breached', params: { scheme: 'slow', password: 'qwertyuiopasdfg', length: 15, alphabet: 26, inBreachList: true } }
    ],

    /** The whole state; an explorer has no steps. */
    initial: function (p) {
      var users = USERS.map(function (u) {
        return { name: u.name, password: u.password === null ? String(p.password) : u.password, salt: u.salt };
      });
      var table = users.map(function (u) {
        var stored = {};
        SCHEMES.forEach(function (s) { var v = storedFull(u, s); stored[s] = s === 'plain' ? v : v.slice(0, SHOW); });
        return { name: u.name, stored: stored };
      });
      var groups = {}, hits = {};
      SCHEMES.forEach(function (s) {
        groups[s] = sameGroups(users.map(function (u) { return { name: u.name, value: storedFull(u, s) }; }));
        hits[s] = rainbowHits(users, s);
      });
      var attack = attackOf(p, users);
      var mine = attack.schemes[SCHEMES.indexOf(p.scheme)];
      attack.secondsWorst = mine.seconds;
      attack.sameHashGroups = groups[p.scheme];
      attack.rainbowHit = hits[p.scheme];
      return {
        users: users,
        scheme: p.scheme,
        policy: { length: p.length, alphabet: p.alphabet, inBreachList: !!p.inBreachList },
        rate: { fast: p.fastRate, slow: p.slowRate },
        table: table,
        groups: groups,
        hits: hits,
        attack: attack
      };
    },

    /** Which half the caption speaks about: 'table' after a scheme change or the same-password preset, 'time' after any
        other change; nothing changed keeps it. With no previous params (page start) the defaults stand in. */
    nextFocus: function (focus, prev, params, preset, prevPreset) {
      if (preset && preset !== prevPreset) return preset === 'same-password' ? 'table' : 'time';
      if (!prev) prev = logic.defaults;
      var changed = Object.keys(params).filter(function (k) { return !Object.is(prev[k], params[k]); });
      if (!changed.length) return focus || 'table';
      return changed.indexOf('scheme') >= 0 ? 'table' : 'time';
    },

    sha256: sha256,
    sha256Bytes: sha256Bytes,
    utf8: utf8,
    hex: hex,
    slowHash: slowHash,
    storedFull: storedFull,
    sameGroups: sameGroups,
    rainbowTable: rainbowTable,
    rainbowHits: rainbowHits,
    attackOf: attackOf,
    shapeOf: shapeOf,
    timeParts: timeParts,
    sci: sci,
    fmtNum: fmtNum,
    sup: sup,
    axisPos: axisPos
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
