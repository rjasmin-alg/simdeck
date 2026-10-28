/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for tcp-vs-udp-loss: the same stream sent once by TCP and once by UDP over the same lossy path. Time runs in
   slots; unit k is first sent in slot k by both. UDP loses what is lost; TCP acknowledges cumulatively, holds what
   comes after a gap and resends the oldest unacknowledged unit when its RTO runs out (doubling each time). An explorer:
   the params drive one pure function, simulate(params); the page reveals its result up to the time cursor t.
   Rules, tie-breaks and numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. Randomness is
   Simdeck.rng(seed). State is plain JSON. The page loads this as a classic script (window.SimLogic); node tests
   require() it. No strings: the page words everything from codes. */
(function (root) {
  'use strict';

  var rng = (root.Simdeck || (typeof require === 'function' ? require('../../kit/kit.js') : {})).rng;

  var SEQ0 = 1000;        // the first octet (URM ch13 Primjer 4: 1000, 1500, 2000)
  var RTO_MAX = 32;       // the backed-off RTO stops doubling here (RFC 6298 §2.5 allows a maximum; scaled to slots)
  var MAX_TX = 12;        // a unit is sent at most this often (a safety stop; no param combination reaches it, tested)
  var MAX_SLOT = 2000;    // the run stops here whatever happens (a safety stop; the longest real run ends in slot 341)
  var RETX_SEED = 1000;   // retransmissions draw from their own stream, so the first sends match UDP's exactly
  var END = 999;          // t at its default: clamped to the end by the page's range

  function bit(mask, k) { return Math.floor(mask / Math.pow(2, k - 1)) % 2 === 1; }
  function seqOf(p, k) { return SEQ0 + (k - 1) * p.size; }

  /** Which transmissions are lost. pattern: the first send of every unit in `lose` (a bit mask, bit k−1 = unit k) and,
      for units in `lose2`, their first resend too. random: every send, data and resend alike, with probability
      loss %, from a seeded generator; first sends draw from one stream (one draw per unit, so TCP and UDP lose the
      same units), resends from another, in the order they are sent (rule 3). */
  function lossOf(p) {
    if (p.mode === 'random') {
      var r1 = rng(p.seed), r2 = rng(p.seed + RETX_SEED), first = [];
      for (var k = 1; k <= p.n; k++) first[k] = r1() < p.loss / 100;
      return { first: function (k) { return first[k]; }, retx: function () { return r2() < p.loss / 100; } };
    }
    return {
      first: function (k) { return bit(p.lose, k); },
      retx: function (k, j) { return j === 1 && bit(p.lose, k) && bit(p.lose2, k); }
    };
  }

  /** UDP (rule 4): each datagram once, slot k; a lost one is gone, nothing goes back; what arrives goes to the
      application at once, in arrival order. */
  function udp(p, loss) {
    var sends = [], delivered = [], missing = [];
    for (var k = 1; k <= p.n; k++) {
      var lost = loss.first(k);
      sends.push({ unit: k, seq: seqOf(p, k), slot: k, arrive: k + 1, lost: lost });
      if (lost) missing.push(k);
      else delivered.push({ unit: k, slot: k + 1, arrived: k + 1 });
    }
    return { sends: sends, delivered: delivered, missing: missing, finish: p.n + 1 };
  }

  /** TCP (rules 2, 5–8), slot by slot. In each slot, in this order: ACKs reach the sender; data reaches the receiver
      (in sequence order), which hands what is in order to the application and answers each arrival with one
      cumulative ACK; the sender resends the oldest unacknowledged unit if its RTO has run out; the sender sends the
      next new unit. */
  function tcp(p, loss) {
    var n = p.n;
    var units = [];
    for (var k = 1; k <= n; k++) units[k] = { tx: 0, last: null, deadline: null, arrived: null, delivered: null };
    var sends = [], acks = [], delivered = [];
    var una = 1;          // the oldest unit the sender has no ACK for
    var next = 1;         // the receiver's next expected unit
    var held = {};        // units held after a gap: unit -> arrival slot
    var lastAck = null, capped = false;

    function send(k, s) {
      var u = units[k];
      u.tx += 1;
      var lost = u.tx === 1 ? loss.first(k) : loss.retx(k, u.tx - 1);
      u.last = s;
      u.deadline = s + logic.rtoAfter(p, u.tx);           // rule 6: RTO after this send, doubled for every resend
      sends.push({ unit: k, seq: seqOf(p, k), slot: s, arrive: s + 1, lost: lost, tx: u.tx - 1 });
    }
    function deliver(k, s, arrived) {
      units[k].delivered = s;
      delivered.push({ unit: k, slot: s, arrived: arrived });
    }

    for (var s = 1; ; s++) {
      // 1. ACKs sent in the slot before reach the sender (never lost, rule 3)
      acks.forEach(function (a) { if (a.arrive === s && a.next > una) una = a.next; });
      // 2. data reaches the receiver, in sequence order (rule 8)
      var arriving = sends.filter(function (m) { return m.arrive === s && !m.lost; })
        .sort(function (a, b) { return a.unit - b.unit || a.slot - b.slot; });
      arriving.forEach(function (m) {
        var k = m.unit;
        if (k < next || held[k] != null) m.dup = true;          // already had it: ignored (none happen, tested)
        else if (k === next) {
          units[k].arrived = s;
          deliver(k, s, s);
          next += 1;
          while (held[next] != null) { deliver(next, s, held[next]); delete held[next]; next += 1; }
        } else {
          units[k].arrived = s;
          held[k] = s;
          m.held = true;
        }
        var ackNo = seqOf(p, next);
        acks.push({ n: ackNo, next: next, slot: s, arrive: s + 1, dup: lastAck === ackNo, of: k });
        lastAck = ackNo;
      });
      // 3. the RTO of the oldest unacknowledged unit (only that one is resent, RFC 9293 §3.8 / RFC 6298 §5.4)
      if (una <= n && units[una].tx > 0 && units[una].deadline <= s) {
        if (units[una].tx >= MAX_TX) capped = true;
        else send(una, s);
      }
      // 4. the next new unit: unit k in slot k (rule 1; the window is never full, rule 7)
      if (s <= n) send(s, s);

      var busy = sends.some(function (m) { return m.arrive > s; }) || acks.some(function (a) { return a.arrive > s; });
      if (s >= MAX_SLOT) capped = true;
      if ((una > n && !busy) || capped) break;
    }

    var maxStall = 0;
    delivered.forEach(function (d) { maxStall = Math.max(maxStall, d.slot - d.arrived); });
    var finish = delivered.length ? delivered[delivered.length - 1].slot : null;
    return { sends: sends, acks: acks, delivered: delivered, finish: finish, maxStall: maxStall,
      retx: sends.filter(function (m) { return m.tx > 0; }).length, capped: capped };
  }

  var logic = {
    SEQ0: SEQ0, RTO_MAX: RTO_MAX, MAX_TX: MAX_TX, END: END, seqOf: seqOf, bit: bit,

    /** lose and lose2 have no visible control: the page sets them when a unit is clicked (NOTES.md). */
    defaults: { mode: 'pattern', n: 3, size: 500, loss: 10, seed: 1, rto: 4, lose: 2, lose2: 0, t: END },

    /** The presets (SPEC.md): ids and params; the page adds the words. lose/lose2 are unit bit masks. */
    presets: [
      { id: 'book-example', params: {} },                                         // ch13 Primjer 4: unit 2 lost
      { id: 'call-vs-file', params: { n: 20, lose: 4112 } },                      // ch13 Primjer 6: units 5, 13
      { id: 'retransmit-lost', params: { n: 10, lose: 8, lose2: 8 } },            // unit 4 and its first resend
      { id: 'no-loss', params: { n: 10, lose: 0 } },
      { id: 'random-20', params: { mode: 'random', loss: 20, seed: 3, n: 20 } }
    ],

    /** The explorer's state: the whole run (the kit calls this on every param change). */
    initial: function (p) { return logic.simulate(p); },

    /** The RTO that runs after a unit's tx-th send (1 = the first): rto, doubled per resend, at most RTO_MAX. */
    rtoAfter: function (p, tx) { return Math.min(p.rto * Math.pow(2, tx - 1), RTO_MAX); },

    /** The whole run for these params (t does not change it). */
    simulate: function (p) {
      var loss = lossOf(p);
      var u = udp(p, loss);
      var c = tcp(p, loss);
      return { tcp: c, udp: u, end: Math.max(c.finish || 0, u.finish) };
    },

    /** The units whose first send is lost, and those whose first resend is lost too, as the masks `lose` and `lose2`:
        clicking a unit in random mode carries the drawn pattern over to pattern mode. */
    masks: function (p) {
      var r = logic.simulate(p), lose = 0, lose2 = 0;
      r.tcp.sends.forEach(function (m) {
        if (m.tx === 0 && m.lost) lose += Math.pow(2, m.unit - 1);
        if (m.tx === 1 && m.lost) lose2 += Math.pow(2, m.unit - 1);
      });
      return { lose: lose, lose2: lose2 };
    },

    /** One click on unit k: arrives → lost → lost with its first resend → arrives. */
    cycle: function (m, k) {
      var b = Math.pow(2, k - 1);
      if (!bit(m.lose, k)) return { lose: m.lose + b, lose2: bit(m.lose2, k) ? m.lose2 - b : m.lose2 };
      if (!bit(m.lose2, k)) return { lose: m.lose, lose2: m.lose2 + b };
      return { lose: m.lose - b, lose2: m.lose2 - b };
    },

    /** A unit's fate at time t, for the delivery strip: 'wait' (not arrived yet), 'held' (arrived, in TCP's buffer),
        'gap' (lost, TCP still owes it), 'never' (UDP: lost for good), 'done' (handed to the application). */
    fateAt: function (run, proto, k, t) {
      var d = run[proto].delivered.filter(function (x) { return x.unit === k; })[0];
      if (d && d.slot <= t) return 'done';
      if (proto === 'udp') return !d && t >= k + 1 ? 'never' : 'wait';
      if (d && d.arrived <= t) return 'held';
      var firstLost = run.tcp.sends.some(function (m) { return m.unit === k && m.tx === 0 && m.lost; });
      return firstLost && t >= k + 1 ? 'gap' : 'wait';
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
