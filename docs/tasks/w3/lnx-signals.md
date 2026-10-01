# lnx-signals: Signals

| | |
|---|---|
| Task | `lnx-signals` (wave 3, Linux) |
| Catalogue entry | `lnx-signals` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-signals/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `processes` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **SIGTERM vs SIGKILL, traps, SIGHUP and nohup**.

The student: send signals to processes with and without handlers.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/08-procesi.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-08/`
- Catalogue seed: UL ch08
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/08-procesi.md`: section "Signali i upravljanje poslovima" (definition *signal*, `kill -l`, `kill` default `SIGTERM`, definition *posao u ljusci*) and its "Šire o temi" (`SIGKILL`/`SIGSTOP` cannot be caught or ignored; `kill()` permission rule; `nohup`); Primjer 1 ("posao koji treba prekinuti": PIDs 38450/38423) and Primjer 3 ("`nohup` i signal koji se unaprijed zanemaruje": PID 38485)
- POSIX (The Open Group Base Specifications Issue 8): `<signal.h>`, `kill()`, utilities `kill` and `nohup`, as cited in ch08; bash(1) SIGNALS and exit status 128+N (check)

## Model and presets

- **Scene:** a terminal window with its shell (`bash`, PID 38423) and the jobs it started, drawn as process cards: PID, PPID, owner, `STAT`, and a small disposition table per process for `SIGHUP`, `SIGINT`, `SIGTERM`, `SIGKILL` (default / ignore / catch). One card is a program with its own `SIGTERM` handler ("zatvori datoteku, makni bravu"), which can be set to finish or to hang; a lock file and a half-written data file sit beside it. The signal being sent travels as a labelled envelope; the result shows `ps -o pid,ppid,stat,cmd` and the exit status the shell would report.
- **State:** `{ procs: [{ pid, ppid, user, cmd, stat, disp: { HUP, INT, TERM, KILL }, handler: 'finish'|'hang'|null, alive, exit }], files: { lock, data }, terminal: 'open'|'closed', sender: 'student'|'root', last: { sig, target, result } }`.
- **One step:** one action: `kill [-SIG] PID|%job`, close the terminal, or let time pass (a handler runs). Phases: (a) permission check; (b) look up the target's disposition for the signal; (c) default action, ignore, or run the handler; (d) update `ps`, files and exit status.
- **Rules:**
  1. `kill PID` without a signal name sends `SIGTERM`; `kill -KILL` / `kill -9` must be asked for. (ch08 "Signali i upravljanje poslovima"; POSIX kill utility)
  2. Each signal has a disposition per process: default action (for `SIGHUP`, `SIGINT`, `SIGTERM`, `SIGKILL`: terminate), ignore, or catch with a handler. (ch08 definition *signal*; POSIX `<signal.h>`)
  3. `SIGKILL` (and `SIGSTOP`) can be neither caught nor ignored; the process gets no chance to clean up: the lock file stays, the data file stays half-written. (ch08 "Šire o temi")
  4. A program with a `SIGTERM` handler decides what happens: it may clean up and exit, or not exit at all; then `SIGTERM` changes nothing and only `SIGKILL` ends it. (ch08 Primjer 1, last paragraph)
  5. `nohup` starts the command with `SIGHUP` set to ignore and appends its output to `nohup.out`; it changes nothing about `SIGTERM` or `SIGKILL`. (ch08 Primjer 3; POSIX nohup)
  6. Closing the terminal sends `SIGHUP` to the shell, which passes it to its jobs; a job started only with `&` dies, a `nohup` job survives. `&` and `nohup` do different things. (ch08 Primjer 3; bash(1) SIGNALS, check)
  7. Permission: the sender's real or effective UID must match the target's real or saved UID, unless the sender is privileged; otherwise "Operation not permitted". (ch08 "Šire o temi"; POSIX kill())
  8. Exit status after death by signal N, as the shell reports it: 128 + N (143 for `SIGTERM`, 137 for `SIGKILL`). (bash(1), check)
  9. Tie-break: if the handler is set to "hang", a second `SIGTERM` is handled the same way (still running); the state never depends on how many times the same signal was sent.
- **Params:** `handler` choice `finish` | `hang`, default `finish`; `sender` choice `student` | `root`, default `student`. Actions come from presets.
- **Presets:**
  - `book-primjer1` — `sleep 300 &` (job `%1`, PID 38450, PPID 38423, `S`), `kill %1` → `SIGTERM`, default action, `ps` shows only the header. From ch08 Primjer 1.
  - `handler-cleans` — the program with a handler gets `SIGTERM`: lock removed, data file closed, exits. Derived, unchecked.
  - `stubborn` — handler set to hang: `SIGTERM` → still running; `kill -KILL` → gone, lock file and half-written file left behind, status 137. Derived from ch08 "Šire o temi", unchecked.
  - `nohup-and-hangup` — `sleep 300 &` and `nohup sleep 300 &` (PID 38485, output to `nohup.out`); close the terminal: the first dies of `SIGHUP`, the second keeps running; `kill -KILL 38485` still ends it. From ch08 Primjer 3, terminal-close part derived.
  - `not-yours` — `student` sends `SIGTERM` to a process of `ana`: "Operation not permitted", nothing changes; as `root` it goes through. From ch08 "Šire o temi", example derived.
- **Steps:** one per action: `book-primjer1` 3, `handler-cleans` 2, `stubborn` 3, `nohup-and-hangup` 4, `not-yours` 2.
- **Legend:** process alive (solid card) / ended (struck), disposition cell default (plain) / ignore (slashed circle) / catch (hook icon), signal envelope (named), refused (× with reason), leftover file (warning badge). "Changed" marks the process cards and files affected by this step.
- **Captions:**
  - HR: „`SIGTERM` je stigao, ali program za njega ima vlastiti postupak i odlučio je ne završiti. Tek `SIGKILL`, koji se ne može uhvatiti, prekida ga — i za sobom ostavlja bravu.“
  - EN: "`SIGTERM` arrived, but the program has its own handler for it and chose not to exit. Only `SIGKILL`, which cannot be caught, ends it — and leaves the lock file behind."
- **Terms:** signal — signal; default action — zadana radnja; signal handler — funkcija za hvatanje signala (ch08); ignore — zanemariti; job — posao u ljusci; process ID — PID; parent process — roditeljski proces; exit status — izlazni status.
- **Misconceptions:** `kill` means "kill" (it sends `SIGTERM` by default); `kill -9` is the normal way (it skips cleanup); `&` protects a job from closing the terminal.
- **Out of scope:** `SIGSTOP`/`SIGCONT` and `fg`/`bg` (named), real-time signals, signal masks, processes in uninterruptible sleep (`D`), shell `trap` (`lnx-subshell-trap`).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-signals` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-signals sims/lnx-signals` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-signals/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
