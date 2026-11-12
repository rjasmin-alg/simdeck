/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-multipath: one LUN reached over four paths (two host ports × two array controllers), I/O running
   while paths, a port, a controller or everything fails and comes back. One step is one tick of the path checker
   (5 s). A tick: (a) the scripted fault changes the links; (b) 4 I/O requests go through the path selector of the
   active path group (an I/O on a dead path fails, the path is marked failed, the I/O is resent elsewhere); (c) the
   path checker runs: it marks dead paths it had not seen fail and reinstates paths that are back; (d) the group
   switch and failback; (e) queued I/O is sent once a path is usable, or failed when no_path_retry runs out.
   Rules, their order and every expected number: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Seconds per tick: the path checker's polling interval (multipath.conf(5) polling_interval, default 5). */
  var TICK = 5;
  /** I/O requests the application issues per tick. */
  var IO_PER_TICK = 4;
  /** ALUA priorities: paths to the controller that owns the LUN are active/optimized, the others non-optimized. */
  var PRIO_OPT = 50;
  var PRIO_NONOPT = 10;
  /** The controller that owns the LUN. */
  var OWNER = 'A';

  /** The four paths in list order (the order multipath lists them): disk, host port, controller, SCSI address. */
  var PATHS = [
    { dev: 'sda', port: 'h0', ctrl: 'A', hctl: '2:0:0:1' },
    { dev: 'sdb', port: 'h1', ctrl: 'A', hctl: '3:0:0:1' },
    { dev: 'sdc', port: 'h0', ctrl: 'B', hctl: '2:0:1:1' },
    { dev: 'sdd', port: 'h1', ctrl: 'B', hctl: '3:0:1:1' }
  ];
  /** Without multipath the filesystem sits on this one disk (the task: sdb). */
  var PLAIN_DEV = 'sdb';

  var GROUPINGS = ['failover', 'multibus', 'group_by_prio'];
  var FAILBACKS = ['immediate', 'manual'];
  var NO_PATH_RETRY = ['queue', 'fail', '3'];
  /** What the scripted fault takes down. Port h0 is the same set as switch A (h0 is cabled to switch A). */
  var FAULTS = { sdb: ['sdb'], h0: ['sda', 'sdc'], 'ctrl-A': ['sda', 'sdb'], all: ['sda', 'sdb', 'sdc', 'sdd'] };

  /** The page's presets, in key order (1–5). Numbers each one must show: SPEC.md. */
  var PRESETS = [
    { id: 'alua-failover', params: {} },
    { id: 'multibus-rr', params: { grouping: 'multibus', fault: 'sdb', failAt: 2, downFor: 3, ticks: 6 } },
    { id: 'all-down-queue', params: { fault: 'all', failAt: 2, downFor: 4, noPathRetry: 'queue', ticks: 8 } },
    { id: 'all-down-fail', params: { fault: 'all', failAt: 2, downFor: 4, noPathRetry: 'fail', ticks: 6 } },
    { id: 'no-multipath', params: { useMultipath: false, fault: 'sdb', failAt: 2, downFor: 4, ticks: 5 } }
  ];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** Params made safe: the page and the URL may hand in anything. */
  function norm(p) {
    p = p || {};
    var d = logic.defaults;
    function int(v, lo, hi, def) { v = Math.round(Number(v)); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : def; }
    function pick(v, list, def) { v = String(v); return list.indexOf(v) >= 0 ? v : def; }
    return {
      grouping: pick(p.grouping, GROUPINGS, d.grouping),
      failback: pick(p.failback, FAILBACKS, d.failback),
      noPathRetry: pick(p.noPathRetry, NO_PATH_RETRY, d.noPathRetry),
      useMultipath: p.useMultipath === undefined ? d.useMultipath : !!p.useMultipath,
      fault: Object.prototype.hasOwnProperty.call(FAULTS, p.fault) ? p.fault : d.fault,
      failAt: int(p.failAt, 1, 10, d.failAt),
      downFor: int(p.downFor, 1, 10, d.downFor),
      ticks: int(p.ticks, 3, 12, d.ticks)
    };
  }

  function prioOf(ctrl) { return ctrl === OWNER ? PRIO_OPT : PRIO_NONOPT; }
  function indexOf(dev) { for (var i = 0; i < PATHS.length; i++) if (PATHS[i].dev === dev) return i; return -1; }

  // ── rule 2: path groups ──

  /** Path groups for a grouping policy, as lists of devs, in the map's order: by priority (highest first), then by
      list order of their first path. Each group's prio here is the average of its paths' prios. `paths` (optional, for
      the tests) is another path list in list order; the page always uses PATHS. */
  function groupsFor(grouping, paths) {
    paths = paths || PATHS;
    function indexOf(dev) { for (var i = 0; i < paths.length; i++) if (paths[i].dev === dev) return i; return -1; }
    var lists;
    if (grouping === 'multibus') lists = [paths.map(function (p) { return p.dev; })];
    else if (grouping === 'failover') lists = paths.map(function (p) { return [p.dev]; });
    else {
      var by = {};
      var prios = [];
      paths.forEach(function (p) {
        var pr = prioOf(p.ctrl);
        if (!by[pr]) { by[pr] = []; prios.push(pr); }
        by[pr].push(p.dev);
      });
      lists = prios.map(function (pr) { return by[pr]; });
    }
    var groups = lists.map(function (devs) {
      var sum = 0;
      devs.forEach(function (d) { sum += prioOf(paths[indexOf(d)].ctrl); });
      return { devs: devs, prio: Math.floor(sum / devs.length) };
    });
    // stable sort: priority, then list order of the first path
    groups.sort(function (a, b) { return b.prio - a.prio || indexOf(a.devs[0]) - indexOf(b.devs[0]); });
    groups.forEach(function (g, i) { g.id = i + 1; });
    return groups;
  }

  function pathOf(s, dev) { for (var i = 0; i < s.paths.length; i++) if (s.paths[i].dev === dev) return s.paths[i]; return null; }
  function usable(s, dev) { return pathOf(s, dev).state === 'active'; }
  function groupById(s, id) { for (var i = 0; i < s.groups.length; i++) if (s.groups[i].id === id) return s.groups[i]; return null; }
  function usableIn(s, g) { return g.devs.filter(function (d) { return usable(s, d); }); }

  /** A group's priority as multipath reports it: the average prio of its usable paths, 0 when it has none. */
  function livePrio(s, g) {
    var u = usableIn(s, g);
    if (!u.length) return 0;
    var sum = 0;
    u.forEach(function (d) { sum += pathOf(s, d).prio; });
    return Math.floor(sum / u.length);
  }

  /** Rule 5 (and 6): the best group: one with a usable path, highest priority, then the most usable paths, then the
      map's order. null when no group has a usable path. */
  function bestGroup(s) {
    var best = null;
    s.groups.forEach(function (g) {
      var u = usableIn(s, g).length;
      if (!u) return;
      if (!best) { best = g; return; }
      var bp = livePrio(s, best), gp = livePrio(s, g);
      if (gp > bp || (gp === bp && u > usableIn(s, best).length)) best = g;
    });
    return best ? best.id : null;
  }

  // ── rule 3: the path selector ──

  /** round-robin: the next usable path of the group after the last one used, in list order, wrapping around. */
  function nextPath(s, g) {
    var u = usableIn(s, g);
    if (!u.length) return null;
    for (var i = 0; i < u.length; i++) if (indexOf(u[i]) > s.rr) return u[i];
    return u[0];
  }

  // ── events ──

  /** Which devs the fault takes down, and whether the scripted fault starts or ends on tick n. */
  function eventAt(p, n) {
    if (n === p.failAt) return { kind: 'fail', what: p.fault, devs: FAULTS[p.fault].slice() };
    if (n === p.failAt + p.downFor) return { kind: 'back', what: p.fault, devs: FAULTS[p.fault].slice() };
    return null;
  }

  function markChanged(s, dev) { if (s.changed.indexOf(dev) < 0) s.changed.push(dev); }

  function setState(s, dev, state, by) {
    var path = pathOf(s, dev);
    if (path.state === state) return;
    path.state = state;
    markChanged(s, dev);
    s.marks.push({ dev: dev, state: state, by: by });
  }

  function anyUsable(s) { return s.paths.some(function (x) { return x.state === 'active'; }); }

  /** An I/O that reached the filesystem as an error: the filesystem goes read-only (rule 7) and stays so. */
  function fsError(s, n) {
    s.errors += n;
    s.tickErrors += n;
    if (n > 0 && s.fsState !== 'ro') { s.fsState = 'ro'; s.fsWentRo = true; }
  }

  /** Queueing is on with queue, and with a number while retryLeft has not run out (rule 7). */
  function queueing(s, p) {
    if (p.noPathRetry === 'queue') return true;
    if (p.noPathRetry === 'fail') return false;
    return s.retryLeft === null || s.retryLeft > 0;
  }

  // ── (b) I/O ──

  /** One I/O through dm-multipath: rules 3, 4, 5 and 7. Returns its record. */
  function sendOne(s, p, id) {
    var io = { id: id, tries: [], on: null, result: null };
    for (;;) {
      var g = groupById(s, s.activeGroup);
      if (!g || !usableIn(s, g).length) {
        var b = bestGroup(s);
        if (b !== null) {
          // rule 5: the active group has no usable path: the next group by priority becomes active
          s.switches.push({ from: s.activeGroup, to: b, why: 'nopath' });
          s.activeGroup = b;
          continue;
        }
        // rule 7: no path at all. Like dm-mpath's current_pg, the active group is cleared: the next usable path is
        // looked for from the best group, whatever failback says (rule 6)
        if (s.activeGroup !== null) s.switches.push({ from: s.activeGroup, to: null, why: 'nopath' });
        s.activeGroup = null;
        if (s.retryLeft === null && /^\d+$/.test(p.noPathRetry)) { s.retryLeft = Number(p.noPathRetry); s.retryStarted = true; }
        if (queueing(s, p)) { s.queued += 1; s.tickQueued += 1; io.result = 'queued'; }
        else { fsError(s, 1); io.result = 'error'; }
        return io;
      }
      var dev = nextPath(s, g);
      s.rr = indexOf(dev);
      io.tries.push(dev);
      if (pathOf(s, dev).link === 'up') {
        io.on = dev;
        io.result = 'done';
        s.done += 1;
        s.tickDone[dev] += 1;
        return io;
      }
      // rule 4: the path died: the SCSI command fails, multipath marks the path failed and resends the I/O
      setState(s, dev, 'failed', 'io');
    }
  }

  /** Without multipath: every I/O goes to the one disk; a dead path is an error at once (rule 1). */
  function sendPlain(s, id) {
    var io = { id: id, tries: [PLAIN_DEV], on: null, result: null };
    var path = pathOf(s, PLAIN_DEV);
    if (path.link === 'up') { io.on = PLAIN_DEV; io.result = 'done'; s.done += 1; s.tickDone[PLAIN_DEV] += 1; }
    else { io.result = 'error'; fsError(s, 1); }
    return io;
  }

  // ── (c)–(e) the checker, the group switch and failback, queued I/O ──

  function checker(s, p) {
    // (c) path checker: every path's state follows its link now
    s.paths.forEach(function (x) {
      if (x.link === 'down' && x.state === 'active') setState(s, x.dev, 'failed', 'checker');
      else if (x.link === 'up' && x.state === 'failed') setState(s, x.dev, 'active', 'checker');
    });
    // (d) group: rule 5 when the active one has no usable path, rule 6 failback immediate
    var b = bestGroup(s);
    var g = groupById(s, s.activeGroup);
    if (b !== null && b !== s.activeGroup) {
      if (!g || !usableIn(s, g).length) { s.switches.push({ from: s.activeGroup, to: b, why: g ? 'nopath' : 'restore' }); s.activeGroup = b; }
      else if (p.failback === 'immediate') { s.switches.push({ from: s.activeGroup, to: b, why: 'failback' }); s.activeGroup = b; }
    }
    // (e) queued I/O: sent once a path is usable; with a number, counted down per interval with no path
    if (anyUsable(s)) {
      s.retryLeft = null;
      if (s.queued > 0) {
        var n = s.queued;
        s.queued = 0;
        s.drained = n;
        for (var k = 0; k < n; k++) {
          var dev = nextPath(s, groupById(s, s.activeGroup));
          s.rr = indexOf(dev);
          s.done += 1;
          s.tickDone[dev] += 1;
          s.drainedOn[dev] = (s.drainedOn[dev] || 0) + 1;
        }
      }
    } else if (s.retryLeft !== null && s.retryLeft > 0) {
      s.retryLeft -= 1;
      if (s.retryLeft === 0 && s.queued > 0) {
        s.flushed = s.queued;
        fsError(s, s.queued);
        s.queued = 0;
      }
    }
  }

  function fresh(s) {
    s.event = null;
    s.io = [];
    s.marks = [];
    s.changed = [];
    s.switches = [];
    s.tickDone = {};
    PATHS.forEach(function (x) { s.tickDone[x.dev] = 0; });
    s.tickQueued = 0;
    s.tickRetried = 0;
    s.tickErrors = 0;
    s.drained = 0;
    s.drainedOn = {};
    s.flushed = 0;
    s.fsWentRo = false;
    s.retryStarted = false;
  }

  var logic = {
    defaults: {
      grouping: 'group_by_prio', failback: 'immediate', noPathRetry: 'queue', useMultipath: true,
      fault: 'ctrl-A', failAt: 2, downFor: 3, ticks: 7
    },

    /** One step per tick. */
    steps: function (p) { return norm(p).ticks; },

    initial: function (params) {
      var p = norm(params);
      var s = {
        n: 0, t: 0,
        paths: PATHS.map(function (x) {
          return { dev: x.dev, port: x.port, ctrl: x.ctrl, hctl: x.hctl, prio: prioOf(x.ctrl), group: null, link: 'up', state: 'active' };
        }),
        groups: [],
        activeGroup: null,
        rr: -1,
        queued: 0, done: 0, retried: 0, errors: 0,
        retryLeft: null,
        fsState: 'rw',
        multipath: p.useMultipath,
        nextIo: 1
      };
      if (p.useMultipath) {
        s.groups = groupsFor(p.grouping).map(function (g) { return { id: g.id, prio: g.prio, devs: g.devs }; });
        s.groups.forEach(function (g) { g.devs.forEach(function (d) { pathOf(s, d).group = g.id; }); });
        s.activeGroup = bestGroup(s);
      }
      fresh(s);
      return s;
    },

    step: function (prev, n, params) {
      var p = norm(params);
      var s = clone(prev);
      fresh(s);
      s.n = n;
      s.t = n * TICK;
      // (a) the scripted fault: links go down or come back
      var ev = eventAt(p, n);
      if (ev) {
        s.event = ev;
        ev.devs.forEach(function (d) { pathOf(s, d).link = ev.kind === 'fail' ? 'down' : 'up'; });
      }
      if (!s.multipath) {
        // no checker and no map: the disks' states are their links (rule 1)
        s.paths.forEach(function (x) {
          var st = x.link === 'up' ? 'active' : 'failed';
          if (x.state !== st) { x.state = st; markChanged(s, x.dev); s.marks.push({ dev: x.dev, state: st, by: 'link' }); }
        });
        for (var j = 0; j < IO_PER_TICK; j++) s.io.push(sendPlain(s, s.nextIo++));
        return s;
      }
      // (b) the application's I/O
      for (var i = 0; i < IO_PER_TICK; i++) {
        var io = sendOne(s, p, s.nextIo++);
        if (io.tries.length > 1) { s.retried += 1; s.tickRetried += 1; }
        s.io.push(io);
      }
      // (c)–(e)
      checker(s, p);
      return s;
    },

    // helpers for the page and the tests
    norm: norm,
    groupsFor: groupsFor,
    bestGroup: bestGroup,
    livePrio: livePrio,
    usableIn: usableIn,
    nextPath: nextPath,
    pathOf: pathOf,
    groupById: groupById,
    eventAt: eventAt,
    queueing: queueing,
    prioOf: prioOf,
    TICK: TICK,
    IO_PER_TICK: IO_PER_TICK,
    PATHS: PATHS,
    PLAIN_DEV: PLAIN_DEV,
    FAULTS: FAULTS,
    GROUPINGS: GROUPINGS,
    FAILBACKS: FAILBACKS,
    NO_PATH_RETRY: NO_PATH_RETRY,
    PRESETS: PRESETS
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
