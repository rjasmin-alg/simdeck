/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for subnet-mask: one IPv4 address, a mask of a given prefix length, and one destination, worked through the
   steps the URM book's chapter 8 describes as one flow: mask AND address = network address, host bits all ones =
   broadcast address, what is left for hosts, the same AND on the destination, compare, and whom the ARP request asks.
   Pure: no DOM, no Math.random, no Date, no timers. Addresses are unsigned 32-bit numbers; state is plain JSON.
   The IPv4 helpers (parse, mask, network, broadcast, hosts, sameNetwork) are pure functions over numbers, so they
   can move to models/ unchanged when a later sim (vlsm, routing-table) needs them. */
(function (root) {
  'use strict';

  /** "192.168.1.100" → unsigned 32-bit number, or null if it is not a dotted-quad IPv4 address. */
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

  /** Network address: the address AND the mask (every host bit zero). */
  function network(addr, p) { return (addr & mask(p)) >>> 0; }

  /** Broadcast address: the network part kept, every host bit one. */
  function broadcast(addr, p) { return (network(addr, p) | (~mask(p) >>> 0)) >>> 0; }

  /** Usable host addresses: 2^(32 − p) − 2, the network and broadcast addresses left out. Defined for p ≤ 30. */
  function hosts(p) { return Math.pow(2, 32 - p) - 2; }

  /** The local/remote decision (RFC 1122 §3.3.1.1): the same mask on both addresses gives the same result. */
  function sameNetwork(a, b, p) { return network(a, p) === network(b, p); }

  /** What an address is in the network of `addr` under prefix p: 'network', 'broadcast', 'host' or 'outside'. */
  function role(x, addr, p) {
    if (!sameNetwork(x, addr, p)) return 'outside';
    if (x === network(addr, p)) return 'network';
    if (x === broadcast(addr, p)) return 'broadcast';
    return 'host';
  }

  /** Bit positions (0 = leftmost) of the network part where the two network addresses differ. */
  function differing(a, b, p) {
    var x = (network(a, p) ^ network(b, p)) >>> 0, out = [];
    for (var i = 0; i < p; i++) if ((x >>> (31 - i)) & 1) out.push(i);
    return out;
  }

  /** Everything the page shows, worked out for one set of params. Every number is computed here, not on the page. */
  function analyze(p) {
    var addr = parse(p.addr), dest = parse(p.dest), n = p.prefix;
    var net = network(addr, n), bc = broadcast(addr, n);
    var local = sameNetwork(addr, dest, n);
    return {
      addr: addr,
      mask: mask(n),
      network: net,
      broadcast: bc,
      hostBits: 32 - n,
      hosts: hosts(n),
      first: net + 1,
      last: bc - 1,
      addrRole: role(addr, addr, n),        // 'host', or 'network'/'broadcast' when the address cannot be assigned
      dest: dest,
      destNetwork: network(dest, n),
      local: local,
      destRole: role(dest, addr, n),        // 'outside' when remote
      differ: differing(addr, dest, n),     // empty exactly when local
      arpFor: local ? 'dest' : 'gateway'    // whose MAC address the ARP request asks for
    };
  }

  var PHASES = ['start', 'network', 'broadcast', 'hosts', 'dest', 'compare', 'arpRequest', 'arpReply'];

  var logic = {
    /** The book's worked example (URM ch. 8, "Podmrežna maska, mrežna adresa i broadcast adresa"): 192.168.1.100 with
        255.255.255.192 (/26). The destination 192.168.1.77 is the book's Primjer 2 (a) address. */
    defaults: { addr: '192.168.1.100', prefix: 26, dest: '192.168.1.77' },

    /** Own addresses and destinations the page offers: the book's numbers (ch. 8 text, Primjer 2, 5, 6) and the
        fragment's exercises. */
    addrs: ['192.168.1.100', '192.168.1.10', '192.168.5.77'],
    dests: ['192.168.1.77', '192.168.1.137', '192.168.1.200', '192.168.2.50', '192.168.5.70', '8.8.8.8'],

    /** Prefix lengths the slider allows, as in the original: /31 and /32 have their own rules (no network and
        broadcast address) and are left out. */
    minPrefix: 1,
    maxPrefix: 30,

    phases: PHASES,
    steps: PHASES.length - 1,

    /** State at step 0: the address and the mask. */
    initial: function (p) { return Object.assign({ phase: PHASES[0] }, analyze(p)); },

    /** Step n reveals phase n. The numbers come from the params, so a param change recomputes them at the same step. */
    step: function (s, n, p) { return Object.assign({ phase: PHASES[n] }, analyze(p)); },

    analyze: analyze,
    parse: parse,
    format: format,
    bits: bits,
    mask: mask,
    network: network,
    broadcast: broadcast,
    hosts: hosts,
    sameNetwork: sameNetwork,
    role: role,
    differing: differing
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
