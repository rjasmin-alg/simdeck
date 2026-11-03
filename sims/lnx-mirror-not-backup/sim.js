/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-mirror-not-backup: two 2 GiB disks vdb and vdc joined as md0 (RAID 1), ext4 on md0 mounted at
   /mnt/polje, and the file proba.txt. Each step is one command (or one event: an application's write, a disk dying)
   acting on its layer: the device layer (mdadm --create, --fail, --re-add, a disk dying) or the filesystem layer
   (mkfs, tee, rm, an application or a malicious program writing). A filesystem write goes through md to every active
   member; afterwards /proc/mdstat is recomputed and `cat /mnt/polje/proba.txt` is run (phases a–c, SPEC.md).
   Each disk is drawn as its first NBLK blocks: block 0 holds the filesystem's metadata (superblock, bitmaps, inodes,
   directory), the rest file data, two blocks per file. A block is null (never written) or { tag, data }: the disk
   only stores bytes; whether the filesystem still points at a block is the filesystem's business (freedBlocks()).
   Rules: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DISKS = ['vdb', 'vdc'];          // role 0, role 1 (mdadm --create order)
  var NBLK = 8;                         // blocks drawn per disk
  var MNT = '/mnt/polje';
  var WATCH = 'proba.txt';              // the file `cat` reads after every step
  var TEXT = 'ovo je test\n';           // echo 'ovo je test' | tee: 12 bytes (ls -l in ch12)
  var MORE = 'ovo je test\ndrugi redak\n';
  var GARBAGE = 'x9#q~!Zk@3$v';         // 12 bytes of an application's wrong write
  var ENC = '§enc§';          // marker: content encrypted by a malicious program
  var NOTE = 'README.txt';              // the note the malicious program leaves (S3: "a README in every folder")
  /** /proc/mdstat numbers from ch12 (`cat /proc/mdstat` after `mdadm --create`). */
  var MD_BLOCKS = 2094080;
  var RESYNC_DONE = 201344;
  var RESYNC_SPEED = 201344;            // K/sec

  function c(op, x) { var o = { op: op }; for (var k in x) o[k] = x[k]; return o; }
  var CREATE = c('create'), MKFS = c('mkfs'), MOUNT = c('mount');
  var TEE = c('tee', { file: WATCH, data: TEXT });

  /** The preset scripts (SPEC.md "Presets"): one command or event per step. */
  var SCENES = {
    'book-primjer3': [CREATE, MKFS, MOUNT, TEE, c('fail', { disk: 'vdc' }), c('readd', { disk: 'vdc' }),
      c('rm', { file: WATCH })],
    corruption: [c('corrupt', { file: WATCH }), c('fail', { disk: 'vdb' }), c('readd', { disk: 'vdb' }),
      c('fail', { disk: 'vdc' })],
    'ransomware-mirror': [c('encrypt', { file: WATCH }), c('encrypt', { file: 'vjezba.txt' }),
      c('tee', { file: NOTE, data: 'README\n', by: 'malware' }), c('fail', { disk: 'vdc' })],
    'two-failures': [c('fail', { disk: 'vdc' }), c('tee', { file: WATCH, data: MORE, append: true }),
      c('die', { disk: 'vdb' })],
    'with-backup': [CREATE, MKFS, MOUNT, TEE, c('fail', { disk: 'vdc' }), c('readd', { disk: 'vdc' }),
      c('backup', { file: WATCH }), c('rm', { file: WATCH }), c('restore', { file: WATCH })]
  };
  var SCENE_IDS = Object.keys(SCENES);
  /** Where a scene starts: from blank disks, or from a healthy mirror holding these files (SPEC.md "Presets"). */
  var START = {
    'book-primjer3': null,
    corruption: [[WATCH, TEXT]],
    'ransomware-mirror': [[WATCH, TEXT], ['vjezba.txt', 'vjezba 12\n']],
    'two-failures': [[WATCH, TEXT]],
    'with-backup': null
  };
  var WITH_BACKUP = { 'with-backup': true };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  function norm(p) {
    p = p || {};
    return { scene: SCENES[p.scene] ? p.scene : 'book-primjer3', showLayers: p.showLayers !== false };
  }
  function script(p) { return SCENES[norm(p).scene]; }
  function steps(p) { return script(p).length; }

  function disk(s, name) {
    for (var i = 0; i < s.disks.length; i++) if (s.disks[i].name === name) return s.disks[i];
    return null;
  }
  /** Rule 1/3: the members that take writes and serve reads: every member not failed (a resyncing one included). */
  function active(s) { return s.disks.filter(function (d) { return d.status !== 'failed'; }); }
  function file(s, name) {
    if (!s.fs) return null;
    for (var i = 0; i < s.fs.files.length; i++) if (s.fs.files[i].name === name) return s.fs.files[i];
    return null;
  }

  /** Array state (ossim-raid-cache words): none before --create; failed with no active member (rule 7); resync while
      the initial resync runs (rule 2); degraded with fewer active members than raid devices (rule 3); else optimal. */
  function arrayState(s) {
    if (!s.created) return 'none';
    var n = active(s).length;
    if (n === 0) return 'failed';
    if (s.resync) return 'resync';
    return n < s.disks.length ? 'degraded' : 'optimal';
  }

  /** /proc/mdstat as fields: members newest first (vdc[1] vdb[0], as ch12 prints them), (F) on failed ones,
      [n/of] active of raid devices, the map in role order (U in sync or resyncing, _ failed), the resync line. */
  function mdstat(s) {
    if (!s.created) return { created: false };
    var map = s.disks.map(function (d) { return d.status === 'failed' ? '_' : 'U'; }).join('');
    return {
      created: true,
      members: s.disks.slice().reverse().map(function (d) { return { name: d.name, role: DISKS.indexOf(d.name), F: d.status === 'failed' }; }),
      n: active(s).length, of: s.disks.length, map: map,
      resync: s.resync ? { done: s.resync.done, total: MD_BLOCKS, pct: pct1(s.resync.done), speed: RESYNC_SPEED } : null
    };
  }
  /** The /proc/mdstat text, line by line (ch12's layout; the resync bar is 20 characters). */
  function mdstatLines(m) {
    if (!m.created) return ['Personalities : ', 'unused devices: <none>'];
    var out = ['Personalities : [raid1] ',
      'md0 : active raid1 ' + m.members.map(function (x) { return x.name + '[' + x.role + ']' + (x.F ? '(F)' : ''); }).join(' '),
      '      ' + MD_BLOCKS + ' blocks super 1.2 [' + m.of + '/' + m.n + '] [' + m.map + ']'];
    if (m.resync) {
      // md's status_resync: per mille, x = per_milli / 50 '=' then '>' then 20 − x '.'; finish in whole seconds,
      // printed as minutes and tenths (rt / 60, (rt % 60) / 6)
      var pm = Math.floor(m.resync.done * 1000 / MD_BLOCKS), x = Math.floor(pm / 50);
      var bar = '[' + new Array(x + 1).join('=') + '>' + new Array(20 - x + 1).join('.') + ']';
      var rt = Math.floor((MD_BLOCKS - m.resync.done) / m.resync.speed);
      out.push('      ' + bar + '  resync = ' + (m.resync.pct.length < 4 ? ' ' : '') + m.resync.pct + '% (' + m.resync.done + '/' + MD_BLOCKS + ')' +
        ' finish=' + Math.floor(rt / 60) + '.' + Math.floor((rt % 60) / 6) + 'min speed=' + m.resync.speed + 'K/sec');
    }
    out.push('unused devices: <none>');
    return out;
  }
  /** md prints per mille as %3u.%u: truncated, not rounded (201344 / 2094080 → 9.6). */
  function pct1(done) { var pm = Math.floor(done * 1000 / MD_BLOCKS); return Math.floor(pm / 10) + '.' + (pm % 10); }

  /** `cat /mnt/polje/<name>`: { exit, out, err, from } (rules 3, 5, 7). Not mounted: /mnt/polje is an empty directory on
      the root filesystem. Array failed: an I/O error (check). Else the data comes from the first active member. */
  function cat(s, name) {
    name = name || WATCH;
    if (!s.mounted) return { exit: 1, out: null, err: 'enoent', from: null };
    var act = active(s);
    if (!act.length) return { exit: 1, out: null, err: 'eio', from: null };
    var f = file(s, name);
    if (!f) return { exit: 1, out: null, err: 'enoent', from: null };
    var d = act[0];
    return { exit: 0, out: d.blocks[f.blocks[0]].data, err: null, from: d.name };
  }

  /** Rule 1/3 (phase b): a write at the filesystem layer goes through md to every active member; a failed one gets
      nothing. writes: { blockIndex: block }. Returns the members written, or null when no member is active (EIO). */
  function mdWrite(s, writes) {
    var to = active(s);
    if (!to.length) return null;
    to.forEach(function (d) { for (var k in writes) d.blocks[k] = clone(writes[k]); });
    return to.map(function (d) { return d.name; });
  }

  /** Blocks the filesystem points at: 0 (metadata) and every file's blocks. */
  function usedBlocks(s) {
    var u = {};
    if (!s.fs) return u;
    u[0] = true;
    s.fs.files.forEach(function (f) { f.blocks.forEach(function (b) { u[b] = true; }); });
    return u;
  }
  /** Blocks that hold old bytes the filesystem no longer points at (freed by rm, rule 5). */
  function freedBlocks(s) {
    var u = usedBlocks(s), out = [];
    var d = active(s)[0] || s.disks[0];
    for (var k = 1; k < NBLK; k++) if (!u[k] && d.blocks[k]) out.push(k);
    return out;
  }
  /** First two blocks the filesystem does not use (lowest first). */
  function allocate(s) {
    var u = usedBlocks(s), out = [];
    for (var k = 1; k < NBLK && out.length < 2; k++) if (!u[k]) out.push(k);
    return out;
  }
  function tagOf(name) { return name.charAt(0).toLowerCase(); }

  /** One filesystem write: the metadata block (block 0, its version goes up) plus the given data blocks. */
  function fsWrite(s, ev, data) {
    if (!active(s).length) { ev.eio = true; return false; }
    s.fs.meta += 1;
    var w = { 0: { tag: 'fs', data: 'v' + s.fs.meta } };
    for (var k in data) w[k] = data[k];
    ev.to = mdWrite(s, w);
    ev.wrote = Object.keys(w).map(Number).sort(function (a, b) { return a - b; });
    ev.skipped = s.disks.filter(function (d) { return d.status === 'failed'; }).map(function (d) { return d.name; });
    return true;
  }
  function writeFile(s, ev, name, content, keepTag) {
    if (!active(s).length) { ev.eio = true; return; }              // rule 7: nothing changes, not even metadata
    var f = file(s, name);
    if (!f) {
      var b = allocate(s);
      if (b.length < 2) { ev.full = true; return; }
      f = { name: name, size: 0, blocks: b, tag: tagOf(name) };
      s.fs.files.push(f);
    }
    f.size = content === ENC ? f.size : content.length;
    var w = {};
    f.blocks.forEach(function (k, i) { w[k] = { tag: (keepTag || f.tag) + (i + 1), data: content }; });
    fsWrite(s, ev, w);
  }

  /** One command or event (phase a, and phase b for filesystem writes). Returns { s, ev }. */
  function apply(s0, op) {
    var s = clone(s0);
    var ev = { op: op.op, disk: op.disk || null, file: op.file || null, by: op.by || null, layer: 'device',
      wrote: [], to: [], skipped: [], copied: [], resyncDone: false, refused: false, noop: false, eio: false, err: null };
    // time passes between commands: an initial resync of 2 GiB at ~200 MB/s is done after about ten seconds (rule 2)
    if (s.resync && op.op !== 'create') {
      s.resync = null;
      s.disks.forEach(function (d) { if (d.status === 'resync') d.status = 'ok'; });
      ev.resyncDone = true;
    }
    var d = op.disk ? disk(s, op.disk) : null;
    var f = op.file ? file(s, op.file) : null;
    switch (op.op) {
      case 'create':                                                // rule 2
        s.created = true;
        s.disks.forEach(function (x, i) { x.status = i === 0 ? 'ok' : 'resync'; });
        s.resync = { done: RESYNC_DONE };
        break;
      case 'mkfs':
        ev.layer = 'fs';
        s.fs = { meta: 0, files: [] };
        fsWrite(s, ev, {});
        break;
      case 'mount':
        ev.layer = 'fs';
        s.mounted = true;
        break;
      case 'fail':                                                  // rule 3
        if (d.status === 'failed') { ev.noop = true; break; }
        if (active(s).length === 1) { ev.refused = true; break; }  // md keeps the last working member (check)
        d.status = 'failed';
        break;
      case 'die':                                                   // rule 7: a real disk death, not refused
        if (d.status === 'failed') { ev.noop = true; break; }
        d.status = 'failed';
        break;
      case 'readd':                                                 // rule 4
        if (d.status !== 'failed') { ev.noop = true; break; }
        var src = active(s)[0];
        if (!src) { ev.refused = true; break; }
        for (var k = 0; k < NBLK; k++) {
          if (JSON.stringify(d.blocks[k]) !== JSON.stringify(src.blocks[k])) ev.copied.push(k);
          d.blocks[k] = clone(src.blocks[k]);
        }
        d.status = 'ok';
        break;
      case 'tee':                                                   // a write through the filesystem (rule 1)
        ev.layer = 'fs';
        writeFile(s, ev, op.file, op.data);
        break;
      case 'corrupt':                                               // rule 6: an application writes wrong bytes
        ev.layer = 'fs';
        if (!f) { ev.err = 'enoent'; break; }
        writeFile(s, ev, op.file, GARBAGE);
        break;
      case 'encrypt':                                               // rule 6: encrypt, then rename to *.locked
        ev.layer = 'fs';
        if (!f) { ev.err = 'enoent'; break; }
        writeFile(s, ev, op.file, ENC);
        if (ev.eio) break;
        f = file(s, op.file);
        f.name = op.file + '.locked';
        ev.renamed = f.name;
        break;
      case 'rm':                                                    // rule 5: a delete is a filesystem write
        ev.layer = 'fs';
        if (!f) { ev.noop = true; break; }                          // rm -f of a missing file: nothing, exit 0
        if (!active(s).length) { ev.eio = true; break; }
        s.fs.files = s.fs.files.filter(function (x) { return x !== f; });
        ev.freed = f.blocks.slice();
        fsWrite(s, ev, {});
        break;
      case 'backup':                                                // rule 8: a copy to a second machine
        ev.layer = 'net';
        var r = cat(s, op.file);
        if (r.exit) { ev.err = r.err; break; }
        if (!s.backup) s.backup = { files: [] };                    // the second machine appears with its first copy
        s.backup.files = s.backup.files.filter(function (x) { return x.name !== op.file; });
        s.backup.files.push({ name: op.file, data: r.out, at: s.i + 1 });
        break;
      case 'restore':                                               // rule 8: copy back, a filesystem write again
        ev.layer = 'fs';
        var b = s.backup && s.backup.files.filter(function (x) { return x.name === op.file; })[0];
        if (!b) { ev.err = 'enoent'; break; }
        writeFile(s, ev, op.file, b.data);
        break;
    }
    s.array = arrayState(s);                                         // phase c
    s.mdstat = mdstat(s);
    s.cat = cat(s, WATCH);
    return { s: s, ev: ev };
  }

  /** Blank disks, no array (before mdadm --create). */
  function blank(o) {
    var s = {
      created: false, resync: null, mounted: false, fs: null,
      disks: DISKS.map(function (n) { return { name: n, status: 'ok', blocks: new Array(NBLK).fill(null) }; }),
      backup: WITH_BACKUP[o.scene] ? { files: [] } : null,
      i: 0, ev: null
    };
    s.array = arrayState(s);
    s.mdstat = mdstat(s);
    s.cat = cat(s, WATCH);
    return s;
  }

  var logic = {
    DISKS: DISKS, NBLK: NBLK, MNT: MNT, WATCH: WATCH, TEXT: TEXT, MORE: MORE, GARBAGE: GARBAGE, ENC: ENC, NOTE: NOTE,
    MD_BLOCKS: MD_BLOCKS, SCENES: SCENES, SCENE_IDS: SCENE_IDS,

    /** Parameter defaults (SPEC.md "Params"). scene: the preset script. */
    defaults: { scene: 'book-primjer3', showLayers: true },

    steps: steps,
    script: script,
    norm: norm,

    /** Step 0: blank disks, or a healthy mirror already holding the scene's files (built by the same commands). */
    initial: function (p) {
      var o = norm(p), s = blank(o), files = START[o.scene];
      if (files) {
        [CREATE, MKFS, MOUNT].forEach(function (op) { s = apply(s, op).s; });
        files.forEach(function (x) { s = apply(s, c('tee', { file: x[0], data: x[1] })).s; });
        s = apply(s, c('mount')).s;                                 // a no-op that lets the resync finish
      }
      s.i = 0;
      s.ev = null;
      return s;
    },

    /** Step n from step n − 1: one command of the script. */
    step: function (s, n, p) {
      var res = apply(s, script(p)[n - 1]);
      res.s.i = n;
      res.s.ev = res.ev;
      return res.s;
    },

    apply: apply,
    blank: function (p) { return blank(norm(p)); },
    cmd: c,
    active: active,
    disk: disk,
    file: file,
    cat: cat,
    arrayState: arrayState,
    mdstat: mdstat,
    mdstatLines: mdstatLines,
    usedBlocks: usedBlocks,
    freedBlocks: freedBlocks
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
