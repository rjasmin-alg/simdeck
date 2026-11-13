<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-times-ten: notes

New stepper (task `docs/tasks/w3/ari-times-ten.md`, catalogue §4.17, wave 3; thread t-0436). Rules and expected
numbers: `SPEC.md`.

## Decisions

- **Kit view K5 is used, not drawn here** (the task's "uses kit view K5 paper columns once it exists": it exists).
  The place-value table is `Simdeck.paperColumns`: a place row (J D S T DT ST M in base 10, bᵏ otherwise), one row
  per move as a **staircase** (`47`, `470`, `4700`), the move written in the aside (`· 10`, `: 10`), the band on the
  ones square of the new row, the 0 written in this step with `now`. Dividing, the paper gets one square right of the
  ones (`right: 1`, no label): the 0 that leaves is drawn there crossed (`x: true`); a digit that is not 0 is crossed
  as wrong (`x: 'wrong'`). The rows still to come are empty rows, so the table has its full size from step 0.
- **A staircase, not one row that changes.** Each move is a row of its own, so `· 100` is visibly `· 10` twice
  (the catalogue's "by 100 two places") and the class can compare the rows. The digits of the new row slide in from
  where they stood in the row above (Web Animations on the K5 cells; not under reduced motion, as the gate checks).
- **Steps:** step 0 the question, one step per move, one step that writes the result outside the table (the
  curriculum's "u tablici mjesnih vrijednosti, zatim izvan tablice pravilnim zapisom"). 2–4 steps; `sim.json` `steps`
  is the default demo's (47 · 100: 3).
- **Six operation buttons on the stage**, not in the panel: `· 10`, `· 100`, `· 1000`, `: 10`, `: 100`, `: 1000`
  (the task's "press · 10, · 100, · 1000 and : 10"; the projector shows what was pressed). The `op` param behind them
  is a hidden select (so the URL and the L switch keep it), as `ari-place-value` keeps its counts. Pressing the
  current operation again goes back to step 0. In base b the labels stay `10`, `100`, `1000` (that is b, b², b³
  written in base b: the concept's point) with the decimal value under them (`= · 2`).
- **Operations that cannot be finished are pressable**, not refused: their button is dashed with ✗ and says why in
  its tooltip; pressed, the demo shows where it stops. `: 10` on 347 shows the 7 crossed outside the table (rule 6),
  which is the lesson "at this level only numbers that end in 0". `· 1000` on 2000 has one step that says the result
  is over a million (rule 5); nothing is drawn outside the table for it.
- **Range:** 1 … 1 000 000 in every base (grade 4 counts to a million, MAT OŠ A.4.1; the same quantity in every base,
  so switching the base never clamps the number). The table is as wide as the widest row (at least 4 places): 7 in
  base 10, up to 20 in base 2 (a million is 20 binary digits; the squares get smaller, the phone box scrolls inside).
- **"Dalje s rezultatom"** (go on with the result, key `D`) at the last step makes the result the new number, so a
  class can chain 47 → · 100 → 4700 → : 10 → 470.
- **Audiences:** teacher (default; the why box, the decimal values in another base, the typical mistake card),
  adult (the captions say why: every unit ten times bigger, the 0 keeps the places, the sum of the digits' worths at
  the end), child (base 10 only: the base control hides, switching to the child view sets base 10 with the same
  number, the base-2 preset hides; big digits; one short sentence per step; no boxes under the table).
- **Typical mistakes** (teacher, param `mistake`): a 0 too few (`few`, one move too few: 47 · 100 = 470) and a 0
  taken from the middle (`middle`, dividing: 3040 : 10 = 340). The card shows the pupil's answer from step 0 and asks
  where the mistake is; at the last step a small table compares it with the right result place by place (wrong
  places crossed in `--danger`) and says why. When the mistake does not apply it says so and names the preset that
  shows it.
- **Numbers:** base 10 numbers of five digits and more are grouped by three (hr `205 000` with a no-break space, en
  `205,000`) in the sentence and captions, not in the table; numerals of other bases carry the base as a subscript.
- **Model reuse (COMMON.md §6):** `models/` is empty, so `digitsOf`, `textOf` and `parseNumber` are copied from
  `sims/ari-place-value/sim.js @ a3f3b18` with a comment; `parseNumber` is changed here (limit a million, 0 refused,
  any whitespace ignored). Both copies are promotable as they are.
- **No glossary terms:** as in the other `ari-` pages, the Croatian school words are used directly; `glossary.js` is
  not linked.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- **`: 100` and `: 1000` are added** next to the task's `: 10`: the curriculum outcome (MAT OŠ A.3.4: "Množi i dijeli
  broj brojevima 10, 100 i 1000") and its content line ("Množenje i dijeljenje broja s 10, 100 i 1000") name them,
  and the rule is the same move (rule 6: they need two or three zeros at the end). One concept still.
- The range is a million (grade 4), not grade 3's 1000; the presets stay with small numbers (34, 47, 205, 3040, 3470).

## Sources

- The national curriculum for mathematics, Narodne novine 7/2019
  (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html), **read on 2026-11-13** in this session: MAT OŠ
  A.3.4 (razrada "Množi i dijeli broj brojevima 10, 100 i 1000."; sadržaj; preporuka "Postupnost: … množiti i
  dijeliti u tablici mjesnih vrijednosti te množiti i dijeliti izvan tablice pravilnim matematičkim zapisom"), A.4.3
  ("Množi i dijeli brojeve s 10 i 100."), A.3.1 ("Tablica mjesnih vrijednosti": the term is confirmed, which
  `ari-place-value` had marked *(check)*). No example numbers are given, so the presets are mine.
- Croatian textbooks for grades 3–4 were not available offline. **Marked *(check)*:**
  - the place abbreviations beyond T: **DT, ST, M** (desetice tisuća, stotice tisuća, milijuni) and English TTh, HTh, M;
  - **"pomak"** (a move of the digits) and "pomiče se ulijevo / udesno" as the lesson's words;
  - the child's sentences "Sve znamenke jedno mjesto ulijevo. Na mjesto jedinica pišem 0." and "… udesno. Nula
    odlazi.";
  - "završava s dvije nule" (colloquial; the formal instrumental is "s dvjema nulama");
  - grouping numbers of five digits and more by three with a space (and four-digit numbers without).
- The typical mistakes (a 0 too few, a 0 crossed out from the middle) are the classic ones of the school-arithmetic
  literature, from general knowledge *(check)*.
- Base b: positional notation, standard.

## Term pairs

tablica mjesnih vrijednosti / place-value table; pomak (ulijevo, udesno) / move (left, right) *(check)*; desetice
tisuća / ten thousands; stotice tisuća / hundred thousands. Not added to the glossary (the `ari-` pages do not use it).

## Shared requests

- **models/ (coordinator):** promote `digitsOf`, `textOf`, `parseNumber` of `ari-place-value` (with an optional
  limit and a "refuse 0" option, or as here) so this page and `ari-place-value` share one copy.
- **K5 (kit owner), small and optional:** a way to label the squares right of the ones (here the square the 0 leaves
  into has no label), and a documented way to animate a row's cells (this page finds them by `style.gridRow`).

## Checks

- Numbers: a Python script independent of `sim.js` computed every preset's rows, steps, the `few` and `middle`
  mistakes, and the edge cases (a million exactly, one over, 3400 : 100, 340 : 100, 3040 : 100, 347 : 10,
  1000 : 1000, 20500 : 100, a million in base 2, 1A₁₆ · 1000₁₆, 100₈ : 100₈) before the model was written; the same
  values are in SPEC.md and the tests.
- Tests: 23 (`node --test sims/ari-times-ten/sim.test.js`), tie-breaks first. Mutation run: 34 mutations of `sim.js`
  (the million limit ≥ and its value, the leaving digit 0 vs any digit, a 1 leaving, the · and : arithmetic, the done
  step dropped, an extra move, k capped at 2, the kind of op, the minimum width, zero digits in the moves, the target
  place, the `few` exponent, `indexOf` vs `lastIndexOf` in `middle`, each mistake's applicability, the diff of a
  missing digit, the n minimum, rounding vs floor, 0 and whitespace in the parser, the parse limit, the replay index,
  the over flag, the result of a failed demo, the base maximum). All are caught except one equivalent mutant (a no-op
  in `colsOf`). Two survivors of the first run (a leaving 1; a no-break space in a typed number) got tests.
- **Fresh review** (a separate reviewer session read the diff against SPEC.md, checked every rule, tie-break, preset
  and edge case against `sim.js`, drove the page headless and broke rules on purpose): no model bug, no number off.
  It found mutations surviving in other bases (the million limit, `few`, `middle`, the moves and the diff computed in
  base 10; the diff of a digit only the wrong result has; the parse error's `at`; the presets' mistakes) — five more
  tests now catch them (the 34 above include them); and on the page: the k = 1 teacher caption started in lower case
  (now "Jedan pomak:"), the adult stop caption did not agree with the digit ("1 jedinica podijeljeno"; rephrased),
  "više od milijun" / "do milijun" (now "milijuna"), "pomaknule za nijedno mjesto" (now "nisu se pomaknule ni za
  jedno mjesto"), "prva nula" for two zeros crossed (singular and plural keys), "s 100" (now "brojem 100", as the
  curriculum says it), and "1 = 1" at the end of 1000 : 1000 (the sum is left out when it is one term). The empty
  `?base=&n=` URL reads as base 2 and n 1 (the kit's ranges clamp before the model): documented in SPEC.md, not
  changed.
- `npm run gate -- ari-times-ten`: pass (64/64 browser checks). Screenshots reviewed at 1920×1080
  (light, dark, grayscale) and 375×812 in both languages, plus: 3040 : 10 done with the `middle` card, 3470 : 100
  stopping, 1011₂ · 100₂ done, 1A₁₆ · 1000₁₆ (en), the child view, the adult view at 205 · 1000, 2000 · 1000 over a
  million, 347 : 10 (adult).

## Time

Started 2026-11-13 23:13 (CET), done 2026-11-13 23:37: about 24 minutes, one session.
