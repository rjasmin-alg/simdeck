/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-links-inodes: names are directory entries that point to inodes; the link count; symbolic links that
   store only a path. One step is one command: resolve the path (following symlinks where the command does), add,
   remove or rename the entry, change the link counts, run the freeing check, print the output. Rules and numbers:
   SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var BLOCK = 4096, TOTAL = 16, MAXLINKS = 40;
  var HOME = '/home/student';
  var DATE = 'Aug 30 10:08';
  var MODE = { file: '-rw-r--r--.', dir: 'drwxr-xr-x.', symlink: 'lrwxrwxrwx.' };
  var LETTER = { file: '-', dir: 'd', symlink: 'l' };
  var DIRSIZE = 6;                                   // an empty directory on the book's XFS (podmapa: 6)

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // ── paths ──

  function dirOf(p) { var i = p.lastIndexOf('/'); return i < 0 ? '.' : p.slice(0, i); }
  function baseOf(p) { return p.slice(p.lastIndexOf('/') + 1); }
  /** What the shell passes for ~: /home/student/… (error messages and stat print it so). */
  function expand(p) { return p === '~' ? HOME : p.indexOf('~/') === 0 ? HOME + p.slice(1) : p; }
  /** Rule 6: a symlink's text read from the symlink's own directory, unless it is absolute (/… or ~/…). */
  function joinFrom(dir, text) {
    if (text === HOME || text.indexOf(HOME + '/') === 0) return '~' + text.slice(HOME.length);   // the tables are keyed ~/…
    return text.charAt(0) === '/' || text.charAt(0) === '~' ? text : dir + '/' + text;
  }
  /** The filesystem a directory is on: everything under /mnt/usb is a second one (rule 2, EXDEV). */
  function fsOf(dir) { return dir === '/mnt/usb' || dir.indexOf('/mnt/usb/') === 0 ? 'usb' : 'root'; }

  function entryOf(s, dir, name) {
    var list = s.dirs[dir];
    if (!list) return null;
    for (var i = 0; i < list.length; i++) if (list[i].name === name) return list[i];
    return null;
  }
  function inodeOf(s, ino) { return s.inodes[String(ino)] || null; }

  /**
   * Resolve a path (rule 6). follow: follow a symlink in the last component. Returns { ok, dir, name, ino, hops, err }:
   * hops = [{ dir, name, ino }] each entry read, a symlink hop also with { text, next } (the path its text names);
   * on failure dir/name are where the lookup ended (the place a dangling symlink names) and err is ENOENT or ELOOP.
   */
  function resolve(s, path, follow) {
    var hops = [];
    var p = path;
    for (var depth = 0; ; depth++) {
      var dir = dirOf(p), name = baseOf(p);
      if (!s.dirs[dir]) return { ok: false, dir: dir, name: name, ino: null, hops: hops, err: 'ENOENT', missingDir: true };
      var e = entryOf(s, dir, name);
      if (!e) return { ok: false, dir: dir, name: name, ino: null, hops: hops, err: 'ENOENT' };
      var node = inodeOf(s, e.ino);
      var hop = { dir: dir, name: name, ino: e.ino };
      hops.push(hop);
      if (!follow || node.type !== 'symlink') return { ok: true, dir: dir, name: name, ino: e.ino, hops: hops, err: null };
      if (depth >= MAXLINKS) return { ok: false, dir: dir, name: name, ino: e.ino, hops: hops, err: 'ELOOP' };
      hop.text = node.data;
      hop.next = joinFrom(dir, node.data);
      p = hop.next;
    }
  }

  // ── blocks ──

  function blocksFor(size) { return Math.ceil(size / BLOCK); }
  function usedBlocks(s) { return s.blocks.filter(function (b) { return b !== null; }).length; }
  /** Rule 10: first fit from block 0. Returns the block numbers taken (fewer if the disk is full). */
  function allocate(s, ino, n) {
    var got = [];
    for (var i = 0; i < s.blocks.length && got.length < n; i++) if (s.blocks[i] === null) { s.blocks[i] = ino; got.push(i); }
    return got;
  }
  function release(s, node) {
    node.blocks.forEach(function (b) { s.blocks[b] = null; });
    var n = node.blocks.length;
    node.blocks = [];
    return n;
  }

  // ── one command ──

  function newInode(s, type, size, data) {
    var ino = type === 'dir' ? s.nextDirIno++ : s.nextIno++;
    s.inodes[String(ino)] = { type: type, nlink: type === 'dir' ? 2 : 1, openBy: [], size: size, data: data, blocks: [] };
    return ino;
  }

  /** Rule 4: the space goes only when no name and no process is left; a held file waits for its last close. */
  function freeCheck(s, ev, ino) {
    var node = inodeOf(s, ino);
    if (!node) return;
    var what = node.nlink > 0 ? 'kept' : node.openBy.length ? 'postponed' : 'freed';
    var f = { ino: ino, what: what, blocks: node.blocks.length };
    if (what === 'freed') {
      release(s, node);
      s.gone.inodes.push({ ino: ino, type: node.type });
      delete s.inodes[String(ino)];
    }
    ev.free.push(f);
  }

  function count(s, ev, ino, by) {
    var node = inodeOf(s, ino);
    var from = node.nlink;
    node.nlink += by;
    ev.counts.push({ ino: ino, from: from, to: node.nlink });
    s.changed.counts.push(ino);
  }

  function removeEntry(s, ev, dir, name) {
    var list = s.dirs[dir];
    var e = entryOf(s, dir, name);
    list.splice(list.indexOf(e), 1);
    ev.del.push({ dir: dir, name: name, ino: e.ino });
    s.gone.entries.push({ dir: dir, name: name, ino: e.ino });
    return e.ino;
  }
  function addEntry(s, ev, dir, name, ino) {
    s.dirs[dir].push({ name: name, ino: ino });
    ev.add.push({ dir: dir, name: name, ino: ino });
    s.changed.entries.push({ dir: dir, name: name });
  }

  function lsLines(s, dir) {
    var list = s.dirs[dir].slice().sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
    var rows = list.map(function (e) {
      var n = inodeOf(s, e.ino);
      return { ino: String(e.ino), mode: MODE[n.type], nlink: String(n.nlink), size: String(n.size),
        name: e.name + (n.type === 'symlink' ? ' -> ' + n.data : ''), kib: n.blocks.length * BLOCK / 1024 };
    });
    var wl = rows.reduce(function (w, r) { return Math.max(w, r.nlink.length); }, 0);
    var ws = rows.reduce(function (w, r) { return Math.max(w, r.size.length); }, 0);
    var pad = function (x, w) { while (x.length < w) x = ' ' + x; return x; };
    var total = rows.reduce(function (t, r) { return t + r.kib; }, 0);
    return ['total ' + total].concat(rows.map(function (r) {
      return [r.ino, r.mode, pad(r.nlink, wl), 'student', 'student', pad(r.size, ws), DATE, r.name].join(' ');
    }));
  }

  function noSuch(prog, path) { return prog + ': ' + expand(path) + ': No such file or directory'; }
  function failOf(prog, path, r) {
    return r.err === 'ELOOP' ? prog + ': ' + expand(path) + ': Too many levels of symbolic links' : noSuch(prog, path);
  }
  /** cat's lines; a big file with no text in the model prints a stand-in. */
  function textLines(text) { return text === null ? ['…'] : text.replace(/\n$/, '').split('\n'); }

  /**
   * Apply one command to state s (mutates s; the caller clones). Ops: ls, stat, cat, write, ln (sym), rm, mv, mkdir,
   * kill. Fills s.ev ({ resolve, add, del, ren, counts, free, err, made, op }) and s.out, s.changed, s.gone.
   */
  function apply(s, cmd) {
    var ev = s.ev;
    var out = s.out;
    var r, node, e;
    switch (cmd.op) {
      case 'ls': {
        if (!s.dirs[cmd.path]) { ev.err = 'ENOENT'; out.push('ls: cannot access \'' + expand(cmd.path) + '\': No such file or directory'); break; }
        lsLines(s, cmd.path).forEach(function (l) { out.push(l); });
        ev.listed = cmd.path;
        break;
      }
      case 'stat': {
        r = resolve(s, cmd.path, false);
        ev.resolve = r.hops;
        if (!r.ok) { ev.err = r.err; out.push('stat: cannot statx \'' + expand(cmd.path) + '\': No such file or directory'); break; }
        out.push(inodeOf(s, r.ino).nlink + ' ' + expand(cmd.path));
        break;
      }
      case 'cat': {
        r = resolve(s, cmd.path, true);
        ev.resolve = r.hops;
        if (!r.ok) { ev.err = r.err; out.push(failOf('cat', cmd.path, r)); break; }
        node = inodeOf(s, r.ino);
        if (node.type === 'dir') { ev.err = 'EISDIR'; out.push('cat: ' + expand(cmd.path) + ': Is a directory'); break; }
        ev.read = r.ino;
        textLines(node.data).forEach(function (l) { out.push(l); });
        break;
      }
      case 'write': {
        // printf 'text' > path: follows a symlink; an existing file is truncated and rewritten, a missing name is created
        // where the lookup ended (through a dangling symlink, the name it holds)
        r = resolve(s, cmd.path, true);
        ev.resolve = r.hops;
        if (!r.ok && (r.err !== 'ENOENT' || r.missingDir)) { ev.err = r.err; out.push('bash: ' + expand(cmd.path) + ': No such file or directory'); break; }
        if (r.ok) {
          node = inodeOf(s, r.ino);
          release(s, node);
          node.data = cmd.text; node.size = cmd.size != null ? cmd.size : cmd.text.length;
          node.blocks = allocate(s, r.ino, blocksFor(node.size));
          ev.wrote = r.ino;
          s.changed.inodes.push(r.ino);
        } else {
          var ino = newInode(s, 'file', cmd.size != null ? cmd.size : cmd.text.length, cmd.text);
          node = inodeOf(s, ino);
          node.blocks = allocate(s, ino, blocksFor(node.size));
          addEntry(s, ev, r.dir, r.name, ino);
          ev.made = ino; ev.wrote = ino;
          s.changed.inodes.push(ino);
        }
        break;
      }
      case 'ln': {
        var dir = dirOf(cmd.name), name = baseOf(cmd.name);
        if (!s.dirs[dir]) { ev.err = 'ENOENT'; out.push('ln: failed to create ' + (cmd.sym ? 'symbolic' : 'hard') + ' link \'' + expand(cmd.name) + '\': No such file or directory'); break; }
        if (cmd.sym) {
          // rule 5: a new inode holding the text; the target is not looked up and may be missing
          if (entryOf(s, dir, name)) { ev.err = 'EEXIST'; out.push('ln: failed to create symbolic link \'' + expand(cmd.name) + '\': File exists'); break; }
          var sl = newInode(s, 'symlink', cmd.target.length, cmd.target);
          addEntry(s, ev, dir, name, sl);
          ev.made = sl;
          s.changed.inodes.push(sl);
          break;
        }
        // rule 2: the target's entry, not followed (link(2) on Linux links a symlink itself)
        r = resolve(s, cmd.target, false);
        ev.resolve = r.hops;
        if (!r.ok) { ev.err = 'ENOENT'; out.push('ln: failed to access \'' + expand(cmd.target) + '\': No such file or directory'); break; }
        node = inodeOf(s, r.ino);
        if (node.type === 'dir') { ev.err = 'EPERM'; out.push('ln: ' + expand(cmd.target) + ': hard link not allowed for directory'); break; }
        if (entryOf(s, dir, name)) { ev.err = 'EEXIST'; out.push('ln: failed to create hard link \'' + expand(cmd.name) + '\': File exists'); break; }
        if (fsOf(dir) !== fsOf(r.dir)) {
          ev.err = 'EXDEV';
          out.push('ln: failed to create hard link \'' + expand(cmd.name) + '\' => \'' + expand(cmd.target) + '\': Invalid cross-device link');
          break;
        }
        addEntry(s, ev, dir, name, r.ino);
        count(s, ev, r.ino, +1);
        break;
      }
      case 'rm': {
        // rule 3 and 7: rm acts on the entry itself, a symlink included; rule 4 decides about the space
        r = resolve(s, cmd.path, false);
        ev.resolve = r.hops;
        if (!r.ok) { ev.err = 'ENOENT'; out.push('rm: cannot remove \'' + expand(cmd.path) + '\': No such file or directory'); break; }
        if (inodeOf(s, r.ino).type === 'dir') { ev.err = 'EISDIR'; out.push('rm: cannot remove \'' + expand(cmd.path) + '\': Is a directory'); break; }
        removeEntry(s, ev, r.dir, r.name);
        count(s, ev, r.ino, -1);
        freeCheck(s, ev, r.ino);
        break;
      }
      case 'mv': {
        // rule 8: rename the entry, keep the inode; an existing new name is replaced
        r = resolve(s, cmd.from, false);
        ev.resolve = r.hops;
        var tdir = dirOf(cmd.to), tname = baseOf(cmd.to);
        if (!r.ok) { ev.err = 'ENOENT'; out.push('mv: cannot stat \'' + expand(cmd.from) + '\': No such file or directory'); break; }
        if (!s.dirs[tdir] || fsOf(tdir) !== fsOf(r.dir)) { ev.err = 'EXDEV'; out.push('mv: not modelled'); break; }
        var old = entryOf(s, tdir, tname);
        if (old && old.ino === r.ino) break;            // rename() onto a name of the same file (itself too): nothing happens
        if (old) {
          removeEntry(s, ev, tdir, tname);
          count(s, ev, old.ino, -1);
        }
        e = entryOf(s, r.dir, r.name);
        s.dirs[r.dir].splice(s.dirs[r.dir].indexOf(e), 1);
        s.dirs[tdir].push({ name: tname, ino: e.ino });
        ev.ren = { dir: r.dir, from: r.name, toDir: tdir, to: tname, ino: e.ino };
        s.gone.entries.push({ dir: r.dir, name: r.name, ino: e.ino, renamed: true });
        s.changed.entries.push({ dir: tdir, name: tname });
        if (old) freeCheck(s, ev, old.ino);
        break;
      }
      case 'mkdir': {
        // mkdir -p: an existing directory is left alone. Rule 9: count 2 for the new one, +1 on a drawn parent
        if (s.dirs[cmd.path]) break;
        var pdir = dirOf(cmd.path);
        s.dirs[cmd.path] = [];
        ev.mkdir = cmd.path;
        if (s.dirs[pdir]) {
          var d = newInode(s, 'dir', DIRSIZE, null);
          addEntry(s, ev, pdir, baseOf(cmd.path), d);
          s.changed.inodes.push(d);
          var pr = resolve(s, pdir, false);
          if (pr.ok) count(s, ev, pr.ino, +1);
        }
        break;
      }
      case 'kill': {
        var proc = s.procs.filter(function (x) { return x.pid === cmd.pid; })[0];
        if (!proc) { ev.err = 'ESRCH'; out.push('bash: kill: (' + cmd.pid + ') - No such process'); break; }
        s.procs = s.procs.filter(function (x) { return x !== proc; });
        ev.ended = cmd.pid;
        out.push('[1]+  Terminated              tail -f ' + proc.path);
        node = inodeOf(s, proc.ino);
        if (node) {
          node.openBy = node.openBy.filter(function (p) { return p !== cmd.pid; });
          s.changed.inodes.push(proc.ino);
          freeCheck(s, ev, proc.ino);
        }
        break;
      }
    }
  }

  /** A process opens a file (tail -f path &): it follows symlinks and holds the inode it reaches. */
  function open(s, pid, path) {
    var r = resolve(s, path, true);
    if (!r.ok) return false;
    inodeOf(s, r.ino).openBy.push(pid);
    s.procs.push({ pid: pid, path: path, ino: r.ino });
    return true;
  }

  // ── the scenes ──

  var PID = 4242;
  function file(text, size) { return { type: 'file', nlink: 1, openBy: [], size: size != null ? size : text.length, data: text, blocks: [] }; }
  function dirNode() { return { type: 'dir', nlink: 2, openBy: [], size: DIRSIZE, data: null, blocks: [] }; }

  var LINE1 = 'prvi redak\n', LINE2 = 'novi redak\n';
  var BIG = 6 * BLOCK;

  var SCENES = {
    primjer: {
      dirs: { '~/proba': [{ name: 'datoteka.txt', ino: 33616720 }, { name: 'podmapa', ino: 41962518 }] },
      inodes: { 33616720: file(''), 41962518: dirNode() },
      held: '~/proba/datoteka.txt',
      script: [
        { op: 'ls', path: '~/proba' },
        { op: 'ln', target: '~/proba/datoteka.txt', name: '~/proba/tvrda-veza', then: '~/proba' },
        { op: 'rm', path: '~/proba/datoteka.txt', then: '~/proba' }
      ]
    },
    sadrzaj: {
      dirs: {}, inodes: {}, held: null,
      script: [
        { op: 'mkdir', path: '~/p2' },
        { op: 'write', path: '~/p2/a.txt', text: LINE1 },
        { op: 'ln', target: '~/p2/a.txt', name: '~/p2/b.txt' },
        { op: 'rm', path: '~/p2/a.txt' },
        { op: 'cat', path: '~/p2/b.txt' }
      ]
    },
    simbolicka: {
      dirs: { '~/p2': [{ name: 'a.txt', ino: 33616721 }] },
      inodes: { 33616721: file(LINE1) },
      held: '~/p2/a.txt',
      script: [
        { op: 'ln', sym: true, target: 'a.txt', name: '~/p2/s.txt', then: '~/p2' },
        { op: 'cat', path: '~/p2/s.txt' },
        { op: 'rm', path: '~/p2/a.txt' },
        { op: 'cat', path: '~/p2/s.txt' },
        { op: 'write', path: '~/p2/a.txt', text: LINE2 },
        { op: 'cat', path: '~/p2/s.txt' }
      ]
    },
    preimenuj: {
      dirs: { '~/p2': [{ name: 'a.txt', ino: 33616721 }] },
      inodes: { 33616721: file(LINE1) },
      held: '~/p2/a.txt',
      script: [
        { op: 'ln', target: '~/p2/a.txt', name: '~/p2/h.txt' },
        { op: 'ln', sym: true, target: 'a.txt', name: '~/p2/s.txt' },
        { op: 'mv', from: '~/p2/a.txt', to: '~/p2/b.txt', then: '~/p2' },
        { op: 'cat', path: '~/p2/h.txt' },
        { op: 'cat', path: '~/p2/s.txt' }
      ]
    },
    otvorena: {
      dirs: { '~/p2': [{ name: 'velika.log', ino: 33616721 }] },
      inodes: { 33616721: file(null, BIG) },
      held: '~/p2/velika.log',
      script: [
        { op: 'ls', path: '~/p2' },
        { op: 'rm', path: '~/p2/velika.log' },
        { op: 'ls', path: '~/p2' },
        { op: 'kill', pid: PID }
      ]
    }
  };
  var SCENE_IDS = Object.keys(SCENES);

  function blank(s) {
    s.ev = { op: null, resolve: [], add: [], del: [], ren: null, counts: [], free: [], err: null };
    s.out = [];
    s.changed = { entries: [], inodes: [], counts: [] };
    s.gone = { entries: [], inodes: [] };
  }

  function initialOf(p) {
    var id = SCENES[p.scene] ? p.scene : 'primjer';
    var sc = SCENES[id];
    var s = { scene: id, dirs: clone(sc.dirs), inodes: clone(sc.inodes), procs: [], blocks: [], cmd: null,
      nextIno: 33616721, nextDirIno: 41962519 };
    for (var i = 0; i < TOTAL; i++) s.blocks.push(null);
    Object.keys(s.inodes).sort().forEach(function (k) {
      var n = s.inodes[k];
      if (n.type === 'file') n.blocks = allocate(s, Number(k), blocksFor(n.size));   // directories and symlinks: inline
      if (n.type !== 'dir') s.nextIno = Math.max(s.nextIno, Number(k) + 1);
    });
    blank(s);
    if (p.holdOpen && sc.held) open(s, PID, sc.held);
    return s;
  }

  function stepOf(s, n, p) {
    var t = clone(s);
    blank(t);
    var cmd = SCENES[t.scene].script[n - 1];
    t.cmd = clone(cmd);
    t.ev.op = cmd.op;
    apply(t, cmd);
    if (cmd.then && !t.ev.err) {
      lsLines(t, cmd.then).forEach(function (l) { t.out.push(l); });
      t.ev.listed = cmd.then;
    }
    return t;
  }

  var logic = {
    /** Parameter defaults (task: preset primjer, block bar on, no process holding the file). */
    defaults: { scene: 'primjer', showBlocks: true, holdOpen: false },

    /** One step per scripted command (SPEC.md: 3, 5, 6, 5, 4). */
    steps: function (p) { return (SCENES[p.scene] || SCENES.primjer).script.length; },

    initial: function (p) { return initialOf(p); },
    step: function (s, n, p) { return stepOf(s, n, p); },

    // pure helpers, for the page and the tests
    BLOCK: BLOCK, TOTAL: TOTAL, PID: PID, HOME: HOME, LETTER: LETTER, SCENES: SCENES, SCENE_IDS: SCENE_IDS,
    dirOf: dirOf, baseOf: baseOf, expand: expand, joinFrom: joinFrom, fsOf: fsOf,
    entryOf: entryOf, inodeOf: inodeOf, resolve: resolve, apply: apply, open: open, lsLines: lsLines,
    usedBlocks: usedBlocks, blocksFor: blocksFor, blank: blank,
    /** Held by a process with no name left (rule 4, postponed). */
    orphan: function (s, ino) { var n = inodeOf(s, ino); return !!n && n.nlink === 0 && n.openBy.length > 0; }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
