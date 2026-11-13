<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-times-ten: specification

One concept: **multiplying by 10 moves every digit one place left in the place-value table and a 0 fills the ones
(every unit becomes ten times bigger), by 100 two places, by 1000 three; dividing by 10 moves them right (at this
level only numbers that end in 0); in base b the same happens when multiplying by b, which is why a shift is a
multiplication.** Task: `docs/tasks/w3/ari-times-ten.md`; catalogue §4.17 (MAT OŠ A.3.4, A.4.3). Every expected number
below was computed with a small Python script independent of `sim.js` before coding (NOTES.md, Checks) and is
asserted in `sim.test.js`.

## Source: the curriculum (Narodne novine 7/2019), read 2026-11-13

- **MAT OŠ A.3.4** "Pisano množi i dijeli prirodne brojeve do 1000 jednoznamenkastim brojem." Razrada includes
  "Množi i dijeli broj brojevima 10, 100 i 1000." Sadržaj: "… Množenje i dijeljenje broja s 10, 100 i 1000."
  Preporuka: "Postupnost: množiti i dijeliti zbroj brojem, **množiti i dijeliti u tablici mjesnih vrijednosti te
  množiti i dijeliti izvan tablice pravilnim matematičkim zapisom**. Poučiti učenike procjenjivati rezultat, množiti i
  dijeliti broj s 10, 100 i 1000."
- **MAT OŠ A.4.3** razrada: "Množi i dijeli brojeve s 10 i 100." (grade 4 works with numbers up to a million.)
- **MAT OŠ A.3.1** sadržaj: "Skup prirodnih brojeva do 10 000. Tablica mjesnih vrijednosti." (the term is the
  curriculum's own). No example numbers are given for this outcome.
- So: the operation is done **in the place-value table first, then written outside it** (the last step writes
  `47 · 100 = 4700`); dividing by 100 and 1000 is in the outcome too (the task names only `: 10`; NOTES.md,
  Deviations); numbers up to a million.

## Scene (kit view K5, paper columns)

- **The sentence** on top, big: `47 · 100 = ?`, at the last step `47 · 100 = 4700` (the written form outside the
  table). In a base other than 10 the numbers are numerals of that base with the base as a subscript, and under the
  sentence their decimal values (`1011₂ · 100₂ = ?` / `11 · 4`).
- **The operation buttons** under it: `· 10`, `· 100`, `· 1000`, `: 10`, `: 100`, `: 1000`, the current one pressed.
  In base b the labels stay `10`, `100`, `1000`: those are b, b², b³ written in base b, and each button says its
  decimal value under the label (`= · 2`). A button whose operation cannot be finished for this number (rule 5, 6) is
  drawn dashed with ✗ and says why in its tooltip; it can still be pressed, and the demo then shows where it stops.
- **The place-value table** (K5): a place row (base 10: J, D, S, T, DT, ST, M / O, T, H, Th, TTh, HTh, M; other
  bases: bᵏ), and one row per stage, a **staircase**: row 0 is the number, row j the number after j moves (`47`,
  `470`, `4700`). Each row after the first has the move written beside it (`· 10` or `: 10`, the aside column). The
  current row's ones square carries the band (the place where the 0 is written, or the 0 leaves). The 0 written this
  step has the kit's changed mark. The digits of the new row slide in from where they stood in the row above (one
  square right and up for ·, left and up for :), off under reduced motion. Dividing, the 0 that leaves the ones is
  drawn crossed in the square right of the ones (outside the table); a digit that is not 0 there is crossed as wrong
  (rule 6). The table is as wide as the largest number of the demo needs, at least 4 places.
- **Why box** (teacher and adult; from the first move): each non-zero digit of the number and where it goes,
  `4 D · 100 = 4 T`, `7 J · 100 = 7 S` (in base b: `1 · 2³ → 1 · 2⁵`).
- **The same number in decimal** (teacher and adult, base ≠ 10): the rows' values, `11 → 22 → 44`, and that each
  move multiplies (divides) by b. In base 2 a line links it to written multiplication in base 2 (shift and add).
- **Typical mistake card** (teacher, param `mistake`): the pupil's answer from step 0 ("Where is the mistake?"); at
  the last step a small table with the right and the wrong result, the wrong digits crossed in `--danger`, and why.
- **Header:** the audience switch (kit, `Simdeck.paperColumns.audience`). **Panel:** presets; the number field (typed
  in the current base); the base (2–16, quick 2, 8, 10, 16; hidden for the child); the mistake (teacher only).
  At the last step a button "Dalje s rezultatom" (key `D`) makes the result the new number.

## Params

| key | default | range | meaning |
|---|---|---|---|
| `n` | 47 | 1 … 1 000 000 | the number, as a quantity (switching the base keeps it) |
| `op` | `m2` | `m1 m2 m3 d1 d2 d3` | multiply (m) or divide (d) by b¹, b², b³ (· 10, · 100, · 1000 written in base b) |
| `base` | 10 | 2 … 16 | the base |
| `mistake` | `none` | `none few middle` | the typical mistake card (teacher) |

`n`, `op` and `base` reset the demo to step 0. A bad URL value: `n` and `base` are rounded and clamped by the model (a
value that is not a number is 47 and 10); an unknown `op` is `m2`, an unknown `mistake` `none`. On the page the kit's
ranges clamp first: an empty `?base=&n=` is read as 0 and clamped to the minimum, base 2 and n 1.

## Rules (model, `sim.js`)

1. **A move** multiplies by b (one place left: the digit of place k goes to place k + 1) or divides by b (one place
   right: place k to k − 1). `· 10ᵏ` (k = 1, 2, 3) is k moves, `: 10ᵏ` is k moves (10ᵏ written in base b is bᵏ).
2. **Multiplying, a 0 fills the ones** after every move: the ones place would be empty, and the 0 keeps every digit
   in its place. Row j is n · bʲ.
3. **Dividing, the 0 of the ones leaves the table** with every move: row j is n : bʲ, and the digit that left is the
   ones digit of row j − 1.
4. **Steps:** step 0 shows the number and the question; each move is one step; one more step writes the result
   outside the table. So `· 10ᵏ` and `: 10ᵏ` take k + 1 steps (2, 3 or 4; the most is 4).
5. **Over a million (tie-break: exactly a million fits).** When the result n · bᵏ is more than 1 000 000 the
   multiplication is not done: the demo has one step, which says why (the page's range is grade 4's, numbers up to a
   million). 1000 · 1000 = 1 000 000 is done; 1001 · 1000 is over.
6. **Only a 0 may leave (tie-break: a 0 inside the number does not count).** Dividing, when the digit that would leave
   the ones is not 0, the move stops there: that step shows the digit crossed as wrong and is the last step. So
   `: 10ᵏ` works exactly when the numeral ends in k zeros: 3400 : 100 = 34 (3 steps); 3470 : 100 stops at the second
   move (the 7 would leave; 2 steps); 3040 : 100 stops at the second move too (the 4 would leave), although 3040 has
   two zeros. The stop step is j, the move that fails, so the demo has j steps.
7. **The result** is n · bᵏ or n : bᵏ, written outside the table in the last step (rule 4), in the base's numerals.

**State** `{ phase, i }`: `start` (i = 0), `move` (i moves done), `done` (i = k), `over` (i = 0, rule 5),
`stop` (i = j, the move that fails, rule 6). The step count follows the params (the kit's `steps(params)`);
`sim.json` `steps` is the default demo's, 3.

## Typical mistakes (`mistakeOf`)

- **`few`, one move too few** (a 0 too few, or one too few taken away): the pupil writes n · bᵏ⁻¹ or n : bᵏ⁻¹:
  `47 · 100 = 470` (the digits moved one place: that is · 10). With k = 1 nothing moved: `34 · 10 = 34` (that is · 1).
  Applies to every operation that is done (not `over`, not `stop`).
- **`middle`, a 0 taken from the middle** (division only): the pupil crosses out the first k zeros read from the left
  instead of the last k: `3040 : 10 = 340` (right: 304), `20500 : 100 = 250` (right: 205). It does not apply to a
  multiplication, to a division that stops (rule 6), or when the first zeros are the last ones (`3400 : 100`: the same
  numeral, no mistake to see); the card then says so and names the preset that shows it.
- The card compares the wrong result with the right one place by place; a place where they differ is crossed.

## Presets (expected, from the script)

| # | id | demo | rows | steps | notes |
|---|---|---|---|---|---|
| 1 | `ten` | 34 · 10 | 34, 340 | 2 | |
| 2 | `hundred` | 47 · 100, mistake `few` | 47, 470, 4700 | 3 | the card: 47 · 100 = 470 |
| 3 | `thousand` | 205 · 1000 | 205, 2050, 20500, 205000 | 4 | the 0 inside moves like any digit |
| 4 | `divide` | 3040 : 10, mistake `middle` | 3040, 304 | 2 | the card: 340 (right: 304) |
| 5 | `two-zeros` | 3470 : 100 | 3470, 347, stop (7) | 2 | rule 6: : 100 needs two zeros at the end |
| 6 | `base-2` | 1011₂ · 100₂ (11 · 4) | 1011, 10110, 101100 (11, 22, 44) | 3 | a move left is · 2 |

Edge cases (script): 1000 · 1000 = 1 000 000 (4 steps); 1001 · 1000 and 2000 · 1000 over (1 step); 100 000 · 10 =
1 000 000; 100 001 · 10 over; 3400 : 100 = 34 (3 steps, `middle` gives the same numeral); 340 : 100 stops at move 2
(the 4); 347 : 10 stops at move 1 (the 7); 1000 : 1000 = 1 (4 steps); 20500 : 100 = 205, `middle` 250; 1A₁₆ · 1000₁₆ =
1A000₁₆; 100₈ : 100₈ = 1; a million is 7 places in base 10, 20 in base 2, 5 in base 16.

## Captions (three audiences, both languages, `strings.js`)

- **Teacher:** what moves and the numbers: "1. pomak od 2 (or "Jedan pomak:"): svaka znamenka jedno mjesto ulijevo: 4 D → 4 S,
  7 J → 7 D. Jedinice su prazne: pišem 0. 470." Dividing: "… udesno; 0 iz jedinica izlazi." The last step: the
  written form and "2 nule na kraju = 2 pomaka". In base b: "10₂ = 2: svako mjesto vrijedi 2 puta više od onoga desno."
- **Adult:** why: each unit becomes ten (b) times bigger, so 7 ones become 7 tens; nothing is left in the ones and the
  0 keeps the places; dividing, every unit becomes ten times smaller, and a 0 in the ones leaves nothing behind.
- **Child:** one short line: "Sve znamenke jedno mjesto ulijevo. Na mjesto jedinica pišem 0." *(check)*; base 10 only
  (switching to the child view sets base 10, the number stays).

## Terms (hr / en)

tablica mjesnih vrijednosti / place-value table (curriculum); dekadske jedinice / place values (powers of ten);
jedinice, desetice, stotice, tisućice / ones, tens, hundreds, thousands; desetice tisuća (DT), stotice tisuća (ST),
milijun (M) / ten thousands, hundred thousands, a million *(check: the abbreviations DT, ST, M)*; množenje,
dijeljenje / multiplication, division ("množenje brojem 100", the curriculum's "množi … brojevima 10, 100 i 1000",
which avoids s/sa before a number); pomak (ulijevo, udesno) / move (left, right) *(check)*; umnožak, količnik /
product, quotient; baza / base.

## Misconceptions targeted

- "Add a zero" as a trick: the page shows the digits moving (every unit ten times bigger), the 0 as a place holder.
- A 0 too few (· 100 written as · 10).
- Taking a 0 from the middle when dividing (3040 : 10 = 340).
- Dividing a number that does not end in 0 by 10 (the 7 would have to leave the table).
- "Only base 10 works this way": in base b, multiplying by b is the same move (10 is b written in base b).

## Out of scope

Decimal numbers and remainders of : 10 (347 : 10 stops; the remainder is `ari-remainder`'s), multiplying by other
round numbers (· 30, · 200: that is written multiplication), units of measure (`geo-units`), numbers over a million,
negative numbers.
