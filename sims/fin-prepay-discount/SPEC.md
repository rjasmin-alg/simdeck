<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-prepay-discount: specification

Task `docs/tasks/w3/fin-prepay-discount.md`, catalogue `fin-prepay-discount` (§4.12, needs `fin-npv-discounting`).
Class **explorer**: the state is a pure function of the params (`sim.js` `compute`), no steps.

**One concept:** a discount for paying early is an interest rate in disguise, to compare with the cost of capital;
payment terms (30, 60, 90 days) move cash, not cost; three years prepaid ties up working capital and the cash buffer.

**The contrast on the stage:** one three-year support contract (list price 60 000 € a year, 5 000 € a month) paid
two ways, **monthly** or **K years upfront at a discount**, seen as *cost* (paid in total, expense per year, cost in
today's money) and as *cash* (the cash buffer month by month, its lowest point against a minimum). On top, the
implied annual rate of the discount next to the cost of capital: the verdict.

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `discount` | range, step 0.5 | 0–30 % (10) | off the list price of the months paid upfront |
| `years` | stage buttons | 1, 2, 3 (3) | years paid upfront (12 K months); the rest of the 36 months is paid monthly |
| `terms` | stage buttons | 0, 30, 60, 90 days (30) | every invoice is paid this many days after it, in both plans |
| `coc` | range, step 0.5 | 0–20 % (8) | cost of capital, annual |
| `buffer` | range, step 10 000 | 0–500 000 € (200 000) | cash at signing |
| `floor` | range, step 10 000 | 0–300 000 € (60 000) | the minimum the firm wants to keep (finance's rule) |
| `price` | hidden (URL) | 12 000–600 000 € a year, step 1 200 (60 000) | every amount scales with it; the rate does not |

Out-of-range or non-numeric params (from a URL) are clamped and snapped by `normalise`; junk takes the default;
`terms` not in {0, 30, 60, 90} takes 30.

## Rules

Amounts in euros, computed in floating point; rounding only for display and for comparisons (rules 6, 10).
Time t is in months from signing; month i (0…35) starts at t = i.

1. **Contract.** 36 months at m = `price` / 12 a month (list price).
2. **Invoices.** *Monthly:* one invoice of m at the start of each month i = 0…35. *Upfront K years:* one invoice at
   t = 0 for the first n = 12 K months, n · m · (1 − d) with d = `discount` / 100; months n…35 invoiced monthly at m
   (none when K = 3). (Prepaid multi-year terms with a discount, and the rest at the normal billing: common contract
   practice; the numbers are illustrative.)
3. **Payment terms.** Every invoice is paid N = `terms` days after it: at t = i + 12 N / 365 (30 days = 0.986
   months). Both plans have the same terms. (Net 30/60/90: standard trade-credit terms.)
4. **Expense (the books).** Each month's service is booked as expense in that month, m, or m (1 − d) for a month
   paid upfront (accrual basis: an upfront payment is a prepaid expense, an asset, used up month by month; IAS 1
   ¶ 27–28, the conceptual framework's accrual basis). The expense per contract year is the sum of its 12 months.
   **The terms change no expense** (they change only when cash leaves).
5. **Cash buffer.** Starts at B = `buffer`; the budget adds m at the start of every month i = 0…35 (the contract's
   list price, spread evenly: what a monthly plan would need); payments take their amount when paid.
   Balance(t) = B + inflows so far − payments so far. **Tie-break:** at the same instant an inflow comes before a
   payment, whatever order the lists come in (with 0-day terms the month's budget arrives with the invoice it pays,
   so the monthly plan stays at B).
6. **Lowest balance** = the minimum of B and the balance after every event; on a tie the earliest. It is **below
   the minimum** when the lowest balance, rounded to the euro, is < `floor` (strictly: equal is not below). Below 0
   the caption says "overdrawn".
7. **Tied up** = the largest difference balance_monthly(t) − balance_upfront(t) over all event times: the working
   capital the upfront payment holds back at its worst: n · m (1 − d) − m, the upfront payment less the first
   month the monthly plan pays at the same instant (49 000 in preset 1).
8. **Cost today** of a plan = Σ payment × (1 + c)^(−t / 12), c = `coc` / 100 (annual effective rate, t in months).
   (`discount.js` `presentValue` with a fractional year: each payment is discounted at its own time t / 12, not
   moved to a year end.)
9. **Implied annual rate** r of the discount: the annual rate at which n (1 − d) paid at t = 0 equals 1 paid at
   the start of each of months 0…n − 1, i.e. the IRR of "pay upfront minus pay monthly" (−(n (1 − d) − 1) at 0,
   then +1 a month for n − 1 months). r = 0 when d = 0. It depends only on n and d: not on the price, nor on the
   terms (they shift both plans by the same days), nor on the buffer. Bisection on [0, 100] to 1e-12. (The effective
   annual cost of a trade or early-payment discount: Brealey, Myers & Allen, *Principles of Corporate Finance*,
   ch. 30, "Working capital management", trade credit; here with the months spread instead of one date.) If
   n (1 − d) ≤ 1, or the rate would be above 10 000 %, there is no rate (`null`, shown as "no rate"; never with
   n ≥ 12 and d ≤ 30 %).
10. **Verdict.** saving today = cost today (monthly) − cost today (upfront), rounded to the euro (half away from
    zero, never −0; `discount.js` `roundMoney`). > 0: **take the discount** (r > c); < 0: **skip it** (r < c);
    = 0: **even** (r = c). Because the difference has one sign change, the sign of the saving and of r − c always
    agree (checked over the whole param grid: 15 006 combinations, terms 0 and 90, no disagreement; the only
    zero savings on the grid are d = 0 with c = 0). The verdict is the rounded saving, so floating-point noise never
    decides it.
11. **Display.** Amounts rounded to the euro. r with one decimal, or two or three when fewer would read as equal to
    c while the verdict says above or below (on the grid: K = 3, d = 5.5 %, c = 4 % → 3.996 %; K = 3, d = 11 %,
    c = 8.5 % → 8.504 %). On the grid of K, d and c (terms do not matter), 13 combinations need two decimals and these
    2 need three.
12. **Changed mark.** When a param change flips the verdict, the rate tile is marked changed (`flipped`).
13. **Captions.** Main: capTake / capSkip / capEven (rate against c, saving in today's money, the saving on paper);
    capNoDiscount instead of capSkip when d = 0 (nothing saved on paper, only the cost of paying early). Then at most
    two notes, in order: the upfront plan below the minimum (or overdrawn), else how much it ties up at most;
    terms > 0 (cash leaves N days later, the expense is the same).

## Presets (expected numbers checked with 50-digit decimals by the script at the end of this file)

All: price 60 000 €/yr, terms 30 days, cost of capital 8 %, buffer 200 000 €, minimum 60 000 €, unless stated.

| # | id | K | d | r (implied) | paid upfront / in total | cost today monthly / upfront | saving today | lowest upfront (month) | verdict, notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `year-upfront` | 1 | 10 % | 26.47 % | 54 000 / 174 000 | 160 231 / 156 321 | +3 910 | 151 000 (0.986) | take; ties up 49 000 |
| 2 | `three-years` (default) | 3 | 10 % | 7.64 % | 162 000 / 162 000 | 160 231 / 160 978 | −748 | 43 000 (0.986) | skip; below the minimum |
| 3 | `bigger-discount` | 3 | 15 % | 12.17 % | 153 000 / 153 000 | 160 231 / 152 035 | +8 195 | 52 000 (0.986) | take, but below the minimum |
| 4 | `two-years` | 2 | 12 % | 14.64 % | 105 600 / 165 600 | 160 231 / 154 291 | +5 940 | 99 400 (0.986) | take; ties up 100 600 |
| 5 | `long-terms` (90 days) | 1 | 10 % | 26.47 % | 54 000 / 174 000 | 158 216 / 154 356 | +3 861 | 161 000 (2.959) | take; same r and expense as 1, cash later |
| 6 | `no-discount` | 3 | 0 % | 0 % | 180 000 / 180 000 | 160 231 / 178 865 | −18 634 | 25 000 (0.986) | no discount; below the minimum |

The monthly plan's lowest balance is 200 000 at t = 0 in every preset (with 30-day terms it sits at 205 000
between a month's budget and its payment); it ends at 200 000, the upfront plan at B + the saving on paper
(218 000 in preset 2). Expense per year, preset 1: 54 000 / 60 000 / 60 000, preset 4: 52 800 / 52 800 / 60 000,
the same in preset 5 as in 1.

Also: the same 10 % is 26.5 % a year for one year paid upfront, 11.9 % for two, 7.6 % for three (rule 9 depends on
how long the money is paid early); preset 2 turns to "take" at c = 7.5 %.

## Legend

Monthly (solid line, ●, `--c1`), upfront (dashed line, ■, `--c2`), the minimum (dotted line, `--danger`), the
lowest point of each plan (its mark with the amount), take or skip (✓ / ✗ beside the verdict), changed (highlight).

## Misconceptions targeted

- "10 % off is always a good deal." (Presets 1 and 2: the same 10 % is 26 % or 7.6 % a year.)
- "Longer payment terms make the contract cheaper." (Preset 5: the expense is the same; only the cash moves.)
- "If it pays on paper, pay upfront." (Preset 3: it pays, but the buffer falls below the minimum.)
- "Paying upfront costs nothing if there is no discount." (Preset 6: the money is tied up for nothing.)

## Out of scope

Taxes and VAT; a price rise avoided by prepaying (that is `fin-indexation-fx`); the vendor going bust or the
contract being cancelled with the prepayment lost (a risk, named in the explanation only); interest earned on the
buffer; early-payment discounts on a single invoice ("2/10 net 30") as a separate preset (the same rule 9 with
n = 1 month and a days gap, named in the explanation); borrowing to prepay; leap years (365-day year).

## Terms (hr / en)

popust za plaćanje unaprijed / prepayment discount; plaćanje unaprijed / paying upfront (prepayment); rok plaćanja /
payment terms; implicitna godišnja kamatna stopa / implied annual rate; trošak kapitala / cost of capital; obrtni
kapital / working capital; novčana rezerva / cash buffer; najmanja rezerva / minimum (buffer); trošak (rashod) /
expense; unaprijed plaćeni trošak / prepaid expense; sadašnja vrijednost / present value; nominalno / on paper.

## Check script

The expected numbers above were computed before coding with 50-digit decimals, then compared with `sim.js` (the
preset test in `sim.test.js`). Run with `python3`:

```python
from decimal import Decimal as D, getcontext
getcontext().prec = 50
def plan(price, d, n, days):
    m = D(price) / 12; lag = D(12) * days / 365
    pay = [(lag, n * m * (1 - d))] if n else []
    pay += [(i + lag, m) for i in range(n, 36)]
    return m, pay
def pv(pay, c):
    return sum(a / (1 + c) ** (t / 12) for t, a in pay)
def low(B, m, pay):
    ev = sorted([(D(i), 0, m) for i in range(36)] + [(t, 1, -a) for t, a in pay])  # inflow first on a tie
    b = D(B); lo = (b, D(0))
    for t, k, x in ev:
        b += x
        if b < lo[0]: lo = (b, t)
    return lo, b
def rate(n, d):
    if d == 0: return D(0)
    f = lambda r: -n * (1 - d) + sum((1 + r) ** (-D(i) / 12) for i in range(n))
    lo, hi = D(0), D(100)
    for _ in range(170):
        mid = (lo + hi) / 2
        if f(mid) > 0: lo = mid
        else: hi = mid
    return lo
P = dict(price=60000, d=10, K=3, days=30, c=8, B=200000, floor=60000)
cases = {'year-upfront': dict(K=1), 'three-years': {}, 'bigger-discount': dict(d=15),
         'two-years': dict(K=2, d=12), 'long-terms': dict(K=1, days=90), 'no-discount': dict(d=0)}
for k, o in cases.items():
    q = dict(P, **o); d = D(q['d']) / 100; c = D(q['c']) / 100
    m, mon = plan(q['price'], d, 0, q['days']); _, up = plan(q['price'], d, 12 * q['K'], q['days'])
    cm, cu = pv(mon, c), pv(up, c)
    (lm, tm), em = low(q['B'], m, mon); (lu, tu), eu = low(q['B'], m, up)
    print(k, f"{float(rate(12 * q['K'], d)) * 100:.3f} %", f"{float(cm):.2f} / {float(cu):.2f}", f"saving {float(cm - cu):.2f}",
          f"low {float(lu):.0f} @ {float(tu):.3f}", f"end {float(eu):.0f}")
# year-upfront    26.472 %  160230.73 / 156320.88  saving   3909.85  low 151000 @ 0.986  end 206000
# three-years      7.642 %  160230.73 / 160978.49  saving   -747.76  low  43000 @ 0.986  end 218000
# bigger-discount 12.168 %  160230.73 / 152035.24  saving   8195.49  low  52000 @ 0.986  end 227000
# two-years       14.640 %  160230.73 / 154290.56  saving   5940.17  low  99400 @ 0.986  end 214400
# long-terms      26.472 %  158216.40 / 154355.71  saving   3860.70  low 161000 @ 2.959  end 206000
# no-discount      0.000 %  160230.73 / 178864.99  saving -18634.26  low  25000 @ 0.986  end 200000
```
