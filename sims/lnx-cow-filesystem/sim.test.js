// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-cow-filesystem's model (rules: SPEC.md). Run: node --test sims/lnx-cow-filesystem/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const sp = (s) => logic.space(logic.fsOf(s));
const tree = (s, name) => s.trees.find((t) => t.name === name);
const ptr = (s, name) => tree(s, name).files.a;
const refs = (s) => Object.fromEntries(s.blocks.map((b) => [b.id, b.refs]));
const ids = (s) => s.blocks.map((b) => b.id);
const row = (s, name) => sp(s).trees.find((t) => t.name === name);
const usedRun = (over) => { const p = P(over); const out = []; for (let n = 1; n <= logic.steps(p); n++) out.push(sp(at(over, n)).used); return out; };
/** A pool with a file of `n` blocks written into a pool of `size`, as plain fs data. */
const pool = (size, n) => logic.write({ blocks: [], trees: [{ name: 'podaci', readonly: false, files: {} }], poolSize: size, writes: {} }, 'podaci', 'a', undefined, n).fs;

// ── tie-breaks first ──

test('tie-break (rule 7): new blocks take the lowest free ids, in logical order', () => {
  const s = at({}, 3);
  assert.deepEqual(s.allocated, [8, 9]);
  assert.deepEqual(ptr(s, 'podaci'), [0, 1, 8, 9, 4, 5, 6, 7]);
  // a hole left by a freed block is reused first: free block 2 and 8, then write two blocks
  let fs = pool(12, 8);
  fs = logic.write(fs, 'podaci', 'a', [2]).fs;                 // C1 → 8, block 2 freed
  assert.deepEqual(logic.freeIds(fs), [2, 9, 10, 11]);
  const r = logic.write(fs, 'podaci', 'a', [5, 0, 5]);         // out of order and repeated: logical order, once each
  assert.deepEqual(r.moved.map((m) => [m.k, m.to]), [[0, 2], [5, 9]]);
});

test('tie-break (rule 7): a block freed by a write is not reused by the same write', () => {
  let fs = pool(10, 8);                                         // free 8, 9
  const r = logic.write(fs, 'podaci', 'a', [0, 1]);
  assert.equal(r.err, null);
  assert.deepEqual(r.allocated, [8, 9]);
  assert.deepEqual(r.freed.map((f) => f.id), [0, 1]);           // the old ones go after, not into this write
});

test('tie-break (rule 7): snapshots are listed oldest first, after the live tree', () => {
  const s = at({ scene: 'middle-snapshot' }, 4);
  assert.deepEqual(s.trees.map((t) => t.name), ['podaci', '@s1', '@s2']);
  assert.deepEqual(logic.treeNames(P({ scene: 'middle-snapshot' })), ['podaci', '@s1', '@s2']);
  assert.deepEqual(logic.holders(logic.fsOf(s), 0), ['podaci', '@s1', '@s2']);
});

// ── rules ──

test('rule 1: a snapshot allocates no block and every block gains one reference', () => {
  const s1 = at({}, 1), s2 = at({}, 2);
  assert.deepEqual(ids(s2), ids(s1));
  assert.equal(sp(s2).used, 8);
  assert.deepEqual(Object.values(refs(s1)), Array(8).fill(1));
  assert.deepEqual(Object.values(refs(s2)), Array(8).fill(2));
  assert.deepEqual(ptr(s2, '@s1'), ptr(s2, 'podaci'));
  assert.equal(tree(s2, '@s1').readonly, true);
  assert.deepEqual(row(s2, '@s1'), { name: '@s1', referenced: 8, exclusive: 0 });
  assert.equal(sp(s2).shared, 8);
});

test('rule 2: a write to a shared block goes to a new block; only the live pointer moves', () => {
  const s = at({}, 3);
  assert.deepEqual(ptr(s, '@s1'), [0, 1, 2, 3, 4, 5, 6, 7]);    // the snapshot still sees the old data
  assert.deepEqual(s.moved.map((m) => [m.k, m.from, m.to]), [[2, 2, 8], [3, 3, 9]]);
  assert.deepEqual(refs(s), { 0: 2, 1: 2, 2: 1, 3: 1, 4: 2, 5: 2, 6: 2, 7: 2, 8: 1, 9: 1 });
  assert.equal(s.blocks.find((b) => b.id === 2).ver, 'C0');
  assert.equal(s.blocks.find((b) => b.id === 8).ver, 'C1');
  const t = sp(s);
  assert.deepEqual([t.used, t.free, t.shared], [10, 14, 6]);
  assert.deepEqual(row(s, '@s1'), { name: '@s1', referenced: 8, exclusive: 2 });
  assert.deepEqual(row(s, 'podaci'), { name: 'podaci', referenced: 8, exclusive: 2 });
});

test('rule 3: an unshared block is not overwritten in place: new block first, then the old one is freed', () => {
  const fs = pool(10, 8);
  const r = logic.write(fs, 'podaci', 'a', [3]);
  assert.deepEqual(r.allocated, [8]);
  assert.deepEqual(r.freed, [{ id: 3, ver: 'D0' }]);
  assert.equal(logic.space(r.fs).used, 8);
  // with no free block even an unshared overwrite fails
  let tight = { blocks: [], trees: [{ name: 'podaci', readonly: false, files: {} }], poolSize: 8, writes: {} };
  tight = logic.write(tight, 'podaci', 'a', undefined, 8).fs;
  const r2 = logic.write(tight, 'podaci', 'a', [0]);
  assert.equal(r2.err, 'ENOSPC');
});

test('rule 4: rm in the live tree drops its pointers; blocks a snapshot holds stay, used does not fall', () => {
  const s = at({ scene: 'delete-doesnt-free' }, 3);
  assert.deepEqual(tree(s, 'podaci').files, {});
  assert.deepEqual(s.freed, []);
  assert.equal(sp(s).used, 8);
  assert.deepEqual(row(s, 'podaci'), { name: 'podaci', referenced: 0, exclusive: 0 });
  assert.deepEqual(row(s, '@s1'), { name: '@s1', referenced: 8, exclusive: 8 });
  assert.deepEqual(usedRun({ scene: 'delete-doesnt-free' }), [8, 8, 8, 0]);
  // without a snapshot rm frees everything at once
  const r = logic.rm(pool(24, 8), 'podaci', 'a');
  assert.equal(r.freed.length, 8);
  assert.equal(logic.space(r.fs).used, 0);
});

test('rule 5: destroying a snapshot frees exactly its exclusive blocks', () => {
  const p = { scene: 'middle-snapshot' };
  assert.deepEqual(usedRun(p), [8, 8, 9, 9, 10, 9, 8]);
  const s5 = at(p, 5);
  assert.deepEqual(sp(s5).trees.map((t) => t.exclusive), [1, 1, 1]);
  const s6 = at(p, 6);
  assert.deepEqual(s6.freed, [{ id: 2, ver: 'C0' }]);
  assert.equal(row(s5, '@s1').exclusive, s6.freed.length);
  const s7 = at(p, 7);
  assert.deepEqual(s7.freed, [{ id: 8, ver: 'C1' }]);
  assert.deepEqual(s7.gone, ['@s1', '@s2']);
  assert.deepEqual(s7.trees.map((t) => t.name), ['podaci']);
  assert.deepEqual(ptr(s7, 'podaci'), [0, 1, 9, 3, 4, 5, 6, 7]);
  assert.equal(sp(s7).shared, 0);
});

test('rule 6: no free block → ENOSPC, and nothing changes', () => {
  const p = { scene: 'full-pool', poolSize: 10 };
  assert.deepEqual(usedRun(p), [8, 8, 9, 10, 10, 8, 0]);
  const before = at(p, 4), s = at(p, 5);
  assert.equal(s.err, 'ENOSPC');
  assert.equal(s.event, 'error');
  assert.deepEqual(s.want, [2]);
  assert.deepEqual(s.blocks, before.blocks);
  assert.deepEqual(s.trees, before.trees);
  assert.deepEqual(s.writes, before.writes);
  assert.deepEqual([s.moved, s.allocated, s.freed], [[], [], []]);
  // rm with the snapshot still there frees only the two blocks the live tree held alone
  const s6 = at(p, 6);
  assert.deepEqual(s6.freed.map((f) => f.ver), ['A1', 'B1']);
  assert.equal(sp(s6).used, 8);
  // a two-block write with one free block fails as a whole (rule 3 per block)
  const one = logic.write(logic.fsOf(at(p, 3)), 'podaci', 'a', [2, 3]);
  assert.equal(one.err, 'ENOSPC');
});

test('rule 8: a snapshot is read-only: write and rm there fail with EROFS and change nothing', () => {
  const s = at({}, 2), fs = logic.fsOf(s);
  const w = logic.write(fs, '@s1', 'a', [0]);
  assert.equal(w.err, 'EROFS');
  assert.deepEqual(w.fs, fs);
  const r = logic.rm(fs, '@s1', 'a');
  assert.equal(r.err, 'EROFS');
  assert.deepEqual(r.fs, fs);
});

test('what each step did: events, moved, changed, freed and want are this step\'s only', () => {
  const ev = (over) => { const p = P(over); const out = []; for (let n = 0; n <= logic.steps(p); n++) out.push(at(over, n).event); return out; };
  assert.deepEqual(ev({}), ['start', 'create', 'snapshot', 'overwrite']);
  assert.deepEqual(ev({ scene: 'delete-doesnt-free' }), ['start', 'create', 'snapshot', 'rm', 'destroy']);
  assert.deepEqual(ev({ scene: 'full-pool', poolSize: 10 }), ['start', 'create', 'snapshot', 'overwrite', 'overwrite', 'error', 'rm', 'destroy']);
  assert.ok(at({}, 1).moved.every((m) => m.from === null));     // a new file: no pointer moved from anywhere
  assert.deepEqual(at({}, 1).changed, [0, 1, 2, 3, 4, 5, 6, 7]);  // a new block's refs go 0 → 1 (the page marks it new)
  assert.deepEqual(at({}, 2).changed, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(at({}, 3).changed, [2, 3, 8, 9]);
  const p = { scene: 'full-pool', poolSize: 10 };
  assert.deepEqual([at(p, 5).changed, at(p, 5).freed], [[], []]);
  const s6 = at(p, 6);
  assert.deepEqual([s6.err, s6.want], [null, []]);
  assert.deepEqual(at({ scene: 'middle-snapshot' }, 7).moved, []);
});

test('the live tree cannot be destroyed; blocks stay sorted by id when a hole is reused', () => {
  const fs = logic.fsOf(at({}, 2));
  const r = logic.destroy(fs, 'podaci');
  assert.equal(r.err, 'ENOENT');
  assert.deepEqual(r.fs, fs);
  let f = pool(12, 8);
  f = logic.write(f, 'podaci', 'a', [2]).fs;                     // block 2 freed, C1 in 8
  f = logic.write(f, 'podaci', 'a', [5]).fs;                     // F1 into the hole at 2
  assert.deepEqual(f.blocks.map((b) => b.id), [0, 1, 3, 4, 6, 7, 8].concat([2]).sort((a, b) => a - b));
  assert.equal(f.blocks.find((b) => b.id === 2).ver, 'F1');
});

test('labels: letter = logical block, digit = times it was written before', () => {
  const p = { scene: 'middle-snapshot' };
  assert.deepEqual(at(p, 1).blocks.map((b) => b.ver), ['A0', 'B0', 'C0', 'D0', 'E0', 'F0', 'G0', 'H0']);
  assert.equal(at(p, 5).blocks.find((b) => b.id === 9).ver, 'C2');
});

test('step counts per scene; every scene runs with every fileBlocks and poolSize', () => {
  assert.deepEqual(logic.SCENE_IDS.map((id) => logic.steps(P({ scene: id }))), [3, 4, 7, 7, 6, 7, 9, 5, 3, 6]);
  for (const scene of logic.SCENE_IDS.filter((id) => logic.mode(P({ scene: id })) !== 'compare')) {
    const cow = logic.mode(P({ scene })) === 'copy-on-write';
    for (let fb = 4; fb <= 8; fb++) {
      for (const ps of [10, 12, 24]) {
        for (const dl of cow ? [2, 3, 4, 8] : [8]) {
          const p = P({ scene, fileBlocks: fb, poolSize: ps, diffLimit: dl });
          for (let n = 0; n <= logic.steps(p); n++) {
            const s = kit.stateAt(logic, p, n), t = sp(s);
            assert.ok(t.used <= ps && t.used + t.free === ps);
            for (const b of s.blocks) assert.ok(b.refs >= 1 && b.id < ps + (cow ? dl : 0));
            if (cow) assert.ok(t.diffUsed <= dl && t.diffUsed + t.diffFree === dl);
          }
        }
      }
    }
  }
  assert.equal(sp(at({ fileBlocks: 4 }, 3)).used, 6);
});

test('norm clamps params to the page ranges', () => {
  assert.deepEqual(logic.norm({ scene: 'nope', fileBlocks: 99, poolSize: 3 }), { scene: 'basic', fileBlocks: 8, poolSize: 10 });
});

// ── preset win-vss: copy-on-write mode (SPEC.md "Copy-on-write mode", rules V1–V7) ──

const V = (scene, over) => Object.assign({ scene, poolSize: 10, diffLimit: scene === 'diff-full' ? 4 : 8 }, over);
const view = (s, name) => tree(s, name).files.a.map((id) => s.blocks.find((b) => b.id === id).ver);
const diffRun = (over) => { const p = P(over); const out = []; for (let n = 1; n <= logic.steps(p); n++) out.push(sp(at(over, n)).diffUsed); return out; };
/** A copy-on-write fs: file a of 8 blocks in a volume of 10, a diff area of `d`, then the given ops. */
const cowFs = (d) => Object.assign(pool(10, 8), { diffSize: d });
const shadowAt = (fs, name, time) => { const r = logic.snapshot(fs, name).fs; r.trees.find((t) => t.name === name).time = time; return r; };

test('tie-break (V7): copies take the lowest free diff-area ids, in logical order', () => {
  const s = at(V('previous-versions'), 3);
  assert.deepEqual(s.copied.map((c) => [c.k, c.from, c.to]), [[2, 2, 10], [3, 3, 11]]);
  let fs = shadowAt(cowFs(8), 'S1', '10:00');
  const r = logic.writeInPlace(fs, 'podaci', 'a', [5, 1, 5]);   // out of order and repeated: logical order, once each
  assert.deepEqual(r.copied.map((c) => [c.k, c.to]), [[1, 10], [5, 11]]);
  assert.deepEqual(logic.diffFreeIds(r.fs), [12, 13, 14, 15, 16, 17]);
});

test('tie-break (V4): restore takes the newest surviving shadow older than the time; same time → the later one', () => {
  let fs = cowFs(8);
  fs = shadowAt(fs, 'S1', '10:00');
  fs = shadowAt(fs, 'S2', '11:00');
  fs = shadowAt(fs, 'S3', '11:00');
  assert.equal(logic.pickShadow(fs, '11:30'), 'S3');            // S2 and S3 share 11:00: the larger id
  assert.equal(logic.pickShadow(fs, '11:00'), 'S1');            // strictly older than the time
  assert.equal(logic.pickShadow(fs, '10:59'), 'S1');
  assert.equal(logic.pickShadow(fs, '10:00'), null);
  fs = logic.destroy(fs, 'S1').fs;
  assert.equal(logic.pickShadow(fs, '10:59'), null);            // a dropped shadow is no longer a previous version
  assert.equal(at(V('previous-versions'), 6).from, 'S1');
  assert.equal(at(V('diff-full'), 9).from, 'S3');
});

test('tie-break (V3): a full diff area drops the oldest shadow first, then the next, until the copies fit', () => {
  const s = at(V('diff-full'), 7);
  assert.deepEqual(s.dropped, ['S1']);
  assert.deepEqual(s.trees.map((t) => t.name), ['podaci', 'S2', 'S3']);
  assert.deepEqual(s.gone, ['S1']);
  // limit 2: the copies of step 5 (2) do not fit beside step 3's (2): S1 goes, and S2 then holds nothing old
  const s5 = at(V('diff-full', { diffLimit: 2 }), 5);
  assert.deepEqual(s5.dropped, ['S1']);
  assert.deepEqual(sp(s5).diffUsed, 2);
  // two shadows to drop in one write: three shadows of single-block changes, then a 3-block write with limit 3
  let fs = cowFs(3);
  fs = shadowAt(fs, 'S1', '09:00'); fs = logic.writeInPlace(fs, 'podaci', 'a', [0]).fs;
  fs = shadowAt(fs, 'S2', '10:00'); fs = logic.writeInPlace(fs, 'podaci', 'a', [1]).fs;
  fs = shadowAt(fs, 'S3', '11:00'); fs = logic.writeInPlace(fs, 'podaci', 'a', [2]).fs;
  assert.equal(logic.space(fs).diffUsed, 3);
  const r = logic.writeInPlace(fs, 'podaci', 'a', [3, 4, 5]);
  assert.deepEqual(r.dropped, ['S1', 'S2', 'S3']);              // all three go: S3 alone still needs 3 copies with 2 free
  assert.deepEqual(r.copied, []);                               // no shadow left: nothing to preserve
});

test('rule V1: a shadow keeps the volume\'s contents of the moment it was taken', () => {
  for (const scene of logic.COW_SCENES) {
    const p = V(scene), sc = logic.script(P(p));
    sc.forEach((o, i) => {
      if (o.op !== 'snapshot') return;
      const then = view(at(p, i + 1), 'podaci');
      for (let n = i + 1; n <= sc.length; n++) {
        const s = at(p, n);
        if (tree(s, o.name)) assert.deepEqual(view(s, o.name), then, scene + ' ' + o.name + ' at step ' + n);
      }
    });
  }
  assert.equal(tree(at(V('previous-versions'), 2), 'S1').time, '10:00');
});

test('rule V2: first change after a shadow copies the old block to the diff area, then overwrites in place', () => {
  const p = V('previous-versions'), s = at(p, 3);
  assert.deepEqual(ptr(s, 'podaci'), [0, 1, 2, 3, 4, 5, 6, 7]);   // the live pointers never move
  assert.deepEqual(view(s, 'podaci'), ['A0', 'B0', 'C1', 'D1', 'E0', 'F0', 'G0', 'H0']);
  assert.deepEqual(ptr(s, 'S1'), [0, 1, 10, 11, 4, 5, 6, 7]);      // the shadow's pointer moves to the copy
  assert.deepEqual(s.moved.map((m) => [m.tree, m.k, m.from, m.to]), [['S1', 2, 2, 10], ['S1', 3, 3, 11]]);
  assert.deepEqual(s.overwritten, [2, 3]);
  assert.deepEqual(s.allocated, [10, 11]);
  assert.deepEqual([sp(s).used, sp(s).diffUsed, sp(s).shared], [8, 2, 6]);
  // the second change of the same block: already preserved, in place only
  const s4 = at(p, 4);
  assert.deepEqual([s4.copied, s4.overwritten, sp(s4).diffUsed], [[], [2], 2]);
  assert.deepEqual(view(s4, 'S1').slice(2, 4), ['C0', 'D0']);
  // a block shared by two shadows is copied once, and both point to the copy
  const f5 = at(V('diff-full'), 5);
  assert.deepEqual(f5.copied.map((c) => c.to), [12, 13]);
  assert.deepEqual(ptr(f5, 'S1').slice(2, 4), [12, 13]);
  assert.deepEqual(ptr(f5, 'S2').slice(2, 4), [12, 13]);
  assert.equal(f5.blocks.find((b) => b.id === 12).refs, 2);
  // with no shadow nothing is copied
  const r = logic.writeInPlace(cowFs(8), 'podaci', 'a', [0]);
  assert.deepEqual([r.copied, r.overwritten, logic.space(r.fs).diffUsed], [[], [0], 0]);
});

test('rule V3: the diff area grows with the blocks changed since the shadow, not with the volume', () => {
  assert.deepEqual(diffRun(V('diff-growth')), [0, 0, 1, 2, 2, 4, 4]);
  assert.deepEqual(diffRun(V('diff-growth', { poolSize: 24 })), [0, 0, 1, 2, 2, 4, 4]);
  assert.deepEqual(usedRun(V('diff-growth')), [8, 8, 8, 8, 8, 8, 8]);
  assert.deepEqual(diffRun(V('previous-versions')), [0, 0, 2, 2, 2, 4]);
  assert.deepEqual(diffRun(V('diff-full')), [0, 0, 2, 2, 4, 4, 4, 4, 4]);
  // dropping S1 freed exactly the copies only it held (A0, B0); C0, D0 (shared with S2) stay
  const s7 = at(V('diff-full'), 7);
  assert.deepEqual(s7.freed, [{ id: 10, ver: 'A0' }, { id: 11, ver: 'B0' }]);
  assert.deepEqual(s7.blocks.filter((b) => b.id >= 10).map((b) => [b.id, b.ver, b.refs]), [[10, 'A1', 2], [11, 'B1', 2], [12, 'C0', 1], [13, 'D0', 1]]);
});

test('rule V4: restore puts the shadow\'s contents back in place; a newer shadow keeps its own view', () => {
  const p = V('previous-versions'), before = at(p, 5), s = at(p, 6);
  assert.equal(s.event, 'restore');
  assert.deepEqual(view(s, 'podaci'), view(before, 'S1'));
  assert.deepEqual(ptr(s, 'podaci'), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(s.overwritten, [2, 3]);                        // only the blocks that differ
  assert.deepEqual(view(s, 'S2'), view(before, 'S2'));          // C2, D1 copied first: S2 still has them
  assert.deepEqual(s.copied.map((c) => [c.k, c.to]), [[2, 12], [3, 13]]);
  assert.deepEqual(view(s, 'S1'), view(before, 'S1'));          // the source is unchanged
  // restore-none: no surviving shadow older than the time; nothing changes
  const f = V('diff-full'), f7 = at(f, 7), f8 = at(f, 8);
  assert.deepEqual([f8.event, f8.from], ['restore-none', null]);
  assert.deepEqual([f8.blocks, f8.trees], [f7.blocks, f7.trees]);
  // restoring from a shadow whose contents equal the live ones writes nothing
  const fs = shadowAt(cowFs(8), 'S1', '10:00');
  const r = logic.restore(fs, 'a', 'S1');
  assert.deepEqual([r.overwritten, r.copied, r.fs], [[], [], fs]);
});

test('rule V6: a restore never drops its own source; the next oldest shadow goes instead', () => {
  let h = cowFs(1);
  h = shadowAt(h, 'S1', '09:00');
  h = logic.writeInPlace(h, 'podaci', 'a', [0]).fs;              // A0 copied for S1: the diff area (1) is full
  h = shadowAt(h, 'S2', '10:00');                                 // shares A1 in block 0
  const q = logic.restore(h, 'a', 'S1');                          // A1 needs a copy for S2: S1 is the oldest, but kept
  assert.equal(q.err, null);
  assert.deepEqual(q.dropped, ['S2']);
  assert.deepEqual(q.fs.trees.map((t) => t.name), ['podaci', 'S1']);
  assert.deepEqual(q.copied, []);                                 // S2 gone: nothing left to preserve
  assert.equal(q.fs.blocks.find((b) => b.id === 0).ver, 'A0');
  // a plain write keeps no shadow: the oldest goes first
  const w = logic.writeInPlace(h, 'podaci', 'a', [0]);
  assert.deepEqual(w.dropped, ['S1']);
  assert.deepEqual(w.copied.map((c) => [c.k, c.to]), [[0, 10]]);
});

test('copy-on-write mode is the win-vss scenes\' only; the host\'s scenes have no diff area', () => {
  assert.deepEqual(logic.COW_SCENES.map((id) => logic.mode(P({ scene: id }))), Array(3).fill('copy-on-write'));
  for (const id of ['basic', 'delete-doesnt-free', 'middle-snapshot', 'full-pool']) {
    assert.equal(logic.mode(P({ scene: id })), 'redirect-on-write');
    const s = at({ scene: id }, logic.steps(P({ scene: id })));
    assert.equal(s.diffSize, undefined);
    assert.equal('copied' in s, false);
    assert.equal('diffUsed' in sp(s), false);
  }
  assert.equal(at(V('diff-full'), 0).diffSize, 4);
  assert.deepEqual([logic.diffLimit({ diffLimit: 99 }), logic.diffLimit({ diffLimit: 0 }), logic.diffLimit({})], [8, 2, 8]);
  const ev = (over) => { const p = P(over); const out = []; for (let n = 0; n <= logic.steps(p); n++) out.push(at(over, n).event); return out; };
  assert.deepEqual(ev(V('previous-versions')), ['start', 'create', 'snapshot', 'overwrite', 'overwrite', 'snapshot', 'restore']);
  assert.deepEqual(ev(V('diff-full')).slice(7), ['overwrite', 'restore-none', 'restore']);
  assert.deepEqual(at(V('diff-full'), 8).dropped, []);            // what each step did is this step's only
  assert.deepEqual(at(V('diff-full'), 8).copied, []);
});

// ── preset sto-cow-vs-row: copy-on-write vs redirect-on-write (SPEC.md "Comparison", rules C1–C7) ──

const C = (scene, over) => Object.assign({ scene }, over);
const cAt = (scene, n, over) => at(C(scene, over), n);
const maps = (sd) => logic.maps(sd.fs);
const io = (sd) => sd.io.list.map((x) => x.io + ':' + x.slot + (x.to !== undefined ? '>' + x.to : ''));
const tot = (sd) => [sd.total.reads, sd.total.writes, sd.total.meta];
const vers = (sd) => Object.fromEntries(sd.fs.blocks.map((b) => [b.id, b.ver]));

test('tie-break (C6): redirect-on-write takes the lowest free slot; a slot freed earlier is reused first', () => {
  assert.deepEqual([1, 2, 3, 4].map((n) => cAt('four-writes', n).row.allocated), [[8], [9], [10], [11]]);
  // rewrite-same: 1 → 8; 1 again → 9 (8 is still live until the new block is written), 8 freed; 1 again → 8
  assert.deepEqual([1, 2, 3].map((n) => cAt('rewrite-same', n).row.allocated), [[8], [9], [8]]);
  // copy-on-write copies go to the lowest free slot of the snapshot area (8–11)
  assert.deepEqual([1, 2, 3, 4].map((n) => cAt('four-writes', n).cow.copied.map((c) => c.to)), [[8], [9], [10], [11]]);
});

test('tie-break (C6): the I/Os of one write are listed in order: read, copy, then the in-place write', () => {
  assert.deepEqual(io(cAt('four-writes', 1).cow), ['read:1', 'write:8', 'write:1']);
  assert.deepEqual(cAt('four-writes', 1).cow.io.list.map((x) => x.what), ['copy', 'copy', 'inplace']);
  assert.deepEqual(io(cAt('four-writes', 1).row), ['write:8', 'meta:1>8']);
});

test('rule C1: copy-on-write, first write after the snapshot: 1 read + 2 writes, live stays, snapshot gets the copy', () => {
  const s = cAt('four-writes', 1), sd = s.cow;
  assert.deepEqual([sd.io.reads, sd.io.writes, sd.io.meta], [1, 2, 0]);
  assert.deepEqual(maps(sd).live, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(maps(sd).snap, [0, 8, 2, 3, 4, 5, 6, 7]);
  assert.equal(vers(sd)[1], 'B1');                               // new data in place
  assert.equal(vers(sd)[8], 'B0');                               // the old copy in the snapshot area
});

test('rule C2: copy-on-write, a later write to the same block: in place only, 1 write', () => {
  const sd = cAt('rewrite-same', 2).cow;
  assert.deepEqual(io(sd), ['write:1']);
  assert.deepEqual(maps(sd).snap, [0, 8, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(tot(cAt('rewrite-same', 3).cow), [1, 4, 0]);  // 3 + 1 + 1 = 5 I/Os
  assert.equal(vers(cAt('rewrite-same', 3).cow)[1], 'B3');
});

test('rule C3: redirect-on-write: new slot, live map re-pointed, old block now the snapshot\'s only; no read', () => {
  const sd = cAt('four-writes', 1).row;
  assert.deepEqual([sd.io.reads, sd.io.writes, sd.io.meta], [0, 1, 1]);
  assert.deepEqual(maps(sd), { live: [0, 8, 2, 3, 4, 5, 6, 7], snap: [0, 1, 2, 3, 4, 5, 6, 7] });
  assert.deepEqual([vers(sd)[1], vers(sd)[8]], ['B0', 'B1']);
  assert.equal(sd.fs.blocks.find((b) => b.id === 1).refs, 1);
  // a block the snapshot does not hold is not kept: the previous live version is freed (rewrite-same)
  assert.deepEqual([1, 2, 3].map((n) => cAt('rewrite-same', n).row.freed), [[], [8], [9]]);
  assert.deepEqual(tot(cAt('rewrite-same', 3).row), [0, 3, 3]);
});

test('rule C4: a sequential read of the live volume: copy-on-write 0 jumps, redirect-on-write 4', () => {
  const s = cAt('four-writes', 5);
  assert.equal(s.event, 'read');
  assert.deepEqual(s.cow.read.slots, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(s.cow.read.jumps, 0);
  assert.deepEqual(s.row.read.slots, [0, 8, 9, 3, 4, 10, 11, 7]);
  assert.equal(s.row.read.jumps, 4);
  assert.deepEqual(s.row.read.runs.map((r) => [r.from, r.len]), [[0, 1], [8, 2], [3, 2], [10, 2], [7, 1]]);
  assert.deepEqual(logic.seqRead([3, 4, 5]).jumps, 0);
  assert.deepEqual(logic.seqRead([5, 4]).jumps, 1);            // backwards is a jump too
  assert.deepEqual(s.cow.io.list, []);                          // the read is not a write: totals unchanged
  assert.deepEqual(tot(s.cow), tot(cAt('four-writes', 4).cow));
});

test('rule C5: deleting the snapshot: copy-on-write drops its area, redirect-on-write frees only unreferenced slots', () => {
  const s = cAt('delete-snapshot', 6);
  assert.equal(s.event, 'destroy');
  assert.deepEqual(s.cow.freed, [8, 9, 10, 11]);
  assert.deepEqual(s.row.freed, [1, 2, 5, 6]);
  assert.deepEqual(maps(s.row), { live: [0, 8, 9, 3, 4, 10, 11, 7], snap: null });  // live stays fragmented
  assert.deepEqual(maps(s.cow), { live: [0, 1, 2, 3, 4, 5, 6, 7], snap: null });
  assert.ok(s.cow.fs.blocks.every((b) => b.refs === 1) && s.row.fs.blocks.every((b) => b.refs === 1));
});

test('preset four-writes: copy-on-write 4 reads + 8 writes = 12 I/Os, redirect-on-write 4 writes + 4 metadata updates', () => {
  const s = cAt('four-writes', 4);
  assert.deepEqual(tot(s.cow), [4, 8, 0]);
  assert.deepEqual(tot(s.row), [0, 4, 4]);
  assert.deepEqual(maps(s.row).live, [0, 8, 9, 3, 4, 10, 11, 7]);
  assert.deepEqual(maps(s.cow).snap, [0, 8, 9, 3, 4, 10, 11, 7]);   // the snapshot area holds the old copies
  assert.deepEqual(sp({ blocks: s.cow.fs.blocks, trees: s.cow.fs.trees, poolSize: 8, writes: {}, diffSize: 4 }).diffUsed, 4);
});

test('rule C7: both volumes run in lockstep from the same script; the policy param changes no state', () => {
  for (const scene of logic.CMP_SCENES) {
    assert.equal(logic.mode(P({ scene })), 'compare');
    for (let n = 1; n <= logic.steps(P({ scene })); n++) {
      const s = cAt(scene, n);
      assert.deepEqual(s.op, logic.SCENES[scene][n - 1]);
      for (const pol of ['cow', 'row', 'both']) assert.deepEqual(cAt(scene, n, { policy: pol }), s);
      // and neither depends on the host's sliders
      assert.deepEqual(cAt(scene, n, { fileBlocks: 4, poolSize: 10, diffLimit: 2 }), s);
    }
  }
  assert.deepEqual(['cow', 'row', 'both', 'x', undefined].map((v) => logic.policy({ policy: v })), ['cow', 'row', 'both', 'both', 'both']);
  // the other scenes are untouched: no comparison fields
  assert.equal('cmp' in at({}, 3), false);
  assert.equal(logic.mode(P({ scene: 'basic' })), 'redirect-on-write');
});

test('comparison start: the same 8 blocks in slots 0–7 of both volumes, snapshot taken, nothing counted', () => {
  const s = cAt('four-writes', 0);
  for (const sd of [s.cow, s.row]) {
    assert.deepEqual(maps(sd), { live: [0, 1, 2, 3, 4, 5, 6, 7], snap: [0, 1, 2, 3, 4, 5, 6, 7] });
    assert.deepEqual(tot(sd), [0, 0, 0]);
    assert.ok(sd.fs.blocks.every((b) => b.refs === 2));
  }
  assert.deepEqual([s.cow.fs.poolSize, s.cow.fs.diffSize, s.row.fs.poolSize], [8, 4, 12]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const scene of logic.SCENE_IDS) {
    const p = P({ scene, poolSize: 10, diffLimit: 3 });
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const scene of logic.SCENE_IDS) {
    const p = P({ scene, poolSize: 10, fileBlocks: 6 });
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ scene: 'middle-snapshot' });
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
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const scenes = [...html.matchAll(/scene:\s*'([\w-]+)'/g)].map((m) => m[1]);
  for (const id of scenes) assert.ok(logic.SCENES[id], `scene ${id} exists`);
  assert.deepEqual([...new Set(scenes)].sort(), [...logic.SCENE_IDS].sort());
});
