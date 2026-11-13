<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-column-multiplication: specification

One concept: **multiply by each digit of the second number, write each partial product shifted by that digit's
place (it is multiplied by a power of the base), then add; an area model shows why; in base 2 every partial product
is the number itself or zero, shifted: shift-and-add.** Task: `docs/tasks/w3/ari-column-multiplication.md`; catalogue
§4.16. Every expected number below was checked with a small script independent of `sim.js` before coding (NOTES.md,
Checks) and is asserted in `sim.test.js`.

## Scene (kit view K5, paper columns: `kit/papercolumns.js`, docs/sim-ui.md §14)

- **The paper**, the Croatian school layout *(check)*: the factors on one line, `457·36`, with the centred dot in
  its own square; the second factor's ones at place 0. Under a line, one **partial product** per digit of the second
  factor, **from its left digit to its right** (the Croatian order *(check)*): each one ends under the digit it was
  multiplied by (`at` = that digit's place), so `457 · 3` = 1371 ends under the 3 (tens) and `457 · 6` = 2742 under
  the 6 (ones). The last partial product has the `+` sign *(check)*. Under a second full line the **product**. A
  small **carry row** between the first line and the first partial product holds the carries of the final sum, as
  in `ari-column-addition`. Rows: the place row (J, D, S, T… in base 10, bᵏ in other bases), the factors, the sum's
  carry row, the partial products, the product. With a one-digit second factor there is no sum: the only partial
  product is the product (bold, under the line), and there is no carry row.
- **While a partial product is written** (one step per digit of the first factor): the band (tint and thick outline)
  marks the two factor digits being multiplied and the square being written; the digit written this step has the
  kit's changed mark; what is carried ("pamtim 2") is a small tag in the corner of the next square of that row,
  gone once that square is written.
- **The area model** (teacher and adult; a switch, on by default): a rectangle cut by place values, not to scale.
  Columns: the first factor split by place (400, 50, 7), rows: the second factor's digits from the left (30, 6),
  each cell their product (12000, 1500, 210 / 2400, 300, 42), and right of each row its total with the partial
  product it is: `13710 = 1371 · 10`, `2742 = 2742 · 1`. Under it the total, the product, after the sum step. All
  numerals in the current base (in base 8, `400₈ · 30₈ = 14000₈`): appending a zero is multiplying by the base in
  every base. The current cell (digit step) or row (a 0 or 1 row) is marked as on the paper; the cells of rows not
  yet reached are faint.
- **Typical mistake card** (teacher view, when chosen): the same multiplication done the wrong way, row by row in
  step with the paper, wrong digits struck through (`x: 'wrong'`), the wrong product against the right one, and why.
- **Header:** the audience switch (kit). **Panel:** the factors field, the base (2–16 and quick buttons 2, 8, 10,
  16), the area model switch, the typical mistake (teacher only).

## Params

| key | default | meaning |
|---|---|---|
| `a`, `b` | 457, 36 | the first and the second factor, as quantities |
| `base` | 10 | 2–16; digits 0–9 then A–F |
| `area` | true | show the area model (teacher and adult) |
| `mistake` | `none` | `none`, `noshift`, `carry`, `carryfirst` |

As in `ari-column-addition`, the numbers are quantities: changing the base keeps them and rewrites their digits.
**Limits:** each factor has at most **4 digits** in the base. That bounds the steps (at most 4 × 4 + 1 = 17, script:
the maximum over all bases is 17) and the paper (at most 9 squares and 8 rows). A base in which a factor needs more
than 4 digits is refused (quick button unavailable with the reason; slider minimum `minBase`). Typed input (`457 · 36`;
separators `·`, `⋅`, `×`, `*`, `x`, `X` and spaces; a–f read as A–F; leading zeros dropped) is refused with a reason
when a character is not a digit of the base (`digit`), a factor has more than 4 digits (`long`), there are not
exactly two numbers (`count`), or a number is missing next to a sign (`empty`).

The **child** view works in base 10 only (base control hidden; switching to it sets base 10, or the default numbers
if a factor would not fit in 4 decimal digits). The area model and the typical mistake are not shown to the child.

## Plan (computed from the params)

`rows[j]`, j = 0 … m − 1, one per digit of the second factor **from the left**: `d` (the digit), `place` (m − 1 − j),
`kind` (`zero` for d = 0, `one` for d = 1, `mul` otherwise), `digits` (the partial product as written, ones first),
`value` (a · d), and for `mul` the digit steps `{ i, ad, cin, prod = ad · d + cin, write, cout, last }`, i over the
first factor's digits from the ones.

## State

`{ phase: 'start'|'digit'|'row'|'sum', row, i, parts: [[digits written] | null], carry, sum }`, plain JSON. `row`
and `i` name the row and the digit of the first factor of this step (−1 before any); `parts[j]` the digits of
partial product j written so far, ones first; `carry` what is carried to the next square of the current row (0:
nothing, no tag); `sum` whether the product is written.

## One step

Step 0: the factors written. Then, row by row from the left digit of the second factor:

1. **`mul` row, one step per digit of the first factor** (from its ones): `prod = ad · d + cin`; not the last digit:
   write `prod mod base` in the next square of the row (place `row place + i`), carry `⌊prod / base⌋`; the last digit:
   write all of `prod` (one or two digits), carry nothing.
2. **`zero` or `one` row, one step**: the whole row at once: d = 1 writes the first factor itself, d = 0 writes as
   many zeros as the first factor has digits (one `0` when it is also the product, m = 1).
3. **Sum** (m ≥ 2, one step): the partial products are added column by column as in column addition; the carries
   go into the carry row; the product under the second line.

**Step count** = Σ over the rows (n for a `mul` row, 1 for `zero` and `one`) + 1 if m ≥ 2. Default 457 · 36: 3 + 3 +
1 = **7** (`sim.json` `steps`). At most 17 (4 × 4 + 1).

## Rules (tie-breaks first)

1. **Tie-break: a carry of 0 is not said and not tagged.** 312 · 2: 2·2 = 4, 1·2 = 2, 3·2 = 6, no tag; "pišem 4".
2. **Tie-break: a product that reaches the base exactly writes 0 and carries 1.** 312 · 5: 2·5 = 10 → write 0, carry 1;
   1·5 + 1 = 6; 3·5 = 15 → write 15: 1560.
3. **Tie-break: the last digit of the first factor writes its whole product.** 457 · 3: 4·3 + 1 = 13 → "pišem 13"
   (two squares in one step); nothing is carried out of the row.
4. **Tie-break: a digit 0 or 1 writes its row in one step** (0: zeros, as many as the first factor's digits, keeping
   the columns; 1: the first factor itself), in every base; this is what makes base 2 shift-and-add. A one-digit
   second factor 0 writes a single 0 (it is the product: no leading zeros). 312 · 205: 624, 000, 1560 → 63960.
5. **Order:** the rows from the second factor's left digit to its right *(check)*, each from the first factor's ones
   to its left digit; the sum last.
6. **The shift:** row j ends under its digit: `at` = m − 1 − j, so its value on the paper is `value · base^place`.
   457 · 36: 1371 at 1 (= 13710), 2742 at 0; 13710 + 2742 = **16452**; the sum's carry: one, into the thousands
   (3 + 7 = 10).
7. **The carries inside a row** are at most base − 2 (checked over all bases 2–16, script). 457 · 3: 21 → 1 carry 2;
   15 + 2 = 17 → 7 carry 1; 12 + 1 = 13 → 13. 457 · 6: 42 → 2 c4; 30 + 4 = 34 → 4 c3; 24 + 3 = 27 → 27.
8. **The sum's carries** are at most 3 (four rows; script).
9. **The product is a · b in every base** (all a < min(b⁴, 400), c < min(b⁴, 60) and 3000 random pairs per base 2–16,
   script; random inputs in the tests).
10. **The area model:** cell (j, i) is `A[i]·baseⁱ · d_j·base^place_j`; row j's cells add up to `value_j · base^place_j`;
    all cells add up to a · b.
11. **Any base, same algorithm:** 457 · 36 in base 16 is 1C9 · 24: 1C9 · 2 = 392 (9·2 = 18 = 12₁₆ → 2 c1; C·2 + 1 = 25
    = 19₁₆ → 9 c1; 1·2 + 1 = 3), 1C9 · 4 = 724 (9·4 = 36 = 24₁₆ → 4 c2; C·4 + 2 = 50 = 32₁₆ → 2 c3; 1·4 + 3 = 7), sum
    3920 + 724 = **4044₁₆ = 16452**. Base 2: 1101 · 1011 (13 · 11): rows 1101, 0000, 1101, 1101, each one step; sum
    **10001111₂ = 143**, sum carries into places 4–7; 5 steps.

## Typical mistakes (teacher view)

Computed by the model from the same numbers; the card shows each wrong row once the paper has written that row.

| `mistake` | what is done wrong | 457 · 36 | other values (script) | why (shown) |
|---|---|---|---|---|
| `noshift` | every partial product ends under the ones | **4113** (1371 + 2742) | 312 · 205 → 2184; 1101 · 1011₂ → 100111₂ (39); 1C9 · 24₁₆ → AB6₁₆ | the 3 is 3 tens: 457 · 3 tens is 1371 tens, so its row ends in the tens column |
| `carry` | what is carried is forgotten (each digit product alone; the last written whole) | **14912** (1251, 2402) | 248 · 7 → 1486; 312 · 205 → 63950; 1C9 · 24₁₆ → 2C24₁₆ | "pamtim 2" is 2 of this place, carried from the right: without it the product is too small |
| `carryfirst` | the carry is added to the digit before multiplying | **23552** (1811, 5442) | 248 · 7 → 5636; 312 · 205 → 64400; 1C9 · 24₁₆ → 5AA4₁₆ | the carry is added to the product: 5 · 3 + 2 = 17, not (5 + 2) · 3 = 21 |

**Tie-break:** a mistake that gives the right result here (no carry in any row for `carry` and `carryfirst`, e.g.
any base-2 product; a one-digit second factor for `noshift`) marks nothing and the card says why it does not show.
`noshift` writes the right digits in the wrong place: only the product's digits are crossed.

## Presets (keys 1–6)

| # | id | numbers | base | mistake | steps | outcome |
|---|---|---|---|---|---|---|
| 1 | `two-digit` | 457 · 36 | 10 | none | 7 | 16452; 1371 shifted one place, 2742 |
| 2 | `one-digit` | 248 · 7 | 10 | none | 3 | 1736; 56 → 6 c5, 33 → 3 c3, 17 (grade 3: no sum) |
| 3 | `zero-digit` | 312 · 205 | 10 | none | 8 | 63960; a row of zeros in one step |
| 4 | `no-shift` | 457 · 36 | 10 | noshift | 7 | 16452; the mistake gives 4113 |
| 5 | `base-2` | 1101 · 1011 | 2 | none | 5 | 10001111₂ = 143: every row the number or zeros, shifted |
| 6 | `base-16` | 1C9 · 24 | 16 | none | 7 | 4044₁₆ = 16452: the same quantities as preset 1 |

## Audiences (same model, other words)

| | teacher (default) | adult | child |
|---|---|---|---|
| captions | the school step: "7 · 3 = 21: pišem 1, pamtim 2" | why: the digit's place value, the carry as carry · base + digit, each row's shift | the spoken step: "7 puta 3 je 21. Pišem 1, pamtim 2." *(check)* |
| area model | yes (switch) | yes (switch) | no |
| digits | normal | normal | larger |
| base | any | any | 10 only |
| typical mistake | yes | no | no |

## Legend

the digits multiplied and the square written (kit `pc-band`), carried to the next square (small tag), written in this
step (kit `hl`).

## Terms

| hr | en |
|---|---|
| pisano množenje | column multiplication (long multiplication) |
| faktor | factor |
| umnožak | product |
| djelomični umnožak *(check)* | partial product |
| pišem 1, pamtim 2 *(check)* | write 1, carry 2 |
| model površine *(check)* | area model |

## Misconceptions targeted

- "The second row is just moved over by habit": the area model and the adult captions show it is × base.
- Partial products not shifted (mistake `noshift`, preset 4).
- The carry forgotten, or added before multiplying (mistakes `carry`, `carryfirst`).
- "A 0 in the second factor can be skipped": the zeros row keeps the columns (preset 3).
- "Base 2 is different maths": the same algorithm; with digits 0 and 1 only, multiplying is shifting and adding
  (preset 5); the same quantities in base 16 (preset 6).

## Out of scope

Decimals, negative numbers, more than two factors, factors over 4 digits, the English order of the rows (ones digit
first; the explanation mentions it), multiplication tables themselves, other algorithms (lattice, Russian peasant),
how a processor's multiplier is built (`arh-` pages), checking a product (`ari-checking`).
