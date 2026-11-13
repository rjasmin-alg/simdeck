<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-unknown-term: SPEC

Task `docs/tasks/w3/ari-unknown-term.md`, catalogue §4.17. One concept: the unknown term of a sentence is found by
reading the same fact another way. Addition and subtraction are one fact read three ways (p + q = w, w − q = p,
w − p = q), and so are multiplication and division (p · q = w, w : q = p, w : p = q). A bar model shows the whole w and
its parts, so the unknown of 780 − b = 89 is the reading with b alone (b = 780 − 89 = 691), checked by putting it back
(780 − 691 = 89). An inequality like 694 > c > 688 is a stretch of the number line: the whole numbers strictly between.

Class **explorer** (no steps): the student chooses the unknown term, steps through the solving stages with S, and in the
inequality mode marks numbers on the line. Numbers checked with an independent script (NOTES.md, Checks).

## Sources

- **Curriculum** (Narodne novine 7/2019, read 2026-11-13):
  - MAT OŠ B.3.1 "Rješava zadatke s jednim nepoznatim članom koristeći se slovom kao oznakom za broj"; razrada "Uvrštava
    zadani broj umjesto slova", "Određuje vrijednost nepoznatoga člana jednakosti/nejednakosti"; dobar "… izračunava
    vrijednost nepoznatoga člana u jednakosti i provjerava točnost dobivenoga rješenja"; preporuka examples
    "780 – b = 89 → b = 780 – 89", "Odredi sve troznamenkaste brojeve c za koje vrijedi 694 > c > 688", "94 + s = 136
    rješava se vezom zbrajanja i oduzimanja", "63 : ☐ = 9".
  - MAT OŠ B.4.1 "Određuje vrijednost nepoznate veličine u jednakostima ili nejednakostima"; "a nepoznati se član računa
    primjenom veze među računskim operacijama"; "U 4. razredu ne upoznaje se sustavno linearna jednadžba ili
    nejednadžba"; examples "5871 + a = 7820", "f · 65 = 975", "12 395 < b < 12 402".
  - MAT OŠ A.3.2 "Imenuje članove računskih operacija", "vezu zbrajanja i oduzimanja"; A.2.4 (grade 2) "djeljenik,
    djelitelj i količnik", the fact family "3 · 7 = 21, 7 · 3 = 21, 21 : 3 = 7, 21 : 7 = 3"; A.4.1 numbers to a million.
  - Hence: the words *jednakost / nejednakost*, *nepoznati član*, *slovo kao oznaka za broj*, *provjera*, never
    *jednadžba*; numbers up to a million; a division with a remainder (A.3.3) is out of scope.
- The bar model (*model trake*) is not named by the curriculum *(check)*; it is the catalogue's picture.

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `mode` | `eq`, `ineq` | `eq` | a sentence with one unknown, or an inequality |
| `op` | `add`, `sub`, `mul`, `div` | `sub` | the sentence's operation |
| `u` | 0, 1, 2 | 1 | the unknown's place: first term, second term, result |
| `pa`, `qa` | whole 0…10⁶ | 89, 691 | the two parts of the addition fact |
| `pm`, `qm` | whole 1…10⁶ | 15, 65 | the two factors of the multiplication fact |
| `letter` | a…z | `b` | the letter of the unknown |
| `way` | `right`, `swap` | `right` | the right inverse, or the typical mistake (teacher) |
| `show` | 0…3 (eq), 0…1 (ineq) | 0 | solving stage: sentence, inverse, value, check; ineq: marks, the stretch |
| `lo`, `hi`, `dir` | whole, `lt` / `gt` | 688, 694, `gt` | the bounds and how the inequality is written |
| `marks` | bit mask | 0 | the numbers marked on the line, bit i for view.lo + i |

## Rules

1. **The fact is made valid** (`factOf`). Each family keeps its own numbers, so switching + to − keeps 89, 691, 780 and
   switching to · keeps 15, 65, 975. Addition parts are rounded and clamped to 0…10⁶; multiplication parts to 1…10⁶
   (0 is kept out: x · 0 = 0 holds for every x). **Tie-breaks:** a second part that takes the whole over 10⁶ is lowered
   (addition to 10⁶ − p, multiplication to ⌊10⁶ / p⌋); an unknown `op` is `sub`, an unknown letter `x`.
2. **Where each number stands** (`ROLES`): w the whole, p and q the parts.

   | op | sentence | first, second, result |
   |---|---|---|
   | add | p + q = w | pribrojnik, pribrojnik, zbroj |
   | sub | w − q = p | umanjenik, umanjitelj, razlika |
   | mul | p · q = w | faktor, faktor, umnožak |
   | div | w : q = p | djeljenik, djelitelj, količnik |

   780 − b = 89 is w = 780, q = b = 691, p = 89; f · 65 = 975 is p = f = 15, q = 65; 63 : b = 9 is w = 63, q = b = 7, p = 9.
3. **One fact, three readings** (`READINGS`): 0: p ∘ q = w, 1: w ∘⁻¹ q = p, 2: w ∘⁻¹ p = q, with ∘ = + or ·, ∘⁻¹ = −
   or :. An addition or multiplication sentence is reading 0, a subtraction or division reading 1 (`GIVEN`).
4. **The inverse** (`ALONE`): the unknown is found from the reading that has it alone on the right: w from 0, p from 1,
   q from 2. 780 − b = 89 (q) → b = 780 − 89; a − 89 = 691 (w) → a = 691 + 89; 94 + s = 136 (q) → s = 136 − 94;
   f · 65 = 975 (p) → f = 975 : 65; 63 : b = 9 (q) → b = 63 : 9; a : 9 = 7 (w) → a = 7 · 9.
5. **Direct**: when the unknown is the result, the reading is the sentence itself (no inverse; 780 − 89 = c).
6. **The typical mistake** (`way: swap`, teacher): the inverse with the other operation of the pair (+ ↔ −, · ↔ :),
   the same numbers in the same order: 780 − b = 89 → b = 780 + 89 = 869; a − 89 = 691 → a = 691 − 89 = 602;
   f · 65 = 975 → f = 975 · 65 = 63 375. **Tie-break:** in a direct sentence there is nothing to undo, so the mistake
   is not applied (`way` is `right`, `wayAsked` keeps the choice; the page disables the control and says why).
   A swapped step can have no whole value (`why`): `neg` (89 − 691), `frac` (7 : 9), `big` (over 10⁶).
   **Tie-break:** with 0 or 1 the two operations agree (x · 1 = 7 → 7 · 1 = 7 : 1; 780 − b = 0 → 780 + 0 = 780 − 0), so the
   wrong step gives the right value and the check holds (`correct` true); the page then says the operation was wrong
   but lucky because of that 0 or 1 (the second number of the step), and does not mark step 1 wrong.
7. **The check** (`check`): the value is put back in its place and the left side computed without a cap: right always
   gives `ok` (780 − 691 = 89); 869 gives `why: neg` (780 − 869 cannot be taken in whole numbers); 567 gives `why: frac`
   (63 : 567 is not whole); 602 gives
   602 − 89 = 513 ≠ 691; 63 375 gives 63 375 · 65 = 4 119 375 ≠ 975. No check when the value has none.
8. **The bar model**: addition: the whole on top, the two parts below, each at least `MIN_SHARE` = 0.15 of the bar, the
   rest in proportion (`shares`; all 0 → equal; 89, 691 → 0.2299, 0.7701). Multiplication: the whole on top, below it
   p pieces of q (`piecesOf`): all of them up to `PIECES_MAX` = 12, else the first 3, a gap and the last.
   **Tie-break:** when the count p is the unknown, the pieces are drawn 3 … 1 until the value is shown (`show` ≥ 2) and
   always under the mistake, so the drawing never gives the answer away (f · 65 = 975: 3 … 1 until stage 2, then 3 … 1
   since 15 > 12; 63 : b = 9: 9 pieces of 7).
9. **The inequality is made valid** (`boundsOf`): whole bounds in 0…10⁶; reversed bounds are swapped; equal bounds
   become 1 apart (hi + 1, or lo − 1 at 10⁶); more than `GAP_MAX` = 20 apart, hi is lowered to lo + 20.
   - **Its line** (`ineqView`, the number line model's `view`): `PAD` = 3 whole numbers each side (minSpan
     hi − lo + 6, no padding, at most 40 ticks, so the step is 1), slid inside 0…10⁶: 688, 694 → 685…697; 12 395,
     12 402 → 12 392…12 405; 0, 5 → 0…11.
   - **The solutions**: the whole numbers v with lo < v < hi (strict, as in the curriculum): 689…693, 5 numbers;
     12 396…12 401, 6 numbers. **Tie-break:** bounds 1 apart have none (694 > c > 693); the page says so.
   - **The halves** as written: hi > c > lo is c < hi and c > lo; lo < c < hi is c > lo and c < hi. An unknown `dir`
     is `lt`.
   - **Marks** (`marksOf`, `maskOf`, `toggle`): bit i of `marks` marks view.lo + i; bits outside the line are ignored.
     Each marked number is right (inside), wrong (a bound or outside), and the missing ones are the solutions not
     marked; `complete` when none is wrong or missing. Each mark is checked by putting it back: which half holds
     (694 > 694 > 688: the first fails).
   - The page clears the marks when the bounds change (they are positions on the old line).
10. **The task field** (`parseTask`): "780 − b = 89", "f · 65 = 975", "63 : b = 9", "694 > c > 688",
    "12 395 < b < 12 402"; spaces anywhere are ignored (also no-break and narrow ones); −, –, —, - minus; ·, ×, *, ⋅, ∙
    times; :, ÷, / divided by; one letter, either case; leading zeros are read as the number (0780 is 780). The sentence is solved for the fact: its params are the family's parts, `u` and the letter.
    Refused: `empty`; `form` (not "N op N = N" or "N rel x rel N", e.g. a two-letter name "ab"); `letters` (no letter,
    a letter in two places, or the letter at an end of an inequality); `big` (a number or the whole over 10⁶); `neg` (x + 245 = 100, 100 − x = 200);
    `frac` (f · 7 = 50); `rem` (50 : 7 = x: a remainder, MAT OŠ A.3.3); `zero` (any 0 in a multiplication or
    division); `mixed` (688 < c > 694); `order` (694 < c < 688: nothing between); `wide` (more than 20 apart).

## Presets

| # | id | Task | Expected | Shows |
|---|---|---|---|---|
| 1 | `minus` | 780 − b = 89 | b = 780 − 89 = 691; 780 − 691 = 89 ✓ | the curriculum's example (B.3.1); the default |
| 2 | `plus` | 94 + s = 136 | s = 136 − 94 = 42; 94 + 42 = 136 ✓ | the curriculum's addition (B.3.1) |
| 3 | `minuend` | a − 89 = 691 | a = 691 + 89 = 780 | the same fact, the umanjenik unknown: it is the whole |
| 4 | `factor` | f · 65 = 975 | f = 975 : 65 = 15; 15 · 65 = 975 ✓ | the curriculum's factor (B.4.1); pieces 3 … 1 |
| 5 | `divisor` | 63 : b = 9 | b = 63 : 9 = 7; 63 : 7 = 9 ✓ | the curriculum's divisor (B.3.1); 9 pieces of 7 |
| 6 | `wrong` | 780 − b = 89, swap, stage 1 | b = 780 + 89 = 869; 780 − 869 cannot be taken ✗ | the typical mistake, caught by the check |
| 7 | `between` | 694 > c > 688 | 689, 690, 691, 692, 693 (5) | the curriculum's inequality (B.3.1) |
| 8 | `ends` | 694 > c > 688, 688…694 marked | 688 and 694 wrong, 5 right | the typical mistake: the bounds counted |
| 9 | `big` | 12 395 < b < 12 402 | 12 396 … 12 401 (6) | the curriculum's grade 4 inequality (B.4.1) |

`between` is listed on the home page as its own entry (Nejednakost na brojevnoj crti).

## What each audience sees

| | teacher (default) | adult | child |
|---|---|---|---|
| task field | yes | yes | no (presets, the term buttons, S, clicking numbers) |
| the mistake choice | yes | yes (to undo a preset's mistake) | no; a preset's mistake is asked ("b = 780 + 89?") |
| captions | the step and its reading, the mistake and why | the teacher's, plus why it works (the bar: a part is the whole without the other part) | one short line |
| digits | large | large | larger |

## Legend and terms

Header legend: colour 1 the whole, colour 2 the parts, dashed the unknown (on the stage dashed and hatched). The
legend is the sentence mode's; the inequality stage labels its own parts (the halves, the stretch, the marks). On the stage: the term names under each
number; the readings marked "zadano" (given) and "računamo" (computed); on the line, the stretch as a bar with hollow
ends at the bounds, marks as filled circles, ✓ and ✗ beside the checks.

| hr | en |
|---|---|
| pribrojnik, zbroj | addend, sum |
| umanjenik, umanjitelj, razlika | minuend, subtrahend, difference |
| faktor, umnožak | factor, product |
| djeljenik, djelitelj, količnik | dividend, divisor, quotient |
| nepoznati član | unknown term |
| jednakost, nejednakost | equality, inequality |
| provjera | check |
| model trake *(check)*, cijelo, dio | bar model, whole, part |
| brojevna crta | number line |

## Misconceptions targeted

- "Minus is undone by plus" for the umanjitelj (b = 780 + 89): preset 6; the check fails (780 − 869).
- The same for a factor (f = 975 · 65) or a divisor (b = 63 · 9): the mistake choice on any sentence.
- Counting the bounds of a strict inequality: preset 8.
- "A letter is a fixed thing": the letter is chosen freely (b, s, a, f, c), and the same fact appears with a different
  unknown (presets 1 and 3).

## Out of scope

Equations solved by moving terms (grade 5, B.5.1), remainders (A.3.3), negative numbers, 0 in multiplication and
division, inequalities with ≤ or one bound only, more than one operation (`ari-order-of-operations`).
