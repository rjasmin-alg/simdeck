/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ceph-min-size: one replicated pool, its PGs placed by CRUSH (placement.js, generated from the cephsim
   engine), and a pool setting size / min_size. Each failure is two steps: (1) an OSD or a whole host goes down and
   every PG's state is recomputed from its live copies; (2) a client writes one object into the watched PG, and the
   write is acknowledged or blocks. A last step compares the same failures under the other settings.
   Rules (SPEC.md): a PG is active iff live copies >= min_size; active with fewer than size is degraded; below
   min_size but > 0 it is inactive (I/O blocks); no live copy, stale. A write is acknowledged once every live copy has
   it, so with min_size 1 it may sit on one disk only, and is gone when that disk goes.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads placement.js and this file as classic scripts (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var placement = typeof module === 'object' && module.exports ? require('./placement.js') : root.SimPlacement;

  /** The two clusters. hc: cephsim's `hyperconverged` sample (3 hosts × 4 OSDs, pool 1, 128 PGs). dr: the DR estate's
      hq cluster (configs/hq/hqc/ceph-osd-tree.txt: 5 hosts × 6 OSDs, osd.22 down and out; pool 2 vm-rbd, 512 PGs). */
  var CLUSTERS = {
    hc: {
      pool: { id: 1, name: 'cephfs_data' }, pgNum: 128, out: [],
      hosts: [{ name: 'ceph-01', osds: [0, 1, 2, 3] }, { name: 'ceph-02', osds: [4, 5, 6, 7] }, { name: 'ceph-03', osds: [8, 9, 10, 11] }]
    },
    dr: {
      pool: { id: 2, name: 'vm-rbd' }, pgNum: 512, out: [22],
      hosts: [0, 1, 2, 3, 4].map(function (i) {
        return { name: 'hq-pve-0' + (i + 1), osds: [0, 1, 2, 3, 4, 5].map(function (k) { return i * 6 + k; }) };
      })
    }
  };
  /** Failure options: an OSD (`osd.N`) or a whole host (`host:i`, i = index in hosts). */
  var FAIL1 = ['osd.0', 'osd.4', 'osd.8', 'host:0'];
  var FAIL2 = ['none', 'osd.1', 'osd.4', 'osd.8', 'host:1'];
  var DR_FAIL = ['osd.15', 'host:2'];
  var SIZES = [2, 3], MIN_SIZES = [1, 2];
  /** The settings the summary compares, in this order. */
  var COMPARE = [[2, 2], [3, 2], [2, 1]];
  /** dr: osd.15 dies at 10:40 (S2); the later step is ten minutes on. */
  var DR_START = 10 * 60 + 40, DR_LATER = 10;
  /** A VM disk in the later step: 100 GiB in 4 MiB objects (the block device's default object size, check). */
  var VM_DISK_GIB = 100, OBJECT_MIB = 4;
  var ZOOM = 12;
  var GROUPS = ['clean', 'degraded', 'inactive', 'stale'];

  var rawCache = {};
  /** Raw CRUSH output per PG (size 3); a size-2 pool takes the first two (firstn is prefix-stable). */
  function rawOf(cluster) {
    if (!rawCache[cluster]) {
      rawCache[cluster] = placement[cluster].split(' ').map(function (s) { return s.split(',').map(Number); });
    }
    return rawCache[cluster];
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function pick(v, list, def) { for (var i = 0; i < list.length; i++) if (String(list[i]) === String(v)) return list[i]; return def; }

  function norm(p) {
    p = p || {};
    var o = {
      cluster: CLUSTERS[p.cluster] ? p.cluster : 'hc',
      size: pick(p.size, SIZES, 3),
      minSize: pick(p.minSize, MIN_SIZES, 2),
      fail1: pick(p.fail1, FAIL1, 'osd.0'),
      fail2: pick(p.fail2, FAIL2, 'none'),
      drFail: pick(p.drFail, DR_FAIL, 'osd.15')
    };
    o.fails = o.cluster === 'dr' ? [o.drFail] : o.fail2 === 'none' ? [o.fail1] : [o.fail1, o.fail2];
    o.events = script(o);
    return o;
  }

  /** The OSDs a failure takes down, in order. */
  function osdsOf(cluster, f) {
    if (f.indexOf('host:') === 0) return CLUSTERS[cluster].hosts[Number(f.slice(5))].osds.slice();
    return [Number(f.slice(4))];
  }

  /** The step script: per failure, fail then write (dr: fail, ten minutes later, write); then the summary. */
  function script(o) {
    var ev = [];
    o.fails.forEach(function (f) {
      ev.push({ kind: 'fail', target: f });
      if (o.cluster === 'dr') ev.push({ kind: 'later' });
      ev.push({ kind: 'write' });
    });
    ev.push({ kind: 'summary' });
    return ev;
  }

  /** The PG's copies: the first `size` OSDs of its raw set. */
  function copiesOf(cluster, size, pg) { return rawOf(cluster)[pg].slice(0, size); }
  /** Live copies: those on OSDs that are not down. */
  function liveOf(cluster, size, pg, down) {
    return copiesOf(cluster, size, pg).filter(function (x) { return down.indexOf(x) < 0; });
  }

  /** Rules 1–4: the state group from the number of live copies. */
  function group(live, size, minSize) {
    if (live === 0) return 'stale';
    if (live < minSize) return 'inactive';
    if (live < size) return 'degraded';
    return 'clean';
  }
  function active(g) { return g === 'clean' || g === 'degraded'; }

  function countsOf(pgs) {
    var c = { clean: 0, degraded: 0, inactive: 0, stale: 0 };
    pgs.forEach(function (g) { c[g] += 1; });
    return c;
  }

  function pgStates(cluster, size, minSize, down) {
    var n = CLUSTERS[cluster].pgNum, out = [];
    for (var pg = 0; pg < n; pg++) out.push(group(liveOf(cluster, size, pg, down).length, size, minSize));
    return out;
  }

  /** Every OSD down at the end of the run, in order of failure, each once. */
  function finalDown(o) {
    var d = [];
    o.fails.forEach(function (f) { osdsOf(o.cluster, f).forEach(function (x) { if (d.indexOf(x) < 0) d.push(x); }); });
    return d;
  }

  /** Tie-break (rule 7): the PG hit hardest by the run's failures — first the PGs with a copy on the first failure's
      OSDs, then the most copies on OSDs that go down at some point, then the lowest PG number. The client writes to
      the first in every write step (so the first write always goes to a PG the first failure touched). The zoom shows
      the twelve first by the same order. */
  function ranking(o) {
    var d = finalDown(o), f1 = osdsOf(o.cluster, o.fails[0]), n = CLUSTERS[o.cluster].pgNum, list = [];
    for (var pg = 0; pg < n; pg++) {
      var c = copiesOf(o.cluster, o.size, pg);
      var first = c.some(function (x) { return f1.indexOf(x) >= 0; }) ? 1 : 0;
      var hit = c.filter(function (x) { return d.indexOf(x) >= 0; }).length;
      list.push({ pg: pg, first: first, hit: hit });
    }
    list.sort(function (a, b) { return b.first - a.first || b.hit - a.hit || a.pg - b.pg; });
    return list;
  }

  function blank(o) {
    var c = CLUSTERS[o.cluster];
    var rank = ranking(o);
    var watched = rank[0].pg;
    var zoom = rank.slice(1, ZOOM).map(function (r) { return r.pg; }).sort(function (a, b) { return a - b; });
    var pgs = pgStates(o.cluster, o.size, o.minSize, []);
    return {
      cluster: o.cluster, size: o.size, minSize: o.minSize,
      pool: { id: c.pool.id, name: c.pool.name }, pgNum: c.pgNum,
      down: [], out: c.out.slice(),
      pgs: pgs, counts: countsOf(pgs),
      watched: watched, zoom: [watched].concat(zoom),
      writes: [], clock: o.cluster === 'dr' ? DR_START - 1 : null,
      ev: null, i: 0
    };
  }

  function doFail(s0, e, o) {
    var s = clone(s0);
    var newly = osdsOf(o.cluster, e.target).filter(function (x) { return s.down.indexOf(x) < 0; });   // rule 7: once
    s.down = s.down.concat(newly);
    var pgs = pgStates(o.cluster, o.size, o.minSize, s.down);
    var changed = [], hit = [];
    pgs.forEach(function (g, pg) {
      if (g !== s0.pgs[pg]) changed.push(pg);
      if (copiesOf(o.cluster, o.size, pg).some(function (x) { return newly.indexOf(x) >= 0; })) hit.push(pg);
    });
    s.pgs = pgs;
    s.counts = countsOf(pgs);
    var lost = [];
    s.writes.forEach(function (w) {                                              // rule 5: the only copies went down
      if (w.status === 'ack' && w.on.every(function (x) { return s.down.indexOf(x) >= 0; })) { w.status = 'lost'; lost.push(w.id); }
    });
    if (o.cluster === 'dr') s.clock = DR_START;
    s.ev = { kind: 'fail', target: e.target, newly: newly, changed: changed, hit: hit, lost: lost };
    return s;
  }

  function doLater(s0) {
    var s = clone(s0);
    s.clock = s0.clock + DR_LATER;
    var objects = VM_DISK_GIB * 1024 / OBJECT_MIB;
    s.ev = { kind: 'later', minutes: DR_LATER, gib: VM_DISK_GIB, mib: OBJECT_MIB, objects: objects,
      stuck: Math.round(objects * s.counts.inactive / s.pgNum), changed: [] };
    return s;
  }

  /** Rule 5: the write goes to the watched PG. Active: acknowledged once every live copy has it. Not: it waits. */
  function doWrite(s0, o) {
    var s = clone(s0);
    var pg = s.watched, g = s.pgs[pg];
    var w = { id: s.writes.length + 1, pg: pg, step: s0.i + 1, on: [], status: 'blocked' };
    if (active(g)) { w.on = liveOf(o.cluster, o.size, pg, s.down); w.status = 'ack'; }
    s.writes.push(w);
    s.ev = { kind: 'write', write: w.id, changed: [] };
    return s;
  }

  /** The same failures under each setting of COMPARE (plus the current one when it is not there, 3/1): the counts at
      the end and what became of the writes. */
  function compare(o) {
    var list = COMPARE.slice();
    if (!list.some(function (sm) { return sm[0] === o.size && sm[1] === o.minSize; })) list.push([o.size, o.minSize]);
    return list.map(function (sm) {
      var p = { cluster: o.cluster, size: sm[0], minSize: sm[1], fail1: o.fail1, fail2: o.fail2, drFail: o.drFail };
      var po = norm(p), s = blank(po);
      po.events.forEach(function (e, k) { s = apply(s, e, po); s.i = k + 1; });
      var w = { ack: 0, blocked: 0, lost: 0 };
      s.writes.forEach(function (x) { w[x.status] += 1; });
      return { size: sm[0], minSize: sm[1], counts: s.counts, writes: w, current: sm[0] === o.size && sm[1] === o.minSize };
    });
  }

  function apply(s, e, o) {
    if (e.kind === 'fail') return doFail(s, e, o);
    if (e.kind === 'later') return doLater(s);
    if (e.kind === 'write') return doWrite(s, o);
    var r = clone(s);
    r.ev = { kind: 'summary', changed: [] };
    return r;
  }

  var logic = {
    CLUSTERS: CLUSTERS, FAIL1: FAIL1, FAIL2: FAIL2, DR_FAIL: DR_FAIL, SIZES: SIZES, MIN_SIZES: MIN_SIZES,
    COMPARE: COMPARE, GROUPS: GROUPS, ZOOM: ZOOM, DR_START: DR_START,

    /** Parameter defaults (SPEC.md "Params"): size 3, min_size 2, osd.0 fails. */
    defaults: { cluster: 'hc', size: 3, minSize: 2, fail1: 'osd.0', fail2: 'none', drFail: 'osd.15' },

    steps: function (p) { return norm(p).events.length; },
    norm: norm,
    initial: function (p) { return blank(norm(p)); },
    step: function (s, n, p) {
      var o = norm(p), e = o.events[n - 1];
      var r = e ? apply(s, e, o) : clone(s);
      if (e && e.kind === 'summary') r.ev.compare = compare(o);
      r.i = n;
      return r;
    },

    group: group,
    active: active,
    copiesOf: copiesOf,
    liveOf: liveOf,
    osdsOf: osdsOf,
    rawOf: rawOf,
    ranking: ranking,
    compare: compare,
    /** The PG id as Ceph writes it: pool.hex. */
    pgId: function (poolId, pg) { return poolId + '.' + pg.toString(16); },
    /** Ceph's own state string for a group (rule 3: below min_size a PG is peered, not active; check). */
    cephState: function (g) {
      return { clean: 'active+clean', degraded: 'active+undersized+degraded', inactive: 'undersized+degraded+peered', stale: 'stale' }[g];
    },
    /** Rule 6: the default min_size for a replicated pool, size − ⌊size/2⌋. */
    defaultMinSize: function (size) { return size - Math.floor(size / 2); },
    hostOf: function (cluster, osd) {
      var hs = CLUSTERS[cluster].hosts;
      for (var i = 0; i < hs.length; i++) if (hs[i].osds.indexOf(osd) >= 0) return i;
      return -1;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
