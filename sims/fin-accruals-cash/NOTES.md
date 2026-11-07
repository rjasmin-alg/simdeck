<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-accruals-cash: notes

New stepper (task `docs/tasks/w3/fin-accruals-cash.md`, catalogue `fin-accruals-cash` §4.12, overlap §5.23: the
shared ledger model). Rules and expected numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** one grid whose thirteen month columns are shared by the chart on top (cash paid so
  far, solid; expensed so far, dashed; the gap shaded up to the cursor) and the four contracts beneath (a coin with
  the amount where an invoice is paid, a hatched bar over the months the service is used, the contract's balance on
  the right). Because the columns line up, "paid here, used there" is read straight down a column. The four totals
  at the cursor (paid, expensed, prepaid, accrued) sit right of the chart.
- **Thirteen steps:** months 1…12 of the fiscal year and the next year's first month, when the year's last
  invoices arrive and the lines meet. The catalogue says the lines "meet again at year end"; with invoices that
  arrive after the year that happens one month later, and the year-end step (12) is where the accrual is made
  instead. Prepaid support on its own does meet exactly at month 12 (preset 2).
- **Four fixed contracts, switched by toggles** instead of free amounts: the concept is the timing, and fixed
  whole-euro amounts keep every number exact (no rounding rule needed) and the captions concrete. The link, paid in
  the month it is used, is the control case where cash and expense coincide.
- **Every invoice is paid in the month it arrives:** no payment terms, so cash vs expense is the whole contrast and
  trade payables (a second concept) stay out. Said in the footer and the explanation.
- **Contracts start with the year; only this year's service is shown.** Month 13 shows only the old year's
  invoices, not next year's link or support. A steady state would also pay last year's Q4 colocation in month 1;
  that is out of scope (SPEC).
- **Balances per contract, not netted.** In the full year the net gap crosses zero (months 9, 11), while support is
  still prepaid and colocation accrued; the caption says "the gap hides two things" and the totals show both.
- **Fiscal year start** (`fy`, a select of the twelve months): the catalogue asks for it as a parameter (the DR
  estate uses April to March). It only renames the months.
- **Captions** have a lead sentence chosen from the month's events by a fixed priority (prepay > settle > accrue >
  release > same; ties to the earlier contract) plus a gap sentence. Croatian quotes the contract names („…”) so
  they stay in the nominative; month names in the late contractor's subtitle use a locative list.
- **The ledger in its own file** (`ledger.js`), copied from `fin-capex-opex` (not yet in `models/`) with one
  additive function, `billed(use, pay)`: a row list with the service used as `opex` and the payment as `cash`.
  The gap between the cash and expense lines is then exactly prepaid − accrued; no new column is needed.
- **Grayscale and colour:** lines differ by dash, coins (filled, with the amount) and usage bars (hatched) by shape,
  balances by ▲ / ▼ / = and their word; the posted month is a highlighted column plus the chart's cursor.
- **Phone:** thirteen narrow columns; months by number, coins without amounts, label and balance on a row above
  each contract's cells, "+1" for the next year.
- **No glossary terms:** none of the accounting terms are in `kit/glossary.js`; the strings write the pairs out and
  the page does not link `glossary.js` (as `fin-capex-opex`).
- **Concepts, not tools:** no product, vendor or tax rule on the page; IAS 1 (MRS 1) is named once, in the
  explanation (allowed by the task's finance notes).

## Deviations from the task

- **Croatian title** is "Trošak ili plaćanje: vremenska razgraničenja kroz godinu" (56 characters), not the
  catalogue's "… kroz godinu računa" (63; `sim.json` allows 60).
- **"Meet again at year end"** happens in month 13 (the next year's first month) for the late and arrears invoices;
  see Decisions.
- The task's "Model and presets" section was empty; `SPEC.md` fills it.

## Sources

- IAS 1 *Presentation of Financial Statements*, ¶ 27–28: an entity prepares its financial statements, except cash
  flow information, using the accrual basis of accounting; items are recognised when they satisfy the definitions and
  recognition criteria of the Conceptual Framework. *(check: paragraph numbers)*
- Conceptual Framework for Financial Reporting (2018), ¶ 1.17: accrual accounting depicts the effects of transactions
  in the periods in which they occur, even if the resulting cash receipts and payments occur in a different period.
  *(check: paragraph number)*
- Standard introductory financial-accounting treatment of prepaid expenses (an asset, expensed as the service is
  consumed) and accrued expenses (a liability for service received but not yet invoiced or paid), and of the
  year-end cut-off; e.g. any introductory text's chapter on adjusting entries.
- Croatian terms: the Croatian chart of accounts groups prepaid expenses as *plaćeni troškovi budućeg razdoblja*
  (aktivna vremenska razgraničenja, class 1; named once on the page as "u knjigovodstvu: …", the page's term is
  *unaprijed plaćeni trošak*, owner 2026-11-07) and accrued expenses under *pasivna vremenska razgraničenja* (class 2)
  *(check)*; *načelo nastanka događaja* is the usual translation of "accrual basis" in MRS 1 *(check)*.
- Numbers: made up but plausible, whole euros; checked by the script at the end of `SPEC.md` and by the preset test.

## Unchecked *(check)*

- The IAS 1 and Conceptual Framework paragraph numbers above, and the note "from 2027, IAS 8": IFRS 18 replaces IAS 1
  for periods from 1 January 2027 and the accrual-basis requirement moves to IAS 8 (renamed *Basis of Preparation of
  Financial Statements*), per the reviewer and the author's reading; the Croatian text says "od 2027. MRS 8".
- The Croatian terms below, in particular *obračunato* for "accrued" on the stage (vs *obračunati troškovi* /
  *odgođeno plaćanje troškova*), *novčano načelo* for "cash basis" and *poslovna godina* for "fiscal year".
- That billing colocation quarterly in arrears, with the invoice arriving in the month after the quarter, is the
  common pattern (some providers bill in advance).

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| accrual basis | načelo nastanka događaja |
| cash basis | novčano načelo |
| accruals and deferrals | vremenska razgraničenja |
| prepaid expense | unaprijed plaćeni trošak (u knjigovodstvu: plaćeni troškovi budućeg razdoblja, aktivna vremenska razgraničenja) |
| accrued expense | obračunati trošak (pasivno vremensko razgraničenje) |
| paid in advance | plaćeno unaprijed |
| billed in arrears | naplaćeno unatrag (račun unatrag) |
| fiscal year | poslovna godina |
| year end | kraj godine |
| colocation | kolokacija |
| budget | proračun |

## For the owner

From catalogue §4.12, "Where Croatian practice commonly differs" (not verified, not on the page):

- `fin-budget-variance`, `fin-accruals-cash`: the fiscal year is usually the calendar year (the DR estate uses April
  to March, hence the parameter).

## Shared requests

- **Promote `ledger.js` to `models/ledger.js`** (requested by `fin-capex-opex` already), **with `billed(use, pay)`
  added** (additive: a new function, no old result changes; its test is "ledger: billed …" in `sim.test.js`). Then
  point this page and `fin-capex-opex` at `../../models/ledger.js` and move the "ledger (copied)" and `billed` tests
  to `models/ledger.test.js`. `fin-budget-variance` (timing variance is an accrual) can build on `billed`.
- **Glossary:** add the term pairs above.
- **Learn tree:** suggested leaf: area `money`, subject `books` ("How finance books a purchase", which now holds
  only `capex-opex`), a new leaf `accruals`, "Trošak ili plaćanje" / "Accruals vs cash", with `fin-accruals-cash`
  (catalogue §4.12's outline); later also under `variance` with `fin-budget-variance`. `fin-accruals-cash#year-end`
  is the listed entry.

## Review

A fresh reviewer (separate agent, given only the files) read the code against `SPEC.md` and found no mismatch in the
model. It tried 78 mutations of `sim.js` and `ledger.js`. Before the review the author's own 23 mutations left one
equivalent survivor: the year-end lead's `accrued > 0` vs `net ≠ 0`, the same because nothing is prepaid at month 12
(now a test). Real gaps the reviewer found, now tested: the contracts' `fee` (it only feeds the subtitles), the state
carrying `fy` (the page names months from it), settle-over-accrue priority (no fixed month has both: a synthetic
test), `billed` with lists of different lengths and row 0, and the state's `pay` copy. Left: the copied `shown` and
the low clamp of `sums` are untested here as in `fin-capex-opex` (low priority, for `models/ledger.test.js` on
promotion); the rest were equivalent (defaults all true, month 0 empty, `quarterOf` variants giving the same values).
Wording fixed: `cRelease` said "no money moves" while the link was paid that month (now about the one contract);
`cYearEnd` read "only €0 was paid" for the contractor alone; `cNext` said "invoices" when one arrives (now
number-neutral); "whenever the money leaves" → "regardless of when"; Croatian *plaćeni trošak budućeg razdoblja*,
*obračunati trošak*, "iskorišteno je … usluge", the gap sentences, "u mjesecu u kojem stigne".

## Time

Started 2026-11-07 01:07, done 2026-11-07 01:28: about 21 minutes: reading and the numbers about 6, model, page and tests about 8, the gate and screenshots about 2, the review (run in parallel with these notes), its fixes and the final checks the rest.
