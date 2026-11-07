<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-depreciation: specification

Task `docs/tasks/w3/fin-depreciation.md`, catalogue `fin-depreciation` (§4.12, overlap §5.23: the asset model it
shares with `fin-refresh-cycle`). Class **explorer**: the state is a pure function of the params (`sim.js`
`compute`), no steps.

**One concept:** straight-line vs declining-balance depreciation over a useful life, down to a residual value; a
perpetual software licence is amortised the same way; retiring or selling the asset books its remaining book value
against the proceeds as a loss or a gain.

**The contrast on the stage:** the same asset, bought for the same cost and sold in the same year for the same
proceeds, depreciated two ways side by side on one scale: **straight-line** (left) and **declining balance**
(right). Each panel draws the yearly depreciation as bars and the book value at each year end as a line, the
residual value as a dashed level, and the sale at the end of year *n*: a marker at the proceeds and a bracket from
the book value to the proceeds labelled loss or gain. The rows beneath read across: depreciation so far, book value
at the sale, proceeds, the gain or loss, and the total expensed. The total is the same in both panels (cost −
proceeds): the method moves the expense between years, and decides whether the sale shows a loss or a gain.

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `sell` | range, step 1 | 1–`life` (5) | sold or retired at the end of this year; `life` = kept to the end |
| `proceeds` | range, step 500 | 0–`cost` (3 000) | what the sale brings in; 0 = retired with nothing back (scrapped) |
| `cost` | range, step 500 | 1 000–60 000 € (30 000) | the purchase price, capitalised on day one |
| `life` | range, step 1 | 2–8 years (5) | the useful life |
| `residual` | range, step 500 | 0–½ `cost` (3 000) | the residual value expected at the end of the life |
| `kind` | choice | equipment, licence (equipment) | words only: depreciation of equipment, amortisation of a licence |

## Rules

All amounts are euros, computed in floating point and kept to a millionth (rule 6); rounding happens only for
display.

1. **Params (normalise).** Non-numbers take the default; numbers are clamped and snapped (`cost`, `residual`,
   `proceeds` to 500; `life`, `sell` to whole years). `residual` ≤ ½ `cost` rounded down to the step; `sell` ≤
   `life`; `proceeds` ≤ `cost`. "Non-number" means anything but a number or a non-empty numeric string (`null`,
   `''`, `true`, `Infinity` all take the default). Each is clamped after the param it depends on, so shortening the life pulls the
   sale year back and lowering the cost pulls the residual and proceeds down. An unknown `kind` is `equipment`.
2. **Straight-line.** Each year (cost − residual) ÷ life. The book value at the end of year *k* is cost − (cost −
   residual) × *k* ÷ life, so it reaches the residual exactly at the end of the life. (IAS 16 ¶ 62: "straight-line
   depreciation results in a constant charge over the useful life if the asset's residual value does not change";
   any introductory accounting text.)
3. **Declining balance, double (rate = 2 ÷ life), switching to straight-line, never below the residual.** With
   opening book value *B* in year *k* and *L* − *k* + 1 years left, the year's depreciation is
   min(*B* − residual, max(rate × *B*, (*B* − residual) ÷ (*L* − *k* + 1))).
   - Rate × *B* is the declining-balance charge (IAS 16 ¶ 62: "a decreasing charge over the useful life"); 2 ÷ life
     is the double-declining rate of the textbooks.
   - The second term is the switch: once spreading what is left evenly over the remaining years gives more, the
     rest is depreciated straight-line, so the asset reaches the residual at the end of its life. **Tie-break:** when
     the two are equal, the year is not counted as switched (the amount is the same; only the header's "from year
     *k*" depends on it).
   - Both terms are tidied (rule 6) before they are compared, so float noise cannot turn a tie into a switch
     (12 000 € over 6 years, no residual: year 4 opens at 3 555.56, and ⅓ of it and the rest over 3 years are both
     1 185.19, a tie, so the switch is year 5; compared raw, float noise made it year 4).
   - The residual is a floor: the charge never takes the book value below it (the cap; it binds in the last year
     when the residual is high, and in year 1 when the life is 2, rate 100 %).
   (The switch is common practice and what fixed-asset registers do; some textbooks instead keep the declining
   charge and let the last year take whatever is left down to the residual *(check)*.)
4. **Sale or retirement at the end of year *n*.** A full year's depreciation in each year 1…*n* (bought on the first
   day of year 1, sold on the last day of year *n*), none after. The gain (> 0) or loss (< 0) is proceeds − book
   value at the end of year *n* (IAS 16 ¶ 68, 71; IAS 38 ¶ 113 for intangibles). **Tie-break:** proceeds equal to
   the book value is neither a gain nor a loss. With proceeds 0 the whole book value is written off as a loss.
5. **Same total.** Over the asset's time in the books, depreciation − gain (+ loss) = cost − proceeds, whatever the
   method: the net cash out. The page builds the asset's years as ledger rows (`ledger.js`, copied from
   `fin-capex-opex`; a row is a year here): row 0 cash = capex = cost; rows 1…*n* dep; row *n* also cash −=
   proceeds, capex −= book value, opex = −gain (a loss is an expense, a gain a negative one). At year *n* the ledger
   gives cash = expensed = cost − proceeds and book value 0, for both methods.
6. **Display rounding.** Year-by-year amounts are kept to a millionth (so float noise cannot flip a tie). Shown in
   whole euros, half away from zero, never −0 (the straight-line header shows the exact yearly amount rounded,
   with ≈ when it is not whole, since the bars then alternate): the cumulative depreciation to each year end is rounded; each year's
   shown amount is the difference of two rounded cumulative amounts, the shown book value is cost − rounded
   cumulative, the shown gain is proceeds − shown book value, and the shown total is cost − proceeds. So the shown
   years add up to the shown totals, and the bars, rows and caption agree.
7. **Kind.** `licence` changes words only (amortisation of an intangible asset instead of depreciation of
   equipment); every number is the same as for `equipment` with the same params (IAS 38 ¶ 97–98: the same methods,
   straight-line, diminishing balance, units of production). Its presets set the residual to 0 (IAS 38 ¶ 100: the
   residual value of an intangible asset is normally zero).
8. **Changed mark.** When a param change flips a method's outcome (loss, gain, neither), that panel's gain/loss row
   is marked changed.

## Presets (numbers checked with exact fractions by the script at the end of this file)

Depreciation by year (shown), then the sale: book value / gain (+) or loss (−) / total expensed.

| # | id | cost, life, residual, sell, proceeds | straight-line | declining balance (2 ÷ life) |
|---|---|---|---|---|
| 1 | `server` | 30 000, 5, 3 000, 5, 3 000 | 5 400 × 5; 3 000 / 0 / 27 000 | 12 000, 7 200, 4 320, 2 592, 888 (last year capped); 3 000 / 0 / 27 000 |
| 2 | `sold-early` | 30 000, 5, 3 000, 3, 10 000 | 13 800 / **−3 800** / 20 000 | 6 480 / **+3 520** / 20 000 |
| 3 | `scrapped` | 30 000, 5, 3 000, 3, 0 | 13 800 / −13 800 / 30 000 | 6 480 / −6 480 / 30 000 |
| 4 | `licence` (licence) | 24 000, 4, 0, 2, 0 | 6 000 × 4; 12 000 / −12 000 / 24 000 | 12 000, 6 000, 3 000 (tie: not switched), 3 000 (switched); 6 000 / −6 000 / 24 000 |

Kept to the end instead (the licence with sell 4): both book values 0, no gain or loss, total 24 000.

Also checked: no residual (30 000, 5, 0): declining 12 000, 7 200, 4 320, 3 240, 3 240 (switch from year 4);
life 2 (30 000, 2, 3 000): declining 27 000, 0 (rate 100 %, capped in year 1); 25 000 over 3 years, residual
2 500, sold after 2 for 5 000: straight-line 7 500 a year, book 10 000, loss 5 000; declining 16 667, 5 555, 278,
book 2 778, gain 2 222 (rounded cumulative: 16 666.67 → 16 667, 22 222.22 → 22 222); 10 000 over 7 years, residual 0:
straight-line 1 429, 1 428, 1 429, 1 428, 1 429, 1 428, 1 429 (adds up to 10 000), declining 2 857, 2 041, 1 458,
1 041, 868, 867, 868.

## Legend

Depreciation in the year (bar, `--c1`); book value at the year end (solid line with round points, `--c3`); residual
value (dashed level); the sale (vertical line, proceeds as a diamond); loss (bracket, hatched, ▼) and gain (bracket,
dotted outline, ▲); after the sale, the plan if kept (faded); changed (highlight).

## Captions (built from the state)

1. The lead: `endSold` / `endScrapped` (kept to the end of the life, sold for the proceeds / retired with nothing
   back) or `earlySold` / `earlyScrapped` (at the end of year *n* of *L*).
2. The outcome: one sentence for both methods when their book values are equal (`bothNone`, `bothLoss`,
   `bothGain`), else one per method (`slLoss` / `slGain` / `slNone`, then `dbLoss` / `dbGain` / `dbNone`) with the
   book value and the amount.
3. One note, by priority: one method shows a loss and the other a gain → `nFlip` (the same sale, a loss one way and a
   gain the other; the same total); else sold early or any gain or loss → `nTotal` (the same total either way; the
   method only moves the expense between years); else `nYear1` (the same total; year 1 declining vs straight-line).

## Misconceptions targeted

- "Depreciation is the asset losing market value." (It allocates the cost; preset 2: the market paid more than the
  declining book value and less than the straight-line one.)
- "Declining balance costs more." (Same total, rule 5; presets 1–3.)
- "Selling at a gain means we made money on the server." (Gain = the depreciation was faster than the price fell;
  the total is cost − proceeds either way; preset 2.)
- "Retiring a server early is free: it is paid for." (The remaining book value is written off at once; preset 3.)
- "Software is an expense, not an asset." (A perpetual licence is capitalised and amortised the same way; presets
  4–5.)

## Out of scope

Monthly or part-year depreciation (pro rata in the year of purchase or sale); units-of-production and
sum-of-the-years'-digits methods; changing the useful life or the residual estimate mid-life; impairment and
revaluation; tax depreciation and Croatian rates (NOTES.md, "For the owner"); disposal costs; the capitalisation
threshold, cash vs expense and EBITDA (`fin-capex-opex`); refresh cycles and age-related cost (`fin-refresh-cycle`);
the decision whether to retire (`fin-sunk-cost`); licence vs subscription (`fin-licence-models`).

## Terms (hr / en)

amortizacija / depreciation (equipment) and amortisation (intangibles), one word in Croatian; linearna amortizacija /
straight-line depreciation; degresivna amortizacija (metoda opadajućeg salda) / declining-balance depreciation;
vijek uporabe / useful life; ostatak vrijednosti / residual value; knjigovodstvena vrijednost / book value; nabavna
vrijednost / cost; materijalna imovina / tangible asset (equipment); nematerijalna imovina / intangible asset;
trajna licenca / perpetual licence; prodaja / sale; rashodovanje / retirement (scrapping); otpis / write-off;
dobitak od prodaje / gain on the sale; gubitak od prodaje / loss on the sale.

## Check script

Run with `python3`; the preset tests in `sim.test.js` compare `sim.js` with the same numbers.

```python
from fractions import Fraction as F
def rnd(x):  # half away from zero
    x = F(x); s = -1 if x < 0 else 1; a = abs(x); n = int(a)
    return s * (n + (1 if a - n >= F(1, 2) else 0))
def sched(cost, life, res, method):
    B = F(cost); out = []
    for k in range(1, life + 1):
        if method == 'sl': d = F(cost - res, life)
        else:
            rem = B - res
            d = min(rem, max(F(2, life) * B, rem / (life - k + 1)))
        out.append(d); B -= d
    return out
def view(cost, life, res, sell, proceeds):
    r = {}
    for m in ('sl', 'db'):
        s = sched(cost, life, res, m); cum = [rnd(sum(s[:k])) for k in range(0, life + 1)]
        yearly = [cum[k] - cum[k - 1] for k in range(1, life + 1)]
        book = cost - cum[sell]; gain = proceeds - book
        r[m] = dict(yearly=yearly, book=book, gl=gain, total=cum[sell] - gain)
    return r
cases = {
 'server':          (30000, 5, 3000, 5, 3000),
 'sold-early':      (30000, 5, 3000, 3, 10000),
 'scrapped':        (30000, 5, 3000, 3, 0),
 'licence':         (24000, 4, 0, 4, 0),
 'licence-dropped': (24000, 4, 0, 2, 0),
 'no residual':     (30000, 5, 0, 5, 0),
 'life 2':          (30000, 2, 3000, 2, 3000),
 'life 3 odd':      (25000, 3, 2500, 2, 5000),
 'life 7':          (10000, 7, 0, 7, 0),
}
for k, v in cases.items():
    r = view(*v); print(k, v)
    for m in ('sl', 'db'): print('   ', m, r[m])
# server       sl [5400]*5 book 3000 gl 0 total 27000;  db [12000, 7200, 4320, 2592, 888] book 3000 gl 0 total 27000
# sold-early   sl book 13800 gl -3800 total 20000;      db book 6480 gl 3520 total 20000
# scrapped     sl book 13800 gl -13800 total 30000;     db book 6480 gl -6480 total 30000
# licence      sl [6000]*4 book 0 gl 0 total 24000;     db [12000, 6000, 3000, 3000] book 0 gl 0 total 24000
# licence-dr.  sl book 12000 gl -12000 total 24000;     db book 6000 gl -6000 total 24000
# no residual  db [12000, 7200, 4320, 3240, 3240]
# life 2       sl [13500, 13500]; db [27000, 0]
# life 3 odd   sl [7500]*3 book 10000 gl -5000 total 20000; db [16667, 5555, 278] book 2778 gl 2222 total 20000
# life 7       sl [1429, 1428, 1429, 1428, 1429, 1428, 1429]; db [2857, 2041, 1458, 1041, 868, 867, 868]
```
