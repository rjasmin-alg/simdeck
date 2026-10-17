/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for tcp-retransmit: loss and retransmission in TCP. Sender A sends a few segments to receiver B over a path
   with a fixed one-way delay; chosen segments or ACKs are lost. A step advances to the next event in time order: a
   message arrives (or would have arrived and is lost), or the retransmission timer expires. What a host sends because
   of the event (B's ACK, A's retransmission) is sent in the same step, after the event. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. No strings: the page words everything from codes. */
(function (root) {
  'use strict';

  var GAP = 10;            // ms between the segments of the first window (one after the other on the link)
  var RTO0 = 1000;         // starting RTO (RFC 6298 §2.1 and §2.4: 1 s; the estimator is not modelled)
  var RTO_MAX = 60000;     // backoff cap (RFC 6298 §5.5 and §2.5: a maximum of at least 60 s)
  var DUP_THRESH = 3;      // fast retransmit on the third duplicate ACK (RFC 5681 §3.2)
  var MAX_STEPS = 20;      // a demo stays within the contract's 20 steps

  /** The data A has to send: three or five segments (task presets; URM ch13 Primjer 4, ch15 Primjer 5). */
  var FLOWS = {
    rto: { start: 1000, len: 500, count: 3 },    // book-rto, backoff: 1000, 1500, 2000
    fast: { start: 4125, len: 375, count: 5 },   // book-fast, no-buffer: 4125 … 5625, last byte 5999
    five: { start: 1000, len: 500, count: 5 }    // ack-lost: 1000 … 3000, last byte 3499
  };

  /** What can be lost: none, the K-th segment A sends first, or the K-th ACK B sends. */
  var LOSE = ['none', 's1', 's2', 's3', 's4', 's5', 'a1', 'a2', 'a3', 'a4', 'a5'];

  function flowOf(p) { return FLOWS[p.flow] || FLOWS.rto; }
  function endOf(f) { return f.start + f.len * f.count; }
  function copy(s) { return JSON.parse(JSON.stringify(s)); }
  function keepList(p) { return String(p.keep || '').split(',').filter(Boolean); }

  /** A message's id, stable under every param: a segment by its first byte and transmission (0 = the original),
      an ACK by its place among B's ACKs (1 = the first). Used by `keep` and the tests. */
  function segId(seq, tx) { return 's' + seq + '.' + tx; }
  function ackId(k) { return 'a' + k; }

  /** Is message m lost when it would arrive in step n? The `lose` victim (and with `loseRetx` its first
      retransmissions too) is lost only in steps after `from`; ids in `keep` stay lost (they were lost before the
      user changed the choice, so a change applies from the next step on and never rewrites the past). */
  function isLost(m, n, p) {
    if (keepList(p).indexOf(m.id) >= 0) return true;
    if (n <= (p.from || 0)) return false;
    var v = p.lose || 'none';
    if (v === 'none') return false;
    var k = Number(v.slice(1));
    if (v[0] === 's') {
      var f = flowOf(p);
      return m.k === 'seg' && k <= f.count && m.seq === f.start + (k - 1) * f.len && m.tx <= (p.loseRetx || 0);
    }
    return m.k === 'ack' && m.ackNo === k;
  }

  // ── sending: each send appends a message and its chart row ──

  function sendSeg(s, seq, why) {
    var f = s.flow, i = (seq - f.start) / f.len;
    var seg = s.segs[i];
    var m = { id: segId(seq, seg.tx), k: 'seg', seq: seq, len: f.len, tx: seg.tx, why: why || null,
      sentAt: s.t, at: s.t + s.d, fate: 'flight', re: null, ack: null };
    seg.tx += 1;
    seg.sentAt = s.t;
    s.msgs.push(m);
    s.rows.push({ m: s.msgs.length - 1 });
    if (s.rtoDeadline === null) startTimer(s, s.rows.length - 1);   // RFC 6298 §5.1: start it if it is not running
    return m;
  }
  function sendAck(s) {
    s.acksSent += 1;
    var m = { id: ackId(s.acksSent), k: 'ack', n: s.rcvNxt, ackNo: s.acksSent, sentAt: s.t, at: s.t + s.d,
      fate: 'flight', re: null, dup: 0, sample: null };
    s.msgs.push(m);
    s.rows.push({ m: s.msgs.length - 1 });
    return m;
  }

  // ── the retransmission timer: one bar per run of the timer, over chart rows ──

  function startTimer(s, row) {
    s.rtoDeadline = s.t + s.rto;
    s.timers.push({ from: row, to: null, rto: s.rto, end: null });
  }
  function endTimer(s, row, end) {
    var tm = s.timers[s.timers.length - 1];
    tm.to = Math.max(tm.from, row);
    tm.end = end;
    s.rtoDeadline = null;
  }

  // ── what each host does with a message ──

  /** B takes a segment: in order (the ACK moves on, and over everything held once the gap is filled), after a gap
      (held or, with bufferOoo off, discarded; the ACK repeats) or already had (the ACK repeats). B always answers at
      once with the next byte it expects (rules 1–3). */
  function atB(s, m, p) {
    var e = m.seq + m.len;
    if (e <= s.rcvNxt) m.re = 'already';
    else if (m.seq === s.rcvNxt) {
      s.rcvNxt = e;
      var jumped = false, moved = true;
      while (moved) {
        moved = false;
        for (var i = 0; i < s.ooo.length; i++) {
          if (s.ooo[i][0] === s.rcvNxt) { s.rcvNxt = s.ooo[i][1]; s.ooo.splice(i, 1); jumped = moved = true; break; }
        }
      }
      m.re = jumped ? 'fills' : 'inorder';
    } else if (p.bufferOoo) {
      var held = s.ooo.some(function (r) { return r[0] <= m.seq && e <= r[1]; });
      if (!held) {
        s.ooo.push([m.seq, e]);
        s.ooo.sort(function (a, b) { return a[0] - b[0]; });
        // join touching ranges so the buffer shows one block per run of bytes
        for (var j = s.ooo.length - 1; j > 0; j--) {
          if (s.ooo[j - 1][1] === s.ooo[j][0]) { s.ooo[j - 1][1] = s.ooo[j][1]; s.ooo.splice(j, 1); }
        }
      }
      m.re = held ? 'already' : 'held';
    } else {
      s.discarded.push([m.seq, e]);
      m.re = 'discarded';
    }
    m.ack = sendAck(s).ackNo;
  }

  /** A takes an ACK: a new one moves snd.una, resets the duplicate counter and restarts (or stops) the timer; a
      repeat of snd.una with data outstanding is a duplicate, and the third one sends the missing segment at once
      (rule 4). While recovering, an ACK that moves but stops short of everything sent sends the next missing segment
      (rule 4b). RTT sample only from a segment sent once (Karn, rule 8). */
  function atA(s, m, row) {
    var f = s.flow, end = endOf(f);
    if (m.n > s.sndUna) {
      var karn = false, last = null;
      s.segs.forEach(function (g) {
        if (!g.acked && g.seq + g.len <= m.n) { g.acked = true; if (g.tx > 1) karn = true; last = g; }
      });
      m.sample = karn ? 'karn' : s.t - last.sentAt;
      s.sndUna = m.n;
      s.dupCount = 0;
      if (s.sndUna >= end) {
        endTimer(s, row, 'stopped');           // RFC 6298 §5.2
        s.recover = null;
        m.re = 'all';
        return;
      }
      endTimer(s, row - 1, 'stopped');         // RFC 6298 §5.3: restart for the data still outstanding
      startTimer(s, row);
      if (s.recover !== null && m.n < s.recover) {
        m.re = 'partial';
        sendSeg(s, m.n, 'partial');
      } else {
        s.recover = null;
        m.re = 'new';
      }
      return;
    }
    if (m.n === s.sndUna && s.sndUna < end) {
      s.dupCount += 1;
      m.dup = s.dupCount;
      if (s.dupCount === DUP_THRESH && s.recover === null) {
        m.re = 'fast';
        s.recover = s.sndNxt;
        sendSeg(s, s.sndUna, 'fast');
      } else m.re = 'dup';
      return;
    }
    m.re = 'old';
  }

  /** The timer expired: resend the oldest unacknowledged segment, double the RTO (up to the cap) and start the timer
      again (RFC 6298 §5.4–5.6). */
  function expire(s) {
    var old = s.rto;
    s.notes.push({ at: s.t, rto: old, next: Math.min(old * 2, RTO_MAX) });
    s.rows.push({ note: s.notes.length - 1 });
    endTimer(s, s.rows.length - 1, 'expired');
    s.rto = Math.min(old * 2, RTO_MAX);
    s.recover = s.sndNxt;
    sendSeg(s, s.sndUna, 'rto');   // starts the timer again (it is not running), with the doubled RTO
  }

  /** The next event: the earliest arrival or the timer. Ties at one instant: arrivals first (in the order sent), then
      the timer; sends come last, inside the step of the event that caused them. */
  function nextEvent(s) {
    var best = null;
    s.msgs.forEach(function (m, i) {
      if (m.fate !== 'flight') return;
      if (!best || m.at < best.t) best = { t: m.at, kind: 'arrive', i: i };   // strict <: the earlier-sent wins a tie
    });
    if (s.rtoDeadline !== null && (!best || s.rtoDeadline < best.t)) best = { t: s.rtoDeadline, kind: 'rto' };
    return best;
  }

  function finished(s) {
    return s.sndUna >= endOf(s.flow) && s.msgs.every(function (m) { return m.fate !== 'flight'; });
  }

  var logic = {
    GAP: GAP, RTO0: RTO0, RTO_MAX: RTO_MAX, DUP_THRESH: DUP_THRESH, MAX_STEPS: MAX_STEPS, FLOWS: FLOWS, LOSE: LOSE,
    segId: segId, ackId: ackId, endOf: endOf, nextEvent: nextEvent, isLost: isLost,

    /** keep and from have no control: the page sets them when the loss settings change mid-run (NOTES.md). */
    defaults: { flow: 'rto', lose: 's2', loseRetx: 0, bufferOoo: true, rtt: 100, keep: '', from: 0 },

    /** Steps until everything is acknowledged and nothing is on the way, at most MAX_STEPS. */
    steps: function (p) {
      var s = logic.initial(p);
      for (var n = 1; n <= MAX_STEPS; n++) {
        s = logic.step(s, n, p);
        if (s.done) return n;
      }
      return MAX_STEPS;
    },

    initial: function (p) {
      var f = flowOf(p);
      var segs = [];
      for (var i = 0; i < f.count; i++) segs.push({ seq: f.start + i * f.len, len: f.len, tx: 0, sentAt: null, acked: false });
      return {
        n: 0, t: 0, d: p.rtt / 2, flow: f, ev: { kind: 'start' }, done: false,
        msgs: [], notes: [], rows: [], timers: [],
        segs: segs, sndUna: f.start, sndNxt: f.start, dupCount: 0, rto: RTO0, rtoDeadline: null, recover: null,
        rcvNxt: f.start, ooo: [], discarded: [], acksSent: 0
      };
    },

    step: function (prev, n, p) {
      var s = copy(prev);
      s.n = n;
      if (n === 1) {
        // A sends its whole window, one segment every GAP ms; the first send starts the timer
        s.segs.forEach(function (g, i) {
          s.t = i * GAP;
          sendSeg(s, g.seq, null);
        });
        s.sndNxt = endOf(s.flow);
        s.ev = { kind: 'window', from: s.flow.start, to: s.sndNxt, last: s.t };
        return s;
      }
      var e = nextEvent(s);
      if (!e) { s.ev = { kind: 'idle' }; s.done = true; return s; }
      s.t = e.t;
      if (e.kind === 'rto') {
        expire(s);
        s.ev = { kind: 'rto', note: s.notes.length - 1, m: s.msgs.length - 1 };
      } else {
        var m = s.msgs[e.i];
        var row = -1;
        s.rows.forEach(function (r, ri) { if (r.m === e.i) row = ri; });
        if (isLost(m, n, p)) {
          m.fate = 'lost';
          m.re = 'lost';
        } else {
          m.fate = 'arrived';
          if (m.k === 'seg') atB(s, m, p);
          else atA(s, m, row);
        }
        s.ev = { kind: m.fate, m: e.i };
      }
      s.done = finished(s);
      return s;
    },

    /** Ids of the messages lost by step n (the page's `keep` when the loss settings change at step n). */
    lostBy: function (p, n) {
      var s = logic.initial(p);
      for (var i = 1; i <= n && !s.done; i++) s = logic.step(s, i, p);
      return s.msgs.filter(function (m) { return m.fate === 'lost'; }).map(function (m) { return m.id; });
    },

    /** Time left on the timer at the state's time, or null when it is not running. */
    remaining: function (s) { return s.rtoDeadline === null ? null : s.rtoDeadline - s.t; }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
