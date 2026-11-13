<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-long-division: notes

New stepper (task `docs/tasks/w3/ari-long-division.md`, catalogue §4.16, wave 3), the fourth column page of "Arithmetic
on paper", drawn with kit view **K5, paper columns**. Rules and expected numbers: `SPEC.md`.

## Decisions

- **The Croatian layout**: the line `846:3=282` on one row, one sign or digit per square, the dividend's ones at place
  0 so its place labels stay over it. Under the dividend, **two layouts, both in the curriculum** (resolved in t-0435;
  this was *(check)* "the products are said, not written"): the curriculum (NN 7/2019, MAT OŠ A.3.4 and A.4.3, as
  quoted in the task) introduces written division "na dulji način (s potpisivanjem djelomičnoga umnoška) ili na kraći
  način" and recommends the shorter once pupils can. **Kraći način** (default, as before): only the remainders, each
  ending under the last digit of the number divided, with the next digit brought down beside it (`24`, `06`, `0`); the
  product is said and the subtraction done in the head. **Dulji način**: above each remainder row the partial product,
  a minus and a rule (below).
- **The longer way** (t-0435), drawn with what K5 offers (no kit change): the product is a row of cells right-aligned
  under the number divided (`at: end`), the minus is a plain cell `'−'` in the square left of **the number** (not of
  the product: for `06 − 6` the minus stands left of `06`, so it never sits under a digit, like the sign column of a
  column subtraction), and the rule is the remainder row's `rule: { from, to }` over the number's squares. The paper
  gets one more place square on the left (`cols: n + 1`, unlabelled) for the first minus; K5's sign column was not used
  because it sits left of the whole paper, two squares away from later products. The steps are the same: the `sub` step
  writes the product row and the remainder row together, so the step count (3Q − 1), the state and every existing
  preset's steps are unchanged; the model's `workingOf` gives the rows (tested), the page only draws them. A 0 in the
  quotient writes `−0` (one rule for every digit, as the shorter way writes the unchanged remainder again) *(check:
  whether textbooks skip the `−0` row)*. Teacher caption: "2 · 3 = 6, potpisujem 6 ispod 8; 8 − 6 = 2"; child: "Pišem
  6 ispod 8. 8 manje 6 je 2." *(check)*. The adult view, on the first subtraction, says why the shorter way can leave
  the product out (the subtraction is done in the head; the longer way writes it so the subtraction can be seen).
- **The estimated partial quotient** (t-0435; the curriculum's grade-4 "procjenjuje djelomični količnik"): only for a
  two-digit divisor in base 10. Both numbers are rounded half up to the tens, the divisor's leading place, as the
  task's example (98 : 12 → about 100 : 10 = 10); "round the number to its own leading place" was rejected because
  273 : 34 would become 300 : 30 = 10 instead of the usual 270 : 30 = 9. The first try is the estimate, at most 9 ("10
  is not a digit: try 9"), then down by one while too big, up by one while the remainder is not less than the divisor
  (at most 4 tries, script). In the box the estimate replaces the list of multiples (the question view shows only the
  rounding); the teacher and adult captions add "Procjena: 100 : 10 = 10; probam 9, 8."; the child view has no box and
  its captions are unchanged. One- and three-digit divisors and other bases keep the multiples (three digits are not
  in the curriculum, and rounding to the hundreds needs up to 5 tries). This changes what preset 5 (9876 : 12) shows
  in the box (tries 9 → 8, 3 → 2, 4 → 3) but not its numbers or steps.
- **The mistake card stays in the shorter way** whatever the layout: it is a small second paper, the longer way would
  double its rows, and both mistakes are in the quotient and the remainders, not in the products.
- **Panel fit:** eight presets did not fit at 1920×1080 (1103 px against 926); they sit in two columns (one on a phone),
  and the layout switch shares a row with its label.
- **A remainder of 0 is written** (`06`, `00`, the last `0`) *(check: whether pupils write the 0 before a brought-down
  digit or leave the square empty)*.
- **A 0 in the quotient gets a full cycle of its own** (ask: 1 : 3 = 0, write 0; sub: 0 · 3 = 0, 1 − 0 = 1, write 1;
  bring down 8 → `18`), on a new row like every other digit. A shortcut some teachers may use (bring the next digit down
  on the same row without writing the unchanged remainder again) was not taken: the uniform cycle makes "a step too
  small gives 0 and the work goes on" visible and keeps one rule for every digit *(check)*.
- **Three steps per quotient digit** (how many times / multiply and subtract / bring down), the last without bring
  down: 3Q − 1 steps, 8 for 846 : 3, at most 17. One action per click suits the child view; the catalogue's concept
  names exactly these actions.
- **Limits: dividend ≤ 6 digits, divisor ≤ 3 digits in the base, divisor ≥ 1.** Six quotient digits bound the steps at
  17 (script: the most over all bases) and the paper at 15 × 8 squares. The base-2 quick button is refused for the
  default 846 (10 binary digits), as in the sibling pages; preset 6 is 46 : 5 in base 2. Grade 4 divides by one- and
  two-digit numbers *(check: the curriculum's limits)*, so 3 is more than school needs.
- **The "how many times?" box** (teacher and adult, a switch, on by default; not for the child): the multiples k · d
  for k = 1 … q + 1 (at most base − 1, two columns when there are more than 8), each "fits" ✓ or "too big" ✗ (a mark
  and a word, and the too-big value struck: not colour alone), the chosen one outlined; on a subtraction step the line
  "n − p = r, less than d". At the start and after a bring-down it shows the next question without marks. A q of 0
  adds the row 0 · d = 0. Under it the **invariant** `dividend = divisor · divided + still to divide`: the place-value
  reason each step works, and at the end the check (outlined). Numerals in the current base, one "in base b" note in
  the box head instead of subscripts on every number.
- **Typical mistakes** (teacher view): `zero` (the task's forgotten 0; the working below is the same, only the quotient
  loses its 0s after the first digit) and `dropped` (the remainder left behind, each later number the digit alone:
  846 : 3 → 212), which targets "why the remainder goes with the next digit". The card draws the wrong division with
  the wrong quotient digits struck (compared from the left, as written after `=`), then the wrong result, the failing
  check (`26 · 3 + 0 = 78, not 618`) and why. For `dropped` the card's rows are the remainders left where they were,
  with nothing brought down. A remainder ≥ the divisor (a quotient digit chosen too small) was considered as a third
  mistake and left out: what a pupil writes next is not determined.
- **Audiences:** the kit's switch (same storage key and `?audience=` as the other `ari-` pages). Child: the paper
  only, bigger digits, base 10 forced, the spoken step ("Koliko puta 3 stane u 8? 2 puta. Pišem 2." / "2 puta 3 je 6.
  Od 6 do 8 je 2." / "Spuštam 4.") *(check)*. Adult: each number with its place ("8 stotica : 3 = 2 stotice"), why q
  (q · d fits, (q + 1) · d is too big), the remainder regrouped ("2 stotice = 20 desetica; s 4 desetice to je 24
  desetice"). Teacher: the school step ("8 : 3 = 2, pišem 2"; "2 · 3 = 6, 8 − 6 = 2"; "Spuštam 4: 24.").
- **The final remainder** is the bold last row (kit `kind: 'result'`) and named in the end caption ("846 : 3 = 282" or
  "2023 : 4 = 505, ostatak 3"); nothing is added to the division line *(check: how textbooks write the remainder,
  e.g. "i ostatak 3")*.
- **Empty rows keep the paper's height** with a blank square (`cells: [' ']`): an empty `cells: []` row collapses
  (the kit's grid has implicit rows only up to the last item), so the paper would grow as rows are written. See
  Shared requests.
- **Numbers are params as quantities** (`a`, `b`), hidden `range` params in the URL, as in the siblings; a bad URL
  divisor (0, negative, not a number, Infinity) reads as 1, never 0.
- **No glossary terms**, as in the siblings: school words (*djeljenik, djelitelj, količnik, ostatak*) are used
  directly.
- **Model code copied, not shared:** `digitsOf`, `textOf`, `valueOf` from `sims/ari-column-multiplication/sim.js` @
  c9a582e (itself from `ari-column-addition`; no `ari-` model in `models/` yet, COMMON.md §6). `fitsIn` and `minBase`
  take a limit per number here (6 and 3). The task's soft dependency on multiplication's model is otherwise not
  needed: the products here are one digit times the divisor, said in the caption. The division part
  (`divideColumns`, `invariantOf`, `multiplesOf`, `mistakeOf`) is pure over plain values and promotable;
  `ari-checking` (next) can use `divideColumns` for "quotient · divisor + remainder = dividend".

## Deviations from the task

- t-0435: the task asked to set `sim.json` `updated`; the manifest has no such field (`lib/manifest.mjs`: unknown
  fields are errors), so it was not added. `status` stays `ready`.
- t-0435: the estimate is limited to base 10 (the curriculum's case); the new preset labels are short ("Dulji način s
  procjenom") so two columns fit.

- Task file "Model and presets" was empty; SPEC.md fills it.
- A second typical mistake (`dropped`) next to the task's forgotten 0.
- `related` lists `ari-column-multiplication`, `ari-column-subtraction` and `ari-place-value`; `ari-checking` and
  `arh-twos-complement` do not exist yet.

## Sources

- Two layouts and the estimate (t-0435): the national curriculum for mathematics, Narodne novine 7/2019
  (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html), outcomes MAT OŠ A.3.4 and A.4.3, as quoted in the
  task file (the page was not opened in this session). The rounding rule and the order of tries are general knowledge
  of how the estimate is taught *(check against a grade-4 textbook)*.

- Phrasing and layout: the owner (s-002), the task file and the K5 sketch. Croatian textbooks for grades 3–4 and the
  curriculum (NN 7/2019) were not read (not available offline): the layout (only remainders, the 0 remainder written,
  a new row for a 0 quotient digit), "spuštam", "koliko puta 3 stane u 8", "od 6 do 8 je 2", "ostatak" in the end
  caption are general knowledge of Croatian school practice *(check)*.
- The typical mistakes (a forgotten 0 in the quotient; dividing each digit on its own without the remainder) are the
  classic long-division bugs of the school-arithmetic literature, from general knowledge *(check)*.

## Checks

- Numbers: a Python script independent of `sim.js` computed every preset, every row and step, both mistakes, and
  quotient · d + remainder = dividend, every remainder < d, every number < d · base, no leading 0, for all a <
  min(b⁶, 3000), d < min(b³, 40) and 4000 random pairs per base 2–16 (max steps 17) before the model was written; the
  same values are in SPEC.md and the tests.
- Tests: 22 (`node --test sims/ari-long-division/sim.test.js`), tie-breaks first. 37 mutations of `sim.js` (the first
  number's ≥ as >, g defaulting to 1, Q off by one, q rounded up or one too small, the remainder not carried or
  carried ×10, end not moving, the wrong digit brought down, no bring-down step or one after the last digit, sub before
  ask, the product written for the remainder, a 0 remainder not written, the invariant unshifted or one digit short,
  the box's multiples to q or to the base, "fits" as <, the zero mistake dropping a leading 0 or nothing, the dropped
  mistake's first step, `same` ignoring the remainder, `differs` right-aligned, the limits 7 and 4, a divisor 0 allowed
  or clamped to 0, the ÷ separator, leading zeros counted, `minBase` off by one, the quotient's value in base 10; from the review: `numbersOf` rounding or ignoring the base,
  the zero mistake's first 0 taken from the end, the dropped mistake's next number ×10, the count error's digit check
  ignoring the base): all 37 fail at least one test. Three survived the first run (`same` ignoring the remainder, `differs` right-aligned,
  leading zeros counted); tests were added for them (10010 : 111₂ under `dropped` keeps the quotient and loses the
  remainder; 100000 : 1 under `zero`; `0000846 : 0003`) and the page now uses the model's `differs`.
- `npm run gate -- ari-long-division`: pass (64/64 browser checks). Screenshots reviewed at 1920×1080 (light, dark,
  grayscale) and 375×812 in both languages, plus teacher, adult and child, base 2 and 16, 999999 : 1 (17 steps), FFFFFF
  : FFF, 2 : 3, both mistake cards.

## Fresh review

A separate reviewer read the folder against SPEC.md, recomputed every SPEC number with its own script (all held),
mutated the model and drove the page in hr/en, three audiences, every preset and edge inputs. Fixed from its findings:
- the "how many times?" box clipped its second column of multiples and, with the mistake card open, its last lines
  (the invariant and the final check): the multiples are now wrapping chips with ✓/✗ (a key line under them), and the
  invariant never shrinks;
- `?a=Infinity` (the kit clamps it to the range maximum before the page sees it) gave an 8-digit dividend in base 10,
  23 steps and missing place strings; `?a=999999.6` rounded to 7 digits: `numbersOf` now clamps to the base's limits and
  the page writes the clamped numbers back (tested);
- a `dropped` mistake that keeps the quotient and loses only the remainder read "10₂ instead of 10₂": results now carry
  the remainder when it differs, and the wrong remainder is struck on the card;
- paper digits of 11 px on a phone at 15 squares: the phone square is at least 1.8rem and the paper box scrolls sideways;
- the card's why text was 17 px: now the stage's 20 px;
- the question view listed multiples up to q + 1 (giving the answer away): it lists them to base − 1, unmarked;
- the adult subtraction now gives the product with its unit ("oduzimam 6 stotica"); the explanation's "1 ten is left"
  (nothing is left there; the 1 is brought down) and the refusal caption's repeated "base 2" fixed; the final
  invariant is outlined like the band instead of the "written" yellow, which the legend did not cover; the `dropped`
  card strikes each remainder left behind beside the digit brought down alone.
Tests added for the reviewer's surviving mutants (above).

## Term pairs (not in the glossary; written out in both tables)

| en | hr |
|---|---|
| the longer way / the shorter way (of written division) | dulji način / kraći način |
| partial product (written under the number) | djelomični umnožak (potpisivanje djelomičnoga umnoška) |
| estimating the partial quotient | procjena djelomičnoga količnika |
| long division | pisano dijeljenje |
| dividend | djeljenik |
| divisor | djelitelj |
| quotient | količnik |
| remainder | ostatak |
| bring down | spustiti (spuštam) *(check)* |

## Shared requests

- **K5 empty rows:** docs/sim-ui.md §14's sketch for this page says `{ cells: [] }` "keeps the paper's height", but an
  empty row has no grid item and collapses. The page writes a blank square (`cells: [' ']`). Smallest fix in the kit:
  give the paper `grid-template-rows: repeat(<first + rows − 1>, var(--pc-cell))` instead of relying on implicit rows.
- **K5 row labels / remainder mark:** a way to mark a row as "remainder" (a small label beside it) would let the paper
  name the final remainder without words in the data cells.
- **K5 sign at a place** (t-0435): the longer way writes its minus as a plain cell, because the sign column sits left of
  the whole paper. A row option `signAt: <place>` (the sign drawn in that square, in the sign style) would let any
  page put a sign next to a shifted number. Not needed now: the plain cell reads the same.
- Still open from the siblings: a text param type and a base control with per-value refusal (the page's `buildQuick`,
  `pickBase`, copied); the kit's `t.parts` returning one node for two placeholders (the page's `tp`).

## t-0435 checks (the longer way and the estimate)

- Numbers: a Python script independent of `sim.js` computed the longer way's rows (product, minus place, rule, remainder)
  for 846 : 3, 5517 : 28, 618 : 3, 2023 : 4 and 9876 : 12, and the estimate's tries for every number < 10 · d, d = 10 …
  999 (two-digit: at most 4 tries, 75 : 13; three-digit: 5, 850 : 142, hence two-digit only); preset 8 (5517 : 28 = 197
  r 1, estimates too big, right, too small) was chosen by a search over 4-digit dividends. The values are in SPEC.md
  rules 11–12 and the tests.
- Tests: 29 (7 new: the short layout as before, the long rows of 846 : 3, 5517 : 28, 618 : 3 and 2023 : 4, the layout
  changing no state or step over 200 random divisions in every base, the estimate's applicability, its tries, and the
  exhaustive two-digit check). 20 mutations of the new code (minus at the number's first place, the rule shifted or
  drawn in the short layout, `cols` n, the number's row, `hi` from the number, the product's digits from the remainder,
  rounding down or half down, no cap at 9, "too small" as >, "too big" as ≥, three-digit or one-digit divisors or any
  base estimated, the "is a digit" flag at 9, rounding to the hundreds, the long default, preset 8's divisor): all fail
  a test; the "is a digit" flag survived the first run and got its test.
- Found in the screenshots: the adult caption lost its product ("2 · 3 = .") when the same node was used in the added
  sentence; each sentence now gets fresh nodes.
- `npm run gate -- ari-long-division`: pass. Screenshots reviewed: the gate's set (1920×1080 light, dark, grayscale,
  375×812, hr and en) plus the longer way at steps 2 and 8, 5517 : 28 at steps 1, 3, 7, 8 (hr, en, adult, child),
  9876 : 12 step 1 (shorter way, the estimate with "not a digit"), 999999 : 999 and 999999 : 1 the longer way (13
  rows, 17 steps), 618 : 3 with the mistake card, base 2 the longer way, and the phone.
- Time for t-0435: 22:52–23:45, about 55 minutes.

## Time

Started 01:23, first gate pass 01:33, mutation tests 01:38, fresh review 01:41–01:48, review fixes and done 01:51:
about 28 minutes, one session.
