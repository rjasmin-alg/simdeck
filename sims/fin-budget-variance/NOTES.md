<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-budget-variance: notes

New stepper (task `docs/tasks/w3/fin-budget-variance.md`, catalogue `fin-budget-variance` §4.12, overlap §5.23: the
shared ledger model). Rules and expected numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** each month seen two ways, what the budget said and what the report booked. Twelve
  month columns with the booked actuals as a stacked bar (cloud solid, licences striped), the month's budget as a
  thick bar with end ticks, a dashed "?" box where service was used but not invoiced, and a hatched, dashed-edged
  segment for an accrued estimate. Months not yet booked show the **run-rate forecast as hatched bars**, so a missing
  invoice visibly shrinks the whole rest of the year. Beneath: the variance to date as diverging bars (volume, price,
  timing, total; over to the right, under to the left, hatched when under) and the year-end forecast as two
  horizontal bars (the year's budget, and booked to date + the run-rate part), with its rule written out.
- **Two budget lines, three injections, one per part:** cloud usage (+300 units from month 5: volume), licence
  renewal at €48 instead of €40 from month 7 (price), month 10's cloud invoice booked in month 11 (timing). Each part
  then has one clear cause and one caption; the variance formulas still run on both lines (rule 5), so the
  use-it-or-lose-it spending lands as cloud volume by itself.
- **Variance split:** price at actual quantity, volume at budgeted price (the textbook convention), so
  volume + price + timing = booked − budget exactly, in every month and every combination (tested over all 32).
- **Timing via the ledger:** a line's expense (what belongs to the month) and booked actuals (what the report shows)
  are the copied ledger's `billed(use, pay)`; timing to date is the ledger's cash − expense. The ledger's "cash" line
  means "booked" here, which is why the footer says the report books invoices, not payments.
- **Run rate = the latest month booked** (not the average to date): it catches a lasting change in volume or price
  at once, and carries a missing or doubled invoice straight into the forecast, which is the lesson. The average is
  mentioned in no string, to keep one method.
- **"Use it or lose it phasing" as a preset**, read as: the apparent underspend at month 10 (budget to date − booked
  to date) is spent in month 11. With the late invoice it is exactly the missing invoice, so the year ends €10 000
  over. With the accrual on, nothing looks left over and nothing is spent. See Deviations.
- **Over / under budget** instead of favourable / unfavourable: plainer for IT managers; one sign convention
  (booked − budget, + is over).
- **Accrual is exact** (the estimate equals the invoice): an estimate's own error would be a second variance.
- **Fiscal year start** (`fy`, as in `fin-accruals-cash`): only renames the months; the late invoice is fiscal month
  10, which is October with the default.
- **Panel fit:** toggles have no hints (the labels carry the month), and the planned separate volume and price
  presets were merged into one `real` preset ("Volume and price"); the `all` preset still stops on each with its own
  caption at months 5 and 7. Before that the panel was 1105 px tall against 862.
- **Grayscale:** cloud vs licences by stripes and stack position, budget by a thick bar with end ticks, missing by a
  dashed box with "?", accrual by hatch plus dashed edge, forecast by grey hatching, under-budget parts by hatching
  and direction; every number carries its sign.
- **Croatian amounts** use non-breaking spaces (thousands and before €), so "+4 800 €" never breaks across lines.
- **No glossary terms:** none of the terms are in `kit/glossary.js`; the strings write the pairs out and the page does
  not link `glossary.js` (as the other `fin-` sims).
- **Concepts, not tools:** no product, vendor or tax rule on the page; no accounting standard is named on the stage.
- **Croatian "budget" is *proračun*** (owner, 2026-11-07; it replaced *plan*): the stage, legend, captions and
  explanation call the budget itself *proračun* ("iznad / ispod proračuna", "proračun za mjesec", "proračun za
  godinu"). *Plan i ostvarenje*, the usual Croatian name of a budget-vs-actuals report and its two columns, stays in
  the title, in two search aliases and once in the explanation, which names the report ("izvještaj *plan i
  ostvarenje* uspoređuje proračun s knjiženim ostvarenjem"). The verb forms stay where they read as "budgeted"
  ("po planiranoj cijeni", "nego što je planirano"): *proračunati* means "to calculate", so "proračunska cijena" or
  "proračunato" would mislead. The preset entry's concept became "„Ispod proračuna” u listopadu bio je kasni račun;
  potrošen, završi iznad njega" to stay within 80 characters.

## Deviations from the task

- **"Use-it-or-lose-it phasing as a preset"** is built as a spending decision (the apparent underspend spent before
  year end), not as a different budget phasing. The catalogue line is ambiguous; this reading ties the preset to
  "under budget in October is often a missing invoice". *(owner: confirm; docs/tasks/OPEN.md is outside this task's
  scope, so it is in the report instead)*
- **Presets set the fiscal year to January** (the kit applies a preset's params over the defaults), so the hints'
  "October" stays true; the select changes it afterwards.
- **Five presets, not six:** volume and price are one preset (panel height; see Decisions). Each alone is one toggle.
- **"An invoice late or early":** only late is modelled; early is the mirror image and is in the explanation.
- The task's "Model and presets" section was empty; `SPEC.md` fills it.

## Sources

- Flexible-budget variance analysis, price (rate) variance at actual quantity and quantity (usage) variance at
  standard price: any management-accounting text, e.g. Horngren, Datar, Rajan, *Cost Accounting: A Managerial
  Emphasis*, chapters on flexible budgets and direct-cost variances *(check: edition and chapter)*.
- Month-end accrual for services received but not invoiced: standard close practice; the accrual basis itself is in
  IAS 1 (see `fin-accruals-cash/NOTES.md`) *(check)*.
- Run-rate forecasting (latest period extended to year end) and its weakness with lumpy periods: common FP&A
  practice, no single authoritative source *(check)*.
- "Use it or lose it" year-end spending: widely described in budgeting literature *(check)*.
- Numbers: made up but plausible, whole euros; checked by the independent script in `SPEC.md` (output identical to
  the model's for every preset and step) and by the preset tests.

## Unchecked *(check)*

- The source references above (edition, chapter).
- The Croatian terms below, in particular *odstupanje količine / cijene* and *vremensko odstupanje* for volume, price
  and timing variance, and *tempo zadnjeg mjeseca* for run rate. (*Proračun* for budget is the owner's choice,
  2026-11-07, see Decisions.)
- That per-seat licence subscriptions are commonly invoiced monthly (many are annual; monthly keeps the price variance
  visible month by month).

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| budget | proračun |
| budget vs actuals (the report) | plan i ostvarenje |
| actuals | ostvarenje (knjiženo ostvarenje) |
| variance | odstupanje |
| over budget / under budget | iznad proračuna / ispod proračuna |
| volume variance | odstupanje količine |
| price variance | odstupanje cijene |
| timing variance | vremensko odstupanje |
| run rate | tempo zadnjeg mjeseca (prognoza prema zadnjem mjesecu) |
| forecast | prognoza |
| phasing | raspored proračuna po mjesecima |
| use it or lose it | iskoristi ili izgubi |
| accrued expense | obračunati trošak (pasivno vremensko razgraničenje) |
| fiscal year | poslovna godina |

## For the owner

From catalogue §4.12, "Where Croatian practice commonly differs" (not verified, not on the page):

- `fin-budget-variance`, `fin-accruals-cash`: the fiscal year is usually the calendar year (the DR estate uses April
  to March, hence the parameter).

## Shared requests

- **Ledger:** `ledger.js` is a copy of `sims/fin-accruals-cash/ledger.js` @ bdcd789, unchanged (header line added). When
  `models/ledger.js` is promoted (with `billed`, as `fin-accruals-cash` requests), point this page at
  `../../models/ledger.js`, drop the local copy and its "ledger (copied)" tests.
- **Glossary:** add the term pairs above.
- **Learn tree:** the leaf exists: `learn.json` area `money`, subject `books`, leaf `variance` ("Plan i ostvarenje" /
  "Budget vs actuals"), which holds only `fin-accruals-cash` today. Add `fin-budget-variance` first in it.
  `fin-budget-variance#use-it` is the listed entry.

## Review

A fresh reviewer (separate agent, given only the files) checked `SPEC.md` against the code and recomputed the preset
numbers from the model: no mismatch in the numbers. It found that `SPEC.md` still described a waterfall bridge while the
page draws bars from a zero line (`SPEC.md` now describes the page), and it tried 58 mutations of `sim.js` and
`ledger.js`: 44 killed, 13 survived. Equivalent survivors: the `z()` / `tidy()` −0 guards, the fixed €192 000, and the
volume-vs-price priority (months 5 and 7 never coincide). The dead field `month.accrual` is gone. The real gaps, now
tested: rule 5 on one line with both a volume and a price change, `normalise` actually parsing `'1'` / `'0'`, `gEven`
with price and timing cancelling, event months with their flag off (5, 7, 10, 11 are ordinary months), and
`month.expense` (which draws the "used, not invoiced" box). The author re-ran three of those mutations: all killed.
Wording fixed: the "Accrued" hint said "all three parts" while only two remain; `cSpend` said "October looked … under"
for the year to date (now "the year to date at the end of October"); `cNoSpend` hid month 11's double invoice (now
ranked below the late invoice's arrival, and worded about the year to date); the year-end captions claimed the timing
variance was "back to 0" even with no late invoice (now a separate `gYearLate` sentence, only with the late invoice);
"not the post" → "not when the invoice happened to arrive". Croatian: *tekuća stopa* (a calque that reads as a
percentage) → *tempo zadnjeg mjeseca*, *do danas* → *od početka godine*, "Obračunaj trošak bez računa", "po cijeni od …
po korisniku". Left as is: under the late invoice without an accrual, month 10's "missing" box sits above the licence
segment (cloud's booked part is 0), which is cosmetic; and presets set the fiscal year to January, so the hints'
"October" stays true.

## Time

Started 2026-11-07 04:18, done 04:43: about 25 minutes: reading and the numbers about 6, model, spec, strings and tests about 6, the page and the gate (the panel was too tall twice) about 5, the review (run in parallel with these notes), its fixes and the final checks the rest.
