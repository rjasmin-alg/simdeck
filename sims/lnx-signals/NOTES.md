<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-signals: notes

New stepper (task `docs/tasks/w3/lnx-signals.md`, catalogue `lnx-signals` §4.4). No kit view fits (a terminal transcript
and process cards), so the page draws its own stage in HTML. Rules and expected numbers: `SPEC.md`.

## Decisions

- **A small interpreter, not a script of pictures.** Each step is a command line (`start`, `jobs`, `ps`, `cat`,
  `sleep`, `kill`, or closing the terminal); the model delivers signals through the phases (permission → disposition →
  action → result) and prints what bash 5.2 prints. So the params really change the outcome: `stubborn` with a
  finishing handler ends in step 2 and `kill -KILL` then says `No such process`; `not-yours` as root goes through in
  step 1 and finds no process in step 2.
- **The terminal is the "result" view.** `ps -o pid,ppid,stat,cmd` and bash's job notices appear in the transcript when
  the step's line runs them, as in the book; the process cards are the kernel's view at every step (alive / struck,
  exit status, who reports it). The exit status is shown on the card (bash only reports it as a word, `Terminated`).
- **bash's own card.** The interactive shell's dispositions are real (HUP catch, INT catch, TERM ignore, checked in
  `/proc`), so the shell card itself shows ignore and catch, and rule 6 (the shell catches SIGHUP and resends it) is
  the shell's handler, not a special case.
- **Notice timing modelled** (rule 10): bash prints `[1]+  Terminated …` after the next command, not after `kill`.
  That is why the book's Primjer 1 needs `sleep 1` before the second `ps`, and the page shows the notice there.
- **Handler program `./zapis`**, files `zapis.lock` and `zapis.dat` (the brief's "zatvori datoteku, makni bravu"). Its
  handler, when set to finish, ends with `exit(0)`: bash says `Done`, status 0, a deliberate contrast with 143. *(derived)*
- **PIDs.** From the book: shell 38423, `sleep` 38450 (Primjer 1); shell 38458, `nohup sleep` 38485 (Primjer 3).
  Derived: the shells' parents 38422 and 38457, `./zapis` 38455, the `&`-only job 38482, ana's `sleep` 38470 and her
  shell 38466.
- **After the terminal closes** the next line is typed in "a new terminal" (a separator in the transcript); its shell
  is not drawn as a card.
- **Root's kill** (`not-yours` step 2) is drawn with root's prompt `#` in the same transcript; how root got a shell is
  not shown.
- **`kill %1` is fixed to the job's own shell** (student): a job number means something only in the shell that started
  it. The sender param is disabled in `book-primjer1` with that reason.
- **Scenario = hidden param `script`** (as in `lnx-rsync-delete`); the presets choose it. `handler` and `sender` are
  disabled, with a reason, in scenarios that do not use them.
- **Preset order** is book, nohup, handler-cleans, stubborn, not-yours (the task lists handler-cleans second). The
  gate's deep-link check opens the second preset at step `min(3, default steps)` = 3, and `handler-cleans` has 2 steps;
  see "Shared requests". The order also reads well: default actions (TERM, HUP) first, then handlers, then permission.
- **Concepts, not tools:** `kill`, `ps`, `jobs`, `nohup` and bash are the subject (UL ch08 teaches them by name).

## Checked against bash

bash 5.2.21 on nuc, 2026-11-03, an interactive `bash --norc -i` on a pseudo-terminal (python `pty`):

- `sleep 300 & jobs; ps -o pid,ppid,stat,cmd -p $!` → `[1] PID`, `[1]+  Running                 sleep 300 &`, the row
  with STAT `S`; `kill %1; sleep 1; ps …` → `[1]+  Terminated              sleep 300`, header only; `wait` → 143.
- `kill -9` → `Killed`, 137; `kill -HUP` → `Hangup`, 129; `kill -INT` to a running background `sleep` → `Interrupt`
  (the reviewer's run). With `sleep 300 & kill -INT %1` on one line I saw `Exit 130` twice: the signal reached the
  child before it had exec'd `sleep`. The model uses `Interrupt`; no preset sends SIGINT.
- `kill 1` as a user → `bash: kill: (1) - Operation not permitted`; unknown PID → `No such process`; `kill %5` →
  `bash: kill: %5: no such job`.
- Notice timing: `kill %1` alone prints nothing; the notice comes after the next command (`echo next`, `sleep 1`). A
  `kill %1` on an ended, unreported job → `bash: kill: (PID) - No such process`, then the notice; the next `kill %1` →
  `no such job`.
- Two jobs: `[1]-  Running …`, `[2]+  Running …`.
- A program whose SIGTERM handler sleeps forever: two `kill`s leave it in `ps` (STAT `S`), `kill -KILL` → `Killed`, 137.
- Interactive bash's `/proc/<pid>/status`: `SigIgn` has SIGTERM (and QUIT, TSTP, TTIN, TTOU), `SigCgt` has HUP and INT.
- `sleep 400 & nohup sleep 401 &`, then the pseudo-terminal closed: `sleep 400` gone, `sleep 401` running with PPID 1;
  the `nohup` job's `SigIgn` has SIGHUP.

## Deviations from the task

- **Interactive output, not the book's capture.** The book's Primjer 1 and 3 show `S+` and no `[1] 38450` line and no
  `Terminated` notice, which is what a session captured without job control prints. The page shows what an interactive
  terminal prints (`S`, `[1] 38450`, the notice), as the brief's `S` and "the exit status the shell would report" ask.
- **nohup's message** is what an interactive terminal prints, `nohup: ignoring input and appending output to
  'nohup.out'` (coreutils 9.4 on nuc, stdin is the terminal), not the book's `nohup: appending output to 'nohup.out'`
  (the book's capture had no terminal on stdin). Same reason as the line above.
- **Preset order** changed (see Decisions).
- **"Let time pass" is a `sleep N` in the line** (the book's own `sleep 1`), so time passing is a command the student
  can read, not an invisible step.
- **Orphan's new parent is PID 1.** On nuc it was 1; on a desktop with a per-user service manager it can be that
  manager (a subreaper) *(check)*. The page says "PID 1".

## Unchecked *(check)*

- PIDs and users marked derived above; `./zapis` and its files are invented for the `handler-cleans` / `stubborn`
  presets (the book only says "a program that has its own SIGTERM handler").
- `Interrupt` for SIGINT (see "Checked against bash"); no preset sends SIGINT.
- Marks of an ended, unreported job once a newer job exists: bash showed a blank mark (`[1]   Terminated`), the model
  gives `-`. No preset reaches it.

## Term pairs (missing from `kit/glossary.js`)

Written out in both tables until the coordinator adds them (`"src": "simdeck"`, Croatian from UL ch08):

| English | Croatian |
|---|---|
| default action | zadana radnja |
| signal handler | funkcija za hvatanje signala |
| ignore (a signal) | zanemariti |
| process ID | PID |

Used from the glossary: *signal* (signal), *job* (posao u ljusci), *exit status* (izlazni status), *parent process*
(roditeljski proces).

## Shared requests

- **kit tools: the deep-link check assumes the second preset has at least 3 steps.** `kit/tools/check-page.mjs`
  (`const deep = s(3)` with `s = (k) => Math.min(k, steps)`) uses the default scenario's step count for
  `?preset=<presets[1]>&step=3`; when that preset has fewer steps the kit clamps and the check fails. Smallest fix:
  clamp with the preset's own step count (`window.simdeck.steps` after loading the preset). Worked around by the preset
  order.
- **kit (0.6.0): a param's `visible()` has no effect** (same as `lnx-rsync-delete`): `.sd-ctl[hidden] { display: none; }`
  is added in this page's CSS; drop it once the kit has it.

## Sources

`SPEC.md` "Sources": UL ch08 "Signali i upravljanje poslovima" (+ "Šire o temi"), Primjer 1 and Primjer 3; POSIX
`<signal.h>`, `kill()`, `kill` and `nohup` as cited in ch08; bash(1) SIGNALS; bash 5.2.21 on nuc.

## Review

A fresh reviewer (a subagent with only SPEC.md, sim.js and sim.test.js, on a copy) read the model against the SPEC,
replayed claims on bash 5.2.21 / coreutils 9.4 in a pseudo-terminal, and broke 56 rules and tie-breaks one at a time:

- 42 of 56 breaks failed a test. The 12 real gaps (SIGKILL with a hand-edited disposition, `cleanup` and `inHandler`
  after SIGKILL, existence before permission, the Hangup word, notice order after `ps`/`cat`, `jobs` as the report,
  marks after a report, a pending notice after `no such job`) now have tests; the other two were dead code
  (`Exit N` for a handler, removed) and the job numbering below.
- Fixed from its findings: the nohup message (interactive form), the SIGINT word (`Interrupt`), job numbers (a reported
  `[1]` is reused), the job table dies with its shell (`%2` in the new terminal is `no such job`), and rule 10 reworded
  as reaping: `kill %1; jobs` on one line still shows `Running`. SPEC's state list and `cleanup` field corrected.
- Afterwards: 42 tests; breaking the between-lines reap fails 3, the `Running`-on-the-kill's-line rule fails 1.

## Timing

Start 2026-11-03 23:22, done 2026-11-03 23:52: about 30 minutes of wall-clock time for one session (bash checks, model, page, review and fixes).
