<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-job-control: notes

New stepper (task `docs/tasks/w3/lnx-job-control.md`, catalogue `lnx-job-control` §4.4). No kit view fits (a terminal
transcript, process-group boxes, two tables), so the page draws its own stage in HTML. Rules and expected numbers:
`SPEC.md`.

## Decisions

- **One action per step, a small interpreter.** Each step is a typed line, a key (Ctrl-C, Ctrl-Z) or closing the
  window; the model sends the signals to process groups, applies each process's disposition, updates the job table,
  prints what bash 5.2 prints and moves the foreground group, in that order (the brief's four consequences). The
  toggles really change outcomes (`nohup` off: both jobs die; `login` + `huponexit`: `exit` ends the `&` job).
- **The lnx-signals model is copied, not shared.** `models/` has no promoted model yet, so `sim.js` copies and adapts
  the parts it needs from `sims/lnx-signals/sim.js @ 68fdd60`: dispositions per signal (default / ignore / catch),
  interactive bash's own dispositions (`HUP`, `INT` caught; `TERM` ignored; here also `TSTP`, `TTIN` ignored, which
  lnx-signals saw in `/proc` but did not model), the end words, the ps line, the transcript and the "new terminal"
  separator. Adapted rather than verbatim: the delivery here goes to a process group and adds stop / continue; the
  permission check is left out (every sender here is the terminal or the user's own shell). See "Shared requests".
- **Signals go to groups.** A delivery records its sender (terminal or shell), target (a group, or the shell's PID for
  the hang-up) and what each reached process did. The page lists them numbered at the top of the stage, and marks
  each receiving group box with the signal's name: that is the brief's "arrow from the terminal or the shell to a
  group", drawn as a numbered route rather than SVG arrows so it stays readable in both languages and on a phone.
- **Pending signals.** A stopped process keeps `SIGTERM`, `SIGHUP` and `SIGINT` pending and stays `T`; `SIGCONT` lets
  it run and the lowest-numbered pending signal ends it (checked on Linux 6.8). That is why bash follows `SIGTERM` or
  `SIGHUP` to a stopped job with `SIGCONT`, and the page shows both: "pending while stopped", then "continues and ends of
  SIGTERM". A signal to a group with no process left is not drawn (bash's `SIGTERM` after a hang-up has already ended a
  stopped `sleep`).
- **Notices before the next prompt.** A background job's end or stop is printed in the step that caused it. Primjer 1
  uses the book's `kill %1; sleep 1`, after which bash really prints the notice (lnx-signals rule 10 has the finer
  timing).
- **Ended processes stay in the tree, struck** (✕, the signal that ended them), so "what died" stays visible; the ps
  table shows them only in the step they ended. The job table forgets a job one step after it ended; once the shell
  is gone the job table says there is none.
- **PID 1 as the new parent.** Survivors are drawn under a "parent PID 1" box (checked on nuc; on a desktop with a
  per-user service manager it can be that manager, a subreaper *(check)*, as lnx-signals notes).
- **PIDs.** Book: shell 38423, first job 38450 (Primjer 1), `nohup` job 38485 (Primjer 3). Derived: the shell's parent
  38422 (the terminal window), `grep` 38451 (the next PID after `cat`), `sleep 600` 38452.
- **`sleep 600`** for the foreground job in `exit-ili-zatvori`, so it cannot be mistaken for the `sleep 300 &` beside it.
- **Legend:** the running (filled circle) state is left out: no process in any preset is ever `R` (everything here
  waits: `sleep`, `cat` reading, `grep` on its pipe), so the legend shows `S` hollow, `T` square and ended ✕.
- **Scenario = hidden param `script`** (as in lnx-signals); the presets choose it. The toggles a scenario does not use
  are disabled with the reason.
- **Concepts, not tools:** bash, `jobs`, `fg`, `bg`, `kill`, `nohup`, `ps` and `disown` are the subject (UL ch08 and the
  Bash manual teach them by name); `cat | grep x` is a generic pipeline.

## Checked against bash

bash 5.2.21 on nuc, 2026-11-12, an interactive `bash --norc -i` (and `--norc --noprofile -l -i`) on a
pseudo-terminal (python `pty`); keys sent as `\x1a` and `\x03`:

- `sleep 300 &` → `[1] PID`; `jobs` → `[1]+  Running                 sleep 300 &`; ps STAT `S`, PGID = its PID; `kill %1`
  then `jobs` → `[1]+  Terminated              sleep 300`.
- `sleep 300`, Ctrl-Z → `^Z`, `[1]+  Stopped                 sleep 300`, STAT `T`; `bg` → `[1]+ sleep 300 &`; `jobs` →
  `Running … &`; `fg` → `sleep 300`; Ctrl-C → `^C`, no notice, `jobs` empty.
- `cat | grep x`: PGIDs equal to cat's PID; Ctrl-Z → both `T`, `[1]+  Stopped                 cat | grep x`; `bg` →
  `[1]+ cat | grep x &`, then `[1]+  Stopped                 cat | grep x` before the prompt, both `T`, `jobs -l` says
  `Stopped (tty input)`; `fg` → `cat | grep x`; Ctrl-C → both gone. bash `Ss`, the foreground process `R+`/`S+`.
- Close the window with `sleep 300 &`, `nohup sleep 301 &` and a stopped `sleep 302`: only the `nohup` one is left,
  PPID 1. `nohup` on the terminal printed `nohup: ignoring input and appending output to 'nohup.out'`.
- A stopped job that logs its signals, then the window closed: it logged `HUP`, `TERM` and `CONT`. The reviewer showed
  where the `TERM` comes from: on its way out bash also sends `SIGTERM` + `SIGCONT` to the jobs it had as stopped, as
  on `exit`; a stopped `nohup sleep` is gone after the close. Modelled (rule 6).
- A stopped `sleep`: `STOP`, `TERM`, `HUP` → still `T`; `CONT` → ended by `SIGHUP` (python `os.kill`, Linux 6.8.0).
- `exit` with a stopped job → `exit`, `There are stopped jobs.`; `jobs`, then `exit` → exits; `echo hi`, then `exit` →
  warned again. The stopped job, on the second `exit`, logged `TERM` and `CONT`.
- `sleep 303 &`, `exit` → it keeps running with PPID 1. Non-login shell with `huponexit` → the same. Login shell
  (`-l`, `shopt login_shell` on) with `huponexit` → `logout`, the job is gone; with a stopped job too:
  `logout`, `There are stopped jobs.`, second `exit` → both gone.
- `disown` then close → the disowned `sleep` keeps running, PPID 1.
- Marks: stopped [1] then `sleep &` [2] → `[1]+`, `[2]-`; third job [3] → `[2]` blank, `[3]-`; `bg %1` prints `[1]+`
  and then `jobs` gives `[1]-`, `[2]+`; two stopped [3], [4] → `[4]+`, `[3]-`; `kill %4` → `[3]+`, `[2]-`.

## Deviations from the task

- **`exit-ili-zatvori` has 6 fixed steps**, not "4 (+2 with the toggles)": it adds a stopped job (steps 2–3) so that
  rule 7's first half (`There are stopped jobs.`, the second `exit`) is shown, then `exit`, `exit` and a `ps` in a new
  window. The toggles change outcomes, not the step count, so the step count never depends on params.
- **`cjevovod` has 5 steps**, not 4: Ctrl-C at the end, for the misconception "Ctrl-C kills only the last command of a
  pipeline" that the brief lists.
- **Primjer 1 step 4 is `kill %1; sleep 1`** (the book's own line), so the notice is printed in that step.
- **The ps view shows PGID** as well as PID, PPID and STAT: the group is the concept.
- **Rule 6's `SIGCONT` to a stopped job** and `disown` are in the model and its tests but no preset reaches them (the
  brief's `zatvori-prozor` has two running jobs); the explanation names both.
- **The brief's two captions** are used as written, with one sentence added to the hang-up one ("now with parent PID
  1"), and without the code formatting (captions are plain text).

## Unchecked *(check)*

- `%+` after `bg` of one of several jobs is checked for two jobs only.
- `kill %1` on a stopped job: bash re-prints `[1]+  Stopped` first and the `Terminated` notice one prompt later (the
  reviewer saw it); the model prints `Terminated` in the same step (rule 9's timing simplification). No preset does it.

## Term pairs (missing from `kit/glossary.js`)

Written out in both tables until the coordinator adds them (`"src": "simdeck"`, Croatian from UL ch08):

| English | Croatian |
|---|---|
| process group | grupa procesa |
| foreground job | prednji posao |
| background job | pozadinski posao |
| stopped (suspended) job | obustavljen posao |
| job control | upravljanje poslovima |

Used from the glossary: *job* (posao u ljusci), *parent process* (roditeljski proces), *session* (sjednica).

## Shared requests

- **models: promote lnx-signals' process model** (dispositions, bash's dispositions, end words, the ps line) so this sim
  and lnx-signals share it; this sim would also need group delivery and the stop / continue default actions (`TSTP`,
  `TTIN` stop, `CONT` continues; a terminating default also ends a stopped process). Until then `sim.js` carries its
  adapted copy (header comment).
- **kit (0.6.0): a param's `visible()` has no effect** (as lnx-signals, lnx-rsync-delete): `.sd-ctl[hidden]
  { display: none; }` is in this page's CSS; drop it once the kit has it.
- **kit: `.sd-changed` on a table row** draws its outline and halo over the neighbouring rows; the page turns them off
  for `tr` and marks the row with a bar instead. A kit rule for `tr.sd-changed` would help other table pages.

## Review

A fresh reviewer (a subagent with SPEC.md, sim.js and sim.test.js, on a copy) read the model against the SPEC,
replayed claims on bash 5.2.21 in a pseudo-terminal and ran 60 mutations, one at a time:

- 46 of 60 failed a test. Of the 14 that did not, 3 were equivalent or unreachable (a redundant `terminal.open` check,
  the `Done` word, `norm({})`), 2 harmless (fg flags, stop on an already stopped process); the rest now have tests
  (job number after `kill %1` with two jobs, `[N]` = last PID of a pipeline, `Interrupt` for a background `kill -INT`,
  a key keeps the `exit` warning, `[2]+ Stopped` on a second Ctrl-Z, the window closing after `exit`, `bg` on a running
  job, `SIGCONT` only after `SIGTERM`/`SIGHUP`).
- Its main finding was a wrong premise: a terminating signal does **not** end a stopped process; it stays pending until
  `SIGCONT` (checked again here). Fixed in the model, the SPEC, the tests, two captions and the explanation.
- Also fixed from its findings: bash's `SIGTERM` + `SIGCONT` to stopped jobs on a hang-up (a stopped `nohup` job dies),
  `kill` adds `SIGCONT` only after `SIGTERM`/`SIGHUP`, `SIGTTIN` after any action (`cat &`), the `bg` error on a running
  job, `%-` with a single job.
- Afterwards: 41 tests.

## Timing

Start 2026-11-12 03:11, done 2026-11-12 03:43: about 32 minutes of wall-clock time for one session (bash checks,
model, page, review and fixes).

## Sources

`SPEC.md` "Sources": UL ch08 "Signali i upravljanje poslovima" (+ "Šire o temi"), Primjer 1 and Primjer 3; POSIX
XBD §3.35, §3.158, XCU `fg`, `bg`, `nohup` as cited in ch08; GNU Bash Reference Manual §7.1, §7.2, §3.7.6; bash 5.2.21
on nuc.
