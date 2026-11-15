// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for mesi-coherence's model (rules: SPEC.md). Run: node --test sims/mesi-coherence/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const seq = (cores, ops) => P(Object.assign({ cores }, logic.slots(ops)));
const run = (cores, ops) => kit.stateAt(logic, seq(cores, ops), ops.length);
const states = (m) => m.cores.map((e) => e.state).join('');
const presetParams = (id) => P(logic.presets.find((x) => x.id === id).params);
const end = (id) => { const p = presetParams(id); return kit.stateAt(logic, p, logic.steps(p)); };

// ── tie-breaks and order first (rule 8) ──

test('rule 8: snoopers are listed in core order, then the requester', () => {
  // C0, C2 and C3 hold S; C1 writes: three invalidations, then C1's own transition.
  const m = run(4, ['0R', '2R', '3R', '1W']);
  assert.deepEqual(m.last.transitions.map((x) => x.core), [0, 2, 3, 1]);
  assert.deepEqual(m.last.transitions.map((x) => x.to), ['I', 'I', 'I', 'M']);
  // a read miss with an E holder: the holder's E → S first, then the requester's I → S
  const r = run(3, ['2R', '0R']);
  assert.deepEqual(r.last.transitions, [{ core: 2, from: 'E', to: 'S' }, { core: 0, from: 'I', to: 'S' }]);
});

test('rule 8: one operation per step, applied in sequence order', () => {
  const a = run(2, ['0W', '1W']), b = run(2, ['1W', '0W']);
  assert.equal(states(a), 'IM');
  assert.equal(states(b), 'MI');
  assert.equal(a.last.core, 1);
  assert.equal(b.last.core, 0);
});

test('rule 8: the result does not depend on which core asks (symmetry)', () => {
  const a = run(3, ['0R', '1R', '0W']), b = run(3, ['2R', '1R', '2W']);
  assert.deepEqual(a.counts, b.counts);
  assert.equal(states(a), 'MII');
  assert.equal(states(b), 'IIM');
});

// ── rules ──

test('rule 1: a read hit in M, E or S sends nothing and changes nothing', () => {
  for (const ops of [['0R'], ['0W'], ['0R', '1R']]) {
    const before = run(2, ops);
    const after = logic.access(before, 0, 'R');
    assert.equal(after.last.hit, true);
    assert.equal(after.last.bus, null);
    assert.deepEqual(after.last.transitions, []);
    assert.deepEqual(after.cores, before.cores);
    assert.equal(after.counts.hits, before.counts.hits + 1);
    assert.equal(after.counts.busTx, before.counts.busTx);
    assert.equal(after.last.value, before.cores[0].value);
  }
});

test('rule 2: a read miss with no other copy gives E', () => {
  const m = run(3, ['1R']);
  assert.equal(states(m), 'IEI');
  assert.equal(m.last.bus, 'BusRd');
  assert.equal(m.last.hit, false);
  assert.equal(m.counts.busTx, 1);
  assert.equal(m.cores[1].value, 0);
});

test('rule 2: a read miss with an E holder: E → S (a downgrade), requester S', () => {
  const m = run(2, ['0R', '1R']);
  assert.equal(states(m), 'SS');
  assert.equal(m.counts.downgrades, 1);
  assert.equal(m.counts.invalidations, 0);
  assert.equal(m.last.flush, null);
});

test('rule 2: a read miss with S holders: they stay S, requester S, no downgrade', () => {
  const m = run(3, ['0R', '1R', '2R']);
  assert.equal(states(m), 'SSS');
  assert.equal(m.counts.downgrades, 1); // only C0's E → S in step 2
  assert.deepEqual(m.last.transitions, [{ core: 2, from: 'I', to: 'S' }]);
});

test('rule 2: a read miss with an M holder: it writes back, M → S, requester reads the new value', () => {
  const m = run(2, ['0W', '1R']);
  assert.equal(states(m), 'SS');
  assert.equal(m.last.flush, 0);
  assert.equal(m.mem, 1);
  assert.equal(m.cores[1].value, 1);
  assert.equal(m.counts.writebacks, 1);
  assert.equal(m.counts.downgrades, 1);
  assert.equal(m.counts.invalidations, 0, 'M → S is a downgrade, not an invalidation');
});

test('rule 3: a write in M is a hit; a write in E is a silent upgrade with no bus', () => {
  const e = run(2, ['0R', '0W']);
  assert.equal(states(e), 'MI');
  assert.equal(e.last.hit, true);
  assert.equal(e.last.bus, null);
  assert.deepEqual(e.last.transitions, [{ core: 0, from: 'E', to: 'M' }]);
  assert.equal(e.counts.busTx, 1);
  assert.equal(e.counts.hits, 1);
  const mm = run(2, ['0W', '0W']);
  assert.equal(mm.last.hit, true);
  assert.equal(mm.last.bus, null);
  assert.deepEqual(mm.last.transitions, []);
  assert.equal(mm.cores[0].value, 2);
  assert.equal(mm.counts.hits, 1, 'a write in M is a hit');
  assert.equal(mm.counts.busTx, 1);
});

test('rule 4: a write in S sends BusUpgr; every other S copy becomes I', () => {
  const m = run(3, ['0R', '1R', '2R', '0W']);
  assert.equal(m.last.bus, 'BusUpgr');
  assert.equal(states(m), 'MII');
  assert.equal(m.counts.invalidations, 2);
  assert.equal(m.last.flush, null);
  assert.equal(m.cores[1].value, null);
  assert.equal(m.cores[0].value, 1);
});

test('rule 5: a write miss sends BusRdX; an M holder writes back, then every copy is I', () => {
  const m = run(3, ['0W', '2W']);
  assert.equal(m.last.bus, 'BusRdX');
  assert.equal(m.last.flush, 0);
  assert.equal(states(m), 'IIM');
  assert.equal(m.mem, 1);
  assert.equal(m.cores[2].value, 2);
  assert.equal(m.counts.invalidations, 1);
  assert.equal(m.counts.writebacks, 1);
  const s = run(3, ['0R', '1R', '2W']);   // S copies: invalidated, no write-back
  assert.equal(s.last.bus, 'BusRdX');
  assert.equal(s.last.flush, null);
  assert.equal(s.counts.invalidations, 2);
  assert.equal(s.counts.writebacks, 0);
  const e = run(2, ['0R', '1W']);        // an E copy: invalidated, no write-back
  assert.equal(states(e), 'IM');
  assert.equal(e.counts.writebacks, 0);
});

test('rule 6: each write makes a new version; RAM is stale exactly while some core is M', () => {
  const p = seq(3, ['0W', '1R', '2W', '2W', '0R', '1W']);
  for (let n = 0; n <= logic.steps(p); n++) {
    const m = kit.stateAt(logic, p, n);
    assert.equal(logic.isStale(m), m.mem !== m.version, `step ${n}`);
    m.cores.forEach((e) => {
      if (e.state === 'I') assert.equal(e.value, null);
      else assert.equal(e.value, e.state === 'M' ? m.version : m.mem, `step ${n}: a valid copy is current`);
    });
  }
  const end = kit.stateAt(logic, p, 6);
  assert.equal(end.version, 4);
  assert.equal(end.cores[1].value, 4);
});

test('rule 7: the invariant holds after every step of random sequences', () => {
  const r = kit.rng(42);
  for (let trial = 0; trial < 300; trial++) {
    const cores = 2 + r.int(3);
    let m = logic.emptyMachine(cores);
    for (let i = 0; i < 20; i++) {
      m = logic.access(m, r.int(cores), r.int(2) ? 'W' : 'R');
      assert.ok(logic.invariantHolds(m), JSON.stringify(m.cores));
      assert.equal(logic.isStale(m), m.mem !== m.version);
    }
  }
  assert.equal(logic.invariantHolds({ cores: [{ state: 'E' }, { state: 'S' }] }), false);
  assert.equal(logic.invariantHolds({ cores: [{ state: 'M' }, { state: 'M' }] }), false);
});

test('rule 9: the counts add up over a mixed sequence', () => {
  const m = run(4, ['0R', '1R', '0R', '2W', '3R', '3W', '1W']);
  // 0R miss E; 1R miss (E→S); 0R hit; 2W miss BusRdX (2 inval); 3R miss (M→S, wb); 3W BusUpgr (inval C2); 1W BusRdX (inval C3, wb)
  assert.deepEqual(m.counts, { hits: 1, busTx: 6, invalidations: 4, downgrades: 2, writebacks: 2 });
});

// ── the sequence in the params ──

test('ops: slots up to the first empty one; ops on missing cores are left out', () => {
  assert.deepEqual(logic.opsOf(P(logic.slots(['0R', '1W']))), ['0R', '1W']);
  assert.deepEqual(logic.opsOf(P(Object.assign(logic.slots(['0R', '', '1W'])))), ['0R']);
  assert.deepEqual(logic.opsOf(P(Object.assign({ cores: 2 }, logic.slots(['0R', '2W', '1R'])))), ['0R', '1R']);
  assert.deepEqual(logic.opsOf(P({ o1: 'xx' })), []);
  assert.equal(logic.steps(presetParams('readers-writer')), 6);
  assert.equal(logic.steps(P({ cores: 2, o1: '0R', o2: '2R', o3: '', o4: '' })), 1);
});

test('appendAt: keeps the first n operations, adds one, drops the rest; capped at 20', () => {
  const p = presetParams('classic');
  assert.deepEqual(logic.opsOf(P(logic.appendAt(p, 2, '1W'))), ['0R', '1R', '1W']);
  assert.deepEqual(logic.opsOf(P(logic.appendAt(p, 0, '0W'))), ['0W']);
  assert.deepEqual(logic.opsOf(P(logic.appendAt(p, 4, '0R'))), ['0R', '1R', '0W', '1R', '0R']);
  assert.equal(logic.appendAt(p, 1, '2R'), null, 'core 2 does not exist with 2 cores');
  assert.equal(logic.appendAt(p, 1, 'nope'), null);
  const full = P(logic.slots(Array(20).fill('0R')));
  assert.equal(logic.steps(full), 20);
  assert.equal(logic.appendAt(full, 20, '1R'), null);
  assert.deepEqual(logic.opsOf(P(logic.appendAt(full, 19, '1R'))).slice(-2), ['0R', '1R']);
});

// ── presets: the expected numbers of SPEC.md ──

test('preset classic: bus 4, invalidations 1, downgrades 2, write-backs 1, RAM 1', () => {
  const m = end('classic');
  assert.deepEqual(m.counts, { hits: 0, busTx: 4, invalidations: 1, downgrades: 2, writebacks: 1 });
  assert.equal(states(m), 'SS');
  assert.equal(m.mem, 1);
  const p = presetParams('classic');
  assert.deepEqual([1, 2, 3, 4].map((n) => kit.stateAt(logic, p, n).last.bus), ['BusRd', 'BusRd', 'BusUpgr', 'BusRd']);
  assert.deepEqual([1, 2, 3, 4].map((n) => states(kit.stateAt(logic, p, n))), ['EI', 'SS', 'MI', 'SS']);
});

test('preset silent-upgrade: bus 2, invalidations 1, write-backs 1; E → M without the bus', () => {
  const m = end('silent-upgrade');
  assert.deepEqual(m.counts, { hits: 2, busTx: 2, invalidations: 1, downgrades: 0, writebacks: 1 });
  assert.equal(states(m), 'IM');
  assert.equal(m.mem, 1);
  assert.equal(m.version, 2);
  const s2 = kit.stateAt(logic, presetParams('silent-upgrade'), 2);
  assert.equal(s2.last.bus, null);
  assert.deepEqual(s2.last.transitions, [{ core: 0, from: 'E', to: 'M' }]);
});

test('preset ping-pong: bus 6, invalidations 5, write-backs 5, hits 0', () => {
  const m = end('ping-pong');
  assert.deepEqual(m.counts, { hits: 0, busTx: 6, invalidations: 5, downgrades: 0, writebacks: 5 });
  assert.equal(states(m), 'IM');
  assert.equal(m.mem, 5);
  assert.equal(m.cores[1].value, 6);
});

test('preset readers-writer: bus 6, invalidations 2, write-backs 1; C2 stays I until it reads', () => {
  const p = presetParams('readers-writer');
  const m = end('readers-writer');
  assert.deepEqual(m.counts, { hits: 0, busTx: 6, invalidations: 2, downgrades: 2, writebacks: 1 });
  assert.equal(states(m), 'SSS');
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((n) => states(kit.stateAt(logic, p, n))), ['EII', 'SSI', 'SSS', 'IMI', 'SSI', 'SSS']);
  assert.equal(kit.stateAt(logic, p, 4).last.bus, 'BusUpgr');
  assert.equal(kit.stateAt(logic, p, 5).last.flush, 1);
});

test('presets: steps 4, 4, 6, 6 and the invariant at every step', () => {
  assert.deepEqual(logic.presets.map((x) => logic.steps(P(x.params))), [4, 4, 6, 6]);
  for (const x of logic.presets) {
    const p = P(x.params);
    for (let n = 0; n <= logic.steps(p); n++) assert.ok(logic.invariantHolds(kit.stateAt(logic, p, n)), `${x.id} step ${n}`);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  const p = presetParams('readers-writer');
  for (let n = 0; n <= logic.steps(p); n++) {
    const s = kit.stateAt(logic, p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = seq(4, ['0R', '1W', '2R', '3W', '0W', '1R', '2W', '3R']);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = presetParams('classic');
  const s1 = kit.stateAt(logic, p, 1);
  const copy = structuredClone(s1);
  logic.step(s1, 2, p);
  assert.deepEqual(s1, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('the page mounts the model presets, and meta.steps is the default step count', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const json = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(json.steps, meta.steps);
  for (const x of logic.presets) for (const k of Object.keys(x.params)) assert.ok(k in logic.defaults, `${x.id}: ${k}`);
  assert.deepEqual(logic.presets.map((x) => x.id), logic.SEQUENCE_IDS);
});
