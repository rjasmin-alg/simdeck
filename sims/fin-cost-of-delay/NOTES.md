<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-cost-of-delay: notes

New explorer (task `docs/tasks/w3/fin-cost-of-delay.md`, catalogue `fin-cost-of-delay` §4.12). Rules and expected
numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** the same projects in two orders, the student's queue against value per week ÷
  duration, read as euros lost. Top: the queue (▲ ▼ per row, name, who asks and how loudly, € a week, weeks, the
  ratio, done in week, € lost). Middle left: the staircase of value still being lost per week, one band per project
  whose area is its loss, solid while it waits and hatched while it is built, the best order's outline dashed over it.
  Middle right: the total under the queue and under five rules as bars, the least marked ★; each rule is a button that
  puts the queue in its order.
- **Loss runs to delivery, not to the start.** A project loses its value per week from week 0 until it is done (the
  usual reading of cost of delay: value arrives on delivery). Counting only the waiting weeks would change every total
  by the same Σ cd × d and no ranking; the page shows that split (hatched = the same in any order, solid = what the
  order decides) and the footnote states both numbers.
- **Five rules, not two.** The concept names "size" and "who asks loudest"; size has two readings (longest first,
  quick wins first), and most valuable first is the third common rule of thumb. All five fit in one column, and the
  presets `same-value` and `same-size` show the two simple rules that are special cases of the ratio.
- **Reordering:** ▲ ▼ buttons, not drag and drop: they work with a keyboard and a clicker's focus, keep focus after a
  keyboard press, and are `aria-disabled` with a reason at the ends. The rule rows and "Sort by the ratio" (key `S`)
  set the whole order at once.
- **The order is a param** (`order`, a string of letters a–e), so a queue can be linked and reloaded. The kit only
  takes known control types, so it is a hidden `select` over all 120 orders; `normalise` makes any string whole.
- **Three to five projects** are the first *n* of a fixed list of five, as in `fin-ale-risk`'s fixed register; a free
  "add a project" would need dynamic params.
- **"Best" means the least total**, not the ratio rule's exact sequence: with equal ratios either order is best, and
  the caption says so (`nTie`).
- **The biggest single saving** (`nSwap`) names one neighbour swap and what it saves, so a student who is not at the
  best gets one concrete next move, not the answer.
- **Loudness** is a 1–5 choice per project with words (quietly … very loudly) and who asks (the board, sales, …),
  deliberately unrelated to value.
- **No discounting:** the horizon is weeks to months; the explanation names discounting as out of scope and
  `fin-npv-discounting` covers it.
- **Projects** are generic IT work (customer portal, invoice matching, ERP upgrade, sales dashboard, single sign-on).
  "ERP" is a category, not a product.

## Deviations from the task

- None in scope. The catalogue says "three to five projects"; the page has 3, 4 or 5.

## Sources

- W. E. Smith, "Various optimizers for single-stage production", *Naval Research Logistics Quarterly* 3 (1956),
  59–66: the ratio rule for the least weighted sum of completion times.
- M. L. Pinedo, *Scheduling: Theory, Algorithms, and Systems*: WSPT optimal for 1 || Σ w_j C_j by adjacent pairwise
  interchange.
- D. G. Reinertsen, *The Principles of Product Development Flow* (2009): cost of delay; weighted shortest job first.
- The optimum is also checked by brute force in the tests (every order, every preset at n = 3, 4, 5, and 300 random
  queues), so the page does not rest on the citation.

## Unchecked *(check)*

- The project set and its numbers are made up (the page says so); plausibility only.
- Pinedo: edition and theorem number for WSPT.
- Reinertsen: chapter and principle number for WSJF / cost of delay.
- "CD3" (cost of delay divided by duration): an original source for the name.
- Croatian terms below.

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| cost of delay | trošak kašnjenja |
| cost of delay divided by duration (CD3) | trošak kašnjenja podijeljen trajanjem (vrijednost tjedno ÷ trajanje) |
| weighted shortest job first (WSJF) | ponderirano najkraći posao prvi |
| queue (of projects) | red čekanja |
| quick wins | brze pobjede |
| delivery | isporuka |

The Croatian page writes *cost of delay* (trošak kašnjenja) and *weighted shortest job first* (ponderirano najkraći
posao prvi) out in the explanation, by the term rule, since neither is in the glossary yet.

## For the owner

- Catalogue §4.12 "Where Croatian practice commonly differs" has no line for `fin-cost-of-delay`; nothing to copy.
- Is "ponderirano najkraći posao prvi" the term you want for WSJF, or should the page keep only the English name?

## Shared requests

- `delay.js` (schedule, rule orders, swap saving, brute-force check) is pure and promotable to `models/delay.js`
  unchanged, if another sim needs queue ordering (a scheduling sim in the OS course would use the same single-machine
  model).

## Review

A fresh reviewer (a separate agent with only the code and SPEC.md) read the folder against SPEC.md, recomputed the
maths and every preset number independently (exact fractions, 2 000 random brute-force cases: all agree), and ran 41
mutations on a copy. My own 21 rule mutations were all caught before the review. Fixed from the review:

- **Page:** the project's sliders vanished when the selected project left play (`?proj=sso&n=3`): `visible` now uses
  the normalised `proj`; a key press on a greyed ▲ ▼ left a pending refocus that later pulled focus into the stage;
  the rule buttons' `aria-label` now includes "★ least" / "+…".
- **Tests:** 17 missed mutants killed with new tests (tie pair in ratio order and at n = 4, the note order, the last
  neighbour pair, the rest of the order string kept in present order, duplicates, the end of a shorter queue, a
  project out of play, snapping, Infinity, n = 2, loudness 0, `"4"`, the bars' scale, exact ratios in the module).
  Still uncaught, and equivalent (no observable change): Math.round of the shown ratio, clamp-then-snap order, the
  tie scan in list order, the swap guard; upper-case letters in `order` are outside SPEC.
- **SPEC:** rule 1c (the tie note shows whether or not the queue is best), rule 1e (the "your order" row names the
  matching rule), the kit's own reset of an unknown `order` from a URL.
- **Words:** "only when" → "always … when" (shortest first is also best when it happens to agree with the ratio);
  rules renamed longest / shortest first to match the explanation; Croatian agreement ("je već na prvom mjestu"),
  "Ispunjeno", the quick-wins and loud hints, the caption and the concept line.

## Time

Started 2026-11-07 10:36, done 10:57 (Europe/Zagreb), one session.
