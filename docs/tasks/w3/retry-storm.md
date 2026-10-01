# retry-storm: Retry storms and metastable collapse

| | |
|---|---|
| Task | `retry-storm` (wave 3, Performance and capacity) |
| Catalogue entry | `perf-retry-storm` in `docs/catalogue.md` §4.8 |
| Kind | build a new simulator |
| Folder | `sims/retry-storm/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | DR, NLA |
| Topic / tags / level | `distributed` / `performance` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `utilisation-latency` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **retries keep a recovered system down; backoff, jitter, admission control**.

The student: spike the load, toggle retry policies.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.8.
5. `sims/utilisation-latency/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/dc-sim/docs/concepts.md`, `/home/rjasmin/projects/dc-sim/scenarios/` (Python reference model; its acceptance tests give expected numbers)
- Catalogue seed: dc-sim metastable_collapse
- dc-sim specifics: `scenarios/metastable_collapse.yaml`, `tests/acceptance/test_b_metastable_congestion_collapse.py`
  (the oracle for presets 1–4), `src/dc_sim/skin/retry.py` (`retry_multiplier`, `RetryAwareLoadResolver`,
  `shed_fraction`), `tests/unit/test_retry.py`, `docs/concepts.md` §4 (one-tick lag; no backlog)
- N. Bronson, A. Aghayev, A. Charapko, T. Zhu, "Metastable Failures in Distributed Systems", HotOS 2021;
  Amazon Builders' Library, "Timeouts, retries, and backoff with jitter" *(check)*

## Model and presets

- **Scene:** dc-sim's `metastable_collapse` chain: clients → **api** (large capacity, retries on timeout) →
  **db** (the bottleneck). Per tick a column on a time chart: db offered load λ (stacked: original demand vs
  retries), db capacity line, db p99 against the timeout line. Controls for the interventions drawn as
  events on the timeline (spike, capacity change, shedding).
- **State:** `{ tick, base, capacity, timeout, retryFactor, shed, prevP99, history: [{tick, lambda, rho,
  p99, retries}] }` (dc-sim `RetryAwareLoadResolver` + `compute_queue_metrics`, ported).
- **One step:** one tick, in dc-sim's order: (1) the retry multiplier from **last** tick's db p99, (2) db
  offered load = demand × multiplier × (1 − shed), (3) db metrics, (4) record.
- **Rules** (dc-sim `src/dc_sim/skin/retry.py`, `docs/concepts.md` §4):
  1. If last tick's p99 > timeout: breach = min(1, (p99 − timeout)/timeout), multiplier = 1 + retryFactor ×
     breach; otherwise 1 (the one-tick lag makes the loop well defined).
  2. db λ = demand × multiplier × (1 − shed); metrics from `utilisation-latency`'s formulas (ρ clamped at
     0.999 when saturated).
  3. Bistability: with enough retry pressure the high-load state sustains itself after the trigger is gone
     (metastable failure: Bronson et al., "Metastable Failures in Distributed Systems", HotOS 2021).
  4. Raising capacity after the collapse may not escape it, because the amplified demand still exceeds the
     new capacity (dc-sim `test_capacity_raised_after_collapse_does_not_fully_recover`).
  5. Admission control (`shed`) cuts λ directly and breaks the loop (dc-sim
     `test_shedding_after_collapse_recovers_without_extra_capacity`).
  6. Backoff and jitter are not in dc-sim; here they are modelled as a lower `retryFactor` (fewer retries
     per breach) (derived; the practice is described in the Sources) (check).
- **Params:** `capacity` choice 10 / 15 (15); `retryFactor` choice 0 / 0.5 / 3 (3); `spikeAt` choice none /
  tick 2 (tick 2; demand 14 for one tick); `shed` choice 0 / 0.8 and `shedTicks` (none / ticks 5–6);
  `capacityAt5` choice unchanged / 15.
- **Presets** (base demand 9, timeout 1, cv² 1; presets 1–4 are dc-sim's acceptance test (b), numbers
  reproduced with a script; 5–7 derived with the same rules):
  1. `collapse` — capacity 10, retry 3: tick 0 λ 9, p99 4.6 > 1 → tick 1 λ **36**, ρ 3.6, saturated, and it
     stays there (test: final λ > 18, p99 > 10, saturated).
  2. `prevented` — capacity 15 from the start: λ 9, ρ 0.6, p99 **0.77** every tick, no retries.
  3. `capacity-too-late` — preset 1, capacity raised to 15 at tick 5: λ stays 36, ρ 2.4, **still saturated**.
  4. `shed-dc-sim` — preset 1, shed 0.8 from tick 5: λ 7.2 → 5.28 → **1.8**, p99 0.56: recovered, but shedding
     is never lifted, so 80 % of demand is turned away for good (dc-sim's test leaves it on).
  5. `metastable` — capacity 15 (healthy at 9, preset 2), one-tick spike to 14 at tick 2: p99 4.6 → tick 3 λ
     **36** and it stays at 36 after the spike is over: the trigger is gone, the failure is not.
  6. `gentler-retries` — preset 5 with retry 0.5: λ settles at **13.5**, ρ 0.9, p99 3.07: no collapse, but
     still over the timeout every tick.
  7. `shed-briefly` — preset 5 with shed 0.8 for ticks 5–6 only: λ 7.2, 1.8, then back to **9 at p99 0.77**
     and stable: two ticks of admission control end it.
- **Steps:** one per tick: presets 1–2: 8; 3–4: 15; 5–7: 10.
- **Legend:** original demand (solid bar), retries (hatched bar on top), capacity (line), timeout (dashed
  line), saturated tick (bar with "∞" cap), intervention (flag on the timeline). "Changed" marks the tick just
  computed.
- **Captions:**
  - hr: „Porast je trajao jedan takt, ali ponovni pokušaji (*retries*) ostali su: baza sada dobiva 36 zahtjeva
    po taktu umjesto 9 i ne može se sama oporaviti."
  - en: "Turning away 80 % of requests for two ticks drained the retries; demand is back to 9 and the
    database is healthy again."
- **Terms:** retry — ponovni pokušaj; retry storm — oluja ponovnih pokušaja (check); metastable failure —
  metastabilni kvar (check); timeout — istek vremena; backoff / jitter — odgoda / slučajni pomak (check);
  admission control / load shedding — kontrola prijema / odbacivanje opterećenja (check).
- **Misconceptions:** "retries make a system more reliable"; "once the spike is gone, it recovers by itself";
  "add capacity and the problem goes away".
- **Out of scope:** circuit breakers in depth, per-request simulation, queue backlog across ticks (dc-sim
  does not carry one: stated in its concepts §4), team incentives (`goodhart-teams`).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `retry-storm` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh retry-storm sims/retry-storm` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/retry-storm/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
