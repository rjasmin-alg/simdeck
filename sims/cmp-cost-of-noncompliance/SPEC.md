<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-cost-of-noncompliance: specification

Explorer (task `docs/tasks/w3/cmp-cost-of-noncompliance.md`, catalogue `cmp-cost-of-noncompliance` §4.13). One
concept: the fine ceiling is the higher of a fixed sum and a share of worldwide yearly turnover (GDPR up to €20 million
or 4 %; NIS2 at least €10 million or 2 % for essential entities and €7 million or 1.4 % for important ones), so for a
large firm the percentage decides and for a small one the fixed sum; the expected yearly cost is incident likelihood ×
(incident cost + chance of a fine × fine), to compare with what the controls cost each year; under NIS2 the
management body is answerable for the measures.

Code: `fines.js` (rules 1–6, pure and wordless, promotable to `models/`), `sim.js` (params, presets, the comparison
across the three regimes, the caption), the page `index.html`, words in `strings.js`. Tests: `sim.test.js`.
Everything except the legal ceilings is illustrative: a made-up firm, made-up likelihoods, incident costs, chances of a
fine and control prices; the page says so once, and that it simplifies and is not legal advice.

## State and what a change does

An explorer: no steps. The state is a pure function of the params (`compute`). The student sets the firm's worldwide
yearly turnover, the regime (GDPR, NIS2 essential entity, NIS2 important entity), the incident likelihood, the cost of
one incident, the chance that an incident ends in a fine, how big the fine is as a share of the ceiling, the yearly
price of the measures and the share of incidents they prevent. Every change recomputes the state. The panel holds the
task's four inputs (turnover, regime, likelihood, price of the measures); the four assumptions (incident cost, chance of
a fine, fine share, effect) are drop-downs on the stage beside the costs they drive, kept in the URL as hidden params
(the panel would not fit one screen with all eight).

## Rules

1. **The three regimes** (the legal values; the only numbers on the page that are not illustrative):

   | id | regime | fixed sum F | share of turnover r | source |
   |---|---|---|---|---|
   | `gdpr` | GDPR, the higher tier | 20 000 000 € | 4 % | Regulation (EU) 2016/679, art. 83(5) (and 83(6)) |
   | `ess` | NIS2, essential entity | 10 000 000 € | 2 % | Directive (EU) 2022/2555, art. 34(4) |
   | `imp` | NIS2, important entity | 7 000 000 € | 1.4 % | Directive (EU) 2022/2555, art. 34(5) |

   r is held in per mille (40, 20, 14) so all arithmetic is in whole numbers. GDPR art. 83(5): "up to 20 000 000 EUR,
   or in the case of an undertaking, up to 4 % of the total worldwide annual turnover of the preceding financial year,
   whichever is higher". NIS2 art. 34(4)/(5): Member States ensure a *maximum of at least* 10 000 000 EUR or 2 % (7 000 000
   EUR or 1.4 %) "of the total worldwide annual turnover in the preceding financial year of the undertaking to which the
   essential (important) entity belongs, whichever is higher". So for NIS2 the values are the minimum ceiling national
   law must allow; the page says so in the explanation and uses the directive's values.
2. **The ceiling.** Turnover T is in whole millions of euros. The share part is P = T × 10⁶ × r / 1000 = T × r × 1000 €.
   The ceiling is C = max(F, P). What decides: `fixed` when F > P, `pct` when P > F, `equal` when F = P (tie-break: the
   page says both give the same). The crossover turnover is F × 1000 / r = 500 M€ for all three regimes (20 M / 4 %,
   10 M / 2 %, 7 M / 1.4 %): below it the fixed sum decides, above it the percentage. The ceiling as a share of the
   turnover is C / (T × 10⁶); above 1 the ceiling is more than a whole year's turnover.
3. **The fine.** The fine the authority sets is k % of the ceiling, k ∈ {10, 25, 50, 100}: fine = hup(C × k, 100)
   (whole euros, halves up; C is a multiple of 1000 so this is exact). Real fines are set case by case and must be
   proportionate (GDPR art. 83(1)–(2), NIS2 art. 34(1)); k is the student's guess, 100 % the worst case.
4. **Expected yearly cost without the measures** (the expected-loss model of `fin-ale-risk`, ALE = loss × frequency,
   with the fine as a second loss that follows only some incidents): likelihood p % a year (p ∈ 1…60), cost of one
   incident I, chance of a fine q % (q ∈ 0…100):
   - incidents part `inc0` = hup(p × I, 100)
   - fines part `fin0` = hup(p × q × fine, 10 000)
   - total `e0` = inc0 + fin0 (the parts are rounded, the total is their sum, so the bar adds up).
5. **With the measures.** They prevent eff % of incidents (eff ∈ {25, 50, 75}), so the likelihood is
   p × (100 − eff) / 100; and with the measures in place and documented an incident that still happens ends in a fine a
   quarter as often (q / 4: the fine sanctions mainly the missing measures, GDPR art. 32, NIS2 art. 21, and late
   reporting, GDPR art. 33, NIS2 art. 23, not the incident itself; the quarter is illustrative and fixed). They cost `spend` € a year.
   - incidents part `inc1` = hup(p × (100 − eff) × I, 10 000)
   - fines part `fin1` = hup(p × (100 − eff) × q × fine, 4 000 000)
   - `e1` = inc1 + fin1; total with the measures `t1` = e1 + spend.
6. **The verdict** (fin-ale-risk rule 1a): `saved` = e0 − e1, `net` = saved − spend. `worth` when net > 0,
   `even` when net = 0 (tie-break: exactly paying for itself is break-even, not worth it), `not` when net < 0.
   The break-even price is `saved`.
7. **The fine dominates** when fin0 > inc0 (strict; equal is not).
8. **Comparison across regimes** (sim.js): for the same turnover and fine share, the three regimes' F, P, C, what
   decides, and fine; the chosen regime marked.
9. **Params** (a URL may carry anything): `turn` one of 2, 10, 50, 100, 250, 500, 1000, 2500 (M€); `law` one of
   gdpr, ess, imp; `inc` one of 50 000, 100 000, 250 000, 500 000, 1 000 000, 2 500 000, 5 000 000; `spend` one of
   0, 25 000, 50 000, 100 000, 250 000, 500 000, 1 000 000, 2 500 000; `k` one of 10, 25, 50, 100; `eff` one of 25, 50,
   75; all by exact string match, anything else → the default (preset 1). `p` a number (a numeric string counts),
   rounded and clamped to 1…60; `q` rounded to a multiple of 5 and clamped to 0…100; blank, whitespace, null,
   non-numeric or infinite → the default.
10. **Caption.** Sentence 1 by what decides (`capFixed`, `capPct`, `capEqual`): F, r × T, the ceiling and its share of
    the turnover. Sentence 2 by the verdict (`capWorth`, `capEven`, `capNot`): e0, the measures' price, e1 + spend and
    the net. Then at most one note, in this order: the measures are a legal duty (verdict `even` or `not`;
    `nDutyNis2` for ess/imp, `nDutyGdpr` for gdpr); the ceiling is more than a year's turnover (C > T × 10⁶,
    `nOverTurnover`); the fine dominates (rule 7, `nFine`).
11. **Who answers** (on the stage, by regime, not part of the arithmetic): NIS2: the management body approves the
    measures, oversees them and can be held liable (art. 20(1)), takes training (art. 20(2)); for an essential entity a
    person at chief-executive level can be temporarily barred from managerial functions when earlier enforcement has failed (art. 32(5)(b)). GDPR: the
    controller (voditelj obrade) answers for appropriate measures (art. 24, 32) and is fined.

## Presets

Common to all unless stated: eff 50. Five presets (the task asks 3–6).

| # | id | turn | law | p | I | q | k | spend | P | C (decides) | C / T | fine | inc0 | fin0 | e0 | inc1 | fin1 | t1 | net (verdict) | note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `small-fixed` | 10 | imp | 20 | 250 000 | 40 | 25 | 100 000 | 140 000 | 7 000 000 (fixed) | 70 % | 1 750 000 | 50 000 | 140 000 | 190 000 | 25 000 | 17 500 | 142 500 | +47 500 (worth) | fine dominates |
| 2 | `large-pct` | 2500 | gdpr | 10 | 2 500 000 | 20 | 10 | 250 000 | 100 000 000 | 100 000 000 (pct) | 4 % | 10 000 000 | 250 000 | 200 000 | 450 000 | 125 000 | 25 000 | 400 000 | +50 000 (worth) | – |
| 3 | `crossover` | 500 | ess | 10 | 1 000 000 | 20 | 10 | 50 000 | 10 000 000 | 10 000 000 (equal) | 2 % | 1 000 000 | 100 000 | 20 000 | 120 000 | 50 000 | 2 500 | 102 500 | +17 500 (worth) | – |
| 4 | `tiny-firm` | 2 | imp | 5 | 100 000 | 20 | 10 | 50 000 | 28 000 | 7 000 000 (fixed) | 350 % | 700 000 | 5 000 | 7 000 | 12 000 | 2 500 | 875 | 53 375 | −41 375 (not) | duty (NIS2) |
| 5 | `break-even` | 50 | gdpr | 10 | 250 000 | 20 | 25 | 100 000 | 2 000 000 | 20 000 000 (fixed) | 40 % | 5 000 000 | 25 000 | 100 000 | 125 000 | 12 500 | 12 500 | 125 000 | 0 (even) | duty (GDPR) |

A further checked case, not a preset (it was one until the panel had to fit one screen): `fine-heavy`, turn 100, ess,
p 30, I 100 000, q 50, k 25, spend 250 000: P 2 000 000, C 10 000 000 (fixed), C / T 10 %, fine 2 500 000, inc0 30 000,
fin0 375 000, e0 405 000, inc1 15 000, fin1 46 875, t1 311 875, net +93 125 (worth), note fine dominates.

Comparison across regimes (rule 8) for preset 1 (10 M€, k 25 %): GDPR F 20 000 000, P 400 000, C 20 000 000 fixed,
fine 5 000 000; essential 10 000 000, 200 000, 10 000 000 fixed, 2 500 000; important 7 000 000, 140 000, 7 000 000
fixed, 1 750 000. For preset 2 (2500 M€, k 10 %): GDPR 100 000 000 pct, fine 10 000 000; essential P 50 000 000,
C 50 000 000 pct, 5 000 000; important P 35 000 000, C 35 000 000 pct, 3 500 000. For preset 3 (500 M€): all three
equal (20 000 000, 10 000 000, 7 000 000).

Tie-breaks covered by presets and tests: equal ceiling parts (`crossover`), net exactly 0 (`break-even`), fin0 = inc0
(not "fine dominates": p 10, I 100 000, q 20, fine 500 000 → 10 000 and 10 000), C exactly equal to the turnover (not
"more than a year's turnover": turn 10, `ess` gives C = 10 000 000 = the turnover, share exactly 1).

## Out of scope

- Which entities are essential or important (`cmp-nis2-scope`); the incident clocks (`cmp-incident-clocks`).
- The rare bad year behind the average (`fin-ale-risk` simulates it).
- GDPR's lower tier (art. 83(4): 10 000 000 € or 2 %) is named in the explanation only.
- National fine amounts of the Zakon o kibernetičkoj sigurnosti (NN 14/2024) and fines for public bodies: not on the
  page (`NOTES.md`, For the owner).
- Fines on members of the management body personally; damages claims (GDPR art. 82); periodic penalty payments.

## Misconceptions targeted

- "The fine is 4 % of turnover": for most firms (under 500 M€) the fixed sum decides, and it can be more than their
  whole turnover.
- "The fine is the ceiling": the fine is set case by case; the ceiling is only the upper bound (k).
- "The fine is for the incident": the fine sanctions mainly missing measures (and late reporting), so measures in place cut the chance of a fine.
- "If the measures do not pay on average we can skip them": they are a legal duty (GDPR art. 32, NIS2 art. 21), and
  under NIS2 the management body answers for them.

## Check script

Independent re-implementation from the text above (Python, exact fractions):

```python
from fractions import Fraction as Fr
import math
LAW = {'gdpr': (20_000_000, 40), 'ess': (10_000_000, 20), 'imp': (7_000_000, 14)}
def hup(n, d): return math.floor(Fr(n, d) + Fr(1, 2))
def run(turn, law, p, I, q, k, spend, eff=50):
    F, r = LAW[law]; P = turn * r * 1000; C = max(F, P)
    dec = 'fixed' if F > P else 'pct' if P > F else 'equal'
    fine = hup(C * k, 100)
    inc0 = hup(p * I, 100); fin0 = hup(p * q * fine, 10_000); e0 = inc0 + fin0
    inc1 = hup(p * (100 - eff) * I, 10_000); fin1 = hup(p * (100 - eff) * q * fine, 4_000_000)
    t1 = inc1 + fin1 + spend; net = e0 - inc1 - fin1 - spend
    v = 'worth' if net > 0 else 'even' if net == 0 else 'not'
    return P, C, dec, Fr(C, turn * 10**6), fine, inc0, fin0, e0, inc1, fin1, t1, net, v
for row in [(10, 'imp', 20, 250_000, 40, 25, 100_000), (2500, 'gdpr', 10, 2_500_000, 20, 10, 250_000),
            (500, 'ess', 10, 1_000_000, 20, 10, 50_000), (100, 'ess', 30, 100_000, 50, 25, 250_000),
            (2, 'imp', 5, 100_000, 20, 10, 50_000), (50, 'gdpr', 10, 250_000, 20, 25, 100_000)]:
    print(run(*row))
```

Output (checked 2026-11-09):

```
(140000, 7000000, 'fixed', Fraction(7, 10), 1750000, 50000, 140000, 190000, 25000, 17500, 142500, 47500, 'worth')
(100000000, 100000000, 'pct', Fraction(1, 25), 10000000, 250000, 200000, 450000, 125000, 25000, 400000, 50000, 'worth')
(10000000, 10000000, 'equal', Fraction(1, 50), 1000000, 100000, 20000, 120000, 50000, 2500, 102500, 17500, 'worth')
(2000000, 10000000, 'fixed', Fraction(1, 10), 2500000, 30000, 375000, 405000, 15000, 46875, 311875, 93125, 'worth')
(28000, 7000000, 'fixed', Fraction(7, 2), 700000, 5000, 7000, 12000, 2500, 875, 53375, -41375, 'not')
(2000000, 20000000, 'fixed', Fraction(2, 5), 5000000, 25000, 100000, 125000, 12500, 12500, 125000, 0, 'even')
```

## Sources

- Regulation (EU) 2016/679 (GDPR / Opća uredba o zaštiti podataka), art. 83(1), (2), (4), (5); art. 24, 32; EUR-Lex.
- Directive (EU) 2022/2555 (NIS2), art. 20(1)–(2), 21, 32(5)(b), 34(1), (4), (5); EUR-Lex.
- Zakon o kibernetičkoj sigurnosti, NN 14/2024 (implements NIS2; catalogue §4.13, confirmed by the owner 2026-11-08).
- Expected loss = loss × frequency and the verdict rule: `sims/fin-ale-risk/SPEC.md` rules 1a–2 (FIPS PUB 65).
