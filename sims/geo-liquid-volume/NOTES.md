<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# geo-liquid-volume: notes

New explorer (task `docs/tasks/w3/geo-liquid-volume.md`, catalogue §4.17, wave 3, MAT OŠ D.3.4, D.4.1; thread
t-0447). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Three modes, in the curriculum's order.** D.3.4's preporuka orders the lesson: first that pouring keeps the
  amount while the height changes, then comparing by pouring, then a chosen vessel as the unit, then the standard
  units. So: `pour` (two vessels, fill, empty, pour both ways), `cup` (a big vessel filled one small vessel at a time,
  counted), `litre` (five 1 l bottles filled by the decilitre). One idea throughout: how much water there is, told
  apart from how high it stands.
- **Honest vessels.** Each vessel is a stack of frustums in cm with a capacity in whole dl, and the drawn shape
  holds within 2 % of it (a test checks), so the levels are computed, not drawn by eye: in a narrower vessel the
  same water really stands higher. Every vessel in a mode is drawn at the same scale (a fixed viewBox in cm), so a
  tall vase against a low bowl looks as it would on the table.
- **Comparing needs full into empty.** The verdict (which holds more) is given only when the first vessel was full
  and the second empty before the pour; otherwise the teacher caption says how to start. Order of the decision:
  something left → the first holds more; room left → the second; else the same (SPEC rule 5). Nothing is ever spilled:
  the rest stays in the first vessel, which is what children see when a jug does not fit into a bottle.
- **The level before the pour** stays as a dashed line in both vessels (teacher, adult), and the caption gives the
  two heights in cm ("20 cm → 8 cm"): the height of the layer the poured water made, and the one it makes (rule 4).
  The pour is animated over 0.65 s (off under reduced motion).
- **Cup counts can end in "a bit".** A pot holds 7 glasses and a bit (more than 7, fewer than 8): the last glass
  keeps what did not fit, drawn and labelled "ostalo". Each unit poured in leaves a dashed, numbered layer in the big
  vessel, and a numbered mark under it. Changing the unit with the big vessel full keeps it full and compares the
  counts (cup 8, glass 4: a bigger measuring vessel fits fewer times). The 1 dl measure is the third unit, the bridge
  to the standard units.
- **Litre bottles are cylinders up to the 1 l mark** with ten dl marks (5 and 10 longer) and an empty shoulder and
  neck above, as a bottle is filled; the reading is written with l and dl, zeros left out (23 dl = 2 l 3 dl).
- **Ask first** (V, the stage's button): amounts and capacities "?" in `pour` (the verdict still shows, since pouring
  answered it), the count "?" and the marks unnumbered in `cup` until the big vessel is full, the reading "?" in
  `litre`.
- **Typical mistakes** (teacher, highlighted): a higher level is more water (every pour that changes the level); the
  taller vessel holds more (`which`); a bigger measuring vessel gives a bigger number (unit change); 1 l = 100 dl
  (a whole litre); 2 l 3 dl = 5 dl (both parts present).
- **Three audiences** through `Simdeck.paperColumns.audience` (the shared stored choice): teacher (capacities in dl
  under the vessels, mistakes, ask first, heights), adult (a "why" sentence per mode), child (big readout, one short
  caption, no layers or dashed lines).
- **Croatian cases.** Vessel names are kept in the nominative; captions use "x → y" and colons ("Vaza → zdjela: …",
  "Šalica: 8 šalica; niska čaša: 4 čaše") and the page capitalises a sentence that starts with a name, so no case
  forms are generated. The small-vessel words come in three forms each (`u_` plural forms, `uw_` after "koliko",
  `ua_` after "ulij jednu").
- **Keys**: P pours to the right, pours in one more small vessel, or adds 1 dl (the main action of each mode); O
  pours to the left; V asks first or shows. All other keys are the kit's.
- **No kit view** (catalogue §4.17 names K5 only for ari-times-ten and ari-big-numbers); SVG with HTML labels at 1 : 1.
- **No glossary terms**, as in the other `ari-` and `geo-` pages.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- ml, hl and fractions of a litre are left out (not in grades 3–4 for liquids); converting in the table of units is
  `geo-units`'s (its `table` mode has l and dl), so this page only reads litre bottles.

## Sources

- The national curriculum for mathematics, Narodne novine 7/2019
  (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html), **read on 2026-11-14** in this session: MAT OŠ
  D.3.4 (razrada, sadržaj and preporuka: "prvo treba osvijestiti da se prelijevanjem iz posude u posudu količina
  tekućine ne mijenja iako se njezin izgled (visina tekućine u posudi) mijenja", then a vessel as the unit, then l
  and dl; "Obujam i zapremnina sinonimi su za volumen"; "litra ima dva znaka: L i l"; estimating) and D.4.1 (the
  same, plus "Računa s mjernim jedinicama … Preračunava mjerne jedinice"). Quoted in SPEC.md.
- Croatian textbooks for grades 3 and 4 were not available offline. **Marked *(check)*:**
  - "mjerica od 1 dl" for the decilitre measure, and "mjerna posuda" for the vessel measured with;
  - "razina" next to "visina" for the water level (the curriculum says "visina tekućine u posudi");
  - the vessels' names and sizes: visoka čaša 4 dl, niska čaša 4 dl, šalica 2 dl, vaza 8 dl, zdjela 9 dl, boca 1 l,
    vrč 16 dl, lonac 3 l (round numbers chosen for the presets, not measured from real ones);
  - the English textbook words: "jug", "low glass", "1 dl measure", "measuring vessel"; British spellings litre,
    decilitre, as in the other pages.
- The misconceptions (higher is more, taller holds more, a bigger unit gives a bigger number, 1 l = 100 dl, adding
  the parts) are the classic ones for this topic (Piaget's conservation task is the first), from general knowledge
  *(check)*; the first is the curriculum's own warning.

## Checks

- Numbers: an independent Python script (no code shared) computed each vessel's drawn volume against its capacity,
  fifteen levels, the three preset pours, the nine cup counts (whole, rest, the most to pour) and seven litre
  readings before the model was written; the same values are in SPEC.md and the tests.
- Tests: `node --test sims/geo-liquid-volume/sim.test.js`, tie-breaks first.
- `npm run gate -- geo-liquid-volume`: pass (49/49 browser checks). Screenshots reviewed at 1920 × 1080 (light, dark,
  grayscale) and 375 × 812 in both languages, plus every preset after its action (pour, eight cups, eight glasses,
  10 dl, 13 dl, 23 dl revealed), the child and adult views, the unit change with a full jug, and English.

## Term pairs (not in the glossary; the pages of this area do not use it)

volumen (obujam, zapremnina) tekućine / liquid volume; posuda / vessel; prelijevati / pour; razina (visina) vode /
water level; mjerna posuda / measuring vessel *(check)*; mjerica / measure *(check)*; litra / litre; decilitar /
decilitre; vrč / jug; procijeniti / estimate.

## Shared requests

- **models/ (coordinator), optional:** `vessels` in `sim.js` (frustum volumes, `level`, `widthAt`, `pour`,
  `measure`, `litres`) is pure and string-free. `geo-units` could take its l and dl from here or the other way round;
  nothing else uses it yet.
- None for the kit.

## Learn tree

Suggested leaf: `arithmetic` › `measuring` › `volume` (catalogue §4.17's outline), next to `geo-units` and
`geo-perimeter-area`. `npm run check` warns "in no leaf yet" until the coordinator places it.

## Fresh review

A separate reviewer session read the code against SPEC.md, recomputed every number of SPEC in Python (all matched),
drove the page headless over 30+ URLs and key and click sequences (no console errors) and ran 25 mutations of
`sim.js` (21 killed). Found and fixed:

- **A partial pour said "just as much as before"** (`overflow`: only 10 of the jug's 16 dl move). When some water
  stays behind or the other vessel already had water, the caption now speaks of the poured amount alone ("prelili smo
  10 dl. Ta voda sada stoji više …"; "dio vode" while asking first).
- **A new big vessel came up already full** when the count was kept and clamped (pot with 8 glasses → bottle); the page
  now empties it (SPEC rule 8).
- **"Napuni" showed as pressed for a full vessel**; it is now unavailable (`aria-disabled`) like "Izlij" at 0.
- **Surviving mutant** `p.fa === undefined` → `== null`: a test for `fa: null` and `fb: null` now pins rule 1. The
  other survivors are equivalent (`v >= cap` → `>`, `done` as `k === kMax`) or below the tests' 0.01 cm tolerance
  (20 bisection steps instead of 60).
- Cosmetic: the cup field's aria label capitalised; a dead `l < 10` condition dropped (SPEC rule 13 with it).

The same reviewer's second, deeper pass (61 mutants, 24 surviving, most equivalent) found, all fixed:

- **A Croatian case error**: "Ulili smo 1 čaša" (and "prima" with the nominative); the counts after "ulili smo" and
  "prima" now take accusative forms (`uacc_`: 1 čašu, 2 čaše, 21 mjericu).
- **The unit-change comparison was hidden while asking first**, though the count is shown once the vessel is full;
  now it shows. The child view gets one short line ("Manja posuda, veći broj.") instead of the adult sentence.
- **"7 dl = 7 dl"** below a litre: the readout is now the amount alone, and the child caption says it is not a litre.
- **Partial pours**: a partial pour that keeps the level got the full-pour wording (now `cPartSame`); "dio vode" is
  said only when water stayed behind ("svu vodu" otherwise).
- **"The taller holds more"** is now also named when the lower vessel wins by keeping water (`overflow`: the 16.8 cm
  jug against the 26 cm bottle).
- Wording: "koliko puta stane" in the explanation; "Druga posuda dala bi drugi broj" (not "šalica") with any unit;
  the legend's "ulivena posuda" (a longer one wrapped the header and made the panel scroll); the unit buttons capitalised; room under the labels on a phone.
- **Test gaps closed**: a 'ba' pour's patch; pouring onto water (the layer, not the level); `fb` clamped to the right
  vessel and missing → 0; the 0.05 cm tolerance on a real case (low glass 8 cm → bottle 7.96 cm, 'same'); the pour
  state's totals, fullness and heights; `done` one unit short. SPEC rule 5 now says that only the "same" fallback
  depends on order.

## Time

Started 05:22 (2026-11-14): curriculum read, design, Python check, SPEC, model and tests, strings, page, gate and
screenshots by 05:34; the fresh review ran alongside, its first fixes and checks took until 05:43, and its second
pass's fixes until 06:00. About 38 minutes, one session.
