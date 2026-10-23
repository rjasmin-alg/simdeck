/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-lvm-extend: the four layers between two disks and the files, PV → VG → LV → filesystem, and the
   one command per step that changes one of them (pvcreate, vgcreate/vgextend, lvcreate/lvextend, mkfs/growfs) or
   reads one (pvs, vgs, lvs, df -hT). Space is counted in physical extents (PEs) of peMiB; the filesystem counts its
   own 4 KiB blocks and knows only the blocks mkfs or a grow gave it.
   Rules: SPEC.md. The book's numbers (ch12): 4 MiB extents, 511 PEs per 2 GiB disk, 375 needed but 255 free,
   256 → 631 extents, 262144 → 646144 blocks, df 960M → 2.5G.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. Command output is the real
   tools' English text (data, not language); the page words everything else. */
(function (root) {
  'use strict';

  var VG = 'podaci';
  var LV = 'arhiva';
  var MNT = '/mnt/arhiva';
  var DEV = '/dev/' + VG + '/' + LV;
  var MAPPER = '/dev/mapper/' + VG + '-' + LV;
  var VDB = '/dev/vdb';
  var VDC = '/dev/vdc';
  var MIB = 1048576;
  var BLOCK = 4096;                 // filesystem block (bytes): mkfs.xfs bsize=4096 (ch12)
  var ALIGN_MIB = 1;                // rule 1: the first PE starts 1 MiB into the device
  var PE_SIZES = [4, 8, 16, 32];
  var DISK2 = [2, 4, 8];
  var FS_TYPES = ['xfs', 'ext4'];
  var XFS_LOG = 16384;              // mkfs.xfs internal log on the 1 GiB volume, blocks (ch12); df leaves it out
  // XFS: df "Used" on an empty filesystem, MiB, as a line through the book's two points (1024 MiB → 51M, 2524 MiB →
  // 80M, with Avail 910M and 2.4G): derived (SPEC.md rule 7).
  var XFS_USED0 = 30.7;
  var XFS_USED_PER = 29 / 1500;
  // ext4 (measured on an image file with mke2fs 1.47 and resize2fs, offline; SPEC.md rule 8): 32768 blocks per group,
  // 2 bitmaps + 512 inode-table blocks per group, superblock + 128 GDT blocks in groups 0, 1 and powers of 3, 5, 7,
  // an 8192-block journal, 6 blocks used, 5 % reserved for root (13107 of 262144).
  var E4_GROUP = 32768;
  var E4_PER_GROUP = 514;
  var E4_BACKUP = 129;
  var E4_JOURNAL = 8192;
  var E4_USED = 6;
  var E4_RESERVED = 13107 / 262144;

  // ── the preset scripts (SPEC.md "Presets"): setup runs silently before step 0, then one command per step ──

  var BASE = [
    { op: 'pvcreate', disk: VDB }, { op: 'vgcreate', disk: VDB }, { op: 'lvcreate', mib: 1024 }, { op: 'mkfs' }, { op: 'mount' }
  ];
  var SCENES = {
    book: {
      setup: BASE,
      steps: [
        { op: 'lvextend', mib: 'grow' }, { op: 'pvcreate', disk: VDC }, { op: 'vgextend', disk: VDC },
        { op: 'lvextend', mib: 'grow' }, { op: 'df' }, { op: 'growfs' }, { op: 'df' }, { op: 'pvs' }
      ]
    },
    build: {
      setup: [],
      steps: [
        { op: 'pvcreate', disk: VDB }, { op: 'vgcreate', disk: VDB }, { op: 'lvcreate', mib: 1024 }, { op: 'mkfs' },
        { op: 'mount' }, { op: 'df' }
      ]
    },
    'forgot-fs': {
      setup: BASE.concat([{ op: 'pvcreate', disk: VDC }, { op: 'vgextend', disk: VDC }, { op: 'lvextend', mib: 1500 }]),
      steps: [{ op: 'vgs' }, { op: 'lvs' }, { op: 'df' }, { op: 'growfs' }]
    },
    'will-it-fit': {
      setup: BASE.concat([{ op: 'pvcreate', disk: VDC }, { op: 'vgextend', disk: VDC }, { op: 'lvextend', mib: 1500 }, { op: 'growfs' }]),
      steps: [{ op: 'pvs' }, { op: 'lvextend', mib: 1024 }, { op: 'vgs', restore: true }, { op: 'lvextend', mib: 2048 }]
    },
    'ext4-r': {
      setup: BASE,
      steps: [
        { op: 'lvextend', mib: 'grow' }, { op: 'pvcreate', disk: VDC }, { op: 'vgextend', disk: VDC },
        { op: 'lvextend', mib: 'grow', resizefs: true }, { op: 'df' }
      ]
    }
  };
  var SCENE_IDS = Object.keys(SCENES);

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
  function lpad(s, n) { s = String(s); while (s.length < n) s = ' ' + s; return s; }

  // ── sizes as the tools print them ──

  /** LVM's sizes: two decimals in the largest unit that fits, '<' when the shown value is above the real one
      (2044 MiB → "<2.00g", 1020 MiB → "1020.00m", 0 → "0"); long: "2.46 GiB" (the lvextend message). */
  function lvmSize(mib, long) {
    if (mib === 0) return '0';
    var u = mib >= 1048576 ? ['t', 'TiB', 1048576] : mib >= 1024 ? ['g', 'GiB', 1024] : ['m', 'MiB', 1];
    var v = mib / u[2], r = Math.round(v * 100) / 100;
    return (r > v + 1e-9 ? '<' : '') + r.toFixed(2) + (long ? ' ' + u[1] : u[0]);
  }

  /** df -h: powers of 1024, rounded up; one decimal under 10 (2.402 GiB → "2.5G"), none from 10 on (960M). */
  function dfSize(bytes) {
    var units = ['', 'K', 'M', 'G', 'T'], k = 0, v = bytes;
    while (v >= 1024 && k < units.length - 1) { v /= 1024; k++; }
    if (k === 0) return String(Math.ceil(v));
    if (v < 10) {
      var d = Math.ceil(v * 10 - 1e-9) / 10;
      return (d >= 10 ? '10' : d.toFixed(1)) + units[k];
    }
    var w = Math.ceil(v - 1e-9);
    if (w >= 1024 && k < units.length - 1) return '1.0' + units[k + 1];
    return w + units[k];
  }

  /** The -L argument as typed: whole GiB as "1G", the rest in MiB ("1500M"). */
  function sizeArg(mib) { return mib % 1024 === 0 ? (mib / 1024) + 'G' : mib + 'M'; }

  // ── the layers ──

  function disk(s, name) { for (var i = 0; i < s.disks.length; i++) if (s.disks[i].name === name) return s.disks[i]; return null; }
  /** Rule 1: usable PEs on a device = floor((MiB − 1) / PE MiB): 2048 MiB at 4 MiB → 511. */
  function peCount(sizeMiB, peMiB) { return Math.floor((sizeMiB - ALIGN_MIB) / peMiB); }
  /** Rule 2: a size in MiB as whole extents, rounded up: 1500M → 375, 1G → 256 (at 4 MiB). */
  function extentsFor(mib, peMiB) { return Math.ceil(mib / peMiB); }
  function freeOf(d) { return d.pes.filter(function (x) { return x === null; }).length; }
  function vgDisks(s) { return s.vg ? s.vg.pvs.map(function (n) { return disk(s, n); }) : []; }
  function vgTotal(s) { return vgDisks(s).reduce(function (a, d) { return a + d.pes.length; }, 0); }
  function vgFree(s) { return vgDisks(s).reduce(function (a, d) { return a + freeOf(d); }, 0); }
  function lvMiB(s) { return s.lv ? s.lv.les.length * s.peMiB : 0; }
  function fsMiB(fs) { return fs ? fs.blocks * BLOCK / MIB : 0; }

  /** Rule 5: n free PEs of the VG, the first PV in VG order first, lowest PE number first, then the next PV.
      Returns [{ disk, pe }] or null when the VG has fewer than n free (rule 3). */
  function allocate(s, n) {
    var out = [];
    vgDisks(s).forEach(function (d) {
      for (var i = 0; i < d.pes.length && out.length < n; i++) if (d.pes[i] === null) out.push({ disk: d.name, pe: i });
    });
    return out.length === n ? out : null;
  }

  /** How many of the extents in `les` sit on each disk, in VG order (disk order without a VG): [{ disk, n }]. */
  function split(s, les) {
    var names = s.vg ? s.vg.pvs : s.disks.map(function (d) { return d.name; });
    return names.map(function (name) {
      return { disk: name, n: les.filter(function (e) { return e.disk === name; }).length };
    }).filter(function (x) { return x.n > 0; });
  }

  // ── filesystems ──

  function xfsUsedMiB(dataMiB) { return XFS_USED0 + dataMiB * XFS_USED_PER; }

  function e4Overhead(blocks) {
    var groups = Math.ceil(blocks / E4_GROUP), backups = 0;
    for (var g = 0; g < groups; g++) if (g < 2 || isPow(g, 3) || isPow(g, 5) || isPow(g, 7)) backups++;
    return groups * E4_PER_GROUP + backups * E4_BACKUP + E4_JOURNAL;
  }
  function isPow(n, b) { while (n > 1 && n % b === 0) n /= b; return n === 1; }

  /** What statfs gives df, in bytes: { size, used, avail } (SPEC.md rules 7, 8). */
  function dfBytes(fs) {
    if (fs.type === 'xfs') {
      var size = (fs.blocks - XFS_LOG) * BLOCK, used = Math.round(fs.usedMiB * MIB);
      return { size: size, used: used, avail: size - used };
    }
    var fblocks = fs.blocks - e4Overhead(fs.blocks), reserved = Math.floor(fs.blocks * E4_RESERVED);
    return { size: fblocks * BLOCK, used: E4_USED * BLOCK, avail: (fblocks - E4_USED - reserved) * BLOCK };
  }

  // ── what the read-only commands print (the counters of each layer) ──

  function pvsRows(s) {
    return s.disks.filter(function (d) { return d.pv; }).map(function (d) {
      var inVg = d.vg !== null;
      return {
        pv: d.name, vg: d.vg || '', fmt: 'lvm2', attr: inVg ? 'a--' : '---',
        psize: lvmSize(inVg ? d.pes.length * s.peMiB : d.sizeMiB), pfree: lvmSize(inVg ? freeOf(d) * s.peMiB : d.sizeMiB),
        pes: inVg ? d.pes.length : null, free: inVg ? freeOf(d) : null
      };
    });
  }
  function vgsRow(s) {
    if (!s.vg) return null;
    return {
      vg: s.vg.name, pv: s.vg.pvs.length, lv: s.lv ? 1 : 0, sn: 0, attr: 'wz--n-',
      vsize: lvmSize(vgTotal(s) * s.peMiB), vfree: lvmSize(vgFree(s) * s.peMiB), pes: vgTotal(s), free: vgFree(s)
    };
  }
  function lvsRow(s) {
    if (!s.lv) return null;
    return { lv: s.lv.name, vg: VG, attr: s.fs && s.fs.mounted ? '-wi-ao----' : '-wi-a-----', lsize: lvmSize(lvMiB(s)), les: s.lv.les.length };
  }
  function dfRow(s) {
    if (!s.fs || !s.fs.mounted) return null;
    var b = dfBytes(s.fs);
    var pct = b.used > 0 ? Math.ceil(b.used * 100 / (b.used + b.avail) - 1e-9) : 0;
    return { fs: MAPPER, type: s.fs.type, size: dfSize(b.size), used: dfSize(b.used), avail: dfSize(b.avail), pct: pct + '%', mnt: MNT };
  }

  /** Columns as the tools align them: text left, numbers and sizes right (`right`), each at least `min` wide.
      LVM indents its tables by two spaces and keeps every header left; df right-aligns the numbers' headers too. */
  function table(head, rows, right, indent, min, headRight) {
    var w = head.map(function (h, i) { return rows.reduce(function (m, r) { return Math.max(m, String(r[i]).length); }, Math.max(h.length, (min && min[i]) || 0)); });
    var line = function (r, isHead) {
      return indent + r.map(function (c, i) { return right[i] && (!isHead || headRight) ? lpad(c, w[i]) : pad(c, w[i]); }).join(' ').replace(/\s+$/, '');
    };
    return [line(head, true)].concat(rows.map(function (r) { return line(r, false); }));
  }
  function pvsOut(s) {
    return table(['PV', 'VG', 'Fmt', 'Attr', 'PSize', 'PFree'], pvsRows(s).map(function (r) { return [pad(r.pv, 10), r.vg, r.fmt, r.attr, r.psize, r.pfree]; }),
      [0, 0, 0, 0, 1, 1], '  ');
  }
  function vgsOut(s) {
    var r = vgsRow(s);
    return table(['VG', '#PV', '#LV', '#SN', 'Attr', 'VSize', 'VFree'], r ? [[r.vg, r.pv, r.lv, r.sn, r.attr, r.vsize, r.vfree]] : [],
      [0, 1, 1, 1, 0, 1, 1], '  ');
  }
  function lvsOut(s) {
    var r = lvsRow(s);
    return table(['LV', 'VG', 'Attr', 'LSize'], r ? [[r.lv, r.vg, r.attr, r.lsize]] : [], [0, 0, 0, 1], '  ');
  }
  function dfOut(s) {
    var r = dfRow(s);
    return table(['Filesystem', 'Type', 'Size', 'Used', 'Avail', 'Use%', 'Mounted on'], r ? [[r.fs, r.type, r.size, r.used, r.avail, r.pct, r.mnt]] : [],
      [0, 0, 1, 1, 1, 1, 0], '', [0, 4, 5, 5, 5, 4, 0], true);
  }

  /** One string per layer of what its read-only command prints, plus the filesystem's own block count: a layer
      "changed" in a step when its string did. Ids: 'fs', 'lv', 'vg', 'pv:<disk>'. */
  function layerSigs(s) {
    var out = {
      fs: JSON.stringify([s.fs && s.fs.blocks, s.fs && s.fs.mounted, dfRow(s)]),
      lv: JSON.stringify(s.lv && [lvMiB(s), s.lv.les]),      // its size and place, not the open flag a mount sets
      vg: JSON.stringify(vgsRow(s))
    };
    var pvs = pvsRows(s);
    s.disks.forEach(function (d) {
      out['pv:' + d.name] = JSON.stringify(pvs.filter(function (r) { return r.pv === d.name; })[0] || null);
    });
    return out;
  }
  function layerIds(s) { return ['fs', 'lv', 'vg'].concat(s.disks.map(function (d) { return 'pv:' + d.name; })); }

  // ── the commands ──

  function xfsGeometry(dev, blocks, agsize) {
    return [
      'meta-data=' + pad(dev, 22) + ' isize=512    agcount=' + Math.ceil(blocks / agsize) + ', agsize=' + agsize + ' blks',
      'data     =                       bsize=4096   blocks=' + blocks + ', imaxpct=25',
      'log      =internal log           bsize=4096   blocks=' + XFS_LOG + ', version=2',
      '…'
    ];
  }
  function e4Resize(dev, from, to) {
    var desc = function (b) { return Math.ceil(Math.ceil(b / E4_GROUP) / 64); };
    return [
      'resize2fs 1.47.1 (20-May-2024)',
      'Filesystem at ' + dev + ' is mounted on ' + MNT + '; on-line resizing required',
      'old_desc_blocks = ' + desc(from) + ', new_desc_blocks = ' + desc(to),
      'The filesystem on ' + dev + ' is now ' + to + ' (4k) blocks long.'
    ];
  }

  /** Rules 7–9: grow the filesystem to `blocks` (the whole LV). XFS must be mounted and cannot shrink; ext4 grows
      online when mounted. Returns { fs, out, exit, from, to }. */
  function growFs(fs, blocks) {
    var f = clone(fs), from = fs.blocks;
    if (f.type === 'xfs') {
      if (!f.mounted) return { fs: f, out: ['xfs_growfs: ' + MNT + ' is not a mounted XFS filesystem'], exit: 1, from: from, to: from };
      var geo = xfsGeometry(MAPPER, from, f.agsize);
      if (blocks < from) return { fs: f, out: geo.concat(['data size ' + blocks + ' too small, old size is ' + from]), exit: 1, from: from, to: from };
      if (blocks === from) return { fs: f, out: geo.concat(['data size unchanged, skipping']), exit: 0, from: from, to: from };
      f.blocks = blocks;
      f.usedMiB = xfsUsedMiB(fsMiB(f));
      return { fs: f, out: geo.concat(['data blocks changed from ' + from + ' to ' + blocks]), exit: 0, from: from, to: blocks };
    }
    if (!f.mounted) return { fs: f, out: ['resize2fs 1.47.1 (20-May-2024)', 'Please run \'e2fsck -f ' + DEV + '\' first.'], exit: 1, from: from, to: from };
    if (blocks < from) return { fs: f, out: ['resize2fs 1.47.1 (20-May-2024)', 'On-line shrinking not supported'], exit: 1, from: from, to: from };
    if (blocks === from) return { fs: f, out: ['resize2fs 1.47.1 (20-May-2024)', 'The filesystem is already ' + from + ' (4k) blocks long.  Nothing to do!'], exit: 0, from: from, to: from };
    f.blocks = blocks;
    return { fs: f, out: e4Resize(DEV, from, blocks), exit: 0, from: from, to: blocks };
  }

  function lvBlocks(s) { return lvMiB(s) * MIB / BLOCK; }

  /** Run one command on state s (a copy is returned). Sets cmd, out, exit, event, info, changed, refused, asked. */
  function run(s0, op, o) {
    var s = clone(s0), info = {}, out = [], exit = 0, refused = [], asked = [], cmd;
    var pe = s.peMiB;
    if (op.op === 'pvcreate') {
      var d = disk(s, op.disk);
      cmd = 'sudo pvcreate ' + d.name;
      d.pv = true;                                           // rule 4: a PV, but no space anywhere yet
      out = ['  Physical volume "' + d.name + '" successfully created.'];
    } else if (op.op === 'vgcreate' || op.op === 'vgextend') {
      var dv = disk(s, op.disk);
      if (op.op === 'vgcreate') {
        cmd = 'sudo vgcreate ' + (pe !== 4 ? '-s ' + pe + 'M ' : '') + VG + ' ' + dv.name;
        s.vg = { name: VG, pvs: [] };
        out = ['  Volume group "' + VG + '" successfully created'];
      } else {
        cmd = 'sudo vgextend ' + VG + ' ' + dv.name;
        out = ['  Volume group "' + VG + '" successfully extended'];
      }
      dv.pv = true;                                          // vgcreate/vgextend initialise a device that is not a PV yet
      dv.vg = VG;
      dv.pes = [];
      for (var i = 0; i < peCount(dv.sizeMiB, pe); i++) dv.pes.push(null);
      s.vg.pvs.push(dv.name);                                // VG order = the order the PVs joined (rule 5)
      info = { disk: dv.name, pes: dv.pes.length, naive: dv.sizeMiB / pe };
    } else if (op.op === 'lvcreate' || op.op === 'lvextend') {
      var mib = op.mib === 'grow' ? o.growMiB : op.mib;
      var need = extentsFor(mib, pe), free = vgFree(s);
      var rounded = need * pe !== mib;
      if (op.op === 'lvcreate') cmd = 'sudo lvcreate -n ' + LV + ' -L ' + sizeArg(mib) + ' ' + VG;
      else cmd = 'sudo lvextend ' + (op.resizefs ? '-r ' : '') + '-L +' + sizeArg(mib) + ' ' + DEV;
      var round = rounded ? ['  Rounding size to boundary between physical extents: ' + lvmSize(need * pe, true) + '.'] : [];
      var got = allocate(s, need);
      info = { mib: mib, need: need, free: free, rounded: rounded, from: s.lv ? s.lv.les.length : 0 };
      if (!got) {                                            // rule 3: nothing changes, exit status 5
        exit = 5;
        refused = ['lv'];
        out = round.concat(op.op === 'lvcreate'
          ? ['  Volume group "' + VG + '" has insufficient free space (' + free + ' extents): ' + need + ' required.']
          : ['  Insufficient free space: ' + need + ' extents needed, but only ' + free + ' available']);
        info.to = info.from;
      } else {
        if (!s.lv) s.lv = { name: LV, les: [] };
        var before = lvMiB(s), fromLe = s.lv.les.length;
        got.forEach(function (e) { disk(s, e.disk).pes[e.pe] = LV; s.lv.les.push(e); });
        info.to = s.lv.les.length;
        info.split = split(s, got);
        if (op.op === 'lvcreate') out = round.concat(['  Logical volume "' + LV + '" created.']);
        else {
          var fsLines = [], fsDone = [];
          if (op.resizefs && s.fs) {                         // rule 8: -r runs the filesystem's own grow after the LV's
            var g = growFs(s.fs, lvBlocks(s));
            s.fs = g.fs;
            info.fsFrom = g.from; info.fsTo = g.to;
            fsLines = ['  Extending file system ' + s.fs.type + ' to ' + lvmSize(lvMiB(s), true) + ' (' + (lvMiB(s) * MIB) + ' bytes) on ' + VG + '/' + LV + '...']
              .concat([g.out[g.out.length - 1]]);              // its last line: the new block count
            fsDone = ['  Extended file system ' + s.fs.type + ' on ' + VG + '/' + LV + '.'];
            if (g.exit) exit = g.exit;
          }
          out = round.concat(
            ['  Size of logical volume ' + VG + '/' + LV + ' changed from ' + lvmSize(before, true) + ' (' + fromLe + ' extents) to ' +
              lvmSize(lvMiB(s), true) + ' (' + s.lv.les.length + ' extents).'],
            fsLines, fsDone,
            ['  Logical volume ' + VG + '/' + LV + ' successfully resized.']);
        }
      }
    } else if (op.op === 'mkfs') {
      var type = o.fsType, blocks = lvBlocks(s);
      cmd = 'sudo mkfs.' + type + ' ' + DEV;
      s.fs = { type: type, blocks: blocks, usedMiB: type === 'xfs' ? xfsUsedMiB(lvMiB(s)) : E4_USED * BLOCK / MIB, mounted: false, agsize: blocks / 4 };
      out = type === 'xfs'
        ? xfsGeometry(DEV, blocks, blocks / 4).concat(['Discarding blocks...Done.'])
        : ['mke2fs 1.47.1 (20-May-2024)', 'Creating filesystem with ' + blocks + ' 4k blocks and ' + (blocks / 4) + ' inodes', '…',
          'Creating journal (' + E4_JOURNAL + ' blocks): done', 'Writing superblocks and filesystem accounting information: done'];
      info = { blocks: blocks };
    } else if (op.op === 'mount') {
      cmd = 'sudo mount ' + DEV + ' ' + MNT;
      s.fs.mounted = true;
    } else if (op.op === 'growfs') {
      cmd = s.fs.type === 'xfs' ? 'sudo xfs_growfs ' + MNT : 'sudo resize2fs ' + DEV;
      var r = growFs(s.fs, lvBlocks(s));
      s.fs = r.fs;
      out = r.out;
      exit = r.exit;
      if (exit) refused = ['fs'];
      info = { from: r.from, to: r.to };
    } else {
      if (op.restore) {                                      // back to the scene's start (a "what if" from there)
        var st = initial(o);
        s.disks = st.disks; s.vg = st.vg; s.lv = st.lv; s.fs = st.fs;
      }
      if (op.op === 'pvs') { cmd = 'sudo pvs'; out = pvsOut(s); asked = s.disks.filter(function (x) { return x.pv; }).map(function (x) { return 'pv:' + x.name; }); }
      else if (op.op === 'vgs') { cmd = 'sudo vgs'; out = vgsOut(s); asked = ['vg']; }
      else if (op.op === 'lvs') { cmd = 'sudo lvs'; out = lvsOut(s); asked = ['lv']; }
      else {
        cmd = 'df -hT ' + MNT;
        out = dfOut(s);
        asked = ['fs'];
        if (s.fs && fsMiB(s.fs) < lvMiB(s)) refused = ['fs'];   // rule 6: the LV grew, the filesystem did not
      }
      info = { fsMiB: fsMiB(s.fs), lvMiB: lvMiB(s) };
    }
    // a restore is not a command: the read-only command after it changed nothing, so compare with the restored start
    var a = layerSigs(op.restore ? s : s0), b = layerSigs(s);
    s.changed = layerIds(s).filter(function (id) { return a[id] !== b[id]; });
    s.refused = refused;
    s.asked = asked;
    s.cmd = cmd;
    s.out = out;
    s.exit = exit;
    s.info = info;
    s.op = clone(op);
    s.event = exit ? op.op + '-fail' : op.op;
    return s;
  }

  // ── params and steps ──

  function norm(p) {
    var g = Math.round(Number(p.growMiB) / 100) * 100;
    return {
      scene: SCENES[p.scene] ? p.scene : 'book',
      peMiB: PE_SIZES.indexOf(Number(p.peMiB)) >= 0 ? Number(p.peMiB) : 4,
      disk2GiB: DISK2.indexOf(Number(p.disk2GiB)) >= 0 ? Number(p.disk2GiB) : 2,
      fsType: FS_TYPES.indexOf(p.fsType) >= 0 ? p.fsType : 'xfs',
      growMiB: Number.isFinite(g) ? Math.min(6000, Math.max(100, g)) : 1500
    };
  }
  function scene(p) { return SCENES[norm(p).scene]; }
  function steps(p) { return scene(p).steps.length; }

  function blank(o) {
    return {
      peMiB: o.peMiB,
      disks: [
        { name: VDB, sizeMiB: 2048, pv: false, vg: null, pes: [] },
        { name: VDC, sizeMiB: o.disk2GiB * 1024, pv: false, vg: null, pes: [] }
      ],
      vg: null, lv: null, fs: null,
      cmd: null, out: [], exit: null, event: 'start', info: {}, op: null, changed: [], refused: [], asked: []
    };
  }

  /** Step 0: the scene's setup run silently, then nothing marked. */
  function initial(p) {
    var o = norm(p), s = blank(o);
    scene(p).setup.forEach(function (op) { s = run(s, op, o); });
    s.cmd = null; s.out = []; s.exit = null; s.event = 'start'; s.info = {}; s.op = null;
    s.changed = []; s.refused = []; s.asked = [];
    return s;
  }

  // ── the stage's columns (pure; the page draws them on the block grid) ──

  /** One column = chunkMiB of disk (128 MiB, or 256 when the disks hold more than 6 GiB), i.e. c = chunkMiB / PE MiB
      extents. Disks sit side by side; a disk's last column holds what is left. For each layer and column:
      { cap, n } = extents in the column and how many of them the layer holds (LV: its extents there; fs: the LV's
      extents the filesystem's blocks cover). */
  function columns(s) {
    var total = s.disks.reduce(function (a, d) { return a + d.sizeMiB; }, 0);
    var chunkMiB = total <= 6144 ? 128 : 256, c = chunkMiB / s.peMiB;
    var cols = [], spans = [];
    s.disks.forEach(function (d, di) {
      var cap = peCount(d.sizeMiB, s.peMiB), n = Math.ceil(cap / c);
      spans.push({ disk: d.name, from: cols.length, len: n });
      for (var j = 0; j < n; j++) cols.push({ disk: d.name, di: di, lo: j * c, hi: Math.min(cap, (j + 1) * c) });
    });
    var fsLe = s.fs ? Math.floor(fsMiB(s.fs) / s.peMiB) : 0;
    var lePos = {};
    if (s.lv) s.lv.les.forEach(function (e, i) { lePos[e.disk + '#' + e.pe] = i; });
    var out = cols.map(function (col) {
      var d = disk(s, col.disk), cap = col.hi - col.lo, used = 0, lv = 0, fs = 0;
      for (var pe = col.lo; pe < col.hi; pe++) {
        var i = lePos[col.disk + '#' + pe];
        if (i !== undefined) { lv++; if (i < fsLe) fs++; }
        if (d.vg && d.pes[pe] !== null) used++;
      }
      return {
        disk: col.disk, di: col.di, cap: cap,
        pv: !d.pv ? 'raw' : !d.vg ? 'orphan' : 'vg',
        used: used, lv: lv, fs: fs
      };
    });
    return { chunkMiB: chunkMiB, perCol: c, cols: out, disks: spans };
  }

  var logic = {
    VG: VG, LV: LV, MNT: MNT, DEV: DEV, MAPPER: MAPPER, VDB: VDB, VDC: VDC, BLOCK: BLOCK,
    SCENES: SCENES,
    SCENE_IDS: SCENE_IDS,

    /** scene: the preset's script; peMiB: extent size; disk2GiB: the second disk; fsType: what mkfs writes;
        growMiB: the lvextend -L +… request (live at the current step). */
    defaults: { scene: 'book', peMiB: 4, disk2GiB: 2, fsType: 'xfs', growMiB: 1500 },

    steps: steps,
    initial: initial,
    /** Step n from step n − 1: the scene's n-th command. */
    step: function (s, n, p) { return run(s, scene(p).steps[n - 1], norm(p)); },

    norm: norm,
    script: function (p) { return scene(p).steps; },
    run: run,
    growFs: growFs,
    allocate: allocate,
    peCount: peCount,
    extentsFor: extentsFor,
    vgFree: vgFree,
    vgTotal: vgTotal,
    lvMiB: lvMiB,
    fsMiB: fsMiB,
    split: split,
    lvmSize: lvmSize,
    dfSize: dfSize,
    dfBytes: dfBytes,
    pvsRows: pvsRows,
    vgsRow: vgsRow,
    lvsRow: lvsRow,
    dfRow: dfRow,
    layerIds: layerIds,
    columns: columns
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
