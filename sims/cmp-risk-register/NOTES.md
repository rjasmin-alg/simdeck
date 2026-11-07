<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-risk-register: notes

New explorer (task `docs/tasks/w3/cmp-risk-register.md`, catalogue `cmp-risk-register` §4.13; hub of the
risk-scoring model, §5.24; the money view is `fin-ale-risk`'s expected loss, §4.12). Rules and expected numbers:
`SPEC.md`.

## Decisions

- **The contrast on the stage:** the same register ranked by score and by money. The matrix, the markers and the
  arrows stay put when the view switches; the cell values, the appetite staircase, the register order and the signers
  change, and the rows whose rank or signer moved are highlighted. Each row shows how its rank moves against the other
  view (fire ▲5 in money, saas ▼2).
- **Money anchors per level.** Each likelihood level has a frequency anchor (0.05, 0.2, 0.5, 1, 3 a year) and each
  impact level a loss anchor (€2k, €10k, €40k, €150k, €600k), so a cell's money value is fixed and the student
  places risks by level, as on a real matrix. The anchors were chosen so that the catalogue's trap shows with round
  numbers: 5 × 1 = €6 000, 1 × 5 = €30 000, 3 × 3 = €20 000 a year. The axes show the anchors.
- **Two appetites, one per view:** a score (range 1–24, default 8) and a money amount (5 choices, default
  €25 000). Equal is within (SPEC rule 4). At the defaults three cells change sides between the views (1 × 5 and
  2 × 4 above in money only, 3 × 3 above by score only), which is what makes the presets work.
- **Who signs:** within the appetite the risk owner signs the residual; above it the management board signs (or the
  risk needs more treatment); avoided risks need no signature. ISO/IEC 27001 6.1.3 asks for the risk owners'
  acceptance; the board above the appetite is common governance practice and is presented as such (not as a clause).
- **"Choose a treatment and its cost":** one fixed control per risk (its effect and yearly cost are in the register,
  SPEC rule 7), insurance priced from the risk (expected payout + 50 % load, as `fin-ale-risk`), and avoid priced as
  the benefit given up. A cost slider per risk was left out: with twelve risks it would need 12 more panel controls,
  and the panel already fills 1080 px. The cost of each treatment is shown before and after choosing it.
- **Placing a risk:** select it (row, marker or the panel's list), then click a cell; the panel also has likelihood
  and impact choices for the selected risk. The treatment is chosen with the four buttons on the stage; its panel
  control is hidden (kept for the URL), so the panel fits without scrolling.
- **Markers:** up to nine per cell in a 3 × 3 slot grid (4 × 4 beyond nine), register order, before-treatment rings
  first. Arrows are an SVG overlay on the square matrix (no text in the SVG). Grayscale checked: hollow dashed ring vs
  filled disc, hatched cells plus a thick staircase line, "board" boxed and in bold.
- **Ranking ties share the rank** and show "=" (=1 stolen password and unpatched server, =9 lost laptop and fire);
  the caption's tie note names the pair with the largest money gap.
- **Scoring model in `scoring.js`**, pure and wordless, registered as `SimdeckModels.scoring`, ready for
  `models/scoring.js`. `hup` and `ale` are copied from `sims/fin-ale-risk/risk.js` @ ad5f4b8 (COMMON.md §6); the
  transfer premium follows `fin-ale-risk` rule 4 with a fixed deductible level and load.
- **The firm is unnamed** (about 60 people); the foot under the matrix says once: simplified, not legal advice,
  made-up firm, risks and amounts.
- **No glossary terms** (`[[…]]`): the explanation writes the pairs out (Croatian bold, English in italics in
  brackets), as `cmp-policy-to-record` and `cmp-audit-sampling` do; the page does not link `glossary.js`.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- One control per risk with a fixed cost instead of a free cost per treatment (above).
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow
  only `sims/cmp-risk-register/`; open questions are in the report instead.
- `models/` holds no risk model yet; nothing is read from there. `fin-ale-risk`'s two functions are copied (above).

## Sources

- ISO/IEC 27001:2022 by clause number only, never quoted: 6.1.2, 6.1.3, 8.2, 8.3, 9.3. *(check: clause numbers from
  the edition's contents; 6.1.3's item on the risk owners' approval and acceptance not checked against a copy)*
- ISO 31000:2018 and ISO/IEC 27005:2022: the four treatment options (modify, share, avoid, retain) and risk appetite.
  *(check: not cited on the page)*
- GDPR, Regulation (EU) 2016/679, art. 32(1) and art. 24(1) (risk of varying likelihood and severity), EUR-Lex.
  *(check: the official Croatian wording "rizik različitih razina vjerojatnosti i ozbiljnosti" against EUR-Lex; the
  page paraphrases)*
- NIS2, Directive (EU) 2022/2555, art. 20(1) (management bodies approve and oversee the risk-management measures) and
  art. 21(1). *(check: the Croatian term for "management body", here "upravljačko tijelo", against the Croatian
  version and the Zakon o kibernetičkoj sigurnosti)*
- L. A. Cox Jr., "What's wrong with risk matrices?", Risk Analysis 28(2), 2008, 497–512 (ties and reversals from
  ordinal scores).
- `fin-ale-risk` SPEC rules 1a, 2 and 4 (expected loss, verdict, premium).
- All numbers on the page are illustrative (the page says so once). Checked by the Python script in `SPEC.md`.

## For the owner

From catalogue §4.13, "Where Croatian and EU practice matters": ISO/IEC 27001 (2022) certification is voluntary;
the measures the cybersecurity law requires cover similar ground *(check how the regulation under the Zakon o
kibernetičkoj sigurnosti, NN 14/2024, refers to ISO/IEC 27001; source: Narodne novine)*. Not on the page.

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place:

- *risk register* (registar rizika), *risk matrix* (matrica rizika), *likelihood* (vjerojatnost), *impact*
  (učinak, as in the catalogue's Croatian title), *score* (bodovi).
- *inherent risk* (inherentni rizik; the register heading says "prije postupanja"), *residual risk* (preostali
  rizik), *risk appetite* (apetit za rizik), *risk owner* (vlasnik rizika), *management board* (uprava).
- *risk treatment* (postupanje s rizikom): *reduce* (smanjiti), *transfer* (prenijeti), *avoid* (izbjeći),
  *accept* (prihvatiti).
- *expected annual loss* (očekivani godišnji gubitak, as `fin-ale-risk`), *deductible* (franšiza), *premium*
  (premija), *ordinal* (redni).
- Level names: rijetko, malo vjerojatno, moguće, vjerojatno, gotovo sigurno; zanemariv, mali, umjeren, velik,
  ozbiljan.

## Shared requests

- **Promote `scoring.js` to `models/scoring.js`** (catalogue §5.24: `cmp-dpia-triage`, `cmp-vendor-tiers` and
  `cmp-exceptions` score the same way). Its rule tests are the tie-break block and the "scoring module" block of
  `sim.test.js`. When `models/risk.js` (from `fin-ale-risk`) is promoted, `scoring.js` should take `hup` and `ale`
  from it instead of its copies.

## Checks

- `node --test sims/cmp-risk-register/sim.test.js`: tie-breaks first (appetite equality, shared ranks and register
  order, the tie pair, floors and the empty transfer, verdict boundaries), then the scoring module, the register,
  normalise, the cells and the staircase, the changed marks, the five presets against SPEC, the caption notes, and the
  generic block.
- `npm run gate -- cmp-risk-register`: pass (46/46 browser checks). Screenshots at 1920×1080 light, dark, grayscale,
  help, panel hidden and 375×812 in hr and en reviewed, plus the money, by-money (dark) and insurance presets, a risk
  placed and avoided, and the money preset at 375×812. Clicks checked in a browser: place on a cell, treatment
  buttons, marker select, keyboard focus kept after Enter.
- Fresh reviewer (a separate agent, no part in the build) read the code against `SPEC.md` and ran 106 mutations of
  `scoring.js` and `sim.js`: 75 killed at first. No code contradicted the spec. Its 19 missing tests are now in
  `sim.test.js` (impact floor, a missing dL, premium rounding with another scale, Infinity in params, the appMoney
  list, staircase edges only on cells above and none in the left column, a treatment that moves neither rank nor
  signer, ratio not difference for the tie note, the up/down/not-worth lists, ranks on the inherent value, totals, and
  every control and avoid price in the register). Its unused fields (`extra`, `tot.save`, `tot.avoided`,
  `tot.treated`, `dl`/`di` on the state) were removed; the page now reads `tot.need`. Re-run: every mutant killed
  except two equivalents (the order tie-break under a stable sort; a preset's selected risk). Wording applied:
  Croatian points agree with the number (1 bod, 2–4 boda, "više od 1 boda"), no plural "them" after one risk,
  "the order changes" replaced by "before treatment, X comes first", and the firm (not "you") keeps the deductible.

## Time

Start 12:01, done 12:30 (2026-11-07), one session.
