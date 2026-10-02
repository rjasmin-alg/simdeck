/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for hidden-node: two stations, A and C, both in range of the access point B, out of range of each other,
   each with one data frame for B (URM book ch. 17, Primjer 1). Time runs in slots; one step = one slot.
   Who hears whom: A–B and B–C always; A–C only with `hear` (the "they hear each other" comparison).
   Frames: RTS, CTS and ACK take one slot, DATA takes DATA_LEN slots.
   One slot, in this order:
     1. starts. A response (CTS after RTS, DATA after CTS, ACK after DATA) starts in the slot right after the frame it
        answers, without listening first (the short gap, SIFS). A new attempt (RTS with `rts`, DATA without) starts in
        slot n only if n ≥ the station's ready slot, its NAV has ended (nav < n), and in slot n − 1 it heard nothing and
        was not sending itself (the longer gap, DIFS). Both stations decide from slot n − 1 only, so two starts in one
        slot do not see each other.
     2. reception. A station that is sending hears nothing. Otherwise it hears every frame on air from a station in
        range; a frame reaches a listener intact only if in every slot of the frame that listener heard it and nothing
        else. Two or more frames heard at once at B is a collision.
     3. ends. An intact RTS or DATA at B schedules B's CTS or ACK for the next slot; an intact CTS schedules the
        sender's DATA; an intact ACK delivers the frame. An intact RTS or CTS overheard by the other station sets its
        NAV to the end of the exchange's ACK (RTS at slot r: r + DATA_LEN + 2; CTS at slot s: s + DATA_LEN + 1).
     4. timeouts. A sender expects the CTS or ACK in the slot after its frame; if it did not arrive intact, the
        attempt failed and the station is ready again after a wait: ready = n + 1 + BACKOFF[x][attempt − 1].
   The waits are fixed (A: 1 then 3, C: 1 then 5) so every run is the same; a real station draws them at random from
   a range that doubles after each failure (NOTES.md). No noise: every loss is a collision or a deaf receiver.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var DATA_LEN = 3;
  var STEPS = 16;
  var READY = { A: 1, C: 3 };            // A has its frame from slot 1, C from slot 3, while A is sending
  var BACKOFF = { A: [1, 3], C: [1, 5] };
  var SENDERS = ['A', 'C'];
  var ALL = ['A', 'B', 'C'];

  /** Does x hear y? A and C hear B and B hears both; A and C hear each other only with `hear`. */
  function hears(p, x, y) {
    if (x === y) return false;
    if (x === 'B' || y === 'B') return true;
    return !!p.hear;
  }

  /** The slot up to which an overheard RTS or CTS that ended in slot `end` reserves the medium (through the ACK). */
  function navUntil(kind, end) {
    return kind === 'RTS' ? end + 1 + DATA_LEN + 1 : end + DATA_LEN + 1;
  }

  /** The wait after failed attempt `failed` (1, 2, …); past the list, the last value. */
  function backoff(x, failed) {
    var b = BACKOFF[x];
    return b[Math.min(failed, b.length) - 1];
  }

  function lenOf(kind) { return kind === 'DATA' ? DATA_LEN : 1; }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function newTx(p, id, src, dst, kind, owner, k, n) {
    var ok = {};
    ALL.forEach(function (l) { ok[l] = hears(p, l, src); });
    return { id: id, src: src, dst: dst, kind: kind, owner: owner, k: k, start: n, end: n + lenOf(kind) - 1, ok: ok };
  }

  var logic = {
    /** The book's Primjer 1: A and C do not hear each other, no RTS/CTS. */
    defaults: { rts: false, hear: false },

    steps: STEPS,
    dataLen: DATA_LEN,
    ready: READY,
    backoffs: BACKOFF,

    initial: function () {
      var sta = {};
      SENDERS.forEach(function (x) {
        sta[x] = { phase: 'wait', ready: READY[x], attempt: 1, nav: 0, expect: null, delivered: 0 };
      });
      return { n: 0, sta: sta, tx: [], pending: [], slots: [], collisions: 0, lost: 0, events: [] };
    },

    /** One slot: starts, reception, ends, timeouts (see the top of this file). */
    step: function (s0, n, p) {
      var s = clone(s0);
      var ev = [];
      var prev = s.slots[n - 2] || null;    // slot n − 1, null before slot 1 (idle)

      // 1. starts: responses first (they need no listening), then new attempts decided from slot n − 1
      var nextId = s.tx.length;
      s.pending.filter(function (r) { return r.start === n; }).forEach(function (r) {
        s.tx.push(newTx(p, nextId++, r.src, r.dst, r.kind, r.owner, r.k, n));
        ev.push({ e: 'reply', who: r.src, kind: r.kind, owner: r.owner });
      });
      s.pending = s.pending.filter(function (r) { return r.start !== n; });
      SENDERS.forEach(function (x) {
        var st = s.sta[x];
        if (st.phase !== 'wait' || n < st.ready) return;
        if (st.nav >= n) { ev.push({ e: 'defer', who: x, why: 'nav', until: st.nav }); return; }
        if (prev && (prev.sends[x] || prev.heard[x].length)) { ev.push({ e: 'defer', who: x, why: 'busy' }); return; }
        var kind = p.rts ? 'RTS' : 'DATA';
        s.tx.push(newTx(p, nextId++, x, 'B', kind, x, st.attempt, n));
        st.phase = 'send';
        ev.push({ e: 'start', who: x, kind: kind, k: st.attempt });
      });

      // 2. reception in slot n
      var active = s.tx.filter(function (f) { return f.start <= n && n <= f.end; });
      var sends = {}, heard = {};
      ALL.forEach(function (l) {
        var mine = active.filter(function (f) { return f.src === l; })[0];
        sends[l] = mine ? { id: mine.id, kind: mine.kind, owner: mine.owner, k: mine.k, first: mine.start === n } : null;
        heard[l] = mine ? [] : active.filter(function (f) { return hears(p, l, f.src); }).map(function (f) { return f.src; });
      });
      active.forEach(function (f) {
        ALL.forEach(function (l) {
          if (l !== f.src && f.ok[l] && (sends[l] || heard[l].length !== 1)) f.ok[l] = false;
        });
      });
      var collide = !sends.B && heard.B.length > 1;
      if (collide) {
        s.collisions++;
        ev.push({ e: 'collide', from: heard.B.slice() });
      }

      // NAV in force during slot n: set before this slot (a NAV set by a frame ending now counts from the next slot)
      var nav = {};
      SENDERS.forEach(function (x) { nav[x] = s.sta[x].nav >= n && !sends[x]; });

      // 3. ends
      s.tx.filter(function (f) { return f.end === n; }).forEach(function (f) {
        if (f.dst === 'B') {
          s.sta[f.src].phase = 'await';
          s.sta[f.src].expect = { kind: f.kind === 'RTS' ? 'CTS' : 'ACK', slot: n + 1 };
        }
        if (f.ok[f.dst]) {
          if (f.dst === 'B') {
            s.pending.push({ src: 'B', dst: f.src, kind: f.kind === 'RTS' ? 'CTS' : 'ACK', owner: f.owner, k: f.k, start: n + 1 });
            ev.push({ e: 'recv', kind: f.kind, from: f.src });
          } else if (f.kind === 'CTS') {
            s.sta[f.dst].phase = 'send';
            s.sta[f.dst].expect = null;
            s.pending.push({ src: f.dst, dst: 'B', kind: 'DATA', owner: f.owner, k: f.k, start: n + 1 });
          } else if (f.kind === 'ACK') {
            s.sta[f.dst].phase = 'done';
            s.sta[f.dst].expect = null;
            s.sta[f.dst].delivered = n;
            ev.push({ e: 'delivered', who: f.dst, k: f.k });
          }
        } else if (f.dst === 'B') {
          s.lost++;
          ev.push({ e: 'lost', kind: f.kind, from: f.src });
        }
        if (f.kind === 'RTS' || f.kind === 'CTS') {
          SENDERS.forEach(function (l) {
            if (l === f.src || l === f.dst || !f.ok[l]) return;
            var until = navUntil(f.kind, n);
            if (until > s.sta[l].nav) {
              s.sta[l].nav = until;
              ev.push({ e: 'nav', who: l, kind: f.kind, owner: f.owner, until: until });
            }
          });
        }
      });

      // 4. timeouts: the expected CTS or ACK did not arrive intact in slot n
      SENDERS.forEach(function (x) {
        var st = s.sta[x];
        if (st.phase !== 'await' || !st.expect || st.expect.slot !== n) return;
        var wait = backoff(x, st.attempt);
        ev.push({ e: 'timeout', who: x, kind: st.expect.kind, k: st.attempt, wait: wait, ready: n + 1 + wait });
        st.phase = 'wait';
        st.ready = n + 1 + wait;
        st.attempt++;
        st.expect = null;
      });

      s.slots.push({ sends: sends, heard: heard, collide: collide, nav: nav });
      s.n = n;
      s.events = ev;
      return s;
    },

    hears: hears,
    navUntil: navUntil,
    backoff: backoff
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
