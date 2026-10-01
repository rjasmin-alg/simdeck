# slo-error-budget: SLOs and error budgets

| | |
|---|---|
| Task | `slo-error-budget` (wave 3, Performance and capacity) |
| Catalogue entry | `perf-slo-error-budget` in `docs/catalogue.md` §4.8 |
| Kind | build a new simulator |
| Folder | `sims/slo-error-budget/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | NLA, DR |
| Topic / tags / level | `distributed` / `monitoring` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **burn rate, fast and slow burn alerts**.

The student: inject incidents, watch the budget.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.8.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T40 (Napredna Linux administracija; chapters not written yet)
- `/home/rjasmin/projects/dc-sim/docs/concepts.md`, `/home/rjasmin/projects/dc-sim/scenarios/` (Python reference model; its acceptance tests give expected numbers)
- Catalogue seed: NLA T40, dc-sim
- NLA toc T40 ("SLI, SLO i proračun greške — kako se mjeri „radi li"") and T37 (alerting) for the Croatian
  terms
- dc-sim specifics: `src/dc_sim/org/error_budget.py` (`ErrorBudgetTracker`: burn = breached fraction of
  checkpoints, a different definition), `src/dc_sim/observability/monitors.py` (tier-0 burn and knee
  proximity), `tests/unit/test_error_budget.py`
- B. Beyer et al. (eds.), *Site Reliability Engineering*, ch. 3 "Embracing Risk" and ch. 4 "Service Level
  Objectives"; *The Site Reliability Workbook*, ch. 5 "Alerting on SLOs" (burn rates 14.4 / 6 / 1 with
  1 h + 5 min, 6 h + 30 min, 3 d + 6 h windows) *(check chapter numbers)*

## Model and presets

- **Scene:** a 30-day timeline of the error rate (bars per hour) with incidents drawn on it; above it the
  **error budget** as a draining bar ("43.2 min of 43.2 left"); to the right, the **burn rate** gauges for
  the alert windows (5 min, 1 h, 30 min, 6 h, 3 days) and the three alert lamps (page fast, page slow,
  ticket), each lit only when both its long and short window exceed the threshold.
- **State:** pure function of params and the incident list → `{ budgetMin, usedMin, remainingPct,
  burn: {w5m, w1h, w30m, w6h, w3d}, alerts: {fast, slow, ticket}, exhaustedAt|null }`.
- **Live:** adding or dragging an incident recomputes the budget and the alert lamps over the timeline.
- **Rules** (*Site Reliability Engineering*, ch. "Service Level Objectives" and "Embracing Risk";
  *The Site Reliability Workbook*, ch. "Alerting on SLOs") (check):
  1. Error budget = (1 − SLO) × window: 99.9 % over 30 days → 0.1 % of 43,200 min = **43.2 min** of total
     failure (or the equivalent share of failed requests).
  2. Burn rate = observed error rate / (1 − SLO): burn 1 spends exactly the budget over the whole window;
     burn 14.4 spends 2 % of a 30-day budget in 1 hour.
  3. Multiwindow, multi-burn-rate alerts: **page** if burn ≥ 14.4 over 1 h **and** over 5 min; **page** if
     ≥ 6 over 6 h and over 30 min; **ticket** if ≥ 1 over 3 days and over 6 h. The short window makes the alert
     stop soon after the problem stops.
  4. Budget used by an incident = error rate × duration, in minutes of full failure.
  5. Tie-break: a burn rate exactly at the threshold fires (≥).
  6. Note: dc-sim's `ErrorBudgetTracker.burn_rate` is the breached fraction of checkpoints in a window, not
     this ratio; the page uses the SRE definition and says so in NOTES.md.
- **Params:** `slo` choice 99 / 99.5 / 99.9 / 99.99 % (99.9); `windowDays` 30 (fixed); incidents: list of
  `{startDay, durationMin, errorRatePct}` edited with presets and an "add incident" button; `showWindows`
  toggle.
- **Presets** (SLO 99.9 %, 30 days; arithmetic from rules 1–4, derived and checked by hand):
  1. `outage-20min` — 20 min at 100 % errors: **46 %** of the budget gone (20 / 43.2); 1 h burn 333, the
     fast page fires.
  2. `fast-burn` — 1.44 % errors for 1 h: burn **14.4**, **2 %** of the budget; the fast page fires at the
     end of the hour.
  3. `slow-burn` — 0.2 % errors, steadily: burn **2**; no page fires, the ticket fires after the 3-day/6-h
     condition; the budget is exhausted on **day 15**.
  4. `blip` — 2 min at 100 %: 1 h burn **33.3**, 5 min burn 400 at the end of the blip → page; the 5-min window
     clears 5 min later and the page stops; 4.6 % of the budget used.
  5. `under-the-radar` — 0.05 % errors all month: burn 0.5, no alert ever, **50 %** of the budget used:
     fine by design.
- **Steps:** explorer, no steps.
- **Legend:** error-rate bar (solid), incident (bracket with label), budget bar (drains left to right),
  burn gauge with threshold tick, alert lamp (filled + "PAGE"/"TICKET" text when lit). "Changed" marks lamps
  that changed state after the last edit.
- **Captions:**
  - hr: „Ciljana razina usluge (*SLO*) 99,9 % kroz 30 dana daje proračun greške (*error budget*) od 43,2
    minute. Dvadeset minuta ispada potrošilo je gotovo polovicu."
  - en: "0.2 % errors never wakes anyone, yet at burn rate 2 the month's budget is gone on day 15: the
    ticket alert is the one that catches it."
- **Terms:** service level indicator / objective — pokazatelj / ciljana razina usluge (SLI / SLO) (NLA T40,
  check); error budget — proračun greške (NLA T40); burn rate — brzina trošenja (proračuna) (check); alert —
  uzbuna (NLA T37); page / ticket — hitna uzbuna / zahtjev (check); window — vremenski prozor.
- **Misconceptions:** "99.9 % allows a few seconds a day, nothing to plan"; "alert on any error"; "a short
  outage is harmless" (preset 1).
- **Out of scope:** SLI selection and measurement, request-based vs time-based budgets in depth, team
  policies for spending the budget (link `goodhart-teams`), the alert delivery path (`alert-to-nobody`).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh slo-error-budget sims/slo-error-budget` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/slo-error-budget/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
