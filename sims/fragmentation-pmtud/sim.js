/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fragmentation-pmtud: one packet from the sender over link A (MTU 9000, never the bottleneck) and link B
   (MTU mtuB, maybe a tunnel); R2 forwards it, fragments it (IPv4, DF 0), or drops it with ICMP "fragmentation needed"
   (DF 1, or IPv6 "Packet Too Big"); path MTU discovery, and the black hole when that ICMP is blocked.
   Rules and numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var HDR = { ipv4: 20, ipv6: 40 };        // IP header without options or extension headers (rule 2, rule 8)
  var MIN_MTU = { ipv4: 68, ipv6: 1280 };  // RFC 791 minimum; RFC 8200 §5 (rules 7, 8)
  var TCP_HDR = 20;                         // TCP header without options (MSS, rule 5)
  var SYN_TCP = 40;                         // TCP header of the handshake, with options (rule 6: 60 B over IPv4)
  var LINK_A = 9000;                        // link A's MTU: never the bottleneck (SPEC "Scene", deviation)
  var ID = 0x1c46;                          // Identification of the packet (any value; rule 2)
  var RETRIES = 3;                          // retransmissions shown in the black hole (rule 6)

  /** Encapsulation overheads on link B, in bytes, with a language-neutral name. */
  var OVERHEADS = [[0, ''], [4, '802.1Q'], [8, 'PPPoE'], [24, 'GRE'], [50, 'VXLAN']];

  var defaults = { size: 1500, mtuB: 1500, overhead: 0, df: false, icmpBlocked: false, proto: 'ipv4' };
  var RANGES = { size: [68, 9000, 1], mtuB: [68, 9000, 4] };

  function P(over) {
    var p = {};
    Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; });
    Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
    return p;
  }

  function overheadName(n) {
    for (var i = 0; i < OVERHEADS.length; i++) if (OVERHEADS[i][0] === n) return OVERHEADS[i][1];
    return '';
  }

  /** One block on the wire: total length, offset in 8-byte units, MF, data bytes, first data byte. */
  function block(hdr, data, start, mf) { return { len: hdr + data, offset: start / 8, mf: mf, data: data, start: start }; }

  /**
   * Rule 2: the fragments of a packet of `size` bytes (header `hdr`) for an effective MTU `eff`. A packet that fits
   * is one block (rule 1). Data per fragment ⌊(eff − hdr) / 8⌋ · 8; the last takes the rest; MF 1 on all but the last.
   */
  function fragment(size, eff, hdr) {
    hdr = hdr || HDR.ipv4;
    var data = size - hdr;
    if (size <= eff) return [block(hdr, data, 0, false)];
    var per = Math.floor((eff - hdr) / 8) * 8;
    var out = [], start = 0;
    while (data > 0) {
      var d = Math.min(per, data);
      data -= d;
      out.push(block(hdr, d, start, data > 0));
      start += d;
    }
    return out;
  }

  /** The derived state for one set of params (SPEC.md "State"). */
  function derive(p) {
    var v6 = p.proto === 'ipv6';
    var hdr = v6 ? HDR.ipv6 : HDR.ipv4;
    var min = v6 ? MIN_MTU.ipv6 : MIN_MTU.ipv4;
    var effMtu = p.mtuB - p.overhead;
    var tcp = v6 || !!p.df;
    var hs = hdr + SYN_TCP;
    var sent = block(hdr, p.size - hdr, 0, false);
    var s = {
      v6: v6, hdr: hdr, min: min, effMtu: effMtu, linkA: LINK_A, id: ID, overhead: p.overhead, tunnel: overheadName(p.overhead),
      tcp: tcp, handshake: hs, fits: p.size <= effMtu, sent: sent, per: Math.floor((effMtu - hdr) / 8) * 8,
      outcome: null, onB: [], fragments: [], icmp: null, pmtu: null, mss: null, retries: 0, timeline: []
    };
    var T = s.timeline;
    var row = function (who, k, mark, v) { T.push({ who: who, k: k, mark: mark, v: v || {} }); };
    var noIcmp = function () { if (p.icmpBlocked) row('fw', 'noIcmp', 'info', {}); };

    if (effMtu < min) {                                         // rules 7, 8
      s.outcome = 'refused';
      s.fits = false;
      s.per = 0;
      row('r2', 'refused', 'drop', { eff: effMtu, min: min, v6: v6 });
      return s;
    }
    if (tcp) row('sender', 'handshake', 'ok', { n: hs });
    row('sender', 'send', 'info', { size: p.size, df: tcp && !v6, v6: v6 });

    if (s.fits) {                                               // rule 1
      s.outcome = 'pass';
      s.onB = [sent];
      row('r2', 'forward', 'ok', { size: p.size, eff: effMtu });
      row('receiver', 'receive', 'ok', { size: p.size });
      noIcmp();
      return s;
    }
    if (!tcp) {                                                 // rules 2, 3
      s.outcome = 'fragment';
      s.onB = s.fragments = fragment(p.size, effMtu, hdr);
      row('r2', 'fragment', 'info', { n: s.fragments.length, eff: effMtu, per: s.per });
      row('receiver', 'reassemble', 'ok', { n: s.fragments.length, size: p.size });
      noIcmp();
      return s;
    }
    // rules 4, 8: too big and may not be fragmented
    s.icmp = v6 ? { type: 2, code: 0, nextHopMtu: effMtu, v6: true } : { type: 3, code: 4, nextHopMtu: effMtu, v6: false };
    row('r2', 'dropIcmp', 'drop', { size: p.size, eff: effMtu, type: s.icmp.type, code: s.icmp.code, v6: v6 });
    if (p.icmpBlocked) {                                        // rule 6
      s.outcome = 'blackHole';
      s.retries = RETRIES;
      row('fw', 'icmpLost', 'silence', { type: s.icmp.type, code: s.icmp.code, v6: v6 });
      row('sender', 'retry', 'stall', { size: p.size, times: RETRIES });
      return s;
    }
    s.outcome = 'pmtud';                                        // rule 5
    s.pmtu = effMtu;
    s.mss = effMtu - hdr - TCP_HDR;
    s.onB = [block(hdr, s.pmtu - hdr, 0, false)];
    row('sender', 'pmtu', 'icmp', { pmtu: s.pmtu, mss: s.mss });
    row('r2', 'resend', 'ok', { size: s.pmtu, eff: effMtu });
    return s;
  }

  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  /**
   * SPEC "Changed": which blocks on link B and which timeline rows differ from the state before the last input,
   * index by index. No state before → nothing.
   */
  function changed(before, now) {
    if (!before) return { blocks: [], rows: [] };
    var diff = function (a, b) {
      var out = [];
      b.forEach(function (x, i) { if (!same(x, a[i])) out.push(i); });
      return out;
    };
    // a block is drawn from its sizes and flags, and the resent packet carries a tag
    var keyOf = function (s) { return function (b) { return { len: b.len, data: b.data, offset: b.offset, mf: b.mf, resent: s.outcome === 'pmtud' }; }; };
    var blocks = diff(before.onB.map(keyOf(before)), now.onB.map(keyOf(now)));
    // the same blocks with or without a tunnel in front are drawn differently
    if (before.overhead !== now.overhead) blocks = now.onB.map(function (x, i) { return i; });
    return { blocks: blocks, rows: diff(before.timeline, now.timeline) };
  }

  /** Which blocks the page draws: all up to `max`, else the first two, a gap (-1), and the last two. */
  function visibleBlocks(n, max) {
    var out = [];
    if (n <= max) { for (var i = 0; i < n; i++) out.push(i); return out; }
    return [0, 1, -1, n - 2, n - 1];
  }

  var presets = [
    { id: 'primjer-3', params: { size: 1400, mtuB: 500, overhead: 0, df: false, icmpBlocked: false, proto: 'ipv4' } },
    { id: 'just-over', params: { size: 1600, mtuB: 1500, overhead: 0, df: false, icmpBlocked: false, proto: 'ipv4' } },
    { id: 'gre-tunnel', params: { size: 1500, mtuB: 1500, overhead: 24, df: false, icmpBlocked: false, proto: 'ipv4' } },
    { id: 'pmtud', params: { size: 1500, mtuB: 1400, overhead: 0, df: true, icmpBlocked: false, proto: 'ipv4' } },
    { id: 'black-hole', params: { size: 1500, mtuB: 1400, overhead: 0, df: true, icmpBlocked: true, proto: 'ipv4' } }
  ];

  var logic = {
    HDR: HDR, MIN_MTU: MIN_MTU, LINK_A: LINK_A, ID: ID, RETRIES: RETRIES, OVERHEADS: OVERHEADS, RANGES: RANGES,
    defaults: defaults,
    /** Explorer: no steps; the state is derived from the params. */
    initial: function (p) { return derive(p); },
    derive: derive, fragment: fragment, changed: changed, visibleBlocks: visibleBlocks, overheadName: overheadName,
    withDefaults: P, presets: presets
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
