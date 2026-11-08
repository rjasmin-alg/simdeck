<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-maturity-levels: specification

Explorer (task `docs/tasks/w3/cmp-maturity-levels.md`, catalogue `cmp-maturity-levels` §4.13). One concept: each
control area is rated on a scale from ad hoc to measured and improving; one average looks fine while one area stays at
the bottom, and the weakest area is where incidents and findings come from; each level up costs more than the last, so
a target per area beats raising everything.

Code: `sim.js` (every rule below, pure and wordless), the page `index.html`, words in `strings.js`. Tests:
`sim.test.js`. Everything here is illustrative: one made-up firm, made-up ratings, costs and incident counts; the page
says so once, and that it simplifies and is not legal advice.

## State and what a change does

An explorer: no steps. The state is a pure function of the params (`compute`). The student rates the current level of
each of eight areas and sets a target for each (on the stage: − and + beside each number), and picks a budget in the
panel. Every change sets params and the state is recomputed. The panel has the budget and one button that clears the
plan (every target back to the current level); the sixteen levels are params kept in the URL only (`c1`…`c8`,
`t1`…`t8`), set from the stage.

## Rules

1. **Areas and levels.** Eight control areas in a fixed order: 1 asset inventory, 2 access control, 3 vulnerabilities
   and patches, 4 backups, 5 logging and monitoring, 6 incident response, 7 suppliers, 8 awareness and training. Each
   is rated on five levels: 1 ad hoc, 2 repeatable, 3 defined, 4 measured, 5 improving (measured and improved
   continually). A target is a level too; the plan is the targets.
2. **Each level up costs more than the last.** The step from level L to L + 1 costs 2^L weeks of work: 1→2 two weeks,
   2→3 four, 3→4 eight, 4→5 sixteen. Raising an area from c to t costs Σ 2^L for L = c … t − 1 = 2^t − 2^c (0 when
   t = c). The plan costs the sum over the eight areas. The same in every area (simplification: real areas differ).
3. **The audit.** A simulated audit checks every area at the level it has: level 1 raises a *major nonconformity*,
   level 2 a *minor nonconformity*, level 3 or more nothing (the audit line: a requirement written down and operating,
   what a certification audit looks for). Counted separately: majors and minors.
4. **Incidents come from the bottom.** An area at level L contributes 2^(4 − L) expected incidents a year: 8, 4, 2, 1,
   ½ for levels 1 to 5 (each level halves them). The firm's expected incidents a year are the sum over the eight areas.
5. **Average and weakest.** The average is the sum of the eight levels / 8. The weakest area is the one with the
   lowest level; on a tie the first in area order (tie-break). The weakest area's share of the incidents is its
   contribution / the sum.
6. **The budget.** `budget` ∈ {12, 24, 48, 96} weeks. The plan fits when its cost ≤ the budget (equal fits,
   tie-break); `left` = budget − cost (negative when over).
7. **Moves on the stage** (each one sets params; refused moves change nothing and say why):
   - target + : allowed when t < 5 and cost + 2^t ≤ budget (exactly reaching the budget is allowed, tie-break);
     refused at 5 (`top`) or over the budget (`budget`). Refusal by `top` is checked first.
   - target − : allowed when t > c; refused at the current level (`floor`).
   - current + : allowed when c < 5; the target follows when it would fall below (t = max(t, c + 1)), so the cost of
     that area falls or stays.
   - current − : allowed when c > 1; the target stays, so the cost can rise above the budget (the rating is a
     fact, not a purchase); the stage then shows the plan over budget.
8. **Plans compared**, all from the same current levels and budget: *now* (no plan), *+1 everywhere* (t = min(5,
   c + 1) in every area), *floor at defined* (t = max(c, 3)), and *your plan*. Each shows its cost and whether it
   fits, the average, the weakest area and level, majors and minors, incidents a year and the weakest area's share.
9. **Params** (a URL may carry anything): `c1`…`c8` and `t1`…`t8` are numbers (a numeric string counts), rounded and
   clamped to 1…5; blank, whitespace, null, non-numeric or infinite → the default (preset 1). Then t = max(t, c) in
   every area. `budget` one of 12, 24, 48, 96 by exact string match ("024", 30 → 24).
10. **Caption.** The plan is *empty* when every target equals the current level. Empty: the current average, the
    weakest area and its level, majors and minors, and the weakest area's share of the incidents, in one of two
    sentences: "but …" when the weakest level is below 3 (`capNow`), a neutral one when it is 3 or more (`capNowOk`). Not empty: the
    plan's cost and the budget, then now → plan for the average, the weakest level (and the area), the majors and
    minors, and the incidents. Then at most one note in this order: over budget (cost > budget); the average hides
    the weakest (the plan's average ≥ 3 while its weakest level < 3); the top step is dear (the plan buys a 4→5 step
    while some area of the plan stays below 3); all clear (no majors or minors after the plan, plan not empty).
    A refused move adds its reason before the note (the page's, not the model's: it is not state); a budget refusal while
    the plan is already over budget says so instead of "0 weeks left".

## Presets

The firm's current ratings, A: `44341343` (asset inventory 4, access 4, vulnerabilities 3, backups 4, logging 1,
incidents 3, suppliers 4, awareness 3); S: `55452414`. Budget 24 weeks unless stated.

| # | id | current | targets | budget | plan cost | average now → plan | weakest now → plan | majors / minors now → plan | incidents now → plan | weakest share plan | note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `average-fine` | A | = A | 24 | 0 | 3.25 | logging 1 | 1 / 0 | 18 | 44.4 % | – |
| 2 | `plus-one` | A | +1 everywhere `55452454` | 96 | 90 | 3.25 → 4.25 | logging 1 → 2 | 1 / 0 → 0 / 1 | 18 → 9 | 44.4 % | average hides |
| 3 | `floor` | A | logging to 3 `44343343` | 24 | 6 | 3.25 → 3.5 | logging 1 → vulnerabilities 3 | 1 / 0 → 0 / 0 | 18 → 12 | 16.7 % | all clear |
| 4 | `per-area` | A | logging 3, vulnerabilities 4, incidents 4: `44443443` | 24 | 22 | 3.25 → 3.75 | logging 1 → 3 | 1 / 0 → 0 / 0 | 18 → 10 | 20 % | all clear |
| 5 | `showcase` | S | = S | 24 | 0 | 3.75 | suppliers 1 | 1 / 1 | 16.5 | 48.5 % | – |
| 6 | `showcase-floor` | S | suppliers and logging to 3: `55453434` | 12 | 10 | 3.75 → 4.125 | suppliers 1 → logging 3 | 1 / 1 → 0 / 0 | 16.5 → 8.5 | 23.5 % | all clear |

The comparison (rule 8) for A at budget 24: now 0 weeks, 3.25, logging 1, 1 / 0, 18 (44.4 %); +1 everywhere 90 weeks
(over by 66), 4.25, logging 2, 0 / 1, 9 (44.4 %); floor at defined 6 weeks, 3.5, vulnerabilities 3, 0 / 0, 12
(16.7 %). For S: +1 everywhere 54 weeks, 4.375, suppliers 2, 0 / 1, 9 (44.4 %); floor at defined 10 weeks, 4.125,
logging 3, 0 / 0, 8.5 (23.5 %).

The point of presets 1–4: raising everything by one costs 90 weeks, nearly four times the budget, and still leaves a
minor finding and the weakest area as the largest source of incidents; bringing the one weak area to *defined* costs
6 weeks and clears the audit; a target per area (the weak one to 3, two important ones to 4) spends 22 of the 24 weeks
and gets within one incident a year of +1 everywhere. Presets 5–6: a higher average (3.75) with a worse audit.

Note on preset 1: with no plan the caption has no note (all four notes are about a plan); the average hides note
would otherwise apply to the current levels and is said by the current sentence itself.

## Check script

`python3 -I check.py` with the script below (an independent re-implementation of rules 2–8 from this text, not from
the JavaScript) prints the table above.

```python
def cost(c, t): return sum(2 ** L for L in range(c, t))
def lam(L): return 2 ** (4 - L)
def summ(lv):
    inc = sum(lam(L) for L in lv); w = min(range(8), key=lambda i: (lv[i], i))
    return dict(avg=sum(lv) / 8, weakest=(w + 1, lv[w]), major=sum(L == 1 for L in lv), minor=sum(L == 2 for L in lv),
                inc=inc, share=round(100 * lam(lv[w]) / inc, 1))
def plan(cur, tgt): return sum(cost(c, t) for c, t in zip(cur, tgt))
D = lambda s: [int(x) for x in s]
A, S = D('44341343'), D('55452414')
P = {'average-fine': (A, A, 24), 'plus-one': (A, D('55452454'), 96), 'floor': (A, D('44343343'), 24),
     'per-area': (A, D('44443443'), 24), 'showcase': (S, S, 24), 'showcase-floor': (S, D('55453434'), 12)}
for k, (c, t, B) in P.items():
    print(k, 'cost', plan(c, t), 'of', B, 'now', summ(c), 'plan', summ(t))
for name, c in (('A', A), ('S', S)):
    for p, tt in (('plus1', [min(5, x + 1) for x in c]), ('floor3', [max(3, x) for x in c])):
        print(name, p, plan(c, tt), summ(tt))
```

## Legend, captions and terms

- Legend: current levels (dashed outline), the plan (filled, solid outline), the average of the plan (dotted ring),
  the audit line at level 3 (thick dashed ring), the weakest area (a ring on its point and an outlined row); in the
  table ✕ major, ! minor, ✓ none; a bar for incidents a year.
- Terms (both languages, settled or chosen in `NOTES.md`): razine zrelosti (*maturity levels*, settled), područje
  kontrola (*control area*), ad hoc / ponovljivo / definirano / mjereno / stalno se poboljšava (*ad hoc, repeatable,
  defined, measured, improving*), velika / mala nesukladnost (*major / minor nonconformity*), prosjek (*average*),
  najslabije područje (*weakest area*), ciljna razina (*target level*), tjedni rada (*weeks of work*).

## Misconceptions targeted

- "Our average is above 3, so we are in good shape": the audit and the incidents look at the weakest area (presets
  1, 5).
- "Raise everything by one level": the top steps are the dearest and buy the least; the weakest area stays the
  weakest (preset 2).
- "Level 5 everywhere is the goal": 16 weeks for a 4→5 step against 2 for 1→2 (rule 2; preset 2's cost).
- "One target for the whole organisation": a target per area spends the budget where the risk is (presets 3, 4, 6).

## Out of scope

Different costs or risks per area (all areas are priced and weighted alike); how a rating is assessed (evidence,
interviews); time to reach a level; levels falling back without upkeep; the audit sampling itself (`cmp-audit-sampling`);
level 0 (not performed).

## Sources

- The level scale: the five-level capability and maturity models used in process assessment; ISO/IEC 33020 (process
  capability levels, a measurement framework for ISO/IEC 33002 assessments) by number only. *(check: the
  33020 level names are "incomplete, performed, managed, established, predictable, innovating" (0–5); the page uses its
  own plain names 1–5 and does not claim them from the standard)*
- ISO/IEC 27001:2022, clauses 9.1 (monitoring, measurement, analysis and evaluation), 9.2 (internal audit) and 10.1
  (continual improvement), by number only, never quoted. *(check: clause numbers against the 2022 edition)*
- Major and minor nonconformity: the certification bodies' grading in ISO/IEC 17021-1:2015 (definitions 3.12 and
  3.13). *(check: definition numbers)*
- NIS2, Directive (EU) 2022/2555, art. 21(1): measures appropriate and proportionate to the risk; that a target per
  area follows the risk rather than one target for all. EUR-Lex. *(check: the official Croatian wording of art. 21(1))*
- Catalogue §4.13 (confirmed by the owner 2026-11-08): ISO/IEC 27001 certification is voluntary; the measures the
  Zakon o kibernetičkoj sigurnosti (NN 14/2024) requires cover similar ground. On the page in the explanation.
- All numbers (costs doubling per level, incidents halving per level, the ratings, the budgets) are illustrative.
