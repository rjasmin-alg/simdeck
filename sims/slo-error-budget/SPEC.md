<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# slo-error-budget: spec

Explorer (task `docs/tasks/w3/slo-error-budget.md`, catalogue `perf-slo-error-budget` §4.8). One concept: **burn
rate, and fast and slow burn alerts**. The student injects incidents and watches the error budget drain and the
alert lamps light. The state is a pure function of the params (`compute(params)`); there are no steps.

## Params

| key | values | default | notes |
|---|---|---|---|
| `slo` | 99, 99.5, 99.9, 99.99 (%) | 99.9 | the objective |
| `incidents` | list of `{ startDay, durationMin, errorRatePct }` | `[]` | `startDay` may be fractional (10.5 = day 10, 12:00) |
| `at` | 0 … 43 200 (minutes since day 0), step 1 | 0 | the cursor: the instant where the gauges and lamps are read |
| `showWindows` | boolean | true | draw the five windows that end at the cursor |
| `sel`, `iStart`, `iDur`, `iRate` | | 0, 0, 6, 8 | the page's incident editor: `incidents[sel]` as a start hour (0–719) and stops in `DURATIONS` and `RATES` |

The window is fixed at 30 days = 43 200 min (`windowDays` 30 in the task). Editor stops: durations 1, 2, 5, 10, 20,
30, 60, 120, 240, 360, 720, 1440, 4320, 10 080, 21 600, 43 200 min; error rates 0.05, 0.1, 0.2, 0.5, 1, 1.44, 2, 5,
10, 25, 50, 100 %. At most 6 incidents; a new one starts at the cursor's hour, 30 min at 10 %.

## Time and units

- Time is whole minutes. Minute *m* is the interval [m, m + 1); an **instant** *t* (0 … 43 200) is the moment after
  *t* minutes. The window of *w* minutes that ends at instant *t* holds minutes t − w … t − 1.
- Error rates are whole **basis points** (1 bp = 0.01 %): every editor stop and every SLO's allowed rate is a whole
  number of bp, so budgets and window sums are integers (bp·min) and thresholds compare exactly.
- An incident covers minutes `round(startDay × 1440)` … + `durationMin` − 1, clipped to the window (a start before
  day 0 loses the part before it).
  Overlapping incidents add their rates, capped at 100 %.
- **Before day 0 there were no errors** (the month starts after a clean one): a window that reaches back past day
  0 counts zeros there, and is still divided by its full length. *(decision: the task does not say; this keeps a
  window's burn a plain ratio and makes the ticket in preset 3 wait for its 3-day window to fill halfway.)*

## Rules

Sources: B. Beyer, C. Jones, J. Petoff, N. R. Murphy (eds.), *Site Reliability Engineering*, O'Reilly 2016, ch. 3
"Embracing Risk" (the error budget) and ch. 4 "Service Level Objectives"; B. Beyer et al. (eds.), *The Site
Reliability Workbook*, O'Reilly 2018, ch. 5 "Alerting on SLOs" (burn rate, multiwindow multi-burn-rate alerts, the
table of 14.4 / 6 / 1 with 1 h + 5 min, 6 h + 30 min, 3 d + 6 h) *(check chapter numbers against a copy; from
memory)*.

1. **Error budget** = (1 − SLO) × window. 99.9 % over 30 days: 0.1 % of 43 200 min = **43.2 min** of total
   failure (or the same share of failed requests). 99 % → 432, 99.5 % → 216, 99.99 % → 4.32 min.
2. **Burn rate** over a window = the window's mean error rate / (1 − SLO). Burn 1 spends exactly the budget over
   the whole window; burn 14.4 spends 2 % of a 30-day budget in 1 hour (14.4 × 60 / 43 200 = 0.02).
3. **Multiwindow, multi-burn-rate alerts.** An alert is on at an instant when its long **and** its short window are
   both at or above its threshold:
   - **page (fast burn):** burn ≥ 14.4 over 1 h and over 5 min;
   - **page (slow burn):** burn ≥ 6 over 6 h and over 30 min;
   - **ticket:** burn ≥ 1 over 3 days and over 6 h.
   The short window makes the alert stop soon after the problem stops.
4. **Budget used by an incident** = error rate × duration, in minutes of full failure (20 min at 100 % = 20 min;
   1 h at 1.44 % = 0.864 min). The month's total is the integral of the (capped) error rate.
5. **Tie-break:** a burn rate exactly at a threshold fires (≥). The budget is exhausted at the first instant the
   errors so far reach it (≥).
6. dc-sim's `ErrorBudgetTracker.burn_rate` (`src/dc_sim/org/error_budget.py`) is the breached fraction of checkpoints
   in a rolling window, a different definition; this page uses the SRE ratio of rule 2 (NOTES.md).

In integers (rule 5 exact): with `a` the allowed rate in bp, a window of *w* min with sum *s* bp·min has burn
s / (w · a); "burn ≥ θ" is tested as 10 s ≥ (10 θ) · w · a with 10 θ = 144, 60, 10.

## State (`compute`)

`{ allowedBp, budgetMin, usedMin, usedPct, remainingPct, at, usedAtMin, remainingAtPct, burn: { w5m, w30m, w1h, w6h,
w3d }, alerts: { fast, slow, ticket }, lit: { fast, slow, ticket }, firstFired, peak, exhaustedAt, hourly, incidents }`

- `burn`, `alerts`: at the cursor `at`. `usedAtMin`, `remainingAtPct`: errors so far at the cursor.
- `usedMin`, `usedPct`, `remainingPct`: the whole window (`usedPct` may pass 100; `remainingPct` stops at 0).
- `lit[id]`: the intervals `[from, to)` of instants where the alert is on (`to` is the first instant off;
  T + 1 when still on at the end). `firstFired[id]`: the first such instant or null.
- `peak[w]`: the highest burn of each window over the month. `exhaustedAt`: instant or null.
- `hourly`: the mean error rate (bp) of each of the 720 hours, for the timeline's bars.
- `incidents`: each incident clipped, with its own `usedMin` (rule 4, overlaps not capped).

## Presets (SLO 99.9 %, 30 days)

Numbers from rules 1–5, checked by hand and by an independent script (exact fractions, NOTES.md):

| id | incident | cursor | expected |
|---|---|---|---|
| `outage-20min` | day 10 12:00, 20 min at 100 % | end of the outage | **46.3 %** of the budget (20 / 43.2); 1 h burn **333.3**, 5 min burn 1000: the fast page is on (from 1 min into the outage until 5 min after it, instants 15 121 … 15 144); slow page and ticket fire too |
| `fast-burn` | day 8 12:00, 1 h at 1.44 % | end of the hour | burn **14.4** over 1 h and 5 min, exactly the threshold: the fast page fires at the end of the hour (one instant, 12 300) by the tie-break; **2 %** of the budget |
| `slow-burn` | day 0, 30 days at 0.2 % | day 15 | burn **2** in every full window; no page ever; the ticket fires at day 1.5 (instant 2160, when the 3-day window is half full) and stays on; the budget is exhausted on **day 15** (instant 21 600); 200 % used by day 30 |
| `blip` | day 5 12:00, 2 min at 100 % | 7 min after the blip started | 1 h burn **33.3**, 5 min burn **400** at the end of the blip: page; on at instants 7921 … 7926, off at 7927 = 5 min after the blip ended, while the 1 h burn is still 33.3; **4.6 %** of the budget; 6 h burn 5.56 < 6, so no slow page |
| `under-the-radar` | day 0, 30 days at 0.05 % | day 30 | burn **0.5**, no alert ever, **50 %** of the budget used: fine by design |

## Captions (`captionKey`)

First match wins:

1. `empty`: no incidents.
2. `page`: a page is on at the cursor (fast before slow): both windows and the threshold.
3. `cleared`: a page fired earlier, its long window is still at or over the threshold at the cursor, but it is off
   (the short window fell under): the short window ended it.
4. `slowBurn`: the budget is exhausted, no page fired all month, a ticket did: "never wakes anyone, … the ticket
   alert is the one that catches it" (the task's en caption).
5. `ticket`: the ticket is on at the cursor.
6. `exhausted`: the budget is exhausted (and a page fired).
7. `quiet`: no alert fired all month.
8. `after`: alerts fired, none is on at the cursor.

`page` and `ticket` also say how much of the budget is used by the cursor; `exhausted`, `quiet` and `after` how much
over the month; `empty` gives the budget; `cleared` (about the windows) and `slowBurn` (when it is gone) do not.
`exhausted` with no alert at all (none found in a 4000-case random search, but not ruled out) has its own wording.

## Not modelled

SLI choice and measurement, request-based vs time-based budgets in depth (the page counts minutes of full failure,
equivalent to the share of failed requests at constant traffic), what a team does with its budget (`goodhart-teams`),
how an alert is delivered (`alert-to-nobody`), suppressing the lower alerts while a page is on.
