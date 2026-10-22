// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-mount-layers: tie-breaks first, then one test per rule (SPEC.md), then the presets' numbers, then the
// template's generic block. Run: node --test sims/lnx-mount-layers/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const last = (over) => at(over, logic.steps(P(over)));
const M = logic.MiB;

/** Run one command on a copy of s, the way a step does (the changes included). */
function run(s, cmd) {
  const t = structuredClone(s);
  logic.blank(t);
  t.cmd = cmd;
  const before = structuredClone(t);
  logic.apply(t, cmd);
  t.event.changed = logic.changes(before, t);
  return t;
}
const fresh = (over) => logic.initial(P(over));
const strip = (s) => { const c = structuredClone(s); delete c.cmd; delete c.out; delete c.err; delete c.event; return c; };

// ── tie-breaks ──

test('tie-break: the most recent mount on a target is the one the path reaches, whatever the device order', () => {
  let s = fresh({ scene: 'nopoint' });
  s = run(s, { op: 'mount', dev: 'vdb2', target: '/mnt/vjezba' });
  assert.deepEqual(logic.leadsTo(s, '/mnt/vjezba'), { kind: 'fs', dev: 'vdb2' });
  s = run(s, { op: 'mount', dev: 'vdb1', target: '/mnt/vjezba' });   // vdb1 again, on top of vdb2
  assert.deepEqual(logic.leadsTo(s, '/mnt/vjezba'), { kind: 'fs', dev: 'vdb1' });
  s = run(s, { op: 'umount', target: '/mnt/vjezba' });
  assert.deepEqual(logic.leadsTo(s, '/mnt/vjezba'), { kind: 'fs', dev: 'vdb2' }, 'the top one goes, not the first vdb1');
  assert.deepEqual(s.mounts.map((m) => m.source), ['vdb1', 'vdb2']);
});

test('tie-break: mount checks run in a fixed order, the first failure wins', () => {
  const s = fresh({ scene: 'layers' });                               // no partition, no directory, no filesystem
  assert.equal(run(s, { op: 'mount', dev: 'vdb1', target: '/mnt/x' }).err, 'NODEV');
  const p = run(run(s, { op: 'parted', label: 'gpt', part: 'vdb1' }), { op: 'mkdir', path: '/mnt/y' });
  assert.equal(run(p, { op: 'mount', dev: 'vdb1', target: '/mnt/x' }).err, 'NOPOINT', 'no directory before no filesystem');
  assert.equal(run(p, { op: 'mount', dev: 'vdb1', target: '/mnt/y' }).err, 'NOFS');
});

test('tie-break: ls prints names sorted; df lists root first, then mounts in mount order', () => {
  let s = fresh({ scene: 'hide' });
  s = logic.putFile(s, '/mnt/vjezba', 'b.txt', M) && s;
  logic.putFile(s, '/mnt/vjezba', 'a.txt', M);
  assert.deepEqual(logic.listing(s, '/mnt/vjezba'), ['a.txt', 'b.txt']);
  let n = fresh({ scene: 'nopoint' });
  n = run(n, { op: 'mkdir', path: '/mnt/druga' });
  n = run(n, { op: 'mount', dev: 'vdb2', target: '/mnt/druga' });
  assert.deepEqual(logic.dfRows(n).map((r) => r.key), ['root', 'vdb1', 'vdb2']);
});

test('tie-break: df -h rounds up, with one decimal under 10', () => {
  assert.equal(logic.human(959786032), '916G', 'GNU df 9.4 on this machine: 915.33G prints 916G');
  assert.equal(logic.human(1541407), '1.5G');
  assert.equal(logic.human(1488978), '1.5G', '1.42G rounds up, not to the nearest');
  assert.equal(logic.human(1541407 + 10 * M), '1.5G');
  assert.equal(logic.human(1541407 + 100 * M), '1.6G');
  assert.equal(logic.human(24), '24K');
  assert.equal(logic.human(0), '0');
  assert.equal(logic.human(100 * M), '100M');
  assert.equal(logic.human(1023 * M + 1), '1.0G');
  assert.equal(logic.human(1024), '1.0M', 'a whole unit moves up');
  assert.equal(logic.human(1023), '1023K');
});

// ── rules ──

test('rule 1: a partition needs a table, a filesystem needs a partition, a path needs a mount', () => {
  const s = fresh({ scene: 'layers' });
  const noTable = run(s, { op: 'parted', part: 'vdb1' });
  assert.equal(noTable.err, 'NOLABEL');
  assert.deepEqual(strip(noTable), strip(s), 'nothing changed');
  assert.equal(run(s, { op: 'mkfs', dev: 'vdb1', type: 'ext4' }).err, 'NODEV');
  const parted = run(s, { op: 'parted', label: 'gpt', part: 'vdb1' });
  assert.equal(parted.disk.table, 'gpt');
  assert.equal(parted.parts[0].fs, null);
  assert.deepEqual(parted.event.changed, ['table', 'part:vdb1']);
  const made = run(parted, { op: 'mkfs', dev: 'vdb1', type: 'ext4' });
  assert.equal(made.parts[0].fs.type, 'ext4');
  assert.deepEqual(logic.dfRows(made).map((r) => r.key), ['root'], 'a filesystem with no mount has no df row');
  assert.equal(logic.leadsTo(made, '/mnt/vjezba'), null);
});

test('rule 2: Use% is used / (used + avail), not used / size', () => {
  const s = run(at({}, 3), { op: 'cp', dir: '/mnt/vjezba', name: 'big', kib: 900 * M });
  assert.equal(logic.dfRows(s)[1].pcent, '98%');
});

test('rule 2: df reports less than the 1023M partition, and the two types differ', () => {
  const e = last({ scene: 'layers' });
  assert.equal(e.parts[0].sizeMiB, 1023);
  assert.equal(e.out[2], '/dev/vdb1       989M   24K  922M   1% /mnt/vjezba');
  const x = last({ scene: 'layers', fsType: 'xfs' });
  assert.equal(x.out[2], '/dev/vdb1       959M   51M  909M   6% /mnt/vjezba');
  assert.deepEqual(logic.listing(x, '/mnt/vjezba'), [], 'a fresh XFS has no lost+found');
});

test('rule 3: mount on a missing directory fails with the book\'s message and changes nothing', () => {
  const s0 = at({ scene: 'nopoint' }, 0), s1 = at({ scene: 'nopoint' }, 1);
  assert.equal(s1.err, 'NOPOINT');
  assert.deepEqual(s1.out, ['mount: /mnt/druga: mount point does not exist.',
    '       dmesg(1) may have more information after failed mount system call.']);
  assert.deepEqual(strip(s1), strip(s0));
  assert.deepEqual(s1.event.changed, []);
});

test('rule 4: after mount the path leads to the mounted root; the old files are not deleted', () => {
  const s = at({}, 3);
  assert.deepEqual(logic.leadsTo(s, '/mnt/vjezba'), { kind: 'fs', dev: 'vdb1' });
  assert.deepEqual(logic.listing(s, '/mnt/vjezba'), ['lost+found']);
  assert.deepEqual(s.rootFs.dirs['/mnt/vjezba'], [{ name: 'stara.txt', kib: 100 * M }]);
  assert.deepEqual(s.event.hid, ['stara.txt']);
  assert.deepEqual(logic.hiddenAt(s, '/mnt/vjezba'), { mounts: [], files: ['stara.txt'] });
  assert.ok(s.event.changed.includes('path:/mnt/vjezba'));
  assert.ok(s.event.changed.includes('mount:vdb1'));
  assert.ok(at({}, 7).event.changed.includes('mount:vdb1'));
  assert.ok(!at({}, 4).event.changed.length, 'ls changes nothing');
});

test('rule 5: df for / still counts the hidden file; du over the path does not', () => {
  const before = at({}, 1).rootFs.usedKiB;
  const s = at({}, 5);
  assert.equal(s.rootFs.usedKiB, before + 100 * M);
  assert.equal(s.out[1], '/dev/vda4        19G  1.6G   17G   9% /');
  assert.deepEqual(at({}, 6).out, ['20K\t/mnt/vjezba']);
  assert.deepEqual(at({ fsType: 'xfs' }, 6).out, ['0\t/mnt/vjezba']);
  assert.equal(logic.duKiB(at({}, 2), '/mnt/vjezba'), 100 * M, 'before the mount du sees it');
  const dfp = run(at({}, 2), { op: 'df', paths: ['/mnt/vjezba'] });
  assert.equal(dfp.out[1], '/dev/vda4        19G  1.6G   17G   9% /', 'an unmounted mount point is on /');
});

test('rule 6: a write lands on whatever the path leads to now', () => {
  const s = at({}, 2);
  assert.ok(s.event.changed.includes('used:root'));
  assert.deepEqual(s.event.at, { kind: 'root' });
  const m = run(at({}, 3), { op: 'cp', dir: '/mnt/vjezba', name: 'nova.txt', kib: 10 * M });
  assert.deepEqual(m.event.at, { kind: 'fs', dev: 'vdb1' });
  assert.equal(m.parts[0].fs.usedKiB, 24 + 10 * M);
  assert.equal(m.rootFs.usedKiB, at({}, 3).rootFs.usedKiB, 'root unchanged');
  assert.deepEqual(m.event.changed, ['used:vdb1']);
  assert.equal(m.parts[0].fs.availKiB, 922 * M - 10 * M, 'avail drops by the file');
  assert.equal(s.rootFs.availKiB, at({}, 1).rootFs.availKiB - 100 * M);
  const full = run(at({}, 3), { op: 'cp', dir: '/mnt/vjezba', name: 'x', kib: 922 * M + 1 });
  assert.equal(full.err, 'ENOSPC');
  const exact = run(at({}, 3), { op: 'cp', dir: '/mnt/vjezba', name: 'x', kib: 922 * M });
  assert.equal(exact.err, null, 'exactly avail fits');
  assert.equal(run(exact, { op: 'cp', dir: '/mnt/vjezba', name: 'y', kib: 1 }).err, 'ENOSPC', 'then nothing is left');
  const nodir = run(at({ scene: 'layers' }, 0), { op: 'cp', dir: '/mnt/vjezba', name: 'x', kib: M });
  assert.equal(nodir.err, 'ENOENT');
});

test('rule 7: umount brings the hidden files back unchanged', () => {
  const s = at({}, 7);
  assert.deepEqual(logic.leadsTo(s, '/mnt/vjezba'), { kind: 'root' });
  assert.deepEqual(s.event.shown, ['stara.txt']);
  assert.deepEqual(s.rootFs.dirs['/mnt/vjezba'], at({}, 2).rootFs.dirs['/mnt/vjezba']);
  assert.deepEqual(last({}).out, ['stara.txt']);
  const again = run(s, { op: 'umount', target: '/mnt/vjezba' });
  assert.deepEqual(again.out, ['umount: /mnt/vjezba: not mounted.']);
  assert.deepEqual(strip(again), strip(s));
});

test('rule 8: a second mount on the same target hides the first; lsblk still lists both, df only the top', () => {
  const s = at({ scene: 'stack' }, 1);
  assert.deepEqual(logic.leadsTo(s, '/mnt/vjezba'), { kind: 'fs', dev: 'vdb2' });
  assert.equal(s.event.over, 'vdb1');
  assert.deepEqual(logic.hiddenAt(s, '/mnt/vjezba'), { mounts: ['vdb1'], files: ['stara.txt'] });
  assert.deepEqual(logic.dfRows(s).map((r) => r.key), ['root', 'vdb2']);
  assert.deepEqual(logic.lsblkLines(s).slice(2), ['├─vdb1 252:17   0 1023M  0 part /mnt/vjezba', '└─vdb2 252:18   0 1023M  0 part /mnt/vjezba']);
  assert.deepEqual(at({ scene: 'stack' }, 4).out, ['lost+found']);
  assert.deepEqual(last({ scene: 'stack' }).out, ['stara.txt']);
  assert.equal(run(s, { op: 'mount', dev: 'vdb2', target: '/mnt/vjezba' }).err, 'BUSY', 'the same device on top again');
});

test('rule 9: PARTUUID and PARTLABEL on the partition, UUID on the filesystem', () => {
  const s = at({ scene: 'nopoint' }, 0);
  assert.equal(s.parts[0].partuuid, '44505477-27f2-4ea4-8297-3f27aa35b1e3');
  assert.equal(s.parts[0].label, 'vjezba');
  assert.equal(s.parts[0].fs.uuid, '77b8714b-1cf6-4d6b-bce3-57d9763fb1e6');
  assert.equal(s.parts[1].fs.uuid, '2611f264-8657-4a15-9a35-df3939c304a2');
  const re = run(run(fresh({ scene: 'layers' }), { op: 'parted', label: 'gpt', part: 'vdb1' }), { op: 'mkfs', dev: 'vdb1', type: 'xfs' });
  assert.equal(re.parts[0].partuuid, '44505477-27f2-4ea4-8297-3f27aa35b1e3', 'mkfs leaves the partition\'s labels');
  assert.notEqual(re.parts[0].fs.uuid, '77b8714b-1cf6-4d6b-bce3-57d9763fb1e6', 'a new filesystem, a new UUID');
});

test('hiddenAt: nothing is hidden without a mount; covered mounts newest first', () => {
  assert.deepEqual(logic.hiddenAt(at({}, 2), '/mnt/vjezba'), { mounts: [], files: [] });
  let s = run(at({ scene: 'stack' }, 1), { op: 'mount', dev: 'vdb1', target: '/mnt/vjezba' });
  assert.deepEqual(logic.hiddenAt(s, '/mnt/vjezba').mounts, ['vdb2', 'vdb1']);
});

test('parted refuses a partition that exists; mkfs on a used filesystem starts it fresh', () => {
  const s = at({ scene: 'nopoint' }, 0);
  assert.equal(run(s, { op: 'parted', part: 'vdb2' }).err, 'EXISTS');
  const w = run(run(at({ scene: 'stack' }, 1), { op: 'cp', dir: '/mnt/vjezba', name: 'n.txt', kib: M }), { op: 'umount', target: '/mnt/vjezba' });
  const f = run(run(w, { op: 'umount', target: '/mnt/vjezba' }), { op: 'mkfs', dev: 'vdb2', type: 'xfs' });
  assert.equal(f.err, null);
  assert.deepEqual(f.parts[1].fs.files, []);
  assert.equal(f.parts[1].fs.usedKiB, 51712);
});

test('mkdir -p on an existing directory changes nothing; mkfs refuses a mounted device', () => {
  const s = at({}, 0);
  const m = run(s, { op: 'mkdir', path: '/mnt/vjezba' });
  assert.equal(m.err, null);
  assert.deepEqual(m.event.changed, []);
  assert.equal(run(at({}, 3), { op: 'mkfs', dev: 'vdb1', type: 'xfs' }).err, 'MOUNTED');
});

// ── presets ──

test('nopoint and stack keep ext4 on vdb1 whatever fsType says', () => {
  assert.equal(at({ scene: 'nopoint', fsType: 'xfs' }, 0).parts[0].fs.type, 'ext4');
  assert.equal(at({ scene: 'stack', fsType: 'xfs' }, 0).parts[0].fs.type, 'ext4');
  assert.equal(at({ scene: 'hide', fsType: 'xfs' }, 0).parts[0].fs.type, 'xfs');
  assert.equal(at({ scene: 'layers', fsType: 'xfs' }, 3).parts[0].fs.type, 'xfs');
});

test('presets: step counts 8, 7, 4, 6', () => {
  assert.deepEqual(logic.SCENE_IDS.map((id) => logic.steps(P({ scene: id }))), [8, 7, 4, 6]);
});

test('preset hide: the book\'s root line, then +100M', () => {
  assert.deepEqual(logic.dfLines(logic.dfRows(at({}, 0)))[1], '/dev/vda4        19G  1.5G   17G   8% /');
  assert.deepEqual(at({}, 1).out, []);
  assert.deepEqual(at({}, 4).out, ['lost+found']);
  assert.equal(at({ fileMiB: 500 }, 5).out[1], '/dev/vda4        19G  2.0G   17G  11% /');
});

test('preset layers: lsblk shows the empty disk; df has no vdb1 row before the mount', () => {
  assert.deepEqual(at({ scene: 'layers' }, 1).out, ['NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS', 'vdb    252:16   0    2G  0 disk']);
  assert.equal(at({ scene: 'layers' }, 3).out[1], 'Filesystem UUID: 77b8714b-1cf6-4d6b-bce3-57d9763fb1e6');
  assert.equal(at({ scene: 'layers' }, 4).out.length, 2);
});

test('preset nopoint: df -hT prints the book\'s two lines', () => {
  assert.deepEqual(last({ scene: 'nopoint' }).out, [
    'Filesystem     Type  Size  Used Avail Use% Mounted on',
    '/dev/vdb1      ext4  989M   24K  922M   1% /mnt/vjezba',
    '/dev/vdb2      xfs   959M   51M  909M   6% /mnt/druga']);
});

test('preset stack starts where hide is after its mount, with fileMiB', () => {
  assert.deepEqual(strip(at({ scene: 'stack', fileMiB: 70 }, 0)).rootFs, strip(at({ fileMiB: 70 }, 3)).rootFs);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const id of logic.SCENE_IDS) for (const fsType of ['ext4', 'xfs']) {
    const p = P({ scene: id, fsType });
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const id of logic.SCENE_IDS) {
    const p = P({ scene: id, fsType: 'xfs', fileMiB: 230 });
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({});
  const s0 = kit.stateAt(logic, p, 2);
  const copy = structuredClone(s0);
  logic.step(s0, 3, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  for (const id of logic.SCENE_IDS) assert.ok(html.includes(`'${id}'`), `preset ${id} on the page`);
});
