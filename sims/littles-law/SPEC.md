<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# littles-law: spec

Explorer (task `docs/tasks/w3/littles-law.md`, catalogue `perf-littles-law` §4.8). One concept: **L = λW**, for a
shop, a server and a build farm. The state is a pure function of the params (`compute(params)`); there are no
steps. The time series under the scene is a seeded, deterministic simulation (`trace(params, rng)`), drawn for the
picture; the three numbers come from the rules below, not from the simulation.

## Params

| key | values | default | notes |
|---|---|---|---|
| `system` | `shop`, `server`, `build-farm` | `shop` | picks the units, the ranges and the noun (customers, requests, builds) |
| `solveFor` | `L`, `W`, `lambda` | `L` | the computed quantity; the other two are set by sliders |
| `lambda` | per system, step 1 | 2 | arrival rate λ in the system's λ unit |
| `W` | per system, step 1 | 5 | mean time in the system in the system's W unit |
| `L` | per system, step 1 | 10 | mean number in the system (set when solving for W or λ) |
| `places` | per system, step 1 | 30 | places in the box (shop floor, worker threads, build agents); each item holds one for its whole stay |
| `fromQueue` | boolean | false | "W from the queue": W computed from λ and a single server's capacity C |
| `capacity` | per system, step 1 | 3 | C, service rate of that single server, in the λ unit (only with `fromQueue`) |

Per-system units and ranges (all step 1, so every slider has whole values):

| system | λ unit | W unit | div = λ unit / W unit | λ | W | L | places | C | switch-to defaults (λ, W, L, places, C) |
|---|---|---|---|---|---|---|---|---|---|
| shop | per min | min | 1 | 1–20 | 1–30 | 1–60 | 1–64 | 1–20 | 2, 5, 10, 30, 3 |
| server | per s | ms | 1000 | 1–1000 | 1–500 | 1–200 | 1–64 | 1–1000 | 200, 50, 10, 16, 250 |
| build-farm | per h | min | 60 | 1–60 | 1–120 | 1–30 | 1–20 | 1–60 | 12, 25, 5, 8, 15 |

With `fromQueue` the λ slider's top is `queueTop(C)` = max(C + 1, ⌊1.2 C⌋) (it may pass the system's λ range), so
the tie ρ = 1 and a growing queue (ρ up to 1.2) are both on the slider. Switching `fromQueue` on by hand keeps λ
and sets C = `queueCapacity(λ, system)` = ⌈λ / 0.8⌉ within the system's C range (ρ about 0.8), so λ always fits
under the slider's top.
Changing `system` by hand loads that system's switch-to defaults for λ, W, L, places and C (the page does it);
`solveFor` and `fromQueue` stay.

## Rules

1. **Little's law.** In steady state the mean number in the system equals the arrival rate times the mean time in
   it: L = λW (J. D. C. Little, "A Proof for the Queuing Formula L = λW", *Operations Research* 9(3):383–387, 1961).
   It holds for any arrival and stay distribution and any order of service. The model computes the third quantity
   from the other two; the trace shows the long-run time average of L settling on λW. Tests: the trace's mean
   L over a long horizon is within 3 % of λW for exponential, fixed and uniform stays.
2. **Units must match.** λ per T and W in T. With λ in its own unit and W in its own, L = λ × W / div, where div is
   the number of W units in one λ unit (server: 1000 ms per s; build farm: 60 min per h). The page shows λ
   converted to the W unit (12 /h = 0.2 /min). The products are formed as λ × W / div (integers first), so the
   presets give exact numbers.
3. **Any two determine the third.** W = L × div / λ, λ = L × div / W.
   *Tie-break:* a zero divisor (λ = 0 when solving for W, W = 0 when solving for λ) gives `null` (no value) and
   `defined: false`. The sliders start at 1, so the page never reaches it; the model is total anyway.
4. **Steady state needs λ below capacity.**
   - Set by hand: each item holds one of the `places` for its whole stay, so the capacity is places / W and the
     condition λ < places / W is L < places. ρ = L / places. *Tie-break:* L = places (ρ = 1) is **not stable**
     (as `utilisation-latency`: saturated at ρ ≥ 1).
   - From the queue: ρ = λ / C, stable when ρ < 1; ρ = 1 is not stable.
   - Not stable: `stable: false`. By hand the arithmetic product is still returned; the page shows "not stable" in
     the computed field (the set quantities keep their values) with the demand "λ × W = 5 ≥ 4 agents" under it.
     From the queue W and L are `null` (no finite value) and both fields say "not stable". The caption names
     `utilisation-latency`. A steady state (and so a steady value from the law) exists only below capacity.
5. **W from the queue** (`fromQueue`): one server with capacity C, Poisson arrivals and exponential service
   (cv² = 1), dc-sim's M/G/1 formula (`src/dc_sim/kernel/queueing.py`: Wq = ρ/(1 − ρ) × (1 + cv²)/2 / C,
   W = Wq + 1/C), copied from `sims/utilisation-latency/sim.js` `queueMetrics`. W is in the λ unit's time and is
   shown in the W unit (× div). Then L = λW = ρ/(1 − ρ) (M/M/1; dc-sim `tests/unit/test_queueing.py`). `solveFor` is
   L in this mode (the page disables the choice and says why); the state reports `solveFor: 'L'`.

## Trace (the picture under the scene)

`trace(params, rng, opts)`: Poisson arrivals at λ (exponential gaps), stays drawn from a distribution with mean W
(exponential by default; tests also use fixed and uniform 0–2W). Time in W units, horizon T = 100 W (by hand, stable), 40 W (by hand,
not stable), 2000 W or 2000 service times (from the queue, stable or not), at most 40 000 arrivals (then T ends
at the next arrival).

- Stable, by hand: nobody waits (each stays its own time). The trace starts in steady state: Poisson(λW) items
  inside, each with an exponential remaining stay.
- Not stable, by hand: `places` servers, first come first served; the arrivals that find every place taken wait,
  so the number in the system grows. Starts empty.
- From the queue: one server, exponential service with mean 1/C, first come first served. Stable: starts with
  a stationary geometric number inside, P(n) = (1 − ρ) ρⁿ. Not stable: starts empty.

Near ρ = 1 from the queue (ρ ≥ 0.95) the running average settles very slowly; the plot's key says so.

It returns 200 samples `[t, L(t), running time-average of L]`, the overall mean, the maximum and whether it grows
(not stable). The page seeds it with a fixed seed, so the same params draw the same trace.

## Presets (expected numbers)

| id | params | expect | source |
|---|---|---|---|
| `shop` | shop, λ 2 /min, W 5 min, 30 places | **L = 10** customers | task (arithmetic) |
| `server` | server, λ 200 /s, W 50 ms, 16 workers | **L = 10** in flight, ρ 0.625; with 8 workers not stable (ρ 1.25) | task |
| `build-farm` | build farm, λ 12 /h, W 25 min, **4 agents** | λ = 0.2 /min, λ × W = **5**, ρ 1.25: **not stable** | task |
| `measure-w` | server, solve W, λ 600 /s, L 30, 64 workers | **W = 50 ms** | task |
| `from-queue` | server, from the queue, C 10 /s, λ 9 /s | ρ 0.9, **W = 1.0 s** (1000 ms), **L = 9** = 0.9/(1 − 0.9) | task; dc-sim M/M/1 closed form |

## Captions (pure `captionKey`, first that applies)

1. `queueUnstable`: from the queue, ρ ≥ 1 — "λ = 12/s ≥ C = 10/s": the server is busy all the time, the queue
   grows, no steady W or L.
2. `unstable`: by hand, L ≥ places — the task's build-farm caption ("12 builds an hour, 25 min each: on average
   5 would run at once. With 4 agents the queue only grows.").
3. `queue`: from the queue — C, λ, ρ, W, and L = λW = ρ/(1 − ρ).
4. `changeW` / `changeLambda`: solving for L by hand, same system, and exactly one of λ, W changed from a stable
   state: the other factor stayed, so L changed by the same factor. W up (misconception "more concurrency means
   faster": at the same λ, more inside means each stays longer) and W down ("fewer inside because each stays a
   shorter time") have their own wording.
5. `solveW` (the task's en caption: "30 requests in flight at 600 per second: each one spends 50 ms in the system,
   and we did not have to time a single request."), `solveLambda`, `solveL`.
