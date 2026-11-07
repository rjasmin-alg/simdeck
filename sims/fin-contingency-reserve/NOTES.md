<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-contingency-reserve: notes

New explorer (task `docs/tasks/w3/fin-contingency-reserve.md`, catalogue `fin-contingency-reserve` §4.12). Rules and
expected numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** one estimate read two ways: the sum of the most likely values (the plan built line by
  line) against the budget at a confidence level (what many trials say). Top: the five lines as triangles on one
  scale, most likely (solid tick) and average (dashed tick) marked, so the skew of each line is visible. Middle: the
  trial totals as a histogram split in three (within the sum, covered by the reserve, over the budget) with the
  S-curve, the sum dashed, the chosen budget solid, the reserve as a bracket under the axis; beside it the ladder
  P50 / P70 / P80 / P90 / P95 with budget and reserve. Bottom: budget = sum + reserve.
- **A line is set as "most likely, may fall by %, may rise by %"**, not as three euro amounts: no ordering rule
  (low ≤ likely ≤ high) to enforce, and it is how a manager states a range ("could be 10 % less, up to double").
  Triangular, the standard three-point range; PERT and others are out of scope.
- **Five fixed lines** (hardware, own staff time, contractors, data migration, training and handover). A line is
  chosen by clicking its row on the stage (Enter / Space when focused); a hidden `line` param keeps it in the URL. The
  panel shows the three sliders of the chosen line only (15 range params, each `visible` for its line), labelled with
  the line's name. A line at 0 € drops out.
- **The confidence** is a panel choice and also the ladder rows on the stage (click to choose).
- **Deterministic trials:** mulberry32 (a copy of `Simdeck.rng`, tested to give the same stream) seeded by a hidden
  `seed` param; "Run again" (key `N`) adds 1. 100 / 1 000 / 10 000 trials. Each trial total is rounded once to whole
  euros, and every level, count and comparison uses those totals, so the numbers on the page agree with each other.
  10 000 trials × 5 lines plus a sort take a few milliseconds per change.
- **Levels by nearest rank** (⌈q n / 100⌉-th smallest total), the plain textbook percentile; no interpolation.
- **Covered:** when the budget at the chosen level is at or below the sum of the most likely values (symmetric or
  downward ranges at P50), the page says no reserve is needed and the ladder says "no reserve"; the result is marked
  changed when this flips.
- **Spend cap preset** takes its 15 000 € cap from the DR P07 brief (one-off spend cap, a student brief, not the
  instructor material); the stage does not draw the cap, the preset hint asks whether P95 fits.
- **Grayscale:** solid / hatched / dotted bins; dashed vs solid lines; ▶ for chosen rows.
- **Phone:** line rows wrap (name, track, numbers); the chart keeps its first and last axis ticks only.
- **The draws and levels in their own file** (`reserve.js`): `rng`, `line`, `draw`, `trials`, `level`, `atOrBelow`,
  `meanSum`, `pct`, `tenths`, `niceStep`, `histogram`; pure, no words, registers on `globalThis.SimdeckModels.reserve`.
  No other `fin-` model was needed (nothing here books, discounts or depreciates).
- **No glossary terms:** the strings write the pairs out and the page does not link `glossary.js` (as the other
  `fin-` pages).
- **`related`: `fin-budget-variance`** (what happens when the actuals arrive). `fin-ale-risk` would fit too but does
  not exist yet.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- Title and Croatian title as in the catalogue. Concept shortened to fit 80 characters: "Line ranges lean towards
  overruns; the reserve buys a level of confidence".
- The P50 line is not drawn on the chart (only the sum and the chosen level, to keep the tags apart); P50 is in the
  ladder and in every caption.

## Sources

- Three-point estimates and the triangular distribution; Monte Carlo cost-risk analysis; P50 / P80 budgets and the
  contingency reserve as the gap between the deterministic estimate and the chosen percentile: PMI, *PMBOK Guide*
  (cost estimating, contingency and management reserves); D. Vose, *Risk Analysis: A Quantitative Guide*; AACE
  International recommended practices on contingency estimating. No product or tool is named on the page.
- Triangular inverse distribution function and mean (a + b + c) / 3: standard probability texts.
- Nearest-rank percentile: standard definition.
- Numbers: made up but plausible; checked by the independent Python script at the end of `SPEC.md` and by the
  preset test.

## Unchecked *(check)*

- The line split and ranges of the illustrative project (hardware ±, staff +40 %, contractors +30 %, migration up to
  double, training +40 %).
- P50 and P80 as the levels commonly used for budgets; a reserve of 10–20 % of the base as typical for an IT project.
- The Croatian terms below, in particular "pričuva za nepredviđene troškove" for contingency reserve, "razina
  pouzdanosti" for confidence level, "pokus" for a Monte Carlo trial and "procjena u tri točke".

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| contingency reserve | pričuva za nepredviđene troškove |
| management reserve | pričuva uprave |
| three-point estimate | procjena u tri točke |
| most likely value | najvjerojatnija vrijednost |
| triangular distribution | trokutasta razdioba |
| confidence level | razina pouzdanosti |
| Monte Carlo simulation | simulacija Monte Carlo |
| trial | pokus |
| median | medijan |
| cost overrun | prekoračenje (troškova) |
| budget | proračun |

## For the owner

From catalogue §4.12, "Where Croatian practice commonly differs": none of the four notes applies to
`fin-contingency-reserve` (they are about depreciation rates, lease accounting, currency and the fiscal year).
Nothing to copy.

## Shared requests

- **Promote `reserve.js` to `models/reserve.js`** if `fin-ale-risk` (worst simulated year) or another sim draws
  totals from ranges. It moves unchanged; its tests are the rule tests in `sim.test.js` that call `M.` directly.
  Its `rng` duplicates `Simdeck.rng` on purpose (a model must not depend on the kit); a test checks they match.
- **Glossary:** add the term pairs above.
- **Learn tree:** catalogue §4.12's placement: area `money`, subject `risk` "Rizik izražen u novcu" / "Risk in money",
  leaf `reserve` with `fin-contingency-reserve`.

## Review

A fresh reviewer (a separate agent with only the files) read the code against `SPEC.md` and ran the SPEC script:
every rule, tie-break and preset number matched. It tried 91 rule-breaking mutations; 66 were caught. Most survivors
behave exactly like the original (e.g. `Math.round` for halves-up rounding of non-negative totals, `u <= fc` at the
mode, clamping before snapping). The real gaps are now covered by tests, each checked to fail on its mutation:
- nearest rank with `Math.round` instead of `Math.ceil` (only visible when q n / 100 is not integral or .5);
- the histogram axis not reaching a base above every total; the step taken from a fifth instead of a quarter span;
- `BINS`, `SEED_MAX`, `CONF`, `TRIALS` asserted as literals; Run again wrapping (moved into `sim.js` `nextSeed`);
- the `nFew` threshold at 1 000 trials; `nSkew` with averages exactly equal to the base;
- a blank range value from a URL becoming 0; the lines' scale with every line at 0 €.

Fixed defects and wording:
- **`nSkew` claimed more than its condition:** it said every line overruns further than it saves, but shows whenever
  the sum of the averages is above the base; it now speaks of the lines taken together.
- **SPEC's "symmetric"** now says what the code does (low and high equally far from the most likely value; a line at
  0 € counts).
- English labels say "the sum of the most likely values" (not "of the most likely"); the fall/rise sliders read
  "may come in lower by 5%" / "may run higher by 15%" (no "fall by −5%"); "about half the trials cost more than P50"
  (nearest rank with ties); Croatian "pričuva je postala"; a wrong comment in `reserve.js`; a dead branch in `oneOf`.

## Time

Started 2026-11-07 07:07, done 07:25: about 18 minutes, the fresh review and its fixes included.
