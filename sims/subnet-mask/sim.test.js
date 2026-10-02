// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for subnet-mask's model. Run: node --test sims/subnet-mask/
// Numbers from the URM book, ch. 8 (08-mrezni-sloj.md): the running example, Primjer 2, 5 and 6, and the fragment's
// exercises (podmrezna-maska.html). Tie-breaks and edges first, then the rules, then the template's generic block.
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

// ── edges and tie-breaks ──

test('mask edges: /0, /1, /31 and /32 (a shift by 32 is not a shift by 0)', () => {
  assert.equal(f(logic.mask(0)), '0.0.0.0');
  assert.equal(f(logic.mask(1)), '128.0.0.0');
  assert.equal(f(logic.mask(31)), '255.255.255.254');
  assert.equal(f(logic.mask(32)), '255.255.255.255');
  for (let p = 0; p <= 32; p++) assert.equal(logic.bits(logic.mask(p)), '1'.repeat(p) + '0'.repeat(32 - p), `/${p}`);
});

test('addresses stay unsigned above 128.0.0.0 (no negative numbers from bit operations)', () => {
  const a = logic.analyze(P({ prefix: 1 }));
  assert.equal(f(a.network), '128.0.0.0');
  assert.equal(f(a.broadcast), '255.255.255.255');
  assert.ok(a.network > 0 && a.broadcast > 0 && a.mask > 0);
  assert.equal(a.hosts, 2147483646);
});

test('the own address can be the network or broadcast address of its own network, and says so', () => {
  // 192.168.1.100 = …01100100: under /30 the two host bits are 00, so it is the network address 192.168.1.100.
  assert.equal(logic.analyze(P({ prefix: 30 })).addrRole, 'network');
  // 192.168.5.77 = …01001101 is no edge under /30 (76–79), but 192.168.1.10 = …00001010 under /30 is 8–11: a host.
  assert.equal(logic.analyze(P({ addr: '192.168.5.77', prefix: 30 })).addrRole, 'host');
  assert.equal(logic.analyze(P({ addr: '192.168.1.10', prefix: 30 })).addrRole, 'host');
  assert.equal(logic.role(ip('192.168.1.127'), ip('192.168.1.100'), 26), 'broadcast');
  assert.equal(logic.role(ip('192.168.1.64'), ip('192.168.1.100'), 26), 'network');
  assert.equal(logic.role(ip('192.168.1.128'), ip('192.168.1.100'), 26), 'outside');
  assert.equal(logic.analyze(P()).addrRole, 'host');
});

test('first and last bit of a block decide: 63 and 128 are outside 192.168.1.64/26, 64 and 127 inside', () => {
  const own = ip('192.168.1.100');
  assert.equal(logic.sameNetwork(own, ip('192.168.1.63'), 26), false);
  assert.equal(logic.sameNetwork(own, ip('192.168.1.64'), 26), true);
  assert.equal(logic.sameNetwork(own, ip('192.168.1.127'), 26), true);
  assert.equal(logic.sameNetwork(own, ip('192.168.1.128'), 26), false);
});

test('differing bits: empty exactly when local, and only network bits count', () => {
  for (const dest of logic.dests) for (let p = logic.minPrefix; p <= logic.maxPrefix; p++) {
    const a = logic.analyze(P({ dest, prefix: p }));
    assert.equal(a.differ.length === 0, a.local, `${dest}/${p}`);
    assert.ok(a.differ.every((i) => i < p), 'only network bits');
  }
  // 192.168.1.100 vs 192.168.1.200 under /26: 01|100100 vs 11|001000, bit 24 (the first of the last octet) differs.
  assert.deepEqual(logic.analyze(P({ dest: '192.168.1.200' })).differ, [24]);
});

test('no offered destination is ever the network or broadcast address of an offered own network', () => {
  // So the page needs no caption for it; the model still tells (role), should the offered addresses change.
  for (const addr of logic.addrs) for (const dest of logic.dests) for (let p = logic.minPrefix; p <= logic.maxPrefix; p++) {
    assert.ok(['host', 'outside'].includes(logic.analyze(P({ addr, dest, prefix: p })).destRole), `${addr} ${dest}/${p}`);
  }
});

test('parse rejects what is not a dotted-quad IPv4 address', () => {
  for (const bad of ['', '1.2.3', '1.2.3.4.5', '256.1.1.1', '1.2.3.-4', '1.2.3.a', '1..2.3', ' 1.2.3.4']) assert.equal(ip(bad), null, bad);
  assert.equal(ip('0.0.0.0'), 0);
  assert.equal(ip('255.255.255.255'), 4294967295);
});

test('every offered address parses, and no destination equals an own address', () => {
  for (const a of logic.addrs.concat(logic.dests)) assert.notEqual(ip(a), null, a);
  for (const d of logic.dests) assert.ok(!logic.addrs.includes(d), d);
});

// ── the book's numbers ──

test('ch. 8 running example: 192.168.1.100 with 255.255.255.192 → 192.168.1.64, broadcast .127, hosts .65–.126', () => {
  const a = logic.analyze(P());
  assert.equal(f(a.mask), '255.255.255.192');
  assert.equal(logic.bits(a.addr).match(/.{8}/g).join('.'), '11000000.10101000.00000001.01100100');
  assert.equal(logic.bits(a.mask).match(/.{8}/g).join('.'), '11111111.11111111.11111111.11000000');
  assert.equal(logic.bits(a.network).match(/.{8}/g).join('.'), '11000000.10101000.00000001.01000000');
  assert.equal(f(a.network), '192.168.1.64');
  assert.equal(logic.bits(a.broadcast).slice(24), '01111111');
  assert.equal(f(a.broadcast), '192.168.1.127');
  assert.equal(f(a.first), '192.168.1.65');
  assert.equal(f(a.last), '192.168.1.126');
  assert.equal(a.hostBits, 6);
  assert.equal(a.hosts, 62);
});

test('Primjer 6: 192.168.5.77 with 255.255.255.240 → 192.168.5.64, broadcast .79, hosts .65–.78', () => {
  const a = logic.analyze(P({ addr: '192.168.5.77', prefix: 28 }));
  assert.equal(f(a.mask), '255.255.255.240');
  assert.equal(f(a.network), '192.168.5.64');
  assert.equal(f(a.broadcast), '192.168.5.79');
  assert.equal(f(a.first), '192.168.5.65');
  assert.equal(f(a.last), '192.168.5.78');
});

test('fragment exercise 1: 255.255.255.240 is /28, 2⁴ − 2 = 14 usable addresses', () => {
  assert.equal(f(logic.mask(28)), '255.255.255.240');
  assert.equal(logic.hosts(28), 14);
  assert.equal(logic.hosts(30), 2);
  assert.equal(logic.hosts(24), 254);
});

test('Primjer 2: 192.168.1.10/24 — 192.168.1.77 is local, 192.168.2.50 is not', () => {
  const a = logic.analyze(P({ addr: '192.168.1.10', prefix: 24, dest: '192.168.1.77' }));
  assert.equal(f(a.network), '192.168.1.0');
  assert.equal(f(a.destNetwork), '192.168.1.0');
  assert.equal(a.local, true);
  assert.equal(a.arpFor, 'dest');
  const b = logic.analyze(P({ addr: '192.168.1.10', prefix: 24, dest: '192.168.2.50' }));
  assert.equal(f(b.destNetwork), '192.168.2.0');
  assert.equal(b.local, false);
  assert.equal(b.arpFor, 'gateway');
});

test('fragment exercise 2: /26, 192.168.1.200 is in 192.168.1.192/26, so remote; ARP asks for the gateway', () => {
  const a = logic.analyze(P({ dest: '192.168.1.200' }));
  assert.equal(f(a.destNetwork), '192.168.1.192');
  assert.equal(a.local, false);
  assert.equal(a.destRole, 'outside');
  assert.equal(a.arpFor, 'gateway');
});

test('Primjer 5 (b): 8.8.8.8 is never local to 192.168.1.100, at any prefix', () => {
  for (let p = logic.minPrefix; p <= logic.maxPrefix; p++) assert.equal(logic.analyze(P({ dest: '8.8.8.8', prefix: p })).arpFor, 'gateway', `/${p}`);
});

test('a shorter prefix makes a bigger network: 192.168.1.137 is remote under /26, local under /24', () => {
  assert.equal(logic.analyze(P({ dest: '192.168.1.137', prefix: 26 })).local, false);
  assert.equal(logic.analyze(P({ dest: '192.168.1.137', prefix: 25 })).local, false);
  assert.equal(logic.analyze(P({ dest: '192.168.1.137', prefix: 24 })).local, true);
});

// ── steps ──

test('the steps reveal the phases in the book\'s order', () => {
  assert.equal(logic.steps, 7);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map((n) => at({}, n).phase),
    ['start', 'network', 'broadcast', 'hosts', 'dest', 'compare', 'arpRequest', 'arpReply']);
});

test('a param change recomputes the numbers at the same step', () => {
  const s = at({ prefix: 24 }, 3);
  assert.equal(s.phase, 'hosts');
  assert.equal(f(s.network), '192.168.1.0');
  assert.equal(s.hosts, 254);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (let n = 0; n <= logic.steps; n++) {
    const s = at({ addr: '192.168.5.77', prefix: 9, dest: '8.8.8.8' }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ prefix: 27, dest: '192.168.1.200' });
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
  // The page lists its presets in index.html; read them so a renamed param or an unknown address fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const blocks = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(blocks.length > 0, 'found preset params');
  for (const b of blocks) {
    for (const k of b.matchAll(/(\w+):/g)) assert.ok(k[1] in logic.defaults, `preset param ${k[1]} is a model param`);
    const addr = b.match(/addr:\s*'([^']+)'/), dest = b.match(/dest:\s*'([^']+)'/), pre = b.match(/prefix:\s*(\d+)/);
    if (addr) assert.ok(logic.addrs.includes(addr[1]), `preset addr ${addr[1]} is offered`);
    if (dest) assert.ok(logic.dests.includes(dest[1]), `preset dest ${dest[1]} is offered`);
    if (pre) assert.ok(+pre[1] >= logic.minPrefix && +pre[1] <= logic.maxPrefix, `preset prefix ${pre[1]} in range`);
  }
});
