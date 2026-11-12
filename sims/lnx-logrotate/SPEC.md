<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-logrotate: spec

One concept: **rotation numbering, compress, copytruncate vs create**. The student runs weekly rotations of
`/var/log/messages` while the system logger writes into it, and follows each line to the file it ends up in.

Task: `docs/tasks/w3/lnx-logrotate.md`. Book: UL ch13 "`rsyslog`, `/var/log` i rotacija" and Primjer 4, ch05
Primjer 3, ch10 "Poslovi koji se pokreću sami". Checked against logrotate 3.21.0 on Linux 6.8 (nuc, 2026-11-12):
`strace` of single runs and the end state of eight whole demos (below, "Checked against logrotate").

## Scene

- **Writer** (left): the system logger, PID 9360 (the book's `rsyslogd`, as in `lnx-log-path`), and the selector that
  sends its messages to `/var/log/messages` (`*.info;mail.none;authpriv.none;cron.none`). One arrow leaves its open
  file descriptor and points at an **inode**, never at a name.
- **`/var/log`** (centre): one row per directory entry, name → inode, the lines in that inode as chips (`d13-2`), a
  `.gz` badge and hatching when compressed. An inode with no name that the writer still holds is a row of its own,
  "(deleted)". Rows removed in this step are drawn crossed.
- **logrotate** (right): the active directives, the status file's last rotation, and this run's operations, numbered
  in the order they happen.
- **Bottom**: day and date, the number of rotations, lost lines.

## State

`{ day, cycle, phase, files: [{ name, inode, lines, gz }], deleted: [{ inode, lines, gz, was }], writer: { pid, inode },
nextInode, lastRotation, rotations, lost, lostLines, ops, changed, removed, written, writtenTo, arrowMoved, due }`.
Line ids are `d<day>-<k>`. `deleted` (inodes with no name the writer still holds), `ops` (the run's operations in
order) and `removed` are additions to the brief's state, for rule 8 and for the operations list.

## Time

Day 0 is Sunday 2026-08-30. Cycle c is two steps: **write** on day 7c − 1 (`linesPerCycle` lines `d<7c−1>-1…`), then
**rotate** on day 7c (2026-09-06, 09-13, 09-20, 09-27, 10-04, 10-11, 10-18, 10-25). The status file records day 0 as the
last rotation, so every weekly run is due.

## Rules (in the order one run applies them)

1. **Due.** logrotate runs daily (cron job or `logrotate.timer`, `OnCalendar=daily`, `Persistent=true`) and changes a
   log at most once a day; `weekly` (= `weekly 0` in logrotate 3.21) rotates on a Sunday when the date moved on since
   the last rotation in `/var/lib/logrotate/logrotate.status`, or when at least 7 days passed since it.
   `isDue(day, last) = (weekday(day) = Sunday ∧ day > last) ∨ day − last ≥ 7`; day 0 is a Sunday, so each rotate step
   (days 7, 14, …) is a due run. The book gives only the 7-day half (ch13); the Sunday half is the man page and the
   book's own footnote ("rotated once each weekday, or…"), checked by the reviewer on logrotate 3.21 (on a Thursday,
   plain `weekly` with the last rotation 1, 4 or 6 days back does not rotate; `weekly 4` does). A log the status file does not know yet is not rotated on its first run: the run only writes "now" into the
   state (checked: `Creating new state … log does not need rotating`). The demo starts with the state already there.
   Sources: ch13 (cron, `-f`, `weekly`, the status file), ch10 (`logrotate.timer`), logrotate(8).
2. **`rotate N`** keeps N old versions; the version that would be N + 1 is removed. Source: ch13, logrotate(8).
3. **Numbering** (no `dateext`): shift from the highest number down (`.3→.4`, `.2→.3`, `.1→.2`), then
   `messages → messages.1`. A `.gz` keeps its suffix (`.2.gz → .3.gz`).
   **Tie-break, corrected:** the brief says the oldest is removed first so that N + 1 versions never exist. logrotate
   3.21 does the opposite: it shifts the oldest to `.N+1` (`messages.3.gz → messages.4.gz`), and removes `.N+1` last,
   after `postrotate` and compression (strace: `rename .3.gz→.4.gz … rename messages→messages.1, open messages
   O_CREAT, sh postrotate, gzip, unlink messages.1, unlink messages.4.gz`). The model follows logrotate; for one moment
   there are N + 1 old versions, and the operations list shows it.
4. **`dateext`**: the rotated file is renamed `messages-YYYYMMDD` (the run's date); nothing is shifted; the oldest
   dates beyond N are removed, also last (strace: `rename messages→messages-20261112`, create, postrotate, `unlink
   messages-20260906`). Source: ch13 listing of `/etc/logrotate.conf`.
5. **`create`**: rename, then create a new empty `messages` (a new inode). The writer's descriptor still points at the
   renamed inode. With the `postrotate` reload (`create-reload`, as the book's `/etc/logrotate.d/rsyslog` does) the
   writer closes and reopens `messages` and the arrow moves to the new inode. Without it (`create`) every later line
   lands in the renamed file (`messages.1`, then `messages.2` after the next run) and `messages` stays at 0 lines.
   Source: ch13 ("program koji u nju piše mora doznati…"), ch05 Primjer 3.
6. **`copytruncate`**: copy `messages` into a new `messages.1` (a new inode), then truncate `messages` in place. The
   writer's inode never changes and it needs no reload. With `writeDuringRotation` one line `d<7c>-1` arrives between
   the copy and the truncate: it is in neither file and is counted in `lost`. Source: logrotate(8) `copytruncate`;
   strace: `open messages`, `open messages.1 O_CREAT`, copy, `ftruncate(messages, 0)`.
7. **`compress`**: the version just made is gzipped after `postrotate` (gzip writes `messages.1.gz`, a new inode, and
   removes `messages.1`). With **`delaycompress`** the version just made stays plain; the previous plain one is
   compressed at the start of the next run, before the shift (strace: `gzip messages.1 → messages.1.gz`, `unlink
   messages.1`, then the shift). A writer without reload that still holds the compressed file's inode keeps writing
   into an inode with no name (rule 8). Source: ch13 (`compress`), logrotate(8).
8. **Removing a name the writer still holds** (by rule 2 or by compression) frees no space: the inode stays as
   "(deleted)" with its lines and keeps growing; the reload releases it (op `freed`). Source: ch05 Primjer 3
   (link count 0 and no open descriptor). Lines in a deleted inode are not counted as lost.

One run, in order: (a) `delaycompress`: compress the newest plain old version · (b) shift (no `dateext`) · (c) rename +
create, or copy + (the line between) + truncate · (d) `postrotate` reload (`create-reload` only) · (e) compress the
new version (`compress` without `delaycompress`) · (f) remove versions beyond N.

## Params

`method` `create-reload` | `create` | `copytruncate` (default `create-reload`); `rotate` 1–6 (4); `dateext` (on);
`compress` (off); `delaycompress` (off, only with `compress`); `linesPerCycle` 1–4 (2); `writeDuringRotation` (off, only
with `copytruncate`); `cycles` 2–8 (6, added: the presets differ in length). All `resets: true`. Steps = 2 × cycles.

## Presets and expected numbers (checked by `sim.test.js`)

| Preset | Params | Steps | End state |
|---|---|---|---|
| `book-config` | defaults: `weekly`, `rotate 4`, `create` + reload, `dateext`, 6 cycles | 12 | `messages` (0 lines), `messages-20261011`, `-20261004`, `-20260927`, `-20260920` (2 lines each); `-20260906` removed at step 10, `-20260913` at step 12; four dated files from step 8 on: about a month (Primjer 4) |
| `numbers-compress` | `dateext` off, `rotate 3`, `compress`, 5 cycles | 10 | `messages`, `messages.1.gz` (d34), `.2.gz` (d27), `.3.gz` (d20); cycle 1's lines (d6) gone at step 8 (after cycle 4) |
| `forgot-reload` | `create`, `dateext` off, 3 cycles | 6 | the writer stays on inode 2101: d13 lines go into `messages.1` (step 3), d20 into `messages.2` (step 5); `messages` 0 lines throughout; end `messages.3` = d6, d13, d20 |
| `copytruncate-loss` | `copytruncate`, `writeDuringRotation`, `dateext` off, 3 cycles | 6 | writer on 2101 throughout; `lost` = 3 (d7-1, d14-1, d21-1) |
| `delaycompress` | `create-reload`, `compress`, `delaycompress`, `rotate 3`, `dateext` off, 4 cycles | 8 | `messages.1` plain (d27), `.2.gz` (d20), `.3.gz` (d13) |
| `still-open` (added) | `create`, `rotate 1`, `dateext` off, 3 cycles | 6 | step 4: `messages.2` (the writer's inode 2101, 4 lines) removed, still open: "(deleted)" with d6, d13; step 5 adds d20 there; no space freed |

The brief's `book-config` line ("after cycle 5 there are four dated files; at cycle 6 the oldest is removed") fits a
first run that is not due; with the status file present every run rotates, so the first removal is at cycle 5.

## Checked against logrotate

`real.py` (scratch, in NOTES.md) runs logrotate 3.21.0 with `-f` once per cycle and a writer holding an `O_APPEND`
descriptor (reopening after a `postrotate` that touches a flag). End state (names, lines per name, the name the writer's
inode has, or deleted) equal to the model's for: `numbers-compress`, `forgot-reload`, `copytruncate` without the line
between, `delaycompress`, `still-open`, `create` + `compress` (rotate 2, 4 cycles), `create` + `delaycompress` (3 lines,
4 cycles), `copytruncate` + `compress` (rotate 2, 5 cycles, 1 line). `dateext` over several runs, checked by the
reviewer with `dateformat -%Y%m%d%H%M%S` and one second between forced runs (`dateext` + `compress` + `delaycompress`,
rotate 3, 5 runs: two `.gz` and one plain; `dateext` with and without `compress`, rotate 2: the oldest go), plus one
strace run with four old dated files (rename, create, postrotate, then the oldest removed). Not checked by a run: the
line between copy and truncate (a race; rule 6 follows the man page).

## Out of scope

`size`/`maxsize`, `maxage`, `mail`, `olddir`, `sharedscripts`, journald retention, writers without `O_APPEND`.
