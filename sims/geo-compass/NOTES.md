<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# geo-compass: notes

New explorer (task `docs/tasks/w3/geo-compass.md`, catalogue §4.17, wave 3, MAT OŠ C.3.3, C.4.3). Rules and expected
numbers: `SPEC.md`. Builds on the squared-paper model of `geo-lines` (catalogue §5.27): `paper.js` is its copy.

## Decisions

- **One plane, three modes.** The concept has three sentences that share one compass: it keeps one distance (the
  circle, the radius), the disc is the circle with its inside and a point is inside, on or outside, and it carries a
  length (the rectangle). They are three modes of one explorer: `Šestar` (open the compass, turn it in twelve
  parts), `Točka` (does T belong to the circle, to the disc?), `Pravokutnik` (the construction in eight steps).
- **Exact answers.** Corners are whole, the radius is a whole number of cm, so "is T on the circle?" compares
  |ST|² with r², two whole numbers: never a pixel tolerance. The near-miss preset (T(17, 7), r 5) is truly 1 mm
  outside (√26 = 5.099 cm).
- **One square is 1 cm** (the ruler's ticks, as in geo-lines). Lengths that are not whole are written "oko 5 cm 1 mm":
  grade 3 knows mm (D.3.1), decimals come later.
- **The compass is opened on the ruler** (mode `circle`, step 0): the ruler lies under the radius with 0 at S and r
  at the pencil, the way the school sets a radius. The radius is therefore a whole number of cm (1–6; 6 just fits
  the paper's height) and S is kept so that the whole circle stays on the paper.
- **Turning in twelfths**, never degrees: each twelfth leaves a mark and (teacher, adult) a thin radius to it, so
  the class sees the same length again and again. The disc is coloured only once the line is closed (an open arc
  bounds nothing; the curriculum asks for the coloured inside: "važno je koristiti se ilustracijama na kojima je
  unutrašnjost kruga obojena"). "Oboji krug" is a button on the stage once the circle is closed (the panel had no
  room for a toggle at 1920 × 1080).
- **Ask first** in mode `point` only (`hide`, V), with Pripada / Ne pripada on the stage, as in geo-lines. The
  question is either "Pripada li T kružnici k?" or "… krugu?" (`ask`), the curriculum's "točke koje (ne)pripadaju
  krugu ili kružnici". The answer shows where T is (inside / on / outside, with |ST| against r) and both belongings.
  While asked, the paper shows only a radius to the right, never the way to T. The class's answer is forgotten when
  S, T, r, the question or the mode change.
- **The comparison is the compass laid towards T**: revealed, the compass stands with its needle in S and its
  pencil on ray ST at r; T is before the pencil, at it, or past it, and the gap is red (with its mm when outside and
  under 1 cm).
- **The construction**: A fixed at (2, 2), p horizontal; the given segments a and b on the right, with their
  lengths; eight steps (given, p and A, take a, mark B, perpendiculars with the set square, take b, mark D and C,
  join). The squares are hidden in this mode: on squared paper one could count the squares, and the point is that the
  compass carries the length. Back / Next on the stage step through it (the step slider is hidden; the URL carries
  `step`). Equal sides make a square: one given segment, and at step 5 the compass "stays open".
- **Three audiences** through `Simdeck.paperColumns.audience` (the shared stored choice); no kit view.
- **Reuse**: `paper.js` is unchanged from geo-lines (its tests are kept in `sim.test.js`). The compass functions are
  `logic.compass` in `sim.js`: pure, string-free, for the promotion (Shared requests). Only `sub` and `dot` of
  paper.js are used today; the copy is kept whole so the promotion replaces it with one include.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- The diameter (promjer) is left out: C.4.3 names kružnica, polumjer and središte only.
- No ruler drawn while joining D and C (step 8): with the compass checking |DC| the drawing was too crowded.
- On the phone (375 × 812) the paper is small and the labels near S crowd it at step 0 of mode `circle`; it does not
  scroll sideways and every control works.

## Sources

- The national curriculum for mathematics, Narodne novine 7/2019
  (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html), **read on 2026-11-14** in this session: MAT OŠ
  C.3.3 and C.4.3 (quoted in SPEC.md), C.3.2 (perpendiculars with the set square), D.3.1 (cm and mm, |AB|), C.4.4
  (rectangle and square "uz manju nesigurnost" in grade 4).
- Croatian textbooks for grades 3 and 4 were not available offline. **Marked *(check)*:**
  - "Otvor šestara" for the compass's opening, and "igla" / "olovka" for its legs;
  - "Ubodi šestar u A" and "presijeci pravac p" as the books' phrasing of the construction;
  - "kružnica k" (a small k as its name) and "|ST|" for the length of ST in grade 4;
  - the construction order (p and A, a with the compass, perpendiculars with the set square, b with the compass,
    join) as the books show it for a rectangle with given sides;
  - "trokut" for the set square (the curriculum's word, as in geo-lines).
- The misconceptions (krug and kružnica confused; the centre counted as a point of the circle; close is on; only
  points straight across are r away; the edge is not part of the disc) are the classic ones for this topic, from
  general knowledge *(check)*.

## Checks

- Numbers: an independent Python script (whole arithmetic, brute force over the paper) recomputed every preset:
  d² 0, 8, 25, 26, 16; inside / on / outside; the belongings; "about 2 cm 8 mm", "about 5 cm 1 mm"; the miss 1 mm;
  the smallest non-zero |d − r| on this paper with r ≤ 6 (0.83 mm, which rounds to 1); B, C, D of both
  constructions and |DC| = a. All agree with `sim.js` and the tests.
- Tests: `node --test sims/geo-compass/sim.test.js`, tie-breaks first, then the compass, the three modes, paper.js
  (copied) and the generic block.
- `npm run gate -- geo-compass`: passes. A separate Playwright sweep of 204 URL states (every mode, preset-like state,
  step, audience and language) gave no console errors and no page or panel scroll at 1920 × 1080, nothing sideways at
  375 × 812; the screenshots of each mode were reviewed.

## Term pairs (not in the glossary; written out in both tables)

| hr | en |
|---|---|
| šestar | compass |
| kružnica | circle |
| krug | disc |
| polumjer | radius |
| središte | centre |
| unutar / na / izvan kružnice | inside / on / outside the circle |
| pripada / ne pripada | belongs / does not belong |
| otvor šestara *(check)* | compass opening |
| prenošenje dužine | carrying a length |
| pravokutnik, kvadrat, stranica | rectangle, square, side |
| okomica | perpendicular |
| ravnalo, trokut | ruler, set square |

## Shared requests

- **Add the compass to `models/squared-paper.js`** when geo-lines' `paper.js` is promoted (catalogue §5.27):
  `logic.compass` in `sim.js` (`dist2`, `side`, `belongs`, `length`, `missMm`) is pure and string-free and has its
  own tests ("compass:" and the tie-breaks of rules 4–6 in `sim.test.js`). geo-triangles (two circles that meet) will
  need it; it then also needs the meeting points of two circles, which is not here.
- The page's `Paper()` helper now draws a compass (needle, pencil, hinge), arcs and a ruler with numbers, besides
  geo-lines' set square and right-angle mark: a candidate for a kit view of school instruments once geo-angles and
  geo-triangles need the same.

## Learn tree

Suggested leaf (catalogue §4.17): `arithmetic` → `geometry` "Geometrija" → `circle`.

## Fresh review

A fresh agent read SPEC.md against the code, the page and the strings, ran 95 mutants of `sim.js` (outside the
repo; 33 survived, 4 of them equivalent) and opened URL states in a browser (no console errors, no scroll; the hidden
states show nothing of the answer on the stage, in the caption or the aria-label; the class's answers judged right;
dragging, Back / Next and "Oboji krug" work). Found and fixed:

- The paper changed size when the answer row appeared, so a drag after an answer landed a square off: in mode
  `point` the buttons and the answers now have a row of their own of one height, and the caption keeps room for
  three lines. In the teacher view (the default) the paper keeps its size in both languages; the adult view's
  longer captions can still change it by a line.
- "12 dijelova kruga" (krug for a turn, in the sim that separates krug and kružnica) → "punog okreta".
- The named mistakes stated the right fact after "Česta pogreška:"; each now names the wrong thought ("misliti
  da …") and then the fact. Two wrong answers had no named mistake (asked about the disc: inside answered no,
  outside answered yes); both added.
- A square's sides were labelled a and b; both are a. The compass's hinge left the paper for a big rectangle; it
  turns to the other side then. A circle touching the edge of the sheet was cut; the view has a small margin now.
  With T on S a drag moved S; T wins now.
- SPEC: the ruler at step 8, the red gap's mm, the named mistakes; a wrong rule number in a comment; Croatian word
  order ("udaljena je {r} od S", "čine krug", "kružnicu čine").
- Test gaps from the surviving mutants: the arcs, points, set square, ruler and `last` at the neighbouring steps;
  the opening at every step; `a === b` only for a square; `missMm` rounding; the clamps of a and b and their
  defaults; `cornerAt` half up on y; the default S; every preset and the defaults against the SPEC table. Three of
  them broken again by hand afterwards: each fails now.

## Time

Started 02:33 (2026-11-14): curriculum read and the model designed first, then sim.js, SPEC, tests, strings and page,
the gate and the screenshots, the fresh review and its fixes; status ready and the gate passing at 02:58. About
25 minutes of wall-clock time, one session.
