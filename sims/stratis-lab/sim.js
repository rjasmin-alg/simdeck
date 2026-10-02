/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the Stratis topology lab: block devices reach the host over a local bus or a network transport (iSCSI,
   Fibre Channel, NVMe/TCP), several paths to one LUN become one device through multipath, and Stratis builds a
   pool from the final block devices, with optional encryption per member, a cache tier, a thin pool inside, and a
   thinly provisioned XFS filesystem with an optional snapshot. An explorer: no steps; the page draws
   initial(params).
   Adopted from single-page-labs/stratis-topology-lab.html (kindInfo, the eligibility and online rules, poolUsed,
   the overprovisioning check, the presets and the command translation); see NOTES.md for what changed.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MAX_DEVICES = 4;
  /** Metadata the pool keeps for itself, in GiB: the original's teaching figure (poolUsed = 1 + data). */
  var META_GIB = 1;

  /** Device kinds, from the original's kindInfo. `remote` kinds come over a network or fabric and may have
      several paths; `layered` kinds are block devices some other layer already made. */
  var KINDS = {
    'local-hdd': { protocol: 'SATA' },
    'local-ssd': { protocol: 'SAS/SATA' },
    'local-nvme': { protocol: 'PCIe/NVMe' },
    iscsi: { protocol: 'iSCSI', remote: true },
    fc: { protocol: 'Fibre Channel', remote: true },
    nvmetcp: { protocol: 'NVMe/TCP', remote: true },
    mdraid: { protocol: 'md RAID', layered: true },
    lvmlv: { protocol: 'LVM LV', layered: true },
    luks: { protocol: 'LUKS', layered: true }
  };
  /** `mixed` is not a device kind: device i takes MIXED[i] (the original's mixed preset: SSD, iSCSI, FC). */
  var MIXED = ['local-ssd', 'iscsi', 'fc', 'nvmetcp'];
  var KIND_PARAMS = Object.keys(KINDS).concat(['mixed']);
  var ENCRYPTION = ['none', 'keyring', 'tang', 'tpm2'];
  var PATHS = [1, 2, 4];

  function isRemote(kind) { return !!(KINDS[kind] && KINDS[kind].remote); }
  /** Whether the param set has a network device at all (the page shows the path controls only then). */
  function hasRemote(p) {
    if (p.kind === 'mixed') return p.devices > 1;
    return isRemote(p.kind);
  }
  function kindOf(p, i) { return p.kind === 'mixed' ? MIXED[i % MIXED.length] : p.kind; }

  // ── names (data, not words) ──

  var LETTERS = 'bcdefghijklmnopqrstuvwxyz';
  /** Kernel names: SCSI disks take the next free sd letter (one per path), NVMe the next controller number;
      the layered kinds keep the original's names. /dev/sda is the system disk, so data disks start at sdb. */
  function namer() {
    var sd = 0, nvme = 0, md = 0, lv = 0, crypt = 0, mpath = 0;
    return {
      sd: function () { return '/dev/sd' + LETTERS[sd++ % LETTERS.length]; },
      nvme: function () { return nvme++; },
      md: function () { return '/dev/md' + md++; },
      lv: function () { return '/dev/vg_source/lv' + lv++; },
      crypt: function () { return '/dev/mapper/crypt' + crypt++; },
      mpath: function () { return '/dev/mapper/mpath' + 'abcdefghijklmnopqrstuvwxyz'[mpath++ % 26]; }
    };
  }

  /** Pool and filesystem names follow the original's presets, so a preset shows the names its commands used. */
  function namesOf(p) {
    if (p.snapshot) return { pool: 'pool_snap', fs: 'home' };
    if (p.cache > 0) return { pool: 'pool_cached', fs: 'media' };
    if (p.encryption !== 'none') return { pool: 'pool_secret', fs: 'securedata' };
    if (p.kind === 'mixed') return { pool: 'pool_mixed', fs: 'archive' };
    if (p.kind === 'iscsi') return { pool: 'pool_iscsi', fs: 'vmdata' };
    if (p.kind === 'fc') return { pool: 'pool_fc', fs: 'database' };
    if (p.kind === 'nvmetcp' || p.kind === 'local-nvme') return { pool: 'pool_nvme', fs: 'analytics' };
    return { pool: 'pool_local', fs: 'projects' };
  }

  // ── devices and paths ──

  /** One storage device as the host sees it: its paths, the kernel block devices they make, and the device
      Stratis would take (`hostPath`). */
  function makeDevice(p, i, kind, nm, failFirst) {
    var info = KINDS[kind];
    var d = { index: i, kind: kind, size: p.devSize, remote: !!info.remote, paths: [], blocks: [], multipath: false };
    if (info.remote) {
      var n = PATHS.indexOf(p.paths) >= 0 ? p.paths : 1;
      var down = failFirst ? Math.max(0, Math.min(n, p.down)) : 0;
      d.multipath = n > 1 && !!p.multipath;
      var ctrl = kind === 'nvmetcp' ? nm.nvme() : null;
      for (var k = 0; k < n; k++) {
        // The last `down` paths fail, so path 1 stays up longest (the original toggled any path).
        var up = k < n - down;
        // Each path is its own kernel block device: a SCSI disk per iSCSI session or FC path. NVMe/TCP with
        // multipath: a hidden controller path of one namespace; without it, a namespace per controller.
        var block = kind !== 'nvmetcp' ? nm.sd()
          : d.multipath ? '/dev/nvme' + ctrl + 'c' + k + 'n1' : '/dev/nvme' + (k === 0 ? ctrl : nm.nvme()) + 'n1';
        d.paths.push({ index: k, up: up, block: block });
        d.blocks.push(block);
      }
      if (d.multipath) d.hostPath = kind === 'nvmetcp' ? '/dev/nvme' + ctrl + 'n1' : nm.mpath();
      else d.hostPath = d.blocks[0];
    } else {
      if (kind === 'local-nvme') d.hostPath = '/dev/nvme' + nm.nvme() + 'n1';
      else if (kind === 'mdraid') d.hostPath = nm.md();
      else if (kind === 'lvmlv') d.hostPath = nm.lv();
      else if (kind === 'luks') d.hostPath = nm.crypt();
      else d.hostPath = nm.sd();
      d.blocks = [d.hostPath];
    }
    d.upPaths = d.paths.filter(function (x) { return x.up; }).length;
    d.online = deviceOnline(d);
    d.duplicate = duplicatePaths(d);
    d.eligible = d.online && !d.duplicate;
    return d;
  }

  /** The original's deviceOnline: a local device is always online; a network device while one path is up. */
  function deviceOnline(d) { return d.paths.length === 0 || d.paths.some(function (x) { return x.up; }); }
  /** Several paths without multipath: the same LUN shows up as several block devices (the original's
      "duplicate path risk"), so Stratis must not take it. */
  function duplicatePaths(d) { return d.remote && d.paths.length > 1 && !d.multipath; }

  // ── commands (the original's command translation, without the transport tools; data, not words) ──

  function poolCreate(name, enc, noOver, paths) {
    var opt = noOver ? ' --no-overprovision' : '';
    if (enc === 'keyring') return 'stratis pool create --key-desc ' + name + '-key' + opt + ' ' + name + ' ' + paths;
    if (enc === 'tang') {
      return 'stratis pool create --clevis tang --tang-url http://tang.example:7500 --thumbprint THUMBPRINT' + opt +
        ' ' + name + ' ' + paths;
    }
    if (enc === 'tpm2') return 'stratis pool create --clevis tpm2' + opt + ' ' + name + ' ' + paths;
    return 'stratis pool create' + opt + ' ' + name + ' ' + paths;
  }

  // ── params, presets ──

  var defaults = {
    kind: 'local-hdd', devices: 2, devSize: 500, paths: 2, multipath: true, down: 0,
    encryption: 'none', overprov: true, cache: 0, logical: 1200, used: 80, snapshot: false, written: 0
  };

  /** The original's eight teaching presets, with its numbers, and one more: paths without multipath.
      The page adds the labels. */
  var presets = [
    { id: 'local', params: { kind: 'local-hdd', devices: 2, devSize: 500, logical: 1200, used: 80 } },
    { id: 'mixed', params: { kind: 'mixed', devices: 3, devSize: 1000, paths: 2, multipath: true, logical: 5000, used: 700 } },
    { id: 'iscsi', params: { kind: 'iscsi', devices: 1, devSize: 1500, paths: 2, multipath: true, logical: 2500, used: 350 } },
    { id: 'fc', params: { kind: 'fc', devices: 2, devSize: 2000, paths: 4, multipath: true, logical: 3000, used: 900 } },
    { id: 'nvmetcp', params: { kind: 'nvmetcp', devices: 1, devSize: 1200, paths: 2, multipath: true, logical: 1800, used: 420 } },
    { id: 'encrypted', params: { kind: 'iscsi', devices: 2, devSize: 800, paths: 2, multipath: true, encryption: 'tang', logical: 2200, used: 240 } },
    { id: 'cache', params: { kind: 'local-hdd', devices: 2, devSize: 2000, cache: 400, logical: 6000, used: 1300 } },
    { id: 'snapshot', params: { kind: 'local-ssd', devices: 1, devSize: 1000, logical: 1500, used: 220, snapshot: true, written: 80 } },
    { id: 'nompath', params: { kind: 'iscsi', devices: 1, devSize: 1500, paths: 2, multipath: false, logical: 2500, used: 350 } }
  ];

  /** Everything the page shows, from the params. */
  function initial(p) {
    var names = namesOf(p);
    var nm = namer();
    var n = Math.max(1, Math.min(MAX_DEVICES, p.devices));
    var devices = [];
    var failed = false;
    for (var i = 0; i < n; i++) {
      var kind = kindOf(p, i);
      // Failed paths hit the first network device only.
      var first = isRemote(kind) && !failed;
      if (first) failed = true;
      devices.push(makeDevice(p, i, kind, nm, first));
    }
    var cacheDev = null;
    if (p.cache > 0) {
      // The original's cache preset: a local NVMe namespace in the cache tier.
      cacheDev = { index: n, kind: 'local-nvme', size: p.cache, remote: false, paths: [], multipath: false,
        hostPath: '/dev/nvme' + nm.nvme() + 'n1', upPaths: 0, online: true, duplicate: false, eligible: true, cache: true };
      cacheDev.blocks = [cacheDev.hostPath];
    }

    var noOver = !p.overprov;
    var capacity = devices.reduce(function (a, d) { return a + d.size; }, 0);
    var raw = capacity + (cacheDev ? cacheDev.size : 0);

    // Pool: no data device may appear twice (paths without multipath; the original refused the whole selection).
    // Failed paths do not stop the pool from existing: they take a member away afterwards (the original's
    // "Fail" button on a pool member), so the pool is then created but not online.
    var dup = devices.filter(function (d) { return d.duplicate; });
    var pool = { name: names.pool, encryption: p.encryption, noOver: noOver, capacity: capacity,
      cache: cacheDev ? cacheDev.size : 0, ok: dup.length === 0 };
    if (!pool.ok) pool.error = { code: 'duplicate', device: dup[0].index, paths: dup[0].paths.length };

    // Filesystem: the original's createFS checks, overprovisioning first, then physical space.
    var fs = null, snap = null;
    if (pool.ok) {
      var used = Math.max(0, Math.min(p.used, p.logical));
      fs = { name: names.fs, logical: p.logical, used: used, mount: '/srv/' + names.fs, ok: true };
      if (noOver && p.logical > capacity) fs.error = { code: 'noOver', logical: p.logical, capacity: capacity };
      else if (META_GIB + used > capacity) fs.error = { code: 'noSpace', used: used, free: capacity - META_GIB };
      if (fs.error) fs.ok = false;
    }
    if (fs && fs.ok && p.snapshot) {
      // A snapshot shares every block with its origin when it is taken. Data rewritten in the origin afterwards
      // goes to new blocks, and the snapshot keeps the old ones: that is the only new physical use. Rewrites are
      // limited to the origin's data and to the pool's free space.
      var room = capacity - META_GIB - fs.used;
      var written = Math.max(0, Math.min(p.written, fs.used, room));
      snap = { name: names.fs + '-snap', origin: names.fs, logical: fs.logical, shared: fs.used - written,
        own: written, requested: p.written, written: written, mount: '/mnt/' + names.fs + '-snap' };
    }

    var physUsed = 0;
    if (pool.ok) physUsed = Math.min(capacity, META_GIB + (fs && fs.ok ? fs.used : 0) + (snap ? snap.own : 0));
    // Logical commitments count filesystems, not snapshots (the original's renderCapacity).
    var logical = fs && fs.ok ? fs.logical : 0;
    pool.used = physUsed;
    pool.online = pool.ok && devices.every(function (d) { return d.online; });

    // Commands, in the order a lecturer would type them. Transport set-up is a note (the page words it),
    // not a tool's command line.
    var cmds = [];
    devices.forEach(function (d) {
      if (d.remote) cmds.push({ note: d.kind, paths: d.paths.length, multipath: d.multipath, device: d.hostPath });
    });
    var memberPaths = devices.map(function (d) { return d.hostPath; }).join(' ');
    if (p.encryption === 'keyring') cmds.push({ cmd: 'stratis key set --capture-key ' + names.pool + '-key' });
    cmds.push({ cmd: poolCreate(names.pool, p.encryption, noOver, memberPaths), failed: !pool.ok });
    if (pool.ok && cacheDev) cmds.push({ cmd: 'stratis pool init-cache ' + names.pool + ' ' + cacheDev.hostPath });
    if (fs) {
      cmds.push({ cmd: 'stratis filesystem create --size ' + fs.logical + 'GiB ' + names.pool + ' ' + fs.name, failed: !fs.ok });
      if (fs.ok) cmds.push({ cmd: 'mount /dev/stratis/' + names.pool + '/' + fs.name + ' ' + fs.mount });
    }
    if (snap) {
      cmds.push({ cmd: 'stratis filesystem snapshot ' + names.pool + ' ' + fs.name + ' ' + snap.name });
      cmds.push({ cmd: 'mount /dev/stratis/' + names.pool + '/' + snap.name + ' ' + snap.mount });
    }

    var activePaths = devices.reduce(function (a, d) { return a + d.upPaths; }, 0);
    return {
      devices: devices,
      cacheDev: cacheDev,
      pool: pool,
      fs: fs,
      snap: snap,
      commands: cmds,
      raw: raw,
      capacity: pool.ok ? capacity : 0,
      used: physUsed,
      logical: logical,
      activePaths: activePaths,
      // logical / physical data tier: over 1 when the filesystem promises more than the pool has.
      ratio: pool.ok && capacity > 0 && logical > 0 ? logical / capacity : null
    };
  }

  var logic = {
    MAX_DEVICES: MAX_DEVICES,
    META_GIB: META_GIB,
    KINDS: KINDS,
    KIND_PARAMS: KIND_PARAMS,
    ENCRYPTION: ENCRYPTION,
    PATHS: PATHS,
    defaults: defaults,
    presets: presets,
    steps: 0,
    isRemote: isRemote,
    hasRemote: hasRemote,
    kindOf: kindOf,
    initial: initial
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
