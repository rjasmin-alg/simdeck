// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for crc-error-detection's model (rules: SPEC.md). Run: node --test sims/crc-error-detection/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const last = (over) => at(over, logic.steps(P(over)));
const B = (s) => logic.parse(s);
const S = (bits) => bits.join('');
const flip = (idx) => ({ flip: logic.maskOf(idx) });

// ── tie-breaks first ──

test('rule 7: the generator is XORed only where the leading bit is 1, left to right; leading 0s write no row', () => {
  const d = logic.divide(B('11010111110000'), B('10011'));
  assert.deepEqual(d.rows.map((r) => r.at), [0, 1, 6, 7, 8]);
  for (const r of d.rows) assert.equal(r.before[r.at], 1, 'every row starts on a 1');
  for (const r of d.rows) assert.equal(r.after[r.at], 0, 'and clears it');
  // a message that starts with 0s: no row before the first 1
  assert.deepEqual(logic.divide(B('0010110000'), B('10011')).rows.map((r) => r.at), [2, 4]);
  // all zeros: no row at all, remainder zero
  assert.deepEqual(logic.divide(B('00000000000000'), B('10011')), { rows: [], remainder: [0, 0, 0, 0] });
});

test('rule 7: each row works on the register the row before left (the division is fixed and replayable)', () => {
  const d = logic.divide(B('11010111110000'), B('10011'));
  for (let i = 1; i < d.rows.length; i++) assert.deepEqual(d.rows[i].before, d.rows[i - 1].after);
  assert.deepEqual(S(d.rows[0].after), '01001111110000');
});

test('duplicate flip indices count once', () => {
  assert.equal(logic.maskOf([3, 3]), logic.maskOf([3]));
  assert.deepEqual(logic.flipList(logic.maskOf([6, 3, 3])), [3, 6]);
});

// ── rules ──

test('rule 1: the even parity bit makes the count of 1s even', () => {
  assert.equal(logic.parityBit(B('1101011111')), 0); // eight 1s
  assert.equal(logic.parityBit(B('1101011110')), 1); // seven 1s
  assert.equal(logic.parityBit(B('0000000000')), 0);
  assert.equal(at({}, 0).parity, 0);
});

test('rule 2: parity catches every odd number of flipped bits and misses every even number', () => {
  const sent = B('1101011111').concat([0]);
  for (let mask = 1; mask < 1 << 11; mask++) {
    const idx = [];
    for (let i = 0; i < 11; i++) if (mask & (1 << i)) idx.push(i);
    const c = logic.parityCheck(logic.flipBits(sent, idx));
    assert.equal(c.accept, idx.length % 2 === 0, `flips ${idx}`);
  }
  assert.equal(logic.parityCheck(sent).accept, true, 'no error: accepted');
});

test('rule 3: append deg(gen) zeros, divide modulo 2: the remainder is the FCS (crc-build)', () => {
  const e = logic.encode(B('1101011111'), B('10011'));
  assert.equal(S(e.dividend), '11010111110000');
  assert.equal(e.rows.length, 5);
  assert.equal(S(e.fcs), '0010');
  assert.equal(S(e.codeword), '11010111110010');
  // the FCS is deg(gen) bits long for every generator
  assert.equal(S(logic.encode(B('1101011111'), B('1011')).fcs), '011');
  assert.equal(S(logic.encode(B('1101011111'), B('100000111')).fcs), '10100101');
});

test('rule 3: XOR has no borrows: 0 ⊕ 1 = 1 where long division in base 10 would borrow', () => {
  // 1000 ÷ 1011: one row, 1000 ⊕ 1011 = 0011 (subtraction would give a negative number and borrow)
  const d = logic.divide(B('1000'), B('1011'));
  assert.deepEqual(d.rows.map((r) => S(r.after)), ['0011']);
  assert.equal(S(d.remainder), '011');
});

test('rule 4: the receiver divides the whole codeword: remainder 0 accepts, non-zero detects', () => {
  for (const g of logic.GENS) {
    const cw = logic.encode(B('1101011111'), B(g)).codeword;
    const c = logic.check(cw, B(g));
    assert.equal(c.accept, true, g);
    assert.ok(c.remainder.every((b) => b === 0));
  }
  const bad = logic.check(B('11000111110010'), B('10011'));
  assert.equal(S(bad.remainder), '0111');
  assert.equal(bad.accept, false);
});

test('rule 5: CRC-4 x⁴+x+1 catches every burst of length ≤ 4 and every single-bit error, anywhere in the codeword', () => {
  const gen = B('10011');
  const cw = logic.encode(B('1101011111'), gen).codeword;
  for (let len = 1; len <= 4; len++) {
    for (let start = 0; start + len <= cw.length; start++) {
      // a burst starts and ends with a flipped bit; the bits between may or may not flip
      for (let inner = 0; inner < (len > 2 ? 1 << (len - 2) : 1); inner++) {
        const idx = [start];
        for (let j = 1; j < len - 1; j++) if (inner & (1 << (j - 1))) idx.push(start + j);
        if (len > 1) idx.push(start + len - 1);
        assert.equal(logic.check(logic.flipBits(cw, idx), gen).accept, false, `burst ${idx}`);
      }
    }
  }
});

test('rule 5: the guarantee is the degree: a burst of length r + 1 can slip through', () => {
  const gen = B('10011');
  const cw = logic.encode(B('1101011111'), gen).codeword;
  // the error pattern 10011 itself (length 5) is the generator: missed
  assert.equal(logic.check(logic.flipBits(cw, [5, 8, 9]), gen).accept, true);
});

test('rule 6: CRC misses exactly the error patterns that are multiples of the generator', () => {
  const gen = B('10011');
  const cw = logic.encode(B('1101011111'), gen).codeword;
  for (let mask = 1; mask < 1 << 14; mask++) {
    const e = [];
    for (let i = 0; i < 14; i++) e.push((mask >> (13 - i)) & 1);
    const multiple = logic.divide(e, gen).remainder.every((b) => b === 0);
    const idx = e.map((b, i) => (b ? i : -1)).filter((i) => i >= 0);
    assert.equal(logic.check(logic.flipBits(cw, idx), gen).accept, multiple, `pattern ${S(e)}`);
  }
});

test('verdicts: ok without errors, detected when the check fails, missed when an error passes', () => {
  assert.equal(logic.verdict(true, false), 'ok');
  assert.equal(logic.verdict(false, true), 'detected');
  assert.equal(logic.verdict(true, true), 'missed');
});

// ── the run and the presets (numbers from SPEC.md, checked by a script before coding) ──

test('steps: k XOR rows + the FCS step; three more (line, parity, CRC) when bits are flipped', () => {
  assert.equal(logic.steps(P({})), 6);
  assert.equal(logic.steps(P(flip([3]))), 9);
  assert.equal(logic.steps(P({ gen: '1011' })), 7); // six rows for CRC-3
  assert.equal(logic.steps(P({ data: 0 })), 1); // no row at all
  assert.deepEqual([0, 1, 5, 6].map((n) => at({}, n).phase), ['start', 'divide', 'divide', 'sent']);
  assert.deepEqual([6, 7, 8, 9].map((n) => at(flip([3]), n).phase), ['sent', 'line', 'parity', 'crc']);
});

test('the run reveals one division row per step, the FCS only when sent, the errors only on the line', () => {
  for (let n = 0; n <= 5; n++) assert.equal(at({}, n).rows.length, n);
  assert.equal(at({}, 5).fcs, null);
  assert.equal(at({}, 5).codeword, null);
  assert.equal(S(at({}, 6).codeword), '11010111110010');
  assert.equal(S(at({}, 6).fcs), '0010');
  const p = flip([3, 4, 5, 6]);
  assert.deepEqual(at(p, 6).flipped, []);
  assert.equal(at(p, 6).received, null);
  assert.deepEqual(at(p, 6).planned, [3, 4, 5, 6]);
  assert.deepEqual(at(p, 7).flipped, [3, 4, 5, 6]);
  assert.equal(at(p, 7).parityCheck, null);
  assert.equal(at(p, 8).crcCheck, null);
});

test('preset crc-build: 1101011111 ÷ 10011 → FCS 0010, codeword 11010111110010, 6 steps', () => {
  const s = last({});
  assert.equal(logic.steps(P({})), 6);
  assert.equal(s.phase, 'sent');
  assert.equal(S(s.codeword), '11010111110010');
  assert.equal(s.rows.length, 5);
});

test('preset crc-catches-burst: bits 3–6 → 11001001110010, remainder 0011 detected; parity (four flips) misses', () => {
  const s = last(flip([3, 4, 5, 6]));
  assert.equal(S(s.received), '11001001110010');
  assert.equal(S(s.crcCheck.remainder), '0011');
  assert.equal(s.crcCheck.verdict, 'detected');
  assert.equal(s.parityCheck.ones % 2, 0);
  assert.equal(s.parityCheck.verdict, 'missed');
});

test('preset parity-catches: bit 3 → remainder 0111 and an odd count: both detect', () => {
  const s = last(flip([3]));
  assert.equal(S(s.received), '11000111110010');
  assert.equal(S(s.crcCheck.remainder), '0111');
  assert.equal(s.crcCheck.verdict, 'detected');
  assert.equal(s.parityCheck.ones, 7);
  assert.equal(s.parityCheck.verdict, 'detected');
});

test('preset crc-blind-spot: bits 2, 5, 6 (x⁷·(x⁴+x+1)) → remainder 0000, CRC misses; parity (three flips) detects', () => {
  const s = last(flip([2, 5, 6]));
  assert.equal(S(s.received), '11110001110010');
  assert.equal(S(s.crcCheck.remainder), '0000');
  assert.equal(s.crcCheck.verdict, 'missed');
  assert.equal(s.parityCheck.verdict, 'detected');
});

test('a message of odd weight: P = 1 is sent and counted by the receiver', () => {
  // 1101011110 has seven 1s, so P = 1; bit 3 flipped leaves six 1s in the message, seven with P: odd
  const s = last({ data: logic.valueOf('1101011110'), ...flip([3]) });
  assert.equal(at({ data: logic.valueOf('1101011110') }, 0).parity, 1);
  assert.equal(s.receivedParity[10], 1);
  assert.equal(s.parityCheck.ones, 7);
  assert.equal(s.parityCheck.verdict, 'detected');
});

test('the receiver divides the received frame by the chosen generator, with its own rows', () => {
  const s = last(flip([3, 4, 5, 6]));
  assert.equal(s.crcCheck.rows.length, 9);
  assert.deepEqual(s.crcCheck.rows[0].before, s.received);
  for (const g of ['1011', '100000111']) {
    const t = last({ gen: g, ...flip([3]) });
    assert.equal(t.crcCheck.remainder.length, g.length - 1, g);
    assert.deepEqual(t.crcCheck.remainder, logic.divide(t.received, B(g)).remainder, g);
    assert.equal(t.crcCheck.verdict, 'detected', g);
  }
});

test('any non-zero error pattern adds the three receiver steps, even the last bit alone', () => {
  assert.equal(logic.steps(P({ flip: 1 })), 9);
  assert.deepEqual(last({ flip: 1 }).flipped, [9]);
});

test('the same flipped data bits hit both frames; the check bits are never flipped', () => {
  const s = last(flip([0, 9]));
  assert.deepEqual(s.receivedParity.slice(0, 10), s.received.slice(0, 10));
  assert.equal(s.receivedParity[10], s.parity);
  assert.deepEqual(s.received.slice(10), s.fcs);
});

test('every step stays within 20 for every message and generator', () => {
  for (const g of logic.GENS) {
    for (let d = 0; d < 1 << logic.N; d++) assert.ok(logic.steps(P({ data: d, gen: g, flip: 1 })) <= 20);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  const p = P({ gen: '100000111', flip: 77 });
  for (let n = 0; n <= logic.steps(p); n++) {
    const s = kit.stateAt(logic, p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ data: 601, gen: '1011', flip: 120 });
  const steps = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P(flip([3]));
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
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the model at the defaults');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
