<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# geo-triangles: SPEC

Task `docs/tasks/w3/geo-triangles.md`, catalogue §4.17. One concept: **a triangle is equilateral, isosceles or
scalene by its sides (jednakostranični, jednakokračni, raznostranični), and right-angled (pravokutni) or not by its
angles, so a right triangle is also isosceles or scalene; from three given sides the compass finds the third vertex
where two circles meet; when one side is as long as the other two together or longer, the circles do not meet and
there is no triangle.**

Class **stepper**. One sheet, two modes, each a short demo of its own: `build` (construct ∆ABC from a, b, c: six
steps, the default, so `sim.json` `steps` is 6) and `kind` (three vertices on the corners of squared paper, dragged
at any step; five steps name, measure and sort the triangle). Every expected number below was recomputed with an
independent Python script (floating point, angles in degrees by the law of cosines, not the model's whole-number
rules; NOTES.md, Checks) and is asserted in `sim.test.js`.

Builds on the **squared-paper model** of `geo-lines` (catalogue §5.27): `paper.js` is its copy, unchanged (`sub`,
`dot`, `cross` are used), and the length in cm and mm is `geo-compass`'s `compass.length`, copied. The triangle part
(`logic.tri` in `sim.js`: squared sides, the kind by sides, the angle at a vertex, the right angle, whether three
lengths make a triangle, where two circles meet, the radii's ends when they do not) is pure and string-free, ready to
be added to `models/squared-paper.js`.

## Sources

- **Curriculum** (Narodne novine 7/2019, read 2026-11-14 in this session):
  - **MAT OŠ C.4.2** "Razlikuje i opisuje trokute prema duljinama stranica te pravokutni trokut." Razrada: sorts
    triangles by the lengths of their sides into equilateral, scalene and isosceles and describes them; "Razlikuje i
    opisuje pravokutni trokut u odnosu na druge trokute."; names the four. Sadržaj: "Vrste trokuta prema duljini
    stranica (jednakostranični, raznostranični, jednakokračni). Pravokutni trokut." Preporuka: "raznostranični i
    jednakokračni trokuti mogu biti ujedno i pravokutni." and "Različite vrste trokuta potrebno je prikazivati i
    prepoznavati u različitim položajima." → mode `kind`, steps 3–5, the presets `right-iso` (tilted) and `right`,
    the named mistakes `rightIso` and `tilted`.
  - **MAT OŠ C.4.4** "Crta i konstruira geometrijske likove." Razrada: "Konstruira jednakostranične, raznostranične i
    jednakokračne trokute." → mode `build`, presets `build`, `equi`, `iso`.
  - **MAT OŠ C.4.5** "Povezuje sve poznate geometrijske oblike." Razrada: labels a triangle's vertices, sides and
    angles and writes it with symbols, e.g. ∆ABC → step 1 of `kind`, step 5 of `build`.
  - **MAT OŠ C.3.3** (geo-compass): the compass carries a length → the compass is opened on the ruler.
  - **MAT OŠ C.4.1** (geo-angles): right, acute and obtuse **angles** (not triangles) → the set square at a vertex.
  - Kept out: triangles sorted by angles into acute- and obtuse-angled (grade 6, MAT OŠ C.6.2 "Klasificira trokute
    s obzirom na mjere kutova"), degrees, the triangle inequality as a formula (grade 6, "Otkriva i obrazlaže
    postojanje trokuta"; here it is only what the circles show, in words and with cm added up), krak and osnovica of
    an isosceles triangle (not named in C.4.2), perimeter (geo-perimeter-area).

## The sheet

Corners (x, y), y upwards; 24 × 12 squares, **one square is 1 cm**. Mode `kind` draws the squares and puts the
vertices on corners; mode `build` hides them (plain paper: the construction must not count squares, as in
geo-compass) and C lands wherever the circles meet.

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `mode` | `build`, `kind` | `build` | which demo (a change resets to step 0) |
| `a, b, c` | whole 1…9 | 5, 4, 6 | (build) the given sides in cm: a = \|BC\|, b = \|CA\|, c = \|AB\| |
| `ax, ay, bx, by, cx, cy` | whole, 0…24 × 0…12 | A(5, 2), B(15, 2), C(9, 8) | (kind) the vertices, dragged |

## Rules

1. **On the sheet** (build): AB lies on y = 2 with the ruler under it; the figure is centred across the sheet: A, B
   and C when there is a triangle, else A, B and the ends of the radii (rule 6). With sides up to 9 cm the triangle
   always fits (its width is at most its longest side, its height at most 9). The half circles of steps 2–4 may run
   off the sheet (a 9 cm arc around a vertex near the edge); the paper cuts them, the triangle is never cut.
2. **Is there a triangle?** (exact, whole cm) The longest side L against the other two together, sum: L < sum →
   a triangle (`yes`); L = sum → `flat`; L > sum → `no`. `gap` = L − sum. Only one side can be as long as the other
   two together or longer (tie-break: two such sides would need a side of 0), so `long` is one name.
3. **Where the circles meet**: A = (0, 0), B = (c, 0); the circle around A with radius b and the circle around B
   with radius a meet at x = (b² + c² − a²) / 2c and y with (2c·y)² = k = 4b²c² − (b² + c² − a²)², a whole number.
   k > 0: two points, mirror images in AB; the construction takes the one **above** AB (tie-break), so A, B, C go
   round anticlockwise as the books label them. k = 0: the circles touch at one point of line AB. k < 0: they do not
   meet. k = (a + b + c)(−a + b + c)(a − b + c)(a + b − c), so k > 0, = 0, < 0 exactly when rule 2 says `yes`,
   `flat`, `no`.
4. **By the sides** (exact: squared lengths, whole numbers): **equilateral** when all three are equal, **isosceles**
   when exactly two are, **scalene** when none. An equilateral triangle is not also called isosceles here
   (tie-break: the books' three kinds are kept apart, C.4.2). The equal sides are marked with one tick each.
5. **By the angles**: the angle at V is **right** when the two sides at V squared add up to the opposite side squared
   (the set square's corner fits it exactly), **acute** when they add up to more, **obtuse** when to less. The triangle
   is **pravokutni** when one angle is right (at most one is). The set square is laid at the right angle; when there
   is none, at the **biggest** angle, the one opposite the longest side (tie-break: the first of A, B, C; `bigTie`
   when another angle is as big, and the caption then says "one of the biggest angles"), and its legs show that this
   angle, so every angle, is not right. Its corner is in V, one leg along the side to the next vertex
   (A → B, B → C, C → A), the other on the triangle's side.
6. **No triangle** (step 5 of build when rule 2 says `no` or `flat`): radius b from A (drawn just above the line) and
   radius a from B (just below it, so neither hides the other where they overlap) are laid along line AB towards each
   other's circle: c too long → b from A to the right and a from B to the left; a too long
   → both to the left of A (b from A, a from B past A); b too long → both to the right of B. Between their ends is the
   gap, L − sum cm; `flat` → the ends meet in one point of AB, where C would lie, so A, B, C are on one line.
7. **Build steps** (0–6): 0 given (the three lengths); 1 AB = c with the ruler; 2 the compass opened to b on the
   ruler, needle in A, an arc (all points b from A); 3 opened to a, needle in B, an arc; 4 where the arcs meet is C
   (`no`: they do not meet; `flat`: they touch on AB); 5 join C to A and B, name the sides a, b, c (`no`/`flat`: rule
   6); 6 the kind by the sides and right or not (rules 4, 5) (`no`/`flat`: the rule in words: each side must be
   shorter than the other two together).
8. **Kind steps** (0–5): 0 the triangle ABC; 1 the sides named, a opposite A, b opposite B, c opposite C; 2 measured
   (whole cm, or "about 6 cm 7 mm", the length rounded to a millimetre); 3 by the sides; 4 right or not, with the set
   square; 5 both names together. Dragging a vertex keeps the step, so the kind follows the drag.
9. **Params are made valid**: unknown mode → `build`; a, b, c rounded and kept within 1…9; vertices rounded and kept
   on the sheet; non-numbers, `''` and null take the default. A drag lands on the nearest corner, rounded half up:
   (3.5, 2.49) → (4, 2).
10. **The named mistakes** (teacher and adult): build, steps 4–6: `no` → `always` (any three lengths make a triangle);
    `flat` → `flatOk` (as long as the other two together is enough). Kind: step 3 and `nearEq` → `looks`; step 4,
    right and the right angle's arms not along the grid lines → `tilted` (a right angle must stand upright); step 5,
    right and isosceles → `rightIso` (a right triangle cannot be isosceles; the curriculum's point).
11. **Not a triangle** (kind, tie-break): three corners on one line, two in one place too (twice the signed area is
    0), make no triangle: nothing is named, measured or sorted, and the caption says so at every step. A triangle
    whose vertices go round clockwise is still ∆ABC (its names stay with the vertices); the caption at step 1 notes
    that the books name them anticlockwise.
12. **Looks equilateral** (`nearEq`, kind): isosceles with the longest and the shortest side less than 1 cm apart.
    On squared paper no three corners make an equilateral triangle (its area would be half a whole number and also
    √3 / 4 of a whole number, which cannot both hold), so the kind mode never shows one; the caption says to construct
    it (mode build).

## Presets (keys 1–8)

| id | mode | what | expected |
|---|---|---|---|
| `build` ("Konstruiraj trokut") | build | a 5, b 4, c 6 | yes; A(9, 2), B(15, 2), C(11.25, 5.307); scalene, not right (biggest angle at C, acute, 82.8°) |
| `equi` ("Jednakostranični") | build | 6, 6, 6 | yes; C(12, 7.196); equilateral, not right (all 60°) |
| `iso` ("Jednakokračni") | build | a 6, b 6, c 4 | yes; C(12, 7.657); isosceles (a = b), not right |
| `right` ("Pravokutni") | build | a 5, b 3, c 4 | yes; C(10, 5) straight above A; scalene and right at A (9 + 16 = 25) |
| `long` ("Predugačka stranica") | build | a 2, b 3, c 7 | no; c too long, b + a = 5 cm, gap 2 cm; ends at x 11.5 and 13.5 |
| `flat` ("Točno koliko druge dvije") | build | a 3, b 4, c 7 | flat; the arcs touch at (12.5, 2) on AB |
| (defaults, the stage's "Vrste trokuta" switch) | kind | A(5, 2), B(15, 2), C(9, 8) | squared sides 72, 52, 100; scalene, not right (biggest at C, acute) |
| `right-iso` ("Pravokutni i jednakokračni") | kind | A(8, 2), B(14, 5), C(5, 8) | 90, 45, 45; isosceles (b = c, about 6 cm 7 mm) and right at A, tilted |
| `near-eq` ("Skoro jednakostranični?") | kind | A(8, 2), B(14, 2), C(11, 7) | 34, 34, 36; isosceles (about 5 cm 8 mm twice, 6 cm), not equilateral |

## Legend and captions

Legend: the triangle's sides (a line), the compass's arcs (a line), the set square (geotrokut); the ticks on equal
sides are explained in the caption of the step that draws them. Colour
is never alone: vertices and sides are named, equal sides carry ticks, the kind is said in words, the gap is a named
length. Captions in three audiences (`Simdeck.paperColumns.audience`): **teacher** (what this step does, the named
mistake highlighted), **adult** (adds a "why": the arc is every point b from A; equal squares are equal sides; the
set square's corner is the right angle; each side must be shorter than the other two together), **child** (one short
sentence).

## Terms (Croatian first)

trokut, vrh (vrhovi), stranica (stranice), ∆ABC, jednakostranični, jednakokračni, raznostranični, pravokutni, pravi
kut, šiljasti, tupi, šestar, luk, ravnalo, geotrokut (the set square; the other geo pages say "trokut", a word taken here), dužina, konstrukcija, zadano; English: triangle,
vertex (vertices), side, equilateral, isosceles, scalene, right-angled (right triangle), right angle, acute, obtuse,
compass, arc, ruler, set square, segment, construction, given.

## Misconceptions targeted

- "Any three lengths make a triangle": `long`; "as long as the other two together is enough": `flat`.
- "A right triangle is neither isosceles nor scalene": `right`, `right-iso`.
- "A right angle stands upright" / kinds only in the book's position: `right-iso` (tilted).
- "It looks equilateral, so it is": `near-eq`.
- "Side a is any side": step 1 (a opposite A).

## Out of scope

Triangles sorted by angles into acute- and obtuse-angled, degrees, the sum of angles, the triangle inequality as a
formula, heights, perimeter and area, krak and osnovica, constructing from other data (two sides and an angle).
