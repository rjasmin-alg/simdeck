<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-column-subtraction: notes

New stepper (task `docs/tasks/w3/ari-column-subtraction.md`, catalogue §4.16, wave 3), the second column page of
"Arithmetic on paper" and the first consumer of kit view **K5, paper columns** after the pilot. Rules and expected
numbers: `SPEC.md`.

## Decisions

- **Both methods on the page, neither called "the Croatian school method".** The task asks for both side by side;
  the catalogue (§4.16) and the coordinator's reply to s-002 keep the claim that Croatian schools teach equal additions
  off the pages until the owner confirms it. So the page shows equal additions as a method with a neutral name
  (*jednaki dodaci*), and nothing on it says which method schools use. The child's spoken step for equal additions is
  the counting-up phrasing the coordinator quoted ("8 i koliko je 13? 5. Pišem 5, pamtim 1.") *(check)*. If the owner
  confirms, only strings change (e.g. a line in the explanation, or swapping the papers so the school method is on
  the left).
- **Kit view K5** draws both papers (`Simdeck.paperColumns`), with the same `cols`, `signs` and row count so their
  squares line up (docs/sim-ui.md §14, as sketched there for this page). Borrowing writes each rewrite of a top digit
  in a borrow row above it and crosses the old one (`x: true`, ink); a second rewrite goes one row higher, so a 0
  that passes a borrow on reads 0 → 10 → 9 upwards. Equal additions writes no new digits: the top digit gets the
  kit's corner `tag: '1'` (3 reads 13) and the next digit taken away `tag: '+1'`. A `+1` where the number taken away
  has no digit sits on an empty square (cell text `' '`, the kit draws a tag only on a non-empty cell).
- **Rewritten values are numerals of the base** (thirteen ones in base 10 is `13`, sixteen ones in base 16 is `10`):
  the same as the equal-additions tag, which reads as a leading 1 in any base. Captions give the decimal value in
  parentheses when it differs (`19 (25)`).
- **Two steps per column**: *look* (compare, and make the borrow or the equal addition on both papers) and *write*
  (the difference digit, the same on both). The whole borrow chain across zeros happens in one look step (1000 − 1:
  the thousands lend, two zeros go 0 → 10 → 9, the ones 0 → 10); the caption walks through it. Step count = 2 × the
  digits of the top number, at most 18; `sim.json` `steps` is the default's 6.
- **The why box** (teacher and adult) is the "both keep the difference unchanged" part: borrowing keeps the minuend
  (its current digits times their place values add up to it at every step, tested), equal additions grows both
  numbers by the same amount (Σ baseᵏ⁺¹ over the columns that got the base). Written in quantities (decimal), with a
  note when the base is not 10; the school place letters (J, D, S…) in base 10.
- **Leading zeros of the result are not written** (103 − 98 = 5, 1000 − 1 = 999): a leading 0 is computed and said in
  the caption ("Nulu ispred broja ne pišemo") but its square stays empty. *(check: whether grade-3 practice writes
  them.)*
- **Numbers are params as quantities** (`a`, `b`), as in `ari-column-addition`: a base change keeps them and rewrites
  their digits. The number taken away may not be larger than the top number: refused when typed (`order`), clamped
  to `b = a` when it comes from a URL. Hidden `range` params keep them in the URL (no text param in the kit).
- **Typical mistakes** (teacher view): `smaller` (the smaller digit from the larger), `forget` (the base added on top,
  nothing taken on the left: the result is too big by exactly Σ baseᵏ⁺¹ over the columns whose top digit is smaller),
  `zero` (borrowing across a 0: the zeros become 9, but the first non-zero digit is not lowered; equal additions has
  no such step, which the card says). The model computes each; the card fills column by column with the papers and
  crosses wrong digits. A mistake that gives the right answer here marks nothing and says why.
- **Audiences:** the kit's switch, same storage key and `?audience=` as the other `ari-` pages. Child: both papers
  only (no why box, no mistake, no base control, base 10 forced as in addition), bigger digits, spoken captions.
  Adult: place-value words ("1 desetica … ovdje to je 10 jedinica"). Teacher: the school step for each method, then
  "Obje pišu 2".
- **Presets** (keys 1–6): 503 − 178 (default; the zero on top), 742 − 347 (a column lends, then borrows), 1000 − 1,
  624 − 358 with the `smaller` mistake, 10010₂ − 111₂, 5A0₁₆ − 1F9₁₆ (the inverse of addition's base-16 preset).
  `sim.json` `entries`: `many-zeros` and `base-2`.
- **Title** shortened in English to "Column subtraction: two methods": the task's "… side by side" wrapped the header
  title onto a second line at 1920×1080 and pushed the panel 16 px into a scroll (gate `one-screen`).
- **No glossary terms**, as in addition: school words (*umanjenik, umanjitelj, razlika, posuđivanje*) are used
  directly; `glossary.js` is not linked.
- **Model code copied, not shared:** `digitsOf`, `textOf`, `valueOf`, `fitsIn`, `minBase` are copied from
  `sims/ari-column-addition/sim.js` @ 7ce9a39 (there is no `ari-` model in `models/` yet; COMMON.md §6). The
  subtraction part (`subtractColumns`, `mistakeOf`) is pure over plain values, ready to move to `models/` with them.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- English title shortened (above). The concept is the catalogue's, shortened to fit 80 characters.
- The typical mistake is in the teacher view only, as in addition.

## Sources

- Phrasing: the owner (s-002, "pišem 7, pamtim 1") and the coordinator's reply to s-002, which quotes the
  equal-additions step "8 i koliko je 15? 7, pišem 7, pamtim 1" as believed school practice *(check)*. The Croatian
  terms *umanjenik, umanjitelj, razlika* are the task file's (and standard); *posuđivanje* and *jednaki dodaci* as
  method names are mine *(check)*. Textbooks and the curriculum (NN 7/2019) were not read: everything about the
  school layout is unchecked.
- The typical mistakes are the classic subtraction bugs of the school-arithmetic literature (smaller from larger;
  borrowing without paying back; a borrow across a zero that stops at the zero), described from general knowledge,
  not from a source read for this task *(check)*.
- The arithmetic (both methods give the same digit in every column; the minuend is unchanged by borrowing; equal
  additions adds Σ baseᵏ⁺¹ to both) is standard and was checked with a script before coding.

## Checks

- Numbers: a Python script (independent of `sim.js`) computed every preset, every mistake value and both methods for
  all a ≤ 300, b ≤ a in bases 2–16 and 3000 random nine-digit pairs per base (both methods give a − b digit for digit;
  a column is rewritten at most twice) before the model was written; the same values are in SPEC.md and the tests.
- Tests: 25 (`node --test sims/ari-column-subtraction/sim.test.js`), tie-breaks first. 22 mutations of `sim.js` (each
  tie-break, the lender not lowered, a zero left at the base, 10 instead of the base, the carried 1 dropped, the +1
  in the wrong column, a digit written in the look step, the order check off, the clamp off, `minBase` off by one,
  each mistake computed wrongly, `same` ignored, the step count): every one failed at least one test.
- `npm run gate -- ari-column-subtraction`: pass (64/64 browser checks). Screenshots reviewed at 1920×1080 (light,
  dark, grayscale) and 375×812 in both languages, plus teacher, adult and child, base 2 and 16, 1000 − 1, a nine-digit
  pair with the `zero` mistake, the `smaller` mistake card.

## Fresh review

A separate reviewer read the folder against SPEC.md and probed the model (all a ≤ 400 in bases 2–16, random nine-digit
pairs, bad URL values, the parser) and the page (every step of six edge inputs × three audiences × hr/en × each
mistake). Every SPEC number held; no model defect. Fixed from its findings: the child caption said "Pišem 0" and then
"Nulu sprijeda ne pišem" for a leading zero (now no "Pišem" there); Croatian accusative after "uzimam/dodajem" ("jednu
stoticu", new `one1…8`, `oneGen` strings); base-10 columns 5 to 9 named in captions as on the paper (desetice tisuća …
stotice milijuna, `u4…8`, `col4…8`, `head4…8`); the mistake card's "try 503 − 178" now points to example 1 in base 10
(it could not be typed in bases 2–8); `whyZero` counts the zeros (plural forms) and names the lender with its column;
`whySmaller` gives decimal values in other bases; SPEC.md's why-box sample matched to the page.
Left as is: a borrow that crosses zeros more than once (100100 − 1001) names only the first lender in `whyZero`,
while "too big by" is the total (true, but the card explains one); a URL with a top number that does not fit in 9
digits of its base opens in the smallest base that fits, silently (the kit's clamp to the base slider's minimum, as
in addition); in base 2 with nine digits the mistake card's squares are small (about 24 px, digits 16 px).

## Term pairs (not in the glossary; written out in both tables)

| en | hr |
|---|---|
| column subtraction | pisano oduzimanje |
| minuend | umanjenik |
| subtrahend | umanjitelj |
| difference | razlika |
| borrowing (decomposition) | posuđivanje *(check)* |
| equal additions | jednaki dodaci *(check)* |

## Shared requests

- **Kit `t.parts`** (`kit/kit.js`): a node that fills two placeholders of one string ("{t} < {d} … {t} postaje
  {nt}") is returned twice, so appending the parts moves it and the first place goes empty. The page wraps it
  (`tp`, clones the second use). Smallest kit change: clone a node already used in the same call.
- **K5 tags on an empty square:** `Simdeck.paperColumns` skips a cell whose text is empty, so a `tag` alone (equal
  additions' `+1` where the number taken away has no digit) needs the text `' '`. A cell `{ text: '', tag: '+1' }`
  could draw the tag.
- **K5 place labels as nodes:** `P.power(b, k)` returns a node; two papers given the same `places` array lose the
  labels on the first (the node moves). The page builds the labels per paper. `paperColumns` could clone node labels.
- Still open from addition: a text param type and a base control with per-value refusal (the page's `buildQuick`,
  `pickBase`, copied from addition).

## Time

Started 00:21, first gate pass 00:36, review fixes and done 00:50: about 30 minutes, one session.
