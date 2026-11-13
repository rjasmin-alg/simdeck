<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-column-multiplication: notes

New stepper (task `docs/tasks/w3/ari-column-multiplication.md`, catalogue §4.16, wave 3), the third column page of
"Arithmetic on paper", drawn with kit view **K5, paper columns**. Rules and expected numbers: `SPEC.md`.

## Decisions

- **The Croatian layout** *(check)*: the factors on one line (`457·36`, the centred dot in its own square), the partial
  products from the second factor's **left** digit, each ending under the digit it multiplies by, then the sum under
  a second line. The catalogue's wording ("each partial product one place further left") is the English order
  (from the ones); the page keeps the Croatian order and the explanation says the order does not change the sum. The
  `+` sign on the last partial product follows docs/sim-ui.md §14's sketch *(check: whether pupils write it)*.
- **Place labels only over the product's columns** (n + m places): the first factor's digits stand on the factors
  line, not in the places of the working below, so the square over its top digit is left unlabelled. The other
  first-factor digits still sit under labels (DT over the 5 of 457); that is the paper's column, not the digit's
  place. Accepted; the area model and the adult captions carry the place value.
- **Step granularity:** one step per digit of the first factor (the school's "pišem 1, pamtim 2"), one step for a
  whole row of a digit 0 or 1 (zeros, or the first factor itself), one step for the final sum (column addition is
  `ari-column-addition`'s concept; the carries appear in the carry row). This makes base 2 shift-and-add visible: every
  row is one step, the number or zeros, shifted.
- **Limits: 4 digits per factor**, which bounds the steps at 17 (4 × 4 + 1; the most over all bases, script) and the
  paper at 9 × 8 squares. 457 · 36 does not fit base 2 then (457 needs 9 binary digits): the base-2 quick button is
  refused with the reason, as in the sibling pages, and preset 5 uses 1101 · 1011. Grade 4 multiplies by a
  two-digit number, so 4 digits is enough for school; the curriculum limits are *(check)*.
- **The carry while writing a row** is a small tag in the corner of the next square of that row (the kit's `tag` on a
  `' '` cell), gone once that square is written. Pupils keep it in their heads *(check)*; the tag is for the projector.
- **A zero row** is written as zeros, as many as the first factor's digits (`000`), which keeps the columns and shows
  "zero, shifted" in base 2 *(check: some textbooks skip the row and shift the next one by two)*. A one-digit second
  factor 0 writes a single `0`: it is the product.
- **The area model** (teacher and adult, a switch, on by default; hidden for the child as the why box is in
  subtraction): parts of the first factor across, of the second down, each cell their product, each row's total and
  the partial product it is (`= 1371 · 10`). Not to scale (the parts span 400 to 7). Numerals in the current base,
  so appending zeros is multiplying by the base in every base. Cells of rows not reached are dashed and muted; the
  current cell has the band's look.
- **Typical mistakes** (teacher view): `noshift`, `carry` (forgotten), `carryfirst` (added to the digit before
  multiplying). The card fills row by row with the paper. `noshift` writes the right digits in the wrong place, so
  only the product's digits are crossed.
- **Audiences:** the kit's switch (same storage key and `?audience=` as the other `ari-` pages). Child: the paper only,
  bigger digits, base 10 forced, the spoken step ("7 puta 3 je 21. Pišem 1, pamtim 2."). Adult: each row's place value
  and shift, each carry as carry · base + digit. Teacher: the school step.
- **Panel fit:** with six presets, the field, the base control, the area switch and the mistake select, the panel ran
  over at 1920×1080. The field's hint is its tooltip (the line under it shows only a refusal) and the switch has no
  hint. The Croatian subtitle (concept) is shorter than first written, so the header stays one line.
- **Numbers are params as quantities** (`a`, `b`), hidden `range` params in the URL, as in the siblings.
- **No glossary terms**, as in the siblings: school words (*faktor, umnožak, djelomični umnožak*) are used directly.
- **Model code copied, not shared:** `digitsOf`, `textOf`, `valueOf`, `fitsIn`, `minBase` from
  `sims/ari-column-addition/sim.js` @ 7ce9a39 (no `ari-` model in `models/` yet; COMMON.md §6), with `MAX_DIGITS` 4.
  The multiplication part (`multiplyColumns`, `areaOf`, `mistakeOf`) is pure over plain values and promotable.
  `ari-long-division` (next) will need a digit times a number with carries: `partialOf` is that.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- Rows in the Croatian order (from the left digit), not "each one place further left" (above).
- The sum is one step, not column by column (step budget; above).
- `related` lists `ari-column-addition` and `ari-place-value`; `arh-twos-complement` (which base 2 pairs with) does not
  exist yet, so it is not linked.

## Sources

- Phrasing: the owner (s-002, "pišem 7, pamtim 1") and the task file. Croatian textbooks for grades 3–4 and the
  curriculum (NN 7/2019) were not read: the layout (factors on one line, rows from the left digit, the `+`, the zero
  row), "djelomični umnožak", "množim znamenkom 3" and the child's "7 puta 3 je 21" are general knowledge of Croatian
  school practice *(check)*.
- The typical mistakes (not shifting, forgetting the carry, adding the carry before multiplying) are the classic
  multiplication bugs of the school-arithmetic literature, from general knowledge *(check)*.
- The area model is the standard place-value rectangle; the arithmetic was checked by script.

## Checks

- Numbers: a Python script independent of `sim.js` computed every preset, the digit steps and carries, every mistake
  value, and a · b for all a < min(b⁴, 400), c < min(b⁴, 60) and 3000 random pairs per base 2–16 (max steps 17, digit
  carries ≤ base − 2, sum carries ≤ 3) before the model was written; the same values are in SPEC.md and the tests.
- Tests: 23 (`node --test sims/ari-column-multiplication/sim.test.js`), tie-breaks first. 22 mutations of `sim.js`
  (base hard-coded to 10, the last digit not written whole, no 0/1 row, a lone 0 as zeros, rows in the English order,
  the carry not added, the sum's carry dropped, the area model unshifted, `noshift` shifted, the first mistake step,
  the `x` separator, 5 digits, the state's carry, a sum step for one row, a carry off by one, leading zeros kept, each
  mistake computed rightly, a zero row as `mul`, `minBase` off by one): 20 failed at least one test; the other two
  (`same` and `noshift` guards in the `differs` maps) were equivalent and the guards were removed.
- `npm run gate -- ari-column-multiplication`: pass (64/64 browser checks). Screenshots reviewed at 1920×1080 (light,
  dark, grayscale) and 375×812 in both languages, plus teacher, adult and child, base 2 and 16, 9999 · 9876 (17 steps),
  457 · 0, the three mistake cards.

## Fresh review

A separate reviewer read the folder against SPEC.md and probed the model (every SPEC number; all a < 200, b < 60 and
4000 random pairs per base 2–16, FFFF · FFFF; bad URL values) and the page (every preset and edge input 0·0, 0·36,
457·0, 457·1, 457·10, FFFF·FFFF in three audiences × hr/en). Every SPEC number held. Fixed from its findings: a
non-finite factor in the URL (`?a=Infinity`) crashed the page (the base slider's `min` ran `digitsOf(Infinity)`):
`numbersOf` now reads it as 0 and clamps to four hexadecimal digits (tested); the carry mistake's why text had a fixed
plural ("2 jedinica", "1 units": now plural forms `carryU`) and said the unadded product "is written"; adult captions
in bases 11–16 mixed a base numeral carry (E) into a decimal equation (now decimal), the teacher caption shows the
carry in as `E (14)`; place 0 outside base 10 reads "jedinice", not "jedinice mjesta ×1"; with a one-digit second
factor the adult start and zero-row captions no longer talk of a sum (`cStartA1`, `rowZeroA1`); `sameNoshift` no longer
says there is no shift when the product is just 0.

## Term pairs (not in the glossary; written out in both tables)

| en | hr |
|---|---|
| column multiplication | pisano množenje |
| factor | faktor |
| product | umnožak |
| partial product | djelomični umnožak *(check)* |
| area model | model površine *(check)* |
| shift-and-add | pomicanje i zbrajanje |

## Shared requests

- **K5 tags on an empty square** (as subtraction asked): the carry tag needs the cell text `' '`.
- **K5 place labels on part of a row:** a way to label places only under certain rows (here: not over the factors
  line) would let the place row describe the working without labelling the first factor's digits.
- Still open from addition and subtraction: a text param type and a base control with per-value refusal (the page's
  `buildQuick`, `pickBase`, copied); the kit's `t.parts` returning one node for two placeholders (the page's `tp`).

## Time

Started 00:57, first gate pass 01:10, review fixes and done 01:20: about 25 minutes, one session.
