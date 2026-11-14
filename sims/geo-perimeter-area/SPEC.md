<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# geo-perimeter-area: SPEC

Task `docs/tasks/w3/geo-perimeter-area.md`, catalogue §4.17. One concept: **the perimeter (opseg, o) is the length of
the edge around a shape, the area (površina, P) the number of unit squares it covers; they are different things:
twelve unit squares make rectangles 1 × 12, 2 × 6 and 3 × 4 with the same area and perimeters 26, 16 and 14; written
o = 14 cm, P = 12 cm², counted, without formulas, as the curriculum asks.**

Class **explorer** (no steps). One squared-paper plane, three modes: `paint` (colour squares, watch P and o),
`twelve` (the same n squares laid as every rectangle, a table of P and o), `walk` (walk around the edge, one side of
a square at a time, and count). Every expected number below was recomputed with an independent Python script before
coding (NOTES.md, Checks) and is asserted in `sim.test.js`.

Builds on the **squared-paper model** of `geo-lines` (catalogue §5.27): `paper.js` is its copy, unchanged. The part
for unit squares (`logic.area` in `sim.js`: the squares of a shape, its edge, its shapes, the walk, P and o, what one
more square does, the rectangles of n squares) is pure and string-free, ready to be added to
`models/squared-paper.js`.

## Sources

- **Curriculum** (Narodne novine 7/2019, read 2026-11-14 in this session):
  - **MAT OŠ D.3.3** "Određuje opseg likova." Razrada: "Opisuje opseg kao duljinu ruba bilo kojega geometrijskog
    lika. Mjeri duljinu dužine. Mjeri opseg neformalnim i formalnim načinima. Određuje opseg trokuta, pravokutnika i
    kvadrata kao zbroj duljina njihovih stranica." Preporuka: "Učenike se navodi na zaključak da je opseg zbroj
    duljina svih stranica mnogokuta. Učenici mogu odrediti i opseg lika sastavljenoga od dvaju ili više likova … Pri
    određivanju opsega trokuta, pravokutnika i kvadrata kao zbroja duljina stranica ne rabi se formula za
    izračunavanje, a opseg se zapisuje malim slovom o (npr. o = 12 cm)." → the edge (rub) is what o measures, the
    walk around it (mode `walk`), a rectangle's o written as the sum of its four sides (mode `twelve`), never
    2 · (a + b).
  - **MAT OŠ D.4.2** "Uspoređuje površine likova te ih mjeri jediničnim kvadratima." Razrada: "Mjeri površinu likova
    ucrtanih u kvadratnoj mreži prebrojavanjem kvadrata. Ucrtava u kvadratnu mrežu likove zadane površine."
    Preporuka: "… da izrade lik površine 8 jediničnih kvadrata, što je, naravno, moguće napraviti na mnogo načina …
    Bilo bi dobro pokazati da dva lika iste površine mogu imati različite opsege … Primjer problemskoga zadatka:
    Uzmite 12 jediničnih kvadrata. Slažite od njih različite pravokutnike i bilježite im površinu i opseg. Što
    primjećujete? Pri određivanju površine nikako se ne koristite formulom za izračunavanje, a površinu valja
    zapisati velikim slovom P (npr. P = 8 centimetara kvadratnih)." → mode `paint` and preset `eight`, mode `twelve`
    and its table (the curriculum's own problem), P counted square by square, written P = 8 cm².
  - Kept out (later grades): formulas (o = 2 · (a + b), P = a · b), units other than cm and cm² (dm², m², converting
    units are the "prošireni sadržaj"), decimals, fractions, triangles' perimeter (D.3.3 has it, but on squared paper a
    triangle's slanted sides are not whole: out of scope, see below).

## The paper

Squares [x, y] with whole numbers, the square's lower-left corner at (x, y), y upwards; the sheet is 24 × 12 squares,
**one square is 1 cm** (as in geo-lines and geo-compass), so one square covers 1 cm² and one side of a square is 1 cm
of edge.

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `mode` | `paint`, `twelve`, `walk` | `paint` | what is shown |
| `cells` | list of squares [x, y] | the `eight` shape | (paint, walk) the coloured squares; in the URL as `cells=` (one hex number per row) |
| `n` | whole 1…20 | 12 | (twelve) how many squares (up to 20: even 1 × 20 leaves room for the sides' lengths) |
| `b` | whole | 1 | (twelve) the rectangle's short side (the stage's buttons) |
| `seen` | whole 0…15 | 0 | (twelve) which rectangles' o has been shown (one bit each, in the order of the table) |
| `k` | whole 0…o | 0 | (walk) how many sides of the edge have been walked (the stage's Back / Next) |
| `hide` | boolean | false | (paint, twelve) ask first: the numbers are hidden |

## Rules

1. **The squares** (tie-break): only pairs of whole numbers on the paper count, each square once; anything else is
   dropped. Squares are kept in reading order (top row first, left to right), which numbers them 1, 2, 3 … on the
   paper.
2. **The edge and o**: the edge (rub) is every side of a coloured square whose neighbour across that side is not
   coloured; **o is the number of those sides, in cm**. A side on the paper's border is edge (off the paper is not
   coloured). The sides are directed with their square on the left (anticlockwise around a shape, clockwise around
   a hole).
3. **Shapes** (tie-break): squares that share a whole side are one shape (lik); squares that touch only at a corner
   are two shapes, each with its own P and o. Shapes are taken in the reading order of their first square.
4. **The walk** (`walk`; tie-breaks): each shape in turn. A shape's walk starts at the lower-left corner of its
   lowest, leftmost square and goes along that square's bottom side (anticlockwise). At every corner it takes the
   side that turns left, else straight on, else right: so it stays with the square it walks along, and where two
   squares of the shape meet only at a corner it does not cross over. When the loop closes and the shape still has
   edge left (a hole), the walk goes on from the lowest, leftmost unwalked side, around the hole. The sides of a shape are numbered from 1; the last number is that shape's o.
   Every side of the edge is walked exactly once.
5. **P and o**: **P is the number of coloured squares, in cm²**; o is rule 2. A hole's edge is part of the edge (the
   edge has an inner part): a 3 × 3 ring around one empty square has P = 8 cm², o = 16 cm. A shape's holes are its
   loops past the first. The squares that touch the edge (the typical mistake counts them instead of the sides) are
   counted too: a 3 × 4 rectangle has 10, but o = 14.
6. **One more square**: colouring a square adds 1 cm² to P and changes o by 4 − 2k cm, where k is the number of its
   sides it shares with coloured squares (each shared side leaves the edge, each free side joins it): + 4, + 2, 0,
   − 2, − 4. Erasing it is the opposite. So P can grow while o stays (`notch`: filling the corner, k = 2) or shrinks.
7. **The rectangles of n squares** (`twelve`): every b × a with b ≤ a and a · b = n, listed with b from 1 up
   (12 → 1 × 12, 2 × 6, 3 × 4). The rectangle lies with its long side along the paper, in the middle:
   x0 = ⌊(24 − a) / 2⌋, y0 = ⌊(12 − b) / 2⌋, its squares numbered 1 … n. Its o is counted like any shape's (rule 2)
   and written as the sum of its four sides, a + b + a + b (D.3.3), never with a formula. Tie-break: `b` is snapped to
   the largest short side not above it (n = 12, b = 5 → 3 × 4; b = 0 → 1).
8. **The table** (`twelve`): one row per rectangle, b × a, P and o; a row is filled once its rectangle has been
   built with its o shown (asking first, the row waits). Once every row is filled, the comparison: P the same, o from
   the smallest (the most square-like) to the largest (1 × n).
9. **Asking first** (`paint`, `twelve`): `hide` hides o and P and the squares' numbers in `paint`, and the current
   rectangle's o in `twelve` (its sides stay labelled: the class adds them). The walk is not hidden: it counts.
   `hide` only when exactly `true` and the mode is not `walk`.
10. **Same number, different things**: when o and P are the same number (4 × 4: o = 16 cm, P = 16 cm²) the page says
    so: centimetres of edge against square centimetres of surface. Only for one shape: with several shapes, the sums
    over the shapes are no shape's o and P.
11. **Params are made valid**: unknown mode → `paint`; numbers rounded and clamped (non-numbers, `''` and null take
    the default); `k` within 0 … o; `seen` keeps only the rows that exist. A click lands on the square under it, kept
    on the paper. The URL's `cells` is one hexadecimal number per row, bottom row first, bit x for square x, rows
    joined by `.` with trailing empty rows dropped; a string with any other character decodes to no squares, and
    squares past the paper (bits from 24 up, rows from 12 up) are dropped.

## Presets (keys 1–8)

| id | mode | what | expected |
|---|---|---|---|
| `eight` ("Lik od 8 kvadrata") | paint, ask first | rows `###.` / `####` / `.#..` from (10, 5) | P = 8 cm², o = 14 cm; 7 squares touch the edge |
| `notch` ("Popuni kut") | paint | 3 × 3 without its top-right square, from (10, 4) | P = 8 cm², o = 12 cm; colour (12, 6): P = 9 cm², o = 12 cm (k = 2) |
| `same-perimeter` ("Isti opseg") | paint | 1 × 5 at (3…7, 6) and 3 × 3 at (15…17, 4…6) | shape 1: P = 5 cm², o = 12 cm; shape 2: P = 9 cm², o = 12 cm |
| `twelve` ("12 kvadrata") | twelve, ask first | n 12, 1 × 12 | 1 × 12: o = 26 cm; 2 × 6: 16 cm; 3 × 4: 14 cm; P = 12 cm² each |
| `sixteen` ("4 × 4") | twelve | n 16, b 4 | o = 4 + 4 + 4 + 4 = 16 cm, P = 16 cm²: the same number; 1 × 16: 34, 2 × 8: 20 |
| `walk` ("Obiđi pravokutnik") | walk | 4 × 3 from (10, 4) | 14 sides: o = 14 cm, P = 12 cm²; 10 squares touch the edge |
| `walk-u` ("Obiđi slovo U") | walk | rows `#..#` / `#..#` / `####` from (10, 4) | o = 18 cm, P = 8 cm²; the walk goes into the U |
| `blank` ("Prazan papir") | paint | no squares | P = 0, o = 0: colour your own |

Other numbers the tests check: n = 16: 34, 20, 16; n = 18: 38, 22, 18; n = 20: 42, 24, 18; 24 squares (past the slider, the model's rectangles only): 50, 28, 22, 20;
n = 13: only 1 × 13, o = 28; the U with (11, 6) coloured: P = 9, o = 20 (k = 1: + 2); with (11, 5) and (12, 5):
P = 10, o = 16.

## Legend and captions

Legend: square (1 cm², coloured), edge (rub, a thick line), walked edge (numbered). Colour is never alone: the squares
are numbered (P), the sides on the edge are numbered in the walk, o and P are written out, the shapes carry tags 1, 2
… when there are several.

Captions, by audience (`Simdeck.paperColumns.audience`, the shared stored choice):

- **teacher** (the default): every control, ask first with V, the named mistakes highlighted:
  - `walk`, at the end of a walk round one shape, when the squares touching the edge are not o: "counting the squares along the edge (10)
    instead of their sides on the edge (14): a corner square gives two";
  - `twelve`, once every row is filled: "thinking that shapes with the same area have the same perimeter";
  - `paint` with two or more shapes of equal o and different P (`same-perimeter`): "thinking that the same perimeter means the
    same area";
  - rule 10's "the same number is not the same thing" (cm and cm²);
  - `paint`, after one square is coloured or erased: what it did to P and o (rule 6), and "o did not grow" when it
    did not; after a drag over several squares, how P and o changed in all.
- **adult**: adds a "why": o counts sides on the edge, P counts squares; a long thin rectangle has more edge.
- **child**: one short sentence: "P broji kvadrate. o broji rub.", "Hodaj po rubu!", "Isti kvadrati, drugi rub!".

## Terms (Croatian first)

opseg (o), površina (P), jedinični kvadrat, kvadratna mreža, rub, lik, stranica, pravokutnik, kvadrat, centimetar,
centimetar kvadratni (cm²), duljina, obojiti, prebrojiti; English: perimeter, area, unit square, squared paper,
edge, shape, side, rectangle, square, centimetre, square centimetre, length, colour, count.

## Misconceptions targeted

- "Perimeter and area are the same thing" / "the same number is the same thing": `sixteen` (16 cm and 16 cm²).
- "Shapes with the same area have the same perimeter": `twelve` (26, 16, 14).
- "The same perimeter means the same area": `same-perimeter` (12 and 12; 5 and 9).
- "The perimeter is the number of squares along the edge": `walk` (10 against 14), `walk-u`.
- "One more square always makes the perimeter bigger": `notch` (P + 1, o + 0); rule 6.
- "o is written in cm², P in cm" (units mixed up): every readout writes o in cm and P in cm².

## Out of scope

Formulas, the perimeter of a triangle and of shapes with slanted sides (their sides are not whole on squared paper;
geo-triangles measures them), dm² and m² and converting units, half squares, estimating area of curved shapes,
volume (`measuring` → `volume`).
