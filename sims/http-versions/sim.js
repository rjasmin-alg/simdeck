/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for http-versions: one page of N objects loaded over HTTP/1.1, HTTP/2 and HTTP/3, as three waterfalls on one
   time axis. A teaching model counted in round trips: bandwidth, slow start and server time are ignored, one object
   costs one round trip, and recovering a lost segment costs one more. Rules, tie-breaks and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. No strings: the page words
   everything from codes. */
(function (root) {
  'use strict';

  var VERSIONS = ['h1', 'h2', 'h3'];
  var H1_CONNS = [1, 6];             // a browser opens about 6 connections per host (SPEC rule 1, check)
  var RTT_MIN = 10, RTT_MAX = 300, RTT_STEP = 10;
  var OBJ_MIN = 1, OBJ_MAX = 12;

  var defaults = { rtt: 100, objects: 6, h1conns: 6, loss: false, lostObject: 1 };

  function P(over) {
    var p = {};
    Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; });
    Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
    return p;
  }

  /** The object that loses a segment (1…objects), or 0 when loss is off. Out-of-range picks are clamped (tie-break). */
  function lostOf(p) {
    if (!p.loss) return 0;
    return Math.min(Math.max(Math.round(p.lostObject), 1), p.objects);
  }

  /** Set-up phases of one connection (SPEC rules 2 and 4): TCP then TLS 1.3, one round trip each; QUIC, one. */
  function setupOf(version, R) {
    if (version === 'h3') return [{ kind: 'quic', startMs: 0, endMs: R }];
    return [{ kind: 'tcp', startMs: 0, endMs: R }, { kind: 'tls', startMs: R, endMs: 2 * R }];
  }

  /** HTTP/1.1 (SPEC rules 1, 2, 5, 6): c = min(h1conns, objects) connections, all set up at once. Each connection
      carries one request at a time; the next object in id order goes to the first connection that is free, the
      lowest-numbered one on a tie. The lost object takes one extra round trip, and only its own connection waits. */
  function h1(p, lost) {
    var R = p.rtt, n = p.objects;
    var conns = Math.min(p.h1conns, n);
    var setupMs = 2 * R;
    var free = [];
    for (var c = 0; c < conns; c++) free.push(setupMs);
    var objects = [];
    for (var id = 1; id <= n; id++) {
      var best = 0;
      for (var k = 1; k < conns; k++) if (free[k] < free[best]) best = k;   // strict <: ties go to the lowest number
      var startMs = free[best];
      var blockedMs = id === lost ? R : 0;
      var endMs = startMs + R + blockedMs;
      free[best] = endMs;
      objects.push({ id: id, conn: best + 1, startMs: startMs, endMs: endMs, blockedMs: blockedMs, lost: id === lost });
    }
    return { conns: conns, setupMs: setupMs, objects: objects };
  }

  /** HTTP/2 (SPEC rules 2, 3, 5, 6): one TCP connection, every request a stream on it, all sent when the connection is
      ready. A lost TCP segment holds back all data behind it, so every stream waits for the retransmission. */
  function h2(p, lost) {
    var R = p.rtt, setupMs = 2 * R, objects = [];
    for (var id = 1; id <= p.objects; id++) {
      var blockedMs = lost ? R : 0;
      objects.push({ id: id, conn: 1, startMs: setupMs, endMs: setupMs + R + blockedMs, blockedMs: blockedMs, lost: id === lost });
    }
    return { conns: 1, setupMs: setupMs, objects: objects };
  }

  /** HTTP/3 (SPEC rules 4, 5, 6): one QUIC connection, set up with TLS in one round trip; streams as in HTTP/2, but a
      loss holds back only its own stream. */
  function h3(p, lost) {
    var R = p.rtt, setupMs = R, objects = [];
    for (var id = 1; id <= p.objects; id++) {
      var blockedMs = id === lost ? R : 0;
      objects.push({ id: id, conn: 1, startMs: setupMs, endMs: setupMs + R + blockedMs, blockedMs: blockedMs, lost: id === lost });
    }
    return { conns: 1, setupMs: setupMs, objects: objects };
  }

  var BUILD = { h1: h1, h2: h2, h3: h3 };

  /** The three waterfalls for one set of params. doneMs = when the last object of the page has arrived. */
  function rows(p) {
    var lost = lostOf(p);
    return VERSIONS.map(function (v) {
      var r = BUILD[v](p, lost);
      var doneMs = r.objects.reduce(function (m, o) { return Math.max(m, o.endMs); }, r.setupMs);
      return { version: v, conns: r.conns, setupMs: r.setupMs, setup: setupOf(v, p.rtt), objects: r.objects, doneMs: doneMs };
    });
  }

  function initial(p) { return { lost: lostOf(p), rows: rows(p) }; }

  /** What changed between two states, per version: ids of objects whose end time moved (or that are new), and whether
      the page's done time moved. Nothing is marked without a previous state. */
  function changed(prev, cur) {
    var out = {};
    cur.rows.forEach(function (r, i) {
      var pr = prev && prev.rows[i];
      var ids = [];
      if (pr) {
        r.objects.forEach(function (o) {
          var po = pr.objects[o.id - 1];
          if (!po || po.endMs !== o.endMs) ids.push(o.id);
        });
      }
      out[r.version] = { objects: ids, done: !!pr && pr.doneMs !== r.doneMs, was: pr ? pr.doneMs : null };
    });
    return out;
  }

  /** The most requests any HTTP/1.1 connection carries one after another. */
  function h1Depth(st) {
    var per = {};
    st.rows[0].objects.forEach(function (o) { per[o.conn] = (per[o.conn] || 0) + 1; });
    return Object.keys(per).reduce(function (m, k) { return Math.max(m, per[k]); }, 0);
  }

  /** Which caption the page shows for these params (the page words it). */
  function captionKey(p) {
    if (p.loss) return p.objects > 1 ? 'capLoss' : 'capLossOne';
    if (h1Depth(initial(p)) > 1) return 'capSerial';
    return 'capNoLoss';
  }

  /** Axis ticks: one per round trip up to the latest done time, thinned so there are at most `maxTicks`. */
  function ticks(st, rtt, maxTicks) {
    var end = st.rows.reduce(function (m, r) { return Math.max(m, r.doneMs); }, 0);
    var n = Math.round(end / rtt);
    var every = 1;
    while (n / every > maxTicks) every++;
    var out = [];
    for (var k = 0; k <= n; k += every) out.push(k * rtt);
    // the end gets its own tick; one closer than 0.6 of a tick step gives way to it, so the labels do not collide
    if (out[out.length - 1] !== end) {
      if (out.length > 1 && end - out[out.length - 1] < 0.6 * every * rtt) out.pop();
      out.push(end);
    }
    return { endMs: end, ticks: out };
  }

  /** Presets (SPEC "Presets"). */
  var presets = [
    { id: 'no-loss', params: { rtt: 100, objects: 6, h1conns: 6, loss: false, lostObject: 1 } },
    { id: 'one-connection', params: { rtt: 100, objects: 6, h1conns: 1, loss: false, lostObject: 1 } },
    { id: 'loss', params: { rtt: 100, objects: 6, h1conns: 6, loss: true, lostObject: 1 } },
    { id: 'high-rtt', params: { rtt: 250, objects: 12, h1conns: 6, loss: true, lostObject: 1 } }
  ];

  var logic = {
    VERSIONS: VERSIONS, H1_CONNS: H1_CONNS, RTT_MIN: RTT_MIN, RTT_MAX: RTT_MAX, RTT_STEP: RTT_STEP,
    OBJ_MIN: OBJ_MIN, OBJ_MAX: OBJ_MAX,
    defaults: defaults,
    /** Explorer: no steps; the state is the three waterfalls of the current params. */
    initial: initial,
    rows: rows, lostOf: lostOf, changed: changed, h1Depth: h1Depth, captionKey: captionKey, ticks: ticks,
    withDefaults: P, presets: presets
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
