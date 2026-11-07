<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-roi-payback-npv: specification

Task `docs/tasks/w3/fin-roi-payback-npv.md`, catalogue `fin-roi-payback-npv` (§4.12, needs `fin-npv-discounting`).
Class **explorer**: the state is a pure function of the params (`sim.js` `compute`), no steps.

**One concept:** three yardsticks rank the same projects differently: simple ROI ignores timing, payback ignores
everything after the payback date, NPV depends on the rate; IRR is the rate at which NPV is zero.

**The contrast on the stage:** the same two projects (A, a quick win; B, a slow large return) read three ways, side by
side in one scoreboard (ROI, payback, NPV at the rate, and each one's IRR), above the two projects' cash flows (paired
bars per year, with each payback point marked) and the NPV profile (both NPVs against the rate from 0 to 30 %, with each
IRR where a curve crosses zero, the swap rate where the curves cross, and the current rate).

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `rate` | range, step 0.5 | 0–30 % (8) | the discount rate, per year (the cost of capital) |
| `years` | range, step 1 | 1–8 (5) | horizon: flows in years 0…`years` count, later ones are kept but ignored |
| `a0` … `a8`, `b0` … `b8` | hidden ranges, step 1 000 | −200 000…200 000 € (preset `quick-vs-slow`) | project A's / B's flow at the end of year t (year 0 = today); dragged on the stage, or ↑/↓ on a focused bar |

Out-of-range or non-numeric params (from a URL) are clamped by `normalise` (non-numbers, including an empty value,
become 0 for flows and the default for `rate`/`years`).

## Rules

All amounts are euros, computed in floating point; rounding only for display and for the comparisons (rule 8).

1. **Timing** (as `fin-npv-discounting`): year 0 is today, a flow in year t arrives at the end of year t.
2. **Discounting** is `discount.js`, copied unchanged from `sims/fin-npv-discounting/` @ b341da3: DF(t) = 1 / (1 + r)^t,
   PV = CF × DF, NPV = Σ PV. Its own rules and tests are that sim's; this sim keeps the copy's tests (COMMON.md §6).
3. **Horizon.** Every yardstick uses years 0…`years` of each project and ignores later flows, which stay in the params.
4. **Simple ROI** = (Σ CF) / (Σ |outflows|), over the horizon, nominal: the net gain on paper per euro put in. No
   outflow → no ROI (shown "—", not compared). (Standard definition "(gain − cost) / cost"; Brealey, Myers & Allen,
   *Principles of Corporate Finance*, ch. 5, "book rate of return" and other non-NPV measures *(check: they treat the
   accounting rate of return; the cash-flow form here is the usual business-case one)*.)
5. **Payback period** = the first time the cumulative nominal flow climbs from below zero to zero or above, interpolated
   inside that year: (t − 1) + (amount still owed at the end of year t − 1) / CF(t). Kinds: no outflow → "—" (nothing
   to pay back, not compared); never negative though there is an outflow → 0; still negative at the horizon →
   "never". A later outflow that pushes the cumulative back below zero is ignored, like everything after the payback
   date. (Brealey, Myers & Allen ch. 5, payback rule; the interpolation, which assumes the year's flow comes evenly
   through the year, is the common business-case convention *(check)*; NPV keeps end-of-year timing.)
6. **IRR** = the rate at which a project's NPV is zero. Search: NPV on the grid −90 %…100 % by 0.1 %, then to 1 000 % by
   1 %; a grid point where NPV is exactly 0, or a sign change between neighbours refined by bisection, is a root.
   Kinds: flows that never change sign → no IRR ("—"); one root → the IRR; several → "several" (non-conventional flows,
   e.g. an outflow at the end); a sign change but no root found → "none in −90…1000 %" (the IRR lies outside the
   range, or there is none at all: −100 000, 150 000, −100 000 has an NPV below zero at every rate, and a grid search
   cannot tell the two apart). By Descartes' rule of signs, flows with one sign change have at most one IRR above
   −100 %. Shown to 0.1 %.
7. **Swap rate** = the rate at which the two NPVs are equal: the roots of the NPV of B − A (year by year) in 0…30 %,
   grid step 0.05 %, same search as rule 6. It is the IRR of the difference (Fisher's intersection). Identical
   projects have none (equal everywhere). Who is ahead below the first and above the last swap is read at a rate
   halfway below / 0.5 % above it; a swap at 0 % (equal sums on paper) has no "below". A crossing under 1 % is shown
   to 0.01 % so a tiny one never reads "0 %", which is kept for the exact zero.
8. **Ranking** (each yardstick picks A, B, a tie, or nothing), with the **tie-breaks**:
   - ROI: higher wins, compared in tenths of a percent rounded half away from zero (`tenthsPct`, the same number the
     page shows, so two equal displays always tie); either without an outflow → nothing.
   - Payback: shorter wins, compared rounded to 0.1 year; "never" loses to any number, two "never" tie; either "—" →
     nothing.
   - NPV: higher wins; each NPV is rounded to the euro (half away from zero), as shown, and the rounded amounts are
     compared, so equal NPVs tie even with floating-point noise (`at-the-swap`: both 17 355.37…, exact difference 0)
     and the pick never contradicts the screen (−11 637 € against −11 637 € is a tie, 51 418 € against 51 419 € is not).
   - IRR is shown, not ranked: it is the rate where NPV = 0, not a fourth vote (out of scope: ranking by IRR).
   - **Agree** = ROI, payback and NPV all pick the same project (not a tie).
9. **Rounding for display:** money to the euro (half away from zero, −0 is 0), ROI and IRR to 0.1 %, payback to 0.1
   year.
10. **NPV profile:** both NPVs at 0, 0.5, … 30 %. At 0 % NPV is the sum on paper, so with equal investments the ROI
    ranking is the NPV ranking at 0 %.
11. **Changed mark:** when a param change flips a yardstick's pick, its "picks" cell is highlighted (`flipped`).
12. **Caption:** (a) all three agree ("all three pick X"); a yardstick picks a project and another picks the other one or
    ties ("the yardsticks disagree: …"; "cannot compare" does not count); otherwise (only ties, as for identical
    projects, or a single pick beside "cannot compare", as when one project is empty) the three picks without a verdict; (b) the swap: none (who is ahead at every rate from 0 to
    30 %), one (below it X, above it Y), at 0 %, more than one, or identical projects; (c) notes: a project's NPV is 0
    at the current rate (that rate is its IRR, or "one of its IRRs" when it has several); the NPVs tie at the rate (it
    is the crossover rate) when no IRR note applies. Both projects empty → "no flows yet".

## Presets (numbers checked with exact fractions by the script at the end)

| # | id | A (€, years 0…) | B (€, years 0…) | rate | ROI A / B | payback A / B (y) | NPV A / B | picks ROI · payback · NPV | IRR A / B | swap |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `quick-vs-slow` | −100k, 80k, 40k, 10k | −100k, 0, 20k, 40k, 60k, 60k | 8 % | 30 / 80 % | 1.5 / 3.7 | 16 306 / 33 837 | B · A · B | 20.2 / 16.7 % | 14.6 % (below B, above A) |
| 2 | `dear-money` | as 1 | as 1 | 18 % | 30 / 80 % | 1.5 / 3.7 | 2 610 / −4 117 | B · A · **A** | 20.2 / 16.7 % | 14.6 % |
| 3 | `same-total` | −100k, 50k, 40k, 30k, 20k, 10k | −100k, 10k, 20k, 30k, 40k, 50k | 8 % | 50 / 50 % | 2.3 / 4.0 | 25 911 / 13 651 | **tie** · A · A | 20.3 / 12.0 % | at 0 % (above A) |
| 4 | `after-payback` | −100k, 60k, 60k | −100k, 60k, 60k, 0, 0, 80k | 8 % | 20 / 100 % | 1.7 / 1.7 | 6 996 / 61 443 | B · **tie** · B | 13.1 / 31.9 % | none (B ahead everywhere) |
| 5 | `at-the-swap` | −100k, 120k, 10k | −100k, 20k, 10k, 121k (`years` 3) | 10 % | 30 / 51 % | 0.8 / 2.6 | 17 355 / 17 355 | B · A · **tie** | 27.8 / 17.0 % | 10.0 % exactly |
| 6 | `irr` | −100k, 110k | as 1 | 10 % | 10 / 80 % | 0.9 / 3.7 | **0** / 24 818 | B · A · B | **10.0** / 16.7 % | 19.2 % |

Lessons: 1, the three disagree; 2, the same projects at dearer money: NPV changes its pick, ROI and payback do not
(they ignore the rate); 3, same total, so ROI ties although A's money comes years earlier (ROI ignores timing); 4,
payback ties although B returns 80 000 € more in year 5 (payback ignores everything after); 5, the rate is the swap rate
(NPVs equal); 6, the rate is A's IRR (A's NPV is 0).

## Legend

Project A (solid bars, `--c1`, solid curve), project B (hatched bars, `--c2`, dashed curve), payback point (a ▼ marker
with the letter), the current rate (a vertical line), changed pick (highlight).

## Misconceptions targeted

- "Higher ROI, better project." (ROI ignores when the money comes: preset 3.)
- "Shortest payback is safest, so best." (Payback ignores what comes after: preset 4.)
- "NPV gives one answer." (It depends on the rate: presets 1 and 2, the profile.)
- "IRR is a different kind of number." (It is the rate where the NPV curve crosses zero: preset 6, the profile.)

## Out of scope

Ranking by IRR and its pitfalls with mutually exclusive projects of different size (the profile shows why, the page
does not rank), modified IRR, discounted payback, annualised ROI, profitability index, accounting (book) rate of return,
taxes, inflation, risk-adjusted rates, unequal project lives and replacement chains, more than two projects.

## Terms (hr / en)

povrat ulaganja (ROI) / return on investment; razdoblje povrata / payback period; neto sadašnja vrijednost (NSV) / net
present value (NPV); interna stopa povrata (ISP) / internal rate of return (IRR); diskontna stopa / discount rate;
trošak kapitala / cost of capital; novčani tok / cash flow; kumulativni novčani tok / cumulative cash flow; stopa
presjeka / crossover rate *(check)* (on the chart "presjek" / "crossing"; "swap" in the code); profil NSV-a / NPV
profile.

## Check script

Run with `python3` before coding; the preset test in `sim.test.js` asserts the same numbers.

```python
from fractions import Fraction as F
def npv(cf, r):
    r = F(r); return sum(F(c) / (1 + r) ** t for t, c in enumerate(cf))
def roi(cf):
    inv = -sum(c for c in cf if c < 0); return F(sum(cf), inv)
def payback(cf):
    c = 0
    for t, x in enumerate(cf):
        prev = c; c += x
        if prev < 0 and c >= 0: return (t - 1) + F(-prev, x)
def root(cf, lo, hi):            # bisection in exact fractions on a bracket with a sign change
    lo, hi = F(lo), F(hi)
    for _ in range(60):
        m = (lo + hi) / 2
        if (npv(cf, m) > 0) == (npv(cf, lo) > 0): lo = m
        else: hi = m
    return float(lo)
Q, S = [-100000, 80000, 40000, 10000, 0, 0], [-100000, 0, 20000, 40000, 60000, 60000]
E = [-100000, 50000, 40000, 30000, 20000, 10000]
cases = {
 'quick-vs-slow': (Q, S, '0.08'),
 'dear-money':    (Q, S, '0.18'),
 'same-total':    (E, [E[0]] + E[1:][::-1], '0.08'),
 'after-payback': ([-100000, 60000, 60000, 0, 0, 0], [-100000, 60000, 60000, 0, 0, 80000], '0.08'),
 'at-the-swap':   ([-100000, 120000, 10000, 0], [-100000, 20000, 10000, 121000], '0.10'),
 'irr':           ([-100000, 110000, 0, 0, 0, 0], S, '0.10'),
}
for k, (a, b, r) in cases.items():
    d = [y - x for x, y in zip(a, b)]
    irr_a, irr_b = root(a, 0, 1), root(b, 0, 1)
    sw = 'none' if all(x >= 0 for x in d) else (0.0 if npv(d, 0) == 0 else root(d, '0.0001', '0.30'))
    print(k, float(roi(a)), float(roi(b)), float(payback(a)), float(payback(b)),
          float(npv(a, r)), float(npv(b, r)), irr_a, irr_b, sw)
# quick-vs-slow  ROI 30.0/80.0%  payback 1.5000/3.6667  NPV@8%  16305.9493/33836.8490  IRR 20.1994/16.6760%  swap 14.6172%
# dear-money     ROI 30.0/80.0%  payback 1.5000/3.6667  NPV@18%  2610.2961/-4117.1910  IRR 20.1994/16.6760%  swap 14.6172%
# same-total     ROI 50.0/50.0%  payback 2.3333/4.0000  NPV@8%  25911.2454/13651.3569  IRR 20.2720/12.0058%  swap 0.0000%
# after-payback  ROI 20.0/100.0% payback 1.6667/1.6667  NPV@8%   6995.8848/61442.5405  IRR 13.0662/31.9092%  swap none
# at-the-swap    ROI 30.0/51.0%  payback 0.8333/2.5785  NPV@10% 17355.3719/17355.3719  IRR 27.8233/16.9765%  swap 10.0000%
# irr            ROI 10.0/80.0%  payback 0.9091/3.6667  NPV@10%      0.0000/24817.6044  IRR 10.0000/16.6760%  swap 19.2305%
```
