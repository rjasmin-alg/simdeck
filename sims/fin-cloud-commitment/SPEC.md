<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-cloud-commitment: specification

Task `docs/tasks/w3/fin-cloud-commitment.md`, catalogue `fin-cloud-commitment` (§4.12). Class **explorer**: the state
is a pure function of the params (`sim.js` `compute`), no steps.

**One concept:** a commitment buys a discount on usage that is paid for whether it is used or not; a committed server
pays off when it runs more than the break-even share of the time, committed price ÷ on-demand price; so commit the
base load and leave the peaks on demand. A longer term gives a deeper discount and binds you for longer.

**The contrast on the stage:** price vs utilisation (the discounted price against what is actually used). A year of
usage, month by month, as bars of servers running, with the commitment as a line across: below the line and under the
bar the commitment is used, above the bar and below the line it is paid and unused (hatched), above the line the bar
runs on demand (striped). Beside the months, on the same vertical scale, each server level's utilisation over the term
against the break-even line, so the levels that pay are the ones whose bar crosses it. Under the chart: the term's cost
all on demand and with the commitment (used, unused, on demand), the saving or loss, and both terms' saving at the
chosen level.

## Prices (illustrative, made up but plausible)

| | value | source |
|---|---|---|
| on-demand price `P` | 200 € per server-month (a mid-size virtual server running all month) | *(check: order of magnitude)* |
| 1-year commitment | 30 % off → committed price 140 € per server-month | *(check: typical published discounts are some 30–40 %)* |
| 3-year commitment | 50 % off → committed price 100 € per server-month | *(check: typical published discounts are some 50–60 %)* |

Paid monthly, no upfront part (`fin-prepay-discount` covers paying in advance).

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `u1` … `u12` | a bar per month on the stage (drag, or arrow keys; hidden ranges keep them in the URL) | 0–16 servers, step 1 (preset 2) | servers running all month in year 1 |
| `commit` | range in the panel; also the level ladder on the stage (drag, or arrow keys) | 0–16, step 1 (6) | servers committed |
| `term` | choice in the panel: 1 year, 3 years | 1, 3 (1) | sets the discount and how long the commitment runs |
| `later` | range in the panel (it drives the 3-year term and its chip) | 0–150 %, step 25 (100) | usage in years 2 and 3, as a share of year 1, month by month |

Out-of-range or non-numeric values (from a URL) are clamped and snapped to their step (rounded to nearest); non-numbers,
empty values and booleans take the default; a term other than 3 is 1 (`normalise`).

## Rules

Usage is counted in hundredths of a server per month, so every amount below is exact (whole euros for every
param value: year 1 is whole servers, and years 2–3 exist only at the 3-year price of 100 €).

1. **Ties (first).**
   - a. **The best level** is the *smallest* commitment with the lowest total (rule 7): a server level exactly at
     break-even saves nothing and binds you, so it is left out.
   - b. **A level exactly at break-even** is *even*: it neither pays nor loses (rule 6).
   - c. **Equal totals** (with commitment = all on demand) are *even*: no saving and no loss (`capEven`).
   - d. **Percent** rounds to the nearest whole percent, halves away from zero (21.5 % → 22 %, −21.5 % → −22 %).
2. **Committed price** = P × (1 − discount): 140 € (1 year), 100 € (3 years).
3. **Usage over the term:** 12 × term months. Year 1 is `u1…u12`; with the 3-year term, years 2 and 3 are each
   `u_m × later ÷ 100` (the same pattern, scaled).
4. **One month** with commitment c: the commitment is paid in full, c × committed price; min(usage, c) of it is used;
   max(0, c − usage) is unused (paid for nothing); max(0, usage − c) runs on demand at P.
5. **Totals over the term:** all on demand = Σ usage × P; with commitment = months × c × committed price + Σ on-demand
   part × P; saving = all on demand − with commitment (negative: a loss). Saving % = saving ÷ all on demand (rule 1d);
   none when nothing is used.
6. **Break-even utilisation** = committed price ÷ P: 70 % (1 year), 50 % (3 years). Server level k (the k-th
   committed server) is used in a month for clamp(usage − (k − 1), 0, 1) of it; its utilisation is the sum over the
   term ÷ the months. It **pays** when its utilisation is above break-even, is **even** at break-even, **loses** below.
   Its marginal saving is P × (its use in server-months) − months × committed price.
7. **Best level** c\* = the smallest c in 0…16 with the lowest total with commitment (rule 1a). As a level's
   utilisation never rises with k, c\* is also the number of levels that pay.
8. **The two terms** at the chosen commitment and `later`: the saving % with the 1-year term (year 1 only) and with
   the 3-year term (all three years), side by side, so the deeper discount and the risk show at once. Each chip carries
   its own outcome (rule 1c) besides its percent. `later` drives the 3-year chip whichever term is chosen, so its
   slider is always shown.
9. **Changed mark:** when a param change changes the outcome (saving, even, loss), the result is marked changed.

## Presets (numbers checked by the script at the end)

Usage: **seasonal** = 5 5 6 7 8 8 9 8 7 6 10 13 servers (a base of five, a busier summer, the year-end peak);
**steady** = 8 every month.

| # | id | usage | c | term | later | all on demand | with commitment (paid / unused / on demand) | result | best | 1 y / 3 y |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `steady` | steady | 8 | 1 | — | 19 200 | 13 440 (13 440 / 0 / 0) | saving 5 760, 30 % | 8 | 30 % / 50 % |
| 2 | `base-load` | seasonal | 6 | 1 | — | 18 400 | 14 480 (10 080 / 280 / 4 400) | saving 3 920, 21 % | 6 | 21 % / 37 % |
| 3 | `cover-peak` | seasonal | 13 | 1 | — | 18 400 | 21 840 (21 840 / 8 960 / 0) | loss 3 440, −19 % | 6 | −19 % / 15 % |
| 4 | `three-years` | seasonal | 7 | 3 | 100 % | 55 200 | 33 600 (25 200 / 1 800 / 8 400) | saving 21 600, 39 % | 7 | 21 % / 39 % |
| 5 | `usage-falls` | seasonal | 7 | 3 | 25 % | 27 600 | 28 000 (25 200 / 12 800 / 2 800) | loss 400, −1 % | 2 | 21 % / −1 % |

Also checked: preset 4 with c = 8 → 33 600 as well (level 8 runs exactly 50 %: even), so the best level stays 7 and
the caption says "costs the same as the best"; nothing committed → 18 400 both ways, even, best 6; no usage and
nothing committed → 0 / 0, no percent, best 0; no usage, 3 committed for 3 years → loss 10 800, no percent; the
seasonal year at 150 % from year 2, c = 7, 3 years → saving 24 000, 33 %, best 9, level 10 even.

## Legend

Commitment used (solid, `--c1`), commitment paid but unused (diagonal hatching, `--c2`), on demand (horizontal
stripes, `--c3`), the commitment level (thick ink line), break-even (dashed line on the ladder), a level that pays
(ladder bar with ✓), changed (highlight).

## Captions (built from the state)

The main sentence: `capNone` (nothing committed: everything on demand), else `capSave` / `capEven` / `capLoss` with the
paid commitment, its unused part, the on-demand spend, both totals and the difference. Then at most two notes, in this
order: about the best level, one of `nAtBest` (c = c\* > 0), `nNonePays` (c\* = 0 and either c > 0 or some usage),
`nSameAsBest` (c ≠ c\*, equal totals: rule 1a), `nBest` (otherwise); and for the 3-year term, `nStop` (`later` = 0),
`nShrink` (`later` < 100) or `nGrow` (`later` > 100).

A saving or loss that rounds to 0 % is written "under 1 %", never "0 %" (the outcome decides the word, rule 1c).

## Misconceptions targeted

- "A discount is always a saving." (Preset 3: committing to the peak costs more than paying on demand.)
- "Commit to what you need at the peak." (Presets 2, 3: commit the base load, the peaks stay on demand.)
- "The longer term is simply cheaper." (Presets 4, 5: the 3-year discount is deeper, but when usage falls the
  commitment is still paid and the saving turns into a loss.)
- "The best commitment is the average usage." (Preset 2: the best level is where a server runs more than 70 % of the
  time, not the average of 7.7.)

## Out of scope

Paying upfront and its implied interest (`fin-prepay-discount`); discounting future payments (`fin-npv-discounting`);
commitments in money per hour rather than in servers, flexible or convertible commitments, reselling unused
commitment; usage within a month (hours, autoscaling: `perf-autoscaling-lag`); price changes during the term;
a 1-year term renewed in later years; tax and accounting of prepayments.

## Terms (hr / en)

ugovorena potrošnja (obveza) / commitment; plaćanje po potrošnji / on demand (pay as you go); ugovorena cijena /
committed price; popust / discount; razdoblje obveze / term; iskorištenost / utilisation; točka pokrića
(iskorištenosti) / break-even (utilisation); osnovno opterećenje / base load; vršno opterećenje / peak; neiskorištena
obveza / unused commitment; poslužitelj-mjesec / server-month.

## Check script

Run with `python3`; the preset test in `sim.test.js` compares `sim.js` with the same numbers.

```python
P = 200; CP = {1: 140, 3: 100}; MONTHS = 12; NMAX = 16
def usage(u, term, later):                       # hundredths of a server, month by month over the term
    return [100 * x for x in u] + [x * later for x in u] * (term - 1)
def euros(h, price): return h * price / 100
def view(u, c, term, later=100):
    us, cp, C = usage(u, term, later), CP[term], 100 * c
    allod = sum(euros(U, P) for U in us)
    paid = len(us) * c * cp
    unused = sum(euros(max(0, C - U), cp) for U in us)
    od = sum(euros(max(0, U - C), P) for U in us)
    w = paid + od
    def W(k): return len(us) * k * cp + sum(euros(max(0, U - 100 * k), P) for U in us)
    tots = [W(k) for k in range(NMAX + 1)]
    best = tots.index(min(tots))
    used = [sum(min(max(U - 100 * (k - 1), 0), 100) for U in us) for k in range(1, NMAX + 1)]
    marg = [euros(x, P) - len(us) * cp for x in used]
    pays = sum(1 for m in marg if m > 0)
    even = [k + 1 for k, m in enumerate(marg) if m == 0]
    def pct(s, a):
        if a == 0: return None
        q = (200 * abs(s) + a) // (2 * a); return int(q if s >= 0 else -q)
    save = allod - w
    return dict(all=allod, paid=paid, unused=unused, od=od, w=w, save=save, pct=pct(save, allod), best=best,
                pays=pays, even=even, same_as_best=(w == tots[best]))
SEAS = [5, 5, 6, 7, 8, 8, 9, 8, 7, 6, 10, 13]
STEADY = [8] * 12
cases = {
  'steady':      (STEADY, 8, 1, 100),
  'base-load':   (SEAS, 6, 1, 100),
  'cover-peak':        (SEAS, 13, 1, 100),
  'three-years': (SEAS, 7, 3, 100),
  'usage-falls': (SEAS, 7, 3, 25),
  'three-years, 8 (tie)': (SEAS, 8, 3, 100),
  'nothing committed': (SEAS, 0, 1, 100),
  'no usage': ([0] * 12, 0, 1, 100),
  'no usage, 3 committed': ([0] * 12, 3, 3, 100),
  'seasonal, 1y, 7': (SEAS, 7, 1, 100),
  'grows 150%': (SEAS, 7, 3, 150),
}
for k, (u, c, t, l) in cases.items():
    v = view(u, c, t, l)
    other = view(u, c, 3 if t == 1 else 1, l)
    print(f"{k:22}", {x: v[x] for x in v}, 'chip other term', other['pct'])
# steady                 {'all': 19200.0, 'paid': 13440, 'unused': 0.0, 'od': 0.0, 'w': 13440.0, 'save': 5760.0, 'pct': 30, 'best': 8, 'pays': 8, 'even': [], 'same_as_best': True} chip other term 50
# base-load              {'all': 18400.0, 'paid': 10080, 'unused': 280.0, 'od': 4400.0, 'w': 14480.0, 'save': 3920.0, 'pct': 21, 'best': 6, 'pays': 6, 'even': [], 'same_as_best': True} chip other term 37
# cover-peak             {'all': 18400.0, 'paid': 21840, 'unused': 8960.0, 'od': 0.0, 'w': 21840.0, 'save': -3440.0, 'pct': -19, 'best': 6, 'pays': 6, 'even': [], 'same_as_best': False} chip other term 15
# three-years            {'all': 55200.0, 'paid': 25200, 'unused': 1800.0, 'od': 8400.0, 'w': 33600.0, 'save': 21600.0, 'pct': 39, 'best': 7, 'pays': 7, 'even': [8], 'same_as_best': True} chip other term 21
# usage-falls            {'all': 27600.0, 'paid': 25200, 'unused': 12800.0, 'od': 2800.0, 'w': 28000.0, 'save': -400.0, 'pct': -1, 'best': 2, 'pays': 2, 'even': [], 'same_as_best': False} chip other term 21
# three-years, 8 (tie)   {'all': 55200.0, 'paid': 28800, 'unused': 3600.0, 'od': 4800.0, 'w': 33600.0, 'save': 21600.0, 'pct': 39, 'best': 7, 'pays': 7, 'even': [8], 'same_as_best': True} chip other term 18
# nothing committed      {'all': 18400.0, 'paid': 0, 'unused': 0.0, 'od': 18400.0, 'w': 18400.0, 'save': 0.0, 'pct': 0, 'best': 6, 'pays': 6, 'even': [], 'same_as_best': False} chip other term 0
# no usage               {'all': 0.0, 'paid': 0, 'unused': 0.0, 'od': 0.0, 'w': 0.0, 'save': 0.0, 'pct': None, 'best': 0, 'pays': 0, 'even': [], 'same_as_best': True} chip other term None
# no usage, 3 committed  {'all': 0.0, 'paid': 10800, 'unused': 10800.0, 'od': 0.0, 'w': 10800.0, 'save': -10800.0, 'pct': None, 'best': 0, 'pays': 0, 'even': [], 'same_as_best': False} chip other term None
# seasonal, 1y, 7        {'all': 18400.0, 'paid': 11760, 'unused': 840.0, 'od': 2800.0, 'w': 14560.0, 'save': 3840.0, 'pct': 21, 'best': 6, 'pays': 6, 'even': [], 'same_as_best': False} chip other term 39
# grows 150%             {'all': 73600.0, 'paid': 25200, 'unused': 600.0, 'od': 24400.0, 'w': 49600.0, 'save': 24000.0, 'pct': 33, 'best': 9, 'pays': 9, 'even': [10], 'same_as_best': False} chip other term 21
```
