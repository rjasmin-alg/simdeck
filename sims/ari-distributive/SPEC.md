<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-distributive: SPEC

Task `docs/tasks/w3/ari-distributive.md`, catalogue §4.17. One concept: **4 · 23 is an array of 4 rows of 23 dots; a
cut after 20 splits it into 4 · 20 and 4 · 3, so 4 · 23 = 80 + 12 = 92: multiplying a sum multiplies each addend
(distributivity); dividing a sum works the same way when each part divides (84 : 4 = 80 : 4 + 4 : 4); written
multiplication by a one-digit number is this split done place by place.**

Class **explorer** (no steps): the student sets the task and moves the cut; the page shows the number sentence, the
array with the cut, and the written form. Every expected number below was computed with an independent Python script
before coding (NOTES.md, Checks) and is asserted in `sim.test.js`.

## Sources

- **Curriculum** (Narodne novine 7/2019, read 2026-11-13 in this session), **MAT OŠ A.3.4** "Pisano množi i dijeli
  prirodne brojeve do 1000 jednoznamenkastim brojem", razrada "Primjenjuje svojstva računskih operacija (komutativnost
  i distributivnost). Primjenjuje veze između računskih operacija."; sadržaj "… Množenje zbroja brojem. …"; preporuka
  "Postupnost: **množiti i dijeliti zbroj brojem**, množiti i dijeliti u tablici mjesnih vrijednosti te množiti i
  dijeliti izvan tablice pravilnim matematičkim zapisom." **MAT OŠ A.4.4** razrada "Primjenjuje svojstva računskih
  operacija (komutativnost, asocijativnost i distributivnost). Provjerava rješenje primjenjujući veze među računskim
  operacijama." **MAT OŠ A.3.5** (grade 3) has brackets: "Određuje vrijednosti izraza sa zagradama", so the sentence
  may write 4 · (20 + 3). The curriculum gives no example numbers for this outcome: 4 · 23 and 84 : 4 are the
  catalogue's; the others are mine.
- Hence: one factor (the divisor) is one-digit; multiplying and dividing a sum are both in; the check of a quotient
  by multiplying (veza množenja i dijeljenja) is shown; the written form is the curriculum's next step.
- Written multiplication's layout and spoken step ("3 · 4 = 12: pišem 2, pamtim 1"): `sims/ari-column-multiplication`
  (its strings `dKeepT`, `dInEndT`). Written division's shorter way (remainders under the dividend, the next digit
  brought down): `sims/ari-long-division` (kraći način).

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `op` | `mul`, `div` | `mul` | multiplying a sum (a · b) or dividing a sum (a · b) : a |
| `a` | whole 1…9 | 4 | the rows: the one-digit factor, or the divisor |
| `b` | whole 1…99 | 23 | the columns: the other factor, or the quotient (the dividend is a · b) |
| `p` | whole, 0…b (mul) or 0…a · b (div) | 20 | the first addend of the sum that is split: columns in mul, dots in div |
| `way` | `right`, `one` | `right` | the step: the right one, or the typical mistake (only one addend multiplied or divided) |
| `hide` | boolean | false | ask first: the results and the verdict are hidden until V |

The array is the same in both operations: a rows of b columns. Multiplying reads it as a · b with b split into
p + q columns; dividing reads it as n : a with n = a · b dots split into p + q dots, dealt into a rows column by
column (one round per column, as in `ari-remainder`). Switching the operation keeps the array: 4 · 23 becomes
92 : 4 (the page converts the cut: p columns → a · p dots; p dots → round(p / a) columns, half up).

## Rules

1. **The task is made valid** (`taskOf`). a, b are rounded and clamped (a to 1…9, b to 1…99; a value that is not a
   number takes the default); an unknown `op` is `mul`, an unknown `way` is `right`. n = a · b (the product or the
   dividend). p is rounded and clamped to 0…b (mul) or 0…n (div); not a number → 0. **Limits:** at most 9 rows and 99
   columns: the array stays drawable (891 dots at most), and two-digit by two-digit is grade 4's written
   multiplication, not this page.
2. **The split** (`initial`): q = b − p (mul) or n − p (div). **Tie-break:** p = 0 or q = 0 is *no cut*
   (`trivial`): the sentence is only the whole (4 · 23 = 92), no parts, and `way` is ignored.
3. **Multiplying** (mul, a cut): the parts are a · p and a · q; their sum is a · b for every p (distributivity).
   4 · 23, p = 20: 80 + 12 = 92. p = 13: 52 + 40 = 92. 6 · 47, p = 40: 240 + 42 = 282.
4. **Dividing** (div, a cut): the split divides when p is a multiple of a (then so is q, because n is). Then the parts
   are p : a and q : a and their sum is b. 84 : 4, p = 80: 20 + 1 = 21; check 21 · 4 = 84. **Not dividing:** p = a · c
   + r with 0 < r < a: the first part fills c whole columns and r dots of the next one; the parts are not whole
   numbers of columns, the sentence stops at p : a + q : a and is marked ✗. 72 : 4, p = 70: c = 17, r = 2 (70 = 4 ·
   17 + 2); the written cut 40 + 32 divides (10 + 8 = 18). **Tie-break:** a = 1 always divides.
5. **The cells** (`grid`): cell (row i, column j) is part 1 when j < c, or j = c and i < r; otherwise part 2 (mul: c =
   p, r = 0). Part 1 is drawn as filled circles, part 2 as filled squares.
6. **The typical mistake** (`way: 'one'`), only on a cut, and in div only on a split that divides (**tie-break:** a
   split that does not divide is shown first; the mistake waits):
   - mul: a · p + q, "the second addend not multiplied". The q columns of part 2 keep only their first row; the other
     (a − 1) · q dots are *lost* (hollow, dashed). 4 · 23, p = 20: 80 + 3 = 83, 9 short (delta −9).
   - div: p : a + q, "the second part not divided". The claim is that each row has p / a + q dots; the array is drawn
     that wide: part 2 is one row of q dots, the other (a − 1) · q places are *phantom* (hollow, dashed: dots that are
     not there). 84 : 4, p = 80: 20 + 4 = 24, check 24 · 4 = 96 ≠ 84 (delta +3 in the quotient, +12 dots). If the
     claimed row is wider than 99 columns (`wideOk` false) the array is drawn the right way and only the sentence is
     wrong.
   - delta = result − right result; **tie-break:** a = 1 gives delta 0 (one row: nothing lost), and the verdict is ✓.
7. **The cut of the written form** (`placeCut`): the written form splits by place, after the full tens of columns,
   w = 10 · ⌊b / 10⌋ columns: mul p = w, div p = a · w. 4 · 23 → 20; 6 · 47 → 40; 84 : 4 → 80; 72 : 4 → 40; 96 : 3
   → 90; 156 : 6 → 120. **Tie-break:** w = 0 (b < 10) or w = b (b a multiple of 10) is no cut, and key P says there
   is nothing to split; for b < 10 the written form has one step, for whole tens it keeps both steps (the ones give
   0: 4 · 30 → "0 · 4 = 0: pišem 0", "3 · 4 = 12: pišem 12") and the page says the ones give 0.
8. **The written form** (`written`):
   - mul, b = 10T + U, T > 0: step 1 "U · a = U·a: pišem (U·a) mod 10, pamtim ⌊U·a / 10⌋" (no "pamtim" when the carry is
     0); step 2 "T · a = T·a, i <carry> je s: pišem s" (without "i <carry>" when the carry is 0). Step 1 is part 2 of
     the place cut (a · U), step 2 is part 1 counted in tens (a · 10T = 10 · T·a). 4 · 23: "3 · 4 = 12: pišem 2,
     pamtim 1", "2 · 4 = 8, i 1 je 9: pišem 9" → 92. 6 · 47: "7 · 6 = 42: pišem 2, pamtim 4", "4 · 6 = 24, i 4 je
     28: pišem 28" → 282. T = 0: one step "U · a = U·a".
   - div, n = a · b, T = ⌊b / 10⌋ > 0: N = ⌊n / 10⌋ (the tens of the dividend), step 1 "N : a = T, ostatak r1" (r1 =
     N − a · T; "ostatak" left out when r1 = 0), step 2 "R : a = U" with R = 10 · r1 + (n mod 10) (r1 written, the
     ones digit brought down). Step 1 is part 1 of the place cut (a · 10T : a = 10T), step 2 is part 2 (R = q). 84 : 4:
     "8 : 4 = 2", "spuštam 4: 4 : 4 = 1" → 21 (the paper writes the remainder row as 04). 72 : 4: "7 : 4 = 1, ostatak 3", "32 : 4 = 8" → 18. 156 : 6: "15 : 6 = 2,
     ostatak 3", "36 : 6 = 6" → 26. T = 0: one step "n : a = b" (28 : 4 = 7). The working under the dividend (the
     shorter way): r1 ending under the last digit of N, the brought-down digit beside it, then 0 under the ones.
9. **The task field** (`parseTask`): "4 · 23", "23 · 4", "4*23", "4x23", "4 × 23" (spaces anywhere, one "=" at the end
   ignored); "84 : 4", "84/4", "84 ÷ 4". Errors, in this order: `empty`; `op` (not exactly one sign); `num` (a part is
   not a whole number); `zero` (a 0 anywhere); mul: `two` (neither factor is one-digit), `big` (the other factor over
   99); div: `divisor` (the divisor over 9), `rem` (it does not divide: a remainder, `ari-remainder`), `big` (the
   quotient over 99). **Tie-break:** both factors one-digit: the first is the rows (6 · 7 → 6 rows of 7); "23 · 4"
   is read as 4 rows of 23 (commutativity; the page writes it back as 4 · 23).

## Presets

| id | params | expected |
|---|---|---|
| `split` | mul 4 · 23, p 20 | 4 · 20 + 4 · 3 = 80 + 12 = 92 |
| `written` | mul 6 · 47, p 40 | 240 + 42 = 282; written "7 · 6 = 42: pišem 2, pamtim 4", "4 · 6 = 24, i 4 je 28: pišem 28" |
| `divide` | div 84 : 4 (a 4, b 21), p 80 | 80 : 4 + 4 : 4 = 20 + 1 = 21; 21 · 4 = 84 |
| `nodiv` | div 72 : 4 (a 4, b 18), p 70 | 70 = 4 · 17 + 2: does not divide; P gives 40 + 32 → 10 + 8 = 18 |
| `mistake` | mul 4 · 23, p 20, one, hide | 4 · 20 + 3 = 83, 9 dots lost (3 rows of 3) |
| `mistakeDiv` | div 84 : 4, p 80, one, hide | 80 : 4 + 4 = 24; 24 · 4 = 96 ≠ 84; 12 phantom dots |

## Scene

- **The sentence** (top): mul with a cut `4 · 23 = 4 · (20 + 3) = 4 · 20 + 4 · 3 = 80 + 12 = 92`; div
  `84 : 4 = (80 + 4) : 4 = 80 : 4 + 4 : 4 = 20 + 1 = 21`, and the check `21 · 4 = 84`. Each part's numbers carry the
  part's colour; the child view leaves out the bracket term. No cut: `4 · 23 = 92`. A split that does not divide:
  `72 : 4 = (70 + 2) : 4 = 70 : 4 + 2 : 4`, the two quotients dashed and ✗. The mistake: the wrong term (`+ 3`) dashed
  and the verdict `✗ 83 ≠ 92`. Ask first: every result is `?`, no verdict, no lost or phantom dots.
- **The array**: a rows of b dots, a small gap after every ten columns (the tens), part 1 circles in colour 1, part 2
  squares in colour 2; the cut a thick line between columns (a step where a column is split), with a handle; dragging
  it moves the cut by whole columns. Under each part a bracket with its number of columns, left of the array the
  number of rows.
- **The written form** (teacher and adult): mul `23 · 4` with the product under a line and the carry small; div
  `84 : 4 = 21` with the remainders under the dividend; the steps as said, each with the part it is. When the cut is
  the written one, the steps carry the parts' marks; otherwise a button (P) cuts like the written form.
- **Legend**: part 1 (circle), part 2 (square), lost or phantom dot (hollow).
- **Keys**: P cut like the written form; V ask first / show.

## Terms

| hr | en |
|---|---|
| distributivnost | distributivity |
| množenje zbroja brojem | multiplying a sum by a number |
| dijeljenje zbroja brojem | dividing a sum by a number |
| faktor, umnožak | factor, product |
| pribrojnik, zbroj | addend, sum |
| djeljenik, djelitelj, količnik | dividend, divisor, quotient |
| redak, stupac | row, column |
| pisano množenje, pisano dijeljenje | written multiplication, written division |
| desetica, jedinica | ten, one |

## Misconceptions targeted

- Only the first addend multiplied: 4 · (20 + 3) = 4 · 20 + 3 (rule 6).
- Only the first part divided: (80 + 4) : 4 = 80 : 4 + 4 (rule 6).
- Splitting a dividend by place when the parts do not divide: 72 : 4 = 70 : 4 + 2 : 4 (rule 4).

## Out of scope

Three-digit factors (a second cut at the hundreds), two-digit by two-digit, a remainder (`ari-remainder`), the
written algorithm step by step (`ari-column-multiplication`, `ari-long-division`), associativity, the order of
operations (`ari-order-of-operations`).
