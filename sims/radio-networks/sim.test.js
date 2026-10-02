// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for radio-networks' model. Run: node --test sims/radio-networks/
// Tie-breaks first, then the rules of each network (sim.js header), then the template's generic block.
// Hand-made schedules go through `withDemand`, which swaps the seeded schedule for a fixed one.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const ids = (xs) => xs.map((x) => x.id);

/** A copy of the model whose schedule is the given plan: slot -> [[team, dur], ...], ids C1, C2, ... in order. */
function withDemand(plan) {
  let k = 0;
  const sched = [];
  for (let slot = 1; slot <= logic.SLOTS; slot++) {
    sched.push((plan[slot] || []).map(([team, dur]) => ({ id: 'C' + (++k), team, dur, at: slot })));
  }
  return Object.assign({}, logic, { step: (s, n, p) => logic.loadStep(s, n, p, sched[n - 1]) });
}

// ── tie-breaks ──

test('trunk: the lowest free channel is taken; a freed low channel is reused before a higher one', () => {
  const m = withDemand({ 1: [['ops', 2]], 2: [['sec', 5]], 4: [['med', 3]] });
  const p = P({ net: 'trunk', channels: 3 });
  assert.deepEqual(kit.stateAt(m, p, 2).active.map((a) => [a.id, a.ch]), [['C1', 1], ['C2', 2]]);
  // C1 ends at slot 3 (2 slots), so C3 at slot 4 gets channel 1 again, not 3
  assert.deepEqual(kit.stateAt(m, p, 4).active.map((a) => [a.id, a.ch]), [['C3', 1], ['C2', 2]]);
});

test('trunk: the queue is first come first served, and it is served before the calls of the same slot', () => {
  const m = withDemand({ 1: [['ops', 2]], 2: [['sec', 1], ['med', 1]], 3: [['log', 4]] });
  const p = P({ net: 'trunk', channels: 1 });
  const s2 = kit.stateAt(m, p, 2);
  assert.deepEqual(ids(s2.queue), ['C2', 'C3']);
  const s3 = kit.stateAt(m, p, 3); // C1 ended: C2 (oldest in the queue) gets the channel, C4 queues behind C3
  assert.deepEqual(s3.granted, ['C2']);
  assert.deepEqual(ids(s3.queue), ['C3', 'C4']);
  assert.deepEqual(kit.stateAt(m, p, 4).granted, ['C3']);
});

test('conv: two calls of the same team in one slot: the first (lower id) gets the channel, the second is blocked as busy', () => {
  const m = withDemand({ 1: [['sec', 3], ['sec', 3]] });
  const s = kit.stateAt(m, P({ net: 'conv' }), 1);
  assert.deepEqual(s.granted, ['C1']);
  assert.deepEqual(s.blocked, [{ id: 'C2', team: 'sec', why: 'busy', ch: 2 }]);
});

test('a call ending frees its channel in the same slot, before the new calls of that slot', () => {
  for (const net of ['conv', 'trunk']) {
    const m = withDemand({ 1: [['ops', 2]], 3: [['ops', 2]] });
    const s = kit.stateAt(m, P({ net, channels: 1 }), 3);
    assert.deepEqual(s.ended, ['C1'], net);
    assert.deepEqual(s.granted, ['C2'], net);
    assert.equal(s.total.blocked, 0, net);
  }
});

test('mesh: on a tie the parent is the first frontier node in id order (A-B-D-F-H, not A-C-E-F-H)', () => {
  const s = at({ net: 'mesh', down: '' }, 4);
  assert.deepEqual(s.route, ['A', 'B', 'D', 'F', 'H']);
  assert.deepEqual(kit.stateAt(logic, P({ net: 'mesh', down: '' }), 2).frontier, ['D', 'E']);
  assert.equal(s.parent.F, 'D', 'F hears D and E at hop 3; D is first');
});

test('mesh: the source and the destination can never be down', () => {
  assert.deepEqual(logic.downSet(P({ net: 'mesh', down: 'ADH' })), ['D']);
  assert.equal(logic.toggleDown(P({ down: 'D' }), 'A'), 'D');
  assert.equal(logic.toggleDown(P({ down: 'D' }), 'H'), 'D');
  assert.equal(logic.toggleDown(P({ down: 'D' }), 'E'), 'DE');
  assert.equal(logic.toggleDown(P({ down: 'DE' }), 'D'), 'E');
});

// ── conventional ──

test('conv: a team uses only its own channel; a team without one is blocked while other channels are free', () => {
  const m = withDemand({ 1: [['log', 3]] });
  const s = kit.stateAt(m, P({ net: 'conv', channels: 3 }), 1);
  assert.deepEqual(s.blocked, [{ id: 'C1', team: 'log', why: 'nochan', ch: 4 }]);
  assert.equal(s.active.length, 0);
  const s4 = kit.stateAt(m, P({ net: 'conv', channels: 4 }), 1);
  assert.deepEqual(s4.active.map((a) => a.ch), [4]);
});

test('conv: a busy own channel blocks the call even with every other channel free; the call is lost, not queued', () => {
  const m = withDemand({ 1: [['ops', 5]], 2: [['ops', 2]] });
  const s = kit.stateAt(m, P({ net: 'conv', channels: 5 }), 2);
  assert.deepEqual(s.blocked.map((b) => [b.id, b.why]), [['C2', 'busy']]);
  assert.deepEqual(s.queue, []);
  assert.equal(kit.stateAt(m, P({ net: 'conv', channels: 5 }), 6).total.served, 1);
});

test('conv: the mode (simplex, repeater, fixed) does not change the outcome', () => {
  for (const mode of ['simplex', 'fixed']) assert.deepEqual(at({ mode }, 20), at({ mode: 'repeater' }, 20));
});

// ── trunked ──

test('trunk: nobody is ever blocked; every offered call is served or still in the queue', () => {
  for (let seed = 1; seed <= 20; seed++) for (let load = 1; load <= 5; load++) for (let channels = 1; channels <= 5; channels++) {
    const s = at({ net: 'trunk', seed, load, channels }, 20);
    assert.equal(s.total.blocked, 0);
    assert.equal(s.total.offered, s.total.served + s.queue.length, `seed ${seed} load ${load} ch ${channels}`);
  }
});

test('trunk: no call waits while a channel is free, and no channel carries two calls', () => {
  for (let seed = 1; seed <= 10; seed++) for (let n = 0; n <= 20; n++) {
    const s = at({ net: 'trunk', seed, load: 4, channels: 3 }, n);
    if (s.queue.length) assert.equal(s.active.length, 3, `seed ${seed} slot ${n}`);
    assert.equal(new Set(s.active.map((a) => a.ch)).size, s.active.length);
    for (const a of s.active) assert.ok(a.ch >= 1 && a.ch <= 3);
  }
});

test('the same seed gives the same calls to both networks; trunking serves at least as many as conventional', () => {
  for (let seed = 1; seed <= 20; seed++) for (let load = 1; load <= 5; load++) {
    const c = at({ net: 'conv', seed, load }, 20).total, t = at({ net: 'trunk', seed, load }, 20).total;
    assert.equal(c.offered, t.offered);
    assert.ok(t.served >= c.served, `seed ${seed} load ${load}: trunk ${t.served} < conv ${c.served}`);
  }
});

test('the default demo: 12 calls; conventional loses 7, trunking serves all 12 and 3 of them wait', () => {
  const c = at({ net: 'conv' }, 20).total, t = at({ net: 'trunk' }, 20);
  assert.deepEqual([c.offered, c.served, c.blocked], [12, 5, 7]);
  assert.deepEqual([t.total.offered, t.total.served, t.total.waited, t.queue.length], [12, 12, 3, 0]);
});

// ── the call schedule ──

test('schedule: at most one call per slot, 3–7 slots long, teams from the list; a higher load only adds calls', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const keyOf = (load) => logic.schedule(P({ seed, load })).map((c) => c.map((x) => x.team + x.dur));
    for (let load = 1; load <= 5; load++) {
      const sc = logic.schedule(P({ seed, load }));
      assert.equal(sc.length, logic.SLOTS);
      for (const slot of sc) {
        assert.ok(slot.length <= 1);
        for (const c of slot) { assert.ok(c.dur >= 3 && c.dur <= 7); assert.ok(logic.TEAMS.includes(c.team)); }
      }
      if (load > 1) keyOf(load - 1).forEach((c, i) => { if (c.length) assert.deepEqual(keyOf(load)[i], c); });
    }
  }
});

test('schedule: load 5 offers a call in every slot; the long-run share is load / 5', () => {
  assert.ok(logic.schedule(P({ load: 5 })).every((c) => c.length === 1));
  let calls = 0;
  for (let seed = 1; seed <= 200; seed++) calls += logic.schedule(P({ seed, load: 2 })).flat().length;
  const share = calls / (200 * logic.SLOTS);
  assert.ok(Math.abs(share - 0.4) < 0.03, `share ${share}`);
});

test('a call lasts exactly its duration: active in dur slots, ended in the next one', () => {
  const m = withDemand({ 2: [['med', 3]] });
  const p = P({ net: 'trunk' });
  for (const n of [2, 3, 4]) assert.deepEqual(ids(kit.stateAt(m, p, n).active), ['C1'], `slot ${n}`);
  assert.deepEqual(kit.stateAt(m, p, 5).ended, ['C1']);
  assert.equal(kit.stateAt(m, p, 5).total.busySlots, 3);
});

// ── mesh ──

test('mesh: links join working nodes within range only', () => {
  assert.equal(logic.links(P({ net: 'mesh', range: 110, down: '' })).length, 0, 'the closest pair, D and E, is 120 apart');
  assert.deepEqual(logic.links(P({ net: 'mesh', range: 120, down: '' })), [['D', 'E']]);
  assert.deepEqual(logic.links(P({ net: 'mesh', range: 130, down: '' })), [['B', 'C'], ['D', 'E'], ['F', 'G']]);
  for (const l of logic.links(P({ net: 'mesh' }))) assert.ok(!l.includes('D'));
});

test('mesh: D down, the flood goes around it: A-C-E-F-H in 4 hops', () => {
  const s = at({ net: 'mesh' }, 5);
  assert.deepEqual(s.route, ['A', 'C', 'E', 'F', 'H']);
  assert.equal(s.found, 4);
  assert.equal(s.reached.D, undefined, 'a node that is down hears nothing');
});

test('mesh: each node is reached once, at its hop distance, and retransmits once', () => {
  const p = P({ net: 'mesh', down: '', ttl: 7 });
  const s = kit.stateAt(logic, p, 7);
  assert.deepEqual(s.reached, { A: 0, B: 1, C: 1, D: 2, E: 2, F: 3, G: 3, H: 4 });
  assert.equal(s.sent, 8, 'every node sends once (the last frontier sends into nothing new)');
  assert.equal(kit.stateAt(logic, p, 5).stalled, true);
});

test('mesh: a TTL shorter than the distance stops the flood before the destination', () => {
  const s = at({ net: 'mesh', ttl: 2 }, 2);
  assert.equal(s.route, null);
  assert.equal(s.hopsTo, 4);
  assert.deepEqual(Object.keys(s.reached).sort(), ['A', 'B', 'C', 'E']);
});

test('mesh: D and E down split the network: no route at any TTL', () => {
  const s = at({ net: 'mesh', down: 'DE', ttl: 7 }, 7);
  assert.equal(s.route, null);
  assert.equal(s.hopsTo, -1);
  assert.equal(s.stalled, true);
});

test('mesh: steps are the TTL; source = destination is found at hop 0', () => {
  for (let ttl = 1; ttl <= 7; ttl++) assert.equal(kit.stepsOf(logic, P({ net: 'mesh', ttl })), ttl);
  assert.equal(kit.stepsOf(logic, P({ net: 'trunk' })), logic.SLOTS);
  const s = at({ net: 'mesh', src: 'C', dst: 'C' }, 0);
  assert.deepEqual(s.route, ['C']);
  assert.equal(s.found, 0);
});

test('downValues lists every subset once, sorted inside', () => {
  const v = logic.downValues();
  assert.equal(v.length, 256);
  assert.equal(new Set(v).size, 256);
  assert.ok(v.includes('') && v.includes('DE') && v.includes('ABCDEFGH'));
  for (const x of v) assert.equal(x, x.split('').sort().join(''));
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of [{ net: 'conv' }, { net: 'trunk', load: 5 }, { net: 'mesh', ttl: 7 }]) {
    const steps = kit.stepsOf(logic, P(over));
    for (let n = 0; n <= steps; n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of [{ net: 'conv', seed: 7 }, { net: 'trunk', load: 4, channels: 2 }, { net: 'mesh', ttl: 6, down: 'E' }]) {
    const p = P(over), steps = kit.stepsOf(logic, p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const over of [{ net: 'trunk', load: 5, channels: 1 }, { net: 'mesh' }]) {
    const p = P(over);
    let s = logic.initial(p);
    for (let n = 1; n <= 3; n++) {
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
  assert.equal(meta.steps, kit.stepsOf(logic, logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const downs = [...html.matchAll(/down: '([A-H]*)'/g)].map((m) => m[1]);
  for (const d of downs) assert.ok(logic.downValues().includes(d), `down '${d}' is an option`);
});
