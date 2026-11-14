<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# geo-solids: notes

New explorer (task `docs/tasks/w3/geo-solids.md`, catalogue §4.17, wave 3, MAT OŠ C.4.5 with C.1.1, C.1.3, C.2.1,
C.2.2; thread t-0448). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Two modes.** `count`: one solid, turned with ⟲ ⟳ (and `O`), the tilt slider, or by dragging it; its vertices,
  edges or surfaces light up one at a time with a number, as children count them on a model. `net`: a cube, a cuboid or
  a sugar "cube" unfolds (the bottom stays on the table, the sides turn about their bottom edges, the top turns with
  the back), next to the same net drawn flat with each face's size.
- **Seen first, then hidden.** "Next" (`P`) lights the first item in sight, and only when everything in sight is lit
  the first one behind (SPEC rule 4). So the count stops where the eye stops (7 vertices, 9 edges, 3 faces of a cube),
  the page names that as the typical mistake, and the next press lights one behind, dashed. Turning keeps what is lit,
  so a child can turn the cube and see the hidden vertex come round. "Seen" is computed (outward normals turned to the
  viewer; a face seen exactly edge-on is hidden), not drawn by eye; an independent Python script checked the counts.
- **Hidden lines dashed** by default, as in school drawings; the stage's "Skriveno crtkano" switch turns them off
  (preset `seen`: only what a real cube shows, so the 8th vertex is not there until it is counted or turned to).
- **Edges are segments** (C.2.1: "bridove … kao dužine"): a cylinder and a cone have no edges. Their rims are drawn and
  named ("rub") when edges are counted, so the class sees what is not counted and why. A cone has one vertex.
- **Surfaces, flat and curved** (C.1.1): the third count is "Plohe", flat and curved alike; the readout says "strane"
  for a solid with flat faces only and "plohe" when one is curved, and names each flat one as a shape (kvadrat,
  pravokutnik, trokut, krug; C.1.1, C.2.2). The ID card beside the solid gives all three counts (with flat, curved
  and rims), "?" while asking first.
- **Round solids** are 48 strips for the geometry (seen or not, the outline, the rims); drawn shaded by a fixed light,
  with no seams. The sphere is drawn as one shaded disc: its strips looked like flat faces.
- **The net** is the 1-4-1 cross only (the one a box opens into when the bottom stays down). Faces are numbered 1–6
  (bottom, front, right, back, left, top) in both drawings and coloured by opposite pairs (number, size and colour, so
  colour is never alone). Sizes are in cm (the sugar in mm, the unit grade 3 knows from D.3.1); a size is written on
  two lines so it fits a narrow face.
- **The sugar "cube"** (C.4.5's own warning) is 16 × 16 × 11 mm: two square and four rectangular faces, so a cuboid.
  Named as the typical mistake wherever it is shown; the explanation also has the stock "cube" and squared paper
  ("na kockice") from the same remark.
- **Ask first** (`V`): counts "?" until done (the seen count stays, "we see 7: how many are there?"); net sizes and
  the kind "?" until the net is flat.
- **Three audiences** through `Simdeck.paperColumns.audience` (the shared stored choice): teacher (the card, the kind
  of box, mistakes highlighted, ask first, the hidden-lines switch), adult (a "why" sentence per mode), child (the
  solid and big numbers only, one short caption).
- **Keys**: `P` lights the next one or opens the net; `O` turns by 30°; `V` asks first or shows. All others are the
  kit's. Arrows are not used for turning (the clicker's keys).
- **The lit order** lives in the URL as one number (`lit`, digits of base 13), because the kit has no list param; a
  link reproduces the numbering.
- **No kit view** (catalogue §4.17 names K5 only for two other pages); SVG with HTML labels at 1 : 1. **No glossary
  terms**, as in the other `ari-` and `geo-` pages.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- **Nets are not in the curriculum for grades 1–4** (read in this session: no "mreža" in grades 1–6; the first mention
  is grade 7, C.7.1). The task and the catalogue ask for the net of a cube and a cuboid, so it is built, kept plain
  ("the faces laid flat"), as the second mode. The owner may want it labelled as going beyond grade 4, or dropped.
- Pyramid, cylinder and cone nets, other cube nets, and naming osnovka/pobočke are left out (SPEC, Out of scope).

## Sources

- The national curriculum for mathematics, Narodne novine 7/2019
  (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html), **read on 2026-11-14** in this session (a helper
  fetched the page; the verbatim parts were used): C.4.5 (razrada "vrhovi, strane, stranice, bridovi, kutovi", a
  second line with "plohe"; the preporuka on "»kocka« šećera, »kocka« za juhu, dresovi na »kockice« ili bilježnica na
  »kockice«"), C.1.1 (the six solids, flat and curved surfaces, flat surfaces named as shapes; models before
  drawings), C.1.3 (vertices as points), C.2.1 (edges as segments), C.2.2 (faces as shapes, edges as segments,
  vertices as points). Quoted in SPEC.md. Grades 5–6 have no net; grade 7 mentions "mreže geometrijskih tijela" in
  passing; grade 8 was not read.
- Croatian textbooks for grades 1–4 were not available offline. **Marked *(check)*:**
  - **"rub"** for the circle where a cylinder's or a cone's flat surface meets the curved one (and that textbooks say a
    cylinder has no edges; some older books count "zakrivljeni bridovi");
  - "strane" for the flat faces of a polyhedron and "plohe" for all surfaces (the curriculum uses both, "plohe
    (strane)");
  - "vrh" for the cone's apex (C.1.3 says vertices of solids; books say "vrh stošca");
  - the sugar cube's size 16 × 16 × 11 mm (a common size; others are true cubes);
  - "mreža kocke" as the word for the unfolded faces at this level;
  - the English textbook words: "faces", "surfaces", "rim", "net", "sugar cube", "cuboid".
- The misconceptions (counting only what is seen, a pyramid with 4 faces, a cylinder's rims as edges, a sphere
  without a surface, a cuboid with six equal faces, the sugar cube) are the classic ones for this topic, from general
  knowledge *(check)*; the last is the curriculum's own.

## Checks

- Numbers: an independent Python script (no code shared) computed the seen and total vertices, edges and faces of
  every solid from several views (cube 7/8, 9/12, 3/6 at (30°, 20°); 4, 4, 1 straight on; pyramid 4 of 5 faces from
  above at 70°), outward winding, the cylinder's and cone's visibility, the nets' face sizes, outlines and areas, edge
  lengths, and the lit-order encoding, before the model was written; the same values are in SPEC.md and the tests.
- Tests: `node --test sims/geo-solids/sim.test.js` (32), tie-breaks first; 18 mutants of `sim.js` (one per rule) all
  failed a test, and the reviewer's surviving ones are now covered (below).
- `npm run gate -- geo-solids`: pass (49/49 browser checks). Screenshots reviewed at 1920 × 1080 (light, dark,
  grayscale) and 375 × 812 in both languages, plus every preset after its actions (7 and 8 vertices, 10 edges, the
  pyramid's four triangles, the cylinder refused, the sphere, the cube net half open and flat, the cuboid net, the
  sugar net), the child and adult views, and the cone's surfaces in English.

## Term pairs (not in the glossary; the pages of this area do not use it)

geometrijsko tijelo / solid; vrh / vertex; brid / edge; strana / face; ploha / surface; ravna / flat; zakrivljena /
curved; rub / rim *(check)*; mreža / net; kocka / cube; kvadar / cuboid; piramida / pyramid; valjak / cylinder;
stožac / cone; kugla / sphere.

## Shared requests

- **models/ (coordinator), optional:** `solids` in `sim.js` (the geometry of the seven solids, the view, seen or
  hidden, the lit order, unfold and net) is pure and string-free. Nothing else uses it yet.
- **Kit, optional:** a list-valued param type (or a string param) would let `lit` be stored as "0.1.2" instead of a
  base-13 number.

## Learn tree

Suggested leaf: `arithmetic` › `geometry` › `solids` (catalogue §4.17's outline), next to `geo-triangles`. `npm run
check` warns "in no leaf yet" until the coordinator places it.

## Fresh review

A separate reviewer session read the code against SPEC.md, recomputed SPEC's numbers with its own Python geometry (all
matched), drove the page headless over about 60 loads with odd URLs, keys and clicks (no console errors), and ran its
own mutants of `sim.js`. Found and fixed:

- **`?yaw=-30` was clamped to 0** (and 390 to 359) by the kit's range before the model could wrap it; the hidden
  param's bounds are now wide, so rule 1's wrap applies (330, 30).
- **A click on a seen face could light a hidden one**: a hidden face's click target sat over the seen faces; it now
  goes underneath.
- **Asking first, the flat net gave the answer away** (two squares and four rectangles in plain view next to "Kakve
  su strane?"); it is now a "?" until the net is open.
- **The sugar mistake** was named only at the start, at the end and on the flat net; now whenever the sugar is shown
  (teacher, not while asking first).
- **The card said "?" for a count that is zero** ("Valjak nema vrhova." above "Vrhovi ?"); a kind with none is known.
- **Wording:** the cylinder's "no vertex" line (hr "šiljak" contradicted "točka u kojoj se sastaju bridovi"; en "a
  point of the solid" was false); genitive after negation ("nema nijedne", "nema nijednoga brida"); the card says
  "Strane" for a solid with flat faces only; the sphere's last line no longer speaks of flat surfaces; asking first,
  the "only what is seen" mistake no longer gives the number behind; the drag-and-click hint is now shown at the start.
- **Visible text outside strings.js:** the units and the "×" of the two-line size now come from the tables; the page
  keys are declared as V, P, O (the help overlay listed them in lower case); unused strings removed.
- **The cylinder's back rim** is dashed (or hidden with the hidden lines off) when edges are counted.
- **Test gaps from surviving mutants** closed: an edge seen through a seen face only (pyramid from below, 7 of 8
  edges with all 5 vertices seen), `onlySeen` and `done` with nothing seen or nothing to count, rounding in `clean`,
  `decode`'s last index, `openMore` from 40, `flat` only at 100, the defaults, the fixed order of items, the Solids
  table's sizes and the 48 strips. SPEC rule 3 now says the 10⁻⁶ is on Newell's (not unit) normal.
- Left as is: `lit` past the kit's maximum decodes to nothing (harmless); the remaining surviving mutants were
  equivalent (the kit always passes clean booleans and whole numbers).

## Time

Started 05:50 (2026-11-14): curriculum read, design, Python check, SPEC, model and tests, strings, page, gate and
screenshots by 06:13; the fresh review ran 06:13–06:24; its fixes, tests and the final gate by 06:32. About 45
minutes, one session.
