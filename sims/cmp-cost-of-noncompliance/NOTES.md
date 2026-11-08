<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-cost-of-noncompliance: notes

New explorer (task `docs/tasks/w3/cmp-cost-of-noncompliance.md`, catalogue `cmp-cost-of-noncompliance` §4.13). Rules
and expected numbers: `SPEC.md`.

## Decisions

- **Two contrasts on one stage.** Left: a log-log chart of the ceiling against turnover (the fixed sum dashed, the
  percentage dotted, the ceiling as the thick upper envelope with its kink at the crossover, the firm as a dot with
  its ceiling), so the switch from the fixed sum to the percentage is a visible corner, not a rule. Under it the same
  turnover under all three regimes, with the deciding part underlined. Right: two stacked bars, *without the
  measures* and *with the measures* (price, incidents, fines), each with its formula filled in, the verdict, and who
  answers under the chosen regime.
- **The crossover is 500 M€ for all three regimes** (20 M / 4 %, 10 M / 2 %, 7 M / 1.4 %); a preset sits exactly on it
  (`crossover`, the tie-break "equal").
- **A thin "whole turnover" line** (ceiling = turnover) shows that for a small firm the fixed sum can exceed its whole
  yearly turnover (the `tiny-firm` preset: 350 %); the caption notes it.
- **The fine is a share of the ceiling** (10 / 25 / 50 / 100 %), not the ceiling: fines are set case by case and must
  be proportionate. Without this the expected fine for a large firm is absurd and the page would teach "the fine is
  4 %".
- **The measures act twice**: they prevent a share of incidents (25 / 50 / 75 %), and with the measures in place an
  incident ends in a fine a quarter as often (fixed). The second effect carries the idea that the fine sanctions the
  missing measures, not the incident; the quarter is illustrative and stated in the explanation.
- **Verdict as in fin-ale-risk**: worth it only when the measures remove more than they cost; equal is break-even
  (`break-even` preset). When the verdict is not "worth", the caption says the measures are a legal duty anyway
  (GDPR art. 32 / NIS2 art. 21, with the management body for NIS2): the comparison shows a price, not a choice.
- **Panel vs stage.** All eight params on the panel overflowed one screen (1258 px of 862). The panel keeps the task's
  four inputs (turnover, regime, likelihood, price of the measures); the four assumptions are drop-downs on the stage
  next to the costs (hidden params in the URL, focus kept after a change). One preset was dropped for the same reason
  (`fine-heavy`; `small-fixed` already shows the fine outweighing the incident); its numbers stay in SPEC and the tests.
- **Shared model**: `fines.js` (ceilings, fine, expected cost and verdict), pure and wordless, registers on
  `SimdeckModels.fines`. `hup` and the verdict rule are copied from `sims/fin-ale-risk/risk.js @ ad5f4b8` (no model
  is in `models/` yet). The ALE in `risk.js` (loss × frequency) is the same formula; the fine is a second loss that
  follows a share of incidents, so `ale()` itself is not reused.
- **Words**: no glossary terms (`[[…]]`); the explanation writes the pairs out, as the other `cmp-` pages do; the page
  does not link `glossary.js`. "Simplified, not legal advice; everything but the legal ceilings made up" is said once
  in the stage's foot (and once at the end of the explanation).
- **No answer keys**: nothing from `dr-lecture-estate/instructor/`; the entry has no estate seed.
- **`related`**: `fin-ale-risk` (the same expected-loss model, and the rare bad year), `cmp-nis2-scope` (which class
  applies), `cmp-risk-register`.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- Concept shortened to 80 characters: "Fine ceiling: a fixed sum or % of turnover, whichever is higher, vs the controls";
  the expected cost and management liability are in the summary, the stage and the explanation.
- Five presets, not six (one dropped to fit the panel; see Decisions).
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow only
  `sims/cmp-cost-of-noncompliance/`; open questions are in the report instead (as `cmp-maturity-levels` did).

## Sources

- Regulation (EU) 2016/679 (GDPR), art. 83(1), (2), (4), (5): ceilings, "whichever is higher", proportionality;
  art. 24 and 32: the controller's measures. EUR-Lex.
- Directive (EU) 2022/2555 (NIS2), art. 34(1), (4), (5): "a maximum of at least" 10 000 000 EUR or 2 % (essential),
  7 000 000 EUR or 1.4 % (important), of the undertaking's total worldwide annual turnover in the preceding financial
  year, whichever is higher; art. 20(1)–(2): the management body approves, oversees, can be held liable, takes
  training; art. 21: the measures; art. 32(5)(b): temporary ban from managerial functions (essential entities). EUR-Lex.
- Zakon o kibernetičkoj sigurnosti, NN 14/2024: implements NIS2; competent authorities categorise entities (catalogue
  §4.13, confirmed by the owner 2026-11-08). Named in the explanation without its amounts.
- Expected loss: `sims/fin-ale-risk/SPEC.md` (FIPS PUB 65).
- Numbers: the ceilings are the legal values; everything else is illustrative. Checked by the Python script in
  `SPEC.md` (exact fractions, an independent re-implementation) and by the preset test.

## Unchecked *(check)*

- Article numbers and paraphrases above were written from the texts as known to the builder, without the EUR-Lex pages
  open in this session: GDPR 83(4)/(5), 24, 32; NIS2 20(1)–(2), 21, 32(5)(b), 34(1)/(4)/(5). *(check)*
- The official Croatian wording: "upravna novčana kazna", "ukupni godišnji promet na svjetskoj razini", "upravljačko
  tijelo", "ključni / važni subjekt", "voditelj obrade", "nadzorno tijelo". *(check against the hr versions on EUR-Lex)*
- The illustrative quarter (an incident with the measures in place ends in a fine a quarter as often), the likelihoods,
  incident costs and prices.

## For the owner

- **National NIS2 fine amounts** (Zakon o kibernetičkoj sigurnosti, NN 14/2024, prekršajne odredbe): a secondary
  source (a training flyer) says art. 101 sets up to 10 000 000 € or 2 % of turnover for the entity and up to 3 000 €
  for a member of the management body *(check: art. 101 in Narodne novine; whether "the higher of" applies; the
  important-entity amounts)*. Kept off the page; the page uses the directive's minimum ceilings and says national law
  sets its own amounts. If confirmed, they could be added as a fourth/fifth regime or a line in "who answers".
- **Fines on public bodies**: whether the Zakon o provedbi Opće uredbe o zaštiti podataka (NN 42/2018) excludes
  administrative fines on public authorities *(check: the article)*. Not on the page.

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place:

- *fine ceiling* (najviša kazna), *administrative fine* (upravna novčana kazna), *worldwide annual turnover* (ukupni
  godišnji promet na svjetskoj razini), *fixed sum* (fiksni iznos), *share of turnover* (postotak prometa),
  *crossover* (prijelaz), *essential / important entity* (ključni / važni subjekt), *management body* (upravljačko
  tijelo), *controller* (voditelj obrade), *supervisory authority* (nadzorno tijelo), *the measures* (mjere),
  *price of the measures* (cijena mjera), *expected yearly cost* (očekivani trošak godišnje), *break-even* (točno se
  isplati), *assumptions* (pretpostavke).

## Shared requests

- For `models/`: promote `fines.js` (and with `fin-ale-risk`'s `risk.js`, one `hup` and one verdict rule).
- For the kit: `.sd-ctl[hidden] { display: none; }` again (as in `cmp-maturity-levels`, `cmp-exceptions`): hidden
  controls take space without it.
- For the kit: a compact panel layout (two choice controls per row, or presets in two columns) for explorers with more
  than five params; here four params had to move to the stage.

## Checks

- `node --test sims/cmp-cost-of-noncompliance/sim.test.js`: tie-breaks first (equal parts → "equal", one euro off
  either way; net exactly 0 → break-even; fines part equal to incidents part does not dominate; ceiling exactly equal
  to turnover is not "more than"; halves round up), then rules 1–10, the presets against SPEC, the further checked
  case, and the generic block.
- `npm run gate -- cmp-cost-of-noncompliance`: passes. Screenshots at 1920×1080 light, dark, grayscale and 375×812 in
  both languages reviewed; every preset screenshotted at 1920×1080. First runs failed one-screen (panel 1258 px, then
  876 px); the phone stage was clipped until `container-type: inline-size`; two chart labels collided with the firm's
  label at small turnovers (now placed by the firm's position).
- A stage drop-down keeps focus after a change; no console errors.
- Fresh reviewer (a separate agent, no part in the build) read the code against `SPEC.md`, re-ran the Python check
  (identical output), cross-checked 30 000 random parameter sets against its own re-implementation (0 mismatches) and
  ran 57 mutants of `fines.js` and `sim.js`: no logic defect, 11 survivors (6 not equivalent). Applied: SPEC's claim
  that no option gives a ceiling equal to the turnover was false (10 M€, `ess`) and its test compared nothing; the
  with-measures formula showed quarter-percents rounded to one decimal (now two, so it adds up); Croatian labels
  "Vjerojatnost kazne nakon incidenta, bez mjera" and "Udio incidenata koje mjere sprječavaju"; "the fine is for the
  missing measures" softened to "mainly … (or late reporting)", with GDPR art. 33 / NIS2 art. 23; the art. 32(5) ban
  is stated as a last resort after earlier enforcement. New tests pin the option lists, the defaults, q rounding, the
  half-up in `inc1` and `fine`, and the crossover from the regime table; each was checked to kill its mutant.
- Kept against the review: "the competent authorities categorise the entities" stays in the explanation: it is one of
  the Croatian details catalogue §4.13 lists for this entry, confirmed by the owner on 2026-11-08.

## Time

Start 00:20, done 00:42 (2026-11-09), about 22 minutes, one session (including a 3-minute review agent).
