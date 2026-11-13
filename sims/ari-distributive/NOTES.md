<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-distributive: notes

New explorer (task `docs/tasks/w3/ari-distributive.md`, catalogue §4.17, wave 3). Rules and expected numbers:
`SPEC.md`.

## Decisions

- **One array, two readings.** The model's state is an array of a rows of b columns. Multiplying reads it as a · b
  with the factor b split into p + q columns; dividing reads it as n : a with n = a · b dots split into p + q dots,
  dealt column by column (one round per column, the picture of `ari-remainder`). Switching the operation keeps the
  array, so 4 · 23 becomes 92 : 4 and the cut is converted (p columns ↔ a · p dots). The operation switch is the
  page's own segmented control in the task group (not a kit `choice`), so the operation and the converted cut change
  in one `set`; `op` stays a hidden kit param so the URL and the presets carry it.
- **A split that does not divide is drawn, not refused.** In division the slider moves the cut dot by dot; a part
  that is not a multiple of the divisor fills c whole columns and r dots of the next one, and the cut is drawn as a
  step through that column. That shows why 72 : 4 = 70 : 4 + 2 : 4 does not work (the parts are not whole columns)
  and the caption offers the written cut, 40 + 32. Dragging snaps to whole columns (always dividing); the slider and
  the presets reach the ragged cuts.
- **The typical mistake** is one per operation, the classic "only the first addend": 4 · 20 + 3 (the lost dots of
  the second part drawn hollow and dashed) and 80 : 4 + 4 (the row drawn as wide as the claim, the dots that are not
  there hollow and dashed; the check 24 · 4 = 96 ≠ 84). Both are asked first in their presets (V shows), as in
  `ari-constant-difference`. A split that does not divide is shown before the mistake (SPEC rule 6, tie-break).
- **The written form** is drawn in HTML squares (not kit view K5: the §4.17 notes keep K5 for `ari-times-ten` and
  `ari-big-numbers`). Multiplication in the layout of `ari-column-multiplication` (`23·4`, the product under a rule,
  the carry as a small tag on the tens square, coloured as part 2 because the ten came from 4 · 3 = 12); division in
  the shorter way of `ari-long-division` (the remainders under the dividend, the ones digit brought down, then 0).
  The spoken steps follow `ari-column-multiplication`'s phrasing ("3 · 4 = 12: pišem 2, pamtim 1"). When the cut is
  the written one, each step carries the mark of the part it computes; otherwise a button (P) moves the cut there.
  For division the written cut is not 80 + 4 by place but "the most tens that divide" (72 : 4 → 40 + 32), which is
  exactly what written division's first step takes (7 : 4 = 1, ostatak 3): SPEC rule 7 is the same formula for both
  operations, a cut after the full tens of *columns* (10 · ⌊b / 10⌋).
- **Limits** 1–9 rows, 1–99 columns (891 dots at most, drawn as one SVG). Two-digit by two-digit is grade 4's written
  multiplication and a three-digit factor would need a second cut; both are out of scope. "23 · 4" is accepted and
  written back as 4 · 23 (rows first).
- **Three audiences** through `Simdeck.paperColumns.audience` (one stored choice for the `ari-` pages): the teacher
  view has the task field, the operation, the mistake switch and "ask first"; the adult view adds a "why" sentence to
  every caption; the child view drops the bracket term from the sentence, the written form and the task field, and
  says one short sentence. Base 10 only (the row does not say "any base").
- Croatian noun agreement after a number ("4 retka", "23 točke", "5 jednakih redaka") goes through plural forms
  (`rowsN`, `rowsEqN`, `dotsN`) and `t.n`; captions avoid nouns after numbers elsewhere (`70 = 4 · 17 + 2`).
- The panel's mistake switch shows "tipična pogreška" while the class is asked; the teacher can hide the panel (C),
  as on the other `ari-` pages.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- No base control: the §4.17 notes say base 10 unless the row says "any base", and it does not.
- `related` lists `ari-column-multiplication`, `ari-long-division`, `ari-times-ten`, `ari-unknown-term`;
  `ari-order-of-operations` does not exist yet.

## Sources

- The national curriculum for mathematics, Narodne novine 7/2019
  (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html), **read on 2026-11-13** in this session: MAT OŠ
  A.3.4 (razrada "Primjenjuje svojstva računskih operacija (komutativnost i distributivnost). Primjenjuje veze između
  računskih operacija."; sadržaj "Množenje zbroja brojem"; preporuka "Postupnost: množiti i dijeliti zbroj brojem,
  …"), A.4.4 ("Primjenjuje svojstva računskih operacija (komutativnost, asocijativnost i distributivnost). Provjerava
  rješenje primjenjujući veze među računskim operacijama."), A.3.5 (brackets in grade 3). No example numbers for this
  outcome; 4 · 23 and 84 : 4 are the catalogue's, the others mine.
- Croatian textbooks for grades 3–4 were not available offline. **Marked *(check)*:**
  - the sentence form `4 · 23 = 4 · (20 + 3) = 4 · 20 + 4 · 3` with the one-digit factor first (textbooks may write
    `(20 + 3) · 4 = 20 · 4 + 3 · 4`) and `84 : 4 = (80 + 4) : 4 = 80 : 4 + 4 : 4`;
  - the word "niz" for the array of dots and "rez" for the cut (the curriculum names neither; textbooks may say
    "točkice poredane u retke i stupce");
  - the written multiplication layout `23·4` with the product under a rule, the spoken "pišem 2, pamtim 1" (as in
    `ari-column-multiplication`, itself *(check)*), and the carry drawn as a small tag;
  - the division steps "7 : 4 = 1, ostatak 3" and "spuštam 2: 32 : 4 = 8" (as in `ari-long-division`, *(check)*);
  - "distributivnost" as the word pupils hear (the curriculum uses it; a grade-3 textbook may only say "množenje
    zbroja brojem").
- The typical mistakes (multiplying or dividing only the first addend; splitting a dividend by place when the parts
  do not divide) are the classic ones of the school-arithmetic literature, from general knowledge *(check)*.

## Checks

- Numbers: a Python script independent of `sim.js` recomputed every preset and the SPEC examples (parts, results,
  the ragged split 70 = 4 · 17 + 2, the written cut for six tasks, both written forms step by step, both mistakes),
  swept distributivity over every a ≤ 9, b ≤ 99, p, and checked that written division's second step is always the
  second part of the written cut. All agree with `sim.js` and the tests.
- Tests: 23 (`node --test sims/ari-distributive/sim.test.js`), tie-breaks first; sweeps check distributivity for
  every cut of seven factors and all rows, and both written forms for every a ≤ 9, b ≤ 99. Mutations: see Fresh review.
- `npm run gate -- ari-distributive`: pass (47/47 browser checks). The gate opens the defaults; the other states were
  screenshotted with a separate Playwright script: every preset, the mistakes before and after V, adult and child
  views, 9 · 99, 6 · 7, 891 : 9 (the longest sentence; no page scroll), 156 : 6, the phone. A second script dragged
  the cut (20 → 10), pressed P twice (moves, then "already"), switched the operation both ways (p 20 ↔ 80), typed
  72 : 4 (cut set to 40) and 85 : 4 (refused: remainder), pressed V: no console errors. Screenshots reviewed at
  1920×1080 (light, dark, grayscale) and 375×812 in both languages.
- Found and fixed while reviewing: a number node shared by two caption sentences moved out of the first one (the
  page's `tp` now clones every node); Croatian "4 točaka" → plural forms.

## Fresh review

A fresh agent read SPEC.md against the code and the page, and ran 54 mutations of `sim.js` (one or more per rule and
tie-break). Found and fixed:

- SPEC rule 7 said whole tens (4 · 30) have a one-step written form, while the page listed two steps and said "one
  step". The written form keeps both steps (the ones give 0); the page now says "30 is whole tens: the ones give 0, so
  there is no cut by place" (`wTensOnly`), and the SPEC says so.
- SPEC rule 8 quoted "04 : 4 = 1"; the page says "spuštam 4: 4 : 4 = 1" and the paper writes 04. SPEC corrected.
- SPEC rule 9 said "23 · 4" is written back as 4 · 23, but the field kept what was typed. Leaving the field now
  writes it back.
- Dragging the cut in the dividing mistake ran away: the drawn row widens as the cut moves left. While the pointer
  is down the array is drawn with its b columns, and the mistake picture comes back on release (checked in a browser:
  the knob stays under the pointer).
- "Ask first" on a split that does not divide drew the brackets dashed red, which gave the answer away. They are now
  plain until V.
- The mistake with one row said "1 · q = q" in a division too; it has its own sentence now (`cOneSameDiv`).
- 13 surviving mutations got tests: '' and booleans are not numbers, the claimed row of exactly 99 columns, the carry
  rounded down (3 · 25, 5 · 15 and a sweep), the division working's place and the one-step working, each pair of
  parse refusals in order (num before zero, two before big, divisor before rem, rem before big), only a trailing "="
  ignored, the ⋅ and X signs. After that, 48 of 54 mutations fail a test. The 6 survivors are equivalent: `+ 0` on a
  value (×3), `divides || a === 1` (r is always 0 when a = 1), `r1 = N % a` (= N − a · T because T = ⌊N / a⌋), and
  `hide === true` (the kit always passes a boolean).

Left as it is: switching a split that does not divide back to multiplying rounds the cut half up and can land on the
edge (72 : 4 at 70 → 4 · 18 at 18, no cut). The array's label reads "cut 80 + 4" in dots when dividing.

## Term pairs (not in the glossary; written out in both tables)

| hr | en |
|---|---|
| distributivnost | distributivity |
| množenje zbroja brojem | multiplying a sum by a number |
| dijeljenje zbroja brojem | dividing a sum by a number |
| niz (točaka) *(check)* | array (of dots) |
| rez *(check)* | cut |
| redak, stupac | row, column |
| pisano množenje, pisano dijeljenje | written multiplication, written division |

## Shared requests

- None for the kit. The written-form squares are drawn in the page (K5 is not used on this page by the §4.17 notes).

## Learn tree

Suggested leaf (catalogue §4.17): `arithmetic` → `operations` → `properties` "Svojstva i veze računskih operacija",
next to `ari-unknown-term`.

## Time

Started 23:42 (2026-11-13). Curriculum read and SPEC numbers checked by about 23:50; model, tests, strings and page
with the first gate pass by about 23:58; screenshots reviewed and the caption and plural fixes by 00:00 (2026-11-14);
fresh review and its fixes, mutations rerun, gate again, status ready at 00:06; commit and checks after. About 25
minutes of wall-clock time, one session.
