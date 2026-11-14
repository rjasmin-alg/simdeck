<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-parts-of-number: SPEC

Task `docs/tasks/w3/ari-parts-of-number.md`, catalogue §4.17. One concept: **a third of 12 is one of three equal
parts of 12 (12 : 3 = 4), two thirds are two such parts (8); the parts must be equal; three quarters of an hour are 45
minutes on a clock face; said and written in words (polovina, trećina, dvije trećine), without fraction notation.**

Class **explorer** (no steps): the student picks the whole (a row of objects, or an hour on a clock), how many equal
parts, and how many parts are coloured (or clicks a part); the page shows the words, the calculation and the picture.
Every expected number below was computed with an independent Python script before coding (NOTES.md, Checks) and is
asserted in `sim.test.js`.

## Sources

- **Curriculum** (Narodne novine 7/2019, read 2026-11-14 in this session):
  - **MAT OŠ A.2.4** (grade 2) razrada "Određuje polovinu, trećinu, četvrtinu itd. zadanoga broja."; preporuka
    "Polovinu, trećinu, četvrtinu… učenici prepoznaju i grafički prikazuju tortnim prikazom". So the words and the
    pie are known from grade 2; the clock face is the pie of an hour.
  - **MAT OŠ A.3.6** (grade 3) preporuka "Između ostaloga, prikazivati i računati polovine, trećine… nekoga broja."
  - **MAT OŠ A.4.4** (grade 4) preporuka "Učenici rješavaju i zadatke u kojima određuju trećine, četvrtine, petine i
    desetine nekoga broja. Izraze poput dvije trećine, četiri petine... potrebno je popratiti govorom i prikazati na
    različite načine (konkretima, crtežima i sl.)." and "Primjer: Tri su četvrtine jednoga sata ___ minuta."
  - **MAT OŠ A.3.4 / A.4.3** preporuka "(ne spominje se pojam razlomka)": no fraction notation and no word
    "razlomak" anywhere on the page.
- Hence the presets "četiri petine" (A.4.4's own words) and "tri četvrtine sata" (A.4.4's own example, 45 minutes),
  and two pictures (concrete objects, a clock face) of the same calculation.
- The remainder wording ("10 : 3 = 3, ostatak 1") follows `sims/ari-remainder`.

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `pic` | `row`, `clock` | `row` | the whole: a row of `n` objects, or an hour of 60 minutes on a clock face |
| `n` | whole 1…100 | 12 | the number of objects (row only; the clock's whole is always 60) |
| `d` | whole 2…12 | 3 | into how many equal parts: 2 polovine, 3 trećine, 4 četvrtine … 10 desetine, 11, 12 |
| `k` | whole 1…d | 1 | how many parts are coloured (the page also sets it when a part is clicked) |
| `unequal` | boolean | false | the typical mistake: unequal parts (the model's `way` is `unequal`, else `equal`) |
| `hide` | boolean | false | ask first: the numbers are hidden until V |

## Rules

1. **The task is made valid** (`taskOf`). `n`, `d`, `k` are rounded and clamped (`n` to 1…100, `d` to 2…12, `k` to
   1…d); a value that is not a number takes the default (for `k`: 1). Unknown `pic` is `row`; `way` is `unequal` only when
   `unequal` is exactly `true`. The whole N is `n` for the row and **60 for the clock** (an hour has 60 minutes; `n` is ignored).
   Limits: d ≤ 12 covers every name the curriculum uses (to desetine) and the twelfths of the clock face; N ≤ 100
   keeps the division within 100 (grade 3 divides to 100 in its head) and the objects drawable.
2. **Equal parts** (`unequal` off, and d divides N): q = N : d. There are d parts of q each. The coloured amount is
   the first k parts, k · q. Every part is one d-th (trećina, četvrtina…) and k parts are "k d-ths" (dvije trećine).
   12, d = 3: q = 4; k = 1 → 4; k = 2 → 8; k = 3 → 12 (all the parts: the whole).
   20, d = 5, k = 4 → q = 4, 16. Clock, d = 4, k = 3 → q = 15, 45 minutes; the minute hand at 45, on the 9.
3. **The calculation** is written as the school writes it: `N : d = q`, and for k > 1 also `k · q = v` (two thirds of
   12: 12 : 3 = 4, 2 · 4 = 8) *(check: the order k · q or q · k)*. For k = d the value is N. The adult view adds the
   check `d · q = N` (3 · 4 = 12).
4. **Does not divide** (tie-break, first of all): when r = N mod d > 0, N cannot be split into d equal parts of whole
   objects (or whole minutes). The picture shows d parts of q = ⌊N / d⌋ and r objects left over; the calculation is
   `N : d = q, ostatak r`; there is no value, and the verdict says the parts would not be whole objects. `unequal` is
   ignored (`wayIgnored`). 10, d = 3: q = 3, r = 1. Clock, d = 7: q = 8, r = 4; d = 8: q = 7, r = 4. d > N: q = 0,
   every object is left over (2, d = 3: q = 0, r = 2). The words then name one part ("trećina broja 10"), whatever k
   is, because there is no d-th to count; k parts that happen to make a whole number (10, d = 4, k = 2 → 5) are not
   taken up: they belong with fractions, not with parts of whole objects.
5. **The typical mistake: unequal parts** (`unequal` on, d divides N). s = ⌊q / 2⌋; the parts are q + s, q, …,
   q, q − s (the first one too big, the last one too small, the others right; still d parts and still N in all).
   The coloured amount is the sum of the first k parts; the right value is k · q. For 1 ≤ k < d the coloured amount
   is always k · q + s ≠ k · q (`wrong`). 12, d = 3: parts 6, 4, 2; k = 1 → 6, not 4 (three parts of 6 would be
   3 · 6 = 18, not 12); k = 2 → 10, not 8. Clock, d = 4: parts 22, 15, 15, 8; k = 1 → 22, not 15; k = 3 → 52, not 45.
6. **Tie-breaks of the mistake.** (a) k = d: all the parts are the whole N whether they are equal or not; not
   `wrong`. (b) q = 1 (s = 0): there are no unequal parts with at least one object each; the parts stay equal and
   `noUnequal` is set (3, d = 3). (c) Rule 4 comes before rule 5.
7. **Ask first** (`hide`): the value, the calculation's results, the part sizes and the number left over are hidden
   ("?") and the verdict waits; the picture stays (the parts and the colour are the question), and the mistake switch
   leaves the panel (its name would give the answer away). V shows and hides.
8. **Words** (page, from `strings.js`): the part's name by d, in the Croatian plural form of k (1: trećina; 2–4:
   trećine; 5+: trećina), the number k in words (dvije, tri, četiri…; k = 1 is the name alone: "trećina"), then
   "broja N" or "sata"; the verb by the same form ("je" / "su" / "je"). English: "one third of 12 is 4", "two thirds
   of 12 are 8", "three quarters of an hour are 45 minutes" (verb "is" for k = 1, else "are"). d = 4 in English is
   "quarter". Asked first, the mistake's words are a question ("Trećina broja 12?" "Je li to obojeni dio?").

## Presets

| # | id | Params | Expected |
|---|---|---|---|
| 1 | `third` | row, 12, d 3, k 1 | trećina broja 12 je 4; 12 : 3 = 4 (catalogue) |
| 2 | `twoThirds` | row, 12, d 3, k 2 | dvije trećine broja 12 su 8; 12 : 3 = 4, 2 · 4 = 8 (catalogue) |
| 3 | `fourFifths` | row, 20, d 5, k 4 | četiri petine broja 20 su 16; 20 : 5 = 4, 4 · 4 = 16 (A.4.4's words) |
| 4 | `hour` | clock, d 4, k 3 | tri četvrtine sata su 45 minuta; 60 : 4 = 15, 3 · 15 = 45 (A.4.4's example) |
| 5 | `unequal` | row, 12, d 3, k 1, unequal, asked first | parts 6, 4, 2: the coloured 6 is not a third; a third is 4; 3 · 6 = 18 ≠ 12 |
| 6 | `leftover` | row, 10, d 3, k 1 | 10 : 3 = 3, ostatak 1: no three equal parts of whole objects |

## Legend and captions

Legend: coloured part (filled round counter / filled sector), part not coloured (hollow counter), left over or wrong
(dashed). Captions by audience: teacher says what the picture shows and the calculation; adult adds why (equal parts
are what makes a part a third, and dividing is sharing into equal parts, checked by multiplying); child says one short
sentence. On the clock: "pola sata" (d 2, k 1), "četvrt sata" (d 4, k 1) as the everyday words *(check)*, and the
numeral the minute hand points at when the value is a multiple of 5.

## Terms (both languages)

polovina / half, trećina / third, četvrtina / quarter, petina / fifth, šestina / sixth, sedmina / seventh, osmina /
eighth, devetina / ninth, desetina / tenth, jedanaestina / eleventh, dvanaestina / twelfth; jednaki dijelovi / equal
parts; ostatak / remainder; sat, minuta / hour, minute; brojčanik / clock face; minutna (velika) kazaljka / minute hand.

## Misconceptions targeted

- Any d pieces are "thirds" (unequal parts): rule 5, preset 5, asked first.
- "Two thirds" is 12 : 2 or 12 : 3 · … guessed: the picture shows two of the three equal parts.
- A part of a number that does not divide is a whole number of objects: rule 4, preset 6.

## Out of scope

Fraction notation (1/3, ⅓, the fraction bar) and the word "razlomak" (grade 5); parts of a shape other than the clock
face; comparing parts of different wholes; finding the whole from a part (a later page could add it).
