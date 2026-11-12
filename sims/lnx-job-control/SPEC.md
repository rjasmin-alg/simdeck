<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-job-control: SPEC

One concept: **job control: fg/bg, Ctrl-Z, process groups, what dies on logout.** The shell runs every job as one
process group. The terminal knows one foreground group, and its keys (Ctrl-C, Ctrl-Z) signal that whole group and
nothing else. `fg` and `bg` move a job between foreground and background, `SIGCONT` wakes a stopped one. When the
window closes, the terminal hangs up on the shell and the shell passes the hang-up on to every job; `exit` is not a
hang-up.

Task: `docs/tasks/w3/lnx-job-control.md`. Catalogue §4.4. Builds on `lnx-signals` (dispositions, delivery, exit words;
its model is not in `models/` yet, so the parts used are copied, `NOTES.md`). Out of scope: handlers and `trap`
(`lnx-signals`, `lnx-subshell-trap`), sessions and `setsid` beyond naming them, terminal multiplexers, the login
manager's own clean-up of user processes, `wait`.

## Sources

- **UL ch08** `~/projects/uvod-u-linux/book/chapters/08-procesi.md`, "Signali i upravljanje poslovima": definition
  *posao u ljusci* (background, foreground or stopped job, numbered by the shell, named `%1`), `jobs` prints
  `[1]+  Running …`; a stopped process has STAT `T`; a background job is one the shell does not wait for, a
  foreground job one it waits for (POSIX XBD §3.35, §3.158). "Šire o temi": `fg` moves a background job to the
  foreground, `bg` resumes stopped jobs as background jobs (POSIX XCU `fg`, `bg`); `nohup` sets `SIGHUP` to ignore.
- **UL ch08 Primjer 1**: shell 38423, `sleep 300 &` = job 1 = PID 38450, PPID 38423, `kill %1` sends `SIGTERM`, after
  `sleep 1` `ps` prints only the header. **Primjer 3**: `nohup sleep 300 &`, PID 38485.
- **GNU Bash Reference Manual** §7.1 Job Control Basics (process groups, the terminal's foreground process group,
  `SIGTTIN`, `%+`/`%-`, "There are stopped jobs."), §7.2 (`disown`), §3.7.6 Signals (`SIGHUP` resent to all jobs,
  stopped ones also get `SIGCONT`; `huponexit` for an interactive login shell).
- **bash 5.2.21 on nuc, 2026-11-12**: an interactive `bash --norc -i` (and `-l -i`) on a pseudo-terminal (python
  `pty`); every message, mark and outcome below was seen there (`NOTES.md` "Checked against bash").

## Model

State (`sim.js`): `{ script, shell, terminal, procs, jobs, term, deliveries, ev, changed, out, seq, newTerm, i }`.

- `shell`: `{ pid, login, huponexit, exitWarned, alive }`.
- `terminal`: `{ open, fgPgid }`; `fgPgid` is the terminal's foreground process group (the shell's own PID when it
  shows its prompt).
- `procs`: `[{ pid, ppid, pgid, cmd, state: S|T|gone, disp, nohup, reads, sig, pending }]`. `disp` has a disposition
  (`default` / `ignore` / `catch`) for `HUP INT TERM KILL TSTP TTIN CONT`. `reads`: the process reads the terminal
  (`cat` with no file). `sig`: the signal that ended it; `pending`: signals waiting while it is stopped. The shell is a
  process too (`bash`, pgid = its own PID).
- `jobs`: the shell's job table, `[{ n, pgid, cmd, state: running|stopped|gone, fg, started, stoppedAt, word, disowned }]`.
  `started` and `stoppedAt` are counters (`seq`) for rule 8; `word` the end word once ended.
- `term`: the transcript, `{ kind: cmd|out|err|key|sep, text }`. `out`: lines this step added.
- `deliveries`: this step's signals in order: `{ sig, num, from: terminal|shell, kind: group|pid, target, reached:
  [{ pid, disp, act, sig }] }`, `act` one of `terminated`, `stopped`, `continued`, `ignored`, `nothing`, `caught`,
  `pending` (a stopped process keeps it), `released` (`SIGCONT` let a pending signal end it; `sig` names it).
- `changed`: the PIDs and job numbers (`job:N`) this step affected.

**One step** is one user action: a typed command line, a key (Ctrl-C, Ctrl-Z) or closing the window. Its
consequences, in order: (1) the terminal or the shell sends signal(s) to a process group (or the shell); (2) each
process applies its disposition; (3) the shell updates its job table and prints its notice; (4) the foreground group
changes if the action moved it.

Default actions: `HUP INT TERM KILL` terminate, `TSTP TTIN` stop, `CONT` continues a stopped process (nothing for a
running one). **A stopped process receives no signal but `SIGKILL` and `SIGCONT`:** a terminating signal (`HUP INT TERM`)
with the default action stays pending, the process stays `T`; `SIGCONT` then continues it and the pending signal with the
lowest number ends it (checked on Linux 6.8: `STOP`, `TERM`, `HUP` → still `T`; `CONT` → ended by `SIGHUP`). An ignored
signal is discarded. `SIGKILL` ends a stopped process at once. Interactive bash: `HUP` and
`INT` caught, `TERM TSTP TTIN` ignored (lnx-signals, checked in `/proc`). A `nohup` process: `HUP` ignored.

## Rules

1. **`cmd &` starts a background job.** The shell does not wait: it prints `[N] PID` and its prompt; `jobs` lists
   `[1]+  Running                 sleep 300 &`. The job number is the shell's, the PID the kernel's; `%1` and 38450
   name the same process. A new job takes one more than the highest job still listed. (UL ch08, Primjer 1; checked)
2. **Each job is one process group; a pipeline's processes share it.** The group's ID (PGID) is the PID of the
   pipeline's first process: `cat | grep x` → cat 38450, grep 38451, both PGID 38450. The shell is in its own group.
   (Bash §7.1; checked with `ps -o pid,ppid,pgid,stat`)
3. **Ctrl-C sends `SIGINT`, Ctrl-Z sends `SIGTSTP` to every process in the terminal's foreground process group**, and to
   nothing else. Background jobs do not see the keys. Ctrl-Z: the shell prints `^Z` and
   `[1]+  Stopped                 sleep 300`, takes the terminal back and prompts. Ctrl-C on a foreground job that dies
   of it: `^C`, no notice. At a prompt the foreground group is the shell's (it catches `SIGINT`, ignores `SIGTSTP`).
   (Bash §7.1; checked: Ctrl-Z stops both `cat` and `grep`, Ctrl-C ends both)
4. **Stopped, `bg`, `fg`.** A stopped process has STAT `T`, its job `Stopped`. `bg [%n]` sends `SIGCONT` to the job's
   group, prints `[1]+ sleep 300 &` and the job runs in the background. `fg [%n]` prints the command, makes the job's
   group the terminal's foreground group, sends `SIGCONT` only if it was stopped, and the shell waits (no prompt).
   Without `%n`, both take the current job `%+`. `bg` on a running job: `bash: bg: job 1 already in background`,
   nothing sent. `kill %n` on a stopped job sends `SIGCONT` after `SIGTERM` or `SIGHUP` (so the signal is received),
   not after other signals: `kill -INT %1` stays pending and the job stays `Stopped`. (UL ch08 "Šire o temi"; POSIX
   XCU `fg`, `bg`; checked, the `bg` error and `kill -INT`/`-TSTP` on a stopped job by the reviewer)
5. **A background job that reads the terminal is sent `SIGTTIN` and stops**, after any action that leaves it running in
   the background (`cat &` stops at once; checked). The terminal sends it to the reader's
   whole group: after `bg`, `cat` reads, both `cat` and `grep` stop again (`T`), and the shell prints
   `[1]+  Stopped                 cat | grep x` before its prompt. (Bash §7.1; checked: both `T`, `jobs -l` says
   `Stopped (tty input)`)
6. **Closing the window is a hang-up.** The terminal sends `SIGHUP` to the shell; interactive bash catches it, sends
   `SIGHUP` to every job's group, running or stopped, and `SIGCONT` to the stopped ones so they receive it; then, on its
   way out, `SIGTERM` and `SIGCONT` to the jobs its table had as stopped (as on `exit`, rule 7), and it ends of `SIGHUP`.
   A running process whose `SIGHUP` is ignored (`nohup`) survives; so does a job removed with `disown` (the shell does
   not signal it). A *stopped* `nohup` job does not: `SIGCONT` wakes it, `SIGTERM` ends it. Survivors get PID 1 as their
   parent. (Bash §3.7.6; UL ch08 Primjer 3; checked: plain and stopped `sleep` gone, the running `nohup` one with PPID 1;
   a `disown`ed one too; a stopped job that logs its signals logged `HUP`, `TERM`, `CONT`; a stopped `nohup sleep` gone)
7. **`exit` is not a hang-up.** With stopped jobs, bash prints `exit` (a login shell: `logout`) and
   `There are stopped jobs.` and stays. A second `exit` with no command between (only `jobs` may come between) exits:
   bash sends the stopped jobs `SIGTERM` (pending) and `SIGCONT`, and they end of the `SIGTERM`. Running background jobs survive `exit` (PPID 1),
   unless the shell is a login shell with `huponexit` set: then it first sends `SIGHUP` to every job (and `SIGCONT` to
   the stopped ones). Any other typed command between the two `exit`s brings the warning back; `jobs` and a key at the
   prompt do not. (Bash §7.1, §3.7.6; checked:
   `echo hi` between → warned again, `jobs` between → exits; the stopped job's logged signals were `TERM`, `CONT`;
   non-login + `huponexit` → the job survives; login + `huponexit` → it ends)
8. **Tie-break: `%+` and `%-`.** `%+` (current) is the most recently stopped job that is still stopped; if none is,
   the most recently started job. `%-` (previous) is the same choice among the other jobs. In `jobs`, other jobs show
   a blank mark. A notice or `bg`'s line shows the mark the job had at that moment. (Bash §7.1; checked: stopped [1],
   then `sleep &` [2] → `[1]+`, `[2]-`; a third job [3] → `[2]` blank, `[3]-`; `bg %1` prints `[1]+`, then `jobs` gives
   `[1]-`, `[2]+`; two stopped → the later `+`, the earlier `-`). With a single job, `%-` names it too (checked by the
   reviewer).
9. **Tie-break: notice timing.** The shell reports a background job's end or stop before its next prompt. In
   `kill %1; sleep 1` the notice follows `sleep 1` (the book's line; with `kill %1` alone it can come one prompt later,
   `lnx-signals` rule 10). A foreground job's stop is reported at once (`^Z` line).

### Output formats (checked on bash 5.2.21 / procps)

- `jobs` / notices: `[N]M  <word padded to 24><cmd>`; a running job's command ends in ` &`. Words: `Running`, `Stopped`,
  `Terminated` (15), `Hangup` (1), `Interrupt` (2), `Killed` (9).
- `bg`: `[N]M <cmd> &`. `fg`: `<cmd>`. Start: `[N] PID`.
- `ps -o pid,ppid,stat,cmd`: header `    PID    PPID STAT CMD`, rows `%7d %7d %-4s %s`. STAT: the state letter, `s` for
  a session leader (the shell), `+` when the process is in the terminal's foreground group.
- `nohup` on a terminal: `nohup: ignoring input and appending output to 'nohup.out'`.

## Params

- `script` (hidden; the presets choose it): `primjer1` (default), `ctrl-z`, `zatvori-prozor`, `exit-ili-zatvori`,
  `cjevovod`.
- `nohup` (toggle, default on): start the second job of `zatvori-prozor` under `nohup`. Only that scenario uses it.
- `huponexit` (toggle, default off) and `login` (toggle, default off: a terminal window's shell is not a login
  shell). Only `exit-ili-zatvori` uses them; the shell sends `SIGHUP` on `exit` only when both are on.

## Presets and expected results

Shell bash 38423 (PPID 38422, the terminal window), STAT `Ss`; `Ss+` while it is the foreground group.

| Preset | Steps | Steps and expected results |
|---|---|---|
| `primjer1` | 4 | 1 `sleep 300 &` → `[1] 38450`, group 38450, fg stays 38423. 2 `jobs` → `[1]+  Running                 sleep 300 &`. 3 `ps -o pid,ppid,stat,cmd -p 38450` → `  38450   38423 S    sleep 300`. 4 `kill %1; sleep 1` → `SIGTERM` from the shell to group 38450 → terminated; `[1]+  Terminated              sleep 300`; the job is gone. |
| `ctrl-z` | 5 | 1 `sleep 300` → job 1 in the foreground, fg 38450, no prompt, STAT `S+`. 2 Ctrl-Z → `SIGTSTP` to group 38450 → `T`; `^Z`, `[1]+  Stopped                 sleep 300`; fg 38423. 3 `bg` → `SIGCONT` → `S`; `[1]+ sleep 300 &`. 4 `fg` → `sleep 300`; fg 38450; no signal. 5 Ctrl-C → `SIGINT` to group 38450 → terminated; `^C`; job gone; fg 38423. |
| `zatvori-prozor` | 4 | 1 `sleep 300 &` → `[1] 38450`. 2 `nohup sleep 300 &` → `[2] 38485` and the `nohup` line; 38485 `HUP` ignore. 3 close → `SIGHUP` terminal → 38423 (caught) → `SIGHUP` shell → group 38450 (terminated) and group 38485 (ignored); no stopped job, so no `SIGTERM`; bash ends; 38485 PPID 1. 4 (new terminal) `ps -o pid,ppid,stat,cmd -p 38450,38485` → `  38485       1 S    sleep 300`. With `nohup` off: step 2 `sleep 300 &`, both end in step 3, step 4 header only. |
| `exit-ili-zatvori` | 6 | 1 `sleep 300 &` → `[1] 38450`. 2 `sleep 600` → job 2 = 38452 in the foreground. 3 Ctrl-Z → `[2]+  Stopped                 sleep 600`. 4 `exit` → `exit`, `There are stopped jobs.`; nothing ends. 5 `exit` → `exit`; `SIGTERM` to group 38452 → pending (`T`), `SIGCONT` → continues and ends of `SIGTERM`; bash ends; 38450 survives, PPID 1. 6 (new terminal) `ps -o pid,ppid,stat,cmd -p 38450,38452` → `  38450       1 S    sleep 300`. With `login` and `huponexit` on: `logout` in steps 4–5; step 5 `SIGHUP` to 38450 (terminated) and 38452 (pending), `SIGCONT` to 38452 (ends of `SIGHUP`), then no `SIGTERM` (its group is empty); step 6 header only. |
| `cjevovod` | 5 | 1 `cat \| grep x` → job 1, cat 38450 (reads the terminal), grep 38451, group 38450 in the foreground. 2 Ctrl-Z → `SIGTSTP` to both → `T`; `[1]+  Stopped                 cat \| grep x`. 3 `bg` → `SIGCONT` to both → `S`; `[1]+ cat \| grep x &`; then `SIGTTIN` from the terminal to group 38450 → both `T`; `[1]+  Stopped                 cat \| grep x`. 4 `fg` → `cat \| grep x`; fg 38450; `SIGCONT` → both `S+`. 5 Ctrl-C → `SIGINT` to both → terminated; `^C`; job gone. |

`sim.json` `steps` = 4 (the default scenario).

## Not modelled (named)

Sessions and `setsid` (the shell is the session leader, shown as `s` in STAT, nothing more), `SIGTTOU`, `SIGSTOP`,
`wait`, handlers other than bash's own, the shell's `checkjobs` option, the login manager's clean-up of a user's
processes at logout, terminal multiplexers.
