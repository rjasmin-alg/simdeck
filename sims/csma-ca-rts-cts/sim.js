/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for csma-ca-rts-cts: CSMA/CA (DCF) with and without RTS/CTS on the URM book's ch. 17 Primjer 1 line-up.
   Stations A and C each have one data frame for the access point B, which stands between them. A–B and B–C are always
   in range; A–C only when `hidden` is off. Rules and numbers: SPEC.md. Builds on sims/hidden-node (its line-up, its
   "a frame is intact only if heard alone in every slot" reception and its NAV through the ACK); the DCF timer, CW
   doubling and RTS_Threshold are new here. hears(), newFrame() and step 2 (reception) are adapted from
   sims/hidden-node/sim.js @ 84afa5d (`hear` became `hidden`, inverted; DATA length per station); models/ has no
   shared Wi-Fi model yet (NOTES.md, "Shared requests").

   Time runs in slots. RTS, CTS and ACK take one slot; DATA takes `dataA` or `dataC` slots. SIFS is the boundary between
   two slots (a reply starts in the very next slot without listening); DIFS is one idle slot.
   One slot n, in this order:
     1. starts. Replies due in n (CTS after RTS, DATA after CTS, ACK after DATA) and stations whose counter reached 0 at
        the end of n − 1 start sending. A station decides from n − 1 only, so two starts in one slot do not see each other.
     2. reception. A sender hears nothing. Every other party hears each frame on air from a party in range; a frame is
        intact at a listener only if that listener heard it and nothing else in every slot of the frame. Two or more
        frames heard at once is garbage at that listener.
     3. ends. An intact RTS or DATA at B makes B answer (CTS or ACK) in n + 1; an intact CTS makes its station send DATA
        in n + 1; an intact ACK delivers the frame. Every station that decoded an RTS or CTS not addressed to it and not
        its own sets NAV = end + Duration (RTS: CTS + DATA + ACK = size + 2; CTS: DATA + ACK = size + 1).
     4. carrier sense and countdown. A station in DIFS or backoff counts slot n busy if it heard any frame in n or its
        NAV, as it stood at the start of n, covers n. DIFS: an idle slot ends it (counter 0: send in n + 1; else start
        counting). Backoff: an idle slot takes 1 off the counter (0: send in n + 1); a busy slot freezes it and sends the
        station back to DIFS, the counter kept.
     5. timeouts. A sender expects its CTS or ACK in the slot after its frame. If it is not there intact by the end of
        that slot, the attempt failed: CW doubles (15 → 31 → 63 … ≤ 1023), a new counter is drawn from 0 … CW, DIFS.
   Draws: the first counter of each station is a param (backoffA, backoffC); a retry's counter comes from `seed`
   (mulberry32, the kit's generator) so every run replays. The run ends when both frames are delivered, or after
   MAX_SLOTS. One step is one key slot (slot 1, a start, a reply, a timeout, or the DIFS after which a frozen counter
   resumes), not one slot: the slots between fold into it. At most MAX_STEPS key slots are shown.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var CW_MIN = 15;
  var CW_MAX = 1023;
  var MAX_SLOTS = 48;
  var MAX_STEPS = 20;
  var SENDERS = ['A', 'C'];
  var ALL = ['A', 'B', 'C'];

  /** mulberry32, as Simdeck.rng (kit.js): r() in [0, 1). */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** The counter station x draws for attempt k (k ≥ 2: a retry) with contention window cw: 0 … cw. */
  function draw(seed, x, k, cw) {
    var r = rng(seed * 1009 + (x === 'A' ? 1 : 2) * 101 + k * 7);
    r();
    return Math.floor(r() * (cw + 1));
  }

  /** The contention window after `failed` failed attempts: 15, 31, 63, … up to 1023. */
  function cwAfter(failed) {
    var cw = CW_MIN;
    for (var i = 0; i < failed; i++) cw = Math.min(2 * cw + 1, CW_MAX);
    return cw;
  }

  /** Does x hear y? Everyone hears B and B hears everyone; A and C hear each other only when not hidden. */
  function hears(p, x, y) {
    if (x === y) return false;
    if (x === 'B' || y === 'B') return true;
    return !p.hidden;
  }

  /** Duration field, in slots after the frame: RTS covers CTS + DATA + ACK, CTS covers DATA + ACK. */
  function duration(kind, size) {
    if (kind === 'RTS') return size + 2;
    if (kind === 'CTS') return size + 1;
    return 0;
  }

  /** Does a frame of `size` slots go with RTS/CTS? Only with rtscts on and size above RTS_Threshold. */
  function usesRts(p, size) { return !!p.rtscts && size > p.threshold; }

  var defaults = { rtscts: false, hidden: true, threshold: 0, dataA: 4, dataC: 4, backoffA: 2, backoffC: 2, seed: 5 };

  function norm(p) {
    var q = {};
    Object.keys(defaults).forEach(function (k) { q[k] = p && p[k] !== undefined ? p[k] : defaults[k]; });
    return q;
  }

  var cache = { key: null, run: null };

  /** The whole run, slot by slot (see the top of this file). */
  function simulate(p0) {
    var p = norm(p0);
    var key = JSON.stringify(p);
    if (cache.key === key) return cache.run;

    var sta = {};
    SENDERS.forEach(function (x) {
      var size = x === 'A' ? p.dataA : p.dataC;
      sta[x] = {
        phase: 'difs', bo: x === 'A' ? p.backoffA : p.backoffC, cw: CW_MIN, k: 1, nav: 0, size: size,
        rts: usesRts(p, size), sendAt: 0, expect: null, frozen: false, delivered: 0, draws: [x === 'A' ? p.backoffA : p.backoffC]
      };
    });
    var frames = [], pending = [], slots = [], keys = [];
    var lostSlots = 0;

    for (var n = 1; n <= MAX_SLOTS; n++) {
      var ev = [];
      var navAt = {};
      SENDERS.forEach(function (x) { navAt[x] = sta[x].nav; });

      // 1. starts
      pending.filter(function (r) { return r.start === n; }).forEach(function (r) {
        frames.push(newFrame(p, frames.length, r.src, r.dst, r.kind, r.owner, r.k, r.size, n));
        ev.push({ e: 'reply', who: r.src, kind: r.kind, owner: r.owner, dur: duration(r.kind, r.size) });
      });
      pending = pending.filter(function (r) { return r.start !== n; });
      SENDERS.forEach(function (x) {
        var st = sta[x];
        if (st.phase !== 'go' || st.sendAt !== n) return;
        var kind = st.rts ? 'RTS' : 'DATA';
        frames.push(newFrame(p, frames.length, x, 'B', kind, x, st.k, st.size, n));
        st.phase = 'tx';
        ev.push({ e: 'start', who: x, kind: kind, k: st.k, size: st.size, dur: duration(kind, st.size) });
      });

      // 2. reception
      var active = frames.filter(function (f) { return f.start <= n && n <= f.end; });
      var sends = {}, heard = {};
      ALL.forEach(function (l) {
        var mine = active.filter(function (f) { return f.src === l; })[0];
        sends[l] = mine ? { id: mine.id, kind: mine.kind, owner: mine.owner, first: mine.start === n, last: mine.end === n } : null;
        heard[l] = mine ? [] : active.filter(function (f) { return hears(p, l, f.src); }).map(function (f) { return f.src; });
      });
      active.forEach(function (f) {
        ALL.forEach(function (l) {
          if (l !== f.src && f.ok[l] && (sends[l] || heard[l].length !== 1)) f.ok[l] = false;
        });
      });
      var garbled = {};
      ALL.forEach(function (l) { garbled[l] = !sends[l] && heard[l].length > 1; });
      if (garbled.B) {
        lostSlots++;
        if (active.some(function (f) { return f.start === n; })) ev.push({ e: 'collide', from: heard.B.slice() });
      }

      // 3. ends
      frames.filter(function (f) { return f.end === n; }).forEach(function (f) {
        if (f.dst === 'B') {
          sta[f.src].phase = 'await';
          sta[f.src].expect = { kind: f.kind === 'RTS' ? 'CTS' : 'ACK', slot: n + 1 };
        }
        if (f.ok[f.dst]) {
          if (f.dst === 'B') {
            pending.push({ src: 'B', dst: f.src, kind: f.kind === 'RTS' ? 'CTS' : 'ACK', owner: f.owner, k: f.k, size: f.size, start: n + 1 });
          } else if (f.kind === 'CTS') {
            sta[f.dst].phase = 'tx';
            sta[f.dst].expect = null;
            pending.push({ src: f.dst, dst: 'B', kind: 'DATA', owner: f.owner, k: f.k, size: f.size, start: n + 1 });
          } else if (f.kind === 'ACK') {
            sta[f.dst].phase = 'done';
            sta[f.dst].expect = null;
            sta[f.dst].delivered = n;
            ev.push({ e: 'delivered', who: f.dst, k: f.k });
          }
        } else if (f.dst === 'B') {
          ev.push({ e: 'garbled', kind: f.kind, from: f.src, len: f.end - f.start + 1 });
        }
        if (f.kind === 'RTS' || f.kind === 'CTS') {
          SENDERS.forEach(function (l) {
            if (l === f.src || l === f.dst || !f.ok[l]) return;
            var until = n + duration(f.kind, f.size);
            if (until > sta[l].nav) {
              sta[l].nav = until;
              ev.push({ e: 'nav', who: l, kind: f.kind, owner: f.owner, from: f.src, dur: duration(f.kind, f.size), until: until });
            }
          });
        }
      });

      // 4. carrier sense and countdown
      var cells = {};
      SENDERS.forEach(function (x) {
        var st = sta[x];
        var nav = navAt[x] >= n;
        var busy = heard[x].length > 0 || nav;
        if (st.phase === 'difs') {
          if (busy) {
            cells[x] = { k: 'wait', bo: st.bo, nav: nav };
          } else if (st.bo === 0) {
            st.phase = 'go'; st.sendAt = n + 1;
            cells[x] = { k: 'difs', bo: 0 };
            ev.push({ e: 'zero', who: x, after: 'difs' });
          } else {
            st.phase = 'backoff';
            cells[x] = { k: 'difs', bo: st.bo };
            ev.push({ e: 'difs', who: x, bo: st.bo, resume: st.frozen });
            st.frozen = false;
          }
        } else if (st.phase === 'backoff') {
          if (busy) {
            st.phase = 'difs';
            st.frozen = true;
            cells[x] = { k: 'freeze', bo: st.bo, nav: nav };
            ev.push({ e: 'freeze', who: x, bo: st.bo, nav: nav });
          } else {
            st.bo--;
            cells[x] = { k: 'count', bo: st.bo };
            if (st.bo === 0) { st.phase = 'go'; st.sendAt = n + 1; ev.push({ e: 'zero', who: x, after: 'count' }); }
          }
        } else if (st.phase === 'await' && !sends[x]) {
          cells[x] = { k: 'await' };
        } else if (st.phase === 'done' && !sends[x]) {
          cells[x] = { k: nav ? 'navdone' : 'done' };
        } else {
          cells[x] = { k: sends[x] ? 'send' : st.phase };
        }
        if (nav && !sends[x]) cells[x].nav = true;
        // counting down (or passing DIFS) while the other one starts sending, unheard: the hidden node at work
        var o = x === 'A' ? 'C' : 'A';
        if (sends[o] && sends[o].first && !hears(p, x, o) && (cells[x].k === 'count' || cells[x].k === 'difs')) {
          ev.push({ e: 'unheard', who: x, other: o, kind: sends[o].kind });
        }
      });

      // 5. timeouts
      SENDERS.forEach(function (x) {
        var st = sta[x];
        if (st.phase !== 'await' || !st.expect || st.expect.slot !== n) return;
        var failed = st.k;
        st.cw = cwAfter(failed);
        st.k++;
        st.bo = draw(p.seed, x, st.k, st.cw);
        st.draws.push(st.bo);
        st.phase = 'difs';
        st.frozen = false;
        ev.push({ e: 'timeout', who: x, kind: st.expect.kind, k: failed, cw: st.cw, bo: st.bo });
        st.expect = null;
      });

      var snap = {};
      SENDERS.forEach(function (x) {
        var st = sta[x];
        snap[x] = { phase: st.phase, bo: st.bo, cw: st.cw, k: st.k, nav: st.nav, delivered: st.delivered, size: st.size, rts: st.rts };
      });
      slots.push({ n: n, sends: sends, heard: heard, garbled: garbled, cells: cells, sta: snap, events: ev, lostSlots: lostSlots });

      var key2 = n === 1 || ev.some(function (e) { return e.e === 'start' || e.e === 'reply' || e.e === 'timeout' || (e.e === 'difs' && e.resume); });
      var over = sta.A.phase === 'done' && sta.C.phase === 'done';
      if (key2 || over || n === MAX_SLOTS) keys.push(n);
      if (over) break;
    }

    var first = {};
    SENDERS.forEach(function (x) {
      var size = x === 'A' ? p.dataA : p.dataC;
      first[x] = { phase: 'difs', bo: x === 'A' ? p.backoffA : p.backoffC, cw: CW_MIN, k: 1, nav: 0, delivered: 0, size: size, rts: usesRts(p, size) };
    });
    var run = {
      slots: slots,
      keys: keys.slice(0, MAX_STEPS),
      total: slots.length,
      finished: sta.A.phase === 'done' && sta.C.phase === 'done',
      frames: frames.map(function (f) { return { id: f.id, src: f.src, dst: f.dst, kind: f.kind, owner: f.owner, k: f.k, start: f.start, end: f.end, ok: f.ok[f.dst] }; }),
      first: first,
      draws: { A: sta.A.draws, C: sta.C.draws }
    };
    cache = { key: key, run: run };
    return run;
  }

  function newFrame(p, id, src, dst, kind, owner, k, size, n) {
    var ok = {};
    ALL.forEach(function (l) { ok[l] = hears(p, l, src); });
    var len = kind === 'DATA' ? size : 1;
    return { id: id, src: src, dst: dst, kind: kind, owner: owner, k: k, size: size, start: n, end: n + len - 1, ok: ok };
  }

  /** The state after step `step` (0 = before slot 1): the run up to its step-th key slot. */
  function view(p, step) {
    var run = simulate(p);
    var t = step === 0 ? 0 : run.keys[Math.min(step, run.keys.length) - 1];
    var from = step <= 1 ? 0 : run.keys[step - 2];
    var events = [];
    for (var i = from; i < t; i++) {
      run.slots[i].events.forEach(function (e) { events.push(Object.assign({ n: i + 1 }, e)); });
    }
    var shown = run.slots.slice(0, t);
    return {
      step: step,
      t: t,
      from: from,
      total: run.total,
      last: step === run.keys.length,
      finished: run.finished && t === run.total,
      slots: shown,
      frames: run.frames.filter(function (f) { return f.start <= t; }).map(function (f) {
        return { id: f.id, src: f.src, dst: f.dst, kind: f.kind, owner: f.owner, k: f.k, start: f.start, end: f.end, ok: f.end <= t ? f.ok : null };
      }),
      sta: t === 0 ? run.first : run.slots[t - 1].sta,
      lostSlots: t === 0 ? 0 : run.slots[t - 1].lostSlots,
      events: events
    };
  }

  var logic = {
    /** The book's Primjer 1 without RTS/CTS: A and C hidden from each other, both draw 2. */
    defaults: defaults,

    /** One step per key slot; 8 for the defaults (sim.json). */
    steps: function (p) { return simulate(p).keys.length; },

    initial: function (p) { return view(p, 0); },

    /** Step n replays the run from its start, so a param change recomputes at the same step. */
    step: function (s, n, p) { return view(p, n); },

    simulate: simulate,
    view: view,
    hears: hears,
    duration: duration,
    usesRts: usesRts,
    cwAfter: cwAfter,
    draw: draw,
    rng: rng,
    cwMin: CW_MIN,
    cwMax: CW_MAX,
    maxSlots: MAX_SLOTS,
    maxSteps: MAX_STEPS
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
