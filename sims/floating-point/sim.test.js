// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for floating-point: the rules of SPEC.md (tie-breaks first), the presets' numbers, the model against the
// platform's own binary64 and Math.fround arithmetic, then the generic block.
// Run: node --test sims/floating-point/sim.test.js
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
const F32 = logic.FORMATS.binary32, F64 = logic.FORMATS.binary64;
/** Round a decimal text to a format; the pattern's hex. */
const hexOf = (text, F) => logic.hexString(logic.roundRational(logic.parseDecimal(text).r, F).pattern, F);
/** The platform's own rounding of a decimal text, as hex. binary32 goes through binary64 first (double rounding):
    right for the texts used here, not an exact oracle in general. */
function platformHex(text, F) {
  const dv = new DataView(new ArrayBuffer(8));
  if (F.bits === 64) { dv.setFloat64(0, Number(text)); return dv.getBigUint64(0).toString(16).toUpperCase().padStart(16, '0'); }
  dv.setFloat32(0, Math.fround(Number(text))); return dv.getUint32(0).toString(16).toUpperCase().padStart(8, '0');
}
function hexOfNumber(x, F) {
  const dv = new DataView(new ArrayBuffer(8));
  if (F.bits === 64) { dv.setFloat64(0, x); return dv.getBigUint64(0).toString(16).toUpperCase().padStart(16, '0'); }
  dv.setFloat32(0, x); return dv.getUint32(0).toString(16).toUpperCase().padStart(8, '0');
}

function everyParams() {
  const out = [];
  for (const format of logic.FORMAT_IDS) for (const value of logic.VALUE_IDS) {
    out.push({ format, value });
    if (value === 'typed') for (const text of ['', '0,1', '-2.5e-3', 'abc', '1e999', '-1e-999', 'inf', 'nan']) out.push({ format, value, text });
    if (value === 'bits') for (const hex of ['', '3F800001', '7FF0000000000001', '0x80000000']) out.push({ format, value, hex });
  }
  for (const a of logic.OPERANDS) for (const b of logic.OPERANDS) out.push({ format: 'binary32', value: 'sum', a, b });
  return out;
}

// ── tie-breaks first ──

test('tie-break rule 4: a tie goes to the even neighbour (2^24 + 1, 2^24 + 3 in binary32; 2^53 + 1 in binary64)', () => {
  assert.equal(hexOf('16777217', F32), '4B800000', '2^24 + 1 → 2^24 (even), not 2^24 + 2');
  assert.equal(hexOf('16777219', F32), '4B800002', '2^24 + 3 → 2^24 + 4 (even), not 2^24 + 2');
  assert.equal(logic.roundRational(logic.parseDecimal('16777217').r, F32).tie, true);
  assert.equal(hexOf('9007199254740993', F64), '4340000000000000', '2^53 + 1 → 2^53');
  assert.equal(hexOf('9007199254740995', F64), '4340000000000002', '2^53 + 3 → 2^53 + 4');
  assert.equal(hexOf('16777218', F32), '4B800001', 'not a tie: exact');
});

test('tie-break rule 4 at the bottom: half the smallest subnormal goes to 0, 1.5 of it to 2 (even)', () => {
  const half = logic.rat(0, 1n, 2n ** 150n);                 // 2^-150 = ½ · 2^-149
  assert.equal(logic.hexString(logic.roundRational(half, F32).pattern, F32), '00000000');
  const threeHalves = logic.rat(0, 3n, 2n ** 150n);
  assert.equal(logic.hexString(logic.roundRational(threeHalves, F32).pattern, F32), '00000002');
  const justOver = logic.rat(0, 2n ** 60n + 1n, 2n ** 210n);   // a hair above ½ · 2^-149
  assert.equal(logic.hexString(logic.roundRational(justOver, F32).pattern, F32), '00000001');
});

test('tie-break rule 4 at the top: max + ½ ULP goes to ∞; just below stays max', () => {
  const max = 2n ** 128n - 2n ** 104n, halfUlp = 2n ** 103n;
  assert.equal(logic.hexString(logic.roundRational(logic.rat(0, max + halfUlp, 1n), F32).pattern, F32), '7F800000');
  assert.equal(logic.hexString(logic.roundRational(logic.rat(0, max + halfUlp - 1n, 1n), F32).pattern, F32), '7F7FFFFF');
  assert.equal(logic.hexString(logic.roundRational(logic.rat(1, max + halfUlp, 1n), F32).pattern, F32), 'FF800000');
});

test('tie-break rule 9: absorption is named before equality (16777216 + 1)', () => {
  const s = at(preset('big-plus-one')).sum;
  assert.equal(s.equal, true, '16777217 rounded is 16777216 too');
  assert.equal(s.absorbed, 'b');
  assert.equal(s.rounded.tie, true);
  assert.equal(at({ format: 'binary32', a: '1', b: '16777216' }).sum.absorbed, 'a');
  assert.equal(at({ format: 'binary64', a: '1e16', b: '1' }).sum.absorbed, 'b');
  assert.equal(at({ format: 'binary64', a: '0.1', b: '0.2' }).sum.absorbed, null);
});

test('tie-break: unreadable text is +0 with an error, empty text +0 without one; bad params fall back', () => {
  const bad = at({ value: 'typed', text: '1.2.3' });
  assert.equal(bad.source.error, true);
  assert.equal(bad.kind, 'zero');
  assert.equal(bad.sign, 0);
  const empty = at({ value: 'typed', text: '   ' });
  assert.equal(empty.source.error, false);
  assert.equal(empty.source.empty, true);
  assert.equal(empty.hex, '0000000000000000');
  const fb = at({ format: 'binary16', value: 'nope', a: '42', b: null });
  assert.equal(fb.format, 'binary64');
  assert.equal(fb.hex, '3FB999999999999A');
  assert.equal(fb.sum.a.dec, '0.1');
  assert.equal(fb.sum.b.dec, '0.2');
});

// ── rule 1: formats and normal numbers ──

test('rule 1: field widths and biases', () => {
  assert.deepEqual([F32.w, F32.p, F32.bias, F32.bits], [8, 23, 127, 32]);
  assert.deepEqual([F64.w, F64.p, F64.bias, F64.bits], [11, 52, 1023, 64]);
});

test('rule 1: a normal number decodes as (−1)^s × (1 + f/2^p) × 2^(e − bias)', () => {
  const s = at(preset('point-one'));
  assert.equal(s.hex, '3DCCCCCD');
  assert.deepEqual([s.sign, s.expStored, s.expUnbiased, s.fraction], [0, 123, -4, 5033165]);
  assert.equal(s.kind, 'normal');
  assert.equal(s.exact, '0.100000001490116119384765625');
  assert.equal(s.significand, '1.60000002384185791015625');
  assert.equal(s.expBits, '01111011');
  assert.equal(s.fractionBits, '10011001100110011001101');
  assert.equal(s.bits, '0' + s.expBits + s.fractionBits);
  const neg = at({ format: 'binary64', value: 'typed', text: '-2' });
  assert.deepEqual([neg.hex, neg.sign, neg.expUnbiased, neg.exact], ['C000000000000000', 1, 1, '-2']);
});

// ── rule 2: zeros and subnormals ──

test('rule 2: two zeros; a subnormal has no hidden 1 and exponent 1 − bias', () => {
  const z = at({ format: 'binary32', value: 'neg-zero' });
  assert.deepEqual([z.hex, z.kind, z.sign, z.exact, z.shortest], ['80000000', 'zero', 1, '0', '-0']);
  const pz = at({ format: 'binary32', value: 'typed', text: '0' });
  assert.deepEqual([pz.hex, pz.kind, pz.sign], ['00000000', 'zero', 0]);
  assert.equal(logic.ratEq(logic.decode(0x80000000n, F32).value, logic.decode(0n, F32).value), true, '+0 = −0');
  const sub = at({ format: 'binary32', value: 'min-sub' });
  assert.deepEqual([sub.hex, sub.kind, sub.expStored, sub.expUnbiased, sub.fraction], ['00000001', 'subnormal', 0, -126, 1]);
  assert.equal(sub.exact, '0.00000000000000000000000000000000000000000000140129846432481707092372958328991613128026194187651577175706828388979108268586060148663818836212158203125');
  assert.equal(sub.significand, '0.00000011920928955078125');
  const big = at({ format: 'binary32', value: 'bits', hex: '007FFFFF' });
  assert.equal(big.kind, 'subnormal');
  assert.equal(logic.describe(0x00800000n, F32).kind, 'normal');
  const d = at({ format: 'binary64', value: 'min-sub' });
  assert.equal(d.hex, '0000000000000001');
  assert.equal(d.exact.length, 2 + 1074, '1074 decimal places');
  assert.equal(d.ulp.exp, -1074);
});

// ── rule 3: infinity and NaN ──

test('rule 3: exponent all ones: f = 0 is ±∞, f ≠ 0 is NaN (any payload)', () => {
  const inf = at({ format: 'binary32', value: 'inf' });
  assert.deepEqual([inf.hex, inf.kind, inf.exact, inf.ulp], ['7F800000', 'inf', null, null]);
  assert.equal(at({ format: 'binary32', value: 'bits', hex: 'FF800000' }).sign, 1);
  const nan = at({ format: 'binary32', value: 'nan' });
  assert.deepEqual([nan.hex, nan.kind, nan.shortest, nan.expUnbiased], ['7FC00000', 'nan', 'NaN', null]);
  assert.equal(at({ format: 'binary32', value: 'bits', hex: '7F800001' }).kind, 'nan', 'smallest payload');
  assert.equal(at({ format: 'binary64', value: 'nan' }).hex, '7FF8000000000000');
  assert.equal(at({ format: 'binary64', value: 'max' }).hex, '7FEFFFFFFFFFFFFF');
  assert.equal(at({ format: 'binary64', value: 'max' }).kind, 'normal');
});

// ── rule 4: decimal input ──

test('rule 4: decimals round to the nearest number, as the platform rounds them', () => {
  const texts = ['0.1', '0.2', '0.3', '0.7', '1', '3', '1e16', '16777216', '123.456', '-7.25', '1e-40', '3e-320',
    '2.2250738585072011e-308', '1.7976931348623157e308', '3.4028235e38', '1.401298464324817e-45', '0.000001', '6.02214076e23'];
  for (const t of texts) {
    assert.equal(hexOf(t, F64), platformHex(t, F64), `binary64 ${t}`);
    assert.equal(hexOf(t, F32), platformHex(t, F32), `binary32 ${t}`);
  }
});

test('rule 4: a decimal comma, an exponent, a sign, inf and nan are read; overflow → ∞, underflow → 0', () => {
  assert.equal(at({ value: 'typed', text: '0,1' }).hex, '3FB999999999999A');
  assert.equal(at({ value: 'typed', text: '.5' }).hex, '3FE0000000000000');
  assert.equal(at({ value: 'typed', text: '2.5E-3' }).hex, platformHex('2.5e-3', F64));
  assert.equal(at({ value: 'typed', text: '−1' }).hex, 'BFF0000000000000', 'a typographic minus');
  assert.equal(at({ value: 'typed', text: '-inf' }).hex, 'FFF0000000000000');
  assert.equal(at({ value: 'typed', text: '∞' }).kind, 'inf');
  assert.equal(at({ value: 'typed', text: 'NaN' }).kind, 'nan');
  const o = at({ format: 'binary32', value: 'typed', text: '1e39' });
  assert.deepEqual([o.kind, o.source.overflow], ['inf', true]);
  const o2 = at({ value: 'typed', text: '1e99999' });
  assert.deepEqual([o2.kind, o2.source.overflow], ['inf', true]);
  const u = at({ format: 'binary32', value: 'typed', text: '1e-50' });
  assert.deepEqual([u.kind, u.source.underflow], ['zero', true]);
  const u2 = at({ value: 'typed', text: '-1e-99999' });
  assert.deepEqual([u2.kind, u2.sign, u2.source.underflow], ['zero', 1, true]);
  assert.equal(logic.parseDecimal('1e').ok, false);
  assert.equal(logic.parseDecimal('').ok, false);
  assert.equal(logic.parseDecimal('0x10').ok, false);
});

test('rule 4: the input error is stored − typed, exact', () => {
  const s = at(preset('point-one'));
  assert.equal(s.source.inexact, true);
  assert.equal(s.source.diff, '0.000000001490116119384765625');
  assert.equal(s.source.diffApprox, '1.49e-9');
  const one = at({ format: 'binary32', value: 'one' });
  assert.equal(one.source.inexact, false);
  assert.equal(one.source.diff, '0');
  const t = at({ format: 'binary64', value: 'typed', text: '0.3' });
  assert.equal(t.source.diffApprox, '-1.11e-17');
});

// ── rule 5: correct rounding of a + b ──

test('rule 5: a + b is the rounded sum of the two rounded operands, as the platform adds them', () => {
  for (const a of logic.OPERANDS) for (const b of logic.OPERANDS) {
    const s64 = logic.sumOf(a, b, F64), s32 = logic.sumOf(a, b, F32);
    assert.equal(s64.rounded.hex, hexOfNumber(Number(a) + Number(b), F64), `binary64 ${a} + ${b}`);
    assert.equal(s32.rounded.hex, hexOfNumber(Math.fround(Math.fround(Number(a)) + Math.fround(Number(b))), F32), `binary32 ${a} + ${b}`);
  }
});

test('rule 5: the expected number is the decimal sum rounded once; equal means the same number', () => {
  const s = at(preset('sum-64')).sum;
  assert.equal(s.expected.dec, '0.3');
  assert.equal(s.expected.hex, '3FD3333333333333');
  assert.equal(s.equal, false);
  assert.equal(s.ulpsApart, 1);
  for (const [a, b, eq] of [['0.1', '0.2', false], ['0.1', '0.7', false], ['0.5', '1', true], ['0.3', '0.7', true], ['1e16', '1', true]]) {
    const r = logic.sumOf(a, b, F64);
    assert.equal(r.equal, eq, `${a} + ${b}`);
    assert.equal(r.equal, (Number(a) + Number(b)) === Number(r.expected.dec), `${a} + ${b} as the platform compares`);
  }
  const below = logic.sumOf('0.7', '0.1', F64);
  assert.equal(below.ulpsApart, -1, '0.7 + 0.1 = 0.7999999999999999, one below 0.8');
});

test('rule 5: an exact operation is not rounded', () => {
  const s = logic.sumOf('0.5', '1', F32);
  assert.equal(s.exactSum, '1.5');
  assert.equal(s.rounded.inexact, false);
  assert.equal(s.a.inexact, false);
});

// ── rule 6: exact decimal value ──

test('rule 6: every binary fraction is written with all its digits; a non-binary fraction has none', () => {
  assert.equal(logic.decimalOf(logic.rat(0, 1n, 2n ** 10n)), '0.0009765625');
  assert.equal(logic.decimalOf(logic.rat(1, 5n, 4n)), '-1.25');
  assert.equal(logic.decimalOf(logic.rat(0, 3n, 10n)), '0.3');
  assert.equal(logic.decimalOf(logic.rat(0, 1n, 3n)), null);
  assert.equal(logic.decimalOf(logic.rat(0, 0n, 1n)), '0');
  const max = at({ format: 'binary32', value: 'max' });
  assert.equal(max.exact, '340282346638528859811704183484516925440');
  assert.equal(at({ format: 'binary64', value: 'max' }).exact.length, 309);
  assert.equal(at({ format: 'binary64', value: 'p01' }).exact, '0.1000000000000000055511151231257827021181583404541015625');
});

// ── rule 7: ULP ──

test('rule 7: the ULP is 2^(max(e,1) − bias − p): the gap to the next number away from zero', () => {
  assert.equal(at({ format: 'binary32', value: 'one' }).ulp.exp, -23);
  assert.equal(at(preset('point-one')).ulp.exp, -27);
  assert.equal(at({ format: 'binary32', value: 'two24' }).ulp.exp, 1);
  assert.equal(at({ format: 'binary32', value: 'max' }).ulp.exp, 104);
  assert.equal(at({ format: 'binary32', value: 'min-normal' }).ulp.exp, -149);
  assert.equal(at({ format: 'binary32', value: 'neg-zero' }).ulp.exp, -149);
  assert.equal(at({ format: 'binary64', value: 'sum' }).ulp.approx, '5.55e-17');
  // the gap really is the next pattern's distance
  const one = logic.decode(0x3F800000n, F32).value, next = logic.decode(0x3F800001n, F32).value;
  assert.equal(logic.decimalOf(logic.ratAdd(next, logic.rat(1, one.n, one.d))), '0.00000011920928955078125');
});

// ── rule 8: ULPs apart ──

test('rule 8: ULPs apart is the pattern difference', () => {
  assert.equal(logic.sumOf('0.1', '0.2', F64).ulpsApart, 1);
  assert.equal(logic.sumOf('0.1', '0.2', F32).ulpsApart, 0);
  assert.equal(logic.sumOf('0.1', '0.7', F64).ulpsApart, -1);
});

// ── rule 10: format change ──

test('rule 10: a typed value is rounded again; a clicked pattern is converted by its own length', () => {
  assert.equal(at({ format: 'binary32', value: 'typed', text: '0.1' }).hex, '3DCCCCCD');
  assert.equal(at({ format: 'binary64', value: 'typed', text: '0.1' }).hex, '3FB999999999999A');
  const up = at({ format: 'binary64', value: 'bits', hex: '3DCCCCCD' });
  assert.equal(up.exact, '0.100000001490116119384765625', 'binary32 → binary64 is exact');
  assert.equal(at({ format: 'binary32', value: 'bits', hex: '3FD3333333333334' }).hex, '3E99999A', 'rounded down a format');
  assert.equal(at({ format: 'binary32', value: 'bits', hex: '7FF0000000000000' }).hex, '7F800000', '∞ stays ∞');
  assert.equal(at({ format: 'binary32', value: 'bits', hex: 'FFF0000000000123' }).hex, 'FFC00000', 'NaN → quiet NaN, sign kept');
  assert.equal(at({ format: 'binary64', value: 'bits', hex: '7F800001' }).hex, '7FF8000000000000');
  assert.equal(at({ format: 'binary32', value: 'bits', hex: '47EFFFFFF0000000' }).kind, 'inf', 'binary32 max + ½ ULP → ∞');
  assert.equal(at({ format: 'binary32', value: 'bits', hex: '47EFFFFFE0000000' }).hex, '7F7FFFFF', 'binary32 max itself');
  assert.equal(at({ format: 'binary32', value: 'bits', hex: '0x3f800000' }).hex, '3F800000', '0x and lower case');
  assert.equal(at({ format: 'binary32', value: 'bits', hex: '' }).hex, '00000000');
});

test('rule 10: flipBit flips one bit of the current pattern (0 = least significant)', () => {
  assert.equal(logic.flipBit('3F800000', 0, F32), '3F800001');
  assert.equal(logic.flipBit('3F800000', 31, F32), 'BF800000');
  assert.equal(logic.flipBit('3FB999999999999A', 63, F64), 'BFB999999999999A');
  assert.equal(logic.flipBit('3DCCCCCD', 63, F64), 'BFB99999A0000000', 'a binary32 pattern is converted first');
});

// ── rule 11: changed bits ──

test('rule 11: changed bits are the positions that differ in the same format; none across formats', () => {
  assert.deepEqual(logic.changedBits('0011', '0110'), [1, 3]);
  assert.deepEqual(logic.changedBits('0011', '0011'), []);
  assert.deepEqual(logic.changedBits(null, '0011'), []);
  assert.deepEqual(logic.changedBits('0011', '00110011'), []);
});

// ── rule 12: printed as ──

test('rule 12: printed as is the shortest decimal that reads back', () => {
  assert.equal(at(preset('point-one')).shortest, '0.1');
  assert.equal(at({ format: 'binary32', value: 'bits', hex: '3F800001' }).shortest, '1.0000001');
  assert.equal(at({ format: 'binary32', value: 'max' }).shortest, '3.4028235e+38');
  assert.equal(at({ format: 'binary32', value: 'min-sub' }).shortest, '1e-45');
  assert.equal(at(preset('sum-64')).shortest, '0.30000000000000004');
  assert.equal(at({ format: 'binary64', value: 'inf' }).shortest, 'Infinity');
});

test('approximations: three significant digits from the exact digits, a carry into the next power', () => {
  assert.equal(logic.approxOf('0.000000001490116119384765625'), '1.49e-9');
  assert.equal(logic.approxOf('9.996'), '1.00e1', '9.996 rounds up to 10.0');
  assert.equal(logic.approxOf('-123456'), '-1.23e5');
  assert.equal(logic.approxOf('0'), '0');
  assert.equal(logic.approxOf(null), null);
});

test('review: inputs that round down or up are inexact; operands too; zero keeps its exponent 1 − bias', () => {
  assert.equal(at({ value: 'p03' }).source.inexact, true, 'binary64 0.3 rounds down');
  assert.equal(at({ value: 'p01' }).source.inexact, true, 'binary64 0.1 rounds up');
  const s = logic.sumOf('0.1', '0.1', F64);
  assert.equal(s.a.inexact, true);
  assert.equal(s.b.inexact, true);
  assert.equal(s.rounded.inexact, false, '0.1 + 0.1 is an exact doubling');
  assert.equal(logic.sumOf('1', '3', F64).a.inexact, false);
  assert.equal(at({ format: 'binary32', value: 'neg-zero' }).expUnbiased, -126);
  assert.equal(at({ format: 'binary64', value: 'typed', text: '0' }).expUnbiased, -1022);
});

test('review: below 10^-400 the input is inexact with no error shown; binary fractions are flagged dyadic', () => {
  const t = at({ value: 'typed', text: '1e-500' });
  assert.deepEqual([t.kind, t.source.inexact, t.source.diff, t.source.underflow], ['zero', true, null, true]);
  assert.equal(at({ format: 'binary32', value: 'typed', text: '16777217' }).source.dyadic, true);
  assert.equal(at({ format: 'binary32', value: 'typed', text: '0.375' }).source.dyadic, true);
  assert.equal(at({ value: 'p01' }).source.dyadic, false);
});

test('review: isMax marks the largest finite number only', () => {
  assert.equal(at({ format: 'binary32', value: 'max' }).isMax, true);
  assert.equal(at({ format: 'binary64', value: 'typed', text: '1.7976931348623157e308' }).isMax, true);
  assert.equal(at({ format: 'binary32', value: 'bits', hex: 'FF7FFFFF' }).isMax, true, 'negative max too');
  assert.equal(at({ format: 'binary32', value: 'bits', hex: '7F7FFFFE' }).isMax, false);
  assert.equal(at({ format: 'binary32', value: 'inf' }).isMax, false);
});

test('review: printed as tries the neighbour above at powers of two; nine digits when needed; binary64 its own', () => {
  assert.equal(logic.shortestOf(0x0F800000n, F32), '1.2621775e-29');
  assert.equal(logic.shortestOf(0x6B000000n, F32), '1.5474251e+26');
  assert.equal(logic.shortestOf(0x6C800000n, F32), '1.2379401e+27');
  assert.equal(logic.shortestOf(0x3DCCCCD0n, F32), '0.100000024', 'nine digits');
  assert.equal(at({ format: 'binary64', value: 'bits', hex: '3F800001' }).shortest, '1.0000001192092896');
  for (let i = 0; i < 254; i++) {                              // every binary32 power of two reads back
    const pat = BigInt(i + 1) << 23n, s = logic.shortestOf(pat, F32);
    assert.equal(logic.hexString(logic.roundRational(logic.parseDecimal(s).r, F32).pattern, F32), logic.hexString(pat, F32), s);
  }
});

test('review: a NaN payload in its own format is kept; -nan and infinity are read; 9 and 17 hex digits', () => {
  assert.equal(at({ format: 'binary32', value: 'bits', hex: '7F800001' }).hex, '7F800001');
  assert.equal(at({ value: 'typed', text: '-nan' }).sign, 1);
  assert.equal(at({ value: 'typed', text: 'Infinity' }).kind, 'inf');
  assert.equal(logic.hexString(logic.patternOfHex('123456789', F64), F64), '0000000123456789', '9 digits are binary64');
  assert.equal(logic.cleanHex('0x' + '1'.repeat(17)), '1'.repeat(16));
  assert.equal(logic.approxOf('-1'), '-1.00', 'no e0');
  assert.equal(at({ format: 'binary64', value: 'max' }).ulp.approx, '2.00e292', 'no e+');
});

// ── presets: the SPEC table ──

test('preset sum-64: 0x3FD3333333333334, a tie rounded to even, one ULP above 0.3', () => {
  const s = at(preset('sum-64'));
  assert.equal(s.hex, '3FD3333333333334');
  assert.equal(s.exact, '0.3000000000000000444089209850062616169452667236328125');
  const sum = s.sum;
  assert.equal(sum.a.hex, '3FB999999999999A');
  assert.equal(sum.b.hex, '3FC999999999999A');
  assert.equal(sum.exactSum, '0.3000000000000000166533453693773481063544750213623046875');
  assert.equal(sum.rounded.tie, true);
  assert.equal(sum.expected.exact, '0.299999999999999988897769753748434595763683319091796875');
  assert.equal(sum.rounded.ulp.approx, '5.55e-17');
});

test('preset sum-32: 0.1f + 0.2f = 0x3E99999A = 0.3f, equal', () => {
  const s = at(preset('sum-32'));
  assert.equal(s.hex, '3E99999A');
  assert.equal(s.sum.exactSum, '0.300000004470348358154296875');
  assert.equal(s.sum.rounded.exact, '0.300000011920928955078125');
  assert.equal(s.sum.expected.hex, '3E99999A');
  assert.equal(s.sum.equal, true);
  assert.equal(s.sum.rounded.tie, false);
});

test('presets one-and-next, specials, big-plus-one', () => {
  const one = at(preset('one-and-next'));
  assert.deepEqual([one.hex, one.expStored, one.expUnbiased, one.fraction], ['3F800000', 127, 0, 0]);
  const next = at({ format: 'binary32', value: 'bits', hex: logic.flipBit(one.hex, 0, F32) });
  assert.equal(next.exact, '1.00000011920928955078125');
  assert.equal(at(preset('specials')).hex, '7F800000');
  assert.equal(at({ format: 'binary32', value: 'min-normal' }).hex, '00800000');
  assert.equal(at({ format: 'binary32', value: 'min-normal' }).exact.slice(0, 50), '0.000000000000000000000000000000000000011754943508');
  const big = at(preset('big-plus-one'));
  assert.equal(big.hex, '4B800000');
  assert.equal(big.sum.exactSum, '16777217');
  assert.equal(big.sum.rounded.ulp.exp, 1);
});

test('preset params are the SPEC table\'s; the default is the binary64 0.1 + 0.2 story', () => {
  assert.deepEqual(Object.fromEntries(logic.presets.map((p) => [p.id, p.params])), {
    'point-one': { format: 'binary32', value: 'p01' },
    'sum-64': { format: 'binary64', value: 'sum', a: '0.1', b: '0.2' },
    'sum-32': { format: 'binary32', value: 'sum', a: '0.1', b: '0.2' },
    'one-and-next': { format: 'binary32', value: 'one' },
    specials: { format: 'binary32', value: 'inf' },
    'big-plus-one': { format: 'binary32', value: 'sum', a: '16777216', b: '1' }
  });
  assert.deepEqual(logic.defaults, { format: 'binary64', value: 'p01', a: '0.1', b: '0.2', text: '', hex: '', digits: false });
  const d = at({});
  assert.equal(d.hex, '3FB999999999999A');
  assert.equal(d.sum.equal, false);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of everyParams()) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, JSON.stringify(p));
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ format: 'binary32', value: 'typed', text: '0.1' });
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
    assert.ok(logic.FORMAT_IDS.includes(p.params.format));
    assert.ok(logic.VALUE_IDS.includes(p.params.value));
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
      assert.ok(strings[lang]['hint_' + p.id], `${lang} hint of ${p.id}`);
    }
  }
  for (const v of logic.VALUE_IDS) for (const lang of ['hr', 'en']) assert.ok(strings[lang]['value_' + v], `${lang} ${v}`);
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
