<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# countdown: spec

**One concept:** a projector-sized timer for in-class exercises. The lecturer sets a time and starts it.
Source: `docs/tasks/w3/countdown.md` ("Model and presets"), catalogue `tool-countdown` (§4.11). Kit rules:
`docs/sim-ui.md` §3 (keys) and §5 (pure model, no `Date`). Class `tool`: no steps, never on course pages.

## State and time

Timer state (plain JSON, task file):

```
{ durationMs, status: 'idle'|'running'|'paused'|'done', startedAt|null, pausedAt|null, pausedTotalMs, warnAtMs }
```

The model has no clock. The page reads `Date.now()` and passes `now` (ms since the epoch) to every function;
`view(state, now, offsetMin)` derives what is shown: `{ remainingMs, shownSeconds, clock, minutesLeft, phase,
status, paused, fraction, endClock }`. Tests call it with chosen `now` values. `Date.now()` rather than
`performance.now()` because the end time is a wall-clock time and the timer must survive the page reload a language
switch does (the state is kept in `sessionStorage`; `performance.now()` restarts at 0 on reload).

## Rules

| # | Rule | Expected numbers (checked with a script before coding) | Source |
|---|---|---|---|
| 1 | remaining = max(0, duration − (now − startedAt − pausedTotal)); shown **rounded up** to whole seconds | 5 min timer: 5:00 at 0 ms and at 999 ms; 4:59 at 1000 ms; 0:01 at 299 999 ms; 0:00 only at 300 000 ms | task rule 1 |
| 1a | tie-break: a remaining time on an exact second shows that second (ceil of an integer) | remaining 240 000 ms → 4:00, 240 001 → 4:01 | ceil |
| 2 | pause stores `pausedAt`; resume adds `now − pausedAt` to `pausedTotal`; reset → idle, same duration and warning | pause at 10 s, resume at 70 s → pausedTotal 60 000, shows 4:50 | task rule 2 |
| 3 | phase: running while remaining > warnAt; warning while 0 < remaining ≤ warnAt; done at 0. Idle is its own phase (not started) | 5 min, warn 60 s: 1:01 at 239 999 ms (running), 1:00 at 240 000 ms (**warning**, the boundary belongs to warning), done at 300 000 ms. A timer shorter than the warning starts in warning | task rule 3 |
| 3a | each phase has its own shape and words, not colour alone | running: plain 2 px frame, solid bar; warning: thick dashed frame, hatched bar, badge "još N min"; done: thick double frame, filled, "Vrijeme!"; paused: badge "Pauza" and dotted bar | task rule 3, COMMON §3 |
| 4 | +1 / −1 min while running or paused: duration ± 60 s, **never below the time already run** (−1 min with 30 s left ends the timer); never above 99:59 | 5 min, at 4:30 run: −1 → duration 270 000 (remaining 0, done). At 1 s: +1 → 360 000 | task rule 4 |
| 4a | idle: ± 1 min moves the duration within 0:05 … 99:59 | 1:00 −1 → 0:05; 99:30 +1 → 99:59 | choice (see NOTES) |
| 4b | done: +1 min starts a new one-minute run from now (however long it stood finished); −1 min does nothing | done, then +1 → running, 1:00 left; also 2 h after the end (beyond the 99:59 cap) | choice |
| 5 | time up: an optional short tone made in the page (Web Audio, no files, no network), **off by default**; the done frame pulses only when motion is allowed | sound default false | task rule 5 |
| 6 | everything shown comes from timestamps, so a throttled tab is right on its next frame | after a 10 min gap the next `view` is exact | task rule 6 |
| 7 | the end clock: running or paused = now + remaining, rounded to the **nearest minute** (half a minute rounds up); done = the moment it ended (a paused timer that −1 min ends: that moment); idle = none | ends 10:44:30 → "10:45", 10:44:29.999 → "10:44" | choice |
| 8 | Space: idle → running, running → paused, paused → running, done → idle | | task (Space = start/pause) |
| 9 | settings: R, loading a preset (also one of the same length), or a change of duration (minutes, seconds) → a fresh idle timer with the chosen duration; a change of warning, title or sound by hand keeps the timer running (the warning applies at once). The page tells the model when R or a preset caused the change | | choice |
| 10 | end: a running timer, or a paused one that −1 min brought to 0, becomes done (once; the page plays the tone on that change) | | rule 3 + 5 |

## Parameters

| Key | Type | Values | Default |
|---|---|---|---|
| `minutes` | choice | 1 / 3 / 5 / 10 / 15 | 5 |
| `seconds` | range | 0 … 55, step 5 (added to the minutes) | 0 |
| `warn` | choice | 30 s / 1 min / 2 min | 1 min |
| `label` | choice | none / Vježba / Razmisli u paru / Laboratorijska vježba / Pauza | none |
| `sound` | toggle | | off |

Buttons in the panel (not on the stage): Pokreni / Pauza / Nastavi (Space), +1 min (`+`), −1 min (`-`); reset is
the kit's R.

## Presets

| Key | id | Duration | Title |
|---|---|---|---|
| 1 | `think-90` | 1 min + 30 s = 90 s | Razmisli u paru (think-pair-share) |
| 2 | `five` | 5 min | Vježba |
| 3 | `ten` | 10 min | Vježba |
| 4 | `fifteen` | 15 min | Laboratorijska vježba |
| 5 | `break` | 10 min | Pauza |

## Captions (both languages)

- idle: "Spremno: 5:00. Space pokreće odbrojavanje." / "Ready: 5:00. Space starts the countdown."
- running / warning: "Još 1 minuta. Završavate u 10:45." / "1 minute left. You finish at 10:45." (minutes rounded
  up, plural forms; the task's caption)
- paused: "Pauza. Još 4 minute. Space nastavlja." / "Paused. 4 minutes left. Space resumes."
- done: "Vrijeme je isteklo (10:45). Space vraća na početak, +1 min daje još jednu minutu." / "Time is up (10:45).
  Space goes back to the start, +1 min gives one more minute."

## Out of scope

Several parallel timers, stopwatch mode, sync across devices (task file).
