<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-mental-strategies: notes

New explorer (task `docs/tasks/w3/ari-mental-strategies.md`, catalogue §4.17, wave 3), built on the number line of
`ari-constant-difference` (§5.27). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Three rows, one scale.** Each way has its own empty number line, but the three share one mapping from numbers to
  places (all the numbers any path marks), so the start, the result and any shared number (400, 600) sit at the same
  place on every line; a dashed guide through the result shows "the same answer" once every jump is drawn.
- **An empty line, stretched.** The task says an empty number line. Drawn to scale, a jump of 3 next to one of 300 is
  a few pixels, so the empty line gives every gap at least 8 % of the line and shares the rest in proportion
  (`emptyScale`). A teacher can switch to the line to scale (with ticks, the number line model's `view`) to show that
  the empty line is not to scale.
- **Explorer with a jump counter.** The task file's class is explorer; "run three strategies side by side" is the `j`
  param (S, the stage button, or the Jumps slider): each line draws its first j jumps, a shorter path waits at its
  result (COMMON.md §11). The default and the presets show every jump; S from the end starts again at 0. The kit's
  stepper keys (→, PgDn) are not used, so `sim.json` has no `steps`.
- **To a round number** is defined so it is predictable: the nearest hundred in the direction of travel if it is no
  farther than b, else the nearest ten, then the rest split by place (SPEC rule 3). The textbooks' shorter written
  form "347 + 53 + 232 = 400 + 232" is the same path with the rest in one jump; splitting the rest keeps every later
  jump carry-free (from a hundred) and makes the three ways comparable jump by jump.
- **Compensation rounds the second number only**, and only to what is next to it. In a sum, rounding the first addend
  (398 + 245 = 400 + 243) is the same path as jumping to a round number first; rounding the second keeps the third way
  different. b goes to the hundred when it is at most 10 away, else to the nearest ten; below 10 there is nothing to
  compensate (SPEC rule 4). The round number is then split by place (290 → +200, +90). When the constant sum or
  difference would leave 0…1000 (999 − 198 = 1001 − 200), the page takes the round number first and corrects after
  (999 − 200 + 2) and says why; only when both orders leave is the way not drawn.
- **"Over a ten or a hundred", not "prijelaz".** The count of hard jumps is called "preko desetice ili stotice": a jump
  that lands on a hundred (347 + 53 = 400) is a prijelaz in the textbooks too, but it is the easy step the second way is
  built on, so "bez prijelaza" would have been false.
- **"Easiest" is a count, not a verdict:** fewest jumps over a ten or a hundred (a carry or borrow that is not a
  complement to a round number), then fewest jumps; ties all marked, but nothing is marked when every way ties; shown
  only when every jump is drawn, so a class can guess first.
  A jump that lands on or leaves a round number of the next place (347 + 53 = 400, 400 − 53 = 347) counts as easy: it
  is the textbooks' "do stotice" step *(check)*.
- **The written form** is the curriculum's "zapisivanje djelomičnih rezultata": per row the task with the second
  number split as the path splits it ("347 + 285 = 347 + 200 + 80 + 5") and then the current partial result with what
  is left ("= 627 + 5"), ending "= 632". The partial results are also the numbers under the landings. A wrong path is
  written with "≠" after the task.
- **The mistake** (teacher): compensation's first number moves the wrong way (as `ari-constant-difference`'s `flip`):
  523 − 198 → 521 − 200 = 321, the row dashed red with "treba 325" and a ring where it should land; the caption says
  why in the words of the hub.
- **Audiences** (shared switch, `Simdeck.paperColumns.audience`): teacher (task field, mistake, line to scale), adult
  (the line to scale; the caption adds why each way works and how "easiest" is counted), child (bigger digits, no
  sublabels or crossing counts, one short caption line, no task field). No K5 paper (§4.17 note).
- **Base 10 only:** the row does not say "any base". **No glossary terms**, as in the sibling `ari-` pages.

## The number line model (§5.27)

`numberline.js` is copied unchanged from `sims/ari-constant-difference/numberline.js` @ f2a51d4 with its test block
(first four tests of `sim.test.js`); this page uses `view`, `ticks`, `pos`, `freeLabels` and `jump`. When the
coordinator promotes it to `models/number-line.js`, the page should include it from there and drop the copy and its
tests.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- The task's model is "reuse its model"; the empty line's layout (`emptyScale`, `xOf`) is new, in `sim.js` (Shared
  requests).
- The teacher's "show a typical mistake" is one mistake (compensation the wrong way); the catalogue names none.

## Sources

- The curriculum (Narodne novine 7/2019), MAT OŠ A.3.2, as read for `ari-constant-difference` on 2026-11-13 (its
  NOTES, Sources): "mentalno … rastavljanjem broja na zbroj višekratnika dekadskih jedinica ili zapisivanjem
  djelomičnih rezultata" (the catalogue's seed), numbers to 1000 in grade 3. Not fetched again in this session.
- Croatian textbooks for grades 2–4 were not available offline. From general knowledge of Croatian school practice,
  all *(check)*: "prijelaz desetice / stotice" for a carry over a ten or hundred; "okrugli broj"; "prazna brojevna
  crta" for the empty number line; "kompenzacija" as the name of the third way (the textbooks may only say "stalnost
  zbroja / razlike", which the page gives as the subtitle); "do okruglog broja" as the name of the second way;
  "skok" for a jump on the line; the written chain "347 + 285 = 347 + 200 + 80 + 5 = 547 + 80 + 5 = …".
- Examples: 347 + 285 is the catalogue's (from the curriculum's razrada); 523 − 198 and 398 + 245 are
  `ari-constant-difference`'s; 632 − 285 and 432 + 256 are mine.

## Checks

- Numbers: a Python script independent of `sim.js` recomputed every preset (each path's jumps, their kinds, the
  result, crossings, the easiest) and then 53,036 tasks (a in steps of 7, b 0…59 and in steps of 13, both operations,
  mistake on and off): every jump size and kind agrees with `sim.js`, and the presets with SPEC's table. The reviewer's
  own re-implementation agreed on 675,444 tasks before the review fixes.
- Tests: 24 (`node --test sims/ari-mental-strategies/sim.test.js`), tie-breaks first; a sweep over 14 × 18 tasks in
  both operations checks every path lands on the result inside 0…1000, each jump starts where the last landed, and
  splitting and the round way only move one way.
- Mutations: 54 mutations of the final `sim.js` (every clamp, both round distances and their ≤, the hundred-then-ten
  order, compensation's below-10, NEAR and its ≤, the hundred not 0, the ten's half-up, the shift's sign in a sum, the
  mistake, both orders, `leaves` at each end, R split by place, the zero-shift guards, carry and borrow, "place" before
  "round", landing vs leaving, the next place, the empty line's floor, numeric sort and dedup, interpolation, the
  easiest key order, ok-only, the all-tied rule, j's clamp and default, shown, at, the marks, the scale view's pad,
  the rest after the first jump, every parse refusal and the neg boundary). 49 fail a test; 5 are equivalent: a ten
  jump of exactly b gives the same sizes as splitting b; the hundred's half-up (at a 50 the hundred is 50 away, past
  NEAR); the thousands digit can never carry inside 0…1000; for |s| a power of ten the next place's "round" test gives
  the same answer; `sizes` reads `mistake` only for compensation.
- `npm run gate -- ari-mental-strategies`: pass (47/47 browser checks). Further states screenshotted with a separate
  Playwright script (no page scroll at 1920×1080, no sideways scroll at 375×812, no text under 16 px, no console
  errors): j = 0, 1, 2, 3 on a difference, every preset, the mistake in hr and en, the line to scale, adult and child
  views, child on the phone, b = 0, compensation out of range (1 + 298), S pressed from the end. Screenshots reviewed
  at 1920×1080 (light, dark, grayscale) and 375×812 in both languages.
- `npm test` (10633 pass) and `npm run check` (0 errors).

## Fresh review

A separate reviewer read the folder against SPEC.md, re-implemented the rules (675,444 tasks, no difference), recomputed
the presets and edge tasks, mutated the model, drove the page in hr/en and three audiences, and read the Croatian.
Fixed from its findings:
- **the out-of-range caption named the wrong number** with the mistake on (948 "out of range"): it now names the first
  number the path really leaves 0…1000 at (`over`), and the row says "the path", not "the first number";
- **child view on a phone** kept two columns (a 111 px line, overlapping labels): the child override is repeated in
  the phone layout;
- **"bez prijelaza" on the round way** contradicted the school term: the hard jumps are now "preko desetice ili
  stotice" (SPEC rule 5);
- **compensation picked implausible round numbers** (347 + 51 → 298 + 100, 432 + 256 → 388 + 300, 347 + 3 → 340 + 10):
  rule 4 now rounds to a hundred only within 10, else to a ten, and not below 10; the round number is split by place;
- **"compensation does not work"** for 999 − 198 and 1 + 298, where it is natural: the round number first, then the
  correction (`order: 'fix'`), with a caption line;
- a red "should be" ring on a correct compensation (k = 0 with the mistake on);
- **S dropped the active preset** (R then reset to the defaults): S keeps it;
- test gaps: a mistaken difference below 0, numeric sort of the empty line, 500 − 500 in the field, a = NaN, the scale
  view's padding;
- Croatian and wording: "tri načina" instead of "tri puta" (title, stage, captions); the compensation captions and
  explanations in school words (povećamo / smanjimo za, umanjenik i umanjitelj); preset names and hints ("umanjitelj
  blizu stotice"; no "digit past 9"); "Tipka S"; "na sve tri crte"; the easiest rule in one clear sentence; nothing
  marked easiest when every way ties; "≠" on the mistake's written form; typing a new task shows all its jumps.
Not changed: the compensation row is written in the jump form (347 + 285 = 347 − 5 + 290…) with the constant-sum form
(342 + 290) as its first partial result; the teacher's mistake preset stays in the child view's list (the kit lists
every preset); presets open with every jump drawn (S from the end starts at 0); `?a=abc` takes the default (the kit's
URL parsing, not the model); the result's legend swatch is the kit's square.

## Term pairs (not in the glossary; written out in both tables)

| en | hr |
|---|---|
| addend, sum; minuend, subtrahend, difference | pribrojnik, zbroj; umanjenik, umanjitelj, razlika |
| empty number line | prazna brojevna crta *(check)* |
| jump | skok *(check)* |
| splitting (by place value) | rastavljanje (po mjesnim vrijednostima) |
| to a round number | do okruglog broja *(check)* |
| compensating; constant sum, constant difference | kompenzacija *(check)*; stalnost zbroja, stalnost razlike *(check)* |
| crossing (a ten, a hundred) | prijelaz (desetice, stotice) *(check)* |
| partial result | djelomični rezultat |

## Shared requests

- **Number line model:** promote `numberline.js` (already requested by `ari-constant-difference`); then point this page
  at `models/number-line.js`. Add to it, additively, the **empty line** layout from this page's `sim.js`:
  `emptyScale(values, minGap)` (marked numbers in order, each gap at least minGap, the rest in proportion) and
  `xOf(line, v)` (an empty line or one to scale). `ari-unknown-term` and `ari-big-numbers` may want both.
- **A number line view in the kit** (also asked by `ari-constant-difference`): this page draws the same axis, arcs with
  size chips and arrowheads, points and labels (`lineEl` in `index.html`), plus two-level chip and label staggering
  for crowded jumps.
- Still open from the `ari-` siblings: a text param type (the task field is page code here too); `t.parts` returning
  one node for two placeholders (the page's `tp`).

## Time

Started 21:00 (brief read), model and script agreement 21:10, first gate run 21:13 (panel too tall: the hidden task
params showed), gate pass and states reviewed 21:17, mutations 21:19, notes 21:20, fresh review 21:20–21:30, fixes,
second gate pass, 53,036-task cross-check and mutations again, done 21:37: about 40 minutes, one session.
