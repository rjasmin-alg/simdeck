// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-multipath's model: the rules of SPEC.md (tie-breaks first), the presets' numbers, then the generic
// block every sim keeps. Run: node --test sims/lnx-multipath/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const tries = (s) => s.io.map((io) => io.tries.join('>'));
const states = (s) => s.paths.map((x) => x.dev + (x.state === 'active' ? '+' : '-')).join(' ');
const presetParams = (id) => logic.PRESETS.find((x) => x.id === id).params;

// ── tie-breaks ──

test('tie-break (rule 3): round-robin takes the next usable path after the last used, in list order, wrapping', () => {
  // multibus: one request per path, sda first
  assert.deepEqual(tries(at({ grouping: 'multibus', fault: 'sdb' }, 1)), ['sda', 'sdb', 'sdc', 'sdd']);
  // sdb dead from tick 2: skipped from tick 3 on, the rotation goes on from the last used path
  assert.deepEqual(tries(at({ grouping: 'multibus', fault: 'sdb' }, 3)), ['sdc', 'sdd', 'sda', 'sdc']);
  assert.deepEqual(tries(at({ grouping: 'multibus', fault: 'sdb' }, 4)), ['sdd', 'sda', 'sdc', 'sdd']);
});

test('tie-break (rule 3): after a group switch the new group starts at its first path after the last used', () => {
  // the last path used in group 1 was sdb (index 1); in [sdc sdd] the next after it is sdc. With this layout that is
  // also the group's first path, so the global-order rule cannot be told apart from a reset (SPEC.md, rule 3)
  const s = at({}, 2);
  assert.deepEqual(tries(s), ['sda>sdb>sdc', 'sdd', 'sdc', 'sdd']);
});

test('tie-break (rules 5, 6): equal priority groups: the first in the map wins, so failback returns to [sda]', () => {
  const s0 = at({ grouping: 'failover' }, 0);
  assert.deepEqual(s0.groups.map((g) => g.devs.join(' ')), ['sda', 'sdb', 'sdc', 'sdd']);
  assert.equal(s0.activeGroup, 1);
  // h0 down: [sda] → [sdb] (prio 50 ties with [sda], beats [sdc] 10)
  assert.equal(at({ grouping: 'failover', fault: 'h0' }, 2).activeGroup, 2);
  // h0 back at tick 5: [sda] and [sdb] tie at 50, the first wins
  assert.equal(at({ grouping: 'failover', fault: 'h0' }, 5).activeGroup, 1);
});

test('tie-break (rule 5): on equal priority the group with more usable paths wins', () => {
  const s = logic.initial(P({}));
  s.groups = [{ id: 1, prio: 50, devs: ['sda'] }, { id: 2, prio: 50, devs: ['sdb', 'sdd'] }];
  s.paths.forEach((x) => { x.prio = 50; });
  assert.equal(logic.bestGroup(s), 2);
  s.paths.find((x) => x.dev === 'sdd').state = 'failed';
  assert.equal(logic.bestGroup(s), 1, 'one usable path each: the map order decides');
});

test('tie-break (rule 5): the group choice uses the live priority of usable paths, not the configured one', () => {
  const s = logic.initial(P({}));
  s.groups = [{ id: 1, prio: 30, devs: ['sda', 'sdc'] }, { id: 2, prio: 20, devs: ['sdd'] }];
  s.paths.find((x) => x.dev === 'sdd').prio = 20;
  assert.equal(logic.bestGroup(s), 1, 'live 30 beats 20');
  s.paths.find((x) => x.dev === 'sda').state = 'failed';
  assert.equal(logic.livePrio(s, s.groups[0]), 10);
  assert.equal(logic.bestGroup(s), 2, 'only sdc (10) is left in group 1: 20 wins');
});

// ── rule 1: without multipath ──

test('rule 1: without multipath every I/O goes to sdb, and a dead sdb is an error at once', () => {
  const p = presetParams('no-multipath');
  const s1 = at(p, 1);
  assert.deepEqual(s1.tickDone, { sda: 0, sdb: 4, sdc: 0, sdd: 0 });
  assert.equal(s1.groups.length, 0);
  assert.equal(s1.activeGroup, null);
  const s2 = at(p, 2);
  assert.equal(s2.tickErrors, 4);
  assert.equal(s2.retried, 0);
  assert.equal(s2.fsState, 'ro');
  assert.equal(states(s2), 'sda+ sdb- sdc+ sdd+', 'three healthy paths to the same LUN, unused');
  assert.equal(at(p, 5).errors, 16);
  // a fault on paths the filesystem does not use changes nothing
  assert.equal(at({ useMultipath: false, fault: 'h0' }, 5).errors, 0);
});

// ── rule 2: grouping ──

test('rule 2: grouping policies build the groups in priority order', () => {
  const show = (g) => logic.groupsFor(g).map((x) => x.devs.join(' ') + ':' + x.prio);
  assert.deepEqual(show('failover'), ['sda:50', 'sdb:50', 'sdc:10', 'sdd:10']);
  assert.deepEqual(show('multibus'), ['sda sdb sdc sdd:30']);
  assert.deepEqual(show('group_by_prio'), ['sda sdb:50', 'sdc sdd:10']);
  assert.equal(logic.prioOf('A'), 50, 'paths to the owning controller: active/optimized');
  assert.equal(logic.prioOf('B'), 10);
});

test('rule 2: groups are ordered by priority, then list order, whatever order the paths are listed in', () => {
  // the owner's paths listed last: the prio 50 groups still come first
  const rev = logic.PATHS.slice().reverse();
  const show = (g) => logic.groupsFor(g, rev).map((x) => x.devs.join(' ') + ':' + x.prio);
  assert.deepEqual(show('group_by_prio'), ['sdb sda:50', 'sdd sdc:10']);
  assert.deepEqual(show('failover'), ['sdb:50', 'sda:50', 'sdd:10', 'sdc:10']);
});

test('rule 2: group_by_prio sends I/O only to the owning controller; multibus to all four', () => {
  assert.deepEqual(at({}, 1).tickDone, { sda: 2, sdb: 2, sdc: 0, sdd: 0 });
  assert.deepEqual(at({ grouping: 'multibus' }, 1).tickDone, { sda: 1, sdb: 1, sdc: 1, sdd: 1 });
  assert.deepEqual(at({ grouping: 'failover' }, 1).tickDone, { sda: 4, sdb: 0, sdc: 0, sdd: 0 });
});

test('rule 2: the live group prio is the average of its usable paths, 0 when none', () => {
  const s = at({ grouping: 'multibus', fault: 'sdb' }, 2);
  assert.equal(logic.livePrio(s, s.groups[0]), 23); // (50 + 10 + 10) / 3
  const d = at({}, 2);
  assert.equal(logic.livePrio(d, d.groups[0]), 0);
  assert.equal(logic.livePrio(d, d.groups[1]), 10);
});

// ── rule 4: retry on another path ──

test('rule 4: an I/O on a dead path marks the path failed and is resent; the filesystem sees no error', () => {
  const s = at(presetParams('multibus-rr'), 2);
  assert.deepEqual(tries(s), ['sda', 'sdb>sdc', 'sdd', 'sda']);
  assert.deepEqual(s.marks, [{ dev: 'sdb', state: 'failed', by: 'io' }]);
  assert.equal(s.tickRetried, 1);
  assert.equal(s.errors, 0);
  assert.equal(s.fsState, 'rw');
});

test('rule 4: a dead path with no I/O on it is found by the checker, not by I/O', () => {
  const s = at({ fault: 'h0' }, 2);
  assert.deepEqual(s.marks, [{ dev: 'sda', state: 'failed', by: 'io' }, { dev: 'sdc', state: 'failed', by: 'checker' }]);
  assert.deepEqual(s.tickDone, { sda: 0, sdb: 4, sdc: 0, sdd: 0 });
  // with failover grouping sdb is a standby path: its loss is only seen by the checker and no I/O is retried
  const f = at({ grouping: 'failover', fault: 'sdb' }, 2);
  assert.deepEqual(f.marks, [{ dev: 'sdb', state: 'failed', by: 'checker' }]);
  assert.equal(f.retried, 0);
  assert.equal(f.activeGroup, 1);
});

test('rule 4: a returning path is used only after the checker has reinstated it', () => {
  const p = presetParams('multibus-rr');
  const s5 = at(p, 5);
  assert.equal(s5.tickDone.sdb, 0, 'link back at tick 5, but still failed during its I/O');
  assert.deepEqual(s5.marks, [{ dev: 'sdb', state: 'active', by: 'checker' }]);
  assert.equal(at(p, 6).tickDone.sdb, 1);
  assert.deepEqual([at(p, 6).done, at(p, 6).retried, at(p, 6).errors], [24, 1, 0]);
});

// ── rule 5: group switch ──

test('rule 5: the active group loses its last path: the next group by priority takes over', () => {
  const s = at({}, 2);
  assert.deepEqual(s.switches, [{ from: 1, to: 2, why: 'nopath' }]);
  assert.equal(s.activeGroup, 2);
  assert.equal(s.retried, 1);
  assert.equal(s.errors, 0);
  assert.deepEqual(s.tickDone, { sda: 0, sdb: 0, sdc: 2, sdd: 2 });
});

// ── rule 6: failback ──

test('rule 6: failback immediate returns to the higher-priority group at once; manual stays', () => {
  const imm = at({}, 5);
  assert.deepEqual(imm.switches, [{ from: 2, to: 1, why: 'failback' }]);
  assert.deepEqual(imm.tickDone, { sda: 0, sdb: 0, sdc: 2, sdd: 2 }, 'the switch is at the end of the tick');
  assert.deepEqual(at({}, 6).tickDone, { sda: 2, sdb: 2, sdc: 0, sdd: 0 });
  const man = at({ failback: 'manual' }, 7);
  assert.equal(man.activeGroup, 2);
  assert.deepEqual(man.tickDone, { sda: 0, sdb: 0, sdc: 2, sdd: 2 });
  assert.equal(states(man), 'sda+ sdb+ sdc+ sdd+');
});

// ── rule 7: no usable path ──

test('rule 7: no_path_retry queue: requests wait, nothing is lost, the queue drains when a path is reinstated', () => {
  const p = presetParams('all-down-queue');
  assert.deepEqual([2, 3, 4, 5].map((n) => at(p, n).queued), [4, 8, 12, 16]);
  assert.deepEqual([2, 3, 4, 5].map((n) => at(p, n).errors), [0, 0, 0, 0]);
  const s6 = at(p, 6);
  assert.equal(s6.tickQueued, 4, 'the paths are back, but still failed during this tick\'s I/O');
  assert.equal(s6.drained, 20);
  assert.equal(s6.queued, 0);
  assert.equal(s6.done, 24);
  assert.equal(s6.fsState, 'rw');
  assert.deepEqual(s6.drainedOn, { sda: 10, sdb: 10 }, 'sent through the group failback chose');
  assert.equal(at(p, 8).done, 32);
});

test('rule 7: no_path_retry fail: an error to the filesystem at once, which goes read-only and stays so', () => {
  const p = presetParams('all-down-fail');
  assert.deepEqual([2, 3, 4, 5].map((n) => at(p, n).errors), [4, 8, 12, 16]);
  const s2 = at(p, 2);
  assert.equal(s2.queued, 0);
  assert.equal(s2.fsState, 'ro');
  assert.equal(s2.fsWentRo, true);
  assert.equal(at(p, 3).fsWentRo, false);
  const s6 = at(p, 6);
  assert.equal(states(s6), 'sda+ sdb+ sdc+ sdd+');
  assert.equal(s6.errors, 20, 'the links are back, but the paths are still failed during this interval\'s I/O');
  assert.equal(s6.fsState, 'ro');
});

test('rule 7: no_path_retry 3: queue for three checker intervals, then fail what waits and what comes', () => {
  const p = { fault: 'all', noPathRetry: '3', downFor: 4, ticks: 6 };
  assert.deepEqual([2, 3, 4].map((n) => at(p, n).retryLeft), [2, 1, 0]);
  assert.deepEqual([2, 3].map((n) => at(p, n).queued), [4, 8]);
  const s4 = at(p, 4);
  assert.equal(s4.tickQueued, 4);
  assert.equal(s4.flushed, 12);
  assert.equal(s4.queued, 0);
  assert.equal(s4.errors, 12);
  const s5 = at(p, 5);
  assert.equal(s5.tickErrors, 4);
  assert.equal(s5.tickQueued, 0);
  assert.equal(at(p, 6).retryLeft, null, 'cleared when a path is reinstated');
  assert.equal(logic.queueing({ retryLeft: null }, { noPathRetry: '3' }), true);
  assert.equal(logic.queueing({ retryLeft: 0 }, { noPathRetry: '3' }), false);
});

test('rule 6: failback manual stays on the group it switched to (failover grouping, port h0)', () => {
  const p = { grouping: 'failover', fault: 'h0', failback: 'manual', ticks: 7 };
  assert.equal(at(p, 2).activeGroup, 2);
  assert.equal(at(p, 7).activeGroup, 2);
  assert.deepEqual(at(p, 7).tickDone, { sda: 0, sdb: 4, sdc: 0, sdd: 0 });
});

test('rule 6/7: after an outage of every path the active group is cleared, so even manual returns to the best group', () => {
  const p = { grouping: 'failover', failback: 'manual', fault: 'all', downFor: 2 };
  assert.equal(at(p, 2).activeGroup, null);
  assert.equal(at(p, 4).activeGroup, 1);
  assert.deepEqual(at(p, 5).tickDone, { sda: 4, sdb: 0, sdc: 0, sdd: 0 });
  assert.equal(at({ failback: 'manual', fault: 'all', downFor: 2 }, 5).activeGroup, 1);
});

test('rule 7: no_path_retry 3 with the paths back before it runs out: the queue drains, nothing fails', () => {
  const p = { fault: 'all', noPathRetry: '3', downFor: 2 };
  assert.deepEqual([2, 3].map((n) => at(p, n).retryLeft), [2, 1]);
  const s4 = at(p, 4);
  assert.equal(s4.drained, 12);
  assert.equal(s4.retryLeft, null);
  assert.equal(s4.errors, 0);
  assert.equal(s4.fsState, 'rw');
});

// ── presets ──

test('preset alua-failover: ctrl-A fails, ctrl-B takes over with no errors, failback at tick 5', () => {
  const p = presetParams('alua-failover');
  assert.equal(logic.steps(P(p)), 7);
  const s2 = at(p, 2);
  assert.equal(states(s2), 'sda- sdb- sdc+ sdd+');
  assert.deepEqual(s2.marks.map((m) => m.dev + '/' + m.by), ['sda/io', 'sdb/io']);
  const s5 = at(p, 5);
  assert.deepEqual([s5.done, s5.retried, s5.queued, s5.errors], [20, 1, 0, 0]);
  const s7 = at(p, 7);
  assert.equal(s7.activeGroup, 1);
  assert.deepEqual([s7.done, s7.retried, s7.queued, s7.errors], [28, 1, 0, 0]);
});

test('every preset has the brief\'s step count', () => {
  const want = { 'multibus-rr': 6, 'alua-failover': 7, 'all-down-queue': 8, 'all-down-fail': 6, 'no-multipath': 5 };
  for (const x of logic.PRESETS) assert.equal(logic.steps(P(x.params)), want[x.id], x.id);
});

test('events: the fault starts at failAt and ends downFor ticks later', () => {
  const p = logic.norm(P({ fault: 'h0', failAt: 3, downFor: 2 }));
  assert.deepEqual(logic.eventAt(p, 3), { kind: 'fail', what: 'h0', devs: ['sda', 'sdc'] });
  assert.deepEqual(logic.eventAt(p, 5), { kind: 'back', what: 'h0', devs: ['sda', 'sdc'] });
  assert.equal(logic.eventAt(p, 4), null);
});

test('params from the URL are made safe', () => {
  const p = logic.norm({ grouping: 'x', failback: 3, noPathRetry: 3, fault: 'toString', failAt: 99, ticks: 'a' });
  assert.equal(p.grouping, 'group_by_prio');
  assert.equal(p.failback, 'immediate');
  assert.equal(p.noPathRetry, '3');
  assert.equal(p.fault, 'ctrl-A');
  assert.equal(p.failAt, 10);
  assert.equal(p.ticks, 7);
});

// ── generic checks every sim keeps ──

const VARIANTS = [{}].concat(logic.PRESETS.map((x) => x.params),
  [{ noPathRetry: '3', fault: 'all' }, { grouping: 'failover', fault: 'h0', failback: 'manual', ticks: 12 }]);

test('state is JSON-safe at every step', () => {
  for (const v of VARIANTS) {
    const p = P(v);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const v of VARIANTS) {
    const p = P(v);
    const steps = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({});
  const s1 = kit.stateAt(logic, p, 1);
  const copy = structuredClone(s1);
  logic.step(s1, 2, p);
  assert.deepEqual(s1, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, and the page has a label for each', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model at its defaults');
  for (const x of logic.PRESETS) {
    for (const k of Object.keys(x.params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.ok(strings.hr['preset_' + x.id] && strings.en['preset_' + x.id], `preset ${x.id} has a label`);
  }
});
