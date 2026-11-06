<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-npv-discounting: specification

Task `docs/tasks/w3/fin-npv-discounting.md`, catalogue `fin-npv-discounting` (§4.12, overlap §5.23). Class
**explorer**: the state is a pure function of the params (`sim.js` `compute`), no steps.

**One concept:** a euro next year is worth less than a euro today; the discount rate is the cost of capital (what the
money would earn or cost elsewhere); NPV sums the discounted cash flows.

**The contrast on the stage:** each year's cash flow seen two ways, nominal (an outlined bar, what the invoice or
the saving says) and discounted (a filled bar inside it, what it is worth today), and the two sums: on paper (Σ
nominal) and the NPV.

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `rate` | range, step 0.5 | 0–20 % (8) | the discount rate, per year, = the cost of capital |
| `years` | range, step 1 | 1–10 (5) | horizon: flows in years 0…`years` count, later ones are kept but ignored |
| `cf0` … `cf10` | hidden ranges, step 1 000 | −200 000…200 000 € (the `upgrade` flows in cf0…cf5, 0 after) | the cash flow at the end of year t (year 0 = today); dragged on the stage, or ↑/↓ on a focused bar |

Defaults: the `upgrade` preset's flows (−120 000, then 35 000 a year for 5 years) at 8 %. Out-of-range or non-numeric
params (from a URL) are clamped by `normalise` (non-numbers become 0 for flows, the default for `rate`/`years`).

## Rules

All amounts are euros. Computation is in floating point; rounding happens only for display and for the sign
(rule 5).

1. **Timing.** Year 0 is today; a flow in year t (t ≥ 1) arrives at the end of year t. (Standard end-of-period
   convention: Brealey, Myers & Allen, *Principles of Corporate Finance*, ch. 2; any corporate-finance textbook.)
2. **Discount factor** DF(t) = 1 / (1 + r)^t, r = `rate` / 100. DF(0) = 1 for every r; DF(t) = 1 for every t when
   r = 0; DF falls with t and with r. At 8 %: DF(1) = 0.926, DF(5) = 0.681, DF(10) = 0.463. At 15 %: DF(5) = 0.497.
3. **Present value** of year t: PV(t) = CF(t) × DF(t). The sign of PV equals the sign of CF; |PV| ≤ |CF|.
4. **NPV** = Σ PV(t) for t = 0…`years`; the **nominal sum** = Σ CF(t) over the same years. Flows after `years` are
   ignored by both. At r = 0, NPV = nominal sum.
5. **Sign (tie-break).** NPV is rounded to the euro, half away from zero (−2 674.57 → −2 675, 0.5 → 1, −0.5 → −1),
   and −0 is 0. The sign of the rounded NPV is the verdict: > 0 the project earns more than the money would elsewhere
   at r, < 0 less, = 0 exactly as much. So floating-point noise (108 000 × (1 / 1.08) = 99 999.999…99, a raw NPV of −1.5e-11) never flips the
   verdict. The same rounding gives the nominal sum's sign.
6. **Display rounding.** Each year's PV is shown rounded to the euro; the NPV is the rounded *exact* sum, so the
   shown PVs may add up to a euro or two away from the shown NPV (the usual spreadsheet behaviour, kept on
   purpose). DF is shown to three decimals.
7. **"A euro later"**: the tile shows DF(`years`), the value today of 1 € received at the end of the horizon.
8. **Changed mark.** When a param change flips the NPV sign (rule 5) the NPV tile is marked changed (`flipped`).
9. **Mirror** (button, key M): reverses the flows of years 1…`years` (year 0 and years after the horizon stay). The
   nominal sum is unchanged; the NPV generally is not.

## Presets (expected numbers checked with exact fractions by the script at the end of this file)

| # | id | flows (€), years 0…n | rate | Σ nominal | NPV | verdict |
|---|---|---|---|---|---|---|
| 1 | `euro-later` | 0, 0, 0, 0, 0, 100 000 | 8 % | +100 000 | +68 058 (DF(5) = 0.681) | > 0 |
| 2 | `upgrade` | −120 000, 35 000 × 5 | 8 % | +55 000 | +19 745 | > 0 |
| 3 | `dear-money` | as `upgrade` | 15 % | +55 000 | −2 675 | < 0: positive on paper, negative today |
| 4 | `just-the-rate` | −100 000, 108 000 (`years` 1) | 8 % | +8 000 | 0 | = 0 (rule 5 tie-break) |
| 5 | `late-payoff` | −100 000, 10 000, 20 000, 30 000, 40 000, 50 000 | 8 % | +50 000 | +13 651 | > 0 |
| 6 | `early-payoff` | −100 000, 50 000, 40 000, 30 000, 20 000, 10 000 | 8 % | +50 000 | +25 911 | > 0 (mirror of 5) |

Also: `upgrade` at 0 % → NPV = 55 000 (rule 4); `upgrade`'s NPV changes sign between 14.0 % and 14.5 % (exact
crossing 14.05 %; the rate where NPV = 0 is the IRR, which `fin-roi-payback-npv` names, not this page).

## Legend

Nominal flow (outlined bar, `--c1`), discounted value today (filled bar, `--c2`), inflow above the zero line /
outflow below (position and sign), changed (highlight).

## Captions (built from the state)

One sentence on the rate ("At 8 %, 1 € at the end of year 5 is worth 0.68 € today"), one on the two sums, one on
the verdict (> 0 / < 0 / = 0). Extra notes: rate 0 ("nothing is discounted: NPV = the sum on paper"); positive on
paper but NPV < 0 ("time ate the gain"); no flows at all.

## Misconceptions targeted

- "The project returns 55 000 € more than it costs, so it pays." (Σ nominal vs NPV; preset 3.)
- "The discount rate is inflation." (It is what the money would earn or cost elsewhere; explanation.)
- "Same total, same value." (Presets 5 and 6, mirror button.)
- "NPV = 0 means a loss." (Preset 4: it earns exactly the cost of capital.)

## Out of scope

IRR and payback (`fin-roi-payback-npv`), inflation and real vs nominal rates (`fin-indexation-fx`), taxes,
mid-year or monthly timing, how the cost of capital is set (WACC, risk premium), annuity formulas, continuous
compounding, negative rates.

## Terms (hr / en)

novčani tok / cash flow; diskontna stopa / discount rate; trošak kapitala / cost of capital; diskontni faktor /
discount factor; sadašnja vrijednost / present value; neto sadašnja vrijednost (NSV) / net present value (NPV);
nominalni iznos / nominal amount; vremenska vrijednost novca / time value of money.

## Check script

The expected numbers above were computed before coding with exact fractions (no floating point), then compared with
`sim.js` (the preset test in `sim.test.js`). Run with `python3`:

```python
from fractions import Fraction as F
def npv(cf, r):
    r = F(r)
    return sum(F(c) / (1 + r) ** t for t, c in enumerate(cf))
cases = {
    'euro-later':    ([0, 0, 0, 0, 0, 100000], '0.08'),
    'upgrade':       ([-120000] + [35000] * 5, '0.08'),
    'dear-money':    ([-120000] + [35000] * 5, '0.15'),
    'just-the-rate': ([-100000, 108000], '0.08'),
    'late-payoff':   ([-100000, 10000, 20000, 30000, 40000, 50000], '0.08'),
    'early-payoff':  ([-100000, 50000, 40000, 30000, 20000, 10000], '0.08'),
    'upgrade at 0':  ([-120000] + [35000] * 5, '0'),
}
for k, (cf, r) in cases.items():
    v = npv(cf, r)
    print(f"{k:14} sum={sum(cf):>8} npv={float(v):12.4f}")
# euro-later 100000 68058.3197 · upgrade 55000 19744.8513 · dear-money 55000 -2674.5716
# just-the-rate 8000 0.0000 · late-payoff 50000 13651.3569 · early-payoff 50000 25911.2454 · upgrade at 0 55000
```
