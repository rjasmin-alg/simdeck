// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for quorum-split-brain's model: tie-breaks first, then one test per rule (SPEC.md), then the presets'
// numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const steps = (p) => kit.stepsOf(logic, p);
const at = (p, n) => kit.stateAt(logic, p, n);
const end = (p) => at(p, steps(p));
/** Sides after the count as "members votes/total Q|-" (! for a failed node, W when the side has the witness). */
const counts = (p) => at(p, 2).sides.map((s) => `${s.down ? '!' : ''}${s.members.join('')} ${s.votes}/${s.total} ${s.quorum ? 'Q' : '-'}${s.witness ? ' W' : ''}`);
/** Sides after the act as "members:act@node". */
const acts = (p) => at(p, 3).sides.map((s) => `${s.members.join('')}:${s.act}${s.node ? '@' + s.node : ''}`);
const cfg = (nodes, split, over) => P(Object.assign({ nodes, ['split' + nodes]: split }, over));

// ── tie-breaks ──

test('T1: a quorum side without the resource starts it on its lowest-id up node', () => {
  assert.deepEqual(acts(cfg(3, 'A|BC')), ['A:stop@A', 'BC:start@B']);
  assert.deepEqual(acts(cfg(4, 'A|BCD')), ['A:stop@A', 'BCD:start@B']);
  // after a heal with nothing running, the whole cluster starts it on A
  const h = end(cfg(4, 'AB|CD'));
  assert.equal(h.sides[0].act, 'start');
  assert.equal(h.sides[0].node, 'A');
  assert.deepEqual(h.resource.runningOn, ['A']);
});

test('T2: exactly half is not quorum (2 of 4, 1 of 2); one more than half is', () => {
  assert.equal(logic.neededOf(4), 3);
  assert.equal(logic.neededOf(2), 2);
  assert.equal(logic.neededOf(3), 2);
  assert.equal(logic.neededOf(5), 3);
  assert.deepEqual(counts(cfg(4, 'AB|CD')), ['AB 2/4 -', 'CD 2/4 -']);
  assert.deepEqual(counts(cfg(2, 'A|B')), ['A 1/2 -', 'B 1/2 -']);
  assert.deepEqual(counts(cfg(4, 'ABC|D')), ['ABC 3/4 Q', 'D 1/4 -']);
});

test('T3: the witness answers the side of its node; a failed node cuts no link, so it answers the side still up', () => {
  // two nodes and a witness survive losing either node: what the witness is for
  for (const witnessAt of ['first', 'last']) {
    assert.deepEqual(counts(cfg(2, '!A|B', { witness: true, witnessAt })), ['!A 0/3 -', 'B 2/3 Q W']);
    assert.deepEqual(acts(cfg(2, '!A|B', { witness: true, witnessAt })), ['A:lost@A', 'B:start@B']);
    assert.deepEqual(counts(cfg(2, 'A|!B', { witness: true, witnessAt })), ['A 2/3 Q W', '!B 0/3 -']);
    assert.deepEqual(acts(cfg(2, 'A|!B', { witness: true, witnessAt })), ['A:keep@A', 'B:off']);
  }
  assert.deepEqual(counts(cfg(3, 'AB|!C', { witness: true, witnessAt: 'last' })), ['AB 3/4 Q W', '!C 0/4 -']);
  // in a partition the witness stays with its own node's side
  assert.deepEqual(counts(cfg(2, 'A|B', { witness: true, witnessAt: 'last' })), ['A 1/3 -', 'B 2/3 Q W']);
  // 'last' is the last node of the cluster, whatever the count
  assert.equal(at(cfg(5, 'ABCD|E', { witness: true, witnessAt: 'last' }), 1).witness.reach, 'E');
  assert.equal(at(cfg(3, 'AB|C', { witness: true }), 1).witness.reach, 'A');
});

test('T4: sides are in split order, a failed node in its place', () => {
  assert.deepEqual(at(cfg(5, 'AB|CD|E'), 1).sides.map((s) => s.members.join('')), ['AB', 'CD', 'E']);
  assert.deepEqual(at(cfg(3, 'AB|!C'), 1).sides.map((s) => [s.members.join(''), s.down]), [['AB', false], ['C', true]]);
  assert.deepEqual(at(cfg(2, '!A|B'), 1).sides.map((s) => [s.members.join(''), s.down]), [['A', true], ['B', false]]);
});

test('T5: write values follow side order among the running sides', () => {
  const p = cfg(5, 'AB|CD|E', { policy: 'ignore' });
  assert.equal(steps(p), 7);
  assert.deepEqual(end(p).writes, [{ side: 0, node: 'A', value: 1 }, { side: 1, node: 'C', value: 2 }, { side: 2, node: 'E', value: 3 }]);
});

// ── rules ──

test('rule 1: quorum counts against the configured total, including failed nodes and the witness', () => {
  // C failed: AB still has 2 of 3 configured votes
  assert.deepEqual(counts(cfg(3, 'AB|!C')), ['AB 2/3 Q', '!C 0/3 -']);
  // B failed in a pair: A has 1 of 2, not 1 of 1
  assert.deepEqual(counts(cfg(2, 'A|!B')), ['A 1/2 -', '!B 0/2 -']);
  assert.deepEqual(acts(cfg(2, 'A|!B')), ['A:stop@A', 'B:off']);
  // the witness is configured even where nobody reaches it
  assert.equal(at(cfg(4, 'AB|CD', { witness: true }), 2).total, 5);
  // step 0: one side with every vote
  const s0 = at(cfg(3, 'AB|C'), 0);
  assert.deepEqual(s0.sides.map((s) => [s.members.join(''), s.votes, s.quorum, s.node]), [['ABC', 3, true, 'A']]);
});

test('rule 2: with policy stop, quorum keeps or starts, no quorum stops or stays off', () => {
  assert.deepEqual(acts(cfg(3, 'AB|C')), ['AB:keep@A', 'C:off']);
  assert.deepEqual(acts(cfg(3, 'A|BC')), ['A:stop@A', 'BC:start@B']);
  assert.deepEqual(at(cfg(3, 'A|BC'), 3).resource.runningOn, ['B']);
  assert.deepEqual(at(cfg(3, 'A|B|C'), 3).resource.runningOn, []);
});

test('rule 3: even splits leave no side with quorum; four nodes do worse than three', () => {
  assert.deepEqual(counts(cfg(4, 'AB|CD')), ['AB 2/4 -', 'CD 2/4 -']);
  assert.deepEqual(acts(cfg(4, 'AB|CD')), ['AB:stop@A', 'CD:off']);
  assert.deepEqual(acts(cfg(2, 'A|B')), ['A:stop@A', 'B:off']);
  // the same cut with three nodes keeps the service
  assert.deepEqual(acts(cfg(3, 'AB|C')), ['AB:keep@A', 'C:off']);
});

test('rule 4: the witness adds one vote to the one side that reaches it', () => {
  assert.deepEqual(counts(cfg(2, 'A|B', { witness: true })), ['A 2/3 Q W', 'B 1/3 -']);
  assert.deepEqual(counts(cfg(2, 'A|B', { witness: true, witnessAt: 'last' })), ['A 1/3 -', 'B 2/3 Q W']);
  assert.deepEqual(counts(cfg(4, 'AB|CD', { witness: true })), ['AB 3/5 Q W', 'CD 2/5 -']);
  // on an odd count the witness makes the total even: 2 and 2 of 4, none
  assert.deepEqual(counts(cfg(3, 'AB|C', { witness: true, witnessAt: 'last' })), ['AB 2/4 -', 'C 2/4 - W']);
  // the witness never runs the resource
  for (const sp of logic.SPLITS[2]) for (const wa of ['first', 'last']) {
    const p = cfg(2, sp, { witness: true, witnessAt: wa });
    for (let n = 0; n <= steps(p); n++) assert.ok(at(p, n).resource.runningOn.every((id) => logic.IDS.includes(id)));
  }
});

test('rule 5: three or more sides: quorum only if one side alone has the majority; never two quorums', () => {
  assert.deepEqual(counts(cfg(5, 'AB|CD|E')), ['AB 2/5 -', 'CD 2/5 -', 'E 1/5 -']);
  assert.deepEqual(counts(cfg(3, 'A|B|C')), ['A 1/3 -', 'B 1/3 -', 'C 1/3 -']);
  assert.deepEqual(counts(cfg(4, 'AB|C|D', { witness: true })), ['AB 3/5 Q W', 'C 1/5 -', 'D 1/5 -']);
  for (const nodes of [2, 3, 4, 5]) for (const sp of logic.SPLITS[nodes]) for (const witness of [false, true]) for (const witnessAt of ['first', 'last']) {
    const s = at(cfg(nodes, sp, { witness, witnessAt }), 2);
    assert.ok(s.sides.filter((x) => x.quorum).length <= 1, `${nodes} ${sp} ${witness} ${witnessAt}`);
  }
});

test('rule 6: policy ignore: every live side runs the service, takes its own write, and the copies differ', () => {
  const p = cfg(2, 'A|B', { policy: 'ignore' });
  assert.deepEqual(acts(p), ['A:keep@A', 'B:start@B']);
  assert.equal(at(p, 3).splitBrain, true);
  assert.equal(steps(p), 6);
  assert.deepEqual(at(p, 4).sides.map((s) => s.value), [1, 0]);
  assert.deepEqual(at(p, 5).sides.map((s) => s.value), [1, 2]);
  const h = end(p);
  assert.equal(h.phase, 'heal');
  assert.equal(h.sides.length, 1);
  assert.equal(h.sides[0].act, 'conflict');
  assert.equal(h.sides[0].diverged, true);
  assert.deepEqual(h.sides[0].copies.map((c) => [c.node, c.value]), [['A', 1], ['B', 2]]);
  assert.deepEqual(h.resource.runningOn, ['A', 'B']);
  // with policy stop the same split runs nothing, takes no writes and has 4 steps
  const q = cfg(2, 'A|B');
  assert.equal(steps(q), 4);
  assert.deepEqual(end(q).writes, []);
  assert.equal(end(q).sides[0].diverged, false);
  // ignore with a single live side is no split-brain: 4 steps, one copy
  const r = cfg(2, 'A|!B', { policy: 'ignore' });
  assert.equal(steps(r), 4);
  assert.deepEqual(acts(r), ['A:keep@A', 'B:off']);
  assert.equal(end(r).sides[0].diverged, false);
});

test('rule 8: a failed node is a side of one with zero votes; a copy there is lost, not stopped', () => {
  const p = cfg(2, '!A|B');
  const s1 = at(p, 1);
  assert.equal(s1.nodes[0].up, false);
  assert.deepEqual(s1.resource.runningOn, []);
  assert.deepEqual(counts(p), ['!A 0/2 -', 'B 1/2 -']);
  assert.deepEqual(acts(p), ['A:lost@A', 'B:off']);
  // links to a failed node are dead but not counted as cut
  assert.deepEqual(at(cfg(3, 'AB|!C'), 1).cut, []);
  assert.deepEqual(at(cfg(3, 'AB|C'), 1).cut.sort(), ['BC', 'CA']);
  // the heal brings the links back, not the node
  const h = end(cfg(3, 'AB|!C'));
  assert.deepEqual(h.sides.map((s) => [s.members.join(''), s.down]), [['AB', false], ['C', true]]);
  assert.equal(h.nodes[2].up, false);
});

test('heal: the whole cluster reaches the witness again; failed nodes and their links stay down', () => {
  assert.equal(end(cfg(4, 'AB|CD', { witness: true })).sides[0].votes, 5);
  assert.equal(end(cfg(2, 'A|B', { witness: true, witnessAt: 'last' })).sides[0].witness, true);
  assert.equal(end(cfg(2, 'A|B', { witness: true })).sides[0].votes, 3);
  // the healed side reaches the witness even when its node (the last one) has failed
  assert.deepEqual(['AB', 3, true], ((x) => [x.members.join(''), x.votes, x.witness])(end(cfg(3, 'AB|!C', { witness: true, witnessAt: 'last' })).sides[0]));
  const h = end(cfg(3, 'AB|!C'));
  assert.deepEqual(h.links.filter((l) => l.a === 'C' || l.b === 'C').map((l) => l.up), [false, false]);
  assert.ok(h.links.filter((l) => l.a !== 'C' && l.b !== 'C').every((l) => l.up));
  // a failed node's card keeps its count and what happened to its copy
  const f = end(cfg(2, '!A|B'))[`sides`][1];
  assert.deepEqual([f.members.join(''), f.down, f.counted, f.act, f.node, f.running], ['A', true, true, 'lost', 'A', false]);
});

test('a failed side runs nothing from the partition on; one live copy is no split-brain', () => {
  assert.equal(at(cfg(2, '!A|B'), 1).sides[0].running, false);
  assert.equal(at(cfg(2, 'A|!B', { policy: 'ignore' }), 3).splitBrain, false);
  assert.equal(at(cfg(2, 'A|B', { policy: 'ignore' }), 3).splitBrain, true);
});

test('heal: one copy ran → everyone takes its data; none ran → the healed quorum starts it', () => {
  const a = end(cfg(3, 'AB|C'));
  assert.deepEqual([a.sides[0].members.join(''), a.sides[0].act, a.sides[0].node, a.sides[0].quorum], ['ABC', 'keep', 'A', true]);
  assert.ok(a.links.every((l) => l.up));
  const b = end(cfg(5, 'AB|CD|E'));
  assert.deepEqual([b.sides[0].act, b.sides[0].node, b.sides[0].votes], ['start', 'A', 5]);
  // a lone survivor without quorum stays off
  const c = end(cfg(2, 'A|!B'));
  assert.deepEqual([c.sides[0].act, c.sides[0].quorum], ['off', false]);
});

test('ceph scene: no witness and no ignore, whatever the params say', () => {
  const p = cfg(2, 'A|B', { scene: 'ceph', witness: true, policy: 'ignore' });
  assert.equal(at(p, 0).witness, null);
  assert.equal(at(p, 0).policy, 'stop');
  assert.deepEqual(acts(p), ['A:stop@A', 'B:off']);
  assert.equal(steps(p), 4);
});

test('changed marks sides whose status, resource or data changed', () => {
  const p = cfg(3, 'A|BC');
  assert.deepEqual(at(p, 1).changed, [0, 1]);
  assert.deepEqual(at(p, 2).changed, [0, 1]);
  assert.deepEqual(at(p, 3).changed, [0, 1], 'A stops, BC starts');
  const q = cfg(3, 'AB|C');
  assert.deepEqual(at(q, 3).changed, [], 'AB keeps, C stays off: nothing changed');
  const r = cfg(2, 'A|B', { policy: 'ignore' });
  assert.deepEqual(at(r, 4).changed, [0]);
  assert.deepEqual(at(r, 5).changed, [1]);
});

test('an unknown split or node count falls back to a valid one', () => {
  const p = P({ nodes: 9, split5: 'nope' });
  assert.equal(at(p, 0).n, 5);
  assert.equal(at(p, 0).split, 'ABC|DE');
  assert.deepEqual(logic.ringOf(2), [{ a: 'A', b: 'B', up: true }]);
  assert.equal(logic.ringOf(5).length, 5);
});

// ── presets (SPEC.md table) ──

test('presets: the numbers in SPEC.md', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const ids = [...html.matchAll(/\{ id: '([a-z-]+)',/g)].map((m) => m[1]);
  assert.deepEqual(ids, ['three-nodes', 'four-nodes', 'two-plus-witness', 'five-three-way', 'split-brain', 'ceph-mons']);
  const pr = {
    'three-nodes': P({ nodes: 3, split3: 'AB|C' }),
    'four-nodes': P({ nodes: 4, split4: 'AB|CD' }),
    'two-plus-witness': P({ scene: 'win', nodes: 2, split2: 'A|B', witness: true }),
    'five-three-way': P({ nodes: 5, split5: 'AB|CD|E' }),
    'split-brain': P({ nodes: 2, split2: 'A|B', policy: 'ignore' }),
    'ceph-mons': P({ scene: 'ceph', nodes: 3, split3: 'A|B|C' })
  };
  assert.deepEqual(counts(pr['three-nodes']), ['AB 2/3 Q', 'C 1/3 -']);
  assert.deepEqual(acts(pr['three-nodes']), ['AB:keep@A', 'C:off']);
  assert.deepEqual(counts(pr['four-nodes']), ['AB 2/4 -', 'CD 2/4 -']);
  assert.deepEqual(acts(pr['four-nodes']), ['AB:stop@A', 'CD:off']);
  assert.deepEqual(counts(pr['two-plus-witness']), ['A 2/3 Q W', 'B 1/3 -']);
  assert.deepEqual(acts(pr['two-plus-witness']), ['A:keep@A', 'B:off']);
  assert.deepEqual(counts(pr['five-three-way']), ['AB 2/5 -', 'CD 2/5 -', 'E 1/5 -']);
  assert.deepEqual(acts(pr['five-three-way']), ['AB:stop@A', 'CD:off', 'E:off']);
  assert.deepEqual(acts(pr['split-brain']), ['A:keep@A', 'B:start@B']);
  assert.deepEqual(counts(pr['ceph-mons']), ['A 1/3 -', 'B 1/3 -', 'C 1/3 -']);
  assert.deepEqual(acts(pr['ceph-mons']), ['A:stop@A', 'B:off', 'C:off']);
  const want = { 'three-nodes': 4, 'four-nodes': 4, 'two-plus-witness': 4, 'five-three-way': 4, 'split-brain': 6, 'ceph-mons': 4 };
  for (const id of Object.keys(want)) assert.equal(steps(pr[id]), want[id], id);
});

test('no combination of params exceeds 20 steps; the most is 7', () => {
  let max = 0;
  for (const scene of ['ha', 'win', 'ceph']) for (const nodes of [2, 3, 4, 5]) for (const sp of logic.SPLITS[nodes])
    for (const witness of [false, true]) for (const witnessAt of ['first', 'last']) for (const policy of ['stop', 'ignore']) {
      max = Math.max(max, steps(cfg(nodes, sp, { scene, witness, witnessAt, policy })));
    }
  assert.equal(max, 7);
});

// ── generic checks every sim keeps ──

const SAMPLES = [P({}), cfg(2, 'A|B', { policy: 'ignore' }), cfg(5, 'AB|CD|E', { policy: 'ignore', witness: true }), cfg(2, '!A|B', { witness: true })];

test('state is JSON-safe at every step', () => {
  for (const p of SAMPLES) for (let n = 0; n <= steps(p); n++) {
    const s = at(p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const p of SAMPLES) {
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = cfg(2, 'A|B', { policy: 'ignore' });
  for (let n = 1; n <= steps(p); n++) {
    const prev = at(p, n - 1);
    const copy = structuredClone(prev);
    logic.step(prev, n, p);
    assert.deepEqual(prev, copy);
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, steps(P({})), 'meta.steps matches the model at the defaults');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
