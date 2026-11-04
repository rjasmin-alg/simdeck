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


// ── Windows failover sequence (task win-failover-cluster; SPEC.md "Windows failover sequence") ──

const W = (nodes, ev, over) => P(Object.assign({ scene: 'win', failover: true, nodes, ['ev' + nodes]: ev }, over));
/** Every step as "phase total: side votes/total Q|- act@node; …" (live sides only). */
const trace = (p) => {
  const out = [];
  for (let n = 0; n <= steps(p); n++) {
    const s = at(p, n);
    out.push(`${s.phase} ${s.total}: ` + s.sides.filter((x) => !x.down).map((x) => `${x.members.join('')} ${x.counted ? x.votes + '/' + x.total + (x.quorum ? ' Q' : ' -') : '?'}${x.running ? '@' + x.node : ''}`).join('; '));
  }
  return out;
};
const votes = (s) => s.nodes.map((x) => x.id + x.votes).join(' ') + (s.witness ? ' W' + s.witness.votes : '');
const last = (p) => end(p).sides.filter((x) => !x.down).map((x) => `${x.members.join('')} ${x.votes}/${x.total} ${x.quorum ? 'Q' : '-'}${x.running ? '@' + x.node : ''}`);

test('W-T6: in a tie dynamic quorum drops the vote of the last voting node, or of A when chosen', () => {
  // four nodes, no witness: an even total, so one node gives up its vote at the start
  assert.equal(votes(at(W(4, 'AB|CD', { wkind: 'none', votes: 'dynamic' }), 0)), 'A1 B1 C1 D0');
  assert.equal(votes(at(W(4, 'AB|CD', { wkind: 'none', votes: 'dynamicA' }), 0)), 'A0 B1 C1 D1');
  assert.deepEqual(at(W(4, 'AB|CD', { wkind: 'none', votes: 'dynamic' }), 0).adjust.tie, { node: 'D', before: 4 });
  // the 2 : 2 split then has a winner, and the choice decides which side
  assert.deepEqual(last(W(4, 'AB|CD', { wkind: 'none', votes: 'dynamic' })), ['AB 1/1 Q@A', 'CD 0/1 -']);
  assert.deepEqual(trace(W(4, 'AB|CD', { wkind: 'none', votes: 'dynamic' }))[2], 'recount 3: AB 2/3 Q@A; CD 1/3 -');
  assert.deepEqual(trace(W(4, 'AB|CD', { wkind: 'none', votes: 'dynamicA' }))[2], 'recount 3: AB 1/3 -; CD 2/3 Q@C');
  // the witness gone, two nodes left: B (the last) gives up its vote, so A survives B; with A chosen it does not
  assert.deepEqual(last(W(2, 'W,!B', { votes: 'dynamic' })), ['A 1/1 Q@A']);
  assert.deepEqual(last(W(2, 'W,!B', { votes: 'dynamicA' })), ['A 0/1 -']);
  // the tie never drops a vote outside the side with quorum
  assert.equal(votes(end(W(4, 'AB|CD', { wkind: 'none', votes: 'dynamicA' }))), 'A0 B0 C1 D0');
});

test('W-T1, W-T3: roles move to the lowest up node of the quorum side; a failed witness node hands the witness on', () => {
  // A (with the roles) fails; the witness sat with A, so it answers B's side: B + witness 2 of 3
  assert.deepEqual(trace(W(2, '!A', { wkind: 'fileshare' })), ['start 3: AB 3/3 Q@A', 'event 3: B ?', 'recount 3: B 2/3 Q@B']);
  assert.equal(end(W(2, '!A', { wkind: 'fileshare' })).sides[0].act, 'start');
  assert.deepEqual(end(W(2, '!A', { wkind: 'fileshare' })).lost, ['A']);
  // the roles go down with A at once, before the recount
  assert.deepEqual(at(W(2, '!A', { wkind: 'fileshare' }), 1).resource.runningOn, []);
  assert.deepEqual(at(W(2, '!A', { wkind: 'fileshare' }), 1).sides.map((x) => [x.members.join(''), x.down, x.node]), [['B', false, null], ['A', true, 'A']]);
  assert.deepEqual(trace(W(4, 'AB|CD', { wkind: 'disk', witnessAt: 'last' }))[2], 'recount 5: AB 2/5 -; CD 3/5 Q@C');
});

test('W1: quorum is more than half of all assigned votes; static votes keep failed members in the total', () => {
  assert.deepEqual(trace(W(3, '!C,!B', { wkind: 'fileshare' })), [
    'start 4: ABC 4/4 Q@A', 'event 4: AB ?@A', 'recount 4: AB 3/4 Q@A', 'event 4: A ?@A', 'recount 4: A 2/4 -']);
  assert.deepEqual(last(W(2, 'W,!B', { wkind: 'cloud' })), ['A 1/3 -']);
  assert.equal(end(W(2, 'W,!B')).total, 3);
  // without quorum the roles stop everywhere
  assert.deepEqual(end(W(3, '!C,!B', { wkind: 'fileshare' })).resource.runningOn, []);
  assert.equal(end(W(3, '!C,!B', { wkind: 'fileshare' })).sides[0].act, 'stop');
});

test('W2: the witness vote goes to the side that owns the disk or locks the file, whatever its kind', () => {
  for (const wkind of ['disk', 'fileshare', 'cloud']) {
    assert.deepEqual(trace(W(4, 'AB|CD', { wkind }))[2], 'recount 5: AB 3/5 Q@A; CD 2/5 -');
    assert.deepEqual(trace(W(4, 'AB|CD', { wkind, witnessAt: 'last' }))[2], 'recount 5: AB 2/5 -; CD 3/5 Q@C');
    assert.equal(at(W(4, 'AB|CD', { wkind }), 2).sides[0].witness, true);
    assert.equal(at(W(4, 'AB|CD', { wkind }), 2).sides[1].witness, false);
  }
  // a witness that is gone gives its vote to nobody
  assert.equal(at(W(4, 'W,AB|CD', { wkind: 'disk' }), 3).witness.reach, null);
  assert.deepEqual(trace(W(4, 'W,AB|CD', { wkind: 'disk' }))[4], 'recount 5: AB 2/5 -; CD 2/5 -');
});

test('W3: an even node count without a witness splits 50/50 and both halves stop', () => {
  assert.deepEqual(trace(W(2, 'A|B', { wkind: 'none' })), ['start 2: AB 2/2 Q@A', 'event 2: A ?@A; B ?', 'recount 2: A 1/2 -; B 1/2 -']);
  assert.deepEqual(trace(W(4, 'AB|CD', { wkind: 'none' }))[2], 'recount 4: AB 2/4 -; CD 2/4 -');
  // a three-way split leaves nobody, dynamic or not, and nothing is adjusted without quorum
  const p = W(5, 'AB|CD|E', { wkind: 'none', votes: 'dynamic' });
  assert.deepEqual(trace(p), ['start 5: ABCDE 5/5 Q@A', 'event 5: AB ?@A; CD ?; E ?', 'recount 5: AB 2/5 -; CD 2/5 -; E 1/5 -']);
  assert.equal(votes(end(p)), 'A1 B1 C1 D1 E1');
});

test('W4: dynamic quorum removes a failed node\'s vote while the cluster has quorum: last man standing', () => {
  const p = W(4, '!D,!C,!B', { wkind: 'none', votes: 'dynamic' });
  // start: D gives up its vote (tie); D fails (nothing to adjust); C fails: its vote goes and B gives up its own
  assert.deepEqual(trace(p), ['start 3: ABCD 3/3 Q@A', 'event 3: ABC ?@A', 'recount 3: ABC 3/3 Q@A', 'event 3: AB ?@A',
    'recount 3: AB 2/3 Q@A', 'adjust 1: AB 1/1 Q@A', 'event 1: A ?@A', 'recount 1: A 1/1 Q@A']);
  assert.deepEqual(at(p, 5).adjust.removed, ['C']);
  // the adjust marks the live side (its votes and total changed), not the failed nodes
  assert.deepEqual(at(p, 5).changed, [0]);
  // static: the same sequence stops at C
  assert.deepEqual(trace(W(4, '!D,!C,!B', { wkind: 'none' })).slice(-1), ['recount 4: A 1/4 -']);
  // a node cut off in the minority side also loses its vote; two node votes left, so the witness keeps its own
  assert.equal(votes(end(W(4, 'AB|CD', { wkind: 'disk', votes: 'dynamic' }))), 'A1 B1 C0 D0 W1');
});

test('W5: dynamic witness: the witness votes only when the node votes are even', () => {
  assert.equal(votes(at(W(3, '!C', { votes: 'dynamic' }), 0)), 'A1 B1 C1 W0');
  assert.equal(at(W(3, '!C', { votes: 'dynamic' }), 0).total, 3);
  assert.equal(votes(at(W(2, '!B', { votes: 'dynamic' }), 0)), 'A1 B1 W1');
  assert.equal(at(W(2, '!B', { votes: 'dynamic' }), 0).adjust, null);
  // C fails: two node votes left, even, so the witness gets its vote back
  assert.deepEqual(at(W(3, '!C', { votes: 'dynamic' }), 3).adjust.witness, [0, 1]);
  assert.equal(votes(at(W(3, '!C', { votes: 'dynamic' }), 3)), 'A1 B1 C0 W1');
  // a witness that is gone loses its vote
  assert.deepEqual(at(W(2, 'W,!B', { votes: 'dynamic' }), 3).adjust.witness, [1, 0]);
  // static votes: the witness always votes
  assert.equal(votes(at(W(3, '!C'), 0)), 'A1 B1 C1 W1');
});

test('W-events: a witness event without a witness is skipped; never two quorums; at most 13 steps', () => {
  assert.equal(steps(W(2, 'W,!B', { wkind: 'none' })), 2);
  assert.equal(at(W(2, 'W,!B', { wkind: 'none' }), 1).ev.type, 'fail');
  let max = 0;
  for (const nodes of [2, 3, 4, 5]) for (const ev of logic.EVENTS[nodes]) for (const wkind of logic.KINDS)
    for (const witnessAt of ['first', 'last']) for (const votes of logic.VOTES) {
      const p = W(nodes, ev, { wkind, witnessAt, votes });
      max = Math.max(max, steps(p));
      for (let n = 0; n <= steps(p); n++) {
        const s = at(p, n);
        assert.ok(s.sides.filter((x) => x.quorum).length <= 1, `${nodes} ${ev} ${wkind} ${n}`);
        assert.ok(s.resource.runningOn.length <= 1);
        assert.ok(s.total >= 1);
      }
    }
  assert.ok(max <= 20);
  assert.equal(max, 9);
});

test('W-presets: the numbers in SPEC.md', () => {
  const pr = {
    'win-2node-fsw': W(2, '!B', { wkind: 'fileshare' }),
    'win-2node-none': W(2, 'A|B', { wkind: 'none' }),
    'win-4node-split': W(4, 'AB|CD', { wkind: 'disk' }),
    'win-dynamic': W(3, '!C,!B', { wkind: 'fileshare', votes: 'dynamic' }),
    'win-witness-lost': W(2, 'W,!B', { wkind: 'fileshare' })
  };
  assert.deepEqual(trace(pr['win-2node-fsw']), ['start 3: AB 3/3 Q@A', 'event 3: A ?@A', 'recount 3: A 2/3 Q@A']);
  assert.equal(end(pr['win-2node-fsw']).sides[0].witness, true);
  assert.deepEqual(trace(pr['win-2node-none']).slice(-1), ['recount 2: A 1/2 -; B 1/2 -']);
  assert.deepEqual(trace(pr['win-4node-split']).slice(-1), ['recount 5: AB 3/5 Q@A; CD 2/5 -']);
  assert.deepEqual(trace(W(4, 'AB|CD', { wkind: 'none' })).slice(-1), ['recount 4: AB 2/4 -; CD 2/4 -']);
  assert.deepEqual(trace(pr['win-dynamic']), ['start 3: ABC 3/3 Q@A', 'event 3: AB ?@A', 'recount 3: AB 2/3 Q@A',
    'adjust 3: AB 3/3 Q@A', 'event 3: A ?@A', 'recount 3: A 2/3 Q@A', 'adjust 1: A 1/1 Q@A']);
  assert.deepEqual(trace(W(3, '!C,!B', { wkind: 'fileshare' })).slice(-1), ['recount 4: A 2/4 -']);
  assert.deepEqual(trace(pr['win-witness-lost']), ['start 3: AB 3/3 Q@A', 'event 3: AB ?@A', 'recount 3: AB 2/3 Q@A',
    'event 3: A ?@A', 'recount 3: A 1/3 -']);
  assert.deepEqual(trace(W(2, 'W,!B', { wkind: 'fileshare', votes: 'dynamic' })), ['start 3: AB 3/3 Q@A', 'event 3: AB ?@A',
    'recount 3: AB 2/3 Q@A', 'adjust 1: AB 1/1 Q@A', 'event 1: A ?@A', 'recount 1: A 1/1 Q@A']);
  const want = { 'win-2node-fsw': 2, 'win-2node-none': 2, 'win-4node-split': 2, 'win-dynamic': 6, 'win-witness-lost': 4 };
  for (const id of Object.keys(want)) assert.equal(steps(pr[id]), want[id], id);
});

test('W-off: the failover flow is off by default and the classic flow ignores its params', () => {
  assert.equal(logic.defaults.failover, false);
  const a = cfg(4, 'AB|CD', { witness: true });
  const b = cfg(4, 'AB|CD', { witness: true, wkind: 'none', votes: 'dynamicA', ev4: 'W,AB|CD' });
  for (let n = 0; n <= steps(a); n++) assert.deepEqual(at(b, n), at(a, n));
  assert.equal(at(a, 0).mode, undefined);
});

// ── presets (SPEC.md table) ──

test('presets: the numbers in SPEC.md', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const ids = [...html.matchAll(/\{ id: '([a-z0-9-]+)',/g)].map((m) => m[1]);
  assert.deepEqual(ids, ['three-nodes', 'four-nodes', 'two-plus-witness', 'five-three-way', 'split-brain', 'ceph-mons',
    'win-2node-fsw', 'win-2node-none', 'win-4node-split', 'win-dynamic', 'win-witness-lost']);
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

const SAMPLES = [P({}), cfg(2, 'A|B', { policy: 'ignore' }), cfg(5, 'AB|CD|E', { policy: 'ignore', witness: true }), cfg(2, '!A|B', { witness: true }),
  W(3, '!C,!B', { wkind: 'fileshare', votes: 'dynamic' }), W(4, 'W,AB|CD', { wkind: 'disk', votes: 'dynamicA' })];

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
