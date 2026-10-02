// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the multicore model (sim.js). Run: node --test sims/multicore-mesi/
// The model's rules first (edge cases and tie-breaks first of all), then the generic block every sim keeps.
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
const at = (over) => kit.stateAt(logic, P(over), 0);
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 5e-3, `${msg || ''} ${a} ≈ ${b}`);
const ops = (list) => { const o = logic.clearOps(); list.forEach((x, i) => { o['o' + (i + 1)] = x; }); return o; };
const mesi = (list) => at(Object.assign({ view: 'mesi' }, ops(list))).mesi;
const states = (m) => m.caches.map((row) => row[0].st).join('');
const preset = (id) => at(logic.presets.find((x) => x.id === id).params);

// ── MESI: edge cases and tie-breaks ──

test('read with no copy anywhere: miss, the reader gets E', () => {
  const m = mesi(['r0']);
  assert.equal(states(m), 'EI');
  assert.equal(m.misses, 1);
  assert.equal(m.events[0].outcome, 'miss');
  assert.equal(m.events[0].value, 0);
});

test('write with no copy anywhere: miss, I → M, nothing to invalidate, RAM stale', () => {
  const m = mesi(['w1']);
  assert.equal(states(m), 'IM');
  assert.equal(m.inval, 0);
  assert.equal(m.wb, 0);
  assert.equal(m.caches[1][0].v, 1);
  assert.equal(m.ram[0], 0);
  assert.equal(m.stale, true);
});

test('read when the other core has E: both S, no write-back, no invalidation', () => {
  const m = mesi(['r0', 'r1']);
  assert.equal(states(m), 'SS');
  assert.equal(m.wb, 0);
  assert.equal(m.inval, 0);
  assert.deepEqual(m.events[1].changes, [{ core: 0, from: 'E', to: 'S' }, { core: 1, from: 'I', to: 'S' }]);
});

test('read when the other core has S: only the reader changes', () => {
  const m = mesi(['r0', 'r1', 'r0']);
  assert.equal(m.events[2].outcome, 'hit');
  const m2 = mesi(['r0', 'r1', 'w0', 'r1', 'r0']);
  assert.equal(states(m2), 'SS');
});

test('read when the other core has M: it writes back, M → S, the reader gets the new value; a downgrade is not an invalidation', () => {
  const m = mesi(['w0', 'w0', 'r1']);
  assert.equal(states(m), 'SS');
  assert.equal(m.wb, 1);
  assert.equal(m.inval, 0);
  assert.equal(m.ram[0], 2);
  assert.equal(m.caches[1][0].v, 2);
  assert.equal(m.events[2].wb, 0);
  assert.equal(m.stale, false);
});

test('read hits in M, E and S change nothing and use no bus', () => {
  for (const seq of [['w0'], ['r0'], ['r0', 'r1']]) {
    const before = mesi(seq);
    const after = mesi(seq.concat('r0'));
    assert.equal(states(after), states(before));
    assert.equal(after.hits, before.hits + 1);
    assert.equal(after.events.at(-1).outcome, 'hit');
    assert.deepEqual(after.events.at(-1).changes, []);
  }
});

test('write to E: hit, E → M with no bus traffic', () => {
  const m = mesi(['r0', 'w0']);
  assert.equal(states(m), 'MI');
  const ev = m.events[1];
  assert.equal(ev.outcome, 'hit');
  assert.deepEqual(ev.changes, [{ core: 0, from: 'E', to: 'M' }]);
  assert.equal(m.inval, 0);
});

test('write to M: hit, the value grows, RAM stays stale', () => {
  const m = mesi(['w0', 'w0', 'w0']);
  assert.equal(m.caches[0][0].v, 3);
  assert.equal(m.ram[0], 0);
  assert.equal(m.hits, 2);
  assert.equal(m.stale, true);
});

test('write to S: upgrade, the other copy S → I, one invalidation, no write-back', () => {
  const m = mesi(['r0', 'r1', 'w0']);
  assert.equal(states(m), 'MI');
  assert.equal(m.events[2].outcome, 'upgrade');
  assert.equal(m.upgrades, 1);
  assert.equal(m.inval, 1);
  assert.equal(m.wb, 0);
  assert.equal(m.caches[1][0].v, null);
});

test('write when the other core has M: it writes back and is invalidated; the new value follows the latest', () => {
  const m = mesi(['w0', 'w0', 'w1']);
  assert.equal(states(m), 'IM');
  assert.equal(m.wb, 1);
  assert.equal(m.inval, 1);
  assert.equal(m.ram[0], 2);
  assert.equal(m.caches[1][0].v, 3);
});

test('invariant over every sequence of five operations: at most one M or E, and then every other copy is I', () => {
  const all = (n) => (n === 0 ? [[]] : all(n - 1).flatMap((s) => logic.OPS.map((o) => s.concat(o))));
  for (const seq of all(5)) {
    const m = mesi(seq);
    const st = m.caches.map((r) => r[0].st);
    const owners = st.filter((x) => x === 'M' || x === 'E').length;
    assert.ok(owners <= 1, seq.join(','));
    if (owners) assert.ok(st.every((x) => x === 'M' || x === 'E' || x === 'I'), seq.join(','));
    // every valid copy holds the latest value; RAM holds it unless some copy is M
    const latest = seq.filter((o) => o[0] === 'w').length;
    m.caches.forEach((r) => { if (r[0].st !== 'I') assert.equal(r[0].v, latest, seq.join(',')); });
    if (!m.stale) assert.equal(m.ram[0], latest, seq.join(','));
    assert.equal(m.hits + m.misses + m.upgrades, seq.length);
  }
});

// ── MESI operations in the params ──

test('operations stop at the first empty slot', () => {
  assert.deepEqual(logic.opsOf(P({ o1: 'r0', o2: '', o3: 'w1' })), ['r0']);
  assert.deepEqual(logic.opsOf(P({ o1: 'x9' })), []);
});

test('push fills the next slot and refuses when all are used; pop clears the last', () => {
  assert.deepEqual(logic.pushOp(P(ops(['r0'])), 'w1'), { o2: 'w1' });
  const full = P(ops(Array(logic.MAX_OPS).fill('r0')));
  assert.equal(logic.pushOp(full, 'w0'), null);
  assert.equal(at(full).mesi.full, true);
  assert.deepEqual(logic.popOp(P(ops(['r0', 'w0']))), { o2: '' });
  assert.equal(logic.popOp(P()), null);
});

// ── false sharing ──

test('no padding: every write misses and every write after the first invalidates the other copy', () => {
  for (const k of [1, 2, 8, 16]) {
    const f = logic.fsView(k, false);
    assert.equal(f.misses, k);
    assert.equal(f.inval, k - 1);
    assert.equal(f.hits, 0);
    assert.equal(f.lines, 1);
  }
  assert.equal(logic.fsView(8, false).hitShare, 0);
});

test('padding: one miss per core, then hits; nothing is invalidated', () => {
  const f = logic.fsView(8, true);
  assert.equal(f.misses, 2);
  assert.equal(f.inval, 0);
  assert.equal(f.hits, 6);
  near(f.hitShare, 0.75);
  assert.deepEqual(f.caches.map((r) => r.map((e) => e.st)), [['M', 'I'], ['I', 'M']]);
  assert.equal(logic.fsView(1, true).misses, 1);
});

test('the cores write in turn, core 0 first; counters count their own writes', () => {
  assert.deepEqual(logic.fsView(5, false).counters, [3, 2]);
  assert.equal(logic.fsView(5, false).last.core, 0);
  assert.equal(logic.fsView(4, true).last.core, 1);
  assert.equal(logic.fsView(0, false).hitShare, null);
  assert.equal(logic.fsView(0, false).last, null);
});

test('without padding both counters share line 0; with padding each starts its own line', () => {
  assert.deepEqual(logic.fsView(0, false).place, [{ line: 0, slot: 0 }, { line: 0, slot: 1 }]);
  assert.deepEqual(logic.fsView(0, true).place, [{ line: 0, slot: 0 }, { line: 1, slot: 0 }]);
});

// ── Amdahl ──

test('Amdahl: the original\'s numbers (80 %, 8 cores: 3.33×, 42 %, max 5.0×)', () => {
  const a = at({ p: 80, n: 8 }).amdahl;
  near(a.speedup, 3.333);
  assert.equal(Math.round(a.efficiency * 100), 42);
  near(a.ceiling, 5);
});

test('Amdahl: one core gives 1×; 95 % on 64 cores stays under the 20× ceiling', () => {
  near(at({ p: 50, n: 1 }).amdahl.speedup, 1);
  const a = at({ p: 95, n: 64 }).amdahl;
  near(a.speedup, 15.42);
  near(a.ceiling, 20);
  assert.ok(a.speedup < a.ceiling);
  assert.deepEqual(a.curve.map((c) => c.n), [1, 2, 4, 8, 16, 32, 64]);
});

// ── presets ──

test('presets end where their hints say', () => {
  assert.equal(states(preset('mesi-empty').mesi), 'II');
  assert.equal(states(preset('mesi-share').mesi), 'SS');
  assert.equal(states(preset('mesi-invalidate').mesi), 'MI');
  const ping = preset('mesi-pingpong').mesi;
  assert.equal(states(ping), 'SS');
  assert.equal(ping.wb, 3);
  assert.equal(ping.ram[0], 3);
  assert.equal(preset('fs-shared').fs.inval, 7);
  assert.equal(preset('fs-padded').fs.inval, 0);
  near(preset('amdahl-95').amdahl.ceiling, 20);
});

test('every preset param is a model param, and every preset has its strings', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `${p.id}: ${k}`);
    const label = html.match(new RegExp(`'${p.id}': '(\\w+)'`));
    assert.ok(label, `label for ${p.id}`);
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang][label[1]], `${lang} ${label[1]}`);
      assert.ok(strings[lang][label[1] + 'Hint'], `${lang} ${label[1]}Hint`);
    }
  }
  assert.ok(logic.presets.length <= 9, 'keys 1–9');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of [{}, { view: 'mesi', ...ops(['w0', 'r1', 'w1', 'w0']) }, { view: 'fs', writes: 16, pad: true }, { p: 99, n: 64 }]) {
    const s = at(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ view: 'mesi', ...ops(['r0', 'w1']), writes: 7 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
});

test('access does not mutate its input machine', () => {
  const m = logic.access(logic.emptyMachine(1), 0, 'w', 0);
  const copy = structuredClone(m);
  logic.access(m, 1, 'r', 0);
  assert.deepEqual(m, copy);
});

test('an explorer: no steps, as the page meta says', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.equal(logic.steps, 0);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});
