<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-timers-cron: spec

One concept: **missed runs, `Persistent=`, randomized delay**. Two scheduled jobs do the same work, a crontab line
and a timer that activates a service, while time passes with the machine off. cron forgets a time it missed; a
timer with `Persistent=true` makes it up at boot, once; `RandomizedDelaySec=` moves each start, the catch-up too.

Task: `docs/tasks/w3/lnx-timers-cron.md`. Catalogue: `lnx-timers-cron` (`docs/catalogue.md` §4.4). Class: stepper.
Model: `sim.js` (pure). Tests: `sim.test.js`. Words: `strings.js`.

## Sources

- **[UL10]** `uvod-u-linux/book/chapters/10-podizanje-i-systemd.md`, "Poslovi koji se pokreću sami": `/etc/crontab`
  and its five fields; the day-of-month / day-of-week OR trap; `MAILTO`; `systemctl cat logrotate.timer`
  (`OnCalendar=daily`, `RandomizedDelaySec=1h`, `Persistent=true`); `daily` = `*-*-* 00:00:00`; `pozdrav.timer` and
  the `Persistent=` definition ("na disk se pohranjuje vrijeme kad je usluga posljednji put pokrenuta … usluga se
  pokreće odmah ako bi bila pokrenuta barem jednom u razdoblju dok je mjerač bio neaktivan"); `systemctl
  list-timers` (`NEXT`, `LEFT`, `LAST`, `PASSED`; `2min 26s`); `is-enabled` → timer `enabled`, service `static`;
  "Nema `Persistent=`"; `Thu,Fri 2012-*-1,5 11:12:13` (weekday AND date); "Šire o temi" (`OnBootSec=` …,
  `AccuracySec=`); Primjer 2 (`arhiva.service`, `arhiva.timer`, `OnCalendar=Mon,Tue,Wed,Thu,Fri *-*-* 03:30:00`,
  normalized `Mon..Fri *-*-* 03:30:00`, next elapse `Mon 2026-08-31 03:30:00 CEST`); Primjer 3
  (`30 3 * * * /usr/local/sbin/arhiva.sh`, "u tom retku nema gdje reći što tada"). Read 2026-11-12.
- **[TIMER]** systemd.timer(5), local man page (systemd 255): `Persistent=` — "the service unit is triggered
  immediately if it would have been triggered at least once during the time when the timer was inactive. **Such
  triggering is nonetheless subject to the delay imposed by RandomizedDelaySec=**"; `RandomizedDelaySec=` — "a
  randomly selected, evenly distributed amount of time between 0 and the specified time value … determine this delay
  randomly before each iteration".
- **[TIME]** systemd.time(7) as cited in UL10 (calendar events, `daily`).
- **[CRON]** crontab(5) as cited in UL10: "If both fields are restricted (i.e., do not contain the "*" character),
  the command will be run when either field matches the current time."
- **Run on nuc** (systemd 255, 2026-11-12): `systemd-analyze calendar 'Mon *-*-01 03:00:00'` → next
  `Mon 2027-02-01 03:00:00 CET`; a transient user timer on that expression: `list-timers` shows `LAST -` and
  `PASSED -` before a first run; `list-timers --all` shows LEFT/PASSED as `5min`, `1h 31min`, `10h`, `2 days`,
  `2 months 19 days`, `24min ago`.

## Scene

- **Clock** (top): `now` as a systemd timestamp (`Wed 2026-09-02 08:00:00 CEST`) and the machine's power.
- **Timeline** over the preset's window: day labels; the power band (solid on, hatched off, the outage also shaded
  over both lanes); the cron lane (label: the five fields) and the timer lane (label: the timer unit). A tick per
  scheduled time (dashed and grey while still ahead), a filled marker per run, a hollow dashed marker with × per
  missed time, a square catch-up marker with ↶ and an arc back from the first time it makes up (labelled `n → 1`
  when n > 1), a bracket from a tick to its delayed run labelled `+m min s s`, a dotted marker for a start that still
  waits. A vertical "now" line.
- **The crontab line**: the five fields, labelled (both day fields outlined when both are restricted: OR), the
  command, `crond: active (running)` or "machine off", "remembers nothing about the past", counts.
- **Timer and service**: `<name>.timer` (`enabled · active (waiting)`) ↓ activates `Unit=<name>.service`
  (`static · inactive (dead)`, started …) — the unit vocabulary of `lnx-systemd-ordering`; the `[Timer]` lines the
  params write; the record on disk (`/var/lib/systemd/timers/stamp-<name>.timer` → time, or "none: without
  `Persistent=` nothing is written"); `systemctl list-timers <name>.timer` as NEXT / LEFT / LAST / PASSED (transposed
  to fit; UNIT and ACTIVATES are the boxes above); counts.
- **Changed**: markers added by this step, the stored time, NEXT and LAST when they change, the power badge.

## State

```
{ scene, start, end, now, on, power: [{ from, to }], seed,
  jobs: [ { kind: 'cron', spec, runs: [{ t }], missed: [t] },
          { kind: 'timer', spec, name, persistent, delay, lastTrigger, stamp,
            pending: null | { sched, at, delay, catchup, covers: [t] },
            runs: [{ t, sched, delay, catchup, covers }], missed: [t], absorbed: [t] } ],
  last: { t, shutdown, boot, cron, timer, lost, missedInOutage, fired, pending } | null, changed: [keys], events: [] }
```

Time is whole seconds since Mon 2026-08-31 00:00:00 local time. `lastTrigger` is what `list-timers` shows as LAST
(in memory); `stamp` is the record on disk (only with `Persistent=true`). The task's `{ now, power, jobs, seed,
events }` is all there; `pending`, `stamp`, `covers`, `absorbed` are the extra the rules need.

## One step

Advance the clock to the next event in `(now, end]`: a power change, a scheduled time of either job, or the time a
waiting (delayed) start comes. Events at the same second are one step. At the event, in this order:

1. **Power.** Shutdown: off; a start still waiting is lost (its scheduled time counts as missed). Boot: on; the
   timer is activated: `lastTrigger` = `stamp` with `Persistent=true`, else empty; rule 5's check.
2. **cron** (lane order: cron first), if its time is now: run when on, missed when off.
3. **timer**, if its time is now: missed when off; when a start is already waiting, the time is absorbed into it;
   otherwise it elapses and a start waits for `now + delay`.
4. A waiting start whose time is now (and the machine on) runs the service: `lastTrigger` = now, and with
   `Persistent=true` `stamp` = now.

## Rules

1. **A crontab line** has five time fields (minute, hour, day of month, month, day of week) and a command; it runs
   only if `crond` runs in that minute. A time missed while the machine is off is never run: the line has no field
   for it. (UL10 "Poslovi koji se pokreću sami"; Primjer 3)
2. **OR**: if both day of month and day of week are restricted (neither is `*`), cron runs when **either** matches;
   if only one is restricted, both must match. Day of week 0 and 7 are Sunday. ([CRON], UL10)
3. **`OnCalendar=`** elapses at wall-clock times: `Mon..Fri *-*-* 03:30:00` weekdays at 03:30, `daily` =
   `*-*-* 00:00:00`; a weekday and a date in one expression must **both** hold (`Mon *-*-01 03:00:00`: the 1st, only
   when it is a Monday). (UL10, Primjer 2, the `Thu,Fri 2012-*-1,5` example; [TIME])
4. **Without `Persistent=`** nothing is stored: at boot the timer counts from its activation, LAST is `-`, and a
   missed elapse is not made up. (UL10 "Nema `Persistent=`")
5. **`Persistent=true`**: every run writes its time to disk. At boot, if the next scheduled time after the stored
   one is **before** the boot, the service starts at once — **once**, however many elapses were missed (`covers`
   lists them). ([TIMER] `Persistent=`; UL10)
6. **`RandomizedDelaySec=`** adds an evenly distributed delay in `[0, value)` to every elapse, a new one each time
   (`logrotate.timer`: `1h`). The catch-up of rule 5 is delayed too ([TIMER]: "nonetheless subject to the delay"),
   counted from the boot. The delay is `Simdeck.rng` seeded with the `seed` param and the time it is added to (the
   scheduled time, or the boot time), in whole seconds; mulberry32's first draw is skipped.
7. **Tie-breaks.**
   - A boot exactly at a scheduled minute counts as **on** for that minute: both jobs run normally, no catch-up (the
     check in rule 5 is strict `<`). A shutdown exactly at a scheduled minute counts as **off**: missed. (The power
     interval is half-open `[off, on)`.) *Model convention (the task's): on a real machine the services come up
     some seconds after power-on, so a job at the very minute of power-on is a race.*
   - A catch-up at a boot that is also a scheduled time is **one** run: the scheduled time is absorbed (systemd
     computes the next elapse after the last trigger, which is now).
   - A scheduled time that falls while a delayed catch-up still waits is absorbed into it (same reason).
8. *(Note, not modelled)* `anacron` runs `/etc/cron.daily` on the book's machine and does catch up; a plain crontab
   line does not.

## list-timers

`NEXT` = the waiting start, or the next scheduled time after now plus its delay; `-` with no further elapse.
`LEFT` / `PASSED` use systemd's relative format (time-util.c `format_timestamp_relative`): years + months;
months + days; weeks + days; ≥ 2 days `N days`; ≥ 25 h `1 day Nh`; ≥ 6 h `Nh`; ≥ 1 h `Nh Nmin`; ≥ 5 min `Nmin`;
≥ 1 min `Nmin Ns`; `Ns`; 0 = `now`. PASSED adds ` ago` (not after `now`). Month = 30.44 days, year = 365.25 days.
Zone label: CEST between the last Sundays of March and October, else CET (label only; zones and DST are out of
scope). While the machine is off nothing can be asked.

## Params

| key | type | values | default |
|---|---|---|---|
| `persistent` | toggle | | on |
| `delay` | choice | `0`, `3600` (1h) | `0` |
| `offFrom` | select | `none`, or each day Mon 31 Aug … Mon 7 Sep at 03:30, 08:00, 18:00, 22:00 | Tue 1 Sep 22:00 |
| `offTo` | select | the same times (disabled when `offFrom` is `none`) | Wed 2 Sep 08:00 |
| `seed` | range | 1–99 (disabled without a delay) | 3 |
| `scene` | select, hidden | `arhiva`, `daily`, `logrotate`, `cron-or` | `arhiva` |

All `resets: true`. Reversed off/on picks are swapped; equal ones mean no outage. The steps depend on the params (a
delayed start is its own event).

## Presets and expected numbers

| preset | scene, window | jobs | power | steps |
|---|---|---|---|---|
| `book-arhiva` | `arhiva`, Mon 31 Aug 00:00 → Mon 7 Sep 00:00 | `30 3 * * * /usr/local/sbin/arhiva.sh`; `arhiva.timer` `Mon..Fri *-*-* 03:30:00`, `Persistent=true` | off Tue 22:00 → Wed 08:00 | 9 |
| `no-persistent` | the same | the same, no `Persistent=` | the same | 9 |
| `long-weekend` | `daily`, Thu 3 Sep 12:00 → Mon 7 Sep 12:00 | `0 0 * * *`; `arhiva.timer` `daily`, `Persistent=true` | off Fri 18:00 → Mon 08:00 | 6 |
| `randomized` | `logrotate`, Mon 31 Aug 12:00 → Thu 3 Sep 12:00 | `0 0 * * * /usr/sbin/logrotate /etc/logrotate.conf`; `logrotate.timer` `daily`, `RandomizedDelaySec=1h`, `Persistent=true`, seed 3 | none | 6 |
| `cron-or-trap` | `cron-or`, Tue 1 Sep 00:00 → Thu 1 Oct 00:00 | `0 3 1 * 1 /usr/local/sbin/mjesecno.sh`; `mjesecno.timer` `Mon *-*-01 03:00:00` | none | 5 |

Before each window the timer last ran at its previous scheduled time **at which the machine was on** (plus its
delay; an outage may start before the window, and then the times inside it count as missed for the catch-up). With
the presets' power, LAST at step 0 is
`Fri 2026-08-28 03:30:00` (arhiva), `Thu 2026-09-03 00:00:00` (daily), `Mon 2026-08-31 00:24:16` (logrotate, seed 3),
`Mon 2026-06-01 03:00:00` (cron-or).

- **book-arhiva** (events): Mon 03:30 both run · Tue 03:30 both run · Tue 22:00 off · Wed 03:30 both missed ·
  **Wed 08:00 boot: the timer's catch-up, once (covers Wed 03:30); cron nothing**; stored time → Wed 08:00; NEXT
  `Thu 2026-09-03 03:30:00 CEST`, LEFT `19h` · Thu 03:30 both run · Fri 03:30 both run · Sat 03:30 cron only ·
  Sun 03:30 cron only. Totals: cron 6 runs, 1 missed; timer 5 runs (one a catch-up), 1 missed.
- **no-persistent**: the same until Wed 08:00: boot, no catch-up, LAST `-`, nothing on disk; NEXT Thu 03:30.
  Totals: cron 6 / 1; timer 4 runs, 1 missed: Wednesday is lost for both.
- **long-weekend**: Fri 00:00 both run · Fri 18:00 off · Sat, Sun, Mon 00:00 both missed · **Mon 08:00 boot: one
  catch-up covering 3**, not three. cron 1 run, 3 missed; timer 2 runs, 3 missed; NEXT `Tue 2026-09-08 00:00:00`.
- **randomized** (seed 3): delays **442 s** (7 min 22 s), **3574 s** (59 min 34 s), **2461 s** (41 min 1 s), all
  below 1 h and different; steps: Tue 00:00 (cron runs, timer elapses) · Tue 00:07:22 service · Wed 00:00 ·
  Wed 00:59:34 · Thu 00:00 · Thu 00:41:01. With `delay` 0: 3 steps.
- **cron-or-trap**: cron runs Tue 1 Sep (day of month) and Mon 7, 14, 21, 28 Sep (day of week): **5 runs** where
  the author expected none; the timer has no elapse in September; NEXT `Mon 2027-02-01 03:00:00 CET` (checked with
  `systemd-analyze calendar` on nuc).
- **book-arhiva with `delay` 1h**: the catch-up waits from Wed 08:00 for `delayFor(3, Wed 08:00)` and then runs; one
  step more per delayed start.

## Deviations from the task (details in NOTES.md)

- `cron-or-trap` has **5** steps, not 6: September has exactly the five runs the task names.
- `book-arhiva` / `no-persistent` cover the whole week, which gives the task's 9 events ("Mon–Thu" is the
  interesting part).
- Off/on times are 03:30, 08:00, 18:00, 22:00 each day, not half-days (the presets need 22:00, 08:00, 18:00; 03:30
  makes the tie-breaks reachable); `none` added; a hidden `scene` param carries each preset's jobs and window.
- The cron lane in `long-weekend` / `randomized` and the timer lane in `cron-or-trap` are filled in by me.
- An outage picked outside the preset's window changes nothing; the clock bar says so.

## Captions

Task caption, `book-arhiva` step 5, both languages word for word:

- HR: „Stroj se upalio u 8:00. `arhiva.timer` ima `Persistent=true` i zapis da je zadnji put pokrenut u utorak, pa
  propušteni termin nadoknađuje odmah — jednom. Redak u `crontab`-u za to nema polje.“
- EN: "The machine came up at 08:00. `arhiva.timer` has `Persistent=true` and a record that it last ran on Tuesday,
  so it makes up the missed run at once — once. The crontab line has no field for that."

Every step: what happened at this event, lane by lane (cron first): shutdown, boot (catch-up once / n missed → one
run / delayed catch-up / no `Persistent=`: lost / nothing missed), run, missed, elapse with a delay, the delayed
start, no elapse that day (`Mon..Fri`), the OR match and the run count (`cron-or-trap`). A boot or shutdown that
falls on a scheduled time narrates both: the power change, then what each lane did at that minute (run, missed, or
the elapse absorbed into the catch-up). Counts of missed times use plural forms.

## Out of scope

`OnBootSec=` and the other monotonic timers (named in the explanation), `AccuracySec=`, `FixedRandomDelay=`,
`anacron` itself, mailing cron output (`MAILTO`, named), time zones and DST, `crond`'s own handling of clock jumps,
user crontabs vs `/etc/crontab` (the line is a user's, as in Primjer 3).

## Unchecked

- *(check)* The derived timelines were not run on a real machine over days (nuc cannot be powered off); the
  catch-up rules follow [TIMER] and the systemd timer source as I know it (next elapse computed from the stored last
  trigger; an elapse already in the past is moved to the boot so the random delay applies, per [TIMER]).
- *(check)* systemd's relative-time thresholds are from time-util.c as remembered; the forms seen on nuc and in UL10
  agree.
