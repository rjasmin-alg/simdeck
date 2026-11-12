/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-userns-mapping: root inside a rootless container is an unprivileged UID outside.
   A container's processes and the host user act on one bind-mounted directory, /data. Files keep the host's number
   (the one on disk); each side sees it through the user namespace's uid_map. One step = one action of the preset's
   script. Rules, their order and every expected number: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The reusable part (defaultMap, checkMap,
   toOutside, toInside, access) works on plain data and is promotable to models/ unchanged.
   Builds on sims/lnx-namespaces (two views, "a container is a process"); no code of it is reused: that model is about
   PID, network and mount namespaces, this one only about the user namespace.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var OVERFLOW = 65534;          // /proc/sys/kernel/overflowuid: what an unmapped ID looks like (rule 3)
  var SUB_COUNT = 65536;         // the /etc/subuid range's size (rule 2)
  var ALL = 4294967295;          // the initial namespace's identity line: 0 0 4294967295 (rule 6)
  var UMAX = 4294967296;         // IDs are 32-bit
  var NEW_MODE = 0x1a4;          // 0644: 0666 with umask 022
  var SUBUID_STARTS = [100000, 200000];

  var HOST_USER = { name: 'student', uid: 1000 };
  /** The container's processes: inside user and UID, PID inside and on the host (lnx-namespaces' numbers). */
  var PROCS = [
    { id: 'sh', user: 'root', uidIn: 0, pidIn: 1, pidOut: 4321 },
    { id: 'web', user: 'www', uidIn: 33, pidIn: 7, pidOut: 4330 },
    { id: 'app', user: 'app', uidIn: 1000, pidIn: 9, pidOut: 4335 }
  ];
  /** Each side's /etc/passwd, for the names next to the numbers. 65534 is the overflow ID's name on both. */
  var NAMES = {
    c: { 0: 'root', 33: 'www', 1000: 'app', 65534: 'nobody' },
    h: { 0: 'root', 1000: 'student', 65534: 'nobody' }
  };

  // ── the map (rules 1, 2, 6, 7) ──

  /** Rule 2 (rootless) or rule 6 (rootful): the uid_map the container's processes get. */
  function defaultMap(rootless, subuidStart) {
    if (!rootless) return [{ inside: 0, outside: 0, count: ALL }];
    return [{ inside: 0, outside: HOST_USER.uid, count: 1 }, { inside: 1, outside: subuidStart, count: SUB_COUNT }];
  }

  function overlaps(a0, n, b0, m) { return a0 < b0 + m && b0 < a0 + n; }
  /** Rule 7: the kernel takes a map only if every count is at least 1, every range fits in 32 bits and no two
      ranges overlap, inside or outside. Returns null for a valid map, else the reason. */
  function checkMap(map) {
    for (var i = 0; i < map.length; i++) {
      var a = map[i];
      if (!(a.count >= 1)) return { errno: 'EINVAL', why: 'count', line: i };
      if (a.inside + a.count > UMAX || a.outside + a.count > UMAX) return { errno: 'EINVAL', why: 'range', line: i };
      for (var j = 0; j < i; j++) {
        var b = map[j];
        if (overlaps(a.inside, a.count, b.inside, b.count)) return { errno: 'EINVAL', why: 'inside', line: i, other: j };
        if (overlaps(a.outside, a.count, b.outside, b.count)) return { errno: 'EINVAL', why: 'outside', line: i, other: j };
      }
    }
    return null;
  }

  /** Rule 1, outward: the first line whose inside range holds id. { id, line } or { id: null, line: null }. */
  function toOutside(map, id) {
    for (var i = 0; i < map.length; i++) {
      var l = map[i];
      if (id >= l.inside && id < l.inside + l.count) return { id: l.outside + (id - l.inside), line: i };
    }
    return { id: null, line: null };
  }
  /** Rules 1 and 3, inward: the first line whose outside range holds id, else the overflow ID 65534. */
  function toInside(map, id) {
    for (var i = 0; i < map.length; i++) {
      var l = map[i];
      if (id >= l.outside && id < l.outside + l.count) return { id: l.inside + (id - l.outside), line: i, unmapped: false };
    }
    return { id: OVERFLOW, line: null, unmapped: true };
  }

  // ── access (rules 4, 5, 6) ──

  var PERMS = ['r', 'w', 'x'];
  /** The ls -l letters of one class (0 owner, 1 group, 2 others). */
  function classBits(mode, g) {
    var s = '';
    for (var i = 3 * g; i < 3 * g + 3; i++) s += mode & (1 << (8 - i)) ? PERMS[i % 3] : '-';
    return s;
  }
  function lsString(mode) { return '-' + classBits(mode, 0) + classBits(mode, 1) + classBits(mode, 2); }
  function octal(mode) { var s = (mode & 0x1ff).toString(8); while (s.length < 3) s = '0' + s; return s; }

  /** May an actor do `need` (letters) on a file? The actor is { side: 'h', uid } (a host process) or
      { side: 'c', uidIn } (a container process, translated by `map`). Every file's group is its owner's own group, so
      the group class never decides (SPEC.md, State); the check is owner, else others.
      cls: 'root' (host UID 0), 'cap' (root inside, capability over a file whose owner is mapped), 'owner', 'others'.
      capDenied: root inside whose capability does not reach the file (owner unmapped). */
  function access(map, actor, file, need) {
    var uidOut = actor.side === 'c' ? toOutside(map, actor.uidIn).id : actor.uid;
    if (uidOut === null) throw new Error('unmapped process: ' + actor.uidIn);
    var r = { uidOut: uidOut, need: need, cls: null, bits: null, ok: false, capDenied: false };
    if (uidOut === 0) { r.cls = 'root'; r.ok = true; return r; }                       // rule 6: host root
    if (actor.side === 'c' && actor.uidIn === 0) {                                    // rule 4: root inside
      if (!toInside(map, file.uidOut).unmapped) { r.cls = 'cap'; r.ok = true; return r; }
      r.capDenied = true;
    }
    r.cls = uidOut === file.uidOut ? 'owner' : 'others';                              // rules 4, 5: the bits
    r.bits = classBits(file.mode, r.cls === 'owner' ? 0 : 2);
    r.ok = need.split('').every(function (l) { return r.bits.indexOf(l) >= 0; });
    return r;
  }

  // ── scripts: the files at the start and the actions, one per step (SPEC.md, Presets) ──

  function c(by, op, path) { return { side: 'c', by: by, op: op, path: path || null }; }
  function h(op, path) { return { side: 'h', by: HOST_USER.name, op: op, path: path || null }; }

  var SCRIPTS = {
    'root-inside': { files: [], actions: [c('sh', 'create', 'a'), h('ls')] },
    'service-user': { files: [], actions: [c('web', 'create', 'b'), h('ls'), h('write', 'b')] },
    'host-file-inside': { files: [{ path: 'secret', uidOut: 0, mode: 0x180 }], actions: [h('ls'), c('sh', 'ls'), c('sh', 'read', 'secret')] },
    'rootful': { files: [], actions: [c('sh', 'create', 'c'), h('ls')] }
  };
  var SCRIPT_IDS = Object.keys(SCRIPTS);

  /** The page's presets, in key order (1–4). */
  var PRESETS = [
    { id: 'root-inside', params: { script: 'root-inside', rootless: true, subuidStart: 100000 } },
    { id: 'service-user', params: { script: 'service-user', rootless: true, subuidStart: 100000 } },
    { id: 'host-file-inside', params: { script: 'host-file-inside', rootless: true, subuidStart: 100000 } },
    { id: 'rootful', params: { script: 'rootful', rootless: false, subuidStart: 100000 } }
  ];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** Params made safe: the page and the URL may hand in anything. */
  function norm(p) {
    p = p || {};
    var d = logic.defaults;
    var start = Number(p.subuidStart);
    return {
      script: SCRIPTS[p.script] ? p.script : d.script,
      rootless: p.rootless === undefined ? d.rootless : !!p.rootless && p.rootless !== 'false',
      subuidStart: SUBUID_STARTS.indexOf(start) >= 0 ? start : d.subuidStart
    };
  }

  function proc(id) {
    for (var i = 0; i < PROCS.length; i++) if (PROCS[i].id === id) return PROCS[i];
    throw new Error('no such process: ' + id);
  }
  function findFile(s, path) {
    for (var i = 0; i < s.files.length; i++) if (s.files[i].path === path) return s.files[i];
    return null;
  }
  function addUsed(s, line) { if (line !== null && s.used.indexOf(line) < 0) s.used.push(line); }

  /** One action. Mutates s (a clone). */
  function act(s, a) {
    s.action = clone(a);
    s.result = { ok: true, errno: null, check: null };
    s.used = [];
    s.changed = [];
    var who;
    if (a.side === 'c') {
      var p = proc(a.by), out = toOutside(s.map, p.uidIn);
      who = { side: 'c', proc: p.id, user: p.user, uidIn: p.uidIn, uidOut: out.id, line: out.line };
      addUsed(s, out.line);
      s.changed.push('proc:' + p.id);
    } else {
      who = { side: 'h', proc: null, user: HOST_USER.name, uidIn: null, uidOut: HOST_USER.uid, line: null };
    }
    s.who = who;
    var actor = a.side === 'c' ? { side: 'c', uidIn: who.uidIn } : { side: 'h', uid: who.uidOut };

    if (a.op === 'create') {
      if (findFile(s, a.path)) throw new Error('script creates an existing file: ' + a.path);
      // /data is 0777 (SPEC.md, One step): every create passes; the owner on disk is the actor's host UID
      s.files.push({ path: a.path, uidOut: who.uidOut, mode: NEW_MODE, isNew: true });
      s.files.sort(function (x, y) { return x.path < y.path ? -1 : x.path > y.path ? 1 : 0; });
      s.changed.push('file:' + a.path);
      return s;
    }
    if (a.op === 'ls') {
      s.changed.push('list:' + a.side);
      // the line that covers each listed owner (the container translates by it; the host's number lies in it)
      s.files.forEach(function (f) { addUsed(s, toInside(s.map, f.uidOut).line); });
      s.used.sort();
      return s;
    }
    // read / write
    var file = findFile(s, a.path);
    if (!file) throw new Error('script touches a missing file: ' + a.path);
    var r = access(s.map, actor, file, a.op === 'read' ? 'r' : 'w');
    s.result = { ok: r.ok, errno: r.ok ? null : 'EACCES', check: r };
    s.changed.push('file:' + a.path);
    addUsed(s, toInside(s.map, file.uidOut).line);
    s.used.sort();
    return s;
  }

  var logic = {
    defaults: { script: 'root-inside', rootless: true, subuidStart: 100000 },

    /** One step per action of the script. */
    steps: function (p) { return SCRIPTS[norm(p).script].actions.length; },

    initial: function (params) {
      var p = norm(params);
      var sc = SCRIPTS[p.script];
      return {
        rootless: p.rootless,
        subuidStart: p.subuidStart,
        map: defaultMap(p.rootless, p.subuidStart),
        subuid: { user: HOST_USER.name, start: p.subuidStart, count: SUB_COUNT },
        hostUser: clone(HOST_USER),
        procs: clone(PROCS),
        files: sc.files.map(function (f) { return { path: f.path, uidOut: f.uidOut, mode: f.mode, isNew: false }; }),
        action: null, who: null, result: null, used: [], changed: []
      };
    },

    step: function (prev, n, params) {
      var p = norm(params);
      var s = clone(prev);
      s.files.forEach(function (f) { f.isNew = false; });
      return act(s, SCRIPTS[p.script].actions[n - 1]);
    },

    /** The directory as one side lists it (ls -ln): number, name on that side, the map line, unmapped. */
    listing: function (s, side) {
      return s.files.map(function (f) {
        var t = side === 'h' ? { id: f.uidOut, line: null, unmapped: false } : toInside(s.map, f.uidOut);
        var back = side === 'h' ? toInside(s.map, f.uidOut) : t;
        return { path: f.path, mode: f.mode, uid: t.id, name: NAMES[side][t.id] || null, unmapped: back.unmapped, line: back.line, isNew: f.isNew };
      });
    },
    /** The processes as one side's ps shows them: user (name, or the number when that side has no name), PID. */
    processes: function (s, side) {
      return s.procs.map(function (p) {
        var out = toOutside(s.map, p.uidIn);
        var uid = side === 'c' ? p.uidIn : out.id;
        return { id: p.id, uid: uid, name: NAMES[side][uid] || null, pid: side === 'c' ? p.pidIn : p.pidOut, line: out.line };
      });
    },

    // helpers for the page and the tests
    norm: norm,
    defaultMap: defaultMap,
    checkMap: checkMap,
    toOutside: toOutside,
    toInside: toInside,
    access: access,
    classBits: classBits,
    lsString: lsString,
    octal: octal,
    proc: proc,
    findFile: findFile,
    OVERFLOW: OVERFLOW,
    SUB_COUNT: SUB_COUNT,
    ALL: ALL,
    NEW_MODE: NEW_MODE,
    SUBUID_STARTS: SUBUID_STARTS,
    HOST_USER: HOST_USER,
    PROCS: PROCS,
    NAMES: NAMES,
    SCRIPTS: SCRIPTS,
    SCRIPT_IDS: SCRIPT_IDS,
    PRESETS: PRESETS
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
