/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-nfs-root-squash: a client user's request reaches an NFS export carrying only numbers (uid, gid).
   The server decides in order: the export's ro/rw, then the squash mapping, then the ordinary permission bits with
   the mapped ids; a created file gets the mapped ids as owner. One step = one request of the preset's script.
   Rules, their order and every expected number: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The reusable part (mapIds, permCheck,
   exportCheck, lsString) works on plain data and is promotable to models/ unchanged.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // ── nine bits (from sims/lnx-permissions-rwx/sim.js @ 33e6114: bit, octal, lsString) ──

  var ALL = 0x1ff; // 0777
  var PERMS = ['r', 'w', 'x'];
  function bit(i) { return 1 << (8 - i); }
  /** Three octal digits, owner first: 0o640 → '640'. */
  function octal(mode) { var s = (mode & ALL).toString(8); while (s.length < 3) s = '0' + s; return s; }
  /** The ls -l string: type character, then a letter for a set bit and a dash for a clear one. */
  function lsString(kind, mode) {
    var s = kind === 'dir' ? 'd' : '-';
    for (var i = 0; i < 9; i++) s += mode & bit(i) ? PERMS[i % 3] : '-';
    return s;
  }
  /** The three letters of one class: 'owner' | 'group' | 'others'. */
  function classBits(mode, cls) {
    var g = { owner: 0, group: 1, others: 2 }[cls];
    return lsString('file', mode).slice(1 + 3 * g, 4 + 3 * g);
  }

  // ── the two machines ──

  /** Client democli1: the users that send requests. `via` is how the book's student gets there (sudo). */
  var CLIENT = {
    host: 'democli1', mountpoint: '/mnt/sa-posluzitelja',
    users: [{ name: 'root', uid: 0, gid: 0 }, { name: 'bin', uid: 1, gid: 1 }, { name: 'student', uid: 1000, gid: 1000 }]
  };
  /** Server demosrv1 (ch18): its own users. 65534 is the anonymous account (exports(5) default). */
  var SERVER = {
    host: 'demosrv1', addr: '192.168.180.1', path: '/srv/zajednicko', clients: '192.168.180.0/24',
    users: [{ name: 'root', uid: 0 }, { name: 'bin', uid: 1 }, { name: 'ana', uid: 1000 }, { name: 'nobody', uid: 65534 }]
  };
  var ANON = 65534;
  /** The client's umask 022 on a new file's 0666 (lnx-permissions-rwx rule 5). */
  var NEW_MODE = 0x1a4; // 0644
  var SQUASH = ['root_squash', 'no_root_squash', 'all_squash'];
  var WRITES = { create: true, write: true };

  function clientUser(name) {
    for (var i = 0; i < CLIENT.users.length; i++) if (CLIENT.users[i].name === name) return CLIENT.users[i];
    throw new Error('no such client user: ' + name);
  }
  /** The server's name for a uid, or null when its /etc/passwd has none. */
  function serverName(uid) {
    for (var i = 0; i < SERVER.users.length; i++) if (SERVER.users[i].uid === uid) return SERVER.users[i].name;
    return null;
  }

  // ── scripts: the export's files and the requests, one per step (SPEC.md, Presets) ──

  function f(name, uid, gid, mode) { return { name: name, uid: uid, gid: gid, mode: mode, isNew: false }; }
  function r(user, op, name, via) { return { user: user, op: op, name: name, via: via || null }; }

  var SCRIPTS = {
    'book-ro': { dir: { uid: 0, gid: 0, mode: 0x1ed }, files: [f('proba.txt', 0, 0, 0x1a4)],
      requests: [r('student', 'read', 'proba.txt'), r('root', 'create', 'moje.txt', 'sudo')] },
    'root-squashed': { dir: { uid: 0, gid: 0, mode: 0x1ff }, files: [f('tajna', 1000, 1000, 0x180)],
      requests: [r('root', 'create', 'a.txt', 'sudo'), r('root', 'read', 'tajna', 'sudo'), r('student', 'read', 'tajna')] },
    'uid-collision': { dir: { uid: 0, gid: 0, mode: 0x1ff }, files: [f('plan.txt', 1000, 1000, 0x180)],
      requests: [r('student', 'read', 'plan.txt'), r('student', 'write', 'plan.txt'), r('student', 'create', 'biljeska.txt')] },
    'no-root-squash': { dir: { uid: 0, gid: 0, mode: 0x1ed }, files: [f('tajna', 1000, 1000, 0x180)],
      requests: [r('root', 'create', 'b.txt', 'sudo'), r('root', 'read', 'tajna', 'sudo')] },
    'bin-not-squashed': { dir: { uid: 0, gid: 0, mode: 0x1ed }, files: [f('alati', 1, 1, 0x1a4)],
      requests: [r('root', 'write', 'alati', 'sudo'), r('bin', 'write', 'alati')] },
    'all-squash': { dir: { uid: 0, gid: 0, mode: 0x1ff }, files: [f('tajna', 1000, 1000, 0x180)],
      requests: [r('student', 'create', 'biljeska.txt'), r('student', 'read', 'tajna')] }
  };
  var SCRIPT_IDS = Object.keys(SCRIPTS);

  /** The page's presets, in key order (1–6): the script and its export. */
  var PRESETS = [
    { id: 'book-ro', params: { script: 'book-ro', ro: true, squash: 'root_squash' } },
    { id: 'root-squashed', params: { script: 'root-squashed', ro: false, squash: 'root_squash' } },
    { id: 'uid-collision', params: { script: 'uid-collision', ro: false, squash: 'root_squash' } },
    { id: 'no-root-squash', params: { script: 'no-root-squash', ro: false, squash: 'no_root_squash' } },
    { id: 'bin-not-squashed', params: { script: 'bin-not-squashed', ro: false, squash: 'root_squash' } },
    { id: 'all-squash', params: { script: 'all-squash', ro: false, squash: 'all_squash' } }
  ];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** Params made safe: the page and the URL may hand in anything. */
  function norm(p) {
    p = p || {};
    var d = logic.defaults;
    return {
      script: SCRIPTS[p.script] ? p.script : d.script,
      ro: p.ro === undefined ? d.ro : !!p.ro,
      squash: SQUASH.indexOf(p.squash) >= 0 ? p.squash : d.squash
    };
  }

  // ── the server's three decisions ──

  /** Phase (b), rules 2 and 7: an ro export refuses every write, before anything else is looked at. */
  function exportCheck(exp, op) { return exp.ro && !!WRITES[op] ? 'EROFS' : null; }

  /** Phase (c), rules 3–5: the ids the server will use, and what kind of mapping it was. Uid and gid separately. */
  function mapIds(exp, uid, gid) {
    var anonuid = exp.anonuid == null ? ANON : exp.anonuid;
    var anongid = exp.anongid == null ? ANON : exp.anongid;
    var mu = uid, mg = gid;
    if (exp.squash === 'all_squash') { mu = anonuid; mg = anongid; }
    else if (exp.squash === 'root_squash') { if (uid === 0) mu = anonuid; if (gid === 0) mg = anongid; }
    return { uid: mu, gid: mg };
  }

  /** Phase (d), rule 6: the first class that matches decides with its bits; uid 0 passes (root).
      `need` is a string of letters, all of which must be set. */
  function permCheck(uid, gid, obj, need) {
    if (uid === 0) return { cls: 'root', need: need, bits: null, ok: true };
    var cls = uid === obj.uid ? 'owner' : gid === obj.gid ? 'group' : 'others';
    var bits = classBits(obj.mode, cls);
    var ok = need.split('').every(function (l) { return bits.indexOf(l) >= 0; });
    return { cls: cls, need: need, bits: bits, ok: ok };
  }

  /** How the caption names the mapping (SPEC.md, Captions). */
  function mapKind(exp, user, mapped) {
    if (user.uid === 0) return mapped.uid === 0 ? 'rootKept' : 'squashedRoot';
    if (mapped.uid !== user.uid) return 'squashedAll';
    if (serverName(mapped.uid) !== user.name) return 'collision';
    if (exp.squash === 'root_squash' && user.uid > 0 && user.uid < 1000) return 'keptSystem';
    return 'kept';
  }

  function findFile(s, name) {
    for (var i = 0; i < s.files.length; i++) if (s.files[i].name === name) return s.files[i];
    return null;
  }

  /** One request through phases (a)–(e). Mutates s (a clone). */
  function serve(s, req) {
    var user = clientUser(req.user);
    s.request = { clientUser: user.name, via: req.via, uid: user.uid, gid: user.gid, op: req.op, name: req.name };
    s.phases = { send: 'ok', export: 'skipped', map: 'skipped', perm: 'skipped', apply: 'skipped' };
    s.mapped = null;
    s.check = null;
    s.changed = [];

    function done(errno, extra) {
      s.result = Object.assign({ ok: !errno, errno: errno, exit: errno ? 1 : 0, owner: null, content: null }, extra || {});
      s.log.push({ n: s.log.length + 1, clientUser: user.name, op: req.op, name: req.name, errno: errno });
      return s;
    }

    // (b) export
    var er = exportCheck(s.export, req.op);
    if (er) { s.phases.export = 'refused'; s.changed.push('phase:export'); return done(er); }
    s.phases.export = 'ok';

    // (c) map
    var m = mapIds(s.export, user.uid, user.gid);
    s.mapped = { uid: m.uid, gid: m.gid, kind: mapKind(s.export, user, m) };
    s.phases.map = 'ok';
    if (m.uid !== user.uid || m.gid !== user.gid) s.changed.push('mapped');

    // (d) permission check with the mapped ids
    var file = findFile(s, req.name);
    var target, need;
    if (req.op === 'create') { target = 'dir'; need = 'wx'; }
    else {
      if (!file) throw new Error('script reads a missing file: ' + req.name);
      target = 'file'; need = req.op === 'read' ? 'r' : 'w';
    }
    var obj = target === 'dir' ? s.dir : file;
    var c = permCheck(m.uid, m.gid, obj, need);
    s.check = { target: target, name: target === 'dir' ? '.' : req.name, cls: c.cls, need: c.need, bits: c.bits, ok: c.ok };
    if (!c.ok) {
      s.phases.perm = 'refused';
      s.changed.push(target === 'dir' ? 'file:.' : 'file:' + req.name);
      return done('EACCES');
    }
    s.phases.perm = 'ok';

    // (e) apply
    s.phases.apply = 'ok';
    if (req.op === 'create') {
      if (file) throw new Error('script creates an existing file: ' + req.name);
      s.files.push({ name: req.name, uid: m.uid, gid: m.gid, mode: NEW_MODE, isNew: true });
      s.changed.push('file:' + req.name);
      return done(null, { owner: { uid: m.uid, gid: m.gid } });
    }
    if (req.op === 'write') s.changed.push('file:' + req.name);
    return done(null, { content: req.op === 'read' ? req.name : null });
  }

  var logic = {
    defaults: { script: 'book-ro', ro: true, squash: 'root_squash' },

    /** One step per request of the script. */
    steps: function (p) { return SCRIPTS[norm(p).script].requests.length; },

    initial: function (params) {
      var p = norm(params);
      var sc = SCRIPTS[p.script];
      return {
        export: { ro: p.ro, squash: p.squash, anonuid: ANON, anongid: ANON },
        dir: clone(sc.dir),
        files: clone(sc.files),
        request: null, mapped: null, check: null, result: null, phases: null,
        changed: [], log: []
      };
    },

    step: function (prev, n, params) {
      var p = norm(params);
      var s = clone(prev);
      s.files.forEach(function (x) { x.isNew = false; });
      return serve(s, SCRIPTS[p.script].requests[n - 1]);
    },

    // helpers for the page and the tests
    norm: norm,
    exportCheck: exportCheck,
    mapIds: mapIds,
    permCheck: permCheck,
    mapKind: mapKind,
    serverName: serverName,
    clientUser: clientUser,
    findFile: findFile,
    octal: octal,
    lsString: lsString,
    classBits: classBits,
    /** The squash words as exportfs -v prints them (SPEC.md, Rules). */
    squashWords: function (squash) {
      return squash === 'no_root_squash' ? ['no_root_squash', 'no_all_squash']
        : squash === 'all_squash' ? ['root_squash', 'all_squash'] : ['root_squash', 'no_all_squash'];
    },
    CLIENT: CLIENT,
    SERVER: SERVER,
    ANON: ANON,
    NEW_MODE: NEW_MODE,
    SQUASH: SQUASH,
    SCRIPTS: SCRIPTS,
    SCRIPT_IDS: SCRIPT_IDS,
    PRESETS: PRESETS
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
