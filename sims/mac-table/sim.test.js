// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for mac-table's model. Run: node --test sims/mac-table/
// Numbers from the URM book, ch. 7 (07-podatkovni-sloj.md): the self-learning paragraph of "Ethernet u preklopljenoj
// mreži" (A on 1, B on 2, empty table), Primjer 2 (A, B, C on 1, 2, 3; the table knows C on 3; A sends to B), and the
// fragment's exercises (tablica-mac-adresa.html).
// Tie-breaks and edges first, then the book's numbers, then the steps, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const rows = (s) => s.table.map((r) => `${r.mac}${r.port}@${r.time}`);
const EMPTY = { knowA: false, knowB: false, knowC: false };

// ── tie-breaks and edges ──

test('tie-break: learning an address already in the table updates that row in place, never adds a second', () => {
  const t0 = [{ mac: 'C', port: 3, time: 0 }, { mac: 'A', port: 1, time: 1 }];
  assert.deepEqual(logic.learn(t0, 'A', 1, 3), [{ mac: 'C', port: 3, time: 0 }, { mac: 'A', port: 1, time: 3 }]);
  // a moved host: the same row takes the new port, still one row, still in its place
  assert.deepEqual(logic.learn(t0, 'C', 2, 4), [{ mac: 'C', port: 2, time: 4 }, { mac: 'A', port: 1, time: 1 }]);
  assert.equal(t0[1].time, 1, 'learn does not mutate its input');
});

test('tie-break: a new address goes to the end of the table (rows keep the order they were learned in)', () => {
  assert.deepEqual(logic.learn([{ mac: 'C', port: 3, time: 0 }], 'A', 1, 1).map((r) => r.mac), ['C', 'A']);
  assert.deepEqual(rows(at({ knowA: true, knowC: true, pair: 'C-B' }, 4)), ['A1@0', 'C3@1', 'B2@2']);
});

test('the table learns the SOURCE only: the destination is never written by the frame that goes to it', () => {
  const s = at(EMPTY, 2); // A has sent to B, and the switch has decided
  assert.deepEqual(rows(s), ['A1@1']);
  assert.equal(logic.lookup(s.table, 'B'), null);
});

test('the decision looks at the destination only: other rows change nothing', () => {
  const ports = logic.ports;
  assert.deepEqual(logic.decide([], 'B', 1, ports), { action: 'flood', out: [2, 3] });
  assert.deepEqual(logic.decide([{ mac: 'C', port: 3, time: 0 }], 'B', 1, ports), { action: 'flood', out: [2, 3] });
  assert.deepEqual(logic.decide([{ mac: 'A', port: 1, time: 0 }, { mac: 'C', port: 3, time: 0 }], 'B', 1, ports),
    { action: 'flood', out: [2, 3] });
  assert.deepEqual(logic.decide([{ mac: 'B', port: 2, time: 0 }], 'B', 1, ports), { action: 'forward', out: [2] });
});

test('flooding goes to every port except the incoming one, in port order', () => {
  assert.deepEqual(logic.decide([], 'A', 2, logic.ports).out, [1, 3]);
  assert.deepEqual(logic.decide([], 'A', 3, logic.ports).out, [1, 2]);
  assert.deepEqual(logic.decide([], 'X', 2, [4, 1, 2, 3]).out, [4, 1, 3]);
});

test('every conversation pair has a distinct sender and receiver, and the reply reverses it', () => {
  for (const pair of logic.pairs) {
    const f = logic.frames(pair);
    assert.notEqual(f[0].src, f[0].dst);
    assert.deepEqual(f[1], { src: f[0].dst, dst: f[0].src });
    assert.deepEqual(f[2], f[0]);
  }
  assert.equal(new Set(logic.pairs).size, 6);
});

test('the third frame is never flooded: the reply has taught the switch where the receiver is', () => {
  for (const pair of logic.pairs) for (let m = 0; m < 8; m++) {
    const s = at({ pair, knowA: !!(m & 1), knowB: !!(m & 2), knowC: !!(m & 4) }, 6);
    assert.equal(s.action, 'forward', `${pair} ${m}`);
  }
});

test('the table never holds two rows for one address and never more rows than hosts', () => {
  for (const pair of logic.pairs) for (let m = 0; m < 8; m++) for (let n = 0; n <= logic.steps; n++) {
    const s = at({ pair, knowA: !!(m & 1), knowB: !!(m & 2), knowC: !!(m & 4) }, n);
    const macs = s.table.map((r) => r.mac);
    assert.equal(new Set(macs).size, macs.length);
    for (const r of s.table) assert.equal(r.port, logic.port[r.mac], 'hosts do not move here');
  }
});

// ── the book's numbers ──

test('chapter 7 paragraph: empty table, A on 1 sends to B on 2: A learned and flooded; the reply goes to port 1 only', () => {
  const s1 = at(EMPTY, 1);
  assert.equal(s1.learned, 'new');
  assert.deepEqual(rows(s1), ['A1@1']);
  const s2 = at(EMPTY, 2);
  assert.equal(s2.action, 'flood');
  assert.deepEqual(s2.out, [2, 3]);
  const s3 = at(EMPTY, 3);
  assert.deepEqual(rows(s3), ['A1@1', 'B2@2']);
  const s4 = at(EMPTY, 4);
  assert.deepEqual([s4.action, s4.out], ['forward', [1]]);
});

test('Primjer 2: the table knows C on 3; A sends to B; the copy reaches ports 2 and 3, so C sees it', () => {
  assert.deepEqual(rows(at({}, 0)), ['C3@0']);
  const s = at({}, 2);
  assert.equal(s.src, 'A');
  assert.equal(s.inPort, 1);
  assert.equal(s.action, 'flood');
  assert.deepEqual(s.out, [2, 3]);
  assert.ok(logic.lookup(s.table, 'C'), 'C was known and it did not help');
});

test('fragment exercise 2: empty table, B sends to C: flooded; C\'s reply to B is not', () => {
  const p = Object.assign({ pair: 'B-C' }, EMPTY);
  assert.deepEqual([at(p, 2).action, at(p, 2).out], ['flood', [1, 3]]);
  assert.deepEqual([at(p, 4).action, at(p, 4).out], ['forward', [2]]);
  assert.deepEqual(rows(at(p, 4)), ['B2@1', 'C3@2']);
});

test('preset source: A already known, A sends to B: the entry is refreshed and the frame still floods', () => {
  const p = { knowA: true, knowC: false };
  const s1 = at(p, 1);
  assert.equal(s1.learned, 'refresh');
  assert.deepEqual(rows(s1), ['A1@1']);
  assert.equal(at(p, 2).action, 'flood');
});

// ── steps ──

test('six steps: three frames, each arrives (learn) then goes on (decide)', () => {
  assert.equal(logic.steps, 6);
  assert.deepEqual([...Array(7).keys()].map((n) => at({}, n).phase),
    ['idle', 'learn', 'decide', 'learn', 'decide', 'learn', 'decide']);
  assert.deepEqual([...Array(7).keys()].map((n) => at({}, n).frame), [0, 1, 1, 2, 2, 3, 3]);
  assert.deepEqual([1, 3, 5].map((n) => at({}, n).src), ['A', 'B', 'A']);
});

test('the source is learned in its own step, before the decision; the decide step changes no row', () => {
  for (let n = 2; n <= logic.steps; n += 2) assert.deepEqual(at({}, n).table, at({}, n - 1).table);
  assert.equal(at({}, 2).changed, null);
  assert.equal(at({}, 1).changed, 'A');
});

test('a param change recomputes the same step', () => {
  assert.equal(at({ knowB: true }, 2).action, 'forward');
  assert.equal(at({ knowB: false }, 2).action, 'flood');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (let n = 0; n <= logic.steps; n++) {
    const s = at({ pair: 'C-A', knowB: true }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ pair: 'B-A', knowA: true });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P();
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps; n++) {
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
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const blocks = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(blocks.length >= 4, 'found preset params');
  for (const b of blocks) {
    for (const k of b.matchAll(/(\w+):/g)) assert.ok(k[1] in logic.defaults, `preset param ${k[1]} is a model param`);
    const pr = b.match(/pair:\s*'([^']+)'/);
    if (pr) assert.ok(logic.pairs.includes(pr[1]), `pair ${pr[1]}`);
  }
});
