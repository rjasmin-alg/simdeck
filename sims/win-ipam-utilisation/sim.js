/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-ipam-utilisation: IPAM's utilisation view of one block (10.0.0.0/16) and the five IP address
   ranges (DHCP scopes) in it, served by DHCP1 and DHCP2. A week of the term (0–16) drives the students range:
   residents grow by `growth` a week, and each day's `visitors` leave the same day but keep their lease until it
   expires. Each range gets a utilisation and a status (under / optimal / over) against two thresholds; the block
   sums its ranges, counting a failover scope once (SPEC.md §4).
   Explorer: no steps; every param change recomputes the view from scratch.
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. */
(function (root) {
  'use strict';

  // ── from sims/win-ipam-address-plan/sim.js @ a22e9ec (block → range objects, address formatting) ──

  /** Unsigned 32-bit number → "a.b.c.d". */
  function format(v) { return [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.'); }

  /** "a.b.c.d" → unsigned 32-bit number. */
  function parse(s) { return s.split('.').reduce(function (v, o) { return v * 256 + Number(o); }, 0); }

  // ── new here: leases over a term, utilisation, thresholds and status ──

  var WEEKS = 16;
  var BLOCK = { name: '10.0.0.0/16', base: parse('10.0.0.0'), prefix: 16, size: 65536 };

  /** The ranges of the block (SPEC.md §2). `servers` lists who reports the scope; two means a failover pair.
      Only `students` follows the params; the others are steady over the term. */
  var RANGES = [
    { id: 'staff', servers: ['DHCP1'], start: '10.0.0.1', end: '10.0.15.254', residents0: 2600, growth: 0, visitors: 0, lease: 8, reserved: 0 },
    { id: 'labs', servers: ['DHCP2'], start: '10.0.16.1', end: '10.0.31.254', residents0: 2400, growth: 0, visitors: 0, lease: 8, reserved: 0 },
    { id: 'phones', servers: ['DHCP2'], start: '10.0.32.1', end: '10.0.35.254', residents0: 694, growth: 0, visitors: 0, lease: 8, reserved: 0 },
    { id: 'students', servers: ['DHCP1', 'DHCP2'], start: '10.0.40.20', end: '10.0.40.219', residents0: 40, growth: 10, visitors: 15, lease: 8, reserved: 0, live: true },
    { id: 'servers', servers: ['DHCP1'], start: '10.0.50.1', end: '10.0.50.254', residents0: 0, growth: 0, visitors: 0, lease: 8, reserved: 6 }
  ];
  var SERVERS = ['DHCP1', 'DHCP2'];

  function sizeOf(r) { return parse(r.end) - parse(r.start) + 1; }

  /** Rule 3: what a range holds at week w. Residents first (they hold an address all term), then visitor leases
      (`lease` days of visitors at once); today's visitors are the newest of those. Rule 5: what does not fit is
      refused. Reservations count as used (rule 1). */
  function leasesAt(r, w) {
    var size = sizeOf(r);
    var cap = Math.max(0, size - r.reserved);
    var residents = r.residents0 + r.growth * w;
    var visitorLeases = r.visitors * r.lease;
    var demand = residents + visitorLeases;
    var resHeld = Math.min(residents, cap);
    var visHeld = Math.min(visitorLeases, cap - resHeld);
    var today = Math.min(r.visitors, visHeld);
    var leased = resHeld + visHeld;
    return {
      size: size, residents: resHeld, visitorLeases: visHeld, today: today, gone: visHeld - today,
      reserved: Math.min(r.reserved, size), leased: leased, used: Math.min(size, leased + r.reserved),
      demand: demand, refused: Math.max(0, demand - cap)
    };
  }

  /** Rule 2: status against the thresholds, in integers; exactly at a threshold is optimal (the tie-break). */
  function status(used, size, th) {
    if (used * 100 < th.under * size) return 'under';
    if (used * 100 > th.over * size) return 'over';
    return 'optimal';
  }

  /** Rule 1: utilisation in per cent, exact (not rounded; the page rounds for display only). */
  function utilOf(used, size) { return 100 * used / size; }

  /** Rule 4: the start of the collection interval that holds `hour` (IPAM shows the last collection's numbers). */
  function collectedAt(hour, interval) { return Math.floor(hour / interval) * interval; }

  /** Rule 6: the scopes each server reports (a failover scope appears under both). */
  function reports(ranges) {
    return SERVERS.map(function (s) {
      return { server: s, scopes: ranges.filter(function (r) { return r.servers.indexOf(s) >= 0; }).map(function (r) { return r.id; }) };
    });
  }

  /** Rule 6: the block's used addresses: each distinct scope once, however many servers report it. */
  function blockUsed(rep, usedById) {
    var seen = {}, sum = 0;
    rep.forEach(function (x) {
      x.scopes.forEach(function (id) { if (!seen[id]) { seen[id] = true; sum += usedById[id]; } });
    });
    return sum;
  }

  /** A param within [lo, hi], rounded to a whole number; missing or not a number → the default. */
  function clamp(v, lo, hi, dflt) {
    if (v === null || v === undefined || v === '') return dflt;
    v = Number(v);
    return Number.isFinite(v) ? Math.round(Math.max(lo, Math.min(hi, v))) : dflt;
  }

  /** The ranges with the params applied to the live (students) range. */
  function rangesOf(p) {
    return RANGES.map(function (r) {
      var x = Object.assign({}, r, { servers: r.servers.slice() });
      if (r.live) {
        x.growth = clamp(p.growth, 0, 20, 10);
        x.visitors = clamp(p.visitors, 0, 30, 15);
        x.lease = Number(p.lease) === 1 ? 1 : 8;
      }
      return x;
    });
  }

  var VIEW_HOUR = 9.5;      // the view is read on Monday 09:30 of the week (rule 4)
  var INTERVAL = 2;         // hours between IPAM's address-utilisation collections (check)

  /** The whole view for one set of params. Every number the page shows is computed here. */
  function view(p) {
    var week = clamp(p.week, 0, WEEKS, 0);
    var th = { under: clamp(p.under, 5, 40, 20), over: clamp(p.over, 60, 95, 80) };   // the params' bounds: under < over always
    var list = rangesOf(p);
    var rep = reports(list);

    function snapshot(w) {
      var used = {};
      var rows = list.map(function (r) {
        var l = leasesAt(r, w);
        used[r.id] = l.used;
        return { id: r.id, l: l };
      });
      var bu = blockUsed(rep, used);
      return { rows: rows, blockUsed: bu };
    }

    var term = [];
    for (var w = 0; w <= WEEKS; w++) term.push(snapshot(w));
    var now = term[week];

    var ranges = list.map(function (r, i) {
      var l = now.rows[i].l;
      var trend = term.map(function (snap) { return utilOf(snap.rows[i].l.used, l.size); });
      var firstOver = null, firstFull = null;
      term.forEach(function (snap, k) {
        var u = snap.rows[i].l;
        if (firstOver === null && status(u.used, u.size, th) === 'over') firstOver = k;
        if (firstFull === null && u.used >= u.size) firstFull = k;
      });
      return {
        id: r.id, servers: r.servers, failover: r.servers.length > 1, live: !!r.live,
        start: r.start, end: r.end, size: l.size,
        residents: l.residents, visitorLeases: l.visitorLeases, today: l.today, gone: l.gone, reserved: l.reserved,
        leased: l.leased, used: l.used, free: l.size - l.used, demand: l.demand, refused: l.refused,
        full: l.used >= l.size,
        util: utilOf(l.used, l.size), status: status(l.used, l.size, th),
        trend: trend, firstOver: firstOver, firstFull: firstFull,
        lease: r.lease, growth: r.growth, visitors: r.visitors, residents0: r.residents0
      };
    });

    var inRanges = ranges.reduce(function (t, r) { return t + r.size; }, 0);
    var naive = rep.reduce(function (t, x) {
      return t + x.scopes.reduce(function (s, id) { return s + ranges.filter(function (r) { return r.id === id; })[0].used; }, 0);
    }, 0);
    var blockTrend = term.map(function (snap) { return utilOf(snap.blockUsed, BLOCK.size); });

    return {
      week: week, weeks: WEEKS, thresholds: th,
      block: {
        name: BLOCK.name, base: BLOCK.base, prefix: BLOCK.prefix, size: BLOCK.size,
        used: now.blockUsed, inRanges: inRanges, naiveUsed: naive,
        util: utilOf(now.blockUsed, BLOCK.size), status: status(now.blockUsed, BLOCK.size, th),
        trend: blockTrend
      },
      ranges: ranges,
      reports: rep,
      collected: { week: week, day: 'mon', hour: collectedAt(VIEW_HOUR, INTERVAL), interval: INTERVAL }
    };
  }

  var logic = {
    defaults: { week: 0, lease: 8, growth: 10, visitors: 15, over: 80, under: 20, sel: 'students' },
    steps: 0,
    weeks: WEEKS,

    /** The presets of the task (SPEC.md §6); the page gives them labels. */
    presets: [
      { id: 'byod-term', params: { week: 1 } },
      { id: 'short-lease', params: { lease: 1, week: 11 } },
      { id: 'hidden-hotspot', params: { week: 4, sel: 'block' } },
      { id: 'server-vlan-under', params: { sel: 'servers' } },
      { id: 'threshold-70', params: { lease: 1, over: 70, week: 9 } }
    ],

    initial: function (p) { return view(p); },
    step: function (s) { return s; },

    view: view,
    leasesAt: leasesAt,
    status: status,
    utilOf: utilOf,
    collectedAt: collectedAt,
    reports: reports,
    blockUsed: blockUsed,
    rangesOf: rangesOf,
    sizeOf: sizeOf,
    format: format,
    parse: parse,
    RANGES: RANGES,
    BLOCK: BLOCK,
    ids: RANGES.map(function (r) { return r.id; })
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
