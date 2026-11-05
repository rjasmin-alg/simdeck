<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# restore-drill: spec

One concept: **backups report OK; only a test restore shows they're empty.** Task `docs/tasks/w3/restore-drill.md`,
catalogue `sto-restore-drill` (§4.6, overlap §5.3). Class stepper. The student runs the job for nights or weeks,
watching one check, then restores.

## Scene

- **Left, the source:** the list of what should be copied (with sizes where the source gives them). From the
  restore step on, a second column says, for the archive in focus, whether each entry came back (✓) or not (dashed
  outline, "nema" / "missing").
- **Right, the checks table:** one column per archive (header: date, file name, size bar scaled to the largest
  archive of the run, size), one row per check: file exists · size vs last time · `tar -t` · `tar -d` · `gzip -t` ·
  exit status of the job · restore + compare with the source. Each cell: ✓ (pass, filled), ✗ (fail, hatched), ? (no
  verdict) or — (does not apply), with its literal output. The relied-on row (param) is outlined thick and labelled
  "nadzor" / "dashboard"; its verdict per archive is also the dashboard light above the table.
- **The job's log** under the table: what the job printed in the step (nobody reads it at night); in the restore,
  compare and reveal steps the commands' outputs for the archive in focus.
- **Focus:** during the run, the archive just made; after it, the first archive whose restore test fails, else the
  newest.

## State

`{ fault, kind ('tar' | 'checkpoint'), srcDir, source: [{ path, bytes }], jobs: [{ date, file, bytes, prevBytes,
members: path[], exitStatus, log: string[], cut, partial, want }], reliedOn: [checkId], cursor, phase, restored:
[{ paths, status } | null], cells: { checkId: [result | null] }, dash: ['green' | 'red' | 'grey' | null], fresh:
[[checkId, j]], focus }`. A result is `{ v: 'pass' | 'fail' | 'none' | 'na', code, … }`; the page writes the
words. The task's `fault: { kind, fromJob }` is `fault` + the jobs' own fields (`cut`, `partial`, `exitStatus`,
`members`), since every job of a run has the same fault except in the checkpoint run, where the data says which.
`restored` is one entry per archive (the task has one list): see "One step".

`backup-diff-incr`'s vocabulary (sets, archives, restore, compare) is reused; none of its functions is needed.

## One step

1. Steps 1…J (J = number of jobs): job j runs. Its archive appears (header highlighted), the relied-on check(s) run
   on it and the dashboard shows the verdict. If the relied-on check is the restore test, that archive is restored
   now too.
2. Step J + 1: every archive is restored into its own empty directory (the restored list appears for the focus).
3. Step J + 2: each restore is compared with the source list: the restore row fills, missing entries are dashed.
4. Step J + 3: every check's verdict for every archive is revealed.

Steps = J + 3 (rule 9).

## Rules

Sources: UL = `uvod-u-linux/book/chapters/23-odrzavanje-sustava.md`; DR = `dr-lecture-estate/student/`.

1. **`tar -t` and `tar -d` ask the archive about itself.** A file that never entered the archive cannot be reported
   by either: both pass on an archive that misses a file (UL „Što treba znati": „ono što u arhivu nikad nije ušlo ne
   može prijaviti"; „`tar -t` i `tar -d` pitaju arhivu o njoj samoj"). Model: `list` passes with the member count
   and status 0, `diff` passes with no lines and status 0, unless the archive is cut (rule 4).
2. **The job's exit status is the only trace of a scope fault that tar saw**, and it exists once (UL: „Jedini trag
   postojao je, i pojavio se točno jednom: izlazni status naredbe koja je kopiju napravila"). Model: `status` fails
   when the job's status ≠ 0 (status 2 in `named` and `empty`). In the checkpoint run the job prints "nightly OK"
   even the night the server reported "Disk quota exceeded" (DR log, 2026-10-11). The log records no exit status;
   the model gives the job status 0 every week (derived: the crontab only appends output to the log, so nothing
   captures a status) and the row is labelled "log line" there: what the operator watches is that line, and it
   passes every week.
3. **A scope fault tar never sees gives status 0 everywhere** (UL kvar 1): the shell's `*` skips names starting with
   a dot, so tar gets 15 of 16 names (archive: 19 members with the two directories' contents); create, list and
   extract are 0; only restore + `diff -r` against the source finds it: `Only in /var/tmp/vjezba23/izvor/vjezba17:
   .postavke`, status 1.
4. **A content fault is caught by the archive checks** (UL kvar 2): 1671 B cut by 200 B to 1471 B; `gzip -t`
   "unexpected end of file", status 1; `tar -t` prints both members, **then** "Unexpected EOF in archive", status 2.
   A partial listing is not proof. Model: `cut` → `gzip` fails (1), `list` fails (2, members still counted),
   `diff` fails (2, derived: it reads the same stream), restore fails (2, derived: extraction stops at the same
   place).
5. **An empty archive lists nothing with status 0** (UL kvar 3: no read permission; job status 2 with two
   "Permission denied" lines; archive 45 B; `tar -tvzf` no lines, status 0) — the same output as a clean `tar -d`:
   zero lines and status 0 have two opposite meanings. Model: `list` passes with n = 0; `diff` passes (derived: no
   member to differ).
6. **Only a restore to another place, compared with what should have been copied, answers the question** (UL
   definition „proba oporavka"). Model: the restore gives back the archive's members (status 2 if cut); the source
   entries not among them are missing (a directory counts when its entry is a member); any missing entry, a cut
   archive or a short checkpoint fails the test.
7. **Tie-break, the dashboard** (derived, task): over the relied-on checks, red if any fails, else green if all
   pass, else grey (a check without a verdict, `none` or `na`, never shows green). An empty list is grey. The page
   offers one relied-on check at a time; the model takes a list.
8. **Size vs last time** (derived): no verdict when there is no earlier archive or no size (UL: „veličina sama po
   sebi ne kaže ništa dok se nema s čim usporediti"); fails when the archive is less than half the previous one, else
   passes. The previous archive is the previous entry of the data, also when the run shows fewer weeks. A checkpoint's
   expected size (for the restore's words) is the mean of its neighbours. `gzip -t` passes on a stream that was
   closed cleanly, however short (derived: the dump stopped, the compressor finished; DR gives no `gzip -t` output)
   *(check)*. The log lines of 09-13, 09-20 and 09-27 are derived from the later Sundays (the log starts on
   2026-09-28); the product's directory `/p4` is shown as `/vcs`. The short checkpoint still holds the start of
   `db.*`: the source column marks it "partial", the restore test fails as `short`.
9. **Steps:** jobs + 3: `named`, `dotfile`, `truncated`, `empty` one job each (4 steps), four nights with `repeat`
   (7), `checkpoint` `weeks` jobs (4–8 → 7–11 steps).

## Scenarios (expected numbers)

| Fault | Source | Archive | Job status | exists | size | tar -t | tar -d | gzip -t | status | restore |
|---|---|---|---|---|---|---|---|---|---|---|
| `named` | 3 names (`etc/named.conf` 1838 B, `var/named/lab.example.zone` 1110 B, `var/named/lab.local.zone` not on disk) | `named-puna.tar.gz` 1671 B, 2 members | 2 (`Cannot stat`, `Exiting with failure status`) | ✓ | ? | ✓ 2 members, 0 | ✓ no lines, 0 | ✓ 0 (derived) | ✗ 2 | ✗ missing `var/named/lab.local.zone` |
| `dotfile` | 16 entries incl. `.postavke` | `kvar1.tar.gz`, size not given, 19 members | 0 | ✓ | ? (no size) | ✓ 19, 0 | ✓ (derived) | ✓ (derived) | ✓ 0 | ✗ `Only in …: .postavke`, 1 |
| `truncated` | 2 names | `kvar2.tar.gz` 1471 B (1671 − 200), 2 members | 0 | ✓ | ? | ✗ 2 members then EOF, 2 | ✗ 2 (derived) | ✗ 1 | ✓ 0 | ✗ EOF, 2 (derived) |
| `empty` | 2 names | `kvar3.tar.gz` 45 B, 0 members | 2 (two `Permission denied`) | ✓ | ? | ✓ no lines, 0 | ✓ (derived) | ✓ (derived) | ✗ 2 | ✗ both missing |
| `checkpoint` | the metadata database (`db.*`) | 8 weekly checkpoints 2026-09-13 … 11-01, 131.1–133.0 GB; 10-11 is 1,214,000 B | "nightly OK" every week | ✓ | ? on 09-13, ✗ on 10-11 only | — | — | ✓ (derived) | ✓ every week | ✗ on 10-11 only (≈ 132.2 GB expected) |

With `repeat` (tar faults), four nights 2026-09-05 … 08 of the same job: the same verdicts every night, and size
passes from the second night (same size), except `dotfile` (no size given: ? every night).

Presets: `ul-named` (dashboard on `tar -d`: green), `ul-dotfile`, `ul-truncated`, `ul-empty`, `dr-checkpoint`
(dashboard on the log line: green all 8 weeks; size ✗ on 10-11 only; restore of 10-11 unusable) and
`ul-dotfile-nights` (four nights, 7 steps: the green dashboard repeats). The UL presets keep the default dashboard
(file exists) except `ul-named`.

## Params

`fault` (select, five scenarios), `reliedOn` (select: exists / size / `tar -t` / `tar -d` / exit status / restore;
default exists), `weeks` (range 4–8, checkpoint only, default 8), `repeat` (toggle, tar scenarios only: four nights).
Every param resets to step 0 (the step count or the run changes); `reliedOn` resets too, so a dashboard is never
shown for a check the operator did not watch at the time.

## Numbers checked

`node -e` over every fault × repeat (NOTES.md "Checks"): the table above is the model's output.
