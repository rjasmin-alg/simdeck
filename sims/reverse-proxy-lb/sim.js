/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for reverse-proxy-lb: a fixed trace of nine requests (one per second from clients c1–c3 in turn) replayed
   through a reverse proxy that spreads them over backends b1–b4 by round robin, least connections, source hash or a
   sticky cookie, while active health checks mark a failing b2 down and up. Rules, tie-breaks and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. No strings: the page words
   everything from codes. */
(function (root) {
  'use strict';

  var ALGOS = ['rr', 'lc', 'hash', 'sticky'];
  var FAIL_MODES = ['refuse', 'hang'];
  var N_REQ = 9;            // r1…r9, rk at t = k s
  var N_CLIENTS = 3;
  var SERVICE = 2;          // s per request
  var SLOW = 5;             // s per request at b2 when slowB2
  var TIMEOUT = 6;          // s the proxy waits for a response before 504
  var END = 15;             // s: the timeline (r9 at 9 s + the 6 s timeout)
  var HASH = [42, 37, 44];  // hash(client address) of c1, c2, c3, fixed (SPEC "Fixed trace")
  var B_MIN = 2, B_MAX = 4;

  var defaults = { algo: 'rr', backends: 3, slowB2: false, failAt: 0, failMode: 'refuse', failFor: 0, inter: 2, fall: 3, rise: 2 };

  function P(over) {
    var p = {};
    Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; });
    Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
    return p;
  }

  function clientOf(req) { return (req - 1) % N_CLIENTS + 1; }

  /** Is backend b failed at time t? Only b2 fails, from failAt for failFor seconds (0 = for good). */
  function failed(p, b, t) {
    if (b !== 2 || !p.failAt || t < p.failAt) return false;
    return !p.failFor || t < p.failAt + p.failFor;
  }

  function serviceOf(p, b) { return b === 2 && p.slowB2 ? SLOW : SERVICE; }

  /** Replay the trace (SPEC rules 1–9). */
  function initial(p) {
    var n = Math.min(Math.max(Math.round(p.backends), B_MIN), B_MAX);
    var up = [], fails = [], passes = [], down = [];
    for (var i = 0; i < n; i++) { up.push(true); fails.push(0); passes.push(0); down.push([]); }
    var reqs = [], health = [];
    var rrLast = -1;                                   // index round robin chose last
    var cookie = {};                                   // client → backend, once the response has arrived
    var lastBackend = {};                              // client → backend of its previous request
    var wasFailed = false;

    function open(b, t) {   // connections open to backend b at t, after this instant's completions (rule 8a)
      return reqs.filter(function (r) { return r.backend === b && r.t < t && r.end > t; }).length;
    }
    function upList() { var out = []; for (var i = 0; i < n; i++) if (up[i]) out.push(i + 1); return out; }
    function roundRobin() {
      for (var k = 1; k <= n; k++) {
        var i = (rrLast + k) % n;
        if (up[i]) { rrLast = i; return i + 1; }
      }
      return null;
    }

    for (var t = 0; t <= END; t++) {
      // (a) responses that end now: their cookies arrive (sticky; a successful response only)
      reqs.forEach(function (r) { if (r.end === t && r.status === 200) cookie[r.client] = r.backend; });

      // (b) b2 fails: a request in flight is cut off (refuse: 502 now) or never answered (hang: 504 at start + 6 s)
      var isFailed = failed(p, 2, t);
      if (isFailed && !wasFailed) {
        reqs.forEach(function (r) {
          if (r.backend === 2 && r.status === 200 && r.end > t) {
            if (p.failMode === 'hang') { r.status = 504; r.end = r.t + TIMEOUT; }
            else { r.status = 502; r.end = t; }
            r.cut = true;
          }
        });
      }
      wasFailed = isFailed;

      // (c) the request of this second
      if (t >= 1 && t <= N_REQ) {
        var c = clientOf(t), b = null, moved = false, had = null;
        var ups = upList();
        if (ups.length) {
          if (p.algo === 'lc') {
            b = ups[0];
            ups.forEach(function (x) { if (open(x, t) < open(b, t)) b = x; });   // strict <: tie → lowest number
          } else if (p.algo === 'hash') {
            b = ups[HASH[c - 1] % ups.length];
            moved = c in lastBackend && lastBackend[c] !== null && lastBackend[c] !== b;
          } else if (p.algo === 'sticky') {
            had = c in cookie ? cookie[c] : null;
            if (had !== null && up[had - 1]) b = had;
            else { b = roundRobin(); moved = had !== null; }
          } else {
            b = roundRobin();
          }
        }
        var r = { req: t, t: t, client: c, backend: b, status: 200, end: t, moved: moved, cookie: had, cut: false };
        if (b === null) r.status = 502;                                // rule 9
        else if (failed(p, b, t)) {
          if (p.failMode === 'hang') { r.status = 504; r.end = t + TIMEOUT; }
          else r.status = 502;                                         // refused at once: never open
        } else r.end = t + serviceOf(p, b);
        lastBackend[c] = b;
        reqs.push(r);
      }

      // (d) health checks
      if (t % p.inter === 0) {
        for (var j = 0; j < n; j++) {
          var pass = !failed(p, j + 1, t), mark = null;
          if (up[j]) {
            if (pass) fails[j] = 0;
            else if (++fails[j] >= p.fall) { up[j] = false; passes[j] = 0; mark = 'down'; down[j].push([t, null]); }
          } else {
            if (!pass) passes[j] = 0;
            else if (++passes[j] >= p.rise) { up[j] = true; fails[j] = 0; mark = 'up'; down[j][down[j].length - 1][1] = t; }
          }
          health.push({ t: t, backend: j + 1, pass: pass, mark: mark });
        }
      }
    }

    var perBackend = [];
    for (var k = 0; k < n; k++) {
      var id = k + 1;
      var mine = reqs.filter(function (r) { return r.backend === id; });
      var maxOpen = 0;
      mine.forEach(function (r) {
        var at = mine.filter(function (q) { return q.t <= r.t && q.end > r.t; }).length;
        if (at > maxOpen) maxOpen = at;
      });
      perBackend.push({
        id: id, count: mine.length,
        ok: mine.filter(function (r) { return r.status === 200; }).length,
        errors: mine.filter(function (r) { return r.status !== 200; }).length,
        maxOpen: maxOpen, service: serviceOf(p, id), down: down[k], up: up[k]
      });
    }
    return { assignments: reqs, perBackend: perBackend, healthLog: health, endT: END };
  }

  /** Request numbers whose backend or status changed since the previous state; none without one. */
  function changed(prev, cur) {
    if (!prev) return [];
    return cur.assignments.filter(function (r, i) {
      var q = prev.assignments[i];
      return !q || q.backend !== r.backend || q.status !== r.status;
    }).map(function (r) { return r.req; });
  }

  /** Lanes for one backend's bars on the timeline: first free lane, so overlapping requests stack. */
  function lanes(st, b) {
    var ends = [], out = {};
    st.assignments.forEach(function (r) {
      if (r.backend !== b) return;
      var l = 0;
      while (l < ends.length && ends[l] > r.t) l++;
      ends[l] = Math.max(r.end, r.t + 1);   // a refused request still takes its second on the drawing
      out[r.req] = l;
    });
    return { lanes: Math.max(ends.length, 1), of: out };
  }

  /** First time b was marked down (or null). */
  function downAt(st, b) {
    var d = st.perBackend[b - 1] && st.perBackend[b - 1].down[0];
    return d ? d[0] : null;
  }

  /** Which caption sentences the page shows for these params, in order (SPEC "Captions"). */
  function captionKeys(p, st) {
    st = st || initial(p);
    var errs = st.assignments.filter(function (r) { return r.status !== 200; });
    var moved = st.assignments.some(function (r) { return r.moved; });
    var movedKey = p.algo === 'sticky' ? 'capMovedSticky' : 'capMovedHash';
    if (errs.length) {
      var k = errs.some(function (r) { return r.status === 504; }) ? 'capFault504' : 'capFault502';
      return moved ? [k, movedKey] : [k];
    }
    if (moved) return [movedKey];
    if (p.failAt) return ['capFaultClean'];
    if (p.algo === 'lc') {
      if (!p.slowB2) return ['capLC'];
      var rr = initial(Object.assign({}, p, { algo: 'rr' }));
      return [st.perBackend[1].count < rr.perBackend[1].count ? 'capLCSlow' : 'capLCSlowEven'];
    }
    if (p.algo === 'rr') return [p.slowB2 ? 'capRRSlow' : 'capRR'];
    if (p.algo === 'sticky' && raced(st)) return ['capStickyRace'];
    return [p.algo === 'hash' ? 'capHash' : 'capSticky'];
  }

  /** Sticky: the first request sent before its client's previous (successful) response, and so its cookie, came back;
      { req, prev } or null (SPEC rule 5). */
  function raced(st) {
    for (var i = 0; i < st.assignments.length; i++) {
      var r = st.assignments[i];
      if (r.cookie !== null) continue;
      for (var j = i - 1; j >= 0; j--) {
        var q = st.assignments[j];
        if (q.client !== r.client) continue;
        if (q.status === 200 && q.end > r.t) return { req: r.req, prev: q.req };
        break;
      }
    }
    return null;
  }

  /** Presets (SPEC "Presets"). */
  var presets = [
    { id: 'round-robin', params: {} },
    { id: 'least-conn-slow', params: { algo: 'lc', slowB2: true } },
    { id: 'hash-remap', params: { algo: 'hash', failAt: 4, inter: 1, fall: 1 } },
    { id: 'health-check', params: { algo: 'rr', failAt: 4, inter: 2, fall: 3 } },
    { id: 'sticky', params: { algo: 'sticky', failAt: 4, inter: 2, fall: 2 } }
  ];

  var logic = {
    ALGOS: ALGOS, FAIL_MODES: FAIL_MODES, N_REQ: N_REQ, N_CLIENTS: N_CLIENTS, SERVICE: SERVICE, SLOW: SLOW,
    TIMEOUT: TIMEOUT, END: END, HASH: HASH, B_MIN: B_MIN, B_MAX: B_MAX,
    defaults: defaults,
    /** Explorer: no steps; the state is the replayed trace for the current params. */
    initial: initial,
    clientOf: clientOf, failed: failed, changed: changed, lanes: lanes, downAt: downAt, captionKeys: captionKeys, raced: raced,
    withDefaults: P, presets: presets
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
