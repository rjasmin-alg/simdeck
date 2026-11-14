<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# geo-angles: notes

New explorer (task `docs/tasks/w3/geo-angles.md`, catalogue §4.17, wave 3, MAT OŠ C.4.1). Rules and expected
numbers: `SPEC.md`. Builds on the squared-paper model of `geo-lines` (catalogue §5.27): `paper.js` is its copy.

## Decisions

- **One plane, three modes**, one per sentence of the curriculum's razrada: `Vrsta kuta` (turn arm b, shorter and
  longer arms, the set square laid on arm a), `Točka` (does T belong to kut aVb?), `Ime kuta` (which part of the plane
  is kut aVb?). The concept's other sentence, "the angle is the whole region, not the arc", is in all three: the angle
  is coloured out to the paper's edge, with the small arc drawn as the book draws it.
- **Exact answers.** V and T sit on corners; the arms leave V in one of 32 whole-step directions (|x|, |y| ≤ 3), so
  the kind is the sign of a dot product and "does T belong?" the signs of two cross products: never a pixel
  tolerance. The set of directions is the same after a quarter turn, so a right angle is always reachable, at any
  tilt (the `tilted` preset).
- **Compared with the set square, not measured.** No degrees (grade 5). The set square's right-angle corner sits in V
  with one edge on arm a; b runs inside its corner (acute), on its other edge (right) or outside (obtuse). It is hidden
  while the class is asked, since it gives the answer away.
- **The arms' lengths are not the angle**: "Kraći krakovi" / "Dulji krakovi" on the stage, and the ends of the arms
  are dragged; the kind and the class's answer stay. (Two sliders for the lengths made the panel too tall at
  1920 × 1080; the buttons are also easier on a projector.)
- **kut aVb is always less than a straight angle in modes `kind` and `point`**: arm b turns 1…15 of the 32 places
  anticlockwise from a (a slider, "Okreni krak b", or the drag). Grade 4 knows only acute, right and obtuse; a straight
  or a reflex angle would need words it does not have.
- **Naming**: the two rays split the plane in part 1 (the smaller, coloured) and part 2 (the rest, hatched).
  "Zamijeni a i b" swaps the arms' names; kut aVb is then part 2, "more than half a turn", with no kind name (grade 5
  calls it udubljeni). Revealed, a red arrow turns from a to b anticlockwise, and the other part is labelled kut bVa.
  This is the only place the page shows an angle bigger than a straight one; it is needed for the curriculum's
  "pazeći na orijentaciju", which has no meaning when only the small part can be named.
- **The arms and the vertex belong to the angle**, past the arms' drawn ends too (they are rays): revealed in mode
  `point`, the arms go on as dashed rays to the paper's edge.
- **Ask first** in every mode (`hide`, V, the stage's answer buttons), as in geo-lines and geo-compass; the class's
  answer is forgotten when V, the arms' directions, T, the swap or the mode change, not when only the lengths change.
- **Three audiences** through `Simdeck.paperColumns.audience` (the shared stored choice); no kit view.
- **Reuse**: `paper.js` is unchanged from geo-lines (`gcd`, `sub`, `cross`, `dot` are used). Its `directions()`
  gives line directions (pointing right or up), which cannot be an angle's arms, so `sim.js` builds the 32 arm
  directions itself. The angle functions are `logic.angle` in `sim.js`: pure, string-free, for the promotion.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- "Compare angles" (uspoređuje) is done only through the right angle; comparing two angles with each other is left
  out (one concept).
- The arc's radius is 1.5 cm in the model (rule 5's `pastArc`); the page draws it smaller when an arm is shorter than
  2.5 cm, so it stays inside the arms. The point presets use arms of 5 cm, so the two agree there.

## Sources

- The national curriculum for mathematics, Narodne novine 7/2019
  (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html), **read on 2026-11-14** in this session: MAT OŠ
  C.4.1 (title, razrada, dobar, sadržaj and preporuka, quoted in SPEC.md), C.4.5 (vertices, sides and angles of a
  triangle: `geo-triangles`), C.5.1 and D.5.1 (grade 5: kinds from acute to full, measuring: kept out). The page's
  text is a converted copy; the column names (razrada, dobar) were inferred from their position.
- Croatian textbooks for grade 4 were not available offline. **Marked *(check)*:**
  - the right angle's mark as **an arc with a dot** (the page draws it so; some books draw a small square);
  - "trokut" for the set square on the page (the books also say "geotrokut"), as in geo-lines and geo-compass;
  - that **the arms and the vertex belong to the angle** (the usual school definition "kut je dio ravnine omeđen s
    dva polupravca … zajedno s njima"); the curriculum only says "točke koje (ne) pripadaju kutu";
  - "dio 1 / dio 2" for the two parts and "veći od pola okreta" for a reflex angle (the books avoid naming it in
    grade 4);
  - the English terms: "arms" (UK primary textbooks also say "lines" or "rays"), "anticlockwise", "set square".

## Checks

- Every number in SPEC.md's presets table was recomputed with an independent Python script in the session's scratch
  folder (floating-point angles in degrees, sorted by `atan2`, not the model's whole-number rules): the 32 directions
  and their order; kb = 8 is 90° for every da, kb < 8 below, > 8 above; the presets' angles (63.4°, 153.4°, 90°,
  108.4°, 45°, 98.1°, and 261.9° for the swapped name); T(20, 9) in, T(15, 2) on arm a, T(9, 8) out at 0.71 cm from
  arm b's line. All agree with the model and the tests.
- `node --test sims/geo-angles/sim.test.js`: 23 tests, rules first, tie-breaks first of all.
- `npm run gate -- geo-angles`: passes (manifest, tests, build, browser 48/48, tokens, scope); screenshots at
  1920 × 1080 (light, dark, grayscale) and 375 × 812 in both languages reviewed, plus each mode, hidden and revealed,
  wrong answers, the child and adult views.

## Term pairs

kut / angle, vrh / vertex, krak (krakovi) / arm (arms), šiljasti / acute, pravi / right, tupi / obtuse, luk / arc,
trokut / set square, pripada / belongs, suprotno od kretanja kazaljke na satu / anticlockwise, kut aVb / angle aVb.
No `[[term]]` is used (none of these is in `kit/glossary.js`, and the ari- and geo- pages write their school terms
out in both tables).

## Shared requests

- **Promote to `models/squared-paper.js`** together with `paper.js` (catalogue §5.27): `logic.angle` in `sim.js`
  (`DIRS`, `kindOf`, `where`, `belongs`, `dirAt`, `turnTo`, `lenAt`) is pure and string-free and has its own tests
  ("angle:" and the tie-breaks in `sim.test.js`). geo-triangles will need `kindOf` for a triangle's angles (pravokutni
  trokut, C.4.2).
- The page's `Paper()` helper draws a wedge (a part of the plane out past the paper, clipped to the sheet), arcs, a
  set square laid on an arm, a hatched part and an anticlockwise arrow: with geo-compass's compass and ruler, a
  candidate for a kit view of school instruments.

## Learn tree

Suggested leaf (catalogue §4.17): `arithmetic` → `geometry` "Geometrija" → `angles`.

## Fresh review

A fresh agent read SPEC.md against the code, the page and the strings, ran 79 mutants of `sim.js` (outside the
repo; 20 survived, 9 of them equivalent) and opened 25 URL states in a browser (no console errors; the hidden states
show nothing of the answer in the top box, the caption, the aria-label, the right-angle dot, the set square or the
colouring). Found and fixed:

- **The answer leaked while asked**: the "Okreni krak b" slider's thumb sits in the middle for a right angle. It is
  hidden while the class is asked about the kind.
- With the set square switched off, the caption and the named mistakes still spoke of it: the set square is now drawn
  once the class has answered the kind (it decides), and without an answer the caption says the kind plainly and
  asks to switch the set square on.
- The drawn arc (smaller for short arms) and the model's `pastArc` (always 1.5 cm) disagreed: the radius is now the
  model's (`s.arc`), and the page draws that.
- `arcOnly` was named for a point inside the arc; it now needs T past the arc, and a point between the arms inside
  the arc answered no gets `between`. The `otherPart` text is general now (near an arm or the vertex).
- Labels: the part's name under or over its number so it stays on the paper; the label search tries other places in
  the part when the bisector leaves the paper; "trokut" sits inside the set square; "kut aVb" in mode `kind` past the
  set square. A vertex in a corner of the paper can still crowd part 2's number next to V (part 2 is then almost all
  off the paper).
- SPEC's preset names now match the strings; `initial` takes its fallbacks from `logic.defaults`.
- Test gaps from the surviving mutants: a bigger angle with only one side test true, the defaults of lb and T, the
  clamps of T, `square` null / 0, the arc for short arms, and every preset's V, arms and T against the SPEC table.
  Five of the fixes broken again by hand afterwards: each fails a test now.
- Phone (375 × 812): the paper is small and V, the arc and the labels crowd it; it does not scroll sideways and every
  control works.

## Time

Started 03:05 (2026-11-14): the curriculum read and the model designed first, then sim.js, the independent check,
SPEC, tests, strings and page, the gate and the screenshots, the fresh review and its fixes; status ready and the gate
passing at 03:28. About 23 minutes of wall-clock time, one session.
