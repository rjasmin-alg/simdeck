# lnx-alert-states: Alert states: pending and firing

| | |
|---|---|
| Task | `lnx-alert-states` (wave 3, Linux) |
| Catalogue entry | `lnx-alert-states` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-alert-states/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `monitoring` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **scrape, for: duration, pending → firing, flapping**.

The student: feed a metric, tune the rule.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- **Instructor-only material is cited below** (`dr-lecture-estate/instructor/`). Use it to get the model right; never put its answers, caveat texts or numbers on the page, and don't turn a scenario's model answer into a preset: students work these scenarios.
- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topics T36 (Prometheus, `node_exporter`, data model) and T37 (Grafana, Alertmanager) (Napredna Linux administracija; chapters not written yet)
- Prometheus documentation: "Alerting rules" (`for`, `keep_firing_for` (Prometheus 2.42+), pending/firing; rules 2, 4, 5) and "Configuration" (`scrape_interval`, `evaluation_interval`, defaults 1m; rule 1); Prometheus source `rules/alerting.go` (state transitions, `holdDuration` check; rule 3) (check)
- `/home/rjasmin/projects/dr-lecture-estate/instructor/caveats.md` CV-40 (Prometheus with zero alert rules, Alertmanager receiver missing): a possible motivating aside, not a rule source
- Catalogue seed: NLA T36–37

## Model and presets

- **Scene:** three lanes on one time axis (kit time-axis view if it exists, else drawn locally): the true
  metric (a value per minute, e.g. CPU %), the samples Prometheus scraped from it (dots at scrape times), and
  the alerting rule's state per evaluation (inactive / pending / firing) as a band. Beside it, the rule as
  YAML (`expr: cpu > 90`, `for: 5m`, `keep_firing_for:`), the alert's `activeAt`, and a counter of
  firing → resolved cycles ("notifications that would go out").
- **State:** `{ t, lastSample: {t, v} | null, cond, alert: 'inactive'|'pending'|'firing', activeAt,
  lastTrueAt, cycles, history: [{t, v, sampled, cond, alert}] }`.
- **One step:** one minute passes. Phases in order: (1) scrape, if `t` is a scrape time; (2) evaluate the rule
  on the latest scraped sample; (3) apply the state transition; (4) append to history.
- **Rules:**
  1. The rule sees only scraped samples; between scrapes it sees the last one. A value that rises and falls
     between two scrapes is never seen. Scrape and evaluation intervals both default to 1 min.
  2. Inactive + condition true → pending, `activeAt = t`.
  3. Pending and `t − activeAt ≥ for` → firing. With `for: 0` the alert fires on the first true evaluation and
     is never pending. With `for: 5m` and 1m evaluations, the 6th consecutive true evaluation fires
     (check, Sources).
  4. Pending + condition false → inactive; the `for` timer restarts from zero next time. This is why a
     flapping metric never fires with a long `for`.
  5. Firing + condition false → resolved (inactive), unless `keep_firing_for` > 0: then it stays firing until
     the condition has been false for that long
     (check the version that added `keep_firing_for`, Sources).
  6. Tie-break: within one step, transitions are evaluated once (inactive → pending → firing can happen in
     the same step only when `for: 0`). `cycles` increments on each firing → inactive transition.
- **Params:** `threshold` range 50–99, default 90; `forMin` range 0–10 min, default 5; `keepFiringFor` range
  0–5 min, default 0; `scrape` choice 1 / 2 / 5 min, default 1; `series` select (the preset metric shapes:
  sustained, flapping, short spike, one-minute spike); `resets: true` on `series` and `scrape`.
- **Presets** (threshold 90, evaluation every 1 min; letters per minute 1…n: i inactive, p pending, f firing):
  1. `sustained` — 50,50, then 95 for 9 min, then 60: `iipppppffffiiii`; pending at 3, firing at 8
     (8 − 3 = 5), resolved at 12; 1 cycle. 15 steps. Derived, unchecked.
  2. `flapping-long-for` — 95,95,60 repeated, `for: 5m`: `ppi` ×5, never fires, 0 cycles. 15 steps. Derived.
  3. `flapping-for-0` — same metric, `for: 0`: `ffi` ×5, 5 cycles (alert noise). 15 steps. Derived.
  4. `keep-firing` — same metric, `for: 1m`, `keep_firing_for: 3m`: `p` then `f` to the end, 1 cycle
     (resolves only 3 min after the last true sample). 15 steps. Derived, unchecked.
  5. `short-spike` — 50,50,50,95,95,50…: pending at 4–5, back to inactive at 6, nothing fires. 10 steps.
  6. `missed-by-scrape` — one 95 at minute 6, `for: 0`: with scrape 1m it fires once at 6; with scrape 2m
     (samples at 1,3,5,7,9) it is never seen. 10 steps. Derived.
- **Steps:** 10–15 per preset (one per evaluation minute).
- **Legend:** metric line; dot = scraped sample; hollow dot = value not scraped; band: blank = inactive,
  hatched amber = pending, solid red with a bell icon = firing; dashed line = threshold. "Changed" highlight:
  the band cell and the state badge whose state changed this step.
- **Captions:**
  - hr: „Minuta 8: uvjet je istinit 5 minuta bez prekida (od minute 3), pa uzbuna prelazi iz *pending*
    (na čekanju) u *firing* (aktivna)."
  - en: "Minute 8: the condition has held for 5 minutes without a break (since minute 3), so the alert goes
    from pending to firing."
- **Terms:** alert — uzbuna; alerting rule — pravilo uzbunjivanja; scrape — prikupljanje (uzorka);
  evaluation interval — interval vrednovanja; pending — na čekanju; firing — aktivna (uzbuna);
  flapping — treperenje; metric — metrika. NLA has no chapter yet: check against the NLA glossary
  (`meta/glossary.yaml`) when T36–37 are written (check).
- **Misconceptions:** `for:` delays a notification but still counts the time (it restarts on every false
  evaluation); a lower `for` is "more sensitive" with no cost (noise, preset 3); the monitoring
  server sees every value of the metric (it sees scrapes).
- **Out of scope:** Alertmanager grouping, `group_wait`/`group_interval`/`repeat_interval`, inhibition and
  silences (NLA T37; a possible second page); staleness markers and the 5-minute lookback; recording rules;
  `rate()` over counters.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-alert-states sims/lnx-alert-states` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-alert-states/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
