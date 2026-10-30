/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for http-caching: one or two browsers (private caches), a CDN edge (a shared cache) and the origin server
   www.grafo.hr. Each step is one event: a browser asks for /katalog, or the file at the origin changes. On a request
   each cache in turn serves a fresh copy, revalidates a stale one with If-None-Match, or forwards; the response
   fills or refreshes the caches on the way back. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Times are seconds from the first request.
   The page loads this as a classic script (window.SimLogic); node tests require() it. No strings: the page words
   everything from codes. Host names, paths, ETags and header values are data, not language. */
(function (root) {
  'use strict';

  var HOST = 'www.grafo.hr';
  var PATH = '/katalog';
  var URL = 'http://' + HOST + PATH;
  var MAX_STEPS = 20;
  var MAX_K = 19;                 // changes: bit k (1 … 19) = the origin changes before request k

  /** What the origin can send (the param's options, in order). */
  var CACHE_CONTROLS = ['max-age=60', 'no-cache', 'no-store', 'private, max-age=60', 'max-age=60, s-maxage=300'];

  /** The two-browser schedule, in units of `interval`: who asks when (SPEC.md, Schedule). */
  var TWO = [[0, 'A'], [1, 'A'], [4, 'B'], [5, 'B'], [10, 'A'], [11, 'B']];

  // ── from sims/http-exchange/sim.js @ 2281269: the start lines and reason phrases ──

  var VERSION = 'HTTP/1.1';
  /** Reason phrases (RFC 9110 §15). Data the server sends. */
  var REASON = { 200: 'OK', 304: 'Not Modified' };
  /** Rule 1 there: request-line = method SP request-target SP HTTP-version; status-line = HTTP-version SP code SP reason. */
  function startLine(m) {
    return m.dir === 'req' ? 'GET ' + PATH + ' ' + VERSION : VERSION + ' ' + m.code + ' ' + REASON[m.code];
  }

  // ── the file at the origin ──

  /** Version n of /katalog: its ETag and its size in bytes (made-up sizes, data). */
  function version(n) {
    var sizes = [48213, 48977, 49302];
    return { version: n, etag: '"v' + n + '"', bytes: n <= 3 ? sizes[n - 1] : 49302 + 400 * (n - 3) };
  }

  // ── Cache-Control (rules 2, 7) ──

  /** Directives of a Cache-Control value: names lowercased, delta-seconds as numbers, others true. */
  function parseCC(cc) {
    var out = {};
    String(cc).split(',').forEach(function (part) {
      var kv = part.trim().split('=');
      var k = kv[0].trim().toLowerCase();
      if (!k) return;
      out[k] = kv.length > 1 ? Number(kv[1]) : true;
    });
    return out;
  }

  /** Rule 2: a shared cache takes s-maxage if present, else max-age; a private one max-age. None: 0 (no heuristics). */
  function lifetime(cc, shared) {
    var d = parseCC(cc);
    if (shared && typeof d['s-maxage'] === 'number') return d['s-maxage'];
    if (typeof d['max-age'] === 'number') return d['max-age'];
    return 0;
  }

  /** Rule 7: no-store → nobody stores; private → never a shared cache. */
  function storable(cc, shared) {
    var d = parseCC(cc);
    if (d['no-store']) return false;
    if (shared && d['private']) return false;
    return true;
  }

  function noCache(e) { return !!parseCC(e.cacheControl)['no-cache']; }

  // ── entries (rules 1, 3) ──

  function entryOf(v, cc, t, initAge) {
    return { url: URL, etag: v.etag, version: v.version, bytes: v.bytes, cacheControl: cc, storedAt: t, initAge: initAge };
  }

  /** Rule 3: the Age it arrived with plus the time since it was stored or last revalidated. */
  function ageOf(e, t) { return e.initAge + (t - e.storedAt); }

  /** Rule 1: fresh while age < lifetime; equal is stale. */
  function isFresh(e, t, shared) { return lifetime(e.cacheControl, shared) > ageOf(e, t); }

  /** Rule 4 / 7: may be used without asking the next hop: fresh, and not no-cache. */
  function usable(e, t, shared) { return !noCache(e) && isFresh(e, t, shared); }

  // ── the schedule ──

  /** The k's whose bit is set in `changes` (1 … MAX_K), ascending. */
  function changesOf(p) {
    var c = Number(p.changes), out = [];
    if (!(c > 0) || Math.floor(c) !== c) return out;
    for (var k = 1; k <= MAX_K; k++) if (Math.floor(c / Math.pow(2, k)) % 2 === 1) out.push(k);
    return out;
  }

  function baseRequests(p) { return p.browsers === 2 ? TWO.length : 4; }

  /** Request k: its time and who asks (SPEC.md, Schedule). */
  function requestAt(p, k) {
    var i = p.interval;
    if (p.browsers !== 2) return { t: k * i, who: 'A' };
    if (k < TWO.length) return { t: TWO[k][0] * i, who: TWO[k][1] };
    return { t: (TWO[TWO.length - 1][0] + k - TWO.length + 1) * i, who: k % 2 ? 'B' : 'A' };
  }

  /** Every event of the run in order: requests, each change just before its request; at most MAX_STEPS. */
  function schedule(p) {
    var ch = changesOf(p);
    var r = Math.max(baseRequests(p), ch.length ? ch[ch.length - 1] + 1 : 0);
    var out = [];
    for (var k = 0; k < r; k++) {
      var q = requestAt(p, k);
      if (k >= 1 && ch.indexOf(k) >= 0) {
        var prev = requestAt(p, k - 1).t;
        out.push({ kind: 'change', t: q.t - Math.floor((q.t - prev) / 3), k: k });
      }
      out.push({ kind: 'request', t: q.t, who: q.who, k: k });
    }
    out = out.slice(0, MAX_STEPS);
    // a change cut off from its request would show nothing (a hand-made URL past 20 steps)
    if (out.length && out[out.length - 1].kind === 'change') out.pop();
    return out;
  }

  function browsersOf(p) { return p.browsers === 2 ? ['A', 'B'] : ['A']; }

  // ── the button O ──

  /** Why O cannot set a change after step n (null when it can): SPEC.md, "The button O". */
  function changeRefused(p, n) {
    if (n <= 0) return 'first';
    var ev = schedule(p)[n - 1];
    if (!ev || ev.kind !== 'request') return 'already';
    var k = ev.k + 1;
    if (k > MAX_K || changesOf(p).indexOf(k) >= 0) return k > MAX_K ? 'full' : 'already';
    var grow = schedule(p).filter(function (e) { return e.kind === 'request' && e.k === k; }).length ? 1 : 2;
    if (schedule(p).length + grow > MAX_STEPS) return 'full';
    return null;
  }

  /** The `changes` value with a change before the request after step n (call when changeRefused is null). */
  function withChange(p, n) {
    var ev = schedule(p)[n - 1];
    return (Number(p.changes) || 0) + Math.pow(2, ev.k + 1);
  }

  // ── one request (rules 4–7) ──

  function respond(code, v, age, by) {
    return { code: code, etag: v.etag, version: v.version, bytes: v.bytes, age: age, by: by };
  }

  /** The edge's handling of a request with If-None-Match `inm` (null: none). Mutates s; adds hops. */
  function atEdge(s, cc, inm, t, out) {
    var e = s.caches.edge;
    if (e && usable(e, t, true)) {
      // rule 4: answer from the store; a matching If-None-Match gets 304 (RFC 9111 §4.3.2)
      out.decisions.edge = 'fresh';
      var a = ageOf(e, t);
      return respond(inm !== null && inm === e.etag ? 304 : 200, e, a, 'edge');
    }
    out.decisions.edge = !e ? 'miss' : noCache(e) ? 'nocache' : 'stale';
    // rule 6: with an entry, validate its own tag; without one, forward the browser's request as it is
    var fwd = e ? e.etag : inm;
    var o = version(s.origin.version);
    var match = fwd !== null && fwd === o.etag;
    out.decisions.origin = fwd === null ? 'plain' : match ? 'match' : 'changed';
    out.hops.push({ from: 'edge', to: 'origin', dir: 'req', inm: fwd });
    out.hops.push({ from: 'origin', to: 'edge', dir: 'resp', code: match ? 304 : 200, etag: o.etag, version: o.version, age: null,
      bytes: match ? 0 : o.bytes });
    out.reached = 'origin';
    if (match) {
      if (!e) return respond(304, o, null, 'origin');
      // rule 5: refreshed; validated by the origin for this request, so no Age (RFC 9111 §5.1)
      e.storedAt = t;
      e.initAge = 0;
      out.written.edge = 'revalidated';
      return respond(inm !== null && inm === e.etag ? 304 : 200, e, null, 'edge');
    }
    if (storable(cc, true)) {
      s.caches.edge = entryOf(o, cc, t, 0);
      out.written.edge = 'stored';
    } else if (e) s.caches.edge = null;
    return respond(inm !== null && inm === o.etag ? 304 : 200, o, null, 'origin');
  }

  /** Browser `who` asks at t. Mutates s; returns what the step records. */
  function request(s, p, who, t) {
    var cc = p.cacheControl;
    var out = { hops: [], written: {}, decisions: {}, reached: who, got: null };
    var b = s.caches[who];
    if (b && usable(b, t, false)) {
      out.decisions[who] = 'fresh';
      out.got = { who: who, status: 'hit', etag: b.etag, version: b.version, age: ageOf(b, t), by: who };
      return out;
    }
    out.decisions[who] = !b ? 'miss' : noCache(b) ? 'nocache' : 'stale';
    var inm = b ? b.etag : null;                       // rule 5: a stored entry has an ETag here, always
    out.hops.push({ from: who, to: 'edge', dir: 'req', inm: inm });
    out.reached = 'edge';
    var r = atEdge(s, cc, inm, t, out);
    // the response to the browser: after the edge's hops, before nothing else
    out.hops.push({ from: 'edge', to: who, dir: 'resp', code: r.code, etag: r.etag, version: r.version, age: r.age,
      bytes: r.code === 200 ? r.bytes : 0 });
    if (r.code === 304) {
      b.storedAt = t;
      b.initAge = r.age === null ? 0 : r.age;
      out.written[who] = 'revalidated';
    } else if (storable(cc, false)) {
      s.caches[who] = entryOf(version(r.version), cc, t, r.age === null ? 0 : r.age);
      out.written[who] = 'stored';
    } else s.caches[who] = null;
    out.got = { who: who, status: r.code, etag: r.etag, version: r.version, age: r.age, by: r.by };
    return out;
  }

  function path(reached, who) {
    return reached === 'origin' ? [who, 'edge', 'origin'] : reached === 'edge' ? [who, 'edge'] : [who];
  }

  var logic = {
    /** Parameter defaults: the `max-age` preset. */
    defaults: { cacheControl: 'max-age=60', interval: 30, browsers: 1, changes: 0 },

    HOST: HOST,
    PATH: PATH,
    URL: URL,
    MAX_STEPS: MAX_STEPS,
    CACHE_CONTROLS: CACHE_CONTROLS,
    REASON: REASON,

    steps: function (p) { return schedule(p).length; },

    /** Step 0: nobody has asked; the origin holds v1; every cache is empty. */
    initial: function (p) {
      var caches = {};
      browsersOf(p).forEach(function (id) { caches[id] = null; });
      caches.edge = null;
      var v = version(1);
      return {
        now: null, ev: { kind: 'start' },
        origin: { version: v.version, etag: v.etag, bytes: v.bytes, cacheControl: p.cacheControl },
        caches: caches, hops: [], path: [], reached: null, got: null, decisions: {}, written: {}, log: []
      };
    },

    /** State after step n: the next event of the schedule. */
    step: function (s0, n, p) {
      var s = JSON.parse(JSON.stringify(s0));
      var ev = schedule(p)[n - 1];
      s.now = ev.t;
      s.ev = ev;
      s.hops = [];
      s.path = [];
      s.reached = null;
      s.got = null;
      s.decisions = {};
      s.written = {};
      if (ev.kind === 'change') {
        // rule 8: only the origin changes; no cache is told
        var v = version(s.origin.version + 1);
        s.origin.version = v.version;
        s.origin.etag = v.etag;
        s.origin.bytes = v.bytes;
      } else {
        var r = request(s, p, ev.who, ev.t);
        s.hops = r.hops;
        s.reached = r.reached;
        s.path = path(r.reached, ev.who);
        s.got = r.got;
        s.decisions = r.decisions;
        s.written = r.written;
      }
      s.log.push({ t: ev.t, ev: ev, hops: s.hops, got: s.got, version: s.origin.version });
      return s;
    },

    // exported for the page and the tests
    version: version,
    parseCC: parseCC,
    lifetime: lifetime,
    storable: storable,
    noCache: noCache,
    ageOf: ageOf,
    isFresh: isFresh,
    usable: usable,
    changesOf: changesOf,
    requestAt: requestAt,
    schedule: schedule,
    browsersOf: browsersOf,
    changeRefused: changeRefused,
    withChange: withChange,
    startLine: startLine
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
