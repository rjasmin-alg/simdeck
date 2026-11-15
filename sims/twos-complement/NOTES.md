<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# twos-complement: notes

New explorer (task `docs/tasks/w3/twos-complement.md`, catalogue `arh-twos-complement`, §4.9, wave 3). Rules and
expected numbers: `SPEC.md`. No kit view is named by the task; the stage is plain HTML (flex rows of bit cells) and
one inline SVG for the wheel's lines and arcs, with every wheel label in HTML so text keeps its size.

## Decisions

- **Layout.** Left: the weights row, the carries row, a, b and r as rows of bit cells, each followed by its
  readings (unsigned, signed, hex, filtered by `view`), a line "a + b exactly" with ✓ fits / ✗ does not fit for each
  reading, and the flag panel (N, Z, C, V: the lit letter, "= 1/0", the flag's name, its rule in one line and the
  evidence from the bits, e.g. `c₇ = 1 ≠ c₈ = 0`). Right: the number wheel. The task says the readings go "under
  each row"; they do.
- **Carries.** `carries[k]` is the carry *into* column k, drawn above it; the carry out of the top bit is drawn
  above an extra column left of the sign bit, and in the r row that column shows a dashed ghost "1" (the bit that
  does not fit and goes to C). The carries into and out of the top bit have a ring, so V's rule "carry in ≠ carry
  out" can be read off the row.
- **Two arrows on the wheel.** Outside, clockwise by b's unsigned value; inside, by b's signed value
  (counter-clockwise for a negative b). Both end at r. The top seam is C's, the bottom seam V's; the seam's letter
  box fills when the flag is set. This makes "C and V are independent" visible: in `subtract` the outer arrow
  crosses the top, the inner arrow goes back three steps and crosses nothing.
- **Weights at 16 bits** are written as powers of two (−2¹⁵ … 2⁰, Unicode superscripts, one font size) because
  "−32768" does not fit a column; 4 and 8 bits use decimals as the task writes them. On a phone 8 bits also use
  powers of two. Both forms are in the page; CSS shows one.
- **Negation (rule 6)** is a ± button next to a and b (a stage control, as rule 7 allows for bit clicks). It sets
  the operand to ~x + 1; the caption then writes the negation out (−(−3) = ~1111 1101 + 1 = 0000 0010 + 1 =
  0000 0011) until a, b or the width change. For −128 the value stays −128 and the caption says the + 1 overflows.
  The task lists no negation param; a button keeps the params as the task lists them.
- **Clamping on width change** (rule 7): the kit clamps a range param to its bounds, so 30000 at 16 bits becomes
  127 at 8 bits. Keeping the low bits instead (30000 → 0x30 = 48) would also be defensible, but clamping is what
  rule 7 says ("entered as signed values in range") and what the slider does.
- **Captions** are picked by the flags: V first (the task's caption for two positives, a "both negative, result
  not" twin), then C without V, then neither; "Z = 1" is added when r = 0. A negative b is written in parentheses
  (5 + (−3)), as the task does. Captions do not change with `view`: they explain both flags in every view.
- **Colours.** a, b and r 1-bits use the series colours 1, 2, 3; 0-bits are dashed and hollow; the sign bit has a
  thick ink border; carries are colour 7 dots with "1" in them; set flags are filled colour 3 circles with their
  letter, clear ones dashed. The unsigned arrow and labels use colour 5 (solid), the signed ones colour 6
  (dashed). Every colour is paired with a shape, a position or a label; the grayscale screenshot reads.
- **Kit `t.parts` places a node once**; the caption that names a value twice (`capSub`) would lose the first copy,
  so the page clones repeated nodes (`fresh()`), as `sims/floating-point/` does by hand.

## Deviations from the task

- None in the model, params or presets. Additions: the ± negate buttons (rule 6 made interactive), the "a + b
  exactly" line, and the flag evidence column.

## Numbers checked

The six presets and the −(−128) edge case were computed by an independent Python script with its own bit-level
ripple adder (not the JS model), and the two V rules (signs vs carry-in ≠ carry-out) were checked against each other
for every pair of 4- and 8-bit operands. All match the task file:

```
overflow            0x64 + 0x32 = 0x96   u 150   s −106    C 0 V 1 N 1 Z 0
max-plus-one        0x7F + 0x01 = 0x80   u 128   s −128    C 0 V 1 N 1 Z 0
carry-not-overflow  0xFF + 0x01 = 0x00   u 0     s 0       C 1 V 0 N 0 Z 1
both                0x9C + 0xCE = 0x6A   u 106   s 106     C 1 V 1 N 0 Z 0
subtract            0x05 + 0xFD = 0x02   u 2     s 2       C 1 V 0 N 0 Z 0
16-bit              0x7530 + 0x2710 = 0x9C40   u 40000   s −25536   C 0 V 1 N 1 Z 0
−(−128): ~0x80 = 0x7F, + 1 = 0x80
```

The tests check rules 2–5 exhaustively over every pair of 4- and 8-bit operands against plain integer arithmetic.
Each rule was broken once in `sim.js` (16 mutations: top weight, signed reading, adder carry, C, V without the sign
condition, zero as negative, N, Z, negation without + 1, the overflow flag, no clamp, floor, −0, wrong flipped bit,
changed flags, width fallback); every mutation failed a test.

## Review

A fresh reviewer read the code against `SPEC.md`, swept the page in a browser (every 4-bit pair, ~600 8-bit pairs,
16-bit edges: caption choice, arcs, seam crossing ⇔ C and V, seam labels) with no defect found, and recomputed the
preset table. Eight of its mutations survived the first tests (16-bit hex padding, `negate().bits`, `changedFlags`
with all four flags, exact `trueSum`, 16-bit C and Z, −(−32768), clamping inside `negate` and `flipBit`); tests
were added and all eight now fail. Also fixed from the review: a width change no longer marks flags as changed, the
a and b sliders have a default for a bad URL value, the legend's 1-swatch is neutral, the negation caption writes
−7 and −(−3), SPEC rule 7's wording, and four Croatian phrasings.

## Unchecked *(check)*

- The section numbers of the Intel SDM (Vol. 1 §3.4.3, §4.2.1) and the Arm ARM NZCV section are from the task file;
  the manuals were not opened. The flag definitions used are the standard ones and agree with Patterson & Hennessy.
- "dvojni komplement" is the glossary's term (`kit/glossary.js`, `src: simdeck`); the task marks it *(check)*.
- "omatanje" / "omotati se" for wrap-around is the task's suggestion, marked *(check)* there; used in the hints and
  the explanation.

## Term pairs

Missing from `kit/glossary.js`, written out in `strings.js` (hr: the English in italics, the Croatian in
parentheses):

| en | hr |
|---|---|
| sign bit | bit predznaka |
| signed | s predznakom |
| unsigned | bez predznaka |
| flag | zastavica |
| wrap-around (wrapped around) | omatanje (omotati se) *(check)* |
| one's complement | nepotpuni komplement *(check)* |
| sign-magnitude | predznak i iznos *(check)* |

## Shared requests

- None for the kit. (A note for the kit owner: `t.parts` with the same node in two placeholders silently drops the
  first; a clone in `t.parts`, or a line in `docs/sim-ui.md` §9.3, would save the next page the workaround.)

## Tags

Topic `architecture`, tag `number-representation`, level `core`: all in `tags.json`. Suggested learn.json leaf: `bytes`
("How a number is stored in bytes", with `endianness`), next to `floating-point` once that is placed.

## Time

2026-11-15, 12:02 to 12:25 by the wall clock (about 25 minutes, one session), including the fresh review (about 6
minutes) and its fixes.
