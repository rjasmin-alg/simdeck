// Tests for the proto-simulator's model. Run: node --test kit/
// Copying the template? Keep the generic block at the bottom; replace the rule tests with your model's rules.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../kit.js');
const logic = require('./sim.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);

// ── rules of this model ──

test('counts up by inc from start', () => {
  assert.equal(at({ start: 6 }, 0).value, 6);
  assert.equal(at({ start: 6 }, 2).value, 8);
  assert.equal(at({ start: 0, inc: 3 }, 3).value, 9);
});

test('carry ripple: 0111 + 1 flips the four low bits', () => {
  const s = at({ start: 7 }, 1);
  assert.equal(s.value, 8);
  assert.deepEqual(s.flipped, [0, 1, 2, 3]);
  assert.equal(s.wrapped, false);
});

test('overflow wraps to zero and is flagged', () => {
  const s = at({ start: 15 }, 1);
  assert.equal(s.value, 0);
  assert.equal(s.wrapped, true);
  assert.deepEqual(s.flipped, [0, 1, 2, 3]);
});

test('start is taken modulo 2^bits', () => {
  assert.equal(at({ bits: 3, start: 9 }, 0).value, 1);
});

test('two\'s complement reading', () => {
  assert.equal(logic.signedOf(7, 4), 7);
  assert.equal(logic.signedOf(8, 4), -8);
  assert.equal(logic.signedOf(15, 4), -1);
  assert.deepEqual(logic.bitsOf(6, 4), [0, 1, 1, 0]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (let n = 0; n <= logic.steps; n++) {
    const s = at({ bits: 5, start: 27, inc: 3 }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ bits: 6, start: 50, inc: 2 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ start: 7 });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
