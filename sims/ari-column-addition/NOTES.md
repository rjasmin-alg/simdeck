<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-column-addition: notes

New stepper (task `docs/tasks/w3/ari-column-addition.md`, catalogue §4.16, wave 3), the first `ari-` page and the
pilot of kit view **K5, paper columns**. Rules and expected numbers: `SPEC.md`.

## Decisions

- **K5 is drawn in this folder** (the task says so): `drawPaper(spec)` in `index.html` draws squared-paper cells
  (one digit per cell, CSS grid with a gradient grid), the place row, the carry row, the numbers aligned on the
  right, the `+` sign, the rule, the result row, a current-column band, crossed-out digits (`crossed`, used by the
  mistake card) and an optional decimal column that is not squared. The spec is plain data indexed by place
  (k = 0 is the ones), so the subtraction, multiplication and division pages can draw with it. The audience switch
  (header) and the base control (panel) are the other two K5 parts; see "Shared requests".
- **Numbers are params as quantities** (`count`, `a`–`d`), not digit strings. Changing the base keeps the quantity
  and rewrites the digits, which is the owner's point (a base is only a way of writing a number). The field shows
  and reads them in the current base. The kit has no text param, so `count` and `a`–`d` are hidden `range` params:
  that keeps them in the URL, so a link, a reload and the `L` language switch keep typed numbers. Typed input that
  does not parse is refused with the reason under the field and leaves the params unchanged.
- **At most 9 digits per number, 2–4 numbers**, so a demo has at most 2·9 + 1 = 19 steps (contract: about 20). A
  base in which a number would need more than 9 digits is refused: its quick button is unavailable (`aria-disabled`,
  reason in its tooltip and, when clicked, in the caption), and the base slider's lowest value is the smallest base
  that fits (`minBase`).
- **Two steps per column** (add, then write and carry) and one more for a final carry. The add step gives the class
  a beat to work out the column sum before the page writes it; the child's "one step per click" is the same steps.
  Step counts vary with the numbers; `sim.json` `steps` is the default's 6.
- **Where the carry is written:** small, above the next column (the carry row), in the carry colour; the final carry
  goes straight into the result. *(check: whether Croatian grade 3 textbooks write the carry above the column or
  only say "pamtim"; the owner's phrasing "pišem 7, pamtim 1" is used as the spoken step.)*
- **The regrouping box** is the "not a trick" part: the column sum as dots (filled from the digits, hollow rings for
  the carry that came in), packed in frames of *base* dots (a ten-frame of 5×2 in base 10, 4×4 in base 16, pairs in
  base 2). In the write step every full frame gets a dashed outline and a ← badge: it leaves as one unit of the next
  place, the dots left over are the digit. Shown in all three views.
- **Carries of the base or more** (only base 2 with 3–4 numbers, base 3 with 4): the carry is a quantity, written in
  the carry cell as its numeral in the base (two in base 2 is `10`); the caption says so. A final carry of that size
  gives two leading digits in one step.
- **Audiences:** one model; the view changes captions (three registers in `strings.js`: `…T`, `…A`, `…C`), digit
  size, the decimal column (not for the child), the base control (hidden for the child, who always works in base 10:
  switching to the child view sets base 10, or loads the default numbers if a number would not fit in 9 decimal
  digits) and the typical mistake (teacher only, as the task lists it). Remembered in `localStorage`
  `simdeck.ari.audience` for all `ari-` pages and written to the URL as `?audience=` when not the teacher; the URL
  wins. The kit keeps unknown query keys, so `audience` survives the kit's URL updates and the language switch.
- **Typical mistakes** (teacher): forgetting the carry (the result is short by exactly the forgotten carries, shown
  in the base and in decimal), writing the whole column sum, aligning on the left. The model computes each from the
  same numbers; the card fills column by column in step with the paper and crosses out the digits that differ. Where
  a mistake would give the right answer (no carries, equal lengths) the card says so. A fourth, the equal-additions
  question, belongs to subtraction.
- **Place row:** in base 10 the school letters J, D, S, T *(check: J, D are confirmed by a grade-3 worksheet heading
  "zbroj brojeva J i D veći je od 9"; S, T and beyond, DT, ST, M, DM, SM, are inferred)*; English O, T, H, Th, then
  TTh, HTh, M, TM, HM *(check)*. In other bases the place value as a power, b with k as a superscript, the decimal
  value in its tooltip; captions name such places "×64".
- **Numbers in captions** are worked as quantities: a column sum is written in decimal (`A + F + 1 = 10 + 15 + 1 =
  26`), the written digit as a digit of the base (`A (10)`), results with the base as a subscript.
- **Presets:** six, keys 1–6 (SPEC.md). `sim.json` `entries` lists `four-numbers` (carry 3) and `base-2`.
- **No glossary terms:** the page uses Croatian school words directly (*zbrajanje, pribrojnik, prijenos*); the
  English-in-italics term rule is for technical terms and would be odd for grade-3 vocabulary. `glossary.js` is not
  linked.
- **Not linked:** `arh-twos-complement` does not exist yet, so `related` is empty (the task's base-2 link is for the
  multiplication page anyway).

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- The typical mistake is shown in the teacher view only (the task lists it under teacher); a parent in the adult view
  does not see it.

## Sources

- Croatian school phrasing: owner (task file, 2026-11-12): "pišem 7, pamtim 1". The term *pisano zbrajanje* and the
  rule "jedinice ispod jedinica" from Croatian grade-3 teaching material found by a web search (a worksheet "U
  stupac jedinica pišemo jedinice, a broj desetica pribrajamo"; a lesson title "Pisano zbrajanje brojeva do 1 000
  (zbroj brojeva J i D veći je od 9)"); the textbooks themselves were not read. *(check: the national curriculum, NN
  7/2019, not read; the textbook layout of the carry, see Decisions.)*
- The arithmetic (positional notation, carry = ⌊sum / base⌋, the k − 1 bound) is standard; every number was checked
  with a small Python script before coding and is asserted in `sim.test.js`.

## Checks

- Numbers: a Python script computed every preset, every mistake value and the carry bound for bases 2–16 with 2–4
  nine-digit numbers before the model was written; the same values are in SPEC.md and the tests.
- Tests: 24 (`node --test sims/ari-column-addition/sim.test.js`), tie-breaks first. Each rule was broken once
  (16 mutations of `sim.js`: a carry only above the base, the carry always 1, the carry not added, missing digits
  counted, the final carry not split into digits, leading zeros kept, the digit check off, 5 numbers allowed, the
  carry written in its own column, a digit written in the add step, each mistake computed like the right answer,
  `minBase` off by one, no final step); every mutation failed at least one test.
- `npm run gate -- ari-column-addition`: pass (64/64 browser checks). Screenshots reviewed at 1920×1080 (light, dark,
  grayscale) and 375×812 in both languages, plus the teacher, adult and child views, base 2, 16 and nine-digit
  numbers, and each mistake.

## Fresh review

A separate reviewer read the diff against SPEC.md and probed the model and the page (edge sums, odd input, URLs).
Every SPEC number held. Fixed from its findings: the child view could be put into base 2 or 16 by a preset key or R
(now forced back to 10 after every render); a bad URL value (`?mistake=foo`, `?base=abc`) crashed or broke the page
(every param now has its default as `value`); the `whole` and `left` cards contradicted themselves when the mistake
happens to give the right numeral (5 + 5, 0 + 10: now no digit is crossed out and the card says why; tested);
adult captions wrote false equations for places without a name ("1 + 1 + 1 = 3 × 2", now "3 jedinice mjesta ×2");
16 px floor on multi-digit cells in the mistake card; sideways scroll at 375×812 from a long unbreakable decimal
line in the caption; the numbers field kept stale text or an old error when a preset or base was picked while it
had focus; the dots' aria-label had no plural forms; three places where SPEC.md and the page disagreed (place row,
"0950", the teacher caption sample) were corrected in SPEC.md.

## Term pairs (not in the glossary; written out in both tables)

| en | hr |
|---|---|
| column addition | pisano zbrajanje |
| addend | pribrojnik |
| sum | zbroj |
| carry | prijenos (already in the glossary, `src: simdeck`) |
| base | baza |
| place value | mjesna vrijednost |
| regrouping | pregrupiranje *(check)* |
| ones, tens, hundreds, thousands | jedinice, desetice, stotice, tisućice |

## Shared requests (kit view K5, `kit-paper-columns`)

- Move `drawPaper(spec)` and its CSS (`.ac-paper`, `.ac-c`, `.ac-band`, `.ac-rule`, `.ac-x`, `.ac-dec*`) into the
  kit as `Simdeck.paperColumns(spec)`. Spec as it stands: `{ width, places, placeTitles, carries, carryChanged, rows,
  result, changed, crossed, band, decimals, decimalResult, decimalHead, aud, label }`, all arrays indexed by place.
  Subtraction will also need crossed-out digits in the number rows with a small replacement digit above them (only
  the result row has `crossed` now), and division a layout that is not right-aligned under one rule.
- The audience switch: a kit header control with a shared storage key (`simdeck.ari.audience`) and `?audience=`; it
  is page code here (`buildAudience`, `setAudience`, `writeAudienceUrl`).
- The base control: the kit range plus quick buttons that can be refused per value with a reason (the kit's
  `disabled` covers a whole control only); page code here (`buildQuick`, `pickBase`).
- A text param type in the kit (a field whose value is kept in the URL) would replace the hidden `range` params.

## Time

Started 22:39, first gate pass 22:58, review fixes and done 23:20: about 45 minutes, one session.
