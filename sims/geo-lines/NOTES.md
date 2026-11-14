<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# geo-lines: notes

New explorer (task `docs/tasks/w3/geo-lines.md`, catalogue §4.17, wave 3, MAT OŠ C.3.1, C.3.2). Rules and expected
numbers: `SPEC.md`. Hub of the squared-paper model (catalogue §5.27): `paper.js`.

## Decisions

- **One plane, three modes.** The concept has four sentences (ends; the drawing is only a picture; two lines cross or
  are parallel, perpendicular at a right angle; parallels by sliding a set square). They share one squared-paper
  plane and one model, so they are three modes of one explorer, not three sims: `Dijelovi` (segment, ray, line and
  point T), `Dva pravca` (p and q, turn q), `Trokut` (the set square slides along the ruler). Each mode is a step of
  the same lesson (C.3.1 then C.3.2).
- **Exact geometry.** Points are corners of the squares; lines go through corners with whole steps; S is an exact
  fraction. So "is T on p?" and "are p and q parallel?" have exact answers, never a pixel tolerance, and the
  near-miss preset (T one square off) is truly off.
- **The drawing is not the line.** In `parts` the drawn part is finite (the slider "Produlji crtu" lengthens it, as
  the curriculum asks: "neograničenim (zornim) produljivanjem crte preko krajnjih točaka dužine") and the answer
  about T is about the figure, never about the drawing. The open ends carry a short dotted tail ("goes on"); a
  segment has none. When the answer is shown, the dashed continuation runs through T (beyond) or the dashed line
  through A and B appears (outside, off), and a small red mark shows the miss.
- **Ask first** (`hide`, V) in `parts` and `two`, with answer buttons on the stage (Pripada / Ne pripada; usporedni /
  okomiti / sijeku se). The class's answer is kept (`guess`) and judged; a wrong answer that is the typical mistake
  gets its sentence highlighted. The answer is forgotten as soon as the picture changes (a point dragged, q turned),
  so a stale verdict is never shown. "Sijeku se" for perpendicular lines is right with more to say.
- **The crossing runs away.** q turns through the 48 directions with whole steps up to 6, ordered by angle, so
  the slider turns q smoothly and every position has an exact S. Off the sheet S is an arrow at the edge; "Veći
  papir" (2×, 4×) shows it, with the sheet outlined.
- **Slanted perpendicular lines** (2, 1) and (1, −2) are a preset: perpendicular is not "across and up".
- **The set square** is drawn plainly (a right-angled triangle, a ruler with centimetre ticks). One slider step moves
  the drawing edge to the next grid line of its direction, so the edge passes through T exactly at one step (the
  target); past it the caption says to slide back. Tool `perp` lays the ruler on p and slides the set square along
  it. "Trokut" is the curriculum's word ("ravnalom i jednim ili dvama trokutima").
- **Dragging**: A, B and T are dragged on the paper; a click on empty paper moves T. The point params stay hidden in
  the panel (the URL and the presets carry them). There is no keyboard way to move a point; the presets and the
  sliders cover every demo *(a possible addition: arrow keys for T)*.
- **Three audiences** through `Simdeck.paperColumns.audience` (the shared stored choice); no kit view (the §4.17
  notes keep K5 for `ari-times-ten` and `ari-big-numbers`).
- **Panel space**: at 1920 × 1080 the panel fits only with short mode names (Dijelovi / Dva pravca / Trokut) and
  "Veći papir" in mode `two` only (mode `parts` always uses the sheet at zoom 1); the Croatian title was shortened
  to one line ("Točka, dužina, polupravac i pravac; sjecište"), which the panel needed.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- The Croatian title is "Točka, dužina, polupravac i pravac; sjecište", not a word-for-word "…; pravci koji se
  sijeku": the longer one wraps to two lines at 1920 × 1080 and the panel then overflows by 3 px.
- Base 10 does not apply (no numbers are computed); no base control.

## Sources

- The national curriculum for mathematics, Narodne novine 7/2019
  (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html), **read on 2026-11-14** in this session: MAT OŠ
  C.2.1, C.3.1, C.3.2 (quoted in SPEC.md), C.4.1–C.4.5 (no lines in grade 4) and C.5.1 (degrees and constructions of
  parallels "posebno precizno" are grade 5). "Pripada li točka T pravcu p?" is the curriculum's own example task.
- Croatian textbooks for grade 3 were not available offline. **Marked *(check)*:**
  - "polupravac AB" as the name of a ray from A through B (books may say "polupravac s početnom točkom A" or name it
    with a small letter);
  - "početna točka" for the ray's endpoint;
  - the signs ∥ and ⊥ (the curriculum says only "matematičke oznake za okomitost i usporednost");
  - S as the name of the intersection (sjecište) in the textbooks' examples;
  - "trokut" for the set square (the curriculum's word; schools also say "geotrokut");
  - "Produlji crtu", "korak" (one whole step along the grid) as the slider's words;
  - the construction order (set square on p, ruler against the other edge, slide) as the books show it.
- The misconceptions (the drawing is the line; lines that do not meet on the paper are parallel; perpendicular means
  across and up) are the classic ones of the school literature on lines, from general knowledge *(check)*.

## Checks

- Numbers: an independent Python script (exact fractions, brute force) recomputed every preset and SPEC example:
  the step k of T, collinearity, the near miss (1 square; 0.5 for the fraction case), S for meet / far / perp
  ((7, 3), (−8, 3), (12, 6)), the run-away sequence 7, 2, −3, −8, −13, −18, the slide targets 7 and 13, the corner
  (8/5, 24/5), reachMax 5 and 18, and the 48 directions. All agree with `sim.js` and the tests.
- Tests: 36 (`node --test sims/geo-lines/sim.test.js`), tie-breaks first, then paper.js, then the three modes, then
  the generic block.
- `npm run gate -- geo-lines`: passes (see the report). Extra screenshots with a separate Playwright script: every
  preset, shown and hidden, the class's wrong answers, adult and child views, zoom 2, the same line, past the target,
  both languages, the phone; no console errors; no page or panel scroll at 1920 × 1080 in any mode and audience.

## Term pairs (not in the glossary; written out in both tables)

| hr | en |
|---|---|
| točka | point |
| dužina, krajnje točke | segment, endpoints |
| polupravac, početna točka *(check)* | ray, starting point |
| pravac | line |
| sjecište | intersection (crossing point) |
| usporedni pravci (p ∥ q) | parallel lines |
| okomiti pravci (p ⊥ q) | perpendicular lines |
| pravci koji se sijeku | lines that cross |
| pravi kut | right angle |
| ravnalo | ruler |
| trokut (geotrokut) *(check)* | set square |
| kvadratna mreža | squared paper |

## Shared requests

- **Promote `paper.js` to `models/squared-paper.js`** (catalogue §5.27): geo-compass, geo-angles, geo-triangles and
  geo-perimeter-area build on it. It is pure, string-free and registers as `SimdeckModels['squared-paper']`; its
  tests are the "paper:" block in `sim.test.js` (move them to `models/squared-paper.test.js`). The compass (a circle
  through corners, inside / on / outside by comparing squared distances) is not in it yet: geo-compass adds it.
- The page's `Paper()` helper (squared paper in SVG with HTML labels at 1 : 1, a view that zooms, a ruler with ticks,
  a set square, a right-angle mark, an arrow to a point off the view) is a candidate for a kit view when the other
  `geo-` pages need the same drawing.

## Learn tree

Suggested leaf (catalogue §4.17): `arithmetic` → `geometry` "Geometrija" → `lines`.

## Fresh review

A fresh agent read SPEC.md against the code, the page and the strings, ran 98 mutants of `sim.js` and `paper.js`
(outside the repo) and opened 31 URL states in a browser (no console errors, no scroll; dragging works; the hidden
states show nothing of the answer on the paper, the top box, the caption or the aria-label). Found and fixed:

- `cOutSegment` claimed T past **A** would lie on ray AB; split into `cOutSegB` / `cOutSegA`.
- The preset names gave the answer away while the class was asked ("Okomiti pravci, koso", "Izgleda da
  pripada…"); now "Dva kosa pravca", "Je li T na pravcu?".
- The true answer "Ne pripada" was drawn as a wrong answer (red, dashed, ✗); the answer is now a plain box, and only
  the class's answer carries ✓ / ✗.
- The B-on-A caption never showed (the page wrote the moved B back into the params); it no longer writes it back.
- "Q leži na p" (capitalised q); V in mode `slide` silently armed "ask first" for the other modes; `''` and null
  became 0 instead of the default; p's step was clamped before it was reduced ((8, 4) became (3, 2)); a dead position
  on the reach slider when reachMax is 0 (the slider is hidden then); "Predaleko" and "T je na p" twice (top and
  caption); "pravac" in the edge and mistake sentences for a ray; the segment mistake (T on the line but outside the
  segment) had no highlight; "razmak svuda isti" (distance, out of scope) removed from `cParallel`.
- Croatian: "Kraj: nema krajnjih točaka" → "Krajnje točke: nema ih"; "usmjeren kao p" → "usporedan s p"; "Pripadala
  bi …" word order; `s1_perp` reworded; "na 2 puta većem papiru"; "kliži" → "pomiči" *(check)*.
- The set square had a leg as long as the way to T (a sliver); it is now one size (legs 7 and 4 squares).
- Test gaps: 6 new tests from the surviving mutants (the top edge of the box, the slide direction, the 45° miss
  tie, reachMax rounding both ways, a crossing between corners, `inPaper` at zoom 2, the negative side of the slide,
  T on p with the perpendicular tool, legSign 0, rounding of params, `viewOf`). 36 tests. The other survivors are
  equivalent (listed in the review: clip of a single point, need with k < 0 vs k ≤ from, the same-line early return
  in judge, rounding in cornerAt, the segment guards on reach).
- Not changed: the child view honours a `zoom` in the URL although its control is hidden (the URL is the teacher's
  choice); the dative strings double as the locative in the child question ("Je li T na pravcu p?"), correct for these
  three nouns; the `p` label can sit on the ruler for a steep p in the perpendicular construction; S's label can touch
  q at very flat angles.

After the fixes a sweep of 300 URL states (every mode, kind, position of T, answer, ask-first and audience) gave no
console errors and no page or panel scroll at 1920 × 1080.

## Time

Started 01:53 (2026-11-14): curriculum read and the model designed first, then paper.js, sim.js, tests, strings and
page, the gate and the screenshots; fresh review and its fixes; status ready and the gate passing at 02:28. About 35
minutes of wall-clock time, one session.
