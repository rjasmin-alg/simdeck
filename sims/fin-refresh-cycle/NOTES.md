<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-refresh-cycle: notes

New explorer (task `docs/tasks/w3/fin-refresh-cycle.md`, catalogue `fin-refresh-cycle` §4.12, overlap §5.23: the asset
model shared with `fin-depreciation`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage: two panels.** Left, the **economic life**: for every cycle 2–8 years one stacked bar
  of the cost per device a year (capital cost = depreciation, support and repairs, lost staff time), the lowest
  starred, the chosen one outlined. Right, **ten years of the fleet**: each year a **cash** bar (purchases − resale,
  support and repairs) beside a **cost** bar (depreciation, support and repairs, lost staff time hatched on top). The
  finance notes ask for one decision seen two ways: here cash (a wall every *n* years) against expense (the same
  depreciation every year), and the budget's cost (cash) against the full cost (with staff time).
- **The useful life is the cycle.** A device kept *n* years is depreciated straight-line over *n* years down to its
  resale value at age *n*, and sold for exactly that, so the capital cost per year *is* the yearly depreciation and
  the sale books no gain or loss. This keeps one concept: a book life different from the cycle (write-offs, fully
  depreciated kit still running) is `fin-depreciation`'s gain/loss story and is out of scope (SPEC.md).
- **The asset model, copied:** `asset.js` is `sims/fin-depreciation/asset.js @ 10381af`, unchanged below a two-line
  "copied" header (COMMON.md §6: `models/asset.js` does not exist yet). Used: `schedule` (`sl`) for each device's
  depreciation, `bookAt` for the fleet's book value, `disposal` for the sale at the refresh (outcome `none`),
  `tidy` and `roundMoney`. Only straight-line is used; declining balance stays fin-depreciation's.
- **New model parts, promotable:** the age-cost curve (`resale`, `failRate`, `supRep`, `staffCost`, `perDevice`,
  `curve`, `lowest`) and the cohort timeline (`cohortsOf`, `ageIn`, `fleetYears`, `fleetBook`, `shownSeries`) are pure
  functions over plain numbers in `sim.js`, no words. If a later page needs them they can move to a model file as is.
- **Steady state.** The ten years start in the cycle's rhythm (every cohort was bought before year 1 as the cycle
  says), so one cohort refreshes in years 1, 1 + *n*…, and a staggered fleet is already staggered. The alternative
  (a new fleet bought in year 1, then staggered by refreshing some early) mixes a transition into the picture.
- **Fixed fleet and device, four controls.** 240 devices at 1 200 € (240 divides by every cohort count but 7, so the
  rule 2 tie-break shows only at 7 cohorts), resale halving every year, 3-year warranty, support 8 % of the price a
  year and repairs 25 % per failure after it, failures 5 % × 1.5 per year of age, 6 h lost per failure, 40 € an
  hour. The student moves the cycle, the cohorts, the slowdown (hours lost per year of age) and whether staff time
  counts. Price and fleet size scale everything linearly and would not change what the page teaches; four sliders and
  five presets fit the panel at 1920×1080.
- **Numbers tuned** so that the default's economic life is 4 years, 7 with staff time left out, 6 with no slowdown,
  3 with a slowdown of 1.5 h or more; the economic life is never at an edge of the range (tested over every slowdown
  and both staff settings), so no "the minimum may lie outside" caption is needed. The bottom is flat (402 vs 408 and
  409 €), a point the explanation makes.
- **Economic life tie-break: the longer cycle** (the same yearly cost with fewer refresh projects). No param value
  produces a tie; the rule is tested on `lowest` directly.
- **Lost staff time is not cash.** It is shown hatched ("not paid out") and is left out of the cash and the expense;
  it counts only in the cost per device and the cost bar. The `staff` toggle removes it everywhere: the "only what the
  budget sees" preset shows the economic life jumping from 4 to 7 years.
- **Slowdown disabled when staff time is off** (`disabled` with the reason as its hint, kit behaviour).
- **Bar labels in thousands** (axis "thousand €"), only on the cash bars, so ten pairs stay readable; the rows beneath
  carry the euros.
- **Changed marks:** the ★ label when the economic life moves, and the ten-year rows whose shown value changed.
- **Grayscale:** capital/depreciation solid, purchases − resale solid with a light inner frame, support and repairs
  dotted, staff time hatched, the chosen cycle outlined, the economic life ★; the cash bar is always the left one of
  a pair (the panel's subtitle says so).
- **No glossary terms:** none of these finance terms are in `kit/glossary.js`; the strings write the pairs out and the
  page does not link `glossary.js` (as the other `fin-` pages).
- **Concepts, not tools:** no product, vendor or tax rule. IAS 16 is named in the explanation only (MRS 16 in
  Croatian).

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The student does not set the fleet size or the device price (fixed, see Decisions).
- "Run ten years" is the explorer's whole ten-year timeline at once, not a stepper: the task's class is explorer.

## Sources

- IAS 16 *Property, Plant and Equipment*: ¶ 50–62 (depreciable amount = cost − residual value, allocated over the
  useful life; useful life = the period the entity expects to use the asset, ¶ 56–57 consider expected usage,
  physical wear and technical obsolescence), ¶ 67–72 (derecognition, gain or loss = proceeds − carrying amount).
- Economic life / optimal replacement period: the standard equipment-replacement analysis of engineering economics
  (minimum average annual cost of ownership, undiscounted; with interest, the minimum equivalent annual cost),
  e.g. the "replacement analysis" chapter of an introductory engineering-economics text *(check)* which text the
  owner's course uses.
- Staggered refresh as cash smoothing: common IT asset-management practice; no single source *(check)*.
- Numbers: made up but plausible, checked with exact fractions (script at the end of `SPEC.md`) and by the preset
  tests.

## Unchecked *(check)*

- The illustrative cost curve: resale halving each year, failure growth × 1.5, 6 h per failure, the slowdown in
  hours per year of age, 40 € an hour. Plausible orders of magnitude for business laptops, not sourced.
- Whether the course wants lost staff time in the economic-life total at all (the toggle lets the lecturer choose).
- The Croatian terms below, in particular "ekonomski vijek trajanja", "postupna zamjena", "skupina" for a cohort,
  "zid isplata" for the spending wall, "trošak u poslovnim knjigama".

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| refresh cycle | ciklus zamjene (opreme) |
| economic life | ekonomski vijek trajanja |
| cohort (of devices) | skupina (uređaja) |
| staggered refresh | postupna zamjena |
| capital cost | kapitalni trošak |
| depreciation | amortizacija |
| cash (paid out) | isplate, novčani tok |
| expense (in the books) | trošak (u poslovnim knjigama) |
| support and repairs | podrška i popravci |
| lost staff time | izgubljeno radno vrijeme |
| warranty | jamstvo |
| resale value | preprodajna vrijednost |
| residual value | ostatak vrijednosti |
| book value | knjigovodstvena vrijednost |
| useful life | vijek uporabe |
| spending wall | zid isplata |

## For the owner

From catalogue §4.12, "Where Croatian practice commonly differs" (not verified, not on the page):

- `fin-capex-opex`, `fin-depreciation` (applies here too): firms often book depreciation at the maximum rates the
  profit-tax rules allow, so computer equipment is commonly written off over two years, shorter than its useful
  life; low-value items (sitni inventar) are often expensed when put into use. With a two-year book life and a
  four-year cycle, the books would show the cost in the first two years and nothing after: the cash wall would
  reappear in the expense. The page keeps the book life equal to the cycle.

## Shared requests

- **Promote `asset.js` to `models/asset.js`** (already requested by `fin-depreciation`); this copy is identical to
  fin-depreciation's below the header. Then point this page at `../../models/asset.js` and drop the copy; its own
  tests (`asset (copied)` in `sim.test.js`) can go with it.
- **Kit:** none needed.
- **Glossary:** add the term pairs above.
- **Learn tree:** suggested leaf: area `money`, subject `books` ("How finance books a purchase"), leaf
  `depreciation`, next to `fin-depreciation` (catalogue §4.12's outline). The listed entry is
  `fin-refresh-cycle#budget`.

## Review

A fresh reviewer (separate agent, no shared context beyond the files) read the code against `SPEC.md`, ran the SPEC
script, compared all 630 param combinations with exact fractions and ran 76 rule-breaking mutations of `sim.js`.
No model bug. Findings, all applied:

- **Rounding on .5 boundaries:** 34 of 630 combinations showed a year (or the caption's fleet excess) 1 € off the
  exact fraction, because per-device amounts were tidied to a millionth before being multiplied by the cohort size
  (and `asset.js`'s straight-line amount is itself tidied). Per-device amounts are now summed untidied and tidied once
  summed; the fleet's depreciation uses the straight-line amount untidied (a test checks it equals `asset.js`'s
  schedule); `excessFleet` is computed before rounding. All 630 now match; tests pin two former cases.
- **A caption that contradicted the model:** `nStagger` said staggering spreads the *cost*; with one cohort the
  expense is already flat, staggering spreads the *cash*. Reworded (and SPEC).
- **Rule 10 vs the page:** the left "total per device a year" row was never marked; `changed()` now adds `total`.
- **Test gaps (5 real survivors):** rounding of `cycle` (4.6), `cohorts` not rounded (2.4 gave 300 devices),
  `num()` accepting booleans or blanks, an asymmetric cohort offset (`+offset` vs `−offset`), `leadOne` at cycle 2.
  Each now has a test. The other survivors were equivalent (no observable difference).
- **Wording:** hr "Dulje od", "plaćaju se ugovor … i popravci", "ciklus od {years}", "godina s najviše isplata",
  "Računaj izgubljeno radno vrijeme"; en "almost the same every year, about"; the slowdown value written out ("h a
  year per year of age"); concept "a cash wall"; summary "see ten years" (an explorer does not run).
- SPEC's legend now matches the page (purchases `--c5` with an inner frame; the chosen cycle is an outline).

Not changed: the per-device excess in the caption is rounded on its own (57 €), so 57 × 240 ≠ the fleet figure
beside it (13 579 €); both are correct roundings of 56.58 and 13 578.75 (rule 9).

## Time

Started 2026-11-07 04:47, done 05:12: about 25 minutes. Spec, tuning the cost curve and the check script about 8
minutes, model and tests 5, page and fitting the panel 5, the review (in parallel with these notes) and its fixes
the rest.
