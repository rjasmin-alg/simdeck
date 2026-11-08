<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# tail-latency: notes

New explorer (task `docs/tasks/w3/tail-latency.md`, catalogue `perf-tail-latency` §4.8, wave 3). No kit view fits (a
sorted-bar sketch and a fan of calls are none of K1–K4), so the page draws two SVGs, measured in CSS pixels after layout
(1:1, no viewBox; labels measured with `getComputedTextLength`), redrawn by a `ResizeObserver`. Gauges and the share
bar are HTML. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Model copied, not shared.** `models/` has no queueing model yet, so `utilization`, `zone` and `queueMetrics` (with
  `CLAMP`, `KNEE`) are copied unchanged from `sims/utilisation-latency/sim.js @ f2e6118` (as `littles-law` and
  `retry-storm` did). Their own rules are tested there; here the tests cover W and p99 as used (rule 1).
- **The backend is fixed at C 10 req/s** (dc-sim `tail_decoupling`'s db; service 0.1 s). The task gives no capacity
  param; ρ is the choice 0.1 / 0.5 / 0.8 and λ = ρ × C.
- **Ratios against cv² 1 at the same ρ** (`ratioMean`, `ratioP99`): the state is a pure function of the params, so
  "how far did cv² move it" is measured from the exponential reference, not from the previous setting. The task's
  caption "cv² 1 → 9: ×1.4 / ×5" is exactly that. The gauges say "×1.4 against cv² 1".
- **p99.9** (for the `slowP` choice) uses dc-sim's tail form with ln 1000 instead of ln 100 (= 1.5 × p99): derived,
  stated in SPEC.md and the explanation. It is drawn as a dotted line and named in the p99 gauge when chosen.
- **The sketch is 100 requests sorted by time**, one bar each, fastest at the bottom: a quantile plot, not a density.
  A density on a linear axis hides the tail (at cv² 9 the density at p99 is under 1 % of the peak), which is the
  opposite of the point. The bar lengths are the quantiles of a gamma distribution fitted to the model's W and p99
  (SPEC.md, "Sketch"; a Weibull or lognormal cannot reach p99/W of 22). The 100th bar is always past p99 ("slowest 1 %",
  coloured past the line): one in a hundred, the same "1 in 100" as the fan-out side. The explanation says the bars are
  a sketch, not a measurement.
- **Fixed time axis per ρ** (4 / 8 / 20 s) so the cv² slider moves the p99 line and the top bars while the mean stays;
  an adaptive axis would hide the movement. At ρ 0.1 cv² 15–16 run past the edge (arrow, value in the label); a wider
  axis made cv² 1 unreadable (everything in the first tenth).
- **Fan-out drawing:** the user request on the left, N backends as a grid filled column by column, cells as large as
  fit; a thin line per call (with an arrowhead up to 24 calls), and one thick arrow to the middle cell of the first
  column (its arrow crosses no other cell), hatched, labelled "slowest". Which call is slowest is schematic; the page
  says the request "answers when the slowest arrives". N = 1 has no "slowest" label.
- **The share bar** is hatched to pSlow, with a tick at q ("one call: 1 %"), the formula 1 − 0.99ᴺ with its value, the
  mean number of slow calls per request (N × q), and the independence note (rule 3, "stated on the page").
- **Captions** (pure `captionKey`, SPEC.md): a left-only change (cv², ρ) tells the left story, a right-only change (N,
  slow line) the right one; anything else (first load, presets, reset) the right story when N > 1, else the left. Left:
  `tail` (the task's hr caption; only when p99's ratio is more than twice the mean's, dc-sim's acceptance condition),
  `cv2Load` (ρ ≥ 0.5: the mean rises too, because the wait grows with cv²), `cv2Up`, `cv2Ref`, `cv2Down`. Right:
  `fanout` (the task's en caption), `fanOne`.
- **"Changed"** marks the gauge (mean, p99, slow share) whose value moved most, by |ln(new/old)|; ties mark all (a ρ
  change at cv² 1 moves W and p99 by the same factor). Pure `moved()` in `sim.js`.
- **`pSlow` uses −expm1(N log1p(−q))**, the same 1 − (1 − q)ᴺ, so N = 1 gives q exactly (1 − 0.99 is 0.010000000000000009).
- **Numbers:** seconds in three significant digits, shares with one decimal (63.4 %, 9.6 %), ratios in two significant
  digits without a trailing zero (×5, ×1.4); decimal comma on the Croatian page.
- **Panel:** the settings group's reset button is hidden (CSS), as in `utilisation-latency`: the transport bar has the
  same reset with the same `R` key.
- **Concepts, not tools:** "server", "user request", "a slow disk", "a pause on one host"; no products. Dean & Barroso's
  paper is cited in the explanation (a paper, not a product) and in Sources.
- Topic `distributed`, tag `performance`, level `advanced` (the task's); all exist in `tags.json`. `related`:
  `utilisation-latency` (the model it builds on).

## Deviations from the task

- **Caption wording.** The hr caption keeps the task's "rep (*tail*) ne" (Croatian first, English in parentheses, as
  the task writes it; `utilisation-latency` does the same with "Opterećenje (*utilisation*)"). The numbers come from the
  state: "5 puta" at cv² 9, other values elsewhere.
- **The 9.6 % / 9.5 % presets show one decimal** (9,6 % / 9,5 %), the task's bold figures; the tests check 9.5618 % and
  9.5208 %.
- **Legend "changed" reads "moved most"** ("pomaknulo se najviše"), the task's definition of the mark.
- **The "slowest call" is schematic** (always the same cell): the model has no per-call times.
- **No separate p99.9 gauge**: the p99 gauge adds "p99.9 …" when the slow line is p99.9; the task names two gauges.

## Sources

- dc-sim (`/home/rjasmin/projects/dc-sim`): `src/dc_sim/kernel/queueing.py` (`p99_latency` docstring: the cv² scaling
  is a modelling choice), `docs/concepts.md` §2 ("doubling cv2 can 5x the tail while the mean barely moves"),
  `scenarios/tail_decoupling.yaml`, `tests/acceptance/test_a_tail_decoupled_from_mean.py` (the oracle for preset 1:
  p99 ratio > 3, mean ratio < 1.5, p99 ratio > 2 × mean ratio).
- J. Dean and L. A. Barroso, "The Tail at Scale", *Communications of the ACM* 56(2), 2013, pp. 74–80: the fan-out
  probability (1 in 100 slow, 100 servers → 63 %) and hedged requests *(check: page numbers from memory; the paper was
  not opened in this session)*.
- `sims/utilisation-latency/` (`SPEC.md` rules 2–3, `sim.js @ f2e6118`).
- Numbers checked with a Python script reimplementing the formulas before the page (all of the task's figures
  reproduce), then by `sim.test.js`.
- The gamma sketch: regularised incomplete gamma by series and continued fraction (the standard method, e.g. Press et
  al., *Numerical Recipes*, §6.2), ln Γ by the Lanczos approximation (g = 7, n = 9 coefficients); checked against
  closed forms (k = 1, k = 3, k = ½ with erf 1) in the tests.

## Term pairs

Missing from `kit/glossary.js` (only *latency* — latencija is there); written out in the strings, *English* (Croatian)
at the first mention on Croatian pages:

| English | Croatian | Note |
|---|---|---|
| tail latency | kašnjenje u repu (repna latencija) | task, *(check)* |
| percentile | percentil | task |
| mean | prosjek | task |
| fan-out | grananje poziva | task, *(check)* |
| variability | varijabilnost | task |
| hedged request | zaštitni (dvostruki) zahtjev | task, *(check)* |

## Shared requests

- None for the kit.
- `models/`: the queueing functions are now copied into four sims (`utilisation-latency`, `littles-law`, `retry-storm`,
  `tail-latency`). Promote `utilization`, `zone`, `queueMetrics`, `CLAMP`, `KNEE` to `models/queueing.js`; this sim
  then drops its copy. A `tailQuantile(lambda, capacity, cv2, q)` (ln(1/q) × vf / (C(1 − ρ)), equal to p99 at q 0.01)
  would replace the local p99.9 factor.

## Review

A fresh reviewer (subagent, no shared context) read the diff against SPEC.md and the task, recomputed every number in
SPEC.md (all correct), ran 54 mutants on a copy and read the page and strings. Fixed from its findings:

- **cv² 0 was described and drawn wrongly**: "every request takes the same time" (it is the *service* time; queueing
  still spreads the time in system), and the gamma sketch drew requests faster than the service time 1/C (52 of 100
  at ρ 0.1). Now the hint and caption say "every service takes the same time", and at cv² 0 the sketch is 1/C + a gamma
  fitted to the wait part (`sketchOf`); the shape search starts past the gamma's maximum p99/mean (28.34 at k 0.0158),
  since that case needs 28.05.
- Six surviving mutants, now killed by new tests: the tie tolerance in `moved` (ρ 0.8 → 0.1 at cv² 1 is a tie only
  within it), a too-loose tolerance, |x − 1| instead of |ln x|, both N = 2 caption boundaries, and the quantile
  positions (i + ½)/n.
- The Croatian explanation named the other sim "pri punoj" instead of "pri gotovo punoj iskorištenosti".
- The summary said the mean "barely moves"; it now says ×1.4.
- SPEC: the lognormal's maximum ratio is 15.0, not 14.9.

Equivalent mutants it reported (no observable change: `cv2 === 0` vs `=== 1` order for integer cv², `p.rho` vs
`m.rho`, `1.5` vs the ln ratio, `!=` vs `!==`, the series cutoff) are left.

## Checks

- `node --test sims/tail-latency/sim.test.js`: 23 tests. The reviewer's mutants plus the cv² 0 floor rerun after the
  fixes: all 7 now fail a test.
- `npm test` (whole repo): 7686 pass. `npm run check`: 0 errors.
- `npm run gate -- tail-latency`: all rules pass; screenshots at 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed, plus presets 1, 3 and 4, cv² 16 at ρ 0.8 with N 200 and p99.9 (everything off the axis), cv² 16
  at ρ 0.1 with N 2, cv² 0 at ρ 0.5, the phone layout with N 100, and dark with preset 1.

## Time

Start 2026-11-08 14:16 CET, done 14:36 CET, one session (including the fresh review and its fixes).
