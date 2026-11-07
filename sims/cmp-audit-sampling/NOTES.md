<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-audit-sampling: notes

New explorer (task `docs/tasks/w3/cmp-audit-sampling.md`, catalogue `cmp-audit-sampling` §4.13; builds on the
evidence trail of `cmp-policy-to-record`, §5.24). Rules and expected numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** the auditor's view beside the truth. The grid shows every occurrence with the
  failed ones hatched and the last sample filled; exceptions (sampled and failed) are highlighted. The side card
  "The last sample" puts the conclusion ("No exceptions: the control operates") next to "In truth: 5 failed (2 %)"
  and a verdict (missed / right / caught). The default preset is a sample that finds nothing while 5 of 250 failed;
  preset 3 (a clean control) shows the auditor exactly the same "no exceptions".
- **Exact chance and the formula side by side.** The draws are without replacement (an auditor never tests a ticket
  twice), so they converge to the hypergeometric chance, not to 1 − (1 − r)ⁿ. The page shows both: the formula (the
  concept, the catalogue's "about 60 %" miss) and "exactly, for these 250" (41 % vs 40 % for the default). For small
  populations they differ more (a monthly control: 17 % vs 16 %; testing all 12 finds every failure, which the
  formula never says). The caption names both.
- **The failed share is rounded to whole items** (k = round(rate × N), halves up) and the page shows the true share
  k ÷ N (3 of 250 = 1.2 %, 1 of 12 = 8.3 %); the formula uses k ÷ N, so the numbers agree with the grid.
- **Streams per sample** (SPEC rule 2): the population and every sample have their own seeded stream, and a pick
  is a partial Fisher–Yates, so raising the rate only adds failed items and enlarging the sample only adds tickets
  to every sample. Dragging the sample-size slider up never turns a find into a miss, which keeps a live demo
  honest.
- **Frequency sets the population** (4, 12, 52, 250, 1000 a year) with a control named for each (restore tests,
  admin-rights reviews, backup checks, change tickets, access requests), and the usual sample from common practice
  (2; 2–5; 5–15; 20–40; 25–60). The table on the stage marks whether n is below, inside or above the usual range;
  clicking a row picks the frequency (the panel has the same choice as numbers).
- **Two extra numbers that answer "how many is enough":** the sample that finds at least one exception with 95 %
  chance (112 of 250 for 2 %; 149 for a large population, in the explanation), and what zero exceptions supports
  (rates above 11 % ruled out at 95 % for n = 25). Both are the "no exceptions is not no failures" point in numbers.
- **One exception** is shown as its own outcome ("extend the sample or report a finding"); the extension itself
  (a second stage) is out of scope.
- **Sampling model in `sampling.js`**, pure and wordless, registered as `SimdeckModels.sampling`, ready for
  `models/sampling.js`: its own mulberry32 (the same stream as `Simdeck.rng`, tested), stream seeds, pick,
  population, sample, conclude, exact chances, formula, size for a target, bound, run.
- **No truth toggle.** A switch to hide the failed items (for a class guessing first) was tried and dropped: the
  numbers card, the bars' expected ticks and the captions all reveal the rate, and hiding all of them would leave
  a second page. The lecturer can ask for the guess before pressing D.
- **Draws:** a slider (0–1000) plus buttons D (+1) and M (+100), disabled with a reason at 1000; N gives a new
  population (seed + 1). The default is one draw so the page opens on the contrast, not on an empty card.
- **The firm is unnamed** ("change tickets in the audit year"); the stage foot says once: simplified, not legal
  advice, made-up firm and numbers.
- **Marks** (grayscale checked): not sampled hollow; failed hatched with ✗ in the danger colour; sampled and fine
  filled (series 1) with ✓; exception highlighter fill, thick ink outline, ✗; the tally bars: no exception hatched,
  one filled series 1, two or more filled ink, expected share a tick with a triangle (accent). Glyphs are CSS
  `::after` content and dropped where cells are too small (1000 items, and 250 on a phone); the patterns still
  carry the meaning.
- **Grid:** a square, ⌈√N⌉ columns, cells sized from the stage container (`cqw`/`cqh`), at most 7 rem.
- **No glossary terms** (`[[…]]`); pairs are written out in the explanation (Croatian bold, English in italics in
  brackets), as `cmp-policy-to-record` does. The page does not link `glossary.js`.

## Deviations from the task

- **Reusing the evidence-trail model:** `models/` holds no `trail.js` yet, and none of `sims/cmp-policy-to-record/trail.js`
  (periods, coverage of periods by records, the walk from policy to records) is used by sampling, which needs a
  population of occurrences and draws from it. Nothing was copied; the link is conceptual (the population here is
  the records the trail leads to, said in the explanation, and `related` names `cmp-policy-to-record`). If the
  coordinator wants the population laid out by month from `trail.periods`, that is a small later change.
- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow only
  `sims/cmp-audit-sampling/`; the open questions are in the report instead.
- `n` is capped at 250 (the slider); with 1000 items a sample above 250 is not offered.

## Sources

- ISA 530 *Audit Sampling* (IAASB). *(check: paragraph numbers; the Croatian translation's title, "Revizijsko
  uzorkovanje", not checked)*
- ISA 330 (tests of operating effectiveness of controls over the period). *(check)*
- PCAOB AS 2315 *Audit Sampling* (public; sample sizes for tests of controls from the tolerable rate and the allowable
  risk). *(check)*
- ISO 19011:2018 Annex A.6 (sampling in management-system audits) and ISO/IEC 27001:2022 clause 9.2 (internal audit),
  by number only, never quoted. *(check: the annex number, from the edition's contents, not checked against a copy)*
- The frequency → usual sample table: common practice in tests of IT general controls, published by several audit
  firms; values differ by firm and the control's risk. *(check: no single primary source; the page says it is common
  practice, not a rule)*
- The formula, the hypergeometric chance, the size for 95 % and the bound: standard probability, checked by the
  Python script in `SPEC.md` (exact chances with `math.comb`, the draws with a port of mulberry32 and the pick).
- All numbers on the page are illustrative (the page says so once).

## For the owner

From catalogue §4.13, "Where Croatian and EU practice matters": nothing in that list concerns this entry (no
Croatian body, threshold, retention period or fine is used). Not on the page:

- Whether Croatian practice (HZN's HRN EN ISO 19011, or the Croatian ISA translation) uses *odstupanje* or *iznimka*
  for an exception in tests of controls *(check)*.

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place:

- *audit sampling* (revizijsko uzorkovanje), *sample* (uzorak), *population* (populacija), *sample size* (veličina
  uzorka).
- *exception* / *deviation* (odstupanje), *deviation rate* (stopa odstupanja), *finding* (nalaz, as in
  `cmp-policy-to-record`), *extending the sample* (proširenje uzorka), *test of a control* (test kontrole).
- *change ticket* (zahtjev za promjenu), *access request* (zahtjev za pristup), *restore test* (test obnove),
  *admin-rights review* (pregled admin. prava), *backup check* (provjera kopija).
- *failed* (neispravan): an occurrence where the control did not work.

## Shared requests

- **Promote `sampling.js` to `models/sampling.js`** if `cmp-restore-evidence` or `cmp-log-evidence` samples their
  records too (catalogue §5.24). Its rule tests are the tie-break and "sampling module" blocks of `sim.test.js`.
- **Promote `trail.js`** (from `cmp-policy-to-record`) as already requested there; this sim does not depend on it.

## Checks

- `node --test sims/cmp-audit-sampling/sim.test.js`: tie-breaks first (rounding, stream monotonicity, the conclusion
  thresholds, the verdict, chance edges, percent rounding), then the sampling module, the page model, the six presets
  against SPEC, and the generic block.
- Fresh reviewer (a separate agent, no part in the build) read the code against `SPEC.md` and ran 61 mutations of
  `sampling.js` and `sim.js`: 45 killed, 13 equivalent (checked exhaustively over every reachable state), 3
  survived. All three now have tests and each is killed: −0 instead of +0 for P(0) when n > N − k (not JSON-safe),
  P(2+) a hair below 0 without the clamp, and `chance` without the cap at N (NaN above N); a test also covers
  prototype keys as `freq`. The reviewer's wording points were applied: one exception when every item was tested
  is a finding (nothing left to extend: `capOneAll`, `c_extendAll`); "the other 0 reported…" is now a note shown
  only when some samples found nothing (`nOthers`); Croatian agreement with numbers (colon forms instead of "Od 2
  uzoraka", "neispravnih je 1"); "the failure showed up" → "caught: a failure was in the sample"; the bound line
  says "(large population)" and is hidden when n = N (testing all 4 proves more than "below 53 %"); "Svaki deseti"
  (every tenth) → "Jedan od deset" (failures are random).
- `npm run gate -- cmp-audit-sampling`: pass (47/47 browser checks); screenshots 1920×1080 light, dark, grayscale,
  help, panel hidden and 375×812 in hr and en reviewed, plus every preset, 1000 items, a quarterly control with
  n = 1, no draws yet, and the monthly preset at 375×812.

## Time

Start 11:32, done 11:56 (2026-11-07), one session.
