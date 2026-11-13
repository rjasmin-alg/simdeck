<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-checking: notes

New explorer (task `docs/tasks/w3/ari-checking.md`, catalogue §4.16, wave 3), the last page of "Arithmetic on paper",
drawn with kit view **K5, paper columns**. Rules and expected numbers: `SPEC.md`.

## Decisions

- **An explorer with two closed cards.** The page opens on the task ("846 − 378 = 478. Je li točno?") with the estimate
  and the check closed: the class answers first, then the teacher opens the estimate (`E`) and the check (`V`). Presets
  open closed (the kit applies preset params over the defaults). `est` and `chk` are params (URL, language switch) but
  have no panel control: the panel did not fit at 1920×1080 with them, and the cards' own buttons and keys do the job.
- **Presets are a worksheet.** Their labels are the tasks themselves ("846 − 378 = 478", "457 · 36 = 4113"), so the
  class can find the wrong one: five of the six are wrong, two caught by the estimate (3, 4), two only by the check (1,
  5), one right (2), one in base 2 (6).
- **Four operations**, not only the two the concept names: subtraction and division are the concept's examples;
  addition (checked by subtracting) costs nothing, and multiplication's typical place error (rows not shifted) is the
  clearest case of a result off by a place. The check of a product is the division line with its result and remainder
  (`4113:36=114`, the 9 under the dividend's ones); the working is `ari-long-division`'s, said in a line on the card.
- **The estimate rounds each number to its own leading place** ("keep the first digit, round half up"), the simplest
  rule a child can apply. Two additions where that rule fails: a subtraction whose rounded numbers leave 0 or less is
  rounded again, both to one place below the larger leading place (846 − 778 → 850 − 780 = 70); a division rounds the
  divisor and picks a nearby dividend that divides easily (846 : 3 ≈ 900 : 3 = 300), the school's "compatible numbers"
  *(check: the textbooks' exact procedure for estimating a quotient)*.
- **"About the size"** is within √b of the estimate (half a place on a log scale), computed in whole numbers (g² vs b·e²).
  When even the right result is that far from the estimate, the page says the estimate is too rough here instead of
  judging (5 % of random base-10 divisions, mostly quotients near 0 or 1; more in base 2, where rounding to a power of 2
  loses more). Honest, and it shows the estimate's limit; it uses the model's right result, which the student does not
  see.
- **Typical wrong results** (teacher, the "given result" buttons): per operation one slip the estimate does not catch
  and one that usually changes the number of places, each from the sibling pages' typical mistakes: a carry not added
  / the last carry not written; a borrow not paid back / columns not lined up; a carry forgotten / rows not shifted
  (multiplication's "no shift"); once too few (remainder ≥ divisor) / a 0 forgotten (long division's `zero`). A choice
  that does not arise on the numbers is refused with the reason. With the check open the teacher sees how it arises.
- **The division slip** keeps quotient · divisor + remainder = dividend true and breaks only "remainder < divisor": the
  second half of the check is visible (preset 5), the misconception "the check of a division is q · d = a".
- **Numbers are params as quantities** (`a`, `b`, `g`, `r`, and `op`), hidden in the panel, as in the siblings; a base
  change keeps them. The task field reads "846 − 378 = 478", "846 : 3 = 281, 3" (also "r 3", "ostatak 3", "(3)");
  without "=" the given result is the right one.
- **Verdicts are never colour alone:** ✓/✗/≈/? marks with words, a dashed red frame for "netočno", wrong digits struck
  through, the differing places banded with a thick outline.
- **No glossary terms**, as in the siblings: school words (umanjenik, umanjitelj, djeljenik, procjena, provjera) are
  used directly.
- **Model code copied, not shared:** `digitsOf`, `textOf`, `valueOf` from `sims/ari-long-division/sim.js` @ 1160392
  (itself from multiplication and addition; no `ari-` model in `models/` yet, COMMON.md §6). The task's soft dependency
  "reuse long division's model" was not needed beyond that: the check needs only the quotient and remainder (`a / b`),
  not the step plan. The new parts (`estimateOf`, `farOf`, `checkOf`, `wrongOf`, `kindOf`) are pure over plain values and
  promotable.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- Addition and multiplication besides the concept's two examples (above).
- `est`/`chk` have no panel switch (above).

## Sources

- Phrasing and layout: the owner (s-002), the task file and the sibling `ari-` pages. Croatian textbooks for grades 2–4
  and the curriculum (NN 7/2019) were not available offline. From general knowledge of Croatian school practice, all
  *(check)*: "provjera zbrajanja oduzimanjem / oduzimanja zbrajanjem / dijeljenja množenjem", "obrnuta računska
  operacija", "procjena" and "zaokruživanje" with 5 rounding up, rounding to the leading place for an estimate, the
  division check "količnik · djelitelj + ostatak = djeljenik" with "ostatak je manji od djelitelja", writing the
  remainder as "ostatak 3" after the line.
- The typical wrong results are the classic column-arithmetic bugs of the school-arithmetic literature (forgotten
  carry, borrow not paid back, misaligned columns, unshifted partial products, forgotten 0 in the quotient, a quotient
  digit one too small), from general knowledge *(check)*.

## Checks

- Numbers: a Python script independent of `sim.js` computed every SPEC number, the estimate, near/far, the check and
  both wrong results of each operation; then 18 000 random tasks over bases 2–16 compared with `sim.js` (all agree;
  every right result passes the check, every wrong result fails it). Rates in SPEC rule 8 and Wrong results come from
  4000 random tasks per operation and base.
- Tests: 26 (`node --test sims/ari-checking/sim.test.js`), tie-breaks first. 49 mutations of `sim.js` (half up as >,
  roundQuot's half and below-1 rule, the divisor not rounded, the subtraction re-rounding never, from the smaller place
  or the wrong start, the far threshold > or ×b, a 0 near anything, the n-places tie and sign, the add `less`, the mul
  remainder, the div remainder ≤, the remainder not added, `differs` over the shorter number, each wrong result's place
  or condition, `kindOf` ignoring the remainder, the clamps, the limits, every parse refusal, leading zeros, the
  remainder reset, the rough verdict from g, `correct` ignoring the remainder, `minBase`, `fitsIn`'s remainder): 44
  fail at least one test. The 5 survivors are equivalent (rounding a one-digit number to place 0 is the identity;
  roundQuot's place search at an exact power; re-rounding starting one place higher gives the same first positive
  place; a one-digit multiplier's unshifted sum is the right result, refused as "same"; a quotient never starts with 0).
  Nine survived the first run; tests were added for them (25 · 41 carry in the tens row, 1200 − 960, 1 : 2 rounding up,
  8 against 1 in base 4, `0000001 + 1`, `2023 : 4 = 505`, the remainder for sub/mul, `fitsIn` with a 5-digit binary
  remainder, a right quotient with a wrong remainder). After the fresh review: 60 mutations, the same 5 survivors.
- `npm run gate -- ari-checking`: pass (48/48 browser checks). The gate opens the cards closed; the open states were
  checked with a separate Playwright script (no page scroll, no clipped card, no text under 16 px, no sideways scroll on
  the phone) for every preset, three audiences, both languages, base 2 and 16, the limits (999999 + 999999, 9999 · 999,
  999999 : 999), a sum smaller than an addend and the subtraction re-rounding. Screenshots reviewed at 1920×1080 (light,
  dark, grayscale) and 375×812 in both languages.

## Fresh review

A separate reviewer read the folder against SPEC.md, recomputed every SPEC number with its own script (all held),
mutated the model and drove the page in hr/en, three audiences, bases 2/8/16, the limits and typed input. Fixed from
its findings:
- the child view of a product that leaves a remainder said "Dobiješ 457, a ne 457": it now says what is left over;
- "about 10 times" and "a place missed" for any far result (126 against 400 has as many digits; 4113 is 4.9 times below
  20000): the words now count digits ("ima jedno mjesto manje"), say "predaleko, više od pola mjesta" otherwise, and
  never "10 times" (card, caption, explanation, sim.json entry, SPEC);
- the multiplication slip took the ones row first; `ari-column-multiplication` writes the rows from the second
  factor's left digit (the Croatian order): 457 · 36 with a forgotten carry is now 16252 (7 · 3 = 21), not 16412;
- Croatian: "zaokružujem na desetica" → "na stupac desetica"; the clitic in the adult why line; "prešao {b}" → "{b} ili
  više" (5 + 5); the adult caption no longer repeats the card's why line;
- the phone task line was cut (11 squares of 1.8rem in 298 px): 1.68rem squares keep 16 px digits and fit;
- typed input: `⋅` and `.` as times, "281 r3", "ostatak: 3", and a space inside a number now says so (`gap`);
- `numbersOf` clamped to base 16 without a base while the state drew base 10: both use 10;
- test gaps: the `at` of each wrong result, the 0 far case, equal numbers, `780 − 78` aligned, `fitsIn` with g, the
  divisor limit, every remainder word and sign; 60 mutations now, the same 5 equivalent survivors.
Not changed: `?base=1` lands on the slider's minimum (the kit clamps the range), as in the siblings.

## Term pairs (not in the glossary; written out in both tables)

| en | hr |
|---|---|
| check (a result) | provjera |
| inverse operation | obrnuta računska operacija *(check)* |
| estimate | procjena |
| rounding | zaokruživanje |
| addend, sum | pribrojnik, zbroj |
| minuend, subtrahend, difference | umanjenik, umanjitelj, razlika |
| factor, product | faktor, umnožak |
| dividend, divisor, quotient, remainder | djeljenik, djelitelj, količnik, ostatak |

## Shared requests

- **K5 row signs as labels:** the estimate paper uses the sign column for `≈` and `?` to say which row is the estimate
  and which the given result; a short row label (a word, translated) would read better. Same wish as long division's
  "remainder" row label.
- **K5 aside emphasis:** the check's `= 846` / `≠ 846` is the point of the card; the page makes check asides ink and bold
  with its own CSS (`.ck-chk .sd-pc-aside`). An aside `strong` flag in the kit would do it without page CSS.
- **Promotion:** an `ari-` model in `models/` (digitsOf/textOf/valueOf, now copied in five sims), with long division's
  `divideColumns` and this page's `estimateOf`/`checkOf`.
- Still open from the siblings: a text param type and a base control with per-value refusal (the page's `buildQuick`,
  `pickBase`, copied); the kit's `t.parts` returning one node for two placeholders (the page's `tp`).

## Time

Started 01:53, model and script agreement 02:00, SPEC 02:04, first gate pass 02:14, open states and mutation tests
02:16, fresh review 02:17–02:25, review fixes and done 02:30: about 37 minutes, one session.
