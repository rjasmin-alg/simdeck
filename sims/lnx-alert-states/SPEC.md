<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-alert-states: spec

One concept: **scrape, `for:` duration, pending → firing, flapping.** One alerting rule, `expr: cpu > threshold`,
evaluated once a minute on the samples scraped from a CPU metric. Task: `docs/tasks/w3/lnx-alert-states.md`.

## Sources

- **[A]** Prometheus `rules/alerting.go`, `AlertingRule.Eval` (main, last change 2026-09-14, read 2026-10-30): a
  result of the query creates an alert `StatePending` with `ActiveAt: ts` unless one that is not inactive exists;
  then `if a.State == StatePending && ts.Sub(a.ActiveAt) >= r.holdDuration` → `StateFiring`; an alert missing from
  the result: pending → deleted; firing with `keepFiringFor > 0` → `KeepFiringSince` set at the first missing
  evaluation, kept firing while `ts.Sub(a.KeepFiringSince) < r.keepFiringFor`; otherwise `StateInactive`,
  `ResolvedAt = ts`. A result while firing resets `KeepFiringSince`.
- **[B]** Prometheus documentation, "Alerting rules" (`for`, `keep_firing_for`, pending and firing) and
  "Configuration" (`scrape_interval`, `evaluation_interval`, both `default = 1m`).
- **[C]** Prometheus `CHANGELOG.md`: "2.42.0 / 2023-01-31 … [FEATURE] Add 'keep_firing_for' field to alerting rules.
  #11827".
- **[T]** the task file (model, presets, captions, terms).

## State

`{ t, lastSample: {t, v} | null, cond, alert: 'inactive'|'pending'|'firing', activeAt, firedAt, keepSince,
cycles, fired, event, history: [{t, v, sampled, cond, alert, kept}] }`. `t` is the minute (0 at the start, 1…n after
each step). `keepSince` is [A]'s `KeepFiringSince`. `cycles` counts firing → inactive transitions, `fired` counts
transitions into firing (one notification each way). `event` names what the step did, for the caption.

## One step

One minute passes: `t + 1`. Phases in order [T]: (1) scrape, if `t` is a scrape time; (2) evaluate the condition on
the latest scraped sample; (3) apply the transition; (4) append to history.

## Rules

1. **Only scraped samples.** Scrapes at minute 1 and every `scrape` minutes after (1, 3, 5, … for 2 min; 1, 6, 11 for
   5 min). The condition is `lastSample.v > threshold`, the last scraped sample held between scrapes; before the first
   scrape there is no data and the condition is false. A value that rises and falls between two scrapes is never seen.
   Evaluation every minute; scrape and evaluation intervals default to 1 min [B]. Staleness and the 5-minute lookback
   are out of scope [T]: a held sample stays visible until the next scrape (at most 5 min, inside the lookback).
2. **Inactive + true → pending**, `activeAt = t` [A].
3. **Pending + `t − activeAt ≥ for` → firing**, `firedAt = t`, `fired + 1` [A]. With `for: 0` the alert fires at the
   first true evaluation and is never seen pending; with `for: 5m` the 6th consecutive true evaluation fires (true at
   3…8: 8 − 3 = 5).
4. **Pending + false → inactive**, `activeAt` dropped [A]: the next true evaluation starts a new pending alert with a
   new `activeAt`, so the `for` timer starts from zero.
5. **Firing + false → inactive (resolved)**, `cycles + 1` — unless `keep_firing_for > 0` [A]: the first false
   evaluation sets `keepSince = t`; the alert stays firing while `t − keepSince < keep_firing_for` and resolves at
   `t = keepSince + keep_firing_for`. A true evaluation while firing sets `keepSince` back to none. So the alert
   resolves `keep_firing_for` minutes after the **first false evaluation**. `keep_firing_for` exists since
   Prometheus 2.42 [C].
6. **Tie-break:** the transitions run once per step in the order above: inactive → pending → firing in one step
   only when `for: 0` (`t − activeAt = 0`). A true evaluation while firing stays firing; an inactive alert with a
   false condition stays inactive.

## Params

| key | values | default | resets |
|---|---|---|---|
| `series` | `sustained`, `flapping`, `short-spike`, `one-spike` | `sustained` | yes |
| `threshold` | 50…99 | 90 | no |
| `forMin` | 0…10 min | 5 | no |
| `keepFiringFor` | 0…5 min | 0 | no |
| `scrape` | 1, 2, 5 min | 1 | yes |

Steps = the series' length: 15 (`sustained`, `flapping`), 10 (`short-spike`, `one-spike`). `sim.json` `steps` is the
default's, 15.

## Series (CPU %, minute 1…n)

- `sustained`: 50, 50, then 95 × 9 (minutes 3–11), then 60 × 4.
- `flapping`: 95, 95, 60 repeated 5 times.
- `short-spike`: 50, 50, 50, 95, 95, then 50 × 5.
- `one-spike`: 50 × 5, 95 at minute 6, then 50 × 4.

## Presets and expected numbers

Threshold 90, evaluation every minute; letters per minute 1…n: i inactive, p pending, f firing. Checked by running
the model (`sim.test.js`, "presets"); derived from [A], not from a running Prometheus *(check)*.

| id | params | states | fired | resolved |
|---|---|---|---|---|
| `sustained` | sustained, for 5, scrape 1 | `iipppppffffiiii` (pending 3, firing 8, resolved 12) | 1 | 1 |
| `flapping-long-for` | flapping, for 5 | `ppi` × 5 | 0 | 0 |
| `flapping-for-0` | flapping, for 0 | `ffi` × 5 | 5 | 5 |
| `keep-firing` | flapping, for 1, keep 3 | `p` then `f` × 14; kept at 3, 6, 9, 12, 15; would resolve at 18 | 1 | 0 |
| `short-spike` | short-spike, for 5 | `iiippiiiii` (pending 4–5, inactive 6) | 0 | 0 |
| `missed-by-scrape` | one-spike, for 0, scrape 2 | `iiiiiiiiii` (samples 1, 3, 5, 7, 9 all 50) | 0 | 0 |

Variations the page invites (tested): `one-spike`, for 0, scrape 1 → `iiiiifiiii`, fired 1, resolved 1; scrape 5 →
samples at 1, 6: the 95 is seen at 6 and held to 10, `iiiiifffff`. `sustained` scrape 2 → `iipppppfffffiii`
(the 95 scraped at 11 is held through 12); scrape 5 → `iiiiipppppfffff`.

**Deviation from the task:** the task gives `keep-firing` "1 cycle". With the same metric the alert never resolves in
15 minutes (the metric keeps flapping and every true sample resets `keepSince`), so the page shows two counters,
fired and resolved: 1 and 0, and the caption says when it would resolve (minute 18, 3 min after the first false
evaluation at 15). The task's "3 min after the last true sample" is, by [A], 3 min after the first false evaluation.

## Captions

The step caption says the event first (so minute 8 of `sustained` is the task's caption verbatim), then what the scrape
did (a new sample, or the held one from minute m, and the real value it misses when that changes the condition). Events: pending (fires at `activeAt + for` if it holds), held (k of `for`
min), fired (the task's caption: "Minute 8: the condition has held for 5 minutes without a break (since minute 3), so
the alert goes from pending to firing."; for `for: 0`, fired without pending), firing, reset (after n true evaluations; the timer starts over),
resolved, kept (resolves at `keepSince + keep_firing_for` if it stays false), idle.

## Out of scope

Alertmanager grouping, `group_wait`/`group_interval`/`repeat_interval`, inhibition and silences; staleness markers
and the lookback; recording rules; `rate()` over counters [T]. Rule reloads (the firing → pending branch of [A] when
`for` grows) are not modelled: params apply to the whole run, replayed from minute 0.
