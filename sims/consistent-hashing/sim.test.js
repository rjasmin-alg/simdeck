// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for consistent-hashing's model: one test per rule of SPEC.md, tie-breaks first, then the presets' numbers,
// then the template's generic block. Run: node --test sims/consistent-hashing/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => logic.initial(P(over));
const pt = (h, node, j) => ({ h, node, j: j || 0 });

// ── rule 6: tie-breaks ──

test('tie-break: a key hashing exactly onto a node point belongs to that node', () => {
  const pts = logic.sortPoints([pt(100, 0), pt(200, 1), pt(300, 2)]);
  assert.equal(logic.ringOwner(pts, 200), 1);
  assert.equal(logic.ringOwner(pts, 201), 2);
  assert.equal(logic.ringOwner(pts, 199), 1);
  assert.equal(logic.ringOwner(pts, 100), 0);
});

test('tie-break: two node points on the same hash, the lower node id comes first and takes the key', () => {
  const pts = logic.sortPoints([pt(500, 3), pt(100, 0), pt(500, 1)]);
  assert.deepEqual(pts.map((x) => x.node), [0, 1, 3]);
  assert.equal(logic.ringOwner(pts, 500), 1);
  assert.equal(logic.ringOwner(pts, 400), 1);
  // the same with the input in the other order
  assert.equal(logic.ringOwner(logic.sortPoints([pt(500, 1), pt(500, 3), pt(100, 0)]), 500), 1);
});

test('tie-break: points of one node on the same hash sort by point index', () => {
  const pts = logic.sortPoints([pt(7, 2, 5), pt(7, 2, 1)]);
  assert.deepEqual(pts.map((x) => x.j), [1, 5]);
});

test('tie-break: extremes of equal loads name the lower node id', () => {
  assert.deepEqual(logic.extremes([5, 9, 9, 5]), { max: 1, min: 0 });
});

// ── rule 1: the hash ──

test('rule 1: FNV-1a 32-bit reference values, then murmur3 fmix32', () => {
  assert.equal(logic.fnv1a(''), 0x811c9dc5);
  assert.equal(logic.fnv1a('a'), 0xe40c292c);
  assert.equal(logic.fnv1a('foobar'), 0xbf9cf968);
  assert.equal(logic.fmix32(0), 0);
  assert.equal(logic.hash('key-0'), logic.fmix32(logic.fnv1a('key-0')));
  for (let i = 0; i < 50; i++) {
    const h = logic.hash(logic.keyName(i));
    assert.ok(Number.isInteger(h) && h >= 0 && h < logic.SPACE);
  }
});

test('rule 1: keys and node points are hashed by name with the same function', () => {
  const s = at({ nodes: 3, vnodes: 10 });
  assert.equal(s.keyHashes.length, logic.KEYS);
  assert.equal(s.keyHashes[42], logic.hash('key-42'));
  const p = s.points.find((x) => x.node === 2 && x.j === 7);
  assert.equal(p.h, logic.hash('C-7'));
});

// ── rule 2: mod-n ──

test('rule 2: mod-n owner is hash mod n', () => {
  const s = at({ nodes: 7 });
  for (let i = 0; i < logic.KEYS; i += 37) assert.equal(s.owner.mod[i], s.keyHashes[i] % 7);
  assert.equal(logic.modOwner(23, 5), 3);
});

test('rule 2: mod-n moves a key from n to n + 1 unless both residues agree; about n/(n+1) of all keys', () => {
  const s = at({ from: 4, nodes: 5 });
  const expect = s.keyHashes.filter((h) => h % 4 !== h % 5).length;
  assert.equal(s.movedLast.mod, expect);
  for (let n = 3; n < 10; n++) {
    const m = at({ from: n, nodes: n + 1 }).movedLast.mod / logic.KEYS;
    assert.ok(Math.abs(m - n / (n + 1)) < 0.05, `n=${n}: ${m}`);
  }
});

// ── rule 3: the ring ──

test('rule 3: a key belongs to the first node point at or after its hash, clockwise', () => {
  const s = at({ nodes: 5, vnodes: 10 });
  for (let i = 0; i < logic.KEYS; i += 13) {
    const h = s.keyHashes[i];
    const after = s.points.filter((x) => x.h >= h);
    const first = after.length ? after[0] : s.points[0];
    assert.equal(s.owner.ring[i], first.node);
  }
});

test('rule 3: past the last point the ring wraps to the first one', () => {
  const pts = logic.sortPoints([pt(100, 0), pt(200, 1)]);
  assert.equal(logic.ringOwner(pts, 201), 0);
  assert.equal(logic.ringOwner(pts, logic.SPACE - 1), 0);
  assert.equal(logic.ringOwner(pts, 0), 0);
});

// ── rule 4: adding or removing a node on the ring ──

test('rule 4: adding a node moves only keys to the new node', () => {
  for (const v of [1, 10, 100]) {
    const s = at({ from: 4, nodes: 5, vnodes: v });
    for (const k of s.moved.ring) assert.equal(s.owner.ring[k], 4, `v=${v}: key ${k} moved to the new node`);
    assert.equal(s.movedLast.ring, s.load.ring[4]);
  }
});

test('rule 4: removing a node moves only its keys, each to the next point clockwise', () => {
  const v = 10;
  const s = at({ from: 5, nodes: 4, vnodes: v });
  const before = at({ nodes: 5, vnodes: v });
  assert.equal(s.movedLast.ring, before.load.ring[4]);
  for (const k of s.moved.ring) assert.equal(before.owner.ring[k], 4);
  for (let k = 0; k < logic.KEYS; k++) if (before.owner.ring[k] !== 4) assert.equal(s.owner.ring[k], before.owner.ring[k]);
  // each moved key goes to the first surviving point after its old one
  for (const k of s.moved.ring.slice(0, 40)) {
    const h = s.keyHashes[k];
    const next = before.points.slice(logic.successor(before.points, h)).concat(before.points).find((x) => x.node !== 4);
    assert.equal(s.owner.ring[k], next.node);
  }
});

test('rule 4: with several nodes added at once, moved keys go only to the new nodes', () => {
  const s = at({ from: 3, nodes: 6, vnodes: 10 });
  for (const k of s.moved.ring) assert.ok(s.owner.ring[k] >= 3);
  assert.deepEqual(s.ideal, { num: 3, den: 6, keys: 500 });
});

// ── rule 5: virtual nodes even out the load ──

test('rule 5: more points per node give a more even load', () => {
  const spread = (v) => { const l = at({ nodes: 4, vnodes: v }).load.ring; return Math.max(...l) / Math.min(...l); };
  assert.ok(spread(100) < spread(1), `${spread(100)} < ${spread(1)}`);
  assert.ok(spread(100) < 1.6);
  assert.ok(spread(1) > 3);
});

test('rule 5: switching 10 → 100 points keeps the first 10 points of each node (names are a prefix)', () => {
  const a = logic.ringPoints(4, 10).filter((x) => x.j < 10).map((x) => x.h).sort();
  const b = logic.ringPoints(4, 100).filter((x) => x.j < 10).map((x) => x.h).sort();
  assert.deepEqual(a, b);
});

// ── state, ideal and the buttons ──

test('ideal: |change| / larger count of all keys', () => {
  assert.deepEqual(logic.ideal(4, 5), { num: 1, den: 5, keys: 200 });
  assert.deepEqual(logic.ideal(5, 4), { num: 1, den: 5, keys: 200 });
  assert.equal(logic.ideal(4, 4).keys, 0);
});

test('no change: from = nodes moves nothing', () => {
  const s = at({ from: 6, nodes: 6, vnodes: 10 });
  assert.deepEqual(s.movedLast, { mod: 0, ring: 0 });
  assert.deepEqual(s.arrived.ring, [0, 0, 0, 0, 0, 0]);
});

test('before: the points and loads of the from-count, so a removed node\'s points can be drawn', () => {
  const s = at({ from: 5, nodes: 4, vnodes: 10 });
  assert.equal(s.before.points.length, 50);
  assert.equal(s.before.points.filter((x) => x.node === 4).length, 10);
  assert.equal(s.points.filter((x) => x.node === 4).length, 0);
  assert.deepEqual(s.before.points, logic.ringPoints(5, 10));
});

test('loads add up to all keys; arrivals add up to the moved keys', () => {
  const s = at({ from: 7, nodes: 3, vnodes: 100 });
  assert.equal(s.load.mod.reduce((a, b) => a + b), logic.KEYS);
  assert.equal(s.load.ring.reduce((a, b) => a + b), logic.KEYS);
  assert.equal(s.arrived.mod.reduce((a, b) => a + b), s.movedLast.mod);
  assert.equal(s.arrived.ring.reduce((a, b) => a + b), s.movedLast.ring);
  assert.equal(s.before.load.ring.length, 7);
});

test('gave: keys each old node handed over; on the ring with one point, an added node takes from one neighbour', () => {
  const s = at({ from: 4, nodes: 5, vnodes: 1 });
  assert.equal(s.gave.ring.length, 4);
  assert.equal(s.gave.ring.reduce((a, b) => a + b), s.movedLast.ring);
  assert.equal(s.gave.ring.filter((x) => x > 0).length, 1);
  assert.equal(s.gave.mod.reduce((a, b) => a + b), s.movedLast.mod);
  assert.equal(at({ from: 4, nodes: 5, vnodes: 100 }).gave.ring.filter((x) => x > 0).length, 4);
});

test('add and remove buttons: the old count becomes from; refused at the bounds', () => {
  assert.deepEqual(logic.change({ nodes: 4, from: 4 }, 1), { from: 4, nodes: 5 });
  assert.deepEqual(logic.change({ nodes: 5, from: 4 }, -1), { from: 5, nodes: 4 });
  assert.deepEqual(logic.change({ nodes: 9 }, 1), { from: 9, nodes: 10 });
  assert.deepEqual(logic.change({ nodes: 3 }, -1), { from: 3, nodes: 2 });
  assert.equal(logic.change({ nodes: 10 }, 1), null);
  assert.equal(logic.change({ nodes: 2 }, -1), null);
});

test('out-of-range params are clamped to 2 … 10 nodes', () => {
  assert.equal(at({ nodes: 99, from: 0 }).nodes.length, 10);
  assert.equal(at({ nodes: 99, from: 0 }).from, 2);
});

// ── presets: the numbers in SPEC.md ──

test('preset mod-n-add: 4 → 5, mod-n moves 805 of 1000 keys', () => {
  const s = at(logic.presets[0].params);
  assert.equal(s.movedLast.mod, 805);
  assert.equal(s.ideal.keys, 200);
});

test('preset ring-add-1vnode: 234 keys move, loads uneven before (108 / 279 / 92 / 521)', () => {
  const s = at(logic.presets[1].params);
  assert.equal(s.movedLast.ring, 234);
  assert.deepEqual(s.before.load.ring, [108, 279, 92, 521]);
  assert.deepEqual(s.load.ring, [108, 45, 92, 521, 234]);
});

test('preset ring-add-100vnodes: 225 keys move, loads 292 / 256 / 248 / 204 before, 165–225 after', () => {
  const s = at(logic.presets[2].params);
  assert.equal(s.movedLast.ring, 225);
  assert.deepEqual(s.before.load.ring, [292, 256, 248, 204]);
  assert.equal(Math.min(...s.load.ring), 165);
  assert.equal(Math.max(...s.load.ring), 225);
});

test('preset remove-node: 5 → 4, the ring moves only E\'s 225 keys, spread over all four; mod-n 805', () => {
  const s = at(logic.presets[3].params);
  assert.equal(s.movedLast.ring, 225);
  assert.equal(s.movedLast.mod, 805);
  assert.deepEqual(s.arrived.ring, [73, 72, 41, 39]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const pr of logic.presets) {
    const s = at(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the state is a pure function of the params (deterministic, explorer)', () => {
  const p = P({ from: 3, nodes: 8, vnodes: 10 });
  assert.deepEqual(logic.initial(p), logic.initial(Object.assign({}, p)));
  assert.equal(kit.stepsOf(logic, p), 0);
  assert.deepEqual(kit.stateAt(logic, p, 0), logic.initial(p));
});

test('initial does not mutate its input, and states do not share arrays', () => {
  const p = P({ from: 4, nodes: 5 });
  const copy = structuredClone(p);
  const a = logic.initial(p);
  a.keyHashes[0] = -1;
  a.load.ring[0] = -1;
  assert.deepEqual(p, copy);
  const b = logic.initial(p);
  assert.notEqual(b.keyHashes[0], -1);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `preset param ${k}`);
  const json = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  for (const e of json.entries || []) assert.ok(logic.presets.some((x) => x.id === e.preset), `entry ${e.preset}`);
});
