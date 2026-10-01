# goodhart-teams: Local optimisation, global degradation

| | |
|---|---|
| Task | `goodhart-teams` (wave 3, Performance and capacity) |
| Catalogue entry | `perf-goodhart-teams` in `docs/catalogue.md` §4.8 |
| Kind | build a new simulator |
| Folder | `sims/goodhart-teams/` |
| Class | explorer |
| Size | M |
| Priority | P3 |
| Courses | DR |
| Topic / tags / level | `distributed` / `performance` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `utilisation-latency` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **teams meeting their own metric hurt the whole**.

The student: tune each team's target, watch the system.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.8.
5. `sims/utilisation-latency/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/dc-sim/docs/concepts.md`, `/home/rjasmin/projects/dc-sim/scenarios/` (Python reference model; its acceptance tests give expected numbers)
- Catalogue seed: dc-sim goodhart
- dc-sim specifics: `scenarios/goodhart.yaml`, `scenarios/goodhart_fixed.yaml`,
  `tests/acceptance/test_c_goodhart_local_optimization.py` (the oracle), `src/dc_sim/org/team.py`
  (`_retry_policy_action`, retry factors 3.0 / 0.5, `TARGET_UTILIZATION` 0.7), `src/dc_sim/kernel/engine.py`
  (`TickEngine.step` order, `end_to_end_metric`), `docs/concepts.md` §5–6, `docs/cookbook.md` Exercise 3
- C. Goodhart, "Problems of Monetary Management: The U.K. Experience", 1975 (the law, as later paraphrased)
  *(check)*

## Model and presets

- **Scene:** dc-sim's `goodhart` world: users → **api** (owned by Team A) → **db** (owned by Team B). Each
  team has a **dashboard** that shows only what its horizon sees (A: api's ρ and p99 and its served
  throughput; B: db's cost and its own error-budget burn). A third, **end-to-end** dashboard shows the
  user's p99 against the flow's SLO. Each team's utility weights are sliders; a 10-tick chart runs from the
  current settings.
- **State:** pure function of params → a 10-tick run `{ ticks: [{api: metrics, db: metrics, e2eP99,
  retryFactor, teamA: {utility}, teamB: {utility, burn}}] }` (dc-sim `TeamPolicy` retry lever,
  `RetryAwareLoadResolver`, `end_to_end_metric`, ported).
- **Live:** changing a weight reruns the 10 ticks and redraws all three dashboards.
- **Rules** (dc-sim `src/dc_sim/org/team.py`, `docs/concepts.md` §5–6):
  1. Each tick, in dc-sim's order: load (with retries from last tick's db p99), metrics, then team
     decisions; a decision takes effect from the next tick.
  2. Team A's retry lever: if its utility weights `downstream_amplification` > 0, it sets retry factor
     **0.5**; else if `served_throughput` > 0, **3.0** (`CONSERVATIVE_RETRY_FACTOR`,
     `AGGRESSIVE_RETRY_FACTOR`).
  3. A team sees only nodes in its horizon (`horizon == owns`): A never sees db; B has no flow entering its
     node, so it can never register an SLO breach and its error-budget burn stays 0.
  4. Retries amplify db load as in `retry-storm` rule 1 (timeout 0.2 s).
  5. The user's latency is the end-to-end p99 = api p99 + db p99 (fanout 1) (`end_to_end_metric`), checked
     against the flow SLO of 3 s.
  6. Tie-break: teams decide in declaration order (A, then B) (dc-sim §8 determinism).
- **Params:** Team A weights `served_throughput` (1) and `downstream_amplification` (0 / 1, default 0);
  Team B weight `cost` (1) and `slo_breach` (0 / 1, default 0; no effect while B's horizon has no flow);
  `horizonB` toggle "B can see the flow" (off).
- **Presets** (dc-sim `scenarios/goodhart.yaml` and `goodhart_fixed.yaml`; numbers from dc-sim's formulas
  reproduced with a script, assertions from `tests/acceptance/test_c_goodhart_local_optimization.py`):
  1. `goodhart` — A values throughput only: retry factor 3 from tick 1; db λ 9 → **36**, saturated; api ρ
     **0.009** (A's dashboard is green, test: ρ < 0.05); B's burn **0** (test); end-to-end p99 ≈ **230 s**
     vs SLO 3 s (test: > 30).
  2. `priced` — `goodhart_fixed`: A also prices downstream amplification: retry factor 0.5, db λ **13.5**, ρ
     0.675, p99 0.71 s; end-to-end ≈ **0.71 s < 3 s** (test: < 3), with no change to Team B.
  3. `b-sees-flow` — derived: give B a horizon including the flow and `slo_breach` weight 1, but A still
     retries at 3: B buys capacity up to its spend cap (0 in the scenario, so nothing changes): shows that
     visibility without authority does not help (check against dc-sim before using).
- **Steps:** explorer (each preset is a 10-tick run drawn at once).
- **Legend:** team dashboard frame (team colour **and** team letter), green/red metric tiles with ✓ / ✗,
  end-to-end tile (thick frame), retries (hatched part of db's load bar). "Changed" marks tiles whose verdict
  changed after the last weight change.
- **Captions:**
  - hr: „Tim A vidi svoj čvor: opterećenje 0,9 %, sve zeleno. Tim B vidi svoj trošak: nula prekoračenja.
    Korisnik čeka 230 sekundi."
  - en: "One term added to Team A's utility, downstream amplification: retries drop to 0.5 and the user's
    p99 falls to 0.7 s. Team B changed nothing."
- **Terms:** Goodhart's law — Goodhartov zakon; local optimisation — lokalna optimizacija; utility —
  korisnost (funkcija koristi) (check); horizon (what a team sees) — vidokrug (check); end-to-end latency —
  kašnjenje s kraja na kraj (check); error budget — proračun greške (NLA T40).
- **Misconceptions:** "if every team meets its metrics, the system is healthy"; "the backend team is at
  fault" (it cannot see the breach); "more dashboards fix it" (incentives, not visibility).
- **Out of scope:** the capacity-buying lever in depth, cost models, organisational advice, observability
  tools (`analyze`/`trace` in dc-sim).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh goodhart-teams sims/goodhart-teams` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/goodhart-teams/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
