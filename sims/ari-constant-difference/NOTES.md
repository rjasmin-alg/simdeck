<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-constant-difference: notes

New explorer (task `docs/tasks/w3/ari-constant-difference.md`, catalogue §4.17, wave 3), the hub of the number line
model (§5.27). Rules and expected numbers: `SPEC.md`.

## Decisions

- **One screen, three bands.** The task before and after the shift as two number sentences in one grid (the moved
  numbers on yellow, the shift written between the rows, the verdict beside); the two main number lines on one scale
  (before, after; the after line keeps hollow markers where the numbers were); two close-ups of the points that move,
  each with its jump arc and size. The main scale fits a gap of 325, so a shift of 2 is a few pixels there; the
  close-ups are where "both moved by 2" is seen, and they are the number line's zoom.
- **A sum is drawn from 0:** the first addend as a bar from 0, the second laid after it (hatched), the sum as the end
  (a diamond). Compensating moves the border between the bars and leaves the end; the mistake moves the end. The
  close-ups of a sum are the border and the end.
- **The mistakes are a choice of the step** (teacher): `one` moves only the number the shift aims at (the subtrahend;
  the first addend), `flip` moves the second number the other way (a difference treated like a sum, a sum like a
  difference). The difference's `flip` (525 − 196) is not named in the catalogue; it is the mirror of the sum's mistake
  and costs nothing.
- **"Find the wrong step" is ask-first:** presets 4 and 5 open with the result hidden (`?` and a Pokaži button, key
  V); the class decides, then the teacher reveals. A shown result can be hidden again (button, V). `hide` has no panel
  switch: the panel did not fit at 1920×1080 with it (as `ari-checking`'s cards).
- **To a round number** (key O, a stage button, not the panel, for the same fit reason): the subtrahend (or the addend
  nearer a ten) to the nearest ten, then on a second press to the nearest hundred; the student can also find the shift
  with the slider or by dragging a point on the lower line.
- **Equal additions** is preset 6 (503 − 178 = 613 − 288, `ari-column-subtraction`'s preset 1): +110 to both, with a
  caption line saying that column subtraction by equal additions does exactly this. The page says nothing about which
  method Croatian schools teach (catalogue §4.16 keeps that off the pages until the owner confirms it).
- **Numbers 0…1000** (A.3.2: grade 3 computes to 1000), a difference never below 0, a sum never over 1000; the shift is
  clamped so the moved task stays valid (`kRange`), at most ±200.
- **Audiences** (shared switch, `Simdeck.paperColumns.audience`, docs/sim-ui.md §14): teacher (the task field, the
  step choice, ask-first), adult (why it works, and the right step after a mistake), child (larger digits, one short
  line, no task field or mistakes control). No K5 paper: the §4.17 note keeps K5 to `ari-times-ten` and `ari-big-numbers`.
- **Base 10 only:** the row does not say "any base".
- **No glossary terms**, as in the sibling `ari-` pages: the school words are used directly.
- **≠ in the caption** is a monospace span: the page font has no glyph for it and the fallback drew "=/".

## The number line model (§5.27, for promotion)

`numberline.js` is pure, DOM-free and registers like a model in `models/` (`globalThis.SimdeckModels['number-line']`,
`module.exports` under node), so the coordinator can move it to `models/number-line.js` unchanged: `niceStep`,
`minorStep`, `view` (a stretch that zooms to the values, padded, snapped, floored at 0), `ticks`, `pos`, `freeLabels`,
`jump`, `valueAt` (what a drag lands on). Its tests are the first block of `sim.test.js` ("number line: …"); they move
with it. The drawing (HTML on a percentage scale, the arcs as SVG without text) is page code in `index.html`
(`lineEl`), not part of the model; `ari-mental-strategies`, `ari-unknown-term` and `ari-big-numbers` can copy it.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- The difference's `flip` mistake besides the two the catalogue names (above).
- `hide` and the round action have no panel control (fit, above).

## Sources

- The curriculum, Narodne novine 7/2019, fetched and read 2026-11-13: MAT OŠ A.3.2 (outcome, razrada, sadržaj,
  preporuka: mental addition and subtraction to 1000, the link between addition and subtraction, naming the terms),
  A.4.2 (written, to a million), grade 2 (A.2.x: *brojevna crta*, *uvećaj za / umanji za*). It does not name
  *stalnost razlike* or *stalnost zbroja*; those are the textbooks' names (the owner's request, catalogue §4.17).
- Croatian textbooks for grades 2–4 were not available offline. From general knowledge of Croatian school practice,
  all *(check)*: "stalnost razlike" and "stalnost zbroja" as the lesson names; "okrugli broj" for a multiple of ten or
  a hundred; "pomak" for the shift; "Kraj 1. pribrojnika" as the label of the border on a sum's line; "jednaki dodaci"
  for equal additions (from `ari-column-subtraction`).
- The examples 523 − 198 = 525 − 200 and 398 + 245 = 400 + 243 are the catalogue's; 645 − 203 and 503 − 178 are mine
  (503 − 178 is `ari-column-subtraction`'s preset 1).

## Checks

- Numbers: a Python script independent of `sim.js` recomputed every preset (moved numbers, both results, delta) and the
  round shifts from k = 0 and on a second press (523 − 198 → +2; 645 − 203 → −3; 398 + 245 → +2; 245 + 398 → −2;
  395 + 245 → +5 (tie: the first addend); 503 − 178 → +2 then +22; 187 − 95 → +5; 998 − 7 → out of reach). All agree
  with `sim.js` and the tests.
- Tests: 21 (`node --test sims/ari-constant-difference/sim.test.js`), tie-breaks first; rule 6 checks every shift in
  range for six tasks, both operations and the three ways; a sweep checks every view holds its points. 51 mutations of `sim.js` and `numberline.js` (each
  coefficient, the clamps and their tie-breaks, the range ends, the target tie, rounding half up, the hundred step, the
  round shift's sign and refusal, 0 not round, the lenses' want, the sum line's 0, every parse refusal, the minus
  signs, niceStep's factors and boundary, minorStep, the minSpan tie, the floor slide, the second widening, the
  tick thinning, freeLabels' boundary, the jump direction, valueAt's rounding and clamp, and after the review the cap reason, 1…4 to 10, wantShown, the views' ceiling and the trailing =): all 51 fail a test. Four
  survived the first run; tests were added (big before sum, the floor slides the stretch, the second widening) and
  one was an equivalent mutant (the pad's "at least 1" is what `ceil` already does), which simplified the code.
- `npm run gate -- ari-constant-difference`: pass (47/47 browser checks). The gate opens the defaults; the other states
  were screenshotted with a separate Playwright script (no page scroll, no sideways scroll on the phone, no text under
  16 px, no console errors): every preset, the ask-first state before and after V, the difference's `flip`, adult and
  child views, k = 0, 1000 − 3 → 997 − 0, the phone in both operations. Screenshots reviewed at 1920×1080 (light, dark,
  grayscale) and 375×812 in both languages.

## Fresh review

A separate reviewer read the folder against SPEC.md, recomputed every rule and preset (all held; `kRange` brute-forced
over 6144 cases), mutated the model, drove the page in hr/en and three audiences, and read the Croatian. Fixed from its
findings:
- **the drag moved one step, then froze the scale for good:** every move re-renders the stage, which detached the
  element holding the move/up listeners, so `up` never ran. The listeners now sit on the window (also released on
  cancel and window blur); checked in a browser at 1920×1080 and 375×812 (ten moves, ten shifts, the scale released);
- **"treba −1", "treba 1100"** in the close-ups of a mistake whose right move leaves 0…1000: `wantShown` hides it;
- **lines past 1000** (600 + 400 on 0…1200): the number line got a `ceil` option, every view uses 1000;
- **O said "out of 0…1000" at the ±200 cap**: a second reason, `cap`, with its own words;
- **O aimed at 0** (4 → 0) and called 0 round: 1…4 now go to 10, a 0 gets its own line; a refusal no longer runs into
  the "shift is 0" hint; a task with no possible shift says so instead of "drag a point";
- a test gap: nothing checked that the moved points lie inside the view (a mutation building the view from a, b only
  survived): a sweep over ten edge tasks, both operations, three ways and the range ends now does;
- Croatian polish: "se lako računa", "Za odgovor pritisni V.", the equal-additions line with a subject and both steps
  (+10 and +100), "Izbliza" for the close-ups' screen-reader label; a trailing "=" in the task field is accepted;
  unused strings removed.
Not changed: the subtrahend's colour (kit `--c2`) is near the danger red of the "should be" ring, but the ring is
dashed and round and the words say "treba"; the header legend keeps three items (the rest is labelled on the stage).

## Term pairs (not in the glossary; written out in both tables)

| en | hr |
|---|---|
| minuend, subtrahend, difference | umanjenik, umanjitelj, razlika |
| addend, sum | pribrojnik, zbroj |
| number line | brojevna crta |
| shift | pomak *(check)* |
| round number | okrugli broj *(check)* |
| constant difference, constant sum | stalnost razlike, stalnost zbroja *(check)* |
| equal additions | jednaki dodaci *(check)* |

## Shared requests

- **Promotion:** `numberline.js` to `models/number-line.js` with its test block (above), before
  `ari-mental-strategies`, `ari-unknown-term` and `ari-big-numbers` start.
- **A number line view in the kit?** The drawing (`lineEl` in `index.html`: axis, ticks, labels below, points with
  labels above or below, bars, jump arcs with a size chip and an arrowhead, a ring for "should be here", dragging with
  a frozen scale) will be wanted by the three pages above; if they copy it, it is a candidate for a kit view like K1–K5.
- Still open from the `ari-` siblings: a text param type (the task field is page code here too, as in `ari-checking`);
  the kit's `t.parts` returning one node for two placeholders (the page's `tp`).

## Time

Started 20:27, model and script agreement 20:36, first gate pass 20:40 (after the panel fit), states reviewed 20:44,
mutation tests 20:50, fresh review 20:52–21:00, review fixes, drag checked in a browser and done 21:15: about 50
minutes, one session.
