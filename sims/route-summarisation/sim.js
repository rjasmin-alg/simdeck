/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for route-summarisation: pick address blocks, get the one prefix that covers them all (the summary), what it
   covers besides them (over-coverage), and router R2's routing table before and after the summary replaces the
   picked routes via R1. Rules and numbers: SPEC.md. The plan is Grafo d.o.o.'s 192.168.1.0/24 from the URM book
   (ch. 9, Primjer 1), or four /24s (172.16.0.0 … 172.16.3.0).
   An explorer: no steps; the state is derived from the params.
   Pure: no DOM, no Math.random, no Date, no timers. Addresses are unsigned 32-bit numbers; state is plain JSON.
   The arithmetic (summarise, gaps, aligned, ownerPieces) is pure functions over plain data, ready for models/. */
(function (root) {
  'use strict';

  // from sims/routing-table/sim.js @ 06865b7 (parse, format, bits, mask, match, lookup); models/ has no IPv4 model yet
  /** "10.1.2.55" → unsigned 32-bit number, or null if it is not a dotted-quad IPv4 address. */
  function parse(str) {
    var parts = String(str).split('.');
    if (parts.length !== 4) return null;
    var v = 0;
    for (var i = 0; i < 4; i++) {
      if (!/^\d{1,3}$/.test(parts[i])) return null;
      var n = Number(parts[i]);
      if (n > 255) return null;
      v = v * 256 + n;
    }
    return v;
  }

  /** Unsigned 32-bit number → "a.b.c.d". */
  function format(v) {
    return [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
  }

  /** 32 bits, most significant first, as a string of '0' and '1'. */
  function bits(v) {
    var s = (v >>> 0).toString(2);
    return '00000000000000000000000000000000'.slice(s.length) + s;
  }

  /** The mask of a prefix length: p ones from the left, then zeros. p = 0 is 0.0.0.0, p = 32 is 255.255.255.255. */
  function mask(p) {
    return p <= 0 ? 0 : (0xffffffff << (32 - p)) >>> 0; // a shift by 32 would be a shift by 0, hence the p = 0 case
  }

  /** An entry matches when the first `prefix` bits of the destination equal those of the entry's network. */
  function match(dest, net, prefix) {
    var m = mask(prefix);
    return ((dest & m) >>> 0) === ((net & m) >>> 0);
  }

  /** Longest-prefix lookup over a table of { net, prefix }: the matching indices, the winner (longest; on equal
      length the earlier entry) and the first match in table order. winner = -1 when nothing matches. */
  function lookup(table, dest) {
    var matches = [], winner = -1;
    for (var i = 0; i < table.length; i++) {
      if (!match(dest, table[i].net, table[i].prefix)) continue;
      matches.push(i);
      if (winner < 0 || table[i].prefix > table[winner].prefix) winner = i; // strictly longer: ties keep the earlier
    }
    return { matches: matches, winner: winner, firstMatch: matches.length ? matches[0] : -1 };
  }
  // end of the copy from sims/routing-table

  /** Number of addresses in a prefix of length len. */
  function sizeOf(len) { return Math.pow(2, 32 - len); }

  /** Rule 2: a prefix is a valid network only on an aligned boundary, its address a multiple of its size. */
  function aligned(net, len) { return net % sizeOf(len) === 0; }

  /** Number of leading bits two addresses share (32 when equal). */
  function commonBits(a, b) {
    var x = (a ^ b) >>> 0, n = 0;
    while (n < 32 && !((x >>> (31 - n)) & 1)) n++;
    return n;
  }

  /** The address ranges of blocks [{ net, len }], merged: overlapping, nested, duplicate or touching blocks become one
      range (rule 4). Sorted by first address. */
  function union(blocks) {
    var r = blocks.map(function (b) { return { first: b.net, last: b.net + sizeOf(b.len) - 1 }; })
      .sort(function (a, b) { return a.first - b.first || a.last - b.last; });
    var out = [];
    r.forEach(function (x) {
      var top = out[out.length - 1];
      if (top && x.first <= top.last + 1) top.last = Math.max(top.last, x.last);
      else out.push({ first: x.first, last: x.last });
    });
    return out;
  }

  /** The parts of [first, last] not inside any of the merged ranges: the gaps, as { first, last, count }. */
  function gaps(first, last, ranges) {
    var out = [], at = first;
    ranges.forEach(function (r) {
      if (r.last < at || r.first > last) return;
      if (r.first > at) out.push({ first: at, last: r.first - 1, count: r.first - at });
      at = Math.max(at, r.last + 1);
    });
    if (at <= last) out.push({ first: at, last: last, count: last - at + 1 });
    return out;
  }

  /** Rules 1, 3, 4, 5: the summary of blocks [{ net, len }]. Length = the leading bits the lowest and the highest
      address share; network = the lowest address AND that mask. covered counts each address once; overCovered lists
      the gaps; exact when there are none. null for no block. */
  function summarise(blocks) {
    if (!blocks.length) return null;
    var lo = Infinity, hi = -Infinity;
    blocks.forEach(function (b) {
      lo = Math.min(lo, b.net);
      hi = Math.max(hi, b.net + sizeOf(b.len) - 1);
    });
    var len = commonBits(lo, hi), net = (lo & mask(len)) >>> 0, size = sizeOf(len);
    var ranges = union(blocks), covered = 0;
    ranges.forEach(function (r) { covered += r.last - r.first + 1; });
    var over = gaps(net, net + size - 1, ranges);
    return {
      net: net, len: len, first: net, last: net + size - 1, size: size,
      low: lo, high: hi, aligned: aligned(net, len),
      covered: covered, overCovered: over, overCount: size - covered, exact: over.length === 0
    };
  }

  /** Split each range by the blocks of the plan: { first, last, count, owner } with owner a block id or null (no
      block: nobody's addresses). Blocks of a plan never overlap. */
  function ownerPieces(ranges, blocks) {
    var out = [];
    ranges.forEach(function (r) {
      var at = r.first;
      blocks.slice().sort(function (a, b) { return a.net - b.net; }).forEach(function (b) {
        var bl = b.net + sizeOf(b.len) - 1;
        if (bl < at || b.net > r.last) return;
        if (b.net > at) out.push({ first: at, last: b.net - 1, count: b.net - at, owner: null });
        var f = Math.max(at, b.net), l = Math.min(r.last, bl);
        out.push({ first: f, last: l, count: l - f + 1, owner: b.id });
        at = l + 1;
      });
      if (at <= r.last) out.push({ first: at, last: r.last, count: r.last - at + 1, owner: null });
    });
    return out;
  }

  /** The plans. site: where the block is, seen from R2. 'R1' is behind R1 (R2 has a route via R1), 'R2' is R2's own
      network (directly connected), 'both' is the R1–R2 link (connected on R2, and R1 sits on it). Grafo d.o.o. is
      URM ch. 9, Primjer 1: the branch is "iza drugog usmjernika", the link joins R1 and R2. key is the toggle param. */
  var PLANS = {
    grafo: {
      space: { net: '192.168.1.0', len: 24 },
      blocks: [
        { id: 'sales', net: '192.168.1.0', len: 26, site: 'R1' },
        { id: 'prod', net: '192.168.1.64', len: 27, site: 'R1' },
        { id: 'mgmt', net: '192.168.1.96', len: 28, site: 'R1' },
        { id: 'branch', net: '192.168.1.112', len: 28, site: 'R2' },
        { id: 'guest', net: '192.168.1.128', len: 29, site: 'R1' },
        { id: 'link', net: '192.168.1.136', len: 30, site: 'both' }
      ]
    },
    four24: {
      space: { net: '172.16.0.0', len: 22 },
      blocks: [
        { id: 'n0', net: '172.16.0.0', len: 24, site: 'R1' },
        { id: 'n1', net: '172.16.1.0', len: 24, site: 'R1' },
        { id: 'n2', net: '172.16.2.0', len: 24, site: 'R1' },
        { id: 'n3', net: '172.16.3.0', len: 24, site: 'R1' }
      ]
    }
  };

  function planOf(id) {
    var p = PLANS[id] || PLANS.grafo;
    return {
      space: { net: parse(p.space.net), len: p.space.len },
      blocks: p.blocks.map(function (b) { return { id: b.id, net: parse(b.net), len: b.len, site: b.site }; })
    };
  }

  /** R2's route to a block: via R1 for a block behind R1, directly connected for its own networks and the link. */
  function hopOf(block) { return block.site === 'R1' ? 'R1' : 'connected'; }

  /** R2's table before: one route per block of the plan, in address order. */
  function tableBefore(plan) {
    return plan.blocks.map(function (b) { return { net: b.net, prefix: b.len, hop: hopOf(b), block: b.id, summary: false }; });
  }

  /** R2's table after: the picked routes via R1 are replaced by the summary via R1, put in address order (a tie with an
      equal network goes shorter prefix first). Connected routes stay: a router always knows its own networks. With no
      picked route via R1 nothing is replaced and nothing is added. */
  function tableAfter(plan, picked, sum) {
    var before = tableBefore(plan);
    var replaced = before.filter(function (r) { return r.hop === 'R1' && picked.indexOf(r.block) >= 0; });
    if (!sum || !replaced.length) return { rows: before, replaced: [], installed: false };
    var rows = before.filter(function (r) { return replaced.indexOf(r) < 0; });
    rows.push({ net: sum.net, prefix: sum.len, hop: 'R1', block: null, summary: true });
    rows.sort(function (a, b) { return a.net - b.net || a.prefix - b.prefix; });
    return { rows: rows, replaced: replaced.map(function (r) { return r.block; }), installed: true };
  }

  /** The summary's over-covered addresses, split by owner, each with its kind (rules 6, 7) and R2's choice for it
      (longest prefix match on the table after):
      'unused': nobody's addresses (rule 7: only flagged);
      'same':   a block that R1 reaches too (behind R1, or the R1–R2 link): the summary sends it the right way;
      'risk':   a block behind R2 (rule 6): routers that only have the summary send it to R1. On R2 itself the
                block's own, longer route wins (safeOnR2). Only while the summary is installed. */
  function classify(plan, sum, after) {
    if (!sum) return [];
    return ownerPieces(sum.overCovered, plan.blocks).map(function (pc) {
      var b = plan.blocks.filter(function (x) { return x.id === pc.owner; })[0];
      var kind = !b ? 'unused' : b.site === 'R2' ? 'risk' : 'same';
      var w = lookup(after.rows, pc.first).winner, win = w >= 0 ? after.rows[w] : null;
      return {
        first: pc.first, last: pc.last, count: pc.count, owner: pc.owner, kind: kind,
        risk: kind === 'risk' && after.installed,
        r2: win ? (win.summary ? 'summary' : win.hop) : 'none',
        safeOnR2: !!win && !win.summary
      };
    });
  }

  /** Everything the page shows for one set of params. */
  function derive(p) {
    var plan = planOf(p.plan);
    var picked = plan.blocks.filter(function (b) { return !!p[b.id]; });
    var sum = summarise(picked);
    var after = tableAfter(plan, picked.map(function (b) { return b.id; }), sum);
    return {
      plan: p.plan === 'four24' ? 'four24' : 'grafo',
      space: { net: plan.space.net, len: plan.space.len, size: sizeOf(plan.space.len) },
      blocks: plan.blocks.map(function (b) {
        return { id: b.id, net: b.net, len: b.len, size: sizeOf(b.len), site: b.site, selected: !!p[b.id],
          inSummary: !!sum && b.net >= sum.first && b.net + sizeOf(b.len) - 1 <= sum.last };
      }),
      selected: picked.map(function (b) { return b.id; }),
      summary: sum ? { net: sum.net, len: sum.len, first: sum.first, last: sum.last, size: sum.size, low: sum.low, high: sum.high, aligned: sum.aligned } : null,
      covered: sum ? sum.covered : 0,
      overCovered: sum ? sum.overCovered : [],
      overCount: sum ? sum.overCount : 0,
      exact: sum ? sum.exact : false,
      pieces: classify(plan, sum, after),
      tableBefore: tableBefore(plan),
      tableAfter: after.rows,
      replaced: after.replaced,
      installed: after.installed
    };
  }

  /** "Changed" marks for the page: blocks whose pick changed, and rows of the table after that were not there before
      the last input (by network and prefix). */
  function changed(before, now) {
    if (!before || before.plan !== now.plan) return { blocks: [], rows: [] };
    var key = function (r) { return r.net + '/' + r.prefix + '/' + r.hop; };
    var had = before.tableAfter.map(key);
    return {
      blocks: now.blocks.filter(function (b, i) { return b.selected !== before.blocks[i].selected; }).map(function (b) { return b.id; }),
      rows: now.tableAfter.filter(function (r) { return had.indexOf(key(r)) < 0; }).map(key)
    };
  }

  var BLOCK_IDS = PLANS.grafo.blocks.concat(PLANS.four24.blocks).map(function (b) { return b.id; });

  /** Defaults: preset head-office, R2 summarises the three R1 networks (URM ch. 9, Primjer 1; summary derived), and
      every /24 of the four24 plan picked. */
  var defaults = { plan: 'grafo', sales: true, prod: true, mgmt: true, branch: false, guest: false, link: false,
    n0: true, n1: true, n2: true, n3: true };

  function P(over) { return Object.assign({}, defaults, over); }

  /** The page's presets (params only; names and hints are strings). */
  var presets = [
    { id: 'head-office', params: { plan: 'grafo', sales: true, prod: true, mgmt: true, branch: false, guest: false, link: false } },
    { id: 'exact', params: { plan: 'grafo', sales: false, prod: true, mgmt: true, branch: true, guest: false, link: false } },
    { id: 'small', params: { plan: 'grafo', sales: false, prod: false, mgmt: false, branch: false, guest: true, link: true } },
    { id: 'all', params: { plan: 'grafo', sales: true, prod: true, mgmt: true, branch: true, guest: true, link: true } },
    { id: 'four24', params: { plan: 'four24', n0: true, n1: true, n2: true, n3: true } }
  ];

  var logic = {
    defaults: defaults,
    /** Explorer: no steps; the state is derived from the params. */
    initial: function (p) { return derive(p); },
    PLANS: PLANS, BLOCK_IDS: BLOCK_IDS, presets: presets, withDefaults: P,
    planOf: planOf, derive: derive, changed: changed,
    summarise: summarise, union: union, gaps: gaps, ownerPieces: ownerPieces, aligned: aligned, commonBits: commonBits,
    sizeOf: sizeOf, tableBefore: tableBefore, tableAfter: tableAfter, classify: classify,
    parse: parse, format: format, bits: bits, mask: mask, match: match, lookup: lookup
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
