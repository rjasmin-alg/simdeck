# autoscaling-lag: Autoscaling lag

| | |
|---|---|
| Task | `autoscaling-lag` (wave 3, Performance and capacity) |
| Catalogue entry | `perf-autoscaling-lag` in `docs/catalogue.md` §4.8 |
| Kind | build a new simulator |
| Folder | `sims/autoscaling-lag/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | DR, NLA |
| Topic / tags / level | `distributed` / `performance` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `utilisation-latency` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **provisioning lead time vs load spikes; spot preemption**.

The student: spike the load with different lead times.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.8.
5. `sims/utilisation-latency/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/dc-sim/docs/concepts.md`, `/home/rjasmin/projects/dc-sim/scenarios/` (Python reference model; its acceptance tests give expected numbers)
- Catalogue seed: dc-sim resource_provisioning
- dc-sim specifics: `scenarios/resource_provisioning.yaml` (lead time 3), `scenarios/spot_and_failure_domains.yaml`
  (rack failure ticks 2–4, spot preemption at tick 6; the expected ρ per tick is in its header comment),
  `src/dc_sim/skin/resources.py`, `tests/unit/test_resources.py` (lead-time and preemption mechanics, the
  oracle), `src/dc_sim/org/team.py` (`TARGET_UTILIZATION = 0.7`)

## Model and presets

- **Scene:** a 12-tick chart for one service: **demand** (bars), **capacity** (step line, split into
  baseline, reserved and preemptible/spot blocks by pattern), **ρ** and **p99** against the SLO line. Orders
  for capacity appear as flags at the tick they are placed, with an arrow to the tick they come online.
  Reuses `utilisation-latency`'s formulas for ρ and p99.
- **State:** pure function of params → `{ ticks: [{t, demand, capacity, rho, p99, saturated, ordered,
  online}] }`.
- **Live:** changing lead time, spike or policy reruns the 12 ticks.
- **Rules:**
  1. Capacity is the sum of active resource blocks; a block ordered at tick t comes online at tick t + lead
     (dc-sim `skin/resources.py`, `lead_time_ticks`; `scenarios/resource_provisioning.yaml`: "provisioned at
     tick 0 … doesn't come online until tick 3").
  2. Autoscaler (derived, not in dc-sim): after tick t's metrics, if ρ > 0.8, order enough to bring ρ back
     to 0.7 for the current demand, minus capacity already on order (target 0.7 as dc-sim's
     `TARGET_UTILIZATION`).
  3. A failure domain going down removes its blocks for its duration; a preempted spot block leaves and does
     not come back on its own (dc-sim `scenarios/spot_and_failure_domains.yaml`, disruptions).
  4. ρ and p99 per tick from `utilisation-latency` (saturated at ρ ≥ 1).
  5. Tie-break: ρ exactly 0.8 does not trigger the autoscaler (strict >).
- **Params:** `lead` choice 1 / 4 / 9 ticks (4); `spike` choice none / 8 → 16 at ticks 2–6 (on); `baseline`
  10; `policy` choice reactive / pre-provisioned (reactive); `scenario` choice spike / dc-sim provisioning /
  dc-sim spot and failure domains.
- **Presets:**
  1. `dc-sim-provisioning` — from `resource_provisioning.yaml`: db capacity 5, demand 8 (ρ 1.6, saturated)
     for ticks 0–2; +10 reserved online at tick 3: capacity 15, ρ **0.53**, p99 **0.66** (< SLO 1).
  2. `fast-scaler` — spike 8 → 16 at tick 2 with baseline 10, lead 1: saturated only at tick 2; from tick 3
     capacity **22.9**, ρ 0.70, p99 0.67 (derived, script).
  3. `slow-scaler` — lead 4: saturated ticks **2–5**, capacity arrives at tick 6, one tick before the spike
     ends (derived).
  4. `too-late` — lead 9: the whole spike (ticks 2–6) is saturated; 12.9 units arrive at tick 11 and sit idle
     at ρ 0.35 (derived).
  5. `spot-and-domains` — from `spot_and_failure_domains.yaml` (demand 20; blocks 10 rack-a, 10 rack-b, 8
     spot): ticks 0–1 capacity 28, ρ **0.71**; ticks 2–4 rack-a down, 18, **saturated**; tick 5 back to 28;
     ticks 6–8 spot reclaimed, 20, ρ **1.0** (saturated) and it does not come back.
- **Steps:** explorer (each preset is a 9–12 tick run drawn at once).
- **Legend:** demand (solid bars), baseline (solid block), reserved (striped), spot (dotted), order flag →
  online arrow, saturated tick (bar capped with "∞"), SLO line (dashed). "Changed" marks ticks whose verdict
  changed after the last parameter change.
- **Captions:**
  - hr: „Autoskaliranje (*autoscaling*) je reagiralo u 2. taktu, ali novi kapacitet stiže tek u 6. —
    četiri takta zasićenja, a vršak traje pet."
  - en: "The spot block was reclaimed at tick 6: capacity drops to 20 for a demand of 20, and nothing brings
    it back by itself."
- **Terms:** autoscaling — autoskaliranje (check); lead time — vrijeme isporuke (check); load spike — nagli
  porast opterećenja (vršak); preemptible / spot instance — prekidiva instanca (check); reserved capacity —
  rezervirani kapacitet; failure domain — domena kvara.
- **Misconceptions:** "autoscaling handles spikes" (only spikes longer than the lead time); "spot capacity is
  just cheaper capacity"; "scaling on ρ > 80 % leaves 20 % headroom" (latency is already 5× service time at
  0.8: `utilisation-latency`).
- **Out of scope:** scale-in and cool-down, predictive scaling, cost optimisation, retries during the
  saturated ticks (`retry-storm`).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `autoscaling-lag` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh autoscaling-lag sims/autoscaling-lag` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/autoscaling-lag/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
