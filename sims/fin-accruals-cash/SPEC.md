<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-accruals-cash: specification

Task `docs/tasks/w3/fin-accruals-cash.md`, catalogue `fin-accruals-cash` (§4.12, overlap §5.23: the shared ledger
model). Class **stepper**, 13 steps: step n posts month n of the timeline.

**One concept:** an expense belongs to the month the service is used, not the month it is paid. A prepaid annual
support contract is spread over twelve months; service used in the year's last month and invoiced in the next
year's first month is accrued in the last month.

**The contrast on the stage:** one grid whose thirteen month columns are shared by the chart on top and the
contracts beneath. The chart draws two running totals, **cash paid so far** (solid) and **expensed so far**
(dashed), with the gap between them shaded up to the cursor and the four totals at the cursor on the right (paid,
expensed, prepaid, accrued). Each contract row shows a coin with the amount in the month an invoice is paid and a
hatched bar over the months the service is used, and on the right its balance at the cursor (▲ prepaid, ▼ accrued,
= settled). The current month's column is highlighted; months not yet posted are faint.

## Timeline

Months 1…12 are the fiscal year; month 13 is the next year's first month, when the year's last invoices arrive.
Step 0 is before the year (nothing posted); step n (1…13) shows the state at the end of month n. Every contract
starts with this fiscal year, and only **this year's service** is shown: month 13 carries the old year's invoices
and nothing of the next year's own use (rule 5).

## Contracts (fixed, in this order; whole euros, illustrative)

| # | id | service used (expense) | invoices paid (cash) | year's expense |
|---|---|---|---|---|
| 1 | `support` | 1 000 in each month 1…12 | 12 000 in month 1 (annual, in advance) | 12 000 |
| 2 | `colo` | 1 500 in each month 1…12 | 4 500 in months 4, 7, 10, 13 (each quarter, in arrears, the month after it) | 18 000 |
| 3 | `link` | 800 in each month 1…12 | 800 in each month 1…12 (the month it is used) | 9 600 |
| 4 | `late` | 6 000 in month 12 (the contractor's work) | 6 000 in month 13 (the invoice comes late) | 6 000 |

Amounts are made up but plausible; the page says so once (stage footer) and in the explanation.

## Params

| key | control | values (default) | notes |
|---|---|---|---|
| `support`, `colo`, `link`, `late` | toggle | true / false (all true) | which contracts are posted |
| `fy` | select | 1…12 (1 = January) | the fiscal year's first calendar month; only names the months (rule 7) |

`normalise`: a toggle takes `true`/`false`, `"true"`/`"false"`, `1`/`0` (strings too); anything else takes the
default. `fy` is rounded and must be 1…12, else the default.

## Rules

1. **Expense in the month of use.** A contract's expense in month m is its service used in month m (table above).
   In the ledger (`ledger.js` `billed(use, pay)`) this is the row's `opex`.
2. **Cash in the month paid.** Every invoice is paid in the month it arrives (payment terms are out of scope). In
   the ledger this is the row's `cash`.
3. **Running lines.** At step n: cash paid so far = Σ cash(0…n), expensed so far = Σ expense(0…n), summed over the
   contracts that are on (ledger `totals`). The chart draws both over months 0…13 for the contracts that are on.
4. **Balance (tie-break first).** Each contract's balance at step n is paid so far − expensed so far:
   **> 0 prepaid** (paid ahead of use, an asset), **< 0 accrued** (used ahead of payment, a liability), **= 0 settled**
   (neither). On the page a zero balance with nothing paid and nothing used yet reads "nothing yet" instead of
   "settled". The totals are summed **per contract, not netted**: prepaid = Σ positive balances, accrued = Σ |negative
   balances|; net = cash − expense = prepaid − accrued. (Month 4 of the full year: prepaid 8 000 and accrued 1 500,
   net 6 500.)
5. **Year end and after.** The year's expense = expensed so far at month 12 = Σ use over months 1…12; the year's
   cash = paid so far at month 12. At month 13 the last invoices for the year are paid, and for **every** set of
   contracts cash paid so far = expensed so far = the year's expense: the lines meet. (Prepaid support alone meets
   at month 12 already.)
6. **The month's event per contract** (for the caption), from its month-n amounts (pay, use) and balances before
   (b₀ = b − pay + use) and after (b):
   - nothing paid or used in month n (or n = 0): `none`;
   - paid: b > 0 → `prepay` (paid ahead); else b₀ < 0 → `settle` (pays for service already expensed); else b < 0
     → `accrue` (part-paid, not reached by the fixed contracts); else `same` (paid for the month it is used);
   - used, not paid: b < 0 → `accrue`; else `release` (a prepayment becomes expense).

   **Lead sentence:** n = 0 → `cStart`; n = 13 → `cNext` (something paid) or `cNextQuiet`; n = 12 → `cYearEnd`
   (accrued > 0) or `cYearEndEven` (nothing is ever prepaid at month 12: the support contract ends with the
   year); otherwise the contract with the highest-priority event, in the order `prepay` >
   `settle` > `accrue` > `release` > `same`; **ties go to the earlier contract in the table order**; no event →
   `cQuiet`. No contract on → `cNone` at every step. **Gap sentence** (months 1…11 only): prepaid > 0 and accrued >
   0 → `gBoth`; only prepaid → `gPrepaid`; only accrued → `gAccrued`; neither → `gMeet`.
7. **Fiscal year start.** Timeline month m is calendar month ((fy − 1 + m − 1) mod 12) + 1; month 13 is the same
   calendar month as month 1. The start changes only the names; every amount is the same.
8. **Quarters.** An arrears invoice paid in month n covers quarter ⌊(n − 2) / 3⌋ + 1 (months 4, 7, 10, 13 → Q1…Q4).
9. **Display.** Whole euros throughout, so no rounding is needed; the ledger's `roundMoney` formats them (half away
   from zero, never −0).

## Presets (numbers checked by the script at the end of this file)

| # | id | contracts | opens at | expected |
|---|---|---|---|---|
| 1 | `year` | all four | 0 | month 1: paid 12 800, expensed 3 300, prepaid 11 000, accrued 1 500; month 4: 19 700 / 13 200 / 8 000 / 1 500; month 12: 35 100 / 45 600 / 0 / 10 500; month 13: 45 600 / 45 600 / 0 / 0 |
| 2 | `prepaid` | support | 1 | month 1: 12 000 / 1 000 / 11 000 prepaid; month 6: 12 000 / 6 000 / 6 000; month 12: 12 000 / 12 000 / 0 (meet) |
| 3 | `arrears` | colo | 3 | month 3: 0 / 4 500 / accrued 4 500; month 4: 4 500 / 6 000 / 1 500; month 12: 13 500 / 18 000 / 4 500; month 13: 18 000 / 18 000 |
| 4 | `late` | link, late | 11 | months 1…11: paid = expensed (8 800 at 11); month 12: 9 600 / 15 600 / accrued 6 000; month 13: 15 600 / 15 600 |
| 5 | `year-end` | all four | 12 | as preset 1, month 12: the year's expense 45 600, paid in the year 35 100, accrued 10 500 (colo Q4 4 500 + contractor 6 000) |

Preset 5 is the page's listed entry (`sim.json` `entries`).

Full-year caption leads, months 0…13: `cStart`, `cPrepay` (support), `cAccrue` (colo) ×2, `cSettle` (colo Q1),
`cAccrue` ×2, `cSettle` (Q2), `cAccrue` ×2, `cSettle` (Q3), `cAccrue`, `cYearEnd`, `cNext`. Gap sentences months
1…11: `gBoth`. Prepaid only: `cPrepay`, then `cRelease` (months 2…11), `cYearEndEven`, `cNextQuiet`. Late only
(with link): `cSame` months 1…11 (`gMeet`), `cYearEnd`, `cNext`. Late alone: `cQuiet` months 1…11.

## Legend

Paid (cash): solid line, `--c1`. Expense (month of use): dashed line, `--c2`. Invoice paid: a coin with its amount
(`--c1`, filled). Service used: a hatched bar (`--c2`). Month posted: the highlighted column (`--hl`). In grayscale
the lines differ by dash, coins and bars by shape, balances by ▲ / ▼ / = and their word.

## Captions

Lead sentence (rule 6) plus, in months 1…11, the gap sentence. Placeholders: the month's name (rule 7), the
contract's name in quotes, the amount paid (`x`), used (`now`), the balance (`rest`), the months a prepayment still
covers (`k`, counting the current month), the quarter (`q`), and the totals (`cash`, `exp`, `pre`, `acc`; at month 12
`cash` is the year's cash). Croatian quotes the contract names („…”) so they stay in the nominative.

## Misconceptions targeted

- "We paid 12 000 € in January, so January cost 12 000 €." (Preset 2.)
- "No invoice, no cost." (Preset 3: three months of colocation before the first invoice; preset 4.)
- "Paying the January invoice is January's expense." (Month 13: the payment only clears the accrual.)
- "Under budget in March": a missing invoice, not a saving (explanation; the variance itself is
  `fin-budget-variance`).
- "Cash and expense are different amounts." (They meet: only the month differs; rule 5.)

## Out of scope

Payment terms and trade payables (invoice received vs paid); the estimate behind a real accrual and its true-up;
revenue-side accruals (deferred and accrued income); VAT and tax; the budget variance itself (`fin-budget-variance`);
depreciation and capitalisation (`fin-capex-opex`); a contract that runs across the year boundary (the previous
year's Q4 invoice paid in this year's month 1); the journal entries (debits and credits).

## Terms (hr / en)

načelo nastanka događaja / accrual basis; novčano načelo / cash basis; vremenska razgraničenja / accruals and
deferrals; plaćeni troškovi budućeg razdoblja (aktivna vremenska razgraničenja) / prepaid expenses; obračunati
troškovi (pasivna vremenska razgraničenja) / accrued expenses; plaćeno unaprijed / paid in advance; račun
tromjesečno unatrag / billed quarterly in arrears; poslovna godina / fiscal year; kolokacija / colocation. List and
open questions: `NOTES.md`.

## Check script

Run with `python3`; the preset tests in `sim.test.js` compare `sim.js` with the same numbers.

```python
ITEMS = {
  'support': dict(use={m: 1000 for m in range(1, 13)}, pay={1: 12000}),
  'colo':    dict(use={m: 1500 for m in range(1, 13)}, pay={4: 4500, 7: 4500, 10: 4500, 13: 4500}),
  'link':    dict(use={m: 800 for m in range(1, 13)},  pay={m: 800 for m in range(1, 13)}),
  'late':    dict(use={12: 6000}, pay={13: 6000}),
}
def at(on, n):
    bal = {k: sum(v for m, v in ITEMS[k]['pay'].items() if m <= n) - sum(v for m, v in ITEMS[k]['use'].items() if m <= n) for k in on}
    cash = sum(sum(v for m, v in ITEMS[k]['pay'].items() if m <= n) for k in on)
    exp = sum(sum(v for m, v in ITEMS[k]['use'].items() if m <= n) for k in on)
    return cash, exp, sum(b for b in bal.values() if b > 0), -sum(b for b in bal.values() if b < 0)
ALL = ['support', 'colo', 'link', 'late']
for name, on, months in [('year', ALL, [1, 4, 12, 13]), ('prepaid', ['support'], [1, 6, 12]),
                         ('arrears', ['colo'], [3, 4, 12, 13]), ('late', ['link', 'late'], [11, 12, 13])]:
    print(name, {n: at(on, n) for n in months})
# year    {1: (12800, 3300, 11000, 1500), 4: (19700, 13200, 8000, 1500), 12: (35100, 45600, 0, 10500), 13: (45600, 45600, 0, 0)}
# prepaid {1: (12000, 1000, 11000, 0), 6: (12000, 6000, 6000, 0), 12: (12000, 12000, 0, 0)}
# arrears {3: (0, 4500, 0, 4500), 4: (4500, 6000, 0, 1500), 12: (13500, 18000, 0, 4500), 13: (18000, 18000, 0, 0)}
# late    {11: (8800, 8800, 0, 0), 12: (9600, 15600, 0, 6000), 13: (15600, 15600, 0, 0)}
from itertools import combinations
for r in range(1, 5):
    for on in combinations(ALL, r):
        c, e, p, a = at(on, 13); assert c == e and p == a == 0, on   # rule 5: the lines meet at month 13
```
