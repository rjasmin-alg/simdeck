<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-npv-discounting: notes

New explorer (task `docs/tasks/w3/fin-npv-discounting.md`, catalogue `fin-npv-discounting` §4.12, overlap §5.23).
Rules and expected numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** every year is drawn twice in one column, the nominal flow as a dashed outline and
  its value today as a solid bar inside it, with the numbers under it (nominal, × factor, worth today). The two sums
  sit side by side on top: "on paper" (Σ nominal) and the NPV, with the amount discounting took off. A third tile
  answers the first half of the concept directly: what 1 € at the end of the horizon is worth today.
- **Discounting in its own file** (`discount.js`): `factor`, `presentValue`, `npv`, `table`, `roundMoney`, `sign`,
  pure functions over numbers, no words. It already has the shape of a shared model (registers on
  `globalThis.SimdeckModels.discount` in a page, `module.exports` under node), so promotion to `models/discount.js`
  is a move plus a `<script src>` path change. Its tests are the "discount.js" block in `sim.test.js`.
- **Rates are percent in the params, decimals in `discount.js`** (8 → 0.08), so the shared module takes the form
  the investment pages will want.
- **End-of-year timing**, year 0 = today (undiscounted). Mid-year timing is out of scope.
- **Sign tie-break (SPEC rule 5):** the verdict is the sign of the NPV rounded to the euro, half away from zero, so
  `just-the-rate` (−100 000 today, 108 000 in a year, 8 %) reads exactly 0 although floating point may leave
  1e-11. "NPV = 0" is worded as "earns exactly the cost of capital", not as a loss.
- **The NPV is the rounded exact sum,** not the sum of the rounded per-year values; they can differ by a euro or two
  (spreadsheet behaviour). Stated in SPEC rule 6.
- **Flows as params:** `cf0` … `cf10` are hidden range params (−200 000…200 000 €, step 1 000), so the kit keeps them
  in the URL, clamps and snaps them, and presets set them. They are edited on the stage: drag a column (pointer
  down anywhere in it sets the value, so a click also works) or focus it (Tab) and press ↑/↓ (Shift: ×10). Each
  column is a `role="slider"` with its value text, and the kit leaves arrows to a focused slider. Focus is given
  back to the same column after each re-render.
- **Vertical range** follows the flows (grid steps of 1, 2, 2.5 or 5 × 10^k, at least one step each side of zero so
  a bar can be dragged across it) and is frozen while dragging, so the scale does not move under the pointer.
- **Horizon (`years`, 1–10):** flows after the horizon are kept in the params but not drawn or counted, so shrinking
  and growing the horizon loses nothing.
- **Mirror button (M):** reverses years 1…n; same sum on paper, different NPV. It is the "same total, later" lesson
  in one key, alongside presets 5 and 6.
- **Changed mark:** the NPV tile is highlighted when a change flips the NPV's sign (same mechanism as
  `backup-window`).
- **"Illustrative" note:** shown once, in the stage footer under the chart ("The amounts are made up but plausible").
- **No IRR, no NPV-vs-rate curve:** the rate at which NPV is zero is `fin-roi-payback-npv`'s concept. SPEC notes
  where `upgrade` crosses zero (14.05 %) for the lecturer, the page does not.
- **English money format** is €120,000 / −€2,675 and 8%; Croatian 120 000 € / −2 675 € and 8 %. Minus is U+2212.
- **Phone:** the chart scrolls sideways inside its own box (the page does not); columns use `touch-action: pan-x`
  so a vertical drag sets the flow and a sideways one scrolls.
- **No glossary terms:** none of the finance terms are in `kit/glossary.js`, so the strings write the pairs out
  (Croatian term, with the English in italics and parentheses on the Croatian page) and the page does not link
  `glossary.js`. Term pairs below.
- **Verdict wording assumes an investment shape** (outflow first, inflows later). A student who drags a loan shape
  (inflow today, outflows later) still reads "the investment earns more than the cost of capital" for NPV > 0;
  acceptable at intro level, noted by the reviewer.
- **While dragging past the frozen range** a bar can draw beyond the plot until the pointer is released; then the
  range grows to fit.
- **Concepts, not tools:** no product, vendor or tax rule is named. No accounting standard is named either (none is
  needed for NPV).

## Deviations from the task

- Added the **mirror** button and the **horizon** param (the task names only drag and the rate). Both stay inside
  the one concept.
- **Croatian-first term order** in the Croatian explanation ("*diskontna stopa* (engl. *discount rate*)"), the
  reverse of COMMON.md §4's glossary rule (English term first). Deliberate: the task asks for standard Croatian
  accounting terms, these are the words Croatian finance staff use, and none of the terms is in the glossary. If
  the coordinator adds them to the glossary, the explanation can switch to `[[term]]` and the kit's order *(check)*.
- The "Model and presets" section of the task was empty; `SPEC.md` fills it (params, rules, tie-break, six presets,
  legend, captions, misconceptions, out of scope).

## Sources

- Discounting and NPV: Brealey, Myers & Allen, *Principles of Corporate Finance*, ch. 2 (present value, the
  discount rate as the opportunity cost of capital, NPV rule) — standard textbook formula, not a local course.
- Presets: made-up but plausible amounts; numbers checked with exact fractions (the script at the end of
  `SPEC.md`) before coding, then by the preset test.
- No local course material exists for FIN (the task says so).

## Unchecked *(check)*

- The Croatian term choices below *(check)*, in particular "diskontni faktor" and "nominalni iznos".
- Whether the owner wants the IT-manager framing in the presets (server upgrade, savings) or neutral "project"
  wording *(check)*.

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| time value of money | vremenska vrijednost novca |
| cash flow | novčani tok |
| discount rate | diskontna stopa |
| cost of capital | trošak kapitala |
| discount factor | diskontni faktor |
| present value | sadašnja vrijednost |
| net present value (NPV) | neto sadašnja vrijednost (NSV) |
| nominal amount | nominalni iznos |
| inflow / outflow | priljev / odljev |

## For the owner

- Catalogue §4.12 "Where Croatian practice commonly differs" has no line for `fin-npv-discounting`, so nothing is
  copied here. The nearest one (`fin-indexation-fx`: Croatia uses the euro since 2023, currency risk lies in
  contracts priced in another currency) belongs to that page, not this one.

## Shared requests

- **Promote `discount.js` to `models/discount.js`** before `fin-roi-payback-npv`, `fin-lease-vs-buy` and
  `fin-prepay-discount` start (catalogue §5.23 says this page holds the discounting they reuse). It is ready to move
  unchanged; then point this page at `../../models/discount.js` and move the "discount.js" test block to
  `models/discount.test.js`.
- **Glossary:** add the term pairs above.

## Review

A fresh reviewer (separate agent, no shared context beyond the files) read the code against `SPEC.md` and tried 35
rule-breaking mutations: 25 were caught, 5 harmless, 5 exposed test gaps (the "time ate" note at a zero sum, `empty`
inside the horizon, the sign of `lost`, the other clamping bounds, a rounded factor in `table`). Tests were added for
all five and each mutation now fails them. The reviewer also caught the explanation calling the divisor (1 + r)^t
the discount factor (it is 1 / (1 + r)^t, the multiplier the stage shows), two Croatian gender slips (NSV is
feminine), the noise example's sign in SPEC rule 5, and "it is not inflation" (now "not the same as inflation": a
nominal rate includes expected inflation). All fixed. Before that, 16 mutations of my own were all caught.

## Time

Started 2026-11-06 22:53 (task commit on main), done 2026-11-06 23:13: about 20 minutes. Model, tests and first gate pass took about half, the review, its fixes and the final checks the rest.
