// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for diffie-hellman's model (SPEC.md). Run: node --test sims/diffie-hellman/
// Tie-breaks first, then one test per rule, the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const stepsOf = (over) => kit.stepsOf(logic, P(over));
const phaseStep = (over, phase) => logic.phasesOf(P(over)).indexOf(phase) + 1;
const atPhase = (over, phase) => at(over, phaseStep(over, phase));
const last = (over) => at(over, stepsOf(over));
const all = (over) => Array.from({ length: stepsOf(over) + 1 }, (_, n) => at(over, n));
const MALLORY = { mallory: true };

// Every (p, g, a, b) the page can set: the sweep for the invariants.
function* sweep(stride) {
  for (const p of logic.primes) {
    for (const g of logic.gens) {
      for (let a = 2; a <= p - 2; a += stride) {
        for (let b = 2; b <= p - 2; b += stride) yield { p, g, a, b };
      }
    }
  }
}

// ── tie-breaks ──

test('tie-break: a = b still works, A = B and both sides hold the same s', () => {
  for (const over of [{ a: 7, b: 7 }, { p: 97, a: 50, b: 50 }, { g: 2, a: 3, b: 3 }]) {
    const s = last(over);
    assert.equal(s.alice.sent.num, s.bob.sent.num);
    assert.equal(s.alice.shared.num, s.bob.shared.num);
    assert.equal(s.compare.equal, true);
  }
});

test('tie-break: Eve\'s product equals s by coincidence when a + b ≡ ab (mod ord g), and the model says so', () => {
  const s = last({ a: 2, b: 2 });
  assert.equal(s.eve.product.num, 4);
  assert.equal(s.alice.shared.num, 4);
  assert.equal(s.eve.product.equalsS, true);
  assert.equal(s.eve.product.paintEqualsS, false, 'paint never coincides: two units of yellow against one');
  assert.equal(last({}).eve.product.equalsS, false);
});

test('tie-break: Eve\'s first x may differ from a when g is not a generator, and still gives s', () => {
  const s = last({ g: 2, a: 15 });
  assert.equal(s.eve.order, 11);
  assert.equal(s.eve.search.x, 4);
  assert.equal(s.eve.search.isA, false);
  assert.equal(s.eve.search.s, s.alice.shared.num);
  const bad = last({ g: 22 });
  assert.equal(bad.eve.search.x, 2);
  assert.equal(bad.eve.search.isA, false);
  assert.equal(bad.eve.search.s, bad.alice.shared.num);
});

test('tie-break: with Mallory and a = b, Alice and Bob hold the same number by chance; the paints still differ', () => {
  const s = last({ mallory: true, a: 9, b: 9 });
  assert.equal(s.compare.equalNum, true);
  assert.equal(s.compare.equalPaint, false);
  assert.equal(s.compare.equal, false);
  assert.equal(s.mallory.aliceSide.num, s.alice.shared.num, 'Mallory still holds that key');
});

// ── rule 1: public values and the halves ──

test('rule 1: A = g^a mod p and B = g^b mod p', () => {
  for (const q of sweep(7)) {
    const s = atPhase(q, 'bobCompute');
    assert.equal(s.alice.sent.num, logic.powMod(q.g, q.a, q.p), JSON.stringify(q));
    assert.equal(s.bob.sent.num, logic.powMod(q.g, q.b, q.p), JSON.stringify(q));
  }
  assert.equal(logic.powMod(5, 6, 23), 8);
  assert.equal(logic.powMod(19, 6, 23), 2);
  assert.equal(logic.powMod(7, 0, 23), 1);
});

test('rule 1: p and g are agreed in the open at step 1, before anything else, and Eve copies them', () => {
  const s = at({}, 1);
  assert.equal(s.phase, 'agree');
  assert.deepEqual([s.pub.p, s.pub.g], [23, 5]);
  assert.ok(s.known.alice.includes('pub') && s.known.bob.includes('pub'));
  assert.deepEqual(s.eve.seen, ['pub']);
  assert.deepEqual(at({}, 0).eve.seen, []);
  assert.deepEqual(at({}, 0).known, { alice: [], bob: [], mid: [] });
});

// ── rule 2: the shared secret ──

test('rule 2: B^a mod p = A^b mod p = g^(ab) mod p for every p, g, a, b the page can set', () => {
  for (const q of sweep(3)) {
    const s = last(q);
    const want = logic.powMod(q.g, q.a * q.b, q.p);
    assert.equal(s.alice.shared.num, want, JSON.stringify(q));
    assert.equal(s.bob.shared.num, want, JSON.stringify(q));
    assert.equal(s.compare.equal, true);
  }
});

test('rule 2: each side uses what arrived and its own secret, in that order of steps', () => {
  const ph = logic.phasesOf(P({}));
  assert.ok(ph.indexOf('sendB') < ph.indexOf('aliceShared'), 'Alice needs B first');
  assert.ok(ph.indexOf('sendA') < ph.indexOf('bobShared'), 'Bob needs A first');
  const s = atPhase({}, 'aliceShared');
  assert.equal(s.alice.shared.num, logic.powMod(s.alice.received.num, 6, 23));
  assert.equal(s.bob.shared, null, 'Bob has not computed yet');
});

// ── rule 3: what crosses ──

test('rule 3: only p, g, A and B cross; a, b and s never do; Eve sees exactly those four', () => {
  for (const q of [{}, { a: 4, b: 3 }, { p: 97, a: 36, b: 58 }, { g: 22 }]) {
    const states = all(q);
    const onWire = states.map((s) => s.wire && s.wire.what).filter(Boolean);
    assert.deepEqual(onWire, ['pub', 'A', 'B']);
    assert.deepEqual(last(q).eve.seen, ['pub', 'A', 'B']);
  }
});

test('rule 3: a side only ever knows its own secret; what arrived is exactly the other side\'s half', () => {
  const s = last({});
  assert.equal(s.alice.secret.num, 6);
  assert.equal(s.bob.secret.num, 15);
  assert.deepEqual(s.alice.received, s.bob.sent);
  assert.deepEqual(s.bob.received, s.alice.sent);
  for (const st of all({})) {
    assert.ok(!st.known.alice.includes('theirs') || st.alice.received !== null);
    for (const who of ['alice', 'bob']) {
      for (const slot of st.known[who]) assert.ok(['pub', 'secret', 'mine', 'theirs', 'shared'].includes(slot));
    }
    assert.ok(st.known.mid.every((x) => ['product', 'search'].includes(x)), 'Eve computes, she never receives a secret');
  }
});

// ── rule 4: Eve's shortcut ──

test('rule 4: Eve\'s product A·B mod p = g^(a+b) mod p, and it is not s in the textbook case', () => {
  for (const q of sweep(5)) {
    const s = last(q);
    assert.equal(s.eve.product.num, (s.alice.sent.num * s.bob.sent.num) % q.p);
    assert.equal(s.eve.product.num, logic.powMod(q.g, q.a + q.b, q.p), JSON.stringify(q));
    assert.equal(s.eve.product.equalsS, s.eve.product.num === s.alice.shared.num);
  }
  const t = last({});
  assert.equal(t.eve.product.num, 14);
  assert.notEqual(t.eve.product.num, t.alice.shared.num);
});

// ── rule 5: Eve's search ──

test('rule 5: Eve tries x = 1 … p−2; the first x with g^x = A, its count, the space, and B^x = s', () => {
  for (const q of sweep(5)) {
    const s = last(q), se = s.eve.search;
    assert.equal(se.space, q.p - 2);
    assert.ok(se.x >= 1 && se.x <= se.space, JSON.stringify(q));
    assert.equal(logic.powMod(q.g, se.x, q.p), s.alice.sent.num);
    for (let y = 1; y < se.x; y++) assert.notEqual(logic.powMod(q.g, y, q.p), s.alice.sent.num, 'first hit');
    assert.equal(se.tries, se.x);
    assert.equal(se.s, s.alice.shared.num, 'the x she found gives the same s');
  }
  assert.equal(logic.discreteLog(5, 8, 23).tries, 6);
  assert.equal(logic.discreteLog(5, 50, 97).tries, 36);
  assert.equal(logic.discreteLog(22, 5, 23).x, null, '5 is not a power of 22 mod 23');
});

test('rule 5: the search space grows with p', () => {
  assert.equal(last({ p: 23 }).eve.search.space, 21);
  assert.equal(last({ p: 97, a: 36, b: 58 }).eve.search.space, 95);
});

// ── rule 6: paint ──

test('rule 6: mixing is commutative; both sides end with yellow + red + teal, Eve with 2 × yellow + red + teal', () => {
  const s = last({ mode: 'paint' });
  assert.deepEqual(s.alice.sent.paint, { Y: 1, R: 1 });
  assert.deepEqual(s.bob.sent.paint, { Y: 1, T: 1 });
  assert.deepEqual(s.alice.shared.paint, { Y: 1, R: 1, T: 1 });
  assert.deepEqual(s.bob.shared.paint, { Y: 1, R: 1, T: 1 });
  assert.deepEqual(s.eve.product.paint, { Y: 2, R: 1, T: 1 });
  assert.equal(s.eve.product.paintEqualsS, false);
  assert.deepEqual(logic.mix({ T: 1 }, { Y: 1, R: 1 }), logic.mix({ Y: 1, R: 1 }, { T: 1 }));
  assert.deepEqual(Object.keys(logic.mix({ V: 1 }, { T: 1 }, { Y: 1 })), ['Y', 'T', 'V'], 'one key order');
  assert.ok(logic.samePaint({ R: 1, Y: 1 }, { Y: 1, R: 1 }));
});

test('rule 6: the paint does not depend on the numbers', () => {
  assert.deepEqual(last({ p: 97, a: 40, b: 3 }).alice.shared.paint, last({}).alice.shared.paint);
});

// ── rule 7: a bad g ──

test('rule 7: g = p − 1 has order 2, so A, B ∈ {1, p−1} and s has two possible values', () => {
  assert.equal(logic.order(22, 23), 2);
  for (let a = 2; a <= 21; a++) {
    for (let b = 2; b <= 21; b++) {
      const s = last({ g: 22, a, b });
      assert.ok([1, 22].includes(s.alice.sent.num) && [1, 22].includes(s.bob.sent.num));
      assert.ok([1, 22].includes(s.alice.shared.num));
      assert.equal(s.eve.order, 2);
    }
  }
  assert.deepEqual([logic.order(5, 23), logic.order(2, 23), logic.order(5, 97), logic.order(2, 97), logic.order(22, 97)], [22, 11, 96, 48, 4]);
});

// ── rule 8: Mallory ──

test('rule 8: Mallory catches A and B, sends M = g^m to both; each side shares a different key with her', () => {
  const s = last(MALLORY);
  assert.equal(s.mallory.M.num, 10);
  assert.equal(s.alice.received.num, 10);
  assert.equal(s.bob.received.num, 10);
  assert.equal(s.alice.shared.num, 6);
  assert.equal(s.bob.shared.num, 5);
  assert.equal(s.mallory.aliceSide.num, s.alice.shared.num, 'A^m = M^a');
  assert.equal(s.mallory.bobSide.num, s.bob.shared.num, 'B^m = M^b');
  assert.equal(s.compare.equal, false);
  assert.deepEqual(s.mallory.caught, ['A', 'B']);
});

test('rule 8: A and B never reach the other side; both sides "succeed" (they computed a key)', () => {
  for (const q of sweep(9)) {
    const s = last(Object.assign({ mallory: true }, q));
    assert.deepEqual(s.bob.received, s.mallory.M);
    assert.deepEqual(s.alice.received, s.mallory.M);
    assert.equal(s.mallory.aliceSide.num, s.alice.shared.num, JSON.stringify(q));
    assert.equal(s.mallory.bobSide.num, s.bob.shared.num, JSON.stringify(q));
    assert.ok(s.alice.shared !== null && s.bob.shared !== null);
  }
  const wires = all(MALLORY).map((s) => s.wire).filter(Boolean);
  assert.deepEqual(wires.map((w) => [w.what, w.from, w.to, w.caughtBy]), [
    ['pub', 'alice', 'bob', null], ['A', 'alice', 'bob', 'mallory'], ['M', 'mallory', 'bob', null],
    ['B', 'bob', 'alice', 'mallory'], ['M', 'mallory', 'alice', null]]);
});

test('rule 8: paint with Mallory: yellow + violet + red against yellow + violet + teal', () => {
  const s = last({ mallory: true, mode: 'paint' });
  assert.deepEqual(s.alice.shared.paint, { Y: 1, R: 1, V: 1 });
  assert.deepEqual(s.bob.shared.paint, { Y: 1, T: 1, V: 1 });
  assert.deepEqual(s.mallory.aliceSide.paint, s.alice.shared.paint);
  assert.deepEqual(s.mallory.bobSide.paint, s.bob.shared.paint);
});

test('rule 5: the boundary a = p − 2 is found on the last try', () => {
  const s = last({ a: 21 });
  assert.equal(s.eve.search.x, 21);
  assert.equal(s.eve.search.tries, s.eve.search.space);
});

test('rule 8: Mallory is active only with the toggle; a caught A reaches nobody', () => {
  assert.equal(at({}, 0).mallory.active, false);
  assert.equal(at(MALLORY, 0).mallory.active, true);
  const c = atPhase(MALLORY, 'catchA');
  assert.equal(c.bob.received, null);
  assert.ok(!c.known.bob.includes('theirs'));
  assert.equal(atPhase(MALLORY, 'catchB').alice.received, null);
});

test('log: one entry per step, the phase names in order', () => {
  assert.deepEqual(last({}).log, logic.PHASES.honest);
  assert.deepEqual(last(MALLORY).log, logic.PHASES.mallory);
  assert.deepEqual(at({}, 0).log, []);
});

// ── steps, presets, params ──

test('steps: 11 honest, 13 with Mallory, in the SPEC order', () => {
  assert.equal(stepsOf({}), 11);
  assert.equal(stepsOf(MALLORY), 13);
  assert.deepEqual(all({}).slice(1).map((s) => s.phase), ['agree', 'alicePick', 'bobPick', 'aliceCompute', 'bobCompute',
    'sendA', 'sendB', 'aliceShared', 'bobShared', 'compare', 'eveView']);
  assert.deepEqual(all(MALLORY).slice(1).map((s) => s.phase), ['agree', 'alicePick', 'bobPick', 'aliceCompute', 'bobCompute',
    'catchA', 'forgeToBob', 'catchB', 'forgeToAlice', 'aliceShared', 'bobShared', 'compare', 'malloryView']);
});

test('changed: each step marks exactly the cards it filled', () => {
  const ch = all({}).slice(1).map((s) => s.changed);
  assert.deepEqual(ch, [['alice-pub', 'bob-pub', 'eve-pub'], ['alice-secret'], ['bob-secret'], ['alice-mine'], ['bob-mine'],
    ['bob-theirs', 'eve-A'], ['alice-theirs', 'eve-B'], ['alice-shared'], ['bob-shared'], ['alice-shared', 'bob-shared'],
    ['mid-product', 'mid-search']]);
  const cm = all(MALLORY).slice(1).map((s) => s.changed);
  assert.deepEqual(cm.slice(5), [['eve-A'], ['mid-m', 'mid-M', 'bob-theirs'], ['eve-B'], ['alice-theirs'], ['alice-shared'],
    ['bob-shared'], ['alice-shared', 'bob-shared'], ['mid-aliceSide', 'mid-bobSide']]);
});

test('presets: every number in SPEC.md', () => {
  const nums = (s) => [s.alice.sent.num, s.bob.sent.num, s.alice.shared.num, s.bob.shared.num, s.eve.product.num, s.eve.search.tries, s.eve.order];
  assert.deepEqual(nums(last({ p: 23, g: 5, a: 6, b: 15 })), [8, 19, 2, 2, 14, 6, 22], 'textbook');
  assert.deepEqual(nums(last({ p: 23, g: 5, a: 4, b: 3 })), [4, 10, 18, 18, 17, 4, 22], 'small-a');
  assert.deepEqual(nums(last({ p: 23, g: 22 })), [1, 22, 1, 1, 22, 2, 2], 'bad-g');
  assert.deepEqual(nums(last({ p: 97, g: 5, a: 36, b: 58 })), [50, 44, 75, 75, 66, 36, 96], 'bigger');
  const m = last({ p: 23, g: 5, a: 6, b: 15, mallory: true });
  assert.deepEqual([m.mallory.M.num, m.alice.shared.num, m.bob.shared.num, m.mallory.aliceSide.num, m.mallory.bobSide.num], [10, 6, 5, 6, 5], 'mallory');
});

test('params: a and b clamped to 2 … p−2 and rounded; unknown p or g fall back to the defaults', () => {
  assert.deepEqual(logic.norm(P({ a: 36, p: 23 })).a, 21);
  assert.deepEqual(logic.norm(P({ a: 1 })).a, 2);
  assert.deepEqual(logic.norm(P({ b: 6.4 })).b, 6);
  assert.deepEqual(logic.norm(P({ b: 6.6 })).b, 7, 'rounded, not floored');
  assert.deepEqual(logic.norm(P({ p: 50, g: 7 })), { p: 23, g: 5, a: 6, b: 15, mallory: false });
});

test('mode (numbers, both, paint) does not change the model', () => {
  assert.deepEqual(last({ mode: 'paint' }), last({}));
  assert.deepEqual(last({ mode: 'numbers' }), last({}));
});

// ── generic checks every sim keeps ──

const RUNS = [{}, MALLORY, { mode: 'paint' }, { p: 97, g: 2, a: 40, b: 77 }, { g: 22, a: 2, b: 2, mallory: true }];

test('state is JSON-safe at every step', () => {
  for (const over of RUNS) {
    for (let n = 0; n <= stepsOf(over); n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of RUNS) {
    const p = P(over), N = stepsOf(over);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= N; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = N; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const over of [{}, MALLORY]) {
    const p = P(over);
    let s = logic.initial(p);
    for (let n = 1; n <= stepsOf(over); n++) {
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

test('strings.js: no key is written twice in a table (a later one would silently win)', () => {
  const src = require('node:fs').readFileSync(require('node:path').join(__dirname, 'strings.js'), 'utf8');
  const tables = src.split(/\n    (?:hr|en): \{/).slice(1);
  assert.equal(tables.length, 2);
  for (const tb of tables) {
    const keys = [...tb.matchAll(/^      (\w+):/gm)].map((m) => m[1]);
    assert.deepEqual(keys.filter((k, i) => keys.indexOf(k) !== i), []);
  }
});

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, stepsOf({}), 'meta.steps matches the model at the defaults');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
