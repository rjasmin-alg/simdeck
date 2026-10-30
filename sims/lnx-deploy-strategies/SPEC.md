<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-deploy-strategies: spec

One concept: **how a rolling update, blue-green and a canary move traffic and roll back.** The student deploys the
same bad (or good) v2 with all three at once and compares how many requests fail and how each gets back to v1.
Task: `docs/tasks/w3/lnx-deploy-strategies.md`; catalogue `lnx-deploy-strategies` (§4.4), seed NLA T33.

## State

```
{ t, lanes: {
    rolling:   { phase, event, v2Share, v2Req, instances: [{id, ver, ready}], changed, failed, total, rate,
                 trippedAt, finishedAt, deadlineAt },
    blueGreen: { …same…, live: 'blue'|'green', instances carry set: 'blue'|'green' },
    canary:    { …same…, stage } } }
```

`phase`: `idle` (minute 0) · `deploying` · `rollingBack` (the check tripped; the rollback move is next) · `done` ·
`rolledBack` · `stalled`. `done`, `rolledBack` and `stalled` are **finished**. `event` names what this minute did
(`start`, `advance`, `deploy`, `trip`, `done`, `back`, `rolledBack`, `stalled`, `refused`, `serving`, `waiting`,
`idle`); the caption reads it. `changed` lists the instance ids started or replaced this minute (the page marks the
split bar changed by comparing `v2Share` with the previous minute). `rate` is the rate the lane's check reads, exact:
the canary's own (= v2Error while it has traffic), the others' service-wide (requests to v2 × v2Error / 2,000).

## One step = one minute, per lane, in order

1. Apply the strategy's next move, or its rollback move when phase is `rollingBack`.
2. Route **2,000 requests** by the split (% to v2), to ready instances only, evenly within a version.
3. Failed = requests to v2 × v2's error rate, **rounded to a whole request, half up** (500 × 1.5 % = 7.5 → 8).
4. Run the lane's check on the **exact** rate (not the rounded count); if it trips, phase = `rollingBack` (the move
   happens next minute).

A finished lane keeps its last state while the others run on (COMMON.md §11): it still routes and counts, so a lane
`done` at 100 % on a bad v2 keeps failing every minute (`serving`); `rolledBack` and `stalled` lanes serve v1 (0).

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | **Rolling**, surge 1, unavailable 0: one instance replaced per step; a new instance takes traffic only once ready; with 4 instances v2's share goes 25 → 50 → 75 → 100 %. | Kubernetes "Deployments", rolling update strategy, `maxSurge`/`maxUnavailable` *(check)* |
| 2 | **Rolling, v2 never ready**: minute 1 starts one v2 (the surge, a 5th instance, not ready); no v1 may go (unavailable 0), so rolling **stalls** with 4 × v1 serving and 0 failed. It reports no progress at its progress deadline (600 s = 10 min after it started: `deadlineAt` = minute 11) and does **not** roll back by itself. | Kubernetes "Deployments", failed deployment, `progressDeadlineSeconds` default 600 *(check)* |
| 3 | **Blue-green**: minute 1 deploys green (4 × v2) beside blue at 0 % and health-checks it; minute 2 switches 100 % at once; rollback switches back in one minute, because blue still runs. The switch is **refused** when green is not ready (phase `stalled`, blue keeps 100 %). | Fowler, "BlueGreenDeployment"; derived *(check)* |
| 4 | **Canary**: stages 10, 10, 25, 50, 100 % (v2 instances 1, 1, 1, 2, 4); the check compares the canary's **own** error rate (failed / requests to v2) with the threshold and aborts when it is over; the abort sets v2 to 0 % in one minute. A canary that is not ready gets no traffic and the lane stalls. | SRE Workbook ch. 16 "Canarying Releases" *(check)* |
| 5 | **Rolling and blue-green** rely on the service-wide alert: overall error rate (failed / 2,000) > threshold. Rollback starts the minute after the trip. Rolling rollback is rolling: −25 % per minute, the newest v2 first. | Task; Kubernetes `rollout undo` is the manual move the alert prompts |
| 6 | **Tie-break**: a check that trips in the minute a lane reaches 100 % still rolls back; a lane that reaches 100 % with no trip is `done` and stops there (no further checks). | Task |
| 7 | **Tie-break**: the check is strictly **over** the threshold, on the exact rate: exactly 2 % at a 2 % threshold does not trip (rolling at 25 % with v2Error 8: 40 of 2,000), and a canary at 1.5 % against 1.5 % does not trip at 25 % although its 7.5 failures round to 8. Compared exactly (`requests to v2 × v2Error > threshold × requests`, all on the 0.5 % grid). | Derived (an alert `>`), the task's "> threshold" |
| 8 | **Steps** = the minute the last lane finishes, at least 3 (the longest lane decides; task "3–6 per preset"). Never more than 8 over the whole parameter range (rolling tripping at 100 %: 4 out, 4 back). | Task |

Params: `v2Error` 0–100 % (step 0.5, default 100), `v2Ready` (default on), `threshold` 1–10 % (step 0.5, default 2).
All reset to minute 0. Requests per minute fixed at 2,000.

## Presets and expected numbers (checked by script and in `sim.test.js`)

| Preset | Params | Rolling | Blue-green | Canary | Steps |
|---|---|---|---|---|---|
| `all-errors` | defaults | 500 failed (25 % one minute, trip, back to 0 at 2) | 2,000 (green at 1, switch at 2, back at 3) | 200 (10 % one minute, back at 2) | 3 |
| `subtle-bug` | v2Error 3 | 15 + 30 + 45 (trip at 75 %: 2.25 %) + 30 + 15 = **135**, back at 6 | **60**, trip at the switch, back at 3 | **6** (own rate 3 % at 10 %), back at 2 | 6 |
| `below-threshold` | v2Error 1.5 | 8 + 15 + 23 + 30 + 30 = 106, done at 4 (overall 1.5 % never > 2 %) | 30 a minute from minute 2: 120, done at 2 | 3 + 3 + 8 + 15 + 30 = 59, done at 5 (own rate 1.5 %) | 5 |
| `crash` | v2Ready off | stalled at 1 (5th instance not ready), 0 failed, deadline at 11 | green unhealthy at 1, switch refused at 2, 0 | canary not ready at 1, no traffic, 0 | 3 |
| `good-release` | v2Error 0 | done at 4 | done at 2 | done at 5 | 5 |

Not a preset, tested: v2Error 3, threshold 2.5: rolling 75 % gives 2.25 % (no trip), 100 % gives 3 % → trips at 100 %
(rule 6) and rolls back 75, 50, 25, 0: 240 failed, 8 steps.

## Deviations from the task (also in NOTES.md)

- `below-threshold` runs **5** steps, not 6: by rule 8 the canary finishes last at minute 5 (10, 10, 25, 50, 100).
- Rounding half up (step 3) is not in the task; with 1.5 % some minutes are 7.5 requests. Only the counts are
  rounded; the checks read the exact rate (rule 7).
- Two phases added: `idle` (minute 0) and `rolledBack` (finished after a rollback); the task lists deploying / done /
  rolling back / stalled.
