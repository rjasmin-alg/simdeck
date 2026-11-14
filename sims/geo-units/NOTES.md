<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# geo-units: notes

New explorer (task `docs/tasks/w3/geo-units.md`, catalogue §4.17, wave 3, MAT OŠ D.3.1, D.3.2, D.4.1; thread
t-0446). Rules and expected numbers: `SPEC.md`.

## Decisions

- **One idea, three modes.** "A unit is an agreed amount and measuring counts how many fit" is shown three ways that
  share no picture, so they are three modes of one explorer: `ruler` (length: lay the unit along the thing and count),
  `balance` (mass: weights are agreed masses, the pans level when the masses are equal), `table` (converting: the
  digits stay in the units' columns). The task's four activities map onto them: zoom the ruler and estimate (ruler),
  weigh (balance), slide digits in the table (table), estimate first (ask first, V, in every mode).
- **The ruler zooms from one 0.** Six things (an ant 5 mm, spread thumb and forefinger 1 dm, a pencil 14 cm, a
  school desk 12 dm, the board 3 m 4 dm, the way to school 1 km) lie from the same 0 above one ruler, so zooming shows
  them against each other and against the marks. The view is 12 · 10^(zoom/8) mm wide (12 mm … 1.2 km in 40 steps;
  the stage's − / + move 4 steps, about ×3, and "Cijeli predmet" fits the chosen thing). The marks are drawn by their
  size on the screen, numbered in the finest unit that has room, with the next unit up boxed (1 dm, 2 dm under a
  ruler numbered in cm), which is the "10 cm = 1 dm" of the concept on the ruler itself. 10 m and 100 m are steps
  of the ruler, never called units; the teacher caption says there is no unit between m and km.
- **Measuring shows the count, then the rest.** The chosen unit is laid along the thing as numbered bands; a unit
  longer than the thing is one dashed band past its end ("does not fit even once"), and units too small to see at the
  zoom are not drawn (the caption says zoom in). The reading is written with the measuring number and the unit sign,
  the rest in smaller units ("1 dm 4 cm"); the best unit (rule 4) is the largest giving a whole number, shown to
  the teacher.
- **A smaller unit gives a bigger number** is said on every change of unit for the same thing (the page remembers the
  last unit: render runs before the caption, so the memory is kept there).
- **Mass is compared and weighed, not converted.** D.3.2's preporuka says the units of mass "neće se preračunavati";
  grade 4 has no mass outcome. So mass is not in the table: the balance shows the relations with weights
  (`kg-dag`: 1 kg against 50 + 20 + 20 + 10 dag) and with things of about a unit's mass (the line under the
  balance: a paper clip about 1 g, a bar of chocolate 10 dag, a bag of flour 1 kg, a car about 1 t). The tonne
  appears only there: no school balance weighs a tonne.
- **The weights** are a 1–2–5 set over g, dag and kg (1 g … 5 kg; 10 dag, 20 dag, 50 dag rather than 100 g …), so
  every mass is written in the units the class knows. One click adds a weight; the chips next to "desno:" take one
  off; "Pokaži kako" (teacher) puts the fewest weights on. At most 30 weights (the 31st button is dashed). The
  weights live in the URL as `w=` (grams, largest first), written by the page as geo-perimeter-area writes `cells=`.
- **The table** holds length (km, m in three places S D J, dm, cm, mm) and liquid volume (l in three places, dl).
  The number is written ending in its unit's column; clicking a unit in the header reads it there: the digits stay
  put, empty columns up to the new unit get a 0 (dashed, `--c2`), and when the new unit is bigger the rest stays in
  its own columns and units (34 dm = 3 m 4 dm; no decimals). It stops at a reading over a million (3 km in mm) and
  holds less than 10 km and less than 1000 l. "Zadano u" (the given unit) is on the stage; the number is the panel's
  slider (1–1000; 1–9 for km, 1–999 for l).
- **Typical mistakes** (teacher, highlighted): a bigger unit gives a bigger number (on a unit change); 1 km = 10 m
  (ruler at metre-scale zooms); bigger is heavier (`big-light`); 1 kg = 10 dag (`kg-dag`); one zero for every
  conversion (3 m = 30 cm, 1 km = 10 m); 3 m 4 dm = 7 dm (the parts added).
- **Three audiences** through `Simdeck.paperColumns.audience` (the shared stored choice): teacher (all of the
  above, the best unit, "Pokaži kako", ask first), adult (a "why" sentence per mode), child (big readout, one short
  caption, fewer weights: 1 g, 5 g, 1 dag, 5 dag, 10 dag, 1 kg).
- **Panel room.** The panel would scroll at 1920 × 1080 with nine presets, the zoom slider and the ask-first toggle
  in every mode, so the zoom is the stage's (− / + / fit, keys + and −) and asking first is the stage's button and
  V; both stay params, so the URL and the presets carry them.
- **No kit view** (catalogue §4.17 names K5 only for ari-times-ten and ari-big-numbers); the balance is SVG with
  HTML labels at 1 : 1, the ruler and the table are HTML.
- **No glossary terms**, as in the other `ari-` and `geo-` pages: the school words are used directly.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- Mass is not converted in the table (see Decisions: the curriculum says so for grade 3; the relations are shown on
  the balance instead).
- Eight presets, not nine: a ninth (the board measured in dm) made the panel scroll; the board is still a thing in
  the ruler, and 3 m 4 dm = 34 dm is the `table-m` preset.
- The ruler's zoom is in steps of 10^(1/8), not "from a kilometre to a millimetre" by named levels, so the class
  sees the marks of one unit appear between those of the next.

## Sources

- The national curriculum for mathematics, Narodne novine 7/2019
  (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html), **read on 2026-11-14** in this session: domain D
  ("Mjerenje je uspoređivanje neke veličine s istovrsnom veličinom koja je dogovorena jedinica mjere"), MAT OŠ D.3.1
  (the five units of length, "u skupu brojeva do 1000", estimating with the optimal unit, the spread thumb and
  forefinger as a decimetre, the kilometre from the neighbourhood, converting as extended content), D.3.2 (g, dag,
  kg, t; different balances; "(ne)jednake veličine predmeta ne moraju istim omjerom pratiti i masu"; "neće se
  preračunavati"; relations with things of unit mass), D.4.1 (l and dl, "Preračunava mjerne jedinice", "litra ima
  dva znaka: L i l"). Quoted in SPEC.md.
- Croatian textbooks for grades 3 and 4 were not available offline. **Marked *(check)*:**
  - "tablica mjernih jedinica" for the table of units, and its layout (m in three places S D J; the given row and
    the read row); a book may draw only m dm cm mm, or put km separately;
  - "mjerni broj" (the curriculum's "mjernim brojem i znakom mjerne jedinice" confirms it in the razrada; the
    page does not use the word);
  - "vaga s dvije zdjelice", "zdjelica", "uteg", and the 1–2–5 weight set in dag;
  - the masses of the things: a paper clip about 1 g, an apple 15 dag, a bar of chocolate 10 dag, a pillow 30 dag,
    a stone 80 dag, a school bag 2 kg 35 dag, a car about 1 t; and the lengths: an ant 5 mm, a school desk 12 dm,
    the board 3 m 4 dm, the way to school 1 km;
  - "1 {u} stane {n} puta" as the counting phrase, "najprikladnija jedinica" for the optimal unit;
  - the English textbook terms: decagram (dag) is kept on the English page because the unit is the subject;
    "tonne", "litre", "decilitre" are British spellings, as in the other pages.
- The misconceptions (a bigger unit gives a bigger number; bigger is heavier; 1 kg = 10 dag; one zero per
  conversion; adding the parts of 3 m 4 dm) are the classic ones for this topic, from general knowledge *(check)*;
  "bigger is heavier" is also the curriculum's own warning (D.3.2).

## Checks

- Numbers: an independent Python script (no code shared) computed the fit zooms, every thing's reading in every
  unit, the best units, the marks at zooms 0, 8, 10, 16, 17, 21, 24, 32, 40, every item's mass and fewest weights,
  the turns of the beam, and sixteen table conversions (including 1 km → mm = 1 000 000, 3 km → mm over a million,
  999 l → dl, 250 cm → m) before the model was written; the same values are in SPEC.md and the tests.
- Tests: 21 (`node --test sims/geo-units/sim.test.js`), tie-breaks first.
- `npm run gate -- geo-units`: pass (49/49 browser checks). Screenshots reviewed at 1920 × 1080 (light, dark,
  grayscale) and 375 × 812 in both languages, plus every preset, the child and adult views, 1 km → m, 3 km → mm,
  a school bag against eight kinds of weight (en), and the balance and the table on a phone.

## Term pairs (not in the glossary; the pages of this area do not use it)

jedinica mjere / unit of measurement; duljina / length; dužina / line segment; masa / mass; vaga s dvije zdjelice /
two-pan balance *(check)*; zdjelica / pan; uteg / weight; volumen (obujam, zapremnina) tekućine / liquid volume;
tablica mjernih jedinica / table of units *(check)*; preračunati / convert; procijeniti / estimate; dekagram /
decagram; tona / tonne.

## Shared requests

- **models/ (coordinator), optional:** `units` in `sim.js` (sizes, `mixed`, `measure`, `reading`, `best`,
  `table`) is pure and string-free; `geo-liquid-volume` (l and dl, measuring with a cup as the unit) could share it.
- None for the kit.

## Learn tree

Suggested leaf: `arithmetic` › `measuring` › `units` (catalogue §4.17's outline), next to `geo-perimeter-area`.
`npm run check` warns "in no leaf yet" until the coordinator places it.

## Fresh review

A separate reviewer session read the diff against SPEC.md, recomputed every number of SPEC (all matched), drove the
page headless over about 35 URLs (no console errors) and ran 56 mutations of `sim.js`. Found and fixed:

- **The zoom buttons and keys were inverted** (a bigger zoom is a wider view, and + widened it); on the `zoom`
  preset + was disabled, so its hint could not be followed. Now + zooms in.
- **The unit-change caption said "a bigger unit" on the way to a smaller one** when the old reading was not whole
  (board m → dm: "Veća jedinica … 3 m 4 dm = 34 dm", the task's own example). Now "Manja jedinica, veći broj".
- **A link naming a thing without a zoom** kept the default zoom (?thing=path showed 21 cm of a 1 km path); the page
  now fits it on load.
- **The table's read row showed leading zeros** in the rest (34 dm → km: "0 0 3 4"), and said "0 km"; now the
  empty km column and a sentence that 1 km does not fit once.
- **km could not be chosen as the target** unless the amount reached a km: the whole table is now shown.
- **The "parts added" mistake fired on every two-part reading** ("99 l 9 dl nije 108 dl"); now only for two one-digit
  parts like 3 m 4 dm.
- **Two preset tooltips gave away hidden answers** (`table-m`, `table-l`); reworded as questions.
- The model's fallback n was 1, not SPEC's 34; wording: "1 km stane jednom" / "fits once", the adult hint said
  "each step" on a page without steps, English "the right side is heavier", "vrećica brašna".
- **Surviving mutations** pinned by new tests: zoom 9's finest mark, the steps to a bigger unit, fewest weights
  needing 2 dag and 2 g, `bigger` for equal sizes, every preset's `hide`, a boolean zoom, which 30 weights are kept.
  A rerun leaves only equivalent mutants (float boundaries no whole zoom reaches, unreachable fallbacks, a 0 weight the
  cleaner drops).

## Time

Started 04:46 (2026-11-14): curriculum read, design, Python check, SPEC, model and tests, strings, page, gate and
screenshots by 05:10; the fresh review ran alongside, and its fixes and the last checks took until 05:18. About
32 minutes, one session.
