/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for smallest-disk-caps: the fullest OSD sets MAX AVAIL; with size 3 on three hosts every host holds a full
   copy, so the host with the least disk fills first. Rules and numbers: SPEC.md.
   Capacity rules from the cephsim engine (sims/cephsim/js/engine/capacity.js: RATIOS, osdUsage, ruleWeightMap,
   ruleAvail, poolDf, clusterDf @ 9fae442); placement from crush.js (the same engine's CRUSH, copied).
   An explorer: the state is a pure function of the params (compute). No DOM, no Math.random, no Date; JSON-safe state.
   The page loads crush.js then this file (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';
  var crush = typeof module === 'object' && module.exports ? require('./crush.js') : root.SimCrush;

  var RATIOS = { nearfull: 0.85, backfillfull: 0.90, full: 0.95 };   // Ceph defaults (cephsim RATIOS)
  var LEVELS = ['ok', 'nearfull', 'backfillfull', 'full'];
  var EPS = 1e-9;
  var PG_NUM = 256, POOL_ID = 1, SKEW = 0.25;                          // cephsim `unbalanced`: pool 1 rbd, 256 PGs
  var DISKS = [447, 2048, 8192];                                      // GiB: the task's 0.447 (447 GiB), 2 and 8 TiB
  var HOSTS = ['ceph-big', 'ceph-small-1', 'ceph-small-2'];

  var defaults = { cluster: 'lab', smallHostDisks: 2, bigHostDisks: 12, diskGiB: 8192, storedTiB: 8, size: 3 };
  var RANGE = { smallHostDisks: [1, 12], bigHostDisks: [2, 16], storedStep: 0.05 };

  /** The stored-data slider's top: 2.5 disks' worth (20 TiB for 8 TiB disks), on the slider's step. */
  function storedMax(p) {
    var max = 2.5 * p.diskGiB / 1024;
    return Math.floor(max / RANGE.storedStep + EPS) * RANGE.storedStep;
  }

  /** OSD id of a host's k-th disk (slot): fixed per slot, so adding disks to one host renumbers nothing (SPEC). */
  function slotId(host, k) {
    if (host === 0) return k < 12 ? k : 16 + (k - 12);
    if (host === 1) return k < 2 ? 12 + k : 20 + (k - 2);
    return k < 2 ? 14 + k : 30 + (k - 2);
  }

  /** The lab cluster's hosts: [{ name, osds: [{ id, weight }] }], weight = size in TiB. */
  function labHosts(p) {
    var counts = [p.bigHostDisks, p.smallHostDisks, p.smallHostDisks];
    var w = p.diskGiB / 1024;
    return counts.map(function (n, hst) {
      var osds = [];
      for (var k = 0; k < n; k++) osds.push({ id: slotId(hst, k), weight: w });
      return { name: HOSTS[hst], osds: osds };
    });
  }

  // DR estate, HQ cluster (student side: configs/hq/hqc/ceph-osd-tree.txt for weights, ceph-osd-df.txt for SIZE and
  // %USE). osd.13's SIZE is the 1.7 TiB the file shows (1.74660 TiB like the other SSDs); its tree weight is 3.49309.
  var H = 7.27739, S = 1.74660, S2 = 3.49309, B = 10.91409;
  var HQ = {
    pool: { name: 'vm-rbd', size: 2 },
    hosts: [
      ['hq-pve-01', [[0, H, H, 37.66], [1, H, H, 36.49], [2, H, H, 36.85], [3, H, H, 37.34], [4, H, H, 36.53], [5, S, S, 43.20]]],
      ['hq-pve-02', [[6, H, H, 37.93], [7, H, H, 37.32], [8, H, H, 38.10], [9, H, H, 37.56], [10, H, H, 36.19], [11, S, S, 44.17]]],
      ['hq-pve-03', [[12, H, H, 36.09], [13, S2, S, 88.60], [14, H, H, 38.20], [15, H, H, 38.23], [16, H, H, 36.39], [17, S, S, 44.63]]],
      ['hq-pve-04', [[18, B, B, 37.59], [19, B, B, 37.87], [20, B, B, 37.82], [21, B, B, 36.29], [22, B, B, 0, true], [23, S, S, 43.94]]],
      ['hq-pve-05', [[24, B, B, 36.67], [25, B, B, 36.28], [26, B, B, 37.73], [27, B, B, 36.74], [28, B, B, 37.14], [29, S, S, 44.50]]]
    ]
  };

  function levelOf(ratio) {
    if (ratio >= RATIOS.full - EPS) return 'full';
    if (ratio >= RATIOS.backfillfull - EPS) return 'backfillfull';
    if (ratio >= RATIOS.nearfull - EPS) return 'nearfull';
    return 'ok';
  }

  /** Highest key, equal → lowest id (rule 8), in whatever order the list comes. */
  function argmax(list, key) {
    var best = null;
    list.forEach(function (o) {
      var v = key(o);
      if (best === null || v > best.v + EPS || (Math.abs(v - best.v) <= EPS && o.id < best.o.id)) best = { o: o, v: v };
    });
    return best ? best.o.id : null;
  }

  /**
   * Rule 3: MAX AVAIL of a pool of `size` copies over the OSDs that are in: the projection from the OSD that reaches
   * the full ratio first, by CRUSH weight share; equal projections → the lowest id. { tib, osd }.
   */
  function maxAvail(inOsds, size) {
    var W = 0;
    inOsds.forEach(function (o) { if (o.weight > 0) W += o.weight; });
    var minProj = null, osd = null;
    inOsds.forEach(function (o) {
      if (!(o.weight > 0) || !(o.sizeTiB > 0)) return;
      var proj = (o.sizeTiB * RATIOS.full - o.usedTiB) / (o.weight / W);
      if (minProj === null || proj < minProj - EPS || (Math.abs(proj - minProj) <= EPS && o.id < osd)) { minProj = proj; osd = o.id; }
    });
    return { tib: Math.max(0, minProj === null ? 0 : minProj) / size, osd: osd };
  }

  /** Lab: CRUSH placement and each OSD's bytes per TiB stored (rule 1 at stored = 1). */
  function labPlacement(p) {
    var hosts = labHosts(p);
    var map = crush.buildMap(hosts);
    var reweights = [];
    hosts.forEach(function (x) { x.osds.forEach(function (o) { reweights[o.id] = 1; }); });
    var raw = crush.mapPool(map, { id: POOL_ID, pgNum: PG_NUM, size: p.size }, reweights);
    // cephsim's pgBytes is mean-preserving only on average: over 256 PGs the sizes add up to 1.4 % more than the
    // pool's data. Scaled here so they add up to exactly 1 TiB per TiB stored (NOTES.md, deviations).
    var bytes = raw.map(function (set, ps) { return crush.pgBytes(POOL_ID, PG_NUM, ps, 1, SKEW); });
    var sum = bytes.reduce(function (a, b) { return a + b; }, 0);
    var perTiB = {}, pgs = {}, hostPgs = [0, 0, 0];
    var hostOfOsd = {};
    hosts.forEach(function (x, hi) { x.osds.forEach(function (o) { hostOfOsd[o.id] = hi; }); });
    raw.forEach(function (set, ps) {
      var seen = {};
      set.forEach(function (o) { if (!seen[hostOfOsd[o]]) { seen[hostOfOsd[o]] = true; hostPgs[hostOfOsd[o]]++; } });
      var b = bytes[ps] / sum;
      set.forEach(function (o) { perTiB[o] = (perTiB[o] || 0) + b; pgs[o] = (pgs[o] || 0) + 1; });
    });
    var short = raw.filter(function (set) { return set.length < p.size; }).length;
    return { hosts: hosts, raw: raw, perTiB: perTiB, pgs: pgs, hostPgs: hostPgs, short: short, skewSum: sum };
  }

  /** The state for params p (SPEC.md "State"). */
  function compute(p) {
    p = Object.assign({}, defaults, p);
    var lab = p.cluster !== 'hq';
    var osds = [], hosts = [], pool, short = 0, asked = null, stored = null, fullAt = null, full = false;

    if (lab) {
      var pl = labPlacement(p);
      pool = { name: 'rbd', size: p.size };
      // rule 6: the pool takes data until the first OSD reaches the full ratio; used is linear in stored.
      pl.hosts.forEach(function (x) {
        x.osds.forEach(function (o) {
          var per = pl.perTiB[o.id] || 0;
          if (per > 0) {
            var at = RATIOS.full * o.weight / per;
            if (fullAt === null || at < fullAt) fullAt = at;
          }
        });
      });
      asked = p.storedTiB;
      full = asked >= fullAt - EPS;                                     // rule 7: the rest is refused
      stored = full ? fullAt : asked;
      pl.hosts.forEach(function (x, hi) {
        var ids = [];
        x.osds.forEach(function (o) {
          var per = pl.perTiB[o.id] || 0;
          osds.push({ id: o.id, host: hi, sizeTiB: o.weight, weight: o.weight, in: true, pgs: pl.pgs[o.id] || 0,
            perTiB: per, usedTiB: stored * per, ratio: stored * per / o.weight });
          ids.push(o.id);
        });
        hosts.push({ name: x.name, osds: ids, pgs: pl.hostPgs[hi] });
      });
      short = pl.short;
    } else {
      pool = HQ.pool;
      HQ.hosts.forEach(function (x, hi) {
        var ids = [];
        x[1].forEach(function (o) {
          var used = o[2] * o[3] / 100;
          osds.push({ id: o[0], host: hi, sizeTiB: o[2], weight: o[1], in: !o[4], pgs: null, perTiB: null,
            usedTiB: used, ratio: used / o[2] });
          ids.push(o[0]);
        });
        hosts.push({ name: x[0], osds: ids, pgs: null });
      });
    }

    osds.forEach(function (o) { o.level = o.in ? levelOf(o.ratio) : 'out'; });
    if (full) {                                                        // rule 7: the deciding OSD stands at 95 % exactly
      var top = argmax(osds.filter(function (o) { return o.in && o.perTiB > 0; }), function (o) { return o.perTiB / o.sizeTiB; });
      osds.forEach(function (o) { if (o.id === top) { o.ratio = RATIOS.full; o.usedTiB = RATIOS.full * o.sizeTiB; o.level = 'full'; } });
    }

    // rule 1: raw totals over the OSDs that are in
    var inOsds = osds.filter(function (o) { return o.in; });
    var rawTiB = 0, rawUsedTiB = 0;
    inOsds.forEach(function (o) { rawTiB += o.sizeTiB; rawUsedTiB += o.usedTiB; });

    var ma = maxAvail(inOsds, pool.size);

    // rule 8: the fullest decides; on an empty lab pool, the one that would fill first
    var fullest = lab
      ? argmax(inOsds.filter(function (o) { return o.perTiB > 0; }), function (o) { return o.perTiB / o.sizeTiB; })
      : argmax(inOsds, function (o) { return o.ratio; });

    // per host: disks, capacity, data held, fill range
    var hostRows = hosts.map(function (x) {
      var mine = osds.filter(function (o) { return o.host === hosts.indexOf(x) && o.in; });
      var cap = 0, used = 0, lo = null, hi = null;
      mine.forEach(function (o) {
        cap += o.sizeTiB; used += o.usedTiB;
        if (lo === null || o.ratio < lo) lo = o.ratio;
        if (hi === null || o.ratio > hi) hi = o.ratio;
      });
      // a full copy: a copy of every PG of the pool (CRUSH may leave a PG short of this host, SPEC "Placement")
      return { name: x.name, osds: x.osds, disks: x.osds.length, capTiB: cap, usedTiB: used, minRatio: lo, maxRatio: hi,
        pgs: x.pgs, fullCopy: x.pgs === PG_NUM };
    });

    return {
      cluster: lab ? 'lab' : 'hq',
      pool: pool,
      hosts: hostRows,
      osds: osds,
      rawTiB: rawTiB,
      rawUsedTiB: rawUsedTiB,
      rawRatio: rawTiB > 0 ? rawUsedTiB / rawTiB : 0,
      naiveTiB: (rawTiB - rawUsedTiB) / pool.size,                     // what "x % full" suggests: raw free ÷ size
      maxAvailTiB: ma.tib,
      maxAvailOsd: ma.osd,
      fullest: fullest,
      storedTiB: stored,
      askedTiB: asked,
      refusedTiB: lab ? Math.max(0, asked - stored) : null,
      fullAtTiB: fullAt,
      headroomTiB: lab ? Math.max(0, fullAt - stored) : null,
      full: full,
      short: short,
      counts: LEVELS.reduce(function (a, l) { a[l] = osds.filter(function (o) { return o.level === l; }).length; return a; }, {})
    };
  }

  function osdOf(s, id) { return s.osds.filter(function (o) { return o.id === id; })[0] || null; }

  /** Rule 9: OSDs (in both states) whose level changed; nothing across a change of cluster. */
  function changed(prev, cur) {
    if (!prev || !cur || prev.cluster !== cur.cluster) return [];
    var out = [];
    cur.osds.forEach(function (o) {
      var q = osdOf(prev, o.id);
      if (q && q.level !== o.level) out.push(o.id);
    });
    return out;
  }

  /** The caption: a main key and notes (keys into strings.js), chosen from the state alone. */
  function captionKey(s) {
    var f = osdOf(s, s.fullest);
    var notes = [];
    var key;
    if (s.cluster === 'hq') {
      key = 'cHq';
    } else if (s.full) {
      key = 'cFull';
    } else if (s.storedTiB <= EPS) {
      key = 'cEmpty';
    } else if (s.pool.size === 2) {
      key = 'cSize2';
    } else {
      var host = s.hosts[f.host];
      var fewest = s.hosts.every(function (x) { return x.disks >= host.disks; });
      var even = s.hosts.every(function (x) { return x.disks === host.disks; });
      key = even ? 'cEven' : fewest ? 'cCopy' : 'cCopyOther';
    }
    // at most one note, so the caption stays two lines: a warning first, else the over-promise
    if (s.cluster === 'lab' && !s.full && s.storedTiB > EPS) {
      if (f.level !== 'ok') notes.push('nLevel');
      else if (s.maxAvailTiB > 1.2 * s.headroomTiB) notes.push('nOver');
    }
    if (s.cluster === 'hq') notes.push('nHqNaive');
    return { key: key, notes: notes };
  }

  var presets = [
    { id: 'unbalanced', params: {} },
    { id: 'add-to-big-host', params: { bigHostDisks: 16 } },
    { id: 'fill-it', params: { storedTiB: 14 } },
    { id: 'one-small-disk', params: { smallHostDisks: 1, bigHostDisks: 4, diskGiB: 447, storedTiB: 0.4 } },
    { id: 'dr-38-percent', params: { cluster: 'hq' } }
  ];

  var logic = {
    RATIOS: RATIOS, LEVELS: LEVELS, DISKS: DISKS, HOSTS: HOSTS, PG_NUM: PG_NUM, RANGE: RANGE,
    defaults: defaults,
    presets: presets,
    storedMax: storedMax,
    argmax: argmax,
    maxAvail: maxAvail,
    slotId: slotId,
    labHosts: labHosts,
    labPlacement: labPlacement,
    levelOf: levelOf,
    compute: compute,
    initial: compute,
    osdOf: osdOf,
    changed: changed,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
