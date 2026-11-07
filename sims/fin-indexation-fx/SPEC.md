<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-indexation-fx: specification

Task `docs/tasks/w3/fin-indexation-fx.md`, catalogue `fin-indexation-fx` (§4.12).
Class **explorer**: the state is a pure function of the params (`sim.js` `compute`), no steps.

**One concept:** a fixed price loses real value to inflation; an indexation clause passes inflation on (with a cap or
a floor); a price in a foreign currency adds exchange-rate risk; nominal vs real euros.

**The contrast on the stage:** one five-year contract (100 000 € a year at signing), each yearly payment seen two
ways: **euros paid** (nominal) and **what they are worth in signing-day euros** (real). On top, the three kinds of
price (fixed, fully indexed, indexed with a cap and a floor) side by side on the same inflation and exchange-rate
paths; the student picks the one the chart shows, and the currency.

The view is the buyer's (the IT manager pays the contract); the vendor's is its mirror (what the buyer saves in real
terms, the vendor loses).

## Params

| key | control | values (default) | notes |
|---|---|---|---|
| `clause` | the board's row names | `fixed`, `indexed`, `capped` (`fixed`) | the kind of price the chart and caption show; the board shows all three |
| `cur` | stage buttons | `eur`, `usd` (`eur`) | the currency the price is set in |
| `fx` | stage buttons, only in dollars | `flat`, `eurWeak`, `eurStrong`, `swings` (`flat`) | the exchange-rate path |
| `infl` | panel, segmented | `steady`, `spike`, `low` (`steady`) | the inflation path |
| `premium` | range, step 0.5 | 0–15 % (4) | what the vendor adds for a fixed price |
| `cap` | range, step 0.5 | 0–10 % (3) | the highest yearly rise of the capped clause |
| `floor` | range, step 0.5 | −3–3 % (0) | the lowest yearly change of the capped clause |

Out-of-range or non-numeric numbers (from a URL) are clamped and snapped by `normalise`; junk takes the default;
a choice not in its list takes the default.

**Paths** (illustrative, made up but plausible):

| path | values |
|---|---|
| inflation `steady` | 2, 2, 2, 2 % (years 1–4) |
| inflation `spike` | 3, 9, 6, 3 % |
| inflation `low` | 1, 0, −1, 1 % |
| € per USD `flat` | 0.80 at every payment |
| € per USD `eurWeak` | 0.80, 0.84, 0.88, 0.92, 0.96 (payments 1–5) |
| € per USD `eurStrong` | 0.80, 0.77, 0.74, 0.72, 0.70 |
| € per USD `swings` | 0.80, 0.90, 0.76, 0.92, 0.82 |

The fifth year's inflation falls after the last payment and changes nothing, so a path has four values.

## Rules

Amounts in euros, computed in floating point; rounding only for display and for the ranking (rule 9). Rates are
kept in percent as given (2 means 2 %) until they multiply, so comparisons with the cap and floor never meet
floating-point noise.

1. **Contract.** Five yearly payments, each due at the start of its contract year (yearly in advance, a common
   billing for support and subscriptions). The price at signing is P = 100 000 € a year; in dollars it is set at the
   signing rate, P / 0.80 = 125 000 USD, so both currencies start at the same euros.
2. **Price level.** L₁ = 1 at signing; L_y = L_{y−1} · (1 + i_{y−1} / 100), with i_k the inflation during year k. L_y is
   the price level at payment y against signing (shown ×100: "prices 104.0").
3. **Fixed price.** The price in the contract currency is P_c · (1 + premium / 100) every year (P_c = P or 125 000
   USD). A vendor who carries the inflation risk prices it in; the premium is that price *(the size is illustrative)*.
4. **Fully indexed.** At each anniversary the price changes by the past year's inflation: f₁ = 1,
   f_y = f_{y−1} · (1 + i_{y−1} / 100), so f_y = L_y. **Both ways**: a negative inflation lowers the price.
   (Indexation clause to a named price index, applied yearly on the anniversary: common contract practice; in the
   euro area the index is usually a consumer price index, HICP or the national CPI *(check: not on the page)*.)
5. **Indexed with a cap and floor.** The same, with each yearly change clamped: a_y = min(cap, max(floor′, i_{y−1})),
   f_y = f_{y−1} · (1 + a_y / 100). floor′ = min(floor, cap): **a floor above the cap is lowered to the cap**
   (tie-break). The change is **held by the cap** when i > cap, **by the floor** when i < floor′; **equal to a bound
   is inside it** (tie-break: 3 % inflation under a 3 % cap passes and is not counted as held). The premium does not
   apply. The floor sets the smallest yearly change; it may be above 0, so it can hold a change up while prices still
   rise. (Caps and floors on indexation, "collars": common contract practice.)
6. **Nominal euros.** Payment y in euros N_y = P_c · f_y · x_y, with x_y the euros per contract-currency unit at
   payment y (1 for a euro contract; the `fx` path in dollars).
7. **Real euros.** R_y = N_y / L_y, payment y in signing-day euros (deflating by the price level: any macroeconomics
   or corporate-finance text, e.g. Brealey, Myers & Allen, *Principles of Corporate Finance*, the chapter on
   inflation and the discount rate, "nominal vs real cash flows"). Totals: N = Σ N_y, R = Σ R_y; at the signing price
   the five payments are 5 · P = 500 000 € in either view. A dollar contract's index and the euro deflator follow the
   **same** inflation path (a simplification: in practice a dollar contract is indexed to a dollar price index;
   here only the exchange rate differs, so the currency's own effect is visible).
8. **Exchange-rate effect** of a clause = N − Σ P_c · f_y · x₁: the nominal total against every payment at the
   signing rate. 0 in euros and on the flat path.
9. **Ranking.** In each of the two totals (paid, worth), the clauses whose total **rounded to the euro** equals the
   lowest are ticked "least for the buyer"; **every** clause at that lowest is ticked, and **none** when all three are
   equal (tie-breaks).
10. **Captions.** Main (`capMain`): the chosen clause, its nominal total, its real total, and 500 000 € at the
    signing price. Then at most two notes, in order: the clause's (fixed in euros: the price stays, the fifth payment
    is worth R₅, and inflation moves value from vendor to buyer (`nFixed`), or, when the fixed real total rounded is
    **above** the indexed one, the premium outweighed the inflation and the buyer pays the difference more
    (`nFixedDearer`; equal is not above); fixed in dollars: the payments in euros run from min to max (`nFixedUsd`), or,
    when they are all equal rounded (flat rate), "fixed in euros only while the rate stays put" (`nFixedUsdFlat`); indexed: every payment is worth P; indexed in
    dollars: the euros also follow the rate; capped: what held it, with the count of anniversaries and the difference
    against full indexation, or "stayed between the bounds" when neither held), then in dollars the exchange-rate
    effect (added, saved, or none when it rounds to 0).
11. **Display.** Euros rounded to the euro (half away from zero, never −0); price level ×100 with one decimal; the
    exchange rate with two decimals; percentages with the decimals they need.

## Presets (expected numbers checked with 50-digit decimals by the script at the end of this file)

All: premium 4 %, cap 3 %, floor 0 %, unless stated. Totals: paid (nominal) / worth (real), rounded to the euro.

| # | id | chosen | path | fixed | indexed | capped | what it shows |
|---|---|---|---|---|---|---|---|
| 1 | `fixed-steady` (default) | fixed | steady, € | 520 000 / 500 004 | 520 404 / 500 000 | 520 404 / 500 000 | the fixed 104 000 € is worth 96 080 € by year 5; a 4 % premium about matches 2 % a year |
| 2 | `indexed-spike` | indexed | spike, € | 520 000 / 469 840 | 556 853 / 500 000 | 530 914 / 478 137 | indexation passes the spike on: real 100 000 € every year, year 5 pays 122 576 € |
| 3 | `capped-spike` | capped | spike, € | (as 2) | (as 2) | (as 2) | cap held at 2 anniversaries (9 and 6 %), not at the 3 % ones; −25 939 € against full indexation |
| 4 | `floor-low` | capped | low, € | 520 000 / 516 932 | 502 980 / 500 000 | 505 010 / 502 020 | the indexed price falls in year 4 (−1 %); the floor holds it: +2 030 € against full indexation |
| 5 | `usd-euro-weak` | fixed | steady, USD, euro weakens | 572 000 / 549 014 | 573 475 / 550 000 | 573 475 / 550 000 | a fixed 130 000 USD costs 104 000 € to 124 800 €; the rate adds 52 000 € |
| 6 | `usd-euro-strong` | fixed | spike, USD, euro strengthens | 484 900 / 439 762 | 517 347 / 466 250 | 494 098 / 446 641 | the rate can help: −35 100 € for fixed |

Caption notes (rule 10): preset 1 `nFixedDearer` (4 € more), 2 `nIndexed`, 3 `nCap`, 4 `nFloor`, 5 `nFixedUsd` +
`nFxUp`, 6 `nFixedUsd` + `nFxDown`. The `swings` path, fixed in dollars: 104 000, 117 000, 98 800, 119 600, 106 600,
the rate adds 26 000 €.

Ticks (rule 9): preset 1 paid fixed, worth indexed and capped (tie); presets 2, 3, 5, 6 fixed in both; preset 4
indexed in both. Preset 1, fixed, real by year: 104 000, 101 961, 99 962, 98 002, 96 080. Preset 3, capped,
nominal: 100 000, 103 000, 106 090, 109 273, 112 551. Preset 5, fixed, nominal: 104 000, 109 200, 114 400, 119 600,
124 800.

## Legend

Paid (nominal euros: ●, solid line, `--c1`), worth (signing-day euros: ■, dashed line, `--c2`), the price at signing
(dotted line, `--muted`, 100 000 € in the label). On the board, ✓ on a green cell marks the least for the buyer; the
chosen clause is the outlined row with ●. Under each year: the price level and the past year's inflation, "cap: +3 %"
or "floor: 0 %" with ⊣ when a bound held, and the exchange rate in dollars.

## Misconceptions targeted

- "A fixed price is fixed." (Preset 1: fixed in euros, it is worth less every year; preset 5: fixed in dollars, it is
  not even fixed in euros.)
- "Indexation makes the contract dearer." (Preset 2: in real terms it costs exactly the signing price; the buyer
  carries the risk instead of the vendor, who would charge a premium for it.)
- "A cap is always good for the buyer, a floor always costs." (Presets 3 and 4: each only bites when inflation
  leaves its band; a floor costs only when inflation falls below it.)
- "Currency risk only hurts." (Presets 5 and 6: the rate can go either way; the budget cannot know which.)

## Out of scope

Discounting the payments (the time value of money is `fin-npv-discounting`; real euros here only remove inflation);
taxes and VAT; a separate foreign price index (one path, rule 7); hedging the currency (forwards, options);
indexation lags beyond one year and index publication dates; monthly billing; the vendor's own costs.

## Terms (hr / en)

inflacija / inflation; razina cijena / price level; indeks cijena / price index; klauzula o indeksaciji (indeksacija)
/ indexation clause; fiksna cijena / fixed price; premija / premium; gornja granica / cap; donja granica / floor;
nominalni euri / nominal euros; realni euri, euri s dana potpisa / real euros, signing-day euros; tečaj / exchange
rate; tečajni rizik / exchange-rate (currency) risk; strana valuta / foreign currency; godišnjica / anniversary.

## Check script

The expected numbers above were computed before coding with 50-digit decimals, then compared with `sim.js` (the
preset test in `sim.test.js`). Run with `python3`:

```python
from decimal import Decimal as D, getcontext
getcontext().prec = 50
P0 = D(100000); R0 = D('0.80')
INFL = {'steady': [2, 2, 2, 2], 'spike': [3, 9, 6, 3], 'low': [1, 0, -1, 1]}
FX = {'flat': ['0.80'] * 5, 'eurWeak': ['0.80', '0.84', '0.88', '0.92', '0.96'],
      'eurStrong': ['0.80', '0.77', '0.74', '0.72', '0.70'], 'swings': ['0.80', '0.90', '0.76', '0.92', '0.82']}
def run(clause, cur, infl, fx, cap=3, floor=0, prem=4):
    i = [D(x) / 100 for x in INFL[infl]]; floor = min(floor, cap)
    L = [D(1)]; f = [D(1)]
    for k in range(4):
        L.append(L[-1] * (1 + i[k]))
        if clause == 'indexed': f.append(f[-1] * (1 + i[k]))
        elif clause == 'capped': f.append(f[-1] * (1 + D(min(cap, max(floor, INFL[infl][k]))) / 100))
    if clause == 'fixed': f = [1 + D(prem) / 100] * 5
    rate = [D(x) for x in FX[fx]] if cur == 'usd' else [D(1)] * 5
    base = P0 / R0 if cur == 'usd' else P0
    N = [base * f[y] * rate[y] for y in range(5)]
    R = [N[y] / L[y] for y in range(5)]
    return N, R, sum(N), sum(R), sum(N) - sum(base * f[y] * rate[0] for y in range(5))
cases = {'fixed-steady': dict(cur='eur', infl='steady', fx='flat'), 'indexed-spike': dict(cur='eur', infl='spike', fx='flat'),
         'floor-low': dict(cur='eur', infl='low', fx='flat'), 'usd-euro-weak': dict(cur='usd', infl='steady', fx='eurWeak'),
         'usd-euro-strong': dict(cur='usd', infl='spike', fx='eurStrong')}
for k, o in cases.items():
    for c in ['fixed', 'indexed', 'capped']:
        N, R, n, r, fx = run(c, **o)
        print(k, c, [round(x) for x in N], [round(x) for x in R], f"{n:.2f} / {r:.2f}", f"fx {fx:.2f}")
# fixed-steady    fixed   520000.00 / 500003.78   indexed 520404.02 / 500000.00   capped 520404.02 / 500000.00
# indexed-spike   fixed   520000.00 / 469840.16   indexed 556852.59 / 500000.00   capped 530913.58 / 478137.44
# floor-low       fixed   520000.00 / 516931.59   indexed 502979.90 / 500000.00   capped 505010.00 / 502020.20
# usd-euro-weak   fixed   572000.00 / 549014.19   indexed 573474.78 / 550000.00   capped 573474.78 / 550000.00  fx +52000.00 (fixed)
# usd-euro-strong fixed   484900.00 / 439761.54   indexed 517347.17 / 466250.00   capped 494098.20 / 446640.56  fx −35100.00 (fixed)
```
