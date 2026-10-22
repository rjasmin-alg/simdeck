/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-mount-layers: disk → partition table and partition → filesystem → mount point, and a mount that hides
   what the directory held. One step is one command from the preset's script: check the preconditions, change the state
   (or set err and change nothing), recompute where each mount-point path leads, recompute df. Rules and numbers:
   SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON; sizes are KiB.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MiB = 1024, GiB = 1024 * 1024;
  var DISK = { name: 'vdb', sizeMiB: 2048, majmin: '252:16' };
  /** The two partitions the book makes on vdb (ch11): name in the table, PARTUUID, device numbers. */
  var PARTS = {
    vdb1: { label: 'vjezba', partuuid: '44505477-27f2-4ea4-8297-3f27aa35b1e3', majmin: '252:17', sizeMiB: 1023, start: '1MiB', end: '1GiB' },
    vdb2: { label: 'druga', partuuid: '674556e9-f81e-4ad4-8a29-392b490b4cc6', majmin: '252:18', sizeMiB: 1023, start: '1GiB', end: '100%' }
  };
  /** Filesystem UUIDs: the book's for ext4 on vdb1 and XFS on vdb2; the other two are made up (NOTES.md). */
  var UUID = {
    'vdb1:ext4': '77b8714b-1cf6-4d6b-bce3-57d9763fb1e6', 'vdb2:xfs': '2611f264-8657-4a15-9a35-df3939c304a2',
    'vdb1:xfs': '3c9e5a17-0b8d-4f62-a1e4-7d25c06f9b38', 'vdb2:ext4': 'b51f0c7e-92a4-4d1b-8e36-c4a07d2f5e91'
  };
  /** Rule 2: what df reports for a fresh filesystem on the 1023M partition (ch11 "Montiranje…"). */
  var FRESH = {
    ext4: { sizeKiB: 989 * MiB, usedKiB: 24, availKiB: 922 * MiB, rootKiB: 20, files: [{ name: 'lost+found', kib: 0, dir: true }] },
    xfs: { sizeKiB: 959 * MiB, usedKiB: 51712, availKiB: 959 * MiB - 51712, rootKiB: 0, files: [] }
  };
  /** The root filesystem /dev/vda4 (XFS): chosen so that df -h prints the book's line 19G 1.5G 17G 8% (SPEC.md). */
  var ROOT = { dev: 'vda4', type: 'xfs', sizeKiB: 19712819, usedKiB: 1541407, availKiB: 17 * GiB };
  var HOME_FILE = '~/stara.txt';
  var DMESG = '       dmesg(1) may have more information after failed mount system call.';

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // ── sizes as df -h, du -h and lsblk print them ──

  /** GNU -h: powers of 1024, one decimal under 10, always rounded up (checked against df 9.4: 915.33G → 916G). */
  function human(kib) {
    if (kib <= 0) return '0';
    var units = ['K', 'M', 'G', 'T'], div = 1, u = 0;
    while (u < units.length - 1 && kib >= div * 1024) { div *= 1024; u++; }
    var tenths = Math.ceil(kib * 10 / div - 1e-9);
    if (tenths < 100) return (tenths / 10).toFixed(1) + units[u];
    var whole = Math.ceil(kib / div - 1e-9);
    if (whole >= 1024 && u < units.length - 1) return '1.0' + units[u + 1];
    return whole + units[u];
  }
  /** Use%: used / (used + avail), rounded up (df). */
  function pcent(fs) { return fs.usedKiB + fs.availKiB > 0 ? Math.ceil(fs.usedKiB * 100 / (fs.usedKiB + fs.availKiB) - 1e-9) + '%' : '-'; }
  function padR(x, n) { x = String(x); while (x.length < n) x += ' '; return x; }
  function padL(x, n) { x = String(x); while (x.length < n) x = ' ' + x; return x; }

  // ── where a path leads ──

  function partOf(s, name) { for (var i = 0; i < s.parts.length; i++) if (s.parts[i].name === name) return s.parts[i]; return null; }
  /** Rule 4 and 8: the most recent mount on the target, or null (the path leads to the directory on root). */
  function topOf(s, target) { for (var i = s.mounts.length - 1; i >= 0; i--) if (s.mounts[i].target === target) return s.mounts[i]; return null; }
  /** The filesystem a mount-point path leads to: { kind: 'fs', dev } or { kind: 'root' }; null when there is no such directory. */
  function leadsTo(s, path) {
    if (path === '/') return { kind: 'root' };
    var top = topOf(s, path);
    if (top) return { kind: 'fs', dev: top.source };
    return s.rootFs.dirs[path] ? { kind: 'root' } : null;
  }
  function fsAt(s, at) { return at.kind === 'root' ? s.rootFs : partOf(s, at.dev).fs; }
  /** The names ls prints at a path (sorted, total order by name), or null when the path does not exist. */
  function listing(s, path) {
    var at = leadsTo(s, path);
    if (!at) return null;
    var files = at.kind === 'root' ? s.rootFs.dirs[path] : partOf(s, at.dev).fs.files;
    return files.map(function (f) { return f.name; }).sort();
  }
  /** Mounts under the top one on a target, newest first (rule 8), and the root directory's files under them (rule 4). */
  function hiddenAt(s, target) {
    var on = s.mounts.filter(function (m) { return m.target === target; });
    return { mounts: on.slice(0, -1).reverse().map(function (m) { return m.source; }), files: on.length ? (s.rootFs.dirs[target] || []).map(function (f) { return f.name; }) : [] };
  }

  // ── what df prints (rule 2, 5) ──

  function dfRow(s, at, target) {
    var fs = fsAt(s, at);
    return { source: '/dev/' + (at.kind === 'root' ? s.rootFs.dev : at.dev), type: fs.type, size: human(fs.sizeKiB),
      used: human(fs.usedKiB), avail: human(fs.availKiB), pcent: pcent(fs), target: target, key: at.kind === 'root' ? 'root' : at.dev };
  }
  /** df with no arguments: the root filesystem, then each mount in mount order; an over-mounted one is left out (check). */
  function dfRows(s) {
    var rows = [dfRow(s, { kind: 'root' }, '/')];
    s.mounts.forEach(function (m) { if (topOf(s, m.target) === m) rows.push(dfRow(s, { kind: 'fs', dev: m.source }, m.target)); });
    return rows;
  }
  /** GNU df's minimum widths: source 14, type 4, size, used and avail 5, Use% 4. */
  function dfLines(rows, withType) {
    var head = padR('Filesystem', 14) + ' ' + (withType ? padR('Type', 4) + ' ' : '') + padL('Size', 5) + ' ' + padL('Used', 5) + ' ' +
      padL('Avail', 5) + ' ' + padL('Use%', 4) + ' Mounted on';
    return [head].concat(rows.map(function (r) {
      return padR(r.source, 14) + ' ' + (withType ? padR(r.type, 4) + ' ' : '') + padL(r.size, 5) + ' ' + padL(r.used, 5) + ' ' +
        padL(r.avail, 5) + ' ' + padL(r.pcent, 4) + ' ' + r.target;
    }));
  }
  /** du -s over a path: what the path leads to, with the directory's own blocks (ext4 root + lost+found: 20K). */
  function duKiB(s, path) {
    var at = leadsTo(s, path);
    if (at.kind === 'root') return s.rootFs.dirs[path].reduce(function (a, f) { return a + f.kib; }, 0);
    var fs = partOf(s, at.dev).fs;
    return fs.files.reduce(function (a, f) { return a + f.kib; }, fs.rootKiB);
  }
  function lsblkLines(s) {
    var out = ['NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS', padR(DISK.name, 6) + ' ' + DISK.majmin + '   0 ' + padL('2G', 5) + '  0 disk'];
    s.parts.forEach(function (p, i) {
      var mps = s.mounts.filter(function (m) { return m.source === p.name; }).map(function (m) { return m.target; });
      var line = (i === s.parts.length - 1 ? '└─' : '├─') + p.name + ' ' + PARTS[p.name].majmin + '   0 ' + padL(p.sizeMiB + 'M', 5) + '  0 part';
      out.push(mps.length ? line + ' ' + mps.join(',') : line);
    });
    return out;
  }

  // ── building the state ──

  function makeFs(dev, type) {
    var f = clone(FRESH[type]);
    f.type = type;
    f.uuid = UUID[dev + ':' + type];
    return f;
  }
  function makePart(name, fsType) {
    var d = PARTS[name];
    return { name: name, sizeMiB: d.sizeMiB, label: d.label, partuuid: d.partuuid, fs: fsType ? makeFs(name, fsType) : null };
  }
  /** vdb2 is always XFS (ch11); vdb1 is fsType, except in the presets that contrast it with vdb2 (ext4 there). */
  function fsTypeOf(dev, p) { return dev === 'vdb2' ? 'xfs' : SCENES[sceneOf(p)].ext4 ? 'ext4' : p.fsType === 'xfs' ? 'xfs' : 'ext4'; }
  function blank(s) { s.cmd = null; s.out = []; s.err = null; s.event = { op: null, changed: [], hid: [], shown: [], from: null, to: null }; }

  /** Rule 6: a file written into a directory lands on whatever the path leads to now. */
  function putFile(s, dir, name, kib) {
    var at = leadsTo(s, dir);
    var fs = fsAt(s, at);
    var list = at.kind === 'root' ? s.rootFs.dirs[dir] : fs.files;
    var old = list.filter(function (f) { return f.name === name; })[0];
    var grow = kib - (old ? old.kib : 0);
    if (grow > fs.availKiB) return false;
    if (old) old.kib = kib; else list.push({ name: name, kib: kib });
    fs.usedKiB += grow;
    fs.availKiB -= grow;
    return at;
  }

  /** The scripts (SPEC.md "Presets"): 8, 7, 4, 6 commands. fsType is vdb1's; vdb2 is always XFS (ch11). */
  var SCENES = {
    hide: {
      parts: ['vdb1'], dirs: ['/mnt/vjezba'], mounts: [],
      script: function () {
        return [{ op: 'ls', path: '/mnt/vjezba' }, { op: 'cp', src: HOME_FILE, dir: '/mnt/vjezba', name: 'stara.txt' },
          { op: 'mount', dev: 'vdb1', target: '/mnt/vjezba' }, { op: 'ls', path: '/mnt/vjezba' }, { op: 'df', paths: ['/'] },
          { op: 'du', path: '/mnt/vjezba' }, { op: 'umount', target: '/mnt/vjezba' }, { op: 'ls', path: '/mnt/vjezba' }];
      }
    },
    layers: {
      table: null, parts: [], dirs: [], mounts: [],
      script: function (p) {
        var type = fsTypeOf('vdb1', p);
        return [{ op: 'lsblk' }, { op: 'parted', label: 'gpt', part: 'vdb1', fs: type }, { op: 'mkfs', dev: 'vdb1', type: type },
          { op: 'df', paths: [] }, { op: 'mkdir', path: '/mnt/vjezba' }, { op: 'mount', dev: 'vdb1', target: '/mnt/vjezba' }, { op: 'df', paths: [] }];
      }
    },
    nopoint: {
      parts: ['vdb1', 'vdb2'], dirs: ['/mnt/vjezba'], mounts: [['vdb1', '/mnt/vjezba']], ext4: true,
      script: function () {
        return [{ op: 'mount', dev: 'vdb2', target: '/mnt/druga' }, { op: 'mkdir', path: '/mnt/druga' },
          { op: 'mount', dev: 'vdb2', target: '/mnt/druga' }, { op: 'df', paths: ['/mnt/vjezba', '/mnt/druga'], T: true }];
      }
    },
    stack: {
      parts: ['vdb1', 'vdb2'], dirs: ['/mnt/vjezba'], file: true, mounts: [['vdb1', '/mnt/vjezba']], ext4: true,
      script: function () {
        return [{ op: 'mount', dev: 'vdb2', target: '/mnt/vjezba' }, { op: 'ls', path: '/mnt/vjezba' }, { op: 'umount', target: '/mnt/vjezba' },
          { op: 'ls', path: '/mnt/vjezba' }, { op: 'umount', target: '/mnt/vjezba' }, { op: 'ls', path: '/mnt/vjezba' }];
      }
    }
  };
  var SCENE_IDS = Object.keys(SCENES);
  function sceneOf(p) { return SCENES[p.scene] ? p.scene : 'hide'; }

  function initialOf(p) {
    var id = sceneOf(p), sc = SCENES[id];
    var s = {
      scene: id, fsType: fsTypeOf('vdb1', p),
      disk: { name: DISK.name, sizeMiB: DISK.sizeMiB, table: sc.table === null ? null : 'gpt' },
      parts: sc.parts.map(function (n) { return makePart(n, fsTypeOf(n, p)); }),
      rootFs: { dev: ROOT.dev, type: ROOT.type, sizeKiB: ROOT.sizeKiB, usedKiB: ROOT.usedKiB, availKiB: ROOT.availKiB, dirs: {} },
      mounts: []
    };
    sc.dirs.forEach(function (d) { s.rootFs.dirs[d] = []; });
    if (sc.file) putFile(s, '/mnt/vjezba', 'stara.txt', p.fileMiB * MiB);   // written before vdb1 was mounted (as hide)
    sc.mounts.forEach(function (m) { s.mounts.push({ target: m[1], source: m[0] }); });
    blank(s);
    return s;
  }

  // ── one command ──

  function fail(s, code, lines) { s.err = code; s.out = lines; s.event.err = code; }

  function apply(s, cmd) {
    var ev = s.event;
    switch (cmd.op) {
      case 'ls': {
        var names = listing(s, cmd.path);
        if (!names) return fail(s, 'ENOENT', ["ls: cannot access '" + cmd.path + "': No such file or directory"]);
        s.out = names.length ? [names.join('  ')] : [];
        ev.at = leadsTo(s, cmd.path);
        return;
      }
      case 'cp': {
        if (!s.rootFs.dirs[cmd.dir] && !topOf(s, cmd.dir)) return fail(s, 'ENOENT', ["cp: cannot create regular file '" + cmd.dir + '/' + cmd.name + "': No such file or directory"]);
        var at = putFile(s, cmd.dir, cmd.name, cmd.kib);
        if (!at) return fail(s, 'ENOSPC', ["cp: error writing '" + cmd.dir + '/' + cmd.name + "': No space left on device"]);
        ev.at = at;
        return;
      }
      case 'mkdir':
        if (!s.rootFs.dirs[cmd.path]) { s.rootFs.dirs[cmd.path] = []; ev.made = true; }   // -p: an existing one is fine
        return;
      case 'mount': {
        // rule 3: every check before any change
        var part = partOf(s, cmd.dev);
        if (!part) return fail(s, 'NODEV', ['mount: ' + cmd.target + ': special device /dev/' + cmd.dev + ' does not exist.']);
        if (!s.rootFs.dirs[cmd.target]) return fail(s, 'NOPOINT', ['mount: ' + cmd.target + ': mount point does not exist.', DMESG]);
        if (!part.fs) return fail(s, 'NOFS', ['mount: ' + cmd.target + ': wrong fs type, bad option, bad superblock on /dev/' + cmd.dev +
          ', missing codepage or helper program, or other error.', DMESG]);
        var top = topOf(s, cmd.target);
        if (top && top.source === cmd.dev) return fail(s, 'BUSY', ['mount: ' + cmd.target + ': /dev/' + cmd.dev + ' already mounted on ' + cmd.target + '.', DMESG]);
        ev.from = leadsTo(s, cmd.target);
        var under = listing(s, cmd.target);
        s.mounts.push({ target: cmd.target, source: cmd.dev });
        ev.to = leadsTo(s, cmd.target);
        ev.hid = under;                                     // rule 4: not deleted, only out of this path's reach
        ev.over = top ? top.source : null;
        return;
      }
      case 'umount': {
        var t = topOf(s, cmd.target);
        if (!t) return fail(s, 'NOTMOUNTED', ['umount: ' + cmd.target + ': not mounted.']);
        ev.from = leadsTo(s, cmd.target);
        s.mounts.splice(s.mounts.lastIndexOf(t), 1);        // rule 8: the top one goes
        ev.to = leadsTo(s, cmd.target);
        ev.gone = t.source;
        ev.shown = listing(s, cmd.target);                  // rule 7: what was under it, unchanged
        return;
      }
      case 'df': {
        if (!cmd.paths.length) { s.out = dfLines(dfRows(s), cmd.T); ev.rows = dfRows(s).map(function (r) { return r.key; }); return; }
        var rows = [], errs = [];
        cmd.paths.forEach(function (path) {
          var at = leadsTo(s, path);
          if (!at) errs.push('df: ' + path + ': No such file or directory');
          else rows.push(dfRow(s, at, at.kind === 'root' ? '/' : path));
        });
        s.out = errs.concat(rows.length ? dfLines(rows, cmd.T) : []);
        ev.rows = rows.map(function (r) { return r.key; });
        if (errs.length) { s.err = 'ENOENT'; ev.err = 'ENOENT'; }
        return;
      }
      case 'du': {
        var to = leadsTo(s, cmd.path);
        if (!to) return fail(s, 'ENOENT', ["du: cannot access '" + cmd.path + "': No such file or directory"]);
        ev.at = to;
        ev.kib = duKiB(s, cmd.path);
        s.out = [human(ev.kib) + '\t' + cmd.path];
        return;
      }
      case 'lsblk':
        s.out = lsblkLines(s);
        return;
      case 'parted': {
        // rule 1: the table first, then the partition in it (parted runs the two in order in one call)
        if (cmd.label) s.disk.table = cmd.label;
        if (!s.disk.table) return fail(s, 'NOLABEL', ['Error: /dev/' + DISK.name + ': unrecognised disk label']);
        if (partOf(s, cmd.part)) return fail(s, 'EXISTS', ['Error: You requested a partition from ' + PARTS[cmd.part].start + ' to ' + PARTS[cmd.part].end + '.']);
        s.parts.push(makePart(cmd.part, null));
        return;
      }
      case 'mkfs': {
        var pt = partOf(s, cmd.dev);
        if (!pt) return fail(s, 'NODEV', ['The file /dev/' + cmd.dev + ' does not exist and no size was specified.']);
        if (s.mounts.some(function (m) { return m.source === cmd.dev; })) return fail(s, 'MOUNTED', ['/dev/' + cmd.dev + ' is mounted; will not make a filesystem here!']);
        pt.fs = makeFs(cmd.dev, cmd.type);
        s.out = cmd.type === 'ext4'
          ? ['Creating filesystem with 261888 4k blocks and 65536 inodes', 'Filesystem UUID: ' + pt.fs.uuid, 'Creating journal (4096 blocks): done']
          : ['meta-data=/dev/' + cmd.dev + '              isize=512    agcount=4, agsize=65472 blks',
            'data     =                       bsize=4096   blocks=261888, imaxpct=25',
            'log      =internal log           bsize=4096   blocks=16384, version=2'];
        return;
      }
    }
  }

  /** What the page marks as changed: layers, root's directories, used space, and paths whose target moved. */
  function changes(a, b) {
    var out = [];
    if (a.disk.table !== b.disk.table) out.push('table');
    b.parts.forEach(function (p) {
      var q = partOf(a, p.name);
      if (!q) out.push('part:' + p.name);
      if (p.fs && (!q || !q.fs || q.fs.uuid !== p.fs.uuid)) out.push('fs:' + p.name);
      if (p.fs && q && q.fs && q.fs.usedKiB !== p.fs.usedKiB) out.push('used:' + p.name);
    });
    Object.keys(b.rootFs.dirs).forEach(function (d) {
      if (!a.rootFs.dirs[d] || JSON.stringify(a.rootFs.dirs[d]) !== JSON.stringify(b.rootFs.dirs[d])) out.push('dir:' + d);
    });
    if (a.rootFs.usedKiB !== b.rootFs.usedKiB) out.push('used:root');
    var targets = {};
    a.mounts.concat(b.mounts).forEach(function (m) { targets[m.target] = true; });
    Object.keys(b.rootFs.dirs).forEach(function (d) { targets[d] = true; });
    Object.keys(targets).sort().forEach(function (d) {
      if (JSON.stringify(leadsTo(a, d)) !== JSON.stringify(leadsTo(b, d))) out.push('path:' + d);
    });
    if (JSON.stringify(a.mounts) !== JSON.stringify(b.mounts)) {
      b.parts.forEach(function (p) {
        var was = a.mounts.filter(function (m) { return m.source === p.name; }).length;
        var now = b.mounts.filter(function (m) { return m.source === p.name; }).length;
        if (was !== now) out.push('mount:' + p.name);
      });
    }
    return out;
  }

  function scriptOf(p) {
    var cmds = SCENES[sceneOf(p)].script(p);
    cmds.forEach(function (c) { if (c.op === 'cp') c.kib = p.fileMiB * MiB; });
    return cmds;
  }

  function stepOf(s, n, p) {
    var t = clone(s);
    blank(t);
    var cmd = scriptOf(p)[n - 1];
    t.cmd = clone(cmd);
    t.event.op = cmd.op;
    var before = clone(t);
    apply(t, cmd);
    t.event.changed = changes(before, t);                // a failed command changed nothing, so lists nothing
    return t;
  }

  var logic = {
    /** Parameter defaults (task: fileMiB 100, xray off, ext4; preset hide). */
    defaults: { scene: 'hide', fileMiB: 100, xray: false, fsType: 'ext4' },

    /** One step per scripted command (SPEC.md: 8, 7, 4, 6). */
    steps: function (p) { return SCENES[sceneOf(p)].script(Object.assign({ fsType: 'ext4' }, p)).length; },

    initial: function (p) { return initialOf(p); },
    step: function (s, n, p) { return stepOf(s, n, p); },

    // pure helpers, for the page and the tests
    SCENES: SCENES, SCENE_IDS: SCENE_IDS, PARTS: PARTS, DISK: DISK, MiB: MiB, HOME_FILE: HOME_FILE,
    human: human, pcent: pcent, partOf: partOf, topOf: topOf, leadsTo: leadsTo, listing: listing, hiddenAt: hiddenAt,
    dfRows: dfRows, dfLines: dfLines, duKiB: duKiB, lsblkLines: lsblkLines, putFile: putFile, apply: apply, changes: changes,
    scriptOf: scriptOf, blank: blank, fsTypeOf: fsTypeOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
