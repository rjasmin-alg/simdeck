<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-column-subtraction: specification

One concept: **when a top digit is smaller, either borrow (take one from the next column, it is worth the base here)
or use equal additions (add the base to the top digit and one to the next digit taken away); both keep the
difference unchanged, so they give the same answer.** Task: `docs/tasks/w3/ari-column-subtraction.md`; catalogue
§4.16. Every expected number below was checked with a small script before coding (NOTES.md, Checks) and is asserted
in `sim.test.js`.

## Scene (kit view K5, paper columns: `kit/papercolumns.js`, docs/sim-ui.md §14)

- **Two papers side by side**, the same subtraction on each, the same columns and rows so their squares line up:
  **left, borrowing** (*posuđivanje*), **right, equal additions** (*jednaki dodaci* *(check)*). Rows, top to bottom:
  the place row (J, D, S, T… in base 10, b with the place as a superscript in other bases, as in
  `ari-column-addition`), two borrow rows, the top number (*umanjenik*), the number taken away (*umanjitelj*) with the
  `−` sign, the rule and the result (*razlika*).
- **Borrowing** rewrites the top digits: a digit that is rewritten is crossed out (`x: true`, ink: rewriting is not a
  mistake) and its new value is written in the borrow row above it; a second rewrite goes one row higher. New values
  are numerals of the base (thirteen ones in base 10 is `13`; sixteen ones in base 16 is `10`).
- **Equal additions** writes nothing over the digits: the top digit that gets the base added has a small `1` in its
  corner (3 reads 13), and the next digit taken away has a small `+1` (a missing digit taken away gets the `+1` on an
  empty square: it is 0 + 1).
- **Current column:** the band (tint and thick outline) over the same column on both papers. A mark made in this step
  has the kit's changed mark.
- **Why box** (below the papers, teacher and adult views): borrowing, the top number as the sum of its current
  digits times their place values, always equal to the top number ("4 S + 9 D + 13 J = 503" in base 10 with the
  school place letters, "4 × 256 + 25 × 16 + 16 × 1 = 1440" in other bases: the same number, written differently); equal additions, both numbers grown by the same amount ("(503 + 110) − (178 + 110) =
  613 − 288": the difference stays). In quantities (decimal), labelled so when the base is not 10.
- **Typical mistake card** (teacher view, when chosen): the same subtraction done the wrong way, filled column by
  column in step with the papers, wrong digits struck through (`x: 'wrong'`), the wrong result against the right one
  and why it is wrong.
- **Header:** the audience switch (kit). **Panel:** the numbers field, the base (2–16 and quick buttons 2, 8, 10,
  16), the typical mistake (teacher only).

## Params

| key | default | meaning |
|---|---|---|
| `a`, `b` | 503, 178 | the top number and the number taken away, as quantities |
| `base` | 10 | 2–16; digits 0–9 then A–F |
| `mistake` | `none` | `none`, `smaller`, `forget`, `zero` |

As in `ari-column-addition`, the numbers are quantities: changing the base keeps them and rewrites their digits.
**Limits:** the top number has at most **9 digits** in the base (so at most 18 steps); the number taken away is not
larger than the top number (no negative results). A base in which the top number needs more than 9 digits is
refused (quick button unavailable with the reason; slider minimum `minBase`). Typed input (`503 − 178`; separators
`-`, `−`, `–` and spaces; a–f read as A–F; leading zeros dropped) is refused with a reason when: a character is not a
digit of the base (`digit`), a number has more than 9 digits (`long`), there are not exactly two numbers (`count`), a
number is missing next to a minus (`empty`), or the number taken away is larger (`order`). A bad URL value falls back:
`b` > `a` is read as `b = a`.

The **child** view works in base 10 only (base controls hidden; switching to it sets base 10, or the default
numbers if the top number would not fit in 9 decimal digits). The typical mistake is shown in the teacher view only.

## State

`{ phase: 'start'|'look'|'write', col, hist: [[values]], eTop: [bool], eBot: [bool], res: [digit|null] }`, plain
JSON. `col` is the column being worked on (0 = ones; −1 at the start). Borrowing: `hist[k]` is the top digit of
column k and its rewrites, oldest first (`[0, 10, 9]`). Equal additions: `eTop[k]` the base added to the top digit
of column k, `eBot[k]` one added to the digit taken away in column k. `res[k]` the result digit of column k, the same
for both methods (that is the point).

## One step

Step 0: the numbers written, aligned on the right, on both papers. Then for each column k from the right:

1. **look** (step 2k + 1): compare the column's top digit with the digit taken away, on each paper.
   - Borrowing: the top digit as it now is (after earlier borrows) against the digit taken away. If smaller, borrow:
     the first non-zero top digit to the left (column j) is lowered by 1; every 0 between becomes the base and then,
     as it lends, base − 1 (two rewrites: `0 → 10 → 9`); the top digit of column k becomes digit + base.
   - Equal additions: the top digit (never rewritten) against the digit taken away plus the 1 carried from the column
     on the right (if that column needed it). If smaller, the top digit gets the base (`eTop[k]`) and the next digit
     taken away gets 1 (`eBot[k + 1]`).
2. **write** (step 2k + 2): the difference digit is written under the rule on both papers; it is the same digit.

**Step count** = 2 × (digits of the top number). Default 503 − 178: 6 (`sim.json` `steps`). At most 18.

## Rules (tie-breaks first)

1. **Tie-break: equal digits do not borrow.** Top digit = digit taken away → write 0, no borrow (77 − 77: 0, 0, no
   rewrite, no tag). Borrow only when the top digit is strictly smaller.
2. **Tie-break: in equal additions the carried 1 is added before comparing.** The digit taken away 9 plus the carried
   1 is 10 (the base): a top 0 is smaller and needs the base (1000 − 999: the tens compare 0 with 9 + 1 = 10 → 10 −
   10 = 0). With nothing taken away in that column the carried 1 is taken from the top digit alone (503 − 78:
   hundreds 5 − (0 + 1) = 4).
3. **Tie-break: leading zeros of the result are not written.** A result digit 0 with only zeros to its left is left
   empty, except the ones (77 − 77 = 0, 103 − 98 = 5, 1000 − 1 = 999).
4. **Order:** columns from the right; the look step before the write step.
5. **Borrowing: one of the next place is worth the base here.** 503 − 178: ones 3 < 8; the tens hold 0, so the
   hundreds lend: 5 → 4, the tens 0 → 10 → 9, the ones 3 → 13; 13 − 8 = 5; tens 9 − 7 = 2; hundreds 4 − 1 = 3 → 325.
   The top number keeps its value at every step: 4 S + 9 D + 13 J = 400 + 90 + 13 = 503.
6. **Borrowing: a column can lend and then borrow** (two rewrites): 742 − 347: ones 2 < 7, tens 4 → 3, ones 2 → 12,
   12 − 7 = 5; tens 3 < 4, hundreds 7 → 6, tens 3 → 13, 13 − 4 = 9; hundreds 6 − 3 = 3 → 395. A column is rewritten at
   most twice (checked over all bases 2–16, script).
7. **Equal additions: the base on top, one of the next place below.** 503 − 178: ones 3 < 8 → 13 − 8 = 5, +1 to the
   tens taken away; tens 0 < 7 + 1 = 8 → 10 − 8 = 2, +1 to the hundreds; hundreds 5 − (1 + 1) = 3 → 325. Both
   numbers grew by 10 + 100 = 110: 613 − 288 = 325.
8. **Both methods write the same digit in every column**, and the result is the top number minus the number taken
   away, in every base (all a ≤ 300 and b ≤ a in bases 2–16, and random nine-digit numbers, script; random inputs in
   the tests).
9. **Any base, same algorithm:** 5A0₁₆ − 1F9₁₆: ones 0 < 9, tens A → 9, ones 0 → 10₁₆ (16), 16 − 9 = 7; tens 9 < F,
   hundreds 5 → 4, tens 9 → 19₁₆ (25), 25 − 15 = 10 = A; hundreds 4 − 1 = 3 → 3A7₁₆ = 935 = 1440 − 505. Equal
   additions: bottoms 9, F + 1 = 16, 1 + 1 = 2; added 110₁₆ = 272. 10010₂ − 111₂ = 1011₂ (18 − 7 = 11).

## Typical mistakes (teacher view)

Computed by the model from the same numbers, shown column by column in step with the papers.

| `mistake` | what is done wrong | 503 − 178 | other values (script) | why (shown) |
|---|---|---|---|---|
| `smaller` | in each column the smaller digit is taken from the larger | **475** | 624 − 358 → 334; 1000 − 1 → 1001; 10010₂ − 111₂ → 10101₂; 5A0₁₆ − 1F9₁₆ → 459₁₆ | the number below is always taken from the one above; 8 − 3 is not 13 − 8 |
| `forget` | the base is added to the top digit, but nothing is taken from the left (borrowing: the lender not lowered; equal additions: no +1 below) | **435** (too big by 110) | 624 − 358 → 376; 742 − 347 → 405; 1000 − 1 → 1009; 5A0₁₆ − 1F9₁₆ → 4B7₁₆ | the base came from nowhere: the result is too big by exactly what was added, ∑ baseᵏ⁺¹ over the columns whose top digit is smaller than the digit below it (503 − 178: 10 + 100; 1000 − 1: 10) |
| `zero` | borrowing across a 0: the zeros become 9, but the first non-zero digit is not lowered | **425** (too big by 100) | 1000 − 1 → 1999; 500 − 1 → 599; 10010₂ − 111₂ → 11011₂ | the borrow must reach the first digit that is not 0; equal additions never borrows, so it has no such step |

**Tie-break:** a mistake that gives the right result here (no column needs the base for `smaller` and `forget`; no
zero crossed for `zero`: 742 − 347, 624 − 358) marks no digit wrong, and the card says why it does not show. Leading
zeros of a wrong result are not written either.

## Presets (keys 1–6)

| # | id | numbers | base | mistake | steps | outcome |
|---|---|---|---|---|---|---|
| 1 | `zero-top` | 503 − 178 | 10 | none | 6 | 325; borrowing crosses the 0 (0 → 10 → 9), equal additions just adds |
| 2 | `lend-borrow` | 742 − 347 | 10 | none | 6 | 395; the tens lend, then borrow (4 → 3 → 13) |
| 3 | `many-zeros` | 1000 − 1 | 10 | none | 8 | 999; the ones 0 → 10, the tens and hundreds 0 → 10 → 9, the thousands 1 → 0, against three +1 tags; the leading 0 not written |
| 4 | `smaller-mistake` | 624 − 358 | 10 | smaller | 6 | 266; the mistake gives 334 |
| 5 | `base-2` | 10010 − 111 | 2 | none | 10 | 1011₂ = 11 = 18 − 7 |
| 6 | `base-16` | 5A0 − 1F9 | 16 | none | 6 | 3A7₁₆ = 935 = 1440 − 505 (the inverse of addition's preset 6) |

## Audiences (same model, other words)

| | teacher (default) | adult | child |
|---|---|---|---|
| captions | each method's step in school words, then "both write 2" | why it works: the borrowed ten is 10 ones; both numbers grew by the same | the spoken step: borrowing "3 je manje od 8: posudim. 13 − 8 = 5." equal additions "8 i koliko je 13? 5. Pišem 5, pamtim 1." *(check)* |
| why box | yes | yes | no |
| digits | normal | normal | larger |
| base | any | any | 10 only |
| typical mistake | yes | no | no |

## Legend

current column (kit `pc-band`), rewritten digit (crossed, the new value above), the base added on top (small 1), one
added below (small +1), written in this step (kit `hl`).

## Terms

| hr | en |
|---|---|
| pisano oduzimanje | column subtraction |
| umanjenik | minuend (the top number) |
| umanjitelj | subtrahend (the number taken away) |
| razlika | difference |
| posuđivanje *(check)* | borrowing (decomposition) |
| jednaki dodaci *(check)* | equal additions |

## Misconceptions targeted

- "Take the smaller from the larger" (mistake `smaller`).
- "Borrowing makes the number bigger": the why box shows the top number unchanged.
- "Equal additions changes the problem": both numbers grow by the same, the difference stays.
- "Borrowing from a 0 is impossible / skips the 0" (preset 3, mistake `zero`).
- "Base 2 or 16 is different maths" (presets 5, 6, the base switch).

## Out of scope

Negative results, decimals, more than two numbers, the complement method, which method Croatian schools teach (the
page does not say: owner to confirm, catalogue §4.16), checking a result by addition (`ari-checking`).
