# lnx-job-control: Job control

| | |
|---|---|
| Task | `lnx-job-control` (wave 3, Linux) |
| Catalogue entry | `lnx-job-control` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-job-control/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `processes` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-signals` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **fg/bg, Ctrl-Z, process groups, what dies on logout**.

The student: drive jobs from a shell.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-signals/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/08-procesi.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-08/`
- UL ch08 section "Signali i upravljanje poslovima" → "Što treba znati" (definicija posao u ljusci, `jobs`, `%1`) and "Šire o temi" (`fg`, `bg`, `wait`, `nohup`); "Primjer 1 — posao koji treba prekinuti" (PIDs 38450/38423); "Primjer 3 — `nohup` i signal koji se unaprijed zanemaruje" (PID 38485). The chapter-08 diagrams (`lanac-roditelj-dijete.svg`, `kad-roditelj-zavrsi-prvi.svg`) are about the process tree and re-parenting, not job control.
- POSIX.1-2024 XBD §3.35 Background Job, §3.158 Foreground Job (as cited in UL ch08); XCU `fg`, `bg`, `nohup`
- GNU Bash Reference Manual §7.1 Job Control Basics, §7.2 Job Control Builtins (`disown`), §3.7.6 Signals (SIGHUP on exit, `huponexit`)
- Catalogue seed: UL ch08

## Model and presets

- **Scene:** left, a terminal pane where the typed commands and the shell's replies appear (`[1] 38450`, `[1]+  Stopped …`); a keyboard key strip under it (Ctrl-C, Ctrl-Z) and a "close window" button. Right, the process tree under the shell (`bash` PID 38423) with each job drawn as a **process-group box** around its processes; the foreground group carries a keyboard/terminal badge. Below, the shell's job table (`[n]`, `+`/`-`, Running/Stopped, command) next to the `ps` view (PID, PPID, STAT). Signals are arrows from the terminal or the shell to a group.
- **Reuse from `lnx-signals`:** the process model (PID, PPID, state S/T/Z, per-signal disposition default/ignore/handler, SIGKILL and SIGSTOP not catchable) and its signal-delivery step. New here: process groups, the terminal's foreground group, the job table, `fg`/`bg`, hangup on logout.
- **State:** `{ shell: { pid, login: bool, huponexit: bool, exitWarned: bool }, terminal: { open: bool, fgPgid }, procs: [{ pid, ppid, pgid, cmd, state: "R"|"S"|"T"|"gone", sighup: "default"|"ignore" }], jobs: [{ n, pgid, cmd, state, current: "+"|"-"|"" , disowned: bool }], out: [lines], nextPid, lastEvent }`. Starting PIDs follow UL ch08 Primjer 1 (shell 38423, first job 38450).
- **One step:** one user action (a typed command, a key, closing the window), then its consequences in order: (1) the terminal or shell sends the signal(s) to a process group; (2) each process applies its disposition; (3) the shell updates the job table and prints its notice; (4) the foreground group changes if the action moved one.
- **Rules:**
  1. `cmd &` starts a background job: the shell does not wait and prints the prompt; `jobs` lists it as `[1]+ Running`. The job number is the shell's, not a PID; `%1` and the PID name the same thing. Source: UL ch08 "Signali i upravljanje poslovima" (definicija posao u ljusci) and Primjer 1.
  2. Each job is one process group; all members of a pipeline are in the same group. Source: GNU Bash Reference Manual §7.1 Job Control Basics.
  3. Ctrl-C sends SIGINT and Ctrl-Z sends SIGTSTP to **every process in the terminal's foreground process group**, and to nothing else; background jobs do not see the keys. Source: Bash Reference Manual §7.1 (check: wording "the foreground process group").
  4. A stopped job shows state `T` and `Stopped`; `bg %n` continues it as a background job, `fg %n` moves a job to the foreground (sending SIGCONT if it was stopped) and the shell waits for it. Source: UL ch08 "Šire o temi" (`fg`, `bg`; STAT `T`); POSIX XCU `fg`, `bg`.
  5. A background job that tries to read from the terminal is sent SIGTTIN and stops. Source: Bash Reference Manual §7.1.
  6. Closing the terminal sends SIGHUP to the shell; an interactive bash then resends SIGHUP to all its jobs, running or stopped, and sends SIGCONT to stopped ones so they receive it. A job removed with `disown`, or a process started under `nohup` (SIGHUP set to ignore), survives and is re-parented. Source: Bash Reference Manual §3.7.6 Signals; UL ch08 Primjer 3 (`nohup` sets SIGHUP to ignore at start).
  7. Typing `exit` is not a hangup: with stopped jobs bash first warns `There are stopped jobs.` and refuses; a second `exit` straight after terminates them. Running background jobs survive `exit` unless the shell is a login shell with `huponexit` set. Source: Bash Reference Manual §7.1 and §3.7.6 (check against bash 5.2 on the lab VM).
  8. Tie-break: `%+` (current job) is the most recently stopped job, or if none is stopped, the most recently started background job; `%-` is the previous one. Source: Bash Reference Manual §7.1.
- **Params:** `preset` (select), `huponexit` (toggle, default off), `login` (toggle, default off: a terminal window's shell is not a login shell), `nohup` (toggle: start the preset's second job under `nohup`, default per preset).
- **Presets:**
  1. `primjer1` — `sleep 300 &` → `[1] 38450`; `jobs` → `[1]+ Running sleep 300 &`; `ps` shows PID 38450, PPID 38423, STAT S; `kill %1` (SIGTERM) → the process is gone. From UL ch08 Primjer 1.
  2. `ctrl-z` — `sleep 300` in the foreground; Ctrl-Z → `[1]+ Stopped`, STAT T; `bg` → Running in the background, prompt back; `fg` → foreground again; Ctrl-C → SIGINT, the job ends. Derived from rules 3–4, unchecked.
  3. `zatvori-prozor` — `sleep 300 &` and `nohup sleep 300 &` (PID 38485 as in Primjer 3); close the window → SIGHUP to both; the plain `sleep` ends, the `nohup` one keeps running with a new parent. Derived from UL ch08 Primjer 3 + rule 6, unchecked.
  4. `exit-ili-zatvori` — the same `sleep 300 &`, but the user types `exit`: the job survives (rule 7). Then with `huponexit` and `login` on, the same `exit` ends it. Derived, unchecked.
  5. `cjevovod` — `cat | grep x` in the foreground is one job with two processes in one group; Ctrl-Z stops both; `bg` → `cat` reads the terminal, gets SIGTTIN and stops again. Derived from rules 2, 3, 5, unchecked.
- **Steps:** primjer1 4, ctrl-z 5, zatvori-prozor 4, exit-ili-zatvori 4 (+2 with the toggles), cjevovod 4.
- **Legend:** process-group box; foreground badge; state shapes (running filled circle, sleeping hollow, stopped square, gone crossed); signal arrow labelled with its name; "changed" highlight = the processes the signal reached in this step and the job-table row that changed.
- **Captions:** hr: "Ctrl-Z ne šalje signal „programu“ nego cijeloj prednjoj grupi procesa: i `cat` i `grep` su obustavljeni (stanje `T`)." en: "Ctrl-Z does not signal 'the program' but the whole foreground process group: both `cat` and `grep` are stopped (state `T`)." hr: "Zatvoren je prozor: ljuska prosljeđuje `SIGHUP` svim poslovima. `sleep` pod `nohup`-om ga zanemaruje i radi dalje." en: "The window is closed: the shell passes `SIGHUP` on to every job. The `sleep` under `nohup` ignores it and keeps running."
- **Terms:** job — posao u ljusci; background job — pozadinski posao; foreground job — prednji posao; stopped (suspended) job — obustavljen posao; job control — upravljanje poslovima; process group — grupa procesa; signal — signal.
- **Misconceptions:** "the job number is the PID"; "`&` keeps a job alive after logout" (that is `nohup`/`disown`, UL ch08 Primjer 3); "Ctrl-C kills only the last command of a pipeline".
- **Out of scope:** writing signal handlers and `trap` (→ `lnx-signals`, `lnx-subshell-trap`), sessions and `setsid` beyond naming them, `screen`/`tmux`, systemd-logind `KillUserProcesses`, `wait`.
<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-job-control sims/lnx-job-control` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-job-control/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
