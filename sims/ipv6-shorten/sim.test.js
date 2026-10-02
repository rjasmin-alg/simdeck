// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ipv6-shorten's model. Run: node --test sims/ipv6-shorten/
// Numbers from the URM book, ch. 10 (10-ipv6.md): the five rules ("Što treba znati"), the worked example and the
// one-group case ("Šire o temi"), Primjer 1 and 2, the special values :: and ::1; the equal-runs rule and its example
// from RFC 5952 §4.2.3. Tie-breaks and edges first, then the rules, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const A = (addr) => logic.analyze({ addr });
const sh = logic.shorten;

// ── tie-breaks and edges ──

test('equal runs: the first is shortened (RFC 5952 §4.2.3: 2001:db8:0:0:1:0:0:1 → 2001:db8::1:0:0:1)', () => {
  assert.equal(sh('2001:0db8:0000:0000:0001:0000:0000:0001'), '2001:db8::1:0:0:1');
  const a = A('2001:0db8:0000:0000:0001:0000:0000:0001');
  assert.deepEqual(a.chosen, { start: 2, len: 2 });
  assert.deepEqual(a.verdicts, ['chosen', 'later']);
  assert.equal(a.ties, 2);
  // the same with the tie at the ends of the address
  assert.equal(sh('0000:0000:0001:0002:0003:0004:0000:0000'), '::1:2:3:4:0:0');
});

test('a longer later run beats an earlier shorter one (longest first, position second)', () => {
  // URM ch. 10, question 5: 2001:0000:0000:0ABC:0000:0000:0000:0001 — runs of 2 and 3, the second is longer.
  assert.equal(sh('2001:0000:0000:0ABC:0000:0000:0000:0001'), '2001:0:0:abc::1');
  const a = A('2001:0000:0000:0ABC:0000:0000:0000:0001');
  assert.deepEqual(a.verdicts, ['shorter', 'chosen']);
  assert.equal(a.ties, 1);
});

test('never one group: a single zero group stays "0" (ch. 10: 2001:db8:0:1:1:1:1:1, not 2001:db8::1:1:1:1:1)', () => {
  assert.equal(sh('2001:0db8:0000:0001:0001:0001:0001:0001'), '2001:db8:0:1:1:1:1:1');
  const a = A('2001:0db8:0000:0001:0001:0001:0001:0001');
  assert.equal(a.chosen, null);
  assert.deepEqual(a.verdicts, ['single']);
  assert.equal(a.kept, 8);
  // two single zero groups: still no ::
  assert.equal(sh('2001:0db8:0000:0001:0000:0001:0001:0001'), '2001:db8:0:1:0:1:1:1');
  // exactly two groups is enough
  assert.equal(sh('2001:0db8:0000:0000:0001:0001:0001:0001'), '2001:db8::1:1:1:1');
});

test(':: at the start, at the end, and for the whole address', () => {
  assert.equal(sh('0000:0000:0000:0000:0000:0000:0000:0000'), '::');
  assert.equal(sh('0000:0000:0000:0000:0000:0000:0000:0001'), '::1');
  assert.equal(sh('2001:0db8:0000:0000:0000:0000:0000:0000'), '2001:db8::');
  assert.equal(sh('0000:0000:0000:0000:0000:0000:0000:0001').split('::').length, 2, ':: once');
});

test(':: appears at most once, and the groups always add up to eight', () => {
  // every address with each group 0 or 1 (2^8 of them)
  for (let m = 0; m < 256; m++) {
    const full = Array.from({ length: 8 }, (_, i) => ((m >> (7 - i)) & 1 ? '0001' : '0000')).join(':');
    const s = sh(full);
    assert.ok(s.split('::').length <= 2, `${full} → ${s}`);
    const a = A(full);
    if (a.chosen) {
      const kept = s.split('::').filter(Boolean).join(':').split(':').filter(Boolean).length;
      assert.equal(kept, a.kept, full);
      assert.equal(a.kept + a.chosen.len, 8, full);
      // no zero run elsewhere is longer than the chosen one, and none before it is as long
      for (const r of a.runs) {
        assert.ok(r.len <= a.chosen.len, full);
        if (r.start < a.chosen.start) assert.ok(r.len < a.chosen.len, full);
      }
    } else assert.equal(s.split(':').length, 8, full);
  }
});

test('leading zeros: only leading ones go, and a zero group keeps one "0"', () => {
  assert.deepEqual(logic.stripLeading(['0db8', '0000', '0042', 'ff00', '0001', '1000', '0', '00a0']),
    ['db8', '0', '42', 'ff00', '1', '1000', '0', 'a0']);
  // RFC 5952 §4.1's own example: 2001:0db8::0001 must be 2001:db8::1 (here in full form)
  assert.equal(sh('2001:0db8:0000:0000:0000:0000:0000:0001'), '2001:db8::1');
});

test('zero groups count by value: "0", "00" and "0000" are all zero', () => {
  assert.deepEqual(logic.zeroRuns(['0', '00', '000', '0000', '1', '0', 'a', '0']),
    [{ start: 0, len: 4 }, { start: 5, len: 1 }, { start: 7, len: 1 }]);
  assert.deepEqual(logic.zeroRuns(['1', '2', '3', '4', '5', '6', '7', '8']), []);
});

test('lowercase: a–f only, digits unchanged, and which groups changed', () => {
  const a = A('ABCD:EF01:2345:6789:ABCD:EF01:2345:6789');
  assert.equal(a.short, 'abcd:ef01:2345:6789:abcd:ef01:2345:6789');
  assert.deepEqual(a.lowerChanged, [true, true, false, false, true, true, false, false]);
  assert.deepEqual(a.stripChanged, Array(8).fill(false));
  assert.deepEqual(a.runs, []);
  assert.equal(sh('FE80:0000:0000:0000:0204:61FF:FE9D:F156'), 'fe80::204:61ff:fe9d:f156');
});

test('parse takes only the full form: eight groups of 1–4 hex digits', () => {
  for (const bad of ['', '::', '::1', 'fe80::1', '1:2:3:4:5:6:7', '1:2:3:4:5:6:7:8:9', '1:2:3:4:5:6:7:12345',
    '1:2:3:4:5:6:7:g', '1:2:3:4:5:6:7: 8', '1.2.3.4']) assert.equal(logic.parse(bad), null, bad);
  assert.deepEqual(logic.parse('1:2:3:4:5:6:7:8'), ['1', '2', '3', '4', '5', '6', '7', '8']);
  assert.equal(sh('fe80::1'), null);
});

test('classify by prefix bits, not digits: 2000::/3 is 2000–3fff, fe80::/10 is fe80–febf, fc00::/7 is fc00–fdff', () => {
  const c = (g0) => logic.classify([g0, '0', '0', '0', '0', '0', '0', '1']);
  assert.equal(c('1fff'), null);
  assert.equal(c('2000'), 'global');
  assert.equal(c('3fff'), 'global');
  assert.equal(c('3ffe'), 'global');            // ch. 10, question 10
  assert.equal(c('4000'), null);                // ch. 10, question 10
  assert.equal(c('fbff'), null);
  assert.equal(c('fc00'), 'uniqueLocal');
  assert.equal(c('fdff'), 'uniqueLocal');
  assert.equal(c('fe00'), null);
  assert.equal(c('fe7f'), null);
  assert.equal(c('fe80'), 'linkLocal');
  assert.equal(c('febf'), 'linkLocal');
  assert.equal(c('fec0'), null);
  assert.equal(c('feff'), null);
  assert.equal(c('ff00'), 'multicast');
  assert.equal(c('ff02'), 'multicast');
  assert.equal(c('abcd'), null);
});

test('the special values come before the prefix ranges: :: and ::1, but not 0:…:2', () => {
  assert.equal(A('0000:0000:0000:0000:0000:0000:0000:0000').type, 'unspecified');
  assert.equal(A('0000:0000:0000:0000:0000:0000:0000:0001').type, 'loopback');
  assert.equal(A('0000:0000:0000:0000:0000:0000:0000:0002').type, null);
  assert.equal(A('0000:0000:0000:0000:0000:0000:0001:0001').type, null);
});

// ── the book's numbers ──

test('Primjer 1: fe80:0000:0000:0000:0204:61ff:fe9d:f156 → fe80::204:61ff:fe9d:f156, link-local', () => {
  const a = A(logic.defaults.addr);
  assert.equal(a.stripped.join(':'), 'fe80:0:0:0:204:61ff:fe9d:f156');
  assert.deepEqual(a.chosen, { start: 1, len: 3 });
  assert.equal(a.short, 'fe80::204:61ff:fe9d:f156');
  assert.equal(a.kept, 5);   // "pet preostalih skupina plus tri koje :: nadomješta daje osam"
  assert.equal(a.type, 'linkLocal');
  assert.equal(a.prefix, 'fe80::/10');
});

test('ch. 10 worked example: 2001:0db8:0000:0000:0000:ff00:0042:8329 → 2001:db8::ff00:42:8329, global unicast', () => {
  const a = A('2001:0db8:0000:0000:0000:ff00:0042:8329');
  assert.equal(a.stripped.join(':'), '2001:db8:0:0:0:ff00:42:8329');
  assert.deepEqual(a.chosen, { start: 2, len: 3 });   // the third, fourth and fifth group
  assert.equal(a.short, '2001:db8::ff00:42:8329');
  assert.equal(a.kept, 5);
  assert.equal(a.type, 'global');
});

test('Primjer 2: the four addresses by prefix (in full form)', () => {
  assert.equal(sh('2001:0db8:85a3:0000:0000:8a2e:0370:7334'), '2001:db8:85a3::8a2e:370:7334');
  assert.equal(A('2001:0db8:85a3:0000:0000:8a2e:0370:7334').type, 'global');
  assert.equal(sh('fe80:0000:0000:0000:0000:0000:0000:0001'), 'fe80::1');
  assert.equal(A('fe80:0000:0000:0000:0000:0000:0000:0001').type, 'linkLocal');
  assert.equal(sh('fc00:0000:0000:0000:0000:0000:0000:0001'), 'fc00::1');
  assert.equal(A('fc00:0000:0000:0000:0000:0000:0000:0001').type, 'uniqueLocal');
  assert.equal(sh('ff02:0000:0000:0000:0000:0000:0000:0001'), 'ff02::1');
  assert.equal(A('ff02:0000:0000:0000:0000:0000:0000:0001').type, 'multicast');
});

test('ch. 10, question 6: which short texts are the recommended ones', () => {
  // (a) and (d) are recommended; (b) uses :: on the shorter run; (c) is recommended (the one zero stays).
  const ok = (full, text) => assert.equal(sh(full), text);
  ok('2001:0db8:0000:0002:0002:0002:0002:0002', '2001:db8:0:2:2:2:2:2');
  assert.notEqual(sh('fe80:0000:0000:0000:0001:0000:0000:0002'), 'fe80:0:0:0:1::2');
  ok('fe80:0000:0000:0000:0001:0000:0000:0002', 'fe80::1:0:0:2');
  ok('2001:0db8:0000:0000:0000:00ab:0000:0001', '2001:db8::ab:0:1');
  ok('0000:0000:0000:0000:0000:0000:0000:0001', '::1');
});

test('the book\'s full example ABCD:EF01:… has nothing to shorten but the letters, and no type of the four', () => {
  const a = A('ABCD:EF01:2345:6789:ABCD:EF01:2345:6789');
  assert.equal(a.chosen, null);
  assert.equal(a.type, null);
  assert.equal(a.fullLength, a.short.length);
});

test('every offered address parses and is different', () => {
  for (const a of logic.addrs) assert.notEqual(logic.parse(a), null, a);
  assert.equal(new Set(logic.addrs.map((a) => a.toLowerCase())).size, logic.addrs.length);
  assert.ok(logic.addrs.includes(logic.defaults.addr));
});

// ── steps ──

test('the steps reveal the phases in the book\'s order, lowercase first', () => {
  assert.equal(logic.steps, 5);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((n) => at({}, n).phase), ['start', 'lowercase', 'leading', 'runs', 'compress', 'check']);
});

test('a param change recomputes at the same step', () => {
  const s = at({ addr: '2001:0db8:0000:0000:0000:ff00:0042:8329' }, 4);
  assert.equal(s.phase, 'compress');
  assert.equal(s.short, '2001:db8::ff00:42:8329');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const addr of logic.addrs) for (let n = 0; n <= logic.steps; n++) {
    const s = at({ addr }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ addr: '2001:0db8:0000:0000:0001:0000:0000:0001' });
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
  assert.equal(blocks.length, 7, 'found the seven presets');
  for (const b of blocks) {
    for (const k of b.matchAll(/(?:^|[\s,])(\w+):\s*'/g)) assert.ok(k[1] in logic.defaults, `preset param ${k[1]} is a model param`);
    const addr = b.match(/addr:\s*'([^']+)'/);
    assert.ok(addr && logic.addrs.includes(addr[1]), `preset addr ${addr && addr[1]} is offered`);
  }
  // the first preset is the book's Primjer 1
  assert.equal(blocks[0].match(/addr:\s*'([^']+)'/)[1], logic.defaults.addr);
});
