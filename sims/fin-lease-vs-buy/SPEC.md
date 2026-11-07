<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-lease-vs-buy: specification

Task `docs/tasks/w3/fin-lease-vs-buy.md`, catalogue `fin-lease-vs-buy` (§4.12; overlap §5.23: the ledger and the
discounting of `fin-npv-discounting`). Class **explorer**: the state is a pure function of the params (`sim.js`
`compute`), no steps.

**One concept:** the same hardware bought for cash, bought on a loan or leased: cash, expense and balance sheet
differ, and the comparison is fair only when discounted at the cost of capital; at the end of the term buy out the
residual, return or extend.

**The contrast on the stage:** the three ways side by side, always. On top a scoreboard, one row per way: what it
pays (cash on day one, *n* loan instalments, *n* rentals and the end of the term), **cash paid in total (nominal)**,
**what it still owns at the end**, **NPV at the cost of capital**, and the **balance sheet at the end of year y**
(asset, liability: the "one or two lines" the finance notes allow). Each of the two comparison columns marks its
cheapest way, and they often disagree. Below, the cash paid so far month by month (three lines) and the expense of
each year (three bars a year, split into depreciation, interest and rent).

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `price` | hidden (URL only), step 1 000 | 10 000–150 000 € (60 000) | the hardware's price; the same server in all three ways. Not a control: every amount scales with it, so it adds nothing to the concept and the panel has no room |
| `term` | stage buttons | 2–5 years (3) | lease term = loan term = T; months n = 12 T |
| `lease` | range, step 0.05 | 1.00–5.00 % of the price a month (2.90) | the monthly rental Q = `price` × `lease` / 100 (the "lease rate factor") |
| `residual` | range, step 5 | 0–50 % of the price (20) | R: what the hardware is worth at the end of the term, and the buy-out price |
| `loanRate` | range, step 0.5 | 0–15 % a year (6) | the loan's annual effective rate; also the lessee's borrowing rate for the lease liability |
| `coc` | range, step 0.5 | 0–20 % a year (8) | the cost of capital: the rate every option is discounted at |
| `end` | stage buttons | `return` / `buyout` / `extend` (`return`) | what happens to the leased server at the end of the term |
| `books` | stage buttons | `rou` / `rent` (`rou`) | the lease on the balance sheet (right-of-use asset and liability) or as rent |
| `year` | stage buttons | 0–H (1) | the balance-sheet date: the end of year `year` (0 = day one) |

The panel holds the presets and the four rates (`lease`, `residual`, `loanRate`, `coc`); the four choices sit on the
stage as button groups between the scoreboard and the charts (the panel must fit 1920×1080 without scrolling).
`normalise` clamps and snaps every number (non-numbers, `''` and `null` take the default; through the page the kit
reads `price=` as 0 and clamps it to the minimum first, so this matters for direct calls), maps an unknown `end` or
`books` to the default, and clamps `year` to H after `end` is known (so leaving "extend" pulls the cursor back).

## The ledger (`financing.js`, promotable)

Months 0…M, M = 12 H. **H = T + 1 with `extend`, else T**: every way is compared over the same months, so with
`extend` the bought server is also kept the extra year. Each month's row holds `cash` (paid out), `capex` (added to
an asset: the server or the right-of-use), `dep` (depreciation of an asset), `interest`, `rent` and `debt` (change in a
liability: + borrowed or recognised, − repaid). At month m: cash paid so far = Σ cash; expense so far = Σ (dep +
interest + rent); asset = Σ capex − Σ dep; liability = Σ debt; and **cash paid = expense + asset − liability** at
every month, for every way (test). Payments fall at the end of each month (in arrears) *(simplification: many leases
are paid in advance)*.

## Rules

All amounts in euros, computed in floating point, rounded only for display (rule 11).

1. **The server's value** falls in a straight line from the price to R at the end of the term, and on at the same
   pace after it, never below 0: v(m) = max(0, P − (P − R) × m / n). (An assumption that keeps the comparison
   on one value line; *illustrative*.)
2. **Cash.** Month 0: cash = capex = P. Months 1…M: dep = v(m − 1) − v(m) (book value follows the illustrative value line of
   rule 1: over the term this is IAS 16 straight-line depreciation with a useful life to the firm of T and a
   residual value R, ¶ 6, 50–53; after the term, with `extend`, it goes on below R, as if the estimates were revised,
   ¶ 51, a simplification). Owns the server at the end.
3. **Loan.** 100 % financed over n months at the monthly rate j = (1 + `loanRate`)^(1/12) − 1. Month 0: capex = P,
   debt = +P, cash 0. Instalment A = P j / (1 − (1 + j)^−n), **A = P / n when j = 0** (tie-break). Months 1…n:
   interest = balance × j, cash = A, debt = −(A − interest). Depreciation as rule 2. Owns the server at the end.
4. **Lease, rentals.** Q is paid at the end of months 1…n_L, n_L = n, or n + 12 with `extend` (12 more rentals at the
   same rate, then the server goes back).
5. **Lease as rent** (`rent`): each rental is an expense (rent = Q) in its month; nothing on the balance sheet.
   (IFRS 16 ¶ 5–8 allows this only for short-term leases of up to 12 months and low-value items; the old operating
   lease treatment and some national standards allow it more widely. The explanation says so.)
6. **Lease on the balance sheet** (`rou`, IFRS 16 ¶ 22–38): month 0: capex = debt = L0, the rentals discounted at the
   monthly borrowing rate k = j (rule 3): L0 = Σ Q (1 + k)^−m, m = 1…n_L (= Q n_L when k = 0). Months 1…n_L: dep =
   L0 / n_L (straight line over the lease term), interest = liability × k, debt = −(Q − interest). Over the lease the
   expense adds up to the rentals, as with rent, but it is front-loaded. (With `extend` the extra year is in the
   lease term from the start: it is treated as reasonably certain. The buy-out is not: it is decided only at the
   end, a separate purchase at month n (rule 7), so R is not in L0, unlike a reasonably certain purchase option,
   ¶ 27(d), 32.)
7. **End of the term.** `return`: the server goes back, the lessee owns nothing. `buyout`: at month n the lessee pays R
   (cash = capex = R) and owns the server, worth v(n) = R. `extend`: rule 4, then the server goes back.
8. **NPV** at the cost of capital c (`discount.js`, copied from `fin-npv-discounting`): every cash payment is an
   outflow at time m / 12 years, and what the way still owns at the end is an inflow of its value v(M) at H years
   (what it could be sold for): NPV = −Σ cash_m (1 + c)^(−m/12) + v(M) (1 + c)^(−H) for an owner, without the last
   term for a lessee who returned the server. Consequences (tests): a loan at `loanRate` = `coc` has the same NPV as
   cash; buying out at R has the same NPV as returning (the buy-out moves cash, not value). The cost of capital is
   read as what the firm's own money earns elsewhere, so a loan below it beats cash (the explanation says this
   holds only if that is really so; finance texts discount lease and loan flows at the borrowing rate, which the
   page shows when `coc` = `loanRate`).
9. **Picks (tie-breaks first).** Nominal: the way(s) with the **least cash paid** over the horizon. Discounted: the
   way(s) with the **highest NPV**. Both compare the amounts rounded to the euro (rule 11), so equal-looking amounts
   tie and every tied way is marked; order cash, loan, lease.
10. **Changed mark.** A pick that changes with a param change is marked changed (yellow and outline).
11. **Display.** Amounts to the euro, half away from zero, never −0; running sums kept to a millionth (as the
    capex-opex ledger) so floating-point noise cannot flip a rounding tie.
12. **Caption.** The two picks (`capSame` when they agree, `capDiffer` otherwise), then at most two notes in this
    order: the end note (`nBuyout`: R more cash, R of server kept, same NPV as returning; `nExtend`: twelve more
    rentals for a server worth v(M) by then), the loan note (`nLoanCoc` when `loanRate` = `coc`: same NPV as cash;
    else `nLoanCheap` when the loan's NPV beats cash; no loan note when it loses), then the books note (`nRent` as
    rent: off the balance sheet, the same every year; on the balance sheet `nRouDay` at year 0: L0 on both sides;
    otherwise `nRou`: the lease's expense in year y against the year's rentals, higher at first and lower later; no
    `nRou` at a 0 % loan rate, where the expense equals the rentals).

## Presets (numbers from the check script below; `sim.test.js` compares)

Price 60 000 €, term 3 years, rental 2.90 % (1 740 € a month), residual 20 % (12 000 €), loan 6 %, cost of capital
8 %, return, on the balance sheet, year 1, unless the row says otherwise.

| # | id | change | cash: paid / owns / NPV | loan: paid / owns / NPV | lease: paid / owns / NPV | picks (nominal; NPV) |
|---|---|---|---|---|---|---|
| 1 | `three-ways` | – | 60 000 / 12 000 / −50 474 | 65 556 / 12 000 / −48 825 (A 1 821) | 62 640 / 0 / −55 755 | cash; loan |
| 2 | `loan-at-coc` | loan 8 % | 60 000 / 12 000 / −50 474 | 67 409 / 12 000 / −50 474 (A 1 872) | 62 640 / 0 / −55 755 | cash; cash and loan |
| 3 | `dear-money` | loan 14 %, coc 14 % | 60 000 / 12 000 / −51 900 | 72 961 / 12 000 / −51 900 (A 2 027) | 62 640 / 0 / −51 513 | cash; lease |
| 4 | `buy-out` | buyout, year 3 | as 1 | as 1 | 74 640 / 12 000 / −55 755 | cash; loan |
| 5 | `extend` | extend, year 4 | 60 000 / 0 / −60 000 | 65 556 / 0 / −58 351 | 83 520 / 0 / −71 658 | cash; loan |
| 6 | `as-rent` | rent | as 1 | as 1 | as 1 | cash; loan |

Expense by year (euros): preset 1 cash 16 000 × 3; loan 19 005, 17 875, 16 676; lease (rou) 21 982, 20 902, 19 756;
preset 6 lease (rent) 20 880 × 3; preset 5 cash 16 000 × 3 then 12 000, lease (rou) 22 471, 21 452, 20 371, 19 226.
Totals over the horizon, preset 1: cash 48 000, loan 53 556, lease 62 640 (as rent too).
Balance sheet at the end of year 1, preset 1: cash 44 000 / 0; loan 44 000 / 41 153; lease (rou) 38 221 / 39 323;
as rent 0 / 0. Day one (year 0): 60 000 / 0, 60 000 / 60 000, 57 331 / 57 331. Preset 4 at year 3: every way
12 000 / 0. Also: loan 0 % → A 1 667, L0 62 640; residual 0 → cash NPV −60 000, depreciation 20 000 a year.

## Legend

Buying for cash (solid line, ● on bars, `--c1`), buying on a loan (dashed, ■, `--c2`), leasing (dotted, ▲, `--c3`);
in the expense bars depreciation (solid), interest (hatched), rent (dotted); the balance-sheet date (vertical line);
changed (highlight).

## Misconceptions targeted

- "The lease costs 62 640 €, the server 60 000 €, so buying is cheaper." (Nominal vs discounted; presets 1, 3.)
- "A loan is dearer than cash because of the interest." (Preset 2: at the cost of capital it is the same value.)
- "A lease is off the balance sheet." (Rule 6, preset 6: only as rent, which IFRS 16 allows for short or low-value
  leases only.)
- "Leasing spreads the cost evenly." (On the balance sheet the expense is front-loaded.)
- "Extending is cheap, the server is paid off." (Preset 5.) "Buying out is a bargain." (Preset 4: same value.)

## Out of scope

Tax (deductibility, tax shields, VAT) and any country's rules; lessor accounting; down payments, fees, balloon
payments, payments in advance; the buy-out price differing from the market value; other depreciation methods
(`fin-depreciation`); IRR of the lease (`fin-roi-payback-npv`); maintenance included in the rental (`fin-tco`).

## Terms (hr / en)

leasing / lease; najam (najamnina) / rental; kupnja za gotovinu / buying for cash; kredit, anuitet / loan,
instalment; kamata / interest; ostatak vrijednosti / residual value; otkup / buy-out; produljenje / extension;
pravo uporabe (imovina s pravom uporabe) / right-of-use asset; obveza po najmu / lease liability; amortizacija /
depreciation; bilanca / balance sheet; imovina / asset; obveza / liability; trošak kapitala / cost of capital; neto
sadašnja vrijednost (NSV) / net present value (NPV); nominalno / nominal; diskontirano / discounted.

## Check script

Run with `python3` (Decimal, 50 digits).

```python
from decimal import Decimal as Dd, getcontext, ROUND_HALF_UP
getcontext().prec = 50
D = lambda x: Dd(str(x))
def rnd(x):
    return int(D(x).quantize(Dd(1), rounding=ROUND_HALF_UP)) if x >= 0 else -int((-D(x)).quantize(Dd(1), rounding=ROUND_HALF_UP))
def mrate(a):  # annual effective -> monthly
    return (1 + D(a)/100) ** (Dd(1)/12) - 1
def f(c, m):   # discount factor, month m
    return 1 / (1 + D(c)/100) ** (Dd(m)/12)
def run(price=60000, term=3, lease=2.9, residual=20, loan=6, coc=8, end='return', books='rou', year=1):
    P = D(price); T = term; R = P*D(residual)/100; Q = P*D(lease)/100
    H = T + (1 if end == 'extend' else 0); M = 12*H; nL = 12*T + (12 if end == 'extend' else 0)
    v = lambda m: max(Dd(0), P - (P - R)*m/(12*T))
    out = {}
    # cash
    cf = {0: -P}
    out['cash'] = dict(paid=P, held=v(M), npv=-P + v(M)*f(coc, M), exp=[sum(v((y-1)*12+k-1)-v((y-1)*12+k) for k in range(1,13)) for y in range(1,H+1)],
                       asset=v(12*year), liab=Dd(0))
    # loan
    j = mrate(loan); n = 12*T
    A = P/n if j == 0 else P*j/(1-(1+j)**(-n))
    bal = P; pv = Dd(0); intr = [Dd(0)]*(M+1); bals = [P]
    for m in range(1, M+1):
        if m <= n:
            i = bal*j; intr[m] = i; bal = bal + i - A; pv += A*f(coc, m)
        bals.append(bal)
    out['loan'] = dict(paid=A*n, held=v(M), npv=-pv + v(M)*f(coc, M), payment=A,
        exp=[sum(v((y-1)*12+k-1)-v((y-1)*12+k) + intr[(y-1)*12+k] for k in range(1,13)) for y in range(1,H+1)],
        asset=v(12*year), liab=bals[12*year], interest=sum(intr))
    # lease
    k = mrate(loan)
    pvr = sum(Q*f(coc, m) for m in range(1, nL+1))
    buy = end == 'buyout'
    held = R if buy else Dd(0)
    npv = -pvr - (R*f(coc, 12*T) if buy else 0) + held*f(coc, M)
    L0 = sum(Q/(1+k)**m for m in range(1, nL+1)) if books == 'rou' else Dd(0)
    lb = L0; li = [Dd(0)]*(M+1); lbs = [L0]
    for m in range(1, M+1):
        if books == 'rou' and m <= nL:
            i = lb*k; li[m] = i; lb = lb + i - Q
        lbs.append(lb)
    def lexp(m):
        if m > nL: return Dd(0)
        return (L0/nL + li[m]) if books == 'rou' else Q
    asset = (L0 - L0/nL*min(12*year, nL) if books == 'rou' else Dd(0)) + (R if buy and 12*year >= 12*T else 0)
    out['lease'] = dict(paid=Q*nL + (R if buy else 0), held=held, npv=npv, rental=Q, L0=L0,
        exp=[sum(lexp((y-1)*12+kk) for kk in range(1,13)) for y in range(1,H+1)], asset=asset, liab=lbs[12*year])
    return out
cases = {
 'three-ways': {},
 'loan-at-coc': dict(loan=8),
 'dear-money': dict(coc=14, loan=14),
 'buy-out': dict(end='buyout', year=3),
 'extend': dict(end='extend', year=4),
 'as-rent': dict(books='rent'),
}
for name, kw in cases.items():
    o = run(**kw); print('==', name, kw)
    for opt in ('cash', 'loan', 'lease'):
        x = o[opt]
        print(f"  {opt:5} paid {rnd(x['paid']):>7} held {rnd(x['held']):>6} npv {rnd(x['npv']):>8} exp {[rnd(e) for e in x['exp']]} asset {rnd(x['asset'])} liab {rnd(x['liab'])}",
              {k: rnd(v) for k, v in x.items() if k in ('payment', 'rental', 'L0', 'interest')})
print('== totals (expense over the horizon, interest)')
for name, kw in cases.items():
    o = run(**kw)
    print(f"  {name:12}", {k: (rnd(sum(o[k]['exp']))) for k in o})
o = run(books='rent', end='buyout', year=3); print('  rent+buyout y3 lease asset', rnd(o['lease']['asset']), 'liab', rnd(o['lease']['liab']))
o = run(loan=0); print('  loan 0%: payment', rnd(o['loan']['payment']), 'L0', rnd(o['lease']['L0']), 'npv loan', rnd(o['loan']['npv']))
o = run(residual=0); print('  residual 0: held', rnd(o['cash']['held']), 'npv cash', rnd(o['cash']['npv']), 'exp', [rnd(e) for e in o['cash']['exp']])
o = run(year=0); print('  year 0 assets/liabs', [(rnd(o[k]['asset']), rnd(o[k]['liab'])) for k in o])
```
