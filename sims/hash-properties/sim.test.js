// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for hash-properties. Run: node --test sims/hash-properties/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
const preset = (id) => logic.presets.find((p) => p.id === id).params;

const ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
const EMPTY = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

// ── tie-breaks ──

test('tie-break: the first collision is the smallest j that repeats, paired with its unique earlier i', () => {
  // 8 bits: messages 1 … 21 all differ, 22 repeats 5 (0x84); later repeats do not replace it.
  assert.deepEqual(logic.firstCollision(8, 22), { i: 5, j: 22, value: 0x84 });
  assert.deepEqual(logic.firstCollision(8, 600), { i: 5, j: 22, value: 0x84 });
  assert.equal(logic.firstCollision(8, 21), null);
  const vals = logic.toyValues(8);
  assert.equal(new Set(vals.slice(0, 21)).size, 21, 'no repeat before message 22');
  // Brute force over every pair agrees: no pair (i, j) with j < 22, and (5, 22) is the only pair ending at 22.
  const pairs = [];
  for (let j = 2; j <= 22; j++) for (let i = 1; i < j; i++) if (vals[i - 1] === vals[j - 1]) pairs.push([i, j]);
  assert.deepEqual(pairs, [[5, 22]]);
});

test('tie-break: edit kind order is same, newline, one, more', () => {
  assert.equal(logic.editKind('abc', 'abc', false), 'same');
  assert.equal(logic.editKind('abc\n', 'abc', true), 'same', 'A with a newline equals B plus the toggle');
  assert.equal(logic.editKind('abc', 'abc', true), 'newline', 'a newline is one insertion, but named as such');
  assert.equal(logic.editKind('abc', 'abd', false), 'one');
  assert.equal(logic.editKind('abc', 'ab', false), 'one');
  assert.equal(logic.editKind('abc', 'xabc', false), 'one');
  assert.equal(logic.editKind('abc', 'abd', true), 'more', 'a changed character plus the newline is two edits');
  assert.equal(logic.editKind('Plati 100 EUR', 'Plati 900 EUR', false), 'one');
  assert.equal(logic.editKind('', 'Isti sažetak, dakle ista datoteka.', false), 'more');
  assert.equal(logic.editKind('ab', 'ba', false), 'more');
  assert.equal(logic.editKind('čaj', 'caj', false), 'one', 'characters, not bytes');
  assert.equal(logic.editKind('a😀', 'a', false), 'one', 'code points, not UTF-16 units: the emoji is one character');
  assert.equal(logic.editKind('😀', '😁', false), 'one');
});

test('tie-break: caption focus follows the last change; a preset speaks for its own half', () => {
  const d = logic.defaults;
  assert.equal(logic.nextFocus(null, null, d, null, null), 'digest');
  assert.equal(logic.nextFocus(null, null, Object.assign({}, d, { toyCount: 50 }), null, null), 'toy', 'a link with toy params only');
  assert.equal(logic.nextFocus(null, null, Object.assign({}, d, { b: 'x' }), null, null), 'digest');
  assert.equal(logic.nextFocus('digest', d, Object.assign({}, d, { toyBits: 16 }), null, null), 'toy', 'toyBits alone');
  assert.equal(logic.nextFocus('digest', d, P(preset('toy16')), 'toy16', null), 'toy');
  assert.equal(logic.nextFocus('digest', d, Object.assign({}, d, { toyCount: 31 }), null, null), 'toy');
  assert.equal(logic.nextFocus('toy', d, Object.assign({}, d, { b: 'abd' }), null, null), 'digest');
  assert.equal(logic.nextFocus('toy', d, Object.assign({}, d, { newline: true }), null, null), 'digest');
  assert.equal(logic.nextFocus('digest', d, Object.assign({}, d, { toyCount: 31, a: 'x' }), null, null), 'digest');
  assert.equal(logic.nextFocus('toy', d, d, null, null), 'toy', 'no change keeps the focus');
  assert.equal(logic.nextFocus('digest', d, P(preset('toy8')), 'toy8', null), 'toy');
  assert.equal(logic.nextFocus('toy', d, P(preset('payment')), 'payment', 'toy8'), 'digest');
  assert.equal(logic.nextFocus('digest', d, d, 'toy8', 'toy8'), 'digest', 'the same preset again is not a new choice');
  // From toy8 to abc only toyCount changes (22 → 30), yet a digest preset speaks for the digest.
  assert.equal(logic.nextFocus('toy', P(preset('toy8')), P(preset('abc')), 'abc', 'toy8'), 'digest');
});

test('rule 6: bit order is bytes left to right, most significant bit first', () => {
  const bits = logic.bitsOf('80' + '00'.repeat(30) + '01');
  assert.equal(bits.length, 256);
  assert.equal(bits[0], 1);
  assert.equal(bits[255], 1);
  assert.equal(bits.reduce((a, b) => a + b, 0), 2);
  assert.deepEqual(logic.diffIndices('00'.repeat(32), '40' + '00'.repeat(30) + '02'), [1, 254]);
  assert.deepEqual(logic.bitsOf(ABC).slice(0, 8), [1, 0, 1, 1, 1, 0, 1, 0], '0xba');
});

// ── rules ──

test('SHA-256 matches FIPS 180-2 Appendix B vectors and Python hashlib', () => {
  assert.equal(logic.sha256('abc'), ABC);
  assert.equal(logic.sha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
    '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  assert.equal(logic.sha256(''), EMPTY);
  // hashlib (Python 3), not in the standard: multi-block and UTF-8 input.
  assert.equal(logic.sha256('a'.repeat(1000)), '41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3');
  assert.equal(logic.sha256('čšž😀'), '31a00d9f0ea52d5240a9424ff0102fa1ea5efc10973f123dc7cab45d4e240df6');
  assert.deepEqual(logic.utf8('č'), [0xc4, 0x8d]);
  assert.deepEqual(logic.utf8('ж'), [0xd0, 0xb6], 'U+0436: two bytes');
  assert.deepEqual(logic.utf8('ࠀ'), [0xe0, 0xa0, 0x80], 'U+0800: three bytes');
  assert.deepEqual(logic.utf8('😀'), [0xf0, 0x9f, 0x98, 0x80]);
  assert.deepEqual(logic.utf8('\ud800x'), [0xef, 0xbf, 0xbd, 0x78], 'a lone surrogate becomes U+FFFD, as TextEncoder does');
});

test('rule 1: fixed length, any input gives 256 bits = 64 hex characters', () => {
  for (const s of ['', 'a', 'abc', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64), 'x'.repeat(120), 'čšž']) {
    const d = logic.sha256(s);
    assert.match(d, /^[0-9a-f]{64}$/, JSON.stringify(s));
    assert.equal(logic.bitsOf(d).length, 256);
  }
  const s = S(preset('empty'));
  assert.equal(s.digestA, EMPTY);
  assert.equal(s.bytesA, 0);
  assert.equal(s.bytesB, 35, 'the long input is 35 bytes (ž is two)');
  assert.equal(S({ a: 'čšž😀' }).bytesA, 10, 'bytes, not UTF-16 units');
  assert.equal(s.digestB.length, 64);
});

test('rule 2: deterministic, the same input always gives the same digest', () => {
  const s = S(preset('abc'));
  assert.equal(s.digestA, ABC);
  assert.equal(s.digestB, ABC);
  assert.equal(s.diffBits, 0);
  assert.equal(s.edit, 'same');
  assert.deepEqual(S(preset('payment')), S(preset('payment')));
});

test('rule 3: avalanche, one changed character flips about half the bits (counts from hashlib)', () => {
  const one = S(preset('one-char'));
  assert.equal(one.digestB, 'a52d159f262b2c6ddb724a61840befc36eb30c88877a4030b65cbe86298449c9');
  assert.equal(one.diffBits, 122);
  assert.equal(one.diff.length, 122);
  assert.equal(one.edit, 'one');
  const pay = S(preset('payment'));
  assert.equal(pay.digestA, '82ea917f130eee29be7ab81e423d22811e6d8f598004819d1e148fda86b7fb8b');
  assert.equal(pay.digestB, '7842657727608caec789c9679144727944e6682159c445b06882fa95cde6c9d0');
  assert.equal(pay.diffBits, 133);
  assert.equal(S(preset('empty')).diffBits, 128);
});

test('edge: a trailing newline changes the digest (on B only)', () => {
  const s = S(preset('newline'));
  assert.equal(s.digestA, ABC);
  assert.equal(s.digestB, 'edeaaff3f1774ad2888673770c6d64097e391bc362d7d6fb34982ddf0efd18cb');
  assert.equal(s.b, 'abc\n');
  assert.equal(s.bytesB, 4);
  assert.equal(s.diffBits, 128);
  assert.equal(s.edit, 'newline');
});

test('rule 4: one-way, the model offers no inverse', () => {
  const fns = Object.keys(logic).filter((k) => typeof logic[k] === 'function');
  assert.ok(!fns.some((k) => /invert|reverse|decrypt|unhash/i.test(k)), fns.join(', '));
});

test('rule 5: collisions must exist and come about at √(π/2 · 2^n)', () => {
  assert.equal(Math.round(logic.expectedFirst(8)), 20);
  assert.equal(Math.round(logic.expectedFirst(16)), 321);
  assert.equal(Math.round(logic.expectedFirst(32) / 1000), 82);
  assert.deepEqual(logic.firstCollision(16, 449), { i: 248, j: 449, value: 0xaf50 });
  assert.equal(logic.firstCollision(16, 448), null);
  assert.equal(logic.toyHex(0x84, 8), '0x84');
  assert.equal(logic.toyHex(0xaf50, 16), '0xaf50');
  assert.equal(logic.toyHex(5, 16), '0x0005');
  // Pigeonhole: 257 messages into 256 values must collide, so repeats = n − distinct ≥ 1 from 257 on.
  const s = S({ toyBits: 8, toyCount: 257 });
  assert.ok(s.toyDistinct <= 256);
  assert.equal(s.toyRepeats, 257 - s.toyDistinct);
  assert.ok(s.toyRepeats >= 1);
});

test('toy presets and counters', () => {
  const t8 = S(preset('toy8'));
  assert.equal(t8.toyInputs, 22);
  assert.deepEqual(t8.toyFirstCollision, { i: 5, j: 22, value: 0x84 });
  assert.equal(t8.toyDistinct, 21);
  assert.equal(t8.toyRepeats, 1);
  assert.equal(t8.toyMap.length, 256);
  assert.equal(t8.toyMap[0x84], 2);
  assert.equal(t8.toyMap.reduce((a, b) => a + b, 0), 22);
  assert.equal(t8.toyExpected, 20);
  const t16 = S(preset('toy16'));
  assert.deepEqual(t16.toyFirstCollision, { i: 248, j: 449, value: 0xaf50 });
  assert.equal(t16.toyMap, null, 'no map for 65 536 values');
  assert.equal(t16.toySize, 65536);
  assert.equal(t16.toyExpected, 321);
  const d = S({});
  assert.equal(d.toyInputs, 30);
  assert.equal(d.toyRepeats, 1, 'hashlib: 29 distinct among 30');
  assert.deepEqual(d.toyLast, { i: 30, value: logic.toyValues(8)[29] });
  assert.equal(S({ toyCount: 1 }).toyFirstCollision, null);
  assert.equal(S({ toyCount: 0 }).toyInputs, 1, 'clamped to 1');
  assert.equal(logic.TOY_MAX, 600);
  assert.equal(S({ toyCount: 9999 }).toyInputs, 600, 'clamped to 600');
  assert.equal(S({ toyCount: 22.6 }).toyInputs, 23, 'rounded');
  // hashlib: 225 distinct 8-bit values among 600 messages.
  assert.equal(S({ toyCount: 600 }).toyDistinct, 225);
});

test('defaults are the task\'s: abc, abc, no newline, 8 bits, 30 messages', () => {
  assert.deepEqual(logic.defaults, { a: 'abc', b: 'abc', newline: false, toyBits: 8, toyCount: 30 });
});

test('toy width given as a string still means the same width (memo key)', () => {
  // A fresh copy of the model, so the memo is empty and the string comes first.
  const file = require.resolve('./sim.js');
  delete require.cache[file];
  const fresh = require('./sim.js');
  delete require.cache[file];
  assert.equal(fresh.toyValues('8')[4], 0x84);
  assert.deepEqual(fresh.firstCollision(8, 22), { i: 5, j: 22, value: 0x84 });
  assert.equal(fresh.toyValues('16')[247], 0xaf50);
});

test('toy messages are data: the same strings in both languages', () => {
  assert.equal(logic.toyMessage(5), 'poruka 5');
  assert.equal(logic.toyValues(8)[4], 0x84);
  assert.equal(logic.toyValues(16)[247], 0xaf50);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of logic.presets) {
    const s = S(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, p.id);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P(preset('payment'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.deepEqual(kit.stateAt(logic, p, 0), logic.initial(p));
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model, and the page has no steps', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.equal(logic.steps, undefined);
  for (const p of logic.presets) for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `${p.id}: ${k}`);
  for (const id of ['abc', 'one-char', 'payment', 'empty', 'toy8', 'toy16']) assert.ok(logic.presets.some((p) => p.id === id), id);
  const json = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  for (const e of json.entries || []) assert.ok(logic.presets.some((p) => p.id === e.preset), e.preset);
});
