<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-vendor-tiers: notes

New explorer (task `docs/tasks/w3/cmp-vendor-tiers.md`, catalogue `cmp-vendor-tiers` §4.13; scores risk with the
risk register's model, §5.24). Rules and expected numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** the same thirty suppliers and the same hours checked two ways, side by side at the
  top: one questionnaire for all against tiered checking, each with hours used, risk covered (% of all) and risk
  covered per hour. A card (or the panel's "On the stage") picks whose checks the tiles show. At 60 h: 20 % against
  49 %, €1 979 against €4 800 per hour.
- **Risk = the risk register's expected yearly loss.** Each supplier has a likelihood level (made up) and an impact
  level that follows from what it reaches (SPEC rule 1); `scoring.loss(l, i)` gives € a year. The anchors make the
  risk concentrate: two suppliers hold €240 000 of €593 600, tier 1 holds 67 %. That concentration is what makes
  tiering pay.
- **The tier rule:** by reach (production access, or a critical service that is hard to replace → 1; personal data,
  or a critical service easy to replace → 2; the rest → 3), or by spend with the same tier sizes (9 / 13 / 8), so the
  hours stay comparable and only who lands where changes. Spend is the common shortcut the page argues against.
- **Coverage shares** (questionnaire 20 %, certification evidence 50 %, contract with audit rights 80 %) and hours
  (2 / 4 / 10) are made up and plausible; the page says once that they are. Deep checks cost more per % covered of
  one supplier (8 %/h against 10–12.5 %/h), so tiering wins per hour only because of where the risk sits, which
  is the point. Per hour falls overall as the budget grows (not at every step, SPEC); the caption shows both
  strategies at the same hours.
- **One questionnaire for all** never spends more than 60 h (30 × 2 h) even with a larger budget: the catalogue's
  comparison is "one questionnaire for all", not "the same deeper check for all".
- **Tiered checking spends hours in priority order** and skips a check that does not fit, then goes on (a cheaper
  check further down may fit). With 60 h, 24 suppliers stay unchecked holding 39 % of the risk; the caption says so.
  Every supplier still getting a minimum check was considered and left out (one more rule, one more param).
- **Behind the suppliers** (toggle, preset 5): the IT support firm's night administrator (a subcontractor with
  administrator access, €30 000 a year) is covered only by the contract's subcontractor clauses (50 % of its risk,
  and only when the parent got the audit); by spend the parent is tier 2 and nothing covers it. Five suppliers on one
  provider: a joint outage = sum of their impact anchors × 0.05 a year = €94 000, which no single-supplier check
  covers. Both join the total, so coverage drops (70 % → 60 % tiered, 20 % → 17 % one questionnaire).
- **Layout:** four grid columns (tier 1, tier 2 in two, tier 3) and nine tile rows; the "behind" box fills tier 2's two
  free rows. Each tile: the check's badge (letter, fill and outline differ for grayscale), the name, the reach flags
  (● ■ ★ ▲, each coloured and named in the label), and a bar whose length is the risk on one scale for the page and
  whose solid part is the share covered (hatched = not covered). Tier 3's bars are slivers on purpose.
- **Colour never alone:** flags are shapes; covered is solid against hatched; the shown card has a ▸ and a thick
  outline; unchecked tiles are dashed with a "–" badge. Grayscale screenshots checked.
- **Firm unnamed**, small online retailer (same kind of firm as `cmp-bia`); thirty made-up suppliers named by what
  they do, no company or product names.
- **No glossary terms** (`[[…]]`): the explanation writes the pairs out, as the other `cmp-` pages do; the page does
  not link `glossary.js`.
- **Scoring model:** `scoring.js` copied unchanged from `sims/cmp-risk-register/scoring.js` @ 302ce39 (COMMON.md §6;
  `models/` has no scoring model yet), as `cmp-dpia-triage` did. Only `loss`, `ale`, `hup` and `SCALE` are used.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow
  only `sims/cmp-vendor-tiers/`; the open questions are in the report instead.
- The catalogue's "set the assessment budget" is a slider of yearly hours (10–160 h); a money budget was not used.

## Sources

- NIS2, Directive (EU) 2022/2555, art. 21(2)(d) (supply chain security) and art. 21(3) (each direct supplier's
  vulnerabilities and practices), EUR-Lex. *(check: the official Croatian wording, here "sigurnost lanca opskrbe")*
- GDPR, Regulation (EU) 2016/679, art. 28(1), (2), (3)(h), (4): processors' guarantees, another processor only with
  authorisation and with the same obligations, audits and inspections. *(check: the Croatian term for
  sub-processor, here "drugi izvršitelj obrade")*
- ISO/IEC 27001:2022, Annex A 5.19–5.22, by number only. *(check: numbers from the edition's contents, not a copy)*
- DORA, Regulation (EU) 2022/2554, art. 28 (ICT third-party risk, register of information), 29 (concentration risk),
  30 (key contractual provisions, incl. audit rights). *(check: the paragraphs)*
- `cmp-risk-register` SPEC rules 1–2 (anchors, expected loss).
- All numbers on the page are illustrative (the page says so once). Checked by the Python script in `SPEC.md`.

## For the owner

From catalogue §4.13, "Where Croatian and EU practice matters" (not on the page):

- Financial entities follow DORA (applying since 17 January 2025) for ICT third-party risk, with a register of ICT
  third-party arrangements; the supervisors are the Hrvatska narodna banka and HANFA *(check the split; source: the
  HNB and HANFA sites, and DORA art. 28(3) on the register)*. A DORA preset (register of information, concentration
  at the level of the financial system) was not built; the catalogue calls it optional.
- How the Zakon o kibernetičkoj sigurnosti (NN 14/2024) and its implementing regulation phrase the supply-chain
  measure *(check; source: Narodne novine)*.

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place:

- *supplier* (dobavljač), *supplier tier* (razina dobavljača), *tiering* (svrstavanje u razine), *subcontractor*
  (podizvođač), *shared provider* (zajednički pružatelj), *concentration risk* (koncentracijski rizik).
- *right to audit / audit rights* (pravo revizije), *certification evidence* (dokaz certifikacije), *security
  questionnaire* (upitnik; on the page "kratki upitnik"), *supply chain security* (sigurnost lanca opskrbe).
- *reach* (doseg: what a supplier reaches into), *hard to replace* (teško zamjenjiv), *production access* (pristup
  produkciji), *critical service* (ključna usluga), *risk covered* (pokriveni rizik).
- Depth letters on the badges: hr R (revizija), C (certifikat), U (upitnik); en A, C, Q.

## Shared requests

- **Promote `scoring.js` to `models/scoring.js`** (already requested by `cmp-risk-register` and `cmp-dpia-triage`);
  this is a third identical copy. When it is there, the page should include `../../models/scoring.js` and `sim.js`
  take it from `SimdeckModels.scoring`; the tests in `sim.test.js` cover only what this sim builds on top (plus a
  small check of the anchors).

## Checks

- `node --test sims/cmp-vendor-tiers/sim.test.js`: 25 tests, tie-breaks first (equal spend across the tier 2/3
  boundary, equal impact in the priority order, impact before register order, equal hours fit, skip-and-go-on, the
  spend misfits on real and hand-made rows, normalise boundaries), then rules 1–10, the presets against SPEC, the
  copied scoring module, and the generic block.
- 27 hand-written mutants of `sim.js` (one or more per rule and tie-break): all killed (two needed the hand-made-row
  tests and one the rounding test with a risk that is not a multiple of 20).
- `SPEC.md`'s Python re-implementation against `compute`: 2 133 cases, 0 mismatches (the one difference found, the
  order of the shared provider's list, was fixed to register order).
- `npm run gate -- cmp-vendor-tiers`: pass (46/46 browser checks). Screenshots at 1920×1080 light, dark, grayscale,
  help, panel hidden and 375×812 in hr and en reviewed, plus the presets same, spend and reveal (light and dark) and
  reveal at 375×812.

- Fresh reviewer (a separate agent, no part in the build) read the code against `SPEC.md`, cross-checked the Python on
  128 cases (0 mismatches) and ran 96 mutants: 15 survived, 6 of them unable to change the page. Applied: nSpend now
  names the tiers instead of claiming checks the hours may not reach; tier 1's share is of the displayed total (55 %
  with reveal); tests for the misfit ties, negative and "90x" budgets, "TRUE", shares under reveal and the unchecked
  order (re-run: the reviewer's survivors are killed); the badges are in the tier headers and "not checked" in the
  legend; SPEC's "per hour falls" made exact; Croatian wording ("podizvođač dobavljača …", "a oni nose", "rasprši",
  "dokaz o certifikaciji", "Online obuka") and "Annex A". The explanation now says that "covered" is assurance, not
  removed risk; that a processor's art. 28 contract terms are required whatever the tier; that NIS2 binds the
  entities in scope and DORA the financial sector; that one questionnaire is capped at 60 h and even certification
  for all would cover less; and that the joint outage is a separate scenario.

## Time

Start 20:26, done 20:55 (2026-11-07), one session.
