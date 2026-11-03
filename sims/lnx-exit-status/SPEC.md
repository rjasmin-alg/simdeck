<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-exit-status: specification

One concept: **how failure propagates through a script, and a pipeline that reports success while one of its
members failed.** Task: `docs/tasks/w3/lnx-exit-status.md`. Every number below was checked in bash 5.2.21 (NOTES.md,
Checks).

## Scene

- **Left:** the script as a numbered listing. A pointer marks the line this step ran; every line that ran carries a
  badge with `$?` after it (`0` filled with a check, non-zero hollow with the number). The `set` lines follow the
  switches: a `set` line of the script whose switch is off is struck through ("off by the switch"); a switch that is
  on with no `set` line in the script adds an unnumbered `+ set …` line after the first line.
- **Middle:** the line of this step as boxes: each pipeline's members side by side joined by a pipe (as in
  `lnx-pipes-redirection`: fd 1 into the pipe, fd 2 to the terminal), `&&`/`||` as gates between pipelines, every box
  with its own status. Commands that did not run are dashed ("skipped"); a failure that `set -e` ignores is hatched,
  with the reason.
- **Right:** the `$?` register, `PIPESTATUS` (labelled bash only), the two switches as lamps, the terminal (stdout
  and stderr lines, each with its fd badge) and, for the `nightly` preset, the mailbox and the checkpoint files with
  their sizes.

## State

`{ script, file, pc, next, opts: { errexit, pipefail }, lastStatus, pipeStatus, out: [{ fd, text, line }], files,
mail, exited, lastEvent, view, badges }`, plain JSON. `pc` is the index of the line this step ran, `next` the line
that would run next (`null` at the end), `view` the evaluated line (pipelines, members, operators, the `set -e`
check), `badges` `$?` per line number.

## One step

One script line runs to completion, in this order: (1) each pipeline member gets its status; (2) the pipeline's status
(rule 3); (3) the `&&`/`||` chain decides what else on the line runs (rule 2); (4) `$?` is set; (5) `set -e` decides
whether to stop (rule 4). An `if` line is one step for its condition and, when a branch is on the same line, one for
that branch; a branch on its own lines runs as those lines. After the last line (or a stop) one more step: **the
caller reads the script's exit status** (rule 5), as the book's `; echo "izlazni status: $?"` does.

Step 0 is the script loaded and nothing run. The `set` lines are not steps: the switches are the options in force
from the start (in every preset the `set` lines come before any other command, so this is the same).

## Rules

1. **Every command leaves an exit status:** 0 success, anything else failure; 127 command not found, 126 found but
   not executable. Source: UL ch16 "Prva skripta: tumačski redak, izvršnost i izlazni status"; POSIX XCU §2.8.2.
2. **`a && b` runs `b` only if `a` returned 0; `a || b` runs `b` only if `a` returned non-zero.** Equal precedence,
   left to right; each operator looks at the status of the last pipeline that ran (a skipped one leaves it); the
   list's status is that of the last pipeline that ran. **Tie-break:** `a && b || c` is not if/else: `c` also runs
   when `a` succeeds and `b` fails (`true && false || echo B` prints `B`). Source: UL ch16 (footnote ch16-and-lista);
   POSIX §2.9.3.
3. **A pipeline's status is its last member's**, unless `pipefail` is on: then the rightmost member that failed, or 0
   if none did. `!` inverts the result (0 → 1, non-zero → 0). `PIPESTATUS` holds the members' own statuses (before
   `!`) of the last pipeline that ran. Checked: `false | (exit 3) | true` with pipefail → 3, `PIPESTATUS` `1 3 0`;
   `! (exit 2) | true` with pipefail → 0. Source: UL ch06 "Šire o temi"; UL ch17 (`help set`, bash 5.2.26).
4. **With `set -e` the shell exits as soon as a command fails, except:** (a) a failing member of a multi-command
   pipeline (only the pipeline's status counts); (b) the condition of `if`/`elif`/`while`/`until`, a pipeline
   starting with `!`, and every pipeline of an `&&`/`||` list except the last; (c) a compound command whose non-zero
   status came from inside such an ignored context. In the model: the shell stops when the list's status is non-zero,
   the pipeline that produced it is the list's **last** pipeline, it has no `!`, and the line is not a condition.
   Checked: `set -e; true && false; echo x` exits 1; `set -e; false && true; echo x` prints `x`;
   `set -e; if true; then false && true; fi; echo x` prints `x` (the `if` returns 1). Source: UL ch17 "Skripta koja
   smije raditi bez nadzora"; POSIX XCU §2.15 `set -e`.
5. **The script's exit status** is its last command's, or `n` of `exit n` (`exit` alone: `$?`); under `set -e` it is
   the status of the command that stopped it. Source: UL ch17 (`erre.sh` 1, `erre-pipefail.sh` 127).
6. **Tie-break, stderr vs status:** a message on stderr does not change the status, and a status prints nothing
   (`nema_ove_naredbe` prints `command not found` and the pipeline still returns 0). Source: UL ch17 Primjer 3.
7. **`if` with no branch run returns 0**, whatever the condition returned; `PIPESTATUS` still shows the condition's
   statuses (`if false; then …; fi` → `$?` 0, `PIPESTATUS` 1). Source: POSIX XCU §2.9.4.2; checked in bash.

## Presets and expected numbers

| id | script | set -e / pipefail | steps | stops at | final status | terminal |
|---|---|---|---|---|---|---|
| `erre` | UL ch17 `erre.sh` | on / off | 8 | line 9 (`false`) | 1 | `1 pocetak` … `4 cjevovod nije pao…`, `./erre.sh: line 7: nema_ove_naredbe: command not found` |
| `erre-pipefail` | UL ch17 `erre-pipefail.sh` | on / on | 2 | line 4 | 127 | only the `command not found` line |
| `nightly` | the nightly maintenance script (DR estate, generic names) | off / off | 6 | — | 0 | the journal line, two error lines; mail "Nightly OK" sent; checkpoint 1 214 000 B |
| `and-or` | three `&&`/`||` lines | off / off | 4 | — | 0 | `B`, `B` |

Other switch settings (checked in bash, the `erre` script with the switches edited):

- `erre`, both off: 9 steps, line 10 prints too, final 0. `erre`, pipefail only: same, line 7 gives `$?` 127 and
  the script goes on. `erre`, both on: 6 steps, stops at line 7 with 127.
- `nightly`, both on: 4 steps (journal, date test, checkpoint line → stop, end), status non-zero (the dump's exact
  status is not in the sources: shown as **≠0** *(check)*), no mail; the truncated checkpoint file is there anyway
  (the shell created it for `>`, `gzip` wrote what it got). pipefail only: `$?` ≠0 after line 4, the script goes on,
  the mail "Nightly OK" is still sent (the mail line does not look at it), final 0. set -e only: as both off.
- `and-or` line 2 `true && false || echo B`: `true` 0 → `&&` runs `false` 1 → `||` runs `echo B`; line 3
  `false && echo A || echo B`: `&&` skips `echo A`, `||` still sees 1 and runs `echo B`; line 4
  `mkdir -p pokus && cd pokus || exit`: both succeed, `exit` is skipped, `$?` 0. With `set -e` the same.

The `nightly` script (from `student/configs/colo/p4-commit/usr/local/bin/p4-nightly.sh`, with the product's program
and paths made generic, COMMON.md §1):

```
1 #!/bin/bash
2 repodb rotate-journal /srv/ckp/journal
3 if [ "$(date +%u)" = "7" ]; then
4     repodb dump - | gzip -1 > "/srv/ckp/checkpoint.$(date +%Y%m%d).gz"
5 fi
6 find /srv/logs -name '*.log' -mtime +30 -delete
7 echo "Nightly OK" | mail -s "Nightly OK" it-alerts
```

Facts from the student files: it is Sunday 2026-10-11; the journal line prints `rotating journal to
/srv/ckp/journal.1653`; the dump fails with a database write error and `Disk quota exceeded` (shown as `repodb: database write error` and
`write: /srv/repo/rev.db: Disk quota exceeded`) (`logs/p4-commit/p4-nightly.log`); the checkpoint of that day is 1 214 000 B, the one before
(2026-10-04) 131 945 690 300 B (`configs/colo/p4-commit/checkpoints-ls.txt`).

## Simplifications

- The `set` lines are switches, not steps (above). An added `+ set` line has no number, so the `line 7` in bash's
  message keeps the book's numbering (bash would count the added line).
- Commands are data (status and output per command), not run: `cat` copies its input, `exit` ends with `$?` or its
  `n` (only as a pipeline of its own: in a multi-command pipeline a member runs in a subshell, where `exit` ends only
  that member — `echo hi | exit 3; echo after` prints `after`; the model does not end the script there), everything else has a fixed
  result. `$(…)` is shown as written; its value (Sunday, the date) is a scenario
  fact.
- No brace groups, subshells, functions, `while`/`until` loops or `else` in the presets; rule 4(c) is shown by an
  `if` whose branch ends in an ignored failure (tested, no preset).
- Statuses over 255, `set -u`, `trap` and subshells are out of scope (task file).
