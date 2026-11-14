<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# geo-solids: SPEC

Task `docs/tasks/w3/geo-solids.md`, catalogue §4.17. One concept: **a cube, a cuboid, a pyramid, a cylinder, a cone
and a sphere are told apart by their faces (flat or curved), edges and vertices (strane, bridovi, vrhovi); turning a
solid shows the hidden ones; unfolding a cube or a cuboid shows its faces as a net; a sugar "cube" uses the word
loosely.**

Class **explorer** (no steps). Two modes:

- `count` (Prebroji / Count): one solid, turned with buttons, a slider or by dragging; the student lights up its
  vertices, edges or surfaces one at a time and counts them. Hidden ones are drawn dashed (or not at all, "only what we
  see"); the ones in sight are lit first, so the count stops where the eye stops and turning shows the rest.
- `net` (Mreža / Net): a cube, a cuboid or a sugar "cube" unfolds into a net, next to the same net drawn flat with
  its faces' sizes: six equal squares, three pairs of equal rectangles, or two squares and four rectangles.

Every expected number below was computed with an independent Python script before coding (NOTES.md, Checks) and is
asserted in `sim.test.js`.

## Sources

- **Curriculum** (Narodne novine 7/2019, read 2026-11-14 in this session):
  - **MAT OŠ C.4.5** "Povezuje sve poznate geometrijske oblike." Razrada: "Povezuje sve geometrijske pojmove u
    opisivanju geometrijskih objekata (vrhovi, strane, stranice, bridovi, kutovi)" (a second line has "plohe" for
    "strane"). Preporuka: "U 4. razredu važno je povezati sve do tada usvojene geometrijske pojmove." and the
    warning about everyday use: "»kocka« šećera, »kocka« za juhu, dresovi na »kockice« ili bilježnica na
    »kockice«" → the whole page; the sugar "cube" (preset `sugar`, rule 12); the squared notebook in the explanation.
  - **MAT OŠ C.1.1** "Izdvaja i imenuje geometrijska tijela i likove …": "Imenuje i opisuje kuglu, valjak, kocku,
    kvadar, piramidu i stožac.", "Imenuje ravne i zakrivljene plohe.", "Ravne plohe geometrijskih tijela imenuje kao
    geometrijske likove: kvadrat, pravokutnik, trokut i krug." → the six solids, flat and curved surfaces (rule 7), each
    flat surface named as a shape (rule 8). Preporuka: begin with concrete models, not drawings → the page is for
    after the models; turning stands in for picking one up.
  - **MAT OŠ C.1.3**: "Određuje vrhove geometrijskih tijela i likova kao točke." → vertices are points (the cone's
    apex is one).
  - **MAT OŠ C.2.1**: "Određuje bridove geometrijskih tijela i stranice geometrijskih likova kao dužine." → an edge
    is a segment, so a cylinder and a cone have none (rule 6); brid on a solid, stranica on a shape.
  - **MAT OŠ C.2.2**: "Opisuje plohe (strane) kocke, kvadra i piramide kao likove, bridove kao dužine, a vrhove kao
    točke." → the three counts and their words.
  - Kept out: the curriculum names no net (mreža) in grades 1–6; the first mention read is grade 7 (C.7.1, "mreže
    geometrijskih tijela" as a side remark). The task and the catalogue ask for the net of a cube and a cuboid, so
    `net` is built, plainly as "the faces laid flat", without a definition of a net, other nets (there are 11 for a
    cube) or the net of a pyramid, cylinder or cone. Also out: Euler's formula, surface area (oplošje) and volume,
    prisms other than the cuboid, naming the base and the lateral faces (osnovka, pobočke), degrees.

## Solids

Sizes in cm (the sugar "cube" in mm), centred at the origin; x to the right, y up, z towards the viewer.

| Id | Name (hr / en) | Size | Vertices | Edges | Flat surfaces | Curved |
|---|---|---|---|---|---|---|
| `cube` | kocka / cube | edge 4 | 8 | 12 | 6 squares | 0 |
| `cuboid` | kvadar / cuboid | 6 wide, 3 deep, 4 high | 8 | 12 | 6 rectangles | 0 |
| `pyramid` | piramida / pyramid | square base 5, height 5 | 5 | 8 | 1 square, 4 triangles | 0 |
| `cylinder` | valjak / cylinder | radius 2.5, height 5 | 0 | 0 (2 rims) | 2 circles | 1 |
| `cone` | stožac / cone | radius 2.5, height 5.5 | 1 | 0 (1 rim) | 1 circle | 1 |
| `sphere` | kugla / sphere | radius 3 | 0 | 0 | 0 | 1 |
| `sugar` | kocka šećera / sugar "cube" | 16 mm wide, 16 mm deep, 11 mm high | 8 | 12 | 2 squares, 4 rectangles | 0 |

A round surface is drawn as 48 thin strips (one curved surface, one count); a rim is the closed line where a flat
surface meets the curved one.

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `mode` | `count`, `net` | `count` | what is shown |
| `solid` | a solid id; `net` takes `cube`, `cuboid`, `sugar` | `cube` | the solid |
| `show` | `v`, `e`, `f` | `v` | (count) vertices, edges, or surfaces |
| `lit` | whole ≥ 0 | 0 | (count) the lit items in the order they were lit, as a number (rule 4) |
| `yaw` | whole degrees, any | 30 | turned about the vertical axis; read mod 360 |
| `tilt` | whole −90 … 90 | 20 | seen from above (> 0) or below (< 0) |
| `see` | boolean | true | hidden lines dashed (true) or not drawn (false) |
| `open` | whole 0 … 100 | 0 | (net) how far the faces are unfolded, in % of a right angle |
| `hide` | boolean | false | ask first |

## Rules

1. **Clean params.** Unknown choices fall back to the default; `net` with a solid that has no net takes `cube`;
   numbers are rounded; `yaw` is taken mod 360 into 0 … 359 (−30 → 330, 390 → 30); `tilt` and `open` are clamped.
   A missing or non-numeric number takes the default. `lit` is decoded by rule 4 and keeps only valid, first
   occurrences.
2. **The view.** A point is turned by `yaw` about the vertical axis (x' = x cos φ − z sin φ, z' = x sin φ + z cos φ:
   a bigger yaw brings the right side to the front), then by `tilt` about the horizontal axis (y'' = y cos θ − z' sin θ,
   z'' = y sin θ + z' cos θ: a bigger tilt shows the top). The picture is (x', y''), seen from +z.
3. **Seen or hidden** (tie-break: edge-on is hidden). A flat face is seen when its outward normal (Newell's, not of
   unit length), turned, points to the viewer by more than 10⁻⁶ (z'' > 10⁻⁶); a face seen exactly edge-on is hidden. A curved surface is seen when any
   of its strips is. A vertex or an edge is seen when a face it belongs to is seen. Cube from the default view
   (30°, 20°): 7 of 8 vertices, 9 of 12 edges, 3 of 6 faces (front, right, top). Straight on (0°, 0°): 4, 4, 1. At
   (45°, 0°): 6, 7, 2. From below (30°, −20°): 7, 9, 3 (bottom, front, right). Cuboid and sugar at (30°, 20°): 7, 9,
   3. Pyramid at (30°, 20°): 4 of 5 vertices, 5 of 8 edges, 2 of 5 faces; at (30°, 70°), from above: 5, 8, and 4 of 5
   faces (the four triangles; the square underneath is hidden). Cylinder at (30°, 20°): 2 of 3 surfaces (the top
   circle and the curved one); at (0°, 0°) 1 (both circles edge-on). Cone: its vertex is seen from every view in
   −90 … 90 that shows its curved surface; at (30°, 20°) 1 of 1 vertex, 1 of 2 surfaces.
4. **Lighting one more** (`P`, the stage's button). Items are numbered in a fixed order per solid (vertices: top then
   bottom; edges: top, bottom, then upright; faces: bottom, front, right, back, left, top; a round solid's flat
   surfaces then its curved one). One more lights **the first seen item not yet lit; when none is seen, the first
   hidden one** (tie-break: seen before hidden, then the fixed order). So the count runs through what the eye sees
   and then on to what is behind. Refused when everything is lit (`all`) or the solid has none of that kind (`none`:
   a cylinder's vertices or edges). Clicking an item lights it (or puts it out, dropping it from the order). `lit`
   stores the order as Σ (iₖ + 1) · 13ᵏ (at most 12 items, indices 0 … 11): [0, 1, 2] → 534. Changing the solid or
   what is counted puts everything out; turning does not.
5. **The count** (count). Lit n of N; the page writes the n-th number on the item. When n = N the readout is the
   solid's number ("Kocka ima 8 vrhova"). The teacher line says how many are seen and how many hidden in this view.
   **Counting only what is seen** (the typical mistake) is named while exactly the seen items are lit, all of them,
   and a hidden one is not (cube, `seen`: after 7; no longer once a hidden one is lit, edges: after 9 but not after
   10).
6. **Edges are segments.** A cylinder and a cone have no edges (brid je dužina, C.2.1); their rims (2 and 1) are
   shown and named when edges are counted, as lines that are not edges. A sphere has no rim. Vertices: a cone has
   one, a cylinder and a sphere none.
7. **Surfaces are flat or curved** (C.1.1). Counting `f` lights the flat ones and the curved one alike, and the
   readout says how many are flat and how many curved: cube 6 flat; pyramid 5 flat; cylinder 3 = 2 flat + 1 curved;
   cone 2 = 1 flat + 1 curved; sphere 1 curved. A solid with only flat faces has strane (faces); the page says
   "strane" for those and "plohe" (surfaces) when one is curved.
8. **A flat surface is a shape** (C.1.1, C.2.2): a four-sided face is a square when its sides are equal (within
   10⁻⁹), else a rectangle; three sides make a triangle; a round flat surface is a circle. The lit face carries its
   shape's name (teacher, adult). Cube: 6 squares; cuboid: 6 rectangles; pyramid: 1 square and 4 triangles; sugar:
   2 squares and 4 rectangles.
9. **Turning.** The ⟲ and ⟳ buttons (and `O`) turn by 30°; dragging the stage turns freely (1° per few pixels); the
   slider sets the tilt. A sphere looks the same from every side (no line to see turn).
10. **Unfolding** (net). The bottom stays on the table; front, right, back and left turn outwards about their bottom
    edges by α = open · 0.9°; the top turns with the back about the back's top edge by a further α. A point at height
    y of the front face goes to (x, y cos α, b/2 + y sin α); the top's direction from its hinge is (0, sin 2α,
    cos 2α). At open = 100 everything lies in the table's plane: the cross-shaped net (front, bottom, back, top in a
    column, left and right beside the bottom). `P` (and the button) opens to the next quarter (0 → 25, 30 → 50, 75 →
    100), refused at 100 (`open`); the Close button sets 0.
11. **The net's faces** (net). Bottom and top a × b, front and back a × c, left and right b × c (a wide, b deep,
    c high). Cube 4: six 4 cm × 4 cm squares; cuboid: 6 × 3, 6 × 4, 4 × 3 cm, three pairs of equal rectangles,
    opposite faces equal; sugar: 16 × 16 mm twice, 16 × 11 mm four times. The net is 12 × 16 cm (cube), 14 × 14 cm
    (cuboid), 38 × 54 mm (sugar).
12. **A cube is a cuboid with all edges equal.** The kind is `cube` when a = b = c, else `cuboid`. The sugar
    "cube" has edges of 16, 16 and 11 mm: it is a cuboid. Named as the typical mistake ("kocka šećera nije kocka")
    whenever the sugar is shown (teacher, in both modes; not while asking first). Edges grouped by length, longest first: cube 12 of 4 cm; cuboid 4 of 6 cm, 4 of 4
    cm, 4 of 3 cm; sugar 8 of 16 mm, 4 of 11 mm.
13. **Ask first** (`hide`): count, the total is "?" until everything is lit (the seen count stays: "we see 7, how
    many are there?"); net, the faces' sizes and the kind are "?" until the net is open. V shows.
14. **Typical mistakes** (teacher, highlighted): counting only what is seen (rule 5); a rim counted as an edge
    (rule 6); a sphere has no surface, or no flat one means none (sphere `f`); the pyramid's four triangles without
    the square under it (pyramid `f`: the four triangles lit and the square not; named instead of
    "only what is seen" when both hold); a cuboid's faces all equal
    (cuboid net); the sugar "cube" (rule 12).

## Presets

| Key | Id | Params | Expected |
|---|---|---|---|
| 1 | `seen` | count, cube, v, see false, hide | P × 7 lights the 7 seen vertices, then the mistake; the 8th is behind; 8 |
| 2 | `edges` | count, cube, e | 9 seen, 3 hidden (dashed); 12 |
| 3 | `pyramid` | count, pyramid, f, tilt 70, hide | 4 triangles seen, the square hidden; 5 faces |
| 4 | `cylinder` | count, cylinder, e | no edges, 2 rims; P refused (`none`) |
| 5 | `sphere` | count, sphere, f | 1 curved surface; turning changes nothing |
| 6 | `net` | net, cube, tilt 35 | P × 4 → open 100: six equal 4 cm squares |
| 7 | `cuboid-net` | net, cuboid, tilt 35, open 100 | three pairs: 6 × 3, 6 × 4, 4 × 3 cm |
| 8 | `sugar` | net, sugar, tilt 35, hide | open: 2 squares and 4 rectangles; a cuboid |

## Legend and captions

Legend: a flat surface (tinted), a curved surface (shaded strips), a lit item (its number, thick), a hidden line
(dashed). Captions in three voices: teacher (the question first, the typical mistake highlighted), adult (a "why"
sentence per mode), child (one short sentence).

## Terms (both languages)

geometrijsko tijelo / solid (3D shape); kocka / cube; kvadar / cuboid; piramida / pyramid; valjak / cylinder;
stožac / cone; kugla / sphere; vrh / vertex; brid / edge; strana / face; ploha / surface; ravna / flat; zakrivljena
/ curved; rub / rim *(check)*; mreža / net; kvadrat / square; pravokutnik / rectangle; trokut / triangle; krug /
circle; stranica / side (of a shape).

## Misconceptions targeted

1. Counting only what is seen: 7 vertices, 9 edges, 3 faces of a cube (rule 5, presets `seen`, `edges`).
2. A pyramid has 4 faces (the square underneath forgotten) (preset `pyramid`).
3. A cylinder has edges (its rims) (rule 6, preset `cylinder`).
4. A sphere has no surface (preset `sphere`).
5. A cuboid's faces are all equal; a cube is not a cuboid (rules 11, 12, preset `cuboid-net`).
6. A sugar "cube" is a cube (rule 12, preset `sugar`).

## Out of scope

Other nets of the cube, nets of the pyramid, cylinder and cone, folding a drawn net back, Euler's formula, surface area
and volume, prisms and pyramids other than these, osnovka and pobočka, measuring angles.
