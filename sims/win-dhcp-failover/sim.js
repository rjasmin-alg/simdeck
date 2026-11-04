/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-dhcp-failover: one scope 10.0.10.10–.209 (200 addresses) served by two DHCP servers, either as a
   failover relationship (load balance or hot standby: one shared lease database kept in step by binding updates, a
   state per server, MCLT) or as the old 80/20 split scope (two independent servers with non-overlapping ranges).
   At 0:00 the clients switch on (6 named + the others); at MCLT/2 (0:30 by default) a batch of new clients arrives.
   Then every client follows its own lease timers (T1 renew at its server, T2 rebind by broadcast, expiry → start
   again). The admin's buttons fail DHCP1 and declare PARTNER DOWN; they take effect in the next step.
   One step = everything at the next moment, in three phases (SPEC.md "Steps"): (1) state changes, (2) client
   messages answered, (3) binding updates, which are a step of their own right after the moment they belong to.
   Rules and numbers: SPEC.md.
   Reused from sims/win-dhcp-scope-options/sim.js @ e66fda5: the subnet 10.0.10.0/24, the address helper ip() and the
   8-day default lease. New: the relationship, the states, the pools, MCLT and the hash buckets.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MIN = 60, HOUR = 3600, DAY = 86400;
  // from sims/win-dhcp-scope-options/sim.js @ e66fda5
  var NET = '10.0.10.';
  var LEASE = 8 * DAY;                   // the scope's lease, Windows Server default (SPEC rule 10, check)
  function ip(octet) { return NET + octet; }

  var RANGE = [10, 209];                 // 200 addresses, last octets inclusive
  var SPLIT = { A: [10, 169], B: [170, 209] };   // 80/20: DHCP1 .10–.169 (160), DHCP2 .170–.209 (40)
  var T1 = 0.5, T2 = 0.875;              // RFC 2131 §4.4.5 defaults
  var ACTION_DELAY = 5 * MIN;            // an admin action lands 5 min after the moment it was pressed at
  var MAX_STEPS = 20;
  var SERVERS = ['DHCP1', 'DHCP2'];
  var MODES = ['loadBalance', 'hotStandby', 'splitScope'];
  var MCLTS = [15, 60, 240];             // minutes
  /** The six named clients. The bucket stands for RFC 3074's hash of the MAC (0–255); the values are illustrative,
      chosen so that 50/50 gives PC-01, 03, 05 to DHCP1 (SPEC rule 2). */
  var NAMED = [
    { name: 'PC-01', mac: '00-15-5D-0A-01-01', bucket: 23 },
    { name: 'PC-02', mac: '00-15-5D-0A-01-02', bucket: 201 },
    { name: 'PC-03', mac: '00-15-5D-0A-01-03', bucket: 77 },
    { name: 'PC-04', mac: '00-15-5D-0A-01-04', bucket: 164 },
    { name: 'PC-05', mac: '00-15-5D-0A-01-05', bucket: 112 },
    { name: 'PC-06', mac: '00-15-5D-0A-01-06', bucket: 239 }
  ];
  /** Clients that switch on at 0:00 besides the named six: 100 leased in a failover scope, 60 in the split scope. */
  var OTHERS = { loadBalance: 94, hotStandby: 94, splitScope: 54 };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function failover(s) { return s.mode !== 'splitScope'; }
  function srv(s, id) { return s.servers[id === 'DHCP1' ? 0 : 1]; }
  function other(id) { return id === 'DHCP1' ? 'DHCP2' : 'DHCP1'; }
  function ownPool(id) { return id === 'DHCP1' ? 'A' : 'B'; }
  /** Buckets of an unnamed batch: spread evenly over 0–255 (stands in for the hash of n different MACs). */
  function spread(n) { var out = []; for (var i = 0; i < n; i++) out.push(Math.floor((i + 0.5) * 256 / n)); return out; }
  /** Rule 2: the bucket's owner under load balance; DHCP1 owns buckets 0 … round(256 × share %) − 1. */
  function bucketOwner(bucket, share) { return bucket < Math.round(256 * share / 100) ? 'DHCP1' : 'DHCP2'; }
  /** Pool A belongs to DHCP1, B to DHCP2 (rules 2, 3, 8). */
  function poolRanges(p) {
    if (p.mode === 'splitScope') return { A: SPLIT.A.slice(), B: SPLIT.B.slice() };
    var size = RANGE[1] - RANGE[0] + 1;
    var k = p.mode === 'hotStandby' ? size - Math.round(size * p.reserve / 100) : Math.round(size * p.share / 100);
    return { A: [RANGE[0], RANGE[0] + k - 1], B: [RANGE[0] + k, RANGE[1]] };
  }
  function seq(a, b) { var out = []; for (var i = a; i <= b; i++) out.push(i); return out; }
  function poolOf(s, octet) { return octet >= s.ranges.A[0] && octet <= s.ranges.A[1] ? 'A' : 'B'; }

  /** Rules 5–7: the pools a server may hand out from now, its own first. */
  function usable(s, id) {
    var x = srv(s, id);
    if (!x.up) return [];
    var out = [ownPool(id)];
    if (failover(s) && x.state === 'partnerDown' && x.whole) out.push(ownPool(other(id)));
    return out;
  }
  function freeFor(s, id) { return usable(s, id).reduce(function (a, k) { return a + s.pools[k].length; }, 0); }
  function take(s, id, n) {
    var got = [];
    usable(s, id).forEach(function (k) {
      while (got.length < n && s.pools[k].length) got.push(s.pools[k].shift());
    });
    return got;
  }
  /** An expired lease's address is free again: in the shared database of a failover pair (either server's pool), or
      in the split scope only on a server that is up (a down server's scope stays as it was). */
  function giveBack(s, octets) {
    octets.forEach(function (o) {
      var k = poolOf(s, o);
      if (!failover(s) && !srv(s, k === 'A' ? 'DHCP1' : 'DHCP2').up) return;
      s.pools[k].push(o);
      s.pools[k].sort(function (a, b) { return a - b; });
    });
  }

  /** Rules 2, 3, 5, 8, 9: who answers a broadcast (DISCOVER or rebinding REQUEST) from a client in this bucket.
      null: nobody. `cohort` is the client's current lease (for a split-scope rebind: only its own server knows it). */
  function answerer(s, bucket, kind, cohort) {
    var a = srv(s, 'DHCP1'), b = srv(s, 'DHCP2');
    if (!failover(s)) {
      if (kind === 'rebind') return cohort && srv(s, cohort.server).up ? cohort.server : null;   // rule 8: no record → silent
      return a.up ? 'DHCP1' : b.up ? 'DHCP2' : null;   // rule 8: DHCP2 delays its offer, DHCP1 answers first
    }
    if (a.up && b.up) return s.mode === 'hotStandby' ? 'DHCP1' : bucketOwner(bucket, s.share);   // rules 2, 3, 9
    if (a.up) return 'DHCP1';
    if (b.up) return 'DHCP2';
    return null;
  }

  /** Rule 4: the length of a lease a server gives now. A new lease or one the partner has not acknowledged: MCLT;
      a renewal in NORMAL of a binding the partner knows: the scope's lease. Split scope: always the scope's lease. */
  function leaseLen(s, id, renewal, cohort) {
    if (!failover(s)) return LEASE;
    if (srv(s, id).state === 'normal' && renewal && cohort && cohort.acked) return LEASE;
    return s.mclt;
  }

  function newKey(s, kind) { s.seq += 1; return (kind === 'others' ? 'o' : 'n') + s.seq; }

  /** A server gives (or extends) a lease: the client's timers, the server's database, the update owed to the partner. */
  function grant(s, c, id, len) {
    c.server = id;
    c.granted = s.t;
    c.len = len;
    c.expires = s.t + len;
    c.phase = 'bound';
    c.acked = false;
    c.known[id] = { by: id, expires: c.expires };
    if (failover(s)) s.pending.push({ from: id, key: c.key });
  }

  function cohortOrder(a, b) {
    var ka = a.kind === 'named' ? 0 : 1, kb = b.kind === 'named' ? 0 : 1;
    if (ka !== kb) return ka - kb;
    if (a.kind === 'named') return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    return a.order - b.order;
  }
  function sortCohorts(s) { s.cohorts.sort(cohortOrder); }

  /** Phase 2, DISCOVER: route each member to its answerer, give addresses while the pool lasts (rule 7), keep the rest
      waiting. Members in order: named clients in name order, then the batches in arrival order. */
  function discover(s, reqs, why) {
    var item = { k: 'discover', why: why, names: [], n: 0, to: SERVERS.filter(function (id) { return srv(s, id).up; }), served: {}, none: { names: [], n: 0 }, full: {} };
    reqs.forEach(function (c) {
      item.n += c.n;
      if (c.kind === 'named') item.names.push(c.name);
      var parts = {};
      c.buckets.forEach(function (b, i) {
        var by = answerer(s, b, 'discover', null);
        var k = by || '-';
        (parts[k] = parts[k] || []).push(i);
      });
      var waiting = [];
      Object.keys(parts).sort().forEach(function (k) {
        var idx = parts[k];
        if (k === '-') { waiting = waiting.concat(idx); return; }
        var octets = take(s, k, idx.length);
        if (octets.length < idx.length) item.full[k] = true;
        var got = idx.slice(0, octets.length);
        waiting = waiting.concat(idx.slice(octets.length));
        if (!got.length) return;
        var nc = c.kind === 'named' ? c : { key: newKey(s, c.kind), kind: c.kind, order: s.seq, n: got.length, known: {} };
        nc.buckets = got.map(function (i) { return c.buckets[i]; });
        nc.octets = octets;
        nc.n = got.length;
        var len = leaseLen(s, k, false, null);
        grant(s, nc, k, len);
        if (s.cohorts.indexOf(nc) < 0) s.cohorts.push(nc);
        var sv = item.served[k] = item.served[k] || { names: [], n: 0, len: len, ips: [] };
        sv.n += got.length;
        if (c.kind === 'named') { sv.names.push(c.name); sv.ips.push(ip(octets[0])); }
      });
      waiting.sort(function (a, b) { return a - b; });
      if (waiting.length) {
        item.none.n += waiting.length;
        if (c.kind === 'named') item.none.names.push(c.name);
        if (c.kind === 'named' || !s.cohorts.some(function (x) { return x === c; })) {
          // a named client, or a batch that has no cohort yet: it waits as itself
          c.buckets = waiting.map(function (i) { return c.buckets[i]; });
          c.n = waiting.length;
          c.phase = 'waiting'; c.server = null; c.octets = []; c.expires = null; c.len = null; c.granted = null;
          if (s.cohorts.indexOf(c) < 0) s.cohorts.push(c);
        } else {
          c.buckets = waiting.map(function (i) { return c.buckets[i]; });
          c.n = waiting.length;
        }
      } else if (c.kind !== 'named') {
        // every member of a batch got an address: the batch itself is gone
        s.cohorts = s.cohorts.filter(function (x) { return x !== c; });
      }
    });
    sortCohorts(s);
    return item;
  }

  /** Phase 2, T1: unicast REQUEST to the client's own server (rule 2: both servers renew their own clients). */
  function renew(s, list) {
    var out = [];
    SERVERS.forEach(function (id) {
      var mine = list.filter(function (c) { return c.server === id; });
      if (!mine.length) return;
      var item = { k: 'renew', server: id, names: [], n: 0, lost: !srv(s, id).up, len: null, routine: true };
      mine.forEach(function (c) {
        item.n += c.n;
        if (c.kind === 'named') item.names.push(c.name);
        if (item.lost) { c.phase = 'renewing'; item.routine = false; return; }   // no answer: the client waits for T2
        var len = leaseLen(s, id, true, c);
        if (len !== c.len) item.routine = false;
        item.len = len;
        grant(s, c, id, len);
      });
      out.push(item);
    });
    return out;
  }

  /** Phase 2, T2: broadcast REQUEST (rebinding); rules 5, 8, 9 decide who answers. */
  function rebind(s, list) {
    var item = { k: 'rebind', names: [], n: 0, lost: SERVERS.filter(function (id) { return !srv(s, id).up; }), silent: [], served: {}, none: { names: [], n: 0 } };
    list.forEach(function (c) {
      item.n += c.n;
      if (c.kind === 'named') item.names.push(c.name);
      var by = answerer(s, c.buckets[0], 'rebind', c);
      if (!failover(s)) SERVERS.forEach(function (id) { if (id !== c.server && srv(s, id).up && item.silent.indexOf(id) < 0) item.silent.push(id); });
      if (!by) { c.phase = 'rebinding'; item.none.n += c.n; if (c.kind === 'named') item.none.names.push(c.name); return; }
      var len = leaseLen(s, by, true, c);
      grant(s, c, by, len);
      var sv = item.served[by] = item.served[by] || { names: [], n: 0, len: len };
      sv.n += c.n;
      if (c.kind === 'named') sv.names.push(c.name);
    });
    return item;
  }

  /** The cohort's next timer: T1 while bound, T2 after a lost renewal, expiry after a lost rebind. */
  function timerOf(c) {
    if (c.phase === 'bound') return c.granted + c.len * T1;
    if (c.phase === 'renewing') return c.granted + c.len * T2;
    if (c.phase === 'rebinding') return c.expires;
    return null;
  }

  /** Horizon: client timers are followed until span after the last arrival or admin action (MCLT for failover, the
      scope's lease for the split scope), and after a failure at least until the failed server's clients reach T2
      (watch), so a failure pressed late still shows them renewing; state changes are always followed. */
  function horizon(s) { return Math.max(s.anchor, s.watch) + (failover(s) ? s.mclt : LEASE); }

  function stateDue(s) {
    var out = [];
    var b = srv(s, 'DHCP2');
    if (b.switchAt !== null) out.push(b.switchAt);
    if (b.takeoverAt !== null && !b.whole) out.push(b.takeoverAt);
    return out;
  }
  function clientDue(s) {
    var out = [];
    if (!s.arrived[0]) out.push(0);
    if (!s.arrived[1] && s.newClients > 0) out.push(s.tNew);
    s.cohorts.forEach(function (c) { var x = timerOf(c); if (x !== null) out.push(x); });
    // up to the horizon, and on to a state change still to come (the moments in between are routine: SPEC "Folding")
    var h = Math.max(horizon(s), Math.max.apply(null, [-1].concat(stateDue(s))) - 1);
    return out.filter(function (x) { return x <= h; });
  }
  function nextTime(s) {
    var all = stateDue(s).concat(clientDue(s));
    return all.length ? Math.min.apply(null, all) : null;
  }

  /** Admin actions: fail DHCP1 lands in the step after step failAt; PARTNER DOWN in the step after pdAt, but never
      before the failure (pressed together: one step later). Binding updates of a moment go first (SPEC tie-break T3). */
  function actionDue(s, p, n) {
    if (p.failAt >= 0 && p.failAt <= n - 1 && srv(s, 'DHCP1').up && !s.failedAt) return 'fail';
    // PARTNER DOWN: after the failure's own step (failedAt), and only from COMMUNICATION INTERRUPTED (so never in a split scope)
    if (p.pdAt >= 0 && p.pdAt <= n - 1 && s.failedAt && srv(s, 'DHCP2').state === 'commInt') return 'pd';
    return null;
  }

  /** The cohorts a server owes an update for, each once, in the order they were granted. */
  function pendingKeys(s, from) {
    var out = [];
    s.pending.forEach(function (x) { if (x.from === from && out.indexOf(x.key) < 0) out.push(x.key); });
    return out;
  }

  /** What a server's database holds: { own, partner } leases it knows, by who gave them; a server that is down keeps
      what it had when it failed. */
  function knownOf(s, id) {
    var x = srv(s, id);
    if (!x.up && x.frozen) return { own: x.frozen.own, partner: x.frozen.partner };
    var out = { own: 0, partner: 0 };
    s.cohorts.forEach(function (c) { var k = c.known[id]; if (k) out[k.by === id ? 'own' : 'partner'] += c.n; });
    return out;
  }

  function enterPartnerDown(s, how) {
    var b = srv(s, 'DHCP2');
    b.state = 'partnerDown';
    b.pdAt = s.t;
    b.switchAt = null;
    b.takeoverAt = s.t + s.mclt;    // rule 6: the whole pool only after MCLT
    s.anchor = Math.max(s.anchor, s.t);
    return { k: 'state', what: 'pd', server: 'DHCP2', by: how, until: b.takeoverAt };
  }

  /** One step; returns the event. s is the caller's copy. */
  function advance(s, p, n) {
    var e = { n: n, items: [] };
    var reachable = srv(s, 'DHCP1').up && srv(s, 'DHCP2').up;
    // phase 3 of the moment just shown: binding updates, when the partner is reachable
    if (failover(s) && reachable && s.pending.length) {
      e.kind = 'bnd';
      SERVERS.forEach(function (from) {
        var keys = pendingKeys(s, from);
        if (!keys.length) return;
        var item = { k: 'bnd', from: from, to: other(from), names: [], n: 0 };
        keys.forEach(function (key) {
          var c = s.cohorts.filter(function (x) { return x.key === key; })[0];
          if (!c || c.server !== from) return;
          c.known[other(from)] = { by: from, expires: c.expires };
          c.acked = true;
          item.n += c.n;
          if (c.kind === 'named') item.names.push(c.name);
        });
        if (item.n) e.items.push(item);
      });
      s.pending = [];
      e.t = s.t;
      return e;
    }
    var act = actionDue(s, p, n);
    if (act) {
      var nt = nextTime(s);
      s.t = nt === null ? s.t + ACTION_DELAY : Math.min(s.t + ACTION_DELAY, Math.max(s.t, nt));
      e.kind = 'action';
      if (act === 'fail') {
        var a = srv(s, 'DHCP1');
        a.up = false; a.state = 'down';
        a.frozen = knownOf(s, 'DHCP1');   // its database stops as it was (SPEC rule 1)
        s.cohorts.forEach(function (c) { if (c.server === 'DHCP1' && c.phase === 'bound') s.watch = Math.max(s.watch, c.granted + c.len * T2); });
        s.failedAt = n;
        s.anchor = Math.max(s.anchor, s.t);
        e.items.push({ k: 'state', what: 'down', server: 'DHCP1' });
        if (failover(s)) {
          var b = srv(s, 'DHCP2');
          b.state = 'commInt'; b.since = s.t;
          if (s.switchover) b.switchAt = s.t + s.switchover;   // rule 6: automatic PARTNER DOWN
          e.items.push({ k: 'state', what: 'commInt', server: 'DHCP2', switchAt: b.switchAt });
        }
      } else {
        e.items.push(enterPartnerDown(s, 'admin'));
      }
      e.t = s.t;
      return e;
    }
    var t = nextTime(s);
    if (t === null) return null;
    s.t = t;
    e.kind = 'time';
    // phase 1: state changes
    var b2 = srv(s, 'DHCP2');
    if (b2.switchAt !== null && b2.switchAt === t && b2.state === 'commInt') e.items.push(enterPartnerDown(s, 'auto'));
    if (b2.takeoverAt !== null && b2.takeoverAt === t && !b2.whole) {
      b2.whole = true;
      e.items.push({ k: 'state', what: 'takeover', server: 'DHCP2', pdAt: b2.pdAt });
    }
    // phase 2: client messages. Renewals, rebinds, then DISCOVERs: the waiting first, then expired leases, then
    // arrivals (SPEC tie-break T2).
    var due = clientDue(s).indexOf(t) >= 0 ? s.cohorts.filter(function (c) { return timerOf(c) === t; }) : [];
    var r1 = due.filter(function (c) { return c.phase === 'bound'; });
    var r2 = due.filter(function (c) { return c.phase === 'renewing'; });
    var ex = due.filter(function (c) { return c.phase === 'rebinding'; });
    var waiting = s.cohorts.filter(function (c) { return c.phase === 'waiting'; });
    if (r1.length) e.items = e.items.concat(renew(s, r1));
    if (r2.length) e.items.push(rebind(s, r2));
    if (waiting.length) e.items.push(discover(s, waiting, 'retry'));
    if (ex.length) {
      // rule 8: the lease ends; the address goes back, the servers that are up forget it, the client starts again
      ex.forEach(function (c) {
        giveBack(s, c.octets);
        c.octets = [];
        SERVERS.forEach(function (id) { if (srv(s, id).up) delete c.known[id]; });
        c.phase = 'init';
      });
      var batches = ex.filter(function (c) { return c.kind !== 'named'; });
      s.cohorts = s.cohorts.filter(function (c) { return batches.indexOf(c) < 0; });
      e.items.push(discover(s, ex.map(function (c) {
        if (c.kind === 'named') return c;
        return { key: c.key, kind: c.kind, order: c.order, n: c.n, buckets: c.buckets.slice(), known: {} };
      }), 'expired'));
    }
    var arrivals = [];
    if (!s.arrived[0] && t === 0) {
      s.arrived[0] = true;
      NAMED.forEach(function (x) {
        arrivals.push({ key: x.name, kind: 'named', name: x.name, mac: x.mac, n: 1, buckets: [x.bucket], known: {}, phase: 'init', server: null, octets: [] });
      });
      var no = OTHERS[s.mode];
      arrivals.push({ key: 'others', kind: 'others', order: 0, n: no, buckets: spread(no), known: {} });
    }
    if (!s.arrived[1] && s.newClients > 0 && t === s.tNew) {
      s.arrived[1] = true;
      arrivals.push({ key: 'new', kind: 'new', order: 1, n: s.newClients, buckets: spread(s.newClients), known: {} });
    }
    if (arrivals.length) e.items.push(discover(s, arrivals, 'arrive'));
    e.t = s.t;
    return e;
  }

  /** A routine moment: only renewals answered by the server that gave the lease, for the same length as before, and
      retries that again get no offer. */
  function routine(e) {
    return e.items.every(function (x) {
      if (x.k === 'renew') return x.routine;
      if (x.k === 'discover') return x.why === 'retry' && Object.keys(x.served).length === 0;
      return false;
    });
  }

  var logic = {
    defaults: { mode: 'loadBalance', share: 50, reserve: 5, mclt: 60, switchover: 0, newClients: 6, failAt: -1, pdAt: -1 },

    LEASE: LEASE, T1: T1, T2: T2, MIN: MIN, HOUR: HOUR, DAY: DAY, RANGE: RANGE, SPLIT: SPLIT, NAMED: NAMED, OTHERS: OTHERS,
    MODES: MODES, MCLTS: MCLTS, SERVERS: SERVERS, MAX_STEPS: MAX_STEPS, ACTION_DELAY: ACTION_DELAY,

    /** Steps for these params: until nothing is left to happen, at most MAX_STEPS. */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (n < MAX_STEPS) {
        var nx = logic.step(s, n + 1, p);
        if (nx === s) break;
        s = nx; n++;
      }
      return n;
    },

    /** State at step 0: the relationship (or the two scopes) configured, nobody has an address yet. */
    initial: function (p) {
      var mode = MODES.indexOf(p.mode) >= 0 ? p.mode : 'loadBalance';
      var q = { mode: mode, share: Math.min(90, Math.max(10, Number(p.share) || 50)), reserve: Math.min(20, Math.max(1, Number(p.reserve) || 5)) };
      var ranges = poolRanges(q);
      var mclt = (MCLTS.indexOf(Number(p.mclt)) >= 0 ? Number(p.mclt) : 60) * MIN;
      var fo = mode !== 'splitScope';
      var mk = function (id) {
        return { id: id, up: true, state: fo ? 'normal' : 'solo', since: 0, pdAt: null, switchAt: null, takeoverAt: null, whole: false, frozen: null };
      };
      var nNew = Math.max(0, Math.min(60, Math.round(Number(p.newClients) || 0)));
      var tNew = fo ? mclt / 2 : 30 * MIN;
      return {
        t: 0, mode: mode, share: q.share, reserve: q.reserve, mclt: mclt,
        switchover: fo && Number(p.switchover) > 0 ? Number(p.switchover) * MIN : 0,
        newClients: nNew,
        tNew: tNew,
        ranges: ranges,
        pools: { A: seq(ranges.A[0], ranges.A[1]), B: seq(ranges.B[0], ranges.B[1]) },
        servers: [mk('DHCP1'), mk('DHCP2')],
        cohorts: [], pending: [], arrived: [false, false], seq: 0, failedAt: 0, watch: 0,
        anchor: nNew > 0 ? tNew : 0,   // the last arrival or admin action (horizon)
        msgs: [], done: false
      };
    },

    /** State after step n; the same object when nothing is left (steps() stops there). Routine moments are folded
        into the next step that is not (SPEC "Folding"); routine moments at the end are dropped. */
    step: function (s0, n, p) {
      if (s0.done) return s0;
      var s = clone(s0);
      var folded = null, lastFolded = false;
      for (var guard = 0; guard < 5000; guard++) {
        var e = advance(s, p, n);
        if (!e) return s0;
        if ((e.kind === 'time' && routine(e)) || (e.kind === 'bnd' && lastFolded)) {
          folded = folded || { times: [], n: 0, by: [], len: null, retry: 0 };
          if (e.kind === 'time') {
            folded.times.push(e.t);
            e.items.forEach(function (x) {
              if (x.k === 'renew') { folded.n += x.n; folded.len = x.len; if (folded.by.indexOf(x.server) < 0) folded.by.push(x.server); }
              if (x.k === 'discover') folded.retry = x.n;
            });
          }
          lastFolded = true;
          continue;
        }
        if (folded) e.folded = folded;
        s.msgs.push(e);
        return s;
      }
      return s0;
    },

    // for the page and the tests
    ip: ip, spread: spread, bucketOwner: bucketOwner, poolRanges: poolRanges, usable: usable, freeFor: freeFor,
    answerer: answerer, leaseLen: leaseLen, routine: routine, timerOf: timerOf, horizon: horizon,
    server: srv, isFailover: failover,
    /** Clients holding an address now, per server that gave it. */
    bound: function (s) {
      var out = { DHCP1: 0, DHCP2: 0, waiting: 0 };
      s.cohorts.forEach(function (c) { if (c.phase === 'waiting' || c.phase === 'init') out.waiting += c.n; else out[c.server] += c.n; });
      return out;
    },
    known: knownOf,
    /** Binding updates a server owes its partner. */
    unsent: function (s, id) {
      return pendingKeys(s, id).reduce(function (a, key) {
        var c = s.cohorts.filter(function (y) { return y.key === key && y.server === id; })[0];
        return a + (c ? c.n : 0);
      }, 0);
    },
    named: function (s, name) { return s.cohorts.filter(function (c) { return c.kind === 'named' && c.name === name; })[0] || null; }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
