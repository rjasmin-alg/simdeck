<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-ale-risk: notes

New explorer (task `docs/tasks/w3/fin-ale-risk.md`, catalogue `fin-ale-risk` §4.12). Rules and expected numbers:
`SPEC.md`.

## Decisions

- **The contrast on the stage:** one risk register read two ways, the average year (ALE, the formula) against the
  worst simulated year (a rare large loss). Top: the register, five rows, each with loss × frequency = ALE, four
  treatment buttons (accept, reduce, transfer, avoid) and a second line with the chosen treatment's yearly cost, the
  ALE it removes and the verdict (✓ worth it / = break-even / ✗ not worth it on average). Middle: the simulated
  years as columns, untreated (grey) behind, with the choices (solid: the treatments' fixed yearly cost; hatched: the
  losses kept) in front, the ALE (dashed) and the expected cost with the choices (solid) as lines, both worst years
  tagged ▼. Right: a table untreated vs with the choices (expected, simulated average, worst year, years with a
  loss), the result and the footnote.
- **"Add risks"** is five fixed rows, each with a loss per event that can be 0 ("not in the register"); a preset
  (`rare`) starts with only one risk. A free-form "add a row" would need dynamic params, and five generic risks cover
  the cases (frequent small, rare large, controls on the frequency and on the loss).
- **Loss and frequency are select lists** (0 to 1 000 000 €, 0.01 to 12 a year): the range spans three orders of
  magnitude and a linear slider would be useless at the low end. Frequencies show "once in n years" below 1.
- **One treatment per risk**, exclusive, as in the four textbook answers; no combined reduce + insure.
- **A control acts on the frequency or on the loss**, fixed per risk (encrypted disks and an immutable copy cut the
  loss; call-back, a second power feed and a security review cut the frequency). The ALE is the same for the same
  share; the years differ, which the chart shows.
- **Insurance:** the premium is the insurer's expected payout × a load (150 % by default, 100–300 %), with one
  deductible per event for all insured risks. With load > 100 % insurance never pays on average; that is the point
  of the `insure` preset (dearer on average, a much smaller worst year).
- **Avoid** costs the benefit given up a year (a slider per risk), so it has a verdict like the others.
- **Worth it is strict:** a control that removes exactly its cost is break-even (`break-even` preset); the caption's
  "not worth it" note includes it.
- **Simulation:** Poisson counts by inversion from one random number per (year, risk), shared by the untreated and the
  treated column, so the two columns are the same years and a control never adds an event. mulberry32 (a copy of
  `Simdeck.rng`, tested to match), hidden `seed`, Run again (`N`). 100 or 1 000 years (1 000 columns still draw;
  10 000 would not).
- **Changed mark** on the result when the choices move between nothing treated, saving, even and costing.
- **Model in its own file** (`risk.js`): `rng`, `hup`, `ale`, `premium`, `treat`, `poisson`, `years`, `summary`,
  `niceStep`; pure, no words, registers on `globalThis.SimdeckModels.risk`. No other `fin-` model was needed (no
  ledger, no discounting).
- **Grayscale:** grey / solid / hatched columns, dashed vs solid lines, ▼ tags with dashed vs solid borders, ✓ = ✗ on
  the verdicts, ▶ on the chosen row.
- **Phone:** rows wrap (name, ALE, buttons, detail); the chart drops its tags.
- **No glossary terms:** the strings write the pairs out and the page does not link `glossary.js` (as the other
  `fin-` pages).
- **`related`:** `ransomware-321` (the immutable copy as a priced control, catalogue §5.23), `fin-downtime-cost`,
  `fin-contingency-reserve`.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- Concept shortened to fit 80 characters: "ALE = loss × frequency; a control pays when it removes more than it costs";
  the rest of the catalogue concept (the four treatments, the rare large loss) is in the summary, the stage and the
  explanation.
- "Add risks" is five fixed rows that can be taken out (loss 0), not a free list (see Decisions).

## Sources

- ALE = SLE × ARO, and a safeguard's value = ALE before − ALE after − its annual cost: the standard quantitative risk
  analysis in information security (FIPS PUB 65, 1979, which introduced ALE; (ISC)² CISSP CBK, risk management;
  ISACA CRISC material). No product or tool is named on the page.
- Risk treatment options accept, reduce (mitigate), transfer (share) and avoid: ISO 31000 / ISO/IEC 27005.
- Poisson frequency, fixed severity: the classic frequency–severity model in actuarial and operational-risk texts.
- Premium as expected loss × a loading: standard insurance pricing (pure premium plus loading).
- Numbers: made up but plausible; checked by the independent Python script at the end of `SPEC.md` and by the preset
  test.

## Unchecked *(check)*

- The illustrative register (losses, frequencies, control costs and effects), in particular ransomware at
  500 000 € once in 20 years and the 150 % insurance load.
- The Croatian terms below, especially "očekivani pojedinačni gubitak" for SLE, "godišnja stopa pojavljivanja" for ARO
  (the page says "godišnja učestalost"), "franšiza" for deductible and "prihvatiti / smanjiti / prenijeti / izbjeći"
  for the four treatments.

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| annualised loss expectancy (ALE) | očekivani godišnji gubitak |
| single loss expectancy (SLE) | očekivani pojedinačni gubitak (gubitak po događaju) |
| annualised rate of occurrence (ARO) | godišnja stopa pojavljivanja (godišnja učestalost) |
| risk register | registar rizika |
| risk treatment | postupanje s rizikom |
| accept / reduce / transfer / avoid | prihvatiti / smanjiti / prenijeti / izbjeći |
| control (safeguard) | zaštitna mjera (zaštita) |
| insurance premium | premija osiguranja |
| deductible | franšiza |
| worst year | najgora godina |

## For the owner

From catalogue §4.12, "Where Croatian practice commonly differs": none of the four notes applies to `fin-ale-risk`
(they are about depreciation rates, lease accounting, currency and the fiscal year). Nothing to copy.

## Shared requests

- **Promote `risk.js` to `models/risk.js`** if another sim prices risks (e.g. an "in money" preset on
  `ransomware-321` or `rpo-rto`). It moves unchanged; its tests are the rule tests in `sim.test.js` that call `M.`
  directly. Its `rng` duplicates `Simdeck.rng` on purpose (a model must not depend on the kit); a test checks they
  match. `fin-contingency-reserve`'s `reserve.js` has the same `rng` and `niceStep`: a shared `models/` helper could
  hold both.
- **Glossary:** add the term pairs above.
- **Learn tree:** catalogue §4.12's placement: area `money`, subject `risk`, leaf `expected-loss` with `fin-ale-risk`
  and `ransomware-321`; also `security › attacks › ransomware`.

## Review

A fresh reviewer (a separate agent with only the files) read the code against `SPEC.md` and ran the SPEC script: every
preset number matched. It tried 98 rule-breaking mutations; 23 survived. Nine of the survivors are equivalent: rounding
where every loss is a multiple of 1 000 €, and guards that only add 0. The others are now covered by tests, each checked
to fail on its mutation:
- premium and kept loss for a loss below the deductible; Poisson counts above ten a year;
- the worst/ALE ratio rounding halves up; the quiet years counted from the untreated column;
- the axis holding an empty untreated column and a treated column taller than both lines;
- the order of the notes, the empty caption, insurance verdicts, a fair premium (load 100 %), each preset's chosen risk;
- normalise rounding to the nearest step; the ranges.

Fixed defects and wording:
- The result line now gives the worst year before and after (SPEC said so).
- A worst-year tag for the treated column when the untreated one has no loss.
- `nInsure` showed at a load of 100 %, where insurance breaks even; it now needs net < 0.
- `capNone` read "the worst year cost €0, 0 times the ALE" when no year had a loss; there is now `capNoLoss`.
- The `controls` hint said "four controls", but one of the four is avoidance. "The average stays" now reads "the expected
  cost stays" (the simulated average moves). The changed-mark legend now names all four outcomes.
- Croatian: "Nove godine" (reads as New Year) is now "Ponovi simulaciju"; "puta više od ALE-a" is now "puta koliko ALE";
  "bankovni račun" replaces "račun primatelja" (it could be read as an invoice); "Bez postupanja" replaces "Ništa nije
  obrađeno".
- The Croatian explanation now follows the term rule: the English term in italics first, the Croatian in parentheses.
  It names "očekivani pojedinačni gubitak" and "godišnja stopa pojavljivanja".
- Avoiding ransomware is now "no networked systems at all" (200 000 € a year given up); the old wording claimed that
  dropping only shared file servers removes the risk.
- Non-breaking spaces inside amounts ("592 000 €") so a number never wraps.
- Stale comments on `axis` and `flipped`.

## Time

Started 2026-11-07 09:44, done 10:05: about 21 minutes, the fresh review and its fixes included.
