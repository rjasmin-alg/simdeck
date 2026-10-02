/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for tcp-handshake: client A opens a TCP connection to server B with the three-way handshake (URM book,
   ch. 13, "TCP: uspostava veze i trostruko rukovanje" and Primjer 3; RFC 9293 §3.4.1). Four conceptual steps
   travel in three messages: SYN (seq X), SYN+ACK (seq Y, ack X+1: steps 2 and 3 in one message), ACK (ack Y+1).
   Each side keeps its own initial sequence number (ISN), the next number it will send from and the next number it
   expects from the other side. Sequence numbers are 32 bits (RFC 9293 §3.1, §3.4), so X+1 wraps to 0 at 2^32 - 1.
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. seqAdd, segments and sides are pure
   functions over plain data, ready for models/ (tcp-teardown, tcp-retransmit and tcp-states continue from here). */
(function (root) {
  'use strict';

  /** 2^32: sequence numbers are 32-bit and wrap (RFC 9293 §3.4, "arithmetic ... must be performed modulo 2**32"). */
  var MOD = 4294967296;

  /** a + k modulo 2^32, for any integer k (negative too). */
  function seqAdd(a, k) { return (((a + k) % MOD) + MOD) % MOD; }

  /** The ISN pairs the page offers besides its own sliders. real: the book's capture of a connection to port 80
      (URM ch. 13, figure ch13-rukovanje-analizator: 2762080915 and 2945746186). wrap: A's ISN is the last 32-bit
      number, so the first number after it is 0. */
  var PAIRS = {
    real: { x: 2762080915, y: 2945746186 },
    wrap: { x: MOD - 1, y: 9500 }
  };

  /** The ISNs in use: the sliders for isn 'own', else the named pair. Out-of-range values are taken modulo 2^32. */
  function isns(p) {
    var pair = PAIRS[p.isn] || { x: p.x, y: p.y };
    return { x: seqAdd(Math.round(Number(pair.x)) || 0, 0), y: seqAdd(Math.round(Number(pair.y)) || 0, 0) };
  }

  /** The three messages of the handshake, in order. concept lists the RFC's conceptual steps each one carries
      (steps 2 and 3 are combined into the SYN+ACK). A SYN occupies one sequence number; a pure ACK occupies none,
      so the closing ACK carries seq X+1, the number A's first data octet will also carry (RFC 9293 §3.1, §3.4). */
  function segments(x, y) {
    return [
      { from: 'A', to: 'B', flags: ['SYN'], seq: x, ack: null, concept: [1] },
      { from: 'B', to: 'A', flags: ['SYN', 'ACK'], seq: y, ack: seqAdd(x, 1), concept: [2, 3] },
      { from: 'A', to: 'B', flags: ['ACK'], seq: seqAdd(x, 1), ack: seqAdd(y, 1), concept: [4] }
    ];
  }

  /** How many sequence numbers a segment occupies: one for SYN (and FIN), none for a pure ACK, plus its data. */
  function seqLen(seg) {
    return (seg.flags.indexOf('SYN') >= 0 ? 1 : 0) + (seg.flags.indexOf('FIN') >= 0 ? 1 : 0) + (seg.len || 0);
  }

  /** Each side after the first n segments of `segs`. iss: its own ISN, once it has chosen it (A before step 1, B
      when it answers). sndNxt: the next number it will send. rcvNxt: the next number it expects from the other side
      (null until it has seen the other side's SYN). acked: whether the other side has confirmed its ISN, i.e. a
      segment with ack = iss + 1 has arrived. A side ignores an ACK for a number it never sent. */
  function sides(x, y, segs, n) {
    var s = {
      A: { iss: x, sndNxt: x, rcvNxt: null, acked: false },
      B: { iss: y, sndNxt: y, rcvNxt: null, acked: false }
    };
    for (var k = 0; k < n && k < segs.length; k++) {
      var g = segs[k], tx = s[g.from], rx = s[g.to];
      tx.sndNxt = seqAdd(g.seq, seqLen(g));
      if (g.flags.indexOf('SYN') >= 0) rx.rcvNxt = seqAdd(g.seq, 1);
      else if (rx.rcvNxt !== null && g.seq === rx.rcvNxt) rx.rcvNxt = seqAdd(g.seq, seqLen(g));
      if (g.ack !== null && g.ack === rx.sndNxt && rx.sndNxt === seqAdd(rx.iss, 1)) rx.acked = true;
    }
    return s;
  }

  /** Everything the page shows after step n (0 = nothing sent yet). */
  function analyze(p, n) {
    var v = isns(p), segs = segments(v.x, v.y), s = sides(v.x, v.y, segs, n);
    return {
      x: v.x,
      y: v.y,
      segs: segs,
      sent: n,
      A: s.A,
      B: s.B,
      /** The connection is established once both ISNs are confirmed. */
      established: s.A.acked && s.B.acked,
      /** Whether X+1 or Y+1 wrapped past 2^32 - 1 to 0. */
      wrapsX: seqAdd(v.x, 1) < v.x,
      wrapsY: seqAdd(v.y, 1) < v.y
    };
  }

  var logic = {
    /** The book's worked example: X = 4000, Y = 9500 (URM ch. 13, Primjer 3; the fragment's defaults). */
    defaults: { isn: 'own', x: 4000, y: 9500 },

    isnModes: ['own', 'real', 'wrap'],
    /** The fragment's sliders: 0 to 9999, step 1. */
    min: 0,
    max: 9999,

    steps: 3,

    initial: function (p) { return analyze(p, 0); },

    /** Step n replays the n messages from the start, so a param change recomputes at the same step. */
    step: function (s, n, p) { return analyze(p, n); },

    MOD: MOD,
    pairs: PAIRS,
    seqAdd: seqAdd,
    seqLen: seqLen,
    isns: isns,
    segments: segments,
    sides: sides,
    analyze: analyze
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
