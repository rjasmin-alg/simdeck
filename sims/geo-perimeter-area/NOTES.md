<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# geo-perimeter-area: notes

New explorer (task `docs/tasks/w3/geo-perimeter-area.md`, catalogue §4.17, wave 3, MAT OŠ D.3.3, D.4.2). Rules and
expected numbers: `SPEC.md`. Builds on the squared-paper model of `geo-lines` (catalogue §5.27): `paper.js` is its
copy.

## Decisions

- **One plane, three modes.** The concept has three sentences that share one sheet of squares: P counts squares and
  o counts sides on the edge (`Boji`, colour squares and watch both), the same squares give one P and many o
  (`Pravokutnici`, the curriculum's twelve squares with a table), and o is the length of the edge (`Obiđi rub`, walk
  round it one side at a time). They are three modes of one explorer.
- **Counted, never a formula.** P is the count of coloured squares, o the count of square sides with an uncoloured
  neighbour; a rectangle's o is written as the sum of its four sides (4 cm + 3 cm + 4 cm + 3 cm = 14 cm), which is
  D.3.3's "zbroj duljina stranica"; 2 · (a + b) and a · b appear nowhere.
- **One square is 1 cm** (as in geo-lines and geo-compass): one square is 1 cm², one side 1 cm. Units are always
  written: o in cm, P in cm².
- **Shapes are joined by a whole side.** Squares that touch only at a corner are two shapes, each with its own P and o;
  with two or three shapes the top shows each shape's P and o, never their sum (a sum is no shape's perimeter). A
  hole's edge is part of the edge (o of a ring of 8 around one empty square is 16).
- **The walk** is anticlockwise from the lower-left corner of the lowest, leftmost square, numbering each side of the
  edge on the side itself (two sides' middles are at least 0.7 of a square apart, so numbers do not overlap at
  1920 × 1080, even in a notch one square wide; on a phone a square is too small for them, so only the last number
  walked shows). At a corner where two squares meet only at their corners it turns left, staying with its
  square; a hole's edge is walked after the outer one, and the caption says why. A seeded test walks 300 random
  shapes and checks every side of the edge is walked exactly once; an independent Python script agrees on P, o, the
  shapes and the holes (8-connected empty regions, the dual of side-joined shapes).
- **What one square does** (rule 6): after a click the caption says how P and o changed and why (4 − 2k: each shared
  side leaves the edge, each free side joins it), so `notch` shows P growing while o stays.
- **The twelve squares**: one stage button per rectangle (short side first, 1 × 12, 2 × 6, 3 × 4), the squares
  numbered 1 … n so the class sees they are the same, each side labelled with its length, and a table that fills a
  row each time a rectangle's o is shown (the curriculum's "bilježite im površinu i opseg"). Once every row is filled
  the named mistake: same P, o from 14 to 26. The slider `Broj kvadrata` (1–20; 1 × 20 still leaves room for the sides' lengths beside the table) gives other numbers (13: only
  1 × 13; 16: 4 × 4 with o = 16 cm and P = 16 cm², the same number for different things).
- **Ask first** (V) in modes `paint` and `twelve`: the numbers, the squares' numbers and the current row's o are
  hidden; the sides' lengths stay (the class adds them). There are no answer buttons: the answers are numbers, which
  the class says aloud. The walk is not hidden, it counts as it goes.
- **The squares live in the URL** as `cells=` (one hex number per row): the kit's URL keeps only control params, so
  the page writes and reads `cells` itself, and only when the squares differ from the preset's (or the defaults').
  A reload keeps a drawing.
- **English symbols**: English textbooks write the perimeter P and the area A; the English page uses them, the
  Croatian page o and P (symbols are strings, `symO` and `symP`). The model's names stay o and P.
- **Three audiences** through `Simdeck.paperColumns.audience` (the shared stored choice); no kit view.
- **Reuse**: `paper.js` is unchanged from geo-lines (its tests are kept in `sim.test.js`); only `cornerIn` is used
  today. The unit-square functions are `logic.area` in `sim.js`: pure, string-free, for the promotion (Shared
  requests).

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- D.3.3 also names the perimeter of a triangle; on squared paper a triangle's slanted sides are not whole, so
  triangles are left out (geo-triangles measures sides). Dm², m² and converting units (D.4.2's "prošireni sadržaj")
  are left out too.
- The walk has no clicker key of its own: an explorer has no steps, and → / PgDn are the kit's. N (next side) and the
  stage's buttons step it.

## Sources

- The national curriculum for mathematics, Narodne novine 7/2019
  (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html), **read on 2026-11-14** in this session: MAT OŠ
  D.3.3 and D.4.2, quoted in SPEC.md (the twelve squares, "lik površine 8 jediničnih kvadrata", "dva lika iste
  površine mogu imati različite opsege", o = 12 cm, P = 8 centimetara kvadratnih, no formulas).
- Croatian textbooks for grades 3 and 4 were not available offline. **Marked *(check)*:**
  - "rub lika" for the edge, and "stranica kvadrata na rubu" as the phrase for what is counted;
  - "obiđi rub" / "obilazimo rub" for walking round the edge, and the walk's direction (anticlockwise from the lower
    left; a book may go clockwise from the top left);
  - "jedinični kvadrat" on the page (the curriculum's word) next to "kvadrat" in the child's short sentences;
  - the order "b × a", short side first (1 × 12, 2 × 6, 3 × 4), as in the curriculum's own sentence;
  - the English textbook symbols P (perimeter) and A (area).
- The misconceptions (perimeter and area the same; same area so same perimeter; same perimeter so same area;
  counting the squares along the edge; one more square always lengthens the edge; cm and cm² mixed) are the
  classic ones for this topic, from general knowledge *(check)*.

## Checks

- Numbers: an independent Python script (brute force over squares, no code shared) recomputed every preset (P, o,
  squares on the edge, shapes, holes), the rectangles of n = 1, 12, 13, 16, 18, 20, 24, the notch and U with one or
  two more squares, and 300 random shapes (P, o, shapes, holes, and that the walk covers every side of the edge
  exactly once). All agree with `sim.js` and the tests.
- Tests: `node --test sims/geo-perimeter-area/sim.test.js`, tie-breaks first, then the unit squares, the three modes,
  paper.js (copied) and the generic block.
- `npm run gate -- geo-perimeter-area`: passes. A Playwright sweep of URL states (every preset, the walk at its start,
  middle and end, a ring with a hole, 13 and 24 squares, the empty paper, every audience, both languages, 375 × 812)
  gave no console errors, no page scroll at 1920 × 1080 and nothing sideways at 375 × 812; a scripted session coloured
  and erased squares by click and by drag (P and o and the caption's change right), reloaded (the squares kept),
  pressed V, the rectangle buttons, N and the walk's buttons. Screenshots of each mode reviewed in light, dark and
  grayscale.

## Term pairs (not in the glossary; written out in both tables)

| hr | en |
|---|---|
| opseg (o) | perimeter (P) |
| površina (P) | area (A) |
| jedinični kvadrat | unit square |
| kvadratna mreža | squared paper |
| rub lika *(check)* | edge of a shape |
| centimetar kvadratni (cm²) | square centimetre (cm²) |
| lik | shape |
| pravokutnik, kvadrat, stranica | rectangle, square, side |
| obići rub *(check)* | walk round the edge |

## Shared requests

- **Add unit squares to `models/squared-paper.js`** when geo-lines' `paper.js` is promoted (catalogue §5.27):
  `logic.area` in `sim.js` (`norm`, `edges`, `pieces`, `walk`, `measure`, `toggle`, `rect`, `rects`, `fromRows`) is
  pure and string-free and has its own tests (rules 1–7 in `sim.test.js`).
- **A hidden free-text param for the kit's URL** (or a documented way for a page to keep its own query key): the page
  writes `cells=` itself with `history.replaceState`; it works because the kit keeps unknown keys, which is not
  promised in docs/sim-ui.md.

## Learn tree

Suggested leaf (catalogue §4.17): `arithmetic` → `measuring` "Mjerenje" → `perimeter-area`.

## Fresh review

A fresh agent read SPEC.md against the code, the page and the strings, ran mutants of `sim.js` in a copy outside the
repo, and opened URL states in a browser (no console errors, no scroll; clicks and drags, V and N right). Found and
fixed:

- Asking first, the paper's aria-label still said how many squares were coloured (P): it now says only that area and
  perimeter are hidden.
- At 375 × 812 a square is about 13 px, too small for the walk's numbers, which overlapped: on a phone only the last
  number walked shows.
- "The same number" (rule 10) compared the sums over several shapes: only one shape now (SPEC rule 10 says so).
- With 23 or 24 squares the sides' lengths ran into the table: the slider goes to 20 (1 × 20 leaves two squares each
  side); the model's rectangles of 24 stay tested.
- Croatian agreement: "Prijeđena je 1 stranica / Prijeđene su 3 stranice / Prijeđeno je 5 stranica", "Ista 4
  kvadrata složena su", "od 1 kvadrata"; English "1 square makes". Plural forms in both tables.
- Walking two shapes, at the boundary the top named the next shape with the last shape's count: it names the shape
  just walked (`lastPiece`).
- After a drag over several squares the caption described only the last square: it now gives the drag's whole change
  of P and o.
- SPEC: the child's twelve caption, the edge mistake only for one shape, what `decode` drops, and a tie-break that
  cannot occur removed.
- Test gaps from the surviving mutants: the walk's start when the leftmost column is not in the lowest row, each
  shape's squares in reading order, odd remainders of x0 and y0, `decode` with a stray character, `norm` and triples,
  `encode` and duplicates, `jump` across shapes, holes in walk mode, `square` false, `seen` with one row, the
  same-number rule over two shapes. The surviving turn-order and direction mutants are equivalent (at a corner where
  two squares meet only at their corners, only left or right is possible; two loops never start at one corner).

## Time

Started 04:15 (2026-11-14): curriculum read and the model designed first, then sim.js, the Python check, SPEC, tests,
strings and page, the gate and the screenshots, the fresh review and its fixes. Status ready and the gate passing at 04:43: about 28 minutes of
wall-clock time, one session.
