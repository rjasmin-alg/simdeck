/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ipv6-address-types: classify an IPv6 address by the most specific matching prefix (link-local, ULA,
   multicast, GUA, documentation, loopback, unspecified, or not assigned), and say how far a packet to it travels on a
   small topology (host H and neighbour N on link L1, router R1, host H2 on link L2, site border router R2, server S on
   the internet). Rules and numbers: SPEC.md.
   An explorer: no steps; the state is derived from the params. Pure: no DOM, no Math.random, no Date, no timers.
   The page loads this as a classic script (window.SimLogic); node tests require() it. The address helpers take plain
   data and hold no strings, so they can move to models/ unchanged. */
(function (root) {
  'use strict';

  // ── addresses: 8 groups of 16 bits ──

  /** Parse any RFC 4291 §2.2 text form without an embedded IPv4 part: '2001:DB8::1' → { groups: [0x2001, …] },
      or { error: code } (rule 7). */
  function parse(str) {
    var s = String(str == null ? '' : str).trim();
    if (!s) return { error: 'empty' };
    if (s.indexOf('/') >= 0) return { error: 'prefix' };
    if (s.indexOf('%') >= 0) return { error: 'zone' };
    if (s.indexOf('.') >= 0) return { error: 'dotted' };
    if (!/^[0-9a-fA-F:]+$/.test(s)) return { error: 'chars' };
    var halves = s.split('::');
    if (halves.length > 2) return { error: 'double' };
    var head = halves[0] ? halves[0].split(':') : [];
    var tail = halves.length > 1 && halves[1] ? halves[1].split(':') : [];
    var parts = head.concat(tail);
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] === '') return { error: 'colon' };
      if (parts[i].length > 4) return { error: 'long' };
    }
    if (halves.length === 1 && parts.length !== 8) return { error: 'count' };
    if (halves.length === 2 && parts.length > 7) return { error: 'count' };
    var fill = halves.length > 1 ? 8 - parts.length : 0;
    var out = head.map(function (g) { return parseInt(g, 16); });
    for (var k = 0; k < fill; k++) out.push(0);
    return { groups: out.concat(tail.map(function (g) { return parseInt(g, 16); })) };
  }

  // from sims/ipv6-slaac/sim.js @ 06c1f7e
  /** RFC 5952 §4: lower case, no leading zeros, the longest run of two or more zero groups as :: (the first on a tie). */
  function compress(groups) {
    var best = -1, bestLen = 1, i = 0;
    while (i < 8) {
      if (groups[i] !== 0) { i++; continue; }
      var j = i;
      while (j < 8 && groups[j] === 0) j++;
      if (j - i > bestLen) { best = i; bestLen = j - i; }
      i = j;
    }
    var hex = groups.map(function (g) { return g.toString(16); });
    if (best < 0) return hex.join(':');
    return hex.slice(0, best).join(':') + '::' + hex.slice(best + bestLen).join(':');
  }

  // from sims/ipv6-slaac/sim.js @ 06c1f7e
  /** All 32 hex digits, four per group: '2001:0db8:0001:0000:…'. */
  function full(groups) {
    return groups.map(function (g) { return ('000' + g.toString(16)).slice(-4); }).join(':');
  }

  /** The 128 bits as a string of '0' and '1', most significant first. */
  function bitsOf(groups) {
    return groups.map(function (g) { return ('000000000000000' + g.toString(2)).slice(-16); }).join('');
  }

  /** Rule 1: the prefix table, in the order the page lists it. reach: where a packet to such an address travels
      (rule 3); null for multicast, whose reach comes from the scope nibble (rule 4). group: the legend series. */
  var ROWS = [
    { id: 'unspecified', prefix: '::', len: 128, reach: 'none', group: 'special' },
    { id: 'loopback', prefix: '::1', len: 128, reach: 'host', group: 'special' },
    { id: 'link-local', prefix: 'fe80::', len: 10, reach: 'link', group: 'll' },
    { id: 'ula', prefix: 'fc00::', len: 7, reach: 'site', group: 'ula' },
    { id: 'multicast', prefix: 'ff00::', len: 8, reach: null, group: 'mc' },
    { id: 'doc', prefix: '2001:db8::', len: 32, reach: 'none', group: 'special' },
    { id: 'doc2', prefix: '3fff::', len: 20, reach: 'none', group: 'special' },
    { id: 'gua', prefix: '2000::', len: 3, reach: 'global', group: 'gua' }
  ];
  /** The implicit last row: anything no prefix above matches. */
  var OTHER = { id: 'other', prefix: null, len: 0, reach: 'none', group: 'special' };
  ROWS.forEach(function (r) { r.bits = bitsOf(parse(r.prefix).groups); });

  /** Rule 4: the multicast scope nibble (RFC 4291 §2.7, RFC 7346 for 3). Scopes the RFC leaves to the administrator
      (3, 4 and the unassigned ones) have no fixed region: reach 'admin'. 0 is reserved (dropped); F is reserved and
      treated as global. Organization-local (8) spans the sites of one organisation: this topology has one site. */
  var SCOPES = {
    0: { name: 'reserved', reach: 'none' },
    1: { name: 'interface-local', reach: 'host' },
    2: { name: 'link-local', reach: 'link' },
    3: { name: 'realm-local', reach: 'admin' },
    4: { name: 'admin-local', reach: 'admin' },
    5: { name: 'site-local', reach: 'site' },
    8: { name: 'organization-local', reach: 'site' },
    14: { name: 'global', reach: 'global' },
    15: { name: 'reserved-f', reach: 'global' }
  };
  function scopeOf(nibble) { return SCOPES[nibble] || { name: 'unassigned', reach: 'admin' }; }

  /** Well-known groups (IANA IPv6 Multicast Address Space): the page names them. */
  var GROUPS = { 'ff02::1': 'all-nodes', 'ff02::2': 'all-routers', 'ff05::1:3': 'dhcp-servers', 'ff0e::101': 'ntp' };
  function groupOf(groups, addr) {
    if (GROUPS[addr]) return GROUPS[addr];
    // solicited-node, ff02::1:ffXX:XXXX (RFC 4291 §2.7.1)
    if (groups[0] === 0xff02 && groups[1] === 0 && groups[2] === 0 && groups[3] === 0 && groups[4] === 0 &&
      groups[5] === 1 && (groups[6] >> 8) === 0xff) return 'solicited-node';
    return null;
  }

  /** Leading bits of `bits` equal to the row's prefix, up to its length. */
  function sameBits(bits, row) {
    var m = 0;
    while (m < row.len && bits[m] === row.bits[m]) m++;
    return m;
  }

  /** Every row whose prefix contains the address, longest prefix first (rule 1 tie-break: the length sort decides, not
      the table order, which only happens to list overlapping rows longest first; equal lengths keep the
      table order, which never decides anything: two /128 rows cannot both match). */
  function matchesOf(bits) {
    return ROWS.filter(function (r) { return sameBits(bits, r) === r.len; })
      .slice().sort(function (a, b) { return b.len - a.len || ROWS.indexOf(a) - ROWS.indexOf(b); });
  }

  /** For an address no row matches: the row it comes closest to, by the share of the prefix's bits it matches before
      the first difference (ties: table order). { row, same (bits equal), diff (index of the first differing bit) }. */
  function nearestOf(bits) {
    var best = null, bestShare = -1;
    ROWS.forEach(function (r) {
      var m = sameBits(bits, r);
      var share = m / r.len;
      if (share > bestShare) { best = { row: r.id, same: m, diff: m }; bestShare = share; }
    });
    return best;
  }

  /** Rule 3/4: the nodes a packet to an address of this reach gets to, and the node where it stops. */
  var NODES = ['H', 'N', 'R1', 'H2', 'R2', 'S'];
  var REACH = {
    host: { nodes: ['H'], stop: 'H' },
    link: { nodes: ['H', 'N', 'R1'], stop: 'R1' },
    site: { nodes: ['H', 'N', 'R1', 'H2', 'R2'], stop: 'R2' },
    global: { nodes: NODES.slice(), stop: null },
    none: { nodes: [], stop: 'H' },
    admin: { nodes: [], stop: null }
  };

  function rowOf(id) { return id === 'other' ? OTHER : ROWS.filter(function (r) { return r.id === id; })[0]; }

  /** Rules 1–6 on parsed groups. */
  function classify(groups) {
    var bits = bitsOf(groups);
    var addr = compress(groups);
    var matches = matchesOf(bits);
    var row = matches[0] || OTHER;
    var s = {
      address: addr,
      full: full(groups),
      groups: groups.slice(),
      bits: bits,
      type: row.id,
      group: row.group,
      matches: matches.map(function (r) { return r.id; }),
      matchedPrefix: row.prefix === null ? null : row.prefix + '/' + row.len,
      matchLen: row.len,
      scope: null,
      scopeNibble: null,
      mcGroup: null,
      lBit: null,
      nearest: null,
      reach: row.reach,
      note: null
    };
    if (row.id === 'multicast') {
      s.scopeNibble = groups[0] & 0xf;
      var sc = scopeOf(s.scopeNibble);
      s.scope = sc.name;
      s.reach = sc.reach;
      s.mcGroup = groupOf(groups, addr);
      s.note = s.scopeNibble === 8 ? 'org-scope' : s.scopeNibble === 15 ? 'scope-f' : s.scopeNibble === 0 ? 'scope-0'
        : sc.reach === 'admin' ? 'scope-admin' : null;
    } else if (row.id === 'ula') {
      s.lBit = (groups[0] >> 8) & 1;                          // rule 6: bit 7, right after the /7
      s.note = s.lBit ? 'ula-l1' : 'ula-l0';
    } else if (row.id === 'doc' || row.id === 'doc2') {
      s.note = 'doc-in-gua';                                  // rule 1: it is in 2000::/3 too, the longer prefix wins
    } else if (row.id === 'gua') {
      s.note = 'gua-bits';                                    // rule 2: the first three bits are 001
    } else if (row.id === 'unspecified') {
      s.note = 'never-destination';                           // rule 5
    } else if (row.id === 'other') {
      s.nearest = nearestOf(bits);
      s.note = (groups[0] & 0xffc0) === 0xfec0 ? 'site-local-deprecated' : 'nearest';
    }
    var r = REACH[s.reach];
    s.reachNodes = r.nodes.slice();
    s.stopAt = r.stop;
    // why it stops there: the reach's own word, except for 'none'. Only :: (rule 5) and multicast scope 0 are never
    // sent; a documentation or unassigned destination is sent by H to its router, and R1 drops it (rule 3)
    s.stopWhy = r.stop ? s.reach : null;
    if (s.reach === 'none' && row.id !== 'unspecified' && row.id !== 'multicast') {
      s.stopAt = 'R1';
      s.stopWhy = 'unrouted';
    }
    return s;
  }

  // ── params, presets, state ──

  var DEFAULT_ADDR = '2001:db8:85a3::8a2e:370:7334';

  /** Rule 7: typed text against the address in use. A valid text becomes the address; an invalid one leaves it. */
  function typed(current, text) {
    var r = parse(text);
    return r.error ? { addr: current, error: r.error } : { addr: String(text).trim(), error: null };
  }

  /** The presets' address lists (the chips over the table); a preset loads the first. */
  var SETS = {
    four: ['2001:db8:85a3::8a2e:370:7334', 'fe80::1', 'fc00::1', 'ff02::1'],
    'two-on-one': ['fe80::204:61ff:fe9d:f156', '2a02:c7f:5a3e:1:204:61ff:fe9d:f156'],
    'bits-not-digits': ['3ffe::1', '4000::1'],
    'multicast-scopes': ['ff02::1', 'ff02::2', 'ff05::1:3', 'ff0e::101'],
    special: ['::1', '::']
  };
  var PRESETS = Object.keys(SETS).map(function (id) { return { id: id, params: { set: id, addr: SETS[id][0] } }; });

  var defaults = { addr: DEFAULT_ADDR, set: 'four', showBits: true };

  /** The state for the params. An address that does not parse (only from a hand-made URL: the page never stores one)
      shows the default address with the error (rule 7). */
  function derive(p) {
    var r = parse(p.addr);
    var s = classify(r.error ? parse(DEFAULT_ADDR).groups : r.groups);
    s.input = String(p.addr == null ? '' : p.addr);
    s.error = r.error || null;
    s.set = SETS[p.set] ? p.set : defaults.set;
    s.list = SETS[s.set].slice();
    s.inList = s.list.map(function (a) { return compress(parse(a).groups); }).indexOf(s.address);
    return s;
  }

  var logic = {
    defaults: defaults,
    /** Explorer: no steps; the state is derived from the params. */
    initial: function (p) { return derive(p); },
    derive: derive, parse: parse, compress: compress, full: full, bitsOf: bitsOf, classify: classify, typed: typed,
    matchesOf: matchesOf, nearestOf: nearestOf, scopeOf: scopeOf, rowOf: rowOf,
    ROWS: ROWS, OTHER: OTHER, SCOPES: SCOPES, NODES: NODES, REACH: REACH, SETS: SETS, PRESETS: PRESETS,
    DEFAULT_ADDR: DEFAULT_ADDR
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
