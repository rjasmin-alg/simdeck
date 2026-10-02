/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the ZFS & Btrfs topology lab: where each puts its redundancy. ZFS groups disks into vdevs, each with its
   own redundancy (mirror, RAIDZ, dRAID), and the pool stripes over its top-level data vdevs; special, log, cache and
   spare vdevs are allocation classes, not data capacity. Btrfs makes one filesystem from all its devices and chooses
   a profile per chunk type (data, metadata). Failed disks show which records or chunks stay readable.
   An explorer: no steps; the page draws initial(params).
   Adopted from single-page-labs/zfs-btrfs-topology-lab.html (zVdevCapacity, zPoolStats, bProfileEfficiency,
   bProfileTolerates, bStats, profileMinDevices, the record and chunk placement, the presets and the commands);
   see NOTES.md for what changed.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var Z_TYPES = ['single', 'mirror', 'raidz1', 'raidz2', 'raidz3', 'draid1', 'draid2'];
  var B_DATA = ['single', 'dup', 'raid0', 'raid1', 'raid1c3', 'raid1c4', 'raid10', 'raid5', 'raid6'];
  var B_META = ['dup', 'single', 'raid1', 'raid1c3', 'raid1c4', 'raid10', 'raid5', 'raid6'];
  var MODES = ['zfs', 'btrfs', 'compare'];
  /** Data disks in all top-level data vdevs together (without the mixed-in mirror), so the placement grid fits. */
  var MAX_DATA_DISKS = 24;
  var MAX_VDEVS = 3;
  var MAX_WIDTH = 10;
  var MAX_BDEV = 6;
  /** Rows in the placement view: records (ZFS) or chunks (Btrfs). The original drew 12. */
  var ROWS = 6;
  /** The original's sizes for the extra allocation classes (its "Special + SLOG" preset), in GiB. */
  var SPECIAL_GIB = 400, LOG_GIB = 100, CACHE_GIB = 400;

  // ── ZFS rules (the original's) ──

  function parityOf(type) {
    if (type === 'raidz1' || type === 'draid1') return 1;
    if (type === 'raidz2' || type === 'draid2') return 2;
    if (type === 'raidz3') return 3;
    return 0;
  }
  /** Fewest disks per vdev in the original's teaching model: RAIDZ needs parity + 2, dRAID 6. */
  function minWidth(type) {
    if (type === 'single') return 1;
    if (type === 'mirror') return 2;
    if (type.indexOf('raidz') === 0) return parityOf(type) + 2;
    if (type.indexOf('draid') === 0) return 6;
    return 1;
  }
  function maxWidth(type) { return type === 'single' ? 1 : type === 'mirror' ? 4 : MAX_WIDTH; }
  function widthOf(p) { return Math.max(minWidth(p.zType), Math.min(maxWidth(p.zType), p.zWidth)); }
  function maxVdevs(p) { return Math.max(1, Math.min(MAX_VDEVS, Math.floor(MAX_DATA_DISKS / widthOf(p)))); }

  /** The original's zVdevCapacity: usable space and how many disks a vdev may lose. Log, cache and spare vdevs add
      no data capacity. A mirror keeps the smallest disk, RAIDZ and dRAID (n − parity) × the smallest disk. */
  function vdevCapacity(v, disks) {
    var ds = v.disks.map(function (i) { return disks[i]; });
    var sizes = ds.map(function (d) { return d.size; });
    var n = ds.length;
    var raw = sizes.reduce(function (a, b) { return a + b; }, 0);
    var off = ds.filter(function (d) { return d.failed; }).length;
    var small = n ? Math.min.apply(null, sizes) : 0;
    var usable = 0, faults = 0;
    if (v.role === 'cache' || v.role === 'log' || v.role === 'spare') usable = 0;
    else if (v.type === 'single') usable = sizes[0];
    else if (v.type === 'mirror') { usable = small; faults = n - 1; }
    else { var p = parityOf(v.type); usable = (n - p) * small; faults = p; }
    if (v.role !== 'data' && v.type === 'mirror') faults = n - 1;
    return { raw: raw, usable: usable, faults: faults, offline: off, ok: off <= faults };
  }
  function vdevState(c) { return !c.ok ? 'FAULTED' : c.offline ? 'DEGRADED' : 'ONLINE'; }

  /** Pool and dataset names follow the original's presets, so a preset shows the names its commands used. */
  function zNames(p) {
    if (p.zMix) return { pool: 'lesson', datasets: [['why-this-is-awkward', 'filesystem', 4000, 300, 'lz4']] };
    if (p.zSpecial || p.zLog) return { pool: 'tank', datasets: [['smallfiles', 'filesystem', 1000, 180, 'lz4']] };
    if (p.zType.indexOf('draid') === 0) return { pool: 'bulk', datasets: [['backup', 'filesystem', 9000, 2100, 'zstd']] };
    if (p.zType.indexOf('raidz') === 0) return { pool: 'archive', datasets: [['media', 'filesystem', 6000, 900, 'lz4']] };
    return { pool: 'tank', datasets: [['homes', 'filesystem', 500, 120, 'lz4'], ['vmstore', 'zvol', 300, 80, 'zstd']] };
  }

  /** SCSI disk letters as the kernel counts them: a … z, then aa, ab, … */
  function sdLetters(i) {
    var s = '';
    for (i += 1; i > 0; i = Math.floor((i - 1) / 26)) s = 'abcdefghijklmnopqrstuvwxyz'[(i - 1) % 26] + s;
    return s;
  }
  /** Kernel names: /dev/sda is the system disk, so data disks start at sdb; NVMe devices count from nvme0n1. */
  function namer() {
    var sd = 1, nvme = 0;
    return {
      sd: function () { return '/dev/sd' + sdLetters(sd++); },
      nvme: function () { return '/dev/nvme' + nvme++ + 'n1'; }
    };
  }
  function short(name) { return name.replace('/dev/', ''); }

  /** Which data disks fail, in order: vdev by vdev and disk by disk, or (spread) the first disk of every vdev,
      then the second, and so on. */
  function failOrder(dataVdevs, spread) {
    var order = [];
    if (!spread) dataVdevs.forEach(function (v) { order = order.concat(v.disks); });
    else {
      var most = Math.max.apply(null, dataVdevs.map(function (v) { return v.disks.length; }));
      for (var k = 0; k < most; k++) dataVdevs.forEach(function (v) { if (k < v.disks.length) order.push(v.disks[k]); });
    }
    return order;
  }

  function zfs(p) {
    var nm = namer();
    var names = zNames(p);
    var width = widthOf(p);
    var count = Math.max(1, Math.min(maxVdevs(p), p.zVdevs));
    var disks = [], vdevs = [];
    function addVdev(type, role, n, size, nvme) {
      var v = { index: vdevs.length, type: type, role: role, disks: [] };
      for (var k = 0; k < n; k++) {
        v.disks.push(disks.length);
        disks.push({ index: disks.length, name: nvme ? nm.nvme() : nm.sd(), size: size, nvme: !!nvme, vdev: v.index, failed: false });
      }
      vdevs.push(v);
    }
    // The original's "bad mixed vdev lesson": a 2-disk mirror first, then the other top-level vdevs.
    if (p.zMix) addVdev('mirror', 'data', 2, p.zSize, false);
    for (var i = 0; i < count; i++) addVdev(p.zType, 'data', width, p.zSize, false);
    if (p.zSpare) addVdev('single', 'spare', 1, p.zSize, false);
    if (p.zSpecial) addVdev('mirror', 'special', 2, SPECIAL_GIB, true);
    if (p.zLog) addVdev('mirror', 'log', 2, LOG_GIB, true);
    if (p.zCache) addVdev('single', 'cache', 1, CACHE_GIB, true);

    var data = vdevs.filter(function (v) { return v.role === 'data'; });
    var order = failOrder(data, p.zSpread);
    var nFail = Math.max(0, Math.min(order.length, p.zFailed));
    order.slice(0, nFail).forEach(function (d) { disks[d].failed = true; });

    vdevs.forEach(function (v) { v.cap = vdevCapacity(v, disks); v.state = vdevState(v.cap); });

    var datasets = names.datasets.map(function (x) {
      return { name: x[0], type: x[1], quota: x[2], used: x[3], compression: x[4], encryption: false };
    });
    if (p.zEncrypt) datasets.push({ name: 'research', type: 'filesystem', quota: 500, used: 95, compression: 'zstd', encryption: true });
    var snaps = [];
    if (p.zSnap) snaps.push({ dataset: datasets[0].name, name: 'snap1', used: Math.max(1, Math.round(datasets[0].used * 0.08)) });

    // The original's zPoolStats: FAULTED as soon as one top-level data vdev is, else DEGRADED if one is degraded.
    var raw = disks.reduce(function (a, d) { return a + d.size; }, 0);
    var usable = data.reduce(function (a, v) { return a + v.cap.usable; }, 0);
    var used = datasets.reduce(function (a, d) { return a + d.used; }, 0) + snaps.reduce(function (a, s) { return a + s.used; }, 0);
    var health = data.some(function (v) { return !v.cap.ok; }) ? 'FAULTED'
      : data.some(function (v) { return v.cap.offline > 0; }) ? 'DEGRADED' : 'ONLINE';

    // Records go round-robin over the top-level data vdevs (dynamic striping). Mirror: a full copy on every disk;
    // RAIDZ and dRAID: the parity moves one disk per record.
    var records = [];
    for (var r = 0; r < ROWS; r++) {
      var v = data[r % data.length];
      var n = v.disks.length, pr = parityOf(v.type);
      var cells = v.disks.map(function (d, k) {
        var role = v.type === 'mirror' ? 'copy' : v.type === 'single' ? 'data' : ((k + r) % n) < pr ? 'parity' : 'data';
        return { disk: d, role: role, failed: disks[d].failed };
      });
      records.push({ index: r, vdev: v.index, cells: cells, state: v.state });
    }

    // Commands, in the original's order: create with the first vdev, add the others, then datasets.
    var cmds = [];
    function list(v) {
      var ds = v.disks.map(function (d) { return short(disks[d].name); }).join(' ');
      return v.type === 'single' ? ds : v.type + ' ' + ds;
    }
    vdevs.forEach(function (v, k) {
      if (k === 0) cmds.push({ cmd: 'zpool create ' + names.pool + ' ' + list(v) });
      else cmds.push({ cmd: 'zpool add ' + names.pool + ' ' + (v.role === 'data' ? '' : v.role + ' ') + list(v) });
    });
    datasets.forEach(function (d) {
      var o = d.type === 'zvol' ? '-V ' + d.quota + 'G ' : '';
      o += '-o compression=' + d.compression;
      if (d.type !== 'zvol') o += ' -o quota=' + d.quota + 'G';
      if (d.encryption) o += ' -o encryption=on -o keyformat=passphrase';
      cmds.push({ cmd: 'zfs create ' + o + ' ' + names.pool + '/' + d.name });
    });
    snaps.forEach(function (s) { cmds.push({ cmd: 'zfs snapshot ' + names.pool + '/' + s.dataset + '@' + s.name }); });
    disks.forEach(function (d) { if (d.failed) cmds.push({ cmd: 'zpool offline ' + names.pool + ' ' + short(d.name) }); });
    cmds.push({ cmd: 'zpool status ' + names.pool });

    return {
      pool: names.pool,
      disks: disks,
      vdevs: vdevs,
      datasets: datasets,
      snaps: snaps,
      records: records,
      commands: cmds,
      failed: nFail,
      raw: raw,
      usable: usable,
      used: used,
      free: Math.max(0, usable - used),
      health: health,
      dataVdevs: data.length,
      mixed: !!p.zMix
    };
  }

  // ── Btrfs rules (the original's) ──

  function profileMin(pr) {
    return { single: 1, dup: 1, raid0: 2, raid1: 2, raid1c3: 3, raid1c4: 4, raid10: 4, raid5: 3, raid6: 4 }[pr] || 1;
  }
  /** The original's bProfileEfficiency: the share of raw space that holds data. */
  function efficiency(pr, n) {
    if (!n) return 0;
    switch (pr) {
      case 'dup': case 'raid1': case 'raid10': return 0.5;
      case 'raid1c3': return 1 / 3;
      case 'raid1c4': return 0.25;
      case 'raid5': return n >= 3 ? (n - 1) / n : 0;
      case 'raid6': return n >= 4 ? (n - 2) / n : 0;
      default: return 1;
    }
  }
  /** The original's bProfileTolerates: how many failed devices a profile survives. dup keeps both copies on one
      device, so it survives a bad block, not a lost device. */
  function tolerates(pr) {
    return { raid1: 1, raid1c3: 2, raid1c4: 3, raid10: 1, raid5: 1, raid6: 2 }[pr] || 0;
  }
  function parityProfile(pr) { return pr === 'raid5' || pr === 'raid6'; }

  function bNames(p, n) {
    if (parityProfile(p.bData) || parityProfile(p.bMeta)) return { fs: 'parity-demo', subvols: [['@archive', 1500]] };
    if (p.bMeta === 'raid1c3' || p.bMeta === 'raid1c4') return { fs: 'safe-meta', subvols: [['@db', 220]] };
    if (p.bData === 'raid10') return { fs: 'fastpool', subvols: [['@vm', 350]] };
    if (p.bData === 'single' && p.bMeta === 'raid1') return { fs: 'mixed', subvols: [['@srv', 280]] };
    if (n === 1) return { fs: 'rootfs', subvols: [['@', 80], ['@home', 120]] };
    return { fs: 'bpool', subvols: [['@data', 300]] };
  }

  /** The original's bChunkBlocks, per device: which pieces of chunk r land on which member. */
  function chunkCells(pr, n, r) {
    var cells = [];
    var pick = function (i) { return ((i % n) + n) % n; };
    var put = function (d, role, label) { cells.push({ device: pick(d), role: role, label: label }); };
    if (pr === 'single') put(r, 'data', 'D');
    else if (pr === 'dup') { put(r, 'copy', 'C1'); put(r, 'copy', 'C2'); }
    else if (pr === 'raid0') { for (var i = 0; i < Math.min(n, 4); i++) put(r + i, 'data', 'S' + (i + 1)); }
    else if (pr === 'raid1' || pr === 'raid1c3' || pr === 'raid1c4') {
      var copies = pr === 'raid1' ? 2 : pr === 'raid1c3' ? 3 : 4;
      for (var c = 0; c < Math.min(copies, n); c++) put(r + c, 'copy', 'C' + (c + 1));
    } else if (pr === 'raid10') {
      for (var s = 0; s < Math.min(n, 4); s += 2) { put(r + s, 'copy', 'S' + (s / 2 + 1)); put(r + s + 1, 'copy', 'S' + (s / 2 + 1)); }
    } else if (parityProfile(pr)) {
      var pp = pr === 'raid5' ? 1 : 2;
      for (var k = 0; k < n; k++) put(k, ((k + r) % n) < pp ? 'parity' : 'data', ((k + r) % n) < pp ? 'P' : 'D');
    }
    return cells;
  }

  function btrfs(p) {
    var nm = namer();
    var n = Math.max(1, Math.min(MAX_BDEV, p.bDevices));
    var names = bNames(p, n);
    var nFail = Math.max(0, Math.min(n, p.bFailed));
    var devices = [];
    // The first devices fail first.
    for (var i = 0; i < n; i++) devices.push({ index: i, name: nm.sd(), size: p.bSize, failed: i < nFail });
    var need = Math.max(profileMin(p.bData), profileMin(p.bMeta));
    var fs = { name: names.fs, data: p.bData, meta: p.bMeta, need: need, ok: n >= need };
    if (!fs.ok) fs.error = { code: 'tooFew', need: need, have: n };

    var subvols = [], snaps = [], chunks = [];
    var raw = devices.reduce(function (a, d) { return a + d.size; }, 0);
    var usable = 0, used = 0, health = 'none';
    var tol = Math.min(tolerates(p.bData), tolerates(p.bMeta));
    if (fs.ok) {
      subvols = names.subvols.map(function (x) { return { name: x[0], used: x[1] }; });
      if (p.bSnap) snaps.push({ subvol: subvols[0].name, name: subvols[0].name + '_snap1', used: Math.max(1, Math.round(subvols[0].used * 0.05)) });
      usable = Math.floor(raw * efficiency(p.bData, n));
      used = subvols.reduce(function (a, s) { return a + s.used; }, 0) + snaps.reduce(function (a, s) { return a + s.used; }, 0);
      // The original's bStats: unavailable beats degraded, and degraded beats the RAID5/6 warning.
      health = nFail > tol ? 'unavailable' : nFail > 0 ? 'degraded'
        : parityProfile(p.bData) || parityProfile(p.bMeta) ? 'warning' : 'online';
      // Every fourth chunk is metadata (the original's placement view), the others data.
      for (var r = 0; r < ROWS; r++) {
        var meta = r % 4 === 0;
        var pr = meta ? p.bMeta : p.bData;
        var cells = chunkCells(pr, n, r);
        var hit = {};
        cells.forEach(function (c) { c.failed = devices[c.device].failed; if (c.failed) hit[c.device] = true; });
        var f = Object.keys(hit).length;
        chunks.push({ index: r, meta: meta, profile: pr, cells: cells, state: !f ? 'ok' : f <= tolerates(pr) ? 'degraded' : 'lost' });
      }
    }

    var paths = devices.map(function (d) { return d.name; }).join(' ');
    var cmds = [{ cmd: 'mkfs.btrfs -L ' + names.fs + ' -d ' + p.bData + ' -m ' + p.bMeta + ' ' + paths, failed: !fs.ok }];
    if (fs.ok) {
      cmds.push({ cmd: 'mount ' + devices[0].name + ' /mnt' });
      subvols.forEach(function (s) { cmds.push({ cmd: 'btrfs subvolume create /mnt/' + s.name }); });
      snaps.forEach(function (s) { cmds.push({ cmd: 'btrfs subvolume snapshot -r /mnt/' + s.subvol + ' /mnt/.snapshots/' + s.name }); });
      devices.forEach(function (d) { if (d.failed) cmds.push({ note: 'fail', device: d.name }); });
      cmds.push({ cmd: 'btrfs device stats /mnt' });
    }

    return {
      fs: fs,
      devices: devices,
      subvols: subvols,
      snaps: snaps,
      chunks: chunks,
      commands: cmds,
      failed: nFail,
      raw: raw,
      usable: usable,
      used: used,
      free: Math.max(0, usable - used),
      tol: tol,
      health: health
    };
  }

  // ── params, presets ──

  var defaults = {
    mode: 'zfs',
    zType: 'mirror', zWidth: 2, zVdevs: 2, zSize: 1000, zMix: false,
    zSpecial: false, zLog: false, zCache: false, zSpare: false, zEncrypt: false, zSnap: false,
    zFailed: 0, zSpread: false,
    bDevices: 2, bSize: 2000, bData: 'raid1', bMeta: 'raid1', bFailed: 0, bSnap: false
  };

  /** Five of the original's six ZFS presets, three of its six Btrfs presets and its comparison, with its numbers.
      The defaults are the original's ZFS mirror and Btrfs RAID1 presets. The page adds the labels. */
  var presets = [
    { id: 'mirror', params: { mode: 'zfs' } },
    { id: 'raidz2', params: { mode: 'zfs', zType: 'raidz2', zWidth: 6, zVdevs: 1, zSize: 2000 } },
    { id: 'special', params: { mode: 'zfs', zType: 'raidz2', zWidth: 6, zVdevs: 1, zSize: 2000, zSpecial: true, zLog: true } },
    { id: 'draid', params: { mode: 'zfs', zType: 'draid2', zWidth: 10, zVdevs: 1, zSize: 1800 } },
    { id: 'badmix', params: { mode: 'zfs', zType: 'raidz2', zWidth: 6, zVdevs: 1, zSize: 1000, zMix: true } },
    { id: 'raid1', params: { mode: 'btrfs' } },
    { id: 'mixed', params: { mode: 'btrfs', bDevices: 3, bSize: 1000, bData: 'single', bMeta: 'raid1' } },
    { id: 'raid56', params: { mode: 'btrfs', bDevices: 5, bSize: 2000, bData: 'raid5', bMeta: 'raid1' } },
    { id: 'compare', params: { mode: 'compare' } }
  ];

  /** Everything the page shows, from the params: both sides, whatever the mode. */
  function initial(p) {
    return { mode: MODES.indexOf(p.mode) >= 0 ? p.mode : 'zfs', z: zfs(p), b: btrfs(p) };
  }

  var logic = {
    Z_TYPES: Z_TYPES,
    B_DATA: B_DATA,
    B_META: B_META,
    MODES: MODES,
    MAX_BDEV: MAX_BDEV,
    MAX_DATA_DISKS: MAX_DATA_DISKS,
    ROWS: ROWS,
    defaults: defaults,
    presets: presets,
    steps: 0,
    parityOf: parityOf,
    minWidth: minWidth,
    maxWidth: maxWidth,
    widthOf: widthOf,
    maxVdevs: maxVdevs,
    profileMin: profileMin,
    efficiency: efficiency,
    tolerates: tolerates,
    sdLetters: sdLetters,
    dataDisks: function (p) { return widthOf(p) * Math.max(1, Math.min(maxVdevs(p), p.zVdevs)) + (p.zMix ? 2 : 0); },
    initial: initial
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
