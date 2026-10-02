/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for flow-control: the receiver's window limits the sender. One direction of a TCP connection, counted in
   octets. The receiver has acknowledged everything before `ack` and advertises a window of `win` octets counted from
   `ack` (URM book ch. 13 and RFC 9293 §3.1: "the number of data octets beginning with the one indicated in the
   acknowledgment field that the sender of this segment is willing to accept"). The sender may have octets
   ack … ack + win − 1 sent and not yet acknowledged, and nothing beyond.
   Numbers: the book's figure ch13-prozor-kontrola-toka.svg. Segments of 500 octets, the stream starting at octet 1000
   (ch. 13, on sequence numbers: "Segment koji nosi 500 okteta i počinje na rednom broju 1000 …"), a window of 1000 octets (the figure's own
   choice, meta/chapter-13/notes.md). Moment 1 of the figure is step 1 here, moment 2 is step 4.
   One event per step, a greedy sender and in-order acknowledgments:
     - after a wait, the oldest segment in flight is acknowledged (the window slides, its size stays);
     - otherwise the sender sends the next segment if its last octet is inside the window (the right edge itself is
       inside: ≤, not <);
     - otherwise it waits: it has data, but the next segment would cross the right edge.
   Acknowledgments arrive only while the sender waits: a stylisation of a path whose round trip is longer than the
   time to send a window, the case in which the window is what limits the sender (NOTES.md).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var SEG = 500;        // octets per segment (ch. 13, the sequence-number paragraph)
  var FIRST = 1000;     // the first octet of the stream in the figure
  var START_ACK = 1500; // the figure's moment 1: "primatelj je potvrdio sve do okteta 1499"
  var STEPS = 12;
  var WINDOWS = [500, 1000, 1500, 2000];

  /** The window's edges and what fits: left edge = ack, right edge = ack + win − 1 (both inside). */
  function edges(ack, next, win) {
    var right = ack + win - 1;
    return {
      left: ack,
      right: right,
      inFlight: next - ack,             // sent, not yet acknowledged
      free: Math.max(0, right - next + 1) // may still be sent
    };
  }

  /** May the segment from `next` (SEG octets) be sent? Its last octet must not pass the right edge. */
  function fits(ack, next, win) { return next + SEG - 1 <= ack + win - 1; }

  /** Where an octet stands for the sender: 'acked' (< ack), 'flight' (sent, ≥ ack), 'allowed' (inside the window, not
      sent) or 'blocked' (past the right edge). */
  function region(octet, ack, next, win) {
    if (octet < ack) return 'acked';
    if (octet < next) return 'flight';
    if (octet <= ack + win - 1) return 'allowed';
    return 'blocked';
  }

  function snapshot(ack, next, win, event, counts) {
    return Object.assign({ ack: ack, next: next, win: win, event: event, sent: counts.sent, waits: counts.waits,
      acks: counts.acks }, edges(ack, next, win));
  }

  var logic = {
    /** The book's figure: a window of 1000 octets. */
    defaults: { win: 1000 },

    windows: WINDOWS,
    seg: SEG,
    first: FIRST,
    steps: STEPS,

    /** Step 0: octets 1000–1499 acknowledged (acknowledgment 1500), nothing else sent yet. */
    initial: function (p) {
      return snapshot(START_ACK, START_ACK, p.win, { kind: 'start' }, { sent: 0, waits: 0, acks: 0 });
    },

    /** One event: an acknowledgment after a wait, else a send if the next segment fits, else a wait. */
    step: function (s, n, p) {
      var win = p.win, ack = s.ack, next = s.next;
      var counts = { sent: s.sent, waits: s.waits, acks: s.acks };
      var event;
      if (s.event.kind === 'wait' && next > ack) {
        var oldAck = ack;
        ack = Math.min(ack + SEG, next);
        counts.acks++;
        event = { kind: 'ack', from: oldAck, ack: ack, moved: ack - oldAck };
      } else if (fits(ack, next, win)) {
        event = { kind: 'send', from: next, to: next + SEG - 1 };
        next += SEG;
        counts.sent++;
      } else {
        counts.waits++;
        event = { kind: 'wait', from: next, to: next + SEG - 1 };
      }
      return snapshot(ack, next, win, event, counts);
    },

    edges: edges,
    fits: fits,
    region: region
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
