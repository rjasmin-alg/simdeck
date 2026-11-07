<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-capex-opex: specification

Task `docs/tasks/w3/fin-capex-opex.md`, catalogue `fin-capex-opex` (§4.12, overlap §5.23: the hub of the shared
ledger model). Class **explorer**: the state is a pure function of the params (`sim.js` `compute`), no steps; the
month is a param the student scrubs.

**One concept:** buying puts the cash out on day one, but the expense is spread over the useful life as
depreciation, and the asset sits on the balance sheet meanwhile; a service is paid and expensed month by month;
each draws on a different budget; EBITDA looks better with CapEx; below the capitalisation threshold a purchase is
simply expensed.

**The contrast on the stage:** the same amount spent two ways, side by side on the same scale: **buy** (left) and
**service** (right). Each panel draws three lines over the months, cash paid so far, expensed so far and book value,
with a cursor at the scrubbed month and the numbers at the cursor beneath (plus EBITDA so far). The panel header says
which budget the option draws on; the buy panel also says whether the price is capitalised or expensed at once.

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `price` | range, step 500 | 500–60 000 € (30 000) | what the purchase costs; the service costs the same in total |
| `life` | range, step 1 | 2–8 years (5) | useful life of the bought asset = term of the service; N = 12 × `life` months |
| `threshold` | range, step 100 | 0–10 000 € (1 000) | the capitalisation threshold of the company's policy |
| `month` | range, step 1 | 0–N (12) | the cursor: 0 = day one (the purchase date), m = the end of month m |

Out-of-range or non-numeric params (from a URL) are clamped and snapped by `normalise` (non-numbers take the
default); `month` is clamped to N after `life` is (so shortening the life pulls the cursor back).

## The ledger (`ledger.js`, promotable to `models/ledger.js`)

A month-by-month timeline, rows 0…N. Each row holds four amounts for that month: `cash` (paid out), `capex` (added to
the asset), `dep` (depreciation, an expense that leaves the asset), `opex` (any other expense). From a row list the
ledger gives, at month m, the running totals:

- cash paid so far = Σ cash(0…m)
- expensed so far = Σ (opex + dep)(0…m)
- book value = Σ capex(0…m) − Σ dep(0…m)
- EBITDA effect so far = −Σ opex(0…m) (depreciation is left out); operating profit (EBIT) effect = −expensed so far

and the identity **cash paid so far = expensed so far + book value** holds for every purchase and service here
(there are no prepayments or accruals on this page; those are `fin-accruals-cash`'s).

## Rules

All amounts are euros, computed exactly in floating point; rounding happens only for display (rule 8).

1. **Classification (tie-break first).** The purchase is **capitalised** when `price` ≥ `threshold`, and **expensed
   at once** when `price` < `threshold`. A price equal to the threshold is capitalised. With `threshold` 0 every
   purchase is capitalised. (Policies word this either way, "at or above" or "above"; IAS 16 sets no amount, the
   company's policy does *(check)*.)
2. **Capitalised purchase.** Month 0: cash = `price`, capex = `price`. Months 1…N: dep = `price` / N (straight-line,
   no residual value, a full month from the month after the purchase date). So at month m: cash paid = `price`,
   expensed = `price` × m / N, book value = `price` × (N − m) / N, EBITDA effect 0, EBIT effect −`price` × m / N.
   (IAS 16 ¶ 50–62: the depreciable amount is allocated over the useful life; straight-line is the standard method.
   Monthly convention: depreciation starts when the asset is available for use, here from day one, counted in whole
   months.)
3. **Expensed purchase.** Month 0: cash = `price`, opex = `price`. Nothing after. At every month m (including 0):
   cash paid = expensed = `price`, book value 0, EBITDA effect = EBIT effect = −`price`.
4. **Service.** Months 1…N: cash = opex = `price` / N (the fee, billed and paid at the end of each month). At month
   m: cash paid = expensed = `price` × m / N, book value 0, EBITDA effect = EBIT effect = −`price` × m / N. Month 0
   has nothing yet.
5. **Same expense, different EBITDA.** For a capitalised purchase, expensed so far equals the service's at every m
   (same amount, same months), so operating profit is the same; EBITDA differs by `price` × m / N in the
   purchase's favour. At m = N everything is equal except EBITDA (the service's EBITDA carries the whole price, the
   purchase's none).
6. **Budget.** A capitalised purchase draws on the **capital budget**: the whole `price` once, in year 1. An
   expensed purchase draws on the **operating budget**: the whole `price` once, in year 1. The service draws on the
   **operating budget**: `price` / `life` a year (`price` / N a month). (Common practice in IT budgeting; the
   seed is the DR handbook's "capex remaining vs opex headroom" *(check)*: some companies also charge the
   depreciation to the department's operating budget.)
7. **Changed mark.** When a param change flips the classification (rule 1), the buy panel's header is marked changed.
8. **Display rounding.** Running sums are kept to a millionth of a euro (so month-by-month floating-point noise
   cannot flip a rounding tie). Amounts are shown to the euro, half away from zero, never −0. The expensed amount is rounded
   first and the book value shown is `price` − (expensed shown), so cash = expensed + book value holds on the screen
   too. The service's cash and expense show the same rounded number. The monthly fee and depreciation (`price` / N)
   are shown rounded on their own.

## Presets (numbers checked with exact fractions by the script at the end of this file)

| # | id | price | life | threshold | month | buy: cash / expensed / book / EBITDA | service: cash = expensed / EBITDA |
|---|---|---|---|---|---|---|---|
| 1 | `server` | 30 000 | 5 | 1 000 | 12 | 30 000 / 6 000 / 24 000 / 0 (capitalised, 500 a month) | 6 000 / −6 000 (500 a month) |
| 2 | `day-one` | 30 000 | 5 | 1 000 | 0 | 30 000 / 0 / 30 000 / 0 | 0 / 0 |
| 3 | `end-of-life` | 30 000 | 5 | 1 000 | 60 | 30 000 / 30 000 / 0 / 0 | 30 000 / −30 000 |
| 4 | `small-purchase` | 3 000 | 5 | 5 000 | 12 | 3 000 / 3 000 / 0 / −3 000 (expensed at once, operating budget) | 600 / −600 (50 a month) |
| 5 | `at-threshold` | 5 000 | 5 | 5 000 | 12 | 5 000 / 1 000 / 4 000 / 0 (capitalised: rule 1 tie-break; 83 a month) | 1 000 / −1 000 |

Also checked: 25 000 € over 4 years at month 7 → expensed 3 645.83 shown 3 646, book 21 354, fee 521; the rounding ties
500 € over 2 years at month 3 → 62.5 shown 63, book 437, and 500 € over 4 years at month 6 → 62.5 shown 63 (summed month
by month in floating point this is 62.4999…, which would show 62 without the tidying of rule 8), and 500 € over 2 years at
month 21 → 437.5 shown 438, book 62.

## Legend

Cash paid so far (solid line, `--c1`), expensed so far (dashed line, `--c2`), book value, the asset on the balance
sheet (dotted line over a light area, `--c3`), the month cursor (vertical line), changed (highlight).

## Captions (built from the state)

One sentence on the purchase at the cursor (`buyCap`: paid on day one, expensed so far as depreciation, still on the
balance sheet; `buyCapDay` at m = 0: all of it on the balance sheet, nothing expensed yet; `buyExp`: below the
threshold, the whole price expensed on day one), one on the service (`svcSoFar`: paid and expensed so far;
`svcNone` at m = 0), and at most one note by priority: m = N → end of life (same cash, same expense, the asset fully
depreciated; `nEnd` adds that EBITDA still differs when the purchase was capitalised, `nEndSame` when it was
expensed and nothing differs); otherwise EBITDA better with the purchase by Δ (Δ > 0, `nEbitdaBetter`) or worse
by Δ (Δ < 0, an expensed purchase, `nEbitdaWorse`); no note when Δ = 0 (day one of a capitalised purchase).

## Misconceptions targeted

- "We paid 30 000 € this year, so IT cost 30 000 € this year." (Cash vs expense; presets 1, 2.)
- "A capital purchase is cheaper than a service." (Same expense line; preset 3: same total; EBITDA ≠ cost.)
- "Better EBITDA means the company spent less." (Rule 5; the cash went out earlier.)
- "Anything that lasts years goes on the balance sheet." (Threshold; presets 4, 5.)

## Out of scope

Depreciation methods, residual value, impairment, selling or retiring early (`fin-depreciation`); prepaid and
accrued services (`fin-accruals-cash`); leases and the right-of-use asset (`fin-lease-vs-buy`); licence models
(`fin-licence-models`); discounting (`fin-npv-discounting`); a service that costs more than the purchase; approval
thresholds (who signs, as opposed to how it is booked); tax rules and Croatian rates (NOTES.md, "For the owner");
fiscal years that do not start with the purchase.

## Terms (hr / en)

kapitalni izdaci / capital expenditure (CapEx); operativni troškovi / operating expenses (OpEx); amortizacija /
depreciation; linearna amortizacija / straight-line depreciation; vijek uporabe / useful life; knjigovodstvena
vrijednost / book value; imovina / asset; bilanca / balance sheet; prag kapitalizacije / capitalisation threshold;
odmah u trošak / expensed at once; investicijski proračun / capital budget; operativni proračun / operating budget;
EBITDA (dobit prije kamata, poreza i amortizacije); operativna dobit / operating profit.

## Check script

Run with `python3`; the preset test in `sim.test.js` compares `sim.js` with the same numbers.

```python
from fractions import Fraction as F
def rnd(x):  # half away from zero
    x = F(x); s = -1 if x < 0 else 1; a = abs(x)
    n = int(a); r = n + (1 if a - n >= F(1, 2) else 0)
    return s * r
def view(price, life, thr, m):
    N = life * 12; cap = price >= thr; fee = F(price, N)
    if cap:
        exp = F(price) * m / N; buy = dict(cash=price, exp=rnd(exp), book=price - rnd(exp), ebitda=0)
    else:
        buy = dict(cash=price, exp=price, book=0, ebitda=-price)
    s = rnd(fee * m); svc = dict(cash=s, exp=s, book=0, ebitda=-s)
    return cap, rnd(fee), buy, svc
cases = {
  'server':         (30000, 5, 1000, 12),
  'day-one':        (30000, 5, 1000, 0),
  'end-of-life':    (30000, 5, 1000, 60),
  'small-purchase': (3000, 5, 5000, 12),
  'at-threshold':   (5000, 5, 5000, 12),
  'odd (25k,4y,m7)':(25000, 4, 1000, 7),
  'tie (500,2y,m3)': (500, 2, 0, 3),
  'tie (500,4y,m6)': (500, 4, 0, 6),
  'tie (500,2y,m21)': (500, 2, 0, 21),
}
for k, v in cases.items(): print(f"{k:16}", view(*v))
# server         True 500 buy 30000/6000/24000/0      svc 6000/-6000
# day-one        True 500 buy 30000/0/30000/0         svc 0/0
# end-of-life    True 500 buy 30000/30000/0/0         svc 30000/-30000
# small-purchase False 50 buy 3000/3000/0/-3000       svc 600/-600
# at-threshold   True 83  buy 5000/1000/4000/0        svc 1000/-1000
# odd            True 521 buy 25000/3646/21354/0      svc 3646/-3646
# tie            True 21  buy 500/63/437/0            svc 63/-63
# tie 4y m6      True 10  buy 500/63/437/0            svc 63/-63
# tie 2y m21     True 21  buy 500/438/62/0            svc 438/-438
```
