// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the ZFS & Btrfs topology model (sim.js). Run: node --test sims/zfs-btrfs-lab/
// The model's rules first (tie-breaks first of all), then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => kit.stateAt(logic, P(over), 0);
const preset = (id) => at(logic.presets.find((x) => x.id === id).params);
const failedNames = (z) => z.disks.filter((d) => d.failed).map((d) => d.name);

// ── tie-breaks ──

test('failures fill the first data vdev first; spread takes the first disk of every vdev first', () => {
  const same = at({ zFailed: 2 }).z;
  assert.deepEqual(failedNames(same), ['/dev/sdb', '/dev/sdc']);
  assert.deepEqual(same.vdevs.map((v) => v.state), ['FAULTED', 'ONLINE']);
  const spread = at({ zFailed: 2, zSpread: true }).z;
  assert.deepEqual(failedNames(spread), ['/dev/sdb', '/dev/sdd']);
  assert.deepEqual(spread.vdevs.map((v) => v.state), ['DEGRADED', 'DEGRADED']);
  // Spread with vdevs of different widths: the shorter one runs out first.
  // Mirror sdb sdc, then RAIDZ2 sdd–sdg: sdb, sdd, then sdc (the mirror's second disk) before sdf.
  const mix = at({ zType: 'raidz2', zWidth: 4, zVdevs: 1, zMix: true, zFailed: 3, zSpread: true }).z;
  assert.deepEqual(failedNames(mix), ['/dev/sdb', '/dev/sdc', '/dev/sdd']);
  assert.deepEqual(mix.vdevs.map((v) => v.state), ['FAULTED', 'DEGRADED']);
});

test('failures hit data vdevs only, never special, log, cache or spare, and are clamped to the data disks', () => {
  const z = at({ zType: 'mirror', zVdevs: 1, zSpecial: true, zLog: true, zCache: true, zSpare: true, zFailed: 99 }).z;
  assert.equal(z.failed, 2);
  assert.ok(z.disks.filter((d) => d.failed).every((d) => z.vdevs[d.vdev].role === 'data'));
});

test('pool health: FAULTED beats DEGRADED', () => {
  // Three mirrors, three failures: the first mirror loses both disks, the second one disk.
  const z = at({ zVdevs: 3, zFailed: 3 }).z;
  assert.deepEqual(z.vdevs.map((v) => v.state), ['FAULTED', 'DEGRADED', 'ONLINE']);
  assert.equal(z.health, 'FAULTED');
});

test('Btrfs health: unavailable beats degraded, and degraded beats the RAID5/6 warning', () => {
  assert.equal(preset('raid56').b.health, 'warning');
  assert.equal(at({ mode: 'btrfs', bDevices: 5, bData: 'raid5', bMeta: 'raid1', bFailed: 1 }).b.health, 'degraded');
  assert.equal(at({ mode: 'btrfs', bDevices: 5, bData: 'raid5', bMeta: 'raid1', bFailed: 2 }).b.health, 'unavailable');
});

test('Btrfs: the first devices fail first, clamped to the devices there are', () => {
  const b = at({ bDevices: 3, bFailed: 1 }).b;
  assert.deepEqual(b.devices.map((d) => d.failed), [true, false, false]);
  assert.equal(at({ bDevices: 2, bFailed: 9 }).b.failed, 2);
});

test('records go round-robin over the data vdevs, the mixed-in mirror first', () => {
  const z = preset('badmix').z;
  assert.deepEqual(z.records.map((r) => r.vdev), [0, 1, 0, 1, 0, 1]);
  assert.equal(z.vdevs[0].type, 'mirror');
  assert.equal(z.vdevs[1].type, 'raidz2');
});

test('RAIDZ parity moves one disk per record', () => {
  const z = at({ zType: 'raidz2', zWidth: 4, zVdevs: 1 }).z;
  const roles = z.records.map((r) => r.cells.map((c) => c.role[0]).join(''));
  assert.deepEqual(roles.slice(0, 4), ['ppdd', 'pddp', 'ddpp', 'dppd']);
});

test('the widest profile decides the device minimum; too few devices make no filesystem', () => {
  const b = at({ bDevices: 2, bData: 'single', bMeta: 'raid1c3' }).b;
  assert.equal(b.fs.ok, false);
  assert.deepEqual(b.fs.error, { code: 'tooFew', need: 3, have: 2 });
  assert.equal(b.usable, 0);
  assert.equal(b.health, 'none');
  assert.deepEqual(b.chunks, []);
  assert.ok(b.commands[0].failed);
  assert.equal(b.commands.length, 1);
  assert.equal(at({ bDevices: 3, bData: 'single', bMeta: 'raid1c3' }).b.fs.ok, true);
});

test('vdev width is clamped per type, and data vdevs to 24 data disks', () => {
  assert.equal(logic.widthOf(P({ zType: 'raidz2', zWidth: 2 })), 4);
  assert.equal(logic.widthOf(P({ zType: 'draid1', zWidth: 3 })), 6);
  assert.equal(logic.widthOf(P({ zType: 'single', zWidth: 5 })), 1);
  assert.equal(logic.widthOf(P({ zType: 'mirror', zWidth: 9 })), 4);
  assert.equal(logic.maxVdevs(P({ zType: 'draid2', zWidth: 10 })), 2);
  assert.equal(at({ zType: 'draid2', zWidth: 10, zVdevs: 3 }).z.dataVdevs, 2);
  assert.equal(logic.dataDisks(P({ zType: 'raidz2', zWidth: 6, zVdevs: 1, zMix: true })), 8);
});

test('SCSI names run sdb … sdz, then sdaa, so 26 disks never repeat a name', () => {
  assert.deepEqual([1, 25, 26, 27, 52].map(logic.sdLetters), ['b', 'z', 'aa', 'ab', 'ba']);
  const z = at({ zType: 'raidz3', zWidth: 8, zVdevs: 3, zMix: true }).z;
  assert.equal(z.disks.length, 26);
  assert.equal(new Set(z.disks.map((d) => d.name)).size, 26);
  assert.equal(z.disks[25].name, '/dev/sdaa');
});

// ── ZFS rules ──

test('capacity: mirror keeps one disk, RAIDZ and dRAID (n − parity) disks, single one disk', () => {
  assert.equal(at({ zType: 'mirror', zWidth: 3, zVdevs: 1, zSize: 1000 }).z.usable, 1000);
  assert.equal(at({ zType: 'raidz1', zWidth: 5, zVdevs: 1, zSize: 1000 }).z.usable, 4000);
  assert.equal(at({ zType: 'raidz3', zWidth: 8, zVdevs: 1, zSize: 1000 }).z.usable, 5000);
  assert.equal(at({ zType: 'draid2', zWidth: 10, zVdevs: 1, zSize: 1000 }).z.usable, 8000);
  assert.equal(at({ zType: 'single', zVdevs: 3, zSize: 1000 }).z.usable, 3000);
});

test('special, log, cache and spare add raw disks but no usable capacity', () => {
  const plain = at({ zType: 'raidz2', zWidth: 6, zVdevs: 1, zSize: 2000 }).z;
  const extra = at({ zType: 'raidz2', zWidth: 6, zVdevs: 1, zSize: 2000, zSpecial: true, zLog: true, zCache: true, zSpare: true }).z;
  assert.equal(extra.usable, plain.usable);
  assert.equal(extra.raw, plain.raw + 2 * 400 + 2 * 100 + 400 + 2000);
  assert.equal(extra.dataVdevs, 1);
  assert.ok(extra.vdevs.filter((v) => v.role !== 'data').every((v) => v.cap.usable === 0 || v.role === 'special'));
  assert.equal(extra.vdevs.find((v) => v.role === 'spare').cap.usable, 0);
});

test('failure tolerance: a mirror survives all but one disk, RAIDZ its parity, a single disk nothing', () => {
  const tol = (over) => at(over).z.vdevs[0].cap.faults;
  assert.equal(tol({ zType: 'mirror', zWidth: 3, zVdevs: 1 }), 2);
  assert.equal(tol({ zType: 'raidz2', zWidth: 6, zVdevs: 1 }), 2);
  assert.equal(tol({ zType: 'draid1', zWidth: 6, zVdevs: 1 }), 1);
  assert.equal(tol({ zType: 'single', zVdevs: 1 }), 0);
  assert.equal(at({ zType: 'raidz2', zWidth: 6, zVdevs: 1, zFailed: 2 }).z.health, 'DEGRADED');
  assert.equal(at({ zType: 'raidz2', zWidth: 6, zVdevs: 1, zFailed: 3 }).z.health, 'FAULTED');
  assert.equal(at({ zType: 'single', zVdevs: 3, zFailed: 1 }).z.health, 'FAULTED', 'one single disk loses the pool');
});

test('a record on a faulted vdev is lost, on a degraded one readable', () => {
  const z = at({ zFailed: 2 }).z;
  assert.deepEqual(z.records.map((r) => r.state), ['FAULTED', 'ONLINE', 'FAULTED', 'ONLINE', 'FAULTED', 'ONLINE']);
  assert.ok(z.records[0].cells.every((c) => c.failed));
});

test('datasets and snapshots: the original\'s names and numbers; a snapshot holds 8 % of its dataset', () => {
  const z = preset('mirror').z;
  assert.equal(z.pool, 'tank');
  assert.deepEqual(z.datasets.map((d) => [d.name, d.type, d.quota, d.used]), [['homes', 'filesystem', 500, 120], ['vmstore', 'zvol', 300, 80]]);
  const s = at({ zSnap: true }).z;
  assert.deepEqual(s.snaps, [{ dataset: 'homes', name: 'snap1', used: 10 }]);
  assert.equal(s.used, 210);
  const e = at({ zEncrypt: true }).z;
  assert.ok(e.datasets.find((d) => d.name === 'research').encryption);
  assert.ok(e.commands.some((c) => c.cmd.includes('-o encryption=on') && c.cmd.endsWith('tank/research')));
});

test('ZFS commands: create with the first vdev, add the others with their class, offline the failed disks', () => {
  const z = preset('special').z;
  assert.deepEqual(z.commands.map((c) => c.cmd), [
    'zpool create tank raidz2 sdb sdc sdd sde sdf sdg',
    'zpool add tank special mirror nvme0n1 nvme1n1',
    'zpool add tank log mirror nvme2n1 nvme3n1',
    'zfs create -o compression=lz4 -o quota=1000G tank/smallfiles',
    'zpool status tank'
  ]);
  const m = at({ zFailed: 1 }).z.commands.map((c) => c.cmd);
  assert.equal(m[0], 'zpool create tank mirror sdb sdc');
  assert.equal(m[1], 'zpool add tank mirror sdd sde');
  assert.ok(m.includes('zfs create -V 300G -o compression=zstd tank/vmstore'));
  assert.ok(m.includes('zpool offline tank sdb'));
});

// ── Btrfs rules ──

test('usable space: raw × the data profile\'s share, rounded down', () => {
  const u = (data, n) => at({ bDevices: n, bSize: 1000, bData: data, bMeta: 'raid1c4' === data ? 'raid1c4' : 'raid1' }).b.usable;
  assert.equal(u('single', 3), 3000);
  assert.equal(u('raid0', 3), 3000);
  assert.equal(u('raid1', 3), 1500);
  assert.equal(u('raid1c3', 3), 1000);
  assert.equal(u('raid1c4', 4), 1000);
  assert.equal(u('raid10', 4), 2000);
  assert.equal(u('raid5', 3), 2000);
  assert.equal(u('raid6', 5), 3000);
  assert.equal(at({ bDevices: 1, bSize: 1000, bData: 'dup', bMeta: 'dup' }).b.usable, 500);
});

test('tolerance: the weaker of the data and metadata profiles; dup survives no lost device', () => {
  assert.equal(at({ bDevices: 3, bData: 'single', bMeta: 'raid1' }).b.tol, 0);
  assert.equal(at({ bDevices: 3, bData: 'raid1c3', bMeta: 'raid1c3' }).b.tol, 2);
  assert.equal(at({ bDevices: 4, bData: 'raid6', bMeta: 'raid1c3' }).b.tol, 2);
  assert.equal(at({ bDevices: 3, bData: 'raid1c3', bMeta: 'raid1' }).b.tol, 1, 'metadata can be the weaker one');
  assert.equal(logic.tolerates('dup'), 0);
  assert.equal(at({ bDevices: 1, bData: 'dup', bMeta: 'dup', bFailed: 1 }).b.health, 'unavailable');
  assert.equal(at({ bDevices: 3, bData: 'raid1c3', bMeta: 'raid1c3', bFailed: 2 }).b.health, 'degraded');
});

test('chunks: every fourth is metadata; a chunk with more failed devices than its profile survives is lost', () => {
  const b = at({ mode: 'btrfs', bDevices: 3, bSize: 1000, bData: 'single', bMeta: 'raid1', bFailed: 1 }).b;
  assert.deepEqual(b.chunks.map((c) => c.meta), [true, false, false, false, true, false]);
  // single data on device r % 3: chunks 3 (sdb) is lost; raid1 metadata on 2 devices survives one failure.
  assert.deepEqual(b.chunks.map((c) => c.state), ['degraded', 'ok', 'ok', 'lost', 'ok', 'ok']);
  // dup puts both copies on one device.
  const d = at({ bDevices: 2, bData: 'dup', bMeta: 'dup' }).b.chunks[1];
  assert.equal(new Set(d.cells.map((c) => c.device)).size, 1);
  assert.equal(d.cells.length, 2);
  // raid1c3 on 4 devices: three copies, rotating.
  assert.deepEqual(at({ bDevices: 4, bData: 'raid1c3', bMeta: 'raid1c3' }).b.chunks[1].cells.map((c) => c.device), [1, 2, 3]);
});

test('Btrfs commands: mkfs with both profiles, then the subvolumes, a note per failed device', () => {
  const b = at({ bFailed: 1, bSnap: true }).b;
  assert.deepEqual(b.commands.map((c) => c.cmd || c.note), [
    'mkfs.btrfs -L bpool -d raid1 -m raid1 /dev/sdb /dev/sdc',
    'mount /dev/sdb /mnt',
    'btrfs subvolume create /mnt/@data',
    'btrfs subvolume snapshot -r /mnt/@data /mnt/.snapshots/@data_snap1',
    'fail',
    'btrfs device stats /mnt'
  ]);
  assert.equal(b.snaps[0].used, 15, '5 % of the subvolume');
});

test('preset numbers are the original\'s', () => {
  const z = { mirror: [4000, 2000, 200, 'tank'], raidz2: [12000, 8000, 900, 'archive'], special: [13000, 8000, 180, 'tank'],
    draid: [18000, 14400, 2100, 'bulk'], badmix: [8000, 5000, 300, 'lesson'] };
  for (const [id, [raw, usable, used, pool]] of Object.entries(z)) {
    const s = preset(id).z;
    assert.deepEqual([s.raw, s.usable, s.used, s.pool, s.health], [raw, usable, used, pool, 'ONLINE'], id);
  }
  const b = { raid1: [4000, 2000, 300, 'bpool', 'online'], mixed: [3000, 3000, 280, 'mixed', 'online'],
    raid56: [10000, 8000, 1500, 'parity-demo', 'warning'] };
  for (const [id, [raw, usable, used, name, health]] of Object.entries(b)) {
    const s = preset(id).b;
    assert.deepEqual([s.raw, s.usable, s.used, s.fs.name, s.health], [raw, usable, used, name, health], id);
  }
  assert.equal(preset('compare').mode, 'compare');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and for a lost pool and a missing filesystem', () => {
  for (const pr of logic.presets) {
    const s = at(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
  const f = at({ zFailed: 4, bDevices: 1, bMeta: 'raid6' });
  assert.deepEqual(JSON.parse(JSON.stringify(f)), f);
});

test('deterministic, and initial does not mutate its params', () => {
  const p = P({ zType: 'raidz2', zWidth: 6, zMix: true, zSpecial: true, zSnap: true, zFailed: 3, zSpread: true, bDevices: 5, bFailed: 2 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  const glossary = require('../../kit/glossary.js');
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every option has a label in both languages', () => {
  for (const v of logic.Z_TYPES.concat(logic.B_DATA, logic.B_META)) {
    assert.ok(strings.hr['opt_' + v] && strings.en['opt_' + v], v);
  }
});

test('every preset is valid for the model and has a label in the page', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  const ids = logic.presets.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length, 'unique ids');
  assert.ok(ids.length <= 9, 'keys 1–9');
  for (const pr of logic.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k} is a model param`);
    assert.ok(logic.MODES.includes(pr.params.mode), `${pr.id}: mode`);
    assert.ok(new RegExp(`\\b${pr.id}:`).test(html), `${pr.id}: label in index.html`);
  }
});
