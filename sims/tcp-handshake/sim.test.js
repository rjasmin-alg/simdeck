// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for tcp-handshake's model. Run: node --test sims/tcp-handshake/
// Numbers from the URM book, ch. 13 (13-transportni-sloj.md), Primjer 3 (X = 4000, Y = 9500), the fragment's
// exercises (trostruko-rukovanje.html: X = 100, Y = 500) and the chapter's capture (2762080915, 2945746186).
// Edges and tie-breaks first, then the rules, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const wire = (s) => s.segs.map((g) => [g.from + '>' + g.to, g.flags.join('+'), g.seq, g.ack]);

// ── edges and tie-breaks ──

test('32 bits: X = 2^32 - 1 makes the acknowledgment 0, not 2^32', () => {
  const s = at({ isn: 'wrap' }, 3);
  assert.equal(s.x, 4294967295);
  assert.equal(s.segs[1].ack, 0);
  assert.equal(s.segs[2].seq, 0);
  assert.equal(s.B.rcvNxt, 0);
  assert.equal(s.A.sndNxt, 0);
  assert.equal(s.wrapsX, true);
  assert.equal(s.wrapsY, false);
  assert.equal(s.established, true);
});

test('seqAdd works modulo 2^32 both ways and leaves smaller numbers alone', () => {
  assert.equal(logic.seqAdd(4294967295, 1), 0);
  assert.equal(logic.seqAdd(4294967295, 2), 1);
  assert.equal(logic.seqAdd(0, -1), 4294967295);
  assert.equal(logic.seqAdd(4000, 1), 4001);
  assert.equal(logic.seqAdd(4294967296, 0), 0);
});

test('equal ISNs (X = Y) still give each side its own numbers and the same rule', () => {
  const s = at({ x: 4000, y: 4000 }, 3);
  assert.deepEqual(wire(s), [['A>B', 'SYN', 4000, null], ['B>A', 'SYN+ACK', 4000, 4001], ['A>B', 'ACK', 4001, 4001]]);
  assert.equal(s.A.rcvNxt, 4001);
  assert.equal(s.B.rcvNxt, 4001);
  assert.equal(s.established, true);
});

test('X = 0 and Y = 0 are valid ISNs (the slider\'s lower end)', () => {
  const s = at({ x: 0, y: 0 }, 3);
  assert.deepEqual(wire(s), [['A>B', 'SYN', 0, null], ['B>A', 'SYN+ACK', 0, 1], ['A>B', 'ACK', 1, 1]]);
});

test('the named pairs override the sliders; an own value out of range is taken modulo 2^32', () => {
  assert.deepEqual(logic.isns(P({ isn: 'real', x: 1, y: 2 })), { x: 2762080915, y: 2945746186 });
  assert.deepEqual(logic.isns(P({ isn: 'wrap', x: 1, y: 2 })), { x: 4294967295, y: 9500 });
  assert.deepEqual(logic.isns(P({ isn: 'own', x: 4294967297, y: -1 })), { x: 1, y: 4294967295 });
});

test('an ACK for a number the receiver never sent does not confirm its ISN', () => {
  const segs = logic.segments(4000, 9500);
  const bad = [segs[0], Object.assign({}, segs[1], { ack: 4000 }), Object.assign({}, segs[2], { ack: 9500 })];
  const s = logic.sides(4000, 9500, bad, 3);
  assert.equal(s.A.acked, false);
  assert.equal(s.B.acked, false);
});

// ── rules ──

test('the book\'s example: SYN 4000; SYN+ACK 9500 / 4001; ACK 9501 (URM ch. 13, Primjer 3)', () => {
  const s = at({}, 3);
  assert.deepEqual(wire(s), [['A>B', 'SYN', 4000, null], ['B>A', 'SYN+ACK', 9500, 4001], ['A>B', 'ACK', 4001, 9501]]);
});

test('the fragment\'s exercise 1: X = 100, Y = 500 gives acknowledgments 101 and 501', () => {
  const s = at({ x: 100, y: 500 }, 3);
  assert.equal(s.segs[1].ack, 101);
  assert.equal(s.segs[2].ack, 501);
});

test('the capture\'s numbers: every acknowledgment is one more than the number it acknowledges', () => {
  const s = at({ isn: 'real' }, 3);
  assert.equal(s.segs[1].ack, 2762080916);
  assert.equal(s.segs[2].ack, 2945746187);
});

test('three messages carry four conceptual steps; steps 2 and 3 travel together in the SYN+ACK', () => {
  const segs = logic.segments(4000, 9500);
  assert.equal(segs.length, 3);
  assert.equal(logic.steps, 3);
  assert.deepEqual(segs.map((g) => g.concept), [[1], [2, 3], [4]]);
  assert.deepEqual(segs[1].flags, ['SYN', 'ACK']);
});

test('a SYN occupies one sequence number, a pure ACK none', () => {
  const segs = logic.segments(4000, 9500);
  assert.deepEqual(segs.map(logic.seqLen), [1, 1, 0]);
});

test('each side, step by step: what it sends next, what it expects, whether it is confirmed', () => {
  const side = (s) => ['A', 'B'].map((k) => [s[k].sndNxt, s[k].rcvNxt, s[k].acked]);
  assert.deepEqual(side(at({}, 0)), [[4000, null, false], [9500, null, false]]);
  // after the SYN: A has used X; B expects X+1
  assert.deepEqual(side(at({}, 1)), [[4001, null, false], [9500, 4001, false]]);
  // after the SYN+ACK: B has used Y; A expects Y+1 and knows B has its X
  assert.deepEqual(side(at({}, 2)), [[4001, 9501, true], [9501, 4001, false]]);
  // after the ACK: nothing new is used (the ACK takes no number); B knows A has its Y
  assert.deepEqual(side(at({}, 3)), [[4001, 9501, true], [9501, 4001, true]]);
});

test('the connection is established only after the third message', () => {
  assert.deepEqual([0, 1, 2, 3].map((n) => at({}, n).established), [false, false, false, true]);
});

test('the closing ACK carries seq X+1, the number B waits for (A\'s first data octet)', () => {
  for (const x of [0, 4000, 9999, 4294967295]) {
    const s = at({ isn: 'own', x }, 3);
    assert.equal(s.segs[2].seq, s.B.rcvNxt);
    assert.equal(s.segs[2].seq, logic.seqAdd(s.x, 1));
  }
});

test('the default is the book\'s example', () => {
  assert.deepEqual(logic.defaults, { isn: 'own', x: 4000, y: 9500 });
  assert.equal(logic.min, 0);
  assert.equal(logic.max, 9999);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const isn of logic.isnModes) {
    for (let n = 0; n <= logic.steps; n++) {
      const s = at({ isn, x: 123, y: 9876 }, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ x: 777, y: 31 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({});
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const sets = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(sets.length >= 6, 'found the presets');
  for (const body of sets) {
    for (const k of [...body.matchAll(/(\w+):/g)].map((m) => m[1])) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    const isn = body.match(/isn:\s*'(\w+)'/);
    assert.ok(isn && logic.isnModes.includes(isn[1]), 'preset isn is a mode');
    for (const m of body.matchAll(/\b([xy]):\s*(\d+)/g)) {
      const v = Number(m[2]);
      assert.ok(v >= logic.min && v <= logic.max, `preset ${m[1]} = ${v} is within the slider`);
    }
  }
});
