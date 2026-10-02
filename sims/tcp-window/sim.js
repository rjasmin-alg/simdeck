/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for tcp-window: window size versus throughput. One direction of a TCP connection over a path with a fixed
   round-trip time, counted in octets and milliseconds. The sender may have at most `win` octets sent and not yet
   acknowledged (the receiver's window, URM book ch. 13 and RFC 9293 §3.1), so it delivers at most one window per round
   trip: throughput = min(win / rtt, link rate).
   Units: one step = 1 ms = the time to put one segment of 500 octets on the link, so the link carries 500 octets/ms
   (4 Mbit/s). The stream starts at octet 1500, everything before it acknowledged (the book's figure
   ch13-prozor-kontrola-toka.svg, moment 1: "potvrda 1500"); segments of 500 octets (ch. 13, the sequence-number
   paragraph). `rtt` is the time from the start of sending a segment to the arrival of its acknowledgment.
   One millisecond per step, in this order:
     1. acknowledgments arrive: every segment sent in ms i with i + rtt ≤ n is acknowledged at the start of ms n
        (an acknowledgment that arrives at the start of a millisecond can be used in it: ack before send);
     2. the sender sends the next segment if its last octet is inside the window (ack + win − 1, the right edge itself
        inside: ≤), otherwise the link is idle for that millisecond.
   No loss, a fixed round trip, one acknowledgment per segment, a window that does not change (NOTES.md).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var SEG = 500;        // octets per segment, and per millisecond on the link
  var FIRST = 1500;     // the first octet not yet acknowledged (figure ch13-prozor-kontrola-toka, moment 1)
  var STEPS = 16;       // milliseconds
  var WINDOWS = [500, 1000, 2000, 3000, 4000];
  var RTTS = [2, 4, 8];

  /** The steady-state limit: at most one window per round trip, at most the link's rate. Octets per ms, and what
      limits: 'window', 'link', or 'both' when the window is exactly the path's capacity (link rate × rtt). */
  function limit(win, rtt) {
    var byWindow = win / rtt, pipe = SEG * rtt;
    return {
      rate: Math.min(byWindow, SEG),
      pipe: pipe,
      by: win < pipe ? 'window' : win > pipe ? 'link' : 'both'
    };
  }

  /** May the segment from `next` be sent? Its last octet must not pass the right edge ack + win − 1. */
  function fits(ack, next, win) { return next + SEG - 1 <= ack + win - 1; }

  var logic = {
    /** The book's figure: a window of 1000 octets; a round trip of 4 ms is simdeck's choice (NOTES.md). */
    defaults: { win: 1000, rtt: 4 },

    windows: WINDOWS,
    rtts: RTTS,
    seg: SEG,
    first: FIRST,
    steps: STEPS,

    /** Step 0: octets before 1500 acknowledged, nothing in flight, nothing sent. */
    initial: function (p) {
      return { ms: 0, ack: FIRST, next: FIRST, flight: [], busy: 0, sent: 0, acked: [], sentNow: null,
        timeline: [], inFlight: 0, right: FIRST + p.win - 1 };
    },

    /** One millisecond: acknowledgments first, then a send if the next segment fits, else idle. */
    step: function (s, n, p) {
      var ack = s.ack, next = s.next, flight = [], acked = [];
      s.flight.forEach(function (f) {
        if (f.ms + p.rtt <= n) { acked.push(f.seq); ack = Math.max(ack, f.seq + SEG); }
        else flight.push(f);
      });
      var sentNow = null;
      if (fits(ack, next, p.win)) {
        sentNow = { seq: next, k: s.sent + 1 };
        flight.push({ seq: next, k: s.sent + 1, ms: n });
        next += SEG;
      }
      return {
        ms: n, ack: ack, next: next, flight: flight,
        busy: s.busy + (sentNow ? 1 : 0), sent: s.sent + (sentNow ? 1 : 0),
        acked: acked, sentNow: sentNow,
        timeline: s.timeline.concat([{ k: sentNow ? sentNow.k : 0, acks: acked.length }]),
        inFlight: next - ack, right: ack + p.win - 1
      };
    },

    limit: limit,
    fits: fits
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
