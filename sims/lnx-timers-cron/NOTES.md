<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-timers-cron: notes

New stepper (task `docs/tasks/w3/lnx-timers-cron.md`, catalogue `lnx-timers-cron` §4.4, wave 3). No kit view fits: a
timeline with a power band and two lanes of markers is not a sequence chart, topology, rule table or block grid, so
the page draws it in HTML (absolutely positioned elements, no SVG text). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Event-driven stepper.** One step = the clock moved to the next event (power change, scheduled time, delayed
  start); events at the same second are one step. The step count therefore depends on the params (each delayed
  start is its own event), and `steps(p)` runs the model to the window's end (memoised).
- **Four panels.** The clock and power badge; the timeline (power band, cron lane, timer lane, now line); the crontab
  line field by field; the timer → service pair with its `[Timer]` lines, the record on disk and `list-timers`.
- **Reused from `lnx-systemd-ordering`: vocabulary, not code.** No model was promoted to `models/` and nothing in
  that sim's `compute()` (transactions, ordering) applies here; what this sim shares is the unit boxes with their
  states (`enabled`/`static`, `active (waiting)`/`inactive (dead)`) and the timer → service `Unit=` relation. So no
  function was copied.
- **`list-timers` is transposed** (NEXT / LEFT / LAST / PASSED as rows): the real row is ~100 characters and does not
  fit half the stage at 1920×1080. UNIT and ACTIVATES are the unit boxes above it. The values are systemd's own
  formats (timestamp, relative time, `-` when empty, `now`).
- **Delays from `Simdeck.rng`**, seeded with the seed and the time the delay is added to, so step back and replay
  agree and each night's delay is independent of how many steps were taken. mulberry32's first draw on nearby seeds
  is nearly linear, so the first draw is skipped.
- **The catch-up after boot is delayed too** (systemd.timer(5): "Such triggering is nonetheless subject to the delay
  imposed by RandomizedDelaySec=" — the task left this as a check), counted from the boot.
- **Absorption.** A scheduled time that coincides with a catch-up at boot, or falls while a delayed catch-up waits,
  does not make a second run (systemd computes the next elapse from the last trigger). Only reachable with the
  params (e.g. back on Thu 03:30); tested.
- **The randomized delay is small on the timeline** (1 h of 3 days): the bracket is a few pixels wide, so each run
  carries its delay as a label (`+7 min 22 s`), and the caption says it.
- **Captions** are composed per event, cron first (lane order). The task's caption is word for word at
  `book-arhiva` step 5. In `cron-or-trap` the timer's "needs both at once; next elapse Mon 2027-02-01" sentence is
  shown on the first and the last step only, to keep the caption to two lines.
- **Off/on selects** offer each day of the book's week (and the next Monday) at 03:30, 08:00, 18:00 and 22:00, plus
  "never". 03:30 is there so the tie-breaks (boot or shutdown exactly at the scheduled minute) can be tried on the
  page. Reversed picks are swapped; equal ones mean no outage.
- **The seed slider stays visible, disabled without a delay.** Hiding it (`visible`) made the gate's browser check
  crash (see Shared requests); disabled it fits the panel too.
- **Entries** in `sim.json` for `long-weekend` ("Persistent= is one catch-up, not three") and `cron-or-trap` (the OR
  trap): the two misconceptions a lecturer would link to on their own.
- Tags: `services`; topic `linux-admin`; level `intro` (the task's). All exist in `tags.json`.

## Deviations from the task

- **`cron-or-trap` has 5 steps, not 6.** "Over September 2026" there are exactly five cron runs (1, 7, 14, 21, 28)
  and the timer never elapses; a sixth event would need the window to start on Mon 31 Aug (then 31 Aug is a sixth run,
  contradicting the task's "five runs"). I kept the five runs.
- **`book-arhiva` / `no-persistent` run over the whole week** (Mon 31 Aug → Mon 7 Sep): that is what gives the
  task's 9 events (Mon, Tue, off, Wed, on, Thu, Fri, Sat, Sun); Sat and Sun show cron's every-day line against the
  timer's `Mon..Fri`. The task's "Mon–Thu" describes the interesting part.
- **The timer lane in `cron-or-trap`** holds the calendar expression that says what the author meant,
  `Mon *-*-01 03:00:00` (weekday AND date, UL10's `Thu,Fri 2012-*-1,5` rule): no elapse in September, next
  `Mon 2027-02-01 03:00:00 CET` (checked with `systemd-analyze calendar` on nuc).
- **The cron lane in `long-weekend` and `randomized`** is the same job written as `0 0 * * *` (the task names only the
  timers there). In `randomized` it runs at exactly 00:00 each night against the timer's spread.
- **Off/on options** are four times a day, not half-days: the presets need 22:00, 08:00 and 18:00.
- **State** has extra fields the rules need: `pending` (a start waiting for its delay), `stamp` (on disk) apart from
  `lastTrigger` (in memory, LAST), `covers` (what a catch-up makes up), `absorbed`, `last`, `changed`.
- **`delay` is a choice** `no delay` | `1h` (the task: `0 | 1h`).

## Sources

- `uvod-u-linux/book/chapters/10-podizanje-i-systemd.md`, "Poslovi koji se pokreću sami", "Šire o temi", Primjer 2 and
  Primjer 3 (details in `SPEC.md`). Read 2026-11-12.
- systemd.timer(5), local man page, systemd 255 (`Persistent=`, `RandomizedDelaySec=`), read 2026-11-12.
- systemd.time(7) and crontab(5) as cited in ch10.
- On nuc: `systemd-analyze calendar 'Mon *-*-01 03:00:00'`, a transient user timer for `list-timers` with an empty
  LAST (`-`), and `list-timers --all` for the relative-time forms. The probe timer was stopped afterwards.
- *(check)* The multi-day timelines were not run on a real machine (power cycles over days); the catch-up behaviour
  follows systemd.timer(5). systemd's relative-time thresholds are from time-util.c as remembered; the forms seen on
  nuc and in the book agree.
- *(check)* Tie-break rule 7 (boot at the scheduled minute = on) is the task's model convention; on a real machine
  the services start seconds after power-on and the outcome at that very minute is a race.

## Term pairs

Used in the page, missing from `kit/glossary.js` (written out in both tables for now):

- calendar expression — kalendarski izraz (UL10)
- missed run — propušteni termin (the task's)
- catch-up — nadoknada (the task's)
- randomized delay — nasumična odgoda *(check: the task's; the book has no term)*

## Shared requests

- **`kit/tools/check-page.mjs`**: the "after a mouse drag on a slider, → still steps" check takes the first
  `input[type=range]` in the controls, even when its control is hidden by `visible()`; `boundingBox()` is then null
  and the whole browser check crashes (`TypeError: Cannot read properties of null (reading 'x')`, line 258). Smallest
  change: pick the first *visible* range (`.locator(...).filter({ visible: true })` or skip when the box is null).
  Workaround here: the seed slider is disabled instead of hidden.

## Checks

- `node --test sims/lnx-timers-cron/sim.test.js`: 27 tests, tie-breaks first, one test per rule, then the presets'
  numbers, then the generic block.
- **Fresh review** (a separate agent read the code against `SPEC.md`, swept all 16,400 param combinations for throws,
  unaccounted ticks, double catch-ups and broken captions, and ran 53 mutations; every rule mutation was killed).
  Fixed from it:
  - The model assumed the timer had last run at the scheduled time before the window even when the machine was off
    then (an outage starting before the window). It now uses the last scheduled time at which the machine was on.
  - Captions at a boot or shutdown that falls exactly on a scheduled time now also say what each lane did at that
    minute, including the elapse absorbed into the catch-up.
  - The non-persistent boot caption now uses plural forms ("the 3 missed runs are lost").
  - A cron-only outage gets its own sentence.
  - The `Persistent=true` "missed" sentence was reworded.
  - An outage picked outside the preset's window is now flagged in the clock bar.
  - New tests cover what survived: absorption while a delayed catch-up waits, the per-lane outage count, the record,
    LAST and NEXT after delayed runs, the initial LAST with a delay, a shutdown clearing a waiting start without
    `Persistent=`, and the relative-time thresholds and zone label. I re-broke five of those spots and a test failed
    each time.
- `npm run gate -- lnx-timers-cron`: pass (64/64 browser checks, no exceptions). Screenshots reviewed: 1920×1080
  light, dark, grayscale, help, panel hidden and 375×812, in both languages. Also: every preset's key step
  (book-arhiva 0, 4, 5, 9; no-persistent 5; long-weekend 4, 6; randomized 1, 2, 6; cron-or-trap 1, 3, 5) and the
  reviewer's edge states (boot or shutdown at 03:30, back on Thu 03:30 with and without a delay, an outage from before
  the window, a cron-only outage, an outage outside the window), plus long-weekend at 375×812.
- Known layout limit: in the rarest state, a delayed catch-up at a boot that is also a scheduled time (Croatian, a
  4-line caption, 5 `[Timer]` lines), the `[Timer]` box reaches the card's bottom border. It stays readable. No preset
  reaches it.

## Time

Start 2026-11-12 19:55, done 20:27: about 32 minutes in one session. The fresh review ran in parallel for about
6 minutes.
