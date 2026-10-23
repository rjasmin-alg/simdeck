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
  assert.deepEqual(logic.SCENE_IDS.map((id) => logic.steps(P({ scene: id }))), [3, 4, 7, 7]);
  for (const scene of logic.SCENE_IDS) {
    for (let fb = 4; fb <= 8; fb++) {
      for (const ps of [10, 12, 24]) {
        const p = P({ scene, fileBlocks: fb, poolSize: ps });
        for (let n = 0; n <= logic.steps(p); n++) {
          const s = kit.stateAt(logic, p, n), t = sp(s);
          assert.ok(t.used <= ps && t.used + t.free === ps);
          for (const b of s.blocks) assert.ok(b.refs >= 1 && b.id < ps);
        }
      }
    }
  }
  assert.equal(sp(at({ fileBlocks: 4 }, 3)).used, 6);
});

test('norm clamps params to the page ranges', () => {
  assert.deepEqual(logic.norm({ scene: 'nope', fileBlocks: 99, poolSize: 3 }), { scene: 'basic', fileBlocks: 8, poolSize: 10 });
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const scene of logic.SCENE_IDS) {
    const p = P({ scene, poolSize: 10 });
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
