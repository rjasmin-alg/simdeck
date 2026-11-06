<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-capex-opex: notes

New explorer (task `docs/tasks/w3/fin-capex-opex.md`, catalogue `fin-capex-opex` §4.12, overlap §5.23: the hub of
the shared ledger model). Rules and expected numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** two panels on one scale, **buy** and **service**, each with the same three lines
  over the months (cash paid so far, expensed so far, book value) and a cursor at the chosen month; the numbers at
  the cursor sit under each chart in the same rows, so the two columns read across. EBITDA so far is a fourth row
  (no line). The panel header says what the option is (CapEx or OpEx), how it is classified (price vs threshold) and
  which budget it draws on.
- **"Three views"** are cash, expense and the balance sheet (book value), as the catalogue title says; the two
  options are the two ways of spending the same amount.
- **The ledger in its own file** (`ledger.js`): rows 0…N of `{ cash, capex, dep, opex }`, with `purchase`,
  `service`, `sums`, `totals` (cash, expense, book, EBITDA and EBIT effects), `series`, `shown` (rule 8 rounding)
  and `isCapitalised`. Pure, no words; registers on `globalThis.SimdeckModels.ledger` in a page and is
  `module.exports` under node, so promotion to `models/ledger.js` is a move plus a `<script src>` change. Its tests
  are the "ledger" and rule 2–4 tests in `sim.test.js`. The four-column row is meant to carry the later pages too:
  a prepayment is cash without opex (accruals), a lease adds a liability (that page would add a fifth column,
  additively).
- **Same total for the service.** The service costs exactly the price, spread evenly over the same months, so the
  expense lines coincide and only cash timing, EBITDA and the balance sheet differ. That is the cleanest contrast
  for the concept; the explanation says a real service usually costs more. A service premium would be a second
  concept (TCO, `fin-tco`).
- **Timing:** day one (month 0) is the purchase date: the purchase's cash leaves and the asset goes on (or, below
  the threshold, the whole price is expensed). Depreciation runs in whole months from month 1 to N, so book value
  reaches 0 at the end of month N. The service is billed and paid at the end of each month, so its cash equals its
  expense at every month: no prepayments here (they are `fin-accruals-cash`'s concept).
- **Threshold tie-break:** a price equal to the threshold is capitalised (`≥`). Policies word it both ways; SPEC
  rule 1 and the explanation say so. Threshold 0 capitalises everything.
- **Budgets:** capitalised purchase → capital budget, the whole price once in year 1; expensed purchase and service
  → operating budget (the service per year). Depreciation is not shown against any budget *(check)*: some
  companies charge it to the department's operating budget.
- **EBITDA vs operating profit:** EBITDA so far is a row in each panel; the caption says operating profit is the same
  and EBITDA differs. Operating profit (EBIT) itself is computed (`ebit`) and tested but not a row: on this page it
  always equals −expensed so far, which is already a row.
- **Rounding:** sums are tidied to a millionth of a euro, then each shown amount is rounded half away from zero, and
  book value is built from the rounded parts, so cash = expensed + book value holds on the screen in every month
  (tested for every month of five cases).
- **The month** is a range param whose max follows the life (`max: (p) => 12 × life`); `normalise` clamps it the
  same way, so shortening the life pulls the cursor back.
- **Day one captions** have their own sentences (`buyCapDay`, `svcNone`) instead of "€0 of it is expensed".
- **Changed mark:** the buy panel's header is highlighted when a change flips the classification (same mechanism
  as `fin-npv-discounting`).
- **Grayscale:** the three lines differ by dash (solid, dashed, dotted) and the cursor dots by shape (square,
  diamond, circle); the budget lines carry ▣ (capital) or ↻ (operating).
- **Phone:** panels stack; year labels shrink to the year number.
- **"Illustrative" note:** once, in the stage footer.
- **Concepts, not tools:** no product, vendor or tax rule on the page. IAS 16 is named once in the explanation
  (allowed by the task's finance notes); the Croatian text names it MRS 16.
- **No glossary terms:** none of the finance terms are in `kit/glossary.js`, so the strings write the pairs out and
  the page does not link `glossary.js` (as `fin-npv-discounting`). Croatian-first order in the Croatian explanation,
  for the same reason that page gives.

## Deviations from the task

- **Croatian title** is "CapEx ili OpEx: jedna kupnja, tri pogleda", not the catalogue's "Kapitalni izdaci ili
  operativni troškovi: jedna kupnja, tri pogleda" (67 characters; `sim.json` allows 60). The full terms are in the
  aliases and the panel headers.
- Added the **useful-life** param (2–8 years, default 5), so the "five-year service" can also be a three-year one;
  it moves the timeline, not the concept.
- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The DR seed's **approval thresholds** (who must sign above 5 000 / 20 000 €) are not on the page: they are a
  different threshold from the capitalisation one and would be a second concept; SPEC "Out of scope".

## Sources

- IAS 16 *Property, Plant and Equipment* (¶ 6–7 recognition, ¶ 43–62 depreciation: the depreciable amount allocated
  systematically over the useful life, straight-line as one of the methods; depreciation begins when the asset is
  available for use). Standard textbook treatment of capital vs operating expenditure, e.g. any introductory
  financial-accounting text (non-current assets and depreciation chapter).
- EBITDA as earnings before interest, taxes, depreciation and amortisation: a non-standard (non-GAAP) measure in
  common use; depreciation is excluded by definition.
- Capitalisation thresholds: set by each company's accounting policy (IAS 16 sets no amount; it allows aggregating
  or expensing items that are individually insignificant) *(check)*.
- DR handbook (`~/projects/dr-lecture-estate/student/handbook/constraints.md`): capex remaining vs opex headroom, the
  seed for the two budget lines. Student material, no answer keys used.
- Numbers: made up but plausible, checked with exact fractions (script at the end of `SPEC.md`) and by the preset
  test.

## Unchecked *(check)*

- The threshold tie-break wording (`≥`) and "IAS 16 sets no amount".
- Whether depreciation should also appear against the operating budget (company practice varies).
- Monthly convention (full month from the month after purchase); some companies start depreciating in the month of
  purchase or use a half-month convention.
- The Croatian terms below, in particular "investicijski budžet" / "operativni budžet" (vs "proračun", "plan
  kapitalnih ulaganja") and "prag kapitalizacije".

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| capital expenditure (CapEx) | kapitalni izdatak (kapitalni izdaci) |
| operating expense (OpEx) | operativni trošak (operativni troškovi) |
| depreciation | amortizacija |
| straight-line depreciation | linearna amortizacija |
| useful life | vijek uporabe |
| book value | knjigovodstvena vrijednost |
| asset | imovina |
| balance sheet | bilanca |
| profit and loss (statement) | račun dobiti i gubitka |
| capitalisation threshold | prag kapitalizacije |
| expensed at once | odmah u trošak |
| capital budget | investicijski budžet |
| operating budget | operativni budžet |
| operating profit | operativna dobit |
| EBITDA | EBITDA (dobit prije kamata, poreza i amortizacije) |

## For the owner

From catalogue §4.12, "Where Croatian practice commonly differs" (not verified, not on the page):

- `fin-capex-opex`, `fin-depreciation`: firms often book depreciation at the maximum rates the profit-tax rules allow,
  so computer equipment is commonly written off over two years, shorter than its useful life; low-value items
  (sitni inventar) are often expensed when put into use.

## Shared requests

- **Promote `ledger.js` to `models/ledger.js`** before `fin-accruals-cash`, `fin-budget-variance`,
  `fin-lease-vs-buy` and `fin-licence-models` start (catalogue §5.23: this page is the hub of the shared ledger
  model). It is ready to move unchanged; then point this page at `../../models/ledger.js` and move the ledger tests
  to `models/ledger.test.js`. The asset model `fin-depreciation` and `fin-refresh-cycle` share is a different one
  (methods, residual value); `purchase` here is only straight-line with no residual.
- **Glossary:** add the term pairs above.
- **Learn tree:** suggested place: area `money` ("Novac: koliko IT stvarno košta"), a new subject next to `worth-it`,
  "Jedna kupnja, dva pogleda / One purchase, two views" (the catalogue's playlist group 1), leaf "CapEx i OpEx /
  CapEx and OpEx" with `fin-capex-opex` (and `fin-capex-opex#small-purchase`); `fin-depreciation` and
  `fin-accruals-cash` would join that subject later.

## Review

A fresh reviewer (separate agent, no shared context beyond the files) read the code against `SPEC.md` and tried 42
rule-breaking mutations of `ledger.js` and `sim.js`: 32 were caught, 10 survived. The most important survivor was
dropping `tidy()`: the SPEC's tie example happened to sum exactly in floating point, yet 480 reachable price × life
× month cases round differently without it (500 € over 4 years at month 6 sums to 62.4999… and would show 62). Tests
were added for all ten (the tidy ties, the lower month clamp of a purchase, life and month rounding, day-one captions
at month 1, a threshold change that keeps the class, the defaults and ranges), the SPEC tie examples now include the
cases that need `tidy`, and the reviewer's runner then caught all 42. The reviewer also fixed wording: "it always
holds" → "here it always holds" (the identity fails with prepayments or a residual value), the EBITDA row is the
*effect* on EBITDA, "the purchase paid" / "the service has paid" (the company pays), the at-threshold hint ("under"
→ "with"), and several Croatian phrasings (*korisni vijek uporabe* as in MRS 16 in the explanation; the slider label keeps "vijek uporabe", the long one
overflows the panel; "jednokratno", "dosad", "košta",
the month caption). All applied.

## Time

Started 2026-11-06 23:22, done 2026-11-06 23:45: about 25 minutes. Spec, model and tests about 10, page and first gate pass about
5, the review (run in parallel with these notes), its fixes and the final checks the rest.
