<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# floating-point: specification

Explorer, one concept: **sign, exponent and fraction of an IEEE 754 binary number, and why 0.1 + 0.2 ≠ 0.3**
(task `docs/tasks/w3/floating-point.md`, catalogue `arh-floating-point`, §4.9). The student toggles bits, types
numbers and picks two operands to add.

Sources: *IEEE Std 754-2019* §3.4 (binary interchange encodings, Table 3.5), §4.3 (rounding-direction attributes,
§4.3.1 roundTiesToEven), §5.1 (every operation rounds its exact result once), §6.3 (sign of a zero sum), §7.4
(overflow); D. Goldberg, "What Every Computer Scientist Should Know About Floating-Point Arithmetic", *ACM Computing
Surveys* 23(1), 1991, §1.1 (formats, ULP), §1.2 (relative error and ULPs). Section numbers of the 2019 standard
are from memory of its structure and marked *(check)* where noted; every number below was checked with a Python
script (`struct`, `fractions`) and again by the model tests against the platform's own binary64 and
`Math.fround` arithmetic.

## Params

| key | values | default |
|---|---|---|
| `format` | `binary32`, `binary64` | `binary64` |
| `value` | `p01` 0.1, `p02` 0.2, `p03` 0.3, `one` 1, `two24` 16 777 216, `sum` (the rounded a + b), `inf` +∞, `max` largest finite, `min-normal`, `min-sub` smallest subnormal, `neg-zero` −0, `nan` the quiet NaN, `typed` (params.text), `bits` (params.hex) | `p01` |
| `a`, `b` | `0.1`, `0.2`, `0.3`, `0.5`, `0.7`, `1`, `3`, `16777216`, `1e16` | `0.1`, `0.2` |
| `text` | a typed decimal, at most 40 characters (page field, `?text=`) | `''` |
| `hex` | a bit pattern in hex, 8 digits (binary32) or 16 (binary64) (bit clicks, `?hex=`) | `''` |
| `digits` | show every digit of a long exact value (view only) | `false` |

One `format` drives both panels. The task's "default binary64 for the sum, binary32 for bit toggling" is met so: the
default state is binary64 (the 0.1 + 0.2 story, the task's caption), and the bit presets (1, 3–6) switch to binary32,
whose 32 bits are one row; binary64 draws its 64 bits in two rows of 32 (sign, exponent and fraction bits 51…32, then
fraction bits 31…0).

## Rules

1. **Formats** (§3.4, Table 3.5). binary32: 1 sign bit, w = 8 exponent bits, p = 23 fraction bits, bias 127.
   binary64: 1, 11, 52, bias 1023. A normal number has stored exponent 1 ≤ e ≤ 2^w − 2 and value
   (−1)^s × (1 + f / 2^p) × 2^(e − bias).
2. **Zero and subnormals.** e = 0, f = 0: ±0 (two patterns, equal in value). e = 0, f ≠ 0: subnormal,
   (−1)^s × (f / 2^p) × 2^(1 − bias): no hidden 1, and the exponent stays at 1 − bias (−126, −1022).
3. **Infinity and NaN.** e = 2^w − 1 (all ones): f = 0 → ±∞; f ≠ 0 → NaN. The model's own NaN is the quiet one
   (top fraction bit set: 0x7FC00000, 0x7FF8000000000000). NaN ≠ NaN.
4. **Decimal input** is rounded to the nearest representable number, **ties to even** (§4.3.1): of two equally
   near neighbours, the one whose last fraction bit is 0. Below the smallest normal the spacing stays 2^(1 − bias − p)
   (gradual underflow); at or beyond max + ½ ULP the result is ±∞ (§7.4 *(check)*: ties-to-even sends the halfway
   case to ∞ too, because max has an odd last bit). A decimal is digits with a point or a comma and an optional
   exponent (`1e16`, `2,5E-3`); also `inf`, `infinity`, `∞`, `nan`, each with an optional sign. Beyond 10^400 or
   below 10^−400 the model does not build the number: it is ±∞ or ±0 in both formats (and inexact, with no
   input error shown). An inexact input whose value is a binary fraction (denominator a power of 2, e.g. 16 777 217)
   is captioned "needs more significant bits than the format has", not "cannot be stored exactly in binary".
5. **Correct rounding** (§5.1). a + b: each operand is rounded once (rule 4); the exact sum of the two stored values
   is rounded once more. 0.1 + 0.2 is thus the rounded sum of two already-rounded inputs. The *expected* number is
   the decimal sum a + b rounded once. **Equal** = the same number. A zero sum would be +0 (§6.3); the operands are
   positive, so it does not arise.
6. **Exact decimal value.** Every binary fraction m × 2^k has a finite decimal expansion (2^−k = 5^k / 10^k); the
   model writes all of its digits with BigInt arithmetic, no `toFixed` and no `parseFloat`. The page shows up to
   64 characters and elides longer ones (start … end, with the digit count) until `digits` is on.
7. **ULP** (Goldberg §1.1): the gap from a finite number to the next one away from zero,
   2^(max(e, 1) − bias − p). At max it is the spacing of the top binade (2^104, 2^971), though the next pattern is ∞.
   For ±0 it is the smallest subnormal. None for ∞ and NaN. The page says "the next number away from zero"; for max it says
   the next pattern is already ∞.
8. **ULPs apart.** For two positive finite numbers, the difference of their patterns as integers counts the
   steps from one to the other (consecutive patterns are consecutive numbers; 1 = neighbours).
9. **Absorption.** The rounded sum equals a (and b ≠ 0): b is lost. Checked before "equal", so 16 777 216 + 1 reads
   as "the 1 is lost", although 16 777 217 rounded is also 16 777 216.
10. **Format change.** A typed value or a preset value is rounded again in the new format. A clicked pattern (`hex`)
    keeps its own format by its length (8 digits binary32, otherwise binary64) and is converted: exact from binary32
    to binary64, rounded by rule 4 the other way; ±∞ stays ±∞, a NaN becomes the quiet NaN with its sign.
11. **Changed bits** (legend): the bits that differ from the strip's previous pattern in the same format; none after a
    format change or on the first render.
12. **Printed as**: the shortest decimal that reads back as the same number (binary64: the language's own number to
    string; binary32: the fewest significant digits, 1 … 9, that round back, trying for each length the nearest decimal and
    its two neighbours, because at a power of two the neighbour above can read back when the nearest does not:
    0x0F800000 prints 1.2621775e-29, not 1.26217745e-29). It is what a program prints, and it is
    why 0.1 looks exact.

**Tie-breaks.** Rule 4's tie goes to the even fraction (tested on 2^24 + 1 in binary32, 2^53 + 1 in binary64, and
on the subnormal boundary). Rule 9 before "equal". An unreadable typed text gives +0 and an error flag, never a
NaN. Empty text gives +0 without an error. A bad `format`, `value`, `a` or `b` falls back to the default.

## Expected numbers (checked)

| # | preset | params | expected |
|---|---|---|---|
| 1 | `point-one` | binary32, 0.1 | 0x3DCCCCCD; s 0, e 123 (−4), f 5 033 165; exact 0.100000001490116119384765625; 1.f = 1.60000002384185791015625; ULP 2^−27 ≈ 7.45e−9; printed 0.1 |
| 2 | `sum-64` | binary64, value sum, 0.1 + 0.2 | stored 0.1 = 0x3FB999999999999A = 0.1000000000000000055511151231257827021181583404541015625; 0.2 = 0x3FC999999999999A; exact sum 0.3000000000000000166533453693773481063544750213623046875, **exactly halfway** between 0x3FD3333333333333 and …334, ties to even → 0x3FD3333333333334 = 0.3000000000000000444089209850062616169452667236328125 (printed 0.30000000000000004); 0.3 → 0x3FD3333333333333 = 0.299999999999999988897769753748434595763683319091796875; 1 ULP apart, ULP 2^−54 ≈ 5.55e−17; equal false |
| 3 | `sum-32` | binary32, value sum, 0.1 + 0.2 | 0x3DCCCCCD + 0x3E4CCCCD, exact sum 0.300000004470348358154296875 → 0x3E99999A = 0.300000011920928955078125; 0.3 → 0x3E99999A; equal true |
| 4 | `one-and-next` | binary32, 1 | 0x3F800000, e 127 (0), f 0, ULP 2^−23; flipping bit 0 → 0x3F800001 = 1.00000011920928955078125 (printed 1.0000001) |
| 5 | `specials` | binary32, +∞ | 0x7F800000 +∞; select: 0x7F7FFFFF = 340282346638528859811704183484516925440 ≈ 3.4028234663852886e38 (printed 3.4028235e+38), ULP 2^104; 0x00800000 = 1.1754943508222875…e−38 (smallest normal, ULP 2^−149); 0x00000001 = 1.40129846432481707…e−45 (smallest subnormal, printed 1e-45); 0x80000000 −0; 0x7FC00000 NaN |
| 6 | `big-plus-one` | binary32, value sum, 16777216 + 1 | both exact; exact sum 16 777 217, a tie between 16 777 216 and 16 777 218 (ULP 2), ties to even → 0x4B800000 = 16 777 216; absorbed (b lost) |

Also checked: 1e16 in binary64 = 0x4341C37937E08000 (exact), 1e16 + 1 = 1e16; in binary32 1e16 →
10000000272564224 (0x5A0E1BCA). Smallest binary64 subnormal 2^−1074 has 1074 decimal places (751 significant
digits); the largest binary64 has 309 digits.

## State

`{ format, w, p, bias, bits, hex, sign, expStored, expUnbiased, fraction, fractionBits, expBits, significand, kind,
exact, ulp: { exp, approx }, shortest, source: { from: 'decimal'|'typed'|'special'|'sum'|'bits', text, dec,
inexact, tie, underflow, overflow, error, diff, diffApprox }, sum: { a, b, exactSum, rounded, expected, equal,
ulpsApart, absorbed } }`: strings, numbers and booleans only. `expUnbiased` is 1 − bias for zero and subnormals (the
exponent the value uses), null for ∞ and NaN.

## Captions

Two sentences: the strip's value, then the sum. The default state (binary64, 0.1, 0.1 + 0.2) gives the task's caption word for word:

- hr: „0.1 nije točno prikaziv u binarnom zapisu: spremljena vrijednost je 0.1000000000000000055511… Zbroj
  0.1 + 0.2 zaokružuje se na broj koji je za jedan ULP veći od 0.3.“
- en: "0.1 cannot be stored exactly in binary: the stored value is 0.1000000000000000055511… The sum 0.1 + 0.2
  rounds to the number one ULP above 0.3."

Numbers are written with a decimal point in both languages: they are the values a program reads and prints.

## Out of scope

Decimal formats, fused multiply-add, rounding modes other than ties-to-even, signalling NaN payloads, x87 extended
precision; operations other than addition.
