# lnx-timers-cron: cron vs systemd timers

| | |
|---|---|
| Task | `lnx-timers-cron` (wave 3, Linux) |
| Catalogue entry | `lnx-timers-cron` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-timers-cron/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `services` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-systemd-ordering` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **missed runs, Persistent=, randomised delay**.

The student: let time pass with the machine off.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-systemd-ordering/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/10-podizanje-i-systemd.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-10/`
- Catalogue seed: UL ch10
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/10-podizanje-i-systemd.md`: section "Poslovi koji se pokreću sami" (`/etc/crontab` fields, the day-of-month/day-of-week OR trap, `MAILTO`, `systemctl cat logrotate.timer` with `RandomizedDelaySec=1h` and `Persistent=true`, `pozdrav.timer`, `Persistent=` definition, "Nema `Persistent=`"), its "Šire o temi" (`OnBootSec=` …, `AccuracySec=`), Primjer 2 ("mjerač vremena za posao koji još ne postoji": `Mon..Fri *-*-* 03:30:00`) and Primjer 3 ("isti posao `cron`-om": `30 3 * * *`)
- systemd.timer(5) (`Persistent=`, `RandomizedDelaySec=`), systemd.time(7) (calendar events), crontab(5), as cited in ch10

## Model and presets

- **Reuses from `lnx-systemd-ordering`:** units as named boxes with their state (`enabled`/`static`, `active`/`inactive`) and its unit-file vocabulary; a timer is shown as the unit that activates a service (`Unit=`). New here: time: a calendar, the machine's power, and what each scheduler does with a missed time.
- **Scene:** a horizontal timeline over days (the book's week from Mon 2026-08-31), with the machine's power as a band (on / off); two lanes of scheduled jobs: the cron line `30 3 * * * /usr/local/sbin/arhiva.sh` and the timer pair `arhiva.timer` → `arhiva.service` (`OnCalendar=Mon..Fri *-*-* 03:30:00`, `Persistent=true|false`, `RandomizedDelaySec=`); each scheduled time is a tick, each run a filled marker, each missed time a hollow marker. Right: the timer's stored "last trigger" time and a `systemctl list-timers` line (`NEXT`, `LEFT`, `LAST`).
- **State:** `{ now, power: [{ from, to }], jobs: [{ kind: 'cron'|'timer', spec, persistent, delay, lastTrigger, runs: [t], missed: [t] }], seed, events }`.
- **One step:** advance the clock to the next event (a scheduled time, a shutdown, a boot); at each event apply the rules for every job in lane order (cron first, then timer).
- **Rules:**
  1. A cron line has five time fields and a command; it runs only if `crond` is running in that minute. A time missed while the machine is off is never run: there is no field for it. (ch10 "Poslovi koji se pokreću sami"; Primjer 3)
  2. If both day-of-month and day-of-week are restricted, cron runs when **either** matches (logical OR). (ch10; crontab(5))
  3. A timer with `OnCalendar=` elapses at wall-clock times; `Mon..Fri *-*-* 03:30:00` is weekdays at 03:30; `daily` is `*-*-* 00:00:00`. (ch10, Primjer 2; systemd.time(7))
  4. Without `Persistent=`, a missed elapse is not caught up. (ch10 "Nema `Persistent=`")
  5. `Persistent=true`: the time of the last trigger is stored on disk; when the timer is activated (at boot) the service starts at once if at least one elapse was missed while the timer was inactive — **once**, however many were missed. (ch10; systemd.timer(5) `Persistent=`, check "once")
  6. `RandomizedDelaySec=`: each elapse is delayed by a random time between 0 and the value, evenly distributed; `logrotate.timer` uses `1h`. Randomness via `Simdeck.rng(seed)`. Whether the catch-up run of rule 5 is also delayed: (check systemd.timer(5)).
  7. Tie-break: a boot exactly at a scheduled minute counts as "on" for that minute (the job runs normally, no catch-up).
  8. (Note, not modelled) the book's lab machine runs `/etc/cron.daily` through `anacron`, which does catch up; the book names it in a log line and leaves it aside. A plain crontab line does not.
- **Params:** `persistent` toggle, default on; `delay` choice `0` | `1h`, default `0`; `offFrom` / `offTo` select over half-days of the week, default Tue 22:00 → Wed 08:00; `seed` range 1–99, default 3. All `resets: true`.
- **Presets:**
  - `book-arhiva` — Mon–Thu, off Tue 22:00 → Wed 08:00: Mon and Tue 03:30 both run; Wed 03:30 missed by both; at Wed 08:00 boot the timer runs once, cron never; Thu 03:30 both run. From ch10 Primjer 2 and 3 (timeline derived).
  - `no-persistent` — the same without `Persistent=`: Wednesday is lost for both. From ch10 ("Nema `Persistent=`"), derived.
  - `long-weekend` — `OnCalendar=daily`, off Fri 18:00 → Mon 08:00: Sat, Sun and Mon 00:00 missed; one catch-up run at Mon 08:00, not three. Derived from systemd.timer(5), check.
  - `randomized` — `logrotate.timer` (`daily`, `RandomizedDelaySec=1h`, `Persistent=true`) over three nights: runs at 00:00 plus a different delay each night (seed 3, all < 1 h). From ch10 (`systemctl cat logrotate.timer`), delays derived.
  - `cron-or-trap` — `0 3 1 * 1` ("first of the month, but only if Monday") over September 2026: runs on the 1st (a Tuesday) and on 7, 14, 21, 28 — five runs where the author expected none. From ch10 (OR rule), dates derived.
- **Steps:** one per event: `book-arhiva` 9, `no-persistent` 9, `long-weekend` 6, `randomized` 6, `cron-or-trap` 6.
- **Legend:** power on (solid band) / off (hatched band), scheduled time (tick), run (filled marker), missed (hollow marker with ×), catch-up run (filled marker with a curved arrow), randomized delay (bracket from tick to marker). "Changed" marks the markers added by this step and the stored last-trigger time.
- **Captions:**
  - HR: „Stroj se upalio u 8:00. `arhiva.timer` ima `Persistent=true` i zapis da je zadnji put pokrenut u utorak, pa propušteni termin nadoknađuje odmah — jednom. Redak u `crontab`-u za to nema polje.“
  - EN: "The machine came up at 08:00. `arhiva.timer` has `Persistent=true` and a record that it last ran on Tuesday, so it makes up the missed run at once — once. The crontab line has no field for that."
- **Terms:** scheduled job — zakazani posao; timer — mjerač vremena; calendar expression — kalendarski izraz; missed run — propušteni termin; catch-up — nadoknada; randomized delay — nasumična odgoda (check); unit — jedinica.
- **Misconceptions:** a scheduled job runs "eventually" (cron forgets missed times); `Persistent=true` replays every missed run; `0 3 1 * 1` means "the first, if it is a Monday".
- **Out of scope:** `OnBootSec=` and other monotonic timers (named), `AccuracySec=`, `anacron` itself, mail of cron output (named as in ch10), time zones and DST.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-timers-cron` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-timers-cron sims/lnx-timers-cron` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-timers-cron/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
