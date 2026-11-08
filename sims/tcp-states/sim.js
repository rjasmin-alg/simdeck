/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for tcp-states: the TCP state machine of RFC 9293 (§3.3.2 Figure 5, §3.10 "Event Processing") at both ends
   of one connection, A (client) and B (server). One step applies one event: a user call at one end (OPEN passive or
   active, SEND, CLOSE), the delivery or loss of the oldest segment in flight, or the 2×MSL timeout. Rules, tie-breaks
   and expected numbers: SPEC.md. The ISNs are the host model's, X = 4000 and Y = 9500 (URM ch. 13, Primjer 3), and the
   numbers match sims/tcp-handshake's handshake and closing modes.
   seqAdd and seqLen are from sims/tcp-handshake/sim.js @ 1ec6cfd (no shared TCP model in models/ yet).
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. The machine (initial, apply, receive, call)
   is pure functions over plain data with no strings, ready for models/. */
(function (root) {
  'use strict';

  // ── from sims/tcp-handshake/sim.js @ 1ec6cfd ──
  /** 2^32: sequence numbers are 32-bit and wrap (RFC 9293 §3.4). */
  var MOD = 4294967296;
  /** a + k modulo 2^32, for any integer k. */
  function seqAdd(a, k) { return (((a + k) % MOD) + MOD) % MOD; }
  /** How many sequence numbers a segment occupies: one for SYN, one for FIN, plus its data (RFC 9293 §3.4). */
  function seqLen(seg) {
    return (seg.flags.indexOf('SYN') >= 0 ? 1 : 0) + (seg.flags.indexOf('FIN') >= 0 ? 1 : 0) + (seg.len || 0);
  }
  // ── end of copy ──

  /** The eleven states of RFC 9293 Figure 5. */
  var STATES = ['CLOSED', 'LISTEN', 'SYN-SENT', 'SYN-RECEIVED', 'ESTABLISHED', 'FIN-WAIT-1', 'FIN-WAIT-2',
    'CLOSE-WAIT', 'CLOSING', 'LAST-ACK', 'TIME-WAIT'];

  /** Every transition the model takes, by id: [from, to]. 'rst' is any synchronized state → CLOSED on a valid RST. */
  var EDGES = {
    'open-passive': ['CLOSED', 'LISTEN'],
    'open-active': ['CLOSED', 'SYN-SENT'],
    'listen-close': ['LISTEN', 'CLOSED'],
    'listen-syn': ['LISTEN', 'SYN-RECEIVED'],
    'synsent-close': ['SYN-SENT', 'CLOSED'],
    'synsent-syn': ['SYN-SENT', 'SYN-RECEIVED'],
    'synsent-synack': ['SYN-SENT', 'ESTABLISHED'],
    'synsent-rst': ['SYN-SENT', 'CLOSED'],
    'synrcvd-ack': ['SYN-RECEIVED', 'ESTABLISHED'],
    'synrcvd-close': ['SYN-RECEIVED', 'FIN-WAIT-1'],
    'synrcvd-rst': ['SYN-RECEIVED', 'LISTEN'],
    'estab-close': ['ESTABLISHED', 'FIN-WAIT-1'],
    'estab-fin': ['ESTABLISHED', 'CLOSE-WAIT'],
    'fw1-ack': ['FIN-WAIT-1', 'FIN-WAIT-2'],
    'fw1-fin': ['FIN-WAIT-1', 'CLOSING'],
    'fw1-finack': ['FIN-WAIT-1', 'TIME-WAIT'],
    'fw2-fin': ['FIN-WAIT-2', 'TIME-WAIT'],
    'closing-ack': ['CLOSING', 'TIME-WAIT'],
    'cw-close': ['CLOSE-WAIT', 'LAST-ACK'],
    'lastack-ack': ['LAST-ACK', 'CLOSED'],
    'tw-timeout': ['TIME-WAIT', 'CLOSED'],
    'rst': [null, 'CLOSED']
  };

  /** Fixed initial sequence numbers (URM ch. 13, Primjer 3: X = 4000, Y = 9500). */
  var ISN = { A: 4000, B: 9500 };
  /** MSL is 2 minutes (RFC 9293 §3.4.2); TIME-WAIT lasts 2×MSL. Many systems use 60 s instead (SPEC.md, rule 11). */
  var MSL_S = 120;
  var SHORT_TW_S = 60;
  /** Bytes per SEND. */
  var SEND_LEN = 100;
  /** Most events a driven run may hold. */
  var MAX_DRIVE = 30;

  var OTHER = { A: 'B', B: 'A' };
  var SYNCHRONIZED = ['ESTABLISHED', 'FIN-WAIT-1', 'FIN-WAIT-2', 'CLOSE-WAIT', 'CLOSING', 'LAST-ACK', 'TIME-WAIT'];
  var AFTER_CLOSE = ['FIN-WAIT-1', 'FIN-WAIT-2', 'CLOSING', 'LAST-ACK', 'TIME-WAIT'];

  function has(seg, f) { return seg.flags.indexOf(f) >= 0; }
  function isSync(state) { return SYNCHRONIZED.indexOf(state) >= 0; }
  /** May an end in this state still send data? Until it has called CLOSE (RFC 9293 §3.6.1, half close). */
  function canSend(state) { return state === 'ESTABLISHED' || state === 'CLOSE-WAIT'; }
  /** May it still receive data? Until the peer's FIN has arrived (RFC 9293 §3.10.7.4, "process the segment text"). */
  function canReceive(state) { return state === 'ESTABLISHED' || state === 'FIN-WAIT-1' || state === 'FIN-WAIT-2'; }

  function newEnd(id) {
    return {
      state: 'CLOSED', iss: ISN[id], sndNxt: ISN[id], rcvNxt: null,
      finSent: false, finAcked: false, finRcvd: false, passive: false, ackOwed: false,
      edge: null, via: null, edgeAt: null, twAt: null
    };
  }

  function clone(s) { return JSON.parse(JSON.stringify(s)); }

  /** The state before any event: both ends CLOSED, nothing in flight. */
  function blank() {
    return { t: 0, ends: { A: newEnd('A'), B: newEnd('B') }, inFlight: [], chart: [], log: [], last: null };
  }

  // ── one step ──

  /** Move end id to the edge's target state and remember the edge and the step. */
  function take(s, id, edge, ch) {
    var e = s.ends[id];
    ch[id] = { from: e.state, to: EDGES[edge][1], edge: edge };
    e.state = EDGES[edge][1];
    e.edge = edge;
    e.via = null;
    e.edgeAt = s.t;
    if (e.state === 'TIME-WAIT') e.twAt = s.t;
  }

  /** Queue a segment from end `from`: seq, ack and flags as given; the chart gets its row. Returns the row. */
  function emit(s, from, flags, seq, ack, len) {
    var row = {
      kind: 'seg', id: s.chart.filter(function (r) { return r.kind === 'seg'; }).length + 1,
      from: from, to: OTHER[from], flags: flags, seq: seq, ack: ack, len: len || 0,
      /** finAck: a FIN whose ACK field is the first to acknowledge the peer's FIN (combineFinAck: the page writes
          FIN+ACK, as tcp-handshake does). */
      finAck: has({ flags: flags }, 'FIN') && s.ends[from].ackOwed,
      sent: s.t, done: null, lost: false, outcome: null, became: null
    };
    s.chart.push(row);
    s.inFlight.push(row.id);
    return row;
  }

  /** A segment from an end that already knows the peer's numbers: ACK field set (every segment after the SYN). */
  function emitSynced(s, from, extra, len) {
    var e = s.ends[from];
    var row = emit(s, from, extra.concat(['ACK']), e.sndNxt, e.rcvNxt, len);
    e.sndNxt = seqAdd(e.sndNxt, seqLen(row));
    e.ackOwed = false;
    return row;
  }

  /** OPEN starts a new connection: forget the numbers and FIN flags of an earlier one (a fresh TCB). */
  function fresh(e) {
    e.sndNxt = e.iss;
    e.rcvNxt = null;
    e.finSent = false;
    e.finAcked = false;
    e.finRcvd = false;
    e.ackOwed = false;
  }

  /** A user call at end id. Returns { ok, reason, sent }. Rule 14: illegal calls change nothing. */
  function call(s, id, what, ch) {
    var e = s.ends[id], st = e.state;
    if (what === 'listen') {
      if (st !== 'CLOSED') return { ok: false, reason: 'exists' };
      fresh(e);
      e.passive = true;
      take(s, id, 'open-passive', ch);
      return { ok: true };
    }
    if (what === 'open') {
      if (st !== 'CLOSED') return { ok: false, reason: 'exists' };
      fresh(e);
      e.passive = false;
      var syn = emit(s, id, ['SYN'], e.iss, null, 0);
      e.sndNxt = seqAdd(e.iss, 1);
      take(s, id, 'open-active', ch);
      return { ok: true, sent: syn.id };
    }
    if (what === 'send') {
      if (st === 'CLOSED') return { ok: false, reason: 'noConn' };
      if (st === 'LISTEN' || st === 'SYN-SENT' || st === 'SYN-RECEIVED') return { ok: false, reason: 'notYet' };
      if (!canSend(st)) return { ok: false, reason: 'closing' };
      return { ok: true, sent: emitSynced(s, id, [], SEND_LEN).id };
    }
    if (what === 'close') {
      if (st === 'CLOSED') return { ok: false, reason: 'noConn' };
      if (AFTER_CLOSE.indexOf(st) >= 0) return { ok: false, reason: 'closing' };
      if (st === 'LISTEN') { take(s, id, 'listen-close', ch); return { ok: true }; }
      if (st === 'SYN-SENT') { take(s, id, 'synsent-close', ch); return { ok: true }; }
      var fin = emitSynced(s, id, ['FIN'], 0);
      e.finSent = true;
      take(s, id, st === 'SYN-RECEIVED' ? 'synrcvd-close' : st === 'CLOSE-WAIT' ? 'cw-close' : 'estab-close', ch);
      return { ok: true, sent: fin.id };
    }
    return { ok: false, reason: 'unknown' };
  }

  /** End id receives segment g (a chart row). Applies RFC 9293 §3.10.7 and queues the reply. Returns { reply, what }:
      what is 'ignored' when the segment changed nothing and needs no answer. combine: hold back the ACK of the first
      FIN received in ESTABLISHED (SPEC.md, combineFinAck). */
  function receive(s, id, g, ch, combine) {
    var e = s.ends[id], st = e.state;
    var rst = has(g, 'RST'), syn = has(g, 'SYN'), ackBit = has(g, 'ACK'), fin = has(g, 'FIN');

    // CLOSED: no socket. Answer everything but an RST with an RST (§3.10.7.1, §3.5.2).
    if (st === 'CLOSED') {
      if (rst) return { what: 'ignored' };
      var r = ackBit ? emit(s, id, ['RST'], g.ack, null, 0) : emit(s, id, ['RST', 'ACK'], 0, seqAdd(g.seq, seqLen(g)), 0);
      return { reply: r.id, what: 'reset' };
    }

    // LISTEN (§3.10.7.2): an RST is ignored, an ACK is answered with an RST, a SYN opens.
    if (st === 'LISTEN') {
      if (rst) return { what: 'ignored' };
      if (ackBit) return { reply: emit(s, id, ['RST'], g.ack, null, 0).id, what: 'reset' };
      if (!syn) return { what: 'ignored' };
      e.rcvNxt = seqAdd(g.seq, 1);
      var sa = emit(s, id, ['SYN', 'ACK'], e.iss, e.rcvNxt, 0);
      e.sndNxt = seqAdd(e.iss, 1);
      take(s, id, 'listen-syn', ch);
      return { reply: sa.id };
    }

    // SYN-SENT (§3.10.7.3).
    if (st === 'SYN-SENT') {
      var ackOk = ackBit && g.ack === e.sndNxt;
      if (rst) {
        if (!ackOk) return { what: 'ignored' };
        take(s, id, 'synsent-rst', ch);
        return {};
      }
      if (ackBit && !ackOk) return { reply: emit(s, id, ['RST'], g.ack, null, 0).id, what: 'reset' };
      if (!syn) return { what: 'ignored' };
      e.rcvNxt = seqAdd(g.seq, 1);
      if (ackOk) {
        take(s, id, 'synsent-synack', ch);
        return { reply: emitSynced(s, id, [], 0).id };
      }
      // simultaneous open (rule 5, §3.5 Figure 8): our SYN again, now with the ACK of theirs
      var sa2 = emit(s, id, ['SYN', 'ACK'], e.iss, e.rcvNxt, 0);
      take(s, id, 'synsent-syn', ch);
      return { reply: sa2.id };
    }

    // SYN-RECEIVED and the synchronized states: the segment must be the next one expected (§3.10.7.4, first check).
    if (st === 'SYN-RECEIVED' && syn) {
      // the peer's SYN+ACK of a simultaneous open: it acks our SYN; its SYN repeats the one we have (Figure 8)
      if (ackBit && g.ack === e.sndNxt && seqAdd(g.seq, 1) === e.rcvNxt) {
        take(s, id, 'synrcvd-ack', ch);
        return {};
      }
      return { what: 'ignored' };
    }
    if (g.seq !== e.rcvNxt) return { what: 'ignored' };
    if (rst) {
      if (st === 'SYN-RECEIVED' && e.passive) {
        e.rcvNxt = null;
        e.sndNxt = e.iss;
        take(s, id, 'synrcvd-rst', ch);
      } else take(s, id, 'rst', ch);
      return {};
    }
    if (syn) return { what: 'ignored' };
    if (!ackBit) return { what: 'ignored' };

    var start = st, edge = null, via = null, due = false;
    // the ACK field (§3.10.7.4, fifth check)
    if (st === 'SYN-RECEIVED') {
      if (g.ack !== e.sndNxt) return { reply: emit(s, id, ['RST'], g.ack, null, 0).id, what: 'reset' };
      edge = 'synrcvd-ack';
      e.state = 'ESTABLISHED';
    }
    if (e.finSent && !e.finAcked && g.ack === e.sndNxt) {
      e.finAcked = true;
      if (e.state === 'FIN-WAIT-1') { edge = 'fw1-ack'; e.state = 'FIN-WAIT-2'; }
      else if (e.state === 'CLOSING') { edge = 'closing-ack'; e.state = 'TIME-WAIT'; }
      else if (e.state === 'LAST-ACK') { edge = 'lastack-ack'; e.state = 'CLOSED'; }
    }
    // the segment text (seventh check)
    if (g.len && e.state !== 'CLOSED' && canReceive(e.state)) {
      e.rcvNxt = seqAdd(e.rcvNxt, g.len);
      due = true;
    }
    // the FIN bit (eighth check)
    var held = false;
    if (fin && e.state !== 'CLOSED' && !e.finRcvd) {
      e.rcvNxt = seqAdd(e.rcvNxt, 1);
      e.finRcvd = true;
      due = true;
      if (e.state === 'ESTABLISHED') {
        // from SYN-RECEIVED (the handshake's ACK was lost, the FIN acks our SYN): two transitions in one segment
        if (start === 'SYN-RECEIVED') via = 'synrcvd-ack';
        edge = 'estab-fin';
        e.state = 'CLOSE-WAIT';
        if (combine && !g.len) held = true;
      } else if (e.state === 'FIN-WAIT-1') { edge = 'fw1-fin'; e.state = 'CLOSING'; }
      else if (e.state === 'FIN-WAIT-2') { edge = start === 'FIN-WAIT-1' ? 'fw1-finack' : 'fw2-fin'; e.state = 'TIME-WAIT'; }
    }
    // record the transition (state restored first, so take() reports from → to)
    if (edge) {
      var to = e.state;
      e.state = via ? EDGES[edge][0] : start;
      take(s, id, edge, ch);
      e.state = to;
      if (via) { ch[id].from = start; ch[id].via = via; e.via = via; }
    }
    if (!due) return edge ? {} : { what: g.len || fin ? 'ignored' : 'acked' };
    if (held) { e.ackOwed = true; return { what: 'held' }; }
    return { reply: emitSynced(s, id, [], 0).id };
  }

  /** Apply one event code to state s (a copy is made); s.t becomes n. */
  function apply(prev, code, n, opts) {
    var s = clone(prev), ch = {}, last = { code: code, ok: true, changes: ch };
    s.t = n;
    s.log.push(code);
    var m = /^(A|B|both):(listen|open|send|close)$/.exec(code);
    if (m) {
      last.end = m[1];
      last.call = m[2];
      if (m[1] === 'both') {
        last.sent = {};
        ['A', 'B'].forEach(function (id) {
          var r = call(s, id, m[2], ch);
          if (r.sent) last.sent[id] = r.sent;
          if (!r.ok) { last.ok = false; last.reason = r.reason; }
        });
      } else {
        var r = call(s, m[1], m[2], ch);
        last.ok = r.ok;
        if (r.reason) last.reason = r.reason;
        if (r.sent) last.sent = r.sent;
        last.state = s.ends[m[1]].state;
        if (!r.ok) s.chart.push({ kind: 'note', lane: m[1], code: 'rejected', call: m[2], at: n });
        else if (!r.sent) s.chart.push({ kind: 'note', lane: m[1], code: m[2], at: n });
      }
    } else if (code === 'deliver' || code === 'lose') {
      if (!s.inFlight.length) { last.ok = false; last.reason = 'empty'; }
      else {
        var id = s.inFlight.shift();
        var g = s.chart.filter(function (r) { return r.kind === 'seg' && r.id === id; })[0];
        g.done = n;
        last.seg = id;
        if (code === 'lose') g.lost = true;
        else {
          var res = receive(s, g.to, g, ch, opts && opts.combine);
          g.outcome = res.what || null;
          if (ch[g.to]) g.became = ch[g.to].to;
          if (res.reply) last.reply = res.reply;
          if (res.what) last.what = res.what;
        }
      }
    } else if (code === 'timeout') {
      var closed = ['A', 'B'].filter(function (k) { return s.ends[k].state === 'TIME-WAIT'; });
      if (!closed.length) { last.ok = false; last.reason = 'noTimeWait'; }
      closed.forEach(function (k) {
        take(s, k, 'tw-timeout', ch);
        s.chart.push({ kind: 'note', lane: k, code: 'timeout', at: n });
      });
    } else { last.ok = false; last.reason = 'unknown'; }
    s.last = last;
    return s;
  }

  // ── scripts ──

  /** The events of the current params: the scenario (mode 'script', SPEC.md "Script") or the driven list. */
  function script(p) {
    if (p.mode === 'drive') {
      return String(p.script || '').split(',').filter(function (x) { return x; }).slice(0, MAX_DRIVE);
    }
    if (!p.listen) return ['A:open', 'deliver', 'deliver'];
    var ev = ['B:listen', 'A:open', 'deliver', 'deliver', 'deliver'];
    if (p.closer === 'both') return ev.concat(['both:close', 'deliver', 'deliver', 'deliver', 'deliver', 'timeout']);
    var c = p.closer === 'B' ? 'B' : 'A', o = OTHER[c], k = Math.max(0, Math.min(3, Math.round(Number(p.halfCloseData)) || 0));
    ev.push(c + ':close', 'deliver');
    if (!p.combineFinAck) ev.push('deliver');
    for (var i = 0; i < k; i++) ev.push(o + ':send', 'deliver', 'deliver');
    return ev.concat([o + ':close', 'deliver', 'deliver', 'timeout']);
  }

  function stepsFor(p) { return script(p).length; }

  /** Events of a driven run that can be added after step n: an empty flight cannot deliver, and so on. */
  function canAdd(s, code) {
    if (code === 'deliver' || code === 'lose') return s.inFlight.length > 0;
    if (code === 'timeout') return s.ends.A.state === 'TIME-WAIT' || s.ends.B.state === 'TIME-WAIT';
    return true;
  }

  /** The driven script with `code` appended after step n (later events dropped). */
  function extend(p, n, code) {
    return script(p).slice(0, n).concat([code]).slice(0, MAX_DRIVE).join(',');
  }

  var logic = {
    /** Script mode, B listening, A closes first, ACK and FIN apart, no data after the FIN: preset 1. */
    defaults: { mode: 'script', listen: true, closer: 'A', combineFinAck: false, halfCloseData: 0, script: '' },
    /** The default scenario's step count (sim.json steps). */
    steps: 12,
    stepsFor: stepsFor,
    initial: function () { return blank(); },
    /** Step n applies the n-th event of the script to the state after step n - 1. */
    step: function (s, n, p) {
      var ev = script(p)[n - 1];
      return apply(s, ev, n, { combine: p.mode !== 'drive' && !!p.combineFinAck });
    },

    STATES: STATES,
    EDGES: EDGES,
    ISN: ISN,
    MSL_S: MSL_S,
    SHORT_TW_S: SHORT_TW_S,
    SEND_LEN: SEND_LEN,
    MAX_DRIVE: MAX_DRIVE,
    seqAdd: seqAdd,
    seqLen: seqLen,
    canSend: canSend,
    canReceive: canReceive,
    isSync: isSync,
    blank: blank,
    apply: apply,
    script: script,
    canAdd: canAdd,
    extend: extend
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
