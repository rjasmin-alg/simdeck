/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-dfs: part 1, a client resolves the namespace folder \\firma.local\dfs\projekti by a referral from its
   own site's namespace server (targets in its own site first, then by site link cost), caches it for the TTL, fails
   over to the next target and, without failback, sticks to it; part 2, DFS Replication carries a saved file to the
   other member in the next replication window, and a file changed on both members before that is a conflict that
   the later save wins. One step = one message or one event. Rules and numbers: SPEC.md.
   The "ask once, get a referral, cache it for a TTL" pattern (valid/left at expiresAt) is the one of
   sims/dns-resolution/sim.js @ af33d0c; that model is not in models/ and its DNS functions do not fit, so the pattern
   is copied, not the code.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. orderTargets, compareVersions and the window arithmetic work on plain
   data with no strings. */
(function (root) {
  'use strict';

  var PATH = '\\\\firma.local\\dfs\\projekti';
  var FILE = 'plan.xlsx';
  /** Rule 3: referral cache TTL for a folder and (mentioned only) for a namespace root, seconds. */
  var TTL_FOLDER = 1800;
  var TTL_ROOT = 300;
  /** Site link costs (the scene has one WAN link). */
  var SITE_COST = { 'ST|ZG': 100 };
  var T1 = 9 * 3600;          // part 1 starts 09:00
  var T2 = 10 * 3600;         // part 2 starts 10:00
  var V1_TIME = 9 * 3600;     // v1 of plan.xlsx, 09:00

  /** The parties, left to right: the lanes of the chart. */
  var LANES = ['CL-ZG', 'FS-ZG', 'DC-ZG', 'DC-ST', 'FS-ST', 'CL-ST'];
  var SITE = { 'CL-ZG': 'ZG', 'DC-ZG': 'ZG', 'FS-ZG': 'ZG', 'FS-ST': 'ST', 'DC-ST': 'ST', 'CL-ST': 'ST' };
  var USER = { 'CL-ZG': 'Ana', 'CL-ST': 'Marko' };
  var NS_OF = { ZG: 'DC-ZG', ST: 'DC-ST' };
  var FS_OF = { ZG: 'FS-ZG', ST: 'FS-ST' };
  /** Folder targets of the namespace folder: server and share. */
  var TARGETS = [{ server: 'FS-ZG', site: 'ZG', share: '\\\\FS-ZG\\projekti' }, { server: 'FS-ST', site: 'ST', share: '\\\\FS-ST\\projekti' }];

  function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** Cost between two sites: 0 inside a site, the site link cost otherwise. */
  function siteCost(a, b, costs) {
    if (a === b) return 0;
    var k = [a, b].sort().join('|');
    var c = (costs || SITE_COST)[k];
    return c === undefined ? Infinity : c;
  }

  /**
   * Rule 2: the referral's target order for a client in site `site`, "lowest cost": own site first, then other sites by
   * ascending cost. Equal cost is random in reality; the model's tie-break is server name order.
   * targets: [{ server, site }] → server names.
   */
  function orderTargets(targets, site, costs) {
    return targets.slice().sort(function (a, b) {
      return cmp(siteCost(site, a.site, costs), siteCost(site, b.site, costs)) || cmp(a.server, b.server);
    }).map(function (x) { return x.server; });
  }

  // ── the referral cache (rule 3; the dns-resolution convention: valid while expiresAt > t) ──

  function valid(e, t) { return !!e && e.expiresAt > t; }
  function left(e, t) { return Math.max(0, e.expiresAt - t); }

  // ── versions (rules 6, 7) ──

  /** The ids a version was built on, nearest first: 'marko' → ['ana', 'v1'] when Marko saved over Ana's. */
  function ancestors(versions, id) {
    var out = [], cur = versions[id] && versions[id].base;
    while (cur) { out.push(cur); cur = versions[cur] && versions[cur].base; }
    return out;
  }

  /**
   * Rule 6 and 7: what a server holding `local` does with an `incoming` version.
   * → 'same' | 'replace' (incoming was built on local) | 'older' (local already contains incoming) |
   *   'conflict-in' (both changed, incoming saved later: it wins) | 'conflict-local' (local wins).
   * Equal save times: the version saved on the server whose name sorts first wins (model tie-break).
   */
  function compareVersions(versions, local, incoming) {
    if (local === incoming) return 'same';
    if (ancestors(versions, incoming).indexOf(local) >= 0) return 'replace';
    if (ancestors(versions, local).indexOf(incoming) >= 0) return 'older';
    var L = versions[local], I = versions[incoming];
    var inWins = I.mtime > L.mtime || (I.mtime === L.mtime && cmp(I.server, L.server) < 0);
    return inWins ? 'conflict-in' : 'conflict-local';
  }

  /**
   * Rule 5: the first replication window strictly after `after` (a window at the same time as a save ran before
   * it) and after `last` (the last window shown). Windows are at T2 + k·every, k ≥ 1.
   */
  function nextWindow(after, last, every) {
    var from = Math.max(after, last);
    var k = Math.floor((from - T2) / every) + 1;
    if (k < 1) k = 1;
    return T2 + k * every;
  }

  /** Rule 5, send order: by save time, then by the sending server's name. */
  function sendOrder(pending) {
    return pending.slice().sort(function (a, b) { return cmp(a.mtime, b.mtime) || cmp(a.server, b.server); });
  }

  // ── state ──

  function server(s, id) { for (var i = 0; i < s.servers.length; i++) if (s.servers[i].id === id) return s.servers[i]; return null; }
  function client(s, id) { for (var i = 0; i < s.clients.length; i++) if (s.clients[i].id === id) return s.clients[i]; return null; }

  function msg(s, m) {
    m.n = s.msgs.length + 1;
    m.t = s.t;
    s.msgs.push(m);
    return m;
  }

  /** The schedule of each part (SPEC.md, Timelines). */
  function schedule(p) {
    if (p.part === 'replication') {
      var tm = T2 + p.secondEditDelay;
      return [{ t: T2, kind: 'save', client: 'CL-ZG' }, { t: tm, kind: 'open', client: 'CL-ST' }, { t: tm, kind: 'save', client: 'CL-ST' }];
    }
    if (p.fsStUp) return [{ t: T1, kind: 'open', client: 'CL-ZG' }, { t: T1, kind: 'open', client: 'CL-ST' }];
    return [{ t: T1, kind: 'open', client: 'CL-ST' }, { t: T1 + 600, kind: 'up', server: 'FS-ST' }, { t: T1 + 1860, kind: 'open', client: 'CL-ST' }];
  }

  // ── part 1 ──

  /** An "open" by a client: use the cached referral, or ask for one (rules 1, 3). */
  function startOpen(s, c) {
    var e = c.cache[0];
    if (valid(e, s.t) && c.connectedTo) {
      s.queue.push({ kind: 'connect', client: c.id, tries: [c.connectedTo], how: 'cached' });
    } else {
      s.queue.push({ kind: 'refReq', client: c.id }, { kind: 'referral', client: c.id });
    }
  }

  /** After a referral: which targets to try, in order (rule 4: failover, stickiness, failback). */
  function triesAfterReferral(s, c, targets, p) {
    var cur = c.connectedTo;
    if (cur && !p.failback && targets.indexOf(cur) >= 0 && server(s, cur).up) return { tries: [cur], how: 'stick' };
    return { tries: targets.slice(), how: cur ? (p.failback ? 'failback' : 'first') : 'first' };
  }

  function stepPart1(s, item, p) {
    var c = item.client ? client(s, item.client) : null;
    switch (item.kind) {
      case 'open':
        s.t = item.t;
        startOpen(s, c);
        return false;
      case 'up': {
        s.t = item.t;
        server(s, item.server).up = true;
        msg(s, { kind: 'up', lane: item.server });
        s.touched.push({ server: item.server });
        return true;
      }
      case 'refReq': {
        var ns = NS_OF[c.site];
        var expired = c.cache.length > 0;
        msg(s, { kind: 'refReq', from: c.id, to: ns, path: PATH, expired: expired });
        if (expired) s.touched.push({ client: c.id });
        return true;
      }
      case 'referral': {
        var targets = orderTargets(TARGETS, c.site);
        msg(s, { kind: 'referral', from: NS_OF[c.site], to: c.id, path: PATH, targets: targets, ttl: TTL_FOLDER });
        c.cache = [{ path: PATH, targets: targets, ttl: TTL_FOLDER, expiresAt: s.t + TTL_FOLDER }];
        s.touched.push({ client: c.id });
        var next = triesAfterReferral(s, c, targets, p);
        s.queue.unshift({ kind: 'connect', client: c.id, tries: next.tries, how: next.how, attempt: 0 });
        return true;
      }
      case 'connect': {
        var target = item.tries[0];
        var up = server(s, target).up;
        var m = msg(s, { kind: 'connect', from: c.id, to: target, ok: up, how: item.how, attempt: item.attempt || 0,
          wan: SITE[target] !== c.site, share: TARGETS.filter(function (x) { return x.server === target; })[0].share });
        if (up) {
          m.prev = c.connectedTo;
          c.connectedTo = target;
        } else if (item.tries.length > 1) {
          // rule 4: failover to the next target of the cached list
          s.queue.unshift({ kind: 'connect', client: c.id, tries: item.tries.slice(1), how: 'next', attempt: (item.attempt || 0) + 1 });
        } else {
          c.connectedTo = null;
        }
        s.touched.push({ client: c.id });
        return true;
      }
      default:
        return false;
    }
  }

  // ── part 2 ──

  function save(s, c) {
    var fs = server(s, FS_OF[c.site]);
    var id = c.user.toLowerCase();
    var v = { id: id, base: fs.file, writer: c.user, mtime: s.t, server: fs.id };
    s.versions[id] = v;
    fs.file = id;
    fs.pending.push({ id: id, server: fs.id, mtime: s.t });
    s.replication.saves++;
    msg(s, { kind: 'save', from: c.id, to: fs.id, version: id, base: v.base });
    s.touched.push({ server: fs.id, what: 'file' });
  }

  function stepPart2(s, item, p) {
    var c = item.client ? client(s, item.client) : null;
    switch (item.kind) {
      case 'save':
        s.t = item.t;
        save(s, c);
        return true;
      case 'open': {
        if (item.t !== undefined) s.t = item.t;
        var fs = server(s, FS_OF[c.site]);
        c.saw = fs.file;
        msg(s, { kind: 'open', from: c.id, to: fs.id, version: fs.file, final: !!item.final });
        s.touched.push({ server: fs.id, what: 'file', how: 'used' });
        return true;
      }
      case 'repl': {
        var from = server(s, item.from), to = server(s, item.from === 'FS-ZG' ? 'FS-ST' : 'FS-ZG');
        from.pending = from.pending.filter(function (x) { return x.id !== item.id; });
        if (from.file !== item.id) return false;  // rule 5: it lost a conflict here; nothing to send
        var local = to.file;
        var res = compareVersions(s.versions, local, item.id);
        msg(s, { kind: 'repl', from: from.id, to: to.id, version: item.id, local: local, result: res });
        if (res === 'replace' || res === 'conflict-in') {
          to.file = item.id;
          to.pending = to.pending.filter(function (x) { return x.id !== local; });
        }
        if (res === 'conflict-in') {
          to.bin.push(local);
          s.conflicts.push({ file: FILE, winner: item.id, loser: local, at: to.id, movedTo: 'ConflictAndDeleted' });
          s.queue.unshift({ kind: 'log', server: to.id, loser: local });
          s.touched.push({ server: to.id, what: 'bin' });
        }
        if (res === 'conflict-local') s.conflicts.push({ file: FILE, winner: local, loser: item.id, at: to.id, movedTo: null });
        s.touched.push({ server: to.id, what: 'file' });
        return true;
      }
      case 'log':
        msg(s, { kind: 'log', lane: item.server, loser: item.loser });
        s.touched.push({ server: item.server, what: 'bin' });
        return true;
      default:
        return false;
    }
  }

  /** Part 2 without queued messages: the next window or user action, or the end (rule 5). */
  function planPart2(s, p) {
    var r = s.replication;
    var pend = [];
    s.servers.forEach(function (x) { pend = pend.concat(x.pending); });
    var w = null;
    if (pend.length && (p.linkUp || r.saves > r.blockedSaves)) {
      // after the newest pending save: with the link down, older saves of an earlier batch are still pending
      var newest = Math.max.apply(null, pend.map(function (x) { return x.mtime; }));
      w = nextWindow(newest, r.lastWindow, p.replicateAfter);
    }
    var u = s.todo.length ? s.todo[0].t : null;
    if (w !== null && (u === null || w <= u)) {
      // tie-break: a window at the same time as a user action runs first
      s.t = w;
      r.lastWindow = w;
      if (p.linkUp) {
        var order = sendOrder(pend);
        msg(s, { kind: 'window', lane: order[0].server, blocked: false, count: order.length });
        order.forEach(function (x) { s.queue.push({ kind: 'repl', from: x.server, id: x.id }); });
      } else {
        r.blockedSaves = r.saves;
        msg(s, { kind: 'window', lane: pend[0].server, blocked: true, count: pend.length });
      }
      return 'msg';
    }
    if (u !== null) return 'todo';
    if (!s.finalDone) {
      s.finalDone = true;
      s.queue.push({ kind: 'open', client: 'CL-ZG', final: true });
      return 'queued';
    }
    return 'done';
  }

  var logic = {
    defaults: { part: 'namespace', fsStUp: true, failback: false, linkUp: true, secondEditDelay: 120, replicateAfter: 900 },

    presets: [
      { id: 'referral', params: { part: 'namespace', fsStUp: true, failback: false } },
      { id: 'failover', params: { part: 'namespace', fsStUp: false, failback: false } },
      { id: 'conflict', params: { part: 'replication', linkUp: true, secondEditDelay: 120, replicateAfter: 900 } },
      { id: 'no-conflict', params: { part: 'replication', linkUp: true, secondEditDelay: 1200, replicateAfter: 900 } }
    ],

    PATH: PATH, FILE: FILE, TTL_FOLDER: TTL_FOLDER, TTL_ROOT: TTL_ROOT, SITE_COST: SITE_COST, T1: T1, T2: T2,
    LANES: LANES, SITE: SITE, USER: USER, TARGETS: TARGETS,

    /** Steps for these params: run to the end (SPEC.md, Expected numbers). */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (s.phase !== 'done' && n < 40) { n++; s = logic.step(s, n, p); }
      return s.phase === 'done' ? s.msgs.length : n;
    },

    initial: function (p) {
      var replication = p.part === 'replication';
      return {
        part: replication ? 'replication' : 'namespace',
        t: replication ? T2 : T1,
        phase: 'run',
        clients: ['CL-ZG', 'CL-ST'].map(function (id) {
          var c = { id: id, site: SITE[id], user: USER[id], cache: [], connectedTo: null, saw: null };
          // part 2 starts with each client connected to its own site's server (part 1's outcome)
          if (replication) c.connectedTo = FS_OF[c.site];
          return c;
        }),
        servers: ['FS-ZG', 'FS-ST'].map(function (id) {
          return { id: id, site: SITE[id], up: replication || p.fsStUp || id !== 'FS-ST', file: 'v1', bin: [], pending: [] };
        }),
        versions: { v1: { id: 'v1', base: null, writer: null, mtime: V1_TIME, server: null } },
        replication: { linkUp: !!p.linkUp, every: p.replicateAfter, lastWindow: T2, saves: 0, blockedSaves: 0 },
        conflicts: [],
        msgs: [],
        todo: schedule(p),
        queue: [],
        finalDone: false,
        touched: []
      };
    },

    /** State after step n: one message or event more. */
    step: function (s0, n, p) {
      var s = clone(s0);
      if (s.phase === 'done') return s;
      s.touched = [];
      var part1 = s.part === 'namespace';
      for (var guard = 0; guard < 20; guard++) {
        var item = null;
        if (s.queue.length) item = s.queue.shift();
        else if (part1) {
          if (!s.todo.length) { s.phase = 'done'; break; }
          item = s.todo.shift();
        } else {
          var what = planPart2(s, p);
          if (what === 'msg') break;
          if (what === 'done') { s.phase = 'done'; break; }
          if (what === 'queued') continue;
          item = s.todo.shift();
        }
        if (part1 ? stepPart1(s, item, p) : stepPart2(s, item, p)) break;
      }
      // done as soon as nothing is left, so the controller's step count is the number of messages
      if (s.phase !== 'done' && !s.queue.length && !s.todo.length) {
        if (part1) s.phase = 'done';
        else if (s.finalDone) s.phase = 'done';
      }
      return s;
    },

    // exported for the page and the tests
    siteCost: siteCost,
    orderTargets: orderTargets,
    valid: valid,
    left: left,
    ancestors: ancestors,
    compareVersions: compareVersions,
    nextWindow: nextWindow,
    sendOrder: sendOrder,
    server: server,
    client: client
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
