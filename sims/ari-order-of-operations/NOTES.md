<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-order-of-operations: notes

New stepper (task `docs/tasks/w3/ari-order-of-operations.md`, catalogue §4.17, wave 3, MAT OŠ A.3.5, A.4.4). Rules and
expected numbers: `SPEC.md`.

## Decisions

- **Two steps per operation, pick then do.** The pick step marks the operation, outlines its two operands, lights the
  rule that chose it and says why it beats the others in play; the do step folds the node into its value and adds the
  next `= …` part to the written chain. The question "which one first?" is the concept, so it gets its own click (the
  child view's "one thing per click" too). Steps = 2 × operations, at most 12 (7 numbers); `sim.json` `steps` is the
  default's (543 − (423 + 28): 4).
- **The tree hangs under the expression.** The top row is the expression exactly as written (numbers in boxes, signs
  and brackets as text); each operation is a node right under its own sign, one row lower than its deeper operand, so
  the last operation (the root, the value) is at the bottom. A waiting operation is a circle with its sign, a done one
  a box with its value; operands it used turn hollow and dashed. The page's labels are HTML over an SVG of lines only
  (SVG text would scale below 16 px). Column widths are fixed per token kind (a number 5 units, a sign 2.6, a bracket
  1.3), so two operations in one row are always at least 7.4 units apart and a 5-digit value never overlaps.
- **The written form is the school chain**, `543 − (423 + 28) = 543 − 451 = 92`: one `=` part per done operation, the
  picked operation underlined and highlighted as one run, its brackets struck (they go in the same step).
- **Rule 3 shown as another task.** When the operation just right of the picked one has the same rank, the caption
  shows doing it first as the bracketed expression it really is (`24 : (4 · 2) = 3`, `543 − (423 + 28) = 92`). This
  ties left to right to brackets, the curriculum's point, without a rule to memorise.
- **Why · before + (adult):** a product is one number, `4 · 3` is `3 + 3 + 3 + 3`, so `6 + 4 · 3` is 6 and four
  threes. The repeated sum is written out for a first factor up to 5, otherwise shortened with "…".
- **The typical mistake keeps brackets.** "Strictly left to right" is about `·`/`:` before `+`/`−`; a pupil who sees
  brackets uses them. The mistake is a second parse with one rank; it can get stuck where the right order does not
  (`2 + 6 : 3` → `8 : 3`), which the card says. When it gives the same order (the curriculum's own example, `24 : 4 · 2`)
  the card says the expression does not show the mistake and suggests `6 + 4 · 3`.
- **Moving the brackets** is a row of chips in the stage, not the panel: the class should see the brackets move, and
  the panel had no room under six presets and the field. One pair in every place for 2–4 numbers (rule 7); refused
  choices stay visible, struck and dashed, with the failing operation as their reason. A chip keeps the demo at its end
  when it is at its end, so results can be compared click by click.
- **Whole numbers only, up to 99 999** (rule 4): grade 3 and 4 work in the natural numbers and the curriculum warns
  against big numbers here ("ne treba pretjerivati s velikim brojevima"). Typed numbers have at most 4 digits. An
  expression that needs a remainder or goes below zero is refused in the field with the operation that fails. Values
  from 10 000 are grouped (hr narrow space, en comma).
- **The expression in the URL:** the kit carries only its control params, and a text param has no control type, so
  the page writes `?expr=` itself (only when it differs from the preset's or the default), reads it after mount and
  re-applies `?step=`. The kit's own URL writer keeps unknown keys, so the language switch (a reload) keeps it.
- **Signs typed several ways:** `*`, `x`, `×`, `⋅` for `·`; `/`, `÷` for `:`; `-`, `–` for `−`. The field shows the
  canonical form once the text works; leading zeros are dropped.
- **Audiences** (shared switch): teacher (default; captions name the rule and the other order, the mistake toggle),
  adult (adds why each rule makes sense and the expression after each step), child (bigger written form and tree,
  symbols only in the rules box, one short caption, no tree heading, no mistake).
- **Base 10 only** (the row does not say "any base"); **no glossary terms**, as in the sibling `ari-` pages.
- **Presets:** `brackets` (default, the curriculum's 543 − (423 + 28)), `no-brackets` (the same without), `times-first`
  6 + 4 · 3 with the mistake, `same-rank` 24 : 4 · 2, `two-brackets` (36 + 14) : (12 − 7), `everything`
  100 − (12 + 8) · 4 + 30 : 5 with the mistake (the `sim.json` entry; the gate's screenshot preset 2 is `no-brackets`).

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- The catalogue says "a tree of the expression"; Croatian grade 3–4 textbooks do not draw expression trees as far as I
  know *(check)*. The page calls it "stablo računa" and puts the tree under the written expression, so it reads as a
  picture of the order rather than a new notation.
- Only round brackets; nested brackets and two pairs are accepted when typed (preset 5 has two pairs) but the chips
  move one pair. Square brackets are not grade 3–4.

## Sources

- The curriculum, Narodne novine 7/2019 (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html), fetched and
  read 2026-11-14 for this task: **MAT OŠ A.3.5** "Izvodi više računskih operacija."; razrada "Određuje vrijednosti
  izraza sa zagradama.", "Određuje vrijednosti izraza s više računskih operacija.", "Rješava zadatke s više računskih
  operacija i sa zagradama."; sadržaj "Izvođenje više računskih operacija (sa zagradama i bez zagrada)."; preporuka
  "Postupno uvoditi učenike u rješavanje zadataka u kojima se pojavljuju zagrade i više računskih operacija."
  **MAT OŠ A.4.4** razrada "Izvodi više računskih operacija.", "Rješava problemske zadatke sa uporabom i bez uporabe
  zagrada.", "Procjenjuje rezultat."; preporuka "U zadatcima s više računskih operacija ne treba pretjerivati s
  velikim brojevima jer težište je na redoslijedu izvođenja računskih operacija. … Dobro bi bilo odabirati primjere
  zadataka u kojima se pojavljuju zagrade, a u kojima zagrade mijenjaju rezultat. Na primjer, u zadatku 543 – (423 +
  28) primjena zagrada zaista mijenja rezultat u odnosu na zadatak u kojemu bismo zagradu izostavili."
- Croatian textbooks for grades 3–4 were not available offline. From general knowledge of Croatian school practice,
  all *(check)*: the rule as said in class ("prvo se računa u zagradi, zatim množenje i dijeljenje, a onda zbrajanje
  i oduzimanje, redom kako su napisani"); "ravnopravne računske operacije" for operations of equal rank; "brojevni
  izraz" and "vrijednost izraza"; the chain written on one line with `=` between the parts; `4 · 3` read as
  `3 + 3 + 3 + 3` (four threes: the first factor counts the addends).
- Sibling pages: `ari-remainder` (the audience switch and caption pattern on a stepper without K5),
  `ari-column-addition` (a typed field that sets params), `ari-distributive` (the dot sign, U+00B7).

## Checks

- Numbers: a Python script independent of `sim.js` (Python's own precedence with `//`, and a separate left-to-right
  evaluator that keeps brackets and stops at a remainder or below zero) computed every preset, the bracket choices and
  the mistake results: 92, 148, 18 (30), 12, 10, 26 (70), 126 without brackets, 36 + 14 : 12 − 7 not whole. All agree
  with SPEC.md and the tests.
- Tests: 26 (`node --test sims/ari-order-of-operations/sim.test.js`), tie-breaks first (two brackets, : then ·,
  − then +, nested), one block per rule, the presets, and 400 random expressions (both parses) checking that every
  pick is ready and the value equals JavaScript's own precedence. 11 mutations of `sim.js` (rightmost bracket, no rank,
  right to left, outermost bracket, negatives allowed, remainders allowed, one step per operation, the "same" flag,
  a pair around all numbers, a mistake that ignores brackets, the other order without the same-rank guard): each fails
  at least one test.
- `npm run gate -- ari-order-of-operations`: pass. Other states were screenshotted with a separate Playwright script:
  preset 6 mid-way and at the end with the mistake card, preset 3 at its first pick, the child view in English, the
  phone (default and preset 6). A flow script typed good and bad expressions, clicked same-order, refused and plain
  bracket chips, reloaded a copied `?expr=…&step=…` URL, switched the language and reset: no console errors.

## Term pairs (not in the glossary; written out in both tables)

| en | hr |
|---|---|
| order of operations | redoslijed računskih operacija |
| expression, value of the expression | izraz, vrijednost izraza |
| expression tree | stablo računa *(check)* |
| operations of equal rank | ravnopravne računske operacije *(check)* |
| bracket(s) | zagrada, zagrade |

## Shared requests

- **Kit, text params:** the kit has no control type for a text param, so a page with a typed expression keeps it out
  of the kit's URL and writes `?expr=` itself (this page and, with hidden ranges, `ari-column-addition`). A
  `{ type: 'text', visible: false }` param that the kit only carries in the URL would remove the page code.
- **Kit, `h()` and custom properties:** `style: { '--U': … }` is kebab-cased to `---u`, so upper-case custom property
  names silently do nothing. Smallest fix: leave names that start with `--` as they are. This page uses lower-case
  names.
- **Kit, hidden controls:** as `ari-remainder` notes, `.sd-ctl[hidden] { display: none; }` is carried in the page CSS.
- **Promotion:** none needed. `parse`/`planOf` are pure and could serve a later "estimate the result" page (A.4.4)
  or an expression page in a programming course.

## Fresh review

A reviewer with no part in the build read the code against SPEC.md and fuzzed the model with over 200 000 random
expressions (nested and double brackets, zeros, up to 7 numbers) against its own reducer: order, values, stuck points,
the flat (mistake) plan and every written line matched. It also dumped every caption of every preset in every audience
and both languages. No console errors. Found and fixed:

- Two found mid-review, already fixed by then: a refused bracket chip's reason lost its numbers ("  :  ne ide bez
  ostatka"), so the model now carries the failing operation (test added). With two bracket pairs (preset 5), the current
  expression was not among the chips, so it now leads them, pressed.
- "Even though + stands to the left" named a sign inside a bracket that was already done (preset 6, step 3: the sign
  passed over is −). The sign is now looked up in the line as it now stands.
- Too big (over 99 999) was described as "no result in the whole numbers". Every "cannot be done" caption now gives the
  operation and its reason (below zero, a remainder, by zero, too big), and the model hands the failing operation
  through `withoutBrackets` and `otherOrderOf` (tests added). "u prirodnim brojevima" is gone from the captions (0 is
  allowed, which school does not count as a natural number).
- `0 · 3` was "short for 3": a repeated sum is shown only for a first factor of 2 to 5.
- "Of the two brackets" with three brackets waiting: now "of the brackets waiting".
- "jedan od 2 jednakih dijelova" (ungrammatical, and odd for : 1): the adult reason for division is now "how many times
  b goes into a" (dividing as measuring).
- Smaller: a hand-typed `?expr=6+4*3` (the + is read as a space) now falls back to the raw text; a no-op edit in the
  field (a space) no longer restarts the demo; `00001` counts as 5 digits typed; the child's last caption keeps the
  operation; hr "Kad bi se prvo izračunalo …".
- Left as is: the "same order" mark on a chip is its tooltip and the start caption, not a visible badge (room in the
  chip row); `—` and `∶` are not accepted as signs.

## Time

Start 2026-11-14 00:13 (brief read), done 00:42: about 30 minutes, the review included (it ran in parallel with the last checks).
