<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-long-division: specification

One concept: **take as few leading digits as can be divided, ask how many times, multiply, subtract, bring down the
next digit, repeat; a 0 in the quotient when a step is too small; the remainder is less than the divisor.** Task:
`docs/tasks/w3/ari-long-division.md`; catalogue §4.16 and §4.17; the two layouts and the estimate: task t-0435 (the
curriculum, NN 7/2019, MAT OŠ A.3.4 and A.4.3). Every expected number below was computed with a small script
independent of `sim.js` before coding (NOTES.md, Checks) and is asserted in `sim.test.js`.

## Scene (kit view K5, paper columns: `kit/papercolumns.js`, docs/sim-ui.md §14)

- **The paper**, the Croatian school layout: the line `846:3=282` on one row, one sign or digit per square, the
  dividend's ones at place 0 (its places labelled J, D, S… in base 10, bᵏ in other bases), `:`, the divisor and `=`
  right of it, the quotient growing to the right one digit at a time. Under the dividend, in one of **two layouts**
  (param `layout`; both are in the curriculum, which introduces written division "na dulji način (s potpisivanjem
  djelomičnoga umnoška) ili na kraći način" and recommends the shorter once pupils can):
  - **kraći način** (shorter way, the default): **only the remainders** are written, the product is said and the
    subtraction done in the head: row i + 1 is the remainder of quotient digit i, ending under the last dividend digit
    of the number divided, then the next dividend digit **brought down** beside it (`24`, `06`).
  - **dulji način** (longer way): before each remainder row, the **partial product** q[i] · d, right-aligned under the
    number divided, with a **minus sign** in the square left of that number, and a **rule** over the remainder row under
    the number's squares; then the remainder with the digit brought down, as in the shorter way (rule 11). The paper
    has one more square on the left for the first minus.
  The last row is the final remainder, bold. The paper keeps its full size from step 0 (empty rows and quotient
  squares), so nothing jumps.
- **The band** (kit `pc-band`, tint and thick outline) marks what the step works on: the number being divided, the
  divisor and the quotient square (how many times); the number, the divisor, the quotient digit and the remainder's
  squares (multiply and subtract); the dividend column from the line down to the row (bring down). The digits written
  this step have the kit's changed mark.
- **"How many times?" box** (teacher and adult; a switch, on by default): the multiples of the divisor, k · d for k =
  1 … min(q + 1, base − 1), each marked "fits" (≤ the number, ✓) or "too big" (✗, the value struck); the chosen one
  outlined (a q of 0 adds 0 · d = 0). At the start and after a bring-down the box asks the next question: every
  multiple k · d for k = 1 … base − 1, unmarked, so the list does not give the answer away. **For a two-digit divisor
  in base 10** the box estimates instead (rule 12): the number and the divisor rounded to the tens (`98 ≈ 100, 12 ≈
  10`; the question view shows only this and "estimate, then check by multiplying"), the estimate `100 : 10 = 10` (when
  it is not a digit: "try 9"), then the tries in order, each `k · d = value` marked ✗ too big (value struck), ↑ too
  small (the remainder is not less than the divisor) or ✓ fits (outlined), joined by arrows. Under it
  the **invariant** line: `dividend = divisor · already divided + still to divide` (`846 = 3 · 200 + 246`): each step
  moves a part from the right term into the quotient; at the end it is the check `846 = 3 · 282 + 0`. Numerals in the
  current base.
- **Typical mistake card** (teacher view, when chosen): the same division done the wrong way, the wrong quotient digits
  struck through (`x: 'wrong'`), its working, the wrong quotient against the right one, the check that fails, and why.
- **Header:** the audience switch (kit). **Panel:** the numbers field, the base (2–16 and quick buttons 2, 8, 10, 16),
  the layout (kraći način / dulji način, every audience), the "how many times" switch, the typical mistake (teacher
  only). Eight presets sit in two columns at 1920×1080 (one on a phone) so the panel fits.

## Params

| key | default | meaning |
|---|---|---|
| `a`, `b` | 846, 3 | the dividend and the divisor, as quantities |
| `base` | 10 | 2–16; digits 0–9 then A–F |
| `why` | true | show the "how many times" box (teacher and adult) |
| `mistake` | `none` | `none`, `zero`, `dropped` |
| `layout` | `short` | `short` (kraći način: only the remainders), `long` (dulji način: the partial products written) |

As in the sibling `ari-` pages, the numbers are quantities: changing the base keeps them and rewrites their digits.
**Limits:** the dividend has at most **6 digits** in the base and the divisor at most **3**, and the divisor is at least
1. That bounds the quotient at 6 digits, the steps at 3 · 6 − 1 = **17** (script: the most over all bases 2–16) and the
paper at 15 squares by 8 rows. A base in which a number needs more digits is refused (quick button unavailable with
the reason; the slider's minimum is `minBase`). Typed input (`846 : 3`; separators `:`, `÷`, `/` and spaces; a–f read
as A–F; leading zeros dropped) is refused with a reason when a character is not a digit of the base (`digit`), the
dividend has more than 6 or the divisor more than 3 digits (`long`), there are not exactly two numbers (`count`), a
number is missing next to a sign (`empty`), or the divisor is 0 (`zero`). A URL value is made whole (floored) and
clamped to the current base's limits (dividend ≤ base⁶ − 1, divisor 1 … base³ − 1), and the page writes the clamped
numbers back: `?a=Infinity` (which the kit clamps to the range maximum first) reads as 999999 in base 10.

The **child** view works in base 10 only (base control hidden; switching to it sets base 10, or the default numbers
if they would not fit). The box and the typical mistake are not shown to the child.

## Plan (computed from the params)

With A the dividend's digits (left first), n of them, and d the divisor:

- **The first number** is the smallest leading part of the dividend, g digits, whose value is at least d; if even the
  whole dividend is smaller than d, g = n (the quotient is 0).
- The quotient has **Q = n − g + 1** digits. Digit i works on the number `N[i]` that ends at dividend place
  `end[i] = n − g − i`: `q[i] = ⌊N[i] / d⌋`, the product `q[i] · d`, the remainder `r[i] = N[i] − q[i] · d`; then (i <
  Q − 1) the next dividend digit `A[g + i]` is brought down: `N[i + 1] = r[i] · base + A[g + i]`.
- Row i + 1 of the paper (shorter way): the numeral of r[i] (at least one digit, so 0 is written `0`) ending at
  `end[i]`, and the brought-down digit at `end[i] − 1`.
- The number divided by digit i starts at dividend place `hi[i]`: n − 1 for i = 0, else `end[i] + (digits of r[i − 1])`.
- Longer way: rows 2i + 1 (the product, ending at `end[i]`, the minus at `hi[i] + 1`) and 2i + 2 (the remainder row
  as above, with a rule over places `hi[i]` … `end[i]`); the number divided by digit i is on row 0 (i = 0) or 2i. The
  paper has n + 1 place squares (`workingOf`).

## State

`{ phase: 'start'|'ask'|'sub'|'down', i, quot: [digits written, left first], rows: [{ rest: [digits, ones first] |
null, down: digit | null }] }`, plain JSON; `i` is the quotient digit of this step (−1 at the start).

## One step

Step 0: the line `846:3=` written. Then for each quotient digit i:

1. **`ask`, how many times:** `q[i]` is written after `=`.
2. **`sub`, multiply and subtract:** shorter way: `q[i] · d` is said; `r[i]` is written under the number, ending under
   its last digit. Longer way: the same step also writes `q[i] · d` with its minus and rule above the remainder.
3. **`down`, bring down** (not after the last digit): the next dividend digit is written beside the remainder.

**Step count** = 3Q − 1 in both layouts (the longer way writes more in the same steps; the state does not depend on the
layout). Default 846 : 3: Q = 3, **8** steps (`sim.json` `steps`). At most 17 (Q = 6).

## Rules (tie-breaks first)

1. **Tie-break: a leading part equal to the divisor can be divided.** 312 : 3: the first number is 3 (g = 1), 3 : 3 =
   1, remainder 0; 312 : 3 = 104. 3 : 3 = 1, remainder 0, 2 steps.
2. **Tie-break: a whole dividend smaller than the divisor** is the one number: the quotient is a single 0 and the
   remainder is the dividend. 2 : 3 = 0, remainder 2 (2 steps); 0 : 3 = 0, remainder 0.
3. **Tie-break: a remainder of 0 is written** (`0`, then the digit brought down beside it: `06`) *(check)*, and the last
   remainder 0 too.
4. **Take as few leading digits as can be divided:** 1736 : 7: 1 < 7, so the first number is 17 (g = 2), Q = 3; no
   leading 0 is written in the quotient.
5. **A number smaller than the divisor gives a 0 in the quotient,** inside or at the end, and the work goes on: 0 · d =
   0 is subtracted (the remainder is the number), the next digit is brought down. 618 : 3 = **206**: 6 : 3 = 2, r 0, `01`;
   1 : 3 = 0, r 1, `18`; 18 : 3 = 6, r 0. 630 : 3 = 210 (`03`, `00`, `0`). 2023 : 4 = **505**, r 3 (`02`, `23`, `3`).
6. **How many times:** q[i] is the largest k with k · d ≤ N[i]; then r[i] < d. Every q[i] is a digit of the base (N[i] <
   d · base, script over all bases).
7. **The remainder is less than the divisor** at every step (script; tested).
8. **The result:** quotient · d + remainder = dividend and remainder < d, in every base (all a < min(b⁶, 3000), d <
   min(b³, 40) and 4000 random pairs per base 2–16, script; random inputs in the tests).
9. **The invariant:** after step `sub` of digit i, already divided = the quotient digits so far · base^end[i], still to
   divide = dividend − d · already divided = r[i] · base^end[i] + the dividend's digits right of end[i]. 846 : 3: after
   the first `sub`, 846 = 3 · 200 + 246; after the second, 3 · 280 + 6; at the end 3 · 282 + 0.
10. **Any base, same algorithm:** 846 : 3 in base 16 is 34E : 3 = **11A** (3 : 3 = 1 r 0, `04`; 4 : 3 = 1 r 1, `1E`;
    1E : 3 = A r 0). Base 2: 101110 : 101 (46 : 5) = **1001**, remainder 1 (`01`, `11`, `110`, `1`), 11 steps; every
    quotient digit is 0 or 1: "how many times" is "does it fit".
11. **The longer way** writes, for each quotient digit, the partial product under the number divided (right-aligned,
    never wider than the number), a minus left of the number, a rule, then the same remainder row as the shorter way.
    **Tie-break: the layout changes no number and no step**, only what is written. 846 : 3: `−6` (minus at place 3),
    rule over place 2, `24`; `−24` (minus at 3), rule over 2…1, `06`; `−6` (minus at 2), rule over 1…0, `0`. 5517 : 28 =
    197 r 1: `−28`, `271`, `−252`, `197`, `−196`, `1` (minus at 4, 4, 3). A 0 in the quotient writes `−0`: 618 : 3 →
    `−6`, `01`, `−0`, `18`, `−18`, `0`. A first number of two digits puts its minus one square further left (2023 : 4:
    `−20`, minus at 4).
12. **The estimated partial quotient** (two-digit divisor, base 10, the grade-4 method: "procjenjuje djelomični
    količnik"). **Tie-break: only a divisor of exactly two digits in base 10**; one or three digits, or another base,
    keep the list of multiples. Round the number and the divisor half up to the tens (the divisor's leading place):
    nr, dr. The estimate is ⌊nr / dr⌋; the first try is it, at most 9. A try whose product is more than the number is
    "too big" and the next try is one less; a try that leaves a remainder ≥ the divisor is "too small" and the next is
    one more; the try that fits is the quotient digit. 98 : 12 ≈ 100 : 10 = 10 (not a digit) → 9 (108, too big) → 8 (96,
    fits). 5517 : 28: 55 ≈ 60, 60 : 30 = 2 → 2 (56, too big) → 1; 271 ≈ 270, 270 : 30 = 9, fits at once; 197 ≈ 200, 200
    : 30 = 6 → 6 (168, remainder 29 ≥ 28, too small) → 7 (196). Half up: 80 : 16 ≈ 80 : 20 = 4 → 5; 95 : 12 ≈ 100 : 10
    → 9, 8, 7. Script over every number < 10 · d for d = 10 … 99: the last try is always ⌊N / d⌋, the corrections go one
    way by one, at most **4 tries** (75 : 13: 8, 7, 6, 5).

## Typical mistakes (teacher view)

Computed by the model from the same numbers; the card shows the wrong quotient as its digits are written. The card is
always drawn the shorter way (remainders only), whatever the main paper's layout: it is small, and the mistake is in
the quotient and the remainders, not in the products.

| `mistake` | what is done wrong | example | other values (script) | why (shown) |
|---|---|---|---|---|
| `zero` | a quotient digit 0 after the first is not written (the work below is the same) | 618 : 3 → **26** | 2023 : 4 → 55; 630 : 3 → 21; 46 : 5₂ → 11₂ | 1 ten : 3 = 0 tens: the quotient still needs its tens digit; without the 0 the 2 hundreds become 2 tens, and 26 · 3 + 0 = 78 ≠ 618 |
| `dropped` | the remainder is not taken to the next place: each later number is the brought-down digit alone | 846 : 3 → **212** r 0 | 618 : 3 → 202 r 2; 1736 : 7 → 200 r 6; 2023 : 4 → 500 r 3; 34E : 3₁₆ → 114 r 2 | the 2 left of 8 hundreds are 2 hundreds = 20 tens: they go with the 4 tens, 24 tens : 3 |

The wrong quotient is compared with the right one digit by digit from the left, as it is written after `=`; a digit
that differs, or is missing, is struck. **Tie-break:** a mistake that gives the right result here (no 0 after the first
quotient digit for `zero`, e.g. 846 : 3; every remainder before the last 0 for `dropped`, e.g. 369 : 3) marks nothing,
and the card says why it does not show. "The right result" is the quotient **and** the remainder: `dropped` can keep the
quotient and lose only the remainder (10010 : 111₂ = 10, remainder 100; dropped: 10, remainder 0), which is still the
mistake; the card and the end caption then give the remainder with each result ("10₂, remainder 0₂ instead of 10₂,
remainder 100₂") and strike the wrong remainder on the card's paper. On the `dropped` card a remainder left behind
is struck in ink (`x: true`) beside the digit brought down alone.

## Presets (keys 1–8)

| # | id | numbers | base | mistake | steps | outcome |
|---|---|---|---|---|---|---|
| 1 | `three-digit` | 846 : 3 | 10 | none | 8 | 282, rows `24`, `06`, `0` |
| 2 | `first-two` | 1736 : 7 | 10 | none | 8 | 248: 1 < 7, start with 17; rows `33`, `56`, `0` (248 · 7 is multiplication's preset 2) |
| 3 | `zero` | 618 : 3 | 10 | zero | 8 | 206; the forgotten 0 gives 26 |
| 4 | `remainder` | 2023 : 4 | 10 | none | 8 | 505, remainder 3; a 0 in the middle |
| 5 | `two-digit` | 9876 : 12 | 10 | none | 8 | 823: 98 : 12 = 8 (96), `27`, `36`, `0` |
| 6 | `base-2` | 101110 : 101 | 2 | none | 11 | 1001, remainder 1 (46 : 5 = 9 r 1): each digit "fits or not" |
| 7 | `long` | 846 : 3, longer way | 10 | none | 8 | 282; rows `−6`, `24`, `−24`, `06`, `−6`, `0` |
| 8 | `long-two-digit` | 5517 : 28, longer way | 10 | none | 8 | 197, remainder 1; estimates too big (2 → 1), right (9), too small (6 → 7) |

All presets but 7 and 8 use the shorter way (a preset resets the other params to their defaults). Preset 5 (9876 : 12)
now shows the estimate in the box: 9 → 8, 3 → 2, 4 → 3.

## Audiences (same model, other words)

| | teacher (default) | adult | child |
|---|---|---|---|
| captions | the school step: "8 : 3 = 2, pišem 2"; "2 · 3 = 6, 8 − 6 = 2"; "spuštam 4: 24" *(check)* | why: the number's place ("8 hundreds : 3 = 2 hundreds"), why q (q · d ≤ N < (q + 1) · d), the remainder regrouped into the next place | the spoken step: "Koliko puta 3 stane u 8? 2 puta. Pišem 2." "2 puta 3 je 6. Do 8 je 2." "Spuštam 4." *(check)* |
| longer way, sub step | "2 · 3 = 6, potpisujem 6 ispod 8; 8 − 6 = 2." | the product with its place, "oduzimam pismeno"; on the first subtraction, in either layout, why the shorter way can leave the product out (the subtraction is done in the head) | "2 puta 3 je 6. Pišem 6 ispod 8. 8 manje 6 je 2." |
| estimate (two-digit divisor) | "Procjena: 100 : 10 = 10; probam 9, 8." before the ask | the same, and that the estimate is a try checked by multiplying and corrected by 1 | not shown |
| box | yes (switch) | yes (switch) | no |
| digits | normal | normal | larger |
| base | any | any | 10 only |
| typical mistake | yes | no | no |

## Legend

what this step works on (kit `pc-band`), written in this step (kit `hl`).

## Terms

| hr | en |
|---|---|
| pisano dijeljenje | long division |
| djeljenik | dividend |
| djelitelj | divisor |
| količnik | quotient |
| ostatak | remainder |
| spuštam znamenku *(check)* | bring down the digit |
| dulji način, kraći način | the longer way, the shorter way |
| potpisivanje djelomičnoga umnoška | writing the partial product (under the number) |
| procjena djelomičnoga količnika | estimating the partial quotient |
| koliko puta … stane u … *(check)* | how many times … goes into … |

## Misconceptions targeted

- A forgotten 0 in the quotient (mistake `zero`, preset 3): every dividend digit after the first number gives one
  quotient digit, so the quotient has as many places as that.
- "Each digit is divided on its own" (mistake `dropped`): the remainder is regrouped into the next place.
- A remainder as big as the divisor: the box shows that the next multiple would still fit.
- "Start with the first digit always": 1736 : 7 takes 17 (preset 2).
- "Base 2 is different maths": the same algorithm; a digit only fits or not (preset 6).

## Out of scope

Decimals and dividing on into decimal places, negative numbers, divisors over 3 digits, the English bracket layout
(the explanation mentions it), estimating with a one- or three-digit divisor or in another base, checking a result (`ari-checking`; the end caption names the check only), how a processor's
divider is built (`arh-` pages).
