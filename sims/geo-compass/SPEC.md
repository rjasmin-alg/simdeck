<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# geo-compass: SPEC

Task `docs/tasks/w3/geo-compass.md`, catalogue §4.17. One concept: **a compass keeps one distance, so every point it
draws is the same distance from the centre: that is a circle (kružnica), and the radius is that distance; the disc
(krug) is the circle with everything inside it; a point is inside, on or outside by comparing its distance with the
radius; a compass also carries a length from one place to another, which is how a rectangle or a square with given
sides is constructed.**

Class **explorer** (no steps). One squared-paper plane, three modes: `circle` (open the compass and turn it),
`point` (where is T: inside, on or outside; does it belong to the circle, to the disc?), `build` (carry the sides
with the compass and construct a rectangle or a square). Every expected number below was recomputed with an
independent Python script before coding (NOTES.md, Checks) and is asserted in `sim.test.js`.

Builds on the **squared-paper model** of `geo-lines` (catalogue §5.27): `paper.js` is its copy, unchanged. The
compass part (`logic.compass` in `sim.js`: squared distance, inside / on / outside, belonging, a length in cm and mm,
the miss in mm) is pure and string-free, ready to be added to `models/squared-paper.js`.

## Sources

- **Curriculum** (Narodne novine 7/2019, read 2026-11-14 in this session):
  - **MAT OŠ C.3.3** "Služi se šestarom u crtanju i konstruiranju." Razrada: "Koristi se šestarom kao dijelom
    geometrijskoga pribora. Šestarom se služi u crtanju i prenošenju dužine određene duljine. Konstruira kružnicu.
    Crta pravokutnik i kvadrat određene duljine stranica." Sadržaj: "Crtanje i konstruiranje šestarom (kružnica,
    pravokutnik i kvadrat). Prenošenje dužine zadane duljine." Preporuka: "U crtanju pravokutnika i kvadrata učenik
    se šestarom koristi za prenošene duljine dužine pojedine stranice." → modes `circle` and `build`.
  - **MAT OŠ C.4.3** "Opisuje i konstruira krug i njegove elemente." Razrada: "(kružnica, polumjer i središte).
    Opisuje odnos kruga i kružnice. Prepoznaje polumjer i središte kruga i kružnice. Prepoznaje i navodi točke koje
    (ne)pripadaju krugu ili kružnici." Preporuka: "Kako bi učenici shvatili da je kružnica zakrivljena crta koja
    omeđuje krug, važno je koristiti se ilustracijama na kojima je unutrašnjost kruga obojena." → mode `point`, the
    question "Pripada li T kružnici / krugu?", the disc always coloured in `point` and coloured by default once the
    circle is closed in `circle`.
  - **MAT OŠ C.3.2** (geo-lines): perpendicular lines with the set square → step 4 of the construction.
  - **MAT OŠ D.3.1**: cm and mm, and "Duljinu dužine zapisuje matematičkim znakovima" → |ST| = 5 cm, |AB| = a.
  - Kept out (later grades): degrees (a turn is shown in twelfths, never in degrees), the diameter (promjer is not
    in C.4.3), decimals (a length that is not whole is "about 5 cm 1 mm"), formulas for perimeter and area.

## The paper

Corners (x, y) with whole numbers, y upwards; the sheet is 24 × 12 squares, **one square is 1 cm** (the ruler's
ticks). Mode `build` hides the squares (the construction is done on plain paper: the compass, not counting squares,
carries the length); the model is the same.

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `mode` | `circle`, `point`, `build` | `circle` | what is shown |
| `r` | whole 1…6 | 4 | (circle, point) the compass's opening, the radius in cm |
| `sx, sy` | whole, the circle on the paper | S(12, 6) | the centre (središte), dragged |
| `tx, ty` | whole, on the paper | T(14, 8) | (point) the point, dragged or a click |
| `sweep` | whole 0…12 | 0 | (circle) how far the compass has turned, in twelfths of a turn |
| `fill` | boolean | true | (circle) colour the disc once the circle is closed (a button on the stage) |
| `ask` | `circle`, `disc` | `circle` | (point) the question: does T belong to the circle (kružnica) or to the disc (krug)? |
| `a` | whole 1…9 | 7 | (build) side a in cm |
| `b` | whole 1…6 | 4 | (build) side b in cm; b = a makes a square |
| `step` | whole 0…7 | 0 | (build) the construction's step (the stage's Back / Next buttons) |
| `hide` | boolean | false | (point) ask first: the answer is hidden |
| `guess` | `''`, `yes`, `no` | `''` | (point) the class's answer |

## Rules

1. **The circle on the paper** (tie-break): r is rounded and kept within 1…6; then S is rounded and kept so that the
   whole circle lies on the paper: r ≤ x ≤ 24 − r, r ≤ y ≤ 12 − r (touching the edge is on it). r = 6 → S's y is 6.
   S(1, 1) with r 4 → S(4, 4). A drag of the pencil sets r to the distance from S rounded to whole cm, within 1…6.
2. **Turning the compass** (`circle`): the pencil starts at S + (r, 0) and turns anticlockwise; `sweep` k draws the
   arc of k twelfths of a turn and leaves a mark at each twelfth passed (k + 1 marks for k < 12, 12 when closed).
   Every mark is r from S (the compass does not change its opening). At k = 12 the line is closed: the circle
   (kružnica).
3. **The disc** (tie-break): the disc is coloured only when the circle is closed (`fill` and k = 12): an open arc
   bounds nothing. In mode `point` the circle is always closed and the disc always coloured.
4. **Inside, on or outside** (`point`): compare d² = |ST|² with r² (both whole, so the answer is exact, never a
   pixel tolerance): d² < r² inside, d² = r² on, d² > r² outside. The centre (T = S) is inside.
5. **Belonging** (tie-break): T belongs to the circle (kružnica) only when it is on it; it belongs to the disc (krug)
   when it is inside or on it: the circle is the disc's edge and belongs to the disc. The centre belongs to the disc,
   not to the circle.
6. **Lengths in cm and mm**: |ST| is written in whole cm when d² is a perfect square, else "about c cm m mm", rounded
   to the nearest millimetre (√26 = 5.099 → about 5 cm 1 mm; √8 → about 2 cm 8 mm). How far T misses the circle:
   |d − r| in whole mm, 0 only when d² = r², at least 1 otherwise (tie-break: a difference under half a millimetre
   is never written as 0 mm; on this paper with r ≤ 6 the smallest difference is 0.83 mm, which rounds to 1 anyway).
7. **The class's answer** (`point`): `yes` / `no` to the question `ask`; right when it matches rule 5. Only mode
   `point` asks; `hide` and `guess` are ignored elsewhere.
8. **The construction** (`build`), A fixed at (2, 2), p the horizontal line through A; B = A + (a, 0), D = A + (0, b),
   C = B + (0, b). The steps, each adding one thing:
   0. `given`: the given segments a and b (on the right of the paper, with their lengths);
   1. `line`: the ruler draws line p and point A on it;
   2. `takeA`: the compass takes length a: needle on one end of the given a, pencil on the other (opening a);
   3. `markB`: needle in A, an arc across p: B, so |AB| = a;
   4. `perps`: the set square, one leg on p, draws the perpendiculars to p at A and at B;
   5. `takeB`: the compass takes length b from the given b (opening b); for a square the compass stays open (b = a)
      and stands on A and B;
   6. `markDC`: needle in A, an arc across the perpendicular: D; needle in B: C (|AD| = |BC| = b);
   7. `join`: the ruler joins D and C: the rectangle (square) ABCD; the compass checks |DC| = |AB| = a (the ruler is
      drawn only at step 1; here it would crowd the drawing).
   The arcs stay drawn once made (construction lines).
9. **A square** (tie-break): equal sides, a = b, make a square (a rectangle whose sides are all equally long): only
   segment a is given, and at step 5 the compass stays open (b = a) and stands on A and B. A square's side is at most
   6 (b's limit, the paper's height): a = 9, b = 6 is a rectangle.
10. **Params are made valid**: unknown mode → `circle`; unknown ask → `circle`; numbers
    rounded and clamped (non-numbers, `''` and null take the default); `hide` only when exactly `true` and only in
    mode `point`; a `guess` other than `yes` / `no` → none. A click lands on the nearest corner, rounded half up,
    kept on the paper: (3.5, 2.49) → (4, 2).

## Presets (keys 1–8)

| id | mode | what | expected |
|---|---|---|---|
| `draw` | circle | S(12, 6), r 4, sweep 0 | turn the compass: 12 marks, each 4 cm from S, closed at 12 |
| `centre` ("T u središtu") | point, ask circle, ask first | r 4, T = S | inside, d = 0; not on the circle, in the disc |
| `inside` ("T blizu središta") | point, ask circle, ask first | r 4, T(14, 8) | inside, d² = 8, about 2 cm 8 mm; not on the circle (the typical mistake: yes) |
| `slanted` ("T ukoso od S") | point, ask circle, ask first | r 5, T(15, 10) | on: d² = 25, \|ST\| = 5 cm although T is not straight across from S |
| `near` ("Je li T na kružnici?") | point, ask circle, ask first | r 5, T(17, 7) | outside: d² = 26, about 5 cm 1 mm, 1 mm too far (the typical mistake: it looks on) |
| `edge` ("Pripada li T krugu?") | point, ask disc, ask first | r 4, T(16, 6) | on the circle, so in the disc: yes (the typical mistake: the edge is not the disc) |
| `rect` | build | a 7, b 4 | B(9, 2), C(9, 6), D(2, 6); \|DC\| = 7 |
| `square` | build | a 5, b 5 | B(7, 2), C(7, 7), D(2, 7) |

## Legend and captions

Legend: circle (kružnica, a line), disc (krug, coloured inside), radius (polumjer, dashed). Colour is never alone:
S, T, A–D are named; the radius carries r and its length; the disc is coloured and named; inside / on / outside is
said in words in the answer box with ✓ / ✗ only on the class's answer; the gap between T and the circle is a red segment (with its mm when T is outside by less than 1 cm). The page's
view has a margin of 0.6 × 0.3 squares around the sheet, so a circle touching the sheet's edge is drawn whole.
A square's sides are all labelled a. Named mistakes (teacher and adult, when the class's answer was wrong): asked
about the circle: inside answered yes (`inside`, `centre`), outside answered yes (`near`), on answered no
(`slanted`); asked about the disc: on answered no (`edge`), inside answered no, outside answered yes.

Three audiences (`Simdeck.paperColumns.audience`): **teacher** (every control, ask first with the class's answer
buttons, the typical mistake highlighted), **adult** (adds a "why": the circle is all points r from S; the disc
is the circle and its inside; the compass carries a length without a number), **child** (one short sentence:
"Šestar crta kružnicu.", "Da! T pripada krugu.", "Šestar prenosi duljinu.").

## Terms (Croatian first)

šestar, kružnica, krug, polumjer, središte, unutar, na, izvan, pripada / ne pripada, prenošenje dužine, pravokutnik,
kvadrat, stranica, vrh, okomica, ravnalo, trokut (set square); English: compass, circle, disc, radius, centre, inside,
on, outside, belongs / does not belong, carrying a length, rectangle, square, side, vertex, perpendicular, ruler,
set square. Names: kružnica k, središte S, polumjer r; |ST| for a length.

## Misconceptions targeted

- "Krug and kružnica are the same" (a point inside belongs to the circle): `inside`, `centre`.
- "The centre is a point of the circle": `centre`.
- "Close is on": `near` (1 mm too far).
- "Only points straight across from S are r away": `slanted` (3-4-5).
- "The edge does not belong to the disc": `edge`.
- "A compass only draws circles; a length must be measured with the ruler": `rect`, `square` (the compass takes a
  and b and carries them; the check |DC| = a needs no number).

## Out of scope

Degrees, the diameter, π and the circle's length or area, decimals, triangles from three sides (`geo-triangles`),
perimeter and area of the rectangle (`geo-perimeter-area`), the hand's skill with the compass.
