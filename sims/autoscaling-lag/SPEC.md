<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# autoscaling-lag: specification

Task `docs/tasks/w3/autoscaling-lag.md`, catalogue `perf-autoscaling-lag` (§4.8). One concept: **provisioning lead
time against load spikes; spot preemption**. An explorer: the state is a pure function of the params,
`compute(params)` in `sim.js`, a run of 8–12 ticks drawn at once.

Sources: dc-sim (`/home/rjasmin/projects/dc-sim`): `src/dc_sim/skin/resources.py` (`ResourceManager`: a block counts
when past its lead time, not preempted and its failure domain not down), `tests/unit/test_resources.py` (the oracle for
lead time, preemption and domain outages), `scenarios/resource_provisioning.yaml`, `scenarios/spot_and_failure_domains.yaml`
(expected ρ per tick in its header comment), `src/dc_sim/org/team.py` (`TARGET_UTILIZATION = 0.7`,
`required_capacity = λ / 0.7`). ρ and p99 are `utilisation-latency`'s `queueMetrics` (dc-sim `kernel/queueing.py`),
copied into `sim.js` because `models/` has no promoted model yet (COMMON.md §6).

## Params

| Param | Values | Default | Notes |
|---|---|---|---|
| `scenario` | `spike`, `provisioning`, `spot` | `spike` | `provisioning` = dc-sim `resource_provisioning`, `spot` = dc-sim `spot_and_failure_domains` |
| `lead` | 1, 4, 9 ticks | 4 | lead time of every order the autoscaler (or the pre-provisioning plan) places |
| `spike` | on / off | on | spike scenario only: demand 8, and 16 at ticks 2–6 |
| `baseline` | 5–20, step 1 | 10 | spike scenario only: the capacity online from tick 0 |
| `policy` | `none`, `reactive`, `pre` | `reactive` | no autoscaler (dc-sim's own scenarios have none), the reactive autoscaler (rule 2), or pre-provisioned (rule 6) |

`spike` and `baseline` are hidden outside the spike scenario. `lead` is disabled, with the reason, when `policy` is
`none` (nothing is ordered) and in the provisioning scenario (its block keeps lead 3, and neither policy orders there:
5 + 10 on order ≥ 8 / 0.7, and demand is flat). Units: capacity and demand in requests per second (dc-sim: a node's capacity is its service rate), p99 in
seconds, cv² = 1 everywhere (both dc-sim scenarios).

## Scenarios

| id | ticks | demand | blocks online at tick 0 | scheduled events |
|---|---|---|---|---|
| `spike` | 12 (0–11) | 8; 16 at ticks 2–6 when `spike` is on | baseline `baseline` | none |
| `provisioning` | 8 (0–7, the yaml's `ticks: 8`) | 8 | baseline 5 (db's own capacity) | a reserved block of 10, ordered at tick 0 with lead **3** (the yaml's, not the `lead` param) |
| `spot` | 9 (0–8, `ticks: 9`) | 20 | 10 in rack-a, 10 in rack-b (baseline), 8 spot | rack-a down at tick 2 for 3 ticks; the spot block preempted at tick 6 |

The SLO is p99 ≤ **1 s** (both yamls' `p99_latency_target: 1.0`; the spike scenario uses the same).

## Rules

1. **Capacity** at tick t is the sum of the active blocks: a block ordered at tick o with lead L comes online at tick
   o + L (active from that tick on); blocks of the scenario are online from tick 0 (dc-sim `provision`,
   `is_active`: `activation ≤ tick`; lead 0 is the same tick). dc-sim `test_reserved_resource_waits_for_lead_time`:
   ordered at 0 with lead 3 → 0 at ticks 0 and 2, 10 at tick 3.
2. **Reactive autoscaler** (derived, not in dc-sim; policy `reactive` and `pre`): after tick t's metrics, if
   ρ(t) > 0.8, order `demand(t) / 0.7 − capacity(t) − on order(t)`, where *on order* is the sum of orders placed at or
   before t that come online after t (from every source: the autoscaler, the pre-provisioning plan, the scenario's
   own reserved block). Nothing is ordered when that amount is ≤ 1e-9 (floating-point remainder). The order comes
   online at t + `lead`. Autoscaler orders are reserved blocks in the default failure domain (no outage touches them).
   0.7 is dc-sim's `TARGET_UTILIZATION` and its `required_capacity = λ / 0.7`.
3. **Disruptions:** a failure domain down from tick f for d ticks removes its blocks at ticks f … f + d − 1 and they
   return at f + d (dc-sim `is_domain_down`: `tick < until`; `test_domain_failure_only_zeroes_matching_domain_resources`).
   A preempted block leaves at its tick and never comes back by itself (dc-sim `preempt`, no restore scheduled;
   `test_scheduled_spot_preemption_zeroes_capacity_from_that_tick`).
4. **ρ and p99** per tick from `utilisation-latency`: ρ = demand / capacity; p99 = ln 100 × (1 + cv²)/2 /
   (capacity × (1 − min(ρ, 0.999))); `saturated = ρ ≥ 1` (the page shows "∞" instead of the clamped number).
5. **Tie-break:** ρ exactly 0.8 does **not** trigger the autoscaler (strict >). The spike scenario's quiet ticks sit
   on it: demand 8 on capacity 10.
6. **Pre-provisioned** (policy `pre`, derived): the demand plan is known ahead, failures and preemptions are not. For
   every tick r where the planned demand rises (demand(r) > demand(r − 1)), order `demand(r) / 0.7 − planned(r)` at
   tick r − `lead`, where planned(r) is every block and order that will be online at r, ignoring disruptions; the
   order may be placed before the run starts (a negative tick). The reactive rule 2 stays on as a backstop. In the
   dc-sim scenarios demand is flat, so `pre` behaves like `reactive`: preemption cannot be planned for.
7. **Verdict per tick:** `saturated` (ρ ≥ 1), `over` (p99 > SLO), `ok` (p99 ≤ SLO; exactly at the SLO is met).
   "Changed" marks the ticks whose verdict differs from the run before the last parameter change (same scenario
   only: a new scenario is a new run, nothing is marked).

No scale-in, cool-down, predictive scaling, cost or retries (out of scope, task file).

## State

`{ scenario, policy, spike: {from, to} | null, n, slo, ticks: [tick ×n], orders: [order], blocks: [{id, kind, amount, domain}] }`
(`spike` is set only in the spike scenario with the spike on), where
`tick = { t, demand, capacity, rho, p99, saturated, verdict, ordered, online, parts: {baseline, reserved, spot},
active: [{id, kind, amount}], down: [{id, kind, amount, why: 'domain' | 'reclaimed'}] }` (`ordered`: amount ordered at that tick; `online`: amount
coming online at that tick) and `order = { id, by: 'auto' | 'pre' | 'plan', at, online, amount }`. Plain JSON.

## Caption choice (`captionKey(state, params)`, first that applies)

1. `spot`: spot scenario and no autoscaler order (the task's en caption).
2. `provisioning`: provisioning scenario and no autoscaler order.
3. With an autoscaler order (`captionOrder`: with a spike, the first one placed at or after the spike's first tick,
   its reaction to the spike, else the first one; at a, online at b): `beyondRun` when b ≥ n; `tooLate` when there is
   a spike and b is after its last tick (6); else `lag` (the task's hr caption, slow-scaler, with the spike clause only
   when there is a spike; tie: b = 6 is `lag`, "one tick before the spike ends", b = 7 is `tooLate`).
4. `pre` / `preSat`: a pre-provisioned order and no autoscaler order; `preSat` when ticks still saturate (a baseline
   below the quiet demand: the pre order is already on order at ticks 0–1, so the reactive backstop waits for it).
5. `noScaler`: saturated ticks and no order at all (policy `none`).
6. `noScalerCalm`: policy `none`, nothing saturated (ρ may be above 0.8: there is no autoscaler to say it waits).
7. `calm`: nothing saturated and nothing ordered with an autoscaler on, so every ρ ≤ 0.8 (spike off: ρ 0.8 does not
   trigger, p99 2.30 s is already over the SLO).

## Presets and expected numbers (checked with a script before coding, and by `sim.test.js`)

| # | id | Params | Expected |
|---|---|---|---|
| 1 | `dc-sim-provisioning` | provisioning, policy none | ticks 0–2: capacity 5, ρ 1.6, saturated; tick 3 on: capacity 15, ρ **0.533**, p99 **0.658 s** ≤ 1 |
| 2 | `fast-scaler` | spike on, baseline 10, lead 1, reactive | ticks 0–1 ρ 0.8 (no order), p99 2.30; tick 2 saturated, order 12.86 → tick 3; ticks 3–6 capacity **22.9**, ρ 0.70, p99 **0.672**; ticks 7–11 ρ 0.35, p99 0.310 |
| 3 | `slow-scaler` | lead 4 | saturated ticks **2–5**; order at 2 → online 6 (one tick before the spike ends), no second order at 3–5 (on order covers it); tick 6 ρ 0.70 |
| 4 | `too-late` | lead 9 | ticks **2–6** saturated; ticks 7–10 back to ρ 0.8; **12.9** online at tick 11, ρ **0.35** |
| 5 | `spot-and-domains` | spot, policy none | ticks 0–1 capacity 28, ρ **0.714**, p99 0.576; ticks 2–4 capacity 18, ρ 1.11, **saturated**; tick 5: 28; ticks 6–8 capacity 20, ρ **1.0**, saturated |

Also: pre-provisioned, lead 4: order 12.86 at tick −2, online at 2, no saturated tick. Spot with reactive, lead 4:
order 10.57 at tick 2 (ρ 1.11), online at 6: ticks 6–8 capacity 30.6, ρ 0.654. Spot with reactive, lead 9: order at
2 → 11, beyond the run; at tick 6 (ρ 1.0) nothing more is ordered (on order 10.57 covers 28.57 − 20). Provisioning
with reactive: no order (5 + 10 on order ≥ 8 / 0.7 = 11.43).

## Tie-breaks (tested first)

- ρ exactly 0.8 → no order; ρ above it (demand 8.01 on 10) → order.
- Capacity already on order counts: the slow scaler orders once, not at ticks 3, 4, 5.
- A block is active at its online tick (activation ≤ tick), not one later.
- Domain down for d ticks: back at f + d exactly.
- ρ exactly 1 → saturated (spot ticks 6–8).
- p99 exactly at the SLO → `ok`.
- `lag` vs `tooLate`: online at the last spike tick is `lag`.
