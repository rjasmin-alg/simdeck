<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-contingency-reserve: specification

Task `docs/tasks/w3/fin-contingency-reserve.md`, catalogue `fin-contingency-reserve` (§4.12). Class **explorer**:
the state is a pure function of the params (`sim.js` `compute`), no steps.

**One concept:** each line of a project estimate is a range skewed towards overruns, so the total's median is above
the sum of the most likely values; the reserve buys a level of confidence.

**The contrast on the stage:** one estimate read two ways, the sum of the most likely values (what a plan built line
by line says) against the budget at a confidence level (what the trials say). Top: the five lines, each a triangle
from low to high with its most likely value (solid tick) and its average (dashed tick) marked. Middle: the totals of
many trials as a histogram with the cumulative share (S-curve), the base (sum of the most likely values) dashed, the
chosen level's budget solid, the reserve between them as a bracket; beside it, a ladder of the five confidence levels
with their budgets and reserves. Bottom: the chosen budget = base + reserve.

## Constants (illustrative, made up but plausible)

| | value | source |
|---|---|---|
| lines | five: hardware, own staff time, contractors, data migration, training and handover | a typical IT infrastructure project *(check: the split)* |
| distribution of a line | triangular (low, most likely, high) | the standard three-point range estimate (PMBOK, "three-point estimating"; Vose, *Risk Analysis*) |
| lines are independent | yes (no correlation) | simplification, stated in the stage footer and the explanation |
| confidence levels | 50, 70, 80, 90, 95 % | P50 / P80 are the common budgeting levels *(check: usage)* |
| trials | 100, 1 000, 10 000 | |
| histogram | 40 bins | |
| random numbers | mulberry32 seeded with `seed` (the kit's `Simdeck.rng`) | |

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `line` | the line rows on the stage (click, or Enter/Space on a focused row); hidden in the panel, kept in the URL | `hw`, `staff`, `ext`, `mig`, `train` (`hw`) | which line the three sliders edit |
| `<line>` | range, shown for the chosen line | 0–100 000 €, step 500 (preset 1) | the line's most likely value |
| `<line>D` | range, shown for the chosen line | 0–50 %, step 5 | how far below the most likely value it may come in ("may come in lower by") |
| `<line>U` | range, shown for the chosen line | 0–200 %, step 5 | how far above it may run ("may run higher by") |
| `conf` | choice; also the ladder rows on the stage | 50, 70, 80, 90, 95 (80) | the confidence level |
| `trials` | choice | 100, 1 000, 10 000 (10 000) | |
| `seed` | hidden; the button "Run again" (key `N`) adds 1 (after 999 999 it is 1) | 1–999 999 (1) | a new set of trials |

The defaults are preset 1. Out-of-range values (from a URL) are clamped and snapped to their step (rounded to
nearest); non-finite numbers, non-numbers, empty or blank values, booleans and objects take the default; a `conf` or
`trials` not in its list, or a `line` not one of the five, takes the default (`normalise`). After snapping, every low
and high value is a whole number of euros (500 × 5 % = 25 €).

## Rules

1. **Ties (first).**
   - a. **A trial total equal to the base is enough**: "the base is enough" counts totals at or below it (rule 6).
   - b. **A budget equal to the base needs no reserve**: reserve ≤ 0 is *covered* (`capCovered`); the reserve is
     shown as 0 € when it is negative, and the caption says the base already covers the level.
   - c. **Nearest rank:** at q % of n trials the budget is the ⌈q × n ÷ 100⌉-th smallest total; equal totals are
     equal, so which of them is taken does not matter.
   - d. **Histogram edges:** a total on the edge between two bins goes to the upper bin; the axis's top end to the last
     bin. In a bin, a total equal to the base counts as "within the base", one equal to the budget as "reserve".
   - e. **Sums of halves** round up: the sum of the averages and each line's average (÷ 3, rounded once), each trial
     total; each percentage rounds halves away from zero (rule 8).
2. **A line's range:** low = most likely × (100 − D) ÷ 100, high = most likely × (100 + U) ÷ 100. With U > D the range
   is skewed towards overruns.
3. **A draw** from the triangle (low a, most likely c, high b) for u in [0, 1): if b = a it is c; if u < (c − a) ÷ (b − a)
   it is a + √(u (b − a)(c − a)), otherwise b − √((1 − u)(b − a)(b − c)) (the inverse of the triangular distribution
   function).
4. **A trial** draws every line once, in the order hardware, own staff, contractors, data migration, training: trial t
   (from 0) takes the (5t + i)-th number of the seeded stream for line i. Its **total** is the sum, rounded once to
   whole euros. The totals are sorted.
5. **The budget at q %** = the nearest-rank q-th percentile of the totals (rule 1c), "Pq". The **reserve** = Pq − base;
   as a share of the base, whole per cent (rule 8).
6. **The base is enough** in the share of trials with a total at or below the base (rule 1a), in tenths of a per cent.
7. **The average of a line** = (low + most likely + high) ÷ 3; with U > D it lies above the most likely value. The sum
   of the averages is the expected total; with many trials the P50 lies near it (the totals' distribution is nearly
   symmetric, central limit), so the median is above the base by about the sum of each line's skew.
8. **Percentages** (reserve ÷ base) are whole per cent, halves away from zero; with a base of 0 there is none.
9. **The chart:** the axis runs from min(smallest total, base) to max(largest total, base), widened to a nice step
   (1, 2, 2.5 or 5 × 10^k, at least a quarter of the span); 40 bins of equal width (rule 1d); each bin counts its
   totals in three parts: at or below the base, above the base up to the budget (the reserve), above the budget.
   The S-curve is the cumulative share at each bin's upper edge.
10. **Changed mark:** when a param change turns the chosen level from needing a reserve to covered or back, the result
    is marked changed.

## Captions

Main sentence: `capReserve` (reserve > 0) or `capCovered` (≤ 0). Then the notes that apply, in this order:
`nSymmetric` (every line's low and high lie equally far from its most likely value, i.e. D = U or the line is at
0 €: the base is the median, the reserve buys only the spread) or else `nSkew` (the sum
of the averages is above the base: taken together the lines overrun further than they save, so the most likely
values are not the likely total; a single line may still be symmetric or lean the other way); `nFew` (100 trials: the levels
move with each run; press Run again).

## Presets and expected numbers

`seed` 1 for all. Rows: [most likely €, D %, U %] for hardware, own staff, contractors, data migration, training.

| # | id | lines | conf, trials | base | Σ averages | Σ low – Σ high | base enough | P50 | P70 | P80 | P90 | P95 | reserve at conf |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `project` | 20 000/5/15, 15 000/10/40, 12 000/10/30, 8 000/15/100, 5 000/15/40 | 80, 10 000 | 60 000 | 65 650 | 54 350 – 82 600 | 150 (1.5 %) | 65 443 | 67 150 | 68 199 | 69 648 | 70 916 | 8 199 (14 %) |
| 2 | `symmetric` | the same values, every line 15/15 | 50, 10 000 | 60 000 | 60 000 | 51 000 – 69 000 | 5 003 (50.0 %) | 59 998 | 60 965 | 61 551 | 62 336 | 62 999 | −2: covered |
| 3 | `one-wild` | 20 000/5/10, 15 000/5/10, 12 000/5/10, 8 000/10/200, 5 000/5/10; line `mig` chosen | 80, 10 000 | 60 000 | 65 933 | 56 600 – 81 200 | 186 (1.9 %) | 65 234 | 67 927 | 69 589 | 71 781 | 73 228 | 9 589 (16 %) |
| 4 | `few-trials` | as preset 1 | 80, 100 | 60 000 | 65 650 | 54 350 – 82 600 | 1 (1.0 %) | 64 781 | 66 923 | 67 717 | 69 219 | 70 387 | 7 717 (13 %) |
| 5 | `spend-cap` | 5 000/5/10, 3 000/10/40, 2 000/10/40, 1 500/10/100, 1 000/10/50 | 95, 10 000 | 12 500 | 13 667 | 11 500 – 17 000 | 101 (1.0 %) | 13 631 | 13 954 | 14 153 | 14 436 | 14 677 | 2 177 (17 %) |

What each shows:
1. The plan's sum of most likely values is enough in 1.5 % of the trials; P50 is 5 443 € above it; P80 needs 14 %.
2. Symmetric ranges: the base is the median (P50 = 59 998, the base covers it); a reserve buys only the spread above.
3. One line with a long tail (data migration, up to 3 × its most likely value) carries most of the reserve.
4. With 100 trials the levels move with each run (Run again); with 10 000 they barely move.
5. A small project under a one-off spend cap of 15 000 € (DR P07 brief's cap, a student brief): even P95 (14 677 €)
   fits under it.

Run again on preset 1 (seeds 2–5, 100 and 10 000 trials) is in the tests: P80 moves by over 1 000 € between seeds
with 100 trials and by under 200 € with 10 000.

## Legend

within the base (solid), reserve (hatched), over the budget (dotted), base (dashed line), budget at the level (solid
line), cumulative share (S-curve), most likely (solid tick), average (dashed tick), changed (highlighter).

## Terms (hr / en)

pričuva za nepredviđene troškove / contingency reserve; procjena u tri točke / three-point estimate; najvjerojatnija
vrijednost / most likely value; trokutasta razdioba / triangular distribution; razina pouzdanosti / confidence level;
P50 (medijan) / P50 (median); simulacija Monte Carlo / Monte Carlo simulation; pokus / trial; zbroj najvjerojatnijih
vrijednosti (osnovna procjena) / sum of the most likely values (base estimate); pričuva uprave / management reserve.

## Misconceptions targeted

- "Add the most likely values and you have the most likely total." The sum of modes is enough in 1.5 % of trials
  (preset 1).
- "The reserve is a fixed 10 %." It depends on the ranges' skew and on the confidence chosen (presets 1–3, ladder).
- "P80 means 80 % of the cost." P80 is the budget that is enough in 80 % of the trials.
- "Budget for the worst case." Σ high (82 600 €) is far above even P95 (70 916 €).
- "More trials make the project safer." They only make the estimate of the level steadier (preset 4, Run again).

## Out of scope

Correlated lines (risks that move together fatten the tail; said in the explanation), discrete risk events with a
probability, schedule risk, the management reserve (named once in the explanation), other distributions (PERT, log-normal).

## Check script

`python3` (independent of the JS: its own mulberry32, triangle and nearest rank); prints the preset rows above.

```python
# Independent check of SPEC.md's preset numbers: mulberry32, triangular inverse CDF, nearest-rank levels.
import math
def rng(seed):
    a = seed & 0xffffffff
    def imul(x, y): return (x * y) & 0xffffffff
    def nxt():
        nonlocal a
        a = (a + 0x6d2b79f5) & 0xffffffff
        t = a
        t = imul(t ^ (t >> 15), t | 1)
        t ^= (t + imul(t ^ (t >> 7), t | 61)) & 0xffffffff
        return ((t ^ (t >> 14)) & 0xffffffff) / 4294967296
    return nxt
def draw(lo, ml, hi, u):
    w = hi - lo
    if w == 0: return ml
    if u < (ml - lo) / w: return lo + math.sqrt(u * w * (ml - lo))
    return hi - math.sqrt((1 - u) * w * (hi - ml))
def run(rows, n, seed=1):
    lines = [(ml * (100 - d) // 100, ml, ml * (100 + u) // 100) for ml, d, u in rows]
    r = rng(seed); tot = []
    for _ in range(n):
        s = 0.0
        for l in lines: s += draw(*l, r())
        tot.append(math.floor(s + 0.5))
    tot.sort()
    base = sum(l[1] for l in lines)
    lv = [tot[math.ceil(q * n / 100) - 1] for q in (50, 70, 80, 90, 95)]
    enough = sum(1 for x in tot if x <= base)
    mean = (2 * sum(sum(l) for l in lines) + 3) // 6
    return base, mean, sum(l[0] for l in lines), sum(l[2] for l in lines), enough, lv
P = [(20000, 5, 15), (15000, 10, 40), (12000, 10, 30), (8000, 15, 100), (5000, 15, 40)]
for name, rows, n in [('project', P, 10000), ('symmetric', [(m, 15, 15) for m, _, _ in P], 10000),
                      ('one-wild', [(20000, 5, 10), (15000, 5, 10), (12000, 5, 10), (8000, 10, 200), (5000, 5, 10)], 10000),
                      ('few-trials', P, 100),
                      ('spend-cap', [(5000, 5, 10), (3000, 10, 40), (2000, 10, 40), (1500, 10, 100), (1000, 10, 50)], 10000)]:
    print(name, *run(rows, n))
```

Output:

```
project 60000 65650 54350 82600 150 [65443, 67150, 68199, 69648, 70916]
symmetric 60000 60000 51000 69000 5003 [59998, 60965, 61551, 62336, 62999]
one-wild 60000 65933 56600 81200 186 [65234, 67927, 69589, 71781, 73228]
few-trials 60000 65650 54350 82600 1 [64781, 66923, 67717, 69219, 70387]
spend-cap 12500 13667 11500 17000 101 [13631, 13954, 14153, 14436, 14677]
```
