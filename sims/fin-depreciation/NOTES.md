<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-depreciation: notes

New explorer (task `docs/tasks/w3/fin-depreciation.md`, catalogue `fin-depreciation` §4.12, overlap §5.23: the asset
model shared with `fin-refresh-cycle`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** two panels on one scale, **straight-line** and **declining balance**, for the same
  asset, cost, residual value and the same sale. Each draws the yearly depreciation as bars (with the amounts), the
  book value at each year end as a line, the residual as a dashed level and the sale as a vertical line with the
  proceeds (◆) and a bracket from the book value to the proceeds (loss hatched ▼, gain dotted ▲); a tag above the
  line says "sold" / "retired" and the outcome. The years after the sale are drawn faded: the plan, had it been
  kept. The rows beneath read across: depreciation so far, book value at the sale, proceeds, the gain or loss, and
  the total expensed (= cost − proceeds, equal in both panels: the page's main point).
- **The asset model in its own file** (`asset.js`): `schedule`, `bookAt`, `disposal`, `shown` (rule 6 rounding),
  `rate`, `tidy`, `roundMoney`. Pure, no words, no dependencies; registers on `globalThis.SimdeckModels.asset` in a
  page and is `module.exports` under node, so promotion to `models/asset.js` is a move plus a `<script src>` change.
  `fin-refresh-cycle` (catalogue §5.23) can take a cohort's depreciation from `schedule` and the write-off at refresh
  from `disposal`. `schedule` takes an optional `factor` (default 2, double-declining) so a 150 % method is one
  argument away.
- **The ledger, copied:** `ledger.js` is `sims/fin-capex-opex/ledger.js @ 2177381`, unchanged apart from the
  "copied" header lines (COMMON.md §6: it is not in `models/` yet). Its rows are periods; here a row is a year.
  `sim.js` `ledgerRows` writes the asset's years as rows (purchase, depreciation, and the sale: cash in, the book
  value off the balance sheet, the loss as an expense or the gain as a negative one), and the page's total row is
  checked against the ledger's totals (cash = expensed = cost − proceeds, book value 0). Its tests came with it
  ("ledger (copied)").
- **Declining balance = double-declining with a switch to straight-line**, never below the residual (SPEC rule 3).
  The switch keeps the yearly charge falling and lands on the residual at the end of the life; the alternative
  textbook version (keep the declining charge, the last year takes the rest) makes a jump in the last year that
  looks like a bug on a projector. The header says from which year the rest is spread evenly when it happens.
  The tie (declining charge = even spread) does not count as a switch.
- **Whole years.** Bought on the first day of year 1, a full year of depreciation each year, sold or retired at the
  end of year *n*. Monthly and part-year conventions are out of scope (the explanation says companies often count
  months).
- **Retire vs sell:** proceeds 0 is retirement with nothing back (the label says "retired" and the row "written
  off"); proceeds > 0 is a sale. Kept to the end of its life (n = life) with proceeds ≠ residual books the
  difference too (the residual was an estimate).
- **Ranges:** cost 1 000–60 000 € (step 500); life 2–8 years; residual 0 to half the cost (a residual above half
  makes little sense for IT and keeps the bars readable); proceeds 0 to the cost. `normalise` clamps residual and
  proceeds after the cost and the sale year after the life (the sliders' max follow the same functions).
- **Life 2 with declining balance** depreciates everything down to the residual in year 1 (rate 100 %, capped).
  Correct for the formula; left as is.
- **Software:** a `kind` param (equipment / perpetual licence) changes words only: "depreciation" ↔ "amortisation"
  in English (Croatian says amortizacija for both, and the explanation says so), and a line under the stage that a
  licence is an intangible asset amortised the same way, usually with no residual. No number changes (tested).
  The switch sits **on the stage** (two buttons under the panels); the panel's control is hidden
  (`visible: never`, as `fin-tco`), because the panel did not fit at 1920×1080 with five sliders and four presets.
- **Presets:** four, not five: the licence preset combines "amortised the same way" with "dropped after two years"
  (the faded plan shows the full four-year schedule). The defaults are the first preset.
- **Changed mark:** the gain/loss row of a panel is highlighted when a param change flips its outcome (loss, gain,
  neither), so dragging the proceeds shows the moment a loss turns into a gain.
- **Rounding:** cumulative depreciation rounded to the euro, years as differences of rounded sums, book value
  cost − rounded sum; so the shown years, rows and caption agree to the euro (tested over 5 costs × 7 lives × 3
  residuals × every sale year × both methods).
- **Grayscale:** bars solid, book value a line with round points, residual dashed, proceeds a diamond, loss hatched
  with ▼, gain dotted with ▲, plan faded and dashed; the active kind button carries ✓.
- **Bar amounts** are written without € (the axis carries it), so eight years fit.
- **Numbers in Croatian** use a no-break space as the thousands separator and before € and %, so an amount never
  wraps in the caption.
- **No glossary terms:** none of these finance terms are in `kit/glossary.js`, so the strings write the pairs out
  and the page does not link `glossary.js` (as the other `fin-` pages).
- **Concepts, not tools:** no product, vendor or tax rule on the page. IAS 16 and IAS 38 are named in the
  explanation only (MRS 16 / MRS 38 in Croatian).

## Deviations from the task

- **No `method` param:** both methods are always on the stage, side by side; the finance notes ask for the contrast
  to be the stage, and a method switch would hide it. The student still sets cost, life and residual value and
  retires the asset in year *n* (plus the proceeds, to show a gain as well as a loss).
- **Kind switch on the stage**, not in the panel (space; see Decisions).
- The task's "Model and presets" section was empty; `SPEC.md` fills it.

## Sources

- IAS 16 *Property, Plant and Equipment*: ¶ 50–62 (depreciable amount = cost − residual value, allocated over the
  useful life; straight-line, diminishing balance and units-of-production methods; ¶ 62 "a constant charge" vs "a
  decreasing charge"), ¶ 67–72 (derecognition; gain or loss = net disposal proceeds − carrying amount).
- IAS 38 *Intangible Assets*: ¶ 97–98 (amortisation methods, the same three), ¶ 100 (residual value of an
  intangible asset assumed zero, with two exceptions), ¶ 113 (gain or loss on derecognition).
- Double-declining balance at 2 ÷ life with a switch to straight-line: standard textbook treatment (introductory
  financial accounting, "plant assets" chapter); the variant without the switch, where the last year takes the
  remainder, is also common *(check)* which one the owner's course uses.
- Numbers: made up but plausible, checked with exact fractions (script at the end of `SPEC.md`) and by the preset
  tests.

## Unchecked *(check)*

- Which declining-balance variant the course teaches (switch to straight-line, as here, or last-year remainder).
- The Croatian terms below, in particular "degresivna amortizacija", "ostatak vrijednosti" (MRS 16's term for
  residual value) and "rashodovanje" / "otpis".
- Whether the gain or loss on the sale should be described as part of operating profit (the page does not say;
  it only shows it in the total).

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| depreciation (equipment) / amortisation (intangibles) | amortizacija |
| straight-line depreciation | linearna amortizacija |
| declining-balance depreciation | degresivna amortizacija |
| useful life | vijek uporabe |
| residual value | ostatak vrijednosti |
| cost (of the asset) | nabavna vrijednost |
| book value (carrying amount) | knjigovodstvena vrijednost |
| tangible / intangible asset | materijalna / nematerijalna imovina |
| perpetual licence | trajna licenca |
| sale proceeds | primljeno od prodaje |
| retirement (scrapping) | rashodovanje |
| write-off | otpis |
| gain / loss on the sale | dobitak / gubitak od prodaje |

## For the owner

From catalogue §4.12, "Where Croatian practice commonly differs" (not verified, not on the page):

- `fin-capex-opex`, `fin-depreciation`: firms often book depreciation at the maximum rates the profit-tax rules allow,
  so computer equipment is commonly written off over two years, shorter than its useful life; low-value items
  (sitni inventar) are often expensed when put into use.

## Shared requests

- **Promote `asset.js` to `models/asset.js`** before `fin-refresh-cycle` starts (catalogue §5.23: the two share the
  asset model). It is ready to move unchanged; its tests are the "rule 2–4, 6" tests in `sim.test.js` that use `As.`.
- **Promote `ledger.js` to `models/ledger.js`** (already requested by `fin-capex-opex` and `fin-accruals-cash`); this
  copy is identical to fin-capex-opex's apart from the header. Then point this page at `../../models/ledger.js`.
- **Kit:** `.sd-ctl[hidden]` is still shown, because kit.css's `.sd-ctl { display: flex }` wins over the `hidden`
  attribute; this page (like `fin-tco`) adds `.sd-ctl[hidden] { display: none; }` itself. A one-line rule in
  `kit.css` would let `visible: () => false` work everywhere.
- **Glossary:** add the term pairs above.
- **Learn tree:** suggested leaf: area `money`, subject `books` ("How finance books a purchase"), leaf
  `depreciation`, "Amortizacija" / "Depreciation", with `fin-depreciation` (catalogue §4.12's outline; later also
  `fin-refresh-cycle`). `fin-depreciation#sold-early` is the listed entry.

## Review

A fresh reviewer (separate agent, no shared context beyond the files) read the code against `SPEC.md` and ran 60
rule-breaking mutations of `asset.js` and `sim.js`: 43 were caught, 17 survived (8 equivalent on the param grid).
Findings, all applied:

- **A real bug:** the switch tie-break compared raw floats, so 26 of 26 033 schedules on the grid (all life 6,
  residual 0, e.g. 12 000 €) showed "from year 4" where the exact answer is year 5. Both terms are now tidied before
  the comparison (SPEC rule 3); a test with that case fails without the fix.
- SPEC's preset table still listed the two licence presets I merged; fixed.
- `normalise` turned `null`, `''` and `true` into 0 or 1 (an empty `?cost=` gave 1 000); they now take the default
  (SPEC rule 1 says so explicitly).
- The straight-line header showed 1 429 € a year while the bars alternate 1 429 / 1 428 (10 000 € over 7); it now
  shows ≈ when the amount is not whole.
- Tests added for the survivors that matter: the declining rate and straight-line amount, proceeds snapping,
  infinities, `capped` exactness, `shown` clamping the year, `flipped` with no next state.
- Wording: Croatian "ostatak" alone reads as *ostatak vrijednosti*, so "preostala knjigovodstvena vrijednost" /
  "preostali iznos" where the rest is meant; "jednom metodom … drugom" instead of "jednom … drugi put"; the
  `nYear1` sentence; "the same way as equipment"; "benefits" instead of "usefulness" in the English explanation.

## Time

Started 2026-11-07 01:20, done 01:55: about 35 minutes. Spec, model and tests about 15, page and fitting the panel
at 1920×1080 about 15, the review (in parallel with these notes), its fixes and the final checks the rest.
