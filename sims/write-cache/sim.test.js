// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for write-cache's model (SPEC.md). Run: node --test sims/write-cache/
// Order: tie-breaks first, then one test per rule, the preset numbers, then the template's generic block.
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
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps(P(over)));
const w = (s, id) => s.ops.find((o) => o.id === id);
const times = (s, key) => Object.fromEntries(s.ops.filter((o) => o.kind === 'write').map((o) => [o.id, o[key]]));
/** The state after the step whose clock is t (the first such step). */
const atTime = (over, t) => {
  const p = P(over);
  for (let n = 1; n <= logic.steps(p); n++) { const s = kit.stateAt(logic, p, n); if (s.t === t) return s; }
  throw new Error('no step at t = ' + t);
};

// ── tie-breaks ──

test('tie-break (rule 7): a later write to a dirty LBA replaces it in cache: one destage, both acknowledged', () => {
  const s = end({ pattern: 'rewrite', cutAt: 60 });
  assert.equal(w(s, 'B').supersededBy, 'B2');
  assert.equal(w(s, 'B').durableAt, null, 'B itself is never written');
  assert.equal(w(s, 'B2').durableAt, 32);
  assert.equal(s.disk['480'], 'B2');
  const slots = atTime({ pattern: 'rewrite', cutAt: 60 }, 5).cache.filter((c) => c.lba === 480);
  assert.equal(slots.length, 1, 'one cache slot for LBA 480');
  assert.deepEqual([slots[0].id, slots[0].label], ['B2', 'B2'], 'the slot now holds the newer write');
  const k = logic.tally(s);
  assert.equal(k.ack, 6);
  assert.equal(k.disk, 5, 'five disk writes for six writes');
  assert.equal(k.replaced, 1);
  assert.equal(k.lost, 0);
});

test('tie-break (rule 7): a block the disk is already writing is not replaced; the new write gets its own slot', () => {
  const p = P({ pattern: 'rewrite', diskMs: 4, cutAt: 60 });
  // A state where the disk is writing B (480) when B2 (480) is issued at 3.
  const s0 = logic.initial(p);
  s0.t = 2; s0.next = 3; // A, B, C issued
  ['A', 'B', 'C'].forEach((id, i) => { const o = w(s0, id); o.issuedAt = i; o.ackAt = i + 0.1; });
  s0.cache = [{ id: 'A', lba: 120, label: 'A', dirty: false, seq: 0 }, { id: 'B', lba: 480, label: 'B', dirty: true, seq: 1 }, { id: 'C', lba: 300, label: 'C', dirty: true, seq: 2 }];
  w(s0, 'A').durableAt = 1;
  s0.disk = { 120: 'A' }; s0.head = 120; s0.seq = 3;
  s0.busy = { id: 'B', lba: 480, doneAt: 5 };
  const s1 = logic.step(s0, 1, p); // t = 3: B2 issued while B is being written
  assert.equal(s1.t, 3);
  assert.equal(w(s1, 'B').supersededBy, null, 'B in flight is not replaced');
  assert.equal(s1.cache.filter((c) => c.lba === 480 && c.dirty).length, 2, 'B (in flight) and B2 (dirty)');
});

test('tie-break: equal LBAs in write-through are written in issue order (the later content wins on disk)', () => {
  const s = end({ policy: 'wt', pattern: 'rewrite', cutAt: 80 });
  assert.ok(w(s, 'B').durableAt < w(s, 'B2').durableAt);
  assert.equal(s.disk['480'], 'B2');
  assert.equal(w(s, 'B').supersededBy, null, 'write-through does not merge: each write gets its own ack');
});

test('tie-break: a cut at the very ms a disk write completes counts the write as on disk (completion first)', () => {
  const s = end({ cutAt: 16 }); // E finishes at 16
  assert.equal(w(s, 'E').durableAt, 16);
  assert.deepEqual(s.lost.sort(), ['B', 'C', 'D', 'F']);
  const s2 = end({ cutAt: 15 });
  assert.equal(w(s2, 'E').durableAt, null);
  assert.deepEqual(s2.lost.sort(), ['B', 'C', 'D', 'E', 'F']);
});

test('tie-break: the elevator wraps to the lowest LBA when nothing is at or above the head (C-LOOK)', () => {
  const s = atTime({ pattern: 'journal', cutAt: 20 }, 8); // head at 950 after X; D (900) and C (100) dirty
  const start = s.ev.find((e) => e.type === 'start');
  assert.equal(start.id, 'C');
  assert.equal(start.wrap, true);
  assert.equal(start.of, 2);
});

// ── rules ──

test('rule 1: write-through acknowledges only when the disk has the block (ack = durable)', () => {
  const s = end({ policy: 'wt', cutAt: 80 });
  for (const o of s.ops) assert.equal(o.ackAt, o.durableAt, o.id);
  assert.deepEqual(times(s, 'ackAt'), { A: 8, B: 32, C: 24, D: 48, E: 16, F: 40 });
  assert.equal(logic.meanAck(s), 25.5);
});

test('rule 2: write-back acknowledges after the cache time; the block is dirty until destaged', () => {
  const s = atTime({}, 5);
  assert.deepEqual(times(s, 'ackAt'), { A: 0.1, B: 1.1, C: 2.1, D: 3.1, E: 4.1, F: 5.1 });
  assert.equal(logic.CACHE_MS, 0.1);
  assert.deepEqual(s.cache.filter((c) => c.dirty).map((c) => c.id), ['A', 'B', 'C', 'D', 'E', 'F'], 'A is being written, still dirty');
  assert.deepEqual(times(s, 'durableAt'), { A: null, B: null, C: null, D: null, E: null, F: null });
});

test('rule 3: a power cut empties a volatile cache: every acknowledged dirty block is lost', () => {
  const s = end({});
  assert.equal(s.power, 'restored');
  assert.deepEqual(s.cache, []);
  assert.deepEqual(s.lost.sort(), ['B', 'D', 'F']);
  const k = logic.tally(s);
  assert.deepEqual([k.ack, k.disk, k.lost], [6, 3, 3]);
});

test('rule 3: the write in flight at the cut never completes; the block keeps its old content', () => {
  const s = end({}); // B (480) was being written 24–32
  assert.equal(s.disk['480'], undefined);
  assert.equal(s.busy, null);
});

test('rule 4: a battery-backed cache keeps dirty blocks and destages them after power returns; nothing is lost', () => {
  const cut = atTime({ bbu: 'on' }, 25);
  assert.equal(cut.power, 'off');
  assert.deepEqual(cut.cache.filter((c) => c.dirty).map((c) => c.id).sort(), ['B', 'D', 'F']);
  assert.deepEqual(cut.lost, []);
  assert.equal(logic.tally(cut).waiting, 3, 'three dirty blocks wait in the protected cache');
  assert.equal(logic.tally(cut).unacked, 0);
  const s = end({ bbu: 'on' });
  assert.deepEqual(times(s, 'durableAt'), { A: 8, B: 33, C: 24, D: 49, E: 16, F: 41 });
  assert.deepEqual(s.lost, []);
  assert.equal(logic.tally(s).disk, 6);
});

test('rule 4: after the cut nobody waits for an ack: a write-through block destaged from a protected cache stays unacknowledged', () => {
  const cut = atTime({ policy: 'wt', bbu: 'on', cutAt: 30 }, 30);
  assert.equal(cut.power, 'off');
  assert.deepEqual([logic.tally(cut).waiting, logic.tally(cut).unacked], [3, 0], 'held in cache, not given up');
  const s = end({ policy: 'wt', bbu: 'on', cutAt: 30 });
  assert.equal(w(s, 'B').ackAt, null);
  assert.notEqual(w(s, 'B').durableAt, null);
  const k = logic.tally(s);
  assert.deepEqual([k.ack, k.disk, k.diskNoAck, k.unacked, k.lost], [3, 6, 3, 0, 0]);
});

test('rule 5: write-back with a failed battery runs write-through', () => {
  const p = P({ bbu: 'failed', cutAt: 30 });
  assert.equal(logic.effPolicy(p), 'wt');
  assert.equal(logic.effPolicy(P({ bbu: 'off' })), 'wb', 'no battery at all: write-back as set');
  assert.deepEqual(end({ bbu: 'failed', cutAt: 80 }).ops.map((o) => o.ackAt), end({ policy: 'wt', cutAt: 80 }).ops.map((o) => o.ackAt));
  const s = end({ bbu: 'failed', cutAt: 30 });
  assert.equal(s.cache.length, 0, 'a failed battery does not protect the cache');
});

test('rule 6: write-back destages in LBA order, so the commit record reaches the disk before its data', () => {
  const s = end({ pattern: 'journal', cutAt: 20 });
  assert.equal(w(s, 'C').durableAt, 16);
  assert.equal(w(s, 'D').durableAt, null);
  assert.equal(logic.journalOf(s), 'corrupt');
  assert.deepEqual(s.lost, ['D']);
});

test('rule 6: the journal issues its commit only after the data is acknowledged', () => {
  const wb = end({ pattern: 'journal', cutAt: 80 });
  assert.equal(w(wb, 'C').issuedAt, 2); // D acked at 1.1
  const wt = end({ policy: 'wt', pattern: 'journal', cutAt: 80 });
  assert.equal(w(wt, 'C').issuedAt, 16); // D acked (and on disk) at 16
  assert.equal(logic.journalOf(wt), 'new');
});

test('rule 6: flush + FUA forces the order: data first, the commit acknowledged only from disk', () => {
  const s = end({ pattern: 'journal', flush: true, cutAt: 20 });
  const f = s.ops.find((o) => o.kind === 'flush');
  assert.equal(f.issuedAt, 2);
  assert.equal(f.doneAt, 16);
  assert.equal(w(s, 'D').durableAt, 16);
  assert.equal(w(s, 'C').issuedAt, 16);
  assert.equal(w(s, 'C').ackAt, null, 'FUA: no ack before the disk has it');
  assert.equal(logic.journalOf(s), 'old');
  assert.deepEqual(s.lost, []);
  assert.equal(logic.tally(s).unacked, 1);
  const full = end({ pattern: 'journal', flush: true, cutAt: 80 });
  assert.equal(w(full, 'C').ackAt, 24);
  assert.equal(logic.journalOf(full), 'new');
});

test('flush is a no-op for patterns without a commit record', () => {
  assert.deepEqual(end({ flush: true }), end({ flush: false }));
});

test('the cut stops the application: writes not yet issued are never sent', () => {
  const s = end({ bbu: 'on', diskMs: 12, cutAt: 0 });
  const k = logic.tally(s);
  assert.equal(k.issued, 1);
  assert.equal(k.never, 5);
  assert.equal(w(s, 'A').durableAt, 12);
});

test('a cut after everything is on disk loses nothing', () => {
  const s = end({ diskMs: 4, cutAt: 30 });
  assert.equal(logic.tally(s).disk, 6);
  assert.deepEqual(s.lost, []);
});

// ── the presets' numbers (SPEC.md "Presets") ──

test('preset write-through: 3 acknowledged, 3 on disk, 0 lost; 11 steps', () => {
  const o = { policy: 'wt', cutAt: 30 };
  const k = logic.tally(end(o));
  assert.deepEqual([k.ack, k.disk, k.lost, k.unacked], [3, 3, 0, 3]);
  assert.equal(logic.meanAck(end(o)), 14, 'mean over the three acknowledged writes: (8 + 12 + 22) / 3');
  assert.equal(logic.steps(P(o)), 11);
});

test('preset write-back-cut (the default): all 6 acked by 5.1 ms, 3 on disk by 24 ms, 3 lost; 11 steps', () => {
  assert.equal(logic.steps(P({})), 11);
  const s = end({});
  assert.deepEqual(times(s, 'durableAt'), { A: 8, B: null, C: 24, D: null, E: 16, F: null });
});

test('preset write-back-bbu: 0 lost, 14 steps', () => {
  assert.equal(logic.steps(P({ bbu: 'on' })), 14);
});

test('preset reorder and reorder-flush: 7 steps each; battery-failed: 11', () => {
  assert.equal(logic.steps(P({ pattern: 'journal', cutAt: 20 })), 7);
  assert.equal(logic.steps(P({ pattern: 'journal', flush: true, cutAt: 20 })), 7);
  assert.equal(logic.steps(P({ bbu: 'failed', cutAt: 30 })), 11);
});

test('every combination of params stays within 20 steps', () => {
  let max = 0;
  for (const policy of ['wt', 'wb']) for (const bbu of ['off', 'on', 'failed']) for (const pattern of ['six', 'journal', 'rewrite'])
    for (const flush of [false, true]) for (const diskMs of [4, 8, 12]) for (let cutAt = 0; cutAt <= 80; cutAt++)
      max = Math.max(max, logic.steps(P({ policy, bbu, pattern, flush, diskMs, cutAt })));
  assert.equal(max, 14, 'SPEC: 14 steps at most');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const o of [{}, { bbu: 'on' }, { pattern: 'journal', flush: true }, { pattern: 'rewrite', policy: 'wt' }]) {
    const p = P(o);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ bbu: 'on', pattern: 'rewrite', diskMs: 12, cutAt: 40 });
  const N = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= N; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = N; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ bbu: 'on' });
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
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the default preset');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
