// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cache-mapping's model. Run: node --test sims/cache-mapping/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules, the presets, and the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const steps = (p) => kit.stepsOf(logic, p);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => { const p = P(over); return kit.stateAt(logic, p, steps(p)); };
const marks = (s) => s.log.map((e) => ({ hit: 'H', compulsory: 'C', capacity: 'P', conflict: 'K' })[e.result]).join('');
// A custom trace without touching the presets: run the model's step over any address list.
function run(addrs, over) {
  const p = P(over);
  const saved = logic.TRACES.custom;
  logic.TRACES.custom = addrs;
  p.trace = 'custom';
  try { return kit.stateAt(logic, p, addrs.length); } finally { if (saved) logic.TRACES.custom = saved; else delete logic.TRACES.custom; }
}

// ── tie-breaks ──

test('tie-break: an empty set fills way 0 first, then way 1 (lowest-numbered invalid way)', () => {
  // 2 ways, 4 sets, 16 B blocks: 0x000 (block 0) and 0x040 (block 4) both map to set 0
  const s = run([0x000, 0x040], { ways: 2 });
  assert.deepEqual(s.log.map((e) => [e.set, e.way, e.victim]), [[0, 0, null], [0, 1, null]]);
});

test('tie-break: an invalid way is filled before any valid one is evicted, even a lower-numbered valid way', () => {
  // ways 4, 2 sets: blocks 0, 2 fill ways 0, 1 of set 0; block 4 must take way 2, not evict way 0 (the LRU line)
  const s = run([0x000, 0x020, 0x040], { ways: 4 });
  assert.equal(s.log[2].way, 2);
  assert.equal(s.log[2].victim, null);
});

test('tie-break: victimWay takes an invalid way over any valid one, whatever lastUse says', () => {
  assert.equal(logic.victimWay([{ valid: true, lastUse: 0 }, { valid: false, lastUse: null }]), 1);
  assert.equal(logic.victimWay([{ valid: false, lastUse: null }, { valid: false, lastUse: null }]), 0);
  assert.equal(logic.victimWay([{ valid: true, lastUse: 5 }, { valid: true, lastUse: 2 }, { valid: true, lastUse: 9 }]), 1);
});

test('tie-break: lastUse is the access index, so the LRU way is unique; a hit refreshes it', () => {
  // ways 2, set 0: block 0 (way 0), block 4 (way 1), hit block 0 → way 1 (block 4) is now LRU and is evicted by block 8
  const s = run([0x000, 0x040, 0x000, 0x080], { ways: 2 });
  assert.equal(s.log[3].way, 1);
  assert.equal(s.log[3].victim, 4);
  const lastUses = s.lines.filter((l) => l.valid).map((l) => l.lastUse);
  assert.equal(new Set(lastUses).size, lastUses.length, 'no two valid lines share lastUse');
});

test('tie-break: the fully associative shadow evicts its least recently used block', () => {
  // 9 distinct blocks, then block 1 again: the shadow dropped block 0, not block 1
  const s = run([0x000, 0x010, 0x020, 0x030, 0x040, 0x050, 0x060, 0x070, 0x080], { ways: 8 });
  assert.equal(s.log[8].faVictim, 0);
  assert.deepEqual(s.fa, [1, 2, 3, 4, 5, 6, 7, 8]);
});

// ── rule 1: the address split ──

test('rule 1: block, offset, set and tag from the address', () => {
  assert.deepEqual(logic.split(0x080, P({ ways: 1, block: 16 })), { addr: 0x080, block: 8, offset: 0, set: 0, tag: 1 });
  assert.deepEqual(logic.split(0x0B7, P({ ways: 2, block: 16 })), { addr: 0x0B7, block: 11, offset: 7, set: 3, tag: 2 });
  assert.deepEqual(logic.split(0x0B7, P({ ways: 8, block: 32 })), { addr: 0x0B7, block: 5, offset: 23, set: 0, tag: 5 });
  assert.deepEqual(logic.split(0x0B7, P({ ways: 4, block: 8 })), { addr: 0x0B7, block: 22, offset: 7, set: 0, tag: 11 });
});

test('rule 1: bit widths add up to 12 for every shape', () => {
  for (const ways of [1, 2, 4, 8]) for (const block of [8, 16, 32]) {
    const g = logic.geometry(P({ ways, block }));
    assert.equal(g.sets * g.ways, 8);
    assert.equal(2 ** g.offsetBits, block);
    assert.equal(2 ** g.setBits, g.sets);
    assert.equal(g.tagBits + g.setBits + g.offsetBits, 12);
  }
});

// ── rule 2: hit ──

test('rule 2: a hit needs a valid way with the same tag in the selected set; it only refreshes lastUse', () => {
  const before = run([0x000, 0x040], { ways: 2 });
  const s = run([0x000, 0x040, 0x004], { ways: 2 });
  assert.equal(s.log[2].result, 'hit');
  assert.equal(s.log[2].way, 0);
  assert.equal(s.log[2].victim, null);
  const changed = s.lines.filter((l, i) => JSON.stringify(l) !== JSON.stringify(before.lines[i]));
  assert.deepEqual(changed, [{ set: 0, way: 0, valid: true, tag: 0, block: 0, lastUse: 3 }]);
});

test('rule 2: a hit records the way it hit, also way 1; held lists the set\'s valid tags in way order', () => {
  const s = run([0x000, 0x040, 0x040], { ways: 2 });
  assert.equal(s.log[2].result, 'hit');
  assert.equal(s.log[2].way, 1);
  assert.deepEqual(run([0x000, 0x040, 0x080], { ways: 2 }).log[2].held, [0, 1]);
});

test('lines are ordered by set, then way', () => {
  assert.deepEqual(logic.initial(P({ ways: 2 })).lines.map((l) => [l.set, l.way]),
    [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1], [3, 0], [3, 1]]);
});

test('rule 2: an invalid way never hits, even if it still carries the tag', () => {
  const p = P({ ways: 1 });
  const s0 = logic.initial(p);
  s0.lines[0] = { set: 0, way: 0, valid: false, tag: 0, block: 0, lastUse: null };
  const s = logic.step(s0, 1, P({ ways: 1 }));
  assert.equal(s.log[0].result, 'compulsory');
  assert.deepEqual(s.log[0].held, []);
});

test('rule 2: the same tag in another set is not a hit', () => {
  // 1 way, 8 sets: block 0 (set 0, tag 0) then block 1 (set 1, tag 0): same tag, other set → miss
  const s = run([0x000, 0x010], { ways: 1 });
  assert.equal(s.log[1].result, 'compulsory');
});

// ── rule 3: miss, victim and fill ──

test('rule 3: a miss on a full set evicts the least recently used way and fills it', () => {
  const s = run([0x000, 0x040, 0x080], { ways: 2 });
  assert.equal(s.log[2].victim, 0);
  assert.equal(s.log[2].way, 0);
  assert.deepEqual(s.lines.find((l) => l.set === 0 && l.way === 0), { set: 0, way: 0, valid: true, tag: 2, block: 8, lastUse: 3 });
});

// ── rule 4: direct mapped and fully associative ──

test('rule 4: direct mapped has one way per set, fully associative one set', () => {
  assert.equal(logic.geometry(P({ ways: 1 })).sets, 8);
  assert.equal(logic.geometry(P({ ways: 8 })).sets, 1);
  assert.equal(logic.initial(P({ ways: 1 })).lines.length, 8);
  assert.deepEqual(logic.initial(P({ ways: 8 })).lines.map((l) => l.set), [0, 0, 0, 0, 0, 0, 0, 0]);
  // fully associative: the cache itself behaves exactly as the shadow, so it never has a conflict miss
  for (const id of logic.TRACE_IDS) for (const block of [8, 16, 32]) {
    const s = end({ trace: id, ways: 8, block });
    assert.equal(s.misses.conflict, 0, id);
    assert.equal(s.hits, s.faHits, id);
  }
});

// ── rule 5: miss classification ──

test('rule 5: compulsory = first access to that block ever, even if another block was evicted for it', () => {
  const s = run([0x000, 0x080], { ways: 1 });
  assert.equal(s.log[1].result, 'compulsory');
  assert.equal(s.log[1].victim, 0);
});

test('rule 5: conflict = the fully associative cache would have hit', () => {
  const s = run([0x000, 0x080, 0x000], { ways: 1 });
  assert.equal(s.log[2].faHit, true);
  assert.equal(s.log[2].result, 'conflict');
});

test('rule 5: capacity = the fully associative cache misses too', () => {
  const nine = [0x000, 0x010, 0x020, 0x030, 0x040, 0x050, 0x060, 0x070, 0x080, 0x000];
  const s = run(nine, { ways: 1 });
  assert.equal(s.log[9].faHit, false);
  assert.equal(s.log[9].result, 'capacity');
});

test('rule 5: compulsory beats capacity: a first access counts as compulsory even when the shadow is full', () => {
  const s = run([0x000, 0x010, 0x020, 0x030, 0x040, 0x050, 0x060, 0x070, 0x080], { ways: 8 });
  assert.equal(s.log[8].faHit, false);
  assert.equal(s.log[8].result, 'compulsory');
});

test('rule 5: the shadow is updated on every access, hit or miss', () => {
  const s = run([0x000, 0x010, 0x000], { ways: 1 });
  assert.deepEqual(s.fa, [1, 0]);
});

// ── rule 6 and counts ──

test('rule 6 and counts: hits plus misses equal the accesses at every step', () => {
  for (const id of logic.TRACE_IDS) for (const ways of [1, 2, 4, 8]) {
    const p = P({ trace: id, ways });
    for (let n = 0; n <= steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      const m = s.misses;
      assert.equal(s.hits + m.compulsory + m.capacity + m.conflict, n);
      assert.equal(s.i, n);
    }
  }
});

// ── presets (SPEC.md "Presets", 8 lines, 16 B blocks) ──

test('steps: one per access, 8, 9, 8 and 20', () => {
  assert.deepEqual(logic.TRACE_IDS.map((id) => steps(P({ trace: id }))), [8, 9, 8, 20]);
});

test('preset ping-pong: 1-way 2 C + 6 K; 2-way 2 C + 6 hits', () => {
  assert.equal(marks(end({ trace: 'ping-pong', ways: 1 })), 'CCKKKKKK');
  assert.equal(marks(end({ trace: 'ping-pong', ways: 2 })), 'CCHHHHHH');
});

test('preset three-way: 1-way and 2-way no hits (3 C + 6 K), 4-way 6 hits', () => {
  assert.equal(marks(end({ trace: 'three-way', ways: 1 })), 'CCCKKKKKK');
  assert.equal(marks(end({ trace: 'three-way', ways: 2 })), 'CCCKKKKKK');
  assert.equal(marks(end({ trace: 'three-way', ways: 4 })), 'CCCHHHHHH');
});

test('preset locality: miss, hit, hit, hit, miss, hit, hit, hit at every associativity', () => {
  for (const ways of [1, 2, 4, 8]) assert.equal(marks(end({ trace: 'locality', ways })), 'CHHHCHHH');
});

test('preset capacity: 8-way 10 C + 10 P; 1-way 10 C, 4 P, 6 hits (blocks 2–7 survive); 2-way 4 hits', () => {
  assert.equal(marks(end({ trace: 'capacity', ways: 8 })), 'CCCCCCCCCCPPPPPPPPPP');
  const dm = end({ trace: 'capacity', ways: 1 });
  assert.equal(marks(dm), 'CCCCCCCCCCPPHHHHHHPP');
  assert.deepEqual(dm.log.filter((e) => e.result === 'hit').map((e) => e.block), [2, 3, 4, 5, 6, 7]);
  assert.equal(end({ trace: 'capacity', ways: 2 }).hits, 4);
});

test('block size changes the mapping: ping-pong at 32 B is no conflict; locality at 8 B and 32 B', () => {
  assert.equal(marks(end({ trace: 'ping-pong', ways: 1, block: 32 })), 'CCHHHHHH');
  assert.equal(marks(end({ trace: 'locality', ways: 1, block: 8 })), 'CHCHCHCH');
  assert.equal(marks(end({ trace: 'locality', ways: 1, block: 32 })), 'CHHHHHHH');
});

test('task caption: ping-pong 1-way step 4 is 0x080, block 8, set 0, tag 1, set 0 held tag 0, conflict, block 0 out', () => {
  const e = at({ trace: 'ping-pong', ways: 1 }, 4).log[3];
  assert.deepEqual([e.addr, e.block, e.set, e.tag, e.held, e.result, e.victim], [0x080, 8, 0, 1, [0], 'conflict', 0]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const id of logic.TRACE_IDS) {
    const p = P({ trace: id, ways: 2, block: 8 });
    for (let n = 0; n <= steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ trace: 'capacity', ways: 2, block: 16 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ trace: 'three-way', ways: 2 });
  let s = logic.initial(p);
  for (let n = 1; n <= 4; n++) {
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
  assert.equal(meta.steps, steps(P({})), 'meta.steps matches the model at the defaults');
  const sets = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(sets.length > 0, 'found preset params');
  for (const body of sets) {
    for (const k of [...body.matchAll(/(\w+):/g)].map((x) => x[1])) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    const tr = body.match(/trace:\s*'([^']+)'/);
    if (tr) assert.ok(logic.TRACE_IDS.includes(tr[1]), `trace ${tr[1]} exists`);
  }
  const sim = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, steps(P({})), 'sim.json steps matches the model at the defaults');
});
