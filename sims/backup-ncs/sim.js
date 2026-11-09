/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for backup-ncs: a directed net loses its net control station (NCS) mid-traffic; a pre-named backup NCS that
   listened all along takes over after 60 s of silence (KK2 "Zamjenski NCS"). Rules and numbers: SPEC.md.
   One step = one 15 s slot of the channel. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it.

   The directed-net part (slots, the NCS calling rule, send then ACK in the controller's next call, doubling when two
   transmit at once) follows docs/tasks/w3/directed-net.md rules 3, 4 and 6; sims/directed-net/ was not built when
   this was written, so nothing is copied from it. That part is the functions `nextTarget`, `resolve` and the call /
   answer branches of `step`: pure functions over plain data, promotable to models/ unchanged. */
(function (root) {
  'use strict';

  var IDS = ['A', 'B', 'C', 'D', 'E'];   // field stations, alphabetical = calling and check-in order (KK1 "Aktivacija mreže")
  var SLOT_S = 15;                       // one slot ≈ one short transmission (directed-net)
  var MAX_STEPS = 20;                    // the contract's stepper limit
  var DEAD_AFTER = 4;                    // without a backup the net counts as down after 60 s of silence (rule 5)
  var DEAD_STEPS = 15;                   // a net that never recovers is shown for 15 slots (the takeover preset's length)
  var CLOCK0 = 10 * 3600 + 30 * 60;      // slot 1 starts at 10:30:00 UTC (illustrative; the UTC log entry, KK2)

  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function has(list, id) { return list.indexOf(id) >= 0; }
  function add(list, id) { if (!has(list, id)) list.push(id); }
  function station(s, id) { return s.stations.filter(function (x) { return x.id === id; })[0]; }

  /** Slot at which the NCS comes back, or null: never before the slot after it fails. */
  function returnSlot(p) { return p.ncsReturns ? Math.max(p.returnAt, p.failAt + 1) : null; }

  /** Is the NCS on the air in slot n? Silent from failAt, back from the return slot (if any). */
  function ncsAlive(p, n) {
    var back = returnSlot(p);
    return n < p.failAt || (back !== null && n >= back);
  }

  /** UTC time at the start of slot n, "hh:mm:ss" (pure arithmetic, no Date). */
  function utc(n) {
    var t = CLOCK0 + (n - 1) * SLOT_S;
    var two = function (v) { return (v < 10 ? '0' : '') + v; };
    return two(Math.floor(t / 3600) % 24) + ':' + two(Math.floor(t / 60) % 60) + ':' + two(t % 60);
  }

  /** The station a controller calls next: the first, in alphabetical order, that is not in its log (rule 4). */
  function nextTarget(log) {
    for (var i = 0; i < IDS.length; i++) if (!has(log, IDS[i])) return IDS[i];
    return null;
  }

  /** What one controller transmits in a control slot: announce, hand back, call the next station (with the pending
      ACK) or close the net (the final ACK). `who` is 'ncs' or 'bncs'. */
  function controlTx(s, who) {
    var c = who === 'ncs' ? s.ncs : s.backup;
    if (who === 'bncs' && s.backup.handback) return { who: who, kind: 'handback' };
    if (who === 'bncs' && s.backup.announced === null) return { who: who, kind: 'announce', checkin: !s.backup.logging };
    var target = nextTarget(c.log);
    var ack = c.ackDue && station(s, c.ackDue).ackedAt === null ? c.ackDue : null;
    if (target) return { who: who, kind: 'call', target: target, ack: ack };
    if (ack) return { who: who, kind: 'close', ack: ack };
    return null;                                        // nothing left to say
  }

  /** Resolve a slot from its transmissions: one = heard, two or more = doubled (all lost), none = idle. */
  function resolve(txs) {
    return txs.length === 0 ? 'idle' : txs.length === 1 ? 'heard' : 'doubled';
  }

  /** Apply one heard control transmission. */
  function applyControl(s, tx, n) {
    var c = tx.who === 'ncs' ? s.ncs : s.backup;
    if (tx.ack) {
      station(s, tx.ack).ackedAt = n;
      s.ncs.ackDue = s.ncs.ackDue === tx.ack ? null : s.ncs.ackDue;
      s.backup.ackDue = s.backup.ackDue === tx.ack ? null : s.backup.ackDue;
    }
    c.ackDue = c.ackDue === tx.ack ? null : c.ackDue;
    if (tx.kind === 'call') s.called = tx.target;
    if (tx.kind === 'announce') {
      s.backup.announced = n;
      s.backup.takeoverUtc = utc(n);                   // rule 2: the takeover goes into the log with its UTC time
      s.events.push({ slot: n, code: 'backup.takeover' });
      if (tx.checkin) s.checkin = IDS.slice();          // rule 4: no log of its own → re-run the check-in
    }
    if (tx.kind === 'handback') {                       // rule 6: the later announcer hands control back
      s.backup.active = false;
      s.backup.handback = false;
      s.backup.announced = null;
      s.backup.log.forEach(function (id) { add(s.ncs.log, id); });
      if (s.backup.ackDue) s.ncs.ackDue = s.backup.ackDue;
      s.events.push({ slot: n, code: 'backup.handback' });
    }
  }

  var logic = {
    IDS: IDS, SLOT_S: SLOT_S, DEAD_AFTER: DEAD_AFTER, MAX_STEPS: MAX_STEPS, DEAD_STEPS: DEAD_STEPS,
    utc: utc, ncsAlive: ncsAlive, returnSlot: returnSlot, nextTarget: nextTarget, resolve: resolve,

    defaults: { failAt: 5, backup: true, logging: true, wait: 4, ncsReturns: false, returnAt: 7 },

    initial: function (p) {
      return {
        slot: 0,
        ncs: { alive: true, silentSince: null, returnsAt: returnSlot(p), silence: 0, log: [], ackDue: null },
        backup: {
          designated: !!p.backup, logging: !!p.logging, takeoverAfterSlots: p.wait,
          active: false, announced: null, handback: false, takeoverUtc: null, log: [], ackDue: null
        },
        controller: 'ncs',
        stations: IDS.map(function (id) { return { id: id, pending: true, deliveredAt: null, ackedAt: null, checkedIn: null, hadTraffic: null }; }),
        called: null,              // the station called clearly in the last slot: it answers in this one (rule: only when called)
        checkin: null,             // stations still to check in after a takeover without a log, in order
        channel: [],
        events: [],
        tx: null                   // this slot's transmissions, for the page
      };
    },

    step: function (prev, n, p) {
      var s = copy(prev);
      s.slot = n;
      var alive = ncsAlive(p, n);
      var wasAlive = s.ncs.alive;
      s.ncs.alive = alive;
      if (wasAlive && !alive) { s.ncs.silentSince = n; s.events.push({ slot: n, code: 'ncs.silent' }); }
      if (!wasAlive && alive) { s.ncs.silentSince = null; s.events.push({ slot: n, code: 'ncs.return' }); }
      s.controller = alive && s.backup.active ? 'both' : alive ? 'ncs' : s.backup.active ? 'backup' : 'none';

      // (1)+(2): who transmits. A station speaks only when called in the last slot, or in its check-in turn; otherwise
      // the slot belongs to the controller(s). Stations keep discipline while nobody controls the net (rule 3).
      var txs = [], kind;
      if (s.called) {
        kind = 'answer';
        txs.push({ who: s.called, kind: 'answer' });
      } else if (s.checkin && s.checkin.length) {
        kind = 'checkin';
        txs.push({ who: s.checkin[0], kind: 'checkin' });
      } else {
        kind = 'control';
        // tie-break (rule 6, derived): in the slot the backup hands back, the NCS listens
        if (alive && !s.backup.handback) { var a = controlTx(s, 'ncs'); if (a) txs.push(a); }
        if (s.backup.active) { var b = controlTx(s, 'bncs'); if (b) txs.push(b); }
      }
      var outcome = resolve(txs);
      s.called = null;

      if (outcome === 'heard') {
        var tx = txs[0];
        if (kind === 'answer') {
          var st = station(s, tx.who);
          // delivered = heard by a station that keeps a log: the NCS on the air, the active backup, or a backup that
          // copies traffic passively (rule 1). A passive backup without a log hears it but keeps nothing.
          var ncsHears = alive;
          var bHears = s.backup.designated && (s.backup.active || s.backup.logging);
          // T8: a message only the passive backup logged is sent again when the returned NCS calls for it (its own
          // log lacks it); the first delivery slot stays
          if ((ncsHears || bHears) && st.deliveredAt === null) { st.pending = false; st.deliveredAt = n; }
          if (ncsHears) { add(s.ncs.log, st.id); s.ncs.ackDue = st.id; }
          if (bHears) { add(s.backup.log, st.id); s.backup.ackDue = st.id; }
        } else if (kind === 'checkin') {
          var ci = station(s, tx.who);
          ci.checkedIn = n;
          ci.hadTraffic = ci.pending;
          if (!ci.pending) add(s.backup.log, ci.id);      // "no traffic": its message is done
          s.checkin.shift();
          if (!s.checkin.length) { s.checkin = null; s.events.push({ slot: n, code: 'checkin.done' }); }
          if (s.checkin && s.checkin.length === IDS.length - 1) s.events.push({ slot: n, code: 'checkin.rerun' });
        } else {
          applyControl(s, tx, n);
          // (3) the passive backup copies what it heard: the ACK clears its own pending ACK too (done in applyControl)
        }
      } else if (outcome === 'doubled') {
        // two controllers at once: nothing is heard, the called station answers nobody; the later announcer (the
        // backup) hands control back in the next slot (rule 6)
        s.events.push({ slot: n, code: 'ncs.double' });
        if (s.backup.active && alive) s.backup.handback = true;
      }

      // (4) silence counter: slots the NCS has been off the air
      s.ncs.silence = alive ? 0 : s.ncs.silence + 1;

      // (5) takeover check (rule 2), or the net dies without a backup (rule 5)
      if (!alive && !s.backup.active) {
        if (s.backup.designated && s.ncs.silence >= p.wait) s.backup.active = true;
        // rule 5: `wait` is the backup's setting; without one the net is down after the same 60 s (4 slots)
        else if (!s.backup.designated && s.ncs.silence === DEAD_AFTER) s.events.push({ slot: n, code: 'net.dead' });
      }

      s.tx = txs;
      s.channel.push({
        slot: n, kind: kind, outcome: outcome, controller: s.controller,
        tx: txs.map(function (t) { return t.who; }),
        acts: txs.map(function (t) { return { who: t.who, kind: t.kind, target: t.target || null, ack: t.ack || null }; })
      });
      return s;
    },

    /** Slots in the demo: until the last message is delivered (at most 20); a net that never delivers again after the
        failure runs for 15 slots; one still working at 20 stops there. */
    steps: function (p) {
      var s = logic.initial(p), lastDelivery = 0;
      for (var n = 1; n <= MAX_STEPS; n++) {
        s = logic.step(s, n, p);
        if (s.stations.some(function (x) { return x.deliveredAt === n; })) lastDelivery = n;
        if (s.stations.every(function (x) { return !x.pending; })) return n;
      }
      return lastDelivery < p.failAt ? DEAD_STEPS : MAX_STEPS;
    },

    /** Messages delivered so far. */
    delivered: function (s) { return s.stations.filter(function (x) { return !x.pending; }).length; },

    /** Slots in which the channel was idle and doubled, and the longest run of idle slots (in slots). */
    counts: function (s) {
      var idle = 0, doubled = 0, run = 0, gap = 0;
      s.channel.forEach(function (c) {
        if (c.outcome === 'idle') { idle++; run++; gap = Math.max(gap, run); } else run = 0;
        if (c.outcome === 'doubled') doubled++;
      });
      return { idle: idle, doubled: doubled, gap: gap };
    },

    /** Events of slot n. */
    eventsAt: function (s, n) { return s.events.filter(function (e) { return e.slot === n; }).map(function (e) { return e.code; }); }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
