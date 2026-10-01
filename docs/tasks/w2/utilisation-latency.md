# utilisation-latency: Latency near full utilisation

| | |
|---|---|
| Task | `utilisation-latency` (wave 2b, Performance) |
| Catalogue entry | `perf-utilisation-latency` in `docs/catalogue.md` §4.8 |
| Kind | build a new simulator |
| Folder | `sims/utilisation-latency/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | DR, NLA, OS |
| Topic / tags / level | `distributed` / `performance` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **waiting time explodes as ρ → 1**.

The student: slider for load, watch the queue and latency.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.8.

## Sources

- `/home/rjasmin/projects/dc-sim/docs/concepts.md`, `/home/rjasmin/projects/dc-sim/scenarios/` (Python reference model; its acceptance tests give expected numbers)
- Catalogue seed: dc-sim three_tier_chain
- dc-sim specifics: `src/dc_sim/kernel/queueing.py` (`utilization`, `pk_wait_time`, `p99_latency`,
  `compute_queue_metrics`, clamp 0.999), `docs/concepts.md` §2 and §6, `tests/unit/test_queueing.py`
  (M/M/1 closed forms: W = 1/(μ − λ), p99 = ln 100/(μ − λ)), `tests/unit/test_end_to_end_metric.py`,
  `scenarios/three_tier_chain.yaml`
- Standard reference: L. Kleinrock, *Queueing Systems, Vol. 1*, 1975 (M/M/1, Pollaczek–Khinchine) *(check)*;
  NLA T41/T42 (USE method; memory, I/O and scheduler) for course placement

## Model and presets

- **Scene:** one server with a queue in front of it (a row of waiting requests whose length is the mean
  queue length), and a large **latency curve**: mean time in system W and p99 against utilisation ρ from 0
  to 1, with the current ρ marked and a vertical "knee" region shaded. Gauges: ρ, W, p99, mean number in
  system. A second, smaller panel shows the three-node call chain of dc-sim's `three_tier_chain` with each
  node's ρ and p99 and the summed end-to-end p99.
- **State:** pure function of params → `{ rho, wq, w, p99, L, saturated }` per node (dc-sim
  `compute_queue_metrics`, ported).
- **Live:** the load slider moves the point along the curve; cv² changes the curve's height.
- **Rules** (dc-sim `src/dc_sim/kernel/queueing.py`, `docs/concepts.md` §2) (check against a queueing text):
  1. ρ = λ / C (arrival rate over capacity, both per second).
  2. Pollaczek–Khinchine mean wait: Wq = ρ/(1 − ρ) × (1 + cv²)/2 × 1/C; W = Wq + 1/C (M/G/1).
  3. p99 = ln(100) × (1 + cv²)/2 / (C × (1 − ρ)): exact for M/M/1 (cv² = 1), a scaled approximation
     otherwise (dc-sim's own modelling choice, stated in its docstring).
  4. At ρ ≥ 1 the queue has no steady state: dc-sim clamps ρ to 0.999 inside the formulas and flags
     `saturated`; the page shows "unbounded" instead of a number.
  5. Mean number in system L = λW (Little's law; link `littles-law`).
  6. End-to-end p99 of a chain = sum of node p99s weighted by fanout (dc-sim `end_to_end_metric`).
- **Params:** `load` range 0–100 % of capacity (50 %); `capacity` choice 10 / 100 req/s (10); `cv2` choice
  0 (deterministic) / 1 / 4 / 9 (1); `chain` toggle (show the three-node chain).
- **Presets** (C = 10 req/s, cv² = 1; numbers from dc-sim's formulas, reproduced with a script and matching
  `tests/unit/test_queueing.py` closed forms):
  1. `half-load` — ρ 0.5: W **0.20 s**, p99 **0.92 s** (service alone is 0.1 s).
  2. `knee` — ρ 0.8: W 0.50 s, p99 2.30 s; ρ 0.9: W **1.00 s**, p99 **4.61 s**.
  3. `near-full` — ρ 0.95: W 2.0 s, p99 9.2 s; ρ 0.99: W **10 s**, p99 **46 s**: the last 9 % of load costs
     10× the latency.
  4. `variability` — ρ 0.1 with cv² 1 → 9: W 0.111 → 0.156 s (×1.4), p99 0.512 → 2.558 s (×5.0)
     (dc-sim `test_a_tail_decoupled_from_mean`; links `tail-latency`).
  5. `three-tier-chain` — dc-sim `scenarios/three_tier_chain.yaml` (api C 100, cache C 20 cv² 2, db C 15,
     audit C 50 with fanout 0.2; rate 5): p99 api 0.048, cache 0.461, db 0.461, audit 0.094 → end-to-end
     ≈ 0.048 + 0.461 + 0.461 + 0.2 × 0.094 ≈ **0.99 s**, under the 2 s SLO.
- **Steps:** explorer, no steps.
- **Legend:** W curve (solid), p99 curve (dashed), current point (ring), knee region (hatched band),
  saturated (curve ends in an arrow + "neograničeno"). "Changed" marks gauges that crossed a threshold
  (ρ 0.8, ρ 1) after the last change.
- **Captions:**
  - hr: „Opterećenje (*utilisation*) 90 %: zahtjev u prosjeku provede 1 s u sustavu, deset puta dulje od
    samog posluživanja, a 1 % zahtjeva čeka više od 4,6 s."
  - en: "From 90 % to 99 % load, the mean time in the system goes from 1 s to 10 s."
- **Terms:** utilisation — iskorištenost (opterećenje); queue — red čekanja; arrival rate — stopa dolazaka;
  service time — vrijeme posluživanja; latency — kašnjenje (latencija); percentile (p99) — percentil (99.
  percentil); saturation — zasićenje; coefficient of variation — koeficijent varijacije.
- **Misconceptions:** "80 % busy means 20 % headroom, latency grows linearly"; "a server is fine until it
  hits 100 %"; "average latency tells you how users feel".
- **Out of scope:** multi-server queues (M/M/c), closed-loop systems (`iops-latency`), retries
  (`retry-storm`), backlog across time (dc-sim's ticks are independent snapshots).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `utilisation-latency` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh utilisation-latency sims/utilisation-latency` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/utilisation-latency/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
