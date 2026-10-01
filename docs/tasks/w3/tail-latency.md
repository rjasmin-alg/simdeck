# tail-latency: Tail latency and fan-out

| | |
|---|---|
| Task | `tail-latency` (wave 3, Performance and capacity) |
| Catalogue entry | `perf-tail-latency` in `docs/catalogue.md` §4.8 |
| Kind | build a new simulator |
| Folder | `sims/tail-latency/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | DR, NLA |
| Topic / tags / level | `distributed` / `performance` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `utilisation-latency` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **p99 decouples from the mean; fan-out makes the tail common**.

The student: sliders for variability and fan-out.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.8.
5. `sims/utilisation-latency/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/dc-sim/docs/concepts.md`, `/home/rjasmin/projects/dc-sim/scenarios/` (Python reference model; its acceptance tests give expected numbers)
- Catalogue seed: dc-sim tail_decoupling
- dc-sim specifics: `scenarios/tail_decoupling.yaml`, `tests/acceptance/test_a_tail_decoupled_from_mean.py`
  (the oracle for preset 1), `src/dc_sim/kernel/queueing.py` (`p99_latency` docstring: the cv² scaling is a
  modelling choice), `docs/concepts.md` §2
- J. Dean and L. A. Barroso, "The Tail at Scale", *Communications of the ACM* 56(2), 2013 (fan-out
  probability, hedged requests)

## Model and presets

- **Scene:** two panels. **Left, one backend:** a latency distribution sketch with the mean and p99 marked,
  and two gauges (W mean, p99) driven by cv². **Right, fan-out:** one user request fans out to N backends
  in parallel and waits for the **slowest**; a bar shows the share of user requests that hit at least one
  backend p99 ("slow user requests").
- **State:** pure function of params → `{ wMean, p99, ratioMean, ratioP99, fanout, pSlow }`; reuses
  `utilisation-latency`'s formulas.
- **Live:** the cv² slider moves the backend's p99 much more than its mean; the fan-out slider moves pSlow.
- **Rules:**
  1. Mean and p99 of one node: dc-sim formulas (`utilisation-latency` rules 2–3). At low ρ the mean is
     dominated by the service time 1/C, which does not depend on cv², while p99 scales with (1 + cv²)/2
     (dc-sim `docs/concepts.md` §2: "doubling cv2 can 5x the tail while the mean barely moves").
  2. A fan-out request waits for all N calls; if each call is slow (above its p99) with probability 1 % and
     calls are independent, the user request is slow with probability 1 − 0.99^N (J. Dean and L. A. Barroso,
     "The Tail at Scale", *CACM* 56(2), 2013).
  3. Independence is an assumption; shared causes (one slow disk, GC pauses on one host) make it worse or
     better but not 1 − 0.99^N (stated on the page) (derived).
  4. Hedged/backup requests: send a second copy after the p95 and take the first answer; out of scope for
     the model, named in the explanation (Dean & Barroso).
- **Params:** `cv2` range 0–16 (1); `rho` choice 0.1 / 0.5 / 0.8 (0.1); `fanout` range 1–200 (1); `slowP` choice
  p99 / p99.9 (p99).
- **Presets:**
  1. `tail-decoupled` — dc-sim `scenarios/tail_decoupling.yaml` / `test_a_tail_decoupled_from_mean`: db C 10,
     λ 1 (ρ 0.1), cv² 1 → 9: mean **0.111 → 0.156 s** (×1.4), p99 **0.512 → 2.558 s** (×5.0); the test
     asserts p99 ratio > 3, mean ratio < 1.5.
  2. `fanout-10` — N = 10: **9.6 %** of user requests are slow (1 − 0.99¹⁰).
  3. `fanout-100` — N = 100: **63.4 %** are slow: the backend's rare tail is the user's normal case (Dean &
     Barroso's example: 1 in 100 slow, 100 servers → 63 %).
  4. `p999` — N = 100 with p99.9: 1 − 0.999¹⁰⁰ = **9.5 %**: why large services set targets on p99.9.
- **Steps:** explorer, no steps.
- **Legend:** mean marker (solid line), p99 marker (dashed line), fan-out call (thin arrow), slowest call
  (thick arrow, "najsporiji"), slow share bar (hatched). "Changed" marks the gauge that moved most after the
  last change.
- **Captions:**
  - hr: „Varijabilnost (*cv²*) s 1 na 9: prosjek raste 1,4 puta, a 99. percentil 5 puta. Prosjek izgleda
    dobro; rep (*tail*) ne."
  - en: "One user request calls 100 servers and waits for the slowest: 63 % of user requests now see a
    backend's 1-in-100 slow case."
- **Terms:** tail latency — kašnjenje u repu (repna latencija) (check); percentile — percentil; mean —
  prosjek; fan-out — grananje poziva (check); variability — varijabilnost; hedged request — zaštitni
  (dvostruki) zahtjev (check).
- **Misconceptions:** "if the mean is fine, users are fine"; "p99 is the slowest 1 % of users" (with
  fan-out, most users can hit it); "the tail is noise to ignore".
- **Out of scope:** queue mechanics (`utilisation-latency`), retries amplifying load (`retry-storm`),
  measuring percentiles correctly (histograms, coordinated omission).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `tail-latency` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh tail-latency sims/tail-latency` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/tail-latency/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
