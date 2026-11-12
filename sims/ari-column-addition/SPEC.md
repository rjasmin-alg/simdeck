<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-column-addition: specification

One concept: **add column by column from the right; a column whose sum reaches the base writes what is left over
and carries the rest to the next column (more than 1 with three or more numbers); the carry is a regrouping, not a
trick.** Task: `docs/tasks/w3/ari-column-addition.md`; catalogue §4.16. Every expected number below was checked with
a small script before coding (NOTES.md, Checks) and is asserted in `sim.test.js`.

## Scene (kit view K5, paper columns: `kit/papercolumns.js`, docs/sim-ui.md §14)

- **Paper** (left, the largest part): squared-paper cells, one digit per cell, the numbers written under each other
  **aligned on the right** (ones under ones), the `+` sign left of the last number, a rule under it, the result row
  under the rule. Above the numbers the **carry row** (small digits above the column they go into), above that the
  **place row**: in base 10 the school letters J, D, S, T (jedinice, desetice, stotice, tisućice; English O, T, H, Th)
  and beyond the thousands DT, ST, M, DM, SM (TTh, HTh, M, TM, HM) *(check)*; in any other base the place value as a
  power of the base, bᵏ (2³, 16²…), with its decimal value in the tooltip. Captions call such a place "×64".
  In a base other than 10 each number has its decimal value written at the right (teacher and adult views).
- **Current column:** a highlighted band (highlighter colour **and** a thick ink outline) over the column being added,
  carry cell included. A digit written in this step has the kit's changed mark.
- **Regrouping box** (right): the current column's sum as dots, one dot per unit of that place: filled dots for the
  digits of the numbers, hollow rings for the units that came in as a carry. In the write step the dots are grouped:
  every full group of *base* dots is outlined (dashed) and leaves as **one** unit of the next place (the carry); the
  dots that are left over are the digit written. This is the "why": nothing is added or lost, *base* units of one
  place are regrouped into one unit of the next.
- **Typical mistake card** (right, teacher view, when chosen): the same sum done the wrong way, filled in column by
  column in step with the paper, wrong digits struck through, the wrong result against the right one and why it is
  wrong.
- **Header:** the audience switch (Učitelj / Odrasli / Dijete), remembered across the `ari-` pages. **Panel:** the
  numbers field, the base (any base 2–16 and quick buttons 2, 8, 10, 16), the typical mistake (teacher only).

## Params

| key | default | meaning |
|---|---|---|
| `count` | 2 | how many numbers, 2–4 |
| `a`, `b`, `c`, `d` | 457, 368, 0, 0 | the numbers as quantities (the first `count` are used) |
| `base` | 10 | 2–16; digits 0–9 then A–F |
| `mistake` | `none` | `none`, `nocarry`, `whole`, `left` |

The numbers are kept as quantities, not as digit strings, so **changing the base keeps the quantity and rewrites its
digits** (the owner's point: a base is only a way of writing a number). The field shows them in the current base and
reads what is typed in the current base.

**Limits:** 2 to 4 numbers, each at most **9 digits** in the current base (so a demo has at most 2·9 + 1 = 19
steps). A base in which some number would need more than 9 digits is refused: its quick button is unavailable with
the reason, and the base slider's lowest value is the smallest base in which every number fits (`minBase`).
Typed input is refused (field marked, reason under it, params unchanged) when: a character is not a digit of the
base (`digit`), a number has more than 9 digits (`long`), there are fewer than 2 or more than 4 numbers (`count`), or
a number is missing between two `+` (`empty`). Separators: `+`, spaces. Lower-case a–f is read as A–F. Leading zeros
are dropped (`0457` is 457); 0 is the one digit `0`.

The **child** view always works in base 10 (the base controls are hidden); switching to it sets base 10 (or, if a
number would not fit in 9 decimal digits, loads the default numbers). The typical mistake is shown only in the
teacher view.

## State

`{ phase: 'start'|'sum'|'write'|'final', col, sum, carryRow: [n|null], resultRow: [digit|null] }`, plain JSON.
`col` is the column being worked on (0 = ones; −1 at the start; `cols` in the final step), `sum` that column's sum
(its digits plus the carry into it). `carryRow[k]` is the carry written above column k (null if none written yet or
none), `resultRow[k]` the result digit written in column k (index `cols`, `cols+1` hold the final carry's digits).

## One step

Step 0: the numbers written, aligned on the right; nothing added. Then, for each column from the right (k = 0, 1…):

1. **sum** (step 2k+1): the column is added: its digits (only the numbers long enough to have one) plus the carry
   written above it. Nothing is written yet.
2. **write** (step 2k+2): `digit = sum mod base` is written under the rule in this column; `carry = ⌊sum / base⌋`,
   if > 0, is written above the next column.

Then, if the last column carried, one **final** step writes that carry as the leading digit(s) of the result.

**Step count** = 2 · columns + (1 if the last column carries). Default 457 + 368: 6 (`sim.json` `steps`).

## Rules (tie-breaks first)

1. **Tie-break: a sum equal to the base carries.** sum = base → write 0, carry 1 (645 + 355: every column is exactly
   10 → 1000). sum = base − 1 → write base − 1, no carry (the tens of 645 + 355 without the carry: 4 + 5 = 9). The
   catalogue's "reaches the base". Source: definition of positional notation (a place holds digits 0 … base − 1).
2. **Order:** columns from the right, ones first; a column is added only after the carry into it is written.
3. **Write what is left over, carry the rest:** digit = sum mod base, carry = ⌊sum / base⌋ (the quotient, not just
   "1"). 457 + 368: 7 + 8 = 15 → 5, carry 1; 5 + 6 + 1 = 12 → 2, carry 1; 4 + 3 + 1 = 8 → 8; 825.
4. **The carry is part of the next column's sum**, added like any digit (shown as hollow dots).
5. **More numbers, bigger carry:** with k numbers the carry is at most k − 1 (a column sum is at most
   k(base − 1) + (k − 1) = k·base − 1). 2738 + 4596 + 1879 + 3967: 30 → 0 carry 3; 25 + 3 = 28 → 8 carry 2;
   29 + 2 = 31 → 1 carry 3; 10 + 3 = 13 → 3 carry 1; final 1 → 13180. Checked for all bases 2–16 and 2–4 numbers of
   nine digits (script).
6. **A carry can need more than one digit** when it reaches the base itself (only in base 2 with 3–4 numbers, base 3
   with 4): it is written in the carry cell in the base (two in base 2 is `10`) and, as a final carry, gives two
   leading digits. 111₂ + 111₂ + 111₂ + 111₂: 4 → 0 carry 2 (`10`); 4 + 2 = 6 → 0 carry 3 (`11`); 4 + 3 = 7 → 1 carry 3
   (`11`); final 3 → `11` → 11100₂ = 28 = 4 · 7.
7. **Shorter numbers:** a column adds only the digits that exist (no written zeros); the result is the same.
   1205 + 87: 5 + 7 = 12 → 2 carry 1; 0 + 8 + 1 = 9; 2; 1 → 1292.
8. **Any base, same algorithm:** 3A7₁₆ + 1F9₁₆: 7 + 9 = 16 → 0 carry 1; A + F + 1 = 26 → A carry 1 (26 = 1·16 + 10);
   3 + 1 + 1 = 5 → 5A0₁₆ = 1440 = 935 + 505. 1011₂ + 111₂: 2 → 0 c1; 3 → 1 c1; 2 → 0 c1; 2 → 0 c1; final 1 →
   10010₂ = 18 = 11 + 7.
9. **The result is the sum of the quantities** in every base (tested over many random inputs).

## Typical mistakes (teacher view)

The wrong way is computed by the model from the same numbers and shown column by column in step with the paper.

| `mistake` | what is done wrong | wrong cell in column k | 457 + 368 | why it is wrong (shown) |
|---|---|---|---|---|
| `nocarry` | the carry is not added (or not remembered) | (column digits) mod base | **715** (short by 110) | each forgotten carry is a whole unit of the next place: the result is short by exactly their value, here 10 + 100 = 110 = ∑ ⌊Sₖ / base⌋ · baseᵏ⁺¹ |
| `whole` | the whole column sum is written in the column | the column sum, all its digits | **71115** | a place holds one digit: 15 ones are 1 ten and 5 ones; written whole, the 1 pushes every digit on its left one place further |
| `left` | the numbers are aligned on the left (first digits under each other) | the column digit of the left-aligned numbers | 1205 + 87 → **9905** (87 read as 8700) | digits are written under each other by place, from the right: the 8 of 87 is 8 tens, not 8 thousands |

**Tie-break:** a mistake that happens to give the right numeral (no column reaches the base; for `whole`, only the
last column does, whose whole sum is the right leading digits anyway: 5 + 5 → "10"; for `left`, equal lengths or a
shorter addend of 0) marks no digit wrong, and the card says why it does not show here. Expected values
(script): 645 + 355 → nocarry 990, whole 9910; 2738 + 4596 + 1879 + 3967 → nocarry 0950 (the forgotten thousands' carry leaves a 0 in front; short by 12230), whole
10292530; 1205 + 87 → nocarry 1282, whole 12812, left 9905; 1011₂ + 111₂ → nocarry 1100₂ (short by 110₂ = 6),
whole 111010₂, left 11001₂ (111 read as 1110); 3A7₁₆ + 1F9₁₆ → nocarry 490₁₆ (short by 110₁₆ = 272), whole 41910₁₆.

## Presets (keys 1–6)

| # | id | numbers | base | mistake | steps | outcome |
|---|---|---|---|---|---|---|
| 1 | `two-numbers` | 457 + 368 | 10 | none | 6 | 825; two carries of 1, the hundreds without one |
| 2 | `reaches-base` | 645 + 355 | 10 | none | 7 | 1000; every column exactly 10 (rule 1), a final carry |
| 3 | `four-numbers` | 2738 + 4596 + 1879 + 3967 | 10 | none | 9 | 13180; carries 3, 2, 3, 1 (rule 5) |
| 4 | `left-aligned` | 1205 + 87 | 10 | left | 8 | 1292; the mistake gives 9905 |
| 5 | `base-2` | 1011 + 111 | 2 | none | 9 | 10010₂ = 18; every column carries |
| 6 | `base-16` | 3A7 + 1F9 | 16 | none | 6 | 5A0₁₆ = 1440; A + F + 1 = 26 → A carry 1 |

## Audiences (same model, other words)

| | teacher (default) | adult | child |
|---|---|---|---|
| captions | the step in school words, with the place (add: "Desetice: 5 + 6 + 1 = 12. 12 ≥ 10: bit će prijenosa."; write: "Pišem 2, pamtim 1: prijenos ide u stupac stotica.") | why it works: the regrouping in place-value words ("12 desetica = 1 stotica i 2 desetice…") | the spoken school step only ("5 + 6 + 1 = 12. Pišem 2, pamtim 1.") |
| digits | normal | normal | larger |
| base | any (2–16) | any | 10 only, controls hidden |
| typical mistake | yes | no | no |
| decimal values (base ≠ 10) | yes | yes | — |

Stored in `localStorage` `simdeck.ari.audience` (shared by the `ari-` pages) and in the URL as `?audience=` when
not the default; the URL wins.

## Legend

current column (highlighter + outline), carry (small digit in the carry row), digit written in this step (changed
mark), a full group = one of the next place (dashed outline), carried-in unit (hollow ring).

## Terms

| hr | en |
|---|---|
| pisano zbrajanje | column addition |
| pribrojnik | addend |
| zbroj | sum |
| prijenos (pamtim) | carry |
| baza | base |
| mjesna vrijednost | place value |
| jedinice, desetice, stotice, tisućice (J, D, S, T) | ones, tens, hundreds, thousands (O, T, H, Th) |
| pregrupiranje *(check)* | regrouping |

## Misconceptions targeted

- "Carrying the 1 is a trick": the dots show base units becoming one unit of the next place.
- "The carry is always 1": four numbers carry up to 3 (preset 3).
- "You carry when the sum is more than 9 / more than 10": you carry when it **reaches** the base (preset 2, base 2).
- "Base 2 or 16 is different maths": the same algorithm, other digits (presets 5, 6, the base switch on any sum).
- The three typical mistakes above.

## Out of scope

Subtraction, multiplication, decimals and negative numbers (other `ari-` pages); mental addition strategies;
numbers with more than 9 digits.
