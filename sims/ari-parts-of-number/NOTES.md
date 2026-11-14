<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-parts-of-number: notes

New explorer (task `docs/tasks/w3/ari-parts-of-number.md`, catalogue §4.17, wave 3, MAT OŠ A.2.4, A.3.6, A.4.4).
Rules and expected numbers: `SPEC.md`.

## Decisions

- **One model, two pictures.** The whole is a number N split into d parts; the row of objects draws N counters, the
  clock draws the hour as 60 minutes around the dial. The clock is not a second concept: it is the same calculation
  with N = 60 ("the clock face is a row of 60 minutes bent into a circle", the adult caption). So every rule (equal
  parts, remainder, unequal parts) works on both pictures, and the hand of the clock ends where the coloured parts end
  (45 → on the 9).
- **Explorer, not stepper.** The student picks the whole, d and k (or clicks a part: parts 1…i are coloured); the page
  shows the words ("dvije trećine broja 12 su 8"), the calculation (12 : 3 = 4, 2 · 4 = 8) and the picture together.
- **Words, no fraction notation.** The curriculum says "ne spominje se pojam razlomka" for grades 3–4; no 1/3, no
  fraction bar, no "razlomak" on the page. The names are words in their Croatian plural forms (1: trećina, 2–4:
  trećine, 5+: trećina), k is a feminine number word (jedna, dvije …; k = 1 is the name alone, "trećina"), and the verb
  follows the same form (je / su / je). English: "one third of 12", "two thirds of 12 is 8".
- **The typical mistake is unequal parts**, deterministic: the first part q + ⌊q/2⌋, the last q − ⌊q/2⌋, the others q
  (12 in three: 6, 4, 2; an hour in four: 22, 15, 15, 8), so the drawing is visibly wrong and still has d parts and N
  in all. It is asked first in its preset (V shows): the claimed value is crossed out and the right one written next
  to it, the wrong-sized parts are dashed red, and for k = 1 the caption checks by multiplying (3 · 6 = 18, not 12).
  A whole where q = 1 has no unequal split with an object in every part: the parts stay equal and the caption says so.
- **A whole that does not divide** is drawn, not refused: d parts of ⌊N/d⌋ and the rest left over in a dashed box
  ("ostaje 1"), the calculation "10 : 3 = 3, ostatak 1" (the wording of `ari-remainder`), and the verdict "nema
  jednakih dijelova". It comes before the mistake (SPEC rule 4, tie-break). The clock does the same for d = 7, 8, 9, 11
  (60 : 7 = 8, ostatak 4), which is why the hour is usually split in 2, 3, 4, 5, 6, 10 or 12.
- **The row's layout** is computed in the page: each part is a box with a small grid of counters; the page picks the
  fewest rows whose counters are at least 80 % of the biggest that fit, so 12 in three reads as a row of boxes and 100
  in four as four 5 × 5 squares. The picture is redrawn on resize.
- **Limits:** N 1…100, d 2…12 (every name the curriculum uses, to desetine, plus the twelfths of the clock face).
- **Three audiences** through `Simdeck.paperColumns.audience` (one stored choice for the `ari-` pages): the teacher
  view has the mistake switch and "ask first"; the adult view adds the check d · q = N under the calculation and a
  "why" sentence; the child view hides the number of objects and the mistake switch and says one short sentence.
  Base 10 only (the row does not say "any base").
- **The mistake switch is a toggle** (`unequal`), not a two-way choice: the panel did not fit at 1920 × 1080 with a
  choice (954 > 926 px). The "click a part" hint is the picture's tooltip for the same reason.
- No kit view: the §4.17 notes keep K5 for `ari-times-ten` and `ari-big-numbers`; the counters and the clock are the
  page's own SVG with HTML labels at 1:1.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- No base control (base 10 only, as the §4.17 notes say for rows that do not say "any base").

## Sources

- The national curriculum for mathematics, Narodne novine 7/2019
  (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html), **read on 2026-11-14** in this session: MAT OŠ
  A.2.4 ("Određuje polovinu, trećinu, četvrtinu itd. zadanoga broja."; preporuka "… prepoznaju i grafički prikazuju
  tortnim prikazom"), A.3.6 (preporuka "Između ostaloga, prikazivati i računati polovine, trećine… nekoga broja."),
  A.4.4 (preporuka "Učenici rješavaju i zadatke u kojima određuju trećine, četvrtine, petine i desetine nekoga broja.
  Izraze poput dvije trećine, četiri petine... potrebno je popratiti govorom i prikazati na različite načine (konkretima,
  crtežima i sl.)." and "Primjer: Tri su četvrtine jednoga sata ___ minuta."), A.3.4 / A.4.3 ("ne spominje se pojam
  razlomka"). The presets "četiri petine" and "tri četvrtine sata" are the curriculum's words; 12 and its thirds are the
  catalogue's; 20, 10 and the unequal 6, 4, 2 are mine.
- Croatian textbooks for grades 2–4 were not available offline. **Marked *(check)*:**
  - "trećina broja 12" (textbooks may also say "trećina od 12");
  - the calculation order "12 : 3 = 4, 2 · 4 = 8" (some books may write 4 · 2);
  - the sentence "Dvije trećine broja 12 su 8" (verb "su" for 2–4 follows the curriculum's "Tri su četvrtine jednoga
    sata"; "je" for 5+);
  - "pola sata" and "četvrt sata" as the everyday words in the clock captions, and "minutna kazaljka";
  - "polovina" rather than "polovica" (the curriculum says polovina);
  - the names jedanaestina and dvanaestina (beyond the curriculum's list; used only for the clock face).
- The typical mistake (calling any d pieces "d-ths" without equal size) is the classic one of the school literature on
  parts of a whole, from general knowledge *(check)*.

## Checks

- Numbers: an independent Python script recomputed every preset and SPEC example (parts, remainder, the unequal
  split, the coloured amounts) and swept every N ≤ 100, d ≤ 12, k ≤ d: unequal parts keep N, every part has an object,
  and k < d is always wrong by ⌊q/2⌋. All agree with `sim.js` and the tests.
- Tests: 18 (`node --test sims/ari-parts-of-number/sim.test.js`), tie-breaks first, with sweeps.
- `npm run gate -- ari-parts-of-number`: see the report. Extra screenshots with a separate Playwright script: every
  preset, the mistake before and after V, adult and child views, 100 in four, the clock in 7, 12 and unequal parts,
  2 in three, the phone, in both languages; no console errors, no page scroll at 1920 × 1080.

## Term pairs (not in the glossary; written out in both tables)

| hr | en |
|---|---|
| polovina, trećina, četvrtina, petina … desetina | half, third, quarter, fifth … tenth |
| jednaki dijelovi | equal parts |
| ostatak | remainder |
| brojčanik | clock face |
| minutna kazaljka *(check)* | minute hand |

## Shared requests

- None. The counters and the clock face are drawn in the page.
- The catalogue has no clock page yet. If one comes, the page's `clockBox` (a dial of 60 minutes with sectors, a
  minute hand and HTML numerals) is a candidate for a kit view.

## Learn tree

Suggested leaf (catalogue §4.17): `arithmetic` → `operations` → `parts` "Dijelovi broja".

## Fresh review

A fresh agent read SPEC.md against the code, the page and the strings, ran 84 mutations of `sim.js` and opened 90
states in a browser (no console errors, no scroll). The model matched every rule. Found and fixed:

- "Ask first" showed "ostaje 1" under the left-over objects; it now says "ostaje ?".
- "Ask first" on the mistake read "Trećina broja 12 je ?" with "Koliko je to?", which presumes the coloured part is a
  third; it now reads "Trećina broja 12?" with "Je li to obojeni dio?". The mistake switch (whose name gives the
  answer away) leaves the panel while the class is asked.
- On the clock the remainder sentences spoke of objects and said an hour cannot be split into 7 equal parts; they now
  say "od cijelih minuta" (`cRemHour`, `whyRemMin`).
- "cijelo" as a noun → "cjelina"; the child's sentence for all unequal parts is its own string; "Dvanaest dvanaestina
  … je svi dijelovi zajedno" reworded ("… je cijeli broj 60: svi dijelovi zajedno").
- English verb "is" for every k → "is" / "are" ("two thirds of 12 are 8", as in sim.json).
- SPEC rule 1's reason for N ≤ 100 was wrong (100 : 2 = 50 is outside the table); reworded. SPEC rule 4 now says the
  words name one part when the whole does not divide (the page said "dvije osmine sata" with no value), and that k
  parts which happen to make a whole number (10, d = 4, k = 2) are left to fractions.
- The dashed outline of the minutes left over crossed the 12; the radius at 12 is no longer drawn.
- Test gaps: the preset table is pinned to the SPEC, `wayIgnored` and `noUnequal` with the other condition false,
  `check` null when it does not divide, `unequal: 'true'` is not true. 19 tests. The other survivors were equivalent
  (clamp order, `r < 1` for `r === 0`, `s >= 0` guard, `wrong` with `k < d` or without `divides`, `value = taken`
  under equal parts) or outside the SPEC (Infinity clamps to the bound).

## Time

Started 00:45 (2026-11-14); curriculum read and SPEC numbers checked first, then model, tests, strings and page, the
gate and the screenshots; fresh review and its fixes; status ready and the gate passing at 01:07. About 25 minutes of
wall-clock time, one session.
