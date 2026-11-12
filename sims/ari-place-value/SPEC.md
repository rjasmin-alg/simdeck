<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-place-value: specification

Task `docs/tasks/w3/ari-place-value.md` (catalogue §4.16). This file fills the task's empty "Model and presets".
Every number below was computed by a script before the model was written and is asserted in `sim.test.js`.

## Concept

A digit is worth the digit times the base to the power of its place. *b* blocks of one place regroup into one block
of the next place (ten ones into one ten in base 10). The same quantity written in base 10, 2, 8 and 16 has other
digits but is the same number.

## Class and state

An **explorer** (no steps). The student builds a number from blocks on a place-value mat (one column per place, the
ones on the right), adds and takes away blocks, regroups *b* blocks into one of the next place or breaks one block
into *b* of the place to its right, and switches the base. The page draws `initial(params)`.

Params (all in the URL, so a link, a reload and the `L` language switch keep the blocks):

| Param | Meaning | Range | Default |
|---|---|---|---|
| `base` | the base *b* | 2–16 | 10 |
| `n` | the quantity, in units (decimal) | 0–9999 | 347 |
| `c0` … `c13` | blocks in place *k* (k = 0 the ones) | 0–31 | 7, 4, 3, 0, … |
| `mistake` | the typical mistake shown (teacher) | `none`, `squash`, `zero`, `decimal` | `none` |

## Rules, in order

1. **Worth of a place.** A block in place *k* is worth *b*^k units. The quantity of a mat is Σ c_k · b^k.
2. **Places on the mat.** Base *b* has the places *k* with *b*^k ≤ 9999 (one block of a higher place would be more
   than the largest quantity): base 2 has 14 (2^13 = 8192), base 3 has 9, 4 has 7, 5 and 6 have 6, 7–9 have 5,
   10–16 have 4. The mat shows `min(places(b), max(min(4, places(b)), top + 2))` columns, where *top* is the highest
   place with a block (−1 when the mat is empty): the places in use and one free place to their left, at least four.
3. **The blocks follow the quantity (tie-break, first).** The blocks are `c0 … c13` when they are valid for the base
   (each count 0 … 2b − 1, no block in a place the base does not have) **and** their worth equals `n`; otherwise
   they are the digits of `n` in base *b*. So changing only the base (the slider) keeps the quantity and regroups
   it fully in the new base; presets, typed numbers and the mat's buttons set `n` and the counts together. The page
   then writes the blocks it shows back into `c0 … c13`, so the counts in the URL always belong to the current base
   and a second base change starts from them (2 tens 13 ones → base 8 → base 10 gives 3 tens 3 ones, not the loose
   ones again). Counts valid in the new base and worth the same `n` in both bases are kept as they are; only loose
   ones can do that, as a unit is worth 1 in any base (12 loose ones stay 12 loose ones from base 10 to base 11).
4. **Add a block** in place *k* (refused, in this order): *k* is not a place of the base (`place`); the column
   already holds 2b − 1 blocks (`full`); the quantity would exceed 9999 (`max`). Otherwise c_k + 1 and n + b^k.
5. **Take a block away** from place *k*: refused when the column is empty (`empty`). Otherwise c_k − 1, n − b^k.
6. **Regroup** place *k* (⇐): needs at least *b* blocks there (`few`) and room for one more in place *k* + 1
   (`full`), in that order. Place *k* + 1 always exists then: *b* blocks of place *k* are worth b^(k+1) ≤ 9999. Then c_k − b and c_{k+1} + 1; `n` does not change (b · b^k = b^(k+1)).
7. **Break** a block of place *k* (⇒): not for the ones (`ones`); needs a block there (`empty`) and room for *b* more
   in place *k* − 1, so place *k* − 1 must hold at most *b* − 1 blocks (`full`); refusals in that order. Then c_k − 1 and c_{k−1} + b; `n`
   does not change.
8. **Writing the number.** A place with fewer than *b* blocks is one digit, 0–9 then A–F. A place with *b* or more
   blocks cannot be written in one square: the mat is not a numeral until it is regrouped (**`over`** lists those
   places; the paper shows such a count written in the base, two digits in one square, struck). Leading empty places
   are not written; an empty mat is written `0`.
9. **Regroup all** sets the counts to the digits of `n`: every place below *b*. It is a button next to the "a full
   place is not a digit" note (shown only while a place is full) and the key `G` (the panel has no room for it at
   1920×1080).
10. **Other bases.** The quantity `n` written in base 10, 2, 8 and 16 (and the current base first, when it is none
    of those).
11. **Expansion.** From the highest place in use down to the ones, each place's count × its place value and its
    worth; their sum is `n`. On a numeral of more than six places the zero terms are left out of the caption; with a
   single term the caption does not repeat the worth (`7 = 7 · 1`).

## Typical mistakes (teacher view)

| Id | The mistake | Applies when | Wrong numeral |
|---|---|---|---|
| `squash` | a full place is written as it is, its count in one square | some place has ≥ b blocks | each place's count written in the base, highest place first, side by side |
| `zero` | an empty place is left out (no 0 holds it) | the numeral of `n` has a 0 and n > 0 | the numeral of `n` without its zeros |
| `decimal` | a numeral in base *b* read with the places of base 10 | b ≠ 10 and the numeral has no letter | the same digits, read as decimal |

Tie-breaks: `squash` with only the **highest** place full gives the right numeral (12 tens and 3 ones written
"123" is 123): the card says it happens to work and why it fails lower down. `decimal` on a one-digit numeral is the
same number (`7` in base 8): the card says so. When a mistake does not apply, the card says why and which preset
shows it (`nofull`, `nozero`, `base10`, `letters`).

## Presets (keys 1–6)

| # | Id | Base | Blocks (c0, c1, …) | n | Shows |
|---|---|---|---|---|---|
| 1 | `build-347` | 10 | 7, 4, 3 | 347 | 347 = 3 · 100 + 4 · 10 + 7 · 1 = 300 + 40 + 7; in base 2 `101011011`, 8 `533`, 16 `15B` |
| 2 | `thirteen-ones` | 10 | 13, 2 | 33 | 13 ones do not fit one square; regroup: 3 tens 3 ones = 33. Mistake `squash`: written "213", not 33 |
| 3 | `zero-place` | 10 | 7, 0, 3 | 307 | the 0 holds the empty tens. Mistake `zero`: "37", not 307 |
| 4 | `base-2` | 2 | 1, 0, 1, 1 | 13 | 1101₂ = 1 · 8 + 1 · 4 + 0 · 2 + 1 · 1 = 13; base 8 `15`, 16 `D`. Mistake `decimal`: read as 1101 |
| 5 | `base-8-full` | 8 | 8 | 8 | eight ones in base 8 fill the place: regroup to `10₈`, which is eight: "10" is always the base |
| 6 | `base-16` | 16 | 15, 15 | 255 | FF₁₆ = 15 · 16 + 15 = 255; base 2 `11111111`, 8 `377` |

Checked values: 9999 is `10011100001111` (14 places) in base 2, `23417` in 8, `270F` in 16; 33 is `100001`, `41`,
`21`; 307 is `100110011`, `463`, `133`; 8 is `1000`, `10`, `8`.

## Audiences

One model; the view changes (catalogue §4.16, the `ari-` notes):

- **teacher** (default): the expansion in the caption, the other bases card, the base control, the typical mistake.
- **adult**: as the teacher, and every action says why it keeps the number (b blocks of a place are worth exactly
  one of the next); no mistake card.
- **child**: base 10 only (the base control is hidden; switching to the child view sets base 10, keeping `n`), big
  digits, the school words (jedinice, desetice, stotice, tisućice), the caption "347: 3 stotice, 4 desetice i
  7 jedinica" (an empty place is named too: "3 stotice, 0 desetica i 7 jedinica"), no other-bases card, no decimal
  aside, and only the base-10 presets on screen (keys 4–6 still load their quantity, in base 10).

## Legend, captions

Legend: a full place (b or more blocks: a dashed red frame and the count struck in the paper) and a block added or
moved by the last move (the kit's changed mark). The mat's buttons (+, −, ⇐ regroup, ⇒ break) carry their meaning in
their tooltips and accessible names ("Zamijeni 10 jedinica za 1 deseticu"); the caption names ⇐ at the start.

Caption: what the last action did (or why it was refused), then the number and its expansion. Words in both languages
in `strings.js`, three registers (`…T`, `…A`, `…C`).

## Terms

jedinice, desetice, stotice, tisućice (ones, tens, hundreds, thousands); mjesna vrijednost (place value); znamenka
(digit); baza (base); pregrupirati (regroup); rastaviti (break up) *(check)*; tablica mjesnih vrijednosti
(place-value chart) *(check)*.

## Out of scope

Negative numbers, fractions and places right of the ones, numbers above 9999, column arithmetic (the other `ari-`
pages), two's complement (`arh-twos-complement`).
