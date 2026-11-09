/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for directed-net: one simplex channel, five (3–8) field stations with a routine message each, with and without
   a net control station (NCS). Without one, stations key up when they like and collide (doubling); with one, the NCS
   calls them one at a time and the contention becomes a queue. Rules and numbers: SPEC.md.
   One step = one ≈15 s slot of the channel. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it.

   `freeStep`, `directedStep`, `order` and `resolve` are pure functions over plain lane data, with no strings: they can
   be promoted to models/ unchanged (backup-ncs and priority-traffic build on the same directed-net rules). */
(function (root) {
  'use strict';

  var IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  // Fictional call signs. A suffix starting with Q is not issued (Q codes), so none of these belongs to anybody.
  var CALLS = { A: '9A1QAA', B: '9A1QBB', C: '9A1QCC', D: '9A1QDD', E: '9A1QEE', F: '9A1QFF', G: '9A1QGG', H: '9A1QHH' };
  // Each station's fixed backoff in slots, by pattern (rule 2: no random backoff, the presets fix it).
  var PATTERNS = {
    same: [2, 2, 2, 2, 2, 2, 2, 2],     // everyone politely waits two slots
    mixed: [1, 1, 2, 2, 3, 3, 4, 4],    // pairs share a value
    spread: [1, 2, 3, 4, 5, 6, 7, 8]    // all different: the lucky case
  };
  var NCS = 'NCS';
  var SLOT_S = 15;                      // one slot ≈ one short transmission (illustrative)
  var MAX_STEPS = 20;                   // the contract's stepper limit

  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function byId(lane, id) { return lane.stations.filter(function (x) { return x.id === id; })[0]; }

  /** Resolve a slot from its transmitters: one = heard, two or more = doubled (all lost), none = idle. */
  function resolve(tx) { return tx.length === 0 ? 'idle' : tx.length === 1 ? 'heard' : 'doubled'; }

  /** The NCS's calling order: alphabetical by call sign (KK1 "Aktivacija mreže"); the id breaks a tie, which the
      fixed call signs never produce. Plain string comparison, the same in every locale. */
  function order(stations) {
    return stations.slice().sort(function (a, b) {
      return a.call < b.call ? -1 : a.call > b.call ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    }).map(function (x) { return x.id; });
  }

  function count(p) { return Math.max(3, Math.min(8, p.stations | 0)); }

  function lane(mode, p) {
    var n = count(p), bo = PATTERNS[p.backoff] || PATTERNS.same;
    var stations = IDS.slice(0, n).map(function (id, i) {
      return { id: id, call: CALLS[id], pending: true, nextTry: 1, backoff: bo[i], sentAt: null, deliveredAt: null };
    });
    return {
      mode: mode,
      stations: stations,
      ncs: mode === 'directed' ? { open: false, queue: order(stations), calling: null, ackDue: null, log: [] } : null,
      channel: [],
      counts: { delivered: 0, doubled: 0, idle: 0 },
      done: null                 // slot in which the last message was delivered
    };
  }

  function record(L, n, acts) {
    var outcome = resolve(acts);
    L.channel.push({ slot: n, tx: acts.map(function (a) { return a.who; }), outcome: outcome, acts: acts });
    if (L.done) return outcome;          // a finished lane (side by side) keeps its strip but stops counting
    if (outcome === 'doubled') L.counts.doubled++;
    if (outcome === 'idle') L.counts.idle++;
    return outcome;
  }

  function deliver(L, id, n) {
    var st = byId(L, id);
    st.pending = false;
    st.deliveredAt = n;
    L.counts.delivered++;
    if (L.stations.every(function (x) { return !x.pending; })) L.done = n;
  }

  /** Free-for-all, one slot (rule 1). Every station with a pending message transmits when slot ≥ nextTry; the
      transmitters are listed in id order (rule 6). Heard = delivered (rule 5: the ACK is implicit in free mode).
      After a doubled slot each transmitter waits its own backoff: nextTry = slot + 1 + backoff. */
  function freeStep(prev, n) {
    var L = copy(prev);
    var tx = L.stations.filter(function (x) { return x.pending && n >= x.nextTry; })
      .map(function (x) { return x.id; }).sort();
    var outcome = record(L, n, tx.map(function (id) { return { who: id, kind: 'msg' }; }));
    if (outcome === 'heard') {
      byId(L, tx[0]).sentAt = n;
      deliver(L, tx[0], n);
    } else if (outcome === 'doubled') {
      tx.forEach(function (id) { var x = byId(L, id); x.nextTry = n + 1 + x.backoff; });
    }
    return L;
  }

  /** Directed net, one slot (rules 3–5). Only the NCS speaks unasked; a station transmits only in the slot after the
      NCS called it. Slot 1 opens the net; each call carries the ACK of the previous message; a last slot ACKs the final
      message. A message counts as delivered when it is ACKed. One transmitter per slot, so no doubling, no ties. */
  function directedStep(prev, n) {
    var L = copy(prev), c = L.ncs, act = null;
    if (c.calling) {
      act = { who: c.calling, kind: 'msg' };
    } else if (!c.open) {
      act = { who: NCS, kind: 'open' };
    } else if (c.queue.length) {
      act = { who: NCS, kind: 'call', target: c.queue[0], ack: c.ackDue };
    } else if (c.ackDue) {
      act = { who: NCS, kind: 'close', ack: c.ackDue };
    }
    record(L, n, act ? [act] : []);
    if (!act) return L;
    if (act.kind === 'msg') {
      byId(L, act.who).sentAt = n;
      c.ackDue = act.who;
      c.calling = null;
      c.log.push({ slot: n, from: act.who, to: NCS, kind: 'msg' });
      return L;
    }
    if (act.kind === 'open') c.open = true;
    if (act.ack) { deliver(L, act.ack, n); c.ackDue = null; }
    if (act.kind === 'call') { c.calling = c.queue.shift(); }
    c.log.push({ slot: n, from: NCS, to: act.target || '*', kind: act.kind, ack: act.ack || null });
    return L;
  }

  function laneStep(L, n) { return L.mode === 'directed' ? directedStep(L, n) : freeStep(L, n); }

  /** Slots until a free-for-all lane has delivered everything, or null if it has not by slot 20. */
  function freeEnd(p) {
    var L = lane('free', p);
    for (var n = 1; n <= MAX_STEPS; n++) { L = freeStep(L, n); if (L.done) return n; }
    return null;
  }

  var logic = {
    IDS: IDS, CALLS: CALLS, PATTERNS: PATTERNS, NCS: NCS, SLOT_S: SLOT_S, MAX_STEPS: MAX_STEPS,
    resolve: resolve, order: order, lane: lane, freeStep: freeStep, directedStep: directedStep, freeEnd: freeEnd,

    /** mode: 'free', 'directed' or 'both' (the two lanes in lockstep, same stations and backoffs). */
    defaults: { mode: 'free', stations: 5, backoff: 'same' },

    initial: function (p) {
      var modes = p.mode === 'both' ? ['free', 'directed'] : [p.mode === 'directed' ? 'directed' : 'free'];
      return { slot: 0, mode: p.mode, lanes: modes.map(function (m) { return lane(m, p); }) };
    },

    step: function (prev, n) {
      return { slot: n, mode: prev.mode, lanes: prev.lanes.map(function (L) { return laneStep(L, n); }) };
    },

    /** Slots in the demo. Directed: 1 + 2·n + 1. Free: until every message is delivered, at most 20. Both: the directed
        net's length, or the free lane's end if it finishes later within 20 (each lane runs to its own end). With the
        three patterns a free lane finishes in n + 2 slots or never, so the max is a guard for other patterns. */
    steps: function (p) {
      var dir = 2 * count(p) + 2, free = freeEnd(p);
      if (p.mode === 'directed') return dir;
      if (p.mode === 'both') return free ? Math.max(free, dir) : dir;
      return free || MAX_STEPS;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
