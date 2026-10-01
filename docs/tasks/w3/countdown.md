# countdown: Exercise countdown

| | |
|---|---|
| Task | `countdown` (wave 3, Reference posters and classroom tools) |
| Catalogue entry | `tool-countdown` in `docs/catalogue.md` §4.11 |
| Kind | build a new simulator |
| Folder | `sims/countdown/` |
| Class | tool |
| Size | S |
| Priority | P3 |
| Courses | all |
| Topic / tags / level | `classroom` / `classroom-tool` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **a projector-sized timer for in-class exercises**.

The student: set and start.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.11.

## Sources

- No course material needed. Kit rules: `docs/sim-ui.md` §3 "Keyboard and live use" (reserved keys, Space = play/pause) and §5 (pure model; no `Date` in the model, so the clock lives in the page). Classroom precedent in `/home/rjasmin/projects/single-page-labs/random-student-picker.html` (another projector tool, for layout ideas).

## Model and presets

- **Scene:** the remaining time in very large digits (mm:ss, readable from the back of a room: digits ≈ 40 % of
  the stage height), a progress ring or bar around/under it, the exercise title (optional, one line) and the end
  time as clock time ("do 10:45"). Three visual phases: running, last minute (warning), time up ("Vrijeme!").
  Controls in the panel only; the stage stays clean for the projector.
- **State:** `{ durationMs, status: 'idle'|'running'|'paused'|'done', startedAt|null, pausedAt|null,
  pausedTotalMs, warnAtMs }`; displayed values are derived by a pure function `view(state, nowMs) → {remainingMs,
  phase, fraction, endClock}`.
- **Model and time:** the kit's model must be pure, so the clock is not in the model: the page reads the time with
  `performance.now()`/`Date.now()` and passes `now` into `view`; tests call `view` with chosen `now` values. One
  `requestAnimationFrame` loop (or a 250 ms interval) re-renders while running.
- **Rules:**
  1. remaining = max(0, duration − (now − startedAt − pausedTotal)); shown rounded up to whole seconds, so "0:00"
     appears only at the end (a 5 min timer shows 5:00 at start, 4:59 after the first second).
  2. Pause stores `pausedAt`; resume adds `now − pausedAt` to `pausedTotal`. Reset returns to idle with the same
     duration.
  3. Phases: running while remaining > warnAt; warning while 0 < remaining ≤ warnAt (default 60 s); done at 0. Each
     phase changes shape and text as well as colour (border style, the word "još 1 min", "Vrijeme!").
  4. +1 min / −1 min adjust the duration while running (never below the elapsed time).
  5. Time up: optional short tone generated in the page (no audio files, no network), off by default; no blinking
     under reduced motion.
  6. A tab in the background may throttle timers; because remaining is computed from timestamps, the display is
     correct on the next frame.
- **Params:** `minutes` choice 1 / 3 / 5 / 10 / 15 (default 5) and a `seconds` range for custom values; `warn`
  choice 30 s / 1 min / 2 min (default 1 min); `sound` toggle (default off); buttons start/pause (Space, through the kit's play/pause), `+1`, `−1`, reset.
- **Presets:** `think-90` (90 s, think-pair-share), `five` (5 min), `ten` (10 min), `fifteen` (15 min lab exercise),
  `break` (10 min, title "Pauza").
- **Steps:** tool, none.
- **Legend:** none on stage; the panel explains the three phases with their shapes.
- **Captions** (status line under the digits):
  - hr: „Još 1 minuta. Završavate u 10:45.“
  - en: "1 minute left. You finish at 10:45."
- **Terms:** countdown — odbrojavanje; timer — mjerač vremena (check); pause / resume — pauza / nastavak; time is up —
  vrijeme je isteklo.
- **Misconceptions:** not a teaching sim; none.
- **Out of scope:** several parallel timers, stopwatch mode, sync across devices.
- **Note for the coordinator:** this tool has no stepper; the kit's Space (play/pause) should drive start/pause;
  check that the kit lets a `tool` page reuse the transport's play state without steps.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh countdown sims/countdown` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/countdown/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
