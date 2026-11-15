<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# floating-point: notes

New explorer (task `docs/tasks/w3/floating-point.md`, catalogue `arh-floating-point`, §4.9, wave 3). Rules and
expected numbers: `SPEC.md`. No kit view is named by the task; the stage is plain HTML (flex groups of bit buttons
and CSS grids for the decoding and the sum), no SVG.

## Decisions

- **Exact arithmetic.** Every value is a BigInt rational; rounding (ties to even, gradual underflow, overflow to ∞)
  is done by the model, not by the platform, so the same code serves binary32 and binary64 and can show the exact
  sum *before* rounding. The tests check the model against the platform's own binary64 and `Math.fround` rounding
  for 18 decimals and for all 81 operand pairs in both formats. The state holds only strings, numbers and booleans.
- **One `format` for both panels.** The task asks for binary64 as the default "for the sum" and binary32 "for bit
  toggling". The default state is binary64 (0.1 on the strip, 0.1 + 0.2 below: the task's caption, word for word);
  presets 1 and 3–6 switch to binary32. binary64 draws its 64 bits in two rows of 32, as the task suggests.
- **The strip can show the sum.** The value select has "the sum a + b", so presets 2, 3 and 6 put the rounded sum's
  bits on the strip (0x3FD3333333333334 for preset 2). Clicking a bit switches the value to "clicked bits".
- **Typing numbers.** The kit has no text param, so a page-owned field on the stage (built once, so typing keeps
  focus; the kit's keys are off while it has focus) sets `{ value: 'typed', text }` through `sim.set`, like
  `sims/endianness/`. A comma is read as a decimal point (Croatian students type 0,1); `inf`, `∞`, `nan` and an
  exponent are read too. Unreadable text gives +0 and a dashed red field with "not a number", never a NaN (a NaN
  would look like an answer). `text` and the clicked `hex` are not kit params, so the page writes `?text=` and
  `?hex=` itself and reads them once at load, with `?value=typed` / `?value=bits`.
- **Clicked bits keep their format** by the length of `hex` (8 digits binary32, 16 binary64): switching the format
  converts the pattern (exactly up, rounded down; ∞ stays, a NaN becomes the quiet NaN with its sign).
- **Long exact values** (over 64 characters: the smallest binary64 subnormal has 1074 decimal places) are shown as
  start … end with a dashed button "n more digits"; clicking it or the key **D** shows every digit in a scrolling box
  (and "shorten" goes back). This was a panel toggle first, but seven controls overflowed the panel at 1920×1080, and
  the button sits where the digits are missing. `digits` is a model default without a control, so the kit does not
  keep it in the URL; a reload shows the short form.
- **Captions.** Two sentences: the strip's value, then the sum. An exact value in a caption is whole up to 28
  characters, else cut after 24 with "…" (the task's "0.1000000000000000055511…") when the cut still shows five
  significant digits, else "≈" and three digits (1e−310, 3.4e38). The sum sentence checks absorption first ("b is
  lost", with "exactly halfway" when the exact sum was a tie), then "n ULP above/below", then "exact", then "equal:
  ≠ is not a law". "jedan ULP" / "one ULP" for 1 has its own string, because the Croatian singular form also serves
  21, 31, ….
- **0.1 + 0.2 in binary64 is a tie.** The exact sum of the stored 0.1 and 0.2 lies exactly halfway between
  0x3FD3333333333333 and …334 (checked in Python with `fractions`); ties to even picks …334. The sum panel says so
  with a yellow badge "exactly halfway: goes to the even neighbour"; the task's caption is kept as written.
- **Decimal point in both languages.** Numbers are what a program reads and prints, so the Croatian page writes
  0.1, not 0,1 (and accepts 0,1 typed).
- **Expected number** is the decimal sum a + b (exact, as decimals) rounded once; "equal" compares patterns, which
  is numeric equality here (positive finite operands, so no NaN and no ±0 case). "ULPs apart" is the pattern
  difference.
- **"Printed as"**: the shortest decimal that reads back (binary64: the language's own number to string; binary32:
  the fewest digits 1 … 9 that round back through `Math.fround`). It explains why 0.1 "looks exact".
- **Changed bits** (legend, `.sd-changed`): the bits that differ from the strip before the last input in the same
  format. Loading the page (defaults, then the URL's preset) is not an input, so a fresh page has no marks.
- **Colours**: s `--c1`, e `--c2`, f `--c3`, each group with a labelled band ("s", "e · exponent", "f · fraction");
  bit 1 filled, bit 0 dashed hollow, so grayscale keeps both (checked in the screenshot). The legend's bit swatches
  are `--c8` (neutral).
- **The formula line** writes the stored fields in their group colours: (−1)^s × 1.f₂ × 2^(e − bias), with 0.f and
  2^(1 − bias) for subnormals and words for zero, ∞ and NaN.
- **Operands** for the sum: 0.1, 0.2, 0.3, 0.5, 0.7, 1, 3, 16777216, 1e16 (the task's list plus 0.5, 0.7 and 3:
  0.7 + 0.1 shows "one ULP *below* 0.8", 0.5 + 1 an exact sum, 1e16 + 3 an inexact but equal one).
- **Mutation pass** (own script, 41 mutants of the rules): 38 fail a test. Three are equivalent, they change no
  result: removing the `E >= maxE` overflow guard in `roundRational` (the carry already yields the ∞ pattern),
  removing the trailing-zero strip in `decimalOf` (reduced binary or decimal fractions never end in 0), raising the
  10^400 magnitude guard in `parseDecimal` (only slower).
- **A comma is always a decimal point** in the typed field, so "1,000" reads as 1 (the Croatian habit wins; a
  thousands separator is not accepted).
- **Changed marks** stay until the strip's bits change (a/b or D do not clear them), per SPEC rule 11.

## Review (playbook §7.4)

A fresh reviewer recomputed every SPEC number (Python `struct`, `fractions`, `numpy`), compared the model with an
independent roundTiesToEven reference (20k random decimals in both formats, 20k binary64 → binary32 conversions,
40k pattern sums incl. subnormals and the overflow edge: 0 mismatches) and ran 89 mutants. Fixed from it:

- the exponent line called a zero "subnormal";
- a typed value below 10^−400 was flagged "exactly the typed number" (now inexact, no error shown);
- "the next number is one ULP higher" was wrong for negative numbers and for max: now "away from zero", and max says
  the next pattern is ∞ (caption and decoding line; `isMax` in the model);
- "cannot be stored exactly in binary" was said of binary integers such as 16 777 217: such (dyadic) inputs now read
  "needs more significant bits than binary32 has" (`source.dyadic`);
- binary32 "printed as" was one digit too long at three powers of two (0x0F800000, 0x6B000000, 0x6C800000): each
  length now also tries the neighbouring decimals; a test covers all 254 powers of two;
- surviving mutants now killed: inputs that round down, inexact operands, zero's exponent, nine-digit and binary64
  printing, a NaN payload in its own format, `-nan`, `infinity`, 9- and 17-digit hex;
- an exact addition with inexact inputs (0.1 + 0.1) no longer says "rounds"; Croatian "e su jedinice" → "svi bitovi
  e su jedinice"; no "false" in a Croatian hint; preset 3's hint says "the same number as 0.3", not "exactly 0.3";
  "half a ULP"; f defined the same way in both languages (the mantissa bits after the leading 1); one approximation
  format ("2.00e292", no "e+", no "e0"); `<code>` marked `translate="no"`.

## Sources

- IEEE Std 754-2019, *IEEE Standard for Floating-Point Arithmetic*: §3.4 and Table 3.5 (binary32, binary64),
  §4.3.1 (roundTiesToEven), §5.1 (correct rounding), §6.3 (sign of a zero sum), §7.4 (overflow).
- D. Goldberg, "What Every Computer Scientist Should Know About Floating-Point Arithmetic", *ACM Computing Surveys*
  23(1), 1991, §1.1–1.2 (formats, ULP, relative error).
- Every number in `SPEC.md` was computed with Python (`struct`, `fractions`, `decimal`) before coding, and again by
  the tests against the platform's arithmetic.

## Unchecked *(check)*

- Section numbers of IEEE 754-2019 are cited from memory of its structure; no copy of the standard was at hand.
  The numbers do not depend on them (they were checked against hardware arithmetic). *(check)*
- §7.4 as the place where ties-to-even overflow to ∞ is stated. *(check)*
- Croatian terms *(check)*, as the task marks them: pomični zarez (floating point), pomak (bias), jedinica na zadnjem
  mjestu (ULP). "mantisa" is used for the fraction field f, as the task's term list does.

## Term pairs

The glossary (`kit/glossary.js`) has none of these; they are written out in `strings.js` (term rule by hand: English
in italics, Croatian in parentheses, in the explanation). Proposed for the glossary, `"src": "simdeck"`:

| en | hr |
|---|---|
| floating point | pomični zarez *(check)* |
| sign | predznak |
| exponent | eksponent |
| mantissa (significand) | mantisa |
| bias | pomak *(check)* |
| rounding | zaokruživanje |
| subnormal | subnormalni (denormalizirani) broj |
| ULP | jedinica na zadnjem mjestu (ULP) *(check)* |
| NaN | NaN |

## Shared requests

- None for the kit. (A text-input param type in the kit would replace the page-owned typed field here and in
  `sims/endianness/`; not needed.)

## Time

Start 2026-11-15 10:04, done 10:35: about half an hour of wall time in one session (the fresh review ran
alongside for about 9 minutes).
