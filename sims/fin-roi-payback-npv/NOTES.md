<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-roi-payback-npv: notes

New explorer (task `docs/tasks/w3/fin-roi-payback-npv.md`, catalogue `fin-roi-payback-npv` §4.12, needs
`fin-npv-discounting`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** one scoreboard reads the same two projects three ways (ROI, payback, NPV at the
  rate), each row with what that yardstick ignores ("ignores when the money comes", "ignores everything after it",
  "depends on the rate") and a "picks" column. Below it, the cash flows (paired bars per year, A solid, B hatched,
  each payback point marked) and the **NPV profile** (both NPVs against the rate, 0–30 %), which carries the second
  half of the concept: each IRR is where a curve crosses zero, the crossing is where the projects swap, and the chosen
  rate is a vertical line with both NPVs on it.
- **IRR is shown, not ranked.** The concept names three yardsticks and defines IRR as the rate where NPV = 0; a fourth
  "vote" would bring in the IRR-ranking pitfalls (scale, timing), a second concept. The IRR row says "a rate, not a
  vote". The profile still lets a lecturer show that A has the higher IRR while B has the higher NPV at 8 %.
- **Two modules, both promotable:** `discount.js` is the `fin-npv-discounting` copy, unchanged apart from its header
  (`models/discount.js` does not exist yet; COMMON.md §6). A test compares the copy with the source line by line, so
  drift is caught until the coordinator promotes it. `yardsticks.js` (ROI, payback, IRR search, crossings, the picks
  with their tie-breaks) is new, pure, words-free and takes the NPV function as an argument, so it can move to
  `models/yardsticks.js` unchanged (`fin-cost-of-delay`, `fin-lease-vs-buy` and `fin-prepay-discount` may want it).
- **Simple ROI** is (Σ flows) / (Σ outflows) over the horizon, nominal and not annualised: the business-case "net gain
  per euro put in". The explanation notes that with equal investments it ranks like NPV at 0 %.
- **Payback is interpolated within the year** (1.5 years, not "year 2"), the usual business-case form; NPV keeps the
  end-of-year timing of `fin-npv-discounting`. On the chart the payback mark sits between the year columns at the
  interpolated point. A later outflow that drives the cumulative below zero again does not undo the payback (first
  crossing only): that is part of "ignores everything after".
- **Tie-breaks at the shown precision:** ROI to 0.1 percentage point, payback to 0.1 year, NPV difference to the euro
  (half away from zero), so `at-the-swap` reads an exact tie although the floats differ in the last bits, and two
  values the page shows equal never get different picks.
- **IRR search:** a grid (−90…100 % by 0.1 %, then to 1 000 % by 1 %) with bisection, so non-conventional flows report
  "several" with each root instead of one arbitrary one; no Newton iteration (no starting-point dependence). A root
  that touches zero without crossing between two grid points is not found; documented in SPEC rule 6 and tested.
- **Rate range 0–30 %** (the NPV sim stops at 20 %): the default projects cross at 14.6 % and IRRs sit near 17–20 %, so
  both need to be on the profile with room to spare.
- **Flows as params** `a0…a8`, `b0…b8` (hidden ranges, step 1 000, ±200 000), edited on the stage like
  `fin-npv-discounting`: drag a bar (pointer down sets it, so a click works) or focus it (Tab) and press ↑/↓ (Shift:
  ×10). Each bar is a `role="slider"` with its value text.
- **Changed mark:** the "picks" cell of a yardstick whose pick changed is highlighted (preset 2 after preset 1 marks
  only NPV, which is the lesson).
- **"Illustrative" note:** once, in the stage footer.
- **Number formats** as in `fin-npv-discounting`: Croatian 16 306 € / 14,6 % / 1,5 god., English €16,306 / 14.6% /
  1.5 yrs; minus is U+2212.
- **Phone:** the scoreboard moves each "picks" cell under its row, the ✓ inside a value cell is dropped (the picks line
  says it), the charts stack, the flow chart scrolls sideways in its box, and the profile shows ticks every 10 %.
- **No glossary terms:** none of the finance terms is in `kit/glossary.js`; the strings write the pairs out
  (Croatian-first in the Croatian explanation, as `fin-npv-discounting` does) and the page does not link
  `glossary.js`. Term pairs below.
- **Concepts, not tools:** no product, vendor, tax rule or accounting standard is named.

## Deviations from the task

- The "Model and presets" section of the task was empty; `SPEC.md` fills it (params, 12 rules with tie-breaks, six
  presets with checked numbers, legend, misconceptions, out of scope).
- Added the **horizon** param (`years`, 1–8), as in `fin-npv-discounting`; flows past it are kept but ignored.
- IRR is shown but not used as a ranking (see Decisions); the task says "IRR is the rate at which NPV is zero", which
  the profile shows directly.

## Sources

- NPV, IRR, payback and the book/simple rate of return as competing rules, the IRR pitfalls with mutually exclusive
  projects, and the crossover (Fisher) rate: Brealey, Myers & Allen, *Principles of Corporate Finance*, ch. 5 ("Net
  present value and other investment criteria").
- Descartes' rule of signs for the number of IRRs: any algebra text; also mentioned in the same chapter's discussion of
  multiple rates of return.
- Discounting: copied model, sources in `sims/fin-npv-discounting/NOTES.md`.
- Presets: made-up but plausible amounts; numbers checked with exact fractions (the script at the end of `SPEC.md`)
  before coding, then by the preset test.
- No local course material exists for FIN (the task says so).

## Unchecked *(check)*

- **Simple ROI definition:** the business-case form used here (net cash gain over the amount invested, whole horizon,
  not annualised) is common practice, but textbooks mostly treat the *accounting* (book) rate of return, which uses
  average profit after depreciation over average book value. The page says "ROI here is…" to make the choice explicit
  *(check)*.
- **Payback interpolation within the year** is a common convention, not universal; some texts count whole years
  *(check)*.
- Croatian terms below, in particular "stopa presjeka" for the crossover rate, "ISP" as the abbreviation of interna
  stopa povrata, and "god." as the short form for years *(check)*.

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| return on investment (ROI) | povrat ulaganja (ROI) |
| payback period | razdoblje povrata |
| net present value (NPV) | neto sadašnja vrijednost (NSV) |
| internal rate of return (IRR) | interna stopa povrata (ISP) |
| crossover rate | stopa presjeka *(check)* |
| NPV profile | profil NSV-a |
| yardstick (investment criterion) | mjerilo (kriterij ulaganja) |
| cumulative cash flow | kumulativni novčani tok |
| cost of capital | trošak kapitala |
| discount rate | diskontna stopa |

## For the owner

- Catalogue §4.12 "Where Croatian practice commonly differs" has no line for `fin-roi-payback-npv`, and none of the
  listed ones (depreciation rates, lease accounting under HSFI, the euro since 2023, the calendar fiscal year) applies
  to ranking projects, so nothing is copied here.

## Shared requests

- **Promote `discount.js` to `models/discount.js`** (already requested by `fin-npv-discounting`); then point this page
  at `../../models/discount.js`, drop the local copy and its copy test and the "discount.js" test block.
- **Consider `yardsticks.js` for `models/yardsticks.js`** once a second sim needs ROI, payback or IRR
  (`fin-cost-of-delay`, `fin-lease-vs-buy`, `fin-prepay-discount` are candidates). It is ready to move unchanged; its
  tests are the "yardsticks.js" block in `sim.test.js`.
- **Glossary:** add the term pairs above.

## Review

Before the review I ran 32 rule-breaking mutations of my own; three survived (the IRR search's upper end, the
IRR note on an empty project A, the crossing note beside two IRR notes) and got tests.

Then a fresh reviewer (separate agent, no shared context beyond the files) read the code against `SPEC.md` and ran 34
mutations: 15 caught, 4 equivalent, 15 survived. Each survivor now has a test. It also found these defects, all fixed:

- **ROI pick vs display:** the pick rounded `x * 1000`, the page `x * 100 * 10`; in floating point these differ at
  half-way ratios, so two rows could both show 28.7 % and still have a winner. Now one helper (`tenthsPct`) serves both.
- **NPV tie on the difference:** rounding NPV(A) − NPV(B) could call two equal shown amounts (−11 637 €) a win, or
  51 418 € vs 51 419 € a tie. Now each NPV is rounded first, then compared (SPEC rule 8 changed).
- **"Outside −90…1000 %"** was wrong for flows with no IRR at all (−100 000, 150 000, −100 000). It now says "none in
  −90…1000 %".
- **"The yardsticks disagree"** appeared for identical projects (all ties) and for one empty project. There is now a
  neutral caption (`capPicks`) when nothing actually disagrees.
- **IRR note with several IRRs:** it now says "one of its internal rates of return".
- **A tiny crossing** (0.03 %) read "0.0 %". Crossings under 1 % are now shown to 0.01 %.
- **"The chart on the right"** is wrong on phones, where the charts stack. The explanation now names the chart.
- **Smaller fixes:** `normalise` read an empty URL value as 0 instead of the default; English "1 yrs" (now "1 year" /
  "1.5 years"); clearer `pIrr` hint; Croatian "Krivulje NSV-a", "ne može ih usporediti", "ne razlikuje projekte";
  English "crossover rate" in the caption; dead code removed (`cumulative`, `PROJECTS`, an unreachable branch).
- **Not changed:** the "above it" reading for a crossing exactly at 30 % is taken at 30.5 %, just off the chart, which is
  mathematically right. The explanation's "with equal investments ROI ranks like NPV at 0 %" fails only for investments
  over 1 M€, beyond the ±200 000 € range.

## Time

Started 2026-11-07 02:24 (thread start), done 2026-11-07 02:52: about 28 minutes. Model, SPEC check, page and tests to a first passing gate took about 15 minutes; my mutation pass, the fresh review (about 9 minutes of agent time), its fixes and the final checks took the rest.
