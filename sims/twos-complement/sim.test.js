// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for twos-complement: the rules of SPEC.md (tie-breaks first), checked exhaustively over every pair of
// 4- and 8-bit operands against plain integer arithmetic, then the presets' numbers, then the generic block.
// Run: node --test sims/twos-complement/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => logic.derive(P(over));
const preset = (id) => logic.presets.find((p) => p.id === id).params;

/** Every pair of signed operands of n bits. */
function* pairs(n) {
  const h = 2 ** (n - 1);
  for (let a = -h; a < h; a++) for (let b = -h; b < h; b++) yield [a, b];
}

// ── tie-breaks first ──

test('tie-break rule 4: zero counts as non-negative (top bit 0) when signs are compared', () => {
  const mm = at({ a: -128, b: -128 });                       // 1000 0000 + 1000 0000 = 1 0000 0000
  assert.deepEqual(mm.flags, { N: 0, Z: 1, C: 1, V: 1 }, 'two negatives give 0, which is not negative: V');
  assert.deepEqual(at({ a: 0, b: 0 }).flags, { N: 0, Z: 1, C: 0, V: 0 });
  assert.equal(at({ a: 0, b: -1 }).flags.V, 0, 'signs differ: never V');
  assert.equal(at({ a: 127, b: 0 }).flags.V, 0, 'two non-negatives that fit');
  assert.equal(at({ a: -128, b: 0 }).flags.V, 0);
  assert.equal(at({ a: -1, b: -127 }).flags.V, 0, '−128 fits');
  assert.equal(at({ a: -1, b: -128 }).flags.V, 1, '−129 does not');
});

test('tie-break rule 7: operands round halves up, clamp to the range, and NaN or −0 become 0', () => {
  assert.equal(logic.clamp(2.5, 8), 3);
  assert.equal(logic.clamp(-2.5, 8), -2);
  assert.ok(Object.is(logic.clamp(-0.4, 8), 0), 'not −0');
  assert.equal(logic.clamp('abc', 8), 0);
  assert.equal(logic.clamp(Infinity, 8), 0);
  assert.equal(logic.clamp(128, 8), 127);
  assert.equal(logic.clamp(-129, 8), -128);
  assert.equal(logic.clamp(30000, 8), 127, 'switching 16 → 8 bits clamps, it does not keep the low bits');
  assert.equal(logic.clamp('-7', 4), -7);
  const s = at({ width: 4, a: 100, b: -100 });
  assert.equal(s.a, 7);
  assert.equal(s.b, -8);
});

test('tie-break: an unknown width or view falls back to the default', () => {
  assert.equal(at({ width: 5 }).n, 8);
  assert.equal(at({ width: '16' }).n, 16);
  assert.equal(at({ view: 'octal' }).view, 'both');
});

// ── rules ──

test('rule 1: the top bit weighs −2^(n−1); range −2^(n−1) … 2^(n−1) − 1', () => {
  assert.deepEqual(logic.weights(8), [-128, 64, 32, 16, 8, 4, 2, 1]);
  assert.deepEqual(logic.weights(4), [-8, 4, 2, 1]);
  assert.equal(logic.weights(16)[0], -32768);
  assert.deepEqual(logic.rangeOf(8), { min: -128, max: 127 });
  assert.deepEqual(logic.rangeOf(4), { min: -8, max: 7 });
  assert.deepEqual(logic.rangeOf(16), { min: -32768, max: 32767 });
  for (const n of [4, 8]) {
    for (let u = 0; u < 2 ** n; u++) {
      const bits = logic.bitsOf(u, n);
      assert.equal(logic.valueOfBits(bits), logic.signedOf(u, n), `pattern ${u}`);
      assert.equal(logic.unsignedOf(logic.signedOf(u, n), n), u);
    }
  }
  assert.deepEqual(logic.bitsOf(0x96, 8), [1, 0, 0, 1, 0, 1, 1, 0]);
  assert.equal(logic.signedOf(0x96, 8), -106);
  assert.equal(logic.signedOf(0xff, 8), -1);
  assert.equal(logic.hexOf(0x5, 8), '05');
  assert.equal(logic.hexOf(0x9c40, 16), '9C40');
  assert.equal(logic.hexOf(0xa, 4), 'A');
  assert.equal(logic.hexOf(5, 16), '0005', 'padded to n / 4 digits');
  assert.equal(at({ width: 16, a: 5, b: 0 }).hex.a, '0005');
});

test('rule 2: one adder; r = (a + b) mod 2^n, read signed or unsigned from the same bits', () => {
  for (const n of [4, 8]) {
    const m = 2 ** n;
    for (const [a, b] of pairs(n)) {
      const s = at({ width: n, a, b });
      const want = (logic.unsignedOf(a, n) + logic.unsignedOf(b, n)) % m;
      assert.equal(s.unsigned.r, want);
      assert.deepEqual(s.sumBits, logic.bitsOf(want, n));
      assert.equal(s.signed.r, logic.signedOf(want, n));
      assert.equal(((a + b) % m + m) % m, want, 'the signed sum mod 2^n is the same pattern');
      assert.equal(s.trueSum.signed, a + b);
      assert.equal(s.trueSum.unsigned, logic.unsignedOf(a, n) + logic.unsignedOf(b, n));
    }
  }
});

test('rule 2: the carries ripple column by column (0111 1111 + 1)', () => {
  const s = at({ a: 127, b: 1 });
  assert.deepEqual(s.carries, [1, 1, 1, 1, 1, 1, 1, 0], 'a carry into every column above bit 0');
  assert.equal(s.carryOut, 0);
  const z = at({ a: -1, b: 1 });
  assert.deepEqual(z.carries, [1, 1, 1, 1, 1, 1, 1, 0]);
  assert.equal(z.carryOut, 1);
  assert.deepEqual(at({ a: 0x55, b: 0x2a }).carries, [0, 0, 0, 0, 0, 0, 0, 0], '0101 0101 + 0010 1010: no carry');
  // 16 bits: the same rules at the other width (C, Z and the top of the range)
  assert.deepEqual(at({ width: 16, a: -1, b: 1 }).flags, { N: 0, Z: 1, C: 1, V: 0 });
  assert.deepEqual(at({ width: 16, a: -32768, b: -32768 }).flags, { N: 0, Z: 1, C: 1, V: 1 });
  assert.deepEqual(at({ width: 16, a: 32767, b: 1 }).flags, { N: 1, Z: 0, C: 0, V: 1 });
  assert.equal(at({ width: 16, a: 32767, b: 1 }).signed.r, -32768);
  assert.equal(at({ width: 16, a: 40000 - 65536, b: 30000 }).trueSum.unsigned, 40000 + 30000, 'the true unsigned sum does not wrap');
});

test('rule 3: C is the carry out of the top bit, set exactly when the unsigned sum wrapped', () => {
  for (const n of [4, 8]) {
    for (const [a, b] of pairs(n)) {
      const s = at({ width: n, a, b });
      assert.equal(s.flags.C, s.carryOut);
      assert.equal(s.flags.C, s.trueSum.unsigned >= 2 ** n ? 1 : 0, `${a} + ${b}`);
    }
  }
});

test('rule 4: V (same signs in, other sign out) = carry into the top ≠ carry out = the signed sum left the range', () => {
  for (const n of [4, 8]) {
    const { min, max } = logic.rangeOf(n);
    for (const [a, b] of pairs(n)) {
      const s = at({ width: n, a, b });
      assert.equal(s.flags.V, s.carries[0] ^ s.carryOut, `carry rule, ${a} + ${b}`);
      assert.equal(s.flags.V, s.trueSum.signed < min || s.trueSum.signed > max ? 1 : 0, `range, ${a} + ${b}`);
    }
  }
});

test('rule 4: C and V are independent: all four combinations occur', () => {
  const cv = (a, b) => { const f = at({ a, b }).flags; return [f.C, f.V]; };
  assert.deepEqual(cv(10, 20), [0, 0]);
  assert.deepEqual(cv(100, 50), [0, 1]);
  assert.deepEqual(cv(-1, 1), [1, 0]);
  assert.deepEqual(cv(-100, -50), [1, 1]);
});

test('rule 5: N is the top bit of r, Z is r = 0', () => {
  for (const n of [4, 8]) {
    for (const [a, b] of pairs(n)) {
      const s = at({ width: n, a, b });
      assert.equal(s.flags.N, s.sumBits[0]);
      assert.equal(s.flags.N, s.signed.r < 0 ? 1 : 0);
      assert.equal(s.flags.Z, s.unsigned.r === 0 ? 1 : 0);
    }
  }
});

test('rule 6: −x = (~x) + 1; −(−128) is −128 again and flagged', () => {
  const five = logic.negate(5, 8);
  assert.deepEqual(five.bits, [0, 0, 0, 0, 0, 1, 0, 1], 'the operand as it was');
  assert.deepEqual(five.inverted, [1, 1, 1, 1, 1, 0, 1, 0]);
  assert.deepEqual(five.resultBits, [1, 1, 1, 1, 1, 0, 1, 1]);
  assert.equal(five.value, -5);
  assert.equal(five.overflow, false);
  const min = logic.negate(-128, 8);
  assert.deepEqual(min.inverted, [0, 1, 1, 1, 1, 1, 1, 1]);
  assert.equal(min.value, -128);
  assert.equal(min.overflow, true);
  assert.equal(logic.negate(0, 8).value, 0);
  assert.equal(logic.negate(-8, 4).overflow, true);
  assert.equal(logic.negate(-32768, 16).overflow, true);
  assert.equal(logic.negate(-32768, 16).value, -32768);
  assert.equal(logic.negate(300, 8).value, -127, 'the operand is clamped first');
  for (const n of [4, 8, 16]) {
    const { min: lo, max: hi } = logic.rangeOf(n);
    for (let x = lo + 1; x <= hi; x += n === 16 ? 97 : 1) {
      assert.equal(logic.negate(x, n).value, -x || 0, `${x} in ${n} bits`);
      assert.equal(logic.negate(x, n).overflow, false);
    }
  }
});

test('rule 7: clicking a bit flips it and re-reads the value (the top bit moves it by 2^(n−1) twice over: 100 → −28)', () => {
  assert.equal(logic.flipBit(100, 7, 8), -28, '0110 0100 → 1110 0100: 100 − 128');
  assert.equal(logic.flipBit(-28, 7, 8), 100);
  assert.equal(logic.flipBit(100, 0, 8), 101);
  assert.equal(logic.flipBit(101, 0, 8), 100);
  assert.equal(logic.flipBit(0, 3, 4), -8);
  assert.equal(logic.flipBit(30000, 15, 16), 30000 - 32768);
  assert.equal(logic.flipBit(300, 0, 8), 126, 'the operand is clamped first (127 → 126)');
});

test('changed marks: bits that differ, flags that toggled; no bits across a width change (the page skips flags too)', () => {
  assert.deepEqual(logic.changedBits([0, 1, 1, 0], [0, 1, 0, 1]), [2, 3]);
  assert.deepEqual(logic.changedBits(null, [0, 1]), []);
  assert.deepEqual(logic.changedBits([0, 1], [0, 1, 1, 0]), []);
  assert.deepEqual(logic.changedFlags({ N: 0, Z: 0, C: 1, V: 0 }, { N: 1, Z: 0, C: 1, V: 1 }), ['N', 'V']);
  assert.deepEqual(logic.changedFlags({ N: 0, Z: 0, C: 0, V: 0 }, { N: 1, Z: 1, C: 1, V: 1 }), ['N', 'Z', 'C', 'V']);
  assert.deepEqual(logic.changedFlags(null, { N: 0, Z: 0, C: 0, V: 0 }), []);
});

// ── presets (SPEC.md table; numbers checked independently, NOTES.md) ──

test('preset overflow (the default): 0x64 + 0x32 = 0x96, 150 unsigned, −106 signed; C 0, V 1, N 1', () => {
  const s = at(preset('overflow'));
  assert.deepEqual(s.hex, { a: '64', b: '32', r: '96' });
  assert.equal(s.unsigned.r, 150);
  assert.equal(s.signed.r, -106);
  assert.deepEqual(s.flags, { N: 1, Z: 0, C: 0, V: 1 });
  assert.equal(s.trueSum.signed, 150);
  assert.deepEqual(at({}), s, 'the default state is this preset');
});

test('preset max-plus-one: 127 + 1 = 0x80 = −128; V 1, C 0', () => {
  const s = at(preset('max-plus-one'));
  assert.equal(s.hex.r, '80');
  assert.equal(s.signed.r, -128);
  assert.deepEqual(s.flags, { N: 1, Z: 0, C: 0, V: 1 });
});

test('preset carry-not-overflow: 0xFF + 0x01 = 0x00; C 1, V 0, Z 1', () => {
  const s = at(preset('carry-not-overflow'));
  assert.deepEqual(s.hex, { a: 'FF', b: '01', r: '00' });
  assert.deepEqual(s.flags, { N: 0, Z: 1, C: 1, V: 0 });
  assert.equal(s.signed.r, 0);
  assert.equal(s.trueSum.unsigned, 256);
});

test('preset both: 0x9C + 0xCE = 0x6A = 106; C 1, V 1', () => {
  const s = at(preset('both'));
  assert.deepEqual(s.hex, { a: '9C', b: 'CE', r: '6A' });
  assert.equal(s.signed.r, 106);
  assert.deepEqual(s.flags, { N: 0, Z: 0, C: 1, V: 1 });
});

test('preset subtract: 0x05 + 0xFD = 0x02; C 1, V 0', () => {
  const s = at(preset('subtract'));
  assert.deepEqual(s.hex, { a: '05', b: 'FD', r: '02' });
  assert.equal(s.signed.r, 2);
  assert.deepEqual(s.flags, { N: 0, Z: 0, C: 1, V: 0 });
});

test('preset 16-bit: 30000 + 10000 = 0x9C40 = −25 536; V 1', () => {
  const s = at(preset('16-bit'));
  assert.equal(s.n, 16);
  assert.equal(s.hex.r, '9C40');
  assert.equal(s.signed.r, -25536);
  assert.equal(s.unsigned.r, 40000);
  assert.deepEqual(s.flags, { N: 1, Z: 0, C: 0, V: 1 });
});

test('preset params are the SPEC table\'s', () => {
  assert.deepEqual(Object.fromEntries(logic.presets.map((p) => [p.id, p.params])), {
    overflow: { width: 8, a: 100, b: 50 },
    'max-plus-one': { width: 8, a: 127, b: 1 },
    'carry-not-overflow': { width: 8, a: -1, b: 1 },
    both: { width: 8, a: -100, b: -50 },
    subtract: { width: 8, a: 5, b: -3 },
    '16-bit': { width: 16, a: 30000, b: 10000 }
  });
  assert.deepEqual(logic.defaults, { width: 8, a: 100, b: 50, view: 'both' });
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const width of logic.WIDTHS) for (const view of logic.VIEWS) {
    for (const [a, b] of [[0, 0], [-0.4, 1], [100, 50], [-1, 1], [30000, -30000], [1e9, -1e9]]) {
      const s = logic.initial(P({ width, view, a, b }));
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s, JSON.stringify({ width, view, a, b }));
    }
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ width: 16, a: 30000, b: 10000 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both tables', () => {
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `${p.id}: ${k} is a model param`);
    assert.ok(logic.WIDTHS.includes(p.params.width));
    const r = logic.rangeOf(p.params.width);
    assert.ok(p.params.a >= r.min && p.params.a <= r.max && p.params.b >= r.min && p.params.b <= r.max, `${p.id} in range`);
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
      assert.ok(strings[lang]['hint_' + p.id], `${lang} hint of ${p.id}`);
    }
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
