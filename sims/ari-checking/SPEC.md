<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-checking: specification

One concept: **the inverse operation checks a result (difference plus the number taken away gives the top number;
quotient times divisor plus remainder gives the dividend), and an estimate from rounded numbers catches a result that
is off by a place.** Task: `docs/tasks/w3/ari-checking.md`; catalogue §4.16. The student checks given results, finds
the wrong one and estimates before computing. Every expected number below was computed by a Python script independent
of `sim.js` (NOTES.md, Checks) and is asserted in `sim.test.js`.

## Class and scene

An **explorer** (no steps): the page draws `initial(params)`. Kit view **K5, paper columns** (`kit/papercolumns.js`).

- **The task** (top, the whole width): the line as a pupil's worksheet gives it, one sign or digit per square:
  `846−378=478`; a division `846:3=281` with its remainder beside the paper ("ostatak 3"; written when the given or the
  right remainder is not 0). The question "Je li točno?" When the check is shown, the verdict (✓ točno / ✗ netočno: a
  mark **and** a word), the digits of the given result that differ from the right one struck (`x: 'wrong'`, compared by
  place) and a wrong remainder struck; the teacher and adult views give the right result.
- **Procjena (estimate)**, bottom left, closed until opened (its button or key `E`; "Sakrij" closes it): each number with
  its rounded value (`846 ≈ 800`), the estimate as a line (`800 − 400 = 400`), then the estimate and the given result one
  above the other on squares **aligned by place** under the place row (signs `≈` and `?`), so a result with a place too
  many or too few stands out; the places one has and the other has not are banded (kit `pc-band`) when the result is
  far. The verdict: near (≈: "blizu: veličina odgovara; procjena ne vidi pogrešnu znamenku, to može samo provjera"), far
  (✗: "4113 ima jedno mjesto manje od 20000: promašeno je mjesto", or "predaleko" when the digits are as many) or rough (?: "procjena je ovdje pregruba; odlučuje provjera").
- **Provjera (check)**, bottom right, closed until opened (its button or key `V`; "Sakrij" closes it): the inverse
  operation in columns and its result compared with the number it must give (aside `= 846` or `≠ 846`, the differing
  places banded). A product's check is the division line `4113:36=114` (the working is long division's) with the
  remainder under the dividend's ones; a quotient's check is `281·3`, the product, `+ 3` with `< 3` or `≥ 3` beside it,
  and the sum. The rule in words ("razlika + umanjitelj = umanjenik") and the verdict (✓ / ✗). Teacher view: when the
  given result is one of the typical wrong ones, how it arises.
- **Header:** the audience switch (kit). **Panel:** presets (labelled with the task itself, so the class can find the
  wrong one), the task field, the given result (right or one of two typical wrong ones, teacher only), the base (2–16,
  quick buttons 2, 8, 10, 16). `est` and `chk` are params (the URL carries them) without a panel control: the panel must
  fit at 1920×1080, and the cards' buttons and the keys open and close them.

## Params

| key | default | meaning |
|---|---|---|
| `op` | `sub` | `add`, `sub`, `mul`, `div` |
| `a`, `b` | 846, 378 | the two numbers, as quantities (b: the addend, the number taken away, the second factor, the divisor) |
| `g` | 478 | the given result (for `div` the quotient) |
| `r` | 0 | the given remainder (`div` only) |
| `base` | 10 | 2–16; digits 0–9 then A–F |
| `est`, `chk` | false, false | show the estimate, show the check |

**Limits** (digits in the base): `add`, `sub` both numbers ≤ 6; `mul` a ≤ 4, b ≤ 3; `div` a ≤ 6, b ≤ 3; the given result
≤ 7, the given remainder ≤ 4. `mul` and `div` need b ≥ 1 (the check of a product divides by b); `sub` needs b ≤ a. A
base in which a number needs more digits is refused (quick button unavailable with the reason; the slider's minimum is
`minBase`). A URL value is made whole and clamped to these limits in the current base (`numbersOf`; no valid base: 10, as the page draws), and the page
writes the clamped numbers back.

**Typed task** (`parseTask`): `846 − 378 = 478`; signs `+`, `−`/`-`/`–`, `·`/`⋅`/`.`/`*`/`×`/`x`, `:`/`÷`/`/`; a–f
read as A–F; leading zeros dropped. After `=` the given result; for a division its remainder after a comma, `r`, `ost`,
`ost.`, `ostatak`, `rem` (touching the number or with a colon: `281 r3`, `ostatak: 3`) or in brackets (`846 : 3 = 281, 3`;
none means 0). Without `=` the given result is the right one. Refusals, each with a reason: `empty` (nothing, or a
number missing), `op` (not exactly one sign), `gap` (a space inside a number), `digit` (not a digit of the base), `long`
(over the limit), `neg` (subtraction with the second number bigger), `zero` (multiplying or dividing by 0), `rest` (a
remainder outside a division), `count` (more than a result and a remainder, or two `=`).

## Rules (tie-breaks first)

1. **Tie-break: rounding is half up.** A number is rounded to a place by its rest below that place: up when twice the
   rest is at least the place value (`2 · rest ≥ bᵏ`), else down. 850 → 900, 849 → 800; base 16 `380` → `400` (8 is half
   of 16); base 3 `12` → `20`, `11` → `10`. Rounding may add a place: 96 → 100.
2. **Tie-break: a result exactly √b times the estimate (or 1/√b) is far.** Only square bases have such a ratio: base 16,
   estimate 4, given 16 → far, 15 → near; base 4, estimate 2, given 4 → far. Likewise a ratio of exactly b^(n + ½)
   counts as n + 1 places (base 4: 8 against 1 is 2 places off, 7 is 1). A 0 is near only a 0 (estimate 0, given 0:
   near; given 0 against estimate 300: far).
3. **Tie-break: a subtraction whose rounded numbers leave 0 or less** while the top number is bigger is rounded again,
   both numbers to the same place, one place below the larger leading place and lower until the estimate is positive:
   846 − 778 → 800 − 800 = 0 → **850 − 780 = 70** (right 68); 100 − 96 → 100 − 100, 100 − 100 (tens), **100 − 96 = 4**;
   1200 − 960 → 1000 − 1000 → **1200 − 1000 = 200** (hundreds: one below the thousands). Equal numbers: estimate 0.
4. **Tie-break: dividing estimates with numbers that divide easily.** The divisor is rounded to its leading place (d′);
   the quotient a / d′ is rounded to one significant digit (half up; a quotient below 1 to 0 or 1), and the line shows
   the nearby dividend that d′ divides: 846 : 3 → **900 : 3 = 300**; 618 : 3 → 600 : 3 = 200; 1736 : 7 → 1400 : 7 = 200;
   9876 : 12 → 10000 : 10 = 1000; 2023 : 4 → 2000 : 4 = 500.
5. **Rounding for the estimate:** each number to its own leading place (keep the first digit, round the rest); a
   one-digit number stays. 846 ≈ 800, 378 ≈ 400, 36 ≈ 40, 7 ≈ 7.
6. **The estimate:** the operation on the rounded numbers. 846 − 378 → 800 − 400 = 400; 457 + 368 → 500 + 400 = 900;
   457 · 36 → 500 · 40 = 20000; 248 · 7 → 200 · 7 = 1400; 846 − 78 → 800 − 80 = 720.
7. **Near or far:** the given result g is far from the estimate e when g ≥ √b · e or g ≤ e / √b, computed in whole
   numbers as g² ≥ b · e² or b · g² ≤ e² (more than "half a place" away). The model also gives **n places off** (`off`),
   n ≥ 1 the largest with max² ≥ b^(2n − 1) · min² (4113 against 20000: 1). **The page's words** count digits instead
   (`places` = digits of g − digits of e): "4113 ima jedno mjesto manje od 20000: promašeno je mjesto" when they differ,
   "126 je predaleko od 400, više od pola mjesta" when a far result has as many digits as the estimate (846 − 378 = 126),
   and "nije ni blizu" against a 0. It never says "about 10 times": 4113 is 4.9 times below the estimate. A far result
   is certainly wrong when the estimate is not rough (the right result is within √b of e, g is not, so g ≠ right).
8. **Rough:** when even the right result is far from the estimate, the estimate cannot judge; its verdict is `rough`
   whatever g is ("rounding changed the numbers too much here; the check decides"). Over 4000 random tasks per
   operation (script): base 10 add 0 %, sub 0.3 %, mul 0 %, div 5 % (quotients near 0 or 1); base 2 is coarser (sub 23 %,
   div 16 %): rounding to a power of two loses more.
9. **The check, by the inverse operation:**
   - `add`: sum − addend = the other addend: **g − b = a**. If g < b, the subtraction cannot be done: a sum is never
     smaller than an addend, so g is wrong (`less`).
   - `sub`: difference + the number taken away = the top number: **g + b = a**.
   - `mul`: product : factor = the other factor: **g : b = a with remainder 0** (the working is long division's; the
     page writes the division line and its result).
   - `div`: quotient · divisor + remainder = dividend **and the remainder is less than the divisor**: **g · b + r = a
     and r < b**.
   The check says right exactly when g (and r) are the right result (script: every right result passes and every
   wrong result below fails, 18 000 random tasks over bases 2–16; random inputs in the tests).
10. **Where the check differs:** the places (ones first) where the check's result and the number it must give differ
    are banded on the check's paper; the places where g differs from the right result are struck on the task line.
    846 − 378 = 478: 478 + 378 = **856** ≠ 846, the tens; the given 478 differs from 468 in the tens.

## Wrong results (the given result control, and `kindOf`)

Two typical wrong results per operation, computed from the numbers (none when it does not apply or gives the right
result). The first of each pair is a slip the estimate does not catch; the second usually changes the number of places.

| op | kind | what goes wrong | rule | example | estimate | check |
|---|---|---|---|---|---|---|
| add | `carry` | the first carry is not added into the next column (a column of the numbers; a carry out of the top column is written anyway) | right − b^(k+1), k the column | 457 + 368 = **815** (825) | 900: near | 815 − 368 = 447 ≠ 457 |
| add | `lastCarry` | the carry out of the top column is not written | right − bⁿ, n the longer number's digits | 846 + 378 = **224** (1224) | 1200: far, 1 place | 224 < 378: cannot be |
| sub | `borrow` | the first borrow is not paid back | right + b^(k+1) | 846 − 378 = **478** (468) | 400: near | 478 + 378 = 856 ≠ 846 |
| sub | `align` | the shorter number written under the left digits | a − b · b^(n_a − n_b), if ≤ a | 846 − 78 = **66** (768) | 720: far | 66 + 78 = 144 ≠ 846 |
| mul | `carry` | in the partial products, in the Croatian written order (rows from the second factor's left digit, as `ari-column-multiplication`), the first carry into a next digit of the first factor is forgotten (457 · 36: the 3-row, 7 · 3 = 21, the 2 not added to 5 · 3) | right − c · b^(i+1+j) | 457 · 36 = **16252** (16452) | 20000: near | 16252 : 36 = 451, remainder 16 |
| mul | `shift` | the partial products added without shifting | Σⱼ a · bⱼ (b has ≥ 2 digits) | 457 · 36 = **4113** (16452) | 20000: far, 1 place | 4113 : 36 = 114, remainder 9 |
| div | `rest` | the last "how many times" one too small: the remainder is as big as the divisor or more | q − 1, r + b (last quotient digit ≥ 1) | 846 : 3 = **281**, remainder **3** | 300: near | 281 · 3 + 3 = 846, but 3 < 3 fails |
| div | `zero` | a 0 in the quotient after its first digit is not written | the quotient without those 0s | 618 : 3 = **26** (206) | 200: far, 1 place | 26 · 3 + 0 = 78 ≠ 618 |

Script, base 10, 4000 random tasks each: `shift` is caught by the estimate in 95 %, `zero` in 100 %, `lastCarry` in 73 %,
`align` in 36 % (a short number moved left changes a big one little: the estimate honestly misses it, the check does
not); the slips (`carry`, `borrow`, `rest`) are never far from the estimate except `rest` on a small quotient (9 %).
**`kindOf`** names the given result: `right`, the kind of the pair that gives it, or `other` (typed). The two kinds of
a pair never give the same result: `add` carry is right − b^(k+1) with k + 1 < n, lastCarry right − bⁿ; `sub` borrow is
above the right result, align below it; `div` rest changes the remainder, zero keeps it; `mul`: none in a search of
6.2 million tasks over bases 2–16 (should one exist, the first kind in `WRONGS` is named).

## State (`initial(params)`, plain JSON)

`{ op, a, b, g, r, base, right, rightRem, correct, est: { ra, rb, value, place }, size: { far, off, zero }, rough,
verdict: 'near'|'far'|'rough', check: { value, rem, prod, want, eq, remOk, less, ok }, wrongDigits, checkDigits, kind,
at }`. `at` is where a typical wrong result goes wrong (the column, the carry), for the teacher's words.

## Presets (keys 1–6)

Labelled with the task itself ("846 − 378 = 478"), so the presets are a worksheet: which one is wrong? Each opens with
the estimate and the check closed.

| # | id | task | base | right | estimate | check |
|---|---|---|---|---|---|---|
| 1 | `borrow` | 846 − 378 = 478 | 10 | 468 | 800 − 400 = 400: near | 478 + 378 = 856 ≠ 846: wrong (borrow not paid back) |
| 2 | `sum` | 457 + 368 = 825 | 10 | 825 | 500 + 400 = 900: near | 825 − 368 = 457: right |
| 3 | `shift` | 457 · 36 = 4113 | 10 | 16452 | 500 · 40 = 20000: far, one digit fewer | 4113 : 36 = 114, remainder 9: wrong |
| 4 | `zero` | 618 : 3 = 26 | 10 | 206 | 600 : 3 = 200: far, one digit fewer | 26 · 3 + 0 = 78 ≠ 618: wrong |
| 5 | `remainder` | 846 : 3 = 281, remainder 3 | 10 | 282 | 900 : 3 = 300: near | 281 · 3 + 3 = 846, but 3 is not less than 3: wrong |
| 6 | `base-2` | 1101 · 101 = 11010 (13 · 5 = 26) | 2 | 1000001 (65) | 10000 · 100 = 1000000 (64): far, two digits fewer (5 against 7) | 11010 : 101 = 101, remainder 1: wrong (the rows not shifted: shift-and-add without the shift) |

## Audiences (same model, other words)

| | teacher (default) | adult | child |
|---|---|---|---|
| captions | the school check ("Provjera: 478 + 378 = 856, a treba 846. Netočno.") and whether the estimate saw it | the teacher's, plus why: the inverse undoes the operation; why a rounded estimate is close and what a place off means (also on the cards) | short lines ("Otprilike 400. 478 je blizu. Nije točno!"; the card: "Dobiješ 856, a ne 846.") |
| how it arises | yes (given result one of the typical wrong ones, check open) | no | no |
| right result | yes, after the check | yes, after the check | no (the class finds it) |
| digits | normal | normal | larger |
| base | any | any | 10 only |
| given result control | yes | no | no |

## Legend

the places that differ (kit `pc-band`), struck: a wrong digit (the kit's `x: 'wrong'`).

## Terms

| hr | en |
|---|---|
| provjera | check |
| obrnuta računska operacija *(check)* | inverse operation |
| procjena | estimate |
| zaokruživanje, zaokružiti | rounding, round |
| pribrojnik, zbroj | addend, sum |
| umanjenik, umanjitelj, razlika | minuend, subtrahend, difference |
| faktor, umnožak | factor, product |
| djeljenik, djelitelj, količnik, ostatak | dividend, divisor, quotient, remainder |

## Misconceptions targeted

- "A result near the estimate is right": the estimate only catches size (presets 1, 5); the check decides.
- "Checking means doing it again": doing it again repeats the same slip; the inverse operation is a different
  computation that must give back a number already on the page.
- "The check of a division is q · d = a": the remainder is added, and it must be less than the divisor (preset 5).
- "A wrong place is a small mistake": 4113 for 457 · 36 has a digit fewer than the estimate 20000; the estimate shows
  it at once (presets 3, 4, 6).

## Out of scope

Doing the column operations themselves step by step (the four `ari-column-…` and `ari-long-division` pages; the check
writes their results), decimals and money, negative numbers, checking with the "nines" (casting out nines), estimating
with other roundings (to tens for all numbers) beyond the subtraction rule 3, word problems.
