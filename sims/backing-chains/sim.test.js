// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for backing-chains' model (rules: SPEC.md). Run: node --test sims/backing-chains/sim.test.js
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
const layer = (s, id) => s.layers.find((l) => l.id === id);
const seen = (s) => logic.view(s.layers, s.active).map((x) => (x.fail ? 'X' : x.v || 0));
const VIEW = ['A', 'B2', 'C2', 'D', 'E1', 0, 0, 0];
const built = () => at({ compact: true }, 1);

// ── tie-breaks first ──

test('tie-break (rule 6): in commit the upper layer\'s block wins over its backing\'s', () => {
  const s = built();
  const r = logic.commitCopy(s.layers, 's1');
  assert.deepEqual(r.copied, [1, 4]);
  assert.equal(layer(r, 'base').blocks[1], 'B1');               // was B
  assert.deepEqual(layer(r, 'base').blocks, { 0: 'A', 1: 'B1', 2: 'C', 3: 'D', 4: 'E1' });
  assert.equal(layer(at({ ending: 'commit', compact: true }, 2), 'base').blocks[1], 'B1');
});

test('tie-break (rule 6): in stream the child keeps its own block', () => {
  const s = built();
  const r = logic.streamCopy(s.layers, 's1', 's2');
  assert.deepEqual(r.copied, [4]);
  assert.deepEqual(r.kept, [1]);
  assert.equal(layer(r, 's2').blocks[1], 'B2');
  assert.deepEqual(layer(r, 's2').blocks, { 1: 'B2', 2: 'C2', 4: 'E1' });
});

test('tie-break (rule 1): the topmost allocated layer wins; B2 in s2 hides B1 in s1 and B in base', () => {
  const s = built();
  const r = logic.readPath(s.layers, 's2', 1);
  assert.deepEqual(r, { path: ['s2'], hit: 's2', value: 'B2', fail: null });
});

// ── rules ──

test('rule 1: a read falls down the chain; nothing allocated reads as zeros', () => {
  const s = built();
  assert.deepEqual(logic.readPath(s.layers, 's2', 0), { path: ['s2', 's1', 'base'], hit: 'base', value: 'A', fail: null });
  assert.deepEqual(logic.readPath(s.layers, 's2', 4), { path: ['s2', 's1'], hit: 's1', value: 'E1', fail: null });
  assert.deepEqual(logic.readPath(s.layers, 's2', 5), { path: ['s2', 's1', 'base'], hit: null, value: null, fail: null });
  assert.deepEqual(seen(s), VIEW);
  // the stepper: one step per layer visited, the result on the last one
  const p = {};
  const ph = [];
  for (let n = 7; n <= 15; n++) { const q = at(p, n).probe; ph.push([q.block, q.path.length, q.result, q.value]); }
  assert.deepEqual(ph, [
    [0, 1, null, null], [0, 2, null, null], [0, 3, 'hit', 'A'],
    [1, 1, 'hit', 'B2'],
    [4, 1, null, null], [4, 2, 'hit', 'E1'],
    [5, 1, null, null], [5, 2, null, null], [5, 3, 'zero', null]
  ]);
  assert.equal(at(p, 9).probe.at, 'base');
});

test('rule 2: a write allocates the block in the active layer only', () => {
  const s = at({}, 2);                                           // snapshot, then write 1 = B1
  assert.equal(s.active, 's1');
  assert.deepEqual(layer(s, 's1').blocks, { 1: 'B1' });
  assert.deepEqual(layer(s, 'base').blocks, { 0: 'A', 1: 'B', 2: 'C', 3: 'D' });
  assert.deepEqual(s.changed, [{ layer: 's1', b: 1 }]);
  const w = logic.write(s.layers, 's1', 7, 'H1');
  assert.deepEqual(layer({ layers: w }, 'base').blocks, layer(s, 'base').blocks);
  assert.deepEqual(s.layers, at({}, 2).layers, 'write does not change its input');
  // allocation after the build: base 4, s1 2, s2 2
  assert.deepEqual(built().layers.map((l) => Object.keys(l.blocks).length), [4, 2, 2]);
});

test('rule 3: a snapshot makes the active layer read-only and adds an empty overlay backing on it', () => {
  const s0 = at({}, 0);
  assert.equal(s0.active, 'base');
  assert.equal(layer(s0, 'base').readOnly, false);
  const s = at({}, 1);
  assert.equal(s.active, 's1');
  assert.equal(layer(s, 'base').readOnly, true);
  assert.deepEqual(layer(s, 's1'), { id: 's1', file: 's1.qcow2', backing: 'base', blocks: {}, readOnly: false });
  assert.deepEqual(seen(s), seen(s0), 'the view does not change: a snapshot copies nothing');
  const s4 = at({}, 4);
  assert.equal(s4.active, 's2');
  assert.equal(layer(s4, 's1').readOnly, true);
  assert.equal(layer(s4, 's2').backing, 's1');
});

test('rule 4: commit copies L into P, re-points the child, removes L; the view never changes', () => {
  const p = { ending: 'commit', compact: true };
  assert.deepEqual(at(p, 2).phase, 'commit-copy');
  assert.deepEqual(at(p, 2).changed, [{ layer: 'base', b: 1 }, { layer: 'base', b: 4 }]);
  assert.equal(layer(at(p, 2), 's2').backing, 's1');
  assert.equal(layer(at(p, 3), 's2').backing, 'base');
  assert.deepEqual(at(p, 3).repointed, { child: 's2', from: 's1', to: 'base' });
  assert.ok(layer(at(p, 3), 's1'), 's1 still there after re-point');
  assert.equal(layer(at(p, 4), 's1'), undefined);
  for (let n = 1; n <= logic.steps(P(p)); n++) assert.deepEqual(seen(at(p, n)), VIEW, `view at step ${n}`);
  const e = end(p);
  assert.deepEqual(e.layers.map((l) => [l.id, l.backing, Object.keys(l.blocks).length]), [['base', null, 5], ['s2', 'base', 2]]);
  assert.deepEqual(e.probe, { block: 1, path: ['s2'], result: 'hit', value: 'B2', at: 's2' });
  assert.deepEqual(at(p, 6).probe, { block: 4, path: ['s2', 'base'], result: 'hit', value: 'E1', at: 'base' });
  // the one-call version agrees with the three phases
  assert.deepEqual(logic.commit(built().layers, 's1'), { layers: e.layers, refused: null });
});

test('rule 5: stream copies into the child, re-points it past L, removes L; base untouched; view unchanged', () => {
  const p = { ending: 'stream', compact: true };
  assert.deepEqual(at(p, 2).changed, [{ layer: 's2', b: 4 }]);
  assert.equal(layer(at(p, 3), 's2').backing, 'base');
  for (let n = 1; n <= logic.steps(P(p)); n++) assert.deepEqual(seen(at(p, n)), VIEW, `view at step ${n}`);
  const e = end(p);
  assert.deepEqual(layer(e, 'base').blocks, { 0: 'A', 1: 'B', 2: 'C', 3: 'D' });
  assert.deepEqual(e.layers.map((l) => l.id), ['base', 's2']);
  assert.deepEqual(at(p, 5).probe.path, ['s2']);
  assert.deepEqual(logic.stream(built().layers, 's1', 's2'), e.layers);
});

test('rule 7: commit into a layer with another child is refused; so is committing the base', () => {
  const s = built();
  const branch = s.layers.concat([{ id: 'b1', file: 'b1.qcow2', backing: 'base', blocks: { 0: 'Z' }, readOnly: false }]);
  assert.equal(logic.commitRefused(branch, 's1'), 'branch');
  const r = logic.commit(branch, 's1');
  assert.equal(r.refused, 'branch');
  assert.deepEqual(r.layers, branch);
  assert.equal(logic.commitRefused(s.layers, 'base'), 'base');
  assert.equal(logic.commitRefused(s.layers, 's1'), null);
  // committing s2 into s1 is fine: s1 has one child
  assert.equal(logic.commitRefused(branch, 's2'), null);
});

test('rule 8: deleting a backing file without a merge breaks every layer above it', () => {
  const p = { ending: 'delete', compact: true };
  const s = at(p, 2);
  assert.deepEqual(s.broken, ['s2']);
  assert.equal(layer(s, 's1').missing, true);
  assert.deepEqual(layer(s, 's1').lost, { 1: 'B1', 4: 'E1' });
  assert.equal(logic.opens(s.layers, 's2'), false);
  assert.equal(logic.opens(s.layers, 'base'), true);
  assert.deepEqual(logic.view(s.layers, 'base').map((x) => x.v || 0), ['A', 'B', 'C', 'D', 0, 0, 0, 0]);
  assert.deepEqual(at(p, 3).probe, { block: 4, path: ['s2'], result: null, value: null, at: 's2' });
  assert.deepEqual(end(p).probe, { block: 4, path: ['s2', 's1'], result: 'fail', value: null, at: 's1' });
  assert.equal(logic.steps(P(p)), 4);
  // a longer chain: every descendant breaks
  const three = logic.snapshot(built().layers, 's2', 's3', 's3.qcow2');
  assert.deepEqual(logic.deleteFile(three, 'base').broken, ['s1', 's2', 's3']);
  assert.equal(logic.opens(built().layers, 's2'), true);
});

test('rule 9: VHDX and VMDK end the same as qcow2 commit; only the names change', () => {
  const q = end({ ending: 'commit' }), v = end({ format: 'vhdx', ending: 'commit' }), m = end({ format: 'vmdk', ending: 'commit' });
  const strip = (s) => s.layers.map((l) => [l.id, l.backing, l.blocks]);
  assert.deepEqual(strip(v), strip(q));
  assert.deepEqual(strip(m), strip(q));
  assert.deepEqual(v.layers.map((l) => l.file), ['disk.vhdx', 'disk_4b7d.avhdx']);
  assert.deepEqual(m.layers.map((l) => l.file), ['disk.vmdk', 'disk-000002.vmdk']);
  assert.deepEqual(layer(end({ format: 'vmdk' }), 's1').file, 'disk-000001.vmdk');
  assert.deepEqual(strip(end({ ending: 'commit', compact: true })), strip(q));
});

test('steps: the preset counts of SPEC.md, every combination within 20', () => {
  const n = (o) => logic.steps(P(o));
  assert.equal(n({}), 15);
  assert.equal(n({ ending: 'commit', compact: true }), 7);
  assert.equal(n({ ending: 'stream', compact: true }), 6);
  assert.equal(n({ ending: 'delete', compact: true }), 4);
  assert.equal(n({ format: 'vhdx', ending: 'commit' }), 12);
  assert.equal(n({ format: 'vmdk', ending: 'commit' }), 12);
  assert.equal(n({ compact: true }), 10);
  for (const format of logic.FORMATS) for (const ending of logic.ENDINGS) for (const compact of [false, true]) {
    assert.ok(n({ format, ending, compact }) <= 20);
    assert.equal(n({ format, ending, compact }), n({ ending, compact }), 'format changes no count');
  }
  assert.deepEqual(end({}).log, ['snapshot', 'write 1', 'write 4', 'snapshot', 'write 1', 'write 2', 'read 0', 'read 1', 'read 4', 'read 5']);
});

test('params: unknown values fall back to the defaults', () => {
  assert.deepEqual(logic.norm({ format: 'vdi', ending: 'x' }), { format: 'qcow2', ending: 'none', compact: false });
  assert.deepEqual(logic.norm({ format: 'vmdk', ending: 'stream', compact: 1 }), { format: 'vmdk', ending: 'stream', compact: true });
  assert.equal(logic.steps({ format: 'x', ending: 'y' }), 15);
});

// ── generic checks every sim keeps ──

const ALL = [{}, { ending: 'commit' }, { ending: 'stream', compact: true }, { ending: 'delete', format: 'vhdx' }, { format: 'vmdk', ending: 'commit' }];

test('state is JSON-safe at every step', () => {
  for (const over of ALL) {
    for (let n = 0; n <= logic.steps(P(over)); n++) {
      const s = at(over, n);
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
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
