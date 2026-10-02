/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for routing-table: router R2's routing table from the URM book (ch. 11, Primjer 2) and one destination
   address, looked up by the longest-prefix rule (RFC 1812 §2.2.5.2). The steps check the entries one by one, in table
   order, then pick the longest matching prefix among the matches. The table order is a param, so the page can show
   that position decides nothing.
   Pure: no DOM, no Math.random, no Date, no timers. Addresses are unsigned 32-bit numbers; state is plain JSON.
   The lookup (match, firstDiff, lookup) is pure functions over plain data, so it can move to models/ unchanged. */
(function (root) {
  'use strict';

  // from sims/subnet-mask/sim.js @ ff94f8f (parse, format, bits, mask); models/ has no IPv4 model yet
  /** "10.1.2.55" → unsigned 32-bit number, or null if it is not a dotted-quad IPv4 address. */
  function parse(str) {
    var parts = String(str).split('.');
    if (parts.length !== 4) return null;
    var v = 0;
    for (var i = 0; i < 4; i++) {
      if (!/^\d{1,3}$/.test(parts[i])) return null;
      var n = Number(parts[i]);
      if (n > 255) return null;
      v = v * 256 + n;
    }
    return v;
  }

  /** Unsigned 32-bit number → "a.b.c.d". */
  function format(v) {
    return [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
  }

  /** 32 bits, most significant first, as a string of '0' and '1'. */
  function bits(v) {
    var s = (v >>> 0).toString(2);
    return '00000000000000000000000000000000'.slice(s.length) + s;
  }

  /** The mask of a prefix length: p ones from the left, then zeros. p = 0 is 0.0.0.0, p = 32 is 255.255.255.255. */
  function mask(p) {
    return p <= 0 ? 0 : (0xffffffff << (32 - p)) >>> 0; // a shift by 32 would be a shift by 0, hence the p = 0 case
  }
  // end of the copy from sims/subnet-mask

  /** An entry matches when the first `prefix` bits of the destination equal those of the entry's network.
      Prefix 0 compares no bit, so the default route matches every address. */
  function match(dest, net, prefix) {
    var m = mask(prefix);
    return ((dest & m) >>> 0) === ((net & m) >>> 0);
  }

  /** The first bit (0 = leftmost) within the prefix where destination and network differ, or -1 when they match. */
  function firstDiff(dest, net, prefix) {
    var x = (dest ^ net) >>> 0;
    for (var i = 0; i < prefix; i++) if ((x >>> (31 - i)) & 1) return i;
    return -1;
  }

  /** Longest-prefix lookup over a table of { net, prefix } (net a number). Returns the indices of the matching
      entries in table order, the winner (the longest matching prefix; on equal length the earlier entry, which only
      a duplicated entry can cause) and the first match in table order. winner = -1 when nothing matches. */
  function lookup(table, dest) {
    var matches = [], winner = -1;
    for (var i = 0; i < table.length; i++) {
      if (!match(dest, table[i].net, table[i].prefix)) continue;
      matches.push(i);
      if (winner < 0 || table[i].prefix > table[winner].prefix) winner = i; // strictly longer: ties keep the earlier
    }
    return { matches: matches, winner: winner, firstMatch: matches.length ? matches[0] : -1 };
  }

  /** R2's table, URM ch. 11, Primjer 2, in the book's order. hop is the next router's name (data, not a word). */
  var BOOK_TABLE = [
    { net: '10.0.0.0', prefix: 8, hop: 'R3' },
    { net: '10.1.0.0', prefix: 16, hop: 'R4' },
    { net: '10.1.2.0', prefix: 24, hop: 'R5' },
    { net: '0.0.0.0', prefix: 0, hop: 'R6' }
  ];

  /** The table in the chosen order: 'book' as printed, 'reversed' with the default route first. */
  function tableFor(order) {
    var t = BOOK_TABLE.map(function (e) { return { net: parse(e.net), prefix: e.prefix, hop: e.hop }; });
    return order === 'reversed' ? t.reverse() : t;
  }

  /** Everything the page shows for one set of params, with the first `checked` entries checked. */
  function analyze(p, checked) {
    var dest = parse(p.dest), table = tableFor(p.order), res = lookup(table, dest);
    return {
      dest: dest,
      checked: checked,
      rows: table.map(function (e, i) {
        return { net: e.net, prefix: e.prefix, hop: e.hop, match: res.matches.indexOf(i) >= 0, diff: firstDiff(dest, e.net, e.prefix) };
      }),
      matches: res.matches,
      winner: res.winner,
      firstMatch: res.firstMatch
    };
  }

  var N = BOOK_TABLE.length;
  // step 0: the table and the packet; steps 1..N: entry n − 1 checked; step N + 1: the longest match chosen
  function phaseOf(n) { return n === 0 ? 'start' : n <= N ? 'check' : 'choose'; }

  var logic = {
    /** The book's worked example: a packet for 10.1.2.55 at R2, table as printed (URM ch. 11, Primjer 2). */
    defaults: { dest: '10.1.2.55', order: 'book' },

    /** Destinations the page offers: Primjer 2 (10.1.2.55, 172.16.5.5) and the fragment's exercise 3 (10.5.0.1),
        plus 10.1.3.7 (simdeck's, so every specific entry wins once: it misses /24 by one bit). */
    dests: ['10.1.2.55', '172.16.5.5', '10.5.0.1', '10.1.3.7'],
    orders: ['book', 'reversed'],

    steps: N + 1,

    initial: function (p) { return Object.assign({ phase: 'start' }, analyze(p, 0)); },

    /** Step n checks entry n − 1 (n ≤ N) or chooses (n = N + 1). The numbers come from the params, so a param change
        recomputes them at the same step. */
    step: function (s, n, p) { return Object.assign({ phase: phaseOf(n) }, analyze(p, Math.min(n, N))); },

    bookTable: BOOK_TABLE,
    tableFor: tableFor,
    analyze: analyze,
    parse: parse,
    format: format,
    bits: bits,
    mask: mask,
    match: match,
    firstDiff: firstDiff,
    lookup: lookup
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
