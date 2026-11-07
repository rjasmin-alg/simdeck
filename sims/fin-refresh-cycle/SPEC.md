<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-refresh-cycle: specification

Task `docs/tasks/w3/fin-refresh-cycle.md`, catalogue `fin-refresh-cycle` (§4.12, overlap §5.23: the asset model it
shares with `fin-depreciation`). Class **explorer**: the state is a pure function of the params (`sim.js`
`compute`), no steps.

**One concept:** the capital cost per device per year falls as the refresh cycle lengthens, while support, repairs
and lost staff time rise with the device's age; their sum has a minimum, the **economic life**; refreshing the whole
fleet at once makes a spending wall every *n* years, and staggered cohorts spread the same cost evenly.

**The contrast on the stage:** two panels.

- **Left, "economic life":** for every cycle length 2–8 years, one stacked bar of the cost per device per year:
  capital cost (the yearly depreciation), support and repairs, lost staff time. The lowest total is marked
  (★ economic life), the chosen cycle is outlined.
- **Right, "ten years of the fleet":** for each year two bars side by side: **cash** (purchases net of the resale of
  the replaced devices, plus support and repairs) and **cost** (depreciation plus support and repairs, the expense
  in the books, with the lost staff time hatched on top: a cost nobody pays out). With one cohort the cash bars are
  a wall every *n* years while the depreciation stays flat; with *c* cohorts the cash spreads out.

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `cycle` | range, step 1 | 2–8 years (4) | devices are replaced at this age |
| `cohorts` | range, step 1 | 1–`cycle` (1) | the fleet is split into this many groups, refreshed in turn |
| `slow` | range, step 0.5 | 0–4 h (1) | hours of a user's time a device loses per year, for each year of age after the first |
| `staff` | toggle | on/off (on) | count lost staff time; off = only what the budget sees |

Fixed and illustrative (the page says so once, the explanation lists them): a fleet of **240** devices at
**1 200 €** each; resale value **halves every year** (600 € after one year, 75 € after four); warranty **3 years**;
after it a support contract of **8 %** of the price a year (96 €) and repairs at **25 %** of the price (300 €) per
failure; failure rate **5 %** in the first year, **× 1.5** for each year of age; each failure costs **6 hours** of
the user's time; staff time at **40 €** an hour; ten years.

## Rules

All amounts are euros, computed in floating point and kept to a millionth (`asset.js` `tidy`); rounding happens only
for display (rule 9).

1. **Params (normalise).** Non-numbers take the default (`null`, `''`, `true`, `Infinity`: as fin-depreciation);
   `cycle` is rounded and clamped to 2–8, then `cohorts` rounded and clamped to 1–`cycle` (shortening the cycle pulls
   the cohorts down), `slow` snapped to 0.5 and clamped to 0–4. `staff` is a boolean: `false`, `'false'`, `0` and
   `'0'` are off, `true`, `'true'`, `1`, `'1'` on, anything else the default.
2. **Cohorts.** *N* = 240 devices split into *c* cohorts as evenly as possible; **tie-break:** the first *N* mod *c*
   cohorts get one device more (7 cohorts: 35, 35, 34, 34, 34, 34, 34). Cohort *i* (0…*c* − 1) is offset by
   *s<sub>i</sub>* = ⌊*i* · *n* ÷ *c*⌋ years (distinct for *c* ≤ *n*). Its devices' **age** in year *y* (1…10) is
   ((*y* − 1 − *s<sub>i</sub>*) mod *n*) + 1: age 1 is the year it is bought. The fleet is in its steady state when
   the ten years start (each cohort was bought before year 1 as the cycle says); so with one cohort the whole fleet
   is replaced in years 1, 1 + *n*, 1 + 2*n*…
3. **Per device by age *a*.**
   - resale value *R*(*a*) = 1 200 × 0.5<sup>*a*</sup>;
   - failure rate *f*(*a*) = 0.05 × 1.5<sup>*a* − 1</sup> (expected failures per device per year);
   - support and repairs (cash) = 0 while *a* ≤ 3 (in warranty), else 96 + *f*(*a*) × 300;
   - lost staff time (not paid out) = 40 × (6 × *f*(*a*) + `slow` × (*a* − 1)) when `staff` is on, else 0.
4. **Capital cost = depreciation.** A device kept for *n* years has a useful life of *n* years and a residual value
   *R*(*n*): straight-line depreciation (`asset.js` `schedule`, method `sl`, from fin-depreciation) of (1 200 −
   *R*(*n*)) ÷ *n* a year. It is sold for *R*(*n*) when replaced, equal to its book value, so the sale books neither
   a gain nor a loss (`asset.js` `disposal`, outcome `none`; the gain/loss case is fin-depreciation's). (IAS 16
   ¶ 50–62: the useful life is the period the entity expects to use the asset; the depreciable amount is cost −
   residual value.)
5. **Economic life.** For each cycle *n* = 2…8 the cost per device per year is capital(*n*) + the mean over ages
   1…*n* of support and repairs + the mean of lost staff time. The economic life is the *n* with the lowest total.
   **Tie-break:** equal totals (tidied) go to the **longer** cycle (the same yearly cost with fewer refresh projects).
   (Standard replacement analysis: the minimum of the average annual cost; undiscounted here, see "Out of scope".)
   The model also computes the economic life with `staff` flipped (`econAlt`), for the caption.
6. **Ten years of the fleet.** In year *y*, with *b* devices bought (the cohorts at age 1):
   - purchases = *b* × 1 200; resale = *b* × *R*(*n*) (the devices they replace, sold the same year);
   - support and repairs, lost staff time and depreciation = the sums over the cohorts of size × the per-device
     amount at the cohort's age (depreciation from the cohort's `asset.js` schedule, so the fleet's is the same every
     year: 240 × capital(*n*));
   - **cash** = purchases − resale + support and repairs; **expense** = depreciation + support and repairs; **cost**
     = expense + lost staff time.
7. **Cash vs expense.** Over the ten years, total cash − total expense = the fleet's book value at the end of year 10
   − its book value at the start (the book value of a cohort at the end of year *y* is `asset.js` `bookAt` at its
   age). With *c* = *n* and equal cohorts (every *n* but 7, since 240 = 7 × 34 + 2) the two are equal every year
   (shown to the euro); with 7 cohorts of 35 and 34 they differ by a cohort's one device more or less.
8. **The wall.** The peak year is the year with the most cash; **tie-break:** the earliest. The wall ratio is the
   peak ÷ the ten-year average cash.
9. **Display rounding.** Whole euros, half away from zero, never −0. Per-device amounts (failure rate, support and repairs, staff time, the straight-line amount (1 200 − *R*(*n*)) ÷ *n*, which equals `asset.js`'s schedule to a millionth) are summed untidied and tidied once summed, so a sum on an exact .5 boundary rounds as the exact fraction does (checked over all 630 param combinations against the script below). A ten-year series is shown as differences of
   its rounded cumulative sums, so the shown years add up to the shown ten-year total. Per-device amounts are
   rounded separately.
10. **Changed mark.** When a param change changes the economic life, its ★ label is marked changed; a total row
    whose shown value changed is marked too: the chosen cycle's total per device a year (left) and the ten-year cash,
    expense, staff time and the peak ratio (right).

## Presets (numbers checked with exact fractions by the script at the end)

Per device per year at cycles 2…8 (staff on, slow 1 h): 485.00, 409.00, **402.28**, 407.86, 426.52, 458.86, 506.75
→ economic life 4 years. Staff off: 450.00, 350.00, 317.91, 296.21, 284.95, **283.71**, 292.87 → 7 years.

| # | id | cycle, cohorts, slow, staff | economic life | cash by year (shown) | 10-year cash / expense / staff time | peak ÷ average |
|---|---|---|---|---|---|---|
| 1 | `wall` | 4, 1, 1, on | 4 | 270 000, 0, 0, 35 190, 270 000, 0, 0, 35 190, 270 000, 0 | 880 380 / 745 380 / 178 800 | 3.07 (year 1) |
| 2 | `staggered` | 4, 4, 1, on | 4 | 76 298, 76 297, … alternating (60 devices a year) | 762 975 / 762 975 / 202 500 | 1.00 |
| 3 | `stretched` | 7, 1, 1, on | 4 | 285 750, 0, 0, 35 190, 41 265, 50 378, 64 046, 285 750, 0, 0 | 762 379 / 599 093 / 336 735 | 3.75 (year 1) |
| 4 | `budget` | 7, 1, 1, off | 7 (4 with staff time) | as `stretched` | 762 379 / 599 093 / 0 | 3.75 |
| 5 | `slow` | 3, 3, 3, on | 3 | 84 000 every year (80 devices a year) | 840 000 / 840 000 / 333 600 | 1.00 |

Further checked numbers: depreciation a year 67 500 at cycle 4 (240 × 281.25), 40 821.43 at cycle 7 (shown 40 821,
40 822 alternating); `stretched` costs 458.86 − 402.28 = 56.58 € per device a year more than the economic life,
13 579 € a year for the fleet; book value at the start / end of year 10: `wall` 18 000 / 153 000 (difference 135 000
= cash − expense), `stretched` 2 250 / 165 535.71, `staggered` 119 250 / 119 250. Economic life by `slow` (staff on):
0 h → 6, 0.5 → 5, 1 → 4, 1.5–4 → 3; staff off → 7 whatever `slow`. Cohort sizes and offsets: 4 cohorts of cycle 4
→ 60 × 4, offsets 0, 1, 2, 3; 2 cohorts of cycle 6 → 120, 120, offsets 0, 3; 3 cohorts of cycle 8 → 80 × 3, offsets
0, 2, 5; 7 cohorts of cycle 7 → 35, 35, 34 × 5.

## Legend

Capital cost / depreciation (solid, `--c1`); purchases net of resale (solid `--c5` with a light inner frame, in the
cash bar, always the left bar of a year's pair); support and repairs (`--c2`, dotted); lost staff time (`--c4`,
hatched: not paid out); the chosen cycle (outlined bar, bold axis label); the economic life (★ before its total);
changed (highlight).

## Captions (built from the state)

1. The lead: `leadOne` (the whole fleet of 240 every *n* years), `leadSome` (*c* cohorts of about *m* every *n*
   years) or `leadEvery` (*c* = *n*: a share of the fleet every year).
2. The economic life: `atEcon` (this is the economic life, the cost per device a year), `belowEcon` / `aboveEcon`
   (shorter or longer than the economic life of *e* years: *d* € per device a year more, *F* € a year for the fleet;
   shorter: capital is dearer; longer: age costs outweigh the saved capital).
3. The cash: `cashWall` (*c* = 1: *X* in the refresh years, depreciation *D* every year), `cashSpread` (1 < *c* < *n*:
   the peak year *X*, *r* × the average; depreciation *D* every year), `cashFlat` (*c* = *n*: cash about *X* every
   year, as the expense).
4. One note: `nBudget` (`staff` off: only what the budget sees; counted with staff time the economic life is
   *alt*), else `nStagger` (*c* = 1: staggering would spread the cash over the years at the same cost per device), else `nSame`
   (the cost per device a year is the same as all at once; only the timing of the cash changes).

## Misconceptions targeted

- "Keeping devices longer always saves money." (Capital per year falls, age costs rise; preset 3: seven years costs
  56.58 € per device a year more than four.)
- "The refresh is expensive in the year we buy." (The cash is; the expense is the same depreciation every year;
  presets 1–2.)
- "The budget shows the true cost of old kit." (Lost staff time is not paid out, so the budget's economic life is
  longer; presets 3–4.)
- "Staggering costs more (more projects)." (The same cost per device a year; only the timing of cash changes;
  presets 1–2.)
- "There is one right cycle." (The bottom is flat: 402 vs 408 and 409 € a year on either side; the edges are steep.)

## Out of scope

Discounting (equivalent annual cost with the cost of capital: `fin-npv-discounting`, `fin-roi-payback-npv`); price
changes and inflation (`fin-indexation-fx`); declining-balance depreciation and gains or losses on an early sale
(`fin-depreciation`); a book life different from the cycle (write-offs, fully depreciated kit still in use);
refresh-project labour and migration; leasing (`fin-lease-vs-buy`); energy and e-waste; the transition from one
cycle to another (the ten years run a steady state); tax depreciation rates (NOTES.md, "For the owner").

## Terms (hr / en)

ciklus zamjene opreme / refresh cycle; ekonomski vijek trajanja / economic life; skupina (uređaja) / cohort; postupna
zamjena / staggered refresh; kapitalni trošak / capital cost; amortizacija / depreciation; novčani tok, isplate /
cash; trošak u poslovnim knjigama / expense; podrška i popravci / support and repairs; izgubljeno radno vrijeme /
lost staff time; jamstvo / warranty; preprodajna vrijednost / resale value; ostatak vrijednosti / residual value;
knjigovodstvena vrijednost / book value; vijek uporabe / useful life.

## Check script

Run with `python3`; the preset tests in `sim.test.js` compare `sim.js` with the same numbers.

```python
from fractions import Fraction as F
N = 240; P = F(1200); W = 3; YEARS = 10
def R(a): return P * F(1, 2) ** a
def f(a): return F(5, 100) * F(3, 2) ** (a - 1)
def sr(a): return F(8, 100) * P + f(a) * F(1, 4) * P if a > W else F(0)
def st(a, slow, on): return 40 * (6 * f(a) + F(slow) * (a - 1)) if on else F(0)
def cap(n): return (P - R(n)) / n
def total(n, slow, on): return cap(n) + sum(sr(a) + st(a, slow, on) for a in range(1, n + 1)) / n
def econ(slow, on):
    t = {n: total(n, slow, on) for n in range(2, 9)}; m = min(t.values())
    return max(n for n in t if t[n] == m), t            # tie: the longer cycle
def rnd(x): return int(x + F(1, 2)) if x >= 0 else -int(-x + F(1, 2))
def shown(xs):
    out, acc, prev = [], F(0), 0
    for x in xs: acc += x; r = rnd(acc); out.append(r - prev); prev = r
    return out
def cohorts(n, c): return [(N // c + (1 if i < N % c else 0), i * n // c) for i in range(c)]
def fleet(n, c, slow, on):
    rows = []
    for y in range(1, YEARS + 1):
        ages = [(m, ((y - 1 - s) % n) + 1) for m, s in cohorts(n, c)]
        b = sum(m for m, a in ages if a == 1)
        srv = sum(m * sr(a) for m, a in ages); stv = sum(m * st(a, slow, on) for m, a in ages)
        dep = N * cap(n)
        rows.append(dict(cash=b * P - b * R(n) + srv, exp=dep + srv, staff=stv, dep=dep))
    return rows
def book(n, c, y): return sum(m * (P - cap(n) * (((y - 1 - s) % n) + 1)) for m, s in cohorts(n, c))
for name, n, c, slow, on in [('wall', 4, 1, 1, True), ('staggered', 4, 4, 1, True), ('stretched', 7, 1, 1, True),
                             ('budget', 7, 1, 1, False), ('slow', 3, 3, 3, True)]:
    e, t = econ(slow, on); rows = fleet(n, c, slow, on)
    cash = shown([r['cash'] for r in rows]); exp = shown([r['exp'] for r in rows]); stf = shown([r['staff'] for r in rows])
    avg = sum(r['cash'] for r in rows) / 10; peak = max(r['cash'] for r in rows)
    print(name, 'econ', e, [float(round(v, 2)) for v in t.values()], cash, sum(cash), sum(exp), sum(stf),
          round(float(peak / avg), 2), float(book(n, c, 0)), float(book(n, c, 10)))
```
