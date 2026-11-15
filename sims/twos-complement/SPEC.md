<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# twos-complement: specification

Task `docs/tasks/w3/twos-complement.md`, catalogue entry `arh-twos-complement` (§4.9). One concept: **signed
integers and the wrap**. The student adds two n-bit numbers and watches the flags. Class: explorer (no steps; the
state is derived from the params).

## Sources

- **[PH]** D. A. Patterson, J. L. Hennessy, *Computer Organization and Design*, §2.4 "Signed and unsigned numbers"
  (two's complement value, range, negation by invert-and-add-one) and §3.2 "Addition and subtraction" (overflow:
  same-sign operands, other-sign result; the adder is the same for signed and unsigned).
- **[IA]** *Intel 64 and IA-32 Architectures Software Developer's Manual*, Vol. 1, §3.4.3 "EFLAGS register" (CF
  carry out of the most significant bit, OF signed result too large, SF the most significant bit, ZF result zero)
  and §4.2.1 "Integers". *(check: section numbers taken from the task file, not opened)*
- **[ARM]** *Arm Architecture Reference Manual*, the NZCV condition flags (N = bit n−1 of the result, Z = result
  zero, C = unsigned overflow / carry out, V = signed overflow). *(check: section not opened)*

The page names no processor or vendor (COMMON.md §1): the flags are called N, Z, C, V, the generic names. The
rules below are standard textbook arithmetic; every number in this file was computed by an independent bit-level
script (NOTES.md, "Numbers checked") and by the model's tests.

## Params

| key | type | values | default |
|---|---|---|---|
| `width` | choice | 4, 8, 16 | 8 |
| `a` | range | −2ⁿ⁻¹ … 2ⁿ⁻¹ − 1, step 1 | 100 |
| `b` | range | −2ⁿ⁻¹ … 2ⁿ⁻¹ − 1, step 1 | 50 |
| `view` | choice | `signed`, `unsigned`, `both` | `both` |

Stage controls (rule 7): clicking a bit cell of a or b flips that bit and sets the operand to the new pattern's
signed value; the ± button next to a or b replaces it by its negation (rule 6).

## State

`{ n, view, a, b, aBits, bBits, sumBits, carries, carryOut, weights, range: {min, max}, unsigned: {a, b, r},
signed: {a, b, r}, hex: {a, b, r}, flags: {N, Z, C, V}, trueSum: {signed, unsigned} }`. Bit arrays are most
significant first. `carries[k]` is the carry **into** column k (so `carries[n − 1]`, into bit 0, is 0);
`carryOut` is the carry out of the top bit. `trueSum` is the mathematical a + b (signed) and the sum of the two
unsigned patterns, before the wrap.

## Rules

1. **Bits → signed value** [PH §2.4]: −b(n−1)·2ⁿ⁻¹ + Σ bᵢ·2ⁱ. Weights for 8 bits: −128, 64, 32, 16, 8, 4, 2, 1.
   Range −2ⁿ⁻¹ … 2ⁿ⁻¹ − 1: 4 bits −8 … 7, 8 bits −128 … 127, 16 bits −32768 … 32767. The unsigned reading of the
   same bits is Σ bᵢ·2ⁱ, 0 … 2ⁿ − 1. The page shows weights in decimal, and as powers of two (−2¹⁵ … 2⁰) at 16
   bits where the decimal does not fit a column.
2. **One adder** [PH §3.2]: r = (a + b) mod 2ⁿ, computed column by column from bit 0 with a ripple carry. The
   signed and the unsigned reading are two readings of the same r.
3. **C** [IA, ARM] = the carry out of the top bit = 1 exactly when the unsigned sum aᵤ + bᵤ ≥ 2ⁿ (the unsigned result
   wrapped).
4. **V** [PH §3.2, IA, ARM] = 1 when both operands have the same sign and the result's sign differs (the signed
   result wrapped). Equivalent: carry into the top bit ≠ carry out of it; and: the true signed sum is outside the
   range. C and V are independent (all four combinations occur, see the presets and 10 + 20).
   - **Tie-break: zero is non-negative.** "Sign" is the top bit, so 0 counts as positive. −128 + (−128) = 0 in 8
     bits sets V (two negatives, result not negative), C and Z. 0 + 0, 0 + (−1), 127 + 0 set no V.
5. **N** = the top bit of r; **Z** = (r = 0) [IA, ARM].
6. **Negation** [PH §2.4]: −x = (~x) + 1 in n bits. Edge case: −(−2ⁿ⁻¹) = −2ⁿ⁻¹ (8 bits: ~1000 0000 + 1 =
   0111 1111 + 1 = 1000 0000 = −128); the + 1 adds two non-negatives and gives a negative, so it would set V. The
   model returns `overflow: true` for it, and the caption says so.
7. **Input clamping** (the model): an operand is a signed integer in range. Values that do not convert to a finite
   number (`Number(x)`) become 0, fractions round
   (halves up: 2.5 → 3, −2.5 → −2), −0 becomes 0 (JSON-safe), values outside the range clamp to its ends.
   Switching the width clamps too (30000 at 16 bits becomes 127 at 8 bits; it does not keep the low bits). An
   unknown width or view falls back to the default. On the page the kit's slider clamps first: a URL value that is
   not a number falls back to the default (100, 50), and `?b=Infinity` clamps to the range end.
   - Clicking bit i of x gives the pattern of x with bit i flipped, read signed: 100 with bit 7 flipped is −28
     (0110 0100 → 1110 0100).

## Presets (numbers checked)

| id | params | bits | r | flags |
|---|---|---|---|---|
| `overflow` (default) | 8, 100, 50 | 0x64 + 0x32 = 0x96 | 150 unsigned, −106 signed | N 1, Z 0, C 0, V 1 |
| `max-plus-one` | 8, 127, 1 | 0x7F + 0x01 = 0x80 | 128 / −128 | N 1, Z 0, C 0, V 1 |
| `carry-not-overflow` | 8, −1, 1 | 0xFF + 0x01 = 0x00 | 0 / 0 (true unsigned 256) | N 0, Z 1, C 1, V 0 |
| `both` | 8, −100, −50 | 0x9C + 0xCE = 0x6A | 106 / 106 (true −150, 362) | N 0, Z 0, C 1, V 1 |
| `subtract` | 8, 5, −3 | 0x05 + 0xFD = 0x02 | 2 / 2 | N 0, Z 0, C 1, V 0 |
| `16-bit` | 16, 30000, 10000 | 0x7530 + 0x2710 = 0x9C40 | 40000 / −25536 | N 1, Z 0, C 0, V 1 |

## The wheel

2ⁿ patterns on a circle, 0 at the top, clockwise. Unsigned values label the outside, signed values the inside
(every value at 4 bits, every 2ⁿ⁻³ at 8 and 16). The outer arrow starts at a and turns clockwise by b's unsigned
value; the inner arrow starts at a and turns by b's signed value (counter-clockwise when b < 0). Both end at r.
Two seams are marked: the top seam (between 2ⁿ − 1 and 0) and the bottom seam (between 2ⁿ⁻¹ − 1 and −2ⁿ⁻¹). The
outer arrow crosses the top seam exactly when C = 1, the inner arrow crosses the bottom seam exactly when V = 1
(rules 3 and 4: crossing a seam is leaving that reading's range). The seam label is filled when its flag is set.
`view` shows the outside, the inside or both, and the readings under the rows likewise.

## Captions

One of, by the flags (V first, then C, then neither), plus "Z = 1" when r = 0:

- V, operands non-negative: the task's caption ("100 + 50 = 150 does not fit in 8 signed bits: 1001 0110 reads as
  −106. Both operands positive, result negative → the V (overflow) flag.").
- V, operands negative: the same, "both operands negative, result not"; when C is set too, a sentence on the
  unsigned wrap.
- C without V: the unsigned sum wraps (C), the signed sum is right (V = 0, the carry is not an error); with a
  negative b, a sentence on subtraction as adding the complement.
- neither: both sums fit.
- After a ± click, until a, b or the width change: the negation ~x + 1 written out, and the −2ⁿ⁻¹ edge case.

"Changed" marks compare with the state before the last change of a, b or the width: bits that differ and flags that
toggled. A width change marks nothing (a new number, not a change of this one).

## Out of scope

Multiplication and division, one's complement and sign-magnitude (one line in the explanation), the two carry
conventions processors use for subtraction (carry vs borrow), BCD. Subtraction appears only as adding a negative b.
