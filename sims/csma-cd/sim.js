/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for csma-cd: two to four stations share one half-duplex bus. One step is one slot time: stations with a frame
   ready sense the bus, those that find it idle send, two or more senders collide, every colliding sender jams and
   draws a random backoff k from 0 … 2^min(n,10) − 1, and waiting stations count their backoff down. In full duplex
   each end has its own path and nothing ever collides. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Random draws come from a scene's scripted
   list or from a hash of (seed, station, frame, attempt), so every run replays.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var IDS = ['A', 'B', 'C', 'D'];
  /** No run is longer than this many slots (contract: a stepper has at most 20 steps). */
  var MAX_SLOTS = 20;
  /** IEEE 802.3 attemptLimit: after the 16th collision of a frame it is dropped (rule 5). */
  var ATTEMPT_LIMIT = 16;
  /** IEEE 802.3 backoffLimit: the range stops doubling after the 10th collision (rule 4). */
  var BACKOFF_LIMIT = 10;

  /**
   * The presets' scenes: the slot each station (A–D) gets its frame in, and the scripted draws per station, indexed by
   * the collision count n − 1 of its first frame. A draw that is not scripted comes from the seed.
   */
  var SCENES = {
    'two-collide': { arrive: [1, 1, 1, 1], draws: { A: [0], B: [1] } },
    'same-draw': { arrive: [1, 1, 1, 1], draws: { A: [1, 3], B: [1, 0] } },
    'wait-then-crash': { arrive: [2, 2, 1, 2], draws: { A: [0], B: [1] } },
    'three-stations': { arrive: [1, 1, 1, 1], draws: { A: [0], B: [1, 2], C: [1, 0] } },
    'full-duplex': { arrive: [1, 1, 1, 1], draws: {} }
  };

  // ── pure helpers, promotable to models/ unchanged ──

  /** Rule 4: after the n-th collision k is drawn from 0 … 2^min(n, 10) − 1; this is that range's size. */
  function range(n) { return Math.pow(2, Math.min(n, BACKOFF_LIMIT)); }

  /** mulberry32, one output for a 32-bit seed: [0, 1). */
  function unit(a) {
    a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** A seeded draw for station i, its frame f, collision n: the same inputs always give the same k. */
  function seededDraw(seed, i, f, n) {
    var a = unit(seed * 7919 + 1);
    a = unit(Math.floor(a * 4294967296) ^ (i * 977 + f * 131 + n * 17));
    return Math.floor(a * range(n));
  }

  /** k for station i after its n-th collision: the scripted draw (first frame only) if there is one, else the seed's. */
  function drawFor(cfg, i, f, n) {
    var list = cfg.stations[i].draws;
    if (f === 0 && list && list[n - 1] != null) return list[n - 1] % range(n);
    return seededDraw(cfg.seed, i, f, n);
  }

  // ── the run: cfg = { duplex, frameSlots, seed, maxSlots, stations: [{ id, arrive, frames, draws }] } ──

  function begin(cfg) {
    return {
      slot: 0,
      duplex: cfg.duplex,
      medium: 'idle',
      tx: [],
      stations: cfg.stations.map(function (c) {
        return {
          id: c.id, queued: c.frames, phase: c.arrive <= 1 ? 'ready' : 'idle', attempt: 0, backoffLeft: 0,
          k: null, range: null, sentSlots: 0, frame: 0, delivered: 0, gaveUp: 0
        };
      }),
      columns: [],
      collisions: 0,
      log: [],
      done: false
    };
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** All frames delivered or dropped and nothing on the medium. */
  function finished(s) {
    return s.tx.length === 0 && s.stations.every(function (x) { return x.queued === 0; });
  }

  /** Rule 6: a delivered frame resets n; the next frame (if any) starts fresh. */
  function deliver(x, log, t) {
    x.delivered++;
    x.queued--;
    x.frame++;
    x.attempt = 0;
    x.k = null;
    x.range = null;
    x.sentSlots = 0;
    x.phase = x.queued > 0 ? 'ready' : 'done';
    log.push({ code: 'deliver', ids: [x.id] });
  }

  /** One slot in half duplex: phases (1)–(5) of SPEC.md in that order. */
  function slotHalf(s, cfg, t) {
    var st = s.stations, log = [], marks = st.map(function () { return null; });
    var carrier = s.tx.length ? s.tx[0] : null;
    var byId = function (id) { return IDS.indexOf(id); };

    // late arrivals: a frame appears in this slot
    var arrived = [];
    st.forEach(function (x, i) {
      if (x.phase === 'idle' && x.queued > 0 && cfg.stations[i].arrive === t) arrived.push(x.id);
    });
    if (arrived.length && t > 1) log.push({ code: 'arrive', ids: arrived });

    // stations already counting down at the start of the slot (they do not sense in it)
    var waiting = [];
    st.forEach(function (x, i) { if (x.queued > 0 && x.backoffLeft > 0) waiting.push(i); });

    // (1) sense: a frame ready, no backoff left, not the one sending
    var senders = [], deferred = [];
    st.forEach(function (x, i) {
      if (x.queued === 0 || x.backoffLeft > 0 || cfg.stations[i].arrive > t) return;
      if (carrier && carrier.id === x.id) return;
      if (carrier) { deferred.push(i); return; }
      senders.push(i);
    });
    deferred.forEach(function (i) { st[i].phase = 'defer'; marks[i] = { m: 'defer' }; });
    if (deferred.length) log.push({ code: 'defer', ids: deferred.map(function (i) { return st[i].id; }), by: carrier.id });

    var medium, tx = [], senderIds = [];
    if (carrier) {
      // the frame on the bus goes on; nobody else started
      var ci = byId(carrier.id), cx = st[ci];
      cx.sentSlots++;
      medium = 'busy';
      senderIds = [cx.id];
      marks[ci] = { m: 'send', v: cx.sentSlots, end: cx.sentSlots === cfg.frameSlots };
      if (cx.sentSlots === cfg.frameSlots) deliver(cx, log, t);
      else { cx.phase = 'send'; tx = [{ id: cx.id }]; log.push({ code: 'continue', ids: [cx.id], v: cx.sentSlots }); }
    } else if (senders.length === 0) {
      medium = 'idle';
    } else if (senders.length === 1) {
      // (2)–(3) one sender: the bus is busy with its frame
      var si = senders[0], sx = st[si];
      sx.sentSlots = 1;
      medium = 'busy';
      senderIds = [sx.id];
      log.push({ code: 'start', ids: [sx.id] });
      marks[si] = { m: 'send', v: 1, end: cfg.frameSlots === 1 };
      if (cfg.frameSlots === 1) deliver(sx, log, t);
      else { sx.phase = 'send'; tx = [{ id: sx.id }]; }
    } else {
      // (3)–(4) two or more senders: collision; each jams, counts it and draws k (rule 4) or gives up (rule 5)
      medium = 'collision';
      s.collisions++;
      senderIds = senders.map(function (i) { return st[i].id; });
      var draws = [], dropped = [];
      senders.forEach(function (i) {
        var x = st[i];
        x.attempt++;
        x.sentSlots = 0;
        if (x.attempt >= ATTEMPT_LIMIT) {
          x.gaveUp++;
          x.queued--;
          x.frame++;
          x.attempt = 0;
          x.k = null;
          x.range = null;
          x.backoffLeft = 0;
          x.phase = x.queued > 0 ? 'ready' : 'gaveUp';
          marks[i] = { m: 'drop' };
          dropped.push(x.id);
          return;
        }
        x.range = range(x.attempt);
        x.k = drawFor(cfg, i, x.frame, x.attempt);
        x.backoffLeft = x.k;
        x.phase = 'jam';
        marks[i] = { m: 'jam' };
        draws.push({ id: x.id, n: x.attempt, range: x.range, k: x.k });
      });
      log.push({ code: 'collision', ids: senderIds, draws: draws });
      if (dropped.length) log.push({ code: 'drop', ids: dropped });
    }

    // (5) stations that were waiting count down one slot
    var counting = [];
    waiting.forEach(function (i) {
      var x = st[i];
      marks[i] = { m: 'wait', v: x.backoffLeft };
      x.backoffLeft--;
      x.phase = 'backoff';
      counting.push({ id: x.id, left: x.backoffLeft });
    });
    if (counting.length) log.push({ code: 'wait', ids: counting.map(function (c) { return c.id; }), left: counting.map(function (c) { return c.left; }) });
    if (medium === 'idle' && !counting.length) log.push({ code: 'idle', ids: [] });

    st.forEach(function (x, i) {
      if (marks[i]) return;
      if (x.phase === 'done' || x.phase === 'gaveUp') marks[i] = { m: 'over' };
    });
    return { medium: medium, tx: tx, senders: senderIds, marks: marks, log: log };
  }

  /** One slot in full duplex (rule 8): each end sends on its own path whenever it has a frame; no contention. */
  function slotFull(s, cfg, t) {
    var st = s.stations, log = [], marks = st.map(function () { return null; }), tx = [], senderIds = [];
    var started = [];
    st.forEach(function (x, i) {
      if (x.queued === 0 || cfg.stations[i].arrive > t) {
        if (x.phase === 'done') marks[i] = { m: 'over' };
        return;
      }
      if (x.sentSlots === 0) started.push(x.id);
      x.sentSlots++;
      senderIds.push(x.id);
      marks[i] = { m: 'send', v: x.sentSlots, end: x.sentSlots === cfg.frameSlots };
      if (x.sentSlots === cfg.frameSlots) deliver(x, log, t);
      else { x.phase = 'send'; tx.push({ id: x.id }); }
    });
    if (started.length) log.unshift({ code: 'fullStart', ids: started });
    if (!senderIds.length) log.push({ code: 'idle', ids: [] });
    return { medium: senderIds.length ? 'busy' : 'idle', tx: tx, senders: senderIds, marks: marks, log: log };
  }

  /** The state after one more slot. */
  function advance(prev, cfg) {
    var s = clone(prev), t = s.slot + 1;
    var r = cfg.duplex === 'full' ? slotFull(s, cfg, t) : slotHalf(s, cfg, t);
    s.slot = t;
    s.medium = r.medium;
    s.tx = r.tx;
    s.log = r.log;
    s.columns.push({ slot: t, medium: r.medium, senders: r.senders, marks: r.marks });
    s.done = finished(s);
    return s;
  }

  /** Slots until every frame is delivered or dropped, at most cfg.maxSlots. */
  function runLength(cfg) {
    var s = begin(cfg), n = 0;
    while (!s.done && n < cfg.maxSlots) { s = advance(s, cfg); n++; }
    return n;
  }

  /** The page's params as a run: the scene gives arrivals and scripted draws; full duplex joins exactly two ends. */
  function cfgOf(p) {
    var scene = SCENES[p.scene] || SCENES['two-collide'];
    var count = p.duplex === 'full' ? 2 : Math.max(2, Math.min(4, p.stations | 0));
    var stations = [];
    for (var i = 0; i < count; i++) {
      stations.push({
        id: IDS[i], arrive: scene.arrive[i], frames: 1,
        draws: p.seed ? null : (scene.draws[IDS[i]] || null)
      });
    }
    return { duplex: p.duplex, frameSlots: p.frameSlots, seed: p.seed, maxSlots: MAX_SLOTS, stations: stations };
  }

  var stepsCache = {};

  var logic = {
    IDS: IDS,
    MAX_SLOTS: MAX_SLOTS,
    ATTEMPT_LIMIT: ATTEMPT_LIMIT,
    BACKOFF_LIMIT: BACKOFF_LIMIT,
    SCENES: SCENES,

    /** scene: a preset's arrivals and scripted draws; seed 0 uses the script, 1–99 draws every k from that seed. */
    defaults: { scene: 'two-collide', stations: 2, duplex: 'half', seed: 0, frameSlots: 2 },

    /** One step per slot, until every frame is through (at most MAX_SLOTS). */
    steps: function (p) {
      var key = JSON.stringify(cfgOf(p));
      if (stepsCache[key] == null) stepsCache[key] = runLength(cfgOf(p));
      return stepsCache[key];
    },

    initial: function (p) { return begin(cfgOf(p)); },

    step: function (s, n, p) { return advance(s, cfgOf(p)); },

    range: range,
    seededDraw: seededDraw,
    drawFor: drawFor,
    begin: begin,
    advance: advance,
    runLength: runLength,
    cfgOf: cfgOf,
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
