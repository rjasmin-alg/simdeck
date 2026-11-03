<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-signals: SPEC

One concept: **SIGTERM vs SIGKILL, handlers, SIGHUP and nohup.** A signal is delivered to a process; the process's
disposition for that signal (default action, ignore, or catch with a handler) decides what happens. `kill` sends
`SIGTERM` unless told otherwise; `SIGKILL` can be neither caught nor ignored, so it gives no chance to clean up;
`nohup` sets only `SIGHUP` to ignore, which is what lets a job outlive its terminal.

Task: `docs/tasks/w3/lnx-signals.md`. Catalogue §4.4. Neighbours: `lnx-job-control` (fg/bg, Ctrl-Z, process groups;
out of scope here), `lnx-subshell-trap` (the shell's own `trap`; out of scope).

## Sources

- **UL ch08** `~/projects/uvod-u-linux/book/chapters/08-procesi.md`, "Signali i upravljanje poslovima": definition
  *signal* (a named, numbered notice with a default action; for `SIGTERM` and `SIGKILL` it is termination), `kill -l`
  (HUP 1, INT 2, KILL 9, TERM 15), `kill` sends `SIGTERM` when no signal is named, `kill -KILL` / `kill -9` must be
  asked for, definition *posao u ljusci* (`%1`), `jobs` output `[1]+  Running …`.
- **UL ch08 "Šire o temi"**: `SIGKILL` and `SIGSTOP` cannot be caught or ignored; a program with its own `SIGTERM`
  handler may clean up, or not exit at all; what `SIGKILL` leaves behind ("nedovršen zapis, … zaključana datoteka koja
  ostaje zaključana"); the `kill()` permission rule (real or effective UID of the sender = real or saved UID of the
  target, unless privileged); `nohup` sets `SIGHUP` to ignore and changes nothing else.
- **UL ch08 Primjer 1** ("posao koji treba prekinuti"): shell 38423, `sleep 300 &` = job 1 = PID 38450, PPID 38423,
  `kill %1` sends `SIGTERM`, after `sleep 1` the same `ps` prints only the header. Last paragraph: with a program that
  has its own `SIGTERM` handler the process might still be there, and only then `kill -KILL`.
- **UL ch08 Primjer 3** ("`nohup` i signal koji se unaprijed zanemaruje"): `nohup sleep 300 &`, `nohup: appending
  output to 'nohup.out'`, PID 38485, PPID 38458 (that session's shell), `&` and `nohup` do different things.
- **POSIX** (Issue 8 / POSIX.1-2024, as cited in ch08): `<signal.h>`, `kill()`, utilities `kill` and `nohup`.
- **bash(1)** SIGNALS: an interactive shell ignores `SIGTERM`, catches `SIGINT`, and on `SIGHUP` resends `SIGHUP` to
  all its jobs and exits; exit status of a command that died of signal N is 128 + N.
- **bash 5.2.21 on nuc, 2026-11-03** (an interactive shell on a pseudo-terminal, `NOTES.md` "Checked against bash"):
  every status, message and notice below.

## Model

State (`sim.js`): `{ script, shell, procs, jobs, files, terminal, newTerm, term, notices, deliveries, ev, changed, out,
i }`. `shell` is the terminal's bash PID; `jobs` its job table (`{ n, pid, cmd, state: running|ended|gone, word }`);
`out` the transcript lines this step added; `newTerm` whether a new terminal was opened after closing.

- `procs`: `[{ pid, ppid, user, cmd, stat, job, disp: { HUP, INT, TERM, KILL }, handler, inHandler, alive, sig, exit,
  reporter, nohup, prog, cleaned }]`. `disp` values are `default`, `ignore`, `catch`. `handler` is `finish`, `hang` or `null` (no handler).
  `sig` is the signal that ended the process; `exit` its exit status; `reporter` the PID of the shell that reports it
  (`null` when no shell waits for it).
- `files`: `{ lock, data, nohupOut }`; `lock` true/false/null (null = not in the scene), `data` `open` / `closed` /
  `half` / null, `nohupOut` true/false.
- `terminal`: `open` / `closed`. `term`: the transcript, a list of `{ kind: cmd|out|err|sep, user, text }`.
- `notices`: job ends the shell has not reported yet.
- `deliveries`: this step's signals, each `{ sig, num, target, from, perm, disp, act }` (phases a–c), in order; a
  default action also records `cleanup` (false for the handler program, null for a process with nothing to clean up).
- `changed`: the PIDs and file keys this step affected.

Users: `root` (UID 0), `student` (1000), `ana` (1001). Every process runs with real = effective = saved UID of its user.

**One step** is one command line typed into the terminal (`kill [-SIG] PID|%job`, a job started with `&` or `nohup …
&`, `sleep N; ps …`), or closing the terminal. A line may hold several commands (`;`); they run in order. Phases of
a signal: (a) permission check; (b) the target's disposition for that signal; (c) default action, ignore, or run the
handler; (d) the process table, the files and the exit status are updated. "Time passes" (`sleep N`) is when a running
handler gets to its end.

## Rules

1. **`kill PID` without a signal name sends `SIGTERM` (15)**; `kill -KILL` or `kill -9` sends `SIGKILL` (9). The
   target may be a PID or a job (`%1`); a job names a job of the shell it is typed in. (ch08; POSIX kill utility)
2. **Disposition per process and signal.** For `SIGHUP`, `SIGINT`, `SIGTERM`, `SIGKILL` the default action is
   termination. *Ignore*: nothing happens. *Catch*: the process's handler runs. (ch08 definition *signal*; POSIX
   `<signal.h>`)
3. **`SIGKILL` can be neither caught nor ignored.** Its disposition is always `default`; setting it to anything else is
   refused (`setDisp` returns the state unchanged). A process ended by `SIGKILL` (or by any default action) does no
   cleanup: the lock file stays, an open data file stays half-written. (ch08 "Šire o temi"; POSIX `<signal.h>`)
4. **A handler decides.** `finish`: during the next time passing, the handler closes the data file, removes the lock and
   calls `exit(0)`; the shell reports `Done`. `hang`: the handler never returns; the process keeps running and only
   `SIGKILL` ends it. `SIGKILL` while a handler is running ends the process there, with no cleanup. (ch08 Primjer 1,
   last paragraph; "Šire o temi". Derived, unchecked against a real program beyond bash, see NOTES.md)
5. **`nohup`** starts the command with `SIGHUP` set to ignore, appends its output to `nohup.out` (the file appears,
   empty for `sleep`) and prints `nohup: ignoring input and appending output to 'nohup.out'` (stdin is the terminal;
   the book's capture, without a terminal on stdin, shows `nohup: appending output to 'nohup.out'`). `SIGTERM` and `SIGKILL` keep their
   dispositions. (ch08 Primjer 3; POSIX nohup)
6. **Closing the terminal** sends `SIGHUP` to the shell (from the terminal, no permission check). Interactive bash
   catches `SIGHUP`: it resends `SIGHUP` to each of its jobs, then exits (status 129). A job started only with `&` dies
   of `SIGHUP`; a `nohup` job ignores it, survives, and its parent becomes PID 1. (ch08 Primjer 3; bash(1) SIGNALS;
   checked on bash 5.2.21: the `&` job died, the `nohup` job was running with PPID 1)
7. **Permission.** The signal goes through if the sender is privileged (`root`) or the sender's real or effective UID
   equals the target's real or saved UID. Otherwise bash prints `bash: kill: (PID) - Operation not permitted` and
   nothing changes. A PID with no living process: `bash: kill: (PID) - No such process`; a job that has ended or does
   not exist: `bash: kill: %N: no such job`. (ch08 "Šire o temi"; POSIX kill(); messages checked on bash 5.2.21)
8. **Exit status** after death by signal N is 128 + N: 129 for `SIGHUP`, 130 for `SIGINT`, 137 for `SIGKILL`, 143
   for `SIGTERM`. A handler's `exit(0)` gives 0. bash's notice words: `Terminated` (15), `Killed` (9), `Hangup` (1),
   `Interrupt` (2), `Done` (0). (bash(1); checked. `Exit 130` appears instead when SIGINT reaches the job before it has
   exec'd `sleep`, i.e. `&` and `kill -INT` on one line: the not-yet-exec'd child exits 130.)
9. **Tie-break: repeated signals.** A second `SIGTERM` to a process whose handler hangs is handled the same way: still
   running, nothing else changes. A `SIGTERM` to a process already in its `finish` handler changes nothing either. The
   state never depends on how many times the same signal was sent.
10. **Tie-break: notice timing.** bash learns of a job's end when it reaps the child: while it waits for an external
    command (`sleep`, `ps`, `cat`) or between lines, never inside the builtin `kill` that caused it. After each command
    it prints the ends it has reaped (`[1]+  Terminated              sleep 300`). So `kill %1` alone prints nothing; the
    notice follows the next command (after `ps`'s own output). `jobs` lists a reaped, unreported job with its end word
    and counts as the report; on the kill's own line (`kill %1; jobs`) the job is still `Running`. Job marks: `+` for
    the newest listed job, `-` for the one before it. Status words are padded to 24 columns. A new job takes one more
    than the highest job still listed, so a reported `[1]` is reused. (bash 5.2.21, checked; in real bash the
    reaping is a race that this order follows in every run seen.)
11. **Tie-break: a job outlives its number.** After the report the job is gone from the shell's list; `kill %1` then
    says `no such job` (checked). The job table dies with its shell: after the terminal closes, `%N` in the new
    terminal is `no such job`.

### Interactive bash's own dispositions

`HUP` catch, `INT` catch, `TERM` ignore, `KILL` default. Checked from `/proc/<pid>/status` of an interactive bash 5.2.21
(`SigIgn` has the bit of signal 15, `SigCgt` those of signals 1 and 2). So `kill 38423` (TERM) to one's own interactive shell does nothing.

### Output formats (checked on bash 5.2.21 / procps)

- `ps -o pid,ppid,stat,cmd`: header `    PID    PPID STAT CMD`; rows `%7d %7d %-4s %s`.
- `ps -o pid,ppid,user,stat,cmd`: header `    PID    PPID USER     STAT CMD`; USER left in 8 columns.
- starting a job: `[N] PID`. `jobs` / notices: `[N]M  <word padded to 24><cmd>`, a running job's cmd ends in ` &`.

## Params

- `script` (hidden; the presets choose it): `book-primjer1` (default), `handler-cleans`, `stubborn`,
  `nohup-and-hangup`, `not-yours`.
- `handler`: `finish` | `hang`, default `finish`. Only the scenarios with the handler program use it.
- `sender`: `student` | `root`, default `student`. The user who types a `kill` with a PID that the scenario does not
  fix. A `kill %job` is always typed in the job's own shell (student); `not-yours` step 2 is fixed to root.

## Presets and expected results

| Preset | Steps | Start | Steps and expected results |
|---|---|---|---|
| `book-primjer1` | 3 | bash 38423 (`Ss`) | 1 `sleep 300 & jobs; ps -o pid,ppid,stat,cmd -p $!` → `[1] 38450`, `[1]+  Running                 sleep 300 &`, row `  38450   38423 S    sleep 300`. 2 `kill %1` → `SIGTERM`, default → ended, status 143, no output. 3 `sleep 1; ps -o pid,ppid,stat,cmd -p 38450` → `[1]+  Terminated              sleep 300`, header only. |
| `handler-cleans` | 2 | bash 38423, `./zapis` 38455 job 1, TERM catch, lock present, data open | 1 `kill 38455` → `SIGTERM`, catch → handler runs; still alive. 2 `sleep 5; ps … -p 38455` → (finish) lock removed, data closed, exit 0, `[1]+  Done                    ./zapis`, header only. With `hang`: row `  38455   38423 S    ./zapis`. |
| `stubborn` (handler `hang`) | 3 | as `handler-cleans` | 1 `kill 38455` → catch, handler hangs. 2 `sleep 5; ps …` → row still there. 3 `kill -KILL 38455; sleep 1; ps …` → ended, status 137, lock stays, data half-written, `[1]+  Killed                  ./zapis`, header only. With `finish`: step 2 ends it (Done), step 3 → `bash: kill: (38455) - No such process`. |
| `nohup-and-hangup` | 4 | bash 38458 (`Ss`) | 1 `sleep 300 &` → `[1] 38482`. 2 `nohup sleep 300 & sleep 1; cat nohup.out; ps … -p $!` → `[2] 38485`, `nohup: ignoring input and appending output to 'nohup.out'`, row `  38485   38458 S    sleep 300`; HUP ignore; `nohup.out` appears. 3 close the terminal → HUP to 38458 (catch) → HUP to 38482 (default: ended, 129) and 38485 (ignore: alive, PPID 1); bash ended, 129. 4 (new terminal) `ps -o pid,ppid,stat,cmd -p 38485; kill -KILL 38485` → row `  38485       1 S    sleep 300`, then `SIGKILL` → ended, 137, no shell reports it. |
| `not-yours` | 2 | bash 38423 (student); `sleep 300` 38470 of `ana`, PPID 38466 | 1 `kill 38470` as student → `bash: kill: (38470) - Operation not permitted`, nothing changes. 2 `kill 38470` as root → `SIGTERM`, default → ended, 143, reported by ana's shell 38466. With sender `root`, step 1 goes through and step 2 says `No such process`. |

`sim.json` `steps` = 3 (the default scenario).

## Not modelled (out of scope, named)

`SIGSTOP`/`SIGCONT`, `fg`/`bg`, Ctrl-Z, process groups and the terminal's foreground group; real-time signals; signal
masks and pending signals; uninterruptible sleep (`D`); zombies (the shell reaps at once); the shell's `trap`
(`lnx-subshell-trap`).
