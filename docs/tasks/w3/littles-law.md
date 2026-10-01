# littles-law: Little's law

| | |
|---|---|
| Task | `littles-law` (wave 3, Performance and capacity) |
| Catalogue entry | `perf-littles-law` in `docs/catalogue.md` §4.8 |
| Kind | build a new simulator |
| Folder | `sims/littles-law/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | DR |
| Topic / tags / level | `distributed` / `performance` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `utilisation-latency` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **L = λW in a shop, a server, a build farm**.

The student: change arrival rate and service time.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.8.
5. `sims/utilisation-latency/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/dc-sim/docs/concepts.md`, `/home/rjasmin/projects/dc-sim/scenarios/` (Python reference model; its acceptance tests give expected numbers)
- Catalogue seed: dc-sim
- dc-sim specifics: `src/dc_sim/kernel/queueing.py` (W for the "from the queue" mode) and
  `tests/unit/test_queueing.py` (M/M/1 closed forms); dc-sim does not state Little's law itself
- J. D. C. Little, "A Proof for the Queuing Formula L = λW", *Operations Research* 9(3), 1961
- DR estate (student side): `student/scenarios/S7.md` (build farm turnaround) and
  `student/configs/hq/ci-hq/jobs.csv` as a possible real build-farm preset *(not yet read for numbers)*

## Model and presets

- **Scene:** a box ("the system": a shop, a server, a build farm, chosen by preset) with an entrance and an
  exit; dots enter at rate λ, each stays W, and the box shows how many are inside (L). Three linked number
  fields **L = λ × W**: two are set by sliders, the third is computed and highlighted. A small time series
  of L underneath, so the steady state is visible. Reuses `utilisation-latency`'s formulas for one
  optional mode: "W from the queue" (W computed from λ and capacity instead of set by hand).
- **State:** pure function of params → `{ lambda, W, L, solveFor, stable, rho? }`.
- **Live:** moving λ or W updates L (or whichever quantity is being solved for); the dot animation is
  decorative and stops under reduced motion.
- **Rules:**
  1. In steady state, the mean number in the system equals the arrival rate times the mean time in it:
     L = λW (J. D. C. Little, *Operations Research* 9(3), 1961). It holds for any arrival and service
     distribution and any order of service.
  2. Units must match: λ per minute with W in minutes (the page converts and shows the units).
  3. Any two determine the third: W = L / λ, λ = L / W.
  4. Steady state needs λ below capacity; above it L grows without bound and the law gives no steady value
     (the page shows "not stable"; link `utilisation-latency`).
  5. In "W from the queue" mode, W comes from dc-sim's M/G/1 formula; then L = λW = ρ/(1 − ρ) for M/M/1
     (consistency check with dc-sim `tests/unit/test_queueing.py`).
- **Params:** `system` choice shop / server / build farm (shop); `solveFor` choice L / W / λ (L); `lambda`
  range per preset; `W` range per preset; `fromQueue` toggle (off).
- **Presets** (arithmetic, derived):
  1. `shop` — 2 customers per minute, each stays 5 min: **L = 10** in the shop.
  2. `server` — 200 requests/s, 50 ms each: **L = 10** requests in flight (so 10 worker threads are busy on
     average; with 8 workers requests must queue).
  3. `build-farm` — 12 builds per hour, 25 min each: λ = 0.2 per min → **L = 5** concurrent builds; with 4
     build agents the farm is over capacity (rule 4).
  4. `measure-W` — a monitor shows 30 requests in flight at 600 requests/s: **W = 50 ms** without timing any
     request.
  5. `from-queue` — dc-sim node C = 10/s, λ = 9/s, cv² = 1: W = 1.0 s, L = 9 = 0.9/(1 − 0.9).
- **Steps:** explorer, no steps.
- **Legend:** entering dot, dot inside (counted), leaving dot, computed field (highlight + "="), not stable
  (warn colour **and** "nestabilno"). "Changed" marks the computed quantity.
- **Captions:**
  - hr: „Dvanaest gradnji na sat, svaka 25 minuta: u prosjeku ih se pet izvodi istodobno. S četiri agenta red
    samo raste."
  - en: "30 requests in flight at 600 per second: each one spends 50 ms in the system, and we did not have
    to time a single request."
- **Terms:** Little's law — Littleov zakon; arrival rate — stopa dolazaka; mean time in system — srednje
  vrijeme u sustavu; number in system — broj u sustavu; steady state — stacionarno stanje; throughput —
  propusnost.
- **Misconceptions:** "it only works for simple queues" (it is distribution-free); "more concurrency means
  faster requests" (at fixed λ, more in flight means each stays longer); "a short burst breaks it" (it is
  about long-run averages).
- **Out of scope:** queueing formulas themselves (`utilisation-latency`), closed-loop benchmarks
  (`iops-latency`), variance and tails (`tail-latency`).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `littles-law` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh littles-law sims/littles-law` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/littles-law/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
