/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-special-bits: who the process runs as; who may delete in /tmp.
   The fourth octal digit (4 setuid, 2 setgid, 1 sticky) at the moment each bit acts: exec (the new process's real and
   effective IDs), open (the check with the effective IDs), create in a setgid directory (its group), delete in a
   sticky directory (file owner, directory owner, privilege). One step = one action of the preset's script.
   Rules, their order and every expected number: SPEC.md.
   Builds on sims/lnx-permissions-rwx (not in models/): its bit order and octal digits are rewritten here in a few lines
   (classBits, octal4, lsString with the special letters); the owner → group → others check is new (access).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The reusable part (lsString, octal4,
   special, access, exec, create, unlink, writeClears, chownClears) works on plain data and is promotable unchanged.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var S_ISUID = 0x800, S_ISGID = 0x400, S_ISVTX = 0x200;   // 04000, 02000, 01000 (rule 6)
  var PERM = 0x1ff;                                          // 0777
  var UMASK = 0x12;                                          // 022: touch makes 0644

  /** The users of the scene (rule 3 needs their groups). */
  var USERS = [
    { name: 'root', uid: 0, gid: 0, groups: [0] },
    { name: 'student', uid: 1000, gid: 1000, groups: [1000] },
    { name: 'ana', uid: 1001, gid: 1001, groups: [1001, 1002] }
  ];
  var GROUPS = { 0: 'root', 1000: 'student', 1001: 'ana', 1002: 'projekt' };
  var ACTORS = ['student', 'ana', 'root'];

  function f(path, kind, owner, group, mode, script) {
    return { path: path, kind: kind, owner: owner, group: group, mode: mode, script: !!script, isNew: false };
  }
  /** One tree for every preset (SPEC.md, Files). /tmp's mode comes from the sticky param. */
  function baseFiles(sticky) {
    return [
      f('/etc/shadow', 'file', 0, 0, 0),
      f('/home/ana/plan.txt', 'file', 1001, 1001, 0x180),            // 0600
      f('/opt/ana/report', 'file', 1001, 1001, 0x9ed),               // 4755
      f('/srv/projekt', 'dir', 0, 1002, 0x5f8),                      // 2770
      f('/tmp', 'dir', 0, 0, sticky ? 0x3ff : 0x1ff),                // 1777 / 0777
      f('/usr/bin/cat', 'file', 0, 0, 0x1ed),                        // 0755
      f('/usr/bin/ls', 'file', 0, 0, 0x1ed),
      f('/usr/bin/passwd', 'file', 0, 0, 0x9ed),                     // 4755
      f('/usr/local/bin/cleanup.sh', 'file', 0, 0, 0x9ed, true)      // 4755, #!/bin/sh
    ];
  }

  // ── the bits written out (rule 6) ──

  var PERMS = ['r', 'w', 'x'];
  /** The plain letters of one class (0 owner, 1 group, 2 others): r, w, x or '-'. What the check reads. */
  function classBits(mode, g) {
    var s = '';
    for (var i = 3 * g; i < 3 * g + 3; i++) s += mode & (1 << (8 - i)) ? PERMS[i % 3] : '-';
    return s;
  }
  /** The ls -l string: the special letter replaces the x of its class, lowercase with x, uppercase without. */
  function lsString(kind, mode) {
    var s = (kind === 'dir' ? 'd' : '-').split('');
    var sp = [S_ISUID, S_ISGID, S_ISVTX], low = ['s', 's', 't'];
    for (var g = 0; g < 3; g++) {
      var b = classBits(mode, g).split('');
      if (mode & sp[g]) b[2] = b[2] === 'x' ? low[g] : low[g].toUpperCase();
      s = s.concat(b);
    }
    return s.join('');
  }
  /** Four octal digits, the special one first: 0x9ed → '4755'. */
  function octal4(mode) { var s = (mode & 0xfff).toString(8); while (s.length < 4) s = '0' + s; return s; }
  /** The special digit broken into its parts, and the ls -l letter of each set bit with its index in the string. */
  function special(kind, mode) {
    var ls = lsString(kind, mode), out = [];
    [[S_ISUID, 4, 'setuid', 3], [S_ISGID, 2, 'setgid', 6], [S_ISVTX, 1, 'sticky', 9]].forEach(function (x) {
      if (mode & x[0]) out.push({ bit: x[2], value: x[1], index: x[3], letter: ls[x[3]], upper: ls[x[3]] === ls[x[3]].toUpperCase() });
    });
    return { digit: (mode >> 9) & 7, bits: out };
  }

  // ── rule 3: the check, with the effective IDs ──

  function inGroup(proc, gid) { return proc.egid === gid || proc.groups.indexOf(gid) >= 0; }

  /** The class check alone, as for an unprivileged process: owner, else group (EGID or a supplementary group), else
      others; their three bits decide. letters: the same three as ls -l prints them (s, S, t, T included). */
  function classCheck(proc, file, need) {
    var g = proc.euid === file.owner ? 0 : inGroup(proc, file.group) ? 1 : 2;
    var bits = classBits(file.mode, g);
    return {
      need: need, cls: ['owner', 'group', 'others'][g], bits: bits,
      letters: lsString(file.kind, file.mode).slice(1 + 3 * g, 4 + 3 * g),
      ok: need.split('').every(function (l) { return bits.indexOf(l) >= 0; }),
      euid: proc.euid, egid: proc.egid
    };
  }

  /** May proc do `need` (letters of r, w, x) on file? cls: 'root' | 'owner' | 'group' | 'others'. For root, `bits`
      says whether the class bits alone would have allowed it (bitsAllow). */
  function access(proc, file, need) {
    if (proc.euid === 0) {
      var c = classCheck(proc, file, need);
      // root needs at least one x bit to execute a regular file
      return { need: need, cls: 'root', bits: null, letters: null, bitsAllow: c.ok, euid: 0, egid: proc.egid,
        ok: !(file.kind === 'file' && need.indexOf('x') >= 0 && !(file.mode & 0x49)) };
    }
    return classCheck(proc, file, need);
  }

  function user(name) {
    for (var i = 0; i < USERS.length; i++) if (USERS[i].name === name) return USERS[i];
    throw new Error('no such user: ' + name);
  }
  function shellOf(u, cmd) {
    // via: how the effective IDs were set ('none', 'setuid', 'setgid', 'ignored': a script's bit, rule 8)
    return { cmd: cmd, ruid: u.uid, euid: u.uid, rgid: u.gid, egid: u.gid, groups: u.groups.slice(), via: 'none' };
  }
  function baseName(path) { return path.slice(path.lastIndexOf('/') + 1); }
  function dirName(path) { var i = path.lastIndexOf('/'); return i <= 0 ? '/' : path.slice(0, i); }

  // ── rules 1, 2, 8: exec ──

  /** u runs file: the x check (rule 3, with u's own IDs), then the new process's IDs. */
  function exec(u, file) {
    var proc = shellOf(u, file.script ? 'sh ' + baseName(file.path) : baseName(file.path));
    var check = access(proc, file, 'x');
    var r = { ok: check.ok, check: check, proc: proc, setuid: false, setgid: false, ignored: false };
    if (!check.ok) return r;
    if (file.script) { r.ignored = (file.mode & (S_ISUID | S_ISGID)) !== 0; proc.via = r.ignored ? 'ignored' : 'none'; return r; }  // rule 8
    if (file.mode & S_ISUID) { proc.euid = file.owner; r.setuid = true; }                      // rule 1
    if ((file.mode & (S_ISGID | 0x8)) === (S_ISGID | 0x8)) { proc.egid = file.group; r.setgid = true; }  // rule 2
    proc.via = r.setuid ? 'setuid' : r.setgid ? 'setgid' : 'none';
    return r;
  }

  // ── rule 5: create ──

  function create(proc, dir, path, mode) {
    var check = access(proc, dir, 'wx');
    var r = { ok: check.ok, errno: check.ok ? null : 'EACCES', check: check, file: null, fromDir: false };
    if (!check.ok) return r;
    r.fromDir = (dir.mode & S_ISGID) !== 0;
    r.file = f(path, 'file', proc.euid, r.fromDir ? dir.group : proc.egid, mode);
    return r;
  }

  // ── rules 4 and 9: delete (or rename) in a directory ──

  /** tests: the sticky rule's three tests in order, each { test, ok }; by: the first that passed (rule 9). */
  function unlink(proc, dir, file) {
    var r = { ok: false, errno: null, check: null, sticky: (dir.mode & S_ISVTX) !== 0, tests: [], by: null };
    if (!file) { r.errno = 'ENOENT'; return r; }
    r.check = access(proc, dir, 'wx');
    if (!r.check.ok) { r.errno = 'EACCES'; return r; }
    if (!r.sticky) { r.ok = true; r.by = 'dirWrite'; return r; }
    r.tests = [
      { test: 'fileOwner', ok: proc.euid === file.owner },
      { test: 'dirOwner', ok: proc.euid === dir.owner },
      { test: 'privileged', ok: proc.euid === 0 }
    ];
    for (var i = 0; i < r.tests.length; i++) if (r.tests[i].ok) { r.ok = true; r.by = r.tests[i].test; return r; }
    r.errno = 'EPERM';
    return r;
  }

  // ── rule 7: what clears the bits (regular files; Linux) ──

  /** setuid always goes; setgid goes when the group's x is set, or (an S) when the process is neither in the file's
      group nor privileged (Linux 6.x; SPEC.md rule 7). */
  function dropSuidSgid(file, proc) {
    var m = file.mode & ~S_ISUID;
    if ((file.mode & 0x8) || !(proc.euid === 0 || inGroup(proc, file.group))) m &= ~S_ISGID;
    return m;
  }
  /** The mode after a write by a process: root keeps the bits, anyone else clears them. */
  function writeClears(file, proc) {
    if (file.kind !== 'file' || proc.euid === 0) return file.mode;
    return dropSuidSgid(file, proc);
  }
  /** The mode after a chown or chgrp of a regular file by proc (root too, on Linux). */
  function chownClears(file, proc) { return file.kind === 'file' ? dropSuidSgid(file, proc) : file.mode; }

  // ── scripts: one action per step (SPEC.md, Presets) ──

  var A = 'actor';
  var SCRIPTS = {
    'passwd': { subject: '/usr/bin/passwd', actions: [
      { kind: 'exec', who: A, prog: '/usr/bin/passwd' },
      { kind: 'open', path: '/etc/shadow', need: 'w' },
      { kind: 'open', who: A, prog: '/usr/bin/cat', path: '/etc/shadow', need: 'r' }] },
    'owner-not-root': { subject: '/opt/ana/report', actions: [
      { kind: 'exec', who: A, prog: '/opt/ana/report' },
      { kind: 'open', path: '/home/ana/plan.txt', need: 'r' },
      { kind: 'open', path: '/etc/shadow', need: 'r' }] },
    'sticky-tmp': { subject: '/tmp', actions: [
      { kind: 'stat', who: A, path: '/tmp' },
      { kind: 'create', who: 'ana', path: '/tmp/ana.txt', mode: 0x1b6 },     // 0666
      { kind: 'open', who: A, path: '/tmp/ana.txt', need: 'w' },
      { kind: 'unlink', who: A, path: '/tmp/ana.txt' },
      { kind: 'unlink', who: 'ana', path: '/tmp/ana.txt' }] },
    'setgid-dir': { subject: '/srv/projekt', actions: [
      { kind: 'create', who: 'ana', path: '/srv/projekt/ana.txt', mode: 0x1b6 & ~UMASK },
      { kind: 'open', who: A, prog: '/usr/bin/ls', path: '/srv/projekt', need: 'r' },
      { kind: 'create', who: 'ana', path: '/tmp/ana2.txt', mode: 0x1b6 & ~UMASK }] },
    'script-ignored': { subject: '/usr/local/bin/cleanup.sh', actions: [
      { kind: 'exec', who: A, prog: '/usr/local/bin/cleanup.sh' },
      { kind: 'open', path: '/etc/shadow', need: 'r' }] }
  };
  var SCRIPT_IDS = Object.keys(SCRIPTS);

  /** The page's presets, in key order (1–5). */
  var PRESETS = SCRIPT_IDS.map(function (id) { return { id: id, params: { script: id, actor: 'student', sticky: true } }; });

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** Params made safe: the page and the URL may hand in anything. */
  function norm(p) {
    p = p || {};
    var d = logic.defaults;
    return {
      script: SCRIPTS[p.script] ? p.script : d.script,
      actor: ACTORS.indexOf(p.actor) >= 0 ? p.actor : d.actor,
      sticky: p.sticky === undefined ? d.sticky : !!p.sticky && p.sticky !== 'false'
    };
  }

  function findFile(s, path) {
    for (var i = 0; i < s.files.length; i++) if (s.files[i].path === path) return s.files[i];
    return null;
  }
  function byPath(a, b) { return a.path < b.path ? -1 : a.path > b.path ? 1 : 0; }

  /** One action (step n). Mutates s (a clone). */
  function act(s, a, n, p) {
    var who = a.who === A ? p.actor : a.who;
    s.action = { kind: a.kind, who: who || null, prog: a.prog || null, path: a.path || null, need: a.need || null, mode: a.mode === undefined ? null : a.mode };
    s.result = { ok: true, errno: null, rule: null, exec: null, check: null, sticky: null, created: null, removed: null, goneAt: null };
    s.changed = [];
    var res = s.result;

    if (a.kind === 'exec' || (a.kind === 'open' && a.prog)) {
      var prog = findFile(s, a.prog);
      var e = exec(user(who), prog);
      s.proc = e.proc;
      s.changed.push('proc');
      res.exec = { ok: e.ok, setuid: e.setuid, setgid: e.setgid, ignored: e.ignored, check: e.check };
      if (!e.ok) { res.ok = false; res.errno = 'EACCES'; res.rule = 3; return s; }
      if (a.kind === 'exec') { res.rule = e.ignored ? 8 : e.setgid && !e.setuid ? 2 : 1; return s; }
    } else if (a.kind !== 'open' || a.who) {
      // a user's own command (or, for an open, the user's shell writing to the file): real = effective
      s.proc = shellOf(user(who), { stat: 'ls', create: 'touch', unlink: 'rm', open: 'sh' }[a.kind]);
      s.changed.push('proc');
    }
    if (!s.proc) throw new Error('an open with no process: step ' + n);

    if (a.kind === 'open') {
      var file = findFile(s, a.path);
      if (!file) { res.ok = false; res.errno = 'ENOENT'; res.goneAt = s.gone[a.path] || null; res.rule = 3; return s; }
      var c = access(s.proc, file, a.need);
      res.check = c; res.ok = c.ok; res.errno = c.ok ? null : 'EACCES'; res.rule = 3;
      return s;
    }
    if (a.kind === 'stat') { res.rule = 6; return s; }
    if (a.kind === 'create') {
      if (findFile(s, a.path)) throw new Error('script creates an existing file: ' + a.path);
      var cr = create(s.proc, findFile(s, dirName(a.path)), a.path, a.mode);
      res.ok = cr.ok; res.errno = cr.errno; res.check = cr.check; res.rule = cr.ok ? 5 : 3;
      if (cr.ok) {
        cr.file.isNew = true;
        s.files.push(cr.file);
        s.files.sort(byPath);
        delete s.gone[a.path];
        res.created = { group: cr.file.group, fromDir: cr.fromDir };
        s.changed.push('entry:' + a.path);
      }
      return s;
    }
    // unlink
    var target = findFile(s, a.path);
    var u = unlink(s.proc, findFile(s, dirName(a.path)), target);
    res.ok = u.ok; res.errno = u.errno; res.check = u.check; res.rule = u.errno === 'EACCES' || u.errno === 'ENOENT' ? 3 : 4;
    res.sticky = { on: u.sticky, tests: u.tests, by: u.by };
    if (u.errno === 'ENOENT') res.goneAt = s.gone[a.path] || null;
    if (u.ok) {
      res.removed = clone(target);
      s.files = s.files.filter(function (x) { return x.path !== a.path; });
      s.gone[a.path] = n;
      s.changed.push('entry:' + a.path);
    }
    return s;
  }

  var logic = {
    defaults: { script: 'passwd', actor: 'student', sticky: true },

    /** One step per action of the script. */
    steps: function (p) { return SCRIPTS[norm(p).script].actions.length; },

    initial: function (params) {
      var p = norm(params);
      return {
        script: p.script, actor: p.actor, sticky: p.sticky,
        subject: SCRIPTS[p.script].subject,
        files: baseFiles(p.sticky),
        proc: null, action: null, result: null, gone: {}, changed: []
      };
    },

    step: function (prev, n, params) {
      var p = norm(params);
      var s = clone(prev);
      s.files.forEach(function (x) { x.isNew = false; });
      return act(s, SCRIPTS[p.script].actions[n - 1], n, p);
    },

    /** A directory's entries (direct children), for the middle panel. */
    entries: function (s, dir) {
      return s.files.filter(function (x) { return x.path !== dir && dirName(x.path) === dir; });
    },
    /** The file the current action touches (right panel): the open's or create's or unlink's path, else the program. */
    targetOf: function (s) {
      var a = s.action;
      if (!a) return null;
      if (a.kind === 'exec') return a.prog;
      return a.path;
    },

    // helpers for the page and the tests
    norm: norm,
    classBits: classBits,
    lsString: lsString,
    octal4: octal4,
    special: special,
    access: access,
    classCheck: classCheck,
    exec: exec,
    create: create,
    unlink: unlink,
    writeClears: writeClears,
    chownClears: chownClears,
    user: user,
    shellOf: shellOf,
    findFile: findFile,
    dirName: dirName,
    baseFiles: baseFiles,
    USERS: USERS,
    GROUPS: GROUPS,
    ACTORS: ACTORS,
    SCRIPTS: SCRIPTS,
    SCRIPT_IDS: SCRIPT_IDS,
    PRESETS: PRESETS,
    S_ISUID: S_ISUID,
    S_ISGID: S_ISGID,
    S_ISVTX: S_ISVTX
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
