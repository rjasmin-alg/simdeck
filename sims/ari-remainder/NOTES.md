<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-remainder: notes

New stepper (task `docs/tasks/w3/ari-remainder.md`, catalogue §4.17, wave 3, MAT OŠ A.3.3). Rules and expected
numbers: `SPEC.md`.

## Decisions

- **An everyday story first**, as the curriculum's preporuka asks: n sweets in a bowl, d children, dealt round by
  round. One round is one step: every child gets one sweet, d leave the bowl. That is the grade 2 meaning of division
  the pupil brings (A.2.4, "dijeli uzastopnim oduzimanjem istih brojeva"), and the rounds box writes it as the chain
  `23 →(−4) 19 → … → 3`.
- **The step that fails is a step of its own** ("short"): the bowl has r < d, so each child gets a slot for the next
  sweet: the first r a dashed sweet, the others an empty slot with ✗. It shows why the dealing stops ("not one for
  everyone") instead of saying it. Then a last step, the check. Steps = q + 2, so the step count follows the params
  (the kit's `steps(params)`, as `ari-long-division`); `sim.json` `steps` is the default's (23 : 4, 7 steps).
- **Limits:** d from 2 to 10 (1 child has nothing to deal; the times tables go to 10), n from 1 to 100 (A.3.3: "do
  100"), and at most 18 rounds so a demo stays within the 20 steps of a stepper: n ≤ min(100, 19 · d − 1). For d ≥ 6
  that is the whole range to 100; for 2 children it is 37. The n slider's maximum follows d (the kit clamps n when d
  goes down); both numbers reset the demo to step 0.
- **The check has two parts**, both shown with ✓/✗ (never colour alone): `q · d + r = n` and `r < d`. The check box
  is on the stage from step 0 with `?` in place of the unknowns, so the class knows what will be checked.
- **The typical mistake** (teacher, a switch): stopping one round early, `23 : 4 = 4, ostatak 7`. The card shows the
  pupil's answer from the start ("Je li točno?"); at the round that leaves r + d the caption says "someone stops
  here"; at the end the card runs the check: the equality holds, `7 < 4` does not, `7 − 4 = 3` is the round that was
  still possible. With q = 0 there is no earlier stop: the switch is disabled with the reason. With r = 0 the wrong
  remainder equals d (24 : 4 = 5, ostatak 4): equal to the divisor is too big too (tested as a tie-break).
- **Order in the check:** `5 · 4 + 3 = 23`, količnik · djelitelj + ostatak, as the sibling `ari-checking` writes it
  ("količnik · djelitelj + ostatak = djeljenik, a ostatak je manji od djelitelja"). The catalogue row writes d · q + r;
  it is the same product, and q · d also reads as "q rounds of d sweets".
- **Drawing:** HTML and plain shapes, no K5 paper (§4.17 note). A sweet is a disc with the two twists of its wrapper
  (CSS); taken places in the bowl are hollow dashed rings, so the bowl is also the subtraction; the remainder sweets
  are a second colour **and** a ring through the disc **and** the label "ostatak r" right under them (sweets are
  taken from the front, so what is left is the end of the last row; grayscale checked). A child is a
  plain SVG figure, its number in HTML (SVG text would scale below 16 px). The bowl is rows of 10 (a hundred square at
  100). The plates hold rows of 2 to 5 sweets, the number per row chosen from the stage size so the sweets are as big as
  the box allows (3 per row on a phone with more than 5 children); the plate keeps its full size from step 0 (room for every round and the failed one), so nothing jumps while stepping.
- **Audiences** (shared switch, `Simdeck.paperColumns.audience`): teacher (default; numbers, the rounds box, the check
  box, the mistake switch), adult (the same boxes; captions say why: repeated subtraction, given out so far, why the
  remainder is less than the divisor, the check puts the sweets back), child (bigger sentence and counts, no term
  names, no rounds box or card, the check box only at the last step, one short caption line).
- **Children counted with collective numerals** in Croatian (dvoje, troje, četvero … desetero djece): "4 djece" is
  not standard; one string per d (2…10). Sweets take the kit's plural forms (1 bombon, 2–4 bombona, 5+ bombona, 21
  bombon).
- **Base 10 only** (the row does not say "any base"); **no glossary terms**, as in the sibling `ari-` pages.
- **Presets:** `sweets` 23 : 4 (default), `exact` 24 : 4 (remainder 0, the tie-break), `fewer` 3 : 5 (quotient 0),
  `largest` 47 : 6 (r = d − 1), `too-big` 31 : 4 with the mistake (the `sim.json` entry), `hundred` 100 : 7.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- The curriculum gives no example numbers for A.3.3; the presets are this page's.
- n is capped below 100 for 2 to 5 children (18 rounds, the stepper's 20 steps). Dividing e.g. 75 : 2 by single
  rounds would be 37 rounds; grade 3 does that in writing (`ari-long-division`) or by splitting the number (A.3.4).

## Sources

- The curriculum, Narodne novine 7/2019 (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html), fetched and
  read 2026-11-13 for this task: **MAT OŠ A.3.3** "Dijeli prirodne brojeve do 100 s ostatkom."; razrada "Dijeli
  brojeve do 100 s ostatkom.", "Provjerava rješenje pri dijeljenju s ostatkom.", "Rješava tekstualne zadatke."; dobar
  "Dijeli s ostatkom uz manju nesigurnost."; sadržaj "Dijeljenje brojeva do 100 s ostatkom."; preporuka "Pri
  upoznavanju dijeljenja s ostatkom u početku valja zadavati i zadatke sadržajno utemeljene u svakodnevici kako bi
  učenici pojam ostatka usvojili na razumljiv način." No example numbers. **MAT OŠ A.2.4** "Dijeli uzastopnim
  oduzimanjem istih brojeva." No grade 3–4 outcome other than A.3.3 mentions a remainder (A.3.4, A.4.3, A.4.4 read).
- Croatian textbooks for grades 2–4 were not available offline. From general knowledge of Croatian school practice,
  all *(check)*: the written form `23 : 4 = 5, ostatak 3` (textbooks may write "5 i ostatak 3", "5 (3)" or "5, ost. 3");
  "krug" for one round of dealing (the word also means a disc in geometry, `geo-compass`); the check written as
  `5 · 4 + 3 = 23`; "zdjela" for the bowl.
- Sibling pages: `ari-checking` (the check of a division with a remainder, its words), `ari-long-division` (a stepper
  whose step count follows the params), `ari-unknown-term` (the audience switch on a page without K5).

## Checks

- Numbers: a Python script independent of `sim.js` dealt every allowed pair (d 2…10, n 1…min(100, 19d − 1): 762
  pairs) round by round and compared with divmod; the most steps is 20 (n = 37, 56, 75, 94 for d = 2…5). It computed
  the six presets (q, r, steps, the bowl after each round) and the mistake answers (4 r 7, 5 r 4, 6 r 11, 6 r 7,
  13 r 9) with their checks. All agree with SPEC.md and the tests.
- Tests: 14 (`node --test sims/ari-remainder/sim.test.js`), tie-breaks first (exactly d is enough; a remainder equal
  to d is too big; fewer than d deals no round), a sweep over all 762 pairs, the presets' numbers, the page and
  `sim.json` against the model. 11 mutations of `sim.js` (> for ≥ in a round, the amount taken, ≤ for < in the check,
  the q = 0 guard and a q < 2 guard, the wrong remainder, the step count and one computed from the raw params, the
  check state, the n limit, floor for round): each fails at least one test.
- `npm run gate -- ari-remainder`: pass (63/63 browser checks). Other states were screenshotted with a separate
  Playwright script: the failed round, the check with the mistake card, 100 : 7 mid-way, 100 : 10 (ten children, the
  smallest sweets), 3 : 5 in English, the child and adult views, the phone at the end of the mistake preset. Captions
  were dumped for every step of four cases × three audiences × two languages and read; no console errors. Screenshots
  reviewed at 1920×1080 (light, dark, grayscale) and 375×812 in both languages.

## Term pairs (not in the glossary; written out in both tables)

| en | hr |
|---|---|
| division with a remainder | dijeljenje s ostatkom |
| dividend, divisor, quotient, remainder | djeljenik, djelitelj, količnik, ostatak |
| check | provjera |
| round (of dealing) | krug *(check)* |

## Shared requests

- **Promotion:** none needed; the model is small and page-specific. If `ari-long-division` or `ari-checking` want the
  "deal round by round" view of a remainder, `dealOf` and `checkOf` are pure and promotable as they are.
- **Kit, hidden controls:** `.sd-ctl { display: flex }` (kit.css) beats the `hidden` attribute the kit sets for a
  param whose `visible()` is false, so such a control stays on screen. Smallest fix: `.sd-ctl[hidden] { display: none; }`
  in kit.css. This page (and `ari-long-division`) carries that rule in its own CSS until then.
- **Kit legend:** a round hollow swatch would suit "taken from the bowl" (the kit's `hollow` is square); the page uses
  `hollow` as it is.

## Fresh review

A reviewer with no part in the build read the code against SPEC.md, loaded the page in every phase, audience and
language, and tried edge cases (n < d, n = d, r = 0, q = 1 with the mistake, 37 : 2 with 20 steps, 100 : 10, bad URL
values, the d slider clamping n). The model matched SPEC.md in every rule and number. Found and fixed:

- The mistake switch showed in the adult and child views (kit CSS beats `[hidden]`): page rule added; shared request.
- English with a remainder of 1 ("1 are left", "1 sweets"): reworded ("Left in the bowl: 1").
- Plates in up to 10 per row (one column of 11 at 100 : 10): now 2 to 5 per row; SPEC states the rule as built.
- The child never saw the check: the check box now shows at the child's last step.
- n was limited by a floored d while the kit rounds (`?n=50&d=2.6` gave 37): the model rounds too; test added.
- The "ostatak r" label was far from the remainder: sweets are taken from the front, the label sits under the last row.
- A gap before the comma and a lone remainder on a phone line: ", ostatak r" is one unbreakable group.
- The ✗ of an empty slot was text of 7–8 px on a phone: it is now drawn with CSS, not text.
- "< d stop" wrapped away from the last number: they are one unbreakable group.
- Test gaps: the mistake with q = 1 (6 : 5, 4 : 4) and steps/initial with out-of-range params now tested.
- Wording: "svaki krug uzme d" / "each round takes d"; "učenik je stao" / "the pupil stopped".

## Time

Start 2026-11-13 22:15 (brief read), done 22:50: about 35 minutes, the review included.
