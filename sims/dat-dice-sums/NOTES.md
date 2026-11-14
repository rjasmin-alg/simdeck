<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dat-dice-sums: notes

Task `docs/tasks/w3/dat-dice-sums.md`; rules and numbers in `SPEC.md`.

## Decisions

- **Four modes on one page** (panel choice "Što radimo", key M): throw, pairs, race, fair game. Each is one part of
  the catalogue's "student does" (throw and watch the tally grow, see the 36 pairs, play the race to 10, decide whether
  a game is fair) and all four serve the one concept: count the pairs, and the pairs decide. A stepper was not used:
  throwing is open-ended and the teacher picks how many throws.
- **The tally chart is a table, sums down** (Zbroj | Crtice | Puta | Načina), the layout `dat-charts` uses, with
  rows 1 and 13 that stay empty and hatched "nemoguć", so "impossible" is visible next to "possible but rare" (2, 12).
  Tally marks up to 40 per sum (8 groups of five), then a bar with the number: after 1000 throws a sum comes up about
  170 times, and the caption says why the drawing changed. The tally drawing is copied from `dat-charts` (the
  function is page code there, not a model, so nothing to promote).
- **Ordered pairs, two dice that look different**: the first die is filled darker with a thick border, the second
  lighter with a thin one, on the dice, in the grid's headers and in every pair chip, so 1 + 6 and 6 + 1 are visibly
  two pairs. The pairs mode shows the 36 pairs twice: the 6 × 6 grid (first die down, second across, the sum in each
  cell) and the same pairs sorted into columns by their sum, which is the staircase 1 … 6 … 1.
- **Ways, not probabilities.** No fraction notation ("6 od 36 parova", never 6/36 or 1/6), no percentages, no
  expected counts (catalogue §4.17; E.8.1 is where probability becomes a number). Likelihood is compared in the
  curriculum's words: vjerojatniji, manje vjerojatan, najvjerojatniji, plus "jednako vjerojatan" for a sum and its
  mirror (rule 5).
- **Ask first** (`ways` off, V): in throw, race and fair the ways are "?" until shown, so the class predicts first.
  The pairs mode is the counting itself, so it always shows them.
- **The race** is the curriculum's own example 3 with its four questions in the teacher's caption. "Many races"
  (+10 races, up to 100) adds a wins column, because one race cannot show that the race is unfair: 7 wins only about
  4 races in 10, 6 and 8 about 2 each, 1 never (3000-race check, SPEC rule 7). A race always ends within 100 throws
  (11 sums × 9 places + 1), so `rn` is bounded.
- **The fair game** uses the catalogue's dice version of "par – nepar" (odd or even sum, 18 : 18). Ana and Bruno,
  each sum clickable to cycle Ana → Bruno → throw again; changing an owner restarts the score (another game). Two
  presets beyond parity target "more sums means more chance": `unfair` (Ana 5 sums, Bruno 6, yet 24 : 12) and
  `seven` (one sum against four, 6 : 6, fair).
- **Randomness**: the model inlines the kit's mulberry32 (the `ctcss` pattern), so it stands alone in node; a test
  checks it equals `Simdeck.rng`. `throwsFrom(gen, n)` takes any generator (tests feed fixed dice). Each mode has its
  own stream (salt), so throwing in one mode does not change another. The page replaces seed 0 (the default, and
  what a preset leaves) with a seed from the clock and writes it into the URL, so a reload repeats the same throws and
  `?seed=` is repeatable; "Nova bacanja" (N) takes the next seed.
- **Typical mistakes** shown to the teacher (highlighted): all sums equally likely; 1 + 6 and 6 + 1 as one pair; a
  sum that just came up is "due" not to (shown when the last two sums were equal); 7 is sure to lead; impossible taken
  as unlikely; more sums means more chance; 7 always wins the race.
- The audience switch is the shared `Simdeck.paperColumns.audience` (default key), as on the other pages of the area.
- No animation; nothing to switch off under reduced motion.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- The catalogue's "par – nepar" is played with dice (odd or even sum), as the catalogue says. In Croatian children's
  play it is usually a finger game *(check)*; with 1 … 5 fingers each it is **not** fair (13 even : 12 odd), with
  0 … 5 it is (18 : 18). Left out (one concept); worth a preset task if the owner wants it.

## Sources

- The national curriculum for mathematics, Narodne novine 7/2019
  (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html), **read on 2026-11-14** in this session:
  MAT OŠ E.4.2 (razrada, sadržaj, preporuka and its three examples, quoted in SPEC.md), E.2.2 (moguć / nemoguć).
  The race, its questions and "Je li igra pravedna?" are the curriculum's words.
- Croatian textbooks for grade 4 were not available offline. **Marked *(check)*:**
  - "crtice" and "zapis crticama" for the tally (as in `dat-charts`);
  - "jednako vjerojatan" (the curriculum names only vjerojatniji, manje vjerojatan, najvjerojatniji);
  - "način" for one way a sum can come (textbooks may say "mogućnost" or "ishod");
  - "par" for an ordered pair of dice values; "utrka" for the race; "ponovno" for "throw again";
  - "1. kockica / 2. kockica"; the names Ana and Bruno (made up);
  - the English textbook words: "tally chart", "ways", "fair game", "odd or even".
- The misconceptions are the common ones for this topic from general knowledge *(check)*; "possible / impossible"
  follows the curriculum's "Učenici moraju razumjeti razliku između sigurnoga ishoda, mogućega ishoda i nemogućega
  ishoda".

## Checks

- Numbers: an independent Python script (its own mulberry32, no code shared) computed the ways 0 … 14, even / odd /
  less than 13, the 21 unordered pairs, every fair-game split of SPEC rule 8, the first throws of seeds 1 and 42, the
  race winners and lengths over 3000 seeds, and how often 7 leads after 36, 100, 360 and 1000 throws over 2000 seeds,
  before the model was written. The JS model reproduced every number; they are in SPEC.md and the tests.
- Tests: `node --test sims/dat-dice-sums/sim.test.js`, 28 tests, tie-breaks first.
- Mutations: 32 rule breaks in the model (ways, bounds, comparisons, the most likely, events, kinds, leaders and
  their tie, throw order, salts, the race goal, stop and clamp, refusals, verdict and favour, the score, limits, the
  owner cycle and its reset, the next seed, the tally limit, the last throw, defaults, cleaning). All fail a test
  except one equivalent mutant (`s < 1` for `s < 2` in `ways`: a sum of 1 has 0 ways either way). Two survivors of the
  first run (the even event, the races' salt) got tests.
- Gate: `npm run gate -- dat-dice-sums` passes; screenshots at 1920×1080 light, dark, grayscale and 375×812 in hr and
  en reviewed, plus every mode: throw after 12 and 60 throws (7 not leading after 60 is shown honestly), 1000
  throws, the pairs of 7, 4, 1 and even, the race at 0, 30 and the end with 40 races, every fair preset, the child
  and adult views, and the phone layout of pairs, race and fair.

## Term pairs (not in the glossary; the pages of this area do not use it)

kockica / die; zbroj / sum; par / pair *(check)*; način / way *(check)*; događaj / event; siguran, moguć, nemoguć
događaj / certain, possible, impossible event; vjerojatniji / more likely; manje vjerojatan / less likely;
najvjerojatniji / most likely; jednako vjerojatan / as likely *(check)*; paran, neparan / even, odd; pravedna igra /
fair game; crtice / tally marks *(check)*; utrka / race *(check)*.

## Shared requests

None. (The tally drawing is copied from `dat-charts`' page; if a third page needs it, it could become a kit helper.)

## Learn tree

Suggested leaf (catalogue §4.17): `arithmetic` → `data` "Podatci i vjerojatnost" → `chance`.

## Fresh review

A fresh reviewer (no part in the build) read SPEC.md against the model, tests, strings and page and drove the page in
headless Chromium (every mode, audience and language, the keys, the limits, the seed and reload, 1920×1080 and
375×812). No console errors, no sideways scroll; the seed and every refusal behaved. Found and fixed:

1. With 7 tied for the lead the caption said "7 and 8 lead, not 7": own captions for a tie with 7 and a tie without
   it, with the plural verb (vode / lead).
2. "Još 1 bacanja" / "1 more throws": plural forms.
3. "U 1 utrka", "U 101 bacanja": plural forms for "u {n} utrci / utrke / utrka" and "u {n} bacanju / bacanja"; one
   race has its own sentence ("play more races before deciding").
4. "Na kockicama je 4 i 1" → "su".
5. "Others win too" when one player had won every race (3 seeds in 20 000): the sentence now depends on the wins.
6. The comparison line in pairs mode started in lower case.
7. "piše desno" was wrong on the phone (the list is below the grid): "piše uz svaki zbroj".
8. The A / B badges covered digits of 10, 11, 12 in the phone's fair grid: smaller badges, wider cells.
9. The phone race header "cilj" was 11 px: now 12 px (the phone race table stays at 0.85rem to fit 14 columns; the
   16 px floor is checked at 1920×1080, where it holds).
10. SPEC named the tally column "Broj" (now "Puta", as on the page); en "end" → "finish"; "100 races have been
    played"; "s dvjema kockicama".
11. The throw mode asked "and which never?" while the hatched 1 and 13 rows already answered it: the question is now
    only "which most often?"; the empty rows stay as the picture of "impossible".
12. The pairs mode's right panel had no visible heading: added.

Also fixed after the review: "To je 3 načina" → plural forms ("To su 3 načina").

## Time

Started 07:07 (2026-11-14): curriculum read, design, Python check, SPEC, model and tests, page and strings, gate
and screenshots, layout fixes, mutation check, notes, fresh review and its fixes. Done 07:45, about 40 minutes.
