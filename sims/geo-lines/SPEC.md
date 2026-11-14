<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# geo-lines: SPEC

Task `docs/tasks/w3/geo-lines.md`, catalogue §4.17. One concept: **a segment has two ends, a ray one, a line none:
the drawn line is only a picture of a line that goes on without end, so a point beyond the drawn part can still lie
on it; two lines in a plane either meet in one point (sjecište) or are parallel; perpendicular lines meet at a right
angle; parallel lines are drawn by sliding a set square along a ruler.**

Class **explorer** (no steps). One squared-paper plane, three modes: `parts` (a segment, a ray or a line through A
and B, and a point T), `two` (line p through A, line q through T, turned), `slide` (the set square slides along the
ruler to T). Every expected number below was computed with an independent Python script (exact fractions) before
coding (NOTES.md, Checks) and is asserted in `sim.test.js`.

This sim is the **hub of the squared-paper model** (catalogue §5.27): `paper.js` is pure (no DOM, no strings, plain
JSON) and registers as `SimdeckModels['squared-paper']`, so the coordinator can move it to `models/` unchanged.

## Sources

- **Curriculum** (Narodne novine 7/2019, read 2026-11-14 in this session):
  - **MAT OŠ C.3.1** "Opisuje i crta točku, dužinu, polupravac i pravac te njihove odnose." Razrada: "Upoznaje pravac
    kao neograničenu ravnu crtu.", "Crta i označava pravac i polupravac.", "Crta dužinu kao dio pravca i ističe
    njezine krajnje točke.", "Određuje i crta pripadnost točaka pravcu." Sadržaj: "Pravac, polupravac i dužina kao
    dijelovi pravca." Preporuka: "Pojam pravca usvaja se neograničenim (zornim) produljivanjem crte preko krajnjih
    točaka dužine", "Pri upoznavanju pravca jako je bitno naglasiti da se pravac ne može cijeli nacrtati", "točku …
    označavaju samo točkom", and the example task "Pripada li točka T pravcu p?" → mode `parts`, the slider
    "Produlji crtu", the point drawn as a dot, and the preset `beyond` (the curriculum's own question).
  - **MAT OŠ C.3.2** "Prepoznaje i crta pravce u različitim međusobnim odnosima." Razrada: "Crta usporedne pravce i
    pravce koji se sijeku (uključujući okomite). Pravcima koji se sijeku određuje sjecište.", "Primjenjuje
    matematičke oznake za okomitost i usporednost dvaju pravaca." Sadržaj: "Pravci koji se sijeku. Crtanje
    usporednih i okomitih pravaca." Preporuka: "Pri crtanju usporednih i okomitih pravaca moguće je koristiti se
    ravnalom i jednim ili dvama trokutima." → modes `two` and `slide`, the signs ∥ and ⊥.
  - **MAT OŠ C.2.1** (grade 2) "Opisuje dužinu kao najkraću spojnicu dviju točaka.", "Određuje krajnje točke
    dužine.", "Određuje pripadnost točaka dužini." → the segment and its endpoints, known from grade 2.
  - Grade 4 has no lines (C.4.1 is the angle: `geo-angles`); degrees are grade 5 (C.5.1): **no degrees** on the page;
    a right angle is "the corner of a set square".
- The curriculum names the relations with "matematičke oznake" without printing them; ∥ and ⊥ are the usual signs
  *(check)*. Naming lines with small letters (p, q) and points with capitals follows its example "pravac p",
  "točka T".

## The paper

Corners (x, y) with whole numbers, y upwards. The school sheet is 24 × 12 squares (corners 0…24 by 0…12); every point
the student places stays on it (rule 12). The view at zoom z (mode `two` only) is the sheet's centre (12, 6) with z
times the sheet around it: zoom 2 → −12…36 × −6…18, zoom 4 → −36…60 × −18…30. A line's direction is its shortest
whole step (`lineDir`: (4, 2) → (2, 1), pointing right, or up when vertical).

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `mode` | `parts`, `two`, `slide` | `parts` | what is shown |
| `kind` | `segment`, `ray`, `line` | `segment` | (parts) the figure through A and B |
| `reach` | whole 0…reachMax | 0 | (parts) how many steps the drawing goes past B (ray), past A and B (line) |
| `ax, ay, bx, by, tx, ty` | whole, on the sheet | A(5, 4), B(11, 7), T(17, 10) | the points (dragged; a click moves T) |
| `pdx, pdy` | whole −6…6 | (1, 0) | (two, slide) p's direction |
| `turn` | 0…47 | 0 | (two) q's direction: the index in DIRS |
| `zoom` | `1`, `2`, `4` | `1` | (two) the view |
| `tool` | `par`, `perp` | `par` | (slide) draw a parallel or a perpendicular |
| `j` | whole jLo…jHi | 0 | (slide) how far the set square has slid |
| `hide` | boolean | false | (parts, two) ask first: the answer is hidden |
| `guess` | `''`, `on`, `off`, `par`, `perp`, `cross` | `''` | the class's answer (buttons on the stage) |

**DIRS**: every shortest step (x, y) with |x|, |y| ≤ 6, ordered by angle from (1, 0) anticlockwise: 48 directions,
(1, 0), (6, 1), (5, 1), (4, 1), (3, 1), (5, 2), (2, 1), … (1, 1) at 12, … (0, 1) at 24, … (1, −2) at 30, … (6, −1) at 47.

## Rules

### Mode `parts`

1. **The points** (tie-break): A, B and T are rounded and kept on the sheet. If B = A, B moves one square right
   (left when A is on the right edge) and the caption says so (`bMoved`); the page does not write the moved B back
   into the params, so the caption stays until B is dragged away. The step u = B − A divided by their
   greatest common divisor m: B = A + m · u. A(5, 4), B(11, 7): u = (2, 1), m = 3.
2. **The drawn part**, in steps u from A: segment [0, m]; ray [0, m + reach]; line [−reach, m + reach]. `reach` is
   clamped to 0…reachMax, the smallest lengthening at which the drawing reaches the edge of the sheet on every open
   side (a segment: 0). A(5, 4), u (2, 1): inside the sheet from −2.5 to 8 steps; reachMax = max(8 − 3, ⌈2.5⌉) = 5.
   A(20, 6), B(18, 6): reachMax 18.
3. **Where T is** (the figure itself, not the drawing): T is on the line through A and B when cross(u, T − A) = 0,
   at step k = dot(u, T − A) / |u|². Ends belong (tie-break): segment 0 ≤ k ≤ m; ray k ≥ 0; line any k. `where` is
   - `drawn`: on the figure and from ≤ k ≤ to (the drawn ends count as drawn, tie-break);
   - `beyond`: on the figure, past the drawn part (only a ray or a line);
   - `outside`: on the line through A and B but not on the figure (a segment past A or B, a ray behind A);
   - `off`: not on the line.
   Segment preset: T(17, 10), k = 6 > m = 3 → outside (past B). Beyond preset: T(19, 11), k = 7, drawn to 4 → beyond.
   Near preset: line through (3, 2) and (9, 5), T(21, 10) → off.
4. **Lengthening to T** (`need`, beyond only): k − m past B, −k behind A. Beyond preset: 4. T(1, 2) with reach 0: 2.
5. **The miss** (off only): measured straight up or down from T to the line (sideways when the line is steeper than
   45°; at exactly 45° up or down, tie-break): |cross(u, T − A) / u.x| squares (or / u.y). Near preset: 1 square.
   Line through (0, 0) and (1, 1), T(5, 3): 2 squares, measured up/down. Line through (0, 0) and (2, 1), T(5, 3):
   0.5 (the page says "less than one square"; a non-whole miss above 1 is "about n").
6. **The class's answer** `on` / `off` is right when it matches rule 3's "on the figure"; any other value is no
   answer. Beyond: `off` is wrong (the typical mistake: past the drawing, so not on the line); near: `on` is wrong
   (close is not on).

### Mode `two`

7. **How two lines meet** (`meet`): p through A with step u, q through T with step v. Tie-breaks in order:
   cross(u, v) = 0 → parallel, and then **same** when T lies on p; otherwise they cross in exactly one point S,
   **perp** when dot(u, v) = 0, else **cross**. S is exact: A + (cross(T − A, v) / cross(u, v)) · u, coordinates as
   fractions in lowest terms. Meet preset: p y = 3, q through (12, 8) with (1, 1) → S(7, 3). Perp preset: p through
   (4, 2) with (2, 1), q through (13, 4) with (1, −2) → perp, S(12, 6). T on p and q turned: S = T.
8. **The crossing runs away**: with p: y = 3 and q through (12, 8) with step (x, 1), S = (12 − 5x, 3):
   x = 1, 2, 3, 4, 5, 6 → 7, 2, −3, −8, −13, −18; at (1, 0) there is no S (parallel). S is on the sheet when
   0 ≤ x ≤ 24 and 0 ≤ y ≤ 12, edges included (tie-break: S(0, 3) is on it, S(−5, 3) is not). `zoomNeeded` is the
   smallest zoom of 1, 2, 4 whose view holds S, null when none: far preset (4, 1) → S(−8, 3) → 2; (6, 1) → −18 → 4;
   p y = 0, q through (24, 12) with (6, 1) → S(−48, 0) → null.
9. **The class's answer**: `par` is right only for parallel; `perp` only for perp; `cross` is right for cross and
   "right, with more to say" (`more`) for perp, since perpendicular lines do cross (tie-break). For the same line no
   answer is right. Far: `par` is wrong (the typical mistake: no crossing on the paper, so parallel).

### Mode `slide`

10. **The slide**: p through A with step u. Tool `par`: one edge of the set square lies on p, the ruler along its
    other edge (across p); the set square slides along the ruler. Tool `perp`: the ruler lies on p and the set square
    slides along it; its other edge is the drawing edge. After j steps the set square's right-angle corner is
    A + (j / |u|²) · (−u.y, u.x) (`par`) or A + (j / |u|²) · u (`perp`), so each step moves the drawing edge to the
    next line of its direction through corners. The edge passes through T at **target** = cross(u, T − A) (`par`),
    dot(u, T − A) (`perp`). The slider reaches jLo = min(0, target) − |u|² to jHi = max(0, target) + |u|².
    Slide preset: p through (3, 2) with (2, 1), T(10, 9): target 7, slider −5…12; at j = 7 the corner is (8/5, 24/5).
    Square preset: p y = 3 through (2, 3), T(15, 9): target 13, slider −1…14; at j = 13 the corner is (15, 3).
11. **Done and past** (tie-breaks): `done` when j = target (then q is drawn through T: q ∥ p or q ⊥ p); `past` when j
    has gone beyond the target on its side (slide: j = 8 is past, j = −1 is not). T on p with `par` (target 0): done
    at once, with "the parallel through T would be p itself" (`onP`). The drawing edge points from the corner towards
    T (`legSign`, the sign of dot(u, T − A) for `par`, cross(u, T − A) for `perp`; 0 counts as +).
12. **Params are made valid**: unknown mode → `parts`; unknown kind → `segment`; unknown tool → `par`; points rounded
    and clamped to the sheet (non-numbers, `''` and null take the default); p's step reduced first (`lineDir`), then
    each part clamped to ±6 ((8, 4) → (2, 1); (7, 1) → (6, 1)), (0, 0) or a non-number → (1, 0); `turn` clamped to 0…47; zoom other than 1, 2, 4 → 1 (mode `parts` always uses 1); `hide` only when
    exactly `true`, and never in `slide` (nothing is asked there); a `guess` that does not belong to the mode → none.
    A click lands on the nearest corner, rounded half up, kept on the sheet: (3.5, 2.49) → (4, 2).

## Presets (keys 1–8)

| id | mode | what | expected |
|---|---|---|---|
| `segment` | parts, segment | A(5, 4), B(11, 7), T(17, 10) | outside (past B); on the ray and the line it would be on |
| `beyond` | parts, line, reach 1, ask first | T(19, 11) | beyond; on p; need 4 (the curriculum's question) |
| `near` ("Je li T na pravcu?") | parts, line, reach 2, ask first | A(3, 2), B(9, 5), T(21, 10) | off; misses by 1 square |
| `meet` | two | p y = 3, q through (12, 8) at (1, 1) | cross, S(7, 3); turning q towards p sends S away |
| `far` | two, ask first | q at (4, 1) | cross, S(−8, 3) off the sheet, seen at zoom 2 |
| `perp` ("Dva kosa pravca") | two, ask first | p (2, 1) through (4, 2), q (1, −2) through (13, 4) | perp, S(12, 6), slanted |
| `slide` | slide, par | p (2, 1) through (3, 2), T(10, 9) | target 7 |
| `square` | slide, perp | p y = 3 through (2, 3), T(15, 9) | target 13 |

## Legend and captions

Legend: drawn (solid line), goes on (imagined, dotted), point (dot). Colour is never alone: p and q are named on the
paper, T has its letter, the parts beyond the drawing are dotted or dashed, S is a ring, the right angle is a small
square; the class's answer carries ✓ / ✗ and words (a wrong one in a dashed red box); the answer itself is a plain
box without ✓ / ✗. Preset names never give the answer away (the presets stay visible while the class is asked).
The set square is drawn at one size (legs 7 and 4 squares), wherever T is.

Three audiences (`Simdeck.paperColumns.audience`, one stored choice for the `ari-`/`geo-` pages): **teacher** (every
control, "ask first" with the class's answer buttons, the typical mistake highlighted when the class gave it),
**adult** (adds a "why" sentence: the definitions of segment, ray and line; "two lines either cross or are
parallel"; why the slide keeps the direction), **child** (no zoom, one short sentence: "Da! T pripada pravcu p.",
"Sijeku se, ali izvan papira!", "Povuci q kroz T!").

Captions per state (strings.js): parts: drawn / beyond (line, ray) / outside (segment past A or B, ray behind A) / off
(with the miss), plus "the drawing has reached the edge of the paper on every open side, and the line goes on"
when it has; two: same / parallel / perp / cross on the sheet (with "turn q towards p") / cross off the sheet (with
the zoom that shows S); slide: step 1 (j = 0), step 2 (moving), done (q ∥ p / q ⊥ p), past, T on p.

## Terms (Croatian first)

točka, dužina, krajnje točke, polupravac, početna točka, pravac, sjecište, usporedni pravci (p ∥ q), okomiti pravci
(p ⊥ q), pravci koji se sijeku, pravi kut, ravnalo, trokut; English: point, segment, endpoints, ray, starting point,
line, intersection, parallel, perpendicular, lines that cross, right angle, ruler, set square.

## Misconceptions targeted

- "T is past the end of the drawn line, so it is not on the line" (the drawing is only a picture): `beyond`.
- "T looks as if it is on the line" (close is not on): `near`.
- "They do not cross on the paper, so they are parallel": `far`.
- "Perpendicular means across and up": `perp` (slanted).
- A segment and a line through the same two points are confused: `segment` (T on the line, not on the segment).

## Out of scope

Degrees and measuring angles (grade 5; `geo-angles` for the kinds of angles), distances between parallel lines,
constructions with a compass (`geo-compass`), drawing as a motor skill (the page shows the construction; the hand
does it), naming a ray other than "polupravac AB" *(check)*.
