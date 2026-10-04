// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for multimaster-conflict's model. Run: node --test sims/multimaster-conflict/
// Rule numbers refer to SPEC.md. Tie-breaks first, then the rules, then the presets' numbers, then the generic block.
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
const V = (o) => Object.assign({ value: 0, stamp: 0, version: 1, origin: 'M1', vv: { M1: 0, M2: 0 }, wid: 'w?', t: 0 }, o);
const vals = (field) => logic.versionsOf(field).map((v) => v.value);

// ── tie-breaks ──

test('rule 3 tie-break: equal LWW stamps → the larger origin id wins (M2 over M1), from either side', () => {
  const a = V({ value: 20, stamp: 5, origin: 'M1', wid: 'a' });
  const b = V({ value: 30, stamp: 5, origin: 'M2', wid: 'b' });
  assert.equal(logic.lwwBeats(b, a), true);
  assert.equal(logic.lwwBeats(a, b), false);
  assert.equal(logic.merge('lww', a, b).outcome, 'applied');
  assert.equal(logic.merge('lww', a, b).rule, 'origin');
  assert.equal(logic.merge('lww', b, a).outcome, 'kept');
  // the same through a run: M2's clock 2 s slow puts its write at stamp 5, like M1's
  const s = end({ skewM2: -2 });
  assert.deepEqual(vals(s.copies.M1.fields.x), [30]);
  assert.deepEqual(vals(s.copies.M2.fields.x), [30]);
  assert.equal(s.result.fields[0].rule, 'origin');
});

test('rule 6 tie-breaks: equal version → later stamp; equal version and stamp → higher DC GUID', () => {
  const a = V({ value: 'p', version: 2, stamp: 5, origin: 'M1', wid: 'a' });
  const b = V({ value: 'q', version: 2, stamp: 8, origin: 'M2', wid: 'b' });
  assert.equal(logic.adBeats(b, a), true);
  assert.equal(logic.adBeats(a, b), false);
  const c = V({ value: 'r', version: 2, stamp: 5, origin: 'M2', wid: 'c' });
  assert.ok(logic.GUID.M2 > logic.GUID.M1, 'DC2 has the higher GUID');
  assert.equal(logic.adBeats(c, a), true, 'equal version and stamp: the higher GUID wins');
  assert.equal(logic.adBeats(a, c), false);
  assert.equal(logic.merge('ad', a, c).rule, 'guid');
  // the version is compared before the stamp: an older stamp with a higher version wins
  const d = V({ value: 's', version: 3, stamp: 1, origin: 'M1', wid: 'd' });
  assert.equal(logic.adBeats(d, b), true);
  assert.equal(logic.merge('ad', b, d).rule, 'version');
  // through a run: DC2 4 s fast would win; DC2 3 s slow writes at stamp 5 too, and the GUID decides
  const s = end({ strategy: 'ad', skewM2: -3 });
  const r1 = at({ strategy: 'ad', skewM2: -3 }, 8).result;
  assert.equal(r1.fields[0].rule, 'guid');
  assert.equal(s.copies.M1.fields.telephoneNumber.value, '555-0404');
  assert.equal(at({ strategy: 'ad', skewM2: -3 }, 8).copies.M1.fields.telephoneNumber.value, '555-0303');
});

test('rule 5 tie-break: equal vectors are the same version, not a conflict; ≥ on every counter dominates', () => {
  assert.equal(logic.vvCompare({ M1: 1, M2: 1 }, { M1: 1, M2: 1 }), 'equal');
  assert.equal(logic.vvCompare({ M1: 2, M2: 1 }, { M1: 1, M2: 1 }), 'a');
  assert.equal(logic.vvCompare({ M1: 1, M2: 1 }, { M1: 2, M2: 1 }), 'b');
  assert.equal(logic.vvCompare({ M1: 2, M2: 0 }, { M1: 1, M2: 1 }), 'concurrent');
  const a = V({ value: 20, vv: { M1: 2, M2: 0 }, wid: 'a' });
  const older = V({ value: 10, vv: { M1: 1, M2: 0 }, wid: 'o' });
  assert.equal(logic.merge('vv', a, older).outcome, 'kept', 'a dominated version is dropped');
  assert.equal(logic.merge('vv', older, a).outcome, 'applied', 'a dominating version replaces');
  assert.equal(logic.merge('vv', a, Object.assign({}, a)).outcome, 'same');
});

test('rule 5: a version arriving at a sibling pair: dominating both replaces them, dominated by one is dropped', () => {
  const a = V({ value: 20, vv: { M1: 2, M2: 0 }, wid: 'a' });
  const b = V({ value: 30, vv: { M1: 1, M2: 1 }, wid: 'b' });
  const pair = { siblings: [a, b] };
  const c = V({ value: 40, vv: { M1: 2, M2: 1 }, wid: 'c' });
  assert.equal(logic.merge('vv', pair, c).outcome, 'applied');
  assert.deepEqual(logic.merge('vv', pair, c).field, c);
  const old = V({ value: 15, vv: { M1: 2, M2: 0 }, wid: 'o' });
  assert.equal(logic.merge('vv', pair, old).outcome, 'kept', 'dominated by one sibling only');
  // a write over siblings merges every sibling's vector before counting itself
  assert.deepEqual(logic.vvMerge([a.vv, b.vv]), { M1: 2, M2: 1 });
  // through step: M1 holding the sibling pair takes a client write (plan step 3 is M1's write)
  const p = P({ strategy: 'vv' });
  const sib = end({ strategy: 'vv' });
  const after = logic.step(sib, 3, p);
  assert.deepEqual(after.copies.M1.fields.x.vv, { M1: 3, M2: 1 });
  assert.equal(after.copies.M1.fields.x.siblings, undefined, 'the write replaces both siblings');
});

// ── rules ──

test('rule 1: a master accepts a write locally at once and queues/sends it to the other', () => {
  const s = at({}, 3);
  assert.equal(s.copies.M1.fields.x.value, 20);
  assert.equal(s.copies.M2.fields.x.value, 10, 'M2 has not seen it yet');
  assert.equal(s.pending.length, 1);
  assert.deepEqual([s.pending[0].from, s.pending[0].to], ['M1', 'M2']);
  assert.equal(s.last.kind, 'write');
  assert.equal(s.last.queued, true);
  const w = at({}, 4);
  assert.equal(w.copies.M2.fields.x.value, 30);
  assert.equal(w.copies.M1.fields.x.value, 20);
});

test('rule 1: stamps come from the writer\'s own clock (real time + skew)', () => {
  assert.equal(at({ skewM2: -4 }, 4).writes[1].stamp, 3);
  assert.equal(at({ skewM2: 4 }, 4).writes[1].stamp, 11);
  assert.equal(at({ skewM2: -4 }, 3).writes[0].stamp, 5, 'M1 is not skewed');
  assert.equal(at({}, 4).writes[1].t, 7);
});

test('rule 2: while partitioned nothing is delivered; after the heal the queue empties in send order', () => {
  const plan = logic.plan(P({}));
  assert.deepEqual(plan.map((a) => a.t), [1, 2, 5, 7, 9, 10, 11, 12]);
  assert.deepEqual(plan.map((a) => a.do), ['repl', 'part', 'write', 'write', 'heal', 'deliver', 'deliver', 'resolve']);
  const s4 = at({}, 4);
  assert.equal(s4.partitioned, true);
  assert.deepEqual(s4.pending.map((m) => m.from), ['M1', 'M2']);
  const s5 = at({}, 5);
  assert.equal(s5.partitioned, false);
  assert.equal(s5.pending.length, 2, 'the heal itself delivers nothing');
  assert.equal(at({}, 6).last.from, 'M1', 'M1 sent first, so it arrives first');
  assert.equal(at({}, 7).last.from, 'M2');
  assert.equal(at({}, 7).pending.length, 0);
  // send order follows the writes, not the sides: with only M2 writing, M2's message is first
  assert.equal(at({ writers: 'M2' }, 5).last.from, 'M2');
});

test('rule 3: LWW keeps the larger stamp at both receivers and discards the loser silently', () => {
  const s6 = at({ skewM2: 0 }, 6);
  assert.equal(s6.last.outcomes.x.outcome, 'kept', 'M2 keeps its 30 @7 against 20 @5');
  assert.equal(s6.copies.M2.fields.x.value, 30);
  const s7 = at({ skewM2: 0 }, 7);
  assert.equal(s7.last.outcomes.x.outcome, 'applied');
  assert.equal(s7.copies.M1.fields.x.value, 30);
  const r = end({ skewM2: 0 }).result;
  assert.deepEqual(r.lost, ['w1']);
  assert.equal(r.fields[0].winner, 'w2');
  assert.equal(r.fields[0].converged, true);
  assert.equal(r.siblings, false);
});

test('rule 4: the later write on a slow clock loses; nothing marks it except the result', () => {
  const s = end({ skewM2: -4 });
  assert.deepEqual(vals(s.copies.M1.fields.x), [20]);
  assert.deepEqual(vals(s.copies.M2.fields.x), [20]);
  assert.deepEqual(s.result.lost, ['w2']);
  assert.equal(s.result.laterLost, true);
  assert.equal(end({ skewM2: 0 }).result.laterLost, false, 'synced: the earlier write is the one lost');
  assert.equal(end({ skewM2: 4 }).result.laterLost, false, 'a fast M2 wins');
  // without a partition the slow clock still loses the later write, already at M2 itself
  const np = end({ partition: false });
  const w2 = np.writes[1];
  assert.equal(w2.accepted, false);
  assert.equal(w2.beatenBy, 'w1');
  assert.deepEqual(np.result.lost, ['w2']);
  assert.equal(np.result.laterLost, true);
});

test('rule 5: vectors count each master\'s updates; concurrent writes are kept as siblings on both', () => {
  const s3 = at({ strategy: 'vv' }, 3), s4 = at({ strategy: 'vv' }, 4);
  assert.deepEqual(s3.copies.M1.fields.x.vv, { M1: 2, M2: 0 });
  assert.deepEqual(s4.copies.M2.fields.x.vv, { M1: 1, M2: 1 });
  const s6 = at({ strategy: 'vv' }, 6);
  assert.equal(s6.last.outcomes.x.outcome, 'siblings');
  assert.equal(s6.last.outcomes.x.rule, 'concurrent');
  const s = end({ strategy: 'vv' });
  assert.deepEqual(vals(s.copies.M1.fields.x).sort(), [20, 30]);
  assert.deepEqual(vals(s.copies.M2.fields.x).sort(), [20, 30]);
  assert.equal(s.result.siblings, true);
  assert.deepEqual(s.result.lost, []);
  assert.equal(s.result.fields[0].rule, 'concurrent');
  assert.equal(s.result.fields[0].winner, null, 'siblings have no winner');
  // the skew does not matter to vectors
  assert.deepEqual(end({ strategy: 'vv', skewM2: 4 }).result, s.result);
});

test('rule 5: a write that saw the other replaces it (no conflict, nothing lost)', () => {
  const s = end({ strategy: 'vv', partition: false });
  assert.deepEqual(s.copies.M2.fields.x.vv, { M1: 2, M2: 1 });
  assert.deepEqual(vals(s.copies.M1.fields.x), [30]);
  assert.equal(s.result.siblings, false);
  assert.deepEqual(s.result.lost, []);
  assert.deepEqual(s.result.fields[0].overwritten, ['w1']);
  assert.equal(s.result.fields[0].rule, 'dominates');
});

test('rule 6: same attribute: same version 2, the later stamp wins; different attributes both survive', () => {
  const p = { strategy: 'ad', skewM2: 0 };
  assert.equal(logic.steps(P(p)), 12);
  const s3 = at(p, 3), s4 = at(p, 4);
  assert.equal(s3.copies.M1.fields.telephoneNumber.version, 2);
  assert.equal(s4.copies.M2.fields.telephoneNumber.version, 2);
  assert.equal(s4.writes[1].t, 8, 'DC2 writes 3 s after DC1');
  const r1 = at(p, 8).result;
  assert.equal(r1.fields[0].rule, 'stamp');
  assert.equal(at(p, 8).copies.M1.fields.telephoneNumber.value, '555-0303');
  assert.deepEqual(r1.lost, ['w1']);
  const s = end(p);
  assert.equal(s.copies.M1.fields.title.value, '@title2');
  assert.equal(s.copies.M2.fields.title.value, '@title2');
  assert.equal(s.copies.M1.fields.telephoneNumber.value, '555-0404');
  assert.equal(s.copies.M1.fields.telephoneNumber.version, 3);
  assert.equal(s.copies.M1.fields.title.version, 2);
  assert.equal(s.result.round, 2);
  assert.deepEqual(s.result.lost, []);
  assert.deepEqual(s.result.fields.map((f) => f.rule), ['single', 'single']);
  assert.equal(at(p, 9).result, null, 'round 2 clears the round 1 result');
});

test('rule 6: AD is per attribute: a change to title does not touch telephoneNumber', () => {
  const p = { strategy: 'ad', skewM2: 0 };
  const s11 = at(p, 11);
  assert.equal(s11.last.to, 'M2');
  assert.deepEqual(Object.keys(s11.last.change), ['title']);
  assert.equal(s11.copies.M2.fields.telephoneNumber.value, '555-0404', 'DC2 keeps its own new phone');
  assert.equal(s11.copies.M2.fields.title.value, '@title2');
});

test('rule 7: increments on both sides: LWW gives 11, intended 12', () => {
  const s = end({ inc: true, skewM2: 0 });
  assert.deepEqual(s.writes.map((w) => [w.read, w.value]), [[10, 11], [10, 11]]);
  assert.equal(s.result.got, 11);
  assert.equal(s.result.intended, 12);
  assert.equal(s.result.lost.length, 1);
  // in order (no partition, synced clocks) the second side reads 11 and nothing is lost
  const np = end({ inc: true, skewM2: 0, partition: false });
  assert.equal(np.result.got, 12);
  assert.equal(np.result.intended, 12);
  assert.deepEqual(np.result.lost, []);
  // under version vectors both increments stay as siblings, nothing is chosen
  const vv = end({ inc: true, strategy: 'vv' });
  assert.equal(vv.result.siblings, true);
  assert.equal(vv.result.got, null);
  assert.equal(vv.result.intended, 12);
});

test('rule 6: AD never rejects a local write on its stamp: the higher version wins even on a slow clock', () => {
  const s = end({ strategy: 'ad', partition: false, skewM2: -4 });
  const r1 = at({ strategy: 'ad', partition: false, skewM2: -4 }, 6).result;
  assert.equal(s.writes[1].accepted, true);
  assert.equal(s.writes[1].v.version, 3, 'DC2 saw DC1\'s v2');
  assert.deepEqual(r1.fields[0].overwritten, ['w1']);
  assert.deepEqual(r1.lost, []);
});

test('writers applies to both AD rounds', () => {
  const p = { strategy: 'ad', skewM2: 0, writers: 'M1' };
  assert.equal(logic.steps(P(p)), 8);
  const s = end(p);
  assert.ok(s.writes.every((w) => w.side === 'M1'));
  assert.equal(s.result.round, 2);
  assert.equal(s.copies.M2.fields.title.value, '@title2');
});

test('rule 7 in order on a slow clock: M2 reads 11 and writes 12, which loses on the stamp: got 11, intended 12', () => {
  const s = end({ inc: true, partition: false });
  assert.deepEqual(s.writes.map((w) => [w.read, w.value]), [[10, 11], [11, 12]]);
  assert.equal(s.result.got, 11);
  assert.equal(s.result.intended, 12);
});

// ── the presets' numbers (task file, SPEC.md) ──

test('presets: steps 8 / 8 / 8 / 12 / 8 and their outcomes', () => {
  assert.equal(logic.steps(P({})), 8);
  assert.equal(logic.steps(P({ skewM2: 0 })), 8);
  assert.equal(logic.steps(P({ strategy: 'vv' })), 8);
  assert.equal(logic.steps(P({ strategy: 'ad', skewM2: 0 })), 12);
  assert.equal(logic.steps(P({ inc: true, skewM2: 0 })), 8);
  assert.equal(end({}).copies.M1.fields.x.value, 20);
  assert.equal(end({ skewM2: 0 }).copies.M1.fields.x.value, 30);
  assert.equal(end({ skewM2: 0 }).copies.M1.fields.x.stamp, 7);
});

test('one write only, or no partition: fewer steps, no conflict', () => {
  assert.equal(logic.steps(P({ writers: 'M1' })), 6);
  assert.equal(logic.steps(P({ partition: false })), 6);
  const s = end({ writers: 'M1' });
  assert.equal(s.result.fields[0].rule, 'single');
  assert.deepEqual(s.result.lost, []);
  assert.deepEqual(vals(s.copies.M2.fields.x), [20]);
  const none = end({ writers: 'none' });
  assert.deepEqual(none.result.fields, []);
});

test('initial replication copies the record to M2 in step 1', () => {
  assert.deepEqual(at({}, 0).copies.M2.fields, {});
  assert.equal(at({}, 1).copies.M2.fields.x.value, 10);
  assert.deepEqual(at({ strategy: 'ad' }, 1).copies.M2.fields.title.value, '@title1');
});

// ── generic checks every sim keeps ──

const VARIANTS = [{}, { skewM2: 0 }, { strategy: 'vv' }, { strategy: 'ad', skewM2: 0 }, { inc: true, skewM2: 0 }, { partition: false },
  { writers: 'M2' }, { strategy: 'ad', partition: false, writers: 'M1' }];

test('state is JSON-safe at every step', () => {
  for (const v of VARIANTS) {
    for (let n = 0; n <= logic.steps(P(v)); n++) {
      const s = at(v, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const v of VARIANTS) {
    const p = P(v);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ strategy: 'vv' });
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps(p); n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('every step records exactly one event, numbered by its step', () => {
  for (const v of VARIANTS) {
    const s = end(v);
    assert.deepEqual(s.events.map((e) => e.step), [...Array(logic.steps(P(v)) + 1).keys()]);
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
