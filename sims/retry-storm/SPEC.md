<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# retry-storm: specification

Task `docs/tasks/w3/retry-storm.md`, catalogue `perf-retry-storm` (§4.8). One concept: **retries keep a recovered
system down; backoff, jitter, admission control**. A stepper: one step is one tick.

The model is a port of dc-sim's `metastable_collapse` scenario (`/home/rjasmin/projects/dc-sim`):
`src/dc_sim/skin/retry.py` (`retry_multiplier`, `RetryAwareLoadResolver`, `shed_fraction`) on
`scenarios/metastable_collapse.yaml`, with the db's metrics from `utilisation-latency`'s `queueMetrics` (itself a port
of dc-sim's `compute_queue_metrics`; copied into `sim.js` because `models/` has no queueing model yet).
`docs/concepts.md` §4 states the one-tick lag and that no backlog is carried between ticks. The phenomenon:
N. Bronson, A. Aghayev, A. Charapko, T. Zhu, "Metastable Failures in Distributed Systems", HotOS 2021.

## Scene

clients → **api** (capacity 1000, never the bottleneck; times out after `timeout` and retries) → **db** (capacity C,
the bottleneck). Units: rates in requests per second, times in seconds, one tick = one reading.

## Params

| Param | Values | Default | Notes |
|---|---|---|---|
| `capacity` | `10`, `15`, `10-15` | `15` | db capacity C; `10-15` is 10 raised to 15 at tick 5 (the task's `capacityAt5`) |
| `retryFactor` | 0, 0.5, 3 | 3 | extra calls per call at full breach; 0.5 stands for backoff with jitter (rule 6) |
| `spikeAt` | −1 (none), 2 | 2 | a one-tick spike: demand 14 instead of 9 at that tick |
| `shed` | `off`, `from5`, `5-6` | `off` | admission control at the db turning away 0.8 of the offered load: from tick 5 on for good (dc-sim's test), or for ticks 5–6 only (the task's `shed` 0 / 0.8 and `shedTicks`) |

Fixed: base demand 9, timeout 1 s, cv² 1, spike demand 14, intervention tick 5, shed share 0.8, shed window 5–6,
raised capacity 15. The task's six params are four controls here, so the panel fits at 1920×1080 (NOTES.md).

## Rules

1. **Retry multiplier, from last tick** (dc-sim `retry_multiplier`). If the db's p99 of the **previous** tick is
   greater than the timeout and `retryFactor` > 0: breach = min(1, (p99 − timeout) / timeout), multiplier =
   1 + retryFactor × breach. Otherwise (tick 0, p99 ≤ timeout, or retryFactor 0) multiplier 1, breach 0.
   Tie: p99 exactly equal to the timeout is no breach (dc-sim `prev.p99 <= caller.timeout`).
2. **Offered load at the db** (dc-sim `RetryAwareLoadResolver`): λ = demand × multiplier × (1 − shed), where demand is
   the api's processed load (min(demand, 1000) = demand) and shed is the share in force this tick. Split for the
   chart: original = demand × (1 − shed), retries = λ − original, turned away = demand × multiplier × shed.
3. **db metrics** (utilisation-latency rules 1–4): ρ = λ / C; p99 = ln 100 × (1 + cv²)/2 / (C × (1 − min(ρ, 0.999)));
   saturated = ρ ≥ 1 (tie: ρ exactly 1 is saturated). A saturated tick's p99 is shown as unbounded (∞).
4. **Order within a tick** (dc-sim's): (a) this tick's interventions (capacity, shed, the spike's demand), (b) the
   multiplier from last tick's p99, (c) λ, (d) metrics, (e) record; this tick's p99 becomes the next tick's input.
5. **Bistability (metastable failure).** With enough retry pressure the high-load state sustains itself after its
   trigger is gone: saturated → p99 far above the timeout → breach 1 → multiplier 1 + retryFactor → λ =
   demand × (1 + retryFactor) ≥ C → saturated again.
6. **Raising capacity after the collapse may not escape it**: the amplified demand (36) still exceeds the new
   capacity (15) (dc-sim `test_capacity_raised_after_collapse_does_not_fully_recover`).
7. **Admission control breaks the loop**: shed cuts λ directly, below C, so p99 falls, the breach and with it the
   retries fall next tick (dc-sim `test_shedding_after_collapse_recovers_without_extra_capacity`).
8. **Backoff and jitter** are not in dc-sim; here they are a lower `retryFactor` (fewer extra calls per breach),
   derived *(check)*: the practice is described in Amazon Builders' Library, "Timeouts, retries, and backoff with
   jitter" *(check: not opened)*.
9. **No backlog**: each tick's metrics are a fresh snapshot of that tick's λ / C (dc-sim concepts §4).

## Events (on the timeline)

At tick `spikeAt`: `spike`. At tick 5: `capacity` when the capacity differs from tick 4's (`10-15`); `shedOn` when shed
is not `off`. At tick 7: `shedOff` when shed is `5-6`.

## Steps

One per tick; step 0 is before tick 0, step n computes tick n − 1. `steps(p)` = 10 with a spike, else 15 with an
intervention (shed, or capacity `10-15`), else 8. So presets 1–2: 8, 3–4: 15, 5–7: 10 (the task's). The default
(the `metastable` preset's params) has 10, `sim.json` `steps` 10.

## State

`{ tick, base, timeout, retryFactor, capacity, shed, prevP99, history: [record] }`; `tick` is the last tick computed
(−1 at step 0), `capacity` and `shed` those in force at it, `prevP99` the last record's p99 (null at step 0).
`record = { tick, demand, breach, mult, lambda, original, retries, turnedAway, shed, capacity, rho, p99, saturated,
events }`. Plain JSON.

## Story (`story(state, params)`, the caption's closing sentence; first that applies)

On the last record r (null at step 0):

1. saturated and the capacity was raised (r.capacity > the capacity at tick 0) → `capacityTooLate`.
2. saturated, demand back at base, and an earlier tick had the spike with no saturated tick before it (the spike tipped
   a healthy system over) → `stuck` (the task's hr caption). Tie: C 10 with a spike collapsed at tick 1 already, so
   it is `storm`, not `stuck`.
3. saturated and multiplier > 1 → `storm`.
4. saturated → `overload` (the demand alone is over capacity, no retries).
5. shed in force, and multiplier 1 and p99 ≤ timeout → `shedHealthy` (healthy, but 80 % is turned away).
6. shed in force → `shedding`.
7. multiplier 1, p99 ≤ timeout, shed was in force at an earlier tick and an earlier tick had retries → `recovered`
   (the task's en caption). Without earlier retries there was nothing to recover from: `healthy`.
8. p99 > timeout and retryFactor 0 → `slowNoRetry` (the API never retries, so never "retries next tick").
9. p99 > timeout and multiplier > 1 → `overTimeout` (not saturated, but over the timeout).
10. p99 > timeout → `breach` (retries come next tick).
11. otherwise `healthy`.

## Presets and expected numbers (base 9, timeout 1, cv² 1; checked with a script reimplementing dc-sim, and by `sim.test.js`)

| # | id | Params | Steps | Expected (db) |
|---|---|---|---|---|
| 1 | `collapse` | C 10, retry 3, no spike | 8 | tick 0: λ 9, ρ 0.9, p99 4.61 > 1 → tick 1: mult 4, λ **36**, ρ 3.6, saturated, every tick after (dc-sim test: final λ > 18, p99 > 10, saturated) |
| 2 | `prevented` | C 15, no spike | 8 | λ 9, ρ 0.6, p99 **0.768** every tick, mult 1 |
| 3 | `capacity-too-late` | preset 1, capacity 15 from tick 5 | 15 | ticks 1–4 λ 36 ρ 3.6; ticks 5–14 λ 36, ρ 2.4, **still saturated**, p99 > 10 |
| 4 | `shed-dc-sim` | preset 1, shed 0.8 from tick 5 on | 15 | tick 5 λ 7.2 (ρ 0.72, p99 1.65), tick 6 λ 5.28 (mult 2.93, p99 0.976), tick 7+ λ **1.8**, p99 0.562; 7.2/s of 9 turned away for good |
| 5 | `metastable` | C 15, spike at 2 (default) | 10 | ticks 0–1 λ 9; tick 2 λ 14, ρ 0.933, p99 4.61 → tick 3+ λ **36**, ρ 2.4, saturated, demand 9 |
| 6 | `gentler-retries` | preset 5, retry 0.5 | 10 | tick 3+ λ **13.5**, ρ 0.9, p99 3.07: never saturated, over the timeout every tick |
| 7 | `shed-briefly` | preset 5, shed 0.8 ticks 5–6 | 10 | tick 5 λ 7.2 (ρ 0.48, p99 0.590), tick 6 λ 1.8 (mult 1), tick 7+ λ **9**, p99 0.768 |

## Tie-breaks (tested first)

- Previous p99 exactly equal to the timeout → multiplier 1 (no breach). Equivalent either way: `<` instead of `<=`
  gives breach 0 and so multiplier 1 too (also in dc-sim); the test documents it but cannot fail.
- Breach is capped at 1: p99 460 s gives multiplier 1 + retryFactor, not more.
- retryFactor 0 → multiplier 1 whatever the p99.
- ρ exactly 1 → saturated.
- Tick 0 has no previous p99 → multiplier 1 even after a change of params.
- Shed `5-6`: in force at ticks 5 and 6, off at 4 and 7; `from5`: in force at 5 and 14.
- Capacity `15` has no `capacity` event at tick 5 (nothing changes); `10-15` is 10 at tick 4 and 15 at tick 5.
- The spike tick's demand is 14 and only that tick's; the tick after is back to 9 (before retries).
