/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-dns-scavenging: records of the zone corp.example over weeks. Clients register and refresh their A
   records; the zone's aging rules decide whether a refresh moves the timestamp (no-refresh interval) and when a
   record is stale (no-refresh + refresh); only the server's scavenging runs delete, and only once the zone may be
   scavenged. One step = one moment of interest (a time and a phase: clients first, then the run). Rules and
   numbers: SPEC.md.
   The aging part (refresh, update, isStale, zoneScavengeable, scavenge) is pure and string-free over records
   { name, type, data, owner, timestamp, static }, the record-lifecycle model of win-dns-dynamic-update (catalogue
   §5.21), so it can be promoted to models/ with it.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Times are hours since day 0 00:00.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var H = 24;
  var ZONE = 'corp.example';
  var MAX_STEPS = 20;

  // ── from sims/win-dns-dynamic-update/sim.js @ 7a49e71: the record shape and name lookup ──

  function rec(name, data, owner, timestamp) {
    return { name: name, type: 'A', data: data, owner: owner, timestamp: timestamp, static: false };
  }
  /** DNS names compare case-insensitively. */
  function key(name) { return String(name).toLowerCase(); }
  function find(records, name) {
    for (var i = 0; i < records.length; i++) if (key(records[i].name) === key(name)) return records[i];
    return null;
  }
  function byName(a, b) { return key(a.name) < key(b.name) ? -1 : key(a.name) > key(b.name) ? 1 : 0; }

  // ── aging and scavenging, as pure functions over a record and the zone's settings (promotable) ──

  /** Rule 1: a static record has no timestamp and never ages. */
  function ages(r) { return !r.static && r.timestamp !== null; }

  /** Rule 2, T2: a refresh is accepted from ts + noRefresh on and sets ts = now; before that it is ignored. */
  function refresh(r, zone, now) {
    if (!ages(r)) return { accepted: false, record: r, until: null };
    var from = r.timestamp + zone.noRefresh;
    if (now < from) return { accepted: false, record: r, until: from };
    return { accepted: true, record: Object.assign({}, r, { timestamp: now }), until: from };
  }

  /** Rule 3: an update (new data) is always accepted and sets ts = now, even inside the no-refresh interval. */
  function update(r, data, now) { return Object.assign({}, r, { data: data, timestamp: now }); }

  /** When a record turns stale: after ts + noRefresh + refresh (null for a static record). */
  function staleAfter(r, zone) { return ages(r) ? r.timestamp + zone.noRefresh + zone.refresh : null; }

  /** Rule 4, T3: stale only when now is strictly past ts + noRefresh + refresh. */
  function isStale(r, zone, now) { return ages(r) && now > staleAfter(r, zone); }

  /** Where a record stands at `now`: static, noRefresh, refresh or stale. */
  function stateOf(r, zone, now) {
    if (!ages(r)) return 'static';
    if (now < r.timestamp + zone.noRefresh) return 'noRefresh';
    return isStale(r, zone, now) ? 'stale' : 'refresh';
  }

  /** Rule 6, T4: a zone with aging on may be scavenged only strictly after canScavengeAfter. Reason or null. */
  function zoneBlocks(zone, now) {
    if (!zone.aging) return 'aging';
    if (!(now > zone.canScavengeAfter)) return 'notYet';
    return null;
  }

  /** One scavenging run over the records: { skipped, kept, deleted }. Rules 1, 4, 6. */
  function scavenge(records, zone, now) {
    var skipped = zoneBlocks(zone, now);
    if (skipped) return { skipped: skipped, kept: records.slice(), deleted: [] };
    var kept = [], deleted = [];
    records.forEach(function (r) { (isStale(r, zone, now) ? deleted : kept).push(r); });
    return { skipped: null, kept: kept, deleted: deleted };
  }

  /** When the first run deletes the record if nobody refreshes it: the first run strictly after both its stale point
      and the zone's canScavengeAfter (rules 4–6). Null when it never will. p: { scavenging, period } in days. */
  function deletionAt(r, zone, p) {
    if (!ages(r) || !zone.aging || !p.scavenging) return null;
    var per = p.period * H;
    var x = Math.max(staleAfter(r, zone), zone.canScavengeAfter);
    return (Math.floor(x / per) + 1) * per;
  }

  // ── the scene ──

  var STATIC = [{ name: 'fs1', data: '10.0.0.20' }];
  var SCENARIOS = {
    leaver: [
      { name: 'pc1', ip: '10.0.0.51', source: 'client' },
      { name: 'pc2', ip: '10.0.0.52', source: 'client', leavesAt: 1 * H }
    ],
    printer: [{ name: 'prn4', ip: '10.0.0.40', source: 'dhcp' }],
    static: [
      { name: 'old-nas', ip: '10.0.0.30', source: 'manual' },
      { name: 'pc1', ip: '10.0.0.51', source: 'client' }
    ],
    move: [{ name: 'pc1', ip: '10.0.0.51', source: 'client', changeAt: 3 * H, newIp: '10.0.1.23' }]
  };
  var SCENARIO_IDS = ['leaver', 'printer', 'static', 'move'];

  /** Rule 8: how often a client's record is refreshed, in hours (null: nobody refreshes it). */
  function everyOf(source, p) {
    if (source === 'client') return 24;
    if (source === 'dhcp') return p.lease * H / 2;
    return null;
  }

  function clientsOf(p) {
    return SCENARIOS[p.scenario].map(function (c) {
      return { name: c.name, ip: c.ip, source: c.source, start: 0, every: everyOf(c.source, p),
        leavesAt: c.leavesAt === undefined ? null : c.leavesAt, changeAt: c.changeAt === undefined ? null : c.changeAt,
        newIp: c.newIp || null, gone: false };
    });
  }

  /** Rule 9: the longest refresh period of any client that refreshes, in hours; safe when refresh ≥ it. */
  function longestPeriod(p) {
    return clientsOf(p).reduce(function (m, c) { return c.every !== null && c.every > m ? c.every : m; }, 0);
  }
  function safe(p) { return p.refresh * H >= longestPeriod(p); }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /** Does client c act at time T (registration, a refresh, or its address change)? */
  function actsAt(c, T) {
    if (c.gone) return false;
    if (c.changeAt === T) return true;
    if (T === c.start) return true;
    return c.every !== null && T > c.start && (T - c.start) % c.every === 0;
  }

  /** Every time something may happen, up to the end: client actions and runs. Sorted. */
  function times(p) {
    var end = p.until * H, set = {};
    clientsOf(p).forEach(function (c) {
      set[c.start] = true;
      if (c.every !== null) for (var x = c.start; x <= end; x += c.every) set[x] = true;
      if (c.leavesAt !== null && c.leavesAt <= end) set[c.leavesAt] = true;
      if (c.changeAt !== null && c.changeAt <= end) set[c.changeAt] = true;
    });
    if (p.scavenging) for (var r = p.period * H; r <= end; r += p.period * H) set[r] = true;
    return Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
  }

  function isRun(p, T) { return p.scavenging && T > 0 && T % (p.period * H) === 0; }

  // ── the run, phase by phase ──

  /** Phase (1) at T: every client in list order. Returns true if something of interest happened. */
  function clientsPhase(s, T) {
    var interest = false;
    s.clients.forEach(function (c) {
      if (c.leavesAt === T && !c.gone) {
        c.gone = true;
        s.log.push({ k: 'leave', name: c.name, at: T });
        interest = true;
        return;
      }
      if (!actsAt(c, T)) return;
      var r = find(s.records, c.name);
      if (c.changeAt === T) {
        // rule 3, T5: the new address is one update, timestamp now
        var before = r ? r.data : null, prevTs = r ? r.timestamp : null;
        c.ip = c.newIp;
        put(s, r ? update(r, c.ip, T) : created(c, T));
        s.hist.push({ name: c.name, at: T, kind: 'update', ts: T });
        s.log.push({ k: 'update', name: c.name, from: before, data: c.ip, prevTs: prevTs, ts: T });
        s.changed.push(c.name);
        interest = true;
        return;
      }
      if (!r) {
        // a registration, or rule 10: the record was scavenged and the client's next update creates it again.
        // The admin's record (manual) is added once, on its start day.
        if (c.source === 'manual' && T !== c.start) return;
        var again = s.hist.some(function (h) { return h.kind === 'delete' && h.name === c.name; });
        put(s, created(c, T));
        s.hist.push({ name: c.name, at: T, kind: 'create', ts: T });
        s.log.push({ k: 'create', name: c.name, source: c.source, ts: T, again: again });
        s.changed.push(c.name);
        interest = true;
        return;
      }
      var res = refresh(r, s.zone, T);
      if (res.accepted) {
        put(s, res.record);
        s.hist.push({ name: c.name, at: T, kind: 'refresh', ts: T });
        s.log.push({ k: 'refresh', name: c.name, prevTs: r.timestamp, ts: T });
        s.changed.push(c.name);
        interest = true;
      } else {
        ignored(s, c.name, T, res.until);
      }
    });
    return interest;
  }

  function created(c, T) {
    var r = rec(c.name, c.ip, null, T);
    r.source = c.source;
    return r;
  }
  function put(s, r) {
    s.records = s.records.filter(function (x) { return key(x.name) !== key(r.name); }).concat([r]).sort(byName);
  }
  /** Ignored refreshes are not moments: they are counted into one log line per record until the next moment. */
  function ignored(s, name, T, until) {
    var e = s.pending.filter(function (x) { return x.name === name; })[0];
    if (e) { e.count++; e.last = T; e.until = until; }
    else s.pending.push({ k: 'ignored', name: name, count: 1, first: T, last: T, until: until });
  }

  /** Phase (2) at T: the scavenging run. Always a moment. */
  function runPhase(s, T) {
    var res = scavenge(s.records, s.zone, T);
    s.server.lastRun = T;
    s.server.nextRun = T + s.server.period;
    var entry = { k: 'run', at: T, skipped: res.skipped, canScavengeAfter: s.zone.canScavengeAfter, deleted: [], kept: [] };
    if (!res.skipped) {
      res.deleted.forEach(function (r) {
        entry.deleted.push({ name: r.name, ts: r.timestamp, staleAfter: staleAfter(r, s.zone) });
        s.hist.push({ name: r.name, at: T, kind: 'delete', ts: r.timestamp });
        s.changed.push(r.name);
      });
      res.kept.forEach(function (r) {
        if (ages(r)) entry.kept.push({ name: r.name, ts: r.timestamp, staleAfter: staleAfter(r, s.zone), state: stateOf(r, s.zone, T) });
      });
      s.records = res.kept;
    }
    s.hist.push({ kind: 'run', at: T, skipped: res.skipped, deleted: entry.deleted.map(function (d) { return d.name; }) });
    s.log.push(entry);
  }

  /** The next (time, phase) after the state's position, or null. */
  function nextSlot(s, p) {
    var ts = times(p);
    var order = s.phase === 'run' ? 1 : s.phase === 'clients' ? 0 : -1;
    for (var i = 0; i < ts.length; i++) {
      var T = ts[i];
      if (T < s.t) continue;
      if (T === s.t && order >= 0) {
        if (order === 0 && isRun(p, T)) return { t: T, phase: 'run' };
        continue;
      }
      return { t: T, phase: 'clients' };
    }
    return null;
  }

  /** Move to the next moment of interest; ignored refreshes on the way go into its log. Mutates s. */
  function advance(s, p) {
    s.log = [];
    s.changed = [];
    for (var slot = nextSlot(s, p); slot; slot = nextSlot(s, p)) {
      s.t = slot.t;
      s.phase = slot.phase;
      if (slot.phase === 'run') {
        runPhase(s, slot.t);
        break;
      }
      var interest = clientsPhase(s, slot.t);
      if (!isRun(p, slot.t)) s.phase = 'run'; // no run at this time: the slot is done
      if (interest) { s.phase = 'clients'; break; }
    }
    if (!s.log.length) {
      // nothing left: the end moment at day `until`
      s.t = p.until * H;
      s.phase = 'end';
      s.done = true;
      s.log.push({ k: 'end', at: s.t });
    }
    s.log = s.log.concat(s.pending);
    s.pending = [];
    return s;
  }

  /** Is there another moment after this one (a slot with interest, or the end moment)? */
  function nextMoment(s, p) {
    var c = clone(s);
    c.log = []; c.pending = [];
    for (var slot = nextSlot(c, p); slot; slot = nextSlot(c, p)) {
      c.t = slot.t; c.phase = slot.phase;
      if (slot.phase === 'run') return true;
      var interest = clientsPhase(c, slot.t);
      if (!isRun(p, slot.t)) c.phase = 'run';
      if (interest) return true;
    }
    return s.t < p.until * H;
  }

  function initialState(p) {
    var zone = { aging: p.aging, noRefresh: p.noRefresh * H, refresh: p.refresh * H, agingEnabledAt: 0,
      canScavengeAfter: p.refresh * H };
    var server = { scavenging: p.scavenging, period: p.period * H, lastRun: null, nextRun: p.scavenging ? p.period * H : null };
    var records = STATIC.map(function (x) {
      var r = rec(x.name, x.data, null, null);
      r.static = true;
      r.source = 'static';
      return r;
    });
    return { t: 0, phase: 'start', done: false, zone: zone, server: server, records: records,
      clients: clientsOf(p), hist: [], log: [], pending: [], changed: [] };
  }

  /** Number of moments from step 0, capped at MAX_STEPS. */
  function stepsOf(p) {
    var s = initialState(p), n = 0;
    while (!s.done && n < MAX_STEPS) {
      s = advance(clone(s), p);
      n++;
      if (s.phase !== 'end' && !nextMoment(s, p)) break;
    }
    return n;
  }

  var logic = {
    /** Parameter defaults (days): Microsoft's 7/7/7, the leaver scenario, three weeks. */
    defaults: { scenario: 'leaver', noRefresh: 7, refresh: 7, period: 7, scavenging: true, aging: true, lease: 8, until: 21 },

    H: H,
    ZONE: ZONE,
    MAX_STEPS: MAX_STEPS,
    SCENARIO_IDS: SCENARIO_IDS,

    steps: stepsOf,

    /** State at step 0: day 0 before anything has happened; only static records exist. */
    initial: function (p) { return initialState(p); },

    /** State after step n: the next moment of interest. */
    step: function (s0, n, p) {
      var s = advance(clone(s0), p);
      s.capped = n === MAX_STEPS && !s.done && nextMoment(s, p);
      return s;
    },

    // exported for the page and the tests
    rec: rec,
    find: find,
    ages: ages,
    refresh: refresh,
    update: update,
    staleAfter: staleAfter,
    isStale: isStale,
    stateOf: stateOf,
    zoneBlocks: zoneBlocks,
    scavenge: scavenge,
    deletionAt: deletionAt,
    clientsOf: clientsOf,
    everyOf: everyOf,
    longestPeriod: longestPeriod,
    safe: safe,
    times: times,
    isRun: isRun
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
