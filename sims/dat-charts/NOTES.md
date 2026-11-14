<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dat-charts: notes

Task `docs/tasks/w3/dat-charts.md`; rules and numbers in `SPEC.md`.

## Decisions

- **Three views side by side, not four.** The tally is the middle column of the table (Voće | Crtice | Broj
  učenika), the layout of a tally table in a lower-grade exercise; the pictogram and the bar chart stand beside it.
  So the concept's four forms (tally, table, pictogram, bar chart) fit one 1920×1080 screen at a readable size, and
  "the same data in every view" is one look from left to right.
- **One count per category, everything computed from it** (SPEC rule 2): there is no second copy of the data that
  could drift. + and − on a table row, or a ballot counted, change that one number; the page redraws all three views.
- **Four data sets.** `fruit` is the class vote, the one with ballots to count ("count votes into a table"); its 20
  ballots are ordered so the lead changes (jabuka after 9, a tie after 11, jagoda at the end). `weather` is E.2.1's
  own example (sunny and rainy days in a month) and the half-picture preset. `books` has counts up to 30, so keys 1
  and 2 do not fit and 5 and 10 do (10 gives halves). `snow` is E.4.1's own example for the axes (os dana, os
  visine snijega u cm); being measured, it has no tally and no "in all" question.
- **Keys 1, 2, 5, 10.** The catalogue names 2 and 5; 10 is added because with whole counts, half of 5 never occurs
  (2 and a half), so halves need an even key: 2 (rest 1) or 10 (rest 5). A key that leaves a rest other than half
  draws a cut picture with a dashed outline and the caption says it cannot be read exactly, naming the keys that do
  read exactly (preset `misfit`). A key fits when the longest row has at most 12 pictures; a key that does not fit is
  refused on the button and moved to the next one that fits when the data grow (rule 5).
- **Questions on top, asked first.** Most, least, how many more, in all. For the teacher a question is asked with
  the answer hidden (V shows it); hiding also hides the numbers in the table, beside the pictogram and on the bars,
  so the class reads the tally, the pictures and the bars. "How many more" compares the first biggest and the first
  smallest in table order (rule 8) and draws the smaller bar's level across with the difference hatched on the
  taller bar.
- **Selection**: a click on a table row, a pictogram row or a bar lights the same category in all three views and
  the caption reads the same number from each (redak, stupac, polje named, E.3.1's "stupac, redak, polje").
- **No fraction notation** (catalogue §4.17): "pola sličice", "3 · 2 + 1 = 7", never ½ or 3,5.
- **Pictures** are plain SVG outlines (a pupil, a calendar day, an open book, a snowflake), not cartoons; one size
  in every row, set by the longest row, so lengths compare honestly.
- The audience switch is the shared `Simdeck.paperColumns.audience` (default key), as on the other pages of the area.
- No animation; nothing to switch off under reduced motion.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- The tally is a column of the table rather than a separate view (above).
- Key 10 added next to 2 and 5 (above).

## Sources

- The national curriculum for mathematics, Narodne novine 7/2019
  (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html), **read on 2026-11-14** in this session:
  MAT OŠ E.3.1 (razrada "Koristi se nazivima redak i stupac. Prikazuje podatke u tablicama i stupčastim
  dijagramima"; preporuka "osvijestiti pojmove: stupac, redak, polje … Posebno se ističe piktogram i stupčasti
  dijagram"), E.4.1 (preporuka "pojam osi … os dana u mjesecu i os visine snijega u centimetrima"), E.2.1 (tables
  and pictograms, "broj sunčanih/kišnih dana u nekome mjesecu"). Quoted in SPEC.md.
- Croatian textbooks for grades 3 and 4 were not available offline. **Marked *(check)*:**
  - "crtice" for tally marks and the tally column's heading "Crtice"; the group of five drawn as four strokes and a
    fifth across them;
  - "sličica" for a pictogram's picture and "Jedna sličica znači …" for its key (textbooks may say "znak" or
    "legenda");
  - "maglovito" as a kind of day; the abbreviations pon., uto., sri., čet., pet.;
  - the English textbook words: "tally", "One picture stands for", "bar" for a stupac of the chart;
  - the data (votes, days, books, snow depths) are made up with round numbers for the presets, not measured.
- The misconceptions (counting the pictures, ignoring or rounding a half picture, "how many more" answered with the
  bigger number, row and column mixed up) are the common ones for this topic, from general knowledge *(check)*; the
  row/column one follows the curriculum's "Važno je učenicima osvijestiti pojmove: stupac, redak, polje".
- "Stupac" has two meanings in Croatian (a table column and a bar of a stupčasti dijagram); the teacher caption on
  a selected row says so.

## Checks

- Numbers: an independent Python script (no code shared) replayed the 20 ballots (after 9: 4 2 2 1; after 11:
  4 2 4 1; after 20: 6 4 8 2) and computed, for every data set, the sum, max, min, difference, the answer rows, the
  axis, which keys fit and the pictures for each key (whole, half or part) before the model was written; the same
  values are in SPEC.md and the tests.
- Tests: `node --test sims/dat-charts/sim.test.js`, 28 tests, tie-breaks first.
- Mutations: 18 rule breaks (tie listing, first max/min, all equal, empty data, the key tie-break and the 12-picture
  limit, half versus part, missing counts, tally fives, measured data, axis bounds, no "in all" for snow, selection
  bounds, the 30 limit, ballots done, the ballot order, ask first, exactness) each fail at least one test.
- Gate: `npm run gate -- dat-charts` passes; screenshots at 1920×1080 light, dark, grayscale and 375×812 in hr and
  en reviewed, plus every preset, a selection, a refused key, a moved key, the child and adult views.

## Term pairs (not in the glossary; the pages of this area do not use it)

tablica / table; redak / row; stupac / column; polje / cell; crtice / tally marks *(check)*; piktogram / pictogram;
sličica / picture *(check)*; stupčasti dijagram / bar chart; stupac dijagrama / bar; os / axis.

## Shared requests

None.

## Learn tree

Suggested leaf (catalogue §4.17): `arithmetic` → `data` "Podatci i vjerojatnost" → `charts`.

## Fresh review

A fresh reviewer (no part in the build) read SPEC.md against the model, tests, strings and page, and broke rules on
purpose in headless Chromium. Found and fixed:

1. A link naming a data set but no counts (`?ds=books`) showed the fruit counts: the kit fills `c0…c6` from the
   defaults. The page now starts such a link from the data set's own counts.
2. A refusal caption stayed after a preset or a question changed nothing in the data: the event signature now
   includes the question, ask first and the selection.
3. With ask first on, + / − and a ballot said a row "is lit" when none was: own captions ("jedan više; broj je
   skriven").
4. The empty-data caption told the weather and the books to count ballots: a ballot-free variant.
5. "Count all" silently dropped ballots at 30: it now stops before such a ballot and says so, like one ballot at a
   time (SPEC rule 11 updated, test added).
6. Ask first on "In all?" leaked the answer through the ballot box ("9 of 20 counted"): hidden too.
7. Switching the data set by hand kept the question: it now clears it.
8. V with no question hid every number with no button to undo it: V does nothing then, and "Show" appears whenever
   something is hidden.

Wording: plural forms for the tally's aria label and "N pictures do not fit"; "{p}, to nije {n}" (not "4 sličice nije
4"); "(jedna sličica = 2 dana)" in the selection caption; a zero-count "least" caption; "Gumb Ispočetka ih vraća";
"3 and a half pictures". Left as is: the "biggest key that fits" branch of rule 5 cannot be reached with counts up to
30 (key 10 always fits); it stays as the rule's last fall-back.

## Time

Started 06:35 (2026-11-14): curriculum read, design, Python check, SPEC, model and tests, strings, page, gate and
screenshots, mutation check, notes, fresh review and its fixes. Done 07:05, about 30 minutes.
