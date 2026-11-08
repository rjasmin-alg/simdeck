<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-maturity-levels: notes

New explorer (task `docs/tasks/w3/cmp-maturity-levels.md`, catalogue `cmp-maturity-levels` §4.13). Rules and expected
numbers: `SPEC.md`.

## Decisions

- **Average against the weakest is the stage.** The radar shows the plan's average as a dotted ring and the audit line
  (level 3) as a dashed red ring, so the dent at the weakest area sits inside both; the weakest area is ringed on the
  radar and outlined in red in the table. The comparison table puts *average* and *weakest area* side by side for
  four plans, so the point needs no toggling.
- **Four plans from the same ratings and budget:** now (no plan), +1 everywhere, at least 3 everywhere, and the
  student's plan. "+1 everywhere" is the "raise everything" of the concept; "at least 3 everywhere" is the floor a
  per-area target usually starts from. With the default firm: +1 everywhere costs 90 weeks (budget 24) and leaves a
  minor nonconformity and the weakest area still the largest source of incidents; at least 3 costs 6 weeks and clears
  the audit.
- **Costs double, incidents halve, per level** (2^L weeks for L → L + 1; 2^(4 − L) incidents a year). One rule each,
  the same in every area, so the shape is visible and checkable; the explanation says real areas differ. With equal
  prices per area every sensible spending rule starts at the bottom anyway, so the page compares *plans*, not
  spending algorithms.
- **The audit is a rule, not a sample:** level 1 a major nonconformity, level 2 a minor one, 3 and up nothing. Sampling
  is `cmp-audit-sampling`'s concept.
- **The budget limits the student's targets** (+ refused when the next step does not fit; exactly reaching the budget
  is allowed). Lowering a *current* level is never refused (a rating is a fact, not a purchase), so the plan can go over
  budget; the meter turns red and hatched, the caption says by how much. A refused move keeps focus (`aria-disabled`)
  and the caption says why until the params change.
- **Sixteen levels as params** (`c1`…`c8`, `t1`…`t8`, hidden ranges kept in the URL), set from the stage's − and +
  buttons; the panel has the budget, "Clear the plan" and the presets. Targets below the current level are raised to
  it (normalise).
- **Six presets** (the task asks 3–6): two firms (A: average 3.25 with logging at 1; S: a "showcase" with average 3.75,
  suppliers at 1 and logging at 2), each with no plan and with plans.
- **Weakest on a tie:** the first in area order, so the label never jumps between equal areas.
- **Words:** no glossary terms (`[[…]]`); the explanation writes the pairs out (Croatian bold, English in italics in
  brackets), as the other `cmp-` pages do; the page does not link `glossary.js`. "Simplified, not legal advice,
  made-up firm, ratings, costs and incidents" is said once, in the stage's foot.
- **No answer keys:** nothing from `dr-lecture-estate/instructor/`; the entry has no estate seed.
- **No shared model:** maturity is not one of the §5.24 shared models (people × roles × rights, risk scoring, incident
  clocks, evidence trail), so everything is in `sim.js`, still pure and wordless.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- "Spend a budget to raise them" is a budget that caps the student's targets plus a comparison of plans at that
  budget, not a step-by-step spending simulation.
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow
  only `sims/cmp-maturity-levels/`; open questions are in the report instead.

## Sources

- ISO/IEC 27001:2022, clauses 9.1 (monitoring, measurement, analysis and evaluation), 9.2 (internal audit), 10.1
  (continual improvement), by number only. *(check: clause numbers against the 2022 edition)*
- ISO/IEC 17021-1:2015, the certification bodies' major and minor nonconformity (definitions 3.12, 3.13). *(check:
  definition numbers)*
- ISO/IEC 33020, process capability levels (0 incomplete … 5 innovating), as the source of the idea of a level scale;
  the page's 1–5 names (ad hoc, repeatable, defined, measured, improving) are its own plain words and are not claimed
  from the standard. *(check: the 33020 level names)*
- NIS2, Directive (EU) 2022/2555, art. 21(1): measures appropriate and proportionate to the risk, EUR-Lex. *(check:
  the official Croatian wording; the page paraphrases "primjerene i razmjerne riziku")*
- Catalogue §4.13 (confirmed by the owner 2026-11-08): ISO/IEC 27001 certification is voluntary; the measures the
  Zakon o kibernetičkoj sigurnosti (NN 14/2024) requires cover similar ground. On the page in the explanation.
- All numbers on the page (ratings, the doubling cost, the halving incidents, budgets) are illustrative (the page says
  so once). The preset numbers are checked by the Python script in `SPEC.md`, an independent re-implementation from
  the SPEC text.

## For the owner

- Catalogue §4.13 lists no Croatian detail for this entry beyond the ISO/IEC 27001 line above. Whether the regulation
  under the Zakon o kibernetičkoj sigurnosti asks for a self-assessment of maturity or a target level per measure
  *(open: not stated by the owner; source: Narodne novine, the regulation under NN 14/2024)*; not on the page.

## Term pairs

Not in `kit/glossary.js`; chosen here (except *razine zrelosti*, settled by the owner 2026-11-07), for the owner to
check in one place:

- *maturity levels* (razine zrelosti, settled), *control area* (područje kontrola), the levels *ad hoc*, *repeatable*,
  *defined*, *measured*, *improving* (ad hoc, ponovljivo, definirano, mjereno, stalno se poboljšava), *major / minor
  nonconformity* (velika / mala nesukladnost), *audit line* (crta revizije), *target level* (cilj, ciljna razina),
  *weakest area* (najslabije područje), *budget* (proračun), *weeks of work* (tjedni rada), *asset inventory* (popis
  imovine), *access control* (upravljanje pristupom), *vulnerabilities and patches* (ranjivosti i zakrpe), *backups*
  (sigurnosne kopije), *logging and monitoring* (zapisi i nadzor), *incident response* (odgovor na incidente),
  *suppliers* (dobavljači), *awareness and training* (svijest i obuka).

## Shared requests

- For the kit: `.sd-ctl[hidden] { display: none; }` again (as in `cmp-exceptions`, `cmp-four-eyes`, `cmp-sod-toxic`):
  a control with `visible: () => false` still takes space without it.
- For the kit: a small stage button style (`.ml-b` here; `.ex-b`, `.fe-b`, `.pa-b`, `.sx-b` elsewhere) and a way to
  keep params in the URL without a hidden control (here sixteen hidden ranges).
- For the kit: a radar view (axes, rings, polygons, labels in HTML) if more sims need one.

## Checks

- `node --test sims/cmp-maturity-levels/sim.test.js`: tie-breaks first (weakest on a tie, cost equal to the budget,
  target + reaching the budget exactly, top before budget, target raised to current, the level-3 audit boundary, the
  average-of-exactly-3 note boundary), then rules 1–10, the presets and the comparison against SPEC, and the generic
  block.
- `npm run gate -- cmp-maturity-levels`: passes. Screenshots at 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed. First gate run failed one-screen (hidden controls took 2018 px of panel: `.sd-ctl[hidden]`);
  the phone layout was reworked after review (rows and plans as small grids).
- Clicks checked in a browser: a refused + by keyboard keeps focus and the caption says why; − on a target by keyboard
  keeps focus; Clear the plan; presets by key; over budget in Croatian (red hatched meter, note); no console errors.

- Fresh reviewer (a separate agent, no part in the build) read the code against `SPEC.md`, ran the Python check
  (identical numbers) and 50 mutants of `sim.js`: no logic defect, 12 survivors (10 not equivalent). Applied: area
  names quoted in sentences so the Croatian and English grammar holds for plural names ("područje „Dobavljači” je…");
  averages shown to 3 decimals (4,125 / 4,375 as in SPEC) and shares to one (44,4 %), with the locale's percent; a
  neutral sentence when nothing is below 3 (`capNowOk`, SPEC rule 10); table headers say the audit and incidents are
  at the target; "the audit findings and the largest share of incidents come from it" instead of "look there";
  a budget refusal while already over budget says so (`refOver`); "Sva područja +1 / barem 3" instead of "Svima";
  "interna revizija" throughout; unused row fields dropped; the `'024'` test that could not fail replaced; six tests
  for the survivors (29 tests), each checked to fail on its mutant.

## Time

Start 23:59 (2026-11-08), done 00:15 (2026-11-09), about 16 minutes, one session.
