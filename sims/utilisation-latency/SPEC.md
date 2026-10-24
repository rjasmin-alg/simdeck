<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# utilisation-latency: specification

Task `docs/tasks/w2/utilisation-latency.md`, catalogue `perf-utilisation-latency` (§4.8). One concept: **waiting time
explodes as ρ → 1**. An explorer: the state is a pure function of the params, `compute(params)` in `sim.js`.

The queueing formulas are a port of dc-sim's analytical M/G/1 kernel (`src/dc_sim/kernel/queueing.py`:
`utilization`, `pk_wait_time`, `mean_sojourn_time`, `p99_latency`, `compute_queue_metrics`; `docs/concepts.md` §2
and §6), the chain of its `end_to_end_metric` and `default_load_resolver` (`src/dc_sim/kernel/engine.py`) on
`scenarios/three_tier_chain.yaml`. Standard reference: L. Kleinrock, *Queueing Systems, Vol. 1: Theory*, Wiley 1975,
§3.2 (M/M/1) and §5.6 (the Pollaczek–Khinchine mean value formula) *(check: section numbers from memory)*.

## Params

| Param | Values | Default | Notes |
|---|---|---|---|
| `load` | 0–100 %, step 1 | 50 | offered load as a share of capacity |
| `capacity` | 10, 100 req/s | 10 | C, the server's service rate μ (mean service time 1/C) |
| `cv2` | 0, 1, 4, 9 | 1 | squared coefficient of variation of the service time: 0 deterministic, 1 exponential (M/M/1) |
| `chain` | on / off | off | show the three-tier chain, fed with the same arrival rate λ |

## Rules

Units: rates in requests per second, times in seconds.

1. **Arrival rate and utilisation.** λ = `load`/100 × C; ρ = λ / C (dc-sim `utilization`). With C = 0 ρ is ∞ for
   λ > 0 and 0 for λ = 0 (dc-sim; unreachable from the page, kept for the ported function).
2. **Pollaczek–Khinchine mean wait** (M/G/1): Wq = ρ/(1 − ρ) × (1 + cv²)/2 × 1/C; time in system W = Wq + 1/C.
   At cv² = 1 this is M/M/1: W = 1/(C − λ) (dc-sim `test_mm1_mean_sojourn_matches_closed_form`).
3. **p99** = ln(100) × (1 + cv²)/2 / (C × (1 − ρ)). Exact for M/M/1 (the sojourn time is exponential with rate
   C − λ, so p99 = ln 100 / (C − λ)); for cv² ≠ 1 a scaled approximation, dc-sim's own modelling choice (its
   docstring). At cv² = 0 and low load it overstates the tail (a deterministic server alone has p99 = 1/C, the
   formula gives 2.3/C); the explanation says the p99 curve is exact only at cv² = 1.
4. **Saturation.** ρ ≥ 1 has no steady state. `saturated = ρ ≥ 1`; the formulas take ρ clamped to **0.999**
   (dc-sim `_RHO_SATURATION_CLAMP`) so every number stays finite, and the page shows "unbounded" instead of the
   numbers of a saturated node. ρ itself is reported unclamped.
5. **Little's law:** L = λ × W (mean number in system); Lq = λ × Wq (mean number waiting, the queue drawn).
6. **Chain.** Nodes of `three_tier_chain`: api (C 100, cv² 1, calls cache × 1 and audit × 0.2), cache (C 20, cv² 2,
   calls db × 1), db (C 15, cv² 1), audit (C 50, cv² 1); entry api with rate λ (the main server's arrival rate;
   λ = 5 req/s at load 50 % and C 10 is the scenario's rate). Offered load is propagated in topological order: each
   node passes on min(offered, C) × weight (dc-sim `default_load_resolver`: a saturated node passes on only what it
   processes). Each node gets rules 1–5. **End-to-end p99** = p99(entry) + Σ weight × end-to-end(callee)
   (dc-sim `end_to_end_metric`): api + cache + db + 0.2 × audit. It is unbounded when any node it sums is saturated.
   The scenario's SLO is p99 ≤ 2 s; met when end-to-end ≤ 2 (equal counts as met) and not saturated.
7. **Zones.** `below` ρ < 0.8; `knee` 0.8 ≤ ρ < 1; `saturated` ρ ≥ 1. The knee band on the curve is ρ 0.8–1.
   "Changed" marks a gauge (the server's ρ, or a chain node) whose zone differs from the one before the last change.

## State

`{ lambda, service, server: node, chain: { nodes: [node ×4], e2e, e2eSaturated, sloMet, slo } | null }` where
`node = { id, lambda, capacity, cv2, rho, wq, w, p99, L, Lq, saturated, zone }`; chain nodes add `weight` (their
weight in the end-to-end sum: 1, 1, 1, 0.2). Plain JSON.

## Caption choice (`captionKey(state, params, prev)`, first that applies)

`prev` is the params before the last change (null on first load).

1. `saturated`: the server is saturated (load 100 %).
2. `chain`: the chain is shown (end-to-end p99 as the sum, against the SLO).
3. `state` when there is no previous change or the capacity changed (every time scales; nothing to compare).
4. `cv2`: cv² changed, alone or upwards together with the load. The page compares both cv² **at the current load**
   (the variability preset moves load 50 → 10 and cv² 1 → 9; its caption is the ×1.4 / ×5 at load 10). Both changed
   with cv² going down (variability → knee) is a new state, not a variability story: `state`.
5. `load`: only the load changed, and the previous state was bounded (from load 100 there are no numbers to start
   from: `state`). The task's en caption: "From 90 % to 99 % load, the mean time in the system goes from 1 s to 10 s".
6. `state`: otherwise (the task's hr caption: load, W, × service time, p99).

## Presets and expected numbers (C = 10 req/s, cv² = 1 unless stated; checked with a script against dc-sim's formulas, and by `sim.test.js`)

| # | id | Params | ρ | W | p99 | L | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `half-load` | load 50 | 0.5 | **0.20 s** | **0.921 s** | 1.0 | service alone 0.1 s |
| 2 | `knee` | load 90 | 0.9 | **1.00 s** | **4.61 s** | 9.0 | at 0.8: W 0.50, p99 2.30 |
| 3 | `near-full` | load 99 | 0.99 | **10.0 s** | **46.1 s** | 99.0 | at 0.95: W 2.0, p99 9.21 |
| 4 | `variability` | load 10, cv² 9 | 0.1 | 0.156 s | 2.56 s | 0.0156 | cv² 1: W 0.111, p99 0.512 → ×1.4 and ×5.0 (dc-sim `test_higher_cv2_inflates_tail_more_than_mean`) |
| 5 | `three-tier-chain` | load 50, chain on | 0.5 | 0.20 s | 0.921 s | 1.0 | λ 5: p99 api 0.0485, cache 0.461, db 0.461, audit 0.0940 → end-to-end **0.988 s** ≤ 2 s |

Also: load 100 → ρ 1, saturated, W and p99 computed at 0.999 (W 100 s, p99 461 s), shown as unbounded. C 100 scales
every time by 1/10 (ρ 0.9: W 0.100 s, p99 0.461 s). Chain at λ 15 (load 15 %, C 100): db ρ 1, saturated, end-to-end
unbounded.

## Tie-breaks (tested first)

- ρ exactly 1 → saturated (ρ ≥ 1); ρ 0.99 → not saturated.
- ρ exactly 0.8 → zone `knee`; 0.79 → `below`.
- ρ above the clamp but below 1 (0.9995) → computed at 0.999, not saturated.
- Load 0 → λ 0, ρ 0, Wq 0, W = 1/C, L 0 (p99 = ln 100 × (1 + cv²)/2 / C).
- Chain: a saturated node passes on only what it processes, min(offered, C) × weight: at λ 50 cache is offered 50
  and db 20 (cache's C), not 50.
- End-to-end SLO: exactly 2 s → met.
- Caption: a change of both load and cv² is `cv2` when cv² went up, `state` when it went down; a capacity change is
  `state`; a load change from a saturated state is `state`.
