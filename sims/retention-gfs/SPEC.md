<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# retention-gfs: specification

One concept: **how many copies a schedule keeps and how far back you can go.** Task:
`docs/tasks/w3/retention-gfs.md`; catalogue `sto-retention-gfs` (§4.6, overlaps §5.3). Class: explorer (the state is
a pure function of the params; no steps).

## Scene

The year 2026 as a calendar: ISO weeks as columns (Mon 29 Dec 2025 … Sun 3 Jan 2027, 53 columns), Monday to Sunday
as rows, months tinted in turn and labelled above the week holding their 1st. One backup a night at 01:40 from
1 January to "today" (param `day`). Each surviving backup is a mark tagged by the rule that keeps it; every other
backup made is a faded dashed outline (pruned); a failed job's day is a cross; days after today are blank. Above the
calendar: recovery points kept (with the count per rule), the oldest point's age and date, the newest point's age and
date, the largest gap between two consecutive points, and, when `detectAfter` > 0, the verdict card.

## Rules

Source of the prune semantics: the backup server of the DR estate (`student/configs/hq/hq-nas02/shares-and-dumps.txt`)
and the vendor's documentation of backup pruning, cross-checked by an independent script (NOTES.md). Definitions of
retention and recovery point: UL ch23 ("Potpuna i prirasna kopija…", "Više kopija u vremenu…").

1. **Order.** The options apply in the order last, daily, weekly, monthly, yearly.
2. **Periods.** keep-last: every backup is its own period. daily: the calendar day. weekly: the ISO week (Monday to
   Sunday). monthly: the calendar month. yearly: the calendar year. Walking the backups **newest first**, an option
   keeps the first (newest) backup of each new period until it has kept N, then **stops**; an older backup in a period
   it has kept is marked for removal. Backups it never reached stay unmarked for the next option. Consequence: the
   weekly point of a week still running is its newest day (Tuesday 30 June), not its Sunday.
3. **No double counting.** A backup already marked by an earlier option (kept, or marked for removal) is skipped. A
   backup in a period that an earlier option already keeps a backup of is skipped and **not counted**. So 7 daily +
   4 weekly gives 11 points reaching back 32 days (on 31 Dec), not 11 weeks.
   *Wording differs from the task*, which says each option "only considers backups older than everything already kept
   by the options before it". This rule is the vendor's walk. The fresh review implemented the task's wording too and
   compared the kept sets on 400 random count sets at days 30, 90, 200 and 365: all 1600 identical.
4. **Only after success.** The prune runs after each successful job. A failed job adds nothing and removes nothing
   (DR `shares-and-dumps.txt`: "prune runs only after a successful job").
5. **Tie-break, one day.** Two backups on one day: the later one counts for that day (rule 2, newest first); the
   earlier is marked for removal and no later option can take it.
6. **Progressive.** The prune runs over what survived the night before; a backup removed is gone even if a later rule
   "would have" kept it. So January's monthly point is 25 Jan (the last weekly that survived), not 31 Jan; one prune
   over all 365 nights at once would keep 31 Jan.
7. **Empty policy** *(check)*. With every count 0, nothing is pruned (the prune never deletes on an empty policy):
   all backups stay, tagged "all". Added by this sim (the task's params allow all zeros); the vendor's prune keeps
   everything when no keep option is set.

Whatever no option keeps is removed.

### Derived numbers

- **Copies kept**: the kept points. **Oldest / newest age**: today − that point's day, in days. **Largest gap**: the
  largest difference in days between two consecutive kept points; tie-break: of equal gaps, the oldest is reported.
- **Short** (caption): for the first rule that keeps fewer than it asks for, `total` = its periods in the run so far
  (backups for keep-last), `covered` = those holding a point of an earlier rule; it keeps `total − covered`. E.g.
  7 + 4 + 12 on 31 Dec: monthly 12 months, 2 covered, 10 kept; on 15 Mar: 3 months, 2 covered, 1 kept.
- **Verdict** (`detectAfter` = N > 0): a fault noticed today appeared N days ago, during the working day after that
  night's 01:40 job. A kept point is clean when its age ≥ N (tie-break: a point exactly N days old is clean). The
  newest clean point is where the restore goes back to (7 + 4 + 12, N = 42: 25 Oct, 67 days); no clean point → "no
  clean point". A fault before 1 Jan 2026 (N ≥ day) is shown with its year.
- **Changed** marks: dates kept now and not under the previous params, and the reverse; only after a change of one
  param (a preset load changes several and marks nothing).

## Params

| key | range | default | notes |
|---|---|---|---|
| `last` | 0–30 | 0 | keep-last |
| `daily` | 0–14 | 7 | |
| `weekly` | 0–8 | 4 | |
| `monthly` | 0–24 | 12 | |
| `yearly` | 0–5 | 0 | |
| `failFrom` | none / 2026-09-14 | none | jobs fail from that night on |
| `detectAfter` | 0–400 days | 0 (off) | |
| `day` | 1–365 | 365 | "run the year to": today = 1 Jan + day − 1 |

The run always starts on 1 Jan 2026 (deviation: the task runs presets 4–5 from 1 Aug; with no monthly or yearly rule
the kept set on 13 Sep is the same either way, which a test checks).

## Presets and expected numbers (checked by script and by `sim.test.js`)

1. `ul-primjer-6` (UL ch23 Primjer 6): 7 daily + 4 weekly, `detectAfter` 42, to 31 Dec. Kept 29 Nov, 6, 13, 20 Dec
   (weekly) and 25 … 31 Dec (daily) = **11**; oldest **32 days**; fault on 19 Nov → **no clean point**. Largest gap
   7 days.
2. `gfs-7-4-12`: + 12 monthly. **21** points (7 + 4 + 10: Nov and Dec are covered by weekly and daily), oldest
   **25 Jan, 340 days**. Monthly points 25 Jan, 22 Feb, 29 Mar, 26 Apr, 31 May, 28 Jun, 26 Jul, 30 Aug, 27 Sep, 25 Oct
   (each month's last surviving Sunday). Largest gap 35 days (22 Feb → 29 Mar).
3. `last-30`: keep-last 30 only. **30** points, oldest **29 days**: more copies than preset 2, a tenth of the reach.
4. `dr-vm-dumps` (DR `shares-and-dumps.txt`): 7 daily + 4 weekly, to 13 Sep. Kept 16, 23, 30 Aug, 6 Sep (weekly) and
   7 … 13 Sep (daily) = **11**, matching the listing.
5. `dr-vm-dumps-failing` (DR `vzdump-history.txt`: jobs fail from 14 Sep): preset 4 with `failFrom` 14 Sep, to 1 Nov.
   The same 11 (rule 4); the newest point is **49 days old**; 49 failed nights.

## Captions

The change of one count ("Weekly 4 → 7: recovery points 11 → 14, oldest 32 days → 53 days."), then the state: jobs
failing (newest age), no rule set (everything kept), no backup, or the plain line (points per rule, total, oldest,
largest gap) with, when a rule keeps fewer than asked, why (the periods covered by earlier rules, or a run still too
short); then the verdict sentence when `detectAfter` is on.

## Out of scope

Storage cost per copy (`backup-diff-incr`), offsite rotation, tape rotation schemes, legal retention, immutability.
