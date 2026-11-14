<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-big-numbers: notes

New stepper (task `docs/tasks/w3/ari-big-numbers.md`, catalogue §4.17, wave 3; thread t-0440). Rules and expected
numbers: `SPEC.md`.

## Decisions

- **Three short demos of one idea, in one stepper.** The concept has three faces (counting over the edge, reading by
  classes, comparing from the left), all of them the place-value table of classes of three. The param `mode` picks
  one; its tabs sit on the stage (the projector shows which demo runs; the panel had no room for them at 1920×1080),
  and the param stays for the URL and the L switch. Each demo is 1–10 steps; `sim.json` `steps` is the default demo's
  (99 997 counted on 5 times: 5).
- **Kit view K5 is used, not drawn here** (the task's "uses kit view K5 paper columns once it exists": it exists).
  Seven places M ST DT T S D J in every mode, so the table does not change size between demos.
  - **Count:** one count is the school's written addition (subtraction) of 1, 10, … 100 000: the carry row with a `1`
    over every place that receives a carry, the number before, `+ 1` with its sign, the rule, the new number with the
    digits written in this step marked. Counting back uses the borrowing notation of `ari-column-subtraction`: the
    digits that are rewritten crossed (`x: true`) and their new values in the carry row (`0`, `9`, `10`). The band
    covers the places from the counted one to the place that grew: the chain of carries.
  - **Read:** the digits in one row; from step 1 thick lines between the classes and the class names under them, drawn
    by this page into the K5 grid (`P.layout(spec).gc`), with the class being read highlighted and banded.
  - **Compare:** both numbers by place and a row of marks under them (`=` per equal place, `<` or `>` at the deciding
    place), the place compared in this step banded.
- **The number line** is `numberline.js`, copied unchanged from `sims/ari-constant-difference/numberline.js @
  f2a51d4` (catalogue §5.27), with its four tests. The page draws it in two tiers: the whole line 0 … 1 000 000 with a
  window, and the zoomed stretch below, joined by a trapezoid (an SVG with no text). The stretch per state is the
  model's (`lineOf`, SPEC rules 15–17): counting keeps one stretch for the whole demo with a tick per count and the
  counts as jumps; reading zooms from the whole line to the thousand around the number; comparing zooms tenfold per
  equal place, so the line splits the two numbers exactly when the table does.
- **Number words** are tokens from the model (`wordsOf(n, lang)`: the grammar of each language) and words from
  `strings.js` (`w_*`), so the tests check the grammar without asserting on wording, and every token has a string
  (a test checks it for 0 … 1000 and the thousands forms). Croatian: hundreds one word, tens and ones apart, 1 and 2
  feminine in the thousands class, tisuća / tisuće / tisuća by the kit's Croatian plural rule (a test checks
  `hrForm` equals `kit.pluralIndex('hr')` for 1 … 999), tisuću for a thousands class of exactly 1. English: British
  school usage ("three hundred and forty-five", "thirty thousand and five", hyphenated tens).
- **Numbers are written in classes from 1000 up** (`9 876`, `12 345`; English `9,876`), unlike `ari-times-ten`,
  which groups from five digits: the classes are this page's subject. The read demo's step 0 shows the digits
  ungrouped on purpose.
- **Range:** 0 … 1 000 000 (MAT OŠ A.4.1). A count that would leave it is not done; one more step says where the range
  ends. 0 is allowed (count back to 0, compare 0 with 0, read "nula").
- **Audiences:** teacher (default; numbers and the rule in the caption, the mistake card), adult (each step says why:
  ten of a place make one of the next, a thousand thousands is a million, one unit of a higher place outweighs all
  lower places together), child (big digits, one short sentence, no mistake card). Base 10 only (the row does not say
  "any base").
- **Typical mistakes** (teacher, toggle `mistake`), one per mode: count on, the 10 written in the square (99 999 + 1 →
  999 910); count back, the borrow lost (100 000 − 1000 → 199 000, the "400, 499" pattern); read, classes from the
  left (30 005 read as 300 | 05, tristo tisuća pet); compare, aligned at the left (9 876 > 12 345 "because 9 > 1"). The
  card asks first and answers at the crossing / at the end; when the mistake does not apply it says why and names a
  preset that shows it.
- **Presets:** eight, two columns in the panel (keys 1–8). `sim.json` `entries` lists `read` and `compare`.
- **No glossary terms:** as in the other `ari-` pages, the Croatian school words are used directly; `glossary.js` is
  not linked.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- The mode switch is on the stage, not in the panel (panel height at 1920×1080).
- K5 has no class brackets; the page draws them into the K5 grid (Shared requests).

## Sources

- The national curriculum for mathematics, Narodne novine 7/2019
  (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html), **read on 2026-11-14** in this session: MAT OŠ
  A.3.1 (razrada "Broji, čita, zapisuje (brojkom i brojevnom riječi) i uspoređuje brojeve do 10 000", "Broji po redu
  od zadanoga broja …", preporuka "Postupak uspoređivanja brojeva do 10 000 skratiti određivanjem vrijednosti tisućica
  (potom stotica, desetica, odnosno jedinica)"), A.4.1 ("Broji, čita, piše i uspoređuje brojeve do milijun.",
  "Navodi dekadske jedinice i opisuje njihove odnose.", preporuka "… tablice mjesnih vrijednosti. Posebnu pozornost
  posvetiti brojenju pri prijelazu desettisućice i stotisućice."). No example numbers are given; 345 678 is the
  catalogue's.
- Croatian textbooks for grades 3–4 were not available offline. **Marked *(check)*:**
  - the class names and their abbreviation in the table: **razred jedinica, razred tisuća, razred milijuna** (some
    textbooks may say "razred tisućica"), and the labels under the table (jedinice, tisuće, milijuni);
  - the place abbreviations beyond T: **DT, ST, M** (as in `ari-times-ten`), and the place name "jedinice tisuća" for
    T in the tooltips;
  - **tisuću** for 1000 and in 1021 ("tisuću dvadeset jedan") rather than "jedna tisuća"; "dvadeset jedna tisuća";
    the tens and ones as two words without "i" ("četrdeset pet", the catalogue's own phrasing);
  - the borrowing notation for counting back (the rewritten digits `0`, `9`, `10` above the crossed ones), taken over
    from `ari-column-subtraction`;
  - grouping four-digit numbers with a space (9 876);
  - "prijelaz desettisućice / stotisućice" as captions (the curriculum's words) for 9 999 → 10 000 and 99 999 →
    100 000, and for the same crossings counting back.
- The typical mistakes are the classic ones of the school-arithmetic literature, from general knowledge *(check)*:
  the carry written in the square, the lost borrow when counting back over a round number, grouping from the left,
  comparing first digits regardless of place.
- English words: British school usage *(check: US usage drops "and")*.

## Term pairs

razred jedinica, razred tisuća, razred milijuna / the ones, thousands and millions class *(check)*; desettisućica,
stotisućica / ten thousand, hundred thousand (curriculum); brojevna riječ / number word (curriculum); brojevna crta /
number line; prijenos / carry; posuđivanje / borrowing. Not added to the glossary (the `ari-` pages do not use it).

## Shared requests

- **models/ (coordinator):** promote `numberline.js` (now copied into five sims) to `models/number-line.js`; this
  page uses `minorStep`, `ticks` and `pos`. Promote `digitsOf` / `parseNumber` (here: base 10, 0 allowed) with the
  copies in `ari-place-value` and `ari-times-ten`. `wordsOf` (number words as tokens, hr and en) is promotable as it
  is, should another page need to say numbers aloud.
- **K5 (kit owner), small and optional:** class brackets: a way to group places in threes on the paper (a thicker
  line between classes and a label under each group). This page appends its own elements to the K5 grid at
  `P.layout(spec).gc(k)`; a documented hook would make that safe.

## Checks

- Numbers: a Python script independent of `sim.js` computed every preset's counts, rolled places and carries, the
  words of 26 numbers in both languages, the classes, the left groupings, the compare plans and the number line
  stretches before the model was written; the same values are in SPEC.md and the tests. Two of my own test
  expectations were wrong at first and the script settled them (the borrow of 102 000 back by 1000 is at the third
  count; 99 000 + 1000 written with "10" in the thousands square is 910 000).
- Tests: 36 (`node --test sims/ari-big-numbers/sim.test.js`), tie-breaks first. Mutation run: 46 mutations of `sim.js`
  (the roll loop, carries, both range ends, the end step, back rolling 0s, class width and count, teens, feminine 2,
  the plural 11–14, tisuću, class 000, zero, the English "and" rules, empty place = 0, first difference decides, the
  top place, the verdict and words steps, the stretch bounds and slide, the count padding on both sides, read and
  compare zoom, each mistake's rule and applicability, the param caps, the parser's limit and whitespace, the mistake
  flag from the URL, the step clamp). All are caught except three equivalent mutants (the plural bound 14 vs 15,
  `U ≥ MAX` vs `U > MAX`, the first vs the last carrying count: with at most 10 counts only one count carries).
- **Fresh review** (a separate reviewer session read SPEC.md and the code, checked `wordsOf` in both languages for
  every n from 0 to 1 000 000, `changeOf` over the whole range for every e, 200 000 random comparisons and their
  views, ran 75 mutants and drove every demo × audience × language headless): no model bug. It found, all fixed: the
  English number field rejected its own `99,997` (the page now drops its class separator before parsing); "Milijun!"
  when counting back from a million; count ticks at the multiples of `by` instead of on the counts (rule 15 changed:
  the stretch starts one count before the smallest number); "look at the next place" at the ones; child captions
  starting in lower case; "prazna mjesta" for places holding 0; a start caption announcing a count that does not fit;
  class captions for a one-class number; two wording slips; "; " between numbers in English lists; three test gaps
  (the digits below e in the count-on mistake, compare at the place M, a step past the end).
- `npm run gate -- ari-big-numbers`: pass (64/64 browser checks). Screenshots reviewed at 1920×1080 (light, dark,
  grayscale) and 375×812 in both languages, plus: 99 999 + 1 (teacher, adult en, child), 100 000 − 1000 with the
  mistake card, the million end step with the card, read 345 678 at each step (en too), read 30 005 with the card,
  read 1 000 000 (child), compare 345 678 / 345 687 at each place, 9 876 / 12 345 with the card, 12 345 = 12 345
  (adult), and the phone layout of read and compare.

## Time

Started 2026-11-14 01:13 (CET), done 01:46: about 33 minutes, one session (the fresh review about 8 of them).
