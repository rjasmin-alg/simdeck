<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# utilisation-latency: notes

New explorer (task `docs/tasks/w2/utilisation-latency.md`, catalogue `perf-utilisation-latency` §4.8, wave 2b). No kit
view fits (a curve plot is none of K1–K4), so the page draws its own SVG, measured in CSS pixels after layout (1:1, no
viewBox; labels measured with `getComputedTextLength`), redrawn by a `ResizeObserver`. Gauges, queue and chain are
HTML. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Port, not invention.** `queueMetrics` is dc-sim's `compute_queue_metrics` (P-K mean wait, W = Wq + 1/C, the
  scaled p99, clamp 0.999, `saturated = ρ ≥ 1`) plus L and Lq by Little's law and the zone; `chainMetrics` is its
  `default_load_resolver` (a node passes on min(offered, C) × weight) and `end_to_end_metric`. Pure functions over
  plain data, no strings: promotable to `models/` unchanged if `littles-law`, `tail-latency`, `iops-latency` or
  `retry-storm` reuse them.
- **The chain gets the main server's λ.** The task gives the chain no own params; feeding it the same arrival rate
  (λ = load × C) makes the load slider drive it, and load 50 % at C 10 is exactly the scenario's rate 5. At C 100
  the slider reaches λ 100, so the chain's db (C 15) saturates from 15 % on: the slowest tier for its capacity enters
  the knee first.
- **Fixed y axis, a hundred service times** (10 s at C 10, 1 s at C 100). A fixed axis shows the explosion; an axis
  that rescales with the point would hide it. W reaches the top at ρ 0.99 (cv² 1), the near-full preset. A value off
  the plot gets an arrow at the top edge and its number beside it; each curve ends in an arrowhead where it leaves the
  plot (the legend's "unbounded" arrow), and the dashed red line at ρ = 1 is labelled "unbounded".
- **Knee band ρ 0.8–1** (hatched), the zones `below` / `knee` / `saturated` with the task's thresholds 0.8 and 1
  (ties go up). "Changed" (yellow + outline) marks the ρ gauge, or a chain node, whose zone differs from the one before
  the last change; pure `crossed()` in `sim.js`.
- **Captions** (pure `captionKey`, first that applies, SPEC.md): saturated; chain shown; capacity changed → the state;
  cv² changed (alone, or upwards with the load) → both cv² compared **at the current load**, so the variability preset
  (which moves load 50 → 10 too) reads "cv² 1 → 9 at load 10 %: mean ×1.4, p99 ×5. The tail grows faster than the mean"
  (that last sentence only when cv² went up and p99 grew more than the mean); load changed from a bounded state →
  the task's en caption ("From 90 % to 99 % load, the mean time in the system goes from 1.00 s to 10.0 s (×10), and p99
  from 4.61 s to 46.1 s."); else the state, the task's hr caption ("Opterećenje (*utilisation*) 90 %: …, 10 puta dulje od
  samog posluživanja …"; "deset puta" written as a number so it follows the slider). Below 1.1 service times the state
  caption says the request hardly waits. Ratios have two significant digits (×0.22, never ×0). The page remembers the
  params before the last change; a redraw of the same state (theme, resize) keeps them.
- **Queue drawing:** Lq (mean number waiting) as boxes, the fraction as a dashed box filled to its share, at most 24
  boxes then "+n"; saturated shows "+∞" and "grows without bound". The server box fills to ρ.
- **Numbers:** three significant digits (0.200 s, 4.61 s, 46.1 s), decimal comma on the Croatian page.
- **Click or drag on the plot** sets the load (the slider does the same).
- **Panel:** the settings group's reset button is hidden (CSS): the explorer's transport bar has the same reset with
  the same `R` key (as `rpo-rto`).
- **Concepts, not tools:** the chain's tiers are "API", "cache", "database", "audit"; no products named.
- `related`: none. `littles-law`, `tail-latency`, `iops-latency`, `retry-storm` (named in the task) do not exist yet.
- Topic `distributed`, tag `performance`, level `advanced` (the task's); all exist in `tags.json`.

## Deviations from the task

- **Preset numbers in three significant digits:** the task writes W 0.20 s / p99 0.92 s; the page shows 0.200 s and
  0.921 s. The preset hints keep the task's short forms.
- **The knee preset is ρ 0.9** and near-full ρ 0.99 (the task's bold numbers); ρ 0.8 and 0.95 are in the tests and
  in SPEC, reached with the slider.
- **p99 is time in the system, not waiting:** the task's hr caption says "1 % zahtjeva čeka više od 4,6 s"; the page says
  "1 % zahtjeva u sustavu provede više od 4,61 s" (and "1 % of requests spend more than"), since p99 includes service.
- **Croatian title** "Kašnjenje pri gotovo punoj iskorištenosti" (the English is "near full"; "pri punoj" alone means
  "at full").
- **The chain's SLO is fixed at 2 s** (the scenario's flow SLO), also at C 100.
- **p99 at cv² ≠ 1 is dc-sim's scaled approximation** (rule 3). At cv² 0 and low load it overstates the tail (2.3/C
  against a true 1/C); the explanation says the p99 curve is exact only at cv² = 1.

## Sources

- dc-sim (`/home/rjasmin/projects/dc-sim`): `src/dc_sim/kernel/queueing.py`, `src/dc_sim/kernel/engine.py`
  (`end_to_end_metric`, `default_load_resolver`), `docs/concepts.md` §2 and §6, `tests/unit/test_queueing.py`
  (M/M/1 closed forms; `test_higher_cv2_inflates_tail_more_than_mean`), `scenarios/three_tier_chain.yaml`.
- L. Kleinrock, *Queueing Systems, Vol. 1: Theory*, Wiley 1975: M/M/1 and the Pollaczek–Khinchine mean value formula
  *(check: section numbers cited from memory in SPEC.md)*.
- Numbers checked with a script reimplementing dc-sim's formulas (dc-sim itself needs pydantic, not installed here)
  before the page; all of the task's figures reproduce.
- NLA T41/T42 for course placement *(check: not opened)*.

## Term pairs

Missing from `kit/glossary.js` (only *latency* — latencija is there), written out in the strings (*English*
(Croatian) on Croatian pages):

| English | Croatian | Note |
|---|---|---|
| utilisation | iskorištenost (opterećenje) | task |
| queue | red čekanja | task |
| arrival rate | stopa dolazaka | task |
| service time | vrijeme posluživanja | task |
| percentile | percentil | task |
| saturation | zasićenje | task |
| coefficient of variation | koeficijent varijacije | task |

## Shared requests

- None for the kit. If the queueing sims named above come, promote `queueMetrics`, `chainMetrics`, `zone`,
  `utilization` and `sloMet` to `models/queueing.js` (with `CLAMP`, `KNEE`).

## Review

A fresh reviewer (subagent, no shared context) read the diff against SPEC.md, recomputed every preset number (all
match) and broke rules on purpose. Fixed from its findings: the load caption after a saturated state ("100 s → 1 s"),
a capacity change captioned as a load change, the variability preset captioned as a load change, ratios rounding to
×0, the fixed "tail grows much faster" sentence, "same λ" in the chain title and explanation (a saturated tier passes
on only its capacity), the knee label colliding with a curve's head label at cv² 4, p99 described as waiting, the
Croatian title, and a test for the clamped p99 between 0.999 and 1. Survivors it reported that change nothing
observable (weight accumulation rewrites, Lq = L − ρ, which is the same number) are left.

## Checks

- `node --test sims/utilisation-latency/sim.test.js`: 25 tests. Every rule and tie-break broken once on purpose
  (18 mutations, before the review: both zone ties, the saturation tie, the clamp, the P-K factor, W = Wq + 1/C, p99, L, Lq, the
  propagation clamp, the e2e weight and saturation, the SLO tie, λ, three caption branches, both `crossed` branches):
  each makes a test fail.
- `npm run gate -- utilisation-latency`: all rules pass; screenshots at 1920×1080 light, dark, grayscale and
  375×812 in both languages reviewed, plus the chain, near-full, saturated (load 100 %, cv² 9, C 100, chain on) and
  low-load (3 %, cv² 0) states.

## Time

Start 2026-10-24 09:06 CEST, done 09:30 CEST: about 25 minutes, one session (including the fresh review and its fixes).
