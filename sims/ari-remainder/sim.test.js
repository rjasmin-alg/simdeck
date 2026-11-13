// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ari-remainder's model (SPEC.md). Run: node --test sims/ari-remainder/
// Tie-breaks first, then the rules, the presets' expected numbers (from the independent script), the generic block.
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
const run = (over) => { const out = []; for (let i = 0; i <= stepsOf(over); i++) out.push(at(over, i)); return out; };

// ── tie-breaks ──

test('rule 2: exactly d left is enough for one more round (24 : 4 leaves 0)', () => {
  assert.equal(logic.canDeal(4, 4), true);
  assert.equal(logic.canDeal(3, 4), false);
  const D = logic.dealOf(P({ n: 24, d: 4 }));
  assert.deepEqual([D.q, D.r], [6, 0]);
  assert.deepEqual(D.piles, [24, 20, 16, 12, 8, 4, 0]);
  assert.deepEqual(at({ n: 24, d: 4 }, 6), { phase: 'round', k: 6, pile: 0 });
  assert.equal(at({ n: 24, d: 4 }, 7).phase, 'short');
});

test('rule 5 tie: a remainder equal to the divisor is too big (24 : 4 = 5, ostatak 4)', () => {
  const m = logic.mistakeOf(P({ n: 24, d: 4 }));
  assert.deepEqual([m.q, m.r], [5, 4]);
  assert.equal(m.check.equal, true);
  assert.equal(m.check.less, false);
  assert.equal(m.check.ok, false);
});

test('rule 3: fewer sweets than children deals no round (3 : 5 = 0, ostatak 3)', () => {
  const D = logic.dealOf(P({ n: 3, d: 5 }));
  assert.deepEqual([D.q, D.r], [0, 3]);
  assert.equal(stepsOf({ n: 3, d: 5 }), 2);
  assert.deepEqual(at({ n: 3, d: 5 }, 1), { phase: 'short', k: 0, pile: 3 });
  assert.deepEqual(at({ n: 3, d: 5 }, 2), { phase: 'check', k: 0, pile: 3 });
  assert.equal(logic.mistakeOf(P({ n: 3, d: 5 })), null);
});

// ── rules ──

test('rule 1: a round takes d from the bowl, once per step', () => {
  const s = run({ n: 23, d: 4 });
  assert.deepEqual(s.map((x) => x.pile), [23, 19, 15, 11, 7, 3, 3, 3]);
  assert.deepEqual(s.map((x) => x.k), [0, 1, 2, 3, 4, 5, 5, 5]);
  assert.deepEqual(s.map((x) => x.phase), ['start', 'round', 'round', 'round', 'round', 'round', 'short', 'check']);
});

test('rule 3: the remainder is less than the divisor and the quotient is the rounds, for every allowed pair', () => {
  let most = 0, pairs = 0;
  for (let d = logic.MIN_D; d <= logic.MAX_D; d++) {
    for (let n = 1; n <= logic.maxN(d); n++) {
      const D = logic.dealOf({ n, d });
      assert.ok(D.r < D.d, `${n} : ${d}`);
      assert.equal(D.q * d + D.r, n);
      assert.equal(D.q, Math.floor(n / d));
      const last = at({ n, d }, stepsOf({ n, d }));
      assert.deepEqual(last, { phase: 'check', k: D.q, pile: D.r });
      most = Math.max(most, stepsOf({ n, d }));
      pairs++;
    }
  }
  assert.equal(pairs, 762);
  assert.equal(most, 20, 'a stepper has at most 20 steps');
});

test('rule 4: the check needs both parts', () => {
  assert.deepEqual(logic.checkOf(23, 4, 5, 3), { back: 23, equal: true, less: true, ok: true });
  assert.deepEqual(logic.checkOf(23, 4, 4, 7), { back: 23, equal: true, less: false, ok: false });
  assert.deepEqual(logic.checkOf(23, 4, 5, 2), { back: 22, equal: false, less: true, ok: false });
});

test('rule 5: the typical mistake stops one round early; one more round was possible', () => {
  const m = logic.mistakeOf(P({ n: 31, d: 4 }));
  assert.deepEqual([m.q, m.r, m.oneMore], [6, 7, 3]);
  // one round dealt: stopping early means stopping before the first round
  const one = logic.mistakeOf(P({ n: 6, d: 5 }));
  assert.deepEqual([one.q, one.r, one.oneMore, one.check.equal, one.check.less], [0, 6, 1, true, false]);
  const four = logic.mistakeOf(P({ n: 4, d: 4 }));
  assert.deepEqual([four.q, four.r, four.oneMore], [0, 4, 0]);
  assert.deepEqual(m.check, { back: 31, equal: true, less: false, ok: false });
});

test('limits: n up to 100 and 18 rounds; d 2 … 10; bad values clamped', () => {
  assert.deepEqual([2, 3, 4, 5, 6, 10].map(logic.maxN), [37, 56, 75, 94, 100, 100]);
  assert.deepEqual(logic.numbersOf({ n: 100, d: 2 }), { n: 37, d: 2 });
  assert.deepEqual(logic.numbersOf({ n: 0, d: 1 }), { n: 1, d: 2 });
  assert.deepEqual(logic.numbersOf({ n: 'x', d: Infinity }), { n: 1, d: 2 });
  assert.deepEqual(logic.numbersOf({ n: 50.7, d: 12 }), { n: 51, d: 10 });
  assert.deepEqual(logic.numbersOf({ n: 50, d: 2.6 }), { n: 50, d: 3 }, 'd rounded as the kit does, before n is limited');
  // out-of-range params reach steps and initial through the same limits
  assert.equal(logic.steps({ n: 100, d: 2, mistake: false }), 20);
  assert.equal(logic.initial({ n: 999, d: 2 }).pile, 37);
  assert.equal(at({ n: 999, d: 1 }, 20).phase, 'check');
});

// ── presets (SPEC.md table) ──

test('presets give the expected numbers', () => {
  const want = {
    sweets: [5, 3, 7, [23, 19, 15, 11, 7, 3]],
    exact: [6, 0, 8, [24, 20, 16, 12, 8, 4, 0]],
    fewer: [0, 3, 2, [3]],
    largest: [7, 5, 9, [47, 41, 35, 29, 23, 17, 11, 5]],
    'too-big': [7, 3, 9, [31, 27, 23, 19, 15, 11, 7, 3]],
    hundred: [14, 2, 16, [100, 93, 86, 79, 72, 65, 58, 51, 44, 37, 30, 23, 16, 9, 2]]
  };
  assert.deepEqual(logic.PRESETS.map((p) => p.id), Object.keys(want));
  for (const pr of logic.PRESETS) {
    const D = logic.dealOf(P(pr.params));
    const [q, r, steps, piles] = want[pr.id];
    assert.deepEqual([D.q, D.r, stepsOf(pr.params), D.piles], [q, r, steps, piles], pr.id);
  }
  const m = logic.mistakeOf(P({ n: 100, d: 7 }));
  assert.deepEqual([m.q, m.r], [13, 9]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const s of run({ n: 47, d: 6 })) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ n: 100, d: 7 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  const steps = logic.steps(p);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ n: 9, d: 4 });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('the page and sim.json agree with the model (steps of the default, preset params)', () => {
  const fs = require('node:fs'), path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps is the default demo');
  assert.equal(json.steps, meta.steps);
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
  for (const e of json.entries || []) assert.ok(logic.PRESETS.some((pr) => pr.id === e.preset), e.preset);
});
