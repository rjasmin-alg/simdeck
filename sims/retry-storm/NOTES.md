<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# retry-storm: notes

New stepper (task `docs/tasks/w3/retry-storm.md`, catalogue `perf-retry-storm` §4.8, wave 3). No kit view fits (a time
chart of stacked bars is none of K1–K4), so the page draws its own chart in HTML: one CSS grid with an axis column, one
column per tick and a gutter for the line labels; bars and lines are positioned in % of their cell, so nothing is
scaled and every label stays at the text sizes. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Port, not invention.** The tick is dc-sim's `RetryAwareLoadResolver` reduced to the scenario's two nodes: the
  multiplier from last tick's db p99 (`retry_multiplier`), db λ = processed × multiplier × (1 − shed), db metrics from
  `utilisation-latency`'s `queueMetrics` (dc-sim's `compute_queue_metrics`). Presets 1–4 reproduce acceptance test (b)
  exactly; 5–7 follow from the same rules. All numbers checked with a script reimplementing dc-sim before the page.
- **Model copied, not shared.** `models/` has no queueing model yet, so `utilization`, `zone` and `queueMetrics` are
  copied into `sim.js` with `// from sims/utilisation-latency/sim.js @ f2e6118` (COMMON.md §6). See Shared requests.
- **Six params, four controls.** The task's `capacity` + `capacityAt5` are one choice, `capacity` `10` / `15` /
  `10-15` (10, raised to 15 at tick 5); `shed` + `shedTicks` are one choice, `shed` `off` / `from5` (dc-sim's test:
  on for good) / `5-6` (two ticks), share fixed at 0.8. The combinations they drop are no-ops (15 raised to 15; a
  window with shed 0). With six controls and seven presets the panel was 1215 px against 862 (the gate's one-screen
  check); with four controls and the presets in two columns (as `vrrp-failover`) it fits. The task's "shedTicks none"
  is read as "no end", i.e. dc-sim's shed that stays on.
- **Default = the `metastable` preset's params** (the task's param defaults: capacity 15, retry 3, spike at tick 2):
  10 steps, `sim.json` `steps` 10.
- **Steps per run:** 10 with a spike, else 15 with an intervention (shed or the raise), else 8: exactly the task's
  8 / 15 / 10 per preset. Step 0 is before tick 0; step n computes tick n − 1.
- **The chart.** Top: λ at the db per tick, stacked original (solid blue) + retries (hatched orange) + turned away by
  admission control (dashed red outline, on top: what the clients offered beyond what got in), the capacity as a solid
  line (a step at tick 5 for `10-15`), λ written at λ's height. Bottom: db p99 against the dashed timeout line; over
  the timeout the bar is striped, saturated ticks are a red outlined full-height bar with an "∞" cap (the legend's
  "saturated, p99 ∞"). Axes are fixed per run (`peak(p)`), so nothing rescales while stepping. Interventions are flags
  above their tick, dashed while still ahead. "Changed" (yellow + outline) marks the tick just computed in both charts.
- **The chain row** (clients → API → [admission control] → database) shows the current tick: the demand, the
  multiplier, the offered load and its split (9 + 27), what the gate turns away, ρ and p99 or "saturated: p99 ∞".
  The admission control box appears only when shed is not `off`.
- **Captions** (both languages): "Tick k:" + the tick's interventions + why the API does or does not retry (last tick's
  p99 vs the timeout) + what the db gets (original + retries), ρ, p99 or saturated + one highlighted closing sentence
  from the pure `story()` (SPEC.md, Story). The task's hr caption is `stuck`, its en caption `recovered`. `stuck`
  needs a healthy system before the spike: with C 10 and a spike the collapse came at tick 1 already, so it is `storm`.
  `recovered` needs earlier retries (else there was nothing to recover from); with retries off the closing sentence
  never says "the API retries next tick" (`slowNoRetry`). Captions are checked for param combinations beyond the
  presets in `sim.test.js`.
- **Term rule:** on the Croatian page the English term in italics with the Croatian in parentheses at its first
  mention (*timeout*, *retry* in the start caption; *admission control* when it switches on; all of them in the
  explanation); later mentions use the Croatian alone ("ponovni pokušaji", "kontrola prijema"), which reads more
  naturally than repeating the English in italics.
- **Numbers:** three significant digits (0.768 s, 4.61 s, 5.28/s), ρ two, decimal comma on the Croatian page.
- **Croatian concept** "Ponovni pokušaji drže sustav dolje; odgoda, slučajni pomak, kontrola prijema" (76 of 80
  characters): "oporavljeni" did not fit with jitter in it; the summary carries the recovery.
- **Concepts, not tools:** "API", "database", "clients", "admission control"; no products.
- `related`: `utilisation-latency` (the queueing model) and `rate-limiting` (admission control's cousin).
- Topic `distributed`, tag `performance`, level `advanced` (the task's); all exist in `tags.json`.

## Deviations from the task

- **Params merged into four controls** (above); the model's param names follow (`capacity` is a string choice).
- **The task's hr caption** starts "Nalet je trajao" (not "Porast"; the page calls the spike "nalet" everywhere)
  and drops "(*retries*)" (the term was introduced in the start caption).
- **"36 zahtjeva po taktu"** in the task's hr caption is "36 zahtjeva u sekundi" (and "36 requests a second"): λ and C
  are rates in req/s throughout the page, as in dc-sim.
- **Backoff and jitter** are only a lower retry factor (0.5), labelled "0,5 (odgoda)" / "0.5 (backoff)"; the
  explanation says so (the task's rule 6, derived) *(check)*.
- **p99 at saturation** is shown as ∞, not as the clamped number (307 s / 461 s) the model computes (rule 3, as in
  utilisation-latency).
- The en caption's "80 %" and "9" are placeholders, filled from the model.

## Sources

- dc-sim (`/home/rjasmin/projects/dc-sim`): `src/dc_sim/skin/retry.py`, `scenarios/metastable_collapse.yaml`,
  `tests/acceptance/test_b_metastable_congestion_collapse.py` (oracle for presets 1–4), `docs/concepts.md` §4.
- `sims/utilisation-latency/` (the M/G/1 formulas, SPEC.md rules 1–4).
- N. Bronson, A. Aghayev, A. Charapko, T. Zhu, "Metastable Failures in Distributed Systems", HotOS 2021 *(check: cited
  from the task, not opened)*.
- Amazon Builders' Library, "Timeouts, retries, and backoff with jitter" *(check: not opened)*; backoff/jitter as a
  lower retry factor is this sim's simplification.
- DR and NLA course placement *(check: syllabi not opened)*.

## Term pairs

Missing from `kit/glossary.js`; written out in the strings (*English* (Croatian) at the first mention on Croatian
pages), as the task gives them:

| English | Croatian | Note |
|---|---|---|
| retry | ponovni pokušaj | task |
| retry storm | oluja ponovnih pokušaja | task *(check)* |
| metastable failure | metastabilni kvar | task *(check)* |
| timeout | istek vremena | task |
| backoff | odgoda | task *(check)* |
| jitter | slučajni pomak | task *(check)* |
| admission control | kontrola prijema | task *(check)* |
| load shedding | odbacivanje opterećenja | task *(check)* |

## Shared requests

- None for the kit.
- `models/`: promote `utilization`, `zone`, `queueMetrics` (with `CLAMP`, `KNEE`) from `sims/utilisation-latency/sim.js`
  to `models/queueing.js` (its NOTES.md asks the same); then point this sim at it and drop the copy.

## Review

A fresh reviewer (subagent, no shared context) read the code against SPEC.md and dc-sim, recomputed every preset number
in its own script (all match), checked the tick order against dc-sim's engine, and tried 50 mutations of `sim.js`
(39 caught, 6 equivalent, 5 test gaps). Fixed from its findings: "retries next tick" with retries off (`slowNoRetry`),
"recovered … drained the retries" when there never were retries, "healthy without extra capacity" after a raise,
"no collapse" after a collapse (C 10-15, retry 0.5), "15/s would have prevented the collapse" with a spike on (now
"capacity was raised to 15/s, but it does not help"), "two ticks are enough" (true only at C 15; the explanation now
says so), jitter missing from the Croatian concept, "takt 5–6" → "taktovi 5–6", "ponuđenog opterećenja", the hr
caption's "Porast", and the test gaps (story at shed-dc-sim tick 6 and beyond the presets, the `shedOn` event, the
initial capacity).

## Checks

- `node --test sims/retry-storm/sim.test.js`: 26 tests (tie-breaks first, a test per rule and per preset, story
  including combinations beyond the presets, axis peak, the generic block). My own 21 mutations of `sim.js` tried: 19 make a test fail; the 2 that do not are equivalent
  (p99 exactly at the timeout gives breach 0 and so multiplier 1 either way; the P-K factor (1 + cv²)/2 is 1 at the
  fixed cv² 1).
- `npm run gate -- retry-storm`: see the report for the final run; screenshots at 1920×1080 light, dark, grayscale and
  375×812 in both languages reviewed, plus the end states of `metastable`, `shed-dc-sim`, `capacity-too-late` (dark),
  `shed-briefly` and C 10 with a spike.

## Time

Start 2026-11-08 13:17 CET, done about 13:45 CET: about 30 minutes, one session (including the fresh review and its
fixes).
