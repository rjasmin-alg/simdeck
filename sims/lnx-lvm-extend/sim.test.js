// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-lvm-extend's model (rules: SPEC.md). Run: node --test sims/lnx-lvm-extend/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const disk = (s, name) => s.disks.find((d) => d.name === name);
const vgs = (s) => logic.vgsRow(s);
const lvs = (s) => logic.lvsRow(s);
const df = (s) => { const r = logic.dfRow(s); return r && [r.size, r.used, r.avail, r.pct].join(' '); };
const pfree = (s) => Object.fromEntries(logic.pvsRows(s).map((r) => [r.pv, r.pfree]));
const layers = (s) => ({ disks: s.disks, vg: s.vg, lv: s.lv, fs: s.fs });
const o = (over) => logic.norm(P(over));
/** The empty machine of the build preset, then the given commands. */
const runAll = (ops, over) => ops.reduce((s, op) => logic.run(s, op, o(over)), logic.initial(P(Object.assign({ scene: 'build' }, over))));

// ── tie-breaks first ──

test('tie-break (rule 5): the first PV in VG order first, lowest PE first, then the next PV (255 + 120)', () => {
  const s = at({}, 4);
  assert.deepEqual(s.info.split, [{ disk: '/dev/vdb', n: 255 }, { disk: '/dev/vdc', n: 120 }]);
  const les = s.lv.les;
  assert.deepEqual(les.slice(0, 2), [{ disk: '/dev/vdb', pe: 0 }, { disk: '/dev/vdb', pe: 1 }]);
  assert.deepEqual(les[256], { disk: '/dev/vdb', pe: 256 });
  assert.deepEqual(les[510], { disk: '/dev/vdb', pe: 510 });
  assert.deepEqual(les[511], { disk: '/dev/vdc', pe: 0 });
  assert.deepEqual(les[630], { disk: '/dev/vdc', pe: 119 });
  assert.equal(disk(s, '/dev/vdc').pes.filter((x) => x).length, 120);
  assert.deepEqual(pfree(at({}, 8)), { '/dev/vdb': '0', '/dev/vdc': '<1.53g' });
});

test('tie-break (rule 5): VG order is the order the PVs joined, not the disk order', () => {
  const s = runAll([{ op: 'vgcreate', disk: '/dev/vdc' }, { op: 'vgextend', disk: '/dev/vdb' }, { op: 'lvcreate', mib: 1024 }]);
  assert.deepEqual(s.vg.pvs, ['/dev/vdc', '/dev/vdb']);
  assert.deepEqual(s.info.split, [{ disk: '/dev/vdc', n: 256 }]);
  assert.deepEqual(s.lv.les[0], { disk: '/dev/vdc', pe: 0 });
});

test('tie-break (rule 5): a free hole low on the first PV is taken before higher PEs', () => {
  const s0 = runAll([{ op: 'vgcreate', disk: '/dev/vdb' }]);
  const s = structuredClone(s0);
  disk(s, '/dev/vdb').pes = disk(s, '/dev/vdb').pes.map((x, i) => (i === 3 ? null : i < 10 ? 'x' : null));
  assert.deepEqual(logic.allocate(s, 2), [{ disk: '/dev/vdb', pe: 3 }, { disk: '/dev/vdb', pe: 10 }]);
});

test('tie-break (rule 2): a size that is not whole extents is rounded up, and the tool says so', () => {
  assert.equal(logic.extentsFor(1500, 4), 375);
  assert.equal(logic.extentsFor(1024, 4), 256);
  assert.equal(logic.extentsFor(1500, 8), 188);
  assert.equal(logic.extentsFor(1500, 32), 47);
  assert.equal(logic.extentsFor(1024, 32), 32);
  const s = at({ peMiB: 8 }, 1);
  assert.equal(s.info.need, 188);
  assert.equal(s.info.rounded, true);
  assert.match(s.out[0], /^ {2}Rounding size to boundary between physical extents: <1\.47 GiB\.$/);
  assert.equal(at({}, 1).info.rounded, false);
  assert.equal(at({}, 1).out.length, 1);
});

// ── rules ──

test('rule 1: usable PEs = floor((MiB − 1) / PE MiB): 2048 MiB at 4 MiB → 511, shown as <2.00g', () => {
  assert.equal(logic.peCount(2048, 4), 511);
  assert.equal(logic.peCount(2048, 8), 255);
  assert.equal(logic.peCount(2048, 16), 127);
  assert.equal(logic.peCount(2048, 32), 63);
  assert.equal(logic.peCount(8192, 4), 2047);
  const s = at({ scene: 'build' }, 2);
  assert.equal(disk(s, '/dev/vdb').pes.length, 511);
  assert.deepEqual(s.info, { disk: '/dev/vdb', pes: 511, naive: 512 });
  assert.equal(vgs(s).vsize, '<2.00g');
  assert.equal(vgs(s).vfree, '<2.00g');
  assert.equal(s.cmd, 'sudo vgcreate podaci /dev/vdb');
  assert.equal(at({ scene: 'build', peMiB: 16 }, 2).cmd, 'sudo vgcreate -s 16M podaci /dev/vdb');
});

test('rule 3: lvextend needing more than the VG has free changes nothing and exits 5', () => {
  const s0 = at({}, 0), s = at({}, 1);
  assert.equal(s.event, 'lvextend-fail');
  assert.equal(s.exit, 5);
  assert.deepEqual(s.out, ['  Insufficient free space: 375 extents needed, but only 255 available']);
  assert.deepEqual(layers(s), layers(s0));
  assert.deepEqual(s.changed, []);
  assert.deepEqual(s.refused, ['lv']);
  // a PV outside the VG does not count: after pvcreate /dev/vdc it still fails with 255
  const s2 = logic.run(at({}, 2), { op: 'lvextend', mib: 1500 }, o({}));
  assert.equal(s2.exit, 5);
  assert.equal(s2.info.free, 255);
  // lvcreate's own wording
  const s3 = runAll([{ op: 'vgcreate', disk: '/dev/vdb' }, { op: 'lvcreate', mib: 3000 }]);
  assert.equal(s3.exit, 5);
  assert.equal(s3.lv, null);
  assert.deepEqual(s3.out, ['  Volume group "podaci" has insufficient free space (511 extents): 750 required.']);
});

test('rule 3: the will-it-fit numbers: 391 free, +1G (256) fits, +2G (512) does not', () => {
  const p = { scene: 'will-it-fit' };
  assert.equal(vgs(at(p, 0)).free, 391);
  assert.equal(logic.vgFree(at(p, 1)) * 4, 1564);
  const s2 = at(p, 2);
  assert.equal(s2.exit, 0);
  assert.deepEqual([s2.info.from, s2.info.to], [631, 887]);
  const s3 = at(p, 3);
  assert.deepEqual(layers(s3), layers(at(p, 0)));      // back to the start
  assert.equal(vgs(s3).free, 391);
  const s4 = at(p, 4);
  assert.equal(s4.exit, 5);
  assert.deepEqual(s4.out, ['  Insufficient free space: 512 extents needed, but only 391 available']);
  // a bigger second disk changes the answer
  assert.equal(at({ scene: 'will-it-fit', disk2GiB: 4 }, 4).exit, 0);
});

test('rule 4: pvcreate adds no space anywhere; vgextend adds its PEs to the VG and leaves the LV alone', () => {
  const s1 = at({}, 1), s2 = at({}, 2), s3 = at({}, 3);
  assert.equal(disk(s2, '/dev/vdc').pv, true);
  assert.equal(disk(s2, '/dev/vdc').vg, null);
  assert.deepEqual(vgs(s2), vgs(s1));
  assert.deepEqual(s2.changed, ['pv:/dev/vdc']);
  assert.deepEqual(s2.vg, s1.vg);
  const v = vgs(s3);
  assert.deepEqual([v.pv, v.lv, v.vsize, v.vfree, v.free], [2, 1, '3.99g', '2.99g', 766]);
  assert.deepEqual(s3.lv, s2.lv);
  assert.deepEqual(lvs(s3), lvs(s2));
  assert.deepEqual(s3.changed, ['vg', 'pv:/dev/vdc']);
});

test('rule 6: growing the LV does not grow the filesystem; df still says 960M', () => {
  const s3 = at({}, 3), s4 = at({}, 4), s5 = at({}, 5);
  assert.equal(s4.exit, 0);
  assert.deepEqual([s4.info.from, s4.info.to], [256, 631]);
  assert.equal(lvs(s4).lsize, '2.46g');
  assert.match(s4.out[0], /changed from 1\.00 GiB \(256 extents\) to 2\.46 GiB \(631 extents\)\.$/);
  assert.deepEqual(s4.fs, s3.fs);
  assert.deepEqual(s4.changed, ['lv', 'vg', 'pv:/dev/vdb', 'pv:/dev/vdc']);   // every layer below, not the filesystem
  assert.equal(df(s5), '960M 51M 910M 6%');
  assert.deepEqual(s5.refused, ['fs']);
  assert.deepEqual(s5.asked, ['fs']);
  assert.deepEqual(at({ scene: 'forgot-fs' }, 3).refused, ['fs']);
});

test('rule 7: xfs_growfs grows a mounted XFS to fill the LV: 262144 → 646144 blocks, df 2.5G 80M 2.4G 4%', () => {
  const s6 = at({}, 6);
  assert.deepEqual([s6.info.from, s6.info.to], [262144, 646144]);
  assert.equal(s6.out[s6.out.length - 1], 'data blocks changed from 262144 to 646144');
  assert.equal(s6.fs.blocks * 4096, logic.lvMiB(s6) * 1048576);        // 646144 × 4 KiB = 2524 MiB = the LV
  assert.deepEqual(s6.changed, ['fs']);
  assert.equal(df(at({}, 7)), '2.5G 80M 2.4G 4%');
  assert.deepEqual(at({}, 7).refused, []);
  // mounted the whole time
  for (let n = 0; n <= 8; n++) assert.equal(at({}, n).fs.mounted, true);
  // not mounted: refused, nothing changes
  const fs = Object.assign({}, at({}, 4).fs, { mounted: false });
  const r = logic.growFs(fs, 646144);
  assert.equal(r.exit, 1);
  assert.equal(r.fs.blocks, 262144);
  // nothing to grow
  const again = logic.run(at({}, 6), { op: 'growfs' }, o({}));
  assert.equal(again.exit, 0);
  assert.equal(again.fs.blocks, 646144);
  assert.deepEqual(again.changed, []);
});

test('rule 8: ext4 grows mounted (resize2fs), and lvextend -r grows both layers in one step', () => {
  const s = at({ fsType: 'ext4' }, 6);
  assert.equal(s.cmd, 'sudo resize2fs /dev/podaci/arhiva');
  assert.equal(s.exit, 0);
  assert.equal(s.fs.mounted, true);
  assert.equal(s.fs.blocks, 646144);
  assert.equal(df(at({ fsType: 'ext4' }, 0)), '974M 24K 923M 1%');
  assert.equal(df(at({ fsType: 'ext4' }, 7)), '2.4G 24K 2.3G 1%');
  const p = { scene: 'ext4-r', fsType: 'ext4' };
  const r = at(p, 4);
  assert.equal(r.cmd, 'sudo lvextend -r -L +1500M /dev/podaci/arhiva');
  assert.deepEqual([r.info.from, r.info.to, r.info.fsFrom, r.info.fsTo], [256, 631, 262144, 646144]);
  assert.deepEqual(r.changed, ['fs', 'lv', 'vg', 'pv:/dev/vdb', 'pv:/dev/vdc']);
  assert.deepEqual(at(p, 5).refused, []);
  assert.equal(df(at(p, 5)), '2.4G 24K 2.3G 1%');
  // -r on XFS runs xfs_growfs the same way
  assert.equal(at({ scene: 'ext4-r' }, 4).fs.blocks, 646144);
});

test('rule 9: XFS does not shrink, and no preset step shrinks anything', () => {
  const fs = at({}, 6).fs;
  const r = logic.growFs(fs, 262144);
  assert.equal(r.exit, 1);
  assert.equal(r.fs.blocks, 646144);
  for (const id of logic.SCENE_IDS) {
    for (const ext of ['xfs', 'ext4']) {
      const p = P({ scene: id, fsType: ext });
      let prev = logic.initial(p);
      for (let n = 1; n <= logic.steps(p); n++) {
        const s = kit.stateAt(logic, p, n);
        if (!s.op.restore) {
          assert.ok(logic.lvMiB(s) >= logic.lvMiB(prev), `${id} ${n}: LV`);
          assert.ok(logic.fsMiB(s.fs) >= logic.fsMiB(prev.fs), `${id} ${n}: fs`);
        }
        prev = s;
      }
    }
  }
});

test('sizes are printed the way the tools print them', () => {
  assert.equal(logic.lvmSize(2044), '<2.00g');
  assert.equal(logic.lvmSize(1020), '1020.00m');
  assert.equal(logic.lvmSize(4088), '3.99g');
  assert.equal(logic.lvmSize(3064), '2.99g');
  assert.equal(logic.lvmSize(1564), '<1.53g');
  assert.equal(logic.lvmSize(2524), '2.46g');
  assert.equal(logic.lvmSize(0), '0');
  assert.equal(logic.lvmSize(2524, true), '2.46 GiB');
  assert.equal(logic.dfSize(960 * 1048576), '960M');
  assert.equal(logic.dfSize(2460 * 1048576), '2.5G');
  assert.equal(logic.dfSize(24576), '24K');
  assert.equal(logic.dfSize(1023.5 * 1048576), '1.0G');
  assert.deepEqual(at({}, 7).out, [
    'Filesystem                Type  Size  Used Avail Use% Mounted on',
    '/dev/mapper/podaci-arhiva xfs   2.5G   80M  2.4G   4% /mnt/arhiva'
  ]);
  assert.deepEqual(at({}, 8).out, [
    '  PV         VG     Fmt  Attr PSize  PFree',
    '  /dev/vdb   podaci lvm2 a--  <2.00g      0',
    '  /dev/vdc   podaci lvm2 a--  <2.00g <1.53g'
  ]);
});

test('presets: steps 8, 6, 4, 4, 5 and the book\'s numbers', () => {
  assert.deepEqual(logic.SCENE_IDS.map((id) => logic.steps(P({ scene: id }))), [8, 6, 4, 4, 5]);
  assert.equal(logic.steps(logic.defaults), 8);
  const b = { scene: 'build' };
  assert.equal(at(b, 0).vg, null);
  assert.equal(disk(at(b, 1), '/dev/vdb').pv, true);
  assert.equal(pfree(at(b, 3))['/dev/vdb'], '1020.00m');
  assert.equal(at(b, 4).info.blocks, 262144);
  assert.equal(at(b, 4).fs.mounted, false);
  assert.equal(logic.dfRow(at(b, 4)), null);
  assert.equal(df(at(b, 6)), '960M 51M 910M 6%');
  const f = { scene: 'forgot-fs' };
  assert.equal(lvs(at(f, 2)).lsize, '2.46g');
  assert.equal(df(at(f, 3)), '960M 51M 910M 6%');
  assert.equal(at(f, 4).fs.blocks, 646144);
  assert.equal(at({}, 0).fs.blocks, 262144);
  assert.equal(df(at({}, 0)), '960M 51M 910M 6%');
});

test('growMiB is the lvextend request, live at the current step', () => {
  assert.equal(at({ growMiB: 1000 }, 1).exit, 0);                // 250 ≤ 255
  assert.equal(at({ growMiB: 1100 }, 1).exit, 5);                // 275 > 255
  assert.equal(at({ growMiB: 6000 }, 4).exit, 5);                // 1500 > 766
  assert.equal(at({ scene: 'will-it-fit', growMiB: 6000 }, 2).exit, 0);   // its sizes are fixed
});

test('columns: 128 MiB per column, disks side by side; every extent counted once', () => {
  const c = logic.columns(at({}, 6));
  assert.equal(c.chunkMiB, 128);
  assert.equal(c.perCol, 32);
  assert.deepEqual(c.disks.map((d) => [d.disk, d.from, d.len]), [['/dev/vdb', 0, 16], ['/dev/vdc', 16, 16]]);
  const sum = (k) => c.cols.reduce((a, x) => a + x[k], 0);
  assert.equal(sum('cap'), 1022);
  assert.equal(sum('lv'), 631);
  assert.equal(sum('used'), 631);
  assert.equal(sum('fs'), 631);
  const c5 = logic.columns(at({}, 5));
  assert.equal(c5.cols.reduce((a, x) => a + x.fs, 0), 256);
  assert.deepEqual(logic.columns(at({}, 0)).cols.slice(16).map((x) => x.pv), Array(16).fill('raw'));
  assert.deepEqual(logic.columns(at({}, 2)).cols.slice(16).map((x) => x.pv), Array(16).fill('orphan'));
  const big = logic.columns(at({ disk2GiB: 8 }, 0));
  assert.equal(big.chunkMiB, 256);
  assert.equal(big.cols.length, 40);
  assert.equal(logic.columns(at({ peMiB: 32 }, 0)).perCol, 4);
});

test('norm clamps params to the page ranges', () => {
  assert.deepEqual(logic.norm({ scene: 'x', peMiB: 5, disk2GiB: 3, fsType: 'btrfs', growMiB: 99999 }),
    { scene: 'book', peMiB: 4, disk2GiB: 2, fsType: 'xfs', growMiB: 6000 });
  assert.equal(logic.norm({ growMiB: 1449 }).growMiB, 1400);
});

test('review: rounding is up, not to nearest (100M at 16 MiB → 7, at 32 MiB → 4)', () => {
  assert.equal(logic.extentsFor(100, 16), 7);
  assert.equal(logic.extentsFor(100, 32), 4);
  assert.equal(at({ peMiB: 16, growMiB: 100 }, 1).info.need, 7);
});

test('review: highlights and the layer a read-only command reads', () => {
  assert.deepEqual(at({ scene: 'build' }, 4).changed, ['fs']);              // mkfs: blocks, not yet df
  assert.deepEqual(at({ scene: 'build' }, 5).changed, ['fs']);              // mount: now df reads it
  assert.deepEqual(at({}, 8).asked, ['pv:/dev/vdb', 'pv:/dev/vdc']);
  assert.deepEqual(at({ scene: 'forgot-fs' }, 1).asked, ['vg']);
  assert.deepEqual(at({ scene: 'forgot-fs' }, 2).asked, ['lv']);
  const r = at({ scene: 'will-it-fit' }, 3);                              // back to the start, then vgs: nothing changed
  assert.deepEqual(r.changed, []);
  assert.deepEqual(r.asked, ['vg']);
});

test('review: vgs and lvs columns follow the state (#LV, the open flag)', () => {
  assert.equal(vgs(at({ scene: 'build' }, 2)).lv, 0);
  assert.equal(vgs(at({ scene: 'build' }, 3)).lv, 1);
  assert.equal(lvs(at({ scene: 'build' }, 3)).attr, '-wi-a-----');        // before the mount (the book)
  assert.equal(lvs(at({}, 0)).attr, '-wi-ao----');                         // open while mounted
});

test('review: the forgot-fs and will-it-fit starts use the book\'s +1500M, whatever growMiB is', () => {
  for (const g of [100, 6000]) {
    assert.equal(at({ scene: 'forgot-fs', growMiB: g }, 0).lv.les.length, 631);
    assert.equal(at({ scene: 'will-it-fit', growMiB: g }, 0).lv.les.length, 631);
  }
});

test('review: mkfs geometry and the column size threshold', () => {
  const s = at({ scene: 'build' }, 4);
  assert.equal(s.fs.agsize, 65536);
  assert.match(s.out[0], /agcount=4, agsize=65536 blks$/);
  assert.equal(logic.columns(at({ disk2GiB: 4 }, 0)).chunkMiB, 128);       // 6 GiB of disk: still 128 MiB a column
  assert.equal(logic.columns(at({ disk2GiB: 8 }, 0)).chunkMiB, 256);
});

test('review: the split follows VG order, not disk order', () => {
  const s = runAll([{ op: 'vgcreate', disk: '/dev/vdc' }, { op: 'vgextend', disk: '/dev/vdb' }, { op: 'lvcreate', mib: 3000 }]);
  assert.deepEqual(s.info.split, [{ disk: '/dev/vdc', n: 511 }, { disk: '/dev/vdb', n: 239 }]);
});

// ── generic checks every sim keeps ──

const VARIANTS = [{}, { peMiB: 8, disk2GiB: 4 }, { peMiB: 32, disk2GiB: 8, fsType: 'ext4', growMiB: 300 }];

test('state is JSON-safe at every step', () => {
  for (const scene of logic.SCENE_IDS) {
    for (const v of VARIANTS) {
      const p = P(Object.assign({ scene }, v));
      for (let n = 0; n <= logic.steps(p); n++) {
        const s = kit.stateAt(logic, p, n);
        assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
      }
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const scene of logic.SCENE_IDS) {
    const p = P({ scene, peMiB: 8 });
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const scene of logic.SCENE_IDS) {
    const p = P({ scene });
    let s = logic.initial(p);
    for (let n = 1; n <= logic.steps(p); n++) {
      const copy = structuredClone(s);
      const next = logic.step(s, n, p);
      assert.deepEqual(s, copy);
      s = next;
    }
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const scenes = [...html.matchAll(/scene:\s*'([\w-]+)'/g)].map((m) => m[1]);
  for (const id of scenes) assert.ok(logic.SCENES[id], `scene ${id} exists`);
  assert.deepEqual([...new Set(scenes)].sort(), [...logic.SCENE_IDS].sort());
});
