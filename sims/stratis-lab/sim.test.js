// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the Stratis topology model (sim.js). Run: node --test sims/stratis-lab/
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

// ── tie-breaks ──

test('failed paths hit the first network device only, and its last paths first', () => {
  const s = at({ kind: 'fc', devices: 2, paths: 4, down: 2 });
  assert.deepEqual(s.devices[0].paths.map((x) => x.up), [true, true, false, false]);
  assert.ok(s.devices[1].paths.every((x) => x.up), 'the second LUN keeps all its paths');
  // Mixed: device 1 is a local SSD, so the first network device is device 2.
  const m = at({ kind: 'mixed', devices: 3, paths: 2, down: 2 });
  assert.equal(m.devices[0].online, true);
  assert.equal(m.devices[1].online, false);
  assert.equal(m.devices[2].online, true);
});

test('failed paths are clamped to the paths there are', () => {
  const s = at({ kind: 'iscsi', devices: 1, paths: 2, down: 4 });
  assert.equal(s.devices[0].upPaths, 0);
  assert.equal(s.devices[0].paths.length, 2);
});

test('SCSI names: one sd letter per path, from sdb, in device then path order', () => {
  const s = at({ kind: 'iscsi', devices: 2, paths: 2, multipath: true });
  assert.deepEqual(s.devices.map((d) => d.blocks), [['/dev/sdb', '/dev/sdc'], ['/dev/sdd', '/dev/sde']]);
  assert.deepEqual(s.devices.map((d) => d.hostPath), ['/dev/mapper/mpatha', '/dev/mapper/mpathb']);
});

test('NVMe/TCP: with multipath, controller paths of one namespace; without it, a namespace per controller', () => {
  const joined = at({ kind: 'nvmetcp', devices: 1, paths: 2, multipath: true });
  assert.deepEqual(joined.devices[0].blocks, ['/dev/nvme0c0n1', '/dev/nvme0c1n1']);
  assert.equal(joined.devices[0].hostPath, '/dev/nvme0n1');
  const split = at({ kind: 'nvmetcp', devices: 1, paths: 2, multipath: false });
  assert.deepEqual(split.devices[0].blocks, ['/dev/nvme0n1', '/dev/nvme1n1']);
  const one = at({ kind: 'nvmetcp', devices: 1, paths: 1 });
  assert.deepEqual(one.devices[0].blocks, ['/dev/nvme0n1']);
});

test('the cache device takes the next NVMe number after the data devices', () => {
  assert.equal(at({ kind: 'local-nvme', devices: 2, cache: 400 }).cacheDev.hostPath, '/dev/nvme2n1');
  assert.equal(preset('cache').cacheDev.hostPath, '/dev/nvme0n1');
});

test('overprovisioning off: the logical check comes before the physical one', () => {
  const s = at({ kind: 'local-hdd', devices: 1, devSize: 100, overprov: false, logical: 200, used: 500 });
  assert.equal(s.fs.ok, false);
  assert.equal(s.fs.error.code, 'noOver');
});

// ── rules ──

test('multipath: several paths without it make the same LUN twice, and no pool', () => {
  const s = preset('nompath');
  assert.equal(s.devices[0].duplicate, true);
  assert.equal(s.devices[0].eligible, false);
  assert.equal(s.pool.ok, false);
  assert.equal(s.pool.error.code, 'duplicate');
  assert.equal(s.fs, null);
  assert.equal(s.capacity, 0);
  assert.ok(s.commands.find((c) => c.cmd && c.cmd.startsWith('stratis pool create')).failed);
  // One path is never a duplicate, with or without multipath.
  assert.equal(at({ kind: 'iscsi', paths: 1, multipath: false }).pool.ok, true);
  // Local devices have no paths.
  assert.deepEqual(at({ kind: 'local-ssd' }).devices[0].paths, []);
});

test('a network device is online while one path is up; the pool loses a member when one is not', () => {
  const some = at({ kind: 'fc', devices: 2, paths: 4, down: 3 });
  assert.equal(some.devices[0].online, true);
  assert.equal(some.pool.online, true);
  const none = at({ kind: 'fc', devices: 2, paths: 4, down: 4 });
  assert.equal(none.devices[0].online, false);
  assert.equal(none.pool.ok, true, 'the pool exists');
  assert.equal(none.pool.online, false, 'but a member is missing');
  assert.equal(none.activePaths, 4);
  const single = at({ kind: 'iscsi', paths: 1, down: 1 });
  assert.equal(single.devices[0].online, false);
});

test('the pool data tier is the sum of the data devices; the cache tier adds no capacity', () => {
  const s = preset('cache');
  assert.equal(s.capacity, 4000);
  assert.equal(s.pool.cache, 400);
  assert.equal(s.raw, 4400, 'raw counts every device the host sees');
  assert.ok(s.commands.some((c) => c.cmd === 'stratis pool init-cache pool_cached /dev/nvme0n1'));
});

test('physical use: 1 GiB metadata plus the data written; data written is capped at the logical size', () => {
  const s = preset('local');
  assert.equal(s.used, logic.META_GIB + 80);
  const capped = at({ kind: 'local-hdd', devices: 2, devSize: 2000, logical: 300, used: 1000 });
  assert.equal(capped.fs.used, 300);
});

test('thin provisioning: logical may exceed the pool unless overprovisioning is off', () => {
  const s = preset('local');
  assert.equal(s.logical, 1200);
  assert.equal(s.ratio, 1.2);
  const strict = at({ kind: 'local-hdd', devices: 2, devSize: 500, logical: 1200, overprov: false });
  assert.equal(strict.fs.ok, false);
  assert.deepEqual(strict.fs.error, { code: 'noOver', logical: 1200, capacity: 1000 });
  assert.equal(at({ kind: 'local-hdd', devices: 2, devSize: 500, logical: 1000, overprov: false }).fs.ok, true, 'equal is allowed');
  assert.ok(strict.commands.some((c) => c.cmd && c.cmd.includes('--no-overprovision')));
});

test('data that does not fit the physical space: no filesystem', () => {
  const s = at({ kind: 'local-hdd', devices: 1, devSize: 100, logical: 1000, used: 100 });
  assert.equal(s.fs.ok, false);
  assert.deepEqual(s.fs.error, { code: 'noSpace', used: 100, free: 99 });
  assert.equal(at({ kind: 'local-hdd', devices: 1, devSize: 100, logical: 1000, used: 99 }).fs.ok, true);
});

test('snapshot: shares the origin\'s data; only rewrites after it take new space, capped by data and free space', () => {
  const s = preset('snapshot');
  assert.equal(s.snap.shared, 140);
  assert.equal(s.snap.own, 80);
  assert.equal(s.used, logic.META_GIB + 220 + 80);
  assert.equal(s.logical, 1500, 'a snapshot is not a logical commitment');
  // Rewrites cannot exceed the origin's data.
  assert.equal(at({ kind: 'local-ssd', devices: 1, devSize: 1000, used: 50, snapshot: true, written: 200 }).snap.own, 50);
  // Nor the pool's free space: 100 GiB pool, 1 metadata, 60 data → 39 free.
  const tight = at({ kind: 'local-ssd', devices: 1, devSize: 100, logical: 100, used: 60, snapshot: true, written: 60 });
  assert.equal(tight.snap.own, 39);
  assert.equal(tight.used, 100);
  assert.equal(at({ snapshot: false, written: 80 }).snap, null);
});

test('encryption: the keyring needs a key first; the command names the binding', () => {
  const k = at({ encryption: 'keyring' });
  assert.equal(k.commands[0].cmd, 'stratis key set --capture-key pool_secret-key');
  assert.ok(k.commands[1].cmd.startsWith('stratis pool create --key-desc pool_secret-key '));
  assert.ok(preset('encrypted').commands.some((c) => c.cmd && c.cmd.includes('--clevis tang')));
  assert.ok(at({ encryption: 'tpm2' }).commands.some((c) => c.cmd && c.cmd.includes('--clevis tpm2')));
  assert.ok(!preset('local').commands.some((c) => c.cmd && c.cmd.includes('--clevis')));
});

test('commands: transport as notes, then the pool on the final devices, the filesystem and its mount', () => {
  const s = preset('iscsi');
  assert.deepEqual(s.commands.map((c) => c.note || c.cmd), [
    'iscsi',
    'stratis pool create pool_iscsi /dev/mapper/mpatha',
    'stratis filesystem create --size 2500GiB pool_iscsi vmdata',
    'mount /dev/stratis/pool_iscsi/vmdata /srv/vmdata'
  ]);
  assert.ok(!s.commands.some((c) => c.cmd && /iscsiadm|nvme |multipath /.test(c.cmd)), 'no transport tools');
  assert.deepEqual(preset('mixed').commands.filter((c) => c.note).map((c) => c.note), ['iscsi', 'fc']);
});

test('mixed: devices cycle SSD, iSCSI, FC, NVMe/TCP', () => {
  assert.deepEqual(at({ kind: 'mixed', devices: 4 }).devices.map((d) => d.kind), ['local-ssd', 'iscsi', 'fc', 'nvmetcp']);
  assert.equal(logic.hasRemote(P({ kind: 'mixed', devices: 1 })), false);
  assert.equal(logic.hasRemote(P({ kind: 'mixed', devices: 2 })), true);
  assert.equal(logic.hasRemote(P({ kind: 'lvmlv' })), false);
});

test('preset numbers are the original\'s', () => {
  const want = {
    local: [1000, 1200, 81], mixed: [3000, 5000, 701], iscsi: [1500, 2500, 351], fc: [4000, 3000, 901],
    nvmetcp: [1200, 1800, 421], encrypted: [1600, 2200, 241], cache: [4000, 6000, 1301], snapshot: [1000, 1500, 301]
  };
  for (const [id, [cap, logical, used]] of Object.entries(want)) {
    const s = preset(id);
    assert.deepEqual([s.capacity, s.logical, s.used], [cap, logical, used], id);
    assert.ok(s.pool.ok && s.pool.online && s.fs.ok, id);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and for a failed pool', () => {
  for (const pr of logic.presets) {
    const s = at(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
  const f = at({ kind: 'iscsi', paths: 4, multipath: false });
  assert.deepEqual(JSON.parse(JSON.stringify(f)), f);
});

test('deterministic, and initial does not mutate its params', () => {
  const p = P({ kind: 'mixed', devices: 4, paths: 4, down: 1, cache: 300, snapshot: true, written: 40 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  const glossary = require('../../kit/glossary.js');
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
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
    assert.ok(logic.KIND_PARAMS.includes(pr.params.kind), `${pr.id}: kind`);
    assert.ok(new RegExp(`\\b${pr.id}:`).test(html), `${pr.id}: label in index.html`);
  }
});
