<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# countdown: notes

Task `docs/tasks/w3/countdown.md`, catalogue `tool-countdown` (§4.11). A new native sim of class `tool`
(lecturer-only, never on course pages). Rules and numbers: `SPEC.md`.

## Decisions

- **The clock is in the page, the rules in the model.** `sim.js` is pure: every function takes `now` (ms). The page
  reads `Date.now()` (not `performance.now()`: the end time is a wall-clock time, and the timer has to survive the
  reload the language switch does). One `requestAnimationFrame` loop paints while the timer runs or stands paused,
  plus a timeout aimed at the end, because frames stop in a background tab; `settle()` makes the end exact either way.
- **Kit params hold the settings, the page holds the timer.** `minutes`, `seconds`, `warn`, `label`, `sound` are kit
  params (presets, URL state, R work as on every page). The kit's state is the configuration (`initial(params)`);
  its cache is cleared on every param change, preset and R, so a new state object is the signal. `reconcile()`
  decides: R, a preset or a new duration gives a fresh idle timer; warning, title and sound changed by hand keep the
  timer running. The kit does not tell a page that R happened, so the page notes the R key and the reset buttons'
  clicks in the capture phase, before the kit acts; a new kit state while a preset is active can only come from
  loading that preset (a hand change deselects it).
- **Duration = minutes + seconds** (`seconds` 0–55, step 5), so `think-90` is 1 min + 30 s.
- **The title is a choice** (none / Vježba / Razmisli u paru / Laboratorijska vježba / Pauza), not free text: the kit
  has no text param, a choice goes through presets and the URL, and it exists in both languages. Short option labels
  in the panel (Vježba, U paru, Lab, Pauza), the full title on the stage.
- **Space = start / pause / resume** through a page key (`def.keys`), because the kit gives Space only to steppers.
  A keyboard user's focused control keeps its own Space (button, link, switch: the page clicks it; a select is
  left alone), the same exclusion as the kit's for steppers. `+` and `-` are
  +1 / −1 min. On a finished timer Space goes back to idle (clears "Vrijeme!").
- **The timer's buttons sit in the transport bar** (−1 min, Pokreni/Pauza/Nastavi, +1 min, then the kit's reset),
  where a stepper has its play button; the stage stays clean. In the panel they made it 1100 px tall (926 fit).
- **The phase key is the header legend**, with swatches drawn as the stage frames (thin solid, thick dashed, double
  filled, dotted), and the Ideja text describes each phase in words. The task asked for it in the panel, which did
  not fit at 1920×1080 together with the presets and the five settings.
- **Phases by shape and words:** running a thin solid frame and a solid bar, badge ▶ Teče; warning a thick dashed
  frame, a striped bar, badge ▲ "još N min" on the highlighter; done a double frame, the box filled, "Vrijeme!" in
  the digits' place and ■ 0:00 in the badge; paused a dotted frame and a dark ❚❚ Pauza badge. The done box pulses
  three times (opacity, 1.2 s) only when motion is allowed (the kit switches animations off under reduced motion).
- **+1 / −1 min**: running or paused, never below the time already run and never above 99:59; idle, within
  0:05…99:59 (the panel's minutes choice does not follow it; R goes back to the chosen length); done, +1 min starts a
  new one-minute run from now ("one more minute, please"), −1 min does nothing. A button that cannot change anything is
  `aria-disabled`.
- **End clock**: now + remaining, rounded to the nearest minute (half a minute up), "do 10:45"; while paused it moves;
  after the end, "kraj u 10:45". Idle shows none.
- **Caption** (the status line under the stage): minutes rounded up, plural forms; re-rendered only when the
  minute, phase or status changes, so the live region is not rewritten every frame. Digits, bar and end time are
  painted in place each frame.
- **Sound**: off by default; three short sine beeps (880, 880, 660 Hz) from Web Audio, no files. The AudioContext is
  made on a user gesture (the toggle's click, or a start while the toggle is on), so the browser lets it play later.
- **sessionStorage** (`simdeck.countdown`) keeps the timer across the language switch; restored only when the chosen
  length is the same and it was saved less than 3 hours ago. If storage is unavailable the page starts idle.
  *(check)* After a reload with the sound on, the browser may keep the tone silent until the page is clicked once
  (audio needs a user gesture).
- **Clock loop:** frames only while running; a check once a second while paused (only the end clock moves); the end
  timeout is armed once per timer state. The end clock uses the time-zone offset at the end time.

## Deviations from the task

- Phase key in the header legend instead of the panel (above); the panel still explains the phases in Ideja.
- Start/pause and ±1 min in the transport bar, not the panel (the panel had no room; the stage stays clean).
- Title from a fixed list of five, not free text.

## Sources

- `docs/tasks/w3/countdown.md`; `docs/sim-ui.md` §3 (keys), §5 (pure model); layout ideas from
  `/home/rjasmin/projects/single-page-labs/random-student-picker.html` and `sims/student-picker/` (the first tool).
- No course material; nothing copied.

## Term pairs

countdown — odbrojavanje; timer — mjerač vremena *(check: the task marks it "check"; "štoperica" counts up, so it is
only an alias)*; pause / resume — pauza / nastavak; time is up — vrijeme je isteklo. None is in `kit/glossary.js`
and none is used as a `[[term]]` (written out in both tables); the coordinator may add them.

## Shared requests

- **Kit: Space for tools.** The kit handles Space (play/pause) only on steppers, so a `tool` cannot reuse the
  transport's play state. This page maps Space through `def.keys` and re-clicks a focused button itself. Smallest
  change: an optional `def.play = { toggle(sim), playing() }` (or letting `def.keys` claim Space with the kit's
  focused-control exclusion), so tools get the kit's play button, label and Space handling. (The task's note for the
  coordinator asks exactly this.)
- **Kit: a slot for tool buttons in the transport.** The page inserts its button group into `[data-sd-transport]`
  after mount; a supported `def.transport` (extra buttons for non-steppers) would make that official.

## Review

A fresh reviewer (a separate agent with no part in the build) read the code against SPEC.md, probed the page
headless with a fake clock and ran 44 more mutations. Fixed from its findings: R did not reset a running timer when
the warning, title or sound had been changed (and switching between two presets of the same length kept the
timer); Space on the focused sound switch started the timer instead of switching it; +1 min on a timer finished
more than 99 min earlier ended again at once; the end time of a paused timer that −1 min ended was the pause, not
that moment; a second frame loop could start when the end timeout fired; `aria-valuenow` changed only once a
minute; a stored timer of length 0; the done button read "Ispočetka" although it goes back to idle (now "Na
početak"); the captions in SPEC.md now match the strings. Tests were added for every surviving mutation that could
change behaviour (pause on paused, minutes rounded up, sanitize of running/done/paused timers, clock above an hour,
the 99:59 cap, canAdjust while running, the running floor), and each of those mutations now fails a test.

## Checks

- Every model rule was broken once (13 mutations, a script swapping one expression at a time) and a test failed
  each time: ceil → round (rule 1a), no clamp at 0 (rule 1), `<=` → `<` at the warning boundary (rule 3), the
  elapsed floor in adjust removed (rule 4), the idle floor 0:05 → 0 (rule 4a), +1 after done from the old duration
  (rule 4b), half-minute rounding → floor (rule 7), resume not adding the pause and paused time counting as run
  (rule 2), reset keeping the status (rule 2), Space on done doing nothing (rule 8), reconcile resetting on a sound
  change (rule 9), settle ignoring a paused timer (rule 10).
- Page behaviour checked headless after the fixes: R after a sound change resets; Space on the focused switch
  switches it; preset 3 then 5 (both 10 min) resets; the transport's reset button resets; no console messages.
- Phase screenshots (running, warning, paused, done, +1 after done) in hr and en, light and dark, 375×812, and
  grayscale, made with a fake clock (thread library `phases/`).

## Time

2026-11-09, 00:50 → 01:16 CET, about 26 minutes (wall clock), including the review and its fixes.
