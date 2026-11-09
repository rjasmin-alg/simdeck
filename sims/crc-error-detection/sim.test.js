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

// ── Hamming(15,11), the fec-hamming presets (SPEC.md "Hamming(15,11)") ──

const HAM = { gen: logic.HAMMING };
const H = (over) => P(Object.assign({}, HAM, over));
const hat = (over, n) => kit.stateAt(logic, H(over), n);
const hflip = (pos) => ({ hflip: logic.hmaskOf(pos) });
const WORD = '111101100011101'; // 10110011101 encoded (task; independent Python check in NOTES.md)

// tie-breaks first

test('H tie-break: zero 1s counts as even, so a parity bit over all-zero data is 0, and an all-zero word passes', () => {
  assert.equal(S(logic.hammingEncode(logic.bitsOf(0, 11))), '000000000000000');
  assert.deepEqual(logic.hammingChecks(logic.hammingEncode(logic.bitsOf(0, 11))).map((c) => c.result), ['pass', 'pass', 'pass', 'pass']);
});

test('H tie-break: syndrome 0 means no correction (there is no position 0); the word is taken as received', () => {
  const w = B(WORD);
  assert.deepEqual(logic.hammingCorrect(w, 0), w);
  const s = hat({}, 12);
  assert.equal(s.syndrome, 0);
  assert.equal(s.corrected, null);
  assert.deepEqual(s.fixed, w);
});

test('H tie-break: the syndrome reads p4 p3 p2 p1, p1 the lowest bit (p1 alone = 1, p4 alone = 8)', () => {
  const pass = { result: 'pass' }, fail = { result: 'fail' };
  assert.equal(logic.syndromeOf([fail, pass, pass, pass]), 1);
  assert.equal(logic.syndromeOf([pass, pass, pass, fail]), 8);
  assert.equal(logic.syndromeOf([fail, fail, pass, pass]), 3);
});

test('H tie-break: duplicate flipped positions count once; positions are listed ascending, 1 … 15', () => {
  assert.equal(logic.hmaskOf([3, 3]), logic.hmaskOf([3]));
  assert.deepEqual(logic.hflipList(logic.hmaskOf([15, 3, 1, 3])), [1, 3, 15]);
  assert.equal(logic.hmaskOf([1]), 1 << 14);
  assert.equal(logic.hmaskOf([15]), 1);
});

// rules

test('rule H2: p_j covers every position whose binary index has bit j − 1 set, itself included', () => {
  assert.deepEqual(logic.covers(1), [1, 3, 5, 7, 9, 11, 13, 15]);
  assert.deepEqual(logic.covers(2), [2, 3, 6, 7, 10, 11, 14, 15]);
  assert.deepEqual(logic.covers(3), [4, 5, 6, 7, 12, 13, 14, 15]);
  assert.deepEqual(logic.covers(4), [8, 9, 10, 11, 12, 13, 14, 15]);
  assert.deepEqual(logic.PPOS, [1, 2, 4, 8]);
  assert.deepEqual(logic.DPOS, [3, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15]);
});

test('rule H1: data a…k go to the non-powers of two; each p_j makes its positions even (task word)', () => {
  const w = logic.hammingEncode(B('10110011101'));
  assert.equal(S(w), WORD);
  assert.deepEqual([1, 2, 4, 8].map((i) => w[i - 1]), [1, 1, 1, 0]);
  assert.deepEqual(logic.hammingDecode(w), B('10110011101'));
  // every code word of every data word passes all four checks, and decodes to its data
  for (let d = 0; d < 1 << 11; d++) {
    const data = logic.bitsOf(d, 11), cw = logic.hammingEncode(data);
    for (const c of logic.hammingChecks(cw)) assert.equal(c.result, 'pass', `data ${d}`);
    assert.deepEqual(logic.hammingDecode(cw), data);
  }
});

test('rule H1: each check counts its covered positions, parity bit included; odd fails', () => {
  const rx = B(WORD); rx[2] ^= 1; // a flipped
  assert.deepEqual(logic.hammingChecks(rx).map((c) => c.ones), [5, 5, 6, 4]);
  assert.deepEqual(logic.hammingChecks(rx).map((c) => c.result), ['fail', 'fail', 'pass', 'pass']);
});

test('rules H3, H4: one flipped bit anywhere, data or parity, gives its own position as the syndrome and is corrected', () => {
  for (const d of [0, 1437, 2047, 1000]) {
    const data = logic.bitsOf(d, 11), cw = logic.hammingEncode(data);
    for (let pos = 1; pos <= 15; pos++) {
      const rx = cw.slice(); rx[pos - 1] ^= 1;
      const syn = logic.syndromeOf(logic.hammingChecks(rx));
      assert.equal(syn, pos, `data ${d}, position ${pos}`);
      assert.deepEqual(logic.hammingCorrect(rx, syn), cw);
    }
  }
});

test('rule H5: two flipped bits give a non-zero syndrome that names a third, correct position: three wrong bits', () => {
  const cw = B(WORD);
  for (let a = 1; a <= 15; a++) {
    for (let b = a + 1; b <= 15; b++) {
      const s = hat(hflip([a, b]), 13);
      assert.ok(s.syndrome > 0 && s.syndrome !== a && s.syndrome !== b, `${a}, ${b}`);
      assert.equal(s.syndrome, a ^ b);
      assert.equal(s.wrong, 3);
      assert.ok(s.dataWrong >= 1, 'the data is always wrong after the miscorrection');
      assert.equal(s.verdict, 'wrong');
      assert.notDeepEqual(s.fixed, cw);
    }
  }
});

test('rule H5, all 2^15 − 1 patterns: one flip is always corrected; two or more always leave the data wrong', () => {
  // After the decoder's flip the remaining errors XOR to 0, so they are never a non-empty set of parity positions alone.
  const cw = B(WORD), data = B('10110011101');
  for (let mask = 1; mask < 1 << 15; mask++) {
    const pos = logic.hflipList(mask);
    const rx = logic.flipBits(cw, pos.map((p) => p - 1));
    const fixed = logic.hammingCorrect(rx, logic.syndromeOf(logic.hammingChecks(rx)));
    const ok = S(logic.hammingDecode(fixed)) === S(data);
    assert.equal(ok, pos.length === 1, `positions ${pos}`);
  }
});

test('H verdicts: ok without errors, corrected for one, wrong when the data differs (three errors may give syndrome 0)', () => {
  assert.equal(hat({}, 13).verdict, 'ok');
  assert.equal(hat(hflip([9]), 13).verdict, 'corrected');
  const three = hat(hflip([1, 2, 3]), 13); // 1 ⊕ 2 ⊕ 3 = 0: every check passes, the error gets through
  assert.equal(three.syndrome, 0);
  assert.equal(three.verdict, 'wrong');
});

test('H run: 13 steps for every word and pattern; parity bits appear one per step, errors only on the line', () => {
  assert.equal(logic.steps(H({})), 13);
  assert.equal(logic.steps(H(hflip([1, 2, 3, 4, 5]))), 13);
  assert.ok(hat({}, 0).word.every((b) => b === null));
  assert.deepEqual(hat({}, 1).word.map((b, i) => b === null ? i + 1 : 0).filter(Boolean), [1, 2, 4, 8]);
  for (let j = 1; j <= 4; j++) {
    const s = hat({}, 1 + j);
    assert.equal(s.phase, 'parity'); assert.equal(s.j, j);
    assert.deepEqual(s.word.map((b, i) => b === null ? i + 1 : 0).filter(Boolean), [1, 2, 4, 8].slice(j));
  }
  assert.equal(S(hat({}, 6).word), WORD);
  const before = hat(hflip([3]), 6);
  assert.deepEqual([before.flipped, before.received, before.planned], [[], null, [3]]);
  for (let j = 1; j <= 4; j++) {
    const s = hat(hflip([3]), 7 + j);
    assert.equal(s.phase, 'check'); assert.equal(s.j, j);
    assert.equal(s.checks.filter(Boolean).length, j);
    assert.equal(s.syndrome, null);
  }
  assert.equal(hat(hflip([3]), 12).decoded, null);
});

test('H: the CRC run is untouched by the Hamming params', () => {
  assert.deepEqual(at({ hdata: 5, hflip: 99 }, 6), at({}, 6));
  assert.equal(logic.steps(P({ hflip: 99 })), 6);
});

// presets (task numbers, checked by script)

const hpreset = (pos) => hat(hflip(pos), 13);

test('preset hamming-k: k (position 15) flipped → all four checks fail, syndrome 1111 = 15, corrected', () => {
  const s = hpreset([15]);
  assert.equal(S(s.received), '111101100011100');
  assert.deepEqual(s.checks.map((c) => c.result), ['fail', 'fail', 'fail', 'fail']);
  assert.deepEqual(s.checks.map((c) => c.ones), [5, 5, 5, 3]);
  assert.equal(s.syndrome, 15);
  assert.equal(S(s.fixed), WORD);
  assert.equal(s.verdict, 'corrected');
});

test('preset hamming-a: a (position 3) flipped → p1 and p2 fail, syndrome 3, corrected', () => {
  const s = hpreset([3]);
  assert.deepEqual(s.checks.map((c) => c.result), ['fail', 'fail', 'pass', 'pass']);
  assert.equal(s.syndrome, 3);
  assert.equal(s.corrected, 3);
  assert.equal(S(s.decoded), '10110011101');
  assert.equal(s.verdict, 'corrected');
});

test('preset hamming-p1: p1 flipped → only p1 fails, syndrome 1: a parity bit is corrected too', () => {
  const s = hpreset([1]);
  assert.deepEqual(s.checks.map((c) => c.result), ['fail', 'pass', 'pass', 'pass']);
  assert.equal(s.syndrome, 1);
  assert.equal(S(s.fixed), WORD);
  assert.equal(s.dataWrong, 0);
  assert.equal(s.verdict, 'corrected');
});

test('preset hamming-two: a and b (3, 5) flipped → p2 and p3 fail, syndrome 6 → c flipped: three wrong bits', () => {
  const s = hpreset([3, 5]);
  assert.deepEqual(s.checks.map((c) => c.result), ['pass', 'fail', 'fail', 'pass']);
  assert.equal(s.syndrome, 6);
  assert.equal(s.corrected, 6);
  assert.equal(S(s.decoded), '01010011101');
  assert.deepEqual([s.wrong, s.dataWrong, s.verdict], [3, 3, 'wrong']);
});

test('H state is JSON-safe, replay is deterministic, and step does not mutate its input', () => {
  const p = H(hflip([3, 5]));
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps(p); n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next; forward.push(s);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
  for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
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
