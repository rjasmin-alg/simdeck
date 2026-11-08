<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# littles-law: notes

New explorer (task `docs/tasks/w3/littles-law.md`, catalogue `perf-littles-law` §4.8, wave 3). No kit view fits (a box
with dots and a time series is none of K1–K4), so the page draws its own SVG, measured in CSS pixels after layout
(1:1, no viewBox), redrawn by a `ResizeObserver`; the three linked fields L = λ × W are HTML. Rules and expected
numbers: `SPEC.md`.

## Decisions

- **Model reuse (COMMON.md §6).** `models/` has no queueing model yet, so `utilization`, `zone` and `queueMetrics`
  (with `CLAMP`, `KNEE`) are **copied** unchanged from `sims/utilisation-latency/sim.js @ f2e6118`, with that comment
  in `sim.js`. Only `queueMetrics(λ, C, 1)` is used (rule 5); its own rules stay tested in `utilisation-latency`.
- **Capacity as places.** Rule 4 needs a capacity the task's params do not have. By hand, each item holds one of
  `places` (shop floor places, worker threads, build agents) for its whole stay W, so the capacity is places / W and
  "λ below capacity" is L < places; ρ = L / places. The tie L = places is not stable (as `utilisation-latency`:
  saturated at ρ ≥ 1). In "W from the queue" mode the box is one server with capacity C (`capacity`), ρ = λ / C.
- **Integer sliders, units per system.** The kit's `step` is static, so every slider steps by 1 and the units are
  chosen so whole values cover the presets: shop λ per min / W in min, server λ per s / W in ms, build farm λ per h
  / W in min. L = λ × W / div with div = 1, 1000, 60 (integers first, so 200 × 50 / 1000 is exactly 10).
- **Rule 2 shown per system:** the build farm shows λ in the W unit (12/h = 0.2 per minute, the task's example); the
  server shows W in the λ unit (50 ms = 0.05 s), which reads better than 0.2 per millisecond. Captions do the same.
- **Switching system by hand** loads that system's own start values for λ, W, L, places and C (a `sim.on` listener
  calls `sim.set`; the clamped in-between state is replaced in the same tick, never painted). `solveFor` and
  `fromQueue` stay. Presets bring their own values.
- **Not stable:** the computed field says "not stable" (dashed red border and the word, never colour alone), with
  the demand under it ("λ × W = 5 ≥ 4 agents"); the set quantities keep their values. From the queue W and L both
  say "not stable".
- **The time series is a seeded simulation** (`trace`, pure, seed 2 in the page), not decoration: stable by hand,
  nobody waits (M/M/∞, steady-state start); not stable, `places` servers first come first served (grows); from the
  queue, M/M/1 with a stationary start. The running time-average settles on λ × W. Seed 2 was picked from seeds 1–7
  as one whose finite-window means sit close to λW for the presets (the long-run tests use other seeds and long
  horizons). The three numbers on the page never come from the simulation.
- **From the queue, the λ slider reaches 20 % past C** (`queueTop`), so both the tie ρ = 1 (null recurrent: it wanders
  and drifts up) and a clearly growing queue are on the slider. Switching the mode on by hand keeps λ and sets C for
  ρ ≈ 0.8 (`queueCapacity`); without it the kit would clamp λ to the old C's slider top and leave it changed after
  switching back. `solveFor` is disabled there (aria-disabled, with the reason as its hint). Near ρ = 1 the plot's
  key says the average settles very slowly (an M/M/1 at ρ 0.98 needs far longer than any picture).
- **Dot animation** (decorative, `requestAnimationFrame`, none under reduced motion): a conveyor of dots spaced 1/N
  apart, so N are always inside; a stay crosses the box in 4–12 s on screen, longer W slower. Above 60 dots one dot
  stands for k items ("1 dot = k"). At most three dots wait at each door. Not stable: the box is full and rings queue
  at the entrance.
- **Captions** (pure `captionKey`, SPEC.md): the task's en caption is `solveW` ("30 requests in flight at 600/s: each
  one spends 50 ms in the system, and we did not have to time a single one."); the hr caption is `unstable` ("12
  gradnji na sat, svaka 25 min: u prosjeku bi ih istodobno trebalo 5. S 4 agenta red samo raste."). `changeW` speaks
  to the misconception "more concurrency means faster" (W up; W down has its own wording).
- **Panel:** the settings group's reset button is hidden (CSS), as in `utilisation-latency`: the transport bar has
  the same reset with the same `R` key.
- **Concepts, not tools:** "a server", "worker threads", "build agents"; no products named. The DR estate's
  `jobs.csv` (student side) has job names, labels and node counts but no durations, so no real build-farm preset
  was made from it.
- `related`: `utilisation-latency` (the not-stable caption names it). Topic `distributed`, tag `performance`, level
  `advanced` (the task's); all exist in `tags.json`.

## Deviations from the task

- **Two params added:** `places` (rule 4 by hand, presets 2 and 3) and `capacity` (C, rule 5). `L` is a param too
  (the task's "two are set by sliders" needs it when solving for W or λ).
- **Preset id `measure-w`**, not `measure-W`: the manifest requires kebab-case lower-case preset ids.
- **The build-farm preset has 4 agents**, so it is over capacity as the task's hr caption says; λ × W = 5 is shown as
  the demand. The caption is in digits ("12 gradnji", "5", "4 agenta") so it follows the sliders, and says "bi …
  trebalo" (would be needed) since with 4 agents five cannot actually run at once.
- **Server preset:** 16 worker threads (L = 10, stable); "with 8 the queue grows" is in the preset's hint. The task's
  "with 8 workers requests must queue" is in fact over capacity (10 > 8), not just queueing.
- **From-queue W is shown as 1000 ms** (the server's W unit), with "= 1 s" under it.
- **Croatian unstable caption** says "Kapacitet je 4 agenta, pa red samo raste." instead of the task's "S četiri
  agenta …": the instrumental after "s" does not follow a number (s 1 agentom, s 4 agenta, s 21 agentom).
- **Croatian control label "farma"** in the system choice (the full "farma za gradnju" wrapped the control to two
  rows and the panel scrolled); the scene and the preset keep the full name.

## Sources

- J. D. C. Little, "A Proof for the Queuing Formula L = λW", *Operations Research* 9(3):383–387, 1961 *(check: page
  numbers cited from memory)*.
- dc-sim (`/home/rjasmin/projects/dc-sim`): `src/dc_sim/kernel/queueing.py` (M/G/1 W) and `tests/unit/test_queueing.py`
  (M/M/1 closed forms), through `sims/utilisation-latency/sim.js`. dc-sim itself does not state Little's law.
- DR estate (student side): `student/scenarios/S7.md` (build farm turnaround, context only) and
  `student/configs/hq/ci-hq/jobs.csv` (no durations; not used for numbers).
- Preset numbers checked with a script before coding: 2 × 5 = 10; 200 × 50 / 1000 = 10; 12 × 25 / 60 = 5 (ρ 1.25 with
  4 agents); 30 × 1000 / 600 = 50 ms; C 10, λ 9: W = 1.0 s, L = 9 = 0.9 / 0.1.

## Term pairs

Missing from `kit/glossary.js` (only *throughput* — propusnost — is there and used as `[[throughput]]`), written out
in the explanation (*English* (Croatian) on the Croatian page):

| English | Croatian | Note |
|---|---|---|
| Little's law | Littleov zakon | task |
| arrival rate | stopa dolazaka | task (also in utilisation-latency's notes) |
| mean time in system | srednje vrijeme u sustavu | task |
| number in system | broj u sustavu | task |
| steady state | stacionarno stanje | task |

## Shared requests

- **Kit:** `.sd-ctl` has `display: flex` in `kit.css`, which beats the `hidden` attribute a param's `visible()` sets,
  so hidden controls stay visible. Worked around in the page with `[data-sim="littles-law"] .sd-ctl[hidden] { display:
  none; }` (as `amdahl` does). Smallest fix: `.sd-ctl[hidden] { display: none; }` in `kit.css`.
- **Kit:** a range's `step` cannot depend on the params (min and max can). Worked around with whole-number units.
- **Models:** promote `utilization`, `zone`, `queueMetrics` (and `CLAMP`, `KNEE`) to `models/queueing.js` (also asked
  in `utilisation-latency`'s notes); this sim then drops its copy and includes the model.

## Review

A fresh reviewer (subagent, no shared context) read the code against SPEC.md, recomputed every preset number
exactly (all match), ran 63 mutations and drove the page headless. Fixed from its findings: the W caption claiming
"more inside" when W went down; "λ = C" in the not-stable queue caption when λ > C; the false chain "12/h = 0.2/min
× 25 min = 5" (now "12/h × 25 min = 0.2/min × 25 min = 5"); λ silently clamped when "from the queue" was switched
on (and left changed after switching off); "not stable" put on the set L instead of the computed W or λ; English
"1 customer are" and Croatian "je … 2 kupca", "S 1 mjesto" (captions rephrased without the verb / with "Kapacitet
je …"); the explanation saying the law "holds only" below capacity (now: a steady state exists only below it);
"srednji" missing before the Croatian number in system; the λ slider top capped at C for C at its range's top; the
slow settling near ρ = 1 now said in the plot's key. Test gaps it found (trace units on server and farm, the
stationary start for each stay distribution, horizons, queueTop at C = 6, the product's order, the fallbacks) now
have tests. Left as is: survivors that change nothing observable (the clamp and zones of the copied model the page
does not read, the arrival/departure order at an exact tie, the start count in the maximum).

## Checks

- `node --test sims/littles-law/sim.test.js`: 28 tests. Every rule and tie-break broken once on purpose (24
  mutations after the review: both stability ties, the zero divisor, the unit divisor in each of L, W and λ and its
  order, the queue's W unit, solveFor from the queue and its fallback, the system fallback, the trace's λ units by
  hand and from the queue, both stationary starts, the residual stays, the horizons, queueTop and queueCapacity, the
  stays' distributions, FIFO waiting, three caption branches, the places in ρ): each makes a test fail. One
  survivor before them, equivalent: the P-K factor `(1 + cv²) / 2` replaced by 1 (cv² is always 1 here).

## Time

Start 2026-11-08 12:20 CET, done 12:46 CET: about 26 minutes, one session (including the fresh review and its fixes).
