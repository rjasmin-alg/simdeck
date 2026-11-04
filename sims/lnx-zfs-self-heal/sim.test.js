// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-zfs-self-heal's model (rules: SPEC.md). Run: node --test sims/lnx-zfs-self-heal/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps(P(over)));
const cksum = (s) => Object.fromEntries(Object.entries(s.counters).map(([d, c]) => [d, c.cksum]));
const data = (s, k) => s.disks[k].blocks.slice(0, 8).map((b) => b.data).join('');
/** Run a custom script over the model's step function (the scenes are fixed; this tests the rules directly). */
function run(over, ops) {
  const p = P(over);
  const saved = logic.SCENES[p.scene];
  logic.SCENES[p.scene] = ops;
  try { return kit.stateAt(logic, p, ops.length); } finally { logic.SCENES[p.scene] = saved; }
}

// ── tie-breaks first ──

test('tie-break (rule 7): a read takes the first device of the vdev first, and stops at a good copy', () => {
  // sdb is rotten, sda is good: a read returns sda and never looks at sdb, so the rot stays unseen
  const s = run({ scene: 'read-heals' }, [{ op: 'corrupt', copy: 1, block: 3 }, { op: 'read', block: 3 }]);
  assert.deepEqual(s.last.read.map((r) => [r.copy, r.ok]), [[0, true]]);
  assert.equal(s.last.result, 'ok');
  assert.equal(s.disks[1].blocks[3].rotten, true);
  assert.deepEqual(cksum(s), { sda: 0, sdb: 0, top: 0 });
});

test('tie-break (rule 7): both copies bad → one permanent error, a CKSUM per bad copy, the file listed once', () => {
  const s = at({ scene: 'both-bad' }, 9);
  assert.equal(s.last.block, 6);
  assert.equal(s.last.result, 'permanent');
  assert.deepEqual(cksum(s), { sda: 1, sdb: 1, top: 1 });
  assert.equal(s.scrub.errors, 1);
  assert.deepEqual(s.permanent, [6]);
  // a second failing block of the same file still lists the file once
  const t = run({ scene: 'both-bad', redundancy: 'single' }, [
    { op: 'corrupt', copy: 0, block: 3 }, { op: 'corrupt', copy: 0, block: 5 }, { op: 'read', block: 3 }, { op: 'read', block: 5 }]);
  assert.deepEqual(t.permanent, [3, 5]);
  assert.deepEqual(logic.permanentFiles(t), ['film.mkv']);
});

test('tie-break (rule 7): md reads alternate between the copies, sda first', () => {
  const s = run({ scene: 'md-contrast', redundancy: 'md-mirror' }, [{ op: 'read', block: 0 }, { op: 'read', block: 0 }, { op: 'read', block: 0 }]);
  assert.equal(s.mdReads, 3);
  assert.deepEqual(s.last.read.map((r) => r.copy), [0]);
  assert.deepEqual(at({ scene: 'md-contrast', redundancy: 'md-mirror' }, 3).last.read.map((r) => r.copy), [1]);
});

test('tie-break (rule 8): a copy index wraps onto the copies there are; a second corruption changes nothing more', () => {
  const s = at({ scene: 'scrub-repairs', redundancy: 'single' }, 2);
  assert.equal(data(s, 0), 'ABCdEfGH');
  const t = at({ scene: 'both-bad', redundancy: 'single' }, 2);
  assert.equal(t.last.again, true);
  assert.equal(data(t, 0), 'ABCDEFgH');
});

// ── rules ──

test('rule 1: each pointer stores the checksum of the block it points to; any changed content fails it', () => {
  const s = logic.initial(P({}));
  assert.equal(s.ptrs.length, 8);
  s.ptrs.forEach((p) => assert.equal(p.sum, logic.checksum(logic.good(p.block))));
  const sums = new Set('ABCDEFGHabcdefgh'.split('').map(logic.checksum));
  assert.equal(sums.size, 16);
  for (const ch of 'ABCDEFGH') assert.notEqual(logic.checksum(ch), logic.checksum(logic.rot(ch)));
  assert.equal(logic.rot('D'), 'd');            // one bit: 0x44 → 0x64
  // md: the filesystem's pointers carry no checksum
  logic.initial(P({ redundancy: 'md-mirror' })).ptrs.forEach((p) => assert.equal(p.sum, null));
});

test('rule 1: corruption is silent: no counter moves when a copy rots', () => {
  const s = at({ scene: 'scrub-repairs' }, 2);
  assert.equal(data(s, 1), 'ABCdEfGH');
  assert.deepEqual(cksum(s), { sda: 0, sdb: 0, top: 0 });
  Object.values(s.counters).forEach((c) => { assert.equal(c.read, 0); assert.equal(c.write, 0); });
});

test('rule 2: a read of a bad copy on a mirror returns the good one and rewrites the bad one (read-heals)', () => {
  const s = at({ scene: 'read-heals' }, 3);
  assert.equal(s.last.block, 4);
  assert.deepEqual(s.last.read.map((r) => [r.copy, r.ok]), [[0, false], [1, true]]);
  assert.equal(s.last.result, 'healed');
  assert.equal(s.last.served, 1);
  assert.deepEqual(s.last.wrote, [0]);
  assert.equal(s.disks[0].blocks[4].data, 'E');
  assert.equal(s.disks[0].blocks[4].healed, true);
  assert.deepEqual(cksum(s), { sda: 1, sdb: 0, top: 0 });
  assert.deepEqual(s.permanent, []);
  // the next read of block 4 is served by sda again, with no new error
  const t = end({ scene: 'read-heals' });
  assert.deepEqual(t.last.read.map((r) => [r.copy, r.ok]), [[0, true]]);
  assert.deepEqual(cksum(t), { sda: 1, sdb: 0, top: 0 });
  assert.equal(t.scrub, null);
});

test('rule 3: a scrub reads every copy of every allocated block, repairs as in rule 2, skips free blocks (scrub-repairs)', () => {
  assert.deepEqual(logic.scrubPlan(), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(logic.BLOCKS, 10);               // blocks 8 and 9 are free and never read
  for (let n = 3; n <= 10; n++) assert.equal(at({}, n).last.read.length, 2, `step ${n} reads both copies`);
  const s = end({});
  assert.equal(logic.steps(P({})), 10);
  assert.equal(data(s, 1), 'ABCDEFGH');
  assert.deepEqual(cksum(s), { sda: 0, sdb: 2, top: 0 });
  assert.deepEqual(s.scrub, { at: 7, done: true, repaired: 2, errors: 0, kind: 'zfs' });
  assert.deepEqual(s.permanent, []);
  assert.equal(at({}, 9).scrub.done, false);
  assert.equal(at({}, 6).last.result, 'healed');
  assert.equal(at({}, 8).last.result, 'healed');
});

test('rule 4: no good copy → a permanent error naming the file (both-bad)', () => {
  const s = end({ scene: 'both-bad' });
  assert.deepEqual(logic.permanentFiles(s), ['film.mkv']);
  assert.deepEqual(s.scrub, { at: 7, done: true, repaired: 0, errors: 1, kind: 'zfs' });
  assert.equal(data(s, 0), 'ABCDEFgH');        // nothing to repair from
  assert.equal(data(s, 1), 'ABCDEFgH');
  assert.equal(logic.fileOf(6), 'film.mkv');
  assert.equal(logic.fileOf(8), null);
});

test('rule 5: a single disk detects but cannot repair (single-disk)', () => {
  const s = at({ scene: 'single-disk', redundancy: 'single' }, 2);
  assert.equal(s.disks.length, 1);
  assert.equal(s.last.result, 'permanent');
  assert.deepEqual(cksum(s), { sda: 1, top: 1 });
  assert.deepEqual(logic.permanentFiles(s), ['film.mkv']);
  const t = end({ scene: 'single-disk', redundancy: 'single' });
  assert.equal(t.last.result, 'permanent');      // still broken on the next read
  assert.deepEqual(cksum(t), { sda: 2, top: 2 });
  assert.equal(data(t, 0), 'ABCdEFGH');
});

test('rule 5: copies=2 on a single disk repairs from the second copy on the same disk', () => {
  const s = at({ scene: 'single-disk', redundancy: 'single', copies2: true }, 2);
  assert.deepEqual(s.disks.map((d) => [d.name, d.copy]), [['sda', 1], ['sda', 2]]);
  assert.equal(s.last.result, 'healed');
  assert.deepEqual(cksum(s), { sda: 1, top: 0 });
  assert.equal(data(s, 0), 'ABCDEFGH');
  assert.deepEqual(end({ scene: 'single-disk', redundancy: 'single', copies2: true }).permanent, []);
  // copies2 means nothing on a mirror
  assert.equal(logic.initial(P({ copies2: true })).disks.length, 2);
  assert.deepEqual(logic.devices(P({ copies2: true })), ['sda', 'sdb']);
});

test('rule 6: md returns whatever copy it reads, unchecked; a check counts the mismatch, not which copy is right', () => {
  const p = { scene: 'md-contrast', redundancy: 'md-mirror' };
  assert.equal(at(p, 2).last.result, 'silent-bad');       // sda: the rotten copy, and no error
  assert.equal(at(p, 3).last.result, 'ok');               // sdb: the good one: same read, other answer
  const c = at(p, 4);
  assert.equal(c.last.op, 'check');
  assert.deepEqual(c.last.blocks, [3]);
  assert.equal(c.mismatch, 8);                            // one 4K block = 8 sectors
  assert.equal(data(c, 0), 'ABCdEFGH');                   // nothing changed
  assert.equal(data(c, 1), 'ABCDEFGH');
  assert.deepEqual(cksum(c), { sda: 0, sdb: 0, top: 0 });
  assert.deepEqual(c.permanent, []);
});

test('rule 6: md repair writes the first device\'s copy over the other, right or wrong', () => {
  const p = { scene: 'md-contrast', redundancy: 'md-mirror' };
  const r = at(p, 5);
  assert.equal(r.last.op, 'repair');
  assert.equal(data(r, 1), 'ABCdEFGH');                   // the rot is now on both disks
  assert.equal(r.disks[1].blocks[3].rotten, true);
  assert.equal(r.mismatch, 8);
  assert.equal(end(p).last.result, 'silent-bad');
  // a per-block walk under md is a check: counts each differing block, also over the free blocks at the end
  const w = end({ scene: 'scrub-repairs', redundancy: 'md-mirror' });
  assert.equal(w.mismatch, 16);
  assert.deepEqual(w.last.extra, [8, 9]);
  assert.equal(data(w, 1), 'ABCdEfGH');
});

test('the same scene on ZFS: check and repair are whole scrubs that heal', () => {
  const s = end({ scene: 'md-contrast' });
  assert.equal(data(s, 0), 'ABCDEFGH');
  assert.deepEqual(cksum(s), { sda: 1, sdb: 0, top: 0 });
  assert.equal(s.scrub.done, true);
});

test('no device error is ever reported: READ and WRITE stay 0 in every run (rules 2, 4, 5)', () => {
  for (const scene of logic.SCENE_IDS) for (const redundancy of logic.REDUNDANCY) for (const copies2 of [false, true]) {
    const s = end({ scene, redundancy, copies2 });
    Object.values(s.counters).forEach((c) => { assert.equal(c.read, 0); assert.equal(c.write, 0); });
  }
});

test('rule 4: a block re-read or found again is listed once', () => {
  assert.deepEqual(end({ scene: 'single-disk', redundancy: 'single' }).permanent, [3]);
});

test('rule 6: md compares the free blocks too (walk and whole check)', () => {
  const md = { scene: 'md-contrast', redundancy: 'md-mirror' };
  const c = run(md, [{ op: 'corrupt', copy: 1, block: 8 }, { op: 'check' }]);
  assert.deepEqual(c.last.blocks, [8]);
  assert.equal(c.mismatch, 8);
  const w = run(md, [{ op: 'corrupt', copy: 1, block: 9 }].concat(logic.ALLOCATED.map((b) => ({ op: 'scrub', block: b }))));
  assert.deepEqual(w.last.extra, [8, 9]);
  assert.equal(w.mismatch, 8);
});

test('rule 3: on ZFS a whole-pass check reads every copy and heals (no read before it)', () => {
  const s = run({ scene: 'md-contrast' }, [{ op: 'corrupt', copy: 1, block: 3 }, { op: 'corrupt', copy: 1, block: 5 }, { op: 'check' }]);
  assert.equal(data(s, 1), 'ABCDEFGH');
  assert.deepEqual(cksum(s), { sda: 0, sdb: 2, top: 0 });
  assert.deepEqual(s.scrub, { at: 7, done: true, repaired: 2, errors: 0, kind: 'zfs' });
  assert.deepEqual(s.last.blocks, [3, 5]);
  // on one disk the pass reads the bad block again and counts again
  assert.deepEqual(cksum(at({ scene: 'md-contrast', redundancy: 'single' }, 4)), { sda: 3, top: 3 });
});

test('rule 8: corrupting a damaged copy again leaves its marks alone', () => {
  const s = run({ scene: 'both-bad', redundancy: 'md-mirror' }, [{ op: 'corrupt', copy: 0, block: 3 }, { op: 'repair' }, { op: 'corrupt', copy: 1, block: 3 }]);
  assert.equal(s.last.again, true);
  assert.equal(s.disks[1].blocks[3].healed, true);
});

test('step bookkeeping: steps per scene', () => {
  const want = { 'scrub-repairs': 10, 'read-heals': 6, 'both-bad': 10, 'single-disk': 6, 'md-contrast': 6 };
  for (const [scene, n] of Object.entries(want)) for (const redundancy of logic.REDUNDANCY) {
    assert.equal(logic.steps(P({ scene, redundancy })), n);
  }
  assert.equal(logic.norm({ scene: 'nope', redundancy: 'raidz' }).scene, 'scrub-repairs');
  assert.equal(logic.norm({ redundancy: 'raidz' }).redundancy, 'mirror');
});

// ── generic checks every sim keeps ──

const ALL = [];
for (const scene of logic.SCENE_IDS) for (const redundancy of logic.REDUNDANCY) for (const copies2 of [false, true]) ALL.push({ scene, redundancy, copies2 });

test('state is JSON-safe at every step', () => {
  for (const over of ALL) {
    const p = P(over);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of ALL) {
    const p = P(over);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const over of ALL) {
    const p = P(over);
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
