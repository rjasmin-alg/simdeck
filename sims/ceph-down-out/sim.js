/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ceph-down-out: one OSD (osd.0) of cephsim's hyperconverged cluster (3 hosts × 4 OSDs, pool 1, 128 PGs,
   size 3 / min_size 2) stops, and time passes. Each step moves the clock to the next event: the OSD stops; peers
   miss its heartbeats for the grace period and it is marked down (its PGs degraded, nothing moves); the down→out
   timer runs; it is marked out (weight 0), CRUSH remaps its PGs and recovery copies the data elsewhere; or it comes
   back first and only catches up on the writes it missed. noout stops the timer; draining marks it out while up.
   Rules and numbers: SPEC.md. Placement (CRUSH with osd.0 in and out): placement.js, generated from the cephsim
   engine. PG grouping rules after sims/ceph-min-size/sim.js @ 74e4819 (group: live copies vs size / min_size),
   reduced to what one OSD of a 3/2 pool can do (never below min_size).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads placement.js and this file as classic scripts (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var placement = typeof module === 'object' && module.exports ? require('./placement.js') : root.SimPlacement;

  /** cephsim `hyperconverged`: 3 hosts × 4 OSDs, pool 1 cephfs_data, 128 PGs, size 3, min_size 2. */
  var HOSTS = [{ name: 'ceph-01', osds: [0, 1, 2, 3] }, { name: 'ceph-02', osds: [4, 5, 6, 7] }, { name: 'ceph-03', osds: [8, 9, 10, 11] }];
  var POOL = { id: 1, name: 'cephfs_data' }, PG_NUM = 128, SIZE = 3, MIN_SIZE = 2;
  /** The OSD this sim stops. */
  var SUBJECT = 0;
  /** osd_heartbeat_grace, default 20 s (Ceph docs "Configuring Monitor/OSD Interaction", check). It applies to an OSD
      that goes silent (a hung disk, a host without power); one stopped cleanly or crashing on a live host is marked
      down at once (it tells the monitors, or its peers get a refused connection). This sim's "stop" is the silent kind. */
  var GRACE = 20;
  /** The step after a timer that never fires (noout, the OSD never returns): one hour on. */
  var LATER = 3600;
  /** Drain: the empty OSD is stopped a minute after its data has moved (and marked down a grace period later). */
  var STOP_AFTER_DRAIN = 60;
  /** Client writes to the pool, MB/s (an assumption for the catch-up size: cephsim has no PG log). */
  var WRITE_MBS = 10;
  var TIB = Math.pow(2, 40), MB = 1e6;
  var MILESTONES = [0.25, 0.5, 1];
  var ZOOM = 6;

  var DOWN_OUT = [60, 600, 1800], RETURN_AT = ['never', 300, 900, 1800], RATES = [100, 200, 500];
  var ACTIONS = ['stop', 'drain'];
  var DATA_MIN = 0.5, DATA_MAX = 4;
  var GROUPS = ['clean', 'degraded', 'misplaced'];

  var cache = {};
  function sets(which) {
    if (!cache[which]) cache[which] = placement[which].split(' ').map(function (s) { return s.split(',').map(Number); });
    return cache[which];
  }
  /** CRUSH's set for a PG with every OSD in, and with osd.0 out (reweight 0). */
  function inSet(pg) { return sets('in')[pg]; }
  function outSet(pg) { return sets('out0')[pg]; }
  /** The PGs with a copy on osd.0, in PG order. */
  var onSubject = null;
  function subjectPgs() {
    if (!onSubject) {
      onSubject = [];
      for (var pg = 0; pg < PG_NUM; pg++) if (inSet(pg).indexOf(SUBJECT) >= 0) onSubject.push(pg);
    }
    return onSubject;
  }
  /** Where CRUSH puts osd.0's copy when osd.0 is out: the OSD in the out-set that was not in the in-set. */
  function targetOf(pg) {
    var a = inSet(pg);
    var add = outSet(pg).filter(function (x) { return a.indexOf(x) < 0; });
    return add.length ? add[0] : null;
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function pick(v, list, def) { for (var i = 0; i < list.length; i++) if (String(list[i]) === String(v)) return list[i]; return def; }

  function norm(p) {
    p = p || {};
    var data = Number(p.dataTiB);
    if (!(data >= DATA_MIN && data <= DATA_MAX)) data = 2.7;
    var o = {
      action: pick(p.action, ACTIONS, 'stop'),
      downOut: pick(p.downOut, DOWN_OUT, 600),
      noout: p.noout === true || p.noout === 'true',
      returnAt: pick(p.returnAt, RETURN_AT, 'never'),
      rateMBs: pick(p.rateMBs, RATES, 200),
      dataTiB: Math.round(data * 10) / 10
    };
    o.bytes = o.dataTiB * TIB;
    o.rate = o.rateMBs * MB;
    o.events = timeline({ action: o.action, grace: GRACE, downOut: o.downOut, noout: o.noout,
      returnAt: o.returnAt === 'never' ? Infinity : o.returnAt, full: o.bytes / o.rate });
    return o;
  }

  /** The event list (SPEC.md "Steps"). x: { action, grace, downOut, noout, returnAt (Infinity = never), full (seconds
      to move all of osd.0's data) }. Tie-breaks: a return at the moment the timer fires wins (the OSD is up again
      before it is marked out); a progress mark at or after the return is dropped. */
  function timeline(x) {
    var ev = [];
    if (x.action === 'drain') {
      ev.push({ kind: 'out', t: 0 });
      MILESTONES.forEach(function (f) { ev.push({ kind: 'progress', t: f * x.full, f: f }); });
      ev.push({ kind: 'stopEmpty', t: x.full + STOP_AFTER_DRAIN + x.grace });
      return ev;
    }
    var outAt = x.noout ? Infinity : x.grace + x.downOut, R = x.returnAt;
    ev.push({ kind: 'stop', t: 0 }, { kind: 'down', t: x.grace });
    if (R <= outAt) {
      if (x.noout && R > x.grace + x.downOut) ev.push({ kind: 'timer', t: x.grace + x.downOut });
      if (R === Infinity) { ev.push({ kind: 'later', t: Math.max(LATER, x.grace + x.downOut + 600) }); return ev; }
      ev.push({ kind: 'return', t: R }, { kind: 'clean' });
      return ev;
    }
    ev.push({ kind: 'wait', t: x.grace + x.downOut / 2 }, { kind: 'out', t: outAt });
    var ms = MILESTONES.filter(function (f) { return outAt + f * x.full < R; });
    if (R !== Infinity && !ms.length) ev.push({ kind: 'moving', t: (outAt + R) / 2 });
    ms.forEach(function (f) { ev.push({ kind: 'progress', t: outAt + f * x.full, f: f }); });
    if (R !== Infinity) ev.push({ kind: 'return', t: R }, { kind: 'clean' });
    return ev;
  }

  // ── the plan: what has to move, in the order it moves ──

  /** Rule 4: work for PGs short of a live copy (recovery) first, then the rest (backfill); then by PG number. */
  function sortItems(items) {
    return items.sort(function (a, b) {
      var ka = a.kind === 'recovery' ? 0 : 1, kb = b.kind === 'recovery' ? 0 : 1;
      return ka - kb || a.pg - b.pg;
    });
  }
  function totalOf(items) { return items.reduce(function (n, it) { return n + it.bytes; }, 0); }
  /** Rule 8: one item at a time, at the fixed rate: an item is done once the bytes moved cover it and every item
      before it. Returns per item 'done' | 'moving' | 'queued' and the fraction of the moving one. */
  function progressOf(plan) {
    var out = [], cum = 0, moved = plan ? plan.moved : 0;
    (plan ? plan.items : []).forEach(function (it) {
      var start = cum;
      cum += it.bytes;
      var eps = 1e-9 * Math.max(1, it.bytes);
      if (cum <= moved + eps) out.push({ st: 'done', f: 1 });
      else if (moved > start + eps) out.push({ st: 'moving', f: (moved - start) / it.bytes });
      else out.push({ st: 'queued', f: 0 });
    });
    return out;
  }
  function itemFor(plan, pg) {
    if (!plan) return -1;
    for (var k = 0; k < plan.items.length; k++) if (plan.items[k].pg === pg) return k;
    return -1;
  }

  /** Rules 2, 3, 6 and 7: a PG's group from osd.0's flags and the PG's work item. Only PGs with a copy on osd.0 can be
      anything but clean. osd = { run, up, in }; it = the PG's item or null; st = its progress. */
  function pgGroup(osd, it, st) {
    if (it && st !== 'done') {
      if (it.kind === 'recovery') return 'degraded';
      return 'misplaced';
    }
    if (it) return 'clean';
    if (!osd.up) return osd.in ? 'degraded' : 'clean';   // down and in: degraded, nothing moves; out: no copy here
    return 'clean';
  }

  function pgStates(s) {
    var pgs = [], prog = progressOf(s.plan), on = subjectPgs();
    for (var pg = 0; pg < PG_NUM; pg++) {
      if (on.indexOf(pg) < 0) { pgs.push('clean'); continue; }
      var k = itemFor(s.plan, pg);
      pgs.push(pgGroup(s.osd[SUBJECT], k >= 0 ? s.plan.items[k] : null, k >= 0 ? prog[k].st : null));
    }
    return pgs;
  }
  function countsOf(pgs) {
    var c = { clean: 0, degraded: 0, misplaced: 0 };
    pgs.forEach(function (g) { c[g] += 1; });
    return c;
  }

  /** Rule 5: a PG's writes missed while osd.0 was away (seconds), spread evenly over the pool's PGs. */
  function missedBytes(seconds) { return WRITE_MBS * MB * seconds / PG_NUM; }

  function blank(o) {
    var on = subjectPgs();
    var zoom = [];
    for (var k = 0; k < ZOOM; k++) zoom.push(on[Math.floor(k * on.length / ZOOM)]);
    var s = {
      t: 0,
      osd: {}, flags: { noout: o.noout },
      timers: {
        grace: { start: null, len: GRACE, state: 'idle' },
        downOut: { start: null, len: o.downOut, state: 'idle' }
      },
      plan: null,
      totals: { moved: 0, wasted: 0 },
      dataBytes: o.bytes, rate: o.rate,
      pgs: [], counts: null, zoom: zoom,
      ev: null, i: 0
    };
    s.osd[SUBJECT] = { run: true, up: true, in: true, downSince: null };
    s.pgs = pgStates(s);
    s.counts = countsOf(s.pgs);
    return s;
  }

  /** Move the clock to t: the plan in progress moves rate × elapsed bytes (capped at its total). */
  function advance(s, t, f) {
    if (s.plan) {
      var before = s.plan.moved;
      // a progress mark or the end sets the fraction exactly (no rounding from the clock)
      s.plan.moved = f !== undefined ? f * s.plan.total : Math.min(s.plan.total, (t - s.plan.start) * s.rate);
      s.totals.moved += s.plan.moved - before;
    }
    s.t = t;
  }

  function newPlan(s, items, kind) {
    items = sortItems(items);
    s.plan = { start: s.t, items: items, total: totalOf(items), moved: 0, kind: kind };
  }

  /** Rules 3 and 7: osd.0 out. Each of its PGs gets one item: copy osd.0's share to the OSD CRUSH picks now.
      Down: the PG is short of a live copy, so recovery. Up (drain): every copy is live, so backfill. */
  function planOut(s, o) {
    var per = o.bytes / subjectPgs().length;
    var up = s.osd[SUBJECT].up;
    newPlan(s, subjectPgs().map(function (pg) {
      return { pg: pg, to: targetOf(pg), from: SUBJECT, kind: up ? 'backfill' : 'recovery', bytes: per, log: false };
    }), 'out');
  }

  /** Rule 5: osd.0 back (up and in again). A PG whose copy was already rebuilt elsewhere is misplaced and is copied
      back to osd.0 (backfill, the whole share); every other PG of osd.0 catches up on the writes it missed (recovery
      from the log, small). What was copied for unfinished items is thrown away. */
  function planReturn(s, o) {
    var per = o.bytes / subjectPgs().length;
    var prog = progressOf(s.plan), old = s.plan;
    var items = [], wasted = 0;
    subjectPgs().forEach(function (pg) {
      var k = itemFor(old, pg);
      if (k >= 0 && prog[k].st === 'done') {
        items.push({ pg: pg, to: SUBJECT, from: old.items[k].to, kind: 'backfill', bytes: per, log: false });
      } else {
        if (k >= 0) wasted += prog[k].f * old.items[k].bytes;
        items.push({ pg: pg, to: SUBJECT, from: null, kind: 'recovery', bytes: missedBytes(s.t), log: true });
      }
    });
    s.totals.wasted += wasted;
    newPlan(s, items, 'return');
    return wasted;
  }

  function apply(s0, e, o) {
    var s = clone(s0), osd = s.osd[SUBJECT], ev = { kind: e.kind, changed: [], osdChanged: false };
    var t = e.t;
    if (e.kind === 'clean') t = s.plan.start + s.plan.total / s.rate;
    advance(s, t, e.kind === 'progress' ? e.f : e.kind === 'clean' ? 1 : undefined);
    if (e.kind === 'stop') {                                     // rule 1: still marked up until the grace runs out
      osd.run = false;
      s.timers.grace = { start: t, len: GRACE, state: 'running' };
    } else if (e.kind === 'down') {                              // rule 1, 2: marked down; degraded, nothing moves
      osd.up = false;
      osd.downSince = t;
      s.timers.grace.state = 'expired';
      s.timers.downOut = { start: t, len: o.downOut, state: o.noout ? 'held' : 'running' };
      ev.osdChanged = true;
    } else if (e.kind === 'timer') {                             // rule 6: noout, the timer does nothing
      s.timers.downOut.state = 'held';
    } else if (e.kind === 'out') {                               // rule 3 (timer) or rule 7 (drain, still up)
      osd.in = false;
      if (o.action !== 'drain') s.timers.downOut.state = 'expired';
      planOut(s, o);
      ev.osdChanged = true;
    } else if (e.kind === 'return') {                            // rule 5
      osd.run = true; osd.up = true; osd.in = true; osd.downSince = null;
      if (s.timers.downOut.state === 'running') s.timers.downOut.state = 'cancelled';
      ev.hadPlan = !!s.plan;
      ev.movedBefore = s.plan ? s.plan.moved : 0;
      ev.doneBefore = s.plan ? progressOf(s.plan).filter(function (p) { return p.st === 'done'; }).length : 0;
      ev.wasted = s.plan ? planReturn(s, o) : 0;
      if (!ev.hadPlan) {
        newPlan(s, subjectPgs().map(function (pg) {
          return { pg: pg, to: SUBJECT, from: null, kind: 'recovery', bytes: missedBytes(t), log: true };
        }), 'return');
      }
      ev.osdChanged = true;
    } else if (e.kind === 'stopEmpty') {                         // drain done: the empty OSD stops; down after the grace
      osd.run = false; osd.up = false; osd.downSince = t;
      s.timers.grace = { start: t - GRACE, len: GRACE, state: 'expired' };
      ev.osdChanged = true;
    } else if (e.kind === 'progress') {
      ev.f = e.f;
    }
    s.pgs = pgStates(s);
    s.counts = countsOf(s.pgs);
    s.pgs.forEach(function (g, pg) { if (g !== s0.pgs[pg]) ev.changed.push(pg); });
    s.ev = ev;
    return s;
  }

  function fmtTime(sec) {
    var x = Math.round(sec), h = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), r = x % 60;
    return h + ':' + ('0' + m).slice(-2) + ':' + ('0' + r).slice(-2);
  }

  var logic = {
    HOSTS: HOSTS, POOL: POOL, PG_NUM: PG_NUM, SIZE: SIZE, MIN_SIZE: MIN_SIZE, SUBJECT: SUBJECT, GRACE: GRACE,
    LATER: LATER, WRITE_MBS: WRITE_MBS, TIB: TIB, MB: MB, ZOOM: ZOOM, GROUPS: GROUPS,
    DOWN_OUT: DOWN_OUT, RETURN_AT: RETURN_AT, RATES: RATES, ACTIONS: ACTIONS, DATA_MIN: DATA_MIN, DATA_MAX: DATA_MAX,

    /** Parameter defaults (SPEC.md "Params"): the dead-disk run. */
    defaults: { action: 'stop', downOut: 600, noout: false, returnAt: 'never', rateMBs: 200, dataTiB: 2.7 },

    steps: function (p) { return norm(p).events.length; },
    norm: norm,
    timeline: timeline,
    initial: function (p) { return blank(norm(p)); },
    step: function (s, n, p) {
      var o = norm(p), e = o.events[n - 1];
      var r = e ? apply(s, e, o) : clone(s);
      r.i = n;
      return r;
    },

    inSet: inSet,
    outSet: outSet,
    targetOf: targetOf,
    subjectPgs: subjectPgs,
    pgGroup: pgGroup,
    sortItems: sortItems,
    progressOf: progressOf,
    itemFor: itemFor,
    missedBytes: missedBytes,
    fmtTime: fmtTime,
    /** The PG id as Ceph writes it: pool.hex. */
    pgId: function (pg) { return POOL.id + '.' + pg.toString(16); },
    hostOf: function (x) { for (var i = 0; i < HOSTS.length; i++) if (HOSTS[i].osds.indexOf(x) >= 0) return i; return -1; }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
