/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for priority-traffic: a running directed net (an NCS, field stations A–F, one simplex channel as a strip of
   slots) with a queue of messages of four priorities. HITNO breaks in and cuts what is on the air, PRIORITET goes before
   RUTINSKO, INFORMATIVNO only when nothing else waits; the NCS can restrict the net to PRIORITET and HITNO; a message
   is delivered only by its ACK, a sender without one retries and after three tries uses its relay.
   Rules, tie-breaks and numbers: SPEC.md.
   One step = one ≈15 s slot. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON, with codes instead
   of text. The page loads this as a classic script (window.SimLogic); node tests require() it.

   Reused from directed-net (sims/directed-net/sim.js @ 23dc9d1, not yet in models/): the fictional call signs, the
   slot model and the exchange of 2 slots (the station sends, the NCS's next transmission carries the ACK and the next
   call). directed-net's step functions are not copied: its lanes have no priorities, so the exchange is rewritten
   here as a state machine with the new phases. */
(function (root) {
  'use strict';

  var IDS = ['A', 'B', 'C', 'D', 'E', 'F'];
  // from sims/directed-net/sim.js @ 23dc9d1: a suffix starting with Q is not issued (Q codes), so none belongs to anybody
  var CALLS = { A: '9A1QAA', B: '9A1QBB', C: '9A1QCC', D: '9A1QDD', E: '9A1QEE', F: '9A1QFF' };
  // Each station's relay (rule 6, derived): neighbours in pairs.
  var RELAYS = { A: 'B', B: 'A', C: 'D', D: 'C', E: 'F', F: 'E' };
  var PRIOS = ['HIT', 'PRI', 'RUT', 'INF'];               // rule 1: order of service
  var CODE = { H: 'HIT', P: 'PRI', R: 'RUT', I: 'INF' };  // the letters of the `inject` tokens
  var NCS = 'NCS';
  var TRIES = 3;           // rule 5: three tries without an ACK, then the relay
  var MAX_STEPS = 20;      // the contract's stepper limit
  var MAX_MSGS = 12;       // messages the inject buttons may add up to
  var MAX_RESTRICT = 6;    // restriction announcements
  var LAST_SLOT = MAX_STEPS - 1;
  var SLOT_S = 15;         // one slot ≈ one short transmission (illustrative)

  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function rank(prio) { return PRIOS.indexOf(prio); }
  function byCall(a, b) {
    var ca = CALLS[a] || a, cb = CALLS[b] || b;
    return ca < cb ? -1 : ca > cb ? 1 : a < b ? -1 : a > b ? 1 : 0;
  }

  /** `inject` tokens `<slot><station><H|P|R|I>` (`0AR.3DH`), valid ones only, at most 12, in registration order:
      slot, then call sign (rule 1 tie-break), then the order written. Each gets its id m1, m2, … in that order. */
  function injectsOf(p) {
    var out = [];
    String(p.inject || '').split('.').forEach(function (tok, i) {
      var m = /^(-?\d{1,2})([A-F])([HPRI])$/.exec(tok);
      if (!m || out.length >= MAX_MSGS) return;
      var slot = Number(m[1]);
      if (slot < -9 || slot > LAST_SLOT) return;
      out.push({ slot: slot, from: m[2], prio: CODE[m[3]], i: i });
    });
    out.sort(function (a, b) { return a.slot - b.slot || byCall(a.from, b.from) || a.i - b.i; });
    return out.map(function (x, k) { return { id: 'm' + (k + 1), slot: x.slot, from: x.from, prio: x.prio }; });
  }

  /** `restrict`: slots (1…19) in which a restriction announcement is requested, ascending, duplicates dropped. */
  function restrictsOf(p) {
    var seen = {};
    return String(p.restrict || '').split('.').map(Number)
      .filter(function (n) { return n >= 1 && n <= LAST_SLOT && Math.floor(n) === n && !seen[n] && (seen[n] = true); })
      .sort(function (a, b) { return a - b; }).slice(0, MAX_RESTRICT);
  }

  /** Token for one injected message, as the buttons write it. */
  function token(slot, from, prio) { return slot + from + prio.charAt(0); }

  function cutoffOf(p) { return p.cutoff === 'none' ? [] : String(p.cutoff || '').split('').filter(function (c) { return IDS.indexOf(c) >= 0; }); }

  function msgOf(s, id) { return s.messages.filter(function (m) { return m.id === id; })[0]; }
  function stOf(s, id) { return s.stations.filter(function (x) { return x.id === id; })[0]; }
  function reaches(s, id) { var x = stOf(s, id); return !!x && x.reachesNcs; }
  function sender(m) { return m.via || m.from; }

  /** Rule 1: a new registration goes after the last message of the same or a higher priority (FIFO within a priority);
      with priorities off, at the end (plain FIFO). */
  function enqueue(s, m) {
    var q = s.ncs.queue, at = q.length;
    if (s.priorities) {
      at = 0;
      q.forEach(function (e, i) { if (rank(e.prio) <= rank(m.prio)) at = i + 1; });
    }
    q.splice(at, 0, { msgId: m.id, from: m.from, prio: m.prio, registeredAt: m.registeredAt });
  }

  /** Rule 3: a cut message goes back to the front of its priority. */
  function requeueFront(s, m) {
    var q = s.ncs.queue, at = q.length;
    for (var i = 0; i < q.length; i++) { if (!s.priorities || rank(q[i].prio) >= rank(m.prio)) { at = i; break; } }
    q.splice(at, 0, { msgId: m.id, from: m.from, prio: m.prio, registeredAt: m.registeredAt });
  }

  /** Rules 1, 2, 4: the first queue entry the NCS may call; under the restriction RUTINSKO and INFORMATIVNO wait. */
  function eligible(s) {
    var q = s.ncs.queue;
    for (var i = 0; i < q.length; i++) {
      if (!(s.ncs.restricted && rank(q[i].prio) >= rank('RUT'))) return i;
    }
    return -1;
  }

  /** The NCS calls entry i of the queue: it becomes the exchange on the channel. A message that already failed three
      times goes to its relay; one the relay already took is sent by the relay. */
  function callAt(s, i) {
    var e = s.ncs.queue.splice(i, 1)[0], m = msgOf(s, e.msgId);
    s.ncs.current = { msgId: m.id, phase: !m.via && m.tries >= TRIES ? 'relay' : 'send' };
    return m.id;
  }

  /** One NCS transmission: the ACKs it carries (rule 5; a HITNO's ACK also passes it on), then the restriction
      announcement if one is pending (instead of a call, rule 4), else a call of the first eligible entry. */
  function ncsTransmit(s, n, acks) {
    var c = s.ncs, entry = { slot: n, kind: 'ncs', who: NCS, acks: acks.slice(), call: null, announce: null };
    acks.forEach(function (id) { var m = msgOf(s, id); m.delivered = true; m.deliveredAt = n; });
    c.ackOwed = [];
    c.current = null;
    var i = eligible(s);
    var hitWaits = s.priorities && i >= 0 && c.queue[i].prio === 'HIT';
    if (c.announce && !hitWaits) {
      c.restricted = c.announce === 'on';
      entry.announce = c.announce;
      c.announce = null;
    } else if (i >= 0) {
      entry.call = callAt(s, i);
    }
    c.log.push(entry);
  }

  /** Rule 3: a HITNO breaks in. What the slot would have carried is cut. */
  function breakIn(s, n, m) {
    var c = s.ncs, cur = c.current, cut = null;
    if (cur) {
      var cm = msgOf(s, cur.msgId);
      cut = { msgId: cm.id, phase: cur.phase };
      if (cur.phase === 'ack') {
        c.ackOwed.push(cm.id);          // heard, but its ACK did not get through: owed on the next ACK
      } else {
        // send / relay: the transmission on the air is cut. wait: nothing was on the air, the exchange is suspended.
        // relayAck: the relay already holds the message, so it keeps it and sends it "via" itself when called.
        if (cur.phase === 'send' || cur.phase === 'relay') cm.interrupted = true;
        if (cur.phase === 'relayAck') cm.via = stOf(s, cm.from).relay;
        requeueFront(s, cm);            // not delivered: back to the front of its priority (tries kept)
      }
    } else if (c.announce || c.ackOwed.length || eligible(s) >= 0) {
      cut = { msgId: null, phase: 'ncs' }; // the NCS's call or announcement did not happen; it stays to do
    }
    c.current = { msgId: m.id, phase: 'goahead' };
    c.log.push({ slot: n, kind: 'breakin', who: m.from, msgId: m.id, cut: cut });
  }

  /** A HITNO holds the channel or waits in the queue: a new one waits behind it (rule 3, FIFO among HITNO). */
  function hitBusy(s) {
    var cur = s.ncs.current;
    return (!!cur && msgOf(s, cur.msgId).prio === 'HIT') || s.ncs.queue.some(function (e) { return e.prio === 'HIT'; });
  }

  var logic = {
    IDS: IDS, CALLS: CALLS, RELAYS: RELAYS, PRIOS: PRIOS, NCS: NCS, TRIES: TRIES, SLOT_S: SLOT_S,
    MAX_STEPS: MAX_STEPS, MAX_MSGS: MAX_MSGS, MAX_RESTRICT: MAX_RESTRICT, LAST_SLOT: LAST_SLOT,
    rank: rank, injectsOf: injectsOf, restrictsOf: restrictsOf, token: token, cutoffOf: cutoffOf,
    eligible: eligible, enqueue: enqueue, requeueFront: requeueFront, msgOf: msgOf,

    /** Defaults = preset 1 (`emergency`): A, B and C queued with routine traffic, D's HITNO arises in slot 3. */
    defaults: { priorities: true, cutoff: 'none', from: 'D', inject: '0AR.0BR.0CR.3DH', restrict: '' },

    initial: function (p) {
      var off = cutoffOf(p);
      var s = {
        slot: 0,
        priorities: p.priorities !== false,
        ncs: { queue: [], current: null, restricted: false, announce: null, ackOwed: [], log: [] },
        messages: [],
        stations: IDS.map(function (id) { return { id: id, call: CALLS[id], reachesNcs: off.indexOf(id) < 0, relay: RELAYS[id] }; })
      };
      // the net is running: what registered before slot 1 is queued, and the NCS's slot-0 transmission called the head
      injectsOf(p).filter(function (x) { return x.slot <= 0; }).forEach(function (x) {
        var m = { id: x.id, from: x.from, prio: x.prio, registeredAt: x.slot, tries: 0, delivered: false, deliveredAt: null,
          interrupted: false, via: null, offChannel: false };
        s.messages.push(m);
        enqueue(s, m);
      });
      var i = eligible(s);
      s.ncs.log.push({ slot: 0, kind: 'ncs', who: NCS, acks: [], call: i >= 0 ? callAt(s, i) : null, announce: null });
      return s;
    },

    step: function (prev, n, p) {
      var s = copy(prev), c = s.ncs, hit = null;
      s.slot = n;

      // (1) registrations of this slot, in rule-1 order; the first HITNO breaks in unless a HITNO holds the channel
      if (restrictsOf(p).indexOf(n) >= 0) {
        c.announce = c.announce ? null : (c.restricted ? 'off' : 'on');   // a second request before airing cancels it
      }
      injectsOf(p).filter(function (x) { return x.slot === n; }).forEach(function (x) {
        var m = { id: x.id, from: x.from, prio: x.prio, registeredAt: n, tries: 0, delivered: false, deliveredAt: null,
          interrupted: false, via: null, offChannel: false };
        s.messages.push(m);
        if (s.priorities && m.prio === 'HIT' && !hit && reaches(s, m.from) && !hitBusy(s)) hit = m;
        else enqueue(s, m);
      });
      if (hit) { breakIn(s, n, hit); return s; }

      // (2)–(4) the NCS's choice, the transmission, the ACK bookkeeping
      var cur = c.current;
      if (!cur) {
        if (c.announce || c.ackOwed.length || eligible(s) >= 0) ncsTransmit(s, n, c.ackOwed);
        else c.log.push({ slot: n, kind: 'idle', who: null });
        return s;
      }
      var m = msgOf(s, cur.msgId);
      if (cur.phase === 'ack') {
        ncsTransmit(s, n, c.ackOwed.concat([m.id]));
      } else if (cur.phase === 'goahead') {
        c.log.push({ slot: n, kind: 'goahead', who: NCS, to: m.from, msgId: m.id });
        cur.phase = 'send';
      } else if (cur.phase === 'send') {
        var who = sender(m), heard = reaches(s, who);
        if (!m.via) m.tries++;
        c.log.push({ slot: n, kind: 'msg', who: who, msgId: m.id, heard: heard, via: m.via, tries: m.tries });
        cur.phase = heard ? 'ack' : 'wait';
      } else if (cur.phase === 'wait') {
        // no ACK in this slot: the sender repeats, or after the third try goes to its relay (or another channel)
        var relay = stOf(s, m.from).relay, next = 'send';
        if (m.tries >= TRIES) next = relay && reaches(s, relay) ? 'relay' : 'off';
        c.log.push({ slot: n, kind: 'noack', who: null, msgId: m.id, tries: m.tries, next: next });
        if (next === 'off') { m.offChannel = true; c.current = null; } else cur.phase = next;
      } else if (cur.phase === 'relay') {
        c.log.push({ slot: n, kind: 'relay', who: m.from, to: stOf(s, m.from).relay, msgId: m.id });
        cur.phase = 'relayAck';
      } else if (cur.phase === 'relayAck') {
        m.via = stOf(s, m.from).relay;
        c.log.push({ slot: n, kind: 'relayAck', who: m.via, to: m.from, msgId: m.id });
        cur.phase = 'send';
      }
      return s;
    },

    /** Nothing left to do: no exchange, nothing queued or owed, no announcement pending. */
    settled: function (s) {
      var c = s.ncs;
      return !c.current && !c.queue.length && !c.ackOwed.length && !c.announce;
    },

    /** Slots in the demo: the first slot after the last scheduled event in which the net has settled, at most 20. */
    steps: function (p) {
      var last = 0;
      injectsOf(p).forEach(function (x) { last = Math.max(last, x.slot); });
      restrictsOf(p).forEach(function (n) { last = Math.max(last, n); });
      var s = logic.initial(p);
      for (var n = 1; n <= MAX_STEPS; n++) {
        s = logic.step(s, n, p);
        if (n >= last && logic.settled(s)) return n;
      }
      return MAX_STEPS;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
