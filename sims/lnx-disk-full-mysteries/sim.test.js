// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-disk-full-mysteries' model. Run: node --test sims/lnx-disk-full-mysteries/
// Rules and numbers: SPEC.md. Tie-breaks first, then one block per rule, the presets' numbers, then the generic block.
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
const outText = (s) => s.tool.lines.map((l) => l.text);
const OBR = {}, INO = { scene: 'inodi' }, EMPTY = { scene: 'inodi-kratko', fileSize: 0 }, XFS = { scene: 'inodi-kratko', fstype: 'xfs' };

// ── tie-breaks ──

test('tie-break: a new inode takes the lowest free number (ext4 from 12, XFS from 131), and a freed one is reused', () => {
  assert.equal(logic.entryOf(at(OBR, 0), logic.MNT, 'app.log').ino, 12);
  assert.equal(logic.entryOf(at({ fstype: 'xfs' }, 0), logic.MNT, 'app.log').ino, 131);
  const s = at(INO, 1);
  assert.equal(logic.entryOf(s, logic.MNT, 'sess').ino, 12);
  assert.equal(s.dirs[logic.MNT + '/sess'][0].ino, 13, 'the files follow the directory');
  // after the restart the new app.log gets 12 again: the old one was freed
  assert.equal(logic.entryOf(at(OBR, 6), logic.MNT, 'app.log').ino, 12);
  // a gap below a used number is filled first
  const g = at(OBR, 0);
  g.inodes['14'] = { type: 'file', n: 3, nlink: 1, openBy: [], size: 0, blocks: 0 };
  assert.equal(logic.lowestFree(g), 13);
  delete g.inodes['12'];
  assert.equal(logic.lowestFree(g), 12);
});

test('tie-break: a create checks the inode first, so with neither left the cause is inodes', () => {
  const s = at(INO, 1);
  s.fs.blocksUsed = s.fs.blocks - s.fs.reserve;            // no blocks either
  assert.equal(logic.avail(s), 0);
  assert.deepEqual(logic.createOne(s, logic.MNT, 'x', 'file'), { err: 'ENOSPC', cause: 'inodes' });
});

test('tie-break: a burst stops at the first failure; nothing after it is created', () => {
  const s = at(INO, 1);
  assert.equal(s.lastEvent.made, 65524);
  assert.equal(s.fs.inodesUsed, 65536);
  assert.equal(at(INO, 2).fs.inodesUsed, 65536, 'touch made nothing');
});

test('tie-break: -h sizes round up, one decimal under 10, 0 for nothing; Use% rounds up', () => {
  assert.equal(logic.human(0), '0');
  assert.equal(logic.human(4096), '4.0K');
  assert.equal(logic.human(6 * 4096), '24K');
  assert.equal(logic.human(5 * 4096), '20K');
  assert.equal(logic.human(10230), '10K', '9.99K rounds up to 10K, not 10.0K');
  assert.equal(logic.human(235839 * 4096), '922M', '921.25 MiB rounds up');
  assert.equal(logic.human(253035 * 4096), '989M');
  assert.equal(logic.human(1024 * 1024 * 1024), '1.0G');
  assert.equal(logic.human(1024 * 1024 * 1024 + 1), '1.1G');
  assert.equal(logic.pct(6, 235839), 1);
  assert.equal(logic.pct(65531, 170314), 28);
  assert.equal(logic.pct(1, 0), 100);
  assert.equal(logic.pct(0, 0), 0);
});

test('tie-break: df -h prints the book\'s lines exactly (column widths as coreutils)', () => {
  assert.deepEqual(logic.dfh(at(OBR, 0)).lines, [
    'Filesystem      Size  Used Avail Use% Mounted on',
    '/dev/vdb1       989M   24K  922M   1% /mnt/vjezba'
  ]);
  assert.deepEqual(logic.dfh(at({ fstype: 'xfs' }, 0)).lines.slice(1), ['/dev/vdb1       959M   51M  909M   6% /mnt/vjezba']);
});

test('tie-break (rule 7): df -h first; df -i when blocks look free; du when they are not; lsof +L1 only when df and du disagree', () => {
  assert.equal(logic.nextCheck(at(OBR, 1)), null, 'nothing failed yet');
  assert.equal(logic.nextCheck(at(OBR, 2)), 'dfh');
  assert.equal(logic.nextCheck(at(OBR, 4)), 'lsof', 'df 922M vs du 20K');
  assert.equal(logic.cause(at(OBR, 5)), 'deleted-open');
  assert.equal(logic.nextCheck(at(INO, 2)), 'dfh');
  assert.equal(logic.nextCheck(at(INO, 3)), 'dfi', 'Avail 666M: blocks look free');
  assert.equal(logic.nextCheck(at(INO, 4)), null);
  assert.equal(logic.cause(at(INO, 4)), 'inodes');
  assert.equal(logic.nextCheck(at(XFS, 3)), 'du', 'XFS full: blocks, so du, not df -i');
  assert.equal(logic.cause(at(XFS, 4)), null, 'df -i on a full XFS is not the answer: IFree is not 0');
});

test('tie-break (rule 7): the fs\'s own blocks (24K vs 20K, XFS 51M vs 0) are not a disagreement', () => {
  const s = at(OBR, 0);
  s.failed = true;
  s.checks = { dfh: { size: s.fs.blocks, used: s.fs.blocksUsed, avail: 0, pct: 100 }, du: { blocks: 5 }, dfi: null, lsof: null };
  assert.equal(logic.nextCheck(s), null);
  assert.equal(logic.cause(s), 'blocks');
  const x = at({ fstype: 'xfs' }, 0);
  x.failed = true;
  x.checks = { dfh: { size: x.fs.blocks, used: 13000, avail: 0, pct: 100 }, du: { blocks: 0 }, dfi: null, lsof: null };
  assert.equal(logic.cause(x), 'blocks');
  // just over 10 % is one
  x.checks.dfh.used = Math.floor(0.1 * x.fs.blocks) + 1;
  assert.equal(logic.nextCheck(x), 'lsof');
});

test('tie-break (rule 7): a change to the filesystem forgets the readings; a freeing clears the failure', () => {
  assert.notEqual(at(OBR, 4).checks.dfh, null);
  assert.equal(at(OBR, 5).checks.dfh.avail, 0, 'lsof changes nothing: readings kept');
  assert.equal(at(OBR, 3).failed, true, 'rm of an open file frees nothing');
  assert.equal(at(OBR, 6).failed, false);
  assert.equal(at({ holdOpen: false }, 3).failed, false, 'rm of a closed file frees at once');
  assert.equal(at(INO, 5).failed, false);
  // freeing only inodes clears it too: empty files in a directory that holds no block
  const p0 = P({ scene: 'inodi', fileSize: 0 });
  const s4 = kit.stateAt(logic, p0, 4);
  const dir = logic.entryOf(s4, logic.MNT, 'sess').ino;
  s4.inodes[String(dir)].blocks = 0; s4.fs.blocksUsed -= 1;
  const s5 = logic.step(s4, 5, p0);
  assert.equal(s5.lastEvent.delta.blocks, 0);
  assert.equal(s5.failed, false);
  assert.equal(at(INO, 5).checks.dfi, null);
});

test('tie-break (rule 7): Avail decides, not Use% (1 block left reads 100 %); IFree decides, not IUse%', () => {
  const s = at(INO, 2);
  s.checks = { dfh: { size: s.fs.blocks, used: 235844, avail: 1, pct: 100 }, dfi: null, du: null, lsof: null };
  assert.equal(logic.nextCheck(s), 'dfi');
  s.checks.dfi = { inodes: 206720, used: 206678, free: 42, pct: 100 };
  assert.equal(logic.cause(s), null, 'IUse% 100 with IFree 42 is not out of inodes');
  s.checks.dfi = { inodes: 65536, used: 65536, free: 0, pct: 100 };
  assert.equal(logic.cause(s), 'inodes');
});

test('tie-break (rule 7): exactly 10 % is not a disagreement, just under neither, just over is', () => {
  const s = at(OBR, 2);
  s.checks = { dfh: { size: 1000, used: 100, avail: 0, pct: 100 }, du: { blocks: 0 }, dfi: null, lsof: null };
  assert.equal(logic.cause(s), 'blocks');
  s.checks.du.blocks = 1;
  assert.equal(logic.cause(s), 'blocks');
  s.checks.dfh.used = 101;
  s.checks.du.blocks = 0;
  assert.equal(logic.nextCheck(s), 'lsof');
});

// ── rule 1: a file costs one inode plus ⌈size ÷ 4 KiB⌉ blocks ──

test('rule 1: 0 B takes no block, 1 B and 4 KiB one, 4097 B two, 16 KiB four; each file one inode', () => {
  for (const [size, per] of [[0, 0], [1, 1], [4096, 1], [16384, 4]]) {
    const s = at({ scene: 'inodi', fileSize: size }, 0);
    const b = s.fs.blocksUsed, i = s.fs.inodesUsed;
    const r = logic.fillFiles(s, logic.MNT, size, 10);
    assert.equal(r.made, 10);
    assert.equal(s.fs.blocksUsed - b, 10 * per, `${size} B`);
    assert.equal(s.fs.inodesUsed - i, 10);
  }
  const s = at(OBR, 0);
  const node = logic.inodeOf(s, 12);
  logic.writeTo(s, node, 4097);
  assert.equal(node.blocks, 2);
});

// ── rule 2: ext4's inodes are fixed; 11 used when fresh ──

test('rule 2: ext4 has 65 536 inodes, 11 used fresh; the 65 525th new one fails', () => {
  const s0 = at(INO, 0);
  assert.equal(s0.fs.inodes, 65536);
  assert.equal(s0.fs.inodesUsed, 11);
  const s = at(INO, 1);
  assert.equal(s.fs.inodes, 65536, 'the count does not grow');
  assert.equal(s.lastEvent.made + 1, 65525, 'sess/ plus 65 524 files');
  assert.equal(s.lastEvent.cause, 'inodes');
  assert.deepEqual(outText(s), ['app[4242]: create /mnt/vjezba/sess/s065525: No space left on device']);
});

// ── rule 3: ENOSPC from either cause, the same text ──

test('rule 3: no free inode and no free block give the same message', () => {
  const ino = at(INO, 2), blk = at({ scene: 'inodi', fileSize: 16384 }, 1);
  assert.equal(ino.lastError, 'ENOSPC');
  assert.equal(ino.lastEvent.cause, 'inodes');
  assert.equal(blk.lastError, 'ENOSPC');
  assert.equal(blk.lastEvent.cause, 'blocks');
  assert.ok(outText(ino)[1].endsWith(': No space left on device'));
  assert.ok(outText(blk)[0].endsWith(': No space left on device'));
});

test('rule 3: a write that runs out keeps what it got; with 16 KiB files the blocks run out first', () => {
  const s = at(OBR, 2);
  assert.equal(s.lastEvent.wrote, 31039);
  assert.equal(logic.inodeOf(s, 12).size, 965996544);
  assert.equal(logic.avail(s), 0);
  const b = at({ scene: 'inodi', fileSize: 16384 }, 1);
  assert.equal(b.lastEvent.made, 58960, '58 959 whole files and one with 2 of its 4 blocks');
  assert.deepEqual(outText(b), ['app[4242]: write /mnt/vjezba/sess/s058960: No space left on device'], 'the write of the last file');
  assert.equal(b.fs.inodesUsed, 58972);
  assert.equal(logic.avail(b), 0);
  assert.equal(logic.dfi(b).pct, 90);
});

test('rule 3: a create with a free inode works with no free block (an empty file needs none)', () => {
  const s = at(XFS, 2);
  assert.equal(s.lastError, null);
  assert.equal(s.lastEvent.made, 1);
  assert.equal(logic.avail(s), 0);
});

// ── rule 4: df reads the counters, du walks the names ──

test('rule 4: fresh ext4 is df 24K vs du 20K (one block with no name); fresh XFS 51M vs 0', () => {
  const s = at(OBR, 0);
  assert.equal(s.fs.blocksUsed, 6);
  assert.equal(logic.duBlocks(s, logic.MNT), 5);
  const x = at({ fstype: 'xfs' }, 0);
  assert.equal(x.fs.blocksUsed, 13000);
  assert.equal(logic.duBlocks(x, logic.MNT), 0);
});

test('rule 4: after rm of the open log, df says 922M used and du 20K', () => {
  const s = at(OBR, 4);
  assert.deepEqual(outText(s), [
    logic.PROMPT + 'df -h /mnt/vjezba',
    'Filesystem      Size  Used Avail Use% Mounted on',
    '/dev/vdb1       989M  922M     0 100% /mnt/vjezba',
    logic.PROMPT + 'du -sh /mnt/vjezba',
    '20K\t/mnt/vjezba'
  ]);
  assert.equal(logic.heldBlocks(s), 235839);
});

// ── rule 5: freeing needs count 0 and no open descriptor ──

test('rule 5: rm of a held file removes the name, keeps the blocks, and the restart frees them', () => {
  const s = at(OBR, 3);
  assert.equal(logic.entryOf(s, logic.MNT, 'app.log'), null);
  assert.equal(logic.inodeOf(s, 12).nlink, 0);
  assert.deepEqual(s.lastEvent.free, { ino: 12, what: 'postponed', blocks: 235839, inodes: 1 });
  assert.equal(s.lastEvent.changed.blocks, false);
  assert.ok(logic.orphan(s, 12));
  const r = at(OBR, 6);
  assert.equal(r.lastEvent.free.blocks, 235839);
  assert.equal(r.fs.blocksUsed, 6);
  assert.equal(r.procs[0].pid, 4243);
  assert.deepEqual(r.procs[0].fds.map((f) => f.ino), [12], 'the new app holds a new, empty app.log');
  assert.equal(logic.inodeOf(r, 12).size, 0);
});

test('rule 5: with nobody holding it, rm frees at once and lsof +L1 prints nothing', () => {
  const s = at({ holdOpen: false }, 3);
  assert.equal(s.lastEvent.free.what, 'freed');
  assert.equal(s.fs.blocksUsed, 6);
  const l = at({ holdOpen: false }, 5);
  assert.deepEqual(outText(l), [logic.PROMPT + 'lsof +L1']);
  assert.equal(l.checks.lsof.count, 0);
  assert.equal(at({ holdOpen: false }, 6).lastEvent.free.blocks, 0);
});

test('rule 5: lsof +L1 lists only open files whose link count is 0', () => {
  assert.deepEqual(logic.lsofL1(at(OBR, 2)), [], 'open but named');
  const lines = logic.lsofL1(at(OBR, 3));
  assert.deepEqual(lines, [
    'COMMAND  PID USER      FD TYPE DEVICE  SIZE/OFF NLINK NODE NAME',
    'app     4242 student   3w  REG 252,17 965996544     0   12 /mnt/vjezba/app.log (deleted)'
  ]);
  assert.equal(at(OBR, 5).checks.lsof.count, 1, 'the header is not a file');
});

// ── rule 6: XFS makes inodes on demand ──

test('rule 6: XFS goes past 65 524 files and stops on blocks; chunks of 64 inodes take 8 blocks each', () => {
  const s = at(XFS, 1);
  assert.equal(s.lastEvent.made, 206673);
  assert.equal(s.lastEvent.cause, 'blocks');
  assert.equal(s.fs.icount % 64, 0);
  // every block is a file's data block or a chunk's; the last file got what was left (here nothing)
  const data = s.fs.blocksUsed - 13000 - (s.fs.icount - 64) / 64 * 8;
  assert.equal(data, 206672);
  assert.equal(logic.avail(s), 0);
});

test('rule 6: XFS df -i reports allocated + what the free space could hold, capped at 25 %', () => {
  const s0 = at(XFS, 0);
  assert.equal(s0.fs.inodes, 523776);
  assert.deepEqual(logic.dfi(s0).lines[1].split(/ +/), ['/dev/vdb1', '523776', '3', '523773', '1%', '/mnt/vjezba']);
  const s = at(XFS, 4);
  assert.deepEqual(logic.dfi(s).lines[1].split(/ +/), ['/dev/vdb1', '206720', '206678', '42', '100%', '/mnt/vjezba']);
});

test('rule 6: empty files on XFS reach the 25 % cap: an inode wall at 523 772 files, df -h 32 %', () => {
  const s = at({ scene: 'inodi-kratko', fstype: 'xfs', fileSize: 0 }, 1);
  assert.equal(s.lastEvent.made, 523772);
  assert.equal(s.lastEvent.cause, 'inodes');
  assert.equal(s.fs.inodesUsed, 523776);
  assert.equal(logic.dfh(s).pct, 32);
});

test('rule 6: XFS df -i follows the free space while a write fills it; the gauge counts as changed', () => {
  const s = at({ fstype: 'xfs' }, 1);
  assert.equal(s.fs.inodes, 64 + (232504 - 204800) * 8);
  assert.equal(s.fs.inodesUsed, 4);
  assert.equal(s.lastEvent.changed.inodes, true);
});

test('rule 6: a create that finds no blocks for a new XFS chunk fails at the create, naming the next file', () => {
  const s = at({ scene: 'inodi', fstype: 'xfs' }, 0);
  s.fs.blocksUsed = s.fs.blocks - 7;                 // 7 blocks free: no room for a chunk of 8
  s.dirs[logic.MNT + '/d'] = [];
  const r = logic.fillFiles(s, logic.MNT + '/d', 0, Infinity);
  assert.deepEqual([r.made, r.cause, r.at], [61, 'blocks', 'create'], 'the 61 free inodes of the first chunk, then no chunk');
});

test('rule 6: XFS keeps the chunks its inodes need, rounded up', () => {
  const s = at({ fstype: 'xfs' }, 0);
  s.fs.icount = 256; s.fs.inodesUsed = 65; s.fs.blocksUsed += 24;
  logic.shrinkChunks(s);
  assert.equal(s.fs.icount, 128);
  assert.equal(s.fs.blocksUsed, 13000 + 8);
});

test('rule 6: XFS gives empty chunks back on rm -r, and says so', () => {
  const r = at({ scene: 'inodi', fstype: 'xfs' }, 5);
  assert.equal(r.lastEvent.free.blocks, 245504 - 13000, 'files and chunks: all of Used above the fresh 51M');
});

test('rule 6: XFS gives empty chunks back on rm -r (counters)', () => {
  const s = at({ scene: 'inodi', fstype: 'xfs' }, 5);
  assert.equal(s.fs.icount, 64);
  assert.equal(s.fs.inodesUsed, 4, 'the three of a fresh XFS and test, which touch could make here');
  assert.equal(s.fs.blocksUsed, 13000);
});

// ── presets: the task's numbers ──

test('preset obrisana-otvorena: 87 %, then 100 % with Avail 0, then 24K and 1 % after the restart', () => {
  assert.equal(logic.steps(P(OBR)), 6);
  assert.equal(logic.dfh(at(OBR, 1)).pct, 87);
  const full = logic.dfh(at(OBR, 2));
  assert.equal(full.lines[1], '/dev/vdb1       989M  922M     0 100% /mnt/vjezba');
  assert.equal(outText(at(OBR, 6)).slice(-1)[0], '/dev/vdb1       989M   24K  922M   1% /mnt/vjezba');
});

test('preset obrisana-otvorena on XFS: 959M full, du 0, lsof NODE 131', () => {
  const s = at({ fstype: 'xfs' }, 4);
  assert.equal(outText(s)[2], '/dev/vdb1       959M  959M     0 100% /mnt/vjezba');
  assert.equal(outText(s)[4], '0\t/mnt/vjezba');
  assert.match(logic.lsofL1(at({ fstype: 'xfs' }, 5))[1], / 131 \/mnt\/vjezba\/app\.log \(deleted\)$/);
});

test('preset inodi: 65 524 files, df -h 256M and 28 %, df -i 100 %, rm -r back to 11 inodes and 24K', () => {
  assert.equal(logic.steps(P(INO)), 5);
  assert.equal(outText(at(INO, 3))[2], '/dev/vdb1       989M  256M  666M  28% /mnt/vjezba');
  assert.equal(outText(at(INO, 4))[2], '/dev/vdb1       65536 65536     0  100% /mnt/vjezba');
  const s = at(INO, 5);
  assert.equal(s.fs.inodesUsed, 11);
  assert.equal(s.fs.blocksUsed, 6);
  assert.deepEqual(s.lastEvent.free, { blocks: 65525, inodes: 65525, postponed: 0 });
});

test('preset inodi-prazne: empty files, df -h 28K and 1 %, df -i 100 %', () => {
  assert.equal(logic.steps(P(EMPTY)), 4);
  assert.equal(outText(at(EMPTY, 3))[2], '/dev/vdb1       989M   28K  922M   1% /mnt/vjezba');
  assert.equal(logic.dfi(at(EMPTY, 4)).pct, 100);
});

test('preset xfs: 206 673 files, df -h 100 %', () => {
  assert.equal(logic.steps(P(XFS)), 4);
  assert.equal(at(XFS, 1).lastEvent.made, 206673);
  assert.equal(logic.dfh(at(XFS, 3)).pct, 100);
});

test('page marks: the gauge that moved this step', () => {
  assert.deepEqual(at(OBR, 1).lastEvent.changed, { blocks: true, inodes: false });
  assert.deepEqual(at(OBR, 3).lastEvent.changed, { blocks: false, inodes: false });
  assert.deepEqual(at(OBR, 6).lastEvent.changed, { blocks: true, inodes: false }, 'one inode freed, one made');
  assert.deepEqual(at(INO, 1).lastEvent.changed, { blocks: true, inodes: true });
  assert.deepEqual(at(INO, 3).lastEvent.changed, { blocks: false, inodes: false });
  assert.equal(at(OBR, 3).gone[0].name, 'app.log');
});

// ── generic checks every sim keeps ──

const ALL = [OBR, { holdOpen: false }, { fstype: 'xfs' }, INO, EMPTY, XFS, { scene: 'inodi', fileSize: 16384 }, { scene: 'inodi', fstype: 'xfs', fileSize: 0 }];

test('state is JSON-safe at every step', () => {
  for (const o of ALL) {
    for (let n = 0; n <= logic.steps(P(o)); n++) {
      const s = at(o, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of ALL) {
    const p = P(o);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P(OBR);
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps(p); n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the default scene');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const scenes = [...html.matchAll(/scene:\s*'([^']+)'/g)].map((m) => m[1]);
  for (const sc of scenes) assert.ok(logic.SCENE_IDS.includes(sc), `scene ${sc}`);
});
