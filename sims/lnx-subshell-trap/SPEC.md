<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-subshell-trap: specification

One concept: **a `cd` in a subshell doesn't stick; cleanup on EXIT.** A subshell is a copy of the shell's execution
environment: what changes inside it stays inside, `exit` there ends only the copy, and the main script's
`trap … EXIT` does not run there but once, when the main script ends. Task: `docs/tasks/w3/lnx-subshell-trap.md`.
Every number below was checked in bash 5.2.21 (NOTES.md, Checks).

## Scene

- **Left:** the script as a numbered listing (as in `lnx-exit-status`). The line this step ran is marked, and the
  command of that line that ran is underlined inside it (a line such as `( echo "u podljusci"; exit 1 )` takes two
  steps). When a trap action runs, its `trap` line is marked and the action inside the quotes underlined.
- **Middle:** environment boxes, stacked like UL figure `podljuska-i-trap.svg`: the main script's box (solid frame:
  working directory, variables, the `EXIT` trap, the last `$?`), and inside it a nested box (dashed frame, "kopija")
  for `( … )`, `$( … )` or a pipeline member. A nested box appears as a copy, shows its own values, and in the step it
  ends it shows a door with its status; at the next step it is gone. Pipeline members are side by side.
- **Right:** the terminal (the caller's command line as in the book, `$ ./ciscenje.sh; echo "izlazni status: $?"`,
  each output line with the box it came from), the final `izlazni status`, and for `book-ciscenje` the temporary
  directory (exists / removed).

## State

`{ script, file, pc: { line, from, to } | null, envs: [{ id, kind: 'main'|'subshell', via: null|'paren'|'cmdsub'|'pipe',
member, parent, cwd, vars, traps: { EXIT }, reset, status, ended }], out: [{ text, env }], files: { path: bool },
exitStatus: null | number, lastEvent }`, plain JSON. `traps.EXIT` is the action text or `null` (default). `reset` is
true on a subshell whose copied trap was set back to the default on entry. `ended` is `null` or
`{ status, how: 'exit'|'end' }`. `lastEvent` names what this step did (for the caption).

## One step

One command runs: a simple command of the main shell or of a subshell, or a trap action (all its commands together).
In this order: (0) boxes that ended in the previous step are removed; (1) the command runs in the innermost
environment; (2) if it was `exit N` or the last command of a subshell's list, that environment ends (rule 2), unless it
has an `EXIT` trap: then the next step runs the trap and ends it (rules 4 and 7); (3) when a subshell ends, its status
becomes `$?` in its parent (rule 2).

Entering `(`, `$(` or a pipeline is not a step of its own: the box appears with the first command that runs in it.
A command substitution runs whole inside its command's step (`rad=$(mktemp -d …)` is one step: the box appears and
ends); everything printed inside it, also by copies made inside it and by its own `EXIT` trap, becomes its value
(`x=$(trap 'echo T' EXIT; echo a)` gives `x=$'a\nT'` in bash and in the model). A pipeline: the first step runs the
left member (`printf` writes its lines into the pipe and ends), then one step per pass of the `while read` loop; the
pass that leaves the pipe empty also ends the loop (the next `read` fails, the loop's status is its last body
command's, 0 if no pass ran) and the member. Real members run at the same time; the page shows them in turn and says
so. With no input the loop runs no pass and both members end in the pipeline's step. `exit N` in the loop body ends
only that member, with N (`printf 'a\n' | while read x; do exit 4; done; echo "st $?"` prints `st 4`). When the main shell has no `EXIT` trap, the step that runs its last command (or
its `exit N`) also returns its status.

Step 0 is the script loaded and nothing run.

## Rules

1. **A subshell is a separate execution environment, a copy of the parent's.** It starts with the parent's working
   directory, variables and `$?`; a `cd`, an assignment (or `umask`) inside it changes only the copy, and when it
   ends the parent's values are as they were. Checked: `cd /tmp; ( cd /etc; pwd ); pwd` prints `/etc`, `/tmp`;
   `v=1; ( v=2; echo in $v ); echo out $v` prints `in 2`, `out 1`. Source: UL ch17, definition *podljuska*; POSIX
   XCU §2.13 "Shell Execution Environment" *(check: section number of Issue 8, not re-read)*; bash(1) COMMAND EXECUTION
   ENVIRONMENT ("Changes made to the subshell environment cannot affect the shell's execution environment").
2. **`exit N` inside `( … )` ends only the subshell;** its status reaches the parent as `$?` and the script goes on.
   A subshell that runs off the end of its list ends with the status of its last command. Checked: `ciscenje2.sh`
   prints `u podljusci`, `podljuska je zavrsila sa: 1`. Source: UL ch17 `ciscenje2.sh`; POSIX §2.8.1 (errors in a
   subshell, as cited in ch17).
3. **On entering a subshell, traps that are not ignored are set to the default actions,** except in a command
   substitution containing only a single `trap` command, where they need not be altered. So the main script's `EXIT`
   trap does not run when a subshell exits. In the model a subshell's `EXIT` starts as `null` with `reset: true` when
   the parent had one; `$(trap)` (only a `trap` command) keeps the copy. Checked: `ciscenje2.sh` prints
   `trap u glavnoj skripti` once, at the end; `trap "echo x" EXIT; t=$(trap); echo "[$t]"` prints
   `[trap -- 'echo x' EXIT]` then `x`. Source: UL ch17 (footnote ch17-trap-podljuska, POSIX `trap` DESCRIPTION).
4. **`trap '…' EXIT` runs when the shell exits, also by `exit N` before the end of the code, and the exit status stays
   N** (the trap's own commands do not replace it). Inside the action `$?` is that N. A bare `exit` uses the `$?` of
   the environment it runs in (`false; exit` returns 1; `( false; exit ); echo $?` prints 1). Checked: `ciscenje.sh` prints `trap: brisem …` after
   `sada namjerno prekidam` and returns 3, and the directory is gone; `trap "echo T; false" EXIT; exit 3` returns 3.
   Source: UL ch17 `ciscenje.sh`; POSIX `trap` ("The EXIT condition shall occur when the shell terminates normally").
5. **`{ …; }` runs in the current shell:** no copy, so a `cd` there sticks. Checked: `{ cd /etc; }; pwd` prints `/etc`.
   Source: POSIX XCU §2.9.4 Compound Commands, grouping *(check: not re-read)*; bash(1) `{ list; }` ("executed in the
   current shell environment").
6. **Command substitution `$( … )` and each member of a multi-command pipeline run in subshells.** A variable set in
   `… | while read …` is lost after the loop in bash's default mode. Checked: `n=0; printf 'a\nb\n' | while read x; do
   n=$((n+1)); done; echo $n` prints `0` (and `$x` is empty after it). With `shopt -s lastpipe` in a script (no job
   control) bash runs the last member in the current shell and prints `2`; the model is the default. Source: UL ch17
   (the first `set -e` exception, member of a pipeline and command substitution run in a subshell); bash(1) Pipelines
   ("Each command in a multi-command pipeline … is executed in a subshell") and `lastpipe`.
7. **A trap set inside the subshell belongs to it and runs when the subshell exits;** the subshell's status is still
   its `exit N`. Checked: `( trap 'echo unutra' EXIT; exit 1 ); echo $?` prints `unutra`, `1`;
   `trap "echo main" EXIT; ( trap "echo sub" EXIT; exit 4 ); echo "st $?"` prints `sub`, `st 4`, `main`. Source:
   bash(1) `trap`; POSIX `trap` (EXIT on the shell that exits; a subshell is a shell environment of its own).
8. **Tie-break: when the main shell exits, its `EXIT` trap runs once, after the last line's output and before the status
   is returned.** The status returned is that of the `exit N`, or of the last command when the script runs off its
   end (`trap "echo T" EXIT; false` returns 1; `ciscenje2.sh` returns 0, the status of its last `echo`). Source: UL
   ch17 `ciscenje2.sh` (the trap line printed once, last; status 0).

Order of the tie-breaks in one step: a subshell's `exit N` sets its status N first; its own trap (rule 7) runs in the
next step and does not change N; only then does N reach the parent (rule 2).

## Params

- `script`: the five presets below (choice, resets the step).
- `showCopy` (toggle, default on): a nested box shows every copied value (working directory, variables, `$?`, the
  reset trap). Off: it shows only the values it changed itself, with "everything else: a copy of the parent". The model
  is the same; only the drawing changes.

## Presets and expected numbers

Steps are one per command run (as defined above). The caller's line and the final status are the book's.

| Preset | Script | Output (in order) | Final status | Steps |
|---|---|---|---|---|
| `book-ciscenje` | `ciscenje.sh` (UL ch17) | `radim u: /tmp/vjezba17.YHRD9D`, `/tmp/vjezba17.YHRD9D`, `sada namjerno prekidam`, `trap: brisem /tmp/vjezba17.YHRD9D`; the directory is gone | 3 | 7 |
| `book-ciscenje2` | `ciscenje2.sh` (UL ch17) | `u podljusci`, `podljuska je zavrsila sa: 1`, `trap u glavnoj skripti` | 0 | 5 |
| `cd-in-subshell` | `cd /tmp` / `( cd /etc; pwd )` / `pwd` / `{ cd /etc; }` / `pwd` | `/etc`, `/tmp`, `/etc` | 0 | 6 |
| `pipe-loses-var` | `n=0` / `printf 'a\nb\n' \| while read x; do n=$((n+1)); done` / `echo $n` | `0` | 0 | 5 |
| `trap-in-subshell` | `( trap 'echo unutra' EXIT; exit 1 )` / `echo $?` | `unutra`, `1` | 0 | 4 |

Step by step:

- `book-ciscenje` (7): `rad=$(mktemp -d …)` (a `$( … )` box appears and ends; `rad` set) · `trap … EXIT` · `echo "radim
  u: $rad"` · `ls -d "$rad"` · `echo "sada namjerno prekidam"` · `exit 3` (the shell is exiting, the trap pending) ·
  the trap action (`trap: brisem …`, the directory removed; status 3).
- `book-ciscenje2` (5): `trap … EXIT` · `echo "u podljusci"` (the `( … )` box appears, its `EXIT` reset) · `exit 1`
  (the box ends with 1; `$?` = 1 in the main box) · `echo "podljuska je zavrsila sa: $?"` · the trap action (status 0).
- `cd-in-subshell` (6): `cd /tmp` · `cd /etc` (box) · `pwd` → `/etc` (the box ends with 0) · `pwd` → `/tmp` ·
  `cd /etc` in `{ …; }` (main box) · `pwd` → `/etc` (status 0).
- `pipe-loses-var` (5): `n=0` · `printf` (both member boxes appear with `n=0`; the left one ends with 0) · pass 1
  (`x=a`, `n=1` in the member) · pass 2 (`x=b`, `n=2`; the loop and the member end with 0) · `echo $n` → `0`.
- `trap-in-subshell` (4): `trap 'echo unutra' EXIT` (in the box) · `exit 1` (the box is exiting, its trap pending) ·
  the box's trap action → `unutra` (the box ends with 1) · `echo $?` → `1` (status 0).

The directory name `YHRD9D` is the book's run (`mktemp` picks a new one each time); the model uses it so the page
matches the book.

## Legend

Main environment (solid frame) · subshell (dashed frame, "kopija") · value changed in this step (kit highlight) ·
trap set (hook) / reset to the default (struck-through hook) · output line (terminal, with the box it came from) ·
exit (door with the status). Every one has a shape or text besides its colour.

## Out of scope

`set -e` and its exceptions in full (`lnx-exit-status`), `source`/`.`, signals other than `EXIT` (`lnx-signals`),
`mktemp`'s safety (named only, as in ch17), `umask` (named in rule 1, not in a preset), background jobs (`&`),
`lastpipe` (named in the explanation only), bash's display of the parent's trap strings inside `( trap )`.
