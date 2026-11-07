<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-downtime-cost: specification

Task `docs/tasks/w3/fin-downtime-cost.md`, catalogue `fin-downtime-cost` (§4.12). Class **explorer**: the state is
a pure function of the params (`sim.js` `compute`), no steps.

**One concept:** the cost of downtime is lost revenue + idle staff + recovery work + penalties, and it varies with the
hour and the day; each extra nine of availability removes a tenth as much downtime as the one before and costs more
redundancy than the one before, so beyond some level a nine costs more than the downtime it saves.

**The contrast on the stage:** the price of an hour down against the price of a nine. Top: what an hour down costs
across the week (Monday to Sunday, three bands a day), stacked by component, with the average hour as a dashed line.
Below: one row per availability level (99 %, 99.9 %, 99.99 %, 99.999 %) with the downtime it allows a year, its
expected yearly downtime cost (stacked by the same components) plus the yearly cost of the redundancy that buys it,
and the total; beside each extra nine, what it saves against what it costs. The target row is outlined, the
cheapest marked ★; under the rows, the target against no redundancy.

## Constants (illustrative, made up but plausible)

| | value | source |
|---|---|---|
| working hours | Mon–Fri 08:00–18:00: 50 of the week's 168 hours; the other 118 are "evenings, nights and weekends" | a common office week |
| idle staff | 40 € per person-hour (pay and on-costs, loaded) | *(check: order of magnitude)* |
| no redundancy | 99 % (two nines): a single system as it stands; costs nothing extra | *(check: a plausible single-system figure)* |
| each further nine | costs 3 × the one before (the first extra nine costs `ha`) | *(check: illustrative; the rule "each nine dearer than the last" is the point)* |
| a year | 365 days = 8 760 h = 31 536 000 s | |

Failures are taken to be equally likely at any hour of the week (rule 3).

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `target` | the level rows on the stage (click, or Enter/Space on a focused row); a hidden panel param keeps it in the URL; the panel button "Cheapest level" (key `O`) sets it to n\* | 2, 3, 4, 5 nines (3) | the availability target |
| `rev` | range | 0–20 000 € per hour, step 500 (0) | revenue lost per hour down in working hours |
| `off` | range | 0–200 %, step 25 (0) | revenue lost per hour outside working hours, as a share of `rev` |
| `people` | range | 0–500, step 10 (200) | people who cannot work while it is down (working hours only) |
| `fix` | range | 0–5 000 € per hour, step 100 (500) | recovery work per hour down (engineers, overtime, outside help), every hour |
| `pen` | range | 0–10 000 € per hour, step 250 (0) | contractual penalties or service credits per hour down, every hour |
| `ha` | range | 0–200 000 € a year, step 5 000 (40 000) | yearly cost of the first extra nine (99 % → 99.9 %) |

The defaults are preset 2. Out-of-range or non-numeric values (from a URL) are clamped and snapped to their step
(rounded to nearest); non-finite numbers (`Infinity`), non-numbers, empty or blank values, booleans and objects take
the default; a target other than exactly 2, 3, 4 or 5 is 3
(`normalise`). After snapping, `rev × off ÷ 100` is a whole number of euros.

## Rules

**To the euro.** Each level's downtime cost is computed exactly (in units of 1/700 000 €: 7 days × 10^5 for the
finest level) and rounded once to whole euros, halves up (every amount is 0 or more). Every sum, difference and
comparison below uses those whole-euro amounts, the ones the page shows: totals, each nine's saving and cost, the
cheapest level, the outcome. So a verdict never contradicts the numbers beside it (an exact difference under a euro
is no difference; the review found such cases reachable from the sliders when comparisons were exact).

1. **Ties (first).**
   - a. **The cheapest level** is the level with the lowest total; equal totals go to the **fewer nines** (less
     redundancy for the same money).
   - b. **A nine whose saving equals its cost** is *even*: it neither pays nor loses (rule 7).
   - c. **A target whose total equals no redundancy's** is *even*: no saving and no loss (`capEven`). The target 99 %
     is the baseline itself (`capBase`).
2. **An hour down** costs, in working hours: `rev` + `people` × 40 + `fix` + `pen`; outside them:
   `rev` × `off` ÷ 100 + `fix` + `pen` (no idle staff).
3. **The week's sum** of hourly costs = 50 × working-hour cost + 118 × other-hour cost, by component and in all. The
   **average hour** = week's sum ÷ 168: with failures equally likely at any hour, that is the expected cost of an
   hour down.
4. **Downtime a year** at n nines = 10^−n of the year: 87 h 36 min (99 %), 8 h 45 min 36 s (99.9 %), 52 min 33.6 s
   (99.99 %), 5 min 15.36 s (99.999 %). Each nine removes nine tenths of what is left.
5. **Expected yearly downtime cost** at n nines = hours down × average hour = week's sum × 365 ÷ (7 × 10^n), by
   component and in all.
6. **Yearly cost of the redundancy** at n nines: 0 at 99 %; `ha` for the third nine; each further nine 3 × the one
   before: 99.9 % = `ha`, 99.99 % = 4 × `ha`, 99.999 % = 13 × `ha`. **Total** = downtime cost + redundancy cost.
7. **Each extra nine** (n − 1 → n): it saves downtime cost(n − 1) − downtime cost(n) and costs redundancy(n) −
   redundancy(n − 1). It **pays** when it saves more than it costs, is **even** when equal, **loses** otherwise. As
   the saving falls tenfold per nine and the cost triples, once a nine loses every later one does.
8. **Cheapest level** n\* = the level with the lowest total (rule 1a); it is 2 + the number of nines that pay.
9. **Priced by the working hour:** the cheapest level found when every hour down is priced at the working-hour cost
   (week's sum = 168 × working-hour cost). When it differs from n\*, the caption says so (`nNaive`): pricing an hour
   down at its working-hour cost buys the wrong level.
10. **Changed mark:** when a param change changes the outcome (rule 1c: base, saving, even, loss) or the cheapest level,
    the result is marked changed.

## Presets (numbers checked by the script at the end)

Every preset has `ha` = 40 000 €: redundancy costs 40 000 / 160 000 / 520 000 € a year at 99.9 / 99.99 / 99.999 %.

| # | id | rev | off | people | fix | pen | target | hour: work / other / average | downtime cost 99 % / 99.9 % / 99.99 % / 99.999 % | totals | n\* | result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `small-office` | 0 | 0 | 10 | 300 | 0 | 99.9 % | 700 / 300 / 419 | 36 709 / 3 671 / 367 / 37 | 36 709 / 43 671 / 160 367 / 520 037 | 99 % | loss 6 962 (third nine saves 33 038, costs 40 000); priced by the working hour, n\* would be 99.9 % |
| 2 | `office` | 0 | 0 | 200 | 500 | 0 | 99.9 % | 8 500 / 500 / 2 881 | 252 371 / 25 237 / 2 524 / 252 | 252 371 / 65 237 / 162 524 / 520 252 | 99.9 % | saving 187 134 |
| 3 | `shop` | 3 000 | 150 | 10 | 500 | 0 | 99.99 % | 3 900 / 5 000 / 4 673 | 409 321 / 40 932 / 4 093 / 409 | 409 321 / 80 932 / 164 093 / 520 409 | 99.9 % | saving 245 228 (the fourth nine saves 36 839, costs 120 000) |
| 4 | `payments` | 20 000 | 100 | 50 | 1 000 | 5 000 | 99.99 % | 28 000 / 26 000 / 26 595 | 2 329 743 / 232 974 / 23 297 / 2 330 | 2 329 743 / 272 974 / 183 297 / 522 330 | 99.99 % | saving 2 146 446 |
| 5 | `five-nines` | as 4 | | | | | 99.999 % | as 4 | as 4 | as 4 | 99.99 % | saving 1 807 413 (the fifth nine saves 20 967, costs 360 000) |

Also checked: everything 0 → every total 0, every nine even, n\* = 99 % (rule 1a), target 99.9 % even (rule 1c);
preset 1's costs with `ha` = 0 → every nine pays, n\* = 99.999 %; no cost and `ha` = 40 000 → n\* = 99 %, every nine loses;
every param at its top → 55 000 € an hour every hour, n\* = 99.9 %.
To the euro (rule 1): `rev` 500, `people` 140, `fix` 100, `pen` 9 500, `ha` 30 000 → exact totals 129 999.57 € and
129 999.96 € at 99.9 % and 99.99 %, both 130 000 €: a tie, n\* = 99.9 %, the fourth nine even (saves 90 000 €, costs
90 000 €); `rev` 1 000, `fix` 400, `ha` 55 000 → the third nine saves exactly 55 000 € (even), target 99.9 % is even.

## Legend

Lost revenue (solid, `--c1`), idle staff (diagonal hatching, `--c2`), recovery work (horizontal stripes, `--c3`),
penalties (vertical stripes, `--c4`), redundancy (dotted, with a dashed outline, `--c5`), the average hour (dashed ink line),
the cheapest level (★), changed (highlight). The target row is outlined thick and marked ▶ in its label.

## Captions (built from the state)

The main sentence: `capBase` (target 99 %: the downtime a year and its expected cost), else `capSave` / `capEven` /
`capLoss` with the downtime a year at the target, its expected cost, the redundancy's cost, the total, the total with
no redundancy and the difference. Then the notes that apply, in this order: about the cheapest level, the first of
these that holds: `nAtBest` (target = n\* > 99 %), `nNonePays` (target = n\* = 99 %), `nSameAsBest` (target ≠ n\*,
equal totals: rule 1a; it wins over `nNonePays`), `nNonePays` (n\* = 99 %), `nBest` (otherwise); then `nNaive`
(rule 9).

## Misconceptions targeted

- "An hour down costs what a busy working hour costs." (Preset 1: priced at 700 € an hour the third nine pays; at the
  average hour, 419 €, it does not. Preset 3: the shop's evenings cost more than its working hours.)
- "More nines are always better." (Preset 5: the fifth nine costs 360 000 € a year to save 20 967 €.)
- "Each nine is worth the same." (Every preset: each nine removes a tenth of the downtime the one before removed.)
- "Downtime is only lost revenue." (Preset 2: an internal system loses no revenue; idle staff and recovery cost.)

## Out of scope

The hours of a single outage and how detection and restore make them (`rpo-rto`); lost data (RPO); planned
maintenance windows placed in cheap hours; a fixed cost per incident and how often incidents happen (here only the
yearly total of downtime counts); reputational loss and lost customers; penalties that start only below a contracted
level (tiered service credits); half nines (99.95 %); availability of chains of components; discounting the yearly
amounts (`fin-npv-discounting`); the expected loss from rare large events (`fin-ale-risk`).

## Terms (hr / en)

zastoj (prekid rada) / downtime; trošak zastoja / cost of downtime; dostupnost / availability; devetka / a nine;
izgubljeni prihod / lost revenue; neiskorišteno radno vrijeme (zaposlenici bez posla) / idle staff; rad na oporavku /
recovery work; ugovorne kazne / penalties (service credits); visoka dostupnost (HA) / high availability; redundancija /
redundancy; očekivani godišnji trošak / expected yearly cost; radno vrijeme / working hours; prosječni sat / average
hour.

## Check script

Run with `python3`; the preset test in `sim.test.js` compares `sim.js` with the same numbers.

```python
from fractions import Fraction as F
WAGE = 40; WORK = 50; OFF = 118; GROW = 3; L = range(2, 6)
def r(x): return int(x + F(1, 2))                      # whole euros, halves up (amounts are >= 0)
def dc(ws, n): return F(ws * 365, 7 * 10 ** n)          # expected € a year at n nines
def ha_cost(ha, n): return sum(ha * GROW ** (k - 3) for k in range(3, n + 1))
def best(ws, ha): return min(L, key=lambda n: (r(dc(ws, n)) + ha_cost(ha, n), n))   # whole euros; ties → fewer nines
def view(rev, off, people, fix, pen, ha, target):
    cw = rev + people * WAGE + fix + pen
    co = F(rev * off, 100) + fix + pen
    ws = WORK * cw + OFF * co
    d = {n: r(dc(ws, n)) for n in L}
    tot = {n: d[n] + ha_cost(ha, n) for n in L}
    nines = {}
    for n in range(3, 6):
        v, c = d[n - 1] - d[n], ha_cost(ha, n) - ha_cost(ha, n - 1)
        nines[n] = (v, c, 'pays' if v > c else 'loses' if v < c else 'even')
    return dict(hour=(cw, int(co), r(F(ws, 168))), down=d, tot=tot, best=best(ws, ha), naive=best(168 * cw, ha),
                nines=nines, save=tot[2] - tot[target])
cases = {
  'small-office': (0, 0, 10, 300, 0, 40000, 3),
  'office':       (0, 0, 200, 500, 0, 40000, 3),
  'shop':         (3000, 150, 10, 500, 0, 40000, 4),
  'payments':     (20000, 100, 50, 1000, 5000, 40000, 4),
  'five-nines':   (20000, 100, 50, 1000, 5000, 40000, 5),
  'all zero':     (0, 0, 0, 0, 0, 0, 3),
  'free HA':      (0, 0, 10, 300, 0, 0, 2),
  'no cost, HA':  (0, 0, 0, 0, 0, 40000, 2),
  'top':          (20000, 200, 500, 5000, 10000, 200000, 5),
  'euro tie':     (500, 0, 140, 100, 9500, 30000, 4),
  'even nine':    (1000, 0, 0, 400, 0, 55000, 3),
}
for k, a in cases.items(): print(f'{k:12}', view(*a))
# small-office {'hour': (700, 300, 419), 'down': {2: 36709, 3: 3671, 4: 367, 5: 37}, 'tot': {2: 36709, 3: 43671, 4: 160367, 5: 520037}, 'best': 2, 'naive': 3, 'nines': {3: (33038, 40000, 'loses'), 4: (3304, 120000, 'loses'), 5: (330, 360000, 'loses')}, 'save': -6962}
# office       {'hour': (8500, 500, 2881), 'down': {2: 252371, 3: 25237, 4: 2524, 5: 252}, 'tot': {2: 252371, 3: 65237, 4: 162524, 5: 520252}, 'best': 3, 'naive': 3, 'nines': {3: (227134, 40000, 'pays'), 4: (22713, 120000, 'loses'), 5: (2272, 360000, 'loses')}, 'save': 187134}
# shop         {'hour': (3900, 5000, 4673), 'down': {2: 409321, 3: 40932, 4: 4093, 5: 409}, 'tot': {2: 409321, 3: 80932, 4: 164093, 5: 520409}, 'best': 3, 'naive': 3, 'nines': {3: (368389, 40000, 'pays'), 4: (36839, 120000, 'loses'), 5: (3684, 360000, 'loses')}, 'save': 245228}
# payments     {'hour': (28000, 26000, 26595), 'down': {2: 2329743, 3: 232974, 4: 23297, 5: 2330}, 'tot': {2: 2329743, 3: 272974, 4: 183297, 5: 522330}, 'best': 4, 'naive': 4, 'nines': {3: (2096769, 40000, 'pays'), 4: (209677, 120000, 'pays'), 5: (20967, 360000, 'loses')}, 'save': 2146446}
# five-nines   {'hour': (28000, 26000, 26595), 'down': {2: 2329743, 3: 232974, 4: 23297, 5: 2330}, 'tot': {2: 2329743, 3: 272974, 4: 183297, 5: 522330}, 'best': 4, 'naive': 4, 'nines': {3: (2096769, 40000, 'pays'), 4: (209677, 120000, 'pays'), 5: (20967, 360000, 'loses')}, 'save': 1807413}
# all zero     {'hour': (0, 0, 0), 'down': {2: 0, 3: 0, 4: 0, 5: 0}, 'tot': {2: 0, 3: 0, 4: 0, 5: 0}, 'best': 2, 'naive': 2, 'nines': {3: (0, 0, 'even'), 4: (0, 0, 'even'), 5: (0, 0, 'even')}, 'save': 0}
# free HA      {'hour': (700, 300, 419), 'down': {2: 36709, 3: 3671, 4: 367, 5: 37}, 'tot': {2: 36709, 3: 3671, 4: 367, 5: 37}, 'best': 5, 'naive': 5, 'nines': {3: (33038, 0, 'pays'), 4: (3304, 0, 'pays'), 5: (330, 0, 'pays')}, 'save': 0}
# no cost, HA  {'hour': (0, 0, 0), 'down': {2: 0, 3: 0, 4: 0, 5: 0}, 'tot': {2: 0, 3: 40000, 4: 160000, 5: 520000}, 'best': 2, 'naive': 2, 'nines': {3: (0, 40000, 'loses'), 4: (0, 120000, 'loses'), 5: (0, 360000, 'loses')}, 'save': 0}
# top          {'hour': (55000, 55000, 55000), 'down': {2: 4818000, 3: 481800, 4: 48180, 5: 4818}, 'tot': {2: 4818000, 3: 681800, 4: 848180, 5: 2604818}, 'best': 3, 'naive': 3, 'nines': {3: (4336200, 200000, 'pays'), 4: (433620, 600000, 'loses'), 5: (43362, 1800000, 'loses')}, 'save': 2213182}
# euro tie     {'hour': (15700, 9600, 11415), 'down': {2: 999996, 3: 100000, 4: 10000, 5: 1000}, 'tot': {2: 999996, 3: 130000, 4: 130000, 5: 391000}, 'best': 3, 'naive': 4, 'nines': {3: (899996, 30000, 'pays'), 4: (90000, 90000, 'even'), 5: (9000, 270000, 'loses')}, 'save': 869996}
# even nine    {'hour': (1400, 400, 698), 'down': {2: 61111, 3: 6111, 4: 611, 5: 61}, 'tot': {2: 61111, 3: 61111, 4: 220611, 5: 715061}, 'best': 2, 'naive': 3, 'nines': {3: (55000, 55000, 'even'), 4: (5500, 165000, 'loses'), 5: (550, 495000, 'loses')}, 'save': 0}
```
