// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the LVM topology model (sim.js). Run: node --test sims/lvm-topology/
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
/** Where an LV's extents sit: [disk, pe, le, role] in disk then PE order. */
const placed = (s, lv) => {
  const out = [];
  s.disks.forEach((d, di) => d.extents.forEach((e, pe) => { if (e && e.lv === lv) out.push([di, pe, e.le, e.role]); }));
  return out;
};
const preset = (id) => at(logic.presets.find((x) => x.id === id).params);

// ── tie-breaks ──

test('linear: the lowest free PE of the first disk first, then the next disk', () => {
  const s = at({ disks: 2, diskPE: 8, size: 10 });
  const p = placed(s, 0);
  assert.deepEqual(p.slice(0, 3).map((x) => [x[0], x[1], x[2]]), [[0, 0, 0], [0, 1, 1], [0, 2, 2]]);
  assert.deepEqual(p[8].slice(0, 3), [1, 0, 8], 'LE 8 is the first PE of the second disk');
  assert.equal(s.disks[1].extents.filter(Boolean).length, 2);
});

test('striped and RAID5 use the first PVs with free space, in disk order', () => {
  const s = at({ layout: 'striped', disks: 4, width: 2, size: 4 });
  assert.deepEqual(s.lvs[0].disks, [0, 1]);
  const r = at({ layout: 'raid5', disks: 4, width: 3, size: 4 });
  assert.deepEqual(r.lvs[0].disks, [0, 1, 2]);
});

test('RAID1 takes the first PVs that each hold a whole copy, skipping a fuller one', () => {
  const s = at({ layout: 'raid1', disks: 3, diskPE: 8, size: 8, width: 2 });
  assert.deepEqual(s.lvs[0].disks, [0, 1]);
  const t = at({ layout: 'raid1', crypt: 'above', disks: 3, diskPE: 8, lv2: 4, size: 6, width: 2 });
  // public takes 4 PEs of /dev/sda, leaving 4 < 6: the mirror goes to sdb and sdc.
  assert.equal(t.lvs[0].name, 'public');
  assert.deepEqual(t.lvs[1].disks, [1, 2]);
});

test('RAID5 parity rotates: row r has its parity on member r mod n', () => {
  const s = at({ layout: 'raid5', disks: 3, width: 3, diskPE: 8, size: 6 });
  for (let r = 0; r < 3; r++) {
    s.disks.forEach((d, di) => assert.equal(d.extents[r].role === 'parity', di === r % 3, `row ${r} disk ${di}`));
  }
  // Data LEs fill each row left to right, skipping the parity member.
  assert.deepEqual(s.disks.map((d) => d.extents[0].le), [null, 0, 1]);
  assert.deepEqual(s.disks.map((d) => d.extents[1].le), [2, null, 3]);
});

// ── allocation rules ──

test('striped: LE k on lane k mod n, row floor(k / n)', () => {
  const s = at({ layout: 'striped', disks: 3, width: 3, diskPE: 8, size: 9 });
  for (const [di, pe, le] of placed(s, 0)) {
    assert.equal(di, le % 3, `LE ${le} lane`);
    assert.equal(pe, Math.floor(le / 3), `LE ${le} row`);
  }
});

test('striped and RAID5 sizes round up to whole rows; linear and RAID1 do not', () => {
  const s = at({ layout: 'striped', disks: 3, width: 3, size: 10 });
  assert.equal(s.lvs[0].requested, 10);
  assert.equal(s.lvs[0].size, 12);
  assert.equal(at({ layout: 'raid5', disks: 4, width: 4, size: 10 }).lvs[0].size, 12, 'three data extents per row');
  assert.equal(at({ layout: 'raid5', disks: 3, width: 3, size: 5 }).lvs[0].size, 6, 'two data extents per row');
  assert.equal(at({ layout: 'linear', size: 7 }).lvs[0].size, 7);
  assert.equal(at({ layout: 'raid1', disks: 2, size: 7 }).lvs[0].size, 7);
});

test('RAID1: every copy on its own PV, with the same LE numbers; physical = copies × logical', () => {
  const s = at({ layout: 'raid1', disks: 3, diskPE: 24, size: 10, width: 3 });
  const lv = s.lvs[0];
  assert.equal(lv.pe, 30);
  for (let di = 0; di < 3; di++) {
    assert.deepEqual(s.disks[di].extents.filter(Boolean).map((e) => e.le), [...Array(10).keys()], `disk ${di}`);
    assert.ok(s.disks[di].extents.filter(Boolean).every((e) => e.copy === di));
  }
  assert.equal(preset('raid1').ratio, 2, 'two-way mirror');
});

test('RAID5: n − 1 data extents per row plus one parity; physical = logical × n / (n − 1)', () => {
  const s = preset('raid5');
  assert.equal(s.lvs[0].size, 36);
  assert.equal(s.lvs[0].pe, 48);
  assert.equal(placed(s, 0).filter((x) => x[3] === 'parity').length, 12);
  assert.ok(Math.abs(s.ratio - 4 / 3) < 1e-9);
});

test('RAID5 needs at least three members: width 2 counts as 3', () => {
  const s = at({ layout: 'raid5', disks: 3, width: 2, size: 4 });
  assert.equal(s.lvs[0].width, 3);
  assert.equal(logic.minWidth('raid5'), 3);
  assert.equal(logic.minWidth('striped'), 2);
});

test('errors: not enough space, too few PVs, unbalanced rows, RAID1 copies that do not fit', () => {
  assert.deepEqual(at({ size: 40, diskPE: 32 }).lvs[0].error, { code: 'noSpace', need: 40, free: 32 });
  assert.deepEqual(at({ layout: 'striped', disks: 2, width: 3 }).lvs[0].error, { code: 'needPVs', n: 3 });
  assert.deepEqual(at({ layout: 'raid5', disks: 2, width: 3 }).lvs[0].error, { code: 'needPVs', n: 3 });
  assert.deepEqual(at({ layout: 'striped', disks: 2, width: 2, diskPE: 8, size: 18 }).lvs[0].error, { code: 'rowSpace', rows: 9, n: 2 });
  assert.deepEqual(at({ layout: 'raid5', disks: 3, width: 3, diskPE: 8, size: 18 }).lvs[0].error, { code: 'rowSpace', rows: 9, n: 3 });
  assert.deepEqual(at({ layout: 'raid1', disks: 2, diskPE: 8, size: 9 }).lvs[0].error, { code: 'raid1Space', n: 2, size: 9 });
});

test('a failed LV takes nothing: the map stays as it was, and the counters agree', () => {
  const s = at({ size: 40, diskPE: 32 });
  assert.equal(s.lvs[0].ok, false);
  assert.equal(s.allocated, 0);
  assert.equal(s.free, 32);
  assert.equal(s.logical, 0);
  assert.equal(s.ratio, null);
  // LUKS above: public fits, secret does not; public keeps its extents.
  const t = at({ crypt: 'above', diskPE: 16, lv2: 12, size: 8 });
  assert.equal(t.lvs[0].ok, true);
  assert.equal(t.lvs[1].ok, false);
  assert.equal(t.allocated, 12);
});

test('thin: the pool takes PEs now, thin LVs only a virtual size; overcommit shows as a ratio under 1', () => {
  const s = preset('thin');
  assert.equal(s.lvs[0].type, 'thinpool');
  assert.equal(s.lvs[0].pe, 32);
  assert.deepEqual(s.thin.map((x) => [x.name, x.virt]), [['vm01', 40], ['vm02', 40]]);
  assert.equal(s.logical, 80, 'the pool is not counted, its thin LVs are');
  assert.equal(s.allocated, 32);
  assert.equal(s.ratio, 0.4);
  assert.deepEqual(at({ layout: 'thin', size: 60, diskPE: 48 }).thin, [], 'no pool, no thin LVs');
});

test('LUKS below: every disk is opened first, and the PVs are the opened devices', () => {
  const s = preset('luks-below');
  assert.deepEqual(s.disks.map((d) => d.pv), ['/dev/mapper/crypt_sda', '/dev/mapper/crypt_sdb']);
  const cmds = s.commands.map((c) => c.cmd);
  assert.ok(cmds.indexOf('cryptsetup open /dev/sdb crypt_sdb') < cmds.indexOf('pvcreate /dev/mapper/crypt_sda /dev/mapper/crypt_sdb'));
  assert.ok(s.lvs.every((lv) => !lv.crypt));
});

test('LUKS above: the unencrypted second LV first, only the main LV encrypted; the second LV only with LUKS above', () => {
  const s = preset('luks-above');
  assert.deepEqual(s.lvs.map((lv) => [lv.name, lv.crypt, lv.size]), [['public', false, 12], ['secret', true, 16]]);
  assert.equal(placed(s, 0)[0][1], 0, 'public starts at PE 0');
  assert.equal(at({ lv2: 12 }).lvs.length, 1, 'no second LV without LUKS above');
  assert.equal(at({ crypt: 'above', lv2: 0 }).lvs.length, 1, 'size 0 means none');
  const thin = at({ layout: 'thin', crypt: 'above', diskPE: 48 });
  assert.deepEqual(thin.thin.map((x) => x.crypt), [true, false], 'thin: only the first thin LV');
  assert.equal(thin.lvs.length, 1, 'no second LV in the thin layout');
});

test('commands: the original preset sequences; a failed lvcreate is flagged and gets no mkfs', () => {
  assert.deepEqual(preset('basic').commands.map((c) => c.cmd),
    ['pvcreate /dev/sda', 'vgcreate vg_demo /dev/sda', 'lvcreate -l 16 -n data vg_demo', 'mkfs.ext4 /dev/vg_demo/data']);
  const cmds = (id) => preset(id).commands.map((c) => c.cmd);
  assert.ok(cmds('striped').includes('lvcreate -l 36 -i 3 -n scratch vg_fast'));
  assert.ok(cmds('raid1').includes('lvcreate --type raid1 -l 18 -m 1 -n important vg_safe'));
  assert.ok(cmds('raid5').includes('lvcreate --type raid5 -l 36 -i 3 -n media vg_raid'));
  assert.ok(cmds('thin').includes('lvcreate --type thin-pool -l 32 -n thinpool vg_cloud'));
  assert.ok(cmds('thin').includes('lvcreate -V 160M -T vg_cloud/thinpool -n vm01'), 'virtual size in MiB = LE × PE size');
  assert.ok(at({ layout: 'thin', diskPE: 48, peMiB: 8 }).commands.some((c) => c.cmd === 'lvcreate -V 320M -T vg_cloud/thinpool -n vm01'));
  assert.ok(cmds('luks-above').includes('mkfs.ext4 /dev/mapper/crypt_secret'));
  const failed = at({ size: 40 }).commands;
  assert.deepEqual(failed.filter((c) => c.failed).map((c) => c.cmd), ['lvcreate -l 40 -n data vg_demo']);
  assert.ok(!failed.some((c) => c.cmd.startsWith('mkfs')));
});

test('counters: raw, allocated, free, logical and the ratio of the original presets', () => {
  const want = { basic: [32, 16, 16, 1], span: [48, 36, 36, 1], striped: [72, 36, 36, 1], 'luks-below': [56, 32, 32, 1], 'luks-above': [40, 28, 28, 1] };
  for (const [id, [raw, alloc, logical, ratio]] of Object.entries(want)) {
    const s = preset(id);
    assert.deepEqual([s.raw, s.allocated, s.logical, s.ratio], [raw, alloc, logical, ratio], id);
    assert.equal(s.free, raw - alloc, id);
    assert.equal(s.allocated, s.lvs.reduce((a, lv) => a + lv.pe, 0), id);
  }
});

test('RAID member devices: rimage per copy or member, stripe lane per stripe', () => {
  assert.deepEqual(preset('raid1').lvs[0].members.map((m) => m.name), ['important_rimage_0', 'important_rimage_1']);
  assert.deepEqual(preset('striped').lvs[0].members.map((m) => m.name), ['scratch_stripe_0', 'scratch_stripe_1', 'scratch_stripe_2']);
  assert.equal(preset('basic').lvs[0].members, undefined);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and for a failed LV', () => {
  for (const pr of logic.presets) {
    const s = at(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
  const f = at({ size: 90 });
  assert.deepEqual(JSON.parse(JSON.stringify(f)), f);
});

test('deterministic, and initial does not mutate its params', () => {
  const p = P({ layout: 'raid5', disks: 4, width: 4, size: 30 });
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
    assert.ok(logic.LAYOUTS.includes(pr.params.layout), `${pr.id}: layout`);
    assert.ok(logic.CRYPT.includes(pr.params.crypt), `${pr.id}: crypt`);
    assert.ok(at(pr.params).lvs.every((lv) => lv.ok), `${pr.id}: allocates`);
    assert.ok(html.includes(`'${pr.id}'`) || new RegExp(`\\b${pr.id}:`).test(html), `${pr.id}: label in index.html`);
  }
});
