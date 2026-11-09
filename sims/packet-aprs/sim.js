/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for packet-aprs: APRS beacons on one shared 144.800 MHz channel, digipeaters that answer the path aliases
   WIDE1-1 and WIDEn-N, duplicate suppression, and carrier sense (CSMA) that cannot help hidden stations.
   One step = one time slot; a packet is on the air for 2 slots. Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var AIRTIME = 2;        // slots per packet (≈ 0.5 s at 1200 bit/s, illustrative)
  var MAX_PATH = 8;       // APRS Protocol Reference 1.0.1: 0-8 digipeater addresses after source and destination (check)
  var DUPE_SLOTS = 120;   // 30 s of duplicate memory at 0.25 s per slot: longer than any demo
  var MAX_SLOTS = 20;     // the longest run a page shows (contract: about 20 steps)
  var MAX_EXTRA = 4;      // extra beacons the button may add

  var PATHS = {
    w1w2: [['WIDE1', 1, 1], ['WIDE2', 2, 1]],
    w22: [['WIDE2', 2, 2]],
    w77: [['WIDE7', 7, 7]],
    none: []
  };

  // Scenes: positions in a 100 × 44 box, ranges in the same units. Two stations are in range of each other when
  // their distance is at most the smaller of their two ranges (links are symmetric). beacons: [station, readyAt].
  function st(id, kind, x, y, range) { return { id: id, kind: kind, x: x, y: y, range: range }; }
  var SCENES = {
    'two-hops': {
      min: 6,
      stations: [st('T1', 'tracker', 8, 30, 26), st('D1', 'fill-in', 30, 22, 30), st('D2', 'wide', 56, 18, 34), st('R', 'igate', 84, 24, 32)],
      beacons: [['T1', 1]]
    },
    'two-wides': {
      min: 6,
      stations: [st('T1', 'tracker', 8, 22, 25), st('D1', 'fill-in', 30, 22, 30), st('D2', 'wide', 52, 5, 30), st('D3', 'wide', 52, 39, 30), st('R', 'igate', 74, 22, 30)],
      beacons: [['T1', 1]]
    },
    wide7: {
      min: 6,
      stations: [st('T1', 'tracker', 6, 20, 20), st('D1', 'wide', 22, 28, 20), st('D2', 'wide', 38, 20, 20), st('D3', 'wide', 54, 28, 20),
        st('D4', 'wide', 70, 20, 20), st('D5', 'wide', 86, 28, 20), st('R', 'igate', 38, 5, 20)],
      beacons: [['T1', 1]]
    },
    csma: {
      min: 4,
      stations: [st('T1', 'tracker', 28, 34, 32), st('T2', 'tracker', 58, 34, 32), st('R', 'igate', 43, 10, 32)],
      beacons: [['T1', 1], ['T2', 2]]
    },
    hidden: {
      min: 3,
      stations: [st('T1', 'tracker', 10, 24, 34), st('D1', 'fill-in', 42, 24, 34), st('T2', 'tracker', 74, 24, 34), st('R', 'igate', 42, 6, 30)],
      beacons: [['T1', 1], ['T2', 1]]
    }
  };

  function inRange(a, b) {
    if (a.id === b.id) return false;
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) <= Math.min(a.range, b.range);
  }

  function aliasesOf(kind) {
    if (kind === 'fill-in') return ['WIDE1-1'];
    if (kind === 'wide') return ['WIDE1-1', 'WIDEn-N'];
    return [];
  }

  /** Rule 2: does a digipeater of this kind answer this path element? */
  function answers(kind, el) {
    if (!el || el.used || el.n == null || el.N < 1) return false;
    if (kind === 'fill-in') return el.n === 1 && el.N === 1;
    if (kind === 'wide') return el.n >= 1 && el.n <= 7 && el.N >= 1 && el.N <= el.n;
    return false;
  }

  /** Rule 1: a station digipeats only for the first unused element (-1: none left). */
  function firstUnused(path) {
    for (var i = 0; i < path.length; i++) if (!path[i].used) return i;
    return -1;
  }

  /** Rule 3: the path after digipeater `call` handles element i. Returns { path, changed: [indices in new path] }. */
  function digipeat(path, i, call) {
    var el = path[i];
    var out = path.slice(0, i).map(function (e) { return Object.assign({}, e); });
    var changed = [];
    if (path.length < MAX_PATH) { changed.push(out.length); out.push({ call: call, used: true }); }
    var N = el.N - 1;
    changed.push(out.length);
    out.push({ call: el.call, n: el.n, N: N, used: N === 0 });
    for (var k = i + 1; k < path.length; k++) out.push(Object.assign({}, path[k]));
    return { path: out, changed: changed };
  }

  /** Text form of one path element: a call sign, WIDEn-N, or WIDEn* once used up. */
  function elText(e) {
    if (e.n == null) return e.call;
    return e.used ? e.call + '*' : e.call + '-' + e.N;
  }
  function frameText(pkt) {
    return pkt.src + '>' + pkt.dest + (pkt.path.length ? ',' + pkt.path.map(elText).join(',') : '') + ':' + pkt.info;
  }

  function pathOf(choice) {
    return (PATHS[choice] || []).map(function (a) { return { call: a[0], n: a[1], N: a[2], used: false }; });
  }

  /** Extra beacons from the button: '4.9' → [4, 9] (slots at which T1 queues one more). */
  function extraOf(p) {
    return String(p.extra || '').split('.').filter(Boolean).map(Number)
      .filter(function (n) { return n >= 1 && n <= MAX_SLOTS && Math.floor(n) === n; }).slice(0, MAX_EXTRA);
  }

  /** Rule 4: was this packet (same source, destination, info) already sent or heard digipeated here? */
  function isDupe(heard, key, slot) {
    return heard.some(function (h) { return h.key === key && (h.how === 'sent' || h.how === 'digi') && slot - h.slot < DUPE_SLOTS; });
  }

  function keyOf(pkt) { return pkt.src + '>' + pkt.dest + ':' + pkt.info; }

  function initial(p) {
    var scene = SCENES[p.topology] || SCENES['two-hops'];
    var s = {
      slot: 0,
      stations: scene.stations.map(function (x) {
        return { id: x.id, kind: x.kind, x: x.x, y: x.y, range: x.range, aliases: aliasesOf(x.kind), queue: [], heard: [] };
      }),
      packets: [],
      air: [],
      log: [],
      timeline: [],
      delivered: [],
      seq: {}
    };
    var beacons = scene.beacons.slice();
    extraOf(p).forEach(function (n) { beacons.push(['T1', n]); });
    // number each tracker's beacons in time order (stable: scene beacons before extra ones at the same slot)
    beacons.map(function (b, i) { return { b: b, i: i }; })
      .sort(function (x, y) { return x.b[1] - y.b[1] || x.i - y.i; })
      .forEach(function (x) { newBeacon(s, x.b[0], x.b[1], p); });
    return s;
  }

  function newBeacon(s, src, readyAt, p) {
    var seq = (s.seq[src] || 0) + 1;
    s.seq[src] = seq;
    var pkt = { id: s.packets.length + 1, src: src, dest: 'APRS', path: pathOf(p.path), info: '>' + seq, seq: seq, from: src, parent: 0, changed: [] };
    s.packets.push(pkt);
    var sta = s.stations.filter(function (x) { return x.id === src; })[0];
    sta.queue.push({ pkt: pkt.id, readyAt: readyAt });
    sta.queue.sort(function (a, b) { return a.readyAt - b.readyAt || a.pkt - b.pkt; });
  }

  function step(prev, n, p) {
    var s = JSON.parse(JSON.stringify(prev));
    s.slot = n;
    var byId = {};
    s.stations.forEach(function (x) { byId[x.id] = x; });
    var pk = function (id) { return s.packets[id - 1]; };
    var events = [];
    function log(e) { e.slot = n; events.push(e); }

    // transmissions still on the air in this slot (started in the previous one)
    var ongoing = s.air.filter(function (a) { return a.start === n - 1; });

    // (1) carrier sense and starts, decided from the previous slot only: starts in this slot are simultaneous
    var starts = [];
    s.stations.forEach(function (x) {
      if (!x.queue.length || x.queue[0].readyAt > n) return;
      if (ongoing.some(function (a) { return a.station === x.id; })) return;
      if (p.csma) {
        var busy = ongoing.filter(function (a) { return inRange(byId[a.station], x); });
        if (busy.length) { log({ event: 'defer', station: x.id, pktId: x.queue[0].pkt, by: busy[0].station }); return; }
      }
      starts.push(x);
    });
    var air = ongoing.slice();
    starts.forEach(function (x) {
      var q = x.queue.shift();
      air.push({ station: x.id, pktId: q.pkt, start: n });
      x.heard.push({ key: keyOf(pk(q.pkt)), slot: n, how: 'sent' });
      log({ event: 'tx', station: x.id, pktId: q.pkt });
    });
    s.air = air;

    // the strip: who is on the air, and does any listener hear two of them at once
    var clash = s.stations.some(function (r) {
      if (air.some(function (a) { return a.station === r.id; })) return false;
      return air.filter(function (a) { return inRange(byId[a.station], r); }).length > 1;
    });
    s.timeline.push({ slot: n, air: air.map(function (a) { return { station: a.station, pktId: a.pktId, start: a.start }; }), clash: clash });

    // (2) reception at the end of each packet's last slot
    var ending = air.filter(function (a) { return a.start === n - AIRTIME + 1; });
    var spans = s.timeline.slice(-AIRTIME); // this slot and the one before
    var received = [];
    ending.forEach(function (a) {
      var src = byId[a.station];
      s.stations.forEach(function (r) {
        if (!inRange(src, r)) return;
        var listens = r.kind !== 'tracker';
        var deaf = spans.some(function (sl) { return sl.air.some(function (o) { return o.station === r.id; }); });
        if (deaf) { if (listens) log({ event: 'busy', station: r.id, pktId: a.pktId, from: a.station }); return; }
        var other = [];
        spans.forEach(function (sl) {
          sl.air.forEach(function (o) {
            if (o.station !== a.station && inRange(byId[o.station], r) && other.indexOf(o.station) < 0) other.push(o.station);
          });
        });
        if (other.length) { if (listens) log({ event: 'collision', station: r.id, pktId: a.pktId, from: a.station, with: other }); return; }
        if (listens) { log({ event: 'rx', station: r.id, pktId: a.pktId, from: a.station }); received.push({ r: r, pkt: pk(a.pktId) }); }
      });
    });

    // (3) digipeaters apply the path rules; (4) the iGate records what it got
    received.forEach(function (rc) {
      var r = rc.r, pkt = rc.pkt, key = keyOf(pkt);
      var digipeated = pkt.path.some(function (e) { return e.used; });
      if (r.kind === 'igate') {
        if (!s.delivered.some(function (d) { return keyOf(pk(d.pktId)) === key; })) {
          s.delivered.push({ pktId: pkt.id, slot: n });
          log({ event: 'deliver', station: r.id, pktId: pkt.id });
        }
        return;
      }
      if (isDupe(r.heard, key, n)) {
        var sent = r.heard.some(function (h) { return h.key === key && h.how === 'sent'; });
        log({ event: 'dupe', station: r.id, pktId: pkt.id, from: pkt.from, why: sent ? 'sent' : 'heard' });
      } else {
        var i = firstUnused(pkt.path);
        if (i >= 0 && answers(r.kind, pkt.path[i])) {
          var d = digipeat(pkt.path, i, r.id);
          var copy = { id: s.packets.length + 1, src: pkt.src, dest: pkt.dest, path: d.path, info: pkt.info, seq: pkt.seq,
            from: r.id, parent: pkt.id, changed: d.changed };
          s.packets.push(copy);
          r.queue.push({ pkt: copy.id, readyAt: n + 1 });
          log({ event: 'queue', station: r.id, pktId: copy.id, parent: pkt.id, el: i });
        } else {
          log({ event: 'skip', station: r.id, pktId: pkt.id, el: i });
        }
      }
      r.heard.push({ key: key, slot: n, how: digipeated ? 'digi' : 'orig' });
    });

    s.air = air.filter(function (a) { return a.start > n - AIRTIME + 1; });
    s.log = s.log.concat(events);
    return s;
  }

  /** The whole run to MAX_SLOTS (for the step count). */
  function run(p) {
    var s = initial(p), out = [s];
    for (var n = 1; n <= MAX_SLOTS; n++) { s = step(s, n, p); out.push(s); }
    return out;
  }

  /** Did the 20-slot limit cut the run while something was still queued or on the air? */
  function cut(s) {
    return s.slot >= MAX_SLOTS && (s.air.length > 0 || s.stations.some(function (x) { return x.queue.length > 0; }));
  }

  /** Steps: the scene's own minimum, or the last slot in which anything happens, whichever is later (≤ 20). */
  function steps(p) {
    var scene = SCENES[p.topology] || SCENES['two-hops'];
    var last = run(p)[MAX_SLOTS].log.reduce(function (m, e) { return Math.max(m, e.slot); }, 0);
    return Math.min(MAX_SLOTS, Math.max(scene.min, last));
  }

  var logic = {
    defaults: { topology: 'two-hops', path: 'w1w2', csma: true, extra: '' },
    steps: steps,
    initial: initial,
    step: step,

    AIRTIME: AIRTIME, MAX_PATH: MAX_PATH, DUPE_SLOTS: DUPE_SLOTS, MAX_SLOTS: MAX_SLOTS, MAX_EXTRA: MAX_EXTRA,
    SCENES: SCENES, PATHS: PATHS,
    inRange: inRange, answers: answers, firstUnused: firstUnused, digipeat: digipeat, elText: elText,
    frameText: frameText, pathOf: pathOf, cut: cut, extraOf: extraOf, isDupe: isDupe, keyOf: keyOf, run: run
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
