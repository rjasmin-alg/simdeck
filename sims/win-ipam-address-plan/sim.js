/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-ipam-address-plan: an address plan as IPAM records it. One IP address block (192.168.1.0/24 or
   10.20.0.0/16) holds one IP address range per need (a department, a VLAN, a router link); each range is the smallest
   prefix that holds the need's hosts plus growth, placed largest first (or as listed), each aligned on its own size
   (URM book, ch. 9, Primjer 1). A need added later (Nabava) takes the lowest aligned free slot without moving the
   ranges already in use. When the ranges do not fit, the first one that cannot be placed is marked (SPEC.md).
   Explorer: no steps; every param change recomputes the plan from scratch.
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. */
(function (root) {
  'use strict';

  // ── from sims/vlsm/sim.js @ b8448ec (the urm-vlsm arithmetic, catalogue §5.21) ──

  var MAX_PREFIX = 30;   // /31 (RFC 3021) is out of scope; a router link gets a /30

  /** The smallest block that holds `hosts` usable addresses: the largest n ≤ 30 with 2^(32 − n) − 2 ≥ hosts. */
  function prefixFor(hosts) {
    for (var n = MAX_PREFIX; n >= 1; n--) if (Math.pow(2, 32 - n) - 2 >= hosts) return n;
    return 1;
  }

  /** Addresses in a block of prefix n: 2^(32 − n). */
  function blockSize(n) { return Math.pow(2, 32 - n); }

  /** Usable addresses in a block of prefix n: the network and broadcast addresses left out. */
  function usable(n) { return blockSize(n) - 2; }

  /** The mask of a prefix length, as an unsigned 32-bit number. */
  function mask(n) { return n <= 0 ? 0 : (0xffffffff << (32 - n)) >>> 0; }

  /** Unsigned 32-bit number → "a.b.c.d". */
  function format(v) { return [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.'); }

  /** The order in which blocks are placed, as indices into `sizes`. 'largest': biggest first, equal sizes keep the
      list order (the tie-break). 'list': the list order. */
  function order(sizes, how) {
    var idx = sizes.map(function (s, i) { return i; });
    if (how === 'list') return idx;
    idx.sort(function (a, b) { return sizes[b] - sizes[a] || a - b; });
    return idx;
  }

  /** Place blocks of the given sizes in the given order into a space of `space` addresses, each at the next start
      that is a multiple of its size, never before the end of the previous block. A block that does not fit is left
      out and the cursor stays where it was. Returns per-index starts (null = did not fit), the holes left in front of
      blocks, and the end of the last placed block. */
  function allocate(sizes, seq, space) {
    var start = sizes.map(function () { return null; });
    var holes = [], pos = 0;
    seq.forEach(function (i) {
      var size = sizes[i];
      var at = Math.ceil(pos / size) * size;
      if (at + size > space) return;
      if (at > pos) holes.push({ start: pos, size: at - pos, before: i });
      start[i] = at;
      pos = at + size;
    });
    return { start: start, holes: holes, end: pos };
  }

  // ── new here: growth, later additions, free space, the IPAM block → range → address hierarchy ──

  /** Hosts a range must hold: ceil(hosts × (1 + growth / 100)), in integers. A router link has exactly two ends and
      does not grow (rule 6). */
  function needed(hosts, growth, link) {
    if (link) return hosts;
    return Math.floor((hosts * (100 + growth) + 99) / 100);
  }

  /** Free intervals [from, to] (inclusive offsets) of a space of `space` addresses, given placed [start, size]
      pairs that do not overlap. */
  function freeOf(placed, space) {
    var segs = placed.slice().sort(function (a, b) { return a[0] - b[0]; });
    var out = [], pos = 0;
    segs.forEach(function (s) {
      if (s[0] > pos) out.push([pos, s[0] - 1]);
      pos = Math.max(pos, s[0] + s[1]);
    });
    if (pos < space) out.push([pos, space - 1]);
    return out;
  }

  /** The lowest start in the free intervals that is a multiple of `size` and holds the whole block; null if none
      (an addition never moves a range that is already in use). */
  function firstFit(size, free) {
    for (var k = 0; k < free.length; k++) {
      var at = Math.ceil(free[k][0] / size) * size;
      if (at + size - 1 <= free[k][1]) return at;
    }
    return null;
  }

  var BLOCKS = {
    '192.168.1.0/24': { base: 3232235776, prefix: 24 },  // 192.168.1.0, inside RFC 1918's 192.168.0.0/16
    '10.20.0.0/16': { base: 169082880, prefix: 16 }      // 10.20.0.0, inside RFC 1918's 10.0.0.0/8
  };

  /** Grafo d.o.o. (URM ch. 9 Primjer 1; VLAN numbers from ch. 12): name keys go through strings.js. */
  var GRAFO = [
    { id: 'sales', hosts: 60, site: 'hq', vlan: 10 },
    { id: 'production', hosts: 28, site: 'hq', vlan: 20 },
    { id: 'management', hosts: 12, site: 'hq', vlan: 30 },
    { id: 'branch', hosts: 10, site: 'branch', vlan: null },
    { id: 'guests', hosts: 6, site: 'hq', vlan: 40 },
    { id: 'link', hosts: 2, site: 'wan', vlan: null, link: true }
  ];
  /** Nabava, 4 hosts (URM ch. 12 Primjer 3); its VLAN is the book's open question, so none is given. */
  var NABAVA = { id: 'purchasing', hosts: 4, site: 'hq', vlan: null };
  /** Two sites (the task's own example): Zagreb 6 VLANs of 200 hosts, Split 3 VLANs of 100. */
  var TWO_SITES = [10, 20, 30, 40, 50, 60].map(function (v) { return { id: 'zg' + v, hosts: 200, site: 'zagreb', vlan: v }; })
    .concat([10, 20, 30].map(function (v) { return { id: 'st' + v, hosts: 100, site: 'split', vlan: v }; }));

  /** The needs list for a set of params, in list order: the set, Nabava appended when it is planned with the rest
      or added later, and `first` moved to the top. */
  function needsOf(p) {
    var list = (p.twoSites ? TWO_SITES : GRAFO).map(function (n) { return Object.assign({}, n); });
    if (!p.twoSites && (p.nabava === 'add' || p.nabava === 'plan')) {
      list.push(Object.assign({ added: p.nabava === 'add' }, NABAVA));
    }
    var k = -1;
    list.forEach(function (n, i) { if (n.id === p.first && k < 0) k = i; });
    if (k > 0) list.unshift(list.splice(k, 1)[0]);
    return list;
  }

  /** The whole plan for one set of params. Every number the page shows is computed here. */
  function plan(p) {
    var blk = BLOCKS[p.block] || BLOCKS['192.168.1.0/24'];
    var space = blockSize(blk.prefix);
    var growth = Math.max(0, Math.min(200, Number(p.growth) || 0));
    var list = needsOf(p);
    var items = list.map(function (n) {
      var need = needed(n.hosts, growth, !!n.link);
      var pre = prefixFor(need);
      return {
        id: n.id, hosts: n.hosts, site: n.site, vlan: n.vlan, link: !!n.link, added: !!n.added,
        needed: need, prefix: pre, size: blockSize(pre), usable: usable(pre), start: null
      };
    });

    // Rule 2: the needs planned together (all but a later addition), largest first or as listed.
    var base = [], later = [];
    items.forEach(function (it, i) { (it.added ? later : base).push(i); });
    var sizes = base.map(function (i) { return items[i].size; });
    var seq = order(sizes, p.strategy === 'listed' ? 'list' : 'largest');
    var a = allocate(sizes, seq, space);
    var placeOrder = seq.map(function (k) { return base[k]; });
    seq.forEach(function (k) { items[base[k]].start = a.start[k]; });

    // A later addition: the lowest aligned free slot; the ranges in use stay where they are.
    later.forEach(function (i) {
      var placed = items.filter(function (it) { return it.start !== null; }).map(function (it) { return [it.start, it.size]; });
      var it = items[i];
      it.cursor = placed.reduce(function (m, s) { return Math.max(m, s[0] + s[1]); }, 0);
      it.start = firstFit(it.size, freeOf(placed, space));
      placeOrder.push(i);
    });

    var ranges = items.map(function (it, i) {
      var ok = it.start !== null;
      var r = {
        id: it.id, hosts: it.hosts, needed: it.needed, site: it.site, vlan: it.vlan, link: it.link, added: it.added,
        listed: i, rank: placeOrder.indexOf(i),
        prefix: it.prefix, total: it.size, usable: it.usable, placed: ok,
        start: ok ? it.start : null, end: ok ? it.start + it.size - 1 : null,
        network: ok ? blk.base + it.start : null,
        broadcast: ok ? blk.base + it.start + it.size - 1 : null,
        mask: mask(it.prefix),
        // IPAM: a range starts and ends on usable addresses; a client VLAN is a DHCP scope, a link is static (rule 5)
        first: ok ? blk.base + it.start + 1 : null,
        last: ok ? blk.base + it.start + it.size - 2 : null,
        managedBy: it.link ? 'ipam' : 'dhcp',
        util: Math.round(100 * it.hosts / it.usable),
        full: !it.link && it.hosts >= it.usable
      };
      if (it.added) r.cursor = it.cursor;
      return r;
    });

    var placedSegs = ranges.filter(function (r) { return r.placed; }).map(function (r) { return [r.start, r.total]; });
    var lastEnd = placedSegs.reduce(function (m, s) { return Math.max(m, s[0] + s[1]); }, 0);
    // A free interval in front of a range is a gap (alignment, or an order that left a hole); the rest is reserve.
    var free = freeOf(placedSegs, space).map(function (f) {
      return { from: f[0], to: f[1], size: f[1] - f[0] + 1, gap: f[1] < lastEnd };
    });
    var sum = ranges.reduce(function (t, r) { return t + r.total; }, 0);
    var used = ranges.reduce(function (t, r) { return t + (r.placed ? r.total : 0); }, 0);
    var unplaced = placeOrder.filter(function (i) { return !ranges[i].placed; }).map(function (i) { return ranges[i].id; });

    var errors = [];
    if (sum > space) errors.push({ code: 'sum', sum: sum, space: space });
    unplaced.forEach(function (id) { errors.push({ code: 'noRoom', id: id }); });

    var byAddress = ranges.filter(function (r) { return r.placed; }).sort(function (x, y) { return x.start - y.start; })
      .concat(placeOrder.map(function (i) { return ranges[i]; }).filter(function (r) { return !r.placed; }));

    return {
      block: { name: p.block in BLOCKS ? p.block : '192.168.1.0/24', base: blk.base, prefix: blk.prefix, size: space,
        broadcast: blk.base + space - 1 },
      growth: growth,
      strategy: p.strategy === 'listed' ? 'listed' : 'largest',
      ranges: ranges,                       // list order
      order: byAddress.map(function (r) { return r.id; }),   // address order, unplaced last (the table)
      placeOrder: placeOrder.map(function (i) { return ranges[i].id; }),
      free: free,
      freeTotal: space - used,
      gapTotal: free.reduce(function (t, f) { return t + (f.gap ? f.size : 0); }, 0),
      sum: sum,
      used: used,
      end: lastEnd,
      fits: unplaced.length === 0,
      firstUnplaced: unplaced.length ? unplaced[0] : null,
      errors: errors
    };
  }

  var logic = {
    defaults: { block: '192.168.1.0/24', growth: 0, nabava: 'off', strategy: 'largest', twoSites: false, first: '', sel: '' },
    blocks: Object.keys(BLOCKS),
    steps: 0,

    /** The presets of the task (SPEC.md §4); the page gives them labels. */
    presets: [
      { id: 'grafo', params: {} },
      { id: 'add-nabava', params: { nabava: 'add', sel: 'purchasing' } },
      { id: 'double-growth', params: { growth: 100 } },
      { id: 'as-listed', params: { strategy: 'listed', first: 'guests' } },
      { id: 'two-sites', params: { block: '10.20.0.0/16', twoSites: true } }
    ],

    initial: function (p) { return plan(p); },
    step: function (s) { return s; },

    plan: plan,
    needsOf: needsOf,
    needed: needed,
    freeOf: freeOf,
    firstFit: firstFit,
    prefixFor: prefixFor,
    blockSize: blockSize,
    usable: usable,
    mask: mask,
    format: format,
    order: order,
    allocate: allocate,
    GRAFO: GRAFO,
    NABAVA: NABAVA,
    TWO_SITES: TWO_SITES
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
