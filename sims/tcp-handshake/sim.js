/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for tcp-handshake: client A opens a TCP connection to server B with the three-way handshake (URM book,
   ch. 13, "TCP: uspostava veze i trostruko rukovanje" and Primjer 3; RFC 9293 §3.4.1). Four conceptual steps
   travel in three messages: SYN (seq X), SYN+ACK (seq Y, ack X+1: steps 2 and 3 in one message), ACK (ack Y+1).
   Each side keeps its own initial sequence number (ISN), the next number it will send from and the next number it
   expects from the other side. Sequence numbers are 32 bits (RFC 9293 §3.1, §3.4), so X+1 wraps to 0 at 2^32 - 1.
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. seqAdd, segments and sides are pure
   functions over plain data, ready for models/ (tcp-teardown, tcp-retransmit and tcp-states continue from here).
   The closing modes (task tcp-teardown: FIN/ACK both ways, half close, TIME-WAIT) start from the handshake's end
   state; their rules are in SPEC.md and in closing() and receive() below. */
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

  // ── teardown (task tcp-teardown): FIN/ACK in both directions, half close, TIME-WAIT ──
  // URM ch. 13 "TCP: zatvaranje veze"; RFC 9293 §3.6, §3.6.1, Figure 5, Figure 13, §3.10.7.4. The states and TIME-WAIT
  // come from the RFC (the book does not name them).

  /** The modes: 'open' is the handshake above; the others close an established connection. */
  var MODES = ['open', 'close', 'half', 'finack', 'simul'];

  /** MSL, the maximum segment lifetime: 2 minutes (RFC 9293 §3.4.2). TIME-WAIT lasts 2 × MSL. */
  var MSL = 120;

  /** Each closing mode as a list of steps. A step is either the segments sent in it (all from the state before the
      step, then all delivered in the same step, so two FINs can cross) or 'timeout' (2 × MSL passes). c is the end
      that closes first, o the other. kind: fin (FIN), ack (a pure ACK), finack (FIN and the ACK of the peer's FIN in
      one segment), data (len octets). */
  var SCRIPTS = {
    close: [[['c', 'fin']], [['o', 'ack']], [['o', 'fin']], [['c', 'ack']], 'timeout'],
    half: [[['c', 'fin']], [['o', 'ack']], [['o', 'data', 200]], [['c', 'ack']], [['o', 'fin']], [['c', 'ack']], 'timeout'],
    finack: [[['c', 'fin']], [['o', 'finack']], [['c', 'ack']], 'timeout'],
    simul: [[['A', 'fin'], ['B', 'fin']], [['A', 'ack'], ['B', 'ack']], 'timeout']
  };

  /** Steps of a mode: 3 for the handshake, the script's length for a close. */
  function stepsFor(p) { return SCRIPTS[p.mode] ? SCRIPTS[p.mode].length : 3; }

  /** May an end in this state still send data? Until it has sent its own FIN (RFC 9293 §3.6.1, half close). */
  function canSend(state) { return state === 'ESTABLISHED' || state === 'CLOSE-WAIT'; }
  /** May it still receive data? Until the peer's FIN has arrived (RFC 9293 §3.10.7.4, "seventh, process the
      segment text": ESTABLISHED, FIN-WAIT-1, FIN-WAIT-2). Sending a FIN does not stop receiving. */
  function canReceive(state) { return state === 'ESTABLISHED' || state === 'FIN-WAIT-1' || state === 'FIN-WAIT-2'; }

  /** The flags of a closing action. */
  var KIND_FLAGS = { fin: ['FIN'], ack: ['ACK'], finack: ['FIN', 'ACK'], data: [] };

  function copyEnds(e) {
    return { A: Object.assign({}, e.A), B: Object.assign({}, e.B) };
  }

  /** One end receives one segment (RFC 9293 §3.10.7.4 order: the ACK field, then the text, then the FIN bit).
      The ACK of its own FIN (ack = the number after the FIN): FIN-WAIT-1 → FIN-WAIT-2, CLOSING → TIME-WAIT,
      LAST-ACK → CLOSED. Data in order and while it may receive: rcvNxt moves past it. The peer's FIN in order:
      it takes one number (rcvNxt + 1); ESTABLISHED → CLOSE-WAIT, FIN-WAIT-1 → CLOSING, FIN-WAIT-2 → TIME-WAIT.
      So a FIN+ACK in FIN-WAIT-1 goes to FIN-WAIT-2 and on to TIME-WAIT in the same segment (the tie-break). */
  function receive(rx, g) {
    if (rx.finSent && g.ack === rx.sndNxt) {
      if (rx.state === 'FIN-WAIT-1') rx.state = 'FIN-WAIT-2';
      else if (rx.state === 'CLOSING') rx.state = 'TIME-WAIT';
      else if (rx.state === 'LAST-ACK') rx.state = 'CLOSED';
    }
    if (g.len && g.seq === rx.rcvNxt && canReceive(rx.state)) rx.rcvNxt = seqAdd(rx.rcvNxt, g.len);
    if (g.flags.indexOf('FIN') >= 0 && seqAdd(g.seq, g.len) === rx.rcvNxt) {
      rx.rcvNxt = seqAdd(rx.rcvNxt, 1);
      if (rx.state === 'ESTABLISHED') rx.state = 'CLOSE-WAIT';
      else if (rx.state === 'FIN-WAIT-1') rx.state = 'CLOSING';
      else if (rx.state === 'FIN-WAIT-2') rx.state = 'TIME-WAIT';
    }
  }

  /** A close after the handshake with ISNs x and y, through step n of `mode`, `closer` closing first. Both ends start
      ESTABLISHED with the handshake's end numbers (A sends from x+1 and expects y+1, B the other way round). A segment
      carries seq = the sender's sndNxt and ack = its rcvNxt; a FIN takes one number (RFC 9293 §3.4), so its ACK is
      FIN.seq + 1. CLOSE sends the FIN: ESTABLISHED → FIN-WAIT-1, CLOSE-WAIT → LAST-ACK. The timeout step closes every
      end in TIME-WAIT. chart: one entry per step, with its segments (or timeout), and both ends' states after it. */
  function closing(x, y, mode, closer, n) {
    var script = SCRIPTS[mode], other = closer === 'B' ? 'A' : 'B';
    var who = { c: closer === 'B' ? 'B' : 'A', o: other, A: 'A', B: 'B' };
    var ends = {
      A: { state: 'ESTABLISHED', sndNxt: seqAdd(x, 1), rcvNxt: seqAdd(y, 1), finSent: false, finSeq: null, timeWait: null },
      B: { state: 'ESTABLISHED', sndNxt: seqAdd(y, 1), rcvNxt: seqAdd(x, 1), finSent: false, finSeq: null, timeWait: null }
    };
    var chart = [];
    for (var k = 0; k < n && k < script.length; k++) {
      var st = script[k], before = copyEnds(ends), row;
      if (st === 'timeout') {
        var closed = [];
        ['A', 'B'].forEach(function (id) {
          if (ends[id].state === 'TIME-WAIT') { ends[id].state = 'CLOSED'; closed.push(id); }
        });
        row = { step: k + 1, timeout: true, closed: closed, segs: [] };
      } else {
        var segs = st.map(function (a) {
          var id = who[a[0]], e = before[id];
          return { from: id, to: id === 'A' ? 'B' : 'A', flags: KIND_FLAGS[a[1]].slice(), seq: e.sndNxt, ack: e.rcvNxt, len: a[2] || 0 };
        });
        segs.forEach(function (g) {
          var tx = ends[g.from];
          tx.sndNxt = seqAdd(g.seq, seqLen(g));
          if (g.flags.indexOf('FIN') >= 0) {
            tx.finSent = true;
            tx.finSeq = seqAdd(g.seq, g.len);
            if (tx.state === 'ESTABLISHED') tx.state = 'FIN-WAIT-1';
            else if (tx.state === 'CLOSE-WAIT') tx.state = 'LAST-ACK';
          }
        });
        segs.forEach(function (g) { receive(ends[g.to], g); });
        row = { step: k + 1, timeout: false, closed: [], segs: segs };
      }
      ['A', 'B'].forEach(function (id) {
        if (ends[id].state === 'TIME-WAIT' && ends[id].timeWait === null) ends[id].timeWait = k + 1;
      });
      row.after = { A: ends.A.state, B: ends.B.state };
      chart.push(row);
    }
    return { ends: ends, chart: chart, closer: who.c, steps: script.length };
  }

  /** Everything the page shows after step n (0 = nothing sent yet). */
  function analyze(p, n) {
    if (SCRIPTS[p.mode]) return analyzeClose(p, n);
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

  /** The close after step n: the ISNs in use, the mode, the closer, both ends and the chart so far. */
  function analyzeClose(p, n) {
    var v = isns(p), c = closing(v.x, v.y, p.mode, p.closer, n);
    return { x: v.x, y: v.y, mode: p.mode, closer: p.mode === 'simul' ? null : c.closer, sent: c.chart.length, ends: c.ends, chart: c.chart };
  }

  var logic = {
    /** The book's worked example: X = 4000, Y = 9500 (URM ch. 13, Primjer 3; the fragment's defaults). The mode is the
        handshake; a close starts from its end state, closer A unless chosen otherwise. */
    defaults: { isn: 'own', x: 4000, y: 9500, mode: 'open', closer: 'A' },

    isnModes: ['own', 'real', 'wrap'],
    modes: MODES,
    /** The fragment's sliders: 0 to 9999, step 1. */
    min: 0,
    max: 9999,

    /** The handshake's three messages; the page mounts stepsFor, which gives each close its own length. */
    steps: 3,
    stepsFor: stepsFor,

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
    analyze: analyze,
    MSL: MSL,
    scripts: SCRIPTS,
    canSend: canSend,
    canReceive: canReceive,
    receive: receive,
    closing: closing
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
