/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for dns-ttl-cache: the zone lab.example changes an address (or gains a name) at t = 0, and three busy caching
   resolvers keep handing out what they cached until its TTL runs out. Lowering the TTL helps only for what is fetched
   after the lowering. One step = the clock moves by a step; every expiry and zone edit in between happens at its own
   moment. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Times are seconds relative to the change.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var ZONE = 'lab.example';
  var NAME = 'posluzitelj.lab.example';
  var NEW_NAME = 'novi.lab.example';
  var ADDR = { old: '192.168.180.1', new: '192.168.180.2', novi: '192.168.180.3' };
  /** SOA of lab.example: MINIMUM 900 (UL ch19, Primjer 2); the SOA's own TTL is the zone's $TTL, oldTtl. */
  var MINIMUM = 900;
  var MIN = 60;
  /** Busy resolvers: the time of one fetch each; before the first zone edit they fetched every oldTtl along it. */
  var PHASE = { R1: -50 * MIN, R2: -20 * MIN, R3: -5 * MIN };
  /** New-name scenario: when each office first asks for the new name. */
  var FIRST_ASK = { R1: -5 * MIN, R2: 0, R3: 5 * MIN };
  var IDS = ['R1', 'R2', 'R3'];
  var MAX_STEPS = 20;

  // ── from sims/dns-resolution/sim.js @ a66760c: the cache and the authoritative answer ──

  /** An entry is usable while some of its TTL is left: at expiresAt (0 s left) it is expired. Hints never expire. */
  function valid(e, t) { return e.expiresAt === null || e.expiresAt > t; }
  function left(e, t) { return e.expiresAt === null ? null : Math.max(0, e.expiresAt - t); }

  /**
   * A server answers from its own data only: the record with aa, NXDOMAIN with aa and the SOA, or a referral to the
   * child zone that is closer to the name (NS + glue, no aa).
   */
  function serve(zs, zone, name, type) {
    var z = zs[zone];
    var cut = Object.keys(z.cuts).filter(function (c) { return name === c || name.slice(-(c.length + 1)) === '.' + c; })[0];
    if (cut) {
      var d = z.cuts[cut];
      return { kind: 'referral', aa: false, zone: cut, ns: d.ns.slice(), glue: d.ns.map(function (n) { return { name: n, ip: d.glue[n] }; }), ttl: d.ttl };
    }
    var rec = z.records[name];
    if (rec && rec[type]) return { kind: 'answer', aa: true, rr: { name: name, type: type, data: rec[type].slice(), ttl: z.ttlA } };
    // RFC 2308 §5: the negative answer is cached for the lower of the SOA's own TTL and its MINIMUM
    return { kind: 'nxdomain', aa: true, soa: { zone: zone, ttl: z.soa.ttl, minimum: z.soa.minimum }, ttl: Math.min(z.soa.ttl, z.soa.minimum) };
  }

  // ── the zone over time ──

  /** The zone edits of a run, in the order they apply at equal times. */
  function edits(p) {
    if (p.scenario === 'newname') return [{ at: 0, kind: 'add', name: NEW_NAME, addr: ADDR.novi }];
    var out = [];
    if (p.lower) out.push({ at: p.lowerAt * MIN, kind: 'ttl', ttl: p.newTtl });
    out.push({ at: 0, kind: 'addr', name: NAME, addr: ADDR.new });
    return out;
  }

  /** The zone before any edit: one name, the old address, TTL = $TTL = oldTtl. */
  function zone0(p) {
    var records = {};
    records[NAME] = ADDR.old;
    return { records: records, ttl: p.oldTtl, negTtl: Math.min(MINIMUM, p.oldTtl), minimum: MINIMUM };
  }

  function applyEdit(zone, e) {
    var z = JSON.parse(JSON.stringify(zone));
    if (e.kind === 'ttl') z.ttl = e.ttl;
    else z.records[e.name] = e.addr;
    return z;
  }

  /** The zone in dns-resolution's shape, so its serve() answers for it. Only posluzitelj's TTL is lowered. */
  function asZones(zone, p) {
    var recs = {};
    Object.keys(zone.records).forEach(function (n) { recs[n] = { A: [zone.records[n]] }; });
    var zs = {};
    zs[ZONE] = { lane: 'auth', ns: ['ns.' + ZONE], cuts: {}, records: recs, soa: { ttl: p.oldTtl, minimum: zone.minimum },
      ttlA: zone.ttl };
    return zs;
  }

  /**
   * Rule 2: on a miss the resolver gets the zone's current answer and current TTL, fixed in the entry from now on.
   * Rule 4: no such name → a negative entry for min(MINIMUM, SOA TTL).
   */
  function fetch(zone, p, name, t) {
    var r = serve(asZones(zone, p), ZONE, name, 'A');
    if (r.kind === 'answer') return { name: name, addr: r.rr.data[0], ttl: r.rr.ttl, fetchedAt: t, expiresAt: t + r.rr.ttl };
    return { name: name, addr: null, ttl: r.ttl, fetchedAt: t, expiresAt: t + r.ttl };
  }

  // ── the window ──

  function stepSec(p) { return p.stepMin * MIN; }

  /** Start, number of steps: SPEC.md, "The window". */
  function windowOf(p) {
    var st = stepSec(p), from, to;
    if (p.scenario === 'newname') {
      from = FIRST_ASK.R1;
      to = from + Math.ceil((Math.min(MINIMUM, p.oldTtl) + st) / st) * st;
    } else {
      var lowerAt = p.lowerAt * MIN;
      from = p.lower ? Math.min(lowerAt, -2 * st) : -p.oldTtl;
      var inTime = p.lower && lowerAt <= -p.oldTtl;
      to = inTime ? 2 * st : p.oldTtl; // in time: two steps past the change show the switch (newTtl ≤ 300 s ≤ one step)
    }
    var n = Math.ceil((to - from) / st);
    if (n > MAX_STEPS) { from += (n - MAX_STEPS) * st; n = MAX_STEPS; }
    return { from: from, steps: n };
  }

  function timeAt(p, n) { return windowOf(p).from + n * stepSec(p); }

  // ── the run ──

  /** Where a resolver stands before the first edit: its last fetch strictly before it, along its phase. */
  function seed(p, id, before) {
    var f = PHASE[id];
    while (f >= before) f -= p.oldTtl;
    while (f + p.oldTtl < before) f += p.oldTtl;
    return { name: NAME, addr: ADDR.old, ttl: p.oldTtl, fetchedAt: f, expiresAt: f + p.oldTtl };
  }

  function emptyState(p) {
    var es = edits(p);
    var zone = zone0(p);
    var first = es[0].at;
    var res = IDS.map(function (id) {
      var asksFrom = p.scenario === 'newname' ? FIRST_ASK[id] : null;
      var cache = asksFrom === null ? seed(p, id, Math.min(first, windowOf(p).from)) : null;
      return { id: id, qname: p.scenario === 'newname' ? NEW_NAME : NAME, asksFrom: asksFrom, cache: cache,
        history: cache ? [cache] : [], answer: null, source: null, changed: false, refetches: 0 };
    });
    return { t: null, zone: zone, applied: [], resolvers: res, stepLog: [] };
  }

  /** The next event after `after` and not after `until`: edits first at equal times, then resolvers in id order. */
  function nextEvent(s, es, after, until) {
    var best = null;
    function offer(ev) {
      if (ev.at <= after || ev.at > until) return;
      if (!best || ev.at < best.at || (ev.at === best.at && ev.rank < best.rank)) best = ev;
    }
    es.forEach(function (e, i) { if (s.applied.indexOf(i) < 0) offer({ at: e.at, rank: i, kind: 'edit', i: i }); });
    s.resolvers.forEach(function (r, i) {
      var rank = 100 + i;
      if (r.cache) offer({ at: r.cache.expiresAt, rank: rank, kind: 'expire', r: i });
      else if (r.asksFrom !== null) offer({ at: r.asksFrom, rank: rank, kind: 'ask', r: i });
    });
    return best;
  }

  /** Run every event in (after, until], in order. Mutates s (the caller passes a copy). */
  function advance(s, p, after, until) {
    var es = edits(p);
    // `after` stays put: applied edits are skipped, and a fetch moves its resolver's next expiry forward
    var guard = 0;
    for (var ev = nextEvent(s, es, after, until); ev && guard < 10000; ev = nextEvent(s, es, after, until), guard++) {
      if (ev.kind === 'edit') {
        s.zone = applyEdit(s.zone, es[ev.i]);
        s.applied.push(ev.i);
        s.stepLog.push({ at: ev.at, kind: 'edit', edit: es[ev.i].kind });
      } else {
        // rule 1: at expiresAt the entry is expired; a busy resolver asks again at that moment (rule 2)
        var r = s.resolvers[ev.r];
        var e = fetch(s.zone, p, r.qname, ev.at);
        r.cache = e;
        r.history.push(e);
        r.refetches++;
        s.stepLog.push({ at: ev.at, kind: 'fetch', r: r.id, addr: e.addr, ttl: e.ttl });
      }
    }
    return s;
  }

  /** Rule 5 and the marks: what each client gets at t. */
  function observe(s, prev, tPrev) {
    s.resolvers.forEach(function (r, i) {
      var before = prev ? prev.resolvers[i].answer : null;
      if (!r.cache || !valid(r.cache, s.t)) { r.answer = null; r.source = null; r.changed = !!before; return; }
      r.answer = { addr: r.cache.addr, ttlLeft: left(r.cache, s.t), fetchedAt: r.cache.fetchedAt, ttl: r.cache.ttl };
      r.source = (tPrev === null ? r.cache.fetchedAt === s.t : r.cache.fetchedAt > tPrev) ? 'auth' : 'cache';
      r.changed = !!prev && (!before || before.addr !== r.answer.addr);
    });
  }

  var logic = {
    /** Parameter defaults: the book's example without the fix (book-naive). */
    defaults: { scenario: 'move', oldTtl: 3600, lower: false, lowerAt: -70, newTtl: 300, stepMin: 10 },

    ADDR: ADDR,
    NAME: NAME,
    NEW_NAME: NEW_NAME,
    ZONE: ZONE,
    MINIMUM: MINIMUM,
    PHASE: PHASE,
    FIRST_ASK: FIRST_ASK,
    IDS: IDS,

    steps: function (p) { return windowOf(p).steps; },

    /** State at step 0: everything up to the window's first moment has happened. */
    initial: function (p) {
      var s = emptyState(p);
      var from = windowOf(p).from;
      // the seeds hold entries fetched before the first edit; run from the earliest seed fetch up to `from`
      var start = Math.min.apply(null, s.resolvers.map(function (r) { return r.cache ? r.cache.fetchedAt : Infinity; }).concat([from - 1]));
      advance(s, p, start, from);
      s.t = from;
      s.stepLog = s.stepLog.filter(function (x) { return x.at === from; });
      s.resolvers.forEach(function (r) { r.refetches = r.cache && r.cache.fetchedAt === from ? 1 : 0; });
      observe(s, null, null);
      return s;
    },

    /** State after step n: the clock moves one step; every event in between happens at its own moment. */
    step: function (s0, n, p) {
      var s = JSON.parse(JSON.stringify(s0));
      var tPrev = s0.t, t = tPrev + stepSec(p);
      s.resolvers.forEach(function (r) { r.refetches = 0; });
      s.stepLog = [];
      advance(s, p, tPrev, t);
      s.t = t;
      observe(s, s0, tPrev);
      return s;
    },

    /** For a resolver holding the old address at t, when its entry expires: the earliest it can switch (rule 3). */
    oldUntil: function (r, t) {
      return r.cache && r.cache.addr === ADDR.old && valid(r.cache, t) ? r.cache.expiresAt : null;
    },

    /** When each resolver first answered with the changed data at or after the change, from its history. */
    switchedAt: function (r) {
      for (var i = 0; i < r.history.length; i++) {
        var e = r.history[i];
        if (e.fetchedAt >= 0 && e.addr !== null && e.addr !== ADDR.old) return e.fetchedAt;
      }
      return null;
    },

    // exported for the page and the tests
    valid: valid,
    left: left,
    serve: serve,
    edits: edits,
    zone0: zone0,
    applyEdit: applyEdit,
    fetch: fetch,
    seed: seed,
    windowOf: windowOf,
    timeAt: timeAt,
    stepSec: stepSec
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
