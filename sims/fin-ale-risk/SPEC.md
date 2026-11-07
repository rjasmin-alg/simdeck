<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-ale-risk: specification

Task `docs/tasks/w3/fin-ale-risk.md`, catalogue `fin-ale-risk` (§4.12). Class **explorer**: the state is a pure
function of the params (`sim.js` `compute`), no steps.

**One concept:** ALE = single loss expectancy × annual rate of occurrence; a control is worth its yearly cost when it
removes more ALE than that; accept, reduce, transfer (insurance) or avoid; a rare large loss hides behind a small
average.

**The contrast on the stage:** one risk register read two ways, the **average year** (ALE, what the formula says)
against the **worst simulated year** (what a rare large loss does). Top: the register, five rows, each with loss ×
frequency = ALE, the four treatments as buttons, and the chosen treatment's yearly cost, the ALE it removes and the
verdict (worth it, break-even, not worth it on average). Middle: the simulated years as columns, untreated (outline)
and with the choices (solid: the treatments' fixed yearly cost; hatched: the losses kept), the two expected lines
(dashed: ALE untreated; solid: expected cost with the choices), and the worst year of each marked (one tag when both
columns have the same worst year and amount, none for a column whose worst year is 0; when the two lines are within
1/12 of the axis the ALE's tag moves to the left end); beside it a table
untreated vs with the choices (expected per year, average simulated year, worst year, years with a loss). Bottom: the
result, what the choices save or cost on average and what they do to the worst year.

## Constants (illustrative, made up but plausible)

| | value | source |
|---|---|---|
| risks | five: lost or stolen laptop, payment fraud by a fake invoice email, ransomware (weeks of rebuild), site power outage, breach of an old customer portal | a small organisation's IT risk register *(check: the set)* |
| control acts on | laptop: the loss (encrypted disks), fraud: the frequency (call-back to confirm a changed bank account), ransomware: the loss (an immutable backup copy, `ransomware-321`), outage: the frequency (second power feed and generator), portal: the frequency (a yearly security review) | generic controls, no products |
| loss per event (SLE) | choice: 0 (not in the register), 1 000, 2 000, 5 000, 10 000, 20 000, 50 000, 100 000, 200 000, 500 000, 1 000 000 € | |
| frequency (ARO) | choice: 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 4, 12 a year | |
| events per year | Poisson with mean ARO, the loss per event fixed at SLE | the standard frequency–severity model with a fixed severity (classic ALE) |
| simulated years | 100, 1 000 | |
| random numbers | mulberry32 seeded with `seed` (the kit's `Simdeck.rng`) | |

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `risk` | the register rows on the stage (click the name); hidden in the panel, kept in the URL | the five ids (`ransom`) | which risk the panel edits |
| `<id>L` | select, shown for the chosen risk | LOSS list (base row) | 0 takes the risk out of the register |
| `<id>F` | select, shown for the chosen risk | FREQ list | |
| `<id>T` | choice, shown for the chosen risk; also the four buttons in each row | accept, reduce, transfer, avoid (`accept`) | |
| `<id>C` | range, shown when the chosen risk is reduced | 0–100 000 €/yr, step 500 | the control's yearly cost |
| `<id>E` | range, shown when the chosen risk is reduced | 0–100 %, step 5 | how much of the frequency (or the loss) the control removes |
| `<id>A` | range, shown when the chosen risk is avoided | 0–200 000 €/yr, step 1 000 | the benefit given up by not doing the activity |
| `ded` | range, shown when the chosen risk is transferred | 0–100 000 €, step 1 000 (10 000) | the deductible you keep per event |
| `load` | range, shown when the chosen risk is transferred | 100–300 %, step 10 (150) | the premium as a share of the insurer's expected payout |
| `years` | choice | 100, 1 000 (100) | |
| `seed` | hidden; the button "Run again" (key `N`) adds 1 (after 999 999 it is 1) | 1–999 999 (1) | a new set of years |

Base rows [SLE €, ARO /yr, control cost €/yr, control effect %, benefit given up €/yr]: laptop [2 000, 4, 2 000, 50,
40 000]; fraud [50 000, 0.5, 3 000, 90, 60 000]; ransom [500 000, 0.05, 15 000, 80, 200 000]; outage [20 000, 0.5,
20 000, 90, 30 000]; portal [200 000, 0.1, 15 000, 50, 12 000].

The defaults are preset 1. Out-of-range values (from a URL) are clamped and snapped to their step (rounded to
nearest); non-finite numbers, non-numbers, empty or blank values, booleans and objects take the default; a loss,
frequency, year count, treatment or risk not in its list takes the default (`normalise`).

## Rules

1. **Ties (first).**
   - a. **A control worth exactly its cost is break-even, not worth it:** worth it only when the ALE it removes is
     *more* than its yearly cost (net > 0); net = 0 is "break-even"; net < 0 "not worth it on average". The same for
     insurance and avoidance. Accept has no verdict.
   - b. **A loss at or below the deductible** is all kept: the insurer pays nothing and the premium is 0.
   - c. **Poisson inversion:** the count for u is the number of k ≥ 0 with F(k) ≤ u, so a u exactly equal to F(k)
     counts k + 1 events.
   - d. **The worst year** is the largest; among equal worst years the first is marked on the chart.
   - e. **Rounding:** every expected amount (ALE, the loss kept, the premium, the averages) is rounded once to whole
     euros, halves up; the totals add the rounded amounts. A "times" ratio is in tenths, halves up.
   - f. **Choices that save exactly nothing** (expected cost with the choices = ALE, at least one risk treated) are
     "even", neither saving nor costing.
2. **ALE** = SLE × ARO (ARO in hundredths: SLE × f ÷ 100).
3. **A risk with SLE 0** is not in the register: ALE 0, no cost, its treatment ignored, no events (its random number is
   still drawn, rule 6).
4. **Treatments** (yearly expected amounts):
   - accept: loss kept = ALE, cost 0;
   - reduce: loss kept = SLE × ARO × (100 − E) ÷ 100, cost = C; the control lowers the frequency (fraud, outage,
     portal) or the loss per event (laptop, ransomware), which gives the same ALE but different years;
   - transfer: you keep min(SLE, deductible) per event, loss kept = ARO × that; premium = ARO × (SLE − kept per
     event) × load ÷ 100, cost = premium. With load > 100 % the premium is above the ALE it removes;
   - avoid: loss kept 0, cost = A (the benefit given up).
   ALE removed = ALE − loss kept; net = removed − cost (rule 1a).
5. **Totals:** Σ ALE, Σ loss kept, Σ cost; the expected cost with the choices = Σ loss kept + Σ cost; the saving =
   Σ ALE − that (rule 1f).
6. **A simulated year:** year y (from 0) takes for risk i (register order) the (5y + i)-th number u of the seeded
   stream. Untreated events = Poisson(u, ARO); treated events = Poisson(u, the treated frequency): ARO × (100 − E) ÷ 100
   for a frequency control, 0 when avoided, ARO otherwise (the same u, so a control never adds an event).
7. **A year's cost:** untreated = Σ events × SLE; with the choices = Σ cost (every year) + Σ treated events × the loss
   kept per event (SLE; SLE × (100 − E) ÷ 100 for a loss control; min(SLE, deductible) when transferred).
8. **Summaries** for each column: the average (whole euros, rule 1e), the worst year (rule 1d), the years with a loss
   (a year's losses above 0, the fixed cost not counted). The quiet years: untreated years with no loss.
9. **The chart's axis** runs from 0 to the largest of both worst years and both expected lines, on a nice step (1, 2,
   2.5 or 5 × 10^k, at least a quarter of it).
10. **Changed mark:** when a param change moves the outcome between none (nothing treated), save, even and cost, the
    result is marked changed.

## Captions

Main sentence: `capEmpty` (no risk in the register), `capNoLoss` (nothing treated and no loss in any simulated year),
`capNone` (nothing treated: ALE, the average and the worst simulated year, the worst as a multiple of the ALE), `capSave`, `capEven` or `capCost` (the treatments' yearly cost,
the ALE before and the loss kept, the saving or extra cost on average, the worst year before and after). Then the
notes that apply, in this order: `nNotWorth` (a control that is not worth it on average, break-even included),
`nInsure` (insurance that costs more than it removes, net < 0, i.e. load above 100 %: it buys a smaller worst year),
`nBelowDed` (a transferred loss at or below the deductible: no cover), `nQuiet` (at least half the untreated years had
no loss, but not all: the average is made of a few heavy years).

## Presets and expected numbers

`seed` 1, deductible 10 000 €, load 150 % for all. "Exp" = expected yearly cost with the choices; "avg / worst / years
with a loss" are for the untreated column, then with the choices.

| # | id | choices | Σ ALE | Σ kept | Σ cost | Exp | 100 years: untreated avg / worst / hit | with choices avg / worst / hit | 1 000 years: untreated worst | with choices worst |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `register` | all accepted | 88 000 | 88 000 | 0 | 88 000 | 86 280 / 592 000 / 100 | the same | 1 024 000 | the same |
| 2 | `controls` | laptop, fraud, ransom, outage reduced, portal avoided; `outage` chosen | 88 000 | 12 500 | 52 000 | 64 500 | 86 280 / 592 000 / 100 | 64 440 / 178 000 / 99 | 1 024 000 | 257 000 |
| 3 | `insure` | ransom and portal transferred | 88 000 | 44 500 | 65 250 | 109 750 | 86 280 / 592 000 / 100 | 109 130 / 231 250 / 100 | 1 024 000 | 323 250 |
| 4 | `rare` | only ransomware, 1 000 000 € once in 100 years, accepted | 10 000 | 10 000 | 0 | 10 000 | 20 000 / 1 000 000 / 2 | the same | 1 000 000 (9 years hit) | the same |
| 5 | `break-even` | ransom reduced, control 20 000 €/yr | 88 000 | 68 000 | 20 000 | 88 000 | 86 280 / 592 000 / 100 | 90 280 / 566 000 / 100 | 1 024 000 | 566 000 |

Per risk (ALE, kept, cost, net): `controls`: laptop 8 000 / 4 000 / 2 000 / +2 000; fraud 25 000 / 2 500 / 3 000 /
+19 500; ransom 25 000 / 5 000 / 15 000 / +5 000; outage 10 000 / 1 000 / 20 000 / −11 000 (not worth it); portal
20 000 / 0 / 12 000 / +8 000. `insure`: ransom 25 000 / 500 / 36 750 / −12 250; portal 20 000 / 1 000 / 28 500 / −9 500.
`break-even`: ransom 25 000 / 5 000 / 20 000 / 0.

What each shows:
1. ALE 88 000 € a year, but the worst of 100 years costs 592 000 € (6.7 × the ALE).
2. Four treatments pay for themselves; the generator does not (removes 9 000 € for 20 000 €). On average 23 500 € a year
   saved; the worst year falls from 592 000 € to 178 000 €.
3. Insurance costs 21 750 € a year more than accepting on average, but the worst year falls from 592 000 € to 231 250 €.
4. ALE 10 000 € a year; 98 of 100 years see nothing and two years lose a million each. Run again: seed 2 has no loss in
   100 years, seeds 4 and 5 one.
5. A control that removes exactly its cost (20 000 €) is break-even: the expected cost does not move (the simulated
   average may), the worst year does.

## Legend

untreated year (outline), treatments' yearly cost (solid), loss kept (hatched), ALE untreated (dashed line), expected
cost with the choices (solid line), worst year (▼ tag), worth it ✓ / break-even = / not worth it ✗, changed (highlighter).

## Terms (hr / en)

očekivani godišnji gubitak (ALE) / annualised loss expectancy (ALE); očekivani pojedinačni gubitak (SLE) / single loss
expectancy (SLE); godišnja stopa pojavljivanja (ARO) / annualised rate of occurrence (ARO); registar rizika / risk
register; prihvatiti, smanjiti, prenijeti, izbjeći / accept, reduce, transfer, avoid; zaštitna mjera / control;
osiguranje / insurance; premija / premium; franšiza (odbitna) / deductible; najgora godina / worst year.

## Misconceptions targeted

- "ALE is what a year will cost." Almost no year costs the ALE: most years cost less, a few far more (presets 1, 4).
- "Buy every control that reduces risk." A control is worth it only when it removes more ALE than it costs (preset 2:
  the generator).
- "Insurance saves money." On average it costs more than it removes (the insurer's costs and margin); it buys a
  smaller worst year (preset 3).
- "Once in 100 years means not in our time." Two in the first 100 simulated years with seed 1 (preset 4).
- "Break-even means it does nothing." The average stays, the worst year shrinks (preset 5).

## Out of scope

Varying loss per event (a severity distribution), correlated risks, insurance limits and co-insurance, discounting
multi-year controls (`fin-npv-discounting`), qualitative risk matrices, the probability of ruin against a budget.

## Check script

`python3` (independent of the JS: its own mulberry32, Poisson inversion and rounding); prints the preset rows above.

```python
# Independent check of fin-ale-risk SPEC numbers: ALE, treatments, premium, Poisson years (mulberry32).
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
def pinv(u, lam):
    k, p = 0, math.exp(-lam); F = p
    while u >= F and k < 1000:
        k += 1; p *= lam / k; F += p
    return k
def hup(num, den):  # num/den rounded halves up, num >= 0
    return (2 * num + den) // (2 * den)
IDS = ['laptop', 'fraud', 'ransom', 'outage', 'portal']
KIND = {'laptop': 'sle', 'fraud': 'aro', 'ransom': 'sle', 'outage': 'aro', 'portal': 'aro'}
BASE = {'laptop': (2000, 4, 2000, 50, 40000), 'fraud': (50000, .5, 3000, 90, 60000),
        'ransom': (500000, .05, 15000, 80, 200000), 'outage': (20000, .5, 20000, 90, 30000),
        'portal': (200000, .1, 15000, 50, 12000)}
def run(T, over={}, ded=10000, load=150, years=100, seed=1):
    rows = {}
    for i in IDS:
        L, F, C, E, A = over.get(i, BASE[i]); f = round(F * 100); t = T.get(i, 'accept') if L > 0 else 'accept'
        ale = L * f // 100
        if L == 0: res, cost = 0, 0
        elif t == 'accept': res, cost = ale, 0
        elif t == 'reduce': res, cost = hup(L * f * (100 - E), 10000), C
        elif t == 'transfer':
            r = min(L, ded); res = hup(r * f, 100); cost = hup(f * (L - r) * load, 10000)
        else: res, cost = 0, A
        rows[i] = dict(L=L, F=F, C=C, E=E, A=A, t=t, ale=ale, res=res, cost=cost, removed=ale - res)
    ALE = sum(r['ale'] for r in rows.values()); RES = sum(r['res'] for r in rows.values())
    COST = sum(r['cost'] for r in rows.values())
    r_ = rng(seed); y0, y1, w0, w1 = [], [], 0, 0
    for y in range(years):
        a = b = 0
        for i in IDS:
            u = r_(); R = rows[i]
            if R['L'] == 0: continue
            n0 = pinv(u, R['F']); a += n0 * R['L']
            t = R['t']
            if t == 'avoid': continue
            lam, e = R['F'], R['L']
            if t == 'reduce' and KIND[i] == 'aro': lam = round(R['F'] * 100) * (100 - R['E']) / 10000
            if t == 'reduce' and KIND[i] == 'sle': e = R['L'] * (100 - R['E']) // 100
            if t == 'transfer': e = min(R['L'], ded)
            b += pinv(u, lam) * e
        y0.append(a); y1.append(b)
    out = dict(ALE=ALE, RES=RES, COST=COST, EXP=RES + COST,
               avg0=hup(sum(y0), years), worst0=max(y0), loss0=sum(1 for x in y0 if x > 0),
               avg1=hup(sum(y1) + COST * years, years), worst1=max(y1) + COST, loss1=sum(1 for x in y1 if x > 0),
               worstYear0=y0.index(max(y0)), worstYear1=y1.index(max(y1)))
    per = {i: (rows[i]['ale'], rows[i]['res'], rows[i]['cost'], rows[i]['removed'] - rows[i]['cost']) for i in IDS}
    return out, per
CTRL = {'laptop': 'reduce', 'fraud': 'reduce', 'ransom': 'reduce', 'outage': 'reduce', 'portal': 'avoid'}
OFF = lambda keep: {i: (0,) + BASE[i][1:] for i in IDS if i not in keep}
P = [('register', {}, {}, {}),
     ('controls', CTRL, {}, {}),
     ('insure', {'ransom': 'transfer', 'portal': 'transfer'}, {}, {}),
     ('rare', {}, dict(OFF(['ransom']), ransom=(1000000, .01, 15000, 80, 200000)), {}),
     ('break-even', {'ransom': 'reduce'}, {'ransom': (500000, .05, 20000, 80, 200000)}, {})]
import sys
for name, T, over, kw in P:
    for yrs in (100, 1000):
        o, per = run(T, over, years=yrs, **kw)
        print(name, yrs, o)
    print('   per risk (ALE, residual, cost, net):', per)
for s in range(1, 6):
    print('rare seed', s, {k: v for k, v in run({}, dict(OFF(['ransom']), ransom=(1000000, .01, 15000, 80, 200000)), seed=s)[0].items() if k in ('worst0', 'loss0', 'avg0')})
```

Output:

```
register 100 {'ALE': 88000, 'RES': 88000, 'COST': 0, 'EXP': 88000, 'avg0': 86280, 'worst0': 592000, 'loss0': 100, 'avg1': 86280, 'worst1': 592000, 'loss1': 100, 'worstYear0': 81, 'worstYear1': 81}
register 1000 {'ALE': 88000, 'RES': 88000, 'COST': 0, 'EXP': 88000, 'avg0': 83228, 'worst0': 1024000, 'loss0': 997, 'avg1': 83228, 'worst1': 1024000, 'loss1': 997, 'worstYear0': 866, 'worstYear1': 866}
   per risk (ALE, residual, cost, net): {'laptop': (8000, 8000, 0, 0), 'fraud': (25000, 25000, 0, 0), 'ransom': (25000, 25000, 0, 0), 'outage': (10000, 10000, 0, 0), 'portal': (20000, 20000, 0, 0)}
controls 100 {'ALE': 88000, 'RES': 12500, 'COST': 52000, 'EXP': 64500, 'avg0': 86280, 'worst0': 592000, 'loss0': 100, 'avg1': 64440, 'worst1': 178000, 'loss1': 99, 'worstYear0': 81, 'worstYear1': 21}
controls 1000 {'ALE': 88000, 'RES': 12500, 'COST': 52000, 'EXP': 64500, 'avg0': 83228, 'worst0': 1024000, 'loss0': 997, 'avg1': 63394, 'worst1': 257000, 'loss1': 991, 'worstYear0': 866, 'worstYear1': 278}
   per risk (ALE, residual, cost, net): {'laptop': (8000, 4000, 2000, 2000), 'fraud': (25000, 2500, 3000, 19500), 'ransom': (25000, 5000, 15000, 5000), 'outage': (10000, 1000, 20000, -11000), 'portal': (20000, 0, 12000, 8000)}
insure 100 {'ALE': 88000, 'RES': 44500, 'COST': 65250, 'EXP': 109750, 'avg0': 86280, 'worst0': 592000, 'loss0': 100, 'avg1': 109130, 'worst1': 231250, 'loss1': 100, 'worstYear0': 81, 'worstYear1': 67}
insure 1000 {'ALE': 88000, 'RES': 44500, 'COST': 65250, 'EXP': 109750, 'avg0': 83228, 'worst0': 1024000, 'loss0': 997, 'avg1': 108658, 'worst1': 323250, 'loss1': 997, 'worstYear0': 866, 'worstYear1': 841}
   per risk (ALE, residual, cost, net): {'laptop': (8000, 8000, 0, 0), 'fraud': (25000, 25000, 0, 0), 'ransom': (25000, 500, 36750, -12250), 'outage': (10000, 10000, 0, 0), 'portal': (20000, 1000, 28500, -9500)}
rare 100 {'ALE': 10000, 'RES': 10000, 'COST': 0, 'EXP': 10000, 'avg0': 20000, 'worst0': 1000000, 'loss0': 2, 'avg1': 20000, 'worst1': 1000000, 'loss1': 2, 'worstYear0': 21, 'worstYear1': 21}
rare 1000 {'ALE': 10000, 'RES': 10000, 'COST': 0, 'EXP': 10000, 'avg0': 9000, 'worst0': 1000000, 'loss0': 9, 'avg1': 9000, 'worst1': 1000000, 'loss1': 9, 'worstYear0': 21, 'worstYear1': 21}
   per risk (ALE, residual, cost, net): {'laptop': (0, 0, 0, 0), 'fraud': (0, 0, 0, 0), 'ransom': (10000, 10000, 0, 0), 'outage': (0, 0, 0, 0), 'portal': (0, 0, 0, 0)}
break-even 100 {'ALE': 88000, 'RES': 68000, 'COST': 20000, 'EXP': 88000, 'avg0': 86280, 'worst0': 592000, 'loss0': 100, 'avg1': 90280, 'worst1': 566000, 'loss1': 100, 'worstYear0': 81, 'worstYear1': 67}
break-even 1000 {'ALE': 88000, 'RES': 68000, 'COST': 20000, 'EXP': 88000, 'avg0': 83228, 'worst0': 1024000, 'loss0': 997, 'avg1': 87628, 'worst1': 566000, 'loss1': 997, 'worstYear0': 866, 'worstYear1': 67}
   per risk (ALE, residual, cost, net): {'laptop': (8000, 8000, 0, 0), 'fraud': (25000, 25000, 0, 0), 'ransom': (25000, 5000, 20000, 0), 'outage': (10000, 10000, 0, 0), 'portal': (20000, 20000, 0, 0)}
rare seed 1 {'avg0': 20000, 'worst0': 1000000, 'loss0': 2}
rare seed 2 {'avg0': 0, 'worst0': 0, 'loss0': 0}
rare seed 3 {'avg0': 20000, 'worst0': 1000000, 'loss0': 2}
rare seed 4 {'avg0': 10000, 'worst0': 1000000, 'loss0': 1}
rare seed 5 {'avg0': 10000, 'worst0': 1000000, 'loss0': 1}
```
