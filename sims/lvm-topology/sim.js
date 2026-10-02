/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the LVM topology lab: disks become physical volumes (PVs), the PVs one volume group (VG), and logical
   volumes (LVs) are allocated from the VG's physical extents (PEs) as linear, striped, RAID1, RAID5 or a thin pool,
   with LUKS below the PVs or above an LV. An explorer: no steps; the page draws initial(params).
   Adopted from single-page-labs/lvm-topology-lab-v2.html (allocateLinear, allocateStriped, allocateRaid1,
   allocateRaid5, allocateThinPool, the presets and the command translation); see NOTES.md for what changed.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MAX_DISKS = 4;
  var LAYOUTS = ['linear', 'striped', 'raid1', 'raid5', 'thin'];
  var CRYPT = ['none', 'below', 'above'];

  /** /dev/sda, /dev/sdb, … (the original's diskName). */
  function diskName(i) { return '/dev/sd' + 'abcdefghijklmnopqrstuvwxyz'[i % 26]; }
  function shortName(path) { return path.split('/').pop(); }

  /** VG and LV names follow the original's presets, so a preset shows the names its commands used. */
  function namesOf(p) {
    if (p.layout === 'thin') return { vg: 'vg_cloud', lv: 'thinpool', thin: ['vm01', 'vm02'] };
    if (p.crypt === 'below') return { vg: 'vg_secret', lv: 'private' };
    if (p.crypt === 'above') return { vg: 'vg_host', lv: 'secret', lv2: 'public' };
    if (p.layout === 'striped') return { vg: 'vg_fast', lv: 'scratch' };
    if (p.layout === 'raid1') return { vg: 'vg_safe', lv: 'important' };
    if (p.layout === 'raid5') return { vg: 'vg_raid', lv: 'media' };
    return p.disks > 1 ? { vg: 'vg_span', lv: 'archive' } : { vg: 'vg_demo', lv: 'data' };
  }

  /** Smallest number of members a layout needs, and how width is read: stripes, copies or members. */
  function minWidth(layout) { return layout === 'raid5' ? 3 : 2; }
  function usesWidth(layout) { return layout === 'striped' || layout === 'raid1' || layout === 'raid5'; }

  /** Logical extents per stripe row: the size is rounded up to a whole number of rows. */
  function rowWidth(layout, width) {
    if (layout === 'striped') return width;
    if (layout === 'raid5') return Math.max(3, width) - 1;
    return 1;
  }
  function roundUp(size, row) { return Math.ceil(size / row) * row; }

  // ── allocation ──
  // Each allocator reads the free PEs of the VG (disks in order, PEs in order) and returns the placements, or an
  // error; nothing is written until it succeeds, so a failed LV leaves the map as it was.

  function freeByDisk(disks) {
    return disks.map(function (d, di) {
      var free = [];
      d.extents.forEach(function (e, i) { if (!e) free.push(i); });
      return { disk: di, free: free };
    });
  }

  /** Linear: logical extent k on the k-th free PE of the VG, filling the first disk before the next. */
  function allocLinear(disks, size) {
    var free = [];
    freeByDisk(disks).forEach(function (g) { g.free.forEach(function (pe) { free.push({ disk: g.disk, pe: pe }); }); });
    if (free.length < size) return { error: { code: 'noSpace', need: size, free: free.length } };
    var out = [];
    for (var le = 0; le < size; le++) out.push({ disk: free[le].disk, pe: free[le].pe, le: le, role: 'data' });
    return { placed: out };
  }

  /** Striped: logical extent k on lane k mod n, row floor(k / n); the first n PVs that have free PEs. */
  function allocStriped(disks, size, n) {
    var groups = freeByDisk(disks).filter(function (g) { return g.free.length; });
    if (groups.length < n) return { error: { code: 'needPVs', n: n } };
    var rows = size / n, out = [];
    var sel = groups.slice(0, n);
    if (sel.some(function (g) { return g.free.length < rows; })) return { error: { code: 'rowSpace', rows: rows, n: n } };
    for (var le = 0; le < size; le++) {
      var lane = le % n, g = sel[lane];
      out.push({ disk: g.disk, pe: g.free[Math.floor(le / n)], le: le, role: 'stripe', lane: lane });
    }
    return { placed: out };
  }

  /** RAID1: n copies, each whole on its own PV; the first n PVs with at least size free PEs. */
  function allocRaid1(disks, size, n) {
    var groups = freeByDisk(disks).filter(function (g) { return g.free.length >= size; });
    if (groups.length < n) return { error: { code: 'raid1Space', n: n, size: size } };
    var out = [];
    for (var c = 0; c < n; c++) {
      for (var le = 0; le < size; le++) out.push({ disk: groups[c].disk, pe: groups[c].free[le], le: le, role: 'mirror', copy: c });
    }
    return { placed: out };
  }

  /** RAID5: n members, n − 1 data extents and one parity extent per row; parity on member (row mod n). */
  function allocRaid5(disks, size, n) {
    var groups = freeByDisk(disks).filter(function (g) { return g.free.length; });
    if (groups.length < n) return { error: { code: 'needPVs', n: n } };
    var sel = groups.slice(0, n), rows = size / (n - 1), out = [], le = 0;
    if (sel.some(function (g) { return g.free.length < rows; })) return { error: { code: 'rowSpace', rows: rows, n: n } };
    for (var r = 0; r < rows; r++) {
      var parity = r % n;
      for (var lane = 0; lane < n; lane++) {
        var pe = sel[lane].free[r];
        if (lane === parity) out.push({ disk: sel[lane].disk, pe: pe, le: null, role: 'parity', row: r, lane: lane });
        else out.push({ disk: sel[lane].disk, pe: pe, le: le++, role: 'raid', row: r, lane: lane });
      }
    }
    return { placed: out };
  }

  function allocate(disks, lv) {
    if (lv.type === 'striped') return allocStriped(disks, lv.size, lv.width);
    if (lv.type === 'raid1') return allocRaid1(disks, lv.size, lv.width);
    if (lv.type === 'raid5') return allocRaid5(disks, lv.size, lv.width);
    return allocLinear(disks, lv.size); // linear and thin pool
  }

  /** The hidden sub-volumes the original showed with "Show RAID member devices". */
  function membersOf(lv) {
    var out = [];
    for (var i = 0; i < lv.width; i++) {
      out.push({ name: lv.name + (lv.type === 'striped' ? '_stripe_' : '_rimage_') + i, lane: i });
    }
    return out;
  }

  // ── commands (the original's command translation; data, not words) ──

  function lvPath(vg, lv) { return '/dev/' + vg + '/' + lv; }
  function cryptName(name) { return 'crypt_' + name; }

  function lvCreateCommand(vg, lv) {
    if (lv.type === 'linear') return 'lvcreate -l ' + lv.requested + ' -n ' + lv.name + ' ' + vg;
    if (lv.type === 'striped') return 'lvcreate -l ' + lv.requested + ' -i ' + lv.width + ' -n ' + lv.name + ' ' + vg;
    if (lv.type === 'raid1') return 'lvcreate --type raid1 -l ' + lv.requested + ' -m ' + (lv.width - 1) + ' -n ' + lv.name + ' ' + vg;
    if (lv.type === 'raid5') return 'lvcreate --type raid5 -l ' + lv.requested + ' -i ' + (lv.width - 1) + ' -n ' + lv.name + ' ' + vg;
    return 'lvcreate --type thin-pool -l ' + lv.requested + ' -n ' + lv.name + ' ' + vg;
  }

  // ── params, presets ──

  var defaults = {
    layout: 'linear', crypt: 'none', disks: 1, diskPE: 32, size: 16, width: 2, lv2: 12, virt: 40, peMiB: 4
  };

  /** The original's eight teaching presets (keys 1–8), with its numbers. The page adds the labels. */
  var presets = [
    { id: 'basic', params: { layout: 'linear', crypt: 'none', disks: 1, diskPE: 32, size: 16 } },
    { id: 'span', params: { layout: 'linear', crypt: 'none', disks: 2, diskPE: 24, size: 36 } },
    { id: 'striped', params: { layout: 'striped', crypt: 'none', disks: 3, diskPE: 24, size: 36, width: 3 } },
    { id: 'raid1', params: { layout: 'raid1', crypt: 'none', disks: 2, diskPE: 24, size: 18, width: 2 } },
    { id: 'raid5', params: { layout: 'raid5', crypt: 'none', disks: 4, diskPE: 24, size: 36, width: 4 } },
    { id: 'luks-below', params: { layout: 'linear', crypt: 'below', disks: 2, diskPE: 28, size: 32 } },
    { id: 'luks-above', params: { layout: 'linear', crypt: 'above', disks: 1, diskPE: 40, size: 16, lv2: 12 } },
    { id: 'thin', params: { layout: 'thin', crypt: 'none', disks: 1, diskPE: 48, size: 32, virt: 40 } }
  ];

  /** Everything the page shows, from the params. */
  function initial(p) {
    var names = namesOf(p);
    var nDisks = Math.max(1, Math.min(MAX_DISKS, p.disks));
    var disks = [];
    for (var i = 0; i < nDisks; i++) {
      var name = diskName(i);
      var below = p.crypt === 'below';
      disks.push({
        name: name,
        luks: below ? cryptName(shortName(name)) : null,
        pv: below ? '/dev/mapper/' + cryptName(shortName(name)) : name,
        extents: new Array(p.diskPE).fill(null)
      });
    }

    var lvs = [];
    // LUKS above: the original's second, unencrypted LV comes first ("public", then "secret").
    if (p.crypt === 'above' && p.layout !== 'thin' && p.lv2 > 0) {
      lvs.push({ name: names.lv2, type: 'linear', requested: p.lv2, size: p.lv2, width: 1, crypt: false });
    }
    var type = p.layout === 'thin' ? 'thinpool' : p.layout;
    var width = usesWidth(type) ? Math.max(minWidth(type), p.width) : 1;
    var row = rowWidth(type, width);
    lvs.push({ name: names.lv, type: type, requested: p.size, size: roundUp(p.size, row), width: width,
      crypt: p.crypt === 'above' && type !== 'thinpool' });

    lvs.forEach(function (lv, k) {
      lv.index = k;
      var r = allocate(disks, lv);
      if (r.error) {
        lv.ok = false;
        lv.error = r.error;
        lv.pe = 0;
        return;
      }
      lv.ok = true;
      lv.pe = r.placed.length;
      lv.disks = [];
      r.placed.forEach(function (x) {
        var a = { lv: k, le: x.le, role: x.role };
        if (x.copy != null) a.copy = x.copy;
        if (x.lane != null) a.lane = x.lane;
        if (x.row != null) a.row = x.row;
        disks[x.disk].extents[x.pe] = a;
        if (lv.disks.indexOf(x.disk) < 0) lv.disks.push(x.disk);
      });
      lv.disks.sort(function (a, b) { return a - b; });
      if (usesWidth(lv.type)) lv.members = membersOf(lv);
    });

    // Thin LVs: virtual size only; they take blocks from the pool on demand, so no PEs now.
    var main = lvs[lvs.length - 1];
    var thin = [];
    if (type === 'thinpool' && main.ok) {
      names.thin.forEach(function (n, k) {
        thin.push({ name: n, virt: p.virt, crypt: p.crypt === 'above' && k === 0 });
      });
    }

    // Commands, in the order a lecturer would type them.
    var cmds = [];
    var push = function (c, failed) { cmds.push(failed ? { cmd: c, failed: true } : { cmd: c }); };
    if (p.crypt === 'below') {
      disks.forEach(function (d) {
        push('cryptsetup luksFormat ' + d.name);
        push('cryptsetup open ' + d.name + ' ' + d.luks);
      });
    }
    var pvs = disks.map(function (d) { return d.pv; }).join(' ');
    push('pvcreate ' + pvs);
    push('vgcreate ' + names.vg + ' ' + pvs);
    lvs.forEach(function (lv) {
      push(lvCreateCommand(names.vg, lv), !lv.ok);
      if (!lv.ok || lv.type === 'thinpool') return;
      var dev = lvPath(names.vg, lv.name);
      if (lv.crypt) {
        push('cryptsetup luksFormat ' + dev);
        push('cryptsetup open ' + dev + ' ' + cryptName(lv.name));
        dev = '/dev/mapper/' + cryptName(lv.name);
      }
      push('mkfs.ext4 ' + dev);
    });
    thin.forEach(function (t) {
      push('lvcreate -V ' + (t.virt * p.peMiB) + 'M -T ' + names.vg + '/' + main.name + ' -n ' + t.name);
      var dev = lvPath(names.vg, t.name);
      if (t.crypt) {
        push('cryptsetup luksFormat ' + dev);
        push('cryptsetup open ' + dev + ' ' + cryptName(t.name));
        dev = '/dev/mapper/' + cryptName(t.name);
      }
      push('mkfs.ext4 ' + dev);
    });

    // The original's four counters. Logical extents count what a filesystem sees: an allocated LV's size, a thin
    // LV's virtual size; a thin pool is not counted (its thin LVs are).
    var raw = nDisks * p.diskPE;
    var allocated = 0;
    disks.forEach(function (d) { d.extents.forEach(function (e) { if (e) allocated++; }); });
    var logical = 0;
    lvs.forEach(function (lv) { if (lv.ok && lv.type !== 'thinpool') logical += lv.size; });
    thin.forEach(function (t) { logical += t.virt; });

    return {
      vg: names.vg,
      peMiB: p.peMiB,
      crypt: p.crypt,
      layout: p.layout,
      disks: disks,
      lvs: lvs,
      thin: thin,
      commands: cmds,
      raw: raw,
      allocated: allocated,
      free: raw - allocated,
      logical: logical,
      // physical / logical: 2 for a two-way mirror, 4/3 for RAID5 on four PVs, under 1 when thin LVs overcommit.
      ratio: logical > 0 ? allocated / logical : null
    };
  }

  var logic = {
    MAX_DISKS: MAX_DISKS,
    LAYOUTS: LAYOUTS,
    CRYPT: CRYPT,
    defaults: defaults,
    presets: presets,
    steps: 0,
    diskName: diskName,
    minWidth: minWidth,
    usesWidth: usesWidth,
    rowWidth: rowWidth,
    initial: initial
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
