<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-sunk-cost: specification

Task `docs/tasks/w3/fin-sunk-cost.md`, catalogue `fin-sunk-cost` (§4.12; seed: the write-off from `fin-depreciation`).
Class **stepper**, 16 steps. The state at step *n* is a pure function of *n* and the params (`sim.js` `compute`).

**One concept:** money already spent, and an old system's remaining book value, are the same whichever way you
choose, so only the cost still to come and the benefit still to come count, including the opportunity cost of the
people tied up.

**The contrast on the stage:** one overrunning project, decided two ways at the same gates.

- **Top, two lanes** on one month axis (months 1–12): *deciding by already spent* and *deciding by still to spend*.
  Each month cell shows what that lane did (building, setting up the ready-made product, the new system live, the old
  system kept); the gate columns between months carry each lane's choice. Beside each lane: cash spent, team months
  used, benefit so far.
- **Bottom, the gate table** of the latest gate: the three options (continue, switch, stop) with the benefit to come,
  the cash still to spend, the people's time still to come and their sum, **looking forward**; then the money already
  spent (charged by the sunk view to every way out of the project) and the old system's book value (charged by the
  sunk view to every option that retires it), and their sum, **by already spent**. At the last step the table gives way
  to the outcome of each lane, run to its own end.

## Params

| key | control | values (default) | notes |
|---|---|---|---|
| `overrun` | choice | `none`, `moderate`, `severe` (`moderate`) | which estimate path the project follows (rule 2) |
| `value` | range, step 1 000 | 0–10 000 € (5 000) | what one person-month of the team would earn elsewhere (opportunity cost) |
| `old` | range, step 12 000 | 0–240 000 € (24 000) | the old system's book value at month 0 |
| `product` | toggle | on/off (on) | a ready-made product is on offer (the switch option) |

Fixed, illustrative (the page says so once; the explanation lists them):

- **Build in-house:** €20 000 a month of outside cash (contractors, hardware) and a team of **4** people; planned at
  **4 months**; once live it brings **€400 000** of benefit over its life.
- **Switch to a ready-made product:** €120 000 (paid €40 000 a month over **3 months** of setting up), **2** of the
  team for those 3 months; once live it brings **€320 000** (it fits less well). Nothing built so far is reused.
- **Stop:** keep the old system; nothing more is spent and the team goes back to other work. Benefits are measured
  against keeping the old system, so stop's benefit is 0 and the old system's running costs are left out.
- **The old system:** straight-line depreciation over a 5-year life, no residual value, bought 3 years before month
  0 (so 24 months left): cost = 2.5 × `old`, schedule `asset.js` `schedule(cost, 60, 0, 'sl')` by month (copied
  from fin-depreciation; its rows are periods), book value at month *m* = `bookAt(sched, cost, 36 + m)` = `old` −
  `old` × *m* ÷ 24, never below 0. Retired the month a new system goes live: written off at its book value then
  (`asset.js` `disposal`, proceeds 0, a loss on paper, no cash).
- **Gates** at the end of months 0, 3, 6, 9 (G0–G3). Months 1–12 are on the stage.

## Rules

All amounts are whole euros (every input is a multiple of 500, so no rounding is needed; `asset.js` `tidy` keeps
the book value exact). Money is shown in whole euros, minus as U+2212.

1. **Params (normalise).** `overrun` not one of the three → `moderate`. `value` and `old`: non-numbers (`null`, `''`,
   `true`, `Infinity`, `NaN`) take the default; numbers are snapped to their step (half away from zero) and clamped
   to the range. `product`: `false`, `'false'`, `0`, `'0'` off; `true`, `'true'`, `1`, `'1'` on; anything else the
   default.
2. **Estimates.** The estimated total build length, in months, as known at G0, G1, G2, G3:
   `none` 4, 4, 4, 4; `moderate` 4, 7, 14, 14; `severe` 4, 9, 17, 22. The **true** length is the last one. At a
   gate in month *m* a building project has built *m* months, so the months still to build are *r* = estimate − *m*.
3. **Options at a gate** (a lane faces a gate only while it is building, or at G0 before it starts):
   - *continue* (at G0: start building): benefit 400 000; cash 20 000 × *r*; team months 4 × *r*;
   - *switch* (only with `product` on): benefit 320 000; cash 120 000; team months 2 × 3 = 6;
   - *stop* (at G0: keep the old system): benefit 0; cash 0; team months 0.
   People's time = team months × `value`.
4. **Looking forward** (*F*): benefit to come − cash still to spend − people's time still to come.
5. **By already spent** (*V*): *F* − *S* for every option that leaves the project (switch, stop), where *S* is the cash
   already spent on the build ("it would be wasted"), and − *W* for every option that retires the old system
   (continue, switch), where *W* is the old system's book value at the gate ("we would book a loss"). At G0, *S* = 0.
   Both views count the people's time: the only difference is the money already sunk.
6. **Choosing.** Each rule takes the option with the highest score (*F* or *V*). **Tie-break:** the current course wins
   (at G0 keeping the old system, later continuing); then less cash still to spend; then the order continue, switch,
   stop.
7. **Whole-project check** (shown under the table): *F* − *S* for every option. The same *S* comes off every row, so
   the order is the order of *F* (tested over all gates and presets).
8. **A month** (in order, per lane): building → cash +20 000, team months +4, built +1; when built reaches the true
   length the system goes live that month: benefit +400 000, old system retired. Setting up the product → cash
   +40 000, team months +2, month of setup +1; after the third the product goes live: benefit +320 000, old system
   retired. Stopped or live → nothing. Then, if the month is a gate, the lane decides (rule 6) on the gate table built
   from its own cash spent.
9. **Lanes.** Both lanes start alike; while both are building they are identical, so the gate table is one table
   (from either building lane). If neither builds at a gate, there is no table ("no gate").
10. **Own end.** At the last step each lane still building or setting up is run on, month by month, with no further
   gates, until it goes live; its outcome (benefit, cash, team months, people's time, **net** = benefit − cash −
   people's time, the month it goes live, the write-off) is the comparison. A lane that stopped ends at month 12 with
   the old system still on the books (*W* at month 12, expensed later).
11. **Steps.** 0: G0 open; 1: G0 decided; 2–3: months 1–2; 4: month 3, G1 open; 5: G1 decided; 6–7: months 4–5;
   8: month 6, G2 open; 9: decided; 10–11: months 7–8; 12: month 9, G3 open; 13: decided; 14–16: months 10–12.
   "Open" shows the options and their inputs, the scores and choices hidden (the class votes); "decided" shows both
   scores and each rule's choice and applies it.

## Presets (numbers from the check script at the end)

| # | id | params | G0 | G1 | G2 | G3 | outcome (net, whole project) |
|---|---|---|---|---|---|---|---|
| 1 | `overrun` | defaults | both start (F 240 000 vs switch 170 000) | both continue (est 4 → 7) | **forward switches** (F switch 170 000 vs continue 80 000); sunk continues (V 62 000 vs 32 000; S 120 000) | sunk lane: both rules continue (F 200 000) | spent-rule −160 000 (live m14, 56 team months); still-to-spend −70 000 (live m9, 30 team months); 90 000 apart |
| 2 | `on-track` | `none` | both start | both continue (1 month left) | live at m4 | — | both +240 000 (cash 80 000, 16 team months) |
| 3 | `team-free` | `value` 0 | both start | both continue | both continue (F 240 000 vs 200 000) | both continue | both +120 000, live m14: without the team's time, continuing was right |
| 4 | `old-books` | `none`, `value` 10 000, `old` 180 000 | **sunk keeps the old system** (V 0 vs −20 000: "a €180 000 loss"); forward builds (F 160 000) | forward continues | — | — | spent-rule 0 (old system kept, €90 000 still on the books at m12); still-to-spend +160 000 (live m4, write-off €150 000 on paper) |
| 5 | `no-way-out` | `severe`, `product` off | both start | both continue (est 9) | **forward stops** (F −40 000 vs 0); sunk continues (V −58 000 vs −120 000) | sunk lane continues (F −120 000 vs 0, V −135 000 vs −180 000) | spent-rule −480 000 (live m22, cash 440 000); still-to-spend −240 000 (cash 120 000); 240 000 apart |

**Tie-break cases** (tested). Reachable: `none`, `value` 5 000, `old` 240 000 at G0: *V* continue = 240 000 −
240 000 = 0 = *V* stop, so the current course wins and the sunk rule keeps the old system (switch: 170 000 − 240 000 <
0); the forward rule starts building. The chooser is also tested directly: equal scores → the current course; the
current course not among the tied → less cash still to spend; equal cash → continue, switch, stop.

## Captions (keys in `strings.js`, chosen by `sim.js` `captionKey`)

- G0 open: what each option means, nothing spent yet, the old system's book value.
- Gn open: the estimate moved from *a* to *b* months; *S* spent so far; continue, switch or stop?
- Decided, both rules agree: the option and its forward score and margin. Disagree: each rule's choice and the forward
  scores, with the sunk rule's reason: *S* when it continues ("leaving wastes it"), *W* when it keeps or stops ("replacing
  books a loss").
- No gate: "neither lane is building" (both live, stopped or switched).
- A month: what happened in each lane (one sentence if the lanes are alike); going live adds the write-off. A lane
  going live in a gate month (3, 6, 9) gets that sentence after the gate's, at the open step.
- Last step: the two nets and the difference, or "the same" when both lanes took the same path. Which lane comes out better
  is said; the sunk lane can win when an early estimate was too short (`moderate`, `value` 5 000, `old` 240 000: it
  keeps the old system at G0, net 0, the forward lane starts building, switches at G2 when 4 months turn into 14, net −70 000; tested).

## Out of scope

Discounting (fin-npv-discounting), cost of delay (fin-cost-of-delay), tax, risk-weighted estimates, partly reusable
work, the old system's running costs, selling the old system (proceeds are 0).

## Check script

Run with `python3`; the preset tests in `sim.test.js` compare `sim.js` with the same numbers.

```python
from fractions import Fraction as F
GATES = [0, 3, 6, 9]; END = 12
BUILD_CASH, TEAM, B = 20000, 4, 400000
PROD_CASH, PROD_MONTHS, PROD_TEAM, BP = 120000, 3, 2, 320000
EST = {'none': [4, 4, 4, 4], 'moderate': [4, 7, 14, 14], 'severe': [4, 9, 17, 22]}
ORDER = ['continue', 'switch', 'stop']
def book(old, m): return max(F(0), F(old) - F(old) * m / 24)
def table(g, est, spent, value, old, product):
    m = GATES[g]; rem = est[g] - m; rows = {}
    rows['continue'] = dict(benefit=B, cash=rem * BUILD_CASH, pm=rem * TEAM)
    if product: rows['switch'] = dict(benefit=BP, cash=PROD_CASH, pm=PROD_MONTHS * PROD_TEAM)
    rows['stop'] = dict(benefit=0, cash=0, pm=0)
    W = book(old, m)
    for o, r in rows.items():
        r['fwd'] = r['benefit'] - r['cash'] - r['pm'] * value
        r['sunk'] = r['fwd'] - (spent if o != 'continue' else 0) - (W if o != 'stop' else 0)
    cur = 'stop' if g == 0 else 'continue'
    pick = lambda k: sorted(rows, key=lambda o: (-rows[o][k], o != cur, rows[o]['cash'], ORDER.index(o)))[0]
    return rows, pick('fwd'), pick('sunk'), W, rem
def run(rule, ov, value, old, product):
    est = EST[ov]; true = est[-1]
    L = dict(phase='plan', cash=0, pm=0, benefit=0, built=0, sw=0, live=None, writeoff=None, choices=[])
    def gate(g):
        if L['phase'] not in ('plan', 'build'): L['choices'].append(None); return
        rows, f, s, W, rem = table(g, est, L['cash'], value, old, product)
        c = f if rule == 'fwd' else s; L['choices'].append(c)
        L['phase'] = {'continue': 'build', 'switch': 'switch', 'stop': 'kept'}[c]
    gate(0)
    for m in range(1, 60):
        if L['phase'] == 'build':
            L['cash'] += BUILD_CASH; L['pm'] += TEAM; L['built'] += 1
            if L['built'] == true: L.update(phase='live', live=m, writeoff=book(old, m)); L['benefit'] += B
        elif L['phase'] == 'switch':
            L['cash'] += PROD_CASH // PROD_MONTHS; L['pm'] += PROD_TEAM; L['sw'] += 1
            if L['sw'] == PROD_MONTHS: L.update(phase='live', live=m, writeoff=book(old, m)); L['benefit'] += BP
        if m in GATES: gate(GATES.index(m))
        if m >= END and L['phase'] not in ('build', 'switch'): break
    L['net'] = L['benefit'] - L['cash'] - L['pm'] * value
    return L
for name, ov, v, old, prod in [('overrun', 'moderate', 5000, 24000, True), ('on-track', 'none', 5000, 24000, True),
        ('team-free', 'moderate', 0, 24000, True), ('old-books', 'none', 10000, 180000, True),
        ('no-way-out', 'severe', 5000, 24000, False)]:
    for g in range(4):
        rows, f, s, W, rem = table(g, EST[ov], GATES[g] * BUILD_CASH, v, old, prod)
        print(name, 'G%d' % g, rem, f, s, {o: (int(r['fwd']), int(r['sunk'])) for o, r in rows.items()})
    for rule in ('sunk', 'fwd'):
        L = run(rule, ov, v, old, prod)
        print(name, rule, L['choices'], L['cash'], L['pm'], L['benefit'], int(L['net']), L['live'], L['writeoff'])
```
