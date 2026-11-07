<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-cost-of-delay: specification

Task `docs/tasks/w3/fin-cost-of-delay.md`, catalogue `fin-cost-of-delay` (§4.12). Class **explorer**: the state is a
pure function of the params (`sim.js` `compute`), no steps.

**One concept:** each project loses value for every week it waits; ordering by value lost per week ÷ duration beats
ordering by size or by who asks loudest.

**The contrast on the stage:** one set of projects in **two orders**, the student's queue against the order by value
per week ÷ duration, read as money lost. Top: the queue of one team, a row per project in order (place, ▲ ▼ to move it,
name, who asks and how loudly, € lost per week, weeks, the ratio, the week it is done, € it loses). Middle left: the
staircase of value still being lost per week, from week 0 to the last delivery; one band per project, as tall as its
€ per week and as long as its delivery week, so its area is what it loses (solid while it waits, hatched while it is
built), the first delivered on top; when the queue is not the best, the best order's outline is drawn dashed over it.
Middle right: the same projects' total under the queue and under five rules, as bars; the least marked ★, each rule a
button that puts the queue in its order. Foot: the hatched part (the same in any order) and the solid part (what the
order decides), and that the amounts are made up.

## Constants (illustrative, made up but plausible)

| | value | source |
|---|---|---|
| projects, in list order (the order they were asked for) | customer portal (asked by sales), invoice matching (accounting), ERP upgrade (the board), sales dashboard (marketing), single sign-on (helpdesk) | a mid-sized IT department's backlog *(check: the set)* |
| base [€ lost per week, weeks, how loudly asked 1–5] | portal [6 000, 8, 3]; invoice [3 000, 2, 2]; erp [4 000, 12, 5]; dash [2 000, 4, 4]; sso [1 000, 1, 1] | made up; the page says so |
| loudness words | 1 quietly, 2 calmly, 3 firmly, 4 loudly, 5 very loudly | |
| the team | one team, one project at a time, no gaps, no switching cost | the single-machine model of scheduling (Smith 1956) |

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `n` | choice | 3, 4, 5 (5) | the first *n* projects of the list are in the queue |
| `order` | hidden select over all 120 orders of `abcde` (a portal, b invoice, c erp, d dash, e sso); set by ▲ ▼ and the rule buttons on the stage, and by "Sort by the ratio" (key `S`) | (`cdabe`, the loud order) | projects not in play keep their letters at the end |
| `proj` | hidden choice; set by clicking a name in the queue (or moving that project) | the five ids (`erp`) | which project the panel edits |
| `<id>C` | range, shown for the selected project | 500–20 000 €/week, step 500 | value lost per week until delivered |
| `<id>D` | range, shown for the selected project | 1–20 weeks | duration |
| `<id>V` | choice, shown for the selected project | 1–5 | how loudly the project is asked for |

The defaults are preset 1. Out-of-range values (from a URL) are clamped and snapped to their step (rounded to
nearest); non-finite numbers, non-numbers, empty or blank values, booleans and objects take the default; a count or a
loudness not in its list takes the default; a `proj` that is not in play becomes the first project of the list
(`portal`, always in play); `order` is made whole (rule 8) (`normalise`). From a URL, the kit itself replaces an
`order` that is not one of the 120 orders with the default before the model sees it.

## Rules

1. **Ties (first).**
   - a. **Equal keys keep the list order** (portal, invoice, erp, dash, sso) in every rule, whatever the queue's
     present order.
   - b. **Ratios are compared exactly** by cross-multiplying (cd_a × d_b against cd_b × d_a), never as rounded
     numbers: 1 000/3 and 2 000/6 tie, 1 001/3 is larger. The ratio in the queue is only shown, rounded to whole euros,
     halves up (500/8 = 62.5 → 63).
   - c. **"Best" is a total, not a sequence:** the queue is the best when its total equals the least total; with two
     projects of equal ratio either can go first. Whenever the projects in play have such a pair (best queue or not),
     the caption names the first one in the ratio order (`nTie`).
   - d. **The biggest single saving** is the neighbour swap that saves the most; of equal savings the earlier one; a
     swap that saves 0 is no saving; none is named when the queue is the best.
   - e. **"Your order = <rule>"**: the "your order" row names a rule only when that rule gives the very same
     sequence, not merely the same total; when several do, the first in the rule list.
   - f. **No rounding anywhere else:** euros per week and weeks are whole, so every amount is a whole number of euros.
2. **The schedule:** the team works the queue in order with no gaps: a project starts when the one before is done
   (start = the sum of the durations before it; done = start + d).
3. **The loss:** a project loses cd every week from week 0 until it is done: lost = cd × done = cd × start (while it
   waits) + cd × d (while it is built). The total is the sum. The building part, Σ cd × d, is the same in every order;
   only the waiting part depends on the order.
4. **The staircase:** at week *w* the value still being lost per week is the sum of cd over the projects not yet done.
   Its area is the total. Each project is a band from week 0 to its done week, as tall as its cd, stacked on the bands
   of the projects done after it (so the first delivered is on top).
5. **The rules** (each with rule 1a's tie-break): who asks loudest (loudness, largest first); longest first (weeks,
   largest first); shortest first (weeks, smallest first); most valuable first (cd, largest first); value per week ÷
   duration (cd ÷ d, largest first).
6. **The least total** is the total of the ratio order (Smith's ratio rule, the weighted shortest processing time
   rule: Smith 1956; Pinedo, *Scheduling*, the single-machine total weighted completion time problem *(check: theorem
   number)*). The tests check it against every order (brute force) for every preset at n = 3, 4, 5 and 300 random
   queues of 2–6 projects.
7. **Swapping neighbours** a (first) and b changes the total by cd_b × d_a − cd_a × d_b and nothing else, so b
   should go first exactly when cd_b ÷ d_b > cd_a ÷ d_a; that is the proof of rule 6 (adjacent interchange).
8. **The queue and the order string:** the queue is `order` read left to right, keeping the projects in play. A new
   queue is written back as its letters followed by the letters not in play in their present order. A string is made
   whole by keeping the known letters in order, each once, and appending the missing ones in list order; anything that
   is not a string gives the default.
9. **Moving:** ▲ swaps a project with the one before it, ▼ with the one after it, and selects it. At the front (▲) or
   the back (▼) nothing changes; the button is `aria-disabled` and its label says why ("already first").
10. **The changed mark:** the "your order" row is highlighted when the outcome flips between best and not best.

## Presets (expected numbers; `node --test` checks every one)

| # | id | what | queue | total | least | extra | rows marked ★ |
|---|---|---|---|---|---|---|---|
| 1 | `loud` | in the order they ask, loudest first | erp, dash, portal, invoice, sso | 329 000 € | 213 000 € | 116 000 € | ratio |
| 2 | `big` | the longest first | erp, portal, dash, invoice, sso | 321 000 € | 213 000 € | 108 000 € | ratio |
| 3 | `quick` | quick wins: shortest first | sso, invoice, dash, portal, erp | 222 000 € | 213 000 € | 9 000 € | ratio |
| 4 | `ratio` | value per week ÷ duration | invoice, sso, portal, dash, erp | 213 000 € | 213 000 € | 0 | ratio |
| 5 | `same-value` | every project 3 000 €/week, loud order | erp, dash, portal, invoice, sso | 315 000 € | 159 000 € | 156 000 € | shortest first, ratio |
| 6 | `same-size` | every project 4 weeks, loud order | erp, dash, portal, invoice, sso | 172 000 € | 144 000 € | 28 000 € | most valuable first, ratio |

The five rules on the base projects (presets 1–4): loud 329 000, longest 321 000, shortest 222 000, most valuable
273 000, ratio 213 000 €. Preset 1 in detail (start → done, lost): erp 0 → 12, 48 000; dash 12 → 16, 32 000; portal
16 → 24, 144 000; invoice 24 → 26, 78 000; sso 26 → 27, 27 000; waiting 218 000 + building 111 000 = 329 000 €. The
biggest single saving there: invoice before portal, 3 000 × 8 − 6 000 × 2 = 12 000 €. Preset 4: invoice 0 → 2, 6 000;
sso 2 → 3, 3 000; portal 3 → 11, 66 000; dash 11 → 15, 30 000; erp 15 → 27, 108 000. Preset 3's saving: portal before
dash, 8 000 €. With three projects (portal, invoice, erp) in the loud order: 234 000 €, least 154 000 €.

Checked before coding with an independent script (Python, brute force over every order with exact fractions), the
same numbers as the tests.

## Captions

Main sentence: `capBest` (the queue is the best: "no order of these projects loses less") or `capWorse` (the total,
what the ratio order would lose and the difference). Notes, in this order: `nSwap` (the biggest single saving, rule
1d) when the queue is not the best; `nTie` (two projects with the same ratio, rule 1c) when there is such a pair.

## Legend

Lost while waiting (solid), lost while being built (hatched), the best order (dashed outline), your order (outlined
row), ★ the least possible loss, the outcome changed (highlighter). Each project's colour (series 1–5 by list place) is
always next to its name, in the queue and on its band; the solid/hatched split and the dashed line carry the meaning
in grayscale.

## Misconceptions targeted

- "Do the most important (longest, most valuable) first": value alone ignores how long it blocks everything behind.
- "Quick wins first": right only when every project loses about the same per week (preset 5).
- "Whoever shouts loudest": loudness is not value (preset 1).
- "The order doesn't change the cost, the work is the same": the building part is the same, the waiting is not.

## Out of scope

Discounting (weeks to months; `fin-npv-discounting`), deadlines and urgency profiles (value lost faster near a date),
several teams or projects in parallel, switching costs, dependencies between projects, uncertainty in the estimates,
partial delivery. Named in the explanation as limits.

## Sources

- W. E. Smith, "Various optimizers for single-stage production", *Naval Research Logistics Quarterly* 3 (1956),
  59–66: the ratio rule for the least weighted sum of completion times on one machine.
- M. L. Pinedo, *Scheduling: Theory, Algorithms, and Systems*, Springer: WSPT optimal for 1 || Σ w_j C_j, proof by
  adjacent pairwise interchange *(check: edition and theorem number)*.
- D. G. Reinertsen, *The Principles of Product Development Flow*, Celeritas, 2009: cost of delay and the weighted
  shortest job first rule *(check: chapter and principle number)*.
- The term CD3 (cost of delay divided by duration) is common in agile practice writing *(check: an original source)*.
