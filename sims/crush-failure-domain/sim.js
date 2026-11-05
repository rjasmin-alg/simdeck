/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for crush-failure-domain: one pool on three racks of three hosts (cephsim's threeRacks hardware), placed by
   CRUSH under `chooseleaf … type host` or `type rack` (placement.js, generated from the cephsim engine). Steps: (1) the
   placement under the current rule; (2) the PGs whose copies a single rack can take below min_size; (3) a rack is
   lost and every PG's state is recomputed. The comparison runs the same under the other rule, then the totals.
   Rules (SPEC.md): chooseleaf type X puts each copy under a different bucket of type X; it cannot place more copies
   than there are such buckets (the rest are holes); PG states from the live copies as in ceph-min-size.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads placement.js and this file as classic scripts (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var placement = typeof module === 'object' && module.exports ? require('./placement.js') : root.SimPlacement;

  /** cephsim threeRacks: rack r (1–3) holds hosts ceph-r<r>-1…3, each host 12 OSDs, numbered in order (36 per rack). */
  var RACKS = 3, HOSTS_PER_RACK = 3, OSDS_PER_HOST = 12;
  /** The two pools. rbd: cephsim brokenRule's pool 1 (replicated 3/2, 2048 PGs). ec: threeRacks' pool 3 cephfs_data
      (erasure 4+2, min_size 4, 1024 PGs). `width` is copies (replicated) or shards (erasure). */
  var POOLS = {
    rbd: { id: 1, name: 'rbd', type: 'replicated', width: 3, minSize: 2, pgNum: 2048 },
    ec: { id: 3, name: 'cephfs_data', type: 'erasure', k: 4, m: 2, width: 6, minSize: 4, pgNum: 1024 }
  };
  var RULES = ['host', 'rack'];
  var LOST = ['none', 1, 2, 3];
  /** Rule 6: the sample strip is PGs 0–11 in id order; totals always count every PG. */
  var SAMPLE = 12;
  /** The ec lose step also gives the count under this min_size (the task's 783), for the caption. */
  var EC_ALT_MIN = 5;
  var GROUPS = ['clean', 'degraded', 'inactive', 'stale'];

  var rawCache = {};
  /** Raw CRUSH output per PG: OSD ids in CRUSH order, null for a hole (CRUSH_ITEM_NONE). */
  function rawOf(pool, rule) {
    var k = pool + '-' + rule;
    if (!rawCache[k]) {
      rawCache[k] = placement[k].split(' ').map(function (s) {
        return s.split(',').map(function (x) { return x === '-' ? null : Number(x); });
      });
    }
    return rawCache[k];
  }

  function rackOf(osd) { return Math.floor(osd / (HOSTS_PER_RACK * OSDS_PER_HOST)) + 1; }
  function hostOf(osd) { return Math.floor(osd / OSDS_PER_HOST); }
  /** Host i (0–8) as cephsim names it: ceph-r<rack>-<n>. */
  function hostName(i) { return 'ceph-r' + (Math.floor(i / HOSTS_PER_RACK) + 1) + '-' + (i % HOSTS_PER_RACK + 1); }
  function rackOsds(r) {
    var out = [], per = HOSTS_PER_RACK * OSDS_PER_HOST;
    for (var x = (r - 1) * per; x < r * per; x++) out.push(x);
    return out;
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function pick(v, list, def) { for (var i = 0; i < list.length; i++) if (String(list[i]) === String(v)) return list[i]; return def; }
  function other(rule) { return rule === 'host' ? 'rack' : 'host'; }

  function norm(p) {
    p = p || {};
    var o = {
      pool: POOLS[p.pool] ? p.pool : 'rbd',
      rule: pick(p.rule, RULES, 'host'),
      lostRack: pick(p.lostRack, LOST, 'none'),
      compare: p.compare === true || p.compare === 'true',
      showAll: p.showAll === true || p.showAll === 'true'
    };
    o.lost = o.lostRack === 'none' ? null : o.lostRack;
    o.events = script(o);
    return o;
  }

  /** The step script (SPEC "Steps"). One rule: place, risk, lose (no lose without a lost rack). Comparison with a
      lost rack: the same under the other rule, then the totals (7). Comparison with nothing lost: each rule's
      placement with its risk, the second with the totals (2). */
  function script(o) {
    var r1 = o.rule, r2 = other(r1), ev = [];
    function run(rule) {
      ev.push({ kind: 'place', rule: rule });
      ev.push({ kind: 'risk', rule: rule });
      if (o.lost) ev.push({ kind: 'lose', rule: rule, rack: o.lost });
    }
    if (!o.compare) { run(r1); return ev; }
    if (!o.lost) return [{ kind: 'risk', rule: r1 }, { kind: 'totals', rule: r2 }];
    run(r1); run(r2);
    ev.push({ kind: 'totals', rule: r2 });
    return ev;
  }

  /** Copies of a PG as CRUSH placed them (holes left out). */
  function copiesOf(pool, rule, pg) { return rawOf(pool, rule)[pg].filter(function (x) { return x !== null; }); }
  /** Holes: positions CRUSH could not fill (rule 2). */
  function holesOf(pool, rule, pg) { return rawOf(pool, rule)[pg].length - copiesOf(pool, rule, pg).length; }
  function liveOf(pool, rule, pg, down) { return copiesOf(pool, rule, pg).filter(function (x) { return down.indexOf(x) < 0; }); }

  /** Copies per rack: [n in rack 1, rack 2, rack 3]. */
  function perRack(pool, rule, pg) {
    var n = [0, 0, 0];
    copiesOf(pool, rule, pg).forEach(function (x) { n[rackOf(x) - 1] += 1; });
    return n;
  }
  /** The racks whose loss alone takes this PG below min_size: they hold more than width − min_size of its copies
      (rbd 3/2: two or three; ec 4+2: three or more). Rule 1: under `type rack` a replicated PG has none. */
  function riskRacks(pool, rule, pg) {
    var P = POOLS[pool], spare = P.width - P.minSize, out = [];
    perRack(pool, rule, pg).forEach(function (n, i) { if (n > spare) out.push(i + 1); });
    return out;
  }

  /** Rules 3–4, from sims/ceph-min-size/sim.js @ 74e4819 (`group`): the state group from the number of live copies.
      `size` is the pool's width; a hole counts as a missing copy, so a PG with holes is undersized from birth. */
  function group(live, size, minSize) {
    if (live === 0) return 'stale';
    if (live < minSize) return 'inactive';
    if (live < size) return 'degraded';
    return 'clean';
  }
  function active(g) { return g === 'clean' || g === 'degraded'; }

  var CODE = { clean: 'c', degraded: 'd', inactive: 'i', stale: 's' };
  var UNCODE = { c: 'clean', d: 'degraded', i: 'inactive', s: 'stale' };

  /** Every PG's group, one letter per PG (c d i s) so the state stays small. */
  function pgStates(pool, rule, down, minSize) {
    var P = POOLS[pool], ms = minSize || P.minSize, out = '';
    for (var pg = 0; pg < P.pgNum; pg++) out += CODE[group(liveOf(pool, rule, pg, down).length, P.width, ms)];
    return out;
  }
  function countsOf(codes) {
    var c = { clean: 0, degraded: 0, inactive: 0, stale: 0 };
    for (var i = 0; i < codes.length; i++) c[UNCODE[codes[i]]] += 1;
    return c;
  }
  function riskCount(pool, rule) {
    var n = 0;
    for (var pg = 0; pg < POOLS[pool].pgNum; pg++) if (riskRacks(pool, rule, pg).length) n += 1;
    return n;
  }
  function holeCount(pool, rule) {
    var n = 0;
    for (var pg = 0; pg < POOLS[pool].pgNum; pg++) if (holesOf(pool, rule, pg)) n += 1;
    return n;
  }
  /** Counts after losing rack r (null: nothing lost). */
  function countsAfter(pool, rule, r, minSize) {
    return countsOf(pgStates(pool, rule, r ? rackOsds(r) : [], minSize));
  }
  /** Rule 5: HEALTH_OK only when every PG is active+clean and nothing is down (check: Ceph reports inactive and
      degraded PGs, and down OSDs, as warnings). */
  function health(counts, down) {
    return counts.clean === counts.clean + counts.degraded + counts.inactive + counts.stale && !down.length
      ? 'HEALTH_OK' : 'HEALTH_WARN';
  }

  function blank(o) {
    var P = POOLS[o.pool];
    var sample = [];
    for (var pg = 0; pg < Math.min(SAMPLE, P.pgNum); pg++) sample.push(pg);
    return {
      pool: o.pool, rule: o.rule, lostRack: null, down: [],
      placed: false, risk: false,
      pgs: '', counts: null, risky: null, holes: null, health: null,
      sample: sample,
      ev: null, i: 0
    };
  }

  /** Show the placement under `rule` with nothing lost (a rule switch restores the lost rack first). */
  function view(s0, rule, risk) {
    var s = clone(s0);
    var switched = s0.rule !== rule || !s0.placed;
    s.rule = rule;
    s.placed = true;
    s.risk = risk;
    s.lostRack = null;
    s.down = [];
    s.pgs = pgStates(s.pool, rule, []);
    s.counts = countsOf(s.pgs);
    s.risky = riskCount(s.pool, rule);
    s.holes = holeCount(s.pool, rule);
    s.health = health(s.counts, s.down);
    s.ev = { kind: null, rule: rule, switched: s0.placed && s0.rule !== rule, back: s0.lostRack, placedNow: switched, changed: [] };
    return s;
  }

  function doLose(s0, e) {
    var s = clone(s0);
    s.lostRack = e.rack;
    s.down = rackOsds(e.rack);
    s.pgs = pgStates(s.pool, s.rule, s.down);
    s.counts = countsOf(s.pgs);
    s.health = health(s.counts, s.down);
    var changed = [], hit = 0;
    for (var pg = 0; pg < s.pgs.length; pg++) {
      if (s.pgs[pg] !== s0.pgs[pg]) changed.push(pg);
      if (perRack(s.pool, s.rule, pg)[e.rack - 1]) hit += 1;
    }
    s.ev = { kind: 'lose', rack: e.rack, rule: s.rule, hit: hit, changed: changed.filter(function (pg) { return pg < SAMPLE; }), nChanged: changed.length };
    if (s.pool === 'ec') s.ev.alt = { minSize: EC_ALT_MIN, inactive: countsAfter(s.pool, s.rule, e.rack, EC_ALT_MIN).inactive };
    return s;
  }

  /** Step 5: both rules side by side, before and (when a rack is lost) after the loss. */
  function totals(o) {
    return RULES.map(function (rule) {
      var before = countsAfter(o.pool, rule, null);
      return {
        rule: rule, risky: riskCount(o.pool, rule), holes: holeCount(o.pool, rule),
        before: before, health: health(before, []),
        after: o.lost ? countsAfter(o.pool, rule, o.lost) : null
      };
    });
  }

  function apply(s, e, o) {
    var r;
    if (e.kind === 'place') { r = view(s, e.rule, false); r.ev.kind = 'place'; return r; }
    if (e.kind === 'risk') { r = view(s, e.rule, true); r.ev.kind = 'risk'; return r; }
    if (e.kind === 'lose') return doLose(s, e);
    // totals: with a lost rack the state stays as the last loss left it; with none, the other rule's placement
    if (o.lost) { r = clone(s); r.ev = { kind: 'totals', changed: [] }; }
    else { r = view(s, e.rule, true); r.ev.kind = 'totals'; }
    r.ev.totals = totals(o);
    r.ev.lost = o.lost;
    return r;
  }

  var logic = {
    POOLS: POOLS, RULES: RULES, LOST: LOST, RACKS: RACKS, HOSTS_PER_RACK: HOSTS_PER_RACK, OSDS_PER_HOST: OSDS_PER_HOST,
    SAMPLE: SAMPLE, GROUPS: GROUPS, EC_ALT_MIN: EC_ALT_MIN,

    /** Parameter defaults (SPEC.md "Params"): pool rbd, rule host, nothing lost, one rule, the sample strip. */
    defaults: { pool: 'rbd', rule: 'host', lostRack: 'none', compare: false, showAll: false },

    steps: function (p) { return norm(p).events.length; },
    norm: norm,
    initial: function (p) { return blank(norm(p)); },
    step: function (s, n, p) {
      var o = norm(p), e = o.events[n - 1];
      var r = e ? apply(s, e, o) : clone(s);
      r.i = n;
      return r;
    },

    rawOf: rawOf,
    copiesOf: copiesOf,
    holesOf: holesOf,
    liveOf: liveOf,
    perRack: perRack,
    riskRacks: riskRacks,
    riskCount: riskCount,
    holeCount: holeCount,
    countsAfter: countsAfter,
    totals: totals,
    health: health,
    group: group,
    active: active,
    rackOf: rackOf,
    hostOf: hostOf,
    hostName: hostName,
    rackOsds: rackOsds,
    /** The group of PG `pg` in a state. */
    groupOf: function (s, pg) { return UNCODE[s.pgs[pg]]; },
    /** The copies of a PG for drawing: grouped by rack (1, 2, 3), in CRUSH order within a rack, then one null per
        hole. Each copy is { osd, rack, host }. */
    drawOrder: function (pool, rule, pg) {
      var c = copiesOf(pool, rule, pg).map(function (x, k) { return { osd: x, rack: rackOf(x), host: hostOf(x), k: k }; });
      c.sort(function (a, b) { return a.rack - b.rack || a.k - b.k; });
      var out = c.map(function (x) { return { osd: x.osd, rack: x.rack, host: x.host }; });
      for (var h = holesOf(pool, rule, pg); h > 0; h--) out.push(null);
      return out;
    },
    /** The PG id as Ceph writes it: pool.hex. */
    pgId: function (pool, pg) { return POOLS[pool].id + '.' + pg.toString(16); },
    /** The rule as text: replicated pools choose firstn, erasure-coded pools indep. */
    ruleMode: function (pool) { return POOLS[pool].type === 'erasure' ? 'indep' : 'firstn'; }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
