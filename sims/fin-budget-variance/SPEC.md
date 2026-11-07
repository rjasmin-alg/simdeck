<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-budget-variance: specification

Task `docs/tasks/w3/fin-budget-variance.md`, catalogue `fin-budget-variance` (§4.12, overlap §5.23: the shared
ledger model). Class **stepper**, 12 steps: step n books month n of the fiscal year.

**One concept:** a budget phased by month is compared with the actuals booked each month; the difference (the
variance) splits into **volume** (more used than budgeted), **price** (dearer per unit than budgeted) and **timing**
(an invoice booked in another month than the service it pays for). "Under budget in October" is often a missing
invoice. The run-rate forecast carries the latest month to year end, missing invoice and all.

**The contrast on the stage:** each month seen two ways, *what the budget said* and *what the report booked*. Twelve
month columns: a stacked bar of the actuals booked (cloud, licences), a budget mark across each column, a dashed box
where service was used but no invoice is booked yet; months not yet booked show the run-rate forecast as hatched
bars. Beneath: the variance to date (budget to date → booked to date, then volume, price, timing and the total as
bars from a zero line, over budget to the right, under to the left), and the year-end forecast against the year's
budget.

## Timeline

Months 1…12 are the fiscal year. Step 0 is before the year (nothing booked); step n (1…12) shows the report at the
end of month n. The budget is known for the whole year from step 0.

## Budget lines (fixed, in this order; whole euros, illustrative)

| # | id | budget a month | budget for the year |
|---|---|---|---|
| 1 | `cloud` | 2 000 units of compute × €5 = €10 000 | €120 000 |
| 2 | `lic` | 150 licence seats × €40 = €6 000 | €72 000 |
|   | total | €16 000 | **€192 000** |

Phasing is flat (the same budget every month). Amounts are made up but plausible; the page says so once (stage
footer) and in the explanation.

## Params

| key | control | values (default) | what it injects |
|---|---|---|---|
| `volume` | toggle | true | cloud usage 2 000 → 2 300 units a month from month 5 (more used) |
| `price` | toggle | true | licence price €40 → €48 a seat from month 7 (the renewal comes dearer) |
| `late` | toggle | true | month 10's cloud invoice is booked in month 11 (a late invoice) |
| `accrue` | toggle | false | a missing invoice is accrued at month end (estimated) and reversed when it arrives |
| `spend` | toggle | false | use it or lose it: what looks left over to date at month 10 is spent in month 11 |
| `fy` | select | 1…12 (1 = January) | the fiscal year's first calendar month; only names the months (rule 10) |

`normalise`: a toggle takes `true`/`false`, `"true"`/`"false"`, `1`/`0` (strings too); anything else takes the
default. `fy` is rounded and must be 1…12, else the default.

## Rules

1. **Budget.** Each line's budget in month m = budgeted quantity × budgeted price (table above).
2. **Expense (what belongs to the month).** Quantity used × price paid in month m: the budgeted quantity, plus 300
   cloud units from month 5 when `volume`, plus month 11's extra units when `spend` (rule 8); the budgeted price,
   except licences at €48 from month 7 when `price`.
3. **Booked (what the report shows).** Every invoice is booked in the month it is for, except the late one: with
   `late`, month 10's cloud invoice is booked in month 11 (so month 11 books two cloud invoices).
4. **Accrual.** With `late` and `accrue`, month 10 books an accrual equal to month 10's cloud expense (the estimate;
   here it is exact), and month 11 reverses it when the invoice arrives. Booked then equals expense in every month.
   Without `late`, `accrue` changes nothing.
5. **The three parts of a month's variance** (standard variance analysis, price at actual quantity, volume at budget
   price): volume = (quantity used − budgeted quantity) × budgeted price; price = (price paid − budgeted price) ×
   quantity used; timing = booked − expense. Then booked − budget = volume + price + timing exactly.
6. **To date.** Each figure to date at step n is its sum over months 1…n, per line and in total. Variance =
   booked − budget: **> 0 over budget, < 0 under, = 0 on budget** (tie-break: zero is "on budget", neither over nor
   under). In the ledger (`ledger.js` `billed(use = expense, pay = booked)`) booked to date is the ledger's cash and
   expense its expense, so timing to date = cash − expense.
7. **Order of the parts.** The variance to date always lists volume, price, timing and then the total, in that
   order, whatever their signs; a part that is 0 has no bar and reads €0.
8. **Use it or lose it.** With `spend`, the apparent underspend at month 10, U = budget to date − booked to date
   (all lines, before any spending), is spent in month 11 if U > 0: U / €5 extra cloud units, at the budgeted price,
   invoiced and booked in month 11. U ≤ 0 spends nothing (tie-break: exactly 0 spends nothing). Since volume and
   price only add, U > 0 only when the late invoice is missing and not accrued.
9. **Run-rate forecast.** At step n ≥ 1: run rate = the total booked in month n; forecast = booked to date + run
   rate × (12 − n); forecast variance = forecast − €192 000. At step 0 the forecast is the budget (nothing booked);
   at step 12 it equals the year's actual.
10. **Fiscal year start** `fy` only names the months: fiscal month m is calendar month ((fy − 1 + m − 1) mod 12) + 1.
11. **Captions.** The lead sentence is chosen from the month's events by a fixed priority, the first that applies:
    step 0 `cStart`; step 12 `cYearOver` / `cYearUnder` / `cYearOn` by the year's variance (followed by
    `gYearLate` when `late` is on: the late invoice's timing is 0 over the year); else `spend` in month 11 with
    something spent (`cSpend`) > `late` in month 10 (`cAccrual` with `accrue`, else `cMissing`) > `late` in month 11
    (`cReplace` / `cArrives`) > `spend` in month 11 with nothing spent (`cNoSpend`) > `price` in month 7 (`cPrice`) >
    `volume` in month 5 (`cVolume`) > the month's own variance (`cOver` / `cUnder` / `cOnPlan`). An event month
    with its flag off is an ordinary month. The to-date sentence: `gOver` / `gUnder` by the sign; at 0, `gOn` when
    all three parts are 0, else `gEven` (the parts cancel; no fixed preset reaches it, tested synthetically).

## Presets (expected numbers checked by `check.py` below and by the preset tests)

| # | id | params | opens at | what it shows |
|---|---|---|---|---|
| 1 | `all` | volume, price, late | 0 | all three parts; at month 10 the report is €8 800 under for the month yet €2 300 over to date (volume +9 000, price +4 800, timing −11 500); the forecast drops to €176 700 (−15 300) while the year ends **€19 200 over** (volume +12 000, price +7 200, timing 0) |
| 2 | `real` | volume, price | 7 | a real overspend: month 5 +1 500 (run rate €17 500, forecast €204 000); month 7 +2 700, run rate €18 700, forecast €211 200 (+19 200), which stays the forecast every month after and is the year's result (volume +12 000, price +7 200) |
| 3 | `late` | late | 10 | month 10 €10 000 under (timing −10 000), forecast €162 000 (−30 000); month 11 back to 0 to date, but the run rate of €26 000 forecasts €202 000 (+10 000); the year ends on budget |
| 4 | `use-it` | late, spend | 10 | the €10 000 that looked left over at month 10 is spent in month 11; the late invoice arrives too; the year ends **€10 000 over** (volume +10 000) |
| 5 | `accrued` | volume, price, late, accrue | 10 | the accrual books month 10's €11 500: timing 0 in every month, €13 800 over to date, forecast €211 200 (+19 200) from month 7 on, the year's result |

The toggles alone: volume ends the year +12 000 (forecast €204 000 from month 5 on), price +7 200 (forecast €199 200
from month 7 on). They began as two presets and were merged into `real` so the panel fits the projector screen.

Year to date of preset 1, step by step (budget, booked, variance; volume, price, timing; run rate, forecast):

| n | budget | booked | var | vol | price | timing | run rate | forecast |
|---|---|---|---|---|---|---|---|---|
| 4 | 64 000 | 64 000 | 0 | 0 | 0 | 0 | 16 000 | 192 000 |
| 5 | 80 000 | 81 500 | 1 500 | 1 500 | 0 | 0 | 17 500 | 204 000 |
| 7 | 112 000 | 117 700 | 5 700 | 4 500 | 1 200 | 0 | 18 700 | 211 200 |
| 9 | 144 000 | 155 100 | 11 100 | 7 500 | 3 600 | 0 | 18 700 | 211 200 |
| 10 | 160 000 | 162 300 | 2 300 | 9 000 | 4 800 | −11 500 | 7 200 | 176 700 |
| 11 | 176 000 | 192 500 | 16 500 | 10 500 | 6 000 | 0 | 30 200 | 222 700 |
| 12 | 192 000 | 211 200 | 19 200 | 12 000 | 7 200 | 0 | 18 700 | 211 200 |

## Out of scope

Payment terms and cash (the report books invoices, not payments; cash vs expense is `fin-accruals-cash`), budget
revisions and reforecasts other than the run rate, seasonal phasing, commitments and purchase orders, a mix
variance across products, currency, tax, and favourable/unfavourable wording (the page says over/under budget).

## Check

The numbers above were computed by an independent script (no code shared with `sim.js`) and compared with the
model's output for every preset and step (identical):

```python
def run(volume, price, late, accrue, spend):
    def build(extra):
        L = {}
        for lid, q, p in (('cloud', 2000, 5), ('lic', 150, 40)):
            bud = {m: q*p for m in range(1, 13)}
            qty = {m: q + (300 if volume and lid == 'cloud' and m >= 5 else 0)
                     + (extra.get(m, 0) if lid == 'cloud' else 0) for m in range(1, 13)}
            pr = {m: (48 if price and lid == 'lic' and m >= 7 else p) for m in range(1, 13)}
            exp = {m: qty[m]*pr[m] for m in range(1, 13)}
            bk = {m: 0 for m in range(1, 14)}
            for m in range(1, 13):
                if late and lid == 'cloud' and m == 10:
                    bk[11] += exp[m]
                    if accrue: bk[10] += exp[m]; bk[11] -= exp[m]
                else: bk[m] += exp[m]
            L[lid] = dict(bud=bud, exp=exp, bk=bk, vol={m: (qty[m]-q)*p for m in qty},
                          prc={m: (pr[m]-p)*qty[m] for m in qty})
        return L
    L = build({})
    spent = 0
    if spend:
        spent = max(0, sum(L[l]['bud'][m] - L[l]['bk'][m] for l in L for m in range(1, 11)))
        if spent: L = build({11: spent/5})
    for n in range(0, 13):
        b = sum(L[l]['bud'][m] for l in L for m in range(1, n+1))
        k = sum(L[l]['bk'][m] for l in L for m in range(1, n+1))
        e = sum(L[l]['exp'][m] for l in L for m in range(1, n+1))
        v = sum(L[l]['vol'][m] for l in L for m in range(1, n+1))
        p = sum(L[l]['prc'][m] for l in L for m in range(1, n+1))
        assert k - b == v + p + (k - e)
        rr = sum(L[l]['bk'][n] for l in L) if n else 0
        print(n, b, k, k-b, v, p, k-e, rr, k + rr*(12-n) if n else 192000)
```

## Sources

- Budget-vs-actual variance analysis and the split of a cost variance into a price (rate) variance at actual
  quantity and a quantity (usage, volume) variance at standard price: any management-accounting textbook's chapter
  on flexible budgets and standard costing (e.g. Horngren et al., *Cost Accounting: A Managerial Emphasis*, the
  flexible-budget and price/efficiency variance chapters) *(check: edition and chapter)*.
- Timing differences and accruals at period end: IAS 1 accrual basis (see `fin-accruals-cash/SPEC.md`), and standard
  month-end close practice of accruing for goods and services received but not yet invoiced *(check)*.
- Run-rate forecast (the latest period annualised or extended to year end) as a simple forecasting method, and its
  known weakness with lumpy or missing periods: common FP&A practice *(check: no single authoritative source)*.
- "Use it or lose it" (budget that lapses at year end prompting year-end spending): widely described in public-sector
  and corporate budgeting literature *(check)*.
