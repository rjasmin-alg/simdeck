/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-disk-full-mysteries: one filesystem with a fixed number of blocks and (on ext4) inodes; a file costs an
   inode plus its data blocks; a create without a free inode or a write without free blocks fails with ENOSPC; df reads
   the counters, du walks the names; a deleted file that a process holds open keeps its blocks until the last close.
   One step is one action (a write burst, touch, rm, a diagnostic command, a restart). Rules and numbers: SPEC.md.
   The freeing rule is lnx-links-inodes' rule 4 (freeCheck below follows sims/lnx-links-inodes/sim.js @ 51c6691).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Model code holds no words: the page words
   everything from the event codes; command lines and their output are data.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var BLOCK = 4096, MIB = 1048576;
  var MNT = '/mnt/vjezba', DEV = '/dev/vdb1', DEVNO = '252,17';
  var PID = 4242, USER = 'student';
  var PROMPT = '[student@demosrv1 ~]$ ';
  var CHUNK = 64, CHUNK_BLOCKS = 8;           // XFS: 64 inodes of 512 B per chunk = 32 KiB = 8 blocks
  var DISAGREE = 0.1;                         // rule 7: df Used − du over 10 % of Size

  /** The two filesystems of UL ch11 on a 1 GiB partition (SPEC.md, "The filesystem"). */
  var FS = {
    ext4: { size: 261888 - 8853, used: 6, reserve: 13094 + 4096, inodes: 65536, inodesUsed: 11, firstIno: 12,
      dirBlocks: 1, rootBlocks: 1, lpf: 4 },
    xfs: { size: 261888 - 16384, used: 13000, reserve: 0, inodes: null, inodesUsed: 3, firstIno: 131,
      icount: CHUNK, maxicount: Math.floor(261888 * 0.25) * 8, dirBlocks: 0, rootBlocks: 0, lpf: null }
  };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function dirOf(p) { return p.slice(0, p.lastIndexOf('/')) || '/'; }
  function baseOf(p) { return p.slice(p.lastIndexOf('/') + 1); }

  // ── counters (rule 4: what df reads) ──

  /** Blocks an unprivileged write may still take: df's Avail. */
  function avail(s) { return Math.max(0, s.fs.blocks - s.fs.blocksUsed - s.fs.reserve); }
  /** XFS: free inodes in allocated chunks; ext4: free inodes. */
  function freeInodes(s) { return s.fs.type === 'xfs' ? s.fs.icount - s.fs.inodesUsed : s.fs.inodes - s.fs.inodesUsed; }
  /** Rule 6: XFS reports allocated inodes plus what the free space could still hold, capped at imaxpct. */
  function refresh(s) {
    if (s.fs.type === 'xfs') s.fs.inodes = Math.min(s.fs.icount + avail(s) * BLOCK / 512, s.fs.maxicount);
  }

  // ── names and inodes ──

  function entryOf(s, dir, name) {
    var list = s.dirs[dir];
    if (!list) return null;
    for (var i = 0; i < list.length; i++) if (list[i].name === name) return list[i];
    return null;
  }
  function inodeOf(s, ino) { return s.inodes[String(ino)] || null; }

  /** Tie-break: a new inode takes the lowest free number from the fs's first (12 on ext4, 131 on XFS), n in a row. */
  function lowestFree(s) {
    var spans = Object.keys(s.inodes).map(function (k) { return [Number(k), Number(k) + (s.inodes[k].n || 1) - 1]; })
      .sort(function (a, b) { return a[0] - b[0]; });
    var at = s.fs.firstIno;
    spans.forEach(function (r) { if (r[1] >= at && r[0] <= at) at = r[1] + 1; });
    return at;
  }

  /** Rule 6 on XFS: make room for one more inode, a chunk of 64 from free blocks, up to maxicount. */
  function inodeRoom(s) {
    if (freeInodes(s) > 0) return null;
    if (s.fs.type !== 'xfs') return 'inodes';
    if (s.fs.icount + CHUNK > s.fs.maxicount) return 'inodes';
    if (avail(s) < CHUNK_BLOCKS) return 'blocks';
    s.fs.icount += CHUNK;
    s.fs.blocksUsed += CHUNK_BLOCKS;
    return null;
  }

  /** XFS gives an empty chunk's blocks back (inodes packed from the start: SPEC.md *(check)*). */
  function shrinkChunks(s) {
    if (s.fs.type !== 'xfs') return;
    var keep = Math.max(CHUNK, Math.ceil(s.fs.inodesUsed / CHUNK) * CHUNK);
    if (keep < s.fs.icount) { s.fs.blocksUsed -= (s.fs.icount - keep) / CHUNK * CHUNK_BLOCKS; s.fs.icount = keep; }
  }

  /** Rule 1 + 3: one create needs an inode (checked first); returns the cause on ENOSPC, else the new number. */
  function createOne(s, dir, name, type) {
    var cause = inodeRoom(s);
    if (cause) return { err: 'ENOSPC', cause: cause };
    var ino = lowestFree(s);
    var blocks = type === 'dir' ? s.fs.dirBlocks : 0;
    if (blocks > avail(s)) return { err: 'ENOSPC', cause: 'blocks' };
    s.inodes[String(ino)] = { type: type, n: 1, nlink: type === 'dir' ? 2 : 1, openBy: [], size: 0, blocks: blocks };
    s.fs.inodesUsed += 1;
    s.fs.blocksUsed += blocks;
    if (type === 'dir') s.dirs[dir + '/' + name] = [];
    s.dirs[dir].push({ name: name, ino: ino });
    return { err: null, ino: ino };
  }

  /** Rule 1 + 3: a write takes ⌈size ÷ 4 KiB⌉ blocks; when they run out it keeps what it got and fails. */
  function writeTo(s, node, bytes) {
    var want = Math.ceil((node.size + bytes) / BLOCK) - node.blocks;
    var got = Math.min(Math.max(want, 0), avail(s));
    node.blocks += got;
    s.fs.blocksUsed += got;
    if (got < want) { node.size = node.blocks * BLOCK; return { err: 'ENOSPC', cause: 'blocks', blocks: got }; }
    node.size += bytes;
    return { err: null, blocks: got };
  }

  /**
   * A burst of files of `size` bytes into dir until one fails (or `count` are made). One group record stands for the
   * files: { n, size (each), blocks (all) }. ext4 in closed form; XFS chunk by chunk (rule 6). Returns
   * { made, err, cause }.
   */
  function fillFiles(s, dir, size, count) {
    var per = Math.ceil(size / BLOCK);
    var made = 0, blocks = 0, err = null, cause = null, at = null;
    var first = lowestFree(s);
    while (made < count) {
      var room = inodeRoom(s);
      if (room) { err = 'ENOSPC'; cause = room; at = 'create'; break; }
      var k = Math.min(freeInodes(s), count - made);
      var fit = per === 0 ? k : Math.floor(avail(s) / per);
      if (fit >= k) {
        made += k; blocks += k * per; s.fs.inodesUsed += k; s.fs.blocksUsed += k * per;
        continue;
      }
      // blocks run out inside this run: `fit` whole files, then one created whose write gets the rest and fails
      var rest = avail(s) - fit * per;
      made += fit + 1; blocks += fit * per + rest; s.fs.inodesUsed += fit + 1; s.fs.blocksUsed += fit * per + rest;
      err = 'ENOSPC'; cause = 'blocks'; at = 'write';
      break;
    }
    if (made) {
      s.inodes[String(first)] = { type: 'file', n: made, nlink: 1, openBy: [], size: size, blocks: blocks };
      s.dirs[dir].push({ name: fileName(1) + (made > 1 ? '…' + fileName(made) : ''), ino: first, n: made });
    }
    return { made: made, err: err, cause: cause, at: at, first: first };
  }
  function fileName(i) { var x = String(i); while (x.length < 6) x = '0' + x; return 's' + x; }

  /** Rule 5: the space goes only when no name and no open descriptor is left (lnx-links-inodes rule 4). */
  function freeCheck(s, ino) {
    var node = inodeOf(s, ino);
    if (!node) return null;
    var what = node.nlink > 0 ? 'kept' : node.openBy.length ? 'postponed' : 'freed';
    var f = { ino: Number(ino), what: what, blocks: node.blocks, inodes: node.n || 1 };
    if (what === 'freed') {
      s.fs.blocksUsed -= node.blocks;
      s.fs.inodesUsed -= node.n || 1;
      delete s.inodes[String(ino)];
    }
    return f;
  }

  function removeName(s, dir, name) {
    var list = s.dirs[dir], e = entryOf(s, dir, name);
    list.splice(list.indexOf(e), 1);
    s.gone.push({ dir: dir, name: name, ino: e.ino, n: e.n || 1 });
    var node = inodeOf(s, e.ino);
    node.nlink -= node.type === 'dir' ? 2 : 1;
    return freeCheck(s, e.ino);
  }

  /** rm -r: every name below first, then the directory itself. Returns what was freed and what is postponed. */
  function removeTree(s, path) {
    var sum = { blocks: 0, inodes: 0, postponed: 0 };
    function add(f) {
      if (f.what === 'freed') { sum.blocks += f.blocks; sum.inodes += f.inodes; }
      else if (f.what === 'postponed') sum.postponed += f.blocks;
    }
    (s.dirs[path] || []).slice().forEach(function (e) {
      var sub = path + '/' + e.name;
      if (s.dirs[sub]) {
        var r = removeTree(s, sub);
        sum.blocks += r.blocks; sum.inodes += r.inodes; sum.postponed += r.postponed;
      } else add(removeName(s, path, e.name));
    });
    delete s.dirs[path];
    add(removeName(s, dirOf(path), baseOf(path)));
    return sum;
  }

  // ── du (rule 4: what the names reach) ──

  function duBlocks(s, path) {
    var self = entryOf(s, dirOf(path), baseOf(path));
    var total = path === MNT ? s.fs.rootBlocks : self ? inodeOf(s, self.ino).blocks : 0;
    (s.dirs[path] || []).forEach(function (e) {
      total += s.dirs[path + '/' + e.name] ? duBlocks(s, path + '/' + e.name) : inodeOf(s, e.ino).blocks;
    });
    return total;
  }

  // ── output formatting (data: what the commands print) ──

  /** df -h / du -h: powers of 1024, rounded up, one decimal under 10, "0" for nothing. */
  function human(bytes) {
    if (bytes <= 0) return '0';
    var units = ['K', 'M', 'G', 'T'], v = bytes / 1024, i = 0;
    while (v > 1024 && i < units.length - 1) { v /= 1024; i++; }
    if (v < 10) {
      var r = Math.ceil(v * 10 - 1e-9) / 10;
      return (r >= 10 ? '10' : r.toFixed(1)) + units[i];
    }
    var c = Math.ceil(v - 1e-9);
    return c >= 1024 && i < units.length - 1 ? '1.0' + units[i + 1] : c + units[i];
  }
  /** Use% and IUse%: used ÷ (used + avail), rounded up. */
  function pct(used, free) { return used + free === 0 ? 0 : Math.ceil(used * 100 / (used + free) - 1e-9); }

  /** Aligned columns as coreutils prints them: cols [{ head, min, left }], rows of cells. */
  function table(cols, rows) {
    var w = cols.map(function (c, i) {
      return rows.reduce(function (m, r) { return Math.max(m, String(r[i]).length); }, Math.max(c.min || 0, c.head.length));
    });
    function line(cells) {
      return cells.map(function (x, i) {
        x = String(x);
        var last = i === cells.length - 1;
        while (x.length < w[i] && !(last && cols[i].left)) x = cols[i].left ? x + ' ' : ' ' + x;
        return x;
      }).join(' ');
    }
    return [line(cols.map(function (c) { return c.head; }))].concat(rows.map(line));
  }

  function dfh(s) {
    var a = avail(s);
    return {
      size: s.fs.blocks, used: s.fs.blocksUsed, avail: a, pct: pct(s.fs.blocksUsed, a),
      lines: table([{ head: 'Filesystem', min: 14, left: true }, { head: 'Size', min: 5 }, { head: 'Used', min: 5 },
        { head: 'Avail', min: 5 }, { head: 'Use%', min: 4 }, { head: 'Mounted on', left: true }],
      [[DEV, human(s.fs.blocks * BLOCK), human(s.fs.blocksUsed * BLOCK), human(a * BLOCK), pct(s.fs.blocksUsed, a) + '%', MNT]])
    };
  }
  function dfi(s) {
    var free = s.fs.inodes - s.fs.inodesUsed;
    return {
      inodes: s.fs.inodes, used: s.fs.inodesUsed, free: free, pct: pct(s.fs.inodesUsed, free),
      lines: table([{ head: 'Filesystem', min: 14, left: true }, { head: 'Inodes', min: 5 }, { head: 'IUsed', min: 5 },
        { head: 'IFree', min: 5 }, { head: 'IUse%', min: 4 }, { head: 'Mounted on', left: true }],
      [[DEV, s.fs.inodes, s.fs.inodesUsed, free, pct(s.fs.inodesUsed, free) + '%', MNT]])
    };
  }
  /** Rule 5: open files whose link count is below 1. */
  function lsofL1(s) {
    var rows = [];
    s.procs.forEach(function (p) {
      p.fds.forEach(function (f) {
        var node = inodeOf(s, f.ino);
        if (node && node.nlink < 1) {
          rows.push([p.cmd, p.pid, USER, f.fd + f.mode, 'REG', DEVNO, node.size, node.nlink, f.ino, f.path + ' (deleted)']);
        }
      });
    });
    if (!rows.length) return [];
    return table([{ head: 'COMMAND', left: true }, { head: 'PID' }, { head: 'USER', left: true }, { head: 'FD', min: 4 },
      { head: 'TYPE' }, { head: 'DEVICE' }, { head: 'SIZE/OFF' }, { head: 'NLINK' }, { head: 'NODE' },
      { head: 'NAME', left: true }], rows);
  }

  // ── rule 7: the diagnosis order ──

  function disagree(c, size) { return c.dfh.used - c.du.blocks > DISAGREE * size; }

  /** The next diagnostic the order asks for, or null (nothing failed, or the cause is found). */
  function nextCheck(s) {
    if (!s.failed) return null;
    var c = s.checks;
    if (!c.dfh) return 'dfh';
    if (c.dfh.avail > 0) return c.dfi ? null : 'dfi';
    if (!c.du) return 'du';
    if (disagree(c, c.dfh.size)) return c.lsof ? null : 'lsof';
    return null;
  }
  /** What the readings so far say: 'inodes', 'blocks' (named files), 'deleted-open', or null (not found yet). */
  function cause(s) {
    if (!s.failed) return null;
    var c = s.checks;
    if (c.dfh && c.dfh.avail > 0) return c.dfi && c.dfi.free === 0 ? 'inodes' : null;
    if (c.dfh && c.du) {
      if (!disagree(c, c.dfh.size)) return 'blocks';
      return c.lsof && c.lsof.count > 0 ? 'deleted-open' : null;
    }
    return null;
  }

  // ── one action ──

  function cmd(s, text) { s.tool.lines.push({ k: 'cmd', text: PROMPT + text }); }
  function out(s, text) { s.tool.lines.push({ k: 'out', text: text }); }
  function err(s, text) { s.tool.lines.push({ k: 'err', text: text }); }
  function proc(s) { return s.procs[0] || null; }

  function apply(s, a, p) {
    var ev = s.lastEvent, r, node, path;
    switch (a.op) {
      case 'write': {                          // app writes `bytes` to path (opened for it, or held open)
        s.tool.who = 'app';
        node = inodeOf(s, entryOf(s, dirOf(a.path), baseOf(a.path)).ino);
        r = writeTo(s, node, a.bytes);
        ev.bytes = a.bytes; ev.wrote = r.blocks; ev.path = a.path;
        if (r.err) { ev.err = r.err; ev.cause = r.cause; err(s, 'app[' + proc(s).pid + ']: write ' + a.path + ': No space left on device'); }
        break;
      }
      case 'fill': {                           // app makes a directory and fills it with files until one fails
        s.tool.who = 'app';
        r = createOne(s, dirOf(a.dir), baseOf(a.dir), 'dir');
        if (r.err) { ev.err = r.err; ev.cause = r.cause; err(s, 'app[' + proc(s).pid + ']: mkdir ' + a.dir + ': No space left on device'); break; }
        ev.dir = a.dir;
        r = fillFiles(s, a.dir, p.fileSize, a.count || Infinity);
        ev.made = r.made; ev.size = p.fileSize;
        if (r.err) {
          ev.err = r.err; ev.cause = r.cause;
          // a create that found no inode (or no blocks for a new XFS chunk) names the next file; a write the last one
          var nth = r.at === 'create' ? r.made + 1 : r.made;
          err(s, 'app[' + proc(s).pid + ']: ' + r.at + ' ' + a.dir + '/' + fileName(nth) + ': No space left on device');
        }
        break;
      }
      case 'touch': {
        cmd(s, 'touch ' + a.path);
        r = createOne(s, dirOf(a.path), baseOf(a.path), 'file');
        if (r.err) { ev.err = r.err; ev.cause = r.cause; err(s, 'touch: cannot touch \'' + a.path + '\': No space left on device'); }
        else ev.made = 1;
        break;
      }
      case 'rm': {
        cmd(s, 'rm ' + a.path);
        r = removeName(s, dirOf(a.path), baseOf(a.path));
        ev.free = r;
        break;
      }
      case 'rmr': {
        cmd(s, 'rm -r ' + a.path);
        var b0 = s.fs.blocksUsed;
        ev.free = removeTree(s, a.path);
        shrinkChunks(s);
        ev.free.blocks = b0 - s.fs.blocksUsed;        // XFS: the emptied inode chunks' blocks too
        break;
      }
      case 'dfh': case 'dfdu': {
        cmd(s, 'df -h ' + MNT);
        r = dfh(s);
        r.lines.forEach(function (l) { out(s, l); });
        s.checks.dfh = { size: r.size, used: r.used, avail: r.avail, pct: r.pct };
        ev.ran = ['dfh'];
        if (a.op === 'dfdu') {
          cmd(s, 'du -sh ' + MNT);
          var b = duBlocks(s, MNT);
          out(s, human(b * BLOCK) + '\t' + MNT);
          s.checks.du = { blocks: b };
          ev.ran.push('du');
        }
        break;
      }
      case 'dfi': {
        cmd(s, 'df -i ' + MNT);
        r = dfi(s);
        r.lines.forEach(function (l) { out(s, l); });
        s.checks.dfi = { inodes: r.inodes, used: r.used, free: r.free, pct: r.pct };
        ev.ran = ['dfi'];
        break;
      }
      case 'lsof': {
        cmd(s, 'lsof +L1');
        var lines = lsofL1(s);
        lines.forEach(function (l) { out(s, l); });
        s.checks.lsof = { count: Math.max(0, lines.length - 1) };
        ev.ran = ['lsof'];
        break;
      }
      case 'restart': {                        // the process exits (closing every fd), a new one starts
        var old = proc(s);
        cmd(s, 'kill ' + old.pid);
        s.procs = [];
        ev.free = { blocks: 0, inodes: 0 };
        old.fds.forEach(function (f) {
          var n = inodeOf(s, f.ino);
          if (!n) return;
          n.openBy = n.openBy.filter(function (x) { return x !== old.pid; });
          var fr = freeCheck(s, f.ino);
          if (fr && fr.what === 'freed') { ev.free.blocks += fr.blocks; ev.free.inodes += fr.inodes; }
        });
        var pid = old.pid + 1;
        cmd(s, 'app &');
        out(s, '[1] ' + pid);
        s.procs.push({ pid: pid, cmd: 'app', fds: [] });
        if (p.holdOpen) openLog(s, a.path);
        ev.pid = pid;
        cmd(s, 'df -h ' + MNT);
        r = dfh(s);
        r.lines.forEach(function (l) { out(s, l); });
        s.checks.dfh = { size: r.size, used: r.used, avail: r.avail, pct: r.pct };
        ev.ran = ['dfh'];
        break;
      }
    }
  }

  /** app opens its log for writing (creating it, empty, when missing) and keeps the fd: fd 3, mode w. */
  function openLog(s, path) {
    var e = entryOf(s, dirOf(path), baseOf(path));
    var ino = e ? e.ino : createOne(s, dirOf(path), baseOf(path), 'file').ino;
    if (ino == null) return;
    inodeOf(s, ino).openBy.push(proc(s).pid);
    proc(s).fds.push({ fd: 3, mode: 'w', ino: ino, path: path });
  }

  // ── the scenes ──

  var LOG = MNT + '/app.log', SESS = MNT + '/sess';
  var SCENES = {
    obrisana: {
      log: true,
      script: [
        { op: 'write', path: LOG, bytes: 800 * MIB },
        { op: 'write', path: LOG, bytes: 200 * MIB },
        { op: 'rm', path: LOG },
        { op: 'dfdu' },
        { op: 'lsof' },
        { op: 'restart', path: LOG }
      ]
    },
    inodi: {
      log: false,
      script: [{ op: 'fill', dir: SESS }, { op: 'touch', path: MNT + '/test' }, { op: 'dfh' }, { op: 'dfi' }, { op: 'rmr', path: SESS }]
    },
    'inodi-kratko': {
      log: false,
      script: [{ op: 'fill', dir: SESS }, { op: 'touch', path: MNT + '/test' }, { op: 'dfh' }, { op: 'dfi' }]
    }
  };
  var SCENE_IDS = Object.keys(SCENES);
  /** Which actions change the filesystem (and so make earlier readings stale, rule 7). */
  var CHANGES = { write: 1, fill: 1, touch: 1, rm: 1, rmr: 1, restart: 1 };

  function blank(s) {
    s.lastError = null;
    s.lastEvent = { op: null, err: null, cause: null, changed: { blocks: false, inodes: false } };
    s.tool = { who: 'shell', lines: [] };
    s.gone = [];
  }

  function initialOf(p) {
    var id = SCENES[p.scene] ? p.scene : 'obrisana';
    var type = p.fstype === 'xfs' ? 'xfs' : 'ext4';
    var g = FS[type];
    var s = {
      scene: id, action: null, failed: false,
      fs: { type: type, dev: DEV, mnt: MNT, blocks: g.size, blocksUsed: g.used, reserve: g.reserve,
        inodes: g.inodes, inodesUsed: g.inodesUsed, icount: g.icount || null, maxicount: g.maxicount || null,
        firstIno: g.firstIno, dirBlocks: g.dirBlocks, rootBlocks: g.rootBlocks },
      dirs: {}, inodes: {}, procs: [{ pid: PID, cmd: 'app', fds: [] }],
      checks: { dfh: null, dfi: null, du: null, lsof: null }
    };
    s.dirs[MNT] = [];
    if (g.lpf != null) {
      // lost+found is inode 11, one of the 11 used when fresh, with 4 of the 6 blocks
      s.dirs[MNT].push({ name: 'lost+found', ino: 11 });
      s.dirs[MNT + '/lost+found'] = [];
      s.inodes['11'] = { type: 'dir', n: 1, nlink: 2, openBy: [], size: g.lpf * BLOCK, blocks: g.lpf };
    }
    blank(s);
    refresh(s);
    if (SCENES[id].log) {
      // app.log exists, empty; app holds it open when holdOpen is on
      createOne(s, MNT, 'app.log', 'file');
      if (p.holdOpen) openLog(s, LOG);
      refresh(s);
    }
    return s;
  }

  function stepOf(s, n, p) {
    var t = clone(s);
    blank(t);
    var a = SCENES[t.scene].script[n - 1];
    var before = { b: t.fs.blocksUsed, i: t.fs.inodesUsed, it: t.fs.inodes };
    t.action = clone(a);
    t.lastEvent.op = a.op;
    if (CHANGES[a.op]) t.checks = { dfh: null, dfi: null, du: null, lsof: null };
    apply(t, a, p);
    refresh(t);
    var ev = t.lastEvent;
    ev.changed = { blocks: t.fs.blocksUsed !== before.b, inodes: t.fs.inodesUsed !== before.i || t.fs.inodes !== before.it };
    ev.delta = { blocks: t.fs.blocksUsed - before.b, inodes: t.fs.inodesUsed - before.i };
    t.lastError = ev.err;
    if (ev.err) t.failed = true;
    else if (ev.delta.blocks < 0 || ev.delta.inodes < 0) t.failed = false;   // something came back: the symptom is gone
    return t;
  }

  var logic = {
    /** Parameter defaults (task: preset obrisana-otvorena, ext4, 1-byte files, app holds app.log open). */
    defaults: { scene: 'obrisana', fstype: 'ext4', fileSize: 1, holdOpen: true },

    /** One step per scripted action (SPEC.md: obrisana 6, inodi 5, inodi-kratko 4). */
    steps: function (p) { return (SCENES[p.scene] || SCENES.obrisana).script.length; },

    initial: function (p) { return initialOf(p); },
    step: function (s, n, p) { return stepOf(s, n, p); },

    // pure helpers, for the page and the tests
    BLOCK: BLOCK, MIB: MIB, MNT: MNT, DEV: DEV, PID: PID, PROMPT: PROMPT, FS: FS, SCENES: SCENES, SCENE_IDS: SCENE_IDS,
    CHUNK: CHUNK, CHUNK_BLOCKS: CHUNK_BLOCKS, DISAGREE: DISAGREE,
    avail: avail, freeInodes: freeInodes, refresh: refresh, lowestFree: lowestFree, createOne: createOne,
    writeTo: writeTo, fillFiles: fillFiles, freeCheck: freeCheck, removeName: removeName, removeTree: removeTree,
    duBlocks: duBlocks, human: human, pct: pct, table: table, dfh: dfh, dfi: dfi, lsofL1: lsofL1,
    nextCheck: nextCheck, cause: cause, shrinkChunks: shrinkChunks, fileName: fileName, apply: apply, blank: blank, entryOf: entryOf, inodeOf: inodeOf,
    /** Held open by a process with no name left (rule 5, postponed). */
    orphan: function (s, ino) { var n = inodeOf(s, ino); return !!n && n.nlink === 0 && n.openBy.length > 0; },
    /** Blocks that belong to deleted files still open: df counts them, du cannot reach them. */
    heldBlocks: function (s) {
      return Object.keys(s.inodes).reduce(function (t, k) {
        var n = s.inodes[k];
        return t + (n.nlink === 0 && n.openBy.length ? n.blocks : 0);
      }, 0);
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
