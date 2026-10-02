// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for routing-table's model. Run: node --test sims/routing-table/
// Numbers from the URM book, ch. 11 (11-usmjeravanje.md), Primjer 2 (router R2), and the fragment's exercises
// (tablica-usmjeravanja.html). Tie-breaks and edges first, then the rules, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const ip = logic.parse;
const f = logic.format;
const T = (rows) => rows.map(([net, prefix]) => ({ net: ip(net), prefix }));
const name = (s, k) => f(s.rows[k].net) + '/' + s.rows[k].prefix;

// ── tie-breaks and edges ──

test('the longest match wins wherever it stands: same winner in every order of the table', () => {
  const rows = [['10.0.0.0', 8], ['10.1.0.0', 16], ['10.1.2.0', 24], ['0.0.0.0', 0]];
  const perms = (a) => a.length < 2 ? [a] : a.flatMap((x, i) => perms(a.filter((_, j) => j !== i)).map((p) => [x].concat(p)));
  for (const order of perms(rows)) {
    const r = logic.lookup(T(order), ip('10.1.2.55'));
    assert.deepEqual(order[r.winner], ['10.1.2.0', 24], order.map((e) => e[1]).join(','));
  }
});

test('equal prefix length (only a duplicated entry can tie): the earlier entry wins', () => {
  const r = logic.lookup(T([['0.0.0.0', 0], ['10.1.0.0', 16], ['10.1.0.0', 16]]), ip('10.1.9.9'));
  assert.deepEqual(r.matches, [0, 1, 2]);
  assert.equal(r.winner, 1);
});

test('first match and winner differ when the default route stands first', () => {
  const r = logic.lookup(T([['0.0.0.0', 0], ['10.0.0.0', 8]]), ip('10.9.9.9'));
  assert.equal(r.firstMatch, 0);
  assert.equal(r.winner, 1);
});

test('nothing matches without a default route: winner −1, no matches', () => {
  const r = logic.lookup(T([['10.0.0.0', 8], ['10.1.2.0', 24]]), ip('172.16.5.5'));
  assert.deepEqual(r, { matches: [], winner: -1, firstMatch: -1 });
});

test('/0 matches every address; /32 only itself; the mask edges hold (a shift by 32 is not a shift by 0)', () => {
  for (const a of ['0.0.0.0', '10.1.2.55', '172.16.5.5', '255.255.255.255']) assert.equal(logic.match(ip(a), 0, 0), true, a);
  assert.equal(logic.match(ip('10.1.2.55'), ip('10.1.2.55'), 32), true);
  assert.equal(logic.match(ip('10.1.2.54'), ip('10.1.2.55'), 32), false);
  for (let p = 0; p <= 32; p++) assert.equal(logic.bits(logic.mask(p)), '1'.repeat(p) + '0'.repeat(32 - p), `/${p}`);
});

test('the boundary bit decides: 10.1.3.7 misses 10.1.2.0/24 at its last bit, 10.1.2.255 still matches', () => {
  assert.equal(logic.firstDiff(ip('10.1.3.7'), ip('10.1.2.0'), 24), 23);
  assert.equal(logic.match(ip('10.1.3.7'), ip('10.1.2.0'), 24), false);
  assert.equal(logic.match(ip('10.1.3.7'), ip('10.1.2.0'), 23), true);
  assert.equal(logic.match(ip('10.1.2.255'), ip('10.1.2.0'), 24), true);
  assert.equal(logic.match(ip('10.1.1.255'), ip('10.1.2.0'), 24), false);
});

test('bits beyond the prefix are not compared, on either side', () => {
  // an entry written with host bits set still describes its network
  assert.equal(logic.match(ip('10.1.2.55'), ip('10.1.2.200'), 24), true);
  assert.equal(logic.firstDiff(ip('10.1.2.55'), ip('10.1.2.200'), 24), -1);
  assert.equal(logic.firstDiff(ip('10.1.2.55'), ip('10.1.2.200'), 32), 24);
});

test('addresses above 128.0.0.0 stay unsigned (no negative numbers from bit operations)', () => {
  assert.equal(logic.match(ip('200.1.1.1'), ip('192.0.0.0'), 2), true);
  assert.equal(logic.match(ip('200.1.1.1'), ip('128.0.0.0'), 1), true);
  assert.equal(logic.match(ip('100.1.1.1'), ip('128.0.0.0'), 1), false);
  assert.equal(logic.firstDiff(ip('172.16.5.5'), ip('10.0.0.0'), 8), 0);
});

test('parse rejects what is not a dotted-quad IPv4 address', () => {
  for (const bad of ['', '1.2.3', '1.2.3.4.5', '256.1.1.1', '1.2.3.-4', '1.2.3.a', '1..2.3']) assert.equal(ip(bad), null, bad);
  for (const a of logic.dests) assert.notEqual(ip(a), null, a);
});

// ── the book's numbers ──

test('R2\'s table is the book\'s, in the book\'s order (ch. 11, Primjer 2)', () => {
  assert.deepEqual(logic.bookTable.map((e) => [e.net, e.prefix, e.hop]),
    [['10.0.0.0', 8, 'R3'], ['10.1.0.0', 16, 'R4'], ['10.1.2.0', 24, 'R5'], ['0.0.0.0', 0, 'R6']]);
});

test('Primjer 2: 10.1.2.55 matches all four entries; /24 wins, via R5', () => {
  const s = at({}, logic.steps);
  assert.deepEqual(s.matches, [0, 1, 2, 3]);
  assert.equal(name(s, s.winner), '10.1.2.0/24');
  assert.equal(s.rows[s.winner].hop, 'R5');
  assert.equal(s.firstMatch, 0, 'the first match is 10.0.0.0/8, not the winner');
});

test('Primjer 2 and exercise 2: 172.16.5.5 matches only the default route, via R6', () => {
  const s = at({ dest: '172.16.5.5' }, logic.steps);
  assert.deepEqual(s.matches, [3]);
  assert.equal(s.rows[s.winner].hop, 'R6');
  assert.equal(s.rows[0].diff, 0, '172 = 10101100 differs from 10 = 00001010 at the first bit');
});

test('exercise 3: 10.5.0.1 matches /8 and /0; /8 wins, via R3; /16 is missed at bit 14', () => {
  const s = at({ dest: '10.5.0.1' }, logic.steps);
  assert.deepEqual(s.matches.map((k) => name(s, k)), ['10.0.0.0/8', '0.0.0.0/0']);
  assert.equal(s.rows[s.winner].hop, 'R3');
  assert.equal(s.rows[1].diff, 13); // 5 = 00000101 vs 1 = 00000001
  assert.equal(s.rows[2].diff, 13);
});

test('10.1.3.7: /16 wins via R4 (every specific entry wins for one offered destination)', () => {
  const s = at({ dest: '10.1.3.7' }, logic.steps);
  assert.deepEqual(s.matches.map((k) => name(s, k)), ['10.0.0.0/8', '10.1.0.0/16', '0.0.0.0/0']);
  assert.equal(s.rows[s.winner].hop, 'R4');
  const hops = logic.dests.map((d) => { const x = at({ dest: d }, logic.steps); return x.rows[x.winner].hop; });
  assert.deepEqual(hops.slice().sort(), ['R3', 'R4', 'R5', 'R6']);
});

test('reversed order: the default route is checked first and matches first, and /24 still wins', () => {
  const s = at({ order: 'reversed' }, logic.steps);
  assert.equal(name(s, 0), '0.0.0.0/0');
  assert.equal(s.firstMatch, 0);
  assert.equal(name(s, s.winner), '10.1.2.0/24');
  for (const dest of logic.dests) {
    const a = at({ dest }, logic.steps), b = at({ dest, order: 'reversed' }, logic.steps);
    assert.equal(a.rows[a.winner].hop, b.rows[b.winner].hop, dest);
  }
});

// ── steps ──

test('steps: start, one check per entry in table order, then choose', () => {
  assert.equal(logic.steps, 5);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((n) => at({}, n).phase), ['start', 'check', 'check', 'check', 'check', 'choose']);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((n) => at({}, n).checked), [0, 1, 2, 3, 4, 4]);
});

test('a param change recomputes the numbers at the same step', () => {
  const s = at({ dest: '10.5.0.1' }, 2);
  assert.equal(s.checked, 2);
  assert.equal(s.rows[1].match, false);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (let n = 0; n <= logic.steps; n++) {
    const s = at({ dest: '172.16.5.5', order: 'reversed' }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ dest: '10.1.3.7', order: 'reversed' });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P();
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const blocks = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(blocks.length > 0, 'found preset params');
  for (const b of blocks) {
    for (const k of b.matchAll(/(\w+):/g)) assert.ok(k[1] in logic.defaults, `preset param ${k[1]} is a model param`);
    const dest = b.match(/dest:\s*'([^']+)'/), order = b.match(/order:\s*'([^']+)'/);
    if (dest) assert.ok(logic.dests.includes(dest[1]), `preset dest ${dest[1]} is offered`);
    if (order) assert.ok(logic.orders.includes(order[1]), `preset order ${order[1]} is offered`);
  }
});
