<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# geo-triangles: notes

New stepper (task `docs/tasks/w3/geo-triangles.md`, catalogue §4.17, wave 3, MAT OŠ C.4.2, C.4.4, C.4.5). Rules and
expected numbers: `SPEC.md`. Builds on the squared-paper model of `geo-lines` (catalogue §5.27): `paper.js` is its
copy, and the length in cm and mm is geo-compass's `compass.length`, copied.

## Decisions

- **Stepper, two modes.** The task names the class stepper, and the concept has two halves that each make a short
  demo: `build` (construct ∆ABC from a, b, c in six steps: given, AB, arc around A, arc around B, C where they meet,
  join, the kind) and `kind` (three vertices on squared paper; five steps: the triangle, the sides named, measured,
  sorted by sides, checked for a right angle with the set square, both names). `steps` is a function of the mode
  (6 or 5); `sim.json` `steps` is 6, the default mode's. The mode resets to step 0.
- **Exact decisions.** A triangle is held as its squared sides (whole numbers): by sides, the angle at a vertex (the
  two sides squared against the third: right, acute, obtuse), the right angle, whether three lengths make a triangle,
  and whether the circles meet (k = 4b²c² − (b² + c² − a²)², whose sign agrees with the comparison of the longest side
  with the other two; tested for every a, b, c in 1…9). Floating point is only for drawing and for the "looks
  equilateral" hint.
- **Why vertices on corners in mode `kind`, sides whole in mode `build`.** The curriculum's point "raznostranični i
  jednakokračni trokuti mogu biti ujedno i pravokutni" needs an isosceles right triangle, which has no whole-cm sides
  (√2) but sits on squared-paper corners; an equilateral triangle needs the opposite (no three corners make one;
  tested over a 12 × 12 window). So the drag mode is on corners and shows the isosceles right triangle tilted (the
  curriculum's "u različitim položajima"), and the equilateral one is constructed. The kind mode's caption says so
  when a triangle only looks equilateral (`near-eq`).
- **The circles as half circles while C is looked for** (steps 2–4: "every point b from A"), short arcs through C
  once it is joined (as the books leave a construction). The pencil of the compass is drawn straight up from the
  needle, so the picture does not give C away before step 4. The compass is opened on the ruler (0 at the needle),
  as in geo-compass.
- **No triangle is shown, not only said** (step 5): radius b from A and radius a from B laid along line AB towards
  each other's circle, and the gap between their ends (red, dashed, with its cm); `flat`: the ends meet at one point
  of AB, "C?". The sum is said in cm ("a + b = 5 cm, ali c = 7 cm: nedostaje 2 cm"): addition, no inequality sign.
- **The set square ("geotrokut")** is laid at the right angle, or, when there is none, at the biggest angle, so one
  placement shows that no angle is right; the angle is then named šiljasti or tupi (MAT OŠ C.4.1), never the triangle
  (acute- and obtuse-angled triangles are grade 6).
- **Ticks** mark equal sides (one tick each; only one group can exist).
- **The mode switch is on the stage** ("Vrste trokuta ▸" / "Konstrukcija ▸" in the top box): with eight presets and
  three sliders the panel had no room for it at 1920 × 1080 (the panel check failed by 7 px). The default kind
  triangle (A(5, 2), B(15, 2), C(9, 8)) is what the switch shows; it is not a preset of its own for the same reason.
- **Lengths on the paper** beside the sides at 1920 × 1080; on the phone layout they move to the top box (the paper is
  too small for "b = oko 6 cm 7 mm" beside each side).
- **Three audiences** through `Simdeck.paperColumns.audience` (the shared stored choice). The teacher's top box shows
  the next step's question (ask before pressing →); the named mistake is highlighted in the caption at its step.
- **Reuse**: `paper.js` unchanged from geo-lines (only `sub`, `dot`, `cross` are used; a test of those kept); `length`
  copied from geo-compass @ 3c7b1ca. The triangle part is `logic.tri` in `sim.js`, pure and string-free (Shared
  requests).

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- The triangle inequality is a grade-6 outcome ("Otkriva i obrazlaže postojanje trokuta", C.6.x) but the task's
  concept asks for it; it is shown only as the circles that do not meet and the cm added up, never as a formula.
- Kinds by angles (šiljastokutni, tupokutni) left out: grade 6 (MAT OŠ C.6.2). Only pravokutni or not.
- "Label ∆ABC with sides a, b, c": the labels are drawn by the sim (step 1 of kind, step 5 of build), the class
  names them before the step; there is no typing.

## Sources

- The national curriculum for mathematics, Narodne novine 7/2019
  (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html), **read on 2026-11-14** in this session: MAT OŠ
  C.4.2, C.4.4, C.4.5 (quoted in SPEC.md), C.3.3 (the compass carries a length), and grades 5 and 6 for what is kept
  out (C.5.2 constructs equilateral and isosceles triangles precisely; C.6.2 sorts triangles by angles; grade 6
  "postojanje trokuta").
- Croatian textbooks for grade 4 were not available offline. **Marked *(check)*:**
  - "geotrokut" for the set square (geo-lines, geo-compass and geo-angles say "trokut"; in a sim about triangles that
    word is taken, so this one uses the common name of the school's set square);
  - the construction order (AB = c first, then the arc around A with radius b, then around B with radius a) and the
    phrasing "Otvori šestar na b, ubodi ga u A i opiši luk";
  - the C above AB as the books' choice of the two crossing points, and vertices named anticlockwise;
  - "a = oko 6 cm 7 mm" for a length that is not whole (the books measure to the mm with the ruler);
  - ticks (crtice) for equal sides at grade 4.
- The misconceptions (any three lengths make a triangle; as long as the other two is enough; a right triangle is
  neither isosceles nor scalene; a right angle stands upright; it looks equilateral) are the classic ones for this
  topic; the third is the curriculum's own remark, the others from general knowledge *(check)*.

## Checks

- Numbers: an independent Python script (floating point, angles in degrees by the law of cosines) recomputed every
  preset: C of each construction, the kinds by sides, the right angle (A in `right` and `right-iso`), the angles
  (82.8° the biggest in `build`, 60° in `equi`), `long` (sum 5, gap 2, no meeting), `flat` (touch), the squared sides
  of the kind presets (72, 52, 100; 90, 45, 45; 34, 34, 36). All agree with `sim.js` and the tests.
- Tests: `node --test sims/geo-triangles/sim.test.js`, tie-breaks first, then logic.tri, build, kind, presets,
  paper.js, and the generic block.
- `npm run gate -- geo-triangles`: passes. A separate Playwright sweep of 648 URL states (every preset at every step,
  three audiences, two languages, 1920 × 1080 and 375 × 812) gave no console errors, no page or panel scroll at
  1920 × 1080 and nothing sideways at 375 × 812; screenshots of each mode, the phone and the child view were reviewed.

## Term pairs (not in the glossary; written out in both tables)

| hr | en |
|---|---|
| trokut, ∆ABC | triangle, ∆ABC |
| vrh (vrhovi) | vertex (vertices) |
| stranica | side |
| jednakostranični trokut | equilateral triangle |
| jednakokračni trokut | isosceles triangle |
| raznostranični trokut | scalene triangle |
| pravokutni trokut | right-angled triangle |
| pravi, šiljasti, tupi kut | right, acute, obtuse angle |
| šestar, luk | compass, arc |
| geotrokut *(check)* | set square |
| ravnalo | ruler |
| konstrukcija, zadano | construction, given |

## Shared requests

- **Add the triangle to `models/squared-paper.js`** when geo-lines' `paper.js` is promoted (catalogue §5.27):
  `logic.tri` in `sim.js` (`sides2`, `turn`, `bySides`, `equal`, `angleAt`, `rightAt`, `biggest`, `exists`, `apex`,
  `feet`) is pure and string-free, with its own tests ("tri:", "rule 3", "rule 5", "rule 6" and the tie-breaks). It
  uses geo-compass's `compass.length` (copied here as `logic.length`), which that promotion also brings. `apex` is
  the meeting point of two circles that geo-compass's notes asked for.
- The page's `Paper()` helper (a compass, arcs, a ruler, a set square, right-angle marks, ticks) is now copied in
  four geo pages: a candidate for a kit view of school instruments (geo-compass's notes asked the same).

## Tags and learn tree

Topic `arithmetic`, tag `school-geometry` (both in `tags.json`). Suggested leaf (catalogue §4.17): `arithmetic` →
`geometry` "Geometrija" → `triangles`.

## Fresh review

A fresh agent read SPEC.md against the code, the page and the strings, recomputed every preset, ran 93 mutants of
`sim.js` outside the repo (21 survived, 13 of them equivalent) and opened URL states in a browser (dragging keeps the
step and the kind follows; the named mistakes at their steps; no console errors). Found and fixed:

- When a or b is the long side, the two radii of rule 6 lay on one line and one hid the other: b is now drawn just
  above line AB and a just below it, and the gap's label sits on the free side.
- The no-triangle caption said "b and a together are shorter than {L}", false when L is a or b: it now names the other
  two sides; the adult "why" takes the long side too and says what equality means (the third vertex on the side).
- The page's `#simdeck-meta` still named the preset `rightIso` after the rename to kebab-case `right-iso`; SPEC still
  said `nearEq`: both fixed.
- "about … rounded to a millimetre" showed when every length was whole: a sentence of its own for that case.
- On a tie of the biggest angle (equilateral, isosceles with the equal sides longest) the caption said "the biggest
  angle": now "one of the biggest angles" (`bigTie` in the model, tested).
- Croatian: "taj je kut šiljasti" → "to je šiljasti kut"; "Samo točka C (iznad AB)" → "Iznad AB samo je jedna
  točka …" (there are two crossing points); "jednako duge kao treća"; "suprotno od smjera kazaljke na satu"; a
  question of its own when the arcs only touch. Unused strings dropped; the child's top box and caption no longer
  repeat one sentence; the adult view has a "why" for each kind step.
- SPEC: the legend (ticks are explained in the caption), "geotrokut" in the terms, the half circles may run off the
  sheet (the triangle never does).
- Test gaps from the surviving mutants: nearEq only for an isosceles triangle, at exactly 1 cm, and with the base
  longest; every vertex clamped and C's fallback; a flat triangle is not anticlockwise. Each new test fails on its
  mutant.

## Time

Started 03:34 (2026-11-14): curriculum read and the model designed first, then sim.js, the Python check, SPEC, tests,
strings and page, the gate and the screenshots, the fresh review and its fixes; status ready and the gate passing at
04:11. About 37 minutes of wall-clock time, one session.
