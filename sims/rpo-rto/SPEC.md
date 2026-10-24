<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# rpo-rto: specification

Task `docs/tasks/w2/rpo-rto.md`, catalogue `dr-rpo-rto` (§4.6). One concept: **how much data and how much time you
lose, on one timeline**. An explorer: the state is a pure function of the params, `compute(params)` in `sim.js`.

## Time

Whole minutes from Monday 00:00 of the week `week` (a day number, days since 1970-01-01, always a Monday). Minutes
may be negative (earlier weeks) or beyond 10 080 (the next week). Dates are computed from the day number without
`Date` (`civil`, the days-from-civil inverse). Durations print as `12 h 25 min`, and from 48 h up as
`49 d 12 h 25 min` (so 32 h 30 min stays in hours, as the task's numbers are written).

## Params

| Param | Values | Default | Notes |
|---|---|---|---|
| `interval` | 15 min, 1 h, 24 h, 7 d | 24 h | scheduled copies start at Monday 01:40 + k · interval (k any integer) |
| `jobMin` | 0–120 min, step 2 | 12 | a copy is complete `jobMin` after its start (estate: 01:40 → 01:52) |
| `failedRuns` | 0–60 | 0 | the newest n runs that started at or before the incident failed |
| `replica` | on / off | off | a copy kept in step with the system |
| `kind` | `loss` / `damage` | `loss` | `loss`: the system stops (power, hardware, site); `damage`: it runs on with the damage (deletion, encryption, corruption) |
| `incidentAt` | one week, step 5 min | Thu 14:05 | the red marker; detection starts here |
| `damageBefore` | 0–72 h, step 10 min | 0 | the damage began this long before the incident (corruption found late) |
| `detect`, `decide`, `restore`, `verify` | 0–48 h / 0–24 h / 0–72 h / 0–8 h; detect step 10 min, the others 30 min | 0.5 h, 1 h, 4 h, 1 h | the recovery phases, consecutive from the incident |
| `rpoH`, `rtoH` | 0–168 h / 0–72 h, step 1 h | 24, 8 | targets |
| `week` | hidden; set by presets | 2026-11-23 | the calendar week the minutes count from |

Durations are minutes in the model (the task writes them in hours; the 10-minute grid holds 32.5 h and 5 h 40 min).

## Rules

Let **I** = `incidentAt`, **S** = I − `damageBefore` (the damage's real start). **I** is when the service fails (the
outage, or the deletion or encryption that takes it away); S < I only for damage that crept in before it, unnoticed
(corruption found late). Data loss is counted to I; the time down runs from I, when the service stopped.

1. **Actual RPO** = I − the newest **good** recovery point (BC/DR definition: the point in time data is restored to,
   ISO 22300 *(check)*; UL ch23 „točka oporavka"). The newest is by the point's data time (its start: the copy is
   taken at its start); a tie between a copy and the replica at the same minute gives the same loss.
2. **Schedule**: worst case = `interval` + `jobMin`; average = `interval` / 2 + `jobMin`. For an incident at a uniform
   random moment, the loss runs from `jobMin` (just after a copy completes) up to `interval` + `jobMin` (just before
   the next one completes), so the mean is exactly `interval`/2 + `jobMin`; the task's "≈ half" is this. Failed,
   unfinished or damaged copies make the actual loss larger than the schedule's worst case.
3. **Actual RTO** = detect + decide + restore + verify, counted from **I** (not from when someone noticed). Phases
   stack from I in this order; a zero phase has zero width. Service back = I + RTO.
4. **A scheduled copy** holds the data as at its start and restores only if it was completed. Classified in this
   order (the first that applies):
   - `failed`: one of the newest `failedRuns` runs with start ≤ I (or, under `damage`, a run after I while the
     failures go on);
   - `unfinished`: under `loss`, not complete when the system stopped (done = start + `jobMin` > I): it was being
     written at the outage, including a run that starts exactly at I;
   - `good`: started at or before S (its data is from before the damage; tie counts as good). Under `damage` a copy
     started before S but still running at S completes and is good;
   - `damaged`: started after S: it carries the damage (rule 4 of the task: DR S3, S15).
   Under `kind: damage` the system keeps running, so copies are still taken after I until detection ends
   (start ≤ I + detect); they are `damaged` and drawn ✗. Under `loss` no copy is taken after I.
5. **Replica** (`replica` on): one recovery point at the replica's position. Under `loss` the replica stops with the
   system, at I, and is good when I ≤ S (i.e. `damageBefore` = 0): **RPO 0**. Under `damage` it copies the damage on
   until detection ends (position I + detect) and is never good: replication gives no recovery point for a deletion
   or encryption (DR S15). It is always `damaged` then, even with detect = 0.
6. **Targets** are met when actual ≤ target; **equal counts as met** (RPO: loss ≤ `rpoH` · 60; RTO: down ≤ `rtoH` · 60).
7. The walk back from the newest run stops at the first `good` one; one earlier run is returned too, so the page shows
   the spacing. A good copy always exists (failures are finite and S is finite).

## State

`{ incident, damageStart, back, points: [{ t, done, kind: 'copy', state, after }], replica: { t, done, kind:
'replica', state, after } | null, lastGood, lastGoodKind, phases: [{ id, from, to }] ×4, lossM, downM, lossH, downH,
rpoMet, rtoMet, worstM, avgM, skipped: { failed, unfinished, damaged } }`. `points` are sorted by `t` ascending;
`skipped` counts copies newer than the last good point by state.

## Caption choice (`captionKey`, first that applies)

1. `replica` / `replicaAndCopies`: the replica is damaged; the second when damaged copies were skipped too ("the
   replica and n copies after … carry it; the last good copy is …").
2. `failed`: failed copies were skipped ("copies every …, but the last that restores is from …: … lost").
3. `detect`: RTO missed and detection alone is longer than the RTO target (the task's hr caption).
4. `damaged`: copies after the damage began were skipped.
5. `unfinished`: copies were still being written when the system stopped (singular or "n copies, the newest …").
6. `replicaGood`: the replica is the last good point (RPO 0).
7. `both`: the two numbers against their targets.

## Presets and expected numbers (checked with a script before the page, and by `sim.test.js`)

| # | id | Params (over the defaults) | Actual RPO | Actual RTO | Verdicts | Source |
|---|---|---|---|---|---|---|
| 1 | `nightly-backup` | — (week 2026-11-23, Thu 14:05) | 12 h 25 min (Thu 01:40) | 0.5 + 1 + 4 + 1 = 6 h 30 min | ✓ ✓ | VM backup log (job 01:40), S1 |
| 2 | `failing-backups` | week 2026-10-26, Sun 2026-11-01 14:05, `failedRuns` 49 (14 Sep – 1 Nov) | 49 d 12 h 25 min (13 Sep 01:40) | 6 h 30 min | ✗ ✓ | VM backup history |
| 3 | `found-on-monday` | Sat 23:40, `detect` 32 h 30 min (found Mon 08:10) | 22 h (Sat 01:40) | 38 h 30 min | ✓ ✗ | S12 |
| 4 | `ransomware` | week 2026-11-09, `interval` 1 h, Mon 02:10, `damage`, replica on, `detect` 5 h 40 min (found 07:50) | 30 min (Mon 01:40); the six copies 02:40 … 07:40 and the replica ✗ | 11 h 40 min | ✓ ✗ | S3 |
| 5 | `replica-not-backup` | week 2026-11-30, Wed 16:40, `damage`, replica on | 15 h (Wed 01:40); the replica ✗ | 6 h 30 min | ✓ ✓ | S15 |

Preset 5 with `kind: loss`: the replica is good, RPO 0. Preset 4: the copies taken after 02:10 until detection carry
the encryption, the replica ("the NAS mirror shows the same") too; the last good copy is the night's 01:40, before the
logon. The hourly schedule is the page's (the scenario names no copy between 02:10 and 07:50).

## Tie-breaks (tested first)

- RPO / RTO equal to the target → met.
- Under `loss`, a copy complete exactly at I (done = I) → good; done = I + 1 → `unfinished`.
- A run starting exactly at I is "before or at the incident" (counted by `failedRuns`; under `loss` it is
  `unfinished`, or good with `jobMin` 0; `after` is false).
- A run starting exactly at S (with `damageBefore` > 0) → good; one minute after S → `damaged`.
- Under `damage`, a copy started before S and still running at S → good (it completes with clean data).
- A copy starting exactly when detection ends is still taken under `damage`.
- Replica under `loss` with `damageBefore` = 0 → good at I; with `damageBefore` > 0 → damaged.
- Replica under `damage` with detect = 0 → damaged.
- Incident before the week's first run (Mon 00:00–01:40): the last good copy is from the Monday before (negative
  minutes).
