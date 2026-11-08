<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-dpia-triage: notes

New explorer (task `docs/tasks/w3/cmp-dpia-triage.md`, catalogue `cmp-dpia-triage` §4.13; risk scoring from
`cmp-risk-register`, §5.24). Rules and expected numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** the same plan before and after measures. The screening column (criteria, count,
  recommendation) is read from the plan and stays put when measures are switched on; the matrix markers move. The
  `nSame` note says it in words ("the measures lowered the risk, not the screening").
- **Six activities, six criteria.** The task's four examples (badge logs, car tracking, a desk camera, computer
  monitoring) plus two that the criteria need: a monthly report joining the logs with HR records (combining
  datasets) and face recognition at the entrance (new technology, biometric data). Large scale is a seventh switch,
  the group-wide roll-out (2 400 people instead of the firm's 140). Each activity lights its criteria by a fixed
  table (SPEC rule 1); every activity concerns employees, so each lights "vulnerable".
- **Criteria in WP248 order** (3–8). The other three WP248 criteria (evaluation or scoring, automated decisions with
  legal effect, processing that stops people using a right or service) are named in the explanation only: none of
  the task's examples needs them, and a seventh lamp would not fit the column.
- **Risk per activity, not per project.** Each active activity is a marker on the 5 × 5 likelihood × severity
  matrix, as each risk is in `cmp-risk-register`; the project's remaining risk is the highest one (first in
  activity order on a tie). "Severity" instead of the register's "impact" because the GDPR speaks of the likelihood
  and severity of the risk to people (recital 76); the scoring is the same.
- **Measures are project-wide switches** whose effect differs per activity (SPEC rule 1 table): a measure lowers
  likelihood or severity by one or two levels, floored at 1. A measure with no entry for any active activity is
  idle and the caption says so ("a measure has to fit the risk"); pseudonymisation does nothing for the camera, and
  only minimisation touches face recognition. Idle is judged by the table, not by the floor.
- **The high-risk line** is a score strictly above 12 (15, 16, 20, 25), the staircase as in `cmp-risk-register`.
  Chosen so that face recognition with every measure ends exactly at 12 for the firm and at 16 for the group: the
  roll-out tips it.
- **Four verdicts:** nothing to screen; one criterion (assessment not usually needed, record why); two or more and
  the remaining risk high (lower it, change the design, or consult the supervisory authority first: art. 36);
  two or more and not high (go ahead with the assessment on file, review it when the processing changes). The
  prior-consultation outcome stays inside the one concept: it is what "read the remaining risk" leads to.
- **Measures never change the screening** (SPEC rule 4). In reality a redesign before screening (no content
  collected at all) is a different plan; the page models that by switching an activity off, not by a measure.
- **The report needs a source** (SPEC rule 2): switched on alone it lights nothing and the caption says there is
  nothing to join.
- **All controls on the stage** (aria-pressed buttons); the eleven params are hidden in the panel (kept for the URL
  and the reset), as `cmp-risk-register` and `cmp-patch-sla` do, so the panel holds the six presets and the
  explanation and the page fits 1920×1080.
- **Changed marks:** after a click, criteria that lit or went out and the recommendation box, if it changed, are
  highlighted (`.sd-changed`).
- **The firm is unnamed** (140 people, part of a 2 400-person group); the foot says once: simplified, not legal
  advice, made-up firm, activities and levels.
- **No glossary terms** (`[[…]]`): the explanation writes the pairs out (Croatian bold, English in italics in
  brackets), as the other `cmp-` pages do; the page does not link `glossary.js`.
- **Scoring model:** `scoring.js` is `sims/cmp-risk-register/scoring.js` @ d88138f, copied unchanged except one
  comment line saying so (`models/` has no scoring model yet). Only `score`, `above` and `treat` (reduce, cost 0)
  are used; the money parts are unused here.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- Two activities added to the task's four (the report and face recognition), and a group roll-out switch, so that
  every criterion on the page can light.
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow
  only `sims/cmp-dpia-triage/`; open questions are in the report instead.

## Sources

- GDPR, Regulation (EU) 2016/679 (EUR-Lex): art. 35(1) (assessment before processing likely to result in a high
  risk, in particular using new technologies), art. 35(4) (the authority's list), art. 35(11) (review when the risk
  changes), art. 36(1) (prior consultation when the assessment shows a high risk the controller does not mitigate),
  art. 9(1) (biometric data for identification), art. 4(5) (pseudonymisation), art. 5(1)(c) and (e) (minimisation,
  storage limitation), recital 76 (likelihood and severity). Cited in the explanation only. *(check: the article
  and paragraph numbers against EUR-Lex; read from memory of the text, not re-fetched in this session)*
- Article 29 Working Party, WP248 rev.01, *Guidelines on DPIA and determining whether processing is "likely to
  result in a high risk"*, 4 October 2017, endorsed by the EDPB on 25 May 2018: the nine criteria; "in most cases …
  meeting two criteria would require a DPIA"; one criterion may be enough in some cases; employees as vulnerable
  data subjects; location data as highly personal; documenting a decision not to carry out an assessment.
  *(check: the wording of these points against the document; not re-fetched in this session)*
- `cmp-risk-register` SPEC rules 1, 3 and 4.
- Every level, effect and head count is illustrative (the page says so once). Checked by the script in `SPEC.md`.

## For the owner

From catalogue §4.13, "Where Croatian and EU practice matters":

- What AZOP's list of processing that always needs an assessment (art. 35(4)) contains, and where it is published
  *(open: not stated by the owner; source AZOP's website and the decision as published in Narodne novine)*. The page says only that the
  authority publishes such a list.
- Whether the camera-over-the-desks activity meets a specific national limit on video surveillance of workplaces in
  the Zakon o provedbi Opće uredbe o zaštiti podataka (NN 42/2018) *(open: not stated by the owner)*. The page names no limit.
- The article of the Zakon o radu on consulting the workers' council *(open: not stated by the owner)*. The page names the law without an
  article.

## Settled

- The supervisory authority in Croatia is the Agencija za zaštitu osobnih podataka (AZOP), which publishes the list of
  processing that always needs an assessment (art. 35(4)): owner confirmed 2026-11-08. On the page: the explanation names AZOP where it
  mentions the list.
- The Zakon o provedbi Opće uredbe o zaštiti podataka (NN 42/2018) adds national rules, for example on video
  surveillance: owner confirmed 2026-11-08. On the page: one sentence in the explanation's last paragraph.
- Monitoring employees also involves the workers' council under the Zakon o radu: owner confirmed 2026-11-08. On the page: one sentence in
  the explanation's last paragraph, as a note; the model and the criteria are unchanged (it stays out of the
  screening, so the page keeps one concept).

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place. The settled terms from the task
(procjena učinka na zaštitu podataka, voditelj obrade, ispitanik, nadzorno tijelo) are used as given.

- *systematic monitoring* (sustavno praćenje), *sensitive or highly personal data* (osjetljivi ili vrlo osobni
  podaci), *large scale* (velik opseg; the Croatian GDPR may say "opsežna obrada" *(check)*), *combining datasets*
  (kombiniranje skupova podataka), *vulnerable data subjects* (ranjivi ispitanici), *new technology* (nova
  tehnologija).
- *prior consultation* (prethodno savjetovanje), *data minimisation* (smanjenje količine podataka),
  *pseudonymisation* (pseudonimizacija), *storage limitation* (ograničenje pohrane), *shorter retention* (kraće
  čuvanje), *narrower access* (uži pristup), *residual risk* (preostali rizik), *likelihood* (vjerojatnost),
  *severity* (ozbiljnost), *screening* (provjera).
- *European Data Protection Board* (Europski odbor za zaštitu podataka).

## Shared requests

- **Promote `scoring.js` to `models/scoring.js`** (already requested by `cmp-risk-register`); this sim then includes
  `../../models/scoring.js` instead of its copy and drops the copy. Its own tests use `score`, `above` and `treat`
  (reduce) only.

## Checks

- `node --test sims/cmp-dpia-triage/sim.test.js`: tie-breaks first (12 on the line, first activity on equal
  scores, the report without a source, large scale without an activity, floors and idle), the copied scoring
  functions, then rules 1–12 in order (incl. all 128 plans with and without measures against the SPEC counts), the
  six presets, and the generic block.
- `npm run gate -- cmp-dpia-triage`: pass (46/46 browser checks). Screenshots at 1920×1080 light, dark, grayscale,
  help, panel hidden and 375×812 in hr and en reviewed, plus the presets camera-measures (en), package (hr),
  face-group (hr, dark) and join (en). Clicks checked in a browser: a measure button toggles and the caption names it
  idle; Enter on a focused button keeps the focus; the report alone shows the no-source note; no console errors.
- Fresh reviewer (a separate agent, no part in the build) read the code against `SPEC.md`: no contradictions. It ran
  78 single mutants of `sim.js` and the scoring functions on a scratch copy: 68 killed, 6 equivalent (no activity
  has L = 5, so the cap never bites; the staircase at 12 is symmetric, so edgeB from the left cell gives the same
  cells; and four like them), 4 survivors now killed by new assertions (top0 chosen separately from top1, high0,
  the criteria order with large and combined lit together, the report's "vulnerable"). Its wording findings were
  applied: the "before" number now names its own activity (camera 16 before, face 12 after is possible); Croatian
  agreement in the foot ("izmišljene, ali uvjerljive") and in the unmoved-marker label (no pronoun); the consult
  caption with measures also says "lower it further"; "preispitaj" (review) instead of "obnovi"; "in the plan"
  instead of "on the left" (false in the phone layout); "Uvođenje u cijeloj grupi" as a noun like the other buttons.

## Time

Start 17:23, done 17:45 (2026-11-07), one session.
